# Theme System & Opus CSS

The Crearis platform uses a sophisticated theme system with **oklch colors** and consistent **CSS conventions**.

## Overview

### oklch Color System

Theaterpedia uses [oklch](https://oklch.com/) for perceptually uniform colors:

```css
/* oklch(lightness chroma hue) */
--color-primary-base: oklch(72.21% 0.2812 144.53);  /* Theaterpedia Green */
--color-secondary-base: oklch(65.74% 0.2393 304.41); /* Purple accent */
```

**Benefits:**
- Consistent perceived brightness across hues
- Better color manipulation (lighten/darken)
- Wider gamut support

### Theme Files

```
src/assets/css/
├── 00-theme.css       # Theme variables (oklch colors)
├── 01-variables.css   # Layout & dimension vars
├── 02-fonts-*.css     # Font family definitions
└── 03-base.css        # Base element styles
```

## CSS Variables

### Color Variables

```css
:root {
  /* Base colors */
  --color-primary-base: oklch(72.21% 0.2812 144.53);
  --color-secondary-base: oklch(65.74% 0.2393 304.41);
  --color-warning-base: oklch(84.67% 0.1867 88.36);
  --color-positive-base: oklch(68.87% 0.1715 141.94);
  --color-negative-base: oklch(63.68% 0.2078 25.33);

  /* Background & contrast */
  --color-bg: oklch(96.19% 0 0);
  --color-contrast: oklch(0% 0 0);

  /* Semantic colors */
  --color-primary-bg: var(--color-primary-base);
  --color-primary-contrast: oklch(0% 0 0);
  --color-muted-bg: oklch(88.45% 0 0);
  --color-muted-contrast: oklch(32.11% 0 0);
}
```

### Layout Variables

```css
:root {
  /* Image dimensions (rem-based) */
  --card-width: 21rem;      /* 336px */
  --card-height: 14rem;     /* 224px */
  --tile-width: 8rem;       /* 128px */
  --tile-height: 4rem;      /* 64px */
  --avatar: 4rem;           /* 64px */

  /* Border radius */
  --radius-none: 0rem;
  --radius-small: 0.25rem;
  --radius-medium: 0.5rem;
  --radius-large: 1rem;

  /* Transitions */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 150ms;
  --transition: all var(--duration) var(--ease);
}
```

## Opus CSS Conventions

The "Opus CSS" conventions ensure consistent styling across components:

> ⚠️ **CRITICAL FOR CODE AUTOMATION**
> 
> **NO HSL, RGB, HEX OR OTHER COLOR FUNCTIONS ALLOWED!**
> 
> This project uses **oklch exclusively**. Never generate:
> - ❌ `hsl(...)` or `hsla(...)`
> - ❌ `rgb(...)` or `rgba(...)`
> - ❌ `#hex` colors
> - ❌ `hsl(var(--color-*))` wrapper patterns
> 
> Always use:
> - ✅ `var(--color-*)` for theme variables
> - ✅ `oklch(L C H)` for custom colors
> - ✅ `oklch(L C H / alpha)` for transparency

### 1. Always Use rem

```css
/* ✅ Good */
.button { padding: 0.5rem 1rem; }

/* ❌ Bad */
.button { padding: 8px 16px; }
```

### 2. oklch for Colors

```css
/* ✅ Good */
.alert { background: oklch(84.67% 0.1867 88.36); }

/* ❌ Bad */
.alert { background: #f0ad4e; }
```

### 3. CSS Variables for Theming

```css
/* ✅ Good */
.card { background: var(--color-card-bg); }

/* ❌ Bad */
.card { background: white; }
```

### 4. Consistent Spacing Scale

Use multiples of 0.25rem:
- `0.25rem` (4px)
- `0.5rem` (8px)
- `1rem` (16px)
- `1.5rem` (24px)
- `2rem` (32px)

### 5. Component Sections

Structure CSS with clear section comments:

```css
/* ===== CARD COMPONENT ===== */

/* --- Layout --- */
.card { /* ... */ }

/* --- Typography --- */
.card-title { /* ... */ }

/* --- States --- */
.card:hover { /* ... */ }
.card.is-active { /* ... */ }
```

## useTheme Composable

The `useTheme` composable manages theme state:

```typescript
import { useTheme } from '@/composables/useTheme'

const { 
  setTheme,      // Set active theme
  getThemeVars,  // Get CSS vars for theme
  currentVars,   // Current theme vars
  resetContext   // Reset to initial theme
} = useTheme()

// Set initial theme
await setTheme(0, 'initial')

// Set temporary theme (resets on route change)
await setTheme(2, 'local')

// Set timed theme (resets after seconds)
await setTheme(3, 'timer', 30)
```

### Theme Scopes

| Scope | Description |
|-------|-------------|
| `initial` | User's saved preference (persists) |
| `local` | Temporary, resets on navigation |
| `timer` | Temporary, resets after N seconds |
| `site` | Project-specific (not yet implemented) |

## Dark Mode

Dark mode inverts the color scheme:

```css
.dark {
  --color-bg: oklch(15% 0.02 260);
  --color-contrast: oklch(95% 0 0);
  --color-card-bg: oklch(20% 0.02 260);
}
```

Toggle with:
```typescript
document.documentElement.classList.toggle('dark')
```

## Font System

### Monaspace Family

Primary fonts from theaterpedia.org:

| Font | Use Case |
|------|----------|
| MonaspaceNeon | Default, UI |
| MonaspaceArgon | Alternative |
| MonaspaceKrypton | Code blocks |
| MonaspaceRadon | Headers |
| MonaspaceXenon | Decorative |

### Roboto Fallback

For better readability in long-form content:

```css
.prose {
  font-family: 'Roboto', var(--font);
}
```

---

*See also: [Image System](/dev/features/images) for dimension variables*
