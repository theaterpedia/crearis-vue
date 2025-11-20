# Image Import Stepper & Browser Implementation

## Overview

Complete implementation of an image import stepper and browser system for private image hosting, integrated into the project workflow.

## Components Created

### 1. **cimgImportStepper.vue** (`/src/components/images/`)
A multi-stage image import component with:

**Features:**
- **Adapter Selection Tabs:** Local (active), Cloudinary (stub), Unsplash (stub)
- **File Drop Zone:** Drag-and-drop or click-to-browse interface
- **Validation:** 20MB max, JPEG/PNG/WebP only
- **Preview Grid:** Click-to-refine interface for each image
- **Refine Modal:** Edit xmlid, author, alt text, age group, topic
- **Smart Defaults:**
  - Age group: `adult` (hardcoded as per spec)
  - Topic: `scene` (hardcoded, injected into xmlid)
  - XMLID format: `{project}.image.scene-{filename}_{timestamp}`
  - Author: Current logged-in user
  - Owner: Current logged-in user

**Upload Flow:**
1. Drop/select files → Validation → Preview grid
2. Click image → Refine modal (edit metadata)
3. Click "Import" → FormData upload to `/api/images/upload`
4. Success → Emit `images-imported` event with image IDs

**Ctags Strategy:**
- Uses sysreg bit encoding (bits 0-1 for age group)
- Hardcoded to adult (value 3) by default
- Placeholder for future expansion (bits 2-7)

---

### 2. **ImagePreviewModal.vue** (`/src/components/images/`)
800px-wide preview modal with image details.

**Features:**
- **Responsive Modal:** Max-width 900px, responsive padding
- **Image Display:** Shows source image scaled to fit (TODO: actual 800px transformation endpoint)
- **Details Panel:**
  - XMLID
  - Author (parsed from composite)
  - Owner (user ID)
  - Project (domaincode)
  - Sysreg tag (decoded age group + subject type)
  - Alt text
- **Loading State:** Spinner while image loads
- **Error Handling:** Image load failure feedback

**TODO:**
- Implement actual 800px transformation endpoint
- Currently shows source image scaled down via CSS

---

### 3. **ImageBrowser.vue** (`/src/views/`)
Full-page image browsing experience.

**Features:**
- **View Modes:** Small tiles (grid) or medium cards (larger grid)
- **Filters:**
  - Sysreg (Adult/Teen/Child)
  - Owner (by user ID)
  - Project (by domaincode)
  - Author (string search in author composite)
  - Reset button
- **Image Grid:** Responsive grid with hover effects
- **Click to Preview:** Opens ImagePreviewModal with full details
- **Image Cards Show:**
  - Line 1: Author name (from composite)
  - Line 2: Sysreg tag + Project tag

**States:**
- Loading: Spinner with message
- Error: Error icon with message
- Empty: Empty state with icon and guidance
- Data: Responsive grid (auto-fill based on view mode)

**Route:** `/admin/images-browser` (requires `role: base` auth)

---

### 4. **ProjectStepImages.vue** (`/src/views/project/`)
Project stepper integration component.

**Features:**
- **2-Column Layout:**
  - Left (60%): Image gallery with click-to-preview
  - Right (40%): cimgImportStepper panel
- **Empty State:** Friendly prompt to upload images
- **Image Cards:**
  - Square thumbnails (img_square)
  - Delete button (hover)
  - Click to preview
  - Shows XMLID + author
- **Event Handling:**
  - `images-imported`: Reloads gallery after import
  - `next`: Emits to advance stepper
- **Delete Functionality:** Confirmation dialog → DELETE `/api/images/{id}`

**Integration:** Used in ProjectMain stepper and navigation modes

---

## Integration Points

### Router (`/src/router/index.ts`)
- Added route: `/admin/images-browser` → ImageBrowser.vue
- Auth: `requiresAuth: true, role: 'base'`

### ProjectMain (`/src/views/project/ProjectMain.vue`)
- Imported ProjectStepImages component
- Added 'images' to all step key arrays:
  - Default: Events → Posts → **Images** → Users → Theme → Pages
  - Topic: Posts → **Images** → Users → Theme → Pages
  - Regio: Users → Pages → Posts → **Images** → Events
- Added to visible navigation tabs: `['homepage', 'events', 'posts', 'images', ...]`
- Template additions:
  - Stepper mode: `<ProjectStepImages v-else-if="currentStepKey === 'images'" ... />`
  - Navigation mode: `<ProjectStepImages v-else-if="currentNavTab === 'images'" ... />`

