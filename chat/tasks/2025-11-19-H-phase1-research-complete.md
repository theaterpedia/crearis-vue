# Phase 1 Research: Existing Status/Tags Schema Analysis
**Date:** 2025-11-19  
**Migration:** 019 (status/tags creation), 020 (i18n support)

---

## Executive Summary

**Current System Overview:**
- Status system uses INTEGER FK references with table-specific entries
- Tags system uses junction tables (many-to-many)
- Both have full i18n support (JSONB name_i18n, desc_i18n)
- Generated columns provide computed display values
- Bitmask values (SMALLINT) used for status, but not yet for tags

---

## Status Table Schema (Migration 019)

### Table Structure
```sql
CREATE TABLE status (
    id SERIAL PRIMARY KEY,
    value SMALLINT NOT NULL,                    -- Bitmask value (0, 1, 2, 4, 8, 16, 32...)
    name TEXT NOT NULL,                         -- Status key (e.g., 'new', 'draft')
    "table" TEXT NOT NULL,                      -- Entity table name
    description TEXT,
    name_i18n JSONB,                           -- {'de': 'Neu', 'en': 'New', 'cz': 'Nový'}
    desc_i18n JSONB,
    UNIQUE(name, "table")                       -- Unique per table
)
```

### Indexes
```sql
CREATE INDEX idx_status_name ON status(name)
CREATE INDEX idx_status_table ON status("table")
CREATE UNIQUE INDEX idx_status_name_table ON status(name, "table")
```

### Status Values by Entity

**Tasks (7 statuses):**
```typescript
{ value: 0, name: 'new' }        // Default
{ value: 1, name: 'idea' }       
{ value: 2, name: 'draft' }
{ value: 4, name: 'active' }
{ value: 5, name: 'final' }      // Note: Not power of 2
{ value: 8, name: 'reopen' }
{ value: 16, name: 'trash' }
```

**Events (7 statuses):**
```typescript
{ value: 2, name: 'draft' }
{ value: 3, name: 'publish' }    // Note: Not power of 2
{ value: 4, name: 'released' }
{ value: 6, name: 'confirmed' }  // Note: Not power of 2
{ value: 8, name: 'running' }
{ value: 9, name: 'passed' }     // Note: Not power of 2
{ value: 12, name: 'documented' } // Note: Not power of 2
```

**Posts (3 statuses):**
```typescript
{ value: 2, name: 'draft' }
{ value: 3, name: 'publish' }
{ value: 4, name: 'released' }
```

**Common Statuses (7 - for projects, events, posts, persons, users, interactions):**
```typescript
{ value: 0, name: 'new' }        // Default
{ value: 1, name: 'demo' }
{ value: 2, name: 'progress' }
{ value: 4, name: 'done' }
{ value: 16, name: 'trash' }
{ value: 32, name: 'archived' }
{ value: 48, name: 'linked' }    // Note: Not power of 2 (32+16)
```

**Projects (3 additional):**
```typescript
{ value: 2, name: 'draft' }
{ value: 3, name: 'publish' }
{ value: 4, name: 'released' }
```

**Users (5 additional):**
```typescript
{ value: 0, name: 'activated' }
{ value: 2, name: 'verified' }
{ value: 3, name: 'publish' }
{ value: 4, name: 'synced' }
{ value: 6, name: 'public' }     // Note: Not power of 2
```

**Persons (5 additional):**
```typescript
{ value: 2, name: 'active' }
{ value: 4, name: 'synced' }
{ value: 6, name: 'public' }     // Note: Not power of 2
{ value: 16, name: 'deleted' }
{ value: 32, name: 'archived' }
```

**Images (6 statuses):**
```typescript
{ value: 0, name: 'new' }
{ value: 1, name: 'demo' }
{ value: 2, name: 'draft' }
{ value: 4, name: 'done' }
{ value: 16, name: 'trash' }
{ value: 32, name: 'archived' }
```

### Key Observations

1. **Value Inconsistency:** Not all values are powers of 2
   - Some are combinations: `value: 48` = 32 + 16
   - Some are sequential: `value: 3, 5, 6, 9, 12`
   - **Impact:** Cannot simply OR bitmasks for these values

2. **Table-Specific Status:** Each entity table has own status entries
   - Same name ('draft') can appear multiple times with different IDs
   - Query requires: `WHERE "table" = 'events' AND name = 'draft'`

