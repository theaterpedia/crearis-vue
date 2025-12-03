# Schema Migration & Centralization Plan

## Current State Analysis

### Problems Identified
1. **Distributed Schema Creation**: Schema is created inline in `db-new.ts` (lines 40-336)
2. **No Migration System**: Schema changes happen via `CREATE TABLE IF NOT EXISTS` on every startup
3. **Mixed Concerns**: Connection logic and schema creation are tightly coupled in db-new.ts
4. **No Version Tracking**: No way to track which schema version is currently deployed
5. **No Migration History**: Can't track what changes were made and when
6. **Schema Validation Mismatches**: Current schema doesn't match the v0.0.1 definition file

### Current Schema Components (in db-new.ts)
- 12 tables: events, posts, locations, instructors, participants, hero_overrides, users, tasks, versions, record_versions, projects, releases
- 6 indexes: task status, task record lookup, task version, task category, versions active, record versions lookup
- 6 SQLite triggers OR 1 PostgreSQL function + 6 triggers for updated_at timestamps
- Type helpers for cross-database compatibility (TEXT, INTEGER, TIMESTAMP, CHECK_STATUS)

### New Components Already Created
- `server/database/migrations/001_init_schema.ts` - Started (only has crearis_config)
- `server/database/update-version.ts` - Version update script (needs crearis_config table)
- `server/database/check-structure.ts` - Schema validation tool
- `server/database/schema-definitions/v0.0.1.json` - Schema definition file

---

## Migration Plan (4 Steps)

### **SCHEM-A: Create Centralized Base Schema Migration**
**Goal**: Move all table creation logic from db-new.ts to a centralized migration file

**Tasks**:
1. Create `server/database/migrations/000_base_schema.ts` with:
   - All 12 table creation functions (extracted from db-new.ts initDatabase())
   - Index creation function
   - Trigger creation function (both SQLite and PostgreSQL variants)
   - Type helper utilities (TEXT, INTEGER, TIMESTAMP, CHECK_STATUS)
   - Main `runBaseSchemaMigration()` function that orchestrates everything

2. Create `server/database/migrations/001_config_table.ts`:
   - Extract crearis_config table creation
   - Initialize with current version (0.0.1)
   - Separate from base schema for cleaner separation

3. Create `server/database/migrations/index.ts`:
   - Migration runner that tracks which migrations have run
   - Uses crearis_config table to store: `{version: "0.0.1", migrations_run: ["000_base_schema", "001_config_table"]}`
   - Idempotent: only runs migrations that haven't been run yet

**Output Files**:
- `server/database/migrations/000_base_schema.ts` (~300 lines)
- `server/database/migrations/001_config_table.ts` (~50 lines)
- `server/database/migrations/index.ts` (~100 lines)

**Success Criteria**:
- All schema creation logic is in migration files
- db-new.ts is unchanged (still works as before)
- New migration system is ready but not yet integrated

---

### **SCHEM-B: Decouple db-new.ts and Integrate Migration System**
**Goal**: Remove schema creation from db-new.ts and use the migration system instead

**Tasks**:
1. Modify `server/database/db-new.ts`:
   - Remove entire `initDatabase()` function (lines 40-336)
   - Remove the auto-execution `await initDatabase()` (line 338)
   - Keep only: connection setup, db adapter export
   - Should be ~40 lines total (down from 341)

2. Create `server/database/init.ts`:
   - New initialization module that:
     - Imports db from db-new.ts
     - Imports migration runner from migrations/index.ts
     - Runs migrations on first connection
     - Exports initialized db

3. Update all imports in the codebase:
   - Change `import { db } from './db-new.js'` → `import { db } from './init.js'`
   - Use search & replace across:
     - `server/api/**/*.ts` (all API endpoints)
     - `server/database/*.ts` (all database scripts)
     - Test files

4. Add npm script for manual migration:
   - `"db:migrate": "tsx server/database/migrations/run.ts"`
   - Creates standalone migration runner for manual execution

**Output Files**:
- Modified: `server/database/db-new.ts` (reduced to ~40 lines)
- New: `server/database/init.ts` (~30 lines)
- New: `server/database/migrations/run.ts` (~50 lines)
- Modified: 50+ files changing imports

**Success Criteria**:
- db-new.ts only handles connection
- Schema creation happens via migration system
- All tests pass
- Dev server starts correctly
- Both PostgreSQL and SQLite work

---

### **SCHEM-C: Fix Schema Validation Mismatches**
**Goal**: Align actual database schema with v0.0.1 schema definition

**Tasks**:
1. Run structure validation to identify mismatches:
   ```bash
   pnpm db:check-structure
   ```

2. Create `server/database/migrations/002_align_schema.ts`:
   - Add missing columns identified by validation:
     - events.isBase (if needed)
     - tasks.release_id
     - tasks.image
     - tasks.prompt
   - Use ALTER TABLE statements (both PostgreSQL and SQLite syntax)

3. Update `server/database/schema-definitions/v0.0.1.json`:
   - Regenerate from actual schema using generate-schema-definition.ts
   - Or manually fix mismatches to reflect intended schema

4. Re-run validation:
   ```bash
   pnpm db:check-structure
   ```
   - Should show ✅ PASSED for both databases

**Output Files**:
- New: `server/database/migrations/002_align_schema.ts` (~100 lines)
- Modified: `server/database/schema-definitions/v0.0.1.json`

