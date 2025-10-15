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
 */
export const db = dbAdapter

/**
 * Initialize database schema
 * Creates all tables with the current state (no migrations needed)
 */
export async function initDatabase() {
  // Determine SQL dialect
  const isPostgres = db.type === 'postgresql'

  // Helper to convert SQLite types to PostgreSQL
  const TEXT = isPostgres ? 'TEXT' : 'TEXT'
  const INTEGER = isPostgres ? 'INTEGER' : 'INTEGER'
  const TIMESTAMP = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : "TEXT DEFAULT (datetime('now'))"
  const CHECK_STATUS = isPostgres
    ? "CHECK(status IN ('active', 'archived', 'deleted'))"
    : "CHECK(status IN ('active', 'archived', 'deleted'))"

  // Events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      date_begin ${TEXT},
      date_end ${TEXT},
      address_id ${TEXT},
      user_id ${TEXT},
      seats_max ${INTEGER},
      cimg ${TEXT},
      header_type ${TEXT},
      rectitle ${TEXT},
      teaser ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)

  // Posts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      subtitle ${TEXT},
      teaser ${TEXT},
      author_id ${TEXT},
      blog_id ${TEXT},
      tag_ids ${TEXT},
      website_published ${TEXT},
      is_published ${TEXT},
      post_date ${TEXT},
      cover_properties ${TEXT},
      event_id ${TEXT},
      cimg ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)

  // Locations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      phone ${TEXT},
      email ${TEXT},
      city ${TEXT},
      zip ${TEXT},
      street ${TEXT},
      country_id ${TEXT},
      is_company ${TEXT},
      category_id ${TEXT},
      cimg ${TEXT},
      header_type ${TEXT},
      header_size ${TEXT},
      md ${TEXT},
      is_location_provider ${TEXT},
      event_id ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)

  // Instructors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS instructors (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      email ${TEXT},
      phone ${TEXT},
      city ${TEXT},
      country_id ${TEXT},
      cimg ${TEXT},
      description ${TEXT},
      event_id ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)

  // Participants table (combined children, teens, adults)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id ${TEXT} PRIMARY KEY,
      name ${TEXT} NOT NULL,
      age ${INTEGER},
      city ${TEXT},
      country_id ${TEXT},
      cimg ${TEXT},
      description ${TEXT},
      event_id ${TEXT},
      type ${TEXT},
      version_id ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      status ${TEXT} DEFAULT 'active' ${CHECK_STATUS}
    )
  `)

  // Hero overrides table (for non-event heroes)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hero_overrides (
      id ${TEXT} PRIMARY KEY,
      cimg ${TEXT},
      heading ${TEXT},
      description ${TEXT},
      event_ids ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)

  // Users table (for authentication)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${TEXT} PRIMARY KEY,
      username ${TEXT} UNIQUE NOT NULL,
      password ${TEXT} NOT NULL,
      role ${TEXT} NOT NULL ${isPostgres ? "CHECK(role IN ('user', 'admin'))" : "CHECK(role IN ('user', 'admin'))"},
      created_at ${TIMESTAMP}
    )
  `)

  // Tasks table (Stage 2 schema with category)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id ${TEXT} PRIMARY KEY,
      title ${TEXT} NOT NULL,
      description ${TEXT},
      status ${TEXT} DEFAULT 'idea' ${isPostgres
      ? "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash'))"
      : "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash'))"},
      category ${TEXT} DEFAULT 'project' ${isPostgres
      ? "CHECK(category IN ('project', 'base', 'admin'))"
      : "CHECK(category IN ('project', 'base', 'admin'))"},
      priority ${TEXT} DEFAULT 'medium' ${isPostgres
      ? "CHECK(priority IN ('low', 'medium', 'high', 'urgent'))"
      : "CHECK(priority IN ('low', 'medium', 'high', 'urgent'))"},
      record_type ${TEXT},
      record_id ${TEXT},
      assigned_to ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT},
      due_date ${TEXT},
      completed_at ${TEXT},
      version_id ${TEXT}
    )
  `)

  // Versions table for data snapshots
  await db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id ${TEXT} PRIMARY KEY,
      version_number ${TEXT} NOT NULL UNIQUE,
      name ${TEXT} NOT NULL,
      description ${TEXT},
      created_at ${TIMESTAMP},
      created_by ${TEXT},
      is_active ${INTEGER} DEFAULT 0,
      snapshot_data ${TEXT},
      csv_exported ${INTEGER} DEFAULT 0,
      notes ${TEXT}
    )
  `)

  // Version history for tracking changes to records
  await db.exec(`
    CREATE TABLE IF NOT EXISTS record_versions (
      id ${TEXT} PRIMARY KEY,
      version_id ${TEXT} NOT NULL,
      record_type ${TEXT} NOT NULL,
      record_id ${TEXT} NOT NULL,
      data ${TEXT} NOT NULL,
      created_at ${TIMESTAMP}
    )
  `)

  // Projects table (also serves as user accounts)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id ${TEXT} PRIMARY KEY,
      username ${TEXT} UNIQUE NOT NULL,
      password_hash ${TEXT} NOT NULL,
      role ${TEXT} NOT NULL ${isPostgres
      ? "CHECK(role IN ('admin', 'base', 'project'))"
      : "CHECK(role IN ('admin', 'base', 'project'))"},
      name ${TEXT},
      description ${TEXT},
      status ${TEXT} DEFAULT 'draft' ${isPostgres
      ? "CHECK(status IN ('draft', 'active', 'archived'))"
      : "CHECK(status IN ('draft', 'active', 'archived'))"},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)

  // Releases table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      id ${TEXT} PRIMARY KEY,
      version ${TEXT} NOT NULL UNIQUE,
      version_major ${INTEGER} NOT NULL,
      version_minor ${INTEGER} NOT NULL,
      description ${TEXT},
      state ${TEXT} DEFAULT 'idea' ${isPostgres
      ? "CHECK(state IN ('idea', 'draft', 'final', 'trash'))"
      : "CHECK(state IN ('idea', 'draft', 'final', 'trash'))"},
      release_date ${TEXT},
      created_at ${TIMESTAMP},
      updated_at ${TEXT}
    )
  `)

  // Create indexes for performance (only for non-unique indexes)
  if (isPostgres) {
    // PostgreSQL syntax for IF NOT EXISTS on CREATE INDEX
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
      CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
      CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
    `)
  } else {
    // SQLite syntax
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
      CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
      CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
    `)
  }

  // Create triggers for timestamp updates (SQLite only - PostgreSQL uses different approach)
  if (!isPostgres) {
    const tables = ['events', 'posts', 'locations', 'instructors', 'participants', 'tasks']

    for (const table of tables) {
      await db.exec(`
        CREATE TRIGGER IF NOT EXISTS ${table}_updated_at_trigger
        AFTER UPDATE ON ${table}
        BEGIN
          UPDATE ${table} SET updated_at = datetime('now') WHERE id = NEW.id;
        END;
      `)
    }
  } else {
    // For PostgreSQL, we'll use a function and trigger
    await db.exec(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    const tables = ['events', 'posts', 'locations', 'instructors', 'participants', 'tasks']
    for (const table of tables) {
      await db.exec(`
        DROP TRIGGER IF EXISTS ${table}_updated_at_trigger ON ${table};
        CREATE TRIGGER ${table}_updated_at_trigger
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
    }
  }

  console.log(`✅ Database tables initialized successfully (${db.type})`)
}

// Initialize on module load
await initDatabase()

export default db
