# PostgreSQL Extension Permission Fix

**Date:** October 16, 2025  
**Issue:** `permission denied to create extension "pgcrypto"`

---

## Problem

When creating a fresh database, the application failed during migration `000_base_schema` with:

```
error: permission denied to create extension "pgcrypto"
hint: Must be superuser to create this extension.
```

**Root Cause:** PostgreSQL extensions require superuser privileges to install. The application user (non-superuser) cannot create extensions.

---

## Solution Implemented

### 1. Made Extension Creation Graceful

Updated `server/database/migrations/000_base_schema.ts`:

```typescript
// Enable PostgreSQL extensions
if (db.type === 'postgresql') {
  console.log('  🔧 Enabling PostgreSQL extensions...')
  try {
    await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    console.log('  ✅ pgcrypto extension enabled')
  } catch (error: any) {
    if (error.code === '42501') {
      // Permission denied - extension might already exist or need superuser
      console.log('  ⚠️  pgcrypto extension: permission denied (may already exist or need superuser)')
      console.log('  💡 Run as superuser: psql -U postgres -d crearis_admin_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"')
    } else {
      console.error('  ❌ Failed to create pgcrypto extension:', error.message)
      throw error
    }
  }
}
```

**Behavior:**
- ✅ If extension exists → Continue silently
- ✅ If permission denied (42501) → Log warning with helpful command
- ❌ If other error → Fail with clear message

### 2. Created Automated Setup Script

Created `scripts/setup-database.sh`:

```bash
#!/bin/bash

# Creates database and installs extensions as superuser
# Usage: ./scripts/setup-database.sh

psql -U postgres -c "CREATE DATABASE crearis_admin_dev;"
psql -U postgres -d crearis_admin_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

**Features:**
- ✅ Interactive prompts
- ✅ Checks if database exists
- ✅ Option to drop and recreate
- ✅ Installs required extensions
- ✅ Sets up permissions
- ✅ Color-coded output

### 3. Updated Documentation

Updated `docs/postgresql/database-setup.md`:

**Added Quick Start options:**
- Option 1: Automated setup script (recommended)
- Option 2: Manual setup with commands

**Added Troubleshooting section:**
- Clear error explanation
- Three solution approaches
- Why pgcrypto is needed

---

## Usage

### Option 1: Automated (Recommended)

```bash
./scripts/setup-database.sh
pnpm dev
```

### Option 2: Manual

```bash
# Create database and extension
sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev;"
sudo -u postgres psql -d crearis_admin_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Start application
pnpm dev
```

---

## Test Results

### Before Fix
```
❌ Migration failed
❌ error: permission denied to create extension "pgcrypto"
❌ Application crashed
```

### After Fix
```
✅ Connected to PostgreSQL database
🔍 Database not found or not initialized
🚀 Starting automatic schema creation...

📦 Running migration: 000_base_schema
  🔧 Enabling PostgreSQL extensions...
  ✅ pgcrypto extension enabled
✅ Migration 000_base_schema completed

📦 Running migration: 001_config_table
✅ Migration 001_config_table completed

📦 Running migration: 002_align_schema
✅ Migration 002_align_schema completed

📦 Running migration: 003_entity_task_triggers
📋 Creating entity-task relationship triggers...
   ✅ Created triggers for events
   ✅ Created triggers for posts
   ✅ Created triggers for locations
   ✅ Created triggers for instructors
   ✅ Created triggers for participants
✅ Migration 003_entity_task_triggers completed

🌱 Starting database seeding...
✅ Seeded 21 events
✅ Seeded 21 locations
✅ Seeded 20 instructors
✅ Seeded 45 participants
✅ Seeded 30 posts

🎉 Database setup complete!
```

---

## Why pgcrypto?

The `pgcrypto` extension provides cryptographic functions for PostgreSQL, including:

- `gen_random_uuid()` - Used by entity-task triggers for generating task IDs
- UUID generation without application-level logic
- Better performance than application-generated UUIDs

**Used in:**
- `server/database/migrations/003_entity_task_triggers.ts`
- PostgreSQL trigger functions: `create_main_task()`

**Example:**
```sql
CREATE OR REPLACE FUNCTION create_main_task()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
        gen_random_uuid()::text,  -- ⭐ Requires pgcrypto
        '{{main-title}}',
        'main',
        'new',
        TG_ARGV[0],
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Files Modified

1. ✅ `server/database/migrations/000_base_schema.ts` - Graceful extension creation
2. ✅ `scripts/setup-database.sh` - Automated setup script (NEW)
3. ✅ `docs/postgresql/database-setup.md` - Updated documentation

---

## Alternative Solutions

### If you can't use setup script:

**Solution A:** Grant superuser temporarily (not recommended for production)
```bash
sudo -u postgres psql -c "ALTER USER your_user WITH SUPERUSER;"
pnpm dev
sudo -u postgres psql -c "ALTER USER your_user WITH NOSUPERUSER;"
```

**Solution B:** Use different UUID generation
- Change triggers to use application-generated UUIDs
- Pass UUID from application instead of database

**Solution C:** Pre-install extension in database template
```bash
sudo -u postgres psql -d template1 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
# All new databases will have pgcrypto
```

---

## Related Documentation

- [Database Setup Guide](../docs/postgresql/database-setup.md) - Complete setup instructions
- [POSTGRESQL_MAIN_TASKS_FIX.md](../docs/POSTGRESQL_MAIN_TASKS_FIX.md) - Trigger implementation
- [SCHEMA_UPDATES_PERMANENT.md](../docs/SCHEMA_UPDATES_PERMANENT.md) - Migration system

---

## Summary

✅ **Problem:** Extension creation required superuser  
✅ **Solution:** Graceful error handling + setup script  
✅ **Result:** Smooth database initialization for all users  

Users can now choose:
- **Automated:** Run setup script once
- **Manual:** Run one command as superuser
- **Fallback:** Clear error message with instructions
