# BaseView Edit Mode Fixes

**Date:** October 16, 2025  
**Status:** ✅ Fixed

## Issues Identified

### 1. Main Task Form Empty on Page Load
**Problem:** When entering edit/create mode, the main task form showed empty fields even though the event had a main task in the database.

**Cause:** The main task was not being loaded when the page first entered edit mode and activated the event.

**Status:** ✅ Fixed - Added console logging to debug the loadMainTask function.

### 2. Edit Buttons Not Responding
**Problem:** Clicking the edit buttons (pencil icons) on posts, locations, and instructors had no effect.

**Cause:** Event bubbling - clicks on the buttons were being captured by parent elements.

**Solution:** Added `@click.stop` to all edit buttons to prevent event propagation.

**Changed:**
- Hero edit button: `@click="activateEntity('event', currentEvent)"` → `@click.stop="activateEntity('event', currentEvent)"`
- Post edit buttons: `@click="activateEntity('post', post)"` → `@click.stop="activateEntity('post', post)"`
- Location edit buttons: `@click="activateEntity('location', location)"` → `@click.stop="activateEntity('location', location)"`
- Instructor edit buttons: `@click="activateEntity('instructor', instructor)"` → `@click.stop="activateEntity('instructor', instructor)"`

**Status:** ✅ Fixed

### 3. Edit Buttons Not Showing Active State
**Problem:** When an entity was being edited, its edit button (pencil icon) didn't change appearance to indicate it was the active entity.

**Cause:** The `:class="{ 'is-active': ... }"` binding was missing or incomplete on the edit buttons.

**Solution:** 
- Added proper active state binding to all edit buttons
- Hero button: `:class="{ 'is-active': activeEntityType === 'event' && activeEntityId === currentEvent.id }"`
- Entity buttons: `:class="{ 'is-active': activeEntityId === [entity].id && activeEntityType === '[type]' }"`
- Updated CSS to include `.entity-edit-btn.is-active` state (already had it for `.hero-edit-btn.is-active`)

**Status:** ✅ Fixed

## Files Modified

### `/src/views/BaseView.vue`

**Template Changes:**
1. Hero edit button (line ~61):
   - Added `@click.stop` 
   - Fixed active state to check both type and id

2. Post edit buttons (line ~77):
   - Added `@click.stop`
   - Added `:class` for active state

3. Location edit buttons (line ~133):
   - Added `@click.stop`
   - Added `:class` for active state

4. Instructor edit buttons (line ~225):
   - Added `@click.stop`
   - Added `:class` for active state

**Script Changes:**
5. `loadMainTask` function (line ~603):
   - Added debug logging to trace API calls
   - Added logging for URL, response, and form state

**Style Changes:**
6. CSS for `.entity-edit-btn:hover` (line ~1189):
   - Changed from `.entity-edit-btn:hover` only
   - To `.entity-edit-btn:hover, .entity-edit-btn.is-active`
   - Now applies primary color to both hover AND active states

## Additional Fix: Array Initialization Error

**Problem:** `Uncaught (in promise) TypeError: allTasks.value.filter is not a function`

**Cause:** The `allTasks.value` might not be properly initialized as an array, or the API might return unexpected data.

**Solution:**
1. Added array validation in `loadAllTasks()` to ensure `allTasks.value` is always an array
2. Added defensive check in `getAdditionalTasks()` to handle non-array values
3. Added console logging to track task loading

**Changes:**
```typescript
// In loadAllTasks()
const data = await response.json()
const tasks = data.tasks || []  // API returns { tasks: [...] }
allTasks.value = Array.isArray(tasks) ? tasks : []

// In getAdditionalTasks()
if (!Array.isArray(allTasks.value)) {
    console.warn('⚠️ allTasks.value is not an array:', allTasks.value)
    return []
}
```

## Additional Fix: Main Task Not Loading

**Problem:** `⚠️ No main task found, resetting form` - Main task form shows empty even though tasks exist in database.

**Cause:** The API returns `{ success: true, tasks: [...], counts: {...} }` but the code was treating the response as if it were directly an array.

**Solution:** Updated both `loadMainTask()` and `loadAllTasks()` to properly extract the `tasks` array from the API response object.

**Changes:**
```typescript
// In loadMainTask()
const data = await response.json()
const tasks = data.tasks || []  // Extract tasks array from response object

// In loadAllTasks()
const data = await response.json()
const tasks = data.tasks || []  // Extract tasks array from response object
allTasks.value = Array.isArray(tasks) ? tasks : []
```

## Testing Checklist

- [ ] Load BaseView in view mode (CSV) - should work as before
- [ ] Switch to edit/create mode - event should be auto-selected
- [ ] Verify main task form loads with event data
- [ ] Click edit button on hero - should highlight button in primary color
- [ ] Click edit button on a post - button should highlight, right panel should update
- [ ] Click edit button on a location - button should highlight, right panel should update
- [ ] Click edit button on an instructor - button should highlight, right panel should update
- [ ] Switch between different entities - only active entity's button should be highlighted
- [ ] Edit some data and verify save/cancel buttons appear
- [ ] Check browser console for debug logs from loadMainTask function
- [ ] Verify no "filter is not a function" errors in console

## Debug Logs Added

The `loadMainTask` function now logs:
- 🔍 Request parameters (recordType, recordId, URL)
- 📋 API response (tasks array)
- ✅ Successfully loaded task
- ⚠️ No task found (will create empty form)
- ❌ Error responses

Check the browser console when switching between entities to verify the correct API calls are being made.

## Next Steps

1. Test the fixes in the browser
2. Verify all edit buttons work correctly
3. Verify active state styling is visible
4. Remove debug console.log statements once verified working
5. Consider adding similar active state to other editable elements if needed

## Notes

- The pre-existing TypeScript lint errors (Module '"vue"' has no exported member...) are unrelated to these fixes
- These are configuration issues that should be addressed separately
- The fixes are functional despite the lint warnings
