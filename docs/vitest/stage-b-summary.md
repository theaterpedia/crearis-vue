# Stage B: Vitest Testing Infrastructure - Summary

## 🎯 Objective

Set up comprehensive testing infrastructure with Vitest to test PostgreSQL integration, enabling:
1. Batch execution of all PostgreSQL integration tests
2. One-by-one test execution for debugging
3. Visual test results and reporting
4. Isolated test databases for safe testing

---

## 📦 Deliverables

### Core Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `vitest.config.ts` | Main Vitest configuration with coverage, reporters, and test environment | 68 |
| `server/database/test-config.ts` | Test database configuration (SQLite in-memory or PostgreSQL test DB) | 70 |
| `tests/setup/global-setup.ts` | Global test setup - runs once before all tests | 44 |
| `tests/setup/test-setup.ts` | Test file setup - runs before each test file | 27 |
| `tests/utils/db-test-utils.ts` | Database test utilities, fixtures, and helpers | 295 |
| `tests/integration/database-adapter.test.ts` | Sample integration tests for both databases | 236 |
| `tests/scripts/run-pg-integration.ts` | Batch runner for PostgreSQL integration tests | 106 |
| `tests/scripts/run-test.ts` | Individual test runner with pattern matching | 100 |

### Package.json Updates

Added test scripts and dependencies:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:sqlite": "TEST_DATABASE_TYPE=sqlite vitest run",
    "test:pg": "TEST_DATABASE_TYPE=postgresql vitest run",
    "test:pgintegration": "tsx tests/scripts/run-pg-integration.ts",
    "test:pgintegration:batch": "TEST_DATABASE_TYPE=postgresql vitest run --grep='@pgintegration'",
    "test:watch": "vitest watch"
  },
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "@vitest/ui": "^2.1.8",
    "pg": "^8.13.1",
    "vitest": "^2.1.8"
  }
}
```

---

## 🏗️ Architecture

### Test Environment Structure

```
tests/
├── setup/
│   ├── global-setup.ts       # Global initialization (DB connection check)
│   └── test-setup.ts         # Per-file setup (env vars, lifecycle hooks)
├── utils/
│   └── db-test-utils.ts      # Test helpers, fixtures, assertions
├── integration/
│   └── database-adapter.test.ts  # Sample integration tests
└── scripts/
    ├── run-pg-integration.ts # Batch PostgreSQL test runner
    └── run-test.ts          # Individual test runner
```

### Test Database Strategy

**SQLite (Default):**
- In-memory database (`:memory:`)
- Fast, isolated, no setup required
- Automatically cleaned up after each test

**PostgreSQL (Integration Tests):**
- Separate test database (`demo_data_test`)
- Connection pooling for concurrent tests
- Explicit cleanup with `TRUNCATE CASCADE`
- Requires PostgreSQL server running

---

## 🚀 Usage

### Installation

```bash
# Install all dependencies including test packages
pnpm install
```

### Running Tests

**Run all tests (SQLite by default):**
```bash
pnpm test
```

**Run tests with UI (interactive):**
```bash
pnpm test:ui
```

**Run SQLite tests only:**
```bash
pnpm test:sqlite
```

**Run PostgreSQL tests only:**
```bash
pnpm test:pg
```

**Run PostgreSQL integration tests (batch):**
```bash
pnpm test:pgintegration
```

**Run specific test pattern:**
```bash
pnpm vitest run --grep="Basic Operations"
```

**Run with coverage:**
```bash
pnpm test:coverage
```

**Watch mode (re-run on changes):**
```bash
pnpm test:watch
```

### Individual Test Execution

```bash
# Run specific test file
tsx tests/scripts/run-test.ts database-adapter

# Run specific test by name
tsx tests/scripts/run-test.ts "should insert and retrieve"

