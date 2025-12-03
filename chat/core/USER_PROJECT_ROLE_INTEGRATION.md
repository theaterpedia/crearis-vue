# User-Project Role Integration

## Overview

The authentication system has been updated to automatically check for matching projects when a user logs in. If a user has a corresponding project record (matched by `username`), the user's session will include additional project information.

## Authentication Flow

### 1. Login Process

When a user logs in (`POST /api/auth/login`):

1. **Verify credentials** against `users` table
   - Username match
   - Password verification (bcrypt)

2. **Check for matching project**
   - Query `projects` table for matching `username`
   - If found, extract project role and ID

3. **Create session** with combined data:
   ```typescript
   {
     userId: string
     username: string
     role: string           // User's primary role from users table
     projectRole?: string   // Role from projects table (if exists)
     projectId?: string     // Project ID (if exists)
     expiresAt: number
   }
   ```

4. **Return user data** including project info:
   ```typescript
   {
     success: true,
     user: {
       id: string
       username: string
       role: string
       projectRole?: string    // Only if project found
       projectId?: string      // Only if project found
       projectName?: string    // Only if project found
     }
   }
   ```

### 2. Session Validation

When checking session (`GET /api/auth/session`):

Returns the same structure including project information:
```typescript
{
  authenticated: true,
  user: {
    id: string
    username: string
    role: string
    projectRole?: string
    projectId?: string
  }
}
```

## Database Schema

### Users Table
Primary authentication source:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hashed
  role TEXT NOT NULL CHECK (role IN ('admin', 'base', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Projects Table
Optional project associations:
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  username TEXT,          -- Matches users.username
  name TEXT NOT NULL,
  type TEXT,
  role TEXT,              -- Project-specific role
  status TEXT,
  -- ... other fields
)
```

## Example: User with Project

### User: tp

**users table:**
```json
{
  "id": "usr_abc123",
  "username": "tp",
  "password": "$2a$10$...",
  "role": "user"
}
```

**projects table:**
```json
{
  "id": "prj_tp001",
  "username": "tp",
  "name": "Theaterpedia",
  "type": "theater",
  "role": "project"
}
```

**Login response:**
```json
{
  "success": true,
  "user": {
    "id": "usr_abc123",
    "username": "tp",
    "role": "user",
    "projectRole": "project",
    "projectId": "prj_tp001",
    "projectName": "Theaterpedia"
  }
}
```

## Example: User without Project

### User: admin

**users table:**
```json
{
  "id": "usr_admin",
  "username": "admin",
  "password": "$2a$10$...",
  "role": "admin"
}
```

**projects table:**
No matching record

**Login response:**
```json
{
  "success": true,
  "user": {
    "id": "usr_admin",
    "username": "admin",
    "role": "admin"
  }
}
```

## Use Cases

### 1. Project-Specific Access

Users with `projectRole` can access project-specific features:

```typescript
// In Vue component
const { user } = useAuth()

if (user.value?.projectRole) {
  // User has a project - show project dashboard
  router.push('/project')
} else {
  // User has no project - show regular dashboard
  router.push('/dashboard')
}
```

### 2. Role-Based Routing

Router can check both roles:

```typescript
router.beforeEach((to, from, next) => {
  const user = await checkSession()
  
  if (to.path === '/project') {
    if (user.projectRole === 'project' || user.role === 'admin') {
      next()
    } else {
      next('/dashboard')
    }
  }
})
```

### 3. API Authorization

API endpoints can check project association:

```typescript
export default defineEventHandler(async (event) => {
  const session = getSession(event)
  
  if (!session.projectId) {
    throw createError({
      statusCode: 403,
      message: 'Project access required'
    })
  }
  
  // User has project access
  // ...
})
```

## Security Considerations

1. **Password verification** happens only against `users` table
2. **Projects table** is never used for authentication
3. **Project role** is supplementary information only
4. **Admin users** have access regardless of project association
5. **Session expiry** is 24 hours for all users

## Benefits

1. **Single login** for both user and project access
2. **Automatic project detection** - no manual role assignment needed
3. **Backward compatible** - users without projects work as before
4. **Flexible authorization** - can check either `role` or `projectRole`
5. **No data duplication** - password stored only in `users` table

## Migration Notes

### Existing Users

No migration needed. Users without projects continue to work normally.

### Project Users (tp, regio1)

These users now have dual roles:
- `role: 'user'` (from users table)
- `projectRole: 'project'` (from projects table)

They can access both user features and project features.

## Testing

### Test Scenarios

1. ✅ **Admin user** (no project) → can access admin features
2. ✅ **Base user** (no project) → can access base features  
3. ✅ **Project user** (tp/regio1) → can access both user + project features
4. ✅ **Regular user** (no project) → can access standard features

### Test Commands

```bash
# Test tp user (has project)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"tp","password":"password123"}'

# Test admin user (no project)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Files Modified

1. **server/api/auth/login.post.ts**
   - Added project lookup query
   - Extended session data structure
   - Added project info to response

2. **server/api/auth/session.get.ts**
   - Added `projectRole` and `projectId` to response

## Next Steps

Consider implementing:
1. Project permissions system
2. Multi-project support (user belongs to multiple projects)
3. Project-specific data filtering
4. Project team member management
