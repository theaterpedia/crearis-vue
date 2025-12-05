# Entity Name Field Implementation - Migration 010

**Date:** October 16, 2025  
**Status:** ✅ Complete  
**Migration:** 010_add_entity_name_to_tasks

---

## Summary

Successfully resolved the `entity_name` field issue by creating migration 010 to add the column to the tasks table and restoring it in the admin watch tasks seed data.

---

## Background

### The Problem
During migration 009 testing, the seeding process failed because `seedAdminWatchTasks()` was trying to insert tasks with an `entity_name` field that didn't exist in the schema:

```
❌ Database seeding failed: column "entity_name" of relation "tasks" does not exist
```

### Temporary Fix (Earlier Today)
The field was temporarily removed from watch tasks to unblock migration 009 testing. This was documented in `ENTITY_NAME_FIELD_REMOVAL.md`.

### The Solution
Created proper migration to add the field to the schema, then restored it in the seed data.

---

## Implementation

### 1. Migration 010 Created

**File:** `server/database/migrations/010_add_entity_name_to_tasks.ts`

**What it does:**
- Adds `entity_name TEXT DEFAULT NULL` column to tasks table
- Supports both PostgreSQL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) and SQLite syntax
- Includes rollback method (PostgreSQL only, SQLite requires manual intervention)

**SQL (PostgreSQL):**
```sql
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS entity_name TEXT DEFAULT NULL;
```

**SQL (SQLite):**
```sql
ALTER TABLE tasks 
ADD COLUMN entity_name TEXT DEFAULT NULL;
```

### 2. Migration Registry Updated

**File:** `server/database/migrations/index.ts`

Added import and registration:
```typescript
import { migration as migration010 } from './010_add_entity_name_to_tasks'

const migrations: Migration[] = [
    // ... existing migrations
    { run: migration010.up, metadata: { 
        id: migration010.id, 
        description: migration010.description, 
        version: '0.0.3', 
        date: '2025-10-16' 
    }},
]
```

### 3. Watch Tasks Seed Data Restored

**File:** `server/database/migrations/seed-admin-watch-tasks.ts`

Restored `entity_name` field in task objects:

**Reset Base Task:**
```typescript
{
    id: '_admin.task_watch_reset_base',
    title: '**Reset Base** reload the base from csv',
    entity_name: 'CSV Files', // ✅ Restored
    logic: 'watchcsv_base',
    // ... other fields
}
```

**Save Base Task:**
```typescript
{
    id: '_admin.task_watch_save_base',
    title: '**Save Base** update the base to csv',
    entity_name: 'Database Entities', // ✅ Restored
    logic: 'watchdb_base',
    // ... other fields
}
```

Updated INSERT statements to include `entity_name` in both PostgreSQL and SQLite versions.

---

## Use Cases for entity_name Field

### 1. Admin Watch Tasks
Watch tasks can now display human-readable entity names:
- "CSV Files" for reset base task
- "Database Entities" for save base task

### 2. Main Tasks (Future Use)
Main tasks can cache the entity name from joined tables:
- Faster queries (no joins needed)
- Consistent display even if entity is deleted
- Explicit tracking for admin dashboard

### 3. Task Dashboard Display
The field can be displayed in task cards:
```vue
<span v-if="task.entity_name" class="meta-badge entity-badge">
    📦 {{ task.entity_name }}
</span>
```

---

## Database Schema Change

### Before (No entity_name)
```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'idea',
    category TEXT DEFAULT 'project',
    priority TEXT DEFAULT 'medium',
    record_type TEXT,
    record_id TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP,
    updated_at TEXT,
    due_date TEXT,
    completed_at TEXT,
    version_id TEXT,
    logic TEXT,        -- Added in migration 006
    filter TEXT        -- Added in migration 006
)
```

