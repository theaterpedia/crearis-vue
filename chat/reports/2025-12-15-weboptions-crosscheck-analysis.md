# Web Options Cross-Check Analysis Report

**Date:** 2025-12-15 (Updated: 2025-12-19)  
**Purpose:** Cross-check Vue.js system against Odoo source-of-truth documentation for `web.options.abstract`  
**Reference:** [web-options.md](../../docs/dev/odoo/concepts/web-options.md)

---

## Executive Summary

The cross-check analysis reveals an **intentional architectural difference** between Odoo and Vue.js implementations:

### Design Philosophy: Templates/Types vs Per-Entity Configuration

| Approach | Odoo | Vue.js | Assessment |
|----------|------|--------|------------|
| **Entity-level config** | ✅ Full per-entity | ❌ Intentionally limited | Vue simplifies UX |
| **Type/Template config** | ✅ `event.type` | ✅ `pages` + `header_configs` | Aligned |
| **Power-user JSON** | ✅ Via backend UI | 🔶 Via `pages` table | Can port to Odoo |

### Key Insight: Vue.js Simplification is INTENTIONAL

The Vue.js implementation deliberately limits per-entity web_options to:
- **1a) Common users**: Work only with templates/types (configured centrally)
- **1b) Power users**: JSONB formatting via `pages` table per page_type

This design could be **ported back to Odoo** to simplify its UI.

### Entity Status Summary

| Entity | Odoo Model | Vue DB Structure | Design Assessment |
|--------|------------|------------------|-------------------|
| **Projects** | Inherits web.options.abstract | ✅ Full flattened columns | Project = site-wide defaults |
| **Posts** | blog.post inherits mixin | 🔶 header_type/size only | **INTENTIONAL** - uses page_type templates |
| **Events** | event.event inherits mixin | 🔶 header_type/size only | **INTENTIONAL** - uses event_type templates |
| **Partners** | res.partner inherits mixin | 🔶 header_type/size only | Follows same pattern |
| **Pages** | N/A (Vue-only) | ✅ 4 JSON fields | Type/template config store |
| **Header Configs** | N/A (Vue-only) | ✅ Template system | Subcategory config store |

---

## Loop 1: Database Schema, Triggers, and Endpoints Analysis

### Table 1.1: Entity Schema Comparison (vs Odoo `web.options.abstract`)

| Field Group | Odoo Mixin | Projects | Events | Posts | Partners | Pages |
|-------------|------------|----------|--------|-------|----------|-------|
| **header_type** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **header_size** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **cimg** | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| **md** (markdown) | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| **version** | ✅ | ✅ | ✅ | ✅ | - | - |
| **page_options** (JSON) | ✅ | 🔶 (flattened) | 🔶 via page_type | 🔶 via page_type | 🔶 via page_type | ✅ JSON |
| **aside_options** (JSON) | ✅ | 🔶 (flattened) | 🔶 via page_type | 🔶 via page_type | 🔶 via page_type | ✅ JSON |
| **header_options** (JSON) | ✅ | 🔶 (flattened) | 🔶 via page_type | 🔶 via page_type | 🔶 via page_type | ✅ JSON |
| **footer_options** (JSON) | ✅ | 🔶 (flattened) | 🔶 via page_type | 🔶 via page_type | 🔶 via page_type | ✅ JSON |

**Legend:** ✅ = Full match | 🔶 = Different implementation (via templates) | - = N/A

### Table 1.2: Projects Table Web Options (Flattened Structure)

The `projects` table has 76 columns with web_options flattened into individual columns:

| Odoo JSON Field | Projects Column(s) | Status |
|-----------------|-------------------|--------|
| `page_options.background` | `page_background` | ✅ |
| `page_options.cssvars` | `page_cssvars` | ✅ |
| `page_options.navigation` | `page_navigation` | ✅ |
| `page_options.ext` | `page_options_ext` | ✅ |
| `aside_options.postit` | `aside_postit` | ✅ |
| `aside_options.toc` | `aside_toc` | ✅ |
| `aside_options.list` | `aside_list` | ✅ |
| `aside_options.context` | `aside_context` | ✅ |
| `aside_options.ext` | `aside_options_ext` | ✅ |
| `header_options.alert` | `header_alert` | ✅ |
| `header_options.postit` | `header_postit` | ✅ |
| `header_options.ext` | `header_options_ext` | ✅ |
| `footer_options.gallery` | `footer_gallery` | ✅ |
| `footer_options.slider` | `footer_slider` | ✅ |
| `footer_options.sitemap` | `footer_sitemap` | ✅ |
| `footer_options.postit` | `footer_postit` | ✅ |
| `footer_options.repeat` | `footer_repeat` | ✅ |
| `footer_options.ext` | `footer_options_ext` | ✅ |
| `*_has_content` | `page_has_content`, `aside_has_content`, etc. | ✅ |

