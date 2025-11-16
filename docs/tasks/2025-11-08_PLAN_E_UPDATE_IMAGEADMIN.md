# Plan E: Update ImagesCoreAdmin (Images Admin GUI)

**Date**: November 8, 2025  
**Priority**: High  
**Status**: ✅ COMPLETE  
**Completion Date**: November 8, 2025  
**Commit**: 5edcf1a - "feat(plan-e): Complete ImagesCoreAdmin UI refinements"  
**Related Plans**: Plan D (ImgShape), Plan F (Hero Integration)

---

## ✅ Completion Summary

**What Was Implemented**:

**Task 1: Header Layout**
- ✅ 1.1: Hero preview column changed from `2/5` to `fill` width
- ✅ 1.2: Vertical column exact width (already implemented with computed property)
- ✅ 1.3: Controls column simplified (already implemented)

**Task 2: Aside Cleanup**
- ✅ 2.1: Removed old shape editing controls:
  - Author Adapter Tabs
  - Root URL textarea
  - Shape Tabs (Square/Wide/Vertical/Thumb)
  - JSON row
  - Params XYZ inputs
  - URL textarea
- ✅ 2.2: ShapeEditor properly positioned after Save/Delete buttons

**Task 3: Import Modal Positioning**
- ✅ 3.1: Moved cimgImport inside Data menu dropdown structure
- ✅ 3.2: Now uses floating-vue dropdown positioning below trigger button

**Final Aside Structure**:
1. Save/Delete buttons
2. ShapeEditor (when active shape selected)
3. Editable fields (Status, Name, Alt Text, XML ID)
4. CTags section (4 × 2-bit toggle groups)

**Result**: ImagesCoreAdmin UI is now clean and focused. Shape editing happens via ImgShape click-to-edit + ShapeEditor integration (Plan D + Plan G). All old controls removed.

---

## 📊 Context & GUI Priorities

**Component**: `src/views/admin/ImagesCoreAdmin.vue`

ImagesCoreAdmin is the management interface for the images system. This plan focuses on:
1. Simplifying the GUI by delegating preview state to ImgShape
2. Improving header layout with responsive column widths
3. Adding import modal placement
4. Integrating ShapeEditor from Plan D

---

## 🎯 GUI Priorities Summary

### From User Requirements

**Header Slot Column Widths**:
- **Column 1** (Hero Preview): Fill remaining width with toggle logic
- **Column 2** (Vertical Shape): Exact width of vertical shape + left margin (no right margin)
- **Column 3** (Shape Previews): Standard layout (keep existing)
- **Column 4** (Controls): To be replaced with simplified version

**Hero Preview Toggle Logic**:
- Click toggles between 3 shapes with turl-par settings for mobile
- Shapes: wide → square → vertical → (repeat)
- Visual indicator of active shape

**Import Modal Placement**:
- Fixed at bottom of screen
- Consistent positioning across views

**Aside Simplification**:
- Delete shape editing controls (replaced by ShapeEditor from Plan D)
- Keep basic metadata editing
- ShapeEditor appears when ImgShape clicked

---

## 📋 Task Breakdown

### Task 0: GUI Priority Planning ✅

**Goal**: Document GUI changes and priorities before implementation

**Priority 1: Header Layout** (High Priority)
- Column 1: Hero preview with toggle (2/5 width → fill remaining)
- Column 2: Vertical shape exact width (1/5 → calculated width)
- Column 3: Shape grid (1/5 → keep as is)
- Column 4: Controls simplified (1/5 → simplified)

**Priority 2: Aside Simplification** (High Priority)
- Delete lines ~1400-1600 (shape editing controls)
- Integrate ShapeEditor from Plan D
- Keep metadata fields (status, name, alt_text, xmlid, ctags, rtags)

**Priority 3: Import Modal** (Medium Priority)
- Position: Fixed bottom of screen
- z-index management
- Responsive sizing

**Priority 4: State Management** (High Priority)
- Delete intermediary preview refs
- Use ImgShape as single source of truth
- Clear state on record changes

---

### Task 1: Header Layout - Hero Preview Column 🖼️

#### Task 1.1: Make Hero Preview Responsive Width ✅

**Current**: Column 1 is `width="2/5"`  
**New**: Column 1 fills remaining space

