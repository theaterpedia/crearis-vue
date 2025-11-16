# Alternative Deployment Procedure: Phase 2a + 2b (Split)

This document describes an alternative deployment procedure that splits Phase 2 into two separate scripts with database validation between them.

## Overview

**Standard Procedure:**
- Phase 1: Clone repo (root)
- Phase 2: Build + migrate (pruvious) ← Single script
- Phase 3: SSL + domain (root)

**Alternative Procedure:**
- Phase 1: Clone repo (root)
- **Phase 2a: Build + base migrations (pruvious)** ← NEW: Stops before migration 021
- **Phase 2b: System data seeding (pruvious)** ← NEW: Validates DB before migration 021
- Phase 3: SSL + domain (root)

## Why Use This Procedure?

Use the split procedure (Phase 2a + 2b) when:

1. **First-time production deployment** - Extra validation reduces risk
2. **Migration 021 previously failed** - Diagnose and fix before re-running
3. **Uncertain database state** - Verify schema before seeding data
4. **Complex environment** - More control over deployment steps
5. **Training/documentation** - Better understanding of what each step does

Use the standard procedure (Phase 2 combined) when:

1. **Development/staging environments** - Faster deployment
2. **Clean database** - High confidence in migration success
3. **Routine redeployments** - Known working configuration
4. **Quick testing** - Minimize deployment time

## Phase 2a: Build + Base Migrations

**Script:** `scripts/server_deploy_phase2a_build.sh`

**Run as:** `pruvious` user

**What it does:**
1. ✅ Check prerequisites (Node.js, PostgreSQL, pnpm)
2. ✅ Load configuration and environment variables
3. ✅ Test database connection
4. ✅ Create database if needed
5. ✅ Install Node.js dependencies
6. ✅ Setup data directory symlink
7. ✅ **Run base migrations (000-020)** ← Creates schema + migrations table
8. ✅ Build application (Vite + Nitro)
9. ✅ Sync to live directory
10. ✅ Setup PM2 configuration
11. ❌ **STOPS HERE** - Does NOT run migration 021

**Usage:**

```bash
# As pruvious user
cd /opt/crearis/source/scripts
bash server_deploy_phase2a_build.sh
```

**Output:**
- Database schema created (tables: users, projects, status, tags, etc.)
- Migrations table created with base migrations (000-020) tracked
- Application built and ready in `/opt/crearis/live/`
- PM2 configuration created
- Migration 021 NOT YET RUN

## Phase 2b: System Data Seeding

**Script:** `scripts/server_deploy_phase2b_seed.sh`

**Run as:** `pruvious` user

**What it does:**

### Pre-flight Checks (5 checks):

1. **Database Connection** ✓
   - Verifies connection to PostgreSQL
   - Shows database details (host, port, user, database)
   - Exits if connection fails

2. **Migrations Table Exists** ✓
   - Checks if migrations table was created
   - Shows table structure
   - **Prevents the "relation 'migrations' does not exist" error**
   - Exits if table missing (Phase 2a not run)

3. **Base Migrations Completed** ✓
   - Counts migrations in migrations table
   - Lists all applied migrations (000-020)
   - Warns if no base migrations found
   - Allows continuing with confirmation

4. **Migration 021 Status** ✓
   - Checks if migration 021 already applied
   - Shows when it was applied (if exists)
   - **Prevents duplicate seeding errors**
   - Offers to skip if already run

5. **Key Tables Exist** ✓
   - Verifies required tables: users, projects, status, tags, domains, memberships, pages
   - Shows current row counts for each table
   - Exits if critical tables missing

### Migration Execution:

After all checks pass:
- Runs migration 021 (system data seeding)
- Seeds: tags (empty), status (~48 rows), users (6), projects (2), domains, memberships, pages
- Creates PASSWORDS.csv file with generated user passwords
- Verifies seeded data by counting rows
- Reports success or warnings

