# MR4: Import System & Data Packages

**Status**: 🔴 Not Started  
**Estimated Time**: 3-4 hours  
**Prerequisites**: [MR3: Export API & Admin UI](./MR3_EXPORT_API.md)  
**Next Step**: [MR5: Validation & Data Integrity](./MR5_VALIDATION.md)

---

## 🎯 Objective

Build the complete import system including bash orchestration script and data package implementations (datA through datG). This enables master-slave synchronization by importing exported JSON tarballs with late-seeding support.

---

## 📋 Tasks Overview

1. **Create Bash Import Manager** (60 min)
2. **Implement datA_config** (30 min)
3. **Implement datB_base** (45 min)
4. **Implement datC_parts & datD_entities** (30 min)
5. **Implement datF_assignments** (45 min)
6. **Implement datG_propagation** (30 min)

---

## Task 1: Create Bash Import Manager

### Goal
Create orchestration script that extracts tarball, runs data packages in sequence, and handles init/replace modes.

### Implementation

**File**: `scripts/data-sync.sh`

```bash
#!/bin/bash
# Data Sync Manager - Import tarball backups with late-seeding

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
BLUE='\033[0;34m'
NC='\033[0m'

# Print header
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Data Sync Manager${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# Parse arguments
MODE="${1:-replace}"
BACKUP_FILE="$2"

# Validate mode
if [[ ! "$MODE" =~ ^(init|replace|update|append)$ ]]; then
  echo -e "${RED}Invalid mode: $MODE${NC}"
  echo ""
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
  BACKUP_FILE=$(ls -t "$SYNC_DIR"/*.backup.tar.gz 2>/dev/null | head -1)
  
  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}No backup files found in $SYNC_DIR${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Found: $(basename "$BACKUP_FILE")${NC}"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

# Prompt for confirmation
echo ""
echo -e "${YELLOW}Backup file: $(basename "$BACKUP_FILE")${NC}"
echo -e "${YELLOW}Import mode: $MODE${NC}"
echo ""
read -p "Continue with import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Import cancelled${NC}"
  exit 0
fi

# Extract tarball
echo ""
echo -e "${BLUE}Extracting backup...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Verify index exists
INDEX_FILE="$TEMP_DIR/backup-index.json"
if [ ! -f "$INDEX_FILE" ]; then
  echo -e "${RED}Invalid backup: backup-index.json not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Backup extracted to $TEMP_DIR${NC}"

# Show backup info
TABLES=$(cat "$INDEX_FILE" | grep -o '"tables":\[[^]]*\]' | head -1)
RECORDS=$(cat "$INDEX_FILE" | grep -o '"total_records":[0-9]*' | head -1 | cut -d: -f2)
echo -e "${BLUE}  Tables: $TABLES${NC}"
echo -e "${BLUE}  Records: $RECORDS${NC}"

# Run data packages
echo ""
echo -e "${GREEN}Running data packages...${NC}"
echo ""

# datA_config: Config data + setup dummy records
echo -e "${BLUE}→ datA_config: Config data${NC}"
pnpm tsx server/database/data-packages/datA_config.ts --mode="$MODE"
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ datA_config failed${NC}"
  exit 1
fi

# datB_base: Base data (entities with xmlid)
echo -e "${BLUE}→ datB_base: Base data${NC}"
pnpm tsx server/database/data-packages/datB_base.ts --mode="$MODE" --import-dir="$TEMP_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ datB_base failed${NC}"
  exit 1
fi

# datC_parts: Data parts (optional, for future use)
if [ -f "$PROJECT_ROOT/server/database/data-packages/datC_parts.ts" ]; then
  echo -e "${BLUE}→ datC_parts: Data parts${NC}"
  pnpm tsx server/database/data-packages/datC_parts.ts --mode="$MODE" --import-dir="$TEMP_DIR"
fi

# datD_entities: Data entities (optional, for future use)
if [ -f "$PROJECT_ROOT/server/database/data-packages/datD_entities.ts" ]; then
  echo -e "${BLUE}→ datD_entities: Data entities${NC}"
  pnpm tsx server/database/data-packages/datD_entities.ts --mode="$MODE" --import-dir="$TEMP_DIR"
fi

# datF_assignments: Late seeding (init mode only)
if [ "$MODE" == "init" ]; then
  echo -e "${BLUE}→ datF_assignments: Late seeding${NC}"
  pnpm tsx server/database/data-packages/datF_assignments.ts --import-dir="$TEMP_DIR"
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ datF_assignments failed${NC}"
    exit 1
  fi
fi

# datG_propagation: Detail tables
echo -e "${BLUE}→ datG_propagation: Detail tables${NC}"
pnpm tsx server/database/data-packages/datG_propagation.ts --mode="$MODE" --import-dir="$TEMP_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ datG_propagation failed${NC}"
  exit 1
fi

# Clean up
echo ""
echo -e "${BLUE}Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Import Complete ✅${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
```

