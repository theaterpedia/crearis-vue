# Component Coding Guide

**How Code Automation Designs Component Code**

This guide documents the patterns and conventions used when designing Vue components in this project. These patterns prioritize maintainability, cascading logic, and flexible styling through a combination of CSS programming and Vue's reactive props system.

---

## A) CSS Coding: Cascading Logic and CSS Programming

### Principle: Build Cascading Logic from Top to Bottom

Define only strongly needed properties and leverage CSS selectors like `:where()` and `:not()` to create flexible, low-specificity styles that can be easily overridden.

### Example 1: Using `:where()` for Low-Specificity Selectors

From `Prose.vue` - Paragraphs:

```css
/**
 * Paragraphs
 */

.prose :where(p) {
  color: var(--color-muted-contrast);
  font-size: 1em;
  line-height: 1.15;
}
```

**Why `:where()`?**
- Creates a selector with zero specificity
- Allows easy overrides without increasing specificity wars
- Enables cascading from parent classes (e.g., `.prose .primary p` can override color)

### Example 2: Combining `:where()` with Multiple Selectors

From `Prose.vue` - Headings:

```css
/**
 * Headings
 */

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) {
  color: var(--color-contrast);
  font-weight: 500;
}

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) :where(strong) {
  display: block;
}
```

**Pattern:**
- Group related elements (native headings + utility classes)
- Apply base styles to the group
- Use nested `:where()` for child elements
- Keep specificity low for maximum flexibility

### Example 3: Complex Cascading with `:not()` and `:where()`

From `Prose.vue` - Spacing logic:

```css
/**
 * Spacings
 */

.prose > :where(* + *) {
  margin-top: 1em;
}

.prose :where(:not(.narrow, .h1, .h2, .h3, .h4, .h5, .h6) + p) {
  margin-top: 1.8em;
}

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) + :where(:not(.h1, .h2, .h3, .h4, .h5, .h6)) {
  margin-top: 1.3em;
}
```

**Advanced Pattern:**
- Base rule: All adjacent siblings get `1em` spacing
- Exception 1: Paragraphs after non-headings/non-narrow elements get more space (`1.8em`)
- Exception 2: Non-headings after headings get medium space (`1.3em`)
- Uses `:not()` to exclude specific cases from general rules
- Creates intelligent, context-aware spacing without explicit classes

### Organizing with Comments

Always group related styles with comment headers:

```css
/**
 * Paragraphs
 */
/* ... styles ... */

/**
 * Headings
 */
/* ... styles ... */

/**
 * Links
 */
/* ... styles ... */

/**
 * Lists
 */
/* ... styles ... */

/**
 * Spacings
 */
/* ... styles ... */

/**
 * Colors
 */
/* ... styles ... */
```

**Benefits:**
- Easy navigation in large style blocks
- Clear separation of concerns
- Self-documenting code structure

---

## B) Combining CSS Class Names for Complex Styling

### Pattern: Build Complexity Through Class Combination

From `Hero.vue` (lines 247-306) - Using multiple classes to achieve different layouts:

```css
/* Base hero styles */
.hero {
  position: relative;
  display: flex;
  justify-content: flex-start;
  padding: 6.25rem 0 6.25rem 1rem;
  overflow: clip;
}

/* Content positioning variants */
.hero-content {
  position: relative;
}

.hero-align-content-top .hero-content {
  position: sticky;
  top: 6.25rem;
}

.hero-align-content-bottom .hero-content {
  position: sticky;
  bottom: 6.25rem;
}

/* Content width variants */
.hero-content-short {
  min-width: 23rem;
  max-width: 50rem;
}

.hero-content-fixed {
  width: 80%;
}

.hero-content-full {
  width: 100%;
}

/* Responsive override for specific content type */
.hero-content-left .container {
  margin-left: 0;
  padding-left: 0;
  padding-right: 8rem;
  padding-bottom: 1.75rem;
}
```

**Strategy:**
1. **Base class** (`.hero`) - Core positioning and layout
2. **Modifier classes** (`.hero-content-short`, `.hero-align-content-top`) - Variants
3. **Descendant selectors** (`.hero-content-left .container`) - Context-specific overrides
4. **Combination selectors** (`.hero-align-content-top .hero-content`) - State-based styling

