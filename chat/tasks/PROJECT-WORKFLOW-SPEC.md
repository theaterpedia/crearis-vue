# Project Workflow Specification

**Version:** v0.4  
**Last Updated:** December 5, 2025  
**Status:** Active

---

## Overview

This spec defines the project lifecycle from creation (`new`) through publishing (`released`). It covers:
- State transitions and skip conditions
- Activation criteria (rule-checking)
- UI layout switching (stepper ↔ dashboard)
- Relation-based access per state
- The special role of projects as container entities

::: tip Naming Conventions
This spec follows [CAPABILITIES_NAMING_CONVENTION.md](../../docs/devdocs/CAPABILITIES_NAMING_CONVENTION.md) for all terminology.
:::

---

## The Special Role of Projects

### Projects as Container Entities

Unlike other entities (posts, images, events), projects are **container entities**:

1. **All entities belong to a project** - Every entity table has `project_id NOT NULL`
2. **Project determines access context** - Entity-level permissions are scoped by project membership
3. **Two-level access check** - User must have project access AND entity access
4. **p_owner is last-responsible** - Every entity knows its project's owner (e.g., for event payment responsibility)

### How Capabilities Work: Project → Entity

```
┌─────────────────────────────────────────────────────────────────┐
│ USER REQUEST: "Can I edit this post?"                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Step 1: Determine PROJECT relation                              │
│   └─> Check project_members.configrole for user                 │
│   └─> Check projects.owner_id (is user p_owner?)                │
│   └─> Result: anonym | partner | participant | member |         │
│                p_creator | p_owner                              │
│                                                                 │
│ Step 2: Determine ENTITY relation                               │
│   └─> Check entity.creator_id (is user creator?)                │
│   └─> Result: creator (yes) or inherit project relation         │
│                                                                 │
│ Step 3: Query sysreg_config                                     │
│   └─> Match: entity + from_state + relation                     │
│   └─> Return: capabilities + transitions                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### p_owner vs p_creator

| Aspect | p_owner | p_creator |
|--------|---------|-----------|
| **Storage** | `projects.owner_id` | `project_members.configrole` with creator bit |
| **Cardinality** | Single (always one) | Multiple (0-n co-creators) |
| **Nature** | Fixed role, "admin" | Relation, "co-owner" |
| **Consent** | Final authority | Needs p_owner consent for critical ops |
| **Responsibility** | Last-responsible (payments, legal) | Collaborative responsibility |

**Example:** Event payment flow
- Event belongs to project → `event.project_id`
- Project has owner → `projects.owner_id`
- p_owner is responsible for event payments

---

## Project States

| State | Bit Value | Layout | Description |
|-------|-----------|--------|-------------|
| `new` | 1 | Stepper | Just created, owner configuring |
| `demo` | 8 | Stepper | Preview mode, limited read access |
| `draft` | 64 | Dashboard | Work in progress, full team collaboration |
| `confirmed` | 512 | Dashboard | Approved, pending release |
| `released` | 4096 | Dashboard | Published, publicly accessible |
| `archived` | 32768 | Dashboard | Historical, read-only |
| `trash` | 65536 | - | Soft deleted |

### Layout Mapping

```
new      → Stepper
demo     → Stepper  
draft+   → Dashboard
```

Simple rule: `status >= 64` → Dashboard

---

## State Transitions

### Standard Flow

```
new → demo → draft → confirmed → released → archived
```

### Allowed Skips

| From | Can Skip To | Condition |
|------|-------------|-----------|
| `new` | `draft` | Team ≤3 people + activation criteria met |
| `new` | `confirmed` | Team ≤3 people + activation criteria met |
| `demo` | `confirmed` | Team ≤3 people |

> **Key Rule:** p_owner can skip `demo` if team is small (≤3 members+owners).

---

## Activation Criteria (ESSENTIAL 2)

Before a project can transition from `new`, it must meet criteria based on project type.

### Criteria by Project Type

| Project Type | Required for `demo` | Required for `draft` | Required for `confirmed` |
|--------------|---------------------|----------------------|--------------------------|
| `topic` | ≥1 post + cover image | (same) | (same) + team ≤3 to skip |
| `project` | ≥1 event + cover image | (same) | (same) + team ≤3 to skip |
| `regio` | ≥1 member + ≥1 associated project + cover image | (same) | (same) + team ≤3 to skip |
| `special` | cover image | (same) | (same) |

### Rule Definitions

```typescript
// useProjectActivation.ts (v0.4)

