# CList Design Specification - Simplified Dimension Standards

**Date**: November 9, 2025 (Updated November 10, 2025 - Width/Columns System)  
**Phase**: CL1c - Design Alignment  
**Status**: Complete - Simplified Production Standards with Layout Control

---

## ⚠️ PRODUCTION SAFETY NOTICE (November 10, 2025)

### Tile Variant Restrictions

**UNSAFE - DO NOT USE IN PRODUCTION**:
- ❌ `shape="tile"` + `variant="default"`
- ❌ `shape="tile"` + `variant="wide"`
- ❌ `shape="tile"` + `variant="vertical"`

**REASON**: These variants require additional work on image cropping and focal point handling.

**SAFE PRODUCTION PATTERNS**:
```vue
<!-- ✅ Small dropdowns/lists (64px avatars) -->
<ItemList entity="images" size="small" avatarShape="round|square" />
<!-- Uses ItemRow with avatar shape -->

<!-- ✅ Medium dropdowns/lists (128px tiles) - Compact style -->
<ItemList entity="images" size="medium" width="small" />
<!-- Uses ItemTile with heading overlay (styleCompact=true) -->

<!-- ✅ Medium dropdowns/lists (128px tiles) - Non-compact style -->
<ItemList entity="images" size="medium" width="large" />
<!-- Uses ItemTile with heading beside image (styleCompact=false) -->
```

**ARCHITECTURE SIMPLIFICATION (November 10, 2025)**:
- **Removed**: `itemType` prop - component auto-selected by `size`
- **Removed**: ItemTile sizes `small` and `large`
- **Removed**: ItemRow sizes `medium` and `large`
- **Removed**: ItemCard component (reserved for Gallery/Slider future implementation)
- **Removed**: All padding from ItemTile and ItemRow (in compact mode)
- **Added**: Width control system (`inherit`, `small`, `medium`, `large`)
- **Added**: Multi-column layout support (`columns="off|on"`)
- **Added**: Automatic styleCompact detection based on width
- **Added**: Non-compact layout mode (heading beside image)
- **Result**: Two-size system with flexible layouts: `small` (rows with avatars) and `medium` (tiles with configurable layouts)

---

## CSS Variables - Source of Truth

All clist components derive dimensions from these CSS variables in `src/assets/css/01-variables.css`:

```css
/* Tile dimensions */
--tile-width: 8rem;         /* 128px - medium size */
--tile-height: 4rem;        /* 64px - DEPRECATED, not used */
--tile-height-square: 8rem; /* 128px - used for tile-square */

/* Avatar dimensions */
--avatar: 4rem;             /* 64px - small size */

/* Border radius */
--radius: 0.5rem;           /* 8px - standard border radius for all clist items */

/* Additional spacing */
--radius-small: 0.375rem;   /* 6px - for avatar-square */
```

**Note**: Card dimensions (--card-width, --card-height) are reserved for future Gallery and Slider implementations.

---

## Simplified Two-Size System

### ItemList Size Mapping

| Size | Component Used | Image Shape | Image Dimensions | Use Case |
|------|----------------|-------------|------------------|----------|
| **small** | ItemRow | `avatar` | 64×64px | Compact dropdowns, dense lists |
| **medium** | ItemTile | `tile` | 128×128px | Standard dropdowns, tile grids with layout control |

### Width Control System (NEW - November 10, 2025)

ItemList now supports flexible width and column control:

```vue
<!-- Compact style (heading overlay on image) -->
<ItemList size="medium" width="small" columns="off" />
<!-- Width: 168px (0.5 × card-width), styleCompact=true -->

<!-- Medium width (still compact if < card-width) -->
<ItemList size="medium" width="medium" columns="off" />
<!-- Width: 336px (card-width), styleCompact=true (current default) -->

<!-- Large width with non-compact style (heading beside image) -->
<ItemList size="medium" width="large" columns="off" />
<!-- Width: 336px (card-width), styleCompact=false, grid layout -->

<!-- Multi-column layout -->
<ItemList size="medium" width="inherit" columns="on" />
<!-- Parent controls width, flex wrap enabled -->
```

