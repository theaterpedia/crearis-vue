# Investigation Report: header_type & header_size System

**Date:** 2025-12-15  
**Author:** Copilot Analysis  
**Status:** Research Complete - Questions Pending

---

## Executive Summary

The `header_type` and `header_size` fields provide a simplified presentation configuration for content entities (posts, events, partners, projects). They originate from Odoo models and are replicated to PostgreSQL tables. The implementation has several inconsistencies that need resolution, particularly around the "bauchbinde" concept.

---

## 1. Source of Truth: Odoo Models

### 1.1 Field Definitions (Consistent Across Models)

From [docs/odoo/entities/episodes.md](../../../docs/odoo/entities/episodes.md), [events.md](../../../docs/odoo/entities/events.md), [partners.md](../../../docs/odoo/entities/partners.md):

```python
# header_type
header_type = fields.Selection(
    selection=[
        ("simple", "simple"),
        ("columns", 'Text-Bild (2 Spalten)'),
        ("banner", "Banner medium"),
        ("cover", "Cover Fullsize"),
        ("bauchbinde", "Bauchbinde")
    ],
    default="simple"
)

# header_size
header_size = fields.Selection(
    selection=[
        ("mini", "minimal"),
        ("medium", 'Medium'),
        ("prominent", "prominent"),
        ("full", "full")
    ],
    default="mini"
)
```

### 1.2 German Labels for End-Users

| Value | German Display |
|-------|----------------|
| simple | simple |
| columns | Text-Bild (2 Spalten) |
| banner | Banner medium |
| cover | Cover Fullsize |
| bauchbinde | Bauchbinde |

---

## 2. Database Tables (PostgreSQL)

### 2.1 Tables with header_type

| Table | header_type | header_size | Notes |
|-------|-------------|-------------|-------|
| `events` | ✅ | ✅ | Both fields present (varchar) |
| `posts` | ✅ | ❌ | **Missing header_size** |
| `partners` | ✅ | ✅ | Both fields |
| `instructors` | ✅ | ✅ | Both fields |
| `projects` | ✅ | ✅ | Both fields |
| `pages` | ✅ | ❌ | Config table, no size |

*Verified via db-query.ts on 2025-12-15*

### 2.2 Inconsistency: Missing header_size in posts

**Finding:** Only `posts` table lacks `header_size` column. Events table has it (added later).

**Impact:** 
- Posts cannot store size preference at entity level
- PageHeading derives size from header_type for posts

---

## 3. Component Architecture

### 3.1 Data Flow

```
Entity Table (e.g., posts)
    ↓ header_type, header_size
PostPage.vue
    ↓ passes to PageHeading
PageHeading.vue
    ↓ looks up headerTypes config
    ↓ merges formatOptions
Hero.vue
    ↓ renders image + content
Banner.vue (if contentInBanner)
    ↓ handles bauchbinde padding
```

### 3.2 PageHeading.vue headerTypes Config

```javascript
const headerTypes = [
  { id: 0, name: 'simple',     headerSize: 'mini',      imgTmpAlignX: 'center', imgTmpAlignY: 'center', contentInBanner: false },
  { id: 1, name: 'columns',    headerSize: 'prominent', imgTmpAlignX: 'center', imgTmpAlignY: 'center', contentInBanner: false },
  { id: 2, name: 'banner',     headerSize: 'medium',    imgTmpAlignX: 'center', imgTmpAlignY: 'top',    contentInBanner: false },
  { id: 3, name: 'cover',      headerSize: 'prominent', imgTmpAlignX: 'cover',  imgTmpAlignY: 'center', contentInBanner: false },
  { id: 4, name: 'bauchbinde', headerSize: 'prominent', imgTmpAlignX: 'cover',  imgTmpAlignY: 'center', contentInBanner: true,
                               contentType: 'left', contentWidth: 'fixed', isFullWidth: true },
]
```

**Key Observations:**
- `simple` and `columns` don't use Hero (showHero = false)
- `banner` uses `center/top` alignment (not cover)
- `cover` and `bauchbinde` use `cover` alignment
- Only `bauchbinde` has `contentInBanner: true`

### 3.3 Hero.vue Current Sizing Logic

```javascript
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) return true  // Always cover for new image system
  if (isBlurHashActive.value) return true
  if (props.imgTmpAlignX === 'cover' || props.imgTmpAlignY === 'cover') return true
  return false
})
```

