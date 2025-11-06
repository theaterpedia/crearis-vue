# Theming Guide for Code Automation

**Building Theme-Aware Components and CSS**

This guide documents the theming system architecture and best practices for building theme-aware components. The system supports dynamic theme switching, inverted color modes, and semantic color variables for consistent UI design.

---

## A) Color Model Basics: OKLCH Only

### **Critical Rule: OKLCH Color Model**

**Code automation MUST always use the OKLCH color model. Never use HSL or RGB.**

```css
/* ✅ CORRECT - Use OKLCH */
--color-primary-bg: oklch(72.21% 0.2812 144.53);
--color-secondary-bg: oklch(65.74% 0.2393 304.41);

/* ❌ WRONG - Never use HSL or RGB */
--color-primary-bg: hsl(144, 70%, 50%);
--color-primary-bg: rgb(45, 200, 120);
```

**Why OKLCH?**
- Perceptually uniform color space
- Better interpolation for gradients and color mixing
- Consistent lightness across hues
- Future-proof (part of CSS Color Module Level 4)

### CSS Variables System

All color variables are integrated through `styles.ts`:

```typescript
// src/styles.ts
import './assets/css/01-variables.css'  // Core variables
import './assets/css/02-fonts-*.css'     // Font families
import './assets/css/03-base.css'        // Base styles
```

### Using Existing Variables

**Always use project CSS variables:**

```css
/* ✅ CORRECT - Use existing semantic variables */
.my-component {
  background: var(--color-bg);
  color: var(--color-contrast);
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
}

/* ❌ WRONG - Hardcoded values */
.my-component {
  background: #ffffff;
  color: #000000;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}
```

### Adding New Variables

**If new CSS variables are needed, they should be added to `01-variables.css`.**

Before creating new variables, code automation should:

1. **Check if existing variables can be used**
2. **If new variables are needed, clearly state the proposal**
3. **Provide 2-3 examples of the new variables**
4. **Ask for user confirmation**

**Example Proposal:**

> "I need to create new variables for a specialized component. I propose adding these to `01-variables.css`:
>
> ```css
> /* Notification badge dimensions */
> --badge-size-small: 1rem;
> --badge-size-medium: 1.5rem;
> --badge-size-large: 2rem;
> ```
>
> These will be used for notification badges across multiple components. Should I proceed with this addition?"

---

## B) Theme System Architecture: Backend + Frontend

### Backend: Theme Definitions

Themes are defined in `/server/themes/index.json`:

```json
[{
  "id": 0,
  "name": "E-Motion",
  "description": "A light theme with soft colors",
  "cimg": "https://...",
  "font": "'MonaspaceKrypton', mono",
  "inverted": true
}, {
  "id": 1,
  "name": "Regio",
  "description": "A light theme with soft colors",
  "cimg": "https://...",
  "font": "'MonaspaceNeon', mono"
}]
```

**Key Properties:**

- `id`: Theme identifier (0-7)
- `name`: Display name
- `font`: Primary font-family override
- `headings`: Optional heading font override
- `inverted`: Boolean flag for color inversion support

### Frontend: useTheme Composable

The `useTheme.ts` composable manages theme state and CSS variable application:

```typescript
// Singleton state - shared across all instances
const currentThemeId = ref<number | null>(null)
const themesCache = ref<any[]>([])
const themeVarsCache = ref<Map<number, Record<string, string>>>(new Map())
const isInverted = ref<boolean>(false)
```

**Core Functions:**

1. **`setTheme(id: number | null)`** - Apply theme or revert to default
2. **`setInverted(inverted: boolean)`** - Toggle inverted colors
3. **`applyVarsToDocument(vars)`** - Apply CSS vars to :root
4. **`init()`** - Initialize theme system

### How Themes Are Evaluated

**Step 1: Theme Selection**

```typescript
// User selects theme
await setTheme(0) // E-Motion theme

// useTheme fetches theme CSS vars from /api/themes/0/vars
const vars = await getThemeVars(0)
// Returns: { '--font': "'MonaspaceKrypton', mono", ... }
```

**Step 2: CSS Variable Application**

