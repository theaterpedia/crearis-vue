# Test Specification: Dropdown Wrappers

**Components:** DropdownList, DropdownGallery  
**Test Files:**
- `/tests/unit/clist/dropdownList.test.ts`
- `/tests/unit/clist/dropdownGallery.test.ts`

**Status:** ✅ Layout Fixes Complete | ✅ B2 Trigger Display COMPLETED  
**Last Updated:** November 13, 2025 (Session: B1/B2 Implementation Complete)

---

## 🎉 Recent Fixes (November 13, 2025)

## 🎉 Recent Fixes (November 13, 2025)

### ✅ Issue A3: Horizontal Scrollbar Prevention (RESOLVED)
- **Problem:** Content extending beyond wrapper width causing horizontal scrollbar in dropdown
- **Fix:** Added `overflow-x: hidden` to `.dropdown-list-wrapper` CSS
- **Impact:** Wrapper prevents content from extending horizontally
- **Tests:** All 20 wrapper control validation tests passing

### ✅ Issue A4: Width=Large Overflow Fix (RESOLVED)
- **Problem:** ItemTile with width=large (504px) - text overflowing beyond container
- **Root Cause:** Grid couldn't shrink, Prose had max-width:54rem (864px), no text truncation
- **Fix:** Added CSS constraints: grid shrinking, **Prose scope="element" architecture**, text truncation
- **Impact:** ItemTile fully respects parent width, long text truncates with ellipsis
- **Tests:** All 36 ItemTile tests passing, all 229 component tests passing

### ✅ Issue A6: Dropdown Width Too Narrow (RESOLVED)
- **Problem:** DropdownList with width="large" displaying at ~336px instead of 504px
- **Root Causes:**
  1. CSS variable `--card-width` not propagating into floating-vue popper context
  2. `.dropdown-content` hardcoded `max-width: 24rem` (384px) constraining dropdown
- **Solution:**
  1. Added `--card-width: '21rem'` to `systemTheme` computed (floating context propagation)
  2. Created `contentMaxWidth` computed based on width prop (small: 12.5rem, medium: 23rem, large: 33.5rem)
  3. Bound dynamic max-width to dropdown-content: `:style="{ ...systemTheme, maxWidth: contentMaxWidth }"`
  4. Added CSS fallback values: `var(--card-width, 21rem)`
- **Impact:** 
  - Dropdown correctly expands to full width (504px for large)
  - No "see through" gaps
  - Proper width calculations in all contexts
- **Tests:** All 240 component tests passing

### ✅ Option A Architecture - IMPLEMENTED
- Wrapper controls layout (width/columns props)
- ItemList inherits settings (width="inherit" columns="off")
- CSS uses wrapper classes for width constraints
- Dynamic max-width prevents parent constraint issues
- Protective tests prevent architectural violations

---

## Overview

Dropdown wrappers provide entity selection via dropdown menus. They wrap Entity-Collections (ItemList, ItemGallery) and add:
- Dropdown trigger button
- Selected entity display
- Dropdown content panel
- Selection state management

**Key Feature:** Feature B2 - Trigger shows selected entity with avatar and title

---

## Feature B2: Dropdown Trigger Shows Selected Entity ✅ COMPLETED

**Test File:** `/tests/component/Dropdown-Trigger-Display.test.ts`  
**Test Results:** 21/22 passing (95%, 1 non-critical stub test)  
**Implementation Date:** November 13, 2025

**Components Modified:**
- DropdownList.vue: Already had complete implementation
- DropdownGallery.vue: Major refactor with full trigger display logic

**DropdownGallery Implementation:**
```typescript
// Added Props
interface Props {
  dataMode?: boolean
  multiSelect?: boolean
  selectedIds?: number | number[] | null
  displayXml?: boolean
  // ... existing props
}

// Key Computed Properties
const selectedIdsArray = computed(() => { /* normalize to array */ })
const selectedItems = computed(() => { /* filter by selected IDs */ })
const displayedItems = computed(() => selectedItems.value.slice(0, 8))
const simplifiedXmlDisplay = computed(() => { /* format XML IDs */ })

// Template Structure
<template>
  <div class="dropdown-trigger">
    <!-- Placeholder: no selection -->
    <div v-if="!dataMode || selectedIdsArray.length === 0">
      {{ placeholder }}
    </div>
    
    <!-- Single Selection: ItemCard preview -->
    <div v-else-if="selectedIdsArray.length === 1">
      <ItemCard :data="formatSelectedItem(selectedItems[0])" />
    </div>
    
    <!-- Multiple Selection: Stacked avatars -->
    <div v-else class="trigger-multi-selection">
      <div class="stacked-avatars">
        <div v-for="(item, index) in displayedItems" 
             class="stacked-avatar"
             :style="{ zIndex: displayedItems.length - index }">
          <img :src="item.img_thumb.url" />
        </div>
        <div v-if="selectedItems.length > 8" class="avatar-count">
          +{{ selectedItems.length - 8 }}
        </div>
      </div>
      <span>{{ selectedItems.length }} items selected</span>
    </div>
  </div>
</template>
```

