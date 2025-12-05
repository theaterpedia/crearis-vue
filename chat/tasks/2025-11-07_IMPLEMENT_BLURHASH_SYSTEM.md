# Implement BlurHash Placeholder System

**Status**: Implementation Complete - Needs Testing  
**Date**: November 7, 2025  
**Depends on**: Migration 019 (blur/turl/tpar fields in image_shape)

---

## 📋 Overview

### Objective
Implement end-to-end BlurHash support for instant image placeholders:
- **Backend**: Generate BlurHash strings when images are created/updated
- **Frontend**: Decode and display BlurHash placeholders while images load

### What is BlurHash?
BlurHash is a compact representation of a placeholder for an image. It encodes an image into a ~20-30 character ASCII string that can be decoded into a blurred placeholder on the client side.

**Example**:
```
blur: "LGF5?xYk^6#M@-5c,1J5@[or[Q6."
→ Decoded into 32x32 pixel blurred canvas
→ Displayed instantly while full image loads
```

**Benefits**:
- ✅ Instant visual feedback (no white flashes)
- ✅ Perceived performance improvement
- ✅ Smooth progressive loading
- ✅ Tiny data footprint (30 bytes vs 2KB for tiny JPG)

---

## 🎯 Implementation Strategy

### Part 1: Backend BlurHash Generation

**When to generate**:
- Image creation (`POST /api/images`)
- Image update with new URL (`PUT /api/images/:id`, `PATCH /api/images/:id`)
- Batch import (`POST /api/images/import`)

**Where to generate**:
- Shape computation happens in database triggers
- BlurHash generation must happen in API endpoints BEFORE insert/update
- Store in `shape_square.blur`, `shape_wide.blur`, etc.

**Flow**:
```
1. User uploads/updates image
2. API endpoint receives URL
3. Download image from URL
4. Generate BlurHash for each shape variant
5. Store BlurHash in shape_*.blur fields
6. Database triggers compute img_* JSONB fields (includes blur)
7. Entity tables receive img_* with blur via propagation trigger
```

---

### Part 2: Frontend BlurHash Display (ImgShape.vue)

**Component structure**:
```vue
<template>
  <div class="img-shape-wrapper">
    <!-- BlurHash placeholder (shown first) -->
    <canvas 
      v-if="showPlaceholder && blurHash" 
      ref="canvasRef"
      :class="cssClasses"
      class="img-shape-placeholder"
    />
    
    <!-- Actual image (fades in when loaded) -->
    <img 
      v-if="displayUrl"
      :src="displayUrl" 
      :alt="altText"
      :class="cssClasses"
      class="img-shape-main"
      :style="{ opacity: imageLoaded ? 1 : 0 }"
      @load="onImageLoad"
    />
  </div>
</template>
```

**Props update**:
```typescript
export interface ImgShapeData {
    type?: 'url' | 'params' | 'json'
    url?: string
    x?: number | null
    y?: number | null
    z?: number | null
    options?: Record<string, any> | null
    blur?: string | null  // NEW: BlurHash string
    turl?: string | null  // NEW: Transform base URL
    tpar?: string | null  // NEW: Transform parameters
}
```

---

## 📦 Dependencies

### Backend Dependencies

**BlurHash Encoder** (Node.js):
```json
{
  "dependencies": {
    "blurhash": "^2.0.5",
    "sharp": "^0.33.5"
  }
}
```

**Why Sharp?**
- Fast image processing in Node.js
- Required to decode image data for BlurHash encoding
- Can also generate optimized thumbnails (future enhancement)

---

### Frontend Dependencies

**BlurHash Decoder** (Browser):
```json
{
  "dependencies": {
    "blurhash": "^2.0.5"
  }
}
```

**Note**: Same package works in both Node.js and browser (different entry points).

---

## 🔧 Backend Implementation

### Step 1: Install Dependencies

```bash
pnpm add blurhash sharp
pnpm add -D @types/sharp
```

---

### Step 2: Create BlurHash Utility

**File**: `server/utils/blurhash.ts`

