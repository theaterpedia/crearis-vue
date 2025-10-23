# Migration 020: i18n Core Implementation

**Date**: October 23, 2025  
**Status**: ✅ Complete  
**Migration File**: `server/database/migrations/020_i18n_core.ts`

## Overview

Migration 020 adds internationalization (i18n) support to the database schema by introducing language selection and computed status display names with automatic translation.

## Changes

### 1. Added `lang` Column

Added language field to 5 entity tables:
- `participants`
- `instructors`
- `tasks`
- `locations`
- `users`

**Column Definition**:
```sql
ALTER TABLE {table} 
ADD COLUMN IF NOT EXISTS lang TEXT 
NOT NULL DEFAULT 'de' 
CHECK (lang IN ('de', 'en', 'cz'))
```

**Supported Languages**:
- `de` - German (default)
- `en` - English
- `cz` - Czech

### 2. Created Translation Function

PostgreSQL function for status name translation with fallback chain:

```sql
CREATE OR REPLACE FUNCTION get_status_display_name(
    p_status_id INTEGER,
    p_lang TEXT
) RETURNS TEXT AS $$
DECLARE
    v_name_i18n JSONB;
    v_result TEXT;
BEGIN
    -- Get name_i18n from status table
    SELECT name_i18n INTO v_name_i18n
    FROM status
    WHERE id = p_status_id;
    
    IF v_name_i18n IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Fallback chain: requested lang → 'de' → 'en' → base name
    v_result := v_name_i18n->>p_lang;
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;
    
    v_result := v_name_i18n->>'de';
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;
    
    v_result := v_name_i18n->>'en';
    IF v_result IS NOT NULL THEN
        RETURN v_result;
    END IF;
    
    -- Fallback to name column
    SELECT name INTO v_result FROM status WHERE id = p_status_id;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 3. Added `status_display` Computed Column

Added to 7 tables with status_id:
- `events`
- `posts`
- `participants`
- `instructors`
- `tasks`
- `locations`
- `users`

**For tables with `lang` column**:
```sql
ALTER TABLE {table}
ADD COLUMN IF NOT EXISTS status_display TEXT
GENERATED ALWAYS AS (
    get_status_display_name(status_id, lang)
) STORED
```

**For tables without `lang` column** (events, posts):
```sql
ALTER TABLE {table}
ADD COLUMN IF NOT EXISTS status_display TEXT
GENERATED ALWAYS AS (
    get_status_display_name(status_id, 'de')
) STORED
```

## Database Schema Updates

### Tables Modified

#### With `lang` and `status_display`:
1. **participants**
   - Added: `lang TEXT NOT NULL DEFAULT 'de'`
   - Added: `status_display TEXT` (computed)

2. **instructors**
   - Added: `lang TEXT NOT NULL DEFAULT 'de'`
   - Added: `status_display TEXT` (computed)

3. **tasks**
   - Added: `lang TEXT NOT NULL DEFAULT 'de'`
   - Added: `status_display TEXT` (computed)

4. **locations**
   - Added: `lang TEXT NOT NULL DEFAULT 'de'`
   - Added: `status_display TEXT` (computed)

5. **users**
   - Added: `lang TEXT NOT NULL DEFAULT 'de'`
   - Added: `status_display TEXT` (computed)

#### With `status_display` only (default lang='de'):
6. **events**
   - Added: `status_display TEXT` (computed)

7. **posts**
   - Added: `status_display TEXT` (computed)

## Status Helper System

### Backend Helpers (`server/utils/status-helpers.ts`)

Created comprehensive status lookup system:

```typescript
interface StatusInfo {
    id: number
    value: number
    name: string
    displayName: string
    displayDesc: string | null
}

// Initialize cache on server startup
export async function initializeStatusCache(db: DatabaseAdapter): Promise<void>

