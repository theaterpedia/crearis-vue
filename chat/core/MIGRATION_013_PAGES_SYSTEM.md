# Migration 013: Project Status & Pages System

**Status**: ✅ Completed and Tested  
**Version**: 0.0.6  
**Date**: October 17, 2025

## Overview

This migration implements a comprehensive pages management system for projects, including:
- Updated project status workflow
- Automatic page creation on status transition
- Page sections management
- Form input tracking
- Cascade deletion rules
- Project deletion protection

## Database Changes

### 1. Projects Table - Status Field Update

**Changed**: `projects.status`  
**Old Values**: `'new' | 'draft' | 'demo' | 'final'` (plus unconstrained values like 'active')  
**New Values**: `'new' | 'draft' | 'demo' | 'active' | 'trash'`

**Migration Actions**:
- Dropped old CHECK constraints
- Updated `'final'` → `'active'` for existing records
- Added new CHECK constraint with updated values

### 2. Pages Table (New)

**Purpose**: Define page types for each project

```sql
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    header_type TEXT DEFAULT 'simple' CHECK (header_type IN ('simple', 'columns', 'banner', 'cover', 'bauchbinde')),
    page_type TEXT NOT NULL CHECK (page_type IN ('landing', 'event', 'post', 'team')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Key Features**:
- Linked to projects with CASCADE delete
- Four page types: landing, event, post, team
- Five header type options
- Indexed on project for fast lookups

### 3. Page Sections Table (New)

**Purpose**: Define sections within each page

```sql
CREATE TABLE page_sections (
    id TEXT PRIMARY KEY,
    page TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('page', 'header', 'aside', 'bottom')),
    type TEXT NOT NULL CHECK (type IN ('1_postit', '2_list', '3_gallery')),
    heading TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Key Features**:
- Linked to pages with CASCADE delete
- Four scope options: page, header, aside, bottom
- Three section types: postit, list, gallery
- Optional heading text
- Indexed on page for fast lookups

### 4. Form Input Table (New)

**Purpose**: Track form submissions per project

```sql
CREATE TABLE form_input (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL REFERENCES projects(id),
    name TEXT,
    email TEXT,
    "user" TEXT,
    input JSONB,  -- PostgreSQL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Key Features**:
- Linked to projects (NO CASCADE - prevents project deletion)
- Stores user contact info
- JSONB for flexible form data storage
- Indexed on project for fast lookups

## Business Rules & Triggers

### Rule 1: Automatic Page Creation

**Trigger**: `trigger_create_project_pages`  
**When**: Project status changes from `'new'` → `'draft'`  
**Action**: Automatically creates pages

**Pages Created**:
1. **Landing page** (always)
2. **Event page** (always)
3. **Post page** (always)
4. **Team page** (only if `projects.team_page = 'yes'`)

**Example**:
```sql
-- Update project status
UPDATE projects SET status = 'draft' WHERE id = 'test-project-001';

-- Pages automatically created:
-- - test-project-001 | landing | simple
-- - test-project-001 | event   | simple
-- - test-project-001 | post    | simple
-- - test-project-001 | team    | simple (if team_page='yes')
```

### Rule 2: Cascade Deletion Chain

**Pages → Page Sections**:
```sql
pages REFERENCES projects(id) ON DELETE CASCADE
```
When a project is deleted, all its pages are automatically deleted.

**Page Sections → Pages**:
```sql
page_sections REFERENCES pages(id) ON DELETE CASCADE
```
When a page is deleted, all its sections are automatically deleted.

**Deletion Chain**:
```
DELETE project
  └─> AUTO DELETE pages
       └─> AUTO DELETE page_sections
```

### Rule 3: Project Deletion Protection

**Trigger**: `trigger_prevent_project_delete_with_forms`  
**When**: Attempting to delete a project  
**Check**: Are there any `form_input` records for this project?  
**Action**: 
- If form_input exists → **PREVENT DELETION** with error message
- If no form_input → Allow deletion

**Example**:
```sql
-- This will FAIL:
DELETE FROM projects WHERE id = 'test-project-001';
-- ERROR: Cannot delete project: 1 form_input record(s) exist for this project

