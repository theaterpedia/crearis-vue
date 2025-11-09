# CL2 Implementation Guide - CList Component Mounting

**Date**: November 9, 2025  
**Phase**: CL2 - Mount on 5 Production Locations  
**Status**: Ready for Implementation  
**Estimated Time**: 4-5 hours

---

## Overview

Mount clist components (ItemList/ItemGallery with ItemRow/ItemCard) on 5 production locations. Each location has specific requirements for entity type, interaction mode, and display format.

---

## Prerequisites ✅

- [x] CL1 analysis complete - no conflicts found
- [x] Components production-ready (ItemRow/Card/Tile/List/Gallery)
- [x] CSS dimensions aligned (336×224px card, 128×64px tile, 64px avatar)
- [x] Documentation updated (IMAGE_SYSTEM_COMPLETE.md)

---

## Implementation Locations

### 1. BaseView.vue - Event Selector
**Location**: `src/views/BaseView.vue`  
**Purpose**: Select event when editing post/image entity  
**Component**: `ItemList` with `ItemRow`  
**Interaction**: `popup` (modal overlay)  

**Current State**: Uses custom event selector logic  
**Target State**: Replace with standardized ItemList

**Props Configuration**:
```vue
<ItemList
  v-model="showEventSelector"
  entity="events"
  :project="currentProject"
  itemType="row"
  size="medium"
  interaction="popup"
  title="Select Event"
  @close="handleEventClose"
/>
```

**Data Transformation**:
```typescript
// Current: Custom event list
const events = ref<Event[]>([])

// After: ItemList handles fetching
// Just provide entity="events" and optional project filter
```

**Integration Steps**:
1. Import ItemList component
2. Add v-model for popup state
3. Replace custom event selector with ItemList
4. Handle @close event to capture selected event
5. Remove old event fetching logic
6. Test with project filter

**Estimated Time**: 45 minutes

---

### 2. PostPanel.vue - Post Selector
**Location**: `src/components/panels/PostPanel.vue`  
**Purpose**: Select related posts when editing current post  
**Component**: `ItemList` with `ItemCard`  
**Interaction**: `popup` (modal overlay)

**Current State**: Uses custom post selector logic  
**Target State**: Replace with standardized ItemList

**Props Configuration**:
```vue
<ItemList
  v-model="showPostSelector"
  entity="posts"
  :project="currentProject"
  itemType="card"
  size="small"
  variant="square"
  interaction="popup"
  title="Select Related Posts"
  @close="handlePostClose"
/>
```

**Data Transformation**:
```typescript
// Current: Custom post list with thumbnails
const relatedPosts = ref<Post[]>([])

// After: ItemList handles fetching
// Use variant="square" to fetch img_square field
```

**Integration Steps**:
1. Import ItemList component
2. Add v-model for popup state
3. Replace custom post selector with ItemList
4. Handle @close event to capture selected posts
5. Remove old post fetching logic
6. Test with img_square variant

**Estimated Time**: 45 minutes

---

### 3. AdminActionUsersPanel.vue - Image Selector
**Location**: `src/components/panels/AdminActionUsersPanel.vue`  
**Purpose**: Select images for user management actions  
**Component**: `ItemList` with `ItemCard`  
**Interaction**: `popup` (modal overlay)

**Current State**: Custom image selection UI  
**Target State**: Replace with standardized ItemList

**Props Configuration**:
```vue
<ItemList
  v-model="showImageSelector"
  :images="availableImageIds"
  itemType="card"
  size="medium"
  variant="default"
  interaction="popup"
  title="Select Image"
  @close="handleImageClose"
/>
```

**⚠️ REQUIRES NEW FEATURE**: `images` prop with specific image ID fetching

**Implementation Options**:
1. **Option A**: Implement `images` prop now (adds 1 hour)
2. **Option B**: Use `entity="posts"` as temporary workaround, implement `images` in CL3
3. **Option C**: Keep current custom logic, revisit in CL3

**Recommendation**: **Option B** - Use `entity="posts"` with project filter for now, full `images` support in CL3

