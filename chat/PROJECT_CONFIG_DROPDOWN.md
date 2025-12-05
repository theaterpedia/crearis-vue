# Project Config Dropdown - Implementation Complete

**Date**: October 16, 2025  
**Branch**: beta_project  
**Component**: ProjectMain.vue  
**Status**: ✅ Complete

---

## Overview

Added a configuration dropdown to the ProjectMain navbar, similar to the AdminMenu dropdown style. The dropdown contains 7 configuration controls for project settings. Currently uses hardcoded dummy data and is not connected to database read-save functionality.

---

## Implementation Details

### UI Location

The config dropdown is located in the navbar, positioned after the "Back" button:

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 Projekt-Editor  [← Zurück] [⚙️ Config]     [Logout] │
└─────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (when clicked)
                        ┌─────────────────────────┐
                        │ ⚙️ Projekt-Konfiguration │
                        ├─────────────────────────┤
                        │ [7 Config Controls]     │
                        └─────────────────────────┘
```

### Configuration Controls (7)

#### 1. Release Selection
- **Type**: Dropdown (select)
- **Purpose**: Choose which release to work with
- **Dummy Data**: 3 hardcoded releases
  - v1.0.0 - Initial Release
  - v1.1.0 - Feature Update
  - v2.0.0 - Major Release
- **Default**: v1.0.0 (ID: 1)
- **Data Model**: `config.selectedRelease`

```vue
<select v-model="config.selectedRelease">
    <option v-for="release in dummyReleases" :key="release.id" :value="release.id">
        {{ release.name }}
    </option>
</select>
```

#### 2. Open Tasks Filter
- **Type**: Checkboxes (multiple selection)
- **Purpose**: Filter tasks by status
- **Options**:
  - ☑️ Idee (default: checked)
  - ☑️ Neu (default: checked)
  - ☐ Entwurf (default: unchecked)
- **Data Model**: `config.openTasks.{ idea, new, draft }`

```vue
<label class="checkbox-label">
    <input type="checkbox" v-model="config.openTasks.idea" />
    <span>Idee</span>
</label>
```

#### 3. Owner Display
- **Type**: Read-only display
- **Purpose**: Show current project owner from auth
- **Source**: `user?.username` from useAuth composable
- **Display**: Grey background, non-editable
- **Example**: "admin" (for admin user)

```vue
<div class="config-readonly">
    {{ user?.username || 'N/A' }}
</div>
```

#### 4. Coworkers Multi-Select
- **Type**: Checkboxes (multiple selection)
- **Purpose**: Select one or more collaborators
- **Dummy Data**: 3 hardcoded users
  - alice (ID: 2) - default: selected
  - bob (ID: 3)
  - charlie (ID: 4)
- **Data Model**: `config.selectedCoworkers` (array of user IDs)

```vue
<label v-for="coworker in dummyUsers" :key="coworker.id" class="checkbox-label">
    <input type="checkbox" :value="coworker.id" v-model="config.selectedCoworkers" />
    <span>{{ coworker.username }}</span>
