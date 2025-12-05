# 📋 Report 5: Implementation Plan & Coding Guidance

**Date:** December 5, 2025  
**Status:** Ready for Implementation  
**Priority:** Consolidated Action Plan

---

## Executive Summary

This report consolidates the design proposals from Reports 1-4 into an actionable implementation plan with:
- Prioritized task list
- Component specifications
- File structure
- Dependencies
- Testing strategy

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

| Task | Component | Priority | Estimate |
|------|-----------|----------|----------|
| 1.1 | `StateFlowTimeline.vue` | HIGH | 4h |
| 1.2 | `TransitionSummary.vue` | HIGH | 4h |
| 1.3 | Update `ProjectActivationPanel.vue` | HIGH | 4h |
| 1.4 | `RoleBadge.vue` variants | HIGH | 3h |
| 1.5 | `PermissionTooltip.vue` | HIGH | 2h |
| 1.6 | `useResponsive.ts` composable | HIGH | 1h |
| 1.7 | `BottomSheet.vue` | HIGH | 3h |
| 1.8 | Mobile activation panel CSS | HIGH | 2h |

**Total: ~23h**

### Phase 2: Post-IT System (Week 2-3)

| Task | Component | Priority | Estimate |
|------|-----------|----------|----------|
| 2.1 | `PostITNote.vue` | HIGH | 4h |
| 2.2 | `PostITBoard.vue` | HIGH | 4h |
| 2.3 | `PostITComposer.vue` | HIGH | 3h |
| 2.4 | `PostITThread.vue` | MEDIUM | 3h |
| 2.5 | `PostITSidebar.vue` | MEDIUM | 2h |
| 2.6 | `PostITBottomSheet.vue` | HIGH | 2h |
| 2.7 | `usePostITComments.ts` | HIGH | 4h |
| 2.8 | Comments API endpoints | HIGH | 4h |
| 2.9 | Comments database migration | HIGH | 2h |

**Total: ~28h**

### Phase 3: Integration (Week 3-4)

| Task | Component | Priority | Estimate |
|------|-----------|----------|----------|
| 3.1 | Integrate timeline in activation panel | HIGH | 2h |
| 3.2 | Add transition summaries API | HIGH | 3h |
| 3.3 | Team list with role badges | HIGH | 3h |
| 3.4 | Permission tooltips integration | HIGH | 2h |
| 3.5 | Stepper breakout for comments | HIGH | 3h |
| 3.6 | Frontend sidebar comments | MEDIUM | 3h |
| 3.7 | Mobile menu integration | HIGH | 2h |

**Total: ~18h**

---

## File Structure

```
src/
├── components/
│   ├── workflow/
│   │   ├── StateFlowTimeline.vue
│   │   ├── TransitionSummary.vue
│   │   ├── ProjectActivationPanel.vue (update)
│   │   └── ProjectWorkflowWrapper.vue (update)
│   │
│   ├── comments/
│   │   ├── PostITNote.vue
│   │   ├── PostITBoard.vue
│   │   ├── PostITThread.vue
│   │   ├── PostITComposer.vue
│   │   ├── PostITSidebar.vue
│   │   └── PostITBottomSheet.vue
│   │
│   ├── badges/
│   │   ├── RoleBadge.vue
│   │   ├── RoleBadgeCompact.vue
│   │   ├── RoleBadgeExpanded.vue
│   │   └── PermissionTooltip.vue
│   │
│   └── mobile/
│       ├── BottomSheet.vue
│       ├── MobileMenu.vue
│       └── MobileHeader.vue
│
├── composables/
│   ├── useProjectActivation.ts (update)
│   ├── usePostITComments.ts
│   ├── usePermissionTooltip.ts
│   ├── useTransitionSummary.ts
│   └── useResponsive.ts
│
└── styles/
    ├── postit-colors.css
    └── mobile.css

server/
├── api/
│   ├── comments/
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   ├── [id].patch.ts
│   │   └── [id].delete.ts
│   │
│   └── sysreg/
│       ├── transition-summary.get.ts
│       └── permission-info.get.ts
│
└── database/
    └── migrations/
        └── 055_create_comments.ts
```

