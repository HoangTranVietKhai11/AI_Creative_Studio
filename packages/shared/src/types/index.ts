// ============================================
// ContentPilot AI — Shared Types
// ============================================

// ──────────────────────────────────────────────
// User & Auth Types
// ──────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'GITHUB';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  provider: AuthProvider;
  preferredModel: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ──────────────────────────────────────────────
// Subscription Types
// ──────────────────────────────────────────────

export type SubscriptionPlan = 'FREE' | 'PRO' | 'AGENCY';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INACTIVE';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  messagesUsed: number;
  messagesLimit: number;
  documentsUsed: number;
  documentsLimit: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { messages: number; documents: number; models: string[] }> = {
  FREE: {
    messages: 50,
    documents: 5,
    models: ['anthropic/claude-sonnet-4', 'openai/gpt-4o-mini'],
  },
  PRO: {
    messages: 2000,
    documents: 100,
    models: [
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-2.5-pro',
      'deepseek/deepseek-chat',
    ],
  },
  AGENCY: {
    messages: 10000,
    documents: 1000,
    models: [
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'openai/gpt-4o',
      'openai/o3',
      'google/gemini-2.5-pro',
      'deepseek/deepseek-chat',
      'qwen/qwen3-235b-a22b',
      'mistralai/mistral-large',
      'meta-llama/llama-4-maverick',
    ],
  },
};

// ──────────────────────────────────────────────
// Project Types
// ──────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  niche: string | null;
  brandVoice: string | null;
  targetAudience: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  industry?: string;
  niche?: string;
  brandVoice?: string;
  targetAudience?: string;
}

// ──────────────────────────────────────────────
// Chat & Conversation Types
// ──────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  projectId: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentName: string | null;
  sources: ChatSource[];
  metadata: Record<string, unknown>;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string;
}

export interface ChatSource {
  title: string;
  url: string;
  snippet: string;
  type: 'web_search' | 'knowledge_base' | 'crawl';
}

export interface SendMessageRequest {
  conversationId?: string;
  message: string;
  projectId?: string;
  model?: string;
  attachments?: string[]; // media IDs
}

export interface StreamChunk {
  type: 'text' | 'source' | 'agent' | 'done' | 'error';
  content: string;
  agentName?: string;
  sources?: ChatSource[];
}

// ──────────────────────────────────────────────
// Knowledge Base Types
// ──────────────────────────────────────────────

export type DocumentType = 'PDF' | 'DOCX' | 'TXT' | 'MARKDOWN' | 'CSV' | 'URL';
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  fileSize: number | null;
  chunkCount: number;
  errorMsg: string | null;
  createdAt: string;
}

export interface UploadDocumentRequest {
  title: string;
  type: DocumentType;
  sourceUrl?: string;
}

// ──────────────────────────────────────────────
// Media Types
// ──────────────────────────────────────────────

export type MediaType = 'IMAGE' | 'VIDEO';
export type MediaAnalysisStatus = 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface UploadedMedia {
  id: string;
  type: MediaType;
  filename: string;
  mimeType: string;
  fileSize: number;
  thumbnailPath: string | null;
  analysisStatus: MediaAnalysisStatus;
  analysisResult: ImageAnalysis | VideoAnalysis | null;
  createdAt: string;
}

export interface ImageAnalysis {
  composition: string;
  lighting: string;
  background: string;
  colorPalette: string[];
  brandConsistency: string;
  visualHierarchy: string;
  suggestions: string[];
  overallScore: number;
}

export interface VideoAnalysis {
  hook: string;
  hookScore: number;
  retention: string;
  cameraMovement: string;
  editing: string;
  sceneTransitions: string;
  cta: string;
  pacing: string;
  suggestions: string[];
  overallScore: number;
}

// ──────────────────────────────────────────────
// Agent Types
// ──────────────────────────────────────────────

export type AgentName =
  | 'content-planner'
  | 'trend-researcher'
  | 'script-writer'
  | 'seo-agent'
  | 'marketing-agent'
  | 'video-director'
  | 'product-photographer'
  | 'image-analyst'
  | 'competitor-analyst'
  | 'creative-strategist';

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  description: string;
  icon: string;
  color: string;
}

export const AGENT_REGISTRY: AgentConfig[] = [
  {
    name: 'content-planner',
    displayName: 'Content Planner',
    description: 'Content calendars, strategy, and ideation',
    icon: '📋',
    color: '#6366F1',
  },
  {
    name: 'trend-researcher',
    displayName: 'Trend Researcher',
    description: 'Real-time trends, viral analysis, and hashtags',
    icon: '📈',
    color: '#EC4899',
  },
  {
    name: 'script-writer',
    displayName: 'Script Writer',
    description: 'Video scripts, ad copy, and captions',
    icon: '✍️',
    color: '#F59E0B',
  },
  {
    name: 'seo-agent',
    displayName: 'SEO Specialist',
    description: 'SEO optimization, keywords, and meta tags',
    icon: '🔍',
    color: '#10B981',
  },
  {
    name: 'marketing-agent',
    displayName: 'Marketing Expert',
    description: 'Ad campaigns, funnels, and email marketing',
    icon: '📣',
    color: '#EF4444',
  },
  {
    name: 'video-director',
    displayName: 'Video Director',
    description: 'Shot lists, storyboards, camera angles, lighting',
    icon: '🎬',
    color: '#8B5CF6',
  },
  {
    name: 'product-photographer',
    displayName: 'Product Photographer',
    description: 'Product photo guidance, composition, styling',
    icon: '📸',
    color: '#06B6D4',
  },
  {
    name: 'image-analyst',
    displayName: 'Image Analyst',
    description: 'Image analysis, visual hierarchy, and branding',
    icon: '🖼️',
    color: '#D946EF',
  },
  {
    name: 'competitor-analyst',
    displayName: 'Competitor Analyst',
    description: 'Competitor research and viral analysis',
    icon: '🕵️',
    color: '#F97316',
  },
  {
    name: 'creative-strategist',
    displayName: 'Creative Strategist',
    description: 'Brand strategy and creative direction',
    icon: '💡',
    color: '#14B8A6',
  },
];

// ──────────────────────────────────────────────
// Industry Constants
// ──────────────────────────────────────────────

export const INDUSTRIES = [
  'Beauty',
  'Makeup',
  'Jewelry',
  'Fashion',
  'Food',
  'Technology',
  'Education',
  'Healthcare',
  'Real Estate',
  'Automotive',
  'Tourism',
  'Entertainment',
  'Fitness',
  'Finance',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
