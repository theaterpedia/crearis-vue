# MR4 Import/Export System Documentation

## Overview

The MR4 Import/Export System provides complete data backup and migration capabilities for the Crearis platform. It handles exporting data from one database and importing it into another, with support for both **initial imports** (new records only) and **update imports** (merge changes).

## System Architecture

### Core Components

1. **Export System** (`server/database/backup/export.ts`)
   - Exports all entity tables with proper ordering
   - Handles computed columns (excludes GENERATED ALWAYS columns)
   - Exports late-seeding metadata (instructor_xmlid, regio_domaincode)
   - Creates compressed tarball backups

2. **Import System** (`server/database/backup/import.ts`)
   - 4-phase import with dependency resolution
   - Handles circular dependencies via setup placeholders
   - Late-seeding resolution for foreign keys
   - Skip mode: Skips existing records

3. **Update-Import System** (`server/database/backup/update-import.ts`)
   - UPSERT logic: INSERT new, UPDATE existing
   - Merges dev changes back to production
   - Preserves relationships via index columns
   - Handles same circular dependencies as import

4. **Late-Seed Configuration** (`server/database/backup/late-seed-config.ts`)
   - Defines which columns to exclude from export
   - Computed columns (GENERATED ALWAYS)
   - Circular dependency columns (instructor_id, regio)
   - Deprecated columns (old image fields)

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      WORKFLOW OVERVIEW                       │
└─────────────────────────────────────────────────────────────┘

SCENARIO 1: Initial Production Setup
────────────────────────────────────
Dev DB (with data)
    ↓
[Export] → backup.tar.gz
    ↓
[Import] → Production DB (empty)
    ↓
Result: Production has all dev data


SCENARIO 2: Ongoing Development Workflow
────────────────────────────────────────
Production DB (working system)
    ↓
[Export] → prod_backup.tar.gz
    ↓
[Import] → Dev DB (fresh)
    ↓
Work on dev, make changes...
    ↓
[Export] → dev_backup.tar.gz
    ↓
[Update-Import] → Production DB
    ↓
Result: Production has new records + updated records
```

## Import Phases

### Phase 0: System Tables (No Dependencies)
- **tags**: Tag system (remapped IDs)
- **status**: Status codes (preserves IDs from migrations)

### Phase 1: Entity Tables (With Index Columns)
Import order critical for foreign keys:
1. **users** (index: `sysmail`)
2. **projects** (index: `domaincode`)
3. **images** (index: `xmlid`)
4. **instructors** (index: `xmlid`)
5. **locations** (index: `xmlid`)
6. **participants** (index: `xmlid`)
7. **posts** (index: `xmlid`)
8. **events** (index: `xmlid`)

### Phase 2: System Tables (With Dependencies)
- **interactions**: System activity logs
- **pages**: Project pages (system table with auto-generated IDs)
- **tasks**: Task management

### Phase 3: Detail/Junction Tables
- **events_tags**: Event-tag relationships
- **posts_tags**: Post-tag relationships
- **project_members**: User-project membership
- **event_instructors**: Event-instructor relationships

### Phase 4: Late-Seeding Resolution
- **users.instructor_id**: Resolve via `instructor_xmlid` lookup
- **projects.regio**: Resolve via `regio_domaincode` lookup
- **Cleanup**: Remove setup instructor placeholder

## Circular Dependency Resolution

### Problem: users ↔ instructors
- Users have `instructor_id` FK to instructors
- But instructors is imported AFTER users (both in Phase 1)

**Solution:**
1. Create "setup" instructor placeholder before importing users
2. Import users with `instructor_id` = setup instructor ID
3. Import instructors normally
4. Phase 4: Update users.instructor_id to real instructors via `instructor_xmlid`
5. Delete setup instructor

### Problem: projects ↔ projects (self-reference)
- Projects have `regio` FK to other projects
- Can't guarantee parent project is imported first

**Solution:**
1. Import projects with `regio = NULL`
2. Phase 4: Update projects.regio to real projects via `regio_domaincode`

## Computed Columns Handling

Computed columns (GENERATED ALWAYS) cannot be inserted into. The system automatically excludes:

### Entity Tables
- `status_display` (users, posts, events, instructors, locations, participants)
- `is_regio`, `is_topic`, `is_onepage`, `is_service`, `is_sidebar` (projects)
- `page_has_content`, `aside_has_content`, `header_has_content`, `footer_has_content` (projects, pages)

These columns are regenerated automatically by PostgreSQL based on their generation expressions.

## CLI Usage

### Export
```bash
# CLI (not implemented yet - use API)
pnpm tsx server/database/backup/export.ts