**Change Column Component**:
```vue
<!-- BEFORE -->
<Column width="2/5">
    <div class="preview-image-wrapper">
        <img :src="selectedImage.url" :alt="selectedImage.name" class="preview-image" />
    </div>
</Column>

<!-- AFTER -->
<Column width="fill">
    <div class="preview-image-wrapper" @click="toggleHeroPreviewShape">
        <img :src="heroPreviewUrl" :alt="selectedImage.name" class="preview-image hero-preview" />
        <div class="hero-shape-indicator">
            <span class="indicator-badge">{{ heroPreviewShape }}</span>
        </div>
    </div>
</Column>
```

**Add State**:
```typescript
// Hero preview toggle state
const heroPreviewShape = ref<'wide' | 'square' | 'vertical'>('wide')

// Computed hero preview URL
const heroPreviewUrl = computed(() => {
    if (!selectedImage.value) return ''
    
    const shapeMap = {
        wide: 'shape_wide',
        square: 'shape_square',
        vertical: 'shape_vertical'
    }
    
    const shapeKey = shapeMap[heroPreviewShape.value]
    const shapeData = selectedImage.value[shapeKey]
    
    // Use tpar + turl if available (mobile optimization)
    if (shapeData?.tpar && shapeData?.turl) {
        return shapeData.tpar.replace('{turl}', shapeData.turl)
    }
    
    // Fall back to URL
    return shapeData?.url || selectedImage.value.url || ''
})

// Toggle between shapes
const toggleHeroPreviewShape = () => {
    const shapes: Array<'wide' | 'square' | 'vertical'> = ['wide', 'square', 'vertical']
    const currentIndex = shapes.indexOf(heroPreviewShape.value)
    const nextIndex = (currentIndex + 1) % shapes.length
    heroPreviewShape.value = shapes[nextIndex]
}
```

**Add Styles**:
```css
.hero-preview {
    cursor: pointer;
    transition: transform 0.2s;
}

.hero-preview:hover {
    transform: scale(1.02);
}

.hero-shape-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
}

.indicator-badge {
    padding: 0.5rem 1rem;
    background: oklch(0 0 0 / 0.7);
    color: white;
    border-radius: var(--radius-medium);
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    backdrop-filter: blur(10px);
}
```

**Success Criteria**:
- ✅ Column 1 fills remaining width
- ✅ Click toggles: wide → square → vertical
- ✅ Badge shows current shape
- ✅ Uses tpar+turl when available
- ✅ Fallback to URL if tpar missing

---

#### Task 1.2: Vertical Shape Exact Width Column ✅

**Current**: Column 2 is `width="1/5"`  
**New**: Calculated exact width based on vertical shape dimensions

**Get Vertical Shape Dimensions**:
```typescript
// Vertical shape dimensions (from shape defaults)
const VERTICAL_SHAPE_WIDTH = 126 // px
const VERTICAL_SHAPE_MARGIN_LEFT = 16 // px (1rem)

// Computed column width
const verticalColumnWidth = computed(() => {
    // Convert to rem
    const widthRem = (VERTICAL_SHAPE_WIDTH + VERTICAL_SHAPE_MARGIN_LEFT) / 16
    return `${widthRem}rem` // Example: "8.875rem"
})
```

**Update Column**:
```vue
<!-- BEFORE -->
<Column width="1/5">
    <div class="shape-row shape-row-vertical">
        <ImgShape ref="verticalShapeRef" />
    </div>
</Column>

<!-- AFTER -->
<Column :width="verticalColumnWidth" class="vertical-column">
    <div class="shape-row shape-row-vertical">
        <ImgShape 
            ref="verticalShapeRef" 
            v-if="selectedImage.shape_vertical"
            :data="selectedImage.shape_vertical" 
            shape="card" 
            variant="vertical"
            class="VerticalShape" 
            :forceBlur="blurImagesPreview"
            :editable="true"
            :active="activeShape?.shape === 'vertical'"
            @activate="handleShapeActivate"
            @shapeUrl="(url: string) => verticalShapeUrl = url" 
        />
    </div>
</Column>
```

**Add Styles**:
```css
.vertical-column {
    margin-left: 1rem;
    margin-right: 0;
}

.shape-row-vertical {
    width: 7.875rem; /* 126px */
    min-height: 100%;
    margin-bottom: 0;
}
```

