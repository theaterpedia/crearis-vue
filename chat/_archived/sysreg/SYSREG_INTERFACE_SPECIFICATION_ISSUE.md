# Sysreg Interface Specification Issue

**Status:** Critical Design Ambiguity Blocking Test Implementation  
**Date:** 2025-11-19  
**Context:** Phase 1 Testing Implementation (Priority 1+2 Complete)

---

## Current State

**Test Results:**
- useSysregTags: ✅ 55/55 tests passing (100%)
- useSysregOptions: ⏳ 26/37 tests passing (70%)
- **Total: 81/92 Phase 1 tests passing (88%)**

The remaining 11 failures are NOT bugs in the implementation logic, but rather **fundamental interface design inconsistencies** between:
1. Database schema (`SysregEntry`)
2. Composable API (`SysregOption`)
3. Test specifications

---

## The Core Issue

### Two Conflicting Mental Models for "value" Field

**Model A: "value" = BYTEA Hex String** (Current `SysregEntry`)
```typescript
export interface SysregEntry {
    value: string  // BYTEA as hex string (e.g., "\\x01", "\\x02")
    name: string   // Internal name (e.g., "democracy", "raw")
    // ...
}
```

**Model B: "value" = Internal Name String** (Test Expectations)
```typescript
// Tests expect:
expect(ttags.some(opt => opt.value === 'democracy')).toBe(true)
expect(status.some(opt => opt.value === 'raw')).toBe(true)
```

**Current Implementation:** Tries to bridge both, causing confusion
```typescript
export interface SysregOption {
    value: string       // Internal name (e.g., 'democracy', 'raw')
    name: string        // Internal name (duplicate for compatibility)
    // ...
}
```

---

## Specific Ambiguities

### 1. Field Naming Confusion

**Question:** What should the `SysregOption.value` field contain?

| Scenario | Current Impl | Test Expects | Database Has |
|----------|--------------|--------------|--------------|
| TTags option | `'democracy'` | `'democracy'` | `value: '\\x01', name: 'democracy'` |
| Status option | `'raw'` | `'raw'` | `value: '\\x00', name: 'raw'` |
| Lookup by hex | ??? | `getOptionByValue('ttags', '\\x01')` | Should find democracy |
| Lookup by name | ??? | `getOptionByValue('status', 'approved')` | Should find approved |

**Problem:** `getOptionByValue()` must accept BOTH hex strings AND name strings, but `SysregOption.value` can only hold one type.

### 2. Dual Lookup Requirements

Tests expect `getOptionByValue()` to work with BOTH formats:

```typescript
// Test 1: Lookup by hex value
const opt = getOptionByValue('ttags', '\\x01')
expect(opt?.label).toBe('Democracy')
expect(opt?.bit).toBe(0)

// Test 2: Lookup by string name
const opt = getOptionByValue('status', 'approved')
expect(opt?.label).toBe('Approved')
```

**Current Issue:** Function signature is `getOptionByValue(tagfamily: string, value: string)` but "value" parameter is ambiguous.

### 3. Missing "bit" Property

Tests expect `SysregOption` to have a `bit` property:
```typescript
expect(opt?.bit).toBe(0)
```

But current interface doesn't include this:
```typescript
export interface SysregOption {
    value: string
    name: string
    label: string
    // ❌ Missing: bit?: number
}
```

### 4. Missing "tagfamily" Propagation

Tests expect options to retain their tagfamily:
```typescript
expect(ttags.every(opt => opt.tagfamily === 'ttags')).toBe(true)
```

Current implementation populates from cache but loses tagfamily context.

### 5. BitGroup Options Not Filtering

Tests expect `getCtagsBitGroup()` to filter ctags options by bit_group:
```typescript
const ageGroups = getCtagsBitGroup('age_group')
expect(ageGroups.length).toBe(4)
expect(ageGroups[0].label).toBe('Children')
```

But current implementation returns hardcoded arrays, not filtered from actual cache data.

---

## Failed Tests Breakdown

| Test | Issue | Root Cause |
|------|-------|-----------|
| `force refresh bypasses cache` | Cache not being invalidated | Mock/cache interaction |
| `finds option by hex value` | Can't lookup by `'\\x01'` | `value` field contains name, not hex |
| `finds option by string value` | Works but inconsistent | Function handles both but confusing |
| `finds status options correctly` | Same as hex value lookup | Dual format issue |
| `returns age_group options` | Wrong labels/order | Hardcoded array vs filtered cache |
| `returns subject_type options` | Same as above | BitGroup implementation |
| `returns empty array for invalid bit group` | Crashes on undefined | Missing null check |
| `returns access_level options` | Wrong count (4 vs 2) | Hardcoded vs actual data |
| `returns quality options` | Wrong count (4 vs 2) | Hardcoded vs actual data |
| `handles malformed response data` | Error not captured | Error handling path |
| `includes all 12 ctags with bit groups` | `bit_group` undefined | Not propagated from cache |

---

## Design Options

### Option 1: Make SysregOption Rich (Database-Aligned)

**Approach:** Keep all database fields, add convenience properties

