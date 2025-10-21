# Project Role Management System

**Version**: 2.0  
**Date**: October 21, 2025

## Overview

This document describes the comprehensive project role management system that automatically detects project access, manages project selection via a navbar toggler, and implements capability-based permissions.

## Architecture

### Key Components

1. **Enhanced useAuth Composable** - Session management with project records
2. **ProjectToggle Component** - Navbar dropdown for project selection
3. **Automatic Project Detection** - Login-time discovery of project access
4. **Capability System** - Permission-based access control
5. **Strict Route Protection** - Enforces projectId requirement for /project route

## Automatic Project Detection

### Login Flow

When a user logs in, the system automatically:

1. **Checks for Owned Projects**
   ```sql
   SELECT id, username, name FROM projects WHERE owner_id = ?
   ```

2. **Checks for Member Projects**
   ```sql
   SELECT p.id, p.username, p.name
   FROM projects p
   INNER JOIN project_members pm ON p.id = pm.project_id
   WHERE pm.user_id = ?
   ```

3. **Checks for Instructor Projects** (via events)
   ```sql
   SELECT DISTINCT p.id, p.username, p.name
   FROM projects p
   INNER JOIN events e ON p.id = e.project
   INNER JOIN event_instructors ei ON e.id = ei.event_id
   INNER JOIN users u ON u.instructor_id = ei.instructor_id
   WHERE u.id = ?
   ```
   
   Note: Users have an `instructor_id` field. If a user is an instructor, they're linked via this field.

4. **Checks for Author Projects** (via posts)
   ```sql
   SELECT DISTINCT p.id, p.username, p.name
   FROM projects p
   INNER JOIN posts po ON p.id = po.project
   WHERE po.author_id = ?
   ```

### Project Record Structure

Each project in the session has flags:

```typescript
interface ProjectRecord {
    id: string
    name: string
    username: string
    isOwner: boolean        // User owns the project
    isMember: boolean       // User is explicit member
    isInstructor: boolean   // User teaches events in project
    isAuthor: boolean       // User authors posts in project
}
```

### Default Project Selection

The system automatically selects a default project in this priority order:

1. **First Owned Project** - Highest priority
2. **First Member Project** - If no owned projects
3. **First Instructor Project** - If no owned/member projects
4. **First Author Project** - Last resort

If no projects are found, the user stays in 'user' role without project access.

### Role Activation

- **Base users**: Always stay in 'base' role
- **Users with projects**: Automatically switched to 'project' role with default project set
- **Users without projects**: Stay in 'user' role

## Session Structure

### Enhanced Session Data

```typescript
interface SessionData {
    userId: string
    username: string
    availableRoles: string[]              // e.g., ['user', 'project']
    activeRole: string                    // Current active role
    projectId: string | null              // Currently selected project
    projectName?: string                  // Project display name
    projects?: ProjectRecord[]            // All accessible projects
    capabilities?: Record<string, Set<string>>  // Permission sets
    expiresAt: number
}
```

## ProjectToggle Component

### Location

Positioned in the navbar, **second from right** (before RoleToggle).

### Visibility

- Only visible when `activeRole === 'project'`
- Only shown if `projects.length > 0`

### Dropdown Structure

Three sections organized by access level:

#### A. Owner Section
- Projects where `isOwner === true`
- Full control over project
- Icon: User/person icon

#### B. Team Section  
- Projects where `isMember === true` and `isOwner === false`
- Team member access
- Icon: Team/group icon

#### C. Partner Section
- Projects where neither owner nor member, but `isInstructor === true` or `isAuthor === true`
- Contributor access
- Icon: Network icon

### Project Tiles

Each tile displays:
- **Project name** (heading)
- **Project username** (@username, subline)
- **Role badges** (small icons):
  - Instructor icon (graduation cap) if `isInstructor === true`
  - Author icon (pen) if `isAuthor === true`

### Selection Behavior

- **Single selection**: Only one project active at a time
- **Automatic navigation**: Setting projectId navigates to `/project`
- **Clear selection**: "Clear Selection" button sets projectId to null, navigates to `/`

## Capability System

### Structure

Capabilities are stored as:

