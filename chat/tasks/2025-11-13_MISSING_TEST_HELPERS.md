# Missing Test Helpers - Implementation Plan

**Created:** November 13, 2025  
**Updated:** November 13, 2025  
**Purpose:** Define and prioritize test helpers needed for CList component testing  
**Related:** `/docs/tasks/2025-11-13_VITEST_INFRASTRUCTURE_GUIDE.md`

---

## 📊 Current Implementation Status

### ✅ Completed Today (November 13, 2025)
- **Component Testing:** 229/229 tests passing (100%)
- **Bug Fixes:** 3 critical issues resolved (ImgShape shape compatibility, horizontal scrollbar, width overflow)
- **Test Infrastructure:** Wrapper-Control-Validation tests created (20/20 passing)
- **Architectural Pattern:** Option A (wrapper-controlled layout) implemented and validated

### 🔴 Priority 1 Helpers: READY TO IMPLEMENT
These helpers are needed to expand test coverage beyond the current 229 tests:
1. **clist-test-data.ts** - Mock data factory (blocks all new CList tests)
2. **fetch-mock.ts** - API mocking (blocks collection component tests)

### 🟡 Priority 2 Helpers: DEFERRED
These will improve efficiency after Priority 1 is complete:
3. **mount-helpers.ts** - Reduce boilerplate
4. **selection-helpers.ts** - Simplify selection testing

---

## 🎯 Overview

Analysis of existing test infrastructure and CList test specifications reveals 4 critical helper modules needed for efficient test automation.

---

## ✅ Existing Test Helpers (Keep Using)

**Location:** `/tests/utils/test-helpers.ts`

1. **CSS Variable Mocking**
   - `STANDARD_DIMENSIONS` - Constant dimension values
   - `mockCSSVariables(variables)` - Inject CSS vars into DOM
   - `setupCSSVariableMocks()` - Quick setup with standards
   - `setWrapperDimensions(wrapper, dimensions)` - Apply inline styles

2. **Theme Composable Mocking**
   - `mockUseTheme()` - Returns mocked theme composable
   - `setMockThemeDimensions(dims)` - Mutate theme dimensions
   - `resetMockThemeDimensions()` - Reset to defaults

3. **Cleanup Utilities**
   - All functions return cleanup functions
   - Follow consistent cleanup pattern

**Status:** ✅ Comprehensive and battle-tested

---

## 🆕 Required Test Helpers (To Create)

### Priority 1: CRITICAL (Block testing)

#### 1. Mock Data Factory
**File:** `/tests/utils/clist-test-data.ts`  
**Priority:** 🔴 CRITICAL  
**Blocks:** All CList tests  
**Estimated Effort:** 1-2 hours

**Purpose:**
Generate consistent, realistic mock data for CList entities.

**Required Functions:**

```typescript
// Entity Factories
export function createMockEvent(overrides?: Partial<MockEntityData>): MockEntityData
export function createMockInstructor(overrides?: Partial<MockEntityData>): MockEntityData
export function createMockPost(overrides?: Partial<MockEntityData>): MockEntityData
export function createMockProject(overrides?: Partial<MockEntityData>): MockEntityData
export function createMockUser(overrides?: Partial<MockEntityData>): MockEntityData

// Image Data Factories
export function createMockImageData(
  shape: 'thumb' | 'square' | 'wide' | 'vertical',
  overrides?: Partial<ImgShapeData>
): ImgShapeData

// Batch Factories
export function createMockEvents(count: number): MockEntityData[]
export function createMockInstructors(count: number): MockEntityData[]
export function createMockPosts(count: number): MockEntityData[]

// Random Data Generators
export function randomEntityType(): EntityType
export function randomShape(): 'thumb' | 'square' | 'wide' | 'vertical'
export function randomXmlID(type: EntityType, slug?: string): string
```

**TypeScript Interfaces:**
```typescript
export interface MockEntityData {
  id: number
  title: string
  xmlID: string
  img_thumb?: ImgShapeData
  img_square?: ImgShapeData
  img_wide?: ImgShapeData
  img_vertical?: ImgShapeData
  // Entity-specific fields
  date_start?: string
  date_end?: string
  location?: string
  instructor_id?: number
  project_id?: number
}

export interface ImgShapeData {
  type: 'url' | 'cloudinary' | 'vimeo'
  url: string | null
  blur: string | null
  turl: string | null
  tpar: string | null
  x: number | null
  y: number | null
  z: number | null
}
```

