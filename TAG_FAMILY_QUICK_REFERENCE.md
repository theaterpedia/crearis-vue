# Quick Reference: Tag Family System

## Overview

The tag family system manages dtags, ttags, ctags, and rtags with a clean composable + component architecture.

## Components

### TagFamilyTile
Display single tag family (compact/zoomed views)

```vue
<TagFamilyTile
  family-name="dtags"
  :model-value="project.dtags"
  :show-edit-button="true"
  @edit="openEditor"
/>
```

### TagFamilies
Gallery managing multiple families with modal editor

```vue
<TagFamilies
  :values="{ dtags: 5, ttags: 12 }"
  :families="['dtags', 'ttags']"
  :editable="true"
  @update="(family, value) => update(family, value)"
/>
```

## Composables

### useTagFamily
Core composable for managing single tag family

```typescript
const family = useTagFamily({
  familyName: 'dtags',
  modelValue: ref(5),
  groupSelection: 'all'
})

// Access
family.groups.value         // All groups
family.activeGroups.value   // Groups with tags
family.isEmpty.value        // Boolean

// Operations
family.getGroupValue('spielform')
family.setGroupValue('spielform', 1)
family.clearGroup('spielform')
```

### useTagFamilyEditor
Editor with validation and dirty tracking

```typescript
const editor = useTagFamilyEditor({
  familyName: 'dtags',
  modelValue: ref(0)
})

// State
editor.editValue.value      // Separate edit state
editor.isDirty.value        // Has unsaved changes
editor.isValid.value        // Validation passed

// Category/Subcategory
editor.selectCategory('spielform', 1)
editor.selectSubcategory('spielform', 2)

// Operations
editor.save()
editor.cancel()
editor.reset()

// Validation
editor.getValidationErrors()
```

### useTagFamilyDisplay
Format for display (compact/zoomed)

```typescript
const display = useTagFamilyDisplay({
  familyName: 'dtags',
  modelValue: 5
})

// Formatted text
display.compactText.value   // "🎭 Freies Spiel"
display.zoomedText.value    // Full hierarchy

// Data
display.displayGroups.value // Groups with tags
display.hasActiveTags.value
display.activeGroupCount.value
```

## Tag Structure

### dtags (Didactic Model)
```
TagGroup 1: Spielform (bits 0-7) 🎭
  - freies_spiel (bit 0) → freies_spiel_exploration (bit 1)
  - rollenspiel (bit 2) → rollenspiel_charakterentwicklung (bit 3)
  - etc.

TagGroup 2: Animiertes Theaterspiel (bits 8-15) 🎪
  - musiktheater (bit 8) → musiktheater_gesang (bit 9)
  - tanztheater (bit 10) → tanztheater_choreographie (bit 11)
  - etc.

TagGroup 3: Szenische Themenarbeit (bits 16-25) 🎬
  - improvisation (bit 16) → improvisation_spontanitaet (bit 17)
  - biographisches (bit 18) → biographisches_lebensgeschichten (bit 19)
  - etc.

TagGroup 4: Pädagogische Regie (bits 26-31) 👥 [OPTIONAL]
  - klassisch (bit 26) → klassisch_produktionsorientiert (bit 27)
  - partizipativ (bit 28) → partizipativ_empowerment (bit 29)
  - systemisch (bit 30) → systemisch_beziehungsorientiert (bit 31)
```

## Bit Operations

```typescript
import { hasBit, setBit, clearBit, normalizeToInteger } from '@/composables/useSysregTags'

// Check bit
hasBit(5, 0)  // true (bit 0 set)
hasBit(5, 2)  // true (bit 2 set)
hasBit(5, 1)  // false (bit 1 not set)

// Set bit
const newValue = setBit(5, 1)  // 7 (bits 0,1,2)

// Clear bit
const cleared = clearBit(5, 2)  // 1 (bit 0 only)

// Convert hex to int (for SysregOption.value)
normalizeToInteger('\\x01')  // 1
```

## Category/Subcategory Pattern

**Rule:** Subcategories require parent category

```typescript
// ✅ Correct: Select category first
editor.selectCategory('spielform', 1)     // freies_spiel (bit 0)
editor.selectSubcategory('spielform', 2)  // exploration (bit 1)
// Result: bits 0 and 1 set (value = 3)

// ❌ Wrong: Subcategory without category
// This will fail validation
setGroupValue('spielform', 2)  // Only bit 1 set (invalid)
```

## Multi-select Configuration

**Default:** Single-select per group

```json
{
  "multiselect": false  // Default
}
```

**Enable multi-select:**

```json
{
  "name": "resources",
  "multiselect": true,
  "bits": [0, 1, 2, 3]
}
```

