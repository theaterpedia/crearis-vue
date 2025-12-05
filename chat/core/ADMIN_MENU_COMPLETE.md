# Admin Menu Implementation Complete

## Summary
Successfully implemented a comprehensive Admin Menu system that provides global state management, mode switching, settings control, and action stubs. The menu is accessible on all routes but only visible to admin users.

## Key Features

### 1. **Global Admin State** (Persisted Across Routes)
- `adminMode`: `'base-release' | 'version-release'`
- `settingsMode`: `true | false`
- Both states persist when navigating between routes

### 2. **Admin Mode System**

#### Base-Release Mode (📦)
When activated, automatically applies:
- ❌ **Hide** tasks that relate to projects (`showProject = false`)
- ✅ **Show** tasks that relate to base (`showBase = true`)
- 📋 Sets view to **only main tasks** (`viewState = 'only-main'`)
- 🎯 Purpose: Focus on core/base tasks without project assignments

#### Version-Release Mode (🎯)
When activated, automatically applies:
- ✅ **Show** tasks that relate to projects (`showProject = true`)
- ❌ **Hide** tasks that relate to base (`showBase = false`)
- 📋 Sets view to **only release tasks** (`viewState = 'only-release'`)
- 🎯 Purpose: Focus on project-specific tasks within a release

**Note**: The admin filter for admin tasks (`showAdmin`) is **never touched** by mode switching.

### 3. **Settings Mode Toggle**

#### Settings Mode OFF (Default)
- ✅ Navigation is **free** - can navigate to any route
- ❌ **CRUD tables hidden** (Releases & Projects)
- ✅ **Admin Tasks List visible**
- 🎯 Purpose: Standard admin operations and maintenance

#### Settings Mode ON
- 🔒 Navigation is **locked** to `/` (dashboard)
  - Attempting to navigate away shows warning toast
  - Route guard blocks navigation
- ✅ **CRUD tables visible** (Releases & Projects)
- ❌ **Admin Tasks List hidden**
- 🎯 Purpose: Focus on data management and configuration

### 4. **Route-Aware Behavior**

#### On Dashboard Route (`/`)
- ✅ Mode toggle buttons **enabled**
- ✅ Settings toggle **enabled**
- ✅ Full control over admin state

#### On Other Routes (e.g., `/catalog`, `/demo`)
- 👁️ Current mode **displayed** (read-only badge)
- 🔒 Mode toggle buttons **disabled**
- 🔒 Settings toggle **disabled**
- ℹ️ Info message: "Navigation to / required to change settings"

## Components

### 1. AdminMenu.vue (340 lines)
**Location**: `/src/components/AdminMenu.vue`

**Purpose**: Dropdown menu for admin controls

**Sections**:
1. **Current Mode Display** - Shows active mode badge (always visible)
2. **Mode Toggle** - Switch between base-release and version-release (dashboard only)
3. **Settings Toggle** - Enable/disable settings mode (dashboard only)
4. **Action Stubs** - Four action buttons with toast notifications
5. **Route Info** - Current path and navigation status

**Props**:
```typescript
adminMode: 'base-release' | 'version-release'
settingsMode: boolean
currentRoute: string
isOnDashboard: boolean  // true when currentRoute === '/'
```

**Emits**:
```typescript
close()                              // Close menu
setMode(mode)                        // Change admin mode
toggleSettings()                     // Toggle settings mode
action(actionName)                   // Execute action stub
```

**Styling**:
- Accent-colored header
- Color-coded mode badges
- Toggle switch for settings
- Grid layout for action buttons
- Responsive design

### 2. Navbar.vue Updates
**Modified**: Added admin menu button

**Changes**:
- Added "Admin" button (only visible to `role: 'admin'`)
- Gear icon (settings symbol)
- Accent color styling (gold/yellow)
- Emits `toggle-admin-menu` event

## TaskDashboard.vue Integration

### New State Variables
```typescript
// Admin menu state (global, persisted across routes)
const showAdminMenu = ref(false)
const adminMode = ref<'base-release' | 'version-release'>('base-release')
const settingsMode = ref(false)
const currentRoute = computed(() => router.currentRoute.value.path)
```

### New Functions

#### `toggleAdminMenu()`
```typescript
function toggleAdminMenu() {
    showAdminMenu.value = !showAdminMenu.value
}
```
Opens/closes the admin menu overlay

#### `setAdminMode(mode)`
```typescript
function setAdminMode(mode: 'base-release' | 'version-release') {
    adminMode.value = mode
    
    if (mode === 'base-release') {
        adminFilters.value.showProject = false
        adminFilters.value.showBase = true
        viewState.value = 'only-main'
    } else {
        adminFilters.value.showProject = true
        adminFilters.value.showBase = false
        viewState.value = 'only-release'
    }
    
    showToastNotification(/* mode change message */, 'info')
}
```
- Changes admin mode
- Automatically applies filter changes
- Updates view state
- Shows toast notification

