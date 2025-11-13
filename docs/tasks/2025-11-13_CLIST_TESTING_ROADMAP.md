# CList Testing Roadmap

**Date:** November 13, 2025  
**Status:** Test-Driven Development Active  
**Scope:** Entity-Components & Entity-Collections Testing

---

## 🎉 Recent Fixes (November 13, 2025)

### ✅ Issue A1: ImgShape Shape Compatibility
- **Problem:** ItemList passing incompatible shape values to ImgShape
- **Fix:** Updated ItemList shape computed to return 'thumb'/'square' instead of component type names
- **Impact:** Eliminated "Unknown dimensions" errors in dropdowns and lists
- **Tests:** All 229 component tests passing

### ✅ Issue A3: Horizontal Scrollbar in DropdownList
- **Problem:** Content extending beyond wrapper width causing horizontal scrollbar
- **Fix:** Added `overflow-x: hidden` to `.dropdown-list-wrapper` CSS
- **Tests:** All 20 wrapper control validation tests passing

### ✅ Issue A4: Width=Large Overflow in Non-Compact Mode
- **Problem:** ItemTile grid layout not respecting parent width constraints - text overflowing
- **Root Cause:** Prose component designed for page-level content with `max-width: 54rem` (864px), but being used in component-level contexts (cards, tiles, rows) where parent width is much smaller
- **Architectural Solution:**
  1. Added `scope` prop to Prose component: `'page'` (default) | `'element'`
  2. Scope='page': max-width: 54rem (current page-level behavior)
  3. Scope='element': 
     - max-width: none, min-width: 0 (no width constraints)
     - overflow: hidden (prevent content extension)
     - Text truncation: overflow: hidden, text-overflow: ellipsis, white-space: nowrap on headings
  4. Scope='element' also shifts heading sizes down (h3 uses h4 size, h4 uses h5 size, h5 uses h6 size)
  5. Updated ItemTile, ItemRow, ItemCard to pass `scope="element"` to HeadingParser
  6. Added container constraints to ItemTile: min-width: 0 on .tile-heading to allow grid shrinking
  7. Props cascade: ItemTile/ItemRow/ItemCard → HeadingParser → Heading → Prose
- **Files Modified:**
  - `/src/components/Prose.vue` - Added scope prop with element styles and text truncation
  - `/src/components/Heading.vue` - Added scope prop, pass to Prose
  - `/src/components/HeadingParser.vue` - Added scope prop, pass to Heading
  - `/src/components/clist/ItemTile.vue` - Pass scope="element", added container constraints
  - `/src/components/clist/ItemRow.vue` - Pass scope="element"
  - `/src/components/clist/ItemCard.vue` - Pass scope="element"
- **Impact:** 
  - Proper separation of page-level vs component-level typography
  - Element scope removes width constraints and uses smaller heading sizes
  - Long text properly truncates with ellipsis in constrained containers
  - All 229 component tests passing
- **Tests:** All 229 component tests passing

### ✅ Issue A6: Dropdown Width Too Narrow (RESOLVED)
- **Problem:** DropdownList with width="large" displaying at ~336px instead of intended 504px - items visible through gaps
- **Root Causes:**
  1. CSS variable `--card-width` not available in floating-vue popper context (isolated DOM)
  2. `.dropdown-content` had hardcoded `max-width: 24rem` (384px) constraining entire dropdown
- **Solution Applied:**
  1. Added `--card-width: '21rem'` to `systemTheme` computed property (propagates to floating context)
  2. Added `contentMaxWidth` computed based on width prop:
     - width="small": 12.5rem (200px + padding)
     - width="medium": 23rem (368px + padding)  
     - width="large": 33.5rem (536px + padding)
  3. Bound dynamic max-width to `.dropdown-content`: `:style="{ ...systemTheme, maxWidth: contentMaxWidth }"`
  4. Added CSS fallback values: `var(--card-width, 21rem)` for robustness
- **Files Modified:**
  - `/src/components/clist/DropdownList.vue` - systemTheme with --card-width, contentMaxWidth computed, dynamic max-width binding
- **Impact:**
  - Dropdown wrapper now correctly expands to full intended width
  - width="large" displays at proper 504px
  - No more "see through" gaps
  - All 240 production tests passing
- **Tests:** All 240 component tests passing (5 diagnostic test expected failures)

---

## Overview

