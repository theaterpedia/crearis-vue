# Locations Dropdown Component

## Overview

Created a LocationsDropdown component following the EventsDropdown pattern and integrated it into AddEventPanel to enable location selection when creating new events.

**Date:** October 16, 2025

---

## Problem

The AddEventPanel was missing the ability to select a location when creating a new event. The location field is required to save an event, causing failures when trying to create events without specifying a location.

---

## Solution

### 1. Created LocationsDropdown Component

**File:** `src/components/LocationsDropdown.vue`

A reusable dropdown component for selecting locations, following the same architecture as EventsDropdown:

#### Features
- Background image support with fade overlay
- HeadingParser integration for overline/headline/subline parsing
- Semi-transparent label backgrounds (40% white opacity)
- Optional checkmark for selected location
- Customizable header text
- Proper z-index layering

#### Props
```typescript
interface Props {
    locations: Location[]           // Array of locations to display
    selectedLocationId?: string | null  // Currently selected location ID
    headerText?: string             // Dropdown header (default: "Ort wählen")
    showCheckMark?: boolean         // Show checkmark on selected (default: true)
}
```

#### Events
```typescript
emit('select', location: Location)  // Emitted when user selects a location
```

#### Interface
```typescript
interface Location {
    id: string
    name: string
    cimg?: string
    street?: string
    city?: string
    zip?: string
    [key: string]: any
}
```

---

### 2. Updated AddEventPanel

**File:** `src/components/AddEventPanel.vue`

#### Changes Made

**Added Props:**
- `allLocations: Location[]` - Array of available locations

**Added State:**
```typescript
const locationDropdownRef = ref<HTMLElement | null>(null)
const isLocationDropdownOpen = ref(false)
const selectedLocation = ref('')
```

**Updated Logic:**
- Added `toggleLocationDropdown()` method
- Added `selectLocation()` method to handle selection
- Updated `canApply` computed to require location selection
- Updated `previewEvent` to include selected location
- Updated `handleCancel` to reset location selection
- Updated `handleApply` to use `selectedLocation.value` instead of template location
- Updated `handleClickOutside` to close location dropdown

**Added UI:**
```vue
<div class="form-group">
    <label class="form-label">Location</label>
    <div class="location-dropdown-wrapper" ref="locationDropdownRef">
        <button class="location-select-btn" @click="toggleLocationDropdown">
            <span v-if="selectedLocation">
                {{ allLocations.find(l => l.id === selectedLocation)?.name }}
            </span>
            <span v-else class="placeholder">Ort wählen</span>
            <svg><!-- dropdown arrow --></svg>
        </button>
        
        <LocationsDropdown v-if="isLocationDropdownOpen" 
            :locations="allLocations"
            :selected-location-id="selectedLocation"
            @select="selectLocation" />
    </div>
</div>
```

**Added CSS:**
- `.location-dropdown-wrapper` - Container with relative positioning
- `.location-select-btn` - Custom styled button resembling select input
- `.placeholder` - Muted color for placeholder text

---

### 3. Updated ProjectStepEvents

**File:** `src/views/project/ProjectStepEvents.vue`

#### Changes Made

**Added State:**
```typescript
const allLocations = ref<any[]>([])
```

**Added API Method:**
```typescript
async function loadLocations() {
    const response = await fetch('/api/locations?isbase=1')
    allLocations.value = await response.json()
}
```

**Updated onMounted:**
```typescript
await Promise.all([
    loadBaseEvents(),
    loadProjectEvents(),
    loadInstructors(),
    loadLocations()  // Added
])
```

**Updated Template:**
```vue
<AddEventPanel 
    :project-id="props.projectId" 
    :base-events="baseEvents" 
    :all-instructors="allInstructors"
    :all-locations="allLocations"  <!-- Added -->
    @event-added="handleEventAdded" />
```

---

## Architecture Pattern

The LocationsDropdown follows the same architecture as EventsDropdown:

### 1. Background Image Handling
```vue
<button :style="getLocationBackgroundStyle(location)">
    <div v-if="location.cimg" class="location-background-fade"></div>
    <!-- content -->
</button>
```

### 2. HeadingParser Integration
```vue
<div class="location-option-label">
    <HeadingParser :content="location.name" as="p" :compact="true" />
</div>
```

