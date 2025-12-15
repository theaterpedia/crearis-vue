# Responsive Logic & Image Instance Selection

## Overview

The page heading system uses a sophisticated instance selection algorithm to serve optimally-sized images based on viewport dimensions and header height configuration.

## Image Instance Inventory

| Instance Name | Dimensions | Aspect | Target Use |
|---------------|------------|--------|------------|
| `hero_vertical` | 440 × 880 | 1:2 (portrait) | Mobile full/prominent |
| `hero_square` | 440 × 440 | 1:1 | Mobile mini/medium |
| `hero_square_xl` | 1440 × 1280 | ~1:1 | Desktop full-height |
| `hero_wide` | 1100 × 620 | 16:9ish | Tablet landscape |
| `hero_wide_xl` | 1440 × 820 | 16:9ish | Desktop landscape |

## Selection Algorithm

Located in: `src/utils/selectHeroInstance.ts`

```typescript
export function selectHeroInstance(
  heightTmp: HeightTmp,
  viewportWidth: number,
  viewportHeight: number
): HeroInstance {
  const isMobile = viewportWidth < MOBILE_WIDTH_PX  // 768
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024
  const isDesktop = viewportWidth >= 1024
  
  // Full-height headers need more vertical coverage
  const needsTallImage = heightTmp === 'full' || heightTmp === 'prominent'
  
  if (isMobile) {
    // Mobile: vertical for tall, square for short
    return needsTallImage ? 'hero_vertical' : 'hero_square'
  }
  
  if (isTablet) {
    // Tablet: square_xl for full, wide for others
    return heightTmp === 'full' ? 'hero_square_xl' : 'hero_wide'
  }
  
  // Desktop: square_xl for full, wide_xl for others
  return heightTmp === 'full' ? 'hero_square_xl' : 'hero_wide_xl'
}
```

## Instance Dimensions Helper

```typescript
export function getHeroInstanceDimensions(instance: HeroInstance): { 
  width: number
  height: number 
} {
  const dimensions: Record<HeroInstance, { width: number; height: number }> = {
    hero_vertical: { width: 440, height: 880 },
    hero_square: { width: 440, height: 440 },
    hero_wide: { width: 1100, height: 620 },
    hero_wide_xl: { width: 1440, height: 820 },
    hero_square_xl: { width: 1440, height: 1280 }
  }
  return dimensions[instance]
}
```

## Decision Matrix

### By Device × Height

| | mini (25vh) | medium (50vh) | prominent (75vh) | full (100vh) |
|---|-------------|---------------|------------------|--------------|
| **Mobile (<768)** | hero_square | hero_square | hero_vertical | hero_vertical |
| **Tablet (768-1023)** | hero_wide | hero_wide | hero_wide | hero_square_xl |
| **Desktop (≥1024)** | hero_wide_xl | hero_wide_xl | hero_wide_xl | hero_square_xl |

### Visual Example

```
MOBILE (375px wide)
┌─────────────┐     ┌─────────────┐
│   mini/     │     │    full/    │
│   medium    │     │  prominent  │
│  (square)   │     │ (vertical)  │
│   440×440   │     │   440×880   │
└─────────────┘     │             │
                    │             │
                    └─────────────┘

DESKTOP (1920px wide)
┌─────────────────────────────────────────┐
│            mini/medium/prominent         │
│              (wide_xl)                   │
│               1440×820                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│                full                     │
│             (square_xl)                 │
│              1440×1280                  │
│                                         │
└─────────────────────────────────────────┘
```

## Hero.vue Instance Selection Implementation

```typescript
// src/components/Hero.vue

// Watch viewport changes for responsive instance selection
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

// Selected instance based on current viewport + height setting
const selectedInstance = computed(() => {
  return selectHeroInstance(
    props.heightTmp as HeightTmp,
    viewportWidth.value,
    viewportHeight.value
  )
})

// Get dimensions for the selected instance
const instanceDimensions = computed(() => {
  return getHeroInstanceDimensions(selectedInstance.value)
})

// Get shape data for the current instance
const currentShapeData = computed(() => {
  if (!effectiveImageData.value) return null
  return effectiveImageData.value[selectedInstance.value] || null
})

// Responsive listener
onMounted(() => {
  const handleResize = () => {
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})
```

## Cloudinary URL Building

When images use Cloudinary adapter, URLs are transformed for optimal delivery:

```typescript
function buildImageUrl(
  shape: ShapeData, 
  targetWidth: number, 
  targetHeight: number
): string {
  const baseUrl = shape.url
  
  if (baseUrl.includes('cloudinary.com') || baseUrl.includes('/cloudinary/')) {
    // Insert transformation parameters
    return baseUrl.replace(
      /\/upload\//,
      `/upload/w_${targetWidth},h_${targetHeight},c_fill,f_auto,q_auto/`
    )
  }
  
  // Local adapter: append query params
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}w=${targetWidth}&h=${targetHeight}`
}
```

## TextImageHeader Instance Selection

For columns layout, vertical/square instances are preferred:

```typescript
// src/components/TextImageHeader.vue

const bestShapeInstance = computed(() => {
  if (!props.imageData) return null
  
  // Priority order for side-column image
  const priority = [
    props.imageData.hero_vertical,    // Best: tall portrait
    props.imageData.hero_square,      // Good: square
    props.imageData.hero_square_xl,   // Large square
    props.imageData.hero_wide,        // Fallback: landscape
    props.imageData.hero_wide_xl
  ]
  
  return priority.find(shape => shape?.url) || null
})
```

## BlurHash Loading Sequence

```
1. Component mounts
   │
2. Is there a blur hash?
   ├─ YES → Decode to canvas → Show as placeholder
   └─ NO  → Show empty or fallback color
   │
3. Select appropriate instance based on viewport
   │
4. Build optimized URL for instance
   │
5. Create Image() and preload
   │
6. onload → Swap background to full image
   │
7. Resize event → Re-evaluate instance selection
   │
8. If instance changed → Reload new instance
```

## CSS Height Classes

```css
/* Hero height based on headerSize prop */
.hero-full {
  height: 100vh;
  min-height: 40rem;
}

.hero-prominent {
  height: 75vh;
  min-height: 28rem;
}

.hero-medium {
  height: 50vh;
  min-height: 21rem;
}

.hero-mini {
  height: 25vh;
  min-height: 14rem;
}

/* TextImageHeader uses same scale */
.text-image-header-full { min-height: 100vh; }
.text-image-header-prominent { min-height: 75vh; }
.text-image-header-medium { min-height: 50vh; }
.text-image-header-mini { min-height: 25vh; }
```

## Mobile Responsive Breakpoints

```css
/* Mobile: Stack columns, reduce heights */
@media (max-width: 767px) {
  .hero-full,
  .hero-prominent {
    height: auto;
    min-height: 50vh;  /* Reduced on mobile */
  }
  
  .text-image-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .text-image-media {
    order: 1;      /* Image on top */
    min-height: 40vh;
  }
  
  .text-image-content {
    order: 2;      /* Text below */
  }
}
```

## Performance Considerations

1. **Instance Selection is Memoized**
   - `selectedInstance` computed only recalculates on viewport/height change

2. **Image Preloading**
   - Full image is preloaded before swapping background
   - Prevents flash of loading state

3. **BlurHash Placeholder**
   - 32×32 canvas provides instant visual feedback
   - Negligible performance cost

4. **Resize Debouncing**
   - Consider debouncing resize handler for frequent viewport changes

5. **Retina Support**
   - URLs request 2x dimensions for high-DPI displays
   - `buildImageUrl(shape, width * 2, height * 2)`