# Run with PostgreSQL
tsx tests/scripts/run-test.ts "Basic Operations" --pg
```

---

## 🏷️ Test Tagging System

Tests can be tagged for filtering:

**@pgintegration** - PostgreSQL-specific integration tests
```typescript
describe('Database Adapter - PostgreSQL Specific @pgintegration', () => {
  // Tests that only run with PostgreSQL
})
```

**Conditional Skip:**
```typescript
it('should handle PostgreSQL features', { 
  skip: !isPostgreSQLTest() 
}, async () => {
  // Test only runs with PostgreSQL
})
```

---

## 🧪 Test Utilities

### Database Setup & Cleanup

```typescript
import {
  createTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase
} from '../utils/db-test-utils.js'

let db: DatabaseAdapter

beforeEach(async () => {
  db = await createTestDatabase()  // Creates isolated test DB
})

afterEach(async () => {
  await cleanupTestDatabase(db)    // Cleanup and close connection
})
```

### Test Fixtures

```typescript
import {
  insertTestEvent,
  insertTestTask,
  insertTestVersion
} from '../utils/db-test-utils.js'

// Insert test data with defaults
const event = await insertTestEvent(db)

// Insert with custom values
const task = await insertTestTask(db, {
  title: 'Custom Task',
  status: 'closed',
  category: 'bug'
})
```

### Assertions

```typescript
import {
  assertTableEmpty,
  assertTableRowCount,
  countRows
} from '../utils/db-test-utils.js'

// Assert table is empty
await assertTableEmpty(db, 'events')

// Assert exact row count
await assertTableRowCount(db, 'tasks', 5)

// Get count manually
const count = await countRows(db, 'versions')
```

---

## 📊 Test Reports

### Visual Reports

After running tests, view results:

**HTML Report:**
```
./test-results/index.html
```

**JSON Results:**
```
./test-results/results.json
```

**Coverage Report:**
```
./coverage/index.html
```

### Vitest UI

Interactive test runner with live updates:
```bash
pnpm test:ui
```

Opens browser at `http://localhost:51204` (or similar) with:
- Test tree navigation
- Live test execution
- Code coverage visualization
- Filter by file, status, or test name

---

## 🔧 Configuration

### Environment Variables

**For Tests:**
```bash
# .env.test (or set in shell)
TEST_DATABASE_TYPE=postgresql
TEST_DATABASE_URL=postgresql://localhost:5432/demo_data_test
```

**SQLite (default):**
```bash
TEST_DATABASE_TYPE=sqlite
# No URL needed - uses :memory:
```

### PostgreSQL Test Database Setup

**Create test database:**
```bash
createdb demo_data_test
```

**Grant permissions (if needed):**
```sql
GRANT ALL PRIVILEGES ON DATABASE demo_data_test TO your_user;
```

**Verify connection:**
```bash
psql demo_data_test -c "SELECT 1"
```

---

## ✅ Sample Tests Included

### Basic Operations
- Initialize database with schema
- Insert and retrieve records
- Update records
- Delete records
- Multiple inserts
- Filter with WHERE clauses

### Prepared Statements
- Use prepared statements for queries
- Handle parameter replacement
- Multiple parameter queries

### Transactions
- Commit on success
- Rollback on error
- Multi-statement transactions

### PostgreSQL-Specific
- Timestamp functions
- Concurrent connections
- Connection pooling

---

## 🎨 Visual Output Example