### ProjectStepper (`/src/views/project/ProjectStepper.vue`)
- Added to allSteps array: `{ key: 'images', label: 'Images', description: 'Loading...' }`
- Updated step counts (now supports 6 steps)
- Updated regio filter to include images

### ProjectNavigation (`/src/views/project/ProjectNavigation.vue`)
- Added images tab with icon:
  ```javascript
  {
    id: 'images',
    label: 'Images',
    icon: () => h('svg', ...) // Image gallery icon
  }
  ```

---

## Design Patterns

### Following Events Pattern
The implementation closely follows the established `ProjectStepEvents.vue` pattern:

1. **2-Column Layout:**
   - Left: Gallery/list of existing items
   - Right: Add/import panel

2. **Empty State:**
   - Friendly icon + message
   - Guidance to use right panel

3. **Card Design:**
   - Hover effects
   - Delete button (top-right, appears on hover)
   - Click to open/preview

4. **Panel Integration:**
   - Self-contained component (cimgImportStepper)
   - Emits events on completion
   - Parent reloads data on success

### Sysreg Strategy
- Uses bit encoding (1 byte = 8 bits)
- Bits 0-1: Age group (0=other, 1=child, 2=teen, 3=adult)
- Bits 2-3: Subject type (0=other, 1=group, 2=person, 3=portrait)
- Bits 4-5: Access level (0=project, 1=public, 2=private, 3=internal)
- Bits 6-7: Quality (0=OK, 1=deprecated, 2=error, 3=check)

Current implementation:
- Hardcoded to adult (bits 0-1 = 11 = 3)
- Topic injected as 'scene' into xmlid
- Future: Extract full sysreg decoding into shared utility

---

## Usage Examples

### 1. Project Stepper (New Projects)
```typescript
// User navigates to /projects (project role)
// Stepper shows: Events → Posts → **Images** → Users → Theme → Pages

// On Images step:
// - Drop/select files
// - Preview grid appears
// - Click to refine metadata
// - Click "Import {n} Images"
// - Success → Gallery refreshes
// - Click "Next" → Advance to Users step
```

### 2. Project Dashboard (Existing Projects)
```typescript
// User clicks "Images" tab in navigation
// Shows ProjectStepImages with hide-actions
// Can upload more images
// Can delete images
// Can preview images
// No "Next" button (navigation mode)
```

### 3. Image Browser (Admin/Base Users)
```typescript
// User navigates to /admin/images-browser
// Full-page grid of all accessible images
// Filter by sysreg, owner, project, author
// Toggle small/medium view
// Click image → Preview modal (800px wide)
```

---

## File Structure

```
src/
├── components/
│   └── images/
│       ├── cimgImportStepper.vue        (NEW) Image import with refine
│       ├── ImagePreviewModal.vue        (NEW) 800px preview modal
│       └── cimgImport.vue               (EXISTING) Legacy URL import
├── views/
│   ├── ImageBrowser.vue                 (NEW) Full-page browser
│   └── project/
│       ├── ProjectMain.vue              (MODIFIED) Added images integration
│       ├── ProjectStepper.vue           (MODIFIED) Added images step
│       ├── ProjectNavigation.vue        (MODIFIED) Added images tab
│       └── ProjectStepImages.vue        (NEW) Stepper integration component
└── router/
    └── index.ts                         (MODIFIED) Added /admin/images-browser route
```

---

## API Endpoints Used

### Upload
- **POST** `/api/images/upload`
- **Body:** FormData with:
  - `file`: Image file (File)
  - `xmlid`: String (e.g., "theaterpedia.image.scene-photo_1732100000")
  - `project`: String (domaincode)
  - `owner`: Number (user ID)
  - `author_name`: String
  - `author_uri`: String (optional)
  - `author_adapter`: String ("local")
  - `alt_text`: String (optional)
  - `ctags`: Number (byte value)
- **Response:** `{ image_id, urls: { source, square, thumb, wide, vertical } }`

### List (Browser)
- **GET** `/api/images`
- **Response:** Array of image records with:
  - `id`, `xmlid`, `owner`, `project`, `author`, `alt_text`, `sysreg`
  - `img_thumb`, `img_square`, `img_source` (JSON composite)

### List (Project)
- **GET** `/api/images?project={domaincode}`
- **Response:** Filtered array for specific project

### Delete
- **DELETE** `/api/images/{id}`
- **Response:** 204 No Content

