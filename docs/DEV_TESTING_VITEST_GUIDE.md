# Developer Testing Guide - Vitest Integration Tests

## Overview

This guide demonstrates how to write integration tests using Vitest with PostgreSQL for the Crearis application. All examples are taken from the successful `images-api.test.ts` implementation.

## Prerequisites

- PostgreSQL test database configured
- Vitest installed and configured
- Migration-based test setup (runs migrations 000-022 before tests)
- Set `TEST_DATABASE_TYPE=postgresql` environment variable

## Running Tests

```bash
# Run specific test file
TEST_DATABASE_TYPE=postgresql pnpm vitest run tests/integration/images-api.test.ts

# Run with verbose output
TEST_DATABASE_TYPE=postgresql pnpm vitest run tests/integration/images-api.test.ts --reporter=verbose

# Run in watch mode
TEST_DATABASE_TYPE=postgresql pnpm vitest tests/integration/images-api.test.ts
```

## Test Structure

### Basic Setup

```typescript
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { PostgreSQLAdapter } from '../../server/database/adapters/postgresql.js'
import { testDbConfig, isPostgreSQLTest } from '../../server/database/test-config.js'
import type { DatabaseAdapter } from '../../server/database/adapter.js'

// Skip tests if not running on PostgreSQL
const describeOrSkip = isPostgreSQLTest() ? describe : describe.skip

// Shared database connection for all tests
let sharedDb: DatabaseAdapter

// Connect once before all tests
beforeAll(async () => {
    if (isPostgreSQLTest()) {
        sharedDb = new PostgreSQLAdapter(testDbConfig.connectionString!)
    }
})
```

### Helper Functions

Create reusable helper functions for common setup tasks:

```typescript
// Helper to create test users (handles foreign key constraints)
async function createTestUsers(db: DatabaseAdapter) {
    await db.run(`
        INSERT INTO users (id, sysmail, password, username, status_id, role)
        VALUES 
            (1, 'user1@test.com', 'hash1', 'user1', 18, 'user'),
            (2, 'user2@test.com', 'hash2', 'user2', 18, 'user'),
            (3, 'user3@test.com', 'hash3', 'user3', 18, 'user'),
            (4, 'user4@test.com', 'hash4', 'user4', 18, 'user'),
            (5, 'user5@test.com', 'hash5', 'user5', 18, 'user')
        ON CONFLICT (id) DO NOTHING
    `)
}
```

## Example 1: Testing POST (Create) Operations

Test creating new records with required and optional fields, including automatic field population via triggers.

