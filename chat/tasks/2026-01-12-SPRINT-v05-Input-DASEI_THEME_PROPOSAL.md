# DASEI Theme Proposal

## Overview

This document proposes adding a second internal theme called "DASEI" alongside the existing "Opus" theme for the internal dashboard context.

## Current State: Opus Theme

The existing internal theme system uses:
- `data-context="internal"` attribute on `<html>`
- Optional `data-internal-variant="warm|cool"` for color variations
- CSS variables defined in `05-internal-theme.css`
- Minimal design with medium rounded corners
- Uses oklch color system

## Hans adds in these things
### questions
We added the 'dasei'-theme on 2025-12-10. It was supposed to be used as internal_theme. Is it enabled? If yes: which are the questions, issues, ambiguities that might need refactoring? You added 3 variants 'warm', 'cold' ... to internal as well - they are variants on the 'opus'-theme right? Could they be applied to the 'dasei' internal theme as well? Or are they 'internal themes' on their own?

### tasks
Add a 3-states-toggle opus|dasei|theme for the internal theme to the user-dashboard, add a field 'settings' (jsonb) to table users and add a key 'theme_internal', make auth and useTheme read from it. If I understood well yesterday 


## DASEI Theme Concept

Based on the InitialPrompt specification:

### Design Principles
1. **Horizontal Divider/Line**: Medium-size horizontal divider that separates header from body
2. **No Rounded Corners**: Sharp edges throughout (`border-radius: 0`)
3. **Different Spacing Model**: Due to the horizontal separator, uses different margins/paddings

### Visual Characteristics
- Clear header/body separation with visible divider line
- Flat, angular aesthetic (no border-radius)
- More structured, formal appearance
- Potentially wider section spacing to accommodate separators

## Implementation Proposal

### Option A: Theme Attribute (Recommended)

Add a new attribute `data-internal-theme`:
```html
<html data-context="internal" data-internal-theme="opus">  <!-- default -->
<html data-context="internal" data-internal-theme="dasei"> <!-- DASEI -->
```

This keeps the color variants (`warm`, `cool`) applicable to both themes.

### CSS Structure

Create new file `06-internal-dasei.css`:

```css
/**
 * DASEI Internal Theme
 * 
 * Alternative to Opus with:
 * - No rounded corners
 * - Prominent horizontal dividers
 * - Adjusted spacing model
 */

/* Apply when DASEI theme is active */
:root[data-context="internal"][data-internal-theme="dasei"] {
    /* Override border-radius to 0 */
    --radius-sm: 0;
    --radius-md: 0;
    --radius-lg: 0;
    --radius-xl: 0;
    --radius-full: 0;
    
    /* Divider styling */
    --dasei-divider-width: 2px;
    --dasei-divider-color: var(--color-border);
    --dasei-divider-spacing: var(--spacing-md);
    
    /* Adjusted section spacing for dividers */
    --section-gap: calc(var(--spacing-lg) + var(--dasei-divider-spacing));
}

/* Header-body divider pattern */
:root[data-context="internal"][data-internal-theme="dasei"] .section-header,
:root[data-context="internal"][data-internal-theme="dasei"] .card-header,
:root[data-context="internal"][data-internal-theme="dasei"] .panel-header {
    border-bottom: var(--dasei-divider-width) solid var(--dasei-divider-color);
    padding-bottom: var(--dasei-divider-spacing);
    margin-bottom: var(--dasei-divider-spacing);
}

/* Remove rounded corners from cards */
:root[data-context="internal"][data-internal-theme="dasei"] .card,
:root[data-context="internal"][data-internal-theme="dasei"] .panel,
:root[data-context="internal"][data-internal-theme="dasei"] .settings-section {
    border-radius: 0;
}

/* Button styling - flat */
:root[data-context="internal"][data-internal-theme="dasei"] button,
:root[data-context="internal"][data-internal-theme="dasei"] .btn {
    border-radius: 0;
}
```

### useTheme.ts Updates

Add theme type alongside variant:

```typescript
type InternalTheme = 'opus' | 'dasei'
type InternalVariant = 'default' | 'warm' | 'cool'

// State
const internalTheme = ref<InternalTheme>('opus')

// Method to set theme
const setInternalTheme = (theme: InternalTheme): void => {
    if (!isInternalContext.value) return
    
    internalTheme.value = theme
    const root = document.documentElement
    root.setAttribute('data-internal-theme', theme)
}
```

### DashboardLayout Integration

Add theme switcher to settings:

```vue
<select v-model="dashboardTheme" @change="setInternalTheme(dashboardTheme)">
    <option value="opus">Opus</option>
    <option value="dasei">DASEI</option>
</select>
```

## Priority Questions

1. **Scope**: Should DASEI be available only for certain project types or universally?

2. **Persistence**: Should theme preference be stored:
   - Per-user (localStorage)
   - Per-project (database)
   - System-wide configuration

3. **Color Variants**: Should DASEI have the same warm/cool variants as Opus, or its own palette?

4. **Implementation Order**:
   - Phase 1: CSS foundations (border-radius: 0, divider vars)
   - Phase 2: useTheme.ts integration
   - Phase 3: Theme switcher UI
   - Phase 4: Component-specific adjustments

5. **Component Compatibility**: Which components need DASEI-specific styles?
   - Cards/panels
   - Buttons
   - Form elements
   - ListHead/tabs
   - Settings sections

## Migration Path

1. Add `data-internal-theme="opus"` as explicit default (currently implicit)
2. Create DASEI CSS file with overrides
3. Test on a few components
4. Roll out to all internal components

## Timeline Estimate

- Phase 1 (CSS): ~2 hours
- Phase 2 (useTheme): ~1 hour  
- Phase 3 (UI): ~1 hour
- Phase 4 (Component polish): ~3-4 hours

**Total**: ~7-8 hours for full implementation

## Questions for Discussion

1. What is the primary use case for DASEI vs Opus selection?
2. Are there reference designs/screenshots for the DASEI aesthetic?
3. Should the external site themes also support a "DASEI-style" option?
