# ProjectMain Navigation Configuration

## Overview

ProjectMain supports two navigation modes based on project status:
- **Stepper Mode** (status < 2): Sequential step-based workflow for initial project setup
- **Navigation Mode** (status >= 2): Flexible tab-based navigation for ongoing project editing

The editor can be locked (read-only) when status > 3.

## Architecture

### Core Components

1. **ProjectMain.vue** - Main container with navigation/editor layout
2. **ProjectStepper.vue** - Sequential step navigation (stepper mode)
3. **ProjectNavigation.vue** - Vertical tab navigation (navigation mode)

### Navigation Modes

#### Stepper Mode (status < 2)
Sequential workflow with 5 steps:
1. Events auswählen
2. Posts erstellen  
3. Users and Regio konfigurieren
4. Theme, Layout, Navigation
5. Landing-Page, Heading und Pages

#### Navigation Mode (status >= 2)
Flexible tabs with conditional visibility:
- **Always visible**: events, posts, users, theme, layout, navigation, pages
- **Conditional tabs**:
  - `events-config`: Shown when `NOT (project.is_service OR project.is_topic)`
  - `regio-config`: Shown when `project.is_regio`

## Configuration

### ProjectMain Computed Properties

```typescript
// Determines if stepper or navigation mode
const isStepper = computed(() => projectStatus.value < 2)

// Determines if editor is locked (read-only)
const isLocked = computed(() => projectStatus.value > 3)

// Calculates visible tabs based on project settings
const visibleNavigationTabs = computed(() => {
    const tabs: string[] = ['events', 'posts', 'users', 'theme', 'layout', 'navigation', 'pages']
    
    if (projectData.value) {
        // EventsConfigPanel: NOT (is_service OR is_topic)
        const showEventsConfig = !(projectData.value.is_service || projectData.value.is_topic)
        if (showEventsConfig) {
            tabs.push('events-config')
        }
        
        // RegioConfigPanel: is_regio
        if (projectData.value.is_regio) {
            tabs.push('regio-config')
        }
    }
    
    return tabs
})
```

### Adding New Conditional Tabs

To add a new conditional tab:

1. **Create the panel component** in `src/components/`
2. **Import it** in ProjectMain.vue
3. **Add to visibleNavigationTabs** with your condition:
   ```typescript
   if (projectData.value.your_condition) {
       tabs.push('your-tab-id')
   }
   ```
4. **Add to ProjectNavigation tabs list** in `allTabs` array
5. **Add to ProjectMain template** in navigation mode section:
   ```vue
   <YourPanel v-else-if="currentNavTab === 'your-tab-id'" :project-id="projectId" :is-locked="isLocked" />
   ```

### Configuring Step Components

Each step component receives:
- `project-id`: String identifier for the project
- `is-locked`: Boolean indicating read-only mode
- `hide-actions` (optional): Hides prev/next buttons in navigation mode

Example:
```vue
<ProjectStepEvents 
    :project-id="projectId" 
    :is-locked="isLocked" 
    @next="nextStep" 
/>
```

### Tab-based Panels

Tab panels in navigation mode typically don't emit next/prev events. They receive:
- `project-id`: String identifier
- `is-locked`: Boolean for read-only state

Example:
```vue
<ThemeConfigPanel 
    :project-id="projectId" 
    :is-locked="isLocked" 
/>
```

## Project Status States

| Status | Mode | Editor | Description |
|--------|------|--------|-------------|
| 0-1 | Stepper | Editable | Initial setup phase |
| 2-3 | Navigation | Editable | Active development |
| 4+ | Navigation | Locked | Published/archived |

## Layout Structure

```
ProjectMain
├── Navbar (Config dropdown, back button)
└── Main Content (2-column layout)
    ├── Navigation (40%)
    │   ├── ProjectStepper (if isStepper)
    │   └── ProjectNavigation (if !isStepper)
    └── Editor (60%)
        ├── Stepper Mode Components
        │   ├── ProjectStepEvents (step 0)
        │   ├── ProjectStepPosts (step 1)
        │   ├── ProjectStepUsers (step 2)
        │   ├── ProjectStepTheme (step 3)
        │   └── ProjectStepPages (step 4)
        └── Navigation Mode Panels
            ├── Step Components (events, posts, users, pages)
            └── Config Panels (theme, layout, navigation, events-config, regio-config)
```

