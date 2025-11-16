# Database Migration Best Practices

**Last Updated**: October 21, 2025

## Golden Rule: Migrations Must Be Idempotent

Every migration should be safe to run **multiple times** without errors. If a migration is interrupted or partially runs, it should be able to complete successfully on the next attempt.

## Common Patterns

### Adding Constraints

#### ❌ Wrong - Not Idempotent
```typescript
await db.exec(`
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_format 
    CHECK (id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
`)
// Error on second run: constraint already exists
```

#### ✅ Correct - Idempotent
```typescript
// Drop first (IF EXISTS makes it safe)
await db.exec(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_email_format`)

// Then add
await db.exec(`
    ALTER TABLE users 
    ADD CONSTRAINT users_id_email_format 
    CHECK (id ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
`)
```

### Creating Tables

#### ❌ Wrong - Not Idempotent
```typescript
await db.exec(`
    CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    )
`)
// Error on second run: table already exists
```

#### ✅ Correct - Idempotent
```typescript
await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    )
`)
```

### Adding Columns

#### ❌ Wrong - Not Idempotent
```typescript
await db.exec(`ALTER TABLE users ADD COLUMN email TEXT`)
// Error on second run: column already exists
```

#### ✅ Correct - Idempotent (with check)
```typescript
// Check if column exists first
const hasColumn = await db.get(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
`)

if (!hasColumn) {
    await db.exec(`ALTER TABLE users ADD COLUMN email TEXT`)
}
```

### Adding Indexes

#### ❌ Wrong - Not Idempotent
```typescript
await db.exec(`CREATE INDEX idx_users_email ON users(email)`)
// Error on second run: index already exists
```

#### ✅ Correct - Idempotent
```typescript
await db.exec(`DROP INDEX IF EXISTS idx_users_email`)
await db.exec(`CREATE INDEX idx_users_email ON users(email)`)
```

Or for PostgreSQL:
```typescript
await db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
```

### Inserting Seed Data

#### ❌ Wrong - Not Idempotent
```typescript
await db.run(`INSERT INTO roles (id, name) VALUES ('admin', 'Administrator')`)
// Error on second run: duplicate key
```

#### ✅ Correct - Idempotent
```typescript
// Check first
const exists = await db.get(`SELECT id FROM roles WHERE id = ?`, ['admin'])

