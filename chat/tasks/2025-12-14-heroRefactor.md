# Hero.vue Refactor & Display Components Report
**Date:** December 14, 2025

## 1. Executive Summary

This report analyzes the implementation requirements for:
1. **8 new shape instances** for image import with target-based naming
2. **DisplayImage.vue** - In-content image display component
3. **DisplayBanner.vue** - Thin banner separator component
4. **Hero.vue refactoring** - Intelligent responsive image selection from 6 hero instances

---

## 2. Current Architecture Analysis

### 2.1 Existing Shape System

The current implementation in [ImgShape.vue](src/components/images/ImgShape.vue) provides:
- 4 core shapes: `square`, `wide`, `thumb`, `vertical`
- Adapter detection (unsplash, cloudinary, vimeo, external)
- BlurHash placeholder support via `useBlurHash.ts`
- XYZ focal point transformations

### 2.2 Image Data Structure (Current)

```typescript
interface ShapeData {
  url?: string
  x?: number | null   // Focal X (0-100)
  y?: number | null   // Focal Y (0-100)
  z?: number | null   // Zoom (0-100)
  blur?: string       // BlurHash
  turl?: string       // Template URL
  tpar?: string       // Template parameters
}
```

### 2.3 Backend Shape Generation

Currently handled in:
- [server/adapters/local-adapter.ts](server/adapters/local-adapter.ts) - Local file processing
- [server/adapters/unsplash-adapter.ts](server/adapters/unsplash-adapter.ts) - Unsplash URL building
- [server/adapters/cloudinary-adapter.ts](server/adapters/cloudinary-adapter.ts) - Cloudinary transformations

---

## 3. Questions & Decisions

### 3.1 Backend Implementation Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Should instances be stored as separate DB columns or in a JSONB field? | **No DB storage** - Only file generation for local adapter. Cloudinary/Unsplash need no file generation. |
| 2 | Are XYZ values inherited from template to instances, or calculated independently? | **Inherited from template** |
| 3 | How should `display_thumb_banner` handle y-axis focus when source aspect differs significantly? | **Y-axis focus from thumb** indicates vertical center percentage + zoom level → translate to X-axis. X-axis center also from thumb, only X-axis pixel width needs custom handling. Known issues acceptable until 1.0. |
| 4 | Should BlurHash be generated per-instance or shared from template? | **Use BlurHash from template** |
| 5 | What fallback behavior when custom XYZ preset exists on template? | **Display warning in ImgShape.vue**: "Shape-instances do not support custom XYZ yet" |

> **📋 v0.8-DEFERRED TASK:** Define logic for persisting instance special handling via `turl`/`tpar` fields on images table.

### 3.2 Frontend Component Decisions

| # | Question | Decision |
|---|----------|----------|
| 6 | Should DisplayImage/DisplayBanner fetch by `xmlid` or receive full image data as prop? | **Fetch by xmlid** - Enables importing images into pages without requiring the image on the entity record |
| 7 | How does DisplayImage detect it's inside Columns.vue vs Container.vue? | **Explicit prop `isColumn`** (default=false) |
| 8 | For Hero.vue: what's the breakpoint threshold between hero instance selections? | **See clarification below** |
| 9 | Should gradient overlays be part of Hero.vue or separate composable? | **Keep in Hero.vue** - Already working well. See composable example below for future consideration. |

### 3.3 Hero Instance Breakpoints (Resolved ✅)

**Decision:** Breakpoints are viewport-based with `heightTmp` prop influence.

