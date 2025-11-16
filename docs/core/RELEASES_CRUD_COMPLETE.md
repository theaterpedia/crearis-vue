# Releases CRUD Implementation Complete

## Summary
Successfully implemented full CRUD (Create, Read, Update, Delete) functionality for the Releases admin section in the Task Dashboard, positioned between the kanban and Projects table.

## Components Created

### 1. ReleasesTable.vue (289 lines)
**Location**: `/src/components/ReleasesTable.vue`

**Purpose**: Table component for displaying and managing releases

**Features**:
- Displays all releases in a sortable table
- Columns:
  - Version (formatted as "v1.0", monospace font)
  - Description
  - Status (badge with color coding)
  - Release Date
  - Task Count (badge showing number of associated tasks)
  - Created Date
  - Actions (Edit ✎, Delete 🗑)
- Loading state
- Empty state with call-to-action
- German labels throughout
- Hover effects and responsive design

**Props**:
```typescript
releases: Release[]   // Array of releases to display
loading: boolean      // Shows loading state
```

**Emits**:
```typescript
create()                    // When create button clicked
edit(release: Release)      // When edit icon clicked
delete(release: Release)    // When delete icon clicked
```

**Status Colors**:
- **Idee** (idea): Blue (#1976d2)
- **Entwurf** (draft): Orange (#f57c00)
- **Final** (final): Green (#388e3c)
- **Papierkorb** (trash): Red (#d32f2f)

### 2. ReleaseModal.vue (318 lines)
**Location**: `/src/components/ReleaseModal.vue`

**Purpose**: Modal component for creating and editing releases

**Features**:
- Create new releases or edit existing ones
- Form fields:
  - **Version** (required, pattern validated: "major.minor")
    - Format enforced: digits.digits (e.g., 1.0, 2.15)
    - HTML5 pattern validation
    - Help text displayed
  - **Description** (textarea, optional)
  - **Status** (dropdown: idea/draft/final/trash)
  - **Release Date** (date picker, optional)
- German labels and validation messages
- Modal title changes based on mode:
  - Create: "Neues Release"
  - Edit: "Release bearbeiten"
- Form validation (version format required)
- Watches `release` prop to populate form in edit mode
- Emits: `close`, `save`
- Styled with smooth transitions and theme colors
- Teleport to body for proper z-index layering

**Props**:
```typescript
isOpen: boolean       // Controls modal visibility
release?: Release     // Optional, for edit mode
```

**Emits**:
```typescript
close()                         // When cancel or close button clicked
save(data: Partial<Release>)    // When save button clicked with form data
```

## API Endpoints (Already Existed)

The releases API was already implemented. The CRUD component integrates with:

### 1. GET /api/releases
**File**: `/server/api/releases/index.get.ts`

**Features**:
- Lists all releases
- Includes task count for each release (JOIN query)
- Optional state filter via query params
- Sorted by version (major, minor ASC)
- Returns counts by state

**Response**:
```json
{
  "success": true,
  "releases": [
    {
      "id": "rel_xyz",
      "version": "1.0",
      "version_major": 1,
      "version_minor": 0,
      "description": "First release",
      "state": "final",
      "release_date": "2025-01-15",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z",
      "task_count": 12
    }
  ],
  "counts": {
    "total": 4,
    "idea": 1,
    "draft": 1,
    "final": 2,
    "trash": 0
  }
}
```

### 2. POST /api/releases
**File**: `/server/api/releases/index.post.ts`

**Request Body**:
```json
{
  "version": "1.0",              // Required, format: major.minor
  "description": "Description",  // Optional
  "state": "draft",              // Optional, default: idea
  "release_date": "2025-01-15"   // Optional, ISO date
}
```

**Features**:
- Validates version format (major.minor)
- Checks for duplicate versions
- Generates unique ID with nanoid
- Parses version into major/minor integers
- Sets timestamps

### 3. PUT /api/releases/:id
**File**: `/server/api/releases/[id].put.ts`

**Request Body** (all fields optional):
```json
{
  "version": "1.1",
  "description": "Updated description",
  "state": "final",
  "release_date": "2025-02-01"
}
```

**Features**:
- Validates release exists
- If version changed, validates format and checks for duplicates
- Dynamically builds UPDATE query
- Updates version_major/minor if version changed
- Auto-updates updated_at timestamp

### 4. DELETE /api/releases/:id
**File**: `/server/api/releases/[id].delete.ts`

**Features**:
- Validates release exists
- Checks if release has associated tasks
- Allows deletion (tasks become orphaned - release_id set to NULL)
- Returns task count in success message

## Dashboard Integration

### TaskDashboard.vue Updates

#### New Imports
```typescript
import ReleasesTable from '@/components/ReleasesTable.vue'
import ReleaseModal from '@/components/ReleaseModal.vue'
```

#### New State Variables
```typescript
// Release modal state
const showReleaseModal = ref(false)
const currentRelease = ref<any>(null)
const releasesLoading = ref(false)
```

#### Template Addition
Positioned in admin section, before Projects table:
```vue
<!-- Admin Sections -->
<div v-if="user?.role === 'admin'">
    <!-- Releases Table -->
    <ReleasesTable 
        :releases="releases" 
        :loading="releasesLoading" 
        @create="createRelease"
        @edit="editRelease" 
        @delete="deleteRelease" 
    />
    
    <!-- Projects Table -->
    <ProjectsTable ... />
    
    <!-- Admin Tasks List -->
    <AdminTasksList ... />
</div>

<!-- Release Modal -->
<ReleaseModal 
    v-if="showReleaseModal" 
    :is-open="showReleaseModal" 
    :release="currentRelease"
    @close="closeReleaseModal" 
    @save="saveRelease" 
/>
```

#### New Methods

**1. createRelease()**
```typescript
function createRelease() {
    currentRelease.value = null
    showReleaseModal.value = true
}
```
- Opens modal in create mode
- Clears current release
- Triggered by "+ Neues Release" button

**2. editRelease(release)**
```typescript
function editRelease(release: any) {
    currentRelease.value = { ...release }
    showReleaseModal.value = true
}
```
- Opens modal in edit mode
- Populates form with release data
- Triggered by edit (✎) button in table

**3. closeReleaseModal()**
```typescript
function closeReleaseModal() {
    showReleaseModal.value = false
    currentRelease.value = null
}
```
- Closes modal
- Resets state
- Triggered by cancel button or modal close

**4. saveRelease(releaseData)**
```typescript
async function saveRelease(releaseData: any) {
    try {
        const isEdit = currentRelease.value?.id
        const url = isEdit ? `/api/releases/${currentRelease.value.id}` : '/api/releases'
        const method = isEdit ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(releaseData)
        })
        
        if (response.ok) {
            await loadReleases()          // Refresh table
            closeReleaseModal()            // Close modal
            showToastNotification(
                isEdit ? 'Release aktualisiert' : 'Release erstellt',
                'success'
            )
        } else {
            const error = await response.json()
            throw new Error(error.message || 'Fehler beim Speichern')
        }
    } catch (err: any) {
        console.error('Error saving release:', err)
        showToastNotification(err.message || 'Fehler beim Speichern', 'error')
    }
}
```
- Handles both create and update
- Calls appropriate API endpoint
- Refreshes releases table
- Shows success/error toast
- Displays API error messages (e.g., duplicate version)

**5. deleteRelease(release)**
```typescript
async function deleteRelease(release: any) {
    const taskCount = release.task_count || 0
    const confirmMsg = taskCount > 0
        ? `Release "v${release.version}" hat ${taskCount} Task(s). Wirklich löschen?`
        : `Release "v${release.version}" wirklich löschen?`
    
    if (!confirm(confirmMsg)) {
        return
    }
    
    try {
        const response = await fetch(`/api/releases/${release.id}`, {
            method: 'DELETE'
        })
        
        if (response.ok) {
            await loadReleases()
            showToastNotification('Release gelöscht', 'success')
        } else {
            throw new Error('Fehler beim Löschen')
        }
    } catch (err) {
        console.error('Error deleting release:', err)
        showToastNotification('Fehler beim Löschen', 'error')
    }
}
```
- Shows confirmation dialog with task count warning
- Custom message if release has tasks
- Calls DELETE API endpoint
- Refreshes releases table
- Shows success/error toast

**6. loadReleases() - UPDATED**
```typescript
async function loadReleases() {
    releasesLoading.value = true
    try {
        const response = await fetch('/api/releases')
        if (!response.ok) {
            throw new Error('Failed to load releases')
        }
        const data = await response.json()
        releases.value = data.releases || []
    } catch (err) {
        console.error('Error loading releases:', err)
        releases.value = []
    } finally {
        releasesLoading.value = false
    }
}
```
- Added loading state management
- Called on mount and after CRUD operations
- Handles errors gracefully

## User Flow

### Creating a Release
1. Admin views dashboard (releases table appears below kanban)
2. Admin clicks "+ Neues Release" button
3. `createRelease()` opens modal in create mode
4. Admin fills in form:
   - Version (e.g., "1.0") - required, validated
   - Description - optional
   - Status - defaults to "Idee"
   - Release Date - optional
5. Admin clicks "Speichern"
6. Modal emits `save` event → `saveRelease()` called
7. POST request sent to `/api/releases`
8. If version format invalid or duplicate: error toast
9. If success:
   - Releases table refreshed via `loadReleases()`
   - Success toast shown: "Release erstellt"
   - Modal closes
10. New release appears in table

### Editing a Release
1. Admin clicks edit icon (✎) in releases table row
2. `editRelease(release)` opens modal with release data
3. Admin modifies fields (can change version, description, status, date)
4. Admin clicks "Speichern"
5. Modal emits `save` event → `saveRelease()` called
6. PUT request sent to `/api/releases/:id`
7. If version changed to duplicate: error toast
8. If success:
   - Releases table refreshed
   - Success toast shown: "Release aktualisiert"
   - Modal closes
   - TaskEditModal also refreshes (uses same releases data)

### Deleting a Release
1. Admin clicks delete icon (🗑) in releases table row
2. `deleteRelease(release)` shows confirmation dialog:
   - If release has tasks: "Release 'v1.0' hat 5 Task(s). Wirklich löschen?"
   - If no tasks: "Release 'v1.0' wirklich löschen?"
3. If admin confirms:
   - DELETE request sent to `/api/releases/:id`
   - Releases table refreshed
   - Success toast shown: "Release gelöscht"
   - Tasks with this release become orphaned (release_id = NULL)
4. If admin cancels: no action taken

## Database Schema

### Releases Table
```sql
CREATE TABLE releases (
    id TEXT PRIMARY KEY,              -- Format: nanoid (short unique ID)
    version TEXT NOT NULL UNIQUE,     -- Format: major.minor (e.g., "1.0")
    version_major INTEGER NOT NULL,   -- Parsed from version
    version_minor INTEGER NOT NULL,   -- Parsed from version
    description TEXT,                 -- Optional description
    state TEXT DEFAULT 'idea',        -- idea | draft | final | trash
    release_date TEXT,                -- ISO date string (optional)
    created_at TEXT NOT NULL,         -- ISO timestamp
    updated_at TEXT NOT NULL          -- ISO timestamp (auto-updated)
)
```

### State Values
- `idea`: Initial planning phase
- `draft`: Work in progress
- `final`: Released/completed
- `trash`: Archived/deleted

## German UI Text

### ReleasesTable
- Section title: "Releases"
- Create button: "+ Neues Release"
- Empty state: "Keine Releases vorhanden." / "+ Erstes Release erstellen"
- Table headers:
  - "Version"
  - "Beschreibung"
  - "Status"
  - "Release-Datum"
  - "Tasks"
  - "Erstellt"
  - "Aktionen"
- Status labels:
  - "Idee" (idea)
  - "Entwurf" (draft)
  - "Final" (final)
  - "Papierkorb" (trash)
- Loading: "Lädt Releases..."

### ReleaseModal
- Title (create): "Neues Release"
- Title (edit): "Release bearbeiten"
- Version label: "Version *" (Format: major.minor, z.B. 1.0, 2.5)
- Description label: "Beschreibung"
- Status label: "Status"
- Release Date label: "Release-Datum"
- Cancel button: "Abbrechen"
- Save button: "Speichern"

### Toast Notifications
- Create success: "Release erstellt"
- Update success: "Release aktualisiert"
- Delete success: "Release gelöscht"
- Error (generic): "Fehler beim Speichern" / "Fehler beim Löschen"
- Error (API): Shows specific API error message (e.g., "Release with version 1.0 already exists")

### Confirmation Dialogs
- Delete (with tasks): `Release "v{version}" hat {count} Task(s). Wirklich löschen?`
- Delete (no tasks): `Release "v{version}" wirklich löschen?`

## Section Ordering

The admin section now has this structure (top to bottom):

1. **Kanban** (5 columns: New, Idea, Draft, Final/Reopen, Trash)
2. **Releases Table** ← NEW
3. **Projects Table**
4. **Admin Tasks List**

This ordering makes sense because:
- Releases are most directly related to tasks (shown in kanban above)
- Projects are organizational units
- Admin tasks are maintenance operations

## Testing Checklist

### ✅ Components
- [x] ReleasesTable component created (289 lines)
- [x] ReleaseModal component created (318 lines)
- [x] Imports added to TaskDashboard
- [x] Components added to template
- [x] State variables added

### ✅ Integration
- [x] All CRUD handlers implemented
- [x] loadReleases() updated with loading state
- [x] Modal wired up to state and handlers
- [x] Task count warning in delete confirmation

### 🔲 Manual Testing Required
- [ ] Open dashboard as admin
- [ ] Verify Releases section appears below kanban
- [ ] Click "+ Neues Release" button
- [ ] Test version validation (must be major.minor)
- [ ] Try invalid version format (should show error)
- [ ] Fill in all fields and save
- [ ] Verify release appears in table with correct data
- [ ] Verify task count badge shows correctly
- [ ] Click edit icon on release
- [ ] Modify fields and save
- [ ] Verify changes in table
- [ ] Try to create duplicate version (should show error)
- [ ] Create release with tasks assigned
- [ ] Click delete icon on release with tasks
- [ ] Verify warning shows task count
- [ ] Confirm deletion
- [ ] Verify release removed from table
- [ ] Test all status options (idea/draft/final/trash)
- [ ] Test date picker
- [ ] Test toast notifications
- [ ] Test modal close/cancel
- [ ] Test loading states
- [ ] Test empty state
- [ ] Verify TaskEditModal still works (uses releases data)

## Files Modified

### Created
1. `/src/components/ReleasesTable.vue` (289 lines)
2. `/src/components/ReleaseModal.vue` (318 lines)

### Modified
3. `/src/views/TaskDashboard.vue` (1229 lines, +85 lines)
   - Added: ReleasesTable, ReleaseModal imports
   - Added: showReleaseModal, currentRelease, releasesLoading state
   - Updated: loadReleases() with loading state
   - Added: createRelease, editRelease, closeReleaseModal, saveRelease, deleteRelease methods
   - Added: ReleasesTable component to template (admin section)
   - Added: ReleaseModal component to template

## Technical Notes

### Version Validation
- Client-side: HTML5 pattern attribute `^\d+\.\d+$`
- Server-side: Regex validation and parsing
- Ensures consistent format across system

### Task Count Display
- Fetched via JOIN query in GET endpoint
- Displayed as badge in table
- Used in delete confirmation warning
- Helps admin make informed decisions

### Error Handling
- API errors displayed to user (e.g., duplicate version)
- All methods have try/catch blocks
- User-friendly German error messages
- Console logging for debugging

### Loading States
- Table shows "Lädt Releases..." during fetch
- Prevents UI flicker
- Managed by releasesLoading ref

### Date Formatting
- Input: ISO date string from API
- Display: German format (DD.MM.YYYY)
- Input field: HTML5 date picker (YYYY-MM-DD)
- Conversion handled in modal

## Integration with Task System

### Task-Release Relationship
- Tasks have optional `release_id` foreign key
- When editing tasks, releases dropdown populated from this data
- Deleting release orphans tasks (release_id → NULL)
- Task count shown in releases table helps track usage

### Data Flow
1. `loadReleases()` fetches from API
2. `releases` ref updated
3. Both ReleasesTable AND TaskEditModal use same data
4. CRUD operations refresh releases → both components update

## Next Steps

1. **Manual Testing**: Complete the testing checklist above
2. **Enhanced Features** (future):
   - Release filtering (by state)
   - Bulk operations (archive multiple releases)
   - Release statistics/dashboard
   - Task migration tool (move tasks between releases)
   - Version bumping helper (auto-suggest next version)
   - Release notes generation
   - Timeline/roadmap view
3. **Documentation**: Add user guide for release management workflow

## Development Notes

- All German text follows consistent style
- Toast notifications auto-dismiss after 3 seconds
- Version format strictly enforced (major.minor only)
- Task count prevents accidental deletion of important releases
- Modal has smooth transitions and responsive design
- Table sorts by version (major → minor)

## Summary

The Releases CRUD system is now fully integrated into the admin dashboard, positioned logically between the kanban (which shows tasks) and the Projects table. Admins can create, view, edit, and delete releases with full validation, error handling, and German UI text throughout.
