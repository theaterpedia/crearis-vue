# SYSREG taglogic Analysis & Implementation Guide
**Date:** 2025-11-19  
**Context:** Understanding existing taglogic implementation for Migration 022

---

## Question 7 Response: taglogic Understanding

**User asked:** "do you have enough information/understanding of this: 'field taglogic: category | subcategory | toggle | option'"

**Answer:** YES - I now have enough understanding. The taglogic system is **already implemented** in the Vue components, particularly in `tagsMultiToggle.vue`. Here's what I found:

---

## Existing Implementation Analysis

### Component: `src/components/images/tagsMultiToggle.vue`

**Current Props:**
```typescript
interface TagsMultiToggleProps {
    modelValue: number[]  // byte values (0-255)
    mode?: 'free' | 'choose-one' | 'toggle-two'
    size?: 'small' | 'medium' | 'large'
    maxTags?: number
    availableTags?: Array<{ label: string; value: number }>
}
```

**Current Modes (matches taglogic):**
1. **`free`** → Allows multiple independent selections
   - User can select/deselect any combination
   - Limited by `maxTags` prop
   - **Maps to taglogic: `toggle`**

2. **`choose-one`** → Select exactly one from group
   - Replaces previous selection with new one
   - Only one active at a time
   - **Maps to taglogic: `option` or `category`**

3. **`toggle-two`** → Binary toggle between two states
   - Toggle between value and empty
   - **Maps to taglogic: `toggle` (special case with 2 options)**

---

## Mapping: taglogic ↔ Vue Component Modes

### Database taglogic → Frontend mode

| taglogic (DB) | Vue mode | Behavior | Example |
|---------------|----------|----------|---------|
| `category` | `choose-one` | Pick one from group (required) | Age: child\|teen\|adult\|all |
| `subcategory` | `choose-one` | Pick one sub-option (optional) | Sub-age: 3-6\|6-9\|9-12 |
| `toggle` | `free` | Multiple independent toggles | isDark, hasOverlay, isSquare |
| `option` | `choose-one` | Pick one option (optional) | Access: project\|public\|private\|internal |

### Key Differences:

**category vs option:**
- `category` = REQUIRED choice (always has a value, often has `is_default=true` entry)
- `option` = OPTIONAL choice (can be NULL/unset)

**subcategory:**
- Always child of a `category`
- Displayed with breadcrumb: `parent > child`
- Example: `age > child` then `sub-age > 6-9` displays as `child > 6-9`

---

## Current Bitmask Implementation (Images Table)

From `ImagesCoreAdmin.vue` and `cimgImport.vue`:

```typescript
// Age Group (bits 0-1) - 2 bits = 4 options
const ageGroupOptions = [
    { value: 0, label: 'All Ages (default)' },      // 00
    { value: 1, label: 'Children' },                // 01
    { value: 2, label: 'Teens' },                   // 10
    { value: 3, label: 'Adults' }                   // 11
]

// Subject Type (bits 2-3) - 2 bits = 4 options
const subjectTypeOptions = [
    { value: 0, label: 'General' },
    { value: 4, label: 'Person' },    // bit 2 set
    { value: 8, label: 'Object' },    // bit 3 set
    { value: 12, label: 'Scene' }     // both bits set
]

// Access Level (bits 4-5) - 2 bits = 4 options
const accessLevelOptions = [
    { value: 0, label: 'Project (default)' },
    { value: 16, label: 'Public' },    // bit 4 set
    { value: 32, label: 'Private' },   // bit 5 set
    { value: 48, label: 'Internal' }   // both bits set
]
```

**Implementation Pattern:**
- Each option group gets 2 bits (allows 4 choices)
- Bits are at specific positions (0-1, 2-3, 4-5, etc.)
- Values are powers of 2 or combinations
- Uses bitmask operations for get/set

---

## Question 4 Response: NULL Handling in Bitmasks

**User asked:** "is NULL available for single bits or bit-groups on bitmask/bytea (like: a third value other than false|true). What are your recommendations"

### Answer: NULL Handling Strategy

**PostgreSQL BYTEA field CAN be NULL**, but individual bits within a BYTEA cannot be NULL.

**Recommended Approach (3 levels):**

#### Level 1: Field-Level NULL (Entire BYTEA)
```sql
-- Entity table
status_val BYTEA DEFAULT NULL  -- NULL = no status set yet
ctags_val BYTEA DEFAULT NULL   -- NULL = no common tags set
```

**Use for:** Record not yet categorized at all

#### Level 2: Reserved "Unset" Value (0x00)
```sql
-- In sysreg table
INSERT INTO status VALUES 
    (E'\\x00'::bytea, 'unset', 'category', TRUE, 'status', ...);
```

