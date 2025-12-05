# User Import System Documentation

**Status**: Production Ready ✅  
**Date**: October 28, 2025  
**Related**: PASSWORD_SYSTEM.md, DEPLOYMENT_GUIDE.md

---

## Overview

The user import system allows bulk addition of users via CSV file on a running production server. It shares code with the CSV seeding migrations (021 & 022) to ensure consistent behavior.

## Features

- ✅ Bulk user import from CSV
- ✅ Random password generation (10-char alphanumeric)
- ✅ Password appended to existing PASSWORDS.csv
- ✅ Automatic instructor creation/linking
- ✅ Idempotent (safe to re-run)
- ✅ Automatic file archiving with date prefix
- ✅ Comprehensive validation
- ✅ Shared logic with migrations

## Directory Structure

```
/opt/crearis/data/
├── PASSWORDS.csv              # Master password file (updated)
└── import/                    # Import directory (mode 700)
    ├── import-users.csv       # Place CSV file here
    └── archive/               # Processed files moved here
        ├── 2025-10-28T10-30-00_import-users.csv
        ├── 2025-10-29T14-15-22_import-users.csv
        └── ...
```

**Production Location**: `/opt/crearis/data/import/`  
**Permissions**: 700 (only owner can access)

## CSV Format

### Required Headers

```csv
sysmail,extmail,username,password,role,lang,instructor_id/xmlid
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `sysmail` | Yes | Primary email (must be unique) | `john.doe@example.com` |
| `extmail` | No | External email (for instructors) | `john@company.com` |
| `username` | Yes | Display name | `John Doe` |
| `password` | No | **Ignored** (auto-generated) | Leave empty |
| `role` | No | User role: admin, base, user | `user` (default) |
| `lang` | No | Language code: de, en, cz | `de` (default) |
| `instructor_id/xmlid` | No | Instructor XML ID | `project.partner.john_doe` |

### Example CSV

```csv
sysmail,extmail,username,password,role,lang,instructor_id/xmlid
"john.doe@example.com","","John Doe","","user","de",""
"jane.smith@example.com","jane@company.com","Jane Smith","","user","en","augsburg.partner.jane_smith"
"admin@newproject.org","","Project Admin","","admin","de",""
```

**Important Notes**:
- Use double quotes for fields with special characters
- Password field is **ignored** - random passwords are generated
- Empty fields can be `""` or just commas
- instructor_id/xmlid creates/links instructor profile

## Usage

### Step 1: Prepare CSV File

Create CSV file on your local machine:

```bash
# Create CSV file
cat > new-users.csv << 'EOF'
sysmail,extmail,username,password,role,lang,instructor_id/xmlid
"john.doe@example.com","","John Doe","","user","de",""
"jane.smith@example.com","","Jane Smith","","user","en","project.partner.jane_smith"
EOF
```

### Step 2: Upload to Server

```bash
# Secure copy to server
scp new-users.csv user@server:/opt/crearis/data/import/import-users.csv

# Or directly create on server
ssh user@server
sudo -u pruvious bash
cd /opt/crearis/data/import
nano import-users.csv
# Paste CSV content, save and exit
```

### Step 3: Run Import Script

```bash
# From source directory
cd /opt/crearis/source
bash scripts/import-users.sh
```

**Or using tsx directly**:

```bash
cd /opt/crearis/source
tsx server/scripts/import-users.ts
```

### Step 4: Distribute Passwords

After import completes:

```bash
# View new passwords
tail -20 /opt/crearis/data/PASSWORDS.csv

# Securely copy passwords
scp pruvious@server:/opt/crearis/data/PASSWORDS.csv ./passwords-$(date +%Y%m%d).csv

# Distribute to users via secure channel
```

## Import Process Flow

```
1. Read import-users.csv
   ↓
2. Validate CSV data
   ├─ Check required fields
   ├─ Validate email format
   ├─ Validate role/lang values
   └─ Report errors (exit if any)
   ↓
3. Connect to database
   ↓
4. Load existing PASSWORDS.csv
   ↓
5. For each user:
   ├─ Check if user exists (skip if exists)
   ├─ Check if password exists in CSV (reuse)
   ├─ Generate new password (if needed)
   ├─ Process instructor (create/link)
   └─ Insert user into database
   ↓
6. Save passwords to PASSWORDS.csv
   ├─ Merge with existing entries
   ├─ Preserve system users
   └─ Set permissions (600)
   ↓
7. Archive import file
   ├─ Rename with timestamp prefix
   └─ Move to archive/ directory
   ↓
8. Display summary report
```

## Script Output Example

```
🚀 User Import Script
======================================================================
Date: 2025-10-28T15:30:45.123Z
======================================================================
✅ Loaded environment variables from .env

📄 Found import file: import-users.csv
   Parsed 5 user records

🔍 Validating CSV data...
   ✅ All records valid

🔌 Connecting to database...
   ✅ Connected (postgresql)

🔐 Loading existing passwords...
   Found 23 existing password entries

