# Test Specification: Entity-Components

**Components:** ItemCard, ItemTile, ItemRow  
**Test Files:** 
- `/tests/unit/clist/itemCard.test.ts`
- `/tests/unit/clist/itemTile.test.ts`
- `/tests/unit/clist/itemRow.test.ts`

**Status:** 🟡 New Features to Implement  
**Last Updated:** November 13, 2025

---

## Overview

Entity-Components are the display units for individual entities (events, posts, instructors). They have **full authority** over:
- Avatar option decision (based on xmlID)
- Selection state display
- Checkbox visibility
- Visual indicators (badges, markers, icons)

---

## Component Authority: Avatar Option Decision

### Design Principle

Entity-Components have access to full entity data including `xmlID`. They determine when to enable the avatar option on ImgShape based on entity type.

### Decision Logic

```typescript
// Authority: ItemRow.vue, ItemTile.vue, ItemCard.vue
const shouldUseAvatar = computed(() => {
  if (!props.data?.xmlID) return false
  
  // Parse xmlID: "tp.event.festival-2024" or "tp.instructor.john-doe"
  const parts = props.data.xmlID.split('.')
  const entityType = parts[1] // Second fragment: 'event', 'instructor', 'post'
  
  // Avatar entities: events, instructors, posts
  const avatarEntities = ['event', 'instructor', 'post']
  const isAvatarEntity = avatarEntities.includes(entityType)
  
  // Avatar shapes: thumb, square only
  const isAvatarShape = props.shape === 'thumb' || props.shape === 'square'
  
  // Both conditions must be true
  return isAvatarEntity && isAvatarShape
})
```

### Test Cases

#### TC-A2.8: ItemRow Determines Avatar for Event Entity
```typescript
it('should enable avatar for event entity with thumb shape', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Summer Festival',
      shape: 'thumb',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-festival-2024',
        // ... other ImgShapeData properties
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(true)
})
```

#### TC-A2.9: ItemRow Determines Avatar for Instructor Entity
```typescript
it('should enable avatar for instructor entity with square shape', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'John Doe',
      shape: 'square',
      data: {
        url: 'https://example.com/instructor.jpg',
        xmlID: 'tp.instructor.john-doe',
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(true)
})
```

#### TC-A2.10: ItemTile Determines Avatar for Post Entity
```typescript
it('should enable avatar for post entity with thumb shape', () => {
  const wrapper = mount(ItemTile, {
    props: {
      heading: 'Blog Post Title',
      shape: 'thumb',
      data: {
        url: 'https://example.com/post.jpg',
        xmlID: 'tp.post.blog-post-2024',
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(true)
})
```

#### TC-A2.11: ItemCard Disables Avatar for Project Entity
```typescript
it('should NOT enable avatar for project entity', () => {
  const wrapper = mount(ItemCard, {
    props: {
      heading: 'Project Title',
      shape: 'thumb',
      data: {
        url: 'https://example.com/project.jpg',
        xmlID: 'tp.project.summer-2024',
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(false)
})
```

#### TC-A2.12: ItemRow Disables Avatar for Wide Shape
```typescript
it('should NOT enable avatar for event with wide shape', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Event Title',
      shape: 'wide',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024',
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(false)
})
```

#### TC-A2.13: ItemTile Handles Missing xmlID Gracefully
```typescript
it('should NOT enable avatar when xmlID is missing', () => {
  const wrapper = mount(ItemTile, {
    props: {
      heading: 'Title',
      shape: 'thumb',
      data: {
        url: 'https://example.com/image.jpg',
        // No xmlID provided
      }
    }
  })

  const imgShape = wrapper.findComponent({ name: 'ImgShape' })
  expect(imgShape.props('avatar')).toBe(false)
})
```

---

## Feature B1: Checkbox Visibility Logic

### Design Principle

Checkboxes should ONLY appear when:
1. Entity-Collection has `dataMode=true`
2. Entity-Collection has `multiSelect=true`

If `dataMode=true` but `multiSelect=false` (or undefined):
- NO checkbox displayed
- Selected item highlighted with secondary theme colors

### Props Flow

```typescript
// ItemList.vue or ItemGallery.vue
<ItemRow
  :heading="item.title"
  :data="parseImageData(item.img_thumb)"
  :options="{
    selectable: dataMode && multiSelect  // Checkbox visibility
  }"
  :models="{
    selected: selectedIds.includes(item.id)  // Selection state
  }"
/>
```

### Test Cases

#### TC-B1.1: Checkbox Visible with Multi-Select
```typescript
it('should show checkbox when selectable option is true', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: true  // dataMode=true + multiSelect=true
      },
      models: {
        selected: false
      }
    }
  })

  const checkbox = wrapper.find('.checkbox')
  expect(checkbox.exists()).toBe(true)
  expect(checkbox.isVisible()).toBe(true)
})
```

#### TC-B1.2: No Checkbox with Single Select
```typescript
it('should NOT show checkbox when selectable is false', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: false  // dataMode=true + multiSelect=false
      },
      models: {
        selected: true
      }
    }
  })

  const checkbox = wrapper.find('.checkbox')
  expect(checkbox.exists()).toBe(false)
})
```

#### TC-B1.3: No Checkbox with Undefined Multi-Select
```typescript
it('should NOT show checkbox when selectable is undefined', () => {
  const wrapper = mount(ItemTile, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        // selectable not provided (undefined)
      },
      models: {
        selected: true
      }
    }
  })

  const checkbox = wrapper.find('.checkbox')
  expect(checkbox.exists()).toBe(false)
})
```

