/**
 * Memory Indexer - Build FTS + semantic search index
 *
 * Indexes Markdown files from the workspace:
 * - MEMORY.md (core durable facts)
 * - memory/YYYY-MM-DD.md (daily logs)
 * - bank/entities/*.md (entity summaries)
 * - bank/opinions.md (confidence-bearing beliefs)
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

export interface IndexConfig {
  workspace: string;
  dbPath: string;
  embedProvider?: 'openai' | 'local' | 'gemini';
  chunkSize?: number; // tokens, default 400
  chunkOverlap?: number; // tokens, default 80
}

export interface IndexedChunk {
  id: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  text: string;
  embedding?: number[]; // Optional vector embedding
  score?: number; // Search score (BM25 or cosine)
}

export class MemoryIndexer {
  private db: Database.Database;
  private workspace: string;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: IndexConfig) {
    this.workspace = config.workspace;
    this.chunkSize = config.chunkSize || 400;
    this.chunkOverlap = config.chunkOverlap || 80;

    // TODO: Initialize SQLite with FTS5 + optional vec0 extension
    // this.db = new Database(config.dbPath);
    // this.initSchema();
  }

  /**
   * Index all memory files in workspace
   */
  async indexWorkspace(): Promise<number> {
    // TODO: Find and index:
    // - MEMORY.md
    // - memory/**/*.md
    // - bank/entities/*.md
    // - bank/opinions.md

    let chunksIndexed = 0;

    // const memoryMd = join(this.workspace, 'MEMORY.md');
    // if (existsSync(memoryMd)) {
    //   chunksIndexed += await this.indexFile(memoryMd);
    // }

    return chunksIndexed;
  }

  /**
   * Index a single Markdown file
   */
  async indexFile(filePath: string): Promise<number> {
    // TODO: Read file, split into chunks, embed, insert into DB

    return 0;
  }

  /**
   * Search indexed memory
   * @param query Natural language query
   * @param k Number of results to return
   * @param mode 'fts5' | 'semantic' | 'hybrid' (BM25 + vectors)
   */
  async search(query: string, k: number = 5, mode: 'fts5' | 'semantic' | 'hybrid' = 'hybrid'): Promise<IndexedChunk[]> {
    // TODO: Implement search:
    // - FTS5: lexical BM25 search (fast, good for IDs/names)
    // - Semantic: vector similarity (good for paraphrases)
    // - Hybrid: weighted combination of both

    return [];
  }

  /**
   * Rebuild index (useful after memory file changes)
   */
  async rebuild(): Promise<void> {
    // TODO: Drop and recreate FTS table, reindex all files
  }

  /**
   * Private: Split text into chunks with overlap
   */
  private chunkText(text: string, lineStart: number): Array<{ text: string; lineStart: number; lineEnd: number }> {
    // TODO: Split by tokens (or lines as proxy), maintaining overlap
    const lines = text.split('\n');
    const chunks: Array<{ text: string; lineStart: number; lineEnd: number }> = [];

    for (let i = 0; i < lines.length; i += Math.max(1, Math.floor(this.chunkSize * 0.8))) {
      const end = Math.min(i + this.chunkSize, lines.length);
      chunks.push({
        text: lines.slice(i, end).join('\n'),
        lineStart: lineStart + i,
        lineEnd: lineStart + end,
      });
    }

    return chunks;
  }

  /**
   * Private: Initialize database schema
   */
  private initSchema(): void {
    // TODO: Create FTS5 virtual table
    // CREATE VIRTUAL TABLE memory_fts USING fts5(content, file, line_start, line_end);

    // TODO: Optionally create vec0 table for vector storage
    // If available: CREATE VIRTUAL TABLE memory_vec USING vec0(
    //   embedding float[1536],
    //   content unindexed,
    // );
  }
}
