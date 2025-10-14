# Base View Implementation - Complete

## Overview
The Base View (`/base`) is a comprehensive data editing interface that allows base users (and admins in base mode) to edit entity data and manage tasks. It provides a two-column layout with viewing and editing capabilities.

## Key Features

### 1. **Topbar** (Sticky Navigation)
- **Left**: "📦 Basis-Daten" title
- **Center**: Events dropdown selector (same as /demo)
- **Right**: 
  - Mode toggle: `view/old` | `edit/create` (replaces csv/sql toggle)
  - Save/Cancel buttons (only visible when `hasActiveEdits = true`)

### 2. **Two-Column Layout**

#### **Left Column (65% width)**
Content mirrors `/demo` with enhancements:
- **Hero Section**: Main event with image, title, dates
- **Posts Section**: Grid of blog posts
- **Locations Section**: Grid of venue locations
- **Instructors Section**: Grid of course instructors

**Edit Mode Features**:
- Edit icon buttons (✎) on each entity card (top-left)
- Clicking activates that entity for editing in right column
- Active entity gets highlighted with primary color border
- **Tasks listings** below each section:
  - Shows only **additional tasks** (not main tasks)
  - Hidden if dashboard setting `showOnlyMainTasks` is active
  - Add task button (+) for each entity type
  - Edit task button (✎) for existing tasks
  - Status badges color-coded by task status

#### **Right Column (35% width)**
Only visible in `edit/create` mode. Contains:

##### **Main Task Form** (Top Section)
- Icon indicator: Clock/task icon (title hidden as requested)
- Fields:
  - Title (always visible)
  - Description (always visible)
  - **Advanced fields** (toggleable with cog icon):
    - Status (idea, new, draft, final, reopen)
    - Priority (low, medium, high, urgent)
    - Due date
    - Image URL
- Auto-loads existing main task for active entity
- Creates new main task if none exists

##### **Entity Content Form** (Bottom Section)
Dynamic forms based on active entity type:

**Event Form**:
- Name, Subtitle (rectitle), Teaser
- Date begin, Date end
- Image URL

**Post Form**:
- Title (name), Subtitle, Teaser
- Image URL

**Location Form**:
- Name, Street
- ZIP, City
- Phone, Email
- Image URL

**Instructor Form**:
- Name, Description
- Phone, Email
- City, Image URL

### 3. **Mode Behavior**

#### View/Old Mode (CSV Data)
- Data source: CSV files
- Right column: Hidden
- Left column: Full width
- Edit buttons: Hidden
- Tasks: Hidden
- Read-only display

#### Edit/Create Mode (SQL Data)
- Data source: SQL database
- Right column: Visible (35%)
- Left column: 65% width
- Edit buttons: Visible
- Tasks: Visible (if not filtered)
- Full editing capabilities

### 4. **Entity Activation & SubEntity Mode**

#### Event Mode (Default)
- Activates automatically when entering edit mode
- Shows event data in entity form
- Main task for the event

#### SubEntity Mode
Activated when clicking edit on:
- Post
- Location  
- Instructor

**SubEntity Behavior**:
- Right column updates to show selected entity
- Active entity gets visual highlight
- Forms update with selected entity data
- Save/Cancel returns to Event mode

### 5. **Save/Cancel Functionality**

#### Save Button
- Appears when `hasActiveEdits = true`
- Actions performed:
  1. Save entity data (PUT to `/api/demo/{table}/{id}`)
  2. Save/update main task (POST/PUT to `/api/tasks`)
  3. Refresh SQL data
  4. If in subEntity mode → return to Event
  5. Reset `hasActiveEdits` flag

#### Cancel Button
- Appears when `hasActiveEdits = true`
- Prompts confirmation if edits exist
- Actions performed:
  1. Reload original entity data
  2. Reload original main task
  3. If in subEntity mode → return to Event
  4. Reset `hasActiveEdits` flag

### 6. **Tasks Management**

#### Main Tasks
- One per entity (event, post, location, instructor)
- Shown in right column task form
- Category: 'main'
- Auto-loaded when entity is activated
- Saved together with entity data

#### Additional Tasks
- Multiple per entity
- Category: NOT 'main' (can be 'admin', 'release', etc.)
- Listed below each section in left column
- Only visible in edit mode
- Hidden if dashboard `showOnlyMainTasks` setting is active
- Add/edit via modal (placeholder implemented)

### 7. **State Management**

