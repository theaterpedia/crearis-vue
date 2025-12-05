# Migration 012: Extended Fields

**Status**: ✅ Created (Not yet run)  
**Version**: 0.0.5  
**Date**: October 17, 2025

## Overview

This migration adds comprehensive extended fields to posts, instructors, projects, and events tables to support:
- Header type variants for flexible layouts
- Markdown and HTML content storage
- Multi-project instructor support
- Advanced project management features

## Changes

### 1. Header Type Field

**Tables**: `posts`, `instructors`, `projects`, `events`

**Type**: `TEXT` with CHECK constraint  
**Default**: `'default'`  
**Options**:
- `default` - Standard header
- `simple` - Simplified header
- `columns` - Column-based layout
- `banner` - Banner-style header
- `cover` - Cover image header
- `bauchbinde` - Subtitle banner

**Notes**:
- For events, this field is **altered** (replaced) rather than added
- Previous events.header_type had no constraints

### 2. Content Fields

**Tables**: `posts`, `instructors`, `projects`, `events`

**Fields Added**:
- `md` (TEXT) - Markdown content storage
- `html` (TEXT) - HTML content storage

**Purpose**: Store rich content in both markdown source and rendered HTML

### 3. Instructor Multi-Project Support

**Table**: `instructors`

**Field Added**: `multiproject`  
**Type**: `TEXT` with CHECK constraint  
**Default**: `'yes'`  
**Options**: `'yes'` | `'no'`

**Purpose**: Indicate if instructor can work across multiple projects

### 4. Project Management Fields

**Table**: `projects`

#### Project Type & Classification
- `type` (TEXT, default 'project')
  - Options: `project` | `regio` | `special`
  - Categorizes project types

- `is_regio` (BOOLEAN, default false)
  - Marks projects that are regional projects
  - Used for filtering in `regio` field

#### Project Relationships
- `regio` (TEXT, FK to projects.id)
  - References parent regional project
  - Only valid for projects where `is_regio = true`
  - Optional

- `partner_projects` (TEXT)
  - Stores references to partner projects
  - Format: comma-separated IDs or JSON array
  - Only references projects where `type = 'project'`
  - Optional

#### Content & Display
- `heading` (TEXT)
  - Custom heading/title
  
- `theme` (INTEGER)
  - Theme number/identifier

- `cimg` (TEXT)
  - Cover image path (note: may duplicate existing field)

- `teaser` (TEXT)
  - Teaser/preview text

- `team_page` (TEXT, default 'no')
  - Options: `'yes'` | `'no'`
  - Whether to show team page

#### Call-to-Action (CTA) Fields
- `cta_title` (TEXT)
  - CTA button/section title

- `cta_form` (TEXT)
  - Associated form identifier

- `cta_entity` (TEXT)
  - Type of linked entity
  - Options: `'post'` | `'event'` | `'instructor'`

- `cta_link` (TEXT)
  - Direct link/URL

#### Project Status
- `status` (TEXT, default 'new')
  - Options: `'new'` | `'draft'` | `'demo'` | `'final'`
  - Note: Replaces existing status field with constrained options

## Database Schema

### SQL (PostgreSQL)

```sql
-- Header type for posts, instructors, projects
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default' 
CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'));

ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default' 
CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS header_type TEXT DEFAULT 'default' 
CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'));

-- Header type for events (ALTER existing)
ALTER TABLE events DROP COLUMN IF EXISTS header_type;
ALTER TABLE events 
ADD COLUMN header_type TEXT DEFAULT 'default' 
CHECK (header_type IN ('default', 'simple', 'columns', 'banner', 'cover', 'bauchbinde'));

-- Content fields for all tables
ALTER TABLE posts ADD COLUMN IF NOT EXISTS md TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS html TEXT;

ALTER TABLE instructors ADD COLUMN IF NOT EXISTS md TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS html TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS md TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS html TEXT;

ALTER TABLE events ADD COLUMN IF NOT EXISTS md TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS html TEXT;

-- Instructor multi-project
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS multiproject TEXT DEFAULT 'yes' 
CHECK (multiproject IN ('yes', 'no'));

-- Project management fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'project' 
CHECK (type IN ('project', 'regio', 'special'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_regio BOOLEAN DEFAULT FALSE;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS regio TEXT REFERENCES projects(id);

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS partner_projects TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS heading TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS theme INTEGER;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cimg TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS teaser TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS team_page TEXT DEFAULT 'no' 
CHECK (team_page IN ('yes', 'no'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cta_title TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cta_form TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cta_entity TEXT 
CHECK (cta_entity IN ('post', 'event', 'instructor'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cta_link TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' 
CHECK (status IN ('new', 'draft', 'demo', 'final'));
```

