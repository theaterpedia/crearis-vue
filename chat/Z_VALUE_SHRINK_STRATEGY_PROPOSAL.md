# Z-Value Shrink Strategy Proposal - Implementation Analysis

**Date:** November 12, 2025  
**Scope:** Proposal to implement shape-aware Z-value defaults with shrink calculation for Unsplash adapter

---

## Executive Summary

**Proposal:** Implement a sophisticated Z-value system where:
- Z represents a **shrink multiplier** rather than zoom level
- Each shape has a **default Z value** (wide=100, square/vertical=50, thumb=25)
- The shrink is calculated relative to the **wide shape's dimensions**
- Formula: `actualShrink = xDefaultShrink × (z / 100)`

**Complexity Assessment:** 🟡 **Medium Complexity**

**Implementation Effort:** ~2-3 hours
- Frontend changes: Add prop, update UI, adjust validation
- Backend changes: Modify Z-to-shrink conversion logic
- Testing: Verify each shape's behavior with different Z values

---

## Current Implementation vs Proposed

### Current Z-Value System

**Range:** 1-100 (enforced by ShapeEditor input `min="1"`)

**Conversion (Unsplash only):**
```typescript
// Current formula in rebuildShapeUrlWithXYZ()
const fpZ = (z / 100) + 1  // Maps 1-100 → 1.01-2.00

// Examples:
// z=1   → fp-z=1.01 (minimal zoom)
// z=50  → fp-z=1.50 (1.5x zoom)
// z=100 → fp-z=2.00 (2x zoom)
```

**Problems:**
1. **Not intuitive:** Z=1 means "almost no zoom" but users expect Z=0 or Z=50 to be "normal"
2. **Shape-agnostic:** Same Z value applies equally to all shapes, but small shapes (thumb) need different zoom than large shapes (wide)
3. **No shrink concept:** Current system only "zooms in" (crops tighter), cannot "zoom out" (show more context)

### Proposed Z-Value System

**Range:** 10-500 (wider range for more control)

**Shape-Specific Defaults:**
- **Wide:** Z=100 (baseline, no shrink/zoom)
- **Square/Vertical:** Z=50 (shrink to 50%, show more context)
- **Thumb:** Z=25 (shrink to 25%, show much more context)

**Shrink Calculation:**
```typescript
// New formula (Unsplash adapter)
const xDefaultShrink = imageWideWidth / imageOriginalWidth  // Example: 336 / 4000 = 0.084

// Z=100 (default for wide)
const actualShrink = xDefaultShrink × (100 / 100) = 0.084 × 1.0 = 0.084  // No adjustment

// Z=50 (default for square/vertical)
const actualShrink = xDefaultShrink × (50 / 100) = 0.084 × 0.5 = 0.042  // Show 2x more context

// Z=25 (default for thumb)
const actualShrink = xDefaultShrink × (25 / 100) = 0.084 × 0.25 = 0.021  // Show 4x more context

// Z=200 (user wants to zoom in)
const actualShrink = xDefaultShrink × (200 / 100) = 0.084 × 2.0 = 0.168  // Crop tighter (2x zoom)
```

