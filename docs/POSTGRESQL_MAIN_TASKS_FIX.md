# PostgreSQL Main Tasks Fix - Summary

**Date:** October 16, 2025  
**Issue:** PostgreSQL database had 137 entities but 0 tasks  
**Root Cause:** Triggers were never created in PostgreSQL

---

## Problem

The `crearis_admin_dev` PostgreSQL database had:
- ✅ 21 events
- ✅ 30 posts
- ✅ 21 locations
- ✅ 20 instructors
- ✅ 45 participants
- ❌ **0 tasks** (should have 137 main tasks)

**Why:** The `migrate-stage2.ts` script was a manual SQLite-only migration and was never applied to PostgreSQL.

---

## Solution Applied

### 1. Created Migration 003: Entity Task Triggers

**File:** `server/database/migrations/003_entity_task_triggers.ts`

- Supports both PostgreSQL and SQLite trigger syntax
- Creates AFTER INSERT triggers for automatic main-task creation
- Creates BEFORE DELETE triggers for cascade deletion
- Handles all 5 entity types: events, posts, locations, instructors, participants

### 2. Applied PostgreSQL Triggers

**File:** `003_entity_task_triggers.sql`

Created 2 PostgreSQL functions:
- `create_main_task()` - Creates main task on entity INSERT
- `delete_main_task()` - Deletes main task on entity DELETE

Created 10 triggers (5 entities × 2 triggers each):
```
create_event_main_task       → AFTER INSERT ON events
delete_event_main_task       → BEFORE DELETE ON events
create_post_main_task        → AFTER INSERT ON posts
delete_post_main_task        → BEFORE DELETE ON posts
create_location_main_task    → AFTER INSERT ON locations
delete_location_main_task    → BEFORE DELETE ON locations
create_instructor_main_task  → AFTER INSERT ON instructors
delete_instructor_main_task  → BEFORE DELETE ON instructors
create_participant_main_task → AFTER INSERT ON participants
delete_participant_main_task → BEFORE DELETE ON participants
```

### 3. Fixed Check Constraints

**Problem:** PostgreSQL had restrictive check constraints that didn't match SQLite

**Fixed:**
- ✅ Added `'main'` to `tasks_category_check` constraint
- ✅ Added `'new'` to `tasks_status_check` constraint

**Commands:**
```sql
ALTER TABLE tasks DROP CONSTRAINT tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
    CHECK (category = ANY (ARRAY['project', 'base', 'admin', 'main']));

ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status = ANY (ARRAY['idea', 'draft', 'final', 'reopen', 'trash', 'new']));
```

### 4. Backfilled Missing Main Tasks

**File:** `backfill_main_tasks.sql`

Created main tasks for all 137 existing entities:
```sql
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'event',
    e.id
FROM events e
LEFT JOIN tasks t ON t.record_type = 'event' AND t.record_id = e.id AND t.category = 'main'
WHERE t.id IS NULL;
```

**Results:**
- ✅ 21 event main tasks created
- ✅ 30 post main tasks created
- ✅ 21 location main tasks created
- ✅ 20 instructor main tasks created
- ✅ 45 participant main tasks created
- **Total: 137 main tasks** ✅

### 5. Enabled pgcrypto Extension

**Required for:** `gen_random_uuid()` function in PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## Final State

### Database Counts
```
Total Entities:   137
Total Main Tasks: 137 ✅
All Tasks:        137
```

### Sample Main Tasks
```
ID                                   | Title          | Category | Status | Type  | Entity Name
-------------------------------------|----------------|----------|--------|-------|---------------------------
edc56867-4711-42de-b96e-f5d829397113 | {{main-title}} | main     | new    | event | Applied Theatre: Klimagerechtigkeit
7f8d2396-91b4-429d-8a84-cf04adadbfef | {{main-title}} | main     | new    | event | Bewegungstheater & Physical Performance
47c8c2d8-c292-478f-9117-6b7d4ab641c8 | {{main-title}} | main     | new    | event | Community Theater: Unser Viertel
```

