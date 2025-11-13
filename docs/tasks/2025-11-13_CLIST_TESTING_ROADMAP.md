# CList Testing Roadmap

**Date:** November 13, 2025  
**Status:** Test-Driven Development Active  
**Scope:** Entity-Components & Entity-Collections Testing

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

### A1. ImgShape Dimension Detection Issue

**File:** `tests/unit/clist/imgShape.test.ts`  
**Priority:** 🔴 Critical  
**Status:** ❌ Failing

**Problem:**
- ImgShape reports 'unknown dimension' when rendered via ItemList/pList
- Dimensions should come from `useTheme()` composable

**Test Specification:** See `2025-11-13_TEST_SPEC_IMGSHAPE.md` → Section A1

**Expected Behavior:****
```typescript
// Should read dimensions from CSS variables
const { avatarWidth, tileWidth, cardWidth } = useTheme()

// ItemRow with thumb shape → 64px (avatarWidth)
// ItemTile with square shape → 128px (tileWidth)
// ItemCard with wide shape → 336px (cardWidth)
```

### A2. Avatar Shape Option Not Applied

**File:** `tests/unit/clist/imgShape.test.ts`  
**Priority:** 🔴 Critical  
**Status:** ❌ Failing

**Problem:**
- Thumb shape no longer shows circular 'avatar' style borders
- Renaming from 'avatar' to 'thumb' broke the styling

**Test Specification:** See `2025-11-13_TEST_SPEC_IMGSHAPE.md` → Section A2

**Expected Behavior:****
```typescript
// Avatar option = circular borders (border-radius: 50%)
// Should activate ONLY for:
// - thumb shape OR square shape
// - entities: events, posts, instructors
// - Authority: Entity-Item-Components decide based on xmlID fragment 2
```

**Entity-Component Decision Logic:**
```typescript
// ItemRow.vue, ItemTile.vue, ItemCard.vue have access to entity data
const xmlIdFragment2 = item.xmlID.split('.')[1] // 'event', 'instructor', 'post'
const isAvatarEntity = ['event', 'instructor', 'post'].includes(xmlIdFragment2)
const isAvatarShape = shape === 'thumb' || shape === 'square'
const avatarOption = isAvatarEntity && isAvatarShape
```

---

## New Features (Test & Implement)

### B1. Checkbox Visibility Logic

**File:** `tests/unit/clist/itemList.test.ts`, `tests/unit/clist/itemGallery.test.ts`  
**Priority:** 🟡 High  
**Status:** 📝 To Implement

**Test Specification:** See `2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md` → Section B1

**Rules:**
```typescript
// Show checkbox ONLY when:
// 1. Entity-Collection has dataMode=true
// 2. Entity-Collection has multiSelect=true

// If dataMode=true AND multiSelect=false (or undefined):
// - NO checkbox
// - Selected item highlighted with:
//   - Background: var(--color-secondary-bg)
//   - Text: var(--color-secondary-contrast)
```

**Test Cases:**
1. `dataMode=true + multiSelect=true` → Checkbox visible
2. `dataMode=true + multiSelect=false` → No checkbox, secondary highlight
3. `dataMode=true + multiSelect=undefined` → No checkbox, secondary highlight
4. `dataMode=false` → No checkbox, no highlight

### B2. DropdownList Trigger Shows Selected Entity

**File:** `tests/unit/clist/dropdownList.test.ts`  
**Priority:** 🟡 High  
**Status:** 📝 To Implement

**Test Specification:** See `2025-11-13_TEST_SPEC_DROPDOWNS.md` → Section B2

**Rules:****
```typescript
// In dataMode, trigger should display:
// - Single selection: Entity title + avatar
// - Multiple selections: Count badge + stacked avatars (max 8)
// - XML ID display: Simplified format "prefix.type: id1, id2, id3"
```

**Test Cases:**
1. No selection → Default trigger text
2. Single selection → Show entity title + avatar
3. Multiple selections (≤8) → Show all stacked avatars
4. Multiple selections (>8) → Show first 8 + count badge
5. Display XML mode → Show simplified XML format

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
