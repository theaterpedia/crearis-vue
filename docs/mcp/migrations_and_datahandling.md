# Database Migrations and Data Handling

## Manual vs Automatic Migrations

The migration system supports two types of migrations:

### Automatic Migrations (Default)
- Run automatically on server startup via `runMigrations()`
- Used for schema changes, table creation, index updates
- Examples: migrations 000-021

### Manual-Only Migrations
- Require explicit environment flag to execute
- Used for heavy data seeding, bulk imports, or optional operations
- **Current manual-only migrations:** 021, 022, 023, 024

## Running Manual Migrations

To execute manual-only migrations:

```bash
# Set environment variable and run migrations
RUN_MANUAL_MIGRATIONS=true pnpm db:migrate

# Or with database rebuild
RUN_MANUAL_MIGRATIONS=true pnpm db:rebuild
```

Without the flag, manual migrations are skipped:
```bash
# Will skip migrations 022-024
pnpm db:rebuild
# Output: ⏸️  Skipping manual migration: 022-seed-users-instructors (set RUN_MANUAL_MIGRATIONS=true to run)
```

## Marking a Migration as Manual-Only

In `server/database/migrations/index.ts`, add `manualOnly: true`:

```typescript
{
    run: migration022.up,
    metadata: migration022.metadata,
    manualOnly: true  // Prevents automatic execution
},
```

## Migration Registry

All migrations are registered in `server/database/migrations/index.ts`:
- `migrations` array contains all migrations in chronological order
- `getMigrationsRun()` checks which migrations have completed
- `markMigrationRun()` records successful completion in `crearis_config.config.migrations_run`

## Testing with Migrations

Tests use PostgreSQL only (SQLite deprecated since migration 019):
- Global setup runs all migrations before test suite
- Test database: `demo_data_test`
- Manual migrations **do not run** in test environment unless explicitly configured

See `docs/mcp/testing.md` for automation-friendly test commands.