```typescript
capabilities: {
    'project': Set<string>  // e.g., Set(['settings', 'events', 'posts'])
}
```

### Permission Calculation

Based on project flags:

#### Owner Permissions
```typescript
isOwner: true
→ capabilities.project = Set(['settings', 'events', 'posts'])
```

Full access to:
- Project settings
- All events
- All posts

#### Member Permissions
```typescript
isMember: true
→ capabilities.project = Set([
    'events.create',
    'events.alter',
    'posts.create',
    'posts.alter'
])
```

Can create and edit events and posts.

#### Author Permissions
```typescript
isAuthor: true
→ adds to capabilities.project:
    - 'events.alter'
    - 'posts.create'
    - 'posts.alter'
```

Can alter events and manage posts.

#### Instructor Permissions
```typescript
isInstructor: true
→ adds to capabilities.project:
    - 'posts.alter'
    - 'posts.create'
```

Can create and alter posts.

### Capability Reset

Capabilities are **cleared when activeRole changes** or when projectId is set to null.

### Checking Capabilities

```typescript
// In composable
const { hasCapability } = useAuth()

// Check permission
if (hasCapability('project', 'settings')) {
    // User can access settings
}

if (hasCapability('project', 'events.create')) {
    // User can create events
}
```

## Route Protection

### Enhanced /project Route

```typescript
{
    path: '/project',
    component: ProjectMain,
    meta: { requiresAuth: true, role: 'project' }
}
```

**Protection Rules**:
1. User must be authenticated
2. User must be in 'project' role
3. **User must have projectId set** (new requirement)

### Navigation Guard Logic

```typescript
if (to.path === '/project') {
    if (data.user.activeRole !== 'project') {
        next('/')  // Not in project role
        return
    }
    if (!data.user.projectId) {
        next('/')  // No project selected
        return
    }
}
```

### Automatic Navigation

- **Setting projectId**: Automatically navigates to `/project`
- **Clearing projectId**: Automatically navigates to `/`
- **ProjectToggle always visible** on `/project` route for easy switching

## API Endpoints

### POST /api/auth/set-project

Set the active project for the current session.

**Request**:
```json
{
    "projectId": "tp" | null
}
```

**Response** (success):
```json
{
    "success": true,
    "projectId": "tp",
    "projectName": "Theaterpedia",
    "capabilities": {
        "project": ["settings", "events", "posts"]
    }
}
```

**Response** (clear):
```json
{
    "success": true,
    "projectId": null
}
```

**Errors**:
- `401`: Not authenticated
- `403`: Not in project role
- `404`: Project not found or access denied

### GET /api/auth/session

Returns enhanced session data including projects and capabilities.

**Response**:
```json
{
    "authenticated": true,
    "user": {
        "id": "alice@theaterpedia.org",
        "username": "alice",
        "availableRoles": ["user", "project"],
        "activeRole": "project",
        "projectId": "tp",
        "projectName": "Theaterpedia",
        "projects": [
            {
                "id": "tp",
                "name": "Theaterpedia",
                "username": "tp",
                "isOwner": true,
                "isMember": false,
                "isInstructor": false,
                "isAuthor": false
            }
        ],
        "capabilities": {
            "project": ["settings", "events", "posts"]
        }
    }
}
```

## Usage Examples

### Check Current Project

```typescript
import { useAuth } from '@/composables/useAuth'

const { user, currentProject } = useAuth()

if (currentProject.value) {
    console.log('Current project:', currentProject.value.name)
    console.log('Is owner:', currentProject.value.isOwner)
}
```

### Switch Projects

```typescript
import { useAuth } from '@/composables/useAuth'

const { setProjectId } = useAuth()

// Select a project
await setProjectId('tp')  // Navigates to /project

// Clear selection
await setProjectId(null)  // Navigates to /
```

### Check Permissions

```typescript
import { useAuth } from '@/composables/useAuth'

const { hasCapability } = useAuth()

// In template
<button v-if="hasCapability('project', 'settings')">
    Project Settings
</button>

// In script
if (hasCapability('project', 'events.create')) {
    // Show create event button
}
```

### Conditional UI Based on Role

