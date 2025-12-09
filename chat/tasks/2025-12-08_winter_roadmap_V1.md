# Winter Roadmap V1 - Crearis-Vue

**Created:** December 8, 2025 (Sunday Evening)  
**Author:** AI Assistant (Claude) with Hans  
**Branch:** `alpha/projectlogin_workflow`

---

## Executive Summary

This document captures the architectural decisions, migration work, and version roadmap established during the December 8, 2025 planning session. The session clarified what Crearis-Vue will NOT build (negative spec), established specialized table patterns over generic abstractions, and set up the migration foundation for v0.4-v0.8.

---

## Part 1: The Negative Spec - What We Will NOT Build

### The Question That Started It All

Hans's directive early in the session:

> "define what Crearis-Vue will NOT do"

This led to the creation of `chat/spec/negative-spec.md`, which became the cornerstone document for architectural decisions.

### Key "NO" Decisions

#### ❌ NO Generic Workitems Table

The original plan had a unified `workitems` table (migration 058) that would handle:
- Comments
- Tasks
- Activities
- Processes
- Scripts

**Why we rejected it:**

Hans explained the Odoo mental model:

> "workitems would be an interface, not a table. Odoo has several 'workitem-like' models: mail.activity, mail.message, project.task, calendar.event - each is its own table with specific fields"

This insight led to deleting `058_workitems_stub.ts` and instead creating specialized tables:
- `comments` (057) for PostIT discussions
- `image_workitems` (059) for image processing pipelines
- Future: `event_workitems`, `event_notes`, etc.

#### ❌ NO Tables for v0.6+ Features

We explicitly decided NOT to create these tables now:

| Table | Reason for Deferral |
|-------|---------------------|
| `participants` | Requires Odoo sync architecture (v0.7) |
| `event_registrations` | Events "confirmed" barrier not ready |
| `event_sessions` | Complex scheduling, not MVP |
| `event_workitems` | Wait for image_workitems learnings |

#### ❌ NO Anonymous Event Registration (Pre-v0.6)

Hans was very specific about the "confirmed" barrier:

> "confirmed means: we sync this event to Odoo, it cannot be changed after that point, because we write the confirmed data to Odoo (we don't want to deal with writing changes back to Odoo, we want to update the Odoo dataset only once, at that point)"

