# Test Specification: Page Components

**Components:** pList, pGallery  
**Test Files:**
- `/tests/unit/clist/pList.test.ts`
- `/tests/unit/clist/pGallery.test.ts`

**Status:** 🔵 Integration Testing  
**Last Updated:** November 13, 2025

---

## Overview

Page components provide complete list and gallery views with:
- Built-in ItemList/ItemGallery integration
- Admin controls (add/edit/delete)
- Search and filtering
- Selection management
- Pagination
- Empty states

**Key Responsibility:** Integration testing to ensure all layers work together correctly.

---

## Component Structure

### pList Architecture

```
┌─────────────────────────────────────────────────┐
│ pList                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Header: Title + Search + Add Button        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Filters: XML prefix, tags, etc.            │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ ItemList                                    │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ ItemRow ◯                               │ │ │
│ │ ├─────────────────────────────────────────┤ │ │
│ │ │ ItemRow ☑                               │ │ │
│ │ ├─────────────────────────────────────────┤ │ │
│ │ │ ItemRow ◯                               │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Footer: Pagination + Selection Count       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### pGallery Architecture

```
┌─────────────────────────────────────────────────┐
│ pGallery                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Header: Title + Search + Add Button        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ ItemGallery                                 │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │ │
│ │ │Card◯│ │Card☑│ │Card◯│ │Card◯│        │ │
│ │ └──────┘ └──────┘ └──────┘ └──────┘        │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │ │
│ │ │Card◯│ │Card◯│ │Card☑│ │Card◯│        │ │
│ │ └──────┘ └──────┘ └──────┘ └──────┘        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Footer: Pagination + Selection Count       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Integration Test Cases

### TC-INT-1: Full Stack Avatar Rendering

**Purpose:** Verify avatar option flows correctly from xmlID → Entity-Component → ImgShape

```typescript
it('should render avatar for event entities in pList', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises() // Wait for data fetch

  // Find first ItemRow
  const itemRow = wrapper.findComponent(ItemRow)
  const imgShape = itemRow.findComponent(ImgShape)

  // Verify ItemRow determined avatar option correctly
  expect(itemRow.vm.shouldUseAvatar).toBe(true)
  
  // Verify ImgShape received avatar prop
  expect(imgShape.props('avatar')).toBe(true)
  
  // Verify ImgShape applied avatar-style class
  expect(imgShape.classes()).toContain('avatar-style')
  
  // Verify CSS applied
  const img = imgShape.find('img')
  const style = window.getComputedStyle(img.element)
  expect(style.borderRadius).toBe('50%')
})
```

### TC-INT-2: Full Stack Checkbox Visibility

**Purpose:** Verify checkbox logic flows from pList props → ItemList → ItemRow

```typescript
it('should show checkboxes when multiSelect enabled in pList', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'posts',
      multiSelect: true,
      selectedIds: []
    }
  })

  await flushPromises()

  // Verify ItemList received correct props
  const itemList = wrapper.findComponent(ItemList)
  expect(itemList.props('multiSelect')).toBe(true)
  expect(itemList.props('dataMode')).toBe(true)

  // Verify ItemRow received selectable option
  const itemRow = wrapper.findComponent(ItemRow)
  expect(itemRow.props('options').selectable).toBe(true)

  // Verify checkbox rendered
  const checkbox = itemRow.find('input[type="checkbox"]')
  expect(checkbox.exists()).toBe(true)
})
```

### TC-INT-3: Full Stack Single Selection

**Purpose:** Verify single selection uses secondary highlight without checkbox

