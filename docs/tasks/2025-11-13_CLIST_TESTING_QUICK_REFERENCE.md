# CList Testing Quick Reference

**Quick access guide to all test specifications and implementation checklists.**

---

## 📋 Test Specifications Overview

| Component | Test File | Spec Document | Test Count | Status |
|-----------|-----------|---------------|------------|--------|
| **ImgShape** | `imgShape.test.ts` | [2025-11-13_TEST_SPEC_IMGSHAPE.md](./2025-11-13_TEST_SPEC_IMGSHAPE.md) | 20+ tests | 🔴 To Create |
| **ItemRow/Tile/Card** | `itemRow.test.ts`, etc. | [2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md](./2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md) | 14+ tests | 🔴 To Create |
| **ItemList/Gallery** | `itemList.test.ts`, etc. | [2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md](./2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md) | 22+ tests | 🔴 To Create |
| **DropdownList/Gallery** | `dropdownList.test.ts`, etc. | [2025-11-13_TEST_SPEC_DROPDOWNS.md](./2025-11-13_TEST_SPEC_DROPDOWNS.md) | 17+ tests | 🔴 To Create |
| **pList/pGallery** | `pList.test.ts`, etc. | [2025-11-13_TEST_SPEC_PAGE_COMPONENTS.md](./2025-11-13_TEST_SPEC_PAGE_COMPONENTS.md) | 18+ tests | 🔴 To Create |
| **Integration** | `avatar-flow.test.ts`, etc. | [2025-11-13_TEST_SPEC_INTEGRATION.md](./2025-11-13_TEST_SPEC_INTEGRATION.md) | 10+ tests | 🔴 To Create |

**Total Test Cases Defined:** 100+ tests

---

## 🎯 Current Issues & Features

