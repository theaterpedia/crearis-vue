# Vitest Test Infrastructure Guide

**Created:** November 13, 2025  
**Purpose:** Complete guide for setting up and using Vitest test infrastructure for CList components  
**Related:** Test specifications in `/docs/tasks/2025-11-13_TEST_SPEC_*.md`

---

## 📋 Overview

This document provides complete instructions for code automation tools to set up and use the Vitest testing infrastructure that's already in place for the crearis-vue project.

---

## 🔧 Existing Test Infrastructure

### 1. Core Configuration

**File:** `/vitest.config.ts`

**Key Settings:**
```typescript
{
  environment: 'happy-dom',           // Fast DOM for Vue components
  globalSetup: './tests/setup/global-setup.ts',
  setupFiles: ['./tests/setup/test-setup.ts'],
  globals: true,                      // No need to import describe/it/expect
  isolate: true,                      // Tests run in isolation
  testTimeout: 30000,
  hookTimeout: 30000
}
```

**Aliases:**
- `@/` → `/src/`
- `~/` → `/server/`

### 2. Global Setup Files

#### A. Global Setup (`tests/setup/global-setup.ts`)
- Runs **once** before all tests
- Loads `.env` file
- Sets up database (if not `SKIP_MIGRATIONS=true`)
- Creates PostgreSQL extensions (pgcrypto)
- Runs migrations (000-023)

#### B. Test Setup (`tests/setup/test-setup.ts`)
- Runs **before each test file**
- Sets `NODE_ENV=test`
- Configures database environment variables
- Provides global `beforeEach` and `afterEach` hooks

### 3. Test Commands

**From `package.json`:**
```json
{
  "test": "vitest",                              // Watch mode
  "test:ui": "vitest --ui",                      // UI mode
  "test:run": "vitest run",                      // Run once
  "test:unit": "SKIP_MIGRATIONS=true vitest run", // Unit tests (fast)
  "test:coverage": "vitest run --coverage"       // With coverage
}
```

**Usage:**
```bash
# Unit tests (no DB) - FAST (~500ms)
pnpm test:unit

# All tests with DB setup
pnpm test

# Watch mode during development
pnpm test -- --watch

# Specific test file
pnpm test:unit tests/unit/clist/imgShape.test.ts

# With UI
pnpm test:ui
```

---

## 🧪 Test Helpers (Existing)

### Location: `/tests/utils/test-helpers.ts`

### 1. CSS Variable Mocking

**Problem:** Vue components read CSS custom properties, but test environment has none.

**Solution:**
```typescript
import { setupCSSVariableMocks, STANDARD_DIMENSIONS } from '../utils/test-helpers'

describe('MyComponent', () => {
  let cleanupCSS: (() => void) | null = null

  beforeEach(() => {
    cleanupCSS = setupCSSVariableMocks() // Injects CSS vars into DOM
  })

  afterEach(() => {
    if (cleanupCSS) {
      cleanupCSS() // Removes injected styles
      cleanupCSS = null
    }
  })
})
```

**Standard Dimensions:**
```typescript
STANDARD_DIMENSIONS = {
  '--card-width': '336px',      // 21rem - wide shape
  '--card-height': '224px',     // 14rem
  '--tile-width': '128px',      // 8rem - square shape
  '--tile-height': '128px',     // 8rem
  '--avatar-width': '64px'      // 4rem - thumb shape
}
```

### 2. Theme Composable Mocking

**Problem:** `useTheme()` composable needs to be mocked for tests.

**Solution:**
```typescript
import { mockUseTheme, setMockThemeDimensions, resetMockThemeDimensions } from '../utils/test-helpers'

// At top of test file (outside describe blocks)
vi.mock('@/composables/useTheme', () => ({
  useTheme: mockUseTheme
}))

// In tests - manipulate theme values
describe('Dimension Tests', () => {
  afterEach(() => {
    resetMockThemeDimensions() // Reset to defaults
  })

  it('should handle invalid dimensions', () => {
    setMockThemeDimensions({ cardWidth: 0, cardHeight: 0 }) // Simulate error
    
    const wrapper = mount(ImgShape, { /* ... */ })
    
    expect(wrapper.find('.error-overlay').exists()).toBe(true)
  })
})
```

