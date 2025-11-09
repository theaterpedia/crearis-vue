# CList Design Specification - Dimension Standards

**Date**: November 9, 2025  
**Phase**: CL1c - Design Alignment  
**Status**: Complete - Production Standards Defined

---

## CSS Variables - Source of Truth

All clist components derive dimensions from these CSS variables in `src/assets/css/01-variables.css`:

```css
/* Card dimensions */
--card-width: 21rem;        /* 336px */
--card-height: 14rem;       /* 224px */
--card-height-min: 10.5rem; /* 168px */

/* Tile dimensions */
--tile-width: 8rem;         /* 128px */
--tile-height: 4rem;        /* 64px */
--tile-height-square: 8rem; /* 128px */

/* Avatar dimensions */
--avatar: 4rem;             /* 64px */

/* Additional spacing */
--radius-small: 0.375rem;   /* 6px - border radius for avatar-square */
```

---

## ImgShape Dimension Matrix

ImgShape.vue calculates dimensions based on `shape` + `variant` combination:

| Shape | Variant | Width | Height | Aspect Ratio | Use Case |
|-------|---------|-------|--------|--------------|----------|
| **card** | default | 336px | 224px | 3:2 | Standard card background |
| **card** | square | 336px | 336px | 1:1 | Square card (profile, album) |
| **card** | wide | 336px | 168px | 2:1 | Wide banner |
| **card** | vertical | 128px | 227px | 9:16 | Portrait mode |
| **tile** | default | 128px | 64px | 2:1 | Compact tile |
| **tile** | square | 128px | 128px | 1:1 | Square tile |
| **tile** | wide | 128px | 64px | 2:1 | Same as default |
| **tile** | vertical | 128px | 227px | 9:16 | Tall tile |
| **avatar** | default | 64px | 64px | 1:1 | Round avatar (50% radius) |
| **avatar** | square | 64px | 64px | 1:1 | Square avatar (6px radius) |

**CSS Implementation** (ImgShape.vue):
```css
/* Base shapes */
.img-shape--card {
  width: var(--card-width);      /* 336px */
  height: var(--card-height);    /* 224px */
}

.img-shape--tile {
  width: var(--tile-width);      /* 128px */
  height: var(--tile-height);    /* 64px */
}

.img-shape--avatar {
  width: var(--avatar);          /* 64px */
  height: var(--avatar);         /* 64px */
}

/* Variant overrides */
.img-shape--square.img-shape--card {
  width: var(--card-width);      /* 336px */
  height: var(--card-width);     /* 336px */
}

.img-shape--square.img-shape--tile {
  width: var(--tile-width);      /* 128px */
  height: var(--tile-width);     /* 128px */
}

.img-shape--wide.img-shape--card {
  width: var(--card-width);      /* 336px */
  height: calc(var(--card-width) * 0.5);  /* 168px */
}

.img-shape--wide.img-shape--tile {
  width: var(--tile-width);      /* 128px */
  height: calc(var(--tile-width) * 0.5);  /* 64px */
}

.img-shape--vertical.img-shape--card {
  width: var(--tile-width);      /* 128px - narrower */
  height: calc(var(--tile-width) * 16 / 9);  /* 227px - 9:16 ratio */
}

/* Avatar shape variants */
.img-shape--avatar-round {
  border-radius: 50%;
}

.img-shape--avatar-square {
  border-radius: var(--radius-small);  /* 6px */
}
```

---

## ItemRow Size Standards

ItemRow uses horizontal layout with fixed-height rows:

| Size | Max Height | Image Size | Heading Level | Use Case |
|------|-----------|------------|---------------|----------|
| **small** | 60px | 60×60px | h5 | Compact selector |
| **medium** | 80px | 80×80px | h4 | Default selector (BaseView) |
| **large** | 100px | 100×100px | h4 | Detailed selector |

**CSS Implementation** (ItemRow.vue):
```css
.size-small .row-col-image,
.size-small .image-box {
  width: 60px;
  height: 60px;
}
.size-small {
  max-height: 60px;
}

.size-medium .row-col-image,
.size-medium .image-box {
  width: 80px;
  height: 80px;
}
.size-medium {
  max-height: 80px;
}

.size-large .row-col-image,
.size-large .image-box {
  width: 100px;
  height: 100px;
}
.size-large {
  max-height: 100px;
}
```

**Grid Layout**:
```css
/* 2 columns: image + content */
grid-template-columns: auto 1fr;

/* 3 columns: image + content + slot (when slot present) */
grid-template-columns: auto 1fr auto;
```