Make executable:
```bash
chmod +x scripts/data-sync.sh
```

---

## Task 2: Implement datA_config

### Goal
Seed system data (tags, status) and create setup dummy records for late-seeding.

**File**: `server/database/data-packages/datA_config.ts`

```typescript
/**
 * datA_config: Config Data + Setup Dummy Records
 * 
 * - Runs migration 021 (system data: tags, status, config)
 * - Creates dummy records with xmlid='setup' for late-seeding (init mode only)
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
      INSERT INTO ${table} (xmlid, name, status_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
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
  
  // Run migration 021 (tags, status, config)
  console.log('  Running migration 021 (system data)...')
  await migration021.up(db)
  console.log('    ✓ System data seeded')
  
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

---

## Task 3: Implement datB_base

### Goal
Import entity tables with late-seed column extraction.

**File**: `server/database/data-packages/datB_base.ts`

```typescript
/**
 * datB_base: Base Data Import
 * 
 * Imports entity tables (events, posts, etc) from JSON files
 * Handles late-seeding: extracts _late_ columns for datF_assignments
 */

import type { DatabaseAdapter } from '../adapter'
import type { EntityBackup } from '../../types/backup-schema'
import { db } from '../db-new'
import fs from 'fs'
import path from 'path'

interface LateSeedRecord {
  xmlid: string
  columns: string[]
  values: any[]
}

