# Schema Registry Documentation

**Last Updated**: October 24, 2025  
**Current Version**: v0.0.2  
**Location**: `server/database/schema-definitions/v0.0.2.json`

## Overview

The schema registry is a JSON file that contains the complete, validated database schema for the crearis-demo-data system. This file serves as the single source of truth for the database structure and can be used for automated code generation, validation, and AI-assisted development.

## Purpose

1. **Quick Schema Lookup**: AI assistants (like Claude Sonnet) can quickly reference the exact database schema without needing to recompute migrations
2. **Schema Validation**: Automated checks to ensure database matches expected structure
3. **Documentation**: Human-readable schema reference
4. **Code Generation**: Source for generating TypeScript types, API endpoints, etc.

## File Location

```
server/database/schema-definitions/
├── v0.0.1.json  (Outdated - before Migration 019)
└── v0.0.2.json  (Current - includes Migration 019 & 020)
```

## Current Schema Version: v0.0.2

### Includes

- ✅ **Migration 019**: Auto-increment INTEGER IDs, status_id, FK updates
  - All entity tables converted to INTEGER PRIMARY KEY
  - Foreign keys updated to INTEGER
  - projects.id → INTEGER with separate domaincode field
  - Column renames: tasks.title → name, tasks.image → cimg

- ✅ **Migration 020**: i18n Core Implementation
  - `lang` field added to: participants, instructors, tasks, locations, users
  - `status_display` computed column added to: events, posts, participants, instructors, tasks, locations, users
  - PostgreSQL function: `get_status_display_name(status_id, lang)`
  - Status table with name_i18n JSONB translations

### Statistics

- **Total Tables**: 26
- **PostgreSQL Tables**: 26
- **SQLite Tables**: 14 (subset for demo mode)

### Key Tables

1. **status** - Status definitions with i18n translations
2. **users** - User accounts with roles and status
3. **projects** - Projects with domaincode and metadata
4. **tasks** - Task management with i18n support
5. **events** - Events with i18n status display
6. **posts** - Blog posts with i18n status display
7. **participants** - Participants with i18n support
8. **instructors** - Instructors with i18n support
9. **locations** - Locations with i18n support

## Regenerating the Schema

After running database migrations, regenerate the schema definition:

```bash
# Step 1: Generate new schema JSON
npx tsx server/database/generate-schema-definition.ts 0.0.2

# Step 2: Generate TypeScript types from schema
npx tsx server/database/generate-types-from-schema.ts 0.0.2
```

This will:
1. Read current database structure (PostgreSQL + SQLite)
2. Generate schema definition JSON with all table/column metadata
3. Generate TypeScript type definitions from the schema JSON
4. Update `server/types/database.ts` with type-safe interfaces

**Recommended NPM Scripts:**
```json
{
  "scripts": {
    "db:schema": "tsx server/database/generate-schema-definition.ts 0.0.2",
    "db:types": "tsx server/database/generate-types-from-schema.ts 0.0.2",
    "db:update": "npm run db:schema && npm run db:types"
  }
}
```

## Schema Validation

To validate that the database matches the schema definition:

```bash
npx tsx server/database/check-structure.ts 0.0.2
```

This will:
- Compare actual database structure to schema definition
- Report missing tables or columns
- Identify type mismatches
- Highlight database-specific differences

## Using the Schema Registry

### For AI Assistants

When working with the database schema, AI assistants can:

```typescript
// Read the schema definition
import schema from './server/database/schema-definitions/v0.0.2.json'

// Get table structure
const tasksSchema = schema.tables.tasks

// Get column definitions
const columns = tasksSchema.columns
// columns.status_id => { type: 'INTEGER', nullable: false, default: '2' }
// columns.lang => { type: 'TEXT', nullable: false, default: "'de'::text" }
// columns.status_display => { type: 'TEXT', nullable: true }
```

### For Developers

```typescript
import { readFileSync } from 'fs'

const schemaPath = './server/database/schema-definitions/v0.0.2.json'
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))

// Get all tables
const tables = Object.keys(schema.tables)

// Get column info for a table
const taskColumns = schema.tables.tasks.columns

// Check if column exists
if ('status_display' in taskColumns) {
  console.log('Tasks table has status_display column')
}
```

## Schema Structure

```typescript
interface SchemaDefinition {
  version: string                    // "0.0.2"
  schemaVersion: number              // 1
  generatedAt: string                // ISO timestamp
  description: string                // Human-readable description
  tables: {
    [tableName: string]: {
      description: string
      columns: {
        [columnName: string]: {
          type: string               // "INTEGER", "TEXT", "JSONB", etc.
          nullable: boolean          // true/false
          primaryKey?: boolean       // Optional, true if PK
          default?: string           // Optional, default value
        }
      }
    }
  }
  databaseDifferences?: {
    postgresql: {
      [tableName: string]: {
        additionalColumns?: string[]
        description: string
      }
    }
    sqlite: {
      [tableName: string]: {
        additionalColumns?: string[]
        description: string
      }
    }
  }
}
```

## Migration History

### v0.0.1 (October 15, 2025)
- Initial schema definition
- Base schema with TEXT IDs
- Status as TEXT columns

### v0.0.2 (October 24, 2025)
- **Migration 019**: INTEGER IDs, status_id conversion
- **Migration 020**: i18n support with lang and status_display
- Updated all entity tables
- Added status table with translations

## Best Practices

1. **Always Regenerate After Migrations**: Run the generation script after completing any migration
2. **Version Incrementally**: Use semantic versioning for schema versions
3. **Validate Before Deploy**: Run schema validation before deploying to production
4. **Document Changes**: Update this file when creating new schema versions
5. **Keep History**: Don't delete old schema versions - they serve as documentation

## Related Files

- **Generator**: `server/database/generate-schema-definition.ts`
- **Validator**: `server/database/check-structure.ts`
- **Type Definitions**: `server/types/database.ts`, `src/types.ts`
- **Migrations**: `server/database/migrations/`

## Quick Reference: Key Changes in v0.0.2

### Integer IDs (Migration 019)
```json
// Before
"id": { "type": "TEXT" }

// After
"id": { "type": "INTEGER", "default": "nextval('..._id_seq'::regclass)" }
```

### Status ID (Migration 019)
```json
// Before
"status": { "type": "TEXT", "default": "'active'" }

// After
"status_id": { "type": "INTEGER", "nullable": false }
```

### i18n Support (Migration 020)
```json
// Added to 5 tables
"lang": { 
  "type": "TEXT", 
  "nullable": false, 
  "default": "'de'::text" 
}

// Added to 7 tables (computed column)
"status_display": { 
  "type": "TEXT", 
  "nullable": true 
}
```

### Projects Table (Migration 019)
```json
// Added separate domaincode field
"id": { "type": "INTEGER" },
"domaincode": { "type": "TEXT", "nullable": false }
```

## Support

For issues or questions about the schema registry:
1. Check migration files in `server/database/migrations/`
2. Review type definitions in `server/types/database.ts`
3. Validate schema with `check-structure.ts`
4. Regenerate with `generate-schema-definition.ts`

## Related Files

- **Schema Generator**: `server/database/generate-schema-definition.ts`
- **Schema Validator**: `server/database/check-structure.ts`
- **Type Generator**: `server/database/generate-types-from-schema.ts`
- **Type Generation Docs**: `docs/AUTOMATED_TYPE_GENERATION.md`
- **Generated Types**: `server/types/database.ts`
- **Migration 019**: `docs/core/MIGRATION_019_INTEGER_IDS.md`
- **Migration 020**: `docs/MIGRATION_020_I18N.md`
