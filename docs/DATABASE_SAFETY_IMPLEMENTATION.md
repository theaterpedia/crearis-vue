# Database Safety Implementation - Complete

**Date:** November 18, 2025  
**Status:** ✅ IMPLEMENTED

---

## Summary

Production safety checks have been added to all dangerous database scripts to prevent accidental data loss.

## Changes Made

### 1. Protected Scripts (4 files)

#### `server/database/drop-and-rebuild-pg.ts`
- ✅ Added `NODE_ENV=production` check
- ✅ Added database name check (`prod`, `production` keywords)
- ✅ Clear error messages explaining why blocked
- ✅ Guidance on proper production procedures

#### `drop-db-quick.sh`
- ✅ Added `NODE_ENV=production` check
- ✅ Added database name check (`prod`, `production` keywords)
- ✅ Clear error messages
- ✅ Exits with error code 1 if blocked

#### `scripts/restore-from-production.sh`
- ✅ Added `NODE_ENV=production` check
- ✅ Added database name check
- ✅ Warns about dropping target database
- ✅ Exits before any destructive operations

#### `scripts/setup-database.sh`
- ✅ Added production check when user confirms rebuild
- ✅ Only blocks on explicit rebuild confirmation
- ✅ Database creation still works in production

### 2. Updated Configuration Examples

#### `.env.database.example`
- ✅ Added `NODE_ENV=development` with documentation
- ✅ Updated comments explaining database naming conventions
- ✅ Updated `SKIP_MIGRATIONS` documentation

#### `scripts/.env.deploy.example`
- ✅ Added `NODE_ENV=production` with documentation
- ✅ Added `SKIP_MIGRATIONS=true` for production
- ✅ Clear warnings about database safety

### 3. Documentation

#### `docs/DATABASE_SAFETY_PRODUCTION.md`
- ✅ Updated with current production context (November 2025)
- ✅ Test database isolation verified and documented
- ✅ Risk analysis for all scripts
- ✅ New migration workflow documented
- ✅ Implementation checklist
- ✅ Safe migration practices

---

## How It Works

### Safety Check Logic

```typescript
// TypeScript (drop-and-rebuild-pg.ts)
if (process.env.NODE_ENV === 'production') {
    console.error('❌ BLOCKED: Cannot drop database in production')
    process.exit(1)
}

if (dbName?.includes('prod') || dbName?.includes('production')) {
    console.error('❌ BLOCKED: Production database detected')
    process.exit(1)
}
```

```bash
# Bash scripts
if [ "$NODE_ENV" = "production" ]; then
    echo "❌ BLOCKED: Cannot drop database in production"
    exit 1
fi

if [[ "$DB_NAME" == *"prod"* ]] || [[ "$DB_NAME" == *"production"* ]]; then
    echo "❌ BLOCKED: Production database detected"
    exit 1
fi
```

### Two-Layer Protection

1. **Environment check:** `NODE_ENV=production` blocks scripts
2. **Database name check:** Names containing `prod` or `production` blocked

Either check will prevent dangerous operations.

---

## Required Configuration

### Production Server

**File:** `/opt/crearis/source/.env`

```bash
NODE_ENV=production       # ← Blocks dangerous scripts
DATABASE_TYPE=postgresql
DB_NAME=crearis_db        # or crearis_production
DB_USER=crearis_admin
DB_PASSWORD=<secure_password>
SKIP_MIGRATIONS=true      # ← Prevents auto-migrations
```

### Development Box

**File:** `~/crearis/crearis-vue/.env`

```bash
NODE_ENV=development      # ← Allows rebuild scripts
DATABASE_TYPE=postgresql
DB_NAME=crearis_admin_dev # ← Must NOT contain "prod"
DB_USER=crearis_admin
DB_PASSWORD=<password>
SKIP_MIGRATIONS=false     # ← Allows new migrations
```

### Test Database (Automatic)

```bash
TEST_DATABASE_TYPE=postgresql
TEST_DB_NAME=demo_data_test  # Automatically handled by test-config.ts
```

---

## Testing the Safety Checks

### Test 1: Block Production Drop (Should FAIL)

```bash
# Temporarily set production mode on dev box
export NODE_ENV=production

# Try to rebuild (should be blocked)
pnpm db:rebuild

# Expected output:
# ❌ BLOCKED: Cannot drop database in production environment
# NODE_ENV=production detected
# This command is ONLY for development databases
```

### Test 2: Block Production Database Name (Should FAIL)

