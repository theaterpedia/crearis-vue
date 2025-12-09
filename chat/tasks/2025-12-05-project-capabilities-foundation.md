# Project Capabilities Foundation

**Created:** December 5, 2025  
**Purpose:** Ground-up seed definitions for project capabilities & transitions  
**Source:** PROJECT-WORKFLOW-SPEC.md + CAPABILITIES_NAMING_CONVENTION.md  
**Target:** Migration `056_project_capabilities_seed.ts`

---

## Bit Layout Reference

```typescript
// Entity code for project = 1
const ENTITY_PROJECT = 1 << 3  // bits 3-7 = 0b00001000 = 8

// States (bits 8-10 for FROM, bits 17-19 for TO)
const STATE = {
  new:       0,  // 0b000
  demo:      1,  // 0b001
  draft:     2,  // 0b010
  confirmed: 3,  // 0b011
  released:  4,  // 0b100
  archived:  5,  // 0b101
  trash:     6,  // 0b110
  all:       7,  // 0b111 (wildcard)
}

// Capability bits
const READ = {
  none:     0 << 11,
  summary:  1 << 11,  // headline+teaser only
  content:  2 << 11,  // full content
  config:   3 << 11,  // includes settings
}

const UPDATE = {
  none:     0 << 14,
  comment:  1 << 14,  // add comments only
  content:  2 << 14,  // edit content
  config:   3 << 14,  // edit settings
}

const MANAGE = {
  none:     0 << 20,
  status:   1 << 20,  // change workflow status
  members:  2 << 20,  // manage team (not creators)
  full:     3 << 20,  // delete, transfer, promote creators
}

const LIST   = 1 << 23
const SHARE  = 1 << 24

// Relations (bits 25-29) - for projects we use p_ prefix explicitly
const REL = {
  anonym:      1 << 25,
  partner:     1 << 26,
  participant: 1 << 27,
  member:      1 << 28,
  p_creator:   1 << 29,  // Note: creator bit used for p_creator
  p_owner:     1 << 30,  // Extra bit for p_owner (bit 30)
}
```

---

## Capability Definitions (18 entries)

### p_owner Capabilities (Full Control in All States)

| # | Name | State | Capabilities | Description |
|---|------|-------|--------------|-------------|
| C1 | `project_new_config_p_owner` | new | read:config, update:config, manage:full, list, share | Owner has full control in new state |
| C2 | `project_demo_config_p_owner` | demo | read:config, update:config, manage:full, list, share | Owner has full control in demo state |
| C3 | `project_draft_config_p_owner` | draft | read:config, update:config, manage:full, list, share | Owner has full control in draft state |
| C4 | `project_confirmed_config_p_owner` | confirmed | read:config, update:config, manage:full, list, share | Owner has full control in confirmed state |
| C5 | `project_released_config_p_owner` | released | read:config, update:config, manage:full, list, share | Owner has full control in released state |

### p_creator Capabilities (Config in new/draft, Reduced in confirmed+)

| # | Name | State | Capabilities | Description |
|---|------|-------|--------------|-------------|
| C6 | `project_new_config_p_creator` | new | read:config, update:config, manage:members, list, share | Creator has config access in new |
| C7 | `project_demo_read_p_creator` | demo | read:content, update:none, manage:none, list | Creator can only read in demo |
| C8 | `project_draft_config_p_creator` | draft | read:config, update:config, manage:members, list, share | Creator has config access in draft |
| C9 | `project_confirmed_draft_p_creator` | confirmed | read:content, update:content, manage:status, list, share | Creator has draft-mode access in confirmed |
| C10 | `project_released_default_p_creator` | released | read:content, update:none, manage:none, list | Creator has default (read) access in released |

### member Capabilities (No access in new, Read in demo, RW+create in draft+)

| # | Name | State | Capabilities | Description |
|---|------|-------|--------------|-------------|
| C11 | `project_demo_read_member` | demo | read:content, update:none, manage:none, list | Member can read in demo |
| C12 | `project_draft_write_member` | draft | read:content, update:content, manage:none, list, share | Member can read/write in draft |
| C13 | `project_confirmed_write_member` | confirmed | read:content, update:content, manage:none, list, share | Member can read/write in confirmed |
| C14 | `project_released_write_member` | released | read:content, update:content, manage:none, list, share | Member can read/write in released |