**Note:** Migration 021 writes a file (`PASSWORDS.csv`) to `/opt/crearis/source/server/data/`, which must be a valid symlink to `/opt/crearis/data/`. If you encounter an "ELOOP: too many symbolic links" error, see the troubleshooting section below for symlink repair instructions.

**Usage:**

```bash
# As pruvious user
cd /opt/crearis/source/scripts
bash server_deploy_phase2b_seed.sh
```

**Interactive Prompts:**

The script will prompt for confirmation in two scenarios:

1. **No base migrations found:**
   ```
   ⚠ No base migrations found in migrations table
   You can still proceed, but migration 021 may fail if schema is incomplete.
   Continue anyway? (yes/no):
   ```

2. **Migration 021 already applied:**
   ```
   ⚠ Migration 021 has ALREADY been applied
   Running migration 021 again will likely cause errors:
     - Duplicate key violations (unique constraints)
     - Duplicate system users
     - Duplicate projects
   Do you want to SKIP migration 021? (yes/no):
   ```

## Complete Deployment Workflow

### First-Time Production Deployment

```bash
# ==================================================
# Phase 1: Clone Repository (as root)
# ==================================================
sudo bash scripts/server_deploy_phase1_clone.sh

# Configure .env file
sudo nano /opt/crearis/source/.env
# Set real database credentials, change SKIP_MIGRATIONS=false

# Fix ownership (CRITICAL)
sudo chown -R pruvious:pruvious /opt/crearis/data
sudo chown -R pruvious:pruvious /opt/crearis/source
sudo chown -R pruvious:pruvious /opt/crearis/live
sudo chown -R pruvious:pruvious /opt/crearis/logs
sudo chown -R pruvious:pruvious /opt/crearis/backups
sudo chmod -R u+rwX /opt/crearis/data

# ==================================================
# Phase 2a: Build + Base Migrations (as pruvious)
# ==================================================
sudo -u pruvious bash /opt/crearis/source/scripts/server_deploy_phase2a_build.sh

# Output shows:
# ✅ Base migrations (000-020) completed
# ✅ Application built
# ✅ PM2 configured
# ⚠️  Migration 021 NOT YET RUN

# ==================================================
# Phase 2b: System Data Seeding (as pruvious)
# ==================================================
sudo -u pruvious bash /opt/crearis/source/scripts/server_deploy_phase2b_seed.sh

# Script performs 5 pre-flight checks:
# ✓ Database connection working
# ✓ Migrations table exists
# ✓ Base migrations completed
# ✓ Migration 021 not yet applied
# ✓ All required tables exist

# Then runs migration 021:
# ✓ System data seeded successfully

# Change .env for production
sudo -u pruvious nano /opt/crearis/source/.env
# Set: SKIP_MIGRATIONS=true

# ==================================================
# Start Application (as pruvious)
# ==================================================
sudo -u pruvious bash << 'EOF'
cd /opt/crearis/live
pm2 delete crearis-vue 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
EOF

# Verify application
pm2 status
pm2 logs crearis-vue --lines 50

# ==================================================
# Phase 3: SSL + Domain (as root)
# ==================================================
sudo bash /opt/crearis/source/scripts/server_deploy_phase3_domain.sh
```

### Subsequent Deployments

For subsequent deployments, you can still use the split procedure or switch to the standard combined Phase 2.

**⚠️ IMPORTANT: Symlink Recreation**

When you run `git pull`, Git will **replace the symlink** `/opt/crearis/source/server/data` with the directory from the repository. The deployment scripts automatically recreate this symlink, so **always use the deployment scripts** after `git pull`.

**Option A: Split procedure (more control)**
```bash
# Pull latest code
cd /opt/crearis/source
git pull

# Run Phase 2a (SKIP_MIGRATIONS=true in .env)
# ✅ Script automatically recreates server/data symlink
sudo -u pruvious bash scripts/server_deploy_phase2a_build.sh
# Skips migrations, rebuilds application

# Skip Phase 2b (data already seeded)
# OR run Phase 2b - it will detect migration 021 already applied and skip

# Restart application
cd /opt/crearis/live
pm2 restart crearis-vue
```

