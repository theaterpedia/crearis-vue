# Projects Domaincode Update

## Overview

This document describes the updated implementation where:
- `project.name` in the API maps to `project.id` (domaincode) in the database
- `project.heading` is a separate field for display purposes
- Project IDs (domaincodes) are immutable and must follow strict constraints

## Database Schema

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY CHECK(id ~ '^[a-z][a-z0-9_]*$'),  -- Domaincode
  heading TEXT,  -- Display heading (format: "Project Overline **[name]**")
  description TEXT,
  status TEXT DEFAULT 'draft',
  owner_id TEXT,
  created_at TIMESTAMP,
  updated_at TEXT
)
```

### Domaincode Constraints

- Must start with a lowercase letter `[a-z]`
- May only contain lowercase letters, numbers, and underscores
- No uppercase letters
- No whitespace
- Regex: `^[a-z][a-z0-9_]*$`

## API Endpoints

### POST /api/projects (Create Project)

**Request:**
```json
{
  "id": "myproject",        // Required - domaincode (can also use "name")
  "heading": "Project Overline **My Project**",  // Optional - auto-generated if not provided
  "description": "...",
  "status": "active",
  "owner_id": "user@example.com"
}
```

**Validation:**
- ID is required (accepts `id` or `name` field)
- ID must match domaincode pattern: `^[a-z][a-z0-9_]*$`
- Returns error `"name needs to be a domaincode"` if invalid
- Checks if ID already exists in database (returns 409 Conflict)
- Does NOT auto-generate IDs

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "myproject",
    "name": "myproject",      // Mapped from id (domaincode)
    "heading": "Project Overline **My Project**",
    "description": "...",
    "status": "active",
    "owner_id": "user@example.com"
  }
}
```

### PUT /api/projects/:id (Update Project)

**Request:**
```json
{
  "heading": "Updated Heading **New Name**",  // Can update
  "description": "...",  // Can update
  "status": "active"     // Can update
}
```

**Restrictions:**
- Cannot change `id` (domaincode is immutable)
- Cannot change `name` (mapped to id)
- Attempting to change these returns 400 error: "Cannot change project ID or name (domaincode is immutable)"

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "myproject",
    "name": "myproject",  // Mapped from id
    "heading": "Updated Heading **New Name**",
    ...
  }
}
```

### GET /api/projects (List Projects)

**Response:**
```json
{
  "projects": [
    {
      "id": "project1",
      "name": "project1",  // Mapped from id
      "heading": "Project Overline **Project 1**",
      "description": "...",
      "status": "active"
    }
  ],
  "count": 1
}
```

### POST /api/auth/login (Authentication)

**Projects in Response:**
```json
{
  "user": {
    ...
    "projects": [
      {
        "id": "myproject",
        "name": "myproject",          // Domaincode
        "heading": "Project Overline **My Project**",  // Display heading
        "username": "myproject",
        "isOwner": true,
        "isMember": false,
        "isInstructor": false,
        "isAuthor": false
      }
    ]
  }
}
```

## Frontend Components

### ProjectToggle.vue

**Display:**
- Shows domaincode in button label: `{{ project.name }}` (which is the domaincode)
- Uses `HeadingParser` to display two-line heading from `project.heading`
- Format: overline and headline parsed from "Project Overline **[name]**"

**Template:**
```vue
<div class="project-tile-heading">
  <HeadingParser 
    v-if="project.heading" 
    :content="project.heading" 
    as="span" 
    :compact="true" 
  />
  <span v-else class="project-tile-name">{{ project.name }}</span>
</div>
<div class="project-tile-id">@{{ project.username }}</div>
```

### ProjectsTable.vue

**Columns:**
1. **Domaincode** - `{{ project.name }}` (monospace font, primary color)
2. **Heading** - `<HeadingParser :content="project.heading" />` (two-line display)
3. **Description** - `{{ project.description }}`
4. **Status** - Badge with status
5. **Created** - Formatted date
6. **Actions** - Edit/Delete buttons

**Template:**
```vue
<td class="td-domaincode">{{ project.name }}</td>
<td class="td-heading">
  <HeadingParser 
    v-if="project.heading" 
    :content="project.heading" 
    as="span" 
    :compact="true" 
  />
  <span v-else>-</span>
