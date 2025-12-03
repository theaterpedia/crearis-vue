# ItemTile Large Size Implementation

**Date:** November 26, 2024  
**Component:** `/src/components/clist/ItemTile.vue`

## Overview

Added `size="large"` variant to ItemTile component with two new display features:
1. **Stats line** - Shows below image (entity-specific information)
2. **Teaser text** - Shows below heading (small descriptive text)

## Implementation Details

### Props Added

```typescript
interface Props {
    size?: 'medium' | 'large' // medium (default) or large with stats/teaser
    teaser?: string // Teaser text for large size
    dateBegin?: string // ISO date string for events (large size stats)
    dateEnd?: string // ISO date string for events (large size stats)
    // ... existing props
}
```

### Computed Property

```typescript
const statsLine = computed(() => {
    if (props.size !== 'large') return ''
    
    // For events, show date range without time
    if (entityType.value === 'event' && (props.dateBegin || props.dateEnd)) {
        return formatDateTime({
            start: props.dateBegin,
            end: props.dateEnd,
            showTime: false,
            format: 'standard',
            rows: 'row'
        })
    }
    
    // Could add other entity-specific stats here
    return ''
})
```

### Template Changes

**Stats Line (below image):**
```vue
<div v-if="size === 'large' && statsLine" class="tile-stats">
    {{ statsLine }}
</div>
```

**Teaser Text (below heading):**
```vue
<div v-if="size === 'large' && teaser" class="tile-teaser">
    {{ teaser }}
</div>
```

### CSS Added

```css
/* Stats line styling (for large size) */
.tile-stats {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--color-text-subtle);
    padding: 0.5rem 0.25rem 0;
    text-align: center;
}

/* Teaser text styling (for large size) */
.tile-teaser {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--color-text-muted);
    margin-top: 0.5rem;
    max-width: 100%;
}

/* Updated tile-heading to use flex-direction: column */
.tile-heading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    /* ... other styles */
}
```

## Usage Examples

### Event with Stats Line and Teaser

```vue
<ItemTile
    heading="Festival of Arts 2024"
    size="large"
    :styleCompact="false"
    dateBegin="2024-11-20T10:00:00"
    dateEnd="2024-11-22T18:00:00"
    teaser="Join us for three days of creativity, performances, and workshops."
    :data="{
        xmlid: 'tp.event.festival-2024',
        url: '/images/festival.jpg',
        alt: 'Festival event'
    }"
    :models="{
        entityType: 'event'
    }"
/>
```

**Result:**
- Image (128×128px)
- Stats line below image: "MI 20.11 – FR 22.11" (uses dateTimeFormat plugin)
- Heading in right column
- Teaser text below heading in small, muted text

### Project with Teaser Only

```vue
<ItemTile
    heading="Introduction to Vue.js"
    size="large"
    :styleCompact="false"
    teaser="Learn the fundamentals of Vue.js framework."
    :data="{ /* ... */ }"
    :models="{
        entityType: 'project'
    }"
/>
```

**Result:**
- Image (128×128px)
- No stats line (not an event)
- Heading in right column
- Teaser text below heading

### Medium Size (Unchanged)

```vue
<ItemTile
    heading="Default Medium Size"
    size="medium"
    :styleCompact="false"
    :data="{ /* ... */ }"
/>
```

**Result:**
- Image (128×128px)
- Heading in right column, vertically centered
- No stats or teaser (medium size)

## Integration with DateTime Plugin

The stats line uses the dateTimeFormat plugin created earlier:

```typescript
import { formatDateTime } from '@/plugins/dateTimeFormat'
```

For events, it displays date ranges in German format without time:
- Single day: "MI 20.11"
- Date range: "MI 20.11 – FR 22.11"
- Cross-year: "DO 28.12.2024 – MI 01.01.2025"

## Layout Behavior

### Non-Compact Mode Only

Large size features (stats, teaser) only display in non-compact mode:
- `styleCompact="false"` → Image beside heading (shows stats/teaser)
- `styleCompact="true"` → Image with overlay (no stats/teaser)

### Responsive Design

- Stats line: center-aligned, 0.8125rem font, subtle color
- Teaser text: left-aligned, 0.8125rem font, muted color
- Both respect component's width constraints

## Entity-Specific Stats

Currently implemented:
- **Events:** Date range from dateBegin/dateEnd

Future possibilities (add to statsLine computed):
- **Instructors:** Course count or rating
- **Locations:** Capacity or city
- **Projects:** Duration or status
- **Blog Posts:** Publish date or read time

## Testing

Demo file created: `/src/components/clist/ItemTile-large-demo.vue`

Demonstrates:
1. Medium size (default behavior)
2. Large size with event stats and teaser
3. Large size with teaser only (non-event)

## Backward Compatibility

✅ Fully backward compatible:
- Default size remains `medium`
- Existing ItemTile usage unchanged
- New props are optional
- No visual changes for medium size

## Files Modified

- `/src/components/clist/ItemTile.vue` - Main component
- `/src/components/clist/ItemTile-large-demo.vue` - Demo file (new)

## Related Documentation

- DateTime plugin: `/src/plugins/dateTimeFormat.ts`
- ItemRow date integration: Uses same dateTimeFormat plugin
- CList Design Spec: `/docs/CLIST_DESIGN_SPEC.md`

---

**Status:** ✅ Complete  
**TypeScript:** Type-safe with strict typing  
**Tests:** Demo component created, manual testing required  
**Dependencies:** dateTimeFormat plugin (already complete)
