# Page Heading Specification

## Odoo Header Types

The header system aligns with Odoo's website builder header types:

| Type | Description | Uses Hero | Uses TextImage |
|------|-------------|-----------|----------------|
| `simple` | Text-only, no hero/image | ❌ | ❌ |
| `columns` | Side-by-side text + image | ❌ | ✅ |
| `banner` | Full-width hero, image top-aligned | ✅ | ❌ |
| `cover` | Full-width hero, image centered | ✅ | ❌ |
| `bauchbinde` | Full-width with overlay band | ✅ | ❌ |

## Odoo Header Sizes

Heights expressed as viewport height (vh):

| Size | CSS Height | Description |
|------|------------|-------------|
| `mini` | `25vh` | Quarter-screen |
| `medium` | `50vh` | Half-screen |
| `prominent` | `75vh` | Three-quarters |
| `full` | `100vh` | Full viewport |

## Database Schema

### Entity Fields (posts, events, pages)

```sql
-- Added by migration 066
header_size VARCHAR(20) DEFAULT 'medium',
header_type VARCHAR(20) DEFAULT 'banner'
```

### Header Configs System (migration 067)

```sql
-- Base Types (system-level)
CREATE TABLE header_base_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,       -- simple, banner, cover, columns, bauchbinde
    format_options JSONB DEFAULT '{}'::jsonb,
    allowed_sizes TEXT[] DEFAULT ARRAY['mini','medium','prominent','full'],
    is_active BOOLEAN DEFAULT true
);

-- Central Subcategories (site-level customizations)
CREATE TABLE header_subcategories (
    id SERIAL PRIMARY KEY,
    base_type_id INTEGER REFERENCES header_base_types(id),
    name VARCHAR(100) NOT NULL,
    format_options JSONB DEFAULT '{}'::jsonb,
    allowed_sizes TEXT[]
);

-- Project Overrides (per-project customizations)
CREATE TABLE header_project_overrides (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    subcategory_id INTEGER REFERENCES header_subcategories(id),
    format_options JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);
```

## Three-Layer Configuration Merge

Configuration is resolved in priority order:

```
1. Base Type (system defaults)
   └─ 2. Subcategory (site customizations)
        └─ 3. Project Override (per-project tweaks)
             └─ 4. Entity formatOptions (individual entity)
                  └─ 5. Entity headerSize prop (highest priority)
```

### Example Merge Flow

```javascript
// Base Type: banner
{ name: 'banner', headerSize: 'medium', imgTmpAlignY: 'top' }

// + Subcategory: banner_event
{ headerSize: 'prominent', gradientType: 'dark' }

// + Project Override: project-X
{ gradientDepth: 0.6 }

// + Entity formatOptions
{ contentAlignY: 'bottom' }

// + Entity headerSize prop
{ headerSize: 'full' }

// = Final merged config:
{
  name: 'banner',
  headerSize: 'full',        // From entity prop (highest priority)
  imgTmpAlignY: 'top',       // From base type
  gradientType: 'dark',      // From subcategory
  gradientDepth: 0.6,        // From project override
  contentAlignY: 'bottom'    // From entity formatOptions
}
```

## Banner vs Cover: The Critical Difference

**IMPORTANT**: Both `banner` and `cover` use `background-size: cover`.

The difference is **NOT** background-size - it's `background-position-y`:

| Type | background-position-y | Typical Height | Use Case |
|------|----------------------|----------------|----------|
| `banner` | `top` | medium (50vh) | Show top of image (landscapes, horizons) |
| `cover` | `center` | prominent (75vh) | Center image (portraits, centered subjects) |

```css
/* Banner: Image anchored to top */
.hero-banner {
  background-position-y: top;
  background-size: cover;  /* SAME as cover */
}

/* Cover: Image centered */
.hero-cover {
  background-position-y: center;
  background-size: cover;  /* SAME as banner */
}
```

## Image Instance System

Hero components use pre-generated image instances for optimal loading:

| Instance | Dimensions | Aspect Ratio | Use Case |
|----------|------------|--------------|----------|
| `hero_vertical` | 440×880 | 1:2 | Mobile portrait, columns |
| `hero_square` | 440×440 | 1:1 | Mobile landscape |
| `hero_wide` | 1100×620 | 16:9ish | Tablet landscape |
| `hero_wide_xl` | 1440×820 | 16:9ish | Desktop landscape |
| `hero_square_xl` | 1440×1280 | ~1:1 | Desktop tall headers |

### Instance Selection Logic

```javascript
function selectHeroInstance(heightTmp, viewportWidth, viewportHeight) {
  // Mobile (< 768px)
  if (viewportWidth < 768) {
    return heightTmp === 'full' || heightTmp === 'prominent'
      ? 'hero_vertical'    // Tall headers: vertical
      : 'hero_square'      // Short headers: square
  }
  
  // Tablet (768-1023px)
  if (viewportWidth < 1024) {
    return heightTmp === 'full' ? 'hero_square_xl' : 'hero_wide'
  }
  
  // Desktop (≥ 1024px)
  return heightTmp === 'full' ? 'hero_square_xl' : 'hero_wide_xl'
}
```

## Default Values

| Field | Default | Notes |
|-------|---------|-------|
| `header_type` | `'banner'` for posts, `'cover'` for events | Per entity type |
| `header_size` | `'medium'` for posts, `'prominent'` for events | Per entity type |
| `imgTmpAlignY` | `'top'` for banner, `'center'` for cover | Determined by type |
| `contentAlignY` | `'center'` | Vertical text alignment |
| `gradientType` | `null` | Optional overlay gradient |
