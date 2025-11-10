# Demo Visual Indicators Implementation

**Date:** November 10, 2025  
**Status:** ✅ Complete

## Overview

Implemented two visual indicator systems to improve UX during the transition from deprecated image fields (`cimg`) to modern JSONB fields (`img_wide`), and to clearly identify demo content.

## 1. CornerBanner Component

### Purpose
Provides a rotated 45° banner overlay for visual context indicators (e.g., "demo mode", warnings).

### Implementation
**File:** `/src/components/CornerBanner.vue`

**Props:**
- `text` (string, default: 'demo') - Banner text content
- `color` (string, default: 'var(--color-warning-bg)') - Background color
- `size` ('full' | 'small', default: 'full') - Size variant

**Size Variants:**
- **full**: 200px width, 0.5rem padding - for fullwidth components (hero, columns)
- **small**: 120px width, 0.25rem padding - for aside-left components

**Styling:**
- Position: absolute, top: 0, right: 0
- Transform: `rotate(45deg) translate(25%, -50%)`
- Transform-origin: top right
- Z-index: 5 (below post-its, above base content)
- Text: uppercase, bold, centered, white color
- Box shadow for depth

### Usage in BaseView
```vue
<div v-if="currentEvent" class="demo-hero" style="position: relative;">
    <CornerBanner v-if="viewMode === 'demo'" text="demo" />
    <!-- ... hero content ... -->
</div>
```

**Behavior:** Appears only when `viewMode === 'demo'` on the events hero section.

## 2. Hero Image Warning System

### Purpose
Smart image handling that:
1. Shows deprecated `cimg` field usage with prominent warning
2. Generates modern URLs from `img_wide` JSONB with upscaling
3. Supports Unsplash and Cloudinary image services

### Implementation
**File:** `/src/views/BaseView.vue`

#### Helper Functions (lines ~629-675)

**`getHeroImage(event)`**
Returns `{ url: string, isDeprecated: boolean }`

Priority logic:
1. **If `event.cimg` exists:** Return cimg URL with `isDeprecated: true`
2. **If `event.img_wide` exists:** Parse JSONB and generate URL with `isDeprecated: false`
3. **Otherwise:** Return empty URL

```typescript
const getHeroImage = (event: any): { url: string; isDeprecated: boolean } => {
    if (event.cimg) {
        return { url: event.cimg, isDeprecated: true }
    }

    if (event.img_wide) {
        try {
            const imgData = typeof event.img_wide === 'string' 
                ? JSON.parse(event.img_wide) 
                : event.img_wide
            const url = generateImageUrl(imgData, 900, 450)
            return { url, isDeprecated: false }
        } catch (e) {
            console.error('Failed to parse img_wide:', e)
            return { url: '', isDeprecated: false }
        }
    }

    return { url: '', isDeprecated: false }
}
```

**`generateImageUrl(imgData, width, height)`**
Generates optimized image URLs with size parameters.

**Unsplash:**
```
https://images.unsplash.com/photo-{id}?w=900&h=450
```

**Cloudinary:**
```
https://res.cloudinary.com/{cloud}/image/upload/w_900,h_450/{id}
```

**Fallback:** Returns direct URL from `imgData.url`

#### Template Update (lines ~113-142)

```vue
<div v-if="getHeroImage(currentEvent).url" class="hero-image-container">
    <img :src="getHeroImage(currentEvent).url" :alt="currentEvent.name" />
    
    <!-- Big Warning Icon for Deprecated cimg -->
    <div v-if="getHeroImage(currentEvent).isDeprecated" 
         class="hero-warning-icon" 
         title="Using deprecated cimg field">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7v6m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>
</div>
```

#### CSS Styling (lines ~1357-1398)

**`.hero-image-container`:**
- Position: relative
- Width: 100%, Height: 16rem
- Overflow: hidden
- Image object-fit: cover

**`.hero-warning-icon`:**
- Position: absolute, top: 1rem, right: 1rem
- Size: 64px × 64px (large for visibility)
- Background: var(--color-warning-bg)
- Border-radius: 50% (circular)
- Z-index: 10 (above image, below post-its)
- Box shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`
- Cursor: help (shows tooltip)
- SVG icon: 40px × 40px, white color

## Image Upscaling

**Target Dimensions:** 900px × 450px (2:1 aspect ratio)

All hero images are automatically upscaled/optimized to consistent dimensions regardless of source (Unsplash, Cloudinary, or direct URL).

## Visual Hierarchy (Z-Index Layers)

```
Base content:       z-index: 0
CornerBanner:       z-index: 5
Warning icon:       z-index: 10
Post-its:           z-index: 10+
```

## Future Extension

This pattern can be applied to other entity heroes:
- **Instructors hero**: `instructor.cimg` → `instructor.img_wide`
- **Posts hero**: `post.cimg` → `post.img_wide`  
- **Projects hero**: `project.cimg` → `project.img_wide`

The helper functions can be extracted into a shared composable:
```typescript
// composables/useHeroImage.ts
export const useHeroImage = (width = 900, height = 450) => {
    // getHeroImage and generateImageUrl logic
}
```

## Testing Scenarios

1. **Demo Mode + Deprecated cimg:**
   - ✅ CornerBanner appears (rotated, top-right)
   - ✅ Image loads from cimg URL
   - ✅ Large warning icon appears (64px, amber circle)
   - ✅ Tooltip shows "Using deprecated cimg field"

2. **Demo Mode + Modern img_wide:**
   - ✅ CornerBanner appears
   - ✅ Image loads from generated URL (Unsplash/Cloudinary)
   - ✅ No warning icon
   - ✅ URL includes w=900&h=450 parameters

3. **Project/New Mode:**
   - ✅ No CornerBanner
   - ✅ Warning icon still appears if using cimg
   - ✅ Image generation works correctly

4. **No Image:**
   - ✅ Hero section renders without image
   - ✅ Content (title, teaser, dates) still displays

## Related Files

- `/src/components/CornerBanner.vue` - Banner component
- `/src/views/BaseView.vue` - Integration and hero logic
- `/src/components/clist/ItemRow.vue` - List item warning icons
- `/src/components/clist/ItemTile.vue` - Tile warning icons
- `/src/components/clist/ItemCard.vue` - Card warning icons

## Migration Strategy

1. **Phase 1 (Current):** Visual warnings for deprecated fields
2. **Phase 2:** Data migration tools to convert cimg → img_wide
3. **Phase 3:** Remove cimg field support entirely
4. **Phase 4:** Clean up warning systems

The visual indicators provide a gentle migration path, allowing users to identify and update deprecated content at their own pace.
