# PostgreSQL Drop and Rebuild Script

## Overview

The `pnpm db:rebuild` command provides a complete database reset for PostgreSQL. This is useful during development when you want to start fresh or apply schema changes that require a full rebuild.

## Usage

```bash
pnpm db:rebuild
```

## What It Does

The script performs three steps:

### 1. Drop All Tables (CASCADE)
- Queries `pg_tables` for all tables in the `public` schema
- Drops each table with `CASCADE` option (removes dependent objects)
- Lists all tables being dropped for transparency

### 2. Run Migrations
- Executes all migrations from `server/database/migrations/`
- Recreates the complete schema (users, projects, releases, tasks, versions, etc.)
- Updates `crearis_config` table with migration status

### 3. Seed Database
- Imports CSV data from `src/assets/csv/`
- Creates users from `projectnames_and_users.csv`
- Creates projects linked to users via `owner_id`
- Populates events, posts, locations, instructors, participants

## Environment Variables Required

The script uses your existing PostgreSQL configuration from `.env`:

```bash
# Required (unless using DATABASE_URL)
DB_USER=postgres          # PostgreSQL username
DB_PASSWORD=your_password # PostgreSQL password
DB_NAME=crearis_admin_dev # Database name
DB_HOST=localhost         # Database host (default: localhost)
DB_PORT=5432             # Database port (default: 5432)

# Or provide connection string directly
DATABASE_URL=postgresql://postgres:password@localhost:5432/crearis_admin_dev
```

## Warning ⚠️

**This command destroys all data in the database!**

- All tables are dropped
- All data is lost
- Database is rebuilt from scratch
- Only seeded data remains

**Use only in development environments or when you explicitly want a fresh start.**

## Output Example

```
🔧 PostgreSQL Database: Drop and Rebuild

==================================================

🗑️  Dropping all tables...

   Found 8 tables:
      - users
      - projects
      - releases
      - tasks
      - versions
      - crearis_config
      - events
      - posts

   Dropping table: users
   Dropping table: projects
   Dropping table: releases
   Dropping table: tasks
   Dropping table: versions
   Dropping table: crearis_config
   Dropping table: events
   Dropping table: posts

   ✅ Dropped 8 tables

🏗️  Rebuilding database schema...

   ✅ Ran 1 migrations

🌱 Seeding database...

   📊 Syncing CSV files...
   👤 Creating users...
   📦 Creating projects...
   ✅ Database seeded successfully

==================================================
✅ Database successfully dropped and rebuilt!
```

## Implementation Details

### File Location
- Script: `server/database/drop-and-rebuild-pg.ts`
- Package.json: Added to scripts as `db:rebuild`

### Key Features
- **PostgreSQL Only**: Fixed to PostgreSQL (does not support SQLite)
- **Cascade Drop**: Uses `DROP TABLE ... CASCADE` to handle foreign keys
- **Verbose Output**: Shows progress and lists all tables
- **Error Handling**: Exits with code 1 on failure
- **Idempotent**: Safe to run multiple times

### Dependencies
- Uses `pg` (node-postgres) for direct PostgreSQL queries
- Imports existing migration/seeding logic
- Respects database configuration from `config.ts`

## Related Commands

```bash
# Check migration status
pnpm db:migrate:status

# Run pending migrations (without dropping)
pnpm db:migrate

# Start development server
pnpm dev
```

## Troubleshooting

### Error: PostgreSQL requires environment variables

**Solution**: Create `.env` file from `.env.database.example`:

```bash
cp .env.database.example .env
# Edit .env with your PostgreSQL credentials
```

### Error: Database does not exist

**Solution**: Create the database first:

```bash
createdb crearis_admin_dev
# Or using psql:
psql -U postgres -c "CREATE DATABASE crearis_admin_dev"
```

### Error: Password authentication failed

**Solution**: Check your PostgreSQL credentials in `.env`:
- Verify `DB_USER` has access to PostgreSQL
- Ensure `DB_PASSWORD` is correct
- Test connection: `psql -U postgres -d crearis_admin_dev`

### Error: Cannot drop tables - dependent objects

This shouldn't happen because the script uses `CASCADE`, but if it does:
- Some extensions or foreign tables may need manual cleanup
- Connect with superuser: `psql -U postgres -d crearis_admin_dev`
- Drop schema: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Re-run: `pnpm db:rebuild`

## Schema After Rebuild

After running the rebuild, you'll have these tables:

- **users** - User accounts (authentication)
- **projects** - Projects owned by users
- **releases** - Project releases
- **tasks** - Project tasks
- **versions** - Version management
- **crearis_config** - Database metadata
- **events** - Theater events
- **posts** - Blog posts
- **locations** - Venue locations
- **instructors** - Instructor profiles
- **participants** - Participant data

All populated with data from CSV files and user/project seeding.
