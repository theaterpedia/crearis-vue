# STAGE 1: Authentication, Roles, and Routing

**Date:** October 13-14, 2025  
**Status:** ✅ Complete  
**Branch:** beta_tasks_and_versioning

---

## 📋 Overview

Implemented a complete authentication system with role-based access control, session management, and protected routing for the demo-data application.

---

## 🔐 Generated User Credentials

**⚠️ SAVE THESE CREDENTIALS SECURELY! ⚠️**


---

## 🗄️ Database Schema

### Table: `projects` (serves as user table)

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'base', 'project')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)
```

**Roles:**
- `admin` - Full access to all features and data
- `base` - Access to base dashboard and limited features
- `project` - Access to project dashboard and project-specific features

**Initial Users:**
- 1 admin user
- 1 base user
- 2 project users

---

## 🔌 API Endpoints

### POST /api/auth/login
**Purpose:** Authenticate user and create session

**Request:**
```json
{
  "username": "admin",
  "password": "nEumJ7uq1qFNMMom"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (Error):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Features:**
- Bcrypt password verification
- Session creation with 24-hour expiration
- HTTP-only cookie for session security
- Returns user object without sensitive data

### GET /api/auth/session
**Purpose:** Check current authentication status

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "abc123",
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false,
  "user": null
}
```

**Features:**
- Validates session from cookie
- Checks session expiration
- Auto-cleanup of expired sessions

### POST /api/auth/logout
**Purpose:** End user session

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Features:**
- Removes session from store
- Deletes session cookie
- Safe to call even if not logged in

---

## 🎨 Frontend Components

### Login Component (`src/views/Login.vue`)

**Features:**
- Username and password input fields
- Form validation
- Loading states
- Error messages
- Role-based redirect after login

**Routing:**
- `admin` → `/` (TaskDashboard)
- `base` → `/base` (BaseView)
- `project` → `/project` (ProjectView)
- Invalid credentials → Show error

**UI Elements:**
- Clean, centered login card
- Responsive design
- Disabled state during loading
- Clear error messaging

### Protected Views

#### BaseView (`src/views/BaseView.vue`)
- Accessible to users with `base` role
- Shows user information
- Placeholder for future base functionality
- Logout button

#### ProjectView (`src/views/ProjectView.vue`)
- Accessible to users with `project` role
- Shows user information
- Placeholder for future project functionality
- Logout button

### Updated TaskDashboard (`src/views/TaskDashboard.vue`)

**Authentication States:**

**Unauthenticated:**
- Hides task list and statistics
- Shows authentication prompt
- "Go to Login" button

**Authenticated:**
- Shows user info bar (username and role)
- Displays all tasks and stats
- Full dashboard functionality
- Logout button in header

---

## 🔄 Session Management

### In-Memory Store
**File:** `server/api/auth/login.post.ts`

```typescript
const sessions = new Map<string, {
  userId: string
  username: string
  role: string
  expiresAt: number
}>()
```

**Features:**
- Session ID: 32-character nanoid
- Expiration: 24 hours
- Auto-cleanup: Every 5 minutes
- HTTP-only cookie delivery

**Production Considerations:**
- Replace with Redis or similar for scalability
- Enable clustering support
- Add session persistence

---

## 🛣️ Routing & Navigation Guards

### Routes Configuration (`src/router/index.ts`)

**Public Routes:**
- `/login` - Login page (public)

**Protected Routes:**
- `/` - TaskDashboard (requires authentication)
- `/base` - BaseView (requires `base` role)
- `/project` - ProjectView (requires `project` role)

**Other Routes:**
- `/home`, `/catalog`, `/demo`, `/heroes`, `/timeline` - Public

### Navigation Guard Logic

```typescript
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    // Check session
    const response = await fetch('/api/auth/session')
    const data = await response.json()
    
    if (!data.authenticated) {
      next('/login')
      return
    }
    
    // Check role if specified
    if (to.meta.role && data.user.role !== to.meta.role 
        && data.user.role !== 'admin') {
      // Redirect to appropriate page based on role
      next(roleBasedRedirect(data.user.role))
      return
    }
    
    next()
  } else {
    next()
  }
})
```

**Features:**
- Server-side session validation
- Role-based access control
- Admin bypass (admin can access all routes)
- Automatic redirects for unauthorized access

---

## 🎯 Authentication Composable

### useAuth (`src/composables/useAuth.ts`)

**Reactive State:**
```typescript
const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)
```

**Computed Properties:**
- `isAdmin` - Check if user is admin
- `isBase` - Check if user is base
- `isProject` - Check if user is project
- `authState` - Current auth state string

**Methods:**

#### checkSession()
```typescript
const checkSession = async () => {
  // Fetch /api/auth/session
  // Update user and isAuthenticated
}
```

#### login(username, password)
```typescript
const login = async (username: string, password: string) => {
  // POST /api/auth/login
  // Return { success, error? }
}
```

#### logout()
```typescript
const logout = async () => {
  // POST /api/auth/logout
  // Clear state
  // Redirect to /login
}
```

#### requireAuth()
```typescript
const requireAuth = async () => {
  // Check auth, redirect if needed
  // Return boolean
}
```

#### requireRole(role)
```typescript
const requireRole = (role: 'admin' | 'base' | 'project') => {
  // Check specific role
  // Redirect if wrong role
}
```

---

## 🔒 Security Features

### Password Security
- **Hashing:** bcryptjs with salt rounds = 10
- **Storage:** Only hashed passwords in database
- **Transmission:** Plain password only during login (HTTPS required in production)

### Session Security
- **HTTP-only cookies:** Prevents XSS attacks
- **SameSite:** 'lax' setting
- **Secure flag:** Enabled in production
- **Expiration:** 24-hour timeout
- **Auto-cleanup:** Expired sessions removed

### API Security
- **Input validation:** Username and password required
- **Error messages:** Generic "Invalid credentials" (no user enumeration)
- **Rate limiting:** Recommended for production
- **CORS:** Configured for API endpoints

---

## 🎨 User Experience

### Login Flow
1. User visits protected route (e.g., `/`)
2. Not authenticated → Redirect to `/login`
3. User enters credentials
4. Submit → API validates
5. Success → Set cookie, redirect based on role
6. Failure → Show error message

### Logout Flow
1. User clicks "Logout" button
2. POST /api/auth/logout
3. Session destroyed
4. Cookie deleted
5. Redirect to `/login`

### Session Persistence
1. User logs in
2. Cookie stored in browser
3. Navigate between pages → No re-login needed
4. Close browser → Cookie persists (until expiry)
5. Return later → Still authenticated (if < 24 hours)

---

## 📁 Files Created/Modified

### New Files

**Database:**
- `server/database/setup-auth.ts` - Auth setup script

**API Endpoints:**
- `server/api/auth/login.post.ts` - Login endpoint
- `server/api/auth/session.get.ts` - Session check endpoint
- `server/api/auth/logout.post.ts` - Logout endpoint

**Frontend:**
- `src/composables/useAuth.ts` - Authentication composable
- `src/views/Login.vue` - Login page component
- `src/views/BaseView.vue` - Base dashboard (protected)
- `src/views/ProjectView.vue` - Project dashboard (protected)

### Modified Files

**Routing:**
- `src/router/index.ts` - Added protected routes and navigation guards

**Components:**
- `src/views/TaskDashboard.vue` - Added authentication UI and logic

**Dependencies:**
- `package.json` - Added bcryptjs, tsx

---

## 🧪 Testing Instructions

### 1. Test Login (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"nEumJ7uq1qFNMMom"}' \
  -c cookies.txt
```

