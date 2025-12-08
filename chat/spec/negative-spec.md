# Crearis-Vue Negative Spec

> **What Crearis-Vue will NOT implement**

*Created: 2024-12-08*  
*Status: Living document*

## Philosophy

Crearis-Vue is:
- A **search engine** to the core
- An **easy interface** for quickly rolling out new projects
- A tool for **creators and instructors** (not end-users/participants)

Crearis-Vue is NOT:
- A replacement for Odoo's complexity
- A public-facing application for event participants
- A full CRM or ERP system

**Guiding Principle:** "Odoo should lead" — Crearis-Vue simplifies, proxies, and presents. It does not replicate.

---

## Tables We Will NOT Create

### ❌ `participants`
**Reason:** Public users who register for events go to Crearis-Nuxt (public website) and Odoo (registration management).

Crearis-Vue only serves:
- Project owners
- Creators (content producers)
- Instructors (who teach)

These are all represented in the existing `users` table.

### ❌ `event_registrations`
**Reason:** Odoo handles registration completely via `event.registration`.

Registration states (`draft → open → done/cancel`) are Odoo's domain. We may display registration counts via a cron-synced jsonb field on events, but we don't store individual registrations.

### ❌ `event_sessions` (as a table)
**Reason:** Sessions live in Odoo (`event.session`, 178 fields). We proxy them via XML-RPC when needed.

If we need session data for search/display, we cache it in a jsonb field on events, synced by cron.

### ❌ `workitems` (generic unified table)
**Reason:** The concept of "workitems" is an **interface/contract**, not a table.

Different workitem types have different lifecycles:
- `tasks` table (existing) → admin tasks, project tasks
- `image_workitems` table (new) → image processing, consent, review
- Odoo activities → synced via XML-RPC, not replicated

### ❌ `comments` (standalone table)
**Reason:** Comments are either:
1. Part of Odoo's chatter system (synced via XML-RPC)
2. Simple notes stored in jsonb on the parent entity
3. Future: Part of a specific workitem type

We don't need a generic comments table.

### ❌ `mail_activities` / `mail_messages`
**Reason:** These are Odoo's chatter system. We read them via XML-RPC, never store locally.

---

## Tables We WILL Create (Minimal Set)

### ✅ `image_workitems` (NEW - v0.5)
Fine-grained tracking for image processing:
- `adapter` - Processing pipeline steps (resize, optimize, etc.)
- `consent` - GDPR consent requests
- `review` - Social review requests (audience)
- `admin` - Manual admin actions

See: `server/database/migrations/059_image_workitems.ts`

### ✅ `event_instructors` (NEW - v0.5)
Junction table linking events to users (instructors).
- Who teaches what event
- Odoo sync via `odoo_xmlid`

### ✅ Existing tables remain:
- `users` - Instructors/creators who log in
- `tasks` - Admin tasks with `category: 'admin'` (already works!)
- `projects` - Project entities
- `images` - Image entities
- `locations` - Simplified partners (places)
- `events` - Event entities (with jsonb for Odoo stats cache)

---

## Data We Sync via Cron (Not Tables)

### Event Statistics
```jsonb
events.odoo_stats = {
  "registration_count": 45,
  "seats_available": 55,
  "seats_max": 100,
  "state": "confirm",
  "synced_at": "2024-12-08T10:00:00Z"
}
```
Synced hourly from Odoo via XML-RPC.

### Partner/Location Basics
For locations that exist in Odoo, we sync basic info:
```jsonb
locations.odoo_cache = {
  "partner_id": 123,
  "name": "Kulturzentrum",
  "city": "Wien",
  "synced_at": "2024-12-08T10:00:00Z"
}
```

---

## Features Delegated to Odoo

