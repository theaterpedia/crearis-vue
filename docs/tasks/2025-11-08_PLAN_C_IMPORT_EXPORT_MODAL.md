# Plan C: Import/Export Modal Enhancement & turl/tpar Implementation

**Date**: November 8, 2025  
**Priority**: High  
**Status**: 🔄 In Progress

---

## 📊 Context: Previous Plans Review

### ✅ Plan A (COMPLETED)
- Cloudinary adapter fully implemented
- URL parsing, metadata extraction
- Alt_text generation with hash removal
- Year extraction from timestamps
- All tests passing

### ✅ Plan B (OUTLINED)
- turl/tpar concept defined
- Deferred detailed implementation to this plan

### 📋 Related Prior Work
From `2025-11-07_IMPROVE_IMAGES_IMPORT_WITH_BLURHASH.md`:
- ✅ BlurHash generation for all 4 shapes
- ✅ Shape URL defaults established
- ✅ Composite type extended to 8 fields
- ⏳ Import modal UI improvements (this plan)
- ⏳ turl/tpar implementation (this plan)

---

## 🎯 Objectives

1. **Add JSON Export**: Export entire images table to `/data/images/{timestamp}.json`
2. **Add JSON Import**: Re-import metadata with selective options
3. **Upgrade Import Modal UI**: Fix dropdown, multi-URL support, preview
4. **Implement turl/tpar System**: Extract transformation params, optimize URLs
5. **Add Device Width Detection**: Prepare for responsive image serving

---

## 📝 Task Breakdown

### Task 0: Evaluate Remaining Work from Prior Plans ✅

**From BlurHash Import Plan**:
- ✅ BlurHash generation implemented
- ✅ Shape URLs with defaults working
- ⏳ Import modal needs UI fixes (white-on-white dropdown)
- ⏳ Import modal needs multi-URL support
- ⏳ Import modal needs preview with ImgShape component

**From Plan B (turl/tpar)**:
- ⏳ Extract transformation parameters to turl
- ⏳ Build tpar template with {turl} placeholder
- ⏳ Calculate responsive dimensions (mobile-width: 416px)

**Status**: All requirements identified and incorporated below.

---

### Task 1: Add JSON Export Button ✅ READY TO IMPLEMENT

**Location**: `src/components/images/ImagesCoreAdmin.vue`

**Requirements**:
1. Add "Export JSON" button to data section toolbar
2. On click: Execute direct export (no modal needed)
3. Generate filename: `/data/images/images-export-{YYYY-MM-DD-HH_mm}.json`
4. Export full images table as formatted JSON
5. Show success alert with file path

**Implementation**:
```typescript
// New API endpoint
POST /api/images/export
Response: { success: true, path: '/data/images/images-export-2025-11-08-14_30.json', count: 142 }

// Button in ImagesCoreAdmin toolbar
<button @click="handleExportImages">
  <Icon name="mdi:download" />
  Export JSON
</button>
```

**API Implementation**:
- Read all images from database
- Format as JSON with proper indentation
- Write to `/data/images/` directory
- Return file path and record count

**Success Criteria**:
- ✅ Button visible in admin toolbar
- ✅ Click triggers export immediately
- ✅ Alert shows: "Exported 142 images to /data/images/images-export-2025-11-08-14_30.json"
- ✅ File contains valid formatted JSON
- ✅ All image fields included

---

### Task 2: Add JSON Import with Options 🔄 IMPLEMENT FIRST OPTION ONLY

**Location**: `src/components/images/ImagesCoreAdmin.vue` + new modal component

**Requirements**:
1. Add "Import JSON" button to toolbar
2. Open file picker pointing to `/data/images/`
3. Once file selected, open modal with 3 options
4. For now: **Implement option 1 only**, display others as "Coming soon"
5. Add "Apply to all" checkbox for batch processing

**Import Options Modal**:

```
┌─────────────────────────────────────────────────┐
│  Import Images from JSON                        │
├─────────────────────────────────────────────────┤
│  File: images-export-2025-11-08-143025.json     │
│  Found: 142 images                              │
│                                                 │
│  Choose import mode:                            │
│                                                 │
│  ○ Re-import metadata and tpar, keep URLs       │
│     Preserves: shape URLs, turl, blur hashes    │
│     Updates: name, alt_text, about, license,    │
│              tags, tpar (transformations)       │
│                                                 │
│  ○ Re-import and rebuild URLs with params       │
│     🚧 Coming Soon                              │
│     Regenerates all shape URLs from tpar        │
│                                                 │
│  ○ Full overwrite (keep IDs and relations)      │
│     🚧 Coming Soon                              │
│     Replaces all data, preserves relationships  │
│                                                 │
│  ☑ Apply this choice to all images              │
│     (If unchecked, prompt for each image)       │
│                                                 │
│  [ Cancel ]                [ Import ]           │
└─────────────────────────────────────────────────┘
```

