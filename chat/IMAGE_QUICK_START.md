# Quick Start: Image Lists & Galleries

## Enable Image Display in 3 Steps

### Step 1: Update PageLayout Component

Ensure your page passes `projectId` to PageLayout:

```vue
<!-- PostPage.vue or ProjectSite.vue -->
<PageLayout 
  :projectId="projectId"  <!-- Must be a number -->
  :asideOptions="asideOptions" 
  :footerOptions="footerOptions">
  <!-- content -->
</PageLayout>
```

### Step 2: Configure Database

Set aside or footer to display images:

```sql
-- Aside List (sidebar)
UPDATE projects SET aside_list = 'images' WHERE domaincode = 'your-project';

-- Footer Gallery
UPDATE projects SET footer_gallery = 'images' WHERE domaincode = 'your-project';
```

### Step 3: Tag Your Images

Tag images with appropriate ctags:

```sql
-- Kids images (age_group=1)
UPDATE images SET ctags = E'\\x01'::bytea WHERE id IN (1, 2, 3);

-- Location images (subject_type=1, bits 2-3)
UPDATE images SET ctags = E'\\x04'::bytea WHERE id IN (4, 5, 6);

-- Teens + Person (age_group=2 + subject_type=2)
UPDATE images SET ctags = E'\\x0A'::bytea WHERE id IN (7, 8, 9);
```

## CTags Quick Reference

### Age Group (Bits 0-1)
| Label | Hex Value | Binary | SQL |
|-------|-----------|--------|-----|
| Kind | `0x01` | `00000001` | `E'\\x01'::bytea` |
| Teens | `0x02` | `00000010` | `E'\\x02'::bytea` |
| Erwachsen | `0x03` | `00000011` | `E'\\x03'::bytea` |

### Subject Type (Bits 2-3)
| Label | Hex Value | Binary | SQL |
|-------|-----------|--------|-----|
| Location | `0x04` | `00000100` | `E'\\x04'::bytea` |
| Person | `0x08` | `00001000` | `E'\\x08'::bytea` |
| Gruppe | `0x0C` | `00001100` | `E'\\x0C'::bytea` |

### Combined Tags
| Description | Hex Value | SQL |
|-------------|-----------|-----|
| Kind + Location | `0x05` | `E'\\x05'::bytea` |
| Teens + Person | `0x0A` | `E'\\x0A'::bytea` |
| Erwachsen + Gruppe | `0x0F` | `E'\\x0F'::bytea` |

## Using NavigationConfigPanel

Access the panel from ProjectSite:
1. Click the ⚙️ config button in navigation
2. Scroll to "Bilder-Listen Beispiele"
3. Click "Anwenden" on an example

**Example 1: Kinder-Bilder**
- Sets `aside_list = 'images'`
- Displays public kids images in sidebar
- Requires images tagged with `ctags=0x01`

**Example 2: Orts-Galerie**
- Sets `footer_gallery = 'images'`
- Displays location photos in footer
- Requires images tagged with `ctags=0x04`

## Testing Your Setup

### 1. Check Database
```sql
-- Verify project config
SELECT id, domaincode, aside_list, footer_gallery FROM projects WHERE domaincode = 'your-project';

-- Check images
SELECT id, name, project_id, ctags, is_public FROM images WHERE project_id = 5;
```

### 2. Test API
```bash
# All images for project
curl "http://localhost:5173/api/images?project_id=5"

# Public kids images
curl "http://localhost:5173/api/images?project_id=5&visibility=public&ctags=0x01"

# Location images
curl "http://localhost:5173/api/images?project_id=5&ctags=0x04"
```

### 3. Check Browser
1. Navigate to your project page
2. Check browser console for errors
3. Inspect network tab for API calls
4. Verify images appear in aside/footer

## Common Issues

### "Images not showing"
- ✅ Check `projectId` is passed to PageLayout
- ✅ Verify `aside_list` or `footer_gallery` is set to `'images'`
- ✅ Ensure images exist with matching `project_id`
- ✅ Check `is_public = TRUE` if using visibility filter

### "Wrong images showing"
- ✅ Verify ctags values in database
- ✅ Test API filtering: `/api/images?project_id=5&ctags=0x01`
- ✅ Check hex values are correct (0x01 vs 0x04)

### "API returns empty array"
- ✅ Confirm images have `project_id` set
- ✅ Check visibility flags match filter
- ✅ Verify tag values use bitwise AND logic

## Advanced: Custom Components

For more control, use components directly:

```vue
<script setup lang="ts">
import pListImages from '@/components/page/pListImages.vue'

const projectId = ref(5)
</script>

<template>
  <Section>
    <!-- Custom image list with specific filters -->
    <pListImages 
      :projectId="projectId"
      visibility="public"
      ctags="0x01"
      size="small"
      variant="square" />
  </Section>
</template>
```

## File Locations

- **Components:** `src/components/page/pListImages.vue`, `pGalleryImages.vue`
- **API:** `server/api/images/index.get.ts`
- **Types:** `src/composables/usePageOptions.ts`
- **Full Guide:** `docs/IMAGE_LIST_GALLERY_GUIDE.md`

## Next Steps

1. ✅ Enable in NavigationConfigPanel
2. ✅ Tag your images with appropriate ctags
3. ✅ Test filtering with API calls
4. ✅ Customize display options (size, variant)
5. ✅ Add more tag combinations as needed
