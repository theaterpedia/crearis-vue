# Migration System Refactoring Plan

**Date**: November 9, 2025  
**Type**: Multi-Session Implementation Plan  
**Priority**: High  
**Status**: 🔍 Planning Phase

---

## 🎯 Goal

Transform the monolithic migration system into a phased architecture supporting:
1. Master-slave data synchronization via JSON export/import
2. Safe schema evolution without data loss
3. Automated backup before production schema updates
4. Configurable migration packages (A, B, C, D, E)
5. Data seeding packages (datA-datH) with late-binding foreign key resolution

---

## 📊 Current State Analysis

### Existing Migration Structure

**Schema Migrations (Auto-run)**:
- `000-018`: Base schema setup (19 migrations)
- `019`: Add tags, status, xmlid system (Core Schema Part 1)
- `020`: Refactor entities with i18n (Core Schema Part 2)

**Data Seeding (Manual-only, manualOnly: true)**:
- `021`: System data (tags, status, config, projects, users, domains)
- `022`: CSV data import (users, projects from root fileset)
- `023`: Demo data (demo users, projects, memberships, images)
- `024`: Placeholder (image assignment moved to 023)

**Key Findings**:
1. ✅ Migrations 021-024 already marked `manualOnly: true`
2. ✅ xmlid system exists in: events, posts, participants, instructors, locations
3. ✅ Status IDs properly set up with i18n support
4. ✅ Tables have proper foreign key relationships
5. ⚠️ Migration 021 mixes schema + data (needs separation later)

### Tables with xmlid (Export/Import Targets)

**Entity Tables (datB_base)**:
- `events` - xmlid, event_xmlid (self-reference)
- `posts` - xmlid, event_xmlid (FK to events)
- `participants` - xmlid, event_xmlid
- `instructors` - xmlid, event_xmlid
- `locations` - xmlid, event_xmlid

**Detail Tables (datG_propagation)**:
- `project_members` - No xmlid (user_id, project_id)
- `pages` - No xmlid (project_id, user_id)
- `interactions` - No xmlid (multiple FKs)
- `images` - No xmlid (cimg used as key)

**Foreign Key Dependencies Requiring Late Seeding**:
- `events.event_xmlid` → events (self-reference)
- `posts.event_xmlid` → events
- `participants.event_xmlid` → events
- `instructors.event_xmlid` → events
- `locations.event_xmlid` → events
- All `project_id`, `user_id`, `status_id` references

---

## 🔧 New Architecture

### Migration Packages (Schema)

```env
# .env configuration
DB_MIGRATION_STARTWITH=A
DB_MIGRATION_ENDWITH=B
```

**Package A: Setup** (000-018)
- Base schema creation
- All foundational tables
- Core triggers and constraints

**Package B: Core-Schema** (019-020)
- Tags and status system
- xmlid integration
- i18n core
- Entity refactoring

**Package C: Alpha** (022-029, future)
- Alpha-stage schema additions
- Reserved for new features

**Package D: Beta** (030-039, future)
- Beta-stage schema additions
- Reserved for refinements

**Package E: Final** (040+, future)
- Production-ready schema
- Reserved for final migrations

### Data Seeding Packages (Bash Scripts)

**Execution**: `bash scripts/data-sync.sh [mode] [backup]`
- **mode**: init | replace | update | append (only init+replace for now)
- **backup**: Optional tarball path from /data/sync/

**datA_config**: Config Data
- Migration 021 Chapter 1+2 (tags, status, base config)
- Adds dummy records with xmlid='setup' for late seeding

**datB_base**: Base Data  
- Migration 022 (CSV import: users, projects)
- Core system data

**datC_parts**: Data Parts
- Migration 023 (demo users, projects)
- Entity data with xmlid

**datD_entities**: Data Entities
- Migration 024 content (currently placeholder)
- Full entity records

**datF_assignments**: Late Seeding
- Resolve foreign keys after init
- Update records with actual IDs (not 'setup')
- Create detail table entries

**datG_propagation**: Detail Tables
- Pages, project_members, interactions
- Records without xmlid, referenced by parent xmlid

**datH_validation**: Test Suite
- Validate ~40 tests across tables
- Verify data integrity
- Check foreign keys

---

## 📝 Implementation Sessions

### Session 1: Prepare Migrations (2-3 hours)

**Goals**:
1. Move/rename migrations 022-024 to archive
2. Update migration runner for package system
3. Add environment variable support
4. Test migration packages A+B

**Tasks**:

#### Task 1.1: Archive Old Data Migrations (30 min)
```bash
# Move to archived location
mkdir -p server/database/migrations/archived_data_seeds
mv server/database/migrations/022_seed_csv_data.ts server/database/migrations/archived_data_seeds/
mv server/database/migrations/023_seed_demo_data.ts server/database/migrations/archived_data_seeds/
mv server/database/migrations/024_add_project_images.ts server/database/migrations/archived_data_seeds/
```

- Update `server/database/migrations/index.ts` to remove references
- Create `pnpm db:mig:archived` script to run archived migrations
- Test that migrations 000-020 still work

**Files Modified**:
- `server/database/migrations/index.ts`
- `package.json` (add db:mig:archived script)

#### Task 1.2: Implement Package System (60 min)
**New File**: `server/database/migrations/packages.ts`