**Intuitive Meaning:**
- Z < 100: "Zoom out" (show more context around focal point)
- Z = 100: "Normal" (use wide shape's default crop)
- Z > 100: "Zoom in" (crop tighter around focal point)

---

## Implementation Requirements

### 1. Frontend Changes (ImagesCoreAdmin.vue)

#### 1.1 Calculate xDefaultShrink

**Location:** Computed property near `activeShapeData`

```typescript
// Calculate default shrink ratio based on wide shape and original image
const xDefaultShrink = computed(() => {
    if (!selectedImage.value?.shape_wide) return null
    
    // Get wide shape width (always 336 for our system)
    const wideWidth = 336
    
    // Get original image width from URL or metadata
    // Option A: Parse from Unsplash URL (w parameter)
    // Option B: Fetch from image metadata API
    // Option C: Store in database during import
    
    try {
        const url = new URL(selectedImage.value.url)
        const widthParam = url.searchParams.get('w')
        if (widthParam) {
            const originalWidth = parseInt(widthParam)
            return wideWidth / originalWidth
        }
    } catch (e) {
        console.warn('Could not calculate xDefaultShrink:', e)
    }
    
    // Fallback: assume typical Unsplash image width (4000px)
    return 336 / 4000  // ≈ 0.084
})
```

**Challenge:** Original image dimensions are not stored in database. Solutions:

**Option A - Parse from URL:** ✅ **Recommended**
- Unsplash URLs contain `w` parameter (max width requested)
- Quick, no API calls needed
- Example: `?w=4000` → originalWidth = 4000

**Option B - Fetch from Unsplash API:**
- Call `/photos/{id}` endpoint to get `width` and `height`
- Accurate but requires API call + rate limiting
- Adds latency

**Option C - Store during import:**
- Modify adapter to fetch and store `original_width` in database
- Best long-term solution, requires migration
- Future enhancement

#### 1.2 Pass to ShapeEditor as Prop

**Location:** ShapeEditor component binding (line ~2379)

```vue
<ShapeEditor 
    :shape="activeShape.shape as any" 
    :adapter="activeShape.adapter as any"
    :x-default-shrink="xDefaultShrink"
    :data="{
        x: activeShapeXYZ.x,
        y: activeShapeXYZ.y,
        z: activeShapeXYZ.z,
        url: activeShapeData.url || '',
        tpar: activeShapeData.tpar || null,
        turl: activeShapeData.turl || null,
        json: activeShapeData.json || null,
        blur: activeShapeData.blur || null
    }" 
    @update="handleShapeUpdate" 
    @preview="handleShapePreview"
    @reset="handleShapeReset" 
/>
```

#### 1.3 Update rebuildShapeUrlWithXYZ Function

**Location:** Line ~881-960

**Current Unsplash logic:**
```typescript
if (isUnsplash) {
    if (x !== null && y !== null && z !== null) {
        url.searchParams.set('fp-x', (x / 100).toFixed(2))
        url.searchParams.set('fp-y', (y / 100).toFixed(2))
        url.searchParams.set('fp-z', (z / 100 + 1).toFixed(2))  // 1-100 → 1.01-2.00
    }
}
```

**New logic with shrink:**
```typescript
if (isUnsplash) {
    if (x !== null && y !== null && z !== null) {
        url.searchParams.set('fp-x', (x / 100).toFixed(2))
        url.searchParams.set('fp-y', (y / 100).toFixed(2))
        
        // NEW: Calculate fp-z based on shrink multiplier
        // z is 10-500, default varies by shape (100=wide, 50=square/vertical, 25=thumb)
        // actualShrink = xDefaultShrink × (z / 100)
        // Unsplash fp-z is 1.0 = no zoom, 2.0 = 2x zoom
        // So we need to convert shrink ratio to zoom level
        
        // Get xDefaultShrink from somewhere (need to pass as parameter)
        const shrinkMultiplier = z / 100  // z=100 → 1.0 (no change), z=50 → 0.5 (half shrink)
        
        // Unsplash fp-z: smaller value = more zoom (tighter crop)
        // fp-z=1.0 means "use this exact crop size"
        // fp-z=2.0 means "zoom out to 2x size, then crop"
        // So: shrinkMultiplier=0.5 → fp-z=2.0 (show 2x more context)
        //     shrinkMultiplier=1.0 → fp-z=1.0 (normal)
        //     shrinkMultiplier=2.0 → fp-z=0.5 (zoom in 2x)
        
        const fpZ = 1.0 / shrinkMultiplier
        url.searchParams.set('fp-z', fpZ.toFixed(2))
    }
}
```

**Wait - Problem Identified! 🚨**

The `rebuildShapeUrlWithXYZ` function doesn't know which shape is being edited. It only receives the URL and XYZ values. We need to pass additional context.

**Solution:** Add `shape` parameter to function signature:

```typescript
function rebuildShapeUrlWithXYZ(
    baseUrl: string, 
    x: number | null, 
    y: number | null, 
    z: number | null,
    shape: 'square' | 'wide' | 'vertical' | 'thumb',  // NEW
    xDefaultShrink: number | null  // NEW
): string
```

### 2. Frontend Changes (ShapeEditor.vue)

#### 2.1 Add xDefaultShrink Prop

**Location:** Props interface (line ~6)

```typescript
interface Props {
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
    adapter: 'unsplash' | 'cloudinary' | 'vimeo' | 'external'
    xDefaultShrink?: number | null  // NEW: For Unsplash shrink calculation
    data: {
        x?: number | null
        y?: number | null
        z?: number | null
        url: string
        tpar?: string | null
        json?: Record<string, any> | null
        blur?: string | null
        turl?: string | null
    }
}
```

#### 2.2 Update Z Input Validation

**Location:** Z input field (line ~420)

**Current:**
```vue
<input type="number" :value="data.z ?? ''" @input="updateZ" 
    @focus="isEditingField = true" @blur="isEditingField = false" 
    min="1" max="100" placeholder="50" class="param-z" />
```

**New:**
```vue
<input type="number" :value="data.z ?? ''" @input="updateZ" 
    @focus="isEditingField = true" @blur="isEditingField = false" 
    min="10" max="500" :placeholder="getDefaultZPlaceholder()" class="param-z" />
```

**Add computed for default placeholder:**
```typescript
const getDefaultZPlaceholder = () => {
    switch (props.shape) {
        case 'wide': return '100'  // No shrink adjustment
        case 'square':
        case 'vertical': return '50'  // Show 2x more context
        case 'thumb': return '25'  // Show 4x more context
        default: return '100'
    }
}
```

#### 2.3 Update Z Field Hint

**Location:** Z field hint (line ~424)

**Current:**
```vue
<span class="field-hint">1 = zoomed out, 50 = normal, 100 = zoomed in (no negative values)</span>
```

**New:**
```vue
<span class="field-hint">
    {{ getZFieldHint() }}
</span>
```

**Add computed for context-aware hint:**
```typescript
const getZFieldHint = () => {
    const defaultZ = getDefaultZPlaceholder()
    return `10-500 range | ${defaultZ}=normal for ${props.shape} | <100=show more context, >100=zoom in`
}
```

### 3. Update handleShapePreview Function

**Location:** ImagesCoreAdmin.vue, line ~1764

**Current call:**
```typescript
const newUrl = rebuildShapeUrlWithXYZ(baseUrl, x, y, z)
```

**New call:**
```typescript
const newUrl = rebuildShapeUrlWithXYZ(baseUrl, x, y, z, shape, xDefaultShrink.value)
```

### 4. Backend Changes (Optional - Import Defaults)

**Location:** `server/adapters/unsplash-adapter.ts`

Currently, import sets all XYZ to NULL. With the new system, we could optionally set default Z values during import:

```typescript
// In buildShapeUrl() or importImage()
shape_wide: {
    url: this.buildShapeUrl(cleanBaseUrl, 'wide'),
    x: null,
    y: null,
    z: 100,  // NEW: Default for wide
    // ...
},
shape_square: {
    url: this.buildShapeUrl(cleanBaseUrl, 'square'),
    x: null,
    y: null,
    z: 50,   // NEW: Default for square
    // ...
},
// etc.
```

**Decision:** Skip for now. Let users manually set Z if they want to override auto-crop.

---

## Edge Cases & Considerations

### 1. What if xDefaultShrink is NULL?

**Scenario:** Can't determine original image width

**Solution:** Fallback to old Z-to-zoom conversion
```typescript
if (xDefaultShrink === null) {
    // Fallback: use simple zoom (old behavior)
    const fpZ = (z / 100) + 1
    url.searchParams.set('fp-z', fpZ.toFixed(2))
} else {
    // Use shrink-based calculation
    const shrinkMultiplier = z / 100
    const fpZ = 1.0 / shrinkMultiplier
    url.searchParams.set('fp-z', fpZ.toFixed(2))
}
```

### 2. What about Cloudinary?

**Question:** Should Cloudinary also use shape-specific defaults?

**Answer:** No, for now. Cloudinary doesn't currently use Z at all (it's ignored). If we implement Z for Cloudinary in the future, we can reuse the same prop pattern.

