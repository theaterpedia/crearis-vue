# Opus Database Conventions

**Code Automation Guide for Database Operations**

Version: 0.1 (December 2, 2025)

---

## A) Environment Strategy

### Database Connection

Database credentials are stored in `.env`:

```bash
DB_USER=crearis_admin
DB_PASSWORD=<password>
DB_NAME=crearis_admin_dev
DB_HOST=localhost
DB_PORT=5432
DATABASE_TYPE=postgresql
```

### Accessing Database via CLI

```bash
# Pattern
PGPASSWORD=<password> psql -h localhost -U <user> -d <database> -c "<SQL>"

# Example
PGPASSWORD=7uqf9nE0umJmMMo psql -h localhost -U crearis_admin -d crearis_admin_dev -c "SELECT * FROM sysreg_config;"
```

---

## B) Migration System

### Migration Registration Process

**Step 1:** Create migration file in `/server/database/migrations/`
```
044_capabilities_matrix.ts
```

**Step 2:** Add import to `/server/database/migrations/index.ts`
```typescript
import { migration as migration044 } from './044_capabilities_matrix'
```

**Step 3:** Register in the `migrations` array
```typescript
{ 
    run: migration044.up, 
    down: migration044.down, 
    metadata: { 
        id: migration044.id, 
        description: migration044.description, 
        version: '0.2.8', 
        date: '2025-12-02' 
    }, 
    reversible: true 
},
```

**Step 4:** Run migrations
```bash
pnpm dev
```

### Running Migrations

**Standard run (dev server starts, runs pending migrations):**
```bash
pnpm dev
```

**⚠️ DO NOT USE `SKIP_MIGRATIONS=false`** - This flag is for disabling old migrations, not for running them.

### Migration Status

Migration history is stored in `crearis_config` table:
```sql
SELECT config FROM crearis_config WHERE id = 1;
```

The `migrations_run` array in the JSON shows which migrations have been applied.

### Migration File Structure

```typescript
export const migration = {
    id: '044_capabilities_matrix',
    description: 'Capabilities Matrix for Auth System',
    
    async up(db: DatabaseAdapter) {
        // Forward migration
    },
    
    async down(db: DatabaseAdapter) {
        // Rollback migration (optional)
    }
}
```

---

## C) Sudo Insights

### When Root Access is Needed

- PostgreSQL service management: `sudo systemctl restart postgresql`
- File permissions in system directories
- Package installation: `sudo apt install ...`

### PostgreSQL Service Commands

```bash
# Check status
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# View logs
sudo journalctl -u postgresql -n 50
```

---

## D) Table Naming Conventions

### Sysreg Tables

| Table | Purpose |
|-------|---------|
| `sysreg` | Base/parent table (inherited) |
| `sysreg_status` | Workflow states |
| `sysreg_config` | Capabilities matrix / feature flags |
| `sysreg_rtags` | Record tags (favorite, pinned) |
| `sysreg_ctags` | Content tags (age, type) |
| `sysreg_ttags` | Topic tags (democracy, environment) |
| `sysreg_dtags` | Domain tags (games, workshops) |

### Entity Tables

| Table | Purpose |
|-------|---------|
| `projects` | Project records |
| `users` | User accounts |
| `posts` | Blog/news posts |
| `events` | Calendar events |
| `images` | Media images |
| `locations` | Venue/location records |
| `pages` | Static pages |

---

## E) Common Queries

### Check Sysreg Config Entries
```sql
SELECT id, name, value, description FROM sysreg_config;
```

### Check Migration Status
```sql
SELECT config->'migrations_run' FROM crearis_config WHERE id = 1;
```

### View Table Schema
```sql
\d sysreg_config
```

---

**Document Version:** 0.1  
**Last Updated:** December 2, 2025
