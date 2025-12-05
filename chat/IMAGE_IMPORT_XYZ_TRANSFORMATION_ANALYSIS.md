# Image Import & XYZ Transformation Analysis

**Date:** November 12, 2025  
**Scope:** Analysis of Cloudinary vs Unsplash import strategies and XYZ transformation effects

---

## Part 1: Import Strategy Comparison

### Overview

When images are imported via the Import action in `ImagesCoreAdmin`, the server-side adapters generate URLs for all 4 shapes. This analysis compares the transformation strategies used by Unsplash and Cloudinary adapters.

### 1.1 Unsplash Import Strategy

**Source:** `server/adapters/unsplash-adapter.ts` (lines 289-358)

| Shape | Dimensions | Crop Mode | Focal Point | Zoom | Transformation String |
|-------|-----------|-----------|-------------|------|---------------------|
| **square** | 128×128 | `crop=entropy` | - | - | `crop=entropy&fit=crop&w=128&h=128` |
| **wide** | 336×168 | `crop=entropy` | - | - | `crop=entropy&fit=crop&w=336&h=168` |
| **vertical** | 126×224 | `crop=entropy` | - | - | `crop=entropy&fit=crop&w=126&h=224` |
| **thumb** | 64×64 | `crop=focalpoint` | x=0.5, y=0.5 | z=1.5 | `crop=focalpoint&fit=crop&w=64&h=64&fp-x=0.5&fp-y=0.5&fp-z=1.5` |

**Strategy Notes:**
- **Entropy Crop:** Used for square, wide, and vertical shapes. Unsplash's smart cropping algorithm analyzes image content and crops to the most "interesting" region (high entropy = high information density).
- **Focalpoint Crop:** Used ONLY for thumb. Centers on focal point with 1.5x zoom for close-up views (ideal for avatars/thumbnails).
- **No Manual XYZ:** Import sets all X/Y/Z to NULL except thumb (which uses hardcoded focal point).
- **Imgix Parameters:** Uses Unsplash's imgix-based URL parameters (`crop`, `fit`, `fp-x`, `fp-y`, `fp-z`).

### 1.2 Cloudinary Import Strategy

**Source:** `server/adapters/cloudinary-adapter.ts` (lines 118-180)

| Shape | Dimensions | Crop Mode | Gravity | Transformation String |
|-------|-----------|-----------|---------|---------------------|
| **square** | 128×128 | `c_fill` | `g_auto` | `c_fill,g_auto,w_128,h_128` |
| **wide** | 336×168 | `c_fill` | `g_auto` | `c_fill,g_auto,w_336,h_168` |
| **vertical** | 126×224 | `c_fill` | `g_auto` | `c_fill,g_auto,w_126,h_224` |
| **thumb** | 64×64 | `c_crop` | `g_auto` | `c_crop,g_auto,w_64,h_64` |

**Strategy Notes:**
- **c_fill (Cloudinary Fill):** Used for square, wide, and vertical shapes. Fills the target dimensions by cropping excess and using auto-gravity to detect focal points.
- **c_crop (Cloudinary Crop):** Used for thumb shape. Crops to exact dimensions with auto-gravity.
- **g_auto (Auto Gravity):** Cloudinary's AI detects faces, objects, and interesting regions automatically.
- **No Manual XYZ:** Import sets all X/Y/Z to NULL. Auto-gravity handles focal point detection.
- **Chained Transformations:** If base URL already has `c_crop`, adapter chains transformations (keeps original + adds new).

### 1.3 Key Differences

| Aspect | Unsplash | Cloudinary |
|--------|----------|------------|
| **Default Crop** | `entropy` (information density) | `c_fill,g_auto` (AI detection) |
| **Thumb Strategy** | Manual focal point (0.5, 0.5, 1.5x zoom) | `c_crop,g_auto` (AI detection) |
| **Parameter Style** | URL query params (`?crop=entropy&w=128`) | Path transformations (`/c_fill,g_auto,w_128/`) |
| **Manual XYZ** | Supported via `fp-x`, `fp-y`, `fp-z` params | Supported via `x`, `y` offsets from center |
| **Transformation Chain** | Single transformation | Supports chained transformations |

---

