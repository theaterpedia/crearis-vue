# PageLayout Architecture - Integration Strategy & Recommendations

## Executive Summary

This document provides architectural guidance for integrating PageLayout.vue with content-specific components (ProjectSite, EventPage, PostPage) in a unified page layout system. It addresses three critical questions about nesting strategy, navigation refactoring, and heading content management.

## Context

**Source Project**: Nuxt-based system with layouts in `/layouts/default.vue`  
**Target Project**: Vite + Vue Router system  
**Goal**: Unified layout handling across multiple content types (projects, events, posts)

### Current Implementation Status

✅ **Completed:**
- PageLayout.vue ported from Nuxt project
- Missing imports fixed (useRoute, useWindowScroll from @vueuse/core)
- Missing props identified and mocked with TODOs
- Component imports added (AlertBanner, Box, TopNav, Sidebar, etc.)
- Header component commented out (doesn't exist yet)

⚠️ **Requires Decision:**
- Nesting strategy (Layout → Content vs Content → Layout)
- Navigation component choice (Navbar.vue vs TopNav.vue)
- Heading content management approach

---

## Question A: Content-Layout Nesting Strategy

### Strategy 1: Layout Contains Content ⭐ RECOMMENDED

**Pattern**: `PageLayout` → Router loads layout with content switched via slots/props

```
Route → PageLayout.vue (outer)
         ├─ Header slot → provided by route metadata
         ├─ Default slot → <Component :is="contentComponent" />
         └─ Footer (standard)
```

**Implementation:**
```typescript
// router/index.ts
{
  path: '/projects/:domaincode',
  component: PageLayout,
  props: (route) => ({
    contentType: 'project',
    contentId: route.params.domaincode
  })
}

// PageLayout.vue
<template>
  <div class="page-wrapper">
    <TopNav />
    <slot name="header">
      <ProjectHeader v-if="contentType === 'project'" :data="contentData" />
      <EventHeader v-if="contentType === 'event'" :data="contentData" />
    </slot>
    <Box>
      <main>
        <ProjectContent v-if="contentType === 'project'" :data="contentData" />
        <EventContent v-if="contentType === 'event'" :data="contentData" />
      </main>
      <SideContent v-if="showAside">...</SideContent>
    </Box>
    <Footer />
  </div>
</template>
```

**Pros:**
- ✅ **DRY**: Single layout definition, no duplication
- ✅ **Consistency**: Layout settings apply uniformly across all pages
- ✅ **Centralized control**: One place to manage layout behavior
- ✅ **Nuxt-compatible**: Matches original Nuxt pattern
- ✅ **Easy theme switching**: Layout controls theme, sidebar, fullwidth modes

**Cons:**
- ❌ **Complex routing**: Need route metadata or dynamic component resolution
- ❌ **Props drilling**: Content data needs to be fetched and passed down
- ❌ **Less flexible**: Harder to create one-off layouts for special pages

**Best For:**
- Large applications with many content types
- Systems requiring strict layout consistency
- Teams migrating from Nuxt layouts pattern

---

### Strategy 2: Content Loads Layout

**Pattern**: `ProjectSite.vue` → Imports and wraps content in `PageLayout`

```
Route → ProjectSite.vue (outer)
         └─ PageLayout.vue (imported)
             ├─ Header slot → ProjectHeader
             ├─ Default slot → Project content
             └─ Footer
```

**Implementation:**
```vue
<!-- ProjectSite.vue -->
<template>
  <PageLayout>
    <template #header>
      <Hero :cimg="project.cimg" :heading="project.heading" />
    </template>
    
    <!-- Main content -->
    <Section>
      <Container>
        <Prose v-html="project.md_html" />
      </Prose>
    </Section>
    
    <!-- Events, posts, team -->
    <ProjectEvents :project-id="project.id" />
    <ProjectPosts :project-id="project.id" />
  </PageLayout>
</template>

<script setup>
const route = useRoute()
const project = ref(null)

onMounted(async () => {
  project.value = await fetchProject(route.params.domaincode)
})
</script>
```

**Pros:**
- ✅ **Simple routing**: Standard Vue Router, one route → one component
- ✅ **Data colocation**: Content component owns data fetching
- ✅ **Flexible**: Easy to customize layout per page
- ✅ **Clear hierarchy**: Parent-child relationship is obvious
- ✅ **Easier debugging**: Less indirection

**Cons:**
- ❌ **Duplication risk**: Layout settings repeated in multiple places
- ❌ **Inconsistency risk**: Each page might configure layout differently
- ❌ **More boilerplate**: Every content component imports and wraps PageLayout

**Best For:**
- Smaller applications (3-10 content types)
- Prototyping and rapid iteration
- Projects with diverse layout requirements per page
- **Your current project** (demo-data with projects, events, posts, instructors)

---

### Recommendation: **Strategy 2 (Content Loads Layout)** ⭐

**Rationale:**
1. **Project Scale**: You have ~4 content types (projects, events, posts, instructors) - manageable without layout abstraction
2. **Current Pattern**: ProjectSite.vue already exists and follows this pattern
3. **Flexibility**: Each content type has unique requirements (events have dates, posts have authors)
4. **Migration Path**: Easier to refactor later if you need Strategy 1
5. **Team Velocity**: Less architectural complexity = faster development

**Implementation Plan:**
```
1. Keep ProjectSite.vue as outer component
2. Import PageLayout inside ProjectSite
3. Use slots to provide header, content, sidebar
4. Repeat pattern for EventPage, PostPage, InstructorPage
5. Extract common layout settings to composable if duplication occurs
```

---

## Question B: Navigation Refactoring (Navbar.vue vs TopNav.vue)

### Current State Analysis

**Navbar.vue** (Existing):
- Task manager specific (UserMenu, AdminMenu, RoleToggle)
- Slot-based menu system (`<slot name="menus">`)
- Simple horizontal layout
- Good for admin/dashboard interfaces

**TopNav.vue** (From Nuxt):
- Public-facing navigation with mega-menus
- Hierarchical menu structure (items with children)
- Mobile hamburger menu with ToggleMenu dropdown
- Scroll behavior (overlay, reappear, sticky)
- Desktop hover dropdowns, mobile click dropdowns

### Decision Matrix

| Feature | Navbar.vue | TopNav.vue | Winner |
|---------|------------|------------|--------|
| Mega-menus | ❌ | ✅ | TopNav |
| Scroll behavior | ❌ | ✅ | TopNav |
| Mobile menu | Basic | Advanced | TopNav |
| Slot flexibility | ✅ | Partial | Navbar |
| Admin integration | ✅ | ❌ | Navbar |
| Public site suitability | ❌ | ✅ | TopNav |

### Recommendation: **Hybrid Approach** 🚀

**Keep Navbar.vue for:**
- Admin dashboard pages (tasks, releases, admin menu)
- Authenticated user pages
- Internal tools and management interfaces

**Use TopNav.vue for:**
- Public-facing pages (ProjectSite, EventPage, PostPage)
- Marketing/landing pages
- Content-heavy pages with navigation hierarchy

**Integration with PageLayout:**

```vue
<!-- PageLayout.vue -->
<template>
  <div class="page-wrapper">
    <!-- Public navigation -->
    <div v-if="!isAdminMode" class="topnav-wrapper">
      <TopNav :items="mainMenuItems" :scrollStyle="scrollStyle">
        <template #actions>
          <!-- User menu, admin menu via floating-vue -->
          <UserMenuButton v-if="user" />
          <AdminMenuButton v-if="isAdmin" />
          <EditPanelButton v-if="canEdit" />
        </template>
      </TopNav>
    </div>
    
    <!-- Admin navigation -->
    <Navbar v-else :user="user">
      <template #menus>
        <AdminMenu />
      </template>
    </Navbar>
    
    <!-- Rest of layout -->
  </div>
</template>
```

**Refactoring Plan:**

1. **Phase 1: Coexistence** (Current state)
   - Keep both components
   - Use Navbar for admin pages
   - Use TopNav for public pages
   - No immediate refactoring needed

2. **Phase 2: Menu Unification** (Future)
   - Extract UserMenu and AdminMenu from Navbar
   - Convert to Floating Vue dropdowns
   - Add to TopNav's actions slot
   - Deprecated Navbar for public pages

3. **Phase 3: Full Migration** (Optional)
   - Consolidate to TopNav with admin mode prop
   - Remove Navbar.vue entirely
   - Timeline: 8-12 hours of work

**Recommendation**: **Start with Phase 1** - no immediate refactoring needed. Both components serve different purposes and can coexist.

---

## Question C: Page Heading Content Management

### Option 1: PageLayout.vue Handles Heading ❌ Not Recommended

**Implementation:**
```vue
<!-- PageLayout.vue -->
<template #header>
  <PageHeader 
    :cimg="cimg" 
    :headerType="headerType"
    :heading="heading"
    :teaser="teaser"
  />
</template>

<script setup>
// PageLayout receives heading data as props
const props = defineProps<{
  cimg: string
  headerType: string
  heading: string
  teaser: string
}>()
</script>
```

**Problems:**
- ❌ **Props explosion**: PageLayout needs to know about every content field
- ❌ **Tight coupling**: Layout depends on content structure
- ❌ **Difficult extension**: Adding new content types requires changing layout
- ❌ **Data fetching**: Layout would need to fetch content data

---

### Option 2: Content Components Handle Heading ⭐ RECOMMENDED

**Implementation:**
```vue
<!-- ProjectSite.vue -->
<template>
  <PageLayout>
    <template #header>
      <Hero 
        :cimg="project.cimg"
        :heading="project.heading"
        :teaser="project.teaser"
        :headerType="project.header_type"
        :headerSize="project.header_size"
      />
    </template>
    
    <Section>
      <!-- Project content -->
    </Section>
  </PageLayout>
</template>

<script setup>
const project = ref(null)
onMounted(async () => {
  project.value = await fetchProject(route.params.domaincode)
})
</script>
```

**Advantages:**
- ✅ **Data ownership**: Content component owns its data
- ✅ **Flexibility**: Each content type can customize header
- ✅ **Clear responsibility**: Content fetches data, layout provides structure
- ✅ **Easy to extend**: New content types don't affect layout

---

### Option 3: Separate PageHeading Component 🚀 BEST PRACTICE

**Implementation:**
```vue
<!-- components/PageHeading.vue -->
<template>
  <Hero 
    v-if="data.cimg || data.header_type === 'hero'"
    :cimg="data.cimg"
    :heading="data.heading"
    :teaser="data.teaser"
  />
  <Banner v-else>
    <Prose>
      <h1>{{ data.heading }}</h1>
      <p>{{ data.teaser }}</p>
    </Prose>
  </Banner>
</template>

<script setup>
interface HeadingData {
  heading: string
  teaser?: string
  cimg?: string
  header_type?: 'simple' | 'hero' | 'banner' | 'minimal'
  header_size?: 'mini' | 'small' | 'medium' | 'large' | 'full' | 'prominent'
}

defineProps<{ data: HeadingData }>()
</script>
```

**Usage in ProjectSite.vue:**
```vue
<template>
  <PageLayout>
    <template #header>
      <PageHeading :data="project" />
    </template>
    <!-- Rest of content -->
  </PageLayout>
</template>
```

**Advantages:**
- ✅ **Reusable**: One component for all content types
- ✅ **Standardized**: Consistent heading behavior across pages
- ✅ **Maintainable**: One place to update heading logic
- ✅ **Smart defaults**: Can provide fallback behavior
- ✅ **Extensible**: Easy to add new heading types
- ✅ **Type-safe**: TypeScript interface for heading data

**Extended for content-specific needs:**
```vue
<!-- ProjectSite.vue -->
<PageHeading :data="project">
  <template #actions>
    <Button @click="joinProject">Join Project</Button>
  </template>
</PageHeading>

<!-- EventPage.vue -->
<PageHeading :data="event">
  <template #meta>
    <EventDate :start="event.date_start" :end="event.date_end" />
    <EventLocation :location="event.location" />
  </template>
</PageHeading>
```

---

### Recommendation: **Option 3 (Separate PageHeading Component)** 🏆

**Implementation Steps:**

1. **Create PageHeading.vue** (~2 hours)
   - Accept standard heading data interface
   - Support multiple header types (hero, banner, simple)
   - Provide slots for extensions (actions, meta, etc.)
   - Handle missing data gracefully

2. **Update Content Components** (~1 hour each)
   - ProjectSite: Use PageHeading with project data
   - EventPage: Use PageHeading with event data + date/location slots
   - PostPage: Use PageHeading with post data + author/date slots
   - InstructorPage: Use PageHeading with instructor data

3. **Benefits Timeline:**
   - **Week 1**: Immediate consistency across 4 pages
   - **Week 2**: Add 2-3 new pages with zero header code
   - **Month 1**: Update all headers from one component

---

## Implementation Roadmap

### Phase 1: Foundation (Now - Week 1)

**Priority 1: Create PageHeading Component**
```bash
# Create component
touch src/components/PageHeading.vue

# Structure:
# - Accept HeadingData interface
# - Support hero, banner, simple types
# - Provide action and meta slots
```

**Priority 2: Integrate with ProjectSite**
```vue
<!-- Update ProjectSite.vue -->
<PageLayout>
  <template #header>
    <PageHeading :data="projectHeadingData" />
  </template>
  <!-- existing content -->
</PageLayout>
```

**Priority 3: Test Layout Settings**
- Verify fullwidth mode works
- Test sidebar layouts (fullTwo, fullThree)
- Check responsive behavior

### Phase 2: Content Pages (Week 2)

**Create remaining content pages:**
- EventPage.vue (with PageHeading + event slots)
- PostPage.vue (with PageHeading + author info)
- InstructorPage.vue (with PageHeading + profile info)

**Pattern:**
```vue
<template>
  <PageLayout>
    <template #header>
      <PageHeading :data="content">
        <template #meta>
          <!-- Content-specific metadata -->
        </template>
      </PageHeading>
    </template>
    <!-- Content sections -->
  </PageLayout>
</template>
```

### Phase 3: Navigation Enhancement (Week 3-4)

**If needed:**
- Migrate UserMenu to Floating Vue dropdown
- Migrate AdminMenu to Floating Vue dropdown
- Add menus to TopNav actions slot
- Consider deprecating Navbar for public pages

---

## File Structure Recommendation

```
src/
├── components/
│   ├── PageLayout.vue          # Layout wrapper (keeps both nav systems)
│   ├── PageHeading.vue         # NEW: Standard heading component
│   ├── Navbar.vue              # Keep: Admin interface navigation
│   ├── TopNav.vue              # Keep: Public site navigation
│   ├── UserMenu.vue            # Refactor: Make reusable with Floating Vue
│   └── AdminMenu.vue           # Refactor: Make reusable with Floating Vue
├── views/
│   ├── ProjectSite.vue         # Content component using PageLayout
│   ├── EventPage.vue           # NEW: Events with PageLayout + PageHeading
│   ├── PostPage.vue            # NEW: Posts with PageLayout + PageHeading
│   └── InstructorPage.vue      # NEW: Instructors with PageLayout + PageHeading
└── layoutsettings.ts           # Centralized layout configuration
```

---

## Summary of Recommendations

| Question | Recommendation | Rationale |
|----------|---------------|-----------|
| **A: Nesting** | Strategy 2: Content Loads Layout | Simpler routing, data colocation, project scale |
| **B: Navigation** | Hybrid: Keep both (Navbar + TopNav) | Different purposes, no immediate refactoring needed |
| **C: Heading** | Option 3: Separate PageHeading Component | Reusable, maintainable, standardized |

### Quick Start Checklist

- [ ] Create PageHeading.vue component
- [ ] Update ProjectSite.vue to use PageHeading in header slot
- [ ] Test layout settings (fullwidth, sidebar modes)
- [ ] Create EventPage.vue using same pattern
- [ ] Create PostPage.vue using same pattern
- [ ] Document heading data interface for team
- [ ] Optional: Refactor UserMenu/AdminMenu to Floating Vue

### Estimated Timeline

- **PageHeading component**: 2 hours
- **ProjectSite integration**: 1 hour
- **3 additional content pages**: 3 hours
- **Testing and refinement**: 2 hours
- **Total**: ~8 hours for complete implementation

---

## Additional Considerations

### Type Safety

Create shared types for heading data:

```typescript
// types/content.ts
export interface BaseHeadingData {
  heading: string
  teaser?: string
  cimg?: string
  header_type?: 'simple' | 'hero' | 'banner' | 'minimal'
  header_size?: 'mini' | 'small' | 'medium' | 'large' | 'full' | 'prominent'
}

export interface ProjectHeadingData extends BaseHeadingData {
  status?: string
}

export interface EventHeadingData extends BaseHeadingData {
  date_start?: string
  date_end?: string
  location?: string
}
```

### Performance

- Use `shallowRef` for layout settings (already done in layoutsettings.ts)
- Lazy load content-specific components with `defineAsyncComponent`
- Consider route-level code splitting for content pages

### Accessibility

- Ensure PageHeading maintains proper heading hierarchy
- Add ARIA landmarks to PageLayout sections
- Test keyboard navigation in TopNav mega-menus

---

## Conclusion

The recommended architecture provides:

1. **Clear separation of concerns**: Layout vs Content vs Heading
2. **Flexibility**: Each layer can be customized independently
3. **Maintainability**: DRY principles with shared PageHeading component
4. **Scalability**: Easy to add new content types
5. **Migration-friendly**: Can evolve toward Strategy 1 if project grows

Start with PageHeading component creation and ProjectSite integration. This foundation will enable rapid development of remaining content pages with consistent, maintainable patterns.
