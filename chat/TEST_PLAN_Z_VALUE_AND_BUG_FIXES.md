# Test Plan - Z-Value Shrink Strategy & Bug Fixes

**Date:** November 12, 2025  
**Focus:** Single Source of Truth for XYZ transformations + Today's bug fixes

---

## Core Principles to Test

### 1. **Single Source of Truth: ShapeEditor Calculates, ImgShape Displays**

**Principle:**
- ShapeEditor: Calculates XYZ → transformation URL
- ImgShape: Displays pre-computed URLs only (no recalculation)

**Test Cases:**

#### TC1.1: ShapeEditor rebuildShapeUrlWithXYZ Function
```typescript
describe('rebuildShapeUrlWithXYZ', () => {
  describe('Unsplash adapter', () => {
    it('should convert X/Y from 0-100 scale to 0.0-1.0 scale', () => {
      const url = 'https://images.unsplash.com/photo-123?w=1000'
      const result = rebuildShapeUrlWithXYZ(url, 50, 30, 100, 'wide', 0.084)
      
      expect(result).toContain('fp-x=0.50')  // 50 → 0.50
      expect(result).toContain('fp-y=0.30')  // 30 → 0.30
    })
    
    it('should apply shrink multiplier for Z-value', () => {
      // Z=100 (wide default) → multiplier=1.0 → fp-z=1.00
      const result1 = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
      expect(result1).toContain('fp-z=1.00')
      
      // Z=50 (square default) → multiplier=0.5 → fp-z=2.00 (show 2x more)
      const result2 = rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
      expect(result2).toContain('fp-z=2.00')
      
      // Z=25 (thumb default) → multiplier=0.25 → fp-z=4.00 (show 4x more)
      const result3 = rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
      expect(result3).toContain('fp-z=4.00')
      
      // Z=200 (zoom in 2x) → multiplier=2.0 → fp-z=0.50
      const result4 = rebuildShapeUrlWithXYZ(url, 50, 50, 200, 'wide', 0.084)
      expect(result4).toContain('fp-z=0.50')
    })
    
    it('should use shape parameter correctly', () => {
      // Same Z value, different shapes, same result (Z is relative)
      const wideUrl = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
      const squareUrl = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'square', 0.084)
      
      // Both should have fp-z=1.00 (Z=100 means "use this multiplier")
      expect(wideUrl).toContain('fp-z=1.00')
      expect(squareUrl).toContain('fp-z=1.00')
    })
  })
  
  describe('Cloudinary adapter', () => {
    it('should convert X/Y from 0-100 to pixel offsets from center', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
      const result = rebuildShapeUrlWithXYZ(url, 80, 30, 100, 'wide', 0.084)
      
      // x=80 → offset = (80-50) * 3.36 = +101px
      expect(result).toContain('x_101')
      // y=30 → offset = (30-50) * 1.68 = -34px
      expect(result).toContain('y_-34')
    })
    
    it('should apply shrink multiplier for Z-value', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
      
      // Z=100 → multiplier=1.0 → z=1.00
      const result1 = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
      expect(result1).toContain('z_1.00')
      
      // Z=50 → multiplier=0.5 → z=2.00
      const result2 = rebuildShapeUrlWithXYZ(url, 50, 50, 50, 'square', 0.084)
      expect(result2).toContain('z_2.00')
      
      // Z=25 → multiplier=0.25 → z=4.00
      const result3 = rebuildShapeUrlWithXYZ(url, 50, 50, 25, 'thumb', 0.084)
      expect(result3).toContain('z_4.00')
    })
    
    it('should switch from c_fill to c_crop when X/Y set', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/c_fill,g_auto,w_336,h_168/v123/image.jpg'
      const result = rebuildShapeUrlWithXYZ(url, 50, 50, 100, 'wide', 0.084)
      
      expect(result).toContain('c_crop')
      expect(result).toContain('g_xy_center')
      expect(result).not.toContain('c_fill')
    })
  })
  
  describe('xDefaultShrink calculation', () => {
    it('should use image.x when available', () => {
      // For image with x=4000, wide width=336
      const shrink = 336 / 4000  // 0.084
      expect(shrink).toBe(0.084)
    })
    
    it('should fallback to 3000 when image.x is NULL', () => {
      const shrink = 336 / 3000  // ≈0.112
      expect(shrink).toBeCloseTo(0.112, 3)
    })
  })
})
```

