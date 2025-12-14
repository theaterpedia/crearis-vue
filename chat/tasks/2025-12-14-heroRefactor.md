# Hero.vue Refactor & Display Components Report
**Date:** December 14, 2025

## 1. Executive Summary

This report analyzes the implementation requirements for:
1. **8 new shape instances** for image import with target-based naming
2. **DisplayImage.vue** - In-content image display component
3. **DisplayBanner.vue** - Thin banner separator component
4. **Hero.vue refactoring** - Intelligent responsive image selection from 6 hero instances

---

## 2. Current Architecture Analysis

### 2.1 Existing Shape System

The current implementation in [ImgShape.vue](src/components/images/ImgShape.vue) provides:
- 4 core shapes: `square`, `wide`, `thumb`, `vertical`
- Adapter detection (unsplash, cloudinary, vimeo, external)
- BlurHash placeholder support via `useBlurHash.ts`
- XYZ focal point transformations

### 2.2 Image Data Structure (Current)

```typescript
interface ShapeData {
  url?: string
  x?: number | null   // Focal X (0-100)
  y?: number | null   // Focal Y (0-100)
  z?: number | null   // Zoom (0-100)
  blur?: string       // BlurHash
  turl?: string       // Template URL
  tpar?: string       // Template parameters
}
```

### 2.3 Backend Shape Generation

Currently handled in:
- [server/adapters/local-adapter.ts](server/adapters/local-adapter.ts) - Local file processing
- [server/adapters/unsplash-adapter.ts](server/adapters/unsplash-adapter.ts) - Unsplash URL building
- [server/adapters/cloudinary-adapter.ts](server/adapters/cloudinary-adapter.ts) - Cloudinary transformations

---

## 3. Open Questions

### 3.1 Backend Implementation Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should instances be stored as separate DB columns or in a JSONB field? | DB schema design |
| 2 | Are XYZ values inherited from template to instances, or calculated independently? | Focal point logic |
| 3 | How should `display_thumb_banner` handle y-axis focus when source aspect differs significantly? | Special case handling |
| 4 | Should BlurHash be generated per-instance or shared from template? | Performance vs accuracy |
| 5 | What fallback behavior when custom XYZ preset exists on template? | Warning implementation |

### 3.2 Frontend Component Questions

| # | Question | Impact |
|---|----------|--------|
| 6 | Should DisplayImage/DisplayBanner fetch by `xmlid` or receive full image data as prop? | API design |
| 7 | How does DisplayImage detect it's inside Columns.vue vs Container.vue? | Parent detection |
| 8 | For Hero.vue: what's the breakpoint threshold between hero instance selections? | Responsive breakpoints |
| 9 | Should gradient overlays be part of Hero.vue or separate composable? | Code organization |

---

## 4. New Shape Instances Specification

### 4.1 Instance Table

| Instance Name | Template | Dimensions (W×H) | Notes |
|---------------|----------|------------------|-------|
| `display_wide` | wide | 531 × 300 | Standard in-content display |
| `display_thumb_banner` | thumb | 1062 × 265.5 | Special: Y-axis focus, X-axis expand |
| `hero_wide_xl` | wide | 1440 × 820 | Desktop hero, extra large |
| `hero_square_xl` | square | 1440 × 1280 | Desktop hero, square variant |
| `hero_wide` | wide | 1100 × 620 | Standard desktop hero |
| `hero_square` | square | 440 × 440 | Mobile/tablet square hero |
| `hero_vertical` | vertical | 440 × 880 | Mobile vertical hero |

### 4.2 Backend Loop Architecture

```
Outer loop: [square, wide, vertical, thumb]
  Inner loop: [template-root, ...target-instances-for-template]
```

---

## 5. Implementation Alternatives

### Alternative A: Extend ImgShape.vue (Recommended)

**Approach:** Keep all image display logic in ImgShape.vue, extend with new shape types