```typescript
export type MigrationPackage = 'A' | 'B' | 'C' | 'D' | 'E'

export const PACKAGE_RANGES: Record<MigrationPackage, { start: number; end: number }> = {
  A: { start: 0, end: 18 },    // 000-018: Setup
  B: { start: 19, end: 20 },   // 019-020: Core-Schema
  C: { start: 22, end: 29 },   // 022-029: Alpha (reserved)
  D: { start: 30, end: 39 },   // 030-039: Beta (reserved)
  E: { start: 40, end: 999 },  // 040+: Final (reserved)
}

export function getMigrationPackageRange(
  startPackage?: string,
  endPackage?: string
): { start: number; end: number } | null {
  const start = startPackage?.toUpperCase() as MigrationPackage || 'A'
  const end = endPackage?.toUpperCase() as MigrationPackage || 'E'
  
  if (!PACKAGE_RANGES[start] || !PACKAGE_RANGES[end]) {
    return null
  }
  
  return {
    start: PACKAGE_RANGES[start].start,
    end: PACKAGE_RANGES[end].end
  }
}
```

**Modify**: `server/database/migrations/run.ts`
```typescript
import { getMigrationPackageRange } from './packages'

const startPackage = process.env.DB_MIGRATION_STARTWITH
const endPackage = process.env.DB_MIGRATION_ENDWITH

if (startPackage || endPackage) {
  const range = getMigrationPackageRange(startPackage, endPackage)
  if (range) {
    console.log(`🎯 Running migrations package ${startPackage || 'A'} to ${endPackage || 'E'}`)
    console.log(`   Range: ${range.start.toString().padStart(3, '0')} - ${range.end.toString().padStart(3, '0')}`)
  }
}
```

**Files Created**:
- `server/database/migrations/packages.ts`

**Files Modified**:
- `server/database/migrations/run.ts`
- `server/database/migrations/index.ts` (filter by range)

#### Task 1.3: Test Package System (30 min)
```bash
# Test default (all migrations)
pnpm db:migrate

# Test package A only
DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=A pnpm db:migrate

# Test packages A+B
DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=B pnpm db:migrate
```

**Validation**:
- Verify migrations run in order
- Check crearis_config.migrations_run array
- Confirm package filtering works

---

### Session 2: Build Backup System (3-4 hours)

**Goals**:
1. Create JSON export schema for entities with xmlid
2. Identify late-seeding columns
3. Create JSON export for detail tables
4. Add export button to ImageAdmin
5. Create tarball backup system

**Tasks**:

#### Task 2.1: Design JSON Schema (30 min)
**New File**: `server/types/backup-schema.ts`

```typescript
/**
 * Backup JSON Schema
 * 
 * Format for entity tables (with xmlid):
 * {
 *   "table": "events",
 *   "version": "1.0.0",
 *   "exported_at": "2025-11-09T10:30:00Z",
 *   "record_count": 42,
 *   "records": [
 *     {
 *       "xmlid": "event-001",
 *       "name": "Workshop",
 *       // All columns EXCEPT 'id' (use master_id if needed)
 *       // Late-seeding columns marked with special prefix
 *       "_late_event_xmlid": "parent-event-001",
 *       "_late_project_id": 5,
 *       "status_id": 3
 *     }
 *   ],
 *   "late_seed_columns": ["event_xmlid", "project_id"]
 * }
 * 
 * Format for detail tables (no xmlid):
 * {
 *   "table": "pages",
 *   "version": "1.0.0",
 *   "exported_at": "2025-11-09T10:30:00Z",
 *   "record_count": 15,
 *   "parent_table": "projects",
 *   "parent_key": "project_id",
 *   "records": [
 *     {
 *       "_parent_xmlid": "project-tp",  // Reference parent by xmlid
 *       "slug": "home",
 *       "title": "Home Page",
 *       // Other columns
 *     }
 *   ]
 * }
 */

export interface BackupMetadata {
  table: string
  version: string
  exported_at: string
  record_count: number
  late_seed_columns?: string[]
  parent_table?: string
  parent_key?: string
}

export interface EntityBackup extends BackupMetadata {
  records: Record<string, any>[]
}

export interface BackupIndex {
  created_at: string
  tables: string[]
  files: Record<string, string>  // table -> filename
  metadata: {
    database_version: string
    migration_package: string
    total_records: number
  }
}
```

#### Task 2.2: Identify Late-Seeding Columns (45 min)
**New File**: `server/database/backup/late-seed-config.ts`

```typescript
/**
 * Configuration for late-seeding columns
 * 
 * These columns reference other records and cannot be set
 * during init mode (when FKs don't exist yet)
 */

export const LATE_SEED_CONFIG: Record<string, string[]> = {
  events: [
    'event_xmlid',      // Self-reference to parent event
    'project_id',       // FK to projects
    'user_id',          // FK to users
  ],
  posts: [
    'event_xmlid',      // FK to events (by xmlid)
    'project_id',
    'user_id',
  ],
  participants: [
    'event_xmlid',
    'country_id',       // FK to countries (lookup table)
  ],
  instructors: [
    'event_xmlid',
    'country_id',
  ],
  locations: [
    'event_xmlid',
    'project_id',
    'country_id',
  ],
  // Detail tables (no xmlid, parent-referenced)
  project_members: [],  // Handled separately in datG
  pages: [],            // Handled separately in datG
  interactions: [],     // Handled separately in datG
}

export function getLateSeedColumns(table: string): string[] {
  return LATE_SEED_CONFIG[table] || []
}

export function isLateSeedColumn(table: string, column: string): boolean {
  return getLateSeedColumns(table).includes(column)
}
```

