# Header System Analysis: Answers to Key Questions

**Date:** 2025-12-15  
**Context:** Follow-up to header_type/header_size investigation  
**Status:** Analysis Complete

---

## Your Questions Answered

### Q1: Are Odoo models aligned with Hero.vue + PageHeading.vue?

**Answer: YES - Strong alignment exists.**

| Aspect | Odoo Models | PageHeading.vue headerTypes[] | Match? |
|--------|-------------|-------------------------------|--------|
| header_type values | simple, columns, banner, cover, bauchbinde | ✅ All 5 defined | ✅ Perfect |
| header_size values | mini, medium, prominent, full | ✅ All 4 used as headerSize | ✅ Perfect |
| Default header_type | "simple" | headerTypes[0] = simple | ✅ Perfect |
| Default header_size | "mini" | simple.headerSize = 'mini' | ✅ Perfect |

**Where the confusion comes from:**

| Source | Status | Problem |
|--------|--------|---------|
| Odoo models | ✅ Clean | Reference implementation |
| PageHeading.vue | ✅ Clean | Implements Odoo mapping correctly |
| Hero.vue | ✅ Clean | Pure rendering component |
| PostgreSQL tables | ⚠️ Inconsistent | posts/pages missing header_size |
| EditPanel.vue | ❌ Broken | Wrong option values, disabled |
| EventPanel.vue | ❌ Hardcoded | Forces `header_type: 'cover'` |
| AddPostPanel.vue | 🔇 Silent | No header_type UI |

**Conclusion:** The core components ARE aligned. Issues are in the persistence layer (postgres) and editing UIs (panels).

---

### Q2: Inconsistencies between Odoo models and Hero.vue/PageHeading.vue?

**Answer: Minor inconsistencies exist but are architectural, not semantic.**

#### 2.1 Sizing Override Logic

| Odoo | PageHeading | Inconsistency |
|------|-------------|---------------|
| header_size is per-entity | Derives from headerType config | Entity override not used |
| Example: Event with header_size='full' | cover.headerSize='prominent' | Odoo value ignored |

**PageHeading.vue line 305-313:**
```javascript
// Merge order: defaultHeader → siteHeader → formatOptions
// BUT header_size prop is NOT in the merge chain!
const headerprops = computed(() => {
  const merged = Object.assign(
    {},
    defaultHeader.value,     // e.g., cover → prominent
    siteHeader.value,        // site overrides
    parsedFormatOptions.value // entity formatOptions
  )
  // props.headerSize is NEVER merged in!
})
```

**Gap:** If you save `header_size: 'full'` to an entity, PageHeading ignores it unless it's in `formatOptions` JSON.

#### 2.2 Image Sizing for "banner" Type

| Odoo Expectation | Hero.vue Reality |
|------------------|------------------|
| banner with center/top alignment | New image system forces `cover` sizing |

**Hero.vue line 456-461:**
```javascript
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) return true  // ← ALWAYS cover!
  // ... banner's center/top alignment never applied
})
```

#### 2.3 Missing: "columns" Layout Implementation

| Odoo Definition | Component Status |
|-----------------|------------------|
| `columns: 'Text-Bild (2 Spalten)'` | `showTextImage` computed exists but no `<TextImage>` in template |
| Should show 50/50 text+image | Falls through to simple header |

**PageHeading.vue line 325:**
```javascript
const showTextImage = computed(() =>
  headerprops.value.name === 'columns' && props.imgTmp  // Computed but never used!
)
```

---

### Q3: Leveraging PageHeading.vue's Configurable Approach

The `headerTypes[]` array is already a proto-sysreg pattern! Here's how to evolve it:

#### 3.1 Sysreg-like Approach

**Current State:**
```javascript
const headerTypes = [
  { id: 0, name: 'simple', headerSize: 'mini', imgTmpAlignX: 'center', ... },
  { id: 1, name: 'columns', headerSize: 'prominent', ... },
  // ... hardcoded in component
]
```

**Proposed Evolution:**

```typescript
// server/api/sysreg/header-configs.get.ts
export default defineEventHandler(async () => {
  const db = useDatabase()
  return await db.select().from(sysreg).where(eq(sysreg.tagfamily, 'header_config'))
})

// New sysreg entries
// tagfamily: 'header_config'
// name: 'cover', 'banner', etc.
// value: JSON with all the props (headerSize, imgTmpAlignX, etc.)
```

