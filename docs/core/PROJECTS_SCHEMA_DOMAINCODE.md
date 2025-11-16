# Projects Table Schema Update: Domaincode & Heading Field

## Overview

This document describes the comprehensive schema changes made to the `projects` table to implement strict domaincode constraints on the ID field and replace the `name` field with a `heading` field using a specific format.

## Schema Changes

### Projects Table Structure

**Before:**
```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  owner_id TEXT,
  created_at TIMESTAMP,
  updated_at TEXT
)
```

**After:**
```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY CHECK(id ~ '^[a-z][a-z0-9_]*$'),  -- PostgreSQL
  -- or CHECK(id GLOB '[a-z]*' AND id NOT GLOB '* *' AND id NOT GLOB '*[A-Z]*') for SQLite
  heading TEXT,
  description TEXT,
  status TEXT DEFAULT 'draft',
  owner_id TEXT,
  created_at TIMESTAMP,
  updated_at TEXT
)
```

### Key Changes

1. **ID Field (Domaincode)**
   - Label: "domaincode"
   - Constraints:
     - Must start with a lowercase letter `[a-z]`
     - May only contain lowercase letters, numbers, and underscores
     - No uppercase letters allowed
     - No whitespace allowed
     - Regex pattern: `^[a-z][a-z0-9_]*$`

2. **Name → Heading**
   - Dropped: `name` field
   - Added: `heading` field
   - Format: `"Project Overline **[name]**"`
   - Example: `"Project Overline **project1**"`

## Implementation Details

### 1. Base Schema Migration

**File:** `server/database/migrations/000_base_schema.ts`

- Added CHECK constraint for domaincode validation
- Changed `name` column to `heading`
- Added comment: "Note: id field is the 'domaincode'"

### 2. Database Seeding

**File:** `server/database/seed.ts`

```typescript
// Convert name to heading format
INSERT INTO projects (id, heading, description, status, owner_id)
VALUES (?, ?, ?, ?, ?)

[projectId, `Project Overline **${user.name}**`, description, status, userId]
```

### 3. Migration 014 Updates

**File:** `server/database/migrations/014_add_computed_columns_and_seed.ts`

Updated special projects (tp, regio1) to use heading field:

```typescript
// PostgreSQL
INSERT INTO projects (id, heading, type, description, status)
VALUES ('tp', 'Project Overline **tp**', 'special', 'default-page', 'active')

// SQLite
INSERT OR IGNORE INTO projects (id, heading, type, description, status)
VALUES 
('tp', 'Project Overline **tp**', 'special', 'default-page', 'active'),
('regio1', 'Project Overline **regio1**', 'regio', 'default-regio', 'active')
```

### 4. API Endpoints

#### POST /api/projects

**File:** `server/api/projects/index.post.ts`

- Accepts both `name` (legacy) and `heading` (new) parameters
- Converts `name` to proper heading format: `Project Overline **${name}**`
- Generates domaincode-compliant IDs:
  ```typescript
  const baseId = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, 'p')
  const id = `${baseId}_${Date.now().toString(36)}`
  ```
- Validates ID against domaincode pattern
- Maps `heading` back to `name` in response for frontend compatibility

#### GET /api/projects

**File:** `server/api/projects/index.get.ts`

- Fetches all projects with `heading` field
- Maps `heading` to `name` in response for frontend compatibility:
  ```typescript
  const projects = rawProjects.map((p: any) => ({
      ...p,
      name: p.heading
  }))
  ```

#### PUT /api/projects/:id

**File:** `server/api/projects/[id].put.ts`

- Accepts both `name` (converts to heading) and `heading` (direct)
- Converts name updates to heading format:
  ```typescript
  if (name !== undefined) {
      updates.push('heading = ?')
      values.push(`Project Overline **${name}**`)
  } else if (heading !== undefined) {
      updates.push('heading = ?')
      values.push(heading)
  }
  ```
- Maps `heading` to `name` in response

### 5. Authentication Endpoint

**File:** `server/api/auth/login.post.ts`

Updated all project queries to use `heading` field:

#### Owned Projects
```typescript
SELECT id, heading
FROM projects
WHERE owner_id = ?
ORDER BY heading ASC

// Map to response
name: proj.heading
```

