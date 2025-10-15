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
  const dbPath = dbConfig.sqlite?.path || join(__dirname, '../../demo-data.db')
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
 * Note: Schema creation is now handled by the migration system.
 * See server/database/migrations/ for all schema definitions.
 */
export const db = dbAdapter
export default db