**Implementation Notes:**
- Match database schema exactly
- Use realistic data (names, URLs, dates)
- Support partial overrides for flexibility
- Default to valid data (tests explicitly test invalid data)
- Include blurhash strings for realism
- Support all entity types (event, instructor, post, project, user)

**Test Data Characteristics:**
```typescript
// Good defaults
createMockEvent() → {
  id: 1,
  title: 'Summer Festival 2024',
  xmlID: 'tp.event.summer-festival-2024',
  date_start: '2024-06-15',
  date_end: '2024-06-18',
  img_thumb: { type: 'url', url: 'https://...', blur: 'LEHV6n...' }
}

// Easy overrides
createMockEvent({ 
  title: 'Custom Event',
  img_thumb: null // Test missing image
})
```

---

#### 2. Fetch Mock Helper
**File:** `/tests/utils/fetch-mock.ts`  
**Priority:** 🔴 CRITICAL  
**Blocks:** Collection components (ItemList, ItemGallery)  
**Estimated Effort:** 45-60 minutes

**Purpose:**
Simplify mocking of fetch API for data-driven components.

**Required Functions:**

```typescript
// Basic Mocking
export function mockFetchSuccess(data: any): void
export function mockFetchError(message: string, status?: number): void

// Endpoint-Specific Mocking
export function mockFetchWithEndpoints(endpointMap: Record<string, any>): void

// Entity API Mocking
export function mockEntityAPI(entity: string, data: MockEntityData[]): void
export function mockEntityAPIError(entity: string, message: string): void

// Verification Helpers
export function expectFetchCalledWith(endpoint: string): void
export function expectFetchCalledTimes(times: number): void
export function getFetchCalls(): Array<[string, RequestInit?]>

// Response Builders
export function buildSuccessResponse(data: any): Response
export function buildErrorResponse(message: string, status: number): Response
```

**Implementation Notes:**
- Use Vitest's `vi.fn()` for mocking
- Support both JSON and text responses
- Handle common HTTP status codes (200, 404, 500)
- Provide easy verification helpers
- Support conditional responses based on URL

**Usage Example:**
```typescript
import { mockFetchSuccess, expectFetchCalledWith } from '../../utils/fetch-mock'
import { createMockEvents } from '../../utils/clist-test-data'

describe('ItemList', () => {
  it('should fetch events', async () => {
    const events = createMockEvents(5)
    mockFetchSuccess(events)
    
    const wrapper = mount(ItemList, {
      props: { entity: 'events', dataMode: true }
    })
    
    await flushPromises()
    
    expectFetchCalledWith('/api/entities/events')
    expect(wrapper.findAll('.item-row')).toHaveLength(5)
  })
})
```

---

### Priority 2: HIGH (Improve efficiency)

#### 3. Component Mounting Helper
**File:** `/tests/utils/mount-helpers.ts`  
**Priority:** 🟡 HIGH  
**Blocks:** Nothing (nice-to-have)  
**Estimated Effort:** 30-45 minutes

**Purpose:**
Reduce boilerplate in test files by combining common setup steps.

**Required Functions:**

```typescript
// Generic Mounting with CSS
export function mountWithCSS(
  component: Component,
  options?: MountOptions
): { wrapper: VueWrapper; cleanup: () => void }

// CList-Specific Mounting
export function mountCListComponent(
  component: Component,
  options?: MountOptions
): { wrapper: VueWrapper; cleanup: () => void }

// Collection Component Mounting (with mocked fetch)
export function mountCollectionComponent(
  component: Component,
  mockData: MockEntityData[],
  options?: MountOptions
): { wrapper: VueWrapper; cleanup: () => void }
```

**TypeScript Interfaces:**
```typescript
export interface MountOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: {
    stubs?: Record<string, any>
    mocks?: Record<string, any>
    provide?: Record<string, any>
  }
  attachTo?: Element
}
```

**Implementation Notes:**
- Automatically call `setupCSSVariableMocks()`
- Return cleanup function for consistent afterEach
- Support common stubs (ImgShape, router, etc.)
- Merge user options with defaults

