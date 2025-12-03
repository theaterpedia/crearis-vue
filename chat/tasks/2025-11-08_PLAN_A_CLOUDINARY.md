# Plan A: Cloudinary Import Implementation

**Date**: November 8, 2025  
**Priority**: High  
**Status**: ✅ **COMPLETED**

---

## ✅ Implementation Complete

**Completed on**: November 8, 2025

All Cloudinary import functionality has been successfully implemented and tested:

- ✅ URL parsing (handles transformations, folders, versions)
- ✅ Alt_text extraction (removes Cloudinary hashes, cleans filenames)
- ✅ Year extraction from version timestamps
- ✅ About field formatting: "(c) Author | Private | Year"
- ✅ Author population from batch owner_name
- ✅ Shape URL generation with BlurHash for all 4 shapes
- ✅ All 3 integration tests passing

**Files Modified**:
- `server/adapters/cloudinary-adapter.ts` - Complete implementation
- `server/adapters/base-adapter.ts` - Added batchData parameter
- `server/types/adapters.ts` - Added owner_name field
- `server/adapters/unsplash-adapter.ts` - Updated for compatibility
- `tests/integration/images-import-api.test.ts` - Added 3 new tests
- `.env` - Added CLOUDINARY_ACCOUNT and CLOUDINARY_INITIAL_VERSION

---

## 🎯 Objectives

Implement Cloudinary image import without API access by analyzing URL structure and extracting metadata from the image path.

---

## 📝 Environment Variables

Add to `.env`:

```bash
CLOUDINARY_ACCOUNT=little-papillon
CLOUDINARY_INITIAL_VERSION=v1665139609
```

---

## 🧪 Test URLs

**URL 1** (with transformations and folder):
```
https://res.cloudinary.com/little-papillon/image/upload/c_crop,h_2000,w_2800,x_500/c_scale,h_1000,w_1400/v1735162309/dasei/Lichtdesign_rxwwbj.jpg
```

**URL 2** (simple format):
```
https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg
```

---

## 🔧 Implementation Tasks

### 1. Parse Cloudinary URL Structure

**Pattern**:
```
https://res.cloudinary.com/{account}/image/upload/{transformations?}/v{version}/{folder?}/{filename}.{ext}
```

**Extract**:
- Account name (little-papillon)
- Version number (v1735162309 or v1665139609)
- Folder path (dasei/ or empty)
- Filename without suffix (Lichtdesign, theaterpedia_lichtpunkte)
- File extension (jpg)

### 2. Generate alt_text

**Logic**:
```typescript
// From: dasei/Lichtdesign_rxwwbj.jpg
// 1. Combine folder + filename: "dasei Lichtdesign_rxwwbj"
// 2. Remove suffix (last underscore part): "dasei Lichtdesign"
// 3. Replace underscores with spaces: "dasei Lichtdesign"
// 4. Capitalize: "Dasei Lichtdesign"

// From: theaterpedia_lichtpunkte_ea_rh.jpg
// 1. No folder, use filename: "theaterpedia_lichtpunkte_ea_rh"
// 2. Remove suffix: "theaterpedia_lichtpunkte_ea"
// 3. Remove suffix again: "theaterpedia_lichtpunkte"
// 4. Replace underscores: "theaterpedia lichtpunkte"
// 5. Capitalize: "Theaterpedia lichtpunkte"
```

**Suffix patterns to remove**: `_hd`, `_ea`, `_rh`, `_tp`, `_[a-z]{2}`

### 3. Set Author Field

**Logic**:
```typescript
// Use owner from import batch or default
const authorName = batchData?.owner_name || 'Hans Dönitz' // Default for testing

author: {
    adapter: 'cloudinary',
    file_id: publicId,  // Full path: dasei/Lichtdesign_rxwwbj
    account_id: accountName,  // little-papillon
    folder_id: folderPath || null,  // dasei or null
    info: authorName,  // Hans Dönitz
    config: null
}
```

### 4. Format about Field

**Format**: `author | license: private | year`

**Logic**:
```typescript
// Extract year from version or use INITIAL_VERSION
const versionYear = extractYearFromVersion(version) || extractYearFromVersion(CLOUDINARY_INITIAL_VERSION)

// Example: "(c) Hans Dönitz | Private | 2024"
const about = `(c) ${authorName} | Private | ${versionYear}`
```

**Year Extraction**:
```typescript
// v1735162309 is Unix timestamp in seconds
// Convert to year: new Date(1735162309 * 1000).getFullYear() => 2024
// v1665139609 => 2022
```

### 5. Update Shape URL Generation

**Current behavior**: Already inserts transformations correctly

**Verify**:
- Square (128×128): `c_crop,w_128,h_128`
- Thumb (64×64): `c_crop,w_64,h_64`
- Wide (336×168): `c_crop,w_336,h_168`
- Vertical (126×224): `c_crop,w_126,h_224`

**Keep existing logic**, just ensure clean base URL extraction.

---

## 📂 Files to Modify

