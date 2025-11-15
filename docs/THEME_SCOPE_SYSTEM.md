# Theme Scope System

## Overview

The enhanced `useTheme` composable now supports **temporary theme switching** with automatic reset based on different scopes. This allows for demo modes, route-specific themes, and time-limited theme changes without affecting the user's saved preference.

## Concepts

### Initial Theme
- User's base theme preference
- Persists across routes and page refreshes
- Set with `scope='initial'` (default)

### Context Theme
- Temporary theme that overrides initial theme
- Automatically resets based on scope
- Three scope types: `local`, `timer`, `site`

**Priority:** Context theme takes precedence over initial theme when both are set.

## Scopes

### 1. Initial Scope (Default)
Sets the user's base theme preference.

```typescript
const { setTheme } = useTheme()

// Set initial theme (persists)
await setTheme(3) // default scope='initial'
await setTheme(3, 'initial') // explicit

// Clear initial theme (revert to site CSS)
await setTheme(null)
```

### 2. Local Scope
Temporary theme for current route. Auto-resets when navigating away.

**Setup:** Call `setupLocalScopeWatcher(router)` in App.vue or layout component once.

```typescript
// In App.vue
import { useTheme } from '@/composables/useTheme'
import { useRouter } from 'vue-router'

const { setupLocalScopeWatcher } = useTheme()
const router = useRouter()

// Setup watcher once
setupLocalScopeWatcher(router)
```

**Usage in components:**
```typescript
const { setTheme } = useTheme()

// Set theme for current route (auto-resets on navigation)
await setTheme(5, 'local')

// Set theme for specific route (only resets when leaving that route)
await setTheme(5, 'local', '/home')
```

### 3. Timer Scope
Temporary theme with automatic timeout reset.

```typescript
const { setTheme } = useTheme()

// Set theme for 10 seconds
await setTheme(2, 'timer', 10)

// Set theme for 30 seconds
await setTheme(4, 'timer', 30)

// Theme automatically reverts after timeout
```

### 4. Site Scope
Project-specific themes (domaincode-based). **Not yet implemented.**

```typescript
const { setTheme } = useTheme()

// Will throw error
await setTheme(1, 'site', 'project-alpha')
// Error: Site scope not yet implemented
```

## Manual Reset

Context themes can be manually reset at any time:

```typescript
const { resetContext } = useTheme()

// Clear context theme and restore initial theme
resetContext()
```

## Debugging

Access internal state for debugging:

```typescript
const { 
    currentTheme,    // Active theme (context ?? initial)
    initialTheme,    // User's base preference
    contextTheme,    // Current temporary theme
    contextScope     // Current scope ('local', 'timer', null)
} = useTheme()

console.log('Current:', currentTheme.value)
console.log('Initial:', initialTheme.value)
console.log('Context:', contextTheme.value)
console.log('Scope:', contextScope.value)
```

## Use Cases

### Demo Mode (Post-It)
```vue
<script setup>
const { setTheme, resetContext } = useTheme()

const demoTheme = async (themeId: number) => {
    // Set theme for 30 seconds
    await setTheme(themeId, 'timer', 30)
}

const stopDemo = () => {
    resetContext()
}
</script>

<template>
    <PostIt>
        <button @click="demoTheme(2)">Try Theme 2 (30s)</button>
        <button @click="stopDemo">Stop Demo</button>
    </PostIt>
</template>
```

### Route-Specific Theme
```vue
<script setup>
// In special route component
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { setTheme } = useTheme()

onMounted(async () => {
    // Set dark theme for this route only
    await setTheme(7, 'local')
})
</script>
```

### Temporary Preview
```vue
<script setup>
const { setTheme, resetContext } = useTheme()

const previewTheme = async (id: number) => {
    await setTheme(id, 'timer', 60) // Preview for 1 minute
}

const cancelPreview = () => {
    resetContext()
}
</script>

<template>
    <div>
        <button @click="previewTheme(3)">Preview Theme (60s)</button>
        <button @click="cancelPreview">Cancel Preview</button>
    </div>
</template>
```

