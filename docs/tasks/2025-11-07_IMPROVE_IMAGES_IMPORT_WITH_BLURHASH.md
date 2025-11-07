# Image Import System Improvement with BlurHash Integration

**Date**: November 7, 2025  
**Status**: Planning  
**Priority**: High  
**Related Files**:
- `/src/components/images/cimgImport.vue` - Import modal UI
- `/server/api/images/import.post.ts` - Import API endpoint
- `/server/adapters/base-adapter.ts` - Base adapter with importImage
- `/server/adapters/unsplash-adapter.ts` - Unsplash-specific adapter
- `/server/adapters/cloudinary-adapter.ts` - Cloudinary-specific adapter
- `/src/components/images/ImgShape.vue` - Image display with BlurHash (reference for URL defaults)
- `/tests/integration/images-import-api.test.ts` - Integration tests (currently disabled)

---

## 🎯 Objective

Improve the image import system to generate all 4 shape URLs with default crop settings and BlurHash hashes during import, before saving to database. This ensures imported images are immediately usable with proper previews.

---

## 📋 Requirements

### 1. Shape URL Generation for Both Adapters
**Location**: `server/adapters/base-adapter.ts` and adapter implementations

For **each of the 4 shapes** (square, thumb, wide, vertical), generate URLs with **simplified default settings copied from ImgShape.vue logic**:

#### Shape Dimensions (from CSS variables in `01-variables.css`)
Based on `src/assets/css/01-variables.css`:
- **Square**: `8rem` = **128px** (tile-height-square)
- **Thumb**: `4rem` = **64px** (avatar)
- **Wide**: `21rem × 10.5rem` = **336px × 168px** (card-width × card-height-min)
- **Vertical**: `7.875rem × 14rem` = **126px × 224px** (9:16 aspect ratio, card-height)

*Note: 1rem = 16px base font size*

**Design Philosophy - Smallest Usable Dimensions for SSR**:
All shapes default to the **smallest usable dimensions** as preparation for SSR (Server-Side Rendering). This minimizes initial payload while maintaining acceptable quality.

**Avatar/Thumb Shape Distinction**:
Avatar and Thumb are used **synonymously** (both 64×64px). Even though this is a square shape, it needs to be handled separately from the standard square shape (128×128px) because:
- **Different content/zoom level**: Avatars typically show closer crops (face-focused)
- **Different context**: Used for profile images, user attribution, small icons
- **Separate optimization**: May need different focal points than standard square thumbnails

**Vertical Shape Edge Case**:
The vertical shape (9:16 portrait ratio) is primarily used for:
1. **Hero component in responsive mobile** layouts
2. **Image stripe on the left side of cards** with default height (14rem = 224px)
3. Seldom used on standard cards due to uncommon aspect ratio

Calculation for vertical: `w = h × (9/16) = 224px × 0.5625 = 126px = 7.875rem`

This ensures the vertical shape fits as a narrow stripe alongside card content while maintaining the proper portrait aspect ratio.

#### Unsplash Defaults (from ImgShape.vue unsplashUrl computed)
- **Shape Square**: `w=128&h=128&fit=crop`
- **Shape Thumb**: `w=64&h=64&fit=crop`
- **Shape Wide**: `w=336&h=168&fit=crop`
- **Shape Vertical**: `w=126&h=224&fit=crop` (9:16 portrait)

#### Cloudinary Defaults (from ImgShape.vue cloudinaryUrl computed)
- **Shape Square**: `c_crop,w_128,h_128`
- **Shape Thumb**: `c_crop,w_64,h_64`
- **Shape Wide**: `c_crop,w_336,h_168`
- **Shape Vertical**: `c_crop,w_126,h_224` (9:16 portrait)

**Important**: 
1. DO NOT START extracting shared code or creating utilities. This task is about copying the URL manipulation logic directly into the adapters. Code sharing/refactoring is a separate future task.
2. These dimensions MUST be cross-checked with ImgShape.vue's `dimensions` computed property to ensure consistency.

### 2. BlurHash Generation for All Shapes
**Location**: `server/adapters/base-adapter.ts` → `importImage()` method

After generating all 4 shape URLs:
1. Call `generateShapeBlurHashes()` utility (from `server/utils/blurhash.ts`)
2. Pass all 4 shape data objects with their URLs
3. Receive blur hashes for each shape
4. Include blur hashes when constructing composite types

