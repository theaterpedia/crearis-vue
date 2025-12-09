# Project Stepper

::: warning Brief Summary
Detailed documentation will be completed at end of v0.3.
:::

## Overview

The Project Stepper provides a guided workflow for setting up new projects.

### Key Files

| File | Purpose |
|------|---------|
| `src/views/project/ProjectStepper.vue` | Stepper navigation |
| `src/views/project/ProjectMain.vue` | Main container |
| `src/views/project/ProjectStep*.vue` | Individual step components |

## Stepper vs Dashboard Mode

| Mode | Condition | Navigation | Documentation |
|------|-----------|------------|---------------|
| Stepper | `status_id` = 18 or 19 | Sequential steps | This page |
| Dashboard | `status_id` >= 2 | 3-column layout | [Dashboard Layout](/docs/dev/features/dashboard-layout) |

The transition from Stepper to Dashboard happens when the project is activated (status changes from NEW to DRAFT).

## Steps by Project Type

### Default (Project)

1. Events
2. Posts
3. Images
4. Users (owner only)
5. Theme (owner only)
6. Pages
7. Activate (owner only)

### Topic

1. Posts
2. Images
3. Users (owner only)
4. Theme (owner only)
5. Pages
6. Activate (owner only)

### Regio

1. Users
2. Pages
3. Posts
4. Images
5. Events

## Owner-Conditional Steps

Non-owners don't see:
- Users step
- Theme step
- Activate step

```typescript
// ProjectStepper.vue
const steps = computed(() => {
  if (!isOwner) {
    return baseSteps.filter(s => 
      s.key !== 'users' && 
      s.key !== 'theme'
    )
  }
  return [...baseSteps, activateStep]
})
```

## Activation

The "Projekt aktivieren" button:
1. Changes `status_id` to 2 (draft)
2. Switches to dashboard mode
3. Sets default tab to 'homepage'

```typescript
async function handleActivateProject() {
  await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status_id: 2 })
  })
  projectStatusId.value = 2
  currentNavTab.value = 'homepage'
}
```

---

*Full documentation: v0.3*

*See also: [Dashboard Layout](/docs/dev/features/dashboard-layout)*