**Default Theme Values:**
```typescript
{
  cardWidth: 336,
  cardHeight: 224,
  cardHeightMin: 168,
  tileWidth: 128,
  tileHeight: 128,
  tileHeightSquare: 128,
  avatarWidth: 64
}
```

### 3. Wrapper Dimension Setting

**For components that need explicit dimensions:**
```typescript
import { setWrapperDimensions, STANDARD_DIMENSIONS } from '../utils/test-helpers'

it('should render with correct size', () => {
  const wrapper = mount(ImgShape, { /* ... */ })
  
  // Apply dimensions directly to wrapper element
  setWrapperDimensions(wrapper, STANDARD_DIMENSIONS)
  
  await wrapper.vm.$nextTick()
  
  // Now component has dimensions
})
```

---

## 🎯 Test Patterns for CList Components

### Pattern 1: Unit Test Structure

```typescript
/**
 * ComponentName - Unit Tests
 * 
 * Test Specification: /docs/tasks/2025-11-13_TEST_SPEC_COMPONENTNAME.md
 * Component: /src/components/path/ComponentName.vue
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setupCSSVariableMocks, mockUseTheme } from '../utils/test-helpers'
import ComponentName from '@/components/path/ComponentName.vue'

// Mock composables BEFORE importing component
vi.mock('@/composables/useTheme', () => ({
  useTheme: mockUseTheme
}))

describe('ComponentName', () => {
  let cleanupCSS: (() => void) | null = null

  beforeEach(() => {
    cleanupCSS = setupCSSVariableMocks()
  })

  afterEach(() => {
    if (cleanupCSS) {
      cleanupCSS()
      cleanupCSS = null
    }
  })

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      const wrapper = mount(ComponentName, {
        props: {
          // Props here
        }
      })

      await flushPromises() // Wait for async operations

      // Assertions
      expect(wrapper.exists()).toBe(true)
    })
  })
})
```

### Pattern 2: Props Testing

```typescript
describe('Props Validation', () => {
  it('should accept all required props', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test Item',
        data: {
          xmlID: 'tp.event.summer-2024',
          type: 'url',
          url: 'https://example.com/image.jpg',
          blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
        },
        options: {
          selectable: true
        },
        models: {
          selected: false
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle optional props', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test Item'
        // Other props optional
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
```

### Pattern 3: Event Testing

```typescript
describe('Event Emissions', () => {
  it('should emit update:selectedIds when checkbox clicked', async () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        options: { selectable: true },
        models: { selected: false }
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)

    // Check event was emitted
    expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
    
    // Check event payload
    expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1]])
  })
})
```

### Pattern 4: Computed Property Testing

```typescript
describe('Computed Properties', () => {
  it('should calculate shouldUseAvatar correctly', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        data: {
          xmlID: 'tp.event.summer-2024' // Entity type = 'event'
        },
        shape: 'thumb'
      }
    })

    // Access computed via vm
    expect(wrapper.vm.shouldUseAvatar).toBe(true)
  })

  it('should NOT use avatar for non-eligible entity', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        data: {
          xmlID: 'tp.project.my-project' // Entity type = 'project'
        },
        shape: 'thumb'
      }
    })

    expect(wrapper.vm.shouldUseAvatar).toBe(false)
  })
})
```

### Pattern 5: DOM Element Testing

```typescript
describe('DOM Structure', () => {
  it('should render checkbox when selectable', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        options: { selectable: true }
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
  })

  it('should NOT render checkbox when not selectable', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        options: { selectable: false }
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(false)
  })

  it('should apply correct CSS class', () => {
    const wrapper = mount(ItemRow, {
      props: {
        heading: 'Test',
        models: { selected: true }
      }
    })

    expect(wrapper.classes()).toContain('selected')
  })
})
```

### Pattern 6: Async Data Testing

```typescript
describe('Data Fetching', () => {
  it('should fetch entities on mount', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, title: 'Event 1', xmlID: 'tp.event.event-1' },
        { id: 2, title: 'Event 2', xmlID: 'tp.event.event-2' }
      ]
    })

    const wrapper = mount(ItemList, {
      props: {
        entity: 'events',
        dataMode: true
      }
    })

    await flushPromises() // Wait for fetch to complete

    const items = wrapper.findAllComponents({ name: 'ItemRow' })
    expect(items).toHaveLength(2)
  })
})
```

