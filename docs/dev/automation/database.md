# Database Access for Development Automation

This document covers database access patterns for development and AI-assisted coding workflows.

## Dev-Box Chapter

### Overview

When working with AI coding assistants (like GitHub Copilot), direct database access is often needed to inspect data, verify changes, or debug issues. However, using `psql` directly requires password prompts and manual credential lookup, which interrupts the automation flow.

### Solution: `db-query.ts` Utility

A lightweight TypeScript utility that:
- Uses the app's existing `.env` configuration (no password prompts)
- Outputs results in a clean table format
- Has built-in security safeguards to prevent production use

### Setup

1. **Enable the utility** by adding to your `.env`:
   ```
   DEV_DB_ACCESS=true
   ```

2. **Verify NODE_ENV** is NOT set to `production` (or unset entirely for dev)

### Usage

```bash
# Basic queries
npx tsx scripts/db-query.ts "SELECT id, name FROM images LIMIT 5"
npx tsx scripts/db-query.ts "SELECT * FROM users WHERE id = 1"

# JSONB fields (shapes use JSONB, not composite types)
npx tsx scripts/db-query.ts "SELECT id, img_wide->>'blur' as blur FROM images WHERE id = 108"
npx tsx scripts/db-query.ts "SELECT id, img_wide->>'url' as url FROM images LIMIT 3"

# Schema inspection
npx tsx scripts/db-query.ts "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'images'"

# Count records
npx tsx scripts/db-query.ts "SELECT COUNT(*) FROM images"

# Composite types (like author)
npx tsx scripts/db-query.ts "SELECT id, (author).adapter FROM images WHERE id = 108"
```

### Security Safeguards

The script includes **three layers of protection** against accidental production use:

1. **NODE_ENV check**: Refuses to run if `NODE_ENV=production`
2. **Explicit flag required**: Must have `DEV_DB_ACCESS=true` in `.env`
3. **Remote host warning**: Warns if connecting to non-localhost database

**Why these safeguards matter:**
- The script executes arbitrary SQL (needed for flexibility)
- Production `.env` files should NEVER have `DEV_DB_ACCESS=true`
- Even if script accidentally exists on production, it won't run

### Best Practices

| Do | Don't |
|---|---|
| Use for read queries during debugging | Add `DEV_DB_ACCESS=true` to production |
| Keep in `/scripts` (not deployed) | Expose as an API endpoint |
| Use localhost for development | Connect to production databases |

### AI Assistant Integration

When an AI assistant needs to inspect database state:

1. **Instead of:** `psql -U crearis -d crearis -c "SELECT ..."`  
   **Use:** `npx tsx scripts/db-query.ts "SELECT ..."`

2. Results are returned directly to the terminal without password prompts

3. The assistant can run queries and see results in one step

### File Location

```
scripts/db-query.ts    # The utility script
docs/dev/automation/   # This documentation
```

### Troubleshooting

**Error: "DEV_DB_ACCESS flag not set"**
- Add `DEV_DB_ACCESS=true` to your `.env` file

**Error: "Cannot run in production mode"**  
- Remove or change `NODE_ENV=production` from `.env`

**Error: "ECONNREFUSED"**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`

**Query syntax errors**
- Remember: shapes (`img_wide`, `img_square`) are JSONB → use `->>'field'`
- Composite types (`author`) use parentheses → use `(author).field`
