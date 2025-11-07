# Testing Guide for Code Automation (MCP)

**Quick reference for AI agents and automated tools**

Last Updated: November 7, 2025  
Migration Status: 019+ (PostgreSQL only)

---

## 🚀 Running Tests

### Primary Commands

```bash
# Run all tests (default PostgreSQL)
pnpm test

# Run with UI (interactive browser)
pnpm test:ui

# Single run (CI mode)
pnpm test:run

# Coverage report
pnpm test:coverage

# Watch mode (auto-rerun on changes)
pnpm test:watch
```

### PostgreSQL Required

⚠️ **SQLite is DEPRECATED since Migration 019**  
All tests require PostgreSQL due to:
- Custom composite types (`image_shape`, `media_adapter`)
- BYTEA fields (`ctags`, `rtags`)
- Triggers with JSONB computed fields
- PostgreSQL-specific functions

```bash
# Ensure PostgreSQL test database exists
createdb demo_data_test

# Set environment (optional, defaults to PostgreSQL)
export TEST_DATABASE_TYPE=postgresql
export TEST_DATABASE_URL=postgresql://localhost:5432/demo_data_test
```

---

## 📁 Test Structure

```
tests/
├── database/           # Database-specific tests (triggers, types)
│   └── image-shape-reducer.test.ts
├── integration/        # API endpoint tests
│   ├── images-api.test.ts
│   ├── images-import-api.test.ts
│   └── postgres-tables.test.ts
├── unit/               # Pure logic tests
│   └── i18n-composable.test.ts
├── setup/              # Global setup
│   ├── global-setup.ts
│   └── test-setup.ts
└── utils/              # Test helpers
    ├── db-test-utils.ts
    └── migration-test-utils.ts
```

---

## 🔑 Key Patterns

### 1. Database Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql'
import { testDbConfig } from '../../server/database/test-config'

describe('Feature Test', () => {
  let db: DatabaseAdapter

  beforeAll(async () => {
    // Connect to test database (schema already initialized)
    db = new PostgreSQLAdapter(testDbConfig.connectionString!)
  })

  afterAll(async () => {
    // Clean up
    await db.run('DELETE FROM test_table WHERE id = $1', [testId])
    await db.close()
  })

  it('should test feature', async () => {
    await db.run('INSERT INTO ...', [values])
    const result = await db.get('SELECT ...', [id])
    expect(result).toEqual(expected)
  })
})
```

### 2. Shape Field Testing

```typescript
// PostgreSQL composite type format: (x, y, z, url, json)
// Example: (50, 50, 10, "https://...", null)

it('should handle shape fields', async () => {
  await db.run(`
    INSERT INTO images (name, url, shape_square)
    VALUES ($1, $2, $3)
  `, [
    'Test Image',
    'https://example.com/image.jpg',
    '(,,,https://example.com/square.jpg,)' // NULL x/y/z, url set, NULL json
  ])
  
  const result = await db.get('SELECT img_square FROM images WHERE name = $1', ['Test Image'])
  expect(result.img_square).toEqual({ url: 'https://example.com/square.jpg' })
})
```

### 3. BYTEA Fields (ctags, rtags)

```typescript
// ctags/rtags stored as BYTEA (binary)
await db.run(`INSERT INTO images (ctags, rtags) VALUES ($1, $2)`, [
  Buffer.from([0x01]),  // ctags = 1 byte
  Buffer.from([])       // rtags = empty
])
```

---

## 🛠️ Configuration

### vitest.config.ts

```typescript
{
  test: {
    environment: 'node',
    globalSetup: './tests/setup/global-setup.ts',
    setupFiles: ['./tests/setup/test-setup.ts'],
    timeout: 30000
  }
}
```

### Environment Variables

```bash
# Required
TEST_DATABASE_TYPE=postgresql              # Only postgresql supported
TEST_DATABASE_URL=postgresql://localhost:5432/demo_data_test