---

## Component Specifications

### StateFlowTimeline.vue

```typescript
// Props
interface Props {
  currentStatus: number
  allowedTargets: number[]
  selectedTarget?: number
  compact?: boolean  // For mobile
  interactive?: boolean // Allow clicking nodes
}

// Emits
interface Emits {
  (e: 'select', status: number): void
}

// States to display
const STATES = [
  { value: 1, name: 'new', label: 'NEW', layout: 'stepper' },
  { value: 8, name: 'demo', label: 'DEMO', layout: 'stepper' },
  { value: 64, name: 'draft', label: 'DRAFT', layout: 'dashboard' },
  { value: 512, name: 'confirmed', label: 'CONF', layout: 'dashboard' },
  { value: 4096, name: 'released', label: 'REL', layout: 'dashboard' },
  { value: 32768, name: 'archived', label: 'ARCH', layout: 'dashboard' },
]
```

### PostITNote.vue

```typescript
// Props
interface Props {
  id: string
  content: string
  authorName: string
  authorRelation: ProjectRelation
  createdAt: string
  isPinned?: boolean
  reactions?: { emoji: string; count: number }[]
  replyCount?: number
}

// Emits
interface Emits {
  (e: 'reply'): void
  (e: 'react', emoji: string): void
  (e: 'pin'): void
  (e: 'edit'): void
}

// Auto-color by role
function getColorForRole(relation: ProjectRelation): PostITColor {
  const colorMap = {
    p_owner: 'orange',
    p_creator: 'purple',
    member: 'yellow',
    participant: 'blue',
    partner: 'green',
    anonym: 'yellow'
  }
  return colorMap[relation]
}
```

### BottomSheet.vue

```typescript
// Props
interface Props {
  isOpen: boolean
  initialHeight?: string  // '50vh' default
  maxHeight?: string      // '90vh' default
  persistent?: boolean    // Can't dismiss by clicking overlay
}

// Emits
interface Emits {
  (e: 'close'): void
  (e: 'update:isOpen', value: boolean): void
}

// Touch handling
// - Drag down to dismiss
// - Snap points: collapsed, half, full
```

---

## API Specifications

### GET /api/sysreg/transition-summary

```typescript
// Request
GET /api/sysreg/transition-summary?from=8&to=64&project_type=topic

// Response
interface TransitionSummaryResponse {
  fromState: {
    value: number
    name: string
    layout: 'stepper' | 'dashboard'
  }
  toState: {
    value: number
    name: string
    layout: 'stepper' | 'dashboard'
  }
  changes: {
    relation: ProjectRelation
    icon: string
    label: string
    gainedCapabilities: string[]  // From sysreg_config.description
    lostCapabilities: string[]
  }[]
  layoutChange: boolean
  isSkip: boolean
}
```

### GET /api/comments

```typescript
// Request
GET /api/comments?entity_type=post&entity_id=abc123&project_id=opus1

// Response
interface CommentsResponse {
  comments: Comment[]
  total: number
  hasMore: boolean
}

interface Comment {
  id: string
  entity_type: string
  entity_id: string
  parent_id: string | null
  author: {
    id: string
    name: string
    relation: ProjectRelation
  }
  content: string
  color: PostITColor
  is_pinned: boolean
  reactions: { emoji: string; count: number; hasReacted: boolean }[]
  reply_count: number
  created_at: string
  updated_at: string
}
```

### POST /api/comments

```typescript
// Request
POST /api/comments
{
  entity_type: 'post' | 'project' | 'event' | 'image',
  entity_id: string,
  project_id: string,
  parent_id?: string,  // For replies
  content: string
}

// Response
interface CreateCommentResponse {
  success: boolean
  comment: Comment
}
```

---

## Database Migration

