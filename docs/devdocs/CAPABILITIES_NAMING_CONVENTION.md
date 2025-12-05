# Capabilities Naming Convention v1

> **Status**: Active Convention  
> **Created**: December 5, 2025  
> **Authors**: Opus Code Automation + Human  
> **Purpose**: Crystal-clear naming for entities, relations, capabilities, and transitions

---

## Core Principle

**Explicit beats implicit.** Every name should tell Opus exactly what to build without ambiguity.

---

## 1. Entity Prefixes

When a term can belong to multiple contexts, use prefixes:

| Prefix | Context | Example |
|--------|---------|---------|
| (none) | Project (default) | `member`, `participant` |
| `e_` | Event | `e_participant`, `e_member` |
| `p_` | Project (explicit) | `p_owner` (when needed for clarity) |
| `r_` | Visibility/Row-level | `r_member`, `r_creator` |

### Why no prefix for project?
Project is the **dominant entity** in this system. All other entities (posts, images, events) belong to projects. Unprefixed terms = project context.

---

## 2. Relations (Who the user IS)

Relations describe the user's relationship to an entity or project.

### 2.1 Project Relations (unprefixed = default)

| Relation | Meaning | configrole bit |
|----------|---------|----------------|
| `anonym` | Not logged in | - |
| `partner` | Project partner | 2 |
| `participant` | Project participant | 4 |
| `member` | Project member (full access) | 8 |

### 2.2 Record Relations

| Relation | Meaning | Notes |
|----------|---------|-------|
| `creator` | Created this specific record | Replaces `owner` for posts/images |
| `p_owner` | Owns the parent project | FK lookup: `entity.project_id → projects.owner_sysmail` |

### 2.3 Event Relations (future)

| Relation | Meaning | Notes |
|----------|---------|-------|
| `e_participant` | Registered for this event | Event-scoped |
| `e_member` | Event team member | Event-scoped |

### 2.4 Relation Chaining

Relations can be chained to express derived permissions:

```
member > e_participant
```
= "Project member can become event participant"

```
p_owner > creator
```
= "Project owner inherits creator permissions"

---

## 3. Row-Level Visibility Columns (`r_` prefix)

Database columns that control **who can see** a record:

| Column | Type | Meaning |
|--------|------|---------|
| `r_anonym` | boolean | Visible to anonymous users |
| `r_partner` | boolean | Visible to project partners |
| `r_participant` | boolean | Visible to project participants |
| `r_member` | boolean | Visible to project members |
| `r_creator` | boolean | Visible to record creator only |

### Trigger Computation

These are computed by trigger functions based on `status` bits:

```sql
-- compute_role_visibility(status) returns:
-- r_anonym: scope_public enabled
-- r_partner: released OR scope_login
-- r_participant: review+ OR scope_project  
-- r_member: draft+ OR scope_team
-- r_creator: always true for creator
```

---

## 4. Capabilities (What the user CAN DO)

### 4.1 Capability Types

| Capability | Bit Range | Description |
|------------|-----------|-------------|
| `read` | 11-13 | View content |
| `update` | 14-16 | Edit content |
| `manage` | 20-22 | Status/delete operations |
| `list` | 23 | See in list views |
| `share` | 24 | Share with others |

### 4.2 Capability Naming Pattern

```
{entity}_{state}_{capability}_{relation}
```

Examples:
- `post_released_read_all` - Released posts readable by anyone
- `post_draft_update_member` - Draft posts editable by members  
- `post_creator_manage` - Creator can manage their posts

### 4.3 Transition Naming Pattern

**Primary transitions (category):**
```
{entity}_transition_{from}_{to}_{relation}
```

**Alternative transitions (subcategory):**
```
{entity}_alt_transition_{from}_{to}_{relation}
```

Examples:
- `post_transition_new_draft_creator` - Creator advances new→draft (primary)
- `post_transition_review_released_P_owner` - Project owner approves (primary)
- `post_alt_transition_review_draft_P_owner` - Project owner rejects (alternative)
- `post_alt_transition_any_trash` - Move to trash (alternative)

**Note**: `P_owner` in transition names = requires FK lookup to `projects.owner_sysmail`

### 4.4 Transition taglogic (Primary vs Alternative)

**Key insight**: Capabilities include status transitions. The `taglogic` field determines UI hierarchy.

| taglogic | Meaning | UI Display |
|----------|---------|------------|
| `category` | Primary/default transition | Large prominent button |
| `subcategory` | Alternative transition | Smaller secondary buttons |
| `toggle` | Boolean on/off (scopes) | Toggle switches |

**Example: User is CREATOR viewing a DRAFT post**

| Transition | taglogic | UI |
|------------|----------|-----|
| DRAFT → REVIEW | `category` | **[🔍 Zur Prüfung einreichen]** |
| DRAFT → TRASH | `subcategory` | `[🗑 Trash]` |

**Example: User is MEMBER (p_owner) viewing a REVIEW post**

| Transition | taglogic | UI |
|------------|----------|-----|
| REVIEW → RELEASED | `category` | **[🚀 Freigeben]** |
| REVIEW → DRAFT | `subcategory` | `[← Zurück]` |

**The same target status can have different taglogic in different contexts:**
- `NEW → DRAFT` is `category` (happy path for creator)
- `REVIEW → DRAFT` is `subcategory` (reject = alternative for p_owner)

### 4.5 Transition Data Structure

Each transition is ONE ROW in `sysreg_config`:

```
Bits 0-2:   Project type (0 = all)
Bits 3-7:   Entity (4 = post)
Bits 8-10:  FROM state
Bits 17-19: TO state (non-zero = this is a transition)
Bits 20-22: Manage capability
Bits 25-29: Relation flags
```

**Identifying transitions in code:**
```typescript
const TO_STATE_MASK = 0b111 << 17
const isTransition = (value & TO_STATE_MASK) !== 0
```

---

## 5. Status Workflow Bits (0-16)

| Bit Range | Value | Status | Description |
|-----------|-------|--------|-------------|
| 0-2 | 1 | `new` | Just created |
| 3-5 | 8 | `demo` | Preview mode |
| 6-8 | 64 | `draft` | In progress |
| 9-11 | 256 | `review` | Submitted for approval |
| 9-11 | 512 | `confirmed` | Approved (legacy) |
| 12-14 | 4096 | `released` | Published |
| 15 | 32768 | `archived` | Hidden from active lists |
| 16 | 65536 | `trash` | Marked for deletion |

---

## 6. Scope Bits (17-21)

Visibility toggles **independent of workflow status**:

| Bit | Value | Scope | Description |
|-----|-------|-------|-------------|
| 17 | 131072 | `scope_team` | Visible to team members |
| 18 | 262144 | `scope_login` | Visible to logged-in users |
| 19 | 524288 | `scope_project` | Visible within project |
| 20 | 1048576 | `scope_regio` | Visible in region |
| 21 | 2097152 | `scope_public` | Publicly visible |

### WORKFLOW_MASK

To extract workflow status from combined status+scope:
```typescript
const WORKFLOW_MASK = (1 << 17) - 1  // 0x1FFFF = bits 0-16
const workflowStatus = status & WORKFLOW_MASK
```

---

## 7. Config Entry Bit Layout (sysreg_config)

Full 32-bit layout for capability entries:

| Bits | Range | Purpose |
|------|-------|---------|
| 0-2 | 3 bits | Project type (0=all) |
| 3-7 | 5 bits | Entity type |
| 8-10 | 3 bits | From-state |
| 11-13 | 3 bits | Read capability |
| 14-16 | 3 bits | Update capability |
| 17-19 | 3 bits | To-state (transitions) |
| 20-22 | 3 bits | Manage capability |
| 23 | 1 bit | List capability |
| 24 | 1 bit | Share capability |
| 25-29 | 5 bits | Relation flags |

### Entity Codes

| Code | Entity |
|------|--------|
| 0 | all |
| 1 | project |
| 2 | user |
| 3 | page |
| 4 | post |
| 5 | event |
| 6 | image |
| 7 | location |

### Relation Bits (25-29)

| Bit | Relation |
|-----|----------|
| 25 | anonym |
| 26 | partner |
| 27 | participant |
| 28 | member |
| 29 | creator |

---

## 8. File Naming Conventions

### Composables

```
use{Entity}{Feature}.ts
```

Examples:
- `usePostStatusV2.ts` - Post status workflow
- `useCapabilities.ts` - Config-driven permissions
- `useImageCapabilities.ts` - Image-specific (future)

### Migration Files

```
{number}_{feature}_{detail}.ts
```

Examples:
- `051_capabilities_matrix_v2.ts` - Capabilities config
- `052_trigger_creator_rename.ts` - Trigger fixes

---

## 9. API Endpoint Patterns

### Capabilities API

```
GET /api/sysreg/capabilities?entity={entity}&status={status}&relation={relation}
```

Returns:
```json
{
  "entity": "post",
  "status": "draft",
  "relation": "member",
  "capabilities": {
    "read": true,
    "update": true,
    "manage": false,
    "list": true,
    "share": true
  },
  "transitions": ["review", "trash"]
}
```

---

## 10. Quick Reference Card

### For Opus: Building a new entity

1. **Define relations**: Who can interact? (anonym, partner, participant, member, creator)
2. **Define states**: What workflow statuses? (new, draft, review, released, etc.)
3. **Define capabilities per state+relation**: What can each relation do in each state?
4. **Define transitions**: Which state→state moves are allowed by which relations?
5. **Create migration**: Seed `sysreg_config` with capability entries
6. **Create composable**: `use{Entity}Capabilities.ts`
7. **Create visibility trigger**: Compute `r_*` columns from status bits

### Cheat Sheet

```
member = project member (always)
participant = project participant (always)
e_participant = event participant
creator = record creator (row owner)
p_owner = project owner (FK lookup)
r_member = visibility column
```

---

## Appendix A: Entity-Specific Specifications

### A.1 Posts (Implemented)

See: `server/database/migrations/051_capabilities_matrix_v2.ts`

**Relations**: anonym, partner, participant, member, creator, p_owner  
**States**: new, demo, draft, review, released, archived, trash  
**Trigger**: `trigger_posts_visibility` → computes `r_*` columns

### A.2 Projects (TODO)

**Relations**: anonym, partner, participant, member, p_owner  
**States**: TBD  
**Trigger**: TBD

### A.3 Images (TODO)

**Relations**: anonym, partner, participant, member, creator, p_owner  
**States**: new_image, draft, released  
**Trigger**: `trigger_images_visibility` (exists, needs creator fix)

### A.4 Events (Future)

**Relations**: anonym, partner, participant, member, e_participant, e_member  
**States**: TBD  
**Trigger**: TBD  
**Chaining**: `member > e_participant`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 5, 2025 | Initial version from StatusEditor debugging session |