---

## NEW: Template/Type Configuration System (Vue.js)

### Table 1.2b: Header Configs Table (Template System)

The `header_configs` table provides **centralized header templates** for common users:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INTEGER | Primary key |
| `name` | VARCHAR | Template identifier (e.g., `cover.dramatic`) |
| `parent_type` | VARCHAR | Base type: `simple`, `columns`, `banner`, `cover`, `bauchbinde` |
| `is_default` | BOOLEAN | Default for parent_type |
| `config` | JSONB | Full header configuration |
| `theme_id` | INTEGER | Optional theme-specific override |
| `label_de` / `label_en` | VARCHAR | User-facing labels |

**API Endpoints:**
- `GET /api/header-configs` - List all templates
- `GET /api/header-configs/resolve` - Resolve config for entity (with project overrides)
- `POST /api/header-configs` - Create template (admin)

### Table 1.2c: Pages Table (Type Configuration Store)

The `pages` table stores **page_type-specific configurations**:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | TEXT | Primary key |
| `project` | INTEGER | FK to projects |
| `page_type` | TEXT | Type identifier (e.g., `post`, `event-workshop`, `post-demo`) |
| `page_options` | JSONB | Page-level options |
| `aside_options` | JSONB | Aside configuration |
| `header_options` | JSONB | Header configuration |
| `footer_options` | JSONB | Footer configuration |
| `header_type` | TEXT | Default header type for this page_type |
| `header_size` | VARCHAR | Default header size |

**Resolution Flow:**
```
Entity (post/event) → page_type lookup → pages table → full web_options
```

---

## NEW: Odoo Integration APIs

### Table 1.2d: Odoo Event API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/odoo/events` | GET | Fetch events from Odoo via XML-RPC |
| `/api/odoo/events` | POST | Create event in Odoo via XML-RPC |

**Key Fields Synced:**
- Standard: `name`, `date_begin`, `date_end`, `stage_id`, `seats_*`, `event_type_id`
- Crearis: `cid`, `rectitle`, `cimg`, `md`, `header_type`, `header_size`

**Important:** `event_type_id` from Odoo maps to Vue's template system!

---

### Table 1.3: Database Triggers Analysis

| Table | Trigger | Function | Relevance to Web Options |
|-------|---------|----------|-------------------------|
| `events` | `trigger_sync_img_fields` | Syncs img_id to cimg/img_* | Supports header image |
| `events` | `trg_validate_event_status` | Status validation | - |
| `posts` | `trigger_sync_img_fields` | Syncs img_id to cimg/img_* | Supports header image |
| `posts` | `trigger_posts_role_visibility` | Role-based visibility | - |
| `projects` | `trigger_sync_img_fields` | Syncs img_id to cimg/img_* | Supports header image |
| `projects` | `trigger_projects_role_visibility` | Role-based visibility | - |
| `partners` | `trigger_sync_img_fields` | Syncs img_id to cimg/img_* | Supports header image |
| `images` | `trigger_propagate_to_entities` | Propagates changes to entities | Critical for cimg updates |

**Note:** Triggers are SUFFICIENT for current design - no per-entity web_options columns needed.

### Table 1.4: API Endpoint Coverage

