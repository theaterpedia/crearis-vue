# Migration Rollback System Guide

## ⚠️ IMPORTANT: Use pnpm, NOT npm!

**This project uses pnpm for package management.**

```bash
✅ CORRECT:   pnpm db:migrate
✅ CORRECT:   pnpm db:rollback --force
❌ WRONG:     npm run db:migrate
❌ WRONG:     npm run db:rollback
```

**For code automation tools:**
- Always use `pnpm` commands
- Never use `npm run` commands
- Check package manager: `cat package.json | grep packageManager`

---

## Overview

The migration system now supports **reversible migrations** with rollback functionality. This allows safe experimentation during development while maintaining data integrity in production.

**Key Features:**
- Roll back the last N migrations
- Roll back to a specific migration ID
- Skip non-reversible migrations automatically
- Safety checks require `--force` flag
- Status display before/after operations

---

## Quick Reference

### Check Current Status
```bash
pnpm db:migrate:status
```

### Run Migrations
```bash
pnpm db:migrate
```

### Rollback Commands
```bash
# Dry-run (shows what would happen, requires --force)
pnpm db:rollback

# Rollback last migration
pnpm db:rollback --force

# Rollback last 3 migrations
pnpm db:rollback 3 --force

# Rollback to specific migration
pnpm db:rollback --to=020 --force
pnpm db:rollback --to=migration-020 --force
```

---

## Migration Packages

**Package A (000-018):** Base schema (projects, entities, interactions, etc.)
**Package B (019-020):** Core schema (relationships, triggers)
**Package C (022-029):** Alpha features - **REVERSIBLE** ✓
**Package D (030-039):** Beta features - planned
**Package E (040+):** Final features - planned

---

## Creating Reversible Migrations

### 1. Use the Template

Copy the template to create a new migration:
```bash
cp server/database/migrations/022_template.ts \
   server/database/migrations/022_your_feature.ts
```

### 2. Implement up() Function

The `up()` function applies the migration (forward):

```typescript
async up(db: DatabaseAdapter): Promise<void> {
    console.log('Running migration 022_your_feature')
    
    // Add a column
    await db.run(`
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS your_column TEXT DEFAULT ''
    `)
    
    // Create an index
    if (db.type === 'postgresql') {
        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_projects_your_column 
            ON projects(your_column)
        `)
    }
    
    // Insert system data
    await db.run(`
        INSERT INTO status (id, code, label) 
        VALUES (99, 'new_status', 'New Status')
        ON CONFLICT (id) DO NOTHING
    `)
    
    console.log('✓ Migration 022_your_feature completed')
}
```

**Guidelines for up():**
- Use `IF NOT EXISTS` to make migrations idempotent
- Use `ON CONFLICT DO NOTHING` for data inserts
- Log progress with console.log
- Wrap in try/catch to handle errors
- Never drop existing tables/columns
- Never delete user data

### 3. Implement down() Function

The `down()` function reverses the migration (backward):

```typescript
async down(db: DatabaseAdapter): Promise<void> {
    console.log('Rolling back migration 022_your_feature')
    
    // Remove system data (safe because it's not user data)
    await db.run(`
        DELETE FROM status 
        WHERE id = 99 AND code = 'new_status'
    `)
    
    // Drop index
    if (db.type === 'postgresql') {
        await db.run(`
            DROP INDEX IF EXISTS idx_projects_your_column
        `)
    }
    
    // Drop column (WARNING: DATA LOSS!)
    await db.run(`
        ALTER TABLE projects 
        DROP COLUMN IF EXISTS your_column
    `)
    
    console.log('✓ Migration 022_your_feature rolled back')
}
```

**Guidelines for down():**
- Use `IF EXISTS` to avoid errors
- Reverse operations in opposite order from up()
- Document data loss operations
- Only delete system/seed data, never user data
- Test thoroughly before deploying to production

### 4. Register Migration

Add to `/server/database/migrations/index.ts`:

```typescript
import { migration as migration022 } from './022_your_feature'

const migrations: Migration[] = [
    // ... existing migrations ...
    { 
        run: migration022.up, 
        down: migration022.down, 
        metadata: {
            id: '022_your_feature',
            description: 'Add your feature',
            version: 'C.1',
            date: '2025-01-15'
        },
        reversible: true  // Mark as reversible
    },
]
```

---

## Testing Migrations

### Test Workflow

```bash
# 1. Check current status
pnpm db:migrate:status

# 2. Run the migration
pnpm db:migrate