#### Task 2.3: Create Export Functions (90 min)
**New File**: `server/database/backup/export.ts`

```typescript
import type { DatabaseAdapter } from '../adapter'
import type { EntityBackup, BackupIndex } from '../../types/backup-schema'
import { getLateSeedColumns } from './late-seed-config'
import fs from 'fs'
import path from 'path'

/**
 * Export entity table to JSON
 */
export async function exportEntityTable(
  db: DatabaseAdapter,
  table: string
): Promise<EntityBackup> {
  const lateSeedCols = getLateSeedColumns(table)
  
  // Get all records (exclude 'id' column, use xmlid as key)
  const records = await db.all(`SELECT * FROM ${table}`, [])
  
  const exportRecords = records.map((record: any) => {
    const { id, ...rest } = record
    
    // Add master_id for reference (optional)
    const exported: any = {
      master_id: id,
      ...rest
    }
    
    // Mark late-seed columns with _ prefix
    for (const col of lateSeedCols) {
      if (exported[col] !== undefined) {
        exported[`_late_${col}`] = exported[col]
        delete exported[col]
      }
    }
    
    return exported
  })
  
  return {
    table,
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    record_count: exportRecords.length,
    late_seed_columns: lateSeedCols,
    records: exportRecords
  }
}

/**
 * Export detail table to JSON (parent-referenced)
 */
export async function exportDetailTable(
  db: DatabaseAdapter,
  table: string,
  parentTable: string,
  parentKey: string
): Promise<EntityBackup> {
  // Join with parent table to get parent xmlid
  const query = `
    SELECT 
      detail.*,
      parent.xmlid as _parent_xmlid
    FROM ${table} detail
    LEFT JOIN ${parentTable} parent ON detail.${parentKey} = parent.id
  `
  
  const records = await db.all(query, [])
  
  const exportRecords = records.map((record: any) => {
    const { id, [parentKey]: _, ...rest } = record
    return rest
  })
  
  return {
    table,
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    record_count: exportRecords.length,
    parent_table: parentTable,
    parent_key: parentKey,
    records: exportRecords
  }
}

/**
 * Export all tables to /data/{table}/timestamp.json
 */
export async function exportAllTables(
  db: DatabaseAdapter,
  dataPath: string
): Promise<BackupIndex> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  const entityTables = ['events', 'posts', 'participants', 'instructors', 'locations']
  const detailTables = [
    { table: 'project_members', parent: 'projects', key: 'project_id' },
    { table: 'pages', parent: 'projects', key: 'project_id' },
  ]
  
  const index: BackupIndex = {
    created_at: timestamp,
    tables: [],
    files: {},
    metadata: {
      database_version: '0.0.1',
      migration_package: 'A-B',
      total_records: 0
    }
  }
  
  // Export entity tables
  for (const table of entityTables) {
    const backup = await exportEntityTable(db, table)
    const dir = path.join(dataPath, table)
    const filename = `${timestamp}.json`
    
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, filename),
      JSON.stringify(backup, null, 2)
    )
    
    index.tables.push(table)
    index.files[table] = filename
    index.metadata.total_records += backup.record_count
    
    console.log(`✓ Exported ${table}: ${backup.record_count} records`)
  }
  
  // Export detail tables
  for (const { table, parent, key } of detailTables) {
    const backup = await exportDetailTable(db, table, parent, key)
    const dir = path.join(dataPath, table)
    const filename = `${timestamp}.json`
    
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, filename),
      JSON.stringify(backup, null, 2)
    )
    
    index.tables.push(table)
    index.files[table] = filename
    index.metadata.total_records += backup.record_count
    
    console.log(`✓ Exported ${table}: ${backup.record_count} records`)
  }
  
  // Write index
  fs.writeFileSync(
    path.join(dataPath, `${timestamp}.json`),
    JSON.stringify(index, null, 2)
  )
  
  return index
}

/**
 * Create tarball from export
 */
export async function createBackupTarball(
  dataPath: string,
  index: BackupIndex
): Promise<string> {
  const timestamp = index.created_at
  const exportDir = path.join(dataPath, 'export', 'temp')
  const syncDir = path.join(dataPath, 'sync')
  
  // Create directories
  fs.mkdirSync(exportDir, { recursive: true })
  fs.mkdirSync(syncDir, { recursive: true })
  
  // Copy files to temp with standard names
  for (const [table, filename] of Object.entries(index.files)) {
    const src = path.join(dataPath, table, filename)
    const dst = path.join(exportDir, `${table}.json`)
    fs.copyFileSync(src, dst)
  }
  
  // Copy index as backup-index.json
  fs.copyFileSync(
    path.join(dataPath, `${timestamp}.json`),
    path.join(exportDir, 'backup-index.json')
  )
  
  // Create tarball
  const tarFile = path.join(syncDir, `${timestamp}.backup.tar`)
  const { execSync } = require('child_process')
  execSync(`tar -czf ${tarFile} -C ${exportDir} .`)
  
  // Clean up temp
  fs.rmSync(exportDir, { recursive: true })
  
  console.log(`\n✓ Created backup: ${tarFile}`)
  return tarFile
}
```

**Files Created**:
- `server/types/backup-schema.ts`
- `server/database/backup/late-seed-config.ts`
- `server/database/backup/export.ts`

