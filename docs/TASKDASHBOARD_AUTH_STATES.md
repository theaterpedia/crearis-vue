# TaskDashboard Authentication States

**Date:** October 16, 2025  
**File:** `src/views/TaskDashboard.vue`

## 🔐 User Roles

The system has **3 user roles** defined in `useAuth.ts`:

1. **`admin`** - Administrator with full access
2. **`base`** - Base user with limited access
3. **`project`** - Project-specific user

## 📊 Admin View Modes

When logged in as **admin**, there are additional view modes:

### 1. Admin Mode
**Variable:** `adminMode` (ref)  
**Values:**
- `'base-release'` - Default admin mode
- `'version-release'` - Version-specific release view

### 2. Settings Mode
**Variable:** `settingsMode` (ref)  
**Type:** `boolean`  
**Purpose:** When enabled, locks navigation and shows only admin tasks

**Behavior:**
- When ON: Navigation locked, only admin tasks visible
- When OFF: Navigation free, admin tasks visible

### 3. Base Mode
**Variable:** `baseMode` (ref)  
**Type:** `boolean`  
**Purpose:** Admin views the interface as a base user would see it

**Behavior:**
- When ON:
  - Shows interface as base user would see it
  - Settings mode is turned off
  - `viewState` reset to `'only-main'`
  - Admin filters: `showProject = false`, `showBase = true`
  - Toast: "👤 Basis-Modus aktiviert - Ansicht als Basis-Benutzer"
  
- When OFF:
  - Returns to admin view
  - Reset to `adminMode = 'base-release'`
  - Reset `settingsMode = false`
  - Toast: "👤 Basis-Modus deaktiviert - Zurück zur Admin-Ansicht"

## 📋 View State

**Variable:** `viewState` (ref)  
**Values:**
- `'only-release'` - Shows only tasks with release_id
- `'only-main'` - Shows only main category tasks (default)
- `'all-tasks'` - Shows all tasks

## 🎯 Admin Filters

**Variable:** `adminFilters` (ref)  
**Only visible when:** `user.role === 'admin' && !baseMode`

**Properties:**
```typescript
{
    showProject: boolean,  // Show project/release tasks
    showBase: boolean,     // Show base/main tasks
    showAdmin: boolean     // Show admin tasks
}
```

**Default Values:**
```typescript
{
    showProject: false,
    showBase: true,
    showAdmin: true
}
```

## 🔍 Task Filtering Logic

### For Regular Users (base/project)
```typescript
if (viewState === 'only-release') {
    // Show tasks with release_id
} else if (viewState === 'only-main') {
    // Show main category tasks
} else {
    // Show all tasks
}
```

### For Admin Users
**Additional layer:** Category filters based on `adminFilters`

```typescript
categoryFilters = []
if (adminFilters.showProject) categoryFilters.push('release')
if (adminFilters.showBase) categoryFilters.push('main')
if (adminFilters.showAdmin) categoryFilters.push('admin')

// Filter tasks by selected categories
```

**Categories:**
- `'admin'` - Admin-only tasks
- `'main'` - Base/main tasks
- `'release'` - Project/release tasks

## 🎨 UI Visibility

### Admin Menu
```vue
v-if="isAuthenticated && user?.role === 'admin'"
```
Visible only when logged in as admin.

### Admin Filter Bar
```vue
v-if="user?.role === 'admin' && !baseMode"
```
Visible for admin, but **hidden in base mode**.

### Navbar Logo Text
```typescript
computed(() => {
    if (user.value?.role === 'admin') {
        return '📋 Task Manager (Admin)'
    }
    return '📋 Task Manager'
})
```

## 🔄 State Transitions

### Admin → Base Mode
```
Admin View
  ↓ (toggle baseMode ON)
Base User View (admin sees what base user sees)
  ↓ (toggle baseMode OFF)
Admin View
```

### Admin with Settings Mode
```
Normal Admin View
  ↓ (toggle settingsMode ON)
Locked Navigation + Only Admin Tasks
  ↓ (toggle settingsMode OFF)
Normal Admin View
```

### Base Mode + Settings Mode Interaction
```
If settingsMode is ON:
  → Turning baseMode ON will turn settingsMode OFF
  
If baseMode is ON:
  → Settings mode controls are still accessible
  → But baseMode shows base user view
```

## 📦 Admin-Specific Data

### Watch Tasks
```typescript
watchTasks = ref<any[]>([])        // Watch tasks (CSV/DB sync)
regularAdminTasks = ref<Task[]>([]) // Other admin tasks
```

**Separation Logic:**
```typescript
watchTasks.value = adminTasks.filter(t => t.logic)
regularAdminTasks.value = adminTasks.filter(t => !t.logic)
```

### Projects
```typescript
projects = ref<any[]>([])
projectsLoading = ref(false)
```

### Releases
```typescript
releasesLoading = ref(false)
```

## 🔑 Key Computed Properties

### `filteredTasks`
Filters tasks based on:
1. View state (only-release/only-main/all-tasks)
2. Admin filters (if admin role)

### `stats`
Statistics of filtered tasks:
- total
- idea count
- draft count
- final count
- reopen count

### Task Lists by Status
- `ideaTasks`
- `newTasks`
- `draftTasks`
- `finalTasks`
- `reopenTasks`
- `trashTasks`

All computed from `filteredTasks`

## 📝 Summary

**User Roles:**
- `admin` - Full access + special modes
- `base` - Standard user
- `project` - Project-specific user

**Admin Special Features:**
- Can switch to base mode to see base user view
- Has admin filter bar (hidden in base mode)
- Can toggle settings mode (locks navigation)
- Sees watch tasks section
- Has admin menu with actions

**Task Categories:**
- `admin` - Admin tasks
- `main` - Base/main tasks
- `release` - Project/release tasks

**View States:**
- `only-release` - Release tasks only
- `only-main` - Main tasks only (default)
- `all-tasks` - All tasks