**Modified Props** (Option B):
```vue
<ItemList
  v-model="showImageSelector"
  entity="posts"
  :project="currentProject"
  itemType="card"
  size="medium"
  variant="default"
  interaction="popup"
  title="Select Image"
  @close="handleImageClose"
/>
```

**Integration Steps**:
1. Import ItemList component
2. Add v-model for popup state
3. Replace custom image selector with ItemList (entity="posts")
4. Handle @close event to capture selected image
5. Extract image data from selected post
6. Add TODO comment for `images` prop in CL3

**Estimated Time**: 1 hour (including workaround logic)

---

### 4. UpcomingEventsSection.vue - Event Preview
**Location**: `src/components/sections/UpcomingEventsSection.vue`  
**Purpose**: Display upcoming events on dashboard/home  
**Component**: `ItemList` with `ItemCard`  
**Interaction**: `static` (always visible)

**Current State**: Custom event display logic  
**Target State**: Replace with standardized ItemList

**Props Configuration**:
```vue
<ItemList
  entity="events"
  :project="currentProject"
  itemType="card"
  size="medium"
  variant="default"
  interaction="static"
/>
```

**Data Transformation**:
```typescript
// Current: Custom event fetching with filters
const upcomingEvents = ref<Event[]>([])
const fetchUpcomingEvents = async () => { /* custom logic */ }

// After: ItemList handles fetching
// Note: May need to add date filtering in CL3
```

**Integration Steps**:
1. Import ItemList component
2. Replace custom event list with ItemList
3. Remove old event fetching logic
4. Test grid layout rendering
5. Verify card sizing (336×260px default)

**Estimated Time**: 30 minutes

---

### 5. BlogPostsSection.vue - Blog Gallery
**Location**: `src/components/sections/BlogPostsSection.vue`  
**Purpose**: Display blog posts in gallery layout  
**Component**: `ItemGallery` with `ItemCard`  
**Interaction**: `static` (always visible)

**Current State**: Custom blog post gallery logic  
**Target State**: Replace with standardized ItemGallery

**Props Configuration**:
```vue
<ItemGallery
  entity="posts"
  :project="currentProject"
  itemType="card"
  size="medium"
  variant="wide"
  interaction="static"
/>
```

**Data Transformation**:
```typescript
// Current: Custom post gallery with thumbnails
const blogPosts = ref<Post[]>([])
const fetchBlogPosts = async () => { /* custom logic */ }

// After: ItemGallery handles fetching
// Use variant="wide" for 336×168px aspect ratio
```

**Integration Steps**:
1. Import ItemGallery component
2. Replace custom post gallery with ItemGallery
3. Remove old post fetching logic
4. Test gallery grid layout
5. Verify wide variant rendering (336×168px)

**Estimated Time**: 30 minutes

---

## Component Import Reference

```typescript
import ItemList from '@/components/clist/ItemList.vue'
import ItemGallery from '@/components/clist/ItemGallery.vue'
```

**Note**: ItemRow, ItemCard, ItemTile are imported automatically by ItemList/ItemGallery based on `itemType` prop.

---

## Props Quick Reference

### ItemList / ItemGallery Common Props

```typescript
interface Props {
  // Data source (choose one)
  items?: ListItem[]                              // Manual items array
  entity?: 'posts' | 'events' | 'instructors'     // Auto-fetch from API
  images?: number[]                               // Specific image IDs (CL3)
  project?: string                                // Filter by domaincode
  
  // Display
  itemType?: 'tile' | 'card' | 'row'              // Component type (default: 'row' for List, 'card' for Gallery)
  size?: 'small' | 'medium' | 'large'             // Size variant (default: 'medium')
  variant?: 'default' | 'square' | 'wide' | 'vertical'  // Aspect ratio (default: 'default')
  
  // Interaction
  interaction?: 'static' | 'popup' | 'zoom'       // Display mode (default: 'static')
  modelValue?: boolean                            // Popup open/close state (v-model)
  title?: string                                  // Popup title
}
```

