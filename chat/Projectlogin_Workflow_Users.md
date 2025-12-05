# Projectlogin Workflow - Users Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Role Differentiation
- Project owner functionality
- Project member functionality
- Admin functionality
- Basic user status

### v0.3: User in External Presentation
- User profiles in project pages
- Instructor display integration

### v0.4: Multi-Project Views
- Per-user kanban (multi-project)
- User dashboard across projects

---

## User Roles

### Owner
- Full project control
- Can manage members
- Can publish/unpublish
- Can configure external presentation

### Member
- Limited project access
- Can edit assigned content
- Cannot manage other members
- Cannot change project settings

### Admin
- System-wide access
- Can access all projects
- Special permissions for system management

---

## Status Configuration

### Applicable Statuses
Limited status set for users:
- new, confirmed, archived, trash

### No Scope Toggles
User visibility is handled differently via roles and project membership

---

## Composable: useUserStatus

```typescript
// Target API (simplified compared to other entities)
interface UseUserStatus {
  currentStatus: ComputedRef<number>
  isActive: ComputedRef<boolean>
  role: ComputedRef<'owner' | 'member' | 'admin'>
  
  // Role-based checks
  canEdit(entity: Entity): ComputedRef<boolean>
  canPublish(entity: Entity): ComputedRef<boolean>
  canManage(project: Project): ComputedRef<boolean>
}
```

---

## Database Fields

### Status-Related Columns
- `status` (integer) - User account status
- `is_active` (generated) - True if status is confirmed

### Role Fields
- `role` - Global role
- User-project relationship table for project-specific roles

---

## Related Components

- `UserProfile.vue` - User profile display
- `UserDashboard.vue` - Multi-project user view
- `MemberManagement.vue` - Project member management

---

## Test Files

- `status.users.spec.ts` - Status composable tests
- `auth.users.spec.ts` - Authentication tests
- `common.users.spec.ts` - General user tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