# Via API
curl -X POST http://localhost:3000/api/admin/backup/export
```

### Import (Initial/Skip Mode)
```bash
# CLI
pnpm tsx server/database/backup/test-import.ts backup/backup_demo-data.db_1234567890.tar.gz

# Via API
curl -X POST http://localhost:3000/api/admin/backup/import \
  -H "Content-Type: application/json" \
  -d '{"tarballPath": "backup/backup_demo-data.db_1234567890.tar.gz", "mode": "skip"}'
```

### Update-Import (Merge/Upsert Mode)
```bash
# CLI
pnpm tsx server/database/backup/update-import.ts backup/backup_dev-data.db_1234567890.tar.gz

# Via API
curl -X POST http://localhost:3000/api/admin/backup/update-import \
  -H "Content-Type: application/json" \
  -d '{"tarballPath": "backup/backup_dev-data.db_1234567890.tar.gz"}'
```

## UI Integration

The ImagesCoreAdmin component has buttons for:
- **Export System Backup**: Creates tarball with timestamp
- **Import System Backup**: Opens file picker for tarball selection (not yet wired to update-import)

### Future Enhancement
Add separate buttons:
- "Import (New Records Only)" → calls `/api/admin/backup/import` (skip mode)
- "Import (Merge Changes)" → calls `/api/admin/backup/update-import` (upsert mode)

## Production Workflow Example

### Day 1: Setup Production
```bash
# On dev machine
1. Work on dev DB, add ~150 records
2. Export dev DB
   → backup_dev_2025-11-09.tar.gz

# On production server
3. Transfer tarball to server
4. Run import:
   pnpm tsx server/database/backup/test-import.ts backup_dev_2025-11-09.tar.gz
5. Verify: All 150 records imported
```

### Day 2: Work on Production, Then Update Dev
```bash
# On production
1. Edit pages, add content, discover bugs
2. Export production:
   → backup_prod_2025-11-10.tar.gz

# On dev machine
3. Create fresh dev DB (or drop/migrate existing)
4. Import production backup:
   pnpm tsx server/database/backup/test-import.ts backup_prod_2025-11-10.tar.gz
5. Fix bugs, update frontend, add new features
6. Add new test records (images, posts, events)
7. Export dev DB:
   → backup_dev_2025-11-10.tar.gz

# On production server
8. Transfer new dev backup
9. Run update-import (UPSERT mode):
   pnpm tsx server/database/backup/update-import.ts backup_dev_2025-11-10.tar.gz
10. Result:
    - New records from dev → inserted into production
    - Changed records from dev → updated in production
    - Unchanged records → left as-is