| Feature | Odoo Model | Crearis-Vue Approach |
|---------|-----------|---------------------|
| Event registration | `event.registration` | Proxy via XML-RPC |
| Session scheduling | `event.session` | Proxy via XML-RPC |
| Track management | `event.track` | Proxy via XML-RPC |
| Mail activities | `mail.activity` | Read-only via XML-RPC |
| Chatter messages | `mail.message` | Read-only via XML-RPC |
| Partner management | `res.partner` | Simplified to `locations` |
| Product catalog | `product.product` | Not needed |
| Invoicing | `account.move` | Not needed |
| Website events | `website.event.*` | Crearis-Nuxt handles |

---

## Features Delegated to Crearis-Nuxt

| Feature | Why |
|---------|-----|
| Public event pages | High traffic, SEO, caching |
| Registration forms | Public users, Odoo integration |
| Event calendar (public) | Static generation |
| Participant portal | Self-service, password reset |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-08 | No `participants` table | Public users → Nuxt/Odoo |
| 2024-12-08 | No `event_registrations` | Odoo handles completely |
| 2024-12-08 | `workitems` = interface, not table | Different types, different tables |
| 2024-12-08 | Reuse `tasks` for admin work | Already has `category: 'admin'` |
| 2024-12-08 | `image_workitems` fine-grained | Audit trail, per-adapter retry |
| 2024-12-08 | Cron sync for Odoo stats | jsonb cache, not replication |
| 2024-12-08 | Events: "confirmed" = one-way door to Odoo | Simplifies pre-v0.6 implementation |
| 2024-12-08 | Test-drive constraints: Feb 12 + opus1/2/3 | Safe testing without production impact |

---

## Events System Constraints (Pre-v0.6)

### ❌ NO Anonymous Event Registration Until v0.6

The system will NOT allow before v0.6 deployment:
- Anonymous registration to events on public website
- Sign-in to events storing data to Odoo

### ✅ Test-Driving Exceptions

Registration/sign-in IS allowed for testing when:
1. **Date constraint:** Event `start_date > 2026-02-12`
2. **Project constraint:** Event belongs to test projects: `opus1`, `opus2`, `opus3`

```typescript
// Constraint check (pseudo-code)
function canTestDriveRegistration(event: Event): boolean {
    const FEB_12_2026 = new Date('2026-02-12')
    const TEST_PROJECTS = ['opus1', 'opus2', 'opus3']
    
    return event.start_date > FEB_12_2026 
        || TEST_PROJECTS.includes(event.project_domaincode)
}
```

### Events State Machine: The "Confirmed" Barrier

**Key architectural decision:** Events beyond state `confirmed` are NOT propagated to Odoo until they cross that barrier.

| State | Odoo Sync | Notes |
|-------|-----------|-------|
| `new`, `draft` | ❌ Local only | Team can plan freely |
| `confirmed` | ✅ → Odoo | **One-way door** - no way back except trash |
| `released` | ✅ Synced | Public, in Odoo |
| `trash` | ❌ | Soft delete, removes from Odoo |

**Rationale:**
- Team can keep planning locally without tracking complexity
- System doesn't need to track anything from Odoo pre-confirmation
- Implementation toward v0.6 is as simple as images/posts
- The "confirmed-action" enables the full event system
- **No way back from confirmed** - only trash is possible

### Three-Tier User Recognition (Interactions Table)

The existing `interactions` table + `fieldListUtility.ts` provides a working foundation:

| Tier | usermode | Auth Level | What They See |
|------|----------|------------|---------------|
| **Anonymous** | `guest` | None | Registration form |
| **Recognized** | `user`, `verified` | Email verified | More info, no full login |
| **Authenticated** | `loggedin` | Full auth | Full system access |

**Current Implementation (StartPage.vue):**
```
guest      → registration form (name, email, organization, etc.)
user       → password prompt (existing user, not yet verified)
verified   → verification form (simplified, pre-filled)
loggedin   → full access (member/creator/owner)
```

### fieldListUtility.ts Extension Plan

