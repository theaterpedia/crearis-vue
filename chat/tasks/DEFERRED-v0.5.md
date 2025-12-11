# Deferred Tasks for v0.5

**Version Focus:** Comments Polymorphic Routing + Odoo Reference Implementation  
**Target:** January 2026

---

## ⭕ Terminology and Routes for External Websites

Clarify ambiguous usage of 'home' and 'home'-routes in file-system and the meaning of the terminology:

**Current Ambiguity:**
- In the current implementation 'home' addresses routes on the root (`/home`) as well as beyond `/sites`
- We have distinct functionality at route `/start` (external project-login)

**Questions to Resolve:**
1. Is `/start` for events or just a special view on selected events that are in the phase where 'registering is open'?
2. What is the difference from route `/sites/[domaincode]/events` to `/sites/[domaincode]/start`?
3. Legal pages: where do imprint, privacy policy, terms live? Root or per-site?

**Tasks:**
- [ ] Document route terminology: `/home` vs `/sites/:domaincode/home`
- [ ] Clarify `/start` route purpose and relationship to events
- [ ] Define legal pages location strategy
- [ ] Update BETA_ARCHITECTURE_GUIDE with clarified routes

---

## Core v0.5 Scope

### Comments/PostIT Polymorphic Routing

Reference implementation for routing comments to specialized tables based on `entity_type`:

```
/api/comments → router
  │
  ├─ entity_type='image' → image_workitems (table 059)
  ├─ entity_type='project' → tasks (existing, category='comment')
  ├─ entity_type='event' → event_workitems (v0.6)
  └─ entity_type='post' → comments (table 057)
```

**Tasks:**
- [ ] Create `IWorkitem` interface in `types/workitems.ts`
- [ ] Implement polymorphic routing in `/api/comments/*.ts`
- [ ] Reference implementation: wire `entity_type='image'` to `image_workitems`
- [ ] Planning document: which entity_types route to which tables in v0.6/v0.7

### Odoo Comments Sync (Reference Implementation)

- [ ] One direction only: Vue → Odoo (mail.message creation)
- [ ] Map comment author to Odoo partner_id
- [ ] Wire pinned comments to Odoo starred messages
- [ ] Document sync protocol for v0.6 full implementation

---

## Planning Outputs

### v0.6 Comments Routing Plan
Determine which entity_types should route to specialized tables:

| entity_type | v0.6 Target Table | Odoo Model |
|-------------|-------------------|------------|
| `image` | `image_workitems` | - |
| `event` | `event_workitems` | `calendar.event` |
| `project` | `tasks` | `project.task` |
| `post` | `comments` | `mail.message` |

### v0.7 Full Odoo Sync Plan
- Bidirectional sync for which comment types?
- Conflict resolution strategy
- Batch sync vs real-time

---

## Migration Status

| Migration | Status | Description |
|-----------|--------|-------------|
| 057 | ✅ Registered | `comments` + `comment_reactions` tables |
| 058 | ❌ DELETED | Generic workitems (contradicts negative-spec) |
| 059 | ✅ Registered | `image_workitems` table |
| 060 | ✅ Registered | Event Odoo stub fields |

---

## Notes

- PostIT frontend (`usePostITComments.ts`) already complete
- API endpoints (`/api/comments/*`) already complete
- Just needed table (057) to exist
- Polymorphic routing is backend-only change, no frontend updates needed