#### `toggleSettingsMode()`
```typescript
function toggleSettingsMode() {
    settingsMode.value = !settingsMode.value
    
    if (settingsMode.value) {
        // Redirect to / if not already there
        if (currentRoute.value !== '/') {
            router.push('/')
        }
        showToastNotification('Einstellungsmodus aktiviert...', 'info')
    } else {
        showToastNotification('Einstellungsmodus deaktiviert...', 'info')
    }
}
```
- Toggles settings mode
- Forces navigation to `/` when enabled
- Shows appropriate toast messages

#### `handleAdminAction(action)`
```typescript
function handleAdminAction(action: string) {
    const messages: Record<string, string> = {
        export: '📤 Daten werden exportiert...',
        backup: '💾 Backup wird erstellt...',
        sync: '🔄 Synchronisation gestartet...',
        report: '📊 Bericht wird generiert...'
    }
    showToastNotification(messages[action] || `Aktion "${action}" ausgeführt`, 'info')
}
```
Action stub that shows toast notification

### Route Guard
```typescript
onBeforeRouteLeave((to, from) => {
    if (settingsMode.value && to.path !== '/') {
        showToastNotification(
            '⚠️ Navigation gesperrt im Einstellungsmodus...',
            'warning'
        )
        return false  // Block navigation
    }
    return true  // Allow navigation
})
```
Prevents navigation away from `/` when settings mode is active

### Template Changes

#### Admin Menu Overlay
```vue
<!-- Admin Menu -->
<div v-if="showAdminMenu" class="admin-menu-overlay" @click="showAdminMenu = false">
    <div class="admin-menu-container" @click.stop>
        <AdminMenu 
            :admin-mode="adminMode" 
            :settings-mode="settingsMode" 
            :current-route="currentRoute"
            :is-on-dashboard="currentRoute === '/'" 
            @close="showAdminMenu = false" 
            @set-mode="setAdminMode"
            @toggle-settings="toggleSettingsMode" 
            @action="handleAdminAction" 
        />
    </div>
</div>
```

#### Admin Sections (Conditional Rendering)
```vue
<div v-if="user?.role === 'admin'">
    <!-- CRUD Tables (visible when settingsMode is ON) -->
    <div v-if="settingsMode">
        <ReleasesTable ... />
        <ProjectsTable ... />
    </div>

    <!-- Admin Tasks List (visible when settingsMode is OFF) -->
    <div v-if="!settingsMode">
        <AdminTasksList ... />
    </div>
</div>
```

## User Flow Examples

### Example 1: Switching to Base-Release Mode
1. Admin clicks "Admin" button in navbar
2. Admin menu opens (right side overlay)
3. Admin clicks "📦 Basis-Release" button
4. System automatically:
   - Hides project tasks
   - Shows base tasks
   - Switches to main-only view
5. Toast notification: "Modus: Basis-Release (nur Haupt-Tasks ohne Projekte)"
6. Mode badge updates to show "📦 Basis-Release"
7. Kanban updates to reflect filter changes

