
# Local Adapter Implementation Report
**Date:** November 20, 2025  
**Purpose:** Sharp-based Local Image Adapter for Private Images

---

## Question 1: Image Storage Strategy

### Current Requirements Analysis

**Key Constraints:**
- Every image MUST have an `xmlid` and record in `images` table
- Images are pre-selected and immediately available (not "storage for later")
- Images are tagged on upload with meaningful xmlids
- No user-only/"private" scope - minimum is project-scope
- Each image needs ~10 URLs: 1 source + 4 shapes + ~3 turl/tpar variants (future)

**Database Structure:**
```typescript
interface ImagesTableFields {
    url: string                    // Source/origin URL (required)
    shape_square?: composite_type  // url, x, y, z, tpar, turl, json, blur
    shape_wide?: composite_type    
    shape_vertical?: composite_type
    shape_thumb?: composite_type
    // Plus img_square, img_wide, img_vert, img_thumb (JSONB computed columns)
}
```

### Recommended Storage Structure

#### **Option A: Flat Structure with Semantic Naming** ✅ RECOMMENDED

```
/opt/crearis/images/
├── source/
│   ├── {xmlid}.{ext}                    # Original upload
│   └── tp.image.child-marie_2024.jpg
├── shapes/
│   ├── {xmlid}_square.{ext}             # 128×128 shape
│   ├── {xmlid}_wide.{ext}               # 336×168 shape
│   ├── {xmlid}_vertical.{ext}           # 126×224 shape
│   ├── {xmlid}_thumb.{ext}              # 64×64 shape
│   └── tp.image.child-marie_2024_square.jpg
└── transforms/                           # Future: turl/tpar variants
    ├── {xmlid}_t1.{ext}
    ├── {xmlid}_t2.{ext}
    └── {xmlid}_t3.{ext}
```

**Advantages:**
- ✅ Simple to navigate and debug
- ✅ Easy to identify orphaned files
- ✅ Fast filesystem operations (no deep recursion)
- ✅ Easy to backup/sync specific folders
- ✅ xmlid provides natural namespacing
- ✅ Scales well up to ~100,000 files per folder (Linux ext4/XFS)

**URL Pattern:**
```
Source:   http://localhost:3000/images/source/tp.image.child-marie_2024.jpg
Square:   http://localhost:3000/images/shapes/tp.image.child-marie_2024_square.jpg
Wide:     http://localhost:3000/images/shapes/tp.image.child-marie_2024_wide.jpg
```

#### **Option B: Deep Folder Structure by Project** (Not Recommended)

```
/opt/crearis/images/
├── tp/                                   # Project domaincode
│   ├── source/
│   └── shapes/
├── crearis/
│   ├── source/
│   └── shapes/
└── demo/
```

**Disadvantages:**
- ❌ Harder to locate specific image without knowing project
- ❌ More complex to implement project transfers
- ❌ Doesn't align with database structure (project_id can change)

---

## Question 2: Sharp Capabilities for XYZ Transformation

### Sharp Feature Analysis

**Sharp v0.34.5** (already installed) provides excellent capabilities:

#### **1. Focal Point Cropping** ✅ AVAILABLE

Sharp has built-in support for focal point positioning via `extract()` and `resize()`:

```typescript
import sharp from 'sharp'

// XYZ to Sharp transformation
const image = sharp('source.jpg')
const metadata = await image.metadata()

// Calculate focal point coordinates
const x = Math.round((xPercent / 100) * metadata.width!)
const y = Math.round((yPercent / 100) * metadata.height!)
const z = zPercent / 100  // Shrink multiplier

// Extract region around focal point
await image
    .extract({
        left: Math.max(0, x - targetWidth / 2),
        top: Math.max(0, y - targetHeight / 2),
        width: Math.min(targetWidth, metadata.width! - left),
        height: Math.min(targetHeight, metadata.height! - top)
    })
    .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'centre'
    })
    .toFile('output.jpg')
```

#### **2. Smart Cropping** ✅ AVAILABLE

Sharp supports entropy-based and attention-based cropping (similar to Unsplash/Cloudinary):

```typescript
// Entropy cropping (like Unsplash)
await sharp('source.jpg')
    .resize(336, 168, {
        fit: 'cover',
        position: 'entropy'  // Smart crop to interesting region
    })
    .toFile('wide.jpg')

// Attention cropping (face/object detection)
await sharp('source.jpg')
    .resize(64, 64, {
        fit: 'cover',
        position: 'attention'  // Prioritizes faces and salient features
    })
    .toFile('thumb.jpg')
```