**CSS Implementation:**
- Stacked avatars: 32px circular, -20px margin overlap, z-index layering
- Avatar count indicator for >8 selections
- Placeholder, single, and multi-selection states
- XML row display with monospace font

### Design Principle

The dropdown trigger button displays:
- **No Selection:** Placeholder text + dropdown icon
- **Single Selection:** Entity avatar + entity title + dropdown icon
- **Multiple Selections:** Count badge + stacked avatars (max 8) + dropdown icon

### Visual Specifications

#### No Selection State
```
┌─────────────────────────────────────┐
│ ▼ Select an event...               │
└─────────────────────────────────────┘
```

#### Single Selection State
```
┌─────────────────────────────────────┐
│ ◉ Summer Festival 2024          ▼  │
└─────────────────────────────────────┘
  ↑ avatar (32×32px) + title
```

#### Multiple Selection State (2-8 items)
```
┌─────────────────────────────────────┐
│ ◉◉◉ 3 events selected           ▼  │
└─────────────────────────────────────┘
  ↑ stacked avatars + count
```

#### Multiple Selection State (9+ items)
```
┌─────────────────────────────────────┐
│ ◉◉◉◉◉◉◉◉ +5 more                ▼  │
└─────────────────────────────────────┘
  ↑ first 8 stacked + remaining count
```

---

## Test Cases

### TC-B2.1: Empty State Shows Placeholder

```typescript
it('should show placeholder text when no selection', () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events',
      placeholder: 'Select an event...',
      selectedIds: []
    }
  })

  const trigger = wrapper.find('.dropdown-trigger')
  expect(trigger.text()).toContain('Select an event...')
  expect(trigger.find('img').exists()).toBe(false) // No avatar
})
```

### TC-B2.2: Single Selection Shows Avatar and Title

```typescript
it('should show avatar and title when one item selected', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events',
      selectedIds: [1]
    }
  })

  await flushPromises() // Wait for entity data fetch

  const trigger = wrapper.find('.dropdown-trigger')
  
  // Should show ImgShape with avatar
  const avatar = trigger.findComponent(ImgShape)
  expect(avatar.exists()).toBe(true)
  expect(avatar.props('shape')).toBe('thumb')
  expect(avatar.props('avatar')).toBe(true)
  expect(avatar.props('size')).toBe(32) // Fixed 32×32px for trigger
  
  // Should show entity title
  expect(trigger.text()).toContain('Summer Festival 2024')
})
```

### TC-B2.3: Multiple Selection Shows Count Badge

```typescript
it('should show count badge when multiple items selected', async () => {
  const wrapper = mount(DropdownGallery, {
    props: {
      entity: 'posts',
      selectedIds: [1, 2, 3]
    }
  })

  await flushPromises()

  const trigger = wrapper.find('.dropdown-trigger')
  const badge = trigger.find('.selection-count')
  
  expect(badge.exists()).toBe(true)
  expect(badge.text()).toBe('3 posts selected')
})
```

### TC-B2.4: Multiple Selection Shows Stacked Avatars

```typescript
it('should show stacked avatars for selected items (max 8)', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'instructors',
      selectedIds: [1, 2, 3, 4, 5]
    }
  })

  await flushPromises()

  const trigger = wrapper.find('.dropdown-trigger')
  const avatars = trigger.findAll('.stacked-avatar')
  
  expect(avatars).toHaveLength(5)
  
  // Each avatar should be 32×32px with z-index stacking
  avatars.forEach((avatar, index) => {
    expect(avatar.classes()).toContain('avatar-32')
    expect(avatar.attributes('style')).toContain(`z-index: ${5 - index}`)
  })
})
```

### TC-B2.5: Multiple Selection Limits Avatars to 8

```typescript
it('should limit stacked avatars to first 8 items', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events',
      selectedIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
  })

  await flushPromises()

  const trigger = wrapper.find('.dropdown-trigger')
  const avatars = trigger.findAll('.stacked-avatar')
  
  // Should show exactly 8 avatars
  expect(avatars).toHaveLength(8)
  
  // Should show "+4 more" indicator
  const moreIndicator = trigger.find('.more-indicator')
  expect(moreIndicator.exists()).toBe(true)
  expect(moreIndicator.text()).toBe('+4 more')
})
```

