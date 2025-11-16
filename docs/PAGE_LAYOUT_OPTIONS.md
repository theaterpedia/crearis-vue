# Page Layout Options System

## Overview

The Page Layout Options System provides a flexible, database-driven approach to configuring page layouts with dynamic aside (sidebar) and footer content. This system allows projects and pages to customize their layout without code changes.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      PageLayout.vue                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Header    │  │     Main     │  │  Aside (Right)   │  │
│  │   (Slot)    │  │   Content    │  │  ┌────────────┐  │  │
│  └─────────────┘  │   (Slot)     │  │  │  pPostit   │  │  │
│                    │              │  │  │  pToc      │  │  │
│                    └──────────────┘  │  │  pList     │  │  │
│                                       │  │  pContext  │  │  │
│  ┌─────────────────────────────────┐ │  └────────────┘  │  │
│  │      Footer/Bottom Area         │ └──────────────────┘  │
│  │  ┌────────┐  ┌────────┐        │                        │
│  │  │pGallery│  │pSlider │        │                        │
│  │  │pPostit │  │pRepeat │        │                        │
│  │  └────────┘  └────────┘        │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Database (projects/pages tables)
    ↓
parseAsideOptions() / parseFooterOptions()
    ↓
AsideOptions / FooterOptions Objects
    ↓
PageLayout Props
    ↓
Dynamic Component Rendering (v-if)
    ↓
p-Components (pList, pGallery, etc.)
```

## Database Schema

### Projects Table (Flat Fields)
```sql
-- Aside Options
aside_postit          JSONB     -- Post-it note configuration
aside_toc             TEXT      -- Table of contents type
aside_list            TEXT      -- List type (posts/events/instructors)
aside_context         JSONB     -- Context information

-- Footer Options
footer_gallery        TEXT      -- Gallery type
footer_postit         JSONB     -- Footer post-it configuration
footer_slider         TEXT      -- Slider type
footer_repeat         JSONB     -- Repeating sections configuration
footer_sitemap        TEXT      -- Sitemap size
```

### Pages Table (JSONB Fields)
```sql
-- Packed into JSONB fields
aside_options         JSONB     -- All aside options packed
header_options        JSONB     -- Header options
footer_options        JSONB     -- All footer options packed
page_options          JSONB     -- Page-level options

-- Computed boolean helpers
aside_has_content     BOOLEAN   -- TRUE if aside_options != '{}'
footer_has_content    BOOLEAN   -- TRUE if footer_options != '{}'
```

## p-Components

### 1. pList - Dynamic Content Lists

**Purpose:** Display lists of posts, events, instructors, or projects.

**Props:**
```typescript
interface Props {
  type: 'posts' | 'events' | 'instructors' | 'projects'
  isAside?: boolean        // Styling for sidebar
  isFooter?: boolean       // Styling for footer
  header?: string          // Section heading
  itemType?: 'tile' | 'card' | 'row'
  size?: 'small' | 'medium' | 'large'
  interaction?: 'static' | 'popup' | 'zoom'
  limit?: number           // Items to fetch
  projectId?: number       // Filter by project
}
```

**Features:**
- Fetches data from API endpoints
- Automatically maps to ItemList component
- Supports filtering by project
- Adaptive sizing based on placement (aside vs footer)

**Usage Example:**
```vue
<pList 
  type="events" 
  :isAside="true" 
  header="Upcoming Events"
  :projectId="123"
  :limit="5" />
```

### 2. pGallery - Content Galleries

**Purpose:** Display content in gallery format with images.

**Props:**
```typescript
interface Props {
  type: 'posts' | 'events' | 'instructors' | 'projects'
  isAside?: boolean
  isFooter?: boolean
  header?: string
  itemType?: 'tile' | 'card' | 'row'
  size?: 'small' | 'medium' | 'large'
  interaction?: 'static' | 'popup' | 'zoom'
  limit?: number
  projectId?: number
}
```

**Features:**
- Uses ItemGallery internally
- Optimized for visual content
- Supports popup and zoom interactions
- Defaults to 'card' item type

**Usage Example:**
```vue
<pGallery 
  type="posts" 
  :isFooter="true" 
  header="Latest Blog Posts"
  interaction="popup" />
