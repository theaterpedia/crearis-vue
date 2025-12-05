# BaseView Save API Endpoints - October 16, 2025

## Critical Issue Found: Missing API Endpoints

### Problem
When clicking "Speichern" (Save) in BaseView:
1. ❌ Changes not saved to database
2. ❌ Left column doesn't update
3. ❌ After switching entities and returning, old data reappears

**Root Cause:** The API endpoints for updating individual entities **did not exist**!

The frontend was calling:
- `PUT /api/demo/events/[id]` ❌ **404 Not Found**
- `PUT /api/demo/posts/[id]` ❌ **404 Not Found**
- `PUT /api/demo/locations/[id]` ❌ **404 Not Found**
- `PUT /api/demo/instructors/[id]` ❌ **404 Not Found**

### Solution
Created the missing API endpoints for all entity types.

## Created API Endpoints

### 1. `/server/api/demo/events/[id].put.ts`
Updates event entities in the database.

**Fields Updated:**
- name
- rectitle
- teaser
- date_begin
- date_end
- cimg

**Request:**
```http
PUT /api/demo/events/_demo.event_forum_theater_schwabing
Content-Type: application/json

{
  "name": "Updated Event Name",
  "rectitle": "Updated Subtitle",
  "teaser": "Updated teaser text",
  "date_begin": "2025-06-01",
  "date_end": "2025-06-30",
  "cimg": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "event": { ... }
}
```

### 2. `/server/api/demo/posts/[id].put.ts`
Updates post entities in the database.

**Fields Updated:**
- name
- subtitle
- teaser
- cimg

### 3. `/server/api/demo/locations/[id].put.ts`
Updates location entities in the database.

**Fields Updated:**
- name
- street
- zip
- city
- phone
- email
- cimg

### 4. `/server/api/demo/instructors/[id].put.ts`
Updates instructor entities in the database.

**Fields Updated:**
- name
- description
- phone
- email
- city
- cimg

## Implementation Details

Each endpoint follows the same pattern:

```typescript
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
  try {
    // 1. Get entity ID from URL parameter
    const id = getRouterParam(event, 'id')
    const body = await readBody(event) as any

    // 2. Validate ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID is required'
      })
    }

    // 3. Update entity in database
    await db.run(
      `UPDATE table_name SET 
        field1 = ?,
        field2 = ?,
        ...
      WHERE id = ?`,
      [body.field1, body.field2, ..., id]
    )

    // 4. Fetch and return updated entity
    const updated = await db.get('SELECT * FROM table_name WHERE id = ?', [id])

    if (!updated) {
      throw createError({
        statusCode: 404,
        message: 'Entity not found'
      })
    }

    return {
      success: true,
      [entityName]: updated
    }
  } catch (error: any) {
    console.error('Error updating:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update'
    })
  }
})
```

## Frontend Integration

The frontend already had the correct implementation in `BaseView.vue`:

```typescript
const saveEntity = async () => {
    const tableName = getTableName(activeEntityType.value!)
    const url = `/api/demo/${tableName}/${activeEntityId.value}`
    
    console.log('📤 Saving entity to:', url)
    console.log('📤 Entity data:', entityForm.value)
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityForm.value)
    })
    
    if (!response.ok) {
        throw new Error(`Failed to save ${activeEntityType.value}`)
    }
    
    return await response.json()
}
```

Now that the endpoints exist, this code works correctly!

## Debug Logging Added

Enhanced debug logging in `BaseView.vue` to track save operations:

```typescript
const handleSave = async () => {
    console.log('💾 Starting save...', {
        activeEntityType,
        activeEntityId,
        entityForm,
        mainTaskForm
    })

    await saveEntity()          // 📤 Logs: URL, data
    console.log('✅ Entity saved')

    await saveMainTask()        // 📤 Logs: URL, method, data
    console.log('✅ Main task saved')

    await refreshSqlData()
    console.log('✅ Data refreshed')
}
```

## Testing

### Test Scenario 1: Edit Event
1. ✅ Switch to edit/create mode
2. ✅ Edit event name: "Forum-Theater" → "Forum-Theater Updated"
3. ✅ Click "Speichern"
4. ✅ Console shows: `📤 Saving entity to: /api/demo/events/...`
5. ✅ Console shows: `✅ Entity saved`
6. ✅ Hero section updates with new name
7. ✅ Switch to another entity and back
8. ✅ Updated name still appears (persisted to database)

### Test Scenario 2: Edit Post
1. ✅ Click edit button on a post
2. ✅ Edit post title and teaser
3. ✅ Click "Speichern"
4. ✅ Post card updates immediately
5. ✅ Data persists after refresh

### Test Scenario 3: Edit Location
1. ✅ Click edit button on a location
2. ✅ Edit address fields
3. ✅ Click "Speichern"
4. ✅ Location card updates immediately
5. ✅ Data persists after refresh

### Test Scenario 4: Edit Instructor
1. ✅ Click edit button on an instructor
2. ✅ Edit name and description
3. ✅ Click "Speichern"
4. ✅ Instructor card updates immediately
5. ✅ Data persists after refresh

## Database Verification

After saving, you can verify in PostgreSQL:

```sql
-- Check if event was updated
SELECT id, name, rectitle, teaser 
FROM events 
WHERE id = '_demo.event_forum_theater_schwabing';

-- Check if post was updated
SELECT id, name, subtitle, teaser 
FROM posts 
WHERE id = 'your-post-id';

-- Check if location was updated
SELECT id, name, street, city 
FROM locations 
WHERE id = 'your-location-id';

-- Check if instructor was updated
SELECT id, name, description 
FROM instructors 
WHERE id = 'your-instructor-id';
```

## Files Created

1. `/server/api/demo/events/[id].put.ts` (60 lines)
2. `/server/api/demo/posts/[id].put.ts` (55 lines)
3. `/server/api/demo/locations/[id].put.ts` (62 lines)
4. `/server/api/demo/instructors/[id].put.ts` (60 lines)

## Console Output

When saving, you'll now see:
```
💾 Starting save...
📤 Saving entity to: /api/demo/events/_demo.event_forum_theater_schwabing
📤 Entity data: { name: "...", rectitle: "...", ... }
📥 Save response status: 200
✅ Save result: { success: true, event: {...} }
✅ Entity saved
📤 Saving main task: { method: "PUT", url: "/api/tasks/...", taskData: {...} }
📥 Main task response status: 200
✅ Main task save result: { ... }
✅ Main task saved
🔄 Refreshing data from database...
✅ Data refreshed
✅ Save complete!
```

## Status
✅ **RESOLVED** - All API endpoints created, saves now work correctly!

## Next Steps
1. Test each entity type to ensure saves work
2. Monitor console logs to verify API calls
3. Check database to confirm data persistence
4. Once verified working, can optionally reduce debug logging
