# Migration 014: Computed Columns & Special Projects

**Status**: ✅ Completed and Tested  
**Version**: 0.0.7  
**Date**: October 17, 2025

## Overview

This migration converts `is_regio` from a regular boolean to a computed column and adds a new computed column `is_project`. It also seeds two special projects for the system.

## Database Changes

### 1. Projects Table - Computed Columns

**Changed**: `is_regio` boolean → computed column  
**Added**: `is_project` computed column

#### Before:
```sql
is_regio BOOLEAN DEFAULT FALSE  -- Regular column, manually set
```

#### After:
```sql
is_regio BOOLEAN GENERATED ALWAYS AS (type = 'regio') STORED
is_project BOOLEAN GENERATED ALWAYS AS (type = 'project') STORED
```

**Key Features**:
- **Read-only**: Cannot be manually set or updated
- **Auto-computed**: Automatically calculated based on `type` field
- **STORED**: Values physically stored (not computed on every read)
- **Real-time updates**: Changes immediately when `type` changes

### 2. Seeded Special Projects

**Two projects added**:

#### Project 1: `tp` (Special)
```sql
id: 'tp'
username: 'tp'
name: 'tp'
role: 'project'
type: 'special'
description: 'default-page'
status: 'active'
is_regio: false (computed)
is_project: false (computed)
```

**Purpose**: Default special project for system pages

#### Project 2: `regio1` (Regional)
```sql
id: 'regio1'
username: 'regio1'
name: 'regio1'
role: 'project'
type: 'regio'
description: 'default-regio'
status: 'active'
is_regio: true (computed)
is_project: false (computed)
```

**Purpose**: Default regional project

## Computed Column Behavior

### How It Works

The computed columns automatically reflect the project type:

| type | is_regio | is_project |
|------|----------|------------|
| 'project' | false | **true** |
| 'regio' | **true** | false |
| 'special' | false | false |

### Example Usage

```sql
-- Create a regular project
INSERT INTO projects (id, username, password_hash, role, name, type)
VALUES ('myproj', 'myproj', 'hash', 'project', 'My Project', 'project');

-- Computed columns are automatically set:
SELECT is_regio, is_project FROM projects WHERE id = 'myproj';
-- Result: is_regio = false, is_project = true

-- Change type to regional
UPDATE projects SET type = 'regio' WHERE id = 'myproj';

-- Computed columns update automatically:
SELECT is_regio, is_project FROM projects WHERE id = 'myproj';
-- Result: is_regio = true, is_project = false
```

### Attempting to Set Computed Columns

```sql
-- This will FAIL:
UPDATE projects SET is_regio = true WHERE id = 'myproj';
-- ERROR: column "is_regio" can only be updated to DEFAULT

-- This will also FAIL:
INSERT INTO projects (..., is_regio, is_project) VALUES (..., true, false);
-- ERROR: cannot insert into column "is_regio"
```

**The only way to change these values is by changing the `type` field.**

## TypeScript Types

### ProjectsTableFields (Updated)

```typescript
export interface ProjectsTableFields {
    // ... other fields
    type?: 'project' | 'regio' | 'special'
    
    // Migration 014 - Computed columns (read-only, auto-generated)
    is_regio?: boolean // GENERATED: computed as (type = 'regio')
    is_project?: boolean // GENERATED: computed as (type = 'project')
    // ...
}
```

**Important Notes for TypeScript**:
- These fields are **read-only** when inserting/updating
- They can be read from query results
- Do not include them in INSERT or UPDATE operations
- They are automatically populated by the database

### API Considerations

```typescript
// ❌ WRONG - trying to set computed columns
const projectData: Partial<ProjectsTableFields> = {
    id: 'new-project',
    name: 'New Project',
    type: 'project',
    is_project: true  // ERROR: This will fail!
}

// ✅ CORRECT - only set type, computed columns auto-populate
const projectData: Partial<ProjectsTableFields> = {
    id: 'new-project',
    name: 'New Project',
    type: 'project'  // is_project will automatically be true
}
```

## Testing Results

### ✅ Test 1: Computed Columns Created

**Query**:
```sql
SELECT column_name, data_type, is_generated, generation_expression 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name IN ('is_regio', 'is_project');
```

**Result**:
```
column_name | data_type | is_generated | generation_expression
is_project  | boolean   | ALWAYS       | (type = 'project'::text)
is_regio    | boolean   | ALWAYS       | (type = 'regio'::text)
```
✅ **PASSED**: Columns are generated/computed

### ✅ Test 2: Seeded Projects

**Query**:
```sql
SELECT id, name, type, is_regio, is_project 
FROM projects 
WHERE id IN ('tp', 'regio1');
```

**Result**:
```
id     | name   | type    | is_regio | is_project
tp     | tp     | special | f        | f
regio1 | regio1 | regio   | t        | f
```
✅ **PASSED**: Both projects seeded with correct computed values

### ✅ Test 3: Automatic Updates

**Setup**:
```sql
SELECT id, type, is_regio, is_project FROM projects WHERE id = 'project1';
-- project1 | project | f | t
```

