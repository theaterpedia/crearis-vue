# MR4 Import/Export System - Quick Reference

## Your Daily Workflow

### Scenario: Working on Production → Dev → Production

```bash
# MORNING: Sync production to dev
# ─────────────────────────────────────

# 1. On production server: Export current state
curl -X POST http://your-server.com/api/admin/backup/export
# → Creates: backup/backup_prod_2025-11-09.tar.gz

# 2. Download backup to dev machine
scp user@server:/path/to/backup/backup_prod_2025-11-09.tar.gz ~/crearis/backup/

# 3. On dev: Import to dev database
pnpm tsx server/database/backup/test-import.ts backup/backup_prod_2025-11-09.tar.gz
# → Now dev DB matches production


# AFTERNOON: Work on dev, fix bugs, add features
# ───────────────────────────────────────────────

# Edit code, update UI, add test data...
# Add new images, posts, events
# Fix bugs in page rendering


# EVENING: Push changes back to production
# ─────────────────────────────────────────

# 1. On dev: Export with changes
curl -X POST http://localhost:3000/api/admin/backup/export
# → Creates: backup/backup_dev_2025-11-09.tar.gz

# 2. Upload to production
scp backup/backup_dev_2025-11-09.tar.gz user@server:/path/to/backup/

# 3. On production: Merge changes (UPSERT)
pnpm tsx server/database/backup/update-import.ts backup/backup_dev_2025-11-09.tar.gz
# → Inserts new records, updates changed records, keeps unchanged
```

## Command Cheat Sheet

### Export
```bash
# Via UI (ImagesCoreAdmin)
Click "Export System Backup" button

# Via API
curl -X POST http://localhost:3000/api/admin/backup/export

# Result
backup/backup_demo-data.db_1762723397548.tar.gz
```

### Import (New Records Only)
```bash
# CLI - Best for testing
pnpm tsx server/database/backup/test-import.ts backup/YOUR_BACKUP.tar.gz

# API
curl -X POST http://localhost:3000/api/admin/backup/import \
  -H "Content-Type: application/json" \
  -d '{"tarballPath": "backup/YOUR_BACKUP.tar.gz", "mode": "skip"}'

# What it does
- Inserts new records
- Skips existing records (by sysmail, domaincode, xmlid)
- Does NOT update existing records
```

### Update-Import (Merge Changes)
```bash
# CLI - Use this for dev → production
pnpm tsx server/database/backup/update-import.ts backup/YOUR_BACKUP.tar.gz

# API
curl -X POST http://localhost:3000/api/admin/backup/update-import \
  -H "Content-Type: application/json" \
  -d '{"tarballPath": "backup/YOUR_BACKUP.tar.gz"}'

# What it does
- Inserts new records
- Updates existing records (by sysmail, domaincode, xmlid)
- Keeps records not in backup
```

## Database Setup (First Time Only)

### Create Test Database
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE crearis_import_test;"

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crearis_import_test TO crearis_admin;"
sudo -u postgres psql -d crearis_import_test -c "GRANT ALL ON SCHEMA public TO crearis_admin;"
sudo -u postgres psql -d crearis_import_test -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO crearis_admin;"

# Install extensions
sudo -u postgres psql -d crearis_import_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Run migrations
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_import_test" pnpm run db:migrate

# Run manual migration (system seed data)
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_import_test" RUN_MANUAL_MIGRATIONS=true pnpm run migrate
```

### Drop and Recreate (Clean Slate)
```bash
# Drop database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS crearis_import_test;"

# Recreate
sudo -u postgres psql -c "CREATE DATABASE crearis_import_test;"

# Repeat setup steps above
```

## Verification Queries

### Check Import Success
```sql
-- Quick count of all tables
SELECT 
  'users' as table, COUNT(*) as count FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'images', COUNT(*) FROM images
UNION ALL SELECT 'instructors', COUNT(*) FROM instructors
UNION ALL SELECT 'locations', COUNT(*) FROM locations
UNION ALL SELECT 'participants', COUNT(*) FROM participants
UNION ALL SELECT 'posts', COUNT(*) FROM posts
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'project_members', COUNT(*) FROM project_members;
```

### Check Circular Dependencies
```sql
-- Users → Instructors (should have no setup instructor)
SELECT u.sysmail, u.instructor_id, i.xmlid, i.name
FROM users u
LEFT JOIN instructors i ON u.instructor_id = i.id
WHERE u.instructor_id IS NOT NULL;

-- Should be 0 (setup instructor cleaned up)
SELECT COUNT(*) FROM instructors WHERE xmlid = 'setup';

-- Projects → Projects (regio references)
SELECT p.domaincode, p.regio, r.domaincode as regio_domaincode
FROM projects p
LEFT JOIN projects r ON p.regio = r.id
WHERE p.regio IS NOT NULL;
```

### Find Issues
```sql
-- Orphaned records (project_members without valid project)
SELECT pm.* FROM project_members pm
LEFT JOIN projects p ON pm.project_id = p.id
WHERE p.id IS NULL;

