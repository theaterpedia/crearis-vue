# Data Actions Complete ✅

**Date:** October 14, 2025  
**Script:** `server/database/data-actions.ts`  
**Status:** ✅ All Actions Complete

---

## Summary

Successfully applied data rules and created project-specific data for `project1` and `project2` without altering CSV files (SQLite only).

---

## Actions Performed

### 1. ✅ Set isBase=true for Demo Events

**Rule:** Events with IDs starting with `_demo.` are base/template events.

```sql
UPDATE events 
SET isBase = 1 
WHERE id LIKE '_demo.%'
```

**Result:**
- Updated 21 events
- All demo events now have `isBase = 1`
- Project events have `isBase = 0`

**Breakdown:**
- Base events (_demo.*): 21
- Project events: 8 (4 for project1, 4 for project2)

### 2. ✅ Created Project1 Data

Created **4 events** for project1 with naming pattern: `project1.event_workshop_{1-4}`

**Events Created:**
1. `project1.event_workshop_1` - "Forum-Theater: Konflikte im Alltag - Project1 Edition 1"
2. `project1.event_workshop_2` - "Improtheater für Kinder (8-12 Jahre) - Project1 Edition 2"
3. `project1.event_workshop_3` - "Applied Theatre: Klimagerechtigkeit - Project1 Edition 3"
4. `project1.event_workshop_4` - "Bewegungstheater & Physical Performance - Project1 Edition 4"

**For Each Event:**
- ✅ 1 Post linked to the event (`project1.post_announcement_{1-4}`)
- ✅ 1 Location linked to the event (`project1.location_venue_{1-4}`)
- ✅ 1 Instructor linked to the event (`project1.instructor_{1-4}`)
- ✅ 1-2 Participants linked to the event (alternating pattern)

**Totals for Project1:**
- 4 Events
- 4 Posts (all linked to project1 events)
- 4 Locations
- 4 Instructors
- 6 Participants

### 3. ✅ Created Project2 Data

Created **4 events** for project2 with naming pattern: `project2.event_session_{1-4}`

**Events Created:**
1. `project2.event_session_1` - "Forum-Theater: Konflikte im Alltag - Project2 Session 1"
2. `project2.event_session_2` - "Improtheater für Kinder (8-12 Jahre) - Project2 Session 2"
3. `project2.event_session_3` - "Applied Theatre: Klimagerechtigkeit - Project2 Session 3"
4. `project2.event_session_4` - "Bewegungstheater & Physical Performance - Project2 Session 4"

**For Each Event:**
- ✅ 1 Post linked to the event (`project2.post_update_{1-4}`)
- ✅ 1 Location linked to the event (`project2.location_space_{1-4}`)
- ✅ 1 Instructor linked to the event (`project2.instructor_{1-4}`)
- ✅ 1-2 Participants linked to the event (alternating pattern)

**Totals for Project2:**
- 4 Events
- 4 Posts (all linked to project2 events)
- 4 Locations
- 4 Instructors
- 6 Participants

### 4. ✅ Main Tasks Auto-Created

The entity-task relationship triggers automatically created main tasks for all new entities:

- **44 new main tasks** created via triggers
- Tasks created for: events, posts, locations, instructors, participants
- All with `category = 'main'` and `title = '{{main-title}}'`

---

## Data Validation

### XML ID Pattern Compliance

All created IDs follow the correct pattern: `<project>.<entity_type>_<name>`

**Examples:**
- ✅ `project1.event_workshop_1` - Valid
- ✅ `project2.post_update_3` - Valid
- ✅ `project1.location_venue_2` - Valid
- ✅ `_demo.event_forum_theater_schwabing` - Valid (base data)

**Pattern Rules:**
- `<project>` must be valid project name or `_demo`
- `<entity_type>` matches table name (singular)
- `<name>` is lowercase with underscores/hyphens

### Relationship Integrity

All relationships properly established:

**Posts → Events:**
```
project1.post_announcement_1 → project1.event_workshop_1
project1.post_announcement_2 → project1.event_workshop_2
project1.post_announcement_3 → project1.event_workshop_3
project1.post_announcement_4 → project1.event_workshop_4

project2.post_update_1 → project2.event_session_1
project2.post_update_2 → project2.event_session_2
project2.post_update_3 → project2.event_session_3
project2.post_update_4 → project2.event_session_4
```

**Locations → Events:**
```
project1.location_venue_{1-4} → project1.event_workshop_{1-4}
project2.location_space_{1-4} → project2.event_session_{1-4}
```

**Instructors → Events:**
```
project1.instructor_{1-4} → project1.event_workshop_{1-4}
project2.instructor_{1-4} → project2.event_session_{1-4}
```

**Participants → Events:**
```
project1.participant_{1-6} → project1.event_workshop_{1-4} (1-2 per event)
project2.participant_{1-6} → project2.event_session_{1-4} (1-2 per event)
```

---

## Database Totals (After Actions)

### Events
- **Total:** 29 events
- **Base (_demo.*):** 21 events (`isBase = 1`)
- **Project1:** 4 events (`isBase = 0`)
- **Project2:** 4 events (`isBase = 0`)

### Posts
- **Total:** 38 posts
- **Demo:** 30 posts
- **Project1:** 4 posts (all linked to project1 events)
- **Project2:** 4 posts (all linked to project2 events)

### Locations
- **Total:** 29 locations
- **Demo:** 21 locations
- **Project1:** 4 locations
- **Project2:** 4 locations

### Instructors
- **Total:** 28 instructors
- **Demo:** 20 instructors
- **Project1:** 4 instructors
- **Project2:** 4 instructors

