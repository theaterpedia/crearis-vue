# CList Component Library

## Overview

The `clist` component library provides a flexible system for displaying entity items (events, posts, instructors, locations) in various layouts and interaction modes.

## Components

### Item Display Components

#### 1. ItemRow
**Location**: `src/components/clist/ItemRow.vue`

A horizontal row layout for list items with image, content, and optional slot.

**Props**:
- `content` (string, required): Content to parse with HeadingParser
- `cimg` (string, optional): Image URL
- `size` ('small' | 'medium' | 'large', default: 'medium'): Size variant
- `cols` (1 | 2 | 3, default: 2): Number of columns (3 when slot is used)

**Features**:
- Fixed widths on first (image) and third (slot) columns
- Medium size: max-height 80px, image 80x80px
- Small size: max-height 60px, image 60x60px
- Large size: max-height 100px, image 100x100px
- Clickable with hover effects
- Delegates content to HeadingParser

**Example**:
```vue
<ItemRow 
  content="Event **Summer Festival** 2024" 
  cimg="/path/to/image.jpg"
  size="medium"
  @click="handleClick"
>
  <button>View Details</button>
</ItemRow>
```

#### 2. ItemTile
**Location**: `src/components/clist/ItemTile.vue`

A compact tile layout similar to TaskCard but without padding/margin on header and no left color marker.

**Props**:
- `content` (string, required): Content to parse with HeadingParser
- `cimg` (string, optional): Background image URL
- `size` ('small' | 'medium' | 'large', default: 'medium'): Size variant

**Features**:
- Small: min-height 120px
- Medium: min-height 160px
- Large: min-height 200px
- Background image with gradient overlay
- Header has no padding/margin
- No left color marker
- Hover effects

**Example**:
```vue
<ItemTile 
  content="Workshop **Digital Arts** Masterclass" 
  cimg="/path/to/background.jpg"
  size="medium"
/>
```

#### 3. ItemCard
**Location**: `src/components/clist/ItemCard.vue`

An enhanced card layout like TaskCard but 30% taller with accent border.

**Props**:
- `content` (string, required): Content to parse with HeadingParser
- `cimg` (string, optional): Background image URL
- `size` ('small' | 'medium' | 'large', default: 'medium'): Size variant

**Features**:
- Small: min-height 195px (~30% taller than TaskCard)
- Medium: min-height 260px
- Large: min-height 325px
- Left accent border (4px)
- Background image with fade overlay
- Slot for additional meta content
- Hover effects

**Example**:
```vue
<ItemCard 
  content="Concert **Piano Recital** Monthly" 
  cimg="/path/to/image.jpg"
  size="medium"
>
  <span class="badge">New</span>
</ItemCard>
```

### Container Components

#### 4. ItemList
**Location**: `src/components/clist/ItemList.vue`

A container for displaying items in a list layout. Defaults to tiles.

**Props**:
- `items` (array, required): Array of items with `content`, `cimg`, `props`, `slot` fields
- `itemType` ('tile' | 'card' | 'row', default: 'tile'): Type of item component to use
- `size` ('small' | 'medium' | 'large', default: 'medium'): Size for all items
- `interaction` ('static' | 'popup' | 'zoom', default: 'static'): Interaction mode
- `title` (string, optional): Title for popup mode
- `modelValue` (boolean, optional): Controls popup open/close state

**Events**:
- `update:modelValue`: Emitted when popup state changes
- `close`: Emitted when popup is closed

**Interaction Modes**:
- **static**: Normal list display
- **popup**: Opens in a modal overlay with title and close button
- **zoom**: Toggleable expanded view

**Example**:
```vue
<!-- Static list -->
<ItemList 
  :items="events" 
  item-type="row" 
  size="medium"
  interaction="static"
/>

<!-- Popup mode -->
<ItemList 
  v-model="isOpen"
  :items="events" 
  item-type="row" 
  interaction="popup"
  title="Select an Event"
  @close="handleClose"
/>

<!-- Zoom mode -->
<ItemList 
  :items="events" 
  item-type="tile"
  interaction="zoom"
>
  <template #trigger>
    <button>Expand</button>
  </template>
</ItemList>
```

