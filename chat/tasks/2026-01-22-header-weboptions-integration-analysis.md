# Header System & WebOptions Integration Analysis

**Date:** 2026-01-22  
**Sprint:** v0.5 Odoo Integration  
**Purpose:** Consolidate December 2025 analysis reports with current docs for implementation decisions

---

## Source Files Analyzed

| Report (Dec 2025) | Focus | Current Relevance |
|-------------------|-------|-------------------|
| [header-type-size-investigation.md](../reports/2025-12-15-header-type-size-investigation.md) | Odoo model ↔ Vue component alignment | **HIGH** - Core implementation spec |
| [header-system-answers.md](../reports/2025-12-15-header-system-answers.md) | Q&A for architecture decisions | **HIGH** - Contains action items |
| [formatoptions-system-analysis.md](../reports/2025-12-15-formatoptions-system-analysis.md) | Full formatOptions vs header-only | **MEDIUM** - Strategic decision |
| [weboptions-crosscheck-analysis.md](../reports/2025-12-15-weboptions-crosscheck-analysis.md) | Odoo ↔ Vue schema alignment | **HIGH** - API contract reference |

---

## 1. Key Findings: What's Already Implemented

### 1.1 Database Layer ✅

| Component | Status | Location |
|-----------|--------|----------|
| `header_configs` table | ✅ Migration exists | [067_header_configs_system.ts](../../server/database/migrations/067_header_configs_system.ts) |
| `project_header_overrides` table | ✅ Migration exists | Same migration |
| 5 default configs seeded | ✅ In migration | simple, columns, banner, cover, bauchbinde |
| Subcategory configs | ✅ Seeded | `cover.dramatic`, `banner.compact`, etc. |

### 1.2 API Layer ✅

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/header-configs` | GET | ✅ Lists all configs |
| `/api/header-configs` | POST | ✅ Creates config |
| `/api/header-configs/[id]` | PUT | ✅ Updates config |
| `/api/header-configs/[id]` | DELETE | ✅ Deletes config |
| `/api/header-configs/resolve` | GET | ✅ Resolves config for entity |
| `/api/projects/[id]/header-overrides` | GET/PUT | ✅ Project overrides |

### 1.3 Component Layer ✅

| Component | Status | Notes |
|-----------|--------|-------|
| `Hero.vue` | ✅ Functional | 766 lines, instance-based image system |
| `PageHeading.vue` | ✅ Functional | Uses `useHeaderConfig` composable |
| `TextImageHeader.vue` | ✅ Exists | For `columns` type |
| `PageConfigController.vue` | ✅ Functional | Tab-based options editor |

---

## 2. Key Gaps Identified in Reports

### 2.1 From header-type-size-investigation.md

| Gap | Impact | Priority |
|-----|--------|----------|
| EditPanel header_type dropdown **disabled** | Users can't change header style | **HIGH** |
| Option values wrong in EditPanel (`hero` → `cover`, `minimal` → `simple`) | Would create invalid data | **HIGH** |
| EventPanel hardcodes `header_type: 'cover'` | No flexibility per event | **MEDIUM** |
| `header_size` missing from `posts` table | Posts can't have custom size | **LOW** (derived from type) |

### 2.2 From header-system-answers.md

| Gap | Impact | Priority |
|-----|--------|----------|
| Hero.vue forces `cover` sizing for new image system | Ignores `banner` alignment config | **MEDIUM** |
| No `/dev/header-demo` route | No visual testing tool | **LOW** |
| `showTextImage` computed exists but was unused | Fixed - now used | ✅ DONE |
| `useHeaderImage` composable not extracted | Hero/TextImageHeader code duplication | **LOW** |

### 2.3 From formatoptions-system-analysis.md

| Decision Point | Status | Recommendation |
|----------------|--------|----------------|
| Keep header-only system vs extend to full formatOptions? | **Decided: Header-only for now** | Run migration 067, extend later |
| Rename to `format_configs`? | **Decided: No** | Keep `header_configs` naming |
| Add `chapter` column? | **Deferred** | When extending to aside/footer/page |

### 2.4 From weboptions-crosscheck-analysis.md

| Finding | Implication |
|---------|-------------|
| Vue intentionally limits per-entity web_options | Template-based approach is CORRECT |
| `pages` table stores per-page_type configs | This IS the Vue equivalent of per-entity |
| Odoo has full JSONB per entity | Could simplify Odoo to match Vue pattern |
| `event_type_id` should map to page_type | Sync opportunity with Odoo |

---

## 3. Architecture Alignment: Odoo ↔ Vue

### 3.1 Web Options Mapping

```
Odoo (web.options.abstract)          Vue (crearis-vue)
─────────────────────────────        ─────────────────────────
page_options (JSON)           →      pages.page_options (JSONB)
aside_options (JSON)          →      pages.aside_options (JSONB)
header_options (JSON)         →      pages.header_options (JSONB)
footer_options (JSON)         →      pages.footer_options (JSONB)
                                     
