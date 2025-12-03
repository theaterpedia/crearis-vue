# Markdown to HTML Conversion with Vue Component Support

## Problem Statement

We need to implement markdown-to-HTML conversion for content editing across multiple database tables:
- **instructors** (description, teaser)
- **events** (description, teaser)
- **posts** (description, teaser)
- **projects** (description, teaser, md)

### Requirements
- Side-by-side editor: markdown input | HTML preview
- Button-based refresh (not live preview initially)
- Support for basic Vue components in markdown
- Consistent rendering across client and server

## Proposal 1: Client-Side with Marked.js ⭐ Recommended for MVP

### Overview
Pure client-side solution using the Marked library for markdown parsing.

### Implementation
```typescript
// Install
pnpm add marked

// Component usage
<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'

const markdown = ref('')
const html = ref('')

function convertMarkdown() {
  html.value = marked.parse(markdown.value)
}
</script>

<template>
  <div class="markdown-editor">
    <div class="editor-pane">
      <textarea v-model="markdown" placeholder="# Your markdown..."></textarea>
      <button @click="convertMarkdown">Preview</button>
    </div>
    <div class="preview-pane" v-html="html"></div>
  </div>
</template>
```

### Pros
✅ Fast implementation (~2 hours)  
✅ No server dependency  
✅ Instant preview capability  
✅ Small bundle size (~50KB gzipped)  
✅ Battle-tested library (48k+ stars on GitHub)  
✅ Extensible with custom renderers  

### Cons
❌ Client-side only (different rendering on SSR)  
❌ Limited Vue component support (requires custom renderer)  
❌ HTML injection security concerns (need DOMPurify)  
❌ No server-side caching

### Timeline
- Setup: 1 hour
- Integration: 2 hours
- Security (DOMPurify): 1 hour
- **Total: 4 hours**

## Proposal 2: Server-Side with markdown-it + API

### Overview
Server-side markdown processing with API endpoint for conversion.

### Implementation
```typescript
// server/api/markdown/convert.post.ts
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

export default defineEventHandler(async (event) => {
  const { markdown } = await readBody(event)
  const html = md.render(markdown)
  return { html }
})

// Client component
<script setup lang="ts">
const markdown = ref('')
const html = ref('')
const isConverting = ref(false)

async function convertMarkdown() {
  isConverting.value = true
  try {
    const response = await $fetch('/api/markdown/convert', {
      method: 'POST',
      body: { markdown: markdown.value }
    })
    html.value = response.html
  } finally {
    isConverting.value = false
  }
}
</script>
```

### Pros
✅ Consistent rendering (client + SSR)  
✅ Server-side caching possible  
✅ More secure (controlled environment)  
✅ Better Vue component integration potential  
✅ Centralized markdown processing  

### Cons
❌ Network latency for preview  
❌ Server load for every conversion  
❌ More complex setup  
❌ Requires API endpoint maintenance  

### Timeline
- API endpoint: 2 hours
- Client integration: 2 hours
- Error handling: 1 hour
- Testing: 1 hour
- **Total: 6 hours**

## Proposal 3: Hybrid Approach 🚀 Best Balance

### Overview
Client-side preview for instant feedback + server-side canonical rendering for storage.

### Implementation
```typescript
// Client preview (instant)
import { marked } from 'marked'

function previewMarkdown() {
  previewHtml.value = marked.parse(markdown.value)
}

// Server canonical (on save)
async function saveContent() {
  const { html } = await $fetch('/api/markdown/convert', {
    method: 'POST',
    body: { markdown: markdown.value }
  })
  
  await $fetch('/api/projects/123', {
    method: 'PUT',
    body: {
      md: markdown.value,  // Store markdown source
      md_html: html        // Store canonical HTML
    }
  })
}
```

### Database Schema
```sql
-- Add to projects, events, posts, instructors tables
ALTER TABLE projects ADD COLUMN md TEXT;
ALTER TABLE projects ADD COLUMN md_html TEXT;
```

### Pros
✅ Best UX: instant preview + consistent storage  
✅ Cacheable canonical HTML  
✅ Fallback to client rendering if API fails  
✅ Store both markdown source + rendered HTML  
✅ Flexible: can switch rendering strategy later  

### Cons
❌ More complex implementation  
❌ Duplicate rendering logic to maintain  
❌ Larger bundle size (client lib + API)  
❌ Database schema changes required  

### Timeline
- Client preview: 2 hours
- Server API: 2 hours
- Schema migration: 1 hour
- Integration: 2 hours
- Testing: 1 hour
- **Total: 8 hours**

## Vue Component Support

### Custom Renderer for marked.js
```typescript
import { marked } from 'marked'

// Custom renderer for Vue components
const renderer = new marked.Renderer()

renderer.paragraph = (text) => {
  // Replace [Button text="Click me"] with Vue component
  const componentRegex = /\[(\w+)([^\]]*)\]/g
  const replaced = text.replace(componentRegex, (match, component, props) => {
    return `<${component}${props}></${component}>`
  })
  return `<p>${replaced}</p>`
}

marked.use({ renderer })
```

### Example Markdown with Components
```markdown
# Welcome to Our Project

This is regular markdown content with **bold** and *italic*.

[Button text="Learn More" variant="primary"]

## Features
- Feature 1
- Feature 2
```

## Security Considerations

### DOMPurify Integration
```typescript
import DOMPurify from 'dompurify'

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'class']
  })
}

const html = sanitizeHtml(marked.parse(markdown))
```

## Recommendation

### For MVP (Next 2 weeks): **Proposal 1** ⭐
- Quick implementation (4 hours)
- Covers immediate needs
- Can be enhanced later
- Install: `pnpm add marked dompurify`

### For Production (Month 2-3): **Migrate to Proposal 3** 🚀
- Best of both worlds
- Scalable architecture
- Consistent rendering
- Future-proof

## Implementation Checklist

### Phase 1: MVP (Proposal 1)
- [ ] Install marked + dompurify
- [ ] Create MarkdownEditor.vue component
- [ ] Add to EditPanel as textarea replacement
- [ ] Implement preview button
- [ ] Test with projects table
- [ ] Add basic security sanitization

### Phase 2: Extension
- [ ] Add to events editing
- [ ] Add to posts editing
- [ ] Add to instructors editing
- [ ] Custom renderer for Vue components
- [ ] Styling for preview pane

### Phase 3: Production (Proposal 3)
- [ ] Create /api/markdown/convert endpoint
- [ ] Add md_html columns to tables
- [ ] Migrate to hybrid approach
- [ ] Server-side caching strategy
- [ ] Performance monitoring

## Bundle Size Comparison

| Library | Gzipped Size | Features |
|---------|--------------|----------|
| marked | ~20KB | Markdown parsing |
| DOMPurify | ~30KB | XSS protection |
| markdown-it | ~60KB | Extensible parser |
| remark + plugins | ~80KB+ | Full ecosystem |

## Performance Metrics

### Client-Side (Proposal 1)
- Preview latency: <50ms
- Bundle impact: +50KB
- Network requests: 0

### Server-Side (Proposal 2)
- Preview latency: 200-500ms
- Bundle impact: 0KB
- Network requests: 1 per preview

### Hybrid (Proposal 3)
- Preview latency: <50ms (client)
- Canonical latency: 200-500ms (on save)
- Bundle impact: +50KB
- Network requests: 1 per save

## References

- [Marked.js Documentation](https://marked.js.org/)
- [markdown-it Documentation](https://markdown-it.github.io/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Vue Markdown Rendering Best Practices](https://vuejs.org/guide/best-practices/security.html#potential-dangers)
