# Card/Wide Focal-Crop Preview Implementation

## Summary
Implemented focal-crop preview functionality for the card/wide shape in ImagesCoreAdmin.vue, enabling users to test imgix focal-point crop parameters (X, Y, Z) before saving them to the database.

## Changes Made

### 1. ImagesCoreAdmin.vue - Script Section

#### New Refs
- `PreviewWide`: Stores the preview URL with focal-crop parameters
- `CorrectionWide`: Stores the query string portion added for focal-crop

#### New Computed Properties
- `cardWideYZDisabled`: Returns `true` when `cardWideX` is `null`, disabling Y and Z inputs
- `cardWidePreviewData`: Returns modified shape_wide data with PreviewWide URL when available

#### New Watch
- `watch(cardWideX, ...)`: When X is set from `null` to a value, initializes Y and Z to `0`

#### Updated Functions
- `selectImage()`: Initializes `PreviewWide` and resets XYZ values when a record is selected
  - Resets all X, Y, Z values to `null` (both card/wide and tile/square)
  - Resets `CorrectionWide` to empty string
  - For Unsplash: Loads `shape_wide.url` (CorrectionWide is reset)
  - For Cloudinary: Loads `shape_wide.url` (TODO added for positioning)
  
- `updateShapeField()`: Updates `PreviewWide` when `activeShapeTab === 'wide'` and `field === 'url'`

#### New Functions
- `handleCardWideXEnter()`: Handles Enter key on X input
  - If X is NULL, sets it to 50% (center position)
  - Allows quick initialization to center point

- `previewCardWide()`: Computes focal-crop preview URL
  - For Unsplash: Constructs URL with imgix focal-point crop parameters
    - Sets `w=672`, `h=224` (2x card width for wide variant)
    - Sets `fit=crop`
    - Sets `fp-x` from X% value (0-100% → 0-1 scale)
    - Sets `fp-y` from Y% value (0-100% → 0-1 scale) if not null
    - Sets `fp-z` from Z% value (0-100% → 1-2 scale) if not null
  - For Cloudinary: TODO - positioning to be implemented

### 2. ImagesCoreAdmin.vue - Template Section

#### Updated Card/Wide Controls Label
```vue
<span class="control-label">card/wide Zoom and Position</span>
```

#### Updated Card/Wide Inputs
- X input: 
  - Added `min="0" max="100" step="1"` for percentage values (integers only)
  - Added `@keydown.enter="handleCardWideXEnter"` to set to 50% when NULL
  - Placeholder changed to "X%"
- Y input: 
  - Added `:disabled="cardWideYZDisabled"`
  - Added `min="0" max="100" step="1"` for percentage values
  - Placeholder changed to "Y%"
- Z input: 
  - Added `:disabled="cardWideYZDisabled"`
  - Added `min="0" max="100" step="1"` for percentage values
  - Placeholder changed to "Z%"

#### New Preview Button
```vue
<button @click="previewCardWide" class="btn-preview-url" title="Preview">
    👁️
</button>
```

#### Updated ImgShape Binding
Changed from `selectedImage.shape_wide` to `cardWidePreviewData`:
```vue
<ImgShape v-if="cardWidePreviewData" :data="cardWidePreviewData" 
          shape="card" variant="wide" class="CardShape"
          @shapeUrl="(url: string) => cardWideShapeUrl = url" />
```

### 3. ImagesCoreAdmin.vue - Style Section

#### New CSS Rules
```css
.control-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-muted-bg);
}

.btn-preview-url {
    padding: 0.5rem 0.75rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    transition: opacity 0.2s;
}

.btn-preview-url:hover {
    opacity: 0.9;
}
```

### 4. ImgShape.vue - Updated Logic

#### Modified `unsplashUrl` Computed Property
Added detection for existing focal-crop parameters:
```typescript
// If URL already has focal-point crop parameters (fp-x, fp-y, or fp-z),
// don't override w, h, fit as they're already set correctly
const hasFocalCrop = urlObj.searchParams.has('fp-x') || 
                   urlObj.searchParams.has('fp-y') || 
                   urlObj.searchParams.has('fp-z')

if (hasFocalCrop) {
    // Focal-crop is already configured, return as-is
    return urlObj.toString()
}
```

## User Workflow