**Option B: Standard combined procedure**
```bash
# Pull latest code
cd /opt/crearis/source
git pull

# Run combined Phase 2 (SKIP_MIGRATIONS=true in .env)
# ✅ Script automatically recreates server/data symlink
sudo -u pruvious bash scripts/server_deploy_phase2_build.sh
# Skips all migrations, rebuilds application

# Restart application
cd /opt/crearis/live
pm2 restart crearis-vue
```

**Why deployment scripts are required:**

- Repository has `server/data/` as a directory with files (for development)
- Production needs `server/data/` as a symlink to `/opt/crearis/data/` (for persistence)
- `git pull` removes the symlink and restores the directory from the repository
- Deployment scripts recreate the symlink after every update
- Without this, your persistent data (users, projects, etc.) would be lost
- `.gitignore` cannot prevent this behavior (it only affects untracked files)

## Troubleshooting

### Phase 2a Issues

**Issue: "Cannot connect to PostgreSQL database"**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check credentials in .env
cat /opt/crearis/source/.env | grep DB_

# Test connection manually
PGPASSWORD='your_password' psql -h localhost -U crearis_admin -d crearis_db
```

**Issue: "Node.js version too old"**
```bash
# As pruvious user
nvm install 20
nvm use 20
node --version  # Should be >= 20.10.0
```

**Issue: "pnpm not found"**
```bash
# Install pnpm
npm install -g pnpm
```

### Phase 2b Issues

**Issue: "Migrations table does NOT exist"**

**Cause:** Phase 2a was not run or base migrations failed

**Solution:**
```bash
# Run Phase 2a first
cd /opt/crearis/source/scripts
bash server_deploy_phase2a_build.sh

# Or manually run base migrations
cd /opt/crearis/source
pnpm db:migrate
```

**Issue: "Migration 021 has ALREADY been applied"**

**Cause:** Migration 021 was run previously

**Solution:** Choose "yes" when prompted to skip migration 021

**Issue: "Missing required tables: [table names]"**

**Cause:** Base migrations (000-020) did not complete successfully

**Solution:**
```bash
# Check migration status
cd /opt/crearis/source
pnpm db:migrate:status

# Re-run base migrations
pnpm db:migrate

# Then retry Phase 2b
cd scripts
bash server_deploy_phase2b_seed.sh
```

**Issue: "Duplicate key violations" when running migration 021**

**Cause:** Migration 021 already partially applied, or data manually inserted

**Solution:**
```bash
# Check if migration 021 is marked as applied
PGPASSWORD='password' psql -h localhost -U crearis_admin -d crearis_db \
  -c "SELECT * FROM migrations WHERE id = '021_seed_system_data';"

# If shows row, migration already applied - skip it
# If no row, check for duplicate data:
PGPASSWORD='password' psql -h localhost -U crearis_admin -d crearis_db \
  -c "SELECT COUNT(*) FROM users WHERE role = 'admin';"

# If admin user exists, data already seeded - skip migration 021
```

**Issue: "ELOOP: too many symbolic links encountered"**

**Symptoms:**
- Migration 021 fails when trying to write PASSWORDS.csv
- Error: "too many symbolic links encountered"
- Path: `/opt/crearis/source/server/data/PASSWORDS.csv`

**Cause:** The symlink `/opt/crearis/source/server/data` is misconfigured, creating a circular reference

**Solution:**
```bash
# As pruvious user

# 1. Check current symlink state
ls -la /opt/crearis/source/server/data
# If it shows a loop or points to itself, it's broken

# 2. Remove broken symlink
rm /opt/crearis/source/server/data

# 3. Create correct symlink
ln -sfn /opt/crearis/data /opt/crearis/source/server/data