```typescript
it('should use secondary highlight for single selection in pGallery', async () => {
  const wrapper = mount(pGallery, {
    props: {
      entity: 'instructors',
      multiSelect: false,
      selectedIds: null
    }
  })

  await flushPromises()

  // Verify ItemGallery received correct props
  const itemGallery = wrapper.findComponent(ItemGallery)
  expect(itemGallery.props('multiSelect')).toBe(false)

  // Verify ItemCard does NOT have checkbox
  const itemCard = wrapper.findComponent(ItemCard)
  expect(itemCard.props('options').selectable).toBe(false)
  expect(itemCard.find('input[type="checkbox"]').exists()).toBe(false)

  // Click to select
  await itemCard.trigger('click')

  // Verify secondary highlight applied
  expect(itemCard.classes()).toContain('selected')
  expect(itemCard.classes()).not.toContain('primary-highlight')
  
  const style = window.getComputedStyle(itemCard.element)
  expect(style.backgroundColor).toBe('var(--color-secondary-bg)')
})
```

### TC-INT-4: ImgShape Dimension Detection in pList

**Purpose:** Verify Issue A1 fix - dimensions detected correctly in full stack

```typescript
it('should detect correct dimensions for thumb shape in pList context', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  const imgShape = wrapper.findComponent(ImgShape)
  
  // Verify ImgShape read dimensions from useTheme()
  expect(imgShape.vm.detectedWidth).toBe(64) // avatarWidth from theme
  expect(imgShape.vm.detectedHeight).toBe(64)
  
  // Verify no "unknown dimension" warning
  expect(console.warn).not.toHaveBeenCalledWith(
    expect.stringContaining('unknown dimension')
  )
})
```

### TC-INT-5: Multi-Select with Checkboxes

**Purpose:** Verify full multi-select flow with primary highlight

```typescript
it('should handle multi-select with checkboxes and primary highlight', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'posts',
      multiSelect: true,
      selectedIds: []
    }
  })

  await flushPromises()

  // Select first item
  const items = wrapper.findAllComponents(ItemRow)
  const checkbox1 = items[0].find('input[type="checkbox"]')
  await checkbox1.setValue(true)

  // Verify selection emitted
  expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
  expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1]])

  // Select second item
  const checkbox2 = items[1].find('input[type="checkbox"]')
  await checkbox2.setValue(true)

  // Verify multiple IDs emitted
  expect(wrapper.emitted('update:selectedIds')[1]).toEqual([[1, 2]])

  // Verify both items have primary highlight
  expect(items[0].classes()).toContain('selected')
  expect(items[1].classes()).toContain('selected')
  
  const style = window.getComputedStyle(items[0].element)
  expect(style.boxShadow).toContain('var(--color-primary-bg)')
})
```

---

## Search & Filtering Integration

### TC-INT-6: Search Filters ItemList

```typescript
it('should filter ItemList when search query entered', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  // Initially shows all items
  let items = wrapper.findAllComponents(ItemRow)
  expect(items.length).toBeGreaterThan(3)

  // Enter search query
  const searchInput = wrapper.find('input[type="search"]')
  await searchInput.setValue('festival')

  // Should filter to matching items only
  items = wrapper.findAllComponents(ItemRow)
  items.forEach(item => {
    const heading = item.props('heading')
    expect(heading.toLowerCase()).toContain('festival')
  })
})
```

### TC-INT-7: XML Prefix Filter

```typescript
it('should filter by XML prefix in pGallery', async () => {
  const wrapper = mount(pGallery, {
    props: {
      entity: 'posts',
      filterXmlPrefix: 'tp.post.blog'
    }
  })

  await flushPromises()

  // All items should have xmlID starting with prefix
  const items = wrapper.findAllComponents(ItemCard)
  items.forEach(item => {
    const xmlID = item.props('data')?.xmlID
    expect(xmlID).toMatch(/^tp\.post\.blog/)
  })
})
```

---

## Admin Operations Integration

### TC-INT-8: Add Button Opens Form

```typescript
it('should open add form when add button clicked', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events',
      adminMode: true
    }
  })

  const addButton = wrapper.find('.add-button')
  await addButton.trigger('click')

  // Should emit add event or show form
  expect(wrapper.emitted('add')).toBeTruthy()
})
```

