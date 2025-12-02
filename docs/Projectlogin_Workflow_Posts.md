# Projectlogin Workflow - Posts Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Basic Post Status & Editing
- Status composable (`usePostStatus`)
- Post editing interface
- Status display in post views
- Basic status transitions

### v0.3: Post Associations
- Post→Event association
- Post→Image integration
- Posts page configuration

### v0.4: Extended Features
- Posts in kanban views
- Task-entity integration

---

## Status Configuration

### Applicable Statuses
All standard statuses apply:
- new, demo, draft, confirmed, released, archived, trash

### Scope Toggles
- team, login, project, regio, public

---

## Composable: usePostStatus

```typescript
// Target API
interface UsePostStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  isReleased: ComputedRef<boolean>
  isDraft: ComputedRef<boolean>
  canPublish: ComputedRef<boolean>
  
  // Transitions
  toDraft(): Promise<void>
  toConfirmed(): Promise<void>
  toReleased(): Promise<void>
  toArchived(): Promise<void>
}
```

---

## Database Fields

### Status-Related Columns
- `status` (integer) - Combined status and scope bits
- `is_released` (generated) - True if status is released
- `is_public` (generated) - True if public scope bit set

### Association Fields
- `project_id` - Parent project
- `event_id` - Optional associated event
- `main_task_id` - Reference to tasks table

---

## Related Components

- `PostEdit.vue` - Post editing panel
- `PostCard.vue` - Post display in lists
- `PostContent.vue` - Post content renderer

---

## Test Files

- `status.posts.spec.ts` - Status composable tests
- `common.posts.spec.ts` - General post tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
