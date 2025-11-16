# CList Component Family - Refactor Plan (4 Rounds)

**Date**: November 9, 2025  
**Type**: System Integration + Enhancement Plan  
**Priority**: High  
**Status**: 📋 Planning Phase

---

## 🎯 Goals & Focus Areas

### FOCUS 1: View-Only Functionality
- **Primary Use**: Lists and galleries serve view-only operations
- **Simple Interactions**: Click-the-whole-item design over sophisticated buttons
- **Special Cases**:
  1. Optional select-me checkbox overlays item-global-click-area
  2. Card items (medium/large) have optional action-slot on right-bottom (CL3)
  3. Editing/Selecting requires special ItemCardModal

### FOCUS 2: 3-Tier Architecture → 4-Tier Architecture
- **NOW**: 3-tier (Layer1: ImgShape → Layer2: ItemComponents → Layer3: Gallery/List)
- **CL3-CL4**: 4-tier + composable (add wrapper layer between views and containers)
- **CL1-CL2 Priority**:
  - Harden Layer1: ImgShape.vue as foundation
  - Focus on Layer3: Gallery + List containers with testing support
  - Layer2: ItemRow, ItemCard details are lower priority
  - View integration: Make it work, collect requirements for CL3 wrappers

---

## 📋 Round Structure

### System Integration (Today)
- **CL1**: Prepare, simplify, standardize
- **CL2**: Implement on 5 production locations

### Future Enhancements
- **CL3**: 4-tier architecture + composable + ItemTile integration
- **CL4**: Advanced features + polish

### Supporting Rounds
- **CLT**: Edge-case testing collection
- **CLL**: Do-this-later ideas collection

---

## 🔍 CL1: Prepare, Simplify, Standardize

**Estimated Time**: 2-3 hours

### CL1a: Understand Older Parts (45 min)

**Read existing documentation**:

1. **CLIST_COMPONENTS.md** (partly outdated)
   - Location: `/home/persona/crearis/crearis-vue/docs/core/CLIST_COMPONENTS.md`
   - Initial component family creation
   - Item components: ItemRow, ItemTile, ItemCard
   - Container components: ItemList, ItemGallery
   - Original specs and props

2. **IMAGE_SYSTEM_COMPLETE.md** (partly outdated)
   - Location: `/home/persona/crearis/crearis-vue/docs/IMAGE_SYSTEM_COMPLETE.md`
   - First refactor with ImgShape.vue support
   - Pre-dates fundamental ImgShape upgrade
   - Entity-based data fetching
   - Cloudinary/Unsplash integration

**Deliverables**:
- Summary of original component design
- List of implemented features
- Note outdated assumptions

---

### CL1b: Cross-Compare with Current ImgShape (60 min)

**Current ImgShape.vue capabilities**:
- Shape: 'card' | 'tile' | 'avatar'
- Variant: 'default' | 'square' | 'wide' | 'vertical'
- Adapter: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
- Dimension calculation from CSS variables
- Avatar shape detection (round vs square based on xmlid)
- BlurHash support
- Error handling

**CSS Variables** (from `01-variables.css`):
```css
--card-width: 21rem;        /* 336px */
--card-height: 14rem;       /* 224px */
--card-height-min: 10.5rem; /* 168px */
--tile-width: 8rem;         /* 128px */
--tile-height: 4rem;        /* 64px */
--tile-height-square: 8rem; /* 128px */
--avatar: 4rem;             /* 64px */
```

**Code Analysis Tasks**:
1. **ItemRow.vue**:
   - Current implementation vs ImgShape integration
   - Image sizing conflicts
   - Content parsing with HeadingParser

2. **ItemTile.vue**:
   - Background image vs ImgShape
   - Size variants alignment
   - Gradient overlay compatibility

3. **ItemCard.vue**:
   - Accent border implementation
   - Background image handling
   - Slot positioning for actions

4. **ItemList.vue**:
   - Entity data fetching
   - Image data parsing
   - Interaction modes (static, popup, zoom)
   - Current props and limitations

5. **ItemGallery.vue**:
   - Similar to ItemList
   - Grid layout vs container specifics

**Identify**:
- ✅ Naming conflicts
- ✅ Functionality overlaps
- ✅ Over-engineering (double implementations)
- ✅ Complexity reduction opportunities

**Deliverables**:
- Conflict matrix (naming, functionality)
- Simplification opportunities list
- Integration points with ImgShape

---

### CL1c: Design Changes & Adaptations (45 min)