</td>
```

### AdminActionProjectsPanel.vue

**Fields:**
- `id` - "Domaincode (ID)" - Text input, required (for create)
- `name` - "Domaincode (Name)" - Text input, required (synonym for id)
- `heading` - "Heading" - Text input (format: "overline **headline**")
- `description` - "Description" - Textarea
- `status` - "Status" - Select (active/inactive/archived)
- `owner_id` - "Owner (Email)" - Text input

**Notes:**
- Both `id` and `name` fields show the domaincode
- Form does not validate domaincode format yet (to be added later)
- Cannot edit domaincode after creation (immutable)

## HeadingParser Component

**Purpose:** Parse heading string into overline, headline, and subline components

**Format:** `"overline text **headline text** subline text"`

**Examples:**
- `"Project Overline **My Project**"` → overline: "Project Overline", headline: "My Project"
- `"**Just Headline**"` → headline: "Just Headline"
- `"Overline **Headline** Subline"` → all three parts

**Usage:**
```vue
<HeadingParser 
  :content="project.heading" 
  as="span"        <!-- or h1, h2, h3, etc. -->
  :compact="true"  <!-- compact mode for tiles -->
/>
```

## TypeScript Interfaces

### Backend (server/api/auth/login.post.ts)

```typescript
interface ProjectRecord {
    id: string
    name: string          // domaincode
    heading?: string      // heading from database
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}
```

### Frontend (src/types.ts)

```typescript
export interface Project {
    id: string
    name: string              // domaincode (mapped from database id)
    heading?: string          // heading field from database
    description?: string
    owner: string
    release?: string
    created_at?: string
    updated_at?: string
}
```

### Frontend Composable (src/composables/useAuth.ts)

```typescript
interface ProjectRecord {
    id: string
    name: string          // domaincode
    heading?: string      // heading from database
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}
```

## Data Flow

### Creating a Project

1. **User Input:**
   ```
   id: "myproject"
   heading: "Project Overline **My Cool Project**"
   ```

2. **API Validation:**
   - Check if `id` matches pattern `^[a-z][a-z0-9_]*$`
   - Check if ID already exists
   - Auto-generate heading if not provided: `"Project Overline **myproject**"`

3. **Database Insert:**
   ```sql
   INSERT INTO projects (id, heading, ...) 
   VALUES ('myproject', 'Project Overline **My Cool Project**', ...)
   ```

4. **API Response:**
   ```json
   {
     "name": "myproject",  // Mapped from id
     "heading": "Project Overline **My Cool Project**"
   }
   ```

5. **Frontend Display:**
   - Button/label: "myproject" (domaincode)
   - Tile/card: Two lines via HeadingParser
     - Line 1 (overline): "Project Overline"
     - Line 2 (headline): "My Cool Project"

### Updating a Project

1. **User Input:**
   ```json
   {
     "heading": "New Heading **Updated**",
     "description": "New description"
   }
   ```

2. **API Validation:**
   - Reject if trying to change `id` or `name`
   - Allow updating `heading`, `description`, `status`

3. **Database Update:**
   ```sql
   UPDATE projects 
   SET heading = 'New Heading **Updated**', 
       description = 'New description'
   WHERE id = 'myproject'
   ```

## Migration Notes

### From Previous Implementation

**Old Behavior:**
- `project.name` was the display name
- ID was auto-generated
- Heading field didn't exist

**New Behavior:**
- `project.name` is the domaincode (immutable ID)
- ID must be provided by user
- `project.heading` is the display heading (format: "Overline **Name**")

### Database Migration

Existing projects need:
1. Keep existing `id` values (they should already be domaincodes)
2. Migrate `name` → `heading` with format transformation
3. Ensure all IDs meet domaincode constraints

```sql
-- Example migration (already done in 000_base_schema.ts)
ALTER TABLE projects 
  ADD COLUMN heading TEXT,
  ADD CONSTRAINT domaincode_check CHECK(id ~ '^[a-z][a-z0-9_]*$');

UPDATE projects 
  SET heading = 'Project Overline **' || name || '**'
  WHERE heading IS NULL;
```

## Error Messages

| Error | Status | Message |
|-------|--------|---------|
| Missing ID | 400 | "Project ID (domaincode) is required" |
| Invalid format | 400 | "name needs to be a domaincode" |
| ID exists | 409 | "Project with this ID already exists" |
| Immutable ID | 400 | "Cannot change project ID or name (domaincode is immutable)" |

## Testing Checklist

- [ ] Create project with valid domaincode
- [ ] Create project with invalid domaincode (should fail)
- [ ] Create project with duplicate ID (should fail)
- [ ] Create project without heading (should auto-generate)
- [ ] Update project heading (should succeed)
- [ ] Attempt to change project ID (should fail)
- [ ] Display projects in ProjectToggle with two-line headings
- [ ] Display projects in ProjectsTable with domaincode and heading columns
- [ ] Login returns projects with both name and heading fields

## Future Enhancements

1. **Form Validation:**
   - Add real-time domaincode validation in AdminActionProjectsPanel
   - Show error messages for invalid characters
   - Suggest valid domaincodes

2. **Heading Editor:**
   - Rich text editor for heading format
   - Preview of parsed heading
   - Template suggestions

3. **Domaincode Generator:**
   - Suggest domaincodes based on project description
   - Check availability in real-time
   - Reserve domaincode during creation flow