-- Must delete form_input first:
DELETE FROM form_input WHERE project = 'test-project-001';
-- Now project deletion will succeed
DELETE FROM projects WHERE id = 'test-project-001';
```

## TypeScript Types

### PagesTableFields
```typescript
export interface PagesTableFields {
    id: string
    project: string
    header_type?: 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    page_type: 'landing' | 'event' | 'post' | 'team'
    created_at?: string | null
    updated_at?: string | null
}
```

### PageSectionsTableFields
```typescript
export interface PageSectionsTableFields {
    id: string
    page: string
    scope: 'page' | 'header' | 'aside' | 'bottom'
    type: '1_postit' | '2_list' | '3_gallery'
    heading?: string | null
    created_at?: string | null
    updated_at?: string | null
}
```

### FormInputTableFields
```typescript
export interface FormInputTableFields {
    id: string
    project: string
    name?: string | null
    email?: string | null
    user?: string | null
    input?: any // JSONB in PostgreSQL, TEXT in SQLite
    created_at?: string | null
    updated_at?: string | null
}
```

### ProjectsTableFields (Updated)
```typescript
export interface ProjectsTableFields {
    // ... other fields
    status?: 'new' | 'draft' | 'demo' | 'active' | 'trash'
    team_page?: 'yes' | 'no'
    // ...
}
```

## Testing Results

### ✅ Test 1: Automatic Page Creation

**Setup**:
```sql
INSERT INTO projects (id, username, password_hash, role, name, status, team_page) 
VALUES ('test-project-001', 'testproject', 'hash', 'project', 'Test Project', 'new', 'yes');
```

**Action**:
```sql
UPDATE projects SET status = 'draft' WHERE id = 'test-project-001';
```

**Result**:
```sql
SELECT page_type FROM pages WHERE project = 'test-project-001';
-- landing
-- event
-- post
-- team  (created because team_page='yes')
```
✅ **PASSED**: 4 pages created automatically

### ✅ Test 2: Page Sections

**Setup**:
```sql
INSERT INTO page_sections (page, scope, type, heading) 
VALUES ('359ad186-ef41-4954-81c3-633c36c08abb', 'page', '1_postit', 'Test Section');
```

**Result**:
```sql
SELECT * FROM page_sections WHERE page = '359ad186-ef41-4954-81c3-633c36c08abb';
-- id: 612b693c-0a80-4ca2-905d-e5e252acc323
-- scope: page
-- type: 1_postit
-- heading: Test Section
```
✅ **PASSED**: Page section created successfully

### ✅ Test 3: Project Deletion Prevention

**Setup**:
```sql
INSERT INTO form_input (project, name, email, input) 
VALUES ('test-project-001', 'John Doe', 'john@example.com', '{"message": "Test"}');
```

**Action**:
```sql
DELETE FROM projects WHERE id = 'test-project-001';
```

**Result**:
```
ERROR: Cannot delete project: 1 form_input record(s) exist for this project
```
✅ **PASSED**: Deletion prevented as expected

### ✅ Test 4: Cascade Deletion

**Setup**: Pages and page_sections already exist

**Action**:
```sql
-- Delete form_input first to allow project deletion
DELETE FROM form_input WHERE project = 'test-project-001';
-- Now delete project
DELETE FROM projects WHERE id = 'test-project-001';
```

**Expected Result**:
- Project deleted
- All pages automatically deleted
- All page_sections automatically deleted

✅ **PASSED**: Cascade deletion works correctly

## Workflow Example

### Creating a New Project with Pages

```sql
-- 1. Create project with status 'new'
INSERT INTO projects (id, username, password_hash, role, name, status, team_page)
VALUES ('my-project', 'myproj', 'hash', 'project', 'My Project', 'new', 'yes');

-- 2. Activate project (triggers page creation)
UPDATE projects SET status = 'draft' WHERE id = 'my-project';

-- 3. Verify pages were created
SELECT page_type FROM pages WHERE project = 'my-project';
-- Result: landing, event, post, team

