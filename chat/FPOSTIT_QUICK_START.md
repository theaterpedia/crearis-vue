# Floating Post-Its Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Add the Global Renderer

Add `FpostitRenderer` to your `App.vue` or main layout:

```vue
<!-- src/App.vue -->
<template>
  <RouterView />
  <FpostitRenderer />
</template>

<script setup>
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
</script>
```

### 2. Choose Your Implementation Method

Pick one of three approaches:

#### Option A: Programmatic API (Dynamic Content)

```vue
<script setup>
import { useFpostitController } from '@/fpostit/composables/useFpostitController'

const controller = useFpostitController()

// Register a post-it
controller.create({
  key: 'p1',
  title: 'Learn More',
  content: '<p>Your content here with <strong>HTML</strong> support</p>',
  color: 'primary',
  hlogic: 'right',
  actions: [
    { label: 'Got it!', handler: (close) => close() }
  ]
})

// Open it
function openHelp(event) {
  controller.openPostit('p1', event.currentTarget)
}
</script>

<template>
  <button @click="openHelp">Need Help?</button>
</template>
```

#### Option B: HTML Data Attributes (Static Content)

```vue
<template>
  <div ref="container">
    <!-- Post-it container -->
    <div data-fpostcontainer data-fpostkey="p1">
      <!-- Trigger link -->
      <a href="#" data-fpostlink data-hlogic="default">Learn More</a>
      
      <!-- Hidden content -->
      <div style="display:none" data-fpostcontent data-color="accent">
        <h3>Need Help?</h3>
        <p>Click the buttons below for more info.</p>
        <a href="#docs" data-fpostact1>Documentation</a>
        <a href="#" data-fpostact2>Close</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'

const controller = useFpostitController()
const container = ref()

onMounted(() => {
  controller.discoverFromDOM({
    root: container.value,
    attachHandlers: true
  })
})
</script>
```

#### Option C: Markdown (Requires marked.js)

**Install first:** `npm install marked`

```typescript
import { marked } from 'marked'
import { fpostitExtension } from '@/fpostit/utils/markedExtension'

marked.use(fpostitExtension)

const markdown = `
## Your Content

::fpostit[p1]{title="Pro Tip" color="accent" hlogic="right"}
This is a **floating post-it** inside markdown!
[Learn More](#){.fpostact1}
::
`

const html = await marked.parse(markdown)
// Then render and discover from DOM
```

### 3. Test It!

Visit the demo pages to see it in action:
- `/demo/float-hard` - Programmatic API examples
- `/demo/float-dyn` - HTML data-attribute examples
- `/demo/float-markdown` - Markdown integration

---

## 📋 API Cheat Sheet

### Controller Methods

```typescript
const controller = useFpostitController()

// Create & open
controller.create({ key: 'p1', title: '...', content: '...' })
controller.openPostit('p1', triggerElement)

// Close
controller.closePostit('p1')
controller.closeAll()

// Check state
controller.isOpen('p1')        // boolean
controller.getKeys()           // string[]

// Discover from HTML
controller.discoverFromDOM({ root: element, attachHandlers: true })
```

### Positioning Modes (hlogic)

- `'default'` → Right side of viewport
- `'right'` → Explicitly right side
- `'left'` → Left side of viewport
- `'element'` → Smart positioning based on trigger location

*Mobile (< 768px) ignores hlogic and positions based on click location.*

### Theme Colors

`'primary' | 'secondary' | 'warning' | 'positive' | 'negative' | 'accent' | 'muted' | 'dimmed'`

### Post-It Data Structure

```typescript
{
  key: 'p1',              // Required: p1-p9
  title: 'Learn More',    // Required: trigger button text
  content: '<p>...</p>',  // Required: HTML content
  color: 'primary',       // Optional: theme color
  hlogic: 'right',        // Optional: positioning mode
  image: 'https://...',   // Optional: header image URL
  svg: '<svg>...</svg>',  // Optional: icon SVG markup
  actions: [              // Optional: max 2 buttons
    { 
      label: 'Click Me',
      handler: (close) => close()  // or
      href: '/link',
      target: '_blank'
    }
  ]
}
```

---

## ⚙️ Configuration

### Max Post-Its

Default: 9 per page. Edit `MAX_POSTITS` in `useFpostitController.ts`.

### Mobile Breakpoint

Default: 768px. Edit `MOBILE_BREAKPOINT` in `positioning.ts`.

### Rotation Range

Default: -3° to +3°. Edit `PostitRotation` type and rotation array in `positioning.ts`.

---

## 🎨 Styling

Post-its use CSS custom properties. Override in your theme:

```css
:root {
  --color-primary-bg: #your-color;
  --color-primary-contrast: #text-color;
  /* Repeat for all 8 themes */
}
```

---

## 🐛 Troubleshooting

### "Post-its don't appear"
✅ Add `<FpostitRenderer />` to your template  
✅ Call `controller.create()` before `openPostit()`  
✅ Pass valid HTMLElement to `openPostit()`

### "TypeScript errors on Vue imports"
✅ Expected - will resolve during Vue compilation

### "Marked.js not found"
✅ Install: `npm install marked`  
✅ Only needed for markdown integration

### "Discovery not working"
✅ Verify data attributes: `data-fpostcontainer`, `data-fpostkey`, `data-fpostlink`, `data-fpostcontent`  
✅ Call `discoverFromDOM()` after DOM render (use `onMounted`)  
✅ Set `attachHandlers: true`

---

## 📚 Full Documentation

- **Implementation Summary:** `docs/FPOSTIT_IMPLEMENTATION_SUMMARY.md`
- **Testing Checklist:** `docs/FPOSTIT_TESTING_CHECKLIST.md`
- **Demo Pages:** `/demo/float-hard`, `/demo/float-dyn`, `/demo/float-markdown`

---

## 🔑 Key Features

✅ Max 9 post-its per page  
✅ Smart positioning (4 modes)  
✅ Mobile responsive (50% width)  
✅ 8 theme colors  
✅ Random rotation  
✅ Image/SVG support  
✅ Up to 2 action buttons  
✅ HTML content  
✅ Close button + Escape key  
✅ SSR-safe  
✅ TypeScript support

---

**Ready to use!** Start with Option A (Programmatic API) for the simplest implementation.