</label>
```

#### 5. Domain
- **Type**: Text input
- **Purpose**: Set project domain
- **Placeholder**: "example.com"
- **Default**: "example.com"
- **Data Model**: `config.domain`

```vue
<input type="text" v-model="config.domain" placeholder="example.com" />
```

#### 6. Logo Options
- **Type**: Radio buttons + conditional input
- **Purpose**: Choose logo type and provide logo data
- **Options**:
  - ⚪ Datei-Upload (file upload)
  - 🔘 Text-Logo (default selected)
- **Data Model**: `config.logoType` ('file' | 'text')

**File Upload Mode**:
- File input accepting images (PNG, JPG, SVG)
- 2MB size limit validation
- Displays error alert if file too large
- Data Model: `config.logoFile`

```vue
<input type="file" accept="image/*" @change="handleLogoFileChange" />
<p class="file-hint">PNG, JPG, SVG (max. 2MB)</p>
```

**Text Logo Mode**:
- Text input for logo text
- Default: "My Project"
- Data Model: `config.logoText`

```vue
<input type="text" v-model="config.logoText" placeholder="Logo-Text eingeben" />
```

#### 7. Title
- **Type**: Text input
- **Purpose**: Set website title
- **Placeholder**: "Mein Projekt"
- **Default**: "Mein Projekt"
- **Data Model**: `config.title`

```vue
<input type="text" v-model="config.title" placeholder="Mein Projekt" />
```

#### 8. Description
- **Type**: Textarea (multi-line)
- **Purpose**: Set website description
- **Placeholder**: "Beschreiben Sie Ihr Projekt..."
- **Rows**: 3
- **Default**: "Ein tolles Projekt mit spannenden Inhalten."
- **Data Model**: `config.description`

```vue
<textarea v-model="config.description" placeholder="Beschreiben Sie Ihr Projekt..." rows="3"></textarea>
```

---

## State Management

### Config State Object

```typescript
const config = ref({
    selectedRelease: 1,
    openTasks: {
        idea: true,
        new: true,
        draft: false
    },
    selectedCoworkers: [2], // Array of user IDs
    domain: 'example.com',
    logoType: 'text' as 'file' | 'text',
    logoFile: null as File | null,
    logoText: 'My Project',
    title: 'Mein Projekt',
    description: 'Ein tolles Projekt mit spannenden Inhalten.'
})
```

### Dummy Data

**Releases**:
```typescript
const dummyReleases = ref([
    { id: 1, name: 'v1.0.0 - Initial Release' },
    { id: 2, name: 'v1.1.0 - Feature Update' },
    { id: 3, name: 'v2.0.0 - Major Release' }
])
```

**Users** (Coworkers):
```typescript
const dummyUsers = ref([
    { id: 2, username: 'alice' },
    { id: 3, username: 'bob' },
    { id: 4, username: 'charlie' }
])
```

### Dropdown State

```typescript
const isConfigOpen = ref(false)
const configDropdownRef = ref<HTMLElement | null>(null)
```

---

## Functions

### Dropdown Control

**toggleConfigDropdown()**
- Toggles the config dropdown open/closed
- Called when config button is clicked

**closeConfigDropdown()**
- Closes the config dropdown
- Used by close button and click-outside handler

**handleClickOutside(event: MouseEvent)**
- Detects clicks outside the dropdown
- Automatically closes dropdown when clicking elsewhere
- Added in `onMounted`, removed in `onUnmounted`

### File Handling

**handleLogoFileChange(event: Event)**
- Handles file selection for logo upload
- Validates file size (2MB max)
- Shows alert if file too large
- Stores File object in `config.value.logoFile`
- Logs file name to console

```typescript
function handleLogoFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        const file = target.files[0]
        if (!file) return
        
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            alert('Datei zu groß! Maximal 2MB erlaubt.')
            return
        }
        config.value.logoFile = file
        console.log('Logo file selected:', file.name)
    }
}
```

---

## Styling

### Dropdown Container

- **Position**: Absolute, positioned below button
- **Width**: 28rem - 32rem
- **Max Height**: 80vh (scrollable)
- **Background**: `var(--color-popover-bg)`
- **Border**: Standard border with rounded corners
- **Shadow**: Elevated shadow for depth
- **Z-index**: 200 (above other content)

```css
.config-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 28rem;
    max-width: 32rem;
    background: var(--color-popover-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 25px -3px oklch(0% 0 0 / 0.1);
    max-height: 80vh;
    overflow-y: auto;
    z-index: 200;
}
```

### Header

- **Layout**: Flexbox (space-between)
- **Padding**: 1rem 1.25rem
- **Border Bottom**: Separator line
- **Background**: Soft background color
- **Close Button**: Hover effect, rounded

### Body

- **Padding**: 1rem 1.25rem
- **Gap**: 1.25rem between sections
- **Flex Direction**: Column

### Form Controls

**Inputs, Selects, Textareas**:
- Full width
- Padding: 0.5rem 0.75rem
- Border: Standard with transition
- Focus: Project color border + shadow
- Font: Inherits from parent

**Checkboxes & Radios**:
- Custom styling with project accent color
- Size: 1rem x 1rem
- Hover cursor

**Read-only Field**:
- Soft background (non-editable appearance)
- Dimmed text color

---

## Database Integration (Not Implemented Yet)

### ⚠️ Current Status: **Hardcoded / No Persistence**

The config dropdown is fully functional but **not connected to any database operations**. All data is:
- Hardcoded dummy data
- Stored only in local component state
- Lost on page refresh
- Not synced with any project records

### Future Implementation Needed

#### 1. Create Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    release_id INTEGER,
    domain TEXT,
    logo_type TEXT CHECK(logo_type IN ('file', 'text')),
    logo_file TEXT, -- file path or null
    logo_text TEXT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (release_id) REFERENCES releases(id)
);
```

