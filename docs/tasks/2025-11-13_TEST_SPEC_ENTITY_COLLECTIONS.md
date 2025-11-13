# Test Specification: Entity-Collections

**Components:** ItemList, ItemGallery  
**Test Files:**
- `/tests/unit/clist/itemList.test.ts`
- `/tests/unit/clist/itemGallery.test.ts`

**Status:** 🟡 New Features to Implement  
**Last Updated:** November 13, 2025

---

## Overview

Entity-Collections manage groups of entities and handle:
- Data fetching from API
- Selection state management
- Props propagation to Entity-Components
- Event emission to parents

**Key Responsibility:** Collections determine checkbox visibility and pass it down via options.selectable

---

## Feature B1: Checkbox Visibility Determination

### Design Principle

Collections are responsible for calculating when checkboxes should appear on child Entity-Components.

**Rule:** Checkboxes visible ONLY when both conditions are true:
1. `dataMode=true` (using entity data, not static items)
2. `multiSelect=true` (allowing multiple selections)

### Props Flow

```typescript
// Parent passes to Collection
<ItemList
  entity="events"
  :dataMode="true"
  :multiSelect="true"
  :selectedIds="[1, 2, 3]"
/>

// Collection passes to Component
<ItemRow
  v-for="item in entities"
  :key="item.id"
  :heading="item.title"
  :data="parseImageData(item.img_thumb)"
  :options="{
    selectable: dataMode && multiSelect  // ← Collection calculates this
  }"
  :models="{
    selected: selectedIds.includes(item.id)
  }"
/>
```

### Test Cases

#### TC-B1.9: Collection Enables Selectable for Multi-Select
```typescript
it('should pass selectable=true when dataMode and multiSelect are both true', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true,
      multiSelect: true,
      selectedIds: []
    }
  })

  await flushPromises() // Wait for data fetch

  const itemRow = wrapper.findComponent({ name: 'ItemRow' })
  expect(itemRow.props('options').selectable).toBe(true)
})
```

#### TC-B1.10: Collection Disables Selectable for Single Select
```typescript
it('should pass selectable=false when multiSelect is false', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true,
      multiSelect: false,  // Single selection mode
      selectedIds: 1
    }
  })

  await flushPromises()

  const itemRow = wrapper.findComponent({ name: 'ItemRow' })
  expect(itemRow.props('options').selectable).toBe(false)
})
```

#### TC-B1.11: Collection Disables Selectable When Undefined
```typescript
it('should pass selectable=false when multiSelect is undefined', async () => {
  const wrapper = mount(ItemGallery, {
    props: {
      entity: 'posts',
      dataMode: true,
      // multiSelect not provided (undefined)
      selectedIds: []
    }
  })

  await flushPromises()

  const itemCard = wrapper.findComponent({ name: 'ItemCard' })
  expect(itemCard.props('options').selectable).toBe(false)
})
```

#### TC-B1.12: Collection Disables Selectable in Static Mode
```typescript
it('should pass selectable=false when dataMode is false', async () => {
  const wrapper = mount(ItemList, {
    props: {
      items: [
        { heading: 'Static Item 1' },
        { heading: 'Static Item 2' }
      ],
      dataMode: false,
      multiSelect: true  // Doesn't matter, dataMode is false
    }
  })

  const itemRow = wrapper.findComponent({ name: 'ItemRow' })
  expect(itemRow.props('options')).toBeUndefined() // Or selectable: false
})
```

---

## Selection State Management

### Design Principle

Collections manage selection state internally and emit events to parents for v-model binding.

### Test Cases

#### TC-B1.13: Single Selection Updates Selected ID
```typescript
it('should emit update:selectedIds with single ID when item clicked in single-select mode', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true,
      multiSelect: false,
      selectedIds: null
    }
  })

  await flushPromises()

  const itemRow = wrapper.findComponent({ name: 'ItemRow' })
  await itemRow.trigger('click')

  // Should emit single ID
  expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
  expect(wrapper.emitted('update:selectedIds')[0]).toEqual([1]) // First item ID
})
```

#### TC-B1.14: Multi Selection Toggles ID in Array
```typescript
it('should toggle ID in array when item clicked in multi-select mode', async () => {
  const wrapper = mount(ItemGallery, {
    props: {
      entity: 'posts',
      dataMode: true,
      multiSelect: true,
      selectedIds: [1, 2]
    }
  })

  await flushPromises()

  // Click third item (ID=3)
  const items = wrapper.findAllComponents({ name: 'ItemCard' })
  await items[2].trigger('click')

  // Should add ID to array
  expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
  expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1, 2, 3]])
})
```

#### TC-B1.15: Multi Selection Removes ID from Array
```typescript
it('should remove ID from array when already selected item clicked', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'instructors',
      dataMode: true,
      multiSelect: true,
      selectedIds: [1, 2, 3]
    }
  })

  await flushPromises()

  // Click second item (ID=2, already selected)
  const items = wrapper.findAllComponents({ name: 'ItemRow' })
  await items[1].trigger('click')

  // Should remove ID from array
  expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
  expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1, 3]])
})
```

#### TC-B1.16: Selection Emits XML IDs
```typescript
it('should emit selectedXml event with xmlIDs of selected items', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true,
      multiSelect: true,
      selectedIds: []
    }
  })

  await flushPromises()

  // Select first item
  const itemRow = wrapper.findComponent({ name: 'ItemRow' })
  await itemRow.trigger('click')

  // Should emit xmlID
  expect(wrapper.emitted('selectedXml')).toBeTruthy()
  expect(wrapper.emitted('selectedXml')[0]).toEqual([['tp.event.summer-2024']])
})
```

