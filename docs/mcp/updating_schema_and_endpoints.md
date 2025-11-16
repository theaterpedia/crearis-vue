# Guide: Updating Schema and Endpoints (Entity Tables)

**Last Updated**: November 7, 2025  
**For**: Code automation agents and human developers

---

## Overview

This guide covers the workflow for schema changes that affect entity tables with propagated fields (especially `img_*` performance fields). Follow this process when modifying composite types or triggers that affect multiple tables.

---

## 🔄 Standard Workflow

### Phase 1: Database Schema Changes

1. **Modify Migration(s)**
   - Location: `server/database/migrations/019_add_tags_status_ids.ts` (or relevant migration)
   - Update composite type definitions (e.g., `image_shape`)
   - Update trigger functions that compute derived fields
   - Update propagation triggers if needed

2. **Test Migration Locally**
   ```bash
   pnpm db:rebuild
   ```
   - Verify no errors
   - Check that new fields appear in database

### Phase 2: Regenerate Schema Definition

3. **Generate Schema JSON**
   ```bash
   npx tsx server/database/generate-schema-definition.ts 0.0.2
   ```
   - Updates `server/database/schema-definitions/v0.0.2.json`
   - Captures current database structure with all new fields
   - Includes composite types marked as `USER-DEFINED`

4. **Regenerate TypeScript Types**
   ```bash
   npx tsx server/database/generate-types-from-schema.ts 0.0.2
   ```
   - Updates `server/types/database.ts`
   - Creates interface for each table with current columns
   - Adds type guard functions

### Phase 3: Review API Endpoints

5. **Identify Affected Endpoints**
   
   **For images table changes:**
   - `server/api/images/index.post.ts` - Create
   - `server/api/images/[id].put.ts` - Update
   - `server/api/images/[id].patch.ts` - Partial update
   - `server/api/images/[id].get.ts` - Read single
   - `server/api/images/index.get.ts` - List/filter
   - `server/api/images/import.post.ts` - Batch import

   **For entity tables with img_* fields:**
   - `server/api/users/[id].get.ts`
   - `server/api/users/[id].patch.ts`
   - `server/api/events/[id].get.ts`
   - `server/api/posts/[id].get.ts`
   - `server/api/projects/[id].get.ts`
   - `server/api/instructors/[id].get.ts`
   - `server/api/locations/[id].get.ts`

6. **Assess Endpoint Changes Needed**

   **Usually NO changes needed when:**
   - New fields are added to composite types (shape_square, etc.)
   - Triggers automatically populate JSONB fields (img_thumb, img_square, etc.)
   - Entity GET endpoints already return img_* fields
   - New fields will appear in JSONB automatically

   **Changes MAY be needed when:**
   - New top-level columns added to images table
   - POST/PUT endpoints need to accept new writable fields
   - Validation logic needs to handle new fields
   - Business logic depends on new field values

### Phase 4: Test Suite Updates

7. **Identify Tests Needing Updates**

   Search for tests that:
   - Insert data into modified tables
   - Use composite type literals (PostgreSQL specific)
   - Assert on computed field values
   - Test entity propagation

8. **Update Test Fixtures**

   **For composite type changes:**
   ```typescript
   // OLD (5 fields): (x, y, z, url, json)
   '(100,200,300,,)'
   
   // NEW (8 fields): (x, y, z, url, json, blur, turl, tpar)
   '(100,200,300,,,,,)'  // Added 3 NULL fields
   ```

   **For shape URLs:**
   ```typescript
   // OLD
   '(,,,https://example.com/image.jpg,)'
   
   // NEW
   '(,,,https://example.com/image.jpg,,,,)'
   ```

9. **Run Tests**
   ```bash
   # Single test file
   pnpm test tests/database/image-shape-reducer.test.ts
   
   # All tests
   pnpm test
   
   # With coverage
   pnpm test:coverage
   ```

### Phase 5: Documentation

10. **Update Documentation**
    - Mark task documents as complete
    - Note any API changes in changelog
    - Update type definitions documentation if needed

---

## 📋 Test Files Requiring Supervision (Entity Schema Changes)

### Critical - Always Check These

**Images & Shape System:**
- ✅ `tests/database/image-shape-reducer.test.ts`
  - Tests trigger that computes img_* fields from shape_* composites
  - Contains PostgreSQL composite literals
  - **Status**: Updated for blur/turl/tpar (Nov 7, 2025)