👥 Processing users...
----------------------------------------------------------------------
   🔑 Generated new password for: john.doe@example.com
      ✓ Linked to instructor: project.partner.john_doe
   ✅ Created user: John Doe (john.doe@example.com)
   
   ♻️  Reusing password for: jane.smith@example.com
   ✅ Created user: Jane Smith (jane.smith@example.com)
   
   ⏭️  Skipping existing user: existing@example.com

💾 Saving passwords to PASSWORDS.csv...
   ✅ Updated PASSWORDS.csv (2 entries)

📦 Archiving import file...
   ✅ Archived to: 2025-10-28T15-30-45_import-users.csv

======================================================================
📊 IMPORT SUMMARY
======================================================================
Total rows processed:     5
New users created:        2
Existing users skipped:   3
New passwords generated:  1
Passwords reused:         1
Errors:                   0

======================================================================

⚠️  IMPORTANT: Password Distribution
   New passwords have been added to PASSWORDS.csv
   Location: /opt/crearis/data/PASSWORDS.csv
   Action required:
   1. Securely copy PASSWORDS.csv
   2. Distribute passwords to new users
   3. Instruct users to change passwords on first login

   See docs/PASSWORD_SYSTEM.md for details

✅ Import complete!
```

## Error Handling

### Validation Errors

```
❌ Validation errors found:
   Row 2: Missing required field 'sysmail'
   Row 3: Invalid email format for 'sysmail': invalid-email
   Row 4: Invalid role 'superuser' (must be: admin, base, or user)
   Row 5: Invalid language 'fr' (must be: de, en, or cz)
```

**Fix**: Correct the CSV file and re-run

### Duplicate Users

```
⏭️  Skipping existing user: john.doe@example.com
```

**Behavior**: Existing users are skipped, no update occurs

### Database Errors

```
❌ Error processing jane.smith@example.com: unique constraint violation
```

**Fix**: Check database logs, ensure email is unique

## Instructor Handling

### Auto-Creation

If `instructor_id/xmlid` is provided and instructor doesn't exist:

1. Extracts first slug from xmlid: `project.partner.john` → `project`
2. Checks if `project` is a regio project
3. Creates instructor with:
   - `xmlid`: `project.partner.john`
   - `name`: User's username
   - `email`: User's extmail or sysmail
   - `regio_id`: Linked regio project (if found)
   - `isbase`: 0

### Linking Existing

If instructor with xmlid already exists:
- Links user to existing instructor
- No duplication occurs

## Password System Integration

### Generation

- **Algorithm**: 10 random alphanumeric characters
- **Entropy**: ~60 bits (62^10 combinations)
- **Hashing**: bcrypt with 10 rounds

### Storage

```csv
sysmail,extmail,password
"admin@theaterpedia.org","","VaCee1xazZ"
"john.doe@example.com","","p6KMnGtKsP"
```

### Merging

New passwords are **appended** to existing PASSWORDS.csv:
- System users preserved (from migration 021)
- CSV users preserved (from migration 022)
- New import users added
- Duplicates prevented (by sysmail key)

## Security Considerations

### File Permissions

```bash
# Import directory
chmod 700 /opt/crearis/data/import

# PASSWORDS.csv
chmod 600 /opt/crearis/data/PASSWORDS.csv