**Why batch processing is OK**: Generating 4 BlurHashes takes a moment but happens once per import. User expectation is already set for "processing" during import.

### 3. Save Complete Shape Records
**Location**: `server/adapters/base-adapter.ts` → `updateShapeFields()` method

Currently saves **5-field composite** (x, y, z, url, json):
```typescript
updates.push('shape_square = ROW(?, ?, ?, ?, ?)::image_shape')
values.push(x, y, z, url, json)
```

Must update to **8-field composite** (x, y, z, url, json, blur, turl, tpar):
```typescript
updates.push('shape_square = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
values.push(x, y, z, url, json, blur, turl, tpar)
```

### 4. Re-enable Integration Tests
**Location**: `tests/integration/images-import-api.test.ts`

Currently tests are passing but may need updates to verify:
- All 4 shape fields are populated with URLs
- All 4 shapes have blur hashes
- Composite type parsing works with 8 fields

---

## 🔧 Implementation Plan

### Phase 0: Cross-check and Update ImgShape.vue Dimensions

#### Task 0.1: Verify ImgShape.vue dimensions match CSS variables
**File**: `src/components/images/ImgShape.vue` lines 54-91

Cross-check the `dimensions` computed property against CSS variables in `src/assets/css/01-variables.css`:

**Expected mappings**:
```typescript
// Avatar (4rem = 64px)
if (shape === 'avatar') {
    return [64, 64]
}

// Tile (tile-width: 8rem = 128px, tile-height: 4rem = 64px)
if (shape === 'tile') {
    if (variant === 'square') return [128, 128] // tile-height-square: 8rem
    if (variant === 'wide') return [256, 64]    // tile-width * 2
    return [128, 64] // default
}

// Card (card-width: 21rem = 336px, card-height-min: 10.5rem = 168px, card-height: 14rem = 224px)
if (shape === 'card') {
    if (variant === 'square') return [128, 128]  // Use tile-height-square (8rem)
    if (variant === 'wide') return [336, 168]    // card-width × card-height-min
    if (variant === 'vertical') return [126, 224] // 9:16 aspect ratio × card-height
    return [336, 168] // default = wide
}
```

**Action**: Update ImgShape.vue if dimensions don't match CSS variables.

#### Task 0.2: Document dimension mappings
**File**: `docs/tasks/2025-11-07_IMPROVE_IMAGES_IMPORT_WITH_BLURHASH.md` (this file)

Create reference table showing:
| Shape | Variant | CSS Variable | rem | px | Usage |
|-------|---------|--------------|-----|----|----|
| Avatar | - | `--avatar` | 4rem | 64px | Small profile images |
| Tile | Default | `--tile-width` × `--tile-height` | 8rem × 4rem | 128px × 64px | List/grid items |
| Tile | Square | `--tile-height-square` | 8rem × 8rem | 128px × 128px | Square thumbnails |
| Tile | Wide | `--tile-width` × 2 | 16rem × 4rem | 256px × 64px | Wide list items |
| Card | Square | `--tile-height-square` | 8rem × 8rem | 128px × 128px | Square cards |
| Card | Wide | `--card-width` × `--card-height-min` | 21rem × 10.5rem | 336px × 168px | Standard cards |
| Card | Vertical | 9:16 × `--card-height` | 7.875rem × 14rem | 126px × 224px | Portrait/hero stripe |

**Shape field mappings for import**:
- `shape_square` → Tile/Card Square variant (128px × 128px) - Standard square thumbnails
- `shape_thumb` → Avatar (64px × 64px) - Profile images with face-focused crops
- `shape_wide` → Card Wide variant (336px × 168px) - Standard landscape cards
- `shape_vertical` → Card Vertical variant (126px × 224px, 9:16 portrait) - Hero/sidebar stripes

**Note**: `shape_thumb` and Avatar are synonymous but separate from `shape_square` due to different content zoom/focal points.

### Phase 1: Update Shape URL Generation (Adapters)

#### Task 1.1: Copy ImgShape.vue dimension calculations
**File**: `server/adapters/base-adapter.ts` or adapter-specific files

1. Review `ImgShape.vue` lines 54-91 (dimensions computed property)
2. Extract dimension values verified in Task 0.1:
   - Avatar: 64px × 64px
   - Tile Square: 128px × 128px
   - Card Wide: 336px × 168px
   - Card Vertical: 126px × 224px (9:16 portrait)