When enabled:
- Users can select multiple options in same group
- Bit operations use OR instead of replace
- Validation allows multiple selections

## Validation Rules

1. **Required groups:** Must have at least one tag
2. **Optional groups:** Can be empty (marked with "optional: true")
3. **Category + Subcategory:** Subcategory requires parent category
4. **Multi-select:** Respects group configuration

```typescript
// Check validation
if (!editor.isValid.value) {
  const errors = editor.getValidationErrors()
  console.log(errors)
  // ["Spielform is required", "Invalid selection in Szenische Themenarbeit"]
}
```

## Display Modes

### Compact
Shows categories only with icons

```
🎭 Freies Spiel • 🎪 Musiktheater • 🎬 Improvisation
```

### Zoomed
Full hierarchy with subcategories

```
🎭 Spielform
• Freies Spiel
  • Exploration

🎪 Animiertes Theaterspiel
• Musiktheater
  • Gesang
```

## Common Patterns

### Display project tags

```vue
<template>
  <TagFamilyTile
    family-name="dtags"
    :model-value="project.dtags"
    group-selection="core"
  />
</template>
```

### Edit tags

```vue
<template>
  <TagFamilyEditor
    family-name="dtags"
    :model-value="project.dtags"
    @save="updateProject"
    @cancel="closeModal"
  />
</template>

<script setup>
function updateProject(newValue) {
  project.value.dtags = newValue
  await saveToDatabase()
}
</script>
```

### Filter by group selection

```typescript
// Show only core (non-optional) groups
const display = useTagFamilyDisplay({
  familyName: 'dtags',
  modelValue: 5,
  groupSelection: 'core'  // or 'options' or 'all'
})
```

### Check if tag is set

```typescript
import { hasBit } from '@/composables/useSysregTags'

const hasFreiesSpiel = hasBit(project.dtags, 0)
const hasExploration = hasBit(project.dtags, 1)

if (hasFreiesSpiel && hasExploration) {
  console.log('Project uses Freies Spiel with Exploration')
}
```

## Troubleshooting

### Issue: "Subcategory without category" validation error

**Solution:** Select category first, then subcategory

```typescript
// Wrong order
editor.selectSubcategory('spielform', 2)  // ❌
editor.selectCategory('spielform', 1)

// Correct order
editor.selectCategory('spielform', 1)     // ✅
editor.selectSubcategory('spielform', 2)
```

### Issue: Tags not displaying

**Check:**
1. modelValue is not null/undefined
2. Bits are set correctly (use hasBit to verify)
3. groupSelection filter matches your groups

```typescript
// Debug
console.log('Value:', project.dtags)
console.log('Has bit 0:', hasBit(project.dtags, 0))
console.log('Groups:', display.displayGroups.value)
```

### Issue: Edit doesn't save

**Check:**
1. Validation passes (`editor.isValid.value`)
2. Changes exist (`editor.isDirty.value`)
3. Save button not disabled

```typescript
if (!editor.isValid.value) {
  console.log('Validation errors:', editor.getValidationErrors())
}
```

## Configuration Reference

### sysreg-bitgroups.json

```json
{
  "dtags": {
    "name": "didactic_model",
    "label": { "de": "...", "en": "...", "cz": "..." },
    "groups": [
      {
        "name": "group_name",
        "label": { "de": "...", "en": "..." },
        "bits": [0, 1, 2, ...],
        "multiselect": false,
        "optional": false,
        "icon": "🎭"
      }
    ]
  }
}
```

### Group Properties

- `name`: Internal identifier
- `label`: i18n labels
- `bits`: Array of bit positions (0-31)
- `multiselect`: Allow multiple selections
- `optional`: Can be empty
- `icon`: Emoji icon for display

## API Quick Reference

### Props Types

```typescript
type FamilyName = 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
type GroupSelection = 'all' | 'core' | 'options'
```

### Component Events

```typescript
// TagFamilyTile
emit('edit')
emit('zoom', isZoomed: boolean)

// TagFamilies
emit('update', family: FamilyName, value: number)

// TagFamilyEditor
emit('save', value: number)
emit('cancel')

// TagGroupEditor
emit('update:modelValue', value: number)
```

---

## See Also

- [MIGRATION_037_IMPLEMENTATION_COMPLETE.md](./MIGRATION_037_IMPLEMENTATION_COMPLETE.md) - Full implementation details
- [server/database/migrations/037_dtags_restructure.ts](./server/database/migrations/037_dtags_restructure.ts) - Database migration
- [src/config/sysreg-bitgroups.json](./src/config/sysreg-bitgroups.json) - Configuration file