---

## Styling Notes

### CSS Variables Used
- `--color-card-bg`: Card backgrounds
- `--color-border`: Default borders
- `--color-muted-bg`: Muted backgrounds (filters, dropzones)
- `--color-primary-bg`: Primary action color
- `--color-primary-contrast`: Primary text color
- `--color-danger`: Delete/error color
- `--radius-medium`, `--radius-large`: Border radius tokens

### Responsive Breakpoints
- **Mobile (<768px):**
  - 2-column → 1-column layout
  - Smaller grid tiles (120px min)
  - Full-width filters
- **Desktop (≥768px):**
  - 2-column layout preserved
  - Grid auto-fills based on container

---

## Future Enhancements

### Phase 1 (Completed) ✅
- Local adapter with file drop
- Preview grid with refine modal
- Smart defaults (adult, scene)
- Project stepper integration
- Image browser with filters
- 800px preview modal

### Phase 2 (TODO)
- **Cloudinary Adapter:**
  - Search Cloudinary library
  - Import with URL transformation
  - Preserve XYZ focal points
- **Unsplash Adapter:**
  - Search Unsplash API
  - Import with proper attribution
  - License tracking
- **800px Transformation Endpoint:**
  - Server-side Sharp transformation
  - Cache transformed images
  - Serve via `/api/images/transform/[...path]?width=800`

### Phase 3 (TODO)
- **Batch Operations:**
  - Multi-select in gallery
  - Bulk delete
  - Bulk metadata edit
- **Advanced Filters:**
  - Date range
  - File size
  - Image dimensions
  - License type
- **Image Editor:**
  - Crop tool
  - XYZ focal point adjustment
  - Regenerate shapes

---

## Testing Checklist

### cimgImportStepper
- [ ] Drop files (valid/invalid types)
- [ ] File size validation (>20MB rejection)
- [ ] Preview grid displays correctly
- [ ] Refine modal opens/saves changes
- [ ] XMLID format validation
- [ ] Author defaults to current user
- [ ] Import uploads to server
- [ ] Success emits event with IDs
- [ ] Adapter tabs (Cloudinary/Unsplash show stubs)

### ImageBrowser
- [ ] Loads images from API
- [ ] Filters work (sysreg, owner, project, author)
- [ ] View toggle (small/medium)
- [ ] Preview modal opens on click
- [ ] Responsive on mobile/desktop
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure

### ProjectStepImages
- [ ] Shows empty state initially
- [ ] Upload via cimgImportStepper works
- [ ] Gallery refreshes after upload
- [ ] Click image opens preview
- [ ] Delete image works with confirmation
- [ ] Next button advances stepper

### Integration
- [ ] Images step appears in stepper sequence
- [ ] Images tab appears in navigation
- [ ] Route `/admin/images-browser` works
- [ ] Auth guards work correctly

---

## Notes

### Hardcoded Values (Per Spec)
- **Age Group:** `adult` (ctags bits 0-1 = 3)
- **Topic:** `scene` (injected into xmlid 3rd position)
- **Adapter:** `local` (in author composite)
- **Owner:** Current logged-in user
- **Author Name:** Current logged-in user's username

### Design Decisions
1. **Separate cimgImportStepper from cimgImport:**
   - cimgImport: Legacy URL import for external sources
   - cimgImportStepper: New file-based import for projects
   - Allows parallel use without conflicts

2. **800px Preview Placeholder:**
   - Modal structure complete
   - Shows source image scaled via CSS
   - Ready for transformation endpoint when implemented

3. **Sysreg Strategy:**
   - Bit encoding for future flexibility
   - Currently only uses age group (bits 0-1)
   - Prepared for full 8-bit decoding later

4. **Stepper Position:**
   - Images after Posts, before Users
   - Logical flow: Content (Events/Posts) → Media (Images) → People (Users)

---

## Documentation

**Related Docs:**
- `/docs/LOCAL_ADAPTER_PHASE_1.md` - Local adapter implementation
- `/docs/LOCAL_ADAPTER_PHASE_2.md` - Shape regeneration & upload UI
- `/test-local-image-upload.sh` - Phase 1 test script
- `/test-phase2-local-adapter.sh` - Phase 2 test script

**Migration Path:**
This implementation is fully compatible with existing image systems:
- Works alongside URL imports (cimgImport)
- Uses same database schema (images table)
- Shares same API endpoints (/api/images/*)
- Integrates with existing adapter system (local, cloudinary, unsplash)