**Usage Example:**
```typescript
import { mountCListComponent } from '../../utils/mount-helpers'

describe('ItemRow', () => {
  let cleanup: (() => void) | null = null

  afterEach(() => {
    if (cleanup) cleanup()
  })

  it('should render', () => {
    const { wrapper, cleanup: cleanupFn } = mountCListComponent(ItemRow, {
      props: { heading: 'Test' }
    })
    cleanup = cleanupFn

    expect(wrapper.exists()).toBe(true)
  })
})
```

---

#### 4. Selection State Helper
**File:** `/tests/utils/selection-helpers.ts`  
**Priority:** 🟡 HIGH  
**Blocks:** Selection tests  
**Estimated Effort:** 1 hour

**Purpose:**
Simplify testing of selection behavior across CList components.

**Required Functions:**

```typescript
// Selection Actions
export async function selectItem(wrapper: VueWrapper, index: number): Promise<void>
export async function selectItems(wrapper: VueWrapper, indices: number[]): Promise<void>
export async function deselectItem(wrapper: VueWrapper, index: number): Promise<void>
export async function toggleSelection(wrapper: VueWrapper, index: number): Promise<void>
export async function selectAll(wrapper: VueWrapper): Promise<void>
export async function deselectAll(wrapper: VueWrapper): Promise<void>

// Selection State Queries
export function isItemSelected(wrapper: VueWrapper, index: number): boolean
export function getSelectedItems(wrapper: VueWrapper): VueWrapper[]
export function getSelectedCount(wrapper: VueWrapper): number
export function getSelectedIds(wrapper: VueWrapper): number[]

// Event Verification
export function expectItemSelected(wrapper: VueWrapper, index: number): void
export function expectItemNotSelected(wrapper: VueWrapper, index: number): void
export function expectSelectionEmitted(wrapper: VueWrapper, expectedIds: number[]): void

// Visual Verification
export function expectPrimaryHighlight(wrapper: VueWrapper): void
export function expectSecondaryHighlight(wrapper: VueWrapper): void
export function expectNoHighlight(wrapper: VueWrapper): void
```

**Implementation Notes:**
- Work with row, tile, and card layouts
- Handle both checkbox and click selection
- Verify visual highlights (primary/secondary)
- Support event emission verification
- Handle edge cases (index out of bounds)

**Usage Example:**
```typescript
import { selectItem, isItemSelected, expectSelectionEmitted } from '../../utils/selection-helpers'

describe('Selection', () => {
  it('should select item on click', async () => {
    const wrapper = mount(ItemList, { /* ... */ })
    
    await selectItem(wrapper, 0)
    
    expect(isItemSelected(wrapper, 0)).toBe(true)
    expectSelectionEmitted(wrapper, [1]) // ID = 1
  })
})
```

---

### Priority 3: NICE-TO-HAVE (Future enhancement)

#### 5. Dropdown Helper
**File:** `/tests/utils/dropdown-helpers.ts`  
**Priority:** 🟢 NICE-TO-HAVE  
**Blocks:** Dropdown tests  
**Estimated Effort:** 1 hour

**Purpose:**
Test dropdown open/close behavior and selection propagation.

**Required Functions:**
```typescript
export async function openDropdown(wrapper: VueWrapper): Promise<void>
export async function closeDropdown(wrapper: VueWrapper): Promise<void>
export function isDropdownOpen(wrapper: VueWrapper): boolean
export function getDropdownItems(wrapper: VueWrapper): VueWrapper[]
export async function selectDropdownItem(wrapper: VueWrapper, index: number): Promise<void>
```

---

#### 6. Keyboard Navigation Helper
**File:** `/tests/utils/keyboard-helpers.ts`  
**Priority:** 🟢 NICE-TO-HAVE  
**Blocks:** Accessibility tests  
**Estimated Effort:** 1.5 hours

**Purpose:**
Test keyboard navigation (arrow keys, Enter, Space, Tab).

**Required Functions:**
```typescript
export async function pressKey(wrapper: VueWrapper, key: string): Promise<void>
export async function arrowDown(wrapper: VueWrapper): Promise<void>
export async function arrowUp(wrapper: VueWrapper): Promise<void>
export async function pressEnter(wrapper: VueWrapper): Promise<void>
export async function pressSpace(wrapper: VueWrapper): Promise<void>
export async function pressTab(wrapper: VueWrapper): Promise<void>
export function getFocusedElement(wrapper: VueWrapper): VueWrapper | null
export function expectElementFocused(wrapper: VueWrapper, selector: string): void
```

