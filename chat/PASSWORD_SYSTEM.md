# Password System Documentation

**Status**: Implemented ✅  
**Date**: October 28, 2025  
**Related**: DEPLOYMENT_GUIDE.md, NITRO_3_BUILD_SUCCESS.md

---

## Overview

The application implements a secure password generation system for all users (system users and CSV-imported users). Passwords are randomly generated, stored in `PASSWORDS.csv`, and persist across database migrations.

## Password Storage

### Location

- **Development**: `server/data/PASSWORDS.csv`
- **Production**: `/opt/crearis/data/PASSWORDS.csv` (symlinked from `/opt/crearis/live/server/data/`)

### Format

```csv
sysmail,extmail,password
"admin@theaterpedia.org","","VaCee1xazZ"
"user@example.com","external@example.com","p6KMnGtKsP"
```

## User Types

### System Users (Migration 021)

Six system accounts with administrative and project management roles:

| Email | Username | Role | Purpose |
|-------|----------|------|---------|
| admin@theaterpedia.org | admin | admin | System administrator |
| base@theaterpedia.org | base | base | Base data manager |
| project1@theaterpedia.org | project1 | user | TP project owner |
| project2@theaterpedia.org | project2 | user | Regio1 project owner |
| tp@theaterpedia.org | tp | user | TP project member |
| regio1@theaterpedia.org | regio1 | user | Regio1 project member |

### CSV-Imported Users (Migration 022)

Users imported from `server/data/root/users.csv`. Currently 17 users with various roles across projects.

## Password Generation

### Algorithm

```typescript
function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}
```

- **Length**: 10 characters
- **Character set**: A-Z, a-z, 0-9 (62 possibilities per character)
- **Entropy**: ~60 bits (62^10 ≈ 8.4×10^17 combinations)

### Security

- Passwords are hashed with bcrypt (10 rounds) before database storage
- Plain passwords stored only in `PASSWORDS.csv` for initial distribution
- PASSWORDS.csv should be secured with file permissions (600 recommended)
- PASSWORDS.csv is in `.gitignore` and never committed to version control

## Migration Behavior

### Smart Password Reuse

Both migrations 021 and 022 implement smart password handling:

1. **Load existing PASSWORDS.csv** if present
2. **Check if user exists in database** (skip password generation if exists)
3. **Check if password exists in CSV** (reuse if exists)
4. **Generate new password** only if both checks pass
5. **Merge and write CSV** preserving all entries

This ensures:
- ✅ Passwords persist across multiple migration runs
- ✅ Re-running migrations doesn't change existing passwords
- ✅ System users (021) and CSV users (022) coexist in same file
- ✅ No password duplication or loss

### Migration Order

1. **Migration 021** runs first:
   - Creates system users (admin, base, project1, project2, tp, regio1)
   - Generates random passwords
   - Writes PASSWORDS.csv

2. **Migration 022** runs second:
   - Loads PASSWORDS.csv (includes system users from 021)
   - Processes CSV user imports
   - Generates passwords for CSV users
   - Merges all entries and writes updated PASSWORDS.csv

## Path Resolution

### getDataPath() Function

Located in `server/settings.ts`:

```typescript
export function getDataPath(): string {
    return path.resolve(process.cwd(), 'server/data')
}
```

### How It Works

| Environment | process.cwd() | getDataPath() Result | Actual Path |
|-------------|---------------|---------------------|-------------|
| Development | `/home/user/crearis-vue` | `/home/user/crearis-vue/server/data` | Direct access |
| Production Build | `/opt/crearis/live` | `/opt/crearis/live/server/data` | Via symlink |
| Production Data | N/A | N/A | `/opt/crearis/data` (symlinked) |

### Production Symlink

The deployment setup creates:

```bash
/opt/crearis/live/server/data -> /opt/crearis/data
```

This allows:
- Code in `.output/` to use `process.cwd() + 'server/data'`
- Data to persist in `/opt/crearis/data/` (outside live directory)
- Updates to `/opt/crearis/live/` don't affect data
- Easy backup of `/opt/crearis/data/`

## Deployment Setup

### Directory Structure

```
/opt/crearis/
├── source/              # Git repository + build environment
│   ├── server/
│   │   └── data/       # Development data (not used in production)
│   └── .env
├── live/               # Running application (.output synced here)
│   ├── server/
│   │   └── data -> ../../data  # Symlink to persistent data
│   └── ecosystem.config.js
├── data/               # PERSISTENT DATA (not replaced on deployment)
│   ├── PASSWORDS.csv   # Plain passwords for distribution
│   ├── backups/        # Database backups
│   ├── root/          # Root fileset (users.csv, projects.csv)
│   └── base/          # Base fileset (events, posts, etc.)
├── logs/              # PM2 and application logs
└── scripts/           # Deployment automation scripts
```

### Deployment Commands