#### TC1.2: ImgShape Does NOT Recalculate XYZ
```typescript
describe('ImgShape display logic', () => {
  it('should display URL as-is without recalculating XYZ', () => {
    const preComputedUrl = 'https://images.unsplash.com/photo-123?fp-x=0.80&fp-y=0.30&fp-z=2.00'
    
    const wrapper = mount(ImgShape, {
      props: {
        shape: 'wide',
        data: {
          url: preComputedUrl,
          x: 80,  // These are stored but NOT used for recalculation
          y: 30,
          z: 50
        }
      }
    })
    
    // ImgShape should use the URL as-is
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe(preComputedUrl)
    
    // Should NOT rebuild URL from x/y/z props
    expect(img.attributes('src')).not.toContain('fp-x=0.80') // Would recalculate if using x/y/z
  })
  
  it('should emit pre-computed URL without modification', () => {
    const preComputedUrl = 'https://res.cloudinary.com/test/image/upload/c_crop,g_xy_center,x_101,y_-34,z_2.00,w_336,h_168/v123/image.jpg'
    
    const wrapper = mount(ImgShape, {
      props: {
        shape: 'wide',
        data: { url: preComputedUrl }
      }
    })
    
    // Should emit exactly what was passed in
    expect(wrapper.emitted('shapeUrl')?.[0][0]).toBe(preComputedUrl)
  })
})
```

---

## Bug Fixes to Test

### 2. **Bug Fix: Preview Updates URL**

**Test Case:**
```typescript
describe('handleShapePreview', () => {
  it('should update activeShapeData.url with computed XYZ URL', async () => {
    const { wrapper } = await setupImagesCoreAdmin()
    
    // Set XYZ values
    wrapper.vm.wideX = 80
    wrapper.vm.wideY = 30
    wrapper.vm.wideZ = 100
    
    const originalUrl = wrapper.vm.selectedImage.shape_wide.url
    
    // Click Preview
    await wrapper.vm.handleShapePreview()
    
    // URL should be updated with XYZ transformations
    expect(wrapper.vm.activeShapeData.url).not.toBe(originalUrl)
    expect(wrapper.vm.activeShapeData.url).toContain('fp-x=') // Unsplash
    // OR
    expect(wrapper.vm.activeShapeData.url).toContain('x_') // Cloudinary
  })
  
  it('should also update PreviewWide for wide shape', async () => {
    const { wrapper } = await setupImagesCoreAdmin()
    
    wrapper.vm.wideX = 80
    wrapper.vm.wideY = 30
    wrapper.vm.wideZ = 100
    
    await wrapper.vm.handleShapePreview()
    
    // PreviewWide should be updated for wide shape
    expect(wrapper.vm.PreviewWide).toBeTruthy()
    expect(wrapper.vm.PreviewWide).toContain('fp-x=')
  })
})
```

### 3. **Bug Fix: Save Button Enables When Dirty**

**Test Case:**
```typescript
describe('shapeIsDirty computed', () => {
  it('should return false when no changes made', () => {
    const { wrapper } = setupImagesCoreAdmin()
    
    // Enter shape mode
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    
    // No changes yet
    expect(wrapper.vm.shapeIsDirty).toBe(false)
  })
  
  it('should return true when X value changes', async () => {
    const { wrapper } = setupImagesCoreAdmin()
    
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    const originalX = wrapper.vm.wideX
    
    // Change X value
    wrapper.vm.wideX = originalX + 10
    await wrapper.vm.$nextTick()
    
    // Should detect change
    expect(wrapper.vm.shapeIsDirty).toBe(true)
  })
  
  it('should return true when URL changes', async () => {
    const { wrapper } = setupImagesCoreAdmin()
    
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    const originalUrl = wrapper.vm.activeShapeData.url
    
    // Change URL
    wrapper.vm.activeShapeData.url = originalUrl + '&test=1'
    await wrapper.vm.$nextTick()
    
    // Should detect change
    expect(wrapper.vm.shapeIsDirty).toBe(true)
  })
  
  it('should compare all 8 fields correctly', () => {
    // Test that x, y, z, url, tpar, turl, json, blur are all compared
    const { wrapper } = setupImagesCoreAdmin()
    
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    
    // Change each field and verify dirty detection
    const fields = ['x', 'y', 'z', 'url', 'tpar', 'turl', 'json', 'blur']
    
    fields.forEach(field => {
      // Reset to clean state
      wrapper.vm.cancelShapeEdits()
      expect(wrapper.vm.shapeIsDirty).toBe(false)
      
      // Change field
      if (field === 'x' || field === 'y' || field === 'z') {
        wrapper.vm[`wide${field.toUpperCase()}`] = 50
      } else {
        wrapper.vm.activeShapeData[field] = 'changed'
      }
      
      // Should be dirty
      expect(wrapper.vm.shapeIsDirty).toBe(true, `Failed for field: ${field}`)
    })
  })
  
  it('should trigger Save button to appear', async () => {
    const { wrapper } = setupImagesCoreAdmin()
    
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    
    // Initially no Save button
    expect(wrapper.find('.btn-save').exists()).toBe(false)
    
    // Make change
    wrapper.vm.wideX = 80
    await wrapper.vm.$nextTick()
    
    // Save button should appear
    expect(wrapper.find('.btn-save').exists()).toBe(true)
  })
})
```

