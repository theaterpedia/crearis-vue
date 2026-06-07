# StatusEditor & PostStatusBadge Guide

> **Version:** 2.0 (December 5, 2025)  
> **Sprint:** Projectlogin Workflow (Dec 1-9)  
> **Status:** Config-Driven Implementation ✅

## Overview

The **StatusEditor** and **PostStatusBadge** components provide a complete UI for managing post status transitions within the Crearis platform. They implement a **config-driven permission system** where all capabilities and transitions are defined in `sysreg_config` table.

### Key Changes in v2.0

- **Single Source of Truth:** `sysreg_config` table defines all capabilities and transitions
- **taglogic field:** Transitions marked as `category` (primary) or `subcategory` (alternative)
- **Visual Hierarchy:** Primary transitions = large prominent buttons, alternatives = smaller "Weitere Optionen"
- **API-driven:** `/api/sysreg/capabilities` returns transitions with taglogic metadata

### Architecture Layers (v2.0 Config-Driven)

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components                            │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   StatusEditor.vue  │    │   PostStatusBadge.vue       │ │
│  │   (Full editor UI)  │    │   (Inline badge + dropdown) │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Composables (v2)                         │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ usePostStatusV2.ts  │───▶│   useCapabilities.ts        │ │
│  │ (UI state/actions)  │    │   (API-driven permissions)  │ │
│  └─────────────────────┘    └──────────────┬──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │       /api/sysreg/capabilities.get.ts                   ││
│  │       (Returns capabilities + transitions with taglogic)││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database: sysreg_config                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Migration 051: capabilities_matrix_v2                  ││
│  │  - Capabilities: read, update, manage, list, share      ││
│  │  - Transitions: name + taglogic (category/subcategory)  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Component: StatusEditor.vue

**Location:** `src/components/StatusEditor.vue`  
**Lines:** ~700  
**Dependencies:** `usePostStatusV2`, Lucide icons, Opus CSS

### Purpose

StatusEditor provides a complete workflow UI for changing post status. It displays:
- Current status badge (compact header)
- **Primary transitions** (category) as large, prominent buttons
- **Alternative transitions** (subcategory) as smaller buttons under "Weitere Optionen:"
- Scope toggles (Team, Login, Project, Regio, Public)
- Trash/restore functionality
- Loading and error states

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `post` | `PostData` | Yes | The post being edited |
| `project` | `ProjectData` | Yes | The project context |
| `membership` | `MembershipData \| null` | No | Current user's membership |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `status-changed` | `number` (new status) | Emitted after successful transition |
| `trash` | - | Emitted when post moved to trash |
| `restore` | - | Emitted when post restored from trash |
| `error` | `string` | Emitted on transition failure |

### Screenshot Placeholders

**[Screenshot 1: StatusEditor - NEW Status]**
> Shows StatusEditor with a post in NEW status. Header displays "Status ändern" with GitPullRequestDraft icon. Current status badge shows "📝 NEU" in muted color. Available action: "Als Entwurf speichern" button highlighted as primary.

**[Screenshot 2: StatusEditor - DRAFT with Multiple Transitions]**
> Shows StatusEditor with a post in DRAFT status. Multiple transition buttons visible: "Zur Prüfung einreichen" (primary), "Direkt bestätigen". Trash button visible in header corner.

**[Screenshot 3: StatusEditor - Primary/Alternative Transitions]**
> Shows DRAFT status with visual hierarchy: large "Zur Prüfung einreichen" button (primary/category), smaller "Weitere Optionen:" section with alternative transitions below.

**[Screenshot 4: StatusEditor - Scope Toggles]**
> Shows scope toggles section: Team 👥, Login 🔑, Project 📁, Regio 🗺️, Public 🌐. Active scopes highlighted.

**[Screenshot 5: StatusEditor - Trashed State]**
> Shows trashed post state with negative background color, trash icon, "Dieser Beitrag ist im Papierkorb" message, and "Wiederherstellen" button.

