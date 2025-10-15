# Automatic Database Initialization

## Overview

The database initialization system (`server/database/init.ts`) automatically detects the state of the database and performs the appropriate actions when the application starts (e.g., `pnpm dev`).

---

## Initialization Strategy

The system uses a smart detection strategy to determine what actions to take:

```
1. Query crearis_config table
   ↓
2a. Table doesn't exist?        →  Fresh database → Run all migrations
   ↓
2b. Table exists?
   ↓
3. Read version from config
   ↓
4a. Version outdated?           →  Run pending migrations + warn about backup
   ↓
4b. Version current?            →  Check for pending migrations
   ↓
5. Ready to serve
```

---

## Scenarios

### Scenario 1: Fresh Database (No Tables)

**Detection**: Cannot query `crearis_config` table

**Action**: 
```
🔍 Database not found or not initialized
🚀 Starting automatic schema creation...
📦 Current version: 0.0.1

🔄 Starting database migrations...
[Runs all migrations]

✅ Database schema created successfully!
```

**What Happens**:
- Creates all tables from scratch
- Creates indexes and triggers
- Initializes `crearis_config` with current version
- Tracks all migrations as complete

---

### Scenario 2: Existing Database, Current Version

**Detection**: `crearis_config.version` matches `package.json` version

**Action**:
```
📊 Database found: v0.0.1
📦 Current version: v0.0.1
✅ Database ready (v0.0.1)
```

**What Happens**:
- Quick startup (no migrations needed)
- Checks for any untracked pending migrations
- Application starts immediately

---

### Scenario 3: Existing Database, Outdated Version

**Detection**: `crearis_config.version` differs from `package.json` version

**Action**:
```
📊 Database found: v0.0.1
📦 Current version: v0.0.2

⚠️  Database version (0.0.1) differs from current version (0.0.2)
🔄 Checking for pending migrations...

⚠️  WARNING: Database backup is not yet implemented!
⚠️  Please manually backup your database before migrations:
   PostgreSQL: pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   SQLite: cp demo-data.db demo-data.db.backup_$(date +%Y%m%d_%H%M%S)

🔄 Starting database migrations...
[Runs pending migrations]

✅ Applied N migration(s)
💡 Consider updating database version: pnpm version:bump
```

**What Happens**:
- Displays backup warning
- Runs only pending migrations
- Updates migration tracking
- Suggests running `pnpm version:bump` to update config version

---

## Database Backup Warning

### Current Implementation

**Status**: ⚠️ **Not yet implemented**

When migrations are about to run on an existing database with an outdated version, the system displays a warning:

```
⚠️  WARNING: Database backup is not yet implemented!
⚠️  Please manually backup your database before migrations:
   PostgreSQL: pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   SQLite: cp demo-data.db demo-data.db.backup_$(date +%Y%m%d_%H%M%S)
```

### Manual Backup Commands

**PostgreSQL**:
```bash
# Backup to timestamped file
pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Or specify custom filename
pg_dump crearis_admin_dev > backup_before_migration.sql
```

**SQLite**:
```bash
# Backup to timestamped file
cp demo-data.db demo-data.db.backup_$(date +%Y%m%d_%H%M%S)

# Or specify custom filename
cp demo-data.db demo-data.db.backup_before_migration
```

### Future Enhancement

A future version should implement automatic backups before migrations:

```typescript
// Pseudocode for future implementation
async function backupDatabase(db: DatabaseAdapter) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    if (db.type === 'postgresql') {
        // Execute pg_dump via child_process
        const backupFile = `backup_${timestamp}.sql`
        await exec(`pg_dump ${dbName} > ${backupFile}`)
        console.log(`✅ Backup created: ${backupFile}`)
    } else {
        // Copy SQLite file
        const backupFile = `demo-data.db.backup_${timestamp}`
        await fs.copyFile('demo-data.db', backupFile)
        console.log(`✅ Backup created: ${backupFile}`)
    }
}
```

---

## Version Management Integration

### How Version is Determined

**Source**: `package.json`
```json
{
  "version": "0.0.1"
}
```

The initialization system reads this version and compares it with the version stored in the database:

```typescript
// From init.ts
function getCurrentVersion(): string {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return packageJson.version
}
```

### Updating Database Version

Use the version bump workflow:

```bash
# Run schema validation
pnpm version:check

# Update version (updates package.json + databases + CHANGELOG)
pnpm version:bump
```

This will:
1. Validate schema
2. Update `package.json` version
3. Update `crearis_config.version` in PostgreSQL
4. Update `crearis_config.version` in SQLite
5. Update `CHANGELOG.md`

---

## Configuration Location

### Code Location

**File**: `server/database/init.ts`

