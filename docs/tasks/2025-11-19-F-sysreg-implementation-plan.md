# SYSREG System Implementation Plan
**Date:** 2025-11-19  
**Branch:** alpha/status  
**Package:** C (Migrations 022-029)

---

## Executive Summary

**Goal:** Create a unified bitmask-based tagging and status system (`sysreg`) that replaces the existing `status` and `tags` tables with a PostgreSQL table inheritance architecture.

**Key Features:**
- 6 tag families (status, config, rtags, ctags, ttags, dtags)
- Bitmask-based values for efficient storage
- i18n support for all labels
- Chaining/variation support (e.g., `new > idea`, `teen > 12-15`)
- Type-safe code generation for frontend
- Reversible migrations

**Scope:** Migrations 022-027 (Package C)

---

## Architecture Overview

### Current System (Migration 019)
```
status table:
  - id (SERIAL)
  - value (SMALLINT) - hex bitmask
  - name (TEXT)
  - table (TEXT) - CHECK constraint for specific tables
  - description (TEXT)
  - name_i18n (JSONB)
  - desc_i18n (JSONB)

tags table:
  - id (SERIAL)
  - name (TEXT UNIQUE)
  - description (TEXT)
  - name_i18n (JSONB)
  - desc_i18n (JSONB)

Entity tables (projects, events, posts, etc.):
  - status_id (INTEGER FK → status.id)
  - status_display (generated column)
  - *_tags junction tables (entity_id, tag_id)
```

### Target System (Migrations 022-024)
```
sysreg (parent table):
  - id (SERIAL PRIMARY KEY)
  - value (BYTEA) - max bits available
  - name (TEXT NOT NULL)
  - description (TEXT)
  - name_i18n (JSONB)
  - desc_i18n (JSONB)
  - taglogic (TEXT) - category|subcategory|toggle|option
  - is_default (BOOLEAN)
  - tagfamily (TEXT) - status|config|rtags|ctags|ttags|dtags
  - table_vals (BYTEA[]) - for inheritance tracking
  - table_names (TEXT[] GENERATED) - from alltables
  - UNIQUE(value, tagfamily)

Inherited tables (6):
  status      (tagfamily='status')
  config      (tagfamily='config')
  rtags       (tagfamily='rtags')
  ctags       (tagfamily='ctags')
  ttags       (tagfamily='ttags')
  dtags       (tagfamily='dtags')

alltables (metadata table):
  - inherits from sysreg
  - is_entity (BOOLEAN)

entities (entity registry):
  - inherits from alltables
  - is_entity = TRUE
  - Full entities: projects, events, posts, persons, images
    → All 6 tagfamilies: status, config, rtags, ctags, ttags, dtags
  - Partial entities: users, tasks, interactions (limited sysreg support)
    → Only 3 tagfamilies: status, rtags, config
```

### Target Entity Schema (Migration 025)
```
Full entity tables (projects, events, posts, persons, images):
  - Remove: status_id, status_display, status (generated)
  - Add: status_val (BYTEA) -- NO FK constraint (value-based lookup)
  - Add: status_label (TEXT GENERATED from lang + status_val)
  - Add: status_desc (TEXT GENERATED from lang + status_val)
  - Add: config_val (BYTEA) -- NO FK constraint
  - Add: rtags_val (BYTEA) -- NO FK constraint
  - Add: ctags_val (BYTEA) -- NO FK constraint
  - Add: ttags_val (BYTEA) -- NO FK constraint
  - Add: dtags_val (BYTEA) -- NO FK constraint

Partial entity tables (users, tasks, interactions):
  - Remove: status_id, status_display, status (generated)
  - Add: status_val (BYTEA) -- NO FK constraint (value-based lookup)
  - Add: status_label (TEXT GENERATED from lang + status_val)
  - Add: status_desc (TEXT GENERATED from lang + status_val)
  - Add: config_val (BYTEA) -- NO FK constraint
  - Add: rtags_val (BYTEA) -- NO FK constraint
  - Note: NO ctags, ttags, or dtags fields

FK Strategy: NO foreign key constraints on *_val fields
  - Reason: Performance, flexibility for bit operations, immutable values
  - Validation: Application-level only
  - Lookups: Direct value comparison in generated columns/functions
```

---

## Phase-by-Phase Breakdown

### PHASE 1: Research & Analysis (30 min)