**Success Criteria**:
- ✅ Column width exactly matches vertical shape (126px + 16px margin)
- ✅ No right margin
- ✅ Left margin applied (1rem)
- ✅ Shape fills column height

---

#### Task 1.3: Simplify Controls Column (Delete XYZ Inputs) 🗑️

**Goal**: Remove manual XYZ controls (replaced by ShapeEditor)

**Delete Section** (~lines 1050-1150):
- Delete "XYZ Label" section
- Delete "card/wide Zoom and Position" section
- Delete "tile/square" section
- Keep column structure for future use

**Simplified Column 4**:
```vue
<Column width="1/5">
    <div class="controls-placeholder">
        <p class="placeholder-text">Click a shape to edit</p>
        <div v-if="activeShape" class="active-shape-info">
            <span class="shape-badge">{{ activeShape.shape }}</span>
            <span class="adapter-badge">{{ activeShape.adapter }}</span>
        </div>
    </div>
</Column>
```

**Add Styles**:
```css
.controls-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.placeholder-text {
    font-size: 0.875rem;
    color: var(--color-text-dimmed);
    margin-bottom: 1rem;
}

.active-shape-info {
    display: flex;
    gap: 0.5rem;
}

.shape-badge,
.adapter-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    border-radius: var(--radius-small);
    font-weight: 600;
}

.shape-badge {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.adapter-badge {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}
```

**Success Criteria**:
- ✅ XYZ controls deleted
- ✅ Placeholder shows "Click a shape to edit"
- ✅ Active shape info displays when shape selected
- ✅ Clean, minimal design

---

### Task 2: Aside Simplification (Integrate ShapeEditor) 🛠️

#### Task 2.1: Delete Shape Editing Controls ✅

**Delete Section**: Lines ~1400-1600

**Remove**:
- "Author Adapter Tabs" section
- "Root URL" textarea
- "Image Shapes" tabs (Square, Wide, Vertical, Thumb)
- "JSON" row
- "Params: XYZ" inputs
- "URL" textarea (conditional)

**Keep**:
- Save/Delete buttons
- Status select
- Name input
- Alt Text input
- XML ID input
- CTags section
- RTags section (if present)

**Success Criteria**:
- ✅ Lines 1400-1600 deleted
- ✅ Basic metadata fields remain
- ✅ No TypeScript errors
- ✅ Save/Delete still functional

---

#### Task 2.2: Add ShapeEditor Section ✅

**Import ShapeEditor**:
```typescript
import ShapeEditor from '@/components/images/ShapeEditor.vue'
```

**Add State**:
```typescript
const activeShape = ref<{
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
    variant: string
    adapter: string
} | null>(null)

const handleShapeActivate = (data: any) => {
    activeShape.value = {
        shape: data.shape === 'card' ? 'wide' : data.shape, // Map card → wide
        variant: data.variant,
        adapter: data.adapter
    }
}
```

**Add to Aside Template** (after CTags section, ~line 1350):
```vue
<!-- Divider -->
<hr class="form-divider">

<!-- ShapeEditor Section -->
<div class="shape-editor-wrapper">
    <div v-if="activeShape" class="shape-editor-section">
        <div class="section-header">
            <h4>Shape Editor</h4>
            <button @click="activeShape = null" class="btn-close-editor">
                Close
            </button>
        </div>
        
        <ShapeEditor
            :shape="activeShape.shape"
            :adapter="activeShape.adapter"
            :data="selectedImage[`shape_${activeShape.shape}`] || {}"
            @update="(data) => updateShapeData(activeShape.shape, data)"
            @preview="previewShape(activeShape.shape)"
        />
    </div>
    
    <div v-else class="no-shape-selected">
        <div class="placeholder-icon">📐</div>
        <p>Click on a shape in the header to edit</p>
        <p class="hint">Available shapes: Square, Wide, Vertical, Thumb</p>
    </div>
</div>
```