header_type (Selection)       →      projects.header_type + pages.header_type
header_size (Selection)       →      projects.header_size + pages.header_size
                                     
[per-entity]                  →      [per-page_type] (INTENTIONAL)
```

### 3.2 Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Vue Resolution Order (useHeaderConfig / usePageOptions)        │
├─────────────────────────────────────────────────────────────────┤
│  1. BASE_CONFIGS (hardcoded defaults in composable)             │
│  2. header_configs table (subcategory, e.g., cover.dramatic)    │
│  3. project_header_overrides (project-specific)                 │
│  4. Entity header_type/size (post.header_type, event.header_type)│
│  5. pages table entry (by page_type, e.g., 'event-workshop')    │
│  6. Runtime props (from PageHeading props)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Odoo Integration Opportunity

| Action | Benefit |
|--------|---------|
| Sync `event_type_id` → page_type | Automatic styling from Odoo event types |
| Import Odoo event_type templates | Pre-populate header_configs subcategories |
| Reverse-port template approach | Simplify Odoo UI for common users |

---

## 4. Implementation Status vs Sprint v0.5 Needs

### 4.1 What's Already Done

| Item | Status | Evidence |
|------|--------|----------|
| Migration 067 exists | ✅ | server/database/migrations/067_header_configs_system.ts |
| API endpoints complete | ✅ | server/api/header-configs/* |
| `useHeaderConfig` composable | ✅ | Imported by PageHeading.vue |
| `PageHeading` uses composable | ✅ | Line 80: `import { useHeaderConfig }` |
| `TextImageHeader` component | ✅ | Used for `columns` type |

### 4.2 What Needs v0.5 Attention

| Item | Why | Action Required |
|------|-----|-----------------|
| Run migration 067 on DB | Tables don't exist in prod | Add to deployment checklist |
| Fix EditPanel header_type | Users need this control | Enable + fix option values |
| Remove EventPanel hardcode | Allow flexible event headers | Replace with proper default |
| Add to Theming_EditPanel work | Already scoped for v0.5 | Merge into that task |

---

## 5. Recommendations for Sprint v0.5

### 5.1 Integrate with Existing Tasks

These reports should feed into existing sprint tasks:

| Sprint Task | Reports to Reference | Integration Point |
|-------------|----------------------|-------------------|
| [Theming_EditPanel_Analysis.md](./2026-01-22-SPRINT-v05-Input-Theming_EditPanel_Analysis.md) | header-type-size-investigation | EditPanel header_type fix |
| [EVENTS_ADMIN_NEXT_ACTIONS.md](../../docs/dev/odoo/EVENTS_ADMIN_NEXT_ACTIONS.md) | weboptions-crosscheck | Event creation header defaults |
| [RefactorEvents-CRUD.md](./2026-01-22-RefactorEvents-CRUD.md) | header-system-answers | EventPanel hardcode removal |
| Odoo Integration track | weboptions-crosscheck | event_type → page_type sync |

### 5.2 Deferred Items (Not v0.5)

| Item | Reason | Target Version |
|------|--------|----------------|
| Full formatOptions (aside/footer/page configs) | Scope creep | v0.6+ |
| `/dev/header-demo` route | Nice-to-have | v0.6 |
| `useHeaderImage` extraction | Refactor, not blocker | v0.6 |
| Odoo reverse-port of template approach | Major Odoo change | v0.7+ |

---

## 6. Code Conventions Documented

### 6.1 Header Type Values (Odoo-Aligned)

```typescript
// CORRECT values (match Odoo)
type HeaderType = 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'