---

## Future Behavior

### New Entities
When a new entity is inserted, the trigger **automatically** creates a main task:

```sql
INSERT INTO events (id, name, ...) VALUES (...);
-- Trigger fires → main task created automatically ✅
```

### Deleted Entities
When an entity is deleted, the trigger **automatically** deletes its main task:

```sql
DELETE FROM events WHERE id = 'some_id';
-- Trigger fires → main task deleted automatically ✅
```

### Re-seeding
If you re-seed the database:
- `ON CONFLICT ... DO UPDATE` updates existing entities
- Triggers don't fire on UPDATE (only INSERT)
- Main tasks remain intact ✅

---

## Files Created/Modified

### New Files
1. `server/database/migrations/003_entity_task_triggers.ts` - Migration with PostgreSQL & SQLite support
2. `003_entity_task_triggers.sql` - PostgreSQL trigger SQL (manual application)
3. `backfill_main_tasks.sql` - Backfill script for existing entities
4. `run-migration-003.ts` - Migration runner script
5. `verify-main-tasks.ts` - Verification script (for testing)
6. `POSTGRESQL_MAIN_TASKS_FIX.md` - This summary

### Commands Run
```bash
# 1. Enable UUID extension
psql -U postgres -d crearis_admin_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 2. Apply triggers
psql -U postgres -d crearis_admin_dev -f 003_entity_task_triggers.sql

# 3. Fix constraints
psql -U postgres -d crearis_admin_dev -c "ALTER TABLE tasks DROP CONSTRAINT tasks_category_check; ..."
psql -U postgres -d crearis_admin_dev -c "ALTER TABLE tasks DROP CONSTRAINT tasks_status_check; ..."

# 4. Backfill main tasks
psql -U postgres -d crearis_admin_dev -f backfill_main_tasks.sql
```

---

## Next Steps

### 1. Add Migration 003 to Automatic System

Update `server/database/migrations/index.ts` to include:
```typescript
import { migration as migration003 } from './003_entity_task_triggers'

export const migrations = [
    migration000,
    migration001,
    migration002,
    migration003  // Add this
]
```

### 2. Update Migration 000 or 002

Add the constraint updates to a migration so fresh databases have correct constraints:
```typescript
// In migration 000 or 002
await db.exec(`
    ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
    CHECK (category IN ('project', 'base', 'admin', 'main'))
`)

await db.exec(`
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('idea', 'draft', 'final', 'reopen', 'trash', 'new'))
`)
```

### 3. Enable pgcrypto in Base Migration

Add to migration 000 for PostgreSQL:
```typescript
if (db.type === 'postgresql') {
    await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto')
}
```

---

## Verification Commands

```bash
# Check trigger count
psql -U postgres -d crearis_admin_dev -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE '%main_task%';"
# Expected: 10 triggers

# Check entity vs task counts
psql -U postgres -d crearis_admin_dev -c "
SELECT 
    (SELECT COUNT(*) FROM events) + (SELECT COUNT(*) FROM posts) + 
    (SELECT COUNT(*) FROM locations) + (SELECT COUNT(*) FROM instructors) + 
    (SELECT COUNT(*) FROM participants) as entities,
    (SELECT COUNT(*) FROM tasks WHERE category='main') as main_tasks;
"
# Expected: entities = main_tasks

# Test trigger with new insert
psql -U postgres -d crearis_admin_dev -c "
INSERT INTO events (id, name) VALUES ('test_event', 'Test Event');
SELECT * FROM tasks WHERE record_type='event' AND record_id='test_event';
DELETE FROM events WHERE id='test_event';
"
# Expected: Main task created, then deleted
```

---

## Summary

✅ **Problem Solved:** PostgreSQL now has all 137 main tasks  
✅ **Triggers Active:** Future entities will auto-create main tasks  
✅ **Constraints Fixed:** Category and status now allow correct values  
✅ **Data Integrity:** Every entity has exactly one main task  

**The data rule "every entity has a main-task attached" is now enforced in PostgreSQL!** 🎉
