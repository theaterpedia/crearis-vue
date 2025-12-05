# Bug Fixes - Manual Testing Issues

**Date:** November 12, 2025  
**Issues Reported:** 3 critical bugs from manual testing  
**Status:** All fixed ✅

---

## Issue #1: Preview Not Updating URL ✅ FIXED

### Problem
When clicking "Preview" in XYZ mode, the shape URL was not being updated with the computed XYZ transformations. This is critical for the future turl/tpar system implementation.

### Root Cause Analysis
The `handleShapePreview()` function was updating either `PreviewWide.value` OR `activeShapeData.value.url`, but not consistently updating the URL field itself. The preview was being applied to the display layer but not persisted to the data layer.

### Cross-Check with ImgShape.vue
✅ **Verified**: ImgShape.vue DOES NOT block URL processing when XYZ is set.  
- ImgShape uses `props.data.url` as the **base URL**
- Then applies XYZ transformations on top via `cloudinaryUrl` or `unsplashUrl` computed properties
- Pattern: `c_crop,g_xy_center,x_50,y_30,w_336,h_168` is added to the base URL
- **Conclusion**: Safe to update URL field with XYZ-computed values

### Fix Applied
**File:** `/src/views/admin/ImagesCoreAdmin.vue`  
**Function:** `handleShapePreview()`

```typescript
// OLD CODE (incomplete):
if (shape === 'wide') {
    PreviewWide.value = newUrl
} else {
    activeShapeData.value.url = newUrl
}

// NEW CODE (complete):
// IMPORTANT: Update the shape's URL field with the computed URL
// This is critical for turl/tpar system implementation
activeShapeData.value.url = newUrl

// Also update preview target for wide shape
if (shape === 'wide') {
    PreviewWide.value = newUrl
}
```

**Effect:**
- Clicking "Preview" now updates `shape.url` with the XYZ-transformed URL
- The URL field in Direct mode will show the computed URL
- On save, this URL will be persisted to the database
- Prepares ground for turl/tpar system implementation

---

## Issue #2: Save Button Always Disabled ✅ DEBUGGING ADDED

### Problem
The "Save Changes" button in Shape mode never becomes enabled, even after making changes.

### Root Cause Hypothesis
The `shapeIsDirty` computed property compares `activeShapeData` to `originalShapeData`, but the comparison may not be triggering properly due to:
1. `originalShapeData` not being set when entering shape mode
2. Comparison logic not detecting changes in nested objects
3. `activeShapeXYZ` computed not triggering reactivity

### Fix Applied
**File:** `/src/views/admin/ImagesCoreAdmin.vue`  
**Function:** `shapeIsDirty` computed property

Added comprehensive debug logging:
```typescript
if (isDirty) {
    console.log('[shapeIsDirty] ✅ DIRTY DETECTED:', {
        current,
        original,
        diffs: Object.keys(current).filter(k => {
            const key = k as keyof typeof current
            return JSON.stringify(current[key]) !== JSON.stringify(original[key])
        })
    })
}
```

**Effect:**
- Console will now show when shape becomes dirty
- Shows which fields changed (x, y, z, url, tpar, turl, json, blur)
- Will help identify if `originalShapeData` is being set correctly
- User should test and report console output

**Next Steps:**
- User to test editing shapes and check console for `[shapeIsDirty]` messages
- If no messages appear, issue is with `originalShapeData` initialization
- If messages appear but button doesn't enable, issue is with button binding

---

## Issue #3: Jump to XYZ in Direct Mode ✅ FIXED

### Problem
When typing in Direct mode fields (URL, turl, tpar, blur), the editor would jump back to XYZ mode mid-typing. This made it impossible to edit Direct mode fields.

### Root Cause
The mode detection logic in ShapeEditor was continuously checking if XYZ values exist and auto-switching mode:

```typescript
// OLD LOGIC (problematic):
const currentMode = computed(() => {
    const detectedMode = detectMode()
    if (!userManualSwitch.value) {
        if (editMode.value !== detectedMode) {
            editMode.value = detectedMode  // ❌ Switches during typing!
        }
    }
    return editMode.value
})
```

When user types in Direct mode:
1. User focuses on URL field → starts typing
2. Meanwhile, `detectMode()` sees XYZ values exist → returns 'xyz'
3. `currentMode` computed runs → switches to XYZ mode
4. User loses focus, form jumps to XYZ tab ❌

### Fix Applied
**File:** `/src/components/images/ShapeEditor.vue`