### 🔴 Issue A1: ImgShape Unknown Dimension
- **Problem:** ImgShape reports 'unknown dimension' in ItemList
- **Root Cause:** Not reading useTheme() dimensions correctly
- **Solution:** Fix reactive dimension watching in ImgShape.vue
- **Test Cases:** TC-A1.1 to TC-A1.4 (4 tests)
- **Spec:** [2025-11-13_TEST_SPEC_IMGSHAPE.md](./2025-11-13_TEST_SPEC_IMGSHAPE.md#issue-a1-unknown-dimension-detection)

### 🔴 Issue A2: Avatar Option Lost
- **Problem:** Thumb shape lost circular borders after renaming
- **Root Cause:** Avatar should be a style option, not a shape name
- **Solution:** Add `avatar?: boolean` prop to ImgShape + Entity-Component logic
- **Test Cases:** TC-A2.1 to TC-A2.13 (13 tests)
- **Specs:**
  - [2025-11-13_TEST_SPEC_IMGSHAPE.md](./2025-11-13_TEST_SPEC_IMGSHAPE.md#issue-a2-avatar-shape-option-not-applied)
  - [2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md](./2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md#avatar-option-determination)

### 🟡 Feature B1: Checkbox Visibility Logic
- **Requirements:**
  - Show checkbox ONLY when `dataMode=true` AND `multiSelect=true`
  - Single selection: Use secondary highlight (no checkbox)
  - Multi selection: Use primary highlight (with checkbox)
- **Test Cases:** TC-B1.1 to TC-B1.20 (20 tests)
- **Specs:**
  - [2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md](./2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md#feature-b1-checkbox-visibility)
  - [2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md](./2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md#feature-b1-checkbox-visibility-determination)

### 🟡 Feature B2: Dropdown Trigger Display
- **Requirements:**
  - No selection: Placeholder text
  - Single selection: Avatar + title
  - Multiple selections: Stacked avatars (max 8) + count
- **Test Cases:** TC-B2.1 to TC-B2.17 (17 tests)
- **Spec:** [2025-11-13_TEST_SPEC_DROPDOWNS.md](./2025-11-13_TEST_SPEC_DROPDOWNS.md#feature-b2-dropdown-trigger-shows-selected-entity)

---

## 🏗️ Component Architecture

### Data Flow (Props Down)
```
pList/pGallery
  entity="events"
  multiSelect=true
  selectedIds=[1, 2]
    ↓
ItemList/ItemGallery
  dataMode=true
  multiSelect=true
  options.selectable=true
    ↓
ItemRow/ItemTile/ItemCard
  data.xmlID="tp.event.summer-2024"
  options.selectable=true
  models.selected=true
    ↓
ImgShape
  shape="thumb"
  avatar=true
  data.url="image.jpg"
```

### Event Flow (Events Up)
```
ImgShape (load event)
    ↑
ItemRow (click event, emit update:selectedIds)
    ↑
ItemList (accumulate selections, emit update:selectedIds)
    ↑
pList (v-model binding)
```

---

## 🧪 Test File Locations

```
/tests/unit/clist/
  imgShape.test.ts              # ImgShape unit tests
  itemRow.test.ts               # ItemRow unit tests
  itemTile.test.ts              # ItemTile unit tests
  itemCard.test.ts              # ItemCard unit tests
  itemList.test.ts              # ItemList unit tests
  itemGallery.test.ts           # ItemGallery unit tests
  dropdownList.test.ts          # DropdownList unit tests
  dropdownGallery.test.ts       # DropdownGallery unit tests
  pList.test.ts                 # pList integration tests
  pGallery.test.ts              # pGallery integration tests

/tests/integration/clist/
  avatar-flow.test.ts           # Avatar option integration
  selection-flow.test.ts        # Selection system integration
  dropdown-flow.test.ts         # Dropdown feature integration

/tests/e2e/
  clist-workflows.spec.ts       # End-to-end workflows (Playwright)
```

---

## ✅ Implementation Checklists

### ImgShape Component
- [ ] Add `avatar?: boolean` prop
- [ ] Add `.avatar-style` CSS class with `border-radius: 50%`
- [ ] Restrict avatar to thumb/square shapes only
- [ ] Fix dimension detection from useTheme()
- [ ] Add reactive watching of theme values
- [ ] Validate dimensions before rendering
- [ ] Show warning if dimensions unknown

### Entity-Components (ItemRow, ItemTile, ItemCard)
- [ ] Parse xmlID to determine entity type
- [ ] Implement `shouldUseAvatar` computed property
- [ ] Pass `avatar` prop to ImgShape
- [ ] Implement checkbox rendering based on `options.selectable`
- [ ] Apply primary highlight when `options.selectable=true`
- [ ] Apply secondary highlight when `options.selectable=false`
- [ ] Emit `update:selectedIds` on click/change
- [ ] Handle keyboard selection (Space/Enter)

### Entity-Collections (ItemList, ItemGallery)
- [ ] Calculate `options.selectable = dataMode && multiSelect`
- [ ] Pass selectable to Entity-Components
- [ ] Manage selection state (single vs multi)
- [ ] Emit `update:selectedIds` event
- [ ] Emit `selectedXml` event
- [ ] Emit `selected` event with full entities
- [ ] Fetch entity data from API
- [ ] Filter by XML prefix/pattern

### Dropdowns (DropdownList, DropdownGallery)
- [ ] Detect selection state (none/single/multiple)
- [ ] Render placeholder when no selection
- [ ] Render avatar + title for single selection
- [ ] Render stacked avatars for multiple selections
- [ ] Show count badge for multiple selections
- [ ] Limit avatars to first 8, show "+N more"
- [ ] Determine avatar option based on entity type
- [ ] Open/close dropdown on trigger click
- [ ] Close dropdown on outside click
- [ ] Update trigger when selection changes

### Page Components (pList, pGallery)
- [ ] Integrate ItemList/ItemGallery
- [ ] Pass props down correctly
- [ ] Handle selection events
- [ ] Implement search functionality
- [ ] Implement filtering
- [ ] Implement pagination
- [ ] Show empty states
- [ ] Show error states with retry
- [ ] Support keyboard navigation
- [ ] Add ARIA attributes

---

## 🚀 Test Execution Strategy

### Bottom-Up Approach

1. **Phase 1: Core Components**
   ```bash
   pnpm test tests/unit/clist/imgShape.test.ts
   ```
   - Fix Issue A1 (dimension detection)
   - Fix Issue A2 (avatar prop)

2. **Phase 2: Entity Components**
   ```bash
   pnpm test tests/unit/clist/itemRow.test.ts
   pnpm test tests/unit/clist/itemTile.test.ts
   pnpm test tests/unit/clist/itemCard.test.ts
   ```
   - Implement avatar determination logic
   - Implement checkbox rendering

3. **Phase 3: Collections**
   ```bash
   pnpm test tests/unit/clist/itemList.test.ts
   pnpm test tests/unit/clist/itemGallery.test.ts
   ```
   - Implement Feature B1 (checkbox visibility)
   - Implement selection state management

4. **Phase 4: Dropdowns**
   ```bash
   pnpm test tests/unit/clist/dropdownList.test.ts
   pnpm test tests/unit/clist/dropdownGallery.test.ts
   ```
   - Implement Feature B2 (trigger display)

5. **Phase 5: Page Components**
   ```bash
   pnpm test tests/unit/clist/pList.test.ts
   pnpm test tests/unit/clist/pGallery.test.ts
   ```
   - Integration testing

6. **Phase 6: Integration Tests**
   ```bash
   pnpm test tests/integration/clist/
   ```
   - Verify end-to-end flows

7. **Phase 7: E2E Tests**
   ```bash
   pnpm test:e2e tests/e2e/clist-workflows.spec.ts
   ```
   - Browser-based testing

### Run All CList Tests
```bash
pnpm test tests/unit/clist/
pnpm test tests/integration/clist/
pnpm test:e2e tests/e2e/clist-workflows.spec.ts
```

---

## 📊 Test Coverage Goals

| Component | Unit Tests | Integration Tests | E2E Tests | Total |
|-----------|------------|-------------------|-----------|-------|
| ImgShape | 20 | 2 | 1 | 23 |
| ItemRow/Tile/Card | 14 | 4 | 1 | 19 |
| ItemList/Gallery | 22 | 8 | 1 | 31 |
| DropdownList/Gallery | 17 | 3 | 1 | 21 |
| pList/pGallery | 18 | 0 | 2 | 20 |
| **Total** | **91** | **17** | **6** | **114** |

---

## 🎨 CSS Specifications

### Avatar Style
```css
.avatar-style {
  border-radius: 50% !important;
  overflow: hidden;
}
```

### Primary Highlight (Multi-Select)
```css
.selected.primary-highlight {
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}
```

### Secondary Highlight (Single-Select)
```css
.selected.secondary-highlight {
  background-color: var(--color-secondary-bg);
  color: var(--color-secondary-contrast);
}
```

### Stacked Avatars
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

---

## 🔍 Key Design Decisions

### Avatar Authority
- **Decision:** Entity-Components (ItemRow/Tile/Card) have authority to decide avatar option
- **Reason:** They have access to xmlID and can parse entity type
- **Implementation:** `shouldUseAvatar` computed property

### Checkbox Visibility
- **Decision:** Collections calculate `options.selectable = dataMode && multiSelect`
- **Reason:** Collections manage data fetching and know selection mode
- **Implementation:** Pass selectable in options object

### Selection Highlights
- **Decision:** Two different highlight styles for single vs multi
- **Reason:** Multi-select needs checkbox focus, single-select uses row highlighting
- **Implementation:** CSS classes based on `options.selectable`

### Avatar Eligibility
- **Decision:** Only event, instructor, post entities can use avatar
- **Reason:** These represent people/events, others represent things
- **Implementation:** Whitelist check in `shouldUseAvatar` computed

### Shape Restrictions
- **Decision:** Avatar only works on thumb/square shapes
- **Reason:** Wide/banner shapes don't make visual sense as circles
- **Implementation:** Shape check in `shouldUseAvatar` computed

---

## 📚 Related Documentation

- [2025-11-13_CLIST_TESTING_ROADMAP.md](./2025-11-13_CLIST_TESTING_ROADMAP.md) - Overall testing strategy
- [CLIST_SELECTION_SYSTEM_GUIDE.md](../CLIST_SELECTION_SYSTEM_GUIDE.md) - Selection system design
- [DEV_TESTING_VITEST_GUIDE.md](../DEV_TESTING_VITEST_GUIDE.md) - Vitest setup and usage

---

## 🚦 Status Legend

- 🔴 **To Create** - Test file needs to be created
- 🟡 **In Progress** - Tests partially written
- 🟢 **Complete** - All tests written and passing
- 🔵 **Integration** - Integration/E2E tests

---

## Next Steps

1. **Create first test file:** `tests/unit/clist/imgShape.test.ts`
2. **Implement Issue A1 fix:** ImgShape dimension detection
3. **Implement Issue A2 fix:** Avatar prop and styling
4. **Run tests:** Verify fixes work correctly
5. **Continue bottom-up:** Move to Entity-Components tests
6. **Iterate:** Test → Implement → Verify → Repeat

---

**Last Updated:** November 13, 2025  
**Total Test Cases Defined:** 114 tests  
**Total Components Covered:** 10 components  
**Test Coverage Target:** 95%+
