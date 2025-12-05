# Image Import System Enhancement - Complete Task List

**Date**: November 7, 2025  
**Status**: In Progress  
**Priority**: High  
**Related Files**:
- `/server/adapters/unsplash-adapter.ts` - Unsplash URL handling
- `/server/adapters/cloudinary-adapter.ts` - Cloudinary URL handling
- `/server/adapters/base-adapter.ts` - Common import logic
- `/server/api/images/import.post.ts` - Import API endpoint
- `/src/views/admin/ImagesCoreAdmin.vue` - Import UI
- `/tests/integration/images-import-api.test.ts` - Integration tests

---

## 📊 Progress Overview

### ✅ Completed Tasks

1. **Task 1**: BlurHash preview in ImagesCoreAdmin - Fixed useBlurHash composable
2. **Task 3a**: URL parameter organization - Auth params moved to end
3. **Task 3b**: Standardized parameter sequence - crop → dimensions → focal → auth
4. **Task 3c**: Clean URL entropy parameter - Extracted and re-added properly
5. **Task 4a**: Enhanced thumb with focalpoint zoom - 1.5x zoom for avatars

### 🔄 Current Tasks

6. **Task 4b**: Add import context (xml-id, version information)
7. **Task 4c**: Implement turl + tpar generation
8. **Task 2**: Test Cloudinary adapter import
9. **Task 5**: Add comprehensive integration tests

---

## 🎯 Overall Objectives

1. Create standardized, predictable URL structures
2. Separate crop operations from authentication
3. Enable clean override of crop methods (entropy → focalpoint)
4. Generate BlurHash for all 4 shapes during import
5. Add proper metadata context (xml-id sequencing, version tracking)
6. Prepare foundation for turl/tpar (thumbnail URL + parameters)

---

## 🧪 Manual Testing Checklist

Before proceeding with automated tests, verify the following manually in ImagesCoreAdmin:

### Test 1: Basic Unsplash Import ✅
**Steps**:
1. Open ImagesCoreAdmin (`/admin/images-core`)
2. Click "Import Images" button
3. Paste Unsplash URL: `https://unsplash.com/photos/[any-photo-id]`
4. Set `xml_root: test_import`, `owner_id: 1`, `domaincode: crearis`
5. Click Import

**Expected Results**:
- ✅ Image imported successfully
- ✅ All 4 shape URLs populated (square, thumb, wide, vertical)
- ✅ Each shape has BlurHash (20-30 char string)
- ✅ Square/Wide/Vertical URLs contain `crop=entropy`
- ✅ Thumb URL contains `crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=1.5`
- ✅ All URLs have auth params at end (`ixid=...&ixlib=...`)
- ✅ URL parameter order: crop → fit → w → h → focal (if thumb) → auth
- ✅ BlurHash previews display in image list

### Test 2: Batch Import with Sequencing ⏳
**Steps**:
1. Import 3 images with same `xml_root: batch_test`
2. Check database xmlid values

**Expected Results**:
- ✅ First image: `xmlid = "batch_test.00"`
- ✅ Second image: `xmlid = "batch_test.01"`
- ✅ Third image: `xmlid = "batch_test.02"`
- ✅ All have same project_id and owner_id

### Test 3: URL Structure Verification ⏳
**Steps**:
1. Import any Unsplash image
2. Copy shape_thumb URL from database
3. Paste in browser to verify it loads

**Expected URL Format**:
```
https://images.unsplash.com/photo-[id]?crop=focalpoint&fit=crop&w=64&h=64&fp-x=0.5&fp-y=0.5&fp-z=1.5&ixid=[token]&ixlib=rb-4.1.0
```

**Verify**:
- ✅ Image loads successfully
- ✅ Shows zoomed, face-focused crop
- ✅ Parameters in correct order

### Test 4: BlurHash Display ✅
**Steps**:
1. Import image with BlurHash
2. Observe image list in ImagesCoreAdmin
3. Check if blur placeholder shows before image loads

**Expected Results**:
- ✅ Blur placeholder visible while loading
- ✅ Smooth transition to actual image
- ✅ Blur matches dominant colors of image

### Test 5: Metadata Completeness ⏳
**Steps**:
1. Import Unsplash image
2. Check database record

