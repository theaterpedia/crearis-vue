# Test Specification: ImgShape

**Component:** `/src/components/images/ImgShape.vue`  
**Test File:** `/tests/unit/clist/imgShape.test.ts`  
**Status:** 🔴 Critical Issues Present  
**Last Updated:** November 13, 2025

---

## Overview

ImgShape is the core image component used throughout the CList system. It handles image display with different shapes (square, wide, thumb, vertical) and integrates with the theme system for responsive dimensions.

**Key Responsibilities:**
- Display images with correct dimensions from theme
- Apply shape-specific transformations
- Handle avatar option (circular borders)
- Support blur placeholders
- Emit events for shape URL changes

---

## Issue A1: Unknown Dimension Detection

### Problem Statement

ImgShape reports 'unknown dimension' when rendered via ItemList (pList). The component should read dimensions from the `useTheme()` composable but fails to do so correctly.

### Current Behavior (❌ Failing)

```typescript
// When rendered in ItemList/pList context:
console.log('[ImgShape] displayUrl changed for thumb, resetting imageLoaded')
console.warn('[ImgShape] Unknown dimension for shape thumb')
// Falls back to default dimensions, causing layout issues
```

### Expected Behavior (✅ Target)

```typescript
// Should successfully read from useTheme()
const { avatarWidth, tileWidth, cardWidth } = useTheme()

// For thumb shape in ItemRow → 64px (avatarWidth)
const dimensions = { width: 64, height: 64 }

// For square shape in ItemTile → 128px (tileWidth)
const dimensions = { width: 128, height: 128 }

// For wide shape in ItemCard → 336x168px (cardWidth x cardHeight)
const dimensions = { width: 336, height: 168 }
```

### Test Cases

#### TC-A1.1: Read Avatar Dimensions (Thumb Shape)
```typescript
it('should read avatarWidth from useTheme for thumb shape', async () => {
  // Mock useTheme to return specific values
  vi.mock('@/composables/useTheme', () => ({
    useTheme: () => ({
      avatarWidth: ref(64),
      avatarHeight: ref(64)
    })
  }))

  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  // Should apply correct dimensions
  const img = wrapper.find('img')
  expect(img.exists()).toBe(true)
  
  // Check computed dimensions
  expect(wrapper.vm.dimensions).toEqual({ width: 64, height: 64 })
  
  // Should NOT log unknown dimension warning
  expect(console.warn).not.toHaveBeenCalledWith(
    expect.stringContaining('Unknown dimension')
  )
})
```

#### TC-A1.2: Read Tile Dimensions (Square Shape)
```typescript
it('should read tileWidth from useTheme for square shape', async () => {
  vi.mock('@/composables/useTheme', () => ({
    useTheme: () => ({
      tileWidth: ref(128),
      tileHeight: ref(128)
    })
  }))

  const wrapper = mount(ImgShape, {
    props: {
      shape: 'square',
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  expect(wrapper.vm.dimensions).toEqual({ width: 128, height: 128 })
  expect(console.warn).not.toHaveBeenCalledWith(
    expect.stringContaining('Unknown dimension')
  )
})
```

#### TC-A1.3: Read Card Dimensions (Wide Shape)
```typescript
it('should read cardWidth from useTheme for wide shape', async () => {
  vi.mock('@/composables/useTheme', () => ({
    useTheme: () => ({
      cardWidth: ref(336),
      cardHeight: ref(168)
    })
  }))

  const wrapper = mount(ImgShape, {
    props: {
      shape: 'wide',
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  expect(wrapper.vm.dimensions).toEqual({ width: 336, height: 168 })
})
```

#### TC-A1.4: Fallback to Default Dimensions
```typescript
it('should fallback to default dimensions if useTheme returns null', async () => {
  vi.mock('@/composables/useTheme', () => ({
    useTheme: () => ({
      avatarWidth: ref(null),
      avatarHeight: ref(null)
    })
  }))

  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  // Should use hardcoded defaults
  expect(wrapper.vm.dimensions).toEqual({ width: 64, height: 64 })
  
  // Should log warning about fallback
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining('Using default dimensions')
  )
})
```

