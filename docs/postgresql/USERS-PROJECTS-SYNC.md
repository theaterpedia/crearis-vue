# Users and Projects Table Sync

## Overview

The `projects` and `users` tables are kept in sync, maintaining a 1:1 relationship where each project account is also a user account.

## Architecture

### Current Design (Phase 1)
- **projects table**: Primary source of truth for authentication
- **users table**: Mirror of authentication data from projects
- Both tables contain the same user records with matching IDs

### Future Design (Phase 2)
- **users table**: Primary source of authentication
- **projects table**: Contains actual projects
- **project_members**: Junction table linking users to projects (many-to-many)

## Table Schemas

### projects Table
```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'base', 'project')),
    name TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);
```

### users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'base', 'project', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Synchronization

### Manual Sync

Run the sync script to copy all projects to users:

```bash
DATABASE_TYPE=postgresql \
DB_NAME=crearis_admin_dev \
DB_USER=crearis_admin \
DB_PASSWORD='your_password' \
DB_HOST=localhost \
DB_PORT=5432 \
npx tsx server/database/sync-projects-to-users.ts
```

Or if your `.env` file is configured:

```bash
npx tsx server/database/sync-projects-to-users.ts
```

### What the Sync Does

1. Reads all projects from the `projects` table
2. Clears the `users` table
3. Inserts each project as a user with matching ID
4. Maps `password_hash` (projects) → `password` (users)
5. Preserves `id`, `username`, `role`, and `created_at` fields

### Verification

After sync, both tables should have the same count:

```sql
SELECT COUNT(*) FROM projects;  -- Should return 2
SELECT COUNT(*) FROM users;     -- Should return 2
```

Check that IDs match:

```sql
SELECT p.id, p.username, u.id, u.username
FROM projects p
FULL OUTER JOIN users u ON p.id = u.id
WHERE p.id IS NULL OR u.id IS NULL;
-- Should return 0 rows if fully synced
```

## Roles

### projects Table Roles
- `admin`: Full system access
- `base`: Standard user access
- `project`: Project-specific role (future use)

### users Table Roles
- `admin`: System administrator
- `base`: Base user level
- `project`: Project-specific role
- `user`: Standard user (future use)

**Note**: Both tables now support the same roles for compatibility.

## Current Users

After initial seeding and update:

### PostgreSQL (crearis_admin_dev)

| Username | Role | Password |
|----------|------|----------|
| admin | admin | nE7uq1qFumJNMMom |
| base | base | yl5ScB1x3fnaBQP |
| project1 | project | lXuRK_oAAvMkHLTC |
| project2 | project | xrCQQ77wN0CGJj6e |

### SQLite (demo-data.db)

| Username | Role | Password |
|----------|------|----------|
| admin | admin | nE7uq1qFumJNMMom |
| base | base | yl5ScB1x3fnaBQP |

**Note**: These passwords are bcrypt hashed (10 rounds) before storage.

## Maintenance

### Adding New Users

When adding users, update **both** tables:

**Option 1**: Add to projects first, then run sync script

```typescript
// 1. Add to projects
await db.run(
  `INSERT INTO projects (id, username, password_hash, role, name, status, created_at)
   VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
  [id, username, passwordHash, role, username]
)

// 2. Run sync script (or manually add to users)
```

**Option 2**: Add to both tables in same transaction (future)

### Keeping in Sync

The sync script is **idempotent** - it can be run multiple times safely:
- Clears users table
- Repopulates from projects
- Preserves all IDs and relationships

Run it after:
- Manual database edits
- Data imports
- Testing/development database resets

## Migration Path

### Phase 1 (Current)
- ✅ Projects serves as user accounts
- ✅ Users table mirrors projects for future compatibility
- ✅ Authentication uses projects table

### Phase 2 (Future)
- Separate users from projects
- Create `project_members` junction table
- Migrate authentication to users table
- Allow multiple projects per user
- Clean up redundant fields in projects

## Security Notes

1. **Password Storage**: 
   - Projects: Stored as `password_hash` (bcrypt, 10 rounds)
   - Users: Stored as `password` (same bcrypt hash copied)
   
2. **Never expose** plain text passwords or hashes in logs

3. **Sync script** clears users table - ensure no orphaned sessions

4. **Role validation** is enforced at database level via CHECK constraints

## Troubleshooting

### Constraint Violation Error

If you see `users_role_check` constraint violation:

```bash
psql -U crearis_admin -d crearis_admin_dev -c \
  "ALTER TABLE users DROP CONSTRAINT users_role_check; \
   ALTER TABLE users ADD CONSTRAINT users_role_check \
   CHECK (role IN ('admin', 'base', 'project', 'user'));"
```

### Count Mismatch

If counts don't match after sync:

1. Check for sync script errors in output
2. Verify database connection (check DB_NAME)
3. Run sync script again (idempotent)
4. Check for database triggers or constraints blocking inserts

### Connection Issues

If sync script connects to SQLite instead of PostgreSQL:

- Ensure environment variables are set correctly
- Check that DATABASE_TYPE=postgresql
- Verify DB_NAME, DB_USER, DB_PASSWORD are set
- Use explicit env vars in command line if needed
