# ItemCard Component - Test Specification

**Created:** 2025-11-14  
**Component:** ItemCard.vue  
**Feature:** Card display component with anatomy variants, visual indicators, and image handling

## Overview

ItemCard is a versatile card component supporting multiple anatomy layouts (fullimage, bottomimage, topimage, heroimage), visual indicators (badges, entity icons, selection checkboxes, markers), and flexible image handling through both modern ImgShape and legacy cimg.

## Component Features

### Anatomy Variants
- `false` (default) - Same as 'fullimage', background image with fade overlay
- `'fullimage'` - Image as full background with content overlaid
- `'bottomimage'` - Heading at top, image fills remaining space below
- `'topimage'` - Image at top, content below (not yet implemented)
- `'heroimage'` - Large hero-style image (not yet implemented)

### Props
- `heading: string` - Required heading text (supports HeadingParser format)
- `cimg?: string` - Legacy image URL
- `data?: ImgShapeData` - Modern image data object
- `shape?: 'square' | 'wide' | 'thumb' | 'vertical'` - Image aspect ratio
- `anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false` - Layout variant
- `size?: 'small' | 'medium' | 'large'` - Card size (affects heading level and padding)
- `deprecated?: boolean` - Show warning overlay for deprecated cimg usage
- `options?: ItemOptions` - Visual indicators config
- `models?: ItemModels` - State models (selection, entity data, etc.)

### Visual Indicators (ItemOptions)
- `entityIcon: boolean` - Show entity type icon (top-left)
- `badge: boolean` - Show badge (top-right)
- `counter: boolean` - Show counter in badge
- `selectable: boolean` - Show selection checkbox (bottom-left)
- `marker: boolean` - Show colored left border

### State Models (ItemModels)
- `selected: boolean` - Selection state
- `count: number` - Counter value for badge
- `marked: string` - Marker color (primary, secondary, accent, etc.)
- `entityType: string` - Entity type for icon (event, instructor, post, etc.)
- `badgeColor: string` - Badge color variant
- `entity: object` - Entity data for CornerBanner

## Test Implementation

### Unit Tests
**File:** `/tests/unit/ItemCard.anatomy.spec.ts`

Covers:
- ✅ All anatomy variants render correctly
- ✅ Image data handling (ImgShape vs legacy cimg)
- ✅ Size variants (small, medium, large)
- ✅ Heading levels (h3, h4, h5)
- ✅ Visual indicators (icon, badge, checkbox, marker)
- ✅ Selection states
- ✅ Deprecated cimg warning overlay
- ✅ CornerBanner integration

### Integration Tests
**File:** `/tests/integration/ItemGallery.itemCard.spec.ts` (to be created)

Should cover:
- ItemGallery passing anatomy prop to ItemCard
- Image data flow from API through ItemGallery to ItemCard
- Selection state management in gallery context
- Modal preview with ItemCard data

### Visual Regression Tests
**Tool:** Playwright or similar

Test scenarios:
1. **Fullimage anatomy**
   - With background image
   - With fade overlay
   - With content overlaid
   - All size variants

2. **Bottomimage anatomy**
   - Heading at top
   - Image filling bottom space
   - No gaps or borders around image
   - Flexbox layout working correctly

3. **Visual indicators**
   - All indicators visible simultaneously
   - Badge with/without counter
   - Entity icons for different types
   - Marker colors (all variants)
   - Selection checkbox states

4. **Size variants**
   - Small: 195px min-height
   - Medium: 260px min-height
   - Large: 325px min-height
   - Padding adjustments

5. **Responsive behavior**
   - Mobile viewport (< 767px)
   - Tablet viewport (768-1023px)
   - Desktop viewport (> 1024px)

### Accessibility Tests

#### Keyboard Navigation
- [ ] Card is focusable
- [ ] Click event fires on Enter/Space
- [ ] Selection checkbox is keyboard accessible
- [ ] Tab order is logical

#### Screen Reader
- [ ] Heading is properly announced
- [ ] Alt text on images
- [ ] Selection state announced
- [ ] Entity icon has title attribute
- [ ] Badge has meaningful label

#### ARIA Attributes
- [ ] role="article" or similar semantic role
- [ ] aria-label for selection checkbox
- [ ] aria-selected for selected state
- [ ] aria-labelledby connecting heading to card

### Performance Tests

#### Rendering Performance
```typescript
it('renders 100 cards in under 500ms', () => {
  const start = performance.now()
  
  for (let i = 0; i < 100; i++) {
    mount(ItemCard, {
      props: {
        heading: `**Card ${i}**`,
        data: mockImageData
      }
    })
  }
  
  const duration = performance.now() - start
  expect(duration).toBeLessThan(500)
})
```

#### Image Loading
- [ ] Lazy loading works correctly
- [ ] Loading placeholders display
- [ ] Failed image loads don't break layout
- [ ] ImgShape optimization applied

## Manual Testing Checklist

### Basic Functionality
- [ ] Card renders with heading only
- [ ] Card renders with heading + image
- [ ] Legacy cimg still works
- [ ] ImgShape data prop works
- [ ] All size variants display correctly

### Anatomy Variants
- [ ] Fullimage: Background visible with fade
- [ ] Bottomimage: Heading top, image bottom, no gaps
- [ ] Layout transitions work when changing anatomy prop

### Visual Indicators
- [ ] Entity icon displays for known types
- [ ] Badge shows with correct color
- [ ] Counter displays in badge when enabled
- [ ] Selection checkbox toggles correctly
- [ ] Marker border colors apply correctly
- [ ] All indicators work simultaneously

### States
- [ ] Hover effect (translateY + shadow)
- [ ] Selected state (blue outline)
- [ ] Deprecated warning shows when flagged
- [ ] CornerBanner appears for demo entities

### Edge Cases
- [ ] Very long headings wrap correctly
- [ ] Heading with complex HeadingParser syntax
- [ ] Missing image data shows no image
- [ ] Multiple badges (shouldn't happen, but check)
- [ ] Rapid prop changes don't break UI

### Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Issues

### Current Limitations
- topimage anatomy not implemented
- heroimage anatomy not implemented
- Avatar style explicitly disabled (wide/vertical incompatible with circular borders)

### Future Enhancements
- Animation transitions between anatomy variants
- Skeleton loading states
- Custom badge content (not just counter)
- Multiple marker colors simultaneously
- Drag and drop support

## Related Documentation

- [CList Design Specification](/docs/CLIST_DESIGN_SPEC.md)
- [ItemCard Component README](/src/components/clist/README.md)
- [ItemGallery Tests](/docs/tasks/2025-11-14_EVENT_SORTING_TODO.md)
- [ItemRow Tests](/docs/tasks/2025-11-14_ITEMROW_HEADING_PREFIX_TESTS.md)
- [Image Shape Documentation](/src/components/images/README.md)

## Implementation Status

- [x] Component implemented
- [x] Anatomy variants (fullimage, bottomimage)
- [x] Visual indicators system
- [x] Unit tests created
- [ ] Integration tests
- [ ] Visual regression tests
- [ ] Accessibility tests
- [ ] Performance tests
- [ ] Manual testing completed
- [ ] Browser compatibility verified

## Test Execution

Run tests with:
```bash
# All ItemCard tests
pnpm test ItemCard

# Specific test file
pnpm test ItemCard.anatomy.spec.ts

# With coverage
pnpm test:coverage ItemCard

# Watch mode
pnpm test:watch ItemCard
```

## Notes

- Tests use Vue Test Utils for component mounting
- Mock image data provided for consistent testing
- Visual regression requires Playwright setup
- Accessibility tests may require additional tooling (axe-core)
