# Task Dashboard Redesign - Implementation Plan

**Date**: October 14, 2025  
**Status**: 🔄 In Progress  
**Branch**: beta_tasks_and_versioning

## Overview

Complete redesign of the TaskDashboard with navbar, view menu, role-based header, improved filters, 3-column kanban, and admin sections.

## Components Created

✅ **Toast.vue** - Toast notification component  
✅ **Navbar.vue** - Top navigation with View menu trigger  
✅ **ProjectsTable.vue** - CRUD table for projects (admin only)  
✅ **AdminTasksList.vue** - List of admin tasks with execute button

## Changes Required for TaskDashboard.vue

### 1. Template Structure

```
<div class="dashboard-wrapper">
  └── Navbar (with view menu trigger, logout)
  └── View Menu Overlay (ToggleMenu component)
  └── Container
      └── Section
          ├── Auth Prompt (if not authenticated)
          └── Authenticated Content
              ├── Dashboard Header (role-based title + description in German)
              ├── Stats Grid (conditionally shown based on viewSettings.showStats)
              ├── Admin Filters (checkboxes for project/base/admin - admin only)
              ├── Kanban Header (with show/hide toggles for New and Trash columns)
              ├── Kanban Board (3-5 columns)
              │   ├── New Column (optional, hideable)
              │   ├── Idea Column (main)
              │   ├── Draft Column (main)
              │   ├── Final/Reopen Column (main - combined)
              │   └── Trash Column (optional, hideable)
              └── Admin Sections (admin only)
                  ├── ProjectsTable
                  └── AdminTasksList
  └── TaskEditModal
  └── Toast (for notifications)
```

### 2. Role-Based Header (German)

- **Admin (👑)**: "Verwalten Sie alle Aufgaben, Projekte und System-Einstellungen. Sie haben vollständigen Zugriff auf alle Funktionen."
- **Base (📦)**: "Bearbeiten Sie Basis-Aufgaben und verwalten Sie Standard-Inhalte. Ihr Fokus liegt auf den Kern-Funktionen."
- **Project (🎯)**: "Verwalten Sie Ihre projekt-spezifischen Aufgaben und Inhalte. Sie arbeiten an Ihrem eigenen Projekt-Bereich."
- **Guest (👤)**: "Willkommen im Task-Dashboard."

### 3. View Menu Options (ToggleMenu)

**Task Scope Filter** (exactly one selected):
- ☑️ Nur Hauptaufgaben (default)
- ⬜ Nur Release-Aufgaben
- ⬜ Alle Aufgaben

**Display Options**:
- ☑️ Statistiken anzeigen
- ☑️ Neu-Spalte anzeigen (default: hidden)
- ☑️ Papierkorb-Spalte anzeigen (default: hidden)

### 4. Admin Filters (Checkboxes - admin role only)

- ⬜ Projekt-Aufgaben anzeigen (default: false)
- ☑️ Basis-Aufgaben anzeigen (default: true)
- ☑️ Admin-Aufgaben anzeigen (default: true)

### 5. Kanban Columns (3 Main + 2 Optional)

**Main Columns** (always visible):
1. **Ideen** (idea) - 💡
2. **Entwürfe** (draft) - ⚡
3. **Fertig / Reopen** (final + reopen combined) - ✓

**Optional Columns** (toggleable via buttons at top):
4. **Neu** (new) - 📋 [Hidden by default]
5. **Papierkorb** (trash) - 🗑 [Hidden by default]

### 6. New Computed Properties Needed

```typescript
// Combined final and reopen tasks
const finalReopenTasks = computed(() => {
  return filteredTasks.value.filter(
    task => task.status === 'final' || task.status === 'reopen'
  )
})

// Trash tasks
const trashTasks = computed(() => {
  return filteredTasks.value.filter(task => task.status === 'trash')
})

// Filtered tasks based on view state and admin filters
const filteredTasks = computed(() => {
  let result = tasks.value

  // Apply task scope filter (release/main/all)
  if (viewState.value === 'only-release') {
    result = result.filter(task => task.release_id !== null)
  } else if (viewState.value === 'only-main') {
    result = result.filter(task => task.category === 'main')
  }
  // 'all-tasks' shows everything

  // Apply admin category filters (admin only)
  if (user.value?.role === 'admin') {
    if (!adminFilters.value.showProject) {
      result = result.filter(task => task.category !== 'project')
    }
    if (!adminFilters.value.showBase) {
      result = result.filter(task => task.category !== 'base')
    }
    if (!adminFilters.value.showAdmin) {
      result = result.filter(task => task.category !== 'admin')
    }
  }

  return result
})
```

### 7. New Reactive State Needed

```typescript
// View menu state
const showViewMenu = ref(false)
const viewState = ref('only-main') // 'only-release' | 'only-main' | 'all-tasks'

// View settings
const viewSettings = ref({
  showStats: true,
  showNew: false,
  showTrash: false
})

// Admin filters (admin only)
const adminFilters = ref({
  showProject: false,
  showBase: true,
  showAdmin: true
})

// Admin data
const projects = ref([])
const projectsLoading = ref(false)
const adminTasks = ref([])
const adminTasksLoading = ref(false)

// Toast state
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const showToast = ref(false)
```

### 8. View Menu Options Configuration

```typescript
const viewOptions = [
  {
    text: 'Aufgabenumfang',
    children: [
      {
        text: 'Nur Hauptaufgaben',
        state: 'only-main',
        icon: { template: '📋' }
      },
      {
        text: 'Nur Release-Aufgaben',
        state: 'only-release',
        icon: { template: '🎯' }
      },
      {
        text: 'Alle Aufgaben',
        state: 'all-tasks',
        icon: { template: '📊' }
      }
    ]
  }
]
```