**Expected Fields Populated**:
- ✅ name (from alt_description)
- ✅ url (original Unsplash URL)
- ✅ x, y (dimensions)
- ✅ fileformat (jpeg/png)
- ✅ author (composite with adapter=unsplash, file_id, account_id)
- ✅ about (attribution HTML)
- ✅ license (unsplash)
- ✅ date (created_at)
- ✅ shape_square, shape_thumb, shape_wide, shape_vertical (8-field composites)

### Test 6: Cloudinary Import (Pending) ⏳
**Steps**:
1. Get valid Cloudinary URL or API access
2. Import via ImagesCoreAdmin
3. Verify transformation syntax

**Expected Results**:
- ⏳ All 4 shapes have `c_crop,w_X,h_Y` in path
- ⏳ BlurHash generated for all shapes
- ⏳ Author adapter = 'cloudinary'

---

## 📋 Completed Task Details

### ✅ Task 3a: Standardize URL Parameter Organization

**Goal**: Move authentication parameters to end of URL, separate from crop operations

#### Unsplash URL Structure
**Current problematic format**:
```
https://images.unsplash.com/photo-XYZ?ixid=ABC&ixlib=rb-4.1.0&crop=entropy&w=336&h=168&fit=crop
```

**Target format**:
```
https://images.unsplash.com/photo-XYZ?crop=entropy&fit=crop&w=336&h=168&ixid=ABC&ixlib=rb-4.1.0
```

**Rationale**:
- Crop operations first, then dimensions, then auth
- Makes URL intent immediately clear
- Auth params (ixid, ixlib) are required by Unsplash API but shouldn't mix with crop logic

#### Cloudinary URL Structure
**Current format** (already good):
```
https://res.cloudinary.com/{cloud}/image/upload/{transformations}/v{version}/{public_id}.{ext}
```

**Keep as-is**: Cloudinary's path-based transformations already separate concerns properly

---

### Task 3b: Order Parameters in Standardized Sequence

**Standard parameter order for Unsplash**:
1. **Operations**: `crop=X`, `fit=Y` (what type of crop/fit)
2. **Dimensions**: `w=X`, `h=Y` (output size)
3. **Focal parameters**: `fp-x=X`, `fp-y=Y`, `fp-z=Z` (where to focus)
4. **Authentication**: `ixid=X`, `ixlib=Y` (API auth tokens)

**Example progression**:
```
Base URL:     ?ixid=ABC&ixlib=rb-4.1.0
Step 1:       ?crop=entropy&fit=crop&w=336&h=168&ixid=ABC&ixlib=rb-4.1.0
Step 2:       ?crop=focalpoint&fit=crop&w=336&h=168&fp-x=0.5&fp-y=0.3&ixid=ABC&ixlib=rb-4.1.0
```

---

### Task 3c: Clean Unsplash URL Entropy Parameter

**Problem**: Original Unsplash URLs often include `crop=entropy` mixed with auth params

**Current behavior** (in transformMetadata):
```typescript
// Original URL has: ?ixid=ABC&ixlib=rb-4.1.0&crop=entropy
// buildShapeUrl() adds: &w=336&h=168&fit=crop
// Result: ?ixid=ABC&ixlib=rb-4.1.0&crop=entropy&w=336&h=168&fit=crop
// Problem: crop=entropy comes before dimensions, hard to override
```

**Solution**:
1. **Extract and remove** `crop=entropy` from original URL during transformMetadata()
2. **Store** it as a default crop method
3. **Re-add** as first parameter in buildShapeUrl() before dimensions
4. This allows clean override: replace `crop=entropy` with `crop=focalpoint` later

**Implementation in transformMetadata()**:
```typescript
// 1. Parse original URL
const urlObj = new URL(photo.urls.raw)

// 2. Extract crop parameter if present
const cropParam = urlObj.searchParams.get('crop') // 'entropy' or null
urlObj.searchParams.delete('crop') // Remove from base URL

// 3. Store clean base URL + extracted crop method
const cleanBaseUrl = urlObj.toString()
const defaultCrop = cropParam || 'entropy' // Default to entropy if not specified
```

**Implementation in buildShapeUrl()**:
```typescript
// 1. Start with clean base URL (no crop param)
const urlObj = new URL(baseUrl)

// 2. Add crop operation first
urlObj.searchParams.set('crop', 'entropy') // or 'focalpoint' for focal crops
urlObj.searchParams.set('fit', 'crop')

// 3. Add dimensions
urlObj.searchParams.set('w', width.toString())
urlObj.searchParams.set('h', height.toString())

// 4. Auth params already at end of baseUrl
```

