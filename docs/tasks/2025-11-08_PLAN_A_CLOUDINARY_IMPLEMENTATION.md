# Plan A: Cloudinary Import Implementation (No API Access)

**Date**: November 8, 2025  
**Priority**: High  
**Estimated Time**: 3-4 hours  
**Status**: Ready to implement

---

## 🎯 Objective

Implement Cloudinary image import by **parsing URLs only** (no API calls), extracting metadata from URL structure, and integrating with existing BlurHash generation system.

---

## 📋 Environment Variables

Add to `.env`:

```bash
CLOUDINARY_ACCOUNT=little-papillon
CLOUDINARY_INITIAL_VERSION=v1665139609
```

**Usage**:
- `CLOUDINARY_ACCOUNT`: Default cloud name when not in URL
- `CLOUDINARY_INITIAL_VERSION`: Used to extract year for about field (2016)

---

## 🔬 Test URLs

### URL 1: Complex with transformations
```
https://res.cloudinary.com/little-papillon/image/upload/c_crop,h_2000,w_2800,x_500/c_scale,h_1000,w_1400/v1735162309/dasei/Lichtdesign_rxwwbj.jpg
```

**Parse**:
- Cloud name: `little-papillon`
- Transformations: `c_crop,h_2000,w_2800,x_500/c_scale,h_1000,w_1400`
- Version: `v1735162309` → Year: 2024 (from timestamp)
- Folder: `dasei`
- Filename: `Lichtdesign_rxwwbj.jpg`
- Public ID: `dasei/Lichtdesign_rxwwbj`

**Extract**:
- `alt_text`: "dasei Lichtdesign" (folder + filename without suffix `_rxwwbj`)
- `about`: "Hans Dönitz | Private | 2024"

### URL 2: Simple without transformations
```
https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg
```

**Parse**:
- Cloud name: `little-papillon`
- Transformations: none
- Version: `v1665139609` → Year: 2022 (from timestamp)
- Folder: none (root)
- Filename: `theaterpedia_lichtpunkte_ea_rh.jpg`
- Public ID: `theaterpedia_lichtpunkte_ea_rh`

**Extract**:
- `alt_text`: "theaterpedia lichtpunkte" (filename without suffix `_ea_rh`)
- `about`: "Hans Dönitz | Private | 2022"

---

## 🔧 Implementation Tasks

### Task 1: Add Environment Variables ✅

**File**: `.env`

```bash
CLOUDINARY_ACCOUNT=little-papillon
CLOUDINARY_INITIAL_VERSION=v1665139609
```

### Task 2: Update Cloudinary Adapter

**File**: `server/adapters/cloudinary-adapter.ts`

#### 2.1 Parse URL Structure

```typescript
/**
 * Parse Cloudinary URL to extract metadata
 * Format: https://res.cloudinary.com/{cloud}/image/upload/{transforms}/v{version}/{path}/{file}
 * 
 * Returns:
 * - cloudName: string
 * - version: string (v1234567890)
 * - publicId: string (folder/filename without extension)
 * - folder: string | null
 * - filename: string (with extension)
 * - transformations: string | null
 */
private parseCloudinaryUrl(url: string): CloudinaryUrlParts {
    const pattern = /^https:\/\/res\.cloudinary\.com\/([^\/]+)\/image\/upload\/(.*?)\/v(\d+)\/(.+)$/
    const simplePattern = /^https:\/\/res\.cloudinary\.com\/([^\/]+)\/image\/upload\/v(\d+)\/(.+)$/
    
    // Try pattern with transformations first
    let match = url.match(pattern)
    if (match) {
        const [, cloudName, transforms, version, path] = match
        return this.parsePathAndFilename(cloudName, `v${version}`, path, transforms)
    }
    
    // Try simple pattern without transformations
    match = url.match(simplePattern)
    if (match) {
        const [, cloudName, version, path] = match
        return this.parsePathAndFilename(cloudName, `v${version}`, path, null)
    }
    
    // Fallback: minimal parse
    return {
        cloudName: process.env.CLOUDINARY_ACCOUNT || 'little-papillon',
        version: process.env.CLOUDINARY_INITIAL_VERSION || 'v1665139609',
        publicId: null,
        folder: null,
        filename: null,
        transformations: null
    }
}
```

#### 2.2 Extract alt_text from Path

