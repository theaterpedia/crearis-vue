# Floating Vue and Panels Guide

## When to Use Floating Vue (and When Not To)

### ✅ Use Floating Vue For:

**1. Tooltips**
- Info icons with contextual help
- Field validation hints
- Hover explanations
- Keyboard shortcut hints

**2. Dropdown Menus**
- Navigation menus
- Action menus (edit/delete/share)
- Select components
- Context menus (right-click)

**3. Popovers**
- Date pickers
- Color pickers
- Mini forms
- Quick previews

**4. Elements That Need Auto-Positioning**
- Content that must avoid viewport edges
- Elements that need collision detection
- Components that need to flip/shift based on available space
- Floating elements with arrow pointers

### ❌ Do NOT Use Floating Vue For:

**1. Full-Screen or Fixed-Position Overlays**
- Modal dialogs that cover the entire screen
- Side panels with fixed positioning (EditPanel, filters, etc.)
- Drawers that slide from edges
- Full-page overlays with backdrop

**Reason:** These don't need auto-positioning or collision detection. Simple `v-if` + `<Teleport>` + CSS is more performant and easier to debug.

**2. Always-Visible UI Elements**
- Persistent sidebars
- Static navigation bars
- Fixed headers/footers
- Permanent UI chrome

**Reason:** Floating Vue is for temporarily shown elements triggered by user interaction.

**3. Complex Multi-Step Flows**
- Wizards with multiple screens
- Form flows with navigation
- Multi-panel editors

**Reason:** These need route-based state management or dedicated overlay components, not positioning logic.

---

## Overlay Panels and Floating Panels

### Strategy: Choose Based on Positioning Needs

> **Critical Insight:** Fixed overlay panels should **always use default system theme**, not page-specific themes. This ensures consistent editor UI regardless of what theme the page content is displaying.

#### Pattern 1: Fixed Overlay Panels (No Auto-Positioning)

**When:** Full-height side panels, drawers, or fixed-position overlays.

**Theming Strategy:** Use system default theme with `--color-inverted: 0` to ensure panels always have a consistent appearance, independent of page themes.

**Implementation:**
```vue
<template>
  <Teleport to="body">
    <Transition name="slide-panel">
      <div v-if="isOpen" class="overlay-panel" :style="panelStyles">
        <!-- Panel content -->
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

// Apply system theme styles (override page theme)
const panelStyles = computed(() => ({
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-dimmed': 'var(--system-dimmed, #6b7280)',
  '--color-primary-bg': 'var(--system-primary, #3b82f6)',
  '--color-inverted': '0' // Always non-inverted in panels
}))
</script>

<style scoped>
.overlay-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;  /* or left: 0 for left panel */
  width: 25rem;
  max-height: 100vh;
  background: var(--color-bg);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Slide transition */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);  /* or translateX(-100%) for left panel */
}
</style>
```

**Benefits:**
- Simple and predictable
- No library overhead
- Easy to debug
- Full control over positioning
- Better performance
- **Consistent theming** independent of page styles

**Examples:**
- EditPanel (project/post/event editor)
- NavigationConfigPanel (site configuration)
- Filter panels
- Shopping cart sidebars
- Mobile navigation drawers

**Real Implementation:**
See `src/components/BasePanel.vue` for a reusable component implementing this pattern with proper theming.

---

#### Pattern 2: Floating Panels (With Auto-Positioning)

**When:** Panels that appear near a trigger element and need smart positioning.

**Theming Strategy:** Floating Vue dropdowns also need theme isolation. Use custom theme classes and CSS variables to ensure tooltips/popovers maintain consistent appearance.

**⚠️ Known Issue:** Floating Vue currently inherits page theme CSS variables. This needs to be addressed by:
1. Creating custom Floating Vue themes that override page theme vars
2. Using `v-popper__inner` wrapper with explicit theme styles
3. Ensuring `--color-inverted: 0` is set on popper containers

**Implementation:**
```vue
<template>
  <VDropdown
    v-model:shown="isOpen"
    :auto-hide="false"
    theme="floating-panel"
    placement="bottom-start"
    :distance="8">
    
    <button>Open Panel</button>

    <template #popper="{ hide }">
      <div class="floating-panel">
        <!-- Panel content -->
        <button @click="hide()">Close</button>
      </div>
    </template>
  </VDropdown>
</template>

<style>
/* Override page theme with system defaults */
.v-popper--theme-floating-panel .v-popper__inner {
  /* System theme overrides */
  --color-bg: var(--system-bg, #ffffff);
  --color-card-bg: var(--system-card-bg, #ffffff);
  --color-border: var(--system-border, #e5e7eb);
  --color-contrast: var(--system-contrast, #1f2937);
  --color-inverted: 0;
  
  /* Popper styles */
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-dropdown);
  padding: 1rem;
  max-width: 24rem;
}
</style>
```

**Benefits:**
- Auto-adjusts if trigger near viewport edge
- Built-in collision detection
- Handles scrolling parent containers
- Arrow pointer positioning