# 3. Verify changes in database
psql -U crearis_admin -d crearis_admin_dev -c "\d projects"
psql -U crearis_admin -d crearis_admin_dev -c "SELECT * FROM status WHERE id = 99"

# 4. Test with real data
# - Insert test records
# - Verify they work with new schema

# 5. Test rollback (dry-run first)
pnpm db:rollback

# 6. Execute rollback
pnpm db:rollback --force

# 7. Verify rollback worked
psql -U crearis_admin -d crearis_admin_dev -c "\d projects"
psql -U crearis_admin -d crearis_admin_dev -c "SELECT * FROM status WHERE id = 99"

# 8. Re-run migration to confirm idempotency
pnpm db:migrate
```

### Testing Checklist

- [ ] Migration runs without errors
- [ ] Database schema changes applied correctly
- [ ] Indexes created as expected
- [ ] System data inserted properly
- [ ] Rollback executes without errors
- [ ] All changes reversed correctly
- [ ] Re-running migration works (idempotent)
- [ ] No data loss for user records

---

## Rollback System Architecture

### How It Works

1. **Tracking:** Migrations are tracked in `crearis_config.config.migrations_run` (JSONB array)
2. **Order:** Rollbacks execute in reverse order (newest first)
3. **Validation:** Checks for `down()` function before attempting rollback
4. **Safety:** Skips non-reversible migrations with warnings
5. **Atomicity:** Updates tracking array after successful rollback

### Rollback Functions

**rollbackMigrations(db, count, verbose)**
- Rolls back last N migrations
- Returns: `{ rolledBack: number, skipped: number }`

**rollbackToMigration(db, targetId, verbose)**
- Rolls back to specific migration ID
- Example: Roll back to migration-020 (removes 021, 022, etc.)

**unmarkMigrationRun(db, migrationId)**
- Removes migration from tracking array
- Called internally by rollback functions

### CLI Tool

Located at: `/server/database/migrations/rollback.ts`

**Usage:**
```bash
pnpm db:rollback [count|--to=XXX] [--force]
```

**Examples:**
```bash
# Show status and usage (no changes)
pnpm db:rollback

# Rollback last migration
pnpm db:rollback --force

# Rollback last 3 migrations
pnpm db:rollback 3 --force

# Rollback to migration 020 (removes 021, 022, etc.)
pnpm db:rollback --to=020 --force
pnpm db:rollback --to=migration-020 --force
```

**Safety Features:**
- Requires `--force` flag to execute
- Shows current status before operation
- Displays what will be rolled back
- Reports results after operation
- Exits gracefully if no changes needed

---

## Non-Reversible Operations

Some operations cannot be perfectly reversed:

### 1. Dropping Columns - DATA LOSS

**Problem:** Dropping a column permanently deletes all data in that column.

**Solution:**
- Document which columns will lose data
- Back up data before rollback if needed
- Consider soft-delete (mark as deprecated instead of dropping)

**Example:**
```typescript
// NON-REVERSIBLE: Will lose all data in description column
await db.run(`ALTER TABLE projects DROP COLUMN description`)
```

### 2. Changing Column Types - POTENTIAL DATA LOSS

**Problem:** Type changes may truncate or transform data irreversibly.

**Solution:**
- Test with production-like data
- Document transformation behavior
- Consider multi-step migrations (add new, migrate, remove old)

**Example:**
```typescript
// POTENTIAL DATA LOSS: TEXT → VARCHAR(50) truncates long strings
await db.run(`ALTER TABLE projects ALTER COLUMN name TYPE VARCHAR(50)`)
```

### 3. Deleting Records - DATA LOSS

**Problem:** DELETE statements cannot be reversed without backups.

**Solution:**
- Only delete system/seed data (known IDs)
- Never delete user-generated data
- Use WHERE clauses to target specific records

**Example:**
```typescript
// SAFE: Deleting system data with known ID
await db.run(`DELETE FROM status WHERE id = 99`)