interface ActivationRule {
  id: string
  label: string
  check: (project: Project, entities: EntityCounts) => boolean
  appliesTo: ProjectType[]
}

const ACTIVATION_RULES: ActivationRule[] = [
  {
    id: 'cover-image',
    label: 'Project must have a cover image',
    check: (p) => !!p.image_id,
    appliesTo: ['topic', 'project', 'regio', 'special']
  },
  {
    id: 'topic-has-post',
    label: 'Topic project must have at least 1 post',
    check: (p, e) => e.posts >= 1,
    appliesTo: ['topic']
  },
  {
    id: 'project-has-event',
    label: 'Event project must have at least 1 event',
    check: (p, e) => e.events >= 1,
    appliesTo: ['project']
  },
  {
    id: 'regio-has-member',
    label: 'Regio project must have at least 1 member',
    check: (p, e) => e.members >= 1,
    appliesTo: ['regio']
  },
  {
    id: 'regio-has-association',
    label: 'Regio project must have at least 1 associated project',
    check: (p, e) => e.associatedProjects >= 1,
    appliesTo: ['regio']
  }
]

// Skip rule (applies to all types)
const SKIP_CONFIRMED_RULE: ActivationRule = {
  id: 'small-team-skip',
  label: 'Project may skip to confirmed if team ≤3 people',
  check: (p, e) => e.teamSize <= 3,
  appliesTo: ['topic', 'project', 'regio', 'special']
}
```

### UI Behavior (ESSENTIAL 2a-2c)

| State | Panel Shows | Button State |
|-------|-------------|--------------|
| Criteria not met | Missing items listed, red indicators | Disabled |
| Criteria met | All checks green, summary | Enabled |
| v1.1 future | "Create tasks to fix" option | Enabled (creates tasks) |

---

## Activation Panel UI

The Activation Panel is used for **ALL** project state transitions (not just initial activation). It fills **60% width × 70% height** of the screen and provides a consistent experience for:

- Initial activation (new → demo/draft)
- Workflow progression (draft → confirmed → released)
- Archive/restore operations
- Trash operations (p_owner only)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🚀 Project Activation                                          [×]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Current State: ● DRAFT                                                 │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Choose target state:                                                   │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  ○ Demo     │  │  ● Confirmed│  │  ○ Released │                      │
│  │  (zurück)   │  │  (weiter)   │  │  (überspr.) │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Readiness Checklist:                                                   │
│                                                                         │
│  ✅ Cover image uploaded                                                │
│  ✅ At least 1 post created                                             │
│  ✅ Team size ≤3 (skip allowed)                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Weitere Optionen:                                                      │
│  ┌─────────┐  ┌─────────┐                                               │
│  │ ← Demo  │  │ 🗑 Trash │  ← only for p_owner                          │
│  └─────────┘  └─────────┘                                               │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                              [ Activate to Confirmed ]                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Panel Button States

| State | Panel Shows | Button State |
|-------|-------------|--------------|
| Criteria not met | Missing items listed, red indicators | Disabled |
| Criteria met | All checks green, summary | Enabled |
| v1.1 future | "Create tasks to fix" option | Enabled (creates tasks) |

---

## Relation Access Matrix (ESSENTIAL 3)

### Per Project State

| Relation | `new` | `demo` | `draft` | `confirmed` | `released` |
|----------|-------|--------|---------|-------------|------------|
| **p_owner** | RW+config | RW+config | RW+config | RW+config | RW+config |
| **p_creator** | RW+config | RW | RW+config | RW | R+default |
| **Member** | - | R | RW+create | RW+create | RW+create |
| **Participant** | - | - | R (limited) | R | R |
| **Partner** | - | - | - | R | R |
| **Anonymous** | - | - | - | - | R (public only) |

**Legend:**
- R = Read
- RW = Read + Write (edit existing)
- RW+create = Read + Write + Create new entities
- RW+config = Full access including configuration panels
- R (limited) = Read headline+teaser only
- R+default = Read with default panel mode (no config access)

::: warning Elevated Capabilities for Topic/Regio
On Project Types `topic` and `regio`, **Participants have elevated capabilities**: they can `update > comment` (add comments to posts/content).
:::

### Dashboard Panel Detail Modes

Panels receive a `detail` prop that controls what's visible:

| Mode | Description | Shown to |
|------|-------------|----------|
| `demo` | Minimal preview, stepper content | All in demo state |
| `draft` | Working view, entity folders | Members in draft; p_creator in confirmed |
| `default` | Released view, no config options | Members/participants in confirmed+; p_creator in released |
| `config` | Full access, settings, critical ops | p_owner always; p_creator in new/draft |

**Panel Mode by State and Relation:**

| Project State | p_owner | p_creator | member |
|---------------|---------|-----------|--------|
| `new` | config | config | - |
| `demo` | demo | demo | demo |
| `draft` | config | config | draft |
| `confirmed` | config | draft | default |
| `released` | config | default | default |

---

## p_owner vs p_creator: Capabilities & Transitions

### Capability Differences

| Capability | p_owner | p_creator | Notes |
|------------|---------|-----------|-------|
| `project_manage_full` | ✅ | ❌ | Delete project, transfer ownership |
| `project_manage_members` | ✅ | ✅ | Add/remove participants, members |
| `project_manage_creators` | ✅ | ❌ | Promote members to p_creator |
| `project_update_config` | ✅ | ✅* | *Only in new/draft states |
| `project_read_analytics` | ✅ | ✅ | View project statistics |

### Transition Differences

| Transition | p_owner | p_creator | Notes |
|------------|---------|-----------|-------|
| `project_transition_any_trash` | ✅ | ❌ | Critical: only owner can trash |
| `project_transition_trash_draft` | ✅ | ❌ | Critical: only owner can restore |
| `project_transition_draft_confirmed` | ✅ | ✅ | Normal workflow |
| `project_transition_confirmed_released` | ✅ | ✅ | Normal workflow |
| `project_transition_released_archived` | ✅ | ❌ | Critical: archiving is owner-only |

### Example sysreg_config Entries

```typescript
// Capabilities
{
  name: 'project_p_owner_manage_full',
  // entity=project, state=all, manage=full, relation=p_owner
  value: 0b00100000_00010100_00000000_00001000, // simplified
  taglogic: 'toggle',
  description: 'Project owner has full management capabilities'
},
{
  name: 'project_p_creator_manage_members',
  // entity=project, state=all, manage=status, relation=p_creator
  value: 0b00010000_00010010_00000000_00001000,
  taglogic: 'toggle', 
  description: 'Project creators can manage members (not creators)'
},

