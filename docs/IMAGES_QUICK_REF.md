# Images System - Quick Reference

## Commands

```bash
# Export images to JSON
pnpm tsx scripts/export-images-json.ts

# Add cimg_id fields to CSV files
python3 scripts/add-cimg-id-to-csv.py

# Run migrations (includes JSON import)
pnpm db:migrate

# Rebuild database from scratch
pnpm db:rebuild
```

## API Endpoints

```typescript
// List images with filters
GET /api/images?tags=17&is_public=true&limit=20

// Get single image
GET /api/images/42

// Create image
POST /api/images
{
  "xmlid": "img.new",
  "name": "New Image",
  "url": "https://...",
  "tags": 16
}

// Update image
PUT /api/images/42
{
  "name": "Updated Name",
  "av_x": 1000
}

// Delete image (smart soft/hard)
DELETE /api/images/42

// Batch import
POST /api/images/batch
{
  "images": [...]
}
```

## Vue Components

```vue
<!-- Tag selector -->
<cimgTags v-model="tags" />

<!-- Display image -->
<cimgRendition :image="img" rendition="card" />

<!-- Preview metadata -->
<cimgPreview :image="img" />

<!-- Batch import -->
<cimgImport @imported="handleImport" />

<!-- Image grid -->
<cimgRegistry @select="handleSelect" />

<!-- Selection modal -->
<cimgBrowser :show="true" @select="handleSelect" />

<!-- Full editor -->
<cimgEditor :image-id="42" @saved="handleSave" />
```

## Image Tags (Bitmatrix)

```typescript
import { IMAGE_TAGS } from '~/server/utils/image-helpers'

const tags = IMAGE_TAGS.adult | IMAGE_TAGS.portrait  // 17
const hasAdult = (tags & IMAGE_TAGS.adult) !== 0  // true
```

| Tag | Value | Name | Use |
|-----|-------|------|-----|
| 1 | adult | Adult content | Person 18+ |
| 2 | teen | Teen content | Person 13-17 |
| 4 | child | Child content | Person 0-12 |
| 8 | group | Group | Multiple people |
| 16 | portrait | Portrait | Headshot style |
| 32 | detail | Detail | Close-up |
| 64 | location | Location | Place focus |
| 128 | system | System | Admin use |

## Renditions

| Type | Size | Use Case |
|------|------|----------|
| avatar | 64x64 | Profile pics |
| card | 320x180 | Grid items |
| hero | 1280x720 | Headers |

## Database Fields

**Core**: id, xmlid, name, url, fileformat, mediaformat, function  
**Media**: length, provider, has_video, has_audio, is_public, is_private, is_dark, is_light  
**Owner**: domaincode, owner_id, status_id, tags, date  
**Meta**: geo, x, y, copyright, alt_text, title  
**Avatar Crop**: av_x, av_y, av_z  
**Card Crop**: ca_x, ca_y, ca_z  
**Hero Crop**: he_x, he_y, he_z  
**System**: created_at, updated_at

## CSV Integration

Add two columns to entity CSVs:

```csv
name,cimg_id/id_nr,cimg_id/id
"Project Alpha",42,
"Project Beta",,img.beta.hero
```

- **cimg_id/id_nr**: Direct integer ID (preferred)
- **cimg_id/id**: XML key lookup (fallback)

## Status Values

- **active** (124): Ready for use
- **draft** (125): Work in progress
- **archived** (126): Historical
- **pending** (127): Awaiting approval
- **processing** (128): Being processed
- **rejected** (129): Not approved

## File Formats

**Supported**: jpg, jpeg, png, gif, webp, svg, bmp, tiff, tif, ico, heic, heif, avif

## Vendor Independence

Store in DB: ✅ Crop coords, metadata, tags, ownership  
Store in CDN: ❌ Only raw files

Switch providers anytime without data loss!

## Documentation

- Full docs: `docs/IMAGES_SYSTEM.md`
- Summary: `docs/IMAGES_SYSTEM_SUMMARY.md`
- Migration: `server/database/migrations/019_add_tags_status_ids.ts`
- CSV Seeding: `server/database/migrations/022_seed_csv_data.ts`
