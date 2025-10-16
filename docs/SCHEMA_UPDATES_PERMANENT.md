# Schema Updates - Now Permanent

**Date:** October 16, 2025  
**Issue:** Schema updates made manually would be lost on database recreation

---

## ✅ Problem Fixed

All schema updates are now part of the automatic migration system. If you drop and recreate the database, everything will be recreated correctly.

---

## Changes Made to Migration Files

### 1. Updated `000_base_schema.ts` - Tasks Table Constraints

**Added `'main'` to category constraint:**
```typescript
category ${TEXT} DEFAULT 'project' ${isPostgres
    ? "CHECK(category IN ('project', 'base', 'admin', 'main'))"  // Added 'main'
    : "CHECK(category IN ('project', 'base', 'admin', 'main'))"},
```

**Added `'new'` to status constraint:**
```typescript
status ${TEXT} DEFAULT 'idea' ${isPostgres
    ? "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash', 'new'))"  // Added 'new'
    : "CHECK(status IN ('idea', 'draft', 'final', 'reopen', 'trash', 'new'))"},
```

**Added pgcrypto extension for PostgreSQL:**
```typescript
export async function runBaseSchemaMigration(db: DatabaseAdapter) {
  console.log('📦 Running migration: 000_base_schema')

  // Enable PostgreSQL extensions
  if (db.type === 'postgresql') {
    console.log('  🔧 Enabling PostgreSQL extensions...')
    await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto')  // NEW
  }

  // ... rest of migration
}
```

### 2. Updated `migrations/index.ts` - Added Migration 003

**Added trigger migration to automatic system:**
```typescript
import { migration as migration003 } from './003_entity_task_triggers'

const migrations: Migration[] = [
    { run: runBaseSchemaMigration, metadata: baseMeta },
    { run: runConfigTableMigration, metadata: configMeta },
    { run: runSchemaAlignmentMigration, metadata: alignMeta },
    { run: migration003.up, metadata: { 
        id: migration003.id, 
        description: migration003.description, 
        version: '0.0.1', 
        date: '2025-10-16' 
    }},  // NEW
]
```

---

## What Happens on Fresh Database Now

### Automatic Migration Sequence

1. **Migration 000: Base Schema**
   - ✅ Enables `pgcrypto` extension (PostgreSQL)
   - ✅ Creates all tables with correct constraints
   - ✅ Tasks table allows `category='main'` and `status='new'`
   - ✅ Creates indexes
   - ✅ Creates updated_at triggers

2. **Migration 001: Config Table**
   - ✅ Creates `crearis_config` table
   - ✅ Inserts initial configuration

3. **Migration 002: Align Schema**
   - ✅ Adds `isbase` column to events
   - ✅ Adds `release_id`, `image`, `prompt` to tasks

4. **Migration 003: Entity Task Triggers** ⭐ NEW
   - ✅ Creates `create_main_task()` function (PostgreSQL)
   - ✅ Creates `delete_main_task()` function (PostgreSQL)
   - ✅ Creates 10 triggers (5 entities × 2 triggers each)
   - ✅ Automatic main-task creation on entity INSERT
   - ✅ Automatic main-task deletion on entity DELETE

5. **Seeding**
   - ✅ Seeds users and projects
   - ✅ Seeds CSV data (events, posts, locations, instructors, participants)
   - ✅ Triggers fire automatically → main tasks created ✅

---

## Test: Drop and Recreate Database

### PostgreSQL Test

```bash
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS crearis_admin_dev;"
psql -U postgres -c "CREATE DATABASE crearis_admin_dev;"

# Start server (will auto-initialize)
DATABASE_TYPE=postgresql DATABASE_URL="postgresql://postgres@localhost:5432/crearis_admin_dev" pnpm dev
```

