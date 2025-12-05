# MR1: Migration Package System

**Status**: 🔴 Not Started  
**Estimated Time**: 2-3 hours  
**Prerequisites**: None  
**Next Step**: [MR2: Export System](./MR2_EXPORT_SYSTEM.md)

---

## 🎯 Objective

Implement a package-based migration system that allows selective execution of migration ranges (A-E) based on environment variables. This enables controlled schema updates and provides foundation for master-slave synchronization.

---

## 📋 Tasks Overview

1. **Archive Old Data Migrations** (30 min)
2. **Implement Package System** (60 min)
3. **Test Package Filtering** (30-60 min)

---

## Task 1: Archive Old Data Migrations

### Goal
Move migrations 022-024 (data seeding) to archived location since they will be replaced by data packages (datA-datH).

### Steps

1. **Create archive directory**:
   ```bash
   mkdir -p server/database/migrations/archived_data_seeds
   ```

2. **Move migrations**:
   ```bash
   mv server/database/migrations/022_seed_csv_data.ts server/database/migrations/archived_data_seeds/
   mv server/database/migrations/023_seed_demo_data.ts server/database/migrations/archived_data_seeds/
   mv server/database/migrations/024_add_project_images.ts server/database/migrations/archived_data_seeds/
   ```

3. **Update migration index**:
   - File: `server/database/migrations/index.ts`
   - Remove exports for migrations 022-024
   - Keep exports for 000-020 only

4. **Add package.json script**:
   ```json
   {
     "scripts": {
       "db:mig:archived": "tsx server/database/migrations/run-archived.ts"
     }
   }
   ```

5. **Create run-archived script** (optional):
   - File: `server/database/migrations/run-archived.ts`
   - Import and run archived migrations manually

### Validation

```bash
# Test that migrations 000-020 still work
pnpm db:migrate

# Check that 022-024 are not in index
grep -E "(022|023|024)" server/database/migrations/index.ts
# Should return nothing
```

### Files Modified

- `server/database/migrations/index.ts`
- `package.json`

### Files Created

- `server/database/migrations/archived_data_seeds/` (directory)
- `server/database/migrations/run-archived.ts` (optional)

---

## Task 2: Implement Package System

### Goal
Create package filtering system that allows running migration ranges based on environment variables.

### Package Ranges

| Package | Range | Purpose |
|---------|-------|---------|
| A | 000-018 | Base schema setup |
| B | 019-020 | Core schema (tags, status, xmlid) |
| C | 022-029 | Alpha features (reserved) |
| D | 030-039 | Beta features (reserved) |
| E | 040-999 | Production features (reserved) |

### Steps