### 1. `/server/adapters/cloudinary-adapter.ts`

**Changes**:
- Add `extractPublicId()` - get full path including folder
- Add `extractFolder()` - get folder path
- Add `extractFilename()` - get filename without extension
- Add `extractAltText()` - implement alt_text generation logic
- Add `extractYearFromVersion()` - convert Unix timestamp to year
- Update `fetchMetadata()` - set all fields correctly
- Update `author` composite with folder and info
- Set `about` field with proper format

### 2. `.env` (local development)

**Add**:
```bash
CLOUDINARY_ACCOUNT=little-papillon
CLOUDINARY_INITIAL_VERSION=v1665139609
```

### 3. `.env.example` (documentation)

**Add**:
```bash
CLOUDINARY_ACCOUNT=little-papillon
CLOUDINARY_INITIAL_VERSION=v1665139609
```

### 4. `/server/types/adapters.ts`

**Add to ImageImportBatch** (if needed):
```typescript
export interface ImageImportBatch {
    // ... existing fields
    owner_name?: string  // For author name in Cloudinary imports
}
```

### 5. `/tests/integration/images-import-api.test.ts`

**Add tests**:
- Test URL parsing for both formats
- Test alt_text extraction
- Test author field population
- Test about field format
- Test year extraction from version

---

## ✅ Success Criteria

### URL Parsing
- ✅ Extracts account, version, folder, filename correctly from both test URLs
- ✅ Handles URLs with and without folders
- ✅ Handles URLs with and without existing transformations

### Metadata Extraction
- ✅ alt_text: "Dasei Lichtdesign" (from URL 1)
- ✅ alt_text: "Theaterpedia lichtpunkte" (from URL 2)
- ✅ Removes suffixes: `_rxwwbj`, `_ea_rh`
- ✅ Capitalizes first letter

### Author Field
- ✅ adapter: 'cloudinary'
- ✅ file_id: full public_id with folder
- ✅ account_id: 'little-papillon'
- ✅ folder_id: folder path or null
- ✅ info: owner name or 'Hans Dönitz'

### About Field
- ✅ Format: "(c) Hans Dönitz | Private | 2024"
- ✅ Year extracted from v1735162309 → 2024
- ✅ Year extracted from v1665139609 → 2022

### Shape URLs
- ✅ All 4 shapes generated with correct transformations
- ✅ Transformations inserted in correct position
- ✅ Original transformations removed

### License
- ✅ Set to 'private'

---

## 🧪 Testing Plan

### Manual Test 1: URL with Folder and Transformations
```typescript
const url = 'https://res.cloudinary.com/little-papillon/image/upload/c_crop,h_2000,w_2800,x_500/c_scale,h_1000,w_1400/v1735162309/dasei/Lichtdesign_rxwwbj.jpg'

// Expected results:
{
    name: 'Lichtdesign',
    alt_text: 'Dasei Lichtdesign',
    license: 'private',
    about: '(c) Hans Dönitz | Private | 2024',
    author: {
        adapter: 'cloudinary',
        file_id: 'dasei/Lichtdesign_rxwwbj',
        account_id: 'little-papillon',
        folder_id: 'dasei',
        info: 'Hans Dönitz',
        config: null
    }
}
```

### Manual Test 2: Simple URL
```typescript
const url = 'https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg'

// Expected results:
{
    name: 'theaterpedia_lichtpunkte',
    alt_text: 'Theaterpedia lichtpunkte',
    license: 'private',
    about: '(c) Hans Dönitz | Private | 2022',
    author: {
        adapter: 'cloudinary',
        file_id: 'theaterpedia_lichtpunkte_ea_rh',
        account_id: 'little-papillon',
        folder_id: null,
        info: 'Hans Dönitz',
        config: null
    }
}
```

### Integration Test
```typescript
it('should import Cloudinary image with correct metadata', async () => {
    const result = await importImages(
        ['https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg'],
        {
            owner_id: 1,
            owner_name: 'Hans Dönitz'
        }
    )

    expect(result.successful).toBe(1)
    
    const image = await db.get('SELECT * FROM images WHERE id = $1', [result.results[0].image_id])
    
    expect(image.license).toBe('private')
    expect(image.alt_text).toBe('Theaterpedia lichtpunkte')
    expect(image.about).toMatch(/\(c\) Hans Dönitz \| Private \| \d{4}/)
})
```

---

## 📅 Implementation Order

1. ✅ Create plan document
2. ⏳ Add environment variables to `.env` and `.env.example`
3. ⏳ Implement helper methods in `cloudinary-adapter.ts`
4. ⏳ Update `fetchMetadata()` with new logic
5. ⏳ Add integration tests
6. ⏳ Manual testing with both URLs
7. ⏳ Update task document with completion status

---

## 🔗 Related Documents

- [URL Cleanup and turl Preparation](./2025-11-07_URL_CLEANUP_AND_TURL_PREPARATION.md)
- [Plan B: turl/tpar](./2025-11-08_PLAN_B_TURL_TPAR.md)
