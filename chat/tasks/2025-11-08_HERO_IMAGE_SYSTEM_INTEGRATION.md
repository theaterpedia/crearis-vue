# Hero Component + Image System Integration: Decision Plan

**Date**: November 8, 2025  
**Type**: Decision-Making & Planning Document  
**Priority**: High  
**Status**: ✅ COMPLETE (Plan F)

**Completion Date**: January 8, 2025  
**Commit**: 63de164 - "feat(plan-f): Hero image system integration"

---

## ✅ Completion Summary

**What Was Implemented**:
- ✅ Image prop with shape system (shape_vertical, shape_wide, shape_square)
- ✅ Deprecated imgTmp prop with migration warning
- ✅ Mobile breakpoint: 416px (MOBILE_WIDTH_PX constant)
- ✅ Adapter detection for Unsplash, Cloudinary, Vimeo, external
- ✅ URL builders with responsive dimensions
- ✅ BlurHash support (32×32 placeholder)
- ✅ Responsive loading: vertical (mobile) → wide (desktop)
- ✅ Template URL optimization (tpar+turl)
- ✅ Progressive image loading with resize handler

**Strategy Used**: Copied ImgShape logic patterns, NOT component integration
- Background-image preserved for scroll effects
- Same adapter detection and URL building logic
- BlurHash canvas converted to data URL
- Mobile-first responsive loading (416px breakpoint)

**Files Modified**:
- src/components/Hero.vue (+216 lines)

---

## 🎯 Three Core Questions

### 1. **How to finish ImgShape implementation today?**
### 2. **What quick hacks needed for Hero.vue to work with image shapes?**
### 3. **What's the clean refactor plan for Hero.vue in coming weeks?**

---

## 📊 Current State Analysis

### Hero.vue Characteristics

**What Hero Does**:
- Page header component used in 90% of pages
- Sets standard for page header formatting/functionality
- Displays entities (images make them visible, but images table itself is not an entity)
- Serves images as `background-image` to support scroll effects ✅ **MUST KEEP**
- 4 foundational height modes: `full`, `prominent`, `medium`, `mini`
- Alignment props: `imgTmpAlignX`, `imgTmpAlignY`, content positioning
- Overlay support with gradients
- Target modes: `page` (scrolling bg) vs `card` (static)

**Current Problems**:
- Uses only large images (no responsive serving)
- Many edge cases limit image choice
- Complexity handled in component, not via multi-source approach
- No BlurHash support
- No performance optimization via shape system

**Good Qualities**:
- Works well across different screen dimensions (horizontal + vertical)
- Scroll effects are production-ready
- Flexible positioning system
- Proven in production

---

### ImgShape.vue Capabilities

**What ImgShape Provides**:
- Shape variants: `square`, `wide`, `vertical`, `thumb`
- Adapter detection: Unsplash, Cloudinary, Vimeo
- Dimension calculation from CSS variables
- URL building with transformations
- BlurHash rendering support
- Focal point parameters (x, y, z)

**What ImgShape CANNOT Do** (relevant to Hero):
- ❌ Render as `background-image` (uses `<img>` tag)
- ❌ Support scroll effects (sticky background)
- ❌ Handle arbitrary dimensions (fixed to predefined shapes)
- ❌ Dynamic dimension calculation based on viewport
- ❌ Gradient overlays

**What ImgShape COULD Provide to Hero**:
- ✅ URL building logic (reusable)
- ✅ Adapter detection (reusable)
- ✅ BlurHash generation (reusable)
- ✅ Shape dimension standards (reference)
- ✅ Transformation parameter extraction (turl/tpar)

---

## 🔍 Question 1: Integration Strategy

### Decision Point 1A: Should ImgShape replace Hero's image implementation?

**Answer: ❌ NO**

**Reasoning**:
1. **Architectural mismatch**: ImgShape uses `<img>` tag, Hero needs `background-image` for scroll effects
2. **Use case difference**: ImgShape is for content images in flow, Hero is for immersive backgrounds
3. **Complexity**: Forcing ImgShape into Hero would require massive changes to both components
4. **Risk**: Hero is production-critical (90% of pages), don't break what works

