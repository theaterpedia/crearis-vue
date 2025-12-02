# Projectlogin Workflow - Images Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Image Editing Integration
- Existing `useImageStatus` composable (reference implementation)
- Image editing in project context
- Status display in image views

### v0.3: Image Associations
- Image→Event association
- Image→Post integration
- Image galleries in external pages

### v0.4: Extended Features
- Images in kanban views (if applicable)

---

## Existing Implementation

The image status system is the **reference implementation** for other entities. See `tests/unit/useImageStatus.spec.ts` for the established pattern.

---

## Status Configuration

### Applicable Statuses
Image-specific status flow:
- raw (0) - Just uploaded
- processing (1) - Being processed
- approved (2) - Ready for use
- published (3) - In use on pages
- archived - No longer in use

### No Scope Toggles
Image visibility is determined by the containing entity (post, event, project)

---

## Composable: useImageStatus

```typescript
// Existing implementation
interface UseImageStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  isPublished: ComputedRef<boolean>
  
  // Transitions
  startProcessing(): Promise<void>
  approve(): Promise<void>
  publish(): Promise<void>
  archive(): Promise<void>
}
```

→ See `src/composables/useImageStatus.ts` for full implementation

---

## Database Fields

### Status-Related Columns
- `status` (integer) - Image processing status
- Various image-specific fields (url, blurhash, dimensions, etc.)

### Association Fields
- `project_id` - Parent project
- `post_id` - Optional associated post
- `event_id` - Optional associated event

---

## Related Components

- `ImageAdmin.vue` - Image management
- `ImgShape.vue` - Image display with focal point
- `ShapeEditor.vue` - Image cropping/focal point

---

## Test Files

- `useImageStatus.spec.ts` - Existing status tests (reference)
- `status.images.spec.ts` - Additional status tests
- `common.images.spec.ts` - General image tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
- [Image System Doc](./IMAGE_SYSTEM_COMPLETE.md)
