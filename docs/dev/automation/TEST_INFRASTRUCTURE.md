# Test Infrastructure Reference

> **Primary Audience**: Code automation (AI assistants)  
> **Last Updated**: 2025-12-04  
> **Status**: Proven strategies documented, experimental patterns flagged

---

## Overview

```
tests/
├── setup/                    # Global + per-file setup
│   ├── global-setup.ts       # Runs ONCE before all tests
│   └── test-setup.ts         # Runs BEFORE EACH test file
├── helpers/                  # Reusable mock/data factories
│   ├── sysreg-mock-api.ts    # Complete sysreg mock (73 entries)
│   ├── sysreg-test-data.ts   # Entity factories (images, projects, posts)
│   └── versioned-test.ts     # Version-aware test wrappers
├── utils/                    # Test utilities
│   ├── db-test-utils.ts      # DB adapter creation, skip helpers
│   ├── mount-helpers.ts      # Vue component mounting
│   ├── fetch-mock.ts         # API mocking utilities
│   └── test-helpers.ts       # CSS variables, dimensions
├── fixtures/                 # Static test data
├── unit/                     # Pure function tests (no DB)
├── component/                # Vue component tests
└── integration/              # API + DB tests
```

### Test Categories

| Category | Database | Server | Speed | Example |
|----------|----------|--------|-------|---------|
| **Unit** | ❌ | ❌ | Fast | `posts-permissions.test.ts` |
| **Component** | ❌ | ❌ | Fast | `ItemRow.test.ts` |
| **Integration** | ✅ PostgreSQL | ❌ | Medium | `i18n-api.test.ts` |
| **E2E/API** | ✅ PostgreSQL | ✅ Running | Slow | `posts-visibility.test.ts` |

---

## Chapter 1: Proven Strategies

### 1.1 Global Setup (global-setup.ts)

**Purpose**: Runs ONCE before all tests. Database migrations, extensions.

```typescript
// Key patterns:
export default async function globalSetup() {
    // 1. Load .env
    loadEnv()
    
    // 2. Check SKIP_MIGRATIONS for fast unit tests
    if (process.env.SKIP_MIGRATIONS === 'true') {
        return // Skip DB setup entirely
    }
    
    // 3. PostgreSQL: drop tables, create extensions, run migrations
    await dropAllTables(pool)
    await createExtensions(pool)
    await runTestMigrations(pool)
}
```

**Automation Note**: Set `SKIP_MIGRATIONS=true` for pure unit tests.

### 1.2 Per-File Setup (test-setup.ts)

**Purpose**: Runs before EACH test file. Mocks, cache initialization.

```typescript
// Key patterns:

// 1. Mock fetch BEFORE imports (critical for sysreg)
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockCache
})

// 2. Initialize sysreg cache (composables depend on this)
const { initCache } = useSysregTags()
await initCache()

// 3. Mock useI18n composable
vi.mock('@/composables/useI18n', () => ({
    useI18n: () => ({
        t: vi.fn((key) => key),
        resolveText: vi.fn((entry) => entry?.de || '')
    })
}))
```

**Automation Note**: sysreg mock has 73 entries (status, ttags, dtags, rtags, ctags).

### 1.3 Database Skip Pattern (PROVEN)

**Purpose**: Gracefully skip tests when DB unavailable instead of failing.

```typescript
// In db-test-utils.ts
export async function isDatabaseAccessible(): Promise<boolean> {
    if (dbConnectivityChecked) return dbIsAccessible
    dbConnectivityChecked = true
    
    try {
        const adapter = new PostgreSQLAdapter(connectionString)
        await adapter.get('SELECT 1')
        await adapter.close()
        dbIsAccessible = true
    } catch {
        console.warn('⚠️ Database not accessible - skipping DB tests')
        dbIsAccessible = false
    }
    return dbIsAccessible
}

// In test file
describe('My DB Tests', () => {
    let dbAccessible = false
    
    beforeAll(async () => {
        dbAccessible = await isDatabaseAccessible()
    })
    
    beforeEach(async (ctx) => {
        if (!dbAccessible) { ctx.skip(); return }
        db = await createTestDatabase()
    })
})
```

