-- ============================================
-- ContentPilot AI — Initial Migration
-- ============================================
-- Enables pgvector and adds the vector column
-- + HNSW index that Prisma cannot manage natively
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


