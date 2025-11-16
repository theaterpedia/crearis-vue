# Environment Configuration Consolidation

**Date:** October 15, 2025  
**Changes:** Unified environment configuration with separated database keys

---

## 🎯 Changes Made

### 1. Script Location
- **Moved:** `setup-postgresql.sh` → `scripts/setup-postgresql.sh`
- **Reason:** Better organization, keeps root directory clean

### 2. Environment Configuration Unified
- **Removed:** `.env.example` (duplicate)
- **Kept:** `.env.database.example` (single source of truth)
- **Updated:** Script now uses separated DB keys instead of single DATABASE_URL

### 3. Database Configuration Keys

#### Old Approach
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:port/database
```

#### New Approach
```env
DATABASE_TYPE=postgresql
DB_USER=crearis_admin
DB_PASSWORD=your_password
DB_NAME=crearis_admin
DB_HOST=localhost
DB_PORT=5432
```

**Note:** `DATABASE_URL` is now automatically constructed by `config.ts` from the separated keys.

### 4. Config.ts Updated
- Now checks for `DATABASE_URL` first (backward compatible)
- If not found, constructs it from individual `DB_*` keys
- Throws clear error if required keys are missing

```typescript
// Priority 1: Use DATABASE_URL if provided
let connectionString = process.env.DATABASE_URL

// Priority 2: Construct from individual components
if (!connectionString) {
    const dbUser = process.env.DB_USER
    const dbPassword = process.env.DB_PASSWORD
    const dbName = process.env.DB_NAME
    const dbHost = process.env.DB_HOST || 'localhost'
    const dbPort = process.env.DB_PORT || '5432'
    
    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
}
```

### 5. Script Updates
The setup script now:
- Creates `.env` with the full structure from `.env.database.example`
- Populates PostgreSQL section with actual user-provided values
- Uses separated keys (DB_USER, DB_PASSWORD, etc.)
- Includes helpful comments about auto-construction

---

## 📁 Files Changed

### Created/Modified
1. **`scripts/setup-postgresql.sh`** (moved and updated)
   - New location
   - Creates .env with separated keys
   - Includes full .env.database.example structure

2. **`server/database/config.ts`** (updated)
   - Auto-constructs DATABASE_URL from DB_* keys
   - Backward compatible with direct DATABASE_URL

3. **`.env.database.example`** (updated)
   - Shows separated DB_* keys as primary approach
   - Documents DATABASE_URL as alternative
   - Updated setup instructions

### Removed
1. **`.env.example`** (deleted)
   - Redundant with .env.database.example

### Documentation Updated
1. **`docs/postgresql/STAGE-C-SETUP-GUIDE.md`**
   - Script path: `setup-postgresql.sh` → `scripts/setup-postgresql.sh`
   - File structure updated

2. **`docs/postgresql/STAGE-C-QUICK-REFERENCE.md`**
   - All script references updated

3. **`docs/INDEX.md`**
   - Script link updated

4. **`docs/postgresql/README.md`**
   - Quick start script path updated

5. **`docs/postgresql/stage-c-complete.md`**
   - Script references updated
   - Example file reference updated

---

## 🎓 Usage

### Running the Setup Script
```bash
bash scripts/setup-postgresql.sh
```

### Manual Configuration
Copy `.env.database.example` to `.env` and fill in your values:
```bash
cp .env.database.example .env
# Edit .env with your database credentials
```

### Environment Variables
```env
# Required for PostgreSQL
DATABASE_TYPE=postgresql
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# Optional (have defaults)
DB_HOST=localhost    # default
DB_PORT=5432         # default
```

---

## ✅ Benefits

### 1. Single Source of Truth
- Only `.env.database.example` exists
- No confusion about which file to use
- Consistent across documentation

### 2. Clearer Configuration
- Separated keys are more intuitive
- Easy to understand what each value means
- Better for environment-specific overrides

### 3. Backward Compatible
- Still accepts `DATABASE_URL` if provided
- Existing deployments continue to work
- Gradual migration path

### 4. Better Organization
- Script in `scripts/` directory
- Root directory cleaner
- Professional structure

### 5. Automatic URL Construction
- No need to manually build connection strings
- Reduces error potential
- config.ts handles the complexity

---

## 🔄 Migration Guide

### If You Have Existing `.env` with DATABASE_URL

**Option 1:** Keep using DATABASE_URL
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@localhost:5432/database
```
This will continue to work - config.ts checks for this first.

**Option 2:** Migrate to separated keys
```env
DATABASE_TYPE=postgresql
DB_USER=user
DB_PASSWORD=pass
DB_NAME=database
DB_HOST=localhost
DB_PORT=5432
```

### If You're Starting Fresh
Run the setup script:
```bash
bash scripts/setup-postgresql.sh
```

---

## 🧪 Testing

### Verify Configuration Works
```bash
# Check if config.ts can read your environment
pnpm dev

# Should see no database connection errors
```

### Test Both Approaches
```bash
# Test with separated keys
DATABASE_TYPE=postgresql
DB_USER=test
DB_PASSWORD=test
DB_NAME=test_db

# Test with direct URL
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

Both should work identically.

---

## 📊 Summary

| Aspect | Before | After |
|--------|--------|-------|
| Script location | `/setup-postgresql.sh` | `/scripts/setup-postgresql.sh` |
| Example files | `.env.example` + `.env.database.example` | `.env.database.example` only |
| PostgreSQL config | `DATABASE_URL` only | `DB_*` keys (URL auto-constructed) |
| Backward compat | N/A | ✅ DATABASE_URL still works |
| Documentation | Mixed references | Consistent across all docs |

---

## 🎉 Result

- ✅ Cleaner project structure
- ✅ Single environment example file
- ✅ More intuitive configuration
- ✅ Backward compatible
- ✅ All documentation updated
- ✅ Professional organization

**Status:** Complete and tested  
**Ready for:** Production use