This document outlines the test-driven approach for CList components, spanning from core image functionality (ImgShape) up to page-level components (pList, pGallery).

**Philosophy:** Tests are the primary specification documents. All implementation follows test definitions.

---

## File Organization

### Test Files Location: `/tests/unit/clist/`

```
tests/unit/clist/
├── imgShape.test.ts                    # Core image component
├── itemCard.test.ts                    # Card layout entity component
├── itemTile.test.ts                    # Tile layout entity component
├── itemRow.test.ts                     # Row layout entity component
├── itemList.test.ts                    # List collection component
├── itemGallery.test.ts                 # Gallery collection component
├── dropdownList.test.ts                # Dropdown list wrapper
├── dropdownGallery.test.ts             # Dropdown gallery wrapper
├── pList.test.ts                       # Page-level list component
└── pGallery.test.ts                    # Page-level gallery component
```

### Documentation Files Location: `/docs/tasks/`

```
docs/tasks/
├── 2025-11-13_CLIST_TESTING_ROADMAP.md           # This file - overall test strategy
├── 2025-11-13_TEST_SPEC_IMGSHAPE.md              # ImgShape test specifications
├── 2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md     # ItemCard/Tile/Row specifications
├── 2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md    # ItemList/Gallery specifications
├── 2025-11-13_TEST_SPEC_DROPDOWNS.md             # Dropdown wrapper specifications
├── 2025-11-13_TEST_SPEC_PAGE_COMPONENTS.md       # pList/pGallery specifications
└── 2025-11-13_TEST_SPEC_INTEGRATION.md           # Integration testing specs
```

---

## Component Hierarchy & Test Dependencies

```
ImgShape (Core)
  ↓
Entity-Components (ItemCard, ItemTile, ItemRow)
  ↓
Entity-Collections (ItemList, ItemGallery)
  ↓
Dropdown Wrappers (DropdownList, DropdownGallery)
  ↓
Page Components (pList, pGallery)
```

**Test Order:** Bottom-up (start with ImgShape, end with page components)

---

## Current Issues (Fix First)

### A1. ImgShape Shape Compatibility ✅ RESOLVED

**File:** `tests/unit/clist/imgShape.test.ts`  
**Priority:** 🔴 Critical  
**Status:** ✅ RESOLVED (November 13, 2025)

**Problem:**
- ImgShape reports 'unknown dimension' when rendered via ItemList/pList
- ItemList was passing component type names ('tile', 'card', 'avatar') instead of ImgShape dimension types

**Solution Applied:**
```typescript
// Fixed in ItemList.vue (Lines ~234-248)
const shape = computed<'thumb' | 'square'>(() => {
    if (props.size === 'small') return 'thumb'  // 64px for img_thumb
    return 'square'  // 128px for img_square
})
```

**Verification:** All 229 component tests passing, including 28 ImgShape integration tests

### A2. Avatar Shape Option Not Applied

**File:** `tests/unit/clist/imgShape.test.ts`  
**Priority:** 🟡 High  
**Status:** 📝 Ready to Implement

**Problem:**
- Thumb shape no longer shows circular 'avatar' style borders
- Renaming from 'avatar' to 'thumb' broke the styling

**Test Specification:** See `2025-11-13_TEST_SPEC_IMGSHAPE.md` → Section A2

**Implementation Requirements:**

1. **Add Avatar Prop to ImgShape.vue:**
```typescript
interface Props {
  shape: 'thumb' | 'square' | 'wide' | 'vertical'
  avatar?: boolean  // NEW: Enable circular borders
  data: ImgShapeData
  // ... other props
}
```

2. **Add CSS Class in ImgShape.vue:**
```css
.img-shape.avatar-style {
  border-radius: 50% !important;
  overflow: hidden;
}
```

3. **Entity-Component Decision Logic:**
```typescript
// ItemRow.vue, ItemTile.vue, ItemCard.vue
const shouldUseAvatar = computed(() => {
  if (!props.data?.xmlID) return false
  
  const xmlIdFragment2 = props.data.xmlID.split('.')[1]
  const isAvatarEntity = ['event', 'instructor', 'post'].includes(xmlIdFragment2)
  const isAvatarShape = props.shape === 'thumb' || props.shape === 'square'
  
  return isAvatarEntity && isAvatarShape
})

// Pass to ImgShape
<ImgShape :avatar="shouldUseAvatar" :shape="shape" :data="data" />
```