## API Reference

### setTheme(id, scope, param)
Set active theme with optional scope.

**Parameters:**
- `id: number | null` - Theme ID (0-7) or null to clear
- `scope: 'initial' | 'local' | 'timer' | 'site'` - Scope type (default: 'initial')
- `param: string | number` - Additional parameter:
  - `local`: route path (optional, auto-detected)
  - `timer`: seconds until reset (required)
  - `site`: domaincode (not implemented)

**Returns:** `Promise<void>`

**Throws:**
- `Error` if theme ID out of range (0-7)
- `Error` if scope='site' (not implemented)
- `Error` if scope='timer' and param not provided or not a number

### resetContext()
Clear context theme and restore initial theme.

**Returns:** `void`

### setupLocalScopeWatcher(router)
Setup route watcher for local scope auto-reset. Call once in App.vue.

**Parameters:**
- `router: Router` - Vue Router instance

**Returns:** `void`

## Computed Properties

### currentTheme
Active theme ID (context ?? initial).

```typescript
const { currentTheme } = useTheme()
console.log(currentTheme.value) // 3
```

### initialTheme
User's base theme preference.

```typescript
const { initialTheme } = useTheme()
console.log(initialTheme.value) // 2
```

### contextTheme
Current temporary theme (or null).

```typescript
const { contextTheme } = useTheme()
console.log(contextTheme.value) // 5 or null
```

### contextScope
Current scope type (or null).

```typescript
const { contextScope } = useTheme()
console.log(contextScope.value) // 'local', 'timer', or null
```

## Examples

### Example 1: Post-It Demo Toggle
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { setTheme, resetContext, contextTheme } = useTheme()
const isDemoActive = computed(() => contextTheme.value !== null)

const toggleDemo = async () => {
    if (isDemoActive.value) {
        resetContext()
    } else {
        await setTheme(4, 'timer', 30)
    }
}
</script>

<template>
    <button @click="toggleDemo">
        {{ isDemoActive ? 'Stop Demo' : 'Start Demo (30s)' }}
    </button>
</template>
```

### Example 2: Theme Preview with Countdown
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { setTheme, resetContext, contextTheme, contextScope } = useTheme()
const countdown = ref<number>(0)
let intervalId: number | null = null

const startPreview = async (themeId: number, seconds: number) => {
    await setTheme(themeId, 'timer', seconds)
    countdown.value = seconds
    
    intervalId = window.setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
    }, 1000)
}

watch(contextTheme, (newVal) => {
    if (newVal === null && intervalId) {
        clearInterval(intervalId)
        intervalId = null
        countdown.value = 0
    }
})
</script>

<template>
    <div>
        <button @click="startPreview(3, 60)">
            Preview Theme 3 (60s)
        </button>
        <div v-if="countdown > 0">
            Reverting in {{ countdown }}s
        </div>
    </div>
</template>
```

### Example 3: Route-Based Theme
```vue
<!-- App.vue -->
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useRouter } from 'vue-router'

const { setupLocalScopeWatcher } = useTheme()
const router = useRouter()

// Setup once
setupLocalScopeWatcher(router)
</script>

<!-- DarkModePage.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { setTheme } = useTheme()

onMounted(async () => {
    // This page always uses theme 7
    // Auto-resets when navigating away
    await setTheme(7, 'local')
})
</script>
```

## Migration Guide

Existing code continues to work without changes:

```typescript
// Old code (still works)
await setTheme(3)
await setTheme(null)

// New scope parameter is optional with default='initial'
```

## Notes

- Context theme always takes precedence over initial theme
- Only one context theme can be active at a time
- Setting a new context theme clears any existing timer
- Manual `resetContext()` clears timer without waiting
- Route watcher only resets if scope='local'
- Timer scope uses `window.setTimeout` (cleared on reset)
- Site scope reserved for future domaincode-based themes

## Related Files

- `/src/composables/useTheme.ts` - Enhanced composable implementation
- `/src/views/Home/HomeComponents/HomePageHero.vue` - Example usage (Post-It)