---

## 📊 Implementation Priority Matrix

| Helper | Priority | Effort | Impact | Order |
|--------|----------|--------|--------|-------|
| **clist-test-data.ts** | 🔴 CRITICAL | 2h | ⭐⭐⭐⭐⭐ | **1st** |
| **fetch-mock.ts** | 🔴 CRITICAL | 1h | ⭐⭐⭐⭐⭐ | **2nd** |
| **mount-helpers.ts** | 🟡 HIGH | 45m | ⭐⭐⭐⭐ | **3rd** |
| **selection-helpers.ts** | 🟡 HIGH | 1h | ⭐⭐⭐⭐ | **4th** |
| dropdown-helpers.ts | 🟢 LOW | 1h | ⭐⭐ | 5th |
| keyboard-helpers.ts | 🟢 LOW | 1.5h | ⭐⭐ | 6th |

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Priority 1)
**Goal:** Enable basic testing
**Time:** 3 hours
**Deliverables:**
1. Create `clist-test-data.ts`
2. Create `fetch-mock.ts`
3. Validate with one test file (imgShape.test.ts)

### Phase 2: Efficiency (Priority 2)
**Goal:** Reduce boilerplate
**Time:** 2 hours
**Deliverables:**
1. Create `mount-helpers.ts`
2. Create `selection-helpers.ts`
3. Refactor imgShape.test.ts to use new helpers

### Phase 3: Enhancement (Priority 3)
**Goal:** Complete test coverage
**Time:** 2.5 hours
**Deliverables:**
1. Create `dropdown-helpers.ts`
2. Create `keyboard-helpers.ts`
3. Add accessibility tests

---

## ✅ Acceptance Criteria

### For Each Helper Module:
- [ ] TypeScript file created in `/tests/utils/`
- [ ] All functions exported with JSDoc comments
- [ ] TypeScript interfaces defined
- [ ] At least one usage example in file
- [ ] Validated with actual test file
- [ ] No dependencies on components (pure utilities)

### For Test Data Factory:
- [ ] Supports all entity types (event, instructor, post, project, user)
- [ ] Includes realistic default data
- [ ] Supports partial overrides
- [ ] Includes image data for all shapes
- [ ] Batch generation functions work correctly

### For Fetch Mock:
- [ ] Works with Vitest's vi.fn()
- [ ] Handles success and error cases
- [ ] Supports multiple endpoints
- [ ] Verification helpers work correctly

### For Mount Helper:
- [ ] Automatically sets up CSS variables
- [ ] Returns cleanup function
- [ ] Merges user options with defaults
- [ ] Works with all CList components

### For Selection Helper:
- [ ] Works with row, tile, card layouts
- [ ] Handles checkbox and click selection
- [ ] Verifies visual highlights
- [ ] Verifies event emissions

---

## 📝 Code Automation Instructions

### Step 1: Create Mock Data Factory
```bash
# Create file
touch tests/utils/clist-test-data.ts

# Add imports
# Add interfaces
# Add factory functions
# Add batch generators
# Add random generators
# Export all functions
```

### Step 2: Create Fetch Mock
```bash
# Create file
touch tests/utils/fetch-mock.ts

# Add vi import
# Add basic mock functions
# Add endpoint mapping
# Add verification helpers
# Export all functions
```

### Step 3: Create Mount Helper
```bash
# Create file
touch tests/utils/mount-helpers.ts

# Import existing helpers
# Add mount functions
# Add CList-specific mounting
# Export all functions
```

### Step 4: Create Selection Helper
```bash
# Create file
touch tests/utils/selection-helpers.ts

# Import wrapper types
# Add selection action functions
# Add query functions
# Add verification functions
# Export all functions
```

### Step 5: Validate
```bash
# Create test file using new helpers
touch tests/unit/clist/imgShape.test.ts

# Import helpers
# Write tests using helpers
# Run tests
pnpm test:unit tests/unit/clist/imgShape.test.ts

# Verify all pass
# Refine helpers if needed
```

---

## 🎯 Success Metrics

- ✅ All 4 critical helpers created
- ✅ At least 1 test file using all helpers
- ✅ All tests pass
- ✅ Code coverage > 80%
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Documentation complete

---

**Status:** Ready for Implementation  
**Next Step:** Create `clist-test-data.ts` (Priority 1)  
**Estimated Total Time:** 5-7 hours
