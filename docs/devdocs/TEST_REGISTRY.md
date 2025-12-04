# Test Registry

> **Purpose**: Map every test file to its origin documentation  
> **Primary Audience**: Code automation (AI assistants)  
> **Last Updated**: 2025-12-04

---

## Quick Reference

| Test Category | Files | Primary Entry Point |
|---------------|-------|---------------------|
| **Unit Tests** | 26 files | `2025-11-14_TEST_STATUS.md` |
| **Component Tests** | 22 files | `2025-11-13_CLIST_TESTING_ROADMAP.md` |
| **Integration Tests** | 7 files | `TEST_INFRASTRUCTURE.md` |
| **Database Tests** | 1 file | `TEST_INFRASTRUCTURE.md` |

---

## Entry Point Documents

### 1. Primary: `docs/devdocs/TEST_INFRASTRUCTURE.md`
- **Scope**: Global test setup, patterns, DB skip logic
- **Use for**: Understanding how tests run, environment setup

### 2. CList Ecosystem: `chat/tasks/2025-11-13_CLIST_TESTING_ROADMAP.md`
- **Scope**: Entity-Components, Entity-Collections testing
- **Use for**: ItemRow/Tile/Card/List/Gallery tests
- **Children**:
  - `2025-11-13_TEST_SPEC_IMGSHAPE.md` - ImgShape specs
  - `2025-11-13_TEST_SPEC_ENTITY_COMPONENTS.md` - ItemRow/Tile/Card
  - `2025-11-13_TEST_SPEC_ENTITY_COLLECTIONS.md` - ItemList/Gallery
  - `2025-11-13_TEST_SPEC_DROPDOWNS.md` - DropdownList/Gallery
  - `2025-11-13_TEST_SPEC_PAGE_COMPONENTS.md` - pList/pGallery
  - `2025-11-13_TEST_SPEC_INTEGRATION.md` - Cross-component

### 3. Status Snapshot: `chat/tasks/2025-11-14_TEST_STATUS.md`
- **Scope**: Inventory of all active test files
- **Use for**: Quick lookup of what exists

### 4. Versioned Tests: `chat/tasks/2025-11-30-TDD-IMPLEMENTATION-PLAN.md`
- **Scope**: Version-gated test infrastructure (`v()`, `vDescribe`)
- **Use for**: Understanding version filtering

---

## Test File Registry

### Unit Tests (`tests/unit/`)

| File | Origin Doc | Status |
|------|------------|--------|
| `posts-permissions.test.ts` | NEW (Dec 4) | ✅ 88 tests |
| `i18n-composable.test.ts` | TEST_STATUS | ✅ PostgreSQL |
| `rebuildShapeUrlWithXYZ.test.ts` | _archived/TEST_IMPLEMENTATION_SUMMARY | ✅ |
| `shape-editor.test.ts` | _archived/PLAN_G_INTEGRATION_TESTS | ✅ |
| `dateTimeFormat.test.ts` | 2025-11-26_DATETIME_PLUGIN_TESTING | ⚠️ Date fixes |
| `clist-test-data.test.ts` | TEST_HELPER_STATUS | ✅ 31 tests |
| `fetch-mock.test.ts` | TEST_HELPER_STATUS | ✅ |
| `keyboard-helpers.test.ts` | TEST_STATUS | ✅ |
| `mount-helpers.test.ts` | TEST_STATUS | ✅ |
| `dropdown-helpers.test.ts` | TEST_STATUS | ✅ |
| `selection-helpers.test.ts` | TEST_STATUS | ✅ |
| `ItemRow.headingPrefix.spec.ts` | TEST_STATUS (Nov 14) | ✅ |
| `ItemList.eventSorting.spec.ts` | TEST_STATUS (Nov 14) | ✅ |
| `ItemGallery.eventSorting.spec.ts` | TEST_STATUS (Nov 14) | ✅ |
| `ItemCard.anatomy.spec.ts` | TEST_STATUS (Nov 14) | ✅ |
| `ItemSlider.test.ts` | 2025-11-16_ITEMSLIDER_IMPLEMENTATION | ✅ |
| `pSlider.test.ts` | 2025-11-16_ITEMSLIDER_IMPLEMENTATION | ✅ |
| `FilterChip.spec.ts` | CLIST_TESTING_ROADMAP | ✅ |
| `StatusBadge.spec.ts` | CLIST_TESTING_ROADMAP | ✅ |
| `common.versioned-test-demo.spec.ts` | TDD-IMPLEMENTATION-PLAN | ✅ Demo |
| `useSysregOptions.spec.ts` | SYSREG docs | ✅ |
| `useTagFamily.spec.ts` | TAG_FAMILY docs | ✅ |
| `useTagFamilyDisplay.spec.ts` | TAG_FAMILY docs | ✅ |
| `useTagFamilyEditor.spec.ts` | TAG_FAMILY docs | ✅ |
| `useGalleryFilters.spec.ts` | CLIST_TESTING_ROADMAP | ✅ |
| `useImageStatus.spec.ts` | Image system docs | ✅ |

