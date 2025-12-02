# Projectlogin Workflow - Posts Entity

**Sprint Target Implementation:** 25%  
**Focus:** Foundation complete (triggers, owner_id)

---

## Current State (Dec 2, 2025)

### ✅ Completed
- **Database triggers** for role visibility (r_anonym, r_partner, r_participant, r_member, r_owner)
- **owner_id column** added to posts table
- **AddPostPanel.vue** updated with owner dropdown (project users)
- **POST /api/posts** accepts owner_id field
- **GET /api/users?project_id=X** returns project owner + members

### ⏳ In Progress
- Alpha-prod testing of owner selection workflow
- Verification of 4 use cases (see AUTH-SYSTEM-SPEC)

### 📋 Next Steps
- `usePostStatus` composable implementation
- Connect r_* columns to frontend visibility filtering
- Status transition UI

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

### Role Visibility Columns (NEW - Dec 2)
- `r_anonym` (boolean) - Readable by anonymous users
- `r_partner` (boolean) - Readable by partners
- `r_participant` (boolean) - Readable by participants
- `r_member` (boolean) - Readable by members
- `r_owner` (boolean) - Readable by record owners

### Ownership Column (NEW - Dec 2)
- `owner_id` (integer, nullable) - References users.id, set when post created

### Association Fields
- `project_id` - Parent project
- `event_id` - Optional associated event
- `main_task_id` - Reference to tasks table

---

## Related Components

- `PostEdit.vue` - Post editing panel
- `PostCard.vue` - Post display in lists
- `PostContent.vue` - Post content renderer
- `AddPostPanel.vue` - Post creation with owner selection ✅

---

## Test Files

- `status.posts.spec.ts` - Status composable tests
- `common.posts.spec.ts` - General post tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
- [AUTH-SYSTEM-SPEC](./tasks/2025-12-01-AUTH-SYSTEM-SPEC.md)
