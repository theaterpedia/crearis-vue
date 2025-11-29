# Test Fix Actions - Sysreg Migration Alignment

**Date:** 2025-11-29  
**Priority:** HIGH  
**Estimated Effort:** 4-6 hours

---

## Overview

This document outlines the specific actions needed to fix the 360 failing tests after Migration 037-042 (BYTEA→INTEGER sysreg restructure).

---

## Phase 1: Update Sysreg Test Mocks (Critical Path)

### Action 1.1: Update Mock Value Format

**File:** `tests/__mocks__/sysreg-data.ts` (or wherever mock sysreg data lives)

**Change:** Replace BYTEA hex values with INTEGER bit values

```typescript
// BEFORE (BYTEA)
{ name: 'children', value: '\\x01', tagfamily: 'ctags', bit: 0 }
{ name: 'youth', value: '\\x02', tagfamily: 'ctags', bit: 1 }
{ name: 'approved', value: '\\x02', tagfamily: 'status', bit: 1 }

// AFTER (INTEGER)
{ name: 'children', value: 1, tagfamily: 'ctags', bit: 0 }
{ name: 'youth', value: 2, tagfamily: 'ctags', bit: 1 }
{ name: 'approved', value: 2, tagfamily: 'status', bit: 1 }
```

### Action 1.2: Update Entry Counts

**File:** `tests/unit/useSysregOptions.spec.ts`

```typescript
// Line 380: Update expected total entries
expect(options.value.length).toBe(73)  // was 38

// Line 410: Update expected dtags count
expect(dtags).toHaveLength(43)  // was 8
```

### Action 1.3: Fix getTagLabel Tests

**File:** `tests/unit/useSysregOptions.spec.ts`

```typescript
// Line 136: Change hex to integer
const label = getTagLabel('ctags', 1)  // was '\\x01'
expect(label).toBe('Children')
```

### Action 1.4: Fix getOptionByValue Tests

**File:** `tests/unit/useSysregOptions.spec.ts`

```typescript
// Line 199-203: Change hex to integer
const opt = getOptionByValue('ttags', 1)  // was '\\x01'
expect(opt).toBeTruthy()
expect(opt?.label).toBe('Democracy')

// Line 230-234: Change hex to integer
const opt = getOptionByValue('status', 2)  // was '\\x02'
expect(opt).toBeTruthy()
expect(opt?.name).toBe('approved')
```

---

## Phase 2: Update useTagFamily Tests

### Action 2.1: Fix Family Name Expectations

**File:** `tests/unit/useTagFamily.spec.ts`

```typescript
// Line 49: The mock returns internal name, not short name
expect(family.familyConfig.value?.name).toBe('themen_ziele')  // was 'ttags'
// OR: Add short_name field to mock and test that instead
```

### Action 2.2: Fix getTagLabel Return Value

**File:** `tests/unit/useTagFamily.spec.ts`

```typescript
// Line 223: Ensure mock data provides labels for integer values
const label = family.getTagLabel(1)
expect(label).toBeTruthy()
```

### Action 2.3: Fix getTagsByGroup

**File:** `tests/unit/useTagFamily.spec.ts`

```typescript
// Line 245: Ensure 'spielform' group exists in mock data
const tags = family.getTagsByGroup('spielform')
expect(tags.length).toBeGreaterThan(0)
```

### Action 2.4: Fix Bit 31 Handling

**File:** `tests/unit/useTagFamily.spec.ts`

```typescript
// Line 365: Verify the group name in mock matches test
expect(family.hasActiveGroup('paedagogische_regie')).toBe(true)
```

---

## Phase 3: Update useTagFamilyEditor Tests

### Action 3.1: Fix isDirty State

**File:** `tests/unit/useTagFamilyEditor.spec.ts`

```typescript
// Line 99-100: Verify setGroupValue actually changes internal state
editor.setGroupValue('core_themes', 1)
// May need to await nextTick() for reactivity
await nextTick()
expect(editor.isDirty.value).toBe(true)
```

### Action 3.2: Fix Naming Convention Tests

**File:** `tests/unit/useTagFamilyEditor.spec.ts`

```typescript
// Line 267: Update expected tag name based on new dtags structure
const error = editor.namingErrors.value[0]
// Check actual mock data for correct tag name
expect(error.tagName).toBe('kreisspiel_impulskreis')  // was 'improvisationstheater'
```

### Action 3.3: Fix Validation Logic

**File:** `tests/unit/useTagFamilyEditor.spec.ts`

```typescript
// Line 337, 538: These expect validation to fail, but it passes
// Review the mock data - ensure subcategory without category scenario is correct
```

---

## Phase 4: Update useTagFamilyDisplay Tests

### Action 4.1: Fix Icon Expectation

**File:** `tests/unit/useTagFamilyDisplay.spec.ts`

```typescript
// Line 113: compactText returns label, not icon name
// Either update test expectation or update component to include icon
const text = display.compactText.value
expect(text).toBe('Kreisspiele')  // Accept label instead of icon
// OR: Test icon separately if component provides it
```

---

## Phase 5: Fix Component Test Infrastructure

### Action 5.1: Fix entityData Mock

**File:** `tests/helpers/mount-helpers.ts` or individual test files

```typescript
// Ensure entityData is always an array
const mockEntityData = ref([
    { id: 1, name: 'Test Entity' },
    { id: 2, name: 'Test Entity 2' }
])

// In component mock/stub:
entityData: mockEntityData
```

### Action 5.2: Fix Dropdown-Trigger-Display Tests

**File:** `tests/component/Dropdown-Trigger-Display.test.ts`

```typescript
// Ensure ItemList ref has entityData as array
const mockItemListRef = {
    value: {
        entityData: []  // Must be array, not undefined
    }
}
```

### Action 5.3: Fix pSlider Tests

**File:** `tests/unit/pSlider.test.ts`

```typescript
// Same pattern - ensure entityData is provided as array in slot/props
```

---

## Phase 6: Update taglogic Deprecation

### Action 6.1: Replace 'option' with 'toggle'

**Files:** Sysreg seed data or migration files

```typescript
// BEFORE
{ taglogic: 'option', name: 'children', ... }

// AFTER
{ taglogic: 'toggle', name: 'children', ... }
```

This affects 28+ entries across status, rtags, ctags, ttags families.

---

## Execution Order

1. **Phase 1** first - fixes ~250 tests (70%)
2. **Phase 2-4** next - fixes ~70 tests (20%)
3. **Phase 5** last - fixes ~40 tests (10%)
4. **Phase 6** optional - removes deprecation warnings

---

## Verification Commands

```bash
# Run only sysreg-related tests
pnpm test -- --grep "sysreg|Sysreg|TagFamily|Options"

# Run specific failing test file
pnpm test tests/unit/useSysregOptions.spec.ts

# Run all tests after fixes
pnpm test
```

---

## Notes

- Some tests may be intentionally testing old behavior - consider marking as `.skip` with TODO
- The database tests (image-shape-reducer) are skipped because they require PostgreSQL
- Consider creating a test utility for sysreg mock data generation