### Template Structure (v2.0)

```vue
<div class="status-editor">
    <!-- Compact Header: Status Badge + Trash -->
    <div class="status-header">
        <span class="status-badge">{{ currentStatusIcon }} {{ currentStatusLabel }}</span>
        <button v-if="canTrash" class="trash-button"><Trash2 /></button>
    </div>

    <!-- Transition Controls -->
    <div class="transition-controls">
        <!-- Primary transitions (category) - large prominent buttons -->
        <div class="primary-transitions">
            <button v-for="action in primaryTransitionActions" 
                class="primary-transition-button">
                {{ action.icon }} {{ action.label }}
            </button>
        </div>

        <!-- Alternative transitions (subcategory) - smaller -->
        <div class="alternative-transitions">
            <p class="alternatives-label">Weitere Optionen:</p>
            <div class="alternative-buttons">
                <button v-for="action in alternativeTransitionActions"
                    class="alternative-transition-button">
                    {{ action.icon }} {{ action.label }}
                </button>
            </div>
        </div>
    </div>

    <!-- Scope Toggles -->
    <div class="scope-section">
        <p class="scope-label">Sichtbarkeit:</p>
        <div class="scope-toggles">
            <button v-for="scope in scopeOptions" class="scope-toggle">
                {{ scope.icon }} {{ scope.label }}
            </button>
        </div>
    </div>

    <!-- States: No transitions, Trashed, Loading, Error -->
</div>
```

### Primary vs Alternative Transitions

The `taglogic` field in `sysreg_config` determines display hierarchy:

| taglogic | UI Treatment | Example |
|----------|--------------|---------|
| `category` | Large prominent button | "Zur Prüfung einreichen" |
| `subcategory` | Small button in "Weitere Optionen" | "Direkt bestätigen" |
| `toggle` | Not a transition - used for scopes | Team, Public, etc. |

```typescript
// Transition naming convention (from sysreg_config)
post_transition_*        // Primary transitions (category)
post_alt_transition_*    // Alternative transitions (subcategory)
```

### Lucide Icons Used

| Icon | Usage |
|------|-------|
| `Trash2` | Trash button, trashed state |
| `RotateCcw` | Restore button |
| `AlertCircle` | No transitions available |
| `XCircle` | Error message |
| `Loader2` | Loading spinner |
| `Eye` / `EyeOff` | Scope toggle active/inactive |

---

## Component: PostStatusBadge.vue

**Location:** `src/components/PostStatusBadge.vue`  
**Lines:** ~160  
**Dependencies:** `floating-vue`, `StatusEditor`, `usePostStatus`, `usePostPermissions`

### Purpose

PostStatusBadge is an **inline badge** that shows current post status and opens StatusEditor in a floating-vue dropdown when clicked. Ideal for:
- PostCard components
- PostListItem rows
- Inline status editing in tables

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `post` | `PostData` | Yes | The post being displayed |
| `project` | `ProjectData` | Yes | The project context |
| `membership` | `MembershipData \| null` | No | Current user's membership |

### Events

Same as StatusEditor: `status-changed`, `trash`, `restore`, `error`

### Screenshot Placeholders

**[Screenshot 6: PostStatusBadge - Closed State]**
> Shows inline badge displaying "📝 NEU" with chevron-down icon. Compact pill shape with muted background. Cursor indicates clickable.

**[Screenshot 7: PostStatusBadge - Open with StatusEditor]**
> Shows PostStatusBadge with floating-vue dropdown open, containing full StatusEditor component. Clean shadow and border around dropdown.

**[Screenshot 8: PostStatusBadge - Disabled (No Edit Permission)]**
> Shows badge without chevron, slightly dimmed, cursor default. Demonstrates permission-aware disabling.

### Implementation Pattern

Uses **floating-vue VDropdown** for positioning:

```vue
<VDropdown
    v-model:shown="isOpen"
    :auto-hide="true"
    theme="status-editor"
    placement="bottom-start"
    :distance="4"
>
    <!-- Trigger: clickable badge -->
    <button class="post-status-trigger" :disabled="!canEdit">
        {{ currentStatusIcon }}
        {{ currentStatusLabel }}
        <ChevronDown v-if="canEdit" />
    </button>

    <!-- Popper: StatusEditor -->
    <template #popper>
        <StatusEditor
            :post="post"
            :project="project"
            :membership="membership"
            @status-changed="handleStatusChanged"
        />
    </template>
</VDropdown>
```

### Floating-vue Theme

Custom theme defined in global (non-scoped) style:

```css
.v-popper--theme-status-editor .v-popper__inner {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    min-width: 18rem;
    max-width: 24rem;
}
```

---

## Composables (v2.0)

### useCapabilities.ts

**Location:** `src/composables/useCapabilities.ts`  
**Lines:** ~350  
**Dependencies:** Vue 3, fetch API

Core config-driven composable that fetches capabilities from `sysreg_config` via API.

```typescript
// Key types
export interface TransitionInfo {
    name: string
    taglogic: 'category' | 'subcategory'
}

// Key exports
export function useCapabilities(entity, status, relation) {
    return {
        capabilities,           // { read, update, manage, list, share }
        transitions,            // TransitionInfo[]
        availableTransitions,   // number[] (status values)
        primaryTransitions,     // number[] (category only)
        alternativeTransitions, // number[] (subcategory only)
        canTransitionTo(status),
        isPrimaryTransition(status),
        // ... more
    }
}
```

### usePostStatusV2.ts

**Location:** `src/composables/usePostStatusV2.ts`  
**Lines:** ~340  
**Dependencies:** `useCapabilities`

UI-focused composable for StatusEditor. Wraps `useCapabilities` with status metadata.

```typescript
export interface TransitionAction {
    value: number
    label: string
    color: string
    icon: string
    isPrimary: boolean
}

export function usePostStatusV2(post, project, membership) {
    return {
        // Status info
        currentStatus, currentStatusLabel, currentStatusColor, currentStatusIcon,
        
        // Transitions (from useCapabilities + UI metadata)
        transitionActions,            // TransitionAction[]
        primaryTransitionActions,     // TransitionAction[] (isPrimary = true)
        alternativeTransitionActions, // TransitionAction[] (isPrimary = false)
        
        // Scope toggles (bits 17-21)
        scopeOptions,
        toggleScope(bit),
        
        // Actions
        transitionTo(target),
        canTrash,
        isTransitioning,
        transitionError,
    }
}
```

### STATUS_META

```typescript
const STATUS_META: Record<number, StatusMeta> = {
    [STATUS.NEW]: {
        label: 'Neu',
        color: 'muted',
        icon: '📝',
        description: 'Gerade erstellt, nur für Ersteller sichtbar'
    },
    [STATUS.DEMO]: {
        label: 'Demo',
        color: 'secondary',
        icon: '👁️',
        description: 'Vorschau-Modus'
    },
    [STATUS.DRAFT]: {
        label: 'Entwurf',
        color: 'warning',
        icon: '✏️',
        description: 'In Bearbeitung, für Team sichtbar'
    },
    [STATUS.REVIEW]: {
        label: 'Review',
        color: 'accent',
        icon: '🔍',
        description: 'Bereit zur Prüfung'
    },
    [STATUS.CONFIRMED]: {
        label: 'Bestätigt',
        color: 'positive',
        icon: '✅',
        description: 'Vom Owner freigegeben'
    },
    [STATUS.RELEASED]: {
        label: 'Veröffentlicht',
        color: 'primary',
        icon: '🚀',
        description: 'Öffentlich sichtbar'
    },
    [STATUS.ARCHIVED]: {
        label: 'Archiviert',
        color: 'dimmed',
        icon: '📦',
        description: 'Nicht mehr aktiv'
    },
    [STATUS.TRASH]: {
        label: 'Papierkorb',
        color: 'negative',
        icon: '🗑️',
        description: 'Zum Löschen markiert'
    }
}
```