```typescript
function selectHeroInstance(
  viewport: { width: number, height: number },
  heightTmp: 'full' | 'prominent' | 'medium' | 'mini'
): HeroInstance {
  
  // Mobile: ≤ 440px
  if (viewport.width <= 440) {
    // Use vertical for prominent/full (cover) heroes
    if (heightTmp === 'prominent' || heightTmp === 'full') {
      return 'hero_vertical'  // 440×880
    }
    return 'hero_square'      // 440×440
  }
  
  // Tablet: 440px < viewport ≤ 768px
  if (viewport.width <= 768) {
    return 'hero_square'      // 440×440
  }
  
  // Small desktop: 768px < viewport ≤ 1100px
  if (viewport.width <= 1100) {
    return 'hero_wide'        // 1100×620
  }
  
  // Large desktop: 1100px < viewport ≤ 1440px
  if (viewport.width <= 1440) {
    return 'hero_wide_xl'     // 1440×820
  }
  
  // Extra large: viewport > 1440px
  // Use square_xl for full-cover heroes on tall screens
  if (heightTmp === 'full' && viewport.height > 950) {
    return 'hero_square_xl'   // 1440×1280
  }
  return 'hero_wide_xl'       // 1440×820
}
```

**Instance Selection Summary:**

| Viewport | Default | With `heightTmp='prominent'/'full'` |
|----------|---------|-------------------------------------|
| ≤ 440px | `hero_square` (440×440) | `hero_vertical` (440×880) |
| 441-768px | `hero_square` (440×440) | `hero_square` (440×440) |
| 769-1100px | `hero_wide` (1100×620) | `hero_wide` (1100×620) |
| 1101-1440px | `hero_wide_xl` (1440×820) | `hero_wide_xl` (1440×820) |
| >1440px | `hero_wide_xl` (1440×820) | `hero_square_xl` (1440×1280)* |

*Only when `heightTmp='full'` AND `viewport.height > 950px`

### 3.4 Gradient Composable (Deferred ✅)

**Decision:** Keep gradient overlay in Hero.vue for now. Already working well.

---

## 4. New Shape Instances Specification

### 4.1 Instance Table

| Instance Name | Template | Dimensions (W×H) | Notes |
|---------------|----------|------------------|-------|
| `display_wide` | wide | 531 × 300 | Standard in-content display |
| `display_thumb_banner` | thumb | 1062 × 265.5 | Special: Y-axis focus, X-axis expand |
| `hero_wide_xl` | wide | 1440 × 820 | Desktop hero, extra large |
| `hero_square_xl` | square | 1440 × 1280 | Desktop hero, square variant |
| `hero_wide` | wide | 1100 × 620 | Standard desktop hero |
| `hero_square` | square | 440 × 440 | Mobile/tablet square hero |
| `hero_vertical` | vertical | 440 × 880 | Mobile vertical hero |

### 4.2 Backend Loop Architecture

```
Outer loop: [square, wide, vertical, thumb]
  Inner loop: [template-root, ...target-instances-for-template]
```

---

## 5. Implementation Plan: Alternative A (Chosen)

### Architecture Decision
**Extend ImgShape.vue** as single source of truth for all image display logic.

### Key Implementation Points

1. **No DB storage for instances** - Files generated on-demand for local adapter only
2. **XYZ inherited from templates** - Instances reuse template focal points
3. **BlurHash from templates** - No separate BlurHash generation for instances
4. **Custom XYZ warning** - Display "Shape-instances do not support custom XYZ yet" when detected
5. **Fetch by xmlid** - DisplayImage/DisplayBanner autonomously query `/api/images/xmlid/:xmlid`
6. **Explicit `isColumn` prop** - No parent detection magic

---

## 6. Hero.vue Refactoring Strategy

### 6.1 Instance Selection Logic (Resolved ✅)