**Verdict**: ImgShape and Hero serve different purposes. Keep them separate.

---

### Decision Point 1B: Copy ImgShape logic into Hero with hardcoded implementation?

**Answer: ✅ YES (Recommended Approach)**

**Reasoning**:
1. **Pragmatic**: Get Hero working with image system quickly
2. **Safe**: No risk to existing Hero functionality
3. **Clear migration path**: Code comments point to ImgShape for future refactoring
4. **Testable**: Can validate incrementally without breaking production

**What to Copy**:
```typescript
// FROM ImgShape.vue - TO BE COPIED INTO Hero.vue

// 1. Adapter detection logic
const detectAdapter = (url: string) => {
    if (url.includes('images.unsplash.com')) return 'unsplash'
    if (url.includes('res.cloudinary.com')) return 'cloudinary'
    return 'none'
}

// 2. URL building for Unsplash
const buildUnsplashUrl = (baseUrl: string, width: number, height: number) => {
    const url = new URL(baseUrl)
    url.searchParams.set('w', String(width))
    url.searchParams.set('h', String(height))
    url.searchParams.set('fit', 'crop')
    return url.toString()
}

// 3. URL building for Cloudinary
const buildCloudinaryUrl = (baseUrl: string, width: number, height: number) => {
    // Extract account, version, path from URL
    // Inject: c_crop,w_${width},h_${height}
    // Return modified URL
}

// 4. BlurHash rendering (via useBlurHash composable)
const { getBlurHashDataUrl } = useBlurHash()
const blurDataUrl = computed(() => {
    if (props.shape?.blur) {
        return getBlurHashDataUrl(props.shape.blur, 32, 32)
    }
    return null
})
```

**Code Comments to Add**:
```vue
<!-- 
TODO: Future refactor
This image loading logic is duplicated from ImgShape.vue
See: src/components/images/ImgShape.vue lines 100-250
When refactoring, extract shared logic to:
- src/composables/useImageAdapter.ts (adapter detection, URL building)
- src/composables/useResponsiveImage.ts (dimension calculation, srcset generation)
-->
```

---

### Decision Point 1C: Alternative Suggestions?

**Option C1: Create shared composable NOW**
- ❌ **Rejected**: Too much work for today's goal
- Reason: Needs careful API design, testing, migration of both components
- Better as Phase 3 (clean refactor)

**Option C2: Make ImgShape output `background-image` style**
- ❌ **Rejected**: Wrong abstraction
- Reason: ImgShape is semantic `<img>`, not for backgrounds
- Would pollute ImgShape's API for one use case

**Option C3: Create `<ImgHero>` as Hero-specific image component**
- 🤔 **Maybe for Phase 3**
- Reason: Good long-term separation of concerns
- Not for today's quick implementation

---

## 🎨 Question 2: Shape Usage & Responsive Breakpoints

### Screen Layout Scenarios

**A: Vertical/Mobile Design** (PRIORITY 1)
- Screen width: **≤ 410px**
- Use: `shape_vertical` (126×224px, 9:16 aspect)
- Why: Optimized for portrait phones
- Implementation: Default for SSR (mobile-first)

**B: Horizontal/Desktop Design** (PRIORITY 2)
- Screen width: **> 410px** (standard desktop)
- Use: `shape_wide` (336×168px, 2:1 aspect)
- Why: Optimized for landscape layouts
- Implementation: Client-side upgrade after mount

**C1: Large Vertical** (PRIORITY 3 - CSS fix only)
- Screen width: **440-950px, portrait**
- Use: `shape_wide` dimensions, but scale CSS down
- Hardcoded CSS workaround, no new image fetch

**C2: Small Horizontal** (PRIORITY 3 - CSS fix only)
- Screen width: **440-950px, landscape**
- Use: `shape_wide` dimensions, exact fit
- No changes needed