```sql
-- Migration 055: Create comments system

-- Main comments table
CREATE TABLE comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'project', 'event', 'image')),
  entity_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reactions table
CREATE TABLE comment_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

-- Computed reply count (view)
CREATE OR REPLACE VIEW comments_with_counts AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) as reply_count,
  (SELECT COUNT(*) FROM comment_reactions cr WHERE cr.comment_id = c.id) as reaction_count
FROM comments c;
```

---

## CSS Variables (Opus Convention)

```css
/* src/styles/postit-colors.css */
/* Following Opus CSS conventions: oklch color space, theme vars, monospace font */

:root {
  /* Post-IT Colors (oklch for perceptual uniformity) */
  --postit-yellow: oklch(92% 0.12 95);     /* warm sticky yellow */
  --postit-pink: oklch(78% 0.14 350);      /* soft pink */
  --postit-blue: oklch(82% 0.10 230);      /* sky blue */
  --postit-green: oklch(80% 0.12 145);     /* soft green */
  --postit-orange: oklch(85% 0.14 65);     /* warm orange (p_owner) */
  --postit-purple: oklch(78% 0.12 300);    /* lavender (p_creator) */
  
  /* Derived from Opus theme (00-theme.css) */
  --postit-text: var(--color-contrast);
  --postit-muted: var(--color-muted-contrast);
  --postit-border: var(--color-border);
  
  /* Shadow effects (oklch alpha channel) */
  --postit-shadow: 2px 3px 8px oklch(0% 0 0 / 0.15);
  --postit-tape-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
  --postit-hover-shadow: 4px 6px 12px oklch(0% 0 0 / 0.2);
  
  /* Role Badge Colors (oklch) */
  --badge-owner-bg: oklch(85% 0.14 65);
  --badge-owner-fg: oklch(35% 0.08 65);
  --badge-creator-bg: oklch(78% 0.12 300);
  --badge-creator-fg: oklch(35% 0.12 300);
  --badge-member-bg: oklch(92% 0.12 95);
  --badge-member-fg: oklch(40% 0.08 95);
  --badge-participant-bg: oklch(82% 0.10 230);
  --badge-participant-fg: oklch(35% 0.08 230);
  --badge-partner-bg: oklch(80% 0.12 145);
  --badge-partner-fg: oklch(30% 0.10 145);
  
  /* Touch targets (mobile) */
  --touch-target-min: 44px;
  
  /* Animation - inherit from Opus 01-variables.css */
  --postit-ease: var(--ease, cubic-bezier(0.4, 0, 0.2, 1));
  --postit-duration: var(--duration, 150ms);
  --postit-transition: all var(--postit-duration) var(--postit-ease);
}

/* Note: --font is already defined in 00-theme.css as monospace */
/* Note: --radius-* vars already defined in 01-variables.css */
/* Note: --border-button already defined in 00-theme.css */
```

### Button Treatment Reference

```css
/* Opus button conventions (from existing components) */
.opus-btn {
  padding: 0.5rem 1rem;
  font-family: var(--font);                /* monospace */
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-button, 0.25rem);
  border: var(--border-button, 0.0625rem) solid currentColor;
  cursor: pointer;
  transition: var(--transition);
}

.opus-btn-primary {
  background: var(--color-primary-base);
  color: var(--color-primary-contrast);
  border-color: var(--color-primary-base);
}

.opus-btn-primary:hover {
  background: var(--color-primary-hover);
}

.opus-btn-secondary {
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  border-color: var(--color-border);
}

.opus-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/components/StateFlowTimeline.spec.ts

describe('StateFlowTimeline', () => {
  it('renders all states', () => {})
  it('highlights current state', () => {})
  it('marks passed states with checkmark', () => {})
  it('shows allowed targets as selectable', () => {})
  it('emits select event on click', () => {})
  it('shows compact view on mobile', () => {})
})

// tests/components/PostITNote.spec.ts

describe('PostITNote', () => {
  it('renders content', () => {})
  it('applies correct color for role', () => {})
  it('shows tape effect', () => {})
  it('displays author and timestamp', () => {})
  it('shows reply count if has replies', () => {})
  it('emits reply event', () => {})
})
```

### E2E Tests