**Key Principle:**
- Each class does ONE thing well
- Combine classes in template to create complex behaviors
- Avoid monolithic classes with all variants built-in

---

## C) Vue Props Switching CSS Classes (Simple Case)

### Pattern: Map Props to CSS Classes Using Object Syntax

From `Banner.vue`:

```vue
<template>
  <div 
    :class="{
      banner: !card,
      transparent: transparent,
      card: card,
      primary: themeColor === 'primary',
      secondary: themeColor === 'secondary',
      neutral: themeColor === 'neutral' || !themeColor,
      muted: themeColor === 'muted',
      accent: themeColor === 'accent',
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'

defineProps({
  transparent: {
    type: Boolean,
    default: false,
  },

  themeColor: {
    type: String as PropType<'primary' | 'secondary' | 'neutral' | 'muted' | 'accent'>,
    default: 'neutral',
  },

  card: {
    type: Boolean,
    default: false,
  },
})
</script>
```

**How It Works:**

1. **Boolean Props → Boolean Classes:**
   ```vue
   transparent: transparent,  // prop value directly controls class
   card: card,
   ```

2. **String Props → Conditional Classes:**
   ```vue
   primary: themeColor === 'primary',
   secondary: themeColor === 'secondary',
   ```

3. **Default Fallback:**
   ```vue
   neutral: themeColor === 'neutral' || !themeColor,
   ```

**CSS Side:**

```css
.primary {
  background-color: var(--color-primary-bg);
}

.secondary {
  background-color: var(--color-secondary-bg);
}

.neutral {
  background-color: var(--color-bg);
}

.transparent {
  background-color: oklch(from var(--color-primary-bg) l c h / var(--transparency-banner));
}
```

**Pattern Benefits:**
- Clear prop-to-style mapping
- Type-safe with TypeScript PropType
- Easy to add new theme variants
- CSS classes remain simple and single-purpose

---

## D) Enhancing Class Switching with Inline `:style` Statements

### Pattern: Combine Class-Based Styling with Dynamic Inline Styles

From `Hero.vue` (lines 2-40) - Complex background image positioning:

```vue
<template>
  <div class="hero" :class="[
    target === 'page' ? `hero-${heightTmp}` : 'hero-mini card-hero',
    `hero-align-content-${contentAlignY}`,
    bottomline ? 'hero-bottomline' : '',
  ]" :style="contentType === 'left' ? 'padding-left: 0rem' : ''">
    <div class="hero-cover">
      <div :class="target === 'page' ? 'hero-cover-image' : 'static-cover-image'" :style="{
        backgroundImage: `url(${imgTmp})`,
        backgroundPositionX:
          target === 'page'
            ? imgTmpAlignX === 'stretch'
              ? 'left'
              : imgTmpAlignX === 'cover'
                ? 'center'
                : imgTmpAlignX
            : 'center',
        backgroundPositionY:
          target === 'page'
            ? imgTmpAlignY === 'stretch'
              ? 'top'
              : imgTmpAlignY === 'cover'
                ? 'center'
                : imgTmpAlignY
            : 'center',
        backgroundSize:
          target === 'page'
            ? imgTmpAlignX === 'cover' || imgTmpAlignY === 'cover'
              ? 'cover'
              : `${imgTmpAlignX === 'stretch' ? '100%' : 'auto'} ${imgTmpAlignY === 'stretch' ? '100%' : 'auto'}`
            : '500px',
      }">
        <div v-if="overlay" class="hero-cover-overlay" :style="{ background: overlay }"></div>
      </div>
    </div>

    <div class="hero-content" :class="[`hero-content-${contentWidth}`, `hero-content-${contentType}`]">
      <Container>
        <slot />
      </Container>
    </div>
  </div>
</template>
```

**When to Use Inline Styles:**

1. **Dynamic Values from Props:**
   ```vue
   backgroundImage: `url(${imgTmp})`,
   ```
   - Can't be predefined in CSS
   - Changes based on user input/data