**New Design Standards**:

| Component | Size | Default Shape | Dimensions |
|-----------|------|---------------|------------|
| **ItemRow** | medium | avatar | height: `--avatar` (64px), width: `--card-width` (336px) |
| **ItemTile** | medium | img_wide (reduced) | Reduce ImgShape size, align to tile standards |
| **ItemCard** | medium | card | `--card-width` × `--card-height` (336px × 224px) |

**Changes Required**:

1. **ItemRow (medium)**:
   - Current: Variable heights (60px small, 80px medium, 100px large)
   - New: Align to `--avatar` (64px) for medium
   - Image: Use ImgShape with shape="avatar"
   - Width: `--card-width` (336px)

2. **ItemTile (medium)** → Plan for CL3:
   - Current: min-height 160px
   - New: Use img_wide but reduce ImgShape size
   - Align to tile standards (tile-width/tile-height-square)
   - Note: Full implementation in CL3

3. **ItemCard (medium)**:
   - Current: min-height 260px
   - New: `--card-width` (336px) × `--card-height` (224px)
   - Image: Use ImgShape with shape="card"
   - Accent border: Keep existing 4px left border

**Deliverables**:
- Design spec alignment table
- Component modification list
- Migration notes for CL3 (ItemTile)

---

### CL1d: Status Report (30 min)

**Consolidate findings into structured report**:

1. **Current State Summary**:
   - What works
   - What needs fixing
   - What's outdated

2. **Conflicts & Issues**:
   - Naming conflicts
   - Functionality overlaps
   - Design misalignments

3. **Simplification Opportunities**:
   - Remove double implementations
   - Consolidate image handling
   - Standardize prop interfaces

4. **CL2 Preparation**:
   - Prerequisites completed
   - Integration points identified
   - Test locations confirmed

5. **CL3 Planning Notes**:
   - ItemTile refactor requirements
   - Wrapper layer specifications
   - Composable extraction ideas

**Deliverables**:
- **STATUS_REPORT.md** (foundation for CL2-CL4)
- Clear go/no-go for CL2 implementation

---

## 🚀 CL2: Implement System Integration (5 Locations)

**Estimated Time**: 4-5 hours  
**Goal**: Mount containers on 5 production views with ItemOptions support

### CL2a: Mount 5 Container Instances (2-3 hours)

**Implementation Pattern**:
```typescript
// View component
import { ItemList, ItemGallery } from '@/components/clist'

// Usage
<ItemList 
  entity="events"
  item-type="row"
  size="medium"
  interaction="popup"
  :item-options="eventOptions"
  v-model="isDropdownOpen"
/>
```

#### **a1: Select Event (ItemList dropdown)** - BaseView.vue
**Location**: `src/views/BaseView.vue` at line ~7  
**Current**: Custom events selector with ItemList popup  
**Changes**:
- ✅ Already using ItemList with popup interaction
- ➕ Add `item-options` prop with showEntity
- ➕ Add event icon overlay (top-left corner)
- 🔧 Configure: `entity="events"`, `item-type="row"`, `interaction="popup"`

```vue
<!-- Events Selector -->
<div class="navbar-item events-selector" ref="eventsSelectorRef">
  <button class="navbar-button events-toggle-btn" 
          @click="isEventsOpen = true">
    <svg>...</svg>
    <span v-if="currentEvent">{{ currentEvent.name }}</span>
  </button>

  <ItemList 
    v-model="isEventsOpen" 
    entity="events"
    item-type="row" 
    size="medium"
    interaction="popup" 
    title="Veranstaltung wählen"
    :item-options="{ showEntity: true }"
    @close="isEventsOpen = false"
    @select="handleEventSelect"
  />
</div>
```

---

#### **a2: Select Post (ItemGallery dropdown)** - PostPanel.vue
**Location**: Search for PostPanel.vue  
**Current**: Unknown (to be inspected)  
**Changes**:
- 🔍 Find existing post selector implementation
- 🔧 Replace with ItemGallery
- 🔧 Configure: `entity="posts"`, `item-type="card"`, `interaction="popup"`
- ➕ Add `item-options` with showBadge

```vue
<div class="dropdown-wrapper" ref="dropdownRef">
  <button @click="isPostsOpen = true">Select Post</button>
  
  <ItemGallery
    v-model="isPostsOpen"
    entity="posts"
    item-type="card"
    size="medium"
    interaction="popup"
    title="Blog-Beitrag wählen"
    :item-options="{ showBadge: { count: 5, color: 'primary' } }"
    @close="isPostsOpen = false"
    @select="handlePostSelect"
  />
</div>
```

