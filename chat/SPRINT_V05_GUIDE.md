# Sprint v0.5 Guide for Claude-Hans

## Purpose

This guide helps Claude-Hans navigate the codebase and chat documentation for the v0.5 sprint. It provides context on decisions made, files to reference, and patterns to follow.

---

## Chat Tasks Directory Structure

```
chat/
├── SPRINT_V05_GUIDE.md           # This file
└── tasks/
    ├── 2025-12-10-initialprompt.md   # Current sprint's initial requirements
    ├── [future task files...]
    └── archive/                       # Completed/superseded tasks
```

### Task File Naming Convention

```
YYYY-MM-DD-<descriptor>.md

Examples:
2025-12-10-initialprompt.md     # Sprint kickoff requirements
2025-12-11-tdd-recovery.md      # TDD implementation task
2025-12-12-onboarding-debug.md  # Specific debugging task
```

---

## Key Documentation Files

### Architecture & Design

| File | Purpose |
|------|---------|
| `docs/BETA_ARCHITECTURE_GUIDE.md` | Current architecture decisions |
| `docs/DASEI_THEME_PROPOSAL.md` | DASEI theme implementation plan |
| `docs/CLIST_DESIGN_SPEC.md` | ItemList/ItemTile/ItemRow specs |

### Status & Audit Reports

| File | Purpose |
|------|---------|
| `docs/USER_STATES_VALIDATION_REPORT.md` | User status vs sysreg alignment |
| `docs/HARDCODED_CAPABILITIES_AUDIT.md` | Props to move to sysreg_config |
| `docs/TDD_RECOVERY_PLAN.md` | Test implementation roadmap |

### Database & Config

| File | Purpose |
|------|---------|
| `server/database/migrations/` | Schema migrations (040, 041 key) |
| `server/database/setup-demo-project.ts` | Demo project creation |

---

## Current State Summary (Dec 10, 2025)

### Completed This Sprint

1. **Route Architecture** - Project-scoped routes (`/projects/:id/:section`)
2. **EventPage** - Single event view at `/sites/:domaincode/events/:id`
3. **pList Modes** - `modal`, `route`, `route-modal` activation
4. **Trash Integration** - showTrash prop chain through clist components
5. **Settings Panel** - Consolidated stepper steps into ProjectSettingsPanel
6. **Status Constants** - `src/utils/status-constants.ts`
7. **Onboarding Config** - 5-phase onboarding in `src/utils/onboarding-config.ts`

### Pending/TODO

1. **TDD Recovery** - Tests for new components (see TDD_RECOVERY_PLAN.md)
2. **DASEI Theme** - CSS implementation
3. **Slug URLs** - `slug-from-xmlid` for SEO
4. **Capabilities Migration** - Move hardcoded props to sysreg_config

---

## Component Reference

### NavStops System

```
NavStop ID    Label      Entity      Route Segment
─────────────────────────────────────────────────
home          HOME       -           /
agenda        AGENDA     events      /agenda
topics        TOPICS     posts       /topics
partners      PARTNERS   partners    /partners
settings      (cog)      -           /settings
```

### Status Values (from sysreg_config)

```typescript
STATUS.NEW = 1           // Newly created
STATUS.DEMO = 8          // Demo mode
STATUS.DRAFT = 64        // Draft/unverified
STATUS.CONFIRMED = 512   // Confirmed
STATUS.CONFIRMED_USER = 1024
STATUS.RELEASED = 4096   // Published
STATUS.ARCHIVED = 32768  // Archived
STATUS.TRASH = 65536     // Deleted
```

### pList Props

```typescript
interface pListProps {
    entity: 'posts' | 'events' | 'partners' | ...
    project?: string          // domaincode filter
    onActivate?: 'modal' | 'route' | 'route-modal'
    routePath?: string        // e.g., '/sites/:project/posts/:id'
    showTrash?: boolean       // Show delete icons
    // ... display options
}
```

---

## Debugging Checklist

When encountering issues, check these in order:

### 1. Route Issues
- [ ] Route defined in `src/router/index.ts`?
- [ ] Auth meta correct (`requiresAuth`, `role`)?
- [ ] Component imported correctly (lazy load)?
- [ ] Route params extracted properly?

### 2. Component Issues
- [ ] Props interface matches usage?
- [ ] Emits defined and handled?
- [ ] Composables imported (`useAuth`, `useTheme`)?
- [ ] Template refs working?

### 3. Data Issues
- [ ] API endpoint exists?
- [ ] Status values using constants (not magic numbers)?
- [ ] JSONB fields parsed correctly?
- [ ] Null/undefined handled?

### 4. Style Issues
- [ ] CSS variables defined?
- [ ] Scoped styles not leaking?
- [ ] Theme context set (`data-context="internal"`)?

---

## Common Patterns

### Route-Based Props

```typescript
// In component
const route = useRoute()
const projectId = computed(() => route.params.projectId as string)
const section = computed(() => {
    const path = route.path
    if (path.endsWith('/agenda')) return 'agenda'
    if (path.endsWith('/topics')) return 'topics'
    // ...
    return 'home'
})
```

### Status Checking

```typescript
import { STATUS, isStatusAtLeast } from '@/utils/status-constants'

// Check if user is at least confirmed
if (isStatusAtLeast(user.status, STATUS.CONFIRMED_USER)) {
    // Allow action
}
```

### Emit Chain

```typescript
// Child component
const emit = defineEmits<{
    'item-trash': [item: any]
}>()

// In template
@trash="() => emit('item-trash', item)"

// Parent component
<ItemList @item-trash="handleTrash" />
```

---

## Files to Watch

These files are frequently modified and should be checked carefully:

| File | Reason |
|------|--------|
| `src/router/index.ts` | Route changes |
| `src/components/dashboard/DashboardLayout.vue` | NavStops logic |
| `src/components/clist/ItemList.vue` | List interactions |
| `src/components/page/pList.vue` | External page lists |
| `src/utils/status-constants.ts` | Status values |

---

## Testing Commands

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm type-check

# Lint
pnpm lint

# Build check
pnpm build
```

---

## Sprint Workflow

### Daily Pattern

1. **Morning**: Check `chat/tasks/` for current task file
2. **Work**: Implement with reference to architecture docs
3. **Commit**: Meaningful commit messages with context
4. **Update**: Add notes to task file if significant decisions made

### Task File Template

```markdown
# Task: [Title]

## Date: YYYY-MM-DD

## Objective
[What needs to be done]

## Context
[Background information, related files]

## Approach
[How we're solving it]

## Progress
- [ ] Step 1
- [ ] Step 2

## Notes
[Decisions made, blockers, questions]

## Files Changed
- file1.vue
- file2.ts
```

---

## Questions Protocol

When encountering ambiguity:

1. **Check existing docs** - Architecture guide, design specs
2. **Check sysreg_config** - Database is source of truth for capabilities
3. **Check recent commits** - `git log --oneline -20`
4. **Ask human** - Document the question and context

---

## Git Conventions

### Branch Naming
```
alpha/dashboard     # Current sprint branch
feature/xxx         # Feature branches off alpha
fix/xxx             # Bug fixes
```

### Commit Messages
```
feat: Short description

- Detail 1
- Detail 2

Step X: Category name
- Sub-item
```

---

*Created: December 10, 2025*
*For: v0.5 Sprint (December 2025)*
*Maintainer: Claude-Hans with human oversight*
