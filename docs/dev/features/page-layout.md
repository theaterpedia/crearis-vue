# Page Layout System

::: warning Brief Summary
Detailed documentation will be completed at end of v0.4.
:::

## Overview

The page layout system provides flexible column-based layouts for project pages.

### Layout Options

| Layout | Description |
|--------|-------------|
| 1-col | Full-width single column |
| 2-col | Two equal columns |
| 3-col | Three equal columns |
| 2-col-wide-left | Left column wider |
| 2-col-wide-right | Right column wider |

## Components

### PageLayout

```vue
<PageLayout type="2-col">
  <template #left>
    <pList :items="events" />
  </template>
  <template #right>
    <pList :items="posts" />
  </template>
</PageLayout>
```

### PageSection

```vue
<PageSection title="Events" collapsible>
  <ItemList :items="events" layout="grid" :columns="3" />
</PageSection>
```

## Integration with cList/pList

The layout system integrates naturally with cList components:

```vue
<PageLayout type="3-col">
  <template #col1>
    <pList :items="featured" />
  </template>
  <template #col2>
    <pList :items="recent" />
  </template>
  <template #col3>
    <pList :items="upcoming" />
  </template>
</PageLayout>
```

## Responsive Behavior

Layouts automatically collapse on smaller screens:

| Screen | 3-col | 2-col |
|--------|-------|-------|
| Desktop (1200px+) | 3 columns | 2 columns |
| Tablet (768-1199px) | 2 columns | 2 columns |
| Mobile (<768px) | 1 column | 1 column |

## CSS Variables

```css
:root {
  --layout-gap: 2rem;
  --layout-padding: 1rem;
  --layout-max-width: 1440px;
}
```

---

*Full documentation: v0.4*
