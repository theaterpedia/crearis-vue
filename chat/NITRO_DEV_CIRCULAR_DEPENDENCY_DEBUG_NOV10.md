# Nitro Dev Mode Circular Dependency Debug Report
**Date**: November 10, 2025  
**Issue**: `ReferenceError: Cannot access 'index_get$t' before initialization`  
**Status**: UNRESOLVED - Reverted all attempted fixes

## Problem Description

### Symptoms
- **Dev mode only**: `pnpm run dev` fails with circular dependency errors
- **Production mode works**: `pnpm run build && pnpm run start` runs perfectly
- **Error pattern**: Multiple routes fail with "Cannot access before initialization"
  - `index_get$t` (api/i18n/index.get.ts) - referenced at line 6878, defined at line 11003
  - `session_get$1` (api/auth/session.get.ts)
  - `_id__get$7` (api/projects/[id].get.ts)
  - `index_get$j` (api/projects/index.get.ts)
  - `index_get$7` (api/users/index.get.ts)

### Timeline
- **Nov 9**: System working normally with original database
- **Nov 10 morning**: Switched to cloned database with different IDs → Errors appeared
- **Nov 10 afternoon**: Switched BACK to original database → **Errors persist**

### Root Cause Analysis
This is a **Rollup bundling order bug** in Nitro's development mode:
- Nitro dev uses Rollup in watch mode with viteNode
- Rollup generates ES module wrappers (`const index_get$t = Object.freeze({...})`)
- These wrappers are being generated in the wrong order
- Code tries to reference a variable before it's declared (TDZ - Temporal Dead Zone)

**Key insight**: The fact that errors persist after switching back to the original database proves this is NOT a database issue, but a **code or configuration issue** triggered during the database switch session.

## Strategies Attempted (Nov 10)

### 1. Cache Clearing ❌
**Hypothesis**: Stale Nitro build cache from old database  
**Action**: Deleted `.output`, `.nitro`, `node_modules/.vite`, `node_modules/.cache`  
**Result**: Failed - errors persisted  
**Impact**: None - caches regenerated with same errors

### 2. Session Store Circular Dependency Fix ⚠️
**Hypothesis**: `login.post.ts` exporting `sessions` Map caused circular imports  
**Action**: 
- Created `server/utils/session-store.ts` (42 lines)
- Moved `SessionData`, `ProjectRecord` interfaces
- Moved `sessions` Map
- Moved `setInterval` cleanup (initially conditional, then lazy)
- Updated 6 auth files to import from new module

**Files changed**:
- `server/utils/session-store.ts` (NEW)
- `server/api/auth/login.post.ts` (MODIFIED)
- `server/api/auth/logout.post.ts` (MODIFIED)
- `server/api/auth/session.get.ts` (MODIFIED)
- `server/api/auth/switch-role.post.ts` (MODIFIED)
- `server/api/auth/set-project.post.ts` (MODIFIED)
- `server/api/auth/login/admin.get.ts` (MODIFIED)

**Result**: Partially helpful - reduced one error layer, but core issue remains  
**Impact**: Improved code architecture but didn't solve the bundling bug

### 3. Lazy Initialization of setInterval ⚠️
**Hypothesis**: Top-level `setInterval` runs during Nitro build phase  
**Action**: 
- First: Wrapped in `if (process.env.NODE_ENV !== 'build')`
- Then: Changed to lazy initialization via `ensureSessionCleanup()` function
- Called from `login.post.ts` on first session creation

**Result**: Helped slightly - error moved from line 301 to line 6878  
**Impact**: Eliminated build-time side effects but didn't solve bundling order

### 4. Database Initialization Plugin ⚠️
**Hypothesis**: Database lazy init timing causes module loading issues  
**Action**: Created `server/plugins/00.init-database.ts` to force DB init before routes load  
**Result**: Plugin runs successfully, database initializes, but errors still occur  
**Impact**: Confirmed database initialization is not the problem

**File created**:
```typescript
// server/plugins/00.init-database.ts
import { db } from '../database/init'

export default async function () {
    console.log('🔌 [Plugin] Initializing database...')
    try {
        await db.get('SELECT 1 as test', [])
        console.log('✅ [Plugin] Database initialized successfully')
    } catch (error) {
        console.error('❌ [Plugin] Database initialization failed:', error)
        throw error
    }
}
```