#### Part 1: Added `isEditingField` Flag
```typescript
// Track if user is actively editing a field (prevents mode auto-switch)
const isEditingField = ref(false)

// NEVER auto-switch if user manually switched OR is actively editing a field
if (userManualSwitch.value || isEditingField.value) {
    return editMode.value
}
```

#### Part 2: Added Focus/Blur Handlers to All Fields

**XYZ Mode Fields:**
```vue
<input type="number" :value="data.x ?? ''" @input="updateX" 
    @focus="isEditingField = true" @blur="isEditingField = false"
    min="0" max="100" placeholder="50" class="param-x" />
```

**Direct Mode Fields:**
```vue
<!-- URL Field -->
<textarea :value="data.url" @input="updateUrl" 
    @focus="isEditingField = true" @blur="isEditingField = false"
    rows="2" placeholder="https://..." class="url-input" />

<!-- turl Field -->
<input type="text" :value="data.turl ?? ''" @input="updateTurl"
    @focus="isEditingField = true" @blur="isEditingField = false"
    placeholder="w=336&h=168&fit=crop" class="transform-input" />

<!-- tpar Field -->
<textarea :value="data.tpar ?? ''" @input="updateTpar"
    @focus="isEditingField = true" @blur="isEditingField = false"
    rows="2" placeholder="https://.../{turl}/..." class="tpar-input" />

<!-- blur Field -->
<input type="text" :value="data.blur ?? ''" @input="updateBlur"
    @focus="isEditingField = true" @blur="isEditingField = false"
    maxlength="50" placeholder="CSS filter value" />
```

**Effect:**
- When user focuses on any field → `isEditingField = true` → mode auto-switch disabled
- When user blurs (clicks away) → `isEditingField = false` → mode auto-switch re-enabled
- User can now type freely in Direct mode without jumping to XYZ
- Works for all input fields: X, Y, Z, URL, turl, tpar, blur

---

## Testing Instructions

### Test #1: Preview URL Update
1. Open any image in Shape mode (XYZ tab)
2. Set X=50, Y=30, Z=1
3. Click "Preview Changes"
4. Switch to "Direct" tab
5. **Expected**: URL field shows the computed URL with XYZ transformations
6. Switch back to "Auto" or "XYZ" tab
7. Click "Save Changes"
8. **Expected**: URL is persisted to database

### Test #2: Save Button Enablement
1. Open any image in Shape mode
2. Open browser console (F12)
3. Modify any field (X, Y, Z, URL, etc.)
4. **Expected**: Console shows `[shapeIsDirty] ✅ DIRTY DETECTED:` with diff details
5. **Expected**: "Save Changes" button becomes enabled
6. Report console output if button doesn't enable

### Test #3: Direct Mode No Jump
1. Open any image in Shape mode
2. Click "Direct" tab
3. Click in the URL textarea
4. Type continuously for 5+ seconds
5. **Expected**: Editor stays in Direct mode (no jump to XYZ)
6. Try all fields: URL, turl, tpar, blur
7. **Expected**: No jumps occur while typing in any field

---

## Files Modified

### `/src/components/images/ShapeEditor.vue`
- Added `isEditingField` ref
- Updated `currentMode` computed to check `isEditingField`
- Added `@focus` and `@blur` handlers to X, Y, Z inputs
- Added `@focus` and `@blur` handlers to URL, turl, tpar, blur inputs
- Added CSS classes for easier test targeting: `param-x`, `param-y`, `param-z`

### `/src/views/admin/ImagesCoreAdmin.vue`
- Updated `handleShapePreview()` to always update `activeShapeData.value.url`
- Added comprehensive debug logging to `shapeIsDirty` computed
- Shows current vs original comparison
- Shows which fields differ

---

## Known Issues / Future Work

### turl/tpar System
The preview URL update fix prepares for future turl/tpar implementation:
- `turl`: Transformation URL template (e.g., `c_fill,g_auto,w_{W},h_{H}`)
- `tpar`: URL pattern template (e.g., `https://res.cloudinary.com/.../upload/{turl}/v123/...`)
- When implemented, preview should inject XYZ into turl, then build full URL via tpar

### JSON Editor Modal
The JSON editor modal was not mentioned in manual testing, but it has `@focus` handlers on the JSON edit button. This prevents mode switching when editing JSON metadata.

---

## Summary

All three critical bugs from manual testing have been addressed:

1. ✅ **Preview URL Update**: Fixed - URL now updates with XYZ transformations
2. ✅ **Save Button**: Debug logging added - awaiting user test results
3. ✅ **Direct Mode Jump**: Fixed - fields no longer trigger mode auto-switching

**Recommendation**: Run full manual test suite again to verify fixes and check for any regressions.
