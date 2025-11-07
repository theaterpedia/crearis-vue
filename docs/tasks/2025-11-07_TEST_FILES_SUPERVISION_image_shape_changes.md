# Test Files Requiring Supervision - Image Shape Schema Changes

**Date**: November 7, 2025  
**Change**: Added `blur`, `turl`, `tpar` fields to `image_shape` composite type  
**Migration**: 019 (tweaked)

---

## 🎯 Test Status Summary

**Total Test Files**: 8  
**Updated**: 1  
**Needs Review**: 2  
**Not Affected**: 5

---

## ✅ Updated & Passing

### `tests/database/image-shape-reducer.test.ts` ✅
**Status**: Updated and passing (22/22 tests)  
**Changes Made**:
- Updated all PostgreSQL composite literals from 5 to 8 fields
- Fixed URL-based shapes: `(,,,url,)` → `(,,,url,,,,)`
- Fixed param-based shapes: `(100,200,300,,)` → `(100,200,300,,,,,)`
- Fixed JSON-based shapes: added 3 trailing NULLs

**Test Coverage**:
- URL-only shapes ✅
- x/y/z parameter shapes ✅
- JSON object shapes ✅
- NULL shapes with fallback ✅
- Entity propagation triggers ✅

**Run Command**:
```bash
pnpm test tests/database/image-shape-reducer.test.ts
```

---

## ⚠️ Needs Review

### `tests/integration/images-api.test.ts` ⚠️
**Status**: Needs review if writable shape fields are added  
**Current State**: Uses database types, may work without changes  
**Reason for Review**: API POST/PUT endpoints might need to accept shape data

**Action Items**:
- [ ] Review if `index.post.ts` should accept shape_* fields
- [ ] Review if `[id].put.ts` should accept shape_* fields
- [ ] Check if computed fields (img_*) are tested
- [ ] Verify trigger behavior is tested

**Test Scenarios to Verify**:
- Creating image with shape_square, shape_thumb, etc.
- Updating image and verifying img_* fields updated
- Checking that blur/turl/tpar appear in JSONB output

**Run Command**:
```bash
pnpm test tests/integration/images-api.test.ts
```

---

### `tests/integration/images-import-api.test.ts` ⚠️
**Status**: Needs review for batch import format  
**Current State**: Tests batch import endpoint  
**Reason for Review**: Import format might need shape field support

**Action Items**:
- [ ] Review import data format
- [ ] Check if shape_* fields can be imported
- [ ] Verify blur/turl/tpar handling in batch operations

**Run Command**:
```bash
pnpm test tests/integration/images-import-api.test.ts
```

---

## ✓ Not Affected (Low Priority)

### `tests/integration/postgres-tables.test.ts` ✓
**Status**: Not affected  
**Reason**: Tests table existence and basic structure, not specific field values

### `tests/integration/database-adapter.test.ts` ✓
**Status**: Not affected  
**Reason**: Tests generic CRUD operations, doesn't use images table

### `tests/integration/stage-d-compatibility.test.ts` ✓
**Status**: Not affected  
**Reason**: SQLite compatibility tests (SQLite deprecated since migration 019)

### `tests/integration/i18n-api.test.ts` ✓
**Status**: Not affected  
**Reason**: Tests i18n system, no relation to images

### `tests/unit/i18n-composable.test.ts` ✓
**Status**: Not affected  
**Reason**: Unit tests for i18n composable, no database interaction

---

## 🔍 Future Schema Changes: Test Patterns to Watch

### Pattern 1: PostgreSQL Composite Type Literals
**Location**: Any test inserting data into images table  
**Search Pattern**: `shape_square`, `shape_thumb`, `shape_wide`, `shape_vertical`  
**Fix Required**: Update field count in literals

**Example**:
```typescript
// OLD: 5-field composite
'(,,,https://example.com/img.jpg,)'

// NEW: 8-field composite  
'(,,,https://example.com/img.jpg,,,,)'
```

### Pattern 2: Entity Propagation Tests
**Location**: Tests verifying img_* fields on entity tables  
**Search Pattern**: `img_thumb`, `img_square`, `img_wide`, `img_vert`  
**Fix Required**: Update assertions if JSONB structure changes

**Example**:
```typescript
// Check that blur field appears in JSONB
expect(user.img_square).toHaveProperty('blur')
```

### Pattern 3: API Response Tests
**Location**: Integration tests for API endpoints  
**Search Pattern**: API test files checking response schemas  
**Fix Required**: Update response assertions

**Example**:
```typescript
// Verify new fields in response
expect(image.img_thumb.blur).toBeDefined()
```

---

## 📝 Testing Checklist for Future Composite Type Changes

When modifying `image_shape` or similar composite types:

1. **Database Layer**
   - [ ] Update migration with new type definition
   - [ ] Update triggers that use the composite type
   - [ ] Run `pnpm db:rebuild` locally
   - [ ] Verify no errors in migration output

2. **Type Generation**
   - [ ] Run `npx tsx server/database/generate-schema-definition.ts 0.0.2`
   - [ ] Run `npx tsx server/database/generate-types-from-schema.ts 0.0.2`
   - [ ] Verify `server/types/database.ts` updated

3. **Test Fixtures**
   - [ ] Search: `grep -r "shape_" tests/`
   - [ ] Update composite literals (add/remove fields)
   - [ ] Update assertions for new fields
   - [ ] Run affected tests individually

4. **Full Test Suite**
   - [ ] Run `pnpm test`
   - [ ] Check for unexpected failures
   - [ ] Review test output for schema mismatches
   - [ ] Fix any composite literal errors

5. **API Endpoints** (if writable fields added)
   - [ ] Review POST endpoints
   - [ ] Review PUT/PATCH endpoints
   - [ ] Update validation logic
   - [ ] Test manually via API

6. **Documentation**
   - [ ] Update schema documentation
   - [ ] Update API documentation
   - [ ] Mark task as complete
   - [ ] Update this supervision list

---

## 🚀 Quick Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/database/image-shape-reducer.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode (development)
pnpm test --watch

# Search for shape-related code in tests
grep -r "shape_" tests/

# Search for img_* field usage
grep -r "img_thumb\|img_square" tests/

# Check for composite type literals (PostgreSQL)
grep -r "(,,," tests/
```

---

## 📊 Test Results (Nov 7, 2025)

**After blur/turl/tpar changes:**

```
Test Files  1 passed (1)
     Tests  22 passed (22)
  Duration  2.57s

tests/database/image-shape-reducer.test.ts
  ✓ Scenario A: All shapes have URL only (4 tests)
  ✓ Scenario B: shape_thumb NULL, fallback to img_square (2 tests)
  ✓ Scenario C: x,y,z params instead of URL (2 tests)
  ✓ Scenario D: json object in shape (2 tests)
  ✓ Scenario E: shape_square completely NULL (2 tests)
  ✓ Scenario F: shape_wide/vert are NULL (3 tests)
  ✓ Scenario G: img_show based on ctags quality bits (3 tests)
  ✓ Scenario H: img_* propagation to entity tables (4 tests)
```

**Global test setup:**
- Migrations run once at startup ✅
- PostgreSQL test database created fresh ✅
- All migrations 000-020 applied ✅
- Migrations 021-024 skipped (manual-only) ✅

---

## 🔗 Related Documents

- `docs/mcp/updating_schema_and_endpoints.md` - Complete schema update workflow
- `docs/mcp/testing.md` - Testing automation guide
- `docs/tasks/2025-11-07_TWEAK_MIGRATION019_table_images_blur_turl_tpar.md` - Task completion log
- `docs/DATABASE_SCHEMA.md` - Database structure documentation
