# Stage A: PostgreSQL Support - Developer Summary

## Overview
Added PostgreSQL as an alternative database option alongside SQLite, with unified interface and configuration-based selection.

## Implementation Status
✅ **COMPLETED**

## Changes Made

### 1. Database Configuration (`server/database/config.ts`)
- Created centralized configuration system
- Reads from environment variables:
  - `DATABASE_TYPE`: 'sqlite' (default) or 'postgresql'
  - `DATABASE_URL`: PostgreSQL connection string (required for PostgreSQL)
  - `SQLITE_PATH`: SQLite file path (optional, defaults to './demo-data.db')

```typescript
// Example .env configuration
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### 2. Database Adapter Interface (`server/database/adapter.ts`)
- Unified interface for both databases
- Supports async operations (PostgreSQL) and sync operations (SQLite)
- Methods: `exec`, `prepare`, `run`, `get`, `all`, `transaction`, `close`
- Automatic parameter placeholder conversion (? → $1, $2, ... for PostgreSQL)

### 3. SQLite Adapter (`server/database/adapters/sqlite.ts`)
- Wraps `better-sqlite3` with adapter interface
- Maintains WAL mode for concurrent access
- Exposes `getUnderlying()` for SQLite-specific operations

### 4. PostgreSQL Adapter (`server/database/adapters/postgresql.ts`)
- Uses `pg` library with connection pooling
- Async operations throughout
- Automatic parameter conversion (? to $1, $2, etc.)
- Transaction support with client checkout
- Exposes `getUnderlying()` for pool access

### 5. New Database Layer (`server/database/db-new.ts`)
- **Dual-logic detection**: Automatically selects adapter based on config
- **Dialect-aware SQL**: Adjusts CREATE TABLE statements for each database
  - Data types: TEXT, INTEGER stay same
  - Timestamps: `datetime('now')` (SQLite) vs `CURRENT_TIMESTAMP` (PostgreSQL)
  - Triggers: Different syntax per database
- **Current schema state**: All tables created with current structure (no migrations)
- **Lazy loading**: PostgreSQL adapter only loaded when needed

### 6. Schema Differences Handled

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Timestamp | `datetime('now')` | `CURRENT_TIMESTAMP` |
| Triggers | SQLite syntax | Function + trigger |
| Indexes | CREATE INDEX IF NOT EXISTS | CREATE INDEX IF NOT EXISTS |
| Parameter placeholders | `?` | `$1`, `$2`, ... |

## Tables Created
1. **events** - Event data with versioning
2. **posts** - Blog/article posts
3. **locations** - Location information
4. **instructors** - Instructor profiles
5. **participants** - Combined children/teens/adults
6. **hero_overrides** - Custom hero content
7. **users** - Authentication
8. **tasks** - Task management (Stage 2 schema with category)
9. **versions** - Version snapshots
10. **record_versions** - Record change history

## Database Selection Logic
```typescript
if (DATABASE_TYPE === 'sqlite') {
  // Use SQLiteAdapter with file-based storage
  dbAdapter = new SQLiteAdapter(SQLITE_PATH || './demo-data.db')
} else if (DATABASE_TYPE === 'postgresql') {
  // Use PostgreSQLAdapter with connection pool
  dbAdapter = new PostgreSQLAdapter(DATABASE_URL)
}
```

## Usage Examples

### Basic Queries
```typescript
// Both databases use same API
const events = await db.all('SELECT * FROM events WHERE status = ?', ['active'])
const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId])
await db.run('INSERT INTO events (id, name) VALUES (?, ?)', [id, name])
```

### Transactions
```typescript
await db.transaction(async () => {
  await db.run('INSERT INTO events ...', [params])
  await db.run('INSERT INTO tasks ...', [params])
})
```

### Prepared Statements
```typescript
const stmt = db.prepare('SELECT * FROM events WHERE id = ?')
const event = await stmt.get(eventId)
```

## Migration Notes
- **No migration files**: Current state deployed directly
- **CSV-based initialization**: Fresh deploys load from CSV files
- **No conversion needed**: SQLite ↔ PostgreSQL via CSV export/import

## Dependencies Required
```json
{
  "dependencies": {
    "better-sqlite3": "^9.x.x",  // Existing
    "pg": "^8.x.x"                // NEW - add this
  },
  "devDependencies": {
    "@types/pg": "^8.x.x"         // NEW - add this
  }
}
```

## Installation Steps
1. Install PostgreSQL dependencies:
   ```bash
   npm install pg
   npm install --save-dev @types/pg
   ```

2. Set environment variables:
   ```bash
   # .env
   DATABASE_TYPE=postgresql
   DATABASE_URL=postgresql://user:password@localhost:5432/demo_data
   ```

3. Replace `db.ts` imports:
   ```typescript
   // Old
   import db from './database/db'
   
   // New
   import db from './database/db-new'
   ```

## Testing Checklist
- [ ] SQLite connection works (default)
- [ ] PostgreSQL connection works (with env vars)
- [ ] All tables created correctly
- [ ] Indexes created
- [ ] Triggers work for both databases
- [ ] Parameter conversion (? to $1, $2) works
- [ ] Transactions work for both
- [ ] CSV import works for both

## Known Limitations
1. **Async handling**: Existing code may need `await` keywords added
2. **Type differences**: Some PostgreSQL types may need mapping
3. **Trigger syntax**: Different per database, abstracted in db-new.ts

## Next Steps
- **Stage B**: Create Vitest setup with PostgreSQL integration tests
- **Stage C**: TBD
- **Stage D**: Analyze db.ts usage throughout project, add coverage for uncertain areas

## Files Modified
- Created: `server/database/config.ts`
- Created: `server/database/adapter.ts`
- Created: `server/database/adapters/sqlite.ts`
- Created: `server/database/adapters/postgresql.ts`
- Created: `server/database/db-new.ts` (replacement for db.ts)

## Rollback Plan
Keep original `db.ts` file. To rollback:
1. Change imports from `db-new.ts` back to `db.ts`
2. Set `DATABASE_TYPE=sqlite` in .env
3. Remove PostgreSQL dependencies if needed
