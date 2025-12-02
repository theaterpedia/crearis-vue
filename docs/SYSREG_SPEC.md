# Sysreg System Specification (SPEC)

**Date:** 2025-11-28  
**Status:** ✅ Authoritative Reference  
**Migration:** 036 Complete (INTEGER), 037 In Progress (dtags restructure)

---

## 📋 Overview

The **Sysreg** (System Registry) is a PostgreSQL-based tag and status management system using **INTEGER bitmask fields** (32-bit). It provides:

- 🏷️ **Unified tagging** - 6 tag families with hierarchical categories
- ⚡ **High-performance filtering** - Bitwise operations on indexed INTEGER columns
- 🌍 **Multilingual labels** - i18n support with fallback chains
- 📊 **Status workflows** - Validated state transitions
- 🔧 **Configuration flags** - Per-entity feature toggles

---

## 🏗️ Tag Families: Purpose & Semantics

| Family | Full Name | Purpose | Domain |
|--------|-----------|---------|--------|
| **ctags** | Common Tags | Shared across creative work domain | Participant ages, working spaces |
| **dtags** | Domain Tags | Instance-specific taxonomy | Theater pedagogy (theaterpedia.org) |
| **ttags** | Topic Tags | Conversation/content topics | Democracy, sustainability, culture |
| **rtags** | Record Tags | Technical record properties | (Empty for alpha release) |
| **status** | Status | Single-option entity states | new/trash, public/internal |
| **config** | Configuration | Feature flags & visibility | Visibility, features |

### Critical Semantic Notes

1. **ctags ≠ access control**
   - `age_group` = Typical participant ages in workshops (NOT access restrictions)
   - `subject_type` = Working space types for creative work

2. **rtags = Technical only**
   - Reserved for pure technical data record properties
   - Kept EMPTY for alpha state (no seed data)

3. **status = Strict single-option**
   - Only one status value allowed at a time
   - Controlled transitions between states

4. **dtags = Instance-specific**
   - Content depends on local platform purpose
   - theaterpedia.org → Theater pedagogy taxonomy
   - Other instances may have completely different dtags

---

## 🗄️ Database Architecture

### Base Table (Migration 036)
```sql
CREATE TABLE sysreg (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL,           -- Bitmask value (32-bit)
    name TEXT NOT NULL,               -- Internal identifier
    description TEXT,
    tagfamily TEXT NOT NULL,          -- 'status', 'config', 'rtags', 'ctags', 'ttags', 'dtags'
    taglogic TEXT NOT NULL,           -- 'category', 'toggle', 'subcategory' (⚠️ 'option' DEPRECATED)
    is_default BOOLEAN DEFAULT false,
    multiselect BOOLEAN DEFAULT false, -- Allow multi-select in UI
    parent_bit INTEGER,               -- For subcategories: parent category bit
    name_i18n JSONB,                  -- Multilingual labels
    desc_i18n JSONB,                  -- Multilingual descriptions
    UNIQUE (value, tagfamily)
);
```

### Child Tables (6 families)
```sql
CREATE TABLE sysreg_status () INHERITS (sysreg);
CREATE TABLE sysreg_config () INHERITS (sysreg);
CREATE TABLE sysreg_rtags () INHERITS (sysreg);
CREATE TABLE sysreg_ctags () INHERITS (sysreg);
CREATE TABLE sysreg_ttags () INHERITS (sysreg);
CREATE TABLE sysreg_dtags () INHERITS (sysreg);
```

### Entity Integration
```sql
-- All entity tables have INTEGER sysreg columns:
status_val INTEGER,    -- Single status value
config_val INTEGER,    -- Configuration flags (bit field)
rtags_val INTEGER,     -- Record tags (currently empty)
ctags_val INTEGER,     -- Common tags (bit groups)
ttags_val INTEGER,     -- Topic tags (multi-toggle)
dtags_val INTEGER      -- Domain tags (bit groups with categories)
```

---

## 🎯 Bit Group Architecture

### Bit Encoding Rules