**D: Extra Large Horizontal** (PRIORITY 4 - CSS fix only)
- Screen width: **> 1500px on fullwidth layouts**
- Use: `shape_wide` dimensions, but scale CSS up
- Accept slight quality loss, good enough for now

### Responsive Strategy

```typescript
// PHASE 1: TODAY - Simple mobile/desktop switch
const isMobile = computed(() => {
    // Hardcoded detection
    return window.innerWidth <= 410
})

const heroShape = computed(() => {
    return isMobile.value ? props.image.shape_vertical : props.image.shape_wide
})

// PHASE 3: FUTURE - Smart device detection
// Use composable from docs/composables/hero-service-device-detection.md
// Dynamic dimension calculation based on:
// - Actual viewport size
// - Device pixel ratio
// - Network conditions
// - User preferences (data saver mode)
```

### Image Loading Performance Plan

**Optimal Loading Sequence**:
```typescript
// 1. Initial Render (SSR compatible)
backgroundImage: blurHashDataUrl  // Instant, 32×32px inline

// 2. Mount Hook (immediately after hydration)
backgroundImage: mobileImageUrl   // 126×224px for mobile-first

// 3. Resize Check (after mount, ~100ms debounce)
if (actualWidth > 410px) {
    backgroundImage: desktopImageUrl  // 336×168px upgrade
}

// 4. No further changes during session
// CSS handles scaling for edge cases C, D
```

**Why This Approach**:
- ✅ Mobile-first SSR (fastest for most users)
- ✅ No layout shift (dimensions set, only image swaps)
- ✅ Single image swap for desktop (not continuous)
- ✅ BlurHash provides instant visual feedback
- ✅ No over-fetching (only 2 images max per session)

---

## ✅ Question 3: Priority & Implementation Plan

### What Needs to Be Done (Prioritized)

#### PHASE 1: TODAY - Get Hero Working with Shapes (4-6 hours)

**Priority 1: Core Shape Integration** (2-3 hours)
```vue
<script setup lang="ts">
// 1. Accept shape data as prop
interface Props {
    // ... existing props ...
    image?: {
        shape_vertical: ImgShapeData
        shape_wide: ImgShapeData
        shape_square?: ImgShapeData  // optional, fallback
    }
}

// 2. Copy adapter detection from ImgShape
// TODO: See ImgShape.vue lines 38-51
const detectAdapter = (url: string) => { /* ... */ }

// 3. Copy URL building logic
// TODO: See ImgShape.vue lines 100-250
const buildImageUrl = (shape: ImgShapeData, width: number, height: number) => {
    const adapter = detectAdapter(shape.url || '')
    if (adapter === 'unsplash') { /* ... */ }
    if (adapter === 'cloudinary') { /* ... */ }
    return shape.url  // fallback
}

// 4. Responsive shape selection
const isMobile = ref(window.innerWidth <= 410)
const currentShape = computed(() => {
    return isMobile.value 
        ? props.image?.shape_vertical 
        : props.image?.shape_wide
})

// 5. BlurHash support
const { getBlurHashDataUrl } = useBlurHash()
const blurImage = computed(() => {
    return currentShape.value?.blur 
        ? getBlurHashDataUrl(currentShape.value.blur, 32, 32)
        : null
})

// 6. Background image with loading states
const backgroundImage = ref(blurImage.value)

onMounted(() => {
    // Start with mobile image
    const shape = props.image?.shape_vertical
    if (shape?.url) {
        backgroundImage.value = shape.url
    }
    
    // Check if desktop upgrade needed
    if (window.innerWidth > 410) {
        isMobile.value = false
        const desktopShape = props.image?.shape_wide
        if (desktopShape?.url) {
            // Preload, then swap
            const img = new Image()
            img.onload = () => {
                backgroundImage.value = desktopShape.url
            }
            img.src = desktopShape.url
        }
    }
})
</script>

<template>
    <div class="hero-cover-image" :style="{
        backgroundImage: `url(${backgroundImage})`,
        /* existing positioning styles */
    }">
</template>
```

