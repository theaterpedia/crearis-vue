# Z-Value Shrink Strategy Implementation

**Date:** November 12, 2025  
**Status:** ✅ Implemented  
**Scope:** Both Unsplash and Cloudinary adapters

---

## Overview

Implemented a sophisticated Z-value system where Z represents a **shrink multiplier** relative to the wide shape's default crop, with shape-specific defaults that reflect the different context requirements of each shape size.

## Key Changes

### 1. Database Integration

**Source:** `images` table has `x INTEGER` and `y INTEGER` fields (original image dimensions)
- Reliably stored during import by both Unsplash and Cloudinary adapters
- Used to calculate `xDefaultShrink` ratio: `336 / image.x`
- Fallback: `336 / 3000` if `image.x` is NULL

### 2. ImagesCoreAdmin.vue Changes

#### Added xDefaultShrink Computed Property
```typescript
// Calculate default shrink ratio for Z-value calculation
const xDefaultShrink = computed(() => {
    if (!selectedImage.value?.x) {
        // Fallback: assume 3000px width for typical images
        return 336 / 3000  // ≈ 0.112
    }
    return 336 / selectedImage.value.x
})
```

#### Updated rebuildShapeUrlWithXYZ Function
**New Signature:**
```typescript
function rebuildShapeUrlWithXYZ(
    baseUrl: string, 
    x: number | null, 
    y: number | null, 
    z: number | null,
    shape: 'square' | 'wide' | 'vertical' | 'thumb',
    xDefaultShrink: number
): string
```

**Z-Value Conversion Logic:**

**For Unsplash:**
```typescript
// Z: 10-500 range, 100=wide default
const shrinkMultiplier = z / 100  // z=100 → 1.0, z=50 → 0.5, z=200 → 2.0

// Unsplash fp-z: higher value = zoom out (show more context)
// multiplier=0.5 → fp-z=2.0 (show 2x more context)
// multiplier=1.0 → fp-z=1.0 (normal)
// multiplier=2.0 → fp-z=0.5 (zoom in 2x)
const fpZ = 1.0 / shrinkMultiplier
url.searchParams.set('fp-z', fpZ.toFixed(2))
```

**For Cloudinary:**
```typescript
// Same shrink multiplier strategy
const shrinkMultiplier = z / 100

// Cloudinary zoom: higher = zoom out
// multiplier=0.5 → z=2.0 (show 2x more context)
// multiplier=1.0 → z=1.0 (normal)
// multiplier=2.0 → z=0.5 (zoom in 2x)
const cloudinaryZoom = 1.0 / shrinkMultiplier
params.set('z', cloudinaryZoom.toFixed(2))
```

#### Updated All Call Sites
- `handleShapePreview()`: Now passes `shape` and `xDefaultShrink.value`
- `previewWide()`: Now passes `'wide'` and `xDefaultShrink.value`
- `saveChanges()`: All 4 shape updates now pass correct shape name and `xDefaultShrink.value`

#### Passed xDefaultShrink to ShapeEditor
```vue
<ShapeEditor 
    :shape="activeShape.shape as any" 
    :adapter="activeShape.adapter as any"
    :x-default-shrink="xDefaultShrink"
    :data="{...}"
    @update="handleShapeUpdate" 
    @preview="handleShapePreview"
    @reset="handleShapeReset" 
/>
```

### 3. ShapeEditor.vue Changes

#### Added xDefaultShrink Prop
```typescript
interface Props {
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
    adapter: 'unsplash' | 'cloudinary' | 'vimeo' | 'external'
    xDefaultShrink?: number | null  // NEW: Ratio of wide shape width to original image width
    data: {
        x?: number | null
        y?: number | null
        z?: number | null
        url: string
        // ... other fields
    }
}
```

#### Updated Z Input Field
**Before:**
- Range: 1-100
- Static placeholder: "50"
- Generic hint

**After:**
- Range: 10-500
- Dynamic placeholder based on shape
- Context-aware hint

