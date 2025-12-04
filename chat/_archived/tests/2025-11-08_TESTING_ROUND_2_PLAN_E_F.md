# Testing Round 2: Plans E + F Verification

**Date**: November 8, 2025  
**Status**: Ready for Testing  
**Related**: Plan D (ImgShape), Plan E (ImageAdmin), Plan F (Hero), Plan G (Tests)

---

## 📊 What Was Completed

### Plan E: ImagesCoreAdmin UI Refinements ✅
**Commit**: `5edcf1a` - "feat(plan-e): Complete ImagesCoreAdmin UI refinements"

**Changes**:
1. **Header Layout**:
   - Hero preview column: `2/5` → `fill` width (responsive)
   - Vertical column: Exact width calculation (already implemented)
   - Controls column: Simplified placeholder

2. **Aside Cleanup**:
   - ❌ Removed old shape editing controls (~90 lines deleted):
     - Author Adapter Tabs
     - Root URL textarea
     - Shape Tabs (Square/Wide/Vertical/Thumb)
     - JSON row, Params XYZ inputs, URL textarea
   - ✅ Kept clean structure:
     - Save/Delete buttons
     - ShapeEditor (Plan D integration)
     - Editable fields (Status, Name, Alt Text, XML ID)
     - CTags section

3. **Import Modal**:
   - Moved inside Data menu dropdown structure
   - Uses floating-vue positioning (appears below trigger button)

### Plan F: Hero Component Integration ✅
**Commit**: `63de164` - "feat(plan-f): Hero image system integration" *(Already complete)*

**Features**:
- Image prop with shape system (shape_vertical, shape_wide, shape_square)
- Mobile breakpoint: 416px (MOBILE_WIDTH_PX)
- Adapter detection (Unsplash, Cloudinary, Vimeo, external)
- Responsive URL building
- BlurHash support (32×32 placeholder)
- Progressive loading: vertical (mobile) → wide (desktop)
- Template URL optimization (tpar+turl)

### Plan G: Test Coverage ✅
**Commit**: `2dfb12c` - "test(plan-g): Add ShapeEditor & ImageAdmin integration tests"

**Test Files**:
- `tests/unit/imgshape-core.test.ts` - 22/22 passing (100%)
- `tests/unit/shape-editor.test.ts` - 20/20 passing (100%)
- `tests/integration/imageadmin-shapeeditor.test.ts` - 13 tests created

**Total**: 42/42 unit tests passing

---

## 🧪 Testing Checklist

### 1. ImagesCoreAdmin Component Tests

#### A. Import Modal Positioning
- [ ] Click "Data" menu in topnav
- [ ] Click "Import Images"
- [ ] **Expected**: Modal appears as dropdown below Data menu button
- [ ] **Expected**: Modal is properly positioned, not at bottom of screen
- [ ] Import some images and verify it works

#### B. Hero Preview Column
- [ ] Open ImagesCoreAdmin
- [ ] Select an image
- [ ] **Expected**: Hero preview in header fills most of the width
- [ ] **Expected**: Vertical column has exact width (no extra spacing)
- [ ] Click hero preview to cycle shapes (wide → square → vertical)
- [ ] **Expected**: Shape toggles correctly with visual indicator

#### C. Shape Editing via ShapeEditor
- [ ] Click on any ImgShape in the preview area
- [ ] **Expected**: Shape highlights, ShapeEditor appears in aside
- [ ] **Expected**: ShapeEditor shows correct shape and adapter
- [ ] Modify XYZ values in ShapeEditor
- [ ] Click "Preview with XYZ"
- [ ] **Expected**: ImgShape updates in real-time
- [ ] Click "Reset"
- [ ] **Expected**: XYZ values cleared, preview resets

#### D. Aside Structure
- [ ] Open aside panel (right side)
- [ ] **Expected**: Only these sections visible:
   1. Save/Delete buttons (top)
   2. ShapeEditor (when shape active)
   3. Editable fields (Status, Name, Alt Text, XML ID)
   4. CTags section (Age Group, Subject Type, Access Level, Quality)