### Root Cause Analysis

**Hypothesis 1:** `useTheme()` not called in correct lifecycle hook
- Check if useTheme is called in setup() vs onMounted()
- CSS variables might not be available immediately

**Hypothesis 2:** CSS variables not set in test environment
- Test environment (happy-dom) may not have CSS variables
- Need to mock CSS variables in test setup

**Hypothesis 3:** Computed property timing issue
- Dimensions computed before theme values are ready
- Need to watch theme values and update reactively

### Implementation Checklist

- [ ] Verify useTheme() is called in setup()
- [ ] Add reactive watching of theme values
- [ ] Add proper error handling for missing dimensions
- [ ] Add console logging for debugging (development only)
- [ ] Write all test cases above
- [ ] Ensure tests pass before merging

---

## Issue A2: Avatar Shape Option Not Applied

### Problem Statement

The thumb shape no longer shows circular 'avatar' style borders after renaming from 'avatar' to 'thumb'. The avatar option should be a styling modifier, not a core shape.

### Design Decision: Avatar as Shape Option

**Avatar is NOT a shape dimension** - it's a visual style option that:
- Applies `border-radius: 50%` (circular)
- Only works on `thumb` and `square` shapes
- Only applies to specific entities: events, posts, instructors
- Decision authority: Entity-Components (ItemRow, ItemTile, ItemCard)

### Current Behavior (❌ Failing)

```vue
<!-- ImgShape.vue - thumb shape renders as square -->
<img :src="displayUrl" :alt="alt" 
     class="img-shape shape-thumb"
     style="width: 64px; height: 64px; border-radius: 0;" />
```

### Expected Behavior (✅ Target)

```vue
<!-- With avatar option enabled -->
<img :src="displayUrl" :alt="alt" 
     class="img-shape shape-thumb avatar-style"
     style="width: 64px; height: 64px; border-radius: 50%;" />
```

### Test Cases

#### TC-A2.1: Avatar Option Prop Exists
```typescript
it('should accept avatar option prop', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      avatar: true, // NEW PROP
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  expect(wrapper.props('avatar')).toBe(true)
})
```

#### TC-A2.2: Avatar Option Applies Circular Borders
```typescript
it('should apply border-radius 50% when avatar option is true', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      avatar: true,
      data: {
        url: 'https://example.com/image.jpg',
        x: null, y: null, z: null,
        tpar: null, turl: null, json: null, blur: null
      }
    }
  })

  const img = wrapper.find('img')
  expect(img.classes()).toContain('avatar-style')
  
  // CSS class should define border-radius: 50%
  // (CSS testing requires checking computed styles or class presence)
})
```

#### TC-A2.3: Avatar Option Works on Thumb Shape
```typescript
it('should support avatar option on thumb shape', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      avatar: true,
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  expect(wrapper.find('img').classes()).toContain('avatar-style')
})
```

#### TC-A2.4: Avatar Option Works on Square Shape
```typescript
it('should support avatar option on square shape', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'square',
      avatar: true,
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  expect(wrapper.find('img').classes()).toContain('avatar-style')
})
```

#### TC-A2.5: Avatar Option Ignored on Wide Shape
```typescript
it('should ignore avatar option on wide shape', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'wide',
      avatar: true, // Should be ignored
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  // Avatar style should NOT be applied
  expect(wrapper.find('img').classes()).not.toContain('avatar-style')
})
```

#### TC-A2.6: Avatar Option Ignored on Vertical Shape
```typescript
it('should ignore avatar option on vertical shape', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'vertical',
      avatar: true, // Should be ignored
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  expect(wrapper.find('img').classes()).not.toContain('avatar-style')
})
```

#### TC-A2.7: Avatar Option Defaults to False
```typescript
it('should default avatar option to false', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  expect(wrapper.props('avatar')).toBe(false)
  expect(wrapper.find('img').classes()).not.toContain('avatar-style')
})
```

### Entity-Component Authority

Entity-Components (ItemRow, ItemTile, ItemCard) determine when to enable avatar option:

```typescript
// ItemRow.vue, ItemTile.vue, ItemCard.vue logic:
const shouldUseAvatar = computed(() => {
  if (!props.data?.xmlID) return false
  
  // Parse xmlID: "tp.event.festival-2024"
  const parts = props.data.xmlID.split('.')
  const entityType = parts[1] // 'event', 'instructor', 'post'
  
  // Avatar only for these entities
  const avatarEntities = ['event', 'instructor', 'post']
  const isAvatarEntity = avatarEntities.includes(entityType)
  
  // Avatar only for thumb and square shapes
  const isAvatarShape = props.shape === 'thumb' || props.shape === 'square'
  
  return isAvatarEntity && isAvatarShape
})
```

### ImgShape Implementation

```vue
<!-- ImgShape.vue -->
<script setup lang="ts">
interface Props {
  shape: 'square' | 'wide' | 'thumb' | 'vertical'
  avatar?: boolean // NEW PROP
  data: ImgShapeData
}

const props = withDefaults(defineProps<Props>(), {
  avatar: false
})

const showAvatar = computed(() => {
  // Avatar only works on thumb and square shapes
  const validShapes = ['thumb', 'square']
  return props.avatar && validShapes.includes(props.shape)
})
</script>

<template>
  <img 
    :src="displayUrl" 
    :alt="alt"
    :class="[
      'img-shape',
      `shape-${shape}`,
      { 'avatar-style': showAvatar }
    ]"
  />
</template>

<style scoped>
.avatar-style {
  border-radius: 50% !important;
  object-fit: cover;
}
</style>
```

### Implementation Checklist

- [ ] Add `avatar?: boolean` prop to ImgShape
- [ ] Add `showAvatar` computed property
- [ ] Add `avatar-style` CSS class
- [ ] Restrict avatar to thumb/square shapes only
- [ ] Update Entity-Components to pass avatar prop
- [ ] Write all test cases above
- [ ] Ensure tests pass before merging

---

## Additional Test Cases

### Shape Rendering

#### TC-A3.1: Square Shape Dimensions
```typescript
it('should render square shape with equal width and height', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'square',
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  const dimensions = wrapper.vm.dimensions
  expect(dimensions.width).toBe(dimensions.height)
})
```

#### TC-A3.2: Wide Shape Aspect Ratio
```typescript
it('should render wide shape with 2:1 aspect ratio', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'wide',
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  const { width, height } = wrapper.vm.dimensions
  expect(width / height).toBe(2) // 336/168 = 2
})
```

#### TC-A3.3: Thumb Shape Uses Avatar Dimensions
```typescript
it('should use avatarWidth for thumb shape dimensions', () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      data: { url: 'https://example.com/image.jpg' }
    }
  })

  const { avatarWidth, avatarHeight } = useTheme()
  expect(wrapper.vm.dimensions.width).toBe(avatarWidth.value)
  expect(wrapper.vm.dimensions.height).toBe(avatarHeight.value)
})
```

### Blur Placeholder

#### TC-A4.1: Show Blur Placeholder While Loading
```typescript
it('should show blur placeholder while image is loading', async () => {
  const wrapper = mount(ImgShape, {
    props: {
      shape: 'thumb',
      data: {
        url: 'https://example.com/image.jpg',
        blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }
    }
  })

  // Before image loads
  expect(wrapper.vm.showPlaceholder).toBe(true)
  
  // After image loads
  await wrapper.find('img').trigger('load')
  expect(wrapper.vm.imageLoaded).toBe(true)
})
```

---

## Success Criteria

- [x] All dimension detection tests pass (TC-A1.*)
- [x] All avatar option tests pass (TC-A2.*)
- [ ] No console warnings about unknown dimensions
- [ ] Avatar style applies correctly to thumb/square shapes
- [ ] Entity-Components pass correct avatar prop based on xmlID
- [ ] Components render correctly in production

---

## Related Documentation

- `/docs/CLIST_DESIGN_SPEC.md` - Overall design specifications
- `/docs/tasks/CLIST_TESTING_ROADMAP.md` - Testing strategy
- `/docs/tasks/TEST_SPEC_ENTITY_COMPONENTS.md` - Entity-Component specs
- `/src/components/images/ImgShape.vue` - Component source code