**Expected Result:**
```
🔍 Database not found or not initialized
🚀 Starting automatic schema creation...

🔄 Starting database migrations...

📦 Running migration: 000_base_schema
  🔧 Enabling PostgreSQL extensions...
✅ Migration 000_base_schema completed

📦 Running migration: 001_config_table
✅ Migration 001_config_table completed

📦 Running migration: 002_align_schema
✅ Migration 002_align_schema completed

📦 Running migration: 003_entity_task_triggers
📋 Creating entity-task relationship triggers...
   ✅ Created triggers for events
   ✅ Created triggers for posts
   ✅ Created triggers for locations
   ✅ Created triggers for instructors
   ✅ Created triggers for participants
✅ Migration 003_entity_task_triggers completed

🌱 Starting database seeding...
✅ CSV data seeding complete!

Result:
✅ 137 entities created
✅ 137 main tasks created automatically
✅ All constraints valid
✅ All triggers active
```

### SQLite Test

```bash
# Delete database
rm demo-data.db

# Start server (will auto-initialize)
pnpm dev
```

**Expected Result:**
```
Same as PostgreSQL but with SQLite trigger syntax ✅
```

---

## Verification After Recreation

```bash
# Check entities and tasks
psql -U postgres -d crearis_admin_dev -c "
SELECT 
    (SELECT COUNT(*) FROM events) + 
    (SELECT COUNT(*) FROM posts) + 
    (SELECT COUNT(*) FROM locations) + 
    (SELECT COUNT(*) FROM instructors) + 
    (SELECT COUNT(*) FROM participants) as total_entities,
    (SELECT COUNT(*) FROM tasks WHERE category='main') as main_tasks;
"
```

**Expected:**
```
 total_entities | main_tasks 
----------------+------------
            137 |        137
```

```bash
# Check triggers exist
psql -U postgres -d crearis_admin_dev -c "
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%main_task%' 
ORDER BY event_object_table, trigger_name;
"
```

**Expected:**
```
         trigger_name         | event_object_table 
------------------------------+--------------------
 create_event_main_task       | events
 delete_event_main_task       | events
 create_instructor_main_task  | instructors
 delete_instructor_main_task  | instructors
 create_location_main_task    | locations
 delete_location_main_task    | locations
 create_participant_main_task | participants
 delete_participant_main_task | participants
 create_post_main_task        | posts
 delete_post_main_task        | posts
(10 rows)
```

```bash
# Check constraints
psql -U postgres -d crearis_admin_dev -c "\d tasks"
```

**Expected:**
```
Check constraints:
    "tasks_category_check" CHECK (category = ANY (ARRAY['project', 'base', 'admin', 'main']))
    "tasks_status_check" CHECK (status = ANY (ARRAY['idea', 'draft', 'final', 'reopen', 'trash', 'new']))
```

---

## Files Modified

1. ✅ `server/database/migrations/000_base_schema.ts`
   - Added `'main'` to category constraint
   - Added `'new'` to status constraint
   - Added `pgcrypto` extension for PostgreSQL

2. ✅ `server/database/migrations/index.ts`
   - Imported migration 003
   - Added to migrations array

3. ✅ `server/database/migrations/003_entity_task_triggers.ts`
   - Already created (PostgreSQL + SQLite support)

---

## Summary

### Before Changes
❌ Drop database → Manual SQL fixes needed  
❌ Fresh installation → Broken constraints  
❌ No triggers → No main tasks  

### After Changes
✅ Drop database → Fully automatic recreation  
✅ Fresh installation → Everything works  
✅ Triggers included → Main tasks auto-created  

**All schema updates are now permanent and will survive database recreation!** 🎉

---

## Related Documentation

- [POSTGRESQL_MAIN_TASKS_FIX.md](./POSTGRESQL_MAIN_TASKS_FIX.md) - Original fix documentation
- [DATA_RULES_VALIDATION.md](./DATA_RULES_VALIDATION.md) - Data rules validation report
- [MAIN_TASK_AUTO_CREATION.md](./MAIN_TASK_AUTO_CREATION.md) - How main-task creation works
- [docs/postgresql/database-setup.md](./docs/postgresql/database-setup.md) - Database setup guide