**Option 1 Implementation** (this task):
- Match images by ID
- Update fields: name, alt_text, about, license, tags, author, tpar
- Preserve fields: shape URLs, turl, blur hashes, created_at
- Show progress: "Importing image 5 of 142..."
- Show summary: "Successfully updated 142 images"

**Success Criteria**:
- ✅ File picker opens to `/data/images/`
- ✅ Modal displays with 3 options
- ✅ Option 1 fully functional
- ✅ Options 2 & 3 show "Coming Soon" badge
- ✅ "Apply to all" checkbox works
- ✅ Progress indicator during import
- ✅ Success/error summary at end

---

### Task 3: Upgrade Import Modal UI 🎨 THREE IMPROVEMENTS

**Location**: `src/components/images/cimgImport.vue`

#### 3A: Fix Owner Dropdown (White-on-White Text)

**Problem**: Dropdown text not readable (white text on white background)

**Solution**: 
```vue
<!-- Add proper styling to dropdown -->
<Dropdown class="owner-dropdown" :distance="6">
  <template #popper>
    <div class="dropdown-content">
      <div 
        v-for="owner in owners" 
        :key="owner.id"
        class="dropdown-item"
        @click="selectedOwner = owner.id"
      >
        {{ owner.name }}
      </div>
    </div>
  </template>
</Dropdown>

<style scoped>
.dropdown-content {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--color-text);
}

.dropdown-item:hover {
  background: var(--color-background-soft);
}
</style>
```

**Success Criteria**:
- ✅ Dropdown text clearly visible
- ✅ Hover state shows background change
- ✅ Follows theme colors (light/dark mode compatible)

---

#### 3B: Allow Multiple URLs (Comma-Separated)

**Current**: Single URL input  
**New**: Parse comma-separated URLs

**Implementation**:
```typescript
const parseUrls = (input: string): string[] => {
  return input
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0)
}

const handleAddImages = () => {
  const urls = parseUrls(urlInput.value)
  
  for (const url of urls) {
    if (!validateUrl(url)) {
      console.warn('Invalid URL skipped:', url)
      continue
    }
    
    importedImages.value.push({
      url,
      previewUrl: '', // Will be generated
      status: 'pending'
    })
  }
  
  urlInput.value = ''
}
```

**UI Update**:
```vue
<textarea
  v-model="urlInput"
  placeholder="Enter URLs (comma-separated)&#10;https://images.unsplash.com/photo-123...&#10;https://res.cloudinary.com/account/..."
  rows="3"
/>
```

**Success Criteria**:
- ✅ Accept comma-separated URLs
- ✅ Trim whitespace from each URL
- ✅ Skip invalid URLs with warning
- ✅ Add all valid URLs to import queue
- ✅ Clear input after processing

---

#### 3C: Add Preview with ImgShape Component

**Requirement**: Show thumbnail preview of each image before import

**Implementation**:
```vue
<template>
  <div v-for="image in importedImages" :key="image.url" class="import-preview">
    <ImgShape
      :src="image.url"
      shape="square"
      :width="64"
      :height="64"
      class="preview-thumb"
    />
    <div class="preview-info">
      <div class="preview-url">{{ truncateUrl(image.url) }}</div>
      <div class="preview-status" :class="`status-${image.status}`">
        {{ image.status }}
      </div>
    </div>
    <button @click="removeImage(image.url)" class="btn-remove">
      <Icon name="mdi:close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import ImgShape from './ImgShape.vue'

const generatePreviewUrl = (url: string): string => {
  // For Unsplash
  if (url.includes('unsplash.com')) {
    return `${url}?w=64&h=64&fit=crop`
  }
  
  // For Cloudinary
  if (url.includes('cloudinary.com')) {
    // Parse and inject c_crop,w_64,h_64 transformation
    const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(.*)$/)
    if (match) {
      return `${match[1]}c_crop,w_64,h_64/${match[2]}`
    }
  }
  
  return url
}
</script>
```