```typescript
const applyVarsToDocument = (vars: ThemeVars) => {
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}
```

**Step 3: Component Reactivity**

Components using CSS variables automatically update:

```vue
<style scoped>
.my-component {
  /* Automatically uses new theme value */
  font-family: var(--font);
  background: var(--color-primary-bg);
}
</style>
```

### The --color-inverted Variable

**Purpose:** Enables dynamic color inversion without redefining all color variables.

**How It Works:**

1. **Default Definition** (in `00-theme.css`):

```css
:root {
  /* 0 = light mode, 1 = dark mode */
  --color-inverted: 0;
}

:root[data-inverted="true"] {
  --color-inverted: 1 !important;
}
```

2. **Theme Declares Inversion Support** (`index.json`):

```json
{
  "id": 0,
  "name": "E-Motion",
  "inverted": true  // This theme supports inversion
}
```

3. **Frontend Applies Inversion**:

```typescript
const setInverted = (inverted: boolean): void => {
  isInverted.value = inverted
  applyInvertedToDocument()
}

const applyInvertedToDocument = (): void => {
  const root = document.documentElement
  root.setAttribute('data-inverted', isInverted.value ? 'true' : 'false')
}
```

4. **Components Use Inversion**:

```css
.component {
  /* Uses OKLCH with opacity for filter effects */
  filter: invert(var(--color-inverted));
}

/* Or conditional styling */
:root[data-inverted="true"] .component {
  /* Inverted-specific styles */
}
```

**SSR + Browser Enhancement:**

- **SSR:** Initial HTML renders with default theme CSS (`00-theme.css`)
- **Browser:** `useTheme.init()` loads theme preferences and applies dynamically
- **Hydration:** Vue components receive reactive theme variables
- **Inversion:** Applied via data attribute, works with SSR-rendered content

---

## C) Semantic Colors: Primary, Secondary, and More

### The Seven Semantic Color Systems

Each semantic color has a **base**, **bg** (background), and **contrast** variant:

1. **Primary** - Main brand color, primary actions
2. **Secondary** - Secondary brand color, alternative actions
3. **Positive** - Success states, confirmations
4. **Negative** - Error states, destructive actions
5. **Warning** - Caution states, alerts
6. **Muted** - Subdued content, disabled states
7. **Accent** - Highlighting, emphasis, alternating rows

### Color Variable Structure

```css
/* Base color - for composition only */
--color-primary-base: oklch(72.21% 0.2812 144.53);

/* Background variant - for component backgrounds */
--color-primary-bg: oklch(72.21% 0.2812 144.53);

/* Contrast variant - for text on primary background */
--color-primary-contrast: oklch(0% 0 0);
```

### Usage Examples

**Example 1: Primary Button**

```vue
<template>
  <button class="btn-primary">Save Changes</button>
</template>

<style scoped>
.btn-primary {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  border: var(--border-button) solid var(--color-primary-bg);
  border-radius: var(--radius-button);
}

.btn-primary:hover {
  /* Slightly darken using OKLCH manipulation */
  background: oklch(from var(--color-primary-bg) calc(l - 0.05) c h);
}
</style>
```

**Example 2: Success Message**

```vue
<template>
  <div class="alert-success">
    <span>✓ Changes saved successfully</span>
  </div>
</template>

<style scoped>
.alert-success {
  background: var(--color-positive-bg);
  color: var(--color-positive-contrast);
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  border-left: 3px solid var(--color-positive-contrast);
}
</style>
```

**Example 3: Warning Banner**

```vue
<template>
  <div class="banner-warning">
    <span>⚠ This action cannot be undone</span>
  </div>
</template>

<style scoped>
.banner-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-contrast);
  padding: 1rem;
  border-radius: var(--radius);
}
</style>
```

**Example 4: Disabled Input**

```vue
<template>
  <input class="input-disabled" disabled />
</template>

<style scoped>
.input-disabled {
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
```

**Example 5: Accent Highlighting**

From `ProjectStepUsers.vue`:

```vue
<style scoped>
.tab-button.active {
  /* Uses project-specific accent (could use --color-accent-bg) */
  color: var(--color-project);
  border-bottom-color: var(--color-project);
}
</style>
```