- [ ] **Expected**: NO old shape controls (Author Adapter, Shape Tabs, URL textarea, etc.)

#### E. State Management
- [ ] Edit shape XYZ for wide shape
- [ ] Switch to square shape
- [ ] **Expected**: Different XYZ values (separate state)
- [ ] Switch back to wide shape
- [ ] **Expected**: Original wide XYZ values preserved
- [ ] Load different image
- [ ] **Expected**: ShapeEditor closes, XYZ state cleared

### 2. Hero Component Tests

#### A. Responsive Image Loading
- [ ] Open a page with Hero component
- [ ] **Expected**: Blurs placeholder shows first
- [ ] **Expected**: Image loads progressively
- [ ] Resize browser to mobile width (<416px)
- [ ] **Expected**: Vertical shape loads (taller aspect)
- [ ] Resize back to desktop
- [ ] **Expected**: Wide shape loads (wider aspect)

#### B. Adapter Detection
- [ ] Test with Unsplash image
- [ ] **Expected**: URL includes `images.unsplash.com`
- [ ] **Expected**: Proper transformation parameters
- [ ] Test with Cloudinary image
- [ ] **Expected**: URL includes `res.cloudinary.com`
- [ ] **Expected**: Proper transformation format

#### C. BlurHash
- [ ] Slow down network (DevTools throttling)
- [ ] Load page with Hero
- [ ] **Expected**: BlurHash placeholder visible immediately
- [ ] **Expected**: Smooth transition when real image loads

### 3. Integration Tests

#### A. Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Expected results:
# ✓ ImgShape: 22/22 passing
# ✓ ShapeEditor: 20/20 passing
# ✓ Total: 42/42 passing
```

#### B. Integration Tests
```bash
# Run integration tests
npm run test:unit tests/integration/imageadmin-shapeeditor.test.ts

# Expected: Tests should pass or show clear workflow verification
```

### 4. Cross-Browser Testing
- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile browsers: Responsive loading works

---

## 🐛 Known Issues to Watch For

### Potential Problems

1. **Import Modal Positioning**:
   - May not position correctly if floating-vue config is wrong
   - Check console for floating-vue errors

2. **ShapeEditor State**:
   - XYZ values might not persist when switching shapes
   - Preview might not update in real-time

3. **Hero Component**:
   - Image might not switch between vertical/wide on resize
   - BlurHash might not render properly

4. **Performance**:
   - Multiple rapid shape switches might cause UI lag
   - Import modal might not close smoothly

---

## 🔍 Debugging Tips

### If Import Modal Doesn't Position Correctly
1. Check browser console for floating-vue errors
2. Verify `cimgImport` is inside `menu-dropdown` div
3. Check CSS z-index conflicts

### If ShapeEditor Doesn't Update Preview
1. Check browser console for ImgShape errors
2. Verify `updatePreview()` method is being called
3. Check that `activeShapeXYZ` computed property returns correct values

### If Hero Images Don't Load
1. Check Network tab for image requests
2. Verify adapter detection is working (console logs)
3. Check that shape_vertical and shape_wide are present in image data

---

## ✅ Success Criteria

All tests pass when:

1. **Import modal** positions as dropdown below Data menu trigger
2. **Hero preview** fills column width appropriately
3. **ShapeEditor** shows when clicking ImgShape and updates preview in real-time
4. **Aside** has clean structure with NO old shape controls
5. **Hero component** loads images responsively with BlurHash
6. **Unit tests** run successfully (42/42 passing)
7. **No console errors** in browser DevTools

---

## 📝 Next Steps After Testing

If all tests pass:
1. ✅ Plans E + F verified and stable
2. ✅ Ready to proceed with additional features
3. ✅ Foundation solid for future enhancements

If issues found:
1. Document specific problems in GitHub issues
2. Prioritize critical bugs
3. Create hotfix branch if needed

---

**Testing Lead**: [Name]  
**Testing Date**: November 8, 2025  
**Estimated Time**: 1-2 hours for comprehensive testing