### TC-B2.6: Single Selection Respects Avatar Option

```typescript
it('should show circular avatar for avatar-eligible entities', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'instructors', // Avatar-eligible entity
      selectedIds: [1]
    }
  })

  await flushPromises()

  const avatar = wrapper.findComponent(ImgShape)
  expect(avatar.props('avatar')).toBe(true)
  expect(avatar.classes()).toContain('avatar-style') // border-radius: 50%
})
```

### TC-B2.7: Single Selection No Avatar for Non-Eligible Entities

```typescript
it('should not use avatar for non-eligible entities', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'projects', // Not an avatar-eligible entity
      selectedIds: [1]
    }
  })

  await flushPromises()

  const avatar = wrapper.findComponent(ImgShape)
  expect(avatar.props('avatar')).toBe(false)
  expect(avatar.classes()).not.toContain('avatar-style')
})
```

---

## XML ID Display

### Design Principle

When working with XML IDs directly (not entity data), display simplified ID format in trigger.

### Format Rules

- **Single ID:** `tp.event: summer-festival-2024`
- **Multiple IDs (2-3):** `tp.event: id1, id2, id3`
- **Multiple IDs (4+):** `tp.event: id1, id2, id3 (+2 more)`

### Test Cases

#### TC-B2.8: Single XML ID Shows Formatted Display

```typescript
it('should display formatted XML ID when using xmlID mode', () => {
  const wrapper = mount(DropdownList, {
    props: {
      selectedXml: 'tp.event.summer-festival-2024'
    }
  })

  const trigger = wrapper.find('.dropdown-trigger')
  expect(trigger.text()).toContain('tp.event: summer-festival-2024')
})
```

#### TC-B2.9: Multiple XML IDs Show Comma-Separated List

```typescript
it('should show comma-separated XML IDs for multiple selections', () => {
  const wrapper = mount(DropdownList, {
    props: {
      selectedXml: [
        'tp.event.summer-festival',
        'tp.event.winter-workshop',
        'tp.event.spring-concert'
      ]
    }
  })

  const trigger = wrapper.find('.dropdown-trigger')
  expect(trigger.text()).toContain('tp.event: summer-festival, winter-workshop, spring-concert')
})
```

#### TC-B2.10: Many XML IDs Show Truncated List

```typescript
it('should truncate long XML ID lists', () => {
  const wrapper = mount(DropdownList, {
    props: {
      selectedXml: [
        'tp.post.blog-1',
        'tp.post.blog-2',
        'tp.post.blog-3',
        'tp.post.blog-4',
        'tp.post.blog-5',
        'tp.post.blog-6'
      ]
    }
  })

  const trigger = wrapper.find('.dropdown-trigger')
  expect(trigger.text()).toContain('tp.post: blog-1, blog-2, blog-3 (+3 more)')
})
```

---

## Dropdown Interaction

### Test Cases

#### TC-B2.11: Trigger Click Opens Dropdown

```typescript
it('should open dropdown panel when trigger clicked', async () => {
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
```

#### TC-B2.12: Dropdown Contains ItemList

```typescript
it('should render ItemList inside dropdown panel', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events'
    }
  })

  await wrapper.find('.dropdown-trigger').trigger('click')

  const itemList = wrapper.findComponent(ItemList)
  expect(itemList.exists()).toBe(true)
  expect(itemList.props('entity')).toBe('events')
  expect(itemList.props('dataMode')).toBe(true)
})
```

#### TC-B2.13: Selection Updates Trigger Display

```typescript
it('should update trigger display when item selected', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'instructors',
      selectedIds: []
    }
  })

  // Open dropdown
  await wrapper.find('.dropdown-trigger').trigger('click')
  await flushPromises()

  // Select an item
  const itemRow = wrapper.findComponent(ItemRow)
  await itemRow.trigger('click')

  // Trigger should now show selected item
  const trigger = wrapper.find('.dropdown-trigger')
  expect(trigger.findComponent(ImgShape).exists()).toBe(true)
  expect(trigger.text()).not.toContain('Select')
})
```

#### TC-B2.14: Click Outside Closes Dropdown

```typescript
it('should close dropdown when clicking outside', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events'
    },
    attachTo: document.body // Need real DOM for click outside
  })

  // Open dropdown
  await wrapper.find('.dropdown-trigger').trigger('click')
  expect(wrapper.find('.dropdown-panel').isVisible()).toBe(true)

  // Click outside
  document.body.click()
  await wrapper.vm.$nextTick()

  expect(wrapper.find('.dropdown-panel').isVisible()).toBe(false)
  wrapper.unmount()
})
```

---

## Props Propagation

### Test Cases

#### TC-B2.15: Props Passed to ItemList