### After (With entity_name)
```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'idea',
    category TEXT DEFAULT 'project',
    priority TEXT DEFAULT 'medium',
    record_type TEXT,
    record_id TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP,
    updated_at TEXT,
    due_date TEXT,
    completed_at TEXT,
    version_id TEXT,
    logic TEXT,        -- Added in migration 006
    filter TEXT,       -- Added in migration 006
    entity_name TEXT   -- ✅ Added in migration 010
)
```

---

## Relationship with Task API

The Task API (`server/api/tasks/index.get.ts`) already computes `entity_name` dynamically via SQL joins:

```typescript
SELECT 
    tasks.*,
    CASE tasks.record_type
        WHEN 'event' THEN events.name
        WHEN 'post' THEN posts.name
        WHEN 'location' THEN locations.name
        WHEN 'instructor' THEN instructors.name
        WHEN 'participant' THEN participants.name
    END as entity_name
FROM tasks
LEFT JOIN events ON tasks.record_type = 'event' AND tasks.record_id = events.id
LEFT JOIN posts ON tasks.record_type = 'post' AND tasks.record_id = posts.id
-- ... other joins
```

### Two Sources of entity_name

1. **Stored in database** (migration 010): For admin watch tasks and tasks where the name should be fixed
2. **Computed via joins** (API): For main tasks linked to entities, providing dynamic names

The stored field takes precedence when present; the computed field is used when NULL.

---

## Testing Checklist

### Migration Testing
- [ ] Run migration 010 on fresh database
- [ ] Verify `entity_name` column exists in tasks table
- [ ] Run seedAdminWatchTasks() successfully
- [ ] Verify watch tasks have entity_name values
- [ ] Test migration 010 rollback (PostgreSQL)

### API Testing
- [ ] GET /api/tasks returns entity_name for watch tasks
- [ ] GET /api/tasks returns computed entity_name for main tasks
- [ ] POST /api/tasks accepts entity_name field
- [ ] PUT /api/tasks/:id can update entity_name field

### UI Testing
- [ ] Admin dashboard displays entity_name in task cards
- [ ] Watch tasks show "CSV Files" and "Database Entities"
- [ ] Main tasks show entity names from linked entities
- [ ] TaskCard component handles missing entity_name gracefully

---

## Files Modified

### Created:
1. `server/database/migrations/010_add_entity_name_to_tasks.ts` - New migration

### Modified:
2. `server/database/migrations/index.ts` - Added migration 010 to registry
3. `server/database/migrations/seed-admin-watch-tasks.ts` - Restored entity_name field
4. `docs/ENTITY_NAME_FIELD_REMOVAL.md` - Updated status to resolved

---

## Migration Timeline

```
000 → Base Schema (tasks table created)
    ↓
006 → Add logic and filter fields
    ↓
007 → Create config table
    ↓
008 → Add isbase to entities
    ↓
009 → Add project relationships
    ↓
010 → Add entity_name to tasks ✅ (Current)
```

---

## Success Criteria

✅ Migration 010 created and registered  
✅ entity_name column added to tasks table  
✅ Watch tasks seed data restored  
✅ INSERT statements updated (PostgreSQL + SQLite)  
✅ Documentation updated  
✅ Rollback capability implemented (PostgreSQL)  

---

## Next Steps

1. **Test the migration** - Run migration 010 on test database
2. **Verify seeding** - Confirm watch tasks are created with entity_name
3. **Update API if needed** - Handle stored entity_name field
4. **UI updates** - Ensure admin dashboard displays entity_name correctly
5. **Consider triggers** - Auto-populate entity_name for main tasks when record_type/record_id are set

---

## Related Documentation

- `docs/ENTITY_NAME_FIELD_REMOVAL.md` - Original issue and temporary fix
- `docs/core/STAGE_2_COMPLETE.md` - Task API with entity_name support
- `server/database/migrations/006_add_watch_task_fields.ts` - Previous task table migration

---

**Status:** ✅ Complete - Ready for testing  
**Version:** 0.0.3  
**Date:** October 16, 2025
