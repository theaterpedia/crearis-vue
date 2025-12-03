# Auth-System Specification: sysreg_config Capabilities Matrix

**Sprint:** December 1-9, 2025 (Projectlogin Workflow)  
**Version:** v0.2-v0.4  
**Branch:** `alpha/projectlogin_workflow`

---

## Overview

This document specifies the refactored auth-system using `sysreg_config` to define a capabilities matrix. The matrix determines which **role** gets which **capability** on **entity** records in a given **state** for a specific **project-type**.

### Key Principles

1. **Default-deny**: Nothing is allowed unless explicitly configured
2. **Bit-based encoding**: Follows sysreg pattern (like ctags, dtags)
3. **Explicit configuration**: Each entity configured separately (no "all entities" templating)
4. **No capability inheritance**: Capabilities are explicit, no computed simplification
5. **Project-scoped**: Capabilities are evaluated per-project based on user's role
6. **Record ownership**: Creator owns the record; project-owner gets elevated capabilities via config

### Ownership Model (Variant 3)

- **Record creator = owner** of that specific record
- **Project-owner gets elevated *capabilities*** (via sysreg_config), not elevated role
- Project-owner acts as 'member' on records they didn't create, but with extra manage permissions
- This provides sandbox autonomy while allowing project-level control

---

## Bit Allocation: 31 bits (+ sign bit for admin)

| Bit Range | Purpose | Values |
|-----------|---------|--------|
| 0 | Default/Special flag | 0=merge with default, 1=special project |
| 1-2 | Project Type | 4 types |
| 3-7 | Entity type | 32 entity types (5 bits) |
| 8-10 | Record state | 8 states |
| 11-13 | Read capability | category + subcategories |
| 14-16 | Update capability | category + subcategories |
| 17-19 | Create capability | category + subcategories |
| 20-22 | Manage capability | category + subcategories |
| 23-24 | Simple capabilities | list, share |
| 25-29 | Roles | 5 project-roles |
| 30 | (reserved) | Future use |
| 31 (sign) | Admin role | (v0.5 - deferred) |

**Total: 30 active bits + sign bit = 31 bits used** (within 32-bit signed integer)

---

## Bit Groups Specification

### Group 1: Project Type (bits 0-2)

#### Bit 0: Default/Special Flag
| Value | Meaning |
|-------|---------|
| 0 | Default (merge with inherited config) |
| 1 | Special (standalone config, no merge) |

#### Bits 1-2: Project Type
| Value | Type | Description |
|-------|------|-------------|
| 00 | core | Base config, internal entities only, no public publishing |
| 01 | topic | Extends core, adds topic-specific publishing |
| 10 | project | Extends core, full project publishing |
| 11 | regio | Extends core, regional/network publishing |

#### Inheritance Rules
- `default core` = `special core` (identical, no parent)
- `default topic` = `default core` + topic-specific additions
- `default project` = `default core` + project-specific additions
- `default regio` = `default core` + regio-specific additions
- No secondary inheritance (regio does NOT inherit from topic+project)

---

### Group 2: Entity (bits 3-7) - 5 bits, 32 values

| Value | Entity | Notes |
|-------|--------|-------|
| 00000 | (all) | Reserved for future "all entities" if needed |
| 00001 | user | Users, instructors, persons |
| 00010 | project | Project records |
| 00011 | image | Images |
| 00100 | post | Blog posts |
| 00101 | event | Events |
| 00110 | task | Tasks |
| 00111 | location | Locations |
| 01000-11111 | (reserved) | Future entities |

**Note:** Each entity is configured explicitly. No "all entities" templating in v0.2-v0.4.

---

### Group 3: Record State (bits 8-10)

Maps to `sysreg_status` categories:

| Value | State | Description |
|-------|-------|-------------|
| 000 | all | Applies to all states |
| 001 | new | Newly created, undefined (also = "no record yet") |
| 010 | demo | Demo/example content |
| 011 | draft | Work in progress |
| 100 | review | Awaiting review/approval |
| 101 | released | Published/active |
| 110 | archived | Historical/inactive |
| 111 | trash | Marked for deletion |

**Note:** State `new` (001) is equivalent to "record doesn't exist yet" for create capability checks.

---

### Group 4: Complex Capabilities (bits 11-22)

Each complex capability uses 3 bits with category→subcategory pattern:

#### Read Capability (bits 11-13)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No read access |
| 001 | read | Full read access (category) |
| 010 | read > preview | Preview/summary only |
| 011 | read > metadata | Metadata only |
| 100-111 | (reserved) | |

#### Update Capability (bits 14-16)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No update access |
| 001 | update | Full update access (category) |
| 010 | update > comment | Add comments only |
| 011 | update > append | Append content only |
| 100 | update > replace | Replace content |
| 101 | update > shift | Change date/costs/count |
| 110-111 | (reserved) | |

#### Create Capability (bits 17-19)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No create access |
| 001 | create | Full create access (category) |
| 010 | create > draft | Create as draft only |
| 011 | create > from_template | Create from template only |
| 100-111 | (reserved) | |

