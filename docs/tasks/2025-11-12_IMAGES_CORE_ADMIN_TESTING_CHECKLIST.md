# ImagesCoreAdmin Refactoring - Testing Checklist

**Date:** November 12, 2025  
**Status:** Phase 8 Task 8.1 - Integration Testing  
**Component:** `/src/views/admin/ImagesCoreAdmin.vue`

---

## Test Environment Setup

### Prerequisites:
- [ ] Database with test images loaded
- [ ] Images have various shapes configured (square, wide, vertical, thumb)
- [ ] Images have different adapters (Unsplash, Cloudinary, External)
- [ ] User has edit rights

### Automated Tests:
```bash
# Run ShapeEditor unit tests (14 tests)
pnpm test:unit -- shape-editor.test.ts

# Run integration tests (19 tests)
pnpm test:integration -- v2-imagesCore-shapeEditor.test.ts

# Run all tests
pnpm test
```

### Browser Testing:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

---

## Phase 2: ViewMode State Management

### Scenario 1: Browse → Core → Browse
**Steps:**
1. [ ] Start in Browse mode (no image selected)
2. [ ] Click on an image in the list
3. [ ] Verify Browse mode persists (image selected but not editing)
4. [ ] Click "Edit" button
5. [ ] Verify Core mode activated (Column 4 shows core editor)
6. [ ] Make NO changes
7. [ ] Click different image
8. [ ] Verify transitions back to Browse mode (no prompt)

**Expected:**
- ✅ Browse → Core transition smooth
- ✅ No edit behavior prompt (no changes made)
- ✅ Column 4 switches from ImageInformation to CoreEditor

---

### Scenario 2: Browse → Core → Save → Browse
**Steps:**
1. [ ] Start in Browse mode
2. [ ] Select an image, click "Edit"
3. [ ] Verify Core mode active
4. [ ] Change image name field
5. [ ] Verify isDirty = true (Save button enabled)
6. [ ] Click "Save Changes"
7. [ ] Verify save completes
8. [ ] Verify stays in Core mode after save
9. [ ] Click different image

**Expected:**
- ✅ isDirty detects name change
- ✅ Save button becomes active
- ✅ Save persists changes to database
- ✅ Stays in Core mode after save
- ✅ Changing image exits Core → Browse

---

### Scenario 3: Browse → Shape (direct via ImgShape click)
**Steps:**
1. [ ] Start in Browse mode with image selected
2. [ ] Click on any ImgShape in Column 2 (preview area)
3. [ ] Verify travels: Browse → Core → Shape (bypass)
4. [ ] Verify Column 4 shows ShapeEditor for that shape
5. [ ] Verify active shape indicator in topnav

**Expected:**
- ✅ Direct shape activation bypasses Core mode UI
- ✅ Internally travels through Core (sets up core state)
- ✅ Ends in Shape mode immediately
- ✅ ShapeEditor shows correct shape/adapter

---

### Scenario 4: Core → Shape → Core → Browse
**Steps:**
1. [ ] Enter Core mode (Edit button)
2. [ ] Click an ImgShape in preview area
3. [ ] Verify Shape mode activated
4. [ ] Make NO shape changes
5. [ ] Click "← Back" button
6. [ ] Verify returns to Core mode
7. [ ] Click different image
8. [ ] Verify returns to Browse mode

**Expected:**
- ✅ Core → Shape transition smooth
- ✅ Shape → Core back button works
- ✅ No shape dirty prompt (no changes)
- ✅ Core → Browse transition smooth

---

## Phase 5: Hero Preview Enhancement

### Scenario 5: Hero Preview Device Mockup Cycling
**Steps:**
1. [ ] Select an image with all shapes configured
2. [ ] Hero preview starts in Desktop mode (no frame)
3. [ ] Click on hero preview area
4. [ ] Verify cycles: Desktop → Mobile 50% → Mobile 100% → Tablet → Desktop
5. [ ] Verify Mobile 50% shows phone frame at half width
6. [ ] Verify Mobile 100% shows phone frame at full width
7. [ ] Verify Tablet mode shows landscape tablet frame
8. [ ] Verify Column 2 (vertical) HIDDEN in Tablet mode
9. [ ] Verify Column 2 VISIBLE in other modes
10. [ ] Verify dual badges show current mode and shape