// Transitions - p_owner only
{
  name: 'project_transition_any_trash_p_owner',
  // entity=project, from=all, to=trash, manage=delete, relation=p_owner
  taglogic: 'subcategory',
  description: 'Only project owner can move to trash'
},
{
  name: 'project_transition_released_archived_p_owner',
  // entity=project, from=released, to=archived, manage=status, relation=p_owner
  taglogic: 'subcategory',
  description: 'Only project owner can archive'
},

// Transitions - both p_owner and p_creator
{
  name: 'project_transition_draft_confirmed_p_owner',
  taglogic: 'category',
  description: 'Owner advances draft to confirmed (primary)'
},
{
  name: 'project_transition_draft_confirmed_p_creator',
  taglogic: 'category', 
  parent_bit: null, // primary for creator too
  description: 'Creator can also advance draft to confirmed'
}
```

---

## Test Scenarios

### Test Projects

| Project | Type | Owner | Default Status |
|---------|------|-------|----------------|
| opus1 | topic | Hans Opus (id=8) | new |
| opus2 | project | Rosa Königer (id=18) | released |
| opus3 | regio | Kathrin Opus (id=9) | draft |

### Test Users for opus1

| User | Email | Relation | Password |
|------|-------|----------|----------|
| Hans Opus | hans.opus@theaterpedia.org | p_owner | opus1hans |
| Nina Opus | nina.opus@theaterpedia.org | p_creator | opus1nina |
| Rosa Opus | rosa.opus@theaterpedia.org | member | opus1rosa |
| Marc Opus | marc.opus@theaterpedia.org | participant | opus1marc |

### Test User for opus3

| User | Email | Relation | Password |
|------|-------|----------|----------|
| Kathrin Opus | kathrin.opus@theaterpedia.org | p_owner | opus1kathrin |

### Scenario: Topic Project Activation

```gherkin
Feature: Project Activation (Topic)

  Background:
    Given Hans is logged in as p_owner of opus1
    And opus1 is a topic project in state 'new'

  Scenario: Cannot activate without cover image
    Given opus1 has no cover image
    When Hans views the activation panel
    Then the "Activate" button is disabled
    And "Cover image required" is shown in red

  Scenario: Cannot activate without post
    Given opus1 has a cover image
    And opus1 has 0 posts
    When Hans views the activation panel
    Then the "Activate" button is disabled
    And "At least 1 post required" is shown in red

  Scenario: Can activate to demo with 1 post + cover
    Given opus1 has a cover image
    And opus1 has 1 post
    When Hans views the activation panel
    Then the "Activate" button is enabled
    And all checklist items are green

  Scenario: Can skip to draft with small team
    Given opus1 meets all activation criteria
    And opus1 has 2 team members (Hans + Nina)
    When Hans selects "Draft" as target state
    Then the "Activate to Draft" button is enabled

  Scenario: Cannot skip to confirmed with large team
    Given opus1 meets all activation criteria  
    And opus1 has 4 team members
    When Hans tries to select "Confirmed" as target
    Then "Confirmed" option is disabled
    And tooltip shows "Team size exceeds 3"
