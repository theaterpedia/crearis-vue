# StatusEditor & PostStatusBadge Guide

> **Version:** 1.0 (December 4, 2025)  
> **Sprint:** Projectlogin Workflow (Dec 1-9)  
> **Status:** Initial Implementation

## Overview

The **StatusEditor** and **PostStatusBadge** components provide a complete UI for managing post status transitions within the Crearis platform. They implement a permission-aware workflow system that respects the 15 rules defined in `posts-permissions.ts`.

### Architecture Layers

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
│                    Composables                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  usePostStatus.ts   │───▶│  usePostPermissions.ts      │ │
│  │  (UI state/actions) │    │  (Permission logic)         │ │
│  └─────────────────────┘    └──────────────┬──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Utils                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              posts-permissions.ts                       ││
│  │              (15 rules, single source of truth)         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Component: StatusEditor.vue

**Location:** `src/components/StatusEditor.vue`  
**Lines:** ~450  
**Dependencies:** `usePostStatus`, Lucide icons, Opus CSS

### Purpose

StatusEditor provides a complete workflow UI for changing post status. It displays:
- Current status with icon, label, and description
- Available transition actions as buttons or dropdown
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

**[Screenshot 3: StatusEditor - REVIEW Status (Owner View)]**
> Shows owner perspective with REVIEW status. Actions: "Freigeben" (primary), "Zurück an Autor". Demonstrates owner-specific transitions.

**[Screenshot 4: StatusEditor - Dropdown Mode (>4 transitions)]**
> Shows dropdown mode when more than 4 transitions available. Select element with "Aktion wählen..." placeholder and "Anwenden" button.

**[Screenshot 5: StatusEditor - Trashed State]**
> Shows trashed post state with negative background color, trash icon, "Dieser Beitrag ist im Papierkorb" message, and "Wiederherstellen" button.

### Template Structure

```vue
<div class="status-editor">
    <!-- Header: Icon + Title + Trash Button -->
    <div class="status-header">
        <GitPullRequestDraft class="header-icon" />
        <div class="header-info">
            <h3>Status ändern</h3>
            <p>Aktuell: <strong>{{ currentStatusLabel }}</strong></p>
        </div>
        <button v-if="canTrash" class="trash-button">
            <Trash2 />
        </button>
    </div>

    <!-- Current Status Badge -->
    <div class="current-status">
        <span class="status-badge">
            {{ currentStatusIcon }} {{ currentStatusLabel }}
        </span>
        <span class="status-description">{{ description }}</span>
    </div>

    <!-- Transition Controls (buttons or dropdown) -->
    <div class="transition-controls">
        <!-- ≤4 transitions: horizontal buttons -->
        <!-- >4 transitions: dropdown + apply button -->
    </div>

    <!-- States: No transitions, Trashed, Loading, Error -->
</div>
```

### Adaptive UI Pattern

Borrowed from **TagGroupEditor.vue**:

```vue
<!-- Horizontal buttons for ≤4 options -->
<div v-if="transitionActions.length <= 4" class="transition-buttons">
    <button v-for="action in transitionActions" ...>
        {{ action.icon }} {{ action.label }}
    </button>
</div>

<!-- Dropdown for >4 options -->
<div v-else class="transition-dropdown">
    <select v-model="selectedTransition">
        <option :value="null">Aktion wählen...</option>
        <option v-for="action in transitionActions" ...>
            {{ action.icon }} {{ action.label }}
        </option>
    </select>
    <button @click="handleApply">Anwenden</button>
</div>
```

### Lucide Icons Used

| Icon | Usage |
|------|-------|
| `GitPullRequestDraft` | Header icon (workflow concept) |
| `Check` | Apply button |
| `Trash2` | Trash button, trashed state |
| `RotateCcw` | Restore button |
| `AlertCircle` | No transitions available |
| `XCircle` | Error message |
| `Loader2` | Loading spinner |

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

## Composable: usePostStatus.ts

**Location:** `src/composables/usePostStatus.ts`  
**Lines:** ~310  
**Dependencies:** `usePostPermissions`

### Purpose

Bridge between `usePostPermissions` (logic) and StatusEditor UI. Provides:
- Status metadata (labels, colors, icons, descriptions)
- Transition action labels
- Workflow state helpers
- API call for status transition

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

## Further Planning: Table-Driven Capabilities

### Current State: Utils-Driven Architecture