```typescript
type HeroInstance = 
  | 'hero_vertical'   // 440×880 - Mobile portrait
  | 'hero_square'     // 440×440 - Mobile/tablet
  | 'hero_wide'       // 1100×620 - Small desktop
  | 'hero_wide_xl'    // 1440×820 - Large desktop
  | 'hero_square_xl'  // 1440×1280 - XL cover heroes

function selectHeroInstance(
  viewport: { width: number, height: number },
  heightTmp: 'full' | 'prominent' | 'medium' | 'mini'
): HeroInstance {
  // Mobile ≤ 440px
  if (viewport.width <= 440) {
    return (heightTmp === 'prominent' || heightTmp === 'full') 
      ? 'hero_vertical' 
      : 'hero_square'
  }
  
  // Tablet 441-768px
  if (viewport.width <= 768) return 'hero_square'
  
  // Small desktop 769-1100px
  if (viewport.width <= 1100) return 'hero_wide'
  
  // Large desktop 1101-1440px
  if (viewport.width <= 1440) return 'hero_wide_xl'
  
  // XL desktop > 1440px
  if (heightTmp === 'full' && viewport.height > 950) {
    return 'hero_square_xl'
  }
  return 'hero_wide_xl'
}
```

### 6.2 Hero.vue Image Prop Structure (Proposed)

```typescript
interface HeroImageData {
  // Templates (for custom XYZ editing)
  shape_square?: ShapeData
  shape_wide?: ShapeData
  shape_vertical?: ShapeData
  
  // Hero instances (pre-rendered)
  hero_wide_xl?: ShapeData
  hero_square_xl?: ShapeData
  hero_wide?: ShapeData
  hero_square?: ShapeData
  hero_vertical?: ShapeData
}
```

---

## 7. Revised Implementation Plan (Alternative A)

### Phase 1: Backend Shape Generation (6-8 hours)
1. Extend local-adapter.ts with 2-loop architecture
2. Implement instance generation using inherited XYZ
3. Add special `display_thumb_banner` X-axis expansion logic
4. Use template BlurHash for all instances
5. No Cloudinary/Unsplash file generation needed
6. **Test**: Extend `rebuildShapeUrlWithXYZ.test.ts` with XYZ inheritance tests

### Phase 2: API Endpoint (2-3 hours)
1. Create `/api/images/xmlid/:xmlid` endpoint
2. Return shape data including `display_wide` instance URL
3. **Test**: Create `tests/integration/xmlid-endpoint.test.ts`

### Phase 3: ImgShape.vue Extension (4-6 hours)
1. Add new shape types to union
2. Add dimension calculations for instances
3. ~~Add custom XYZ warning for shape-instances~~ (deferred - see recommendations)
4. **Test with local adapter only** (crearis) - extend `ImgShape-CList-Integration.test.ts`

### Phase 4: Display Components (6-8 hours)
1. Create DisplayImage.vue with all props + `isColumn`
2. Create DisplayBanner.vue
3. Implement xmlid fetching
4. Add responsive sizing with aspect-ratio preservation
5. **Test**: Create `tests/component/DisplayImage.test.ts`
6. **Test**: Create `tests/component/DisplayBanner.test.ts`

### Phase 5: Hero.vue Refactoring (4-6 hours)
1. Add hero instance props
2. Implement `selectHeroInstance()` function
3. Test responsive behavior
4. **Test**: Create `tests/unit/selectHeroInstance.test.ts`

### Phase 6: Demo View & Testing (3-4 hours)
1. Create `/Demo/DemoDisplayImage.vue`
2. Show both Container and Columns usage
3. Manual QA integration testing

**Total Estimated Effort:** 25-35 hours

---

## 8. Decision Matrix (Reference)

| Criteria | Alt A (Extend) ✅ | Alt B (Composables) | Alt C (Wrapper) |
|----------|-------------------|---------------------|-----------------|
| Code reuse | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Simplicity | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| Flexibility | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| Maintenance | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| Performance | ★★★★★ | ★★★★☆ | ★★★☆☆ |

**Selected: Alternative A** - Extend ImgShape.vue

## 9. Testing Cross-Check with Test Registry

### 9.1 Existing Tests to Extend

