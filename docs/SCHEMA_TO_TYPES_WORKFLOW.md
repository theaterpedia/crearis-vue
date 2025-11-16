# Schema-to-Types Automation Workflow

**Date:** October 24, 2025  
**Status:** ✅ Complete

## Overview

Complete automation workflow from database migrations to TypeScript types, with a single source of truth in the schema registry JSON.

## The Complete Chain

```
Database Migrations (SQL)
        ↓
Schema Definition Generator
        ↓
Schema Registry JSON (v0.0.2.json)  ← Single Source of Truth
        ↓
TypeScript Type Generator
        ↓
Type Definitions (database.ts)
        ↓
Type-Safe Application Code
```

## Components

### 1. Database Migrations

**Location:** `server/database/migrations/`

**Latest:**
- Migration 019: Auto-increment INTEGER IDs, status_id, FK updates
- Migration 020: i18n Core (lang field, status_display)

**Run:**
```bash
pnpm db:migrate
```

### 2. Schema Definition Generator

**File:** `server/database/generate-schema-definition.ts`

**What it does:**
- Connects to PostgreSQL and SQLite databases
- Reads all table structures via `information_schema`
- Extracts column definitions, types, constraints, defaults
- Notes database-specific differences
- Generates versioned JSON file

**Output:** `server/database/schema-definitions/v0.0.2.json`

**Run:**
```bash
npx tsx server/database/generate-schema-definition.ts 0.0.2
```

**Result:**
```json
{
  "version": "0.0.2",
  "tables": {
    "tasks": {
      "columns": {
        "id": { "type": "TEXT", "nullable": false, "primaryKey": true },
        "status_id": { "type": "INTEGER", "nullable": false, "default": "2" },
        "lang": { "type": "TEXT", "nullable": false, "default": "'de'::text" },
        "status_display": { "type": "TEXT", "nullable": true }
      }
    }
  }
}
```

### 3. TypeScript Type Generator

**File:** `server/database/generate-types-from-schema.ts`

**What it does:**
- Reads schema registry JSON
- Maps PostgreSQL types to TypeScript types
- Generates interface definitions
- Creates type guard functions
- Adds helper functions

**Output:** `server/types/database.ts` (auto-generated)

**Run:**
```bash
npx tsx server/database/generate-types-from-schema.ts 0.0.2
```

**Result:**
```typescript
export interface TasksTableFields {
    id: string // PRIMARY KEY
    status_id: number // default: 2
    lang: string // default: 'de'::text
    status_display?: string | null // GENERATED COLUMN (read-only)
}

export function isValidTasksField(key: string): key is keyof TasksTableFields {
    const validFields: (keyof TasksTableFields)[] = [
        'id', 'status_id', 'lang', 'status_display', ...
    ]
    return validFields.includes(key as keyof TasksTableFields)
}
```

## Complete Workflow

### After Making Schema Changes

```bash
# 1. Create/modify migration file
# server/database/migrations/021_new_migration.ts

# 2. Run migration
pnpm db:migrate

# 3. Regenerate schema JSON (increment version if needed)
npx tsx server/database/generate-schema-definition.ts 0.0.2

# 4. Regenerate TypeScript types from schema
npx tsx server/database/generate-types-from-schema.ts 0.0.2

# 5. Verify compilation
pnpm build
```

### Recommended NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx server/database/migrate.ts",
    "db:schema": "tsx server/database/generate-schema-definition.ts 0.0.2",
    "db:types": "tsx server/database/generate-types-from-schema.ts 0.0.2",
    "db:validate": "tsx server/database/check-structure.ts 0.0.2",
    "db:update": "npm run db:migrate && npm run db:schema && npm run db:types"
  }
}
```

**Usage:**
```bash
# Full update workflow
pnpm db:update

# Or step by step
pnpm db:migrate     # Run migrations
pnpm db:schema      # Generate schema JSON
pnpm db:types       # Generate TypeScript types
pnpm db:validate    # Validate schema matches database
```

## Type Mapping Logic

### PostgreSQL → TypeScript

```typescript
INTEGER          → number
TEXT             → string
BOOLEAN          → boolean
JSONB            → Record<string, any>
TIMESTAMP        → string
DATE             → string
SERIAL           → number
ARRAY types      → type[]
```

### Nullability

```typescript
// Nullable column
column_name?: string | null

// Non-nullable column
column_name: string
```

### Special Annotations

```typescript
// Primary key
id: number // PRIMARY KEY, default: nextval('tasks_id_seq'::regclass)

// Default value
status_id: number // default: 2

