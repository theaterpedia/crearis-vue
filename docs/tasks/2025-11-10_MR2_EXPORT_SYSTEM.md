# MR2: Export System & JSON Schema

**Status**: 🔴 Not Started  
**Estimated Time**: 2-3 hours  
**Prerequisites**: [MR1: Migration Package System](./MR1_MIGRATION_PACKAGES.md)  
**Next Step**: [MR3: Export API & Admin UI](./MR3_EXPORT_API.md)

---

## 🎯 Objective

Design and implement the JSON export system for database entities and detail tables. This includes defining the backup schema format, identifying late-seeding columns (FK dependencies), and creating export functions that generate JSON files and tarball archives suitable for master-slave synchronization.

---

## 📋 Tasks Overview

1. **Design JSON Backup Schema** (30 min)
2. **Identify Late-Seeding Columns** (45 min)
3. **Create Export Functions** (60-90 min)

---

## Task 1: Design JSON Backup Schema

### Goal
Define TypeScript interfaces and JSON structure for exporting entity and detail tables with support for late-seeding (deferred foreign key resolution).

### Backup Schema Format

#### Entity Tables (with xmlid)

```json
{
  "table": "events",
  "version": "1.0.0",
  "exported_at": "2025-11-09T10:30:00.000Z",
  "record_count": 42,
  "late_seed_columns": ["event_xmlid", "project_id", "user_id"],
  "records": [
    {
      "master_id": 123,
      "xmlid": "event-workshop-001",
      "name": "Introduction to Vue",
      "status_id": 3,
      "_late_event_xmlid": "event-parent-001",
      "_late_project_id": 5,
      "_late_user_id": 2
    }
  ]
}
```

**Key Features**:
- `master_id`: Original database ID (for reference, not imported)
- `xmlid`: Primary identifier for import/export
- `_late_*` prefix: Marks columns that need late-seeding
- Regular columns: Imported immediately

#### Detail Tables (no xmlid, parent-referenced)

```json
{
  "table": "pages",
  "version": "1.0.0",
  "exported_at": "2025-11-09T10:30:00.000Z",
  "record_count": 15,
  "parent_table": "projects",
  "parent_key": "project_id",
  "records": [
    {
      "_parent_xmlid": "project-tp",
      "slug": "home",
      "title": "Home Page",
      "content": "Welcome...",
      "created_at": "2025-11-01T12:00:00.000Z"
    }
  ]
}
```

**Key Features**:
- `_parent_xmlid`: References parent record by xmlid
- No `id` column: Generated on import
- Parent FK resolved during import

#### Backup Index

```json
{
  "created_at": "2025-11-09T10-30-00-000Z",
  "tables": ["events", "posts", "participants", "pages"],
  "files": {
    "events": "2025-11-09T10-30-00-000Z.json",
    "posts": "2025-11-09T10-30-00-000Z.json",
    "pages": "2025-11-09T10-30-00-000Z.json"
  },
  "metadata": {
    "database_version": "0.0.1",
    "migration_package": "A-B",
    "total_records": 157
  }
}
```

### Implementation

Create file: `server/types/backup-schema.ts`

```typescript
/**
 * Backup JSON Schema Types
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

export interface ExportOptions {
  includeArchived?: boolean
  filterByStatus?: string[]
  dateRange?: {
    start: string
    end: string
  }
}
```

### Files Created

- `server/types/backup-schema.ts`

### Validation

- [ ] TypeScript compiles without errors
- [ ] Interfaces cover all use cases (entity + detail tables)
- [ ] JSON structure is clear and parseable

---

## Task 2: Identify Late-Seeding Columns