### Participants
- **Total:** 57 participants
- **Demo:** 45 participants
- **Project1:** 6 participants
- **Project2:** 6 participants

### Tasks
- **Total:** 190 tasks (auto-created main tasks for all entities)
- **Main tasks:** 190
- **New main tasks for projects:** 44

---

## Examples

### Example 1: Project1 Event with All Links

**Event:** `project1.event_workshop_1`
- **Name:** "Forum-Theater: Konflikte im Alltag - Project1 Edition 1"
- **isBase:** 0

**Linked Entities:**
- **Post:** `project1.post_announcement_1` - "Forum-Theater verändert Nachbarschaften - Project1 1"
- **Location:** `project1.location_venue_1` - "Theaterwerkstatt Schwabing - Project1 Venue 1"
- **Instructor:** `project1.instructor_1` - "Anna Weber - Project1"
- **Participants:** `project1.participant_1` - "Sophie Müller - P1"

**Main Task:** Auto-created with `category='main'`, `record_type='event'`, `record_id='project1.event_workshop_1'`

### Example 2: Project2 Event with All Links

**Event:** `project2.event_session_1`
- **Name:** "Forum-Theater: Konflikte im Alltag - Project2 Session 1"
- **isBase:** 0

**Linked Entities:**
- **Post:** `project2.post_update_1`
- **Location:** `project2.location_space_1`
- **Instructor:** `project2.instructor_1`
- **Participants:** 2 participants (alternating pattern)

---

## Verification Queries

### Check isBase Distribution
```sql
SELECT isBase, COUNT(*) as count 
FROM events 
GROUP BY isBase;
```

**Result:**
- `isBase = 0`: 8 events (project-specific)
- `isBase = 1`: 21 events (base/demo)

### Check Project1 Data
```sql
SELECT 'events' as type, COUNT(*) as count FROM events WHERE id LIKE 'project1.%'
UNION ALL
SELECT 'posts', COUNT(*) FROM posts WHERE id LIKE 'project1.%'
UNION ALL
SELECT 'locations', COUNT(*) FROM locations WHERE id LIKE 'project1.%'
UNION ALL
SELECT 'instructors', COUNT(*) FROM instructors WHERE id LIKE 'project1.%'
UNION ALL
SELECT 'participants', COUNT(*) FROM participants WHERE id LIKE 'project1.%';
```

### Check Post-Event Relationships
```sql
SELECT p.id, p.name, p.event_id, e.name as event_name
FROM posts p
JOIN events e ON p.event_id = e.id
WHERE p.id LIKE 'project1.%' OR p.id LIKE 'project2.%';
```

### Check Main Tasks Created
```sql
SELECT COUNT(*) as count
FROM tasks
WHERE category = 'main'
AND (record_id LIKE 'project1.%' OR record_id LIKE 'project2.%');
```

**Result:** 44 main tasks

---

## Important Notes

### CSV Files Not Modified
- ✅ All changes made directly to SQLite database
- ✅ CSV files in `src/assets/csv/` remain unchanged
- ✅ This is temporary test data for development

### Naming Conventions
- **Project1:** Uses "Workshop" and "Edition" in names
- **Project2:** Uses "Session" in names
- **Locations:** Project1 uses "Venue", Project2 uses "Space"
- **Posts:** Project1 uses "Announcement", Project2 uses "Update"

### Participant Distribution
- Events 1 & 3: 1 participant each
- Events 2 & 4: 2 participants each
- Total: 6 participants per project (12 total)

### Trigger Behavior
All entity-task relationship triggers fired successfully:
- `create_event_main_task` - 8 times
- `create_post_main_task` - 8 times
- `create_location_main_task` - 8 times
- `create_instructor_main_task` - 8 times
- `create_participant_main_task` - 12 times

---

## Testing Commands

```bash
# Run the data actions script
pnpm tsx server/database/data-actions.ts

# Check events by isBase
curl -s 'http://localhost:3000/api/events?isBase=1' | grep count

# Get project1 tasks
curl -s 'http://localhost:3000/api/tasks?category=main' | grep project1

# Verify relationships
pnpm exec tsx -e "
import Database from 'better-sqlite3'
const db = new Database('demo-data.db')
const post = db.prepare('SELECT * FROM posts WHERE id = ?').get('project1.post_announcement_1')
console.log('Post:', post)
console.log('Linked to event:', post.event_id)
db.close()
"
```

---

## Next Steps (Optional)

### Potential Enhancements:
1. ⏳ Add more varied data (different event types, dates, locations)
2. ⏳ Create cross-project relationships
3. ⏳ Add release assignments to project tasks
4. ⏳ Populate image and prompt fields for some tasks
5. ⏳ Create admin and release category tasks

### Data Export:
If needed, data can be exported from SQLite:
```bash
# Export to SQL dump
sqlite3 demo-data.db .dump > backup.sql

# Export specific tables
sqlite3 demo-data.db "SELECT * FROM events WHERE id LIKE 'project%'" > project-events.csv
```

---

## Summary

✅ **All data actions completed successfully!**

- 21 demo events marked as base (`isBase = 1`)
- 8 project events created (4 per project, `isBase = 0`)
- 8 posts created and linked to project events
- 8 locations created and linked to project events
- 8 instructors created and linked to project events
- 12 participants created and linked to project events (1-2 per event)
- 44 main tasks auto-created via triggers
- All XML ID patterns follow validation rules
- All relationships properly established
- CSV files remain untouched

**Total new records:** 44 entities + 44 tasks = **88 new records**

---

**Script Location:** `server/database/data-actions.ts`  
**Can be re-run:** No (would create duplicates - add idempotency checks if needed)  
**Rollback:** Restore from database backup before running script