### 3. Layering with Z-index
- Background fade: `z-index: 0`
- Image & content: `z-index: 1`
- Check mark: `z-index: 1`

### 4. Semi-transparent Backgrounds
```css
.location-option-label {
    background: oklch(100% 0 0 / 0.4);  /* 40% white */
}
```

---

## Data Format

Locations should have names formatted with the overline/headline/subline pattern:

```
"Address Line **Location Name** City, State"
"Street Address **Main Venue**"
"**Conference Center** Downtown District"
```

The HeadingParser will automatically parse:
- Text before `**` → overline
- Text between `** **` → headline (bold)
- Text after `**` → subline

---

## Validation

The event creation now requires all three fields:
```typescript
const canApply = computed(() => {
    return selectedEvent.value 
        && selectedInstructor.value 
        && selectedLocation.value  // Required
        && customName.value
})
```

The "Hinzufügen" button will be disabled until:
1. A base event template is selected
2. An instructor is chosen
3. **A location is selected** (new requirement)
4. A custom name is entered

---

## API Integration

The location is saved with the new event:

```typescript
const newEvent = {
    id: newXmlId,
    name: customName.value,
    teaser: customTeaser.value,
    isbase: 0,
    project: props.projectId,
    template: selectedEvent.value.id,
    public_user: selectedInstructor.value,
    location: selectedLocation.value,  // Selected location
    // ... other fields
}
```

---

## User Experience Flow

1. **User clicks "Add Event"** → EventsDropdown opens with base event templates
2. **User selects base event** → Form fields populate with template data
3. **User selects Instructor** → From dropdown list
4. **User selects Location** → Opens LocationsDropdown with all available locations
5. **User enters custom name** → Event name for this instance
6. **User optionally edits teaser** → Description text
7. **User clicks "Hinzufügen"** → Event created with all required fields

---

## Benefits

### 1. Required Field Enforcement
- Location selection is now mandatory
- Prevents incomplete event creation
- Clear validation feedback

### 2. Consistent UI Pattern
- LocationsDropdown mirrors EventsDropdown design
- Familiar interaction pattern
- Cohesive visual language

### 3. Better UX Than Select
- Rich display with images and formatted text
- Background images for visual context
- Overline/headline/subline support
- More engaging than plain HTML select

### 4. Reusable Component
- Can be used anywhere locations need to be selected
- Props allow customization
- Follows established architecture pattern

### 5. Click-Outside Handling
- Both dropdowns close when clicking outside
- Clean interaction model
- Prevents multiple dropdowns being open

---

## Testing Checklist

- [x] LocationsDropdown component created
- [x] Component renders with locations
- [x] Background images display correctly
- [x] Fade gradient applies to images
- [x] HeadingParser parses location names
- [x] Selected location shows active state
- [x] Checkmark displays when selected
- [x] Click event emits correct location object
- [x] Hover states work properly
- [x] AddEventPanel integrates LocationsDropdown
- [x] Location selection updates selectedLocation
- [x] canApply validates location requirement
- [x] Event creation includes location ID
- [x] ProjectStepEvents loads locations
- [x] Locations passed to AddEventPanel
- [x] Click outside closes dropdown
- [x] Location dropdown button shows selected location name
- [x] Reset on cancel clears location

---

## Related Files

### Created
- `src/components/LocationsDropdown.vue`

### Modified
- `src/components/AddEventPanel.vue`
- `src/views/project/ProjectStepEvents.vue`

---

## Related Documentation

- [EventsDropdown Component](./EVENTS_DROPDOWN_COMPONENT.md)
- [Heading Architecture](./HEADING_ARCHITECTURE.md)
- [TaskCard Implementation](./TASKCARD_UI_IMPROVEMENTS.md)

---

## Summary

Successfully implemented location selection functionality in AddEventPanel by creating a LocationsDropdown component following the EventsDropdown architecture pattern. The location field is now required and properly validated, preventing incomplete event creation. The component provides a rich, visual selection experience with background images and formatted text using the HeadingParser system.

**Result:** Users can now properly create events with all required fields (event template, instructor, location, and name), ensuring data integrity and preventing API errors.
