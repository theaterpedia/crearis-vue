# Multi-Role Authentication with Role Toggle

## Overview

The authentication system supports users with multiple roles. Users can switch between available roles via a toggle in the navbar. The session maintains all available roles but only one is active at a time.

## Key Concepts

### Available Roles vs Active Role

- **Available Roles**: All roles a user can access (stored in `availableRoles` array)
- **Active Role**: The currently selected role (stored in `activeRole` string)

### Role Rules

1. **Base users**: Always have `activeRole: 'base'` (cannot toggle)
2. **Users with project**: Have `availableRoles: ['user', 'project']` and can toggle between them
3. **Users without project**: Have `availableRoles: ['user']` (no toggle shown)
4. **Admin users**: Have `availableRoles: ['admin']` (no toggle shown)

## Authentication Flow

### 1. Login Process

When a user logs in (`POST /api/auth/login`):

```typescript
// 1. Verify credentials against users table
const user = await db.get('SELECT * FROM users WHERE username = ?', [username])

// 2. Check for matching project
const project = await db.get('SELECT * FROM projects WHERE username = ?', [username])

// 3. Build available roles
const availableRoles = [user.role]
if (user.role === 'user' && project) {
  availableRoles.push('project')
}

// 4. Determine active role
const activeRole = user.role === 'base' ? 'base' : user.role

// 5. Create session
sessions.set(sessionId, {
  userId: user.id,
  username: user.username,
  availableRoles,
  activeRole,
  projectId: project?.id,
  projectName: project?.name,
  expiresAt
})
```

### 2. Role Switching

Users can switch roles via `POST /api/auth/switch-role`:

```typescript
// Request
{
  "role": "project"  // Must be in availableRoles
}

// Response
{
  "success": true,
  "activeRole": "project",
  "availableRoles": ["user", "project"]
}
```

**Logic**:
- Validates that requested role is in `availableRoles`
- Updates `session.activeRole`
- Page reloads to reflect new role context

### 3. Session Validation

`GET /api/auth/session` returns:

```typescript
{
  "authenticated": true,
  "user": {
    "id": "usr_123",
    "username": "tp",
    "availableRoles": ["user", "project"],
    "activeRole": "project",
    "projectId": "prj_tp001",
    "projectName": "Theaterpedia"
  }
}
```

## UI Components

### RoleToggle Component

Located at `src/components/RoleToggle.vue`

**Features**:
- Only visible if user has multiple roles AND is not a base user
- Shows buttons for each available role
- Highlights the active role
- Calls `/api/auth/switch-role` endpoint
- Reloads page after successful role switch

**Icons**:
- User role: Person icon
- Project role: Grid/layout icon
- Base role: House icon

**Example Usage**:
```vue
<template>
  <Navbar>
    <template #menus>
      <RoleToggle />
    </template>
  </Navbar>
</template>
```

### Toggle Visibility Logic

```typescript
const canToggle = computed(() => {
  return availableRoles.value.length > 1 && 
         !availableRoles.value.includes('base')
})
```

**When toggle is shown**:
- ✅ User with project: `['user', 'project']` → Shows toggle
- ❌ Base user: `['base']` → No toggle (always base)
- ❌ Admin user: `['admin']` → No toggle (always admin)
- ❌ Regular user: `['user']` → No toggle (only one role)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'base', 'user')),
  created_at TIMESTAMP
)
```

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  username TEXT,
  name TEXT,
  role TEXT,
  -- ... other fields
)
```

## Examples

### Example 1: User with Project (tp)

**Login Response**:
```json
{
  "success": true,
  "user": {
    "id": "usr_tp",
    "username": "tp",
    "availableRoles": ["user", "project"],
    "activeRole": "user",
    "projectId": "prj_tp001",
    "projectName": "Theaterpedia"
  }
}
```

**UI**: Toggle visible with "User" and "Project" buttons

**After clicking "Project"**:
- Active role switches to "project"
- Page reloads
- User can access `/project` route

### Example 2: Base User

**Login Response**:
```json
{
  "success": true,
  "user": {
    "id": "usr_base",
    "username": "base_user",
    "availableRoles": ["base"],
    "activeRole": "base"
  }
}
```

**UI**: No toggle shown (base users always stay in base mode)

### Example 3: Regular User (no project)

**Login Response**:
```json
{
  "success": true,
  "user": {
    "id": "usr_regular",
    "username": "regular_user",
    "availableRoles": ["user"],
    "activeRole": "user"
  }
}
```

**UI**: No toggle shown (only one role available)