// DANGEROUS: Deleting user data
await db.run(`DELETE FROM projects WHERE created_at < '2024-01-01'`)
```

### 4. Renaming Columns/Tables - BREAKS CODE

**Problem:** Renaming breaks existing code references.

**Solution:**
- Update all code references first
- Use multi-step migrations:
  1. Add new column/table
  2. Migrate data
  3. Update code references
  4. Remove old column/table

**Example:**
```typescript
// BREAKS CODE: Existing queries still use old_name
await db.run(`ALTER TABLE projects RENAME COLUMN old_name TO new_name`)
```

### Best Practices

1. **Document Non-Reversible Operations:**
   ```typescript
   // WARNING: Dropping this column will lose all description data!
   // Back up before rollback if data recovery needed.
   await db.run(`ALTER TABLE projects DROP COLUMN description`)
   ```

2. **Test with Production-Like Data:**
   - Import production data to dev box
   - Test rollback with real records
   - Verify no unexpected data loss

3. **Consider Alternatives:**
   - Soft-delete: Mark as deprecated instead of dropping
   - Multi-step: Break complex changes into smaller migrations
   - Backup: Export data before non-reversible operations

---

## Production Deployment

### Workflow

1. **Develop on Dev Box:**
   ```bash
   # Create migration
   cp server/database/migrations/022_template.ts \
      server/database/migrations/022_new_feature.ts
   
   # Edit migration (implement up/down)
   
   # Register in index.ts
   
   # Test forward
   pnpm db:migrate
   
   # Test rollback
   pnpm db:rollback --force
   
   # Re-run forward
   pnpm db:migrate
   ```

2. **Commit to Repository:**
   ```bash
   git add server/database/migrations/022_new_feature.ts
   git add server/database/migrations/index.ts
   git commit -m "Add migration 022: New feature"
   git push
   ```

3. **Deploy to Production:**
   ```bash
   # On production server
   git pull
   
   # Backup database first!
   pg_dump -U crearis_admin crearis_admin_prod > backup_before_022.sql
   
   # Run migration
   NODE_ENV=production pnpm db:migrate
   
   # Verify changes
   psql -U crearis_admin -d crearis_admin_prod -c "\d projects"
   ```

4. **Rollback if Needed:**
   ```bash
   # On production server
   NODE_ENV=production pnpm db:rollback --force
   
   # Verify rollback
   psql -U crearis_admin -d crearis_admin_prod -c "\d projects"
   ```

### Production Safety

**Environment Protection:**
- Production database operations require `NODE_ENV=production`
- Dangerous scripts blocked (db:rebuild, drop-db-quick.sh)
- See: `docs/DATABASE_SAFETY_PRODUCTION.md`

**Pre-Deployment Checklist:**
- [ ] Migration tested on dev box
- [ ] Rollback tested on dev box
- [ ] Code changes committed
- [ ] Database backed up
- [ ] Migration documented
- [ ] Team notified of deployment

**Post-Deployment Verification:**
- [ ] Migration completed without errors
- [ ] Database schema correct
- [ ] Application works as expected
- [ ] No data loss
- [ ] Rollback plan ready if needed

---

## Troubleshooting

### Migration Won't Roll Back

**Symptom:** `Migration has no down() function`

**Cause:** Migration missing `down()` function or not marked `reversible: true`

**Solution:**
```typescript
// Add down() function to migration
export const migration = {
    id: '022_example',
    description: 'Example',
    async up(db) { /* ... */ },
    async down(db) { /* Add this function */ }
}

// Mark as reversible in index.ts
{ 
    run: migration022.up, 
    down: migration022.down,  // Add this
    metadata: {...},
    reversible: true  // Add this
}
```

### Rollback Fails Halfway

**Symptom:** Some migrations rolled back, others failed

**Cause:** Error in down() function, non-idempotent operations

**Solution:**
1. Check error message for specific migration
2. Fix down() function
3. Use `IF EXISTS` for idempotency
4. Test rollback again

### Can't Roll Back to Target

**Symptom:** `Migration XXX has not been run yet`

**Cause:** Target migration not in tracking array

**Solution:**
```bash
# Check current status
pnpm db:migrate:status

# Verify migration IDs
psql -d your_database -c \
  "SELECT config->'migrations_run' FROM crearis_config WHERE id = 1"
