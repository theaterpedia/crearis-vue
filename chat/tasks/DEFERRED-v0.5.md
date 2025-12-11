# Deferred Tasks for v0.5

**Version Focus:** Comments Polymorphic Routing + Odoo Reference Implementation  
**Target:** January 2026

---

## Test Suite Updates (Migration 061)

### Fix Tests for Partners Table Refactor

Migration 061 unified `instructors`, `locations`, and `participants` into a single `partners` table with `partner_types` bitmask. This breaks tests that reference the old schema.

**Affected Areas:**
- [ ] Tests querying `users.instructor_id` (now `users.partner_id`)
- [ ] Tests querying `instructors` table directly (use `instructors_v` view or `partners`)
- [ ] Tests querying `locations` table directly (use `locations_v` view or `partners`)
- [ ] Tests querying `participants` table directly (use `participants_v` view or `partners`)
- [ ] Auth tests expecting `instructor_id` in user response

**Breaking Changes from Migration 061:**
- `users.instructor_id` → `users.partner_id`
- `users.participant_id` → `users.partner_id` (single link to partners table)
- Direct table access: use views (`instructors_v`, `locations_v`, `participants_v`) for backwards compatibility
- `partner_types` bitmask: 1=instructor, 2=location, 4=participant, 8=organisation

**Related Commits:**
- Migration 061: `9218ce7` (partners table creation)
- Auth refactor: `a047ee9` (API updates for partner_id)

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

## User/Partner Name Fields

### Add firstname/lastname Support

Currently `/home` route uses `username` and splits on space to get firstname. This is a workaround.

**Task:** Update users/partners tables to support proper name fields:

- [ ] Add `firstname`, `lastname` columns to `users` table
- [ ] Add `firstname`, `lastname` columns to `partners` table (if not already from Odoo)
- [ ] Update `/api/auth/login.post.ts` to return firstname in session
- [ ] Update `HomeLayout.vue` to use `user.firstname` instead of split hack
- [ ] Consider: sync with Odoo `res.partner` name fields

**Current Workaround (HomeLayout.vue):**
```ts
const userFirstName = computed(() => {
    const username = user.value?.username || 'Gast'
    return username.split(' ')[0]
})
```

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