1. **Subcategory constraints**:
   - **0 subcategories** = 0 bits for variations (category is a leaf)
   - **2 subcategories** = 2 bits (values 0-3: not-set, category, sub1, sub2)
   - **6 subcategories** = 3 bits (values 0-7: not-set, + 6 variations)

2. **Category + Subcategory Pattern (2-bit)**:
   - Value 0: Not set / empty
   - Value 1: Category only (no subcategory selected)
   - Value 2: Subcategory 1
   - Value 3: Subcategory 2

3. **Extended Subcategory Pattern (3-bit)** - for categories like Forum:
   - Value 0: Not set / empty
   - Value 1-6: Subcategory 1-6
   - Value 7: Reserved / category-only

4. **parent_bit Column**:
   - Subcategories store the bit position of their parent category
   - Enables efficient filtering: `WHERE parent_bit = X`

### Example: dtags.spielform (bits 0-7)

| Bits | Category | Subcategories | Encoding |
|------|----------|---------------|----------|
| 0-1 | Kreisspiele | 2 (Impulskreis, Synchronkreis) | 2-bit |
| 2-3 | Raumlauf | 2 (Einzelgänger, Begegnungen) | 2-bit |
| 4-5 | Kleingruppen | 0 (none) | 2-bit (category only) |
| 6-8 | Forum | 6 (Abklatsch, Werkstatt, Showing, Durchlauf, ...) | 3-bit |

---

## 📁 Configuration File: sysreg-bitgroups.json

**Location:** `src/config/sysreg-bitgroups.json`

### Structure

```json
{
  "familyName": {
    "name": "internal_name",
    "label": { "de": "...", "en": "...", "cz": "..." },
    "description": { "de": "...", "en": "..." },
    "groups": [
      {
        "name": "group_name",
        "label": { "de": "...", "en": "..." },
        "description": { "de": "...", "en": "..." },
        "bits": [0, 1, 2, 3],
        "icon": "lucide-icon-name",
        "multiselect": false,
        "optional": false
      }
    ]
  }
}
```

### Family Definitions

| Family | Groups | Total Bits | Notes |
|--------|--------|------------|-------|
| **ctags** | 2 | 8 | age_group, subject_type |
| **dtags** | 4 | 32 | spielform, animiertes_theaterspiel, szenische_themenarbeit, paedagogische_regie |
| **ttags** | 2 | 16 | core_themes, extended_themes |
| **rtags** | 0 | 0 | Empty for alpha |
| **config** | 2 | 8 | visibility, features |
| **status** | n/a | n/a | Single-value, not bit groups |

---

## 🧩 Component Architecture

### Core Components (Exported in index.ts)

| Component | Purpose | Used By | Status |
|-----------|---------|---------|--------|
| `StatusBadge.vue` | Display status with icon/color | Multiple views | ✅ Keep |
| `SysregSelect.vue` | Dropdown for single selection | Entity forms | ✅ Keep |
| `SysregMultiToggle.vue` | Multi-toggle for tag families | TagGroupEditor | ✅ Keep |
| `SysregBitGroupSelect.vue` | Bit group dropdown | Admin views | ✅ Keep |
| `FilterChip.vue` | Tag filter chip | Gallery filters | ✅ Keep |
| `SysregFilterSet.vue` | Combined filter controls | Gallery views | ✅ Keep |

### Extended Components (Not in index.ts)

| Component | Purpose | Used By | Decision |
|-----------|---------|---------|----------|
| `TagFamilyEditor.vue` | Modal for editing tag family | TagFamilies | ✅ Keep - core editor |
| `TagGroupEditor.vue` | Individual group with categories | TagFamilyEditor | ✅ Keep - core editor |
| `TagFamilyTile.vue` | Display tile for current value | TagFamilies | ✅ Keep - core display |
| `TagFamilies.vue` | Container for all tag tiles | PostPage, SysregDemoView | ✅ Keep - wrapper |
| `SysregTagDisplay.vue` | Inline tag editor | EditPanel, EventPanel, ImagePreview | ⚠️ Review - complex state |
| `ImageStatusControls.vue` | Image workflow controls | (None found) | ❌ Remove - unused |

### Component Decision Matrix