### 5. Disable viteNode ❓
**Hypothesis**: viteNode's experimental module loading causes bundling issues  
**Action**: Disabled `experimental.viteNode` in `nitro.config.ts`  
**Result**: NOT TESTED - reverted before testing  
**Reasoning**: viteNode is core to TypeScript HMR in dev mode

**Change**:
```typescript
// nitro.config.ts
// experimental: {
//   viteNode: true
// },
```

### 6. Rollup Configuration Attempt ❌
**Hypothesis**: Rollup needs explicit configuration for module ordering  
**Action**: Added `rollupConfig` to `nitro.config.ts` with `exports: 'auto'`  
**Result**: Removed before testing - unlikely to help with dev mode issue  
**Reasoning**: Production Rollup already works fine

## Technical Details

### Error Structure
```javascript
// Line 6878: Reference (fails here)
const _lazy_i3JpgV = defineLazyEventHandler(() => 
  Promise.resolve().then(function () { 
    return index_get$t;  // ❌ TDZ error - not initialized yet
  })
);

// Line 11003: Definition (should be before line 6878)
const index_get$t = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: index_get$s
});
```

### Other Errors in Bundle
```
[uncaughtException] ReferenceError: require is not defined in ES module scope
    at file:///.../. output/server/index.mjs:8742:1
```
This suggests something is using CommonJS `require()` in an ES module context.

## What We Learned

1. **Not a database issue**: Errors persist with original database
2. **Not a cache issue**: Fresh builds fail the same way
3. **Dev mode specific**: Production bundler works perfectly
4. **Rollup bundling bug**: Module wrappers generated in wrong order
5. **Likely code trigger**: Something changed in the codebase that triggers the bug

## Hypotheses for Further Investigation

### Most Likely
1. **Import pattern change**: Some file added a new import that creates a cycle
2. **TypeScript config**: Something in `tsconfig.json` affecting module resolution
3. **Package update**: A dependency update changed Rollup behavior
4. **File system state**: Temporary files or git state affecting module discovery

### Less Likely
5. **Nitro version bug**: Current Nitro version has a known issue
6. **Node version**: Running Node v20.19.5 but engine requires >=22.0.0
7. **Module resolution**: `package.json` "type": "module" interaction with TypeScript

## Recommended Next Steps

1. **Compare working vs broken branch**:
   - Check git diff for all changes between Nov 9 and Nov 10
   - Look for new imports, especially in frequently-used modules
   - Check `package.json`, `tsconfig.json`, `nitro.config.ts`

2. **Binary search approach**:
   - Revert commits one by one until it works
   - Identify the exact commit that broke it

3. **Analyze import graph**:
   - Use `madge` to visualize module dependencies
   - Look for new circular dependencies
   - Check import order in problematic files

4. **Test with fresh clone**:
   - Clone repository to new directory
   - Test if issue reproduces
   - Rules out local file system corruption

5. **Check Nitro/Rollup versions**:
   - See if others have reported similar issues
   - Try upgrading/downgrading Nitro version

6. **Minimal reproduction**:
   - Create minimal project with same structure
   - Test if it's a general Nitro limitation or project-specific

## Files Modified Today (Nov 10)

### Created
- `server/utils/session-store.ts` (42 lines)
- `server/plugins/00.init-database.ts` (18 lines)
- `docs/NITRO_DEV_CIRCULAR_DEPENDENCY_DEBUG_NOV10.md` (this file)

### Modified
- `server/api/auth/login.post.ts` - Import from session-store, added ensureSessionCleanup()
- `server/api/auth/logout.post.ts` - Import from session-store
- `server/api/auth/session.get.ts` - Import from session-store
- `server/api/auth/switch-role.post.ts` - Import from session-store
- `server/api/auth/set-project.post.ts` - Import from session-store
- `server/api/auth/login/admin.get.ts` - Import from session-store
- `nitro.config.ts` - Disabled viteNode (commented out)

### All Changes Should Be Reverted
None of these fixes resolved the issue. The session-store refactor is architecturally sound but didn't solve the Rollup bug.

## Conclusion

The issue is a **Rollup bundling order bug in Nitro dev mode** triggered by some code or configuration change. Production mode works perfectly, confirming the code itself is valid. The fix requires:

1. Identifying what changed to trigger the bug
2. Either reverting that change or finding a workaround
3. Possibly upgrading Nitro or configuring Rollup differently

**Status**: Reverted all changes, ready for systematic debugging approach.
