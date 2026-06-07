# Image XMLID Template Implementation Report

**Date:** 2025-12-17  
**Status:** ✅ COMPLETED

---

## Summary

All image components have been updated to use the unified Odoo-aligned XMLID format with SlugEditor integration.

---

## Changes Made

### 1. cimgImport.vue ✅
**Purpose:** Modal for importing images via URL or local file upload

**Changes:**
- Imported `generateSlug`, `buildXmlid`, `ENTITY_TEMPLATES` from `@/utils/xmlid`
- Converted `xmlSubjectOptions` to computed property using `ENTITY_TEMPLATES.image`
- Updated xmlid generation to use `buildXmlid()`
- Removed obsolete `validateXmlid` function

**Before:**
```typescript
const entityType = xmlSubject.value ? `image_${xmlSubject.value}` : 'image'
const xmlid = `${domaincode}.${entityType}.${fileBasename}_${timestamp}`
// Result: theaterpedia.image_adult.photo_123456
```

**After:**
```typescript
const slug = generateSlug(fileBasename + '_' + timestamp)
const xmlid = buildXmlid({
    domaincode,
    entity: 'image',
    template: xmlSubject.value || undefined,
    slug
})
// Result: theaterpedia.image-adult__photo_123456
```

---

### 2. cimgImportStepper.vue ✅
**Purpose:** Project-specific image import stepper with drag-drop

**Changes:**
- Added imports for xmlid utilities
- Added `ImageItem` interface with `template` field
- Added `imageTemplateOptions` computed from `ENTITY_TEMPLATES.image`
- Added `selectedTemplate` ref for default template selection
- Updated `processFiles()` to use `generateSlug()` and `buildXmlid()`
- Added template selection dropdown UI in owner-selection-bar (two-column layout)

**Before:**
```typescript
const xmlid = `${props.projectId}.image-scene__${basename}_${timestamp}`
```

**After:**
```typescript
const template = selectedTemplate.value || undefined
const xmlid = buildXmlid({
    domaincode: props.projectId,
    entity: 'image',
    template,
    slug
})
```

**New UI:**
```vue
<div class="owner-selection-bar">
    <div class="selection-group">
        <label class="owner-label">Image Admin</label>
        <sysDropDown v-model="selectedOwnerId" ... />
    </div>
    <div class="selection-group">
        <label class="owner-label">Default Template</label>
        <sysDropDown v-model="selectedTemplate" :items="imageTemplateOptions" ... />
    </div>
</div>
```

---

### 3. ImagePreviewModal.vue ✅
**Purpose:** Modal for viewing and editing image details

**Changes:**
- Imported `SlugEditor` component and xmlid utilities (`parseXmlid`, `buildXmlid`)
- Added `slugData` ref for template/slug editing
- Added `domaincode` computed from image project
- Added `editedXmlid` computed to build full xmlid from slug data
- Updated `enterEditMode()` to parse existing xmlid with `parseXmlid()`
- Updated `hasChanges` computed to track slug changes
- Updated `saveChanges()` to use `editedXmlid.value`
- Replaced text input with `SlugEditor` component in template

**Before:**
```vue
<input v-model="editForm.xmlid" type="text" class="form-input" placeholder="Image identifier" />
```

**After:**
```vue
<SlugEditor 
    v-model="slugData" 
    :domaincode="domaincode" 
    entity="image" 
    :show-template="true"
    :show-generate="false" 
    :show-preview="true" 
    slug-label="Slug"
    slug-placeholder="mein_bildname" 
    template-label="Kategorie" 
    no-template-text="(keine)" 
/>
```

---

## New XMLID Format

```
{domaincode}.image__{slug}           # No template
{domaincode}.image-{template}__{slug} # With template
```

### Available Image Templates (from ENTITY_TEMPLATES)
| Template | Description |
|----------|-------------|
| `adult` | Adult portraits |
| `child` | Child portraits |
| `event` | Event photos |
| `instructor` | Instructor portraits |
| `scene` | Scene/activity shots |
| `location` | Location/facility photos |

---

## Files Updated

| File | Status | Update Type |
|------|--------|-------------|
| `src/components/images/cimgImport.vue` | ✅ Done | Format + templates |
| `src/components/images/cimgImportStepper.vue` | ✅ Done | Template selection + format |
| `src/components/images/ImagePreviewModal.vue` | ✅ Done | SlugEditor integration |
| `server/adapters/base-adapter.ts` | ✅ Done (prior) | Already updated |

---

## Related Files
- [src/utils/xmlid.ts](../../src/utils/xmlid.ts) - Core utilities (generateSlug, buildXmlid, parseXmlid)
- [src/components/SlugEditor.vue](../../src/components/SlugEditor.vue) - Reusable slug editor component

---

## Notes

### Template Options Alignment
- Removed old options (`mixed`, `teen`, `post`) not in ENTITY_TEMPLATES
- `mixed` maps to empty string (no template = `image__slug`)
- Could consider adding `teen`, `avatar`, `portrait` to ENTITY_TEMPLATES.image if needed

### Backward Compatibility
- `parseXmlid()` handles both old and new formats
- `parseLegacyXmlid()` specifically handles old format
- Migration script `069_xmlid_format_migration.ts` handles DB updates
