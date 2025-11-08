# Plan G: Integration Tests for Image System

**Date**: November 8, 2025  
**Priority**: High (Updated - Required before E/F completion)  
**Status**: � Partial Implementation - Critical tests identified  
**Related Plans**: Plan C (Import/Export), Plan D (ImgShape), Plan E (ImageAdmin), Plan F (Hero)

---

## 🎯 CRITICAL UPDATE: Test-First Strategy

After completing Plan D (ImgShape), we need targeted testing BEFORE finishing Plans E and F.

### ⚡ DO IMMEDIATELY - Pre-Implementation Tests

These tests verify Plan D is solid and safe for E/F to use:

**1. ImgShape Core Functionality (30 min)**
```typescript
// tests/unit/imgshape-core.test.ts
describe('ImgShape Component', () => {
  describe('Dimension Validation', () => {
    it('should show error overlay when dimensions invalid')
    it('should show error overlay when dimensions missing')
    it('should display BlurHash placeholder in error state')
    it('should validate dimensions on mount and when props change')
  })
  
  describe('Avatar Shape Detection', () => {
    it('should detect square avatar from "project" in xmlid')
    it('should detect square avatar from "event" in xmlid')
    it('should detect round avatar from "user" in xmlid')
    it('should default to round avatar when no pattern match')
  })
  
  describe('Preview State Management', () => {
    it('should expose getPreviewData() function')
    it('should expose resetPreview() function')
    it('should expose updatePreview() function')
    it('should return correct state from getPreviewData()')
    it('should clear state when resetPreview() called')
  })
  
  describe('Click-to-Edit', () => {
    it('should emit activate event when editable and clicked')
    it('should NOT emit activate when not editable')
    it('should NOT emit activate when in error state')
    it('should pass shape/variant/adapter in activate event')
  })
})
```

**2. ShapeEditor Component (20 min)**
```typescript
// tests/unit/shape-editor.test.ts
describe('ShapeEditor Component', () => {
  describe('Mode Switching', () => {
    it('should render automation mode by default')
    it('should switch to XYZ mode when clicked')
    it('should switch to direct mode when clicked')
  })
  
  describe('XYZ Input', () => {
    it('should emit update event with x value')
    it('should emit update event with y value')
    it('should emit update event with z value')
    it('should accept values 0-100')
  })
  
  describe('Preview/Reset', () => {
    it('should emit preview event when preview button clicked')
    it('should emit reset event when reset button clicked')
  })
})
```

**3. ImageAdmin Integration (20 min)**
```typescript
// tests/integration/imageadmin-shapeeditor.test.ts
describe('ImageAdmin + ShapeEditor Integration', () => {
  describe('Activation Flow', () => {
    it('should show ShapeEditor when ImgShape clicked')
    it('should hide ShapeEditor when another shape clicked')
    it('should clear activeShape on record load')
    it('should clear activeShape after save')
  })
  
  describe('State Management', () => {
    it('should update XYZ values when ShapeEditor emits update')
    it('should trigger preview when ShapeEditor emits preview')
    it('should clear values when ShapeEditor emits reset')
  })
})
```

**Result**: ✅ If these pass, Plans E/F can safely use ImgShape/ShapeEditor

---

## 📋 DEFERRED - Full Integration Tests (After E/F)

### 1. Export API Tests (Already Working from Plan C)

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

**Status**: ⏳ Can wait - export already tested manually in Plan C

---

### 2. Import UI Tests (Already Working from Plan C)

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
