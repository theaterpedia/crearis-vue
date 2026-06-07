# Hero.vue Image System - Full Implementation Plan

**Date:** 2025-12-15  
**Status:** ✅ COMPLETE - Validated Working  
**Last Updated:** 2025-12-15 12:15

---

## Current State

### ✅ All Core Items Complete

1. **BlurHash decoding** - Canvas element, `useBlurHash` composable working
2. **Image loading** - `currentShapeData` correctly uses `img_*` JSONB columns
3. **Cover sizing resolved** - ALL hero types use `background-size: cover`
4. **Hero instances** - API returns `hero_wide_xl`, `hero_wide`, etc. with correct URLs
5. **Regenerate shapes** - Creates hero instance files (1440×820 for hero_wide_xl)
6. **PageHeading integration** - Uses `useHeaderConfig` composable

### Key Discovery (2025-12-15)
**Banner vs Cover is NOT about `background-size`!**
- Both use `background-size: cover` (full-width, scaled to fill)
- The difference is `background-position-y`:
  - **Banner**: `top` (shows top of image)
  - **Cover**: `center` (shows center of image)
- Height difference comes from `headerSize`:
  - Banner typically uses `medium` (50vh)
  - Cover typically uses `prominent` (75vh) or `full` (100vh)

---

## Test Post Validated ✅

**Post ID 49** - Confirmed working:
```json
{
  "id": 49,
  "name": "**Forum-Theater verändert deine Nachbarschaft**",
  "header_type": "banner",
  "header_size": "medium",
  "img_id": 107,
  "domaincode": "opus1"
}
```

**Test URL:** `/posts/49` - Sharp image, correct height, top-aligned ✅

---

## Architecture Overview

### Data Flow (Final)
```
PostPage.vue
  └─ passes header_type, header_size, image_id to PageHeading
      └─ PageHeading uses useHeaderConfig(headerType, headerSubtype)
          └─ Resolves config from API (base → subcat → project override)
              └─ Passes to Hero.vue:
                  - heightTmp = headerSize (mini|medium|prominent|full)
                  - imgTmpAlignY = from config (banner='top', cover='center')
                  - image_id = for API-based image loading
```

### Header Type Behavior (Final)
| Type | imgTmpAlignY | Default headerSize | Description |
|------|-------------|-------------------|-------------|
| simple | - | - | No hero (text only) |
| columns | - | - | Side-by-side text/image |
| banner | **top** | medium (50vh) | Image top-aligned |
| cover | **center** | prominent (75vh) | Image centered |
| bauchbinde | center | medium | Text band overlay |

### Hero Heights
| headerSize | CSS Height |
|------------|------------|
| mini | 25vh |
| medium | 50vh |
| prominent | 75vh |
| full | 100vh |
})
```

---

## Files Modified (Complete List)

### Core Components
- `src/components/Hero.vue` - usesCoverSizing, shape selection, BlurHash
- `src/components/PageHeading.vue` - useHeaderConfig integration
- `src/composables/useHeaderConfig.ts` - Created (API resolution + caching)

### API Endpoints
- `server/api/images/[id].get.ts` - Added hero instance URL building
- `server/api/images/[id]/regenerate-shapes.post.ts` - Fixed xmlid, adapter check
- `server/api/header-configs/*.ts` - 8 endpoints for config CRUD

### Database
- Migration 066: `header_size` column on posts/pages
- Migration 067: `header_configs` + `project_header_overrides` tables

---

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Should new image system respect imgTmpAlignX/Y? | Yes - imgTmpAlignY controls vertical position (top/center) |
| Is cover always correct for shaped images? | Yes for background-size, but position varies by type |
| Should hero instances be pre-generated? | Yes - regenerate-shapes creates them at correct sizes |
| Bauchbinde semantics? | Uses banner/cover sizing with Banner component overlay |

---

## Next Actions

### Phase 4: HeaderOptionsPanel (NEXT)
1. [ ] Create `HeaderOptionsPanel.vue` with header_type/size dropdowns
2. [ ] Integrate into `EditPanel.vue`
3. [ ] Integrate into `EventPanel.vue`
4. [ ] Test saving header_type/size changes

### Phase 5: TextImageHeader.vue
1. [ ] Create for `columns` header type
2. [ ] Support half_* shape instances
3. [ ] Wire into PageHeading.vue

### Phase 6: Admin Enhancements
1. [ ] Add domaincode input to HeaderConfigsEditor
2. [ ] Show project override preview

### Cleanup
- [ ] Remove `[Hero DEBUG]` console.logs from Hero.vue
- [ ] Keep error logging for failed image loads

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
