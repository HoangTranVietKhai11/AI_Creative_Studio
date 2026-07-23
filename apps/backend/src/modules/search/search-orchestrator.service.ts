// ============================================
// ContentPilot AI — Search Orchestrator
// ============================================
// Combines Tavily + Brave Search with dedup and ranking

import { Injectable, Logger } from '@nestjs/common';
import { TavilyService, TavilySearchResult } from './tavily.service';
import { BraveSearchService } from './brave-search.service';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  provider: string;
}

@Injectable()
export class SearchOrchestratorService {
  private readonly logger = new Logger(SearchOrchestratorService.name);

  constructor(
    private readonly tavily: TavilyService,
    private readonly brave: BraveSearchService,
  ) {}

  /**
   * Search using the best available provider.
   * Priority: Tavily → Brave → empty
   */
  async search(query: string, maxResults = 5): Promise<SearchResult[]> {
    // Try Tavily first (optimized for AI/RAG)
    if (this.tavily.isConfigured) {
      const results = await this.tavily.search(query, maxResults);
      if (results.length > 0) {
        return results.map(r => ({ ...r, provider: 'tavily' }));
      }
    }

    // Fallback to Brave Search
    if (this.brave.isConfigured) {
      const results = await this.brave.search(query, maxResults);
      if (results.length > 0) {
        return results.map(r => ({ ...r, provider: 'brave' }));
      }
    }

    this.logger.warn('No search providers configured or all searches failed');
    return [];
  }

  /**
   * Search using ALL configured providers in parallel for comprehensive results.
   */
  async searchAll(query: string, maxResults = 5): Promise<SearchResult[]> {
    const promises: Promise<SearchResult[]>[] = [];

    if (this.tavily.isConfigured) {
      promises.push(
        this.tavily.search(query, maxResults).then(r =>
          r.map(item => ({ ...item, provider: 'tavily' })),
        ),
      );
    }

    if (this.brave.isConfigured) {
      promises.push(
        this.brave.search(query, maxResults).then(r =>
          r.map(item => ({ ...item, provider: 'brave' })),
        ),
      );
    }

    const results = await Promise.allSettled(promises);
    const allResults: SearchResult[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allResults.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Sort by score descending
    deduped.sort((a, b) => b.score - a.score);

    return deduped.slice(0, maxResults);
  }
}