**Task 1.1: Analyze Existing Schema**
- Read migration 019 completely (4084 lines)
- Document current status table structure
- Document current tags table structure
- Find all entity tables with status_id
- Find all *_tags junction tables
- Document existing status values and their bitmasks
- Document existing tag values

**Task 1.2: Identify Dependencies**
- List all FK constraints to status table
- List all FK constraints to tags table
- Find generated columns using status_id
- Find API endpoints reading/writing status
- Find API endpoints reading/writing tags
- Document trigger dependencies

**Deliverable:** `docs/tasks/2025-11-19-F-sysreg-analysis.md`

---

### PHASE 2: Migration 022 - Create sysreg Core (2-3 hours)

**Task 2.1: Design sysreg Table**
```sql
CREATE TABLE sysreg (
    id SERIAL PRIMARY KEY,
    value BYTEA NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    name_i18n JSONB,
    desc_i18n JSONB,
    taglogic TEXT NOT NULL CHECK (taglogic IN ('category', 'subcategory', 'toggle', 'option')),
    is_default BOOLEAN DEFAULT FALSE,
    tagfamily TEXT NOT NULL CHECK (tagfamily IN ('status', 'config', 'rtags', 'ctags', 'ttags', 'dtags')),
    table_vals BYTEA[],
    table_names TEXT[] GENERATED ALWAYS AS (
        -- Lookup from alltables
    ) STORED,
    CONSTRAINT unique_value_family UNIQUE (value, tagfamily)
)
```

**Task 2.2: Migrate Existing Data**
- Copy status table → sysreg (tagfamily='status')
  - Convert SMALLINT value → BYTEA
  - Add taglogic based on name patterns
  - Set is_default for 'new' status
- Copy tags table → sysreg (tagfamily='ctags' or 'ttags')
  - Generate BYTEA values (sequential allocation)
  - Determine taglogic from tag usage patterns
  
**Task 2.3: Create Indexes**
```sql
CREATE INDEX idx_sysreg_name ON sysreg(name)
CREATE INDEX idx_sysreg_tagfamily ON sysreg(tagfamily)
CREATE INDEX idx_sysreg_value ON sysreg USING hash (value)
CREATE INDEX idx_sysreg_name_family ON sysreg(name, tagfamily)
```

**Task 2.4: Implement down() Function**
- Drop sysreg table
- Data preserved in status_depr/tags_depr (created in 023)

**Deliverable:** `server/database/migrations/022_create_sysreg.ts`

---

### PHASE 3: Migration 023 - Deprecate Old System (1-2 hours)

**Task 3.1: Document Existing Relations**
Generate markdown documenting:
- All FK constraints to status table
- All FK constraints to tags table
- All generated columns using status_id
- All *_tags junction tables
- Example: `events.status_id FK → status.id`

**Task 3.2: Unlink Constraints**
```sql
-- Drop FK constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_id_fkey;
-- ... for all entity tables

-- Drop junction tables
DROP TABLE IF EXISTS events_tags;
DROP TABLE IF EXISTS posts_tags;
-- ... for all junction tables
```

**Task 3.3: Rename Old Tables**
```sql
ALTER TABLE status RENAME TO status_depr;
ALTER TABLE tags RENAME TO tags_depr;
```

**Task 3.4: Rename Old Columns**
```sql
-- Entity tables
ALTER TABLE projects RENAME COLUMN status_id TO status_id_depr;
ALTER TABLE projects DROP COLUMN IF EXISTS status_display; -- generated
ALTER TABLE events RENAME COLUMN status_id TO status_id_depr;
-- ... for all entity tables
```

**Task 3.5: Implement down() Function**
- Rename tables back (status_depr → status)
- Rename columns back (*_depr → original)
- Recreate FK constraints
- Recreate junction tables

**Deliverable:** 
- `server/database/migrations/023_deprecate_old_status_tags.ts`
- `docs/tasks/2025-11-19-G-old-system-relations.md` (auto-generated)

---

### PHASE 4: Migration 024 - Create Inherited Tables (2-3 hours)

**Task 4.1: Create 6 Inherited Tables**
```sql
CREATE TABLE status () INHERITS (sysreg);
ALTER TABLE status ADD CONSTRAINT check_status_family 
    CHECK (tagfamily = 'status');

CREATE TABLE config () INHERITS (sysreg);
ALTER TABLE config ADD CONSTRAINT check_config_family 
    CHECK (tagfamily = 'config');

-- ... repeat for rtags, ctags, ttags, dtags
```