### 4. **Bug Fix: No Jump During Typing (Direct Mode)**

**Test Case:**
```typescript
describe('ShapeEditor mode switching', () => {
  it('should not auto-switch mode while user is editing a field', async () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'wide',
        adapter: 'unsplash',
        data: {
          x: null,
          y: null,
          z: null,
          url: 'https://example.com/image.jpg',
          tpar: null,
          turl: null,
          json: null,
          blur: null
        }
      }
    })
    
    // Switch to direct mode
    wrapper.vm.switchMode('direct')
    expect(wrapper.vm.currentMode).toBe('direct')
    
    // Start editing URL field
    const urlInput = wrapper.find('.url-input')
    await urlInput.trigger('focus')
    expect(wrapper.vm.isEditingField).toBe(true)
    
    // Simulate typing (which might trigger data changes)
    await urlInput.setValue('https://example.com/image-updated.jpg')
    
    // Should NOT jump to XYZ mode
    expect(wrapper.vm.currentMode).toBe('direct')
    
    // Blur field
    await urlInput.trigger('blur')
    expect(wrapper.vm.isEditingField).toBe(false)
  })
  
  it('should not reset mode when URL changes (watch only shape)', async () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'wide',
        adapter: 'unsplash',
        data: {
          x: 50,
          y: 50,
          z: 100,
          url: 'https://example.com/image.jpg',
          tpar: null,
          turl: null,
          json: null,
          blur: null
        }
      }
    })
    
    // Currently in XYZ mode
    expect(wrapper.vm.currentMode).toBe('xyz')
    
    // User manually switches to direct mode
    wrapper.vm.switchMode('direct')
    expect(wrapper.vm.userManualSwitch).toBe(true)
    
    // URL changes (from parent component Preview action)
    await wrapper.setProps({
      data: {
        ...wrapper.props('data'),
        url: 'https://example.com/image-with-xyz.jpg?fp-x=0.50'
      }
    })
    
    // Should NOT reset mode (watch only watches shape, not URL)
    expect(wrapper.vm.currentMode).toBe('direct')
    expect(wrapper.vm.userManualSwitch).toBe(true)
  })
  
  it('should reset mode ONLY when shape changes', async () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'wide',
        adapter: 'unsplash',
        data: { x: null, y: null, z: null, url: 'test.jpg', tpar: null, turl: null, json: null, blur: null }
      }
    })
    
    // User manually switches
    wrapper.vm.switchMode('direct')
    expect(wrapper.vm.userManualSwitch).toBe(true)
    
    // Shape changes (user clicked different shape)
    await wrapper.setProps({ shape: 'square' })
    
    // Should reset manual switch flag
    expect(wrapper.vm.userManualSwitch).toBe(false)
    expect(wrapper.vm.isEditingField).toBe(false)
  })
})
```

### 5. **Bug Fix: Image Preview Loads After Blur**

