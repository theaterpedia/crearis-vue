# Capabilities Refactoring Plan: Utils-Driven → Table-Driven

> **Created:** December 4, 2025  
> **Sprint:** Projectlogin Workflow (Dec 1-9)  
> **Sunrise Talk Topic:** December 5, 2025  
> **Status:** Implementation Plan

---

## Executive Summary

This document outlines the plan to refactor from the current **utils-driven** permission system (`posts-permissions.ts`) to a **table-driven** system using `sysreg_config` as the single source of truth.

### Why This Change?

| Current (Utils-Driven) | Target (Table-Driven) |
|------------------------|----------------------|
| Rules in TypeScript code | Rules in database |
| Requires deployment to change | Change rules at runtime |
| Server + client duplicated logic | Single source, multiple consumers |
| No per-project customization | Per-project overrides possible |
| Hard to audit | Visual CapabilitiesEditor |

---

## Current Architecture Analysis

### posts-permissions.ts (Server)

**Location:** `server/utils/posts-permissions.ts`

**Contains:**
- 15 named rules (POST_ALLROLE_READ_RELEASED, POST_OWNER_FULL, etc.)
- Status constants (NEW=1, DEMO=8, DRAFT=64, etc.)
- Permission check functions (`canReadPost`, `canEditPost`, `canTransition`)
- Transition matrix (`VALID_TRANSITIONS`)

**Consumers:**
- API routes (`server/api/posts/*.ts`)
- Potentially client composables (via shared types)

### usePostPermissions.ts (Client)

**Location:** `src/composables/usePostPermissions.ts`

**Contains:**
- Mirrors server-side STATUS constants
- Permission check computeds for UI state
- Calls API endpoints that use server permission checks

### sysreg_config Table (Database)

**Current State:**
- Contains capability entries with 31-bit encoded values
- Used ONLY for r_* flag triggers (migrations 045-047)
- NOT used for actual permission checking in API routes

### CapabilitiesEditor.vue

**Location:** `src/components/sysreg/CapabilitiesEditor.vue`

**Current Capabilities:**
- Visual editor for sysreg_config entries
- Bit manipulation UI (entity, state, roles, capabilities)
- CRUD operations on config entries
- Filtering by entity/state/project-type

**Missing:**
- Transition rule support (from_status → to_status)
- Preview of "who can do what" matrix
- Integration with actual permission checking

---

## Proposed Architecture

### Phase 1: Transition Rules in sysreg_config

**Add new config entry type for transitions:**

```typescript
// New naming convention
{
  name: 'transition_post_draft_review',
  value: ENTITY_POST | STATE_DRAFT | ROLE_OWNER | ROLE_MEMBER,
  description: 'Creator/member can submit draft for review',
  // Use existing bits 17-19 for "to_status" encoding
  // Or add metadata JSONB field
}
```

**Bit allocation option:**

| Bits | Current Use | Proposed Addition |
|------|-------------|-------------------|
| 17-19 | Create capability | Repurpose as to_status for transition entries |
| 20-22 | Manage capability | Keep as-is |

**Alternative: JSONB metadata field:**

```sql
ALTER TABLE sysreg_config ADD COLUMN metadata JSONB;

-- Example transition entry
INSERT INTO sysreg_config (name, value, metadata) VALUES (
  'transition_post_draft_review',
  <capability_bits>,
  '{"type": "transition", "from_status": 64, "to_status": 256}'
);
```

### Phase 2: Permission Lookup Function

**Create server-side lookup:**

```typescript
// server/utils/capabilities-lookup.ts

import { db } from '../database/init'

interface CapabilityQuery {
  entity: 'post' | 'project' | 'image' | 'event'
  state: number
  action: 'read' | 'update' | 'create' | 'manage' | 'transition'
  role: number  // User's role bits
  toStatus?: number  // For transitions
}

export async function checkCapability(query: CapabilityQuery): Promise<boolean> {
  const { entity, state, action, role, toStatus } = query
  
  // Build bit pattern to match
  const entityBit = ENTITY_BITS[entity]
  const stateBit = state << 8
  
  // Query sysreg_config for matching entries
  const result = await db.query(`
    SELECT value FROM sysreg_config
    WHERE tagfamily = 'config'
      AND ((value >> 3) & 31) = $1  -- entity
      AND (((value >> 8) & 7) = $2 OR ((value >> 8) & 7) = 0)  -- state or all
      AND (value & $3) != 0  -- role matches
  `, [entityBit, stateBit >> 8, role])
  
  if (result.rows.length === 0) return false
  
  // Check specific capability bit
  for (const row of result.rows) {
    if (hasCapability(row.value, action)) return true
  }
  
  return false
}
```

