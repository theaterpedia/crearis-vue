# Deferred Tasks for v0.8

**Version Focus:** Catch-all for deferred items not clearly v0.5/v0.6/v0.7  
**Target:** Q2 2026

---

## Core v0.8 Scope

### Refactoring Tasks
- [ ] **!IMPORTANT: Refactor partner_id usage** - Get rid of numeric partner_id in favor of xmlid everywhere. Until then, partner_id may be used where xmlid would need complicated code-logic.

### Database & Schema
- [ ] Comments system migration to tasks table (from JSONB to tasks-based)
- [ ] Project-level entity containment triggers
- [ ] Database constraint: ensure every project has an owner

---

## Moved from v0.5 Deferred (Not clearly v0.5/v0.6/v0.7)

### Auth-System
- [ ] Admin role on sign bit (bit 31) - requires special handling for negative values
- [ ] Home route '/' as hub/showcase - search-engine-like functionality
- [ ] Users/Persons entity expansion - decide if 'user' entity includes instructors/persons
- [ ] Base role deprecation analysis

### Routing
- [ ] Route structure refinement: `/api/site`, `/api/projects`, `/api/admin`
- [ ] Rollup pages for /sites: `/sites/:domaincode/posts`, `/sites/:domaincode/events`
- [ ] API refactoring shared logic - middleware for auth/capability checking

### Database
- [ ] project_members.role storage - explicit role values
- [ ] Superuser pattern - user with owner role on all projects

### Workflow & Tags Extensions
- [ ] `read-summary` limitation for participants
- [ ] `write-nocreate` project config mode
- [ ] `write-body` vs `write-meta` distinction
- [ ] Tag edit restriction for delegated owners
- [ ] rtags specification: `isFeatured`, `isDeprecated`, `isPinned`, etc.

---

## Nice-to-Have (Future Consideration)

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

### Integration
- [ ] Calendar sync for events
- [ ] Email notifications
- [ ] Webhook support

### UI/UX
- [ ] Mobile-optimized views
- [ ] Keyboard shortcuts
- [ ] Accessibility audit

---

## Notes

- This is the catch-all for items that don't fit v0.5/v0.6/v0.7
- Review and redistribute after v0.7 completion