```bash
# 1. Initial setup (run once)
mkdir -p /opt/crearis/data
chmod 700 /opt/crearis/data  # Secure data directory

# 2. Build in source directory
cd /opt/crearis/source
pnpm install
pnpm build

# 3. Sync to live directory
rsync -av --delete .output/ /opt/crearis/live/

# 4. Create symlink (if not exists)
cd /opt/crearis/live
mkdir -p server
ln -sfn ../../data server/data

# 5. Copy data files (first deployment only)
if [ ! -f /opt/crearis/data/PASSWORDS.csv ]; then
    cp -r /opt/crearis/source/server/data/* /opt/crearis/data/
fi

# 6. Restart application
cd /opt/crearis/live
pm2 restart ecosystem.config.js
```

## Password Distribution

### Initial Setup

After first deployment with fresh database:

1. Run migrations (creates PASSWORDS.csv):
   ```bash
   cd /opt/crearis/source
   pnpm db:rebuild
   ```

2. Securely copy PASSWORDS.csv from server:
   ```bash
   scp user@server:/opt/crearis/data/PASSWORDS.csv ./passwords-$(date +%Y%m%d).csv
   ```

3. Distribute passwords to users via secure channel (encrypted email, password manager, etc.)

4. Instruct users to change passwords on first login

### Password Rotation

To rotate passwords:

1. Delete or rename PASSWORDS.csv:
   ```bash
   mv /opt/crearis/data/PASSWORDS.csv /opt/crearis/data/PASSWORDS.csv.old
   ```

2. Re-run migrations to generate new passwords:
   ```bash
   cd /opt/crearis/source
   pnpm db:rebuild  # Or run migrations selectively
   ```

3. Distribute new passwords as above

## Security Best Practices

### File Permissions

```bash
# Secure PASSWORDS.csv
chmod 600 /opt/crearis/data/PASSWORDS.csv
chown app-user:app-group /opt/crearis/data/PASSWORDS.csv

# Secure data directory
chmod 700 /opt/crearis/data
chown -R app-user:app-group /opt/crearis/data
```

### Backup Strategy

```bash
# Backup PASSWORDS.csv with database backups
tar -czf /opt/crearis/backups/data-$(date +%Y%m%d).tar.gz \
    /opt/crearis/data/PASSWORDS.csv \
    /opt/crearis/data/*.csv

# Encrypt backup
gpg --encrypt --recipient admin@example.com \
    /opt/crearis/backups/data-$(date +%Y%m%d).tar.gz
```

### .gitignore

Ensure these patterns are in `.gitignore`:

```gitignore
# Password files
PASSWORDS.csv
server/data/PASSWORDS.csv

# Environment files
.env
.env.local
.env.production

# Backup files
*.backup
*.tar.gz
```

## Troubleshooting

### PASSWORDS.csv Not Found

**Symptom**: Migrations fail with "Cannot read PASSWORDS.csv"

**Solution**: This is expected on first run. Migrations create the file automatically.

### PASSWORDS.csv Wrong Location

**Symptom**: File created in wrong directory

**Check**:
```bash
node -e "console.log(process.cwd())"
node -e "const path = require('path'); console.log(path.resolve(process.cwd(), 'server/data'))"
```

**Solution**: Ensure migrations run from correct directory or symlink exists.

### Passwords Change on Every Migration

**Symptom**: Users complain passwords changed after deployment

**Cause**: PASSWORDS.csv not preserved between deployments

**Solution**: Ensure `/opt/crearis/data/` is persistent and not overwritten during sync.

### System Users Missing from CSV

**Symptom**: Only 17 entries in PASSWORDS.csv (CSV users only)

**Cause**: Migration 022 overwrites file without merging

**Solution**: Update migration 022 to merge entries (fixed in current version).

### Symlink Broken

**Symptom**: "ENOENT: no such file or directory" errors in production

**Check**:
```bash
ls -la /opt/crearis/live/server/data
```

**Solution**:
```bash
cd /opt/crearis/live
mkdir -p server
ln -sfn ../../data server/data
```

## Testing

### Local Testing

```bash
# Test password generation
pnpm db:rebuild

# Verify PASSWORDS.csv created
cat server/data/PASSWORDS.csv | wc -l  # Should show 24 (header + 23 users)

# Test password persistence
pnpm db:rebuild  # Run again
cat server/data/PASSWORDS.csv  # Should have same passwords

# Test production build
rm -rf .output
pnpm build
cd .output
mkdir -p server
ln -sfn ../../server/data server/data
ls -la server/data/PASSWORDS.csv  # Should exist via symlink
```

### Production Testing

```bash
# Test from live directory
cd /opt/crearis/live
ls -la server/data/PASSWORDS.csv

# Test path resolution
node -e "const path = require('path'); console.log(path.resolve(process.cwd(), 'server/data'))"

# Should output: /opt/crearis/live/server/data
# Which is symlinked to: /opt/crearis/data
```

## Summary

✅ **Random passwords** generated for all users (10 chars, alphanumeric)  
✅ **Persistent storage** in PASSWORDS.csv (survives migrations)  
✅ **Smart merging** preserves system + CSV users  
✅ **Production-ready** with symlink architecture  
✅ **Secure by default** (bcrypt hashing, file permissions)  
✅ **Easy distribution** (CSV format, one file)  

---

**Next Steps**:
1. Update deployment scripts with symlink creation
2. Add password distribution procedure to operations manual
3. Set up automated encrypted backups of PASSWORDS.csv
4. Implement password change functionality in application UI