**Task 4.2: Create alltables Registry**
```sql
CREATE TABLE alltables (
    is_entity BOOLEAN DEFAULT FALSE
) INHERITS (sysreg);
```

**Task 4.3: Create entities Registry**
```sql
CREATE TABLE entities () INHERITS (alltables);
ALTER TABLE entities ADD CONSTRAINT check_entities_is_entity 
    CHECK (is_entity = TRUE);

-- Seed entity registry
INSERT INTO entities (name, is_entity, tagfamily) VALUES
    ('projects', TRUE, 'status'),
    ('events', TRUE, 'status'),
    ('posts', TRUE, 'status'),
    ('persons', TRUE, 'status'),
    ('users', TRUE, 'status'),
    ('tasks', TRUE, 'status'),
    ('interactions', TRUE, 'status'),
    ('images', TRUE, 'status');
```

**Task 4.4: Update sysreg Schema**
```sql
-- Add generated column for table_names
ALTER TABLE sysreg ADD COLUMN table_names TEXT[] 
    GENERATED ALWAYS AS (
        SELECT ARRAY_AGG(name) 
        FROM alltables 
        WHERE value = ANY(table_vals)
    ) STORED;
```

**Task 4.5: Implement down() Function**
- Drop entities table
- Drop alltables table
- Drop 6 inherited tables
- Remove table_names column from sysreg

**Deliverable:** `server/database/migrations/024_create_inherited_tables.ts`

---

### PHASE 5: Migration 025 - Align Entity Tables (3-4 hours)

**Task 5.1: Entity Table Schema Changes**

**Part A: Remove Old Columns**
```sql
-- For each entity table (projects, events, posts, etc.)
ALTER TABLE {entity} DROP COLUMN IF EXISTS status_id_depr;
ALTER TABLE {entity} DROP COLUMN IF EXISTS status; -- if generated
```

**Part B: Add New Columns**
```sql
-- For each entity table
ALTER TABLE {entity} ADD COLUMN status_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN config_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN rtags_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN ctags_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN ttags_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN dtags_val BYTEA DEFAULT NULL;
ALTER TABLE {entity} ADD COLUMN lang TEXT DEFAULT 'en';
```

**Part C: Add Generated Columns**
```sql
-- Create lookup function
CREATE OR REPLACE FUNCTION get_status_label(
    p_value BYTEA, 
    p_lang TEXT DEFAULT 'en'
) RETURNS TEXT AS $$
    SELECT COALESCE(
        name_i18n->>p_lang,
        name
    )
    FROM status
    WHERE value = p_value
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Add generated columns
ALTER TABLE {entity} ADD COLUMN status_label TEXT 
    GENERATED ALWAYS AS (
        get_status_label(status_val, lang)
    ) STORED;

ALTER TABLE {entity} ADD COLUMN status_desc TEXT 
    GENERATED ALWAYS AS (
        get_status_desc(status_val, lang)
    ) STORED;
```

**Task 5.2: Create Endpoint Registry**

Generate `docs/tasks/2025-11-19-H-entity-endpoints-registry.md`:
```markdown
# Entity Endpoints Registry

## Projects
### API Endpoints
- [ ] GET /api/projects (read status_id → migrate to status_val)
- [ ] GET /api/projects/[id] (read status_id)
- [ ] POST /api/projects (write status_id)
- [ ] PUT /api/projects/[id] (write status_id)

### Components
- `src/components/ProjectList.vue` (reads status)
- `src/components/ProjectForm.vue` (writes status)

### Composables
- `src/composables/useProjects.ts` (status handling)

## Events
...
```

**Task 5.3: Implement down() Function**
- Drop generated columns
- Drop lookup functions
- Remove new *_val columns
- Restore status_id_depr columns (rename back)

**Deliverable:**
- `server/database/migrations/025_align_entity_tables.ts`
- `docs/tasks/2025-11-19-H-entity-endpoints-registry.md` (auto-generated)

---

### PHASE 6: Migration 026 - Seed New System (2-3 hours)