### Example 2: Enabling Settings Mode
1. Admin opens admin menu
2. Admin toggles "Einstellungsmodus" switch
3. System automatically:
   - Locks navigation (can't leave `/`)
   - Hides Admin Tasks List
   - Shows Releases & Projects CRUD tables
4. Toast notification: "Einstellungsmodus aktiviert - Navigation gesperrt, CRUD sichtbar"
5. Admin can now manage releases and projects
6. Attempting to navigate shows warning

### Example 3: Using Action Stubs
1. Admin opens admin menu
2. Admin clicks "📤 Daten exportieren"
3. Toast notification appears: "📤 Daten werden exportiert..."
4. (Placeholder for future implementation)

### Example 4: Cross-Route State Persistence
1. Admin sets mode to "Version-Release"
2. Admin navigates to `/catalog` (if settings mode is off)
3. Admin opens admin menu
4. Mode badge still shows "🎯 Version-Release"
5. Mode toggle buttons are **disabled** (not on dashboard)
6. Toast explains: Route-specific behavior

## Action Stubs

Four action buttons provided as placeholders:

1. **📤 Daten exportieren** - Export data functionality
2. **💾 Backup erstellen** - Create backup
3. **🔄 Synchronisieren** - Sync data
4. **📊 Bericht generieren** - Generate reports

Each shows a toast notification when clicked. Ready for implementation.

## German UI Text

### Admin Menu
- Title: "👑 Admin-Menü"
- Section titles: "Aktueller Modus", "Modus wechseln", "Einstellungen", "Aktionen", "Route-Info"
- Mode badges: "📦 Basis-Release", "🎯 Version-Release"
- Settings toggle: "Einstellungsmodus"
- Action buttons:
  - "📤 Daten exportieren"
  - "💾 Backup erstellen"
  - "🔄 Synchronisieren"
  - "📊 Bericht generieren"

### Toast Notifications
- Mode changes:
  - "Modus: Basis-Release (nur Haupt-Tasks ohne Projekte)"
  - "Modus: Version-Release (Tasks eines Releases mit Projekten)"
- Settings mode:
  - "Einstellungsmodus aktiviert - Navigation gesperrt, CRUD sichtbar"
  - "Einstellungsmodus deaktiviert - Navigation frei, Admin-Tasks sichtbar"
- Navigation block:
  - "⚠️ Navigation gesperrt im Einstellungsmodus. Deaktivieren Sie den Einstellungsmodus um zu navigieren."
- Actions:
  - "📤 Daten werden exportiert..."
  - "💾 Backup wird erstellt..."
  - "🔄 Synchronisation gestartet..."
  - "📊 Bericht wird generiert..."

## Technical Implementation

### State Management
- Uses Vue 3 Composition API
- Reactive refs for all state
- Computed property for current route
- State persists across route changes (global to dashboard component)

### Route Guard
- `onBeforeRouteLeave` from vue-router
- Blocks navigation when `settingsMode && to.path !== '/'`
- Shows warning toast
- Returns `false` to cancel navigation

### Filter Integration
- Directly modifies `adminFilters.value` based on mode
- Also updates `viewState.value` for consistency
- Does not touch `adminFilters.value.showAdmin`

### Conditional Rendering
- Admin sections use `v-if` for clean DOM
- Mode toggle buttons disabled on non-dashboard routes
- CRUD tables vs Admin Tasks list based on settings mode

## File Changes

### Created
1. `/src/components/AdminMenu.vue` (340 lines)

### Modified
2. `/src/components/Navbar.vue` (+30 lines)
   - Added admin button
   - Added emit for toggle-admin-menu
   - Added styling for navbar-admin

3. `/src/views/TaskDashboard.vue` (+95 lines)
   - Added AdminMenu import
   - Added admin state variables
   - Added admin menu overlay to template
   - Added admin menu functions
   - Added route guard
   - Added conditional rendering for admin sections
   - Added admin menu overlay styling

## Testing Checklist

### ✅ Implemented
- [x] AdminMenu component created
- [x] Navbar button added (admin only)
- [x] State variables added
- [x] Functions implemented
- [x] Route guard added
- [x] Conditional rendering working
- [x] German translations complete

### 🔲 Manual Testing Required
- [ ] Open dashboard as admin
- [ ] Click "Admin" button
- [ ] Verify menu opens on right side
- [ ] Test mode switching (base-release ↔ version-release)
- [ ] Verify filters update automatically
- [ ] Verify kanban updates based on mode
- [ ] Enable settings mode
- [ ] Verify CRUD tables appear
- [ ] Verify Admin Tasks list disappears
- [ ] Try to navigate to another route (should block)
- [ ] Disable settings mode
- [ ] Verify navigation works
- [ ] Navigate to /catalog
- [ ] Open admin menu
- [ ] Verify mode toggle buttons disabled
- [ ] Verify mode badge still shows current mode
- [ ] Test all 4 action stubs
- [ ] Verify toast notifications
- [ ] Test as non-admin user (menu should not appear)

## Known Behaviors

1. **Mode Switching Only on Dashboard**: By design, prevents accidental mode changes on other routes
2. **Settings Mode Forces Dashboard**: Ensures CRUD tables are accessible
3. **Navigation Lock**: Hard block, not just warning - prevents route changes
4. **Admin Filter Untouched**: `showAdmin` filter never modified by mode system
5. **State Persistence**: Admin mode and settings mode persist during session

## Future Enhancements

1. **Action Implementation**: Replace stubs with real functionality
2. **State Persistence**: Save admin preferences to localStorage
3. **Mode Presets**: Quick switch between common configurations
4. **Keyboard Shortcuts**: Hotkeys for mode switching
5. **Release Selector**: In version-release mode, dropdown to select specific release
6. **Activity Log**: Track mode changes and actions
7. **Confirmation Dialogs**: For destructive actions
8. **Advanced Settings**: More granular control over filters

## Summary

The Admin Menu provides a centralized control panel for administrators with:
- Global state management (admin mode, settings mode)
- Automatic filter application based on mode
- Navigation control (lock/unlock)
- Conditional rendering of admin sections
- Action stubs ready for implementation
- Route-aware behavior
- Full German localization

The system is complete, integrated, and ready for testing!