3. Create constants or inline values in adapters

**Decision Point**: Should dimensions be:
- A. Hard-coded in each adapter (fastest, duplicates values)
- B. Shared constants file (requires import, but DRY)
- C. Environment variables (most flexible, but overkill)

**Recommendation**: Start with **Option A** (hard-coded) for this task. Document for future refactoring.

#### Task 1.2: Update UnsplashAdapter.transformMetadata()
**File**: `server/adapters/unsplash-adapter.ts` lines 130-185

Current shape generation (simplified):
```typescript
shape_square: {
    url: photo.urls.regular,
    x: 1080,
    y: undefined
}
```

Update to apply ImgShape URL manipulation with correct dimensions:
```typescript
shape_square: {
    url: this.buildShapeUrl(photo.urls.raw, 'square'),
    x: 128,
    y: 128,
    z: null
}
```

Create new method:
```typescript
private buildShapeUrl(baseUrl: string, shape: 'square' | 'thumb' | 'wide' | 'vertical'): string {
    // Copy logic from ImgShape.vue unsplashUrl computed (lines 99-135)
    // Apply w, h, fit params based on shape
    let width: number, height: number
    
    switch (shape) {
        case 'square':
            width = height = 128 // 8rem tile-height-square
            break
        case 'thumb':
            width = height = 64  // 4rem avatar
            break
        case 'wide':
            width = 336; height = 168 // 21rem × 10.5rem card
            break
        case 'vertical':
            width = 126; height = 224 // 7.875rem × 14rem (9:16 portrait)
            break
    }
    
    // Add Unsplash crop parameters
    // ... URL manipulation logic
}
```

#### Task 1.3: Create/Update CloudinaryAdapter
**File**: `server/adapters/cloudinary-adapter.ts`

If Cloudinary adapter doesn't exist yet, create following UnsplashAdapter pattern.

Implement similar `buildShapeUrl()` method with same dimensions:
```typescript
private buildShapeUrl(baseUrl: string, shape: 'square' | 'thumb' | 'wide' | 'vertical'): string {
    // Copy logic from ImgShape.vue cloudinaryUrl computed (lines 141-180)
    // Insert c_crop,w_X,h_X transformations based on shape
}
```

### Phase 2: Integrate BlurHash Generation

#### Task 2.1: Update base-adapter.ts importImage()
**File**: `server/adapters/base-adapter.ts` lines 33-130

After `updateShapeFields()` call, add BlurHash generation:

```typescript
// After line 112 (insertImage success)
const imageId = result.rows?.[0]?.id

// Generate BlurHash for all shapes BEFORE updating shape fields
if (imageId && (metadata.shape_square || metadata.shape_thumb || metadata.shape_wide || metadata.shape_vertical)) {
    // Import utility
    const { generateShapeBlurHashes } = await import('../utils/blurhash')
    
    // Prepare shapes object
    const shapes = {
        shape_square: metadata.shape_square || null,
        shape_thumb: metadata.shape_thumb || null,
        shape_wide: metadata.shape_wide || null,
        shape_vertical: metadata.shape_vertical || null
    }
    
    // Generate BlurHashes (this mutates the shape objects)
    await generateShapeBlurHashes(shapes)
    
    // Now update with blur hashes included
    await this.updateShapeFields(imageId, metadata)
}
```

**Note**: `generateShapeBlurHashes()` already exists and mutates shape objects to add `.blur` property.

#### Task 2.2: Update updateShapeFields() to handle 8 fields
**File**: `server/adapters/base-adapter.ts` lines 132-170

Current code (5-field composite):
```typescript
if (metadata.shape_square) {
    updates.push('shape_square = ROW(?, ?, ?, ?, ?)::image_shape')
    values.push(
        metadata.shape_square.x || null,
        metadata.shape_square.y || null,
        null, // z
        metadata.shape_square.url,
        null  // json
    )
}
```

Update to (8-field composite):
```typescript
if (metadata.shape_square) {
    updates.push('shape_square = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
    values.push(
        metadata.shape_square.x || null,
        metadata.shape_square.y || null,
        null, // z
        metadata.shape_square.url,
        null, // json
        metadata.shape_square.blur || null,
        null, // turl
        null  // tpar
    )
}
```

