# Project Users Added - tp and regio1

## Summary

Successfully added `tp` and `regio1` user accounts to the database with password `password123`.

## What Was Done

### 1. Created Database Script
**File**: `server/database/add-project-users.ts`

Adds missing project users that exist in the `projects` table but not in the `users` table.

### 2. Added Users

**tp**:
- Username: `tp`
- Password: `password123` (bcrypt hashed)
- Role: `user`
- ID: `tp` (matches project ID)

**regio1**:
- Username: `regio1`
- Password: `password123` (bcrypt hashed)
- Role: `user`
- ID: `regio1` (matches project ID)

### 3. Verification

✅ Both projects exist in `projects` table (role: 'project')
✅ Both users now exist in `users` table (role: 'user')
✅ IDs match between projects and users tables

## Current Database State

### Projects Table (7 total):
- admin (admin)
- base (base)
- project1 (project)
- project2 (project)
- regio1 (project) ← Added
- testproject (project)
- tp (project) ← Added

### Users Table (6 total):
- admin (admin)
- base (user)
- project1 (user)
- project2 (user)
- regio1 (user) ✅ **NEW**
- tp (user) ✅ **NEW**

## Login Credentials

From `projectnames_and_users.csv`:

| Username | Password | Role | Status |
|----------|----------|------|--------|
| admin | password123 | admin | ✅ Exists |
| base | password123 | user | ✅ Exists |
| project1 | password123 | user | ✅ Exists |
| project2 | password123 | user | ✅ Exists |
| tp | password123 | user | ✅ **ADDED** |
| regio1 | password123 | user | ✅ **ADDED** |

## How to Use

### Login as tp:
```
Username: tp
Password: password123
```

### Login as regio1:
```
Username: regio1
Password: password123
```

## Script Usage

### Check Database State:
```bash
DATABASE_TYPE=postgresql \
DB_NAME=crearis_admin_dev \
DB_USER=crearis_admin \
DB_PASSWORD=7uqf9nE0umJmMMo \
npx tsx server/database/check-database.ts
```

### Add Users (if needed again):
```bash
DATABASE_TYPE=postgresql \
DB_NAME=crearis_admin_dev \
DB_USER=crearis_admin \
DB_PASSWORD=7uqf9nE0umJmMMo \
npx tsx server/database/add-project-users.ts
```

## Technical Details

### Role Mapping
- **Projects table**: Uses role `'project'` for project accounts
- **Users table**: Uses role `'user'` for project accounts
- **Migration 014**: Created both projects with role `'project'`
- **This fix**: Created users with role `'user'` to match existing pattern

### ID Matching
Users inherit the same ID as their corresponding project:
```
projects.id = 'tp' → users.id = 'tp'
projects.id = 'regio1' → users.id = 'regio1'
```

### Password Hashing
Passwords are hashed with bcrypt (salt rounds: 10) before storage:
```typescript
const hashedPassword = await bcrypt.hash('password123', 10)
```

## Notes

- ✅ No database reseed required
- ✅ Both projects exist from migration 014
- ✅ Users now match the projects
- ✅ Passwords match the CSV specification
- ✅ Ready for login immediately

## Testing

Users can now log in at `/login`:
1. Navigate to the login page
2. Enter username: `tp` or `regio1`
3. Enter password: `password123`
4. Should authenticate successfully

## Files Created

1. `server/database/add-project-users.ts` - Script to add users
2. `server/database/check-database.ts` - Script to verify database state

Both scripts support PostgreSQL and can be run with environment variables.
