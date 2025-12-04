# Deferred Tasks from Projectlogin Workflow Sprint

**Sprint:** December 1-9, 2025  
**Deferred Analysis:** December 11, 2025  
**Purpose:** Collection point for tasks, ideas, and references that don't fit into the current day or are flagged as 'nice-to-have'.

> ⚠️ This file is a dropbox - it will have duplicates, missing items, and needs thorough analysis after the sprint ends.

---

## Deferred Tasks

### From Sprint Preparation (Nov 30)
- [ ] Analyze test health report after sprint
- [ ] Review deprecated tests for cleanup or removal

### From Dec 1 (Auth-System)
- [ ] Admin role on sign bit (bit 31) - requires special handling for negative values

### From v0.2 (Dec 2)
<!-- Add items here during v0.2 work -->

### From v0.3 (Dec 5)
<!-- Add items here during v0.3 work -->

### From Dec 4 (Posts Workflow)
- [ ] **Comments system migration to tasks table**: Consider moving from JSONB to tasks-based comments
  - Current: `comments JSONB` field on posts/events/images/projects
  - Future: `tasks WHERE type='comment'` (closer to Odoo chatter pattern)
  - Rationale: Tasks already bridge states, comments often become tasks
  - Decision: JSONB for v0.3-v0.4 (fast, contained), evaluate migration for v0.5+
- [ ] **Workflow & Tags Extensions**: See [WORKFLOW-TAGS-EXTENSIONS.md](./WORKFLOW-TAGS-EXTENSIONS.md)
  - `read-summary` limitation for participants
  - `write-nocreate` project config mode
  - `write-body` vs `write-meta` distinction
  - Tag edit restriction for delegated owners (participants/partners)
  - rtags (record tags) specification: `isFeatured`, `isDeprecated`, `isPinned`, etc.

### From v0.4 (Dec 9)
<!-- Add items here during v0.4 work -->

---

## v0.5 Features (Next Sprint)

### Kanban System (Feature Preview → Production)
> Kanban was used as interface spec for tasks table in v0.3, now ready for production work.

- [ ] **Complete Kanban implementation**: Full drag-drop, persistence, filters
- [ ] **Per-project kanban view**: Project-scoped task boards
- [ ] **Per-user kanban view**: Cross-project task aggregation
- [ ] **Unified status ordering**: Align Kanban columns with 7 entity states
- [ ] **Components to complete:**
  - `KanbanDemo.vue` - Make production-ready
  - `TaskDashboard.vue` - Integrate with tasks table
  - `Kanban.vue` - Core component polish

### Auth-System
- [ ] **Admin role on sign bit (bit 31)**: Implement admin role detection with sign bit handling
  - Sign bit produces negative value in JavaScript (-2147483648)
  - Requires special bitwise handling: `(configValue & (1 << 31)) !== 0`
  - Tests already drafted in `config.roles.spec.ts` (marked as draft)
- [ ] **Home route '/' as hub/showcase**: Transform home route into search-engine-like functionality
  - Use dtags, ctags for content discovery
  - Aggregate content from all projects
  - No editing actions, only viewing + newsletter signup
- [ ] **Users/Persons entity expansion**: Decide if 'user' entity (bit 001) includes instructors/persons
- [ ] **Base role deprecation analysis**: Evaluate if base role (templates/demo content) should be deprecated

### Routing
- [ ] **Route structure refinement**: Consider `/api/site`, `/api/projects`, `/api/admin` structure
- [ ] **Rollup pages for /sites**: Add `/sites/:domaincode/posts`, `/sites/:domaincode/events` rollup pages
- [ ] **API refactoring shared logic**: Implement shared auth/capability checking middleware

### Database
- [ ] **project_members.role storage**: Store explicit role values ('owner', 'member', 'participant', 'partner')
- [ ] **Database constraint**: Ensure every project has an owner (prevent inaccessible projects)
- [ ] **Superuser pattern**: Create user with owner role on all projects (instead of admin acting as superuser)