// Generated column (read-only)
status_display?: string | null // GENERATED COLUMN (read-only)
```

## Benefits

### 1. Single Source of Truth
- Schema JSON is authoritative
- Types auto-generated from schema
- No manual synchronization needed

### 2. Complete Automation
- One command regenerates everything
- No risk of forgetting to update types
- Fast regeneration (< 1 second)

### 3. Type Safety
- Compile-time checking
- Auto-completion in IDEs
- Prevents referencing non-existent columns

### 4. AI-Friendly
- Schema JSON directly readable by AI assistants
- No need to recompute migrations
- Clear workflow for AI-assisted development

### 5. Maintainability
- Zero manual type maintenance
- Easy to keep 26 tables (311 columns) in sync
- Clear audit trail (schema version history)

## Statistics (v0.0.2)

### Schema Registry
- **Tables:** 26
- **Total Columns:** 311
- **PostgreSQL Tables:** 26
- **SQLite Tables:** 14

### Generated Types
- **Interfaces:** 26
- **Type Guards:** 26
- **Helper Functions:** 1
- **Total Lines:** 711

## Version History

### v0.0.1 (Manual Approach)
- ❌ Manually written types
- ❌ Only 12 tables covered
- ❌ High maintenance overhead
- ❌ Risk of drift from schema
- ❌ ~350 lines

### v0.0.2 (Automated Approach)
- ✅ Auto-generated from schema
- ✅ All 26 tables covered
- ✅ Zero maintenance
- ✅ Perfect sync with schema
- ✅ 711 lines (complete coverage)

## Example: Tasks Table

### Migration 020 (SQL)
```sql
ALTER TABLE tasks ADD COLUMN lang TEXT NOT NULL DEFAULT 'de' 
    CHECK (lang IN ('de', 'en', 'cz'));

ALTER TABLE tasks ADD COLUMN status_display TEXT 
    GENERATED ALWAYS AS (get_status_display_name(status_id, lang)) STORED;
```

### Generated Schema JSON
```json
{
  "tasks": {
    "columns": {
      "lang": {
        "type": "TEXT",
        "nullable": false,
        "default": "'de'::text"
      },
      "status_display": {
        "type": "TEXT",
        "nullable": true
      }
    }
  }
}
```

### Generated TypeScript
```typescript
export interface TasksTableFields {
    lang: string // default: 'de'::text
    status_display?: string | null // GENERATED COLUMN (read-only)
}
```

### Usage in Code
```typescript
import { TasksTableFields, isValidTasksField } from '@/server/types/database'

// Type-safe INSERT
const newTask: Partial<TasksTableFields> = {
    name: 'Fix login bug',
    status_id: 2,
    lang: 'de'
}

// Type guard
if (isValidTasksField('status_display')) {
    // TypeScript knows this is valid
}
```

## Validation

### Schema Validation
```bash
npx tsx server/database/check-structure.ts 0.0.2
```

Verifies:
- ✅ All tables exist
- ✅ All columns match expected types
- ✅ Constraints are correct
- ✅ Database-specific differences noted

### Type Checking
```bash
pnpm build
```

TypeScript will catch:
- ❌ Referencing non-existent columns
- ❌ Type mismatches
- ❌ Null safety violations

## Documentation

- **Schema Registry:** `docs/SCHEMA_REGISTRY.md`
- **Type Generation:** `docs/AUTOMATED_TYPE_GENERATION.md`
- **This Workflow:** `docs/SCHEMA_TO_TYPES_WORKFLOW.md`
- **Migration 019:** `docs/core/MIGRATION_019_INTEGER_IDS.md`
- **Migration 020:** `docs/MIGRATION_020_I18N.md`

## Files

### Generators
- `server/database/generate-schema-definition.ts` - Schema JSON generator
- `server/database/generate-types-from-schema.ts` - TypeScript type generator
- `server/database/check-structure.ts` - Schema validator

### Outputs
- `server/database/schema-definitions/v0.0.2.json` - Schema registry
- `server/types/database.ts` - Type definitions (auto-generated)

### Migrations
- `server/database/migrations/019_*.ts` - INTEGER IDs migration
- `server/database/migrations/020_*.ts` - i18n Core migration

## Best Practices

### 1. Always Regenerate After Migrations
```bash
pnpm db:update
```

### 2. Commit Schema + Types Together
```bash
git add server/database/schema-definitions/v0.0.2.json
git add server/types/database.ts
git commit -m "Update schema and types after Migration 020"
```

### 3. Version Schema Files
- Increment version for breaking changes
- Keep old versions for reference
- Document changes in migration files

### 4. Never Edit Generated Files Manually
- `server/types/database.ts` is auto-generated
- Always regenerate, never edit directly
- Header warns: "DO NOT EDIT MANUALLY"

### 5. Use Type Guards
```typescript
// Good ✅
if (isValidTasksField(key)) {
    // TypeScript knows key is valid
}

// Bad ❌
if (validFields.includes(key)) {
    // No type safety
}
```

## Summary

The schema-to-types automation provides:

1. ✅ **Accuracy:** Types always match current schema
2. ✅ **Efficiency:** One command to regenerate everything
3. ✅ **Completeness:** All 26 tables, 311 columns covered
4. ✅ **Safety:** Compile-time type checking
5. ✅ **Maintainability:** Zero manual updates needed
6. ✅ **AI-Friendly:** Single source of truth for AI assistants

This workflow is now the standard for maintaining database schema and types in the project.