**Success Criteria**:
- ✅ Each URL shows 64×64px thumbnail preview
- ✅ Uses ImgShape component for consistency
- ✅ Handles both Unsplash and Cloudinary URLs
- ✅ Shows loading state during fetch
- ✅ Shows error state if preview fails
- ✅ Remove button works

---

### Task 4: Backend Import Enhancements Review 🔍

**Current State** (from previous tasks):
- ✅ BlurHash generation working
- ✅ Shape URLs generated with defaults
- ✅ Both Unsplash and Cloudinary adapters complete
- ✅ Composite type has 8 fields (x, y, z, url, json, blur, turl, tpar)

**Gaps to Address**:
- ⏳ turl/tpar not yet populated (currently null)
- ⏳ No mobile-responsive dimension calculation
- ⏳ No transformation parameter extraction

**Action**: Proceed to Task 5 for turl/tpar implementation

---

### Task 5: Implement turl/tpar System 🎯 CORE FEATURE

This task implements the transformation URL/parameters system for responsive images.

#### 5.1: Extract Transformation Parameters

**Location**: `server/adapters/base-adapter.ts` → `buildShapeUrl()` methods

**For Unsplash**:
```typescript
// Current URL: https://images.unsplash.com/photo-123?w=128&h=128&fit=crop
// Extract: w=128&h=128&fit=crop
// Store in turl: "w=128&h=128&fit=crop"
// Build tpar: "https://images.unsplash.com/photo-123?{turl}"

private extractUnsplashParams(url: string): { baseUrl: string, params: string } {
  const urlObj = new URL(url)
  const params = urlObj.search.substring(1) // Remove leading '?'
  const baseUrl = `${urlObj.origin}${urlObj.pathname}`
  
  return { baseUrl, params }
}
```

**For Cloudinary**:
```typescript
// Current URL: https://res.cloudinary.com/account/image/upload/c_crop,w_128,h_128/v123/photo.jpg
// Extract: c_crop,w_128,h_128
// Store in turl: "c_crop,w_128,h_128"
// Build tpar: "https://res.cloudinary.com/account/image/upload/{turl}/v123/photo.jpg"

private extractCloudinaryParams(url: string): { template: string, params: string } {
  const pattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)([^\/]+)(\/.+)$/
  const match = url.match(pattern)
  
  if (!match) {
    return { template: url, params: '' }
  }
  
  return {
    template: `${match[1]}{turl}${match[3]}`,
    params: match[2]
  }
}
```

**Success Criteria**:
- ✅ Unsplash: params extracted from query string
- ✅ Cloudinary: params extracted from transformation segment
- ✅ tpar contains {turl} placeholder
- ✅ Original URL can be reconstructed: tpar.replace('{turl}', turl)

---

#### 5.2: Calculate Mobile-Responsive Dimensions

**Goal**: Recalculate width/height for mobile devices (416px base width)

**Add CSS Variable**:
```css
/* src/assets/css/01-variables.css */

:root {
  /* DO NOT CHANGE: Hardcoded to useTheme composable */
  --mobile-width: 26rem; /* 416px = 416/16 rem */
}
```

**Calculation Logic**:
```typescript
// Constants
const MOBILE_WIDTH_PX = 416
const BASE_WIDTH_PX = 16 // 1rem

// Original dimensions (from shape defaults)
const shapes = {
  square: { w: 128, h: 128 },
  thumb: { w: 64, h: 64 },
  wide: { w: 336, h: 168 },
  vertical: { w: 126, h: 224 }
}

// Calculate mobile dimensions (preserve aspect ratio)
const calculateMobileDimensions = (w: number, h: number, maxWidth: number = MOBILE_WIDTH_PX) => {
  const aspect = h / w
  
  if (w <= maxWidth) {
    // Already fits, no scaling needed
    return { w, h }
  }
  
  // Scale down to fit mobile width
  const newWidth = maxWidth
  const newHeight = Math.round(newWidth * aspect)
  
  return { w: newWidth, h: newHeight }
}

// Example for wide shape:
// Original: 336×168
// Mobile: 416×208 (scaled to fit 416px width, aspect preserved)
```

**Update turl with Mobile Dimensions**:
```typescript
// For mobile-optimized turl
const mobileDims = calculateMobileDimensions(shape.w, shape.h)

// Unsplash mobile turl
const turlMobile = `w=${mobileDims.w}&h=${mobileDims.h}&fit=crop`

// Cloudinary mobile turl  
const turlMobile = `c_crop,w_${mobileDims.w},h_${mobileDims.h}`
```