---

#### **a3: Select Image (ItemList tiles)** - AdminActionUsersPanel.vue
**Location**: `src/views/admin/AdminActionUsersPanel.vue` (end of form)  
**Current**: Unknown  
**Changes**:
- ➕ Add entity option 'images' to ItemList
- ➕ Wire `images.about` field to serve as title with format: `** ** {about}` (subline on row 2)
- 🔧 Filter: `images` with xmlid containing 'instructor'
- 🔧 Configure: `entity="images"`, `item-type="tile"`, `interaction="popup"`
- ⚠️ Use existing ItemTile implementation (dimensions not changed in CL2)

```vue
<!-- At end of form in AdminActionUsersPanel.vue -->
<div class="form-section">
  <label>Instructor Image</label>
  <button @click="isImageSelectorOpen = true">Select Image</button>
  
  <ItemList
    v-model="isImageSelectorOpen"
    entity="images"
    :filters="{ xmlid_contains: 'instructor' }"
    item-type="tile"
    size="medium"
    interaction="popup"
    title="Instructor-Bild wählen"
    :item-options="{ showSelector: true }"
    @close="isImageSelectorOpen = false"
    @select="handleImageSelect"
  />
</div>
```

**ItemList Extension Required**:
```typescript
// Add to ItemList.vue props
interface Props {
  entity?: 'posts' | 'events' | 'instructors' | 'images' | 'all'
  filters?: {
    xmlid_contains?: string
    project?: string
    // ... other filters
  }
}

// Entity mapping for images
if (props.entity === 'images') {
  let url = '/api/images'
  if (props.filters?.xmlid_contains) {
    url += `?xmlid_contains=${props.filters.xmlid_contains}`
  }
  const response = await fetch(url)
  entityData.value = await response.json()
}

// Format heading for images
const formatImageHeading = (image: any) => {
  return `** ** ${image.about || 'Untitled'}`
}
```

---

#### **a4: Preview Event (ItemList on-page)** - UpcomingEventsSection.vue
**Location**: `src/views/Home/HomeComponents/UpcomingEventsSection.vue`  
**Current**: Slider with manual event cards  
**Changes**:
- 🗑️ Replace Slider component with ItemList
- 🔧 Configure: `entity="events"`, `item-type="row"`, `interaction="static"`
- ➕ Add `item-options` with showStatus (status icon bottom-right)
- 🔗 Click opens ItemModalCard preview

```vue
<template>
  <Section v-if="events.length > 0" background="muted">
    <Container>
      <Prose>
        <Heading overline="What's Happening" level="h2">
          Upcoming **Events**
        </Heading>
      </Prose>

      <!-- Replace Slider with ItemList -->
      <ItemList
        entity="events"
        item-type="row"
        size="medium"
        interaction="previewmodal"
        :item-options="{ showStatus: true }"
        @preview="handleEventPreview"
      />
    </Container>
  </Section>
</template>
```

---

#### **a5: Load Blog Post Page (ItemGallery on-page)** - BlogPostsSection.vue
**Location**: `src/views/Home/HomeComponents/BlogPostsSection.vue`  
**Current**: Columns with CardHero components  
**Changes**:
- 🗑️ Replace Columns + CardHero with ItemGallery
- 🔧 Configure: `entity="posts"`, `item-type="card"`, `interaction="static"`
- ➕ Add `item-options` with showBadge (badge top-right)
- 🔗 Click routes to blog post page

```vue
<template>
  <Section background="accent" v-if="displayedPosts.length > 0">
    <Container>
      <Prose>
        <Heading overline="Recent Articles" level="h2">
          Latest from Our **Blog**
        </Heading>
      </Prose>

      <!-- Replace Columns with ItemGallery -->
      <ItemGallery
        entity="posts"
        :limit="showPosts"
        item-type="card"
        size="medium"
        variant="default"
        interaction="static"
        :item-options="{ showBadge: { count: 0, color: 'accent' } }"
        @click="navigateToPost"
      />
    </Container>
  </Section>
</template>
```

---

#### **a6: Dropdown Select Image (ItemList tiles)** - AdminActionUsersPanel.vue
**Location**: Same as a3, but separate instance  
**Current**: Unknown  
**Changes**:
- Same as a3 but for different use case
- Filter: `images` with xmlid containing 'instructor'
- Do not bind to form field (user will handle manually)

