import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'

const db = new Database('demo-data.db')

console.log('🚀 Starting Stage 2 Database Migration...\n')

// Enable foreign keys
db.pragma('foreign_keys = ON')

// ============================================================================
// 1. CREATE RELEASES TABLE
// ============================================================================

console.log('📋 Step 1: Creating releases table...')

db.exec(`
  CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    version_major INTEGER NOT NULL,
    version_minor INTEGER NOT NULL,
    description TEXT,
    state TEXT NOT NULL DEFAULT 'idea' CHECK (state IN ('idea', 'draft', 'final', 'trash')),
    release_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`)

// Create index for version ordering
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_releases_version 
  ON releases (version_major, version_minor)
`)

console.log('✅ Releases table created with version ordering')

// Insert initial releases if they don't exist
const existingReleases = db.prepare('SELECT COUNT(*) as count FROM releases').get() as { count: number }

if (existingReleases.count === 0) {
    console.log('📝 Inserting initial release records...')

    const insertRelease = db.prepare(`
    INSERT INTO releases (id, version, version_major, version_minor, description, state, release_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

    const releases = [
        {
            id: nanoid(),
            version: '0.0',
            major: 0,
            minor: 0,
            description: 'Initial concept and planning phase',
            state: 'final',
            release_date: '2025-01-01'
        },
        {
            id: nanoid(),
            version: '0.1',
            major: 0,
            minor: 1,
            description: 'First development iteration',
            state: 'draft',
            release_date: '2025-02-01'
        },
        {
            id: nanoid(),
            version: '0.2',
            major: 0,
            minor: 2,
            description: 'Second development iteration',
            state: 'idea',
            release_date: null
        }
    ]

    const insertMany = db.transaction(() => {
        for (const release of releases) {
            insertRelease.run(
                release.id,
                release.version,
                release.major,
                release.minor,
                release.description,
                release.state,
                release.release_date
            )
        }
    })

    insertMany()
    console.log('✅ Created 3 initial releases: 0.0, 0.1, 0.2')
}

// ============================================================================
// 2. ADD isBase TO EVENTS TABLE
// ============================================================================

console.log('\n📋 Step 2: Adding isBase field to events table...')

// Check if column exists
const eventsColumns = db.prepare("PRAGMA table_info(events)").all() as Array<{ name: string }>
const hasIsBase = eventsColumns.some(col => col.name === 'isBase')

if (!hasIsBase) {
    db.exec(`
    ALTER TABLE events ADD COLUMN isBase INTEGER DEFAULT 0
  `)
    console.log('✅ Added isBase column to events')
    console.log('ℹ️  Note: isBase values should be set during CSV import based on xml_id patterns')
    console.log('    (Records with id starting with "_demo." should have isBase=1)')
} else {
    console.log('⏭️  isBase column already exists')
}// ============================================================================
// 3. REFACTOR TASKS TABLE
// ============================================================================

console.log('\n📋 Step 3: Refactoring tasks table structure...')

// Create new tasks table with updated schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'main' CHECK (category IN ('admin', 'main', 'release')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('idea', 'new', 'draft', 'final', 'reopen', 'trash')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    release_id TEXT,
    record_type TEXT,
    record_id TEXT,
    assigned_to TEXT,
    image TEXT,
    prompt TEXT,
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE SET NULL
  )
`)

// Migrate existing tasks
console.log('📝 Migrating existing tasks...')

const existingTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }

if (existingTasksCount.count > 0) {
    // Map old status values to new ones
    db.exec(`
    INSERT INTO tasks_new (
      id, title, description, category, status, priority,
      release_id, record_type, record_id, assigned_to,
      image, prompt, due_date, completed_at, created_at, updated_at
    )
    SELECT 
      id, 
      title, 
      description,
      'main' as category,
      CASE 
        WHEN status = 'todo' THEN 'new'
        WHEN status = 'in-progress' THEN 'draft'
        WHEN status = 'done' THEN 'final'
        WHEN status = 'archived' THEN 'trash'
        ELSE 'new'
      END as status,
      priority,
      NULL as release_id,
      record_type,
      record_id,
      assigned_to,
      NULL as image,
      NULL as prompt,
      due_date,
      completed_at,
      created_at,
      updated_at
    FROM tasks
  `)
    console.log(`✅ Migrated ${existingTasksCount.count} existing tasks`)
}

// Drop old table and rename new one
db.exec('DROP TABLE IF EXISTS tasks')
db.exec('ALTER TABLE tasks_new RENAME TO tasks')

console.log('✅ Tasks table refactored successfully')

// Create indexes for tasks
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks (category)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_release ON tasks (release_id)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_record ON tasks (record_type, record_id)
`)

console.log('✅ Created task indexes')

// ============================================================================
// 4. UPDATE RECORD_VERSIONS TABLE FOR TASKS
// ============================================================================

console.log('\n📋 Step 4: Updating record_versions for new task schema...')

// The record_versions table already tracks changes, no schema changes needed
console.log('✅ Record versions table compatible with new schema')

// ============================================================================
// 5. CREATE TRIGGERS FOR ENTITY-TASK RELATIONSHIPS
// ============================================================================

console.log('\n📋 Step 5: Creating triggers for entity-task relationships...')

// Trigger to create main task when event is created
db.exec(`
  CREATE TRIGGER IF NOT EXISTS create_event_main_task
  AFTER INSERT ON events
  BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
      (SELECT lower(hex(randomblob(8)))),
      '{{main-title}}',
      'main',
      'new',
      'event',
      NEW.id
    );
  END
`)

