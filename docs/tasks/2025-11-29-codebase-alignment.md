# Codebase Alignment Actions - Post Migration Cleanup

**Date:** 2025-11-29  
**Priority:** MEDIUM  
**Estimated Effort:** 2-3 hours

---

## Overview

This document outlines actions to align the codebase after the BYTEA→INTEGER migration series (036-043). It covers deprecated file removal, type definition updates, and code comment cleanup.

---

## Section 1: Deprecated Files to Remove

### 1.1 Status Mapping Files (Replaced by Sysreg System)

```bash
# Files to delete:
rm src/composables/status-mapping.ts       # If exists - replaced by useSysregOptions
rm src/utils/status-mapping.ts             # If exists - replaced by useSysregOptions
```

### 1.2 Backup Files from Migrations

```bash
# Root directory backup files
rm archived_actions/demo-data.db.backup_before_drop_20251015_164823
rm archived_actions/demo-data.db.test_backup

# Any *.backup, *.bak, *.old files in server/database/migrations/
find server/database/migrations -name "*.backup" -o -name "*.bak" -o -name "*.old" | xargs rm -f
```

### 1.3 Test Output Files

```bash
# Temporary test outputs
rm test-output.json
rm -rf test-results/  # If contains only stale data
```

### 1.4 Migration Status JSON Files

```bash
# One-time migration tracking files (safe to archive or delete)
rm migration-041-images-status.json
rm migration-041-projects-status.json
rm migration-041-users-status.json
```

---

## Section 2: Type Definition Updates

### 2.1 Update server/database/database.ts

**Location:** `server/database/database.ts` (type definitions)

```typescript
// BEFORE: BYTEA types
ctags: Buffer | null
rtags: Buffer | null
status: Buffer | null
ttags: Buffer | null
dtags: Buffer | null

// AFTER: INTEGER types
ctags: number | null
rtags: number | null
status: number | null
ttags: number | null
dtags: number | null
```

### 2.2 Update Drizzle Schema Types

**Location:** `server/database/schema/*.ts`

Check for any remaining `binary()` or `bytea()` column definitions:

```typescript
// BEFORE
ctags: binary('ctags')

// AFTER
ctags: integer('ctags')
```

### 2.3 Update API Response Types

**Location:** `types/*.ts` or `src/types/*.ts`

```typescript
// Any interface defining entity response types
interface EntityResponse {
    ctags: number | null  // was Buffer | string
    rtags: number | null  // was Buffer | string
    // ...
}
```

---

## Section 3: Code Comment Cleanup

### 3.1 Remove BYTEA References in Comments

Search for and update comments mentioning BYTEA:

```bash
# Find all BYTEA references
grep -rn "BYTEA" --include="*.ts" --include="*.vue" --include="*.sql" .
```

Update comments like:
```typescript
// BEFORE
// ctags is stored as BYTEA in PostgreSQL

// AFTER  
// ctags is stored as INTEGER (32-bit bitmask) in PostgreSQL
```

### 3.2 Update Function Documentation

**Location:** `server/api/images/upload.post.ts`

```typescript
// BEFORE
/**
 * Parse tag buffer from multipart form data
 * @returns Buffer for PostgreSQL BYTEA column
 */

// AFTER
/**
 * Parse tag value from multipart form data
 * @returns Integer for PostgreSQL INTEGER column (bit flags)
 */
```

---

## Section 4: Deprecated Code Patterns

### 4.1 Remove Buffer.from() for Tags

Search and replace any remaining Buffer.from() patterns:

```bash
grep -rn "Buffer.from.*tags" --include="*.ts" .
```

Replace with direct integer assignment:
```typescript
// BEFORE
const ctags = Buffer.from(value)

// AFTER
const ctags = parseInt(value, 10) || 0
```

### 4.2 Remove Hex String Parsing

Search for hex string parsing that's no longer needed:

```bash
grep -rn "\\\\x" --include="*.ts" --include="*.vue" .
```

### 4.3 Update parseTagBuffer Functions

If any remain, rename and update:

```typescript
// BEFORE
function parseTagBuffer(value: string): Buffer

// AFTER
function parseTagValue(value: string): number
```

---

## Section 5: useSysregStatus Cleanup

### 5.1 Review useSysregStatus.ts

**Location:** `src/composables/useSysregStatus.ts`

Check for:
- References to BYTEA or Buffer types
- Hex string value comparisons
- Old status mapping logic

```typescript
// Ensure value comparisons use integers
const isApproved = (status: number) => (status & 2) !== 0  // bit 1

// NOT this (old BYTEA style)
const isApproved = (status: string) => status === '\\x02'
```

### 5.2 Update Status Constants

```typescript
// BEFORE
export const STATUS_APPROVED = '\\x02'
export const STATUS_PUBLISHED = '\\x04'

// AFTER
export const STATUS_APPROVED = 2   // bit 1
export const STATUS_PUBLISHED = 4  // bit 2
```

---

## Section 6: Database Seed Data

### 6.1 Update Sysreg Seed Values

**Location:** `server/database/seed.ts` or similar

```typescript
// Ensure seed values are integers, not hex strings
const sysregEntries = [
    { name: 'approved', value: 2, tagfamily: 'status', bit: 1 },
    { name: 'published', value: 4, tagfamily: 'status', bit: 2 },
    // ...
]
```

### 6.2 Fix taglogic Deprecation

Replace 'option' with 'toggle' in seed data:

```typescript
// BEFORE
{ taglogic: 'option', exclusive: false, ... }

// AFTER
{ taglogic: 'toggle', exclusive: false, ... }
```

---

## Section 7: Documentation Updates

### 7.1 Update API Documentation

**Files to update:**
- `docs/api/*.md`
- `README.md` (if contains schema docs)

Update field type descriptions:
```markdown
## Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| ctags | INTEGER | Context tags (32-bit bitmask) |
| rtags | INTEGER | Reference tags (32-bit bitmask) |
| status | INTEGER | Status flags (32-bit bitmask) |
```

### 7.2 Update Migration Documentation

Add reference to Migration 036 in architecture docs explaining:
- Why BYTEA was replaced with INTEGER
- How bit flags work (bit 0 = value 1, bit 1 = value 2, etc.)
- Maximum of 32 options per tag family

---

## Execution Checklist

- [ ] Delete deprecated files (Section 1)
- [ ] Update type definitions (Section 2)
- [ ] Clean up code comments (Section 3)
- [ ] Remove deprecated patterns (Section 4)
- [ ] Review useSysregStatus (Section 5)
- [ ] Update seed data (Section 6)
- [ ] Update documentation (Section 7)

---

## Verification

After completing all sections:

```bash
# Build to check for type errors
pnpm build

# Run tests
pnpm test

# Search for any remaining BYTEA references
grep -rn "BYTEA\|Buffer.from.*tag\|\\\\\\\\x0" --include="*.ts" --include="*.vue" .
```

---

## Notes

- Some BYTEA references in migration files are historical and should NOT be changed
- The archived_actions/ directory contains historical files - review before deleting
- Consider creating a MIGRATION_SUMMARY.md documenting the full 036-043 migration series

