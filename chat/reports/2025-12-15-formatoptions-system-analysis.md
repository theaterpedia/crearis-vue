# FormatOptions System Analysis

**Date:** 2025-12-15  
**Status:** Analysis Complete - Decision Required  
**Context:** Evaluating extension of header_configs to full formatOptions system

---

## Current Database Schema

### Projects Table (70 columns)

The projects table has **4 chapters** of formatOptions, each with dedicated columns:

| Chapter | Key Columns | JSON Extension |
|---------|-------------|----------------|
| **Page** | `page_background`, `page_cssvars`, `page_navigation` | `page_options_ext` |
| **Header** | `header_type`, `header_size`, `header_alert`, `header_postit` | `header_options_ext` |
| **Aside** | `aside_toc`, `aside_list`, `aside_context`, `aside_postit` | `aside_options_ext` |
| **Footer** | `footer_gallery`, `footer_slider`, `footer_sitemap`, `footer_postit`, `footer_repeat` | `footer_options_ext` |

Plus `*_has_content` boolean flags for optimization.

### Pages Table (14 columns)

The pages table uses **consolidated JSONB** for each chapter:

| Chapter | JSONB Column | Purpose |
|---------|--------------|---------|
| **Page** | `page_options` | All page options in one JSON |
| **Header** | `header_options` | All header options in one JSON |
| **Aside** | `aside_options` | All aside options in one JSON |
| **Footer** | `footer_options` | All footer options in one JSON |

Plus `header_type` as dedicated column, and `*_has_content` flags.

---

## Existing UI Components

### Already Implemented (4 Panels)

| Component | Purpose | Fields |
|-----------|---------|--------|
| `PageOptionsPanel.vue` | Page background, CSS vars, navigation | `page_background`, `page_cssvars`, `page_navigation`, `page_options_ext` |
| `HeaderOptionsPanel.vue` | Alert banner, post-it, extended opts | `header_alert`, `header_postit`, `header_options_ext` |
| `AsideOptionsPanel.vue` | TOC, list, context, post-it | `aside_toc`, `aside_list`, `aside_context`, `aside_postit`, `aside_options_ext` |
| `FooterOptionsPanel.vue` | Gallery, slider, sitemap, post-it, repeat | `footer_gallery`, `footer_slider`, `footer_sitemap`, `footer_postit`, `footer_repeat`, `footer_options_ext` |

### Controller Component

`PageConfigController.vue`:
- Horizontal tabs: Page | Header | Aside | Footer
- Loads from projects table (mode='project') or pages table (mode='pages')
- Save/Cancel with dirty checking
- Uses all 4 panel components

### Related Config Panels

`NavigationConfigPanel.vue`:
- Team page toggle
- CTA configuration (entity/link/form)
- Example presets for image lists/galleries
- Separate from PageConfigController

---

## Odoo FormatOptions Alignment

### Odoo Chapter Definitions

```python
# Odoo website.page model defines 4 formatOptions chapters:

# HEADER
header_type = Selection([simple, columns, banner, cover, bauchbinde])
header_size = Selection([mini, medium, prominent, full])
# + header_postit, header_alert, header_options

# ASIDE
aside_toc = Selection([none, auto, manual])
aside_list = Selection([none, related, recent, popular, images])
aside_context = Text
# + aside_postit, aside_options

# FOOTER
footer_gallery = Selection([none, images, partners, ...])
footer_slider = Selection([none, events, posts, ...])
footer_sitemap = Selection([none, auto, manual])
# + footer_postit, footer_repeat, footer_options

# PAGE
page_background = Char
page_cssvars = Text
page_navigation = Selection([default, sidebar, tabs, breadcrumb])
# + page_options
```

---

## Gap Analysis: What's Missing?

### Header Chapter Gaps

| Feature | Odoo | DB | UI | Config System |
|---------|------|----|----|---------------|
| header_type | ✅ | ✅ projects.header_type | ❌ Not in HeaderOptionsPanel | ✅ Just built (067) |
| header_size | ✅ | ✅ projects.header_size | ❌ Not in HeaderOptionsPanel | ✅ Just built (067) |
| header_alert | ✅ | ✅ | ✅ | ❌ |
| header_postit | ✅ | ✅ | ✅ | ❌ |

### Aside Chapter Gaps

| Feature | Odoo | DB | UI | Config System |
|---------|------|----|----|---------------|
| aside_toc | ✅ | ✅ | ✅ | ❌ No central config |
| aside_list | ✅ | ✅ | ✅ | ❌ No central config |
| aside_context | ✅ | ✅ | ✅ | ❌ No central config |
| aside_postit | ✅ | ✅ | ✅ | ❌ No central config |

### Footer Chapter Gaps

| Feature | Odoo | DB | UI | Config System |
|---------|------|----|----|---------------|
| footer_gallery | ✅ | ✅ | ✅ | ❌ No central config |
| footer_slider | ✅ | ✅ | ✅ | ❌ No central config |
| footer_sitemap | ✅ | ✅ | ✅ | ❌ No central config |
| footer_postit | ✅ | ✅ | ✅ | ❌ No central config |
| footer_repeat | ✅ | ✅ | ✅ | ❌ No central config |