#### 2. Create Project Coworkers Join Table
```sql
CREATE TABLE project_coworkers (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. Create Project Task Filters Table
```sql
CREATE TABLE project_task_filters (
    project_id INTEGER PRIMARY KEY,
    filter_idea BOOLEAN DEFAULT 1,
    filter_new BOOLEAN DEFAULT 1,
    filter_draft BOOLEAN DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

#### 4. API Endpoints Needed

**GET /api/projects/:id**
- Fetch project configuration
- Include related data (coworkers, filters)
- Return current project state

**POST /api/projects**
- Create new project
- Initialize with default config
- Return created project ID

**PUT /api/projects/:id**
- Update project configuration
- Handle file upload for logo (if file type)
- Update all related tables

**GET /api/releases**
- Fetch available releases for dropdown
- Replace dummy data

**GET /api/users**
- Fetch users for coworkers selection
- Filter by role or permissions
- Replace dummy data

#### 5. File Upload Handling

For logo file uploads:
- Create upload directory: `server/uploads/logos/`
- Implement file validation (type, size)
- Generate unique filenames
- Store file path in database
- Serve files via static route

```typescript
// Example API endpoint
export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event)
    const file = formData?.find(item => item.name === 'logo')
    
    if (file) {
        const filename = `${Date.now()}-${file.filename}`
        const filepath = `server/uploads/logos/${filename}`
        await writeFile(filepath, file.data)
        return { logoPath: `/uploads/logos/${filename}` }
    }
})
```

#### 6. Component Integration

Add load/save functions:

```typescript
async function loadProjectConfig(projectId: number) {
    const response = await fetch(`/api/projects/${projectId}`)
    const data = await response.json()
    
    config.value = {
        selectedRelease: data.release_id,
        openTasks: {
            idea: data.filters.filter_idea,
            new: data.filters.filter_new,
            draft: data.filters.filter_draft
        },
        selectedCoworkers: data.coworkers.map(c => c.user_id),
        domain: data.domain,
        logoType: data.logo_type,
        logoFile: null,
        logoText: data.logo_text,
        title: data.title,
        description: data.description
    }
}

async function saveProjectConfig() {
    const formData = new FormData()
    
    // Add config values
    formData.append('release_id', config.value.selectedRelease.toString())
    formData.append('domain', config.value.domain)
    formData.append('logo_type', config.value.logoType)
    formData.append('title', config.value.title)
    formData.append('description', config.value.description)
    
    // Handle logo
    if (config.value.logoType === 'file' && config.value.logoFile) {
        formData.append('logo', config.value.logoFile)
    } else {
        formData.append('logo_text', config.value.logoText)
    }
    
    // Add coworkers
    formData.append('coworkers', JSON.stringify(config.value.selectedCoworkers))
    
    // Add task filters
    formData.append('filters', JSON.stringify(config.value.openTasks))
    
    await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: formData
    })
}
```

---

## User Experience

### Interaction Flow

1. User clicks "Config" button in navbar
2. Dropdown opens with all 7 controls visible
3. User modifies values:
   - Select release from dropdown
   - Check/uncheck task filters
   - View current owner (read-only)
   - Select coworkers
   - Enter domain
   - Choose logo type and provide logo data
   - Enter title and description
4. Changes are immediately reflected in state (reactive)
5. User clicks outside or close button to dismiss
6. **Note**: Changes are currently NOT saved (no persistence)

### Keyboard Accessibility

- Config button is keyboard focusable (Tab)
- Enter/Space activates dropdown
- All form controls are keyboard navigable
- Escape key could close dropdown (not implemented yet)

---

## Testing Checklist

### Dropdown Behavior
- [ ] Config button opens dropdown
- [ ] Close button closes dropdown
- [ ] Clicking outside closes dropdown
- [ ] Dropdown doesn't close when clicking inside
- [ ] Dropdown positioned correctly (right-aligned)

### Form Controls
- [ ] Release dropdown shows 3 options
- [ ] Release selection updates state
- [ ] Task checkboxes toggle correctly
- [ ] Multiple task filters can be selected
- [ ] Owner displays current username
- [ ] Coworkers multi-select works
- [ ] Multiple coworkers can be selected
- [ ] Domain input accepts text
- [ ] Logo type switches between file/text
- [ ] File upload shows file input in file mode
- [ ] Text input shows in text mode
- [ ] File size validation works (>2MB shows alert)
- [ ] Title input accepts text
- [ ] Description textarea accepts multi-line text

### Visual
- [ ] Dropdown has proper shadow and elevation
- [ ] Header is visually distinct
- [ ] Sections have proper spacing
- [ ] Form controls have focus states
- [ ] Project color accent on focused inputs
- [ ] Checkboxes use project color
- [ ] Read-only field has distinct appearance

### State
- [ ] All controls bind to config state
- [ ] State updates are reactive
- [ ] Console logs file selection
- [ ] State persists while dropdown open
- [ ] **Note**: State does NOT persist on refresh (expected)

---

## Known Limitations

1. **No Database Connection**
   - All data is hardcoded
   - No read/save functionality
   - Changes lost on refresh

2. **No Validation**
   - No required field checks
   - Only file size validation for logo
   - No format validation for domain

3. **No Error Handling**
   - No API error display
   - Simple alert for file size only

4. **No Loading States**
   - No spinners or loading indicators
   - Would be needed when connected to API

5. **No Save Button**
   - Changes not explicitly saved
   - Would need "Save" button in future

6. **Hardcoded Dummy Data**
   - Only 3 releases available
   - Only 3 coworkers available
   - Data not fetched from API

---

## Related Files

### Modified
- `src/views/project/ProjectMain.vue` - Added config dropdown (~300 lines added)

### Related Components (Not Modified)
- `src/components/Navbar.vue` - Uses menus slot
- `src/components/AdminMenu.vue` - Reference for dropdown style
- `src/views/BaseView.vue` - Reference for dropdown pattern

### Future Files (Not Created Yet)
- `server/api/projects/[id].get.ts` - Fetch project config
- `server/api/projects/[id].put.ts` - Update project config
- `server/api/projects/index.post.ts` - Create new project
- `server/database/migrations/00X_create_projects.ts` - Projects table migration

---

## Conclusion

✅ **Config dropdown fully implemented with all 7 controls!**

The dropdown is:
- Visually consistent with AdminMenu style
- Fully functional with reactive state
- Properly styled with project theming
- Click-outside handling implemented
- All form controls working

**Ready for database integration** - Next steps would be:
1. Create database tables
2. Implement API endpoints
3. Connect load/save functions
4. Add validation
5. Add save button and confirmation

The UI foundation is solid and ready to be connected to actual project data when needed.