### TC-INT-9: Delete Selected Items

```typescript
it('should delete selected items when delete button clicked', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'posts',
      adminMode: true,
      multiSelect: true,
      selectedIds: [1, 2, 3]
    }
  })

  const deleteButton = wrapper.find('.delete-selected-button')
  await deleteButton.trigger('click')

  // Should show confirmation
  expect(wrapper.vm.showDeleteConfirm).toBe(true)

  // Confirm deletion
  const confirmButton = wrapper.find('.confirm-delete-button')
  await confirmButton.trigger('click')

  // Should emit delete event
  expect(wrapper.emitted('delete')).toBeTruthy()
  expect(wrapper.emitted('delete')[0]).toEqual([[1, 2, 3]])
})
```

---

## Pagination Integration

### TC-INT-10: Pagination Controls

```typescript
it('should paginate ItemList when page size exceeded', async () => {
  const wrapper = mount(pGallery, {
    props: {
      entity: 'posts',
      pageSize: 12
    }
  })

  await flushPromises()

  // Should show first page of items
  let items = wrapper.findAllComponents(ItemCard)
  expect(items).toHaveLength(12)

  // Should show pagination controls
  const pagination = wrapper.find('.pagination')
  expect(pagination.exists()).toBe(true)

  // Click next page
  const nextButton = pagination.find('.next-page')
  await nextButton.trigger('click')

  // Should show second page
  items = wrapper.findAllComponents(ItemCard)
  expect(items).toHaveLength(12)
  
  // Items should be different
  expect(items[0].props('data').id).toBeGreaterThan(12)
})
```

---

## Empty States

### TC-INT-11: No Results Empty State

```typescript
it('should show empty state when no items match search', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  const searchInput = wrapper.find('input[type="search"]')
  await searchInput.setValue('nonexistent query xyz123')

  const emptyState = wrapper.find('.empty-state')
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.text()).toContain('No events found')
})
```

### TC-INT-12: No Data Empty State

```typescript
it('should show empty state when entity has no data', async () => {
  // Mock empty response
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => []
  })

  const wrapper = mount(pGallery, {
    props: {
      entity: 'posts'
    }
  })

  await flushPromises()

  const emptyState = wrapper.find('.empty-state')
  expect(emptyState.exists()).toBe(true)
  expect(emptyState.text()).toContain('No posts yet')
  
  // Should show add button if admin
  if (wrapper.props('adminMode')) {
    expect(wrapper.find('.empty-state .add-button').exists()).toBe(true)
  }
})
```

---

## Performance Integration

### TC-INT-13: Lazy Loading Images

```typescript
it('should lazy load images in ItemGallery', async () => {
  const wrapper = mount(pGallery, {
    props: {
      entity: 'posts'
    }
  })

  await flushPromises()

  // Get all ImgShape components
  const imgShapes = wrapper.findAllComponents(ImgShape)
  
  // First 12 should have loading="eager"
  imgShapes.slice(0, 12).forEach(img => {
    expect(img.props('loading')).toBe('eager')
  })
  
  // Rest should have loading="lazy"
  imgShapes.slice(12).forEach(img => {
    expect(img.props('loading')).toBe('lazy')
  })
})
```

### TC-INT-14: Virtual Scrolling for Large Lists

```typescript
it('should use virtual scrolling for lists > 100 items', async () => {
  // Mock large dataset
  const largeDataset = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    xmlID: `tp.event.item-${i + 1}`
  }))

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => largeDataset
  })

  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  // Should only render visible items
  const renderedItems = wrapper.findAllComponents(ItemRow)
  expect(renderedItems.length).toBeLessThan(50) // Only render visible viewport

  // Should have virtual scroll container
  const virtualContainer = wrapper.find('.virtual-scroll-container')
  expect(virtualContainer.exists()).toBe(true)
})
```

---

## Error Handling Integration

