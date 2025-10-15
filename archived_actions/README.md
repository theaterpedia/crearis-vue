# Archived Actions

This directory contains one-time migration scripts, old backups, and completed stage documentation that are no longer needed for day-to-day operations but are kept for historical reference.

## 📁 Contents

### One-Time Migration Scripts
- **`check-schema.ts`** - One-time schema validation script
- **`convert-db-calls.py`** - Python script to convert synchronous db calls to async (db.ts → db-new.ts migration)
- **`migrate-endpoints.sh`** - Bash script to update import statements during db.ts migration
- **`test_task_api.sh`** - One-time API endpoint test script

### Database Backups (Old)
- **`backup_postgres_before_drop_20251015_164840.sql`** - PostgreSQL backup before database drop
- **`demo-data.db.backup_before_drop_20251015_164823`** - SQLite backup before database drop
- **`demo-data.db.test_backup`** - SQLite test backup
- **`demo-data.db-shm`** - SQLite shared memory file (temporary)
- **`demo-data.db-wal`** - SQLite write-ahead log (temporary)

### Logs
- **`server.log`** - Old server log file

### Completed Stage Documentation
- **`STAGE-C-SUMMARY.md`** - Stage C (PostgreSQL Automated Setup) summary
- **`STAGE-D-PREPARATION-SUMMARY.md`** - Stage D preparation summary
- **`STAGE-D-SUMMARY.md`** - Stage D (Coverage & Validation) summary
- **`PROJECT_COMPLETION.txt`** - Project completion status (15KB)

---

## 🚫 Do Not Use

These files are archived and should not be used in current development:
- Migration scripts were one-time operations (already completed)
- Backups are outdated (fresh database setup via `pnpm dev` is preferred)
- Stage summaries are historical (see `/docs/` for current documentation)

---

## 📚 Current Documentation

For current project documentation, see:
- **`/docs/INDEX.md`** - Main documentation index
- **`/docs/postgresql/database-setup.md`** - Database setup guide
- **`/docs/DATABASE_MIGRATIONS.md`** - Migration system guide

---

**Archive Date:** October 15, 2025  
**Reason:** Project cleanup - moved one-time actions and historical files out of root
