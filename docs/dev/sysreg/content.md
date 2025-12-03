# Sysreg II: Content Focus

The content-focused sysreg tables manage tag families for content classification.

## Overview

Three tag families for content organization:

| Family | Purpose |
|--------|---------|
| `ctags` | Content classification |
| `ttags` | Thematic/topic tags |
| `dtags` | Documentation/metadata |

## Tag System Architecture

### Bitmask Storage

Tags are stored as bitmasks in entity columns:
- `entity.ctags` - Content tags (integer)
- `entity.ttags` - Thematic tags (integer)
- `entity.dtags` - Documentation tags (integer)

### Hierarchical Structure

Each family has **groups** containing **tags**:

```
Family (e.g., dtags)
├── Group: spielform (parent_bit)
│   ├── Tag: freies-spiel (bit: 1)
│   └── Tag: angeleitetes-spiel (bit: 2)
├── Group: altersgruppe
│   ├── Tag: kinder (bit: 1)
│   └── Tag: jugendliche (bit: 2)
└── ...
```

## ctags (Content Tags)

### Purpose

Classify content by type and category.

### Schema

```sql
CREATE TABLE sysreg_ctags (
  id INTEGER PRIMARY KEY,
  bit INTEGER NOT NULL,
  parent_bit INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  group_name TEXT
);
```

### Example Values

| Bit | Parent | Name | Group |
|-----|--------|------|-------|
| 1 | NULL | workshop | type |
| 2 | NULL | course | type |
| 4 | NULL | performance | type |
| 1 | 1 | single-session | workshop_format |
| 2 | 1 | multi-session | workshop_format |

### Usage

```typescript
// Check if entity has 'workshop' tag
const isWorkshop = (entity.ctags & 1) !== 0

// Add 'course' tag
entity.ctags = entity.ctags | 2

// Remove 'workshop' tag
entity.ctags = entity.ctags & ~1
```

## ttags (Thematic Tags)

### Purpose

Classify content by theme or topic.

### Example Values

| Bit | Parent | Name | Description |
|-----|--------|------|-------------|
| 1 | NULL | demokratie | Democracy/civic |
| 2 | NULL | kreativitaet | Creativity |
| 4 | NULL | koerperarbeit | Body work |

### Typical Use Cases

- Tag events by theme
- Filter posts by topic
- Organize content thematically

## dtags (Documentation Tags)

### Purpose

Metadata for documentation and organization.

### Example Groups

| Group | Purpose |
|-------|---------|
| spielform | Type of theatrical game |
| altersgruppe | Age group |
| gruppengrösse | Group size |
| schwierigkeit | Difficulty level |

### Example Values

| Bit | Group | Name | Description |
|-----|-------|------|-------------|
| 1 | spielform | freies-spiel | Free play |
| 2 | spielform | angeleitetes-spiel | Guided play |
| 1 | altersgruppe | kinder | Children (6-12) |
| 2 | altersgruppe | jugendliche | Youth (13-18) |
| 4 | altersgruppe | erwachsene | Adults (18+) |

## TagFamilies Component

The unified component for managing all tag families:

```vue
<TagFamilies
  v-model:ttags="entity.ttags"
  v-model:ctags="entity.ctags"
  v-model:dtags="entity.dtags"
  :enable-edit="['ttags', 'ctags', 'dtags']"
  group-selection="core"
  layout="wrap"
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `ttags` | number | v-model for thematic tags |
| `ctags` | number | v-model for content tags |
| `dtags` | number | v-model for documentation tags |
| `enable-edit` | string[] | Which families are editable |
| `group-selection` | string | 'all' \| 'core' \| custom |
| `layout` | string | 'wrap' \| 'grid' \| 'inline' |

### Group Selection

| Value | Description |
|-------|-------------|
| `'all'` | Show all groups |
| `'core'` | Show primary groups only |
| `['spielform', 'altersgruppe']` | Specific groups |

## useTagFamily Composable

```typescript
import { useTagFamily } from '@/composables/useTagFamily'

const family = useTagFamily({
  familyName: 'dtags',
  modelValue: ref(entity.dtags),
  groupSelection: 'all'
})

// Read groups
family.groups.value
family.activeGroups.value
family.isEmpty.value

// Manipulate
family.getGroupValue('spielform')
family.setGroupValue('spielform', 1)
family.clearGroup('spielform')
```

## API Endpoints

### List Tags

```http
GET /api/sysreg/ctags
GET /api/sysreg/ttags
GET /api/sysreg/dtags
```

### Get Tag Details

```http
GET /api/sysreg/{family}/{id}
```

### Entity with Tags

```http
# Creating an entity with tags
POST /api/events
Content-Type: application/json

{
  "title": "Workshop",
  "ctags": 1,
  "ttags": 3,
  "dtags": 5
}

# Updating tags
PATCH /api/events/{id}
Content-Type: application/json

{
  "ctags": 3,
  "ttags": 7
}
```

## Bit Operations Reference

```typescript
// Check if bit is set
const hasTag = (value: number, bit: number) => (value & bit) !== 0

// Set bit
const addTag = (value: number, bit: number) => value | bit

// Clear bit
const removeTag = (value: number, bit: number) => value & ~bit

// Toggle bit
const toggleTag = (value: number, bit: number) => value ^ bit

// Count active bits
const countTags = (value: number) => {
  let count = 0
  while (value) {
    count += value & 1
    value >>= 1
  }
  return count
}
```

---

*See also: [Hack the Sysreg](/dev/hack-sysreg) for quick reference*
