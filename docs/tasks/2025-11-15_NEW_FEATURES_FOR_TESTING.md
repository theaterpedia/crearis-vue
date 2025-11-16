# New Features for Testing - November 15, 2025

This document tracks new functionality added today that requires testing.

---

## 1. Hero Image Anatomy for ItemCard & ItemModalCard

**Date Added:** November 15, 2025  
**Status:** ✅ Implemented, ⏳ Pending Testing  
**Components:**
- `ItemCard.vue`
- `ItemModalCard.vue`

### Feature Description

Added `heroimage` anatomy option to ItemCard and ItemModalCard, inspired by CardHero component layout.

### Implementation Details

**New Anatomy Option:**
- `anatomy="heroimage"` - Image positioned at top, heading overlays as banner at bottom

**Layout Characteristics:**
- Image at top with `object-position: top center` (cover sizing)
- **Hero images always use `shape="wide"` regardless of component shape prop**
- Heading overlays at bottom as semi-transparent banner (90% opacity)
- Card meta/content appears below image (not overlaying)
- Increased min-heights by 100px for all size variants

**Size Adjustments:**
- ItemCard Small: 195px → 295px (+100px)
- ItemCard Medium: 260px → 360px (+100px)
- ItemCard Large: 325px → 425px (+100px)
- ItemModalCard Large: 400px → 500px (+100px)

**CSS Classes Added:**
- `.layout-heroimage` - Flexbox column container
- `.hero-image-container` - Relative positioned image container (flex: 1)
- `.hero-image` - Image element with cover and top alignment (always wide shape)
- `.hero-heading-banner` - Absolute positioned banner overlay at bottom
- `.hero-card-meta` - Content area below image

### Props Interface

```typescript
anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
```

**Default Values:**
- `ItemCard`: defaults to `'bottomimage'`
- `ItemModalCard`: defaults to `'heroimage'`

### Usage Example

```vue
<ItemCard 
    heading="**Concert** Event"
    :cimg="imageUrl"
    size="medium"
    anatomy="heroimage"
>
    <ItemTag>Music</ItemTag>
</ItemCard>
```

### Test Coverage Needed

- [ ] **Visual rendering** - All three size variants (small, medium, large)
- [ ] **Image positioning** - Verify image at top, cover sizing
- [ ] **Heading overlay** - Banner appears at bottom of image with correct opacity
- [ ] **Content flow** - Card meta/slot content appears below image, not overlaying
- [ ] **Height adjustments** - Verify +100px applied to all sizes
- [ ] **Data mode** - Test with `ImgShape` component (dataMode)
- [ ] **Legacy mode** - Test with `cimg` prop (legacy image)
- [ ] **Modal variant** - Test heroimage in ItemModalCard
- [ ] **Responsive behavior** - Test on different viewport sizes
- [ ] **No image case** - Verify graceful handling when no image provided

### Related Files

- `/src/components/clist/ItemCard.vue` - Main implementation (default: bottomimage)
- `/src/components/clist/ItemModalCard.vue` - Modal implementation (default: heroimage)
- `/src/components/clist/ItemList.vue` - List wrapper with anatomy support
- `/src/components/clist/ItemGallery.vue` - Gallery wrapper with anatomy support
- `/src/components/page/pList.vue` - Page-level list wrapper (card default: bottomimage, modal default: heroimage)
- `/src/components/page/pGallery.vue` - Page-level gallery wrapper (card default: bottomimage, modal default: heroimage)
- `/src/views/Demo/DemoHeroImage.vue` - Demo component
- `/src/components/CardHero.vue` - Reference component

---

## 3. Anatomy Prop Support for ItemList & pList

**Date Added:** November 15, 2025  
**Status:** ✅ Implemented, ⏳ Pending Testing  
**Components:**
- `ItemList.vue`
- `pList.vue`

### Feature Description

Added `anatomy` prop support to `ItemList` and `pList` to allow customization of card layout for list items, with `'bottomimage'` as the default.

### Implementation Details

**Props Added:**
- `ItemList`: Added `anatomy` prop with `'bottomimage'` default
- `pList`: Added `anatomy` prop with `'bottomimage'` default
- Both components now pass anatomy prop through to `ItemCard`/`ItemRow` components

**Default Behavior:**
- List/gallery cards display with **bottomimage** anatomy (heading top, image bottom)
- Modal previews display with **heroimage** anatomy (image top, heading banner overlay)

