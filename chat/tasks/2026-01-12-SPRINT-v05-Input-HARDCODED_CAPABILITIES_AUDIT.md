# Hardcoded Capabilities Audit Report

## Overview

This report analyzes components under `src/views/project` to identify hardcoded capabilities, status checks, and props that should instead be driven by `sysreg_config`.

The goal is to centralize all capability logic in `sysreg_config` for consistency and maintainability.

---

## Executive Summary

| Category | Count | Priority |
|----------|-------|----------|
| Hardcoded Status Checks | 12 | High |
| Hardcoded Role Checks | 8 | High |
| Props Bypassing sysreg_config | 15 | Medium |
| Missing Capability Checks | 6 | Medium |

---

## Detailed Findings

### 1. ProjectMain.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 163 | Status check for RequestReviewButton | `projectStatus === 64` | Query sysreg_config `can_request_review` |
| 159 | Interactive prop from owner check | `:interactive="isProjectOwner"` | Use `can_edit_workflow` capability |
| 327-345 | Hardcoded workflow transitions | `if (current === DRAFT) { targets.push(...) }` | Load from sysreg_config |
| 366-369 | Stepper mode by status | `status === NEW \|\| status === DEMO` | Query `show_stepper_mode` |
| 375-377 | isLocked always false | `return false` | Derive from sysreg_config |
| 383-385 | Owner check by string | `_userRole === 'owner'` | Use sysreg_config capabilities |
| 431-445 | Step order by type | `if (type === 'topic')` | sysreg_config step definitions |
| 449-451 | Filter steps for non-owners | Hardcoded filter | Query `visible_steps` |

### 2. ProjectStepper.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 75 | isOwner prop | Default `false` | Replace with capability query |
| 99-129 | Steps filtered by type/owner | Multiple conditions | sysreg_config `available_steps` |
| 119-121 | Non-owners excluded from steps | Hardcoded filter | Query step visibility |
| 124-127 | Activate step owner-only | `if (isOwner)` | `can_activate_project` capability |

### 3. ProjectStepUsers.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 119-133 | Status prop default | `DRAFT` | Pass from parent/query |
| 120 | isLocked default false | `false` | sysreg_config |
| 180-189 | Hardcoded role mapping | Multiple `if (role === ...)` | Use sysreg_config roles |
| 239 | Hardcoded instructor status | `status: 64` | Query default status |
| 28-30 | Create instructor visibility | Direct check | `can_create_instructor` |

### 4. ProjectStepImages.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 95-105 | isLocked default false | `false` | sysreg_config |
| 206-208 | Delete by owner_id match | `user.id === image.owner_id` | `can_delete_images` |

### 5. ProjectStepEvents.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 75-84 | isLocked default false | `false` | sysreg_config |
| N/A | No delete capability check | Missing | Add `can_delete_events` |

### 6. ProjectStepPosts.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 82-90 | isLocked default false | `false` | sysreg_config |
| N/A | No delete capability check | Missing | Add `can_delete_posts` |

### 7. ProjectStepTheme.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 55-64 | isLocked default false | `false` | sysreg_config |
| N/A | Visibility controlled by parent | Hardcoded filter | `can_edit_theme` |

### 8. ProjectStepActivate.vue

| Line(s) | Issue | Current Value | Fix |
|---------|-------|---------------|-----|
| 113-123 | isLocked default false | `false` | sysreg_config |
| 86 | Hardcoded status labels | "Neu", "Entwurf" | Dynamic from sysreg |

---

## Required sysreg_config Capabilities

These capabilities need to be added to `sysreg_config`:

### Workflow Capabilities

```sql
-- Status transition capabilities
INSERT INTO sysreg_config (taggroup, tagtype, raw_value, description) VALUES
('capability', 'workflow', 'can_request_review', 'User can request project review'),
('capability', 'workflow', 'can_edit_workflow', 'User can interact with workflow timeline'),
('capability', 'workflow', 'can_activate_project', 'User can activate/publish project');

-- Status transition rules
INSERT INTO sysreg_config (taggroup, tagtype, raw_value, bit_position, description) VALUES
('transition', 'projects', 'draft_to_review', 64, 'DRAFT can transition to REVIEW'),
('transition', 'projects', 'draft_to_confirmed', 512, 'DRAFT can transition to CONFIRMED'),
('transition', 'projects', 'review_to_released', 4096, 'REVIEW can transition to RELEASED');
```

### Entity Capabilities

```sql
INSERT INTO sysreg_config (taggroup, tagtype, raw_value, description) VALUES
('capability', 'entity', 'can_create_instructor', 'User can create instructor profile'),
('capability', 'entity', 'can_delete_images', 'User can delete images'),
('capability', 'entity', 'can_delete_events', 'User can delete events'),
('capability', 'entity', 'can_delete_posts', 'User can delete posts'),
('capability', 'entity', 'can_edit_theme', 'User can edit theme settings'),
('capability', 'entity', 'can_manage_team', 'User can manage team members');
```

### View Capabilities

```sql
INSERT INTO sysreg_config (taggroup, tagtype, raw_value, description) VALUES
('capability', 'view', 'show_stepper_mode', 'Show stepper instead of dashboard'),
('capability', 'view', 'visible_steps', 'JSON array of visible step IDs'),
('capability', 'view', 'visible_tabs', 'JSON array of visible tab IDs');
```

---

## Implementation Roadmap

### Phase 1: High Priority (Immediate)

1. **Create capability lookup composable**
   ```typescript
   // src/composables/useCapabilities.ts
   export function useCapabilities(projectId: string, userId: number) {
       const capabilities = ref<string[]>([])
       // Query sysreg_config for user's capabilities
   }
   ```

2. **Replace isLocked prop** with computed from sysreg_config

3. **Add transition rules** to sysreg_config and query in ProjectMain

### Phase 2: Medium Priority (Next Sprint)

1. **Centralize step visibility** - Query `visible_steps` from sysreg_config

2. **Add entity delete capabilities** - Check before showing delete buttons

3. **Move role display** to sysreg_config role definitions

### Phase 3: Lower Priority (Backlog)

1. **Dashboard section visibility** - Dynamic based on role

2. **Complete tab visibility** - Beyond current boolean flags

---

## Migration Script Outline

```typescript
// server/database/migrations/0XX_capabilities_migration.ts
export const migration = {
    id: '0XX_capabilities_to_sysreg_config',
    
    async up(db) {
        // Add capability entries
        await db.run(`
            INSERT INTO sysreg_config (taggroup, tagtype, raw_value, ...)
            VALUES (...)
        `)
        
        // Add role-capability mappings
        await db.run(`
            INSERT INTO sysreg_config (...)
            VALUES
            -- Owner capabilities
            ('role_capability', 'owner', 'can_activate_project', ...),
            ('role_capability', 'owner', 'can_delete_images', ...),
            ...
        `)
    }
}
```

---

## Conclusion

The current codebase has significant hardcoded capability logic spread across multiple files. Centralizing this in `sysreg_config` will:

1. **Improve maintainability** - Single source of truth
2. **Enable dynamic configuration** - Change capabilities without code changes
3. **Support role-based access** - Consistent capability checks
4. **Facilitate testing** - Mock sysreg_config for tests

Estimated effort: **2-3 days** for Phase 1, **3-5 days** for Phase 2.

---

*Generated: December 10, 2025*