---

## D) Grey Models, Base, Background, and Contrast

### Two Grey Models

**1. Neutral Base** - For background composition:

```css
--color-neutral-base: oklch(88.45% 0 0);
```

**Use Case:** Composing new background colors, subtle backgrounds

```css
/* Compose a soft background */
.subtle-section {
  background: oklch(from var(--color-neutral-base) l 0 0);
}
```

**2. Gray Base** - For borders and grey-accented backgrounds:

```css
--color-gray-base: oklch(55.47% 0 0);
```

**Use Case:** Borders, dividers, grey text

```css
.divider {
  border-bottom: var(--border) solid oklch(from var(--color-gray-base) l 0 0 / 0.2);
}
```

### Base vs. BG vs. Contrast

**Architecture:**

```
--color-semantic-base      → For composition only (rarely used directly)
--color-semantic-bg        → For component backgrounds
--color-semantic-contrast  → For text/icons on semantic-bg
```

**Rules:**

1. **Never use `-base` directly in components** - Only for composing new colors
2. **Use `-bg` for backgrounds** - These are optimized for visual hierarchy
3. **Use `-contrast` for foreground** - Guaranteed readable on matching `-bg`
4. **Avoid hardcoded 'white' and 'black'** - Use semantic equivalents

### Correct Usage Patterns

**✅ CORRECT - Semantic BG and Contrast:**

```css
.card {
  background: var(--color-card-bg);
  color: var(--color-card-contrast);
}

.button {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
}

/* For general page background */
.page {
  background: var(--color-bg);
  color: var(--color-contrast);
}
```

**❌ WRONG - Using base or hardcoded colors:**

```css
.card {
  background: var(--color-primary-base); /* Base is for composition */
  color: white; /* Use --color-primary-contrast */
}

.page {
  background: #ffffff; /* Use var(--color-bg) */
  color: #000000; /* Use var(--color-contrast) */
}
```

### Using --color-dimmed

**Rule:** If `--color-dimmed` is used, pair it properly with bg/contrast:

**Pattern 1: Dimmed Foreground**

```css
.secondary-text {
  background: var(--color-bg); /* Default background */
  color: var(--color-dimmed);  /* Dimmed foreground */
}
```

From `UsersConfigPanel.vue`:

```vue
<style scoped>
.panel-description {
  font-size: 0.875rem;
  color: var(--color-dimmed);
  /* Implicit: background is var(--color-bg) from parent */
}
</style>
```

**Pattern 2: Dimmed Background**

```css
.readonly-input {
  background: var(--color-dimmed); /* Dimmed background */
  color: var(--color-contrast);    /* High contrast text */
}
```

**❌ WRONG - Dimmed on dimmed:**

```css
.low-contrast {
  background: var(--color-dimmed);
  color: var(--color-dimmed); /* Unreadable! */
}
```

### Composing New Colors (Advanced)

**When to compose:**
- Creating hover states
- Generating subtle variations
- Building gradients

**How to compose with OKLCH:**

```css
/* Lighten a color */
.hover-state {
  background: oklch(from var(--color-primary-bg) calc(l + 0.1) c h);
}

/* Add transparency */
.overlay {
  background: oklch(from var(--color-bg) l c h / 0.9);
}

/* Desaturate */
.muted-variant {
  background: oklch(from var(--color-secondary-bg) l calc(c * 0.5) h);
}
```

**Prefer semantic colors over composition:**

```css
/* ✅ Better - use existing semantic color */
.subtle-bg {
  background: var(--color-muted-bg);
}

/* ⚠️ Less ideal - composition is harder to theme */
.subtle-bg {
  background: oklch(from var(--color-neutral-base) calc(l + 0.05) 0 0);
}
```

---

## E) Color-Switching Wrapper Components

### Strategy: Redefine CSS Variables at Component Level

**Concept:** Some components act as "theme wrappers" that redefine semantic variables, allowing child components to automatically adapt.

### Example: Creative Components (Post-Its, Cards)

**Wrapper Component Pattern:**