**Task 6.1: Analyze Existing Data**
```sql
-- Find all unique status values in use
SELECT DISTINCT s.name, s.value, s."table", COUNT(*) as usage_count
FROM status_depr s
LEFT JOIN projects p ON p.status_id_depr = s.id
LEFT JOIN events e ON e.status_id_depr = s.id
-- ... join all entity tables
GROUP BY s.name, s.value, s."table"
ORDER BY s."table", s.value;

-- Find all unique tags in use
SELECT t.name, COUNT(et.event_id) as event_usage, COUNT(pt.post_id) as post_usage
FROM tags_depr t
LEFT JOIN events_tags et ON et.tag_id = t.id
LEFT JOIN posts_tags pt ON pt.tag_id = t.id
GROUP BY t.name
ORDER BY (COUNT(et.event_id) + COUNT(pt.post_id)) DESC;
```

**Task 6.2: Seed Status Values**

Insert common statuses into status table:
```sql
-- System statuses (universal)
INSERT INTO status (value, name, taglogic, is_default, tagfamily, name_i18n, desc_i18n)
VALUES 
    (E'\\x00'::bytea, 'new', 'category', TRUE, 'status', 
     '{"en":"New","de":"Neu","cz":"Nový"}'::jsonb,
     '{"en":"Newly created","de":"Neu erstellt","cz":"Nově vytvořeno"}'::jsonb),
    (E'\\x01'::bytea, 'draft', 'category', FALSE, 'status',
     '{"en":"Draft","de":"Entwurf","cz":"Koncept"}'::jsonb,
     '{"en":"Work in progress","de":"In Bearbeitung","cz":"Rozpracováno"}'::jsonb),
    -- ... all other statuses

-- Status variations (chaining)
INSERT INTO status (value, name, taglogic, is_default, tagfamily, name_i18n, desc_i18n)
VALUES
    (E'\\x0001'::bytea, 'new > idea', 'subcategory', FALSE, 'status',
     '{"en":"Idea","de":"Idee","cz":"Nápad"}'::jsonb, ...),
    (E'\\x0002'::bytea, 'new > template', 'subcategory', FALSE, 'status', ...);
```

**Task 6.3: Seed Common Tags (ctags)**

Age groups example:
```sql
INSERT INTO ctags (value, name, taglogic, is_default, tagfamily, name_i18n)
VALUES
    -- Age categories (2 bits)
    (E'\\x01'::bytea, 'age > all', 'category', TRUE, 'ctags', 
     '{"en":"All ages","de":"Alle Altersgruppen","cz":"Všechny věkové skupiny"}'::jsonb),
    (E'\\x02'::bytea, 'age > child', 'category', FALSE, 'ctags',
     '{"en":"Children","de":"Kinder","cz":"Děti"}'::jsonb),
    (E'\\x04'::bytea, 'age > teen', 'category', FALSE, 'ctags', ...),
    (E'\\x08'::bytea, 'age > adult', 'category', FALSE, 'ctags', ...),
    
    -- Sub-age child group (2 bits each)
    (E'\\x0100'::bytea, 'sub-age > 3-6', 'subcategory', FALSE, 'ctags', ...),
    (E'\\x0200'::bytea, 'sub-age > 6-9', 'subcategory', FALSE, 'ctags', ...),
    (E'\\x0400'::bytea, 'sub-age > 9-12', 'subcategory', FALSE, 'ctags', ...),
    
    -- Sub-age teen group
    (E'\\x1000'::bytea, 'sub-age > 12-15', 'subcategory', FALSE, 'ctags', ...),
    (E'\\x2000'::bytea, 'sub-age > 15-18', 'subcategory', FALSE, 'ctags', ...),
    (E'\\x4000'::bytea, 'sub-age > 18-27', 'subcategory', FALSE, 'ctags', ...);
```

**Task 6.4: Seed Topic Tags (ttags)**
```sql
INSERT INTO ttags (value, name, taglogic, is_default, tagfamily, name_i18n)
VALUES
    (E'\\x01'::bytea, 'democracy', 'category', FALSE, 'ttags', ...),
    (E'\\x0101'::bytea, 'democracy > constitution', 'subcategory', FALSE, 'ttags', ...),
    (E'\\x02'::bytea, 'diversity', 'category', FALSE, 'ttags', ...),
    (E'\\x0201'::bytea, 'diversity > gender', 'subcategory', FALSE, 'ttags', ...);
```

**Task 6.5: Seed Domain Tags (dtags)**
```sql
INSERT INTO dtags (value, name, taglogic, is_default, tagfamily, name_i18n)
VALUES
    (E'\\x01'::bytea, 'raumlauf', 'category', FALSE, 'dtags', ...),
    (E'\\x02'::bytea, 'kreisspiel', 'category', FALSE, 'dtags', ...),
    (E'\\x0201'::bytea, 'kreisspiel > impulskreis', 'subcategory', FALSE, 'dtags', ...);
```