This means:
- Events in "confirmed" state are frozen
- No way back except "trash" (not sync'd)
- Registration requires confirmed events (v0.6)

### Test-Drive Constraints

Hans defined specific constraints for pre-v0.6 testing:

> "If I want to allow event-registration as test-drive I will have to make sure it does not affect other events: idea: allow registrations only for events that start after 2026-02-12, which is the event-start-date of the testevents I'm creating right now"

Combined with project-level control:

> "['opus1', 'opus2', 'opus3'] are my local test-projects, for the purpose of having test-events for test-registration"

**Result:** Registration allowed ONLY when:
1. `event.start_date > 2026-02-12`, OR
2. `project.domaincode ∈ ['opus1', 'opus2', 'opus3']`

---

## Part 2: Image System Architecture

### The Four-Shape Model

Hans explained the image shape system:

> "hero.vue is an intricate design of shape-elements that cover the 4 'shapes' we have: thumb, square, wide, vertical. Each of the elements is a vue-file, so for example there is 'HeroVertical.vue' to display an image in vertical dimensions"

### Adapter Chain: Author → Producer → Publisher

The image pipeline has three responsibility levels:

| Role | Responsibility | Example Adapters |
|------|----------------|------------------|
| **Author** | Provides original content | unsplash, canva, vimeo |
| **Producer** | Processes/optimizes | cloudinary, cloudflare |
| **Publisher** | Serves to frontend | cloudinary, cloudflare, crearis |

### Fine-Grained vs Coarse-Grained Tracking

We debated tracking granularity for image processing:

**Coarse-grained approach (rejected):**
```
image → processed_by: 'cloudinary,unsplash'
```

**Fine-grained approach (chosen):**
```sql
CREATE TABLE image_workitems (
    image_id INTEGER,
    workitem_type TEXT,  -- 'adapter', 'consent', 'review', 'admin'
    target_type TEXT,    -- 'adapter', 'vue_user', 'odoo_partner'
    target_ref TEXT,     -- 'cloudinary', 'user-123', 'partner.xmlid'
    status TEXT,
    ...
)
```

Hans explained the rationale:

> "The fine-grained approach aligns better with Odoo's mail.activity pattern, where each pending action is a separate record. This allows: proper audit trail, retry logic per adapter, consent tracking per person"

### Adapter Names (Fixed List)

Hans confirmed the adapter vocabulary:

> "unsplash, cloudinary, canva, vimeo, cloudflare, crearis - also: for the actions on images I would propose: basic_shape_optimization, hero_shape_optimization"

---

## Part 3: Events System Constraints

### The "Confirmed" Barrier

This is the key architectural decision for events:

```
draft → review → confirmed → [Odoo sync] → done
                    ↓
                  trash (no sync)
```

Hans emphasized:

> "what happens behind 'confirmed' should not sync back and thus does not need to be detailed for Crearis-Vue at all"

This dramatically simplifies pre-v0.6 implementation because:
1. No bidirectional sync complexity
2. No conflict resolution
3. Vue is source-of-truth until "confirmed"
4. Odoo is source-of-truth after "confirmed"

### Three-Tier User Recognition

From the interactions table analysis, Hans identified:

> "guest: has a tracking-cookie but is never being asked / never provides email or other data | user / verified: has provided an email address, we know there is a human behind this | loggedin: has been verified through Odoo"

This maps to the interactions system's `user_type` field.

---

## Part 4: Migration Execution Log

### Database Backup

Before running migrations, we created a safety net:

```bash
createdb -T crearis_admin_dev crearis_admin_mig056
```

This allows easy rollback if migrations fail.

### Migrations Run (December 8, 2025)

| Migration | Description | Issues Fixed |
|-----------|-------------|--------------|
| 052 | Trigger creator rename | - |
| 053 | Fix image trigger creator_id | - |
| 054 | Fix compute_role_visibility | Ownership: `ALTER FUNCTION ... OWNER TO crearis_admin` |
| 057 | Comments tables | FK types: `project_id`, `author_id`, `user_id` → INTEGER |
| 059 | Image workitems | FK types: `image_id`, `created_by` → INTEGER |
| 060 | Event Odoo stub fields | - |

### FK Type Pattern Discovered

All existing tables use INTEGER primary keys, not UUID:
- `projects.id` → INTEGER
- `users.id` → INTEGER
- `images.id` → INTEGER

New tables can use UUID for their own `id`, but foreign keys must be INTEGER:

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,           -- OK: new table
    project_id INTEGER REFERENCES projects(id),  -- Must be INTEGER
    author_id INTEGER REFERENCES users(id),      -- Must be INTEGER
    ...
)
```

### Deleted: 058_workitems_stub.ts

This migration was deleted because it contradicted the negative spec:

> "workitems as interface, not table"

The generic `workitems` table would have conflicted with the specialized table approach we chose.

---

## Part 5: Version Roadmap

### v0.4 - PostIT Live (Current)

**Focus:** Make PostIT comments persist

**Completed:**
- ✅ `comments` table (migration 057)
- ✅ `comment_reactions` table (migration 057)
- ✅ API endpoints (`/api/comments/*`)
- ✅ Frontend composable (`usePostITComments.ts`)

**Status:** Ready to test - comments should persist now

### v0.5 - Polymorphic Routing (January 2026)

**Focus:** Route comments to specialized tables based on entity_type

**Plan:**
```
/api/comments → router
  │
  ├─ entity_type='image' → image_workitems
  ├─ entity_type='project' → tasks (category='comment')
  ├─ entity_type='event' → event_workitems (v0.6)
  └─ entity_type='post' → comments
```

**Tasks:**
- [ ] Create `IWorkitem` interface
- [ ] Implement polymorphic routing in `/api/comments/*.ts`
- [ ] Reference implementation: wire `entity_type='image'` to `image_workitems`
- [ ] Odoo comments sync (Vue → Odoo only, mail.message creation)

### v0.6 - Hero.vue + Events (February 2026)

**Focus:** Cover images and event registration unlock

**Tasks:**
- [ ] Hero.vue alignment to shape system
- [ ] Zoom shapes to cover-page dimensions (1000px+)
- [ ] Device mockup previews in ImagesCoreAdmin
- [ ] Events "confirmed" barrier implementation
- [ ] Odoo sync trigger on `confirmed` status
- [ ] Remove test-drive constraints (Feb 12 date check)
- [ ] Test project forms: opus1, opus2, opus3

**Unlock:** Anonymous event registration goes live

### v0.7 - Odoo Sync + Publisher Chain (Hansh 2026)

**Focus:** Bidirectional sync and image publishing

**Tasks:**
- [ ] Full bidirectional sync for selected entity types
- [ ] Conflict resolution strategy
- [ ] Publisher chain implementation (author → producer → publisher)
- [ ] Consent workflow for images with people

### v0.8 - Catch-all + Refactoring (April 2026)

**Focus:** Clean up and debt reduction

**Tasks:**
- [ ] Refactor `target_odoo_id` to xmlid-only (remove numeric IDs)
- [ ] partner_id consistency across tables
- [ ] Performance optimization
- [ ] Loose ends from v0.5-v0.7

### v1.1 - Future / Nice-to-Have

**Tasks deferred indefinitely:**
- [ ] Event sessions (multi-day events)
- [ ] Advanced consent workflows
- [ ] Real-time collaboration features
- [ ] Mobile app considerations

---

## Part 6: Key Architectural Principles

### 1. Specialized Tables Over Generic Abstractions

**Principle:** Each domain gets its own table with domain-specific fields.

**Rationale:** Follows Odoo's pattern where `mail.activity`, `project.task`, and `calendar.event` are separate models, not rows in a generic `workitems` table.

### 2. Interface-First Design

**Principle:** Define TypeScript interfaces for concepts that span tables.

```typescript
interface IWorkitem {
    id: string
    status: 'pending' | 'in_progress' | 'done' | 'failed'
    created_at: string
    // ... common fields
}

// image_workitems implements IWorkitem
// comments implements IWorkitem (partially)
// tasks implements IWorkitem (partially)
```

### 3. One-Way Sync Until Confirmed

**Principle:** Vue is source-of-truth until "confirmed", then Odoo takes over.

**Rationale:** Avoids bidirectional sync complexity. Changes after "confirmed" happen in Odoo directly.

### 4. Fine-Grained Audit Trail

**Principle:** Track individual actions, not aggregated states.

**Rationale:** Enables retry logic, debugging, and GDPR compliance (consent per person).

### 5. INTEGER FKs for Legacy Tables

**Principle:** Always use INTEGER for foreign keys to existing tables.

**Rationale:** All base tables (`projects`, `users`, `images`) use INTEGER primary keys.

---

## Part 7: Files Created/Modified Today

### New Files

| File | Purpose |
|------|---------|
| `chat/spec/negative-spec.md` | What we will NOT build |
| `chat/spec/image-system-architecture.md` | Comprehensive image system doc |
| `chat/tasks/DEFERRED-v0.5.md` | v0.5 scope and tasks |
| `chat/tasks/DEFERRED-v0.6.md` | v0.6 scope (Hero.vue + Events) |
| `chat/tasks/DEFERRED-v0.7.md` | v0.7 scope (Odoo Sync) |
| `chat/tasks/DEFERRED-v0.8.md` | v0.8 scope (Catch-all) |
| `chat/tasks/DEFERRED-v1.1.md` | Future / Nice-to-Have |
| `server/database/migrations/060_event_odoo_stub_fields.ts` | Event Odoo stub fields |

### Modified Files

| File | Changes |
|------|---------|
| `server/database/migrations/057_create_comments_tables.ts` | FK types fixed (UUID → INTEGER) |
| `server/database/migrations/059_image_workitems.ts` | FK types fixed (UUID → INTEGER) |
| `server/database/migrations/index.ts` | Registered 057, 059, 060 |

### Deleted Files

| File | Reason |
|------|--------|
| `server/database/migrations/058_workitems_stub.ts` | Contradicts negative-spec |

---

## Part 8: Next Steps

### Immediate (Tonight/Tomorrow)

1. **Test PostIT persistence** - Create a comment via UI, verify it persists
2. **Push to origin** - `git push origin alpha/projectlogin_workflow`

### This Week

1. **Wednesday Dec 10** - Hero.vue exploration session
2. **Review fieldListUtility.ts** - Prepare opus1/2/3 test forms

### January 2026

1. **v0.5 implementation** - Polymorphic routing reference implementation
2. **Odoo comments sync** - One-way Vue → Odoo

---

## Appendix: Quoted Decisions

### On Workitems Architecture
> "workitems would be an interface, not a table" - Hans

### On Events Confirmed Barrier
> "confirmed means: we sync this event to Odoo, it cannot be changed after that point" - Hans

### On Test-Drive Constraints
> "allow registrations only for events that start after 2026-02-12" - Hans

### On Adapter Names
> "unsplash, cloudinary, canva, vimeo, cloudflare, crearis" - Hans

### On Consent Response
> "approved, denied, expired" - Hans (when asked about consent states)

### On created_by Nullability
> "use system users (like Odoo 'bot') instead of NULL" - Hans (following Odoo pattern)

---

*This document serves as the authoritative reference for the Winter 2025-2026 development roadmap and the architectural decisions that shaped it.*
