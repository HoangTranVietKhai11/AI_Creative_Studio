// ============================================
// ContentPilot AI — Brave Search Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BraveSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

@Injectable()
export class BraveSearchService {
  private readonly logger = new Logger(BraveSearchService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('BRAVE_SEARCH_API_KEY', '');
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, maxResults = 5): Promise<BraveSearchResult[]> {
    if (!this.apiKey) {
      this.logger.warn('Brave Search API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        count: String(maxResults),
      });

      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        this.logger.error(`Brave search failed: ${response.status}`);
        return [];
      }

      const data: any = await response.json();

      return (data.web?.results || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.description || '',
        score: 0.8, // Brave doesn't provide relevance scores
      }));
    } catch (error) {
      this.logger.error(`Brave search error: ${error}`);
      return [];
    }
  }
}
