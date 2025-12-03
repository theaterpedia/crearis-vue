# Migration 022: CSV-Based Seeding Implementation

## Overview

Successfully implemented CSV-based seeding system extension for users and projects tables, reorganized as "root" fileset. Migration 022 now has two chapters:

- **Chapter 1: Root Fileset** (ACTIVE) - Seeds users and projects
- **Chapter 2: Base Fileset** (DEACTIVATED) - Seeds events, posts, locations, instructors, participants

## Implementation Summary

### 1. Created Root Fileset

**Directory**: `/server/data/root/`

**Files Created:**
- `users.csv` - 17 demo users with hashed passwords
- `projects.csv` - 15 demo projects with owner/regio references
- `PASSWORDS.md` - Cleartext password reference (gitignored)

### 2. CSV Structure

#### users.csv
```csv
sysmail,username,password,role,lang
"rosalin.hertrich@dasei.eu","Rosalin Hertrich","$2a$10$...","user","de"
```

**Fields:**
- `sysmail`: Email address (unique identifier)
- `username`: Display name
- `password`: bcrypt hashed (cost factor: 10)
- `role`: `user` (all demo users)
- `lang`: `de` (all German)

**Password Pattern:** `firstname2025` (e.g., `rosalin2025`, `hans2025`)

#### projects.csv
```csv
domaincode,name,heading,type,status,owner_id/sysmail,description,regio/domaincode,theme,teaser,cimg
"dasei","DASEI","DASEI","project","active","hans.doenitz@theaterpedia.org","...",...
```

**Foreign Key Resolution:**
- `owner_id/sysmail`: Resolves email → users.id
- `regio/domaincode`: Resolves domaincode → projects.id (self-reference)

### 3. Migration 022 Structure

#### Chapter 1: Root Fileset (ACTIVE)

**Process:**
1. Read `users.csv` and `projects.csv` from root fileset
2. Parse CSV with custom parseCSV function
3. Seed users with ON CONFLICT (idempotent)
4. Build owner lookup map (sysmail → user.id)
5. Seed projects with FK resolution:
   - Lookup user.id by sysmail for owner_id
   - Lookup projects.id by domaincode for regio

**Results:**
- ✅ 17 users seeded
- ✅ 15 projects seeded
- ✅ Foreign keys correctly resolved
- ✅ Passwords work (bcrypt hashed, tested)

#### Chapter 2: Base Fileset (DEACTIVATED)

Wrapped existing base fileset seeding code in comment block:
```typescript
/* CHECK:base - DEACTIVATED Chapter 2 - Uncomment to enable base fileset seeding
...
*/
```

**Note:** Marked with `CHECK:base` comments for future refactoring.

### 4. Configuration Changes

#### server/settings.ts

Added root fileset to registry:
```typescript
export const filesets: Record<string, FilesetConfig> = {
    root: {
        id: 'root',
        name: 'Root Dataset',
        description: 'Core seed data (users, projects)',
        path: path.resolve(process.cwd(), 'server/data/root'),
        files: ['users.csv', 'projects.csv'],
        isDefault: false
    },
    base: { ... }
}
```

#### server/database/config.ts

Added dotenv loading to fix migration runner:
```typescript
import { config as loadEnv } from 'dotenv'
loadEnv()
```

#### server/database/migrations/run.ts

Added dotenv import (redundant after config.ts fix, but harmless):
```typescript
import { config as loadEnv } from 'dotenv'
loadEnv()
```

### 5. Test Results

**Test Script:** `test-migration-022.ts`

**Before Migration:**
- 6 users (system users from migration 021)
- 2 projects (tp, regio1)

**After Migration:**
- 23 users total (6 system + 17 demo)
- 17 projects total (2 system + 15 demo)

**Verification:**
- ✅ All users seeded with correct emails, usernames, roles, lang
- ✅ All projects seeded with correct domaincode, name, type, status
- ✅ owner_id correctly resolved (email → user.id)
- ✅ regio correctly resolved for regio projects (domaincode → project.id)
- ✅ Passwords verified working (bcrypt compareSync)

**Sample Data:**

Users:
```
rosalin.hertrich@dasei.eu        | Rosalin Hertrich    | user | de
hans.doenitz@theaterpedia.org    | Hans Dönitz         | user | de
nina.roob@utopia-in-action.de    | Nina Roob           | user | de
```

Projects:
```
dasei      | DASEI               | project | active | hans.doenitz@theaterpedia.org
augsburg   | Augsburg            | regio   | active | kathrin.jung@theaterpedia.org
oberland   | Regio Oberland      | regio   | demo   | sabine.menne@theaterpedia.org
```

## Files Modified

1. **server/database/migrations/022_seed_csv_data.ts**
   - Reorganized into Chapter 1 (root) and Chapter 2 (base)
   - Added root fileset seeding logic
   - Deactivated Chapter 2
   - Added FK resolution for owner_id and regio

2. **server/settings.ts**
   - Added root fileset to registry

3. **server/database/config.ts**
   - Added dotenv loading for environment variables

4. **server/database/migrations/run.ts**
   - Added dotenv import (redundant backup)

5. **.gitignore**
   - Added `server/data/PASSWORDS.md`

## Files Created

1. **server/data/root/users.csv** - 17 demo users
2. **server/data/root/projects.csv** - 15 demo projects
3. **server/data/PASSWORDS.md** - Cleartext password reference (gitignored)
4. **test-migration-022.ts** - Test script for migration validation

## Password Reference

**Format:** `firstname2025`

**Examples:**
- rosalin.hertrich@dasei.eu: `rosalin2025`
- hans.doenitz@theaterpedia.org: `hans2025`
- kathrin.jung@theaterpedia.org: `kathrin2025`

**Full List:** See `server/data/PASSWORDS.md` (gitignored)

## Usage

### Run Migration

```bash
# Rebuild database (includes all migrations)
pnpm db:rebuild

# Or run migrations incrementally
pnpm db:migrate
```

### Test Migration 022 Only

```bash
pnpm exec tsx test-migration-022.ts
```

### Activate Chapter 2 (Base Fileset)

To re-enable base fileset seeding:
1. Open `server/database/migrations/022_seed_csv_data.ts`
2. Uncomment Chapter 2 code block (lines ~208-756)
3. Run migration

## Notes

- ✅ Migration is idempotent (uses ON CONFLICT)
- ✅ Can be re-run safely
- ✅ Foreign keys correctly resolved
- ✅ Passwords hashed with bcrypt (cost: 10)
- ✅ Chapter 2 (base) deactivated for future refactoring
- ✅ CHECK:base comments mark areas for future work

## Future Work

1. Refactor Chapter 2 base fileset seeding after root fileset testing
2. Consider extracting FK resolution logic to shared utility
3. Add validation for CSV data integrity
4. Consider adding seed data versioning

## Completion Status

**✅ COMPLETE** - All requirements met:
- ✅ CSV-based seeding for users and projects
- ✅ Password generation with cleartext report
- ✅ Root fileset created and registered
- ✅ Migration 022 reorganized (Chapter 1 + Chapter 2)
- ✅ Chapter 2 deactivated
- ✅ Tested and verified
- ✅ CHECK:base comments added
- ✅ Foreign key resolution working
- ✅ Idempotent (ON CONFLICT handling)