#### Task 2.4: Create Export API Endpoint (30 min)
**New File**: `server/api/admin/backup/export.post.ts`

```typescript
import { exportAllTables, createBackupTarball } from '~/server/database/backup/export'
import { db } from '~/server/database/db-new'
import { getDataPath } from '~/server/settings'

export default defineEventHandler(async (event) => {
  try {
    const dataPath = getDataPath()
    
    console.log('🚀 Starting backup export...')
    const index = await exportAllTables(db, dataPath)
    
    console.log('📦 Creating tarball...')
    const tarFile = await createBackupTarball(dataPath, index)
    
    return {
      success: true,
      backup: {
        timestamp: index.created_at,
        tables: index.tables,
        total_records: index.metadata.total_records,
        tar_file: tarFile
      }
    }
  } catch (error: any) {
    console.error('❌ Backup export failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
```

#### Task 2.5: Add Export Button to ImageAdmin (30 min)
**Modify**: `src/views/admin/ImagesCoreAdmin.vue`

Add new section after "Import Images" section:

```vue
<!-- System Backup Section -->
<section class="data-section">
  <h2>System Backup</h2>
  <p>Export database to JSON tarball for master-slave sync</p>
  
  <button @click="handleExportBackup" :disabled="exportingBackup">
    {{ exportingBackup ? 'Exporting...' : 'Create Backup' }}
  </button>
  
  <div v-if="lastBackup" class="backup-info">
    <p>Last backup: {{ lastBackup.timestamp }}</p>
    <p>Tables: {{ lastBackup.tables.join(', ') }}</p>
    <p>Records: {{ lastBackup.total_records }}</p>
  </div>
</section>
```

```typescript
const exportingBackup = ref(false)
const lastBackup = ref<any>(null)

const handleExportBackup = async () => {
  exportingBackup.value = true
  try {
    const response = await fetch('/api/admin/backup/export', {
      method: 'POST'
    })
    const result = await response.json()
    
    if (result.success) {
      lastBackup.value = result.backup
      alert(`Backup created: ${result.backup.tar_file}`)
    } else {
      alert(`Backup failed: ${result.error}`)
    }
  } catch (error) {
    console.error('Backup error:', error)
    alert('Backup failed')
  } finally {
    exportingBackup.value = false
  }
}
```

**Files Modified**:
- `src/views/admin/ImagesCoreAdmin.vue`

---

### Session 3: Build Import Manager (3-4 hours)

**Goals**:
1. Create bash script to handle imports
2. Implement init mode (late-seeding)
3. Implement replace mode (direct updates)
4. Create datF_assignments (late-seed resolver)
5. Create datG_propagation (detail tables)

**Tasks**:

#### Task 3.1: Create Import Manager Script (60 min)
**New File**: `scripts/data-sync.sh`

```bash
#!/bin/bash

# Data Sync Manager
# Handles import of tarball backups with late-seeding support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"
SYNC_DIR="$DATA_DIR/sync"
TEMP_DIR="$DATA_DIR/import/temp"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Data Sync Manager${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# Parse arguments
MODE="${1:-replace}"  # init | replace | update | append
BACKUP_FILE="$2"

# Validate mode
if [[ ! "$MODE" =~ ^(init|replace|update|append)$ ]]; then
  echo -e "${RED}Invalid mode: $MODE${NC}"
  echo "Usage: $0 [mode] [backup-file]"
  echo "  mode: init | replace | update | append (default: replace)"
  echo "  backup-file: Optional path to backup tar (default: latest)"
  exit 1
fi

# Only support init and replace for now
if [[ "$MODE" == "update" || "$MODE" == "append" ]]; then
  echo -e "${YELLOW}Mode '$MODE' not yet implemented${NC}"
  echo "Supported modes: init, replace"
  exit 1
fi

# Find backup file
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}No backup file specified, searching for latest...${NC}"
  BACKUP_FILE=$(ls -t "$SYNC_DIR"/*.backup.tar 2>/dev/null | head -1)
  
  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}No backup files found in $SYNC_DIR${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Found: $BACKUP_FILE${NC}"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

# Prompt for confirmation
echo ""
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${YELLOW}Import mode: $MODE${NC}"
echo ""
read -p "Continue with import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Import cancelled${NC}"
  exit 0
fi

# Extract tarball
echo ""
echo -e "${GREEN}Extracting backup...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Verify index exists
INDEX_FILE="$TEMP_DIR/backup-index.json"
if [ ! -f "$INDEX_FILE" ]; then
  echo -e "${RED}Invalid backup: backup-index.json not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Backup extracted${NC}"

# Run data packages
echo ""
echo -e "${GREEN}Running data packages...${NC}"

# datA_config: Config data + setup dummy records
echo -e "${YELLOW}→ datA_config: Config data${NC}"
pnpm tsx server/database/data-packages/datA_config.ts --mode="$MODE"

# datB_base: Base data (CSV imports)
echo -e "${YELLOW}→ datB_base: Base data${NC}"
pnpm tsx server/database/data-packages/datB_base.ts --mode="$MODE" --import-dir="$TEMP_DIR"

# datC_parts: Data parts (entities with xmlid)
echo -e "${YELLOW}→ datC_parts: Data parts${NC}"
pnpm tsx server/database/data-packages/datC_parts.ts --mode="$MODE" --import-dir="$TEMP_DIR"

# datD_entities: Data entities
echo -e "${YELLOW}→ datD_entities: Data entities${NC}"
pnpm tsx server/database/data-packages/datD_entities.ts --mode="$MODE" --import-dir="$TEMP_DIR"

# datF_assignments: Late seeding (init mode only)
if [ "$MODE" == "init" ]; then
  echo -e "${YELLOW}→ datF_assignments: Late seeding${NC}"
  pnpm tsx server/database/data-packages/datF_assignments.ts --import-dir="$TEMP_DIR"
fi

# datG_propagation: Detail tables
echo -e "${YELLOW}→ datG_propagation: Detail tables${NC}"
pnpm tsx server/database/data-packages/datG_propagation.ts --mode="$MODE" --import-dir="$TEMP_DIR"

# datH_validation: Validation tests
echo -e "${YELLOW}→ datH_validation: Validation${NC}"
pnpm tsx server/database/data-packages/datH_validation.ts

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Import Complete${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# Clean up
rm -rf "$TEMP_DIR"
```