```vue
<template>
  <div class="postit-wrapper" :class="`postit-${color}`">
    <Prose>
      <slot />
    </Prose>
  </div>
</template>

<script setup lang="ts">
import Prose from './Prose.vue'

defineProps({
  color: {
    type: String as PropType<'yellow' | 'pink' | 'blue' | 'green'>,
    default: 'yellow'
  }
})
</script>

<style scoped>
/* Yellow Post-It: Redefine semantic colors */
.postit-yellow {
  --color-bg: oklch(95% 0.1 85);           /* Warm yellow background */
  --color-contrast: oklch(20% 0 0);         /* Dark text */
  --color-primary-bg: oklch(75% 0.15 85);   /* Darker yellow for highlights */
  --color-primary-contrast: oklch(0% 0 0);
}

/* Pink Post-It */
.postit-pink {
  --color-bg: oklch(92% 0.12 350);
  --color-contrast: oklch(25% 0 0);
  --color-primary-bg: oklch(70% 0.18 350);
  --color-primary-contrast: oklch(0% 0 0);
}

/* Blue Post-It */
.postit-blue {
  --color-bg: oklch(88% 0.08 240);
  --color-contrast: oklch(15% 0 0);
  --color-primary-bg: oklch(65% 0.12 240);
  --color-primary-contrast: oklch(100% 0 0);
}

.postit-wrapper {
  padding: 1.5rem;
  border-radius: var(--radius);
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
  transform: rotate(-1deg);
  background: var(--color-bg);
  color: var(--color-contrast);
}
</style>
```

**How Inner Components Adapt:**

The `Prose.vue` component inside automatically uses redefined variables:

```vue
<!-- Prose.vue - no changes needed! -->
<style scoped>
.prose :where(p) {
  color: var(--color-contrast); /* Uses Post-It's redefined contrast */
}

.prose :where(a) {
  color: var(--color-primary-bg); /* Uses Post-It's redefined primary */
}
</style>
```

**Result:**
- Yellow Post-It → dark text on yellow, brown links
- Blue Post-It → dark text on blue, navy links
- No need to modify Prose.vue!

### Redefining Multiple Semantic Colors

```css
.creative-wrapper {
  /* Redefine entire color system */
  --color-bg: oklch(95% 0.05 180);
  --color-contrast: oklch(10% 0 0);
  
  --color-primary-bg: oklch(60% 0.15 180);
  --color-primary-contrast: oklch(100% 0 0);
  
  --color-secondary-bg: oklch(50% 0.2 280);
  --color-secondary-contrast: oklch(100% 0 0);
  
  --color-muted-bg: oklch(85% 0.02 180);
  --color-muted-contrast: oklch(40% 0 0);
  
  /* Borders and UI elements adapt too */
  --color-border: oklch(from var(--color-bg) calc(l - 0.1) c h);
}
```

---

## F) Color-Switching for Contrasting Content

### Strategy: Accent Colors for Alternating Rows/Columns

**Use Case:** Tables, lists, striped backgrounds

### Pattern: Accent BG + Accent Contrast

```vue
<template>
  <div class="data-table">
    <div class="table-row" v-for="(item, idx) in items" :key="item.id" 
         :class="{ 'row-accent': idx % 2 === 1 }">
      {{ item.name }}
    </div>
  </div>
</template>

<style scoped>
.table-row {
  padding: 0.75rem 1rem;
  background: var(--color-bg);
  color: var(--color-contrast);
}

.table-row.row-accent {
  /* Alternate rows use accent colors */
  background: var(--color-accent-bg);
  color: var(--color-accent-contrast);
}
</style>
```

### Advanced: Column-Based Alternation

```vue
<template>
  <div class="grid-layout">
    <div class="grid-column" v-for="(col, idx) in columns" :key="idx"
         :class="{ 'column-accent': idx % 2 === 1 }">
      <slot :name="`column-${idx}`" />
    </div>
  </div>
</template>

<style scoped>
.grid-column {
  padding: 1rem;
  background: var(--color-card-bg);
  color: var(--color-card-contrast);
}

.grid-column.column-accent {
  background: var(--color-accent-bg);
  color: var(--color-accent-contrast);
}
</style>
```

