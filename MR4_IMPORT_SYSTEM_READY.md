# MR4 Import System - Ready for Testing

## ✅ Implementation Complete

The three-phase import system with late-seeding resolution is now fully implemented and integrated.

## Components Created/Modified

### Backend (NEW)
1. **server/api/admin/backup/import.post.ts** (64 lines)
   - POST endpoint: `/api/admin/backup/import`
   - Accepts: `{ tarballPath: string, mode: 'skip' | 'replace' }`
   - Returns: ImportResult with stats and mappings

2. **server/database/backup/import.ts** (~400 lines)
   - Three-phase import system:
     * **Phase 1**: Entity tables with index columns (users, projects, events, posts, instructors, locations, participants)
     * **Phase 2**: System tables with id remapping (images, tags, interactions, pages, tasks)
     * **Phase 3**: Detail/junction tables with FK resolution
   - Late-seeding resolver with 9 mapping tables:
     * users: `sysmail → id`
     * projects: `domaincode → id`
     * events/posts/instructors/locations/participants: `xmlid → id`
     * images/tags: `old_id → new_id`

3. **server/database/backup/test-import.ts** (27 lines)
   - CLI test script
   - Usage: `pnpm tsx server/database/backup/test-import.ts <tarball-path>`

### Frontend (MODIFIED)
4. **src/views/admin/ImagesCoreAdmin.vue**
   - Added `importSystemBackup()` function (lines 667-714)
   - Added "Import System Backup" button in Data menu (line 1502)
   - Displays import statistics and refreshes image list after success

## Testing Instructions

### Option 1: Via UI (Recommended)
1. Start the development server: `pnpm dev`
2. Navigate to Images Admin page
3. Click **Data** menu → **Import System Backup**
4. Enter tarball path when prompted (e.g., `backup_demo-data.db_1234567890.tar.gz`)
5. Confirm the import
6. View success dialog with statistics

### Option 2: Via CLI (For debugging)
```bash
pnpm tsx server/database/backup/test-import.ts /path/to/backup.tar.gz
```

### Option 3: Via API (Direct)
```bash
curl -X POST http://localhost:3000/api/admin/backup/import \
  -H "Content-Type: application/json" \
  -d '{
    "tarballPath": "/path/to/backup.tar.gz",
    "mode": "skip"
  }'
```

## Expected Workflow for Tomorrow

1. **Create backup on dev machine:**
   - Go to Images Admin → Data menu → "Create System Backup"
   - Note the filename (e.g., `backup_demo-data.db_1234567890.tar.gz`)
   - Locate file in `./` (workspace root)

2. **Transfer to production:**
   ```bash
   scp backup_demo-data.db_1234567890.tar.gz user@production-server:/path/to/crearis-vue/
   ```

3. **Import on production:**
   - Go to Images Admin → Data menu → "Import System Backup"
   - Enter full path: `/path/to/crearis-vue/backup_demo-data.db_1234567890.tar.gz`
   - Confirm import
   - Review statistics dialog

## Import Behavior (Mode: 'skip')

- **Duplicate Detection:**
  - users: Checks `sysmail` uniqueness
  - projects: Checks `domaincode` uniqueness
  - events/posts/instructors/locations/participants: Checks `xmlid` uniqueness
  - images/tags: Always inserts with new `id` (no duplicate check)

- **Foreign Key Resolution:**
  - System tables (images, tags) get new IDs → mapping tables track old→new
  - Detail tables resolve FKs using mappings:
    * `event_instructors`: Maps `event_id` via events.xmlid, `instructor_id` via instructors.xmlid
    * `project_members`: Maps `project_id` via projects.domaincode, `user_id` via users.sysmail
    * `events_tags`, `posts_tags`: Maps via xmlid and id mappings

- **Skipped Records:**
  - Existing records with matching index columns are skipped
  - Duplicate junction table entries (same FK pair) are skipped
  - All skips are counted in statistics

## Success Criteria

For ~150 records:
- ✅ No FK constraint violations
- ✅ All index columns (sysmail, domaincode, xmlid) correctly map to IDs
- ✅ Images and tags get new IDs without conflicts
- ✅ Junction tables correctly resolve both sides of relationships
- ✅ Statistics show: `imported + skipped = total`

## Known Limitations (Current Implementation)

1. **No rollback mechanism** - If import fails mid-way, database may be partially modified
2. **No progress indicators** - Large imports appear frozen during processing
3. **Basic error handling** - Detailed error context may be limited
4. **Admin authentication** - Currently placeholder (TODO: Add proper auth check)

## Refinement Opportunities

Based on tomorrow's test:
- Add progress callbacks for large imports
- Implement transaction rollback on failure
- Add dry-run mode to preview changes
- Enhance error reporting with line numbers
- Add validation for required index columns before import
- Create detailed import log file

## File Locations

```
server/
  api/admin/backup/
    import.post.ts          ← API endpoint
  database/backup/
    import.ts               ← Core import logic
    test-import.ts          ← CLI test script
    late-seed-config.ts     ← Import rules (existing)

src/views/admin/
  ImagesCoreAdmin.vue       ← UI integration (lines 667-714, 1502)
```

## Quick Verification

Test the import system is working:
```bash
# 1. Create a test backup first
curl -X POST http://localhost:3000/api/admin/backup/export \
  -H "Content-Type: application/json" \
  -d '{"database":"demo-data.db","migrationPackage":"A","description":"Test"}'

# 2. Import the backup (should skip all duplicates)
pnpm tsx server/database/backup/test-import.ts backup_demo-data.db_*.tar.gz
```

Expected output:
```
Import completed successfully!
users: 0/X imported
projects: 0/Y imported
events: 0/Z imported
...
(All records skipped as duplicates)
```

## Support

If issues arise during tomorrow's transfer:
1. Check console logs for detailed error messages
2. Verify tarball exists and is readable
3. Ensure database connection is active
4. Check for FK constraint violations in PostgreSQL logs
5. Review mapping tables in ImportResult for missing entries

Ready for production testing! 🚀
