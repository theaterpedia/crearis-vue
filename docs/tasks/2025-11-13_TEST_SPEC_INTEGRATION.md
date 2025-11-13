# Test Specification: Integration & E2E Testing

**Focus:** Cross-component integration and end-to-end workflows  
**Test Files:**
- `/tests/integration/clist/avatar-flow.test.ts`
- `/tests/integration/clist/selection-flow.test.ts`
- `/tests/integration/clist/dropdown-flow.test.ts`
- `/tests/e2e/clist-workflows.spec.ts`

**Status:** 🔵 Integration Testing  
**Last Updated:** November 13, 2025

---

## Overview

Integration tests verify that all CList components work together correctly. These tests span multiple layers and validate complete user workflows.

**Testing Pyramid:**
```
        E2E Tests (Browser)
           ↑
    Integration Tests (Vitest)
           ↑
    Component Tests (Vitest)
           ↑
     Unit Tests (Vitest)
```

---

## Test Categories

### 1. Issue Verification (A1, A2)
- Verify Issue A1 (dimension detection) fixed across all contexts
- Verify Issue A2 (avatar option) works in all entity types

### 2. Feature Verification (B1, B2)
- Verify Feature B1 (checkbox logic) works correctly
- Verify Feature B2 (dropdown trigger) displays selections

### 3. Cross-Component Flows
- Data flow from parent to child
- Event bubbling from child to parent
- State synchronization across siblings

### 4. User Workflows
- Complete selection workflow
- Complete admin workflow
- Complete search workflow

---

## Integration Test: Avatar Flow

**File:** `/tests/integration/clist/avatar-flow.test.ts`

### Purpose
Verify avatar option determination flows correctly through all component layers.

### Test Flow Diagram
```
xmlID "tp.event.summer-2024"
  ↓
ItemRow parses entity type = "event"
  ↓
ItemRow determines shouldUseAvatar = true
  ↓
ItemRow passes avatar=true to ImgShape
  ↓
ImgShape applies .avatar-style class
  ↓
CSS renders border-radius: 50%
```

### Complete Test Suite

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import pList from '@/components/pList.vue'
import ItemList from '@/components/ItemList.vue'
import ItemRow from '@/components/ItemRow.vue'
import ImgShape from '@/components/ImgShape.vue'

describe('Avatar Flow Integration', () => {
  beforeEach(() => {
    // Mock API responses
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              title: 'Summer Festival',
              xmlID: 'tp.event.summer-festival',
              img_thumb: { url: 'event-1.jpg' }
            }
          ]
        })
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              title: 'Project Alpha',
              xmlID: 'tp.project.alpha',
              img_thumb: { url: 'project-1.jpg' }
            }
          ]
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('should apply avatar for event entities through entire stack', async () => {
    // Mount top-level component
    const wrapper = mount(pList, {
      props: { entity: 'events' }
    })

    await flushPromises()

    // Traverse component tree
    const itemList = wrapper.findComponent(ItemList)
    const itemRow = itemList.findComponent(ItemRow)
    const imgShape = itemRow.findComponent(ImgShape)

    // Verify data passed down correctly
    expect(itemRow.props('data')).toMatchObject({
      xmlID: 'tp.event.summer-festival'
    })

    // Verify ItemRow determined avatar option
    expect(itemRow.vm.shouldUseAvatar).toBe(true)

    // Verify ImgShape received avatar prop
    expect(imgShape.props('avatar')).toBe(true)

    // Verify CSS applied
    expect(imgShape.classes()).toContain('avatar-style')
    
    const img = imgShape.find('img')
    const style = window.getComputedStyle(img.element)
    expect(style.borderRadius).toBe('50%')
  })

  it('should NOT apply avatar for project entities', async () => {
    const wrapper = mount(pList, {
      props: { entity: 'projects' }
    })

    await flushPromises()

    const itemRow = wrapper.findComponent(ItemRow)
    const imgShape = itemRow.findComponent(ImgShape)

    // Projects are not avatar-eligible
    expect(itemRow.vm.shouldUseAvatar).toBe(false)
    expect(imgShape.props('avatar')).toBe(false)
    expect(imgShape.classes()).not.toContain('avatar-style')
  })

  it('should apply avatar for instructors in ItemTile', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: 'John Doe',
          xmlID: 'tp.instructor.john-doe',
          img_thumb: { url: 'john.jpg' }
        }
      ]
    })

    const wrapper = mount(pGallery, {
      props: { entity: 'instructors' }
    })

    await flushPromises()

    const itemTile = wrapper.findComponent(ItemTile)
    const imgShape = itemTile.findComponent(ImgShape)

    expect(itemTile.vm.shouldUseAvatar).toBe(true)
    expect(imgShape.props('avatar')).toBe(true)
  })

  it('should apply avatar for posts in ItemCard', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: 'Blog Post',
          xmlID: 'tp.post.my-blog',
          img_card: { url: 'post.jpg' }
        }
      ]
    })

    const wrapper = mount(pGallery, {
      props: { entity: 'posts' }
    })

    await flushPromises()

    const itemCard = wrapper.findComponent(ItemCard)
    const imgShape = itemCard.findComponent(ImgShape)

    expect(itemCard.vm.shouldUseAvatar).toBe(true)
    expect(imgShape.props('avatar')).toBe(true)
  })
})
```

---

## Integration Test: Selection Flow

**File:** `/tests/integration/clist/selection-flow.test.ts`

### Purpose
Verify checkbox visibility and selection highlighting works through all layers.

### Test Flow Diagram

**Multi-Select Mode:**
```
pList multiSelect=true
  ↓
