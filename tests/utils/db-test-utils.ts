/**
 * Database Test Utilities
 * 
 * Helper functions for database testing:
 * - Database initialization and cleanup
 * - Test data fixtures
 * - Database state assertions
 */

import type { DatabaseAdapter } from '../../server/database/adapter.js'
import { SQLiteAdapter } from '../../server/database/adapters/sqlite.js'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql.js'
import { testDbConfig, isPostgreSQLTest } from '../../server/database/test-config.js'
import { nanoid } from 'nanoid'

// Re-export for test files
export { isPostgreSQLTest }

// Track if schema has been initialized for PostgreSQL
let postgresSchemaInitialized = false

/**
 * Create a test database adapter
 */
export async function createTestDatabase(): Promise<DatabaseAdapter> {
    let adapter: DatabaseAdapter

    if (isPostgreSQLTest()) {
        // PostgreSQL test database
        if (!testDbConfig.connectionString) {
            throw new Error('PostgreSQL connection string not configured for tests')
        }
        adapter = new PostgreSQLAdapter(testDbConfig.connectionString)

        // Initialize schema only once for PostgreSQL
        if (!postgresSchemaInitialized) {
            await initializeTestSchema(adapter)
            postgresSchemaInitialized = true
        }
    } else {
        // SQLite in-memory database - DEPRECATED since Migration 019
        console.error('\n⚠️  SQLite is no longer supported for tests (Migration 019+)')
        console.error('    Set TEST_DATABASE_TYPE=postgresql in your environment')
        console.error('    Tests require PostgreSQL-specific features (custom types, triggers, BYTEA)\n')

        throw new Error(
            'SQLite test database is deprecated. ' +
            'Set TEST_DATABASE_TYPE=postgresql to run tests. ' +
            'Migration 019+ requires PostgreSQL-specific features.'
        )

    }

    return adapter
}

/**
 * Initialize database schema for tests
 */
async function initializeTestSchema(db: DatabaseAdapter): Promise<void> {
    const isPostgres = db.type === 'postgresql'

    // Timestamp handling
    const TIMESTAMP = isPostgres
        ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        : "TEXT DEFAULT (datetime('now'))"

    // Create tables (simplified for tests - add more as needed)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      version_id TEXT,
      created_at ${TIMESTAMP},
      updated_at ${TIMESTAMP}
    )
  `)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      category TEXT,
      assigned_to TEXT,
      version_id TEXT,
      created_at ${TIMESTAMP},
      updated_at ${TIMESTAMP}
    )
  `)

    await db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_published INTEGER DEFAULT 0,
      created_at ${TIMESTAMP}
    )
  `)

    // Create i18n_codes table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS i18n_codes (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name TEXT NOT NULL,
      variation TEXT DEFAULT 'false',
      type TEXT NOT NULL CHECK (type IN ('button', 'nav', 'field', 'desc')),
      text ${isPostgres ? 'JSONB NOT NULL' : 'TEXT NOT NULL'},
      status TEXT NOT NULL DEFAULT 'de' CHECK (status IN ('de', 'en', 'cz', 'draft', 'ok')),
      created_at ${TIMESTAMP},
      updated_at ${TIMESTAMP}
    )
  `)

    // Create indexes
    await db.exec('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_i18n_codes_name ON i18n_codes(name)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_i18n_codes_type ON i18n_codes(type)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_i18n_codes_status ON i18n_codes(status)')
    await db.exec('CREATE INDEX IF NOT EXISTS idx_i18n_codes_name_variation ON i18n_codes(name, variation)')
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_i18n_codes_unique ON i18n_codes(name, variation, type)')

    // Add update triggers
    if (isPostgres) {
        // PostgreSQL trigger function
        await db.exec(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)

        await db.exec(`
      DROP TRIGGER IF EXISTS events_updated_at ON events;
      CREATE TRIGGER events_updated_at 
        BEFORE UPDATE ON events
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `)

        await db.exec(`
      DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
      CREATE TRIGGER tasks_updated_at 
        BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `)
    } else {
        // SQLite triggers
        await db.exec(`
      DROP TRIGGER IF EXISTS events_updated_at;
      CREATE TRIGGER events_updated_at 
        AFTER UPDATE ON events
        BEGIN
          UPDATE events SET updated_at = datetime('now') WHERE id = NEW.id;
        END
    `)

        await db.exec(`
      DROP TRIGGER IF EXISTS tasks_updated_at;
      CREATE TRIGGER tasks_updated_at 
        AFTER UPDATE ON tasks
        BEGIN
          UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
        END
    `)
    }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(db: DatabaseAdapter): Promise<void> {
    if (isPostgreSQLTest()) {
        // Clear all tables in PostgreSQL test database
        await db.exec('TRUNCATE events, tasks, versions, i18n_codes CASCADE')
    } else {
        // Clear all tables in SQLite in-memory database
        await db.exec('DELETE FROM events')
        await db.exec('DELETE FROM tasks')
        await db.exec('DELETE FROM versions')
        await db.exec('DELETE FROM i18n_codes')
    }

    await db.close()
}