**Step 1: Add test project forms**
```typescript
// New form registry entries
'opus1_registration': { ... }
'opus2_registration': { ... }
'opus3_registration': { ... }
'o1_event1': { ... }  // opus1 event 1
'o1_event2': { ... }  // opus1 event 2
// etc.
```

**Step 2: Config table or sysreg extension**
Transform fieldListUtility into:
- Option A: `interactions_config` table
- Option B: Extend sysreg with `sysreg_interactions` specialized table

### Participant Login Path (Future v0.6)

The `verified` user tier provides the basis for participant access:
- NOT under classical project-auth
- Gets access to Odoo content related to that user
- Straightforward extension to `participant` relation in auth
- Tied to `users.status` field (unverified vs verified)

---

## Open Questions

1. **Event types** - Do we need `event_type` enum in Crearis-Vue, or rely on Odoo's `event_type_id`?
2. **Instructor roles** - Just "instructor", or multiple roles (lead, assistant, guest)?
3. **Image consent expiry** - Should consent have an expiration date?
4. **fieldListUtility evolution** - Config table vs sysreg extension?

---

*This document defines boundaries. When in doubt: "Can Odoo do this?" If yes, let Odoo do it.*

---

## Stubs to Implement NOW (Dec 8-10)

> **Goal:** Inform/guard remaining sprint implementation without blocking.

### Priority 1: Migration Reordering

| Migration | Status | Action |
|-----------|--------|--------|
| 057_create_comments_tables | ✅ In index | Keep - supports PostIT comments |
| 058_workitems_stub | ❌ STUB only | Keep as stub - v0.5 |
| 059_image_workitems | ✅ In index | Keep - ready but not urgently needed |

**No reordering needed** - current order is correct.

### Priority 2: Stub Composables (Edge Components)

These composables already exist and should be surfaced as "edge" for the remaining days:

| Composable | Status | Use As Edge For |
|------------|--------|-----------------|
| `usePostITComments.ts` | ✅ 487 lines | Comments UI (FloatingPostIt) |
| `useAlphaFlags.ts` | ✅ Working | Feature gating (v0.5 stubs) |
| `useImageStatus.ts` | ✅ Working | Image workflow states |
| `useCapabilities.ts` | ✅ Working | Role-based permissions |

### Priority 3: Event Stub Fields

**Small migration needed (060):** Add stub fields to events table for v0.6 preparation:

```sql
-- Events table stub fields for Odoo sync
ALTER TABLE events ADD COLUMN IF NOT EXISTS odoo_xmlid TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS odoo_stats JSONB;  -- Cron-synced stats
ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;  -- One-way door timestamp
```

### Priority 4: PostIT as "Edge" Pattern

The Friday-night PostIT components should be surfaced:

| Component | Path | Edge Use |
|-----------|------|----------|
| `FloatingPostIt.vue` | `src/fpostit/` | Comments display |
| `FpostitRenderer.vue` | `src/fpostit/` | Global renderer |
| `usePostITComments.ts` | `src/composables/` | CRUD operations |
| `pPostit.vue` | `src/components/page/` | Aside/footer postits |

**Action:** These are already working - just need to be wired to the comments table (migration 057).

### Priority 5: Interactions Stub for Events

Extend `fieldListUtility.ts` with test project forms:

```typescript
// Add to formRegistry
'opus1_registration': { ... },
'opus2_registration': { ... },
'opus3_registration': { ... },
```

**Deferred to v0.6:** Full config table migration.

---

## Summary: What to Do Now vs Later

| Now (Dec 8-10) | v0.5 (Jan) | v0.6 (Feb) |
|----------------|-----------|-----------|
| Wire PostIT → comments table | image_workitems full | Events confirmed barrier |
| Add odoo_xmlid to events | Kanban production | Hero.vue integration |
| Test opus1/2/3 forms | Consent workflow UI | Participant login path |
| useAlphaFlags for feature gates | | fieldListUtility → config |

---