```vue
<!-- Second image selector instance -->
<div class="form-section">
  <label>Additional Image Selection</label>
  <button @click="isImageSelector2Open = true">Browse Images</button>
  
  <ItemList
    v-model="isImageSelector2Open"
    entity="images"
    :filters="{ xmlid_contains: 'instructor' }"
    item-type="tile"
    size="medium"
    interaction="popup"
    title="Bild durchsuchen"
    @close="isImageSelector2Open = false"
  />
</div>
```

---

### CL2b: Unified ItemOptions (2 hours)

**Goal**: Create 5 overlays displayable on all item components, positioned at 4 corners + left border

**ItemOptions Interface**:
```typescript
interface ItemOptions {
  showEntity?: boolean | 'instructor' | 'user' | 'event' | 'location' | 'post' | 'project'
  showBadge?: {
    count: number
    color: 'primary' | 'accent' | 'muted' | string
  }
  showSelector?: boolean
  showMarker?: 'warning' | 'positive' | 'negative' | 'info'
  showStatus?: boolean | string
}
```

**Implementation in Item Components**:

#### **1. showEntity (top-left corner)**
Icons for entity types:
- instructor + user: Same icon (person/user)
- event: Group icon
- location: Theatre/place icon
- post: Document/article icon
- project: Folder icon

```vue
<!-- In ItemRow.vue, ItemCard.vue, ItemTile.vue -->
<div v-if="itemOptions?.showEntity" class="item-entity-icon">
  <svg v-if="entityIcon === 'user'" class="entity-icon">
    <!-- User/Instructor icon -->
  </svg>
  <svg v-else-if="entityIcon === 'event'" class="entity-icon">
    <!-- Event/Group icon -->
  </svg>
  <!-- ... other icons -->
</div>

<style scoped>
.item-entity-icon {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-small);
  padding: 0.25rem;
}

.entity-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}
</style>
```

---

#### **2. showBadge (top-right corner)**
Badge with count and theme color:

```vue
<div v-if="itemOptions?.showBadge" class="item-badge">
  <span class="badge-count">{{ itemOptions.showBadge.count }}</span>
</div>

<style scoped>
.item-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  background: var(--color-{{ itemOptions.showBadge.color }});
  color: white;
  border-radius: var(--radius-medium);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
```

---

#### **3. showSelector (bottom-left corner)**
Checkbox for selection:

```vue
<div v-if="itemOptions?.showSelector" class="item-selector" @click.stop>
  <input 
    type="checkbox" 
    :checked="isSelected"
    @change="$emit('toggle-select')"
    class="selector-checkbox"
  />
</div>

<style scoped>
.item-selector {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 2;
}

.selector-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}
</style>
```

---

#### **4. showMarker (left border accent)**
Colored vertical bar on left side (already exists in ItemCard, extend to others):

```vue
<!-- Extend existing accent-border -->
<div 
  v-if="itemOptions?.showMarker" 
  class="item-marker"
  :class="`marker-${itemOptions.showMarker}`"
></div>

<style scoped>
.item-marker {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  z-index: 1;
}

.marker-warning { background: var(--color-warning); }
.marker-positive { background: var(--color-success); }
.marker-negative { background: var(--color-error); }
.marker-info { background: var(--color-info); }
</style>
```

---

#### **5. showStatus (bottom-right corner)**
Status icon (check, clock, etc.):

```vue
<div v-if="itemOptions?.showStatus" class="item-status">
  <svg v-if="statusIcon === 'published'" class="status-icon">
    <!-- Check/published icon -->
  </svg>
  <svg v-else-if="statusIcon === 'draft'" class="status-icon">
    <!-- Clock/draft icon -->
  </svg>
  <!-- ... other status icons -->
</div>

<style scoped>
.item-status {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 0.25rem;
}

.status-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}
</style>
```

---

**Container Support**:
Update ItemList and ItemGallery to pass itemOptions to child components:

```typescript
// In ItemList.vue and ItemGallery.vue
interface Props {
  // ... existing props
  itemOptions?: ItemOptions
}

// Pass to item components
<component 
  :is="itemComponent" 
  v-for="(item, index) in entities" 
  :key="index"
  :item-options="itemOptions"
  v-bind="item.props || {}"
/>
```

---

### CL2c: Extensions - PreviewModal Interaction (1 hour)

**New Interaction Mode**: `interaction="previewmodal"`