if (!exists) {
    await db.run(`INSERT INTO roles (id, name) VALUES (?, ?)`, ['admin', 'Administrator'])
}
```

Or use UPSERT (PostgreSQL):
```typescript
await db.exec(`
    INSERT INTO roles (id, name) 
    VALUES ('admin', 'Administrator')
    ON CONFLICT (id) DO NOTHING
`)
```

### Foreign Keys

#### ❌ Wrong - Not Idempotent
```typescript
await db.exec(`
    ALTER TABLE projects 
    ADD CONSTRAINT projects_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id)
`)
// Error on second run: constraint already exists
```

#### ✅ Correct - Idempotent
```typescript
await db.exec(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey`)
await db.exec(`
    ALTER TABLE projects 
    ADD CONSTRAINT projects_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES users(id)
`)
```

## Database-Specific Considerations

### PostgreSQL
- Supports `IF EXISTS` / `IF NOT EXISTS` for most operations
- Use `CREATE INDEX IF NOT EXISTS`
- Use `DROP CONSTRAINT IF EXISTS`
- Supports `ON CONFLICT` for upserts

### SQLite
- Limited support for `ALTER TABLE`
- Cannot drop/modify constraints after table creation
- Cannot add `NOT NULL` to existing columns
- For major changes, must: create new table → copy data → drop old → rename new

## Migration Structure Template

```typescript
export default {
    id: '999_feature_name',
    name: 'Feature Name',
    
    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'
        
        console.log('Running migration 999: Feature Name...')
        
        // Phase 1: Drop constraints/indexes (if recreating)
        if (isPostgres) {
            await db.exec(`DROP CONSTRAINT IF EXISTS my_constraint`)
            await db.exec(`DROP INDEX IF EXISTS my_index`)
        }
        
        // Phase 2: Create/modify tables
        await db.exec(`CREATE TABLE IF NOT EXISTS new_table (...)`)
        
        // Phase 3: Add columns (with existence check)
        // Check before adding...
        
        // Phase 4: Migrate data (with safety checks)
        const needsMigration = await db.get(`SELECT COUNT(*) FROM old_table`)
        if (needsMigration) {
            // Migrate data...
        }
        
        // Phase 5: Add constraints/indexes
        if (isPostgres) {
            await db.exec(`DROP CONSTRAINT IF EXISTS new_constraint`)
            await db.exec(`ALTER TABLE ... ADD CONSTRAINT new_constraint ...`)
            
            await db.exec(`CREATE INDEX IF NOT EXISTS new_index ON ...`)
        }
        
        console.log('✅ Migration 999 completed')
    },
    
    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 999...')
        
        // Reverse the changes (also idempotent!)
        await db.exec(`DROP TABLE IF EXISTS new_table`)
        // ... etc
        
        console.log('✅ Migration 999 rolled back')
    }
}
```

## Testing Migrations

### Test Idempotency
```bash
# Run migration once
pnpm dev

# Stop server (Ctrl+C)

# Run again - should not error
pnpm dev
```

### Test Rollback
```bash
# Create test script: server/database/migrations/test-rollback.ts
import { db } from '../db-new'
import migration999 from './999_feature_name'

async function test() {
    // Run up
    await migration999.up(db)
    console.log('✅ Up migration passed')
    
    // Run up again (test idempotency)
    await migration999.up(db)
    console.log('✅ Idempotency test passed')
    
    // Run down
    await migration999.down(db)
    console.log('✅ Down migration passed')
    
    // Run up again (test clean rollback)
    await migration999.up(db)
    console.log('✅ Re-up migration passed')
}

test().catch(console.error)
```

## Common Migration Errors

### Error: "constraint already exists" (42710)
**Cause**: Trying to add a constraint without checking if it exists  
**Fix**: Use `DROP CONSTRAINT IF EXISTS` before `ADD CONSTRAINT`

### Error: "column already exists"
**Cause**: Trying to add a column without checking  
**Fix**: Query `information_schema.columns` first or handle the error

### Error: "duplicate key value"
**Cause**: Inserting seed data that already exists  
**Fix**: Check for existence or use `ON CONFLICT DO NOTHING`

### Error: "table does not exist"
**Cause**: Migration order is wrong or dependent migration didn't run  
**Fix**: Ensure migrations are numbered correctly and dependencies exist

## Migration Checklist

Before committing a migration, verify:

- [ ] Migration runs successfully on fresh database
- [ ] Migration can run twice without errors (idempotent)
- [ ] Rollback (`down`) works correctly
- [ ] Works on both PostgreSQL and SQLite (if applicable)
- [ ] Data is preserved during column/table changes
- [ ] Constraints are dropped before being recreated
- [ ] Indexes use `IF NOT EXISTS` or are dropped first
- [ ] Seed data checks for existence before inserting
- [ ] Error handling is present for critical operations
- [ ] Console output clearly shows progress
- [ ] Migration ID follows numbering scheme
- [ ] Migration is documented in CHANGELOG

## Recovery from Failed Migration

If a migration fails midway:

1. **Check what was applied**:
   ```sql
   SELECT * FROM crearis_config;
   -- Look at migrations_run array
   ```

2. **Manual cleanup** (if needed):
   ```sql
   -- Drop partially created objects
   DROP TABLE IF EXISTS problematic_table;
   DROP CONSTRAINT IF EXISTS problematic_constraint;
   ```

3. **Fix the migration** to be idempotent

4. **Restart server** - migration system will retry

5. **If completely broken**, reset database:
   ```bash
   # Backup first!
   pg_dump crearis > backup.sql
   
   # Drop and recreate
   DROP DATABASE crearis;
   CREATE DATABASE crearis;
   
   # Restart server - will run all migrations
   pnpm dev
   ```

## Resources

- PostgreSQL ALTER TABLE: https://www.postgresql.org/docs/current/sql-altertable.html
- SQLite ALTER TABLE: https://www.sqlite.org/lang_altertable.html
- Database adapter: `server/database/adapter.ts`
- Migration runner: `server/database/migrations/index.ts`

---

**Remember**: A migration that works once is good. A migration that works **every time** is production-ready!
