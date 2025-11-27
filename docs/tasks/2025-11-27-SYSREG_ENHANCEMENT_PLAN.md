# Sysreg Enhancement Plan
**Date**: 2025-11-27  
**Status**: Planning Phase  
**Migration**: 036 Complete → 037 dtags Restructure

## Overview
Enhance the sysreg system with comprehensive UI components for displaying and editing tag families across the application. Restructure dtags with new theater pedagogy taxonomy.

---

## Phase 1: Database & Configuration Updates

### 1.1 Migration 037: dtags Restructure
**File**: `server/database/migrations/037-dtags-restructure.sql`

**Actions**:
1. Delete all existing dtags entries
2. Create new dtags taxonomy based on theater pedagogy (4 tag groups)
3. Add constraint for subcategory naming: `{category} > {subcategory}`

**New dtags Structure** (from 2025-11-26-dtags.md):

#### TagGroup 1: Spielform (bits 0-7, 8 bits total)
- **Kreisspiel** (3 subcategories) - bits 0-1
- **Raumlauf** (3 subcategories) - bits 2-3
- **Kleingruppen** (3 subcategories) - bits 4-5
- **Forum** (3 subcategories) - bits 6-7

**Note**: Forum previously had 4 subcategories but reduced to 3 to fit 2-bit encoding (4 values: 0=none, 1=category-only, 2-3=subcategories)

#### TagGroup 2: Animiertes Theaterspiel (bits 8-15, 8 bits total)
- **El. Animation** (3 subcategories) - bits 8-9
- **Sz. Animation** (3 subcategories) - bits 10-11
- **Impro** (3 subcategories) - bits 12-13
- **animiert** (3 subcategories) - bits 14-15

#### TagGroup 3: Szenische Themenarbeit (bits 16-25, 10 bits total) ✅ CORRECTED
- **Standbilder** (3 subcategories) - bits 16-17
- **Rollenspiel** (3 subcategories) - bits 18-19
- **TdU** (3 subcategories) - bits 20-21
- **Soziometrie** (3 subcategories) - bits 22-23
- **bewegte Themenarbeit** (3 subcategories) - bits 24-25

#### TagGroup 4: Pädagogische Regie (bits 26-31, 6 bits total) ✅ CORRECTED
- **zyklisch** (3 subcategories) - bits 26-27
- **linear** (3 subcategories) - bits 28-29
- **klassisch** (3 subcategories) - bits 30-31

**Total Bits Used**: 32/32 (perfect fit, all bits allocated)

**Multi-Select System**:
- **Default**: All categories are single-select (multiselect: false)
- **Category-level**: 2 bits = 4 values (0=none, 1=category-only, 2-3=subcategories)
- **Subcategories**: Always single-select within a category
- **Future**: Change `multiselect: true` to enable multiple categories per group (requires toggle bit encoding)

**SQL Structure**:
```sql
-- Delete existing dtags
DELETE FROM sysreg WHERE tagfamily = 'dtags';

-- Insert new dtags entries
-- Spielform group
INSERT INTO sysreg (tagfamily, taglogic, name, value, ...) VALUES
  ('dtags', 'group', 'spielform', 0, ...),
  ('dtags', 'category', 'kreisspiel', 1, ...),
  ('dtags', 'subcategory', 'kreisspiel > kreativimpuls', 1, ...),
  -- ... etc
```

### 1.2 Update sysreg-bitgroups.json
**File**: `src/config/sysreg-bitgroups.json`

**Changes**:
1. Add family-level metadata for all families (name, label, description)
2. Replace entire dtags section with 4 new groups
3. Add `icon` property to each group (default: 'tag', or specific icons)
4. Add `optional` flag to groups (default: false)