### Why --color-accent?

**Semantic Purpose:**
- `--color-accent-bg`: Designed for highlighting and alternation
- `--color-accent-contrast`: Optimized for readability on accent-bg
- **Not** as strong as primary/secondary
- **More noticeable** than muted

**Theme Consistency:**
- Themes define accent colors for visual hierarchy
- Alternating rows feel cohesive across themes
- Avoids hardcoded grey/white stripes

---

## G) Radius and Border Variables

### Border Radius System

**Available Variables:**

```css
--radius-none: 0rem;
--radius-small: 0.25rem;
--radius-medium: 0.5rem;
--radius-large: 1rem;

/* Semantic shortcuts (defined per theme) */
--radius: var(--radius-medium);       /* Default radius */
--radius-button: var(--radius-small); /* Button-specific */
--radius-card: var(--radius-medium);  /* Card-specific */
```

**Usage:**

```css
/* General purpose */
.component {
  border-radius: var(--radius);
}

/* Button-specific */
.button {
  border-radius: var(--radius-button);
}

/* Card-specific */
.card {
  border-radius: var(--radius-card);
}
```

### Border Width System

**Available Variables:**

```css
--border-none: none;
--border-small: 0.0625rem;  /* 1px */
--border-medium: 0.125rem;   /* 2px */
--border-large: 0.25rem;     /* 4px */

/* Semantic shortcuts */
--border: var(--border-none);         /* Default border */
--border-button: var(--border-small); /* Button-specific */
```

**Usage:**

```css
/* General border */
.component {
  border: var(--border) solid var(--color-border);
}

/* Button border */
.button {
  border: var(--border-button) solid var(--color-primary-bg);
}

/* Explicit border width */
.thick-border {
  border: var(--border-large) solid var(--color-accent-bg);
}
```

### Complete Button Example

From `ProjectStepUsers.vue`:

```css
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: var(--border-button) solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn {
  background: var(--color-project);
  color: white;
  border-color: var(--color-project);
}

.secondary-btn {
  background: transparent;
  color: var(--color-text);
}
```

**Pattern:**
- Use `--border-button` for border width
- Use `--radius-button` for border radius
- Use semantic colors for fill/stroke
- Theme can control all button styling via these variables

---

## H) Dashboard-Style Layout Pattern

### Architecture: Left Navigation + Central Editing

**Standard Layout Structure:**

```
┌─────────────────────────────────────────────┐
│ Top Navbar (Back, Config, User)            │
├──────────┬──────────────────────────────────┤
│          │                                  │
│  Left    │  Central Content Area            │
│  Nav     │  (Tabs + Panels)                 │
│          │                                  │
│  [Tabs]  │  ┌────────────────────────────┐  │
│          │  │ Horizontal Tabs (2-4)      │  │
│          │  ├────────────────────────────┤  │
│          │  │                            │  │
│          │  │  Panel Content             │  │
│          │  │  (Forms, Lists, Config)    │  │
│          │  │                            │  │
│          │  └────────────────────────────┘  │
└──────────┴──────────────────────────────────┘
```

### Example 1: Basic Two-Panel Layout

From `ProjectMain.vue` structure:

```vue
<template>
  <div class="project-view">
    <!-- Top Navbar -->
    <Navbar>
      <button @click="goBack" class="back-btn">← Back</button>
      <button @click="toggleConfig" class="config-btn">⚙ Config</button>
    </Navbar>

    <!-- Main Content -->
    <div class="content-container">
      <!-- Left: Navigation -->
      <ProjectNavigation 
        :project-id="projectId"
        :visible-tabs="visibleNavigationTabs"
        @tab-change="handleTabChange"
      />

      <!-- Right: Content Area -->
      <div class="main-content">
        <!-- Horizontal tabs for sub-sections -->
        <ProjectStepUsers v-if="currentNavTab === 'users'" />
        <ProjectStepEvents v-else-if="currentNavTab === 'events'" />
        <ProjectStepPosts v-else-if="currentNavTab === 'posts'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  height: calc(100vh - 60px); /* Minus navbar height */
}

.main-content {
  padding: 2rem;
  overflow-y: auto;
}
</style>
```