ItemList options.selectable=true
  ↓
ItemRow renders checkbox
  ↓
Checkbox click → emit update:selectedIds
  ↓
ItemRow applies primary highlight
```

**Single-Select Mode:**
```
pList multiSelect=false
  ↓
ItemList options.selectable=false
  ↓
ItemRow NO checkbox
  ↓
Row click → emit update:selectedIds
  ↓
ItemRow applies secondary highlight
```

### Complete Test Suite

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import pList from '@/components/pList.vue'
import pGallery from '@/components/pGallery.vue'

describe('Selection Flow Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, title: 'Item 1', xmlID: 'tp.event.item-1' },
        { id: 2, title: 'Item 2', xmlID: 'tp.event.item-2' },
        { id: 3, title: 'Item 3', xmlID: 'tp.event.item-3' }
      ]
    })
  })

  describe('Multi-Select Mode', () => {
    it('should show checkboxes when multiSelect=true', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: true,
          selectedIds: []
        }
      })

      await flushPromises()

      // Verify checkboxes exist
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(3)
    })

    it('should toggle selection on checkbox click', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: true,
          selectedIds: []
        }
      })

      await flushPromises()

      // Click first checkbox
      const checkbox = wrapper.find('input[type="checkbox"]')
      await checkbox.setValue(true)

      // Should emit single ID
      expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
      expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1]])
    })

    it('should accumulate multiple selections', async () => {
      const wrapper = mount(pGallery, {
        props: {
          entity: 'posts',
          multiSelect: true,
          selectedIds: []
        }
      })

      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      
      // Select first and second
      await checkboxes[0].setValue(true)
      await checkboxes[1].setValue(true)

      const emissions = wrapper.emitted('update:selectedIds')
      expect(emissions[emissions.length - 1]).toEqual([[1, 2]])
    })

    it('should apply primary highlight to selected items', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: true,
          selectedIds: [1]
        }
      })

      await flushPromises()

      const items = wrapper.findAllComponents(ItemRow)
      const selectedItem = items[0]

      expect(selectedItem.classes()).toContain('selected')
      
      const style = window.getComputedStyle(selectedItem.element)
      expect(style.boxShadow).toContain('var(--color-primary-bg)')
    })
  })

  describe('Single-Select Mode', () => {
    it('should NOT show checkboxes when multiSelect=false', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: false,
          selectedIds: null
        }
      })

      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('should select on row click', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: false,
          selectedIds: null
        }
      })

      await flushPromises()

      const itemRow = wrapper.findComponent(ItemRow)
      await itemRow.trigger('click')

      expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
      expect(wrapper.emitted('update:selectedIds')[0]).toEqual([1])
    })

    it('should apply secondary highlight to selected item', async () => {
      const wrapper = mount(pGallery, {
        props: {
          entity: 'posts',
          multiSelect: false,
          selectedIds: 1
        }
      })

      await flushPromises()

      const items = wrapper.findAllComponents(ItemCard)
      const selectedItem = items[0]

      expect(selectedItem.classes()).toContain('selected')
      
      const style = window.getComputedStyle(selectedItem.element)
      expect(style.backgroundColor).toBe('var(--color-secondary-bg)')
      expect(style.color).toBe('var(--color-secondary-contrast)')
    })

    it('should replace selection when different item clicked', async () => {
      const wrapper = mount(pList, {
        props: {
          entity: 'events',
          multiSelect: false,
          selectedIds: 1
        }
      })

      await flushPromises()

      // Click second item
      const items = wrapper.findAllComponents(ItemRow)
      await items[1].trigger('click')

      // Should emit new ID (not array)
      const emissions = wrapper.emitted('update:selectedIds')
      expect(emissions[emissions.length - 1]).toEqual([2])
    })
  })

  describe('Static Mode (No Selection)', () => {
    it('should NOT show checkboxes in static mode', async () => {
      const wrapper = mount(pList, {
        props: {
          items: [
            { heading: 'Static 1' },
            { heading: 'Static 2' }
          ],
          dataMode: false
        }
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('should not emit selection events in static mode', async () => {
      const wrapper = mount(pList, {
        props: {
          items: [{ heading: 'Static 1' }],
          dataMode: false
        }
      })

      const itemRow = wrapper.findComponent(ItemRow)
      await itemRow.trigger('click')

      expect(wrapper.emitted('update:selectedIds')).toBeFalsy()
    })
  })
})
```