## I18n Integration

### Step Names (ProjectStepper)

Step names are loaded via `useI18n().button()` function:
- `events-select`
- `posts-create`
- `users-regio-config`
- `theme-layout-navigation`
- `landing-heading-pages`

Language is detected automatically:
- Admin users: English (`en`)
- Project users: German (`de`)

### Adding Translations

1. Use `button()` for navigation/action text
2. Use `field()` for form labels
3. Use `desc()` for descriptions
4. Use `getOrCreate()` for inline creation with default text

Example:
```typescript
const label = await button('your-key')
```

## Theme Integration

### ThemeConfigPanel

Uses `ThemeDropdown` component but **does not actively toggle the theme**. Instead:
- Saves theme selection to project config
- Theme is applied only on public project view
- Editor remains in default theme

### LayoutConfigPanel

Manages boolean flags in project config:
- `service`: Service mode toggle
- `onepage`: Onepage layout toggle
- `sidebar`: Sidebar navigation toggle

Config structure:
```json
{
  "service": true,  // or key removed if false
  "onepage": true,
  "sidebar": true
}
```

### NavigationConfigPanel

Manages navigation options:
- `team_page`: Boolean for team page visibility
- `cta_title`: String for call-to-action title
- `cta_entity` | `cta_link` | `cta_form`: One of three CTA types

## CSS Variables

Uses theme CSS variables from `00-theme.css`:
- `--color-project`: Primary project color
- `--color-border`: Border colors
- `--color-bg-soft`: Soft background
- `--radius-button`: Button border radius
- `--border`: Border width

## Best Practices

1. **Always check `isLocked`** before allowing edits
2. **Use `visibleNavigationTabs`** to determine tab visibility
3. **Load project data** on mount to get current status
4. **Emit events** (next, prev, complete) for stepper navigation
5. **Update project status** when transitioning between modes
6. **Test conditional logic** for tab visibility
7. **Use i18n** for all user-facing strings

## Example: Adding a New Step

1. Create `ProjectStepNewFeature.vue`
2. Add to imports in ProjectMain.vue
3. Add to stepper template:
   ```vue
   <ProjectStepNewFeature 
       v-else-if="currentStep === 5" 
       :project-id="projectId" 
       :is-locked="isLocked" 
       @next="nextStep" 
       @prev="prevStep" 
   />
   ```
4. Update step count in nextStep() function
5. Add i18n key for step name in ProjectStepper
6. Update step descriptions

## Example: Adding a Conditional Tab

1. Create `MyConfigPanel.vue` in components
2. Import in ProjectMain.vue
3. Add to visibleNavigationTabs:
   ```typescript
   if (projectData.value.my_flag) {
       tabs.push('my-config')
   }
   ```
4. Add to ProjectNavigation allTabs array
5. Add to template:
   ```vue
   <MyConfigPanel 
       v-else-if="currentNavTab === 'my-config'" 
       :project-id="projectId" 
       :is-locked="isLocked" 
   />
   ```

## Troubleshooting

### Tab not showing in navigation mode
- Check project status (must be >= 2)
- Verify conditional logic in `visibleNavigationTabs`
- Check project data has required flags
- Ensure tab ID is in `allTabs` array in ProjectNavigation

### Editor showing wrong component
- Check `currentStep` value (stepper mode)
- Check `currentNavTab` value (navigation mode)
- Verify v-if conditions in template

### Locked state not working
- Verify project status is > 3
- Check `isLocked` prop is passed to components
- Ensure components respect `isLocked` prop

### I18n strings not loading
- Check network requests to `/api/i18n`
- Verify i18n keys match button/field/desc calls
- Check language is set correctly (de/en/cz)

## API Integration

### Project Data
```typescript
GET /api/projects/{projectId}
Response: {
    id, name, domaincode,
    status, config,
    is_service, is_onepage, is_sidebar,
    is_regio, is_topic,
    owner_id, ...
}
```

### Config Updates
```typescript
PATCH /api/projects/{projectId}
Body: { config: { ... } }
```

## Future Enhancements

- Dynamic step configuration from database
- User role-based tab visibility
- Workflow transitions (status changes)
- Undo/redo for config changes
- Real-time collaboration
- Export/import project config
