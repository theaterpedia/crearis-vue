# File Organization - October 16, 2025

## Summary

Moved newly created files from root directory to appropriate organized locations.

---

## Files Moved to `archived_actions/`

**One-time migration scripts and SQL files:**

1. `003_entity_task_triggers.sql` - PostgreSQL trigger creation SQL (applied once)
2. `backfill_main_tasks.sql` - One-time backfill for existing entities (applied once)
3. `run-migration-003.ts` - Migration runner script (no longer needed - now in migrations array)

**Purpose:** These files were used during the manual fix for PostgreSQL main tasks. They've been applied and are now preserved in archives for reference.

---

## Files Moved to `docs/`

**Documentation files:**

1. `POSTGRESQL_MAIN_TASKS_FIX.md` - Complete walkthrough of PostgreSQL trigger fix
2. `SCHEMA_UPDATES_PERMANENT.md` - Documentation of making schema changes permanent
3. `DATA_RULES_VALIDATION.md` - Validation report for data integrity rules (already in docs)
4. `MAIN_TASK_AUTO_CREATION.md` - Explanation of entity-task trigger system (already in docs)

**Purpose:** These documents explain the main-task system, validation results, and how we fixed PostgreSQL triggers.

---

## Updated Documentation Index

Added references to new docs in `docs/INDEX.md`:

```markdown
### Database Setup & Operations
- [Data Rules Validation](./DATA_RULES_VALIDATION.md) - ✅ Validation report
- [Main Task Auto-Creation](./MAIN_TASK_AUTO_CREATION.md) - 📋 Entity-task relationships
- [PostgreSQL Main Tasks Fix](./POSTGRESQL_MAIN_TASKS_FIX.md) - 🔧 Trigger implementation
- [Schema Updates Permanent](./SCHEMA_UPDATES_PERMANENT.md) - 🛡️ Making changes permanent
```

---

## Current Root Directory

**Essential files only:**

```
CHANGELOG.md              - Project changelog
CLEANUP_SUMMARY.md        - Summary of repository cleanup
README.md                 - Project README
env.d.ts                  - Environment type definitions
nitro.config.ts          - Nitro server configuration
vite.config.ts           - Vite build configuration
vitest.config.ts         - Vitest test configuration
```

**Total:** 7 files (down from ~45+ before cleanup)

---

## File Locations Reference

| Category | Location | Files |
|----------|----------|-------|
| One-time scripts | `archived_actions/` | SQL scripts, migration runners, backups |
| Documentation | `docs/` | All .md documentation files |
| Active migrations | `server/database/migrations/` | TypeScript migration files (000-003) |
| Configuration | Root | Config files (.ts, .json) |
| Source code | `src/`, `server/` | Application code |

---

## Related Files

### Active Migration Files (Still in Use)
- `server/database/migrations/000_base_schema.ts` - Base schema with updated constraints
- `server/database/migrations/001_init_schema.ts` - Config table
- `server/database/migrations/002_align_schema.ts` - Schema alignment
- `server/database/migrations/003_entity_task_triggers.ts` - Entity-task triggers
- `server/database/migrations/index.ts` - Migration runner (includes all 4 migrations)

### Documentation Index
- `docs/INDEX.md` - Complete documentation index with all references

---

## Why This Organization?

### `archived_actions/`
- One-time operations that have been completed
- SQL scripts that were manually applied
- Backup files and logs
- Migration runners that are no longer needed

### `docs/`
- All documentation (guides, explanations, reports)
- Organized by topic/stage
- Easy to browse and search
- Linked from INDEX.md

### Root
- Only essential configuration files
- Files needed by build tools
- Project metadata (README, CHANGELOG)

---

## Next Steps

When adding new files:

1. **One-time scripts** → `archived_actions/`
2. **Documentation** → `docs/` (and update `docs/INDEX.md`)
3. **Migrations** → `server/database/migrations/` (and update `index.ts`)
4. **Tests** → `tests/`
5. **Source code** → `src/` or `server/`

Keep root directory clean with only essential config files!