```

### 3. pSlider - Carousel Sliders

**Purpose:** Horizontal scrolling carousel of content items.

**Props:**
```typescript
interface Props {
  type: 'posts' | 'events' | 'instructors' | 'projects'
  isAside?: boolean
  isFooter?: boolean
  header?: string
  size?: 'small' | 'medium' | 'large'
  limit?: number
  projectId?: number
}
```

**Features:**
- Built on existing Slider/Slide components
- Uses ItemCard for each slide
- Swiper.js integration (keyboard, mousewheel, navigation)
- Ideal for featured content

**Usage Example:**
```vue
<pSlider 
  type="events" 
  :isFooter="true" 
  header="Featured Events"
  :limit="8" />
```

### 4. pPostit - Sticky Notes

**Purpose:** Display attention-grabbing notes or announcements.

**Props:**
```typescript
interface Props {
  enabled?: boolean
  title?: string
  content?: string          // HTML content
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'orange'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  isAside?: boolean
  isFooter?: boolean
}
```

**Features:**
- Colored backgrounds with accent borders
- Slight rotation effect for visual interest
- HTML content support via v-html
- Hover animation (straightens on hover)

**Configuration in Database:**
```json
{
  "enabled": true,
  "title": "Important Notice",
  "content": "<p>Registration opens <strong>next week</strong>!</p>",
  "color": "yellow"
}
```

### 5. pToc - Table of Contents

**Purpose:** Auto-generated navigation for page headings.

**Props:**
```typescript
interface Props {
  isAside?: boolean
  isFooter?: boolean
  title?: string
}
```

**Features:**
- Automatically scans `.page-content-main` for h2, h3, h4
- Generates IDs if missing
- Smooth scroll navigation
- Indented hierarchy (level-2, level-3, level-4)

**Auto-generation:**
```javascript
onMounted(() => {
  const headings = document.querySelectorAll('.page-content-main h2, h3, h4')
  // Extracts text, assigns IDs, builds navigation
})
```

### 6. pContext - Contextual Information

**Purpose:** Display supplementary information or explanations.

**Props:**
```typescript
interface Props {
  content?: string          // HTML content
  isAside?: boolean
  isFooter?: boolean
}
```

**Features:**
- Muted background for visual distinction
- HTML content support
- Supports slot for custom content
- Styled links and lists

**Usage Example:**
```vue
<pContext 
  :isAside="true"
  content="<p>This project is funded by XYZ Foundation.</p>" />
```

### 7. pRepeat - Repeating Sections

**Purpose:** Multi-column layout for footer sections (e.g., footer menus, info blocks).

**Props:**
```typescript
interface Props {
  enabled?: boolean
  title?: string
  sections?: RepeatSection[]
  sectionType?: string
  columns?: number          // 1-4 columns
  customContent?: string
  isFooter?: boolean
}
```

**Features:**
- Responsive grid (1-4 columns)
- Configurable sections array
- Named slots for custom content
- Mobile-friendly (collapses to 1 column)

**Configuration Example:**
```json
{
  "enabled": true,
  "title": "Quick Links",
  "columns": 3,
  "sections": [
    { "content": "<h4>About</h4><ul><li>Team</li><li>History</li></ul>" },
    { "content": "<h4>Services</h4><ul><li>Training</li></ul>" },
    { "content": "<h4>Contact</h4><p>Email: info@example.com</p>" }
  ]
}
```

## usePageOptions Utility

### Purpose
Centralized logic for parsing database options and detecting content.

### Functions

#### parseAsideOptions(data: any): AsideOptions
Converts database fields into structured aside options.

**Input (from projects table):**
```javascript
{
  aside_postit: '{"enabled": true, "title": "Note", "content": "...", "color": "yellow"}',
  aside_toc: 'enabled',
  aside_list: 'events',
  aside_context: '{"content": "Context info..."}'
}
```

**Output:**
```javascript
{
  postit: { enabled: true, title: "Note", content: "...", color: "yellow" },
  toc: { enabled: true, title: "Table of Contents" },
  list: { type: "events", header: "Related events" },
  context: { content: "Context info..." }
}
```

#### parseFooterOptions(data: any): FooterOptions
Converts database fields into structured footer options.

**Input (from projects table):**
```javascript
{
  footer_gallery: 'posts',
  footer_postit: '{"enabled": true, ...}',
  footer_slider: 'events',
  footer_repeat: '{"enabled": true, "columns": 3, "sections": [...]}'
}
```

**Output:**
```javascript
{
  gallery: { type: "posts", header: "posts Gallery" },
  postit: { enabled: true, ... },
  slider: { type: "events", header: "events Slider" },
  repeat: { enabled: true, columns: 3, sections: [...] }
}
```

#### hasAsideContent(options: AsideOptions): boolean
Checks if any aside component should be displayed.

```javascript
hasAsideContent({
  postit: { enabled: false },
  toc: { enabled: true },
  list: null,
  context: null
}) // returns true (toc is enabled)
```

#### hasFooterContent(options: FooterOptions): boolean
Checks if any footer component should be displayed.

## Implementation Patterns

### Pattern 1: Project Site (Flat Fields)

```vue
<!-- ProjectSite.vue -->
<script setup lang="ts">
import { parseAsideOptions, parseFooterOptions } from '@/composables/usePageOptions'