### ItemRow Props (via itemType="row")

```typescript
interface ItemRowProps {
  heading: string           // Parsed by HeadingParser
  cimg?: string            // Legacy image URL (deprecated)
  data?: ImgShapeData      // Image data (production standard)
  shape?: 'card' | 'tile' | 'avatar'
  variant?: 'default' | 'square' | 'wide' | 'vertical'
  size?: 'small' | 'medium' | 'large'
  // Slot: default (right column, e.g., buttons)
}
```

**Sizes**: small (60px), medium (80px), large (100px)

### ItemCard Props (via itemType="card")

```typescript
interface ItemCardProps {
  heading: string           // Parsed by HeadingParser
  cimg?: string            // Legacy image URL (deprecated)
  data?: ImgShapeData      // Image data (production standard)
  shape?: 'card' | 'tile' | 'avatar'
  variant?: 'default' | 'square' | 'wide' | 'vertical'
  size?: 'small' | 'medium' | 'large'
  // Slot: default (card-meta, e.g., badges, date)
}
```

**Sizes**: small (195px), medium (260px), large (325px)

### ItemTile Props (via itemType="tile")

```typescript
interface ItemTileProps {
  heading: string           // Parsed by HeadingParser
  cimg?: string            // Legacy image URL (deprecated)
  data?: ImgShapeData      // Image data (production standard)
  shape?: 'card' | 'tile' | 'avatar'
  variant?: 'default' | 'square' | 'wide' | 'vertical'
  size?: 'small' | 'medium' | 'large'
}
```

**Sizes**: small (120px), medium (160px), large (200px)

---

## Data Transformation Examples

### Example 1: Event Selector (BaseView.vue)

**Before** (Custom Logic):
```typescript
// Fetch events manually
const events = ref<Event[]>([])
const loading = ref(false)

const fetchEvents = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/events?project=${currentProject.value}`)
    events.value = await response.json()
  } finally {
    loading.value = false
  }
}

// Render with custom template
<div v-for="event in events" :key="event.id" @click="selectEvent(event)">
  <img :src="event.img_thumb" />
  <h4>{{ event.title }}</h4>
</div>
```

**After** (ItemList):
```vue
<ItemList
  v-model="showEventSelector"
  entity="events"
  :project="currentProject"
  itemType="row"
  size="medium"
  interaction="popup"
  title="Select Event"
/>
```

### Example 2: Blog Gallery (BlogPostsSection.vue)

**Before** (Custom Logic):
```typescript
const blogPosts = ref<Post[]>([])

const fetchBlogPosts = async () => {
  const response = await fetch(`/api/posts?project=${currentProject.value}`)
  blogPosts.value = await response.json()
}

// Custom grid layout
<div class="blog-gallery">
  <div v-for="post in blogPosts" :key="post.id" class="blog-card">
    <img :src="post.img_thumb" />
    <h3>{{ post.title }}</h3>
  </div>
</div>
```

**After** (ItemGallery):
```vue
<ItemGallery
  entity="posts"
  :project="currentProject"
  itemType="card"
  size="medium"
  variant="wide"
  interaction="static"
/>
```

---

## API Response Format

ItemList/ItemGallery expects this format from `/api/posts`, `/api/events`, `/api/instructors`:

```typescript
interface EntityItem {
  id: number
  title?: string              // Display heading
  entityname?: string         // Fallback for heading
  img_thumb?: string          // JSON string: ImgShapeData (variant="default")
  img_square?: string         // JSON string: ImgShapeData (variant="square")
}