```typescript
/**
 * Extract alt_text from Cloudinary path
 * 
 * Rules:
 * 1. Combine folder (if exists) + filename (without extension)
 * 2. Remove suffix pattern: _[2-3 lowercase letters] (e.g., _ea, _rh, _rxwwbj)
 * 3. Replace underscores with spaces
 * 4. Capitalize first letter
 * 
 * Examples:
 * - "dasei/Lichtdesign_rxwwbj.jpg" → "dasei Lichtdesign"
 * - "theaterpedia_lichtpunkte_ea_rh.jpg" → "theaterpedia lichtpunkte"
 */
private extractAltText(folder: string | null, filename: string): string {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '')
    
    // Combine folder and filename
    const fullPath = folder ? `${folder}/${nameWithoutExt}` : nameWithoutExt
    
    // Remove suffix pattern: _[lowercase letters/numbers]
    // Matches: _ea, _rh, _rxwwbj, _123, etc. at the end
    const withoutSuffix = fullPath.replace(/_[a-z0-9]+$/i, '')
    
    // Replace underscores and slashes with spaces
    const readable = withoutSuffix.replace(/[_\/]/g, ' ')
    
    // Capitalize first letter
    return readable.charAt(0).toUpperCase() + readable.slice(1)
}
```

#### 2.3 Extract Year from Version

```typescript
/**
 * Extract year from Cloudinary version timestamp
 * 
 * Format: v1665139609 (Unix timestamp in seconds)
 * 
 * Example:
 * - v1665139609 → 2022
 * - v1735162309 → 2024
 */
private extractYearFromVersion(version: string): number {
    // Remove 'v' prefix and parse as Unix timestamp
    const timestamp = parseInt(version.replace('v', ''), 10)
    
    if (isNaN(timestamp)) {
        return new Date().getFullYear() // Fallback to current year
    }
    
    // Convert seconds to milliseconds and create Date
    const date = new Date(timestamp * 1000)
    return date.getFullYear()
}
```

#### 2.4 Build about Field

```typescript
/**
 * Build about field for Cloudinary images
 * Format: {author} | Private | {year}
 * 
 * Example: "Hans Dönitz | Private | 2024"
 */
private buildAboutField(authorName: string, year: number): string {
    return `(c) ${authorName} | Private | ${year}`
}
```

#### 2.5 Update fetchMetadata()

```typescript
async fetchMetadata(url: string, batchData?: ImageImportBatch): Promise<MediaMetadata> {
    const filename = this.extractFilename(url)
    const fileformat = this.detectFileFormat(url)
    
    // Parse URL structure
    const parsed = this.parseCloudinaryUrl(url)
    
    // Extract year from version
    const year = this.extractYearFromVersion(parsed.version)
    
    // Extract alt text from path
    const altText = this.extractAltText(parsed.folder, parsed.filename || filename)
    
    // Get author name from batch data owner or default
    const authorName = batchData?.owner_name || 'Hans Dönitz'
    
    // Build about field
    const about = this.buildAboutField(authorName, year)
    
    return {
        url,
        name: altText,
        alt_text: altText,
        
        // Dimensions (unknown without API)
        x: undefined,
        y: undefined,
        fileformat,
        
        // Author info
        author: {
            adapter: 'cloudinary',
            file_id: parsed.publicId,
            account_id: parsed.cloudName,
            folder_id: parsed.folder,
            info: authorName,
            config: null
        },
        
        // Shape variations
        shape_square: {
            url: this.buildShapeUrl(url, 'square'),
            x: 128,
            y: 128
        },
        shape_thumb: {
            url: this.buildShapeUrl(url, 'thumb'),
            x: 64,
            y: 64
        },
        shape_wide: {
            url: this.buildShapeUrl(url, 'wide'),
            x: 336,
            y: 168
        },
        shape_vertical: {
            url: this.buildShapeUrl(url, 'vertical'),
            x: 126,
            y: 224
        },
        
        license: 'private',
        about: about,
        date: new Date(parseInt(parsed.version.replace('v', ''), 10) * 1000),
        raw_data: { url, parsed, source: 'cloudinary' }
    }
}
```

### Task 3: Update Type Definitions

**File**: `server/types/adapters.ts`

```typescript
export interface ImageImportBatch {
    domaincode?: string
    owner_id?: number
    owner_name?: string  // NEW: For Cloudinary author display
    alt_text?: string
    license?: string
    xml_subject?: string
    ctags?: Buffer
    rtags?: Buffer
}
```

### Task 4: Update Import API

**File**: `server/api/images/import.post.ts`

No changes needed - batch data already supports custom fields.

### Task 5: Update Import UI (Optional)

**File**: `src/components/images/cimgImport.vue`

Add optional owner_name field to import form:

```vue
<div class="form-group">
    <label>Author Name (for Cloudinary)</label>
    <input 
        v-model="ownerName" 
        type="text" 
        placeholder="e.g., Hans Dönitz"
        class="form-control"
    />
    <small class="form-hint">Used for Cloudinary about field. Optional.</small>
</div>
```

