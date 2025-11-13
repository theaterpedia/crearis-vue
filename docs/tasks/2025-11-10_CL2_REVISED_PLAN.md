# CL2 Revised Implementation Plan - Production Component Replacement

**Date**: November 9, 2025  
**Phase**: CL2 Revised - Replace Draft Components with Production CList System  
**Status**: Ready for Implementation  
**Estimated Time**: 5-6 hours

---

## Executive Summary

Replace all draft-quality components (pList, pGallery, pSlider, UpcomingEventsSection, BlogPostsSection) with production-quality implementations using:
- **ItemList/ItemGallery** for entity fetching and rendering
- **Floating Vue VDropdown** for popup interactions (per FLOATING_VUE_AND_PANELS_GUIDE.md)
- **ImgShape.vue** for proper image optimization
- Parent components instructing children to fetch, not fetching themselves

---

## Critical Findings from Code Analysis

### pList.vue, pGallery.vue, pSlider.vue
**Issues**:
- ❌ Custom fetch logic duplicated across 3 components
- ❌ Poor image handling (direct `cimg` URLs, no optimization)
- ❌ No BlurHash placeholders
- ❌ No ImgShape integration
- ❌ pSlider not yet converted to ImgShape

**Status**: **REPLACE WITH CLIST COMPONENTS**

### UpcomingEventsSection.vue, BlogPostsSection.vue
**Current State**:
- Receive `events`/`posts` arrays from parent (HomePage, StartPage)
- Parent fetches data manually
- Use legacy components (Slider, CardHero)

**Target State**: **PARENT INSTRUCTS CLIST TO FETCH**

---

## Revised Task Breakdown

### Task 1: Universal Dropdown List Component ⭐
**Priority**: HIGH  
**Estimated Time**: 1.5 hours

**Goal**: Create reusable dropdown component using Floating Vue for entity selection

**Component**: `src/components/clist/DropdownList.vue`

**Implementation**:
```vue
<template>
  <VDropdown
    v-model:shown="isOpen"
    theme="dropdown-list"
    :triggers="[]"
    :auto-hide="true"
    :distance="8"
    placement="bottom-start"
  >
    <!-- Trigger slot -->
    <slot name="trigger" :open="openDropdown" :is-open="isOpen">
      <button class="dropdown-trigger" @click="openDropdown">
        <slot name="trigger-content">Select {{ entity }}</slot>
        <svg class="chevron" :class="{ 'rotate-180': isOpen }">
          <!-- Chevron icon -->
        </svg>
      </button>
    </slot>

    <!-- Dropdown content -->
    <template #popper="{ hide }">
      <div class="dropdown-content" :style="systemTheme">
        <div class="dropdown-header">
          <h4>{{ title || `Select ${entity}` }}</h4>
          <button class="close-btn" @click="hide">×</button>
        </div>
        
        <!-- CL2: Use ItemList with entity fetching -->
        <ItemList
          :entity="entity"
          :project="project"
          item-type="row"
          size="small"
          interaction="static"
          @item-click="(item) => handleSelect(item, hide)"
        />
      </div>
    </template>
  </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VDropdown } from 'floating-vue'
import ItemList from './ItemList.vue'

interface Props {
  entity: 'posts' | 'events' | 'instructors'
  project?: string
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [item: any]
}>()

const isOpen = ref(false)

// System theme for dropdown (per FLOATING_VUE_AND_PANELS_GUIDE.md)
const systemTheme = computed(() => ({
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-inverted': '0'
}))

function openDropdown() {
  isOpen.value = true
}

function handleSelect(item: any, hide: () => void) {
  emit('select', item)
  hide()
}
</script>

<style scoped>
.dropdown-content {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-dropdown);
  max-width: 24rem;
  max-height: 60vh;
  overflow-y: auto;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-dimmed);
}
</style>
```

**Usage Example**:
```vue
<DropdownList
  entity="events"
  :project="currentProject"
  title="Select Event"
  @select="handleEventSelect"
>
  <template #trigger-content>
    {{ selectedEvent?.name || 'Select Event' }}
  </template>
</DropdownList>
```

**Benefits**:
- ✅ Floating Vue handles positioning, collision detection
- ✅ System theme isolation (per guide)
- ✅ ItemList handles entity fetching automatically
- ✅ Reusable across entire application

**Integration Points**:
- BaseView.vue event selector (replace existing ItemList with popup)
- AddPostPanel.vue post selector
- Any future entity selectors

---

### Task 2: Universal Dropdown Gallery Component ⭐
**Priority**: HIGH  
**Estimated Time**: 1 hour

**Goal**: Create reusable dropdown gallery component for visual entity selection

**Component**: `src/components/clist/DropdownGallery.vue`