1. **Create packages.ts**:

   File: `server/database/migrations/packages.ts`

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
     const start = (startPackage?.toUpperCase() as MigrationPackage) || 'A'
     const end = (endPackage?.toUpperCase() as MigrationPackage) || 'E'
     
     if (!PACKAGE_RANGES[start] || !PACKAGE_RANGES[end]) {
       return null
     }
     
     return {
       start: PACKAGE_RANGES[start].start,
       end: PACKAGE_RANGES[end].end
     }
   }
   
   export function filterMigrationsByPackage(
     migrations: Array<{ id: number; name: string }>,
     startPackage?: string,
     endPackage?: string
   ): Array<{ id: number; name: string }> {
     const range = getMigrationPackageRange(startPackage, endPackage)
     
     if (!range) {
       return migrations
     }
     
     return migrations.filter(m => m.id >= range.start && m.id <= range.end)
   }
   ```

2. **Update migration runner**:

   File: `server/database/migrations/run.ts`

   Add at top of file:
   ```typescript
   import { getMigrationPackageRange, filterMigrationsByPackage } from './packages'
   ```

   Add after imports:
   ```typescript
   // Read environment variables
   const startPackage = process.env.DB_MIGRATION_STARTWITH
   const endPackage = process.env.DB_MIGRATION_ENDWITH
   
   if (startPackage || endPackage) {
     const range = getMigrationPackageRange(startPackage, endPackage)
     if (range) {
       console.log(`\n🎯 Running migrations package ${startPackage || 'A'} to ${endPackage || 'E'}`)
       console.log(`   Range: ${range.start.toString().padStart(3, '0')} - ${range.end.toString().padStart(3, '0')}\n`)
     } else {
       console.error(`❌ Invalid package range: ${startPackage}-${endPackage}`)
       process.exit(1)
     }
   }
   ```

   Find where migrations are loaded and add filtering:
   ```typescript
   // Before running migrations
   let migrationsToRun = allMigrations
   
   if (startPackage || endPackage) {
     migrationsToRun = filterMigrationsByPackage(allMigrations, startPackage, endPackage)
     console.log(`   Filtered ${allMigrations.length} → ${migrationsToRun.length} migrations\n`)
   }
   ```

3. **Update migration index**:

   File: `server/database/migrations/index.ts`

   Add metadata to each migration:
   ```typescript
   export const migrations = [
     { id: 0, name: '000_initial_schema', migration: import('./000_initial_schema') },
     // ... etc
     { id: 18, name: '018_final_setup', migration: import('./018_final_setup') },
     { id: 19, name: '019_add_tags_status_ids', migration: import('./019_add_tags_status_ids') },
     { id: 20, name: '020_refactor_entities_i18n', migration: import('./020_refactor_entities_i18n') },
     // 022-024 removed (archived)
   ]
   ```

### Files Created

- `server/database/migrations/packages.ts`

### Files Modified

- `server/database/migrations/run.ts`
- `server/database/migrations/index.ts`

---

## Task 3: Test Package Filtering

### Goal
Verify package system works correctly with different environment variable combinations.

### Test Scenarios

1. **Default (all migrations)**:
   ```bash
   pnpm db:migrate
   ```
   Expected: Runs migrations 000-020

2. **Package A only**:
   ```bash
   DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=A pnpm db:migrate
   ```
   Expected: Runs migrations 000-018 only

3. **Packages A+B**:
   ```bash
   DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=B pnpm db:migrate
   ```
   Expected: Runs migrations 000-020

4. **Invalid package**:
   ```bash
   DB_MIGRATION_STARTWITH=Z pnpm db:migrate
   ```
   Expected: Error message, exit 1

5. **Package B only**:
   ```bash
   DB_MIGRATION_STARTWITH=B DB_MIGRATION_ENDWITH=B pnpm db:migrate
   ```
   Expected: Runs migrations 019-020 only

### Validation Checklist

- [ ] Default mode runs all available migrations (000-020)
- [ ] Package A runs only setup migrations (000-018)
- [ ] Package B runs only core schema (019-020)
- [ ] Package A+B runs complete schema (000-020)
- [ ] Invalid package shows error and exits
- [ ] `crearis_config.migrations_run` array correctly tracks executed migrations
- [ ] Console output shows package filtering information
- [ ] No migrations 022-024 in index or execution

### Database Verification

After each test run:
```sql
SELECT * FROM crearis_config LIMIT 1;
-- Check migrations_run array contains expected migration IDs

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Verify expected tables exist
```

### Rollback Testing

Test that package filtering works with rollback:
```bash
# Rollback to before package B
DB_MIGRATION_STARTWITH=A DB_MIGRATION_ENDWITH=B pnpm db:rollback

# Verify migrations 019-020 are removed from migrations_run
```

---

## 🎯 Success Criteria

- [x] Migrations 022-024 moved to archived_data_seeds/
- [x] Package system (packages.ts) created and functional
- [x] Migration runner updated with environment variable support
- [x] Migration index updated (exports 000-020 only)
- [x] All test scenarios pass
- [x] Database verification confirms correct migration tracking
- [x] Console output clearly shows package filtering

---

## 🔄 Rollback Plan

If package system causes issues:

1. **Restore archived migrations**:
   ```bash
   mv server/database/migrations/archived_data_seeds/* server/database/migrations/
   ```

2. **Revert migration index**:
   - Re-add exports for 022-024

3. **Remove package filtering**:
   - Revert changes to `run.ts`
   - Delete `packages.ts`

---

## 📝 Notes

- Gap at 021: Intentionally kept (system data migration, manual-only)
- Gap at 022-024: Archived (replaced by data packages)
- Package C starts at 022: Reserved for alpha features
- Future migrations should follow package ranges

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Next: MR2 Export System](./MR2_EXPORT_SYSTEM.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for implementation