2. **Complex Conditional Logic:**
   ```vue
   backgroundPositionX:
     target === 'page'
       ? imgTmpAlignX === 'stretch'
         ? 'left'
         : imgTmpAlignX === 'cover'
           ? 'center'
           : imgTmpAlignX
       : 'center',
   ```
   - Too many combinations to create CSS classes
   - Logic-driven rather than variant-driven

3. **User-Controlled Values:**
   ```vue
   :style="{ background: overlay }"
   ```
   - `overlay` is a CSS value passed directly from parent
   - Could be gradient, color, or any CSS background value

**Architecture Decision Matrix:**

| Use Case | Solution | Example |
|----------|----------|---------|
| Fixed variants (3-5 options) | CSS classes | `themeColor: 'primary' \| 'secondary'` |
| Many variants (6+) or continuous | Inline styles | `backgroundPosition: string` |
| User-controlled CSS values | Inline styles | `overlay: string` (CSS background) |
| Layout shifts | CSS classes | `contentWidth: 'short' \| 'fixed' \| 'full'` |
| Computed complex logic | Inline styles | Background size calculation |

**Best Practice:**
- Use `:class` for structural/layout variants
- Use `:style` for dynamic/computed values
- Combine both for maximum flexibility

---

## E) Setting Up Props: Two Syntaxes

### Syntax 1: Direct `defineProps()` (Simple Components)

From `Hero.vue`:

```typescript
defineProps({
  /**
   * Defines the height of the hero.
   *
   * @default 'full'
   */
  heightTmp: {
    type: String as PropType<'full' | 'prominent' | 'medium' | 'mini'>,
    default: 'prominent',
  },

  /**
   * The URL of the image used as a background.
   */
  imgTmp: {
    type: String,
  },

  /**
   * Defines the horizontal placement of the background image.
   */
  imgTmpAlignX: {
    type: String as PropType<'left' | 'right' | 'center' | 'stretch' | 'cover'>,
    default: 'center',
  },

  /**
   * Defines the vertical placement of the background image.
   */
  imgTmpAlignY: {
    type: String as PropType<'top' | 'bottom' | 'center' | 'stretch' | 'cover'>,
    default: 'stretch',
  },

  /**
   * The CSS background of the overlay on top of the cover image.
   */
  overlay: {
    type: String,
  },

  /**
   * deactivates the bottom-line.
   */
  bottomline: {
    type: Boolean,
    default: false,
  },
})
```

**When to Use:**
- Component doesn't need to access props in `<script>`
- Props are only used in template via direct binding
- Simpler, more concise syntax

**Key Features:**
- JSDoc comments document each prop
- `PropType<>` for union type constraints
- Default values defined inline
- Props available in template automatically

### Syntax 2: `const props = defineProps()` (Complex Components)

From `Input.vue`:

```typescript
const props = defineProps({
  /**
   * The value of the input.
   *
   * @default ''
   */
  modelValue: {
    type: String,
    default: '',
  },

  /**
   * The `name` attribute used to identify the input when submitting the form.
   */
  name: {
    type: String,
    required: true,
  },

  /**
   * The label for the input.
   */
  label: {
    type: String,
    required: true,
  },

  /**
   * The type of the input.
   *
   * @default 'text'
   */
  type: {
    type: String,
    default: 'text',
  },

  /**
   * Defines a unique identifier (ID) which must be unique in the whole document.
   * Its purpose is to identify the element when linking (using a fragment identifier), scripting, or styling (with CSS).
   * If not provided, a random ID will be generated.
   */
  id: {
    type: String,
  },

  /**
   * Indicates whether the label is required.
   * If `true`, an asterisk is displayed next to the label.
   *
   * @default false
   */
  required: {
    type: Boolean,
    default: false,
  },

  /**
   * The error message to display.
   * If defined, the input will be styled as an error.
   *
   * @default undefined
   */
  error: {
    type: String,
  },
})
```

**Usage in `<script>`:**

```typescript
const computedId = ref(props.id)

onMounted(() => {
  watch(
    computedId,
    (id) => {
      if (!id) {
        computedId.value = nanoid()
      }
    },
    { immediate: true },
  )
})
```

**When to Use:**
- Need to access props in `<script>` logic
- Computing derived values from props
- Watching props for side effects
- Passing props to composables

**Key Differences:**

