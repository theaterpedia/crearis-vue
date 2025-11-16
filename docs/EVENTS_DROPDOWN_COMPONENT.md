# Events Dropdown Component Refactoring

## Overview

Refactored the inline events dropdown implementation into a reusable `EventsDropdown` component following the TaskCard architecture pattern.

**Date:** October 16, 2025

---

## Component Architecture

### EventsDropdown.vue

New reusable component that displays a dropdown list of events with:
- Background image support (following TaskCard pattern)
- HeadingParser integration for consistent heading architecture
- Background fade overlay for better text readability
- Semi-transparent label backgrounds (40% white opacity)
- Optional checkmark for selected events
- Customizable header text

#### Props

```typescript
interface Props {
    events: Event[]              // Array of events to display
    selectedEventId?: string | null  // Currently selected event ID
    headerText?: string          // Dropdown header text (default: "Veranstaltung wählen")
    showCheckMark?: boolean      // Show checkmark on selected event (default: true)
}
```

#### Events

```typescript
emit('select', event: Event)  // Emitted when user selects an event
```

#### Styling Features

1. **Background Images**: Each event option can display a background image with fade overlay
2. **HeadingParser Integration**: Uses compact mode for consistent font sizing
3. **Fade Gradient**: Linear gradient from transparent to white for text readability
4. **Semi-transparent Labels**: 40% white background on event names
5. **Active State**: Special styling for selected event with enhanced contrast

---

## Implementation Pattern

Following TaskCard architecture:

### 1. Background Image Handling

```vue
<button class="event-option" 
    :style="getEventBackgroundStyle(event)">
    <div v-if="event.cimg" class="event-background-fade"></div>
    <!-- content -->
</button>
```

### 2. HeadingParser Usage

```vue
<div class="event-option-label">
    <HeadingParser :content="event.name" as="p" :compact="true" />
</div>
```

### 3. Layering with Z-index

- Background fade: `z-index: 0`
- Image & content: `z-index: 1`
- Check mark: `z-index: 1`

### 4. Semi-transparent Backgrounds

```css
.event-option-label {
    background: oklch(100% 0 0 / 0.4);  /* 40% white */
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}
```

---

## Refactored Files

### 1. BaseView.vue

**Before:**
- Inline dropdown markup (~40 lines)
- Inline CSS styles (~80 lines)
- Direct event handling

**After:**
```vue
<EventsDropdown v-if="isEventsOpen" 
    :events="events" 
    :selected-event-id="currentEventId"
    header-text="Veranstaltung wählen"
    @select="handleEventSelect" />
```

**Changes:**
- Added `EventsDropdown` import
- Replaced inline markup with component
- Added `handleEventSelect` method
- Removed ~80 lines of CSS

### 2. AddEventPanel.vue

**Before:**
- Inline dropdown markup (~25 lines)
- Inline CSS styles (~65 lines)
- Direct event selection

**After:**
```vue
<EventsDropdown v-if="isDropdownOpen" 
    :events="baseEvents" 
    :selected-event-id="selectedEvent?.id || null"
    header-text="Basis-Veranstaltung wählen"
    :show-check-mark="false"
    @select="selectBaseEvent" />
```

**Changes:**
- Added `EventsDropdown` import
- Replaced inline markup with component
- Disabled checkmark (not needed in this context)
- Removed ~65 lines of CSS

---

## Benefits

### 1. Code Reusability
- Single source of truth for events dropdown UI
- Consistent behavior across multiple views
- Easy to maintain and update

### 2. Consistent Architecture
- Follows TaskCard pattern (background images + fade)
- Uses HeadingParser for font sizing
- Consistent styling with semi-transparent backgrounds

### 3. Better Maintainability
- Component isolation
- Clear prop interface
- Reduced code duplication (~145 lines of CSS removed)

### 4. Enhanced Features
- Background image support (not in original)
- Fade gradient for readability
- Better text contrast with semi-transparent backgrounds
- Compact heading mode

### 5. Flexibility
- Customizable header text
- Optional checkmark display
- Easy to extend with new props

---

## Usage Examples

### Basic Usage (BaseView)

