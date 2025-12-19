# Alpha Publishing System

::: warning TEMPORARY WORKAROUND
This system is a **temporary workaround** for v0.4 alpha phase. It will be removed in v0.5 when the full sysreg status system is implemented. See [DEFERRED-v0.5-alpha-cleanup.md](/chat/tasks/DEFERRED-v0.5-alpha-cleanup.md) for removal instructions.
:::

## Overview

During the alpha phase, we use the legacy `projects.status_old` field for visibility control instead of the new sysreg-based `status` field. This allows project owners to publish/unpublish their projects while the full workflow system is still under development.

## How It Works

### Environment Detection

Alpha mode is detected via environment variable:

```bash
# .env
VITE_APP_MODE=alpha
```

- **Client-side**: `import.meta.env.VITE_APP_MODE === 'alpha'`
- **Server-side**: `process.env.VITE_APP_MODE === 'alpha'`

### status_old Values

| Value | Visibility | Description |
|-------|------------|-------------|
| `'new'` | Owner/Members only | Project not yet activated (default) |
| `'draft'` | Owner/Members only | Project activated but not published |
| `'public'` | Everyone | Project published and visible to all |

### Two Separate Actions

1. **Activation** (Stepper → Dashboard)
   - Changes `status` from 1 (new) or 8 (demo) to 64 (draft)
   - Sets `status_old` to `'draft'`
   - This is a one-time action

2. **Publishing** (Toggle in Dashboard)
   - **Only changes `status_old`** between `'draft'` and `'public'`
   - Does NOT touch `status` field
   - Owners can toggle freely

## Access Control Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Request to /sites/:domaincode            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Is Alpha Mode?  │
                    └─────────────────┘
                     │              │
                    Yes             No
                     │              │
                     ▼              ▼
         ┌───────────────────┐   Use sysreg
         │ Check status_old  │   status logic
         └───────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
     'public'              'draft'/'new'
         │                       │
         ▼                       ▼
    ✅ Allow              ┌──────────────┐
                          │ Is member?   │
                          └──────────────┘
                           │           │
                          Yes          No
                           │           │
                           ▼           ▼
                      ✅ Allow    ❌ Show
                                 ProjectNotPublished
```

## UI Components

### Publish Toggle (ProjectMain.vue)

Located in the workflow header, visible only to project owners when:
- Alpha mode is active
- User is project owner
- Project status ≥ 64 (draft or higher)

```vue
<!-- Shows: 🌐 Öffentlich or 🔒 Nur Team -->
<div v-if="isAlphaMode() && isProjectOwner && projectStatus >= 64" 
     class="alpha-publish-toggle">
  ...
</div>
```

### ProjectNotPublished View

German-language "not published" page shown when:
- Alpha mode is active
- User tries to access a non-public project
- User is not owner/member

## API Changes

### Entity Filtering

Posts and Events endpoints filter by parent project's `status_old`:

```
GET /api/posts?project=domaincode
GET /api/events?project=domaincode
```

- Without `alpha_preview=true`: Only entities from `'public'` projects
- With `alpha_preview=true`: Include entities from `'draft'` projects

### Project PATCH

```
PATCH /api/projects/:domaincode
Body: { status_old: 'public' }  // or 'draft'
```

Only `status_old` is updated; `status` remains unchanged.

## Code Automation

### Affected Files List

For AI assistants and automation tools, here are all files involved in the alpha publishing system:

#### New Files (created for alpha)
```
src/composables/useAlphaMode.ts
src/composables/useProjectAccess.ts
src/views/ProjectNotPublished.vue
server/utils/alpha-mode.ts
chat/tasks/DEFERRED-v0.5-alpha-cleanup.md
```

#### Modified Files (alpha code added)
```
# API Endpoints
server/api/posts/index.get.ts
server/api/events/index.get.ts
server/api/projects/[id].patch.ts

# Components with alphaPreview prop
src/components/clist/ItemList.vue
src/components/clist/ItemGallery.vue
src/components/page/pList.vue
src/components/page/pGallery.vue
src/components/PageConfigController.vue

# Views with alpha access guards
src/views/ProjectSite.vue
src/views/PostPage.vue
src/views/EventPage.vue

# Project editor with publish toggle
src/views/project/ProjectMain.vue
```

#### Environment
```
.env  # VITE_APP_MODE=alpha
```

### Search Patterns for Alpha Code

To find all alpha-related code in the codebase:

```bash
# Find alpha mode checks
grep -r "isAlphaMode" src/ server/
grep -r "VITE_APP_MODE" src/ server/

# Find status_old usage
grep -r "status_old" src/ server/

# Find alpha preview parameter
grep -r "alpha_preview" src/ server/
grep -r "alphaPreview" src/

# Find TODO markers for v0.5 cleanup
grep -r "TODO v0.5" src/ server/
```

### Cleanup Checklist (for v0.5)

When removing alpha mode:

1. [ ] Remove `isAlphaMode()` checks from all components
2. [ ] Remove `alpha_preview` parameter from API endpoints
3. [ ] Remove `alphaPreview` prop from cList components
4. [ ] Remove alpha-specific filtering in posts/events endpoints
5. [ ] Delete `src/composables/useAlphaMode.ts`
6. [ ] Delete `server/utils/alpha-mode.ts`
7. [ ] Update `useProjectAccess.ts` to remove alpha code paths
8. [ ] Remove `VITE_APP_MODE=alpha` from `.env`
9. [ ] Migrate `status_old` data to new sysreg status system

## Testing

### Manual Test Scenarios

1. **Non-logged-in user on public project**: Should see content
2. **Non-logged-in user on draft project**: Should see ProjectNotPublished
3. **Project owner on draft project**: Should see content + publish toggle
4. **Project member on draft project**: Should see content (no toggle)
5. **Toggle publish**: Should only change `status_old`, not `status`

### Verify Toggle Behavior

```javascript
// Before toggle: status_old='draft', status=64
await fetch('/api/projects/domaincode', {
  method: 'PATCH',
  body: JSON.stringify({ status_old: 'public' })
})
// After: status_old='public', status=64 (unchanged!)
```
