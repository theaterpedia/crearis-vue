# Core Components

## PageHeading.vue

The orchestrator component that decides which layout to render based on configuration.

### Location
`src/components/PageHeading.vue`

### Props

```typescript
interface PageHeadingProps {
  // Type & Size (from Odoo/database)
  headerType: 'simple' | 'columns' | 'cover' | 'banner' | 'bauchbinde'
  headerSize: 'mini' | 'medium' | 'prominent' | 'full'
  
  // Content
  heading: string           // Main heading (supports crearis-md)
  teaserText?: string       // Subheading (supports crearis-md)
  showLogoBanner?: boolean  // Show extended logo instead of text
  
  // Image (3 ways to provide)
  imgTmp?: string           // Legacy: direct URL
  image_id?: number | string // New: fetch from /api/images/:id
  image_xmlid?: string      // New: fetch from /api/images/xmlid/:xmlid
  image_blur?: string       // Pre-provided blur hash
  
  // CTAs
  cta?: { title: string; link: string }
  link?: { title: string; link: string }
  
  // Configuration
  formatOptions?: object | string  // JSON config overrides
  headerConfigs?: any[]            // Legacy site configs
}
```

### Display Logic

```javascript
// Hero is used for: banner, cover, bauchbinde (with image)
const showHero = computed(() => {
  const name = headerprops.value.name
  const hasImage = props.imgTmp || props.image_id || props.image_xmlid
  return name !== 'simple' && name !== 'columns' && hasImage
})

// TextImage is used for: columns (with image)
const showTextImage = computed(() =>
  headerprops.value.name === 'columns' &&
  (props.imgTmp || props.image_id || props.image_xmlid)
)

// Fallback: Section + Container for simple or no image
```

### Usage Example

```vue
<PageHeading
  :headerType="entity.header_type || 'banner'"
  :headerSize="entity.header_size || 'medium'"
  :heading="entity.name"
  :teaserText="entity.teaser"
  :image_id="entity.img_id"
  :image_blur="entity.img_square?.blur"
  :cta="{ title: 'Learn More', link: '/about' }"
/>
```

---

## Hero.vue

Full-width background image hero component with gradient overlays and content slots.

### Location
`src/components/Hero.vue`

### Props

```typescript
interface HeroProps {
  // Size
  heightTmp: 'mini' | 'medium' | 'prominent' | 'full'
  target?: 'page' | 'card'  // card = mini fixed size
  
  // Image (3 ways)
  imgTmp?: string                    // Legacy URL
  image_id?: number | string         // API fetch by id
  image_xmlid?: string               // API fetch by xmlid
  image_blur?: string                // Pre-provided blur hash
  image?: ImageApiResponse           // Pre-fetched image data
  
  // Image Positioning
  imgTmpAlignX: 'left' | 'right' | 'center' | 'stretch' | 'cover'
  imgTmpAlignY: 'top' | 'bottom' | 'center' | 'stretch' | 'cover'
  backgroundCorrection?: string      // CSS filter adjustments
  
  // Content Layout
  contentAlignY: 'top' | 'center' | 'bottom'
  contentWidth: 'short' | 'full'
  contentType: 'text' | 'banner' | 'left'
  
  // Overlays
  gradient_type?: 'light' | 'dark' | null
  gradient_depth?: number            // 0-1 opacity
  overlay?: string                   // CSS gradient string
  bottomline?: boolean               // Show bottom border
}
```

### Key Behaviors

1. **Image Instance Selection**
   - Automatically selects optimal instance based on viewport + heightTmp
   - Uses `selectHeroInstance()` utility

2. **BlurHash Placeholder**
   - Shows decoded blur hash while full image loads
   - Uses canvas-based decoding via `useBlurHash`

3. **Background Sizing**
   - Always uses `background-size: cover` when image present
   - `imgTmpAlignY` controls vertical position (banner=top, cover=center)

### CSS Height Classes

```css
.hero-full { height: 100vh; }
.hero-prominent { height: 75vh; }
.hero-medium { height: 50vh; }
.hero-mini { height: 25vh; }
```

---

## TextImageHeader.vue

Side-by-side two-column layout with text on left, image on right.

### Location
`src/components/TextImageHeader.vue`

### Props

```typescript
interface TextImageHeaderProps {
  headerSize: 'mini' | 'medium' | 'prominent' | 'full'
  imgTmp?: string                    // Legacy URL fallback
  imageData?: ImageApiResponse       // API-fetched image data
  contentAlignY: 'top' | 'center' | 'bottom'
}
```

### Layout Behavior

**Desktop (≥768px):**
```
┌──────────────────┬──────────────────┐
│                  │                  │
│   Text Content   │      Image       │
│   (slot)         │   (background)   │
│                  │                  │
└──────────────────┴──────────────────┘
      50%                 50%
```

**Mobile (<768px):**
```
┌────────────────────────────────────┐
│             Image                  │
│         (min-height: 40vh)         │
├────────────────────────────────────┤
│          Text Content              │
│            (slot)                  │
└────────────────────────────────────┘
```

### Instance Selection

TextImageHeader prefers vertical/square instances for the side column:

```javascript
const priority = [
  'hero_vertical',    // Best for tall column
  'hero_square',      
  'hero_square_xl',
  'hero_wide',        // Fallback
  'hero_wide_xl'
]
```

### Usage Example

```vue
<TextImageHeader
  :headerSize="entity.header_size"
  :imageData="columnImageData"
  :imgTmp="fallbackUrl"
  contentAlignY="center"
>
  <h1>{{ entity.name }}</h1>
  <p>{{ entity.teaser }}</p>
</TextImageHeader>
```

---

## Supporting Components

### Banner.vue
Wrapper component for styled content boxes within Hero.

### HeadingParser.vue
Parses crearis-md format: `"overline **headline** subline"`

```vue
<HeadingParser content="Welcome **to Crearis**" is="h1" />
<!-- Renders: <h1><span>Welcome</span> to Crearis</h1> -->
```

### Container.vue
Responsive max-width container for content.

---

## Component Decision Tree

```
PageHeading receives headerType + image

Is headerType 'simple'?
├─ YES → <Section><Container> (text only)
└─ NO → Has image?
         ├─ NO → <Section><Container> (text only)
         └─ YES → Is headerType 'columns'?
                   ├─ YES → <TextImageHeader>
                   └─ NO → <Hero>
                            (banner, cover, bauchbinde)
```