-- Orphaned records (images without valid project)
SELECT i.* FROM images i
LEFT JOIN projects p ON i.project_id = p.id
WHERE i.project_id IS NOT NULL AND p.id IS NULL;
```

## Troubleshooting

### Problem: "cannot insert into column X"
**Cause**: Column X is computed (GENERATED ALWAYS)  
**Solution**: Add to `late-seed-config.ts` exclusions

### Problem: "foreign key constraint violation"
**Cause**: Parent record doesn't exist  
**Solution**: Check import order. Run import on clean database.

### Problem: "all tags skipped"
**Cause**: Tags are migration-seeded, already exist  
**Solution**: Normal behavior, not an error

### Problem: "setup instructor still exists"
**Cause**: Cleanup step failed  
**Solution**: Manual cleanup: `DELETE FROM instructors WHERE xmlid = 'setup';`

### Problem: "project_members failed"
**Cause**: Projects were skipped (already existed from previous test)  
**Solution**: On clean production DB, this won't happen

### Problem: Import looks frozen
**Cause**: No progress reporting yet  
**Solution**: Check terminal/logs for output. Be patient. ~5 seconds for 200 records.

## File Locations

```
/home/persona/crearis/crearis-vue/
├── backup/                              # Backup storage
│   ├── backup_demo-data.db_*.tar.gz
│   └── backup_prod_*.tar.gz
├── server/
│   ├── database/
│   │   └── backup/
│   │       ├── export.ts                # Export system
│   │       ├── import.ts                # Import (skip mode)
│   │       ├── update-import.ts         # Update-import (upsert mode)
│   │       ├── late-seed-config.ts      # Column exclusions
│   │       └── test-import.ts           # CLI test script
│   └── api/
│       └── admin/
│           └── backup/
│               ├── export.post.ts
│               ├── import.post.ts
│               └── update-import.post.ts
├── docs/
│   ├── MR4_IMPORT_EXPORT_SYSTEM.md      # Full documentation
│   ├── MR4_NEXT_ACTIONS.md              # Improvement roadmap
│   └── MR4_QUICK_REFERENCE.md           # This file
└── temp_import/                         # Temporary (auto-deleted)
```

## Environment Variables

```bash
# .env file on production
DATABASE_URL="postgresql://user:pass@localhost:5432/crearis_production"

# .env file on dev
DATABASE_URL="postgresql://user:pass@localhost:5432/crearis_dev"

# For test database
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_import_test"
```

## What Gets Imported

### Phase 0: System Tables
- ✅ tags (4 records, usually skipped - migration-seeded)
- ✅ status (81 records, preserves IDs)

### Phase 1: Entity Tables
- ✅ users (indexed by sysmail)
- ✅ projects (indexed by domaincode)
- ✅ images (indexed by xmlid)
- ✅ instructors (indexed by xmlid)
- ✅ locations (indexed by xmlid)
- ✅ participants (indexed by xmlid)
- ✅ posts (indexed by xmlid)
- ✅ events (indexed by xmlid)

### Phase 2: System Tables (Dependencies)
- ✅ interactions (system logs)
- ✅ pages (project pages)
- ✅ tasks (task management)

### Phase 3: Junction Tables
- ✅ events_tags (event-tag relationships)
- ✅ posts_tags (post-tag relationships)
- ✅ project_members (user-project membership)
- ✅ event_instructors (event-instructor relationships)

### Phase 4: Late-Seeding
- ✅ users.instructor_id resolved via instructor_xmlid
- ✅ projects.regio resolved via regio_domaincode
- ✅ setup instructor cleaned up

## Expected Results (200 Record Dataset)

```
tags: 0/4 imported, 4 skipped, 0 failed          ← Normal (migration-seeded)
status: 81/81 imported, 0 skipped, 0 failed      ← Perfect
users: 17/23 imported, 6 skipped, 0 failed       ← 6 already existed
projects: 17/18 imported, 1 skipped, 0 failed    ← 1 already existed
images: 6/6 imported, 0 skipped, 0 failed        ← Perfect
instructors: 23/23 imported, 0 skipped, 0 failed ← Perfect
locations: 21/21 imported, 0 skipped, 0 failed   ← Perfect
participants: 45/45 imported, 0 skipped, 0 failed← Perfect
posts: 30/30 imported, 0 skipped, 0 failed       ← Perfect
events: 21/21 imported, 0 skipped, 0 failed      ← Perfect
pages: 2/2 imported, 0 skipped, 0 failed         ← Perfect
project_members: 12/14 imported, 2 skipped, 0 failed ← 2 ref skipped project

TOTAL: 235/257 imported (91.4%)
```

**On clean database**: 100% success (only tags skipped)

## Import vs Update-Import: Which to Use?

### Use Import (`import.ts`) When:
- ✅ Setting up production for the first time
- ✅ Creating a new dev database from production backup
- ✅ Restoring from backup after data loss
- ✅ You want to skip existing records (no updates)

### Use Update-Import (`update-import.ts`) When:
- ✅ Merging dev changes back to production
- ✅ Syncing changes between databases
- ✅ You want to update existing records with new data
- ✅ Daily workflow: dev → production

### The Difference
```
Import (Skip Mode):
  - New record: INSERT ✅
  - Existing record: SKIP ⏭️

Update-Import (Upsert Mode):
  - New record: INSERT ✅
  - Existing record: UPDATE ✅
```

## Safety Tips

1. **Always test on dev first** before running on production
2. **Backup production before import** (export first!)
3. **Verify counts** after import (run verification queries)
4. **Check logs** for errors/warnings
5. **Test circular dependencies** (users.instructor_id, projects.regio)

## Performance Expectations

| Records | Export Time | Import Time |
|---------|-------------|-------------|
| 200     | 1-2 sec     | 3-5 sec     |
| 1,000   | 5-10 sec    | 15-30 sec   |
| 10,000  | 30-60 sec   | 2-5 min     |

*Times are approximate and depend on hardware*

## Getting Help

1. Check logs in terminal/console
2. Run verification queries
3. Check `docs/MR4_IMPORT_EXPORT_SYSTEM.md` for detailed docs
4. Check `docs/MR4_NEXT_ACTIONS.md` for known issues
5. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`

---

**Remember**: Import is powerful. Always backup production before running update-import!