```typescript
describeOrSkip('Images API - POST /api/images', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = sharedDb
        // Clean up before each test
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')
        // Create prerequisite data
        await createTestUsers(db)
    })

    it('should create a new image with required fields', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])

        const imageId = result.rows?.[0]?.id
        expect(imageId).toBeDefined()

        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])
        expect(image).toBeDefined()
        expect(image.name).toBe('Test Image')
        expect(image.url).toBe('https://example.com/test.jpg')
        expect(image.status_id).toBe(0) // default value
        expect(image.fileformat).toBe('none') // default value
        expect(image.license).toBe('BY') // default value
    })

    it('should set computed fields via trigger', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url, owner_id)
            VALUES (?, ?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg', 5])

        const imageId = result.rows?.[0]?.id
        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])
        
        // Verify trigger-computed fields
        expect(image.about).toBe('(c) owner_id:5')
        expect(image.use_player).toBe(false)
        expect(image.is_public).toBe(false)
        expect(image.is_private).toBe(false)
        expect(image.is_internal).toBe(false)
    })

    it('should set timestamps automatically', async () => {
        const result = await db.run(`
            INSERT INTO images (name, url)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg'])

        const imageId = result.rows?.[0]?.id
        const image = await db.get('SELECT * FROM images WHERE id = ?', [imageId])
        
        expect(image.created_at).toBeDefined()
        expect(image.updated_at).toBeDefined()
        expect(image.date).toBeDefined()
    })
})
```

### Key Takeaways (Example 1):
- Use `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` to clean up before each test
- Test both required fields and default values
- Verify trigger-computed fields populate correctly
- Check automatic timestamp generation

## Example 2: Testing GET (List/Filter) Operations

Test retrieving records with various filters and sorting options.

```typescript
describeOrSkip('Images API - GET /api/images', () => {
    let db: DatabaseAdapter

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')
        
        // Create prerequisite users
        await createTestUsers(db)

        // Insert test data
        await db.run(`
            INSERT INTO images (name, url, domaincode, status_id, owner_id)
            VALUES 
                ('Image 1', 'https://example.com/img1.jpg', 'tp', 18, 1),
                ('Image 2', 'https://example.com/img2.jpg', 'tp', 0, 1),
                ('Image 3', 'https://example.com/img3.jpg', 'regio1', 18, 2),
                ('Image 4', 'https://example.com/img4.jpg', NULL, 18, NULL)
        `)
    })

    it('should list all images', async () => {
        const result = await db.all('SELECT * FROM images')
        expect(result).toHaveLength(4)
    })

    it('should filter by domaincode', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE domaincode = ?',
            ['tp']
        )
        expect(result).toHaveLength(2)
        expect(result[0].domaincode).toBe('tp')
        expect(result[1].domaincode).toBe('tp')
    })

    it('should filter by owner_id', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE owner_id = ?',
            [1]
        )
        expect(result).toHaveLength(2)
    })

    it('should filter by status_id', async () => {
        const result = await db.all(
            'SELECT * FROM images WHERE status_id = ?',
            [18]
        )
        expect(result).toHaveLength(3)
    })

    it('should order by created_at DESC', async () => {
        const result = await db.all('SELECT * FROM images ORDER BY created_at DESC, id DESC')
        expect(result).toHaveLength(4)
        // Verify ordering works (latest id first when timestamps are equal)
        expect(result[0].id).toBeGreaterThan(result[1].id)
        expect(result[1].id).toBeGreaterThan(result[2].id)
    })
})
```

### Key Takeaways (Example 2):
- Set up test data that covers various filter scenarios
- Test NULL values in optional fields
- When testing ordering, account for batch inserts having identical timestamps
- Use secondary sort key (id) for deterministic ordering in tests

## Example 3: Testing PUT (Update) Operations

Test updating existing records and verifying timestamp updates.

```typescript
describeOrSkip('Images API - PUT /api/images/:id', () => {
    let db: DatabaseAdapter
    let testImageId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create test image
        const result = await db.run(`
            INSERT INTO images (name, url, x, y)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, ['Original Name', 'https://example.com/original.jpg', 1920, 1080])

        testImageId = result.rows?.[0]?.id
    })

    it('should update image name', async () => {
        await db.run(`
            UPDATE images SET name = ? WHERE id = ?
        `, ['Updated Name', testImageId])

        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])
        expect(image.name).toBe('Updated Name')
        // Verify other fields unchanged
        expect(image.url).toBe('https://example.com/original.jpg')
    })

    it('should update multiple fields', async () => {
        await db.run(`
            UPDATE images 
            SET name = ?, x = ?, y = ?, alt_text = ?
            WHERE id = ?
        `, ['New Name', 800, 600, 'New alt text', testImageId])

        const image = await db.get('SELECT * FROM images WHERE id = ?', [testImageId])
        expect(image.name).toBe('New Name')
        expect(image.x).toBe(800)
        expect(image.y).toBe(600)
        expect(image.alt_text).toBe('New alt text')
    })

    it('should update updated_at timestamp', async () => {
        const before = await db.get('SELECT updated_at FROM images WHERE id = ?', [testImageId])
        
        // Small delay to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10))
        
        await db.run(`
            UPDATE images SET name = ? WHERE id = ?
        `, ['Changed', testImageId])

        const after = await db.get('SELECT updated_at FROM images WHERE id = ?', [testImageId])
        expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime())
    })
})
```

### Key Takeaways (Example 3):
- Store test record ID in `beforeEach` for reuse across tests
- Verify only intended fields change
- Test single-field and multi-field updates separately
- When testing timestamps, add small delay to ensure measurable difference

## Example 4: Testing Foreign Key Relationships & Triggers

Test integration between tables, including trigger-populated performance fields.

```typescript
describeOrSkip('Images Integration - Performance Fields (Triggers)', () => {
    let db: DatabaseAdapter
    let imageId: number
    let projectId: number

    beforeEach(async () => {
        db = sharedDb
        await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')

        // Create test image
        const imgResult = await db.run(`
            INSERT INTO images (name, url, x, y)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, ['Test Image', 'https://example.com/test.jpg', 1920, 1080])
        imageId = imgResult.rows?.[0]?.id

        // Create test project
        const projResult = await db.run(`
            INSERT INTO projects (name, domaincode)
            VALUES (?, ?)
            RETURNING id
        `, ['Test Project', 'tp'])
        projectId = projResult.rows?.[0]?.id
    })

    it('should populate img_show field when img_id is set', async () => {
        await db.run(`
            UPDATE projects SET img_id = ? WHERE id = ?
        `, [imageId, projectId])

        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId])
        
        expect(project.img_id).toBe(imageId)
        expect(project.img_show).toBe(true) // Trigger sets to true when img_id present
    })

    it('should populate img_thumb field with URL', async () => {
        await db.run(`
            UPDATE projects SET img_id = ? WHERE id = ?
        `, [imageId, projectId])

        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId])
        
        expect(project.img_thumb).toBe('https://example.com/test.jpg')
    })

    it('should populate all 5 performance fields', async () => {
        await db.run(`
            UPDATE projects SET img_id = ? WHERE id = ?
        `, [imageId, projectId])

        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId])
        
        // Verify all trigger-populated fields
        expect(project.img_show).toBe(true)
        expect(project.img_thumb).toBe('https://example.com/test.jpg')
        expect(project.img_square).toBe('https://example.com/test.jpg')
        expect(project.img_wide).toBe('https://example.com/test.jpg')
        expect(project.img_vert).toBe('https://example.com/test.jpg')
    })

    it('should set defaults when img_id is NULL', async () => {
        // Project created without img_id
        const result = await db.run(`
            INSERT INTO projects (name, domaincode)
            VALUES (?, ?)
            RETURNING id
        `, ['No Image Project', 'tp'])

        const newProjectId = result.rows?.[0]?.id
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [newProjectId])
        
        // Verify default values
        expect(project.img_id).toBeNull()
        expect(project.img_show).toBe(false)
        expect(project.img_thumb).toBe('dummy')
        expect(project.img_square).toBe('dummy')
        expect(project.img_wide).toBe('dummy')
        expect(project.img_vert).toBe('dummy')
    })
})
```

### Key Takeaways (Example 4):
- Test foreign key relationships by creating records in both tables
- Verify trigger behavior with both NULL and valid foreign keys
- Test all computed/derived fields populated by triggers
- Check default values when foreign key is NULL

## Best Practices

### 1. Database Cleanup
```typescript
beforeEach(async () => {
    // Use TRUNCATE with RESTART IDENTITY to reset auto-increment
    // CASCADE removes dependent records
    await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')
})
```

### 2. Foreign Key Dependencies
```typescript
// Always create prerequisite records before inserting dependent records
await createTestUsers(db)  // Users first
await db.run('INSERT INTO images (name, url, owner_id) VALUES (?, ?, ?)', 
    ['Image', 'url', 1])  // Then images
