# Auth-System Specification: sysreg_config Capabilities Matrix

**Sprint:** December 1-9, 2025 (Projectlogin Workflow)  
**Version:** v0.2 target  
**Branch:** `alpha/projectlogin_workflow`

---

## Overview

This document specifies the refactored auth-system using `sysreg_config` to define a capabilities matrix. The matrix determines which **role** gets which **capability** on **entity** records in a given **state** for a specific **project-type**.

### Key Principles

1. **Default-deny**: Nothing is allowed unless explicitly configured
2. **Bit-based encoding**: Follows sysreg pattern (like ctags, dtags)
3. **Category→Subcategory inheritance**: Capabilities use parent_bit pattern
4. **Computed simplification**: Higher capabilities include lower ones
5. **Project-scoped**: Capabilities are evaluated per-project based on user's role

---

## Bit Allocation: 28 bits (+ sign bit for admin)

| Bit Range | Purpose | Values |
|-----------|---------|--------|
| 0 | Default/Special flag | 0=merge with default, 1=special project |
| 1-2 | Project Type | 4 types |
| 3 | Entity scope flag | 0=all entities, 1=specific entity |
| 4-6 | Entity type | 8 entity types |
| 7-9 | Record state | 8 states |
| 10-12 | Read capability | category + subcategories |
| 13-15 | Update capability | category + subcategories |
| 16-18 | Create capability | category + subcategories |
| 19-21 | Manage capability | category + subcategories |
| 22-23 | Simple capabilities | list, share |
| 24-28 | Roles | 5 project-roles |
| 31 (sign) | Admin role | (v0.5 - deferred) |

**Total: 29 active bits + sign bit = 30 bits used** (within 32-bit signed integer)

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

### Group 2: Entity (bits 3-6)

#### Bit 3: Entity Scope Flag
| Value | Meaning |
|-------|---------|
| 0 | All entities (default rule) |
| 1 | Specific entity (bits 4-6 define which) |

#### Bits 4-6: Entity Type (when bit 3 = 1)
| Value | Entity | Notes |
|-------|--------|-------|
| 000 | default | Unspecified (features, etc.) |
| 001 | user | Users, instructors, persons |
| 010 | project | Project records |
| 011 | image | Images |
| 100 | post | Blog posts |
| 101 | event | Events |
| 110 | (reserved) | Future use |
| 111 | (reserved) | Future use |

---

### Group 3: Record State (bits 7-9)

Maps to `sysreg_status` categories:

| Value | State | Description |
|-------|-------|-------------|
| 000 | all | Applies to all states |
| 001 | new | Newly created, undefined |
| 010 | demo | Demo/example content |
| 011 | draft | Work in progress |
| 100 | review | Awaiting review/approval |
| 101 | released | Published/active |
| 110 | archived | Historical/inactive |
| 111 | trash | Marked for deletion |

---

### Group 4: Complex Capabilities (bits 10-21)

Each complex capability uses 3 bits with category→subcategory pattern:

#### Read Capability (bits 10-12)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No read access |
| 001 | read | Full read access (category) |
| 010 | read > preview | Preview/summary only |
| 011 | read > metadata | Metadata only |
| 100 | read > (reserved) | |
| 101-111 | (reserved) | |

#### Update Capability (bits 13-15)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No update access |
| 001 | update | Full update access (category) |
| 010 | update > comment | Add comments only |
| 011 | update > append | Append content only |
| 100 | update > replace | Replace content |
| 101 | update > shift | Change date/costs/count |
| 110-111 | (reserved) | |

#### Create Capability (bits 16-18)
| Value | Capability | Description |
|-------|------------|-------------|
| 000 | (none) | No create access |
| 001 | create | Full create access (category) |
| 010 | create > draft | Create as draft only |
| 011 | create > from_template | Create from template only |
| 100-111 | (reserved) | |

#### Manage Capability (bits 19-21)
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

### Group 5: Simple Capabilities (bits 22-23)

| Bit | Capability | Description |
|-----|------------|-------------|
| 22 | list | See name/stats, not content |
| 23 | share | Download, link, external share |

---

### Group 6: Roles (bits 24-28 + sign bit)

| Bit | Role | Description |
|-----|------|-------------|
| 24 | anonym | Anonymous public user, not logged in |
| 25 | partner | Parents, sponsors, interested persons |
| 26 | participant | Actors, attendees, active participants |
| 27 | member | Instructors, staff, team members |
| 28 | owner | Responsible person, project owner |
| 31 (sign) | admin | System administrator (v0.5) |

**Note:** Multiple role bits can be set to grant capability to multiple roles.

---

## Capability Inheritance (Computed Simplification)

Higher capabilities automatically include lower ones:

```
read    → includes: list
update  → includes: read, list, share
create  → includes: read, list, share
manage  → includes: list, share
```

This means if a config entry grants `update` to a role, that role also gets `read`, `list`, and `share` automatically.

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

---

## Example Config Entries

### Entry 1: "Released posts readable by anyone"
```
Bits: 0|10|1|100|101|001|000|000|000|00|11111
      │ │  │ │   │   │   │   │   │   │  └─ all roles
      │ │  │ │   │   │   │   │   │   └─ no simple caps (implied by read)
      │ │  │ │   │   │   │   │   └─ no manage
      │ │  │ │   │   │   │   └─ no create
      │ │  │ │   │   │   └─ no update
      │ │  │ │   │   └─ read (category)
      │ │  │ │   └─ released state
      │ │  │ └─ post entity
      │ │  └─ specific entity
      │ └─ project type
      └─ default (merge)
```

### Entry 2: "Draft events updatable by members"
```
Bits: 0|10|1|101|011|001|001|000|000|00|01000
      │ │  │ │   │   │   │   │   │   │  └─ member only
      │ │  │ │   │   │   │   │   │   └─ no simple caps
      │ │  │ │   │   │   │   │   └─ no manage
      │ │  │ │   │   │   │   └─ no create
      │ │  │ │   │   │   └─ update (category)
      │ │  │ │   │   └─ read (included by update)
      │ │  │ │   └─ draft state
      │ │  │ └─ event entity
      │ │  └─ specific entity
      │ └─ project type
      └─ default (merge)
```

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
- Role bit detection
- Role priority resolution
- Multi-role scenarios

### Test File: `tests/config.capabilities.spec.ts`
- Capability inheritance
- State filtering
- Entity filtering

### Test File: `tests/config.matrix.spec.ts`
- Full matrix resolution
- Project-type merging
- Default/special flag handling

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

## Notes for v1.1 (Future)

- Config merging strategy (local config overrides)
- Review-by-owner for config changes
- 2FA for sensitive operations
