# Dotenv + Nitro ESM Compatibility Issue

**Date:** November 10, 2025  
**Status:** Temporary revert to dotenv for testing (next few days)  
**Long-term Goal:** Remove dotenv from Nitro-bundled code

---

## Problem Summary

After fixing filesystem corruption issues (Nov 10), Nitro dev mode failed with:
```
[uncaughtException] ReferenceError: require is not defined in ES module scope
```

**Root Cause:** 
- `dotenv` package uses `require()` internally (CommonJS)
- Nitro bundles server code as ES modules
- When `dotenv.config()` is called at top level in `server/database/config.ts`, it gets bundled into `.output/server/index.mjs`
- The bundled ESM code tries to execute `require()` → Runtime error

---

## Files Fixed (Nov 10)

### 1. `server/database/config.ts`
**Removed:**
```typescript
import { config as loadEnv } from 'dotenv'
loadEnv()
```

**Why:** 
- Nitro automatically loads `.env` files during dev and build
- No need for explicit dotenv call in bundled server code
- Removing this eliminated the `require is not defined` error

### 2. `server/database/backup/update-import.ts`
**Changed:**
```typescript
// OLD (CommonJS pattern - incompatible with ESM)
if (require.main === module) {
    // CLI code
}

// NEW (ESM-compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
    // CLI code
}
```

**Why:** 
- `require.main === module` is CommonJS pattern
- Caused same `require is not defined` error in bundled code
- `import.meta.url` check is ESM equivalent

---

## Temporary Revert (Next Few Days)

**Why Revert:**
- Test database setup requires `dotenv` to load credentials
- `crearis_admin` PostgreSQL user lacks `CREATE DATABASE` permission
- Cannot create `crearis_admin_dev_test` database for vitest
- Tests fail without database connection

**Revert Changes:**
1. Add back dotenv to `server/database/config.ts`
2. Keep comment explaining it's temporary
3. Monitor for return of `require is not defined` error
4. Use this temporary solution only for next few days

---

## Long-Term Solutions (Choose One)

### Option A: PostgreSQL Superuser Access
- Get superuser (postgres) credentials
- Allow automated test database creation
- Script can use `CREATE DATABASE IF NOT EXISTS`
- **Pros:** Clean, automated, no manual steps
- **Cons:** Requires sysadmin access

### Option B: Pre-Create Test Databases
- Manually create test databases once:
  ```bash
  sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev_test;"
  sudo -u postgres psql -c "GRANT ALL ON DATABASE crearis_admin_dev_test TO crearis_admin;"
  ```
- Update `scripts/setup-postgresql.sh` to include test DB creation
- **Pros:** Works with limited permissions
- **Cons:** Manual step, easy to forget

### Option C: Refactor Standalone Scripts
- Keep dotenv OUT of `server/database/config.ts`
- Standalone scripts (migrations/run.ts, import scripts) load dotenv directly
- Nitro-bundled code (API routes, init.ts) uses Nitro's env handling
- **Pros:** Clean separation, no ESM/CommonJS conflicts
- **Cons:** More refactoring, duplicate config logic

**Recommended:** Option B (pre-create test databases) + move toward Option C over time

---

## Technical Details

### Why Nitro Doesn't Need Dotenv

Nitro handles environment variables automatically:
- **Dev mode:** Loads `.env` via Vite
- **Build time:** Inlines env vars at build time
- **Runtime:** Uses `process.env` (already loaded by Node.js)

### When Dotenv IS Needed

Only for **standalone Node.js scripts** run outside Nitro:
- `server/database/migrations/run.ts` (via `pnpm db:migrate`)
- `server/scripts/import-users.ts`
- `check-projects.ts`
- Any `tsx` or `node` commands

These scripts should load dotenv themselves:
```typescript
import { config as loadEnv } from 'dotenv'
loadEnv() // Safe - not bundled by Nitro
```

### Why This Matters

- **Dev workflow:** Corrupted cache → need clean builds → ESM errors break everything
- **Test workflow:** Need credentials → dotenv required → but breaks bundling
- **Production:** Environment vars injected by platform → no dotenv needed

---

## Verification Steps

After implementing long-term solution:

1. **Dev mode works:**
   ```bash
   rm -rf .output .nitro node_modules/.vite
   pnpm dev
   # Should start without "require is not defined" error
   ```

2. **Tests work:**
   ```bash
   pnpm test
   # Should connect to test database
   ```

3. **Standalone scripts work:**
   ```bash
   pnpm db:migrate
   # Should load .env and connect successfully
   ```

4. **Production build works:**
   ```bash
   pnpm build
   node .output/server/index.mjs
   # Should use platform env vars
   ```

---

## Related Issues

- **Nov 10 Network Issues:** Caused filesystem corruption → cache corruption → bundling bugs
- **Cache Cleanup:** `rm -rf .output .nitro node_modules/.vite` fixed circular dependency errors
- **ESM Migration:** Node v20 → v22 requirement pushes toward pure ESM
- **Test Database Permissions:** Limited user prevents automated DB creation

---

## Next Actions

- [ ] Document this issue (✅ Done)
- [ ] Temporarily revert dotenv for testing
- [ ] Choose long-term solution (Option A, B, or C)
- [ ] Implement permanent fix
- [ ] Update deployment guide with test DB setup
- [ ] Remove temporary dotenv revert