| Feature | Direct `defineProps()` | `const props = defineProps()` |
|---------|------------------------|-------------------------------|
| Template access | ✅ Automatic | ✅ Automatic |
| Script access | ❌ Not available | ✅ Available as `props.propName` |
| Use case | Display/binding only | Logic/computed/watchers |
| Syntax | More concise | Explicit reference |

### Complete Prop Definition Pattern

**Required Elements:**

1. **JSDoc Comment:**
   ```typescript
   /**
    * Brief description of the prop.
    *
    * @default 'value'  // Only if there's a default
    */
   ```

2. **Type Definition:**
   ```typescript
   type: String,
   // or for unions:
   type: String as PropType<'option1' | 'option2' | 'option3'>,
   ```

3. **Default Value (optional but recommended):**
   ```typescript
   default: 'neutral',
   ```

4. **Required Flag (when no default):**
   ```typescript
   required: true,
   ```

**Example - Complete Prop Setup:**

```typescript
const props = defineProps({
  /**
   * Theme color for the component background.
   * Affects the overall visual appearance.
   *
   * @default 'neutral'
   */
  themeColor: {
    type: String as PropType<'primary' | 'secondary' | 'neutral' | 'muted' | 'accent'>,
    default: 'neutral',
  },

  /**
   * Content to display in the component.
   * Required prop - must be provided by parent.
   */
  content: {
    type: String,
    required: true,
  },

  /**
   * Whether to show a border around the component.
   *
   * @default false
   */
  bordered: {
    type: Boolean,
    default: false,
  },
})
```

---

## Summary: Component Design Patterns

### CSS Architecture

1. **Use `:where()` for low-specificity, easily overridable styles**
2. **Use `:not()` to exclude specific cases from general rules**
3. **Group styles with comment headers**
4. **Build cascading logic from general to specific**
5. **Let CSS properties inherit when possible**

### Class-Based Styling

1. **Base class** defines core structure
2. **Modifier classes** add variants
3. **Combine multiple classes** for complex behaviors
4. **Each class does one thing well**

### Vue Template Patterns

1. **`:class` with object syntax** for prop-to-class mapping
2. **`:class` with array syntax** for dynamic class names
3. **`:style` for computed/dynamic CSS values**
4. **Combine `:class` and `:style`** when needed

### Props Definition

1. **Use `defineProps()`** when props are only for template
2. **Use `const props = defineProps()`** when accessing in script
3. **Always add JSDoc comments** with description and `@default`
4. **Use `PropType<>` for union types**
5. **Provide sensible defaults** or mark as `required`

---

## Quick Reference

### CSS Selector Patterns

```css
/* Low specificity, overridable */
.parent :where(selector) { }

/* Exclude specific cases */
.parent :where(:not(.exception)) { }

/* Multiple selectors grouped */
.parent :where(h1, h2, h3, .h1, .h2, .h3) { }

/* Adjacent sibling with exclusions */
.parent :where(:not(.class1, .class2) + element) { }
```

### Vue Class Binding Patterns

```vue
<!-- Boolean props -->
:class="{ active: isActive, disabled: isDisabled }"

<!-- String prop equals -->
:class="{ primary: color === 'primary' }"

<!-- Dynamic class names -->
:class="[`size-${size}`, `theme-${theme}`]"

<!-- Conditional class name -->
:class="[isLarge ? 'large' : 'small']"

<!-- Mixed array and object -->
:class="['base', { active: isActive }]"
```

### Vue Style Binding Patterns

```vue
<!-- Object syntax -->
:style="{ color: textColor, fontSize: fontSize + 'px' }"

<!-- Conditional styles -->
:style="isActive ? 'display: block' : 'display: none'"

<!-- Complex computed styles -->
:style="{
  backgroundImage: `url(${imageUrl})`,
  backgroundPosition: align === 'center' ? 'center' : align,
}"
```

### Props Definition Patterns

```typescript
// Simple component - no script access needed
defineProps({
  name: { type: String, required: true },
  visible: { type: Boolean, default: true },
})

// Complex component - needs script access
const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

// Use in script
const computedValue = computed(() => props.modelValue.toUpperCase())
```

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Based on:** Prose.vue, Hero.vue, Banner.vue, Input.vue
