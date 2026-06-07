# v0.5 Sprint Input: Theming & EditPanel Analysis

**Date:** 2025-12-11  
**Status:** Completed  
**Commit:** Pending  
**Reference:** [Theme Opus CSS Conventions](/home/persona/crearis/crearis-vue/docs/dev/features/theme-opus-css.md)

---

## Summary

Analysis and fixes for the internal theming system and EditPanel component, ensuring consistent UI for internal/administrative contexts.

---

## 1. Theme Variants System

### Current Infrastructure

The theme system supports **3 internal variants** via CSS:

| Variant | CSS Selector | Primary Color |
|---------|--------------|---------------|
| `default` (opus) | `[data-context="internal"]` | calm blue `oklch(55% 0.12 250)` |
| `warm` | `[data-context="internal"][data-internal-variant="warm"]` | amber-brown `oklch(55% 0.12 45)` |
| `cool` | `[data-context="internal"][data-internal-variant="cool"]` | slate `oklch(55% 0.10 220)` |

### API for Switching Variants

```ts
import { useTheme } from '@/composables/useTheme'

const { setInternalContext, setInternalVariant } = useTheme()

// Enable internal context with default variant
setInternalContext(true, 'default')

// Switch to warm variant (while in internal context)
setInternalVariant('warm')

// Switch to cool variant
setInternalVariant('cool')
```

### Files

- **CSS:** `src/assets/css/05-internal-theme.css` (lines 89, 102)
- **Composable:** `src/composables/useTheme.ts` (line 576: `setInternalVariant`)
- **Usage:** `HomeLayout.vue`, `DashboardLayout.vue` (set internal context on mount)

### Testdrive Options

1. **DevTools Quick Test:**
   ```js
   document.documentElement.setAttribute('data-internal-variant', 'warm')
   // or 'cool'
   ```

2. **Add UI Toggle:** Import `setInternalVariant` and add a temporary button

---

## 2. BasePanel Internal Theming (FIXED)

### Problem

`BasePanel.vue` uses `<Teleport to="body">` which renders the panel outside the normal Vue component tree. This caused it to inherit external theme styles when opened from `/sites/*` routes.

### Solution Applied

Changed BasePanel to explicitly declare internal context:

```vue
<!-- Before -->
<div v-if="isOpen" class="base-panel" :style="panelStyles" ...>

<!-- After -->
<div v-if="isOpen" class="base-panel" data-context="internal" ...>
```

This ensures:
- Panel always uses internal "opus" theme
- Independent of page theme (external projects can have any theme)
- Consistent UX for logged-in users (internal = control panel feel)

### Cleanup

Removed unused `panelStyles` computed and `useTheme` import since theming is now CSS-driven via `data-context="internal"`.

---

## 3. EditPanel img_id Fix (FIXED)

### Problem

`EditPanelData` interface still had deprecated `cimg?: string` field.

### Solution Applied

```ts
// Before
export interface EditPanelData {
    heading: string
    teaser?: string
    cimg?: string  // ❌ Deprecated
    // ...
}
availableFields: () => ['heading', 'teaser', 'cimg', ...]

// After
export interface EditPanelData {
    heading: string
    teaser?: string
    img_id?: number | null  // ✅ Correct
    // ...
}
availableFields: () => ['heading', 'teaser', 'img_id', ...]
```

The template already used `formData.img_id` with `DropdownList`, so the binding was correct.

---

## 4. Dense Mode Reference

### Current Implementation

Dense mode is defined in `src/assets/css/04-dense.css`:

```css
/* Auto-triggers on viewport */
@media (max-width: 379px) { --dense: 1; font-size: 87.5%; }
@media (min-width: 660px) and (max-width: 800px) { --dense: 1; }

/* Utility classes */
.force-dense { ... }
.force-normal { ... }
```

### Components Using Dense

| Component | Implementation | Quality |
|-----------|---------------|---------|
| `ListHead.vue` | Reads `--dense`, applies `.list-head--dense` | ✅ Good |
| `HomeLayout.vue` | Class toggle `.home-layout--dense` | ✅ Good |
| `EditPanel.vue` | None | ❌ Could improve |

### Recommendation for v0.5

Add dense awareness to EditPanel and form components for better mobile experience.

---

## Files Modified

1. **`src/components/BasePanel.vue`**
   - Added `data-context="internal"` attribute
   - Removed inline panelStyles override
   - Removed unused `useTheme` import

2. **`src/components/EditPanel.vue`**
   - Changed `cimg?: string` → `img_id?: number | null` in interface
   - Updated `availableFields` default to use `'img_id'`

---

## Deferred to v0.5

- [ ] UI toggle for warm/cool variant testing on /home
- [ ] Dense mode support for EditPanel
- [ ] Mobile responsiveness audit for panel components
- [ ] Fix Opus CSS violations in EditPanel (see section 5)

---

## 5. EditPanel Opus CSS Audit

**Reference:** [Theme Opus CSS Conventions](/home/persona/crearis/crearis-vue/docs/dev/features/theme-opus-css.md)

### Violations Found

| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 280 | Hex color | `#ef4444` | `oklch(63.68% 0.2078 25.33)` or `var(--color-negative-base)` |
| 266 | px units | `120px` | `7.5rem` |
| 318, 346 | rgba color | `rgba(59, 130, 246, 0.1)` | `oklch(from var(--color-primary-bg) l c h / 0.1)` |
| 415 | rgba color | `rgba(59, 130, 246, 0.25)` | `oklch(from var(--color-primary-bg) l c h / 0.25)` |
| 455 | px media query | `767px` | Acceptable for breakpoints |

### Acceptable Uses

- `1px` borders - OK (hairline borders are conventionally 1px)
- `-1px` transforms - OK (micro-animations)
- `2px` spinner border - OK (small decorative elements)
- Media query breakpoints in px - OK (standard practice)

### Recommended Fixes

```css
/* Line 280: Required field asterisk */
.required {
    color: var(--color-negative-base);
}

/* Line 266: Fixed width group */
.form-group-fixed {
    width: 7.5rem;
    flex-shrink: 0;
}

/* Lines 318, 346: Focus ring */
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 0.1875rem oklch(from var(--color-primary-bg) l c h / 0.1);
}

/* Line 415: Hover shadow */
.btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 0.125rem 0.5rem oklch(from var(--color-primary-bg) l c h / 0.25);
}
```

### Priority

**Medium** - These are cosmetic inconsistencies. The component functions correctly. Fix during v0.5 cleanup phase.