#### 5. ItemGallery
**Location**: `src/components/clist/ItemGallery.vue`

A container for displaying items in a gallery layout. Defaults to cards.

**Props**: Same as ItemList

**Features**:
- Larger grid spacing (1.5rem vs 1rem)
- Larger minimum item widths:
  - Cards: 320px (vs 280px in list)
  - Tiles: 240px (vs 200px in list)
- Same interaction modes as ItemList

**Example**:
```vue
<ItemGallery 
  :items="events" 
  item-type="card" 
  size="medium"
  interaction="static"
/>
```

## Item Data Format

Items passed to container components should follow this structure:

```typescript
interface ListItem {
  content: string      // Content for HeadingParser (e.g., "Event **Name** Subtitle")
  cimg?: string        // Image URL
  props?: {            // Additional props to pass to item component
    onClick?: () => void
    // ... any other props
  }
  slot?: any          // Component to render in slot
}
```

## Integration Example

### BaseView Events Selector

The events dropdown in BaseView has been replaced with ItemList:

```vue
<template>
  <button @click="isEventsOpen = !isEventsOpen">
    Select Event
  </button>
  
  <ItemList 
    v-model="isEventsOpen"
    :items="eventsListItems" 
    item-type="row" 
    size="medium"
    interaction="popup"
    title="Veranstaltung wählen"
  />
</template>

<script setup>
import { ItemList } from '@/components/clist'

const eventsListItems = computed(() => {
  return events.value.map(event => ({
    content: event.name,
    cimg: event.cimg,
    props: {
      onClick: () => {
        handleEventSelect(event)
        isEventsOpen.value = false
      }
    }
  }))
})
</script>
```

## Demo Page

Visit `/clist-demo` to see all components in action with various configurations and interaction modes.

**Location**: `src/views/CListDemo.vue`

## File Structure

```
src/components/clist/
├── index.ts           # Exports all components
├── ItemRow.vue        # Row layout component
├── ItemTile.vue       # Tile layout component
├── ItemCard.vue       # Card layout component
├── ItemList.vue       # List container component
└── ItemGallery.vue    # Gallery container component
```

## CSS Variables Used

All components use theme CSS variables:
- `--color-card-bg` / `--color-card-contrast`
- `--color-accent-bg` / `--color-accent-contrast`
- `--color-neutral-bg`
- `--color-border`
- `--color-dimmed`
- `--headings` (font-family)
- `--color-gray-base` (for overlays)

## Key Features

1. **Consistent API**: All item components accept `content`, `cimg`, and `size` props
2. **HeadingParser Integration**: All items delegate content parsing to HeadingParser
3. **Flexible Interactions**: Static, popup, and zoom modes for different use cases
4. **Themeable**: Uses CSS variables for consistent styling
5. **Responsive**: Grid layouts adapt to container width
6. **Accessible**: Proper ARIA attributes and keyboard support
7. **TypeScript**: Full type safety with interfaces

## Migration Notes

### From EventsDropdown to ItemList

**Before**:
```vue
<EventsDropdown 
  v-if="isEventsOpen"
  :events="events" 
  :selected-event-id="currentEventId"
  header-text="Select Event"
  @select="handleEventSelect"
/>
```

**After**:
```vue
<ItemList 
  v-model="isEventsOpen"
  :items="eventsListItems" 
  item-type="row"
  interaction="popup"
  title="Select Event"
/>

<script setup>
const eventsListItems = computed(() => {
  return events.value.map(event => ({
    content: event.name,
    cimg: event.cimg,
    props: {
      onClick: () => {
        handleEventSelect(event)
        isEventsOpen.value = false
      }
    }
  }))
})
</script>
```

## Future Enhancements

Potential additions:
- Selection state management (checkmarks, highlights)
- Sorting and filtering
- Drag-and-drop support
- Virtualization for large lists
- Custom templates via slots
- Animation transitions