---

## ItemCard Size Standards

ItemCard uses vertical card layout with background images:

| Size | Min Height | Card Dimensions | Heading Level | Use Case |
|------|-----------|-----------------|---------------|----------|
| **small** | 195px | 336×195px | h5 | Compact card grid |
| **medium** | 260px | 336×260px | h4 | Default card (Gallery, Events) |
| **large** | 325px | 336×325px | h3 | Featured card |

**Design Features**:
- 4px left accent border (`border-left: 4px solid var(--color-accent-bg)`)
- Background image with gradient overlay (transparent → 30% → 85% → 100%)
- Semi-transparent header background (60% opacity)
- Card-meta slot for badges, date, tags

**CSS Implementation** (ItemCard.vue):
```css
.size-small {
  min-height: 195px;  /* ~150px × 1.3 */
}
.size-small .card-content {
  padding: 1rem;
}

.size-medium {
  min-height: 260px;  /* ~200px × 1.3 */
}

.size-large {
  min-height: 325px;  /* ~250px × 1.3 */
}
.size-large .card-content {
  padding: 1.5rem;
}
```

---

## ItemTile Size Standards

ItemTile uses compact tile layout with background images:

| Size | Min Height | Tile Dimensions | Heading Level | Use Case |
|------|-----------|-----------------|---------------|----------|
| **small** | 120px | 128×120px | h5 | Dense grid |
| **medium** | 160px | 128×160px | h4 | Default tile |
| **large** | 200px | 128×200px | h3 | Tall tile |

**Design Features**:
- No border accent (minimal design)
- Background image with bottom gradient (transparent → 80% → 100%)
- No padding/margin in header (clean typography)

**CSS Implementation** (ItemTile.vue):
```css
.size-small {
  min-height: 120px;
}
.size-small .tile-content {
  padding: 0.75rem;
}

.size-medium {
  min-height: 160px;
}

.size-large {
  min-height: 200px;
}
.size-large .tile-content {
  padding: 1.5rem;
}
```

**Note**: ItemTile is fixed-width (128px from `--tile-width`). Heights are minimum values to accommodate content.

---

## Container Grid Layouts

ItemList and ItemGallery use CSS Grid with auto-fill:

### ItemList Grid (Defaults to Row)
```css
/* Row layout (itemType="row") */
.item-type-row {
  grid-template-columns: 1fr;  /* Single column */
}

/* Tile layout (itemType="tile") */
.item-type-tile {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* Card layout (itemType="card") */
.item-type-card {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
```

### ItemGallery Grid (Defaults to Card)
```css
/* Same as ItemList, but different default itemType */
```

**Responsive Behavior**:
- **Row**: Always single column, stacks vertically
- **Tile**: Wraps at 200px minimum (typically 2-6 tiles per row)
- **Card**: Wraps at 280px minimum (typically 1-4 cards per row)

---

## Size Selection Guidelines

### When to Use Each Size

**ItemRow**:
- `small` (60px): Dense lists with many items, mobile-optimized
- `medium` (80px): **Default** - Balance of detail and density
- `large` (100px): Fewer items, emphasis on images

**ItemCard**:
- `small` (195px): Grid with 3-4 columns, compact view
- `medium` (260px): **Default** - Standard gallery/preview
- `large` (325px): Hero cards, featured content

**ItemTile**:
- `small` (120px): Dense grid, minimal info
- `medium` (160px): **Default** - Standard compact view
- `large` (200px): More vertical space for text

---

## Variant Selection Guidelines

### When to Use Each Variant

**default**:
- Standard aspect ratios (3:2 for card, 2:1 for tile)
- Use for most content

**square**:
- Profile images, avatars, album covers
- Consistent square framing
- Uses `img_square` field from API

**wide**:
- Banners, headers, landscape photos
- 2:1 aspect ratio
- Good for hero sections

**vertical**:
- Portrait photos, mobile screenshots
- 9:16 aspect ratio
- Tall, narrow format

---

## Production Implementation Matrix

| Location | Component | ItemType | Size | Variant | Interaction |
|----------|-----------|----------|------|---------|-------------|
| **BaseView.vue** | ItemList | row | medium | default | popup |
| **PostPanel.vue** | ItemList | card | small | square | popup |
| **AdminActionUsersPanel.vue** | ItemList | card | medium | default | popup |
| **UpcomingEventsSection.vue** | ItemList | card | medium | default | static |
| **BlogPostsSection.vue** | ItemGallery | card | medium | wide | static |