**Files Created**:
- `scripts/data-sync.sh`

#### Task 3.2: Implement datB_base Import (45 min)
**New File**: `server/database/data-packages/datB_base.ts`

```typescript
/**
 * datB_base: Base Data Import
 * 
 * Imports core system data from JSON files
 */

import type { DatabaseAdapter } from '../adapter'
import type { EntityBackup } from '../../types/backup-schema'
import { db } from '../db-new'
import fs from 'fs'
import path from 'path'

async function importTable(
  db: DatabaseAdapter,
  backup: EntityBackup,
  mode: 'init' | 'replace'
) {
  console.log(`  Importing ${backup.table}: ${backup.record_count} records (mode: ${mode})`)
  
  const lateSeedCols = backup.late_seed_columns || []
  const setupRecords: Array<{ xmlid: string; columns: string[]; values: any[] }> = []
  
  for (const record of backup.records) {
    const { master_id, xmlid, ...data } = record
    
    // Extract late-seed columns (prefixed with _late_)
    const lateSeedValues: Record<string, any> = {}
    const immediateData: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('_late_')) {
        const originalKey = key.replace('_late_', '')
        lateSeedValues[originalKey] = value
      } else {
        immediateData[key] = value
      }
    }
    
    if (mode === 'init') {
      // Set late-seed columns to reference 'setup' dummy record
      for (const col of lateSeedCols) {
        if (col.endsWith('_xmlid')) {
          immediateData[col] = 'setup'
        } else if (col.endsWith('_id')) {
          // Get ID of 'setup' record from referenced table
          // This will be resolved in datF_assignments
          immediateData[col] = null  // Set to null for now
        }
      }
      
      // Store for late seeding
      if (Object.keys(lateSeedValues).length > 0) {
        setupRecords.push({
          xmlid,
          columns: Object.keys(lateSeedValues),
          values: Object.values(lateSeedValues)
        })
      }
    } else {
      // Replace mode: use actual values
      Object.assign(immediateData, lateSeedValues)
    }
    
    // Build INSERT/UPDATE query
    const columns = Object.keys(immediateData)
    const values = Object.values(immediateData)
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const updates = columns.map((col, i) => `${col} = $${i + 1}`).join(', ')
    
    const query = `
      INSERT INTO ${backup.table} (xmlid, ${columns.join(', ')})
      VALUES ($${columns.length + 1}, ${placeholders})
      ON CONFLICT (xmlid) DO UPDATE SET ${updates}
    `
    
    await db.run(query, [...values, xmlid])
  }
  
  // Store late-seed records for datF_assignments
  if (mode === 'init' && setupRecords.length > 0) {
    const lateDir = path.join(process.cwd(), 'data', 'late-seed')
    fs.mkdirSync(lateDir, { recursive: true })
    
    fs.writeFileSync(
      path.join(lateDir, `${backup.table}.json`),
      JSON.stringify(setupRecords, null, 2)
    )
    
    console.log(`    ✓ Stored ${setupRecords.length} records for late seeding`)
  }
  
  console.log(`    ✓ Imported ${backup.record_count} records`)
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] as 'init' | 'replace' || 'replace'
  const importDir = args.find(a => a.startsWith('--import-dir='))?.split('=')[1]
  
  if (!importDir) {
    throw new Error('--import-dir required')
  }
  
  console.log('\n📦 datB_base: Base Data Import')
  console.log(`   Mode: ${mode}`)
  console.log(`   Source: ${importDir}`)
  
  // Import entity tables
  const entityTables = ['events', 'posts', 'participants', 'instructors', 'locations']
  
  for (const table of entityTables) {
    const file = path.join(importDir, `${table}.json`)
    if (!fs.existsSync(file)) {
      console.log(`  ⚠️  Skipping ${table}: file not found`)
      continue
    }
    
    const backup: EntityBackup = JSON.parse(fs.readFileSync(file, 'utf-8'))
    await importTable(db, backup, mode)
  }
  
  console.log('\n✅ datB_base complete')
}

main().catch(error => {
  console.error('❌ datB_base failed:', error)
  process.exit(1)
})
```

**Files Created**:
- `server/database/data-packages/datB_base.ts`

#### Task 3.3: Implement datF_assignments (60 min)
**New File**: `server/database/data-packages/datF_assignments.ts`