**Automation Note**: Use `ctx.skip()` in `beforeEach`, NOT throwing errors.

### 1.4 Server Readiness Pattern (PROVEN)

**Purpose**: Skip E2E tests when dev server not running.

```typescript
// Check server + test data
async function checkServerReady(): Promise<boolean> {
    try {
        const { statusCode, body } = await request(`${API_BASE}/api/posts?project=opus1`)
        if (statusCode !== 200) return false
        const posts = JSON.parse(await body.text())
        return Array.isArray(posts) && posts.length > 0
    } catch {
        return false
    }
}

describe('Posts API Tests', () => {
    let serverReady = false
    
    beforeAll(async () => {
        serverReady = await checkServerReady()
        if (!serverReady) {
            console.warn('⚠️ Server not running - skipping')
            return
        }
        // Login test users...
    })
    
    beforeEach(async (ctx) => {
        if (!serverReady) ctx.skip()
    })
})
```

### 1.5 Fetch Mock Patterns (PROVEN)

```typescript
// Simple success
mockFetchSuccess(data)

// Simple error
mockFetchError('Not Found', 404)

// Multiple endpoints
mockFetchWithEndpoints({
    '/api/events': eventData,
    '/api/users': userData
})

// Conditional responses
mockFetchWithCondition(url => {
    if (url.includes('error')) return { ok: false, status: 500 }
    return { ok: true, json: async () => data }
})
```

### 1.6 Component Mounting (PROVEN)

```typescript
import { mountWithCSS, mountCListComponent } from '../utils/mount-helpers'

// Basic mount with CSS variables
const { wrapper, cleanup } = mountWithCSS(MyComponent, {
    props: { title: 'Test' }
})

// CList component with common stubs
const { wrapper, cleanup } = mountCListComponent(ItemRow, {
    props: { heading: 'Test Item' },
    global: {
        stubs: { RouterLink: true }
    }
})

afterEach(() => cleanup())
```

### 1.7 Test Data Factories (PROVEN)

```typescript
// From sysreg-test-data.ts
import { createTestImage, createTestProject, createTestPost } from '../helpers/sysreg-test-data'

const image = createTestImage({
    status: 4,        // override defaults
    ttags: 17
})

const post = createTestPost({
    name: 'My Post',
    ctags: 8
})
```

### 1.8 Test Users (opus1 project - PROVEN)

```typescript
// Standard test users from reset-test-data.ts
const TEST_USERS = {
    hans: { email: 'hans.opus@theaterpedia.org', role: 'owner', userId: 8 },
    nina: { email: 'nina.opus@theaterpedia.org', role: 'member', userId: 17 },
    rosa: { email: 'rosa.opus@theaterpedia.org', role: 'participant', userId: 7 },
    marc: { email: 'marc.opus@theaterpedia.org', role: 'partner', userId: 103 }
}

// Login helper
async function login(userKey: keyof typeof TEST_USERS): Promise<string> {
    const user = TEST_USERS[userKey]
    const { headers } = await request(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.email, password: `opus1${userKey}` })
    })
    return extractSessionCookie(headers)
}
```

---

## Chapter 2: Configuration Reference

### vitest.config.ts

```typescript
export default defineConfig({
    test: {
        environment: 'happy-dom',          // Vue component testing
        globalSetup: './tests/setup/global-setup.ts',
        setupFiles: ['./tests/setup/test-setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        globals: true,
        reporters: ['verbose', 'html', ['json', { outputFile: 'test-results/results.json' }]]
    },
    resolve: {
        alias: {
            '@': './src',
            '~': './server'
        }
    }
})
```

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `SKIP_MIGRATIONS` | Skip DB setup for unit tests | `true` |
| `TEST_DATABASE_TYPE` | Database type | `postgresql` |
| `DATABASE_URL` | PostgreSQL connection | `postgres://...` |
| `TEST_MAXV` | Max version for versioned tests | `0.2` |
| `TEST_MINV` | Min version for versioned tests | `0.3` |
| `TEST_MODULE` | Filter by module | `status` |