**New Structure**:
```json
{
  "dtags": {
    "name": "didactic_model",
    "label": {
      "de": "Didaktisches Modell",
      "en": "Didactic Model"
    },
    "description": {
      "de": "Theaterpädagogische Verfahren und Spielformen",
      "en": "Theater pedagogy methods and play forms"
    },
    "groups": [
      {
        "name": "spielform",
        "label": { "de": "Spielform", "en": "Play Form" },
        "description": { "de": "Grundlegende Spielformen im Theaterpädagogischen Kontext", "en": "Basic play forms in theater pedagogy context" },
        "icon": "users-round",
        "bits": [0, 1, 2, 3, 4, 5, 6, 7],
        "optional": false,
        "multiselect": false
      },
      {
        "name": "animiertes_theaterspiel",
        "label": { "de": "Animiertes Theaterspiel", "en": "Animated Theater Play" },
        "description": { "de": "Animationstechniken im Theater", "en": "Animation techniques in theater" },
        "icon": "sparkles",
        "bits": [8, 9, 10, 11, 12, 13, 14, 15],
        "optional": false,
        "multiselect": false
      },
      {
        "name": "szenische_themenarbeit",
        "label": { "de": "Szenische Themenarbeit", "en": "Scenic Theme Work" },
        "description": { "de": "Beschreibung Themenarbeit", "en": "Theme-based scenic work" },
        "icon": "theater",
        "bits": [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
        "optional": false,
        "multiselect": false
      },
      {
        "name": "paedagogische_regie",
        "label": { "de": "Pädagogische Regie", "en": "Pedagogical Direction" },
        "description": { "de": "Pädagogische Regie, Theatervermittlung", "en": "Pedagogical direction and theater mediation" },
        "icon": "clapperboard",
        "bits": [26, 27, 28, 29, 30, 31],
        "optional": true,
        "multiselect": false
      }
    ]
  },
  "status": {
    "name": "status",
    "label": { "de": "Status", "en": "Status" },
    "description": { "de": "Bearbeitungsstatus", "en": "Processing status" }
  },
  "config": {
    "name": "config",
    "label": { "de": "Konfiguration", "en": "Configuration" },
    "description": { "de": "Feature-Flags und Sichtbarkeit", "en": "Feature flags and visibility" },
    "groups": [...]
  },
  "rtags": {
    "name": "resource_tags",
    "label": { "de": "Ressourcen", "en": "Resources" },
    "description": { "de": "Ressourcentypen", "en": "Resource types" },
    "groups": [...]
  },
  "ttags": {
    "name": "theme_tags",
    "label": { "de": "Themen", "en": "Themes" },
    "description": { "de": "Thematische Zuordnungen", "en": "Thematic assignments" },
    "groups": [...]
  },
  "ctags": {
    "name": "context_tags",
    "label": { "de": "Kontext", "en": "Context" },
    "description": { "de": "Kontextuelle Metadaten", "en": "Contextual metadata" },
    "groups": [...]
  }
}
```

---

## Phase 2: New Composables

### 2.1 useTagFamily (Core Logic)
**File**: `src/composables/useTagFamily.ts`

**Purpose**: Core composable for managing a single tag family's state and operations

**Interface**:
```typescript
interface UseTagFamilyOptions {
  familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
  modelValue: number | null
  groupSelection?: 'core' | 'options' | 'all'
}

interface TagGroup {
  name: string
  label: Record<string, string>
  description: Record<string, string>
  icon: string
  bits: number[]
  optional: boolean
  multiselect: boolean  // NEW: enables multiple categories per group
}

interface UseTagFamilyReturn {
  // Configuration
  familyConfig: ComputedRef<TagFamilyConfig>
  groups: ComputedRef<TagGroup[]>
  
  // Current state
  activeGroups: ComputedRef<TagGroupSummary[]>
  activeTags: ComputedRef<ActiveTag[]>
  isEmpty: ComputedRef<boolean>
  
  // Group operations
  getGroupValue: (groupName: string) => number
  setGroupValue: (groupName: string, value: number) => void
  clearGroup: (groupName: string) => void
  hasActiveGroup: (groupName: string) => boolean
  
  // Tag operations
  getTagLabel: (tagValue: number) => string
  getTagsByGroup: (groupName: string) => SysregEntry[]
  
  // Emit update
  updateValue: (newValue: number) => void
}
```

