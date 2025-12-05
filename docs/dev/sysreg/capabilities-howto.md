# Capabilities System: Developer Howto

**Created:** December 3, 2025  
**Sprint:** Projectlogin Workflow (Dec 1-9, 2025)  
**Purpose:** Deep technical guide for working with the capabilities matrix

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Test Environment](#test-environment)
3. [Bit Layout Cheat Sheet](#bit-layout-cheat-sheet)
4. [Current Capabilities Matrix](#current-capabilities-matrix)
5. [Common Scenarios with Examples](#common-scenarios-with-examples)
6. [Naming Conventions](#naming-conventions)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Tools](#tools)

---

## Quick Reference

### Status Values (Migration 040)
```
new       = 1     (stepper mode)
demo      = 8     (stepper mode)
draft     = 64    (dashboard mode)
confirmed = 512
released  = 4096
```

### Role Bits (bits 25-29)
```
anonym      = 1 << 25 = 33554432
partner     = 1 << 26 = 67108864
participant = 1 << 27 = 134217728
member      = 1 << 28 = 268435456
owner       = 1 << 29 = 536870912
```

### Configrole Values (project_members.configrole)
```
partner     = 2  (bit 1)
participant = 4  (bit 2)
member      = 8  (bit 3)
owner       = (determined by projects.owner_id, not configrole)
```

---

## Test Environment

### Test Project: opus1

| Field | Value |
|-------|-------|
| ID | 9 |
| Domaincode | `opus1` |
| Owner | Hans (user id: 8) |

### Test Users

| User | Email | Role | Configrole | User ID |
|------|-------|------|------------|---------|
| Hans Opus | hans.opus@theaterpedia.org | **owner** | - | 8 |
| Nina Opus | nina.opus@theaterpedia.org | member | 8 | 17 |
| Rosa Opus | rosa.opus@theaterpedia.org | participant | 4 | 7 |
| Marc Opus | marc.opus@theaterpedia.org | partner | 2 | 103 |

### Test Posts in opus1

| ID | xmlid | owner_id | r_owner | r_member | r_partner | r_participant |
|----|-------|----------|---------|----------|-----------|---------------|
| 34 | _physicaltheatre.002 | null | true | true | false | false |
| 36 | _opus1.003 | 8 (Hans) | true | false | false | false |
| 37 | _opus1.004 | 103 (Marc) | true | false | false | false |

### Reset Test Data Script

```bash
# Reset opus1 to 'new' status
npx tsx -e '
import { db } from "./server/database/init"
async function reset() {
    await new Promise(r => setTimeout(r, 1000))
    await db.run("UPDATE projects SET status = 1 WHERE domaincode = $1", ["opus1"])
    console.log("opus1 reset to status=1 (new)")
    process.exit(0)
}
reset()
'

# Reset opus1 passwords (needs env vars)
npx tsx server/database/reset-opus1-passwords.ts
```

---

## Bit Layout Cheat Sheet

### Full 31-bit Layout

```
Bit:  31  30  29  28  27  26  25  24  23  22-20  19-17  16-14  13-11  10-8  7-3   2-0
      │   │   │   │   │   │   │   │   │   │      │      │      │      │     │     │
      │   │   │   │   │   │   │   │   │   │      │      │      │      │     │     └── Project type
      │   │   │   │   │   │   │   │   │   │      │      │      │      │     └── Entity (5 bits)
      │   │   │   │   │   │   │   │   │   │      │      │      │      └── State (3 bits)
      │   │   │   │   │   │   │   │   │   │      │      │      └── Read cap (3 bits)
      │   │   │   │   │   │   │   │   │   │      │      └── Update cap (3 bits)
      │   │   │   │   │   │   │   │   │   │      └── Create cap (3 bits)
      │   │   │   │   │   │   │   │   │   └── Manage cap (3 bits)
      │   │   │   │   │   │   │   │   └── List cap
      │   │   │   │   │   │   │   └── Share cap
      │   │   │   │   │   │   └── Role: anonym
      │   │   │   │   │   └── Role: partner
      │   │   │   │   └── Role: participant
      │   │   │   └── Role: member
      │   │   └── Role: owner
      │   └── Reserved
      └── Admin (sign bit, v0.5)
```

### Entity Codes (bits 3-7)

| Binary | Decimal (<<3) | Entity |
|--------|---------------|--------|
| 00000 | 0 | all |
| 00001 | 8 | project |
| 00010 | 16 | user |
| 00011 | 24 | page |
| 00100 | 32 | post |
| 00101 | 40 | event |
| 00110 | 48 | image |
| 00111 | 56 | location |

### State Codes (bits 8-10)

| Binary | Decimal (<<8) | State |
|--------|---------------|-------|
| 000 | 0 | all |
| 001 | 256 | new |
| 010 | 512 | demo |
| 011 | 768 | draft |
| 100 | 1024 | review |
| 101 | 1280 | released |
| 110 | 1536 | archived |
| 111 | 1792 | trash |

---

## Current Capabilities Matrix

### Decoded from sysreg_config (Dec 3, 2025)

#### Post Rules

| Name | State | Roles | Capabilities |
|------|-------|-------|--------------|
| `post_released_read_all` | released | all | read, list |
| `post_draft_update_active` | draft | owner, member, participant | read, update, list, share |
| `post_create_auth` | new | owner, member, participant, partner | create, list |
| `post_owner_manage` | **all** | owner | read, update, manage, list, share |

#### Project Rules

| Name | State | Roles | Capabilities |
|------|-------|-------|--------------|
| `project_released_read_all` | released | all | read, list |
| `project_member_update` | **all** | member | read, update, list, share |
| `project_owner_manage` | **all** | owner | read, update, manage, list, share |

### Key Observations

1. **`project_member_update` applies to ALL states** - This means members can see a project even in `new` status!
2. **No explicit rules for `new` or `demo` project states** - Only `released` and `all`
3. **The `owner` role refers to RECORD owner** - Not project owner

---

## Common Scenarios with Examples

### Scenario 1: "Who can see project opus1 when status=new?"

**Current Rules:**
- `project_released_read_all`: State=released → ❌ doesn't apply (status=new)
- `project_member_update`: State=all → ✅ applies to members
- `project_owner_manage`: State=all → ✅ applies to owner

**Result:**
| User | Role | Can See? | Why |
|------|------|----------|-----|
| Hans | owner | ✅ Yes | `project_owner_manage` (state=all) |
| Nina | member | ✅ Yes | `project_member_update` (state=all) ⚠️ |
| Rosa | participant | ❌ No | No matching rule |
| Marc | partner | ❌ No | No matching rule |

**⚠️ Issue:** Nina CAN see the project in `new` status because `project_member_update` uses `state=all`.

### Scenario 2: "Who can see posts in opus1 when project status=new?"

**Two-Level Check (v0.5):**
1. First: Can user access the project? (see Scenario 1)
2. Then: Can user access the specific post?

**Current Implementation (v0.2-v0.4):**
- Posts API does NOT check project status
- Only checks post-level r-flags

**Example Post 36:** owner_id=8 (Hans), r_owner=true, r_member=false

| User | Post visible? | Why |
|------|---------------|-----|
| Hans | ✅ Yes | r_owner=true, he owns the post |
| Nina | ❌ No | r_member=false |
| Rosa | ❌ No | r_participant=false |
| Marc | ❌ No | r_partner=false |

### Scenario 3: "Hans creates a post in draft state - who can edit it?"

**Post Properties:**
- status: draft (64)
- owner_id: 8 (Hans)

**Matching Rules:**
- `post_draft_update_active`: State=draft, Roles=[owner, member, participant] → update
- `post_owner_manage`: State=all, Roles=[owner] → manage

| User | Can Edit? | Why |
|------|-----------|-----|
| Hans | ✅ Yes | `post_owner_manage` (owner of post) |
| Nina | ✅ Yes* | `post_draft_update_active` (member) |
| Rosa | ✅ Yes* | `post_draft_update_active` (participant) |
| Marc | ❌ No | partner not in active roles |

*Only if r_member/r_participant flags are set on the post

---

## Naming Conventions

### Config Entry Names

**Pattern:** `{entity}_{state}_{capability}_{role}`

Examples:
- `post_released_read_all` - Posts in released state, read capability, all roles
- `post_draft_update_active` - Posts in draft state, update capability, active roles
- `project_owner_manage` - Projects in any state, manage capability, owner role

### State Keywords

| Keyword | Meaning |
|---------|---------|
| `released` | Only released entities |
| `draft` | Only draft entities |
| `new` | Only new entities |
| `all` | All states (use sparingly!) |

### Role Keywords

| Keyword | Meaning |
|---------|---------|
| `all` | All roles including anonym |
| `auth` | Authenticated users (partner+participant+member+owner) |
| `active` | Active roles (participant+member+owner) |
| `owner` | Record owner only |
| `member` | Member role only |

### Capability Keywords

| Keyword | Meaning |
|---------|---------|
| `read` | Can read/view |
| `update` | Can edit |
| `create` | Can create new |
| `manage` | Can change status, delete, archive |
| `full` | All capabilities |

---

## Best Practices

### 1. AllRole Convention (Shortcut for Non-Anonymous)

When designing a new capabilities matrix, **1-3 AllRole capabilities** at the beginning are acceptable:

✅ **Allowed:**
```
POST_ALLROLE_READ_RELEASED   // All logged-in users can read released posts
POST_ALLROLE_COMMENT_REVIEW  // All logged-in users can comment on review+ posts
```

**Rules for AllRole:**
- Must be prefixed with `AllRole` (e.g., `POST_ALLROLE_*`)
- **Excludes anonymous** - anonym always requires explicit declaration
- Maximum 1-3 per entity, for commonly shared capabilities
- Useful when prototyping, can be refined to per-role rules later

❌ **Forbidden:**
```
POST_MEMBER_UPDATE  // Named as member-specific but configured for all roles
```

> If a capability applies to all roles, NAME it as AllRole. Don't mislead with role-specific naming.

### 2. Prefer Specific States Over `all`

❌ **Bad:** `project_member_update` with `state=all`
- Members can see NEW projects before owner is ready

✅ **Good:** Separate entries per state
```
project_member_read_draft    (state=draft)
project_member_read_released (state=released)
```

### 3. Think in Two Levels

Always consider:
1. **Project-level access:** Can user access the project at all?
2. **Entity-level access:** Can user access this specific post/image within?

⚠️ In v0.2-v0.4, entity-level is implemented. Project-level containment is v0.5.

### 4. Use r-flags for Entity-Level Visibility

Posts and images have `r_owner`, `r_member`, `r_partner`, `r_participant` columns.
These are the final word on entity visibility within a project.

### 5. Owner Means Record Owner

The `owner` role in capabilities = whoever created the record.
Project-owner gets elevated caps via `member` role + explicit manage entries.

### 6. Explicit Over Inherited

No capability inheritance. If you want `read + list + share`, set all three bits.
The CapabilitiesEditor UI makes this easy.

### 7. Anonymous Always Explicit

Never assume anonymous access. Always declare it explicitly:
```
POST_ANON_READ_RELEASED  // Explicit: anon can read released posts
```

---

## Troubleshooting

### "User can see entities they shouldn't"

1. Check the `r_*` flags on the entity
2. Check `state=all` rules that might be too permissive
3. Remember: Project status doesn't filter entities yet (v0.5)

### "User can't see entities they should"

1. Verify user's configrole in project_members
2. Check if matching sysreg_config entry exists
3. Check entity's status matches a config rule

### "Capabilities not updating"

1. Triggers fire on INSERT or UPDATE OF status
2. Check `compute_role_visibility()` function
3. Verify sysreg_config entries are correct

### Debug Query

```sql
-- Check what a user can access in a project
SELECT 
    pm.user_id,
    u.username,
    pm.configrole,
    CASE 
        WHEN pm.configrole & 8 > 0 THEN 'member'
        WHEN pm.configrole & 4 > 0 THEN 'participant'
        WHEN pm.configrole & 2 > 0 THEN 'partner'
    END as role_name,
    p.domaincode,
    p.status as project_status
FROM project_members pm
JOIN users u ON pm.user_id = u.id
JOIN projects p ON pm.project_id = p.id
WHERE p.domaincode = 'opus1';
```

---

## Tools

### CapabilitiesEditor.vue

Visual editor for sysreg_config entries.

**Location:** `/src/components/sysreg/CapabilitiesEditor.vue`

**Features:**
- Filter by entity, state, project type
- Visual bit editing with dropdowns
- Live value preview (decimal + hex)
- Role checkboxes

**Access:** Admin panel at `/admin/capabilities` (when implemented)

### Decode Capability Script

```typescript
// Save as check-caps.ts, run with: npx tsx check-caps.ts
import { db } from './server/database/init'

const BITS = {
    ENTITY_POST: 32, ENTITY_PROJECT: 8, ENTITY_IMAGE: 48,
    STATE_NEW: 256, STATE_DEMO: 512, STATE_DRAFT: 768, STATE_RELEASED: 1280,
    CAP_READ: 2048, CAP_UPDATE: 16384, CAP_CREATE: 131072, CAP_MANAGE: 1048576,
    CAP_LIST: 8388608, CAP_SHARE: 16777216,
    ROLE_ANONYM: 33554432, ROLE_PARTNER: 67108864, 
    ROLE_PARTICIPANT: 134217728, ROLE_MEMBER: 268435456, ROLE_OWNER: 536870912
}

function decode(value: number) {
    const entity = value & (0b11111 << 3)
    const state = value & (0b111 << 8)
    const roles = []
    if (value & BITS.ROLE_OWNER) roles.push('owner')
    if (value & BITS.ROLE_MEMBER) roles.push('member')
    if (value & BITS.ROLE_PARTICIPANT) roles.push('participant')
    if (value & BITS.ROLE_PARTNER) roles.push('partner')
    if (value & BITS.ROLE_ANONYM) roles.push('anonym')
    
    const caps = []
    if (value & BITS.CAP_READ) caps.push('read')
    if (value & BITS.CAP_UPDATE) caps.push('update')
    if (value & BITS.CAP_CREATE) caps.push('create')
    if (value & BITS.CAP_MANAGE) caps.push('manage')
    if (value & BITS.CAP_LIST) caps.push('list')
    if (value & BITS.CAP_SHARE) caps.push('share')
    
    return { entity, state, roles: roles.join(','), caps: caps.join(',') }
}

async function main() {
    await new Promise(r => setTimeout(r, 1000))
    const configs = await db.all(`SELECT name, value FROM sysreg_config ORDER BY name`)
    for (const c of configs) {
        const d = decode(c.value)
        console.log(`${c.name}: entity=${d.entity}, state=${d.state}, roles=[${d.roles}], caps=[${d.caps}]`)
    }
    process.exit(0)
}
main()
```

---

## References

- [AUTH-SYSTEM-SPEC](../../chat/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md) - Full specification
- [Migration 044](../../server/database/migrations/044_capabilities_matrix.ts) - Seed data
- [Migration 045-047](../../server/database/migrations/) - Role visibility triggers
- [Deferred Tasks](../../chat/tasks/2025-12-10-DEFERRED-from-Projectlogin_Workflow.md) - Project containment (v0.5)

---

## Appendix: Proposed Capability Matrix Improvements

### Issue 1: `project_member_update` is too permissive

**Current:** `state=all` - Members can see NEW projects

**Proposed Fix:**
```typescript
// Replace project_member_update with state-specific entries
{
    name: 'project_member_read_draft',
    value: PROJECT_ALL | ENTITY_PROJECT | STATE_DRAFT | CAP_READ | CAP_UPDATE | CAP_LIST | ROLE_MEMBER,
    description: 'Members can read/update draft projects'
},
{
    name: 'project_member_read_released', 
    value: PROJECT_ALL | ENTITY_PROJECT | STATE_RELEASED | CAP_READ | CAP_LIST | ROLE_MEMBER,
    description: 'Members can read released projects'
}
```

### Issue 2: No explicit `new` state rules for projects

**Proposed:**
```typescript
{
    name: 'project_new_owner_only',
    value: PROJECT_ALL | ENTITY_PROJECT | STATE_NEW | CAP_READ | CAP_UPDATE | CAP_MANAGE | CAP_LIST | ROLE_OWNER,
    description: 'Only owner can access new projects'
}
```

This ensures projects in `new` status are truly owner-only until activated.

---

*Last updated: December 3, 2025*
