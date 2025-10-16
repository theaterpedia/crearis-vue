# Entity Name Field Removal from Tasks Table - October 16, 2025

## Issue
During database migration testing (migration 009 - project relationships), the seeding process failed with error:
```
❌ Database seeding failed: column "entity_name" of relation "tasks" does not exist
```

## Context
The `seedAdminWatchTasks()` function was attempting to insert watch tasks with an `entity_name` field that doesn't exist in the base schema's tasks table.

### Watch Tasks Created
1. **Reset Base Task** (`_admin.task_watch_reset_base`)
   - Watches CSV files and reloads base entities
   - Originally had `entity_name: 'CSV Files'`

2. **Save Base Task** (`_admin.task_watch_save_base`)
   - Watches database entities with isbase flag
   - Originally had `entity_name: 'Database Entities'`

## Root Cause
The `entity_name` field was added to the watch tasks for admin functionality, but:
1. No migration was created to add the column to the tasks table
2. The base schema (000_base_schema.ts) doesn't include this column
3. The field may have been intended for future admin task features

## Quick Fix Applied
Removed the `entity_name` field from:
- Task objects in `seedAdminWatchTasks()` function
- INSERT statements (both PostgreSQL and SQLite versions)

### File Modified
**`server/database/migrations/seed-admin-watch-tasks.ts`**

**Before:**
```typescript
{
    id: '_admin.task_watch_reset_base',
    title: '**Reset Base** reload the base from csv',
    // ... other fields
    entity_name: 'CSV Files',  // ❌ Field doesn't exist in schema
    assigned_to: 'system',
    // ...
}
```

**After:**
```typescript
{
    id: '_admin.task_watch_reset_base',
    title: '**Reset Base** reload the base from csv',
    // ... other fields
    assigned_to: 'system',  // ✅ Removed entity_name
    // ...
}
```

## Impact Assessment

### What Still Works ✅
- Watch tasks are created successfully
- Task title clearly indicates what's being watched
- Task description provides detailed context
- `logic` field specifies the watch type (`watchcsv_base`, `watchdb_base`)
- `filter` field specifies the scope (`entities_or_all`)

### What's Missing ❌
- Human-readable entity name in task data
- Potential UI display field for admin dashboard
- Explicit tracking of watched entity types

### Current Workaround
The information previously stored in `entity_name` is still available through:
- **Task Title**: Contains the entity type (e.g., "Reset Base" for CSV files)
- **Task Description**: Full explanation of what's being watched
- **Logic Field**: Technical identifier for watch type
- **Filter Field**: Scope of entities being watched

## Future Considerations

### Option 1: Add Migration for entity_name
If this field is needed for admin functionality:

```typescript
// migration 010_add_entity_name_to_tasks.ts
export const migration = {
    id: '010',
    description: 'Add entity_name field to tasks table for admin watch tasks',
    async up(db: DatabaseAdapter) {
        await db.exec(`
            ALTER TABLE tasks ADD COLUMN entity_name TEXT;
        `)
    },
    async down(db: DatabaseAdapter) {
        await db.exec(`
            ALTER TABLE tasks DROP COLUMN entity_name;
        `)
    }
}
```

Then restore the field in seed-admin-watch-tasks.ts.

### Option 2: Use Existing Fields
Continue without `entity_name` and rely on:
- `title` for display names
- `description` for details
- `logic` for programmatic identification
- `record_type` and `record_id` for entity references

### Option 3: JSON Metadata Field
Add a flexible metadata JSON field:

```typescript
{
    id: '_admin.task_watch_reset_base',
    // ... other fields
    metadata: JSON.stringify({
        entity_name: 'CSV Files',
        watch_paths: ['/server/data/base/*.csv'],
        auto_reload: true
    })
}
```

## Recommendation
- **Short-term**: Continue without `entity_name` ✅ (current state)
- **Medium-term**: Evaluate if admin dashboard actually needs this field
- **Long-term**: If needed, create migration 010 and restore the field

## Related Files
- `server/database/migrations/seed-admin-watch-tasks.ts` - Modified
- `server/database/migrations/000_base_schema.ts` - Tasks table definition
- `server/database/migrations/006_add_watch_task_fields.ts` - Added logic/filter fields

## Testing Status
- ✅ Seeding completes without entity_name field
- ✅ Watch tasks created successfully
- ✅ No schema violations
- ⏳ Admin functionality with watch tasks not yet tested

## Decision Log
**Date**: October 16, 2025
**Decision**: Remove entity_name field from watch tasks
**Rationale**: 
- Field not in schema, no migration exists
- Blocking migration 009 testing
- Information still available through other fields
- Can be added later if needed

**Next Steps**:
1. Complete migration 009 testing
2. Verify project relationships work correctly
3. Test admin watch task functionality
4. Decide if entity_name field is actually needed
5. Create migration 010 if required

## Status
🟡 **TEMPORARY FIX** - Field removed to unblock testing. May need to be restored with proper migration later.

---

**Created**: October 16, 2025
**Last Updated**: October 16, 2025
**Related Migration**: 009_add_project_relationships
**Blocked Testing**: PostgreSQL seeding cycle