**Features**:
- Load family configuration from sysreg-bitgroups.json
- Fetch sysreg entries for the family
- Filter groups by selection (core/options/all)
- Parse current value into active tags per group
- Provide tag manipulation methods
- Integrate with useSysregTags for bit operations

### 2.2 useTagFamilyEditor (Editor Logic)
**File**: `src/composables/useTagFamilyEditor.ts`

**Purpose**: Manage editing state for the tagFamilyEditor modal

**Interface**:
```typescript
interface UseTagFamilyEditorOptions {
  familyName: string
  modelValue: number
  groupSelection?: 'core' | 'options' | 'all'
}

interface UseTagFamilyEditorReturn {
  // Editor state
  editingValue: Ref<number>
  isDirty: ComputedRef<boolean>
  
  // Group management
  activeGroupNames: ComputedRef<string[]>
  inactiveGroupNames: ComputedRef<string[]>
  
  // Category/subcategory logic
  getCategoryMode: (groupName: string) => 'default' | 'subcategory'
  getSelectedCategory: (groupName: string) => SysregEntry | null
  getAvailableSubcategories: (groupName: string) => SysregEntry[]
  
  // Actions
  addGroup: (groupName: string) => void
  removeGroup: (groupName: string) => void
  updateGroup: (groupName: string, value: number) => void
  resetCategory: (groupName: string) => void
  
  // Validation
  validateValue: () => boolean
  
  // Save
  save: () => void
  cancel: () => void
}
```

**Features**:
- Track editing state separate from model
- Manage category→subcategory transitions
- Handle multi-select (toggle, option) logic
- Validate tag combinations
- Emit updates on save

### 2.3 useTagFamilyDisplay (Display Logic)
**File**: `src/composables/useTagFamilyDisplay.ts`

**Purpose**: Format tag family data for display in tiles

**Interface**:
```typescript
interface UseTagFamilyDisplayOptions {
  familyName: string
  value: number | null
  groupSelection: 'core' | 'options' | 'all'
  zoom: boolean
}

interface UseTagFamilyDisplayReturn {
  // Formatted display
  displayGroups: ComputedRef<DisplayGroup[]>
  compactText: ComputedRef<string> // For non-zoomed display
  optionalTagsText: ComputedRef<string> // Bottom row in compact
  
  // Zoom formatting
  zoomedBlocks: ComputedRef<ZoomedBlock[]>
  
  // Helper
  shouldShowGroup: (group: TagGroup) => boolean
  formatTagsForGroup: (group: TagGroup) => string
}

interface DisplayGroup {
  icon: string
  label: string
  tags: string[]
}

interface ZoomedBlock {
  icon: string
  groupLabel: string
  tags: string // Comma-separated
}
```

**Features**:
- Format tags for compact display (comma-separated with overflow)
- Format tags for zoomed display (grouped blocks)
- Handle core/options/all filtering
- Generate display text with icons

---

## Phase 3: Vue Components

### 3.1 TagFamilyTile.vue
**File**: `src/components/sysreg/TagFamilyTile.vue`

**Props**:
```typescript
interface TagFamilyTileProps {
  familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
  modelValue: number | null
  zoom?: boolean
  enableEdit?: boolean
  groupSelection?: 'core' | 'options' | 'all'
}
```

**Emits**:
```typescript
emits: {
  activated: () => void
  'update:zoom': (value: boolean) => void
}
```

**Layout** (Compact, zoom=false):
```
┌─────────────────────────────────────┐ 190-270px
│ FAMILY LABEL (top-left, muted)     │
│                                     │
│  [icon] tag1, tag2, tag3...        │ Core/all groups
│                                     │
│  opt1, opt2                         │ Optional tags (bottom)
└─────────────────────────────────────┘
```

**Layout** (Zoomed, zoom=true):
```
┌─────────────────────────────────────┐ 340px, overlapping
│ FAMILY LABEL (bold, 100%)          │
│ Family description (smaller)        │
│                                     │
│ [icon] Group 1: tag1, tag2         │
│ [icon] Group 2: tag3, tag4         │
│ [icon] Group 3: tag5               │
│                                     │
│                      [Edit] button  │ (if enableEdit)
└─────────────────────────────────────┘
```