```bash
# Temporarily set production-like database name
export DB_NAME=crearis_production

# Try to rebuild (should be blocked)
pnpm db:rebuild

# Expected output:
# ❌ BLOCKED: Production database name detected
# DB_NAME="crearis_production" contains "prod" or "production"
```

### Test 3: Allow Development Drop (Should SUCCEED)

```bash
# Set development mode
export NODE_ENV=development
export DB_NAME=crearis_admin_dev

# Try to rebuild (should work)
pnpm db:rebuild

# Expected output:
# ✅ Environment check passed (development mode)
# 🗑️  Dropping all tables...
```

### Test 4: Tests Still Work (Should SUCCEED)

```bash
# Tests use isolated test database
pnpm test:pg

# Should run normally - test database is never blocked
```

---

## What Commands Are Protected

### 🔴 HIGH RISK - Now Protected

| Command | Before | After |
|---------|--------|-------|
| `pnpm db:rebuild` | ⚠️ No check | ✅ Blocked in production |
| `./drop-db-quick.sh` | ⚠️ No check | ✅ Blocked in production |

### 🟡 MEDIUM RISK - Now Protected

| Command | Before | After |
|---------|--------|-------|
| `restore-from-production.sh` | ⚠️ No check | ✅ Blocked in production |
| `setup-database.sh --rebuild` | ⚠️ No check | ✅ Blocked in production |

### ✅ SAFE - No Changes Needed

| Command | Status | Reason |
|---------|--------|--------|
| `pnpm test` | ✅ Safe | Uses test database |
| `pnpm test:pg` | ✅ Safe | Uses test database |
| `pnpm prebuild` | ✅ Safe | No DB interaction |
| `pnpm build` | ✅ Safe | No DB interaction |
| `pm2 restart` | ✅ Safe | With SKIP_MIGRATIONS=true |

---

## Migration Workflow Going Forward

### OLD Workflow (DEPRECATED)

```bash
# ❌ DANGEROUS - Would lose all data
pnpm db:rebuild
```

### NEW Workflow (Safe)

```bash
# 1. Develop on dev box
# Create migration: migrations/024_add_feature.ts
pnpm db:migrate

# 2. Test thoroughly
pnpm dev

# 3. Backup before deploying
curl -X POST http://localhost:3000/api/admin/backup/export

# 4. Deploy to production
ssh production
cd /opt/crearis/source
git pull

# 5. Run migration (temporarily enable)
nano .env  # Set SKIP_MIGRATIONS=false
pnpm db:migrate
nano .env  # Set SKIP_MIGRATIONS=true

# 6. Rebuild and restart
bash scripts/server_deploy_phase2a_build.sh
pm2 restart crearis-vue
```

---

## Verification Checklist

After implementation, verify:

- [ ] Production `.env` has `NODE_ENV=production`
- [ ] Dev `.env` has `NODE_ENV=development`
- [ ] Production database name is NOT `*_dev`
- [ ] Dev database name is NOT `*_prod` or `*_production`
- [ ] Test `pnpm db:rebuild` on dev (should work)
- [ ] Test with `NODE_ENV=production` on dev (should block)
- [ ] Test `pnpm test:pg` (should work - isolated)
- [ ] Update deployment documentation

---

## Rollback Plan

If safety checks cause issues:

### Temporary Disable (Emergency Only)

```bash
# Edit the script and comment out safety check
# Example in drop-and-rebuild-pg.ts:
# if (nodeEnv === 'production') {
#     // Safety check temporarily disabled
#     // console.error('BLOCKED...')
#     // process.exit(1)
# }
```

### Proper Fix

If legitimate use case blocked:

1. Check `NODE_ENV` is correct for environment
2. Check `DB_NAME` doesn't contain confusing keywords
3. Use proper migration workflow instead
4. Contact team if safety check is incorrect

---

## Related Documentation

- `docs/DATABASE_SAFETY_PRODUCTION.md` - Comprehensive safety analysis
- `docs/MR4_IMPORT_EXPORT_SYSTEM.md` - Export/import workflow
- `DEPLOYMENT_GUIDE.md` - Production deployment procedures
- `ALTERNATIVE_DEPLOYMENT_2AB.md` - Split deployment with validation

---

## Conclusion

✅ **All dangerous database scripts are now protected**

**Protection mechanisms:**
1. `NODE_ENV` environment check
2. Database name keyword check
3. Clear error messages
4. Exit before any destruction

**Safe operations:**
- ✅ Tests completely isolated
- ✅ Build processes don't touch database
- ✅ Migration-based schema updates
- ✅ Export/import for data sync

**Result:** Production database is now protected from accidental drops while maintaining full development flexibility.
