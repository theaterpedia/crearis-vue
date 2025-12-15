# Hero.vue Image System - Full Implementation Plan

**Date:** 2025-12-15  
**Status:** In Progress  
**Context:** BlurHash placeholder working, image loading working, sizing clarification needed

---

## Current State

### ✅ Completed
1. **BlurHash decoding** - Canvas element added, `useBlurHash` composable working
2. **Image loading** - `currentShapeData` now correctly uses `img_*` JSONB columns (not raw `shape_*` ROW strings)
3. **Cover sizing for new system** - `usesCoverSizing` computed forces `cover` when `effectiveImageData` is present
4. **Regenerate blur endpoint** - Updates `shape_*` columns, trigger propagates to `img_*`

### 🔄 In Progress
1. **Background sizing semantics** - Currently hardcoded to `cover` for new image system

---

## Architecture Overview

### Data Flow
```
PostPage.vue
  └─ passes image_id, image_blur to PageHeading
      └─ PageHeading passes to Hero.vue with headerType config
          └─ Hero fetches image via useImageFetch
              └─ effectiveImageData contains img_wide, img_square, etc. (JSONB)
                  └─ currentShapeData selects based on selectedInstance
                      └─ buildImageUrl constructs final URL
```

### Header Types in PageHeading.vue
| Type | imgTmpAlignX | imgTmpAlignY | Description |
|------|-------------|--------------|-------------|
| simple | center | center | No header |
| columns | center | center | 2-column layout |
| banner | center | top | Standard banner |
| cover | **cover** | center | Full cover image |
| bauchbinde | **cover** | center | Full-width with content band |

### Current Sizing Logic (Hero.vue)
```javascript
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) return true  // ← Always cover for new system
  if (isBlurHashActive.value) return true
  if (props.imgTmpAlignX === 'cover' || props.imgTmpAlignY === 'cover') return true
  return false
})
```

---

## Open Questions / Ambiguities

### 1. Should new image system respect imgTmpAlignX/Y?
**Current:** No - hardcoded to `cover`  
**Alternative:** Respect the headerType configuration  
**Question:** Is `cover` always correct for shaped images, or should `banner` type with `center/top` be honored?

### 2. Bauchbinde semantics
- Full-width content band at bottom
- Image behind should be `cover` sized
- **TODO:** Clarify if bauchbinde needs different image instance selection

### 3. Instance selection mapping
Current `selectedInstance` (e.g., `hero_wide_xl`) falls back to:
1. Direct instance data (e.g., `hero_wide_xl`)
2. **New:** `img_wide` / `img_square` / `img_vert` (JSONB)
3. Old: `shape_*` composite types (unreliable)

**Question:** Should hero instances (`hero_wide_*`, `hero_square_*`) be pre-generated, or is fallback to `img_*` acceptable?

### 4. Shape vs Instance terminology
- **Shape:** Template (wide, square, thumb, vertical)
- **Instance:** Sized version for specific use (hero_wide_xl, display_square_md)
- **Current behavior:** Uses shape as fallback when instance unavailable

---

## Action Plan

### Phase 1: Finalize Sizing Behavior
- [ ] Decide: Always cover for new system OR respect headerType config
- [ ] If respecting headerType: Map `imgTmpAlignX/Y` properly in `usesCoverSizing`
- [ ] Test all header types: simple, columns, banner, cover, bauchbinde

### Phase 2: Clean Up Debug Logging
- [ ] Remove `[Hero DEBUG]` console.logs from Hero.vue
- [ ] Keep error logging for failed image loads

### Phase 3: Instance Selection Refinement
- [ ] Verify `hero_*` instance fallback chain is correct
- [ ] Consider if `img_*` should be preferred over `shape_*` always (currently yes)
- [ ] Document expected behavior for each instance type

### Phase 4: Integration Testing
- [ ] Test PostPage with image_id
- [ ] Test Home.vue with legacy imgTmp
- [ ] Test CardHero with both systems
- [ ] Test responsive breakpoints (instance switching)

### Phase 5: Documentation
- [ ] Update component prop documentation
- [ ] Document headerType → sizing behavior mapping
- [ ] Add migration guide: imgTmp → image_id

---

## Notes / Findings

### 2025-12-15
- `shape_*` columns return PostgreSQL ROW strings like `(,,,url,,blur,,)` - not usable directly
- `img_*` columns are JSONB with proper `{url, blur, alt_text}` structure
- Database trigger `compute_image_shape_fields()` propagates `shape_*` → `img_*`
- BlurHash values contain commas, require escaping in ROW format

---

## Files Modified
- `src/components/Hero.vue` - BlurHash support, cover sizing, shape selection fix
- `src/components/PageHeading.vue` - Passthrough for image_id, image_blur props
- `src/views/PostPage.vue` - Passes image_id/image_blur to PageHeading
- `server/api/images/[id]/regenerate-blur.post.ts` - Fixed 8-field ROW format, escaping
