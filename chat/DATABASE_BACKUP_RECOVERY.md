# Database Backup & Recovery System

**Last Updated**: October 28, 2025  
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Production Backup](#production-backup)
4. [Development Recovery](#development-recovery)
5. [Automated Backups](#automated-backups)
6. [Manual Backup/Restore](#manual-backuprestore)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

This system provides:
- **Production backups**: Automated daily PostgreSQL dumps
- **Dev recovery**: Restore production data to development
- **Schema synchronization**: Re-apply migrations after restore
- **Disaster recovery**: Quick rollback capability

### Architecture

```
Production Server                     Development Box
/opt/crearis/                         /home/user/crearis-vue/
├── backups/                          ├── server/data/
│   ├── db_backup_20251028_020000.sql │   └── backups/
│   ├── db_backup_20251027_020000.sql │       └── prod_restore_*.sql
│   └── ...                           ├── .env
                                      └── scripts/restore-from-production.sh

    [Production Backup] ──scp──> [Dev Recovery]
    [pg_dump]                     [psql restore + migrations]
```

---

## Backup Strategy

### Backup Types

| Type | Frequency | Retention | Method | Location |
|------|-----------|-----------|--------|----------|
| **Automated Daily** | 2:00 AM | 7 days | PM2 cron | `/opt/crearis/backups/` |
| **Pre-Deployment** | Before deploy | 30 days | Manual | `/opt/crearis/backups/` |
| **Weekly Archive** | Sunday 3 AM | 90 days | Cron | `/opt/crearis/backups/archive/` |
| **Pre-Migration** | Before schema change | Until tested | Manual | `/opt/crearis/backups/migrations/` |

### Backup Naming Convention

```
db_backup_YYYYMMDD_HHMMSS.sql.gz
│         │        │
│         │        └─ Time (24-hour format)
│         └─ Date (ISO format)
└─ Prefix

Examples:
- db_backup_20251028_020000.sql.gz (Daily automated)
- db_backup_20251028_143022.sql.gz (Manual)
- db_backup_pre_migration_022.sql.gz (Pre-migration)
```

### What's Backed Up

✅ **Included**:
- All table schemas
- All table data (users, projects, events, etc.)
- Sequences (auto-increment counters)
- Indexes
- Foreign key constraints
- Config table (migration tracking)

❌ **Not Included**:
- PostgreSQL roles/users (created separately)
- Database configuration
- Extensions (pgcrypto - re-enabled on restore)

---

## Production Backup

### 1. Automated Daily Backup Script

**File**: `scripts/backup-production-db.sh`

**Features**:
- Runs daily at 2:00 AM via PM2 or cron
- Creates compressed SQL dump
- Rotates old backups (keeps 7 days)
- Validates backup file
- Sends completion notification (optional)

**Usage**:
```bash
# On production server
cd /opt/crearis/source
bash scripts/backup-production-db.sh

# Or via pnpm
pnpm db:backup
```

**Output**:
```
🗄️  PostgreSQL Database Backup
======================================================================
Database: crearis_admin_prod
User: crearis_admin
Backup Location: /opt/crearis/backups/
======================================================================

📦 Creating backup...
   ✅ Backup created: db_backup_20251028_143022.sql.gz
   Size: 2.3 MB

🗑️  Cleaning old backups (keeping last 7)...
   Removed: db_backup_20251021_020000.sql.gz
   
✅ Backup complete!
   Location: /opt/crearis/backups/db_backup_20251028_143022.sql.gz
```

### 2. Pre-Deployment Backup

**Always backup before**:
- Major version updates
- Schema migrations
- Production deployments
- Configuration changes

**Command**:
```bash
# Create timestamped backup
bash scripts/backup-production-db.sh

# Or create named backup
bash scripts/backup-production-db.sh pre_deployment_v1.2.0
```

### 3. Backup Verification

**Verify backup integrity**:
```bash
# Check if gzip file is valid
gunzip -t /opt/crearis/backups/db_backup_*.sql.gz

# Check file size (should be > 1MB for populated database)
ls -lh /opt/crearis/backups/

# Test restore to temporary database (optional)
createdb test_restore
gunzip -c backup.sql.gz | psql test_restore
dropdb test_restore
```

---

## Development Recovery

### Goal

Sync your local development database with production data to:
- Test with real data
- Debug production issues
- Verify migrations work on production data
- Develop features with realistic dataset

### Process Flow

```
1. Production Backup (on server)
   ↓
2. Download to Dev (scp)
   ↓
3. Drop Local DB (safe - dev only)
   ↓
4. Restore Backup (psql)
   ↓
5. Re-run Migrations (catch up with code)
   ↓
6. Verify Success
```

### Script: `restore-from-production.sh`

**Location**: `scripts/restore-from-production.sh`

**Usage**:
```bash
# Step 1: Download production backup
scp user@production:/opt/crearis/backups/db_backup_20251028_020000.sql.gz \
    server/data/backups/

# Step 2: Run restore script
bash scripts/restore-from-production.sh server/data/backups/db_backup_20251028_020000.sql.gz

# Or with pnpm
pnpm db:restore server/data/backups/db_backup_20251028_020000.sql.gz
```

**What it does**:
1. Validates backup file exists
2. Extracts database name from `.env`
3. Drops local development database
4. Creates fresh database
5. Restores backup data
6. Enables required extensions
7. Re-runs all migrations (brings schema up to code)
8. Displays summary

**Output**:
```
🔄 Restore Production Database to Dev
======================================================================
Backup File: db_backup_20251028_020000.sql.gz
Local Database: crearis_admin_dev
======================================================================

⚠️  WARNING: This will DELETE your local database!
   Database: crearis_admin_dev
   Continue? (yes/no): yes

🗑️  Dropping local database...
   ✅ Database dropped

📦 Creating fresh database...
   ✅ Database created

📥 Restoring backup...
   ✅ Backup restored (2.3 MB → 12.4 MB uncompressed)

🔧 Enabling extensions...
   ✅ pgcrypto enabled

🔄 Re-running migrations (to catch up with code)...
   Running migration: 023_add_feature_x
   ✅ Applied 1 new migration(s)

======================================================================
✅ Restore Complete!
======================================================================
Local database now matches production data + latest code migrations

Next steps:
1. Verify data: pnpm dev
2. Test functionality
3. Check migration results
```

### Important Notes

⚠️ **Development Only**: Never run restore script on production server!

✅ **Safe for Dev**: 
- Only affects local `crearis_admin_dev` database
- Production data unchanged
- Can be repeated unlimited times

🔄 **Migration Catch-Up**:
- Production may be on older schema
- Your dev code may have newer migrations
- Script re-runs ALL migrations after restore
- Migrations are idempotent (safe to re-run)
- Brings dev database schema in sync with code

---

## Automated Backups

### Option 1: PM2 Integration (Recommended)

**PM2 Ecosystem Config**: `/opt/crearis/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'crearis',
    script: '.output/server/index.mjs',
    cwd: '/opt/crearis/live',
    env: {
      NODE_ENV: 'production'
    },
    // Backup on restart
    post_restart: 'bash /opt/crearis/scripts/backup-production-db.sh',
    
    // Optional: Scheduled restart triggers backup
    cron_restart: '0 2 * * *',  // 2 AM daily
  }]
}
```

**Setup**:
```bash
# On production server
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable on boot
```

### Option 2: System Cron (Alternative)

**Crontab entry**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/crearis/source && bash scripts/backup-production-db.sh

# Add weekly archive at 3 AM Sunday
0 3 * * 0 cd /opt/crearis/source && bash scripts/backup-production-db.sh weekly_archive
```

### Option 3: Manual Backups

**Before deployments**:
```bash
# SSH to production
ssh user@production

# Create backup
cd /opt/crearis/source
bash scripts/backup-production-db.sh pre_deployment_$(date +%Y%m%d)
```

---

## Manual Backup/Restore

### Manual Backup (Production)

**Full backup**:
```bash
# On production server
pg_dump -U crearis_admin \
        -h localhost \
        -d crearis_admin_prod \
        -F p \
        --no-owner \
        --no-acl \
        | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Schema only** (no data):
```bash
pg_dump -U crearis_admin \
        -h localhost \
        -d crearis_admin_prod \
        --schema-only \
        -F p \
        | gzip > schema_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Specific tables**:
```bash
pg_dump -U crearis_admin \
        -h localhost \
        -d crearis_admin_prod \
        -t users -t projects -t events \
        -F p \
        | gzip > tables_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Manual Restore (Development)

**Full restore**:
```bash
# Drop and recreate database
dropdb crearis_admin_dev
createdb crearis_admin_dev

# Restore
gunzip -c backup.sql.gz | psql -U crearis_admin crearis_admin_dev

# Re-run migrations
cd /home/persona/crearis/crearis-vue
SKIP_MIGRATIONS=false pnpm db:migrate
```

**Restore to different database**:
```bash
# Create new database for testing
createdb crearis_test_restore

# Restore
gunzip -c backup.sql.gz | psql crearis_test_restore

# Test
psql crearis_test_restore -c "SELECT COUNT(*) FROM users;"

# Cleanup
dropdb crearis_test_restore
```

---

## Testing & Verification

### Test Backup Process

**1. Create test backup**:
```bash
bash scripts/backup-production-db.sh test_backup
```

**2. Verify backup file**:
```bash
# Check file exists and has reasonable size
ls -lh /opt/crearis/backups/test_backup.sql.gz

# Verify gzip integrity
gunzip -t /opt/crearis/backups/test_backup.sql.gz
```

**3. Test restore**:
```bash
# On dev box
bash scripts/restore-from-production.sh /opt/crearis/backups/test_backup.sql.gz
```

**4. Verify restored data**:
```bash
# Start dev server
pnpm dev

# Check in browser
# - Login with production credentials
# - Verify projects exist
# - Check event calendar
# - Test file uploads
```

### Test Recovery Process

**Simulate disaster recovery**:
```bash
# 1. Note current database state
psql -c "SELECT COUNT(*) FROM users;" > before.txt

# 2. Make some changes
psql -c "INSERT INTO users (...) VALUES (...);"

# 3. Restore from backup
bash scripts/restore-from-production.sh backup.sql.gz

# 4. Verify restoration
psql -c "SELECT COUNT(*) FROM users;" > after.txt
diff before.txt after.txt  # Should match
```

---

## Troubleshooting

### Issue: Backup Script Fails

**Symptoms**:
```
ERROR: permission denied for database crearis_admin_prod
```

**Solutions**:
```bash
# Check PostgreSQL user permissions
psql -U postgres -c "\du crearis_admin"

# Grant necessary permissions
psql -U postgres -c "GRANT CONNECT ON DATABASE crearis_admin_prod TO crearis_admin;"
psql -U postgres -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO crearis_admin;"
```

### Issue: Restore Fails - Database in Use

**Symptoms**:
```
ERROR: database "crearis_admin_dev" is being accessed by other users
```

**Solutions**:
```bash
# Terminate all connections
psql -U postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'crearis_admin_dev' AND pid <> pg_backend_pid();
"

# Then retry restore
bash scripts/restore-from-production.sh backup.sql.gz
```

### Issue: Migration Fails After Restore

**Symptoms**:
```
ERROR: relation "new_table" already exists
```

**Cause**: Backup included migrations that your code doesn't know about

**Solutions**:
```bash
# Option 1: Use fresh rebuild instead
pnpm db:rebuild

# Option 2: Manually update migration tracking
psql crearis_admin_dev -c "
UPDATE crearis_config 
SET config = jsonb_set(config, '{migrations_run}', '[]'::jsonb);
"

# Then re-run migrations
SKIP_MIGRATIONS=false pnpm db:migrate
```

### Issue: Backup File Corrupted

**Symptoms**:
```
gzip: backup.sql.gz: invalid compressed data--format violated
```

**Solutions**:
```bash
# Check file size (should be > 0)
ls -lh backup.sql.gz

# Try to repair
gzip -d -c backup.sql.gz > backup.sql 2>/dev/null || echo "Corrupted"

# Use previous backup
ls -lt /opt/crearis/backups/  # Find older backup
```

### Issue: Out of Disk Space

**Symptoms**:
```
ERROR: could not write to file: No space left on device
```

**Solutions**:
```bash
# Check disk space
df -h /opt/crearis/backups

# Remove old backups manually
cd /opt/crearis/backups
rm db_backup_202510*.sql.gz  # Remove October backups

# Or archive and compress
tar -czf archive_2025_q3.tar.gz db_backup_202507*.sql.gz db_backup_202508*.sql.gz db_backup_202509*.sql.gz
rm db_backup_202507*.sql.gz db_backup_202508*.sql.gz db_backup_202509*.sql.gz
```

---

## Best Practices

### Backup

✅ **DO**:
- Backup before every deployment
- Backup before schema migrations
- Test restores regularly (monthly)
- Keep backups for 7+ days
- Monitor backup size trends
- Verify backup integrity after creation

❌ **DON'T**:
- Store backups only on production server
- Delete backups immediately after deployment
- Assume backups work without testing
- Run backups during peak hours
- Store passwords in backup scripts

### Restore

✅ **DO**:
- Test restore process on staging first
- Verify data integrity after restore
- Re-run migrations after restore
- Document restore procedure
- Have rollback plan ready

❌ **DON'T**:
- Restore to production without testing
- Skip migration re-run
- Restore during business hours (production)
- Overwrite production without backup
- Restore unknown/untested backups

### Security

✅ **DO**:
- Use `.pgpass` file for password management
- Set backup file permissions to 600
- Encrypt backups for off-site storage
- Audit backup access logs
- Rotate backup encryption keys

❌ **DON'T**:
- Store passwords in scripts
- Make backups world-readable
- Share production backups via email
- Store backups in public locations
- Leave old backups unencrypted

---

## Related Documentation

- `docs/DATABASE_SAFETY_PRODUCTION.md` - Production safety analysis
- `docs/DATABASE_MIGRATIONS.md` - Migration system documentation
- `docs/PASSWORD_SYSTEM.md` - User password management
- `DEPLOYMENT_GUIDE.md` - Production deployment guide

---

## Appendix: Commands Reference

### Quick Commands

```bash
# Production backup
bash scripts/backup-production-db.sh

# Dev restore
bash scripts/restore-from-production.sh backup.sql.gz

# Manual backup
pg_dump -U crearis_admin crearis_admin_prod | gzip > backup.sql.gz

# Manual restore
gunzip -c backup.sql.gz | psql crearis_admin_dev

# Check backup size
ls -lh /opt/crearis/backups/

# Verify backup integrity
gunzip -t backup.sql.gz

# Clean old backups
find /opt/crearis/backups/ -name "*.sql.gz" -mtime +7 -delete
```

### Database Commands

```bash
# List databases
psql -l

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('crearis_admin_prod'));"

# Check table sizes
psql -c "\dt+"

# Count active connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'crearis_admin_prod';"

# Terminate connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'crearis_admin_dev';"
```
