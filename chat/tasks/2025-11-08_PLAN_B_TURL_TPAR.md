# Plan B: turl/tpar Implementation (Brief Outline)

**Date**: November 8, 2025  
**Priority**: Medium  
**Status**: ⚠️ OUTDATED - Superseded by Plan C

**Note**: This document contains inconsistent specifications. Refer to Plan C for correct turl/tpar implementation.

---

## 🎯 Quick Overview

Implement ultra-small thumbnail generation for instant preview loading.

---

## 📝 Core Concepts

### turl (Thumbnail URL)
- **Size**: 32×32px ultra-small preview
- **Purpose**: Fast initial load before full image
- **Usage**: Combined with BlurHash for optimal UX
- **Generation**: During import, create 32×32 version
- **Storage**: Store in `image_shape.turl` field (already in schema)

### tpar (Thumbnail Parameters)
- **Format**: JSON string with reconstruction data
- **Purpose**: Store metadata to rebuild full URL if needed
- **Storage**: Store in `image_shape.tpar` field (already in schema)
- **Content**: Crop method, focal points, filters, etc.

---

## 🚀 Quick Task List

### 1. turl Generation
- [ ] Add 32×32px URL generation to Unsplash adapter
- [ ] Add 32×32px URL generation to Cloudinary adapter
- [ ] Store in shape composite field during import
- [ ] Test loading performance vs BlurHash

### 2. tpar Structure
- [ ] Define JSON schema for tpar
- [ ] Store focal point params (x, y, z)
- [ ] Store crop method (entropy, focalpoint)
- [ ] Store any custom transformations

### 3. UI Integration
- [ ] Update ImgShape to use turl for initial load
- [ ] Cascade: turl → BlurHash → full image
- [ ] Add loading states
- [ ] Test performance improvements

### 4. Testing
- [ ] Verify turl generation for all shapes
- [ ] Test tpar JSON parsing
- [ ] Benchmark loading times
- [ ] Compare with BlurHash-only approach

---

## 📊 Example Output

### Unsplash turl
```
https://images.unsplash.com/photo-abc123?w=32&h=32&fit=crop&ixid=...&ixlib=...
```

### Cloudinary turl
```
https://res.cloudinary.com/account/image/upload/c_crop,w_32,h_32/v123/image.jpg
```

### tpar JSON
```json
{
  "crop": "focalpoint",
  "focal": { "x": 0.5, "y": 0.3, "z": 1.5 },
  "filters": null
}
```

---

## 🔗 Dependencies

- Complete Plan A (Cloudinary) first
- Existing BlurHash system working
- `image_shape` composite type already has turl/tpar fields

---

## 📅 Timeline

**Estimate**: 2-3 hours  
**Priority**: After Cloudinary completion  
**Detailed planning**: When Plan A is done

---

*This is a brief outline. Full implementation plan will be created after Plan A completion.*