### TRANSITION_LABELS

Human-readable action names for status transitions:

```typescript
const TRANSITION_LABELS: Record<string, string> = {
    '1_64':     'Als Entwurf speichern',      // NEW → DRAFT
    '64_256':   'Zur Prüfung einreichen',     // DRAFT → REVIEW
    '64_512':   'Direkt bestätigen',          // DRAFT → CONFIRMED
    '256_512':  'Freigeben',                  // REVIEW → CONFIRMED
    '256_64':   'Zurück an Autor',            // REVIEW → DRAFT
    '512_4096': 'Veröffentlichen',            // CONFIRMED → RELEASED
    '512_256':  'Erneut prüfen',              // CONFIRMED → REVIEW
    '4096_32768': 'Archivieren',              // RELEASED → ARCHIVED
    '4096_512': 'Zurückziehen',               // RELEASED → CONFIRMED
    '32768_4096': 'Wieder veröffentlichen'    // ARCHIVED → RELEASED
}
```

### Return Values

```typescript
return {
    // Status info
    currentStatus,           // Computed<number>
    currentStatusLabel,      // Computed<string>
    currentStatusColor,      // Computed<string>
    currentStatusIcon,       // Computed<string>
    currentStatusMeta,       // Computed<StatusMeta>

    // Options for UI
    availableStatusOptions,  // Computed<StatusOption[]>
    transitionActions,       // Computed<TransitionAction[]>
    canTrash,               // Computed<boolean>

    // Transition
    isTransitioning,        // Ref<boolean>
    transitionError,        // Ref<string | null>
    transitionTo,           // (target: number) => Promise<boolean>
    getTransitionLabel,     // (from: number, to: number) => string

    // Workflow state helpers
    isWorkInProgress,       // Computed<boolean> - NEW or DRAFT
    isAwaitingApproval,     // Computed<boolean> - REVIEW
    isPublished,            // Computed<boolean> - RELEASED or higher
    isTrashed,              // Computed<boolean> - TRASH
    isEditable,             // Computed<boolean> - canEdit && !trashed

    // Re-export permissions
    permissions             // usePostPermissions return
}
```

---

## CSS Architecture

### Opus CSS Conventions Applied

All components follow `docs/dev/features/theme-opus-css.md`:

1. **rem units** (no px):
   ```css
   padding: 0.5rem 0.75rem;
   gap: 0.25rem;
   border-radius: 0.25rem;
   ```

2. **CSS Variables** for theming:
   ```css
   background: var(--color-background-soft);
   border: 1px solid var(--color-border);
   color: var(--color-text-muted);
   transition: var(--transition);
   ```

3. **Color variants** via classes:
   ```css
   .status-muted    { background: var(--color-muted-bg); }
   .status-primary  { background: var(--color-primary-bg); }
   .status-warning  { background: var(--color-warning-bg); }
   .status-positive { background: var(--color-positive-bg); }
   .status-secondary{ background: var(--color-secondary-bg); }
   .status-negative { background: var(--color-negative-bg); }
   ```

4. **Consistent spacing scale** (0.25rem multiples):
   - `0.25rem` - tight gaps
   - `0.5rem` - button padding, small gaps
   - `0.75rem` - section gaps
   - `1rem` - container padding

### Status Color Mapping

| Status | Color | CSS Variable | Usage |
|--------|-------|--------------|-------|
| NEW | muted | `--color-muted-bg` | Gray, initial state |
| DEMO | secondary | `--color-secondary-bg` | Purple, preview |
| DRAFT | warning | `--color-warning-bg` | Yellow/orange, in progress |
| REVIEW | accent | `--color-secondary-bg` | Purple, awaiting |
| CONFIRMED | positive | `--color-positive-bg` | Green, approved |
| RELEASED | primary | `--color-primary-bg` | Theaterpedia green |
| ARCHIVED | dimmed | `--color-muted-bg` + opacity | Faded |
| TRASH | negative | `--color-negative-bg` | Red, danger |

