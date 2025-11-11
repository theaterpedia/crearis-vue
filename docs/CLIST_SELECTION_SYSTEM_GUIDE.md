# CList Selection System - Developer Guide

**Created:** November 11, 2025  
**Component Version:** CL2 (Computed Lists v2)  
**Related Docs:** `/docs/CLIST_DESIGN_SPEC.md`, `/src/components/clist/README.md`

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [DropdownList Examples](#dropdownlist-examples)
4. [pList Examples](#plist-examples)
5. [Props Reference](#props-reference)
6. [Event Emissions](#event-emissions)

---

## Overview

The CList selection system provides flexible list display and data selection capabilities through two primary wrapper components:

- **DropdownList**: Collapsible dropdown with trigger (typically for data selection)
- **pList**: Always-visible page list (primarily for content display)

Both components wrap `ItemList` and support two operational modes:

### DataMode: true (Selection Mode)
- Shows selection UI (checkboxes)
- Emits selection events
- Tracks selected IDs
- Used for form inputs, data pickers, batch operations

### DataMode: false (Display Mode)
- Hides selection UI
- Static content display
- Still emits click events
- Used for content galleries, resource lists

---

## Component Architecture

```
┌─────────────────────────────────────────────────┐
│  DropdownList or pList (Wrapper Components)    │
│  • Provides context (dropdown/page)             │
│  • Forwards selection props to ItemList        │
│  • Handles trigger display (DropdownList only) │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  ItemList (Core Logic Component)                │
│  • Fetches entity data from API                 │
│  • Manages selection state                      │
│  • Validates selection constraints              │
│  • Emits selection events                       │
│  • Applies visual indicators                    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  ItemRow / ItemTile / ItemCard                  │
│  • Renders individual items                     │
│  • Shows visual indicators (badges, icons, etc.)│
│  • Handles item click events                    │
└─────────────────────────────────────────────────┘
```

**Key Design Principles:**
- **DropdownList** defaults `dataMode=true` (selection-focused)
- **pList** defaults `dataMode=false` (display-focused)
- Both can override defaults for specific use cases

---

## DropdownList Examples

### Example 1: DropdownList with dataMode=true, multiSelect=false

**Use Case:** Single-select form input for event selection

```vue
<template>
  <div class="form-group">
    <label>Select Event</label>
    <DropdownList
      entity="events"
      :project="projectId"
      title="Choose Event"
      size="small"
      :dataMode="true"
      :multiSelect="false"
      v-model:selectedIds="selectedEventId"
      @selected="handleEventSelected"
    >
      <template #trigger="{ open, isOpen }">
        <button class="form-input" @click="open">
          <span v-if="selectedEventId">Event Selected</span>
          <span v-else>Select an event...</span>
          <svg class="chevron" :class="{ 'rotate': isOpen }">...</svg>
        </button>
      </template>
    </DropdownList>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DropdownList from '@/components/clist/DropdownList.vue'

const projectId = 'tp'
const selectedEventId = ref<number | null>(null)

function handleEventSelected(event: any) {
  console.log('Selected event:', event)
  // event = { id: 123, heading: "Workshop", xmlID: "tp.event.ws123", ... }
}
</script>
```

**Key Features:**
- Single selection only
- Checkbox appears on items
- Selected item displayed in trigger
- Returns single entity object

---

### Example 2: DropdownList with dataMode=true, multiSelect=true

**Use Case:** Multi-select instructor picker for course assignment

```vue
<template>
  <div class="form-group">
    <label>Select Instructors ({{ selectedInstructorIds.length }})</label>
    <DropdownList
      entity="instructors"
      :project="projectId"
      title="Choose Instructors"
      size="small"
      :dataMode="true"
      :multiSelect="true"
      v-model:selectedIds="selectedInstructorIds"
      @selectedXml="handleInstructorXml"
      @selected="handleInstructorsSelected"
    />
    
    <!-- Display selected instructors -->
    <div v-if="selectedInstructors.length" class="selected-list">
      <div v-for="instructor in selectedInstructors" :key="instructor.id" class="selected-item">
        <span>{{ instructor.entityname }}</span>
        <button @click="removeInstructor(instructor.id)">×</button>
      </div>
    </div>
    
    <!-- Display XML IDs -->
    <div v-if="xmlIds" class="xml-display">
      <small>XML: {{ xmlIds }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DropdownList from '@/components/clist/DropdownList.vue'

const projectId = 'tp'
const selectedInstructorIds = ref<number[]>([])
const selectedInstructors = ref<any[]>([])
const xmlIds = ref<string[]>([])

function handleInstructorsSelected(instructors: any[]) {
  selectedInstructors.value = instructors
  console.log('Selected instructors:', instructors)
  // instructors = [{ id: 1, entityname: "John Doe", xmlID: "tp.instructor.jd001" }, ...]
}

function handleInstructorXml(ids: string[]) {
  xmlIds.value = ids
  console.log('XML IDs:', ids)
  // ids = ["tp.instructor.jd001", "tp.instructor.js002"]
}

function removeInstructor(id: number) {
  selectedInstructorIds.value = selectedInstructorIds.value.filter(i => i !== id)
}
</script>
```

**Key Features:**
- Multiple selections allowed
- Stacked avatars in trigger (max 8 visible)
- Returns array of entity objects
- XML IDs for backend integration

---

### Example 3: DropdownList with dataMode=false

**Use Case:** Browse-only dropdown (no selection tracking)

```vue
<template>
  <DropdownList
    entity="events"
    :project="projectId"
    title="Browse Events"
    size="medium"
    :dataMode="false"
    @item-click="handleEventClick"
  >
    <template #trigger="{ open }">
      <button @click="open" class="browse-btn">
        📅 Browse Events
      </button>
    </template>
  </DropdownList>
</template>

<script setup lang="ts">
const projectId = 'tp'

function handleEventClick(item: any, event: MouseEvent) {
  console.log('Clicked event:', item)
  // Navigate to event detail page, open modal, etc.
  window.location.href = `/events/${item.id}`
}
</script>
```

**Key Features:**
- No selection UI (no checkboxes)
- Item click navigation only
- Cleaner display for browsing
- Still fetches full entity data

---

## pList Examples

### Example 4: pList with dataMode=false, multiSelect=false

**Use Case:** Static event listing on landing page

```vue
<template>
  <Section background="muted">
    <Container>
      <pList
        type="events"
        :project-domaincode="projectId"
        item-type="card"
        size="medium"
        header="Upcoming Events"
        is-footer
        interaction="static"
        :dataMode="false"
      />
    </Container>
  </Section>
</template>

<script setup lang="ts">
import pList from '@/components/page/pList.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'

const projectId = 'tp'
</script>
```

**Key Features:**
- Display-only mode (default for pList)
- No selection UI
- Clean content presentation
- Automatic API fetching

---

### Example 5: pList with interaction="previewmodal"

**Use Case:** Instructor directory with preview

```vue
<template>
  <Section>
    <Container>
      <Heading level="2">Our Instructors</Heading>
      <pList
        type="instructors"
        :project-domaincode="projectId"
        item-type="tile"
        size="medium"
        interaction="previewmodal"
        :dataMode="false"
      />
    </Container>
  </Section>
</template>

<script setup lang="ts">
import pList from '@/components/page/pList.vue'

const projectId = 'tp'
</script>
```

**Key Features:**
- Click item to open modal
- Modal shows ItemCard with teaser
- No selection tracking
- Better UX than direct navigation

---

### Example 6: pList with dataMode=true, multiSelect=true

**Use Case:** Admin bulk operations page

```vue
<template>
  <Section>
    <Container>
      <div class="admin-toolbar">
        <Heading level="2">Manage Instructors</Heading>
        <div class="actions">
          <button @click="bulkArchive" :disabled="!selectedIds.length">
            Archive Selected ({{ selectedIds.length }})
          </button>
          <button @click="bulkExport" :disabled="!selectedIds.length">
            Export CSV
          </button>
        </div>
      </div>

      <pList
        type="instructors"
        :project-domaincode="projectId"
        item-type="row"
        size="small"
        interaction="static"
        :dataMode="true"
        :multiSelect="true"
        v-model:selectedIds="selectedIds"
        @selected="handleSelected"
        @selectedXml="handleXmlIds"
      />

      <!-- Selected items info -->
      <div v-if="selectedInstructors.length" class="selection-info">
        <h3>Selected: {{ selectedInstructors.length }}</h3>
        <ul>
          <li v-for="instructor in selectedInstructors" :key="instructor.id">
            {{ instructor.entityname }} ({{ instructor.xmlID }})
          </li>
        </ul>
      </div>
    </Container>
  </Section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import pList from '@/components/page/pList.vue'

const projectId = 'tp'
const selectedIds = ref<number[]>([])
const selectedInstructors = ref<any[]>([])
const xmlIds = ref<string[]>([])

function handleSelected(instructors: any[]) {
  selectedInstructors.value = instructors
}

function handleXmlIds(ids: string[]) {
  xmlIds.value = ids
}

async function bulkArchive() {
  await fetch('/api/instructors/bulk-archive', {
    method: 'POST',
    body: JSON.stringify({ ids: selectedIds.value })
  })
  selectedIds.value = []
}

async function bulkExport() {
  const csv = selectedInstructors.value
    .map(i => `${i.id},${i.entityname},${i.xmlID}`)
    .join('\n')
  // Download CSV...
}
</script>
```

**Key Features:**
- Full page list with selection
- Batch operations
- Shows checkboxes on all items
- Real-time selection count

---

## Props Reference

### Common Props (Both Components)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | `'posts' \| 'events' \| 'instructors' \| 'projects' \| 'images'` | Required | Entity type to fetch |
| `project` | `string` | `undefined` | Project domaincode filter |
| `size` | `'small' \| 'medium'` | `'small'` (Dropdown)<br>`'medium'` (pList) | Item display size |
| `dataMode` | `boolean` | `true` (Dropdown)<br>`false` (pList) | Enable selection UI |
| `multiSelect` | `boolean` | `false` | Allow multiple selections |
| `selectedIds` | `number \| number[]` | `undefined` | v-model for selected IDs |
| `filterIds` | `number[]` | `undefined` | Filter entities by ID list |
| `filterXmlPrefix` | `string` | `undefined` | Filter by XML ID prefix (e.g., "tp.event") ✨ NEW |
| `filterXmlPrefixes` | `string[]` | `undefined` | Filter by multiple prefixes (OR logic) ✨ NEW |
| `filterXmlPattern` | `RegExp` | `undefined` | Filter by XML ID regex pattern ✨ NEW |

### DropdownList Specific

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Dropdown header title |
| `displayXml` | `boolean` | `false` | Show XML IDs in trigger |

### pList Specific

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'posts' \| 'events' \| 'instructors' \| 'projects'` | Required | Content type (maps to entity) |
| `itemType` | `'tile' \| 'card' \| 'row'` | `'row'` | Display component type |
| `interaction` | `'static' \| 'zoom' \| 'previewmodal'` | `'static'` | Item click behavior |
| `header` | `string` | `undefined` | Section heading |
| `isAside` | `boolean` | `false` | Sidebar context styling |
| `isFooter` | `boolean` | `false` | Footer context styling |
| `limit` | `number` | `6` | Max items (not yet implemented) |

---

## Event Emissions

### Selection Events (dataMode=true)

```typescript
// Emitted when selection changes
@update:selectedIds="(value: number | number[] | null) => void"

// Emitted with full entity objects
@selected="(value: EntityItem | EntityItem[]) => void"

// Emitted with XML IDs
@selectedXml="(value: string | string[]) => void"
```

### Click Events (always emitted)

```typescript
// Emitted on any item click (regardless of dataMode)
@item-click="(item: any, event: MouseEvent) => void"
```

**Event Flow Example:**

```vue
<DropdownList
  entity="events"
  :dataMode="true"
  :multiSelect="true"
  v-model:selectedIds="ids"
  @update:selectedIds="ids = $event"     // [1, 2, 3]
  @selected="items = $event"             // [{ id: 1, ... }, { id: 2, ... }]
  @selectedXml="xmlIds = $event"         // ["tp.event.001", "tp.event.002"]
  @item-click="handleClick"              // (item, event)
/>
```

---

## Best Practices

### When to Use DropdownList

✅ **Use for:**
- Form inputs requiring entity selection
- Space-constrained interfaces
- Single or multi-select pickers
- Dropdowns in toolbars/headers

❌ **Don't use for:**
- Main page content display
- Large result sets requiring pagination
- Always-visible browsing interfaces

### When to Use pList

✅ **Use for:**
- Main content sections
- Landing page showcases
- Archive/directory pages
- Admin management interfaces

❌ **Don't use for:**
- Form inputs
- Space-constrained areas
- Inline selection widgets

### DataMode Selection

**Use `dataMode=true` when:**
- Building forms or data entry interfaces
- Need selection tracking
- Implementing batch operations
- User needs to "pick" items for an action

**Use `dataMode=false` when:**
- Displaying content for reading/browsing
- Navigation-focused lists
- Preview/showcase sections
- No data collection needed

---

## XML ID Filtering (New Feature) ✨

### Overview

XML ID filtering allows you to filter entities based on their structured XML identifiers without requiring database IDs. This is particularly useful for:
- Multi-project applications
- Mixed entity type views
- Hierarchical filtering
- Pattern-based selection

### XML ID Structure

Standard format: `{project}.{entity}.{unique_identifier}`

Examples:
```
tp.event.ws2025          → Theaterpedia, Event, Workshop 2025
tp.instructor.jd001      → Theaterpedia, Instructor, John Doe
music.event.concert42    → Music Project, Event, Concert 42
```

### Filter by Single Prefix

Show only events from Theaterpedia project:

```vue
<DropdownList 
  entity="events"
  filterXmlPrefix="tp.event"
  title="TP Events Only"
/>
```

### Filter by Multiple Prefixes (OR Logic)

Show events AND instructors from Theaterpedia:

```vue
<pList 
  type="all"
  :filterXmlPrefixes="['tp.event', 'tp.instructor']"
  header="TP Events & Instructors"
/>
```

### Filter by Pattern

Show only workshop events (matching pattern):

```vue
<DropdownList 
  entity="events"
  :filterXmlPattern="/\.(ws|workshop)\d+$/"
  title="Workshops Only"
/>
```

### Combined Filtering

Combine multiple filter types with AND logic:

```vue
<DropdownList 
  entity="events"
  :filterIds="favoriteIds"
  filterXmlPrefix="tp"
  :filterXmlPattern="/^(?!.*\.archived).*$/"
  title="My Favorite Active TP Events"
/>
```

**Filter Logic:**
1. Must be in `favoriteIds` array (numeric ID)
2. Must start with "tp" (XML prefix)
3. Must NOT contain ".archived" (pattern exclusion)

### Helper Functions

XML ID utility functions are available in `xmlHelpers.ts`:

```typescript
import { getXmlIdPrefix, getXmlIdFragment, matchesXmlIdPrefix } from '@/components/clist/xmlHelpers'

// Extract prefix
const prefix = getXmlIdPrefix("tp.event.ws2025", 2)  // "tp.event"

// Get specific fragment
const project = getXmlIdFragment("tp.event.ws2025", 0)  // "tp"
const entity = getXmlIdFragment("tp.event.ws2025", 1)   // "event"
const unique = getXmlIdFragment("tp.event.ws2025", 2)   // "ws2025"

// Check prefix match
const matches = matchesXmlIdPrefix("tp.event.ws2025", ["tp.event", "tp.instructor"])  // true
```

---

## Performance Tips

1. **Use `filterIds` for pre-filtered lists:**
   ```vue
   <DropdownList :filterIds="[1, 2, 3]" />
   ```

2. **Use XML prefix filtering for client-side filtering:**
   ```vue
   <pList filterXmlPrefix="tp.event" />
   ```

3. **Combine filters efficiently:**
   - All filters applied in single pass
   - No performance penalty for multiple filters

4. **Size selection:**
- Navigation-focused lists
- Preview/showcase sections
- No data collection needed

---

## Performance Tips

1. **Use `filterIds` for pre-filtered lists:**
   ```vue
   <DropdownList :filterIds="[1, 2, 3]" />
   ```

2. **Size selection:**
   - Use `size="small"` (ItemRow) for long lists
   - Use `size="medium"` (ItemTile) for galleries

3. **Avoid unnecessary dataMode:**
   - If no selection needed, set `dataMode=false`
   - Reduces DOM complexity (no checkboxes)

---

## Troubleshooting

### Selection not working
- Verify `dataMode={true}`
- Check `v-model:selectedIds` binding
- Ensure entity has valid `id` field

### Items not appearing
- Verify API endpoint exists for entity
- Check `project` prop matches valid domaincode
- Inspect console for fetch errors

### Wrong display size
- ItemList: `size="small"` → ItemRow (64×64px)
- ItemList: `size="medium"` → ItemTile (128×128px)
- ItemCard requires explicit `item-type="card"`

---

## Related Documentation

- **Design Spec:** `/docs/CLIST_DESIGN_SPEC.md` - Visual design and dimensions
- **Component README:** `/src/components/clist/README.md` - Implementation details
- **Type Definitions:** `/src/components/clist/types.ts` - ItemOptions & ItemModels
- **Feature Analysis:** `/docs/CLIST_ITEMOPTIONS_ANALYSIS.md` - Visual indicator features

---

**Last Updated:** November 11, 2025  
**Maintainer:** Development Team  
**Status:** Production Ready ✅
