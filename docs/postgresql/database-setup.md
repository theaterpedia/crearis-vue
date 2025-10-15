# Database Setup Guide

**Complete guide to automatic database initialization, migrations, and seeding**

## Overview

This project features a **zero-configuration** database setup system. When you run `pnpm dev`, the system automatically:

1. ✅ Detects if the database needs initialization
2. ✅ Creates the database schema via migrations
3. ✅ Seeds the database with demo data
4. ✅ Tracks migration history and version

**No manual steps required** - just start the dev server and everything is configured automatically!

---

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Database Initialization](#database-initialization)
- [Migration System](#migration-system)
- [Seeding System](#seeding-system)
- [User & Project Management](#user--project-management)
- [Manual Operations](#manual-operations)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### First Time Setup

1. **Ensure PostgreSQL is running**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Create the database** (if it doesn't exist)
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

That's it! The system will automatically:
- Run all migrations to create tables
- Create default users (admin, base, project1, project2)
- Import all CSV data (events, locations, instructors, participants, posts)

---

## How It Works

### Automatic Detection

On startup, `server/database/init.ts` performs these checks:

1. **Check if `crearis_config` table exists**
   - If NO → Fresh database, run all migrations + seed data
   - If YES → Continue to version check

2. **Compare versions** (from `package.json` vs database)
   - If outdated → Run pending migrations
   - If current → Check for any missed migrations

3. **Migration tracking**
   - All migrations logged in `crearis_config.migrations_run`
   - JSON array tracks: `[{ name, timestamp, success }]`

### Three Initialization Scenarios

#### Scenario 1: Fresh Database (No Config Table)
```
🔍 Database not found or not initialized
🚀 Starting automatic schema creation...
📦 Current version: 0.0.1

🔄 Starting database migrations...
   📦 Running migration: 000_base_schema
   📦 Running migration: 001_config_table
   📦 Running migration: 002_align_schema
✅ Database schema created successfully!

🌱 Starting database seeding...
   👥 Seeding users and projects...
   📊 Seeding CSV data...
🎉 Database seeding completed successfully!
```

#### Scenario 2a: Outdated Version
```
📊 Database found: v0.0.1
📦 Current version: v0.0.2

⚠️  Database version (0.0.1) differs from current version (0.0.2)
🔄 Checking for pending migrations...

⚠️  IMPORTANT: Create database backup before migrations!
   PostgreSQL: pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   SQLite: cp demo-data.db demo-data_backup_$(date +%Y%m%d_%H%M%S).db

📦 Running migration: 003_new_feature
✅ Migrations complete
```

#### Scenario 2b: Current Version with Pending Migrations
```
📊 Database found: v0.0.1
📦 Current version: v0.0.1

✅ Database version matches current version
🔄 Checking for pending migrations...

📦 Running migration: 003_hotfix
✅ Migrations complete
```

---

## Database Initialization

### File: `server/database/init.ts`

**Purpose**: Automatically initialize database on application startup

**Key Functions**:

```typescript
// Read current version from package.json
function getCurrentVersion(): string

// Query crearis_config table for database state
async function getConfigFromDatabase(): Promise<ConfigData | null>

// Main initialization orchestration
async function initializeDatabase(): Promise<void>
```

**Process Flow**:

```
┌─────────────────────────────────────┐
│  Application Startup (pnpm dev)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Connect to Database (db-new.ts)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  initializeDatabase() - init.ts     │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────┴───────┐
       │ Config Exists? │
       └───────┬────┬───┘
               │    │
          NO ──┘    └── YES
          │              │
          ▼              ▼
    ┌─────────┐    ┌──────────┐
    │ Migrate │    │  Check   │
    │   ALL   │    │ Version  │
    └────┬────┘    └────┬─────┘
         │              │
         ▼              ▼
    ┌─────────┐    ┌──────────┐
    │  Seed   │    │ Migrate  │
    │  Data   │    │ Pending  │
    └─────────┘    └──────────┘
```

---

## Migration System

### Directory Structure

```
server/database/migrations/
├── index.ts              # Migration registry
├── run.ts                # Migration runner
├── 000_base_schema.ts    # Initial schema (events, users, projects, etc.)
├── 001_config_table.ts   # Config table for tracking
├── 002_align_schema.ts   # Schema alignment fixes
└── 003_example.ts        # Template for new migrations
```

### Creating a Migration

1. **Copy the template**:
   ```bash
   cp server/database/migrations/003_example.ts \
      server/database/migrations/004_my_feature.ts
   ```

2. **Edit the migration**:
   ```typescript
   export const migration_004_my_feature = {
       id: '004_my_feature',
       name: '004_my_feature',
       description: 'Add new feature X',
       
       async run(db: DatabaseAdapter) {
           await db.exec(`
               ALTER TABLE events 
               ADD COLUMN new_field TEXT
           `)
       }
   }
   ```

3. **Register in `index.ts`**:
   ```typescript
   import { migration_004_my_feature } from './004_my_feature'
   
   export const migrations = [
       migration_000_base_schema,
       migration_001_config_table,
       migration_002_align_schema,
       migration_004_my_feature  // Add here
   ]
   ```

4. **Update package.json version** (triggers auto-migration):
   ```bash
   pnpm version:bump
   ```

### Migration Best Practices

✅ **DO**:
- Use descriptive migration names: `005_add_event_tags`
- Include rollback-safe operations when possible
- Test migrations on a copy of production data
- Create database backups before running migrations

❌ **DON'T**:
- Modify existing migrations that have been deployed
- Delete data without explicit user confirmation
- Assume column orders or positions

### Manual Migration Commands

```bash
# Check migration status
pnpm db:migrate:status

# Run pending migrations manually
pnpm db:migrate

# Check current version
pnpm version:check

# Bump version (updates package.json and schema)
pnpm version:bump
```

---

## Seeding System

### File: `server/database/seed.ts`

**Purpose**: Automatically populate fresh databases with demo data

**Key Functions**:

```typescript
// Check if database needs seeding (looks for events)
async function needsSeeding(db: DatabaseAdapter): Promise<boolean>

// Create/read projectnames_and_users.csv
async function ensureUsersProjectsFile(): Promise<UserProjectData[]>

// Seed users and projects with hashed passwords
async function seedUsersAndProjects(db: DatabaseAdapter, userData: UserProjectData[])

// Import all CSV files
async function seedCSVData(db: DatabaseAdapter)

// Main seeding orchestration
export async function seedDatabase(db: DatabaseAdapter): Promise<void>
```

### What Gets Seeded?

#### 1. Users & Projects (from `projectnames_and_users.csv`)

**Default users**:
- `admin` (role: admin)
- `base` (role: user)
- `project1` (role: user)
- `project2` (role: user)

**Default password**: `password123` (hashed with bcrypt)

#### 2. CSV Data (from `src/assets/csv/`)

| File | Table | Records |
|------|-------|---------|
| `events.csv` | events | ~21 |
| `locations.csv` | locations | ~21 |
| `instructors.csv` | instructors | ~20 |
| `children.csv` + `teens.csv` + `adults.csv` | participants | ~45 |
| `posts.csv` | posts | ~30 |

### Seeding Order

**Critical**: Events must be seeded first because other tables reference them!

```
1. Users & Projects (needed for foreign keys)
2. Events (referenced by locations, instructors, participants)
3. Locations
4. Instructors
5. Participants (children, teens, adults)
6. Posts
```

### When Seeding Runs

Seeding **only** runs when:
- ✅ Database is freshly initialized (no `crearis_config` table)
- ✅ After all migrations complete successfully
- ✅ No events exist in database (`COUNT(*) FROM events = 0`)

Seeding **does not** run when:
- ❌ Database already has data
- ❌ Migrations fail
- ❌ Running in production mode (future enhancement)

### Idempotent Seeding

All INSERT statements use `ON CONFLICT DO UPDATE`:

```sql
INSERT INTO users (id, username, password, role)
VALUES (?, ?, ?, ?)
ON CONFLICT(username) DO UPDATE SET
    password = excluded.password,
    role = excluded.role
```

This means:
- Re-running seeding is safe
- Existing records are updated, not duplicated
- Primary key conflicts are handled gracefully

---

## User & Project Management

### Credentials File: `projectnames_and_users.csv`

**Location**: `<project_root>/projectnames_and_users.csv`

**Git Status**: ✅ Ignored (in `.gitignore`)

**Format**:
```csv
name,password
admin,password123
base,password123
project1,password123
project2,password123
```

### Automatic Creation

On first run, the system:

1. **Checks** if `projectnames_and_users.csv` exists
2. **Creates** it with default entries if missing
3. **Uses** default password `password123` for all users
4. **Logs** creation to console

**Console Output**:
```
📝 projectnames_and_users.csv not found - creating with default passwords...
   Default password for all users: "password123"
   You can edit this file to change passwords before reseeding.

✅ Created projectnames_and_users.csv with 4 entries
```

### Customizing Users

**Before seeding** (fresh database):

1. Edit `projectnames_and_users.csv`:
   ```csv
   name,password
   admin,SecureAdminPass123!
   base,BaseUserPass456!
   project1,Project1Pass789!
   my_custom_user,CustomPass000!
   ```

2. Start dev server:
   ```bash
   pnpm dev
   ```

Users are created with:
- **Hashed passwords** (bcrypt with 10 rounds)
- **Matching projects** (same name as username)
- **Appropriate roles**:
  - `admin` → admin role
  - `base` → base role
  - Others → project role

### Changing Passwords After Seeding

**Option 1: Via API** (recommended)
```bash
# Future enhancement - password change endpoint
```

**Option 2: Manual Database Update**
```bash
# Generate new hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('newpass', 10))"

# Update database
psql -d crearis_admin_dev -c "UPDATE users SET password = '<hash>' WHERE username = 'admin';"
```

**Option 3: Re-seed** (drops all data!)
```bash
# 1. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE crearis_admin_dev;"
sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"

# 2. Edit projectnames_and_users.csv with new passwords

# 3. Restart dev server
pnpm dev
```

---

## Manual Operations

### Database Commands

```bash
# PostgreSQL - Drop database
sudo -u postgres psql -c "DROP DATABASE crearis_admin_dev;"

# PostgreSQL - Create database
sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"

# PostgreSQL - Connect to database
sudo -u postgres psql -d crearis_admin_dev

# PostgreSQL - Backup database
pg_dump crearis_admin_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# PostgreSQL - Restore database
psql -d crearis_admin_dev < backup_20250101_120000.sql
```

### Migration Commands

```bash
# Check migration status
pnpm db:migrate:status

# Run migrations manually
pnpm db:migrate

# Check current version
pnpm version:check

# Bump version (updates package.json)
pnpm version:bump
```

### Seeding Commands

**Currently**: Seeding runs automatically on fresh database initialization.

**Future Enhancement**: Add manual seeding command:
```bash
# Proposed command (not yet implemented)
pnpm db:seed
```

### Inspection Commands

```bash
# List all tables
sudo -u postgres psql -d crearis_admin_dev -c "\dt"

# Count records
sudo -u postgres psql -d crearis_admin_dev -c "
  SELECT 'users', COUNT(*) FROM users UNION ALL
  SELECT 'projects', COUNT(*) FROM projects UNION ALL
  SELECT 'events', COUNT(*) FROM events;
"

# View users
sudo -u postgres psql -d crearis_admin_dev -c "
  SELECT id, username, role FROM users ORDER BY username;
"

# View migration history
sudo -u postgres psql -d crearis_admin_dev -c "
  SELECT config->>'migrations_run' FROM crearis_config WHERE key = 'system';
"
```

---

## Troubleshooting

### Problem: "Database does not exist"

**Error**:
```
error: database "crearis_admin_dev" does not exist
```

**Solution**:
```bash
sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"
```

---

### Problem: Seeding fails with "null value in column violates not-null constraint"

**Error**:
```
null value in column "id" violates not-null constraint
```

**Cause**: Missing ID in INSERT statement

**Solution**: Already fixed in `server/database/seed.ts`. If you see this:
1. Pull latest code
2. Check that seed.ts includes `id` in INSERT statements
3. Drop and recreate database to test fresh seeding

---

### Problem: Migration runs but changes not visible

**Possible Causes**:
1. Connected to wrong database
2. Migration didn't actually execute
3. Caching issue

**Solutions**:
```bash
# 1. Verify database name in .env
cat .env | grep DB_NAME

# 2. Check migration history
pnpm db:migrate:status

# 3. Restart dev server
pkill -f nitro
pnpm dev
```

---

### Problem: CSV import fails

**Error**:
```
Error: Cannot find module 'src/assets/csv/events.csv'
```

**Solution**:
1. Verify CSV files exist:
   ```bash
   ls -la src/assets/csv/
   ```

2. Check CSV format (must have headers)

3. Ensure no special characters in filenames

---

### Problem: "Skipping migration tracking (config table not yet created)"

**This is normal!** During initial setup:
- Migration `000_base_schema` runs first
- Config table doesn't exist yet
- Migration `001_config_table` creates it
- Subsequent migrations are tracked normally

**No action needed** - this is expected behavior.

---

### Problem: Duplicate data after re-running seeding

**This should not happen!** Seeding uses UPSERT:

```sql
ON CONFLICT(username) DO UPDATE SET ...
```

**If you see duplicates**:
1. Check that primary keys are defined
2. Verify UPSERT syntax in seed.ts
3. Report bug with details

---

## Related Documentation

- [Database Migrations (Detailed)](./stage-a-complete.md) - SCHEM-A through SCHEM-D implementation
- [PostgreSQL Overview](./README.md) - Database adapter and configuration
- [Automatic Initialization](../AUTOMATIC_INITIALIZATION.md) - Technical deep dive
- [Automatic Init Summary](../AUTOMATIC_INIT_SUMMARY.md) - Before/after comparison

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/database/init.ts` | Automatic initialization orchestration |
| `server/database/seed.ts` | Database seeding with CSV data |
| `server/database/migrations/index.ts` | Migration registry |
| `server/database/migrations/run.ts` | Migration runner |
| `server/database/migrations/000_base_schema.ts` | Initial schema |
| `server/database/migrations/001_config_table.ts` | Config/tracking table |
| `server/database/migrations/002_align_schema.ts` | Schema alignment |
| `server/database/config.ts` | Database configuration |
| `server/database/db-new.ts` | Database adapter initialization |
| `projectnames_and_users.csv` | User credentials (git-ignored) |
| `src/assets/csv/*.csv` | Demo data for seeding |

---

## Summary

✅ **Zero-config setup** - Just run `pnpm dev`  
✅ **Automatic migrations** - Schema stays in sync with code  
✅ **Automatic seeding** - Fresh databases get demo data  
✅ **Version tracking** - Migrations tracked in database  
✅ **Idempotent operations** - Safe to re-run  
✅ **Developer-friendly** - Clear console output and logging  

**Next Steps**:
1. Start the dev server: `pnpm dev`
2. Access the app: `http://localhost:3001`
3. Login with: `admin` / `password123`

Enjoy coding! 🚀