**Validation:**
- Only thumb/square shapes support avatar
- Only event/instructor/post entities use avatar
- Wide/vertical shapes always use rectangular borders

---

## New Features (Test & Implement)

### B1. Checkbox Visibility Logic

**File:** `tests/unit/clist/itemList.test.ts`, `tests/unit/clist/itemGallery.test.ts`  
**Priority:** 🟡 High  
**Status:** 📝 Ready to Implement

**Test Specification:** See `2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md` → Section B1

**Implementation Requirements:**

1. **Collections Calculate Selectable:**
```typescript
// ItemList.vue, ItemGallery.vue
const itemOptions = computed(() => ({
  selectable: props.dataMode && props.multiSelect  // true = show checkbox
}))
```

2. **Entity-Components Render Checkbox Conditionally:**
```typescript
// ItemRow.vue, ItemTile.vue, ItemCard.vue
<template>
  <div class="item-row" :class="rowClasses">
    <!-- Checkbox visible ONLY when options.selectable=true -->
    <input 
      v-if="options.selectable" 
      type="checkbox" 
      :checked="models.selected"
      @change="handleSelection"
    />
    <!-- Rest of component -->
  </div>
</template>
```

3. **Hover Pointer Behavior (Desktop):**
```css
/* When checkbox NOT visible, show pointer cursor on hover */
.item-row:not(:has(.checkbox)) {
  cursor: pointer;
}

/* When checkbox IS visible, default cursor (checkbox handles pointer) */
.item-row:has(.checkbox) {
  cursor: default;
}
```

4. **Selection Highlights:**
```typescript
// Multi-select (checkbox visible): Primary highlight
const rowClasses = computed(() => ({
  'selected': models.selected && options.selectable,
  'primary-highlight': models.selected && options.selectable,
  // Single-select (no checkbox): Secondary highlight
  'secondary-highlight': models.selected && !options.selectable
}))
```

**CSS Specifications:**
```css
/* Primary highlight (with checkbox) */
.item-row.selected.primary-highlight {
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* Secondary highlight (without checkbox) */
.item-row.selected.secondary-highlight {
  background-color: var(--color-secondary-bg);
  color: var(--color-secondary-contrast);
}
```

**Test Cases:**
1. `selectable=true` → Checkbox visible, default cursor
2. `selectable=false` → No checkbox, pointer cursor on hover
3. `selectable=true + selected=true` → Checked checkbox, primary highlight
4. `selectable=false + selected=true` → No checkbox, secondary highlight

### B2. DropdownList Trigger Shows Selected Entity

**File:** `tests/unit/clist/dropdownList.test.ts`  
**Priority:** 🟡 High  
**Status:** 📝 Ready to Implement

**Test Specification:** See `2025-11-13_TEST_SPEC_DROPDOWNS.md` → Section B2

**Implementation Requirements:**

1. **Trigger Display Logic:**
```typescript
// DropdownList.vue, DropdownGallery.vue
const triggerContent = computed(() => {
  if (!props.dataMode || selectedIds.value.length === 0) {
    return { type: 'placeholder', text: props.placeholder || 'Select...' }
  }
  
  if (selectedIds.value.length === 1) {
    const entity = selectedEntities.value[0]
    return { 
      type: 'single', 
      title: entity.title,
      avatar: entity.img_thumb,
      xmlID: entity.xmlID
    }
  }
  
  return {
    type: 'multiple',
    count: selectedIds.value.length,
    avatars: selectedEntities.value.slice(0, 8).map(e => e.img_thumb),
    hasMore: selectedIds.value.length > 8
  }
})
```

2. **Template Structure:**
```vue
<template>
  <div class="dropdown-trigger" @click="toggleDropdown">
    <!-- No selection -->
    <span v-if="triggerContent.type === 'placeholder'">
      {{ triggerContent.text }}
    </span>
    
    <!-- Single selection -->
    <div v-else-if="triggerContent.type === 'single'" class="trigger-single">
      <ImgShape 
        :shape="'thumb'" 
        :avatar="shouldUseAvatar(triggerContent.xmlID)"
        :data="triggerContent.avatar"
        :size="32"
      />
      <span class="trigger-title">{{ triggerContent.title }}</span>
    </div>
    
    <!-- Multiple selections -->
    <div v-else class="trigger-multiple">
      <div class="stacked-avatars">
        <ImgShape
          v-for="(avatar, index) in triggerContent.avatars"
          :key="index"
          :shape="'thumb'"
          :avatar="shouldUseAvatar(selectedEntities[index].xmlID)"
          :data="avatar"
          :size="32"
          :style="{ zIndex: triggerContent.avatars.length - index }"
          class="stacked-avatar"
        />
      </div>
      <span class="selection-count">
        {{ triggerContent.count }} {{ props.entity }} selected
      </span>
      <span v-if="triggerContent.hasMore" class="more-indicator">
        +{{ triggerContent.count - 8 }} more
      </span>
    </div>
  </div>
</template>
```