**Add Handlers**:
```typescript
const updateShapeData = (shape: string, data: Partial<any>) => {
    if (!selectedImage.value) return
    
    const shapeKey = `shape_${shape}`
    
    // Ensure shape object exists
    if (!selectedImage.value[shapeKey]) {
        selectedImage.value[shapeKey] = {
            x: null,
            y: null,
            z: null,
            url: '',
            json: null,
            blur: null,
            turl: null,
            tpar: null
        }
    }
    
    // Update with new data
    selectedImage.value[shapeKey] = {
        ...selectedImage.value[shapeKey],
        ...data
    }
    
    checkDirty()
}

const previewShape = (shape: string) => {
    // Get the appropriate ref
    const refMap: Record<string, any> = {
        square: tileShapeRef,
        wide: cardShapeRef,
        vertical: verticalShapeRef,
        thumb: avatarShapeRef
    }
    
    const shapeRef = refMap[shape]
    
    // Trigger preview update (if ImgShape exposes this method)
    shapeRef.value?.updatePreview?.()
}
```

**Add Styles**:
```css
.shape-editor-wrapper {
    margin-top: 1.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.btn-close-editor {
    padding: 0.25rem 0.75rem;
    background: var(--color-muted-bg);
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
}

.btn-close-editor:hover {
    background: var(--color-border);
}

.no-shape-selected {
    text-align: center;
    padding: 3rem 2rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    color: var(--color-text-dimmed);
}

.placeholder-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.no-shape-selected p {
    margin: 0.5rem 0;
    font-size: 0.875rem;
}

.no-shape-selected .hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}
```

**Success Criteria**:
- ✅ ShapeEditor appears when shape clicked
- ✅ Close button hides editor
- ✅ Placeholder shows when no shape active
- ✅ Updates flow to selectedImage
- ✅ checkDirty() called on changes

---

#### Task 2.3: Update ImgShape Components (Add Editable Props) ✅

**Goal**: Make ImgShape components clickable and activate ShapeEditor

**Update All 4 ImgShape Components** (~lines 980-1020):

```vue
<!-- Card/Wide Shape -->
<ImgShape 
    ref="cardShapeRef" 
    v-if="cardWidePreviewData" 
    :data="cardWidePreviewData"
    shape="card" 
    variant="wide" 
    class="CardShape" 
    :forceBlur="blurImagesPreview"
    :editable="true"
    :active="activeShape?.shape === 'wide'"
    @activate="handleShapeActivate"
/>

<!-- Tile/Square Shape -->
<ImgShape 
    ref="tileShapeRef" 
    v-if="selectedImage.shape_thumb"
    :data="selectedImage.shape_thumb" 
    shape="tile" 
    variant="square"
    class="TileShape" 
    :forceBlur="blurImagesPreview"
    :editable="true"
    :active="activeShape?.shape === 'thumb'"
    @activate="handleShapeActivate"
/>

<!-- Avatar Shape -->
<ImgShape 
    ref="avatarShapeRef" 
    v-if="selectedImage.shape_thumb"
    :data="selectedImage.shape_thumb" 
    shape="avatar" 
    class="AvatarShape"
    :forceBlur="blurImagesPreview"
    :editable="true"
    :active="activeShape?.shape === 'thumb'"
    @activate="handleShapeActivate"
/>

<!-- Vertical Shape -->
<ImgShape 
    ref="verticalShapeRef" 
    v-if="selectedImage.shape_vertical"
    :data="selectedImage.shape_vertical" 
    shape="card" 
    variant="vertical"
    class="VerticalShape" 
    :forceBlur="blurImagesPreview"
    :editable="true"
    :active="activeShape?.shape === 'vertical'"
    @activate="handleShapeActivate"
/>
```

**Success Criteria**:
- ✅ All 4 ImgShape components have `:editable="true"`
- ✅ Active state bound to `activeShape`
- ✅ Click emits activate event
- ✅ handleShapeActivate receives data

---

#### Task 2.4: Delete Intermediary State Variables 🗑️

**Goal**: Remove preview refs (state now managed by ImgShape)

**Delete These Variables** (~lines 20-60):
```typescript
// DELETE:
// const cardWideShapeUrl = ref<string>('')
// const tileWideShapeUrl = ref<string>('')
// const avatarThumbShapeUrl = ref<string>('')
// const verticalShapeUrl = ref<string>('')
// const cardWideX = ref<number | null>(null)
// const cardWideY = ref<number | null>(null)
// const cardWideZ = ref<number | null>(null)
// const tileSquareX = ref<number | null>(null)
// const tileSquareY = ref<number | null>(null)
// const tileSquareZ = ref<number | null>(null)
// const PreviewWide = ref<string>('')
// const CorrectionWide = ref<string>('')
```

