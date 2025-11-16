# Inverted Color Mode Implementation

## Overview
Added inverted color mode toggle functionality to the theme system, allowing users to switch between light and dark modes.

## Changes Made

### 1. Updated `useTheme` Composable

**Location**: `src/composables/useTheme.ts`

#### Added State
```typescript
const isInverted = ref<boolean>(false)
```

#### New Functions

**setInverted(inverted: boolean)**
- Sets the inverted mode state
- Updates `--color-inverted` CSS variable on document root
- Value: `0` = light mode, `1` = dark mode

**getInverted(): boolean**
- Returns current inverted state
- Useful for checking mode programmatically

**toggleInverted(): void**
- Toggles between light and dark mode
- Updates DOM automatically

**isInverted (computed)**
- Reactive computed property
- Automatically updates components when mode changes

#### Helper Function
```typescript
const applyInvertedToDocument = (): void => {
    const root = document.documentElement
    root.style.setProperty('--color-inverted', isInverted.value ? '1' : '0')
}
```

#### Updated init()
```typescript
const init = async () => {
    await getThemes()
    applyInvertedToDocument() // Apply initial inverted state
}
```

### 2. Updated `00-theme.css`

**Added CSS Variable**:
```css
:root {
  /* Inverted mode (0 = light, 1 = dark) */
  --color-inverted: 0;
  
  /* ... rest of variables */
}
```

**Default**: `0` (light mode)

### 3. Created `InvertedToggle` Component

**Location**: `src/components/InvertedToggle.vue`

#### Features
- Toggle button with sun/moon icons
- Shows "Light" or "Dark" label
- Same styling as other navbar buttons
- Hover effects and transitions

#### Template
```vue
<button class="inverted-toggle-btn" @click="handleToggle">
    <svg v-if="!isInverted"><!-- Sun icon --></svg>
    <svg v-else><!-- Moon icon --></svg>
    <span>{{ isInverted ? 'Dark' : 'Light' }}</span>
</button>
```

#### Styling
Matches navbar button style:
```css
.inverted-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.inverted-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}
```

### 4. Updated `Navbar` Component

**Location**: `src/components/Navbar.vue`

**Added**:
```vue
<!-- Inverted Mode Toggle -->
<div class="navbar-item">
    <InvertedToggle />
</div>
```

**Position**: Before theme dropdown, after logo/routes

**Import**:
```typescript
import InvertedToggle from './InvertedToggle.vue'
```

## How It Works

### State Management
```
User clicks toggle
    ↓
toggleInverted() called
    ↓
isInverted.value = !isInverted.value
    ↓
applyInvertedToDocument()
    ↓
document.documentElement.style.setProperty('--color-inverted', '0' or '1')
    ↓
Theme CSS variables recalculate (if using oklch calculations)
    ↓
UI updates automatically
```

### CSS Variable Usage

Themes can use `--color-inverted` in calculations:

**Light Mode** (`--color-inverted: 0`):
```css
--color-bg: oklch(from var(--color-neutral-base) 
    calc(l + 1 * (1 - var(--color-inverted) - l)) 
    calc(c / 4.5) h);
/* Result: light background */
```

**Dark Mode** (`--color-inverted: 1`):
```css
--color-bg: oklch(from var(--color-neutral-base) 
    calc(l + 1 * (1 - var(--color-inverted) - l)) 
    calc(c / 4.5) h);
/* Result: dark background */
```

### Calculation Logic

**For backgrounds** (lighter in light mode, darker in dark):
```
calc(l + 1 * (1 - var(--color-inverted) - l))

Light (0): l + 1 * (1 - 0 - l) = l + 1 - l = 1 (white)
Dark (1):  l + 1 * (1 - 1 - l) = l + 1 * (0 - l) = 0 (black)
```

**For text** (darker in light mode, lighter in dark):
```
calc(l + 1 * (var(--color-inverted) - l))

Light (0): l + 1 * (0 - l) = 0 (black)
Dark (1):  l + 1 * (1 - l) = 1 (white)
```

## Usage Examples

### In Components
```typescript
import { useTheme } from '@/composables/useTheme'

const { isInverted, toggleInverted, setInverted, getInverted } = useTheme()

// Check current mode
console.log(isInverted.value) // true or false

// Toggle mode
toggleInverted()

// Set specific mode
setInverted(true)  // Dark mode
setInverted(false) // Light mode

// Get mode (non-reactive)
const isDark = getInverted()
```

### In Templates
```vue
<template>
    <div :class="{ 'dark-mode': isInverted }">
        Current mode: {{ isInverted ? 'Dark' : 'Light' }}
    </div>
</template>
```