Repeat for all 4 shapes: `shape_square`, `shape_thumb`, `shape_wide`, `shape_vertical`.

### Phase 3: Test and Validate

#### Task 3.1: Manual testing via cimgImport modal
**UI**: `/src/views/admin/ImagesCoreAdmin.vue` → Import Images button

1. Open ImagesCoreAdmin
2. Click "Import Images" in Data dropdown menu
3. Add Unsplash URL(s)
4. Fill metadata (project, owner, ctags)
5. Click Save & Import
6. Verify in database:
   ```sql
   SELECT id, name, 
          (shape_square).url as sq_url, 
          (shape_square).blur as sq_blur,
          (shape_thumb).url as th_url,
          (shape_thumb).blur as th_blur,
          (shape_wide).url as wi_url,
          (shape_wide).blur as wi_blur,
          (shape_vertical).url as ve_url,
          (shape_vertical).blur as ve_blur
   FROM images 
   WHERE xmlid LIKE 'test_import%'
   ORDER BY id DESC 
   LIMIT 5;
   ```
7. Verify all 4 shapes have URLs and blur hashes

#### Task 3.2: Re-enable and update integration tests
**File**: `tests/integration/images-import-api.test.ts`

Current test status: Tests exist and pass but may need verification updates.

Add assertions to existing tests:

```typescript
// After line 182 (verify database record)
expect(image.shape_square).toBeDefined()
expect(typeof image.shape_square === 'string').toBe(true) // Composite returned as string

// Parse composite type string to verify blur field
const squareStr = image.shape_square as string
expect(squareStr).toMatch(/\([^)]+\)/) // Has composite format (...)
// Extract blur field (field 6 out of 8)
const match = squareStr.match(/\((.*)\)/)
if (match) {
    const parts = match[1].split(',')
    expect(parts.length).toBe(8) // Verify 8-field composite
    expect(parts[5]).toBeTruthy() // Blur hash is field 6 (index 5)
    expect(parts[5].length).toBeGreaterThan(10) // BlurHash is ~20-30 chars
}
```

Add similar checks for:
- `shape_thumb`
- `shape_wide`
- `shape_vertical`

#### Task 3.3: Run full test suite
```bash
# Run all integration tests
pnpm test tests/integration/

# Run specific import test
pnpm test tests/integration/images-import-api.test.ts

# Verify no regressions
pnpm test
```

---

## 📊 Success Criteria

### ✅ Functional Requirements
- [ ] Import creates all 4 shape URLs with correct crop parameters
- [ ] Import generates BlurHash for all 4 shapes
- [ ] All 8 fields of `image_shape` composite are populated
- [ ] Unsplash imports work with default crop settings
- [ ] Cloudinary imports work with default crop settings
- [ ] Import modal shows success message with count
- [ ] Imported images display correctly with blur placeholders

### ✅ Technical Requirements
- [ ] No duplicate code between adapters (each has its own buildShapeUrl)
- [ ] BlurHash generation happens in single batch (4 URLs at once)
- [ ] Database receives 8-field composite types
- [ ] Triggers populate img_* JSONB fields correctly
- [ ] All integration tests pass

### ✅ User Experience
- [ ] Import takes reasonable time (<5s for 1 image, <30s for 5 images)
- [ ] Progress indication during BlurHash generation (if needed)
- [ ] Clear error messages if BlurHash generation fails
- [ ] Imported images immediately show in list with blur previews

---

## 🚧 Known Constraints & Decisions

### Why Not Extract Shared Code?
The ImgShape.vue component has URL manipulation logic that COULD be shared with adapters. However:
- Different execution contexts (browser vs Node.js)
- Different dependencies (Vue composables vs server utils)
- Risk of breaking existing functionality
- Premature optimization

**Decision**: Copy logic inline for now. Document for future refactoring sprint.

### BlurHash Performance Considerations
Generating 4 BlurHashes per image requires:
- 4 HTTP requests to fetch image data
- 4 Sharp operations to resize and analyze
- Estimated 1-3 seconds per image total

This is acceptable because:
- Import is an admin-only operation
- Users expect "processing" during import
- Batch imports show progress (already implemented)
- BlurHash only generated once, cached forever