- ⚠️ `tests/integration/images-api.test.ts`
  - Tests CRUD operations on images table
  - May need fixture updates if schema changes
  - **Action Needed**: Review if new writable fields added

- ⚠️ `tests/integration/images-import-api.test.ts`
  - Tests batch import functionality
  - May need fixture updates
  - **Action Needed**: Review for import format changes

### Secondary - Check If Entity Fields Modified

**Entity Table Tests:**
- `tests/integration/postgres-tables.test.ts`
  - General table structure verification
  - May catch missing fields

- `tests/integration/database-adapter.test.ts`
  - Basic CRUD operations
  - Usually not affected by schema changes

- `tests/integration/stage-d-compatibility.test.ts`
  - SQLite compatibility tests
  - Usually not affected (SQLite deprecated)

**API-Specific Tests:**
- `tests/integration/i18n-api.test.ts`
  - Not affected by image schema changes

- `tests/unit/i18n-composable.test.ts`
  - Not affected by database schema

---

## 🎯 Quick Reference: When to Update What

| Change Type | Schema JSON | Types | Endpoints | Tests | Docs |
|-------------|-------------|-------|-----------|-------|------|
| **Add composite type fields** | ✅ Yes | ✅ Yes | ⚠️ Maybe | ✅ Yes | ✅ Yes |
| **Add table column** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Modify trigger logic** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Add computed field** | ✅ Yes | ✅ Yes | ❌ No | ⚠️ Maybe | ✅ Yes |
| **Change propagation** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |

---

## ⚡ Example: Adding blur/turl/tpar (Nov 7, 2025)

### What We Did

1. **Modified Migration 019**
   - Changed `image_shape` type from 5 fields to 8 fields
   - Updated `compute_image_shape_fields()` trigger
   - Added blur/turl/tpar to JSONB output when present

2. **Regenerated Schema**
   ```bash
   npx tsx server/database/generate-schema-definition.ts 0.0.2
   npx tsx server/database/generate-types-from-schema.ts 0.0.2
   ```

3. **API Endpoints**
   - ✅ No changes needed
   - Triggers automatically append new fields to img_* JSONB
   - GET endpoints return updated JSONB automatically

4. **Test Updates**
   - Updated `image-shape-reducer.test.ts`
   - Changed all composite literals from 5 to 8 fields
   - Fixed: `(,,,url,)` → `(,,,url,,,,)`
   - Fixed: `(100,200,300,,)` → `(100,200,300,,,,,)`
   - All 22 tests passing ✅

5. **Documentation**
   - Updated task document with completion status
   - Created this guide for future schema changes

---

## 🚨 Common Pitfalls

### 1. Forgetting Composite Type Trailing Fields
**Problem**: PostgreSQL composite literals must have exact field count  
**Error**: `malformed record literal: "(,,,url,)" - Too few columns`  
**Solution**: Add NULL fields for new columns: `(,,,url,,,,)`

### 2. Not Regenerating Types After Schema Change
**Problem**: TypeScript types don't match database  
**Solution**: Always run both generate commands after schema changes

### 3. Updating Endpoints When Not Needed
**Problem**: Over-engineering, adding unnecessary code  
**Solution**: Check if triggers handle propagation automatically

### 4. Missing Test Updates
**Problem**: Tests fail after schema changes  
**Solution**: Search codebase for affected test patterns before changing schema

---

## 📚 Related Documentation

- `docs/mcp/testing.md` - Testing guide for automation
- `docs/mcp/migrations_and_datahandling.md` - Migration control guide
- `docs/DATABASE_SCHEMA.md` - Database structure overview
- `docs/AUTOMATED_TYPE_GENERATION.md` - Type generation details

---

## ✅ Checklist for Schema Changes Affecting Entity Tables

- [ ] Modify migration(s) with new fields/triggers
- [ ] Test migration locally (`pnpm db:rebuild`)
- [ ] Regenerate schema JSON (v0.0.2)
- [ ] Regenerate TypeScript types
- [ ] Review affected API endpoints
- [ ] Update endpoint logic if needed (rare for computed fields)
- [ ] Search tests for affected patterns
- [ ] Update test fixtures and assertions
- [ ] Run test suite (`pnpm test`)
- [ ] Fix any test failures
- [ ] Update documentation
- [ ] Commit changes with descriptive message

---

**Pro Tip**: For composite type changes, use `sed` or search-replace to bulk-update test literals:
```bash
# Example: Add 3 trailing NULL fields
sed -i 's/\(https:\/\/[^,)]*\),)/\1,,,,)/g' tests/**/*.test.ts
```