---

## 🎨 Required Test Helpers (To Create)

### 1. Mock Data Factory

**File:** `/tests/utils/clist-test-data.ts`

```typescript
/**
 * CList Test Data Factory
 * 
 * Provides consistent mock data for CList component testing
 */

import type { ImgShapeData } from '@/components/images/ImgShape.vue'

export interface MockEntityData {
  id: number
  title: string
  xmlID: string
  img_thumb?: ImgShapeData
  img_square?: ImgShapeData
  img_wide?: ImgShapeData
  img_vertical?: ImgShapeData
}

/**
 * Create a mock event entity
 */
export function createMockEvent(overrides?: Partial<MockEntityData>): MockEntityData {
  return {
    id: 1,
    title: 'Summer Festival 2024',
    xmlID: 'tp.event.summer-festival-2024',
    img_thumb: createMockImageData('thumb'),
    img_square: createMockImageData('square'),
    img_wide: createMockImageData('wide'),
    ...overrides
  }
}

/**
 * Create a mock instructor entity
 */
export function createMockInstructor(overrides?: Partial<MockEntityData>): MockEntityData {
  return {
    id: 1,
    title: 'John Doe',
    xmlID: 'tp.instructor.john-doe',
    img_thumb: createMockImageData('thumb'),
    ...overrides
  }
}

/**
 * Create a mock post entity
 */
export function createMockPost(overrides?: Partial<MockEntityData>): MockEntityData {
  return {
    id: 1,
    title: 'Blog Post Title',
    xmlID: 'tp.post.my-blog-post',
    img_thumb: createMockImageData('thumb'),
    img_wide: createMockImageData('wide'),
    ...overrides
  }
}

/**
 * Create a mock project entity (not avatar-eligible)
 */
export function createMockProject(overrides?: Partial<MockEntityData>): MockEntityData {
  return {
    id: 1,
    title: 'Project Alpha',
    xmlID: 'tp.project.project-alpha',
    img_wide: createMockImageData('wide'),
    ...overrides
  }
}

/**
 * Create mock image data
 */
export function createMockImageData(
  shape: 'thumb' | 'square' | 'wide' | 'vertical',
  overrides?: Partial<ImgShapeData>
): ImgShapeData {
  const dimensions = {
    thumb: { w: 64, h: 64 },
    square: { w: 128, h: 128 },
    wide: { w: 336, h: 168 },
    vertical: { w: 126, h: 224 }
  }

  return {
    type: 'url',
    url: `https://images.unsplash.com/photo-${shape}`,
    blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    tpar: 'fit=crop&w={W}&h={H}',
    turl: null,
    x: null,
    y: null,
    z: null,
    ...overrides
  }
}

/**
 * Create multiple mock entities
 */
export function createMockEvents(count: number): MockEntityData[] {
  return Array.from({ length: count }, (_, i) => createMockEvent({
    id: i + 1,
    title: `Event ${i + 1}`,
    xmlID: `tp.event.event-${i + 1}`
  }))
}

export function createMockInstructors(count: number): MockEntityData[] {
  return Array.from({ length: count }, (_, i) => createMockInstructor({
    id: i + 1,
    title: `Instructor ${i + 1}`,
    xmlID: `tp.instructor.instructor-${i + 1}`
  }))
}

export function createMockPosts(count: number): MockEntityData[] {
  return Array.from({ length: count }, (_, i) => createMockPost({
    id: i + 1,
    title: `Post ${i + 1}`,
    xmlID: `tp.post.post-${i + 1}`
  }))
}
```

### 2. Fetch Mock Helper

**File:** `/tests/utils/fetch-mock.ts`

```typescript
/**
 * Fetch Mock Utilities
 * 
 * Helpers for mocking fetch API in tests
 */

import { vi } from 'vitest'
import type { MockEntityData } from './clist-test-data'

/**
 * Mock successful fetch response
 */
export function mockFetchSuccess(data: any) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data)
  } as Response)
}

/**
 * Mock failed fetch response
 */
export function mockFetchError(message: string, status = 500) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => message
  } as Response)
}

/**
 * Mock fetch with specific endpoint responses
 */
