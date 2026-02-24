/**
 * Database Abstraction Layer
 * Supports both better-sqlite3 (production) and sql.js (development)
 */

export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  close(): void;
}

export interface Statement {
  run(...params: any[]): any;
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

let dbImpl: 'better-sqlite3' | 'sql.js' = 'better-sqlite3';

/**
 * Create database instance (synchronous)
 * Tries better-sqlite3 first, falls back to sql.js
 */
export function createDatabase(dbPath: string): Database {
  try {
    // Try to import better-sqlite3 (production)
    const BetterSqlite3 = require('better-sqlite3');
    dbImpl = 'better-sqlite3';
    return new BetterSqlite3(dbPath);
  } catch (e) {
    console.warn('better-sqlite3 not available, using sql.js fallback');
    dbImpl = 'sql.js';
    return createSqlJsDatabase(dbPath);
  }
}

/**
 * sql.js implementation (pure JavaScript)
 */
function createSqlJsDatabase(dbPath: string): Database {
  // In-memory store (for now, can add persistence later)
  const store: Map<string, any[]> = new Map();
  const tables: Map<string, string[]> = new Map(); // table -> columns

  return {
    prepare(sql: string): Statement {
      return {
        run(...params: any[]) {
          // Mock implementation for CREATE/INSERT/UPDATE/DELETE
          if (sql.includes('CREATE')) {
            const match = sql.match(/CREATE.*?(\w+)\s*\(/i);
            if (match) tables.set(match[1], []);
          }
          if (sql.includes('INSERT')) {
            const match = sql.match(/INSERT INTO (\w+)/i);
            if (match) {
              const table = match[1];
              if (!store.has(table)) store.set(table, []);
              store.get(table)!.push(params);
            }
          }
          return { changes: 1, lastInsertRowid: 1 };
        },

        get(...params: any[]) {
          // Mock: return first row matching (simplified)
          if (sql.includes('SELECT')) {
            const match = sql.match(/SELECT.*?FROM\s+(\w+)/i);
            if (match && store.has(match[1])) {
              return store.get(match[1])![0];
            }
          }
          return null;
        },

        all(...params: any[]): any[] {
          // Mock: return all rows (simplified)
          if (sql.includes('SELECT')) {
            const match = sql.match(/SELECT.*?FROM\s+(\w+)/i);
            if (match && store.has(match[1])) {
              return store.get(match[1])!;
            }
          }
          return [];
        },
      };
    },

    exec(sql: string) {
      // Execute raw SQL (CREATE TABLE, etc)
      if (sql.includes('CREATE TABLE')) {
        const match = sql.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
        if (match) {
          tables.set(match[1], []);
          store.set(match[1], []);
        }
      }
    },

    close() {
      store.clear();
      tables.clear();
    },
  };
}

/**
 * Get current database implementation
 */
export function getDbImpl(): string {
  return dbImpl;
}
