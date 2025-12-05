# Hack the Sysreg

Quick reference tables for system registry values. Use this when you need to quickly look up bit values, status codes, or tag families.

## Dev Tables (Auth Focus)

### sysreg_statuses (Migration 040)

Entity lifecycle states with 3-bit slots:

| Value | Bits | Name | Label DE | Scope |
|-------|------|------|----------|-------|
| 1 | 0-2 | new | Neu | Category |
| 2 | 0-2 | new_image | Roh | Subcategory |
| 3 | 0-2 | new_user | Passiv | Subcategory |
| 8 | 3-5 | demo | Demo | Category |
| 16 | 3-5 | demo_event | Vorlage | Subcategory |
| 24 | 3-5 | demo_project | Vorlage | Subcategory |
| 64 | 6-8 | draft | Entwurf | Category |
| 512 | 9-11 | confirmed | Bestätigt | Category |
| 4096 | 12-14 | released | Freigegeben | Category |
| 32768 | 15 | archived | Archiviert | Single bit |
| 65536 | 16 | trash | Papierkorb | Single bit |

**Scope toggles (bits 17-21):**
| Value | Bit | Name | Description |
|-------|-----|------|-------------|
| 131072 | 17 | scope_team | Team visibility |
| 262144 | 18 | scope_login | Login visibility |
| 524288 | 19 | scope_project | Project scope |
| 1048576 | 20 | scope_regio | Regional scope |
| 2097152 | 21 | scope_public | Public scope |

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
// Status values from Migration 040
const STATUS_NEW = 1        // bits 0-2
const STATUS_DEMO = 8       // bits 3-5
const STATUS_DRAFT = 64     // bits 6-8

// Stepper mode (status new=1 or demo=8)
const isStepper = status_id === 1 || status_id === 8

// Draft and above (activated)
const isActivated = status_id >= 64

// Published (released category)
const isPublished = status_id >= 4096 && status_id < 32768
```

---

*See [Auth Sysreg](/dev/sysreg/auth) for detailed documentation.*
