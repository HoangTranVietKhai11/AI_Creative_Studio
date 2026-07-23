/*
  Warnings:

  - You are about to drop the column `embedding` on the `embeddings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "embeddings_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "embeddings" DROP COLUMN "embedding";
