// ============================================
// ContentPilot AI — Shared Validators (Zod)
// ============================================

import { z } from 'zod';

// ──────────────────────────────────────────────
// Auth Validators
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

// ──────────────────────────────────────────────
// Project Validators
// ──────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  niche: z.string().max(100).optional(),
  brandVoice: z.string().max(5000).optional(),
  targetAudience: z.string().max(2000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ──────────────────────────────────────────────
// Chat Validators
// ──────────────────────────────────────────────

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000),
  projectId: z.string().uuid().optional(),
  model: z.string().max(100).optional(),
  attachments: z.array(z.string().uuid()).max(5).optional(),
});

// ──────────────────────────────────────────────
// Knowledge Base Validators
// ──────────────────────────────────────────────

export const uploadDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(['PDF', 'DOCX', 'TXT', 'MARKDOWN', 'CSV', 'URL']),
  sourceUrl: z.string().url().optional(),
});

export const scrapeUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
  title: z.string().min(1).max(500).optional(),
});

// ──────────────────────────────────────────────
// Pagination Validators
// ──────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ──────────────────────────────────────────────
// Settings Validators
// ──────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  preferredModel: z.string().max(100).optional(),
});

export const updateApiKeySchema = z.object({
  apiKey: z.string().min(10, 'API key is too short').max(500),
});

// ──────────────────────────────────────────────
// Prompt Validators
// ──────────────────────────────────────────────

export const savedPromptSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// Export inferred types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SavedPromptInput = z.infer<typeof savedPromptSchema>;