**Features**:
- Click tile to toggle zoom
- Click outside zoomed tile to collapse
- Show edit button only if enableEdit=true
- Emit `activated` when edit button clicked
- Handle overflow with '...'
- Responsive text sizing

### 3.2 TagFamilies.vue (Gallery Component)
**File**: `src/components/sysreg/TagFamilies.vue`

**Props**:
```typescript
interface TagFamiliesProps {
  // v-models for each family
  status?: number | null
  config?: number | null
  rtags?: number | null
  ttags?: number | null
  ctags?: number | null
  dtags?: number | null
  
  // Control
  enableEdit?: boolean | string[] // true, false, or ['ttags', 'ctags', 'dtags']
  groupSelection?: 'core' | 'options' | 'all'
  
  // Layout
  layout?: 'row' | 'wrap' | 'vertical' // row: prefer 1-2 rows, wrap: auto, vertical: stack
}
```

**Emits**:
```typescript
emits: {
  'update:rtags': (value: number) => void
  'update:ttags': (value: number) => void
  'update:ctags': (value: number) => void
  'update:dtags': (value: number) => void
  'status:activated': () => void
  'config:activated': () => void
}
```

**Layout**:
```vue
<div class="tag-families" :class="layoutClass">
  <TagFamilyTile
    v-if="status !== undefined"
    family-name="status"
    :model-value="status"
    @activated="$emit('status:activated')"
  />
  <TagFamilyTile
    v-if="config !== undefined"
    family-name="config"
    :model-value="config"
    @activated="$emit('config:activated')"
  />
  <TagFamilyTile
    v-if="rtags !== undefined"
    v-model="rtags"
    family-name="rtags"
    :enable-edit="canEdit('rtags')"
    @activated="openEditor('rtags')"
  />
  <!-- ttags, ctags, dtags -->
</div>

<TagFamilyEditor
  v-if="editorState.open"
  v-model="editorState.value"
  :family-name="editorState.family"
  @save="handleEditorSave"
  @cancel="closeEditor"
/>
```

**Flexbox CSS**:
```scss
.tag-families {
  display: flex;
  gap: 1rem;
  
  &.layout-row {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  
  &.layout-wrap {
    flex-wrap: wrap;
  }
  
  &.layout-vertical {
    flex-direction: column;
  }
}
```

**Features**:
- Only render tiles for provided families
- Manage editor modal state internally
- Handle enableEdit as boolean or array
- Responsive layout with flexbox
- Support fullwidth or aside placement

### 3.3 TagFamilyEditor.vue (Modal Editor)
**File**: `src/components/sysreg/TagFamilyEditor.vue`

**Props**:
```typescript
interface TagFamilyEditorProps {
  modelValue: number
  familyName: string
  groupSelection?: 'core' | 'options' | 'all'
}
```

**Emits**:
```typescript
emits: {
  'update:modelValue': (value: number) => void
  save: (value: number) => void
  cancel: () => void
}
```

**Layout**:
```
┌─────────────────────────────────────────┐ 600px (mobile: 100%)
│ FAMILY LABEL                        [X] │ Modal header
├─────────────────────────────────────────┤
│ Family description                      │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ [icon] Group 1 Label              │  │ Active group
│ │ Group 1 description               │  │
│ │ [X] Category > [Subcategories...] │  │ or [Category options]
│ │                            [Trash] │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ [icon] Group 2 Label              │  │ Active group
│ │ Group 2 description               │  │
│ │ [Toggle] [Toggle] [Toggle]        │  │
│ │                            [Trash] │  │
│ └───────────────────────────────────┘  │
│                                         │
│ [+ Group 3] [+ Group 4]                │ Inactive groups
│                                         │
├─────────────────────────────────────────┤
│                  [Cancel] [Save]        │ Footer
└─────────────────────────────────────────┘
```

**Group Edit Controls**:

