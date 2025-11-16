# Database Migrations Guide

## Overview

This project uses a custom migration system to manage database schema changes across both **PostgreSQL** and **SQLite** databases. This guide explains how to create, run, and manage migrations safely and effectively.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Migration System Architecture](#migration-system-architecture)
3. [Creating Migrations](#creating-migrations)
4. [Running Migrations](#running-migrations)
5. [Version Management](#version-management)
6. [Cross-Database Migrations](#cross-database-migrations)
7. [Testing Migrations](#testing-migrations)
8. [Rollback Strategy](#rollback-strategy)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Check Migration Status
```bash
pnpm db:migrate:status
# or
pnpm db:migrate --status
```

### Run Pending Migrations
```bash
pnpm db:migrate
```

### Check Schema Validation
```bash
pnpm version:check
# or
pnpm db:check-structure
```

### Update Version
```bash
pnpm version:bump
```

---

## Migration System Architecture

### Components

1. **Migration Files** (`server/database/migrations/NNN_*.ts`)
   - Sequential numbered migration files (000, 001, 002, ...)
   - Each contains schema changes and metadata
   - Forward-only (no rollback functions)

2. **Migration Runner** (`server/database/migrations/index.ts`)
   - Orchestrates migration execution
   - Tracks which migrations have run
   - Ensures migrations run in order

3. **Migration Tracking** (`crearis_config` table)
   - Stores current version and migration history
   - PostgreSQL: JSONB column
   - SQLite: TEXT column with JSON content

4. **Schema Validation** (`check-structure.ts`)
   - Validates actual schema against JSON definition
   - Runs automatically before version bumps
   - Can be run manually anytime

### Migration Lifecycle

```
1. Developer creates migration file (NNN_description.ts)
   ↓
2. Developer tests on both PostgreSQL and SQLite
   ↓
3. Migration is committed to repository
   ↓
4. Application startup runs pending migrations automatically
   ↓
5. Migration is marked as complete in crearis_config
   ↓
6. Schema validation confirms structure matches definition
```

---

## Creating Migrations

### Step 1: Choose Migration Number

Migrations are numbered sequentially starting from 000. Find the highest number and increment:

```bash
ls server/database/migrations/*.ts
# 000_base_schema.ts
# 001_init_schema.ts
# 002_align_schema.ts
# Next should be: 003_your_migration.ts
```

### Step 2: Copy Template

Use the example migration as a template:

```bash
cp server/database/migrations/003_example.ts server/database/migrations/004_add_user_preferences.ts
```

### Step 3: Update Metadata

```typescript
export const metadata = {
    id: '004_add_user_preferences',  // Must match filename
    description: 'Add user preferences table',
    version: '0.0.2',  // Version this migration was created for
    date: '2025-10-15',  // Creation date
}
```

### Step 4: Implement Migration Logic

See [Creating Migrations](#creating-migrations-detailed) section below for detailed patterns.

### Step 5: Register Migration

Add to `server/database/migrations/index.ts`:

```typescript
import { runUserPreferencesMigration, metadata as prefMeta } from './004_add_user_preferences'

const migrations: Migration[] = [
    { run: runBaseSchemaMigration, metadata: baseMeta },
    { run: runConfigTableMigration, metadata: configMeta },
    { run: runSchemaAlignmentMigration, metadata: alignMeta },
    { run: runUserPreferencesMigration, metadata: prefMeta },  // NEW
]
```

---

## Creating Migrations (Detailed)

### Naming Convention

- **Format**: `NNN_descriptive_name.ts`
- **NNN**: Zero-padded sequential number (000, 001, 002, ...)
- **descriptive_name**: Short description using snake_case
- **Examples**:
  - `004_add_user_preferences.ts`
  - `005_add_indexes_for_performance.ts`
  - `006_migrate_legacy_data.ts`

### Migration Template Structure

```typescript
import type { DatabaseAdapter } from '../adapter'

export const metadata = {
    id: 'NNN_description',
    description: 'Human-readable description',
    version: '0.0.X',
    date: 'YYYY-MM-DD',
}

// Helper functions for specific changes
async function createNewTable(db: DatabaseAdapter) { ... }
async function addColumns(db: DatabaseAdapter) { ... }
async function createIndexes(db: DatabaseAdapter) { ... }

// Main migration function
export async function runYourMigration(db: DatabaseAdapter) {
    console.log('📦 Running your migration...')
    
    await createNewTable(db)
    await addColumns(db)
    await createIndexes(db)
    
    console.log('✅ Your migration complete')
}
```

### Common Migration Patterns

#### 1. Creating a New Table

```typescript
async function createNewTable(db: DatabaseAdapter) {
    const isPostgres = db.type === 'postgresql'
    
    // Type helpers
    const TEXT = () => 'TEXT'
    const INTEGER = () => 'INTEGER'
    const TIMESTAMP = () => (isPostgres ? 'TIMESTAMP' : 'TEXT')
    
    const sql = `
    CREATE TABLE IF NOT EXISTS my_table (
      id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name ${TEXT()} NOT NULL,
      count ${INTEGER()} DEFAULT 0,
      created_at ${TIMESTAMP()} DEFAULT ${isPostgres ? 'CURRENT_TIMESTAMP' : "datetime('now')"}
    )
  `
    
    await db.run(sql, [])
    console.log('  ✅ Created my_table')
}
```

#### 2. Adding Columns to Existing Table

**PostgreSQL** (supports IF NOT EXISTS):
```typescript
if (isPostgres) {
    await db.run(`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS new_field TEXT,
        ADD COLUMN IF NOT EXISTS new_count INTEGER DEFAULT 0
    `, [])
    console.log('  ✅ Added columns to tasks table')
}
```

**SQLite** (requires separate statements and try/catch):
```typescript
if (!isPostgres) {
    try {
        await db.run('ALTER TABLE tasks ADD COLUMN new_field TEXT', [])
        console.log('  ✅ Added new_field column')
    } catch (err: any) {
        if (err.message.includes('duplicate column')) {
            console.log('  ⏭️  Column new_field already exists')
        } else {
            throw err
        }
    }
}
```

#### 3. Creating Indexes

```typescript
async function createIndexes(db: DatabaseAdapter) {
    const indexes = [
        {
            name: 'idx_tasks_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
        },
        {
            name: 'idx_tasks_created_at',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
        },
    ]
    
    for (const index of indexes) {
        try {
            await db.run(index.sql, [])
            console.log(`  ✅ Created index: ${index.name}`)
        } catch (error: any) {
            if (error.message?.includes('already exists')) {
                console.log(`  ⏭️  Index ${index.name} already exists`)
            } else {
                throw error
            }
        }
    }
}
```

#### 4. Creating Triggers

**PostgreSQL**:
```typescript
if (isPostgres) {
    // Create function
    await db.run(`
        CREATE OR REPLACE FUNCTION update_my_table_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    `, [])
    
    // Create trigger
    await db.run(`
        DROP TRIGGER IF EXISTS my_table_updated_at_trigger ON my_table;
        CREATE TRIGGER my_table_updated_at_trigger
        BEFORE UPDATE ON my_table
        FOR EACH ROW
        EXECUTE FUNCTION update_my_table_updated_at()
    `, [])
    
    console.log('  ✅ Created PostgreSQL trigger')
}
```

**SQLite**:
```typescript
if (!isPostgres) {
    await db.run(`
        CREATE TRIGGER IF NOT EXISTS my_table_updated_at_trigger
        AFTER UPDATE ON my_table
        FOR EACH ROW
        BEGIN
          UPDATE my_table SET updated_at = datetime('now')
          WHERE id = NEW.id;
        END
    `, [])
    
    console.log('  ✅ Created SQLite trigger')
}
```

#### 5. Data Migrations

```typescript
async function migrateData(db: DatabaseAdapter) {
    // Example: Populate new column from existing data
    await db.run(`
        UPDATE tasks 
        SET priority = CASE 
            WHEN status = 'urgent' THEN 10
            WHEN status = 'high' THEN 5
            ELSE 0
        END
        WHERE priority IS NULL
    `, [])
    
    console.log('  ✅ Migrated priority data')
}
```

---

## Running Migrations

### Automatic Execution

Migrations run automatically when the application starts:

```typescript
// server/database/init.ts
import { db } from './db-new'
import { runMigrations } from './migrations/index'

await runMigrations(db, false)  // Runs pending migrations silently
export { db }
```

### Manual Execution

```bash
# Run all pending migrations
pnpm db:migrate

# Check status without running
pnpm db:migrate:status
# or
pnpm db:migrate --status
```

### Migration Output

```
🔍 Checking migration status...

📊 Current Status:
   Total migrations: 4
   Completed: 3
   Pending: 1

✅ Completed migrations:
   - 000_base_schema
   - 001_config_table
   - 002_align_schema

📋 Pending migrations:
   - 004_add_user_preferences: Add user preferences table

🚀 Running pending migrations...

📦 Running migration: 004_add_user_preferences
   Description: Add user preferences table
  ✅ Created user_preferences table
  ✅ Created index: idx_user_preferences_user_id
✅ Completed: 004_add_user_preferences

✅ Migration complete!
   1 migration(s) executed
   3 migration(s) already applied
```

---

## Version Management

### Version Workflow

1. **Check Schema Validation**
   ```bash
   pnpm version:check
   ```

2. **Run Migrations if Needed**
   ```bash
   pnpm db:migrate
   ```

3. **Bump Version**
   ```bash
   pnpm version:bump
   ```

### Version Bump Process

The `version:bump` command:

1. Runs schema validation automatically
2. Shows validation results (PASS/FAIL)
3. Prompts to continue if validation fails
4. Asks for new version number
5. Asks for update description
6. Updates:
   - `package.json`
   - PostgreSQL `crearis_config.version`
   - SQLite `crearis_config.version`
   - `CHANGELOG.md`

Example:
```
🔍 Running schema validation...

============================================================
POSTGRESQL Validation Results (v0.0.1)
============================================================
✅ PASSED - Database structure matches schema definition

============================================================
SQLITE Validation Results (v0.0.1)
============================================================
✅ PASSED - Database structure matches schema definition

✅ Schema validation PASSED!

Current version: 0.0.1
Enter new version: 0.0.2
Enter update description: Added user preferences feature

📝 Updating version...

✅ Version updated to 0.0.2 everywhere.
   - package.json
   - PostgreSQL crearis_config
   - SQLite crearis_config
   - CHANGELOG.md
```

---

## Cross-Database Migrations

### Key Differences Between PostgreSQL and SQLite

| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| Auto-increment | `SERIAL PRIMARY KEY` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| Timestamp | `TIMESTAMP` | `TEXT` |
| Current time | `CURRENT_TIMESTAMP` | `datetime('now')` |
| JSON | `JSONB` | `TEXT` (store as JSON string) |
| ALTER TABLE IF NOT EXISTS | ✅ Supported (9.6+) | ❌ Not supported |
| DROP COLUMN | ✅ Supported | ❌ Not supported (requires table rebuild) |
| Multiple ALTER in one statement | ✅ Supported | ❌ Not supported |
| Triggers | Function + Trigger | Trigger only |
| Arrays | ✅ Supported | ❌ Not supported |

### Database Detection

```typescript
const isPostgres = db.type === 'postgresql'

if (isPostgres) {
    // PostgreSQL-specific code
} else {
    // SQLite-specific code
}
```

### Type Helpers

```typescript
const TEXT = () => 'TEXT'
const INTEGER = () => 'INTEGER'
const TIMESTAMP = () => (isPostgres ? 'TIMESTAMP' : 'TEXT')
const JSON_TYPE = () => (isPostgres ? 'JSONB' : 'TEXT')
```

### Conditional Features

Some features should only be created for one database:

```typescript
// Example: Skip PostgreSQL-specific index for SQLite
if (isPostgres) {
    await db.run('CREATE INDEX idx_tasks_version ON tasks(version_id)', [])
}

// SQLite doesn't have tasks.version_id, so we skip this index
```

---

## Testing Migrations

### Testing Checklist

Before committing a migration, test:

- ✅ Run on **fresh PostgreSQL database**
- ✅ Run on **existing PostgreSQL database** (idempotency test)
- ✅ Run on **fresh SQLite database**
- ✅ Run on **existing SQLite database** (idempotency test)
- ✅ Verify **schema validation passes** after migration
- ✅ Verify **application still works** with new schema
- ✅ Check that **no data was lost**
- ✅ Test **API endpoints** that use modified tables

### Testing Commands

```bash
# 1. Run migration
pnpm db:migrate

# 2. Check schema validation
pnpm version:check

# 3. Test application
pnpm dev
# Then test relevant endpoints in browser or Postman

# 4. Run unit tests
pnpm test

# 5. Run integration tests
pnpm test:pgintegration
```

### Testing on Fresh Database

**PostgreSQL**:
```bash
# Backup first!
pg_dump crearis_admin_dev > backup.sql

# Drop and recreate
dropdb crearis_admin_dev
createdb crearis_admin_dev

# Run migrations
pnpm db:migrate

# Restore data if needed
psql crearis_admin_dev < backup.sql
```

**SQLite**:
```bash
# Backup first!
cp demo-data.db demo-data.db.backup

# Delete database
rm demo-data.db

# Run migrations (will create new database)
pnpm db:migrate
```

### Idempotency Testing

Run the same migration twice to ensure it doesn't fail:

```bash
pnpm db:migrate  # First run
pnpm db:migrate  # Second run - should skip already-applied migrations
```

Expected output:
```
📊 Current Status:
   Total migrations: 4
   Completed: 4
   Pending: 0

✅ All migrations are up to date!
```

---

## Rollback Strategy

### Important: No Automated Rollback

This migration system uses **forward-only migrations**. There are no automatic rollback functions.

**Why?**
- Rollbacks are risky (data loss, constraint violations)
- Complex migrations often can't be safely reversed
- Manual review ensures careful rollback planning
- Encourages writing careful, tested migrations

### Manual Rollback Process

1. **Document Rollback Steps** in migration file comments
2. **Test Rollback on Copy** of database first
3. **Execute SQL Manually** in database console
4. **Update Migration Tracking** in `crearis_config`

### Example Rollback Documentation

In your migration file:
```typescript
/**
 * ROLLBACK NOTES
 * 
 * To manually rollback this migration:
 * 
 * 1. Drop the user_preferences table:
 *    DROP TABLE IF EXISTS user_preferences;
 * 
 * 2. Drop indexes:
 *    DROP INDEX IF EXISTS idx_user_preferences_user_id;
 * 
 * 3. Update crearis_config (PostgreSQL):
 *    UPDATE crearis_config 
 *    SET config = jsonb_set(
 *      config, 
 *      '{migrations_run}', 
 *      (config->'migrations_run')::jsonb - '004_add_user_preferences'
 *    )
 *    WHERE id = 1;
 * 
 * 4. Update crearis_config (SQLite):
 *    -- Query config, parse JSON, remove migration ID, update
 *    -- See manual rollback guide
 * 
 * IMPORTANT: Test on a copy first!
 */
```

### Rollback Helper Queries

**PostgreSQL - Remove Migration from Tracking**:
```sql
UPDATE crearis_config 
SET config = jsonb_set(
  config, 
  '{migrations_run}', 
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements_text(config->'migrations_run') elem
    WHERE elem != '004_add_user_preferences'
  )
)
WHERE id = 1;
```

**SQLite - Remove Migration from Tracking**:
```sql
-- This is manual - extract config, edit JSON, update
SELECT config FROM crearis_config WHERE id = 1;
-- Edit migrations_run array in JSON
UPDATE crearis_config SET config = '...' WHERE id = 1;
```

---

## Best Practices

### 1. Migration Design

✅ **DO**:
- Keep migrations small and focused
- Test on both databases before committing
- Use descriptive migration names
- Add console.log for progress tracking
- Handle idempotency (CREATE IF NOT EXISTS, try/catch)
- Document rollback steps in comments

❌ **DON'T**:
- Modify existing migration files after deployment
- Combine unrelated changes in one migration
- Skip testing on both databases
- Assume all SQL features work the same
- Create migrations that depend on application code

### 2. Naming and Organization

✅ **DO**:
- Use sequential numbers (000, 001, 002)
- Use snake_case for descriptive names
- Match migration ID to filename
- Keep related changes together

❌ **DON'T**:
- Skip numbers in sequence
- Use spaces or special characters
- Create multiple migrations for same feature
- Reorder migrations after creation

### 3. Cross-Database Compatibility

✅ **DO**:
- Check `db.type === 'postgresql'` for database-specific code
- Use type helpers (TEXT, INTEGER, TIMESTAMP)
- Test both databases thoroughly
- Document database-specific features

❌ **DON'T**:
- Assume SQL is the same for both databases
- Use PostgreSQL-only features in SQLite code
- Forget to handle SQLite limitations
- Skip database-specific tests

### 4. Data Safety

✅ **DO**:
- Backup databases before major migrations
- Test migrations on copies first
- Preserve existing data
- Use DEFAULT values for new columns
- Handle NULL values appropriately

❌ **DON'T**:
- Delete data without backups
- Add NOT NULL columns without defaults
- Modify data destructively
- Skip data validation after migration

### 5. Version Management

✅ **DO**:
- Run schema validation before version bumps
- Document migration changes in CHANGELOG
- Update schema definition JSON after migrations
- Test version bump process

❌ **DON'T**:
- Bump version with failing validation
- Skip CHANGELOG updates
- Forget to update schema definitions
- Deploy without testing

---

## Troubleshooting

### Migration Fails on PostgreSQL but Works on SQLite

**Cause**: Using SQLite-specific SQL syntax

**Solution**: Check for SQLite-specific features:
- `datetime('now')` → Use `CURRENT_TIMESTAMP` for PostgreSQL
- `AUTOINCREMENT` → Use `SERIAL` for PostgreSQL

### Migration Fails on SQLite but Works on PostgreSQL

**Cause**: Using PostgreSQL-specific features

**Solution**: Check for PostgreSQL-specific features:
- Multiple ALTER TABLE statements → Split into separate commands
- `ADD COLUMN IF NOT EXISTS` → Use try/catch for SQLite
- `JSONB` → Use `TEXT` for SQLite
- Dropping columns → Requires table rebuild for SQLite

### Migration Shows as "Already Run" but Changes Aren't Applied

**Cause**: Migration was marked as complete but failed partway through

**Solution**:
1. Manually revert the migration tracking:
   ```sql
   -- PostgreSQL
   UPDATE crearis_config 
   SET config = jsonb_set(config, '{migrations_run}', 
     (SELECT jsonb_agg(elem) FROM jsonb_array_elements_text(config->'migrations_run') elem 
      WHERE elem != 'MIGRATION_ID'))
   WHERE id = 1;
   ```
2. Fix the migration code
3. Run migrations again

### Schema Validation Fails After Migration

**Cause**: Schema definition JSON doesn't match actual schema

**Solution**:
1. Regenerate schema definition:
   ```bash
   DATABASE_TYPE=postgresql npx tsx server/database/generate-schema-definition.ts
   ```
2. Review changes and commit updated JSON
3. Run validation again:
   ```bash
   pnpm version:check
   ```

### "Table Already Exists" Error

**Cause**: Not using `CREATE TABLE IF NOT EXISTS`

**Solution**: Always use `IF NOT EXISTS`:
```typescript
CREATE TABLE IF NOT EXISTS my_table (...)
```

### "Duplicate Column" Error

**Cause**: Not handling duplicate column errors in SQLite

**Solution**: Use try/catch:
```typescript
try {
    await db.run('ALTER TABLE tasks ADD COLUMN new_field TEXT', [])
} catch (err: any) {
    if (err.message.includes('duplicate column')) {
        console.log('  ⏭️  Column already exists')
    } else {
        throw err
    }
}
```

### Can't Connect to Database During Migration

**Cause**: Database credentials or connection issues

**Solution**:
1. Check environment variables:
   ```bash
   echo $DATABASE_TYPE
   echo $DATABASE_URL
   echo $SQLITE_PATH
   ```
2. Test connection manually:
   ```bash
   # PostgreSQL
   psql crearis_admin_dev
   
   # SQLite
   sqlite3 demo-data.db
   ```
3. Verify database exists and is accessible

---

## Advanced Topics

### Creating Schema Definition for New Version

After completing migrations for a new version:

```bash
# Generate schema from actual database
DATABASE_TYPE=postgresql npx tsx server/database/generate-schema-definition.ts

# This creates/updates: server/database/schema-definitions/v0.0.X.json

# Review changes
git diff server/database/schema-definitions/

# Commit
git add server/database/schema-definitions/
git commit -m "docs: update schema definition for v0.0.X"
```

### Migration Dependencies

If a migration depends on another:

```typescript
// In migration 005
import { someHelper } from './004_previous_migration'

export async function run005Migration(db: DatabaseAdapter) {
    // Migration 004 must have run first
    // The migration runner ensures this by running in order
    
    // Now we can use tables created by 004
    await db.run('INSERT INTO table_from_004 ...', [])
}
```

### Complex Data Migrations

For complex data transformations:

```typescript
async function migrateComplexData(db: DatabaseAdapter) {
    // 1. Get existing data
    const rows = await db.all('SELECT * FROM old_table', [])
    
    // 2. Transform in application code
    for (const row of rows) {
        const transformed = {
            ...row,
            new_field: calculateNewValue(row),
        }
        
        // 3. Insert into new structure
        await db.run(
            'INSERT INTO new_table (...) VALUES (...)',
            [transformed...]
        )
    }
    
    console.log(`  ✅ Migrated ${rows.length} rows`)
}
```

---

## Related Documentation

- [SCHEMA_MIGRATION_PLAN.md](SCHEMA_MIGRATION_PLAN.md) - Original migration plan (SCHEM-A through SCHEM-D)
- [SCHEM-A-B-COMPLETE.md](SCHEM-A-B-COMPLETE.md) - Implementation report for SCHEM-A and SCHEM-B
- [SCHEM-C-COMPLETE.md](SCHEM-C-COMPLETE.md) - Implementation report for SCHEM-C
- Example migration: `server/database/migrations/003_example.ts`

---

## Summary

- ✅ **Migrations are forward-only** - No automatic rollback
- ✅ **Test on both databases** - PostgreSQL and SQLite have differences
- ✅ **Migrations are idempotent** - Safe to run multiple times
- ✅ **Schema validation before version bumps** - Ensures consistency
- ✅ **Tracked in crearis_config** - Know what's been run
- ✅ **Run automatically on app startup** - Seamless deployment

For questions or issues, refer to the example migration (`003_example.ts`) or the troubleshooting section above.

**Happy migrating! 🚀**
