# Migration 037 Testing Status Update

## Current Test Results (November 27, 2025)

### Summary
- **Total Tests Created**: 205 tests across 7 files
- **Tests Passing**: 37 / 65 composable tests (57%)
- **Tests Failing**: 28 / 65 composable tests (43%)
- **Component Tests**: Not yet run (awaiting composable test completion)

### Test Files Status

#### ✅ Composable Tests - Partial Pass

1. **tests/unit/useTagFamily.spec.ts** (35 tests)
   - Status: Most tests passing
   - Failures: 2 tests
     - `getTagLabel` returns empty string (needs mock data fix)
     - `getTagsByGroup` returns empty array (needs mock data fix)

2. **tests/unit/useTagFamilyDisplay.spec.ts** (30 tests)
   - Status: Major failures
   - Failures: 26 tests
   - Root Cause: Mock data doesn't match Migration 037 structure
     - Mock dtags has 8 generic tags (education, media, advocacy...)
     - Migration 037 dtags needs 4 groups (spielform, animiertes_theaterspiel, dramaturgie, sujets)
     - Tests expect `spielform` group but mock only has flat tags

3. **tests/unit/useTagFamilyEditor.spec.ts** (40 tests)
   - Status: Not yet tested (pending mock data fix)
   - Expected Issues: Same as useTagFamilyDisplay

#### ⏸️ Component Tests - Not Run

4. **tests/component/TagFamilyTile.spec.ts** (25 tests)
   - Status: Not run - component may need implementation
   
5. **tests/component/TagFamilies.spec.ts** (20 tests)
   - Status: Not run - component may need implementation

6. **tests/component/TagFamilyEditor.spec.ts** (30 tests)
   - Status: Not run - component may need implementation

7. **tests/component/TagGroupEditor.spec.ts** (25 tests)
   - Status: 25 failures - component renders empty
   - Root Cause: Component exists but may need implementation or proper template

### Root Issues

#### 1. Mock Data Mismatch (CRITICAL)

**Problem**: Test mock data (`sysreg-mock-api.ts`) doesn't reflect Migration 037 changes.

**Current Mock dtags**:
```typescript
// Generic dtags - 8 flat tags
{ bit: 0, tagfamily: 'dtags', value: 'education', label: 'Education' },
{ bit: 1, tagfamily: 'dtags', value: 'media', label: 'Media' },
...
```

**Migration 037 dtags Structure Needed**:
```typescript
// Group 1: spielform (bits 0-7)
{ bit: 0, tagfamily: 'dtags', value: 'freies_spiel', label: 'Freies Spiel', bit_group: 'spielform', taglogic: 'category' },
{ bit: 1, tagfamily: 'dtags', value: 'improvisationstheater', label: 'Improvisationstheater', bit_group: 'spielform', taglogic: 'subcategory', parent_bit: 0 },
...

// Group 2: animiertes_theaterspiel (bits 8-15)
// Group 3: dramaturgie (bits 16-23)
// Group 4: sujets (bits 24-31)
```

**Impact**: All tests expecting Migration 037 structure will fail.

#### 2. Test Setup Issue (FIXED ✅)

**Problem**: `useI18n()` mock didn't return `language` ref.

**Solution**: Added `language: ref('de')` to mock in `test-setup.ts`.

**Status**: Fixed

#### 3. Component Implementation (UNKNOWN)

**Problem**: Component tests render empty wrappers.

**Possible Causes**:
- Components not fully implemented
- Components missing templates
- Props not being passed correctly
- Mock setup not initializing components

**Status**: Needs investigation

### Recommendations

#### Option A: Update Mock Data (Recommended for Production)
1. Update `tests/helpers/sysreg-mock-api.ts` with Migration 037 structure
2. Add all 32 dtags entries with proper bit_groups and taglogic
3. Include parent_bit for subcategories
4. Re-run all tests

**Effort**: 2-3 hours
**Benefit**: Tests will validate actual Migration 037 implementation

#### Option B: Simplify Tests (Quick Fix)
1. Remove Migration 037-specific expectations from tests
2. Test with generic mock data structure
3. Focus on logic rather than specific dtags structure

**Effort**: 1 hour
**Benefit**: Tests pass but don't validate Migration 037 specifics

#### Option C: Skip Detailed Testing (Not Recommended)
1. Mark component tests as skipped
2. Only test basic composable logic
3. Rely on manual testing for Migration 037

**Effort**: 30 minutes
**Benefit**: Quick progress but limited test coverage

### Next Steps

**Immediate** (Option A):
1. Create Migration 037 mock data structure
2. Update `mockSysregOptions` in `sysreg-mock-api.ts`
3. Re-run composable tests
4. Fix any remaining failures
5. Run component tests

**Alternative** (Option B):
1. Update test expectations to match current mock data
2. Skip Migration 037-specific structure tests
3. Mark those tests as TODO with comments

### Test Coverage Goals

After fixing mock data:
- **Target**: 80% coverage for Migration 037 files
- **Minimum**: 70% coverage (Vitest threshold)
- **Current**: Unknown (tests not completing)

### Files Requiring Updates

**High Priority**:
- `tests/helpers/sysreg-mock-api.ts` - Add Migration 037 dtags structure
- `tests/unit/useTagFamily.spec.ts` - 2 failing tests
- `tests/unit/useTagFamilyDisplay.spec.ts` - 26 failing tests

**Medium Priority**:
- `tests/unit/useTagFamilyEditor.spec.ts` - Not yet tested
- `tests/component/TagGroupEditor.spec.ts` - Component rendering issues

**Low Priority**:
- Other component tests (pending composable test completion)

## Conclusion

Phase 4 test implementation is complete but tests are failing due to mock data mismatch with Migration 037 structure. The solution is to update the mock data to match the 4-group dtags structure introduced in Migration 037. Once mock data is updated, tests should pass and validate the actual implementation.

**Recommended Action**: Update mock data (Option A) to ensure comprehensive test coverage of Migration 037 implementation.