1. **Category (up to 4)**: Horizontal option group
2. **Category (5+)**: Dropdown select
3. **Category → Subcategory**: 
   ```
   [X] {Category} > [Subcategory options/dropdown]
   ```
4. **Toggle**: Toggle components horizontally
5. **Options (up to 5)**: Checkboxes horizontally
6. **Options (5+)**: Checkbox list vertically

**Features**:
- Modal overlay with click-outside to cancel
- Grouped input controls per tag group
- Dynamic (+) buttons for inactive groups
- Trash button per active group
- Category → subcategory transition logic
- Validation before save
- Keyboard shortcuts (Esc=cancel, Ctrl+Enter=save)

### 3.4 TagGroupEditor.vue (Sub-component)
**File**: `src/components/sysreg/TagGroupEditor.vue`

**Props**:
```typescript
interface TagGroupEditorProps {
  group: TagGroup
  modelValue: number // Group's extracted bits value
  familyName: string
}
```

**Purpose**: Render the appropriate input control for a tag group based on taglogic

**Features**:
- Detect taglogic from sysreg entries (category, subcategory, toggle, option)
- Render appropriate control
- Handle category→subcategory transition
- Emit value updates

---

## Phase 4: Unit Tests

### 4.1 Composable Tests

**File**: `tests/unit/useTagFamily.spec.ts`
- Load family configuration
- Parse active tags from value
- Filter groups by selection
- Extract group values
- Update group values
- Clear groups
- Get tag labels

**File**: `tests/unit/useTagFamilyEditor.spec.ts`
- Track editing state
- Detect dirty state
- Add/remove groups
- Category → subcategory transitions
- Reset categories
- Validate values
- Save/cancel operations

**File**: `tests/unit/useTagFamilyDisplay.spec.ts`
- Format compact display
- Format zoomed display
- Filter core/optional groups
- Generate display text with overflow
- Format optional tags row

### 4.2 Component Tests

**File**: `tests/component/TagFamilyTile.test.ts`
- Render compact layout
- Render zoomed layout
- Toggle zoom on click
- Collapse on click outside
- Show/hide edit button
- Emit activated event
- Display overflow with '...'
- Group filtering (core/options/all)

**File**: `tests/component/TagFamilies.test.ts`
- Render multiple tiles
- Handle missing families (undefined props)
- Open/close editor
- Update v-models
- Emit family-specific events
- Handle enableEdit array
- Responsive layout classes

**File**: `tests/component/TagFamilyEditor.test.ts`
- Render modal overlay
- Display active groups
- Display inactive groups
- Add/remove groups via buttons
- Edit category values
- Edit subcategory values
- Handle toggle inputs
- Handle option inputs
- Validate before save
- Emit save/cancel events
- Keyboard shortcuts

**File**: `tests/component/TagGroupEditor.test.ts`
- Render category options (≤4)
- Render category dropdown (5+)
- Render category → subcategory
- Render toggle controls
- Render option checkboxes (≤5)
- Render option list (5+)
- Reset category button
- Update value on input change

---

## Phase 5: Integration

### 5.1 SysregDemo View (Development/Testing)
**File**: `src/views/admin/SysregDemoView.vue`

**Purpose**: Comprehensive demo and testing interface for all tag families