**Task 6.6: Cross-Check Compatibility**
```sql
-- Verify all existing status_id_depr values have equivalent in new system
SELECT p.id, p.status_id_depr, sd.name, s.name as new_name
FROM projects p
LEFT JOIN status_depr sd ON sd.id = p.status_id_depr
LEFT JOIN status s ON s.name = sd.name
WHERE p.status_id_depr IS NOT NULL AND s.id IS NULL;

-- Should return 0 rows (all mapped)
```

**Task 6.7: Implement down() Function**
- Truncate all seeded data from status, ctags, ttags, dtags tables

**Deliverable:**
- `server/database/migrations/026_seed_sysreg_system.ts`
- `docs/tasks/2025-11-19-I-sysreg-seed-data.md` (documentation)

---

### PHASE 7: Migration 027 - Migrate Entity Data (2-3 hours)

**Task 7.1: Map status_id_depr → status_val**

```sql
-- Create temporary mapping table
CREATE TEMP TABLE status_migration_map AS
SELECT 
    sd.id as old_id,
    sd.name,
    s.value as new_value,
    sd."table"
FROM status_depr sd
JOIN status s ON s.name = sd.name;

-- Migrate projects
UPDATE projects p
SET status_val = m.new_value
FROM status_migration_map m
WHERE p.status_id_depr = m.old_id 
  AND m."table" = 'projects';

-- Repeat for all entity tables
UPDATE events e SET status_val = m.new_value
FROM status_migration_map m
WHERE e.status_id_depr = m.old_id AND m."table" = 'events';

-- ... all other entity tables
```

**Task 7.2: Map tags → ctags_val/ttags_val**

```sql
-- Analyze which tags belong to which family
-- (This may require manual classification or heuristics)

-- Example: age-related tags → ctags
UPDATE events e
SET ctags_val = (
    SELECT BIT_OR(ct.value::bit(64)::bigint)::bit(64)::bytea
    FROM events_tags_depr et
    JOIN tags_depr t ON t.id = et.tag_id
    JOIN ctags ct ON ct.name = t.name
    WHERE et.event_id = e.id
      AND t.name LIKE 'age%' OR t.name LIKE '%child%' OR t.name LIKE '%teen%'
);

-- Example: topic tags → ttags
UPDATE events e
SET ttags_val = (
    SELECT BIT_OR(tt.value::bit(64)::bigint)::bit(64)::bytea
    FROM events_tags_depr et
    JOIN tags_depr t ON t.id = et.tag_id
    JOIN ttags tt ON tt.name = t.name
    WHERE et.event_id = e.id
      AND t.name IN ('democracy', 'diversity', ...)
);
```

**Task 7.3: Validate Data Migration**

```sql
-- Count records migrated
SELECT 
    'projects' as table_name,
    COUNT(*) as total,
    COUNT(status_val) as migrated_status,
    COUNT(status_id_depr) as had_old_status
FROM projects
UNION ALL
SELECT 'events', COUNT(*), COUNT(status_val), COUNT(status_id_depr) FROM events
UNION ALL
SELECT 'posts', COUNT(*), COUNT(status_val), COUNT(status_id_depr) FROM posts;

-- Verify no data loss
SELECT 'projects' as table_name, COUNT(*) as unmigrated
FROM projects 
WHERE status_id_depr IS NOT NULL AND status_val IS NULL
UNION ALL
SELECT 'events', COUNT(*) FROM events 
WHERE status_id_depr IS NOT NULL AND status_val IS NULL;

-- Should return 0 unmigrated for all tables
```

**Task 7.4: Drop Deprecated Columns**

```sql
-- Drop _depr columns from all entity tables
ALTER TABLE projects DROP COLUMN IF EXISTS status_id_depr;
ALTER TABLE events DROP COLUMN IF EXISTS status_id_depr;
-- ... all entity tables

-- Drop _depr tables
DROP TABLE IF EXISTS events_tags_depr;
DROP TABLE IF EXISTS posts_tags_depr;
DROP TABLE IF EXISTS status_depr;
DROP TABLE IF EXISTS tags_depr;
```

**Task 7.5: Implement down() Function**

