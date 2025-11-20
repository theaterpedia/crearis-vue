# Local Image Adapter - Testing Guide

## Overview

This guide provides automated and manual testing procedures for the complete local image adapter system, including the new import stepper and image browser components.

---

## Prerequisites

### Required Setup
1. **Server Running:** `npm run dev` on `localhost:3000`
2. **Database:** Initialized with at least one project (e.g., "theaterpedia")
3. **Authentication:** Valid user session (project or base role)
4. **Test Images:** Downloaded sample images for upload testing
5. **Storage Directory:** `.local_images/` created (auto-created on first upload)

### Environment Variables
```env
LOCAL_IMAGE_STORAGE=./.local_images  # Development
# or
LOCAL_IMAGE_STORAGE=/opt/crearis/images  # Production
```

---

## Automated Testing

### Test Script: `test-local-adapter-complete.sh`

**Purpose:** Tests the complete local adapter flow from upload to deletion.

**Usage:**
```bash
# Using default test image
./test-local-adapter-complete.sh

# Using specific test image
./test-local-adapter-complete.sh path/to/image.jpg

# Using downloaded sample
./test-local-adapter-complete.sh test-image-download.jpg
```

**Test Coverage:**

**Phase 1 - Core Upload & Storage (3 tests)**
1. Upload image via `/api/images/upload` endpoint
2. Verify source file exists in `.local_images/source/`
3. Verify source URL is accessible via HTTP

**Phase 2 - Shape Generation (4 tests)**
4. Verify `square` shape URL (128×128)
5. Verify `thumb` shape URL (64×64)
6. Verify `wide` shape URL (336×168)
7. Verify `vertical` shape URL (126×224)

**Phase 3 - Database Integration (3 tests)**
8. Verify database record exists with correct XMLID
9. Verify author composite contains correct data
10. Verify project association is correct

**Phase 4 - Image List API (2 tests)**
11. GET `/api/images` returns array
12. GET `/api/images?project={id}` filters correctly

**Phase 5 - Shape Regeneration (1 test)**
13. POST `/api/images/{id}/regenerate-shapes` with XYZ params

**Phase 6 - Cleanup (2 tests)**
14. DELETE `/api/images/{id}` succeeds
15. Verify image returns 404 after deletion

**Expected Output:**
```
═══════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════

Total Tests: 15
Passed: 15
Failed: 0

╔════════════════════════════════════════════════════════╗
║  ✓ ALL TESTS PASSED                                   ║
╚════════════════════════════════════════════════════════╝
```

**Troubleshooting:**
- **Server not accessible:** Ensure `npm run dev` is running
- **Upload fails:** Check `.local_images/` directory permissions
- **Shape URLs fail:** Verify Sharp is installed (`npm list sharp`)
- **Database fails:** Check database connection and migrations
- **Delete fails:** Verify user has permission to delete images

---

## Manual Testing

### 🧪 **Test Suite 1: Project Stepper - Image Import**

**Objective:** Test the cimgImportStepper component in a new project workflow.

#### **Step 1: Login as Project User**
1. Navigate to `http://localhost:3000/login`
2. Login with credentials that have `role: project` and assigned `projectId`
3. Verify redirect to `/projects` route

**Expected Result:** ✅ You see the project stepper interface

---

#### **Step 2: Navigate to Images Step**
1. If on Events/Posts step, click "Next" to advance
2. Continue until you reach the "Images" step
3. Observe the 2-column layout:
   - Left: Empty state with icon and message
   - Right: cimgImportStepper panel

**Expected Result:** ✅ Empty state shows "No images yet" with guidance text

---

#### **Step 3: Test File Drop (Drag & Drop)**
1. In the right panel, locate the file drop zone
2. Drag `test-image-download.jpg` from file explorer
3. Drop onto the drop zone area

**Expected Result:** 
- ✅ Drop zone highlights on hover
- ✅ File appears in preview grid after drop
- ✅ Preview shows thumbnail
- ✅ XMLID auto-generated: `{project}.image.scene-{filename}_{timestamp}`

---

#### **Step 4: Test File Browse (Click)**
1. Click "Browse Files" button in drop zone
2. Select 2-3 image files from dialog
3. Click "Open"

**Expected Result:**
- ✅ File dialog opens
- ✅ Multiple files can be selected
- ✅ All files appear in preview grid
- ✅ Each has unique timestamp in XMLID

---

#### **Step 5: Test File Validation**
1. Try uploading a PDF or TXT file
2. Try uploading a very large file (>20MB)

**Expected Result:**
- ✅ Invalid file types are rejected (console warning)
- ✅ Files >20MB are rejected (console warning)
- ✅ Only valid images (JPEG/PNG/WebP) appear in preview