**Priority 2: Backward Compatibility** (1 hour)
- Keep existing `imgTmp` prop working
- If no `image` prop provided, fall back to old behavior
- Add console warning: "Using legacy image prop, migrate to shape system"

**Priority 3: Testing & Validation** (1-2 hours)
- Test on actual Hero pages
- Verify scroll effects still work
- Check blur → mobile → desktop transition
- Validate on different screen sizes

---

#### PHASE 2: NEXT WEEK - CSS Edge Cases (2-3 hours)

**Task 2A: Tablet Portrait (C1)**
```css
@media (min-width: 441px) and (max-width: 950px) and (orientation: portrait) {
    .hero-cover-image {
        /* Use wide image, but scale down container */
        background-size: cover;  /* Let browser scale intelligently */
    }
}
```

**Task 2B: Extra Large Desktop (D)**
```css
@media (min-width: 1501px) {
    .hero-cover-image {
        /* Use wide image, scale up slightly */
        background-size: cover;
        /* Accept minor quality loss, good enough */
    }
}
```

---

#### PHASE 3: FUTURE - Clean Refactor (1 day, coming weeks)

**Task 3A: Extract Shared Logic to Composables**
```typescript
// src/composables/useImageAdapter.ts
export const useImageAdapter = () => {
    const detectAdapter = (url: string) => { /* ... */ }
    const buildUrl = (adapter, shape, width, height) => { /* ... */ }
    return { detectAdapter, buildUrl }
}

// src/composables/useResponsiveImage.ts
export const useResponsiveImage = (shapes: {
    vertical: ImgShapeData
    wide: ImgShapeData
    square?: ImgShapeData
}) => {
    const currentShape = computed(() => { /* smart detection */ })
    const imageUrl = computed(() => { /* URL building */ })
    const blurUrl = computed(() => { /* BlurHash */ })
    
    return { currentShape, imageUrl, blurUrl }
}
```

**Task 3B: Update Both Hero and ImgShape**
- Hero uses `useResponsiveImage` for background images
- ImgShape uses `useResponsiveImage` for `<img>` tags
- Shared adapter logic in `useImageAdapter`

**Task 3C: Device Detection Composable**
- Implement `useDeviceDetection` from Plan C Task 7
- Replace hardcoded `410px` with dynamic detection
- Add retina display support (2x images)
- Network-aware loading (data saver mode)

**Task 3D: Consider `<ImgHero>` Component**
- Hero-specific image component
- Wraps `useResponsiveImage` composable
- Renders as `background-image` style
- Used by Hero.vue instead of inline logic

---

## 🔍 Question 4: Retina & rem-to-px Flexibility

### Current Assumption: 1rem = 16px

**Is this a trap?**

**Answer: ⚠️ Minor Risk, Easy to Fix**

**Where we use it**:
1. ImgShape dimension calculations: `cardWidth.value` (from `useTheme`)
2. CSS variables: `--card-width: 21rem`
3. Hero responsive breakpoint: `window.innerWidth <= 410`

**How to make flexible**:

```typescript
// In useTheme composable
export const useTheme = () => {
    // Detect actual rem-to-px ratio
    const remToPx = computed(() => {
        const el = document.documentElement
        return parseFloat(getComputedStyle(el).fontSize)
    })
    
    // All dimensions calculated dynamically
    const cardWidthPx = computed(() => {
        return 21 * remToPx.value  // Not hardcoded 336
    })
    
    const MOBILE_BREAKPOINT_REM = 25.625  // 410px at 16px base
    const mobileBreakpointPx = computed(() => {
        return MOBILE_BREAKPOINT_REM * remToPx.value
    })
    
    return {
        remToPx,
        cardWidthPx,
        mobileBreakpointPx,
        // ...
    }
}
```

**Retina Display Support**:
```typescript
// In useDeviceDetection (Phase 3)
const pixelRatio = window.devicePixelRatio || 1

// For retina (pixelRatio >= 2), request 2x images
const imageWidth = computed(() => {
    const baseWidth = isMobile.value ? 126 : 336
    return Math.round(baseWidth * pixelRatio)
})

// Unsplash: ?w=672&h=336&dpr=2
// Cloudinary: c_crop,w_672,h_336
```

