# Database Import Quick Reference

**Last Updated**: October 21, 2025

## TL;DR - Copy This Pattern

```typescript
// In any server/api/**/*.ts file:
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    // Use db directly - it's already initialized
    const result = await db.get('SELECT * FROM table WHERE id = ?', [id])
    return result
})
```

## Required Imports for Server Files

### H3 Framework (Always needed)
```typescript
import { 
    defineEventHandler,  // Required for all API routes
    getQuery,           // GET request query params
    readBody,           // POST/PUT request body
    createError,        // Throw HTTP errors
    getCookie,          // Read cookies
    setCookie,          // Set cookies
    getRouterParam      // Route parameters like [id]
} from 'h3'
```

### Database (When using database)
```typescript
import { db } from '../../database/init'
```

## Path Depth by Location

```typescript
// In server/api/auth/*.ts
import { db } from '../../database/init'

// In server/api/domains/*.ts
import { db } from '../../database/init'

// In server/api/admin/*.ts
import { db } from '../../database/init'

// In server/api/admin/watch/*.ts
import { db } from '../../../database/init'

// In server/api/admin/watch/db/*.ts
import { db } from '../../../../database/init'
```

## What's Exported from database/init

```typescript
// ✅ Available exports:
export { db }        // Named export (recommended)
export default db    // Default export (also works)

// ❌ NOT available:
export { getDb }     // Does NOT exist
```

## Common Mistakes

### ❌ Wrong: Missing H3 imports
```typescript
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    // ReferenceError: defineEventHandler is not defined
})
```

### ✅ Correct: Import from h3
```typescript
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    // Works correctly
})
```

### ❌ Wrong: Using ~ alias
```typescript
import { db } from '~/server/database/init'
```

### ❌ Wrong: Trying to call getDb()
```typescript
import { getDb } from '../../database/init'
const db = getDb()
```

### ❌ Wrong: Using @ alias
```typescript
import { db } from '@/server/database/init'
```

### ✅ Correct: Direct import with relative path
```typescript
import { db } from '../../database/init'
```

## Database Methods

```typescript
import { db } from '../../database/init'

// Query single row
const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])

// Query multiple rows
const users = await db.all('SELECT * FROM users WHERE role = ?', ['admin'])

// Execute (INSERT, UPDATE, DELETE)
await db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email])

// With error handling
try {
    const result = await db.get('SELECT * FROM projects WHERE id = ?', [id])
    if (!result) {
        throw createError({ statusCode: 404, message: 'Not found' })
    }
    return result
} catch (error) {
    throw createError({ 
        statusCode: 500, 
        message: `Database error: ${error.message}` 
    })
}
```

## IDE Autocomplete Setup

If your IDE doesn't recognize `db` exports, add this to `tsconfig.json`:

```json
{
    "compilerOptions": {
        "moduleResolution": "bundler",
        "types": ["node"]
    }
}
```

## Still Getting Errors?

1. **Check your path depth**: Count `../` - should match folder depth
2. **Verify the file location**: `server/api/` + your folders
3. **Restart dev server**: `pnpm dev` after fixing imports
4. **Check for typos**: `database/init` not `database/int` or `database/init.ts`

## Testing Your Import

Run this command to verify your server file compiles:

```bash
# From project root
pnpm dev
```

Look for:
```
✅ [nitro] ✔ Nitro Server built with rollup
✅ [nitro] ➜ Listening on: http://localhost:3000/
```

If you see errors about imports, check this guide again!

---

**Quick Fix Checklist**:
- [ ] Using relative path `../../database/init`?
- [ ] Importing `{ db }` not `{ getDb }`?
- [ ] No `~` or `@` aliases in server files?
- [ ] Correct number of `../` for your location?
- [ ] Dev server restarted after changes?
