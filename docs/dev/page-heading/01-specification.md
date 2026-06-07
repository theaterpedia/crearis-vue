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
-- Central header configurations
CREATE TABLE header_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_type VARCHAR(50) NOT NULL,
    label_de VARCHAR(255),
    label_en VARCHAR(255),
    description TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    theme_id INTEGER,  -- Added by migration 068
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project-level overrides
CREATE TABLE header_project_overrides (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    header_config_name VARCHAR(100) REFERENCES header_configs(name),
    config_overrides JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Project Header Defaults (migration 068)

```sql
-- Added to projects table
ALTER TABLE projects ADD COLUMN site_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN site_header_size VARCHAR(20);
ALTER TABLE projects ADD COLUMN default_post_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN default_post_header_size VARCHAR(20);
ALTER TABLE projects ADD COLUMN default_event_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN default_event_header_size VARCHAR(20);
```

## Three-Layer Configuration Merge

Configuration is resolved in priority order:

```
1. Base Type (system defaults)
   └─ 2. Theme-Specific Config (if project has theme)
        └─ 3. Project Override (per-project tweaks)
             └─ 4. Entity-level fields (individual post/event)
```

### Example Merge Flow

```javascript
// Base Type: banner
{ name: 'banner', headerSize: 'medium', imgTmpAlignY: 'top' }

// + Theme-Specific (banner_theme2): Project uses theme 2
{ headerSize: 'prominent', gradientType: 'dark', gradientDepth: 0.4 }

// + Project Override: project-X has custom override
{ gradientDepth: 0.6 }

// + Entity fields: post.header_size = 'full'
{ headerSize: 'full' }

// = Final merged config:
{
  name: 'banner',
{
  name: 'banner',
  headerSize: 'full',        // From entity (highest priority)
  imgTmpAlignY: 'top',       // From base type
  gradientType: 'dark',      // From theme config
  gradientDepth: 0.6         // From project override
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
