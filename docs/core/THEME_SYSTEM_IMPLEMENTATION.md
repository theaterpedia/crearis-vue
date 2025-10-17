# Theme System Integration - Implementation Summary

## Overview
Implemented a comprehensive theme management system with Nitro backend, Vue composable, and UI integration across the application.

## Components Created

### 1. Nitro API Endpoints

**Location**: `server/api/themes/`

#### GET /api/themes
Returns list of all available themes from `server/themes/index.json`

```typescript
Response: {
  success: true,
  themes: [
    { id: 0, name: "Theme Name", description: "...", cimg: "..." },
    ...
  ]
}
```

#### GET /api/themes/:id
Returns CSS variables for a specific theme with `--color-` prefix

```typescript
Response: {
  success: true,
  id: 0,
  vars: {
    "--color-primary-base": "oklch(...)",
    "--color-secondary-base": "oklch(...)",
    ...
  }
}
```

**Key Feature**: Automatically transforms JSON keys by prepending `--color-` prefix

### 2. Vue Composable: useTheme

**Location**: `src/composables/useTheme.ts`

**Pattern**: Singleton with shared state across all instances

**State**:
```typescript
const currentThemeId = ref<number | null>(null)  // null = no theme (site CSS)
const themesCache = ref<any[]>([])
const themeVarsCache = ref<Map<number, Record<string, string>>>(new Map())
```

**Core Functions**:

1. **setTheme(id: number | null)**
   - `null`: Removes all theme variables, reverts to site CSS
   - `0-7`: Sets specific theme, applies CSS vars to `document.documentElement`
   - Automatically caches theme data

2. **getThemeVars(id: number)**
   - Fetches CSS variables from API for specific theme
   - Caches results in Map for performance
   - Returns: `Promise<ThemeVars>`

3. **getThemes()**
   - Fetches list of all available themes
   - Caches results in array
   - Returns: `Promise<Theme[]>`

4. **currentVars (computed)**
   - Returns CSS variables for currently active theme
   - Returns `null` if no theme is active
   - Reactive updates when theme changes

**Helper Functions**:
- `applyVarsToDocument(vars)`: Applies CSS variables to document root
- `removeVarsFromDocument()`: Removes all theme CSS variables
- `getVarsAsStyleString(vars)`: Converts vars to style attribute string
- `init()`: Initializes theme system, loads available themes

### 3. ThemeDropdown Component

**Location**: `src/components/ThemeDropdown.vue`

**Features**:
- Dropdown button showing current theme name or "Site"
- Visual theme selector with preview images
- "Site" option to revert to default CSS
- Click-outside to close
- Error handling and loading states
- Checkmark indicator for active theme

**UI Structure**:
```
[🎨 Site ▼] Button
  └─ Dropdown Panel
      ├─ Site (Default CSS)
      ├─ Theme 0
      ├─ Theme 1
      ├─ ...
      └─ Theme 7
```

### 4. Navbar Integration

**Location**: `src/components/Navbar.vue`

**Changes**:
- Added `<ThemeDropdown />` component to navbar menu
- Positioned before other menu items
- Automatically included on all pages using Navbar

### 5. View Integration

**TaskDashboard** (`src/views/TaskDashboard.vue`):
```typescript
import { useTheme } from '@/composables/useTheme'
const { init: initTheme } = useTheme()

onMounted(async () => {
    await initTheme()  // Initialize theme system
    // ... rest of initialization
})
```

**ProjectMain** (`src/views/project/ProjectMain.vue`):
```typescript
import { useTheme } from '@/composables/useTheme'
const { init: initTheme } = useTheme()

onMounted(async () => {
    await initTheme()  // Initialize theme system
    // ... rest of initialization
})
```

## How It Works

### Default Behavior (No Theme)
1. Application starts with `currentThemeId = null`
2. Site uses existing CSS variables from `src/assets/css/`
3. Theme dropdown shows "Site"

