// ============================================
// ContentPilot AI — OpenRouter Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  apiKey?: string; // User's own API key (optional)
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly baseUrl: string;
  private readonly defaultApiKey: string;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.defaultApiKey = config.get<string>('OPENROUTER_API_KEY', '');
    this.defaultModel = config.get<string>('OPENROUTER_DEFAULT_MODEL', 'openai/gpt-4o-mini');
  }

  /**
   * Send a chat completion request to OpenRouter.
   * Supports user-provided API keys for BYOK (Bring Your Own Key).
   */
  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const {
      model = this.defaultModel,
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      apiKey,
    } = options;

    const activeApiKey = apiKey || this.defaultApiKey;
    if (!activeApiKey) {
      throw new Error('No OpenRouter API key configured. Set OPENROUTER_API_KEY or provide a user key.');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeApiKey}`,
        'HTTP-Referer': this.config.get<string>('APP_URL', 'http://localhost:3000'),
        'X-Title': 'ContentPilot AI',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenRouter error (${response.status}): ${error}`);
      throw new Error(`AI provider error: ${response.status} — ${error}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || model,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      finishReason: choice?.finish_reason || 'stop',
    };
  }

  /**
   * Stream a chat completion response using SSE.
   * Returns an async generator of text chunks.
   */
  async *streamChatCompletion(options: ChatCompletionOptions): AsyncGenerator<string> {
    const {
      model = this.defaultModel,
      messages,
      temperature = 0.7,
      maxTokens = 2048,
      apiKey,
    } = options;

    const activeApiKey = apiKey || this.defaultApiKey;
    if (!activeApiKey) {
      throw new Error('No OpenRouter API key configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeApiKey}`,
        'HTTP-Referer': this.config.get<string>('APP_URL', 'http://localhost:3000'),
        'X-Title': 'ContentPilot AI',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI provider error: ${response.status} — ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate embeddings for text using OpenRouter.
   */
  async generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    const activeApiKey = apiKey || this.defaultApiKey;
    const embeddingModel = this.config.get<string>('OPENROUTER_EMBEDDING_MODEL', 'openai/text-embedding-3-small');

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeApiKey}`,
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding error: ${response.status} — ${error}`);
    }

    const data: any = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  /**
   * Generate embeddings in batch for efficiency.
   */
  async generateEmbeddings(texts: string[], apiKey?: string): Promise<number[][]> {
    const activeApiKey = apiKey || this.defaultApiKey;
    const embeddingModel = this.config.get<string>('OPENROUTER_EMBEDDING_MODEL', 'openai/text-embedding-3-small');

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeApiKey}`,
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch embedding error: ${response.status} — ${error}`);
    }

    const data: any = await response.json();
    return (data.data || [])
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding);
  }
}
