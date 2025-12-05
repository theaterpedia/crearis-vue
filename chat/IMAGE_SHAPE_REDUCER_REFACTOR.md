# Image Shape Reducer Refactor

## Summary

Refactored the image shape computation logic from entity-level cross-table triggers to a simpler, more reliable row-level trigger on the images table itself.

## Changes Made

### 1. Test Data Extracted
- Created `tests/database/image-shape-reducer.test.ts` with comprehensive test scenarios
- Extracted test data from images.id = 5 for validation
- Covers 7 scenarios: URL-only, fallback, params, json, NULL handling, and img_show calculation

### 2. Migration 019 Refactored

**Removed:**
- ❌ img_show, img_thumb, img_square, img_wide, img_vert fields from entity tables (users, instructors, events, locations, posts, projects)
- ❌ Cross-table trigger `update_entity_image_fields()` that required JOINs
- ❌ Cascade trigger `update_referencing_entities_on_image_change()`

**Added:**
- ✅ 5 new fields on `images` table:
  - `img_show` (BOOLEAN) - computed from ctags quality bits
  - `img_thumb` (JSONB) - computed from shape_thumb with fallback to img_square
  - `img_square` (JSONB) - computed from shape_square (also used as fallback)
  - `img_wide` (JSONB) - computed from shape_wide
  - `img_vert` (JSONB) - computed from shape_vertical

- ✅ Row-level trigger `compute_image_shape_fields()` on images table
  - Runs BEFORE INSERT OR UPDATE
  - No cross-table operations needed
  - All computation happens within the same row

### 3. Computation Logic

Each shape field follows this priority:

**For img_square (Loop 1 - creates fallback):**
1. If `shape.json` IS NOT NULL → use json directly
2. Else if `shape.x/y/z` IS NOT NULL → create `{"type": "params", "x": ..., "y": ..., "z": ...}`
3. Else if `shape.url` IS NOT NULL → create `{"url": "..."}`
4. Else → create `{"error": true}`

**For img_thumb (Loop 2 - can use fallback):**
1. If `shape.json` IS NOT NULL → use json directly
2. Else if `shape.x/y/z` IS NOT NULL → create `{"type": "params", ...}`
3. Else if `shape.url` IS NOT NULL → create `{"url": "..."}`
4. Else → **use img_square value** (fallback)

**For img_wide and img_vert (Loops 3 & 4 - no fallback):**
1. If `shape.json` IS NOT NULL → use json directly
2. Else if `shape.x/y/z` IS NOT NULL → create `{"type": "params", ...}`
3. Else if `shape.url` IS NOT NULL → create `{"url": "..."}`
4. Else → create `{"enabled": false}`

**For img_show:**
- Computed from ctags byte: `(get_byte(ctags, 0) & 192) IN (0, 64)`
- Returns true if quality bits (6+7) = 0 (ok) or 64 (is_deprecated)
- Returns false otherwise

## Benefits

1. **Simpler Logic:** No cross-table JOINs needed
2. **Better Performance:** Row-level trigger only affects the images table
3. **Easier Testing:** Can test in isolation on images table
4. **Reliable NULL Handling:** Directly checks composite type fields instead of relying on composite IS NULL
5. **JSONB Flexibility:** Can store URLs, params, or custom json objects

## PostgreSQL Composite Type Gotcha

**Problem:** When a composite type has only some fields set (e.g., `(,,,url,)`), checking `composite IS NOT NULL` returns neither true nor false - it's indeterminate.

**Solution:** Always check specific fields: `(composite).url IS NOT NULL`

## Test Strategy

Run tests in order:
1. Drop and rebuild database
2. Run migrations
3. Execute vitest: `pnpm test tests/database/image-shape-reducer.test.ts`
4. Verify all 7 scenarios pass

## Next Steps

1. ✅ Saved to GitHub, created new branch
2. ✅ Removed entity table fields and triggers from migration 019
3. ✅ Added JSONB fields to images table
4. ✅ Created row-level trigger on images table
5. ⏳ Drop and rebuild database
6. ⏳ Run migrations to verify integrity
7. ⏳ Run vitest to verify all scenarios work
8. ⏳ If tests pass, continue with integration

## Files Modified

- `server/database/migrations/019_add_tags_status_ids.ts` - Refactored Chapter 14
- `tests/database/image-shape-reducer.test.ts` - New test file
- `test-computed-image-fields.sh` - Bash test script (kept for reference)
- `fix-image-trigger.sql` - SQL patch file (no longer needed after refactor)