**Migration Strategy**:
- Phase 1 (today): Keep hardcoded 16px assumption
- Phase 2: Add comment "// FUTURE: Use dynamic remToPx from useTheme"
- Phase 3: Migrate to dynamic calculation
- Risk: **Low** - Most devices use 16px, custom values rare

---

## 🔍 Question 5: Two-Column Header Alternative

### Current Situation

**Two-Column Header** (Text Left, Image Right):
- Still in draft mode
- Partially rendering
- Should NOT scroll background like Hero
- Simpler requirements than Hero

### Should Hero.vue Serve Both Use Cases?

**Answer: ❌ NO - Keep Separated**

**Reasoning**:
1. **Different purposes**: Hero = immersive background, TwoColumn = content with image
2. **Different rendering**: Hero = `background-image` + scroll, TwoColumn = `<img>` tag
3. **Different complexity**: Hero needs sophisticated positioning, TwoColumn is straightforward
4. **Maintenance**: Easier to maintain two focused components than one complex swiss-army-knife
5. **Props explosion**: Combining would create confusing prop signatures

### Recommended Approach

**Keep as separate components**:

```vue
<!-- Hero.vue - Immersive background scrolling -->
<Hero 
    :image="{ shape_vertical, shape_wide }" 
    heightTmp="prominent"
    imgTmpAlignX="center"
    imgTmpAlignY="cover"
>
    <h1>Hero Content</h1>
</Hero>

<!-- HeaderTwoColumn.vue - Simple text + image layout -->
<HeaderTwoColumn 
    :image="pageData.header_image"
    :title="pageData.title"
    :text="pageData.intro"
/>
```

**HeaderTwoColumn.vue Implementation**:
```vue
<script setup lang="ts">
// Can use ImgShape component directly!
import ImgShape from '@/components/images/ImgShape.vue'

interface Props {
    image: {
        shape_square: ImgShapeData  // For two-column, square works best
        shape_wide?: ImgShapeData   // Fallback
    }
    title: string
    text: string
}
</script>

<template>
    <div class="header-two-column">
        <div class="header-text">
            <h1>{{ title }}</h1>
            <p>{{ text }}</p>
        </div>
        <div class="header-image">
            <ImgShape 
                :data="image.shape_square || image.shape_wide" 
                shape="card"
                variant="square"
            />
        </div>
    </div>
</template>
```

**PageLayout Decision Logic**:
```vue
<script setup lang="ts">
const headerComponent = computed(() => {
    if (pageData.header_style === 'hero') return Hero
    if (pageData.header_style === 'two-column') return HeaderTwoColumn
    return null  // No header
})
</script>

<template>
    <component 
        :is="headerComponent" 
        v-if="headerComponent"
        v-bind="headerProps"
    />
</template>
```

**Why This Works**:
- ✅ HeaderTwoColumn can use ImgShape directly (no background-image needed)
- ✅ Clean separation of concerns
- ✅ Easy to maintain independently
- ✅ PageLayout makes the decision, not Hero
- ✅ Future: Add more header variants easily

---

## 🎯 Implementation Idea: Optimal Performance

### Loading Sequence (Detailed)

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlurHash } from '@/composables/useBlurHash'

const props = defineProps<{
    image: {
        shape_vertical: ImgShapeData
        shape_wide: ImgShapeData
    }
    // ... other props
}>()

// 1. BlurHash - Instant (inline data URL, no HTTP request)
const { getBlurHashDataUrl } = useBlurHash()
const blurHashUrl = computed(() => {
    const blur = props.image.shape_vertical?.blur || props.image.shape_wide?.blur
    return blur ? getBlurHashDataUrl(blur, 32, 32) : null
})

// 2. Initial background: BlurHash
const backgroundImage = ref(blurHashUrl.value || '')