**Prop Flow:**
1. Page component → pList/pGallery
2. pList/pGallery → ItemList/ItemGallery
3. ItemList/ItemGallery → ItemCard components
4. ItemList/ItemGallery → ItemModalCard (uses heroimage default)

### Usage Example

**Default (bottomimage for cards):**
```vue
<pList 
    entity="events"
    project="tp"
    onActivate="modal"
/>
```

**Custom anatomy for cards:**
```vue
<pList 
    entity="events"
    project="tp"
    anatomy="fullimage"
    onActivate="modal"
/>
```

### Test Coverage Needed

- [ ] **Default rendering** - Verify bottomimage applied to cards in lists
- [ ] **Custom anatomy** - Test all anatomy options passed to cards
- [ ] **Modal preview** - Verify modal uses heroimage regardless of card anatomy
- [ ] **Prop flow** - Verify anatomy passes through all component layers
- [ ] **Page integration** - Test on HomePage, StartPage, TeamPage, BlogPage

### Related Files

- `/src/components/clist/ItemList.vue` - List component with anatomy support
- `/src/components/page/pList.vue` - Page wrapper with anatomy support
- `/src/views/Home/StartPage.vue` - Uses pList for events
- `/src/views/Home/BlogPage.vue` - Uses pList for posts
- `/src/views/Home/TeamPage.vue` - Uses pList for instructors

---

## 4. Page Integration Updates

**Date Added:** November 15, 2025  
**Status:** ✅ Implemented, ⏳ Pending Testing  
**Pages Updated:**
- `HomePage.vue`
- `StartPage.vue`
- `TeamPage.vue`
- `BlogPage.vue`

### Feature Description

Updated all public-facing pages to use `onActivate="modal"` with proper anatomy defaults.

### Implementation Details

**HomePage:**
- `pGallery` for posts with `onActivate="modal"`
- Cards use bottomimage (default), modals use heroimage (default)

**StartPage:**
- `pList` for events with `project="tp"` and `onActivate="modal"`
- Removed conditional `v-if` wrapper that was hiding events
- Cards use bottomimage (default), modals use heroimage (default)

**TeamPage:**
- `pList` for instructors with `onActivate="modal"`
- Cards use bottomimage (default), modals use heroimage (default)

**BlogPage:**
- `pList` for posts with `onActivate="modal"`
- Cards use bottomimage (default), modals use heroimage (default)

### Test Coverage Needed

- [ ] **HomePage** - Verify posts gallery displays and opens modals
- [ ] **StartPage** - Verify events list displays in aside with tp project filter
- [ ] **TeamPage** - Verify instructors list displays and opens modals
- [ ] **BlogPage** - Verify posts list displays and opens modals
- [ ] **Card anatomy** - All pages show bottomimage layout for cards
- [ ] **Modal anatomy** - All pages show heroimage layout for modals

### Related Files

- `/src/views/Home/HomePage.vue` - Posts gallery
- `/src/views/Home/StartPage.vue` - Events list in aside
- `/src/views/Home/TeamPage.vue` - Instructors list in aside
- `/src/views/Home/BlogPage.vue` - Posts list in aside

---

## 2. Modal Options for pList & pGallery

**Date Added:** November 15, 2025  
**Status:** ✅ Implemented, ⏳ Pending Testing  
**Components:**
- `pList.vue`
- `pGallery.vue`

### Feature Description

Added `modalOptions` prop to both page-level list/gallery wrappers, allowing customization of modal preview anatomy.

### Implementation Details

**New Prop:**
```typescript
modalOptions?: {
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
}
```

**Default Behavior:**
- `modalOptions.anatomy` defaults to `'heroimage'`
- Applied to `ItemModalCard` when using route navigation (`onActivate: 'route'`)
- Also applies to preview modals in modal mode (`onActivate: 'modal'`)

**Component Updates:**

**pList:**
- Added `modalOptions` to Props interface
- Set default via `withDefaults()`: `modalOptions: () => ({ anatomy: 'heroimage' })`
- Pass `anatomy` to route modal: `:anatomy="modalOptions?.anatomy ?? 'heroimage'"`

**pGallery:**
- Added `modalOptions` to Props interface
- Created `modalOptionsWithDefaults` computed property
- Pass `anatomy` to route modal: `:anatomy="modalOptionsWithDefaults.anatomy"`

### Usage Example