### 3. Validation Boundaries

**Current:** min=1, max=100  
**New:** min=10, max=500

**Why min=10?**
- Z=0 would mean "infinite zoom out" (divide by zero)
- Z=10 means 10x zoom out (show 10x more context) - that's already extreme
- Prevents accidental invalid values

**Why max=500?**
- Z=500 means 5x zoom in (very tight crop)
- More than enough range for any use case
- Prevents accidental extreme values that might break URL parsing

### 4. Database Storage

**Current:** `z` is stored as INTEGER in database  
**New:** Still INTEGER, just wider range (10-500 instead of 1-100)

**Migration needed?** No - existing NULL values are fine, and any existing 1-100 values will just be interpreted differently (but we haven't deployed this yet, so no data migration needed).

---

## Implementation Checklist

### Phase 1: Core Implementation (Required)

- [ ] **ImagesCoreAdmin.vue:**
  - [ ] Add `xDefaultShrink` computed property (parse from URL or use fallback)
  - [ ] Pass `xDefaultShrink` as prop to ShapeEditor
  - [ ] Update `rebuildShapeUrlWithXYZ` signature to accept `shape` and `xDefaultShrink`
  - [ ] Implement shrink-based Z calculation for Unsplash
  - [ ] Update `handleShapePreview` to pass new parameters

- [ ] **ShapeEditor.vue:**
  - [ ] Add `xDefaultShrink?: number | null` to Props interface
  - [ ] Update Z input: `min="10"` `max="500"`
  - [ ] Add `getDefaultZPlaceholder()` function
  - [ ] Add `getZFieldHint()` function
  - [ ] Update Z field hint template

- [ ] **Testing:**
  - [ ] Test with Unsplash images
  - [ ] Verify Z=100 on wide shape shows normal crop
  - [ ] Verify Z=50 on square shows more context
  - [ ] Verify Z=25 on thumb shows much more context
  - [ ] Test edge cases (Z=10, Z=500)
  - [ ] Test fallback when xDefaultShrink is NULL

### Phase 2: Polish (Optional)

- [ ] Add visual indicator showing "zoomed out" vs "zoomed in" state
- [ ] Add preset buttons: "Wide default", "Square default", "Thumb default"
- [ ] Store original image dimensions in database during import (migration required)
- [ ] Implement Z-value support for Cloudinary adapter

---

## Risk Assessment

### Low Risk ✅
- Changes are isolated to Unsplash adapter
- Existing Cloudinary behavior unchanged
- Fallback logic prevents breaking when xDefaultShrink unavailable
- No database migration required

### Medium Risk ⚠️
- **Z-range change (1-100 → 10-500):** If any images already have Z values stored, they'll be interpreted differently
  - **Mitigation:** We haven't deployed this feature yet, so no existing data
- **Formula complexity:** Shrink calculation might not match user expectations
  - **Mitigation:** Clear field hints + documentation

### Complexity Concerns
- **Three-way dependency:** xDefaultShrink depends on original image width, which isn't directly available
  - **Mitigation:** Parse from URL, use sensible fallback (336/4000)
- **Shape-aware logic:** Need to pass shape context through function chain
  - **Mitigation:** Add parameters, maintain backward compatibility with fallback

---

## Recommendation

### ✅ **Approve with Modifications**

The proposal is sound and addresses a real UX issue (shape-specific zoom needs). However, I recommend these adjustments:

1. **Start simple:** Implement with URL-parsed width + fallback, skip database storage for now
2. **Clear labeling:** Update all Z-related UI text to say "shrink multiplier" not "zoom"
3. **Gradual rollout:** Deploy for Unsplash first, gather feedback, then consider Cloudinary
4. **Document heavily:** This is non-obvious behavior, needs clear docs + tooltips

### Implementation Time Estimate

- **Core changes:** 1.5 hours
- **Testing:** 1 hour
- **Documentation:** 0.5 hours
- **Total:** ~3 hours

### Alternative: Simpler Approach

If the shrink calculation feels too complex, consider this simpler version:

**Keep Z range 1-100, but make default shape-specific:**
- Wide: Z=50 (normal)
- Square/Vertical: Z=30 (show more)
- Thumb: Z=20 (show much more)

Then use simple linear zoom: `fp-z = 1.0 + (z / 100)` (range 1.01-2.00)

This avoids needing `xDefaultShrink` entirely, while still giving shape-specific behavior through different defaults.

---

## Questions for Clarification

1. **Original image width:** How should we obtain it? URL parsing OK as primary method?
2. **Existing data:** Are there any images with Z values already set in production?
3. **Cloudinary parity:** Should Cloudinary eventually use the same system, or keep separate logic?
4. **UI complexity:** Is the "shrink multiplier" concept clear enough for end users, or should we use simpler "zoom level" terminology?

