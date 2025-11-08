# Plan B: turl/tpar Implementation - Quick Outline

**Date**: November 8, 2025  
**Priority**: Medium  
**Status**: ⚠️ OUTDATED - Superseded by Plan C

**Note**: This document contains inconsistent specifications. Refer to Plan C for correct turl/tpar implementation.

---

## 🎯 Quick Summary

Implement ultra-small thumbnail generation for instant preview loading:
- **turl**: 32×32px thumbnail URL
- **tpar**: JSON parameters for reconstruction

---

## 📋 Key Tasks (Stub List)

### 1. Add turl Generation Method
- Create `buildThumbnailUrl()` in adapters
- Generate 32×32px URL for both Unsplash and Cloudinary
- Store in `turl` field of shape composite

### 2. Add tpar Parameters Storage
- Extract focal point parameters (x, y, z)
- Store crop method (entropy/focalpoint)
- Store as JSON string in `tpar` field
- Format: `{"crop":"entropy","focal":null}` or `{"crop":"focalpoint","focal":{"x":0.5,"y":0.5,"z":1.5}}`

### 3. Integration with Existing System
- Update `transformMetadata()` in both adapters
- Generate turl alongside other shape URLs
- Store tpar with focal parameters
- Ensure BlurHash + turl work together

### 4. Update Database Schema (If Needed)
- Verify `turl` and `tpar` fields exist in `image_shape` type
- Add indexes if needed for performance

### 5. UI Integration
- Use turl for instant loading in image lists
- Show turl while BlurHash decodes
- Fallback to BlurHash if turl fails

---

## 🔬 Example URLs

### Unsplash turl
```
https://images.unsplash.com/photo-abc123?crop=entropy&fit=crop&w=32&h=32&ixid=...&ixlib=rb-4.1.0
```

### Cloudinary turl
```
https://res.cloudinary.com/demo/image/upload/c_crop,w_32,h_32/v1234567890/sample.jpg
```

---

## 📦 Example tpar Values

### Entropy crop (no focal point)
```json
{
  "crop": "entropy",
  "focal": null
}
```

### Focalpoint crop
```json
{
  "crop": "focalpoint",
  "focal": {
    "x": 0.5,
    "y": 0.5,
    "z": 1.5
  }
}
```

---

## ⏱️ Estimated Time

- Planning & design: 1 hour
- Implementation: 2-3 hours
- Testing: 1 hour
- Total: 4-5 hours

---

## 🔗 Dependencies

- ✅ Shape URL generation working
- ✅ Database schema with turl/tpar fields
- ✅ BlurHash system integrated
- ⏳ Cloudinary adapter complete (Plan A)

---

**Next Steps**: 
1. Complete Plan A (Cloudinary) first
2. Detailed planning of turl/tpar logic
3. Implementation and testing