// Trigger to create main task when post is created
db.exec(`
  CREATE TRIGGER IF NOT EXISTS create_post_main_task
  AFTER INSERT ON posts
  BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
      (SELECT lower(hex(randomblob(8)))),
      '{{main-title}}',
      'main',
      'new',
      'post',
      NEW.id
    );
  END
`)

// Trigger to create main task when location is created
db.exec(`
  CREATE TRIGGER IF NOT EXISTS create_location_main_task
  AFTER INSERT ON locations
  BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
      (SELECT lower(hex(randomblob(8)))),
      '{{main-title}}',
      'main',
      'new',
      'location',
      NEW.id
    );
  END
`)

// Trigger to create main task when instructor is created
db.exec(`
  CREATE TRIGGER IF NOT EXISTS create_instructor_main_task
  AFTER INSERT ON instructors
  BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
      (SELECT lower(hex(randomblob(8)))),
      '{{main-title}}',
      'main',
      'new',
      'instructor',
      NEW.id
    );
  END
`)

// Trigger to create main task when participant is created
db.exec(`
  CREATE TRIGGER IF NOT EXISTS create_participant_main_task
  AFTER INSERT ON participants
  BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
      (SELECT lower(hex(randomblob(8)))),
      '{{main-title}}',
      'main',
      'new',
      'participant',
      NEW.id
    );
  END
`)

// Trigger to delete main task when event is deleted
db.exec(`
  CREATE TRIGGER IF NOT EXISTS delete_event_main_task
  BEFORE DELETE ON events
  BEGIN
    DELETE FROM tasks 
    WHERE record_type = 'event' 
      AND record_id = OLD.id 
      AND category = 'main';
  END
`)

// Trigger to delete main task when post is deleted
db.exec(`
  CREATE TRIGGER IF NOT EXISTS delete_post_main_task
  BEFORE DELETE ON posts
  BEGIN
    DELETE FROM tasks 
    WHERE record_type = 'post' 
      AND record_id = OLD.id 
      AND category = 'main';
  END
`)

// Trigger to delete main task when location is deleted
db.exec(`
  CREATE TRIGGER IF NOT EXISTS delete_location_main_task
  BEFORE DELETE ON locations
  BEGIN
    DELETE FROM tasks 
    WHERE record_type = 'location' 
      AND record_id = OLD.id 
      AND category = 'main';
  END
`)

// Trigger to delete main task when instructor is deleted
db.exec(`
  CREATE TRIGGER IF NOT EXISTS delete_instructor_main_task
  BEFORE DELETE ON instructors
  BEGIN
    DELETE FROM tasks 
    WHERE record_type = 'instructor' 
      AND record_id = OLD.id 
      AND category = 'main';
  END
`)

// Trigger to delete main task when participant is deleted
db.exec(`
  CREATE TRIGGER IF NOT EXISTS delete_participant_main_task
  BEFORE DELETE ON participants
  BEGIN
    DELETE FROM tasks 
    WHERE record_type = 'participant' 
      AND record_id = OLD.id 
      AND category = 'main';
  END
`)

console.log('✅ Created entity-task relationship triggers')

// ============================================================================
// 6. CREATE MAIN TASKS FOR EXISTING ENTITIES
// ============================================================================

console.log('\n📋 Step 6: Creating main tasks for existing entities...')

const createMainTasks = db.transaction(() => {
    const tables = ['events', 'posts', 'locations', 'instructors', 'participants']

    for (const table of tables) {
        const entities = db.prepare(`SELECT id FROM ${table}`).all() as Array<{ id: string }>

        for (const entity of entities) {
            // Check if main task already exists
            const existingTask = db.prepare(`
        SELECT id FROM tasks 
        WHERE record_type = ? 
          AND record_id = ? 
          AND category = 'main'
      `).get(table.slice(0, -1), entity.id) // Remove 's' from table name for record_type

            if (!existingTask) {
                db.prepare(`
          INSERT INTO tasks (id, title, category, status, record_type, record_id)
          VALUES (?, '{{main-title}}', 'main', 'new', ?, ?)
        `).run(nanoid(), table.slice(0, -1), entity.id)
            }
        }

        const count = entities.length
        console.log(`✅ Ensured main tasks for ${count} ${table}`)
    }
})

createMainTasks()

// ============================================================================
// 7. VALIDATION SUMMARY
// ============================================================================

console.log('\n📊 Migration Summary:')
console.log('='.repeat(60))

const releasesCount = db.prepare('SELECT COUNT(*) as count FROM releases').get() as { count: number }
console.log(`✅ Releases: ${releasesCount.count} records`)

const tasksCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
console.log(`✅ Tasks: ${tasksCount.count} records`)

const mainTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE category = 'main'").get() as { count: number }
console.log(`✅ Main tasks: ${mainTasksCount.count} records`)

const baseEventsCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE isBase = 1').get() as { count: number }
console.log(`✅ Base events: ${baseEventsCount.count} records`)

const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }
const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
const locationsCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number }
const instructorsCount = db.prepare('SELECT COUNT(*) as count FROM instructors').get() as { count: number }
const participantsCount = db.prepare('SELECT COUNT(*) as count FROM participants').get() as { count: number }

console.log(`\n📋 Entities with main tasks:`)
console.log(`   - Events: ${eventsCount.count}`)
console.log(`   - Posts: ${postsCount.count}`)
console.log(`   - Locations: ${locationsCount.count}`)
console.log(`   - Instructors: ${instructorsCount.count}`)
console.log(`   - Participants: ${participantsCount.count}`)

console.log('='.repeat(60))

db.close()

console.log('\n🎉 Stage 2 Migration Complete!')
console.log('\n📝 Next steps:')
console.log('   1. Update API endpoints for new task structure')
console.log('   2. Update UI components for new fields')
console.log('   3. Test entity-task relationships')
console.log('   4. Implement version ordering in queries')