### Programmatic Access
```typescript
// Check if dark mode
if (document.documentElement.style.getPropertyValue('--color-inverted') === '1') {
    console.log('Dark mode active')
}
```

## UI Components

### Navbar Layout
```
[Logo] [Routes]  [Inverted Toggle] [Theme] [Menus] [User]
```

### Toggle Button States

**Light Mode**:
```
☀️ Light
```

**Dark Mode**:
```
🌙 Dark
```

### Button Styling
- Transparent background
- White border (20% opacity)
- White text
- Hover: Increased opacity
- Smooth transitions

## Theme Integration

### How Themes Use Inverted Mode

Theme JSON files can define color calculations:
```json
{
  "bg": "oklch(from var(--color-neutral-base) calc(l + 1 * (1 - var(--color-inverted) - l)) calc(c / 4.5) h)",
  "contrast": "oklch(from var(--color-gray-base) calc(l + 1 * (var(--color-inverted) - l)) calc(c / 4.5) h)"
}
```

When inverted mode is toggled:
1. `--color-inverted` changes (0 ↔ 1)
2. Calculations automatically update
3. Colors flip appropriately
4. No theme reload needed

### Site CSS (00-theme.css)

Current site CSS doesn't use `--color-inverted` in calculations.
To make it reactive, update color definitions to use calculations like themes do.

## Testing Checklist

- [x] Toggle button appears in navbar
- [x] Button shows correct icon (sun/moon)
- [x] Button shows correct label (Light/Dark)
- [x] Click toggles `--color-inverted` variable
- [x] Variable updates in DOM (inspect element)
- [x] Button styling matches other navbar buttons
- [x] Hover effects work
- [x] State persists across component rerenders (singleton)
- [ ] Colors change when inverted (requires theme calculations)
- [ ] State persists on page reload (localStorage - future enhancement)

## Browser Compatibility

**CSS Custom Properties**: ✅ All modern browsers
**CSS oklch() with from**: ⚠️ Requires modern browser (2023+)
- Chrome/Edge 111+
- Firefox 113+
- Safari 16.4+

**Fallback**: Site CSS provides static values that don't use calculations

## Future Enhancements

### 1. Persistence
```typescript
// Save to localStorage
const setInverted = (inverted: boolean): void => {
    isInverted.value = inverted
    localStorage.setItem('theme-inverted', inverted ? '1' : '0')
    applyInvertedToDocument()
}

// Load on init
const init = async () => {
    const saved = localStorage.getItem('theme-inverted')
    if (saved) {
        isInverted.value = saved === '1'
    }
    await getThemes()
    applyInvertedToDocument()
}
```

### 2. System Preference Detection
```typescript
const init = async () => {
    // Check system preference
    if (window.matchMedia && !localStorage.getItem('theme-inverted')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        isInverted.value = prefersDark
    }
    await getThemes()
    applyInvertedToDocument()
}
```

### 3. Smooth Transitions
```css
:root {
    transition: background-color 0.3s ease, color 0.3s ease;
}
```

### 4. Per-Theme Override
```typescript
// Some themes might work better in one mode
const themeDefaults = {
    0: false, // Theme 0 prefers light
    1: true,  // Theme 1 prefers dark
}
```

## Accessibility

### Keyboard Support
✅ Button is keyboard accessible (native button element)
✅ Spacebar/Enter to toggle

### Screen Readers
✅ Title attribute provides context
✅ Icon changes reflect state
✅ Text label clearly indicates mode

### ARIA (Future Enhancement)
```vue
<button 
    role="switch" 
    :aria-checked="isInverted"
    aria-label="Toggle dark mode">
```

## Performance

**Impact**: Minimal
- Single CSS variable update
- No style recalculation if theme doesn't use calculations
- Instant feedback (no async operations)

**State Management**: Singleton pattern ensures single source of truth

## Migration Guide

### Enable Inverted Calculations in Site CSS

**Current**:
```css
--color-bg: oklch(96.19% 0 0);
```

**With Inverted Support**:
```css
--color-bg: oklch(
    from var(--color-neutral-base) 
    calc(l + 1 * (1 - var(--color-inverted) - l)) 
    calc(c / 4.5) 
    h
);
```

### Pattern for All Colors

**Backgrounds** (light → dark):
```css
calc(l + 1 * (1 - var(--color-inverted) - l))
```

**Text/Contrast** (dark → light):
```css
calc(l + 1 * (var(--color-inverted) - l))
```

**Muted/Dimmed** (partial inversion):
```css
calc(l + 0.6 * (var(--color-inverted) - l))
```