**Use for:** Explicit "no choice" within a category group

#### Level 3: Default Values (is_default=true)
```sql
-- In sysreg table  
INSERT INTO ctags VALUES
    (E'\\x01'::bytea, 'age > all', 'category', TRUE, 'ctags', ...);
    -- is_default = TRUE means this is the fallback
```

**Use for:** Default choice when category is required

### Recommended Implementation:

```typescript
// Frontend composable
export function useTags() {
    // Check field-level NULL
    if (entity.ctags_val === null) {
        return { label: '(Not Set)', isEmpty: true }
    }
    
    // Check for zero bytes (unset)
    if (isAllZeros(entity.ctags_val)) {
        return { label: '(None)', isEmpty: true }
    }
    
    // Normal tag lookup
    return lookupTag(entity.ctags_val)
}

// API endpoint handling
function getEntityStatus(entity) {
    // Level 1: Field NULL
    if (!entity.status_val) {
        return { status_label: 'Not Set', status_desc: null }
    }
    
    // Level 2: Check for 0x00 (reserved unset value)
    if (entity.status_val.equals(Buffer.from([0x00]))) {
        return { status_label: 'Unset', status_desc: null }
    }
    
    // Level 3: Normal lookup (with default fallback)
    const status = lookupStatus(entity.status_val)
    return {
        status_label: status.name_i18n[lang] || status.name,
        status_desc: status.desc_i18n?.[lang] || status.description
    }
}
```

### Resolution Through Layers:

**Component Level:**
```vue
<template>
    <div class="status-badge" :class="statusClass">
        {{ statusLabel }}
    </div>
</template>

<script setup>
const statusLabel = computed(() => {
    if (!props.entity.status_val) return 'Not Set'  // NULL
    if (props.entity.status_label === 'unset') return '–'  // Reserved
    return props.entity.status_label  // Normal
})

const statusClass = computed(() => {
    if (!props.entity.status_val) return 'badge-muted'
    if (props.entity.status_label === 'unset') return 'badge-empty'
    return `badge-${props.entity.status_label.toLowerCase()}`
})
</script>
```

**Composable Level:**
```typescript
export function useEntityStatus(entity: Ref<Entity>) {
    const hasStatus = computed(() => entity.value.status_val !== null)
    
    const isUnset = computed(() => {
        return entity.value.status_val?.equals(UNSET_BYTEA)
    })
    
    const statusDisplay = computed(() => {
        if (!hasStatus.value) return { label: 'Not Set', color: 'muted' }
        if (isUnset.value) return { label: '–', color: 'empty' }
        return {
            label: entity.value.status_label,
            color: getStatusColor(entity.value.status_val)
        }
    })
    
    return { hasStatus, isUnset, statusDisplay }
}
```

**Endpoint Level:**
```typescript
// GET /api/projects
async function getProjects(req, res) {
    const projects = await db.all(`
        SELECT 
            id,
            name,
            status_val,
            status_label,  -- Generated column handles NULL/unset
            status_desc
        FROM projects
    `)
    
    // Frontend receives ready-to-display labels
    // NULL → status_label = NULL (frontend shows 'Not Set')
    // 0x00 → status_label = 'Unset' (frontend shows '–')
    // 0x01 → status_label = 'New' (frontend shows 'New')
    
    res.json(projects)
}
```

---

## Updated taglogic Field Values

Based on analysis, here's the refined taglogic constraint:

```sql
CREATE TABLE sysreg (
    -- ...
    taglogic TEXT NOT NULL CHECK (
        taglogic IN (
            'category',      -- Required choice, one from group (e.g., age)
            'subcategory',   -- Optional sub-choice under category (e.g., sub-age)
            'option',        -- Optional choice, one from group (e.g., access level)
            'toggle'         -- Independent binary flag (e.g., isDark)
        )
    ),
    -- ...
)
```

### Usage Rules:

**category:**
- Always has `is_default=true` entry (fallback/default choice)
- Used with `choose-one` mode in Vue
- Required field (though can use default)
- Example: Age groups (all, child, teen, adult)

**subcategory:**
- Child of a `category` entry
- Optional refinement
- Displays with breadcrumb separator: `parent > child`
- Example: Sub-age (3-6, 6-9, 9-12 under 'child')

**option:**
- Optional choice, one from group
- No required default (can be NULL)
- Used with `choose-one` mode in Vue
- Example: Access level (project, public, private, internal)

**toggle:**
- Independent boolean flag
- Multiple toggles can be active simultaneously
- Used with `free` mode in Vue
- Example: isDark, hasOverlay, isSquare