### Example 2: Horizontal Tabs Within Content

From `ProjectStepUsers.vue`:

```vue
<template>
  <div class="step-component">
    <!-- Section Header -->
    <div class="step-header">
      <h3>Users & Regio konfigurieren</h3>
      <p class="step-subtitle">Verwalten Sie Benutzer und Regionalprojekte</p>
    </div>

    <!-- Horizontal Tabs (2-4 recommended) -->
    <div class="tabs-container">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <UsersConfigPanel v-if="activeTab === 'users'" :project-id="projectId" />
      <ProjectsConfigPanel v-else-if="activeTab === 'projects'" :project-id="projectId" />
    </div>
  </div>
</template>

<style scoped>
.tabs-container {
  display: flex;
  gap: 0.5rem;
  border-bottom: var(--border) solid var(--color-border);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-dimmed);
  transition: all 0.2s ease;
}

.tab-button.active {
  color: var(--color-project);
  border-bottom-color: var(--color-project);
}
</style>
```

### Reusable Panels

**Panel Component Pattern:**

From `UsersConfigPanel.vue`:

```vue
<template>
  <div class="config-panel">
    <h4>Benutzer</h4>
    <p class="panel-description">Verwalten Sie Projekt-Eigentümer und Mitglieder</p>

    <div class="config-content">
      <!-- Form fields, lists, etc. -->
      <div class="form-group">
        <label class="form-label">Eigentümer (Owner)</label>
        <input class="form-input readonly" :value="ownerName" readonly disabled />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-panel {
  padding: 1.5rem;
}

.form-input {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  color: var(--color-text);
}

.form-input.readonly {
  background: var(--color-bg-soft);
  color: var(--color-dimmed);
  cursor: not-allowed;
}
</style>
```

**Benefits:**
- Self-contained logic and styling
- Reusable in different contexts (inline or popup)
- Theme-aware via CSS variables
- Easy to test in isolation

### Right-Side Popup Panels

**Pattern: EditPanel + BasePanel**

From `EditPanel.vue`:

```vue
<template>
  <BasePanel 
    :is-open="isOpen" 
    :title="title" 
    :sidebar-mode="sidebarMode" 
    @close="handleClose"
  >
    <!-- Panel content with forms -->
    <form class="edit-form" @submit.prevent="handleSave">
      <div class="form-group">
        <label class="form-label">Heading</label>
        <input v-model="formData.heading" class="form-input" />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="handleClose">
          Cancel
        </button>
        <button type="submit" class="btn-primary" :disabled="isSaving">
          Save
        </button>
      </div>
    </form>
  </BasePanel>
</template>

<style scoped>
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-contrast);
}

.form-input:focus {
  border-color: var(--color-primary-bg);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary-bg) l c h / 0.1);
}
</style>
```

**Refactoring Opportunity:**

EditPanel could be refactored to include a reusable config panel:

```vue
<template>
  <BasePanel :is-open="isOpen" @close="handleClose">
    <!-- Reuse the same panel component -->
    <UsersConfigPanel v-if="panelType === 'users'" :project-id="projectId" />
    <EventsConfigPanel v-else-if="panelType === 'events'" :project-id="projectId" />
  </BasePanel>
</template>
```

---

## I) Advanced Example: PageConfigController

### Multi-Tab Panel Architecture

From `PageConfigController.vue`:

**Structure:**

```vue
<template>
  <div class="page-config-controller">
    <!-- Header with Save/Cancel -->
    <div class="controller-header">
      <h2>Page Configuration</h2>
      <div class="header-actions">
        <button @click="handleCancel" class="btn-secondary" :disabled="!isDirty">
          Cancel
        </button>
        <button @click="handleSave" class="btn-primary" :disabled="isSaving">
          Save
        </button>
      </div>
    </div>

    <!-- Horizontal Tabs (4 sections) -->
    <div class="horizontal-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content (4 panels) -->
    <div class="tab-content">
      <PageOptionsPanel v-if="activeTab === 'page'" 
        v-model="pageOptions" 
        @update="markDirty" 
      />
      <HeaderOptionsPanel v-else-if="activeTab === 'header'" 
        v-model="headerOptions" 
        @update="markDirty" 
      />
      <AsideOptionsPanel v-else-if="activeTab === 'aside'" 
        v-model="asideOptions" 
        @update="markDirty" 
      />
      <FooterOptionsPanel v-else-if="activeTab === 'footer'" 
        v-model="footerOptions" 
        @update="markDirty" 
      />
    </div>
  </div>
</template>
```