---

## 🧪 Testing Plan

### Test 1: Complex URL with Transformations

**Input**:
```typescript
{
    urls: ['https://res.cloudinary.com/little-papillon/image/upload/c_crop,h_2000,w_2800,x_500/c_scale,h_1000,w_1400/v1735162309/dasei/Lichtdesign_rxwwbj.jpg'],
    batch: {
        owner_id: 1,
        owner_name: 'Hans Dönitz',
        domaincode: 'test'
    }
}
```

**Expected**:
- ✅ `name`: "dasei Lichtdesign"
- ✅ `alt_text`: "dasei Lichtdesign"
- ✅ `about`: "(c) Hans Dönitz | Private | 2024"
- ✅ `license`: "private"
- ✅ `author.adapter`: "cloudinary"
- ✅ `author.account_id`: "little-papillon"
- ✅ `author.folder_id`: "dasei"
- ✅ `author.file_id`: "dasei/Lichtdesign_rxwwbj"
- ✅ All 4 shape URLs have `c_crop,w_X,h_Y` transformations
- ✅ BlurHash generated for all 4 shapes

### Test 2: Simple URL without Transformations

**Input**:
```typescript
{
    urls: ['https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg'],
    batch: {
        owner_id: 1,
        domaincode: 'test'
    }
}
```

**Expected**:
- ✅ `name`: "theaterpedia lichtpunkte"
- ✅ `alt_text`: "theaterpedia lichtpunkte"
- ✅ `about`: "(c) Hans Dönitz | Private | 2022" (year from version timestamp)
- ✅ `author.folder_id`: null (no folder)
- ✅ Shape URLs properly formatted

### Test 3: Integration Test

**File**: `tests/integration/images-import-api.test.ts`

Update existing skipped Cloudinary test:

```typescript
it('should import Cloudinary image with parsed metadata', async () => {
    const result = await importImages(
        ['https://res.cloudinary.com/little-papillon/image/upload/v1665139609/theaterpedia_lichtpunkte_ea_rh.jpg'],
        {
            owner_id: 1,
            owner_name: 'Hans Dönitz'
        }
    )
    
    expect(result.successful).toBe(1)
    
    const image = await sharedDb.get(
        'SELECT * FROM images WHERE id = $1',
        [result.results[0].image_id]
    )
    
    expect(image).toBeDefined()
    expect(image.license).toBe('private')
    expect(image.alt_text).toBe('theaterpedia lichtpunkte')
    expect(image.about).toMatch(/^\(c\) Hans Dönitz \| Private \| \d{4}$/)
    
    // Verify shape URLs
    const square = parseCompositeType(image.shape_square)
    expect(square.url).toContain('c_crop')
    expect(square.url).toContain('w_128')
    expect(square.blur).toBeTruthy()
})
```

---

## ✅ Success Criteria

1. ✅ Environment variables configured
2. ✅ URL parsing extracts all metadata correctly
3. ✅ alt_text formatted properly (folder + filename, suffix removed)
4. ✅ about field uses author name and version year
5. ✅ All 4 shape URLs generated with correct transformations
6. ✅ BlurHash generated for all shapes
7. ✅ Integration test passes with both sample URLs
8. ✅ No API calls made to Cloudinary

---

## 📊 Expected Output

### Database Record Example

```sql
SELECT 
    name, 
    alt_text, 
    license, 
    about,
    (author).adapter,
    (author).account_id,
    (author).folder_id,
    (shape_square).url,
    (shape_square).blur
FROM images 
WHERE id = 123;
```

**Result**:
```
name: "dasei Lichtdesign"
alt_text: "dasei Lichtdesign"
license: "private"
about: "(c) Hans Dönitz | Private | 2024"
adapter: "cloudinary"
account_id: "little-papillon"
folder_id: "dasei"
shape_square.url: "https://res.cloudinary.com/.../c_crop,w_128,h_128/v1735162309/dasei/Lichtdesign_rxwwbj.jpg"
shape_square.blur: "LABCd$%M~q00^*%M-;WB..."
```

---

## 🚀 Implementation Order

1. ✅ Add ENV variables
2. ✅ Implement URL parsing methods
3. ✅ Implement alt_text extraction
4. ✅ Implement year extraction from version
5. ✅ Update fetchMetadata()
6. ✅ Update type definitions
7. ✅ Test with URL 1 (complex)
8. ✅ Test with URL 2 (simple)
9. ✅ Update integration tests
10. ✅ Manual verification in ImagesCoreAdmin

---

**Estimated Time**: 3-4 hours  
**Dependencies**: BlurHash system ✅, Base adapter ✅  
**Blockers**: None
