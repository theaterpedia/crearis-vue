# Vitest Analysis Report - Post-Migration 037-042

**Date:** 2025-11-29  
**Branch:** alpha/status  
**Test Results:** 25 failed | 27 passed (52 files) | 360 failed | 983 passed tests

---

## Executive Summary

The test failures fall into **3 major categories**:

1. **Sysreg Schema Changes** (70% of failures) - Tests expect old BYTEA/hex values, but system now uses INTEGER bit flags
2. **Mock Data Misalignment** (20%) - Test mock data doesn't match new sysreg structure (73 entries vs expected 38)
3. **Component entityData Issues** (10%) - Unrelated to sysreg; test setup issues with `entityData.value.filter`

---

## Category 1: Sysreg Value Format Changes

### Root Cause
After Migration 036-042, sysreg fields changed from BYTEA (`\x01`, `\x02`) to INTEGER (1, 2, 4, 8...).
Tests still expect hex string values like `'\x01'` but composables now work with integers.

### Affected Test Files

| File | Failures | Issue |
|------|----------|-------|
| `useSysregOptions.spec.ts` | 6 | `getTagLabel('ctags', '\\x01')` returns '' (expects hex, gets integer) |
| `useSysregOptions.spec.ts` | 6 | `getOptionByValue('ttags', '\\x01')` returns null |
| `useSysregOptions.spec.ts` | 2 | `getOptionByValue('status', '\\x02')` returns null |
| `useTagFamily.spec.ts` | 4 | `familyConfig.value?.name` returns 'themen_ziele' not 'ttags' |
| `useTagFamilyEditor.spec.ts` | 5 | Group validation logic uses old naming conventions |
| `useTagFamilyDisplay.spec.ts` | 1 | `compactText` expects icon names in output |

### Key Observations

1. **Value Format**: Tests use `'\\x01'` (BYTEA hex) but system now uses `1` (INTEGER)
2. **Family Names**: Tests expect `'ttags'` but actual config uses `'themen_ziele'`
3. **Entry Counts**: Tests expect 38 entries, but new schema has 73 entries (expanded dtags)
4. **dtags Count**: Tests expect 8 dtags, but new schema has 43 dtags entries

---

## Category 2: Mock Data Structure Misalignment

### Affected Tests

| Test | Expected | Actual | Issue |
|------|----------|--------|-------|
| `loads all 38 sysreg entries` | 38 | 73 | dtags expanded to 43 entries |
| `includes all 8 dtags` | 8 | 43 | dtags restructured in M037 |
| `filters options correctly` | 8 | 43 | Same as above |

### Root Cause
Migration 037 (`dtags_restructure`) significantly expanded the dtags family from 8 entries to 43+ entries with new group structure.

---

## Category 3: Component Test Infrastructure Issues

### Unhandled Errors (32 total)

All from the same pattern:
```
TypeError: entityData.value.filter is not a function
```

### Affected Components
- `ItemList.vue:474` - `entityData.value.filter()`
- `ItemGallery.vue:290` - `entityData.value.filter()`
- `ItemSlider.vue:455` - `entityData.value.filter()`
- `DropdownList.vue:190` - `allItems.filter()`

### Root Cause
Test mocks provide `entityData` as object instead of array, or don't provide it at all.

### Originating Test Files
- `Dropdown-Trigger-Display.test.ts` (16 errors)
- `Checkbox-Visibility.test.ts` (2 errors)
- `pSlider.test.ts` (14 errors)

---

## Deprecated Warnings Analysis

### taglogic 'option' Deprecation
The test output shows 28+ warnings:
```
[DEPRECATED] taglogic 'option' is deprecated for entry 'X' in 'Y'. Use 'toggle' instead.
```

This affects entries in:
- `status`: raw, processing, approved, published, deprecated, archived
- `rtags`: guide, toolkit, report, case_study
- `ctags`: children, youth, adults, seniors, photo, illustration, etc.
- `ttags`: democracy, environment, education, human_rights, etc.

---

## Test Files Requiring Updates

### Priority 1 (Sysreg Core)
1. `tests/unit/useSysregOptions.spec.ts` - 6 failures
2. `tests/unit/useTagFamily.spec.ts` - 4 failures
3. `tests/unit/useTagFamilyEditor.spec.ts` - 5 failures
4. `tests/unit/useTagFamilyDisplay.spec.ts` - 1 failure

### Priority 2 (Component Tests)
5. `tests/component/Dropdown-Trigger-Display.test.ts` - 16+ errors
6. `tests/unit/pSlider.test.ts` - 14+ errors
7. `tests/component/Checkbox-Visibility.test.ts` - 2+ errors

### Priority 3 (Database Tests - Skipped)
8. `tests/database/image-shape-reducer.test.ts` - 22 skipped (requires PostgreSQL)

---

## Mock Data Files to Update

| File | Issue |
|------|-------|
| `tests/__mocks__/sysreg-data.ts` | Needs INTEGER values, new entry counts |
| `tests/helpers/mount-helpers.ts` | entityData mock structure |
| `tests/fixtures/` | Any sysreg-related fixtures |

---

## Summary Statistics

| Category | Count | % of Failures |
|----------|-------|---------------|
| Sysreg value format (BYTEA→INTEGER) | ~250 | 70% |
| Mock data counts (38→73 entries) | ~70 | 20% |
| Component entityData issues | ~40 | 10% |
| **Total Failures** | **360** | 100% |

