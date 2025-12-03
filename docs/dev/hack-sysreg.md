# Hack the Sysreg

Quick reference tables for system registry values. Use this when you need to quickly look up bit values, status codes, or tag families.

## Dev Tables (Auth Focus)

### sysreg_statuses

Entity lifecycle states:

| ID | Name | Description | Scope |
|----|------|-------------|-------|
| 1 | idea | Initial concept | General |
| 2 | draft | Work in progress | General |
| 3 | review | Under review | General |
| 4 | published | Public/live | General |
| 5 | archived | No longer active | General |
| 18 | new | New project | Project (stepper) |
| 19 | demo | Demo project | Project (stepper) |

### sysreg_configs

System-wide configuration:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| default_theme | number | 0 | Default theme ID |
| site_name | string | "Theaterpedia" | Default site name |

### sysreg_rtags (Role Tags)

Visibility control by role:

| Bit | Name | Description |
|-----|------|-------------|
| 2 | r_partner | Visible to partners |
| 4 | r_participant | Visible to participants |
| 8 | r_member | Visible to members |

**Usage in `project_members.configrole`:**
```sql
-- Partner: configrole = 2
-- Participant: configrole = 4
-- Member: configrole = 8
-- Partner + Participant: configrole = 6 (2 | 4)
```

---

## Tag Families (Content Focus)

### ctags (Content Tags)

Content classification with parent bits:

| Bit | Parent | Name | Description |
|-----|--------|------|-------------|
| 1 | - | category_a | Content category A |
| 2 | - | category_b | Content category B |
| ... | ... | ... | ... |

### ttags (Thematic Tags)

Thematic/topic tags:

| Bit | Parent | Name | Description |
|-----|--------|------|-------------|
| 1 | - | theme_a | Theme A |
| 2 | - | theme_b | Theme B |
| ... | ... | ... | ... |

### dtags (Documentation Tags)

Documentation metadata tags:

| Bit | Parent | Name | Description |
|-----|--------|------|-------------|
| 1 | - | spielform | Game form category |
| 2 | - | altersgruppe | Age group category |
| ... | ... | ... | ... |

---

## Tag Family Component Usage

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
| `ttags` | number | Thematic tags bitmask |
| `ctags` | number | Content tags bitmask |
| `dtags` | number | Documentation tags bitmask |
| `enable-edit` | string[] | Which families are editable |
| `group-selection` | string | 'all' \| 'core' \| custom |
| `layout` | string | 'wrap' \| 'grid' |

### Composable

```typescript
import { useTagFamily } from '@/composables/useTagFamily'

const family = useTagFamily({
  familyName: 'dtags',
  modelValue: ref(5),
  groupSelection: 'all'
})

// Check active tags
family.isEmpty.value
family.activeGroups.value

// Get/set group values
family.getGroupValue('spielform')
family.setGroupValue('spielform', 1)
```

---

## Quick SQL References

### Check user's project role
```sql
SELECT pm.configrole 
FROM project_members pm
WHERE pm.project_id = ? AND pm.user_id = ?
```

### Get all items visible to role
```sql
-- For a user with configrole = 4 (participant)
SELECT * FROM posts
WHERE project_id = ?
  AND (r_participant = 1 OR r_member = 1)  -- visible to their role or lower
```

### Status checks in code
```typescript
// Stepper mode (status 18 or 19)
const isStepper = status_id === 18 || status_id === 19

// Published (status 4)
const isPublished = status_id === 4
```

---

*See [Auth Sysreg](/dev/sysreg/auth) for detailed documentation.*
