# MR4 Import System - Local Test Plan

## Overview
Test the complete export/import cycle with a fresh PostgreSQL database.

## Prerequisites
- Existing dev database with data (source)
- PostgreSQL installed
- pnpm installed

## Step 1: Export from Current Database

```bash
# Ensure you're on the dev database
# Check current .env
cat .env | grep DATABASE_URL

# Start dev server (if not running)
pnpm run dev

# Open browser and go to Images Admin
# Click "Data" menu → "Create System Backup"
# Note the filename, e.g.: backup_demo-data.db_1731187234.tar.gz
```

**Expected Result:**
- Tarball created in project root
- Contains: index.json, users.json, projects.json, **status.json**, tags.json, images.json, events.json, posts.json, etc.

**Verify status.json exists:**
```bash
tar -tzf backup_demo-data.db_*.tar.gz | grep status.json
```

---

## Step 2: Create New PostgreSQL Database

```bash
# Create new test database
sudo -u postgres psql -c "CREATE DATABASE crearis_import_test;"

# Create user if needed
sudo -u postgres psql -c "CREATE USER crearis WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crearis_import_test TO crearis;"
```

---

## Step 3: Update .env to New Database

```bash
# Backup current .env
cp .env .env.backup

# Edit .env
nano .env
```

Change:
```
DATABASE_URL=postgresql://crearis:your_password@localhost:5432/crearis_import_test
```

---

## Step 4: Run Migrations on New Database

```bash
# Run migrations up to 021
pnpm run migrate

# Or manually:
pnpm tsx server/database/migrate.ts
```

**Expected Result:**
- All migrations run successfully through 021
- Tables created: users, projects, events, posts, images, tags, **status**, etc.
- Status table populated with ~50 migration-seeded rows

**Verify status table:**
```bash
psql -U crearis -d crearis_import_test -c "SELECT COUNT(*) FROM status;"
```

---

## Step 5: Run Import

```bash
# Option A: Using test script
pnpm tsx server/database/backup/test-import.ts backup_demo-data.db_1731187234.tar.gz

# Option B: Using API (if server running)
# Open browser → Images Admin → Data menu → "Import System Backup"
# Enter: backup_demo-data.db_1731187234.tar.gz
```

**Expected Output:**
```
=== Import with Late-Seeding Resolution (skip mode) ===
Tarball: backup_demo-data.db_1731187234.tar.gz

Extracting tarball...
Backup metadata:
  Database: demo-data.db
  Package: A
  Created: 2024-11-09T...
  Entities: 12

=== PHASE 0: System Tables (no dependencies) ===

Importing system table tags: 15 rows... (remapping IDs)
  ✓ 15 imported, 0 skipped, 0 failed
  → 15 entries in mapping table

Importing system table status: 48 rows... (preserving IDs)
  ✓ 0 imported, 48 skipped, 0 failed

=== PHASE 1: Entity Tables (with index columns) ===

Importing users: 5 rows...
  ✓ 5 imported, 0 skipped, 0 failed
  → 5 entries in mapping table

Importing projects: 3 rows...
  ✓ 3 imported, 0 skipped, 0 failed
  → 3 entries in mapping table

Importing images: 25 rows...
  ✓ 25 imported, 0 skipped, 0 failed
  → 25 entries in mapping table

Importing instructors: 10 rows...
  ✓ 10 imported, 0 skipped, 0 failed

Importing events: 20 rows...
  ✓ 20 imported, 0 skipped, 0 failed

...

=== PHASE 2: System Tables (with dependencies) ===

Importing system table tasks: 12 rows... (remapping IDs)
  ✓ 12 imported, 0 skipped, 0 failed

=== PHASE 3: Detail/Junction Tables ===

Importing events_tags: 45 rows...
  ✓ 45 imported, 0 skipped, 0 failed

...

✅ Import completed successfully!
```

---

## Step 6: Verify Import

```bash
# Check record counts
psql -U crearis -d crearis_import_test << EOF
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'images', COUNT(*) FROM images
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'status', COUNT(*) FROM status
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;
EOF

# Verify foreign keys resolved correctly
psql -U crearis -d crearis_import_test -c "
SELECT e.xmlid, e.name, i.name as image_name 
FROM events e 
LEFT JOIN images i ON e.img_id = i.id 
LIMIT 5;
"

# Verify status references
psql -U crearis -d crearis_import_test -c "
SELECT e.name, s.name as status 
FROM events e 
JOIN status s ON e.status_id = s.id 
LIMIT 5;
"
```

---

## Expected Behavior Summary

### ✅ Status Table
- Migration creates and seeds ~48 status rows (IDs 1-50)
- Import tries to insert same status rows
- **Result**: All skipped with `ON CONFLICT (id) DO NOTHING`
- **Why this is correct**: Status is migration-managed, import shouldn't override

### ✅ Tags Table
- Migration creates empty tags table
- Import inserts tags with NEW auto-generated IDs
- Mapping table tracks: old_tag_id → new_tag_id
- Junction tables (events_tags, posts_tags) use mapping to resolve FKs

### ✅ Entity Tables (users, projects, images, events, etc.)
- Import via index columns (sysmail, domaincode, xmlid)
- Checks for existing records before insert
- Mapping tables track: xmlid → id
- Foreign keys resolve via mapping tables

### ✅ Foreign Key Resolution
- `img_id` references resolved via images mapping (xmlid → id)
- `status_id` references use migration-seeded IDs (stable)
- `tag_id` references resolved via tags mapping (old_id → new_id)
- `project_id` references resolved via projects mapping (domaincode → id)

---

## Troubleshooting

### Issue: "status.json not found"
**Solution**: Re-run export after updating code to include status table.

### Issue: "ON CONFLICT clause requires unique constraint"
**Solution**: Verify migrations created `id SERIAL PRIMARY KEY` on status table.

### Issue: "Foreign key violation on events.img_id"
**Solution**: Check that images are imported BEFORE events (Phase 1 ordering).

### Issue: "Duplicate key error on tags"
**Solution**: Verify tags are in Phase 0, not Phase 1 (shouldn't use xmlid).

---

## Cleanup After Test

```bash
# Restore original .env
mv .env.backup .env

# Drop test database (optional)
sudo -u postgres psql -c "DROP DATABASE crearis_import_test;"

# Delete test tarball (optional)
rm backup_demo-data.db_*.tar.gz
```

---

## Success Criteria

✅ Export creates tarball with status.json
✅ New database migrations run successfully
✅ Import completes without errors
✅ All entity tables have correct row counts
✅ Foreign keys resolve correctly (img_id, status_id, tag_ids)
✅ Status table has ~48 rows (migration-seeded, import skipped)
✅ Tags have new IDs but relationships maintained
✅ Images referenced by entities work (triggers populate img_* fields)