WARNING: This will lose data!
```sql
-- Restore _depr columns
ALTER TABLE projects ADD COLUMN status_id_depr INTEGER;

-- Reverse mapping (best-effort)
UPDATE projects p
SET status_id_depr = (
    SELECT sd.id 
    FROM status_depr sd
    JOIN status s ON s.name = sd.name
    WHERE s.value = p.status_val
    LIMIT 1
);

-- Restore junction tables from bitmask values
-- (Complex reverse operation, may lose multi-tag data)
```

**Deliverable:**
- `server/database/migrations/027_migrate_entity_data.ts`
- `docs/tasks/2025-11-19-J-data-migration-report.md` (validation results)

---

### PHASE 8: Code Generator Planning (1-2 hours)

**Task 8.1: Design Type Generation Strategy**

**Input:** PostgreSQL sysreg data
**Output:** TypeScript enums and interfaces

**Example Output:**
```typescript
// Generated: src/types/sysreg-status.ts
export enum StatusValue {
    NEW = 0x00,
    NEW_IDEA = 0x0001,
    NEW_TEMPLATE = 0x0002,
    DRAFT = 0x01,
    ACTIVE = 0x02,
    FINAL = 0x04,
    TRASH = 0x08,
}

export const StatusLabels: Record<StatusValue, Record<Lang, string>> = {
    [StatusValue.NEW]: { en: 'New', de: 'Neu', cz: 'Nový' },
    [StatusValue.NEW_IDEA]: { en: 'Idea', de: 'Idee', cz: 'Nápad' },
    // ...
}

export interface StatusBitmask {
    value: number // or Uint8Array for BYTEA
    label: string
    description?: string
}

// Generated: src/types/sysreg-ctags.ts
export enum CTagsAge {
    ALL = 0x01,
    CHILD = 0x02,
    TEEN = 0x04,
    ADULT = 0x08,
}

export enum CTagsSubAge {
    CHILD_3_6 = 0x0100,
    CHILD_6_9 = 0x0200,
    CHILD_9_12 = 0x0400,
    TEEN_12_15 = 0x1000,
    // ...
}
```

**Task 8.2: Design Code Generator Tool**

```bash
# Usage
pnpm generate:types
```

**Implementation:**
```typescript
// scripts/generate-sysreg-types.ts
import { db } from '../server/database/init.js'

async function generateTypes() {
    // Query all sysreg data
    const statusData = await db.all('SELECT * FROM status ORDER BY value')
    const ctagsData = await db.all('SELECT * FROM ctags ORDER BY value')
    // ... other families
    
    // Generate TypeScript files
    await generateStatusTypes(statusData)
    await generateCTagsTypes(ctagsData)
    // ...
}
```

**Task 8.3: Create npm Script**
```json
{
  "scripts": {
    "generate:types": "tsx scripts/generate-sysreg-types.ts"
  }
}
```

**Deliverable:**
- Design document: `docs/tasks/2025-11-19-K-code-generator-design.md`
- (Implementation deferred to separate session)

---

## Testing Strategy

### Migration Testing Workflow

For each migration 022-027:

```bash
# 1. Check current state
pnpm db:migrate:status

# 2. Run migration
pnpm db:migrate

# 3. Verify changes
psql -U crearis_admin -d crearis_admin_dev -c "\d sysreg"
psql -U crearis_admin -d crearis_admin_dev -c "SELECT * FROM status LIMIT 5"

# 4. Test with sample queries
psql -U crearis_admin -d crearis_admin_dev -c "
    SELECT p.id, p.status_val, p.status_label, p.status_desc 
    FROM projects p 
    LIMIT 5
"

# 5. Test rollback (dry-run first)
pnpm db:rollback

# 6. Execute rollback
pnpm db:rollback --force

# 7. Verify rollback
psql -U crearis_admin -d crearis_admin_dev -c "\d"

# 8. Re-run migration
pnpm db:migrate
```

### Data Validation Queries

```sql
-- Verify no data loss (Migration 027)
SELECT 
    (SELECT COUNT(*) FROM projects WHERE status_id_depr IS NOT NULL) as old_count,
    (SELECT COUNT(*) FROM projects WHERE status_val IS NOT NULL) as new_count,
    (SELECT COUNT(*) FROM projects WHERE status_id_depr IS NOT NULL AND status_val IS NULL) as lost_count;

-- Verify bitmask encoding
SELECT 
    status_val,
    status_label,
    encode(status_val, 'hex') as hex_value
FROM projects
WHERE status_val IS NOT NULL
LIMIT 10;

-- Verify generated columns
SELECT id, lang, status_val, status_label, status_desc
FROM events
WHERE status_label IS NULL AND status_val IS NOT NULL;
-- Should return 0 rows
```