async function importTable(
  db: DatabaseAdapter,
  backup: EntityBackup,
  mode: 'init' | 'replace'
): Promise<LateSeedRecord[]> {
  console.log(`  Importing ${backup.table}: ${backup.record_count} records (mode: ${mode})`)
  
  const lateSeedCols = backup.late_seed_columns || []
  const setupRecords: LateSeedRecord[] = []
  
  for (const record of backup.records) {
    const { master_id, xmlid, ...data } = record
    
    // Separate late-seed and immediate data
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
    
    // Handle late-seed columns based on mode
    if (mode === 'init') {
      // Set late-seed columns to 'setup' or null
      for (const col of lateSeedCols) {
        if (col.endsWith('_xmlid')) {
          immediateData[col] = 'setup'
        } else if (col.endsWith('_id')) {
          immediateData[col] = null
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
  
  console.log(`    ✓ Imported ${backup.record_count} records`)
  
  return setupRecords
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
  
  const entityTables = ['events', 'posts', 'participants', 'instructors', 'locations']
  const allSetupRecords: Record<string, LateSeedRecord[]> = {}
  
  for (const table of entityTables) {
    const file = path.join(importDir, `${table}.json`)
    if (!fs.existsSync(file)) {
      console.log(`  ⚠️  Skipping ${table}: file not found`)
      continue
    }
    
    const backup: EntityBackup = JSON.parse(fs.readFileSync(file, 'utf-8'))
    const setupRecords = await importTable(db, backup, mode)
    
    if (setupRecords.length > 0) {
      allSetupRecords[table] = setupRecords
    }
  }
  
  // Store late-seed records for datF_assignments (init mode only)
  if (mode === 'init' && Object.keys(allSetupRecords).length > 0) {
    const lateDir = path.join(process.cwd(), 'data', 'late-seed')
    fs.mkdirSync(lateDir, { recursive: true })
    
    for (const [table, records] of Object.entries(allSetupRecords)) {
      fs.writeFileSync(
        path.join(lateDir, `${table}.json`),
        JSON.stringify(records, null, 2)
      )
      console.log(`  📝 Stored ${records.length} ${table} records for late seeding`)
    }
  }
  
  console.log('\n✅ datB_base complete')
}

main().catch(error => {
  console.error('❌ datB_base failed:', error)
  process.exit(1)
})
```

---

## Task 4: Implement datC_parts & datD_entities

### Goal
Placeholder implementations for future data package expansion.

**File**: `server/database/data-packages/datC_parts.ts`

```typescript
/**
 * datC_parts: Data Parts
 * 
 * Reserved for future use - additional entity data
 */

async function main() {
  console.log('\n📦 datC_parts: Data Parts')
  console.log('   ℹ️  Not yet implemented - reserved for future use')
}

main().catch(error => {
  console.error('❌ datC_parts failed:', error)
  process.exit(1)
})
```

**File**: `server/database/data-packages/datD_entities.ts`

```typescript
/**
 * datD_entities: Data Entities
 * 
 * Reserved for future use - full entity records with relationships
 */

async function main() {
  console.log('\n📦 datD_entities: Data Entities')
  console.log('   ℹ️  Not yet implemented - reserved for future use')
}

main().catch(error => {
  console.error('❌ datD_entities failed:', error)
  process.exit(1)
})
```

---

## Task 5: Implement datF_assignments

### Goal
Resolve late-seeded foreign keys after all entities imported (init mode only).

**File**: `server/database/data-packages/datF_assignments.ts`

```typescript
/**
 * datF_assignments: Late Seeding
 * 
 * Resolves foreign keys after init import
 * Updates records that were set to 'setup' with actual IDs/xmlids
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
  
  let resolved = 0
  
  for (const record of records) {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    for (let i = 0; i < record.columns.length; i++) {
      const column = record.columns[i]
      const value = record.values[i]
      
      if (column.endsWith('_xmlid')) {
        // Update xmlid reference
        updates.push(`${column} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      } else if (column.endsWith('_id') && value !== null) {
        // Update ID reference
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
      resolved++
    }
  }
  
  console.log(`    ✓ Resolved ${resolved} records`)
}

async function main() {
  const args = process.argv.slice(2)
  const importDir = args.find(a => a.startsWith('--import-dir='))?.split('=')[1]
  
  console.log('\n🔗 datF_assignments: Late Seeding')
  
  const lateDir = path.join(process.cwd(), 'data', 'late-seed')
  
  if (!fs.existsSync(lateDir)) {
    console.log('  ℹ️  No late-seed records found (replace mode or no late-seed columns)')
    return
  }
  
  const tables = ['events', 'posts', 'participants', 'instructors', 'locations']
  let totalResolved = 0
  
  for (const table of tables) {
    const file = path.join(lateDir, `${table}.json`)
    if (!fs.existsSync(file)) continue
    
    const records: LateSeedRecord[] = JSON.parse(fs.readFileSync(file, 'utf-8'))
    await resolveLateSeeding(db, table, records)
    totalResolved += records.length
  }
  
  // Clean up late-seed directory
  fs.rmSync(lateDir, { recursive: true })
  console.log(`  🗑️  Cleaned up late-seed directory`)
  
  console.log(`\n✅ datF_assignments complete (${totalResolved} records resolved)`)
}

main().catch(error => {
  console.error('❌ datF_assignments failed:', error)
  process.exit(1)
})
```

---

## Task 6: Implement datG_propagation

### Goal
Import detail tables (pages, project_members) that reference entities by parent xmlid.

**File**: `server/database/data-packages/datG_propagation.ts`

```typescript
/**
 * datG_propagation: Detail Tables
 * 
 * Imports detail tables that don't have xmlid
 * References parent records by xmlid
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
  
  let imported = 0
  let skipped = 0
  
  for (const record of backup.records) {
    const { _parent_xmlid, ...data } = record
    
    // Resolve parent xmlid to ID
    const parent = await db.get(
      `SELECT id FROM ${parentTable} WHERE xmlid = $1`,
      [_parent_xmlid]
    )
    
    if (!parent) {
      console.log(`    ⚠️  Parent not found: ${parentTable}.xmlid = ${_parent_xmlid}`)
      skipped++
      continue
    }
    
    // Build INSERT/UPDATE query
    const columns = Object.keys(data)
    const values = Object.values(data)
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    
    // For detail tables, we typically just INSERT (no unique constraint to conflict on)
    const query = `
      INSERT INTO ${backup.table} (${parentKey}, ${columns.join(', ')})
      VALUES ($${columns.length + 1}, ${placeholders})
    `
    
    await db.run(query, [...values, (parent as any).id])
    imported++
  }
  
  console.log(`    ✓ Imported ${imported} records (${skipped} skipped)`)
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
    { table: 'project_members', parent: 'projects', key: 'project_id' },
    { table: 'pages', parent: 'projects', key: 'project_id' },
  ]
  
  for (const { table, parent, key } of detailTables) {
    const filePath = path.join(importDir, `${table}.json`)
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

---

## 🎯 Success Criteria

- [ ] Bash script created and executable
- [ ] datA_config creates system data + setup dummies
- [ ] datB_base imports entity tables with late-seed extraction
- [ ] datC_parts & datD_entities placeholders created
- [ ] datF_assignments resolves late-seed columns
- [ ] datG_propagation imports detail tables
- [ ] Init mode workflow complete (setup → late-seed)
- [ ] Replace mode workflow complete (direct import)
- [ ] Error handling prevents partial imports
- [ ] Console output clear and informative

---

## 🔍 Testing

### Test Init Mode

```bash
# Create fresh database
pnpm db:drop
pnpm db:migrate

# Run import in init mode
bash scripts/data-sync.sh init

# Verify:
# - Setup dummy records created
# - Entity records imported with event_xmlid='setup'
# - Late-seed resolved after datF_assignments
# - Detail tables imported
```

### Test Replace Mode

```bash
# Use existing database with data
bash scripts/data-sync.sh replace

# Verify:
# - Records updated by xmlid
# - No setup dummies created
# - datF_assignments skipped
# - Existing data preserved
```

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MR3 Export API](./MR3_EXPORT_API.md)
- [Next: MR5 Validation](./MR5_VALIDATION.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for implementation