**Layout**:
```vue
<template>
  <div class="sysreg-demo">
    <h1>Sysreg System Demo</h1>
    
    <!-- All 6 families -->
    <section class="demo-section">
      <h2>All Tag Families (fullwidth)</h2>
      <TagFamilies
        v-model:status="demoData.status"
        v-model:config="demoData.config"
        v-model:rtags="demoData.rtags"
        v-model:ttags="demoData.ttags"
        v-model:ctags="demoData.ctags"
        v-model:dtags="demoData.dtags"
        :enable-edit="true"
        group-selection="all"
      />
    </section>
    
    <!-- Core groups only -->
    <section class="demo-section">
      <h2>Core Groups Only</h2>
      <TagFamilies
        v-model:ttags="demoData.ttags"
        v-model:ctags="demoData.ctags"
        v-model:dtags="demoData.dtags"
        :enable-edit="true"
        group-selection="core"
      />
    </section>
    
    <!-- Optional groups only -->
    <section class="demo-section">
      <h2>Optional Groups Only</h2>
      <TagFamilies
        v-model:dtags="demoData.dtags"
        :enable-edit="true"
        group-selection="options"
      />
    </section>
    
    <!-- Vertical layout in aside -->
    <div class="demo-grid">
      <main>
        <h2>Main Content</h2>
      </main>
      <aside>
        <h3>Sidebar Tags</h3>
        <TagFamilies
          v-model:ttags="demoData.ttags"
          v-model:ctags="demoData.ctags"
          :enable-edit="['ttags', 'ctags']"
          layout="vertical"
        />
      </aside>
    </div>
    
    <!-- Individual tiles -->
    <section class="demo-section">
      <h2>Individual Tiles</h2>
      <div class="tile-grid">
        <TagFamilyTile
          v-model="demoData.dtags"
          family-name="dtags"
          :enable-edit="true"
          group-selection="all"
        />
        <TagFamilyTile
          :model-value="demoData.status"
          family-name="status"
          @activated="handleStatusActivated"
        />
      </div>
    </section>
    
    <!-- Multi-select strategy demo -->
    <section class="demo-section">
      <h2>Multi-Select Strategy (Configuration Demo)</h2>
      <div class="strategy-demo">
        <div class="strategy-card">
          <h3>Current: Single-Select (Default)</h3>
          <p><strong>Encoding:</strong> 2 bits per category (4 values)</p>
          <ul>
            <li><code>00</code> = None</li>
            <li><code>01</code> = Category only</li>
            <li><code>10</code> = Subcategory 1</li>
            <li><code>11</code> = Subcategory 2</li>
          </ul>
          <p><strong>Behavior:</strong> Selecting a new category clears the previous one</p>
          <code>multiselect: false</code> (default for all groups)
        </div>
        
        <div class="strategy-card">
          <h3>Future: Multi-Select (Optional)</h3>
          <p><strong>Encoding:</strong> 1 bit per category (toggle)</p>
          <ul>
            <li><code>0</code> = Not selected</li>
            <li><code>1</code> = Selected</li>
          </ul>
          <p><strong>Behavior:</strong> Multiple categories can be active simultaneously</p>
          <code>multiselect: true</code> (enable in sysreg-bitgroups.json)
          <p><strong>Note:</strong> Requires different bit allocation strategy</p>
        </div>
        
        <div class="strategy-card">
          <h3>Implementation Notes</h3>
          <ul>
            <li>✅ All groups default to single-select (2-bit encoding)</li>
            <li>✅ Category-only selection supported (value = 1)</li>
            <li>✅ Subcategories always single-select within category</li>
            <li>⏳ Multi-select requires `multiselect: true` flag</li>
            <li>⏳ Multi-select changes bit allocation (1 bit per category instead of 2)</li>
          </ul>
        </div>
      </div>
      
      <h3>Try It: Enable Multi-Select</h3>
      <p>To enable multi-select for a tag group:</p>
      <pre><code>// In sysreg-bitgroups.json
{
  "name": "spielform",
  "multiselect": true,  // Enable multi-select
  "bits": [0, 1, 2, 3],  // Now 1 bit per category (4 categories)
  ...
}</code></pre>
    </section>
    
    <!-- Raw data viewer -->
    <section class="demo-section">
      <h2>Current Values (Debug)</h2>
      <pre>{{ JSON.stringify(demoData, null, 2) }}</pre>
      
      <h3>Bit Breakdown</h3>
      <div class="bit-breakdown">
        <div v-for="(value, family) in demoData" :key="family">
          <strong>{{ family }}:</strong> {{ value }} 
          <code>{{ value ? '0b' + value.toString(2).padStart(32, '0') : 'null' }}</code>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.strategy-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.strategy-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-background-soft);
}

.strategy-card h3 {
  margin-top: 0;
}

.strategy-card code {
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.bit-breakdown {
  font-family: monospace;
  font-size: 0.9rem;
}

.bit-breakdown code {
  display: block;
  padding: 0.25rem;
  margin-left: 1rem;
  background: var(--color-background-mute);
}
</style>
```