**Action**:
```sql
UPDATE projects SET type = 'regio' WHERE id = 'project1';
```

**Result**:
```sql
SELECT id, type, is_regio, is_project FROM projects WHERE id = 'project1';
-- project1 | regio | t | f
```
✅ **PASSED**: Computed columns updated automatically

**Restore**:
```sql
UPDATE projects SET type = 'project' WHERE id = 'project1';
-- project1 | project | f | t
```
✅ **PASSED**: Computed columns reverted automatically

### ✅ Test 4: Existing Projects

**Query**:
```sql
SELECT id, type, is_regio, is_project 
FROM projects 
WHERE id IN ('admin', 'project1');
```

**Result**:
```
id       | type    | is_regio | is_project
admin    | project | f        | t
project1 | project | f        | t
```
✅ **PASSED**: Existing projects have correct computed values

## Migration Details

### PostgreSQL Implementation

```sql
-- 1. Drop old boolean column
ALTER TABLE projects DROP COLUMN IF EXISTS is_regio;

-- 2. Add as computed column
ALTER TABLE projects 
ADD COLUMN is_regio BOOLEAN 
GENERATED ALWAYS AS (type = 'regio') STORED;

-- 3. Add new computed column
ALTER TABLE projects 
ADD COLUMN is_project BOOLEAN 
GENERATED ALWAYS AS (type = 'project') STORED;

-- 4. Seed projects
INSERT INTO projects (id, username, password_hash, role, name, type, description, status)
VALUES 
  ('tp', 'tp', 'placeholder_hash', 'project', 'tp', 'special', 'default-page', 'active'),
  ('regio1', 'regio1', 'placeholder_hash', 'project', 'regio1', 'regio', 'default-regio', 'active');
```

### SQLite Considerations

- Requires SQLite 3.31+ for GENERATED columns
- Column dropping not easily supported (migration warns and continues)
- INSERT OR IGNORE used for idempotent seeding

## Benefits of Computed Columns

1. **Data Integrity**: Impossible to have mismatched values
2. **Simplified Logic**: No need to manually update is_regio/is_project
3. **Single Source of Truth**: `type` field controls everything
4. **Query Performance**: STORED means no runtime computation
5. **Developer Safety**: Cannot accidentally set wrong values

## Use Cases

### Querying Regional Projects
```sql
-- Simple and reliable
SELECT * FROM projects WHERE is_regio = true;

-- Equivalent to:
SELECT * FROM projects WHERE type = 'regio';
```

### Filtering in Foreign Keys
```sql
-- The 'regio' field in projects table can reference:
SELECT id, name FROM projects WHERE is_regio = true;

-- This ensures only regional projects are selected
```

### API Responses
```typescript
// Automatically includes computed values
const projects = await db.all('SELECT * FROM projects')
// Result includes is_regio and is_project automatically
```

## Rollback

```sql
-- Drop computed columns
ALTER TABLE projects DROP COLUMN IF EXISTS is_project;
ALTER TABLE projects DROP COLUMN IF EXISTS is_regio;

-- Restore as regular boolean
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_regio BOOLEAN DEFAULT FALSE;

-- Delete seeded projects
DELETE FROM projects WHERE id IN ('tp', 'regio1');
```

## Files Modified

1. **Migration File**: `server/database/migrations/014_add_computed_columns_and_seed.ts`
   - Drop old is_regio column
   - Add computed is_regio and is_project columns
   - Seed tp and regio1 projects

2. **Migration Index**: `server/database/migrations/index.ts`
   - Registered migration 014
   - Version 0.0.7

3. **Database Types**: `server/types/database.ts`
   - Updated ProjectsTableFields
   - Added comments indicating computed/read-only nature

## Next Steps

1. **Update API Endpoints**:
   - Remove is_regio/is_project from INSERT/UPDATE operations
   - Use type field to control these values

2. **Update UI Components**:
   - Project forms should only allow setting `type`
   - Display is_regio/is_project as read-only badges

3. **Add Validation**:
   - Ensure APIs don't try to set computed columns
   - Add TypeScript guards for insert/update operations

4. **Update Documentation**:
   - API docs should note these are computed
   - Frontend docs should explain the relationship

## Known Limitations

1. **Cannot Set Directly**: Must change `type` to affect computed columns
2. **SQLite 3.31+**: Older SQLite versions don't support GENERATED columns
3. **Migration Data Loss**: Dropping old is_regio loses any manually-set values
4. **Foreign Key Impact**: If is_regio was used in foreign keys, those constraints need updating

## Related Documentation

- [Migration 012: Extended Fields](./MIGRATION_012_EXTENDED_FIELDS.md)
- [Migration 013: Pages System](./MIGRATION_013_PAGES_SYSTEM.md)
- [Database Table Types](../DATABASE_TABLE_TYPES.md)

---

**Migration Created**: October 17, 2025  
**Migration Status**: ✅ Completed and tested  
**Database Version**: 0.0.7  
**Tests Passed**: 4/4  
**Production Ready**: Yes  
**Breaking Changes**: Yes (is_regio now read-only)