const project = ref<any>(null)

// Parse flat database fields
const asideOptions = computed(() => {
  if (!project.value) return {}
  return parseAsideOptions(project.value)
})

const footerOptions = computed(() => {
  if (!project.value) return {}
  return parseFooterOptions(project.value)
})
</script>

<template>
  <PageLayout 
    :asideOptions="asideOptions" 
    :footerOptions="footerOptions"
    :projectId="project.id">
    <template #header>
      <PageHeading :heading="project.heading" />
    </template>
    
    <!-- Main content -->
    <Section>
      <Container>
        <Prose>
          <div v-html="project.html"></div>
        </Prose>
      </Container>
    </Section>
  </PageLayout>
</template>
```

### Pattern 2: Post Page (JSONB Fields)

```vue
<!-- PostPage.vue -->
<script setup lang="ts">
import { parseAsideOptions, parseFooterOptions } from '@/composables/usePageOptions'

const post = ref<any>(null)

// Parse JSONB packed fields
const asideOptions = computed(() => {
  if (!post.value) return {}
  return parseAsideOptions({
    aside_postit: post.value.aside_options,
    aside_toc: post.value.aside_toc,
    aside_list: post.value.aside_list,
    aside_context: post.value.aside_context
  })
})

const footerOptions = computed(() => {
  if (!post.value) return {}
  return parseFooterOptions({
    footer_gallery: post.value.footer_gallery,
    footer_postit: post.value.footer_options,
    footer_slider: post.value.footer_slider,
    footer_repeat: post.value.footer_repeat
  })
})
</script>

<template>
  <PageLayout 
    :asideOptions="asideOptions" 
    :footerOptions="footerOptions"
    :projectId="projectId">
    <!-- Page content -->
  </PageLayout>
</template>
```

### Pattern 3: PageLayout Dynamic Rendering

```vue
<!-- PageLayout.vue -->
<SideContent v-if="showRightSidebar" placement="right">
  <Section v-if="asideOptions">
    <!-- Order matters: postit, toc, list, context -->
    
    <pPostit v-if="asideOptions.postit?.enabled" 
      :title="asideOptions.postit.title"
      :content="asideOptions.postit.content" 
      :color="asideOptions.postit.color" 
      :isAside="true" />

    <pToc v-if="asideOptions.toc?.enabled" 
      :title="asideOptions.toc.title" 
      :isAside="true" />

    <pList v-if="asideOptions.list?.type" 
      :type="asideOptions.list.type" 
      :header="asideOptions.list.header"
      :isAside="true" 
      :projectId="projectId" />

    <pContext v-if="asideOptions.context?.content" 
      :content="asideOptions.context.content"
      :isAside="true" />
  </Section>
</SideContent>
```

## Configuration Examples

### Example 1: Event Project with Sidebar

**Database Configuration:**
```sql
UPDATE projects SET
  aside_toc = 'enabled',
  aside_list = 'posts',
  aside_context = '{"content": "<p>Join our community!</p>"}'::jsonb
WHERE id = 123;
```

**Result:**
- Table of Contents for page navigation
- List of related posts
- Community message in context box

### Example 2: Blog Post with Rich Footer

**Database Configuration:**
```sql
UPDATE pages SET
  footer_gallery = 'posts',
  footer_slider = 'events',
  footer_repeat = '{
    "enabled": true,
    "title": "Stay Connected",
    "columns": 3,
    "sections": [
      {"content": "<h4>Follow Us</h4><p>Twitter, Facebook</p>"},
      {"content": "<h4>Newsletter</h4><p>Subscribe now</p>"},
      {"content": "<h4>Contact</h4><p>info@example.com</p>"}
    ]
  }'::jsonb