#### Member Projects
```typescript
SELECT p.id, p.heading
FROM projects p
INNER JOIN project_members pm ON p.id = pm.project_id
WHERE pm.user_id = ? AND p.owner_id != ?
ORDER BY p.heading ASC
```

#### Instructor Projects
```typescript
SELECT DISTINCT p.id, p.heading, p.owner_id
FROM projects p
INNER JOIN events e ON p.id = e.project
INNER JOIN event_instructors ei ON e.id = ei.event_id
INNER JOIN users u ON u.instructor_id = ei.instructor_id
WHERE u.id = ?
ORDER BY p.heading ASC
```

#### Author Projects
```typescript
SELECT DISTINCT p.id, p.heading, p.owner_id
FROM projects p
INNER JOIN posts po ON p.id = po.project
WHERE po.author_id = ?
ORDER BY p.heading ASC
```

## Backward Compatibility

### API Response Mapping

All API endpoints that return project data map the database `heading` field to `name` in the response for frontend compatibility:

```typescript
const project = {
    ...rawProject,
    name: rawProject.heading
}
```

This ensures the frontend Project interface remains unchanged:

```typescript
export interface Project {
    id: string
    name: string  // Mapped from heading in database
    description?: string
    owner: string
    // ...
}
```

### Frontend Components

No changes required to Vue components. They continue to use `project.name` as before:

- `ProjectModal.vue` - Create/edit forms
- `ProjectToggle.vue` - Project selection UI
- `ProjectsTable.vue` - Project listings
- `AdminActionsShowcase.vue` - Admin interface

## ID Generation Examples

```typescript
// Input: "My Cool Project"
baseId = "my_cool_project"  // lowercase, replace invalid chars with _
id = "my_cool_project_l8x9k2"  // append timestamp

// Input: "project1"
baseId = "project1"
id = "project1_l8x9k3"

// Input: "123test"
baseId = "p23test"  // ensure starts with letter
id = "p23test_l8x9k4"
```

## Heading Format Examples

```typescript
// Seeding from user.name
user.name = "project1"
heading = "Project Overline **project1**"

// API creation from name parameter
body.name = "My Project"
heading = "Project Overline **My Project**"

// API creation with direct heading
body.heading = "Custom Heading **with bold**"
heading = "Custom Heading **with bold**"
```

## Testing

To verify the changes:

1. **Database Rebuild**
   ```bash
   pnpm db:rebuild
   ```

2. **Verify Schema**
   - Check projects table has `heading` field, not `name`
   - Check ID constraint exists
   - Verify seeded projects have proper heading format

3. **Test API Endpoints**
   - POST /api/projects with `name` → should create with proper heading
   - POST /api/projects with `heading` → should use as-is
   - GET /api/projects → should return `name` field (mapped from heading)
   - PUT /api/projects/:id → should handle both name and heading updates

4. **Test Authentication**
   - Login as project owner → should see projects with proper names
   - Login as member → should see projects with proper names
   - Verify role detection working correctly

## Files Modified

### Database Layer
- `server/database/migrations/000_base_schema.ts`
- `server/database/migrations/014_add_computed_columns_and_seed.ts`
- `server/database/seed.ts`

### API Layer
- `server/api/projects/index.post.ts`
- `server/api/projects/index.get.ts`
- `server/api/projects/[id].put.ts`
- `server/api/auth/login.post.ts`

### No Changes Required
- Frontend Vue components (use mapped `name` field)
- `src/types.ts` (Project interface remains the same)
- Other migrations (clean)

## Migration Path

For existing databases:

1. **Backup current database**
2. **Run migration** to add heading column and constraints
3. **Migrate data**: Copy `name` to `heading` with format conversion
4. **Drop name column**
5. **Update application code** (already done in this implementation)
6. **Test thoroughly**

Recommended command:
```bash
pnpm db:rebuild  # Drops and rebuilds with new schema
```

## Notes

- ID validation regex: `^[a-z][a-z0-9_]*$`
- Heading format preserves original name in markdown bold syntax
- API layer provides backward compatibility through field mapping
- Frontend code requires no changes
- Database enforces constraints at schema level
