# Project Role Management - Troubleshooting

**Date**: October 21, 2025

## Fixed Issues

### 1. Import Path Error in domains/check.get.ts

**Error Message**:
```
[backend] "~/server/database/init" is imported by "server/api/domains/check.get.ts", but could not be resolved
[backend] ERROR  Worker error: Cannot find package '~' imported from /home/persona/crearis/demo-data/.nitro/dev/index.mjs
```

**Root Cause**:
The file used an alias import path `~/server/database/init` which Nitro cannot resolve in server-side API routes.

**Solution**:
Changed import from:
```typescript
import { getDb } from '~/server/database/init'
```

To relative path:
```typescript
import { getDb } from '../../database/init'
```

### 2. Incorrect Export Name in domains/check.get.ts

**Error Message**:
```
[backend] [nitro] ERROR RollupError: "getDb" is not exported by "server/database/init.ts"
```

**Root Cause**:
The file tried to import `getDb` function, but `database/init.ts` only exports `db` (the database instance).

**Solution**:
Changed from:
```typescript
import { getDb } from '../../database/init'

export default defineEventHandler(async (event) => {
    const db = getDb()
    // ...
})
```

To direct import:
```typescript
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    // Use db directly
    // ...
})
```

### 3. PostgreSQL Constraint Already Exists (Migration 016)

**Error Message**:
```
[uncaughtException] error: constraint "users_id_email_format" for relation "users" already exists
code: '42710'
```

**Root Cause**:
Migration 016 tried to add a constraint that was already present in the database (from a previous partial run or manual addition).

**Solution**:
Made the migration idempotent by dropping the constraint before adding it:

```typescript
// Drop existing constraint first (if exists)
await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_email_format`)

// Then add it
await db.exec(`
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_format 
    CHECK (id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
`)
```

**Prevention**:
All migrations should be idempotent - safe to run multiple times. Use:
- `DROP CONSTRAINT IF EXISTS` before `ADD CONSTRAINT`
- `DROP TABLE IF EXISTS` before `CREATE TABLE`
- `CREATE TABLE IF NOT EXISTS` for new tables
- Check for existence before inserting seed data

### 4. Missing H3 Imports (defineEventHandler not defined)

**Error Message**:
```
[uncaughtException] ReferenceError: defineEventHandler is not defined
```

**Root Cause**:
Server API file is using H3 functions without importing them. Nitro provides auto-imports for most code, but sometimes explicit imports are needed.

**Solution**:
Add explicit imports from `h3`:

```typescript
// ❌ WRONG - missing imports
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    // ...
})