```vue
<EventsDropdown 
    :events="events" 
    :selected-event-id="currentEventId"
    @select="handleEventSelect" />
```

### Custom Header (AddEventPanel)

```vue
<EventsDropdown 
    :events="baseEvents" 
    :selected-event-id="selectedEvent?.id"
    header-text="Basis-Veranstaltung wählen"
    :show-check-mark="false"
    @select="selectBaseEvent" />
```

### Full Customization

```vue
<EventsDropdown 
    :events="filteredEvents" 
    :selected-event-id="activeEventId"
    header-text="Choose an Event"
    :show-check-mark="true"
    @select="onEventSelected" />
```

---

## CSS Architecture

### Component-Level Styles

All styles are scoped to the component:

1. **Container**: Absolute positioning, responsive sizing
2. **Header**: Sticky positioning for scroll persistence
3. **Options**: Hover states, active states, transitions
4. **Background**: Image handling, fade gradients
5. **Labels**: Semi-transparent backgrounds, text overflow handling

### Design Tokens Used

- `--color-popover-bg`: Dropdown background
- `--color-border`: Borders and dividers
- `--radius-button`: Border radius
- `--color-contrast`: Text color
- `--color-muted-bg`: Hover states
- `--color-primary-bg`: Active state background
- `--color-primary-contrast`: Active state text

---

## Migration Notes

### For Developers

1. **Import the component**:
   ```typescript
   import EventsDropdown from '@/components/EventsDropdown.vue'
   ```

2. **Replace inline dropdown**:
   - Remove `<div class="events-dropdown">` markup
   - Add `<EventsDropdown>` component
   - Update event handler to accept full event object

3. **Remove old CSS**:
   - Delete `.events-dropdown` styles
   - Delete `.event-option` styles
   - Delete related helper classes

4. **Update event handlers**:
   ```typescript
   // Old
   const selectEvent = (eventId: string) => { ... }
   
   // New
   const handleEventSelect = (event: Event) => { 
       const eventId = event.id
       // ... rest of logic
   }
   ```

### Breaking Changes

None - the component maintains backward compatibility with existing event handling logic.

---

## Future Enhancements

### Potential Improvements

1. **Search/Filter**: Add search input in header
2. **Grouping**: Support event grouping by date/category
3. **Pagination**: Load more events on scroll
4. **Keyboard Navigation**: Arrow keys for selection
5. **Animation**: Slide/fade transitions
6. **Custom Templates**: Slot for custom event rendering
7. **Loading State**: Skeleton loader while fetching
8. **Empty State**: Message when no events available

### Example Extension

```vue
<EventsDropdown 
    :events="events"
    :loading="isLoading"
    :searchable="true"
    :grouped-by="'date'"
    @select="handleSelect"
    @search="handleSearch">
    <template #empty>
        <p>No events found</p>
    </template>
</EventsDropdown>
```

---

## Testing Checklist

- [x] Component renders with events
- [x] Background images display correctly
- [x] Fade gradient applies to images
- [x] HeadingParser renders event names
- [x] Selected event shows active state
- [x] Checkmark displays when selected
- [x] Checkmark hidden when showCheckMark=false
- [x] Click event emits correct event object
- [x] Hover states work properly
- [x] Scrolling works for long lists
- [x] Header stays sticky on scroll
- [x] Responsive sizing works
- [x] BaseView integration works
- [x] AddEventPanel integration works

---

## Related Documentation

- [TaskCard Implementation](./TASKCARD_UI_IMPROVEMENTS.md)
- [Heading Architecture](./HEADING_ARCHITECTURE.md)
- [BaseView API Migration](./BASEVIEW_API_MIGRATION.md)
- [Component Guidelines](./COMPONENT_GUIDELINES.md)

---

## Summary

Successfully refactored inline events dropdown into a reusable, maintainable component following established architecture patterns. The component provides enhanced features (background images, fade gradients) while reducing code duplication and improving consistency across the application.

**Lines of Code:**
- Component: ~180 lines
- Removed from BaseView: ~120 lines
- Removed from AddEventPanel: ~90 lines
- **Net reduction: ~30 lines** (plus better organization and reusability)