**Success Criteria**:
- ✅ CSS variable added to 01-variables.css
- ✅ Mobile width calculation preserves aspect ratio
- ✅ Wide shape: 336×168 → 416×208 (scaled up to mobile width)
- ✅ Vertical shape: 126×224 → 416×739 (scaled up proportionally)
- ✅ Square/thumb: No change (already smaller than mobile width)

---

#### 5.3: Update Shape Composite Type Population

**Location**: `server/adapters/base-adapter.ts` → Shape field updates

**Current** (5 fields):
```typescript
// OLD: Only url populated, others null
shape_square = ROW(128, 128, null, url, null, null, null, null)::image_shape
```

**New** (8 fields with turl/tpar):
```typescript
// NEW: All fields populated
shape_square = ROW(
  128,           // x (width)
  128,           // y (height)
  null,          // z (always null for now)
  url,           // url (full URL with transformations)
  null,          // json (always null for now)
  blurHash,      // blur (generated BlurHash)
  turl,          // turl (transformation params only)
  tpar           // tpar (URL template with {turl} placeholder)
)::image_shape
```

**Example Data**:
```typescript
// Unsplash square shape
{
  x: 128,
  y: 128,
  z: null,
  url: "https://images.unsplash.com/photo-123?w=128&h=128&fit=crop",
  json: null,
  blur: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
  turl: "w=128&h=128&fit=crop",
  tpar: "https://images.unsplash.com/photo-123?{turl}"
}

// Cloudinary wide shape
{
  x: 336,
  y: 168,
  z: null,
  url: "https://res.cloudinary.com/account/image/upload/c_crop,w_336,h_168/v123/photo.jpg",
  json: null,
  blur: "L5H2EC=PM+yV0g-mq.wG9c010J}I",
  turl: "c_crop,w_336,h_168",
  tpar: "https://res.cloudinary.com/account/image/upload/{turl}/v123/photo.jpg"
}
```

**Success Criteria**:
- ✅ All 8 fields populated for each shape
- ✅ turl contains only transformation parameters
- ✅ tpar contains URL template with {turl} placeholder
- ✅ url can be reconstructed: `tpar.replace('{turl}', turl)`
- ✅ blur hash generated and stored
- ✅ x, y dimensions match shape defaults

---

### Task 6: Update useTheme Composable 🎨

**Location**: `src/composables/useTheme.ts`

**Requirements**:
1. Add mobile-width constant (hardcoded to match CSS)
2. Add TODO comment about device detection
3. Prepare for future hero-service composable

**Implementation**:
```typescript
// src/composables/useTheme.ts

export const useTheme = () => {
  // ... existing theme logic ...
  
  /**
   * Mobile width breakpoint
   * DO NOT CHANGE: Hardcoded to match --mobile-width in 01-variables.css (26rem = 416px)
   * 
   * TODO: Evaluate device capabilities
   * This should eventually come from a dedicated composable that detects:
   * - Available screen width/height
   * - Device pixel ratio
   * - Network conditions
   * - User preferences (data saver mode)
   * 
   * See: docs/tasks/composable-hero-service-device-detection.md
   * Related: Hero component responsive image serving
   */
  const MOBILE_WIDTH_PX = 416
  const MOBILE_WIDTH_REM = 26 // 416 / 16
  
  return {
    // ... existing returns ...
    MOBILE_WIDTH_PX,
    MOBILE_WIDTH_REM
  }
}
```

**Success Criteria**:
- ✅ Mobile width constants added
- ✅ Constants match CSS variable (416px / 26rem)
- ✅ TODO comment describes future work
- ✅ References device detection composable
- ✅ Links to hero component use case

---

### Task 7: Create Device Detection Composable Summary 📋

**Location**: Create new doc `docs/composables/hero-service-device-detection.md`

