## Research Summary

**Current Project Context:**
- **Stack**: Vue 3, Nitro 3, TypeScript, Vite, SQLite/PostgreSQL
- **Database Tables with Description/Teaser Fields**:
  - `instructors` - `description TEXT`
  - `events` - `teaser TEXT`, `md TEXT`, `html TEXT`
  - `posts` - `teaser TEXT`, `md TEXT`, `html TEXT`
  - `projects` - `description TEXT`
- **Existing Markdown Support**: HeadingParser.vue parses `**bold**` syntax for headlines
- **UI Patterns**: Modal-based editors (TranslationEditor, HeroEditModal), Side-by-side layouts (ProjectMain with 40/60 split)
- **No existing markdown libraries** in package.json

---

## **Proposal 1: Client-Side with `marked` + Custom Renderer** ⭐ **RECOMMENDED**

### Architecture
```
┌─────────────────────────────────────────────────┐
│  MarkdownEditor.vue Component                   │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────────┐ │
│  │   Textarea   │  ←→     │  Preview Pane    │ │
│  │  (Markdown)  │ Button  │  (Rendered HTML) │ │
│  └──────────────┘         └──────────────────┘ │
│          ↓                         ↑            │
│    marked.parse()                  │            │
│          ↓                         │            │
│  Custom Renderer ──────────────────┘            │
│  (Vue Component Mapping)                        │
└─────────────────────────────────────────────────┘
```

### Implementation Strategy

**Dependencies:**
```json
{
  "marked": "^11.1.1"  // ~50KB minified
}
```

**Core Component Structure:**
```vue
<!-- src/components/MarkdownEditor.vue -->
<template>
  <div class="markdown-editor">
    <div class="editor-layout">
      <!-- Left: Source Editor -->
      <div class="editor-pane">
        <div class="editor-header">
          <span>Markdown</span>
          <button @click="insertComponent">+ Component</button>
        </div>
        <textarea 
          v-model="localContent" 
          class="markdown-input"
          @input="debouncedUpdate"
        />
      </div>

      <!-- Right: Preview -->
      <div class="preview-pane">
        <div class="preview-header">
          <span>Preview</span>
          <button @click="refreshPreview">🔄 Refresh</button>
        </div>
        <div class="preview-content" v-html="renderedHtml" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { createVueComponentRenderer } from '@/utils/markdownRenderer'

const props = defineProps<{
  modelValue: string
  mode?: 'live' | 'button'  // live or button-based refresh
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localContent = ref(props.modelValue)
const manualRefresh = ref(0)

// Custom renderer for Vue components
const renderer = createVueComponentRenderer()
marked.setOptions({ renderer })

const renderedHtml = computed(() => {
  manualRefresh.value  // Dependency for manual refresh
  return marked.parse(localContent.value)
})

function refreshPreview() {
  manualRefresh.value++
}

function debouncedUpdate() {
  // Debounce for 300ms before emitting
  // Implementation...
}
</script>
```

**Custom Renderer for Vue Components:**
```typescript
// src/utils/markdownRenderer.ts
import { Renderer } from 'marked'

export function createVueComponentRenderer(): Renderer {
  const renderer = new Renderer()
  
  // Override heading to use HeadingParser syntax
  renderer.heading = (text, level) => {
    // Convert markdown **bold** to HeadingParser format
    // "overline **headline** subline" → <HeadingParser />
    return `<div data-component="HeadingParser" 
                 data-content="${escapeHtml(text)}" 
                 data-as="h${level}"></div>`
  }
  
  // Override paragraph for component detection
  renderer.paragraph = (text) => {
    // Detect component syntax: {{ComponentName prop="value"}}
    const componentMatch = text.match(/^\{\{(\w+)\s+(.+?)\}\}$/)
    if (componentMatch) {
      const [, name, props] = componentMatch
      return `<div data-component="${name}" ${props}></div>`
    }
    return `<p>${text}</p>`
  }
  
  return renderer
}

// Post-processing: Convert data-component divs to actual Vue components
export function hydrateComponents(html: string): VNode[] {
  // Parse HTML and replace data-component divs with Vue components
  // This requires a custom parser or v-html alternative
}
```

### Integration with Tables

**EventPanel.vue Enhancement:**
```vue
<div class="form-group">
  <label class="form-label">Teaser</label>
  <MarkdownEditor 
    v-model="customTeaser" 
    mode="button"
    :supported-components="['HeadingParser']"
  />
</div>
```

**API Storage:**
```typescript
// Store both markdown and HTML
const eventData = {
  teaser: markdownContent,  // Original markdown
  md: markdownContent,       // Backup
  html: renderedHtml        // Pre-rendered for fast display
}
```

### Pros
- ✅ **No server roundtrip** - instant preview
- ✅ **Lightweight** - marked is 50KB minified
- ✅ **Flexible** - easy to customize rendering
- ✅ **Works offline** - no API dependency
- ✅ **Simple deployment** - no server-side changes

### Cons
- ⚠️ **Client-side only** - HTML generation happens in browser
- ⚠️ **Component hydration complexity** - Vue components in v-html requires workarounds
- ⚠️ **Limited to browser capabilities**

---

## **Proposal 2: Server-Side with `markdown-it` + API**