| Entity | GET | POST | PATCH/PUT | DELETE | Web Options Support |
|--------|-----|------|-----------|--------|---------------------|
| `/api/events` | ✅ | ✅ | ✅ | ✅ | 🔶 header_type/size + page_type lookup |
| `/api/posts` | ✅ | ✅ | ✅ | ✅ | 🔶 header_type/size + page_type lookup |
| `/api/projects` | ✅ | ✅ | ✅ | ✅ | ✅ Full flattened fields |
| `/api/partners` | ✅ | ✅ | ✅ | ✅ | 🔶 header_type/size |
| `/api/pages` | ✅ | ✅ | ✅ | ✅ | ✅ 4 JSON fields |
| `/api/pages/by-type` | ✅ | - | - | - | ✅ Lookup by project+page_type |
| `/api/header-configs` | ✅ | ✅ | ✅ | ✅ | ✅ Template configs |
| `/api/header-configs/resolve` | ✅ | - | - | - | ✅ Merged resolution |
| `/api/odoo/events` | ✅ | ✅ | - | - | 🔶 Syncs event_type_id |

---

## Loop 2: Distributed UI Components Analysis

### Table 2.1: Component Web Options Usage

| Component | Location | Web Options Support | Current Implementation | Gap |
|-----------|----------|--------------------|-----------------------|-----|
| **AddPostPanel.vue** | components/ | Partial | `header_type`, `header_size` selectors | Missing aside/footer/page options |
| **EventPanel.vue** | components/ | Partial | `header_type`, `header_size` selectors | Missing aside/footer/page options |
| **ProjectSite.vue** | views/ | Full via composable | Uses `usePageOptions()` | ✅ Working |
| **PostPage.vue** | views/ | Full via composable | Uses `usePageOptions()` + PageConfigController | ✅ Working |
| **EventPage.vue** | views/ | Full via composable | Uses `usePageOptions()` + PageConfigController | ✅ Working |
| **PageLayout.vue** | components/ | Full | Accepts `asideOptions`, `footerOptions` props | ✅ Working |

### Table 2.2: Header Type/Size Options Comparison

| Option | Odoo (weboptions.py) | AddPostPanel | EventPanel | Page Views |
|--------|---------------------|--------------|------------|------------|
| `header_type='simple'` | ✅ | ✅ | ✅ | ✅ |
| `header_type='hero'` | ✅ | ✅ | ✅ | ✅ |
| `header_type='banner'` | ✅ | ✅ | ✅ | ✅ |
| `header_type='minimal'` | ✅ | ✅ | ✅ | ✅ |
| `header_size='mini'` | ✅ (25%) | ✅ | ✅ | ✅ |
| `header_size='medium'` | ✅ (50%) | ✅ | ✅ | ✅ |
| `header_size='prominent'` | ✅ (75%) | ✅ | ✅ | ✅ |
| `header_size='full'` | ✅ (100%) | ✅ | ✅ | ✅ |

### Table 2.3: Options Resolution Flow

```
AddPostPanel/EventPanel (Create)
    ↓
    Only sets: header_type, header_size
    Does NOT set: aside_options, footer_options, page_options
    ↓
PostPage/EventPage (View)
    ↓
    usePageOptions() composable
    ↓
    Resolution Order:
    1. ENTITY_DEFAULTS (hardcoded per entity type)
    2. Project fields (from projects table)
    3. Pages table entry (by page_type)
    4. Variant fallback (e.g., 'post-demo' → 'post')
    ↓
PageLayout (Render)
    ↓
    Receives: asideOptions, footerOptions props
    Renders: pPostit, pToc, pList, pGallery, pSlider, etc.
```

---

## Loop 3: PageConfigController Family Analysis

### Table 3.1: Component Family Overview

| Component | Lines | Purpose | Mode Support |
|-----------|-------|---------|--------------|
| **PageConfigController.vue** | 451 | Main controller with tabs | `project` / `pages` |
| **PageOptionsPanel.vue** | ~140 | Page background, cssvars, navigation | ✅ |
| **HeaderOptionsPanel.vue** | ~120 | Alert banner, postit | ✅ |
| **AsideOptionsPanel.vue** | ~145 | TOC, list, context, postit | ✅ |
| **FooterOptionsPanel.vue** | ~145 | Gallery, slider, sitemap, postit, repeat | ✅ |
| **JsonFieldEditor.vue** | - | Generic JSON field editor | ✅ |

### Table 3.2: Mode Comparison (Projects vs Pages)

| Aspect | Project Mode | Pages Mode |
|--------|--------------|------------|
| **Data Source** | `projects` table | `pages` table |
| **API Endpoint** | `/api/projects/:id` | `/api/pages/:id` |
| **Field Structure** | Flattened columns | 4 JSON columns |
| **Load Logic** | Maps individual fields → panels | Unpacks JSON → panels |
| **Save Logic** | Saves individual fields | Saves JSON objects |
| **Usage** | Homepage configuration | Entity-specific config |