```typescript
import { encode } from 'blurhash'
import sharp from 'sharp'

export interface BlurHashOptions {
  componentX?: number  // Default: 4 (horizontal detail)
  componentY?: number  // Default: 3 (vertical detail)
  width?: number       // Resize width before encoding (default: 32)
  height?: number      // Resize height before encoding (default: 32)
}

/**
 * Generate BlurHash from image URL or Buffer
 */
export async function generateBlurHash(
  input: string | Buffer,
  options: BlurHashOptions = {}
): Promise<string | null> {
  try {
    const {
      componentX = 4,
      componentY = 3,
      width = 32,
      height = 32
    } = options

    // Download image if URL provided
    let imageBuffer: Buffer
    if (typeof input === 'string') {
      const response = await fetch(input)
      if (!response.ok) {
        console.error(`[BlurHash] Failed to fetch image: ${response.status}`)
        return null
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else {
      imageBuffer = input
    }

    // Process image with Sharp
    const { data, info } = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Generate BlurHash
    const hash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      componentX,
      componentY
    )

    return hash
  } catch (error) {
    console.error('[BlurHash] Error generating hash:', error)
    return null
  }
}

/**
 * Generate BlurHash for all shape variants
 * Returns object with blur strings for each shape
 */
export async function generateShapeBlurHashes(
  imageUrl: string
): Promise<{
  square?: string | null
  wide?: string | null
  vertical?: string | null
  thumb?: string | null
}> {
  // For now, use same BlurHash for all shapes
  // Future: Generate different hashes based on crop/aspect ratio
  const hash = await generateBlurHash(imageUrl, {
    componentX: 4,
    componentY: 3,
    width: 32,
    height: 32
  })

  return {
    square: hash,
    wide: hash,
    vertical: hash,
    thumb: hash
  }
}
```

---

### Step 3: Update POST /api/images

**File**: `server/api/images/index.post.ts`

```typescript
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'
import { generateShapeBlurHashes } from '../../utils/blurhash'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        if (!body.name || !body.url) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: name and url'
            })
        }

        // Generate BlurHash for all shapes
        const blurHashes = await generateShapeBlurHashes(body.url)

        const imageData: Partial<ImagesTableFields> = {
            xmlid: body.xmlid || null,
            name: body.name,
            url: body.url,
            project_id: body.project_id || null,
            status_id: body.status_id || 0,
            owner_id: body.owner_id || null,
            alt_text: body.alt_text || null,
            title: body.title || null,
            x: body.x || null,
            y: body.y || null,
            fileformat: body.fileformat || 'none',
            embedformat: body.embedformat || null,
            license: body.license || 'BY',
            length: body.length || null
        }

        // Helper to format composite type with blur
        const formatShape = (shapeData: any, blur: string | null) => {
            if (!shapeData && !blur) return null
            
            const x = shapeData?.x || null
            const y = shapeData?.y || null
            const z = shapeData?.z || null
            const url = shapeData?.url || body.url
            const json = null // Not used yet
            const blurVal = blur || null
            const turl = shapeData?.turl || null
            const tpar = shapeData?.tpar || null

            return `(${x || ''},${y || ''},${z || ''},"${url}",${json || ''},${blurVal ? `"${blurVal}"` : ''},${turl ? `"${turl}"` : ''},${tpar ? `"${tpar}"` : ''})`
        }

        const sql = `
            INSERT INTO images (
                xmlid, name, url, project_id, status_id, owner_id,
                alt_text, title, x, y, fileformat, embedformat, license, length,
                shape_square, shape_wide, shape_vertical, shape_thumb
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            imageData.xmlid,
            imageData.name,
            imageData.url,
            imageData.project_id,
            imageData.status_id,
            imageData.owner_id,
            imageData.alt_text,
            imageData.title,
            imageData.x,
            imageData.y,
            imageData.fileformat,
            imageData.embedformat,
            imageData.license,
            imageData.length,
            formatShape(body.shape_square, blurHashes.square),
            formatShape(body.shape_wide, blurHashes.wide),
            formatShape(body.shape_vertical, blurHashes.vertical),
            formatShape(body.shape_thumb, blurHashes.thumb)
        ])

        return { id: result.lastID, ...imageData }
    } catch (error) {
        console.error('[POST /api/images] Error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create image'
        })
    }
})
```

---

### Step 4: Update PUT /api/images/:id

**File**: `server/api/images/[id].put.ts`

Add BlurHash generation when `url` or shape fields change:

```typescript
import { generateShapeBlurHashes } from '../../utils/blurhash'