```
🧪 Test Environment Setup
========================
Database Type: postgresql
Database URL: postgresql://localhost:5432/demo_data_test

⚠️  PostgreSQL Integration Tests Enabled
   Make sure PostgreSQL is running and test database exists.
   To create test database: createdb demo_data_test

✅ PostgreSQL connection verified

 ✓ tests/integration/database-adapter.test.ts (15)
   ✓ Database Adapter - Basic Operations (6)
     ✓ should initialize database with schema
     ✓ should insert and retrieve a record
     ✓ should update a record
     ✓ should delete a record
     ✓ should handle multiple inserts
     ✓ should filter records with WHERE clause
   ✓ Database Adapter - Prepared Statements @pgintegration (2)
     ✓ should use prepared statements for queries
     ✓ should handle parameter replacement correctly
   ✓ Database Adapter - Transactions @pgintegration (2)
     ✓ should commit transaction on success
     ✓ should rollback transaction on error
   ✓ Database Adapter - PostgreSQL Specific @pgintegration (2)
     ✓ should handle PostgreSQL timestamp functions
     ✓ should handle concurrent connections

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  14:32:15
   Duration  1.23s
```

---

## 📈 Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

Run with: `pnpm test:coverage`

---

## 🔍 Writing New Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDatabase, cleanupTestDatabase } from '../utils/db-test-utils.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'

describe('My Feature Tests', () => {
  let db: DatabaseAdapter
  
  beforeEach(async () => {
    db = await createTestDatabase()
  })
  
  afterEach(async () => {
    await cleanupTestDatabase(db)
  })
  
  it('should do something', async () => {
    // Test implementation
    const result = await db.get('SELECT 1 as value')
    expect(result.value).toBe(1)
  })
})
```

### PostgreSQL-Specific Tests

```typescript
import { isPostgreSQLTest } from '../../server/database/test-config.js'

describe('PostgreSQL Features @pgintegration', () => {
  it('should use PostgreSQL', { skip: !isPostgreSQLTest() }, async () => {
    // This test only runs when TEST_DATABASE_TYPE=postgresql
  })
})
```

---

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-sqlite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:sqlite
  
  test-postgresql:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: demo_data_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:pgintegration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/demo_data_test
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Errors

**Error:** `Connection refused`
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

**Error:** `Database does not exist`
```bash
# Create test database
createdb demo_data_test
```

**Error:** `Authentication failed`
```bash
# Check connection string
echo $TEST_DATABASE_URL

# Test manual connection
psql $TEST_DATABASE_URL
```

### Test Failures

**Clean test database:**
```bash
dropdb demo_data_test
createdb demo_data_test
```

**Clear test cache:**
```bash
rm -rf test-results coverage node_modules/.vitest
```

**Run single test for debugging:**
```bash
tsx tests/scripts/run-test.ts "specific test name"
```

---

## 📚 Next Steps (Stage C)

After Stage B approval:

1. **Analyze db.ts Usage**
   - Search for all imports of `db.ts`
   - Identify async/await requirements
   - Find PostgreSQL compatibility concerns

2. **Add Coverage Tests**
   - Test all API endpoints with both databases
   - Verify query compatibility
   - Test edge cases (null values, timestamps, etc.)

3. **Performance Testing**
   - Benchmark SQLite vs PostgreSQL
   - Test connection pooling under load
   - Verify transaction performance

---

## 📊 Stage B Status

**Status:** ✅ **Complete - Ready for Review**

**Files Created:** 8 core files + package.json updates  
**Test Scripts Added:** 9 npm scripts  
**Dependencies Added:** 4 packages (vitest, @vitest/ui, pg, @types/pg)

**Test Coverage:**
- ✅ Basic CRUD operations
- ✅ Prepared statements
- ✅ Transactions
- ✅ PostgreSQL-specific features
- ✅ Batch test execution
- ✅ Individual test execution
- ✅ Visual reporting

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests (SQLite) |
| `pnpm test:ui` | Interactive test UI |
| `pnpm test:pg` | PostgreSQL tests only |
| `pnpm test:pgintegration` | Batch PG integration tests |
| `pnpm test:coverage` | Run with coverage report |
| `pnpm test:watch` | Watch mode |
| `tsx tests/scripts/run-test.ts <pattern>` | Run specific test |

**View Reports:**
- HTML: `./test-results/index.html`
- Coverage: `./coverage/index.html`
- JSON: `./test-results/results.json`
