# CList Component System

**Directory**: `src/components/clist/`  
**Design Specification**: [`/docs/CLIST_DESIGN_SPEC.md`](../../docs/CLIST_DESIGN_SPEC.md)

---

## 📋 Design Governance

**All clist components are governed by the official design specification document:**

👉 **[CLIST_DESIGN_SPEC.md](../../docs/CLIST_DESIGN_SPEC.md)**

This document defines:
- ✅ CSS variable standards (`--avatar`, `--tile-width`, `--card-width`, etc.)
- ✅ Component dimension standards (ItemRow, ItemTile, ItemCard)
- ✅ Size system (small: 64px, medium: 128px)
- ✅ Width and layout control (inherit/small/medium/large, columns on/off)
- ✅ Compact vs non-compact modes
- ✅ Shape and variant guidelines (avatar, tile, card)
- ✅ Production-safe patterns and unsafe combinations
- ✅ API response format expectations

**🚨 IMPORTANT**: Before making ANY changes to clist components, consult the specification document first.

---

## 📦 Components Overview

### Container Components

#### **ItemList.vue**
Primary container for list-based layouts. Auto-selects child components based on `size` prop.

**Key Props**:
- `size`: `small` (ItemRow) | `medium` (ItemTile)
- `width`: `inherit` (default) | `small` | `medium` | `large`
- `columns`: `off` (default) | `on`
- `headingLevel`: `h3` (default) | `h4`
- `interaction`: `static` | `popup` | `dropdown` | `zoom`
- `entity`: `posts` | `events` | `instructors` | `projects` | `images`

**Features**:
- Automatic component selection (ItemRow for small, ItemTile for medium)
- Width control with automatic styleCompact detection
- Multi-column flex wrapping support
- API data fetching or manual data binding
- Multiple interaction modes (static, popup, dropdown, zoom)

#### **DropdownList.vue**
Wrapper around ItemList with dropdown/button trigger functionality.

**Key Props**:
- Inherits all ItemList props
- `title`: Button text
- `showPreview`: Display selected item preview
- `showToolbar`: Show edit/delete actions

---

### Item Components

#### **ItemRow.vue**
Horizontal row layout with avatar-sized images (64×64px).

**Usage**: Automatically used when `ItemList size="small"`

**Features**:
- Dynamic dimensions from `useTheme()` composable
- Supports round or square avatars
- Grid layout: `[image | content | optional slot]`
- Zero padding (follows imgShape height exactly)

#### **ItemTile.vue**
Tile layout with 128×128px images. Supports two display modes.

**Usage**: Automatically used when `ItemList size="medium"`

**Layout Modes**:
1. **Compact** (`styleCompact=true`):
   - Full-width background image
   - Heading overlay with gradient
   - Auto-enabled when width < card-width

2. **Non-Compact** (`styleCompact=false`):
   - Grid layout: `[128px image | heading with padding]`
   - Heading beside image (not overlay)
   - Padding: 24px vertical, 12px left

**Features**:
- Automatic layout mode detection based on width
- Configurable heading level (h3 or h4)
- Hover effects (transform + shadow)
- Border radius from `var(--radius)`

---

## 🎨 Design Standards

### Size System
- **small**: 64px avatars (ItemRow)
- **medium**: 128px tiles (ItemTile)

### Width System (NEW)
- **inherit**: Parent controls width (no constraint)
- **small**: 168px (0.5 × card-width)
- **medium**: 336px (card-width)
- **large**: 336px (card-width)

### StyleCompact Detection
- Auto-true when `itemWidth < cardWidth`
- Auto-true for `width="medium"` (maintains current behavior)
- Auto-false for `width="large"` (enables non-compact layout)

### CSS Variables (from `01-variables.css`)
```css
--avatar: 4rem;          /* 64px - small size */
--tile-width: 8rem;      /* 128px - medium size */
--card-width: 21rem;     /* 336px - large size reference */
--radius: 0.5rem;        /* 8px - border radius */
```

---

## ⚠️ Production Safety

### ✅ Safe Patterns
```vue
<!-- Small lists with avatars -->
<ItemList size="small" avatarShape="round|square" />

<!-- Medium tiles with compact style -->
<ItemList size="medium" width="small" />

<!-- Medium tiles with non-compact style -->
<ItemList size="medium" width="large" />

<!-- Multi-column layout -->
<ItemList size="medium" width="inherit" columns="on" />
```

### ❌ Unsafe Patterns
```vue
<!-- DO NOT USE: Tile variants other than square -->
<ItemList size="medium" variant="default|wide|vertical" />
<!-- Reason: Focal point handling incomplete -->
```

**Always use `variant="square"` for tile shapes** until focal point work is complete.

---

## 🔧 Integration Points

### API Response Format
All entity endpoints should return:
```typescript
interface EntityItem {
  id: number
  title?: string
  entityname?: string
  img_thumb?: string  // JSON: ImgShapeData for 64px thumbnails
  img_square?: string // JSON: ImgShapeData for 128px tiles
}
```

### Database Field Mapping
- **size="small"** → `img_thumb` (64×64px)
- **size="medium"** → `img_square` (128×128px)

### Theme Composable
Components use `useTheme()` for dynamic dimension queries:
```typescript
import { useTheme } from '@/composables/useTheme'

const { avatarWidth, tileWidth, cardWidth } = useTheme()
// Returns: { value: 64 }, { value: 128 }, { value: 336 }
```

---

## 📚 Related Documentation

- **Design Specification**: [`/docs/CLIST_DESIGN_SPEC.md`](../../docs/CLIST_DESIGN_SPEC.md) - Complete design standards
- **Image System**: [`ImgShape.vue`](../images/ImgShape.vue) - Image handling component
- **Theme System**: [`useTheme.ts`](../../composables/useTheme.ts) - CSS variable extraction

---

## 🚀 Quick Start Examples

### Simple Dropdown
```vue
<DropdownList 
  entity="images" 
  size="medium" 
  width="small"
  title="Select Image" 
  :show-preview="true" 
/>
```

### Static List with Multi-Column
```vue
<ItemList 
  entity="posts" 
  size="medium" 
  width="inherit"
  columns="on"
  interaction="static" 
/>
```

### Compact vs Non-Compact
```vue
<!-- Compact: heading overlay -->
<ItemList size="medium" width="small" />

<!-- Non-Compact: heading beside image -->
<ItemList size="medium" width="large" />
```

---

**Component System Version**: 1.2 (Width/Columns System)  
**Last Updated**: November 10, 2025  
**Maintained By**: Design System Team

**🔗 Always consult [CLIST_DESIGN_SPEC.md](../../docs/CLIST_DESIGN_SPEC.md) before making changes.**