### Phase 3: Middleware Factory

**Create reusable middleware:**

```typescript
// server/middleware/capabilities.ts

export function requireCapability(
  entity: string,
  action: string
) {
  return defineEventHandler(async (event) => {
    const user = await getUserFromSession(event)
    const entityId = getRouterParam(event, 'id')
    
    // Get entity's current state
    const entityData = await getEntityById(entity, entityId)
    
    // Get user's role in project
    const role = await getUserRoleInProject(user.id, entityData.project_id)
    
    // Check capability
    const allowed = await checkCapability({
      entity,
      state: entityData.status,
      action,
      role
    })
    
    if (!allowed) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  })
}

// Usage in API route:
export default defineEventHandler({
  onRequest: [requireCapability('post', 'update')],
  handler: async (event) => {
    // ... update logic
  }
})
```

### Phase 4: Client-Side Cache

**Update composable to fetch from config:**

```typescript
// src/composables/useCapabilities.ts

const capabilitiesCache = ref<Map<string, number[]>>(new Map())

export function useCapabilities() {
  async function loadCapabilities() {
    const response = await $fetch('/api/sysreg/config')
    // Parse and cache capabilities
  }
  
  function canDo(entity: string, state: number, action: string, role: number): boolean {
    // Check against cached capabilities
  }
  
  return { loadCapabilities, canDo }
}
```

---

## Migration Strategy

### Step 1: Parallel Implementation (v0.3-v0.4)

Keep `posts-permissions.ts` working, add capability lookup alongside:

```typescript
// In API route
const utilsAllowed = canEditPost(ctx)  // Current
const configAllowed = await checkCapability(...)  // New

// Log discrepancies
if (utilsAllowed !== configAllowed) {
  console.warn('Permission mismatch', { utilsAllowed, configAllowed })
}

// Use utils result (maintain current behavior)
return utilsAllowed
```

### Step 2: Seed Missing Config Entries

Create migration to add missing capability entries:

```typescript
// Migration 050: Seed transition rules

const transitions = [
  { name: 'transition_post_new_draft', from: 1, to: 64, roles: ['owner', 'member'] },
  { name: 'transition_post_draft_review', from: 64, to: 256, roles: ['owner', 'member'] },
  { name: 'transition_post_review_confirmed', from: 256, to: 512, roles: ['owner'] },
  // ... all 15 rules
]
```

### Step 3: Validate Parity

Run tests comparing utils vs config results:

```typescript
describe('Capabilities parity', () => {
  for (const scenario of ALL_SCENARIOS) {
    it(`matches for ${scenario.name}`, async () => {
      const utilsResult = canReadPost(scenario.ctx)
      const configResult = await checkCapability(scenario.query)
      expect(configResult).toBe(utilsResult)
    })
  }
})
```

### Step 4: Switch to Config-Driven (v0.5)

Once parity is confirmed:
1. Update API routes to use config-driven checks
2. Deprecate function calls to `posts-permissions.ts`
3. Keep constants (STATUS values) in separate file

---

## CapabilitiesEditor Enhancements

### Required Additions

1. **Transition Entry Type**
   - Add "type" dropdown: capability | transition
   - Show from_status/to_status fields for transitions
   
2. **Permission Matrix Preview**
   - Table showing: Role × Entity × State → Capabilities
   - Filter by specific entity
   - Export as markdown/CSV

3. **Rule Validation**
   - Detect duplicate/conflicting rules
   - Warn about missing coverage (entity+state without rules)

4. **Import/Export**
   - Export current config as JSON
   - Import from JSON (for migration between environments)

### UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 Capabilities Matrix Editor                         [+Add]│
├─────────────────────────────────────────────────────────────┤
│ Type: [Capability ▼] [Transition ▼]                         │
│ Entity: [Post ▼]  State: [All ▼]  Project: [All ▼]         │
├─────────────────────────────────────────────────────────────┤
│ Name          │Entity│State   │Read│Upd│Cre│Mng│Roles      │
│───────────────│──────│────────│────│───│───│───│───────────│
│ post_read_rel │Post  │Released│ ✓  │ - │ - │ - │ all       │
│ post_owner_*  │Post  │All     │ ✓  │ ✓ │ ✓ │ ✓ │ owner     │
│ [transition]  │Post  │Draft→Rev│ - │ - │ - │ ✓ │ owner,memb│
└─────────────────────────────────────────────────────────────┘
│ [Preview Matrix] [Export JSON] [Validate Rules]             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mapping: 15 Rules → Config Entries

| # | Rule Name | Entry Type | Entity | From State | To State | Roles |
|---|-----------|------------|--------|------------|----------|-------|
| 1 | POST_ALLROLE_READ_RELEASED | capability | post | released | - | all |
| 2 | POST_OWNER_FULL | capability | post | all | - | owner |
| 3 | POST_READ_P_OWNER | capability | post | all | - | p_owner* |
| 4 | POST_READ_P_MEMBER_DRAFT | capability | post | draft+ | - | member |
| 5 | POST_READ_P_PARTICIPANT_REVIEW | capability | post | review+ | - | participant |
| 6 | POST_READ_P_PARTNER_CONFIRMED | capability | post | confirmed+ | - | partner |
| 7 | POST_READ_DEPTH_BY_PROJECT | special | - | - | - | - |
| 8 | POST_WRITE_OWN | capability | post | all | - | owner |
| 9 | POST_WRITE_P_OWNER | capability | post | all | - | p_owner* |
| 10 | POST_WRITE_P_MEMBER_EDITOR | capability | post | draft+ | - | member |
| 11 | POST_CREATE_P_MEMBER | capability | post | new | - | member |
| 12 | POST_TRANSITION_CREATOR_SUBMIT | transition | post | new,draft | draft,review | owner,member |
| 13 | POST_TRANSITION_P_OWNER_APPROVE | transition | post | review | confirmed | p_owner* |
| 14 | POST_TRANSITION_P_OWNER_REJECT | transition | post | review | draft | p_owner* |
| 15 | POST_TRANSITION_P_OWNER_SKIP | transition | post | draft | confirmed | p_owner* |

*`p_owner` = project owner, needs special handling (not record owner)

**Note:** Rule 7 (content depth) is computed, not a simple capability - may remain in code.

---

## Timeline

| Phase | Description | Effort | Target |
|-------|-------------|--------|--------|
| 1 | Add transition support to sysreg_config | 1 day | v0.3 |
| 2 | Create capabilities-lookup.ts | 1 day | v0.3 |
| 3 | Middleware factory | 0.5 day | v0.4 |
| 4 | Parallel validation tests | 1 day | v0.4 |
| 5 | CapabilitiesEditor enhancements | 2 days | v0.4 |
| 6 | Switch to config-driven | 1 day | v0.5 |
| 7 | Deprecate posts-permissions.ts | 0.5 day | v0.5 |

**Total Estimate:** ~7 days across v0.3-v0.5

---

## Open Questions for Sunrise Talk

1. **Transition encoding:** Use existing bits or add JSONB metadata field?
2. **Project-owner handling:** Record owner vs project owner distinction?
3. **Fallback behavior:** Default-deny if no matching config, or error?
4. **Cache invalidation:** How to notify clients when config changes?
5. **Content depth (Rule 7):** Keep as code or encode somehow?
6. **Scope toggles:** How do they interact with capability checks?

---

## References

- [AUTH-SYSTEM-SPEC](../../chat/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md)
- [capabilities-howto](../dev/sysreg/capabilities-howto.md)
- [posts-permissions.ts](../../server/utils/posts-permissions.ts)
- [CapabilitiesEditor.vue](../../src/components/sysreg/CapabilitiesEditor.vue)
- [STATUS_EDITOR_GUIDE](./STATUS_EDITOR_GUIDE.md)

---

*Last updated: December 4, 2025*