**Implementation**:

1. **Update Props**:
```typescript
// ItemList.vue and ItemGallery.vue
interface Props {
  interaction?: 'static' | 'popup' | 'zoom' | 'previewmodal'
}
```

2. **Create ItemModalCard.vue**:
```vue
<!-- src/components/clist/ItemModalCard.vue -->
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <button class="modal-close-btn" @click="$emit('close')">×</button>
        
        <!-- Large ItemCard with teaser in slot -->
        <ItemCard 
          :heading="item.heading"
          :cimg="item.cimg"
          size="large"
          :item-options="itemOptions"
        >
          <div class="modal-teaser">
            <p>{{ item.teaser }}</p>
          </div>
        </ItemCard>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import ItemCard from './ItemCard.vue'
import type { ItemOptions } from './types'

interface Props {
  isOpen: boolean
  item: {
    heading: string
    cimg?: string
    teaser?: string
  }
  itemOptions?: ItemOptions
}

defineProps<Props>()
defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  position: relative;
  max-width: 600px;
  width: 90%;
}

.modal-close-btn {
  position: absolute;
  top: -2rem;
  right: 0;
  background: white;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1;
}

.modal-teaser {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-medium);
}
</style>
```

3. **Add to ItemList/ItemGallery**:
```vue
<script setup lang="ts">
import ItemModalCard from './ItemModalCard.vue'

const showPreviewModal = ref(false)
const previewItem = ref<any>(null)

const handleItemClick = (item: any) => {
  if (props.interaction === 'previewmodal') {
    previewItem.value = item
    showPreviewModal.value = true
  } else {
    emit('click', item)
  }
}
</script>

<template>
  <!-- Existing static/popup/zoom templates -->
  
  <!-- Add previewmodal -->
  <ItemModalCard
    v-if="interaction === 'previewmodal'"
    :is-open="showPreviewModal"
    :item="previewItem"
    :item-options="itemOptions"
    @close="showPreviewModal = false"
  />
</template>
```

---

## 🔮 CL3: 4-Tier Architecture + ItemTile (Future)

**Estimated Time**: 6-8 hours  
**Status**: 🔵 Planning Phase

### Goals

1. **Add Wrapper Layer** (Layer 3.5):
   - Clean separation between views and containers
   - Handle dropdown logic
   - Manage selection state
   - Provide unified interface

2. **Extract Composable**:
   - `useEntityList()` - Query logic
   - `useItemSelection()` - Selection state
   - `useItemOptions()` - Option calculation

3. **ItemTile Integration**:
   - Align to tile dimension standards
   - Reduce ImgShape size for wide variant
   - Full testing integration

### Architecture

```
Layer 1: ImgShape.vue (foundation)
         ↓
Layer 2: ItemRow, ItemCard, ItemTile (components)
         ↓
Layer 3: ItemList, ItemGallery (containers)
         ↓
Layer 3.5: ItemListWrapper, ItemGalleryWrapper (NEW)
         ↓
Layer 4: View components (BaseView, HomePage, etc.)
```

### Wrapper Example

```typescript
// composables/useEntityList.ts
export function useEntityList(options: {
  entity: string
  filters?: Record<string, any>
  project?: string
}) {
  const data = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchData = async () => {
    // Centralized query logic
  }

  return { data, loading, error, fetchData, refetch: fetchData }
}

// components/clist/ItemListWrapper.vue
<template>
  <div class="item-list-wrapper">
    <slot name="trigger" :toggle="toggle" :is-open="isOpen">
      <button @click="toggle">{{ triggerText }}</button>
    </slot>

    <ItemList
      v-model="isOpen"
      :entity="entity"
      :item-type="itemType"
      :item-options="itemOptions"
      :interaction="interaction"
      @select="handleSelect"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
// Wrapper handles dropdown state, selection, etc.
const { data, loading } = useEntityList({ 
  entity: props.entity,
  filters: props.filters 
})

const isOpen = ref(false)
const selectedItems = ref<any[]>([])

// Clean interface for views
</script>
```

---

## 🧪 CLT: Testing Edge Cases Collection

**Purpose**: Collect edge cases during CL1-CL2 for systematic testing

### Categories

1. **Data Edge Cases**:
   - Missing images
   - Empty headings
   - Special characters in content
   - Very long text
   - Null/undefined values

2. **Interaction Edge Cases**:
   - Rapid clicks
   - Multiple simultaneous popups
   - Keyboard navigation
   - Mobile touch events
   - Accessibility (screen readers)