```typescript
// tests/e2e/activation-workflow.spec.ts

describe('Activation Workflow', () => {
  it('shows timeline in activation panel', () => {})
  it('displays transition summary when selecting target', () => {})
  it('shows checklist with fix buttons', () => {})
  it('activates project to new state', () => {})
  it('switches layout from stepper to dashboard', () => {})
})

// tests/e2e/comments.spec.ts

describe('Post-IT Comments', () => {
  it('shows comment board on projects page', () => {})
  it('shows sidebar on frontend', () => {})
  it('creates new comment', () => {})
  it('threads replies correctly', () => {})
  it('applies role-based colors', () => {})
})
```

---

## Quick Start Commands

```bash
# Create component directories
mkdir -p src/components/{workflow,comments,badges,mobile}
mkdir -p src/composables
mkdir -p src/styles

# Create API directories
mkdir -p server/api/{comments,sysreg}

# Generate component stubs
touch src/components/workflow/{StateFlowTimeline,TransitionSummary}.vue
touch src/components/comments/{PostITNote,PostITBoard,PostITThread,PostITComposer,PostITSidebar,PostITBottomSheet}.vue
touch src/components/badges/{RoleBadge,RoleBadgeCompact,RoleBadgeExpanded,PermissionTooltip}.vue
touch src/components/mobile/{BottomSheet,MobileMenu,MobileHeader}.vue

# Create composables
touch src/composables/{usePostITComments,usePermissionTooltip,useTransitionSummary,useResponsive}.ts

# Create styles
touch src/styles/{postit-colors,mobile}.css

# Create API files
touch server/api/comments/{index.get,index.post,[id].patch,[id].delete}.ts
touch server/api/sysreg/{transition-summary.get,permission-info.get}.ts

# Create migration
touch server/database/migrations/055_create_comments.ts
```

---

## Dependencies

No new npm dependencies required. Using:
- Vue 3 (existing)
- CSS custom properties (native) - oklch color space
- Teleport for modals (Vue 3 built-in)
- Touch events (native)

**Opus CSS Foundation (already in codebase):**
- `src/assets/css/00-theme.css` - Theme colors in oklch, `--font`
- `src/assets/css/01-variables.css` - `--radius-*`, `--border-*`, `--ease`, `--duration`
- `src/assets/css/03-base.css` - Reset, responsive breakpoint

---

## Opus CSS Conventions Checklist

When implementing components, follow these conventions:

- [ ] Use `oklch()` for all colors (not `rgb`, `hsl`, or hex)
- [ ] Use `oklch(... / alpha)` for transparency (not `rgba`)
- [ ] Use `var(--font)` for monospace font (not custom font stack)
- [ ] Use `var(--radius-small/medium/large)` for border radius
- [ ] Use `var(--border-button)` for border widths
- [ ] Use `var(--transition)` or `var(--duration) var(--ease)` for animations
- [ ] Use `var(--color-*)` theme variables (primary, muted, contrast, etc.)
- [ ] Buttons: padding `0.5rem 1rem`, font-weight 500
- [ ] Mobile: min touch target 44x44px
- [ ] Safe areas: `env(safe-area-inset-*)` for notch/home indicator

---

## Summary

| Report | Components | Estimate | Status |
|--------|------------|----------|--------|
| Report 1 | StateFlowTimeline, TransitionSummary | 12h | Ready |
| Report 2 | Post-IT System (6 components) | 28h | Ready |
| Report 3 | Role Badges, Permission Tooltips | 10h | Ready |
| Report 4 | Mobile (BottomSheet, MobileMenu) | 10h | Ready |
| **Total** | **15 components** | **~60h** | **Ready** |

---

## Next Steps

1. ✅ Review reports and approve designs
2. ✅ Updated all reports with Opus CSS conventions
3. Start with Phase 1: Foundation components
4. Build API endpoints in parallel
5. Test on mobile devices early
6. Iterate based on feedback

---

*All reports saved to `chat/imagination/REPORT-*.md`  
*Updated with Opus CSS conventions: oklch, theme vars, button treatment*
