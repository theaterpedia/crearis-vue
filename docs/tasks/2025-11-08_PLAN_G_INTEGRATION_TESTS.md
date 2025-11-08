# Plan G: Integration Tests for Image System

**Date**: November 8, 2025  
**Priority**: Medium  
**Status**: 📋 Ready to Implement  
**Related Plans**: Plan C (Import/Export), Plan D (ImgShape), Plan E (ImageAdmin)

---

## 🎯 Overview

Create comprehensive integration tests for the image system's import/export functionality, turl/tpar system, and UI components.

---

## 📋 Test Categories

### 1. Export API Tests

**File**: `tests/integration/images-export-api.test.ts`

```typescript
describe('POST /api/images/export', () => {
  it('should export all images to JSON file')
  it('should include all database fields')
  it('should generate timestamped filename')
  it('should create /data/images directory if missing')
  it('should return success with file path and count')
  it('should handle empty database gracefully')
})
```

**Test Data**:
- Sample images with all shape variants
- Images with turl/tpar fields populated
- Images with null/missing fields

**Verification**:
- File created in correct location
- JSON format valid
- All fields preserved
- Timestamp format correct

---

### 2. Import UI Tests

**File**: `tests/integration/images-import-ui.test.ts`

```typescript
describe('cimgImport.vue Component', () => {
  describe('Multiple URL Input', () => {
    it('should parse comma-separated URLs')
    it('should parse newline-separated URLs')
    it('should parse space-separated URLs')
    it('should filter invalid URLs')
    it('should skip duplicate URLs')
    it('should show feedback for added/invalid/duplicate counts')
  })

  describe('Owner Dropdown', () => {
    it('should load owners from /api/users')
    it('should display with proper theme colors')
    it('should show loading state')
    it('should handle API errors gracefully')
  })

  describe('Form Validation', () => {
    it('should require at least one URL')
    it('should require owner selection')
    it('should enable save button when valid')
  })
})
```

**Testing Tools**:
- Vitest + Vue Test Utils
- Mock fetch API
- Test theme CSS variables

---

### 3. turl/tpar System Tests

**File**: `tests/integration/turl-tpar-system.test.ts`

```typescript
describe('turl/tpar System', () => {
  describe('Unsplash Adapter', () => {
    it('should extract transformation parameters to turl')
    it('should build tpar template with {turl} placeholder')
    it('should calculate mobile dimensions (416px base)')
    it('should reconstruct original URL from tpar + turl')
    
    // Example:
    // Original: https://images.unsplash.com/photo-123?w=336&h=168&fit=crop&ixid=abc
    // turl: "w=336&h=168&fit=crop&ixid=abc"
    // tpar: "https://images.unsplash.com/photo-123?{turl}"
  })

  describe('Cloudinary Adapter', () => {
    it('should extract transformation parameters to turl')
    it('should build tpar template with {turl} placeholder')
    it('should calculate mobile dimensions (416px base)')
    it('should reconstruct original URL from tpar + turl')
    
    // Example:
    // Original: https://res.cloudinary.com/demo/image/upload/c_crop,w_336,h_168/v123/photo.jpg
    // turl: "c_crop,w_336,h_168"
    // tpar: "https://res.cloudinary.com/demo/image/upload/{turl}/v123/photo.jpg"
  })

  describe('Mobile Dimension Calculations', () => {
    it('should scale wide shape: 336×168 → 416×208')
    it('should scale vertical shape: 126×224 → 416×739')
    it('should preserve aspect ratio')
    it('should handle already-small images')
  })

  describe('useTheme Integration', () => {
    it('should use MOBILE_WIDTH_PX constant (416)')
    it('should use MOBILE_WIDTH_REM constant (26)')
    it('should use calculateMobileDimensions() helper')
  })
})
```

**Test Data**:
- Real Unsplash URLs with various transformations
- Real Cloudinary URLs with various transformations
- Edge cases: very tall, very wide, already mobile-sized

**Verification**:
- Original URL perfectly reconstructed
- Aspect ratio preserved in calculations
- Mobile dimensions match expected values

---

### 4. Import Modal Placement Tests

**File**: `tests/integration/import-modal-placement.test.ts`

```typescript
describe('Import Modal Placement', () => {
  it('should render at bottom of screen')
  it('should have correct z-index')
  it('should slide up on open')
  it('should slide down on close')
  it('should not overlap with page content')
  it('should be responsive on mobile')
})
```

**Visual Regression**:
- Screenshot tests at different screen sizes
- Verify positioning in ImagesCoreAdmin view

---

## 🔧 Test Setup

### Dependencies
```json
{
  "@vue/test-utils": "^2.4.0",
  "vitest": "^1.0.0",
  "happy-dom": "^12.0.0"
}
```

### Mock Data Location
- `tests/fixtures/images-sample.json` - Sample image records
- `tests/fixtures/users-sample.json` - Sample users for dropdown
- `tests/fixtures/projects-sample.json` - Sample projects

### Test Utilities
- `tests/utils/createWrapper.ts` - Vue component wrapper helper
- `tests/utils/mockFetch.ts` - Fetch API mock helper
- `tests/utils/themeSetup.ts` - CSS variables setup for tests

---

## 📊 Coverage Goals

- **API Endpoints**: 90%+ coverage
- **UI Components**: 80%+ coverage
- **turl/tpar Logic**: 100% coverage (critical path)
- **Integration Flows**: All happy paths + error cases

---

## 🎯 Success Criteria

- ✅ All export tests pass
- ✅ All import UI tests pass
- ✅ All turl/tpar tests pass
- ✅ Modal placement verified
- ✅ No console errors in test output
- ✅ Tests run in < 5 seconds
- ✅ Coverage reports generated

---

## 📝 Implementation Order

1. **Phase 1**: Export API tests (fastest to implement)
2. **Phase 2**: turl/tpar calculation tests (critical logic)
3. **Phase 3**: Import UI tests (requires component setup)
4. **Phase 4**: Modal placement tests (visual verification)

**Estimated Time**: 4-6 hours total

---

**Status**: 📋 Specification Complete  
**Next Action**: Create test files and fixtures  
**Blocked By**: None (can start immediately)