# Archived files
chmod 600 /opt/crearis/data/import/archive/*.csv
```

### Password Distribution

1. **Copy securely**:
   ```bash
   scp -P 22 user@server:/opt/crearis/data/PASSWORDS.csv ./
   ```

2. **Encrypt if needed**:
   ```bash
   gpg --encrypt --recipient admin@example.com PASSWORDS.csv
   ```

3. **Use secure channels**:
   - Encrypted email
   - Password manager (1Password, Bitwarden)
   - Secure file sharing (Tresorit, SpiderOak)

4. **Clean up**:
   ```bash
   # After distribution, optionally delete/encrypt
   rm /opt/crearis/data/PASSWORDS.csv
   # Or encrypt
   gpg --encrypt --recipient admin@example.com /opt/crearis/data/PASSWORDS.csv
   ```

## Troubleshooting

### Issue: "Import file not found"

**Cause**: CSV file not in correct location

**Fix**:
```bash
# Create import directory
mkdir -p /opt/crearis/data/import
chmod 700 /opt/crearis/data/import

# Place CSV file
mv your-file.csv /opt/crearis/data/import/import-users.csv
```

### Issue: "tsx not found"

**Cause**: tsx not installed globally

**Fix**:
```bash
# Install tsx globally
npm install -g tsx

# Or use npx
npx tsx server/scripts/import-users.ts
```

### Issue: "Cannot connect to database"

**Cause**: Database not accessible or .env incorrect

**Fix**:
```bash
# Check PostgreSQL
systemctl status postgresql

# Verify .env
cat /opt/crearis/source/.env | grep DB_

# Test connection
psql -h localhost -U crearis_admin -d crearis_db -c '\q'
```

### Issue: "Archive file already exists"

**Cause**: Timestamp collision (unlikely)

**Fix**: Manually rename the file in archive/ directory

### Issue: "Permission denied" when writing PASSWORDS.csv

**Cause**: Incorrect file ownership or permissions

**Fix**:
```bash
# Fix ownership
chown pruvious:pruvious /opt/crearis/data/PASSWORDS.csv

# Fix permissions
chmod 600 /opt/crearis/data/PASSWORDS.csv
```

## Shared Code Architecture

### Utilities Module

`server/utils/user-import-utils.ts` contains:

- `generateRandomPassword()` - Password generation
- `parseCSV()` - CSV parsing
- `loadExistingPasswords()` - Load PASSWORDS.csv
- `savePasswords()` - Save PASSWORDS.csv
- `processUserPassword()` - Password logic
- `processUserInstructor()` - Instructor logic
- `importUser()` - Database insertion
- `validateUserRow()` - Validation

### Usage

**Migration 022** (CSV seeding):
```typescript
import { parseCSV, loadExistingPasswords, ... } from '../../utils/user-import-utils'
```

**Import Script**:
```typescript
const { parseCSV, loadExistingPasswords, ... } = await import('../utils/user-import-utils.js')
```

### Benefits

- ✅ Consistent behavior across migrations and imports
- ✅ Single source of truth for password generation
- ✅ Easier maintenance and testing
- ✅ DRY principle

## Testing

### Local Testing (Development)

```bash
# Create test CSV
cat > server/data/import/import-users.csv << 'EOF'
sysmail,extmail,username,password,role,lang,instructor_id/xmlid
"test@example.com","","Test User","","user","de",""
EOF

# Run import
tsx server/scripts/import-users.ts

# Verify
psql -d crearis_db -c "SELECT * FROM users WHERE sysmail='test@example.com';"
grep "test@example.com" server/data/PASSWORDS.csv
```

### Production Testing (Staging)

```bash
# Test on staging server first
ssh user@staging-server
sudo -u pruvious bash
cd /opt/crearis/source

# Create test import
echo 'sysmail,extmail,username,password,role,lang,instructor_id/xmlid' > server/data/import/import-users.csv
echo '"staging-test@example.com","","Staging Test","","user","de",""' >> server/data/import/import-users.csv

# Run import
bash scripts/import-users.sh

# Verify
tail -5 /opt/crearis/data/PASSWORDS.csv
ls -la /opt/crearis/data/import/archive/
```

## Rollback

If import creates incorrect users:

```bash
# Option 1: Delete specific users (careful!)
psql -d crearis_db -c "DELETE FROM users WHERE sysmail IN ('john@example.com', 'jane@example.com');"

# Option 2: Restore database backup
cd /opt/crearis/backups
psql -d crearis_db < backup-before-import.sql

# Option 3: Re-import from archive with corrections
cd /opt/crearis/data/import/archive
cp 2025-10-28T15-30-45_import-users.csv ../import-users.csv
# Edit import-users.csv to correct errors
cd /opt/crearis/source
bash scripts/import-users.sh
```

## Monitoring

### Check Import History

```bash
# List archived imports
ls -lh /opt/crearis/data/import/archive/

# Count users per import
for file in /opt/crearis/data/import/archive/*.csv; do
    echo "$file: $(tail -n +2 "$file" | wc -l) users"
done
```

### Audit New Users

```bash
# Users created today
psql -d crearis_db -c "
    SELECT sysmail, username, created_at 
    FROM users 
    WHERE created_at::date = CURRENT_DATE
    ORDER BY created_at DESC;
"

# Recent password entries
tail -20 /opt/crearis/data/PASSWORDS.csv
```

## Best Practices

1. **Backup First**: Always backup database before bulk import
2. **Test in Staging**: Test CSV file on staging server first
3. **Small Batches**: Import 10-50 users at a time for easier rollback
4. **Verify Data**: Double-check CSV format and data before import
5. **Secure Passwords**: Distribute passwords via encrypted channels only
6. **Archive Logs**: Keep import archives for audit trail
7. **Monitor Errors**: Check error messages carefully
8. **Clean Up**: Remove PASSWORDS.csv after distribution (or encrypt it)

## Integration with Migrations

The import system uses the same logic as:
- **Migration 021**: System users creation
- **Migration 022**: CSV users import

This ensures:
- Consistent password generation
- Same validation rules
- Unified PASSWORDS.csv format
- Compatible data structure

## Summary

✅ **Production-ready** bulk user import system  
✅ **Secure** random password generation  
✅ **Idempotent** safe to re-run  
✅ **Auditable** automatic file archiving  
✅ **Consistent** shared code with migrations  
✅ **Flexible** instructor auto-creation/linking  
✅ **Documented** comprehensive guide  

---

**See Also**:
- [PASSWORD_SYSTEM.md](./PASSWORD_SYSTEM.md) - Password distribution details
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Server deployment
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database structure