-- 4. Add custom sections to a page
INSERT INTO page_sections (page, scope, type, heading)
SELECT id, 'page', '1_postit', 'Welcome Section'
FROM pages 
WHERE project = 'my-project' AND page_type = 'landing';

-- 5. Track form submissions
INSERT INTO form_input (project, name, email, input)
VALUES ('my-project', 'Jane Smith', 'jane@example.com', '{"interest": "workshop"}');

-- 6. Project lifecycle
UPDATE projects SET status = 'active' WHERE id = 'my-project';
-- Later...
UPDATE projects SET status = 'trash' WHERE id = 'my-project';
```

## API Integration Points

### Pages API (to be created)
```typescript
// GET /api/projects/:projectId/pages
// POST /api/projects/:projectId/pages
// PUT /api/pages/:pageId
// DELETE /api/pages/:pageId
```

### Page Sections API (to be created)
```typescript
// GET /api/pages/:pageId/sections
// POST /api/pages/:pageId/sections
// PUT /api/page_sections/:sectionId
// DELETE /api/page_sections/:sectionId
```

### Form Input API (to be created)
```typescript
// GET /api/projects/:projectId/forms
// POST /api/projects/:projectId/forms
// GET /api/form_input/:id
```

## Files Modified

1. **Migration File**: `server/database/migrations/013_alter_project_status_and_add_pages.ts`
   - Alter projects.status with new constraint
   - Create pages table
   - Create page_sections table
   - Create form_input table
   - Create automatic page creation trigger
   - Create project deletion prevention trigger

2. **Migration Index**: `server/database/migrations/index.ts`
   - Registered migration 013
   - Version 0.0.6

3. **Database Types**: `server/types/database.ts`
   - Updated ProjectsTableFields.status type
   - Added PagesTableFields interface
   - Added PageSectionsTableFields interface
   - Added FormInputTableFields interface

## Performance Considerations

**Indexes Created**:
```sql
CREATE INDEX idx_pages_project ON pages(project);
CREATE INDEX idx_page_sections_page ON page_sections(page);
CREATE INDEX idx_form_input_project ON form_input(project);
```

**Why These Indexes**:
- `idx_pages_project`: Fast lookup of all pages for a project
- `idx_page_sections_page`: Fast lookup of all sections for a page
- `idx_form_input_project`: Fast form submission lookup and deletion check

## Migration Rollback

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_prevent_project_delete_with_forms ON projects;
DROP TRIGGER IF EXISTS trigger_create_project_pages ON projects;
DROP FUNCTION IF EXISTS prevent_project_delete_with_forms();
DROP FUNCTION IF EXISTS create_project_pages();

-- Drop tables (cascades handle dependencies)
DROP TABLE IF EXISTS form_input CASCADE;
DROP TABLE IF EXISTS page_sections CASCADE;
DROP TABLE IF EXISTS pages CASCADE;

-- Status constraint removed but not restored (manual intervention needed)
```

## Next Steps

1. **Create API Endpoints**:
   - Pages CRUD operations
   - Page sections management
   - Form input tracking

2. **Build UI Components**:
   - Page builder interface
   - Section editor
   - Form submission viewer

3. **Add Validation**:
   - Unique page_type per project
   - Section order management
   - Form input sanitization

4. **Enhance Features**:
   - Page templates
   - Section content storage
   - Form analytics

## Known Limitations

1. **SQLite Support**: Trigger logic differs between PostgreSQL and SQLite
2. **Status Migration**: Only 'final' → 'active' is automated; other values preserved
3. **Unique Constraint**: No enforcement that page_type is unique per project
4. **Section Ordering**: No built-in ordering for sections
5. **Form Schema**: JSONB input field has no schema validation

## Related Documentation

- [Migration 012: Extended Fields](./MIGRATION_012_EXTENDED_FIELDS.md)
- [Database Table Types](../DATABASE_TABLE_TYPES.md)
- [Projects CRUD](./PROJECTS_CRUD_COMPLETE.md)

---

**Migration Created**: October 17, 2025  
**Migration Status**: ✅ Completed and tested  
**Database Version**: 0.0.6  
**Tests Passed**: 4/4  
**Production Ready**: Yes