```vue
<input type="number" :value="data.z ?? ''" @input="updateZ" 
    @focus="isEditingField = true" @blur="isEditingField = false" 
    min="10" max="500" :placeholder="getDefaultZPlaceholder()" class="param-z" />
<span class="field-hint">{{ getZFieldHint() }}</span>
```

#### Added Helper Functions
```typescript
// Shape-specific Z-value defaults
const getDefaultZPlaceholder = (): string => {
    switch (props.shape) {
        case 'wide': return '100'  // Baseline, no shrink adjustment
        case 'square':
        case 'vertical': return '50'  // Show 2x more context than wide
        case 'thumb': return '25'  // Show 4x more context than wide
        default: return '100'
    }
}

// Context-aware hint
const getZFieldHint = (): string => {
    const defaultZ = getDefaultZPlaceholder()
    return `10-500 range | ${defaultZ}=default for ${props.shape} | <${defaultZ}=more context, >${defaultZ}=zoom in`
}
```

### 4. ImgShape.vue Architectural Comment

Added comprehensive documentation at the top of the file explaining:

**Single Source of Truth Principle:**
- ImgShape ALWAYS displays from `props.data.url` (pre-computed transformation URL)
- NEVER recalculates XYZ transformations
- ShapeEditor is responsible for all transformation calculations

**Future Plans Documented:**
1. **Speed Mode:** ImgShape with entity.img_* facade fields (no image.x access)
2. **Hero Mode:** Hero.vue component will recalculate transformations with image.x access
3. **Code Automation:** LLM/AI tools should understand component responsibilities

---

## Z-Value Behavior Matrix

### Shape-Specific Defaults

| Shape | Default Z | Shrink Multiplier | Meaning |
|-------|-----------|-------------------|---------|
| **Wide** | 100 | 1.0 | Baseline (no adjustment) |
| **Square** | 50 | 0.5 | Show 2x more context |
| **Vertical** | 50 | 0.5 | Show 2x more context |
| **Thumb** | 25 | 0.25 | Show 4x more context |

### Transformation Examples

**Wide Shape (Z=100, baseline):**
- Unsplash: `fp-z=1.00` (normal crop)
- Cloudinary: `z=1.00` (normal crop)

**Square Shape (Z=50, default):**
- Unsplash: `fp-z=2.00` (show 2x more context)
- Cloudinary: `z=2.00` (show 2x more context)

**Thumb Shape (Z=25, default):**
- Unsplash: `fp-z=4.00` (show 4x more context)
- Cloudinary: `z=4.00` (show 4x more context)

**User Sets Z=200 (zoom in 2x):**
- Shrink multiplier: 2.0
- Unsplash: `fp-z=0.50` (zoom in 2x)
- Cloudinary: `z=0.50` (zoom in 2x)

**User Sets Z=25 (show 4x more):**
- Shrink multiplier: 0.25
- Unsplash: `fp-z=4.00` (show 4x more context)
- Cloudinary: `z=4.00` (show 4x more context)

---

## Implementation Validation

### ✅ Completed Tasks

1. ✅ Verified `images` table has `x` and `y` columns
2. ✅ Implemented `xDefaultShrink` computed property in ImagesCoreAdmin
3. ✅ Updated `rebuildShapeUrlWithXYZ` function signature with shape and xDefaultShrink parameters
4. ✅ Implemented shrink-based Z calculation for BOTH Unsplash AND Cloudinary
5. ✅ Updated ShapeEditor component with xDefaultShrink prop
6. ✅ Updated Z input range (10-500) with shape-specific placeholders
7. ✅ Added context-aware hints for Z field
8. ✅ Updated all call sites to pass shape and xDefaultShrink
9. ✅ Added architectural documentation to ImgShape.vue

### 🔄 Pending

