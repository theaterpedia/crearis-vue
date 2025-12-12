# Events CRUD Refactoring Report

**Date:** 2026-01-12  
**Status:** ✅ Completed

---

## Summary: Step Events Refactoring (Last 2 Hours)

### Changes Completed to EventPanel.vue

1. **DropdownList Migration for Locations**
   - Replaced custom `LocationsDropdown` component with standardized `DropdownList entity="locations"`
   - Added 'locations' entity support to `ItemList.vue` (fetches from `/api/locations`)
   - Added 'locations' to `DropdownList.vue` entity type union
   - Removed unused location-related state: `locationDropdownRef`, `isLocationDropdownOpen`
   - Removed unused functions: `toggleLocationDropdown`, `selectLocation`
   - Changed `selectedLocation` ref type from `string` to `number | null` for proper FK handling

2. **XMLID Convention Implementation**
   - Added `generateSlug()` function matching AddPostPanel pattern
   - Added `getEventEntityFromCtags()` function to determine entity qualifier from ctags bitmask:
     - Priority 1: Realisierung (online=2 → `event_online`, hybrid=4 → `event_hybrid`)
     - Priority 2: Format (kurs=256 → `event_kurs`, projekt=2048 → `event_projekt`, konferenz=16384 → `event_konferenz`)
     - Default: `event`
   - XMLID format: `{domaincode}.{entity_qualifier}.{slug}`
   - Example: `theaterpedia.event_kurs.tanzworkshop`

3. **Status Handling**
   - Added status determination: DEMO (8) if user edited name/teaser, NEW (1) otherwise
   - Matches the pattern established in AddPostPanel.vue

4. **Field Updates**
   - Set `public_user` field from `selectedOwner` for display purposes
   - Set `header_type: 'cover'` for all new events (events use cover headers)

5. **Error Handling**
   - Updated duplicate key error message to German with user-friendly guidance
   - Pattern: "Du hast versucht, dieselbe Vorlage ein zweites Mal anzuwenden..."

---

## Refactoring Completed

### ✅ Created Missing Server API Endpoints

1. **server/api/events/[id].get.ts** - NEW
   - Fetches single event by ID
   - Joins with projects, users, and partners tables
   - Returns location_name and instructor_name

2. **server/api/events/[id].patch.ts** - NEW
   - Updates event fields (name, teaser, dates, tags, etc.)
   - Authorization: event creator, event owner, project owner, or member (configrole=8)
   - Returns updated event with related names

### ✅ Fixed EventPage.vue

1. **Changed PUT to PATCH** - Uses standard PATCH pattern for updates
2. **Fixed tag value handling** - Tags are now integers (0 default), not hex strings
3. **Changed default header_type** - From 'banner' to 'cover' for events

---

## Next Actions

### P0 - Schema Updates Required

1. **Add `header_size` to events table**
   - Events table may be missing the `header_size VARCHAR(20)` column
   - Create migration: `server/database/migrations/XXX_add_header_size_to_events.ts`
   - SQL: `ALTER TABLE events ADD COLUMN IF NOT EXISTS header_size VARCHAR(20)`

2. **Verify `header_type` column exists in events**
   - Should be `header_type VARCHAR(20) DEFAULT 'cover'`

### P1 - EditPanel Event-Specific Fields

1. **Add event-specific fields to EditPanel**
   - Date fields: `date_begin`, `date_end` (using DateRangeEdit)
   - Location dropdown: DropdownList entity="locations"
   - Event type select: workshop, project, course, conference, online, meeting
   - Consider creating dedicated EventEditPanel.vue for cleaner separation

2. **Conditional rendering based on entityType**
   ```vue
   <template v-if="entityType === 'events'">
       <DateRangeEdit ... />
       <DropdownList entity="locations" ... />
   </template>
   ```

### P2 - Cleanup

1. **Remove unused LocationsDropdown component**
   - File: `src/components/LocationsDropdown.vue` (if it exists)
   - Check for other usages before deletion

2. **Unify event_type with ctags:Format**
   - Currently event_type is a separate field (workshop, project, etc.)
   - Should sync with ctags bitmask Format group
   - Add to DEFERRED-v0.5.md if not immediate priority

### P3 - Testing

1. **Test event creation in stepper**
   - Verify XMLID generation with various ctag combinations
   - Test status assignment (NEW vs DEMO)
   - Verify location dropdown works

2. **Test event editing via EditPanel**
   - Verify PATCH endpoint works
   - Test tag updates
   - Verify header_type persists

---

## Reference: Current Events Table Schema

Check these columns exist:
```sql
-- Core fields
id TEXT PRIMARY KEY,       -- xmlid
name TEXT NOT NULL,
teaser TEXT,
md TEXT,
html TEXT,

-- Dates
date_begin TIMESTAMP,
date_end TIMESTAMP,

-- References
project_id INTEGER,
owner_id INTEGER,          -- FK to users
creator_id INTEGER,        -- FK to users
public_user INTEGER,       -- FK to partners (display)
location INTEGER,          -- FK to partners (location)
template TEXT,             -- xmlid of base event

-- Images
img_id INTEGER,            -- FK to images
cimg TEXT,                 -- legacy image URL

-- Display
header_type VARCHAR(20),   -- 'cover', 'banner', 'hero', 'minimal'
header_size VARCHAR(20),   -- 'small', 'medium', 'large' ← MAY BE MISSING
event_type VARCHAR(50),    -- 'workshop', 'project', etc.

-- Sysreg tags (INTEGER bitmasks)
status INTEGER DEFAULT 1,
ttags INTEGER DEFAULT 0,
ctags INTEGER DEFAULT 0,
dtags INTEGER DEFAULT 0,
rtags INTEGER DEFAULT 0,

-- Timestamps
created_at TIMESTAMP,
updated_at TIMESTAMP
```