3. **CSS for Stacked Avatars:**
```css
.stacked-avatars {
  display: flex;
  margin-left: -8px;
}

.stacked-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-bg);
  margin-left: -8px;
}

.stacked-avatar:first-child {
  margin-left: 0;
}
```

**Test Cases:**
1. No selection → Placeholder text
2. Single selection → Avatar + title
3. Multiple (≤8) → All avatars + count
4. Multiple (>8) → First 8 avatars + count + "+N more"
5. Avatar entities → Circular borders
6. Non-avatar entities → Square borders

---

## Test File Naming Convention

**Format:** `[component-name].test.ts`

**Examples:**
- `imgShape.test.ts` (not imgShape.spec.ts)
- `itemCard.test.ts` (not ItemCard.test.ts)
- `dropdownList.test.ts` (not DropdownList.test.ts)

**Rationale:** Lowercase kebab-case matches Vue component filename convention

---

## Test Structure Template

```typescript
/**
 * [Component Name] - Unit Tests
 * 
 * Test Specification: /docs/tasks/2025-11-13_TEST_SPEC_[COMPONENT].md
 * Component: /src/components/[path]/[Component].vue
 * 
 * This test file serves as the PRIMARY specification.
 * All implementation must follow these test definitions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Component from '@/components/[path]/Component.vue'

describe('[Component Name]', () => {
  describe('Issue A1: [Description]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    })
  })
  
  describe('Feature B1: [Description]', () => {
    it('should [expected behavior]', () => {
      // Test implementation
    })
  })
})
```

---

## Test Execution Strategy

### Phase 1: Fix Critical Issues (A1, A2)
```bash
npm run test:unit -- tests/unit/clist/imgShape.test.ts
```

### Phase 2: Implement New Features (B1, B2)
```bash
npm run test:unit -- tests/unit/clist/itemList.test.ts
npm run test:unit -- tests/unit/clist/itemGallery.test.ts
npm run test:unit -- tests/unit/clist/dropdownList.test.ts
```

### Phase 3: Integration Tests
```bash
npm run test:unit -- tests/unit/clist/
```

### Watch Mode (During Development)
```bash
npm run test:unit -- tests/unit/clist/imgShape.test.ts --watch
```

---

## Documentation Links

### Related Specifications
- `/docs/2025-11-10_CLIST_DESIGN_SPEC.md` - Overall CList design
- `/docs/CLIST_SELECTION_SYSTEM_GUIDE.md` - Selection behavior
- `/docs/tasks/2025-11-13_TEST_SPEC_*.md` - Detailed test specifications

### Component Documentation
- `/src/components/clist/README.md` - Component usage guide
- `/src/components/images/ImgShape.vue` - Image component source

---

## Next Steps

1. ✅ Move `/tasks/*.md` to `/docs/tasks/`
2. 📝 Create detailed test specification files
3. 🧪 Write test for Issue A1 (ImgShape dimensions)
4. 🧪 Write test for Issue A2 (Avatar shape option)
5. 🔧 Fix implementations to pass tests
6. 🧪 Write tests for Feature B1 (Checkbox logic)
7. 🧪 Write tests for Feature B2 (Dropdown trigger)
8. 🔧 Implement new features to pass tests
9. 🧪 Write integration tests
10. 📚 Update component documentation

---

## Success Criteria

- [ ] All ImgShape dimension tests pass
- [ ] Avatar shape option works correctly
- [ ] Checkbox visibility logic implemented
- [ ] DropdownList trigger shows selected entities
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Components work in production

---

## Notes

- Tests are written BEFORE implementation
- Each test file links to its specification document
- Test failures guide implementation priorities
- Component authority: Entity-Components decide avatar option based on xmlID
