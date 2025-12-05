# Fileset Integration - Implementation Complete ✅

**Date:** October 16, 2025  
**Branch:** beta_postgresql

## Overview

Successfully integrated the fileset strategy into the database system with the following major changes:

1. Changed default database to PostgreSQL (SQLite requires manual setting)
2. Fixed isbase field naming confusion (PostgreSQL lowercase)
3. Added isbase column to all entity tables
4. Created server-side data directory structure
5. Moved CSV files from src/assets to server/data
6. Created comprehensive fileset configuration system
7. Updated seeding to support filesets and set isbase flags
8. Updated watch API to use new CSV locations

## 🎯 Key Changes

### 1. Database Default Changed to PostgreSQL

**File:** `server/database/config.ts`

```typescript
// Changed from 'sqlite' to 'postgresql'
const type = (process.env.DATABASE_TYPE || 'postgresql') as DatabaseType
```

**Impact:** To use SQLite now, must explicitly set `DATABASE_TYPE=sqlite` in environment.

### 2. Fixed isbase Field Naming (CamelCase → lowercase)

**Issue:** PostgreSQL converts unquoted column names to lowercase, so `isBase` became `isbase`.

**Files Updated:**
- `server/database/migrations/002_align_schema.ts` - Column now created as `isbase`
- `server/database/migrate-stage2.ts` - All references to `isBase` → `isbase`
- `server/database/data-actions.ts` - All SQL queries use lowercase

**Result:** Consistent lowercase `isbase` throughout codebase.

### 3. Added isbase Column to All Entity Tables

**New Migration:** `server/database/migrations/008_add_isbase_to_entities.ts`

Adds `isbase INTEGER DEFAULT 0` to:
- posts
- locations
- instructors
- participants

**Note:** events table already had this column from migration 002.

### 4. Created Server-Side Data Directory

**New Structure:**
```
server/
  data/
    base/           ← All CSV files moved here
      events.csv
      posts.csv
      locations.csv
      instructors.csv
      children.csv
      teens.csv
      adults.csv
      categories.csv
```

**Rationale:** 
- Keeps data files with backend code
- Not exposed to frontend build
- Not served publicly
- Follows standard Node.js practices

### 5. Comprehensive Fileset Configuration System

**New File:** `server/settings.ts`

**Key Features:**

```typescript
// Fileset definition
export interface FilesetConfig {
    id: string
    name: string
    description: string
    path: string              // Absolute path to CSV directory
    files: string[]           // List of CSV files
    isDefault?: boolean
}

// Registry
export const filesets: Record<string, FilesetConfig> = {
    base: {
        id: 'base',
        name: 'Base Dataset',
        description: 'Base demo data from Odoo (_demo.* entities)',
        path: path.resolve(process.cwd(), 'server/data/base'),
        files: [
            'events.csv',
            'posts.csv',
            'locations.csv',
            'instructors.csv',
            'children.csv',
            'teens.csv',
            'adults.csv',
            'categories.csv'
        ],
        isDefault: true
    }
}

// Helper functions
getFileset(filesetId: string = 'base'): FilesetConfig
getDefaultFileset(): FilesetConfig
validateFileInFileset(filename: string, filesetId: string): boolean
getFilesetFilePath(filename: string, filesetId: string): string
getEntityFile(entityType: string): string
```

**Benefits:**
- Centralized fileset management
- Validation of file membership
- Easy to add new filesets (staging, production, etc.)
- Type-safe file path resolution

### 6. Updated Seeding with Fileset Support

**File:** `server/database/seed.ts`

**Key Changes:**

1. **Added fileset parameter:**
```typescript
async function seedCSVData(db: DatabaseAdapter, filesetId: string = 'base')
```

2. **Uses settings for file resolution:**
```typescript
import { getFileset, validateFileInFileset, getFilesetFilePath } from '../settings'

const eventsCSV = fs.readFileSync(getFilesetFilePath('events.csv', filesetId), 'utf-8')
```

3. **Sets isbase=1 for all _demo.* records:**
```typescript
for (const event of events) {
    const isBase = event.id.startsWith('_demo.') ? 1 : 0
    
    await db.run(`
        INSERT INTO events 
        (id, name, ..., isbase)
        VALUES (?, ?, ..., ?)
        ON CONFLICT(id) DO UPDATE SET
            ...,
            isbase = excluded.isbase
    `, [...values, isBase])
}
```

Applied to all entity types: events, posts, locations, instructors, participants.

### 7. Updated Watch CSV API

**File:** `server/api/admin/watch/csv/[fileset].get.ts`

**Changes:**

```typescript
import { getFileset, getFilesetFilePath } from '../../../../settings'

// Get fileset config from settings
const filesetSettings = getFileset(fileset)

// Use proper file paths
const filePath = getFilesetFilePath(filename, fileset)
```