3. **i18n Complete:** All entries have JSONB translations
   - name_i18n: {de, en, cz}
   - desc_i18n: {de, en, cz}
   - Fallback chain: lang → de → en → name

---

## Tags Table Schema (Migration 019)

### Table Structure
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,                 -- Tag name (e.g., 'child', 'democracy')
    description TEXT,
    name_i18n JSONB,                           -- Translations
    desc_i18n JSONB
)
```

### Junction Tables

**events_tags:**
```sql
CREATE TABLE events_tags (
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, tag_id)
)

CREATE INDEX idx_events_tags_event ON events_tags(event_id)
CREATE INDEX idx_events_tags_tag ON events_tags(tag_id)
```

**posts_tags:**
```sql
CREATE TABLE posts_tags (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
)

CREATE INDEX idx_posts_tags_post ON posts_tags(post_id)
CREATE INDEX idx_posts_tags_tag ON posts_tags(tag_id)
```

### Computed Tag Columns (Migration 019)

**Entity tables have:**
```sql
ALTER TABLE events ADD COLUMN tags_ids INTEGER[] DEFAULT '{}'
ALTER TABLE events ADD COLUMN tags_display TEXT[] DEFAULT '{}'

ALTER TABLE posts ADD COLUMN tags_ids INTEGER[] DEFAULT '{}'
ALTER TABLE posts ADD COLUMN tags_display TEXT[] DEFAULT '{}'
```

**Maintained by triggers:**
```sql
CREATE OR REPLACE FUNCTION update_events_tags()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events e
    SET 
        tags_ids = COALESCE((
            SELECT ARRAY_AGG(tag_id ORDER BY tag_id)
            FROM events_tags
            WHERE event_id = e.id
        ), '{}'),
        tags_display = COALESCE((
            SELECT ARRAY_AGG(
                COALESCE(
                    t.name_i18n->>e.lang,
                    t.name
                ) ORDER BY t.name
            )
            FROM events_tags et
            JOIN tags t ON et.tag_id = t.id
            WHERE et.event_id = e.id
        ), '{}')
    WHERE e.id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_tags_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_events_tags();
```

### Current Tag Usage

**No tag entries seeded in migration 019!**
- Tags table created but empty
- Junction tables created but empty
- Computed columns exist but unused

**Tags ARE used in images system** (from cimgImport.vue, ImagesCoreAdmin.vue):
- Age groups (bits 0-1)
- Subject type (bits 2-3)
- Access level (bits 4-5)
- But these are stored as BYTEA in images table, NOT in tags table!

---

## Status Display (Migration 020)

### Generated Column Implementation

**Function:**
```sql
CREATE OR REPLACE FUNCTION get_status_display_name(
    p_status_id INTEGER,
    p_lang TEXT
) RETURNS TEXT AS $$
DECLARE
    v_name_i18n JSONB;
    v_name TEXT;
