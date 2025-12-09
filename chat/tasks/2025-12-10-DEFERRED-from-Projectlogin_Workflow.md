# Deferred Tasks for v0.5

**Sprint Origin:** Projectlogin Workflow (December 1-9, 2025)  
**Version Focus:** Kanban + Image Workitems + Project Containment  
**Target:** January 2026

> **Related deferred files:**
> - [DEFERRED-v0.6.md](./DEFERRED-v0.6.md) - Hero.vue + Cover Images
> - [DEFERRED-v0.7.md](./DEFERRED-v0.7.md) - Odoo Sync + Publisher Chain
> - [DEFERRED-v0.8.md](./DEFERRED-v0.8.md) - Catch-all for later
> - [DEFERRED-v1.1.md](./DEFERRED-v1.1.md) - Future / Nice-to-Have

---

## Core v0.5 Scope

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

### Image Workitems (Migration 059)
- [ ] `image_workitems` table implementation
- [ ] Adapter workitem automation (`basic_shape_optimization`, `hero_shape_optimization`)
- [ ] Consent workflow UI
- [ ] Review workflow UI

### Project-Level Entity Containment
> **IMPORTANT CONCEPT** - Do NOT duplicate this logic in v0.2-v0.4 state machines!

- [ ] DB-level trigger for project containment
- [ ] Handle edge cases: cross-project images, shared entities
- [ ] Project status → entity visibility cascade

---

## Deferred from Sprint Days

### From Sprint Preparation (Nov 30)
- [ ] Analyze test health report after sprint
- [ ] Review deprecated tests for cleanup or removal

### From Dec 4 (Posts Workflow)
- [ ] **Comments system migration**: Consider moving from JSONB to tasks-based (moved to v0.8)

---

## Post-Sprint Analysis (Dec 11+)

### Priority Items for Next Sprint
1. Kanban production completion
2. Image workitems table
3. Project containment triggers

### Items Moved to Later Versions
- Auth system expansions → v0.8
- Routing refactoring → v0.8
- Workflow & Tags extensions → v0.8
- Config system → v1.1
- Task delegation → v1.1 