**Problem:** New image system forces `cover` regardless of headerType configuration. This ignores `banner` type's `center/top` alignment.

---

## 4. Entity Editor Panels

### 4.1 Current Implementation

| Panel | header_type | header_size | Notes |
|-------|-------------|-------------|-------|
| EditPanel.vue | Disabled (commented out) | Disabled | Dropdown exists but hidden |
| AddPostPanel.vue | Not shown | Not shown | Uses template defaults |
| EventPanel.vue | Hardcoded 'cover' | Not shown | Line 429: `header_type: 'cover'` |
| EventsConfigPanel.vue | Placeholder | Placeholder | "In Entwicklung" |

### 4.2 EditPanel Disabled Code

```vue
<!-- Header Type disabled
<div class="form-group form-group-fixed">
    <label class="form-label" for="edit-header-type">Header Type</label>
    <select id="edit-header-type" v-model="formData.header_type" class="form-select">
        <option value="">Default</option>
        <option value="hero">Hero</option>    <!-- ❌ Wrong value -->
        <option value="banner">Banner</option>
        <option value="minimal">Minimal</option> <!-- ❌ Wrong value -->
    </select>
</div> -->
```

**Problem:** Options don't match Odoo model values (`hero` should be `cover`, `minimal` should be `simple`).

---

## 5. Bauchbinde Concept

### 5.1 Definition

"Bauchbinde" (German: "belly band" or "lower third") is a broadcast-style overlay:
- Full-width image background
- Content band at bottom
- Content aligned left
- Semi-transparent colored background

### 5.2 Current Implementation Path

```
PageHeading.vue
  → headerType === 'bauchbinde'
  → headerprops.name === 'bauchbinde'
  → Banner component receives option="bauchbinde"
  → Banner applies hardcoded padding-left: 4rem
```

### 5.3 Banner.vue Hack

```vue
<div :style="option === 'bauchbinde' ? 'padding-left: 4rem;' : ''">
```

This is marked as TODO - should use CSS classes or theme variables.

### 5.4 Missing in Hero.vue

Hero.vue does NOT have bauchbinde-specific logic. It relies on:
- `contentType="left"` prop
- `contentWidth="fixed"` prop
- Parent component passing correct props

**Question:** Should Hero.vue have a `bauchbinde` variant, or is the current delegation correct?

---

## 6. Questions to Answer

### Q1: What should be further implemented on Hero.vue?

**Current State:**
- No bauchbinde-specific code
- New image system forces `cover` sizing

**Options:**
1. **Keep delegation approach:** Hero.vue remains a pure rendering component, PageHeading handles semantic mapping
2. **Add headerType awareness:** Hero.vue receives headerType and adjusts sizing/layout accordingly
3. **Hybrid:** Hero.vue gets a `variant` prop (cover, banner, bauchbinde) that affects image sizing

**Recommendation:** Option 3 - Add a simple `variant` prop that influences `usesCoverSizing`:

```javascript
// Proposed
const usesCoverSizing = computed(() => {
  if (props.variant === 'banner') return false  // Respect center/top alignment
  if (effectiveImageData.value) return true
  // ... existing logic
})
```

### Q2: What is the preferred architecture for end-users?

**Target Users:** Theaterpädagogik practitioners (non-technical)

**Current UX Issues:**
1. EditPanel has `header_type` disabled
2. No visible way to change header style after creation
3. Terms like "banner" vs "cover" may be unclear

**Recommended Approach - "Preset with Tweak":**

1. **Template Selection (AddPostPanel):**
   - Templates include sensible header_type defaults
   - User sees visual preview before applying
   
2. **Simple Editing (EditPanel):**
   - Enable header_type dropdown
   - Use German labels: "Einfach", "Mit Bild", "Banner", "Vollbild", "Bauchbinde"
   - Show visual indicator of each option
   
3. **Advanced Tweaks (Optional):**
   - `formatOptions` JSON field exists for power users
   - Could expose via "Erweiterte Einstellungen" accordion

**Example User Flow:**
```
1. User creates post from template "Ankündigung" (→ header_type: banner)
2. User opens edit panel
3. Sees "Header-Stil" dropdown with German labels
4. Selects "Vollbild (Cover)" 
5. Hero changes immediately (or on save)
```

### Q3: How should Odoo models be aligned?

**Current Alignment Issues:**

