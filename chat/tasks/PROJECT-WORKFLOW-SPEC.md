# Project Workflow Specification

**Version:** v0.3-v0.5  
**Last Updated:** December 4, 2025  
**Status:** Draft

---

## Overview

This spec defines the project lifecycle from creation (`new`) through publishing (`released`). It covers:
- State transitions and skip conditions
- Activation criteria (rule-checking)
- UI layout switching (stepper ↔ dashboard)
- Role-based access per state

---

## Project States

| State | Bit Value | Layout | Description |
|-------|-----------|--------|-------------|
| `new` | 1 | Stepper | Just created, owner configuring |
| `demo` | 8 | Stepper | Preview mode, limited read access |
| `draft` | 64 | Dashboard | Work in progress, full team collaboration |
| `review` | 256 | Dashboard | Ready for approval |
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
new → demo → draft → review → confirmed → released → archived
```

### Allowed Skips

| From | Can Skip To | Condition |
|------|-------------|-----------|
| `new` | `draft` | Team ≤3 people + activation criteria met |
| `new` | `review` | Team ≤3 people + activation criteria met |
| `demo` | `review` | Team ≤3 people |

> **Key Rule:** Owner can skip `demo` and/or `review` if team is small (≤3 members+owners).

---

## Activation Criteria (ESSENTIAL 2)

Before a project can transition from `new`, it must meet criteria based on project type.

### Criteria by Project Type

| Project Type | Required for `demo` | Required for `draft` | Required for `review` |
|--------------|---------------------|----------------------|----------------------|
| `topic` | ≥1 post + cover image | (same) | (same) + team ≤3 to skip |
| `project` | ≥1 event + cover image | (same) | (same) + team ≤3 to skip |
| `regio` | ≥1 member + ≥1 associated project + cover image | (same) | (same) + team ≤3 to skip |
| `special` | cover image | (same) | (same) |

### Rule Definitions

```typescript
// useProjectActivation.ts (v0.3 prototype)

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
const SKIP_REVIEW_RULE: ActivationRule = {
  id: 'small-team-skip',
  label: 'Project may skip review if team ≤3 people',
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

```
┌─────────────────────────────────────────────────┐
│  🚀 Activate Project                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Choose target state:                           │
│  ○ Demo  ○ Draft  ● Review                      │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Readiness Checklist:                           │
│                                                 │
│  ✅ Cover image uploaded                        │
│  ✅ At least 1 post created                     │
│  ✅ Team size ≤3 (skip review allowed)          │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│           [ Activate to Review ]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Role Access Matrix (ESSENTIAL 3)

### Per Project State

| Role | `new` | `demo` | `draft` | `review` | `confirmed` | `released` |
|------|-------|--------|---------|----------|-------------|------------|
| **Owner** | RW | RW | RW | RW | RW | RW |
| **Member** | - | R+comment | RW+create | RW+create | RW+create | RW+create |
| **Participant** | - | - | R (limited) | R (limited) | R | R |
| **Partner** | - | - | - | - | R | R |
| **Anonymous** | - | - | - | - | - | R (public only) |

**Legend:**
- R = Read
- RW = Read + Write (edit existing)
- RW+create = Read + Write + Create new entities
- R+comment = Read + Write comments only
- R (limited) = Read headline+teaser only (v0.5: formalize as `read-summary`)

### Member Permissions Detail

| Project State | Member Can... |
|---------------|---------------|
| `demo` | Read stepper content, comment on final step |
| `draft` | Read dashboard, edit entities, create new entities |
| `review+` | Full collaboration |

### v0.5 Task: Write Permissions Granularity

```typescript
// Future: project-level config override
interface ProjectConfig {
  memberWriteMode: 'write-all' | 'write-nocreate'  // v0.5
}
```

- `write-all` (default): Members can create entities
- `write-nocreate`: Members can edit but not create (for special projects)

---

## Test Scenarios

### Test Projects

| Project | Type | Owner | Default Status |
|---------|------|-------|----------------|
| opus1 | topic | Hans Opus (id=8) | new |
| opus2 | project | Rosa Königer (id=18) | released |
| opus3 | regio | Kathrin Opus (id=9) | draft |

### Test Users for opus1

| User | Email | Role | Password |
|------|-------|------|----------|
| Hans Opus | hans.opus@theaterpedia.org | owner | opus1hans |
| Nina Opus | nina.opus@theaterpedia.org | member | opus1nina |
| Rosa Opus | rosa.opus@theaterpedia.org | participant | opus1rosa |
| Marc Opus | marc.opus@theaterpedia.org | partner | opus1marc |

### Test User for opus3

| User | Email | Role | Password |
|------|-------|------|----------|
| Kathrin Opus | kathrin.opus@theaterpedia.org | owner | opus1kathrin |

### Scenario: Topic Project Activation

```gherkin
Feature: Project Activation (Topic)

  Background:
    Given Hans is logged in as owner of opus1
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

  Scenario: Cannot skip review with large team
    Given opus1 meets all activation criteria
    And opus1 has 4 team members
    When Hans tries to select "Review" as target
    Then "Review" option is disabled
    And tooltip shows "Team size exceeds 3"
```

### Scenario: Stepper to Dashboard Transition

```gherkin
Feature: Layout Transition

  Scenario: Stay on stepper in demo state
    Given opus1 is in state 'demo'
    When Nina (member) opens opus1
    Then she sees the Stepper layout
    And content is read-only
    And she can comment on the Comments step

  Scenario: Switch to dashboard on draft
    Given opus1 is in state 'demo'
    When Hans activates opus1 to 'draft'
    Then the UI switches to Dashboard layout
    And Nina sees full entity folders

  Scenario: Direct to dashboard when skipping demo
    Given opus1 is in state 'new'
    And opus1 meets criteria for draft
    When Hans activates directly to 'draft'
    Then the UI shows Dashboard layout immediately
```

---

## Implementation Checklist

### v0.3 (December 5)

- [ ] `useProjectActivation` composable
  - [ ] Rule definitions
  - [ ] Criteria checking
  - [ ] Target state validation
- [ ] Activation panel component
  - [ ] State selector (radio buttons)
  - [ ] Checklist display
  - [ ] Enable/disable button
- [ ] Layout switching logic
  - [ ] Stepper for `new`/`demo`
  - [ ] Dashboard for `draft+`
- [ ] API: `PATCH /api/projects/:id/activate`

### v0.4 (December 9)

- [ ] Member read access from `demo`
- [ ] Member write access from `draft`
- [ ] Comment system on stepper (demo state)

### v0.5 (Deferred)

- [ ] `write-nocreate` project config
- [ ] `read-summary` for participants
- [ ] Task generation from failed criteria (v1.1)

---

## Related Specs

- [Posts Workflow Spec](./POSTS-WORKFLOW-SPEC.md) - Entity states within projects
- [Capabilities Howto](../docs/dev/sysreg/capabilities-howto.md) - Role system reference
- [Auth System Spec](./2025-12-01-AUTH-SYSTEM-SPEC.md) - Login and session handling
