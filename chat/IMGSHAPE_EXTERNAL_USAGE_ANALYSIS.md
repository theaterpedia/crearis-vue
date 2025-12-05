# ImgShape External Usage Analysis

## Executive Summary

**Current State**: ImgShape uses display-oriented shape names (`'card' | 'tile' | 'avatar'`) that create confusion between presentation layer (how the image looks) and data layer (what the image represents).

**Recommendation**: Change ImgShape to emit core shape names (`'square' | 'wide' | 'thumb' | 'vertical'`) to align with the underlying data structure and simplify the component API.

**Impact**: Minimal - Only ImagesCoreAdmin currently consumes the `@activate` event. All other external components use ImgShape purely for display and never listen to its events.

---

## Current ImgShape Props Interface

```typescript
interface Props {
    data: ImgShapeData
    shape: 'card' | 'tile' | 'avatar'        // Display-oriented names
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    adapter?: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
    forceBlur?: boolean
    editable?: boolean
    active?: boolean
}
```

**Events Emitted**:
- `shapeUrl`: Emits the computed shape URL (consumed by ImagesCoreAdmin only)
- `activate`: Emits `{ shape, variant, adapter }` when clicked in editable mode (consumed by ImagesCoreAdmin only)

---

## External Components Using ImgShape

### 1. **ItemCard.vue** (Display Only)
**Location**: `src/components/clist/ItemCard.vue`

**Usage**:
```vue
<ImgShape v-if="dataMode && data" 
    :data="data" 
    :shape="shape || 'card'" 
    :variant="variant || 'default'"
    class="card-background-image" />
```

**Props Interface**:
```typescript
interface Props {
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}
```

**Event Listeners**: None ✅

**Analysis**: 
- ItemCard defaults to `shape="card"` for display purposes
- Never listens to `@activate` or `@shapeUrl` events
- The shape prop is purely for visual styling/dimensions
- **Impact of change**: None - ItemCard doesn't care what shape name is used, only that it displays correctly

---

### 2. **ItemTile.vue** (Display Only)
**Location**: `src/components/clist/ItemTile.vue`

**Usage**:
```vue
<ImgShape v-if="dataMode && data" 
    :data="data" 
    :shape="shape || 'tile'" 
    :variant="variant || 'default'" />
```

**Props Interface**:
```typescript
interface Props {
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}
```

**Event Listeners**: None ✅

**Analysis**:
- ItemTile defaults to `shape="tile"` for display purposes
- Never listens to any ImgShape events
- **Impact of change**: None - purely presentational usage

---

### 3. **ItemRow.vue** (Display Only)
**Location**: `src/components/clist/ItemRow.vue`

**Usage**:
```vue
<ImgShape v-if="dataMode && data" 
    :data="data" 
    :shape="shape || 'avatar'" 
    :variant="variant || 'default'"
    class="image-box" />
```

**Props Interface**:
```typescript
interface Props {
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}
```

**Event Listeners**: None ✅

**Analysis**:
- ItemRow defaults to `shape="avatar"` for small circular images
- Never listens to any ImgShape events
- **Impact of change**: None - purely presentational usage

---

### 4. **ItemModalCard.vue** (Display Only)
**Location**: `src/components/clist/ItemModalCard.vue`

**Usage**:
```vue
<ImgShape v-if="dataMode && data" 
    :data="data" 
    :shape="shape || 'card'"
    :variant="variant || 'default'" 
    class="card-background-image" />
```

**Props Interface**:
```typescript
interface Props {
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}
```

**Event Listeners**: None ✅

**Analysis**:
- Modal card defaults to `shape="card"` for display
- Never listens to any ImgShape events
- **Impact of change**: None - purely presentational usage

---

### 5. **ImagesCoreAdmin.vue** (Event Consumer) ⚠️
**Location**: `src/views/admin/ImagesCoreAdmin.vue`

**Usage** (4 instances):
```vue
<!-- Vertical -->
<ImgShape ref="verticalShapeRef" 
    :data="selectedImage.shape_vertical" 
    shape="card" variant="vertical"
    :editable="true"
    :active="activeShape?.shape === 'vertical'"
    @shapeUrl="(url: string) => verticalShapeUrl = url"
    @activate="handleShapeActivate" />

<!-- Card/Wide -->
<ImgShape ref="cardShapeRef" 
    :data="cardWidePreviewData"
    shape="card" variant="wide"
    :editable="true"
    :active="activeShape?.shape === 'wide'"
    @shapeUrl="(url: string) => cardWideShapeUrl = url"
    @activate="handleShapeActivate" />

<!-- Tile/Square -->
<ImgShape ref="tileShapeRef" 
    :data="selectedImage.shape_thumb"
    shape="tile" variant="square"
    :editable="true"
    :active="activeShape?.shape === 'square'"
    @shapeUrl="(url: string) => tileWideShapeUrl = url"
    @activate="handleShapeActivate" />

<!-- Avatar/Thumb -->
<ImgShape ref="avatarShapeRef" 
    :data="selectedImage.shape_thumb"
    shape="avatar"
    :editable="true"
    :active="activeShape?.shape === 'thumb'"
    @shapeUrl="(url: string) => avatarThumbShapeUrl = url"
    @activate="handleShapeActivate" />
```

**Event Handler**:
```typescript
const handleShapeActivate = (data: { shape: string; variant: string; adapter: string }) => {
    // Currently normalizes display shapes to core shapes:
    // 'tile' → 'square'
    // 'avatar' → 'thumb'
    // 'card' + 'vertical' → 'vertical'
    // 'card' + 'wide' → 'wide'
}
```

**Analysis**:
- ✅ **Only component that listens to ImgShape events**
- ✅ Already normalizes display shapes to core shapes internally
- ⚠️ Currently requires normalization logic because ImgShape emits `shape: 'card'/'tile'/'avatar'`
- **Impact of change**: Would **eliminate** the need for normalization - direct 1:1 mapping

