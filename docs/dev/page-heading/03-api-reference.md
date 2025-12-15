# API Reference

## Header Configs API

### Base Endpoints

#### GET /api/header-configs

Returns all header configuration data including base types, subcategories, and project overrides.

**Response:**
```json
{
  "baseTypes": [
    {
      "id": 1,
      "name": "simple",
      "formatOptions": {},
      "allowedSizes": ["mini", "medium", "prominent", "full"],
      "isActive": true
    },
    {
      "id": 2,
      "name": "banner",
      "formatOptions": {
        "imgTmpAlignY": "top",
        "contentAlignY": "center"
      },
      "allowedSizes": ["mini", "medium", "prominent"],
      "isActive": true
    }
  ],
  "subcategories": [
    {
      "id": 1,
      "baseTypeId": 2,
      "name": "banner_event",
      "formatOptions": {
        "gradientType": "dark",
        "gradientDepth": 0.4
      },
      "allowedSizes": ["medium", "prominent"]
    }
  ],
  "projectOverrides": [
    {
      "id": 1,
      "projectId": "tp",
      "subcategoryId": 1,
      "formatOptions": {
        "contentWidth": "full"
      },
      "isActive": true
    }
  ]
}
```

#### GET /api/header-configs/base-types

Returns only base types.

#### GET /api/header-configs/subcategories

Returns subcategories with their base type relationships.

#### GET /api/header-configs/resolve

Resolves configuration for a specific context.

**Query Parameters:**
- `headerType` (required): Base type name
- `headerSubtype` (optional): Subcategory name
- `projectId` (optional): Project ID for override lookup

**Response:**
```json
{
  "name": "banner",
  "headerSize": "medium",
  "imgTmpAlignY": "top",
  "contentAlignY": "center",
  "gradientType": "dark",
  "gradientDepth": 0.4,
  "allowedSizes": ["medium", "prominent"],
  "isActive": true
}
```

---

## Images API (Hero Integration)

### GET /api/images/:id

Returns full image data with shape instances.

**Response:**
```json
{
  "id": 107,
  "xmlid": "tp.image.landscape-001",
  "url": "https://storage.example.com/images/abc123.jpg",
  "adapter": "crearis",
  "alt_text": "Mountain landscape at sunset",
  "author": {
    "name": "John Doe",
    "uri": "https://example.com/john"
  },
  "shape_vertical": {
    "url": "https://storage.example.com/shapes/abc123_vertical.jpg",
    "blur": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    "x": 100,
    "y": 0
  },
  "shape_wide": { ... },
  "shape_square": { ... },
  "hero_vertical": {
    "url": "https://storage.example.com/hero/abc123_vertical.jpg",
    "blur": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
  },
  "hero_square": { ... },
  "hero_wide": { ... },
  "hero_wide_xl": { ... },
  "hero_square_xl": { ... }
}
```

### GET /api/images/xmlid/:xmlid

Same as above but fetches by xmlid instead of numeric id.

### POST /api/images/:id/regenerate-shapes

Regenerates all shape instances for an image.

**Request Body:**
```json
{
  "adapter": "crearis"
}
```

**Response:**
```json
{
  "success": true,
  "shapes": {
    "shape_vertical": { "url": "...", "blur": "..." },
    "shape_wide": { ... },
    "shape_square": { ... },
    "hero_vertical": { ... },
    "hero_square": { ... },
    "hero_wide": { ... },
    "hero_wide_xl": { ... },
    "hero_square_xl": { ... }
  }
}
```

---

## Client-Side Composables

### useHeaderConfig

Resolves header configuration client-side with caching.

**Location:** `src/composables/useHeaderConfig.ts`

**Usage:**
```typescript
import { useHeaderConfig } from '@/composables/useHeaderConfig'

const { resolvedConfig, isLoading, error } = useHeaderConfig({
  headerType: computed(() => props.headerType),
  headerSubtype: computed(() => props.formatOptions?.headerSubtype),
  useApi: true  // Enable API-based resolution
})

// resolvedConfig is a computed ref with merged configuration
console.log(resolvedConfig.value)
// { name: 'banner', headerSize: 'medium', imgTmpAlignY: 'top', ... }
```

### useImageFetch

Fetches image data from API.

**Location:** `src/composables/useImageFetch.ts`

**Usage:**
```typescript
import { useImageFetch } from '@/composables/useImageFetch'

const { imageData, isLoading, hasError, fetchImage } = useImageFetch()

// Fetch by id
await fetchImage({ id: 107 })

// Fetch by xmlid
await fetchImage({ xmlid: 'tp.image.landscape-001' })

// Access result
console.log(imageData.value.hero_wide?.url)
```

### useBlurHash

Decodes BlurHash strings to canvas.

**Location:** `src/composables/useBlurHash.ts`

**Usage:**
```typescript
import { useBlurHash } from '@/composables/useBlurHash'

const { canvasRef, isDecoded } = useBlurHash({
  hash: computed(() => imageData.value?.hero_wide?.blur),
  width: 32,
  height: 32
})

// Get data URL from canvas when decoded
const blurHashUrl = computed(() => {
  if (isDecoded.value && canvasRef.value) {
    return canvasRef.value.toDataURL('image/png')
  }
  return null
})
```

---

## Type Definitions

### ImageApiResponse

```typescript
interface ShapeData {
  url?: string
  blur?: string
  turl?: string
  tpar?: string
  x?: number
  y?: number
  z?: number
}

interface ImageApiResponse {
  id: number
  xmlid: string
  url: string
  adapter: string
  alt_text: string | null
  author: {
    name: string
    uri: string | null
  } | null
  
  // Template shapes
  shape_vertical?: ShapeData
  shape_wide?: ShapeData
  shape_square?: ShapeData
  
  // Hero instances
  hero_vertical?: ShapeData
  hero_square?: ShapeData
  hero_wide?: ShapeData
  hero_wide_xl?: ShapeData
  hero_square_xl?: ShapeData
}
```

### HeaderConfig

```typescript
interface HeaderConfig {
  name: string
  headerSize: 'mini' | 'medium' | 'prominent' | 'full'
  allowedSizes?: string[]
  isActive?: boolean
  
  // Image positioning
  imgTmpAlignX?: 'left' | 'right' | 'center' | 'stretch' | 'cover'
  imgTmpAlignY?: 'top' | 'bottom' | 'center' | 'stretch' | 'cover'
  
  // Content layout
  contentAlignY?: 'top' | 'center' | 'bottom'
  contentWidth?: 'short' | 'full'
  contentType?: 'text' | 'banner' | 'left'
  contentInBanner?: boolean
  
  // Overlays
  gradientType?: 'light' | 'dark' | null
  gradientDepth?: number
  
  // Special flags
  isFullWidth?: boolean
  phoneBanner?: boolean
  backgroundCorrection?: string
}
```