// WRONG (found in EditPanel, must fix)
// 'hero' → should be 'cover'
// 'minimal' → should be 'simple'
```

### 6.2 Header Size Values (Odoo-Aligned)

```typescript
// CORRECT values (match Odoo)
type HeaderSize = 'mini' | 'medium' | 'prominent' | 'full'

// Percentage equivalents from Odoo docs:
// mini: 25%
// medium: 50%
// prominent: 75%
// full: 100%
```

### 6.3 JSONB Field Convention

```typescript
// For pages table (per-page_type configs)
interface PageOptionsRecord {
  page_options: {
    background?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'muted'
    cssvars?: string
    navigation?: string
  }
  header_options: {
    alert?: string
    postit?: string
  }
  aside_options: {
    toc?: 'none' | 'auto' | 'manual'
    list?: 'alike' | 'product' | 'events' | 'posts' | 'partners'
    context?: string
    postit?: string
  }
  footer_options: {
    gallery?: 'events' | 'posts' | 'partners' | 'companies' | 'media'
    slider?: 'events' | 'posts' | 'partners'
    sitemap?: 'none' | 'small' | 'medium' | 'large'
    postit?: string
    repeat?: string
  }
}
```

### 6.4 Header Config JSONB Convention

```typescript
// For header_configs table (subcategory configs)
interface HeaderConfig {
  headerSize: 'mini' | 'medium' | 'prominent' | 'full'
  allowedSizes: HeaderSize[]
  isFullWidth: boolean
  contentAlignY: 'top' | 'center' | 'bottom'
  imgTmpAlignX: 'left' | 'center' | 'right' | 'cover'
  imgTmpAlignY: 'top' | 'center' | 'bottom' | 'cover'
  backgroundCorrection: 'none' | 'darken' | 'lighten'
  phoneBanner: boolean
  contentInBanner: boolean
  gradientType: 'none' | 'left-bottom' | 'full'
  gradientDepth: number // 0.0 - 1.0
}
```

---

## 7. Files to Update (Quick Reference)

### Must Fix in v0.5

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/EditPanel.vue` | ~L200-220 | Enable header_type dropdown, fix option values |
| `src/components/EventPanel.vue` | ~L429 | Remove hardcoded `header_type: 'cover'` |

### Verify Migration Status

| Check | Command |
|-------|---------|
| Migration 067 applied? | `SELECT * FROM header_configs LIMIT 1;` |
| Configs seeded? | `SELECT COUNT(*) FROM header_configs;` (should be 9+) |

### Document After Implementation

| File | Content |
|------|---------|
| `docs/dev/features/header-configs.md` | Full system documentation |
| `docs/dev/odoo/concepts/web-options.md` | Update Vue mapping section |

---

## 8. Summary

The December 2025 reports provide detailed implementation specifications that are **largely already built**. The main v0.5 actions are:

1. **Run migration 067** on all environments
2. **Fix EditPanel** header_type dropdown (enable + correct values)
3. **Fix EventPanel** hardcoded header_type
4. **Document** the conventions in dev docs

The formatOptions extension to full 4-chapter system is **explicitly deferred** to post-v0.5.