**Available Position Strategies:**
- `'entropy'` - Focuses on region with highest information density
- `'attention'` - Uses edge detection and face recognition
- `'centre'` - Simple center crop
- `sharp.strategy.entropy` - More granular control
- `sharp.strategy.attention` - More granular control

#### **3. Reference Implementation for XYZ** ✅ PERFECT FIT

Sharp provides **ideal testing environment** for XYZ feature because:

1. **Predictable Transformations:** Unlike Unsplash/Cloudinary API quirks, Sharp gives exact pixel-level control
2. **Instant Feedback:** No network latency - transformations happen locally in <100ms
3. **Debug-Friendly:** Can save intermediate steps to files for visual inspection
4. **Deterministic:** Same input → same output (external APIs sometimes vary)

**XYZ Implementation in Sharp:**

```typescript
// Convert 0-100 XYZ scale to Sharp operations
async function applyXYZTransform(
    sourceFile: string,
    outputFile: string,
    shape: 'square' | 'wide' | 'vertical' | 'thumb',
    x: number,  // 0-100 (50=center)
    y: number,  // 0-100 (50=center)
    z: number   // Shrink multiplier (100=wide default, 50=show 2x more)
) {
    const image = sharp(sourceFile)
    const meta = await image.metadata()
    
    // Shape dimensions
    const dims = {
        square: { w: 128, h: 128 },
        wide: { w: 336, h: 168 },
        vertical: { w: 126, h: 224 },
        thumb: { w: 64, h: 64 }
    }[shape]
    
    // Calculate focal point in pixels
    const focalX = Math.round((x / 100) * meta.width!)
    const focalY = Math.round((y / 100) * meta.height!)
    
    // Calculate zoom level (z=100 is baseline)
    // z=50 → shrink to 50% → show 2x more context
    // z=200 → expand to 200% → zoom in 2x
    const zoomFactor = z / 100
    
    // Extract size based on zoom
    const extractW = Math.round(dims.w / zoomFactor)
    const extractH = Math.round(dims.h / zoomFactor)
    
    // Calculate extract region centered on focal point
    const left = Math.max(0, Math.min(meta.width! - extractW, focalX - extractW / 2))
    const top = Math.max(0, Math.min(meta.height! - extractH, focalY - extractH / 2))
    
    await image
        .extract({ left, top, width: extractW, height: extractH })
        .resize(dims.w, dims.h, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputFile)
}
```

---

## Current XYZ Issues with Cloudinary/Unsplash

### Problem Analysis

**From ImagesCoreAdmin.vue (lines 881-956):**

1. **Cloudinary Offset Calculation Issue:**
```typescript
// CURRENT (BUGGY):
const offsetX = Math.round((x - 50) * (params.get('w') ? parseInt(params.get('w')!) / 100 : 3.36))

// PROBLEM: Uses 3.36 hardcoded fallback when width param missing
// RESULT: Incorrect offsets for shapes with different dimensions
```

**Fix:** Always extract width/height from params, or default to shape dimensions:
```typescript
const width = params.get('w') ? parseInt(params.get('w')!) : { square: 128, wide: 336, vertical: 126, thumb: 64 }[shape]
const offsetX = Math.round((x - 50) * (width / 100))
```

2. **Unsplash Z-Value Interpretation:**
```typescript
// CURRENT: Uses shrink multiplier (inverse of zoom)
const shrinkMultiplier = z / 100
const fpZ = 1.0 / shrinkMultiplier

// PROBLEM: fp-z range is 1.0-2.0, but formula allows 0.01-10.0
// RESULT: Values like fp-z=10.0 cause Unsplash API to fail
```

**Fix:** Clamp fp-z to valid range:
```typescript
const fpZ = Math.max(1.0, Math.min(2.0, 1.0 / shrinkMultiplier))
```

3. **Missing Shape Context:**
Both adapters don't receive the `shape` parameter, so they can't adjust for shape-specific defaults.

---

## Additional Topics for Decision

### 1. **Image Upload Flow**

**Proposed Workflow:**
```
1. User uploads file → /api/images/upload
2. Validate file (type, size, malware scan)
3. Generate xmlid (project.image.subject-{uuid})
4. Save source to /opt/crearis/images/source/{xmlid}.{ext}
5. Generate 4 shapes using Sharp (entropy crop by default)
6. Insert database record with all URLs
7. Return image_id + URLs to frontend
```