#### TC-B1.4: Checkbox Reflects Selected State
```typescript
it('should show checked checkbox when item is selected', () => {
  const wrapper = mount(ItemCard, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: true
      },
      models: {
        selected: true  // Item is selected
      }
    }
  })

  const checkbox = wrapper.find('.checkbox')
  expect(checkbox.exists()).toBe(true)
  expect(checkbox.classes()).toContain('checked')
})
```

#### TC-B1.5: Checkbox Click Emits Event
```typescript
it('should emit click event when checkbox is clicked', async () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: true
      },
      models: {
        selected: false
      }
    }
  })

  const checkbox = wrapper.find('.checkbox')
  await checkbox.trigger('click')

  // Should emit click event to parent for handling
  expect(wrapper.emitted('click')).toBeTruthy()
})
```

---

## Feature B1 (continued): Secondary Highlight for Single Selection

### Design Principle

When `dataMode=true` but `multiSelect=false`:
- Selected item gets highlighted background
- Use secondary theme colors
- No checkbox shown

### Test Cases

#### TC-B1.6: Secondary Highlight Applied
```typescript
it('should apply secondary highlight when selected in single-select mode', () => {
  const wrapper = mount(ItemRow, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: false  // No checkbox
      },
      models: {
        selected: true  // But item is selected
      }
    }
  })

  const itemRow = wrapper.find('.item-row')
  expect(itemRow.classes()).toContain('is-selected')
  
  // Should have secondary color styling
  // CSS class .is-selected defines:
  // background: var(--color-secondary-bg)
  // color: var(--color-secondary-contrast)
})
```

#### TC-B1.7: No Highlight When Not Selected
```typescript
it('should NOT apply highlight when item is not selected', () => {
  const wrapper = mount(ItemTile, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: false
      },
      models: {
        selected: false  // Not selected
      }
    }
  })

  const itemTile = wrapper.find('.item-tile')
  expect(itemTile.classes()).not.toContain('is-selected')
})
```

#### TC-B1.8: Multi-Select Uses Primary Highlight
```typescript
it('should use primary highlight in multi-select mode', () => {
  const wrapper = mount(ItemCard, {
    props: {
      heading: 'Event Title',
      data: {
        url: 'https://example.com/event.jpg',
        xmlID: 'tp.event.summer-2024'
      },
      options: {
        selectable: true  // Multi-select mode
      },
      models: {
        selected: true
      }
    }
  })

  const itemCard = wrapper.find('.item-card')
  expect(itemCard.classes()).toContain('is-selected')
  
  // CSS class .is-selected with .checkbox visible uses:
  // box-shadow: 0 0 0 3px var(--color-primary-bg)
})
```

---

## Implementation Checklist

### ImgShape Integration
- [ ] Add `shouldUseAvatar` computed in ItemRow.vue
- [ ] Add `shouldUseAvatar` computed in ItemTile.vue
- [ ] Add `shouldUseAvatar` computed in ItemCard.vue
- [ ] Parse xmlID second fragment for entity type
- [ ] Check entity type against avatar entities list
- [ ] Check shape against avatar shapes list
- [ ] Pass `:avatar="shouldUseAvatar"` to ImgShape

### Checkbox Logic
- [ ] Implement `showSelectable` computed based on options.selectable
- [ ] Show checkbox only when `showSelectable` is true
- [ ] Bind checkbox state to `models.selected`
- [ ] Emit click event when checkbox clicked
- [ ] Style checkbox with theme colors

### Selection Highlight
- [ ] Add `is-selected` class when `models.selected` is true
- [ ] Different styling for single-select (secondary) vs multi-select (primary)
- [ ] CSS: `.is-selected` without checkbox → secondary colors
- [ ] CSS: `.is-selected` with checkbox → primary border/shadow

---

## CSS Specifications

### Secondary Highlight (Single Selection)
```css
.item-row.is-selected:not(:has(.checkbox)),
.item-tile.is-selected:not(:has(.checkbox)),
.item-card.is-selected:not(:has(.checkbox)) {
  background: var(--color-secondary-bg);
  color: var(--color-secondary-contrast);
  border-color: var(--color-secondary-bg);
}
```

### Primary Highlight (Multi Selection)
```css
.item-row.is-selected:has(.checkbox) {
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.item-tile.is-selected:has(.checkbox),
.item-card.is-selected:has(.checkbox) {
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}
```

---

## Success Criteria

- [ ] Avatar option correctly determined from xmlID
- [ ] Avatar enabled for event/instructor/post with thumb/square
- [ ] Avatar disabled for other entities or shapes
- [ ] Checkbox visible only when selectable=true
- [ ] Checkbox reflects selected state correctly
- [ ] Secondary highlight applied in single-select mode
- [ ] Primary highlight applied in multi-select mode
- [ ] All test cases pass

---

## Related Documentation

- `/docs/tasks/TEST_SPEC_IMGSHAPE.md` - ImgShape avatar prop specification
- `/docs/tasks/TEST_SPEC_ENTITY_COLLECTIONS.md` - ItemList/ItemGallery selection logic
- `/docs/CLIST_SELECTION_SYSTEM_GUIDE.md` - Overall selection system design
- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Testing strategy
