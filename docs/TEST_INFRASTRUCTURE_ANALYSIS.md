# Test Infrastructure Analysis

## Test Scripts Configuration

From `package.json`:
```json
"test": "vitest",                                    // Default: SQLite in-memory
"test:ui": "vitest --ui",                            // Interactive UI
"test:run": "vitest run",                            // One-time run (SQLite)
"test:coverage": "vitest run --coverage",            // Coverage report
"test:sqlite": "TEST_DATABASE_TYPE=sqlite vitest run",
"test:pg": "TEST_DATABASE_TYPE=postgresql vitest run",  // PostgreSQL mode
"test:pgintegration": "tsx tests/scripts/run-pg-integration.ts",
"test:pgintegration:batch": "TEST_DATABASE_TYPE=postgresql vitest run --grep='@pgintegration'",
"test:watch": "vitest watch"
```

## Test Setup Flow

### 1. Global Setup (`tests/setup/global-setup.ts`)
- Runs **once before all tests**
- Checks database type from environment
- For PostgreSQL:
  - Verifies connection
  - Expects test database to exist: `demo_data_test`
  - Does NOT create database
  - Does NOT run migrations
- For SQLite:
  - Uses in-memory database `:memory:`

### 2. Test Setup (`tests/setup/test-setup.ts`)
- Runs **before each test file**
- Sets `NODE_ENV=test`
- Loads test database config
- Sets environment variables for adapter

### 3. Test Database Utils (`tests/utils/db-test-utils.ts`)
- `createTestDatabase()` - Creates adapter and initializes schema
- `initializeTestSchema()` - **Creates schema directly** (not via migrations)
- Creates tables: `events`, `tasks`, `versions`, `i18n_codes`
- Creates indexes and triggers
- **Current Approach**: Direct SQL schema creation

## Database Configuration

### Environment Variables (.env)
```
DB_USER=crearis_admin
DB_PASSWORD=7uqf9nE0umJmMMo
DB_NAME=crearis_admin_dev
DB_HOST=localhost
DB_PORT=5432
```

### Test Database Naming

**SQLite Mode** (`pnpm test`):
- Uses: `:memory:` (in-memory database)
- No persistent storage
- Fast and isolated