**Test Case:**
```typescript
describe('ImgShape image loading', () => {
  it('should reset imageLoaded when displayUrl changes', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        shape: 'wide',
        data: {
          url: 'https://example.com/image1.jpg',
          blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
        }
      }
    })
    
    // Image loaded initially
    wrapper.vm.onImageLoad()
    expect(wrapper.vm.imageLoaded).toBe(true)
    
    // URL changes (Preview was clicked)
    await wrapper.setProps({
      data: {
        url: 'https://example.com/image1.jpg?fp-x=0.80&fp-y=0.30',
        blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
      }
    })
    
    // Should reset imageLoaded to false (show blur placeholder)
    expect(wrapper.vm.imageLoaded).toBe(false)
    
    // Should show placeholder
    expect(wrapper.vm.showPlaceholder).toBe(true)
  })
  
  it('should set imageLoaded=true on successful load', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        shape: 'wide',
        data: { url: 'https://example.com/image.jpg' }
      }
    })
    
    const img = wrapper.find('img')
    
    // Simulate image load event
    await img.trigger('load')
    
    // Should set imageLoaded to true
    expect(wrapper.vm.imageLoaded).toBe(true)
  })
  
  it('should set imageLoaded=true even on error (prevent hanging)', async () => {
    const wrapper = mount(ImgShape, {
      props: {
        shape: 'wide',
        data: { url: 'https://example.com/broken.jpg' }
      }
    })
    
    const img = wrapper.find('img')
    
    // Simulate image error event
    await img.trigger('error')
    
    // Should still set imageLoaded=true to prevent hanging on blur
    expect(wrapper.vm.imageLoaded).toBe(true)
  })
})
```

---

## Shape-Specific Z-Value Defaults

**Test Case:**
```typescript
describe('ShapeEditor Z-value defaults', () => {
  it('should show placeholder=100 for wide shape', () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'wide',
        adapter: 'unsplash',
        xDefaultShrink: 0.084,
        data: { x: null, y: null, z: null, url: 'test.jpg', tpar: null, turl: null, json: null, blur: null }
      }
    })
    
    expect(wrapper.vm.getDefaultZPlaceholder()).toBe('100')
    expect(wrapper.vm.getZFieldHint()).toContain('100=default for wide')
  })
  
  it('should show placeholder=50 for square shape', () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'square',
        adapter: 'unsplash',
        xDefaultShrink: 0.084,
        data: { x: null, y: null, z: null, url: 'test.jpg', tpar: null, turl: null, json: null, blur: null }
      }
    })
    
    expect(wrapper.vm.getDefaultZPlaceholder()).toBe('50')
    expect(wrapper.vm.getZFieldHint()).toContain('50=default for square')
  })
  
  it('should show placeholder=25 for thumb shape', () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'thumb',
        adapter: 'unsplash',
        xDefaultShrink: 0.084,
        data: { x: null, y: null, z: null, url: 'test.jpg', tpar: null, turl: null, json: null, blur: null }
      }
    })
    
    expect(wrapper.vm.getDefaultZPlaceholder()).toBe('25')
    expect(wrapper.vm.getZFieldHint()).toContain('25=default for thumb')
  })
  
  it('should have Z input range 10-500', () => {
    const wrapper = mount(ShapeEditor, {
      props: {
        shape: 'wide',
        adapter: 'unsplash',
        xDefaultShrink: 0.084,
        data: { x: null, y: null, z: null, url: 'test.jpg', tpar: null, turl: null, json: null, blur: null }
      }
    })
    
    // Switch to XYZ mode
    wrapper.vm.switchMode('xyz')
    
    const zInput = wrapper.find('.param-z')
    expect(zInput.attributes('min')).toBe('10')
    expect(zInput.attributes('max')).toBe('500')
  })
})
```

---

## Integration Test: End-to-End Flow

