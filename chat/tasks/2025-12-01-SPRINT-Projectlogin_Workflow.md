# SPRINT: Projectlogin Workflow
**Sprint Period:** December 1-9, 2025  
**Branch:** `alpha/status`

---

## Summary

This sprint delivers the core project workflow system, enabling consistent login experience for project owners and members. It integrates status management (sysreg), entity editing (posts, events, images), and kanban-based task visualization across three milestones targeting versions 0.2, 0.3, and 0.4.

---

## Conventions for Code Automation

### File Naming
- **Test files:** `{group}.{target}.spec.ts` (e.g., `status.events.spec.ts`, `common.images.spec.ts`)
- **Task docs:** `YYYY-MM-DD*.md` in `/docs/tasks/`
- **Entity docs:** `Projectlogin_Workflow_{Entity}.md` in `/docs/`

### Test-Driven Development
- Use `v({ version: '0.2' })` decorator for versioned tests
- Mark incomplete tests with `v({ draft: true })`
- Mark obsolete tests with `v({ deprecated: true })`
- Run version-filtered tests: `TEST_MAXV=0.2 pnpm test:v`

### Status System (sysreg)
- Always use integer bit representation, never string names
- Reduce subcategories to parent categories for core logic
- Status categories: new(0-2), demo(3-5), draft(6-8), confirmed(9-11), released(12-14), archived(15), trash(16)
- Scope toggles: team(17), login(18), project(19), regio(20), public(21)

### Entity Types
- **Projects:** topic, project, regio, special
- **Priority:** topic, project, regio (fully tested) > special (prototype, code-hacks OK)
- **Special projects:** 'dev' and 'tp' are two specific projects, not subtypes

### Database
- PostgreSQL with `sysreg_status`, `sysreg_rtags` tables
- Generated columns for key status flags (e.g., `is_released`, `is_deprecated`)
- Composables handle frontend status logic, triggers handle backend consistency

### Documentation Updates
- Daily task files updated 2-4 times per day
- Roadmap updated once daily with major achievements
- Entity docs focus on target state until 50% implementation, then current state

---

## Milestones

### VERSION 0.2 / December 2nd, 16:00
**Focus:** Core Status Management + Internal Project Experience

| Track | Target |
|-------|--------|
| A: Status | Composables per entity, tagFamilyDisplay/Editor integration, db-trigger alignment |
| B: Internal | Project types (topic/project), stepper, dashboard, post/image editing, page config |
| C: Auth | Owner/member/admin differentiation, draft inter-project relationships |

**Key Deliverables:**
- [ ] `useProjectStatus`, `useEventStatus`, `usePostStatus` composables
- [ ] Status UI components integrated from sysreg
- [ ] Project stepper functional for draft→released
- [ ] Basic post and image editing

### VERSION 0.3 / December 5th, 16:00
**Focus:** Workflow Logic + External Presentation

| Track | Target |
|-------|--------|
| A: Workflow | Enhanced status with workflow examples (events) |
| B: Internal | Event editing, event-page config, post/image→event association |
| C: External | Project pages, layouts, galleries, lists, legal pages |

**Key Deliverables:**
- [ ] Event workflow prototype
- [ ] External project presentation
- [ ] Configurable event checkout
- [ ] Legal page editing (impressum, contact, datenschutz)

### VERSION 0.4 / December 9th, 16:00
**Focus:** Kanban + Special Projects + Roadmap

| Track | Target |
|-------|--------|
| A: Kanban | Per-project and per-user kanban views |
| B: Special | 'dev' and 'tp' projects (prototype, accepts code-hacks, not fully tested) |
| C: Roadmap | External roadmap display, interactions table integration |

**Key Deliverables:**
- [ ] Kanban board with unified status ordering
- [ ] Features entity and roadmap display
- [ ] Interaction system for roadmap feedback

---

## Daily Progress

| Date | Status | Summary |
|------|--------|---------|
| Nov 30 | 🟢 | Sprint preparation, TDD infrastructure |
| Dec 1 | 🟢 | AUTH-SYSTEM-SPEC created, CapabilitiesEditor.vue, CSS/DB conventions docs |
| Dec 2 | 🟡 | **DB triggers implemented** (mig 045-048), owner_id in posts/AddPostPanel, alpha-prod testing |
| Dec 3 | 🟢 | **VitePress docs setup**, 3-audience structure, oklch theming |
| Dec 4 | ⬜ | **after-v0.3 (evening):** Docs session #1 |
| Dec 5 | ⬜ | **v0.3 deadline**, Docs session #1 continues if needed |
| Dec 8 | ⬜ | Sprint work |
| Dec 9 | ⬜ | **v0.4 deadline** |
| Dec 10 | ⬜ | **after-v0.4:** Day-long DevDocs session |

Legend: 🟢 Complete | 🟡 In Progress | 🔴 Blocked | ⬜ Not Started

---

## Related Documents

### Entity Documentation
- [Events](../Projectlogin_Workflow_Events.md)
- [Posts](../Projectlogin_Workflow_Posts.md)
- [Projects](../Projectlogin_Workflow_Projects.md)
- [Users](../Projectlogin_Workflow_Users.md)
- [Images](../Projectlogin_Workflow_Images.md)
- [Instructors](../Projectlogin_Workflow_Instructors.md)
- [Locations](../Projectlogin_Workflow_Locations.md)
- [Features](../Projectlogin_Workflow_Features.md)

### Task Documents
- [Nov 30 Tasks](./2025-11-30.md)
- [Dec 1 Tasks](./2025-12-01.md)
- [Dec 4 Tasks](./2025-12-04.md) - Evening docs session #1 (oklch)
- [Dec 5 Tasks](./2025-12-05.md) - v0.3 deadline
- [Dec 10 Tasks](./2025-12-10.md) - **Day-long DevDocs session**
- [Deferred Tasks](./2025-12-10-DEFERRED-from-Projectlogin_Workflow.md) - Analysis Dec 11

### Technical References
- [TDD Implementation Plan](./2025-11-30-TDD-IMPLEMENTATION-PLAN.md)
- [Vitest Infrastructure Guide](./2025-11-13_VITEST_INFRASTRUCTURE_GUIDE.md)
- [Sysreg Spec](./2025-11-19-A-sysreg-spec.md)