---

## Integration Test: Dropdown Flow

**File:** `/tests/integration/clist/dropdown-flow.test.ts`

### Purpose
Verify Feature B2 - dropdown trigger displays selected entities correctly.

### Complete Test Suite

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DropdownList from '@/components/DropdownList.vue'
import DropdownGallery from '@/components/DropdownGallery.vue'

describe('Dropdown Flow Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, title: 'Event 1', xmlID: 'tp.event.event-1', img_thumb: { url: '1.jpg' } },
        { id: 2, title: 'Event 2', xmlID: 'tp.event.event-2', img_thumb: { url: '2.jpg' } },
        { id: 3, title: 'Event 3', xmlID: 'tp.event.event-3', img_thumb: { url: '3.jpg' } }
      ]
    })
  })

  it('should show placeholder when nothing selected', () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        placeholder: 'Select events...',
        selectedIds: []
      }
    })

    const trigger = wrapper.find('.dropdown-trigger')
    expect(trigger.text()).toContain('Select events...')
  })

  it('should show avatar and title for single selection', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        selectedIds: [1]
      }
    })

    await flushPromises()

    const trigger = wrapper.find('.dropdown-trigger')
    
    // Should have avatar
    const avatar = trigger.findComponent(ImgShape)
    expect(avatar.exists()).toBe(true)
    expect(avatar.props('shape')).toBe('thumb')
    expect(avatar.props('size')).toBe(32)
    
    // Should have title
    expect(trigger.text()).toContain('Event 1')
  })

  it('should show stacked avatars for multiple selections', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        selectedIds: [1, 2, 3]
      }
    })

    await flushPromises()

    const trigger = wrapper.find('.dropdown-trigger')
    const avatars = trigger.findAll('.stacked-avatar')
    
    expect(avatars).toHaveLength(3)
    expect(trigger.text()).toContain('3 events selected')
  })

  it('should open dropdown on trigger click', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events'
      }
    })

    const trigger = wrapper.find('.dropdown-trigger')
    await trigger.trigger('click')

    const panel = wrapper.find('.dropdown-panel')
    expect(panel.isVisible()).toBe(true)
  })

  it('should update trigger when selection changes in dropdown', async () => {
    const wrapper = mount(DropdownList, {
      props: {
        entity: 'events',
        selectedIds: []
      }
    })

    // Open dropdown
    await wrapper.find('.dropdown-trigger').trigger('click')
    await flushPromises()

    // Select item in ItemList
    const itemRow = wrapper.findComponent(ItemRow)
    await itemRow.trigger('click')

    // Trigger should update
    const trigger = wrapper.find('.dropdown-trigger')
    expect(trigger.findComponent(ImgShape).exists()).toBe(true)
  })
})
```

---

## E2E Test: Complete Workflows

**File:** `/tests/e2e/clist-workflows.spec.ts`

Uses Playwright for browser testing.

### Test Suite

```typescript
import { test, expect } from '@playwright/test'