---

## Additional Usage Points

### ImgShapeData Type Import (Type-Only)
Used by many components but only as a TypeScript type:
- `ItemList.vue` - imports type only
- `ItemGallery.vue` - imports type only
- `DropdownList.vue` - imports type only

**Impact of change**: None - it's just a data interface

---

## Confusion Matrix: Current State

| ImgShape Prop | ImgShape Emits | ImagesCoreAdmin Normalizes To | Actual Data Shape |
|---------------|----------------|------------------------------|-------------------|
| `shape="card" variant="wide"` | `{ shape: 'card', variant: 'wide' }` | `'wide'` | `shape_card` |
| `shape="card" variant="vertical"` | `{ shape: 'card', variant: 'vertical' }` | `'vertical'` | `shape_vertical` |
| `shape="tile" variant="square"` | `{ shape: 'tile', variant: 'square' }` | `'square'` | `shape_thumb` |
| `shape="avatar"` | `{ shape: 'avatar', variant: 'default' }` | `'thumb'` | `shape_thumb` |

**Problem**: Three-way mismatch between:
1. What ImgShape receives as props (`'card'/'tile'/'avatar'`)
2. What ImgShape emits (`'card'/'tile'/'avatar'`)
3. What the data actually represents (`'wide'/'vertical'/'square'/'thumb'`)

---

## Proposed Change: Align ImgShape with Core Shapes

### New ImgShape Props Interface

```typescript
interface Props {
    data: ImgShapeData
    shape: 'square' | 'wide' | 'thumb' | 'vertical'  // Core shape names
    variant?: 'default'  // Simplified - no longer needed for shape distinction
    adapter?: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
    forceBlur?: boolean
    editable?: boolean
    active?: boolean
}
```

### New Emit Signature

```typescript
emit('activate', {
    shape: 'square' | 'wide' | 'thumb' | 'vertical',  // Core shape names
    adapter: string
})
```

**Variant removal rationale**: The `variant` prop was only used to distinguish between different meanings of `shape="card"`. With core shape names, this distinction is built into the shape name itself.

---

## Migration Impact Assessment

### Zero Impact Components (Display Only)
✅ **ItemCard.vue**: Change `shape="card"` → `shape="wide"` (or pass through from parent)
✅ **ItemTile.vue**: Change `shape="tile"` → `shape="square"`
✅ **ItemRow.vue**: Change `shape="avatar"` → `shape="thumb"`
✅ **ItemModalCard.vue**: Change `shape="card"` → `shape="wide"`

**Risk**: Zero - these components don't consume events

### Moderate Impact Component (Event Consumer)
⚠️ **ImagesCoreAdmin.vue**: 
- Remove normalization logic from `handleShapeActivate()`
- Update ImgShape prop bindings:
  - `shape="card" variant="wide"` → `shape="wide"`
  - `shape="card" variant="vertical"` → `shape="vertical"`
  - `shape="tile" variant="square"` → `shape="square"`
  - `shape="avatar"` → `shape="thumb"`
- Simplify active checks (already using core shape names)

**Benefit**: **Simpler code** - direct 1:1 mapping, no translation layer needed

---

## Clarity Comparison

### Current Confusion (3-Layer Translation)

```
User clicks ImgShape
    ↓
ImgShape emits: { shape: 'card', variant: 'vertical' }
    ↓
ImagesCoreAdmin normalizes: 'card' + 'vertical' → 'vertical'
    ↓
ShapeEditor receives: shape='vertical'
    ↓
activeShapeData maps: 'vertical' → shape_vertical
```

### Proposed Clarity (Direct Mapping)

```
User clicks ImgShape
    ↓
ImgShape emits: { shape: 'vertical' }
    ↓
ShapeEditor receives: shape='vertical'
    ↓
activeShapeData maps: 'vertical' → shape_vertical
```

---

## Recommendation

✅ **Change ImgShape to emit core shape names** (`'square' | 'wide' | 'thumb' | 'vertical'`)

### Rationale:
1. **Only one component** (ImagesCoreAdmin) consumes ImgShape events
2. That component **already normalizes** to core shapes anyway
3. **No external dependencies** on the current naming (all other components are display-only)
4. **Eliminates confusion** between display layer and data layer
5. **Simplifies codebase** by removing translation layer
6. **Aligns with data structure** (shape_card, shape_thumb, shape_vertical)
7. **Matches ShapeEditor** which already uses core shape names

### Implementation Steps:
1. Update `ImgShape.vue` Props interface to use core shape names
2. Update `ImgShape.vue` emit to use core shape names
3. Remove `variant` from activate emit (no longer needed)
4. Update ImagesCoreAdmin ImgShape bindings (4 instances)
5. Remove normalization logic from `handleShapeActivate()`
6. Update display-only components (ItemCard, ItemTile, ItemRow, ItemModalCard) - optional, can keep current props if desired for backwards compatibility

### Backwards Compatibility Option:
If needed, ImgShape could accept both old and new shape names during a transition period, then deprecate old names.

---

## Conclusion

**From an external point of view**, ImgShape emitting core shape names (`'square'`, `'wide'`, `'thumb'`, `'vertical'`) would be **much clearer** and **more maintainable**. The shape name would directly represent the data structure (`shape_card`, `shape_thumb`, `shape_vertical`) rather than how the image is visually styled (`'card'`, `'tile'`, `'avatar'`).

**Key Insight**: How the component *uses* the shape (to create a card UI, tile UI, or avatar UI) is an *internal styling concern*, not part of the component's external contract. The external contract should reflect *what the shape is* (wide, square, thumb, vertical), not *how it's displayed*.