---

## 🔧 Implementation Plan

### Phase 1: Update transformMetadata() - Clean Base URLs

**File**: `server/adapters/unsplash-adapter.ts`

**Changes**:
1. Parse `photo.urls.raw` to extract auth params (ixid, ixlib)
2. Remove any existing crop parameters
3. Create clean base URL with only auth params at end
4. Store for use in buildShapeUrl()

### Phase 2: Update buildShapeUrl() - Standardized Parameters

**File**: `server/adapters/unsplash-adapter.ts`

**Changes**:
1. Add crop operation parameters first (`crop=entropy&fit=crop`)
2. Add dimensions (`w=X&h=Y`)
3. Keep auth params from base URL at end

### Phase 3: Verify Cloudinary

**File**: `server/adapters/cloudinary-adapter.ts`

**Check**:
- Transformation string already properly isolated
- No changes needed, just verify structure

---

## 📊 URL Examples - Before & After

### Unsplash - Shape Square (128×128)

**Before** (current):
```
https://images.unsplash.com/photo-1761491924438-c529b4789a12?ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjI1MzUyMTV8&ixlib=rb-4.1.0&w=128&h=128&fit=crop
```

**After** (cleaned):
```
https://images.unsplash.com/photo-1761491924438-c529b4789a12?crop=entropy&fit=crop&w=128&h=128&ixid=M3w0MDg1MTV8MHwxfGFsbHx8fHx8fHx8fDE3NjI1MzUyMTV8&ixlib=rb-4.1.0
```

### Unsplash - Shape Wide with Focal Point (336×168)

**Before** (if user adds focal point manually):
```
https://images.unsplash.com/photo-XYZ?ixid=ABC&ixlib=rb-4.1.0&w=336&h=168&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.3
```

**After** (standardized):
```
https://images.unsplash.com/photo-XYZ?crop=focalpoint&fit=crop&w=336&h=168&fp-x=0.5&fp-y=0.3&ixid=ABC&ixlib=rb-4.1.0
```

### Cloudinary - Shape Square (128×128)

**Before & After** (no change needed):
```
https://res.cloudinary.com/demo/image/upload/c_crop,w_128,h_128/v1234567890/sample.jpg
```

---

## 🎯 Benefits

### For Developers
- **Predictable URLs**: Always know where to find crop, dimension, and auth params
- **Easy override**: Replace `crop=entropy` with `crop=focalpoint` cleanly
- **Debuggable**: URL structure makes intent obvious

### For turl/tpar Preparation
- **Clean base URL**: Can extract minimal params for turl
- **Standardized tpar**: Can store focal params separately
- **Reconstruction**: Easy to rebuild full URL from turl + tpar

### For Users
- **Better previews**: Cleaner URLs mean faster loading
- **Focal point control**: Can override default crop method
- **Future features**: Foundation for hero images with custom crops

---

## ✅ Success Criteria

1. All Unsplash shape URLs have parameters in order: crop → dimensions → focal → auth
2. `crop=entropy` removed from base URL and re-added as first param
3. Cloudinary URLs maintain proper transformation structure
4. All existing tests pass with new URL format
5. Manual import test shows clean URLs in database

---

## 📅 Estimated Timeline

- **Phase 1** (transformMetadata cleanup): 1 hour
- **Phase 2** (buildShapeUrl standardization): 1 hour
- **Phase 3** (Cloudinary verification): 30 minutes
- **Testing**: 30 minutes
- **Total**: ~3 hours

---

---

## 🔜 Upcoming Tasks

### Task 4b: Add Import Context (xml-id, version information)

**Current Behavior**:
- `xml_root` parameter creates sequenced xmlids (e.g., `test.00`, `test.01`)
- No version tracking for re-imports
- No original URL preservation for comparison

**Enhancement Needed**:

1. **Improve xmlid Structure**:
   - Current: `xml_root` → `xmlid` with sequence
   - Proposed: Add better namespacing for different import sources
   - Example: `unsplash_2025-11-07_batch_001.00`

2. **Add Version Information**:
   - Track import timestamp in metadata
   - Store original import batch identifier
   - Enable re-import detection

