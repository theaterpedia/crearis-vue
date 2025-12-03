# Users Email Format Migration

**Date**: October 21, 2025  
**Migration**: 016_users_email_format  
**Version**: 0.0.9

## Overview

This migration enforces email format for all `users.id` values and migrates existing user IDs to use `@theaterpedia.org` domain.

## Changes

### 1. Email Format Constraint

Added PostgreSQL CHECK constraint to `users.id`:
```sql
ALTER TABLE users 
ADD CONSTRAINT users_id_email_format 
CHECK (id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
```

### 2. User ID Migration

Six default users migrated from simple names to email format:

| Old ID    | New ID                       | Role  |
|-----------|------------------------------|-------|
| admin     | admin@theaterpedia.org       | admin |
| base      | base@theaterpedia.org        | base  |
| project1  | project1@theaterpedia.org    | user  |
| project2  | project2@theaterpedia.org    | user  |
| tp        | tp@theaterpedia.org          | user  |
| regio1    | regio1@theaterpedia.org      | user  |

### 3. Role Constraint Update

Updated `users.role` CHECK constraint in migration 015 to include 'base' role:
```sql
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK(role IN ('user', 'admin', 'base'))
```

### 4. Foreign Key Updates

All foreign key references automatically updated:
- `domains.admin_user_id` → users(id)
- `projects.owner_id` → users(id)
- `events.user_id` → users(id)

## Files Modified

### Migrations

1. **`015_domain_system_and_extensions.ts`**
   - Updated `defaultUsers` array to use email format IDs
   - Added `tp` and `regio1` users to seed list
   - Updated role constraint to include 'base'

2. **`016_users_email_format.ts`** (NEW)
   - ID mapping and migration logic
   - Foreign key constraint management
   - Email format validation

3. **`migrations/index.ts`**
   - Registered migration 016

### Seed Scripts

1. **`server/database/seed.ts`**
   - Updated `seedUsersAndProjects()` to generate email format IDs:
     ```typescript
     const userId = `${user.name}@theaterpedia.org`
     ```

## Migration Process

The migration follows this sequence:

1. **Create ID mappings** - Define old → new ID conversions
2. **Update foreign keys** - Update all referencing tables
3. **Drop constraints** - Temporarily remove FK constraints
4. **Update user IDs** - Migrate IDs in users table
5. **Add validation** - Add email format CHECK constraint
6. **Restore constraints** - Recreate FK constraints

## Validation

### Email Format Test
```sql
-- ❌ This should fail:
INSERT INTO users (id, username, password, role)
VALUES ('invaliduser', 'test', 'pass', 'user');
-- ERROR: violates check constraint "users_id_email_format"

-- ✅ This should succeed:
INSERT INTO users (id, username, password, role)
VALUES ('user@example.com', 'test', 'pass', 'user');
```

### Verification Query
```sql
SELECT id, username, role 
FROM users 
ORDER BY role, username;
```

Expected output:
```
            id             | username | role  
---------------------------+----------+-------
 admin@theaterpedia.org    | admin    | admin
 base@theaterpedia.org     | base     | base
 project1@theaterpedia.org | project1 | user
 project2@theaterpedia.org | project2 | user
 regio1@theaterpedia.org   | regio1   | user
 tp@theaterpedia.org       | tp       | user
```

## Rollback

To rollback this migration:
```bash
# Manually run the down() method from migration 016
# This will reverse ID mappings and remove email constraint
```

## Impact on Application Code

### Authentication

Update login logic to accept either username or email as identifier:
```typescript
// Find user by username (email is stored in id field)
const user = await db.get(
  'SELECT * FROM users WHERE username = $1',
  [username]
)
```

### User Creation

New users must be created with email format IDs:
```typescript
const userId = `${username}@theaterpedia.org`
await db.run(
  'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
  [userId, username, hashedPassword, role]
)
```

### Session Management

Sessions should store email format user ID:
```typescript
session.userId = 'username@theaterpedia.org'
```

## Benefits

1. **Uniqueness** - Email format ensures globally unique IDs
2. **Standards** - Follows common practice for user identifiers
3. **Integration** - Easier integration with email-based systems
4. **Validation** - Built-in format validation at database level
5. **Scalability** - Supports multi-domain users in future

## Future Considerations

- Support for multiple email domains (not just @theaterpedia.org)
- Email verification workflow
- User email change workflow
- Integration with external auth providers (OAuth, SAML)

## Testing

All migrations completed successfully:
```
✅ Migration 015 completed
✅ Migration 016 completed: Users now use email format IDs
✅ Migrations complete: 15 migration(s) run
```

Foreign key relationships verified:
```
Projects with owners:
 project_id | username |         owner_id          
------------+----------+---------------------------
 tp         | tp       | project1@theaterpedia.org
 regio1     | regio1   | project2@theaterpedia.org
```
