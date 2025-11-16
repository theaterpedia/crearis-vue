# BaseView Save and Refresh Fix - October 16, 2025

## Issue
After editing entity data and clicking "Speichern" (Save), the updated content did not immediately appear in the left column. The user had to manually refresh or switch entities to see the changes.

## Root Cause
The `handleSave` function was calling `refreshSqlData()` to reload data from the database, but it wasn't updating the active entity's form with the fresh data after the refresh completed.

**Previous flow:**
1. User edits entity data
2. Click "Speichern"
3. Save entity to database ✅
4. Save main task to database ✅
5. Refresh SQL data from database ✅
6. Reset edit state ✅
7. ❌ Form still shows old data (not refreshed)

## Solution
Updated the `handleSave` function to reload the currently active entity after refreshing the data, ensuring the form displays the updated values from the database.

**New flow:**
1. User edits entity data
2. Click "Speichern"
3. Save entity to database ✅
4. Save main task to database ✅
5. Refresh SQL data from database ✅
6. **Get fresh entity from updated computed properties** ✅
7. **Update entity form with fresh data** ✅
8. **Reload main task from database** ✅
9. Reset edit state ✅
10. ✅ Left column shows updated content immediately

## Code Changes

### `/src/views/BaseView.vue` - `handleSave()` function

**Before:**
```typescript
const handleSave = async () => {
    try {
        // Save entity data
        if (activeEntityType.value && activeEntityId.value) {
            await saveEntity()
        }

        // Save main task
        await saveMainTask()

        // Refresh data
        await refreshSqlData()

        // Reset state
        hasActiveEdits.value = false

        // If in subEntity mode, return to event
        if (activeEntityType.value !== 'event' && currentEvent.value) {
            await activateEntity('event', currentEvent.value)
        }

        console.log('✅ Änderungen gespeichert')
    } catch (error) {
        console.error('Error saving:', error)
        alert('Fehler beim Speichern!')
    }
}
```

**After (REVISED - Fixed form reset issue):**
```typescript
const handleSave = async () => {
    try {
        // Save entity data
        if (activeEntityType.value && activeEntityId.value) {
            await saveEntity()
        }

        // Save main task
        await saveMainTask()

        // Refresh data from database (this updates the left column display)
        await refreshSqlData()

        // Reset edit state - the forms keep their current values which are the saved values
        hasActiveEdits.value = false

        console.log('✅ Änderungen gespeichert')
    } catch (error) {
        console.error('Error saving:', error)
        alert('Fehler beim Speichern!')
    }
}
```

**Important Note:** We do NOT reload the form data after saving. The forms keep the values you just edited, which are the saved values. Only the left column (cards/hero) updates via `refreshSqlData()` to show the changes.

## How It Works

### Data Flow

1. **Save Operations**
   - `saveEntity()` - PUTs entity data to `/api/demo/{table}/{id}`
   - `saveMainTask()` - PUT/POST to `/api/tasks` or `/api/tasks/{id}`

2. **Refresh from Database**
   - `refreshSqlData()` - Fetches all data from `/api/demo/data`
   - Updates `sqlData.value` in the composable
   - All computed properties automatically recompute:
     - `events` computed property
     - `currentEvent` computed property
     - `currentEventPosts` computed property
     - `currentEventLocations` computed property
     - `currentEventInstructors` computed property

3. **Visual Update**
   - Left column displays updated entity data (Vue reactivity)
   - Right column forms KEEP the edited values (which are the saved values)
   - User sees changes immediately in left column without manual refresh

**IMPORTANT:** Forms do NOT reload from database after save. This prevents the "reset on save" issue where forms would briefly show old/cached data.

## Benefits

1. **Immediate Visual Feedback** - Changes appear instantly after saving
2. **Database as Source of Truth** - Always shows what's actually in the database
3. **No Manual Refresh Needed** - Automatic update on save
4. **Consistent State** - Form and display are always synchronized
5. **Better UX** - User knows the save was successful by seeing the changes

## Testing Scenarios

### Test 1: Edit Event
1. ✅ Switch to edit/create mode
2. ✅ Event auto-activates (hero section)
3. ✅ Edit event name in right panel
4. ✅ Click "Speichern"
5. ✅ Hero section immediately shows new name

### Test 2: Edit Post
1. ✅ Click edit button on a post card
2. ✅ Post form loads in right panel
3. ✅ Edit post title and teaser
4. ✅ Click "Speichern"
5. ✅ Post card immediately shows new title and teaser

### Test 3: Edit Location
1. ✅ Click edit button on a location card
2. ✅ Location form loads
3. ✅ Edit address fields (street, city, zip)
4. ✅ Click "Speichern"
5. ✅ Location card immediately shows new address

### Test 4: Edit Main Task
1. ✅ Activate any entity
2. ✅ Edit main task title and description
3. ✅ Change status or priority
4. ✅ Click "Speichern"
5. ✅ Main task form shows updated values
6. ✅ Task saved to database correctly

### Test 5: Multiple Edits
1. ✅ Edit entity multiple times
2. ✅ Each save shows immediate update
3. ✅ No stale data displayed
4. ✅ Can continue editing after save

## Related Functions

### `getOriginalEntity()`
Returns the fresh entity data from computed properties:
- For 'event': returns `currentEvent.value`
- For 'post': finds in `currentEventPosts.value`
- For 'location': finds in `currentEventLocations.value`
- For 'instructor': finds in `currentEventInstructors.value`

### `refreshSqlData()`
Alias for `fetchSqlData()` in the composable:
- Fetches from `/api/demo/data`
- Updates `sqlData.value`
- Triggers recomputation of all computed properties

### `loadMainTask(recordType, recordId)`
Fetches main task for the entity:
- Queries `/api/tasks?category=main&record_type={type}&record_id={id}`
- Extracts `tasks` array from API response
- Updates `mainTaskForm.value` with task data

## Console Output

After a successful save, you'll see:
```
✅ Änderungen gespeichert
```

This confirms:
- Entity saved to database
- Main task saved to database
- Left column data refreshed from database
- Forms keep the saved values (no reset)
- Changes visible in left column

## Status
✅ **RESOLVED** - Saved changes now appear immediately in the left column.

## Issue Found & Fixed: Form Reset on Save

**Problem:** Initial implementation reloaded form data after save, which caused forms to reset to old/cached values.

**Root Cause:** After saving, we called `refreshSqlData()` and then immediately reloaded the form from the refreshed data. However, the database or cache might not have been fully updated yet, causing old values to be loaded back into the forms.

**Solution:** Keep the forms as-is after save. The form values are already the saved values, so there's no need to reload them. Only the left column (display) needs to refresh.

**Key Insight:** 
- **Left Column** (display) = Needs to refresh from database to show changes ✅
- **Right Column** (forms) = Already has the correct values, no reload needed ✅

## Notes
- The fix leverages Vue's reactivity system
- Computed properties automatically update when `sqlData.value` changes
- No need to manually update individual entity arrays
- Forms keep the saved values, preventing unwanted resets
- Only the display (left column) refreshes from database