### Component Tests (`tests/component/`)

| File | Origin Doc | Status |
|------|------------|--------|
| `ItemRow.test.ts` | TEST_SPEC_ENTITY_COMPONENTS | ✅ 45 tests |
| `ItemTile.test.ts` | TEST_SPEC_ENTITY_COMPONENTS | ✅ 36 tests |
| `ItemCard.test.ts` | TEST_SPEC_ENTITY_COMPONENTS | ✅ 44 tests |
| `ItemList.test.ts` | TEST_SPEC_ENTITY_COLLECTIONS | ✅ 27 tests |
| `ItemGallery.test.ts` | TEST_SPEC_ENTITY_COLLECTIONS | ✅ 29 tests |
| `ItemRow-dateDisplay.test.ts` | 2025-11-26_DATETIME_PLUGIN_TESTING | ⚠️ |
| `ImgShape-CList-Integration.test.ts` | TEST_SPEC_IMGSHAPE | ✅ 28 tests |
| `Checkbox-Visibility.test.ts` | TEST_SPEC_ENTITY_COLLECTIONS (B1) | ✅ 28 tests |
| `Dropdown-Trigger-Display.test.ts` | TEST_SPEC_DROPDOWNS (B2) | ✅ 21 tests |
| `Wrapper-Control-Validation.test.ts` | CLIST_TESTING_ROADMAP | ✅ 20 tests |
| `Avatar-Option.test.ts` | TEST_SPEC_IMGSHAPE (A2) | ✅ |
| `TagFamilies.spec.ts` | TAG_FAMILY docs | ✅ |
| `TagFamilies.test.ts` | TAG_FAMILY docs | ✅ |
| `TagFamilyEditor.spec.ts` | TAG_FAMILY docs | ✅ |
| `TagFamilyEditor.test.ts` | TAG_FAMILY docs | ✅ |
| `TagFamilyTile.spec.ts` | TAG_FAMILY docs | ✅ |
| `TagFamilyTile.test.ts` | TAG_FAMILY docs | ✅ |
| `TagGroupEditor.spec.ts` | TAG_FAMILY docs | ✅ |
| `TagGroupEditor.test.ts` | TAG_FAMILY docs | ✅ |

#### Archived/Skipped Component Tests
| File | Reason |
|------|--------|
| `DropdownList-ItemList-Integration-BEFORE-OPTION-A.test.ts.skip` | Pre-Option-A architecture |
| `pList-pGallery-Integration-BEFORE-OPTION-A.test.ts.skip` | Pre-Option-A architecture |
| `_archived_Width-Architecture-Diagnosis.test.ts.skip` | Diagnostic only |

### Integration Tests (`tests/integration/`)

