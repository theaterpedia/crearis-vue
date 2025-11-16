# ProjectSettings Component Usage

**Component**: `ProjectSettings.vue`  
**Path**: `/src/views/project/ProjectSettings.vue`

## Overview

The `ProjectSettings` component provides a comprehensive interface for project owners to manage all aspects of their project after initial setup. It features a tabbed interface with three main sections: Core, Team, and Network.

## Features

### Three-Tab Interface

1. **Core Tab** - Essential project settings
   - Website domain configuration
   - Project name and description
   - Logo management (file upload or text logo)

2. **Team Tab** - Team member management
   - Owner display (read-only, from auth)
   - Members list with action buttons
   - Other Instructors (gathered from events)
   - 80x80px profile images with placeholders
   - Role badges: **OWNER**, **MEMBER**, **INSTRUCTOR**
   - Action buttons: View Profile, Edit, Remove (members only)

3. **Network Tab** - Inter-project connections
   - Regio selection (dropdown of projects with `isRegio` flag)
   - Partner projects list (hardcoded demo)
   - JSON editor for advanced options

## Integration

### In Project Dashboard

```vue
<template>
  <div class="project-dashboard">
    <!-- Left sidebar with navigation -->
    <aside class="dashboard-sidebar">
      <nav class="dashboard-nav">
        <router-link to="/project/overview">Overview</router-link>
        <router-link to="/project/events">Events</router-link>
        <router-link to="/project/settings">
          <svg><!-- settings cog icon --></svg>
          Settings
        </router-link>
      </nav>
    </aside>

    <!-- Main content area -->
    <main class="dashboard-content">
      <router-view />
    </main>
  </div>
</template>
```

### Router Configuration

```typescript
// router/index.ts
{
  path: '/project',
  component: ProjectDashboard,
  children: [
    {
      path: 'settings',
      name: 'project-settings',
      component: () => import('@/views/project/ProjectSettings.vue'),
      meta: { requiresAuth: true, role: 'project' }
    }
  ]
}
```

### Standalone Usage

```vue
<script setup>
import ProjectSettings from '@/views/project/ProjectSettings.vue'
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
const projectId = computed(() => user.value?.username || 'project1')
</script>

<template>
  <ProjectSettings :project-id="projectId" />
</template>
```

## Props

```typescript
interface Props {
  projectId: string  // Project identifier (usually username for project users)
}
```

## Team Member Data Structure

```typescript
interface TeamMember {
  id: string           // User email/ID
  username: string     // Display name
  cimg?: string        // Profile image URL (80x80px recommended)
  description?: string // Bio/role description
  isInstructor?: boolean
}
```

## Team Organization Logic

The Team tab automatically organizes members into three sections:

1. **Owner**: Project owner (single user, top position)
2. **Members**: Explicit project members
3. **Other Instructors**: Instructors from events who aren't already owner/members

**Deduplication**: If an owner or member is also an instructor, they won't appear in the "Other Instructors" section.

## Description Rendering

Descriptions use the `HeadingParser` component to support Markdown-style formatting:

- Role badges: `**OWNER**`, `**MEMBER**`, `**INSTRUCTOR**` (rendered in uppercase)
- Regular description text appears below the badge
- Supports basic Markdown syntax

## Action Buttons

### Owner Actions
- **View Profile**: Navigate to user profile
- **Edit**: Open edit modal (future: integrate with AdminAction)

### Member Actions
- **View Profile**: Navigate to user profile
- **Edit**: Open edit modal
- **Remove**: Remove member from project (with confirmation)

### Instructor Actions
- **View Profile**: Navigate to user profile (read-only)

## Logo Management

### File Upload Mode
- Accepts: PNG, JPG, SVG
- Max size: 2MB
- Preview shown after selection
- Remove button to clear selection

### Text Logo Mode
- Simple text input
- Useful for emoji-based logos or short text

## Network Settings

### Regio Selection
- Dropdown populated from projects where `isRegio === true`
- Null option for "no regio"

