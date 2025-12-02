# Projectlogin Workflow - Instructors Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Basic Status
- Status composable (`useInstructorStatus`)
- Basic status display

### v0.3: External Presentation
- Instructor profiles in project pages
- Instructor listings

### v0.4: Extended Features
- Instructor association with events
- Multi-project instructor display

---

## Status Configuration

### Applicable Statuses
- new, draft, confirmed, released, archived, trash

### Scope Toggles
- project, regio, public

---

## Composable: useInstructorStatus

```typescript
// Target API
interface UseInstructorStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  isReleased: ComputedRef<boolean>
  
  // Transitions
  toDraft(): Promise<void>
  toReleased(): Promise<void>
  toArchived(): Promise<void>
}
```

---

## Database Fields

### Status-Related Columns
- `status` (integer) - Combined status and scope bits
- `is_released` (generated) - True if status is released

### Association Fields
- `user_id` - Linked user account (optional)
- `project_id` - Primary project

---

## Related Components

- `InstructorCard.vue` - Instructor display
- `InstructorProfile.vue` - Full profile view
- `InstructorList.vue` - List display

---

## Test Files

- `status.instructors.spec.ts` - Status composable tests
- `common.instructors.spec.ts` - General instructor tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