```

### Scenario: Stepper to Dashboard Transition

```gherkin
Feature: Layout Transition

  Scenario: Stay on stepper in demo state
    Given opus1 is in state 'demo'
    When Rosa (member) opens opus1
    Then she sees the Stepper layout
    And content is read-only
    And she can comment on the Comments step

  Scenario: Switch to dashboard on draft
    Given opus1 is in state 'demo'
    When Hans activates opus1 to 'draft'
    Then the UI switches to Dashboard layout
    And Rosa sees full entity folders

  Scenario: Direct to dashboard when skipping demo
    Given opus1 is in state 'new'
    And opus1 meets criteria for draft
    When Hans activates directly to 'draft'
    Then the UI shows Dashboard layout immediately
```

### Scenario: p_owner vs p_creator Permissions

```gherkin
Feature: Relation-based Permissions

  Background:
    Given Hans is p_owner of opus1
    And Nina is p_creator of opus1

  Scenario: p_creator cannot trash project
    Given opus1 is in state 'draft'
    When Nina views the activation panel
    Then the "Trash" button is NOT visible
    
  Scenario: p_owner can trash project
    Given opus1 is in state 'draft'
    When Hans views the activation panel
    Then the "Trash" button IS visible
    And Hans can move opus1 to trash
    
  Scenario: p_creator can still manage members
    Given opus1 is in state 'draft'
    When Nina opens project settings
    Then she CAN add/remove participants and members
    But she CANNOT promote members to p_creator
    
  Scenario: Panel detail mode differs by state
    Given opus1 is in state 'confirmed'
    When Hans opens the dashboard
    Then he sees detail='config'
    When Nina opens the dashboard
    Then she sees detail='draft'
    When Rosa opens the dashboard
    Then she sees detail='default'
```

---

## Implementation Checklist

### v0.4 (December 2025) - Current

- [ ] `useProjectActivation` composable
  - [ ] Rule definitions
  - [ ] Criteria checking
  - [ ] Target state validation
- [ ] Activation panel component (60% × 70%)
  - [ ] State selector (radio buttons)
  - [ ] Checklist display
  - [ ] Enable/disable button
  - [ ] Trash button (p_owner only)
- [ ] Layout switching logic
  - [ ] Stepper for `new`/`demo`
  - [ ] Dashboard for `draft+`
- [ ] API: `PATCH /api/projects/:id/activate`
- [ ] Panel detail mode handling
  - [ ] demo | draft | default | config modes
  - [ ] Mode by state+relation matrix

### v0.5 (January 2025)

- [ ] Member read access from `demo`
- [ ] Member write access from `draft`
- [ ] Comment system on stepper (demo state)
- [ ] Elevated capabilities for topic/regio participants

### v0.6 (Deferred)

- [ ] `write-nocreate` project config
- [ ] `read-summary` for participants
- [ ] Task generation from failed criteria (v1.1)

---

## Related Specs

- [Posts Workflow Spec](./POSTS-WORKFLOW-SPEC.md) - Entity states within projects (review concept)
- [Capabilities Howto](../../docs/dev/sysreg/capabilities-howto.md) - Relation system reference
- [Auth System Spec](./2025-12-01-AUTH-SYSTEM-SPEC.md) - Login and session handling