# 4. Verify symlink is correct
ls -la /opt/crearis/source/server/data
# Should show: /opt/crearis/source/server/data -> /opt/crearis/data

# 5. Ensure target directory exists and is writable
ls -la /opt/crearis/data
# If missing or wrong ownership:
sudo mkdir -p /opt/crearis/data
sudo chown -R pruvious:pruvious /opt/crearis/data
sudo chmod 700 /opt/crearis/data

# 6. Re-run Phase 2b
cd /opt/crearis/source/scripts
bash server_deploy_phase2b_seed.sh
```

**Note:** If migration 021 database operations completed successfully (tags, projects, users seeded) but only the file write failed, it's safe to re-run Phase 2b. The script will either skip already-seeded data or show duplicate key warnings (which can be ignored).

## Comparison: Standard vs Split Procedure

| Aspect | Standard (Phase 2) | Split (Phase 2a + 2b) |
|--------|-------------------|----------------------|
| **Number of scripts** | 1 script | 2 scripts |
| **Execution time** | ~5-10 min | ~5-10 min total (same) |
| **Database validation** | None | 5 pre-flight checks |
| **Error detection** | After failure | Before execution |
| **Manual intervention** | Not possible between steps | Possible between 2a and 2b |
| **Rollback complexity** | Higher (all-or-nothing) | Lower (can stop after 2a) |
| **User confirmation** | None | Yes (if issues detected) |
| **Production safety** | Good | Excellent |
| **Development speed** | Faster | Slightly slower |
| **Recommended for** | Subsequent deployments | First-time deployments |

## Files Created

This alternative procedure adds 3 new files:

1. **`scripts/server_deploy_phase2a_build.sh`** (470 lines)
   - Phase 2a: Build + base migrations
   - Stops before migration 021

2. **`scripts/server_deploy_phase2b_seed.sh`** (380 lines)
   - Phase 2b: System data seeding
   - Includes 5 pre-flight checks
   - Validates database state before migration 021

3. **`ALTERNATIVE_DEPLOYMENT_2AB.md`** (this file)
   - Documentation for split procedure
   - Troubleshooting guide
   - Comparison with standard procedure

**Existing files unchanged:**
- `scripts/server_deploy_phase2_build.sh` - Standard combined procedure still available
- All other deployment scripts remain the same

## When to Use Each Procedure

### Use Split Procedure (2a + 2b) When:

✅ **First-time production deployment**
- Extra validation reduces risk
- Catch issues before data seeding
- Better error messages

✅ **Previous migration 021 failure**
- Diagnose root cause between phases
- Fix database state before retry
- Verify fixes with pre-flight checks

✅ **Uncertain database state**
- Verify schema completeness
- Check for existing data
- Avoid duplicate seeding

✅ **Complex production environment**
- Multiple databases
- Shared hosting
- Strict change management

✅ **Training/onboarding**
- Understand each deployment step
- See what base migrations vs. seeding does
- Better learning experience

### Use Standard Procedure (Combined Phase 2) When:

✅ **Development/staging deployments**
- Faster execution
- Less user interaction
- Familiar workflow

✅ **Clean database state**
- High confidence in success
- Known working configuration
- No previous failures

✅ **Routine redeployments**
- Code updates only
- SKIP_MIGRATIONS=true
- No database changes

✅ **Automated CI/CD**
- Non-interactive scripts
- Predictable execution
- Known environment

## Summary

The split deployment procedure (Phase 2a + 2b) provides:

1. **Better error prevention** - 5 pre-flight checks catch issues before they cause failures
2. **Clearer diagnostics** - Know exactly what failed (base migrations vs. data seeding)
3. **More control** - Manual intervention point between schema and data
4. **User confirmation** - Interactive prompts for edge cases
5. **Production safety** - Validates database state before critical operations

**Bottom line:** Use split procedure for first-time production deployments or when troubleshooting migration issues. Use standard procedure for routine deployments and development environments.