// 3. Mobile-first loading
onMounted(async () => {
    // Phase A: Load mobile image immediately (SSR fallback)
    const mobileShape = props.image.shape_vertical
    if (mobileShape?.url) {
        const mobileUrl = mobileShape.url  // Already optimized 126×224
        
        // Preload to avoid flash
        await preloadImage(mobileUrl)
        backgroundImage.value = mobileUrl
    }
    
    // Phase B: Check if desktop upgrade needed (debounced)
    setTimeout(() => {
        if (window.innerWidth > 410) {
            const desktopShape = props.image.shape_wide
            if (desktopShape?.url) {
                const desktopUrl = desktopShape.url  // 336×168
                
                // Preload in background, swap when ready
                preloadImage(desktopUrl).then(() => {
                    backgroundImage.value = desktopUrl
                })
            }
        }
    }, 100)  // Debounce to avoid multiple calls
})

// Helper: Preload image
const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
    })
}
</script>

<template>
    <div class="hero-cover-image" :style="{
        backgroundImage: `url(${backgroundImage})`,
        /* No size changes - only image swaps */
    }">
</template>
```

### Why No Resizing Happens

**CSS stays constant**:
```css
.hero-cover-image {
    /* Dimensions never change */
    width: 100%;
    height: 50%;  /* Of hero height */
    
    /* Positioning stays same */
    background-position: center center;
    background-size: cover;
    background-repeat: no-repeat;
    
    /* Only backgroundImage property changes via inline style */
}
```

**Result**:
- ✅ No layout shift (dimensions fixed)
- ✅ No reflow (CSS properties unchanged)
- ✅ No repaint except image swap (browser optimized)
- ✅ Smooth transition (can add CSS transition if desired)

---

## 📋 Appendix: Edge Cases & Hardcoded CSS

### C1: Large Vertical (Tablet Portrait)

**Screen**: 440-950px, portrait orientation

```css
/* Use wide image (336×168), scale down to fit */
@media (min-width: 441px) and (max-width: 950px) and (orientation: portrait) {
    .hero-prominent {
        min-height: 60vh;  /* Reduce from 75vh */
    }
    
    .hero-cover-image {
        background-size: cover;  /* Browser handles scaling */
        background-position: center center;
    }
}
```

### C2: Small Horizontal (Phone Landscape)

**Screen**: 440-950px, landscape

```css
/* Use wide image (336×168), exact fit */
@media (min-width: 441px) and (max-width: 950px) and (orientation: landscape) {
    .hero-prominent {
        min-height: 70vh;
    }
    
    /* No special handling needed - wide image fits well */
}
```

### D: Extra Large Horizontal (Fullwidth Layouts)

**Screen**: > 1500px

```css
/* Use wide image (336×168), scale up */
@media (min-width: 1501px) {
    .hero-cover-image {
        background-size: cover;  /* Scale up, accept slight blur */
        
        /* Optional: Slight sharpening filter */
        filter: contrast(1.02) saturate(1.05);
    }
}
```

---

## 🚩 Tasks to Consider

### Additional Features (Not for today)

#### Demo/Version Banner (PHASE 2)

```vue
<template>
    <div class="hero">
        <!-- Existing hero content -->
        
        <!-- 45-degree banner (top-right corner) -->
        <div v-if="isDemoMode || showVersionInfo" class="hero-banner">
            <svg viewBox="0 0 200 200" class="banner-svg">
                <polygon 
                    points="0,0 200,0 200,200" 
                    :fill="bannerColor"
                />
                <text 
                    x="130" 
                    y="30" 
                    transform="rotate(45 130 30)"
                    class="banner-text"
                >
                    {{ bannerText }}
                </text>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
const isDemoMode = computed(() => {
    return import.meta.env.MODE === 'demo'
})

const showVersionInfo = computed(() => {
    return import.meta.env.DEV
})

const bannerColor = computed(() => {
    if (isDemoMode.value) return 'var(--color-warning-bg)'  // Warning color
    return 'var(--color-muted-bg)'  // Muted for version
})