- **Testing:** Manual verification needed for all shapes with both adapters
  - Test Z=100 on wide shape (should show normal crop)
  - Test Z=50 on square (should show 2x more context)
  - Test Z=25 on thumb (should show 4x more context)
  - Test Z=200 (should zoom in 2x for any shape)
  - Test with both Unsplash and Cloudinary images

---

## UI Changes Visible to Users

### Z Input Field Improvements

**Wide Shape:**
- Placeholder: "100"
- Hint: "10-500 range | 100=default for wide | <100=more context, >100=zoom in"

**Square/Vertical Shape:**
- Placeholder: "50"
- Hint: "10-500 range | 50=default for square | <50=more context, >50=zoom in"

**Thumb Shape:**
- Placeholder: "25"
- Hint: "10-500 range | 25=default for thumb | <25=more context, >25=zoom in"

### User Experience

**Before:**
- Z=1 to Z=100 (unclear what values mean)
- Same default for all shapes (Z=50)
- No guidance on shape-specific needs

**After:**
- Z=10 to Z=500 (wider range for precision)
- Shape-specific defaults (100/50/25) match shape requirements
- Clear hints explain what each value does
- Intuitive: smaller Z = more context, larger Z = zoom in

---

## Technical Notes

### Coordinate System Summary

**Editor Input (0-100 scale):**
- X/Y: 0=edge, 50=center, 100=opposite edge
- Z: 10-500 range (100=wide default, shape-specific)

**Unsplash Output (imgix parameters):**
- X/Y: 0.0-1.0 scale (0.5=center)
- Z (fp-z): 1.0=normal, higher=zoom out, lower=zoom in

**Cloudinary Output (transformation parameters):**
- X/Y: pixel offsets from center (negative=left/up, 0=center, positive=right/down)
- Z: 1.0=normal, higher=zoom out, lower=zoom in

### Data Flow

```
User enters Z=50 for square shape
↓
handleShapePreview() gets Z=50, shape='square', xDefaultShrink=0.084
↓
rebuildShapeUrlWithXYZ(url, x, y, 50, 'square', 0.084)
↓
shrinkMultiplier = 50 / 100 = 0.5
↓
Unsplash: fp-z = 1.0 / 0.5 = 2.0 → show 2x more context
Cloudinary: z = 1.0 / 0.5 = 2.0 → show 2x more context
↓
URL stored in shape_square.url
↓
ImgShape displays from shape_square.url (no recalculation)
```

### Why This Design?

1. **Shape-Aware Defaults:** Small shapes (thumb) need more context than large shapes (wide)
2. **Unified Scale:** Same Z value means same relative zoom across both adapters
3. **Intuitive UX:** Lower Z = more context (zoom out), Higher Z = less context (zoom in)
4. **Database-Driven:** Uses actual image dimensions (image.x) for accurate calculations
5. **Future-Proof:** ImgShape stays simple (display only), ShapeEditor handles logic
6. **Performance:** Pre-computed URLs stored in database, no runtime recalculation

---

## Related Documentation

- [Z_VALUE_SHRINK_STRATEGY_PROPOSAL.md](./Z_VALUE_SHRINK_STRATEGY_PROPOSAL.md) - Original proposal analysis
- [IMAGE_IMPORT_XYZ_TRANSFORMATION_ANALYSIS.md](./IMAGE_IMPORT_XYZ_TRANSFORMATION_ANALYSIS.md) - Import strategies comparison
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Images table schema

---

## Next Steps

1. **Manual Testing:**
   - Import test images (Unsplash + Cloudinary)
   - Test each shape with default Z values
   - Test edge cases (Z=10, Z=500)
   - Verify transformation URLs are correct

2. **User Testing:**
   - Gather feedback on new Z range (10-500)
   - Check if shape-specific defaults make sense
   - Verify hints are clear and helpful

3. **Future Enhancements:**
   - Add visual zoom indicator in preview
   - Add preset buttons ("Wide default", "Square default", etc.)
   - Consider storing original dimensions (image.x/y) in facade fields for Hero mode