```typescript
// Mode
dataSource: 'csv' | 'sql'  // view/old vs edit/create

// Active Entity
activeEntityType: 'event' | 'post' | 'location' | 'instructor' | null
activeEntityId: string | null

// Edit Tracking
hasActiveEdits: boolean  // Triggers save/cancel buttons

// Forms
mainTaskForm: {
  id, title, description, status, priority, due_date, image, category
}
entityForm: { /* dynamic based on entity type */ }

// UI
showAdvancedTaskFields: boolean
showOnlyMainTasks: boolean  // From dashboard settings
```

### 8. **API Endpoints Used**

```
GET  /api/demo/data                      // Load all SQL data
GET  /api/tasks                          // Load all tasks
GET  /api/tasks?category=main&...        // Load main task for entity
POST /api/tasks                          // Create new task
PUT  /api/tasks/{id}                     // Update existing task
PUT  /api/demo/events/{id}               // Update event
PUT  /api/demo/posts/{id}                // Update post
PUT  /api/demo/locations/{id}            // Update location
PUT  /api/demo/instructors/{id}          // Update instructor
```

### 9. **Styling Features**

- Sticky topbar with shadow
- Responsive 2-column layout
- CSS custom properties for theming
- Active entity highlighting (primary color border + glow)
- Status badges with semantic colors:
  - Idea: Yellow
  - New: Blue
  - Draft: Pink
  - Final: Green
  - Reopen: Orange
- Smooth transitions and hover effects
- Form field focus states with primary color
- Cog icon button for advanced fields toggle

### 10. **Responsive Design**

**Desktop (>1200px)**:
- 65/35 split columns
- Full features visible

**Tablet (768-1200px)**:
- Stacked columns
- Right column below left

**Mobile (<768px)**:
- Single column layout
- Topbar stacks vertically
- Simplified task lists

## Implementation Status

✅ **Completed**:
1. Topbar with events dropdown and mode toggle
2. Two-column layout (65/35 split)
3. Left column with demo content
4. Edit icon buttons on all entities
5. Entity activation system
6. SubEntity mode handling
7. Right column main task form
8. Right column entity content forms
9. Advanced fields toggle (cog icon)
10. Tasks listings in left column
11. Additional tasks filtering (no main tasks)
12. Save functionality with API integration
13. Cancel functionality with data reload
14. Return to Event from subEntity mode
15. hasActiveEdits tracking
16. Visual highlighting of active entity
17. Full responsive styling

## Usage

### For Base Users
1. Navigate to `/base` route
2. Login required (base role or admin)
3. Default: view/old mode (CSV data, read-only)
4. Switch to edit/create mode to start editing
5. Select event from dropdown
6. Click edit icon on any entity to activate
7. Edit forms in right column
8. Click save when done

### For Admins in Base Mode
- Same workflow as base users
- Accessed via Dashboard → Admin Menu → Base Mode toggle
- Admin menu remains accessible

## Next Steps (Future Enhancements)

- [ ] Implement task modal for additional tasks (currently placeholder)
- [ ] Connect `showOnlyMainTasks` to actual dashboard settings
- [ ] Add image upload/preview functionality
- [ ] Add validation for required fields
- [ ] Add toast notifications for save/cancel actions
- [ ] Add loading states during API calls
- [ ] Add error handling and retry logic
- [ ] Add undo/redo functionality
- [ ] Add keyboard shortcuts
- [ ] Add batch operations for multiple entities

## Testing Checklist

- [ ] Mode toggle switches data sources correctly
- [ ] Events dropdown changes active event
- [ ] Edit icons activate correct entity
- [ ] Main task loads for each entity
- [ ] Entity form populates with correct data
- [ ] Advanced fields toggle works
- [ ] Save button appears on edit
- [ ] Save persists all changes
- [ ] Cancel discards changes
- [ ] SubEntity mode returns to Event
- [ ] Tasks listing shows only additional tasks
- [ ] Tasks filtered correctly by `showOnlyMainTasks`
- [ ] Add task button triggers modal
- [ ] Edit task button loads task data
- [ ] Responsive layout works on all screens
- [ ] No console errors

## Files Modified

- `/src/views/BaseView.vue` - Complete rewrite (~1500 lines)

## Related Documentation

- See `ADMIN_MENU_COMPLETE.md` for admin menu and base mode toggle
- See `STAGE2_DASHBOARD_COMPLETE.md` for dashboard integration
- See `/demo` route for original content structure