### partner Capabilities (Read only in confirmed+)

| # | Name | State | Capabilities | Description |
|---|------|-------|--------------|-------------|
| C15 | `project_confirmed_read_partner` | confirmed | read:content, update:none, manage:none, list | Partner can read in confirmed |
| C16 | `project_released_read_partner` | released | read:content, update:none, manage:none, list | Partner can read in released |

### participant Capabilities (Limited read in draft, full read in confirmed+)

| # | Name | State | Capabilities | Description |
|---|------|-------|--------------|-------------|
| C17 | `project_draft_summary_participant` | draft | read:summary, update:none, manage:none, list | Participant sees summary only in draft |
| C18 | `project_released_read_participant` | confirmed+ | read:content, update:none, manage:none, list | Participant can read in confirmed/released |

---

## Transition Definitions (20 entries)

### Primary Transitions (taglogic: 'category')

| # | Name | From | To | Relations | Description |
|---|------|------|-----|-----------|-------------|
| T1 | `project_transition_new_demo_p_owner` | new | demo | p_owner | Owner activates to demo (primary) |
| T2 | `project_transition_new_demo_p_creator` | new | demo | p_creator | Creator can also activate to demo |
| T3 | `project_transition_demo_draft_p_owner` | demo | draft | p_owner | Owner advances demo to draft |
| T4 | `project_transition_demo_draft_p_creator` | demo | draft | p_creator | Creator advances demo to draft |
| T5 | `project_transition_draft_confirmed_p_owner` | draft | confirmed | p_owner | Owner confirms draft |
| T6 | `project_transition_draft_confirmed_p_creator` | draft | confirmed | p_creator | Creator confirms draft |
| T7 | `project_transition_confirmed_released_p_owner` | confirmed | released | p_owner | Owner releases project |
| T8 | `project_transition_confirmed_released_p_creator` | confirmed | released | p_creator | Creator releases project |

### Skip Transitions (taglogic: 'category', condition: team ≤3)

| # | Name | From | To | Relations | Description |
|---|------|------|-----|-----------|-------------|
| T9 | `project_transition_new_draft_p_owner` | new | draft | p_owner | Owner skips demo (small team) |
| T10 | `project_transition_new_confirmed_p_owner` | new | confirmed | p_owner | Owner skips to confirmed (small team) |
| T11 | `project_transition_demo_confirmed_p_owner` | demo | confirmed | p_owner | Owner skips draft (small team) |

### Backward Transitions (taglogic: 'subcategory')

| # | Name | From | To | Relations | Description |
|---|------|------|-----|-----------|-------------|
| T12 | `project_alt_transition_demo_new_p_owner` | demo | new | p_owner | Owner reverts to new |
| T13 | `project_alt_transition_draft_demo_p_owner` | draft | demo | p_owner | Owner reverts to demo |
| T14 | `project_alt_transition_draft_demo_p_creator` | draft | demo | p_creator | Creator reverts to demo |
| T15 | `project_alt_transition_confirmed_draft_p_owner` | confirmed | draft | p_owner | Owner reverts to draft |
| T16 | `project_alt_transition_confirmed_draft_p_creator` | confirmed | draft | p_creator | Creator reverts to draft |

### Critical Transitions - p_owner ONLY (taglogic: 'subcategory')

| # | Name | From | To | Relations | Description |
|---|------|------|-----|-----------|-------------|
| T17 | `project_alt_transition_any_trash_p_owner` | all | trash | p_owner | Only owner can trash |
| T18 | `project_alt_transition_trash_draft_p_owner` | trash | draft | p_owner | Only owner can restore |
| T19 | `project_alt_transition_released_archived_p_owner` | released | archived | p_owner | Only owner can archive |
| T20 | `project_alt_transition_archived_released_p_owner` | archived | released | p_owner | Only owner can unarchive |

---

## TypeScript Migration Seed