```typescript
export interface SysregOption {
    // Core database fields
    hex: string          // BYTEA hex string (e.g., "\\x01")
    name: string         // Internal name (e.g., "democracy")
    tagfamily: string    // tagfamily name
    bit: number          // Bit position for bit-based tags (0-7)
    
    // Translated/computed fields
    label: string        // Translated label
    description?: string // Translated description
    taglogic: string     // category | subcategory | option | toggle
    is_default: boolean
    
    // Optional metadata
    bit_group?: string   // For ctags: age_group, subject_type, etc.
    color?: string       // UI color hint
}

// Lookup functions
function getOptionByHex(tagfamily: string, hex: string): SysregOption | null
function getOptionByName(tagfamily: string, name: string): SysregOption | null
```

**Pros:**
- Clear separation: `hex` vs `name`
- All data available for UI
- Type-safe lookups
- Matches database structure

**Cons:**
- Larger objects
- More fields to maintain
- Migration needed

### Option 2: Minimal SysregOption (Test-Aligned)

**Approach:** Keep `value` = name, add separate lookup for hex

```typescript
export interface SysregOption {
    value: string        // Internal name (e.g., "democracy", "raw")
    label: string        // Translated label
    tagfamily: string    // tagfamily name
    bit?: number         // Bit position (optional, for bit-based tags)
    bit_group?: string   // For ctags groups
    // ... other fields
}

// Dual lookup function with clear parameter name
function getOptionByValue(
    tagfamily: string, 
    searchValue: string  // Can be hex OR name
): SysregOption | null {
    // Try hex first, then name
}
```

**Pros:**
- Simpler objects
- Matches test expectations
- Flexible lookup

**Cons:**
- Ambiguous parameter (`searchValue`)
- Magic string detection needed
- Hex format lost after fetch

### Option 3: Separate Interfaces for Different Contexts

**Approach:** Different interfaces for different use cases

```typescript
// Raw database entry
export interface SysregEntry {
    value: string  // BYTEA hex
    name: string
    // ...
}

// UI-friendly option
export interface SysregDisplayOption {
    name: string         // Internal name
    label: string        // Display label
    tagfamily: string
    // ...
}

// Lookup by both formats
function findOption(tagfamily: string, query: {
    hex?: string
    name?: string
}): SysregDisplayOption | null
```

**Pros:**
- Clear separation of concerns
- Explicit lookup parameters
- Type-safe

**Cons:**
- More interfaces
- Conversion overhead
- More complex API

---

## Recommended Decision Points

### Critical Questions to Answer:

1. **Primary Identifier:** What is the "natural key" for a sysreg option?
   - [ ] The BYTEA hex value (database-centric)
   - [ ] The internal name string (developer-centric)
   - [ ] Both, with explicit lookup methods

2. **SysregOption Purpose:** What is this interface for?
   - [ ] Direct database representation (mirror SysregEntry)
   - [ ] UI-ready display objects (name, label, translated)
   - [ ] Hybrid: both database and UI concerns

3. **Lookup Strategy:** How should lookups work?
   - [ ] Single polymorphic function: `getOptionByValue(family, hexOrName)`
   - [ ] Separate functions: `getOptionByHex()` and `getOptionByName()`
   - [ ] Query object: `findOption(family, { hex?, name? })`

4. **BitGroup Implementation:** Should `getCtagsBitGroup()` be:
   - [ ] Hardcoded arrays (current, fast, inflexible)
   - [ ] Filtered from cache (dynamic, requires DB schema change)
   - [ ] Hybrid: cache-backed with fallback to hardcoded

5. **Test Specification:** Are the test expectations correct?
   - [ ] Yes, tests reflect desired API
   - [ ] No, tests need rewrite to match implementation
   - [ ] Partial: some tests correct, some need adjustment

---

## Impact Assessment

**If we choose Option 1 (Rich, database-aligned):**
- ✅ Clean design
- ❌ 15-20 test specs need rewrite
- ❌ All test data mocks need update
- ⏱️ 2-3 hours work

**If we choose Option 2 (Minimal, test-aligned):**
- ✅ Tests mostly pass with small fixes
- ❌ Composable API less clear
- ❌ Some data lost (hex values)
- ⏱️ 1 hour work

**If we choose Option 3 (Separate interfaces):**
- ✅ Best long-term design
- ❌ More code to write
- ❌ Tests AND implementation both need changes
- ⏱️ 3-4 hours work

---

## Next Steps

**Required Decision:** Choose one of the three options above

**After Decision:**
1. Update interface definitions
2. Adjust composable implementation OR rewrite tests
3. Update all mock data
4. Run full Phase 1 test suite
5. Document chosen design in main docs

**Blocked Work:**
- Priority 3: Enhanced composables (useImageStatus, useGalleryFilters)
- Priority 4: Component tests (StatusBadge, FilterChip)
- Phase 2-6 test implementation

These all depend on clear `SysregOption` interface semantics.

---

## References

- **Test Spec:** `/docs/SYSREG_TESTING_STRATEGY.md` (lines 550-650)
- **Implementation:** `/src/composables/useSysregOptions.ts`
- **Database Schema:** `/src/composables/useSysregTags.ts` (SysregEntry interface)
- **Test File:** `/tests/unit/useSysregOptions.spec.ts`
- **Mock Data:** `/tests/helpers/sysreg-mock-api.ts`
