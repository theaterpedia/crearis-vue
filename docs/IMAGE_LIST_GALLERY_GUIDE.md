# Image List & Gallery Component Guide

## Overview

This guide explains how to use the new `pListImages` and `pGalleryImages` components to display filtered images in page layouts.

## Components

### pListImages.vue
Displays images in a list format with project and tag filtering.

**Location:** `src/components/page/pListImages.vue`

**Props:**
- `projectId` (number, required) - Filter images by project ID
- `visibility` (string, optional) - Filter by visibility: 'public' | 'internal' | 'private'
- `ctags` (string, optional) - Filter by config tags (hex value, AND logic)
- `rtags` (string, optional) - Filter by rights/resource tags (hex value, AND logic)
- `size` (string, optional) - Display size: 'small' | 'medium'
- `variant` (string, optional) - Display variant: 'default' | 'square' | 'wide' | 'vertical'
- `anatomy` (string, optional) - Layout anatomy: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false

### pGalleryImages.vue
Displays images in a gallery/grid format with project and tag filtering.

**Location:** `src/components/page/pGalleryImages.vue`

**Props:** Same as pListImages, plus:
- `itemType` (string, optional) - Display type: 'card' | 'row'

## Database Schema

### Images Table Fields
- `project_id` (INTEGER) - Links image to project
- `is_public` (BOOLEAN) - Public visibility flag
- `is_private` (BOOLEAN) - Private visibility flag
- `is_internal` (BOOLEAN) - Internal visibility flag
- `ctags` (BYTEA) - Config tags (age_group, subject_type, access_level, quality)
- `rtags` (BYTEA) - Rights/resource tags

### CTags Bit Groups
- **Bits 0-1:** age_group (0=Andere, 1=Kind, 2=Teens, 3=Erwachsen)
- **Bits 2-3:** subject_type (0=Andere, 1=Location, 2=Person, 3=Gruppe/Portrait)
- **Bits 4-5:** access_level
- **Bits 6-7:** quality

## API Endpoints

### GET /api/images
Fetches images with query parameters:

**Query Parameters:**
- `project_id` - Filter by project ID
- `visibility` - Filter by visibility: 'public' | 'internal' | 'private'
- `ctags` - Hex value for config tag filtering (e.g., '0x01' for age_group=Kind)
- `rtags` - Hex value for rights tag filtering

**Example:**
```
GET /api/images?project_id=5&visibility=public&ctags=0x01
```

## Integration in PageLayout

### Step 1: Update Page Options

The components are automatically rendered when `asideOptions.list.type` or `footerOptions.gallery.type` is set to `'images'`.

**Example in ProjectSite.vue:**
```vue
<PageLayout 
  :asideOptions="asideOptions" 
  :footerOptions="footerOptions"
  :projectDomaincode="project.domaincode"
  :projectId="project.id"
  :navItems="navigationItems">
```

**Example in PostPage.vue:**
```vue
<PageLayout 
  :asideOptions="asideOptions" 
  :footerOptions="footerOptions" 
  :projectId="projectId"
  :navItems="navigationItems">
```

### Step 2: Configure Database Options

Set the `aside_list` or `footer_gallery` fields in the database:

**Aside List (Images):**
```sql
UPDATE projects 
SET aside_list = 'images' 
WHERE id = 5;
```

**Footer Gallery (Images):**
```sql
UPDATE projects 
SET footer_gallery = 'images' 
WHERE id = 5;
```

## Usage Examples

### Example 1: Display Public Images for Kids

**Scenario:** Show all public images tagged for children (age_group=1) in the aside

**Database Setup:**
```sql
-- Set aside to display images
UPDATE projects SET aside_list = 'images' WHERE domaincode = 'kindertheater';

-- Tag images appropriately
UPDATE images 
SET ctags = E'\\x01'::bytea,  -- age_group=1 (Kind)
    is_public = TRUE
WHERE project_id = 5;
```

**Result:** PageLayout automatically displays filtered images in aside section

### Example 2: Display Location Photos in Footer Gallery

**Scenario:** Show all images tagged as locations (subject_type=1) in footer gallery

**Database Setup:**
```sql
-- Set footer gallery to display images
UPDATE projects SET footer_gallery = 'images' WHERE domaincode = 'stadttheater';

-- Tag images as locations
UPDATE images 
SET ctags = E'\\x04'::bytea,  -- subject_type=1 (Location, shifted to bits 2-3)
    is_public = TRUE
WHERE project_id = 8;
```

**Result:** PageLayout automatically displays location images in footer

### Example 3: Manual Component Usage (Custom Slots)

If you need more control, use components directly in slots:

**In ProjectSite.vue:**
```vue
<PageLayout :projectId="project.id">
  <!-- Custom aside slot -->
  <template #aside>
    <pListImages 
      :projectId="project.id"
      visibility="public"
      ctags="0x01"
      size="small"
      variant="square" />
  </template>
  
  <!-- Main content -->
  <Section>...</Section>
  
  <!-- Custom footer content -->
  <template #footer>
    <pGalleryImages
      :projectId="project.id"
      visibility="public"
      ctags="0x04"
      variant="wide"
      :itemType="'card'" />
  </template>
</PageLayout>
```

## CTags Hex Value Reference

### Age Group (Bits 0-1)
- `0x01` - Kind (Child)
- `0x02` - Teens (Teenager)
- `0x03` - Erwachsen (Adult)

### Subject Type (Bits 2-3, shifted)
- `0x04` - Location (0x01 << 2)
- `0x08` - Person (0x02 << 2)
- `0x0C` - Gruppe/Portrait (0x03 << 2)

### Combined Examples
- `0x05` - Kind + Location (0x01 | 0x04)
- `0x09` - Kind + Person (0x01 | 0x08)
- `0x06` - Teens + Location (0x02 | 0x04)

## Filtering Logic

### Visibility Filter
- `visibility='public'` → Only shows images where `is_public = TRUE`
- `visibility='private'` → Only shows images where `is_private = TRUE`
- `visibility='internal'` → Only shows images where `is_internal = TRUE`
- No visibility param → Shows all images regardless of visibility

### Tag Filter (AND Logic)
All specified tag bits must match:
```sql
-- Example: ctags=0x05 (Kind + Location)
WHERE (get_byte(i.ctags, 0) & x'05'::int) = x'05'::int
```

This ensures images have BOTH age_group=Kind AND subject_type=Location.

## Troubleshooting

### Images Not Showing

1. **Check project_id is passed:**
   ```vue
   <PageLayout :projectId="project.id">
   ```

2. **Verify database configuration:**
   ```sql
   SELECT aside_list, footer_gallery FROM projects WHERE id = 5;
   ```

3. **Check images exist:**
   ```sql
   SELECT * FROM images WHERE project_id = 5 AND is_public = TRUE;
   ```

4. **Verify API response:**
   ```
   GET /api/images?project_id=5
   ```

### Wrong Images Showing

1. **Check tag values:**
   ```sql
   SELECT id, name, ctags, rtags FROM images WHERE project_id = 5;
   ```

2. **Verify hex values:**
   - Use `\x` prefix in SQL: `E'\\x01'::bytea`
   - Use `0x` prefix in API: `?ctags=0x01`

3. **Test filtering logic:**
   ```sql
   -- Test if tag bits match
   SELECT id, name, ctags, 
          (get_byte(ctags, 0) & x'01'::int) = x'01'::int AS matches_kind
   FROM images 
   WHERE project_id = 5;
   ```

## Advanced Configuration

### Custom Filter Combinations

For complex filtering, extend the components with computed props:

```vue
<script setup lang="ts">
const filterCtags = computed(() => {
  // Combine age_group=Teens (0x02) + subject_type=Person (0x08)
  return '0x0A'  // 0x02 | 0x08 = 0x0A
})

const filterRtags = computed(() => {
  // Add your rtags logic here
  return undefined
})
</script>

<template>
  <pListImages 
    :projectId="projectId"
    :ctags="filterCtags"
    :rtags="filterRtags" />
</template>
```

### Dynamic Visibility

Toggle visibility based on user role:

```vue
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const imageVisibility = computed(() => {
  if (user.value?.role === 'admin') return undefined  // Show all
  if (user.value) return 'internal'  // Logged in users see internal
  return 'public'  // Public users see only public
})
</script>

<template>
  <pGalleryImages 
    :projectId="projectId"
    :visibility="imageVisibility" />
</template>
```

## Best Practices

1. **Always pass projectId** - Without it, images won't be filtered
2. **Use visibility filters** - Protect private/internal images
3. **Tag consistently** - Use same tag values across project
4. **Test filters** - Verify tag combinations return expected results
5. **Document tag meanings** - Keep track of what tag values represent
6. **Use database defaults** - Set aside_list/footer_gallery in projects table
7. **Prefer server filtering** - Let API do the work, not client-side

## Migration Checklist

When adding image lists/galleries to existing pages:

- [ ] Update PageLayout to pass `:projectId="project.id"`
- [ ] Set `aside_list='images'` or `footer_gallery='images'` in database
- [ ] Tag images with appropriate ctags/rtags values
- [ ] Set visibility flags on images (is_public, is_private, is_internal)
- [ ] Test image display with different filter combinations
- [ ] Verify modal preview functionality works
- [ ] Check responsive layout on mobile devices
- [ ] Document tag values used for this project