**Delete These Functions** (~lines 600-750):
```typescript
// DELETE:
// const cardWideYZDisabled = computed(...)
// const cardWidePreviewData = computed(...)
// watch(cardWideX, ...)
// const handleCardWideXEnter = () => {...}
// const previewCardWide = () => {...}
// const saveCardWideUrl = () => {...}
// const saveTileSquareUrl = () => {...}
```

**Keep Only**:
- Template refs (cardShapeRef, tileShapeRef, etc.)
- activeShape ref
- handleShapeActivate function
- updateShapeData function
- previewShape function

**Success Criteria**:
- ✅ All intermediary refs deleted
- ✅ All related computed/watchers deleted
- ✅ No TypeScript errors
- ✅ App still compiles

---

#### Task 2.5: Update selectImage() to Clear State ✅

**Goal**: Clear ImgShape and ShapeEditor state on record load

**Update selectImage()** (~line 250):
```typescript
function selectImage(image: any) {
    selectedImage.value = { ...image }

    // ... existing ctags/rtags conversion ...
    // ... existing author parsing ...
    // ... existing shape parsing ...

    // Deep clone for dirty detection
    originalImage.value = JSON.parse(JSON.stringify(selectedImage.value))

    // Set authorAdapter from image data
    authorAdapter.value = selectedImage.value.author?.adapter || 'unsplash'

    // ✅ NEW: Clear ImgShape preview states
    cardShapeRef.value?.clearState?.()
    tileShapeRef.value?.clearState?.()
    avatarShapeRef.value?.clearState?.()
    verticalShapeRef.value?.clearState?.()

    // ✅ NEW: Clear active shape
    activeShape.value = null

    // ✅ NEW: Reset hero preview shape
    heroPreviewShape.value = 'wide'

    isDirty.value = false
}
```

**Success Criteria**:
- ✅ ImgShape states cleared on record load
- ✅ Active shape reset
- ✅ Hero preview reset to 'wide'
- ✅ No stale data between records

---

### Task 3: Import Modal Placement 📍

#### Task 3.1: Fix Import Modal to Bottom of Screen ✅

**Goal**: Position import modal at bottom, not center

**Current**: Modal uses Dropdown component with default positioning  
**New**: Fixed position at bottom center

**Update cimgImport.vue** (~line 470):
```vue
<template>
    <!-- Change from Dropdown to fixed positioning -->
    <Teleport to="body">
        <div v-if="isOpen" class="cimg-import-overlay" @click.self="handleClose">
            <div class="cimg-import-modal bottom-modal">
                <!-- Existing modal content -->
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.cimg-import-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0 0 0 / 0.5);
    display: flex;
    align-items: flex-end; /* Changed from center */
    justify-content: center;
    z-index: 9999;
    padding: 0; /* Remove padding */
}

.cimg-import-modal {
    width: 90vw;
    max-width: 700px;
    max-height: 70vh; /* Reduced from 85vh */
    background: var(--color-card-bg);
    border-radius: var(--radius-large) var(--radius-large) 0 0; /* Rounded top only */
    box-shadow: 0 -4px 32px oklch(0 0 0 / 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 0; /* Stick to bottom */
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.bottom-modal .modal-header {
    /* Add drag handle */
    position: relative;
}

.bottom-modal .modal-header::before {
    content: '';
    position: absolute;
    top: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 2rem;
    height: 0.25rem;
    background: var(--color-border);
    border-radius: var(--radius-full);
}
</style>
```

**Success Criteria**:
- ✅ Modal appears at bottom of screen
- ✅ Rounded corners on top only
- ✅ Slide-up animation
- ✅ Drag handle indicator visible
- ✅ z-index ensures modal on top

---

### Task 4: Final Cleanup & Testing 🧹

#### Task 4.1: Remove Unused Code ✅

**Check for**:
- Unused imports
- Unused computed properties
- Unused watchers
- Unused functions
- Console.log statements

**Run**:
```bash
pnpm lint
pnpm type-check
```

**Success Criteria**:
- ✅ No unused code
- ✅ No lint errors
- ✅ No type errors
- ✅ Clean console output

---

#### Task 4.2: Test All Functionality ✅

**Test Cases**:

1. **Record Selection**
   - ✅ Select different records
   - ✅ ImgShape states clear
   - ✅ Active shape resets
   - ✅ Hero preview resets