**Benefits:**
- No hardcoded paths
- Validates files are in fileset
- Error handling for missing files

### 8. Updated Migration 007

**File:** `server/database/migrations/007_create_config_table.ts`

Now uses settings to get file list:

```typescript
import { getFileset } from '../../settings'

const baseFileset = getFileset('base')
const watchcsvConfig = JSON.stringify({
    base: {
        lastCheck: null,
        files: baseFileset.files  // Gets from settings
    }
})
```

Also added 'participants' to watchdb entities list.

## 📊 Migration Summary

**New Migration:** 008_add_isbase_to_entities
- Adds isbase column to posts, locations, instructors, participants tables
- Includes down() method for rollback
- Registered in migrations/index.ts

**Modified Migrations:**
- 002_align_schema.ts - isBase → isbase
- 007_create_config_table.ts - Uses settings for fileset config

## 🔄 Data Flow

### Seeding Flow
```
1. seedCSVData(db, 'base') called
2. getFileset('base') retrieves config from settings
3. For each CSV file:
   - getFilesetFilePath() validates and resolves path
   - fs.readFileSync() loads from server/data/base/
   - Parse CSV
   - INSERT with isbase=1 for _demo.* records
```

### Watch CSV Flow
```
1. GET /api/admin/watch/csv/base
2. getFileset('base') from settings
3. For each file in fileset:
   - getFilesetFilePath() gets absolute path
   - fs.statSync() checks modification time
   - Compare with lastCheck timestamp
4. Update system_config with new lastCheck
5. Return list of updated files
```

## 🧪 Testing Checklist

- [ ] Database migrations run successfully (008 adds columns)
- [ ] Seeding completes without errors
- [ ] CSV files read from server/data/base/
- [ ] isbase=1 set for all _demo.* records
- [ ] isbase=0 set for other records
- [ ] Watch CSV endpoint uses new paths
- [ ] Watch CSV endpoint validates files in fileset
- [ ] PostgreSQL is default database
- [ ] Can still use SQLite with DATABASE_TYPE=sqlite

## 📝 Validation Queries

After seeding, run these to verify:

```sql
-- Check isbase counts by entity type
SELECT 'events' as table_name, 
       COUNT(*) as total, 
       SUM(isbase) as base_records 
FROM events
UNION ALL
SELECT 'posts', COUNT(*), SUM(isbase) FROM posts
UNION ALL
SELECT 'locations', COUNT(*), SUM(isbase) FROM locations
UNION ALL
SELECT 'instructors', COUNT(*), SUM(isbase) FROM instructors
UNION ALL
SELECT 'participants', COUNT(*), SUM(isbase) FROM participants;

-- Verify only _demo.* have isbase=1
SELECT id, isbase FROM events WHERE id LIKE '_demo.%' LIMIT 5;
SELECT id, isbase FROM events WHERE id NOT LIKE '_demo.%' LIMIT 5;

-- Check system_config has fileset configs
SELECT key, description FROM system_config;
```

## 🎯 Next Steps

1. **Test the complete flow:**
   - Drop database
   - Run `pnpm dev`
   - Verify migrations execute
   - Verify seeding completes
   - Check isbase values
   - Test watch endpoints

2. **Add more filesets** (optional):
   ```typescript
   production: {
       id: 'production',
       name: 'Production Dataset',
       description: 'Live production data',
       path: path.resolve(process.cwd(), 'server/data/production'),
       files: ['events.csv', ...],
       isDefault: false
   }
   ```

3. **Implement watch execute logic:**
   - Reset (CSV → DB): Read CSV, clear/update DB
   - Save (DB → CSV): Query DB, write CSV

## 🐛 Known Issues / Notes

1. **CSV files moved:** If you have local references to `src/assets/csv/`, they will break. Update to use `server/data/base/` or use the settings helpers.

2. **isbase field:** Existing databases need migration 008 to add the column to posts/locations/instructors/participants.

3. **Default database change:** If you were relying on SQLite being default, you now need to set `DATABASE_TYPE=sqlite` explicitly.

4. **File validation:** Attempting to seed a file not in the fileset will now throw an error. This is intentional for safety.

## ✅ Completion Status

All 9 tasks completed:
- [x] Change default database to PostgreSQL
- [x] Investigate and fix isbase naming confusion
- [x] Add isbase column to all entity tables
- [x] Create server/data/base directory
- [x] Move CSV files to new location
- [x] Create fileset configuration system
- [x] Update seeding with fileset support
- [x] Update watch API for new CSV location
- [x] Set isbase=1 for demo data during seed

**Ready for testing!** 🚀