| Existing Test File | Current Coverage | Extension Needed |
|--------------------|------------------|------------------|
| `tests/component/ImgShape-CList-Integration.test.ts` (777 lines, 28 tests) | Tests `square`, `wide`, `thumb`, `vertical` shapes with CList components | **Add tests for new shape types**: `display_wide`, `display_thumb_banner`, `hero_*` |
| `tests/unit/rebuildShapeUrlWithXYZ.test.ts` (355 lines) | XYZ URL building for Unsplash/Cloudinary | **Add tests for XYZ inheritance** from template to instances |
| `tests/database/image-shape-reducer.test.ts` (593 lines, 22 tests) | JSONB computed fields for 4 shapes | **No change needed** - instances aren't DB-stored |

> **Note:** ShapeEditor tests (`shape-editor.test.ts`, `v2-imagesCore-shapeEditor.test.ts`) are **out of scope**. See [2025-12-14-shapeEditor-recommendations.md](2025-12-14-shapeEditor-recommendations.md) for future considerations.

### 9.2 New Test Files Required

| New Test File | Phase | Purpose | Estimated Tests |
|---------------|-------|---------|-----------------|
| `tests/unit/selectHeroInstance.test.ts` | Phase 5 | Test `selectHeroInstance()` function with viewport/heightTmp combinations | ~15 tests |
| `tests/component/DisplayImage.test.ts` | Phase 4 | DisplayImage props, xmlid fetching, responsive sizing, `isColumn` prop | ~20 tests |
| `tests/component/DisplayBanner.test.ts` | Phase 4 | DisplayBanner props, xmlid fetching, aspect-ratio preservation | ~10 tests |
| `tests/integration/xmlid-endpoint.test.ts` | Phase 2 | `/api/images/xmlid/:xmlid` endpoint testing | ~8 tests |

### 9.3 Test Patterns to Follow

Based on existing test structure:

```typescript
// Pattern from ImgShape-CList-Integration.test.ts
// Use for DisplayImage/DisplayBanner tests

import { mountCListComponent } from '../utils/mount-helpers'
import { createMockImageData } from '../utils/clist-test-data'

describe('DisplayImage + ImgShape', () => {
  it('should render ImgShape with display_wide shape', async () => {
    const imageData = createMockImageData('display_wide') // Extend clist-test-data
    const { wrapper } = mountCListComponent(DisplayImage, {
      props: { xmlid: 'test.image.001', isColumn: false }
    })
    // ... assertions
  })
})
```

### 9.4 Test Helper Extensions Needed

| Helper File | Extension |
|-------------|-----------|
| `tests/utils/clist-test-data.ts` | Add `createMockImageData('display_wide')`, `createMockImageData('hero_wide_xl')` etc. |
| `tests/utils/mount-helpers.ts` | May need fetch mock setup for xmlid endpoint |

### 9.5 Testing Timeline Integration

| Phase | Implementation | Testing |
|-------|----------------|---------|
| Phase 1: Backend Shape Generation | 6-8h | Extend `rebuildShapeUrlWithXYZ.test.ts` |
| Phase 2: API Endpoint | 2-3h | **CREATE**: `xmlid-endpoint.test.ts` |
| Phase 3: ImgShape Extension | 4-6h | Extend `ImgShape-CList-Integration.test.ts` (local adapter only) |
| Phase 4: Display Components | 6-8h | **CREATE**: `DisplayImage.test.ts`, `DisplayBanner.test.ts` |
| Phase 5: Hero.vue Refactor | 4-6h | **CREATE**: `selectHeroInstance.test.ts` |
| Phase 6: Demo & Testing | 3-4h | Manual QA via Demo view |

### 9.6 Test Registry Updates Required

After implementation, add to `docs/devdocs/TEST_REGISTRY.md`:

```markdown
### Unit Tests (`tests/unit/`)
| selectHeroInstance.test.ts | 2025-12-14-heroRefactor.md | ✅ ~15 tests |

### Component Tests (`tests/component/`)
| DisplayImage.test.ts | 2025-12-14-heroRefactor.md | ✅ ~20 tests |
| DisplayBanner.test.ts | 2025-12-14-heroRefactor.md | ✅ ~10 tests |

### Integration Tests (`tests/integration/`)
| xmlid-endpoint.test.ts | 2025-12-14-heroRefactor.md | ✅ ~8 tests |
```

---

## 10. Appendix: Code Locations

### Key Files to Modify

| File | Changes |
|------|---------|
| [src/components/images/ImgShape.vue](src/components/images/ImgShape.vue#L1-L654) | Add new shape types, dimension calculations |
| [src/components/Hero.vue](src/components/Hero.vue#L1-L400) | Refactor image selection logic |
| [server/adapters/base-adapter.ts](server/adapters/base-adapter.ts) | Add instance generation methods |
| [server/adapters/local-adapter.ts](server/adapters/local-adapter.ts) | Implement 2-loop architecture |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/display/DisplayImage.vue` | In-content image display |
| `src/components/display/DisplayBanner.vue` | Banner separator |
| `src/composables/useImageAdapter.ts` | Adapter logic extraction |
| `src/composables/useImageFetch.ts` | API fetching by xmlid |
| `src/views/Demo/DemoDisplayImage.vue` | Demo view |

---

## 11. Implementation Status

### ✅ Completed (December 14, 2025)

| Phase | Component | Status | Files Created/Modified |
|-------|-----------|--------|------------------------|
| Test Stubs | TDD preparation | ✅ Done | `tests/unit/selectHeroInstance.test.ts`, `tests/component/DisplayImage.test.ts`, `tests/component/DisplayBanner.test.ts`, `tests/integration/xmlid-endpoint.test.ts` |
| Phase 1 | Backend Shape Generation | ✅ Done | [server/adapters/local-adapter.ts](server/adapters/local-adapter.ts) - Added `INSTANCE_DIMENSIONS`, `generateInstances()`, `generateAllShapeVariants()` |
| Phase 2 | API Endpoint | ✅ Done | [server/api/images/xmlid/[xmlid].get.ts](server/api/images/xmlid/[xmlid].get.ts) - New endpoint |
| Phase 4 | Display Components | ✅ Done | [src/components/display/DisplayImage.vue](src/components/display/DisplayImage.vue), [src/components/display/DisplayBanner.vue](src/components/display/DisplayBanner.vue), [src/components/display/index.ts](src/components/display/index.ts) |
| Phase 5 | Hero Instance Selection | ✅ Done | [src/utils/selectHeroInstance.ts](src/utils/selectHeroInstance.ts), [src/components/Hero.vue](src/components/Hero.vue) - Refactored with instance-based selection |

### ⏳ Pending

| Phase | Component | Notes |
|-------|-----------|-------|
| Phase 3 | ImgShape.vue Extension | Not required for MVP - Display components bypass ImgShape |
| Phase 6 | Demo View | Create `DemoDisplayImage.vue` for testing |
| Testing | Remove `.skip` from tests | Once components verified working |

---

## 12. Next Steps

1. ✅ ~~Clarify open questions~~ - All answered
2. ✅ ~~Choose alternative~~ - Alternative A selected
3. ✅ ~~Define exact breakpoints~~ - Hero instance selection logic defined
4. ✅ ~~Database schema decision~~ - No DB storage, files only
5. ✅ ~~Cross-check with Test Registry~~ - Testing plan integrated
6. ✅ ~~Phase 1-2, 4-5 implementation~~ - Core implementation complete
7. **Next**: Create demo view for manual testing
8. **Next**: Remove `.skip` from test files and verify all tests pass

---

## 12. Deferred Tasks

### v0.8-DEFERRED
- [ ] Define logic for persisting instance special handling via `turl`/`tpar` fields on images table

### v1.0-DEFERRED  
- [ ] Review `display_thumb_banner` edge cases where Y-axis to X-axis translation produces suboptimal results