### 2. Check Session
```bash
curl http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### 3. Test Protected Route
```bash
# Should work with cookie
curl http://localhost:3000/api/tasks \
  -b cookies.txt
```

### 4. Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### 5. Frontend Testing

**Test Admin Login:**
1. Open http://localhost:3001/login
2. Username: `admin`
3. Password: `nEumJ7uq1qFNMMom`
4. Should redirect to `/` (TaskDashboard)

**Test Base Login:**
1. Open http://localhost:3001/login
2. Username: `base`
3. Password: `yl-x3fn5ScB1aBQP`
4. Should redirect to `/base`

**Test Project Login:**
1. Open http://localhost:3001/login
2. Username: `project1`
3. Password: `lXuRK_oAAvMkHLTC`
4. Should redirect to `/project`

**Test Protected Routes:**
1. Without login, visit http://localhost:3001/
2. Should redirect to `/login`
3. After login, visit `/`
4. Should show TaskDashboard with user info

**Test Logout:**
1. Click "Logout" button
2. Should redirect to `/login`
3. Try accessing `/` again
4. Should redirect to `/login`

---

## 📊 Role-Based Access Matrix

| Route | Unauthenticated | Admin | Base | Project |
|-------|----------------|-------|------|---------|
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/` (TaskDashboard) | ❌ → `/login` | ✅ | ✅ | ✅ |
| `/base` | ❌ → `/login` | ✅ | ✅ | ❌ → `/project` |
| `/project` | ❌ → `/login` | ✅ | ❌ → `/base` | ✅ |
| `/home` | ✅ | ✅ | ✅ | ✅ |
| `/demo` | ✅ | ✅ | ✅ | ✅ |

---

## ⚙️ Configuration

### Session Settings

```typescript
// Session duration
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Cleanup interval
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Cookie settings
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60,
  path: '/'
}
```

### Password Hashing

```typescript
// Salt rounds for bcrypt
const SALT_ROUNDS = 10

// Example hash
const hash = bcrypt.hashSync(password, SALT_ROUNDS)

// Example verification
const valid = bcrypt.compareSync(password, hash)
```

---

## 🚀 Next Steps (Stages 2 & 3)

### Stage 2: Enhanced Task Structure
- Add project association to tasks
- Implement task filtering by project
- Add task assignment features
- Project-specific task views

### Stage 3: Database Rules
- Row-level security based on roles
- Project-based data isolation
- Audit logging
- Data access policies

---

## 📚 Dependencies Added

```json
{
  "dependencies": {
    "bcryptjs": "3.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "3.0.0",
    "tsx": "4.20.6"
  }
}
```

---

## ✅ Completed Features

- [x] Projects table with 4 user accounts
- [x] Hashed password storage with bcrypt
- [x] Login API endpoint with authentication
- [x] Session management with cookies
- [x] Logout API endpoint
- [x] Session check endpoint
- [x] Login Vue component
- [x] Protected BaseView and ProjectView
- [x] Authentication composable (useAuth)
- [x] Router navigation guards
- [x] TaskDashboard authentication UI
- [x] Role-based routing
- [x] Auto-cleanup of expired sessions

---

## 🎉 Summary

**Stage 1 Complete!** The application now has:
- ✅ Secure authentication system
- ✅ Role-based access control (admin, base, project)
- ✅ Session management with 24-hour cookies
- ✅ Protected routes with navigation guards
- ✅ Login/logout functionality
- ✅ 4 user accounts ready for testing
- ✅ Clean, responsive UI for authentication

**Ready for Stage 2:** Enhanced task structure and project associations.

---

**Document Created:** October 14, 2025  
**Stage:** 1 of 3  
**Status:** ✅ Complete  
**Next:** Awaiting instructions for Stage 2