# Optional
DEBUG=db:*                                 # Enable database debug logs
NODE_ENV=test                              # Set test environment
```

---

## 🧪 Test Database Schema

### Global Setup

- **Location**: `tests/setup/global-setup.ts`
- **Runs**: Once before all tests
- **Actions**: 
  - Drops and recreates test database
  - Runs all migrations (000-023+)
  - Seeds system data

### Schema State

After global setup, test database contains:
- All tables from migrations 000-023
- Custom types: `image_shape`, `media_adapter`, `image_file_type`, etc.
- Triggers: `trigger_compute_image_shapes`, `trigger_propagate_to_entities`
- System data: status values, tags

---

## 📦 Critical Files

### Migration 019 (Shape System)

**File**: `server/database/migrations/019_add_tags_status_ids.ts`

**Key Components**:
```typescript
// Chapter 5B.4: Image Shape Type Definition
CREATE TYPE image_shape AS (
  x       numeric,
  y       numeric,
  z       numeric,
  url     text,
  json    jsonb
);

// Chapter 14: Triggers
CREATE FUNCTION compute_image_shape_fields() ...
CREATE TRIGGER trigger_compute_image_shapes ...
CREATE FUNCTION propagate_image_fields_to_entities() ...
CREATE TRIGGER trigger_propagate_to_entities ...
```

**Computed Fields**:
- `img_thumb`, `img_square`, `img_wide`, `img_vert` (JSONB)
- `img_show` (BOOLEAN, based on ctags quality bits)

**Entity Propagation**:
- Images → Users, Instructors, Events, Locations, Posts, Projects
- Triggers keep entity tables in sync via `img_id` FK

---

## 🚨 Common Issues

### 1. "SQLite is deprecated"

```
Error: SQLite test database is deprecated
```

**Fix**: Ensure PostgreSQL is running and TEST_DATABASE_TYPE=postgresql

### 2. Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix**:
```bash
# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Verify
pg_isready
```

### 3. Database does not exist

```
Error: database "demo_data_test" does not exist
```

**Fix**:
```bash
createdb demo_data_test
```

### 4. Shape composite type errors

```
Error: column "shape_square" is of type image_shape but expression is of type text
```

**Fix**: Use composite type syntax:
```typescript
// ✅ Correct
'(50, 50, 10, "https://...", null)'

// ❌ Wrong
'"https://..."'
```

---

## 🔍 Debugging Tests

### Run specific test file

```bash
pnpm vitest run tests/database/image-shape-reducer.test.ts
```

### Run specific test case

```bash
pnpm vitest run --grep="should compute img_square"
```

### Enable verbose output

```bash
pnpm vitest run --reporter=verbose
```

### Debug with inspector

```bash
node --inspect-brk node_modules/.bin/vitest run <test-file>
```

---

## ✅ Pre-Commit Checklist

Before modifying shape-related code:

1. **Understand current schema**:
   - Read migration 019 Chapter 5B.4 and Chapter 14
   - Check `image_shape` type definition
   - Review trigger functions

2. **Plan changes**:
   - Will you alter `image_shape` type?
   - Do triggers need updating?
   - Are entity tables affected?

3. **Update tests**:
   - Modify shape field assertions
   - Update composite type test data
   - Test trigger behavior

4. **Run full test suite**:
   ```bash
   pnpm test:run
   ```

5. **Check coverage**:
   ```bash
   pnpm test:coverage
   ```

---

## 📝 Shape Field Migration Template

When adding fields to `image_shape`:

```sql
-- Step 1: Drop type (CASCADE drops dependent objects)
DROP TYPE IF EXISTS image_shape CASCADE;

-- Step 2: Recreate with new fields
CREATE TYPE image_shape AS (
  x       numeric,
  y       numeric,
  z       numeric,
  url     text,
  json    jsonb,
  blur    varchar(50),  -- NEW
  turl    text,         -- NEW
  tpar    text          -- NEW
);

-- Step 3: Recreate images table (or ALTER columns)
-- See migration 019 lines 2360-2400 for full images table DDL

-- Step 4: Update trigger function
CREATE OR REPLACE FUNCTION compute_image_shape_fields() ...
-- Add logic for new fields

-- Step 5: Update entity table sync
CREATE OR REPLACE FUNCTION propagate_image_fields_to_entities() ...
-- Propagate new fields if needed
```

---

## 🔗 Related Documentation

- Full testing guide: `docs/vitest/README.md`
- Database migrations: `server/database/migrations/`
- Migration 019 details: Lines 2330-3950 (shape system)
- Test utilities: `tests/utils/db-test-utils.ts`

---

**For Automated Tools**: This document provides the minimum viable context for running, debugging, and modifying tests in the crearis-vue project. Always verify PostgreSQL is running and migrations are current before executing tests.