---

## Chapter 3: Experimental / Needs Review

### 3.1 Versioned Tests (versioned-test.ts) - EXPERIMENTAL

**Purpose**: Version-aware test filtering with health reports.

```typescript
import { v, vDescribe } from '../helpers/versioned-test'

// Version-tagged test
v({ version: '0.2' })('my test', () => { ... })

// Deprecated test (auto-skipped, logged)
v({ deprecated: true, reason: 'Replaced by new API' })('old test', () => { ... })

// Draft test (auto-skipped, logged)
v({ draft: true })('future feature', () => { ... })

// Version-tagged describe block
vDescribe({ version: '0.2' })('my suite', () => { ... })
```

**Status**: Infrastructure exists, usage patterns not fully standardized.

### 3.2 Image Shape Editor Tests - NEEDS REVIEW

Files:
- `tests/integration/imageadmin-shapeeditor.test.ts`
- `tests/integration/v2-imagesCore-shapeEditor.test.ts`

**Issues**:
- Missing `useRoute` mock
- `extractImageDimensions is not a function` error
- Need vue-router mock setup

**Fix Pattern** (not yet applied):
```typescript
vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: {},
        query: {}
    }),
    useRouter: () => ({
        push: vi.fn()
    })
}))
```

### 3.3 Transaction Rollback Test - NEEDS FIX

File: `tests/integration/database-adapter.test.ts`

**Issue**: "Expected table events to be empty, but found 1 rows"

**Root Cause**: PostgreSQL doesn't auto-rollback on error within `db.transaction()`. Need explicit rollback handling.

### 3.4 Prepared Statement Test - NEEDS FIX

File: `tests/integration/database-adapter.test.ts`

**Issue**: `expected [] to have a length of 1`

**Root Cause**: Test data not properly inserted before query. Race condition or schema mismatch.

### 3.5 Archived/Skipped Tests

```
tests/component/_archived_Width-Architecture-Diagnosis.test.ts.skip
tests/component/DropdownList-ItemList-Integration-BEFORE-OPTION-A.test.ts.skip
tests/component/pList-pGallery-Integration-BEFORE-OPTION-A.test.ts.skip
tests/_archived/
tests/_moved/
```

**Status**: Historical tests preserved for reference. May contain useful patterns.

---

## Quick Reference: Running Tests

```bash
# All tests
pnpm test

# Unit tests only (fast, no DB)
SKIP_MIGRATIONS=true pnpm test tests/unit/

# Specific test file
pnpm test tests/unit/posts-permissions.test.ts

# Integration tests (requires PostgreSQL)
TEST_DATABASE_TYPE=postgresql pnpm test tests/integration/

# E2E tests (requires server running)
# Terminal 1: pnpm dev
# Terminal 2: pnpm test tests/integration/posts-visibility.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

---

## Automation Checklist

When writing new tests:

1. **Unit test?** → Place in `tests/unit/`, use `SKIP_MIGRATIONS=true`
2. **Component test?** → Use `mountWithCSS()` or `mountCListComponent()`
3. **Needs sysreg?** → Already mocked in `test-setup.ts` (73 entries)
4. **Needs fetch?** → Use `mockFetchSuccess()` from `fetch-mock.ts`
5. **Needs DB?** → Use `isDatabaseAccessible()` skip pattern
6. **Needs server?** → Use `checkServerReady()` skip pattern
7. **Test users?** → Hans/Nina/Rosa/Marc from opus1 project
8. **Entity data?** → Use factories from `sysreg-test-data.ts`