## Part 2: XYZ Manual Editing Effects

### Overview

When users manually enter XYZ values in ShapeEditor, the `rebuildShapeUrlWithXYZ()` function converts 0-100 scale values to adapter-specific transformations.

**Conversion Logic (lines 881-956 in `ImagesCoreAdmin.vue`):**

### 2.1 Unsplash XYZ Conversion

**Scale Conversion:**
- **X/Y:** 0-100 scale → 0-1 scale (e.g., 50 → 0.50)
- **Z:** 0-100 scale → 1-2 scale (e.g., 50 → 1.50, formula: `z/100 + 1`)

**Applied Parameters:**
- `crop=focalpoint` (replaces `entropy`)
- `fp-x={x/100}` (0.0 = left, 0.5 = center, 1.0 = right)
- `fp-y={y/100}` (0.0 = top, 0.5 = center, 1.0 = bottom)
- `fp-z={(z/100)+1}` (1.0 = no zoom, 2.0 = 2x zoom)

### 2.2 Cloudinary XYZ Conversion

**Scale Conversion:**
- **X/Y:** 0-100 scale → pixel offset from center
  - Formula: `offsetX = (x - 50) * (width / 100)`
  - Example (wide shape, w=336): x=80 → offset = (80-50) * 3.36 = **+101px**
- **Z:** Passed directly as-is (not currently implemented in Cloudinary transformation)

**Applied Parameters:**
- `c=crop` (replaces `c_fill`)
- `g=xy_center` (replaces `g_auto`)
- `x={offsetX}` (negative = left, 0 = center, positive = right)
- `y={offsetY}` (negative = up, 0 = center, positive = down)

### 2.3 Wide Shape Transformation Examples

**Test Case:** Wide shape (336×168 dimensions)  
**Editor X Values:** Testing -30, 0, 10, 30, 50, 80

| X Value | Valid? | Offset Calculation | Cloudinary Transform | Unsplash Transform | Visual Effect |
|---------|--------|-------------------|---------------------|-------------------|---------------|
| **-30** | ❌ No | (−30−50) × 3.36 = **−269px** | `c_crop,g_xy_center,x_-269,y_0,w_336,h_168` | `crop=focalpoint&fp-x=-0.30` *(invalid)* | Left edge beyond image bounds |
| **0** | ✅ Yes | (0−50) × 3.36 = **−168px** | `c_crop,g_xy_center,x_-168,y_0,w_336,h_168` | `crop=focalpoint&fp-x=0.00` | Far left edge |
| **10** | ✅ Yes | (10−50) × 3.36 = **−134px** | `c_crop,g_xy_center,x_-134,y_0,w_336,h_168` | `crop=focalpoint&fp-x=0.10` | Left of center |
| **30** | ✅ Yes | (30−50) × 3.36 = **−67px** | `c_crop,g_xy_center,x_-67,y_0,w_336,h_168` | `crop=focalpoint&fp-x=0.30` | Slightly left |
| **50** | ✅ Yes | (50−50) × 3.36 = **0px** | `c_crop,g_xy_center,x_0,y_0,w_336,h_168` | `crop=focalpoint&fp-x=0.50` | Perfect center |
| **80** | ✅ Yes | (80−50) × 3.36 = **+101px** | `c_crop,g_xy_center,x_101,y_0,w_336,h_168` | `crop=focalpoint&fp-x=0.80` | Right of center |

**Notes:**
- **Negative X Values:** Editor allows min=0, so -30 is blocked by input validation
- **Y Values:** Follow same pattern (assume Y=50/center for these examples)
- **Z Values:** Unsplash converts to zoom (1.0-2.0), Cloudinary currently ignores Z

### 2.4 Default Handling for NULL Values

**Current Implementation (after fix):**

When user enters partial XYZ values (e.g., only X), the Preview handler defaults NULL values to **50** (center):

```typescript
const x = xyz.x ?? 50  // NULL → 50 (center)
const y = xyz.y ?? 50  // NULL → 50 (center)
const z = xyz.z ?? 50  // NULL → 50 (normal zoom)
```