**Summary Document** (not implementation):
```markdown
# Hero Service and Device Width Detection Composable

**Status**: 📋 Planning (Not Yet Implemented)  
**Priority**: Medium  
**Related To**: Hero component, responsive image serving, turl/tpar system

---

## 🎯 Purpose

Create a composable that detects device capabilities and provides optimal image dimensions for responsive serving. This will replace hardcoded mobile-width values with dynamic detection.

## 🔍 Requirements

### 1. Screen Dimensions
- Detect available screen width/height
- Account for browser chrome (address bar, toolbars)
- Monitor for resize events
- Return values in both px and rem

### 2. Device Capabilities
- Device pixel ratio (retina displays)
- Viewport size vs. actual screen size
- Orientation (portrait/landscape)
- Update on orientation change

### 3. Network Conditions
- Connection type (4G, 3G, WiFi, etc.)
- Effective bandwidth
- Data saver mode detection
- Adjust image quality based on connection

### 4. User Preferences
- prefers-reduced-data media query
- prefers-reduced-motion (for animations)
- Theme preference (already handled by useTheme)

## 🏗️ Proposed API

```typescript
export const useDeviceDetection = () => {
  return {
    // Screen dimensions
    screenWidth: Ref<number>,
    screenHeight: Ref<number>,
    viewportWidth: Ref<number>,
    viewportHeight: Ref<number>,
    
    // Device info
    pixelRatio: Ref<number>,
    orientation: Ref<'portrait' | 'landscape'>,
    
    // Network
    connectionType: Ref<string>,
    effectiveBandwidth: Ref<number>,
    dataSaverMode: Ref<boolean>,
    
    // Computed optimal widths
    optimalImageWidth: ComputedRef<number>,
    shouldUseHighRes: ComputedRef<boolean>,
    
    // Methods
    refresh: () => void
  }
}
```

## 🎨 Hero Component Integration

The hero component needs responsive image serving:
1. Detect available width
2. Choose appropriate image size
3. Use tpar + calculated turl to build URL
4. Adjust quality based on network
5. Lazy load below fold

## 🔗 Relationship to turl/tpar

Instead of:
```typescript
// Hardcoded
const turl = "w=410&h=728&fit=crop"
```

Use:
```typescript
// Dynamic based on device
const { optimalImageWidth, pixelRatio } = useDeviceDetection()
const calculatedWidth = Math.min(optimalImageWidth.value, 1200)
const calculatedHeight = Math.round(calculatedWidth * aspectRatio)
const turl = `w=${calculatedWidth}&h=${calculatedHeight}&fit=crop&dpr=${pixelRatio.value}`
```

## ⚡ Performance Considerations

- Cache detection results
- Debounce resize events (250ms)
- Update only when significant change (>50px)
- Don't re-fetch images on minor changes

## 📚 Resources

- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Device Pixel Ratio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)
- [Responsive Images](https://web.dev/responsive-images/)
- [Save-Data Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Save-Data)

---

**Next Steps**:
1. Research browser support for Network Information API
2. Design fallback for unsupported browsers
3. Create composable structure
4. Implement detection logic
5. Add tests
6. Integrate with hero component
7. Update turl/tpar generation to use dynamic dimensions
```

**Success Criteria**:
- ✅ Summary document created
- ✅ API design documented
- ✅ Requirements clearly defined
- ✅ Integration points identified
- ✅ Links to related tasks included

---

### Task 8: Create Tests for New Functionality ✅

#### 8.1: Export Tests
**Location**: `tests/integration/images-export.test.ts`

```typescript
describe('Images Export API', () => {
  it('should export all images to JSON file', async () => {
    // Create test images
    // Call export endpoint
    // Verify file exists
    // Verify JSON is valid
    // Verify all fields included
  })
  
  it('should generate unique filenames', async () => {
    // Export twice
    // Verify different timestamps
  })
  
  it('should handle empty database', async () => {
    // Export with no images
    // Verify empty array in JSON
  })
})
```

#### 8.2: Import Tests
**Location**: `tests/integration/images-import-json.test.ts`

```typescript
describe('Images Import from JSON', () => {
  it('should import metadata only (option 1)', async () => {
    // Export images
    // Modify metadata in JSON
    // Import with option 1
    // Verify metadata updated
    // Verify URLs preserved
  })
  
  it('should apply to all images', async () => {
    // Import with "apply to all" checkbox
    // Verify no prompts
  })
  
  it('should handle missing images gracefully', async () => {
    // Import JSON with non-existent IDs
    // Verify error handling
  })
})
```

#### 8.3: turl/tpar Tests
**Location**: `tests/integration/images-turl-tpar.test.ts`