### TC-INT-15: API Error State

```typescript
it('should show error state when API fetch fails', async () => {
  // Mock failed fetch
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  const errorState = wrapper.find('.error-state')
  expect(errorState.exists()).toBe(true)
  expect(errorState.text()).toContain('Failed to load events')
  
  // Should have retry button
  const retryButton = wrapper.find('.retry-button')
  expect(retryButton.exists()).toBe(true)
})
```

### TC-INT-16: Retry After Error

```typescript
it('should retry fetch when retry button clicked', async () => {
  // Mock initial failure
  const mockFetch = vi.fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, title: 'Event 1' }]
    })
  
  global.fetch = mockFetch

  const wrapper = mount(pGallery, {
    props: {
      entity: 'posts'
    }
  })

  await flushPromises()

  // Should show error
  expect(wrapper.find('.error-state').exists()).toBe(true)

  // Click retry
  const retryButton = wrapper.find('.retry-button')
  await retryButton.trigger('click')
  await flushPromises()

  // Should show data now
  expect(wrapper.find('.error-state').exists()).toBe(false)
  expect(wrapper.findAllComponents(ItemCard).length).toBeGreaterThan(0)
})
```

---

## Accessibility Integration

### TC-INT-17: Keyboard Navigation

```typescript
it('should support keyboard navigation in pList', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'events'
    }
  })

  await flushPromises()

  const items = wrapper.findAllComponents(ItemRow)
  
  // First item should have tabindex="0"
  expect(items[0].attributes('tabindex')).toBe('0')
  
  // Press ArrowDown
  await items[0].trigger('keydown', { key: 'ArrowDown' })
  
  // Second item should receive focus
  expect(document.activeElement).toBe(items[1].element)
})
```

### TC-INT-18: Screen Reader Announcements

```typescript
it('should announce selection changes to screen readers', async () => {
  const wrapper = mount(pList, {
    props: {
      entity: 'posts',
      multiSelect: true
    }
  })

  await flushPromises()

  // Select item
  const checkbox = wrapper.find('input[type="checkbox"]')
  await checkbox.setValue(true)

  // Should update aria-live region
  const announcement = wrapper.find('[aria-live="polite"]')
  expect(announcement.text()).toContain('1 item selected')
})
```

---

## Implementation Checklist

### Core Integration
- [ ] ItemList/ItemGallery integration
- [ ] Props propagation through all layers
- [ ] Event bubbling from components to page
- [ ] Selection state management
- [ ] Data fetching and caching

### Features
- [ ] Search functionality
- [ ] XML prefix filtering
- [ ] Pagination
- [ ] Admin operations (add/edit/delete)
- [ ] Empty states
- [ ] Error states with retry

### Performance
- [ ] Lazy loading images
- [ ] Virtual scrolling for large lists
- [ ] Debounced search
- [ ] Request cancellation on unmount

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] ARIA attributes

---

## Success Criteria

- [ ] All Issues A1, A2 fixed and working in production context
- [ ] All Features B1, B2 implemented and working
- [ ] Avatar option flows correctly through all layers
- [ ] Checkbox visibility determined correctly
- [ ] Selection highlights applied correctly
- [ ] Search and filtering work correctly
- [ ] Pagination works smoothly
- [ ] Error handling graceful
- [ ] Accessible via keyboard
- [ ] All integration tests pass

---

## Related Documentation

- `/docs/tasks/TEST_SPEC_IMGSHAPE.md` - Core image component
- `/docs/tasks/TEST_SPEC_ENTITY_COMPONENTS.md` - Entity-level components
- `/docs/tasks/TEST_SPEC_ENTITY_COLLECTIONS.md` - Collection management
- `/docs/tasks/TEST_SPEC_DROPDOWNS.md` - Dropdown wrappers
- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Overall testing strategy
- `/docs/CLIST_SELECTION_SYSTEM_GUIDE.md` - Selection system design