export function mockFetchWithEndpoints(endpointMap: Record<string, any>) {
  global.fetch = vi.fn((url: string) => {
    const urlStr = url.toString()
    
    for (const [endpoint, data] of Object.entries(endpointMap)) {
      if (urlStr.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          json: async () => data,
          text: async () => JSON.stringify(data)
        } as Response)
      }
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Endpoint not mocked' })
    } as Response)
  })
}

/**
 * Create mock entity API response
 */
export function mockEntityAPI(entity: string, data: MockEntityData[]) {
  mockFetchSuccess(data)
}

/**
 * Verify fetch was called with correct endpoint
 */
export function expectFetchCalledWith(endpoint: string) {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(endpoint)
  )
}
```

### 3. Component Mounting Helper

**File:** `/tests/utils/mount-helpers.ts`

```typescript
/**
 * Component Mounting Helpers
 * 
 * Simplified mounting with common setup
 */

import { mount, type VueWrapper } from '@vue/test-utils'
import { setupCSSVariableMocks } from './test-helpers'
import type { Component } from 'vue'

export interface MountOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: {
    stubs?: Record<string, any>
    mocks?: Record<string, any>
  }
  attachTo?: Element
}

/**
 * Mount component with automatic CSS variable setup
 */
export function mountWithCSS(
  component: Component,
  options: MountOptions = {}
): { wrapper: VueWrapper; cleanup: () => void } {
  const cleanup = setupCSSVariableMocks()
  
  const wrapper = mount(component, options)
  
  return { wrapper, cleanup }
}

/**
 * Mount CList component with common defaults
 */
export function mountCListComponent(
  component: Component,
  options: MountOptions = {}
): { wrapper: VueWrapper; cleanup: () => void } {
  const cleanup = setupCSSVariableMocks()
  
  // Merge with CList defaults
  const defaultOptions: MountOptions = {
    global: {
      stubs: {
        // Stub heavy child components if needed
        // 'ImgShape': true
      }
    }
  }
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    props: {
      ...defaultOptions.props,
      ...options.props
    },
    global: {
      ...defaultOptions.global,
      ...options.global
    }
  }
  
  const wrapper = mount(component, mergedOptions)
  
  return { wrapper, cleanup }
}

/**
 * Example usage:
 * 
 * describe('ItemRow', () => {
 *   let cleanup: () => void
 * 
 *   afterEach(() => {
 *     if (cleanup) cleanup()
 *   })
 * 
 *   it('should render', () => {
 *     const result = mountCListComponent(ItemRow, {
 *       props: { heading: 'Test' }
 *     })
 *     cleanup = result.cleanup
 * 
 *     expect(result.wrapper.exists()).toBe(true)
 *   })
 * })
 */
```

### 4. Selection State Helper

**File:** `/tests/utils/selection-helpers.ts`

```typescript
/**
 * Selection State Helpers
 * 
 * Utilities for testing selection behavior
 */

import type { VueWrapper } from '@vue/test-utils'

/**
 * Select an item in a list
 */
export async function selectItem(
  listWrapper: VueWrapper,
  index: number
): Promise<void> {
  const items = listWrapper.findAll('.item-row, .item-tile, .item-card')
  
  if (index >= items.length) {
    throw new Error(`Item index ${index} out of range (${items.length} items)`)
  }
  
  await items[index].trigger('click')
}

/**
 * Select multiple items
 */
export async function selectItems(
  listWrapper: VueWrapper,
  indices: number[]
): Promise<void> {
  for (const index of indices) {
    await selectItem(listWrapper, index)
  }
}

/**
 * Check if item is selected
 */
export function isItemSelected(
  listWrapper: VueWrapper,
  index: number
): boolean {
  const items = listWrapper.findAll('.item-row, .item-tile, .item-card')
  
  if (index >= items.length) {
    throw new Error(`Item index ${index} out of range`)
  }
  
  const item = items[index]
  
  // Check for selected class
  if (item.classes().includes('selected')) {
    return true
  }
  
  // Check for checked checkbox
  const checkbox = item.find('input[type="checkbox"]')
  if (checkbox.exists() && (checkbox.element as HTMLInputElement).checked) {
    return true
  }
  
  return false
}

/**
 * Get selected item IDs from emitted events
 */