### 5.2 PostPage.vue Integration
**File**: `src/views/PostPage.vue`

**Location**: After header, before main content

**Implementation**:
```vue
<template>
  <div class="post-page">
    <header class="post-header">
      <h1>{{ post.title }}</h1>
      <!-- ... existing header content ... -->
    </header>
    
    <!-- Tag families row -->
    <TagFamilies
      v-if="post"
      v-model:ttags="post.ttags"
      v-model:ctags="post.ctags"
      v-model:dtags="post.dtags"
      :status="post.status"
      :config="post.config"
      :enable-edit="canEditPost"
      group-selection="core"
      @update:ttags="handleUpdateTags('ttags', $event)"
      @update:ctags="handleUpdateTags('ctags', $event)"
      @update:dtags="handleUpdateTags('dtags', $event)"
    />
    
    <main class="post-content">
      <!-- ... existing content ... -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'

const canEditPost = computed(() => {
  // Check if current user can edit this post
  return auth.user && (post.created_by === auth.user.id || auth.user.is_admin)
})

async function handleUpdateTags(family: string, value: number) {
  try {
    await updatePost(post.id, { [family]: value })
    // Refresh post data
  } catch (error) {
    console.error(`Failed to update ${family}:`, error)
  }
}
</script>
```

### 5.3 ImagePreviewModal Integration
**File**: `src/components/images/ImagePreviewModal.vue`

**Location**: Sidebar or footer

**Implementation**:
```vue
<template>
  <Modal v-model="open" size="large">
    <div class="image-preview-modal">
      <div class="image-display">
        <img :src="image.url" :alt="image.alt_text" />
      </div>
      
      <aside class="image-metadata">
        <h2>{{ image.title }}</h2>
        
        <!-- Tag families - vertical layout -->
        <TagFamilies
          v-model:ttags="image.ttags"
          v-model:ctags="image.ctags"
          v-model:dtags="image.dtags"
          :status="image.status"
          :enable-edit="canEditImage"
          layout="vertical"
          group-selection="core"
          @update:ttags="handleUpdateTags('ttags', $event)"
          @update:ctags="handleUpdateTags('ctags', $event)"
          @update:dtags="handleUpdateTags('dtags', $event)"
        />
        
        <!-- ... other metadata ... -->
      </aside>
    </div>
  </Modal>
</template>
```

### 5.4 EditPanel Integration
**File**: `src/components/EditPanel.vue`

**Location**: Dedicated tag section

**Implementation**:
```vue
<template>
  <div class="edit-panel">
    <h2>Edit {{ entityType }}</h2>
    
    <!-- Basic fields -->
    <FormField label="Title">
      <input v-model="editData.title" />
    </FormField>
    
    <!-- ... other fields ... -->
    
    <!-- Tags section -->
    <div class="edit-section">
      <h3>Tags & Classification</h3>
      
      <TagFamilies
        v-model:ttags="editData.ttags"
        v-model:ctags="editData.ctags"
        v-model:dtags="editData.dtags"
        :status="editData.status"
        :config="editData.config"
        :enable-edit="['ttags', 'ctags', 'dtags']"
        layout="wrap"
        group-selection="all"
        @status:activated="showStatusInfo"
        @config:activated="showConfigInfo"
      />
    </div>
    
    <!-- Action buttons -->
    <div class="edit-actions">
      <button @click="save">Save</button>
      <button @click="cancel">Cancel</button>
    </div>
  </div>
</template>
```

---

## Phase 6: Testing & Validation

### 6.1 Unit Test Coverage
- ✅ All composables have comprehensive tests
- ✅ All components have behavior tests
- ✅ Edge cases covered (empty values, invalid data)
- ✅ Keyboard interactions tested

### 6.2 Integration Testing
- ✅ TagFamilies + TagFamilyEditor workflow
- ✅ Category → subcategory transitions
- ✅ Multi-group editing
- ✅ Save/cancel operations
- ✅ Validation logic

