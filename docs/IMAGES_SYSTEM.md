# Crearis Images System Documentation

## Overview

The Crearis Images System is a comprehensive image management solution designed to provide intelligent, vendor-independent control over image delivery and metadata. The system enables precise specification of image transformations (crop coordinates, dimensions) while maintaining authorship, tagging, and metadata within the application—ensuring you're never locked into a specific image delivery service.

## Table of Contents

1. [System Goals](#system-goals)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Image Renditions](#image-renditions)
7. [Tagging System](#tagging-system)
8. [Data Import/Export](#data-importexport)
9. [Usage Examples](#usage-examples)
10. [Vendor Independence](#vendor-independence)

---

## System Goals

### Primary Objectives

1. **Intelligent Image Delivery**: Configure precise crop coordinates and dimensions for multiple renditions of each image
2. **Vendor Independence**: Store all critical metadata (crop coords, tags, authorship) in your database, not in a CDN
3. **Service Flexibility**: Easily switch between image delivery services (Cloudinary, Imgix, etc.) without data loss
4. **Comprehensive Metadata**: Track ownership, licensing, geo-location, and content classification
5. **Flexible Tagging**: Bitmatrix tagging system for efficient content categorization

### Key Features

- **42-field image records** with comprehensive metadata
- **Multiple renditions** per image (avatar, card, hero) with individual crop coordinates
- **Bitmatrix tagging** for efficient content classification (8 tag types)
- **Soft/hard delete logic** based on foreign key references
- **Batch import** capabilities (up to 100 images)
- **JSON export/import** for data portability
- **CSV integration** with entity tables

---

## Architecture

### Technology Stack

- **Database**: PostgreSQL 8.16+ / SQLite (development)
- **Backend**: Nitro/h3 (TypeScript)
- **Frontend**: Vue 3 with Composition API (TypeScript)
- **Migrations**: tsx-based migration system
- **Image Delivery**: Vendor-agnostic (currently supports URL-based services)

### Data Flow

```
[CSV/JSON Import] → [Migration 022] → [PostgreSQL Database]
         ↓
[API Endpoints (CRUD + Batch)]
         ↓
[Vue Components] → [User Interface]
         ↓
[Image Delivery Service (Cloudinary, etc.)]
```

### File Structure

```
server/
  ├── api/images/              # REST API endpoints
  │   ├── index.get.ts         # List images with filters
  │   ├── [id].get.ts          # Get single image
  │   ├── index.post.ts        # Create image
  │   ├── [id].put.ts          # Update image
  │   ├── [id].delete.ts       # Delete image (soft/hard)
  │   └── batch.post.ts        # Batch import
  ├── utils/image-helpers.ts   # Validation & utilities
  ├── database/migrations/
  │   ├── 019_add_tags_status_ids.ts  # Images table creation
  │   └── 022_seed_csv_data.ts        # Data seeding with cimg_id
  └── data/images/
      └── root.json            # JSON export/import file

src/components/
  ├── cimgTags.vue            # Bitmatrix tag selector
  ├── cimgRendition.vue       # Image display with renditions
  ├── cimgPreview.vue         # Metadata viewer
  ├── cimgImport.vue          # Batch import UI
  ├── cimgRegistry.vue        # Grid list with filters
  ├── cimgBrowser.vue         # Modal selection dialog
  └── cimgEditor.vue          # Full metadata editor

scripts/
  ├── export-images-json.ts   # Export to JSON
  └── add-cimg-id-to-csv.py   # Add cimg_id fields to CSVs
```

---

## Database Schema

### Images Table

The `images` table contains 42 fields organized into logical groups:

#### Core Fields (7)
- `id` (INTEGER) - Primary key, auto-increment
- `xmlid` (TEXT) - Unique external identifier
- `name` (TEXT) - Display name
- `url` (TEXT) - Source URL (NOT NULL)
- `fileformat` (TEXT) - File extension (jpg, png, webp, etc.)
- `mediaformat` (TEXT) - Media type for video/audio files
- `function` (TEXT) - Usage context/purpose

#### Media Properties (8)
- `length` (INTEGER) - Duration in seconds (for video/audio)
- `provider` (TEXT) - Source service (unsplash, cloudinary, etc.)
- `has_video` (BOOLEAN) - Contains video content
- `has_audio` (BOOLEAN) - Contains audio content
- `is_public` (BOOLEAN) - Public visibility
- `is_private` (BOOLEAN) - Private/restricted
- `is_dark` (BOOLEAN) - Dark theme suitable
- `is_light` (BOOLEAN) - Light theme suitable

#### Ownership & Classification (5)
- `domaincode` (TEXT) - Domain/project association
- `owner_id` (INTEGER) - Foreign key to users(id)
- `status_id` (INTEGER) - Foreign key to status(id)
- `tags` (INTEGER) - Bitmatrix tags (0-255)
- `date` (TEXT) - Capture/creation date

#### Metadata (5)
- `geo` (JSONB) - Geographic coordinates `{"lat": 48.1, "lng": 11.5}`
- `x` (INTEGER) - Original width in pixels
- `y` (INTEGER) - Original height in pixels
- `copyright` (TEXT) - Copyright notice
- `alt_text` (TEXT) - Accessibility description
- `title` (TEXT) - SEO/display title

#### Crop Coordinates - Avatar (64x64) (3)
- `av_x` (INTEGER) - X offset for avatar crop
- `av_y` (INTEGER) - Y offset for avatar crop
- `av_z` (REAL) - Zoom level for avatar crop

#### Crop Coordinates - Card (320x180) (3)
- `ca_x` (INTEGER) - X offset for card crop
- `ca_y` (INTEGER) - Y offset for card crop
- `ca_z` (REAL) - Zoom level for card crop

#### Crop Coordinates - Hero (1280x720) (3)
- `he_x` (INTEGER) - X offset for hero crop
- `he_y` (INTEGER) - Y offset for hero crop
- `he_z` (REAL) - Zoom level for hero crop

#### System Fields (2)
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last modification time

### Indexes

```sql
CREATE INDEX idx_images_xmlid ON images(xmlid);
CREATE INDEX idx_images_owner ON images(owner_id);
CREATE INDEX idx_images_status ON images(status_id);
CREATE INDEX idx_images_domaincode ON images(domaincode);
CREATE INDEX idx_images_tags ON images(tags);
```

### Foreign Key References

Six entity tables reference images via `cimg_id`:

1. **users** - Profile/avatar images
2. **projects** - Project cover images
3. **events** - Event promotional images
4. **posts** - Blog post images
5. **locations** - Venue/location images
6. **instructors** - Instructor profile images

### Status Entries

Six status options for images:

- **active** (id: 124) - Ready for use
- **draft** (id: 125) - Work in progress
- **archived** (id: 126) - Historical/inactive
- **pending** (id: 127) - Awaiting approval
- **processing** (id: 128) - Being processed
- **rejected** (id: 129) - Not approved

---

## API Endpoints

### 1. List Images - `GET /api/images`

Retrieve filtered list of images.

**Query Parameters:**
- `domaincode` (string) - Filter by domain
- `owner_id` (number) - Filter by owner
- `status_id` (number) - Filter by status
- `provider` (string) - Filter by provider
- `is_public` (boolean) - Filter by visibility
- `tags` (number) - Filter by bitmatrix tags
- `limit` (number, default: 50) - Results per page
- `offset` (number, default: 0) - Pagination offset

**Response:**
```json
{
  "images": [
    {
      "id": 1,
      "xmlid": "img.project.hero",
      "name": "Project Hero Image",
      "url": "https://cdn.example.com/hero.jpg",
      "owner": {
        "id": 5,
        "username": "john.doe"
      },
      "status": {
        "id": 124,
        "name": "active"
      },
      "tags": 17,
      "created_at": "2025-10-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### 2. Get Single Image - `GET /api/images/:id`

Retrieve complete details for one image.

**Response:**
```json
{
  "id": 1,
  "xmlid": "img.project.hero",
  "name": "Project Hero Image",
  "url": "https://cdn.example.com/hero.jpg",
  "fileformat": "jpg",
  "x": 1920,
  "y": 1080,
  "av_x": 960,
  "av_y": 540,
  "av_z": 2.0,
  "ca_x": 800,
  "ca_y": 450,
  "ca_z": 1.5,
  "he_x": 0,
  "he_y": 0,
  "he_z": 1.0,
  "tags": 17,
  "is_public": true,
  "owner": { "id": 5, "username": "john.doe" },
  "status": { "id": 124, "name": "active" }
}
```

### 3. Create Image - `POST /api/images`

Create new image record.

**Request Body:**
```json
{
  "xmlid": "img.new.image",
  "name": "New Image",
  "url": "https://cdn.example.com/new.jpg",
  "fileformat": "jpg",
  "owner_email": "user@example.com",
  "tags": 16,
  "is_public": true
}
```

**Response:** Complete image object with generated ID

### 4. Update Image - `PUT /api/images/:id`

Update existing image (partial updates supported).

**Request Body:**
```json
{
  "name": "Updated Name",
  "av_x": 1000,
  "av_y": 600,
  "tags": 25
}
```

### 5. Delete Image - `DELETE /api/images/:id`

Smart delete with soft/hard logic:
- **Soft delete**: Sets status to "archived" if referenced by other tables
- **Hard delete**: Permanently removes if no references exist

**Response:**
```json
{
  "success": true,
  "deleted": "soft",
  "references": ["users", "projects"],
  "message": "Image archived due to 2 references"
}
```

### 6. Batch Import - `POST /api/images/batch`

Import up to 100 images at once.

**Request Body:**
```json
{
  "images": [
    {
      "xmlid": "img.batch.001",
      "name": "Batch Image 1",
      "url": "https://cdn.example.com/001.jpg",
      "tags": 16
    },
    // ... up to 100 images
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 95,
  "failed": 5,
  "results": [
    {
      "xmlid": "img.batch.001",
      "success": true,
      "id": 42
    },
    {
      "xmlid": "img.batch.002",
      "success": false,
      "error": "Invalid file format"
    }
  ]
}
```

---

## UI Components

### 1. cimgTags.vue - Tag Selector

Bitmatrix tag selector with 8 checkboxes.

**Props:**
- `modelValue` (number) - Current tags bitmatrix

**Emits:**
- `update:modelValue` (number) - Updated tags value

**Usage:**
```vue
<cimgTags v-model="imageData.tags" />
```

### 2. cimgRendition.vue - Image Display

Displays image with proper rendition and crop coordinates.

**Props:**
- `image` (object) - Image data object
- `rendition` (string) - 'avatar' | 'card' | 'hero' | 'original'
- `alt` (string, optional) - Alt text override

**Features:**
- Automatically applies crop coordinates via query params
- Loading/error states with fallback
- Responsive sizing via CSS custom properties

**Usage:**
```vue
<cimgRendition :image="imageData" rendition="card" />
```

### 3. cimgPreview.vue - Metadata Viewer

Comprehensive read-only display of all image metadata.

**Props:**
- `image` (object) - Complete image data

**Sections:**
- Details (ID, name, URL, format)
- Properties (dimensions, provider, dates)
- Tags (active tags with names)
- Content flags (video, audio, visibility)
- Dimensions & crop coordinates (all 3 renditions)
- Timestamps

**Usage:**
```vue
<cimgPreview :image="selectedImage" />
```

### 4. cimgImport.vue - Batch Import

Three-mode batch import interface.

**Modes:**
1. **Text**: One URL per line
2. **CSV**: Structured data import
3. **JSON**: Full metadata import

**Features:**
- Live preview of parsed data
- Default options (tags, status, owner)
- Validation before import
- Success/failure reporting

**Usage:**
```vue
<cimgImport @imported="handleImported" />
```

### 5. cimgRegistry.vue - Image Grid

Sortable, filterable image list with pagination.

**Features:**
- Search by name/xmlid
- Filters: domaincode, status, visibility
- 24 images per page
- Hover preview with metadata
- Delete with confirmation

**Usage:**
```vue
<cimgRegistry @select="handleSelect" />
```

### 6. cimgBrowser.vue - Selection Modal

Modal dialog for browsing and selecting images.

**Props:**
- `show` (boolean) - Visibility control
- `multiple` (boolean) - Allow multi-select

**Emits:**
- `select` (object | array) - Selected image(s)
- `close` - Modal closed

**Usage:**
```vue
<cimgBrowser :show="showBrowser" @select="handleSelect" @close="showBrowser = false" />
```

### 7. cimgEditor.vue - Full Editor

Comprehensive form for creating/editing images.

**Props:**
- `imageId` (number, optional) - Edit mode if provided

**Sections:**
1. Basic Info (name, URL, format)
2. Project & Ownership (domaincode, owner, status)
3. Text Content (title, alt text, copyright)
4. Properties (dimensions, provider, dates, geo)
5. Tags (bitmatrix selector)
6. Content Flags (checkboxes for booleans)
7. Crop Coordinates (avatar, card, hero)

**Usage:**
```vue
<cimgEditor :image-id="42" @saved="handleSaved" />
```

---

## Image Renditions

### Rendition Types

The system supports three predefined renditions plus original:

| Rendition | Dimensions | Use Case | CSS Variables |
|-----------|-----------|----------|---------------|
| **avatar** | 64x64 | Profile pictures, small thumbnails | `--cimg-avatar-width/height` |
| **card** | 320x180 | Grid cards, list items | `--cimg-card-width/height` |
| **hero** | 1280x720 | Headers, banners, full-width | `--cimg-hero-width/height` |
| **original** | Variable | Full resolution | N/A |

### Crop Coordinates

Each rendition has three coordinates:

- **x**: Horizontal offset from left edge (pixels)
- **y**: Vertical offset from top edge (pixels)
- **z**: Zoom level (multiplier, e.g., 1.0 = no zoom, 2.0 = 2x zoom)

### How It Works

1. **Store crop data** in database (av_x, av_y, av_z, etc.)
2. **Generate URL** with query parameters:
   ```
   https://cdn.example.com/image.jpg?w=320&h=180&x=800&y=450&z=1.5
   ```
3. **Service processes** the image with your specifications
4. **Delivered image** matches exact requirements

### Vendor-Agnostic Approach

Your crop coordinates work with any service that supports URL parameters:

**Cloudinary:**
```
https://res.cloudinary.com/demo/image/fetch/w_320,h_180,x_800,y_450,z_1.5/...
```

**Imgix:**
```
https://example.imgix.net/image.jpg?w=320&h=180&rect=800,450,320,180
```

**Custom CDN:**
```
https://cdn.yourservice.com/image.jpg?width=320&height=180&x=800&y=450&zoom=1.5
```

You maintain the **source of truth** (crop coordinates) in your database, not in the vendor's system.

---

## Tagging System

### Bitmatrix Tags

The system uses an 8-bit bitmatrix for efficient tagging:

| Bit | Value | Tag Name | Description |
|-----|-------|----------|-------------|
| 0 | 1 | adult | Content featuring adults |
| 1 | 2 | teen | Content featuring teenagers |
| 2 | 4 | child | Content featuring children |
| 3 | 8 | group | Group/ensemble images |
| 4 | 16 | portrait | Portrait/headshot style |
| 5 | 32 | detail | Close-up/detail shot |
| 6 | 64 | location | Venue/place focus |
| 7 | 128 | system | System/administrative use |

### Combining Tags

Tags combine via bitwise OR:

```typescript
const tags = IMAGE_TAGS.adult | IMAGE_TAGS.group | IMAGE_TAGS.portrait
// Result: 1 + 8 + 16 = 25
```

### Checking Tags

```typescript
const hasAdult = (tags & IMAGE_TAGS.adult) !== 0
const hasGroup = (tags & IMAGE_TAGS.group) !== 0
```

### Server Utilities

```typescript
import { hasTag, addTag, removeTag, toggleTag, getActiveTagNames } from '~/server/utils/image-helpers'

// Check if image has tag
if (hasTag(image.tags, IMAGE_TAGS.adult)) { ... }

// Add tag
image.tags = addTag(image.tags, IMAGE_TAGS.portrait)

// Remove tag
image.tags = removeTag(image.tags, IMAGE_TAGS.child)

// Toggle tag
image.tags = toggleTag(image.tags, IMAGE_TAGS.group)

// Get active tag names
const activeTagsArray = getActiveTagNames(image.tags)
// Returns: ['adult', 'portrait', 'group']
```

---

## Data Import/Export

### JSON Export

Export all images to `/server/data/images/root.json`:

```bash
pnpm tsx scripts/export-images-json.ts
```

**Output format:**
```json
[
  {
    "id": 1,
    "xmlid": "img.project.hero",
    "name": "Hero Image",
    "url": "https://cdn.example.com/hero.jpg",
    "fileformat": "jpg",
    "x": 1920,
    "y": 1080,
    "av_x": 960,
    "av_y": 540,
    "av_z": 2.0,
    "tags": 17,
    "is_public": true,
    "owner_id": 5,
    "created_at": "2025-10-15T10:30:00Z",
    "updated_at": "2025-10-20T14:15:00Z"
  }
]
```

### JSON Import

Automatically runs in **Migration 022, Chapter 0** (before CSV seeding):

```typescript
// Migration checks for /server/data/images/root.json
// If present, imports all images with ON CONFLICT handling
// Skips existing records (by xmlid)
```

### CSV Integration

#### Adding cimg_id Fields

Add `cimg_id/id_nr` and `cimg_id/id` columns to CSV files:

```bash
python3 scripts/add-cimg-id-to-csv.py
```

Processes:
- **Root fileset**: projects.csv, users.csv
- **Base fileset**: events.csv, posts.csv, locations.csv, instructors.csv, children.csv, teens.csv, adults.csv

#### Field Usage

- **cimg_id/id_nr**: Direct integer ID reference (primary method)
- **cimg_id/id**: XML key lookup (alternative method)

**Example CSV:**
```csv
domaincode,name,cimg,cimg_id/id_nr,cimg_id/id
project1,Project Alpha,https://...,42,
project2,Project Beta,https://...,,img.beta.hero
```

#### Migration Handling

Migration 022 handles both fields automatically:

```typescript
let cimgId: number | null = null
const cimgIdNr = row['cimg_id/id_nr']
const cimgIdXml = row['cimg_id/id']

if (cimgIdNr && cimgIdNr.trim()) {
  cimgId = parseInt(cimgIdNr)
} else if (cimgIdXml && cimgIdXml.trim()) {
  const imageResult = await db.get('SELECT id FROM images WHERE xmlid = ?', [cimgIdXml])
  if (imageResult) {
    cimgId = imageResult.id
  }
}
```

---

## Usage Examples

### Example 1: Create Image with Crop Coordinates

```typescript
// API call
const response = await $fetch('/api/images', {
  method: 'POST',
  body: {
    xmlid: 'img.event.promo',
    name: 'Event Promo Image',
    url: 'https://cdn.example.com/event-promo.jpg',
    fileformat: 'jpg',
    x: 2000,
    y: 1500,
    // Avatar crop (center focus)
    av_x: 1000,
    av_y: 750,
    av_z: 1.5,
    // Card crop (upper portion)
    ca_x: 500,
    ca_y: 300,
    ca_z: 1.0,
    // Hero crop (full width, centered)
    he_x: 360,
    he_y: 500,
    he_z: 1.0,
    tags: IMAGE_TAGS.adult | IMAGE_TAGS.group,
    is_public: true,
    owner_email: 'admin@example.com'
  }
})
```

### Example 2: Display Image in Component

```vue
<template>
  <div class="event-card">
    <cimgRendition
      :image="event.image"
      rendition="card"
      :alt="event.name"
    />
    <h3>{{ event.name }}</h3>
  </div>
</template>

<script setup lang="ts">
const event = ref({
  name: 'Theater Workshop',
  image: {
    id: 42,
    url: 'https://cdn.example.com/workshop.jpg',
    ca_x: 500,
    ca_y: 300,
    ca_z: 1.0
  }
})
</script>
```

### Example 3: Filter Images by Tags

```typescript
// Get all images with adult & group tags
const response = await $fetch('/api/images', {
  query: {
    tags: IMAGE_TAGS.adult | IMAGE_TAGS.group,
    is_public: true,
    limit: 20
  }
})
```

### Example 4: Batch Import from URLs

```typescript
const urls = [
  'https://unsplash.com/photo-1.jpg',
  'https://unsplash.com/photo-2.jpg',
  'https://unsplash.com/photo-3.jpg'
]

const response = await $fetch('/api/images/batch', {
  method: 'POST',
  body: {
    images: urls.map((url, i) => ({
      xmlid: `img.batch.${i + 1}`,
      name: `Batch Image ${i + 1}`,
      url,
      fileformat: 'jpg',
      provider: 'unsplash',
      tags: IMAGE_TAGS.location,
      is_public: true
    }))
  }
})

console.log(`Imported: ${response.imported}, Failed: ${response.failed}`)
```

### Example 5: Update Crop Coordinates

```typescript
// Update only hero crop coordinates
await $fetch(`/api/images/${imageId}`, {
  method: 'PUT',
  body: {
    he_x: 400,
    he_y: 200,
    he_z: 1.2
  }
})
```

---

## Vendor Independence

### The Problem with Vendor Lock-In

Traditional image CDN approaches often result in:

1. **Transformation lock-in**: Crop coordinates stored in CDN URLs
2. **Metadata loss**: Switching CDNs means recreating transformations
3. **Cost escalation**: Difficult to compare services or negotiate
4. **Feature dependency**: Locked into vendor-specific features

### The Crearis Solution

Our system maintains **complete control** over image data:

#### What We Store in the Database

✅ **Crop coordinates** (x, y, z for each rendition)  
✅ **Image metadata** (dimensions, format, provider)  
✅ **Ownership & licensing** (copyright, owner_id)  
✅ **Content classification** (tags, is_public, etc.)  
✅ **Geographic data** (geo JSONB)  
✅ **Status tracking** (active, draft, archived)

#### What the CDN Stores

❌ **Only the raw image file**

### Switching Providers

To switch from Service A to Service B:

1. **Export images JSON** with all metadata intact
2. **Upload images** to new service
3. **Update base URLs** in your application config
4. **Crop coordinates remain unchanged** - new service applies them

**No data loss. No manual reconfiguration. No vendor lock-in.**

### Example: Multi-Provider Support

```typescript
// config/image-providers.ts
const providers = {
  cloudinary: {
    baseUrl: 'https://res.cloudinary.com/demo/image/fetch',
    transformParams: (w, h, x, y, z) => `w_${w},h_${h},x_${x},y_${y},z_${z}`
  },
  imgix: {
    baseUrl: 'https://example.imgix.net',
    transformParams: (w, h, x, y, z) => `w=${w}&h=${h}&rect=${x},${y},${w},${h}`
  },
  custom: {
    baseUrl: 'https://cdn.yourservice.com',
    transformParams: (w, h, x, y, z) => `width=${w}&height=${h}&x=${x}&y=${y}&zoom=${z}`
  }
}

// Generate URL based on current provider
function getImageUrl(image, rendition, provider = 'cloudinary') {
  const config = providers[provider]
  const [x, y, z] = getRenditionCoords(image, rendition)
  const [w, h] = getRenditionDimensions(rendition)
  
  return `${config.baseUrl}/${image.url}?${config.transformParams(w, h, x, y, z)}`
}
```

### Cost Optimization

Because you control the data:

- **Benchmark providers** with real usage patterns
- **Negotiate pricing** with multiple vendors
- **Mix providers** (e.g., Cloudinary for transforms, S3 for storage)
- **Self-host** if traffic justifies it

### Future-Proofing

As image delivery technology evolves:

- **New formats** (AVIF, WebP2) - update `fileformat` field
- **New services** - add provider configuration
- **New features** - extend metadata without breaking changes
- **AI transformations** - store prompts/parameters in database

---

## Best Practices

### 1. Image Naming Conventions

Use consistent xmlid patterns:

```
img.{entity}.{purpose}.{identifier}

Examples:
img.project.hero.dasei
img.user.avatar.john-doe
img.event.promo.workshop-001
img.location.exterior.venue-alpha
```

### 2. Crop Coordinate Guidelines

- **Avatar**: Focus on subject's face/center of interest
- **Card**: Frame key elements with breathing room
- **Hero**: Wide shot with compositional balance

### 3. Tagging Strategy

Combine tags logically:

- **Person-focused**: `adult | portrait`
- **Group events**: `group | location`
- **Venue photos**: `location | detail`
- **System assets**: `system` (admin UI, placeholders)

### 4. Status Workflow

Recommended status progression:

1. **draft** - Initial upload
2. **pending** - Awaiting approval
3. **active** - Ready for production
4. **archived** - Historical reference

### 5. Batch Import Optimization

- Process in chunks of 50-100 images
- Validate URLs before import
- Use consistent naming for easy filtering
- Set default tags/status for bulk operations

### 6. Performance Considerations

- Use appropriate renditions (don't load hero when avatar suffices)
- Leverage CDN caching with proper headers
- Index frequently filtered fields (tags, domaincode)
- Paginate large result sets (default limit: 50)

---

## Troubleshooting

### Common Issues

#### 1. Image Not Displaying

**Check:**
- URL is accessible (test in browser)
- Correct rendition specified
- Crop coordinates within image bounds
- CDN service is responding

#### 2. Crop Coordinates Not Applied

**Check:**
- CDN supports query parameters
- URL format matches provider expectations
- Coordinates saved in database
- z (zoom) value is reasonable (0.5 - 5.0)

#### 3. Batch Import Failures

**Common causes:**
- Invalid fileformat (not in VALID_FILE_FORMATS)
- Owner email not found in users table
- Duplicate xmlid values
- URL not accessible

#### 4. Foreign Key Violations

**When deleting images:**
- Check `users.cimg_id`
- Check `projects.cimg_id`
- Check `events.cimg_id`
- Check `posts.cimg_id`
- Check `locations.cimg_id`
- Check `instructors.cimg_id`

Use soft delete (archived status) to preserve references.

---

## Conclusion

The Crearis Images System provides **complete control** over your image delivery pipeline while maintaining **vendor independence**. By storing all critical metadata—crop coordinates, tags, ownership, licensing—in your own database, you ensure:

✅ **No vendor lock-in**  
✅ **Easy provider switching**  
✅ **Cost optimization flexibility**  
✅ **Future-proof architecture**  
✅ **Data sovereignty**

All transformation instructions are **yours**, not buried in a CDN's proprietary system. Switch services, negotiate better rates, or self-host—all without losing a single crop coordinate or metadata field.

---

## Additional Resources

- **Migration 019**: `/server/database/migrations/019_add_tags_status_ids.ts`
- **Migration 022**: `/server/database/migrations/022_seed_csv_data.ts`
- **API Docs**: Inline JSDoc in `/server/api/images/`
- **Component Docs**: Inline comments in `/src/components/cimg*.vue`
- **Type Definitions**: `/server/types/database.ts`

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0  
**System**: Crearis Images Management