## Authorization Checks

### In Vue Components

```typescript
import { useAuth } from '@/composables/useAuth'

const { user, isAdmin, isBase, isProject } = useAuth()

// Check active role
if (user.value?.activeRole === 'project') {
  // Show project features
}

// Check available roles
if (user.value?.availableRoles.includes('project')) {
  // User CAN switch to project mode
}
```

### In Router

```typescript
// Route meta
{ 
  path: '/project', 
  component: ProjectView,
  meta: { requiresAuth: true, role: 'project' }
}

// Navigation guard checks activeRole
if (to.meta.role && data.user.activeRole !== to.meta.role) {
  // Redirect if active role doesn't match
}
```

### In API Endpoints

```typescript
export default defineEventHandler(async (event) => {
  const session = getSession(event)
  
  if (session.activeRole !== 'project') {
    throw createError({
      statusCode: 403,
      message: 'Project role required'
    })
  }
})
```

## Composable Updates

### useAuth Composable

Updated interface:
```typescript
interface User {
  id: string
  username: string
  availableRoles: string[]
  activeRole: string
  projectId?: string
  projectName?: string
}
```

New method:
```typescript
const refreshUser = async () => {
  await checkSession()
}
```

Updated computed properties:
```typescript
const isAdmin = computed(() => user.value?.activeRole === 'admin')
const isBase = computed(() => user.value?.activeRole === 'base')
const isProject = computed(() => user.value?.activeRole === 'project')
```

## Workflow Examples

### Scenario 1: tp User Workflow

1. **Login**: tp logs in → `activeRole: 'user'`
2. **Dashboard**: Sees user dashboard at `/`
3. **Toggle**: Clicks "Project" button in navbar
4. **API Call**: `POST /api/auth/switch-role { role: 'project' }`
5. **Reload**: Page reloads → `activeRole: 'project'`
6. **Redirect**: Router redirects to `/project`
7. **Project View**: tp can now manage their project

### Scenario 2: Base User Workflow

1. **Login**: base_user logs in → `activeRole: 'base'`
2. **Base View**: Automatically at `/base`
3. **No Toggle**: Toggle not shown (base users locked to base)
4. **Access**: Can only access base-specific features

### Scenario 3: Switch Back to User Mode

1. **Current State**: tp in project mode
2. **Toggle**: Clicks "User" button
3. **API Call**: `POST /api/auth/switch-role { role: 'user' }`
4. **Reload**: Page reloads → `activeRole: 'user'`
5. **Dashboard**: Back to user dashboard

## Benefits

1. **Flexible Access**: Users can access multiple contexts with one login
2. **Clear Separation**: Active role clearly defines current context
3. **Easy Toggle**: Simple UI to switch between roles
4. **Secure**: Role validation on both client and server
5. **Base Protection**: Base users cannot accidentally leave base mode
6. **Progressive Enhancement**: Regular users without projects not affected

## Security Considerations

1. **Server-side validation**: All role switches validated server-side
2. **Session integrity**: availableRoles set at login, cannot be modified client-side
3. **Route protection**: Router guards check activeRole before allowing access
4. **API authorization**: Endpoints validate activeRole in session
5. **No role escalation**: Users cannot switch to roles not in availableRoles

## Files Modified

1. **server/api/auth/login.post.ts** - Multi-role session creation
2. **server/api/auth/switch-role.post.ts** - New endpoint for role switching
3. **server/api/auth/session.get.ts** - Returns availableRoles and activeRole
4. **src/composables/useAuth.ts** - Updated User interface and role checks
5. **src/components/RoleToggle.vue** - New toggle component
6. **src/components/Navbar.vue** - Added RoleToggle to navbar
7. **src/router/index.ts** - Updated to use activeRole

## Testing

### Test Cases

1. ✅ tp user logs in → Has toggle, can switch between user/project
2. ✅ regio1 user logs in → Has toggle, can switch between user/project
3. ✅ Base user logs in → No toggle, locked to base mode
4. ✅ Admin user logs in → No toggle, admin access
5. ✅ Regular user logs in → No toggle, only user role
6. ✅ Role switch persists across page reloads
7. ✅ Cannot switch to unavailable role
8. ✅ Route access based on activeRole

### Test Commands

```bash
# Login as tp
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"tp","password":"password123"}'

# Switch to project role
curl -X POST http://localhost:3000/api/auth/switch-role \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -d '{"role":"project"}'

# Check session
curl http://localhost:3000/api/auth/session \
  -H "Cookie: sessionId=YOUR_SESSION_ID"
```
