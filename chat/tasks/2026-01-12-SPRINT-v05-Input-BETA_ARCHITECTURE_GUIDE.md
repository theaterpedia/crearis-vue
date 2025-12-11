# Beta Architecture Guide

## Overview

This guide documents the architectural decisions and implementations made during the December 2025 beta sprint. It serves as a reference for understanding the current state of the application and the rationale behind key design choices.

---

## 1. Route Architecture: Project-Scoped Navigation

### Design Decision

We moved from a flat route structure to **project-scoped routes**:

```
OLD: /projects → single view with tabs
NEW: /projects/:projectId/:section → route-based navigation
```

### Route Structure

```
/home                           → UserHome (cross-project overview)
/projects/:projectId            → Project Dashboard (home section)
/projects/:projectId/agenda     → Events list
/projects/:projectId/topics     → Posts list  
/projects/:projectId/partners   → Partners/Instructors list
/projects/:projectId/settings   → Consolidated settings
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProjectDashboard.vue` | `src/views/project/` | Route-based wrapper, extracts projectId |
| `HomeLayout.vue` | `src/views/` | Cross-project userHome at `/home` |
| `DashboardLayout.vue` | `src/components/dashboard/` | 5-NavStops layout with ListHead |

### NavStops Principle

The 5 NavStops provide consistent navigation across internal dashboards:

| NavStop | Icon | Entity | Label |
|---------|------|--------|-------|
| home | 🏠 | - | HOME |
| agenda | 📅 | events | AGENDA |
| topics | 📝 | posts | TOPICS |
| partners | 👥 | instructors | PARTNERS |
| settings | ⚙️ | - | (cog icon) |

---

## 2. External Page Architecture

### PageLayout vs DashboardLayout

| Aspect | PageLayout | DashboardLayout |
|--------|------------|-----------------|
| Context | External public pages | Internal dashboards |
| Theme | Site-specific themes | Internal theme (Opus/DASEI) |
| Layout | Flexible cols system | Fixed NavStops pattern |
| Auth | Optional | Required |

### Entity Pages

Single-entity views for public consumption:

```
/sites/:domaincode              → ProjectSite.vue (landing)
/sites/:domaincode/posts/:id    → PostPage.vue
/sites/:domaincode/events/:id   → EventPage.vue (NEW)
```

### TODO v0.5: Slug-from-XMLid

Current: `/sites/dasei/events/42`
Target: `/sites/dasei/events/workshop-2024`

```typescript
// Slug derivation from xmlid
// "dasei.event.workshop-2024" → "workshop-2024"
const slug = xmlid.split('.').pop()
```

---

## 3. Component Interaction Patterns

### pList Activation Modes

The `pList` component now supports three interaction patterns:

```typescript
interface Props {
    onActivate?: 'modal' | 'route' | 'route-modal'
}
```

| Mode | Behavior |
|------|----------|
| `modal` | Opens ItemModalCard preview (default) |
| `route` | Navigates directly to entity page |
| `route-modal` | Shows modal with navigation button |

### Trash Icon Integration

Chain of responsibility for trash actions:

```
pList (showTrash prop)
  → ItemList (showTrash → options.trash)
    → ItemTile/ItemRow (renders trash icon)
      → @trash emit
    → handleTrash()
  → @item-trash emit
→ Parent handles deletion
```

---

## 4. Settings Consolidation

### From Stepper Steps to Settings Panel

The stepper's "special steps" (theme, pages, images, activate) are now consolidated into `ProjectSettingsPanel.vue`:

```
┌─────────────────────────────────────┐
│ 🎨 Theme, Layout & Navigation    ▼ │
├─────────────────────────────────────┤
│ [Theme] [Layout] [Navigation]       │
│ ┌─────────────────────────────────┐ │
│ │ ThemeConfigPanel / etc.         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📄 Landing-Page & Pages          ▶ │
├─────────────────────────────────────┤
│ 🖼️ Images & Media                ▶ │
├─────────────────────────────────────┤
│ 🚀 Project Activation (owners)   ▶ │
└─────────────────────────────────────┘
```

---

## 5. Status System

### Bit-Based Status Values

From `sysreg_config` Migration 040/041:

```typescript
export const STATUS = {
    NEW: 1,           // bits 0-2
    DEMO: 8,          // bits 3-5
    DRAFT: 64,        // bits 6-8
    CONFIRMED: 512,   // bits 9-11
    CONFIRMED_USER: 1024,
    RELEASED: 4096,   // bits 12-14
    ARCHIVED: 32768,  // bit 15
    TRASH: 65536      // bit 16
}
```

### Status Constants Location

`src/utils/status-constants.ts` - Single source of truth

---

## 6. Theme System

### Current: Opus Theme

- Medium rounded corners
- `data-context="internal"` attribute
- Variants: `warm`, `cool`

### Proposed: DASEI Theme

- No rounded corners (`border-radius: 0`)
- Horizontal dividers between header/body
- Different spacing model

Implementation via `data-internal-theme="opus|dasei"` attribute.

See: `docs/DASEI_THEME_PROPOSAL.md`

---

## 7. File Organization

### Key Directories

```
src/
├── components/
│   ├── clist/           # ItemList, ItemTile, ItemRow, types
│   ├── dashboard/       # DashboardLayout, ProjectSettingsPanel
│   ├── nav/             # ListHead, FilterChip
│   ├── onboarding/      # OnboardingStepper
│   └── page/            # pList, pGallery (external pages)
├── utils/
│   ├── status-constants.ts
│   └── onboarding-config.ts
├── views/
│   ├── project/         # ProjectDashboard, ProjectMain, steps
│   ├── Home/            # StartPage, HomePage, etc.
│   ├── HomeLayout.vue   # UserHome dashboard
│   ├── PostPage.vue     # Single post view
│   └── EventPage.vue    # Single event view
└── router/
    └── index.ts         # All routes

docs/
├── BETA_ARCHITECTURE_GUIDE.md    # This file
├── DASEI_THEME_PROPOSAL.md       # Theme design
├── USER_STATES_VALIDATION_REPORT.md
└── HARDCODED_CAPABILITIES_AUDIT.md

server/database/
└── setup-demo-project.ts         # Demo project script
```

---

## 8. Migration Notes

### From Legacy to New Architecture

| Legacy | New | Notes |
|--------|-----|-------|
| `/projects` single view | `/projects/:id/:section` | Route-based |
| Stepper special steps | ProjectSettingsPanel | Consolidated |
| Hardcoded usermode | STATUS constants | sysreg-aligned |
| pList modal-only | pList 3 modes | navigate, route-modal |

### Breaking Changes to Watch

1. **Route params**: `projectId` now from route, not prop
2. **Settings access**: Via COG NavStop, not stepper step
3. **Event pages**: New route `/sites/:domaincode/events/:id`

---

## 9. Testing Priorities

See: `docs/TDD_RECOVERY_PLAN.md`

Key areas needing test coverage:
1. Route-based navigation (ProjectDashboard)
2. pList interaction modes
3. Trash icon event chain
4. Status transitions
5. Onboarding step progression

---

*Last Updated: December 10, 2025*
*Sprint: alpha/dashboard*
