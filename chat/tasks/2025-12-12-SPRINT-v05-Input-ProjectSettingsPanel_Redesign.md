# v0.5 Sprint Input: ProjectSettingsPanel Redesign

**Date:** 2025-12-12  
**Status:** Implemented  
**Commit:** Pending  
**Reference:** [DASEI Theme Proposal](./2026-01-12-SPRINT-v05-Input-DASEI_THEME_PROPOSAL.md)

---

## Summary

Complete redesign of `ProjectSettingsPanel.vue` (Dashboard COG tab) implementing a responsive two-column layout for desktop with configurable divider system and DASEI theme variant support.

---

## 1. Layout Architecture

### Mobile (<1024px)
Single-column accordion with inline content. Subtabs rendered within each expanded section.

```
┌─────────────────────────────────────┐
│ 🎨 Theme, Layout & Navigation    ▼ │
├─────────────────────────────────────┤
│ [Theme] [Layout] [Navigation]       │
│ ┌─────────────────────────────────┐ │
│ │     Theme Config Panel          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📄 Landing-Page & Pages          ▶ │
├─────────────────────────────────────┤
│ 🖼️ Images & Media                ▶ │
└─────────────────────────────────────┘
```

### Desktop (≥1024px)
Two-column layout with accordion triggers on left, active content on right.

```
┌──────────────────────┬──────────────────────────────────────────────┐
│ 🎨 Theme, Layout...▼ │  Theme, Layout & Navigation                  │
├──────────────────────┤  ═══════════════════════════════════════════ │
│   • Theme ◄──────────│► Theme                                       │
│   • Layout           │  ──────────────────────────────────────────  │
│   • Navigation       │                                              │
├──────────────────────┤  ┌──────────────────────────────────────┐   │
│ 📄 Pages           ▶ │  │      Theme Config Content            │   │
├──────────────────────┤  │                                      │   │
│ 🖼️ Images          ▶ │  │                                      │   │
├──────────────────────┤  └──────────────────────────────────────┘   │
│ 🚀 Activation      ▶ │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
      380px (340px dense)                    flex: 1
```

### Active Panel Head Structure

Follows HeadingParser/Prose patterns:

| Element | Style | Purpose |
|---------|-------|---------|
| Overline | `0.6875rem`, uppercase, muted | Accordion section name |
| Headline | `1.75rem`, bold (larger than ListHead!) | Active sub-item name |
| Separator | `1px` border, aligned with ListHead divider | Visual continuity |

---

## 2. Accordion Behavior

### Viewport-Dependent Expansion

| Viewport Height | Behavior |
|-----------------|----------|
| > 1000px | Multiple sections can be open simultaneously |
| ≤ 1000px | Radio-group (one section at a time) |

### State Persistence

When navigating between accordion sections on desktop:
- Previously selected sub-item is remembered per section
- Returning to a section restores the last active sub-item

---

## 3. Width & Dense Mode Integration

### Left Column (Accordion)

| Viewport Width | Accordion Width |
|----------------|-----------------|
| ≥ 1100px | 380px (matches ListHead) |
| 1024px - 1099px | 340px (dense) |
| < 1024px | 100% (mobile) |

Uses existing dense CSS infrastructure from `04-dense.css`.

---

## 4. Divider System

### Props

```ts
interface Props {
    divider?: 'vertical' | 'horizontal' | 'both' | 'none'  // default: 'none'
    dividerFullWidth?: boolean  // default: false
}
```

### Divider Specifications (Desktop only)

| Type | Position | Size | Color |
|------|----------|------|-------|
| Vertical | Between accordion & active panel | 8px solid | `--color-primary-bg` |
| Horizontal | Below ListHead/ActivePanelHead (80px from top) | 8px solid | `--color-primary-bg` |

### Full-Width Horizontal

When `dividerFullWidth: true`, the horizontal divider extends beyond parent padding using:

```css
left: calc(-50vw + 50%);
right: calc(-50vw + 50%);
```

This creates a true viewport-spanning divider regardless of parent constraints.

### Visual Examples

**Vertical Only (`divider="vertical"`):**
```
┌──────────────┃───────────────────────┐
│  Accordion   ┃   Active Panel       │
│              ┃                       │
└──────────────┃───────────────────────┘
```

**Horizontal Only (`divider="horizontal"`):**
```
══════════════════════════════════════════
┌──────────────┬───────────────────────┐
│  Accordion   │   Active Panel       │
└──────────────┴───────────────────────┘
```

**Both (`divider="both"`):**
```
══════════════════════════════════════════
┌──────────────┃───────────────────────┐
│  Accordion   ┃   Active Panel       │
└──────────────┃───────────────────────┘
```

---

## 5. DASEI Theme Variant