BEGIN
    IF p_status_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get name_i18n from status table
    SELECT name_i18n, name INTO v_name_i18n, v_name
    FROM status
    WHERE id = p_status_id;

    -- Fallback chain: lang → de → en → name
    RETURN COALESCE(
        v_name_i18n->>p_lang,
        v_name_i18n->>'de',
        v_name_i18n->>'en',
        v_name
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Generated Columns:**
```sql
-- Tables with lang field (participants, instructors, tasks, locations, users)
ALTER TABLE {table}
ADD COLUMN status_display TEXT
GENERATED ALWAYS AS (
    get_status_display_name(status_id, lang)
) STORED;

-- Tables without lang field (events, posts) - use default 'de'
ALTER TABLE {table}
ADD COLUMN status_display TEXT
GENERATED ALWAYS AS (
    get_status_display_name(status_id, 'de')
) STORED;
```

### Entity Tables with status_id

**Full entities (complete sysreg support - all 6 tagfamilies):**
1. projects
2. events
3. posts
4. persons
5. images

**Partial entities (limited sysreg support - only status, rtags, config):**
6. users
7. tasks
8. interactions

**All have:**
- `status_id INTEGER REFERENCES status(id)`
- `status_display TEXT GENERATED` (Migration 020)

**Some have lang field** (Migration 020):
- participants
- instructors
- tasks
- locations
- users

**No lang field** (use default 'de'):
- projects
- events
- posts

---

## Entity Tables Schema Summary

### Projects
```sql
-- From migration 019
status_id INTEGER REFERENCES status(id)

-- From migration 020
status_display TEXT GENERATED (uses 'de')
```

### Events
```sql
-- From migration 019
status_id INTEGER REFERENCES status(id)
tags_ids INTEGER[] DEFAULT '{}'
tags_display TEXT[] DEFAULT '{}'

-- From migration 020
status_display TEXT GENERATED (uses 'de')
```

### Posts
```sql
-- From migration 019
status_id INTEGER REFERENCES status(id)
tags_ids INTEGER[] DEFAULT '{}'
tags_display TEXT[] DEFAULT '{}'

-- From migration 020
status_display TEXT GENERATED (uses 'de')
```

### Tasks
```sql
-- From migration 019
status_id INTEGER REFERENCES status(id)

-- From migration 020
lang TEXT DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz'))
status_display TEXT GENERATED (uses lang)
```

### Users
```sql
-- From migration 019
status_id INTEGER REFERENCES status(id)

-- From migration 020
lang TEXT DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz'))
status_display TEXT GENERATED (uses lang)
```

### Participants, Instructors, Locations
```sql
-- From migration 020
lang TEXT DEFAULT 'de' CHECK (lang IN ('de', 'en', 'cz'))
status_display TEXT GENERATED (uses lang)
```

---

## FK Constraints to Status Table

**From migration 019:**
```sql
ALTER TABLE projects ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE events ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE posts ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE participants ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE instructors ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE tasks ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE locations ADD COLUMN status_id INTEGER REFERENCES status(id)
ALTER TABLE users ADD COLUMN status_id INTEGER REFERENCES status(id)
```

**Images table** (from migration 019 Chapter 5B.4):
```sql
CREATE TABLE images (
    -- ...
    status_id INTEGER NOT NULL REFERENCES status(id),
    rtags BYTEA,          -- Record tags (bitmask)
    ctags BYTEA,          -- Common tags (bitmask)
    -- ...
)
```

---

## Generated Columns Dependencies

**From migration 020:**
```sql
-- Function dependency
get_status_display_name(p_status_id INTEGER, p_lang TEXT)

-- Column dependencies (7 tables)
projects.status_display GENERATED (uses status_id)
events.status_display GENERATED (uses status_id)
posts.status_display GENERATED (uses status_id)
participants.status_display GENERATED (uses status_id, lang)
instructors.status_display GENERATED (uses status_id, lang)
tasks.status_display GENERATED (uses status_id, lang)
locations.status_display GENERATED (uses status_id, lang)
users.status_display GENERATED (uses status_id, lang)
```

---

## Trigger Dependencies

**From migration 019:**

**Events tags trigger:**
```sql
CREATE TRIGGER events_tags_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_events_tags();
```

**Posts tags trigger:**
```sql
CREATE TRIGGER posts_tags_trigger
    AFTER INSERT OR UPDATE OR DELETE ON posts_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_tags();
```

**Dependencies:**
- `update_events_tags()` function
- `update_posts_tags()` function
- events.tags_ids column
- events.tags_display column
- posts.tags_ids column
- posts.tags_display column

---

## Migration 022 Requirements

### Data to Migrate

**From status table:**
- Total entries: ~80-100 status entries (estimated)
- Distribution:
  - tasks: 7 entries
  - events: 7 + 7 common = 14 entries
  - posts: 3 + 7 common = 10 entries
  - projects: 3 + 7 common = 10 entries
  - users: 5 + 7 common = 12 entries
  - persons: 5 + 7 common = 12 entries
  - images: 6 entries
  - interactions: 7 common entries
  - locations: 7 common entries (assumed)
  - participants: 7 common entries (assumed)
  - instructors: 7 common entries (assumed)

**From tags table:**
- Currently EMPTY (no seed data)
- Used only in images table as BYTEA bitmasks
- Junction tables exist but likely empty

### Schema Challenges

**1. Non-Power-of-2 Values:**
```typescript
// These cannot be OR'ed together safely
{ value: 3 }   // Not 2^n
{ value: 5 }   // Not 2^n
{ value: 6 }   // Not 2^n
{ value: 9 }   // Not 2^n
{ value: 12 }  // Not 2^n
{ value: 48 }  // 32 + 16 (combination)
```

**Solution:** Convert to proper bitmask or keep as sequential IDs
- Option A: Renumber all values to powers of 2
- Option B: Keep current values, treat as IDs (not bitmasks)
- Option C: Hybrid - powers of 2 for new system, mapping for old

**2. Table-Specific Status:**
```sql
-- Same name, different tables
('draft', 'tasks')
('draft', 'events')
('draft', 'posts')
('draft', 'projects')
```

**Solution:** 
- New sysreg system doesn't need table-specific entries
- Unified status values across all entities
- tagfamily='status' distinguishes from other tag types

**3. Junction Table Migration:**
```sql
-- events_tags: event_id ↔ tag_id (many-to-many)
-- Target: events.ctags_val BYTEA (bitmask OR of tag values)
```

**Solution:**
- Aggregate junction table entries into single bitmask
- BIT_OR operation on tag values
- Store in ctags_val column

---

## Migration 023 Requirements

### Objects to Deprecate

**Tables:**
```sql
ALTER TABLE status RENAME TO status_depr
ALTER TABLE tags RENAME TO tags_depr
ALTER TABLE events_tags RENAME TO events_tags_depr
ALTER TABLE posts_tags RENAME TO posts_tags_depr
```

**Columns in entity tables:**
```sql
-- 8 entity tables with status_id
ALTER TABLE projects RENAME COLUMN status_id TO status_id_depr
ALTER TABLE events RENAME COLUMN status_id TO status_id_depr
ALTER TABLE posts RENAME COLUMN status_id TO status_id_depr
ALTER TABLE participants RENAME COLUMN status_id TO status_id_depr
ALTER TABLE instructors RENAME COLUMN status_id TO status_id_depr
ALTER TABLE tasks RENAME COLUMN status_id TO status_id_depr
ALTER TABLE locations RENAME COLUMN status_id TO status_id_depr
ALTER TABLE users RENAME COLUMN status_id TO status_id_depr

-- Drop generated columns (cannot rename GENERATED columns)
ALTER TABLE projects DROP COLUMN status_display
ALTER TABLE events DROP COLUMN status_display
ALTER TABLE posts DROP COLUMN status_display
ALTER TABLE participants DROP COLUMN status_display
ALTER TABLE instructors DROP COLUMN status_display
ALTER TABLE tasks DROP COLUMN status_display
ALTER TABLE locations DROP COLUMN status_display
ALTER TABLE users DROP COLUMN status_display

-- Rename tag columns
ALTER TABLE events RENAME COLUMN tags_ids TO tags_ids_depr
ALTER TABLE events RENAME COLUMN tags_display TO tags_display_depr
ALTER TABLE posts RENAME COLUMN tags_ids TO tags_ids_depr
ALTER TABLE posts RENAME COLUMN tags_display TO tags_display_depr
```

**FK Constraints:**
```sql
-- Drop all FK constraints to status table
ALTER TABLE projects DROP CONSTRAINT projects_status_id_fkey
ALTER TABLE events DROP CONSTRAINT events_status_id_fkey
-- ... (8 total)
```

**Functions:**
```sql
-- Keep get_status_display_name (may still be used by _depr columns)
-- Drop tag trigger functions after triggers dropped
```

**Triggers:**
```sql
DROP TRIGGER events_tags_trigger ON events_tags
DROP TRIGGER posts_tags_trigger ON posts_tags
```

---

## Migration 024 Requirements

### New Tables to Create

**6 inherited tables:**
```sql
CREATE TABLE status () INHERITS (sysreg);
CREATE TABLE config () INHERITS (sysreg);
CREATE TABLE rtags () INHERITS (sysreg);
CREATE TABLE ctags () INHERITS (sysreg);
CREATE TABLE ttags () INHERITS (sysreg);
CREATE TABLE dtags () INHERITS (sysreg);
```

**Metadata tables:**
```sql
CREATE TABLE alltables (
    is_entity BOOLEAN DEFAULT FALSE
) INHERITS (sysreg);

CREATE TABLE entities () INHERITS (alltables);
-- Seed with:
--   Full entities: projects, events, posts, persons, images
--   Partial entities: users, tasks, interactions (limited sysreg support only)
```

---

## Migration 025 Requirements

### Columns to Add (per entity table)

**Remove:**
- status_id_depr (after data migrated)
- status_display (already dropped in 023)
- tags_ids_depr (after data migrated)
- tags_display_depr (after data migrated)

**Add (Full entities - projects, events, posts, persons, images):**
```sql
-- All 6 tagfamilies (NO FK constraints - value-based lookup only)
ALTER TABLE {entity} ADD COLUMN status_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN config_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN rtags_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN ctags_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN ttags_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN dtags_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN lang TEXT DEFAULT 'en' (if not exists)

-- Generated columns (replace old status_display)
ALTER TABLE {entity} ADD COLUMN status_label TEXT 
    GENERATED ALWAYS AS (get_status_label(status_val, lang)) STORED

ALTER TABLE {entity} ADD COLUMN status_desc TEXT
    GENERATED ALWAYS AS (get_status_desc(status_val, lang)) STORED
```

**Add (Partial entities - users, tasks, interactions):**
```sql
-- Only 3 tagfamilies: status, rtags, config (NO FK constraints)
ALTER TABLE {entity} ADD COLUMN status_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN config_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN rtags_val BYTEA DEFAULT NULL
ALTER TABLE {entity} ADD COLUMN lang TEXT DEFAULT 'en' (if not exists)

-- Generated columns
ALTER TABLE {entity} ADD COLUMN status_label TEXT 
    GENERATED ALWAYS AS (get_status_label(status_val, lang)) STORED

ALTER TABLE {entity} ADD COLUMN status_desc TEXT
    GENERATED ALWAYS AS (get_status_desc(status_val, lang)) STORED
```

---

## Data Migration Complexity (Migration 027)

### Status Migration

**Challenge:** Map INTEGER status_id → BYTEA status_val

```sql
-- Create mapping table
CREATE TEMP TABLE status_migration_map AS
SELECT 
    sd.id as old_id,
    sd.value as old_value,
    sd.name,
    sd."table",
    -- New BYTEA value (convert SMALLINT to BYTEA)
    int2send(sd.value)::bytea as new_value
FROM status_depr sd;

-- Migrate per entity table
UPDATE projects p
SET status_val = m.new_value
FROM status_migration_map m
WHERE p.status_id_depr = m.old_id 
  AND m."table" = 'projects';
```

**Complication:** Non-power-of-2 values
- value=3, 5, 6, 9, 12, 48 cannot be combined with OR
- Need to decide: keep as-is or renumber?

### Tags Migration

**Challenge:** Junction table → Bitmask

```sql
-- events_tags: multiple tag_id per event_id
-- Target: single BYTEA with OR'ed bits

UPDATE events e
SET ctags_val = (
    SELECT BIT_OR(t.value::bit(64)::bigint)::bit(64)::bytea
    FROM events_tags_depr et
    JOIN tags_depr t ON t.id = et.tag_id
    WHERE et.event_id = e.id
);
```

**Complication:** tags_depr table is EMPTY
- No actual data to migrate
- Only need to handle schema

---

## Recommendations for Migration 022

### 1. Value Normalization Strategy

**Option A: Keep Original Values (Recommended)**
- Migrate value as-is (3 → 0x03, 12 → 0x0C)
- New system uses proper bitmasks (powers of 2)
- Old values marked with special flag in sysreg

**Option B: Renumber Everything**
- Map all existing status values to new powers of 2
- More complex migration, but cleaner result
- Risk of breaking existing code

**Recommendation:** Option A - preserve old values for compatibility, use new bitmask system going forward.

### 2. taglogic Inference

```typescript
function inferTagLogic(statusName: string, tableName: string): string {
    // All statuses are categories (required)
    if (tableName.includes('status')) {
        // Check for chaining pattern
        if (statusName.includes(' > ')) {
            return 'subcategory'
        }
        return 'category'
    }
    
    // Tags (currently empty, but prepare for future)
    return 'toggle'  // Default for unknown tags
}
```

### 3. is_default Detection

```typescript
function inferIsDefault(statusName: string, value: number): boolean {
    // value=0 is usually default
    if (value === 0) return true
    
    // Common default names
    if (['new', 'all', 'default'].includes(statusName)) {
        return true
    }
    
    return false
}
```

---

## Next Steps

**Phase 1 Complete ✅**

Ready to proceed to **Phase 2: Implement Migration 022**

**Key Decisions Made:**
1. Keep original status values (no renumbering)
2. Infer taglogic from usage patterns
3. Use 3-level NULL strategy (NULL / 0x00 / is_default)
4. Migrate tags structure even though data is empty

**Estimated Migration 022 Size:**
- ~500 lines of code
- ~80-100 INSERT statements (status entries)
- Complex BYTEA conversion logic
- Comprehensive down() function

**Ready to implement!**