**Test Case:**
```typescript
describe('End-to-end XYZ transformation flow', () => {
  it('should flow from ShapeEditor → rebuildShapeUrlWithXYZ → ImgShape', async () => {
    // 1. Setup ImagesCoreAdmin with image
    const { wrapper } = await setupImagesCoreAdmin({
      image: {
        id: 1,
        url: 'https://images.unsplash.com/photo-123',
        x: 4000,  // Original width
        shape_wide: {
          url: 'https://images.unsplash.com/photo-123?w=336&h=168',
          x: null,
          y: null,
          z: null
        }
      }
    })
    
    // 2. Enter shape mode
    wrapper.vm.enterShapeMode('wide', 'unsplash')
    
    // 3. Verify xDefaultShrink calculated
    expect(wrapper.vm.xDefaultShrink).toBeCloseTo(0.084, 3) // 336/4000
    
    // 4. User sets XYZ values in ShapeEditor
    wrapper.vm.wideX = 80
    wrapper.vm.wideY = 30
    wrapper.vm.wideZ = 100
    
    // 5. User clicks Preview
    await wrapper.vm.handleShapePreview()
    
    // 6. Verify rebuildShapeUrlWithXYZ was called with correct params
    expect(wrapper.vm.activeShapeData.url).toContain('fp-x=0.80')
    expect(wrapper.vm.activeShapeData.url).toContain('fp-y=0.30')
    expect(wrapper.vm.activeShapeData.url).toContain('fp-z=1.00') // Z=100 → multiplier=1.0 → fp-z=1.0
    
    // 7. Verify ImgShape receives pre-computed URL
    const imgShape = wrapper.findComponent({ name: 'ImgShape' })
    expect(imgShape.props('data').url).toBe(wrapper.vm.activeShapeData.url)
    
    // 8. Verify ImgShape displays URL without recalculation
    const img = imgShape.find('img')
    expect(img.attributes('src')).toContain('fp-x=0.80')
    
    // 9. User clicks Save
    await wrapper.vm.saveShapeChanges()
    
    // 10. Verify URL persisted to database
    expect(wrapper.vm.selectedImage.shape_wide.url).toContain('fp-x=0.80')
    expect(wrapper.vm.selectedImage.shape_wide.x).toBe(80)
    expect(wrapper.vm.selectedImage.shape_wide.y).toBe(30)
    expect(wrapper.vm.selectedImage.shape_wide.z).toBe(100)
  })
  
  it('should apply shape-specific Z defaults correctly', async () => {
    const { wrapper } = await setupImagesCoreAdmin()
    
    // Test square shape with Z=50 (default)
    wrapper.vm.enterShapeMode('square', 'unsplash')
    wrapper.vm.squareX = 50
    wrapper.vm.squareY = 50
    wrapper.vm.squareZ = 50  // Square default
    
    await wrapper.vm.handleShapePreview()
    
    // Z=50 → multiplier=0.5 → fp-z=2.0 (show 2x more context)
    expect(wrapper.vm.activeShapeData.url).toContain('fp-z=2.00')
    
    // Test thumb shape with Z=25 (default)
    wrapper.vm.enterShapeMode('thumb', 'unsplash')
    wrapper.vm.thumbX = 50
    wrapper.vm.thumbY = 50
    wrapper.vm.thumbZ = 25  // Thumb default
    
    await wrapper.vm.handleShapePreview()
    
    // Z=25 → multiplier=0.25 → fp-z=4.0 (show 4x more context)
    expect(wrapper.vm.activeShapeData.url).toContain('fp-z=4.00')
  })
})
```

---

## Summary: Critical Test Points

### Unit Tests (ShapeEditor + rebuildShapeUrlWithXYZ)
1. ✅ Z-value conversion: 10-500 range → shrinkMultiplier → adapter-specific
2. ✅ X/Y conversion: 0-100 scale → adapter-specific (0.0-1.0 or pixel offsets)
3. ✅ Shape-specific Z defaults: wide=100, square/vertical=50, thumb=25
4. ✅ xDefaultShrink calculation: uses image.x, falls back to 3000
5. ✅ Mode switching: no jump during typing (isEditingField flag)
6. ✅ Watch behavior: only watches shape, not URL

### Unit Tests (ImgShape)
1. ✅ Display pre-computed URLs without recalculation
2. ✅ Reset imageLoaded when displayUrl changes
3. ✅ Handle load/error events properly
4. ✅ Emit URLs as-is

### Integration Tests (ImagesCoreAdmin)
1. ✅ End-to-end flow: ShapeEditor → rebuildShapeUrlWithXYZ → ImgShape → DB
2. ✅ Dirty detection: shapeIsDirty triggers Save button
3. ✅ Preview updates: activeShapeData.url updated correctly
4. ✅ Save persists: XYZ values + computed URL saved to database
5. ✅ Shape-specific behavior: Different Z defaults work correctly

### Regression Tests (Bug Fixes)
1. ✅ Preview updates URL (Issue #1)
2. ✅ Save button enables when dirty (Issue #2)
3. ✅ No jump during typing in Direct mode (Issue #3)
4. ✅ Image loads after blur placeholder (displayUrl watch fix)

---

## Next Steps

1. **Implement unit tests for `rebuildShapeUrlWithXYZ`** (highest priority)
   - This is the single source of truth for XYZ logic
   - Test all adapters, all shapes, all Z values

2. **Add ShapeEditor mode switching tests**
   - Verify isEditingField prevents jumps
   - Verify watch only reacts to shape changes

3. **Add ImgShape display tests**
   - Verify no recalculation of XYZ
   - Verify proper image loading behavior

4. **Create integration tests**
   - End-to-end flow from edit to save
   - Cross-component communication

5. **Add regression tests for today's bug fixes**
   - Ensure bugs don't reappear
   - Document expected behavior