### Activation

```vue
<ProjectSettingsPanel :dasei="true" />
```

### DASEI Overrides

| Property | Value | Source |
|----------|-------|--------|
| `--color-primary-base` | `oklch(55% 0.12 45)` | Warm amber-brown |
| `--color-secondary-base` | `oklch(60% 0.08 35)` | Warm taupe |
| `--color-neutral-base` | `oklch(50% 0.015 45)` | Warm-tinted gray |
| `border-radius` | `0` | All elements |
| `font-family` | `'Roboto', sans-serif` | Institut theme typography |
| Default divider | `'vertical'` | When `divider='none'` |

### Relationship to Internal Variants

DASEI is a **component-level override** similar to `data-internal-variant="warm"` but:
- More targeted (single component vs. entire context)
- Includes typography changes (Roboto)
- Removes all border-radius
- Auto-enables vertical divider

**Future v0.6:** Formalize DASEI as a full internal variant in `05-internal-theme.css`.

---

## 6. New Components

### ActivationContent.vue

Extracted from ProjectSettingsPanel for reuse in both mobile (inline) and desktop (active panel) modes.

**Props:**
- `showButton?: boolean` (default: `true`)

**Emits:**
- `activate`

**Location:** `src/components/dashboard/ActivationContent.vue`

---

## 7. Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/ProjectSettingsPanel.vue` | Complete rewrite: two-column layout, divider system, DASEI support |
| `src/components/dashboard/ActivationContent.vue` | **NEW** - Extracted activation checklist |

---

## 8. Further Thoughts & Ideas

### 8.1 ListHead Height Synchronization

Currently `active-panel-head` uses `min-height: 80px` as a magic number. Consider:

```ts
// Option A: CSS custom property from ListHead
--list-head-height: calc(var(--overline-height) + var(--nav-height) + var(--spacing));

// Option B: ResizeObserver in DashboardLayout
const listHeadHeight = ref(80)
onMounted(() => {
    const listHead = document.querySelector('.list-head')
    listHeadHeight.value = listHead?.offsetHeight ?? 80
})
```

### 8.2 Image Browser Placeholder

The current Image section shows placeholder categories:
- "All Images"
- "Image-Category 1" 
- "Image-Category 2"

**Future:** Connect to actual image system with:
- Project-scoped image library
- Category/tag filtering
- Drag-drop upload zone
- Thumbnail grid with selection

### 8.3 DASEI Formalization

Current DASEI is prop-based. For v0.6 sprint, consider:

```css
/* In 05-internal-theme.css */
:root[data-context="internal"][data-internal-variant="dasei"] {
    --color-primary-base: oklch(55% 0.12 45);
    --color-secondary-base: oklch(60% 0.08 35);
    --color-neutral-base: oklch(50% 0.015 45);
    --radius-small: 0;
    --radius-md: 0;
    --radius-lg: 0;
    font-family: 'Roboto', sans-serif;
}
```

Then components just use `data-internal-variant="dasei"` consistently.

### 8.4 Divider Animation

For visual polish, consider animating divider appearance:

```css
.project-settings-panel--divider-vertical .settings-accordion {
    border-right: 8px solid var(--color-primary-bg);
    transition: border-right-width 0.2s ease;
}
```

### 8.5 Breakpoint Consistency

Current breakpoints:
- Mobile: `< 1024px`
- Desktop: `≥ 1024px`  
- Dense: `< 1100px` (additional narrow desktop)

Consider aligning with Tailwind defaults or creating a shared breakpoint system:

```css
:root {
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
}
```

### 8.6 Keyboard Navigation

Desktop two-column layout would benefit from:
- Arrow keys to navigate accordion items
- Tab to move between columns
- Enter to select/expand

---

## 9. Testing Checklist

- [ ] Mobile accordion: single column, tabs inside sections
- [ ] Desktop layout: two columns with 380px accordion
- [ ] Dense desktop: accordion shrinks to 340px at <1100px
- [ ] Tall viewport (>1000px): multiple accordions can open
- [ ] Short viewport: radio-group behavior
- [ ] Vertical divider renders 8px primary
- [ ] Horizontal divider at 80px from top
- [ ] Full-width horizontal spans viewport
- [ ] DASEI: warm colors, no radius, Roboto font
- [ ] DASEI: auto-vertical divider when divider='none'
- [ ] Sub-item selection persists per section
- [ ] Active panel content loads correctly for each section

---

## 10. Deferred to v0.6

- [ ] DASEI as formal internal variant in CSS
- [ ] Image browser implementation
- [ ] Pages configuration implementation  
- [ ] ListHead height synchronization (ResizeObserver)
- [ ] Keyboard navigation for desktop layout
- [ ] Animation polish for dividers
