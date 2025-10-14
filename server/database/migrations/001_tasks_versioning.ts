import type Database from 'better-sqlite3'

/**
 * Migration: Tasks and Versioning System
 * 
 * Adds:
 * - Tasks table for tracking work items
 * - Versions table for data snapshots
 * - Record versions for tracking individual record changes
 * - Extends existing tables with version tracking columns
 */
export function addTasksAndVersioning(db: Database.Database) {
  // Check if tasks table already has the new Stage 2 schema (has 'category' column)
  const tasksColumns = db.prepare('PRAGMA table_info(tasks)').all() as any[]
  const hasNewSchema = tasksColumns.some((col: any) => col.name === 'category')

  if (hasNewSchema) {
    console.log('ℹ️  Tasks table already has Stage 2 schema, skipping old migration')
    return
  }

  // Tasks table for tracking work items (OLD SCHEMA - only used if Stage 2 not run yet)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done', 'archived')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      record_type TEXT,  -- 'event', 'post', 'location', 'instructor', 'participant'
      record_id TEXT,    -- Reference to the actual record
      assigned_to TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      due_date TEXT,
      completed_at TEXT,
      version_id TEXT,   -- Link to version
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `)

  // Versions table for snapshots
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      version_number TEXT NOT NULL UNIQUE,  -- e.g., 'v1.0.0', 'v1.1.0'
      name TEXT NOT NULL,                   -- e.g., 'Winter 2025 Release'
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT,
      is_active INTEGER DEFAULT 0,          -- 0 or 1 for boolean
      snapshot_data TEXT,                   -- JSON snapshot of all data
      csv_exported INTEGER DEFAULT 0,       -- 0 or 1 if CSVs were generated
      notes TEXT
    )
  `)

  // Version history for tracking changes to records
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_versions (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,                   -- JSON snapshot of record
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (version_id) REFERENCES versions(id)
    )
  `)

  // Check if columns already exist before adding them
  const tables = ['events', 'posts', 'locations', 'instructors', 'participants']

  tables.forEach(table => {
    // Get existing columns
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[]
    const columnNames = columns.map((col: any) => col.name)

    // Only add columns if they don't exist
    // Note: SQLite ALTER TABLE doesn't support DEFAULT with functions, so we use NULL and set values in triggers
    if (!columnNames.includes('version_id')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN version_id TEXT`)
    }
    if (!columnNames.includes('created_at')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN created_at TEXT`)
    }
    if (!columnNames.includes('updated_at')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`)
    }
    if (!columnNames.includes('status')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN status TEXT DEFAULT 'active'`)
    }

    // Create triggers to set timestamps automatically for new inserts
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${table}_created_at_trigger
      AFTER INSERT ON ${table}
      WHEN NEW.created_at IS NULL
      BEGIN
        UPDATE ${table} SET created_at = datetime('now') WHERE id = NEW.id;
      END;
    `)

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${table}_updated_at_trigger
      AFTER UPDATE ON ${table}
      BEGIN
        UPDATE ${table} SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
    `)
  })

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks(record_type, record_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version_id);
    CREATE INDEX IF NOT EXISTS idx_versions_active ON versions(is_active);
    CREATE INDEX IF NOT EXISTS idx_record_versions_lookup ON record_versions(version_id, record_type, record_id);
  `)

  console.log('✅ Tasks and versioning tables created successfully')
}