**Table Structure Option:**
```sql
CREATE TABLE header_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,  -- 'cover', 'banner', etc.
  description VARCHAR(200),
  header_size VARCHAR(20) DEFAULT 'mini',
  allowed_sizes VARCHAR[] DEFAULT '{}',
  is_full_width BOOLEAN DEFAULT FALSE,
  content_align_y VARCHAR(20) DEFAULT 'center',
  img_align_x VARCHAR(20) DEFAULT 'center',
  img_align_y VARCHAR(20) DEFAULT 'center',
  content_in_banner BOOLEAN DEFAULT FALSE,
  gradient_type VARCHAR(20) DEFAULT 'none',
  gradient_depth DECIMAL(3,2) DEFAULT 1.0,
  -- i18n labels
  label_de VARCHAR(100),
  label_en VARCHAR(100),
  sort_order INTEGER DEFAULT 0
);
```

#### 3.2 Admin Editor (SysregAdmin-style)

**Recommendation:** Add a "Header Configs" tab to SysregAdminView.vue

```vue
<!-- New tab in SysregAdminView.vue -->
{ id: 'headers', label: 'Header Configs', icon: '🖼️' }
```

**Editor Features:**
- Visual preview of each header type (mini preview)
- Drag-and-drop reorder
- WYSIWYG adjustment of:
  - Image alignment (clickable zones)
  - Content position (top/center/bottom)
  - Gradient toggles
  - Size presets

**Mock-up:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🖼️ Header Configs                          [+ Add Config]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐  cover                                         │
│ │ [IMG]   │  Cover Fullsize                                │
│ │  ____   │  Size: prominent | Gradient: left-bottom       │
│ └─────────┘  [Edit] [Preview] [Delete]                     │
│                                                             │
│ ┌─────────┐  banner                                        │
│ │[IMG    ]│  Banner medium                                 │
│ │         │  Size: medium | Gradient: left-bottom          │
│ └─────────┘  [Edit] [Preview] [Delete]                     │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3 Demo Pages Route (Debug Helper)

**Excellent idea!** A `/dev/header-demo` route for visual testing.

**Implementation:**

```vue
<!-- src/views/dev/HeaderDemoView.vue -->
<template>
  <div class="header-demo">
    <div class="controls">
      <select v-model="selectedType">
        <option v-for="t in headerTypes" :key="t.name" :value="t.name">
          {{ t.name }} - {{ t.description }}
        </option>
      </select>
      <select v-model="selectedSize">
        <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="testImageUrl" placeholder="Image URL" />
    </div>
    
    <div class="preview">
      <PageHeading
        :headerType="selectedType"
        :headerSize="selectedSize"
        :imgTmp="testImageUrl"
        :image_id="testImageId"
        heading="**Demo Headline** with subline"
        teaserText="This is teaser text for testing"
        :cta="{ title: 'CTA Button', link: '#' }"
      />
    </div>
    
    <div class="config-dump">
      <pre>{{ currentConfig }}</pre>
    </div>
  </div>
</template>
```

**Route:**
```javascript
// src/router/index.ts
{
  path: '/dev/header-demo',
  name: 'header-demo',
  component: () => import('@/views/dev/HeaderDemoView.vue'),
  meta: { requiresAuth: false, devOnly: true }
}
```

**Features:**
- All 5 header types in a grid
- Toggle between sizes
- Test with different images (Unsplash, Cloudinary, local)
- Show computed props in realtime
- Mobile/tablet/desktop viewport toggle

---

### Q4: Sister Component for Simple + Columns?

**Recommendation: YES - Create `TextImageHeader.vue`**

#### Rationale

| Option | Pros | Cons |
|--------|------|------|
| Add to Hero.vue | Single component | Hero already complex (749 lines) |
| **Create TextImageHeader.vue** | Clean separation, focused | Need to sync updates |
| Extend PageHeading | Keeps routing simple | Still need render component |

Hero.vue is the "full-bleed image with text overlay" paradigm.  
TextImageHeader.vue is the "side-by-side columns" paradigm.

These are fundamentally different layouts - a sister component is cleaner.

#### Implementation Plan

**1. Enable existing TextImage.vue:**

```bash
mv src/disabled/components/TextImage.vue src/components/TextImageHeader.vue
```

**2. Update to match Hero patterns:**