**Examples:**
- Action menus with extended options
- Inline property editors
- Comment/annotation panels
- Contextual help panels

---

### Decision Tree

```
Is it full-height or full-screen?
├─ YES → Use Pattern 1 (Fixed Overlay)
└─ NO
   ├─ Does it need to position near a trigger?
   │  ├─ YES
   │  │  ├─ Can it be clipped by viewport edges?
   │  │  │  ├─ YES → Use Pattern 2 (Floating with VDropdown)
   │  │  │  └─ NO → Use Pattern 1 if simple
   │  │  └─ NO
   │  └─ NO → Use Pattern 1 (Fixed Overlay)
```

---

### Code Alignment Standards

**1. Always Use Teleport**
```vue
<!-- ✅ Good: Teleport to body -->
<Teleport to="body">
  <div v-if="isOpen">...</div>
</Teleport>

<!-- ❌ Bad: No teleport (can be clipped) -->
<div v-if="isOpen" class="absolute">...</div>
```

**2. Use Vue Transitions**
```vue
<!-- ✅ Good: Smooth animations -->
<Transition name="slide-panel">
  <div v-if="isOpen">...</div>
</Transition>

<!-- ❌ Bad: No transition -->
<div v-if="isOpen">...</div>
```

**3. Consistent Z-Index Strategy**
```css
/* Global z-index scale */
:root {
  --z-dropdown: 1000;
  --z-overlay: 1100;
  --z-modal: 1200;
  --z-toast: 1300;
}

.overlay-panel {
  z-index: var(--z-overlay);
}
```