// ... existing code ...

// After reading body, check if URL changed
let blurHashes: any = null
if (body.url && body.url !== existing.url) {
    // URL changed, regenerate BlurHash
    blurHashes = await generateShapeBlurHashes(body.url)
}

// In the shape field handling section:
if (field === 'shape_square' || field === 'shape_wide' || field === 'shape_vertical' || field === 'shape_thumb') {
    const shape = body[field]
    if (shape) {
        // Use provided blur or newly generated one
        const blur = shape.blur || (blurHashes ? blurHashes[field.replace('shape_', '')] : null)
        
        const compositeValues = [
            shape.x || null,
            shape.y || null,
            shape.z || null,
            shape.url || '',
            null,  // json
            blur,  // blur
            shape.turl || null,
            shape.tpar || null
        ]
        updates.push(`${field} = ?`)
        values.push(formatComposite(compositeValues, true))
    }
}
```

---

### Step 5: Update PATCH /api/images/:id

Similar changes to PUT endpoint - generate BlurHash when URL changes.

---

### Step 6: Update Import Endpoint

**File**: `server/api/images/import.post.ts`

Add BlurHash generation during batch import (may be slow for large batches - consider background job for production).

---

## 🎨 Frontend Implementation

### Step 1: Install Dependencies

```bash
pnpm add blurhash
```

---

### Step 2: Create BlurHash Composable

**File**: `src/composables/useBlurHash.ts`

```typescript
import { ref, watch, onMounted } from 'vue'
import { decode } from 'blurhash'

export interface UseBlurHashOptions {
  hash: string | null | undefined
  width?: number
  height?: number
  punch?: number  // Controls contrast (default: 1)
}

export function useBlurHash(options: UseBlurHashOptions) {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isDecoded = ref(false)

  const decodeHash = () => {
    if (!options.hash || !canvasRef.value) return

    const canvas = canvasRef.value
    const width = options.width || 32
    const height = options.height || 32
    const punch = options.punch || 1

    try {
      // Decode BlurHash into pixel array
      const pixels = decode(options.hash, width, height, punch)

      // Draw to canvas
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imageData = ctx.createImageData(width, height)
      imageData.data.set(pixels)
      ctx.putImageData(imageData, 0, 0)

      isDecoded.value = true
    } catch (error) {
      console.error('[BlurHash] Decode error:', error)
    }
  }

  // Decode when canvas ref is available
  watch([canvasRef, () => options.hash], () => {
    if (canvasRef.value && options.hash) {
      decodeHash()
    }
  })

  onMounted(() => {
    if (canvasRef.value && options.hash) {
      decodeHash()
    }
  })

  return {
    canvasRef,
    isDecoded
  }
}
```

---

### Step 3: Update ImgShape.vue

**File**: `src/components/images/ImgShape.vue`

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useBlurHash } from '@/composables/useBlurHash'

export interface ImgShapeData {
    type?: 'url' | 'params' | 'json'
    url?: string
    x?: number | null
    y?: number | null
    z?: number | null
    options?: Record<string, any> | null
    blur?: string | null      // NEW: BlurHash string
    turl?: string | null      // NEW: Transform base URL
    tpar?: string | null      // NEW: Transform parameters
}

// ... existing props ...

const imageLoaded = ref(false)
const showPlaceholder = ref(true)

// BlurHash setup
const { canvasRef, isDecoded } = useBlurHash({
  hash: props.data.blur,
  width: 32,
  height: 32,
  punch: 1
})

// ... existing computed properties ...

/**
 * Handle image load event
 */
const onImageLoad = () => {
  imageLoaded.value = true
  // Hide placeholder after 300ms fade
  setTimeout(() => {
    showPlaceholder.value = false
  }, 300)
}

/**
 * Reset on URL change
 */
watch(() => props.data.url, () => {
  imageLoaded.value = false
  showPlaceholder.value = true
})

// ... rest of existing code ...
</script>

<template>
  <div class="img-shape-wrapper">
    <!-- BlurHash placeholder canvas -->
    <canvas
      v-if="showPlaceholder && data.blur"
      ref="canvasRef"
      :class="cssClasses"
      class="img-shape-placeholder"
      :aria-hidden="true"
    />

    <!-- Actual image -->
    <img
      v-if="displayUrl"
      :src="displayUrl"
      :alt="altText"
      :class="cssClasses"
      class="img-shape-main"
      :style="{ opacity: imageLoaded ? 1 : 0 }"
      @load="onImageLoad"
    />
  </div>
</template>

<style scoped>
.img-shape-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.img-shape-placeholder,
.img-shape-main {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-shape-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  filter: blur(10px);
  transform: scale(1.1); /* Prevent edge artifacts */
}

.img-shape-main {
  position: relative;
  transition: opacity 300ms ease-in-out;
}

/* ... existing shape styles ... */
</style>
```