---

## Migration 022 Implementation Recommendations

### 1. Add taglogic to Existing Data

When migrating from old `status` table:

```typescript
// Determine taglogic based on usage pattern
function inferTagLogic(statusName: string, tableName: string): string {
    // Status values are always categories (required)
    if (tableName === 'status') {
        return 'category'
    }
    
    // Tags depend on usage
    if (statusName.includes(' > ')) {
        return 'subcategory'  // Has parent > child pattern
    }
    
    // Check if multiple tags can coexist
    const usageCount = countSimultaneousUsage(statusName)
    if (usageCount > 1) {
        return 'toggle'  // Multiple can be active
    }
    
    return 'option'  // Single choice, optional
}
```

### 2. Seed taglogic Values

```sql
-- Status (always category)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x00'::bytea, 'new', 'category', TRUE, 'status'),
    (E'\\x01'::bytea, 'draft', 'category', FALSE, 'status'),
    (E'\\x02'::bytea, 'active', 'category', FALSE, 'status');

-- Status variations (subcategory)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x0001'::bytea, 'new > idea', 'subcategory', FALSE, 'status'),
    (E'\\x0002'::bytea, 'new > template', 'subcategory', FALSE, 'status');

-- Age groups (category - required)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x01'::bytea, 'age > all', 'category', TRUE, 'ctags'),
    (E'\\x02'::bytea, 'age > child', 'category', FALSE, 'ctags'),
    (E'\\x04'::bytea, 'age > teen', 'category', FALSE, 'ctags'),
    (E'\\x08'::bytea, 'age > adult', 'category', FALSE, 'ctags');

-- Sub-age (subcategory - optional)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x0100'::bytea, 'sub-age > 3-6', 'subcategory', FALSE, 'ctags'),
    (E'\\x0200'::bytea, 'sub-age > 6-9', 'subcategory', FALSE, 'ctags');

-- Access level (option - optional choice)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x10'::bytea, 'access > project', 'option', TRUE, 'ctags'),
    (E'\\x20'::bytea, 'access > public', 'option', FALSE, 'ctags'),
    (E'\\x40'::bytea, 'access > private', 'option', FALSE, 'ctags');

-- Record tags (toggle - independent flags)
INSERT INTO sysreg (value, name, taglogic, is_default, tagfamily)
VALUES
    (E'\\x01'::bytea, 'isDark', 'toggle', FALSE, 'rtags'),
    (E'\\x02'::bytea, 'hasOverlay', 'toggle', FALSE, 'rtags'),
    (E'\\x04'::bytea, 'isSquare', 'toggle', FALSE, 'rtags');
```

### 3. Frontend Mapping

Update `tagsMultiToggle.vue` to use taglogic:

```vue
<template>
    <tagsMultiToggle
        v-model="entity.ctags_val"
        :mode="getVueModeFromTagLogic(tagGroup.taglogic)"
        :available-tags="tagGroup.options"
        :placeholder="tagGroup.label"
    />
</template>

<script setup>
function getVueModeFromTagLogic(taglogic: string): 'free' | 'choose-one' | 'toggle-two' {
    switch (taglogic) {
        case 'category':
        case 'subcategory':
        case 'option':
            return 'choose-one'
        case 'toggle':
            return 'free'  // or 'toggle-two' if only 2 options
        default:
            return 'free'
    }
}
</script>
```

---

## Summary of Answers

### Answer to Question 4 (NULL handling):
**Recommendation:** Use 3-level strategy:
1. Field-level NULL (`status_val = NULL`) for "not set at all"
2. Reserved 0x00 byte value for "explicitly unset"
3. Default values (`is_default=true`) for required categories

This resolves cleanly through endpoints (generated columns handle NULL) and composables (check for NULL, then check for 0x00, then normal lookup).

### Answer to Question 7 (taglogic understanding):
**YES - Fully understood:**
- `category` = required choice, maps to Vue `choose-one` mode
- `subcategory` = optional refinement, maps to Vue `choose-one` mode
- `option` = optional choice, maps to Vue `choose-one` mode
- `toggle` = independent flag, maps to Vue `free` mode

Existing implementation in `tagsMultiToggle.vue` already supports this with `mode` prop. Migration 022 will copy taglogic values from existing usage patterns and seed new groups.

---

## Next Steps

1. ✅ Update Migration 022 plan to include taglogic inference logic
2. ✅ Document NULL handling strategy for all migrations
3. ✅ Update Phase 6 (seed system) with taglogic-aware seeding
4. ✅ Plan frontend adapter for taglogic → mode mapping
5. Continue with Phase 1 research (existing status/tags analysis)