**Expected:**
- ✅ Click cycles through 4 preview modes
- ✅ Phone mockup has notch, home indicator
- ✅ Tablet mockup is landscape orientation
- ✅ Column 2 conditional visibility works
- ✅ Badges update (blue=mode, green=shape)

---

### Scenario 6: Hero Preview Shape Selection
**Steps:**
1. [ ] Select image in Browse mode
2. [ ] Note current hero preview shape badge
3. [ ] Click on Wide ImgShape in preview area
4. [ ] Verify hero badge updates to "wide"
5. [ ] Click on Square ImgShape
6. [ ] Verify hero badge updates to "square"
7. [ ] Click on Vertical ImgShape
8. [ ] Verify hero badge updates to "vertical"
9. [ ] Click on Thumb ImgShape
10. [ ] Verify hero badge stays on last shape (thumb excluded from hero)

**Expected:**
- ✅ Hero preview updates when shapes activated
- ✅ Thumb shape does NOT appear in hero (128×128 too small)
- ✅ Hero retains last valid shape when thumb activated

---

## Phase 6: ShapeEditor Enhancement

### Scenario 7: ShapeEditor Direct Mode - All 8 Fields
**Steps:**
1. [ ] Activate any shape (enter Shape mode)
2. [ ] Switch ShapeEditor to "Direct" mode
3. [ ] Verify all 8 fields visible:
   - [ ] x (number input)
   - [ ] y (number input)
   - [ ] z (number input)
   - [ ] url (text input)
   - [ ] tpar (text input)
   - [ ] turl (text input)
   - [ ] json (button opens modal editor)
   - [ ] blur (text input)
4. [ ] Edit each field
5. [ ] Verify Preview button triggers preview
6. [ ] Verify Reset button clears XYZ values

**Expected:**
- ✅ Direct mode exposes all 8 database fields
- ✅ JSON editor modal has validation
- ✅ Preview updates ImgShape live
- ✅ Reset clears XYZ only (keeps url/tpar/etc)

---

### Scenario 8: ShapeEditor getCurrentData() Method
**Steps:**
1. [ ] Activate a shape
2. [ ] Open browser console
3. [ ] Access ShapeEditor via ref (developer testing)
4. [ ] Verify `getCurrentData()` returns object with 8 fields
5. [ ] Verify field values match current editor state

**Expected:**
- ✅ Method exposed via defineExpose
- ✅ Returns: { x, y, z, url, tpar, turl, json, blur }
- ✅ Values match props.data

---

## Phase 7: Dirty Detection System

### Scenario 9: Core isDirty Detection
**Steps:**
1. [ ] Enter Core mode
2. [ ] Verify topnav shows "No changes"
3. [ ] Change status dropdown
4. [ ] Verify "Save Changes" / "Cancel" buttons appear
5. [ ] Change name field
6. [ ] Verify buttons remain visible
7. [ ] Click "Cancel"
8. [ ] Verify original values restored
9. [ ] Verify buttons hidden ("No changes" returns)

**Expected:**
- ✅ checkDirty() triggers on all field changes
- ✅ isDirty compares: status, name, alt_text, xmlid, url, ctags, rtags, author
- ✅ Cancel restores originalImage
- ✅ UI updates immediately

---

### Scenario 10: Shape isDirty Detection
**Steps:**
1. [ ] Enter Shape mode for any shape
2. [ ] Verify topnav shows "No changes"
3. [ ] Change X value in ShapeEditor
4. [ ] Verify "Save Changes" / "Cancel" buttons appear
5. [ ] Change URL field
6. [ ] Verify buttons remain visible
7. [ ] Click "Cancel"
8. [ ] Verify original XYZ/URL restored
9. [ ] Verify ImgShape preview resets
10. [ ] Verify buttons hidden ("No changes" returns)