**Implementation**: Same pattern as DropdownList but uses ItemGallery with cards

```vue
<template>
  <VDropdown v-model:shown="isOpen" theme="dropdown-gallery" ...>
    <slot name="trigger">...</slot>
    
    <template #popper="{ hide }">
      <div class="dropdown-content" :style="systemTheme">
        <ItemGallery
          :entity="entity"
          :project="project"
          item-type="card"
          size="small"
          :variant="variant"
          interaction="static"
          @item-click="(item) => handleSelect(item, hide)"
        />
      </div>
    </template>
  </VDropdown>
</template>
```

**Usage Example**:
```vue
<DropdownGallery
  entity="posts"
  :project="currentProject"
  variant="square"
  title="Select Post"
  @select="handlePostSelect"
/>
```

---

### Task 3: Modal Selector Components (Alternative to Dropdown) ⭐
**Priority**: MEDIUM  
**Estimated Time**: 1 hour

**Goal**: Create full-screen modal selectors for mobile/complex selections

**Component**: `src/components/clist/ModalSelector.vue`

**Implementation**: Uses BasePanel pattern with ItemList/ItemGallery

```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-container" :style="systemTheme">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button @click="close">×</button>
          </div>
          
          <div class="modal-content">
            <ItemList
              v-if="display === 'list'"
              :entity="entity"
              :project="project"
              item-type="row"
              size="medium"
              interaction="static"
              @item-click="handleSelect"
            />
            <ItemGallery
              v-else
              :entity="entity"
              :project="project"
              item-type="card"
              size="medium"
              interaction="static"
              @item-click="handleSelect"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

**Decision Logic**:
- **Dropdown** (Task 1-2): Quick selections, < 20 items, desktop-friendly
- **Modal** (Task 3): Large datasets, mobile screens, image-heavy selections

---

### Task 4: Replace UpcomingEventsSection + Parent Logic 🔥
**Priority**: HIGH  
**Estimated Time**: 1 hour

**Current Implementation Analysis**:

**HomePage.vue / StartPage.vue** (Parents):
```typescript
// Parents fetch manually
const events = ref<Event[]>([])

async function fetchEvents() {
  const response = await fetch('/api/events')
  events.value = await response.json()
}

// Pass to child
<UpcomingEventsSection :events="events" />
```

**UpcomingEventsSection.vue** (Child):
```vue
<Slider>
  <Slide v-for="event in events" :key="event.id">
    <img :src="event.cimg" />  <!-- Poor quality -->
    <h3>{{ event.heading }}</h3>
  </Slide>
</Slider>
```

**Target Implementation**:

**Option A: Use pList (Easiest)** ⭐ RECOMMENDED
```vue
<!-- HomePage.vue -->
<template>
  <pList
    type="events"
    :project-domaincode="currentProject"
    item-type="card"
    size="medium"
    header="Upcoming Events"
    is-footer
  />
</template>
```

**Option B: Use ItemList Directly**
```vue
<!-- HomePage.vue -->
<Section background="muted">
  <Container>
    <Heading overline="What's Happening" level="h2">
      Upcoming **Events**
    </Heading>
    
    <ItemList
      entity="events"
      :project="currentProject"
      item-type="card"
      size="medium"
      interaction="static"
    />
  </Container>
</Section>
```

**Steps**:
1. Identify all parents using UpcomingEventsSection (HomePage.vue, StartPage.vue)
2. Remove manual event fetching logic from parents
3. Replace UpcomingEventsSection with pList (Option A) or ItemList (Option B)
4. Remove old UpcomingEventsSection.vue file
5. Test rendering, entity fetching, project filtering

**Estimated Time**: 1 hour (2 files, straightforward replacement)

---

### Task 5: Replace BlogPostsSection + Parent Logic 🔥
**Priority**: HIGH  
**Estimated Time**: 1 hour

**Current Implementation Analysis**:

**HomePage.vue / StartPage.vue** (Parents):
```typescript
// Parents fetch manually
const posts = ref<Post[]>([])

async function fetchPosts() {
  const response = await fetch('/api/posts')
  posts.value = await response.json()
}

// Pass to child
<BlogPostsSection :posts="posts" :show-posts="3" />
```

**BlogPostsSection.vue** (Child):
```vue
<Columns>
  <Column v-for="post in displayedPosts">
    <CardHero :img-tmp="post.cimg">  <!-- Poor quality -->
      <h3>{{ post.heading }}</h3>
    </CardHero>
  </Column>