---

## Integration Examples

### In PostCard

```vue
<template>
    <div class="post-card">
        <div class="post-card-header">
            <PostStatusBadge
                :post="post"
                :project="project"
                :membership="membership"
                @status-changed="$emit('refresh')"
            />
        </div>
        <!-- ... rest of card -->
    </div>
</template>

<script setup>
import PostStatusBadge from '@/components/PostStatusBadge.vue'
</script>
```

**[Screenshot 9: PostCard with PostStatusBadge]**
> Shows a PostCard component with PostStatusBadge integrated in the header area. Badge displays current status, card shows post image and title below.

### In EditPanel (Future Enhancement)

Replace current status dropdown with StatusEditor:

```vue
<!-- Current implementation (to be replaced) -->
<select v-model="formData.status">
    <option v-for="status in availableStatuses" :value="status.raw_value">
        {{ status.display_name }}
    </option>
</select>

<!-- Enhanced implementation -->
<StatusEditor
    :post="currentPost"
    :project="currentProject"
    :membership="currentMembership"
    @status-changed="formData.status = $event"
/>
```

### Standalone Usage

```vue
<template>
    <div class="post-detail">
        <h1>{{ post.heading }}</h1>
        
        <StatusEditor
            :post="post"
            :project="project"
            @status-changed="handleStatusChanged"
            @trash="handleTrash"
            @error="showError"
        />
        
        <div class="post-content" v-html="renderedContent" />
    </div>
</template>
```

**[Screenshot 10: StatusEditor in Post Detail View]**
> Shows StatusEditor embedded in a post detail page, below the heading. Full width display with all transition options visible.

---

## Deprecation Notes

### Components to Deprecate

The following components should be marked as deprecated:

| Component | Lines | Reason |
|-----------|-------|--------|
| `StatusDropdown.vue` | 273 | Uses old sysreg API, no permission awareness, manual click-outside |
| `StatusToggler.vue` | 120 | Uses old `useStatus` composable, TypeScript types mismatch |
| `StatusBadge.vue` | 100 | Uses old `useStatus`, no edit capability |

### Migration Path

1. Replace `StatusDropdown` → `StatusEditor` (in panels)
2. Replace `StatusToggler` → `StatusEditor` (for button-style UI)
3. Replace `StatusBadge` → `PostStatusBadge` (for inline display with edit)

---

## Testing

### Unit Tests

The underlying `posts-permissions.ts` has 88 unit tests covering all 15 rules:
- Location: `tests/unit/posts-permissions.test.ts`
- Coverage: All permission rules, all status values, all role combinations

### Manual Testing Scenarios

1. **As Owner (Hans):**
   - Create new post → should see "Als Entwurf speichern"
   - In DRAFT → should see "Zur Prüfung" and "Direkt bestätigen"
   - In REVIEW → should see "Freigeben" and "Zurück an Autor"

2. **As Member (Nina):**
   - Own post in DRAFT → should see "Zur Prüfung einreichen"
   - Other's post → should not see StatusEditor (no edit permission)

3. **As Participant (Rosa):**
   - Own post → limited transitions based on status
   - Other's post → no edit access

4. **As Partner (Marc):**
   - Can only view, no status editing

---

## Known Limitations

1. **API Integration:** `transitionTo()` uses simple PATCH call - may need enhanced error handling for concurrent edits

2. **Optimistic Updates:** Currently waits for API response before updating UI - could add optimistic update pattern

3. **Keyboard Navigation:** Basic support via native button/select - could enhance with arrow key navigation in button mode

4. **Theme Isolation:** When used in floating-vue, inherits page theme - may need explicit system theme override for panels with custom themes

---

## Future Enhancements

