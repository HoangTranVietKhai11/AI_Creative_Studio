import { Module } from '@nestjs/common';
import { SearchOrchestratorService } from './search-orchestrator.service';
import { TavilyService } from './tavily.service';
import { BraveSearchService } from './brave-search.service';

@Module({
  providers: [SearchOrchestratorService, TavilyService, BraveSearchService],
  exports: [SearchOrchestratorService],
})
export class SearchModule {}