```typescript
// ImgShape.vue - Extended shape union
type ShapeType = 
  | 'square' | 'wide' | 'thumb' | 'vertical'  // Templates
  | 'display_wide' | 'display_thumb_banner'     // Display instances
  | 'hero_wide_xl' | 'hero_square_xl'           // Hero instances
  | 'hero_wide' | 'hero_square' | 'hero_vertical'
```

**Pros:**
- Single source of truth for image display
- Consistent adapter handling
- Shared BlurHash logic
- Easier maintenance

**Cons:**
- ImgShape.vue becomes larger
- More complex dimension calculation
- Harder to tree-shake unused shapes

**New Components:**

```vue
<!-- DisplayImage.vue -->
<template>
  <div class="display-image" :class="[placementClass, paddingClass, bgClass]">
    <ImgShape :data="imageData" shape="display_wide" />
    <div v-if="caption !== 'none'" class="display-caption">...</div>
  </div>
</template>
```

```vue
<!-- DisplayBanner.vue -->
<template>
  <div class="display-banner">
    <ImgShape :data="imageData" shape="display_thumb_banner" />
  </div>
</template>
```

**Estimated Effort:** 16-20 hours

---

### Alternative B: Composable-Based Architecture

**Approach:** Extract shared logic to composables, create independent components

```
src/composables/
├── useImageAdapter.ts      # Adapter detection, URL building
├── useResponsiveImage.ts   # Dimension calculation, srcset
├── useImageFetch.ts        # API fetching by xmlid
└── useBlurHash.ts          # (existing)
```

**New Components:**

```vue
<!-- DisplayImage.vue - Independent -->
<script setup>
import { useImageAdapter } from '@/composables/useImageAdapter'
import { useImageFetch } from '@/composables/useImageFetch'
import { useBlurHash } from '@/composables/useBlurHash'

const props = defineProps<{
  xmlid: string
  padding: 'none' | 'small' | 'medium' | 'large'
  background: 'inherit' | 'standard' | 'muted' | 'accent'
  caption: 'none' | 'author' | 'description' | 'full'
  placement: 'left' | 'lefttop' | 'leftbottom' | 'right' | 'righttop' | 'rightbottom'
}>()

const { imageData, loading, error } = useImageFetch(props.xmlid)
const { buildUrl } = useImageAdapter()
const { canvasRef, isDecoded } = useBlurHash({ hash: computed(() => imageData.value?.blur) })
</script>
```

**Pros:**
- Maximum code reuse
- Independent component testing
- Clear separation of concerns
- Future-proof for more image components

**Cons:**
- More files to create
- Higher initial complexity
- Potential for composition overhead

**Estimated Effort:** 20-24 hours

---

### Alternative C: Wrapper Components

**Approach:** Create thin wrapper components that configure ImgShape

```vue
<!-- DisplayImage.vue - Wrapper -->
<template>
  <div class="display-image-wrapper" :class="wrapperClasses">
    <ImgShapeLoader :xmlid="xmlid" shape="display_wide">
      <template #default="{ data, loading, error }">
        <ImgShape v-if="data" :data="data" shape="display_wide" />
        <div v-else-if="loading" class="loading-placeholder" />
        <div v-else-if="error" class="error-state" />
      </template>
    </ImgShapeLoader>
    <slot name="caption" />
  </div>
</template>
```

**New Helper Component:**

```vue
<!-- ImgShapeLoader.vue -->
<script setup>
// Handles API fetching for any shape by xmlid
const { imageData, loading, error } = await useFetch(`/api/images/xmlid/${props.xmlid}`)
</script>
```

**Pros:**
- Minimal changes to ImgShape.vue
- Clear separation: loader vs renderer
- Slot-based flexibility

**Cons:**
- Additional component layer
- Slightly more complex template usage
- Two components required for one visual

**Estimated Effort:** 14-18 hours

---

## 6. Hero.vue Refactoring Strategy