---

#### **Step 6: Refine Image Metadata**
1. Click on one of the preview images
2. Refine modal opens showing:
   - Large preview of image
   - XMLID field (editable)
   - Author name field (pre-filled with username)
   - Author URI field
   - Alt text field
   - Age group dropdown (default: "adult")
   - Topic field (default: "scene")
3. Modify the XMLID to: `{project}.image.scene-testedit_{timestamp}`
4. Add alt text: "Test image for manual testing"
5. Click "Save Changes"

**Expected Result:**
- ✅ Modal opens with all fields populated
- ✅ Changes are saved
- ✅ Preview card shows updated XMLID
- ✅ Modal closes

---

#### **Step 7: Remove Image from Preview**
1. Hover over a preview image
2. Click the small "X" button in top-right corner
3. Confirm if prompted

**Expected Result:**
- ✅ Delete button appears on hover
- ✅ Image is removed from preview grid
- ✅ Other images remain

---

#### **Step 8: Import Images**
1. Ensure 2-3 images are in preview grid
2. Click "Import {n} Images" button at bottom
3. Wait for upload to complete

**Expected Result:**
- ✅ Button shows "Importing..." with spinner
- ✅ Upload completes successfully
- ✅ Success message appears
- ✅ Preview grid clears
- ✅ Left panel (gallery) now shows imported images

---

#### **Step 9: View Imported Images in Gallery**
1. Observe left panel gallery
2. Note the image cards showing:
   - Thumbnail
   - XMLID
   - Author name

**Expected Result:**
- ✅ All imported images appear in left gallery
- ✅ Cards display correctly with metadata
- ✅ Hover shows delete button

---

#### **Step 10: Preview Image from Gallery**
1. Click on an image card in the left gallery
2. ImagePreviewModal opens
3. Observe:
   - Large image display (up to 800px wide)
   - XMLID
   - Author
   - Owner (user ID)
   - Project (domaincode)
   - Sysreg tag (e.g., "Adult / Other")
   - Alt text

**Expected Result:**
- ✅ Modal opens with image
- ✅ All metadata fields populated correctly
- ✅ Image scales properly (max 800px)

---

### 🧪 **Test Suite 2: Project Dashboard - Image Management**

**Objective:** Test image management in existing project context.

#### **Step 1: Switch to Navigation Mode**
1. Complete the stepper or manually navigate to dashboard
2. Click "Images" tab in left navigation
3. View switches to navigation mode (no stepper)

**Expected Result:**
- ✅ Images tab is visible in navigation
- ✅ Same 2-column layout appears
- ✅ No "Next" button (navigation mode)

---

#### **Step 2: Upload Additional Images**
1. Use right panel to upload 1-2 more images
2. Follow same drop/browse workflow
3. Click "Import"

**Expected Result:**
- ✅ Upload works same as stepper mode
- ✅ Gallery refreshes automatically after import
- ✅ New images appear in left gallery

---

#### **Step 3: Delete Image from Gallery**
1. Hover over an image card in left gallery
2. Click delete button (appears on hover)
3. Confirm deletion in dialog

**Expected Result:**
- ✅ Delete button appears on hover
- ✅ Confirmation dialog appears
- ✅ Image is removed from gallery after confirmation
- ✅ API DELETE request succeeds

---

### 🧪 **Test Suite 3: Image Browser (Full-Page)**

**Objective:** Test the full-page ImageBrowser component.

#### **Step 1: Navigate to Image Browser**
1. Login as base or admin user
2. Navigate to: `http://localhost:3000/admin/images-browser`
3. Wait for images to load

**Expected Result:**
- ✅ Route loads successfully
- ✅ Header shows "Image Browser" with count
- ✅ Filter panel visible
- ✅ Image grid displays all accessible images

---

#### **Step 2: Test View Toggle**
1. Click "Small tiles" button (grid icon)
2. Observe grid changes to smaller tiles
3. Click "Medium cards" button (card icon)
4. Observe grid changes to larger cards

**Expected Result:**
- ✅ Toggle buttons work
- ✅ Active button is highlighted
- ✅ Grid re-layouts smoothly
- ✅ Small: ~150px tiles, Medium: ~250px cards

---

#### **Step 3: Test Sysreg Filter**
1. Click "Sysreg" dropdown
2. Select "Adult"
3. Observe grid filters

**Expected Result:**
- ✅ Only images with sysreg="Adult" appear
- ✅ Image count updates in header

---

#### **Step 4: Test Owner Filter**
1. Click "Owner" dropdown
2. Select a specific user ID
3. Observe grid filters

**Expected Result:**
- ✅ Only images owned by selected user appear
- ✅ Can combine with sysreg filter (both active)