**Key Features:**

1. **4 Specialized Panels** - Each manages a distinct configuration domain
2. **Unified Save/Cancel** - Shared state management across panels
3. **Dirty State Tracking** - Enables/disables save based on changes
4. **v-model Pattern** - Two-way binding between controller and panels

### Fine-Grained Auth-Aware Experience

**Scenario:** Right-side popup for quick edits

```vue
<template>
  <div class="page-view">
    <!-- Main content with inline edit buttons -->
    <div class="content-section">
      <h2>Page Settings</h2>
      <button @click="openPageConfig" class="edit-inline">✏ Edit</button>
    </div>

    <!-- Right-side popup -->
    <Transition name="slide-left">
      <div v-if="showConfigPanel" class="config-popup">
        <PageConfigController 
          :project="projectId" 
          mode="project"
          @close="showConfigPanel = false"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.config-popup {
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 100vh;
  background: var(--color-card-bg);
  box-shadow: -4px 0 16px oklch(0% 0 0 / 0.1);
  z-index: 1000;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}
</style>
```

**Auth-Aware Enhancements:**

```vue
<script setup>
const { user, hasPermission } = useAuth()

const canEditPage = computed(() => hasPermission('page.edit'))
const canEditHeader = computed(() => hasPermission('header.edit'))
const canEditAside = computed(() => hasPermission('aside.edit'))
const canEditFooter = computed(() => hasPermission('footer.edit'))

// Only show tabs user has permission for
const visibleTabs = computed(() => {
  return [
    { id: 'page', label: 'Page', visible: canEditPage.value },
    { id: 'header', label: 'Header', visible: canEditHeader.value },
    { id: 'aside', label: 'Aside', visible: canEditAside.value },
    { id: 'footer', label: 'Footer', visible: canEditFooter.value }
  ].filter(tab => tab.visible)
})
</script>
```

### Benefits of This Pattern

1. **Modularity** - Each panel is independent, testable
2. **Reusability** - Panels work inline or in popups
3. **Scalability** - Easy to add new config sections
4. **Performance** - Only active panel loads/renders
5. **UX** - Familiar tabbed interface, clear save/cancel
6. **Auth Integration** - Fine-grained permission control
7. **Theme Consistency** - All panels use semantic CSS variables

---

## Summary: Theming Best Practices

### ✅ DO

- **Use OKLCH color model exclusively**
- **Use CSS variables from the project**
- **Use semantic color variables** (primary, secondary, etc.)
- **Use `-bg` and `-contrast` pairs** for backgrounds/foreground
- **Use `--color-bg` instead of white**, `--color-contrast` instead of black
- **Use `--radius` and `--border` variables** for consistent UI
- **Redefine CSS variables in wrapper components** for theme switching
- **Use `--color-accent` for alternating rows/columns**
- **Build reusable panels** for dashboard layouts
- **Ask for confirmation** before adding new CSS variables

### ❌ DON'T

- **Never use HSL or RGB** - OKLCH only
- **Don't hardcode colors** - Use CSS variables
- **Don't use `-base` colors directly** - Use `-bg`/`-contrast`
- **Don't pair `--color-dimmed` with itself** - Readability issue
- **Don't compose colors unnecessarily** - Use semantic colors
- **Don't ignore theme variables** - Respect `--radius`, `--border`, etc.
- **Don't create monolithic components** - Break into reusable panels

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Based on:** 00-theme.css, 01-variables.css, useTheme.ts, /server/themes/index.json, ProjectMain.vue, ProjectStepUsers.vue, UsersConfigPanel.vue, EditPanel.vue, PageConfigController.vue