// Fast lookups (O(1))
export function getStatusIdByVal(value: number, table: string): number | null
export function getStatusIdByName(name: string, table: string): number | null
export function getStatus4Lang(value: number, table: string, lang: string = 'de'): StatusInfo | null
```

**Cache Structure**:
- `byValue`: Map<`${table}:${value}`, id>
- `byName`: Map<`${table}:${name}`, id>
- `byId`: Map<id, statusData>

### Frontend Composable (`src/composables/useStatus.ts`)

Vue composable for client-side status translation:

```typescript
export function useStatus() {
    function status4Lang(value: number, table: string, lang: string = 'de'): StatusInfo | null
    function getStatusIdByVal(value: number, table: string): number | null
    function getStatusIdByName(name: string, table: string): number | null
    function getStatusDisplayName(value: number, table: string, lang: string = 'de'): string
    function getStatusesForTable(table: string): StatusEntry[]
    
    return {
        status4Lang,
        getStatusIdByVal,
        getStatusIdByName,
        getStatusDisplayName,
        getStatusesForTable,
        cacheInitialized,
        cacheLoading,
        initializeCache
    }
}
```

### API Endpoint (`server/api/status/all.get.ts`)

Returns all status entries for client-side caching:

```typescript
GET /api/status/all

Response:
{
    statuses: StatusEntry[],
    count: number
}
```

## Updated API Endpoints

### Tasks Endpoints

**GET /api/tasks**
- Updated interface to include `status_display` and `lang`
- Changed `status` → `status_id`

**POST /api/tasks**
- Uses `getStatusIdByName()` for status lookup
- Inserts using `status_id` column

**PUT /api/tasks/:id**
- Uses `getStatusIdByName()` for status updates
- Updates `status_id` column

## Updated Vue Components

### StatusBadge.vue
- Added `useStatus()` composable
- Props: `status`, `table` (default: 'tasks'), `lang` (default: 'de')
- Label dynamically translated using `status4Lang()`

### StatusToggler.vue
- Added `useStatus()` composable
- Props: `modelValue`, `allowedStatuses`, `table`, `lang`
- Labels dynamically translated using `status4Lang()`

## Migration Details

### PostgreSQL Implementation
- Function: `get_status_display_name(p_status_id, p_lang)`
- JSONB column: `status.name_i18n`
- Computed columns: `GENERATED ALWAYS AS (...) STORED`

### SQLite Implementation
- JavaScript function: `getStatusDisplayName(statusId, lang)`
- JSON parsing: `JSON.parse(name_i18n)`
- Virtual columns: `GENERATED ALWAYS AS (...) STORED`

## Verification

Status translations tested and working:

**Example (status value=6, 'reopen')**:
- German (de): "Wiedereröffnet"
- English (en): "Reopened"
- Czech (cz): "Znovu otevřeno"

## Server Initialization

Status cache initialized on startup in `server/database/init.ts`:

```typescript
await initializeStatusCache(db)
console.log('✅ Status cache initialized')
```

## Benefits

1. **Automatic Translation**: Status names translate based on entity's `lang` field
2. **Performance**: In-memory cache for O(1) lookups
3. **Consistency**: Single source of truth for status data
4. **Flexibility**: Easy to add new languages
5. **Type Safety**: Full TypeScript support

## Related Files

### Migration
- `server/database/migrations/020_i18n_core.ts`

### Backend
- `server/utils/status-helpers.ts`
- `server/database/init.ts`
- `server/api/status/all.get.ts`
- `server/api/tasks/index.get.ts`
- `server/api/tasks/index.post.ts`
- `server/api/tasks/[id].put.ts`

### Frontend
- `src/composables/useStatus.ts`
- `src/components/StatusBadge.vue`
- `src/components/StatusToggler.vue`

## Next Steps

To extend i18n to other entity types:
1. Add `lang` column to entity table (if not already present)
2. Update entity creation/update endpoints to accept `lang` parameter
3. Update Vue components to use `useStatus()` composable
4. Test with different language values

## Notes

- Default language is German (`de`)
- CHECK constraint ensures only valid languages
- Fallback chain prevents missing translations
- Computed columns automatically update when status or lang changes