test.describe('CList Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/events')
  })

  test('Complete Selection Workflow', async ({ page }) => {
    // 1. Page loads with events list
    await expect(page.locator('.item-row')).toHaveCount(10)

    // 2. Click "Select Multiple" button
    await page.click('button:has-text("Select Multiple")')

    // 3. Checkboxes appear
    await expect(page.locator('input[type="checkbox"]')).toBeVisible()

    // 4. Select 3 items
    await page.click('input[type="checkbox"]', { nth: 0 })
    await page.click('input[type="checkbox"]', { nth: 1 })
    await page.click('input[type="checkbox"]', { nth: 2 })

    // 5. Selection count updates
    await expect(page.locator('.selection-count')).toHaveText('3 selected')

    // 6. Delete button appears
    await expect(page.locator('button:has-text("Delete")')).toBeEnabled()

    // 7. Click delete
    await page.click('button:has-text("Delete")')

    // 8. Confirmation dialog
    await expect(page.locator('.confirmation-dialog')).toBeVisible()

    // 9. Confirm
    await page.click('button:has-text("Confirm")')

    // 10. Items removed
    await expect(page.locator('.item-row')).toHaveCount(7)
  })

  test('Avatar Display Workflow', async ({ page }) => {
    // 1. Navigate to instructors
    await page.goto('/admin/instructors')

    // 2. All instructor avatars should be circular
    const avatars = page.locator('.avatar-style')
    await expect(avatars).toHaveCount(await page.locator('.item-row').count())

    // 3. Check computed style
    const firstAvatar = avatars.first()
    const borderRadius = await firstAvatar.evaluate(el => 
      window.getComputedStyle(el).borderRadius
    )
    expect(borderRadius).toBe('50%')
  })

  test('Dropdown Selection Workflow', async ({ page }) => {
    await page.goto('/forms/event-form')

    // 1. Open instructor dropdown
    await page.click('.instructor-dropdown .dropdown-trigger')

    // 2. Dropdown opens with gallery
    await expect(page.locator('.dropdown-panel')).toBeVisible()
    await expect(page.locator('.item-tile')).toHaveCount(5)

    // 3. Select instructor
    await page.click('.item-tile:first-child')

    // 4. Dropdown closes
    await expect(page.locator('.dropdown-panel')).not.toBeVisible()

    // 5. Trigger shows selected instructor
    const trigger = page.locator('.instructor-dropdown .dropdown-trigger')
    await expect(trigger.locator('img')).toBeVisible()
    await expect(trigger).toContainText('John Doe')

    // 6. Form submission includes selected ID
    await page.click('button[type="submit"]')
    
    // Verify API call
    const request = await page.waitForRequest(req => 
      req.url().includes('/api/events') && req.method() === 'POST'
    )
    const postData = JSON.parse(request.postData())
    expect(postData.instructor_id).toBe(1)
  })

  test('Search and Filter Workflow', async ({ page }) => {
    await page.goto('/events')

    // 1. Initial count
    await expect(page.locator('.item-card')).toHaveCount(12)

    // 2. Enter search query
    await page.fill('input[type="search"]', 'festival')

    // 3. Results filtered
    await expect(page.locator('.item-card')).toHaveCount(3)

    // 4. All results match search
    const cards = page.locator('.item-card')
    for (let i = 0; i < await cards.count(); i++) {
      const text = await cards.nth(i).textContent()
      expect(text.toLowerCase()).toContain('festival')
    }

    // 5. Clear search
    await page.fill('input[type="search"]', '')

    // 6. All results shown again
    await expect(page.locator('.item-card')).toHaveCount(12)
  })
})
```

---

## Success Criteria

### Issue Fixes Verified
- [ ] Issue A1: ImgShape detects dimensions correctly in all contexts
- [ ] Issue A2: Avatar option works for event/instructor/post entities
- [ ] No console warnings about unknown dimensions
- [ ] Avatar borders render as 50% border-radius

### Feature Implementation Verified
- [ ] Feature B1: Checkboxes show only in multi-select mode
- [ ] Feature B1: Secondary highlight works in single-select mode
- [ ] Feature B2: Dropdown trigger shows selected entity
- [ ] Feature B2: Stacked avatars work correctly

### Integration Tests Pass
- [ ] Avatar flow test passes
- [ ] Selection flow test passes
- [ ] Dropdown flow test passes
- [ ] All unit tests pass
- [ ] All component tests pass

### E2E Tests Pass
- [ ] Complete selection workflow works
- [ ] Avatar display workflow works
- [ ] Dropdown selection workflow works
- [ ] Search and filter workflow works

### Production Readiness
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests passing in CI/CD
- [ ] Performance benchmarks met
- [ ] Accessibility tests pass

---

## Related Documentation

- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Testing strategy overview
- `/docs/tasks/TEST_SPEC_IMGSHAPE.md` - ImgShape unit tests
- `/docs/tasks/TEST_SPEC_ENTITY_COMPONENTS.md` - Component tests
- `/docs/tasks/TEST_SPEC_ENTITY_COLLECTIONS.md` - Collection tests
- `/docs/tasks/TEST_SPEC_DROPDOWNS.md` - Dropdown tests
- `/docs/tasks/TEST_SPEC_PAGE_COMPONENTS.md` - Page component tests