### ItemList Width Props

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| **width** | `inherit` \| `small` \| `medium` \| `large` | `inherit` | Controls container width |
| **columns** | `off` \| `on` | `off` | Enables multi-column flex wrapping |
| **headingLevel** | `h3` \| `h4` | `h3` | Heading tag level for ItemTile |

**Width Behavior**:
- `inherit`: Parent controls width (no constraint applied)
- `small`: 168px (0.5 × card-width, ~0.5 × 336px)
- `medium`: 336px (card-width)
- `large`: 336px (card-width)

**Columns Behavior**:
- `off`: Single column layout (default)
- `on`: Flex wrap enabled (ignored if width='small')

**styleCompact Auto-Detection**:
- Automatically `true` when column width < card-width (336px)
- Automatically `true` when width='medium' (maintains current implementation)
- Otherwise `false` for non-compact layout

### Component Auto-Selection

ItemList **automatically selects** the correct component based on `size` prop:

```typescript
// In ItemList.vue
const itemComponent = computed(() => {
    if (props.size === 'small') return ItemRow
    return ItemTile
})
```

**No `itemType` prop needed** - the system is fully automated based on size.

---

## ItemRow Standards (size="small")

**Automatic Usage**: `size="small"` → ItemRow with avatar shape

### Dimensions
- **Height**: 64px (queried from `useTheme().avatarWidth`)
- **Image**: 64×64px avatar
- **Padding**: 0 (no padding/margin)
- **Border Radius**: `var(--radius)` (8px)
- **Gap**: 1rem between image and content

### Avatar Shape Control
```vue
<!-- Round avatars (default for users, instructors) -->
<ItemList entity="images" size="small" avatarShape="round" />

<!-- Square avatars (for projects, events, posts) -->
<ItemList entity="images" size="small" avatarShape="square" />
```

### CSS Implementation
```css
.item-row {
    display: grid;
    grid-template-columns: auto 1fr;  /* Or auto 1fr auto with slot */
    gap: 1rem;
    padding: 0;
    border-radius: var(--radius);
    height: v-bind('imageDimension + "px"');  /* From useTheme() */
}

.image-box {
    width: v-bind('imageDimension + "px"');
    height: v-bind('imageDimension + "px"');
    border-radius: var(--radius);
}
```

---

## ItemTile Standards (size="medium")

**Automatic Usage**: `size="medium"` → ItemTile with tile-square shape

### Layout Modes (NEW - November 10, 2025)

ItemTile supports two layout modes controlled by the `styleCompact` prop:

#### Compact Mode (styleCompact=true)
- **Image**: Full-width background (128×128px)
- **Heading**: Overlay at bottom with gradient background
- **Padding**: 0 (follows imgShape height exactly)
- **Use Case**: Narrow widths, dropdown selections, compact grids

```vue
<ItemList size="medium" width="small" />
<!-- Auto-detects styleCompact=true -->
```

#### Non-Compact Mode (styleCompact=false)
- **Layout**: CSS Grid `[128px image | heading with padding]`
- **Image**: Fixed 128×128px on left
- **Heading**: Positioned beside image (right side)
- **Padding**: 24px vertical, 12px left of heading
- **Use Case**: Wide layouts, more readable text presentation

```vue
<ItemList size="medium" width="large" />
<!-- Auto-detects styleCompact=false when width >= card-width -->
```

### Dimensions
- **Min-Height**: 128px (matches `--tile-width`)
- **Image**: 128×128px tile-square
- **Border Radius**: `var(--radius)` (8px)
- **Width**: Controlled by ItemList or parent

### CSS Implementation

```css
/* Compact Mode */
.item-tile.style-compact {
    position: relative;
    border-radius: var(--radius);
    min-height: 128px;
}

.style-compact .tile-background {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.style-compact .tile-content {
    padding: 0;
    background: linear-gradient(to bottom,
        transparent 0%,
        oklch(from var(--color-card-bg) l c h / 0.8) 40%,
        var(--color-card-bg) 100%);
}

/* Non-Compact Mode */
.item-tile:not(.style-compact) {
    display: grid;
    grid-template-columns: 128px 1fr;
    border-radius: var(--radius);
}

.tile-image {
    width: 128px;
    height: 128px;
}

.tile-heading {
    display: flex;
    align-items: center;
    padding: 24px 12px 24px 12px;
}
```

