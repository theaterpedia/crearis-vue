# STAGE 2: Enhanced Task & Release System
## Database Refactoring Implementation

**Date:** January 2025  
**Status:** ✅ Migration Complete  
**Migration Script:** `server/database/migrate-stage2.ts`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Schema Changes](#schema-changes)
3. [Entity-Task Relationships](#entity-task-relationships)
4. [Migration Results](#migration-results)
5. [API Changes Needed](#api-changes-needed)
6. [Data Validation Rules](#data-validation-rules)
7. [Testing](#testing)

---

## Overview

Stage 2 introduces an enhanced task management system with:
- **Releases table** for version management
- **Enhanced tasks** with categories, releases, and extended statuses
- **Automatic entity-task relationships** (events, posts, locations, instructors, participants)
- **Data validation rules** for project names and xml_id patterns
- **Title inheritance** system for main tasks

---

## Schema Changes

### 1. Releases Table

**Purpose:** Track project versions with proper ordering (0.11 comes after 0.2, not after 0.1)

```sql
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  version_major INTEGER NOT NULL,
  version_minor INTEGER NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT 'idea' 
    CHECK (state IN ('idea', 'draft', 'final', 'trash')),
  release_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

CREATE INDEX idx_releases_version 
  ON releases (version_major, version_minor)
```

**Initial Data:**
- `0.0` - Initial concept and planning phase (final, 2025-01-01)
- `0.1` - First development iteration (draft, 2025-02-01)
- `0.2` - Second development iteration (idea, null)

**Version Ordering:**
- Order by `version_major ASC, version_minor ASC`
- Example: 0.0, 0.1, 0.2, 0.9, 0.10, 0.11, 1.0

---

### 2. Events Table Enhancement

**New Column:**
```sql
ALTER TABLE events ADD COLUMN isBase INTEGER DEFAULT 0
```

**Purpose:** Flag base/template events that come from demo data

**Rules:**
- `isBase = 1` when CSV id starts with `_demo.`
- `isBase = 0` for user-created events
- Should be set during CSV import, not in migration

**Note:** Migration added the column but did not set values (existing data doesn't have xml_id stored)

---

### 3. Tasks Table Refactoring

**New Schema:**
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'main' 
    CHECK (category IN ('admin', 'main', 'release')),
  status TEXT NOT NULL DEFAULT 'new' 
    CHECK (status IN ('idea', 'new', 'draft', 'final', 'reopen', 'trash')),
  priority TEXT NOT NULL DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  release_id TEXT,
  record_type TEXT,
  record_id TEXT,
  assigned_to TEXT,
  image TEXT,           -- NEW: Image URL/path
  prompt TEXT,          -- NEW: AI prompt for task
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE SET NULL
)
```

**Key Changes:**
1. **category field** (NEW):
   - `admin` - Administrative/system tasks
   - `main` - Main task for entity (auto-created)
   - `release` - Release-specific tasks

2. **status mapping** (old → new):
   - `todo` → `new`
   - `in-progress` → `draft`
   - `done` → `final`
   - `archived` → `trash`
   - Plus new: `idea`, `reopen`

3. **release_id** (NEW):
   - Links task to a release
   - NULL allowed (not all tasks are release-specific)
   - ON DELETE SET NULL (if release deleted, task remains)

4. **image & prompt** (NEW):
   - Optional fields for AI/visual enhancements

**Indexes:**
```sql
CREATE INDEX idx_tasks_category ON tasks (category)
CREATE INDEX idx_tasks_status ON tasks (status)
CREATE INDEX idx_tasks_release ON tasks (release_id)
CREATE INDEX idx_tasks_record ON tasks (record_type, record_id)
```

**Migration:**
- Migrated 10 existing tasks
- Old status values mapped to new equivalents
- Set default `category = 'main'`

---

## Entity-Task Relationships

### Concept

Every entity (event, post, location, instructor, participant) automatically gets a **main task** with:
- `category = 'main'`
- `title = '{{main-title}}'` (placeholder for UI replacement)
- `record_type` = entity type (singular: 'event', 'post', etc.)
- `record_id` = entity id

### Triggers

**Create Main Task (on entity INSERT):**
```sql
CREATE TRIGGER create_event_main_task
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
```

Similar triggers exist for: `posts`, `locations`, `instructors`, `participants`

**Delete Main Task (on entity DELETE):**
```sql
CREATE TRIGGER delete_event_main_task
BEFORE DELETE ON events
BEGIN
  DELETE FROM tasks 
  WHERE record_type = 'event' 
    AND record_id = OLD.id 
    AND category = 'main';
END
```

Similar triggers exist for all entity types.

### Title Inheritance Rules

The `{{main-title}}` placeholder should be replaced in queries/UI with:

**For Events:**
```sql
COALESCE(tasks.title, events.name || ' - Main Task')
```

**For Posts:**
```sql
COALESCE(tasks.title, posts.title || ' - Main Task')
```

**For Locations:**
```sql
COALESCE(tasks.title, locations.name || ' - Main Task')
```

**For Instructors:**
```sql
COALESCE(tasks.title, instructors.name || ' - Main Task')
```

**For Participants:**
```sql
COALESCE(tasks.title, participants.name || ' - Main Task')
```

**UI Display:**
- If task.title contains `{{main-title}}`, show: `[Entity Name] - Main Task`
- Otherwise, show task.title as-is

---

## Migration Results

### Summary

```
✅ Releases: 3 records
✅ Tasks: 146 records (10 existing + 136 new main tasks)
✅ Main tasks: 146 records

📋 Entities with main tasks:
   - Events: 21
   - Posts: 30
   - Locations: 21
   - Instructors: 20
   - Participants: 45
   Total: 137 entities
```

### What Happened

1. ✅ Created `releases` table with 3 initial versions
2. ✅ Added `isBase` column to `events` (values not set)
3. ✅ Refactored `tasks` table schema
4. ✅ Migrated 10 existing tasks (status mapped)
5. ✅ Created 10 triggers (5 for INSERT, 5 for DELETE)
6. ✅ Created main tasks for 137 existing entities
7. ✅ Created 4 indexes on tasks table

---

## API Changes Needed

### 1. Task API Updates

**File:** `server/api/tasks/*.ts`

**Required Changes:**
- Accept `category` filter in GET queries
- Accept `release_id` in POST/PUT
- Accept new status values: `idea`, `new`, `draft`, `final`, `reopen`, `trash`
- Accept `image` and `prompt` fields
- Return joined entity data for title inheritance
- Filter out `category=main` tasks from general lists (or show separately)

**Example Query for Tasks with Entity Names:**
```sql
SELECT 
  tasks.*,
  CASE tasks.record_type
    WHEN 'event' THEN events.name
    WHEN 'post' THEN posts.title
    WHEN 'location' THEN locations.name
    WHEN 'instructor' THEN instructors.name
    WHEN 'participant' THEN participants.name
  END as entity_name,
  CASE 
    WHEN tasks.title = '{{main-title}}' THEN entity_name || ' - Main Task'
    ELSE tasks.title
  END as display_title
FROM tasks
LEFT JOIN events ON tasks.record_type = 'event' AND tasks.record_id = events.id
LEFT JOIN posts ON tasks.record_type = 'post' AND tasks.record_id = posts.id
LEFT JOIN locations ON tasks.record_type = 'location' AND tasks.record_id = locations.id
LEFT JOIN instructors ON tasks.record_type = 'instructor' AND tasks.record_id = instructors.id
LEFT JOIN participants ON tasks.record_type = 'participant' AND tasks.record_id = participants.id
WHERE tasks.category != 'admin'
ORDER BY tasks.created_at DESC
```

### 2. Releases API (NEW)

**Files to Create:**
- `server/api/releases/index.get.ts` - List all releases (ordered)
- `server/api/releases/index.post.ts` - Create new release
- `server/api/releases/[id].get.ts` - Get single release
- `server/api/releases/[id].put.ts` - Update release
- `server/api/releases/[id].delete.ts` - Delete release

**GET /api/releases Response:**
```typescript
{
  releases: [
    {
      id: "abc123",
      version: "0.11",
      version_major: 0,
      version_minor: 11,
      description: "Feature additions",
      state: "draft",
      release_date: "2025-03-01",
      created_at: "2025-01-15T10:00:00Z",
      updated_at: "2025-01-15T10:00:00Z",
      task_count: 15 // Number of tasks linked to this release
    }
  ]
}
```

**Ordering Query:**
```sql
SELECT * FROM releases 
ORDER BY version_major ASC, version_minor ASC
```

---

## Data Validation Rules

### 1. Project Names (from projects table)

**Valid Format:**
- Only lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-) allowed
- Must start with a letter
- 3-50 characters

**Regex:** `^[a-z][a-z0-9-]{2,49}$`

**Examples:**
- ✅ Valid: `admin`, `base`, `project1`, `my-project`
- ❌ Invalid: `Project1`, `_admin`, `p`, `project_name`, `123project`

### 2. xml_id Structure (for all entities)

**Format:** `<project>.<entity_type>_<name>`

**Rules:**
- `<project>` must exist in projects table OR be `_demo`
- `<entity_type>` must match: `event`, `post`, `location`, `instructor`, `participant`
- `<name>` lowercase, alphanumeric, hyphens/underscores allowed
- Total max length: 255 characters

**Regex:** `^(_demo|[a-z][a-z0-9-]{2,49})\.(event|post|location|instructor|participant)_[a-z0-9_-]+$`

**Examples:**
- ✅ Valid: `_demo.event_forum_theater`, `project1.event_workshop`, `base.location_main_hall`
- ❌ Invalid: `demo.event_x`, `Project1.event_test`, `admin.invalid_type_name`

### 3. isBase Auto-Setting

**Rule:** When importing CSV with xml_id:
```typescript
const isBase = xml_id.startsWith('_demo.') ? 1 : 0
```

**Application:**
- CSV import for `events` table
- Any entity creation with xml_id field

---

## Testing

### 1. Test Entity-Task Relationship

**Create Event and Verify Main Task:**
```typescript
// In Nitro console or test script
import { db } from '~/server/database/db'
import { nanoid } from 'nanoid'

// Create event
const eventId = nanoid()
db.prepare(`
  INSERT INTO events (id, name)
  VALUES (?, ?)
`).run(eventId, 'Test Event')

// Check main task was created
const mainTask = db.prepare(`
  SELECT * FROM tasks 
  WHERE record_type = 'event' 
    AND record_id = ? 
    AND category = 'main'
`).get(eventId)

console.log('Main task:', mainTask)
// Should show: { id: '...', title: '{{main-title}}', category: 'main', ... }
```

### 2. Test Cascade Delete

**Delete Event and Verify Main Task Removed:**
```typescript
db.prepare('DELETE FROM events WHERE id = ?').run(eventId)

const mainTask = db.prepare(`
  SELECT * FROM tasks 
  WHERE record_type = 'event' 
    AND record_id = ?
`).get(eventId)

console.log('Main task after delete:', mainTask)
// Should be undefined/null
```

### 3. Test Version Ordering

**Query Releases in Order:**
```typescript
const releases = db.prepare(`
  SELECT version FROM releases 
  ORDER BY version_major ASC, version_minor ASC
`).all()

console.log('Release versions:', releases.map(r => r.version))
// Should show: ['0.0', '0.1', '0.2'] (or with 0.10, 0.11 if added)
```

### 4. Test Status Migration

**Check Old Tasks Migrated Correctly:**
```typescript
const tasks = db.prepare('SELECT id, status FROM tasks').all()
console.log('Task statuses:', tasks)

// Old 'todo' should be 'new'
// Old 'in-progress' should be 'draft'
// Old 'done' should be 'final'
// Old 'archived' should be 'trash'
```

---

## Next Steps

### Immediate (Required for functionality)

1. **Update Task API endpoints** (`server/api/tasks/*.ts`)
   - Add support for new fields: `category`, `release_id`, `image`, `prompt`
   - Update status validation to new values
   - Add entity name joining for title inheritance

2. **Create Releases API** (`server/api/releases/*.ts`)
   - Full CRUD operations
   - Version ordering in GET queries
   - Task count aggregation

3. **Update TaskDashboard UI** (`src/views/TaskDashboard.vue`)
   - Add category filter dropdown
   - Add release selection
   - Display entity names for main tasks
   - Show image/prompt fields
   - Update status badges for new values

### Later (Enhancement)

4. **CSV Import Enhancement**
   - Auto-set `isBase` based on xml_id pattern
   - Validate xml_id format during import
   - Validate project names

5. **Validation Middleware**
   - Create reusable validators for project names and xml_id
   - Add to all entity creation/update endpoints
   - Return clear error messages

6. **UI for Releases**
   - Releases list page
   - Release detail page with linked tasks
   - Version timeline visualization

---

## Files Modified/Created

### Migration Script
- ✅ `server/database/migrate-stage2.ts` (369 lines)

### Documentation
- ✅ `docs/core/STAGE_2_ENHANCED_TASKS.md` (this file)

### Pending Updates
- ⏳ `server/api/tasks/*.ts` - Update for new schema
- ⏳ `server/api/releases/*.ts` - Create full CRUD API
- ⏳ `src/views/TaskDashboard.vue` - Update UI
- ⏳ `src/composables/useTasks.ts` - Update types & queries

---

## Rollback Procedure

If issues arise, you can rollback by:

1. **Restore from backup** (recommended):
   ```bash
   cp demo-data.db.backup demo-data.db
   ```

2. **Manual rollback** (if no backup):
   ```sql
   -- Drop triggers
   DROP TRIGGER IF EXISTS create_event_main_task;
   DROP TRIGGER IF EXISTS create_post_main_task;
   DROP TRIGGER IF EXISTS create_location_main_task;
   DROP TRIGGER IF EXISTS create_instructor_main_task;
   DROP TRIGGER IF EXISTS create_participant_main_task;
   DROP TRIGGER IF EXISTS delete_event_main_task;
   DROP TRIGGER IF EXISTS delete_post_main_task;
   DROP TRIGGER IF EXISTS delete_location_main_task;
   DROP TRIGGER IF EXISTS delete_instructor_main_task;
   DROP TRIGGER IF EXISTS delete_participant_main_task;
   
   -- Delete auto-created main tasks
   DELETE FROM tasks WHERE category = 'main';
   
   -- Revert task schema (complex - requires recreating old table)
   -- Not recommended - use backup instead
   ```

---

## Summary

✅ **Stage 2 Migration Complete**
- 3 releases created
- 146 tasks total (10 migrated + 136 new main tasks)
- 10 triggers created
- 4 indexes created
- Entity-task relationships functional

⏳ **Next Actions Required:**
1. Update task API endpoints
2. Create releases API
3. Update TaskDashboard UI
4. Test all new features
5. Update CSV import for isBase

📊 **Database Growth:**
- Before: ~10 tasks
- After: ~146 tasks (137 auto-created main tasks)
- New table: releases (3 records)

---

**End of Stage 2 Documentation**