---

#### **Step 5: Test Project Filter**
1. Click "Project" dropdown
2. Select a project (e.g., "theaterpedia")
3. Observe grid filters

**Expected Result:**
- ✅ Only images from selected project appear
- ✅ Multiple filters work together

---

#### **Step 6: Test Author Search**
1. Type "Test" in "Author" search field
2. Observe real-time filtering

**Expected Result:**
- ✅ Filters as you type
- ✅ Shows images with "Test" in author name
- ✅ Case-insensitive search

---

#### **Step 7: Reset Filters**
1. Click reset button (circular arrow icon)
2. Observe all filters clear

**Expected Result:**
- ✅ All dropdowns reset to "All"
- ✅ Search field clears
- ✅ Full image grid reappears

---

#### **Step 8: Preview Image**
1. Click on any image card
2. ImagePreviewModal opens
3. Verify metadata display
4. Click X or backdrop to close

**Expected Result:**
- ✅ Modal opens with image at 800px max width
- ✅ All metadata fields populated
- ✅ Modal closes on click outside or X button

---

#### **Step 9: Test Responsive Layout (Desktop)**
1. Ensure browser is full-width desktop size (>1200px)
2. Observe grid layout

**Expected Result:**
- ✅ Grid fills width with auto-fill columns
- ✅ Cards maintain aspect ratio
- ✅ Filters in horizontal row

---

#### **Step 10: Test Responsive Layout (Mobile)**
1. Resize browser to mobile width (<768px) or use dev tools
2. Observe layout changes

**Expected Result:**
- ✅ Filters stack vertically
- ✅ Grid adjusts to smaller tiles
- ✅ View toggle remains accessible
- ✅ Modal scales properly

---

### 🧪 **Test Suite 4: Adapter Tabs (Future Ready)**

**Objective:** Verify adapter system is extensible.

#### **Step 1: View Adapter Tabs**
1. In cimgImportStepper, observe 3 tabs:
   - Local Upload (active)
   - Cloudinary (with "Coming Soon")
   - Unsplash (with "Coming Soon")

**Expected Result:**
- ✅ 3 tabs visible
- ✅ Local is active by default
- ✅ Coming Soon badges on Cloudinary/Unsplash

---

#### **Step 2: Click Cloudinary Tab**
1. Click "Cloudinary" tab
2. Observe stub content

**Expected Result:**
- ✅ Tab activates
- ✅ Shows icon + "Cloudinary Import" heading
- ✅ Shows "Coming soon..." message
- ✅ No upload controls

---

#### **Step 3: Click Unsplash Tab**
1. Click "Unsplash" tab
2. Observe stub content

**Expected Result:**
- ✅ Tab activates
- ✅ Shows icon + "Unsplash Import" heading
- ✅ Shows "Coming soon..." message
- ✅ No search controls

---

#### **Step 4: Return to Local Tab**
1. Click "Local Upload" tab
2. Verify functionality restored

**Expected Result:**
- ✅ Drop zone reappears
- ✅ Previous uploads (if any) still in preview
- ✅ Full functionality available

---

## Verification Checklist

### ✅ **Upload & Storage**
- [ ] Files upload successfully via drag-and-drop
- [ ] Files upload successfully via browse button
- [ ] Source files saved in `.local_images/source/`
- [ ] XMLID format correct: `{project}.image.scene-{subject}_{timestamp}`
- [ ] Invalid file types rejected
- [ ] Files >20MB rejected

### ✅ **Shape Generation**
- [ ] All 4 shapes generated (square, thumb, wide, vertical)
- [ ] Shape files saved in `.local_images/shapes/`
- [ ] Shape URLs accessible via API
- [ ] WebP format used for shapes
- [ ] Dimensions correct (128×128, 64×64, 336×168, 126×224)

### ✅ **Database Integration**
- [ ] Image record created with correct XMLID
- [ ] Author composite contains name, URI, adapter="local"
- [ ] Project association correct
- [ ] Owner ID set to current user
- [ ] Sysreg byte encoded (adult=3)
- [ ] Alt text stored correctly

### ✅ **Stepper Integration**
- [ ] Images step appears in sequence
- [ ] Empty state shows before first upload
- [ ] Gallery shows after upload
- [ ] Click to preview works
- [ ] Delete from gallery works
- [ ] Next button advances stepper

### ✅ **Navigation Integration**
- [ ] Images tab appears in dashboard
- [ ] Same functionality as stepper mode
- [ ] No "Next" button in navigation mode
- [ ] Upload/delete works identically