### 6.1 Instance Selection Logic

```typescript
// Hero instance selection based on viewport and content needs
function selectHeroInstance(viewport: { width: number, height: number }, aspectPreference: 'wide' | 'square' | 'vertical') {
  const isDesktop = viewport.width > 1024
  const isTablet = viewport.width > 640 && viewport.width <= 1024
  const isMobile = viewport.width <= 640
  
  if (isMobile) {
    return aspectPreference === 'vertical' ? 'hero_vertical' : 'hero_square'
  }
  
  if (isTablet) {
    return 'hero_wide'
  }
  
  // Desktop
  return viewport.width > 1280 
    ? (aspectPreference === 'square' ? 'hero_square_xl' : 'hero_wide_xl')
    : 'hero_wide'
}
```

### 6.2 Hero.vue Image Prop Structure (Proposed)

```typescript
interface HeroImageData {
  // Templates (for custom XYZ editing)
  shape_square?: ShapeData
  shape_wide?: ShapeData
  shape_vertical?: ShapeData
  
  // Hero instances (pre-rendered)
  hero_wide_xl?: ShapeData
  hero_square_xl?: ShapeData
  hero_wide?: ShapeData
  hero_square?: ShapeData
  hero_vertical?: ShapeData
}
```

---

## 7. Recommended Implementation Plan

### Phase 1: Backend Shape Generation (8-10 hours)
1. Extend adapter base class with instance definitions
2. Implement 2-loop architecture for shape generation
3. Add special handling for `display_thumb_banner`
4. Add fallback warning for custom XYZ presets

### Phase 2: Composables (4-6 hours)
1. Create `useImageAdapter.ts` - adapter detection, URL building
2. Create `useImageFetch.ts` - API fetching by xmlid
3. Optionally create `useResponsiveImage.ts`

### Phase 3: Display Components (6-8 hours)
1. Create DisplayImage.vue with all props
2. Create DisplayBanner.vue
3. Add parent detection for Columns.vue
4. Implement responsive sizing

### Phase 4: Hero.vue Refactoring (6-8 hours)
1. Add hero instance props
2. Implement intelligent instance selection
3. Test responsive behavior across breakpoints

### Phase 5: Demo View & Testing (4-6 hours)
1. Create `/Demo/DemoDisplayImage.vue`
2. Add usage examples
3. Integration testing

**Total Estimated Effort:** 28-38 hours

---

## 8. Decision Matrix

| Criteria | Alt A (Extend) | Alt B (Composables) | Alt C (Wrapper) |
|----------|----------------|---------------------|-----------------|
| Code reuse | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Simplicity | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| Flexibility | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| Maintenance | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| Performance | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Overall** | **Recommended** | Good | Acceptable |

---

## 9. Appendix: Code Locations

### Key Files to Modify

| File | Changes |
|------|---------|
| [src/components/images/ImgShape.vue](src/components/images/ImgShape.vue#L1-L654) | Add new shape types, dimension calculations |
| [src/components/Hero.vue](src/components/Hero.vue#L1-L400) | Refactor image selection logic |
| [server/adapters/base-adapter.ts](server/adapters/base-adapter.ts) | Add instance generation methods |
| [server/adapters/local-adapter.ts](server/adapters/local-adapter.ts) | Implement 2-loop architecture |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/display/DisplayImage.vue` | In-content image display |
| `src/components/display/DisplayBanner.vue` | Banner separator |
| `src/composables/useImageAdapter.ts` | Adapter logic extraction |
| `src/composables/useImageFetch.ts` | API fetching by xmlid |
| `src/views/Demo/DemoDisplayImage.vue` | Demo view |

---

## 10. Next Steps

1. **Clarify open questions** (Section 3) before implementation
2. **Choose alternative** (recommend Alternative A)
3. **Define exact breakpoints** for Hero instance selection
4. **Database schema decision** for new instances
5. **Begin Phase 1** backend implementation