| Issue | Odoo | PostgreSQL | Fix |
|-------|------|------------|-----|
| header_size missing | ✅ All entities | ❌ posts only | Add column to posts |
| Values mismatch | standard values | standard values | ✅ OK |
| Default mismatch | 'simple' | varies | Standardize to 'simple' |

**Migration Needed:**

```sql
-- Add header_size to posts table (events already has it)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS header_size VARCHAR DEFAULT 'mini';
```

**Consideration:** Adding these columns enables full Odoo parity but increases complexity. If the sizing is always derived from header_type (as PageHeading does now), the columns may be unnecessary.

**Recommendation:** Add columns for future flexibility, but keep current PageHeading logic as the primary driver.

### Q4: What updates do entity editor panels need?

**Required Changes:**

#### EditPanel.vue
1. Enable header_type dropdown
2. Fix option values to match Odoo: simple, columns, banner, cover, bauchbinde
3. Use German labels
4. Add header_size dropdown (optional, if columns added)
5. Add visual preview of header style

#### EventPanel.vue
1. Remove hardcoded `header_type: 'cover'`
2. Add header_type selection (optional, or derive from event_type)

#### AddPostPanel.vue
1. No changes needed - inherits from template

---

## 7. Updated Action Plan for Hero.vue

### Phase 1: Sizing Behavior (Priority)

- [ ] **Decision needed:** Should new image system respect `imgTmpAlignX/Y` from headerType config?
- [ ] If yes: Update `usesCoverSizing` to check props
- [ ] If no: Document that new system always uses cover

```javascript
// Option A: Always cover (current)
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) return true
  // ...
})

// Option B: Respect headerType config
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) {
    // Cover only if explicitly configured
    return props.imgTmpAlignX === 'cover' || props.imgTmpAlignY === 'cover'
  }
  // ...
})
```

### Phase 2: Bauchbinde Clarity

- [ ] **Decision needed:** Is bauchbinde a Hero variant or purely Banner's concern?
- [ ] If Hero variant: Add specific CSS class for bauchbinde layout
- [ ] If not: Remove any Hero-level bauchbinde assumptions

### Phase 3: Clean Up

- [ ] Remove debug console.logs from Hero.vue
- [ ] Document expected behavior in component JSDoc

### Phase 4: Integration

- [ ] Test all 5 header types: simple, columns, banner, cover, bauchbinde
- [ ] Verify image sizing matches expected behavior for each

---

## 8. Outstanding Questions Before Updating Plan

### Must Answer:

1. **For new image system (image_id, img_* columns):**
   - Always use `cover` sizing? 
   - Or respect the headerType's `imgTmpAlignX/Y` configuration?

2. **For bauchbinde:**
   - Does it need different image instance selection (e.g., always hero_wide)?
   - Or is current viewport-based selection correct?

3. **For header_type editing:**
   - Enable in EditPanel now?
   - Or wait for visual preview implementation?

### Nice to Have:

4. **Should header_size columns be added to events/posts tables?**
   - Enables per-entity size override
   - But PageHeading already derives size from type

5. **Should DropdownList have a "header_type" entity type?**
   - Would provide consistent header_type selection UX
   - Or keep as simple `<select>` elements

---

## Appendix: File References

### Odoo Documentation
- [docs/odoo/index.md](../../../docs/odoo/index.md) - Overview
- [docs/odoo/entities/episodes.md](../../../docs/odoo/entities/episodes.md) - Blog posts
- [docs/odoo/entities/events.md](../../../docs/odoo/entities/events.md) - Events
- [docs/odoo/entities/partners.md](../../../docs/odoo/entities/partners.md) - Partners

### Components
- [src/components/Hero.vue](../../../src/components/Hero.vue) - Image rendering
- [src/components/PageHeading.vue](../../../src/components/PageHeading.vue) - Header orchestration
- [src/components/PageHeading.old.vue](../../../src/components/PageHeading.old.vue) - Legacy reference
- [src/components/Banner.vue](../../../src/components/Banner.vue) - Content overlay
- [src/components/EditPanel.vue](../../../src/components/EditPanel.vue) - Entity editor
- [src/components/EventPanel.vue](../../../src/components/EventPanel.vue) - Event creator

### Types
- [src/types/odooEvent.ts](../../../src/types/odooEvent.ts) - Header type TypeScript types
- [server/types/database.ts](../../../server/types/database.ts) - Database schema types

### Related Task
- [chat/tasks/2025-12-15-hero-image-system.md](../tasks/2025-12-15-hero-image-system.md) - Image system action plan