### Composite Type Field Order
Must match database schema exactly (from migration 019):
```sql
CREATE TYPE image_shape AS (
    x numeric,
    y numeric,
    z numeric,
    url text,
    json jsonb,
    blur varchar(50),
    turl text,
    tpar text
);
```

Any mismatch will cause PostgreSQL type errors.

---

## 🔗 Related Documentation

- `docs/tasks/2025-11-07_TWEAK_MIGRATION019_table_images_blur_turl_tpar.md` - Schema update
- `docs/tasks/2025-11-07_TEST_FILES_SUPERVISION_image_shape_changes.md` - Test supervision
- `docs/DATABASE_SCHEMA.md` - Full schema reference
- `docs/mcp/updating_schema_and_endpoints.md` - Update workflow
- `server/utils/blurhash.ts` - BlurHash utility functions

---

## 📝 Implementation Checklist

### Phase 0: Dimension Verification & Update
- [ ] Task 0.1: Cross-check ImgShape.vue dimensions with CSS variables
  - [ ] Verify avatar dimensions (64px × 64px)
  - [ ] Verify tile-square dimensions (128px × 128px)
  - [ ] Verify card-wide dimensions (336px × 168px)
  - [ ] Verify card-vertical dimensions (126px × 224px, 9:16 portrait)
  - [ ] Update ImgShape.vue if mismatches found
- [ ] Task 0.2: Document dimension reference table in plan

### Phase 1: Shape URL Generation
- [ ] Task 1.1: Copy dimension calculations from ImgShape.vue
- [ ] Task 1.2: Update UnsplashAdapter.transformMetadata()
  - [ ] Implement buildShapeUrl() with correct dimensions
  - [ ] Update shape_square (128px × 128px)
  - [ ] Update shape_thumb (64px × 64px)
  - [ ] Update shape_wide (336px × 168px)
  - [ ] Update shape_vertical (126px × 224px, 9:16 portrait)
- [ ] Task 1.3: Update/Create CloudinaryAdapter with buildShapeUrl()
  - [ ] Same dimensions as Unsplash adapter

### Phase 2: BlurHash Integration
- [ ] Task 2.1: Add BlurHash generation to importImage()
- [ ] Task 2.2: Update updateShapeFields() to 8-field composite

### Phase 3: Testing
- [ ] Task 3.1: Manual import testing via UI
  - [ ] Test Unsplash import with dimension verification
  - [ ] Test Cloudinary import with dimension verification
- [ ] Task 3.2: Update integration test assertions
  - [ ] Add dimension checks for all 4 shapes
  - [ ] Verify URLs have correct crop parameters
- [ ] Task 3.3: Run full test suite

### Phase 4: Validation
- [ ] Verify shape URLs have correct crop parameters (128, 64, 336×168, 126×224)
- [ ] Verify dimensions match ImgShape.vue calculations
- [ ] Verify BlurHash hashes are generated and stored
- [ ] Verify img_* JSONB fields populated by triggers
- [ ] Verify blur preview works in ImagesCoreAdmin
- [ ] Document any issues or edge cases

---

## 🐛 Potential Issues & Mitigation

### Issue 1: BlurHash Generation Timeout
**Risk**: Fetching 4 images might timeout on slow connections

**Mitigation**:
- Set reasonable timeout (10s per image)
- Continue on partial failure (some shapes without blur is OK)
- Log warnings for failed BlurHash generation
- Don't block entire import if BlurHash fails

### Issue 2: Shape URL Dimension Mismatch
**Risk**: Hard-coded dimensions in adapters might diverge from ImgShape.vue or CSS variables

**Mitigation**:
- Complete Task 0.1 first (cross-check dimensions)
- Document dimension source (CSS variables) in code comments
- Add unit test comparing adapter dimensions with ImgShape
- Create GitHub issue for future dimension constant sharing

### Issue 3: Adapter URL Parsing Edge Cases
**Risk**: Some Unsplash/Cloudinary URLs might not parse correctly

**Mitigation**:
- Test with various URL formats
- Add fallback to return original URL if parsing fails
- Log warnings for unparseable URLs
- Allow import to continue with original URLs

### Issue 4: Test Composite Type Parsing
**Risk**: Tests might fail parsing 8-field composite string

**Mitigation**:
- Use flexible regex parsing in tests
- Test with real database data
- Add helper function for composite parsing in tests
- Document composite format in test comments

---

## 🎯 Next Steps After Completion