#### TC-B1.17: Selection Emits Full Entity Data
```typescript
it('should emit selected event with full entity objects', async () => {
  const wrapper = mount(ItemGallery, {
    props: {
      entity: 'posts',
      dataMode: true,
      multiSelect: false,
      selectedIds: null
    }
  })

  await flushPromises()

  // Select first item
  const itemCard = wrapper.findComponent({ name: 'ItemCard' })
  await itemCard.trigger('click')

  // Should emit full entity object
  expect(wrapper.emitted('selected')).toBeTruthy()
  const emittedEntity = wrapper.emitted('selected')[0][0]
  expect(emittedEntity).toHaveProperty('id')
  expect(emittedEntity).toHaveProperty('title')
  expect(emittedEntity).toHaveProperty('xmlID')
})
```

---

## Data Fetching & Filtering

### Test Cases

#### TC-B1.18: Fetch Entity Data on Mount
```typescript
it('should fetch entity data when entity prop is provided', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      { id: 1, title: 'Event 1', xmlID: 'tp.event.event-1' },
      { id: 2, title: 'Event 2', xmlID: 'tp.event.event-2' }
    ]
  })
  global.fetch = mockFetch

  mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true
    }
  })

  await flushPromises()

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/events')
  )
})
```

#### TC-B1.19: Filter by XML Prefix
```typescript
it('should filter items by XML prefix', async () => {
  const wrapper = mount(ItemList, {
    props: {
      entity: 'events',
      dataMode: true,
      filterXmlPrefix: 'tp.event.festival'
    }
  })

  await flushPromises()

  const items = wrapper.findAllComponents({ name: 'ItemRow' })
  
  // All items should have xmlID starting with 'tp.event.festival'
  items.forEach(item => {
    const xmlID = item.props('data')?.xmlID
    expect(xmlID).toMatch(/^tp\.event\.festival/)
  })
})
```

#### TC-B1.20: Filter by Multiple XML Prefixes (OR Logic)
```typescript
it('should filter items by multiple XML prefixes with OR logic', async () => {
  const wrapper = mount(ItemGallery, {
    props: {
      entity: 'posts',
      dataMode: true,
      filterXmlPrefixes: ['tp.post.blog', 'tp.post.news']
    }
  })

  await flushPromises()

  const items = wrapper.findAllComponents({ name: 'ItemCard' })
  
  // Each item should match at least one prefix
  items.forEach(item => {
    const xmlID = item.props('data')?.xmlID
    const matchesAny = 
      xmlID?.startsWith('tp.post.blog') || 
      xmlID?.startsWith('tp.post.news')
    expect(matchesAny).toBe(true)
  })
})
```

---

## Props Validation

### Test Cases

#### TC-B1.21: Error When selectedIds Used Without dataMode
```typescript
it('should show validation error when selectedIds provided without dataMode', () => {
  const wrapper = mount(ItemList, {
    props: {
      items: [{ heading: 'Item 1' }],
      dataMode: false,
      selectedIds: [1]  // ERROR: can't use selectedIds without dataMode
    }
  })

  expect(wrapper.vm.validationError).toBeTruthy()
  expect(wrapper.vm.validationError).toContain('selectedIds requires dataMode=true')
})
```

#### TC-B1.22: Error When Multiple IDs Without Multi-Select
```typescript
it('should show validation error when multiple IDs provided without multiSelect', () => {
  const wrapper = mount(ItemGallery, {
    props: {
      entity: 'events',
      dataMode: true,
      multiSelect: false,
      selectedIds: [1, 2, 3]  // ERROR: multiple IDs but multiSelect=false
    }
  })

  expect(wrapper.vm.validationError).toBeTruthy()
  expect(wrapper.vm.validationError).toContain('Multiple IDs require multiSelect=true')
})
```

---

## Implementation Checklist

### Selection Logic
- [ ] Add `showCheckbox` computed: `dataMode && multiSelect`
- [ ] Pass `options.selectable` to Entity-Components
- [ ] Pass `models.selected` based on selectedIds prop
- [ ] Handle item click events
- [ ] Toggle selection state (single vs multi)
- [ ] Emit `update:selectedIds` event
- [ ] Emit `selectedXml` event with xmlIDs
- [ ] Emit `selected` event with full entities

### Validation
- [ ] Check selectedIds requires dataMode
- [ ] Check multiple IDs require multiSelect
- [ ] Display validation errors
- [ ] Prevent rendering when validation fails

### Data Management
- [ ] Fetch entity data from API
- [ ] Parse image data for ImgShape
- [ ] Filter by filterIds prop
- [ ] Filter by filterXmlPrefix
- [ ] Filter by filterXmlPrefixes (OR logic)
- [ ] Filter by filterXmlPattern (regex)

---

## Success Criteria

- [ ] Checkbox shows only when dataMode=true AND multiSelect=true
- [ ] Selection state managed correctly (single vs multi)
- [ ] All selection events emitted with correct data
- [ ] Validation errors shown for invalid prop combinations
- [ ] Data fetching works for all entity types
- [ ] XML filtering works correctly
- [ ] All test cases pass

---

## Related Documentation

- `/docs/tasks/TEST_SPEC_ENTITY_COMPONENTS.md` - Entity-Component checkbox rendering
- `/docs/tasks/TEST_SPEC_DROPDOWNS.md` - Dropdown trigger display
- `/docs/CLIST_SELECTION_SYSTEM_GUIDE.md` - Selection system overview
- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Testing strategy
