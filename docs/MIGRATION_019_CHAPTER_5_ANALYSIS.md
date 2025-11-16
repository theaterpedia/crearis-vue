# Migration 019 Chapter 5: Projects Auto-ID Analysis

## Database Changes

### Projects Table Schema Changes
- **id**: TEXT → INTEGER (SERIAL, auto-increment)
- **domaincode**: NEW field (TEXT, UNIQUE, NOT NULL) - receives old `id` value
- **name**: NEW field (TEXT) - receives old `heading` value  
- **heading**: KEPT as-is for backward compatibility
- **header_size**: NEW field (TEXT) - CHECK ('small', 'medium', 'large')
- **owner_id**: TEXT → INTEGER (references users.id)
- **regio**: TEXT → INTEGER (references projects.id)
- **type**: CHECK constraint updated to include 'location'

### Foreign Key Updates
Tables referencing projects.id need updates:
1. **events.project** - Update to use new integer ID (keep as TEXT for now)
2. **posts.project** - Update to use new integer ID (keep as TEXT for now)
3. **locations.project_id** - Update to use new integer ID (keep as TEXT for now)
4. **project_members.project_id** - Convert to INTEGER
5. **domains.project_id** - Update if exists
6. **projects.regio** - Self-referential, convert to INTEGER

---

## API Endpoint Changes Required

### Decision: Use `domaincode` for URL routing, `id` for internal references

#### Endpoints Using Project ID in URL (/:id route parameter)

**These should accept DOMAINCODE (old id value):**

1. **GET /api/projects/:id** ✅ 
   - Current: `WHERE id = ?` 
   - **CHANGE TO**: `WHERE domaincode = ?`
   - Returns: Add `domaincode` field, keep `id` as auto-increment

2. **PUT /api/projects/:id**
   - Current: `WHERE id = ?`
   - **CHANGE TO**: `WHERE domaincode = ?`
   - Update: If body contains `name`, write to DB `name` field

3. **DELETE /api/projects/:id**
   - Current: `WHERE id = ?`
   - **CHANGE TO**: `WHERE domaincode = ?`

#### Endpoints Using Project Data

4. **POST /api/projects** (Create)
   - Current: Accepts `id` in body
   - **CHANGE TO**: 
     - Accept `domaincode` in body (required, unique)
     - Accept `name` in body → write to `name` field
     - If `heading` provided, write to `heading` field too
   - Returns: Include both `id` (auto-increment) and `domaincode`

5. **GET /api/projects** (List)
   - Current: Returns projects with `id` field
   - **CHANGE TO**: 
     - Return both `id` and `domaincode`
     - Map `name` from DB `name` field (not heading)
     - Keep `heading` for backward compat

6. **POST /api/projects/add-member**
   - Current: Accepts `project_id` in body (probably TEXT)
   - **DECISION NEEDED**: Accept domaincode or numeric id?
   - **RECOMMEND**: Accept `domaincode`, lookup numeric id internally

#### Endpoints Filtering by Project

7. **GET /api/events?project=:id**
   - Current: Filter by project text ID
   - **CHANGE TO**: 
     - Accept domaincode in query param
     - Lookup project.id by domaincode
     - Filter events by numeric project.id

8. **GET /api/posts?project=:id**
   - Current: Filter by project text ID
   - **CHANGE TO**: Same as events

9. **GET /api/users?project_id=:id**
   - Current: Filter users by project
   - **CHANGE TO**: Accept domaincode, lookup numeric ID

---

## Component/Frontend Changes Required

### Components Using Project Data

#### 1. **useAuth.ts** ✅ NEEDS UPDATE
```typescript
interface ProjectRecord {
    id: string          // CHANGE TO: number (auto-increment ID)
    name: string        // Currently "domaincode" - KEEP AS IS
    heading?: string    // Database heading field
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}
```

**Changes needed:**
- `id` should be NUMBER (auto-increment)
- `name` should be the domaincode (TEXT)
- When calling `/api/projects/:id`, use `name` (domaincode) not `id`

#### 2. **ProjectToggle.vue** ✅ NEEDS UPDATE
- Uses `project.id` and `project.name`
- **Current**: `name` is domaincode, displayed in toggle
- **After migration**: 
  - `id` = numeric auto-increment
  - `name` = domaincode (for display and URLs)
  - `heading` = project heading/title

**Changes:**
- Line 186: `currentProjectName` uses `project.name` ✅ CORRECT
- `selectProject(projectId)` - should pass DOMAINCODE not numeric id
- Frontend should work with domaincode for routing