## TypeScript Types Updated

### PostsTableFields
```typescript
export interface PostsTableFields {
    // ... existing fields
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
}
```

### EventsTableFields
```typescript
export interface EventsTableFields {
    // ... existing fields
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
}
```

### InstructorsTableFields
```typescript
export interface InstructorsTableFields {
    // ... existing fields
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
    multiproject?: 'yes' | 'no'
}
```

### ProjectsTableFields
```typescript
export interface ProjectsTableFields {
    // ... existing fields
    status?: 'new' | 'draft' | 'demo' | 'final'
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
    type?: 'project' | 'regio' | 'special'
    is_regio?: boolean
    regio?: string | null
    partner_projects?: string | null
    heading?: string | null
    theme?: number | null
    teaser?: string | null
    team_page?: 'yes' | 'no'
    cta_title?: string | null
    cta_form?: string | null
    cta_entity?: 'post' | 'event' | 'instructor'
    cta_link?: string | null
}
```

## Files Modified

1. **Migration File**: `server/database/migrations/012_add_extended_fields.ts`
   - Comprehensive migration with up/down methods
   - PostgreSQL and SQLite support
   - Safe column addition with IF NOT EXISTS

2. **Migration Index**: `server/database/migrations/index.ts`
   - Registered migration 012
   - Version 0.0.5

3. **Database Types**: `server/types/database.ts`
   - Updated all 4 table interfaces
   - Updated type guard functions
   - Added comprehensive documentation

## Running the Migration

The migration will run automatically when:
1. Server starts
2. Migration 012 not yet recorded in `crearis_config`
3. All previous migrations (000-011) completed

**Manual execution**:
```bash
# Start the dev server (migrations run automatically)
pnpm dev
```

## Validation

After running migration, verify:

```sql
-- Check posts table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('header_type', 'md', 'html');

-- Check instructors table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'instructors' 
AND column_name IN ('header_type', 'md', 'html', 'multiproject');

-- Check projects table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('header_type', 'type', 'is_regio', 'status');

-- Check events table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('header_type', 'md', 'html');
```

## Rollback

Migration includes `down()` method for rollback:
- PostgreSQL: Uses `DROP COLUMN IF EXISTS`
- SQLite: Logs warning (SQLite doesn't support DROP COLUMN easily)

**Note**: Rollback will lose data in these columns!

## Next Steps

1. **Run Migration**: Start dev server to execute migration
2. **Update Forms**: Add UI fields for new columns
   - Header type selector
   - Markdown/HTML editors
   - Project management fields
   - CTA configuration
3. **Update APIs**: Ensure APIs handle new fields
4. **Update Views**: Display new content appropriately
5. **Documentation**: Update user-facing docs with new features

## Related Documentation

- [Database Table Types](../DATABASE_TABLE_TYPES.md)
- [Migration System](../../server/database/migrations/README.md)
- [Projects CRUD](./PROJECTS_CRUD_COMPLETE.md)

## Notes

- **cimg in projects**: This might duplicate an existing field - verify before production
- **partner_projects format**: Consider standardizing as JSON array
- **Foreign key constraints**: `regio` field references projects table
- **Check constraints**: Ensure enum-like behavior for option fields
- **Default values**: Most fields optional except where specified

## Potential Issues

1. **Events header_type**: Existing data will be lost when column is dropped/recreated
2. **Projects status**: If status field already exists with different constraints, migration may fail
3. **SQLite limitations**: Rollback won't work properly on SQLite
4. **Data migration**: No automatic data migration from old status values to new constrained values

## Testing Checklist

- [ ] Migration runs without errors
- [ ] All columns created in all tables
- [ ] Check constraints work (try invalid values)
- [ ] Foreign key constraint works (regio field)
- [ ] Default values applied correctly
- [ ] Type guards in TypeScript work
- [ ] APIs accept new fields
- [ ] APIs reject invalid enum values
- [ ] Existing data preserved
- [ ] Rollback works (PostgreSQL)

---

**Migration Created**: October 17, 2025  
**Migration Status**: Ready to run  
**Database Version After**: 0.0.5