| Component | Lines | Imports | Exports | Usage | Recommendation |
|-----------|-------|---------|---------|-------|----------------|
| `StatusBadge` | 81 | useSysregTags | ✅ index.ts | Multiple | **Keep** |
| `SysregSelect` | 120 | useSysregOptions | ✅ index.ts | Forms | **Keep** |
| `SysregMultiToggle` | 160 | useSysregOptions, Tags | ✅ index.ts | Editor | **Keep** |
| `SysregBitGroupSelect` | 95 | Options, BitGroups | ✅ index.ts | Admin | **Keep** |
| `FilterChip` | 60 | - | ✅ index.ts | Gallery | **Keep** |
| `SysregFilterSet` | 200 | useSysregTags | ✅ index.ts | Gallery | **Keep** |
| `TagFamilyEditor` | 180 | TagGroupEditor | ❌ | TagFamilies | **Keep** (add to index) |
| `TagGroupEditor` | 350 | useSysregOptions | ❌ | Editor | **Keep** (add to index) |
| `TagFamilyTile` | 130 | - | ❌ | TagFamilies | **Keep** (add to index) |
| `TagFamilies` | 128 | Tile, Editor | ❌ | PostPage | **Keep** (add to index) |
| `SysregTagDisplay` | 257 | SysregMultiToggle | ❌ | EditPanel, EventPanel | **Review** - consider simplification |
| `ImageStatusControls` | 507 | useImageStatus | ❌ | None | **Remove** - unused |

### Core Composables

| Composable | Location | Purpose | Status |
|------------|----------|---------|--------|
| `useSysregTags` | `src/composables/` | Bit operations, cache, CRUD | ✅ Active |
| `useSysregOptions` | `src/composables/` | Tag metadata & labels | ✅ Active |
| `useSysregBitGroups` | `src/composables/` | Bit group configuration | ✅ Active |
| `useTagFamilyEditor` | `src/composables/` | Editor state management | ✅ Active |
| `useImageStatus` | `src/composables/` | Image lifecycle management | ✅ Active |
| `useGalleryFilters` | `src/composables/` | Filter state for galleries | ✅ Active |
| `useSysreg` | `src/composables/` | Unified wrapper (facade) | ✅ Active |
| `useSysregStatus` | `src/composables/` | Status BYTEA helpers | ⚠️ Legacy (BYTEA) |

### Composable Notes

**`useSysreg.ts`** - Unified wrapper that re-exports from:
- `useSysregStatus` - Buffer/hex conversion
- `useSysregOptions` - Tag options
- `useSysregTags` - Bit operations
- `useSysregBitGroups` - Bit group config

Used by: `EditPanel.vue`, `SysregAdminView.vue`, `SysregDemo.vue`, `PostPage.vue`

**`useSysregStatus.ts`** - BYTEA-era helpers that may need review:
- `bufferToHex()` - Still useful for legacy Buffer handling
- `sanitizeStatusVal()` - Used by `EditPanel.vue` and `PostPage.vue`
- The main `useSysregStatus()` composable itself appears unused directly

---

## 🧪 Test Coverage

### Unit Tests

| Test File | Lines | Composable | Status |
|-----------|-------|------------|--------|
| `tests/unit/useSysregTags.spec.ts` | ~300 | useSysregTags | ✅ 55/55 passing |
| `tests/unit/useSysregOptions.spec.ts` | ~200 | useSysregOptions | ⚠️ 26/37 (BYTEA issues) |
| `tests/unit/useImageStatus.spec.ts` | ~150 | useImageStatus | ✅ Active |
| `tests/unit/useGalleryFilters.spec.ts` | ~100 | useGalleryFilters | ✅ Active |
| `tests/unit/useTagFamily.spec.ts` | ~100 | useTagFamily | ✅ Active |
| `tests/unit/useTagFamilyDisplay.spec.ts` | ~80 | useTagFamilyDisplay | ✅ Active |

### Component Tests