---

## Design Consistency Rules

### 1. Typography
- All headings parsed by **HeadingParser** component
- Supports markdown syntax: `**bold**`, `{{color}}`, etc.
- Dynamic heading levels (h3/h4/h5) based on size
- Compact mode enabled for all clist items

### 2. Colors
- Card background: `var(--color-card-bg)`
- Card contrast: `var(--color-card-contrast)`
- Accent border: `var(--color-accent-bg)` (ItemCard only)
- Dimmed text: `var(--color-dimmed)`

### 3. Spacing
- Grid gap: `1rem` (16px)
- Card padding: `1rem` (small), `1.25rem` (medium), `1.5rem` (large)
- Border radius: `0.5rem` (8px) for cards/tiles

### 4. Transitions
- Transform: `0.2s` on hover
- Box shadow: `0.2s` on hover
- Image opacity: `0.3s` fade-in after load

### 5. Hover Effects
- **ItemRow**: `translateY(-1px)` + `box-shadow: 0 2px 8px`
- **ItemCard**: `translateY(-2px)` + `box-shadow: 0 4px 12px`
- **ItemTile**: `translateY(-2px)` + `box-shadow: 0 4px 12px`

---

## Dimension Change History

### Initial Implementation (IMAGE_SYSTEM_COMPLETE.md, outdated)
```css
--tile-width: 10.5rem;  /* 168px */
--tile-height: 7rem;    /* 112px */
--avatar: 5.25rem;      /* 84px */
```

### Current Production (01-variables.css, November 2025)
```css
--tile-width: 8rem;     /* 128px */
--tile-height: 4rem;    /* 64px */
--avatar: 4rem;         /* 64px */
```

**Rationale for Change**:
- Smaller tiles fit more content in grid layouts
- Avatar size aligned with common UI standards (64px = 4rem)
- Maintains 2:1 aspect ratio for tiles (128×64px)

---

## API Response Expectations

### Entity Endpoints

All entity endpoints should return:

```typescript
interface EntityItem {
  id: number
  title?: string           // Primary heading
  entityname?: string      // Fallback heading
  img_thumb?: string       // JSON: ImgShapeData for default variant
  img_square?: string      // JSON: ImgShapeData for square variant
}
```

### Image Data Format (JSON string)

```json
{
  "url": "https://res.cloudinary.com/little-papillon/image/upload/v1234567890/folder/image.jpg",
  "x": 0.5,      // focal point x (0-1, nullable)
  "y": 0.3,      // focal point y (0-1, nullable)
  "z": 1.2,      // zoom level (nullable)
  "options": {   // additional options (nullable)
    "alt": "Image description"
  }
}
```

**Field Usage**:
- `variant="default"` → uses `img_thumb` field
- `variant="square"` → uses `img_square` field
- Other variants → uses `img_thumb` with aspect ratio override

---

## Testing Dimension Verification

### Manual Visual Test
1. Open component in browser
2. Right-click image → Inspect
3. Verify computed dimensions match spec

### Automated Test (useTheme)
```typescript
import { useTheme } from '@/composables/useTheme'

const { cardWidth, cardHeight, tileWidth, tileHeight, avatarWidth } = useTheme()

console.assert(cardWidth.value === 336, 'Card width should be 336px')
console.assert(cardHeight.value === 224, 'Card height should be 224px')
console.assert(tileWidth.value === 128, 'Tile width should be 128px')
console.assert(tileHeight.value === 64, 'Tile height should be 64px')
console.assert(avatarWidth.value === 64, 'Avatar should be 64px')
```

---

## Future Enhancements (CL3/CL4)

### Variable Tile Widths (CL3)
Currently tiles are fixed at 128px. Future enhancement:
```css
--tile-width-small: 6rem;    /* 96px */
--tile-width-medium: 8rem;   /* 128px */
--tile-width-large: 10rem;   /* 160px */
```

### Responsive Dimensions (CL4)
Media queries for mobile/tablet/desktop:
```css
@media (max-width: 768px) {
  --card-width: 18rem;  /* 288px */
  --card-height: 12rem; /* 192px */
}
```

### Custom Aspect Ratios (CL4)
User-defined aspect ratios:
```typescript
aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4'
```

---

**Design Specification Complete** ✅  
**All Dimensions Aligned** ✅  
**Ready for CL2 Implementation** ✅