### Architecture
```
┌─────────────────────────────────────────────────┐
│  MarkdownEditor.vue Component                   │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────────┐ │
│  │   Textarea   │  ─────→ │  Preview Pane    │ │
│  │  (Markdown)  │ Button  │  (Rendered HTML) │ │
│  └──────────────┘         └──────────────────┘ │
│          │                         ↑            │
│          ↓                         │            │
│    POST /api/markdown/render       │            │
│          │                         │            │
│          ↓                         │            │
│  ┌──────────────────────────────────────┐      │
│  │ Nitro Server (markdown-it)           │      │
│  │  - Parse markdown                    │      │
│  │  - Custom plugins for components     │      │
│  │  - Return HTML                       │──────┘
│  └──────────────────────────────────────┘
└─────────────────────────────────────────────────┘
```

### Implementation Strategy

**Dependencies:**
```json
{
  "markdown-it": "^14.0.0",           // ~100KB
  "markdown-it-container": "^4.0.0"   // For custom blocks
}
```

**Server API:**
```typescript
// server/api/markdown/render.post.ts
import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Custom plugin for Vue components
md.use(container, 'component', {
  validate: (params) => params.trim().match(/^component\s+(.*)$/),
  render: (tokens, idx) => {
    const m = tokens[idx].info.trim().match(/^component\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      // Opening tag
      const props = m[1]
      return `<div data-component="${props}">\n`
    } else {
      // Closing tag
      return '</div>\n'
    }
  }
})

export default defineEventHandler(async (event) => {
  const { markdown } = await readBody(event)
  
  try {
    const html = md.render(markdown)
    return { html, success: true }
  } catch (error) {
    return { error: error.message, success: false }
  }
})
```

**Client Component:**
```vue
<script setup lang="ts">
const localContent = ref(props.modelValue)
const renderedHtml = ref('')
const isRendering = ref(false)

async function refreshPreview() {
  isRendering.value = true
  try {
    const response = await fetch('/api/markdown/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: localContent.value })
    })
    const data = await response.json()
    renderedHtml.value = data.html
  } finally {
    isRendering.value = false
  }
}
</script>
```

### Custom Syntax for Components

**Markdown Input:**
```markdown
# Project Title

:::component HeadingParser content="**Theatre** Workshop" as="h2"
:::

This is a regular paragraph with **bold** text.

- List item 1
- List item 2
```

**Rendered Output:**
```html
<h1>Project Title</h1>
<div data-component="HeadingParser" data-content="**Theatre** Workshop" data-as="h2"></div>
<p>This is a regular paragraph with <strong>bold</strong> text.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
```

### Pros
- ✅ **Consistent rendering** - server-side guarantees same output
- ✅ **Better security** - sanitization on server
- ✅ **Cache-able** - can cache rendered HTML
- ✅ **More powerful** - full Node.js plugins available
- ✅ **Pre-render** - can store HTML in database

### Cons
- ⚠️ **Network latency** - requires API call
- ⚠️ **Server dependency** - preview requires backend
- ⚠️ **More complex deployment** - server-side processing

---

## **Proposal 3: Hybrid Approach** 🚀 **BEST BALANCE**

### Architecture
Combine both approaches for best of both worlds.

```
┌──────────────────────────────────────────────────┐
│  MarkdownEditor.vue                              │
├──────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌───────────────────┐ │
│  │   Textarea   │         │  Preview Pane     │ │
│  │  (Markdown)  │         │  (Rendered HTML)  │ │
│  └──────────────┘         └───────────────────┘ │
│         ↓                          ↑             │
│    Client: marked.js               │             │
│    (instant preview)    ───────────┘             │
│         ↓                                        │
│  On Save: POST /api/markdown/render              │
│         ↓                                        │
│  Server: markdown-it                             │
│  (canonical HTML for database)                   │
└──────────────────────────────────────────────────┘
```

### Strategy

1. **Live Preview**: Use `marked` client-side for instant feedback
2. **Save/Publish**: Send to server for canonical HTML generation
3. **Storage**: Save both markdown and server-rendered HTML

**Component:**
```vue
<script setup lang="ts">
// Client-side preview (instant)
const clientHtml = computed(() => marked.parse(localContent.value))

// Server-side canonical HTML (on save)
async function save() {
  const response = await fetch('/api/markdown/render', {
    method: 'POST',
    body: JSON.stringify({ markdown: localContent.value })
  })
  const { html } = await response.json()
  
  // Save to database
  await saveToDatabase({
    md: localContent.value,
    html: html  // Canonical version
  })
}
</script>

<template>
  <div class="editor-layout">
    <textarea v-model="localContent" />
    <div class="preview" v-html="clientHtml" />
    <button @click="save">Save</button>
  </div>
</template>
```

### Pros
- ✅ **Best UX** - instant preview + reliable save
- ✅ **Offline-capable** - preview works without network
- ✅ **Production-ready** - server HTML for consistency
- ✅ **Flexible** - can switch between modes

### Cons
- ⚠️ **Two implementations** - maintain both renderers
- ⚠️ **Potential mismatch** - client vs server output

---

## **Recommendation Summary**

| Aspect | Proposal 1 (Client) | Proposal 2 (Server) | Proposal 3 (Hybrid) |
|--------|-------------------|-------------------|-------------------|
| **Complexity** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Reliability** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Offline** | ✅ | ❌ | ✅ (preview) |
| **Best for** | Quick MVP | Enterprise | Production |

### **My Recommendation: Start with Proposal 1, migrate to Proposal 3**

**Phase 1** (Week 1-2): Implement Proposal 1
- Quick to implement
- Immediate value
- Test user acceptance

**Phase 2** (Week 3-4): Add server rendering
- Implement API endpoint
- Switch to hybrid model
- Pre-render on save

This approach minimizes risk and delivers value incrementally.