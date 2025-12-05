# TODO: Shape Modes Specification

**Created:** 2025-11-08  
**Priority:** Next Iteration  
**Status:** Needs Design Decision

## Problem Statement

The shape editing system needs clearer specification of the 'direct' mode and its relationship to other modes (Auto, XYZ).

## Current Behavior

- **Auto Mode:** X, Y, Z are NULL. Uses adapter's default cropping (Unsplash crop=entropy, Cloudinary auto-focal).
- **XYZ Mode:** X, Y, Z are NOT NULL. User-specified focal point positioning.
- **Direct Mode:** Currently unclear specification and usage.

## Questions to Resolve

### 1. Should 'direct' mode be explicitly declared on shape.json?

Currently, mode detection is implicit:
- If X !== NULL → XYZ mode
- If X === NULL → Auto mode

Should we add an explicit `mode` field to the shape JSON?

```typescript
interface ImageShape {
    url: string
    x?: number | null
    y?: number | null
    z?: number | null
    mode?: 'auto' | 'xyz' | 'direct'  // Explicit mode declaration?
}
```

### 2. Is 'direct' allowed in conjunction with XYZ or Auto?

- Can direct mode coexist with XYZ positioning?
- Can direct mode coexist with Auto cropping?
- Or is direct mode mutually exclusive?

### 3. Should 'direct' be renamed to 'edit hero transformation'?

The term 'direct' is ambiguous. Consider:
- "Hero Transform Mode"
- "Manual URL Mode"
- "Custom Transform Mode"
- "Override Mode"

## Implementation Considerations

### Option A: Implicit Mode Detection (Current)
```typescript
const mode = shape.x !== null ? 'xyz' : 'auto'
```

**Pros:**
- Simple, no schema changes
- Works for current use cases

**Cons:**
- No way to represent 'direct' mode explicitly
- Mode is inferred rather than declared

### Option B: Explicit Mode Field
```typescript
interface ImageShape {
    url: string
    x?: number | null
    y?: number | null
    z?: number | null
    mode: 'auto' | 'xyz' | 'direct'
}
```

**Pros:**
- Clear mode declaration
- Can support 'direct' mode properly
- Future-proof for additional modes

**Cons:**
- Requires schema migration
- Need to backfill existing records

### Option C: Mode Flags
```typescript
interface ImageShape {
    url: string
    x?: number | null
    y?: number | null
    z?: number | null
    useDirectUrl?: boolean  // If true, ignore x/y/z and use url as-is
}
```

**Pros:**
- Backward compatible
- Can be added incrementally

**Cons:**
- Multiple fields to track
- Potential for inconsistent states

## Recommended Next Steps

1. **Define 'direct' mode behavior:**
   - What does it do differently from Auto/XYZ?
   - When should users choose it?
   - What are the constraints?

2. **Choose implementation approach:**
   - Decide between Options A, B, or C
   - Consider migration path

3. **Update Shape Editor UI:**
   - Clear mode indicators
   - Prevent invalid mode combinations
   - Add tooltips explaining each mode

4. **Document mode transitions:**
   - Auto → XYZ: Set X, Y, Z values
   - XYZ → Auto: Clear X, Y, Z to NULL
   - Direct → ?: How to enter/exit?

5. **Add validation:**
   - Ensure mode consistency in API
   - Validate mode changes
   - Add database constraints if needed

## Related Files

- `/server/types/adapters.ts` - ImageShape interface
- `/server/adapters/unsplash-adapter.ts` - Shape creation on import
- `/src/components/images/ShapeEditor.vue` - Mode switching UI
- `/src/views/admin/ImagesCoreAdmin.vue` - Shape editing workflow

## Notes

- Currently on import, X/Y/Z are set to NULL (Auto mode)
- Shape editor detects XYZ mode by checking if X !== NULL
- Need clear specification before implementing 'direct' mode
