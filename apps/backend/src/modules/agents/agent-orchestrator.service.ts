// ============================================
// ContentPilot AI — Agent Orchestrator
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import {
  AGENT_DEFINITIONS,
  routeToAgent,
  shouldSearchInternet,
  buildRAGPrompt,
  detectPromptInjection,
  formatSearchResultsForContext,
  formatKnowledgeBaseForContext,
} from '@contentpilot/ai';
import type { AgentName } from '@contentpilot/shared';
import { OpenRouterService, ChatCompletionMessage } from './openrouter.service';
import { SearchOrchestratorService } from '../search/search-orchestrator.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { UsersService } from '../users/users.service';

export interface AgentExecutionInput {
  userId: string;
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  projectContext?: {
    industry?: string;
    brandVoice?: string;
    targetAudience?: string;
  };
  model?: string;
  imageUrls?: string[];
}

export interface AgentExecutionResult {
  content: string;
  agentName: AgentName;
  sources: Array<{ title: string; url: string; snippet: string; type: string }>;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private readonly openrouter: OpenRouterService,
    private readonly search: SearchOrchestratorService,
    private readonly knowledge: KnowledgeService,
    private readonly users: UsersService,
  ) {}

  /**
   * Execute the full agent pipeline:
   * 1. Detect prompt injection
   * 2. Route to appropriate agent
   * 3. Search knowledge base (RAG)
   * 4. Search internet (if needed)
   * 5. Build context-enriched prompt
   * 6. Call LLM via OpenRouter
   */
  async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const { userId, message, conversationHistory, projectContext, model, imageUrls } = input;

    // ── Step 1: Safety Check ─────────────────
    if (detectPromptInjection(message)) {
      this.logger.warn(`Prompt injection detected from user ${userId}`);
      return {
        content: 'I detected potentially unsafe content in your message. Please rephrase your request.',
        agentName: 'creative-strategist',
        sources: [],
        model: model || 'safety-filter',
        promptTokens: 0,
        completionTokens: 0,
      };
    }

    // ── Step 2: Route to Agent ───────────────
    const hasImage = (imageUrls?.length ?? 0) > 0;
    const agentName = routeToAgent(message, hasImage);
    const agentDef = AGENT_DEFINITIONS[agentName];

    this.logger.log(`Query routed to agent: ${agentDef.name}`);

    // ── Step 3: Knowledge Base Search ────────
    let knowledgeContext = '';
    const allSources: AgentExecutionResult['sources'] = [];

    if (agentDef.requiresKnowledgeBase) {
      try {
        const kbResults = await this.knowledge.searchSimilar(message);
        if (kbResults.length > 0) {
          knowledgeContext = formatKnowledgeBaseForContext(kbResults);
          kbResults.forEach(r => {
            allSources.push({
              title: r.documentTitle || 'Knowledge Base',
              url: '',
              snippet: r.content.substring(0, 200),
              type: 'knowledge_base',
            });
          });
        }
      } catch (error) {
        this.logger.warn(`Knowledge base search failed: ${error}`);
      }
    }

    // ── Step 4: Live Internet Search ─────────
    let searchContext = '';

    if (agentDef.requiresSearch && shouldSearchInternet(message)) {
      try {
        const searchResults = await this.search.search(message);
        if (searchResults.length > 0) {
          searchContext = formatSearchResultsForContext(searchResults);
          searchResults.forEach(r => {
            allSources.push({
              title: r.title,
              url: r.url,
              snippet: r.content.substring(0, 200),
              type: 'web_search',
            });
          });
        }
      } catch (error) {
        this.logger.warn(`Internet search failed: ${error}`);
      }
    }

    // ── Step 5: Build Messages ───────────────
    const messages = buildRAGPrompt({
      agentSystemPrompt: agentDef.systemPrompt,
      knowledgeContext,
      searchResults: searchContext,
      userIndustry: projectContext?.industry,
      brandVoice: projectContext?.brandVoice,
      conversationHistory,
    });

    // Add the current user message
    if (imageUrls && imageUrls.length > 0 && agentDef.supportsVision) {
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: message },
        ...imageUrls.map(url => ({ type: 'image_url', image_url: { url } })),
      ];
      messages.push({ role: 'user', content: content as any });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // ── Step 6: Get user's API key ───────────
    const userApiKey = await this.users.getApiKey(userId);

    // ── Step 7: Call LLM ─────────────────────
    // Use vision model for image-analyst when no explicit model provided,
    // otherwise use the user-requested model or fall back to default.
    const selectedModel = agentDef.name === 'image-analyst' && !model
      ? 'openai/gpt-4o-mini'
      : (model || 'openai/gpt-4o-mini');

    const response = await this.openrouter.chatCompletion({
      model: selectedModel,
      messages: messages as ChatCompletionMessage[],
      temperature: agentDef.temperature,
      apiKey: userApiKey || undefined,
    });

    return {
      content: response.content,
      agentName,
      sources: allSources,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
    };
  }

  /**
   * Stream execution with the same pipeline but streaming output.
   */
  async *executeStream(input: AgentExecutionInput): AsyncGenerator<{
    type: 'agent' | 'text' | 'sources' | 'done';
    content?: string;
    agentName?: AgentName;
    sources?: AgentExecutionResult['sources'];
  }> {
    const { userId, message, conversationHistory, projectContext, model, imageUrls } = input;

    // Safety check
    if (detectPromptInjection(message)) {
      yield { type: 'text', content: 'I detected potentially unsafe content. Please rephrase your request.' };
      yield { type: 'done' };
      return;
    }

    // Route
    const hasImage = (imageUrls?.length ?? 0) > 0;
    const agentName = routeToAgent(message, hasImage);
    const agentDef = AGENT_DEFINITIONS[agentName];

    yield { type: 'agent', agentName };

    // Knowledge + Search (parallel)
    const allSources: AgentExecutionResult['sources'] = [];
    let knowledgeContext = '';
    let searchContext = '';

    const [kbResult, searchResult] = await Promise.allSettled([
      agentDef.requiresKnowledgeBase ? this.knowledge.searchSimilar(message) : Promise.resolve([]),
      agentDef.requiresSearch && shouldSearchInternet(message) ? this.search.search(message) : Promise.resolve([]),
    ]);

    if (kbResult.status === 'fulfilled' && kbResult.value.length > 0) {
      knowledgeContext = formatKnowledgeBaseForContext(kbResult.value);
      kbResult.value.forEach(r => {
        allSources.push({
          title: r.documentTitle || 'Knowledge Base',
          url: '',
          snippet: r.content.substring(0, 200),
          type: 'knowledge_base',
        });
      });
    }

    if (searchResult.status === 'fulfilled' && searchResult.value.length > 0) {
      searchContext = formatSearchResultsForContext(searchResult.value);
      searchResult.value.forEach((r: any) => {
        allSources.push({
          title: r.title,
          url: r.url,
          snippet: r.content.substring(0, 200),
          type: 'web_search',
        });
      });
    }

    if (allSources.length > 0) {
      yield { type: 'sources', sources: allSources };
    }

    // Build messages
    const messages = buildRAGPrompt({
      agentSystemPrompt: agentDef.systemPrompt,
      knowledgeContext,
      searchResults: searchContext,
      userIndustry: projectContext?.industry,
      brandVoice: projectContext?.brandVoice,
      conversationHistory,
    });
    messages.push({ role: 'user', content: message });

    // Get user API key
    const userApiKey = await this.users.getApiKey(userId);

    // Stream LLM response
    const stream = this.openrouter.streamChatCompletion({
      model,
      messages: messages as ChatCompletionMessage[],
      temperature: agentDef.temperature,
      apiKey: userApiKey || undefined,
    });

    for await (const chunk of stream) {
      yield { type: 'text', content: chunk };
    }

    yield { type: 'done' };
  }
}