WHERE id = 456;
```

**Result:**
- Gallery of related posts
- Slider with upcoming events
- 3-column footer with social/newsletter/contact info

### Example 3: Landing Page with Post-it Announcement

**Database Configuration:**
```sql
UPDATE projects SET
  aside_postit = '{
    "enabled": true,
    "title": "🎉 New Workshop!",
    "content": "<p>Register by <strong>Nov 15</strong> for early bird pricing.</p>",
    "color": "yellow"
  }'::jsonb,
  footer_gallery = 'events'
WHERE domaincode = 'theater-munich';
```

**Result:**
- Eye-catching yellow post-it in sidebar
- Footer gallery showcasing events

## Best Practices

### 1. Component Order
Maintain consistent component order for predictable layouts:
- **Aside:** pPostit → pToc → pList → pContext
- **Footer:** pGallery → pPostit → pSlider → pRepeat

### 2. Content Hierarchy
- Use `header` props to label sections clearly
- Keep post-it content concise (< 100 words)
- Limit list/gallery items (5-10 for aside, 6-12 for footer)

### 3. Performance
- Set reasonable `limit` values to avoid over-fetching
- Use `projectId` filtering when appropriate
- Lazy-load images in galleries/sliders

### 4. Responsive Design
- Test aside content on mobile (collapses to full width)
- Use appropriate `size` props for different breakpoints
- Ensure post-it colors have sufficient contrast

### 5. Database Management
- Use JSON validation in application layer before saving
- Provide sensible defaults in parseOptions functions
- Document expected JSON structures for editors

## Styling Considerations

### Aside vs Footer Placement

**Aside (Sidebar):**
- Smaller headings (h4)
- Compact spacing (margin: 1rem)
- Limited width (sidebar constrained)
- Emphasis on quick reference

**Footer (Bottom):**
- Larger headings (h3)
- Generous spacing (margin: 2-3rem)
- Full width available
- Emphasis on comprehensive information

### Color Theming
All p-components use CSS custom properties:
- `--color-card-bg` - Component backgrounds
- `--color-accent-bg` - Accent colors
- `--color-text` - Text color
- `--color-dimmed` - Muted text

Override in parent components or global styles as needed.

## Troubleshooting

### Components Not Showing

1. **Check options object:** Use Vue DevTools to inspect computed properties
2. **Verify v-if conditions:** Ensure `enabled: true` and required fields present
3. **Check API responses:** Open Network tab, verify data fetching
4. **Database values:** Confirm JSONB fields are valid JSON (not strings)

### Styling Issues

1. **CSS specificity:** p-components use scoped styles, may need `::deep()` for overrides
2. **Layout conflicts:** Check parent container widths and flexbox/grid settings
3. **z-index problems:** Adjust stacking context if components overlap incorrectly

### Performance Problems

1. **Too many items:** Reduce `limit` prop values
2. **Large images:** Optimize image sizes, use CDN
3. **Multiple sliders:** Consider pagination instead of multiple carousels
4. **Heavy JSONB queries:** Add database indexes on computed boolean columns

## Future Enhancements

### Planned Features
- [ ] pTimeline component for chronological content
- [ ] pMap component for location-based pages
- [ ] pTabs component for tabbed content in footer
- [ ] Visual configuration editor (no-code)
- [ ] Template presets (blog, portfolio, event, etc.)
- [ ] A/B testing support for different configurations
- [ ] Analytics integration for component engagement

### API Improvements
- [ ] GraphQL support for flexible querying
- [ ] WebSocket updates for real-time configuration changes
- [ ] Caching layer for frequently accessed configurations
- [ ] Versioning system for configuration rollback

## Conclusion

The Page Layout Options System provides a powerful, flexible foundation for building configurable page layouts. By combining database-driven configuration with reusable p-components, it enables non-developers to customize page layouts while maintaining code quality and consistency.

For implementation support, refer to:
- Component source code: `src/components/page/`
- Utility functions: `src/composables/usePageOptions.ts`
- Example implementations: `src/views/ProjectSite.vue`, `src/views/PostPage.vue`