### Goal
Create configuration mapping tables to their FK columns that require late-seeding (columns that reference other records and can't be set during initial import).

### Late-Seed Scenarios

**Why Late-Seeding?**
- **init mode**: When importing to fresh database, referenced records don't exist yet
- **Solution**: Set FK columns to dummy 'setup' values, resolve after all records imported

**Example Flow**:
1. Import events with `event_xmlid='setup'` (parent doesn't exist yet)
2. Import posts with `event_xmlid='setup'`
3. After all imports: datF_assignments resolves 'setup' → actual xmlid

### Column Categories

| Category | Example | Late-Seed? | Reason |
|----------|---------|------------|--------|
| Self-reference | `events.event_xmlid` | ✅ Yes | Parent may not exist yet |
| Entity FK (ID) | `events.project_id` | ✅ Yes | Projects imported separately |
| Lookup table | `participants.country_id` | ✅ Yes | Countries pre-seeded |
| Status FK | `events.status_id` | ❌ No | Status seeded in datA_config |
| Timestamps | `created_at` | ❌ No | Direct value |
| Text fields | `name`, `description` | ❌ No | Direct value |

### Implementation

Create file: `server/database/backup/late-seed-config.ts`

```typescript
/**
 * Late-Seeding Column Configuration
 * 
 * Columns listed here will be prefixed with _late_ during export
 * and resolved in datF_assignments after initial import
 */

export const LATE_SEED_CONFIG: Record<string, string[]> = {
  // Entity tables
  events: [
    'event_xmlid',      // Self-reference to parent event
    'project_id',       // FK to projects table
    'user_id',          // FK to users table
  ],
  
  posts: [
    'event_xmlid',      // FK to events (by xmlid)
    'project_id',       // FK to projects
    'user_id',          // FK to users (author)
  ],
  
  participants: [
    'event_xmlid',      // FK to events
    'country_id',       // FK to countries (lookup)
  ],
  
  instructors: [
    'event_xmlid',      // FK to events
    'country_id',       // FK to countries
  ],
  
  locations: [
    'event_xmlid',      // FK to events
    'project_id',       // FK to projects
    'country_id',       // FK to countries
  ],
  
  // Detail tables handled separately in datG_propagation
  // (no late-seeding needed - resolved by parent xmlid)
}

/**
 * Get late-seed columns for a table
 */
export function getLateSeedColumns(table: string): string[] {
  return LATE_SEED_CONFIG[table] || []
}

/**
 * Check if column requires late-seeding
 */
export function isLateSeedColumn(table: string, column: string): boolean {
  return getLateSeedColumns(table).includes(column)
}

/**
 * Get tables that have late-seed columns
 */
export function getLateSeedTables(): string[] {
  return Object.keys(LATE_SEED_CONFIG)
}
```

### Files Created

- `server/database/backup/late-seed-config.ts`

### Validation

- [ ] All entity tables with FKs are covered
- [ ] Self-references correctly identified
- [ ] Detail tables excluded (handled differently)
- [ ] Status FKs NOT in list (pre-seeded)

### Notes

**Not Late-Seeded**:
- `status_id` - Status records seeded in datA_config before entity import
- `tag_id` - Tags seeded in datA_config
- Direct values (strings, numbers, dates)

**Late-Seeded**:
- Any `*_xmlid` column (entity references)
- Any `*_id` column referencing user, project, or lookup tables

---

## Task 3: Create Export Functions

### Goal
Implement functions to export entity and detail tables to JSON files, with automatic late-seed column detection and tarball creation.

### Export Flow

```
1. exportEntityTable(db, 'events')
   ↓
2. Read all records from table
   ↓
3. For each record:
   - Remove 'id' column (use xmlid instead)
   - Detect late-seed columns
   - Prefix late-seed columns with _late_
   - Keep other columns as-is
   ↓
4. Return EntityBackup object
   ↓
5. Write to /data/events/TIMESTAMP.json
```

### Implementation

Create file: `server/database/backup/export.ts`

```typescript
import type { DatabaseAdapter } from '../adapter'
import type { EntityBackup, BackupIndex } from '../../types/backup-schema'
import { getLateSeedColumns } from './late-seed-config'
import fs from 'fs'
import path from 'path'

/**
 * Export entity table to JSON
 * 
 * Exports records with xmlid as key, marks late-seed columns with _late_ prefix
 */
export async function exportEntityTable(
  db: DatabaseAdapter,
  table: string
): Promise<EntityBackup> {
  const lateSeedCols = getLateSeedColumns(table)
  
  console.log(`  Exporting ${table}...`)
  
  // Get all records
  const records = await db.all(`SELECT * FROM ${table}`, [])
  
  const exportRecords = records.map((record: any) => {
    const { id, ...rest } = record
    
    // Add master_id for reference
    const exported: any = {
      master_id: id,
      ...rest
    }
    
    // Mark late-seed columns with _late_ prefix
    for (const col of lateSeedCols) {
      if (exported[col] !== undefined && exported[col] !== null) {
        exported[`_late_${col}`] = exported[col]
        delete exported[col]
      }
    }
    
    return exported
  })
  
  console.log(`    ✓ Exported ${exportRecords.length} records`)
  
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
 * 
 * Exports records with parent xmlid reference instead of ID
 */
export async function exportDetailTable(
  db: DatabaseAdapter,
  table: string,
  parentTable: string,
  parentKey: string
): Promise<EntityBackup> {
  console.log(`  Exporting ${table} (detail table)...`)
  
  // Join with parent to get xmlid
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
  
  console.log(`    ✓ Exported ${exportRecords.length} records`)
  
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
  
  console.log(`\n📦 Exporting all tables to ${dataPath}`)
  console.log(`   Timestamp: ${timestamp}\n`)
  
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
  }
  
  // Write index
  const indexPath = path.join(dataPath, `${timestamp}.json`)
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
  
  console.log(`\n✓ Exported ${index.tables.length} tables, ${index.metadata.total_records} records`)
  console.log(`  Index: ${indexPath}`)
  
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
  
  console.log(`\n📦 Creating tarball...`)
  
  // Create directories
  fs.mkdirSync(exportDir, { recursive: true })
  fs.mkdirSync(syncDir, { recursive: true })
  
  // Copy files to temp with standard names
  for (const [table, filename] of Object.entries(index.files)) {
    const src = path.join(dataPath, table, filename)
    const dst = path.join(exportDir, `${table}.json`)
    fs.copyFileSync(src, dst)
    console.log(`  Copied ${table}.json`)
  }
  
  // Copy index as backup-index.json
  const indexSrc = path.join(dataPath, `${timestamp}.json`)
  const indexDst = path.join(exportDir, 'backup-index.json')
  fs.copyFileSync(indexSrc, indexDst)
  console.log(`  Copied backup-index.json`)
  
  // Create tarball
  const tarFile = path.join(syncDir, `${timestamp}.backup.tar.gz`)
  const { execSync } = require('child_process')
  
  try {
    execSync(`tar -czf "${tarFile}" -C "${exportDir}" .`, {
      stdio: 'inherit'
    })
  } catch (error) {
    console.error('  ✗ Tar creation failed:', error)
    throw error
  }
  
  // Clean up temp
  fs.rmSync(exportDir, { recursive: true })
  
  // Get file size
  const stats = fs.statSync(tarFile)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  
  console.log(`\n✓ Created backup: ${tarFile}`)
  console.log(`  Size: ${sizeMB} MB`)
  
  return tarFile
}
```

### Files Created

- `server/database/backup/export.ts`

### Directory Structure

After export:
```
data/
├── events/
│   └── 2025-11-09T10-30-00-000Z.json
├── posts/
│   └── 2025-11-09T10-30-00-000Z.json
├── pages/
│   └── 2025-11-09T10-30-00-000Z.json
├── 2025-11-09T10-30-00-000Z.json (index)
├── export/
│   └── temp/ (cleaned after tarball)
└── sync/
    └── 2025-11-09T10-30-00-000Z.backup.tar.gz
```

### Validation

Create test script: `server/database/backup/test-export.ts`

```typescript
import { exportAllTables, createBackupTarball } from './export'
import { db } from '../db-new'
import path from 'path'

async function testExport() {
  const dataPath = path.join(process.cwd(), 'data')
  
  console.log('🧪 Testing export system\n')
  
  try {
    // Export all tables
    const index = await exportAllTables(db, dataPath)
    
    console.log('\n✓ Export successful')
    console.log(`  Tables: ${index.tables.join(', ')}`)
    console.log(`  Total records: ${index.metadata.total_records}`)
    
    // Create tarball
    const tarFile = await createBackupTarball(dataPath, index)
    
    console.log('\n✅ Test passed')
    console.log(`  Backup: ${tarFile}`)
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

testExport()
```

Run test:
```bash
pnpm tsx server/database/backup/test-export.ts
```

---

## 🎯 Success Criteria

- [x] Backup schema types defined (`backup-schema.ts`)
- [x] Late-seed configuration complete (`late-seed-config.ts`)
- [x] Export functions implemented (`export.ts`)
- [x] Entity table export works (with late-seed detection)
- [x] Detail table export works (with parent xmlid)
- [x] Tarball creation works (tar.gz format)
- [x] Test script runs successfully
- [x] JSON files are valid and readable
- [x] Directory structure is clean

---

## 🔍 Testing Checklist

### Manual Testing

1. **Export entity table**:
   ```typescript
   const backup = await exportEntityTable(db, 'events')
   console.log(backup)
   ```
   - [ ] Returns EntityBackup object
   - [ ] Records have `master_id`
   - [ ] Records have `xmlid`
   - [ ] Late-seed columns prefixed with `_late_`
   - [ ] Non-late-seed columns unchanged

2. **Export detail table**:
   ```typescript
   const backup = await exportDetailTable(db, 'pages', 'projects', 'project_id')
   console.log(backup)
   ```
   - [ ] Returns EntityBackup object
   - [ ] Records have `_parent_xmlid`
   - [ ] Records don't have `id` or `project_id`

3. **Export all tables**:
   ```bash
   pnpm tsx server/database/backup/test-export.ts
   ```
   - [ ] Creates JSON files in `/data/{table}/`
   - [ ] Creates index file
   - [ ] Console shows progress
   - [ ] No errors

4. **Create tarball**:
   - [ ] Creates tar.gz in `/data/sync/`
   - [ ] File size is reasonable
   - [ ] Can extract: `tar -xzf backup.tar.gz`
   - [ ] Contains all JSON files + index

### JSON Validation

Extract and check JSON:
```bash
cd data/sync
tar -xzf *.backup.tar.gz -C /tmp/test-backup
cat /tmp/test-backup/backup-index.json | jq .
cat /tmp/test-backup/events.json | jq '.records[0]'
```

- [ ] Index has all expected fields
- [ ] Entity records have `_late_` prefixes
- [ ] Detail records have `_parent_xmlid`
- [ ] JSON is well-formatted

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MR1 Migration Packages](./MR1_MIGRATION_PACKAGES.md)
- [Next: MR3 Export API](./MR3_EXPORT_API.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for implementation