```typescript
describe('turl/tpar System', () => {
  it('should extract Unsplash transformation params', async () => {
    const url = 'https://images.unsplash.com/photo-123?w=128&h=128&fit=crop'
    // Import image
    // Verify turl = "w=128&h=128&fit=crop"
    // Verify tpar = "https://images.unsplash.com/photo-123?{turl}"
  })
  
  it('should extract Cloudinary transformation params', async () => {
    const url = 'https://res.cloudinary.com/account/image/upload/c_crop,w_128,h_128/v123/photo.jpg'
    // Import image
    // Verify turl = "c_crop,w_128,h_128"
    // Verify tpar = "https://res.cloudinary.com/account/image/upload/{turl}/v123/photo.jpg"
  })
  
  it('should reconstruct original URL from tpar + turl', async () => {
    // Import image
    // Get tpar and turl from shape
    // Reconstruct URL
    // Verify matches original
  })
  
  it('should calculate mobile dimensions correctly', async () => {
    // Test wide shape: 336×168 should scale to 416×208
    // Test vertical: 126×224 should scale to 416×739
    // Verify aspect ratio preserved
  })
})
```

#### 8.4: Import Modal UI Tests
**Location**: `tests/unit/cimgImport.test.ts`

```typescript
describe('cimgImport Modal', () => {
  it('should parse comma-separated URLs', () => {
    // Test multi-URL input
    // Verify array of URLs
  })
  
  it('should skip invalid URLs', () => {
    // Test mixed valid/invalid
    // Verify only valid added
  })
  
  it('should show preview thumbnails', async () => {
    // Add URLs
    // Verify ImgShape components rendered
  })
  
  it('should have readable dropdown text', () => {
    // Open owner dropdown
    // Verify contrast ratio > 4.5:1
  })
})
```

**Success Criteria**:
- ✅ All export tests passing
- ✅ All import tests passing
- ✅ All turl/tpar tests passing
- ✅ UI tests passing
- ✅ Code coverage > 80%

---

### Task 9: Update Documentation and Commit 📝

#### 9.1: Update This Task Document

Mark completed tasks with ✅ and add completion notes:
```markdown
### Task 1: Add JSON Export Button ✅ COMPLETED

**Completed on**: [Date]

**Changes**:
- Added export button to ImagesCoreAdmin toolbar
- Created /api/images/export endpoint
- Exports to /data/images/images-export-{timestamp}.json
- Shows success alert with file path

**Files Modified**:
- src/components/images/ImagesCoreAdmin.vue
- server/api/images/export.post.ts
- tests/integration/images-export.test.ts
```

#### 9.2: Create Commit Message

```bash
feat(images): Add import/export + turl/tpar system

Implemented JSON import/export and transformation parameter system for responsive images.

JSON Export/Import:
- Export entire images table to /data/images/{timestamp}.json
- Import with selective options (metadata only, full rebuild, full overwrite)
- "Apply to all" checkbox for batch processing
- Progress indicators and error handling

Import Modal Enhancements:
- Fixed white-on-white dropdown text (proper theme colors)
- Multi-URL support (comma-separated input)
- Preview thumbnails using ImgShape component
- Better validation and error messages

turl/tpar System:
- Extract transformation params to turl field
- Build tpar templates with {turl} placeholder
- Calculate mobile-responsive dimensions (416px base)
- Update all 8 shape composite fields properly

Device Detection:
- Added mobile-width CSS variable (26rem = 416px)
- Updated useTheme composable with constants
- Created device detection composable summary
- TODO for dynamic device capability detection

Tests:
- Export/import integration tests
- turl/tpar extraction and reconstruction tests
- Mobile dimension calculation tests
- UI component tests (multi-URL, dropdown, preview)
- All tests passing ✅

Files Modified:
- src/components/images/ImagesCoreAdmin.vue (export/import buttons)
- src/components/images/cimgImport.vue (UI enhancements)
- src/components/images/ImgShape.vue (preview support)
- server/api/images/export.post.ts (new)
- server/api/images/import-json.post.ts (new)
- server/adapters/base-adapter.ts (turl/tpar extraction)
- server/adapters/unsplash-adapter.ts (param extraction)
- server/adapters/cloudinary-adapter.ts (param extraction)
- src/assets/css/01-variables.css (mobile-width)
- src/composables/useTheme.ts (mobile width constants)
- tests/integration/images-export.test.ts (new)
- tests/integration/images-import-json.test.ts (new)
- tests/integration/images-turl-tpar.test.ts (new)
- tests/unit/cimgImport.test.ts (new)
- docs/tasks/2025-11-08_PLAN_C_IMPORT_EXPORT_MODAL.md
- docs/composables/hero-service-device-detection.md (new)
```