The current permission system uses **hardcoded rules in TypeScript**:

```
posts-permissions.ts (server)
         ↓
usePostPermissions.ts (client composable)
         ↓
StatusEditor.vue / PostStatusBadge.vue (UI)
```

**Advantages:**
- Type-safe, compile-time checked
- Fast execution (no DB lookups)
- Clear rule naming (POST_OWNER_FULL, etc.)

**Disadvantages:**
- Requires code deployment to change rules
- Rules duplicated between server and client
- No per-project customization possible
- Hard to audit/visualize all capabilities

### Target State: sysreg_config as Single Source of Truth

The goal is to move capability rules from TypeScript into **sysreg_config** table:

```
┌─────────────────────────────────────────────────────────────┐
│                      sysreg_config                          │
│  (Single Source of Truth for all capability rules)          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ r_* triggers │    │ API middleware│    │ UI composables│ │
│  │ (DB level)   │    │ (server)     │    │ (client)      │ │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ↑                   ↑                   ↑          │
│         └───────────────────┴───────────────────┘          │
│                    All read from sysreg_config             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Proposals

#### Proposal A: Gradual Migration (Recommended)

1. **Phase 1: r-flags from config** (Done ✅)
   - Triggers already read sysreg_config to set `r_owner`, `r_member`, etc.
   - Migrations 045-048 implemented this

2. **Phase 2: StatusEditor reads config**
   - `usePostStatus` fetches allowed transitions from sysreg_config
   - Keep `posts-permissions.ts` as server-side validator
   - Config entries define: entity + state + from_status + to_status + roles

3. **Phase 3: API middleware from config**
   - Create `checkCapability(entity, action)` middleware factory
   - Middleware reads sysreg_config, validates against user role
   - Replace hardcoded permission checks in API routes

4. **Phase 4: Deprecate posts-permissions.ts**
   - All rules now in sysreg_config
   - TypeScript constants remain for STATUS values only
   - Remove rule functions, keep only types

#### Proposal B: New Transition Config Entries

Add transition-specific entries to sysreg_config:

```typescript
// Example config entry for "draft→review" transition
{
  name: 'post_transition_draft_review',
  value: ENTITY_POST | STATE_DRAFT | ROLE_OWNER | ROLE_MEMBER,
  description: 'Creator/member can submit draft for review',
  metadata: {
    from_status: 64,    // DRAFT
    to_status: 256,     // REVIEW  
    action: 'submit'
  }
}
```

This extends the existing capability bit pattern with transition semantics.

#### Proposal C: StatusConfigPanel Wrapper

Create `StatusConfigPanel.vue` that wraps StatusEditor with:
- Live reload from sysreg_config
- Admin mode to edit transitions inline
- Preview mode to see "who can do what"

```vue
<StatusConfigPanel 
  :post="post" 
  :project="project"
  :admin-mode="isAdmin"
/>
```

### Migration Path for 15 Rules

| Rule | Current Location | Target Location |
|------|------------------|-----------------|
| POST_ALLROLE_READ_RELEASED | posts-permissions.ts | sysreg_config entry |
| POST_OWNER_FULL | posts-permissions.ts | sysreg_config entry |
| POST_READ_P_OWNER | posts-permissions.ts | sysreg_config entry |
| POST_READ_P_MEMBER_DRAFT | posts-permissions.ts | sysreg_config entry |
| ... | ... | ... |

### Scope Toggles Integration

The recently added scope toggles (TEAM, LOGIN, PROJECT, REGIO, PUBLIC) should be:
- Stored as bits 17-21 in post.status
- Interpreted by sysreg_config entries for visibility rules
- Displayed in StatusEditor's scope toggles section

### Open Questions for Sunrise Talk

1. **Transition metadata:** Embed in sysreg_config.value bits, or use separate JSONB field?
2. **Caching strategy:** How to invalidate client cache when sysreg_config changes?
3. **Fallback behavior:** What happens if no matching config entry? Default-deny or error?
4. **Per-project overrides:** Allow projects to customize default capabilities?

### Timeline Estimate

| Phase | Effort | Target |
|-------|--------|--------|
| Phase 1 (r-flags) | Done | ✅ Dec 2 |
| Phase 2 (StatusEditor) | 2 days | v0.3 |
| Phase 3 (API middleware) | 3 days | v0.4 |
| Phase 4 (Deprecate utils) | 1 day | v0.5 |

---

*Last updated: December 4, 2025*
