# Capabilities System: Developer Howto

**Created:** December 3, 2025  
**Updated:** December 5, 2025  
**Sprint:** Projectlogin Workflow (Dec 1-9, 2025)  
**Purpose:** Deep technical guide for working with the capabilities matrix

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Test Environment](#test-environment)
3. [Bit Layout Cheat Sheet](#bit-layout-cheat-sheet)
4. [Transitions & taglogic](#transitions--taglogic)
5. [CapabilitiesEditor Component](#capabilitieseditor-component)
6. [Current Capabilities Matrix](#current-capabilities-matrix)
7. [Common Scenarios with Examples](#common-scenarios-with-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Tools](#tools)

::: tip Naming Conventions
For detailed naming conventions (entity prefixes, relations, capability patterns, transition naming), see **[CAPABILITIES_NAMING_CONVENTION.md](../../devdocs/CAPABILITIES_NAMING_CONVENTION.md)**.
:::

---

## Quick Reference

### Status Values (Migration 040)
```
new       = 1     (stepper mode)
demo      = 8     (stepper mode)
draft     = 64    (dashboard mode)
review    = 256   (awaiting approval)
confirmed = 512   (legacy)
released  = 4096  (published)
```

### Role Bits (bits 25-29)
```
anonym      = 1 << 25 = 33554432
partner     = 1 << 26 = 67108864
participant = 1 << 27 = 134217728
member      = 1 << 28 = 268435456
creator     = 1 << 29 = 536870912   # renamed from 'owner'
```

### Configrole Values (project_members.configrole)
```
partner     = 2  (bit 1)
participant = 4  (bit 2)
member      = 8  (bit 3)
p_owner     = (determined by projects.creator_id, not configrole)
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
      │   │   │   │   │   │   │   │   │   │      │      │      │      └── FROM State (3 bits)
      │   │   │   │   │   │   │   │   │   │      │      │      └── Read cap (3 bits)
      │   │   │   │   │   │   │   │   │   │      │      └── Update cap (3 bits)
      │   │   │   │   │   │   │   │   │   │      └── TO State (3 bits) ← transitions!
      │   │   │   │   │   │   │   │   │   └── Manage cap (3 bits)
      │   │   │   │   │   │   │   │   └── List cap
      │   │   │   │   │   │   │   └── Share cap
      │   │   │   │   │   │   └── Role: anonym
      │   │   │   │   │   └── Role: partner
      │   │   │   │   └── Role: participant
      │   │   │   └── Role: member
      │   │   └── Role: creator
      │   └── Reserved
      └── Admin (sign bit, v0.5)
```

::: warning Bits 17-19: TO State (not Create)
As of Dec 5, 2025, bits 17-19 store the **transition target state** instead of create permissions. A non-zero TO State indicates this config entry is a **transition** (status change), not a simple capability.
:::

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

### State Codes (bits 8-10 for FROM, bits 17-19 for TO)

| Binary | Value | State |
|--------|-------|-------|
| 000 | 0 | all |
| 001 | 1 | new |
| 010 | 2 | demo |
| 011 | 3 | draft |
| 100 | 4 | review |
| 101 | 5 | released |
| 110 | 6 | archived |
| 111 | 7 | trash |

---

## Transitions & taglogic

### What Makes an Entry a Transition?

A config entry is a **transition** when bits 17-19 (TO State) are non-zero:

```typescript
const TO_STATE_MASK = 0b111 << 17
const isTransition = (value & TO_STATE_MASK) !== 0
```

### taglogic Field

The `taglogic` field determines how transitions appear in the UI:

| taglogic | Meaning | UI Display |
|----------|---------|------------|
| `category` | Primary transition | Large prominent button |
| `subcategory` | Alternative transition | Smaller secondary buttons |
| `toggle` | Simple capability (not a transition) | N/A |

### Parent-Child Relationships

Subcategories link to their parent category via `parent_bit` (stores the **id** of the parent config entry):

```
From DRAFT state:
├── "Zur Prüfung einreichen" → REVIEW  [taglogic: category, id: 42]
├── "← Demo"                 → DEMO    [taglogic: subcategory, parent_bit: 42]
└── "Trash"                  → TRASH   [taglogic: subcategory, parent_bit: 42]
```

**In the StatusEditor UI**, this renders as:

```
┌─────────────────────────────────────────┐
│ 🔍 Zur Prüfung einreichen               │  ← PRIMARY (category)
└─────────────────────────────────────────┘

Weitere Optionen:
┌─────────┐  ┌─────────┐
│ ← Demo  │  │ 🗑 Trash │                    ← ALTERNATIVES (subcategory)
└─────────┘  └─────────┘
```

---

## CapabilitiesEditor Component

**Location:** `src/components/sysreg/CapabilitiesEditor.vue`

The CapabilitiesEditor is a visual editor for `sysreg_config` entries, designed for admins to manage the capabilities matrix without writing SQL.

### Features

| Feature | Description |
|---------|-------------|
| **Filter by context** | Entity, FROM state, project type |
| **Visual bit editing** | Dropdowns for each bit group |
| **Live value preview** | Decimal + hex display |
| **Role checkboxes** | Multi-select for relation flags |
| **Transition support** | TO State dropdown for transitions |
| **taglogic selector** | Toggle / Category / Subcategory |
| **Parent linking** | Dropdown to link subcategories to their parent |

### Table Columns

| Column | Description |
|--------|-------------|
| **Name** | Entry identifier + description |
| **Entity** | Target entity type |
| **State** | FROM state (workflow context) |
| **Read/Update/Manage** | Capability levels |
| **Transition** | TO State (shows "→ Review" for transitions) |
| **List/Share** | Boolean capabilities |
| **Type** | taglogic display: 🔵 Primary / 🔹 Alt / ⚪ Toggle |
| **Roles** | Relation badges |

### Creating a Transition Entry

1. Set **Entity** and **FROM State** (context)
2. Set **Entry Type** to `Category (primary)` or `Subcategory (alternative)`
3. For subcategories: select **Parent Category** (filters by same FROM state)
4. Set **→ To-State** to the target status
5. Set **Manage** capability (typically `manage > status`)
6. Select **Roles** who can perform this transition

### Key Implementation Details

```typescript
// Available parent categories computed (only for subcategories)
const availableParentCategories = computed(() => {
    if (editForm.value.taglogic !== 'subcategory') return []
    return entries.value.filter(e => 
        e.taglogic === 'category' && 
        getStateValue(e.value) === editForm.value.state  // same FROM state
    )
})

// Type column shows parent's target for subcategories
function getTaglogicLabel(entry: ConfigEntry): string {
    if (entry.taglogic === 'subcategory' && entry.parent_bit) {
        const parent = entries.value.find(e => e.id === entry.parent_bit)
        if (parent) return `🔹 Alt (${getToStateLabel(parent.value)})`
    }
    // ...
}
```

### API Integration

The editor uses these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sysreg/all` | GET | Load all config entries |
| `/api/sysreg` | POST | Create new entry |
| `/api/sysreg/[id]` | PUT | Update existing entry |
| `/api/sysreg/[id]` | DELETE | Delete entry |

### Payload Structure

```typescript
const payload = {
    value: computedValue,           // 32-bit packed integer
    name: 'post_transition_...',    // unique identifier
    description: 'Human readable',
    tagfamily: 'config',
    taglogic: 'category',           // or 'subcategory' or 'toggle'
    parent_bit: 42,                 // id of parent (subcategories only)
    is_default: false
}
```

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

## Best Practices

::: tip Full Naming Conventions
See **[CAPABILITIES_NAMING_CONVENTION.md](../../devdocs/CAPABILITIES_NAMING_CONVENTION.md)** for complete naming patterns, transition naming, and entity prefixes.
:::

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

See [CapabilitiesEditor Component](#capabilitieseditor-component) section above for full documentation.

**Quick access:** Admin panel at `/admin/sysreg` → Capabilities tab

### Decode Capability Script

```typescript
// Save as check-caps.ts, run with: npx tsx check-caps.ts
import { db } from './server/database/init'

const BITS = {
    ENTITY_POST: 32, ENTITY_PROJECT: 8, ENTITY_IMAGE: 48,
    STATE_NEW: 1, STATE_DEMO: 2, STATE_DRAFT: 3, STATE_REVIEW: 4, STATE_RELEASED: 5,
    CAP_READ: 2048, CAP_UPDATE: 16384, CAP_MANAGE: 1048576,
    CAP_LIST: 8388608, CAP_SHARE: 16777216,
    ROLE_ANONYM: 33554432, ROLE_PARTNER: 67108864, 
    ROLE_PARTICIPANT: 134217728, ROLE_MEMBER: 268435456, ROLE_CREATOR: 536870912
}

function decode(value: number) {
    const entity = (value >> 3) & 0b11111
    const fromState = (value >> 8) & 0b111
    const toState = (value >> 17) & 0b111
    
    const roles = []
    if (value & BITS.ROLE_CREATOR) roles.push('creator')
    if (value & BITS.ROLE_MEMBER) roles.push('member')
    if (value & BITS.ROLE_PARTICIPANT) roles.push('participant')
    if (value & BITS.ROLE_PARTNER) roles.push('partner')
    if (value & BITS.ROLE_ANONYM) roles.push('anonym')
    
    const caps = []
    if (value & BITS.CAP_READ) caps.push('read')
    if (value & BITS.CAP_UPDATE) caps.push('update')
    if (value & BITS.CAP_MANAGE) caps.push('manage')
    if (value & BITS.CAP_LIST) caps.push('list')
    if (value & BITS.CAP_SHARE) caps.push('share')
    
    const isTransition = toState !== 0
    return { entity, fromState, toState, isTransition, roles: roles.join(','), caps: caps.join(',') }
}

async function main() {
    await new Promise(r => setTimeout(r, 1000))
    const configs = await db.all(`SELECT name, value, taglogic FROM sysreg_config ORDER BY name`)
    for (const c of configs) {
        const d = decode(c.value)
        const type = d.isTransition ? `TRANSITION ${d.fromState}→${d.toState}` : `CAP state=${d.fromState}`
        console.log(`${c.name} [${c.taglogic}]: ${type}, roles=[${d.roles}], caps=[${d.caps}]`)
    }
    process.exit(0)
}
main()
```

---

## References

- [CAPABILITIES_NAMING_CONVENTION.md](../../devdocs/CAPABILITIES_NAMING_CONVENTION.md) - Naming patterns and conventions
- [STATUS_EDITOR_GUIDE.md](../../devdocs/STATUS_EDITOR_GUIDE.md) - StatusEditor v2 documentation
- [Migration 051](../../server/database/migrations/051_capabilities_matrix_v2.ts) - Capabilities matrix v2
- [Migration 052-054](../../server/database/migrations/) - Trigger fixes for creator rename

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
    name: 'project_new_creator_only',
    value: PROJECT_ALL | ENTITY_PROJECT | STATE_NEW | CAP_READ | CAP_UPDATE | CAP_MANAGE | CAP_LIST | ROLE_CREATOR,
    description: 'Only creator can access new projects'
}
```

This ensures projects in `new` status are truly creator-only until activated.

---

*Last updated: December 5, 2025*
