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

### VERSION 0.2final / December 3rd (Wed)
**Focus:** Surface roles/auth + tags with 3 patches

| Patch | Entity | What |
|-------|--------|------|
| 1 | Posts | dtags/ctags/ttags + owner visibility |
| 2 | Images | TagFamilies in cimgImportStepper (✅ working) |
| 3 | Project Check-in | new→demo/draft + enable dashboard + members |

**Key Deliverables:**
- [x] Fix stepper visibility (status values updated to Migration 040)
- [ ] Project check-in: advance status, switch to dashboard view
- [ ] Basic posts editing with tags
- [x] Images with TagFamilies verified

### VERSION 0.3 / December 5th (Fri) 16:00
**Focus:** Consistent responsive experience in Stepper + Dashboard

**3 Workflows (TDD approach: middleware → composable → endpoint → UI):**

| Workflow | Entity | States | Day |
|----------|--------|--------|-----|
| 1. create-and-prepare-a-project | Project | new→demo→draft→review | Thu |
| 2. publish-a-post (partial) | Post | draft→review | Fri AM |
| 3. upload-review-release-image | Image | new→draft→confirmed→released | Fri PM |

> ⚠️ **IMPORTANT: Keep state machines LOCAL to entity!**
> Do NOT implement project-status → entity-visibility cascade in v0.3.
> The "project containment" logic (new/trash/archived projects hide all entities) is a v0.5 DB trigger.
> See: [Deferred Tasks - Project-Level Entity Containment](./2025-12-10-DEFERRED-from-Projectlogin_Workflow.md#project-level-entity-containment-v05-priority)

**Key Deliverables:**
- [ ] Workflow 1: Project stepper + dashboard activation
- [ ] Workflow 2: Post publishing (complete in v0.4)
- [ ] Workflow 3: Image consent workflow + tasks table
- [ ] Kanban as **feature preview** (showcase for tasks table design)

> ⚠️ **Note for Hans:** Do NOT try to finish or release Kanban before v0.5!
> Kanban serves as interface spec for tasks table, not production feature.

### VERSION 0.4 / December 9th (Tue morning)
**Focus:** Publishing workflow → acceptable external pages

| Track | Target |
|-------|--------|
| A: Publishing | Complete post workflow: draft→review→released |
| B: External | Public project presentation, acceptable pages |
| C: Images | Full consent/release workflow |

**Key Deliverables:**
- [ ] Core publishing workflow produces acceptable external pages
- [ ] Complete image consent workflow
- [ ] External project pages functional

---

## Daily Progress

| Date | Status | Summary |
|------|--------|---------|
| Nov 30 | 🟢 | Sprint preparation, TDD infrastructure |
| Dec 1 | 🟢 | AUTH-SYSTEM-SPEC created, CapabilitiesEditor.vue, CSS/DB conventions docs |
| Dec 2 | 🟡 | **DB triggers implemented** (mig 045-048), owner_id in posts/AddPostPanel, alpha-prod testing |
| Dec 3 | 🟢 | **VitePress docs setup**, 3-audience structure, oklch theming |
| Dec 4 | 🟢 | **StatusEditor + PostStatusBadge** complete (38 tests), scope toggles, migration 049 (draft_review + i18n), CAPABILITIES_REFACTORING_PLAN.md |
| Dec 5 | ⬜ | **v0.3 deadline**, Sunrise talk: sysreg_config as single source of truth |
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
- [Dec 4 Tasks](./2025-12-04.md) - StatusEditor, scope toggles, capabilities refactoring plan
- [Dec 5 Tasks](./2025-12-05.md) - v0.3 deadline, sunrise talk
- [Dec 10 Tasks](./2025-12-10.md) - **Day-long DevDocs session**
- [Deferred Tasks](./2025-12-10-DEFERRED-from-Projectlogin_Workflow.md) - Analysis Dec 11

### Technical References
- [TDD Implementation Plan](./2025-11-30-TDD-IMPLEMENTATION-PLAN.md)
- [Vitest Infrastructure Guide](./2025-11-13_VITEST_INFRASTRUCTURE_GUIDE.md)
- [Sysreg Spec](./2025-11-19-A-sysreg-spec.md)
- [Capabilities Refactoring Plan](../../docs/devdocs/CAPABILITIES_REFACTORING_PLAN.md) - Utils → Table-driven