### Project-Level Entity Containment (v0.5 Priority)
> **IMPORTANT CONCEPT** - Do NOT duplicate this logic in v0.2-v0.4 state machines!

The current auth system has two levels:
1. **Project-level access**: Who can see/access the project itself
2. **Entity-level access**: Who can see/access posts/images/events within the project

**Problem:** When a project is in certain states (`new`, `trash`, `archived`), all entities within it should be "contained" - invisible to non-owners even if the entity's own r-flags would normally allow access.

**Solution (v0.5):** Implement a DB-level trigger/constraint that:
- Checks project status before returning any entity within that project
- Prevents "leaking" of entities from inconsistent projects
- Allows full project recovery (trash → restore) without altering entity states
- Works like a "containment field" around the project

**Edge cases to handle:**
| Project Status | Who Sees Project | Who Sees Entities Within |
|----------------|------------------|--------------------------|
| `new (1)` | Owner only | Owner only (containment) |
| `trash` | Owner only | Owner only (containment) |
| `archived` | Owner + members? | TBD - may allow read-only |
| `demo (8)+` | Per capability rules | Per entity r-flags |

**Why defer to v0.5:**
- Requires careful DB trigger design
- Must handle edge cases (cross-project images, shared entities)
- Current v0.2-v0.4 work focuses on entity-level state machines
- Premature implementation would create duplication

**For v0.2-v0.4 state machine work:**
- Keep state machine logic LOCAL to the entity
- Don't try to check project status in entity workflows
- The project-role → entity-role cascade is a v0.5 concern
- Comment in code: `// v0.5: Project containment trigger handles project-level visibility`

---

## v1.1 Features (Future / Nice-to-Have)

### Config System
- [ ] **Entity-level config override**: Per-record config field that can override default project config
  - From prompt: "On requesting the config from the composable the active view can provide a local config-integer"
  - Composable decides: replace default or apply merging strategy
  - Backend cross-checks and limits to prevent malicious usage
  - Review-by-project-owner for config changes
  - 2FA for sensitive operations
- [ ] **Config owner role**: Extend owner detection to support 'config owner' (separate from content owner)

### Entity Bits Expansion
- [ ] **Entity bit 5 (reserved)**: Use for more detailed entity sub-types
  - From prompt: "bit 5: leave unused here -> we may want to go further into detail with entities from v1.1"

### Workflow
- [ ] **Task delegation system**: Allow members to delegate blocked actions to owner
  - "Ask owner to trash this" button in status editor
  - Task record stores proposed changes for owner review
  - Member can preview but not commit changes to released content
  - From prompt: "At the place where it would be nice to have the 'trash'-button for a post that is about to be released instead of the direct action-button a button 'ask owner to trash this' could be provided"

---

## Nice-to-Have Features

### Status System
- [ ] Visual status flow diagram component
- [ ] Status history/audit trail
- [ ] Bulk status change UI

### Kanban
- [ ] Drag-and-drop reordering
- [ ] Custom column definitions
- [ ] Kanban export/print view

### External Presentation
- [ ] Theme customization per project
- [ ] Custom domain management UI
- [ ] SEO preview component

---

## Ideas for Future Sprints

### Entities
- [ ] Comments/annotations on entities
- [ ] Entity versioning/history
- [ ] Entity templates

### Integration
- [ ] Calendar sync for events
- [ ] Email notifications
- [ ] Webhook support

### UI/UX
- [ ] Mobile-optimized views
- [ ] Keyboard shortcuts
- [ ] Accessibility audit

---

## References to External Documentation

### Related Issues
<!-- Link GitHub issues here -->

### Related Discussions
<!-- Link discussions here -->

---

## Post-Sprint Analysis (Dec 11+)
<!-- Fill in after sprint ends - Dec 10 is DevDocs day -->

### Priority Items for Next Sprint
1. 
2. 
3. 

### Items to Archive
- 

### Items Requiring More Research
- 
