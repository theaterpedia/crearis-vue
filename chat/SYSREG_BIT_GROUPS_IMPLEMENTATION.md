# Sysreg Bit Groups Implementation

## Overview
Implemented semantic naming system for sysreg bit groups with i18n support across all tag families.

## Implementation Date
2025-01-XX

## Components

### 1. Configuration File
**Location**: `src/config/sysreg-bitgroups.json`

Defines bit groups for all 6 tag families:

#### CTags (Content Tags)
- `age_group` (bits 0-1): Altersgruppen / Age Groups / Věkové skupiny
- `subject_type` (bits 2-3): Motivart / Subject Type / Typ motivu
- `access_level` (bits 4-5): Zugriffsebene / Access Level / Úroveň přístupu
- `quality` (bits 6-7): Qualität / Quality / Kvalita

#### DTags (Domain Tags)
- `settings` (bits 0-3): Raum-/Arbeitsformen / Settings/Work Forms / Prostředí/Pracovní formy
- `domains` (bits 4-7): Fachbereiche / Subject Domains / Oborové domény

#### TTags (Topic Tags)
- `core_themes` (bits 0-3): Kernthemen / Core Themes / Hlavní témata
- `extended_themes` (bits 4-7): Weitere Themen / Extended Themes / Rozšířená témata

#### RTags (Reference Tags)
- `flags` (bits 0-3): Status-Markierungen / Status Flags / Stavové příznaky

#### Config
- `visibility` (bits 0-1): Sichtbarkeit / Visibility / Viditelnost
- `features` (bits 2-7): Funktionen / Features / Funkce

### 2. Composable
**Location**: `src/composables/useSysregBitGroups.ts`

Provides functions to access bit group metadata:

```typescript
const {
    getBitGroupsForFamily,      // Get all groups for a family
    getBitGroupLabel,           // Get translated label
    getBitGroupDescription,     // Get translated description
    findBitGroupForBit,         // Find group containing a bit
    getBitGroupRange,           // Get "Bits X-Y" string
    getBitGroupsWithLabels,     // Get groups with computed labels
    getLabelByBitRange,         // Get label from "Bits 0-3" string
    getAllGroupsFlat            // Debug: all groups with family context
} = useSysregBitGroups()
```

#### Language Fallback Chain
1. Requested language (from i18n)
2. German (de) - default
3. English (en) - fallback
4. Internal name - last resort

### 3. Updated Components

#### SysregBitGroupSelect
**Location**: `src/components/sysreg/SysregBitGroupSelect.vue`

- Now uses `getBitGroupLabel()` for automatic semantic labels
- Falls back to provided props if available
- Shows bit group description or range as hint

**Usage**:
```vue
<!-- Automatic label and hint from config -->
<SysregBitGroupSelect v-model="selected" bit-group="age_group" />

<!-- Override with custom label -->
<SysregBitGroupSelect v-model="selected" bit-group="age_group" label="Custom Label" />
```

#### SysregAdminView
**Location**: `src/views/admin/SysregAdminView.vue`

- Bit Group filter now shows semantic names instead of "Bits 0-3"
- Uses `getBitGroupsWithLabels()` for available groups
- Shows description as tooltip on filter options

#### SysregDemo
**Location**: `src/views/admin/SysregDemo.vue`

- Added new section "Bit Group Configuration System"
- Shows all bit groups for all families
- Displays labels, bit ranges, and descriptions
- Updated CTags section to use semantic labels

## Features

### Internationalization
All bit group labels support German, English, and Czech:
- Labels: `{ de: "...", en: "...", cz: "..." }`
- Descriptions: Optional, language-specific explanations

### Automatic Resolution
Components automatically resolve the current language and display appropriate labels without manual configuration.

### Type Safety
TypeScript interfaces ensure correct usage:
```typescript
type TagFamily = 'status' | 'config' | 'rtags' | 'ctags' | 'ttags' | 'dtags'

interface BitGroupConfig {
    name: string
    label: Record<string, string>
    bits: number[]
    description?: Record<string, string>
}
```

## Benefits

1. **Semantic UI**: Shows meaningful names instead of technical "Bits 0-3"
2. **Maintainability**: Centralized configuration in JSON
3. **i18n Support**: Multi-language labels without code changes
4. **Flexibility**: Easy to add new bit groups or languages
5. **Consistency**: Same labels across all components
6. **Documentation**: Self-documenting through configuration

## Usage Examples

### Get Translated Label
```typescript
const { getBitGroupLabel } = useSysregBitGroups()
const label = getBitGroupLabel('dtags', 'settings')  // "Raum-/Arbeitsformen" (in German)
```

### Get All Groups for Family
```typescript
const { getBitGroupsForFamily } = useSysregBitGroups()
const groups = getBitGroupsForFamily('ctags')
// Returns: [age_group, subject_type, access_level, quality]
```

### Find Which Group Contains Bit
```typescript
const { findBitGroupForBit } = useSysregBitGroups()
const group = findBitGroupForBit('dtags', 2)  // Returns "settings" (bits 0-3)
```

### Display Bit Groups in UI
```typescript
const { getBitGroupsWithLabels } = useSysregBitGroups()
const groupsRef = getBitGroupsWithLabels('dtags')

// In template:
// <div v-for="group in groupsRef.value">
//   <h4>{{ group.label }}</h4>
//   <span>{{ group.bitRange }}</span>
// </div>
```

## Testing

1. Navigate to `/admin/sysreg-demo` to see bit groups in action
2. Check the "Bit Group Configuration System" section
3. Verify labels appear in current language
4. Test bit group filters in `/admin/sysreg`

## Future Enhancements

1. **Variable-Width Groups**: Support groups with different bit counts
2. **Overlapping Groups**: Allow bits to belong to multiple groups
3. **Auto-Generation**: Generate TypeScript types from JSON config
4. **Validation**: Runtime validation of bit group configurations
5. **Visual Editor**: UI for managing bit group configurations
6. **Bit Group Composition**: Hierarchical or composite bit groups

## Related Files

- Configuration: `src/config/sysreg-bitgroups.json`
- Composable: `src/composables/useSysregBitGroups.ts`
- Components:
  - `src/components/sysreg/SysregBitGroupSelect.vue`
  - `src/views/admin/SysregAdminView.vue`
  - `src/views/admin/SysregDemo.vue`
- Documentation: This file

## Notes

- Bit groups are 0-indexed (bit 0 is the rightmost/least significant bit)
- Each byte can have up to 8 bits (0-7)
- Groups don't have to be contiguous or of equal size
- The system works with BYTEA hex values from PostgreSQL

## Migration Guide

If you have existing code that uses technical bit references:

### Before
```vue
<label>Bits 0-3</label>
<SysregBitGroupSelect bit-group="age_group" label="Bits 0-1" />
```

### After
```vue
<!-- Automatic semantic label -->
<SysregBitGroupSelect bit-group="age_group" />

<!-- Or with getBitGroupLabel -->
<label>{{ getBitGroupLabel('ctags', 'age_group') }}</label>
```