```typescript
// server/database/migrations/056_project_capabilities_seed.ts

import { db } from '../connection'

// Bit helpers
const ENTITY_PROJECT = 1 << 3

const STATE = {
  new: 0, demo: 1, draft: 2, confirmed: 3, 
  released: 4, archived: 5, trash: 6, all: 7
}

const READ = { none: 0, summary: 1 << 11, content: 2 << 11, config: 3 << 11 }
const UPDATE = { none: 0, comment: 1 << 14, content: 2 << 14, config: 3 << 14 }
const MANAGE = { none: 0, status: 1 << 20, members: 2 << 20, full: 3 << 20 }
const LIST = 1 << 23
const SHARE = 1 << 24

const REL = {
  anonym: 1 << 25,
  partner: 1 << 26,
  participant: 1 << 27,
  member: 1 << 28,
  p_creator: 1 << 29,
  p_owner: 1 << 30,
}

function fromState(s: number) { return s << 8 }
function toState(s: number) { return s << 17 }

interface CapabilityEntry {
  name: string
  value: number
  taglogic: 'toggle' | 'category' | 'subcategory'
  description: string
  parent_bit?: number | null
}

const CAPABILITIES: CapabilityEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // p_owner: Full control in all states
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_new_config_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.new) | READ.config | UPDATE.config | MANAGE.full | LIST | SHARE | REL.p_owner,
    taglogic: 'toggle',
    description: 'Owner has full control in new state'
  },
  {
    name: 'project_demo_config_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.demo) | READ.config | UPDATE.config | MANAGE.full | LIST | SHARE | REL.p_owner,
    taglogic: 'toggle',
    description: 'Owner has full control in demo state'
  },
  {
    name: 'project_draft_config_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.draft) | READ.config | UPDATE.config | MANAGE.full | LIST | SHARE | REL.p_owner,
    taglogic: 'toggle',
    description: 'Owner has full control in draft state'
  },
  {
    name: 'project_confirmed_config_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | READ.config | UPDATE.config | MANAGE.full | LIST | SHARE | REL.p_owner,
    taglogic: 'toggle',
    description: 'Owner has full control in confirmed state'
  },
  {
    name: 'project_released_config_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.released) | READ.config | UPDATE.config | MANAGE.full | LIST | SHARE | REL.p_owner,
    taglogic: 'toggle',
    description: 'Owner has full control in released state'
  },

  // ═══════════════════════════════════════════════════════════════════
  // p_creator: Config in new/draft, reduced in confirmed+
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_new_config_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.new) | READ.config | UPDATE.config | MANAGE.members | LIST | SHARE | REL.p_creator,
    taglogic: 'toggle',
    description: 'Creator has config access in new state'
  },
  {
    name: 'project_demo_read_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.demo) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.p_creator,
    taglogic: 'toggle',
    description: 'Creator can only read in demo state'
  },
  {
    name: 'project_draft_config_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.draft) | READ.config | UPDATE.config | MANAGE.members | LIST | SHARE | REL.p_creator,
    taglogic: 'toggle',
    description: 'Creator has config access in draft state'
  },
  {
    name: 'project_confirmed_draft_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | READ.content | UPDATE.content | MANAGE.status | LIST | SHARE | REL.p_creator,
    taglogic: 'toggle',
    description: 'Creator has draft-mode access in confirmed state'
  },
  {
    name: 'project_released_default_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.released) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.p_creator,
    taglogic: 'toggle',
    description: 'Creator has default (read) access in released state'
  },

  // ═══════════════════════════════════════════════════════════════════
  // member: No new, Read demo, RW in draft+
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_demo_read_member',
    value: ENTITY_PROJECT | fromState(STATE.demo) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.member,
    taglogic: 'toggle',
    description: 'Member can read in demo state'
  },
  {
    name: 'project_draft_write_member',
    value: ENTITY_PROJECT | fromState(STATE.draft) | READ.content | UPDATE.content | MANAGE.none | LIST | SHARE | REL.member,
    taglogic: 'toggle',
    description: 'Member can read/write in draft state'
  },
  {
    name: 'project_confirmed_write_member',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | READ.content | UPDATE.content | MANAGE.none | LIST | SHARE | REL.member,
    taglogic: 'toggle',
    description: 'Member can read/write in confirmed state'
  },
  {
    name: 'project_released_write_member',
    value: ENTITY_PROJECT | fromState(STATE.released) | READ.content | UPDATE.content | MANAGE.none | LIST | SHARE | REL.member,
    taglogic: 'toggle',
    description: 'Member can read/write in released state'
  },

  // ═══════════════════════════════════════════════════════════════════
  // partner: Read in confirmed+
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_confirmed_read_partner',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.partner,
    taglogic: 'toggle',
    description: 'Partner can read in confirmed state'
  },
  {
    name: 'project_released_read_partner',
    value: ENTITY_PROJECT | fromState(STATE.released) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.partner,
    taglogic: 'toggle',
    description: 'Partner can read in released state'
  },

  // ═══════════════════════════════════════════════════════════════════
  // participant: Summary in draft, full read in confirmed+
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_draft_summary_participant',
    value: ENTITY_PROJECT | fromState(STATE.draft) | READ.summary | UPDATE.none | MANAGE.none | LIST | REL.participant,
    taglogic: 'toggle',
    description: 'Participant sees summary only in draft state'
  },
  {
    name: 'project_confirmed_read_participant',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | READ.content | UPDATE.none | MANAGE.none | LIST | REL.participant,
    taglogic: 'toggle',
    description: 'Participant can read in confirmed state'
  },
]

const TRANSITIONS: CapabilityEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY FORWARD TRANSITIONS (category)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_transition_new_demo_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.new) | toState(STATE.demo) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner activates new → demo'
  },
  {
    name: 'project_transition_new_demo_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.new) | toState(STATE.demo) | MANAGE.status | REL.p_creator,
    taglogic: 'category',
    description: 'Creator activates new → demo'
  },
  {
    name: 'project_transition_demo_draft_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.demo) | toState(STATE.draft) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner advances demo → draft'
  },
  {
    name: 'project_transition_demo_draft_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.demo) | toState(STATE.draft) | MANAGE.status | REL.p_creator,
    taglogic: 'category',
    description: 'Creator advances demo → draft'
  },
  {
    name: 'project_transition_draft_confirmed_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.draft) | toState(STATE.confirmed) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner confirms draft → confirmed'
  },
  {
    name: 'project_transition_draft_confirmed_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.draft) | toState(STATE.confirmed) | MANAGE.status | REL.p_creator,
    taglogic: 'category',
    description: 'Creator confirms draft → confirmed'
  },
  {
    name: 'project_transition_confirmed_released_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | toState(STATE.released) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner releases confirmed → released'
  },
  {
    name: 'project_transition_confirmed_released_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | toState(STATE.released) | MANAGE.status | REL.p_creator,
    taglogic: 'category',
    description: 'Creator releases confirmed → released'
  },

  // ═══════════════════════════════════════════════════════════════════
  // SKIP TRANSITIONS (category, condition: team ≤3)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_transition_new_draft_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.new) | toState(STATE.draft) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner skips demo: new → draft (team ≤3)'
  },
  {
    name: 'project_transition_new_confirmed_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.new) | toState(STATE.confirmed) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner skips to confirmed: new → confirmed (team ≤3)'
  },
  {
    name: 'project_transition_demo_confirmed_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.demo) | toState(STATE.confirmed) | MANAGE.status | REL.p_owner,
    taglogic: 'category',
    description: 'Owner skips draft: demo → confirmed (team ≤3)'
  },

  // ═══════════════════════════════════════════════════════════════════
  // BACKWARD TRANSITIONS (subcategory)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_alt_transition_demo_new_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.demo) | toState(STATE.new) | MANAGE.status | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Owner reverts demo → new'
  },
  {
    name: 'project_alt_transition_draft_demo_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.draft) | toState(STATE.demo) | MANAGE.status | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Owner reverts draft → demo'
  },
  {
    name: 'project_alt_transition_draft_demo_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.draft) | toState(STATE.demo) | MANAGE.status | REL.p_creator,
    taglogic: 'subcategory',
    description: 'Creator reverts draft → demo'
  },
  {
    name: 'project_alt_transition_confirmed_draft_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | toState(STATE.draft) | MANAGE.status | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Owner reverts confirmed → draft'
  },
  {
    name: 'project_alt_transition_confirmed_draft_p_creator',
    value: ENTITY_PROJECT | fromState(STATE.confirmed) | toState(STATE.draft) | MANAGE.status | REL.p_creator,
    taglogic: 'subcategory',
    description: 'Creator reverts confirmed → draft'
  },

  // ═══════════════════════════════════════════════════════════════════
  // CRITICAL TRANSITIONS - p_owner ONLY (subcategory)
  // ═══════════════════════════════════════════════════════════════════
  {
    name: 'project_alt_transition_any_trash_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.all) | toState(STATE.trash) | MANAGE.full | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Only owner can move any state → trash'
  },
  {
    name: 'project_alt_transition_trash_draft_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.trash) | toState(STATE.draft) | MANAGE.full | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Only owner can restore trash → draft'
  },
  {
    name: 'project_alt_transition_released_archived_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.released) | toState(STATE.archived) | MANAGE.full | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Only owner can archive released → archived'
  },
  {
    name: 'project_alt_transition_archived_released_p_owner',
    value: ENTITY_PROJECT | fromState(STATE.archived) | toState(STATE.released) | MANAGE.full | REL.p_owner,
    taglogic: 'subcategory',
    description: 'Only owner can unarchive archived → released'
  },
]

export async function up() {
  // Clear existing project capabilities (entity=1)
  await db.run(`DELETE FROM sysreg_config WHERE (value & 0b11111000) >> 3 = 1`)
  
  // Insert capabilities
  for (const cap of CAPABILITIES) {
    await db.run(`
      INSERT INTO sysreg_config (name, value, taglogic, description)
      VALUES (?, ?, ?, ?)
    `, [cap.name, cap.value, cap.taglogic, cap.description])
  }
  
  // Insert transitions
  for (const trans of TRANSITIONS) {
    await db.run(`
      INSERT INTO sysreg_config (name, value, taglogic, description)
      VALUES (?, ?, ?, ?)
    `, [trans.name, trans.value, trans.taglogic, trans.description])
  }
  
  console.log(`✅ Inserted ${CAPABILITIES.length} capabilities + ${TRANSITIONS.length} transitions`)
}

export async function down() {
  await db.run(`DELETE FROM sysreg_config WHERE (value & 0b11111000) >> 3 = 1`)
  console.log('✅ Removed all project capabilities')
}
```