---

## 🧪 Testing Strategy

### Backend Tests

**File**: `tests/api/images-blurhash.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '../utils/db-test-utils'

describe('BlurHash Generation', () => {
  it('should generate BlurHash on image creation', async () => {
    const response = await fetch('http://localhost:3000/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Image',
        url: 'https://images.unsplash.com/photo-test.jpg'
      })
    })

    const result = await response.json()
    const image = await db.get('SELECT img_square FROM images WHERE id = ?', [result.id])

    expect(image.img_square.blur).toBeTruthy()
    expect(image.img_square.blur).toMatch(/^[A-Za-z0-9#$%*+,-.:;=?@[\]^_{|}~]+$/)
  })

  it('should regenerate BlurHash on URL change', async () => {
    // Create image
    const createRes = await fetch('http://localhost:3000/api/images', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        url: 'https://images.unsplash.com/photo-1.jpg'
      })
    })
    const { id } = await createRes.json()

    // Update URL
    const updateRes = await fetch(`http://localhost:3000/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        url: 'https://images.unsplash.com/photo-2.jpg'
      })
    })

    const updated = await updateRes.json()
    expect(updated.img_square.blur).toBeTruthy()
  })
})
```

---

### Frontend Tests

**File**: `tests/components/ImgShape.blurhash.test.ts`

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ImgShape from '@/components/images/ImgShape.vue'

describe('ImgShape BlurHash', () => {
  it('should render BlurHash canvas when blur prop provided', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        data: {
          url: 'https://example.com/image.jpg',
          blur: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.'
        },
        shape: 'card'
      }
    })

    await wrapper.vm.$nextTick()

    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.classes()).toContain('img-shape-placeholder')
  })

  it('should hide canvas after image loads', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        data: {
          url: 'https://example.com/image.jpg',
          blur: 'LGF5?xYk^6#M'
        },
        shape: 'card'
      }
    })

    const img = wrapper.find('img')
    await img.trigger('load')
    
    // Wait for fade transition
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.find('canvas').exists()).toBe(false)
  })
})
```

---

## ⚠️ Performance Considerations

### Backend

**Issue**: BlurHash generation requires downloading and processing images
- **Impact**: 200-500ms per image (network + encoding)
- **Mitigation**:
  1. Generate only for new/changed URLs
  2. Use background job queue for batch imports
  3. Cache BlurHash results in Redis (future)
  4. Skip generation if URL hasn't changed

**Example optimization**:
```typescript
// Only generate if URL changed
if (body.url && body.url !== existing.url) {
    blurHashes = await generateShapeBlurHashes(body.url)
}
```

---

### Frontend

**Issue**: Canvas rendering on every component mount
- **Impact**: Minimal (decode takes 1-5ms)
- **Mitigation**: BlurHash decode is fast, no optimization needed

**Issue**: Memory usage with many images
- **Impact**: 32x32 canvas = ~4KB per image
- **Mitigation**: Remove canvas after image loads (already implemented)

---

## 🔄 Rollback Strategy

If BlurHash causes issues:

1. **Backend**: Remove BlurHash generation from API endpoints
   - Shape fields remain compatible (blur is optional)
   - Existing data unaffected

2. **Frontend**: Revert ImgShape.vue changes
   - Component falls back to direct image loading
   - No breaking changes to props

