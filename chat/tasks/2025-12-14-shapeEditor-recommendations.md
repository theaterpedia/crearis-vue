# ShapeEditor Future Recommendations
**Date:** December 14, 2025  
**Status:** Deferred - Not in current sprint scope

---

## Context

During the Hero.vue refactor planning, we identified potential ShapeEditor enhancements that are **out of scope** for the current implementation but worth documenting for future consideration.

---

## Recommendation 1: Custom XYZ Warning for Shape Instances

### Problem
When a template shape (e.g., `shape_wide`) has custom XYZ values set, the derived instances (`display_wide`, `hero_wide_xl`, etc.) inherit these values. However, the instance generation logic may not fully support complex XYZ transformations.

### Proposed Solution
Add a visual warning in ShapeEditor when viewing shape-instances:

```vue
<!-- In ShapeEditor.vue -->
<div v-if="isShapeInstance && hasCustomXYZ" class="instance-warning">
  ⚠️ Shape-instances do not support custom XYZ yet
</div>
```

### Implementation Notes
- `isShapeInstance`: Check if shape name starts with `display_` or `hero_`
- `hasCustomXYZ`: Check if `x !== null || y !== null || z !== null`
- Warning should be informational, not blocking

### Files to Modify
- `src/components/images/ShapeEditor.vue`
- `tests/unit/shape-editor.test.ts` (add warning test)

### Estimated Effort
~2 hours

---

## Recommendation 2: Instance Preview in ShapeEditor

### Problem
ShapeEditor currently only shows the 4 template shapes. Users cannot preview how their XYZ adjustments will affect derived instances.

### Proposed Solution
Add an expandable "Instance Preview" panel showing thumbnails of all derived instances:

```
┌─────────────────────────────────────┐
│ Shape: wide                    [▼]  │
├─────────────────────────────────────┤
│ [Instance Preview]                  │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │disp │ │hero │ │hero │            │
│ │wide │ │wide │ │xl   │            │
│ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────┘
```

### Estimated Effort
~4-6 hours

---

## Recommendation 3: Hero Device Mockup Enhancement

### Problem
The existing `v2-imagesCore-shapeEditor.test.ts` has a `Hero Preview with Device Mockups` describe block. This could be enhanced to show actual hero instance selection based on device size.

### Proposed Solution
- Show which `hero_*` instance would be selected for each device mockup
- Indicate `heightTmp` influence on selection

### Estimated Effort
~3-4 hours

---

## Priority Assessment

| Recommendation | Priority | Dependencies |
|----------------|----------|--------------|
| Custom XYZ Warning | Medium | After instances implemented |
| Instance Preview | Low | After warning implemented |
| Hero Device Mockup | Low | After Hero.vue refactor complete |

---

## Related Files

- `src/components/images/ShapeEditor.vue`
- `tests/unit/shape-editor.test.ts`
- `tests/integration/v2-imagesCore-shapeEditor.test.ts`
- `src/views/admin/ImagesCoreAdmin.vue`

---

## Notes

These recommendations are intentionally deferred to keep the current sprint focused on:
1. Backend shape instance generation
2. Display components (DisplayImage, DisplayBanner)
3. Hero.vue responsive instance selection

Revisit after v0.8 release.
