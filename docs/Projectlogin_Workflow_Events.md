# Projectlogin Workflow - Events Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Basic Event Status
- Status composable (`useEventStatus`)
- Status display in event views
- Basic status transitions

### v0.3: Event Workflow
- Full workflow state machine
- Event editing interface
- Event-page configuration
- Post/Image association with events
- Event checkout configuration

### v0.4: Kanban Integration
- Events displayed in per-project kanban
- Events in per-user kanban view
- Task-entity integration for events

---

## Status Configuration

### Applicable Statuses
All standard statuses apply:
- new, demo, draft, confirmed, released, archived, trash

### Scope Toggles
- team, login, project, regio, public

### Special rtag Extensions
- `review_before_archive` - Events requiring review before archiving

---

## Composable: useEventStatus

```typescript
// Target API
interface UseEventStatus {
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

### Workflow Fields
- `main_task_id` - Reference to tasks table
- `workflow_state` - Current workflow position

---

## Related Components

- `EventEdit.vue` - Event editing panel
- `EventCard.vue` - Event display in lists
- `EventWorkflow.vue` - Workflow visualization

---

## Test Files

- `status.events.spec.ts` - Status composable tests
- `workflow.events.spec.ts` - Workflow tests
- `common.events.spec.ts` - General event tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
- [Sysreg Spec](./tasks/2025-11-19-A-sysreg-spec.md)