- [ ] Add keyboard shortcuts (e.g., `Ctrl+Enter` for primary action)
- [ ] Add undo functionality after transition
- [ ] Add transition confirmation dialog for destructive actions
- [ ] Add transition history/audit log display
- [ ] Add batch status update for multiple posts
- [ ] Integrate with notification system for review requests

---

## Related Documentation

- [Posts Permissions Rules](/docs/devdocs/POSTS_PERMISSIONS_SPEC.md)
- [Test Infrastructure](/docs/devdocs/TEST_INFRASTRUCTURE.md)
- [Theme System & Opus CSS](/docs/dev/features/theme-opus-css.md)
- [Floating Vue and Panels Guide](/chat/FLOATING_VUE_AND_PANELS_GUIDE.md)

---

## Implementation Status: Config-Driven Capabilities ✅

### Migration Complete (Dec 5, 2025)

The permission system has been migrated from hardcoded TypeScript rules to **sysreg_config** table:

```
┌─────────────────────────────────────────────────────────────┐
│                      sysreg_config                          │
│  (Single Source of Truth for all capability rules)          │
├─────────────────────────────────────────────────────────────┤
│  Migration 051: capabilities_matrix_v2                      │
│  - Capabilities: read, update, manage, list, share          │
│  - Transitions: name + taglogic (category/subcategory)      │
│  - Scopes: team, login, project, regio, public (toggles)    │
└─────────────────────────────────────────────────────────────┘
         ↓                   ↓                   ↓
   r_* triggers          API endpoint       UI composables
   (DB level)        /api/sysreg/caps      useCapabilities
```

### Implementation Phases Completed

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: r-flags | ✅ Done | Triggers read sysreg_config (migrations 045-048) |
| Phase 2: StatusEditor | ✅ Done | `useCapabilities` fetches from API |
| Phase 2b: taglogic | ✅ Done | Primary/alternative transition hierarchy |
| Phase 3: API middleware | 🔄 Partial | `/api/sysreg/capabilities` endpoint done |
| Phase 4: Deprecate utils | ⏳ Future | Keep `posts-permissions.ts` as fallback |

### sysreg_config Entry Structure

```typescript
// Example: Primary transition (category)
{
  name: 'post_transition_draft_review_creator',
  value: ENTITY_POST | STATE_DRAFT,  // bit pattern
  taglogic: 'category',               // → primary button
  description: 'Creator submits draft for review',
  metadata: { from: 64, to: 256 }
}

// Example: Alternative transition (subcategory)
{
  name: 'post_alt_transition_draft_confirmed_P_owner',
  value: ENTITY_POST | STATE_DRAFT,
  taglogic: 'subcategory',            // → smaller button
  description: 'Project owner directly confirms draft',
  metadata: { from: 64, to: 512 }
}
```

### Naming Convention

See `docs/devdocs/CAPABILITIES_NAMING_CONVENTION.md` for full details:

| Prefix | Meaning |
|--------|---------|
| `post_transition_*` | Primary workflow transition (category) |
| `post_alt_transition_*` | Alternative transition (subcategory) |
| `post_scope_*` | Visibility toggle (toggle) |
| `post_cap_*` | Capability flag (read, update, etc.) |
<StatusConfigPanel 
### Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| StatusConfigPanel | Low | Admin UI to edit sysreg_config transitions inline |
| Per-project overrides | Low | Allow projects to customize default capabilities |
| Caching | Medium | Client-side caching with invalidation on config change |
| Batch transitions | Low | Apply status change to multiple posts |

### Resolved Questions (from Dec 4 Sunrise Talk)

1. **Transition metadata:** Using `taglogic` field (category/subcategory/toggle)
2. **Naming convention:** `post_transition_*` vs `post_alt_transition_*` prefix
3. **Fallback behavior:** Default-deny (no config = no capability)
4. **Per-project overrides:** Deferred to future sprint

---

*Last updated: December 5, 2025*