### Table 3.3: Odoo vs Vue Panel Field Mapping

| Panel | Odoo Computed Field | Vue Panel Field | Match |
|-------|---------------------|-----------------|-------|
| **Page** | `page_background` | `page_background` | ✅ |
| **Page** | `page_cssvars` | `page_cssvars` | ✅ |
| **Page** | `page_navigation` | `page_navigation` | ✅ |
| **Header** | `header_alert` | `header_alert` | ✅ |
| **Header** | `header_postit` | `header_postit` | ✅ |
| **Aside** | `aside_toc` | `aside_toc` | ✅ |
| **Aside** | `aside_list` | `aside_list` | ✅ |
| **Aside** | `aside_context` | `aside_context` | ✅ |
| **Aside** | `aside_postit` | `aside_postit` | ✅ |
| **Footer** | `footer_gallery` | `footer_gallery` | ✅ |
| **Footer** | `footer_slider` | `footer_slider` | ✅ |
| **Footer** | `footer_sitemap` | `footer_sitemap` | ✅ |
| **Footer** | `footer_postit` | `footer_postit` | ✅ |
| **Footer** | `footer_repeat` | `footer_repeat` | ✅ |

### Table 3.4: Refactor Assessment

| Component | Refactor Need | Reason |
|-----------|---------------|--------|
| **PageConfigController.vue** | 🟡 Moderate | Works but complex mode switching |
| **PageOptionsPanel.vue** | 🟢 Low | Clean, matches Odoo fields |
| **HeaderOptionsPanel.vue** | 🟢 Low | Clean, matches Odoo fields |
| **AsideOptionsPanel.vue** | 🟢 Low | Clean, matches Odoo fields |
| **FooterOptionsPanel.vue** | 🟢 Low | Clean, matches Odoo fields |
| **JsonFieldEditor.vue** | 🟢 Low | Generic, reusable |

---

## REVISED Priority Action Items

### ~~REMOVED: Database Schema Migration~~

**No longer needed.** The Vue.js design INTENTIONALLY avoids per-entity web_options columns.
The `pages` table + `header_configs` table provide template-based configuration.

---

### Priority 1: HIGH - Odoo Simplification (Reverse Port)

Consider porting Vue.js template approach back to Odoo:

| Action | Area | Description | Effort |
|--------|------|-------------|--------|
| **1.1** | Odoo | Create "page templates" concept matching Vue's `pages` table | High |
| **1.2** | Odoo | Hide per-entity web_options from common users | Medium |
| **1.3** | Odoo | Expose JSONB editing only to power users | Low |
| **1.4** | Odoo | Link `event.type` to page template config | Medium |

### Priority 2: MEDIUM - Template System Enhancement (Vue)

| Action | Component | Description | Effort |
|--------|-----------|-------------|--------|
| **2.1** | header_configs | Add more subcategories matching Odoo options | Low |
| **2.2** | pages table | Ensure all `event-*` and `post-*` variants exist | Low |
| **2.3** | EventPanel | Improve event_type → page_type mapping | Medium |
| **2.4** | AddPostPanel | Improve post variant → page_type mapping | Medium |

### Priority 3: LOW - Documentation & Sync

| Action | Area | Description | Effort |
|--------|------|-------------|--------|
| **3.1** | Docs | Document template vs per-entity design decision | Low |
| **3.2** | Odoo API | Sync `event_type_id` to page_type resolution | Medium |
| **3.3** | usePageOptions | Add comments explaining resolution vs Odoo | Low |

### Priority 4: OPTIONAL - Power User Features

| Action | Area | Description | Effort |
|--------|------|-------------|--------|
| **4.1** | PageConfigController | Add "advanced mode" for per-entity JSONB | High |
| **4.2** | Admin UI | JSON editor for pages table entries | Medium |
| **4.3** | Migration | Tool to bulk-update page_type configs | Medium |

---

## Architecture Decisions (UPDATED)

### Decision 1: Template-Based vs Per-Entity Configuration ✅ RESOLVED

**Vue.js Choice:** Template-based (via `pages` + `header_configs` tables)