**Key Functions**:
- `getCurrentVersion()` - Reads version from package.json
- `getConfigFromDatabase()` - Queries crearis_config table
- `initializeDatabase()` - Main initialization logic

### Database Location

**Table**: `crearis_config`

**PostgreSQL Schema**:
```sql
CREATE TABLE crearis_config (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL
);
```

**SQLite Schema**:
```sql
CREATE TABLE crearis_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config TEXT NOT NULL
);
```

**Config JSON Structure**:
```json
{
  "version": "0.0.1",
  "migrations_run": [
    "000_base_schema",
    "001_config_table",
    "002_align_schema"
  ]
}
```

---

## Testing

### Test Scenario 1: Fresh Database

```bash
# Remove database
rm demo-data.db

# Start dev server (will create schema)
DATABASE_TYPE=sqlite pnpm dev
```

**Expected Output**:
```
🔍 Database not found or not initialized
🚀 Starting automatic schema creation...
✅ Database schema created successfully!
```

---

### Test Scenario 2: Current Version

```bash
# Database exists with current version
DATABASE_TYPE=sqlite pnpm dev
```

**Expected Output**:
```
📊 Database found: v0.0.1
📦 Current version: v0.0.1
✅ Database ready (v0.0.1)
```

---

### Test Scenario 3: Outdated Version

```bash
# Manually update package.json version to 0.0.2
# Database still has 0.0.1
DATABASE_TYPE=sqlite pnpm dev
```

**Expected Output**:
```
📊 Database found: v0.0.1
📦 Current version: v0.0.2
⚠️  Database version differs from current version
⚠️  WARNING: Database backup is not yet implemented!
[Runs pending migrations]
✅ Applied N migration(s)
💡 Consider updating database version: pnpm version:bump
```

---

## Error Handling

### Database Connection Failure

If the database cannot be connected, the application will fail to start with an error from `db-new.ts`.

### Migration Failure

If a migration fails during startup:
```
❌ Migration failed: 003_some_migration
[Error details]
```

The application startup will be aborted, and you'll need to fix the migration before restarting.

### Config Table Query Failure

If querying the config table fails (e.g., table doesn't exist), the system treats it as a fresh database and runs all migrations.

---

## Development Workflow

### Starting Development Server

```bash
# Start both frontend and backend
pnpm dev

# Or just backend
pnpm dev:backend
```

The initialization runs automatically and shows clear status messages.

### After Pulling New Code

If someone added migrations:

1. Pull latest code
2. Start dev server: `pnpm dev`
3. System automatically detects and runs new migrations
4. Continue development

### After Version Bump

If someone bumped the version:

1. Pull latest code (including new `package.json` version)
2. Start dev server: `pnpm dev`
3. System detects version difference
4. Shows backup warning
5. Runs any pending migrations
6. Reminds you to run `pnpm version:bump` to update database version

---

## Comparison: Before vs After

### Before (Manual)

```bash
# Developer had to remember to run migrations
pnpm db:migrate

# Then start dev server
pnpm dev
```

**Issues**:
- Easy to forget
- No version checking
- No feedback about database state

### After (Automatic)

```bash
# Just start dev server
pnpm dev
```

**Benefits**:
- ✅ Automatic migration detection
- ✅ Version checking
- ✅ Clear status messages
- ✅ Backup warnings
- ✅ Fresh database support

---

## Related Documentation

- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - Complete migration guide
- [SCHEMA_MIGRATION_COMPLETE.md](./SCHEMA_MIGRATION_COMPLETE.md) - Migration system overview
- [SCHEM-D-COMPLETE.md](./SCHEM-D-COMPLETE.md) - Version management integration

---

## Future Enhancements

### 1. Automatic Database Backup

Implement automatic backup before migrations:
- Create timestamped backup files
- Store in `backups/` directory
- Provide restore command

### 2. Migration Rollback

Add automatic rollback on failure:
- Track migration progress
- Rollback changes if migration fails
- Restore from backup if available

### 3. Health Checks

Add database health checks:
- Verify table integrity
- Check for missing indexes
- Validate foreign keys

### 4. Migration Dry Run

Add dry-run mode:
- Show what migrations would run
- Preview schema changes
- Don't execute anything

---

## Summary

The automatic database initialization system provides:

✅ **Smart Detection** - Detects database state automatically  
✅ **Fresh Database Support** - Creates schema from scratch  
✅ **Version Checking** - Compares database vs code version  
✅ **Automatic Migrations** - Runs pending migrations on startup  
✅ **Clear Feedback** - Detailed console messages  
✅ **Backup Warnings** - Reminds to backup before migrations  
✅ **Zero Configuration** - Works out of the box

**Just run `pnpm dev` and let the system handle the rest!** 🚀