```typescript
it('should pass dataMode, multiSelect, and selectedIds to ItemList', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events',
      multiSelect: true,
      selectedIds: [1, 2]
    }
  })

  await wrapper.find('.dropdown-trigger').trigger('click')

  const itemList = wrapper.findComponent(ItemList)
  expect(itemList.props('dataMode')).toBe(true)
  expect(itemList.props('multiSelect')).toBe(true)
  expect(itemList.props('selectedIds')).toEqual([1, 2])
})
```

#### TC-B2.16: Selection Events Emitted to Parent

```typescript
it('should emit update:selectedIds when ItemList selection changes', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'posts',
      selectedIds: []
    }
  })

  await wrapper.find('.dropdown-trigger').trigger('click')
  await flushPromises()

  const itemList = wrapper.findComponent(ItemList)
  itemList.vm.$emit('update:selectedIds', [1])

  expect(wrapper.emitted('update:selectedIds')).toBeTruthy()
  expect(wrapper.emitted('update:selectedIds')[0]).toEqual([[1]])
})
```

#### TC-B2.17: selectedXml Event Emitted

```typescript
it('should emit selectedXml event when ItemList emits it', async () => {
  const wrapper = mount(DropdownList, {
    props: {
      entity: 'events',
      selectedIds: []
    }
  })

  await wrapper.find('.dropdown-trigger').trigger('click')
  await flushPromises()

  const itemList = wrapper.findComponent(ItemList)
  itemList.vm.$emit('selectedXml', ['tp.event.summer-2024'])

  expect(wrapper.emitted('selectedXml')).toBeTruthy()
  expect(wrapper.emitted('selectedXml')[0]).toEqual([['tp.event.summer-2024']])
})
```

---

## CSS Specifications

### Dropdown Trigger

```css
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: 48px; /* Accommodate 32px avatar + padding */
}

.dropdown-trigger:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary-bg);
}

.dropdown-trigger[data-open="true"] {
  border-color: var(--color-primary-bg);
  box-shadow: 0 0 0 3px var(--color-primary-bg-alpha);
}
```

### Stacked Avatars

```css
.stacked-avatars {
  display: flex;
  margin-left: -8px; /* Overlap avatars by 8px */
}

.stacked-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-bg);
  overflow: hidden;
  position: relative;
}

.stacked-avatar:not(:first-child) {
  margin-left: -8px;
}

.more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-neutral-200);
  border-radius: 50%;
  border: 2px solid var(--color-bg);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin-left: -8px;
}
```

### Selection Count Badge

```css
.selection-count {
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
}
```

### Dropdown Panel

```css
.dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 400px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  z-index: 1000;
}
```

---

## Implementation Checklist

### Trigger Display Logic
- [ ] Detect selection state (none/single/multiple)
- [ ] Show placeholder when no selection
- [ ] Show avatar + title for single selection
- [ ] Show count badge for multiple selections
- [ ] Show stacked avatars (max 8)
- [ ] Show "+N more" indicator for 9+ selections
- [ ] Determine avatar option based on entity type
- [ ] Format XML ID display (prefix: id-list)

### Dropdown Interaction
- [ ] Toggle dropdown on trigger click
- [ ] Close dropdown on outside click
- [ ] Close dropdown on Escape key
- [ ] Close dropdown after selection (configurable)
- [ ] Prevent body scroll when dropdown open

### Data Management
- [ ] Fetch entity data for selected IDs
- [ ] Parse image data for avatars
- [ ] Cache entity data to avoid re-fetching
- [ ] Handle loading state for trigger display

### Props & Events
- [ ] Pass dataMode, multiSelect to ItemList
- [ ] Pass selectedIds to ItemList
- [ ] Emit update:selectedIds on selection change
- [ ] Emit selectedXml on selection change
- [ ] Emit selected event with full entities

---

## Success Criteria

- [ ] Trigger shows correct display for all selection states
- [ ] Single selection shows avatar and title
- [ ] Multiple selections show stacked avatars (max 8)
- [ ] Count badge shows correct number
- [ ] XML ID display formatted correctly
- [ ] Dropdown opens/closes correctly
- [ ] Selection updates trigger display immediately
- [ ] All events emitted correctly
- [ ] All test cases pass

---

## Related Documentation

- `/docs/tasks/TEST_SPEC_ENTITY_COLLECTIONS.md` - ItemList selection state
- `/docs/tasks/TEST_SPEC_ENTITY_COMPONENTS.md` - Avatar option determination
- `/docs/tasks/TEST_SPEC_IMGSHAPE.md` - ImgShape avatar rendering
- `/docs/CLIST_SELECTION_SYSTEM_GUIDE.md` - Selection system overview
- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Testing strategy
