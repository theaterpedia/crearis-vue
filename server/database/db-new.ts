import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { DatabaseAdapter } from './adapter'
import { SQLiteAdapter } from './adapters/sqlite'
import { dbConfig } from './config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lazy-load PostgreSQL adapter to avoid requiring pg when not needed
async function loadPostgreSQLAdapter(): Promise<typeof import('./adapters/postgresql')> {
  return await import('./adapters/postgresql')
}

// Initialize database adapter based on configuration
let dbAdapter: DatabaseAdapter

if (dbConfig.type === 'sqlite') {
  // ⚠️ SQLite is deprecated since Migration 019 - will throw error
  const dbPath = dbConfig.sqlite?.path || join(__dirname, '../../demo-data.db')
  console.error('\n⚠️  WARNING: Attempting to use deprecated SQLite adapter')
  console.error(`    Database path: ${dbPath}`)
  console.error('    This will fail - PostgreSQL is required for Migration 019+\n')

  // This will throw an error and stop execution
  dbAdapter = new SQLiteAdapter(dbPath)
  console.log(`✅ Connected to SQLite database at: ${dbPath}`)
} else if (dbConfig.type === 'postgresql') {
  const { PostgreSQLAdapter } = await loadPostgreSQLAdapter()
  dbAdapter = new PostgreSQLAdapter(dbConfig.postgresql!.connectionString)
  console.log('✅ Connected to PostgreSQL database')
} else {
  throw new Error(`Unsupported database type: ${dbConfig.type}`)
}

/**
 * Unified Database Interface
 * Provides consistent API regardless of underlying database
 * 
 * DEFAULT: PostgreSQL (set via DATABASE_TYPE env var or config.ts default)
 * FALLBACK: SQLite (only if explicitly configured)
 * 
 * The adapter provides a unified API:
 * - db.get(sql, params) - returns single row or undefined
 * - db.all(sql, params) - returns array of rows
 * - db.run(sql, params) - executes query, returns result with rowCount/changes
 * - db.exec(sql) - executes raw SQL (migrations)
 * - db.prepare(sql) - returns prepared statement
 * 
 * Note: Schema creation is now handled by the migration system.
 * See server/database/migrations/ for all schema definitions.
 */
export const db = dbAdapter
export default db