| Test File | Component | Status |
|-----------|-----------|--------|
| `tests/unit/StatusBadge.spec.ts` | StatusBadge | ✅ Active |
| `tests/unit/FilterChip.spec.ts` | FilterChip | ✅ Active |
| `tests/component/TagFamilies.spec.ts` | TagFamilies | ✅ Active |
| `tests/component/TagFamilyTile.spec.ts` | TagFamilyTile | ✅ Active |
| `tests/component/TagFamilyEditor.spec.ts` | TagFamilyEditor | ✅ Active |
| `tests/component/TagGroupEditor.spec.ts` | TagGroupEditor | ✅ Active |

### Test Helpers

| Helper File | Purpose |
|-------------|---------|
| `tests/helpers/sysreg-test-data.ts` | Factory functions for test data |
| `tests/helpers/sysreg-bytea-helpers.ts` | BYTEA assertion helpers |
| `tests/helpers/sysreg-mock-api.ts` | Mock API responses |

### Integration Tests

| Test File | Purpose |
|-----------|---------|
| `tests/unit/sysreg-integration.spec.ts` | End-to-end sysreg flows |

---

## 🌍 i18n Support

### Label Resolution Chain
1. Requested language (from `$i18n.locale`)
2. German (de) - default
3. English (en) - fallback
4. Internal name - last resort

### Multilingual Fields
```typescript
interface SysregEntry {
    name: string            // Internal name (e.g., 'democracy')
    name_i18n: {            // Multilingual labels
        de: "Demokratie",
        en: "Democracy",
        cz: "Demokracie"
    }
    desc_i18n?: {           // Multilingual descriptions
        de: "...",
        en: "..."
    }
}
```

### Usage in Components
```typescript
const { getTagLabel } = useSysregOptions()
const label = getTagLabel('ttags', entry.value)  // Returns localized label
```

---

## 📚 Related Documentation

### Current (Authoritative)
- **This file** - `docs/SYSREG_SPEC.md`
- `docs/SYSREG_SYSTEM.md` - Entry point (needs INTEGER update)
- `docs/SYSREG_BIT_GROUPS_IMPLEMENTATION.md` - Composable reference
- `docs/tasks/2025-11-27-SYSREG_ENHANCEMENT_PLAN.md` - Current implementation plan

### Historical (Reference Only)
- `docs/SYSREG_USECASE_DESIGN.md` - Original design (BYTEA)
- `docs/SYSREG_PHASE3_PHASE4_COMPLETE.md` - Phase 3-4 implementation
- `docs/SYSREG_Further_Planning.md` - Phase 7 planning

### Deprecated (Archive)
- `docs/SYSREG_TESTING_STRATEGY.md` - BYTEA-specific tests
- `docs/SYSREG_INTERFACE_SPECIFICATION_ISSUE.md` - Resolved issues
- `docs/SYSREG_STATUS_MIGRATION_ANALYSIS.md` - Migration complete

---

## 🔄 Migration History

| Migration | Description | Status |
|-----------|-------------|--------|
| 019 | Original status table | ✅ |
| 022-029 | Sysreg with BYTEA | ✅ |
| 036 | BYTEA → INTEGER conversion | ✅ |
| 037 | dtags restructure with parent_bit | 🔄 In Progress |

---

## ⚠️ Deprecations

### `taglogic: 'option'` - DEPRECATED

**Status:** Deprecated as of 2025-11-28  
**Replacement:** Use `taglogic: 'toggle'` instead  
**Removal:** Database constraint will be updated in a future migration

**Reason:** From a bitmask logic perspective, `option` and `toggle` are identical:
- Both are single-bit flags (power-of-2 values)
- Both can be independently set/unset
- The `multiselect` property on the **group** controls mutual exclusivity, not the taglogic

**Migration:** Change all `taglogic = 'option'` entries to `taglogic = 'toggle'`:
```sql
UPDATE sysreg SET taglogic = 'toggle' WHERE taglogic = 'option';
```

---

## 🔮 Future Enhancements (Phase 7+)

1. **Tag Relationships** - Parent-child, exclusivity, suggestions
2. **Tag Analytics** - Usage tracking, co-occurrence patterns
3. **Import/Export** - CSV/JSON for tag definitions
4. **Visual Editor** - UI for managing bit group configurations
5. **Validation Rules** - Required combinations, conflicts