#### 3. **ProjectsTable.vue** ⚠️ NEEDS UPDATE
```vue
<td class="td-domaincode">{{ project.name }}</td>
<td class="td-heading">
    <HeadingParser v-if="project.heading" :content="project.heading" />
</td>
```

**Current behavior:**
- Displays `name` as domaincode ✅
- Displays `heading` separately ✅

**After migration:**
- `project.id` = numeric (don't display)
- `project.domaincode` = TEXT (display this)
- `project.name` = from DB `name` field (formerly heading)
- `project.heading` = still exists for backward compat

**Required changes:**
- Change `{{ project.name }}` to `{{ project.domaincode }}`
- Keep heading display as-is

#### 4. **ProjectModal.vue** ⚠️ NEEDS UPDATE
```typescript
interface Project {
    id?: string         // CHANGE TO: number
    name: string        // This should be "heading/title" from user input
    description?: string
    status: 'draft' | 'active' | 'archived'
}
```

**Changes:**
- When creating: Generate `domaincode` from `name` (slug format)
- Send `domaincode` to API
- Send `name` to API (goes to DB `name` field)

#### 5. **AdminActionProjectsPanel.vue** ⚠️ NEEDS UPDATE
```typescript
const allProjectFields: ProjectField[] = [
    { name: 'id', label: 'Domaincode (ID)', type: 'text', required: true },
    { name: 'name', label: 'Domaincode (Name)', type: 'text', required: true },  // CONFUSING!
    { name: 'heading', label: 'Heading', type: 'text' },
    ...
]
```

**This is CONFUSING. Should be:**
```typescript
const allProjectFields: ProjectField[] = [
    { name: 'domaincode', label: 'Domaincode', type: 'text', required: true },
    { name: 'name', label: 'Name/Heading', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    ...
]
```

**Changes:**
- Field `id` → `domaincode` (user-facing unique identifier)
- Field `name` → actual project name/heading
- Remove confusion between id/name

#### 6. **Home.vue** ✅ MOSTLY OK
- Fetches projects from API
- Displays using `project.heading` or `project.id` fallback
- **After migration**: Should use `project.name` or `project.heading`

#### 7. **ProjectSite.vue** ⚠️ NEEDS UPDATE
```typescript
domaincode.value = route.params.domaincode as string
await fetchProject(domaincode.value)  // Calls /api/projects/:id
```

**Current behavior:**
- Routes use domaincode in URL ✅
- Fetches project by domaincode ✅
- Displays `project.heading || project.id` ⚠️

**After migration:**
- Route param is domaincode ✅
- API should accept domaincode in URL ✅  
- Display should use `project.name` or `project.heading`

---

## Migration Strategy Summary

### Phase 1: Database Migration (Done in Chapter 5)
✅ Migrate projects table
✅ Update all foreign keys
✅ Create indexes

### Phase 2: API Endpoint Updates (TODO)
1. Update all project endpoints to use `domaincode` for URL routing
2. Return both `id` (numeric) and `domaincode` (TEXT) in responses
3. Map `name` field correctly (from DB `name`, not `heading`)
4. Update filtering endpoints (events, posts, users)

### Phase 3: Frontend Updates (TODO)
1. Update `useAuth.ts` interface - `id` should be number
2. Update `ProjectsTable.vue` - use `domaincode` not `name` for display
3. Update `ProjectModal.vue` - handle domaincode generation
4. Update `AdminActionProjectsPanel.vue` - clarify field names
5. Update `ProjectSite.vue` - use correct field for display
6. Update `Home.vue` - use `name` or `heading` appropriately

### Phase 4: Testing
- Test project CRUD operations
- Test filtering by project (events, posts)
- Test project member operations
- Test project toggle/selection
- Test URL routing with domaincode

---

## Recommended Field Usage Going Forward

| Context | Use `domaincode` | Use `name` | Use `heading` |
|---------|------------------|------------|---------------|
| **URL routing** | ✅ `/projects/:domaincode` | ❌ | ❌ |
| **User display (table)** | ✅ Show domaincode | ✅ Show name | ⚠️ Optional |
| **API request body** | ✅ Required for create | ✅ Required | ⚠️ Optional |
| **API response** | ✅ Always include | ✅ Always include | ⚠️ Include if set |
| **Internal DB queries** | ⚠️ For lookups | ✅ User-facing name | ⚠️ Fallback |
| **Foreign keys** | ❌ | ❌ | ❌ |
| **Numeric ID** | ❌ | ❌ | ❌ |

**Note**: Numeric `id` field should be used ONLY for:
- Database foreign key references
- Internal joins
- Never exposed in URLs