3. **Database**: No changes needed
   - blur/turl/tpar fields added in migration 019
   - Can be NULL without issues

---

## 📝 Implementation Checklist

### Backend
- [ ] Install dependencies (`blurhash`, `sharp`)
- [ ] Create `server/utils/blurhash.ts` utility
- [ ] Update `POST /api/images` (generate on create)
- [ ] Update `PUT /api/images/:id` (regenerate on URL change)
- [ ] Update `PATCH /api/images/:id` (regenerate on URL change)
- [ ] Update `POST /api/images/import` (batch generation)
- [ ] Write backend tests (`images-blurhash.test.ts`)
- [ ] Test with real Unsplash URLs
- [ ] Verify database triggers propagate blur to entities

### Frontend
- [ ] Install dependencies (`blurhash`)
- [ ] Create `src/composables/useBlurHash.ts`
- [ ] Update `ImgShape.vue` component
  - [ ] Add blur prop to ImgShapeData interface
  - [ ] Add canvas element for placeholder
  - [ ] Add fade transition logic
  - [ ] Add image load handler
- [ ] Write frontend tests (`ImgShape.blurhash.test.ts`)
- [ ] Test with BaseView card grid
- [ ] Test with ImagesCoreAdmin preview
- [ ] Verify smooth loading transitions

### Documentation
- [ ] Update API documentation (blur field in responses)
- [ ] Document BlurHash utility functions
- [ ] Add performance notes to docs
- [ ] Update component documentation (ImgShape.vue)

### Production
- [ ] Test with production image URLs
- [ ] Monitor backend performance (BlurHash generation time)
- [ ] Monitor frontend performance (decode time, memory)
- [ ] Set up error tracking (failed encodes/decodes)

---

## 📊 Timeline

1. **Backend Implementation**: 3-4 hours
   - Utility function: 1 hour
   - API endpoint updates: 2 hours
   - Testing: 1 hour

2. **Frontend Implementation**: 2-3 hours
   - Composable: 1 hour
   - ImgShape.vue update: 1 hour
   - Testing: 1 hour

3. **Integration Testing**: 1-2 hours
   - End-to-end flow testing
   - Performance validation
   - Edge case handling

**Total**: 6-9 hours

---

## 🔗 Related Files

- **Backend**:
  - `server/utils/blurhash.ts` (new)
  - `server/api/images/index.post.ts`
  - `server/api/images/[id].put.ts`
  - `server/api/images/[id].patch.ts`
  - `server/api/images/import.post.ts`

- **Frontend**:
  - `src/composables/useBlurHash.ts` (new)
  - `src/components/images/ImgShape.vue`

- **Tests**:
  - `tests/api/images-blurhash.test.ts` (new)
  - `tests/components/ImgShape.blurhash.test.ts` (new)

- **Documentation**:
  - `docs/tasks/2025-11-07_TWEAK_MIGRATION019_table_images_blur_turl_tpar.md` (prerequisite)
  - `docs/API.md` (update)

---

## 💡 Future Enhancements

### Phase 2: Smart BlurHash Generation
- Generate different BlurHashes for different crops (square, wide, vertical)
- Use focal point data to generate better placeholders
- Cache BlurHash results in Redis

### Phase 3: Progressive Image Loading
- Combine BlurHash with srcset/picture for responsive images
- Generate multiple quality tiers (blur → low-res → full)
- Implement lazy loading with Intersection Observer

### Phase 4: Advanced Placeholder Strategies
- Dominant color extraction (faster than BlurHash)
- LQIP (Low Quality Image Placeholder) using Sharp
- WebP/AVIF format support

---

## ✅ Success Criteria

- ✅ All images display BlurHash placeholder before loading
- ✅ Smooth fade transition from placeholder to full image
- ✅ BlurHash generation doesn't block API responses (< 500ms overhead)
- ✅ Frontend decode happens in < 5ms per image
- ✅ Entity tables automatically receive blur data via triggers
- ✅ No memory leaks (canvases cleaned up after image loads)
- ✅ All tests passing (backend + frontend)

---

**Next Steps**: Start with backend utility implementation, then API endpoints, then frontend component.
