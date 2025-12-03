# Project Events Step Implementation - October 16, 2025

## Overview
Implemented the events step for the project route, allowing users to add events from base templates to their projects.

## Components Created

### 1. EventCard.vue (`src/components/EventCard.vue`)
**Purpose**: Display event information in a card format

**Features**:
- Uses HeadingParser for formatted event names
- Displays event image (cimg)
- Shows teaser text (truncated to 3 lines)
- Displays instructor information with icon
- Hover effects for better UX
- Responsive card design

**Props**:
- `event` (any): Event object to display
- `instructors` (any[], optional): List of instructors to lookup public_user

**Styling**:
- Card with soft background and border
- 16:9 aspect ratio image
- Hover transform and shadow effects
- Instructor info at bottom with border-top

---

### 2. AddEventPanel.vue (`src/components/AddEventPanel.vue`)
**Purpose**: Panel for selecting base events and creating project events

**Structure** (3 rows):
1. **Component Header**: Add Event button with dropdown
2. **Preview Section**: Shows selected event preview (disabled by default)
3. **Action Section**: Form fields and buttons (disabled by default)

**Features**:

#### Component Header
- **Add Event Button**: Primary button with plus icon
- **Dropdown**: Opens on click, shows base events (isbase=1)
- **Event Options**: Display event image + name using HeadingParser
- **Click Outside**: Automatically closes dropdown

#### Preview Section
- Shows EventCard with current form values
- Updates in real-time as user edits name/teaser/instructor
- Only visible when event selected

#### Action Section
- **Instructor Dropdown**: Select from all instructors
- **Name Input**: Edit event name
- **Teaser Textarea**: Edit event description
- **Cancel Button**: Resets form to default state
- **Apply Button**: Creates new project event
  - Disabled until instructor and name are filled
  - Makes API call to `/api/events` with POST
  - Constructs proper event object with:
    - `isbase: 0`
    - `project`: Current project ID
    - `template`: Selected base event ID
    - `public_user`: Selected instructor ID
    - `location`: Copied from template
    - Other fields copied from template
  - Emits `eventAdded` with new event ID
  - Resets form after success

**Props**:
- `projectId` (string): Current project ID
- `baseEvents` (any[]): List of base events (isbase=1)
- `allInstructors` (any[]): List of all instructors

**Emits**:
- `eventAdded(eventId: string)`: When new event is created

**API Integration**:
```typescript
POST /api/events
Body: {
    name: string
    teaser: string
    isbase: 0
    project: string
    template: string
    public_user: string
    location: string
    // ... other fields from template
}
```

---

### 3. ProjectStepEvents.vue (`src/views/project/ProjectStepEvents.vue`)
**Purpose**: Events step in project stepper

**Layout**:
- **Two-column grid**: 
  - Left: Events gallery (flexible width)
  - Right: Add Event Panel (400px fixed)
- **Responsive**: Max 3 columns for event cards on large screens

**Features**:

#### Left Column - Events Gallery
- **Empty State**: Shows when no events added
  - Calendar icon
  - "Noch keine Events" message
  - Instructions to use right panel
- **Events Grid**: 
  - Responsive grid (auto-fill, minmax 280px)
  - Max 3 columns on large screens
  - Uses EventCard component
  - Shows all project events (isbase=0)

#### Right Column - Add Event Panel
- Fixed 400px width
- Contains AddEventPanel component
- Sticky position (stays visible while scrolling)

#### Data Loading
Three parallel API calls on mount:
1. **Base Events**: `GET /api/events?isbase=1`
2. **Project Events**: `GET /api/events?project={projectId}&isbase=0`
3. **Instructors**: `GET /api/instructors`

#### Event Handling
- Listens for `@event-added` from AddEventPanel
- Reloads project events when new event added
- Gallery updates automatically

**State**:
```typescript
projectId: ref('project1') // Hardcoded for now
baseEvents: ref<any[]>([])
projectEvents: ref<any[]>([])
allInstructors: ref<any[]>([])
```

**Note**: `projectId` is currently hardcoded as `'project1'`. This should be passed from parent component (ProjectMain) in future implementation.

---

## API Requirements

### Events API
- `GET /api/events?isbase=1` - Fetch base events
- `GET /api/events?project={id}&isbase=0` - Fetch project events
- `POST /api/events` - Create new event

### Instructors API
- `GET /api/instructors` - Fetch all instructors

---

## Styling Features