**Success Criteria**:
- `pnpm db:check-structure` passes for both databases
- All columns match schema definition
- No breaking changes to existing data
- All tests pass

---

### **SCHEM-D: Integrate Version Management with Migration System**
**Goal**: Connect version updates to migration system and enable automated schema updates

**Tasks**:
1. Enhance `server/database/update-version.ts`:
   - Before version update, run schema validation
   - Prompt: "Current schema validation: [PASS/FAIL]. Continue? (y/n)"
   - If schema validation fails, suggest running migrations first
   - After version update, update crearis_config.migrations_run to include new version

2. Create `server/database/migrations/003_example.ts`:
   - Template migration file showing best practices
   - Demonstrates:
     - Adding a new table
     - Adding columns to existing table
     - Creating indexes
     - Both PostgreSQL and SQLite syntax
     - Rollback notes (we'll use forward-only migrations)

3. Update `package.json` scripts:
   - Add: `"version:bump": "tsx server/database/update-version.ts"`
   - Add: `"version:check": "tsx server/database/check-structure.ts"`
   - Modify: `"db:migrate"` to show migration status

4. Update CHANGELOG.md template:
   - Add section for database migrations run
   - Format: `### Database Migrations: 000_base_schema, 001_config_table, 002_align_schema`

5. Create documentation:
   - `docs/DATABASE_MIGRATIONS.md` - How to create and run migrations
   - Include:
     - Migration naming convention
     - How to write cross-database migrations
     - How to test migrations
     - How version updates interact with migrations
     - Rollback strategy (manual for now)

**Output Files**:
- Modified: `server/database/update-version.ts` (~100 lines, added validation)
- New: `server/database/migrations/003_example.ts` (~150 lines)
- Modified: `package.json` (updated scripts)
- New: `docs/DATABASE_MIGRATIONS.md` (~200 lines)

**Success Criteria**:
- Version updates validate schema first
- Migration history is tracked in crearis_config
- Clear documentation for future developers
- Example migration file serves as template
- npm scripts provide clear workflow

---

## Migration Workflow After Completion

### For Developers
```bash
# 1. Check current schema status
pnpm version:check

# 2. Run pending migrations (if any)
pnpm db:migrate

# 3. Make code changes...

# 4. If schema changes needed, create migration:
# - Create server/database/migrations/004_my_change.ts
# - Follow template from 003_example.ts
# - Test locally

# 5. Update version and changelog
pnpm version:bump
# Script will:
# - Validate schema
# - Prompt for new version
# - Prompt for changelog entry
# - Update package.json
# - Update crearis_config in both databases
# - Append to CHANGELOG.md
```

### Migration File Structure
```typescript
// server/database/migrations/004_add_tags_table.ts
export async function up(db: any, dbType: string) {
  // Migration logic here
  if (dbType === 'postgresql') {
    // PostgreSQL syntax
  } else {
    // SQLite syntax
  }
}

export const metadata = {
  id: '004_add_tags_table',
  description: 'Add tags table for content categorization',
  version: '0.0.2',
  date: '2025-10-15'
}
```

---

## Benefits of This Approach

1. **Separation of Concerns**: Connection logic separate from schema management
2. **Version Control**: Every schema change is tracked and versioned
3. **Reproducibility**: Any developer can recreate schema from migrations
4. **Validation**: Schema validation ensures consistency across environments
5. **Auditable**: Clear history of what changed and when
6. **Cross-Database**: Single migration system works for both PostgreSQL and SQLite
7. **Idempotent**: Migrations only run once, tracked in crearis_config
8. **Developer Friendly**: Clear workflow and examples

---

## Risk Mitigation

### SCHEM-A Risks
- **Risk**: Breaking existing functionality
- **Mitigation**: Don't modify db-new.ts yet, only extract to new files
- **Rollback**: Delete migration files, no changes to existing code

### SCHEM-B Risks
- **Risk**: Breaking 50+ imports across codebase
- **Mitigation**: Use search & replace, run full test suite
- **Rollback**: Revert db-new.ts changes, restore imports

### SCHEM-C Risks
- **Risk**: ALTER TABLE might fail on existing data
- **Mitigation**: Test migrations on copy of production data first
- **Rollback**: Database backup before running migrations

### SCHEM-D Risks
- **Risk**: Version update process becomes too complex
- **Mitigation**: Keep automation optional, allow manual override
- **Rollback**: Revert update-version.ts changes

---

## Testing Strategy

Each step should include:
1. **Unit Tests**: Test migration functions individually
2. **Integration Tests**: Test full migration flow
3. **Cross-Database Tests**: Verify both PostgreSQL and SQLite
4. **Rollback Tests**: Verify we can restore from backup
5. **Schema Validation**: Run check-structure.ts after each step

---

## Timeline Estimate

- **SCHEM-A**: 2-3 hours (extraction and organization)
- **SCHEM-B**: 3-4 hours (refactoring and testing)
- **SCHEM-C**: 1-2 hours (fixing mismatches)
- **SCHEM-D**: 2-3 hours (integration and documentation)

**Total**: 8-12 hours for complete implementation

---

## Next Steps

1. Review this plan
2. Confirm approach
3. Execute SCHEM-A
4. Test and validate
5. Proceed to SCHEM-B
6. Continue through SCHEM-D

Ready to proceed with SCHEM-A when approved.