### Page Chapter Gaps

| Feature | Odoo | DB | UI | Config System |
|---------|------|----|----|---------------|
| page_background | ✅ | ✅ | ✅ | ❌ No central config |
| page_cssvars | ✅ | ✅ | ✅ | ❌ No central config |
| page_navigation | ✅ | ✅ | ✅ | ❌ No central config |

---

## Key Decision: Extend to Full FormatOptions?

### Option A: Keep Header-Only Config System

**Current migration 067** creates:
- `header_configs` table (central subcategories)
- `project_header_overrides` table (per-project)

**Pros:**
- Already built, just needs migration run
- Simpler, focused scope
- Works today

**Cons:**
- Inconsistent: header has config system, other chapters don't
- Future work needed for aside/footer/page

### Option B: Rename to Full FormatOptions System

Rename tables to:
- `format_configs` (all 4 chapters)
- `project_format_overrides` (per-project for all)

**Schema Change:**

```sql
CREATE TABLE format_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  chapter VARCHAR(20) NOT NULL,  -- 'header', 'aside', 'footer', 'page'
  parent_type VARCHAR(20),        -- For header: simple/columns/banner/cover/bauchbinde
  is_default BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}',
  label_de VARCHAR(100),
  label_en VARCHAR(100),
  description VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  
  CONSTRAINT valid_chapter CHECK (chapter IN ('header', 'aside', 'footer', 'page'))
);

CREATE TABLE project_format_overrides (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format_config_name VARCHAR(50) NOT NULL,
  config_overrides JSONB NOT NULL DEFAULT '{}',
  
  UNIQUE(project_id, format_config_name)
);
```

---

## Bit Analysis: Does It Fit in 32 Bits?

### Current Header Types (5 values = 3 bits)
- simple, columns, banner, cover, bauchbinde

### Current Header Sizes (4 values = 2 bits)
- mini, medium, prominent, full

### Potential Full Encoding

```
Bit Layout (32-bit integer):
┌───────────────────────────────────────────────────────────────┐
│ 31-28 │ 27-24 │ 23-20 │ 19-16 │ 15-12 │ 11-8 │ 7-4 │ 3-0    │
│ rsrv  │ page  │ aside │ footer │ hdr_sz│hdr_ty│ rsrv │ chapter│
└───────────────────────────────────────────────────────────────┘

Breakdown:
- Bits 0-3:  Chapter selector (4 bits = 16 chapters, need 4)
- Bits 4-7:  Reserved/flags
- Bits 8-11: Header type (4 bits = 16 values, need 5)
- Bits 12-15: Header size (4 bits = 16 values, need 4)
- Bits 16-19: Footer preset (4 bits)
- Bits 20-23: Aside preset (4 bits)
- Bits 24-27: Page preset (4 bits)
- Bits 28-31: Reserved/version
```

**Answer: YES - it fits comfortably in 32 bits**

But... do we need bit encoding? The current JSONB approach is more flexible.

---

## Recommended Approach

### Phase 1: Run Current Migration (Now)
1. Keep `header_configs` and `project_header_overrides` as-is
2. Run migrations 066 + 067
3. Test with Hero.vue / PageHeading.vue
4. Validate the pattern works

### Phase 2: Extend Pattern (Later)
Once header config system is proven:
1. Rename tables to `format_configs` / `project_format_overrides`
2. Add `chapter` column
3. Add seed data for aside/footer/page presets
4. Update API endpoints to handle chapter parameter

### Phase 3: UI Integration (Later)
1. Update HeaderOptionsPanel to include header_type/size dropdowns
2. Add presets to AsideOptionsPanel, FooterOptionsPanel, PageOptionsPanel
3. Add "Advanced" mode for full JSON editing

---

## Immediate Action Items

### Don't Change (Keep Migration 067 As-Is)
- Table names: `header_configs`, `project_header_overrides`
- API endpoints: `/api/header-configs/*`
- SysregAdmin: "Header Configs" tab

### Minor Enhancement to Add Later
- Domaincode input field in HeaderConfigsEditor for preview testing
- Demo pages showcasing combined formatOptions

### Future Refactor (When Extending)
- Rename to `format_configs` with `chapter` column
- Generalize API endpoints
- Update SysregAdmin to "Format Configs" with chapter tabs

---

## Summary

| Question | Answer |
|----------|--------|
| Does full formatOptions fit in 32 bits? | **Yes**, but JSONB is more flexible |
| Should we modify migration 067 now? | **No** - keep header-focused, extend later |
| Is the system ready for full formatOptions? | **Yes** - pattern is proven, just needs expansion |
| What's the gap to close? | Add header_type/size to HeaderOptionsPanel UI |

**Recommendation:** Proceed with current migration 067, validate the pattern, then extend to full formatOptions in a future migration.
