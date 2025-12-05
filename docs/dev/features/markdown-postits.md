# Markdown, Prose & PostIts

Theaterpedia includes a rich text system with Markdown support and a unique PostIt component for visual content organization.

## Overview

### Components

| Component | Purpose |
|-----------|---------|
| HeadingParser | Parse and render hierarchical headings |
| PostIt | Visual "sticky note" display |
| ProseContent | Styled markdown rendering |

## HeadingParser

Parses markdown content with hierarchical headings:

```vue
<HeadingParser 
  :content="markdownContent"
  :level="2"
  @heading-click="handleHeadingClick"
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `content` | string | Markdown content to parse |
| `level` | number | Starting heading level (1-6) |
| `collapsible` | boolean | Allow sections to collapse |

### Heading Structure

The parser recognizes markdown headings and creates a navigable structure:

```markdown
# Main Title (h1)
## Section (h2)
### Subsection (h3)
```

## PostIt Component

The PostIt component renders content as visual "sticky notes":

```vue
<PostIt
  :content="noteContent"
  color="yellow"
  :rotation="2"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | string | - | Text content |
| `color` | string | 'yellow' | Note color |
| `rotation` | number | 0 | Rotation angle (degrees) |
| `size` | string | 'medium' | 'small' \| 'medium' \| 'large' |

### Available Colors

```css
--postit-yellow: oklch(95% 0.1 90);
--postit-pink: oklch(90% 0.15 350);
--postit-blue: oklch(90% 0.1 240);
--postit-green: oklch(92% 0.1 140);
--postit-orange: oklch(92% 0.15 60);
```

## PostIt from Markdown

::: tip Advanced Feature
PostIts can be generated from markdown using special syntax.
:::

### Syntax

```markdown
:::postit yellow
This is a sticky note!
:::
```

### Implementation

See `/chat/FPOSTIT_IMPLEMENTATION_SUMMARY.md` for full details.

Key files:
- `src/components/PostIt.vue` - Component
- `src/utils/postit-parser.ts` - Markdown parser extension

## Prose Styling

The `.prose` class provides beautiful typography for long-form content:

```vue
<div class="prose">
  <h1>Article Title</h1>
  <p>Content with proper typography...</p>
</div>
```

### Features

- Proper heading hierarchy
- Readable line heights (1.6-1.8)
- Link styling with hover states
- List formatting
- Code block styling
- Blockquote styling

### CSS Variables

```css
.prose {
  --prose-body: var(--color-contrast);
  --prose-headings: var(--color-contrast);
  --prose-links: var(--color-primary-base);
  --prose-bold: var(--color-contrast);
  --prose-code: var(--color-secondary-base);
}
```

## Integration Example

Combining HeadingParser with PostIts:

```vue
<template>
  <div class="article-layout">
    <!-- Main content with headings -->
    <HeadingParser 
      :content="article.body" 
      :level="1"
    />
    
    <!-- Sidebar with PostIts -->
    <aside class="notes">
      <PostIt 
        v-for="note in sideNotes"
        :key="note.id"
        :content="note.text"
        :color="note.color"
      />
    </aside>
  </div>
</template>
```

---

*See also: [Page & Post Editor](/dev/features/editors) for editing integration*