**Expected:**
- ✅ shapeIsDirty compares all 8 fields
- ✅ originalShapeData stored on enterShapeMode()
- ✅ Cancel restores XYZ + other fields
- ✅ ImgShape.resetPreview() called

---

### Scenario 11: Edit Behavior - Autosave
**Steps:**
1. [ ] Open Settings menu (gear icon)
2. [ ] Set "Edit Behavior" to "Auto-save"
3. [ ] Enter Core mode, make changes (isDirty = true)
4. [ ] Click different image (trigger exit)
5. [ ] Verify NO prompt shown
6. [ ] Verify changes automatically saved
7. [ ] Enter Shape mode, make changes (shapeIsDirty = true)
8. [ ] Click "← Back" button (trigger exit)
9. [ ] Verify NO prompt shown
10. [ ] Verify shape changes automatically saved

**Expected:**
- ✅ Setting persists to localStorage
- ✅ handleCoreExit() auto-saves
- ✅ handleShapeExit() auto-saves
- ✅ No user prompts

---

### Scenario 12: Edit Behavior - Autocancel
**Steps:**
1. [ ] Open Settings menu
2. [ ] Set "Edit Behavior" to "Auto-cancel"
3. [ ] Enter Core mode, make changes
4. [ ] Click different image
5. [ ] Verify NO prompt shown
6. [ ] Verify changes automatically cancelled (original restored)
7. [ ] Enter Shape mode, make changes
8. [ ] Click "← Back"
9. [ ] Verify changes automatically cancelled

**Expected:**
- ✅ Setting persists to localStorage
- ✅ handleCoreExit() auto-cancels
- ✅ handleShapeExit() auto-cancels
- ✅ Original values restored

---