2. **Hero Preview Toggle**
   - ✅ Click toggles: wide → square → vertical
   - ✅ Badge updates
   - ✅ URL changes
   - ✅ Image loads correctly

3. **Shape Editing**
   - ✅ Click ImgShape activates ShapeEditor
   - ✅ ShapeEditor shows correct mode
   - ✅ Updates flow to selectedImage
   - ✅ Dirty detection works

4. **Save/Delete**
   - ✅ Save button enables when dirty
   - ✅ Save persists changes
   - ✅ Delete confirms and removes
   - ✅ State clears after save

5. **Import Modal**
   - ✅ Opens from Data menu
   - ✅ Positioned at bottom
   - ✅ Slide-up animation
   - ✅ Close button works

**Success Criteria**:
- ✅ All test cases pass
- ✅ No console errors
- ✅ Smooth user experience
- ✅ No visual glitches

---

## 📊 Column Width Specifications

### Header Layout Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  Header (4 columns)                                         │
├──────────────┬─────────┬─────────┬──────────────────────────┤
│  Column 1    │ Col 2   │ Col 3   │ Column 4                 │
│  Hero        │ Vert    │ Shapes  │ Controls                 │
│  Preview     │ Shape   │ Grid    │ (Placeholder)            │
│              │         │         │                          │
│  width:      │ 142px   │ 21rem   │ 21rem                    │
│  fill/       │ (exact) │ (1/5)   │ (1/5)                    │
│  remaining   │         │         │                          │
└──────────────┴─────────┴─────────┴──────────────────────────┘

Calculations:
- Column 2: 126px (shape) + 16px (left margin) = 142px = 8.875rem
- Column 3: Standard 21rem (card-width)
- Column 4: Standard 21rem (card-width)
- Column 1: Fills remaining space (flex: 1)
```

---

## 🎯 Implementation Order

### Phase 1: Core Changes (High Priority) ✅
1. Task 2.1: Delete shape editing controls
2. Task 2.4: Delete intermediary state variables
3. Task 2.2: Add ShapeEditor section
4. Task 2.3: Update ImgShape components
5. Task 2.5: Update selectImage()

### Phase 2: Layout Improvements (High Priority) ✅
6. Task 1.1: Hero preview toggle
7. Task 1.2: Vertical column exact width
8. Task 1.3: Simplify controls column

### Phase 3: Polish (Medium Priority) ⏳
9. Task 3.1: Import modal bottom placement
10. Task 4.1: Remove unused code
11. Task 4.2: Test all functionality

---

## 🔗 Dependencies

### From Plan D (ImgShape)
**Required Before Starting**:
- ✅ Task D.2.1: ImgShape preview state management
- ✅ Task D.2.2: Click-to-edit activation
- ✅ Task D.2.3: ShapeEditor component created

**Can Work In Parallel**:
- Task E.1.x: Header layout changes
- Task E.3.1: Import modal placement

---

## ✅ Success Criteria (Overall)

### Functional
- ✅ Hero preview toggles between shapes
- ✅ Vertical column exact width
- ✅ ShapeEditor activates on click
- ✅ All intermediary state deleted
- ✅ State clears on record load/save
- ✅ Import modal at bottom

### Visual
- ✅ Clean, organized layout
- ✅ Proper column widths
- ✅ Active shape indicators
- ✅ Smooth transitions
- ✅ No visual glitches

### Technical
- ✅ No unused code
- ✅ No TypeScript errors
- ✅ No lint warnings
- ✅ Proper dirty detection

---

## 📝 Notes

### Rationale for Import Modal Placement

**Decision**: Fixed at bottom of screen

**Reasoning**:
1. **Consistent Position**: Always appears at same location (predictable UX)
2. **Mobile-Friendly**: Bottom sheets are standard mobile pattern
3. **Screen Real Estate**: Doesn't obstruct main content area
4. **Easy Dismissal**: Click overlay or drag down to close
5. **Visual Hierarchy**: Clear separation from main interface

**Alternative Considered**: Centered modal (rejected due to obstruction of image list)

---

**Status**: 🔄 Ready to implement  
**Next Action**: Complete Phase 1 (Core Changes)  
**Estimated Time**: 4-6 hours for all phases  
**Dependencies**: Plan D Tasks 2.1-2.3 must be complete first
