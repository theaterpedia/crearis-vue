# cList Component Family

The cList (Content List) family is the **most robust group of implemented components** on the project. Combined with ImgShape, it provides powerful list and grid functionality.

## Overview

### Component Hierarchy

```
ItemList (core)
├── DropdownList (selection)
├── pList (page lists)
└── pListEdit (editable page lists)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/clist/ItemList.vue` | Core list component |
| `src/components/clist/DropdownList.vue` | Dropdown selector |
| `src/components/page/pList.vue` | Page content list |
| `src/components/page/pListEdit.vue` | Editable page list |

## ItemList

The foundational component for displaying item collections:

```vue
<ItemList
  :items="items"
  :columns="2"
  layout="grid"
  :selectable="true"
  @select="handleSelect"
>
  <template #item="{ item }">
    <div class="custom-item">
      <ImgShape :src="item.image" shape="tile" />
      <span>{{ item.name }}</span>
    </div>
  </template>
</ItemList>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | array | [] | Items to display |
| `columns` | number | 1 | Grid columns |
| `layout` | string | 'list' | 'list' \| 'grid' \| 'masonry' |
| `selectable` | boolean | false | Enable selection |
| `multiselect` | boolean | false | Allow multiple selection |
| `loading` | boolean | false | Show loading state |

### Slots

| Slot | Props | Description |
|------|-------|-------------|
| `item` | `{ item, index, selected }` | Custom item rendering |
| `empty` | - | Empty state |
| `loading` | - | Loading state |
| `header` | - | List header |
| `footer` | - | List footer |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | item | Single item selected |
| `selection-change` | items[] | Selection changed |
| `item-click` | item | Item clicked |

## DropdownList

Extends ItemList for dropdown selection:

```vue
<DropdownList
  v-model="selectedItem"
  :items="options"
  label-key="name"
  value-key="id"
  placeholder="Select an option..."
>
  <template #item="{ item }">
    <ImgShape :src="item.icon" shape="avatar" />
    <span>{{ item.name }}</span>
  </template>
</DropdownList>
```

### Props (extends ItemList)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | any | - | Selected value (v-model) |
| `labelKey` | string | 'label' | Property for display |
| `valueKey` | string | 'value' | Property for value |
| `placeholder` | string | '' | Placeholder text |
| `searchable` | boolean | false | Enable search/filter |
| `clearable` | boolean | false | Allow clearing selection |

## pList (Page List)

For displaying page content items:

```vue
<pList
  :items="pageItems"
  :show-images="true"
  :show-meta="true"
  @item-click="navigateTo"
/>
```

### Features

- Automatic image handling with ImgShape
- Metadata display (date, author, tags)
- Integration with page layout system
- Responsive behavior

## pListEdit (Editable Page List)

For editing page content lists:

```vue
<pListEdit
  v-model="pageItems"
  :editable="isOwner"
  @add="addItem"
  @remove="removeItem"
  @reorder="handleReorder"
/>
```

### Features

- Drag-and-drop reordering
- Add/remove items
- Inline editing
- Undo/redo support

## Integration with ImgShape

The power of cList comes from combining it with ImgShape:

```vue
<ItemList :items="events" layout="grid" :columns="3">
  <template #item="{ item }">
    <div class="event-card">
      <ImgShape 
        :src="item.image" 
        shape="card"
        class="event-image"
      />
      <div class="event-content">
        <h3>{{ item.title }}</h3>
        <p>{{ item.date }}</p>
      </div>
    </div>
  </template>
</ItemList>
```

### Responsive Example

```vue
<template>
  <ItemList 
    :items="items" 
    :columns="responsiveColumns"
    layout="grid"
  >
    <template #item="{ item }">
      <ImgShape 
        :src="item.image" 
        :shape="isMobile ? 'tile' : 'card'"
      />
    </template>
  </ItemList>
</template>

<script setup>
const isMobile = computed(() => window.innerWidth < 768)
const responsiveColumns = computed(() => isMobile.value ? 1 : 3)
</script>
```

## Selection System

The cList components support sophisticated selection:

```vue
<ItemList
  :items="items"
  selectable
  multiselect
  v-model:selection="selectedItems"
  @selection-change="handleSelectionChange"
/>
```

### Selection Modes

| Mode | Props | Behavior |
|------|-------|----------|
| Single | `selectable` | One item at a time |
| Multi | `selectable multiselect` | Multiple items |
| Range | `selectable multiselect range-select` | Shift+click for ranges |

## CSS Customization

```css
/* Grid layout */
.item-list.layout-grid {
  display: grid;
  grid-template-columns: repeat(var(--columns, 1), 1fr);
  gap: var(--list-gap, 1rem);
}

/* List layout */
.item-list.layout-list {
  display: flex;
  flex-direction: column;
  gap: var(--list-gap, 0.5rem);
}

/* Item styling */
.item-list-item {
  padding: var(--item-padding, 0.5rem);
  border-radius: var(--radius-small);
  transition: var(--transition);
}

.item-list-item.is-selected {
  background: var(--color-selection);
}
```

---

*See also: [Page Layout System](/dev/features/page-layout)*