### Scenario 13: Edit Behavior - Prompt
**Steps:**
1. [ ] Open Settings menu
2. [ ] Set "Edit Behavior" to "Prompt"
3. [ ] Enter Core mode, make changes
4. [ ] Click different image
5. [ ] Verify prompt: "Save changes before exiting?"
6. [ ] Click "OK" (save)
7. [ ] Verify changes saved
8. [ ] Enter Core mode again, make changes
9. [ ] Click different image
10. [ ] Verify prompt again
11. [ ] Click "Cancel" (don't save)
12. [ ] Verify original values restored

**Expected:**
- ✅ Browser confirm() dialog appears
- ✅ OK → saves changes
- ✅ Cancel → discards changes
- ✅ Works for both core and shape modes

---

## Data Flow Validation

### Scenario 14: Facade Field Binding
**Steps:**
1. [ ] Select an image with shape_square configured
2. [ ] Verify Column 2 displays square ImgShape
3. [ ] Check that ImgShape receives `img_square` data (facade field)
4. [ ] Enter Shape mode for square
5. [ ] Verify ShapeEditor receives `shape_square` data (composite type)
6. [ ] Change square XYZ values
7. [ ] Save changes
8. [ ] Verify database `shape_square` updated
9. [ ] Verify `img_square` auto-updated by trigger
10. [ ] Verify ImgShape displays new transformed URL

**Expected:**
- ✅ ImgShape reads facade fields (img_*)
- ✅ ShapeEditor edits composite types (shape_*)
- ✅ Database trigger updates facade from composite
- ✅ No data binding conflicts

---

### Scenario 15: Multiple Shape Isolation
**Steps:**
1. [ ] Select image with all 4 shapes
2. [ ] Activate Wide shape, change X=30
3. [ ] Activate Square shape, change X=70
4. [ ] Return to Wide shape
5. [ ] Verify X still = 30 (isolated state)
6. [ ] Return to Square shape
7. [ ] Verify X = 70 (isolated state)

**Expected:**
- ✅ Each shape maintains separate XYZ state
- ✅ wideX, squareX, verticalX, thumbX refs independent
- ✅ No cross-contamination

---

## Edge Cases

### Scenario 16: Rapid Mode Switching
**Steps:**
1. [ ] Browse → Core (fast)
2. [ ] Core → Shape (fast)
3. [ ] Shape → Core (fast)
4. [ ] Core → Browse (fast)
5. [ ] Verify no state corruption
6. [ ] Verify UI updates correctly
7. [ ] Verify no memory leaks (check console)

**Expected:**
- ✅ ViewMode transitions handle rapid changes
- ✅ No race conditions
- ✅ No console errors

---

### Scenario 17: Invalid Shape Data
**Steps:**
1. [ ] Select image with NULL shape_wide
2. [ ] Try to activate wide shape
3. [ ] Verify graceful handling (no crash)
4. [ ] Enter Shape mode anyway
5. [ ] Verify ShapeEditor shows empty/default values

**Expected:**
- ✅ NULL shape data doesn't crash
- ✅ ShapeEditor handles missing data
- ✅ User can configure shape from scratch

---

### Scenario 18: Network Failure on Save
**Steps:**
1. [ ] Open browser DevTools → Network tab
2. [ ] Set network to Offline mode
3. [ ] Make changes in Core mode
4. [ ] Try to save
5. [ ] Verify error handling (console log or alert)
6. [ ] Verify isDirty remains true
7. [ ] Re-enable network
8. [ ] Save again
9. [ ] Verify save succeeds

**Expected:**
- ✅ Network errors don't corrupt state
- ✅ User can retry save
- ✅ isDirty flag persists

---

## Performance

### Scenario 19: Large Dataset (100+ Images)
**Steps:**
1. [ ] Load workspace with 100+ images
2. [ ] Scroll through image list
3. [ ] Verify smooth scrolling (no lag)
4. [ ] Select image near end of list
5. [ ] Verify quick load
6. [ ] Switch between images rapidly
7. [ ] Verify no memory leaks

**Expected:**
- ✅ List virtualization (if implemented)
- ✅ No noticeable lag
- ✅ Memory usage stable

---

### Scenario 20: Hero Preview Performance
**Steps:**
1. [ ] Select image with large resolution
2. [ ] Cycle through device mockup modes rapidly
3. [ ] Verify smooth transitions
4. [ ] Check browser performance metrics
5. [ ] Verify images load efficiently

**Expected:**
- ✅ Mockup transitions smooth (< 100ms)
- ✅ Images cached properly
- ✅ No layout thrashing

---

## Accessibility

### Scenario 21: Keyboard Navigation
**Steps:**
1. [ ] Tab through all focusable elements
2. [ ] Verify tab order makes sense
3. [ ] Press Enter on "Edit" button
4. [ ] Press Escape (should cancel/close?)
5. [ ] Tab through ShapeEditor fields
6. [ ] Verify all inputs keyboard accessible

**Expected:**
- ✅ Logical tab order
- ✅ All buttons keyboard accessible
- ✅ Focus indicators visible

---

## Success Criteria Summary

### Critical (Must Pass):
- [ ] All ViewMode transitions work correctly
- [ ] Core isDirty detection complete
- [ ] Shape isDirty detection complete
- [ ] All 3 edit behaviors functional
- [ ] Facade vs composite field binding correct
- [ ] No data corruption or state leaks
- [ ] Hero preview device mockups work
- [ ] ShapeEditor direct mode shows all 8 fields

### Important (Should Pass):
- [ ] Performance acceptable (< 100 images)
- [ ] Error handling graceful
- [ ] UI updates immediately
- [ ] No console errors during normal use

### Nice to Have:
- [ ] Keyboard shortcuts work
- [ ] Accessibility guidelines met
- [ ] Performance excellent (> 100 images)

---

## Testing Sign-off

**Tested By:** _________________  
**Date:** _________________  
**Pass/Fail:** _________________  
**Notes:**

---

**Ready for Production:** [ ] YES [ ] NO

**Blockers:**
- 
- 
- 

**Follow-up Tasks:**
- 
- 
- 