**PostgreSQL Mode** (`pnpm test:pg`):
- Connection builder in `server/database/test-config.ts`:
  ```typescript
  const testDbName = process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test` || 'demo_data_test'
  ```
- **Computed Name**: `crearis_admin_dev_test` (from `DB_NAME=crearis_admin_dev`)
- **Fallback**: `demo_data_test`
- **User**: `crearis_admin` (from `DB_USER`)
- **Password**: `7uqf9nE0umJmMMo` (from `DB_PASSWORD`)

### Current Issue
- ❌ Test database created: `crearis_admin_test` (wrong)
- ✅ Should be: `crearis_admin_dev_test`

## Test Results - SQLite Mode (`pnpm test`)

### Passing Tests (26/89)
- ✅ **Database Adapter - Basic Operations** (6 tests)
  - CRUD operations work on SQLite
- ✅ **Stage D: Database Compatibility Tests** (17 tests)
  - SELECT, INSERT, UPDATE, JOINs all working

### Skipped Tests (57/89)
All skipped tests are marked PostgreSQL-only:

#### Integration Tests (31 skipped)
From `tests/integration/i18n-api.test.ts`:
- **i18n API - GET /api/i18n** (6 tests)
- **i18n API - POST /api/i18n** (8 tests)
- **i18n API - PUT /api/i18n/:id** (5 tests)
- **i18n API - DELETE /api/i18n/:id** (3 tests)
- **i18n API - POST /api/i18n/get-or-create** (4 tests)
- **i18n API - Data Validation** (3 tests)
- **i18n API - Indexes** (2 tests)

**Skip Reason**: i18n tests use JSONB type (PostgreSQL-specific)

#### Unit Tests (24 skipped)
From `tests/unit/i18n-composable.test.ts`:
- **useI18n - Initialization** (4 tests)
- **useI18n - Language Switching** (3 tests)
- **useI18n - Preload** (3 tests)
- **useI18n - Translation Functions** (4 tests)
- **useI18n - Fallback Chain** (3 tests)
- **useI18n - Caching** (3 tests)
- **useI18n - Get or Create** (1 test)
- **useI18n - Error Handling** (3 tests)

**Skip Reason**: Mock API responses depend on PostgreSQL JSONB handling

#### Other Skipped (2)
- **Database Adapter - PostgreSQL Specific @pgintegration** (2 tests)
  - PostgreSQL-specific features (timestamp functions, concurrent connections)

### Failed Tests (6/89)

#### 1. Transaction Rollback Test
- **File**: `tests/integration/database-adapter.test.ts`
- **Test**: "should rollback transaction on error"
- **Error**: `Expected table events to be empty, but found 1 rows`
- **Reason**: SQLite transaction rollback not working correctly in test

#### 2-6. PostgreSQL Table Tests (5 failures)
- **File**: `tests/integration/postgres-tables.test.ts`
- **All tests in this file are failing**
- **Reason**: Tests are trying to connect to PostgreSQL even in SQLite mode
- **Errors**:
  - `initDatabase is not a function`
  - `relation "events" does not exist`
- **Issue**: Test file doesn't respect SQLite mode, tries PostgreSQL operations

## Task List: Fix SQLite Testing

### High Priority
1. **Fix postgres-tables.test.ts** - Should skip entirely on SQLite or be PostgreSQL-only
2. **Fix transaction rollback test** - SQLite transaction handling in test utilities

### Already Handled
- ✅ i18n integration tests (31 tests) - Already skipped on SQLite
- ✅ i18n unit tests (24 tests) - Already skipped on SQLite
- ✅ PostgreSQL-specific adapter tests (2 tests) - Already skipped

## PostgreSQL Test Mode (`pnpm test:pg`)

### Prerequisites
1. **PostgreSQL Running**: Service must be active
2. **Test Database**: Must exist with correct name
3. **Permissions**: User must have CREATE/DROP privileges

### Current Status
- ❌ **Test database name mismatch**
  - Exists: `crearis_admin_test`
  - Should be: `crearis_admin_dev_test`

### Database Setup Commands

**Option 1: Drop and Recreate with Correct Name**
```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS crearis_admin_test;"
sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev_test OWNER crearis_admin;"
```

**Option 2: Use Environment Variable**
```bash
# Add to .env
TEST_DB_NAME=crearis_admin_test
```

## Migration Strategy Question

### Current Approach: Direct Schema Creation
**Location**: `tests/utils/db-test-utils.ts` → `initializeTestSchema()`

**Pros**:
- Fast - no migration overhead
- Simple - direct SQL statements
- Isolated - each test gets clean schema
- No dependency on migration files

**Cons**:
- Schema can drift from production
- Must manually update when migrations change
- Duplicates schema definition logic

### Alternative: Run Migrations
**Would change**: Test setup to run migrations 000-020

**Pros**:
- Schema always matches production
- Single source of truth
- Tests real migration process

**Cons**:
- Slower - must run all migrations per test
- More complex setup
- Harder to isolate test scenarios
- May need to run seed data migrations

### Recommendation
**Keep current approach** (Direct Schema Creation) but:
1. Add comment linking to production migrations
2. Add test to verify test schema matches production schema
3. Update test schema when migrations 000-020 change

**Reasoning**:
- Test speed is critical
- Test isolation is critical
- Tests focus on application logic, not migration process
- Migration correctness can be tested separately

## Summary

### What `pnpm test` Does
1. Runs Vitest with SQLite in-memory database
2. 26 tests pass (basic CRUD, compatibility tests)
3. 57 tests skip (i18n features - PostgreSQL-only)
4. 6 tests fail (5 from postgres-tables.test.ts misconfiguration, 1 transaction issue)

### What `pnpm test:pg` Should Do
1. Set `TEST_DATABASE_TYPE=postgresql`
2. Connect to `crearis_admin_dev_test` database as `crearis_admin` user
3. Create test schema directly (not via migrations)
4. Run all 89 tests (including i18n tests)

### Action Items
1. **Fix test database name**: Create `crearis_admin_dev_test`
2. **Fix postgres-tables.test.ts**: Mark PostgreSQL-only or skip on SQLite
3. **Fix transaction test**: Improve rollback handling in test utils
4. **Verify PostgreSQL tests**: Run `pnpm test:pg` after database fix

### Migration Decision
**Do NOT apply migrations 000-020 to test database**. Continue using direct schema creation for:
- Speed
- Isolation
- Simplicity