---

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| **Capabilities** | 18 | State×Relation permission matrix |
| **Primary Transitions** | 8 | Forward workflow (new→demo→draft→confirmed→released) |
| **Skip Transitions** | 3 | Owner shortcuts (team ≤3 condition) |
| **Backward Transitions** | 5 | Revert to previous state |
| **Critical Transitions** | 4 | Owner-only (trash, archive) |
| **Total** | **38** | |

---

## Access Matrix Visualization

```
           │ new    │ demo   │ draft  │ confirmed │ released │
───────────┼────────┼────────┼────────┼───────────┼──────────┤
p_owner    │ CONFIG │ CONFIG │ CONFIG │ CONFIG    │ CONFIG   │
p_creator  │ CONFIG │ read   │ CONFIG │ draft     │ read     │
member     │ -      │ read   │ WRITE  │ WRITE     │ WRITE    │
participant│ -      │ -      │ summary│ read      │ read     │
partner    │ -      │ -      │ -      │ read      │ read     │
```

---

## Transition Graph

```
                    ┌─────────────────────────────────────────┐
                    │           (skip, team ≤3)               │
                    ▼                                         │
    ┌─────┐     ┌─────┐     ┌───────┐     ┌───────────┐     ┌──────────┐
    │ NEW │────▶│DEMO │────▶│ DRAFT │────▶│ CONFIRMED │────▶│ RELEASED │
    └─────┘     └─────┘     └───────┘     └───────────┘     └──────────┘
        │           ▲           ▲               ▲               │
        │           │           │               │               │
        └───────────┴───────────┴───────────────┘               │
              (backward transitions)                             │
                                                                 ▼
                                                          ┌──────────┐
                         ┌──────┐                         │ ARCHIVED │
                         │TRASH │◀────────────────────────└──────────┘
                         └──────┘     (owner only)
                             ▲
                             │ (owner only, from any state)
                             │
```
