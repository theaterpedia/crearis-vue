# Sprint v0.5 Input: User Roles & Partner Types Clarification

**Created:** December 11, 2025  
**For Sprint:** v0.5 Odoo Integration  
**Related:** Migration 061 (partners table)

---

## Problem Statement

Migration 061 introduced `partners.partner_types` bitmask (1=instructor, 2=location, 4=participant, 8=organisation). 

**Ambiguity discovered:** Some bits represent **intrinsic entity types** (location, organisation), while others represent **dynamic relationships** (participant) or **user declarations** (instructor).

### Semantic Analysis

| Bit | Type | Source of Truth | Scope | User Control? |
|-----|------|-----------------|-------|---------------|
| 1 | `is_instructor` | User declaration | **Global** - "I can teach" | ✅ User toggles |
| 2 | `is_location` | Entity data | **Global** - inherently a venue | ❌ System-set |
| 4 | `is_participant` | `project_members` relation | **Per-project** initially, accumulated globally | ❌ Auto-set by trigger |
| 8 | `is_organisation` | Entity data | **Global** - inherently an org | ❌ System-set |

---

## Proposed Design: "Has Ever Been / Can Be" Model

`partner_types` represents **accumulated capabilities**, not current project-specific roles.

### Trigger Logic

**On INSERT to `project_members` WHERE `configrole` IN ('participant', 'partner'):**
- Set bit 4 (`is_participant`) on corresponding `partners` record if not already set
- **Never unset** - once participated, capability flag remains

### User Control

| Flag | User Can Toggle | UI Location |
|------|-----------------|-------------|
| `is_instructor` | ✅ Yes | Profile settings: "Available as instructor" |
| `is_participant` | ⚠️ Hide only? | Profile settings: "Show participation history" |
| `is_location` | ❌ No | N/A (entity type) |
| `is_organisation` | ❌ No | N/A (entity type) |

### Query Patterns

```sql
-- Global: "Find all potential instructors"
SELECT * FROM partners WHERE partner_types & 1 = 1;

-- Project-specific: "Who's participating in this project"
SELECT p.* FROM partners p
JOIN project_members pm ON pm.partner_id = p.id
WHERE pm.project_id = ? AND pm.configrole = 'participant';

-- Event-specific: "Who's teaching this event"
SELECT p.* FROM partners p
JOIN event_instructors ei ON ei.instructor_id = p.id
WHERE ei.event_id = ?;
```

---

## Edge Cases

### User logs in with only "participant" role
- Has `users.partner_id` → has a Partner profile
- `partner_types & 4 = 4` → is marked as participant
- `partner_types & 1 = 0` → NOT an instructor
- **Access:** Can view projects they're registered in via `project_members`

### User logs in with only "partner" role (project partner, not instructor)
- Has `users.partner_id` → has a Partner profile
- Listed in `project_members` with `configrole = 'partner'`
- May or may not have any `partner_types` bits set
- **Access:** Project-specific based on `project_members.configrole`

---

## Implementation Tasks (v0.5)

- [ ] Create trigger: `project_members` INSERT → update `partners.partner_types`
- [ ] Add profile setting: "Available as instructor" toggle (bit 1)
- [ ] Add profile setting: "Show participation history" toggle (visibility, not bit)
- [ ] Update auth flow to check `partner_types` for role-based access
- [ ] Document query patterns in PARTNERS_DESIGN.md

---

## Schema Cleanup: Partners Table (v0.5)

### Fields to Review/Refactor

| Field | Issue | Recommendation |
|-------|-------|----------------|
| `participant_type` | Duplicates `partner_types` bitmask logic | **DROP** - use bitmask instead |
| `is_location_provider` | Redundant with `partner_types & 2` | **DROP** - use bitmask |
| `is_company` | Redundant with `partner_types & 8` | **DROP** - use bitmask |
| `project_id` | Oversimplifies - partners can be in multiple projects | **DROP** - use `project_members` relation |
| `age` | Oversimplified - should be birth date | **RENAME** to `date_of_birth` (DATE type) |

### Instructor Flag: Users vs Partners?

**Question:** Should `is_instructor` be on `users` table instead of `partners.partner_types`?

**Arguments for `users.is_instructor`:**
- Instructor is a **user capability**, not a partner entity type
- Login flow checks user credentials first, then partner data
- Simpler query: `SELECT * FROM users WHERE is_instructor = true`

**Arguments against (keep in `partners`):**
- Partners without user accounts could still be instructors (external instructors)
- Consistent bitmask approach for all role types
- Already implemented in migration 061

**Recommendation:** Keep in `partners.partner_types` for now, but add `users.is_instructor` BOOLEAN as a **cached/denormalized** flag set by trigger when `partners.partner_types & 1 = 1` and user links to that partner.

### Migration 063 Tasks

```sql
-- Drop redundant columns
ALTER TABLE partners DROP COLUMN IF EXISTS participant_type;
ALTER TABLE partners DROP COLUMN IF EXISTS is_location_provider;
ALTER TABLE partners DROP COLUMN IF EXISTS is_company;
ALTER TABLE partners DROP COLUMN IF EXISTS project_id;

-- Refactor age to date_of_birth
ALTER TABLE partners RENAME COLUMN age TO date_of_birth;
ALTER TABLE partners ALTER COLUMN date_of_birth TYPE DATE USING NULL;

-- Optional: Add cached is_instructor to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_instructor BOOLEAN DEFAULT FALSE;
```

---

## Related Files

- `server/database/migrations/061_partners_refactor.ts`
- `server/api/auth/login.post.ts` (uses `partner_types & 1` for instructor check)
- `src/types.ts` (Partner interface with type guards)

---

*Input document for v0.5 sprint planning*