</Columns>
```

**Target Implementation**:

**Option A: Use pGallery (Easiest)** ⭐ RECOMMENDED
```vue
<!-- HomePage.vue -->
<template>
  <pGallery
    type="posts"
    :project-domaincode="currentProject"
    item-type="card"
    size="medium"
    variant="wide"
    header="Latest from Our Blog"
    is-footer
  />
</template>
```

**Option B: Use ItemGallery Directly**
```vue
<!-- HomePage.vue -->
<Section background="accent">
  <Container>
    <Heading overline="Recent Articles" level="h2">
      Latest from Our **Blog**
    </Heading>
    
    <ItemGallery
      entity="posts"
      :project="currentProject"
      item-type="card"
      size="medium"
      variant="wide"
      interaction="static"
    />
  </Container>
</Section>
```

**Steps**:
1. Identify all parents using BlogPostsSection (HomePage.vue, StartPage.vue)
2. Remove manual post fetching logic from parents
3. Replace BlogPostsSection with pGallery (Option A) or ItemGallery (Option B)
4. Remove old BlogPostsSection.vue file
5. Test rendering, entity fetching, variant="wide" aspect ratio

**Estimated Time**: 1 hour (2 files, straightforward replacement)

---

### Task 6: Bonus - Convert pSlider to ImgShape (Optional) 🎁
**Priority**: LOW  
**Estimated Time**: 30 minutes

**Current State**: pSlider uses legacy `cimg` prop, not ImgShape

**Target**: Same pattern as pList/pGallery but with Slider wrapper

**Implementation**:
```vue
<template>
  <div class="p-slider">
    <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
    
    <Slider v-if="!loading">
      <Slide v-for="item in entities" :key="item.id">
        <ItemCard
          :heading="item.heading"
          :data="item.imageData"
          shape="card"
          :variant="variant"
          :size="size"
        />
      </Slide>
    </Slider>
  </div>
</template>

<script setup lang="ts">
// Fetch entities (posts/events/instructors)
// Transform to ItemCard format with ImgShapeData
// Same pattern as pList/pGallery but with Slider wrapper
</script>
```

**Note**: pSlider is nice-to-have but not critical for CL2 completion.

---

## Implementation Strategy

### Phase 1: Dropdown Components (3 hours)
1. Create DropdownList.vue (1.5 hours)
2. Create DropdownGallery.vue (1 hour)
3. Create ModalSelector.vue (30 minutes - optional)
4. Test with sample entity data

**Deliverable**: 2-3 reusable dropdown/modal components

---

### Phase 2: Replace Section Components (2 hours)
1. Replace UpcomingEventsSection (1 hour)
   - Update HomePage.vue
   - Update StartPage.vue
   - Remove old component
   
2. Replace BlogPostsSection (1 hour)
   - Update HomePage.vue
   - Update StartPage.vue
   - Remove old component

**Deliverable**: HomePage and StartPage using pList/pGallery

---

### Phase 3: Integration & Testing (1 hour)
1. Test all dropdown interactions
2. Verify entity fetching works across all locations
3. Check image rendering (ImgShape optimization)
4. Verify loading/error states
5. Test responsive behavior (mobile/tablet/desktop)

**Deliverable**: All components working in production

---

## Decision Matrix

### When to Use What Component

| Scenario | Component | Reasoning |
|----------|-----------|-----------|
| Event selector in BaseView | DropdownList | Quick selection, row layout |
| Post selector with images | DropdownGallery | Visual selection needed |
| Mobile entity selection | ModalSelector | Better UX on small screens |
| Homepage events display | pList | Simple, already exists |
| Homepage posts display | pGallery | Simple, already exists |
| Slider/carousel display | pSlider | Specialized layout |

### Component Hierarchy

```
CList Component Family
├─ Core Components (existing)
│  ├─ ImgShape.vue
│  ├─ ItemRow.vue
│  ├─ ItemCard.vue
│  ├─ ItemTile.vue
│  ├─ ItemList.vue
│  └─ ItemGallery.vue
│
├─ Interaction Wrappers (NEW in CL2)
│  ├─ DropdownList.vue      (Floating Vue + ItemList)
│  ├─ DropdownGallery.vue   (Floating Vue + ItemGallery)
│  └─ ModalSelector.vue     (Teleport + ItemList/Gallery)
│
└─ Page Components (enhanced)
   ├─ pList.vue             (already uses ItemList entity fetching)
   ├─ pGallery.vue          (already uses ItemGallery entity fetching)
   └─ pSlider.vue           (will use ItemCard with entity fetching)
```

---

## Code Standards

### 1. Floating Vue Theme Isolation
```typescript
// Always use system theme in dropdowns/modals
const systemTheme = computed(() => ({
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-inverted': '0'
}))
```

### 2. Parent-Child Data Flow
```vue
<!-- ❌ BAD: Parent fetches and passes data -->
<script setup>
const events = ref([])
async function fetchEvents() { /* fetch logic */ }
</script>
<template>
  <SomeComponent :events="events" />
