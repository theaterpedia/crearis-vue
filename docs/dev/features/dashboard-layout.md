# Dashboard Layout

::: info Version
Introduced in v0.3 (alpha/dashboard branch)
:::

## Overview

The 3-column Dashboard Layout provides a rich entity browsing experience after project activation.

### Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      DashboardLayout                       │
├────────────┬───────────────┬─────────────────────────────-┤
│            │               │                               │
│ Collapsible│  EntityList   │        EntityBrowser          │
│   Tabs     │  (pList)      │    ┌──────────────────────┐   │
│            │               │    │     CardHero         │   │
│  [64x64]   │  ┌─────────┐  │    ├──────────────────────┤   │
│            │  │ Entity  │  │    │  Overview | Content  │   │
│  Events    │  │ Card    │──┼───▶│  Config | Interacts  │   │
│            │  └─────────┘  │    ├──────────────────────┤   │
│  Posts     │  ┌─────────┐  │    │                      │   │
│            │  │ Entity  │  │    │   [Active Tab Panel] │   │
│  Images    │  │ Card    │  │    │                      │   │
│            │  └─────────┘  │    └──────────────────────┘   │
│            │               │                               │
│    <> ◀────│               │                               │
│            │               │                               │
└────────────┴───────────────┴──────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardLayout.vue` | 3-column orchestrator |
| `src/components/dashboard/CollapsibleTabs.vue` | Left sidebar with 64x64 collapse |
| `src/components/dashboard/EntityBrowser.vue` | CardHero + tab navigation |
| `src/components/dashboard/EntityOverview.vue` | Stats, actions, workflow stub |
| `src/components/dashboard/EntityContentPanel.vue` | Content with md-field visibility |
| `src/components/dashboard/ConfigPanelStub.vue` | Config + post-its placeholder |
| `src/components/dashboard/index.ts` | Barrel export |

## Component Details

### DashboardLayout

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `projectId` | `string \| number` | required | Project identifier |
| `entityType` | `'posts' \| 'events' \| 'images'` | `'events'` | Active entity type |
| `initialSection` | `string` | - | Initial tab to select |

**Layout:**

- Column 1: CollapsibleTabs (64px collapsed, 200px expanded)
- Column 2: Entity list (pList) - 320px
- Column 3: EntityBrowser - flex grow

### CollapsibleTabs

**Features:**

- Toggle between icon-only (64x64) and full width modes
- Uses `<>` icons for collapse/expand toggle
- Emits `tab-change` when switching sections

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `TabItem[]` | Array of tab definitions |
| `modelValue` | `string` | Currently active tab ID |

### EntityBrowser

**Structure:**

1. **CardHero** (fixed height header)
   - Entity image
   - Entity title + teaser
   
2. **Tab Navigation**
   - Overview (default)
   - Content
   - Config
   - Interactions (events only)

3. **Tab Panels**
   - Slot-based for flexibility
   - Default implementations provided

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `entity` | `any` | The entity data object |
| `entityType` | `string` | Type of entity |
| `projectId` | `string \| number` | Project ID |
| `alpha` | `boolean` | Enable stub/demo content |

### EntityContentPanel

**Mode-based visibility:**

| Mode | md-field | html-field | Behavior |
|------|----------|------------|----------|
| `dashboard` | Hidden | Hidden | Shows compact preview + expand button |
| `sidebar` | Visible | Hidden | Shows full textarea for editing |

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | `any` | required | Entity with md/html fields |
| `entityType` | `string` | required | Type of entity |
| `mode` | `'dashboard' \| 'sidebar'` | `'dashboard'` | Display mode |

## Feature Flag

```typescript
// ProjectMain.vue
const useNewDashboard = true  // Toggle dashboard layout

// In template
<DashboardLayout v-if="useNewDashboard && !isInStepperMode" ... />
<ProjectTabs v-else-if="!isInStepperMode" ... />
```

## CSS Conventions

All dashboard components follow [Opus CSS conventions](/docs/dev/features/theme-opus-css):

- Colors: `oklch()` syntax
- Fonts: `var(--font)`
- Radius: `var(--radius-small)`, `var(--radius-medium)`, `var(--radius-large)`
- Borders: `var(--border-small)`
- Transitions: `var(--transition)`

## Tab Configuration

### Events

```typescript
const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'config', label: 'Config', icon: '⚙️' },
    { id: 'interactions', label: 'Interactions', icon: '👥' }
]
```

### Posts / Pages

```typescript
const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'config', label: 'Config', icon: '⚙️' }
]
// No interactions tab
```

## Integration Points

### With InteractionsPanel

```vue
<InteractionsPanel
    mode="base-panel"
    :project-id="projectId"
    :event-id="entity?.id"
    :use-stub-data="alpha"
/>
```

### With EditPanel

The EntityContentPanel wraps EditPanel functionality with mode-aware visibility:

- Dashboard mode: Shows preview, "Open Editor" button
- Sidebar mode: Shows full EditPanel form

---

*Related: [Project Stepper](/docs/dev/features/project-stepper) | [Theme Opus CSS](/docs/dev/features/theme-opus-css)*
