# BaseView Main Task Loading Fix - October 16, 2025

## Issue
When entering edit/create mode in BaseView, the main task form was empty despite the entity loading correctly. Console showed:
```
⚠️ No main task found, resetting form
```

## Root Cause
The Tasks API endpoint returns an object structure:
```json
{
  "success": true,
  "tasks": [...],
  "counts": {...}
}
```

But the frontend code was treating the response as if it were a direct array:
```typescript
const tasks = await response.json()  // ❌ This is an object, not an array
if (tasks && tasks.length > 0) {     // ❌ Object doesn't have .length
```

## Solution
Updated two functions to properly extract the `tasks` array from the API response:

### 1. `loadMainTask()` (line ~603)
```typescript
// Before (incorrect)
const tasks = await response.json()
if (tasks && tasks.length > 0) {

// After (correct)
const data = await response.json()
const tasks = data.tasks || []
if (tasks && tasks.length > 0) {
```

### 2. `loadAllTasks()` (line ~796)
```typescript
// Before (incorrect)
const data = await response.json()
allTasks.value = Array.isArray(data) ? data : []

// After (correct)
const data = await response.json()
const tasks = data.tasks || []
allTasks.value = Array.isArray(tasks) ? tasks : []
```

## Files Modified
- `/src/views/BaseView.vue`
  - Updated `loadMainTask()` function
  - Updated `loadAllTasks()` function
  - Added debug logging to trace API responses

## Testing
1. ✅ Load BaseView in edit/create mode
2. ✅ Event auto-activates and loads entity data
3. ✅ Main task form loads with task data (title, description, status, etc.)
4. ✅ Console shows: `✅ Main task loaded: { id, title, ... }`
5. ✅ No more "No main task found" warnings

## Related Context
This is part of the automatic main-task creation system:
- Main tasks are created automatically by database triggers (migration 003)
- Each entity (event, post, location, instructor, participant) gets one main task
- Main tasks have `category='main'` and default title `{{main-title}}`
- The frontend loads and displays these tasks for editing

## API Response Structure
For reference, the `/api/tasks` endpoint returns:
```typescript
{
  success: boolean,
  tasks: Task[],
  counts: {
    total: number,
    idea: number,
    new: number,
    draft: number,
    final: number,
    reopen: number,
    trash: number,
    byCategory: {
      admin: number,
      main: number,
      release: number
    }
  }
}
```

## Debug Logs
The functions now log:
- `🔍 Loading main task: { recordType, recordId, url }`
- `📋 API response: { ... }`
- `📋 Tasks array: [...]`
- `✅ Main task loaded: { ... }` (on success)
- `⚠️ No main task found, resetting form` (if no tasks)
- `📋 Loaded tasks: X` (for all tasks)

These logs help trace the API call flow and identify any issues.

## Status
✅ **RESOLVED** - Main tasks now load correctly in edit mode.