#### Manage Capability (bits 20-22)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No manage access |
| 001 | manage | Full manage access (category) |
| 010 | manage > status | Change status only |
| 011 | manage > config | Change config only |
| 100 | manage > delete | Delete/trash only |
| 101 | manage > archive | Archive only |
| 110-111 | (reserved) | |

---

### Group 5: Simple Capabilities (bits 23-24)

| Bit | Capability | Description |
|-----|------------|-------------|
| 23 | list | See name/stats, not content |
| 24 | share | Download, link, external share |

---

### Group 6: Roles (bits 25-29 + sign bit)

| Bit | Role | Description |
|-----|------|-------------|
| 25 | anonym | Anonymous public user, not logged in |
| 26 | partner | Parents, sponsors, interested persons |
| 27 | participant | Actors, attendees, active participants |
| 28 | member | Instructors, staff, team members |
| 29 | owner | Record owner (creator of the record) |
| 31 (sign) | admin | System administrator (v0.5) |

**Note:** Multiple role bits can be set to grant capability to multiple roles.

**Important:** The `owner` role (bit 29) refers to the **record owner** (whoever created the record), NOT the project-owner. Project-owners receive elevated capabilities via separate config entries granting them member-level access plus manage permissions.

---

## NO Capability Inheritance (Explicit Configuration)

**DROPPED for v0.2-v0.4:** The computed simplification (read→list, update→read+list+share, etc.) is NOT implemented.