/**
 * Reset test database to clean state
 */
export async function resetTestDatabase(db: DatabaseAdapter): Promise<void> {
    if (isPostgreSQLTest()) {
        await db.exec('TRUNCATE events, tasks, versions, i18n_codes CASCADE')
    } else {
        await db.exec('DELETE FROM events')
        await db.exec('DELETE FROM tasks')
        await db.exec('DELETE FROM versions')
        await db.exec('DELETE FROM i18n_codes')
    }
}

/**
 * Test Fixtures
 */

export interface TestEvent {
    id: string
    name: string
    status: string
    version_id?: string
}

export interface TestTask {
    id: string
    title: string
    description?: string
    status: string
    category?: string
    assigned_to?: string
    version_id?: string
}

export interface TestVersion {
    id: string
    name: string
    description?: string
    is_published: number
}

/**
 * Create test event fixture
 */
export function createTestEvent(overrides?: Partial<TestEvent>): TestEvent {
    return {
        id: nanoid(),
        name: 'Test Event',
        status: 'draft',
        version_id: null,
        ...overrides
    }
}

/**
 * Create test task fixture
 */
export function createTestTask(overrides?: Partial<TestTask>): TestTask {
    return {
        id: nanoid(),
        title: 'Test Task',
        description: 'Test task description',
        status: 'open',
        category: 'general',
        assigned_to: null,
        version_id: null,
        ...overrides
    }
}

/**
 * Create test version fixture
 */
export function createTestVersion(overrides?: Partial<TestVersion>): TestVersion {
    return {
        id: nanoid(),
        name: 'Test Version',
        description: 'Test version description',
        is_published: 0,
        ...overrides
    }
}

/**
 * Insert test event
 */
export async function insertTestEvent(
    db: DatabaseAdapter,
    event?: Partial<TestEvent>
): Promise<TestEvent> {
    const testEvent = createTestEvent(event)

    await db.run(
        'INSERT INTO events (id, name, status, version_id) VALUES (?, ?, ?, ?)',
        [testEvent.id, testEvent.name, testEvent.status, testEvent.version_id]
    )

    return testEvent
}

/**
 * Insert test task
 */
export async function insertTestTask(
    db: DatabaseAdapter,
    task?: Partial<TestTask>
): Promise<TestTask> {
    const testTask = createTestTask(task)

    await db.run(
        'INSERT INTO tasks (id, title, description, status, category, assigned_to, version_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            testTask.id,
            testTask.title,
            testTask.description,
            testTask.status,
            testTask.category,
            testTask.assigned_to,
            testTask.version_id
        ]
    )

    return testTask
}

/**
 * Insert test version
 */
export async function insertTestVersion(
    db: DatabaseAdapter,
    version?: Partial<TestVersion>
): Promise<TestVersion> {
    const testVersion = createTestVersion(version)

    await db.run(
        'INSERT INTO versions (id, name, description, is_published) VALUES (?, ?, ?, ?)',
        [testVersion.id, testVersion.name, testVersion.description, testVersion.is_published]
    )

    return testVersion
}

/**
 * Count rows in a table
 */
export async function countRows(db: DatabaseAdapter, table: string): Promise<number> {
    const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`)
    return result?.count || 0
}

/**
 * Assert table is empty
 */
export async function assertTableEmpty(db: DatabaseAdapter, table: string): Promise<void> {
    const count = await countRows(db, table)
    if (count !== 0) {
        throw new Error(`Expected table ${table} to be empty, but found ${count} rows`)
    }
}

/**
 * Assert table has exact row count
 */
export async function assertTableRowCount(
    db: DatabaseAdapter,
    table: string,
    expected: number
): Promise<void> {
    const count = await countRows(db, table)
    if (count !== expected) {
        throw new Error(`Expected table ${table} to have ${expected} rows, but found ${count}`)
    }
}