**Rationale:**
1. **UX Simplification**: Common users don't need per-entity config
2. **Consistency**: All events of type X look the same
3. **Maintainability**: Change one template, update all entities
4. **Power Users**: Still have JSONB access via pages table

**Odoo Consideration:** Port this simplification back to Odoo UI.

### Decision 2: Pages Table Role ✅ CONFIRMED

**Current Design is CORRECT:**
```
Entity Request → xmlid/page_type extraction → pages table lookup → full options
```

Resolution chain:
1. `ENTITY_DEFAULTS` (hardcoded per entity type)
2. Project fields (from `projects` table) 
3. Pages table entry (by `page_type`)
4. Variant fallback (e.g., `post-demo` → `post`)

### Decision 3: Header Configs Role ✅ CONFIRMED

**Current Design is CORRECT:**
```
PageHeading → header_type/subtype → header_configs lookup → resolved config
```

Resolution chain:
1. `BASE_CONFIGS` (5 parent types)
2. Subcategory config (e.g., `cover.dramatic`)
3. Theme-specific override (if theme_id set)
4. Project override (from `project_header_overrides`)

---

## Cross-System Mapping

### Odoo → Vue.js Mapping

| Odoo Concept | Vue.js Equivalent |
|--------------|-------------------|
| `web.options.abstract` mixin | `pages` table + `usePageOptions` |
| `event.type` model | `header_configs` + page_type variants |
| Per-entity page_options | ❌ Intentionally omitted for common users |
| Per-entity aside_options | ❌ Resolved via page_type lookup |
| Per-entity footer_options | ❌ Resolved via page_type lookup |
| Button actions (clear_*) | PageConfigController reset |

### Vue.js → Odoo Backport Suggestions

| Vue.js Feature | Odoo Implementation Suggestion |
|----------------|-------------------------------|
| `pages` table | Create `page.template` model |
| `header_configs` | Extend `event.type` with header config |
| page_type resolution | Add computed field on entities |
| Common user UI | Hide JSON fields, show template selector |
| Power user UI | Keep current JSON widget for admins |

---

## Appendix: File References

### Odoo Source Files (Reference)
- `weboptions.py` - web.options.abstract mixin definition

### Vue.js Files Analyzed
- [PageConfigController.vue](../../src/components/PageConfigController.vue)
- [PageOptionsPanel.vue](../../src/components/PageOptionsPanel.vue)
- [HeaderOptionsPanel.vue](../../src/components/HeaderOptionsPanel.vue)
- [AsideOptionsPanel.vue](../../src/components/AsideOptionsPanel.vue)
- [FooterOptionsPanel.vue](../../src/components/FooterOptionsPanel.vue)
- [AddPostPanel.vue](../../src/components/AddPostPanel.vue)
- [EventPanel.vue](../../src/components/EventPanel.vue)
- [ProjectSite.vue](../../src/views/ProjectSite.vue)
- [PostPage.vue](../../src/views/PostPage.vue)
- [EventPage.vue](../../src/views/EventPage.vue)
- [PageLayout.vue](../../src/components/PageLayout.vue)
- [usePageOptions.ts](../../src/composables/usePageOptions.ts)

### Additional API Endpoints (December 2025 Update)
- [header-configs/index.get.ts](../../server/api/header-configs/index.get.ts) - List templates
- [header-configs/resolve.get.ts](../../server/api/header-configs/resolve.get.ts) - Resolve with overrides
- [odoo/events.get.ts](../../server/api/odoo/events.get.ts) - Odoo XML-RPC integration
- [odoo/events.post.ts](../../server/api/odoo/events.post.ts) - Create in Odoo
- [pages/by-type.get.ts](../../server/api/pages/by-type.get.ts) - Lookup by page_type
- [pages/by-project.get.ts](../../server/api/pages/by-project.get.ts) - All pages for project

### Database Schema
- `projects` table: 76 columns with flattened web_options (site-wide defaults)
- `events` table: 43 columns, header_type/size only (uses page_type lookup)
- `posts` table: 47 columns, header_type/size only (uses page_type lookup)
- `partners` table: 38 columns, header_type/size only
- `pages` table: 15 columns with 4 JSONB web_options fields (templates)
- `header_configs` table: 12 columns with JSONB config (header templates)