### Partner Projects
- **Currently hardcoded** for demonstration:
  ```javascript
  ['Stadttheater München', 'Kulturzentrum Berlin', 'Theater am Rhein']
  ```
- Future: Make dynamic with database integration

### JSON Options Editor
- Freeform JSON editing
- Validation on blur
- Error display for invalid JSON
- Suggested structure:
  ```json
  {
    "enableSync": true,
    "visibility": "public",
    "analytics": true
  }
  ```

## Responsive Design

### Desktop (> 768px)
- Full three-column team member layout
- Horizontal tab navigation
- Sidebar + content layout

### Mobile (≤ 768px)
- Single-column team member cards
- Centered profile images
- Horizontal action buttons
- Stacked header elements

## Styling Integration

The component uses CSS variables from the theme system:

- `--color-project`: Primary accent color
- `--color-card-bg`: Card backgrounds
- `--color-border`: Border colors
- `--color-dimmed`: Muted text
- `--radius-button`: Border radius
- `--radius-card`: Card border radius

## Future Enhancements

### Planned Features

1. **Database Integration**
   - Load actual team data from API
   - Save settings to backend
   - Real-time member list updates

2. **AdminAction Integration**
   - Use AdminAction framework for member editing
   - Integrate user creation/modification
   - Project transfer workflow

3. **Dynamic Partner Projects**
   - Database-backed partner list
   - Add/remove partner functionality
   - Partnership requests

4. **Event-Instructor Aggregation**
   - Fetch instructors from project events
   - Show event counts per instructor
   - Link to instructor's events

5. **Permissions System**
   - Granular member permissions
   - Role-based access control
   - Invitation system

### API Endpoints Needed

```typescript
// GET /api/projects/:id/settings
// Returns: { core, team, network }

// PUT /api/projects/:id/settings
// Body: { core, network }

// GET /api/projects/:id/team
// Returns: { owner, members, instructors }

// POST /api/projects/:id/members
// Body: { userId }

// DELETE /api/projects/:id/members/:userId

// POST /api/projects/:id/logo
// Body: FormData with logo file

// GET /api/projects/regio
// Returns: [{ id, name }]
```

## Example: Complete Dashboard

```vue
<template>
  <div class="project-dashboard">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>{{ projectName }}</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/project/overview" class="nav-item">
          <OverviewIcon />
          <span>Overview</span>
        </router-link>
        <router-link to="/project/events" class="nav-item">
          <EventsIcon />
          <span>Events</span>
        </router-link>
        <router-link to="/project/tasks" class="nav-item">
          <TasksIcon />
          <span>Tasks</span>
        </router-link>
        <router-link to="/project/settings" class="nav-item">
          <SettingsIcon />
          <span>Settings</span>
        </router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.project-dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  height: 100vh;
}

.sidebar {
  background: var(--color-card-bg);
  border-right: var(--border) solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: var(--border) solid var(--color-border);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-button);
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--color-bg-soft);
}

.nav-item.router-link-active {
  background: var(--color-project);
  color: white;
}

.main-content {
  overflow-y: auto;
}

@media (max-width: 768px) {
  .project-dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: var(--border) solid var(--color-border);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }
}
</style>
```

## Testing Checklist

- [ ] All three tabs render correctly
- [ ] Core settings form validation works
- [ ] Logo upload shows preview
- [ ] Logo remove button functions
- [ ] Team members display with correct roles
- [ ] Owner appears first
- [ ] Members appear second
- [ ] Instructors appear last (deduplicated)
- [ ] Profile images show placeholders when missing
- [ ] Action buttons trigger correct functions
- [ ] Remove member shows confirmation
- [ ] Regio dropdown populates
- [ ] JSON editor validates format
- [ ] Save button triggers save function
- [ ] Mobile layout stacks correctly
- [ ] Responsive breakpoints work

---

**Created**: October 21, 2025  
**Compatible with**: ProjectMain, ProjectStepper  
**Dependencies**: HeadingParser, useAuth composable