```

## Current Limitations & Known Issues

### 1. Tags All Skipped
- **Issue**: All 4 tags show as "skipped" during import
- **Cause**: Tags are seeded by migrations, duplicate name constraint
- **Impact**: Minimal - tags already exist from migrations
- **Fix**: Not critical, working as designed

### 2. Detail Table FK Resolution Not Implemented
- **Issue**: `importDetailTableWithMapping()` has placeholder code for FK resolution
- **Current**: Detail tables insert with exported FK values (works if parent IDs match)
- **Impact**: Works for same-database re-imports, may fail for cross-database
- **Fix**: Implement proper FK mapping using xmlid/sysmail/domaincode lookups

### 3. System Table Updates Not Implemented
- **Issue**: `upsertSystemTable()` only inserts, doesn't update
- **Cause**: System tables (pages, tasks) don't have natural unique keys besides ID
- **Impact**: Can't update existing pages/tasks during update-import
- **Fix**: Need to define unique identifiers or change to ID-based matching

### 4. No Validation or Rollback
- **Issue**: Import runs all phases sequentially, no transaction wrapping
- **Impact**: Partial failure leaves database in inconsistent state
- **Fix**: Wrap entire import in transaction, rollback on error

### 5. No Progress Reporting
- **Issue**: Long imports show no progress until complete
- **Impact**: User experience - looks frozen on large datasets
- **Fix**: Add streaming progress updates via WebSocket or SSE

## File Structure

```
server/
  database/
    backup/
      export.ts                 # Export system
      import.ts                 # Import system (skip mode)
      update-import.ts          # Update-import system (upsert mode)
      late-seed-config.ts       # Column exclusion configuration
      test-import.ts            # CLI test script
  api/
    admin/
      backup/
        export.post.ts          # Export API endpoint
        import.post.ts          # Import API endpoint
        update-import.post.ts   # Update-import API endpoint

backup/                         # Backup storage directory
  backup_demo-data.db_1762723397548.tar.gz
  backup_prod_2025-11-10.tar.gz
  ...

temp_import/                    # Temporary extraction directory
  import_1762723397548/
    index.json
    users.json
    projects.json
    ...
```

## Backup File Format

### Tarball Contents
```
backup_demo-data.db_1762723397548.tar.gz
├── index.json              # Metadata and file manifest
├── users.json              # Entity table data
├── projects.json
├── images.json
├── instructors.json
├── locations.json
├── participants.json
├── posts.json
├── events.json
├── tags.json
├── status.json
├── interactions.json
├── pages.json
└── tasks.json
```

### index.json Structure
```json
{
  "metadata": {
    "timestamp": "2025-11-09T21:24:26.528Z",
    "database": "demo-data.db",
    "migrationPackage": "@crearis/migrations",
    "version": "1.0.0"
  },
  "entities": [
    "tags",
    "status",
    "users",
    "projects",
    ...
  ],
  "files": {
    "tags": "tags.json",
    "status": "status.json",
    "users": "users.json",
    ...
  }
}
```

### Entity JSON Structure
```json
{
  "tableName": "users",
  "columns": [
    "id",
    "created_at",
    "sysmail",
    "name",
    "status_id",
    "instructor_xmlid"
  ],
  "rows": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-11-01T10:00:00.000Z",
      "sysmail": "john@example.com",
      "name": "John Doe",
      "status_id": 1,
      "instructor_xmlid": "instructor_001"
    },
    ...
  ],
  "detailTables": [
    {
      "tableName": "project_members",
      "columns": ["id", "project_id", "user_id", "role"],
      "rows": [...]
    }
  ]
}
```

## Testing & Verification

### Test Database Setup
```bash
# Create test database
sudo -u postgres psql -c "CREATE DATABASE crearis_import_test;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crearis_import_test TO crearis_admin;"
sudo -u postgres psql -d crearis_import_test -c "GRANT ALL ON SCHEMA public TO crearis_admin;"
sudo -u postgres psql -d crearis_import_test -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO crearis_admin;"

# Install pgcrypto extension
sudo -u postgres psql -d crearis_import_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Run migrations
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_import_test" pnpm run db:migrate

# Run manual migration 021 (system seed data)
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_import_test" RUN_MANUAL_MIGRATIONS=true pnpm run migrate
```

### Verification Queries
```sql
-- Check record counts
SELECT 'users' as table, COUNT(*) as count FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'images', COUNT(*) FROM images
UNION ALL SELECT 'instructors', COUNT(*) FROM instructors
UNION ALL SELECT 'locations', COUNT(*) FROM locations
UNION ALL SELECT 'participants', COUNT(*) FROM participants
UNION ALL SELECT 'posts', COUNT(*) FROM posts
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'project_members', COUNT(*) FROM project_members;