```

### 3. Shared Connection
```typescript
// Use one connection for all tests to avoid connection overhead
let sharedDb: DatabaseAdapter

beforeAll(async () => {
    sharedDb = new PostgreSQLAdapter(testDbConfig.connectionString!)
})

beforeEach(async () => {
    db = sharedDb  // Reuse connection
})
```

### 4. Conditional Test Execution
```typescript
// Skip tests when not running on PostgreSQL
const describeOrSkip = isPostgreSQLTest() ? describe : describe.skip

describeOrSkip('My PostgreSQL Tests', () => {
    // Tests only run when TEST_DATABASE_TYPE=postgresql
})
```

### 5. Test Isolation
```typescript
// Each test should be independent
beforeEach(async () => {
    // Reset state
    await db.exec('TRUNCATE TABLE images RESTART IDENTITY CASCADE')
    // Create fresh test data
    await createTestUsers(db)
})
```

### 6. Assertion Patterns
```typescript
// Test existence
expect(result).toBeDefined()
expect(result).not.toBeNull()

// Test values
expect(value).toBe(expectedValue)  // Exact match
expect(value).toBeGreaterThan(0)   // Numeric comparison
expect(array).toHaveLength(4)      // Array length

// Test objects
expect(object.field).toBe('value')
```

## Common Pitfalls & Solutions

### Pitfall 1: Foreign Key Violations
**Problem**: `insert or update on table "images" violates foreign key constraint`

**Solution**: Create prerequisite records first
```typescript
await createTestUsers(db)  // Must create users before referencing owner_id
```

### Pitfall 2: Missing Required Fields
**Problem**: `null value in column "password" violates not-null constraint`

**Solution**: Check schema and include all NOT NULL columns
```typescript
// Check schema first
// psql -U user -d database -c "\d users"

// Include all required fields
INSERT INTO users (sysmail, password, username, role, status_id)
```

### Pitfall 3: Wrong Column Names
**Problem**: `column "email" of relation "users" does not exist`

**Solution**: Use correct column names from actual schema
```typescript
// Wrong: email
// Correct: sysmail
INSERT INTO users (sysmail, ...) VALUES (?, ...)
```

### Pitfall 4: Timestamp Ordering in Tests
**Problem**: Batch inserts have identical timestamps, making order unpredictable

**Solution**: Add secondary sort key or test relative ordering
```typescript
// Add secondary sort
ORDER BY created_at DESC, id DESC

// Or test relative ordering
expect(result[0].id).toBeGreaterThan(result[1].id)
```

## Performance Notes

- **Migration Setup**: Runs once per test session (~9 seconds for 21 migrations)
- **Test Execution**: ~5 seconds for 25 tests
- **Total Runtime**: ~9.4 seconds with full setup
- **Per Test**: ~200ms average including cleanup

## CI/CD Integration

```yaml
# GitHub Actions example
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: postgres
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v3
    - name: Run tests
      env:
        TEST_DATABASE_TYPE: postgresql
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: pnpm vitest run
```

## References

- Full test implementation: `tests/integration/images-api.test.ts`
- Test configuration: `server/database/test-config.ts`
- Global setup: `tests/setup/global-setup.ts`
- Migration system: `server/database/migrations/`

---

**Last Updated**: November 2, 2025  
**Test Coverage**: 25/25 passing (100%)  
**Migration Version**: 022