**Success Criteria**:
- ✅ All tasks marked with completion status
- ✅ Completion dates added
- ✅ Files modified list accurate
- ✅ Commit message follows conventional commits
- ✅ All tests mentioned in commit message

---

## 🎯 Success Criteria (Overall)

### Functional Requirements
- ✅ Export button generates valid JSON file
- ✅ Import button opens file picker and modal
- ✅ Import option 1 works (metadata update)
- ✅ Import options 2 & 3 show "Coming Soon"
- ✅ Owner dropdown text readable in all themes
- ✅ Multi-URL input works with comma separation
- ✅ Preview thumbnails show for all URLs
- ✅ turl/tpar fields populated for all shapes
- ✅ Mobile dimensions calculated correctly
- ✅ Original URLs reconstructable from tpar + turl

### Technical Requirements
- ✅ All new API endpoints working
- ✅ All database fields populated
- ✅ All tests passing (unit + integration)
- ✅ Code coverage maintained/improved
- ✅ No TypeScript errors
- ✅ No console errors in browser

### Documentation Requirements
- ✅ Task document updated with completion status
- ✅ Device detection composable summary created
- ✅ Code comments added for complex logic
- ✅ Commit message comprehensive and clear

---

## 📊 Progress Tracking

### Phase 1: Setup & Planning ✅
- [x] Task 0: Evaluate prior work
- [x] Create this plan document

### Phase 2: Export/Import (Tasks 1-2)
- [ ] Task 1: JSON Export
- [ ] Task 2: JSON Import (option 1 only)

### Phase 3: UI Improvements (Task 3)
- [ ] Task 3A: Fix dropdown styling
- [ ] Task 3B: Multi-URL support
- [ ] Task 3C: Preview thumbnails

### Phase 4: Backend Enhancement (Tasks 4-5)
- [ ] Task 4: Review current state
- [ ] Task 5.1: Extract transformation params
- [ ] Task 5.2: Calculate mobile dimensions
- [ ] Task 5.3: Populate shape fields

### Phase 5: Composables (Tasks 6-7)
- [ ] Task 6: Update useTheme
- [ ] Task 7: Device detection summary

### Phase 6: Testing (Task 8)
- [ ] Task 8.1: Export tests
- [ ] Task 8.2: Import tests
- [ ] Task 8.3: turl/tpar tests
- [ ] Task 8.4: UI tests

### Phase 7: Finalization (Task 9)
- [ ] Task 9.1: Update documentation
- [ ] Task 9.2: Git commit

---

## 🔗 Related Documents

- `2025-11-08_PLAN_A_CLOUDINARY.md` - Cloudinary implementation (completed)
- `2025-11-08_PLAN_B_TURL_TPAR.md` - turl/tpar concept (outlined)
- `2025-11-07_IMPROVE_IMAGES_IMPORT_WITH_BLURHASH.md` - BlurHash implementation
- `docs/composables/hero-service-device-detection.md` - Device detection spec (to be created)

---

## 📝 Notes

### Design Decisions

**Why metadata-only import first?**
- Most common use case (fixing typos, updating descriptions)
- Lowest risk (preserves expensive-to-generate URLs and BlurHashes)
- Fastest to implement and test
- Other options can be added incrementally

**Why 416px mobile width?**
- Common mobile device width (standard viewport size)
- Balances quality vs. file size
- Matches typical viewport after accounting for margins
- Can be overridden by device detection in future

**Why turl/tpar separation?**
- Enables dynamic dimension calculation without URL parsing
- Faster reconstruction (simple string replace)
- Separates concerns (params vs. structure)
- Prepares for responsive serving (swap turl based on device)

### Future Enhancements

1. **Import Options 2 & 3**: Implement full URL rebuild and full overwrite
2. **Batch Import**: Import multiple JSON files at once
3. **Selective Fields**: Choose which fields to import/update
4. **Dry Run**: Preview changes before applying
5. **Conflict Resolution**: Handle duplicate IDs, missing references
6. **Import History**: Track import operations for rollback
7. **Device Detection**: Replace hardcoded mobile-width with dynamic detection
8. **Responsive Serving**: Use tpar + calculated turl in ImgShape component

---

**Status**: 🔄 Ready to implement  
**Last Updated**: November 8, 2025  
**Next Action**: Begin Task 1 (JSON Export)
