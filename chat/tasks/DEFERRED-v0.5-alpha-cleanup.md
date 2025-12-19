# DEFERRED v0.5 - Alpha Mode Cleanup

**Created**: 2025-01-XX (during alpha mode implementation)  
**Target Release**: v0.5 (when full status system is ready)  
**Priority**: Medium

## Overview

During alpha phase, we implemented a workaround using `projects.status_old` field for project visibility control instead of the full sysreg status system. This document tracks what needs to be cleaned up or migrated when the full status system is ready.

## Alpha Mode Implementation Summary

### What Was Added

1. **Environment Variable**: `VITE_APP_MODE=alpha` in `.env`
   - Detected via `import.meta.env.VITE_APP_MODE === 'alpha'`
   - Server: `process.env.VITE_APP_MODE || process.env.APP_MODE`

2. **New Composables**:
   - `src/composables/useAlphaMode.ts` - Alpha mode detection and project accessibility
   - `src/composables/useProjectAccess.ts` - Combined access control for alpha/beta modes

3. **New View**:
   - `src/views/ProjectNotPublished.vue` - German "not published" view for inaccessible projects

4. **Server Utilities**:
   - `server/utils/alpha-mode.ts` - Server-side alpha mode utilities

5. **API Endpoint Updates**:
   - `/api/posts/index.get.ts` - Added `alpha_preview` param and project status_old filtering
   - `/api/events/index.get.ts` - Added `alpha_preview` param and project status_old filtering
   - `/api/projects/[id].patch.ts` - Added `status_old` to allowed update fields

6. **Component Updates**:
   - `ItemList.vue`, `ItemGallery.vue`, `pList.vue`, `pGallery.vue` - Added `alphaPreview` prop
   - `PageConfigController.vue` - Connected preview toggle to alphaPreview prop
   - `ProjectSite.vue`, `PostPage.vue`, `EventPage.vue` - Added alpha mode access guards

7. **ProjectMain.vue Updates**:
   - `handleActivateProject()` now also sets `status_old = 'draft'` in alpha mode

### status_old Values Used

- `'new'` - Project not activated (default, ignored in filtering)
- `'draft'` - Project activated, visible only to owner/members
- `'public'` - Project published, visible to everyone

## Cleanup Tasks for v0.5

### Must Do

1. **Remove alpha-specific code paths** (after sysreg status is fully implemented):
   - [ ] Remove `isAlphaMode()` checks from components
   - [ ] Remove `alpha_preview` parameter from API endpoints
   - [ ] Update `handleActivateProject()` to not set `status_old`
   - [ ] Remove alpha-specific filtering in posts/events endpoints

2. **Migrate access control**:
   - [ ] Replace `useProjectAccess` alpha mode logic with sysreg-based logic
   - [ ] Update `ProjectNotPublished.vue` to use new status system
   - [ ] Remove `status_old` from API allowed fields (if not needed)

3. **Remove/Archive files**:
   - [ ] `src/composables/useAlphaMode.ts` - Can be removed entirely
   - [ ] `server/utils/alpha-mode.ts` - Can be removed entirely
   - [ ] Update `useProjectAccess.ts` to remove alpha code paths

### Consider Keeping

1. **ProjectNotPublished.vue** - May be useful for other "not accessible" scenarios
2. **useProjectAccess.ts** - The membership/access checking logic is still useful
3. **alphaPreview prop pattern** - Could be renamed to "previewMode" for admin/editor previews

### Data Migration

1. **projects.status_old field**:
   - Decision needed: Keep for backward compatibility or migrate to new status field?
   - If keeping: Document that it's deprecated but still checked
   - If removing: Create migration to move status_old → appropriate sysreg status

2. **Existing projects**:
   - Projects with `status_old = 'public'` should have their sysreg status set appropriately
   - Projects with `status_old = 'draft'` need owner notification about new workflow

## Testing Checklist (Before Removal)

- [ ] Verify all projects are accessible via new sysreg status system
- [ ] Verify preview mode works without alpha_preview parameter
- [ ] Verify non-public projects are properly protected
- [ ] Verify owners can still manage project visibility
- [ ] Verify entity filtering by project status works correctly

## Files Reference

### Files to Modify (remove alpha code):
- `src/composables/useProjectAccess.ts`
- `src/views/ProjectSite.vue`
- `src/views/PostPage.vue`
- `src/views/EventPage.vue`
- `src/views/project/ProjectMain.vue`
- `src/components/clist/ItemList.vue`
- `src/components/clist/ItemGallery.vue`
- `src/components/page/pList.vue`
- `src/components/page/pGallery.vue`
- `src/components/PageConfigController.vue`
- `server/api/posts/index.get.ts`
- `server/api/events/index.get.ts`
- `server/api/projects/[id].patch.ts`

### Files to Remove:
- `src/composables/useAlphaMode.ts`
- `server/utils/alpha-mode.ts`

### Environment:
- Remove `VITE_APP_MODE=alpha` from `.env` when ready

## Notes

- Alpha mode was designed to be additive, not replacing existing functionality
- The `status_old` field was already in the database from previous migrations
- All alpha-specific code is clearly marked with comments mentioning "alpha"
