# Opus CSS Conventions for Internal Components

**Code Automation Guide for GUI Components in `/projects` Routes**

Version: 0.1 (December 2, 2025)

---

## Scope: Internal Components

This guide applies to **internal components** - admin panels, dashboards, editors, and configuration UIs found under the `/projects` route family. These components prioritize functionality and developer velocity over pixel-perfect design alignment with marketing pages.

> **Note:** Core/public components (Hero, Banner, Prose, etc.) follow the full theming.md conventions. Internal components follow this simplified guide.

---

## A) Color Model: OKLCH Only

**Always use OKLCH color model. Never use HSL, RGB, or hex.**

```css
/* ✅ CORRECT */
background: oklch(72.21% 0.2812 144.53);
color: var(--color-primary-bg);

/* ❌ WRONG */
background: hsl(144, 70%, 50%);
background: #2dc878;
background: rgb(45, 200, 120);
```

---

## B) Available CSS Variables

Reference `00-theme.css` for the complete list. Key variables for internal components:

### Semantic Colors (bg + contrast pairs)

| Purpose | Background | Text/Icons |
|---------|------------|------------|
| Primary actions (hover/active) | `--color-primary-bg` | `--color-primary-contrast` |
| Default/inactive state | `--color-accent-bg` | `--color-accent-contrast` |
| Secondary brand | `--color-secondary-bg` | `--color-secondary-contrast` |
| Success | `--color-positive-bg` | `--color-positive-contrast` |
| Error/danger | `--color-negative-bg` | `--color-negative-contrast` |
| Warning | `--color-warning-bg` | `--color-warning-contrast` |
| Muted/disabled | `--color-muted-bg` | `--color-muted-contrast` |
| Cards/panels | `--color-card-bg` | `--color-card-contrast` |
| Popovers/modals | `--color-popover-bg` | `--color-popover-contrast` |

### UI Elements

| Variable | Usage |
|----------|-------|
| `--color-bg` | Page background |
| `--color-contrast` | Default text on page bg |
| `--color-border` | Borders, dividers |
| `--color-dimmed` | Secondary text, labels |
| `--color-input` | Input field backgrounds |

### Code-Automation Aliases

These are convenience mappings defined in `00-theme.css`:

```css
--color-background-mute: var(--color-muted-bg);
--color-background-soft: var(--color-bg);
--color-border-hover: var(--color-border);  /* Currently disabled */
--color-primary: var(--color-accent-bg);    /* Default button state */
--color-primary-hover: var(--color-primary-bg);  /* Hover/active state */
--color-text-muted: var(--color-muted-contrast);
```

---

## C) Button State Convention

**Critical Pattern: accent → primary on interaction**

```css
/* Default state: accent (dark, less prominent) */
.btn {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: 1px solid var(--color-border);
}

/* Hover/Active state: primary (bright green, prominent) */
.btn:hover,
.btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}
```

**Why this pattern?**
- `--color-accent-bg` is dark (`oklch(32.11% 0 0)`) - subtle, professional
- `--color-primary-bg` is bright green (`oklch(72.21% 0.2812 144.53)`) - draws attention
- Interaction creates visual feedback without being overwhelming at rest

### Button Variants

```css
/* Primary action button (save, submit, confirm) */
.btn-primary {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}
.btn-primary:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Secondary/Cancel button */
.btn-secondary {
    background: transparent;
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
}
.btn-secondary:hover {
    background: var(--color-muted-bg);
}

/* Danger button */
.btn-danger {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}
.btn-danger:hover {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}
```

---

## D) Tab Navigation Pattern

```css
.tab {
    background: transparent;
    color: var(--color-dimmed);
    border-bottom: 2px solid transparent;
}

.tab:hover {
    color: var(--color-contrast);
}

.tab.active {
    color: var(--color-primary-contrast);
    border-bottom-color: var(--color-primary-bg);
    /* Or use accent for text if on light background */
    color: var(--color-accent-bg);
}
```

---

## E) Form Elements

```css
/* Input fields */
.form-input {
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    border: 1px solid var(--color-border);
}

.form-input:focus {
    border-color: var(--color-primary-bg);
    outline: none;
}

/* Select dropdowns */
.form-select {
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    border: 1px solid var(--color-border);
}

/* Checkboxes (custom) */
.checkbox:checked {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
}

/* Labels */
.form-label {
    color: var(--color-dimmed);
    font-size: 0.875rem;
}
```

---

## F) Cards and Panels

```css
.card {
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
}

/* Panel header */
.panel-header {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    border-bottom: 1px solid var(--color-border);
}
```

---

## G) Status Badges

```css
.badge {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.75rem;
}

.badge-success {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.badge-error {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

.badge-info {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.badge-neutral {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}
```

---

## H) Tables and Data Grids

```css
.table {
    width: 100%;
    border-collapse: collapse;
}

.table th {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    text-align: left;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
}

.table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-contrast);
}

.table tr:hover {
    background: var(--color-muted-bg);
}
```

---

## I) Modal/Dialog Pattern

```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0% 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: var(--color-popover-bg);
    color: var(--color-popover-contrast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
}

.modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}
```

---

## J) Hover Effects (Future Refinement v0.5)

**Current approach:** Hover border effects using `--color-border-hover` are implemented but currently disabled (mapped to `--color-border`).

```css
/* Pattern used - will be refined in v0.5 */
.interactive-element {
    border: 1px solid var(--color-border);
    transition: border-color 0.2s ease;
}

.interactive-element:hover {
    border-color: var(--color-border-hover);
}
```

> **v0.5 Task:** Review hover border patterns across all internal components and decide on:
> 1. Enable distinct `--color-border-hover` value
> 2. Or remove hover border transitions entirely
> 3. Apply consistent find-and-replace across codebase

---

## K) Do NOT Use These Patterns

```css
/* ❌ WRONG: Using primary as default state */
.btn {
    background: var(--color-primary-bg);  /* Should be accent */
}

/* ❌ WRONG: Hardcoded colors */
.card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
}

/* ❌ WRONG: Using RGB/HSL */
.highlight {
    background: rgb(45, 200, 120);
}

/* ❌ WRONG: Undefined CSS variables */
.element {
    background: var(--color-background);  /* Use --color-bg */
    color: var(--color-text);  /* Use --color-contrast */
}
```

---

## Quick Reference Card

| Need | Use |
|------|-----|
| Page background | `--color-bg` |
| Default text | `--color-contrast` |
| Secondary text | `--color-dimmed` |
| Button default | `--color-accent-bg` + `--color-accent-contrast` |
| Button hover/active | `--color-primary-bg` + `--color-primary-contrast` |
| Card/panel bg | `--color-card-bg` + `--color-card-contrast` |
| Modal bg | `--color-popover-bg` + `--color-popover-contrast` |
| Muted/disabled | `--color-muted-bg` + `--color-muted-contrast` |
| Borders | `--color-border` |
| Success | `--color-positive-bg` + `--color-positive-contrast` |
| Error | `--color-negative-bg` + `--color-negative-contrast` |
| Warning | `--color-warning-bg` + `--color-warning-contrast` |

---

**Document Version:** 0.1  
**Last Updated:** December 2, 2025  
**Scope:** Internal components (`/projects` routes)