-- Check circular dependencies resolved
SELECT u.sysmail, u.instructor_id, i.xmlid, i.name
FROM users u
LEFT JOIN instructors i ON u.instructor_id = i.id
WHERE u.instructor_id IS NOT NULL;

SELECT p.domaincode, p.regio, r.domaincode as regio_domaincode
FROM projects p
LEFT JOIN projects r ON p.regio = r.id
WHERE p.regio IS NOT NULL;

-- Check for orphaned setup instructor (should be 0)
SELECT COUNT(*) FROM instructors WHERE xmlid = 'setup';
```

## Security Considerations

### Current Implementation
- **No authentication** on API endpoints (TODO)
- **No authorization** checks (TODO)
- **No rate limiting** (TODO)
- **File path validation** needed to prevent directory traversal

### Recommended Security
1. Add admin authentication middleware
2. Validate tarball paths (whitelist backup directory)
3. Add request signing/verification for API calls
4. Rate limit export/import endpoints
5. Log all import/export operations with user tracking
6. Encrypt sensitive data in backups (consider user passwords, API keys)

## Performance Considerations

### Current Performance
- Export: ~1-2 seconds for 200 records
- Import: ~3-5 seconds for 200 records
- Scales linearly with record count

### Optimization Opportunities
1. **Batch inserts**: Instead of row-by-row, use multi-row INSERT
2. **Disable triggers**: Temporarily disable triggers during import
3. **Parallel processing**: Import independent tables in parallel
4. **Streaming**: Stream tarball extraction instead of loading all into memory
5. **Connection pooling**: Reuse database connections

### Large Dataset Handling
For 10,000+ records:
- Consider chunked imports (1000 records at a time)
- Add progress callbacks
- Use COPY FROM instead of INSERT for bulk data
- Disable foreign key checks temporarily (re-enable after)

## Error Handling

### Current Behavior
- **Skip mode**: Continues on error, logs failures
- **Replace mode**: Throws error immediately (not recommended)
- **Partial failures**: Leaves database in inconsistent state

### Improved Error Handling (TODO)
```typescript
try {
  await db.run('BEGIN');
  
  // Phase 0-4 import
  const result = await importAllPhases();
  
  await db.run('COMMIT');
  return result;
} catch (error) {
  await db.run('ROLLBACK');
  throw error;
}
```

## Monitoring & Logging

### Current Logging
- Console logs for each table import
- Success/failure counts per table
- Error messages for failed rows

### Enhanced Monitoring (TODO)
1. **Structured logging**: JSON logs with timestamps
2. **Import history**: Store import metadata in database
3. **Alerts**: Email/Slack notification on import failure
4. **Metrics**: Track import duration, record counts, error rates
5. **Audit trail**: Who imported what when

---

## Quick Reference

### Common Commands
```bash
# Export current database
curl -X POST http://localhost:3000/api/admin/backup/export

# Import to empty database (skip existing)
pnpm tsx server/database/backup/test-import.ts backup/backup.tar.gz

# Update import (merge changes)
pnpm tsx server/database/backup/update-import.ts backup/backup.tar.gz

# Check import results
psql -U crearis_admin -d crearis_import_test -c "SELECT 'users', COUNT(*) FROM users;"
```

### Troubleshooting
**Q: Import fails with "cannot insert into column X"**
A: Column X is computed (GENERATED ALWAYS). Add to late-seed-config.ts exclusions.

**Q: Foreign key violation during import**
A: Check import order. Parent tables must be imported before children.

**Q: All tags show as "skipped"**
A: Normal behavior. Tags are seeded by migrations and already exist.

**Q: Setup instructor still exists after import**
A: Bug in cleanup. Manually delete: `DELETE FROM instructors WHERE xmlid = 'setup';`

**Q: Project_members fail with FK violations**
A: Projects were skipped (already existed). On clean DB, this won't happen.

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-09  
**Maintainer**: Crearis Development Team