```vue
<!-- TextImageHeader.vue - Sister to Hero.vue -->
<template>
  <div class="text-image-header" :class="[
    `text-image-header-${heightTmp}`,
    `text-image-header-align-${contentAlignY}`,
    imagePosition === 'right' ? 'image-right' : 'image-left'
  ]">
    <!-- Hidden canvas for BlurHash -->
    <canvas ref="canvasRef" style="display: none;" />
    
    <div class="text-image-grid">
      <!-- Text Column -->
      <div class="text-column">
        <Container>
          <slot />
        </Container>
      </div>
      
      <!-- Image Column - Uses shape instances like Hero -->
      <div class="image-column">
        <div class="image-inner" :style="{
          backgroundImage: `url(${computedBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }"></div>
      </div>
    </div>
  </div>
</template>
```

**3. Add shape instance support (the 6-instance system):**

```typescript
// In TextImageHeader.vue - Use half_* instances for 50% width
const selectColumnsInstance = (viewport: Viewport): string => {
  const { width, height } = viewport
  
  // Mobile: Show square (stacked layout)
  if (width <= 767) return 'half_square'
  
  // Tablet: Square works well
  if (width <= 1024) return 'half_square'
  
  // Desktop: Use half_wide for landscape columns
  if (height > width * 0.8) return 'half_tall'  // Tall viewport
  return 'half_wide'
}
```

**4. Update selectHeroInstance.ts to include half_* instances:**

```typescript
// utils/selectHeroInstance.ts
export type HeroInstance =
  | 'hero_vertical'
  | 'hero_square'
  | 'hero_wide'
  | 'hero_wide_xl'
  | 'hero_square_xl'
  // NEW: Instances for 50%-width columns
  | 'half_square'
  | 'half_wide'
  | 'half_tall'
```

**5. Wire into PageHeading.vue:**

```vue
<!-- PageHeading.vue template update -->
<template>
  <div>
    <!-- Hero/Banner Header (cover, banner, bauchbinde) -->
    <Hero v-if="showHero" ... />

    <!-- NEW: Two-Column Header (columns type) -->
    <TextImageHeader 
      v-else-if="showTextImage"
      :heightTmp="headerprops.headerSize"
      :contentAlignY="headerprops.contentAlignY"
      :image_id="image_id"
      :image_xmlid="image_xmlid"
      :image_blur="image_blur"
      :imgTmp="imgTmp"
    >
      <HeadingParser :content="heading" is="h1" />
      <HeadingParser v-if="teaserText" :content="teaserText" is="h3" />
      <div v-if="showCta" class="cta-group">...</div>
    </TextImageHeader>

    <!-- Simple Header (no image) -->
    <Section v-else>...</Section>
  </div>
</template>
```

#### Sync Strategy (Hero → TextImageHeader)

Create a shared composable for common logic:

```typescript
// composables/useHeaderImage.ts
export function useHeaderImage(props: HeaderImageProps) {
  // Shared logic for:
  // - API-based image fetching (useImageFetch)
  // - BlurHash decoding
  // - Instance selection
  // - URL building (Unsplash, Cloudinary, local)
  
  return {
    effectiveImageData,
    currentShapeData,
    blurHashUrl,
    computedBackgroundImage,
    isLoading
  }
}
```

Both Hero.vue and TextImageHeader.vue use this composable, ensuring:
- Single source of truth for image logic
- Easy to update both when image system changes
- Consistent behavior

---

## Summary: Recommended Action Plan

### Immediate (This Sprint)

1. **✅ Migration 066** - Add header_size to posts/pages (already created)
2. **Enable EditPanel header_type dropdown** - Fix option values
3. **Create `/dev/header-demo` route** - Debug helper

### Short-Term (Next Sprint)

4. **Create TextImageHeader.vue** - Sister component for columns
5. **Extract useHeaderImage composable** - Share logic between Hero/TextImageHeader
6. **Fix PageHeading to use props.headerSize** - Entity-level override

### Medium-Term

7. **Move headerTypes to database** - Sysreg-like approach
8. **Add Header Configs tab to SysregAdmin** - Visual editor
9. **Implement half_* shape instances** - For columns 50%-width images

---

## Files Referenced

- [src/components/PageHeading.vue](../../src/components/PageHeading.vue) - Header orchestration
- [src/components/Hero.vue](../../src/components/Hero.vue) - Full-bleed image component
- [src/disabled/components/TextImage.vue](../../src/disabled/components/TextImage.vue) - Existing columns base
- [docs/odoo/entities/episodes.md](../../docs/odoo/entities/episodes.md) - Odoo model definition
- [src/views/admin/SysregAdminView.vue](../../src/views/admin/SysregAdminView.vue) - Admin UI pattern
