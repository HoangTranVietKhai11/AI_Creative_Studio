// ============================================
// ContentPilot AI — Tavily Search Service
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

@Injectable()
export class TavilyService {
  private readonly logger = new Logger(TavilyService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('TAVILY_API_KEY', '');
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, maxResults = 5): Promise<TavilySearchResult[]> {
    if (!this.apiKey) {
      this.logger.warn('Tavily API key not configured');
      return [];
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'advanced',
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Tavily search failed: ${response.status}`);
        return [];
      }

      const data: any = await response.json();

      return (data.results || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        score: r.score || 0,
      }));
    } catch (error) {
      this.logger.error(`Tavily search error: ${error}`);
      return [];
    }
  }
}