3. **Layout Edge Cases**:
   - Viewport sizes (mobile, tablet, desktop, ultrawide)
   - Container overflow
   - Grid wrapping
   - Z-index conflicts

4. **Performance Edge Cases**:
   - Large datasets (1000+ items)
   - Slow network
   - Image loading failures
   - Concurrent fetches

### Test Plan Template

```typescript
// tests/clist/ItemList.spec.ts
describe('ItemList', () => {
  describe('Edge Cases - Data', () => {
    it('handles missing images gracefully', () => {})
    it('displays fallback for empty headings', () => {})
    // ...
  })

  describe('Edge Cases - Interaction', () => {
    it('prevents multiple popup instances', () => {})
    // ...
  })

  describe('Edge Cases - Layout', () => {
    it('wraps correctly on mobile viewport', () => {})
    // ...
  })
})
```

---

## 💡 CLL: Do-This-Later Ideas

**Purpose**: Capture ideas and requirements discovered during CL1-CL2 for future implementation

### Collected Ideas

1. **Virtual Scrolling** (large datasets):
   - Implement when lists exceed 500 items
   - Consider `vue-virtual-scroller`

2. **Infinite Scroll**:
   - Load more on scroll
   - Pagination support

3. **Advanced Filtering**:
   - Client-side filter UI
   - Multi-select filters
   - Date range pickers

4. **Keyboard Shortcuts**:
   - Arrow keys for navigation
   - Enter to select
   - Esc to close

5. **Drag & Drop**:
   - Reorder items
   - Drag to select
   - Drag to external targets

6. **Animations**:
   - Enter/exit transitions
   - Smooth scroll
   - Loading skeletons

7. **Export Functions**:
   - Export selection as JSON
   - Copy to clipboard
   - Print view

8. **Themes**:
   - Compact mode
   - List vs grid toggle
   - Custom color schemes

### Capture Format

```markdown
## Idea: Virtual Scrolling
- **Priority**: Medium
- **Effort**: 4-6 hours
- **Triggered by**: Performance testing with 1000+ items
- **Dependencies**: vue-virtual-scroller or custom implementation
- **Notes**: Only needed if lists regularly exceed 500 items
```

---

## 📊 Success Criteria

### CL1 Complete When:
- ✅ Status report delivered
- ✅ Conflicts identified
- ✅ Simplification plan ready
- ✅ Design specs aligned
- ✅ CL2 prerequisites met

### CL2 Complete When:
- ✅ 5 container instances mounted and working
- ✅ ItemOptions implemented on all item components
- ✅ PreviewModal interaction working
- ✅ Manual testing successful on all 5 locations
- ✅ No regression in existing functionality
- ✅ CL3 requirements collected

### CL3 Complete When (Future):
- ⏳ Wrapper layer implemented
- ⏳ Composables extracted
- ⏳ ItemTile fully integrated
- ⏳ All edge cases tested
- ⏳ Documentation updated

---

## 🔗 Related Files

- Current Docs:
  - `/home/persona/crearis/crearis-vue/docs/core/CLIST_COMPONENTS.md`
  - `/home/persona/crearis/crearis-vue/docs/IMAGE_SYSTEM_COMPLETE.md`

- Components:
  - `/home/persona/crearis/crearis-vue/src/components/clist/ItemList.vue`
  - `/home/persona/crearis/crearis-vue/src/components/clist/ItemGallery.vue`
  - `/home/persona/crearis/crearis-vue/src/components/clist/ItemRow.vue`
  - `/home/persona/crearis/crearis-vue/src/components/clist/ItemCard.vue`
  - `/home/persona/crearis/crearis-vue/src/components/clist/ItemTile.vue`
  - `/home/persona/crearis/crearis-vue/src/components/images/ImgShape.vue`

- CSS:
  - `/home/persona/crearis/crearis-vue/src/assets/css/01-variables.css`

- Views (Implementation Targets):
  - `/home/persona/crearis/crearis-vue/src/views/BaseView.vue`
  - `/home/persona/crearis/crearis-vue/src/views/Home/HomeComponents/UpcomingEventsSection.vue`
  - `/home/persona/crearis/crearis-vue/src/views/Home/HomeComponents/BlogPostsSection.vue`
  - `/home/persona/crearis/crearis-vue/src/views/admin/AdminActionUsersPanel.vue`
  - (PostPanel.vue - to be located)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for CL1 execution
