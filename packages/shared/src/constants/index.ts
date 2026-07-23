// ============================================
// ContentPilot AI — Shared Constants
// ============================================

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    GOOGLE: '/api/auth/google',
    GITHUB: '/api/auth/github',
    ME: '/api/auth/me',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    API_KEY: '/api/users/api-key',
  },
  PROJECTS: {
    BASE: '/api/projects',
    BY_ID: (id: string) => `/api/projects/${id}`,
  },
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations',
    CONVERSATION: (id: string) => `/api/chat/conversations/${id}`,
    SEND: '/api/chat/send',
    STREAM: '/api/chat/stream',
  },
  KNOWLEDGE: {
    DOCUMENTS: '/api/knowledge/documents',
    DOCUMENT: (id: string) => `/api/knowledge/documents/${id}`,
    UPLOAD: '/api/knowledge/upload',
    SCRAPE: '/api/knowledge/scrape',
    SEARCH: '/api/knowledge/search',
  },
  MEDIA: {
    UPLOAD: '/api/media/upload',
    ITEMS: '/api/media',
    ITEM: (id: string) => `/api/media/${id}`,
    ANALYZE: (id: string) => `/api/media/${id}/analyze`,
  },
  BILLING: {
    SUBSCRIPTION: '/api/billing/subscription',
    CHECKOUT: '/api/billing/checkout',
    PORTAL: '/api/billing/portal',
    WEBHOOK: '/api/billing/webhook',
  },
  PROMPTS: {
    BASE: '/api/prompts',
    BY_ID: (id: string) => `/api/prompts/${id}`,
  },
} as const;

// ──────────────────────────────────────────────
// OpenRouter Models
// ──────────────────────────────────────────────

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  supportsVision: boolean;
  tier: ('FREE' | 'PRO' | 'AGENCY')[];
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Best balance of intelligence and speed',
    contextWindow: 200000,
    supportsVision: true,
    tier: ['FREE', 'PRO', 'AGENCY'],
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
    contextWindow: 200000,
    supportsVision: true,
    tier: ['PRO', 'AGENCY'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Fast and capable multimodal model',
    contextWindow: 128000,
    supportsVision: true,
    tier: ['PRO', 'AGENCY'],
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Cost-effective for simpler tasks',
    contextWindow: 128000,
    supportsVision: true,
    tier: ['FREE', 'PRO', 'AGENCY'],
  },
  {
    id: 'openai/o3',
    name: 'o3',
    provider: 'OpenAI',
    description: 'Advanced reasoning model',
    contextWindow: 200000,
    supportsVision: true,
    tier: ['AGENCY'],
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Google\'s most advanced model',
    contextWindow: 1000000,
    supportsVision: true,
    tier: ['PRO', 'AGENCY'],
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'High-quality open-source model',
    contextWindow: 128000,
    supportsVision: false,
    tier: ['PRO', 'AGENCY'],
  },
  {
    id: 'qwen/qwen3-235b-a22b',
    name: 'Qwen 3 235B',
    provider: 'Qwen',
    description: 'Powerful multilingual model',
    contextWindow: 128000,
    supportsVision: false,
    tier: ['AGENCY'],
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'European frontier model',
    contextWindow: 128000,
    supportsVision: true,
    tier: ['AGENCY'],
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    description: 'Meta\'s open-source flagship',
    contextWindow: 1000000,
    supportsVision: true,
    tier: ['AGENCY'],
  },
];

// ──────────────────────────────────────────────
// Auto-Crawl Sources
// ──────────────────────────────────────────────

export const AUTO_CRAWL_SOURCES = [
  { name: 'TikTok Creative Center', url: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en' },
  { name: 'Meta Business', url: 'https://www.facebook.com/business/news' },
  { name: 'Google Think', url: 'https://www.thinkwithgoogle.com/' },
  { name: 'HubSpot Blog', url: 'https://blog.hubspot.com/marketing' },
  { name: 'Later Blog', url: 'https://later.com/blog/' },
  { name: 'Hootsuite Blog', url: 'https://blog.hootsuite.com/' },
  { name: 'Canva Blog', url: 'https://www.canva.com/designschool/' },
  { name: 'Adobe Blog', url: 'https://blog.adobe.com/' },
  { name: 'CapCut Tips', url: 'https://www.capcut.com/resource' },
  { name: 'Buffer Blog', url: 'https://buffer.com/resources/' },
  { name: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/' },
  { name: 'Content Marketing Institute', url: 'https://contentmarketinginstitute.com/articles/' },
] as const;

// ──────────────────────────────────────────────
// File Constraints
// ──────────────────────────────────────────────

export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE_MB: 50,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_DOC_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
  ],
} as const;

// ──────────────────────────────────────────────
// Embedding Constants
// ──────────────────────────────────────────────

export const EMBEDDING_CONFIG = {
  DIMENSIONS: 1536,
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 50,
  MAX_CHUNKS_PER_DOCUMENT: 500,
  SIMILARITY_THRESHOLD: 0.7,
  MAX_RESULTS: 10,
} as const;

// ──────────────────────────────────────────────
// Queue Names
// ──────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMBEDDING: 'embedding',
  CRAWL: 'crawl',
  MEDIA_ANALYSIS: 'media-analysis',
  TREND_UPDATE: 'trend-update',
} as const;

// ──────────────────────────────────────────────
// Cache TTLs (in seconds)
// ──────────────────────────────────────────────

export const CACHE_TTL = {
  SEARCH_RESULTS: 3600,       // 1 hour
  TREND_DATA: 43200,          // 12 hours
  USER_SESSION: 900,          // 15 minutes
  MODEL_LIST: 86400,          // 24 hours
  CONVERSATION_CONTEXT: 1800, // 30 minutes
} as const;
