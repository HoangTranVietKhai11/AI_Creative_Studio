import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { UsersModule } from '../users/users.module';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { OpenRouterService } from './openrouter.service';

@Module({
  imports: [SearchModule, KnowledgeModule, UsersModule],
  providers: [AgentOrchestratorService, OpenRouterService],
  exports: [AgentOrchestratorService, OpenRouterService],
})
export class AgentsModule {}