**4. Emit Close Events (Don't Mutate Props)**
```vue
<!-- ✅ Good: Emit event -->
<script setup>
const emit = defineEmits(['close'])
function handleClose() {
  emit('close')
}
</script>

<!-- ❌ Bad: Mutate v-model directly -->
<script setup>
const isOpen = defineModel()
function handleClose() {
  isOpen.value = false  // Avoid
}
</script>
```

**5. Keyboard Accessibility**
```vue
<script setup>
onMounted(() => {
  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close')
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => window.removeEventListener('keydown', handleEscape))
})
</script>
```

**6. Theme Isolation for Panels**
```vue
<!-- ✅ Good: Override page theme with system defaults -->
<script setup>
import { computed } from 'vue'

const panelStyles = computed(() => ({
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-dimmed': 'var(--system-dimmed, #6b7280)',
  '--color-primary-bg': 'var(--system-primary, #3b82f6)',
  '--color-inverted': '0' // Always non-inverted
}))
</script>

<template>
  <div class="panel" :style="panelStyles">
    <!-- Panel inherits system theme, not page theme -->
  </div>
</template>

<!-- ❌ Bad: Inherit page theme -->
<template>
  <div class="panel">
    <!-- Will use page's custom theme, can be unreadable -->
  </div>
</template>
```

**Why Theme Isolation Matters:**
- **Editor UI consistency:** EditPanel should look the same whether editing a dark-themed project or light-themed one
- **Readability:** Prevents forms/controls from becoming unreadable on custom themed pages
- **Predictability:** Users expect editor interfaces to have standard appearance
- **Floating Vue caveat:** Tooltips/dropdowns may inherit page theme, need explicit override

---

## Theme Isolation Deep Dive

### The Problem

In this application, pages can have custom themes applied via `useTheme()` composable. When a user edits content on a themed page:
- The **page content** should display with the selected theme (dark, colorful, etc.)
- The **editor panels** (EditPanel, NavigationConfigPanel) should always use the default system theme
- **Floating elements** (tooltips, dropdowns) should also use system theme, not page theme

Without proper isolation, editor panels inherit page theme CSS variables, leading to:
- Dark form inputs on dark backgrounds (unreadable)
- Inverted colors breaking form UI
- Inconsistent editor appearance across different pages

### The Solution: System Theme Variables

**Root CSS Variables:**
```css
:root {
  /* System defaults (never change) */
  --system-bg: #ffffff;
  --system-card-bg: #ffffff;
  --system-border: #e5e7eb;
  --system-contrast: #1f2937;
  --system-dimmed: #6b7280;
  --system-primary: #3b82f6;
  
  /* Page theme (changes via useTheme) */
  --color-bg: var(--system-bg);
  --color-card-bg: var(--system-card-bg);
  /* ... etc */
}
```

**Panel Implementation:**
```vue
<script setup>
const panelStyles = computed(() => ({
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-inverted': '0' // Force non-inverted
}))
</script>

<template>
  <div class="panel" :style="panelStyles">
    <!-- Uses system theme regardless of page theme -->
  </div>
</template>
```

### Applying to Floating Vue (TODO)

Currently, Floating Vue elements may inherit page theme. To fix:

**Option 1: Custom Theme with CSS Variables**
```javascript
// In main app setup
app.use(FloatingVue, {
  themes: {
    'system-tooltip': {
      $extend: 'tooltip',
    },
    'system-dropdown': {
      $extend: 'dropdown',
    }
  }
})
```

```css
/* Global styles */
.v-popper--theme-system-tooltip .v-popper__inner,
.v-popper--theme-system-dropdown .v-popper__inner {
  --color-bg: var(--system-bg, #ffffff) !important;
  --color-card-bg: var(--system-card-bg, #ffffff) !important;
  --color-border: var(--system-border, #e5e7eb) !important;
  --color-contrast: var(--system-contrast, #1f2937) !important;
  --color-inverted: 0 !important;
  
  background: var(--color-bg);
  color: var(--color-contrast);
  border: 1px solid var(--color-border);
}
```

**Option 2: Wrapper Component**
```vue
<!-- SystemTooltip.vue -->
<template>
  <VTooltip theme="system-tooltip" v-bind="$attrs">
    <slot></slot>
    <template #popper>
      <div :style="systemStyles">
        <slot name="popper"></slot>
      </div>
    </template>
  </VTooltip>
</template>

<script setup>
const systemStyles = {
  '--color-inverted': '0',
  // ... other system vars
}
</script>
```

**Usage:**
```vue
<!-- Instead of VTooltip, use SystemTooltip -->
<SystemTooltip>
  <button>Hover me</button>
  <template #popper>This tooltip always uses system theme</template>
</SystemTooltip>
```

---

## Overview

This guide documents the usage of [Floating Vue](https://floating-vue.starpad.dev/) in the demo-data project. Floating Vue is a Vue 3 library built on top of Floating UI that provides tooltips, dropdowns, popovers, and menus with intelligent auto-positioning, collision detection, and accessibility features.

**Current Version:** 5.2.2

**Why Floating Vue?**
- ✅ Vue 3 native with Composition API support
- ✅ Auto-positioning with viewport collision detection
- ✅ Built-in teleport (avoids parent overflow clipping)
- ✅ Consistent API across all floating components
- ✅ Accessibility (ARIA, keyboard navigation) included
- ✅ Theming system for customization
- ✅ TypeScript support

---

## Current Implementations

### 1. EditPanel Component

**File:** `src/components/EditPanel.vue`

**Purpose:** Full-height side panel for editing project/post/event content.

**Key Features:**
- Fixed positioning with `strategy="fixed"` for viewport-relative placement
- Manually controlled via `:shown="isOpen"` prop
- Disabled auto-hide with `:auto-hide="false"`
- Empty triggers array `:triggers="[]"` (controlled programmatically)
- Custom theme `theme="edit-panel"` for styling

**Usage Pattern:**
```vue
<template>
  <EditPanel
    :is-open="panelOpen"
    :panel-size="'large'"
    title="Edit Project"
    subtitle="Update project details"
    :initial-data="projectData"
    @close="panelOpen = false"
    @save="handleSave"
  />
</template>

<script setup>
const panelOpen = ref(false)

function handleSave(formData) {
  // Save to API
  await $fetch(`/api/projects/${id}`, {
    method: 'PUT',
    body: formData
  })
  panelOpen.value = false
}
</script>
```

**Implementation Details:**
```vue
<!-- EditPanel.vue -->
<template>
  <VDropdown 
    :shown="isOpen" 
    :auto-hide="false" 
    :placement="placement" 
    theme="edit-panel" 
    :triggers="[]" 
    :distance="0"
    strategy="fixed" 
    @apply-hide="$emit('close')">
    
    <!-- Invisible anchor (fixed top-right) -->
    <div ref="anchorRef" style="position: fixed; top: 0; right: 0; width: 0; height: 0;"></div>

    <template #popper="{ hide }">
      <div class="edit-panel">
        <!-- Panel content -->
      </div>
    </template>
  </VDropdown>
</template>
```

**Responsive Sizing:**
- Mobile (< 768px): 100vw (full width)
- Tablet (768px - 1024px): 25rem (400px)
- Desktop (> 1024px): 37.5rem (600px)

**Extension Mechanism:**
```vue
<!-- Add custom fields via slot -->
<EditPanel ...>
  <template #extension-fields="{ formData }">
    <div class="form-group">
      <label>Event Date</label>
      <input v-model="formData.event_date" type="date" />
    </div>
  </template>
</EditPanel>
```

---

### 2. Navigation Menus (To Be Refactored)

#### Current State: Manual Implementation

**UserMenu.vue** and **AdminMenu.vue** currently use manual implementations with:
- Custom click-outside detection (`handleClickOutside`)
- Fixed positioning with placement logic
- Manual z-index management
- No collision detection or auto-adjustment

**Problems:**
- Code duplication (~200 lines per component)
- Inconsistent behavior across menus
- Mobile responsiveness requires complex media queries
- Dropdowns can overflow viewport
- No teleport (can be clipped by parent `overflow: hidden`)

#### Recommended Refactor: Floating Vue

**Benefits:**
- Reduce code by ~60% per component
- Consistent API and behavior
- Auto-handles click-outside
- Viewport collision detection
- Mobile-responsive by default
- Proper z-index stacking

**Implementation Example:**

**Before (Manual):**
```vue
<!-- UserMenu.vue (current) -->
<template>
  <div class="user-menu-wrapper" ref="userMenuRef">
    <button @click="toggleMenu">👤 {{ username }}</button>
    
    <div v-if="isOpen" class="user-menu" :class="`user-menu-${placement}`">
      <!-- Menu content -->
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false)
const userMenuRef = ref()

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
```

**After (Floating Vue):**
```vue
<!-- UserMenu.vue (proposed) -->
<template>
  <VDropdown theme="user-menu" :distance="8">
    <button class="user-menu-button">
      👤 {{ username }}
    </button>

    <template #popper="{ hide }">
      <div class="user-menu-content">
        <!-- Menu content -->
        <button @click="handleLogout(hide)">Abmelden</button>
      </div>
    </template>
  </VDropdown>
</template>

<script setup>
// No manual state management needed!
function handleLogout(hide) {
  emit('logout')
  hide() // Close dropdown
}
</script>
```

**Reduction:** 105 lines → 45 lines (57% smaller)

---

## Theme Configuration

Floating Vue uses a theme system for consistent styling across components.

**Global Setup** (`src/app.ts`):
```typescript
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

app.use(FloatingVue, {
  themes: {
    // Edit Panel Theme
    'edit-panel': {
      $extend: 'dropdown',
      placement: 'right',
      distance: 0,
      computeTransformOrigin: true,
      autoHide: false
    },
    
    // User Menu Theme (proposed)
    'user-menu': {
      $extend: 'dropdown',
      placement: 'bottom-end',
      distance: 8,
      triggers: ['click'],
      autoHide: true
    },
    
    // Admin Menu Theme (proposed)
    'admin-menu': {
      $extend: 'dropdown',
      placement: 'bottom-end',
      distance: 8,
      triggers: ['click'],
      autoHide: true
    },
    
    // Tooltip Theme (proposed)
    'info-tooltip': {
      $extend: 'tooltip',
      placement: 'top',
      distance: 6,
      triggers: ['hover', 'focus'],
      delay: { show: 300, hide: 0 }
    }
  }
})
```

**Custom Styles** (override default styles):
```css
/* src/assets/css/floating-vue-overrides.css */

/* Edit Panel */
.v-popper--theme-edit-panel .v-popper__inner {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  padding: 0;
}

/* User Menu */
.v-popper--theme-user-menu .v-popper__inner {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-dropdown);
  min-width: 16rem;
}

/* Tooltips */
.v-popper--theme-info-tooltip .v-popper__inner {
  background: var(--color-tooltip-bg, #333);
  color: var(--color-tooltip-text, #fff);
  border-radius: var(--radius-small);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.v-popper--theme-info-tooltip .v-popper__arrow-inner {
  border-color: var(--color-tooltip-bg, #333);
}
```

---

## Component API Reference

### VDropdown

**Purpose:** Dropdown menus, select boxes, context menus.

**Props:**
```typescript
interface VDropdownProps {
  shown?: boolean           // Manual control (use with :shown)
  triggers?: string[]       // ['click', 'hover', 'focus'] or []
  autoHide?: boolean        // Auto-close on click outside
  placement?: Placement     // 'top', 'bottom', 'left', 'right', + '-start'/'-end'
  distance?: number         // Pixel distance from anchor
  skidding?: number         // Horizontal offset
  strategy?: 'absolute' | 'fixed'  // Positioning strategy
  theme?: string            // Custom theme name
  disabled?: boolean        // Disable dropdown
}
```

**Events:**
```typescript
interface VDropdownEvents {
  'apply-show': () => void   // Before opening
  'apply-hide': () => void   // Before closing
  'update:shown': (value: boolean) => void  // Two-way binding
}
```

**Template Slots:**
```vue
<VDropdown>
  <!-- Default slot: Trigger element -->
  <button>Click me</button>

  <!-- Popper slot: Dropdown content -->
  <template #popper="{ hide, show, isShown }">
    <div>
      <p>Dropdown content</p>
      <button @click="hide()">Close</button>
    </div>
  </template>
</VDropdown>
```

---

### VTooltip (Directive)

**Purpose:** Contextual help text on hover/focus.

**Basic Usage:**
```vue
<button v-tooltip="'This is a tooltip'">
  Hover me
</button>
```

**Advanced Usage:**
```vue
<button v-tooltip="{
  content: 'This is a tooltip',
  placement: 'top',
  theme: 'info-tooltip',
  triggers: ['hover', 'focus'],
  delay: { show: 300, hide: 0 }
}">
  Hover me
</button>
```

**HTML Content:**
```vue
<button v-tooltip.html="tooltipContent">
  Hover me
</button>

<script setup>
const tooltipContent = ref('<strong>Bold</strong> text')
</script>
```

---

### VMenu

**Purpose:** Context menus, right-click menus.

**Usage:**
```vue
<VMenu>
  <button>Right-click me</button>

  <template #popper>
    <div class="context-menu">
      <button @click="handleEdit">✏️ Edit</button>
      <button @click="handleDelete">🗑️ Delete</button>
      <button @click="handleShare">🔗 Share</button>
    </div>
  </template>
</VMenu>
```

**Custom Trigger (right-click):**
```vue
<VMenu :triggers="['contextmenu']">
  <div @contextmenu.prevent>Right-click this area</div>
  
  <template #popper>
    <!-- Context menu items -->
  </template>
</VMenu>
```

---

## Implementation Examples

### Example 1: Quick Actions Dropdown

```vue
<template>
  <VDropdown theme="action-menu" placement="bottom-end">
    <Button icon="more-horizontal">Actions</Button>

    <template #popper="{ hide }">
      <div class="action-menu">
        <button class="action-item" @click="handleAction('edit', hide)">
          ✏️ Edit
        </button>
        <button class="action-item" @click="handleAction('duplicate', hide)">
          📋 Duplicate
        </button>
        <div class="action-divider"></div>
        <button class="action-item danger" @click="handleAction('delete', hide)">
          🗑️ Delete
        </button>
      </div>
    </template>
  </VDropdown>
</template>

<script setup>
function handleAction(action, hide) {
  emit('action', action)
  hide()
}
</script>

<style scoped>
.action-menu {
  padding: 0.5rem;
  min-width: 10rem;
}

.action-item {
  width: 100%;
  padding: 0.625rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-small);
  cursor: pointer;
  transition: background 0.2s;
}

.action-item:hover {
  background: var(--color-muted-bg);
}

.action-item.danger {
  color: var(--color-danger);
}

.action-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.5rem 0;
}
</style>
```

---

### Example 2: Form Field Tooltip

```vue
<template>
  <div class="form-group">
    <label>
      API Key
      <span v-tooltip="{
        content: 'Your API key is used to authenticate requests. Keep it secure!',
        placement: 'top',
        theme: 'info-tooltip'
      }" class="info-icon">
        ℹ️
      </span>
    </label>
    <input v-model="apiKey" type="password" />
  </div>
</template>

<style scoped>
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-left: 0.25rem;
  cursor: help;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.info-icon:hover {
  opacity: 1;
}
</style>
```

---

### Example 3: Nested Dropdown Menu

```vue
<template>
  <VDropdown theme="main-menu" placement="bottom-start">
    <button class="menu-button">☰ Menu</button>

    <template #popper>
      <div class="menu-content">
        <RouterLink to="/dashboard" class="menu-item">
          📊 Dashboard
        </RouterLink>
        
        <!-- Nested submenu -->
        <VDropdown theme="submenu" placement="right-start" :distance="0">
          <button class="menu-item">
            📁 Projects
            <span class="arrow">›</span>
          </button>

          <template #popper>
            <div class="submenu-content">
              <RouterLink to="/projects/active" class="menu-item">
                Active Projects
              </RouterLink>
              <RouterLink to="/projects/archived" class="menu-item">
                Archived
              </RouterLink>
            </div>
          </template>
        </VDropdown>

        <RouterLink to="/settings" class="menu-item">
          ⚙️ Settings
        </RouterLink>
      </div>
    </template>
  </VDropdown>
</template>
```

---

## Post-it Component + Floating Vue Ideas

The existing `pPostit` component can be enhanced with Floating Vue for interactive features:

### Idea 1: Expandable Post-its

**Concept:** Post-its show abbreviated content, click to expand full details.

```vue
<template>
  <VDropdown 
    theme="postit-expand" 
    placement="auto"
    :triggers="['click']"
    :distance="12">
    
    <!-- Collapsed post-it (trigger) -->
    <div class="postit-compact" :class="`postit-${color}`">
      <h4>{{ title }}</h4>
      <p class="postit-preview">{{ truncatedContent }}</p>
      <span class="expand-hint">Click to expand...</span>
    </div>

    <!-- Expanded content (popper) -->
    <template #popper="{ hide }">
      <div class="postit-expanded">
        <div class="postit-header">
          <h3>{{ title }}</h3>
          <button @click="hide()" class="close-btn">×</button>
        </div>
        <div class="postit-body" v-html="content"></div>
        <div class="postit-footer">
          <button @click="handleAction('edit', hide)">✏️ Edit</button>
          <button @click="handleAction('share', hide)">🔗 Share</button>
        </div>
      </div>
    </template>
  </VDropdown>
</template>

<script setup>
const truncatedContent = computed(() => {
  const text = stripHtml(props.content)
  return text.length > 100 ? text.slice(0, 100) + '...' : text
})
</script>
```

**Use Case:** Landing pages with multiple announcements that don't clutter the layout.

---

### Idea 2: Annotated Post-its

**Concept:** Post-it appears when hovering specific page elements (e.g., terms, icons).

```vue
<template>
  <span 
    v-tooltip="{
      content: postitContent,
      theme: 'postit-annotation',
      placement: 'top',
      triggers: ['hover', 'click'],
      html: true,
      delay: { show: 400, hide: 100 }
    }"
    class="annotated-term">
    {{ term }}
  </span>
</template>

<script setup>
const props = defineProps<{
  term: string
  definition: string
  color?: string
}>()

const postitContent = computed(() => `
  <div class="postit-tooltip postit-${props.color || 'yellow'}">
    <strong>${props.term}</strong>
    <p>${props.definition}</p>
  </div>
`)
</script>

<style>
.annotated-term {
  text-decoration: underline dotted;
  cursor: help;
}

.postit-tooltip {
  max-width: 20rem;
  padding: 1rem;
  border-left: 4px solid currentColor;
}
</style>
```

**Use Case:** Educational content, glossaries, inline help.

---

### Idea 3: Interactive Checklists

**Concept:** Post-it contains a checklist that users can interact with.

```vue
<template>
  <VDropdown 
    :shown="isOpen"
    :auto-hide="false"
    theme="postit-checklist"
    placement="right">
    
    <div class="postit-trigger" @click="isOpen = true">
      <h4>📝 {{ title }}</h4>
      <div class="checklist-progress">
        {{ completedCount }}/{{ items.length }} completed
      </div>
    </div>

    <template #popper="{ hide }">
      <div class="postit-checklist">
        <div class="checklist-header">
          <h3>{{ title }}</h3>
          <button @click="hide(); isOpen = false" class="close-btn">×</button>
        </div>
        
        <ul class="checklist-items">
          <li v-for="(item, index) in items" :key="index" class="checklist-item">
            <label>
              <input 
                type="checkbox" 
                v-model="item.completed"
                @change="saveProgress" />
              <span :class="{ completed: item.completed }">
                {{ item.text }}
              </span>
            </label>
          </li>
        </ul>
        
        <div class="checklist-footer">
          <button @click="resetAll">Reset All</button>
        </div>
      </div>
    </template>
  </VDropdown>
</template>

<script setup>
const isOpen = ref(false)
const items = ref([
  { text: 'Complete profile', completed: false },
  { text: 'Upload photo', completed: false },
  { text: 'Verify email', completed: true }
])

const completedCount = computed(() => 
  items.value.filter(i => i.completed).length
)

function saveProgress() {
  localStorage.setItem('checklist', JSON.stringify(items.value))
}
</script>
```

**Use Case:** Onboarding flows, project milestones, event preparation.

---

### Idea 4: Floating Contextual Help

**Concept:** Post-its appear near relevant UI elements when users need help.

```vue
<template>
  <div class="help-zone" ref="helpZoneRef">
    <!-- Complex UI element -->
    <ProjectForm />

    <!-- Floating help post-its -->
    <VDropdown 
      v-for="(help, index) in contextualHelp"
      :key="index"
      :shown="help.isVisible"
      :auto-hide="false"
      theme="postit-help"
      :placement="help.placement"
      :reference-element="() => getHelpAnchor(help.targetSelector)">
      
      <template #popper>
        <div class="postit-help" :class="`postit-${help.color}`">
          <button @click="dismissHelp(index)" class="dismiss-btn">×</button>
          <h4>{{ help.title }}</h4>
          <p v-html="help.content"></p>
          <button @click="dismissHelp(index)" class="got-it-btn">
            Got it!
          </button>
        </div>
      </template>
    </VDropdown>
  </div>
</template>

<script setup>
const contextualHelp = ref([
  {
    targetSelector: '#project-name-input',
    title: '💡 Naming Tip',
    content: 'Use descriptive names that reflect the project goals.',
    color: 'blue',
    placement: 'top',
    isVisible: true
  },
  {
    targetSelector: '#date-picker',
    title: '📅 Date Format',
    content: 'Dates must be in YYYY-MM-DD format.',
    color: 'yellow',
    placement: 'right',
    isVisible: true
  }
])

function getHelpAnchor(selector) {
  return document.querySelector(selector)
}

function dismissHelp(index) {
  contextualHelp.value[index].isVisible = false
  localStorage.setItem(`help-dismissed-${index}`, 'true')
}
</script>
```

**Use Case:** First-time user guidance, feature tours, complex forms.

---

### Idea 5: Collaborative Post-its

**Concept:** Users can add post-it notes to pages for team collaboration.

```vue
<template>
  <div class="page-content" @dblclick="createPostit">
    <!-- Page content -->
    <Prose v-html="content" />

    <!-- User-created post-its -->
    <VDropdown
      v-for="note in notes"
      :key="note.id"
      theme="postit-collab"
      :shown="note.id === editingId"
      :auto-hide="false"
      :triggers="['click']"
      :reference-element="() => getPostItElement(note.id)">
      
      <div 
        class="postit-marker"
        :style="{
          position: 'absolute',
          top: note.y + 'px',
          left: note.x + 'px'
        }"
        @click="editingId = note.id">
        📌
      </div>

      <template #popper="{ hide }">
        <div class="postit-editor" :class="`postit-${note.color}`">
          <textarea 
            v-model="note.text" 
            @blur="saveNote(note.id, hide)"
            placeholder="Add your note..."
            rows="4"></textarea>
          <div class="postit-meta">
            <span>by {{ note.author }}</span>
            <button @click="deleteNote(note.id, hide)">Delete</button>
          </div>
        </div>
      </template>
    </VDropdown>
  </div>
</template>

<script setup>
const notes = ref([])
const editingId = ref(null)

function createPostit(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const newNote = {
    id: Date.now(),
    x, y,
    text: '',
    author: currentUser.value.username,
    color: 'yellow',
    createdAt: new Date()
  }
  
  notes.value.push(newNote)
  editingId.value = newNote.id
}

async function saveNote(id, hide) {
  await $fetch('/api/notes', {
    method: 'POST',
    body: notes.value.find(n => n.id === id)
  })
  hide()
  editingId.value = null
}
</script>
```

**Use Case:** Team reviews, content feedback, collaborative editing.

---

## Refactoring Roadmap

### Phase 1: Low-Risk Additions (No Breaking Changes)

**Timeline:** 1-2 days

1. **Add Tooltip Directive**
   - Add v-tooltip to info icons throughout app
   - Create consistent tooltip theme
   - Document usage patterns

2. **Create New Dropdown Components**
   - Quick actions menu (edit/delete/share)
   - Date picker dropdown
   - Color picker dropdown

**Outcome:** New features without touching existing code.

---

### Phase 2: EditPanel Enhancement (Low Risk)

**Timeline:** 1 day

1. **Add Tooltips to EditPanel Form Fields**
   - Field validation hints
   - Format examples
   - Help icons with tooltips

2. **Create EditPanel Variants**
   - `EditPanelEvent` (with date fields + tooltips)
   - `EditPanelPost` (with category dropdown)
   - `EditPanelProject` (with member selector dropdown)

**Outcome:** Better UX for EditPanel without changing architecture.

---

### Phase 3: Menu Refactor (Medium Risk)

**Timeline:** 3-4 days

1. **Refactor UserMenu.vue**
   - Replace manual implementation with VDropdown
   - Test on all breakpoints
   - Ensure slots still work (role-toggle, theme-dropdown)

2. **Refactor AdminMenu.vue**
   - Same approach as UserMenu
   - Verify all admin actions still work
   - Test nested dropdowns (if any)

3. **Refactor ProjectToggle.vue**
   - Convert to VDropdown
   - Maintain existing functionality

**Outcome:** 60% less code, consistent behavior, better mobile support.

---

### Phase 4: Post-it Enhancements (Optional)

**Timeline:** 2-3 days

1. **Expandable Post-its**
   - Implement click-to-expand for long content
   - Add animation transitions

2. **Annotated Post-its**
   - Create annotation component for glossary terms
   - Integrate with existing content

3. **Interactive Post-its**
   - Checklist variant
   - Form variant (quick input)

**Outcome:** More engaging user interactions.

---

## Best Practices

### 1. Always Use Themes
```vue
<!-- ❌ Bad: Inline styles -->
<VDropdown placement="bottom" :distance="8" ...>

<!-- ✅ Good: Use themes -->
<VDropdown theme="user-menu">
```

### 2. Provide Hide Function to Actions
```vue
<template #popper="{ hide }">
  <!-- Always pass hide to action handlers -->
  <button @click="handleAction(hide)">Action</button>
</template>
```

### 3. Disable During Loading
```vue
<VDropdown :disabled="isLoading">
  <Button :loading="isLoading">Actions</Button>
  <!-- ... -->
</VDropdown>
```

### 4. Use Auto-Hide Appropriately
```vue
<!-- ✅ Good: Menus should auto-hide -->
<VDropdown :auto-hide="true" theme="action-menu">

<!-- ✅ Good: Panels should NOT auto-hide -->
<VDropdown :auto-hide="false" theme="edit-panel">
```

### 5. Provide Manual Control When Needed
```vue
<!-- Two-way binding for programmatic control -->
<VDropdown v-model:shown="dropdownOpen">
  <!-- Can control from outside -->
</VDropdown>

<button @click="dropdownOpen = true">Open dropdown</button>
```

### 6. Handle Accessibility
```vue
<!-- Floating Vue handles most ARIA automatically, but add where needed -->
<VDropdown>
  <button aria-label="User menu">
    👤
  </button>
  <!-- ... -->
</VDropdown>
```

---

## Troubleshooting

### Issue: Dropdown Clipped by Parent

**Problem:** Dropdown is cut off by parent's `overflow: hidden`.

**Solution:** Floating Vue teleports by default, but verify:
```vue
<!-- Ensure no :no-teleport prop -->
<VDropdown :no-teleport="false">
```

---

### Issue: Dropdown Wrong Position

**Problem:** Dropdown appears in unexpected location.

**Solution:** Check positioning strategy:
```vue
<!-- For fixed-position triggers -->
<VDropdown strategy="fixed">

<!-- For absolute-position triggers (default) -->
<VDropdown strategy="absolute">
```

---

### Issue: Click Outside Not Working

**Problem:** Dropdown doesn't close when clicking outside.

**Solution:** Ensure auto-hide is enabled:
```vue
<VDropdown :auto-hide="true">
```

---

### Issue: Z-Index Conflicts

**Problem:** Dropdown appears behind other elements.

**Solution:** Adjust z-index in theme:
```css
.v-popper--theme-my-theme {
  z-index: 1000; /* Adjust as needed */
}
```

---

### Issue: Mobile Responsiveness

**Problem:** Dropdown too large/small on mobile.

**Solution:** Use responsive widths in CSS:
```css
.v-popper--theme-my-menu .v-popper__inner {
  width: 90vw;
  max-width: 20rem;
}
```

---

## Performance Considerations

### 1. Lazy Loading Content

```vue
<VDropdown>
  <button>Load data</button>
  
  <template #popper>
    <Suspense>
      <AsyncContent />
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense>
  </template>
</VDropdown>
```

### 2. Limit Active Dropdowns

```vue
<!-- Close other dropdowns when opening new one -->
<script setup>
const activeDropdown = ref(null)

function openDropdown(id) {
  activeDropdown.value = id
}
</script>

<VDropdown v-model:shown="activeDropdown === 'menu1'">
<VDropdown v-model:shown="activeDropdown === 'menu2'">
```

### 3. Debounce Tooltip Shows

```vue
<span v-tooltip="{
  content: 'Tooltip',
  delay: { show: 300, hide: 0 } // Wait 300ms before showing
}">
  Hover me
</span>
```

---

## Quick Reference

### When to Use What

| Use Case | Solution | Implementation |
|----------|----------|----------------|
| Full-height editor panel | BasePanel (Pattern 1) | `<BasePanel :is-open="isOpen">` |
| Config/settings panel | BasePanel (Pattern 1) | `<BasePanel :is-open="isOpen">` |
| Tooltip on hover | VTooltip | `<VTooltip>` with system theme |
| Action menu (3-dot) | VDropdown | `<VDropdown>` with system theme |
| Date picker | VDropdown | `<VDropdown>` with custom content |
| Context menu | VDropdown | `<VDropdown :triggers="['contextmenu']">` |
| Info popover | VTooltip/VDropdown | Depends on interaction pattern |

### Theme Checklist for New Panels

- [ ] Uses `<Teleport to="body">`
- [ ] Has `:style="panelStyles"` with system theme vars
- [ ] Sets `--color-inverted: 0`
- [ ] Includes `max-height: 100vh`
- [ ] Has proper z-index (1000-1300 range)
- [ ] Emits close event (not mutating props)
- [ ] Handles Escape key for closing
- [ ] Includes slide/fade transition

### System Theme Variables Reference

```javascript
// Always use these for panels/popovers
const systemTheme = {
  '--color-bg': 'var(--system-bg, #ffffff)',
  '--color-card-bg': 'var(--system-card-bg, #ffffff)',
  '--color-border': 'var(--system-border, #e5e7eb)',
  '--color-contrast': 'var(--system-contrast, #1f2937)',
  '--color-dimmed': 'var(--system-dimmed, #6b7280)',
  '--color-primary-bg': 'var(--system-primary, #3b82f6)',
  '--color-primary-contrast': 'var(--system-primary-contrast, #ffffff)',
  '--color-inverted': '0'
}
```

---

## Resources

- **Official Docs:** https://floating-vue.starpad.dev/
- **Floating UI Docs:** https://floating-ui.com/
- **GitHub:** https://github.com/Akryum/floating-vue
- **Examples:** https://floating-vue.starpad.dev/guide/examples
- **BasePanel Component:** `src/components/BasePanel.vue`
- **EditPanel Example:** `src/components/EditPanel.vue`
- **NavigationConfigPanel Example:** `src/components/NavigationConfigPanel.vue`

---

## Conclusion

Floating Vue provides a robust foundation for all floating UI elements, while **BasePanel pattern** handles fixed overlay panels. The key insight is **theme isolation**: editor interfaces must always use system theme, never inherit page theme.

**Critical Decisions Made:**
1. ✅ Fixed panels use BasePanel (not Floating Vue)
2. ✅ All editor panels override page theme with system theme
3. ✅ `--color-inverted: 0` forced on all panels
4. ⚠️ Floating Vue elements need system theme override (TODO)

**Recommended Next Steps:**
1. ✅ **DONE:** Create BasePanel component with theme isolation
2. ✅ **DONE:** Refactor EditPanel to use BasePanel
3. ✅ **DONE:** Convert NavigationConfigPanel to overlay pattern
4. 🔄 **TODO:** Create system-themed Floating Vue wrappers (SystemTooltip, SystemDropdown)
5. 🔄 **TODO:** Apply system theme to all existing tooltips/dropdowns
6. 📋 **FUTURE:** Add tooltips to form fields for better UX
7. 📋 **FUTURE:** Create quick action menus for cards/rows