---

## ImgShape Dimension Matrix (Simplified)

ImgShape.vue calculates dimensions based on `shape` + `variant` combination:

| Shape | Variant | Width | Height | Aspect Ratio | Status | Used By |
|-------|---------|-------|--------|--------------|--------|---------|
| **avatar** | default | 64px | 64px | 1:1 | ✅ Safe | ItemRow (round) |
| **avatar** | square | 64px | 64px | 1:1 | ✅ Safe | ItemRow (square) |
| **tile** | square | 128px | 128px | 1:1 | ✅ Safe | ItemTile |
| **tile** | default | 128px | 64px | 2:1 | ⚠️ UNSAFE | Reserved |
| **tile** | wide | 128px | 64px | 2:1 | ⚠️ UNSAFE | Reserved |
| **tile** | vertical | 128px | 227px | 9:16 | ⚠️ UNSAFE | Reserved |

**Card variants** (all sizes) are **reserved** for future Gallery and Slider implementations.

### Current Production Usage

```vue
<!-- Small lists/dropdowns -->
<ItemList size="small" avatarShape="round">
  <!-- Auto-uses: ItemRow + shape="avatar" variant="default" (64×64px round) -->
</ItemList>

<ItemList size="small" avatarShape="square">
  <!-- Auto-uses: ItemRow + shape="avatar" variant="square" (64×64px square) -->
</ItemList>

<!-- Medium lists/dropdowns -->
<ItemList size="medium">
  <!-- Auto-uses: ItemTile + shape="tile" variant="square" (128×128px) -->
</ItemList>
```

### ImgShape CSS Implementation

```css
/* Avatar shapes */
.img-shape--avatar {
  width: var(--avatar);    /* 64px */
  height: var(--avatar);   /* 64px */
}

.img-shape--avatar-round {
  border-radius: 50%;
}

.img-shape--avatar-square {
  border-radius: var(--radius-small);  /* 6px */
}

/* Tile shapes */
.img-shape--tile {
  width: var(--tile-width);   /* 128px */
  height: var(--tile-height); /* 64px - not used for square */
}

.img-shape--square.img-shape--tile {
  width: var(--tile-width);   /* 128px */
  height: var(--tile-width);  /* 128px */
}
```

---

## ItemList Layout System (NEW - November 10, 2025)

ItemList uses flexbox with conditional width constraints:

```css
.item-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Width variations */
.item-list.width-small {
    width: calc(var(--card-width) * 0.5);  /* 168px */
}

.item-list.width-medium {
    width: var(--card-width);  /* 336px */
}

.item-list.width-large {
    width: var(--card-width);  /* 336px */
}

/* Columns enabled: flex wrap */
.item-list.columns-on {
    flex-direction: row;
    flex-wrap: wrap;
}
```

**Gap between items**: `1rem` (16px) managed by `.item-list { gap: 1rem; }`

**Width Priority**:
1. If `width="inherit"`: No width constraint (parent controls)
2. If `width="small"`: Forces 168px width, single column
3. If `width="medium"` or `width="large"`: 336px width
4. If `columns="on"`: Enables flex wrapping (except when width='small')

---

## DEPRECATED / REMOVED FEATURES

The following features have been removed for maximum simplification:

### Removed Props
- ❌ `itemType` prop - Component now auto-selected by `size`
- ❌ ItemTile `size="small"` and `size="large"`
- ❌ ItemRow `size="medium"` and `size="large"`

### Removed Components
- ❌ ItemCard - Reserved for future Gallery/Slider implementation

### Removed Padding/Spacing (Compact Mode)
- ❌ ItemTile padding in compact mode - Now 0 to follow imgShape height exactly
- ❌ ItemRow padding - Now 0 to follow imgShape height exactly