**Default (heroimage):**
```vue
<pList 
    entity="events"
    onActivate="route"
    routePath="/events/:id"
/>
```

**Custom anatomy:**
```vue
<pList 
    entity="events"
    onActivate="route"
    routePath="/events/:id"
    :modal-options="{ anatomy: 'bottomimage' }"
/>
```

**Disable anatomy:**
```vue
<pGallery 
    entity="images"
    onActivate="modal"
    :modal-options="{ anatomy: false }"
/>
```

### Test Coverage Needed

- [ ] **Default behavior** - Verify heroimage applied when no modalOptions provided
- [ ] **Custom anatomy** - Test all anatomy options (topimage, bottomimage, fullimage, heroimage, false)
- [ ] **Route mode** - Verify anatomy applied to route navigation modal
- [ ] **Modal mode** - Verify anatomy applied to preview modal (if applicable)
- [ ] **pList** - Test with various entity types (events, posts, instructors)
- [ ] **pGallery** - Test with various entity types and item types
- [ ] **Prop validation** - Verify TypeScript types work correctly
- [ ] **Edge cases** - Test with undefined/null modalOptions

### Related Files

- `/src/components/page/pList.vue` - List wrapper implementation
- `/src/components/page/pGallery.vue` - Gallery wrapper implementation
- `/src/components/clist/ItemModalCard.vue` - Modal component receiving anatomy prop

---

## Testing Priority

**High Priority:**
1. Hero image anatomy visual rendering (all sizes)
2. Card anatomy defaults (bottomimage for ItemCard)
3. Modal anatomy defaults (heroimage for ItemModalCard)
4. Content flow in heroimage layout (no overlapping)
5. Hero image always uses wide shape
6. Page integration (HomePage, StartPage, TeamPage, BlogPage)

**Medium Priority:**
7. Modal options custom anatomy values
8. Data mode vs legacy mode image handling
9. Responsive behavior across viewport sizes
10. Anatomy prop flow through component layers

**Low Priority:**
11. Edge cases (no image, undefined props)
12. Prop validation and TypeScript types

---

## Integration Testing

### Recommended Test Scenarios

**Scenario 1: StartPage with Hero Events**
- Use `pList` with `entity="events"` and `project="tp"`
- Default anatomy: cards=bottomimage, modal=heroimage
- Verify event cards display with bottomimage layout
- Verify modal opens with heroimage layout
- Check date prefixes display correctly

**Scenario 2: HomePage Gallery with Posts**
- Use `pGallery` with `entity="posts"`
- Default anatomy: cards=bottomimage, modal=heroimage
- Verify post cards display with bottomimage layout
- Verify modal opens with heroimage layout

**Scenario 3: Gallery with Custom Anatomy**
- Use `pGallery` with `entity="images"`
- Set `anatomy="fullimage"` for cards
- Set `modalOptions: { anatomy: 'bottomimage' }` for modal
- Verify cards use fullimage layout
- Verify modal uses bottomimage layout

**Scenario 4: Mixed Sizes in ItemCard**
- Display ItemCard components with heroimage anatomy
- Test small, medium, and large sizes side by side
- Verify height adjustments (+100px) applied correctly
- Verify all hero images use wide shape

**Scenario 5: Cross-Page Consistency**
- Check HomePage, StartPage, TeamPage, BlogPage
- Verify all cards use bottomimage (default)
- Verify all modals use heroimage (default)
- Verify consistent behavior across pages

---

## Documentation Updates Needed

- [ ] Update `CLIST_DESIGN_SPEC.md` with heroimage anatomy section
- [ ] Add heroimage examples to component documentation
- [ ] Document modalOptions in pList/pGallery usage guides
- [ ] Add CardHero pattern reference notes

---

## Notes

- Hero image anatomy inspired by CardHero component layout
- Default heroimage provides immersive preview experience for modals
- Default bottomimage provides clean card layout for lists/galleries
- **Hero images always use wide shape for consistent aspect ratio**
- Implementation uses CSS classes (not inline styles) for maintainability
- Compatible with both data mode (ImgShape) and legacy mode (cimg prop)
- Anatomy prop flows through: Page → pWrapper → ItemList/Gallery → ItemCard
- Modal anatomy separate from card anatomy (allows different layouts)

---

**Last Updated:** November 15, 2025  
**Next Actions:** Create test suite for hero image anatomy, anatomy defaults, and page integrations