```typescript
/**
 * datF_assignments: Late Seeding
 * 
 * Resolves foreign keys after init import
 * Updates records that were set to 'setup' with actual IDs
 */

import type { DatabaseAdapter } from '../adapter'
import { db } from '../db-new'
import fs from 'fs'
import path from 'path'

interface LateSeedRecord {
  xmlid: string
  columns: string[]
  values: any[]
}

async function resolveLateSeeding(
  db: DatabaseAdapter,
  table: string,
  records: LateSeedRecord[]
) {
  console.log(`  Resolving ${table}: ${records.length} records`)
  
  for (const record of records) {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    for (let i = 0; i < record.columns.length; i++) {
      const column = record.columns[i]
      const value = record.values[i]
      
      if (column.endsWith('_xmlid')) {
        // Resolve xmlid to actual ID
        const refTable = column.replace('_xmlid', '') + 's'  // events -> events
        const refRecord = await db.get(
          `SELECT id FROM ${refTable} WHERE xmlid = $1`,
          [value]
        )
        
        if (refRecord) {
          updates.push(`${column} = $${paramIndex}`)
          values.push(value)
          paramIndex++
        }
      } else if (column.endsWith('_id')) {
        // Direct ID reference
        updates.push(`${column} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }
    
    if (updates.length > 0) {
      const query = `
        UPDATE ${table}
        SET ${updates.join(', ')}
        WHERE xmlid = $${paramIndex}
      `
      
      await db.run(query, [...values, record.xmlid])
    }
  }
  
  console.log(`    ✓ Resolved ${records.length} records`)
}

async function main() {
  const args = process.argv.slice(2)
  const importDir = args.find(a => a.startsWith('--import-dir='))?.split('=')[1]
  
  console.log('\n🔗 datF_assignments: Late Seeding')
  
  const lateDir = path.join(process.cwd(), 'data', 'late-seed')
  
  if (!fs.existsSync(lateDir)) {
    console.log('  ℹ️  No late-seed records found')
    return
  }
  
  const tables = ['events', 'posts', 'participants', 'instructors', 'locations']
  
  for (const table of tables) {
    const file = path.join(lateDir, `${table}.json`)
    if (!fs.existsSync(file)) continue
    
    const records: LateSeedRecord[] = JSON.parse(fs.readFileSync(file, 'utf-8'))
    await resolveLateSeeding(db, table, records)
  }
  
  // Clean up late-seed directory
  fs.rmSync(lateDir, { recursive: true })
  
  console.log('\n✅ datF_assignments complete')
}

main().catch(error => {
  console.error('❌ datF_assignments failed:', error)
  process.exit(1)
})
```

**Files Created**:
- `server/database/data-packages/datF_assignments.ts`

#### Task 3.4: Implement datG_propagation (45 min)
**New File**: `server/database/data-packages/datG_propagation.ts`

```typescript
/**
 * datG_propagation: Detail Tables
 * 
 * Imports detail tables that reference entities by parent xmlid
 */

import type { DatabaseAdapter } from '../adapter'
import type { EntityBackup } from '../../types/backup-schema'
import { db } from '../db-new'
import fs from 'fs'
import path from 'path'