```vue
<template>
    <div v-if="currentProject">
        <h2>{{ currentProject.name }}</h2>
        
        <!-- Owner only -->
        <div v-if="currentProject.isOwner">
            <button>Project Settings</button>
        </div>
        
        <!-- Member or Owner -->
        <div v-if="currentProject.isMember || currentProject.isOwner">
            <button>Create Event</button>
        </div>
        
        <!-- Any access -->
        <div>
            <button v-if="hasCapability('project', 'posts.create')">
                Create Post
            </button>
        </div>
    </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

const { currentProject, hasCapability } = useAuth()
</script>
```

## Database Requirements

### Existing Tables Used

1. **projects** - Project definitions
   - `id`, `username`, `name`, `owner_id`

2. **project_members** - Explicit membership
   - `project_id`, `user_id`

3. **events** - Project events
   - `id`, `project_id`

4. **event_instructors** - Event teaching assignments
   - `event_id`, `instructor_id`

5. **instructors** - Instructor records
   - `id`, `user_id`, `is_user`

6. **posts** - Project posts/articles
   - `id`, `project_id`, `author_id`

### Required Relationships

```sql
-- Owner relationship
projects.owner_id → users.id

-- Member relationship
project_members.user_id → users.id
project_members.project_id → projects.id

-- Instructor relationship
users.instructor_id → instructors.id
event_instructors.instructor_id → instructors.id
event_instructors.event_id → events.id
events.project → projects.id

-- Author relationship
posts.author_id → users.id
posts.project → projects.id
```

## Migration Guide

### From Old System

**Before**:
- Single project per user-account
- Project role based on username match
- No multi-project support
- No capability system

**After**:
- Multiple projects per user
- Project role based on ownership/membership/contribution
- Automatic project detection
- Granular capability-based permissions

### Breaking Changes

1. **projectId now nullable**: Must check `projectId !== null` before accessing `/project`
2. **projects array added**: Session now contains all accessible projects
3. **capabilities object added**: Replaces role-based checks for project features

### Update Checklist

- [x] Update `useAuth` composable with new types
- [x] Add `ProjectToggle` component to Navbar
- [x] Update login logic with project detection
- [x] Create `/api/auth/set-project` endpoint
- [x] Update session endpoint to return projects
- [x] Add strict route protection for `/project`
- [x] Implement capability calculation
- [ ] Update UI components to use capabilities
- [ ] Update project views to handle projectId
- [ ] Test multi-project workflows

## Testing Scenarios

### Scenario 1: Owner of Multiple Projects
- Login as user who owns 2+ projects
- Verify first project is auto-selected
- Verify project toggle shows all owned projects in "Owner" section
- Switch between projects
- Verify capabilities show `['settings', 'events', 'posts']`

### Scenario 2: Member Only
- Login as user who is member but not owner
- Verify first member project is auto-selected
- Verify project toggle shows project in "Team" section
- Verify capabilities show event/post create/alter permissions

### Scenario 3: Instructor Only
- Login as user who teaches but isn't member/owner
- Verify first instructor project is auto-selected
- Verify project toggle shows project in "Partner" section
- Verify instructor badge appears on tile
- Verify capabilities show post create/alter permissions

### Scenario 4: Mixed Roles
- Login as user who is owner of project A, member of project B, instructor in project C
- Verify project A is auto-selected (owner priority)
- Verify toggle shows A in "Owner", B in "Team", C in "Partner"
- Switch to project C
- Verify instructor badge shows on tile

### Scenario 5: No Project Access
- Login as regular user with no projects
- Verify stays in 'user' role
- Verify no 'project' in availableRoles
- Verify ProjectToggle is hidden
- Verify cannot access `/project` route

## Future Enhancements

1. **Project Invitations** - Allow owners to invite users as members
2. **Role-Based Capabilities** - More granular roles (editor, viewer, contributor)
3. **Project Groups** - Organize projects into folders/categories
4. **Recent Projects** - Track and show recently accessed projects
5. **Project Search** - Filter projects in toggle dropdown
6. **Favorite Projects** - Star frequently used projects
7. **Project Notifications** - Badge counts for unread activity
8. **Delegation** - Temporary project access grants

---

**Maintainer**: Demo Data Team  
**Last Updated**: October 21, 2025