### 6.3 Visual Testing
- ✅ Compact tile display at various widths
- ✅ Zoomed tile overlay behavior
- ✅ Editor modal responsiveness
- ✅ Vertical layout in aside
- ✅ Overflow handling

### 6.4 User Acceptance Testing
- ✅ SysregDemo view demonstrates all features
- ✅ Integration points work correctly
- ✅ Performance is acceptable
- ✅ Accessibility (keyboard nav, screen readers)

---

## Implementation Checklist

### Database & Config
- [ ] Create migration 037-dtags-restructure.sql
- [ ] Update sysreg-bitgroups.json with new structure
  - [ ] Add multiselect: false to all groups (default)
  - [ ] Fix TagGroup 3 bits: 16-25 (10 bits, 5 categories)
  - [ ] Fix TagGroup 4 bits: 26-31 (6 bits, 3 categories)
  - [ ] Remove 4th subcategory from Forum (3 subcategories only)
- [ ] Add subcategory naming constraint
- [ ] Test migration on dev database
- [ ] Verify all dtags entries correct (32 bits total)

### Composables
- [ ] Create useTagFamily.ts
- [ ] Create useTagFamilyEditor.ts
- [ ] Create useTagFamilyDisplay.ts
- [ ] Write unit tests for all composables
- [ ] Verify all tests pass

### Components
- [ ] Create TagFamilyTile.vue
- [ ] Create TagFamilies.vue
- [ ] Create TagFamilyEditor.vue
- [ ] Create TagGroupEditor.vue
- [ ] Write component tests
- [ ] Verify all tests pass

### Integration
- [ ] Create SysregDemoView.vue
- [ ] Add route for /admin/sysreg-demo
- [ ] Integrate into PostPage.vue
- [ ] Integrate into ImagePreviewModal.vue
- [ ] Integrate into EditPanel.vue
- [ ] Test all integration points

### Documentation
- [ ] Update README with new components
- [ ] Document taglogic types
- [ ] Document groupSelection behavior
- [ ] Create usage examples
- [ ] Update API documentation

### Final Testing
- [ ] Manual testing of all features
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Performance profiling
- [ ] Accessibility audit

---

## Timeline Estimate

- **Phase 1** (Database & Config): 3-4 hours
- **Phase 2** (Composables): 6-8 hours
- **Phase 3** (Components): 12-16 hours
- **Phase 4** (Tests): 8-10 hours
- **Phase 5** (Integration): 4-6 hours
- **Phase 6** (Testing & Polish): 4-6 hours

**Total**: 37-50 hours

---

## Notes

### Bit Allocation
- ✅ The dtags restructure uses **all 32 bits** (0-31) - perfect fit
- ✅ TagGroup 1: bits 0-7 (8 bits, 4 categories × 2 bits)
- ✅ TagGroup 2: bits 8-15 (8 bits, 4 categories × 2 bits)
- ✅ TagGroup 3: bits 16-25 (10 bits, 5 categories × 2 bits)
- ✅ TagGroup 4: bits 26-31 (6 bits, 3 categories × 2 bits)
- ✅ Forum reduced from 4 to 3 subcategories to fit 2-bit encoding

### Multi-Select System
- **Default behavior**: Single-select (multiselect: false)
- **Category encoding**: 2 bits = 4 values (0=none, 1=category, 2-3=subcategories)
- **Subcategories**: Always single-select within a category
- **Future enhancement**: Set `multiselect: true` to enable multiple categories
- **Multi-select encoding**: Requires 1 bit per category (toggle mode)
- **Trade-off**: Multi-select reduces subcategory support

### Implementation Details
- Subcategory naming must follow `{category} > {subcategory}` pattern
- All German text serves as both system name and default label
- Icons use lucide-vue-next icon names
- Components are designed to be progressively enhanced
- Editor handles all 4 taglogic types: category, subcategory, toggle, option
- Zoom behavior uses CSS transforms and z-index for overlay
- Modal uses portal/teleport to body for proper stacking
- Demo view shows multi-select strategy comparison