---

## Risk Assessment

### High Risk Areas

1. **Data Loss in Migration 027**
   - **Risk:** status_id_depr → status_val mapping fails
   - **Mitigation:** Extensive validation queries, backup before migration
   - **Rollback:** Complex reverse mapping, may lose data

2. **Junction Table Migration**
   - **Risk:** events_tags → ctags_val loses multi-tag relationships
   - **Mitigation:** Bitmask OR operations preserve combinations
   - **Validation:** Count total tags before/after

3. **Generated Column Performance**
   - **Risk:** status_label lookup function slows queries
   - **Mitigation:** Use STORED (not VIRTUAL), index on value
   - **Testing:** Benchmark before/after on large datasets

4. **PostgreSQL Table Inheritance Complexity**
   - **Risk:** Queries on parent table scan all children
   - **Mitigation:** Always query specific child table (status, not sysreg)
   - **Documentation:** Clear guidelines for developers

### Medium Risk Areas

1. **Bitmask Allocation Conflicts**
   - **Risk:** Two tags get same value in different tagfamilies
   - **Mitigation:** UNIQUE(value, tagfamily) constraint
   
2. **i18n Fallback Logic**
   - **Risk:** Missing translations show NULL
   - **Mitigation:** COALESCE(name_i18n->>'lang', name)

3. **API Endpoint Breaking Changes**
   - **Risk:** Frontend expects status_id, gets status_val
   - **Mitigation:** Update endpoints in migration 025, document in registry

---

## Timeline Estimate

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Research & Analysis | 30 min |
| 2 | Migration 022 (sysreg core) | 2-3 hours |
| 3 | Migration 023 (deprecate old) | 1-2 hours |
| 4 | Migration 024 (inherited tables) | 2-3 hours |
| 5 | Migration 025 (align entities) | 3-4 hours |
| 6 | Migration 026 (seed system) | 2-3 hours |
| 7 | Migration 027 (migrate data) | 2-3 hours |
| 8 | Code generator planning | 1-2 hours |
| **TOTAL** | | **14-20 hours** |

**Recommendation:** Split into 3 sessions:
- **Session 1:** Phases 1-2 (Research + Migration 022)
- **Session 2:** Phases 3-5 (Migrations 023-025)
- **Session 3:** Phases 6-7 (Migrations 026-027)
- **Session 4:** Phase 8 + Frontend refactoring (separate plan)

---

## Success Criteria

### Migration 022-024 Complete:
- ✅ sysreg table created with proper constraints
- ✅ 6 inherited tables (status, config, rtags, ctags, ttags, dtags) functioning
- ✅ alltables and entities registry seeded
- ✅ Old status/tags tables renamed to *_depr
- ✅ All migrations reversible with down() functions
- ✅ No data lost (preserved in _depr tables)

### Migration 025 Complete:
- ✅ All entity tables have *_val columns (6 per table)
- ✅ Generated columns (status_label, status_desc) working
- ✅ Lookup functions performant (< 1ms per call)
- ✅ Endpoint registry created with all affected files

### Migration 026-027 Complete:
- ✅ All existing status values seeded in new system
- ✅ All existing tags classified and seeded
- ✅ All entity records migrated (0 lost_count)
- ✅ Bitmask encoding validated (hex values correct)
- ✅ Multi-tag combinations preserved
- ✅ Old _depr columns dropped
- ✅ Old _depr tables dropped

### Overall System:
- ✅ No regressions in existing functionality
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Code generator design approved
- ✅ Team trained on new system

---

## Next Steps (After Completion)

1. **Frontend Migration (2025-11-19-E-draft_sysreg_gui_refactor.md)**
   - Update components to use bitmask values
   - Create tag manager components
   - Implement i18n integration

2. **Code Generator Implementation**
   - Build TypeScript type generator
   - Integrate with build process
   - Document usage for developers

3. **API Endpoint Updates**
   - Update all endpoints in registry
   - Add bitmask utility functions
   - Create migration guide for API consumers