// img_thumb / img_square JSON structure:
{
  "url": "https://res.cloudinary.com/little-papillon/image/upload/v1234567890/folder/image.jpg",
  "x": 0.5,      // focal point x (0-1, optional)
  "y": 0.3,      // focal point y (0-1, optional)
  "z": 1.2,      // zoom level (optional)
  "options": {}  // additional options (optional)
}
```

**Note**: If `img_thumb` or `img_square` is missing or invalid JSON, a placeholder will be displayed.

---

## Testing Checklist

### Per Location Testing

For each of the 5 locations, verify:

- [ ] **Component renders** - No console errors on mount
- [ ] **Images load** - Cloudinary/Unsplash URLs optimized correctly
- [ ] **Dimensions correct** - Card (336×224px), Tile (128×64px), Avatar (64px)
- [ ] **Size variants work** - small/medium/large render with correct heights
- [ ] **Aspect variants work** - default/square/wide/vertical display correctly
- [ ] **Entity fetching works** - Data loads from `/api/{entity}`
- [ ] **Project filter works** - `?project=domaincode` applied when provided
- [ ] **Loading state shows** - "Loading..." appears during fetch
- [ ] **Error state shows** - Error message appears if fetch fails
- [ ] **Interaction mode works** - static/popup/zoom functions correctly
- [ ] **Hover effects work** - Transform and shadow on hover
- [ ] **HeadingParser works** - Markdown/colored headings render
- [ ] **Responsive layout** - Grid adjusts to viewport width
- [ ] **BlurHash placeholders** - Blur effect shows while loading (if blur data exists)

### Integration Testing

After all 5 locations implemented:

- [ ] **No layout breaks** - Existing UI not disrupted
- [ ] **No performance issues** - No lag when rendering large lists
- [ ] **No memory leaks** - Component cleanup on unmount
- [ ] **Consistent styling** - All locations use same design language
- [ ] **Cross-browser** - Test in Chrome, Firefox, Safari

---

## Rollback Plan

If critical issues discovered during CL2:

1. **Preserve old code** - Comment out, don't delete
2. **Add feature flag** - `const USE_CLIST = false` to toggle
3. **Test thoroughly** - Verify old code still works
4. **Document issues** - Create bug report for CL3 fix

**Rollback Template**:
```vue
<!-- CL2: New clist implementation -->
<ItemList
  v-if="USE_CLIST"
  entity="events"
  itemType="row"
/>

<!-- Legacy: Old implementation (fallback) -->
<div v-else class="old-event-selector">
  <!-- Keep old code here until CL2 stable -->
</div>
```

---

## Post-Implementation

After all 5 locations working:

1. **Remove old code** - Delete commented legacy implementations
2. **Update components** - Remove unused imports/props
3. **Document changes** - Update component documentation
4. **Create examples** - Add to component showcase/storybook
5. **Plan CL3** - Identify enhancements (ItemOptions, PreviewModal, composables)

---

## Known Limitations (Defer to CL3)

1. **`images` prop not implemented** - Use `entity` workaround for now
2. **`entity='all'` not implemented** - Fetch single entity type only
3. **No multi-select** - Selection logic in CL3 (useItemSelection composable)
4. **No filtering** - Client-side filtering in CL3
5. **No sorting** - Client-side sorting in CL3
6. **No pagination** - All items loaded at once (add in CL3 for large lists)
7. **No PreviewModal** - Zoom mode is temporary, full modal in CL3

---

## Time Estimates

| Location | Component | Interaction | Estimated Time |
|----------|-----------|-------------|----------------|
| BaseView.vue | ItemList + Row | popup | 45 min |
| PostPanel.vue | ItemList + Card | popup | 45 min |
| AdminActionUsersPanel.vue | ItemList + Card | popup | 1 hour (workaround) |
| UpcomingEventsSection.vue | ItemList + Card | static | 30 min |
| BlogPostsSection.vue | ItemGallery + Card | static | 30 min |
| **Testing & Integration** | - | - | 1 hour |
| **Total** | - | - | **4.5 hours** |

---

## Next Steps After CL2

1. **Test in production** - Deploy to staging, verify all locations
2. **Gather feedback** - User testing, identify pain points
3. **Plan CL3** - Prioritize enhancements based on feedback
4. **Implement CL3** - 4-tier architecture, ItemOptions, composables
5. **Implement CL4** - Advanced features (virtual scroll, animations)

---

**CL2 Ready** ✅  
**Start Implementation**: November 9, 2025  
**Target Completion**: Same day (4.5 hours)
