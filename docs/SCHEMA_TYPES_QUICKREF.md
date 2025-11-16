# Schema & Types Quick Reference

**Version:** v0.0.2  
**Last Updated:** October 24, 2025

## One-Command Workflow

```bash
# After migrations, regenerate everything:
pnpm db:update

# Or manually:
npx tsx server/database/generate-schema-definition.ts 0.0.2
npx tsx server/database/generate-types-from-schema.ts 0.0.2
```

## Files

| File | Purpose | Auto-Generated |
|------|---------|----------------|
| `server/database/schema-definitions/v0.0.2.json` | Schema registry (single source of truth) | ✅ Yes |
| `server/types/database.ts` | TypeScript type definitions | ✅ Yes |
| `server/database/generate-schema-definition.ts` | Schema JSON generator | ❌ No |
| `server/database/generate-types-from-schema.ts` | Type generator | ❌ No |

## Statistics (v0.0.2)

- **Tables:** 26
- **Total Columns:** 311
- **Generated Types:** 711 lines
- **Type Guards:** 26 functions
- **Coverage:** 100%

## Type Usage

```typescript
import { TasksTableFields, isValidTasksField } from '@/server/types/database'

// Type-safe INSERT
const newTask: Partial<TasksTableFields> = {
    name: 'Fix bug',
    status_id: 2,
    lang: 'de'
}

// Type guard
if (isValidTasksField('status_display')) {
    // TypeScript knows this is valid
}
```

## Key Features

### Migration 019
- ✅ INTEGER auto-increment IDs
- ✅ status_id (INTEGER FK)
- ✅ projects.domaincode field
- ✅ All FKs converted to INTEGER

### Migration 020
- ✅ `lang` field (5 tables)
- ✅ `status_display` computed column (7 tables)
- ✅ i18n translations (de, en, cz)

## Documentation

- 📘 **Schema Registry:** `docs/SCHEMA_REGISTRY.md`
- 📘 **Type Generation:** `docs/AUTOMATED_TYPE_GENERATION.md`
- 📘 **Complete Workflow:** `docs/SCHEMA_TO_TYPES_WORKFLOW.md`

## Validation

```bash
# Validate schema matches database
npx tsx server/database/check-structure.ts 0.0.2

# Validate types compile
pnpm build
```

## Benefits

✅ Single source of truth (schema JSON)  
✅ Auto-generated types (no manual updates)  
✅ Type safety (compile-time checking)  
✅ AI-friendly (quick schema lookup)  
✅ Complete coverage (all 26 tables)  

## Never Edit Manually

❌ `server/types/database.ts` - Auto-generated  
❌ `server/database/schema-definitions/v0.0.2.json` - Auto-generated

✅ Always regenerate using scripts above