### ✅ **Image Browser**
- [ ] Route `/admin/images-browser` accessible
- [ ] All images load in grid
- [ ] View toggle works (small/medium)
- [ ] Sysreg filter works
- [ ] Owner filter works
- [ ] Project filter works
- [ ] Author search works
- [ ] Reset filters works
- [ ] Click to preview works
- [ ] Responsive on mobile/desktop

### ✅ **User Experience**
- [ ] Loading states show during operations
- [ ] Error messages appear on failures
- [ ] Success messages appear on completion
- [ ] Hover effects work on cards
- [ ] Modals open/close smoothly
- [ ] Forms validate input
- [ ] Buttons disabled during operations

---

## Common Issues & Solutions

### Issue: Upload fails with "Failed to upload"
**Solution:** 
- Check server logs for detailed error
- Verify `.local_images/` directory exists and is writable
- Check `LOCAL_IMAGE_STORAGE` environment variable

### Issue: Shapes not generating
**Solution:**
- Verify Sharp is installed: `npm list sharp`
- Check server logs for Sharp errors
- Ensure source image format is supported

### Issue: Images not appearing in browser
**Solution:**
- Check API response: `curl http://localhost:3000/api/images`
- Verify user has access to project images
- Check browser console for fetch errors

### Issue: Preview modal shows broken image
**Solution:**
- Verify source URL in database: `img_source` composite
- Check file exists: `.local_images/source/{xmlid}.{ext}`
- Verify serving endpoint: `/api/images/local/[...path].get.ts`

### Issue: Delete button not appearing
**Solution:**
- Hover over card (not clicking)
- Check CSS: `.delete-btn` should have `opacity: 0` and `opacity: 1` on `:hover`
- Verify button exists in DOM

### Issue: Filters not working
**Solution:**
- Check API endpoint returns correct data structure
- Verify filter logic in computed property
- Check browser console for JavaScript errors

---

## Performance Notes

### Expected Performance
- **Upload (single image):** ~1-2 seconds
- **Shape generation (4 shapes):** ~200-400ms
- **Database insert:** ~50-100ms
- **Total single upload:** ~2-3 seconds

### Large Batch Performance
- **10 images:** ~20-30 seconds
- **50 images:** ~2-3 minutes
- **Parallel processing:** Not yet implemented (sequential)

### Optimization Opportunities
1. Parallel shape generation with `Promise.all()`
2. Background processing queue
3. Batch database inserts
4. CDN caching for shapes

---

## Security Considerations

### Validated Inputs
- ✅ File type whitelist (JPEG, PNG, WebP)
- ✅ File size limit (20MB)
- ✅ XMLID format validation
- ✅ Path traversal prevention in serving endpoint
- ✅ Authentication required for all operations

### Future Security Enhancements
- Malware scanning on upload
- Rate limiting on endpoints
- Image dimension limits
- Content-Type verification beyond extension
- CSP headers for served images

---

## Next Steps

After completing all tests:

1. **Review Results:** Note any failures in automated tests
2. **Log Issues:** Document bugs or unexpected behavior
3. **Performance Testing:** Time operations with larger files
4. **Edge Cases:** Test with unusual file names, very small/large images
5. **Production Deploy:** Verify environment variables and permissions on server

---

## Appendix: API Reference

### Upload Endpoint
```bash
POST /api/images/upload
Content-Type: multipart/form-data

Fields:
- file: Image file (required)
- xmlid: String (required)
- project: String (required)
- owner: Number (required)
- author_name: String (required)
- author_uri: String (optional)
- author_adapter: String (default: "local")
- alt_text: String (optional)
- ctags: Number (byte value, required)

Response:
{
  "image_id": "123",
  "urls": {
    "source": "/api/images/local/source/{xmlid}.jpg",
    "square": "/api/images/local/shapes/{xmlid}_square.webp",
    "thumb": "/api/images/local/shapes/{xmlid}_thumb.webp",
    "wide": "/api/images/local/shapes/{xmlid}_wide.webp",
    "vertical": "/api/images/local/shapes/{xmlid}_vertical.webp"
  }
}
```

### List Endpoint
```bash
GET /api/images
GET /api/images?project={domaincode}

Response: Array of image objects
[
  {
    "id": 123,
    "xmlid": "tp.image.scene-test_1732100000",
    "owner": 1,
    "project": "theaterpedia",
    "author": {"name": "Test User", "uri": "", "adapter": "local"},
    "alt_text": "Test image",
    "sysreg": 3,
    "img_source": {"url": "...", ...},
    "img_square": {"url": "...", ...},
    "img_thumb": {"url": "...", ...}
  }
]
```

### Delete Endpoint
```bash
DELETE /api/images/{id}

Response: 204 No Content
```

---

**Last Updated:** 2025-11-20  
**Version:** 1.0.0  
**Status:** Ready for Testing
