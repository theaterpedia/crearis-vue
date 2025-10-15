# Vitest Testing Guide

Complete guide for running tests with SQLite and PostgreSQL in the demo-data project.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Utilities](#test-utilities)
6. [Configuration](#configuration)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Run SQLite tests (default - no setup needed)
pnpm test

# 3. For PostgreSQL tests, create test database
createdb demo_data_test

# 4. Run PostgreSQL integration tests
pnpm test:pgintegration
```

### Common Commands

```bash
# Run all tests
pnpm test

# Run with interactive UI
pnpm test:ui

# Run PostgreSQL tests only
pnpm test:pg

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 📦 Installation

### Required Dependencies

All testing dependencies are in `package.json`:

```json
{
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "@vitest/ui": "^2.1.8",
    "pg": "^8.13.1",
    "vitest": "^2.1.8"
  }
}
```

Install with:
```bash
pnpm install
```

### PostgreSQL Setup (Optional)

Only needed for PostgreSQL integration tests:

**1. Install PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo systemctl start postgresql
```

**2. Create test database:**
```bash
createdb demo_data_test
```

**3. Verify connection:**
```bash
psql demo_data_test -c "SELECT 1"
```

---

## 🧪 Running Tests

### Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| All Tests | `pnpm test` | Run all tests with SQLite (default) |
| Interactive UI | `pnpm test:ui` | Visual test runner in browser |
| Run Once | `pnpm test:run` | Single test run (no watch) |
| Coverage | `pnpm test:coverage` | Generate coverage report |
| SQLite Only | `pnpm test:sqlite` | Force SQLite tests |
| PostgreSQL Only | `pnpm test:pg` | Force PostgreSQL tests |
| PG Integration | `pnpm test:pgintegration` | Batch PostgreSQL tests |
| PG Batch | `pnpm test:pgintegration:batch` | Alternative batch runner |
| Watch Mode | `pnpm test:watch` | Re-run on file changes |

### Filtering Tests

**By file name:**
```bash
pnpm vitest run database-adapter
```

**By test name:**
```bash
pnpm vitest run --grep="should insert"
```

**By tag:**
```bash
pnpm vitest run --grep="@pgintegration"
```

**Exclude tests:**
```bash
pnpm vitest run --grep="^(?!.*@pgintegration).*$"
```

### Individual Test Execution

For debugging specific tests:

```bash
# Run specific test file
tsx tests/scripts/run-test.ts database-adapter

# Run specific test by name
tsx tests/scripts/run-test.ts "should insert and retrieve"

# Run with PostgreSQL
tsx tests/scripts/run-test.ts "Basic Operations" --pg
```

---

## ✍️ Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestDatabase,
  cleanupTestDatabase,
  insertTestEvent
} from '../utils/db-test-utils.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'

describe('My Feature', () => {
  let db: DatabaseAdapter
  
  beforeEach(async () => {
    // Create fresh test database before each test
    db = await createTestDatabase()
  })
  
  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestDatabase(db)
  })
  
  it('should do something', async () => {
    // Arrange: Set up test data
    const event = await insertTestEvent(db, {
      name: 'Test Event',
      status: 'active'
    })
    
    // Act: Perform action
    const result = await db.get(
      'SELECT * FROM events WHERE id = ?',
      [event.id]
    )
    
    // Assert: Verify result
    expect(result).toBeDefined()
    expect(result.name).toBe('Test Event')
    expect(result.status).toBe('active')
  })
})
```

### Test Tags

Tag tests for filtering:

```typescript
// PostgreSQL-specific tests
describe('PostgreSQL Features @pgintegration', () => {
  // Tests here
})

// Unit tests
describe('Utility Functions @unit', () => {
  // Tests here
})
```

### Conditional Tests

Skip tests based on database type:

```typescript
import { isPostgreSQLTest } from '../../server/database/test-config.js'

it('PostgreSQL only', { skip: !isPostgreSQLTest() }, async () => {
  // This test only runs with PostgreSQL
})

it('SQLite only', { skip: isPostgreSQLTest() }, async () => {
  // This test only runs with SQLite
})
```

### Async/Await

All database operations are async:

```typescript
// ✅ GOOD - Using await
it('should work', async () => {
  const result = await db.get('SELECT * FROM events')
  expect(result).toBeDefined()
})

// ❌ BAD - Missing await
it('will fail', async () => {
  const result = db.get('SELECT * FROM events')  // Returns Promise!
  expect(result).toBeDefined()  // Fails - result is Promise
})
```

---

## 🛠️ Test Utilities

### Database Setup

```typescript
import {
  createTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase
} from '../utils/db-test-utils.js'

// Create new test database with schema
const db = await createTestDatabase()

// Reset database to clean state (keep connection open)
await resetTestDatabase(db)

// Cleanup and close connection
await cleanupTestDatabase(db)
```

### Test Fixtures

Pre-defined test data creators:

```typescript
import {
  insertTestEvent,
  insertTestTask,
  insertTestVersion
} from '../utils/db-test-utils.js'

// Insert with defaults
const event = await insertTestEvent(db)
// { id: 'xyz', name: 'Test Event', status: 'draft', version_id: null }

// Insert with custom values
const task = await insertTestTask(db, {
  title: 'Custom Task',
  status: 'closed',
  category: 'bug'
})

// Insert version
const version = await insertTestVersion(db, {
  name: 'v1.0',
  is_published: 1
})
```

### Assertions

Helper functions for common assertions:

```typescript
import {
  assertTableEmpty,
  assertTableRowCount,
  countRows
} from '../utils/db-test-utils.js'

// Assert table has no rows
await assertTableEmpty(db, 'events')

// Assert exact row count
await assertTableRowCount(db, 'tasks', 5)

// Get count for manual checking
const count = await countRows(db, 'versions')
expect(count).toBeGreaterThan(0)
```

### Custom Fixtures

Create your own fixtures:

```typescript
async function insertCustomData(db: DatabaseAdapter) {
  // Insert related data
  const version = await insertTestVersion(db, { name: 'v1.0' })
  
  const event = await insertTestEvent(db, {
    name: 'Event for v1.0',
    version_id: version.id
  })
  
  const task = await insertTestTask(db, {
    title: 'Task for event',
    version_id: version.id
  })
  
  return { version, event, task }
}

// Use in tests
it('should handle related data', async () => {
  const { version, event, task } = await insertCustomData(db)
  
  // Test with related data
  const result = await db.all(
    'SELECT * FROM events WHERE version_id = ?',
    [version.id]
  )
  
  expect(result).toHaveLength(1)
})
```

---

## ⚙️ Configuration

### Environment Variables

**SQLite (Default):**
```bash
# No configuration needed
TEST_DATABASE_TYPE=sqlite
```

**PostgreSQL:**
```bash
# Set in .env.test or shell
TEST_DATABASE_TYPE=postgresql
TEST_DATABASE_URL=postgresql://localhost:5432/demo_data_test
```

### Vitest Configuration

Main config in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    isolate: true,
    testTimeout: 30000,
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    },
    
    reporters: ['verbose', 'html'],
  }
})
```

### Test Database Configuration

Configure test database in `server/database/test-config.ts`:

```typescript
export function getTestDatabaseConfig(): TestDatabaseConfig {
  const testDbType = process.env.TEST_DATABASE_TYPE || 'sqlite'
  
  if (testDbType === 'postgresql') {
    return {
      type: 'postgresql',
      connectionString: process.env.TEST_DATABASE_URL || 
                       'postgresql://localhost:5432/demo_data_test'
    }
  }
  
  return {
    type: 'sqlite',
    dbPath: ':memory:'
  }
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-sqlite:
    name: SQLite Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:sqlite
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  test-postgresql:
    name: PostgreSQL Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: demo_data_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:pgintegration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/demo_data_test
```

### GitLab CI

```yaml
test:sqlite:
  stage: test
  image: node:20
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm test:sqlite
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:postgresql:
  stage: test
  image: node:20
  services:
    - postgres:16
  variables:
    POSTGRES_DB: demo_data_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    TEST_DATABASE_URL: postgresql://postgres:postgres@postgres:5432/demo_data_test
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm test:pgintegration
```

---

## 🐛 Troubleshooting

### Common Issues

#### PostgreSQL Connection Errors

**Error:** `ECONNREFUSED`
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

**Error:** `database "demo_data_test" does not exist`
```bash
# Create the test database
createdb demo_data_test
```

**Error:** `password authentication failed`
```bash
# Check your connection string
echo $TEST_DATABASE_URL

# Test manual connection
psql postgresql://user:password@localhost:5432/demo_data_test
```

#### Test Failures

**Clean test database:**
```bash
# PostgreSQL
dropdb demo_data_test
createdb demo_data_test

# Clear test cache
rm -rf test-results coverage node_modules/.vitest
```

**Run single test for debugging:**
```bash
# With verbose output
pnpm vitest run --grep="specific test" --reporter=verbose

# With node inspector
node --inspect-brk node_modules/.bin/vitest run --grep="specific test"
```

#### Timeout Errors

Increase timeout in test:
```typescript
it('slow test', { timeout: 60000 }, async () => {
  // Test that takes longer
})
```

Or globally in `vitest.config.ts`:
```typescript
test: {
  testTimeout: 60000,
  hookTimeout: 60000
}
```

#### Memory Issues

For large test suites:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

### Debug Mode

Enable debug logging:
```bash
# Vitest debug
DEBUG=vitest:* pnpm test

# Database adapter debug
DEBUG=db:* pnpm test
```

### Test Isolation Issues

If tests are interfering with each other:

```typescript
// Ensure proper cleanup
afterEach(async () => {
  await resetTestDatabase(db)  // Clear data
  // or
  await cleanupTestDatabase(db) // Close connection
  db = await createTestDatabase() // Create new
})
```

---

## 📊 Viewing Reports

### HTML Test Report

After running tests:
```bash
open test-results/index.html
```

Contains:
- Test execution timeline
- Pass/fail status
- Error messages and stack traces
- Test duration

### Coverage Report

After running with coverage:
```bash
open coverage/index.html
```

Shows:
- Line coverage by file
- Branch coverage
- Function coverage
- Uncovered lines highlighted

### JSON Results

Programmatic access to results:
```bash
cat test-results/results.json | jq '.testResults'
```

---

## 🎯 Best Practices

### 1. Isolate Tests

Each test should be independent:
```typescript
beforeEach(async () => {
  db = await createTestDatabase()  // Fresh DB
})
```

### 2. Use Descriptive Names

```typescript
// ✅ GOOD
it('should return active events when status filter is applied', async () => {})

// ❌ BAD
it('test events', async () => {})
```

### 3. Test One Thing

```typescript
// ✅ GOOD - Single assertion focus
it('should create event with correct name', async () => {
  const event = await insertTestEvent(db, { name: 'Test' })
  expect(event.name).toBe('Test')
})

// ❌ BAD - Testing multiple things
it('should handle events', async () => {
  const event = await insertTestEvent(db)
  expect(event.name).toBeDefined()
  expect(event.status).toBe('draft')
  await db.run('UPDATE events SET name = ?', ['New'])
  const updated = await db.get('SELECT * FROM events')
  expect(updated.name).toBe('New')
})
```

### 4. Use AAA Pattern

Arrange, Act, Assert:
```typescript
it('should update event status', async () => {
  // Arrange: Set up test data
  const event = await insertTestEvent(db, { status: 'draft' })
  
  // Act: Perform the action
  await db.run('UPDATE events SET status = ? WHERE id = ?', ['active', event.id])
  
  // Assert: Verify the outcome
  const updated = await db.get('SELECT * FROM events WHERE id = ?', [event.id])
  expect(updated.status).toBe('active')
})
```

### 5. Clean Up Resources

```typescript
afterEach(async () => {
  if (db) {
    await cleanupTestDatabase(db)
  }
})
```

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- Stage B Summary: `docs/vitest/stage-b-summary.md`
- PostgreSQL Docs: `docs/postgresql/README.md`

---

**Last Updated:** October 15, 2025  
**Stage B Status:** ✅ Complete