1. **Select Image**: User selects an image from the list
   - All X, Y, Z values are reset to NULL
   - Preview shows the original shape_wide URL
2. **Set X Value**: User enters a percentage value for X (0-100% representing horizontal position)
   - Press Enter on empty X field to set it to 50% (center)
   - Y and Z inputs become enabled and initialize to 0%
   - Values are whole numbers only (no decimals)
3. **Adjust Y and Z**: User optionally adjusts Y (0-100% vertical position) and Z (0-100% zoom level)
4. **Click Preview** 👁️: User clicks the preview button
   - System computes imgix focal-crop URL with parameters
   - ImgShape component reloads with the new URL
   - Preview shows the cropped result
5. **Iterate**: User can adjust X, Y, Z values and preview again
6. **Save** 💾: When satisfied, user clicks save button to persist the values

## Technical Details

### Imgix Focal-Point Crop Parameters
- **fp-x**: Horizontal focal point (0-1, where 0.5 is center)
  - Our X% (0-100, integers only) is divided by 100
  - Example: X=50% → fp-x=0.50 (center)
- **fp-y**: Vertical focal point (0-1, where 0.5 is center)
  - Our Y% (0-100, integers only) is divided by 100
  - Example: Y=30% → fp-y=0.30
- **fp-z**: Zoom factor (1+, where 1 is no zoom)
  - Our Z% (0-100, integers only) is divided by 100 and then 1 is added (result: 1.00-2.00)
  - Example: Z=20% → fp-z=1.20

### URL Construction Example
Base URL:
```
https://images.unsplash.com/photo-1234567890
```

After preview with X=50%, Y=30%, Z=20%:
```
https://images.unsplash.com/photo-1234567890?w=672&h=224&fit=crop&fp-x=0.50&fp-y=0.30&fp-z=1.20
```

### Input Behavior
- **X Input**: 
  - Range: 0-100% (integers only)
  - If NULL and user presses Enter: Sets to 50% (center)
  - When set from NULL to a value: Y and Z initialize to 0%
- **Y Input**:
  - Range: 0-100% (integers only)
  - Disabled when X is NULL
- **Z Input**:
  - Range: 0-100% (integers only)
  - Disabled when X is NULL

## Architecture Notes

### Separation of Concerns
- **ImagesCoreAdmin**: Handles UI state, user inputs, and preview logic
- **ImgShape**: Handles URL rendering and respects existing focal-crop parameters
- **Preview Flow**: PreviewWide → cardWidePreviewData → ImgShape

### Focal-Crop Detection
ImgShape now detects if a URL already has focal-crop parameters (`fp-x`, `fp-y`, or `fp-z`) and preserves them instead of overriding with standard crop parameters. This ensures the preview URL is rendered correctly.

## Future Work

### Cloudinary Support
Currently marked as TODO:
```typescript
// TODO: Add Positioning to c_crop,g_face,h_150,w_150
```

Cloudinary uses different syntax for focal-point cropping:
- `g_xy_center` for custom gravity point
- `x_X` and `y_Y` for pixel offsets
- Different zoom/crop approach

This will require separate implementation following Cloudinary's API documentation.

## Testing Checklist

- [ ] Select an image with shape_wide data
- [ ] Verify all X, Y, Z values are NULL/empty
- [ ] Verify Y and Z inputs are disabled when X is null
- [ ] Press Enter on empty X input, verify it sets to 50%
- [ ] Verify Y and Z activate and initialize to 0%
- [ ] Try entering decimal values, verify they're rejected (integers only)
- [ ] Try entering values outside 0-100 range, verify browser validation
- [ ] Set X=50%, Y=30%, Z=20%, click preview button
- [ ] Verify ImgShape updates with focal-crop
- [ ] Verify preview URL contains fp-x=0.50, fp-y=0.30, fp-z=1.20
- [ ] Adjust X, Y, Z values, click preview again
- [ ] Click save, verify data persists to database
- [ ] Select a different image, verify X, Y, Z are reset to NULL
- [ ] Select the same image again, verify X, Y, Z are reset (not restored)
- [ ] Test with Unsplash images
- [ ] Test with Cloudinary images (preview should show original)

## References
- [Imgix Focal-Point Crop Documentation](https://docs.imgix.com/en-US/apis/rendering/focal-point-crop)