**Upload API Requirements:**
- Multipart form data handling
- File type validation (jpg, png, webp, gif)
- Size limit (10MB recommended)
- Virus scanning (ClamAV integration?)
- Concurrent upload handling (max 5 simultaneous?)

### 2. **Shape Regeneration Strategy**

**When to regenerate shapes:**
- ✅ On upload (always)
- ✅ When XYZ values change (focal point edit)
- ✅ When source URL changes (re-import)
- ⚠️ When shape dimensions change (CSS update) - batch operation needed

**Regeneration Endpoint:**
```
POST /api/images/{id}/regenerate-shapes
Body: { shapes: ['square', 'wide'] }  // Optional: specific shapes only
```

### 3. **Performance Considerations**

**Sharp Processing Time (estimated):**
- Source validation: ~10ms
- Single shape generation: ~50-100ms
- All 4 shapes: ~200-400ms total (can parallelize)

**Caching Strategy:**
- ✅ Use filesystem directly (no Redis needed for images)
- ✅ Add `Cache-Control: max-age=31536000` headers (immutable)
- ✅ Use ETag headers for conditional requests
- ✅ Consider CDN for production (Cloudflare/BunnyCDN)

### 4. **Filename Collision Handling**

**Strategy:** xmlid is unique, so collisions impossible if xmlid uniqueness enforced

**Safeguard:**
```typescript
// Check if file exists before writing
const targetPath = path.join(IMAGES_DIR, 'source', `${xmlid}.${ext}`)
if (await fs.exists(targetPath)) {
    throw new Error(`Image with xmlid ${xmlid} already exists`)
}
```

### 5. **Image Format Strategy**

**Recommendations:**
- **Source:** Keep original format (jpg, png, webp, gif)
- **Shapes:** Convert to WebP for modern browsers (smaller size, better quality)
- **Fallback:** Keep JPEG for older browsers (detect via `Accept` header)

**Sharp Configuration:**
```typescript
await sharp(source)
    .resize(width, height)
    .webp({ quality: 85, effort: 4 })  // Good balance of size/quality
    .toFile(outputWebP)

// Optional: Generate JPEG fallback
await sharp(source)
    .resize(width, height)
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputJPEG)
```

### 6. **Serving Strategy**

**Option A: Nitro Static Assets** ✅ RECOMMENDED
```typescript
// nitro.config.ts
export default defineNitroConfig({
    publicAssets: [
        { dir: '/opt/crearis/images', baseURL: '/images', maxAge: 31536000 }
    ]
})
```

**Option B: Custom Endpoint**
```typescript
// server/api/images/serve/[...path].get.ts
export default defineEventHandler(async (event) => {
    const path = getRouterParam(event, 'path')
    const file = await readFile(`/opt/crearis/images/${path}`)
    setHeader(event, 'Content-Type', 'image/jpeg')
    return file
})
```

---

## Recommendations Summary

### Immediate Actions

1. **✅ Use Flat Storage Structure** (Option A) with xmlid-based naming
2. **✅ Implement Sharp-based Local Adapter** as reference implementation
3. **✅ Fix Cloudinary/Unsplash XYZ bugs** before implementing local adapter
4. **✅ Use Sharp's entropy/attention** for auto-cropping (matches external adapters)

### Implementation Order

**Phase 1: Core Adapter** (2-3 days)
- Upload endpoint with file validation
- Source image storage
- Shape generation using Sharp
- Database record creation
- Basic URL serving

**Phase 2: XYZ Integration** (1-2 days)
- Implement focal point transformation
- Test with ShapeEditor.vue
- Verify preview functionality
- Document transformation formula

**Phase 3: Bug Fixes** (1 day)
- Fix Cloudinary offset calculation
- Fix Unsplash fp-z clamping
- Add shape context to transformations

**Phase 4: Optimization** (1-2 days)
- Parallel shape generation
- WebP conversion
- Cache headers
- Error handling

---

## Sharp XYZ Reference Implementation

This will be the **gold standard** for testing ShapeEditor because:

1. **No API Limitations:** No rate limits, no network errors, instant feedback
2. **Pixel-Perfect Control:** Exact mathematical relationship between XYZ and output
3. **Visual Debugging:** Can save intermediate steps to verify transformations
4. **Deterministic:** Always produces same output for same input (unlike Cloudinary's ML)

Once the local adapter XYZ implementation is validated, we can use it to **fix the external adapters** by comparing their output to Sharp's reference output.

---

**Ready for Phase 1 implementation?**