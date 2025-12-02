# Projectlogin Workflow - Projects Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Core Project Status & Types
- Status composable (`useProjectStatus`)
- Project types: topic, project, regio, special
- Project stepper (new→released)
- Project dashboard for draft/released states
- Project home-page configuration
- Project posts-page configuration

### v0.3: External Presentation
- Full page system
- Page layouts
- Galleries and lists integration
- Legal pages (impressum, contact, datenschutz)

### v0.4: Special Projects
- 'dev' project functionality
- 'tp' project functionality
- Kanban integration

---

## Project Types

### topic
- Simplest type
- Has: images, posts
- No: events

### project
- Full featured
- Has: images, posts, events
- Standard workflows

### regio
- Regional hub
- Focus: users, related projects
- Has: own posts/events (often for internal org)
- Aggregates related project content

### special
- Like 'project' with less automation
- Subtypes: dev, tp
- Used for: homepage, meta-project

---

## Status Configuration

### Applicable Statuses
All standard statuses apply with extensions:
- new, demo, draft, confirmed, released, archived, trash

### Special rtag Extensions
- `prepare_to_publish` - Ready for release review
- `review_before_archive` - Requires review before archiving

### Config Bits
- `featured` - Highlighted on homepage
- `registration_open` - Accepting registrations

---

## Composable: useProjectStatus

```typescript
// Target API
interface UseProjectStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  projectType: ComputedRef<'topic' | 'project' | 'regio' | 'special'>
  isReleased: ComputedRef<boolean>
  isDraft: ComputedRef<boolean>
  isFeatured: ComputedRef<boolean>
  
  // Transitions
  toDraft(): Promise<void>
  toConfirmed(): Promise<void>
  toReleased(): Promise<void>
  toArchived(): Promise<void>
  
  // Config toggles
  toggleFeatured(): Promise<void>
  toggleRegistration(): Promise<void>
}
```

---

## Database Fields

### Status-Related Columns
- `status` (integer) - Combined status and scope bits
- `config` (integer) - Configuration bits
- `is_released` (generated) - True if status is released
- `is_featured` (generated) - True if featured bit set

### Type Fields
- `type` - project type (topic/project/regio/special)

---

## Related Components

- `ProjectStepper.vue` - New project wizard
- `ProjectDashboard.vue` - Project management view
- `ProjectConfig.vue` - Configuration panel

---

## Test Files

- `status.projects.spec.ts` - Status composable tests
- `common.projects.spec.ts` - General project tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