### 9. New Methods Needed

```typescript
function toggleViewMenu() {
  showViewMenu.value = !showViewMenu.value
}

function handleViewChange(newState: string) {
  viewState.value = newState
  showViewMenu.value = false
}

async function loadProjects() {
  if (user.value?.role !== 'admin') return
  projectsLoading.value = true
  try {
    const response = await fetch('/api/projects')
    if (response.ok) {
      projects.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    projectsLoading.value = false
  }
}

async function loadAdminTasks() {
  if (user.value?.role !== 'admin') return
  adminTasksLoading.value = true
  try {
    const response = await fetch('/api/tasks?category=admin')
    if (response.ok) {
      adminTasks.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load admin tasks:', error)
  } finally {
    adminTasksLoading.value = false
  }
}

function executeAdminTask(task: AdminTask) {
  showToastNotification(
    `${task.display_title || task.title} ausgeführt`,
    'success'
  )
}

function showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

function closeToast() {
  showToast.value = false
}

function createProject() {
  // TODO: Open project creation modal
  showToastNotification('Projekt-Erstellung öffnen', 'info')
}

function editProject(project: Project) {
  // TODO: Open project edit modal
  showToastNotification(`Projekt "${project.name}" bearbeiten`, 'info')
}

function deleteProject(project: Project) {
  // TODO: Confirm and delete project
  showToastNotification(`Projekt "${project.name}" löschen?`, 'warning')
}
```

### 10. New Imports Needed

```typescript
import Navbar from '@/components/Navbar.vue'
import ToggleMenu from '@/components/ToggleMenu.vue'
import Toast from '@/components/Toast.vue'
import ProjectsTable from '@/components/ProjectsTable.vue'
import AdminTasksList from '@/components/AdminTasksList.vue'
```

### 11. Lifecycle Updates

```typescript
onMounted(async () => {
  await checkSession()
  if (isAuthenticated.value) {
    await Promise.all([
      loadTasks(),
      loadReleases(),
      loadProjects(),
      loadAdminTasks()
    ])
  }
})
```

### 12. Stats Updates (German Labels)

```typescript
const stats = computed(() => {
  const filtered = filteredTasks.value
  return {
    total: filtered.length,
    idea: filtered.filter(t => t.status === 'idea').length,
    draft: filtered.filter(t => t.status === 'draft').length,
    final: filtered.filter(t => t.status === 'final').length,
    reopen: filtered.filter(t => t.status === 'reopen').length
  }
})
```

### 13. Styling Updates

New classes needed:
- `.dashboard-wrapper` - Main container
- `.view-menu-overlay` - Overlay for view menu
- `.view-menu-container` - View menu positioning
- `.dashboard-header` - Role-based header section
- `.header-role`, `.header-title`, `.header-description` - Header styling
- `.admin-filters` - Admin filter checkboxes
- `.filter-checkbox` - Checkbox styling
- `.kanban-header` - Kanban title + toggles
- `.kanban-title` - Board title
- `.kanban-toggles` - Toggle buttons container
- `.toggle-btn` - Column toggle buttons
- `.column-trash` - Trash column specific styling

## Testing Checklist

### View Menu
- [ ] Click "Ansicht" in navbar opens view menu
- [ ] Clicking overlay closes view menu
- [ ] Can select "Nur Hauptaufgaben" (default)
- [ ] Can select "Nur Release-Aufgaben"
- [ ] Can select "Alle Aufgaben"
- [ ] Selection updates filtered tasks correctly

### Admin Filters (admin only)
- [ ] Project tasks checkbox works
- [ ] Base tasks checkbox works (default: checked)
- [ ] Admin tasks checkbox works (default: checked)
- [ ] Filters combine correctly with view menu filters

### Kanban Columns
- [ ] 3 main columns always visible (Ideen, Entwürfe, Fertig/Reopen)
- [ ] "Neu" column hidden by default
- [ ] "Papierkorb" column hidden by default
- [ ] Toggle buttons at top show/hide columns
- [ ] Final and Reopen tasks appear in same column
- [ ] Drag-and-drop still works

### Admin Sections (admin only)
- [ ] Projects table visible for admin
- [ ] Can click "Neues Projekt"
- [ ] Can edit project
- [ ] Can delete project
- [ ] Admin tasks list visible
- [ ] Can click "Ausführen" button
- [ ] Toast shows "[title] ausgeführt"

### Toast Notifications
- [ ] Toast appears top-right
- [ ] Auto-dismisses after 3 seconds
- [ ] Can manually close with X button
- [ ] Success, error, warning, info types work
- [ ] Click toast dismisses it

### Role-Based Header
- [ ] Admin sees correct German description
- [ ] Base sees correct German description
- [ ] Project users see correct German description
- [ ] Guest sees generic welcome

## API Endpoints Needed

May need to create:
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Next Steps

1. ✅ Create supporting components (Toast, Navbar, ProjectsTable, AdminTasksList)
2. ⏳ **Rewrite TaskDashboard.vue template completely**
3. ⏳ **Update TaskDashboard.vue script with new state and methods**
4. ⏳ **Add all new styles to TaskDashboard.vue**
5. ⏳ Test all functionality
6. ⏳ Create projects API endpoints if needed

## Estimated Complexity

- **Template Changes**: 60% complete (navbar, header, kanban structure defined)
- **Script Changes**: 20% complete (need to add all new state/methods)
- **Style Changes**: 10% complete (need all new classes)
- **Testing**: 0% complete

**Recommendation**: Due to file size (770 lines), consider creating TaskDashboard.vue as a new file and replacing the old one entirely to avoid merge conflicts and ensure consistency.