// ✅ CORRECT - explicit imports
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    // ...
})
```

**Common H3 Imports**:
```typescript
import { 
    defineEventHandler,  // Required for event handlers
    getQuery,           // For query parameters
    readBody,           // For POST/PUT body
    createError,        // For throwing HTTP errors
    getCookie,          // For reading cookies
    setCookie,          // For setting cookies
    getRouterParam      // For route parameters [id]
} from 'h3'
```

**Pattern**:
Server API files should always use **relative paths** for imports:
- `server/api/auth/*.ts` → `../../database/init`
- `server/api/domains/*.ts` → `../../database/init`  
- `server/api/admin/watch/*.ts` → `../../../database/init`

The `~` alias is for **frontend code only** (src/ directory).

## Import Patterns Reference

### ✅ Correct Server Imports

```typescript
// In server/api/auth/login.post.ts
import { db } from '../../database/init'

// In server/api/domains/check.get.ts
import { getDb } from '../../database/init'

// In server/api/admin/watch/execute.post.ts
import { db } from '../../../database/init'

// Import sessions between auth files
import { sessions } from './login.post'
```

### ✅ Correct Frontend Imports

```typescript
// In src/components/ProjectToggle.vue
import { useAuth } from '@/composables/useAuth'

// In src/views/ProjectSettings.vue
import { ref } from 'vue'
```

### ❌ Incorrect Server Imports

```typescript
// WRONG - Don't use ~ alias in server files
import { db } from '~/server/database/init'

// WRONG - Don't use @ alias in server files
import { db } from '@/server/database/init'
```

## Database Import Consistency

All server API files now use consistent imports from `database/init`:

### Correct Pattern
```typescript
// Import the database instance directly
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    // Use db directly - no getDb() call needed
    const result = await db.get('SELECT * FROM users WHERE id = ?', [userId])
})
```

### What database/init Exports

The `server/database/init.ts` file exports:
```typescript
export { db }        // Named export - use this
export default db    // Default export - also works
```

**Important**: There is NO `getDb()` function in `database/init`. The database is already initialized and ready to use.

### Legacy Patterns

Some older files may use `database/db`:
```typescript
import { db } from '../../database/db'
```

Both work, but prefer `database/init` for consistency as it includes automatic migration handling.

## Verification Steps

After fixing import paths:

1. **Check build output**:
   ```bash
   pnpm dev
   ```
   
2. **Look for these success messages**:
   ```
   [backend] ✔ Nitro Server built with rollup
   [backend] ➜ Listening on: http://localhost:3000/
   ```

3. **No longer see**:
   ```
   ERROR  Worker error: Cannot find package '~'
   ```

## Common Import Mistakes

### Mistake 1: Using ~ in server files
```typescript
// ❌ WRONG
import { db } from '~/server/database/init'

// ✅ CORRECT
import { db } from '../../database/init'
```

### Mistake 2: Wrong relative path depth
```typescript
// In server/api/auth/login.post.ts

// ❌ WRONG (too shallow)
import { db } from '../database/init'

// ✅ CORRECT
import { db } from '../../database/init'
```

### Mistake 3: Mixing import styles
```typescript
// Pick one style and stick with it

// Style A: Named export
import { db } from '../../database/init'

// Style B: Function export
import { getDb } from '../../database/init'
const db = getDb()
```

## Related Files

Files checked and verified:
- ✅ `server/api/auth/login.post.ts` - Uses `../../database/init`
- ✅ `server/api/auth/set-project.post.ts` - Uses `../../database/db`
- ✅ `server/api/auth/session.get.ts` - Imports sessions from `./login.post`
- ✅ `server/api/domains/check.get.ts` - **Fixed** to use `../../database/init` with `{ db }` import
- ✅ `server/api/locations/index.get.ts` - Uses `../../database/init`
- ✅ `server/api/public-users/index.get.ts` - Uses `../../database/init`

## Common Errors and Solutions

### Error: "getDb is not exported"
```
RollupError: "getDb" is not exported by "server/database/init.ts"
```

**Cause**: Trying to import a function that doesn't exist.

**Solution**: Import `db` directly:
```typescript
// ❌ WRONG - getDb doesn't exist
import { getDb } from '../../database/init'
const db = getDb()

// ✅ CORRECT - import db directly
import { db } from '../../database/init'
```

### Error: "Cannot find package '~'"
```
ERROR Worker error: Cannot find package '~' imported from ...
```

**Cause**: Using `~` alias in server files.

**Solution**: Use relative paths:
```typescript
// ❌ WRONG - ~ alias doesn't work in server
import { db } from '~/server/database/init'

// ✅ CORRECT - use relative path
import { db } from '../../database/init'
```

### Error: "constraint already exists"
```
error: constraint "users_id_email_format" for relation "users" already exists
code: '42710'
```

**Cause**: Migration tried to create a constraint that already exists.

**Solution**: Migrations should be idempotent:
```typescript
// ❌ WRONG - fails if constraint exists
await db.exec(`
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_format 
    CHECK (...)
`)

// ✅ CORRECT - drop first, then add
await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_email_format`)
await db.exec(`
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_format 
    CHECK (...)
`)
```

### Error: "defineEventHandler is not defined"
```
[uncaughtException] ReferenceError: defineEventHandler is not defined
```

**Cause**: Missing H3 imports in server file.

**Solution**: Add explicit imports:
```typescript
// ❌ WRONG - missing imports
export default defineEventHandler(async (event) => {

// ✅ CORRECT - import from h3
import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
```

## Prevention

To avoid this issue in future:

1. **ESLint Rule** (if available):
   ```json
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["~/server/*"]
       }]
     }
   }
   ```

2. **Code Review Checklist**:
   - [ ] No `~/` imports in `server/` directory
   - [ ] No `@/` imports in `server/` directory
   - [ ] Relative paths use correct depth (`../../`)

3. **Template for New Files**:
   ```typescript
   // server/api/[feature]/[action].ts
   import { defineEventHandler } from 'h3'
   import { db } from '../../database/init'
   
   export default defineEventHandler(async (event) => {
       // Your code here
   })
   ```

## Additional Resources

- [Nitro Documentation - Auto Imports](https://nitro.unjs.io/guide/auto-imports)
- [H3 Event Handler Patterns](https://h3.unjs.io/guide/event-handler)
- Project docs: `docs/core/PROJECT_ROLE_MANAGEMENT.md`

---

**Status**: ✅ Resolved  
**Impact**: Server now starts correctly  
**Test**: Run `pnpm dev` and verify no import errors