### Added Features (November 10, 2025)
- ✅ Width control system (`inherit`, `small`, `medium`, `large`)
- ✅ Multi-column layout support (`columns="off|on"`)
- ✅ Automatic styleCompact detection
- ✅ Non-compact layout mode (heading beside image with padding)
- ✅ Configurable heading level (`h3` or `h4`)

### Reserved for Future
- 🔮 ItemCard (all sizes) - Gallery and Slider components
- 🔮 Tile variants (default/wide/vertical) - After focal point work complete

---

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
  - ✅ Use `shape="avatar"` for 60px thumbnails
- `medium` (80px): **Default** - Balance of detail and density
  - ✅ Use `shape="avatar"` or `shape="tile" variant="square"` for 80px thumbnails
- `large` (100px): Fewer items, emphasis on images
  - ✅ Use `shape="tile" variant="square"` for 100px+ thumbnails

**ItemCard**:
- `small` (195px): Grid with 3-4 columns, compact view
  - ✅ Use `shape="card"` with any variant
- `medium` (260px): **Default** - Standard gallery/preview
  - ✅ Use `shape="card"` with any variant
- `large` (325px): Hero cards, featured content
  - ✅ Use `shape="card"` with any variant

**ItemTile**:
- `small` (120px): Dense grid, minimal info
  - ⚠️ Use `shape="tile" variant="square"` ONLY
- `medium` (160px): **Default** - Standard compact view
  - ⚠️ Use `shape="tile" variant="square"` ONLY
- `large` (200px): More vertical space for text
  - ⚠️ Use `shape="tile" variant="square"` ONLY

### Shape Selection by Container Size

| Container Size | Recommended Shape | Variant | Database Field |
|----------------|-------------------|---------|----------------|
| 60-80px | `avatar` | `default` or `square` | `img_thumb` |
| 100-128px | `tile` | `square` ⚠️ ONLY | `img_square` |
| 200px+ | `card` | any ✅ | `img_square` or `img_thumb` |

---

## Variant Selection Guidelines

### When to Use Each Variant

**default**:
- ✅ **SAFE for card shape only**
- ⚠️ **UNSAFE for tile shape** (use square instead)
- Standard aspect ratios (3:2 for card)
- Use for most card-based content

**square**:
- ✅ **SAFE for all shapes** (card, tile, avatar)
- Profile images, avatars, album covers
- Consistent square framing
- Uses `img_square` field from API
- **REQUIRED for tile shape in production**

**wide**:
- ✅ **SAFE for card shape only**
- ⚠️ **UNSAFE for tile shape** (use square instead)
- Banners, headers, landscape photos
- 2:1 aspect ratio
- Good for hero sections

**vertical**:
- ✅ **SAFE for card shape only**
- ⚠️ **UNSAFE for tile shape** (use square instead)
- Portrait photos, mobile screenshots
- 9:16 aspect ratio
- Tall, narrow format

### Safe Shape + Size Combinations (Production Ready)

| Use Case | Shape | Variant | Size | Notes |
|----------|-------|---------|------|-------|
| Dropdown list | `tile` | `square` | medium | ✅ Default for dropdowns |
| Small list items | `avatar` | `default/square` | small | ✅ 64px thumbnails |
| Card gallery | `card` | `square` | medium | ✅ Standard gallery |
| Wide banners | `card` | `wide` | large | ✅ Hero sections |
| Portrait cards | `card` | `vertical` | medium | ✅ Mobile screenshots |

### ⚠️ Shape Migration Path

**Current State (November 10, 2025)**:
- If you need **tile shape**: Always use `variant="square"`
- If you need **small thumbnails**: Use `avatar` shape instead of tile
- If you need **non-square aspect ratios**: Use `card` shape

**Future State (After Tile Variants Fixed)**:
- Tile variants (default/wide/vertical) will support proper focal point handling
- Can then use tile for compact 2:1 layouts

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
**Maximum Simplification Applied** ✅  
**Two-Size System (small/medium)** ✅  
**Width/Columns Control System** ✅  
**Compact/Non-Compact Layouts** ✅  
**Ready for Production** ✅

**Last Updated**: November 10, 2025 - Width Control & Layout Modes