export function getSelectedIds(wrapper: VueWrapper): number[] {
  const events = wrapper.emitted('update:selectedIds')
  if (!events || events.length === 0) {
    return []
  }
  
  const lastEvent = events[events.length - 1]
  const payload = lastEvent[0]
  
  // Handle both single ID and array
  if (Array.isArray(payload)) {
    return payload
  } else {
    return [payload]
  }
}

/**
 * Verify selection highlight applied
 */
export function expectPrimaryHighlight(wrapper: VueWrapper): void {
  expect(wrapper.classes()).toContain('selected')
  
  const style = window.getComputedStyle(wrapper.element)
  expect(style.boxShadow).toContain('var(--color-primary-bg)')
}

export function expectSecondaryHighlight(wrapper: VueWrapper): void {
  expect(wrapper.classes()).toContain('selected')
  
  const style = window.getComputedStyle(wrapper.element)
  expect(style.backgroundColor).toBe('var(--color-secondary-bg)')
  expect(style.color).toBe('var(--color-secondary-contrast)')
}
```

---

## 📦 Test File Template

**File:** `/tests/unit/clist/TEMPLATE.test.ts`

```typescript
/**
 * ComponentName - Unit Tests
 * 
 * Test Specification: /docs/tasks/2025-11-13_TEST_SPEC_COMPONENTNAME.md
 * Component: /src/components/clist/ComponentName.vue
 * 
 * This test file serves as the PRIMARY specification.
 * All implementation must follow these test definitions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mountCListComponent } from '../../utils/mount-helpers'
import { mockUseTheme } from '../../utils/test-helpers'
import { createMockEvent, createMockEvents } from '../../utils/clist-test-data'
import { mockFetchSuccess } from '../../utils/fetch-mock'
import ComponentName from '@/components/clist/ComponentName.vue'

// Mock composables
vi.mock('@/composables/useTheme', () => ({
  useTheme: mockUseTheme
}))

describe('ComponentName', () => {
  let cleanup: (() => void) | null = null

  afterEach(() => {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
    vi.clearAllMocks()
  })

  describe('Issue A1: [Description]', () => {
    it('TC-A1.1: should [expected behavior]', async () => {
      const { wrapper, cleanup: cleanupFn } = mountCListComponent(ComponentName, {
        props: {
          // Props here
        }
      })
      cleanup = cleanupFn

      await flushPromises()

      // Assertions
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Feature B1: [Description]', () => {
    it('TC-B1.1: should [expected behavior]', async () => {
      // Test implementation
    })
  })
})
```

---

## 🚀 Quick Start Checklist

For code automation setting up new CList tests:

### 1. Prerequisites Check
- [ ] Vitest installed (`@vue/test-utils`, `vitest`, `happy-dom`)
- [ ] `vitest.config.ts` configured
- [ ] Setup files exist (`tests/setup/*.ts`)
- [ ] Test helpers exist (`tests/utils/test-helpers.ts`)

### 2. Create New Test Helpers
- [ ] Create `/tests/utils/clist-test-data.ts`
- [ ] Create `/tests/utils/fetch-mock.ts`
- [ ] Create `/tests/utils/mount-helpers.ts`
- [ ] Create `/tests/utils/selection-helpers.ts`

### 3. Create Test Directory
- [ ] Create `/tests/unit/clist/` directory
- [ ] Copy template to new test file
- [ ] Update imports and component name

### 4. Write Tests Following Patterns
- [ ] Use `mountCListComponent()` for setup
- [ ] Use mock data factories for entities
- [ ] Use `mockFetchSuccess()` for API mocking
- [ ] Follow TC-XX.YY naming from specs

### 5. Run Tests
```bash
# Single file
pnpm test:unit tests/unit/clist/imgShape.test.ts

# Watch mode
pnpm test -- --watch tests/unit/clist/

# All CList tests
pnpm test:unit tests/unit/clist/
```

---

## 📊 Coverage Goals

- **Unit Tests:** 90%+ for individual components
- **Integration Tests:** All critical user flows
- **E2E Tests:** Key workflows (selection, dropdown, search)

---

## 🎯 Success Criteria

- ✅ All test helpers created and documented
- ✅ Test template available
- ✅ Mock data factories comprehensive
- ✅ Patterns documented with examples
- ✅ Quick start checklist complete
- ✅ All existing tests still pass

---

**Status:** Ready for Implementation  
**Next Step:** Create test helpers, then start with `imgShape.test.ts`