**Transformation Example (X=30, Y=NULL, Z=NULL):**
- **Input:** X=30, Y=NULL, Z=NULL
- **Processed:** X=30, Y=50, Z=50
- **Cloudinary:** `c_crop,g_xy_center,x_-67,y_0,w_336,h_168`
- **Unsplash:** `crop=focalpoint&fp-x=0.30&fp-y=0.50&fp-z=1.50`

This matches ImgShape's behavior where NULL positions default to center (0 offset = center in Cloudinary, 0.5 = center in Unsplash).

---

## Part 3: System Architecture Summary

### 3.1 Data Flow

```
Import → Adapter (buildShapeUrl) → DB (shape_wide.url with base params)
                                          ↓
User Edits XYZ → ShapeEditor → handleShapePreview() → rebuildShapeUrlWithXYZ()
                                          ↓
                              Updated shape_wide.url (with focal point params)
                                          ↓
                                   ImgShape Display
```

### 3.2 Coordinate System

**Editor Scale (0-100):**
- X: 0=left edge, 50=center, 100=right edge
- Y: 0=top edge, 50=center, 100=bottom edge  
- Z: 1=zoomed out, 50=normal, 100=zoomed in

**Cloudinary (pixel offsets from center):**
- X: negative=left, 0=center, positive=right (in pixels)
- Y: negative=up, 0=center, positive=down (in pixels)
- Z: Not implemented (ignored)

**Unsplash (0-1 scale for position, 1-2 for zoom):**
- X: 0.0=left, 0.5=center, 1.0=right
- Y: 0.0=top, 0.5=center, 1.0=bottom
- Z: 1.0=no zoom, 1.5=normal, 2.0=max zoom

### 3.3 Key Findings

1. **Import Uses Auto-Cropping:** Both adapters rely on AI/entropy cropping by default (no manual XYZ on import).

2. **Thumb Gets Special Treatment:** 
   - Unsplash: Hardcoded focal point (0.5, 0.5) with 1.5x zoom
   - Cloudinary: Uses `c_crop,g_auto` instead of `c_fill`

3. **XYZ Editing Changes Crop Mode:**
   - Unsplash: `entropy` → `focalpoint`
   - Cloudinary: `c_fill,g_auto` → `c_crop,g_xy_center`

4. **Z-Value Implementation:**
   - Unsplash: Fully implemented (converts to 1.0-2.0 zoom range)
   - Cloudinary: Currently ignored (not included in transformation string)

5. **Negative Values:**
   - Editor blocks negative X/Y (min=0)
   - Cloudinary offsets can be negative (calculated internally)
   - Z minimum is 1 (not 0) to prevent invalid zoom

---

## Recommendations

### Immediate Actions

1. **Document Z-Value Range:** Current min is 1, but field hint says "1 = zoomed out, 50 = normal, 100 = zoomed in". Consider if this is correct or if Z should map differently.

2. **Cloudinary Z Implementation:** If Z-value control is needed for Cloudinary, implement zoom parameter in `rebuildShapeUrlWithXYZ()`.

3. **Validation Enhancement:** Add warning when X/Y values might crop beyond image bounds (e.g., X<10 or X>90 for wide shapes).

### Future Enhancements

1. **Auto-Detect Faces:** When entering Shape mode, call adapter API to detect faces/objects and suggest XYZ values.

2. **Visual Crop Preview:** Overlay crop rectangle on hero preview to show exactly what will be cropped.

3. **Preset Positions:** Add quick buttons for common positions (top-left, center, bottom-right, etc.).

4. **Shape-Specific Defaults:** Use different default Z values per shape (e.g., Z=50 for thumb, Z=0 for wide).

---

## Appendix: Code References

### Import Adapters
- **Unsplash:** `server/adapters/unsplash-adapter.ts` (lines 289-358)
- **Cloudinary:** `server/adapters/cloudinary-adapter.ts` (lines 118-180)

### XYZ Conversion
- **Function:** `rebuildShapeUrlWithXYZ()` in `ImagesCoreAdmin.vue` (lines 881-956)
- **Preview Handler:** `handleShapePreview()` (lines 1764-1798)

### Display Logic
- **ImgShape Component:** `src/components/images/ImgShape.vue` (lines 220-280)
- **ShapeEditor Component:** `src/components/images/ShapeEditor.vue` (lines 397-432)