3. **Enhanced Metadata**:
   ```typescript
   {
     xmlid: 'unsplash_2025-11-07_batch_001.00',  // Namespaced with date
     import_batch_id: 'batch_001',                // Group related imports
     import_timestamp: '2025-11-07T18:47:36Z',    // When imported
     original_url: 'https://...',                  // Source URL for re-import
     import_version: 1                             // Increment on re-import
   }
   ```

4. **Implementation Plan**:
   - Update `ImageImportBatch` type to include batch_id, timestamp
   - Modify `base-adapter.ts` to store additional metadata
   - Update API endpoint to generate batch identifiers
   - Add database fields if needed (or use JSON in existing fields)

**Benefits**:
- Track import history and provenance
- Enable batch re-import with version control
- Better organization for large import operations
- Easier debugging of import issues

**Files to Modify**:
- `/server/types/adapters.ts` - Add batch metadata types
- `/server/adapters/base-adapter.ts` - Store enhanced metadata
- `/server/api/images/import.post.ts` - Generate batch identifiers
- `/tests/integration/images-import-api.test.ts` - Test new metadata

---

### Task 4c: Implement turl + tpar Generation

**Goal**: Generate ultra-small thumbnail URLs for instant preview

**Specifications**:
- **turl** (thumbnail URL): 32×32px ultra-small preview
- **tpar** (thumbnail parameters): JSON string with reconstruction data
- Use alongside BlurHash for optimal loading UX

**Implementation**:
1. Add `buildThumbnailUrl()` method to adapters
2. Generate 32×32px URL for instant loading
3. Store separately in `turl` field
4. Store parameters in `tpar` for reconstruction

**Example**:
```typescript
{
  turl: 'https://images.unsplash.com/...?w=32&h=32&fit=crop',
  tpar: '{"crop":"entropy","focal":null}'
}
```

---

### Task 2: Test Cloudinary Adapter Import

**Status**: Adapter implemented but untested (test currently skipped)

**Required**:
- Valid Cloudinary test URL or API credentials
- Test image upload to Cloudinary demo account
- Integration test verification

**Test URL Format**:
```
https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
```

---

### Task 5: Comprehensive Integration Tests

**Coverage Needed**:
- ✅ Unsplash single import with metadata
- ✅ Unsplash batch import with sequencing
- ✅ URL parameter ordering verification
- ✅ BlurHash generation for all shapes
- ✅ Thumb focalpoint crop with zoom
- ⏳ Cloudinary import (pending valid test URL)
- ⏳ turl/tpar generation and storage
- ⏳ Import context metadata (batch_id, version, timestamp)
- ⏳ Re-import detection and version increment
- ⏳ Mixed adapter batch imports

---

## ✅ Success Criteria Summary

**Phase 1: URL Cleanup** ✅
1. All Unsplash shape URLs have parameters in order: crop → dimensions → focal → auth
2. `crop=entropy` removed from base URL and re-added as first param
3. Thumb shape uses focalpoint with 1.5x zoom
4. Cloudinary URLs maintain proper transformation structure
5. All 9 integration tests pass

**Phase 2: Import Context** ⏳
1. Enhanced xmlid structure with namespacing
2. Batch identifier and timestamp tracking
3. Version tracking for re-imports
4. Original URL preservation

**Phase 3: turl/tpar** ⏳
1. Ultra-small 32×32px thumbnail URLs generated
2. Parameters stored separately for reconstruction
3. Integration with BlurHash for optimal loading
4. Tests verify turl/tpar functionality

**Phase 4: Comprehensive Testing** ⏳
1. Cloudinary adapter fully tested
2. All edge cases covered
3. Performance benchmarks met
4. Manual testing checklist complete

---

## 📅 Timeline Summary

- **Phase 1**: URL Cleanup ✅ Completed (~5 hours)
- **Phase 2**: Import Context ⏳ Estimated 2-3 hours
- **Phase 3**: turl/tpar ⏳ Estimated 2-3 hours
- **Phase 4**: Testing ⏳ Estimated 2-3 hours
- **Total Remaining**: ~6-9 hours

---

**Current Status**: Phase 1 Complete, Moving to Phase 2 (Import Context)  
**Blockers**: None  
**Dependencies**: 
- BlurHash implementation ✅
- URL cleanup ✅
- Integration tests framework ✅