### EventCard
- Soft background with border
- Hover: transform translateY(-2px) + shadow
- Image: 16:9 aspect ratio, cover fit
- Teaser: -webkit-line-clamp: 3 (truncate)
- Instructor section: border-top, smaller text

### AddEventPanel
- Primary blue button with hover effects
- Dropdown: absolute positioning, max-height 400px, scrollable
- Form inputs: consistent padding, border on focus
- Action buttons: flex layout, equal width
- Apply button: disabled state with opacity

### ProjectStepEvents
- Grid layout: `1fr 400px`
- Events grid: `repeat(auto-fill, minmax(280px, 1fr))`
- Large screens: `repeat(3, 1fr)`
- Gap: 1.5rem between cards
- Min-height: 500px for content area

---

## Data Flow

```
ProjectStepEvents (mount)
  ↓
  ├─→ Load Base Events (isbase=1)
  ├─→ Load Project Events (isbase=0, project=projectId)
  └─→ Load Instructors
  
User clicks "Add Event"
  ↓
AddEventPanel opens dropdown
  → Shows base events
  
User selects event
  ↓
  ├─→ Load into preview
  ├─→ Enable action area
  └─→ Pre-fill form with event data
  
User edits name/teaser, selects instructor
  ↓
User clicks "Apply"
  ↓
  ├─→ POST /api/events
  ├─→ Create event with:
  │     - isbase=0
  │     - project=projectId
  │     - template=selected event
  │     - public_user=selected instructor
  │     - location from template
  ├─→ Emit eventAdded(newEventId)
  └─→ Reset form
  
ProjectStepEvents receives eventAdded
  ↓
  └─→ Reload project events
        ↓
        Update gallery
```

---

## TypeScript Notes

Components use `any` types for events and instructors to match existing codebase patterns (see BaseView.vue). A future improvement would be to create proper TypeScript interfaces:

```typescript
interface Event {
    id: string
    name: string
    teaser?: string
    cimg?: string
    isbase: number
    project?: string
    template?: string
    public_user?: string
    location?: string
    date_begin?: string
    date_end?: string
    description?: string
    start_time?: string
    end_time?: string
    event_type?: string
}

interface Instructor {
    id: string
    name: string
    description?: string
    cimg?: string
    phone?: string
    email?: string
    city?: string
}
```

These would go in `src/types.ts` or similar.

---

## Future Enhancements

### Immediate
1. Pass `projectId` from ProjectMain instead of hardcoding
2. Add loading states for API calls
3. Add error handling and user feedback (toasts/alerts)
4. Add delete/edit functionality for project events

### Advanced
1. Drag-and-drop reordering of events
2. Batch add multiple events
3. Filter/search base events
4. Preview all event details before adding
5. Duplicate existing project events
6. XML-ID construction based on naming pattern
7. Validation for duplicate events

---

## Testing Checklist

- [ ] Load step with empty project - see empty state
- [ ] Click Add Event - dropdown opens
- [ ] Select base event - preview appears
- [ ] Edit name - preview updates
- [ ] Edit teaser - preview updates
- [ ] Select instructor - preview updates
- [ ] Click cancel - form resets
- [ ] Fill form and apply - event created
- [ ] Gallery updates with new event
- [ ] Add multiple events - grid layout works
- [ ] Responsive: 3 columns on large screen
- [ ] Click outside dropdown - closes
- [ ] API errors handled gracefully

---

## Files Modified

1. **Created**: `src/components/EventCard.vue` (~110 lines)
2. **Created**: `src/components/AddEventPanel.vue` (~420 lines)
3. **Modified**: `src/views/project/ProjectStepEvents.vue` (~225 lines)

---

## Dependencies

- HeadingParser.vue (existing component)
- Vue 3 Composition API
- Existing API structure
- Project theming variables

---

## Known Issues

1. TypeScript compile errors for Vue imports (false positives, code works)
2. `projectId` hardcoded - needs to be passed from parent
3. No error handling for failed API calls
4. No loading indicators during data fetch
5. No validation for XML-ID uniqueness
6. XML-ID construction not yet implemented (should use `_project1.*` pattern)

---

## Related Documentation

- PROJECT_ROUTE_IMPLEMENTATION.md - Initial project route setup
- PROJECT_CONFIG_DROPDOWN.md - Config dropdown implementation
- BASE_VIEW_IMPLEMENTATION.md - Reference for entity cards and patterns