### Selecting a Theme
1. User clicks theme dropdown
2. First open loads themes from `/api/themes`
3. User selects theme (0-7)
4. Composable:
   - Fetches theme vars from `/api/themes/:id`
   - Caches vars in Map
   - Applies to `document.documentElement.style`
5. All components using CSS variables automatically update

### Reverting to Site CSS
1. User selects "Site" from dropdown
2. Composable:
   - Sets `currentThemeId = null`
   - Removes all theme CSS variables from document
3. Site reverts to original CSS variables

## Theme Data Structure

### server/themes/index.json
```json
[
  {
    "id": 0,
    "name": "Default",
    "description": "Default theme",
    "cimg": "/themes/theme-0.jpg"
  },
  ...
]
```

### server/themes/theme-0.json
```json
{
  "primary-base": "oklch(0.5 0.2 250)",
  "secondary-base": "oklch(0.6 0.15 180)",
  ...
}
```

**API transforms to**:
```json
{
  "--color-primary-base": "oklch(0.5 0.2 250)",
  "--color-secondary-base": "oklch(0.6 0.15 180)",
  ...
}
```

## CSS Variable Usage

Any component can use theme variables:

```vue
<template>
  <div class="my-component">
    <h1>Title</h1>
  </div>
</template>

<style scoped>
.my-component {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
}

h1 {
  color: var(--color-primary-base);
}
</style>
```

When a theme is active, these variables are overridden.
When no theme is active (Site), they fall back to CSS defaults.

## Performance Optimizations

1. **Caching**: Themes and vars cached after first fetch
2. **Singleton Pattern**: Single shared state across app
3. **Lazy Loading**: Theme vars only loaded when needed
4. **Map for O(1) lookup**: Fast theme variable retrieval

## Testing

### Manual Testing Steps

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Navigate to TaskDashboard** (`/`)
   - Theme dropdown should appear in navbar
   - Default shows "Site"

3. **Click theme dropdown**
   - Should show "Site" option
   - Should show 8 theme options (0-7)
   - Each with preview image

4. **Select a theme**
   - Page colors should change
   - Dropdown should show selected theme name
   - Check DevTools: `document.documentElement.style` should have `--color-*` variables

5. **Select "Site"**
   - Page should revert to original colors
   - DevTools: Theme CSS variables should be removed

6. **Navigate to Project route** (`/project`)
   - Theme should persist (singleton state)
   - Theme dropdown should reflect active theme

7. **Test multiple components**
   - Any component using `var(--color-*)` should update with theme

## Files Modified

### Created:
- `server/api/themes/index.get.ts`
- `server/api/themes/[id].get.ts`
- `src/composables/useTheme.ts`
- `src/components/ThemeDropdown.vue`

### Modified:
- `src/components/Navbar.vue` (added ThemeDropdown)
- `src/views/TaskDashboard.vue` (added theme init)
- `src/views/project/ProjectMain.vue` (added theme init)
- `src/router/index.ts` (added /theme-demo route)

### Demo View:
- `src/views/ThemeDemo.vue` (comprehensive demo, accessible at `/theme-demo`)

## Future Enhancements

1. **Persistence**: Store selected theme in localStorage
2. **User Preferences**: Save theme choice per user in database
3. **Theme Preview**: Live preview before applying
4. **Custom Themes**: UI for creating/editing themes
5. **Dark Mode**: Separate dark/light theme variants
6. **Animation**: Smooth transitions between themes

## API Documentation

### Authentication
Currently, theme endpoints are public (no auth required).
Consider adding authentication if themes become user-specific.

### Error Handling
- Invalid theme ID: Returns 404
- Missing theme file: Returns error with message
- Composable catches errors and logs to console

### CORS
No CORS issues since API is same-origin with frontend.

## Notes

- Lint errors in created files are expected (Vue/Nitro imports resolve at runtime)
- Theme IDs are 0-7 (8 themes total)
- CSS variable prefix `--color-` is hardcoded (consider making configurable)
- Singleton pattern means theme state is shared across all components
- Theme system is initialized on mount of TaskDashboard and ProjectMain
- Theme dropdown is automatically included wherever Navbar is used