```

### Data Lost After Rollback

**Symptom:** User data missing after rollback

**Cause:** down() function deleted user records

**Solution:**
1. **Restore from backup immediately:**
   ```bash
   psql -U crearis_admin -d your_database < backup.sql
   ```

2. **Fix down() function:**
   ```typescript
   // BAD: Deletes user data
   await db.run(`DELETE FROM projects WHERE type = 'new_type'`)
   
   // GOOD: Only deletes system data
   await db.run(`DELETE FROM status WHERE id = 99`)
   ```

3. **Prevent future issues:**
   - Never delete user records in down()
   - Only delete system/seed data with known IDs
   - Test with production-like data
   - Document data loss operations

---

## Best Practices

### Migration Design

1. **Keep Migrations Small:**
   - One logical change per migration
   - Easier to understand and test
   - Simpler to rollback

2. **Make Migrations Idempotent:**
   - Use `IF NOT EXISTS` for creates
   - Use `IF EXISTS` for drops
   - Use `ON CONFLICT DO NOTHING` for inserts
   - Safe to run multiple times

3. **Test Rollback Early:**
   - Don't wait until production issue
   - Test rollback during development
   - Verify down() function works

4. **Document Non-Reversible Operations:**
   ```typescript
   // WARNING: Dropping this column will lose data!
   // Affects: 1,234 projects with descriptions
   // Backup: pg_dump -t projects > backup.sql
   await db.run(`ALTER TABLE projects DROP COLUMN description`)
   ```

### Development Workflow

1. **Use Feature Branches:**
   ```bash
   git checkout -b feature/add-tags
   # Create migration 022_add_tags
   # Test forward and rollback
   git commit -m "Add migration 022: Tags support"
   git push
   ```

2. **Test Before Merging:**
   - Forward migration works
   - Rollback works
   - Re-running forward works
   - Application works with changes

3. **Review Migrations:**
   - Code review includes migration review
   - Check down() function implementation
   - Verify idempotency
   - Confirm no data loss risks

### Production Workflow

1. **Always Backup First:**
   ```bash
   pg_dump -U crearis_admin crearis_admin_prod > \
     backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on Staging:**
   - Run migration on staging first
   - Verify application works
   - Test rollback on staging
   - Then deploy to production

3. **Monitor After Deployment:**
   - Check application logs
   - Verify database metrics
   - Watch for errors
   - Be ready to rollback

4. **Keep Rollback Window Open:**
   - Don't deploy on Friday evening
   - Have team available for monitoring
   - Keep backup readily accessible
   - Document rollback procedure

---

## Reference

### Migration Interface

```typescript
interface Migration {
    run: (db: DatabaseAdapter) => Promise<void>
    down?: (db: DatabaseAdapter) => Promise<void>
    metadata: {
        id: string          // e.g., 'migration-022'
        description: string // e.g., 'Add tags support'
        version: string     // e.g., 'C.1' (Package C, migration 1)
        date: string        // e.g., '2025-01-15'
    }
    manualOnly?: boolean   // If true, skip in auto-run
    reversible?: boolean   // If true, has safe down() implementation
}
```

### Migration Registry

Location: `/server/database/migrations/index.ts`

```typescript
const migrations: Migration[] = [
    // Package A (000-018): Base schema
    { run: migration000.up, metadata: {...} },
    // ... 
    
    // Package B (019-020): Core schema
    { run: migration019.up, metadata: {...} },
    { run: migration020.up, metadata: {...} },
    
    // Package C (022-029): Alpha features - REVERSIBLE
    { 
        run: migration022.up, 
        down: migration022.down, 
        metadata: {...}, 
        reversible: true 
    },
]
```

### Tracking Table

Table: `crearis_config`
Column: `config.migrations_run` (JSONB array)

```sql
SELECT config->'migrations_run' 
FROM crearis_config 
WHERE id = 1;

-- Output: ["migration-000", "migration-001", ..., "migration-022"]
```

### npm Scripts

```json
{
  "db:migrate": "tsx server/database/migrations/run.ts",
  "db:migrate:status": "tsx server/database/migrations/run.ts --status",
  "db:migrate:021": "tsx server/database/migrations/run-migration-021.ts",
  "db:rollback": "tsx server/database/migrations/rollback.ts",
  "db:rollback:force": "tsx server/database/migrations/rollback.ts --force",
  "db:rebuild": "tsx server/database/drop-and-rebuild-pg.ts"
}
```

---

## Related Documentation

- **DATABASE_SAFETY_PRODUCTION.md** - Production environment safety
- **DATABASE_SAFETY_IMPLEMENTATION.md** - Safety check implementation
- **DATABASE_MIGRATIONS.md** - General migration system
- **MR1_IMPORT_SYSTEM_READY.md** - Export/import system
- **MR2_EXPORT_SYSTEM_COMPLETE.md** - Export functionality
- **MR3_DEPLOYMENT_SUCCESS.md** - Production deployment

---

## Summary

**Reversible migrations enable:**
- ✅ Safe experimentation during development
- ✅ Quick recovery from migration issues
- ✅ Confidence in production deployments
- ✅ Iterative feature development

**Key commands:**
```bash
pnpm db:migrate              # Run pending migrations
pnpm db:rollback --force     # Roll back last migration
pnpm db:rollback 3 --force   # Roll back last 3 migrations
pnpm db:migrate:status       # Check current state
```

**Remember:**
- Always implement down() functions for Package C
- Test rollback before deploying to production
- Backup database before production migrations
- Document non-reversible operations
- Keep migrations small and focused