| File | Origin Doc | Status |
|------|------------|--------|
| `database-adapter.test.ts` | TEST_INFRASTRUCTURE | ✅ DB-skip |
| `i18n-api.test.ts` | TEST_INFRASTRUCTURE | ✅ DB-skip |
| `posts-visibility.test.ts` | POSTS-WORKFLOW-SPEC | ✅ Server-skip |
| `stage-d-compatibility.test.ts` | _archived (Stage D) | ✅ DB-skip |
| `images-import-api.test.ts` | LOCAL_ADAPTER_TESTING_GUIDE | ⚠️ Review |
| `imageadmin-shapeeditor.test.ts` | _archived/PLAN_G | ✅ |
| `v2-imagesCore-shapeEditor.test.ts` | _archived/PHASE_8 | ✅ |

### Database Tests (`tests/database/`)

| File | Origin Doc | Status |
|------|------------|--------|
| `image-shape-reducer.test.ts` | _archived/TEST_FILES_SUPERVISION | ✅ 22 tests |

### Root-Level Tests (`tests/`)

| File | Origin Doc | Status |
|------|------------|--------|
| `config.capabilities.spec.ts` | Auth system docs | ✅ |
| `config.roles.spec.ts` | Auth system docs | ✅ |

---

## Review Notes (For Future Sessions)

### 📋 Documents Worth Deeper Review

1. **`chat/FPOSTIT_TESTING_CHECKLIST.md`** (336 lines)
   - Manual QA checklist pattern
   - Could become template for feature checklists
   - Covers: DemoFloatHard, DemoFloatDyn, DemoFloatMarkdown

2. **`chat/LOCAL_ADAPTER_TESTING_GUIDE.md`** (675 lines)
   - Shell test scripts (`test-local-adapter-complete.sh`)
   - Manual testing for image import stepper
   - 15 automated tests, 50+ manual test cases

3. **`chat/tasks/2025-11-26_DATETIME_PLUGIN_TESTING.md`**
   - DateTime formatting plugin tests
   - Known issue: Date/day calculation misalignment
   - 12/47 tests failing (needs date fixes)

### 🗄️ Archived Test Documentation

Location: `chat/_archived/tests/`

| File | Reason Archived |
|------|-----------------|
| `TEST_INFRASTRUCTURE_ANALYSIS.md` | Superseded by devdocs/TEST_INFRASTRUCTURE.md |
| `TEST_PLAN_Z_VALUE_AND_BUG_FIXES.md` | Nov 12 - Bug fixes completed |
| `TEST_IMPLEMENTATION_SUMMARY.md` | Nov 12 - Historical record |
| `2025-11-07_TEST_FILES_SUPERVISION_image_shape_changes.md` | Migration 019 completed |
| `2025-11-08_PLAN_G_INTEGRATION_TESTS.md` | Plan G completed |
| `2025-11-08_TESTING_ROUND_2_PLAN_E_F.md` | Plans E/F completed |
| `2025-11-10_MRT_TESTING.md` | Deferred import system |
| `2025-11-12_PHASE_8_TESTING_COMPLETE.md` | Phase 8 completed |
| `2025-11-13_MISSING_TEST_HELPERS.md` | Helpers implemented |
| `2025-11-13_TDD_SETUP_COMPLETE.md` | Setup completed |
| `2025-11-14_ITEMCARD_TESTS.md` | Tests implemented |
| `2025-11-14_ITEMROW_HEADING_PREFIX_TESTS.md` | Tests implemented |

### 🗑️ Deleted (Empty/Redundant)

| File | Reason |
|------|--------|
| `chat/tasks/2025-11-29-test-fix-actions.md` | Empty |
| `chat/tasks/2025-11-29-vitest-analysis.md` | Empty |
| `chat/mcp/testing.md` | Superseded by devdocs/TEST_INFRASTRUCTURE.md |

---

## Maintenance

When adding new test files:
1. Add entry to appropriate section above
2. Link to origin documentation
3. Note any special requirements (DB, server, etc.)

When archiving documentation:
1. Move to `chat/_archived/tests/`
2. Add entry to "Archived" section with reason
