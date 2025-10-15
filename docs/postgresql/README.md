# PostgreSQL Integration Documentation

This directory contains documentation for PostgreSQL integration into the demo-data project.

## Project Structure

The project is implementing PostgreSQL support in stages:

### Stage A: Core Infrastructure ✅ COMPLETED
- Database configuration system
- Unified adapter interface (SQLite + PostgreSQL)
- Dual-logic database detection
- Current schema deployment (no migrations)
- [Read Stage A Summary](./stage-a-summary.md)

### Stage B: Testing Infrastructure 🔄 PENDING
- Vitest setup for PostgreSQL integration tests
- Batch test runner for 'pgintegration' tests
- One-by-one test execution capability
- Visual test results

### Stage C: Coverage & Validation 🔄 PENDING
- Analyze db.ts usage throughout project
- Identify PostgreSQL compatibility concerns
- Add Vitest coverage for uncertain areas
- Comprehensive test suite

## Quick Start

### Using SQLite (Default)
No configuration needed. The project works out of the box with SQLite.

### Using PostgreSQL
1. Install dependencies:
   ```bash
   npm install pg @types/pg
   ```

2. Create `.env` file:
   ```env
   DATABASE_TYPE=postgresql
   DATABASE_URL=postgresql://user:password@localhost:5432/demo_data
   ```

3. Start PostgreSQL server and create database:
   ```bash
   createdb demo_data
   ```

4. Run the application - tables will be created automatically

## Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `DATABASE_TYPE` | `sqlite`, `postgresql` | `sqlite` | Database engine to use |
| `DATABASE_URL` | Connection string | - | PostgreSQL connection (required for PostgreSQL) |
| `SQLITE_PATH` | File path | `./demo-data.db` | SQLite database file location |

## Architecture

```
server/database/
├── config.ts              # Configuration & environment variables
├── adapter.ts             # Unified database interface
├── adapters/
│   ├── sqlite.ts         # SQLite adapter (better-sqlite3)
│   └── postgresql.ts     # PostgreSQL adapter (pg)
├── db.ts                 # Original SQLite-only (deprecated)
└── db-new.ts             # New dual-database layer
```

## Database Features

### Supported Operations
- ✅ CREATE TABLE with dialect-aware SQL
- ✅ SELECT queries with parameter binding
- ✅ INSERT/UPDATE/DELETE operations
- ✅ Transactions
- ✅ Prepared statements
- ✅ Indexes
- ✅ Triggers (auto-update timestamps)

### Table Schema
All tables include versioning and timestamp columns:
- `version_id` - Link to version snapshot
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp (auto-updated)
- `status` - Record status (active/archived/deleted)

## Data Flow

```
CSV Files → Database (SQLite or PostgreSQL) → API → Frontend
    ↑                                              ↓
    └────────────────── CSV Export ←──────────────┘
```

The system always initializes from CSV and can export back to CSV, providing a conversion path between SQLite and PostgreSQL without direct migration.

## Testing Strategy

### Unit Tests
Test individual adapters and query logic

### Integration Tests
Test full database operations with both SQLite and PostgreSQL

### Compatibility Tests
Verify that all API endpoints work with both databases

## Development Workflow

1. **Default Development**: Use SQLite (no setup needed)
2. **PostgreSQL Testing**: Set env vars and test with PostgreSQL
3. **CI/CD**: Test both databases in pipeline
4. **Production**: Choose database via environment configuration

## Troubleshooting

### PostgreSQL Connection Issues
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Ensure database exists
- Check user permissions

### SQLite Issues
- Verify file path permissions
- Check disk space
- Ensure no file locks

### Parameter Placeholder Issues
- Adapters automatically convert `?` to `$1`, `$2` for PostgreSQL
- Use `?` in all queries, conversion is automatic

## Contributing

When adding new database operations:
1. Use the unified `db` interface
2. Test with both SQLite and PostgreSQL
3. Avoid database-specific SQL when possible
4. Document dialect differences if needed

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [node-postgres (pg)](https://node-postgres.com/)