4. **Performance Optimization**
   - Benchmark query performance
   - Add indexes as needed
   - Consider caching strategies

---

## Questions for User - ANSWERED ✅

### 1. Bitmask Size
**Answer:** BYTEA unlimited, each tagfamily gets own table with FK references. System is configurable - can add new tag groups dynamically. No size limits.

**Implementation:** Each inherited table (status, ctags, etc.) stores BYTEA values without size constraints. Value uniqueness enforced per tagfamily via `UNIQUE(value, tagfamily)`.

### 2. Tag Classification
**Answer:** Prepare manual classification proposal for review. Currently almost everything is ctags (no ttags/dtags in system yet).

**Implementation Plan:**
- Migration 022: Classify existing tags table entries as ctags (default)
- Migration 026: User reviews and adjusts classification before seeding
- Future migrations (028-029): Add ttags/dtags as new content is created

**Heuristics for Auto-Classification:**
```typescript
function classifyExistingTag(tagName: string): TagFamily {
    // Age, subject, access patterns → ctags
    if (/age|child|teen|adult|subject|access/i.test(tagName)) {
        return 'ctags'
    }
    
    // System, internal flags → rtags
    if (/^is[A-Z]|^has[A-Z]|system|internal/i.test(tagName)) {
        return 'rtags'
    }
    
    // Default: ctags (user will review)
    return 'ctags'
}
```

### 3. Chaining Syntax
**Answer:** ✅ Confirmed - Use `>` separator (e.g., `new > idea`, `teen > 12-15`)

**Implementation:** 
- Store in `name` field: `'new > idea'`
- Display with breadcrumb component: `<span>new</span> <span>›</span> <span>idea</span>`
- taglogic `subcategory` indicates chained values

### 4. Default Values / NULL Handling
**Answer:** Use 3-level NULL strategy:
1. **Field NULL** (`status_val = NULL`) → "Not Set" - record not categorized yet
2. **Reserved 0x00** → "Unset" - explicitly no value
3. **is_default=true** → Default choice for required categories

**Implementation:**
```sql
-- Generated column handles NULL gracefully
ALTER TABLE projects ADD COLUMN status_label TEXT 
    GENERATED ALWAYS AS (
        CASE 
            WHEN status_val IS NULL THEN NULL
            WHEN status_val = E'\\x00'::bytea THEN 'unset'
            ELSE (SELECT name FROM status WHERE value = status_val LIMIT 1)
        END
    ) STORED;
```

**Frontend Resolution:**
```typescript
// Component gets: entity.status_label
// NULL → show 'Not Set' badge (muted)
// 'unset' → show '–' badge (empty)
// 'new' → show 'New' badge (colored)
```

**See:** `docs/tasks/2025-11-19-G-taglogic-analysis.md` for full NULL handling strategy

### 5. Rollback Safety
**Answer:** ✅ Accepted - Data loss on rollback of migrations 026-027 is acceptable. 

**Mitigation:** 
- Backup database before running these migrations
- Document irreversible operations in down() functions
- Add warning messages during rollback

### 6. Testing Data
**Answer:** Use production data copy, add synthetic data if production lacks diversity.

**Testing Plan:**
- Export production data to dev box (existing process)
- Run migrations 022-027 on dev
- If needed, add synthetic examples for:
  - Topic tags (ttags) - not in production yet
  - Domain tags (dtags) - not in production yet
  - Complex chaining scenarios

### 7. taglogic Understanding ✅
**Answer:** YES - Fully understood from existing Vue implementation.

**Mapping:**
- `category` = required choice → Vue mode: `choose-one` (e.g., age groups)
- `subcategory` = optional refinement → Vue mode: `choose-one` (e.g., sub-age)
- `option` = optional choice → Vue mode: `choose-one` (e.g., access level)
- `toggle` = independent flag → Vue mode: `free` (e.g., isDark)

**Existing Implementation:** `src/components/images/tagsMultiToggle.vue` already supports this with `mode` prop.

**See:** `docs/tasks/2025-11-19-G-taglogic-analysis.md` for complete analysis

---

## Implementation Cleared to Proceed ✅

All questions answered. Ready to start Phase 1 research.

**Updated Task List:**
1. ✅ Questions answered
2. ⏳ Phase 1: Research existing status/tags schema
3. ⏳ Phase 2: Implement Migration 022 (with taglogic inference)
4. ⏳ Phase 3-7: Continue as planned

---

**END OF PLAN**