async function importDetailTable(
  db: DatabaseAdapter,
  backup: EntityBackup,
  mode: 'init' | 'replace'
) {
  console.log(`  Importing ${backup.table}: ${backup.record_count} records`)
  
  const parentTable = backup.parent_table!
  const parentKey = backup.parent_key!
  
  for (const record of backup.records) {
    const { _parent_xmlid, ...data } = record
    
    // Resolve parent xmlid to ID
    const parent = await db.get(
      `SELECT id FROM ${parentTable} WHERE xmlid = $1`,
      [_parent_xmlid]
    )
    
    if (!parent) {
      console.log(`    ⚠️  Parent not found: ${parentTable}.xmlid = ${_parent_xmlid}`)
      continue
    }
    
    // Build INSERT/UPDATE query
    const columns = Object.keys(data)
    const values = Object.values(data)
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const updates = columns.map((col, i) => `${col} = $${i + 1}`).join(', ')
    
    const query = `
      INSERT INTO ${backup.table} (${parentKey}, ${columns.join(', ')})
      VALUES ($${columns.length + 1}, ${placeholders})
      ON CONFLICT DO UPDATE SET ${updates}
    `
    
    await db.run(query, [...values, (parent as any).id])
  }
  
  console.log(`    ✓ Imported ${backup.record_count} records`)
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] as 'init' | 'replace' || 'replace'
  const importDir = args.find(a => a.startsWith('--import-dir='))?.split('=')[1]
  
  if (!importDir) {
    throw new Error('--import-dir required')
  }
  
  console.log('\n📋 datG_propagation: Detail Tables')
  console.log(`   Mode: ${mode}`)
  
  const detailTables = [
    { table: 'project_members', file: 'project_members.json' },
    { table: 'pages', file: 'pages.json' },
  ]
  
  for (const { table, file } of detailTables) {
    const filePath = path.join(importDir, file)
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Skipping ${table}: file not found`)
      continue
    }
    
    const backup: EntityBackup = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    await importDetailTable(db, backup, mode)
  }
  
  console.log('\n✅ datG_propagation complete')
}

main().catch(error => {
  console.error('❌ datG_propagation failed:', error)
  process.exit(1)
})
```

**Files Created**:
- `server/database/data-packages/datG_propagation.ts`

---

### Session 4: Validation & Testing (2-3 hours)

**Goals**:
1. Create datH_validation test suite
2. Create datA_config (setup dummy records)
3. Test full export/import cycle
4. Document usage

**Tasks**:

#### Task 4.1: Implement datA_config (45 min)
**New File**: `server/database/data-packages/datA_config.ts`

```typescript
/**
 * datA_config: Config Data + Setup Dummy Records
 * 
 * Runs migration 021 (system data)
 * Adds dummy records with xmlid='setup' for late-seeding
 */

import type { DatabaseAdapter } from '../adapter'
import { db } from '../db-new'
import { migration as migration021 } from '../migrations/021_seed_system_data'

async function createSetupDummies(db: DatabaseAdapter) {
  console.log('  Creating setup dummy records...')
  
  const tables = ['events', 'posts', 'participants', 'instructors', 'locations']
  
  for (const table of tables) {
    // Get default status
    const status = await db.get(
      `SELECT id FROM status WHERE name = $1 AND "table" = $2`,
      ['new', table]
    )
    
    const statusId = status ? (status as any).id : null
    
    await db.run(`
      INSERT INTO ${table} (xmlid, name, status_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (xmlid) DO NOTHING
    `, ['setup', 'Setup Dummy Record', statusId])
    
    console.log(`    ✓ Created setup dummy in ${table}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'replace'
  
  console.log('\n⚙️  datA_config: Config Data')
  console.log(`   Mode: ${mode}`)
  
  // Run migration 021
  console.log('  Running migration 021 (system data)...')
  await migration021.up(db)
  
  // Create setup dummies (init mode only)
  if (mode === 'init') {
    await createSetupDummies(db)
  }
  
  console.log('\n✅ datA_config complete')
}

main().catch(error => {
  console.error('❌ datA_config failed:', error)
  process.exit(1)
})
```

**Files Created**:
- `server/database/data-packages/datA_config.ts`

#### Task 4.2: Implement datH_validation (60 min)
**New File**: `server/database/data-packages/datH_validation.ts`

```typescript
/**
 * datH_validation: Validation Tests
 * 
 * Runs ~40 tests to verify data integrity
 */

import type { DatabaseAdapter } from '../adapter'
import { db } from '../db-new'

interface TestResult {
  name: string
  passed: boolean
  message: string
  expected?: any
  actual?: any
}

const tests: TestResult[] = []

async function test(
  name: string,
  fn: () => Promise<boolean>,
  message: string
) {
  try {
    const passed = await fn()
    tests.push({ name, passed, message })
    
    if (passed) {
      console.log(`  ✓ ${name}`)
    } else {
      console.log(`  ✗ ${name}: ${message}`)
    }
  } catch (error: any) {
    tests.push({ name, passed: false, message: error.message })
    console.log(`  ✗ ${name}: ${error.message}`)
  }
}

async function runTests() {
  console.log('\n🧪 Running validation tests...\n')
  
  // Test 1-5: Table existence
  await test('events table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'events'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'events table not found')
  
  await test('posts table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'posts'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'posts table not found')
  
  // Test 6-10: Record counts
  await test('events has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM events`, [])
    return (result as any).count > 0
  }, 'No events found')
  
  await test('users has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM users`, [])
    return (result as any).count > 0
  }, 'No users found')
  
  // Test 11-20: Foreign key integrity
  await test('events.status_id references valid status', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE status_id IS NOT NULL
        AND status_id NOT IN (SELECT id FROM status)
    `, [])
    return (result as any).count === 0
  }, 'Invalid status_id references found')
  
  await test('posts.event_xmlid references valid events', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE event_xmlid IS NOT NULL
        AND event_xmlid NOT IN (SELECT xmlid FROM events)
    `, [])
    return (result as any).count === 0
  }, 'Invalid event_xmlid references found')
  
  // Test 21-30: xmlid uniqueness
  await test('events.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM events
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in events')
  
  // Test 31-40: Data consistency
  await test('No events with status=trash and status_id=published', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events e
      JOIN status s ON e.status_id = s.id
      WHERE s.name = 'trash'
        AND e.status_id IN (
          SELECT id FROM status WHERE name = 'published'
        )
    `, [])
    return (result as any).count === 0
  }, 'Inconsistent status values found')
  
  await test('All users have valid email format', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM users
      WHERE sysmail !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
    `, [])
    return (result as any).count === 0
  }, 'Invalid email formats found')
  
  // Summary
  const passed = tests.filter(t => t.passed).length
  const failed = tests.filter(t => !t.passed).length
  
  console.log('\n' + '═'.repeat(50))
  console.log(`Tests: ${tests.length} total, ${passed} passed, ${failed} failed`)
  console.log('═'.repeat(50))
  
  if (failed > 0) {
    console.log('\nFailed tests:')
    tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ✗ ${t.name}: ${t.message}`)
    })
    
    throw new Error(`${failed} validation tests failed`)
  }
}

async function main() {
  console.log('\n✅ datH_validation: Validation Tests')
  
  await runTests()
  
  console.log('\n✅ All validation tests passed')
}

main().catch(error => {
  console.error('\n❌ Validation failed:', error)
  process.exit(1)
})
```

**Files Created**:
- `server/database/data-packages/datH_validation.ts`

#### Task 4.3: Create Usage Documentation (30 min)
**New File**: `docs/DATABASE_SYNC_GUIDE.md`

```markdown
# Database Sync Guide

## Overview

The database sync system provides master-slave replication via JSON export/import.

## Architecture

### Migration Packages (Schema)
- **Package A**: Setup (migrations 000-018)
- **Package B**: Core-Schema (migrations 019-020)
- **Package C**: Alpha (migrations 022-029, reserved)
- **Package D**: Beta (migrations 030-039, reserved)
- **Package E**: Final (migrations 040+, reserved)

### Data Packages (Seeding)
- **datA_config**: Config data + setup dummies
- **datB_base**: Base data (users, projects)
- **datC_parts**: Data parts (entities with xmlid)
- **datD_entities**: Data entities
- **datF_assignments**: Late seeding (resolve FKs)
- **datG_propagation**: Detail tables
- **datH_validation**: Validation tests

## Usage

### Export Backup (Master)

1. Open ImageAdmin → System Backup
2. Click "Create Backup"
3. Tarball saved to `/data/sync/TIMESTAMP.backup.tar`
4. Transfer tarball to slave machine

### Import Backup (Slave)

```bash
# Copy backup to slave
scp user@master:/path/to/backup.tar /path/to/crearis/data/sync/

# Run import (replace mode - default)
bash scripts/data-sync.sh replace

# Or specify backup file
bash scripts/data-sync.sh replace data/sync/2025-11-09.backup.tar

# Init mode (for fresh database)
bash scripts/data-sync.sh init
```

### Modes

**init**: Fresh import
- Sets late-seed columns to 'setup' dummies
- Runs datF_assignments to resolve FKs
- Use for empty databases

**replace**: Update existing
- Overwrites records by xmlid
- Preserves FKs
- Use for syncing changes

**update**: Merge changes (not yet implemented)
**append**: Add new records only (not yet implemented)

## Workflow

### Before Production Schema Update

1. Export backup: `POST /api/admin/backup/export`
2. Store in `/data/sync/TIMESTAMP.backup.tar`
3. Run schema migration: `pnpm db:migrate`
4. If migration fails, restore from backup

### Syncing Dev from Production

1. SSH to production: `ssh user@production`
2. Export: Via admin GUI or `curl -X POST http://localhost:3000/api/admin/backup/export`
3. Download: `scp user@production:/data/sync/TIMESTAMP.backup.tar ./data/sync/`
4. Import: `bash scripts/data-sync.sh replace`
5. Validate: `pnpm tsx server/database/data-packages/datH_validation.ts`

## Configuration

### Environment Variables

```env
# Migration packages to run
DB_MIGRATION_STARTWITH=A
DB_MIGRATION_ENDWITH=B
```

### Late-Seeding Columns

Configured in `server/database/backup/late-seed-config.ts`:

```typescript
export const LATE_SEED_CONFIG: Record<string, string[]> = {
  events: ['event_xmlid', 'project_id', 'user_id'],
  posts: ['event_xmlid', 'project_id', 'user_id'],
  // ...
}
```

## Troubleshooting

### "No backup files found"
- Check `/data/sync/` directory
- Verify export completed successfully

### "Parent not found"
- Run datF_assignments before datG_propagation
- Verify xmlid values are consistent

### "Validation failed"
- Check datH_validation output
- Fix data inconsistencies
- Re-run import

## Files

### Scripts
- `scripts/data-sync.sh` - Main import manager
- `scripts/backup-production-db.sh` - Production backup (existing)

### Data Packages
- `server/database/data-packages/datA_config.ts`
- `server/database/data-packages/datB_base.ts`
- `server/database/data-packages/datC_parts.ts`
- `server/database/data-packages/datD_entities.ts`
- `server/database/data-packages/datF_assignments.ts`
- `server/database/data-packages/datG_propagation.ts`
- `server/database/data-packages/datH_validation.ts`

### Export/Import
- `server/database/backup/export.ts` - Export functions
- `server/database/backup/late-seed-config.ts` - Late-seed config
- `server/api/admin/backup/export.post.ts` - Export API endpoint

### Types
- `server/types/backup-schema.ts` - JSON schema definitions
```

**Files Created**:
- `docs/DATABASE_SYNC_GUIDE.md`

---

## 📋 Summary

### Session 1: Prepare Migrations
- Archive migrations 022-024
- Implement package system (A-E)
- Test migration filtering

### Session 2: Build Backup System
- Design JSON schema
- Identify late-seeding columns
- Create export functions
- Add export button to ImageAdmin
- Create tarball system

### Session 3: Build Import Manager
- Create bash import script
- Implement datB_base import
- Implement datF_assignments (late-seeding)
- Implement datG_propagation (detail tables)

### Session 4: Validation & Testing
- Implement datA_config
- Implement datH_validation (~40 tests)
- Create usage documentation
- Test full export/import cycle

### Estimated Time
- Session 1: 2-3 hours
- Session 2: 3-4 hours
- Session 3: 3-4 hours
- Session 4: 2-3 hours
- **Total**: 10-14 hours

### Priority
- Session 1: High (enables package system)
- Session 2: High (enables backup)
- Session 3: Medium (enables import)
- Session 4: Medium (enables validation)

---

## 🚀 Next Steps

After implementation:
1. Test export from production
2. Test import to dev machine
3. Verify validation tests pass
4. Document any edge cases
5. Consider migration 021 refactoring (separate config from data)

## ⚠️ Important Notes

1. **No Data Loss**: System works with demo data only
2. **Migration 021**: Currently mixes schema + data, refactor later
3. **Late Seeding**: Critical for init mode, ensures FK integrity
4. **xmlid System**: Already in place for all entity tables
5. **Status System**: Already configured with i18n
6. **Backup Before Updates**: Always export before schema changes

---

**End of Plan**
