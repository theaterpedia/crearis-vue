# BaseView API Migration Complete

## Summary
BaseView has been migrated from CSV file dependencies to API-based data fetching.

## Changes Made

### 1. Removed CSV Dependencies
- Removed import of `useDemoData` composable which loaded CSV files
- Removed all references to `dataSource === 'csv'` mode
- Removed watch on dataSource changes

### 2. Implemented API Data Fetching
Created new data fetching functions:
- `fetchEvents()` - GET `/api/events?isbase=1`
- `fetchPosts()` - GET `/api/posts?isbase=1`
- `fetchLocations()` - GET `/api/locations?isbase=1`
- `fetchInstructors()` - GET `/api/public-users`
- `refreshSqlData()` - Fetches all data in parallel

### 3. Updated State Management
```typescript
// Base data state
const events = ref<any[]>([])
const posts = ref<any[]>([])
const locations = ref<any[]>([])
const instructors = ref<any[]>([])

// Current event
const currentEventId = ref<string | null>(null)
const currentEvent = computed(() => events.value.find(e => e.id === currentEventId.value) || null)

// Current event data (filtered by event_id)
const currentEventPosts = computed(() => posts.value.filter(p => p.event_id === currentEventId.value))
const currentEventLocations = computed(() => locations.value.filter(l => l.event_id === currentEventId.value))
const currentEventInstructors = computed(() => instructors.value.filter(i => i.event_id === currentEventId.value))
```

### 4. Simplified View/Edit Modes
- Removed CSV/SQL mode toggle
- View mode: Just clears active entity
- Edit mode: Loads data from API and activates entity for editing
- Edit UI visibility now controlled by `hasActiveEdits` flag

### 5. Updated UI
- Mode toggle buttons now show "Ansicht" / "Bearbeiten"
- Left column full-width controlled by `!hasActiveEdits` instead of `dataSource === 'csv'`
- All edit buttons and right column now visible based on `hasActiveEdits`

### 6. Initialization
On mount:
1. Authenticates user
2. Fetches all base data from API
3. Sets first event as current
4. Starts in view mode (no active edits)

## Benefits

✅ **No CSV file dependencies** - All data comes from database via API  
✅ **Real-time data** - Always fetches latest data from database  
✅ **Consistent with other views** - Uses same API endpoints as TaskDashboard  
✅ **Simplified code** - Removed CSV/SQL mode complexity  
✅ **Better performance** - Parallel data fetching with Promise.all  

## API Endpoints Used

- `GET /api/events?isbase=1` - Base events
- `GET /api/posts?isbase=1` - Base posts
- `GET /api/locations?isbase=1` - Base locations
- `GET /api/public-users` - All instructors

## Notes

- The CSV files in `src/assets/csv/` can now be removed (they were only needed temporarily)
- The `useDemoData` composable can be deprecated if no other views use it
- All entity filtering is done client-side with computed properties
