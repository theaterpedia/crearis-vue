# Sysreg System - Comprehensive Testing Strategy

**Date:** November 19, 2025  
**Status:** Complete Test Specification  
**Coverage:** Phases 1-6 (All composables, components, and advanced features)

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Unit Tests: Core Composables](#unit-tests-core-composables)
4. [Unit Tests: Enhanced Composables](#unit-tests-enhanced-composables)
5. [Unit Tests: Advanced Composables](#unit-tests-advanced-composables)
6. [Component Tests: Base Components](#component-tests-base-components)
7. [Component Tests: Filter Components](#component-tests-filter-components)
8. [Integration Tests](#integration-tests)
9. [BYTEA Testing Utilities](#bytea-testing-utilities)
10. [Test Data Factories](#test-data-factories)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Testing Overview

### Scope

The sysreg system consists of:
- **38 sysreg entries** across 6 tag families (status, ttags, dtags, rtags, ctags, itags)
- **11 composables** (Phases 1, 3, 5, 6)
- **7 components** (Phases 2, 4)
- **BYTEA operations** (bit manipulation, hex encoding/decoding)

### Testing Approach

Following the established testing patterns in `TEST_IMPLEMENTATION_SUMMARY.md`:

1. **Unit Tests** - Pure functions and composables (fast, isolated)
2. **Component Tests** - Vue component mounting with Vue Test Utils
3. **Integration Tests** - End-to-end workflows with database operations
4. **BYTEA Utilities** - Specialized helpers for bit manipulation testing

### Test Framework

```typescript
// vitest.config.ts configuration
{
  environment: 'happy-dom',
  coverage: {
    provider: 'v8',
    thresholds: { lines: 70, functions: 70, branches: 70 }
  }
}
```

---

## Test Infrastructure

### Test Helper Files

#### 1. `tests/helpers/sysreg-test-data.ts`

Factory functions for generating test data with sysreg fields:

```typescript
import { parseByteaHex, setBit, clearBit } from '@/composables/useSysregTags'

export interface TestEntity {
  id: number
  name: string
  status_val?: string
  ttags_val?: string
  dtags_val?: string
  rtags_val?: string
  ctags_val?: string
  itags_val?: string
}

export function createTestImage(overrides?: Partial<TestEntity>): TestEntity {
  return {
    id: 1,
    name: 'Test Image',
    status_val: '\\x02', // approved
    ttags_val: '\\x05', // bits 0,2: democracy, environment
    dtags_val: '\\x03', // bits 0,1: education, media
    rtags_val: '\\x00',
    ctags_val: '\\x06', // age_group=youth, subject_type=photo
    itags_val: '\\x00',
    ...overrides
  }
}

export function createTestProject(overrides?: Partial<TestEntity>): TestEntity {
  return {
    id: 1,
    name: 'Test Project',
    status_val: '\\x04', // active
    ttags_val: '\\x11', // bits 0,4
    dtags_val: '\\x05', // bits 0,2
    rtags_val: '\\x00',
    ctags_val: '\\x08', // has_funding=true
    itags_val: '\\x00',
    ...overrides
  }
}

export function createTestEvent(overrides?: Partial<TestEntity>): TestEntity {
  return {
    id: 1,
    name: 'Test Event',
    status_val: '\\x02', // planned
    ttags_val: '\\x09', // bits 0,3
    dtags_val: '\\x06', // bits 1,2
    rtags_val: '\\x00',
    ctags_val: '\\x01', // registration_open=true
    itags_val: '\\x00',
    ...overrides
  }
}

// Batch creation
export function createTestImages(count: number): TestEntity[] {
  return Array.from({ length: count }, (_, i) => 
    createTestImage({ id: i + 1, name: `Test Image ${i + 1}` })
  )
}
```

#### 2. `tests/helpers/sysreg-bytea-helpers.ts`

BYTEA-specific test utilities:

```typescript
/**
 * Compare two BYTEA hex strings for equality
 */
export function byteaEqual(a: string, b: string): boolean {
  const normalizeHex = (hex: string) => {
    return hex.replace('\\x', '').toLowerCase().padStart(2, '0')
  }
  return normalizeHex(a) === normalizeHex(b)
}

/**
 * Assert BYTEA value has specific bit set
 */
export function expectBitSet(bytea: string, bit: number): void {
  const bits = byteArrayToBits(parseByteaHex(bytea))
  expect(bits).toContain(bit)
}

/**
 * Assert BYTEA value does NOT have specific bit set
 */
export function expectBitClear(bytea: string, bit: number): void {
  const bits = byteArrayToBits(parseByteaHex(bytea))
  expect(bits).not.toContain(bit)
}

/**
 * Create BYTEA value from bit array
 */
export function bitsToHex(bits: number[]): string {
  let value = 0
  bits.forEach(bit => {
    value |= (1 << bit)
  })
  return `\\x${value.toString(16).padStart(2, '0')}`
}

/**
 * Get all bits from BYTEA hex string
 */
export function hexToBits(hex: string): number[] {
  return byteArrayToBits(parseByteaHex(hex))
}
```

#### 3. `tests/helpers/sysreg-mock-api.ts`

Mock API responses for testing:

```typescript
export function mockFetchSysregOptions() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      sysreg: [
        { bit: 0, tagfamily: 'ttags', value: 'democracy', label: 'Democracy' },
        { bit: 1, tagfamily: 'ttags', value: 'environment', label: 'Environment' },
        { bit: 2, tagfamily: 'ttags', value: 'education', label: 'Education' },
        // ... rest of 38 entries
      ]
    })
  })
}

export function mockFetchEntity(entity: TestEntity) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => entity
  })
}

export function mockFetchEntities(entities: TestEntity[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => entities
  })
}
```

---

## Unit Tests: Core Composables

### Test File: `tests/unit/useSysregTags.spec.ts`

**Purpose:** Test BYTEA manipulation and tag value utilities

**Test Count:** ~45 tests

#### Test Suite Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { 
  parseByteaHex, 
  byteArrayToBits, 
  setBit, 
  clearBit, 
  toggleBit,
  hasBit,
  bitsToByteArray
} from '@/composables/useSysregTags'
```

#### Test Groups

**1. parseByteaHex() - 8 tests**
```typescript
describe('parseByteaHex', () => {
  it('parses \\x00 to [0]', () => {
    expect(parseByteaHex('\\x00')).toEqual([0])
  })

  it('parses \\x01 to [1]', () => {
    expect(parseByteaHex('\\x01')).toEqual([1])
  })

  it('parses \\x05 to [5]', () => {
    expect(parseByteaHex('\\x05')).toEqual([5])
  })

  it('parses \\xff to [255]', () => {
    expect(parseByteaHex('\\xff')).toEqual([255])
  })

  it('handles lowercase hex', () => {
    expect(parseByteaHex('\\x0a')).toEqual([10])
  })

  it('handles uppercase hex', () => {
    expect(parseByteaHex('\\x0A')).toEqual([10])
  })

  it('handles multi-byte hex (2 bytes)', () => {
    expect(parseByteaHex('\\x0102')).toEqual([1, 2])
  })

  it('returns [0] for invalid input', () => {
    expect(parseByteaHex('invalid')).toEqual([0])
  })
})
```

**2. byteArrayToBits() - 7 tests**
```typescript
describe('byteArrayToBits', () => {
  it('converts [0] to []', () => {
    expect(byteArrayToBits([0])).toEqual([])
  })

  it('converts [1] to [0]', () => {
    expect(byteArrayToBits([1])).toEqual([0])
  })

  it('converts [2] to [1]', () => {
    expect(byteArrayToBits([2])).toEqual([1])
  })

  it('converts [5] to [0, 2]', () => {
    expect(byteArrayToBits([5])).toEqual([0, 2])
  })

  it('converts [7] to [0, 1, 2]', () => {
    expect(byteArrayToBits([7])).toEqual([0, 1, 2])
  })

  it('converts [255] to [0,1,2,3,4,5,6,7]', () => {
    expect(byteArrayToBits([255])).toEqual([0,1,2,3,4,5,6,7])
  })

  it('handles multi-byte arrays', () => {
    expect(byteArrayToBits([3, 5])).toEqual([0, 1, 8, 10])
  })
})
```

**3. setBit() - 6 tests**
```typescript
describe('setBit', () => {
  it('sets bit 0 in \\x00 → \\x01', () => {
    expect(setBit('\\x00', 0)).toBe('\\x01')
  })

  it('sets bit 1 in \\x00 → \\x02', () => {
    expect(setBit('\\x00', 1)).toBe('\\x02')
  })

  it('sets bit 2 in \\x01 → \\x05', () => {
    expect(setBit('\\x01', 2)).toBe('\\x05')
  })

  it('setting already-set bit is idempotent', () => {
    expect(setBit('\\x01', 0)).toBe('\\x01')
  })

  it('sets multiple bits sequentially', () => {
    let val = '\\x00'
    val = setBit(val, 0)
    val = setBit(val, 2)
    expect(val).toBe('\\x05')
  })

  it('handles high bit numbers (bit 7)', () => {
    expect(setBit('\\x00', 7)).toBe('\\x80')
  })
})
```

**4. clearBit() - 6 tests**
```typescript
describe('clearBit', () => {
  it('clears bit 0 in \\x01 → \\x00', () => {
    expect(clearBit('\\x01', 0)).toBe('\\x00')
  })

  it('clears bit 1 in \\x02 → \\x00', () => {
    expect(clearBit('\\x02', 1)).toBe('\\x00')
  })

  it('clears bit 2 in \\x05 → \\x01', () => {
    expect(clearBit('\\x05', 2)).toBe('\\x01')
  })

  it('clearing already-clear bit is idempotent', () => {
    expect(clearBit('\\x00', 0)).toBe('\\x00')
  })

  it('clears multiple bits sequentially', () => {
    let val = '\\x07' // bits 0,1,2
    val = clearBit(val, 1)
    expect(val).toBe('\\x05') // bits 0,2
  })

  it('handles high bit numbers (bit 7)', () => {
    expect(clearBit('\\x80', 7)).toBe('\\x00')
  })
})
```

**5. toggleBit() - 6 tests**
```typescript
describe('toggleBit', () => {
  it('toggles bit 0: off → on', () => {
    expect(toggleBit('\\x00', 0)).toBe('\\x01')
  })

  it('toggles bit 0: on → off', () => {
    expect(toggleBit('\\x01', 0)).toBe('\\x00')
  })

  it('toggles bit 2 in \\x01 → \\x05', () => {
    expect(toggleBit('\\x01', 2)).toBe('\\x05')
  })

  it('toggles bit 2 in \\x05 → \\x01', () => {
    expect(toggleBit('\\x05', 2)).toBe('\\x01')
  })

  it('multiple toggles return to original', () => {
    let val = '\\x03'
    val = toggleBit(val, 1)
    val = toggleBit(val, 1)
    expect(val).toBe('\\x03')
  })

  it('handles high bit numbers', () => {
    expect(toggleBit('\\x00', 7)).toBe('\\x80')
  })
})
```

**6. hasBit() - 6 tests**
```typescript
describe('hasBit', () => {
  it('detects bit 0 in \\x01', () => {
    expect(hasBit('\\x01', 0)).toBe(true)
  })

  it('detects bit 0 NOT in \\x00', () => {
    expect(hasBit('\\x00', 0)).toBe(false)
  })

  it('detects bit 2 in \\x05', () => {
    expect(hasBit('\\x05', 2)).toBe(true)
  })

  it('detects bit 1 NOT in \\x05', () => {
    expect(hasBit('\\x05', 1)).toBe(false)
  })

  it('detects multiple bits correctly', () => {
    const val = '\\x07' // bits 0,1,2
    expect(hasBit(val, 0)).toBe(true)
    expect(hasBit(val, 1)).toBe(true)
    expect(hasBit(val, 2)).toBe(true)
    expect(hasBit(val, 3)).toBe(false)
  })

  it('handles high bit numbers', () => {
    expect(hasBit('\\x80', 7)).toBe(true)
  })
})
```

**7. bitsToByteArray() - 6 tests**
```typescript
describe('bitsToByteArray', () => {
  it('converts [] to [0]', () => {
    expect(bitsToByteArray([])).toEqual([0])
  })

  it('converts [0] to [1]', () => {
    expect(bitsToByteArray([0])).toEqual([1])
  })

  it('converts [1] to [2]', () => {
    expect(bitsToByteArray([1])).toEqual([2])
  })

  it('converts [0, 2] to [5]', () => {
    expect(bitsToByteArray([0, 2])).toEqual([5])
  })

  it('converts [0, 1, 2] to [7]', () => {
    expect(bitsToByteArray([0, 1, 2])).toEqual([7])
  })

  it('handles high bit numbers', () => {
    expect(bitsToByteArray([7])).toEqual([128])
  })
})
```

---

### Test File: `tests/unit/useSysregOptions.spec.ts`

**Purpose:** Test sysreg option fetching and lookup utilities

**Test Count:** ~25 tests

#### Test Suite Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSysregOptions } from '@/composables/useSysregOptions'
import { mockFetchSysregOptions } from '../helpers/sysreg-mock-api'
```

#### Test Groups

**1. fetchOptions() - 5 tests**
```typescript
describe('fetchOptions', () => {
  beforeEach(() => {
    global.fetch = mockFetchSysregOptions()
  })

  it('fetches sysreg options on first call', async () => {
    const { fetchOptions, options } = useSysregOptions()
    await fetchOptions()
    expect(options.value.length).toBeGreaterThan(0)
  })

  it('caches options after first fetch', async () => {
    const { fetchOptions } = useSysregOptions()
    await fetchOptions()
    await fetchOptions()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('force refresh bypasses cache', async () => {
    const { fetchOptions } = useSysregOptions()
    await fetchOptions()
    await fetchOptions(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const { fetchOptions, error } = useSysregOptions()
    await fetchOptions()
    expect(error.value).toBeTruthy()
  })

  it('sets loading state correctly', async () => {
    const { fetchOptions, loading } = useSysregOptions()
    const promise = fetchOptions()
    expect(loading.value).toBe(true)
    await promise
    expect(loading.value).toBe(false)
  })
})
```

**2. getTagLabel() - 6 tests**
```typescript
describe('getTagLabel', () => {
  it('returns label for valid ttags value', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('ttags', '\\x01')).toBe('Democracy')
  })

  it('returns label for valid dtags value', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('dtags', '\\x01')).toBe('Education')
  })

  it('returns empty string for invalid value', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('ttags', '\\x99')).toBe('')
  })

  it('returns empty string for invalid tagfamily', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('invalid', '\\x01')).toBe('')
  })

  it('handles status values', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('status', '\\x02')).toBe('Approved')
  })

  it('handles ctags bit group values', () => {
    const { getTagLabel } = useSysregOptions()
    expect(getTagLabel('ctags', '\\x01')).toBe('Children')
  })
})
```

**3. getOptionsByFamily() - 4 tests**
```typescript
describe('getOptionsByFamily', () => {
  it('returns all ttags options', () => {
    const { getOptionsByFamily } = useSysregOptions()
    const ttags = getOptionsByFamily('ttags')
    expect(ttags.length).toBeGreaterThan(0)
    expect(ttags.every(opt => opt.tagfamily === 'ttags')).toBe(true)
  })

  it('returns all status options', () => {
    const { getOptionsByFamily } = useSysregOptions()
    const status = getOptionsByFamily('status')
    expect(status.some(opt => opt.value === 'raw')).toBe(true)
  })

  it('returns empty array for invalid family', () => {
    const { getOptionsByFamily } = useSysregOptions()
    expect(getOptionsByFamily('invalid')).toEqual([])
  })

  it('filters options correctly', () => {
    const { getOptionsByFamily } = useSysregOptions()
    const dtags = getOptionsByFamily('dtags')
    expect(dtags.every(opt => opt.tagfamily === 'dtags')).toBe(true)
  })
})
```

**4. getOptionByValue() - 5 tests**
```typescript
describe('getOptionByValue', () => {
  it('finds option by hex value', () => {
    const { getOptionByValue } = useSysregOptions()
    const opt = getOptionByValue('ttags', '\\x01')
    expect(opt?.label).toBe('Democracy')
  })

  it('finds option by string value', () => {
    const { getOptionByValue } = useSysregOptions()
    const opt = getOptionByValue('status', 'approved')
    expect(opt?.value).toBe('\\x02')
  })

  it('returns null for invalid value', () => {
    const { getOptionByValue } = useSysregOptions()
    expect(getOptionByValue('ttags', '\\x99')).toBeNull()
  })

  it('returns null for invalid tagfamily', () => {
    const { getOptionByValue } = useSysregOptions()
    expect(getOptionByValue('invalid', '\\x01')).toBeNull()
  })

  it('finds status options correctly', () => {
    const { getOptionByValue } = useSysregOptions()
    const opt = getOptionByValue('status', '\\x02')
    expect(opt?.value).toBe('approved')
  })
})
```

**5. getCtagsBitGroup() - 5 tests**
```typescript
describe('getCtagsBitGroup', () => {
  it('returns age_group options', () => {
    const { getCtagsBitGroup } = useSysregOptions()
    const ageGroups = getCtagsBitGroup('age_group')
    expect(ageGroups.length).toBe(4)
    expect(ageGroups[0].label).toBe('Children')
  })

  it('returns subject_type options', () => {
    const { getCtagsBitGroup } = useSysregOptions()
    const types = getCtagsBitGroup('subject_type')
    expect(types.some(t => t.label === 'Photo')).toBe(true)
  })

  it('returns empty array for invalid bit group', () => {
    const { getCtagsBitGroup } = useSysregOptions()
    expect(getCtagsBitGroup('invalid')).toEqual([])
  })

  it('returns access_level options', () => {
    const { getCtagsBitGroup } = useSysregOptions()
    const access = getCtagsBitGroup('access_level')
    expect(access.length).toBeGreaterThan(0)
  })

  it('returns quality options', () => {
    const { getCtagsBitGroup } = useSysregOptions()
    const quality = getCtagsBitGroup('quality')
    expect(quality.length).toBeGreaterThan(0)
  })
})
```

---

## Unit Tests: Enhanced Composables

### Test File: `tests/unit/useImageStatus.spec.ts`

**Purpose:** Test image lifecycle management composable

**Test Count:** ~35 tests

#### Test Groups

**1. Status initialization - 4 tests**
**2. Status transitions - 12 tests**
**3. Config bit management - 10 tests**
**4. Validation rules - 6 tests**
**5. API integration - 3 tests**

```typescript
describe('useImageStatus', () => {
  describe('Status initialization', () => {
    it('loads current status from image data', () => {
      const image = createTestImage({ status_val: '\\x02' })
      const { currentStatus } = useImageStatus(ref(image))
      expect(currentStatus.value).toBe('\\x02')
    })

    it('defaults to raw (\\x00) for new images', () => {
      const { currentStatus } = useImageStatus(ref(null))
      expect(currentStatus.value).toBe('\\x00')
    })
  })

  describe('Status transitions', () => {
    it('transitions raw → processing', async () => {
      const image = createTestImage({ status_val: '\\x00' })
      const { startProcessing, currentStatus } = useImageStatus(ref(image))
      await startProcessing()
      expect(currentStatus.value).toBe('\\x01')
    })

    it('prevents invalid transition: raw → published', async () => {
      const image = createTestImage({ status_val: '\\x00' })
      const { publishImage, error } = useImageStatus(ref(image))
      await publishImage()
      expect(error.value).toBeTruthy()
    })

    it('allows approved → published', async () => {
      const image = createTestImage({ status_val: '\\x02' })
      const { publishImage, currentStatus } = useImageStatus(ref(image))
      await publishImage()
      expect(currentStatus.value).toBe('\\x04')
    })
  })

  describe('Config bit management', () => {
    it('sets public bit', async () => {
      const image = createTestImage({ ctags_val: '\\x00' })
      const { toggleConfigBit, configBits } = useImageStatus(ref(image))
      await toggleConfigBit('public')
      expectBitSet(configBits.value, 0)
    })

    it('auto-sets public bit when publishing', async () => {
      const image = createTestImage({ status_val: '\\x02', ctags_val: '\\x00' })
      const { publishImage, configBits } = useImageStatus(ref(image))
      await publishImage()
      expectBitSet(configBits.value, 0)
    })
  })
})
```

---

### Test File: `tests/unit/useGalleryFilters.spec.ts`

**Purpose:** Test filter state management composable

**Test Count:** ~30 tests

```typescript
describe('useGalleryFilters', () => {
  describe('Filter state', () => {
    it('initializes with empty filters', () => {
      const { activeFilters } = useGalleryFilters()
      expect(activeFilters.value).toEqual({
        status: null,
        ttags: [],
        dtags: [],
        rtags: [],
        ctags: {}
      })
    })

    it('sets status filter', () => {
      const { setStatusFilter, activeFilters } = useGalleryFilters()
      setStatusFilter('\\x02')
      expect(activeFilters.value.status).toBe('\\x02')
    })

    it('adds ttag to filter', () => {
      const { toggleTtag, activeFilters } = useGalleryFilters()
      toggleTtag('\\x01')
      expect(activeFilters.value.ttags).toContain('\\x01')
    })
  })

  describe('Query building', () => {
    it('builds status query', () => {
      const { setStatusFilter, buildQuery } = useGalleryFilters()
      setStatusFilter('\\x02')
      expect(buildQuery()).toBe('status_eq=\\x02')
    })

    it('builds ttags any query', () => {
      const { toggleTtag, buildQuery } = useGalleryFilters()
      toggleTtag('\\x01')
      toggleTtag('\\x02')
      expect(buildQuery()).toBe('ttags_any=\\x03')
    })

    it('combines multiple filters', () => {
      const { setStatusFilter, toggleTtag, buildQuery } = useGalleryFilters()
      setStatusFilter('\\x02')
      toggleTtag('\\x01')
      const query = buildQuery()
      expect(query).toContain('status_eq=\\x02')
      expect(query).toContain('ttags_any=\\x01')
    })
  })

  describe('Active chips', () => {
    it('generates chip for status filter', () => {
      const { setStatusFilter, activeChips } = useGalleryFilters()
      setStatusFilter('\\x02')
      expect(activeChips.value).toHaveLength(1)
      expect(activeChips.value[0].type).toBe('status')
    })

    it('generates chips for multiple filters', () => {
      const { setStatusFilter, toggleTtag, activeChips } = useGalleryFilters()
      setStatusFilter('\\x02')
      toggleTtag('\\x01')
      expect(activeChips.value.length).toBeGreaterThan(1)
    })
  })
})
```

---

## Unit Tests: Advanced Composables

### Test File: `tests/unit/useProjectStatus.spec.ts`

**Purpose:** Test project lifecycle composable

**Test Count:** ~30 tests

```typescript
describe('useProjectStatus', () => {
  describe('Status workflow', () => {
    it('transitions idea → draft', async () => {
      const project = createTestProject({ status_val: '\\x00' })
      const { startDraft, currentStatus } = useProjectStatus(ref(project))
      await startDraft()
      expect(currentStatus.value).toBe('\\x01')
    })

    it('suggests next action for idea status', () => {
      const project = createTestProject({ status_val: '\\x00' })
      const { nextAction } = useProjectStatus(ref(project))
      expect(nextAction.value).toBe('Create draft')
    })
  })
})
```

### Test File: `tests/unit/useEventTemplates.spec.ts`

**Purpose:** Test event template management

**Test Count:** ~25 tests

### Test File: `tests/unit/useSysregSuggestions.spec.ts`

**Purpose:** Test tag suggestion engine

**Test Count:** ~40 tests

```typescript
describe('useSysregSuggestions', () => {
  describe('History tracking', () => {
    it('records tag usage to localStorage', () => {
      const { recordTagUse } = useSysregSuggestions()
      recordTagUse('ttags', '\\x01')
      const history = JSON.parse(localStorage.getItem('sysreg_history') || '{}')
      expect(history['ttags-\\x01']).toBeGreaterThan(0)
    })

    it('suggests frequently used tags', () => {
      const { recordTagUse, suggestFromHistory } = useSysregSuggestions()
      recordTagUse('ttags', '\\x01')
      recordTagUse('ttags', '\\x01')
      recordTagUse('ttags', '\\x02')
      const suggestions = suggestFromHistory('ttags')
      expect(suggestions[0].value).toBe('\\x01')
    })
  })

  describe('Content analysis', () => {
    it('detects democracy keyword', () => {
      const { suggestFromContent } = useSysregSuggestions()
      const content = 'This is about democracy and voting'
      const suggestions = suggestFromContent(content)
      expect(suggestions.some(s => s.label === 'Democracy')).toBe(true)
    })

    it('detects multiple keywords', () => {
      const { suggestFromContent } = useSysregSuggestions()
      const content = 'Environment and climate change workshop'
      const suggestions = suggestFromContent(content)
      expect(suggestions.length).toBeGreaterThan(1)
    })
  })
})
```

### Test File: `tests/unit/useSysregBatchOperations.spec.ts`

**Purpose:** Test batch operations

**Test Count:** ~30 tests

```typescript
describe('useSysregBatchOperations', () => {
  describe('Batch status updates', () => {
    it('updates status for multiple entities', async () => {
      const images = createTestImages(5)
      const { batchUpdateStatus, progress } = useSysregBatchOperations()
      await batchUpdateStatus(images, '\\x02')
      expect(progress.value.completed).toBe(5)
    })

    it('tracks progress during batch operation', async () => {
      const images = createTestImages(10)
      const { batchUpdateStatus, progress } = useSysregBatchOperations()
      const promise = batchUpdateStatus(images, '\\x02')
      // Check progress updates
      await new Promise(r => setTimeout(r, 50))
      expect(progress.value.total).toBe(10)
      await promise
    })
  })

  describe('Batch tag operations', () => {
    it('adds tags to multiple entities', async () => {
      const images = createTestImages(3)
      const { batchAddTags } = useSysregBatchOperations()
      await batchAddTags(images, 'ttags', ['\\x01', '\\x02'])
      images.forEach(img => {
        expectBitSet(img.ttags_val!, 0)
        expectBitSet(img.ttags_val!, 1)
      })
    })
  })
})
```

### Test File: `tests/unit/useSysregAnalytics.spec.ts`

**Purpose:** Test analytics and insights

**Test Count:** ~25 tests

```typescript
describe('useSysregAnalytics', () => {
  describe('Tag usage statistics', () => {
    it('calculates ttags distribution', async () => {
      const { fetchAnalytics, ttagsUsage } = useSysregAnalytics('images')
      await fetchAnalytics()
      expect(ttagsUsage.value.length).toBeGreaterThan(0)
      expect(ttagsUsage.value[0].count).toBeGreaterThan(0)
    })

    it('calculates percentages correctly', async () => {
      const { fetchAnalytics, statusDistribution } = useSysregAnalytics('images')
      await fetchAnalytics()
      const totalPercentage = statusDistribution.value
        .reduce((sum, s) => sum + s.percentage, 0)
      expect(totalPercentage).toBeCloseTo(100, 1)
    })
  })

  describe('CSV export', () => {
    it('exports status distribution to CSV', () => {
      const { exportToCsv } = useSysregAnalytics('images')
      const csv = exportToCsv('status')
      expect(csv).toContain('Label,Value,Count,Percentage')
    })
  })
})
```

---

## Component Tests: Base Components

### Test File: `tests/component/StatusBadge.spec.ts`

**Purpose:** Test status badge component

**Test Count:** ~15 tests

```typescript
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/sysreg/StatusBadge.vue'

describe('StatusBadge', () => {
  describe('Rendering', () => {
    it('renders status label', () => {
      const wrapper = mount(StatusBadge, {
        props: { value: '\\x02' }
      })
      expect(wrapper.text()).toContain('Approved')
    })

    it('applies correct color class', () => {
      const wrapper = mount(StatusBadge, {
        props: { value: '\\x02' }
      })
      expect(wrapper.classes()).toContain('bg-green-100')
    })

    it('shows icon when enabled', () => {
      const wrapper = mount(StatusBadge, {
        props: { value: '\\x02', showIcon: true }
      })
      expect(wrapper.html()).toContain('✓')
    })
  })

  describe('Size variants', () => {
    it('applies small size class', () => {
      const wrapper = mount(StatusBadge, {
        props: { value: '\\x02', size: 'sm' }
      })
      expect(wrapper.classes()).toContain('text-xs')
    })

    it('applies large size class', () => {
      const wrapper = mount(StatusBadge, {
        props: { value: '\\x02', size: 'lg' }
      })
      expect(wrapper.classes()).toContain('text-base')
    })
  })
})
```

### Test File: `tests/component/SysregSelect.spec.ts`

**Purpose:** Test single-select dropdown

**Test Count:** ~20 tests

### Test File: `tests/component/SysregMultiToggle.spec.ts`

**Purpose:** Test multi-select toggle component

**Test Count:** ~25 tests

### Test File: `tests/component/SysregBitGroupSelect.spec.ts`

**Purpose:** Test CTags bit group selector

**Test Count:** ~20 tests

---

## Component Tests: Filter Components

### Test File: `tests/component/FilterChip.spec.ts`

**Purpose:** Test filter chip component

**Test Count:** ~15 tests

### Test File: `tests/component/SysregFilterSet.spec.ts`

**Purpose:** Test complete filter UI

**Test Count:** ~30 tests

### Test File: `tests/component/ImageStatusControls.spec.ts`

**Purpose:** Test image status management UI

**Test Count:** ~35 tests

---

## Integration Tests

### Test File: `tests/integration/sysreg-api.spec.ts`

**Purpose:** Test sysreg REST API endpoints

**Test Count:** ~40 tests

```typescript
describe('Sysreg API', () => {
  describe('GET /api/sysreg', () => {
    it('returns all 38 sysreg entries', async () => {
      const response = await fetch('/api/sysreg')
      const data = await response.json()
      expect(data.sysreg.length).toBe(38)
    })

    it('filters by tagfamily', async () => {
      const response = await fetch('/api/sysreg?tagfamily=ttags')
      const data = await response.json()
      expect(data.sysreg.every(e => e.tagfamily === 'ttags')).toBe(true)
    })
  })

  describe('GET /api/images with sysreg filters', () => {
    it('filters by status_eq', async () => {
      const response = await fetch('/api/images?status_eq=\\x02')
      const data = await response.json()
      expect(data.every(img => img.status_val === '\\x02')).toBe(true)
    })

    it('filters by ttags_any', async () => {
      const response = await fetch('/api/images?ttags_any=\\x03')
      const data = await response.json()
      expect(data.length).toBeGreaterThan(0)
    })
  })
})
```

### Test File: `tests/integration/sysreg-workflow.spec.ts`

**Purpose:** Test end-to-end workflows

**Test Count:** ~25 tests

```typescript
describe('Image Workflow', () => {
  it('completes full image lifecycle', async () => {
    // Create image
    const image = await createImage({ name: 'Test' })
    expect(image.status_val).toBe('\\x00') // raw

    // Start processing
    await updateImage(image.id, { status_val: '\\x01' })
    
    // Approve
    await updateImage(image.id, { status_val: '\\x02' })
    
    // Publish
    await updateImage(image.id, { status_val: '\\x04' })
    
    const final = await getImage(image.id)
    expect(final.status_val).toBe('\\x04')
  })
})
```

---

## BYTEA Testing Utilities

### Usage Examples

```typescript
import { byteaEqual, expectBitSet, expectBitClear, bitsToHex } from '../helpers/sysreg-bytea-helpers'

describe('BYTEA operations', () => {
  it('compares BYTEA values', () => {
    expect(byteaEqual('\\x01', '\\x01')).toBe(true)
    expect(byteaEqual('\\x01', '\\x02')).toBe(false)
  })

  it('checks bit presence', () => {
    expectBitSet('\\x05', 0) // ✓ bit 0 is set
    expectBitSet('\\x05', 2) // ✓ bit 2 is set
    expectBitClear('\\x05', 1) // ✓ bit 1 is NOT set
  })

  it('creates BYTEA from bits', () => {
    const hex = bitsToHex([0, 2, 4])
    expect(hex).toBe('\\x15')
  })
})
```

---

## Test Data Factories

### Image Factory

```typescript
// Create single image with defaults
const image = createTestImage()

// Override specific fields
const approved = createTestImage({ 
  status_val: '\\x02',
  ttags_val: '\\x05'
})

// Create batch
const images = createTestImages(10)
```

### Project Factory

```typescript
const project = createTestProject({ status_val: '\\x04' })
```

### Event Factory

```typescript
const event = createTestEvent({ 
  status_val: '\\x02',
  ctags_val: '\\x01'
})
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

**Priority: High**

- [ ] Create `tests/helpers/sysreg-test-data.ts`
- [ ] Create `tests/helpers/sysreg-bytea-helpers.ts`
- [ ] Create `tests/helpers/sysreg-mock-api.ts`
- [ ] Implement `tests/unit/useSysregTags.spec.ts` (45 tests)
- [ ] Implement `tests/unit/useSysregOptions.spec.ts` (25 tests)

**Estimated Time:** 8-12 hours  
**Validation:** All BYTEA operations tested, 70 tests passing

---

### Phase 2: Enhanced Composables (Week 2)

**Priority: High**

- [ ] Implement `tests/unit/useImageStatus.spec.ts` (35 tests)
- [ ] Implement `tests/unit/useGalleryFilters.spec.ts` (30 tests)
- [ ] Implement `tests/component/StatusBadge.spec.ts` (15 tests)
- [ ] Implement `tests/component/FilterChip.spec.ts` (15 tests)

**Estimated Time:** 10-14 hours  
**Validation:** Image lifecycle tested, filter logic verified

---

### Phase 3: Advanced Features (Week 3)

**Priority: Medium**

- [ ] Implement `tests/unit/useProjectStatus.spec.ts` (30 tests)
- [ ] Implement `tests/unit/useEventTemplates.spec.ts` (25 tests)
- [ ] Implement `tests/unit/useSysregSuggestions.spec.ts` (40 tests)
- [ ] Implement `tests/unit/useSysregBatchOperations.spec.ts` (30 tests)
- [ ] Implement `tests/unit/useSysregAnalytics.spec.ts` (25 tests)

**Estimated Time:** 12-16 hours  
**Validation:** Advanced workflows tested, batch operations verified

---

### Phase 4: Component Tests (Week 4)

**Priority: Medium**

- [ ] Implement `tests/component/SysregSelect.spec.ts` (20 tests)
- [ ] Implement `tests/component/SysregMultiToggle.spec.ts` (25 tests)
- [ ] Implement `tests/component/SysregBitGroupSelect.spec.ts` (20 tests)
- [ ] Implement `tests/component/SysregFilterSet.spec.ts` (30 tests)
- [ ] Implement `tests/component/ImageStatusControls.spec.ts` (35 tests)

**Estimated Time:** 10-14 hours  
**Validation:** All UI components tested, interactions verified

---

### Phase 5: Integration Tests (Week 5)

**Priority: Low**

- [ ] Implement `tests/integration/sysreg-api.spec.ts` (40 tests)
- [ ] Implement `tests/integration/sysreg-workflow.spec.ts` (25 tests)
- [ ] End-to-end workflow testing
- [ ] Performance benchmarks

**Estimated Time:** 8-12 hours  
**Validation:** Full system integration verified

---

## Test Coverage Goals

### Target Coverage

- **Unit Tests:** 85% line coverage
- **Component Tests:** 80% line coverage
- **Integration Tests:** 70% line coverage
- **Overall:** 80% line coverage

### Coverage by Module

| Module | Target | Priority |
|--------|--------|----------|
| useSysregTags | 95% | Critical |
| useSysregOptions | 90% | Critical |
| useImageStatus | 85% | High |
| useGalleryFilters | 85% | High |
| useProjectStatus | 80% | Medium |
| useSysregSuggestions | 80% | Medium |
| useSysregBatchOperations | 85% | Medium |
| useSysregAnalytics | 75% | Low |

---

## Running Tests

### Run All Tests

```bash
npm run test
```

### Run Specific Test File

```bash
npm run test tests/unit/useSysregTags.spec.ts
```

### Run with Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

---

## Test Execution Matrix

### Unit Tests (8 files, ~280 tests)

| File | Tests | Priority | Est. Time |
|------|-------|----------|-----------|
| useSysregTags.spec.ts | 45 | Critical | 3h |
| useSysregOptions.spec.ts | 25 | Critical | 2h |
| useImageStatus.spec.ts | 35 | High | 3h |
| useGalleryFilters.spec.ts | 30 | High | 3h |
| useProjectStatus.spec.ts | 30 | Medium | 3h |
| useEventTemplates.spec.ts | 25 | Medium | 2h |
| useSysregSuggestions.spec.ts | 40 | Medium | 4h |
| useSysregBatchOperations.spec.ts | 30 | Medium | 3h |
| useSysregAnalytics.spec.ts | 25 | Low | 2h |

### Component Tests (7 files, ~160 tests)

| File | Tests | Priority | Est. Time |
|------|-------|----------|-----------|
| StatusBadge.spec.ts | 15 | High | 2h |
| SysregSelect.spec.ts | 20 | High | 2h |
| SysregMultiToggle.spec.ts | 25 | Medium | 3h |
| SysregBitGroupSelect.spec.ts | 20 | Medium | 2h |
| FilterChip.spec.ts | 15 | Medium | 2h |
| SysregFilterSet.spec.ts | 30 | Medium | 3h |
| ImageStatusControls.spec.ts | 35 | Medium | 4h |

### Integration Tests (2 files, ~65 tests)

| File | Tests | Priority | Est. Time |
|------|-------|----------|-----------|
| sysreg-api.spec.ts | 40 | Medium | 4h |
| sysreg-workflow.spec.ts | 25 | Low | 3h |

**Total:** 17 test files, ~505 tests, ~50-60 hours implementation time

---

## Success Criteria

### Phase 1 Complete ✓
- All BYTEA utilities tested
- Tag manipulation verified
- Option fetching tested
- Mock API working

### Phase 2 Complete ✓
- Image lifecycle tested
- Filter logic verified
- Status transitions working
- Query building tested

### Phase 3 Complete ✓
- Project workflows tested
- Event templates verified
- Suggestions working
- Batch operations tested

### Phase 4 Complete ✓
- All components tested
- UI interactions verified
- Accessibility validated
- Visual regression checked

### Phase 5 Complete ✓
- API endpoints tested
- Workflows verified
- Performance acceptable
- Documentation complete

---

## References

### Documentation
- `TEST_IMPLEMENTATION_SUMMARY.md` - Testing patterns and examples
- `2025-11-14_TEST_STATUS.md` - Current test inventory
- `SYSREG_PHASE3_PHASE4_COMPLETE.md` - Implementation details
- `SYSREG_IMPLEMENTATION_PLAN.md` - System architecture

### Existing Test Examples
- `tests/unit/ItemGallery.eventSorting.spec.ts` - Component test pattern
- `tests/unit/rebuildShapeUrlWithXYZ.test.ts` - Pure function testing
- `tests/integration/i18n-api.test.ts` - API integration pattern

---

**Document Status:** Complete  
**Last Updated:** November 19, 2025  
**Next Review:** After Phase 1 implementation