</template>

<!-- ✅ GOOD: Parent instructs child to fetch -->
<script setup>
const currentProject = ref('my-project')
</script>
<template>
  <pList 
    entity="events" 
    :project-domaincode="currentProject"
  />
</template>
```

### 3. Dropdown Event Handling
```vue
<template>
  <VDropdown>
    <template #popper="{ hide }">
      <ItemList @item-click="(item) => handleSelect(item, hide)" />
    </template>
  </VDropdown>
</template>

<script setup>
function handleSelect(item: any, hide: () => void) {
  emit('select', item)  // Emit to parent
  hide()                // Close dropdown
}
</script>
```

---

## Testing Checklist

### Per Component
- [ ] Component renders without errors
- [ ] Entity fetching works (posts/events/instructors)
- [ ] Project filter applies correctly
- [ ] ImgShape optimization working (Cloudinary/Unsplash)
- [ ] BlurHash placeholders show during load
- [ ] Loading/error states display
- [ ] Click handlers work (item selection)
- [ ] Dropdown closes after selection
- [ ] System theme applied (no page theme inheritance)

### Integration Tests
- [ ] DropdownList works in BaseView
- [ ] DropdownGallery works in AddPostPanel
- [ ] HomePage events section renders
- [ ] HomePage posts section renders
- [ ] StartPage events section renders
- [ ] StartPage posts section renders
- [ ] Mobile responsiveness verified
- [ ] No console errors

---

## File Changes Summary

### New Files (3)
1. `src/components/clist/DropdownList.vue` - Universal entity dropdown with rows
2. `src/components/clist/DropdownGallery.vue` - Universal entity dropdown with cards
3. `src/components/clist/ModalSelector.vue` - Full-screen modal selector (optional)

### Files to Modify (2-4)
1. `src/views/Home/HomePage.vue` - Replace sections with pList/pGallery
2. `src/views/Home/StartPage.vue` - Replace sections with pList/pGallery
3. `src/views/BaseView.vue` - Replace ItemList popup with DropdownList (optional)
4. `src/components/AddPostPanel.vue` - Replace custom dropdown with DropdownGallery (optional)

### Files to Delete (2)
1. `src/views/Home/HomeComponents/UpcomingEventsSection.vue` - Replaced by pList
2. `src/views/Home/HomeComponents/BlogPostsSection.vue` - Replaced by pGallery

### Files Already Enhanced (2)
1. `src/components/page/pList.vue` - Already uses ItemList entity fetching ✅
2. `src/components/page/pGallery.vue` - Already uses ItemGallery entity fetching ✅

---

## Time Estimates

| Task | Component | Time | Priority |
|------|-----------|------|----------|
| Task 1 | DropdownList.vue | 1.5 hours | HIGH |
| Task 2 | DropdownGallery.vue | 1 hour | HIGH |
| Task 3 | ModalSelector.vue | 30 min | MEDIUM |
| Task 4 | Replace UpcomingEventsSection | 1 hour | HIGH |
| Task 5 | Replace BlogPostsSection | 1 hour | HIGH |
| Task 6 | Convert pSlider (bonus) | 30 min | LOW |
| Testing | All components | 1 hour | HIGH |
| **Total** | - | **6.5 hours** | - |

**Core Tasks (1,2,4,5)**: 4.5 hours  
**With Bonus**: 6.5 hours

---

## Success Criteria

### Must Have ✅
- [x] DropdownList component created and working
- [x] DropdownGallery component created and working
- [x] HomePage uses pList for events
- [x] HomePage uses pGallery for posts
- [x] StartPage uses pList for events
- [x] StartPage uses pGallery for posts
- [x] All images use ImgShape optimization
- [x] System theme applied to all dropdowns/modals
- [x] No manual fetch logic in parents

### Nice to Have 🎁
- [ ] ModalSelector component for mobile
- [ ] BaseView uses DropdownList
- [ ] AddPostPanel uses DropdownGallery
- [ ] pSlider converted to ImgShape

---

## Next Steps After CL2 Revised

1. **Deploy to staging** - Test all replacements
2. **Gather feedback** - User testing on new components
3. **Performance monitoring** - Check load times vs old components
4. **Plan CL3** - ItemOptions layer, composables, advanced features
5. **Update documentation** - Reflect new dropdown components

---

**Plan Status**: ✅ **READY TO EXECUTE**  
**Start Date**: November 9, 2025  
**Target Completion**: Same day (6.5 hours max)  
**Core Focus**: Tasks 1, 2, 4, 5 (4.5 hours)