**Reason:** 
1. Hard to implement in database triggers
2. Not stoppable (can't opt-out of inherited capabilities)
3. Explicit configuration via CapabilitiesEditor is clearer

**Instead:** Each config entry explicitly sets all needed capability bits. The CapabilitiesEditor UI makes this trivial.

---

## Generated Columns on Entity Tables

Each entity table will have these generated columns (computed from status bits):

| Column | Type | Description |
|--------|------|-------------|
| r_anonym | boolean | Readable by anonymous users |
| r_partner | boolean | Readable by partners |
| r_participant | boolean | Readable by participants |
| r_member | boolean | Readable by members |
| r_owner | boolean | Readable by owners |

These are **generated columns** based on the entity's `status` field, following the sysreg_config matrix. A database trigger maintains these.

### Implementation Status ✅ (Dec 2)

**Implemented in migrations 045-047:**
- `project_members.configrole` INTEGER column (maps role to bits: member=8, participant=4, partner=2)
- `r_*` columns + `owner_id` added to posts, images, projects tables
- `compute_role_visibility(entity_type, entity_state)` trigger function
- Triggers fire on INSERT or UPDATE OF status

**Trigger Logic:**
```sql
-- Extracts role bits (25-29) from sysreg_config entries
-- matching entity type + state, aggregates with bit OR
SELECT bit_or(
  ((config::jsonb->'sysreg'->>'value')::INTEGER >> 25) & 31
) INTO role_bits
FROM crearis_config
WHERE (config::jsonb->>'key') = 'sysreg'
  AND (config::jsonb->'sysreg'->>'type') = 'config'
  AND ((config::jsonb->'sysreg'->>'value')::INTEGER >> 3) & 31 = entity_type_int
  AND (
    ((config::jsonb->'sysreg'->>'value')::INTEGER >> 8) & 7 = entity_state
    OR ((config::jsonb->'sysreg'->>'value')::INTEGER >> 8) & 7 = 0
  );
```

**Verification Query:**
```sql
SELECT id, status, owner_id, r_anonym, r_partner, r_participant, r_member, r_owner 
FROM posts ORDER BY id DESC LIMIT 10;
-- Posts with status=0 show r_member=true, r_owner=true (based on sysreg_config)
```

---

## Example Config Entries

### Entry 1: "Released posts readable by anyone"
```
Bits: 0|00|00100|101|001|000|000|000|11|11111|0
      │ │  │     │   │   │   │   │   │  │     └─ reserved
      │ │  │     │   │   │   │   │   │  └─ all roles (anonym,partner,participant,member,owner)
      │ │  │     │   │   │   │   │   └─ list,share (explicit)
      │ │  │     │   │   │   │   └─ no manage
      │ │  │     │   │   │   └─ no create
      │ │  │     │   │   └─ no update
      │ │  │     │   └─ read (category)
      │ │  │     └─ released state
      │ │  └─ post entity (00100)
      │ └─ project type (00 = all)
      └─ default (merge)
```
**Note:** list and share are explicitly set because there's no capability inheritance.

### Entry 2: "Draft events updatable by members"
```
Bits: 0|00|00101|011|001|001|000|000|11|01100|0
      │ │  │     │   │   │   │   │   │  │     └─ reserved
      │ │  │     │   │   │   │   │   │  └─ participant,member
      │ │  │     │   │   │   │   │   └─ list,share (explicit)
      │ │  │     │   │   │   │   └─ no manage
      │ │  │     │   │   │   └─ no create
      │ │  │     │   │   └─ update (category)
      │ │  │     │   └─ read (category)
      │ │  │     └─ draft state
      │ │  └─ event entity (00101)
      │ └─ project type (00 = all)
      └─ default (merge)
```
**Note:** read, list, and share are all explicitly set alongside update.

### Entry 3: "Record owner can manage their own records"
```
Bits: 0|00|00000|000|001|001|001|001|11|10000|0
      │ │  │     │   │   │   │   │   │  │     └─ reserved
      │ │  │     │   │   │   │   │   │  └─ owner only
      │ │  │     │   │   │   │   │   └─ list,share
      │ │  │     │   │   │   │   └─ manage (category)
      │ │  │     │   │   │   └─ create (category)
      │ │  │     │   │   └─ update (category)
      │ │  │     │   └─ read (category)
      │ │  │     └─ all states
      │ │  └─ all entities (00000)
      │ └─ project type (00 = all)
      └─ default (merge)
```
**Note:** This grants the record owner full CRUD access to records they created.

### Entry 4: "Project-owner elevated access (as member)"
```
Bits: 0|00|00000|000|001|001|000|001|11|01000|0
      │ │  │     │   │   │   │   │   │  │     └─ reserved
      │ │  │     │   │   │   │   │   │  └─ member (project-owner is treated as member)
      │ │  │     │   │   │   │   │   └─ list,share
      │ │  │     │   │   │   │   └─ manage (category)
      │ │  │     │   │   │   └─ no create (optional, depends on entity)
      │ │  │     │   │   └─ update (category)
      │ │  │     │   └─ read (category)
      │ │  │     └─ all states
      │ │  └─ all entities (00000)
      │ └─ project type (00 = all)
      └─ default (merge)
```
**Note:** Project-owners are assigned the `member` role for other people's records, giving them elevated capabilities. This is Variant 3 ownership model - no role inheritance, just explicit config.

---

## Implementation Strategy

### Phase 1: sysreg-bitgroups.json (Today)
1. Define `config` family in sysreg-bitgroups.json
2. Define all bit groups with labels
3. Create seed entries for core matrix

### Phase 2: Database (Today)
1. Clear existing sysreg_config entries
2. Run migration to populate new entries
3. Add generated columns to entity tables

### Phase 3: Composables (Day 2)
1. Create `useConfig` composable
2. Integrate with `useAuth` for role detection
3. Create `useEntityCapabilities` per entity

### Phase 4: API Middleware (Day 2-3)
1. Create capability-checking middleware
2. Apply to entity endpoints
3. Test with different roles

---

## Testing Strategy

### Test File: `tests/config.roles.spec.ts`
- Role bit detection (bits 25-29)
- Role priority resolution
- Multi-role scenarios
- Owner vs member distinction

### Test File: `tests/config.capabilities.spec.ts`
- Capability bit extraction (bits 11-24)
- Complex capability subcategories
- Simple capability flags
- Explicit flag combinations (no inheritance)

### Test File: `tests/config.matrix.spec.ts`
- Full matrix resolution
- Project-type merging
- Default/special flag handling
- Ownership model resolution

---

## Related Files

- `src/config/sysreg-bitgroups.json` - Bit group definitions
- `src/composables/useConfig.ts` - (to be created)
- `src/composables/useAuth.ts` - Existing auth composable
- `server/api/auth/session.get.ts` - Session API
- `server/api/auth/login.post.ts` - Login with role detection

---

## Notes for v0.5 (Deferred)

- Admin role on sign bit (bit 31)
- Home route '/' as hub/showcase with search functionality
- Entity-level config override (per-record config field)
- **Project-main-owner concept:** A designated project-owner who can delegate ownership
- Bit 30 reserved for future use
- **Migration runner fix:** Currently requires `SKIP_MIGRATIONS=false` in `.env`, then `pnpm dev`, then set back to `true`. Investigate cleaner solution.

### v0.5: Project State Influence on Entity Visibility

**Trigger enhancement:** When project state changes, recompute `r_*` columns for all entities in that project.

**Rules:**
- Project `new`/`demo` → only owner + members see entities (override entity-level config)
- Project `trash`/`archive` → restrict visibility (entities become invisible to non-admins)
- Project `review`+ → use entity-level config as normal

**Implementation:**
```sql
-- Additional trigger on projects table
CREATE TRIGGER trigger_project_state_cascade
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION cascade_project_visibility();

-- Function touches all entities in project to trigger their r_* recomputation
CREATE OR REPLACE FUNCTION cascade_project_visibility()
RETURNS trigger AS $$
BEGIN
  UPDATE posts SET status = status WHERE project_id = NEW.id;
  UPDATE images SET status = status WHERE project_id = NEW.id;
  -- other entities...
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Notes for v1.1 (Future)

- Config merging strategy (local config overrides)
- Review-by-owner for config changes
- 2FA for sensitive operations
- Capability inheritance (optional opt-in)
