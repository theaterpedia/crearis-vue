# formatOptions System (Alpha)

> ⚠️ **ALPHA STATUS**: The formatOptions system is partially implemented. Some features documented here may not be fully functional or may change in future releases.

## Overview

The `formatOptions` system allows per-entity customization of header behavior beyond the standard `header_type` and `header_size` fields. It's stored as a JSONB column on entity tables.

## Database Schema

```sql
-- Posts, Events, Pages tables
format_options JSONB DEFAULT '{}'::jsonb
```

## Available Options

### Content Positioning

| Option | Type | Values | Default | Description |
|--------|------|--------|---------|-------------|
| `contentAlignY` | string | `'top'`, `'center'`, `'bottom'` | `'center'` | Vertical alignment of text content |
| `contentWidth` | string | `'short'`, `'full'` | `'short'` | Width of content container |
| `contentType` | string | `'text'`, `'banner'`, `'left'` | `'text'` | Content layout style |
| `contentInBanner` | boolean | `true`, `false` | `false` | Wrap content in Banner component |

### Image Behavior

| Option | Type | Values | Default | Description |
|--------|------|--------|---------|-------------|
| `imgTmpAlignX` | string | `'left'`, `'right'`, `'center'`, `'stretch'`, `'cover'` | `'center'` | Horizontal background position |
| `imgTmpAlignY` | string | `'top'`, `'bottom'`, `'center'`, `'stretch'`, `'cover'` | type-dependent | Vertical background position |
| `backgroundCorrection` | string | CSS filter value | `null` | CSS filter for image adjustment |

### Overlay & Gradient

| Option | Type | Values | Default | Description |
|--------|------|--------|---------|-------------|
| `gradientType` | string | `'light'`, `'dark'`, `null` | `null` | Gradient overlay color theme |
| `gradientDepth` | number | `0` - `1` | `0.4` | Gradient opacity |

### Layout Flags

| Option | Type | Values | Default | Description |
|--------|------|--------|---------|-------------|
| `isFullWidth` | boolean | `true`, `false` | `false` | Use full-width styling |
| `phoneBanner` | boolean | `true`, `false` | `false` | Show banner styling on mobile |
| `bottomline` | boolean | `true`, `false` | `false` | Show bottom border line |

### Header Subtype (Advanced)

| Option | Type | Description |
|--------|------|-------------|
| `headerSubtype` | string | Name of subcategory for config lookup |

## Usage in Entities

### Setting formatOptions

**Via SQL:**
```sql
UPDATE posts 
SET format_options = '{"gradientType": "dark", "gradientDepth": 0.6}'::jsonb
WHERE id = 123;
```

**Via API:**
```javascript
await fetch('/api/posts/123', {
  method: 'PATCH',
  body: JSON.stringify({
    format_options: {
      gradientType: 'dark',
      gradientDepth: 0.6,
      contentAlignY: 'bottom'
    }
  })
})
```

### Reading formatOptions in Views

```vue
<template>
  <PageHeading
    :headerType="entity.header_type"
    :headerSize="entity.header_size"
    :formatOptions="entity.format_options"
    :heading="entity.name"
    :image_id="entity.img_id"
  />
</template>
```

## Configuration Merge Priority

When multiple sources provide configuration:

```
1. Base Type defaults (from header_base_types table)
   ↓
2. Subcategory overrides (if headerSubtype specified)
   ↓
3. Project overrides (if on /sites/:project route)
   ↓
4. Entity formatOptions (this field)
   ↓
5. Entity headerSize prop (highest priority)
```

## Examples

### Dark Gradient with Bottom-Aligned Text

```json
{
  "gradientType": "dark",
  "gradientDepth": 0.5,
  "contentAlignY": "bottom"
}
```

### Full-Width Content with Light Overlay

```json
{
  "isFullWidth": true,
  "contentWidth": "full",
  "gradientType": "light",
  "gradientDepth": 0.3
}
```

### Top-Anchored Image (Banner Style)

```json
{
  "imgTmpAlignY": "top",
  "contentAlignY": "bottom"
}
```

### Using a Subcategory

```json
{
  "headerSubtype": "banner_event"
}
```

This will lookup and merge configuration from the `banner_event` subcategory.

## Alpha Limitations

### Not Yet Implemented

1. **UI Editor for formatOptions**
   - Currently requires manual JSON editing
   - Planned: Visual editor in EditPanel

2. **Subcategory Selection UI**
   - headerSubtype must be set manually
   - Planned: Dropdown in EditPanel

3. **Live Preview**
   - Changes require page reload to see
   - Planned: Real-time preview in editor

4. **Validation**
   - No schema validation on formatOptions
   - Invalid values may cause undefined behavior

### Known Issues

1. **Inheritance Gaps**
   - Some formatOptions may not properly inherit from subcategories
   - Workaround: Set all needed options at entity level

2. **Mobile Override**
   - `phoneBanner` behavior inconsistent
   - Workaround: Test thoroughly on mobile

3. **Gradient Depth**
   - Values outside 0-1 range not clamped
   - Workaround: Always use 0-1 range

## Future Roadmap

### Phase 1: Validation
- Add JSON Schema validation for formatOptions
- Provide helpful error messages for invalid values

### Phase 2: UI Integration
- Add formatOptions editor to EditPanel
- Visual controls for common options (sliders, toggles)

### Phase 3: Subcategory System
- Full subcategory management UI
- Project-level override management
- Inheritance visualization

### Phase 4: Live Preview
- Real-time preview of formatOptions changes
- Side-by-side comparison view

## Debug Tips

### Inspect Resolved Config

Add this to your view component:

```vue
<script setup>
const { resolvedConfig, isLoading } = useHeaderConfig({
  headerType: computed(() => entity.header_type),
  headerSubtype: computed(() => entity.format_options?.headerSubtype),
  useApi: true
})

// Debug: Log resolved configuration
watch(resolvedConfig, (config) => {
  console.log('[HeaderConfig] Resolved:', config)
}, { immediate: true })
</script>
```

### Check formatOptions in DB

```sql
SELECT id, name, header_type, header_size, format_options
FROM posts
WHERE format_options != '{}'::jsonb
LIMIT 10;
```

### Test Configuration Merge

```javascript
// In browser console on a page view
const pageHeading = document.querySelector('...')  // Find component
console.log(pageHeading.__vueParentComponent.ctx.headerprops)
```