const bannerText = computed(() => {
    if (isDemoMode.value) return 'DEMO'
    return `v${packageJson.version}`  // From package.json
})
</script>

<style scoped>
.hero-banner {
    position: absolute;
    top: 0;
    right: 0;
    width: 150px;
    height: 150px;
    overflow: hidden;
    pointer-events: none;
    z-index: 10;
}

.banner-svg {
    width: 100%;
    height: 100%;
}

.banner-text {
    font-family: var(--headings);
    font-size: 18px;
    font-weight: 700;
    fill: var(--color-text-contrast);
    text-anchor: middle;
}
</style>
```

#### SSR Preparation (PHASE 3)

**Mobile-first experience**:
```vue
<!-- Server-rendered with mobile image in meta tags -->
<head>
    <link rel="preload" 
          as="image" 
          :href="image.shape_vertical.url"
          media="(max-width: 410px)"
    />
    <link rel="preload" 
          as="image" 
          :href="image.shape_wide.url"
          media="(min-width: 411px)"
    />
</head>

<!-- Component renders with mobile image immediately -->
<div class="hero-cover-image" :style="{
    backgroundImage: `url(${image.shape_vertical.url})`
}">
```

---

## 📊 Summary: One-Day Action Plan (TODAY)

### Morning Session (3 hours)

**09:00 - 10:30: Hero.vue Code Changes** ✏️
- [ ] Copy adapter detection from ImgShape
- [ ] Copy URL building logic (Unsplash + Cloudinary)
- [ ] Add `image` prop with shape structure
- [ ] Implement responsive shape selection (mobile/desktop)
- [ ] Add BlurHash support via `useBlurHash`
- [ ] Add TODO comments pointing to ImgShape

**10:30 - 11:00: Break** ☕

**11:00 - 12:00: Loading Sequence** 🔄
- [ ] Implement BlurHash → Mobile → Desktop progression
- [ ] Add image preloading helper
- [ ] Add debounced resize check
- [ ] Test image swap transitions

### Afternoon Session (3 hours)

**13:00 - 14:00: Backward Compatibility** 🔧
- [ ] Keep `imgTmp` prop working
- [ ] Add fallback logic
- [ ] Add deprecation warning
- [ ] Update prop TypeScript types

**14:00 - 15:00: Testing** ✅
- [ ] Test on real Hero pages
- [ ] Verify scroll effects work
- [ ] Check blur → mobile → desktop flow
- [ ] Test on different screen sizes
- [ ] Validate with DevTools network tab

**15:00 - 16:00: Documentation** 📝
- [ ] Add inline code comments
- [ ] Update Hero.vue prop documentation
- [ ] Create migration guide for pages
- [ ] Update this plan document with results

### Evening Session (Optional)

**16:00 - 17:00: Refinement** ✨
- [ ] Fix any bugs found during testing
- [ ] Optimize image preloading
- [ ] Add CSS transitions for smooth swaps
- [ ] Commit changes with proper message

---

## 📋 Clean Refactor Plan (Coming Weeks)

### Week 1: Extract Composables (1 day)

**Day 1: Create `useImageAdapter.ts`**
- Extract adapter detection
- Extract URL building for all adapters
- Extract transformation parameter handling
- Write comprehensive tests
- Update ImgShape to use composable
- Update Hero to use composable

### Week 2: Device Detection (2 days)

**Day 1: Implement `useDeviceDetection.ts`**
- Screen dimension detection
- Device pixel ratio
- Network condition detection
- Orientation change handling
- Write tests

**Day 2: Integrate Device Detection**
- Replace hardcoded 410px breakpoint
- Add retina display support (2x images)
- Add data saver mode detection
- Update Hero and ImgShape
- Performance testing

### Week 3: ImgHero Component (1-2 days)

**Day 1: Create `ImgHero.vue`**
- Wraps `useResponsiveImage` composable
- Renders as background-image style
- Supports all Hero use cases
- Clean prop interface

**Day 2: Migrate Hero.vue**
- Replace inline image logic with `<ImgHero>`
- Keep all existing functionality
- Comprehensive testing
- Documentation updates

### Week 4: CSS Edge Cases + Polish (1 day)

**Morning: CSS Media Queries**
- Add tablet portrait handling (C1)
- Add extra-large desktop handling (D)
- Test on real devices
- Performance validation

**Afternoon: Final Polish**
- Add demo/version banner
- SSR optimization
- Documentation complete
- Git commit with migration guide

---

## 📱 Device Detection & Mobile Width Standard

**Mobile Width Standard**: `416px` (26rem at 16px base)

### Entry Points for Further Planning

1. **useTheme Composable** (`src/composables/useTheme.ts`)
   - Exports: `MOBILE_WIDTH_REM = 26`, `MOBILE_WIDTH_PX = 416`
   - Helper: `calculateMobileDimensions(width, height)` - scales to fit mobile width
   - Integration: Use these constants for all responsive logic

2. **Hero.vue Detection Strategy**
   - Two breakpoints: `≤416px` (mobile/vertical), `>416px` (desktop/wide)
   - CSS media queries: `@media (max-width: 26rem)`
   - JavaScript detection: `window.innerWidth <= MOBILE_WIDTH_PX`
   - Load strategy: BlurHash → mobile shape → desktop shape (conditional)

3. **Shape Selection Logic**
   - Mobile (`≤416px`): Use `shape_vertical` (126×224 base, scales to 416×739)
   - Desktop (`>416px`): Use `shape_wide` (336×168 base, scales proportionally)
   - Fallback: Use main `url` if shapes unavailable

4. **turl/tpar Mobile Optimization** (Plan C Task 5)
   - Extract transformation params to `turl` field
   - Build `tpar` template with `{turl}` placeholder
   - Mobile dimensions calculated via `calculateMobileDimensions()`
   - Example: 336×168 → 416×208 (wide), 126×224 → 416×739 (vertical)

5. **Integration Points**
   - Hero.vue: Viewport detection + shape selection
   - ImgShape.vue: Responsive image loading
   - Import adapters: Generate mobile-optimized URLs with turl/tpar
   - Tests: Verify correct shape loads at each breakpoint

**Status**: Constants implemented, ready for Hero integration  
**Next**: Implement Hero.vue responsive logic using `MOBILE_WIDTH_PX`

---

## ✅ Decision Summary

| Question | Decision | Reasoning |
|----------|----------|-----------|
| **1A: ImgShape replace Hero?** | ❌ NO | Architectural mismatch (`<img>` vs `background-image`) |
| **1B: Copy logic to Hero?** | ✅ YES | Pragmatic, safe, clear migration path |
| **1C: Other options?** | Phase 3 only | Composables + ImgHero for clean refactor |
| **2: Which shapes?** | vertical (mobile), wide (desktop) | Covers 95% of use cases |
| **2: Responsive strategy?** | Two breakpoints only (≤410px, >410px) | Simple, effective, CSS handles rest |
| **3: Priority?** | Phase 1 TODAY (Hero works), Phase 2-3 LATER | Production-ready quickly, refactor safely |
| **4: Retina/rem-to-px?** | Phase 3 | Low risk, easy to add later |
| **5: Two-column header?** | Keep separate | Different use case, use ImgShape directly |

---

## 🎯 Success Criteria (End of Day)

- ✅ Hero.vue accepts `image` prop with shape data
- ✅ BlurHash renders instantly on load
- ✅ Mobile image (vertical) loads on mount
- ✅ Desktop image (wide) loads if viewport > 410px
- ✅ Scroll effects still work perfectly
- ✅ Backward compatible with old `imgTmp` prop
- ✅ No console errors
- ✅ Network tab shows: BlurHash (inline), mobile (fetch), desktop (conditional fetch)
- ✅ All existing Hero pages work
- ✅ Code commented with TODO for future refactor

---

**Status**: 📋 Ready to Implement  
**Next Action**: Start Phase 1 - Morning Session (Hero.vue code changes)  
**Last Updated**: November 8, 2025