1. **Monitor Performance**: Track import times with BlurHash enabled
2. **User Feedback**: Get admin feedback on import UX
3. **Code Refactoring**: Plan shared utility for URL manipulation
4. **Additional Adapters**: Apply same pattern to Vimeo, Canva adapters
5. **Enhanced Testing**: Add visual regression tests for shape URLs
6. **Documentation**: Update admin guide with import best practices
7. **Hero Component Dimensions** (Future Task - `hero-dimensions`):
   - Review hero component usage of vertical shape in responsive mobile layouts
   - Consider creating dedicated hero-specific dimensions if 126×224px proves insufficient
   - Evaluate if hero needs larger dimensions (e.g., 9:16 ratio × full viewport height)
   - Document hero image requirements and optimization strategies
   - May require separate `shape_hero` field or dynamic sizing logic

---

## 📚 Design Decisions Documented

### Hard-coded Dimensions Rationale
**Decision**: Hard-code dimensions in adapters rather than sharing constants.

**Reasoning**:
- Different execution contexts (browser vs Node.js)
- Different dependencies (Vue composables vs server utils)
- Risk of breaking existing functionality during refactoring
- Premature optimization before patterns stabilize

**Trade-offs**:
- ✅ Faster implementation
- ✅ No cross-context dependency management
- ✅ Independent testing of frontend and backend
- ❌ Duplicate dimension values in 3 places (CSS, ImgShape, adapters)
- ❌ Manual synchronization required when dimensions change

**Future Refactoring**: Create GitHub issue to extract shared dimension constants once patterns are stable.

### SSR-First Dimension Strategy
**Decision**: All default shape dimensions use the smallest usable size.

**Reasoning**:
- Minimizes initial payload for Server-Side Rendering
- Reduces Time to First Contentful Paint (FCP)
- Browser can progressively load larger sizes as needed
- Acceptable quality for initial render on mobile devices

**Example**: Vertical shape uses 126×224px (9:16 × 14rem) rather than full-screen hero size because:
1. Primary use case is card sidebar stripe
2. Hero component handles its own responsive sizing
3. Smaller default reduces bandwidth for non-hero contexts

### Vertical Shape as Edge Case
**Context**: The vertical (portrait) shape has uncommon 9:16 aspect ratio.

**Primary Use Cases**:
1. **Hero component** - Full-height responsive mobile layouts
2. **Card sidebar** - Narrow image stripe on left side of card (14rem height)
3. **Gallery verticals** - Portrait-oriented image collections

**Why Edge Case**:
- Most content uses landscape (wide) or square ratios
- Vertical crops require careful focal point selection
- Limited screen real estate on desktop
- Hero component may need larger dimensions in future

**Dimension Calculation**:
```
Base height: 14rem (--card-height) = 224px
Aspect ratio: 9:16 (portrait)
Width: 224px × (9/16) = 126px = 7.875rem
Result: 126×224px
```

This ensures vertical shape works as sidebar stripe while maintaining proper portrait ratio.

### Avatar/Thumb vs Square Distinction
**Context**: Both Avatar/Thumb (64×64px) and Square (128×128px) are square aspect ratios, but serve different purposes.

**Why Separate Shape Fields**:
- **Different content zoom**: Avatars show tighter crops focused on faces
- **Different focal points**: Avatar centers on person's face, Square may show full subject
- **Different context**: Avatar for profiles/attribution, Square for general thumbnails
- **Synonymous naming**: `shape_thumb` and "Avatar" refer to the same 64×64px shape

**Example Use Cases**:
- **Avatar/Thumb**: User profile picture showing face close-up
- **Square**: Product thumbnail showing full item in frame

Even though both are square, the content composition and intended use differ significantly.

---

## 📅 Estimated Timeline

- **Phase 0** (Dimension verification): 0.5-1 hour
- **Phase 1** (Shape URLs): 2-3 hours
- **Phase 2** (BlurHash): 1-2 hours
- **Phase 3** (Testing): 1-2 hours
- **Total**: ~4.5-8 hours

---

**Ready for Implementation**: Yes ✅  
**Blockers**: None  
**Prerequisites**: 
- Migration 019 completed (shape_* fields with blur/turl/tpar) ✅
- CSS variables defined in `01-variables.css` ✅
- ImgShape.vue dimension calculations exist ✅
