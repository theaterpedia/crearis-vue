# Sysreg System: Use-Case Driven Design Specification

**Date:** November 19, 2025 (Updated: November 28, 2025)  
**Status:** ⚠️ Historical Reference (BYTEA → INTEGER migration complete)  
**Phase:** Phases 1-6 Complete

> **Note:** This document was created during the BYTEA era. The system now uses INTEGER (32-bit) bitmasks.
> For current specification, see [SYSREG_SPEC.md](./SYSREG_SPEC.md).

## Executive Summary

This document defines 6 critical use-cases that will drive the sysreg system integration into the Crearis platform. Each use-case is analyzed for:
- **Current implementation** (what works well)
- **Sysreg integration needs** (status_val, config_val, *tags_val)
- **API endpoint design** (performance + data completeness)
- **Component/composable specifications**
- **Frontend patterns** (filtering, selection, state management)

---

## Use-Case 1: Project Status Management Dashboard

### Context
**Current Implementation:** ProjectNavigation.vue + ProjectStepEvents.vue work well for navigation but lack status visualization and management.

**Success Pattern:** Navigation tab system, event lifecycle management, multi-step workflows.

**Missing:** Project status management (draft → active → archived), status-based access control, status history.

### Sysreg Integration Requirements

#### Backend: Projects Table
```typescript
// Current (deprecated)
status_id_depr: INTEGER FK → status_depr

// New sysreg columns
status_val: BYTEA    // 0x00=new, 0x01=draft, 0x02=active, 0x04=published, 0x08=archived
config_val: BYTEA    // bits: 0=public, 1=featured, 2=locked
rtags_val: BYTEA     // 0x01=favorite, 0x02=pinned, 0x04=urgent
ctags_val: BYTEA     // project-specific content tags
ttags_val: BYTEA     // topic tags (democracy, environment, etc.)
dtags_val: BYTEA     // domain tags (games, workshops, etc.)
status_label: TEXT   // Generated: get_sysreg_label(status_val, 'status', lang)
```

#### API Endpoint Design

**Option A: Minimal (Current Pattern)**
```typescript
// GET /api/projects/:id
{
  id: 18,
  name: "Democracy Games",
  status_val: "\\x01",        // Raw BYTEA as hex string
  config_val: "\\x05",        // Raw bits
  lang: "de",
  status_label: "Entwurf"     // Pre-computed in DB
}
```
**Pros:** Fast, minimal data transfer  
**Cons:** Frontend must decode BYTEA, fetch sysreg separately for filtering

**Option B: Enhanced (Proposed)**
```typescript
// GET /api/projects/:id?expand=status,config,tags
{
  id: 18,
  name: "Democracy Games",
  lang: "de",
  
  // Raw values (for updates)
  status_val: "\\x01",
  config_val: "\\x05",
  rtags_val: "\\x02",
  ctags_val: "\\x18",
  
  // Expanded metadata (for display)
  _status: {
    value: "\\x01",
    hex: "01",
    label: "Entwurf",
    description: "Projekt in Bearbeitung",
    name: "draft",
    taglogic: "category",
    is_default: false
  },
  _config: [
    { bit: 0, active: true, name: "public", label: "Öffentlich" },
    { bit: 2, active: true, name: "locked", label: "Gesperrt" }
  ],
  _rtags: [
    { bit: 1, active: true, name: "pinned", label: "Angepinnt" }
  ],
  _ctags: [
    { bit: 3, active: true, name: "youth", label: "Jugend" },
    { bit: 4, active: true, name: "outdoor", label: "Draußen" }
  ]
}
```
**Pros:** Complete data, ready for display, filterable  
**Cons:** Larger payload (~30% more)

**Recommendation:** **Option B with selective expansion**  
- Default: minimal (Option A)
- Query param `?expand=status` → adds `_status` object
- Query param `?expand=all` → full expansion
- Frontend caches sysreg metadata separately for filtering UIs

#### Component Specification: `<ProjectStatusManager>`

```vue
<template>
  <div class="project-status-manager">
    <!-- Current Status Display -->
    <div class="status-current">
      <StatusBadge :value="project.status_val" :label="project.status_label" />
      <ConfigBits :value="project.config_val" tagfamily="config" />
    </div>

    <!-- Status Transition Actions -->
    <div class="status-actions" v-if="canChangeStatus">
      <button @click="transition('draft')" v-if="canTransitionTo('draft')">
        Als Entwurf speichern
      </button>
      <button @click="transition('active')" v-if="canTransitionTo('active')">
        Aktivieren
      </button>
      <button @click="transition('published')" v-if="canTransitionTo('published')">
        Veröffentlichen
      </button>
    </div>

    <!-- Tags Management -->
    <TagsMultiToggle
      v-model="selectedTags"
      tagfamily="ctags"
      :project="project.domaincode"
      :readonly="!canEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStatus } from '@/composables/useProjectStatus'

const props = defineProps<{
  projectId: number
  readonly?: boolean
}>()

const {
  project,
  canChangeStatus,
  canTransitionTo,
  transition,
  updateConfig,
  updateTags
} = useProjectStatus(props.projectId)
</script>
```

#### Composable Specification: `useProjectStatus()`

```typescript
/**
 * Composable: useProjectStatus
 * 
 * Manages project status lifecycle with sysreg system.
 * Handles status transitions, config flags, and tags.
 */
export function useProjectStatus(projectId: Ref<number> | number) {
  const project = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch project with expanded sysreg data
  async function fetch() {
    loading.value = true
    try {
      const response = await fetch(`/api/projects/${unref(projectId)}?expand=status,config,tags`)
      project.value = await response.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Status transition logic (with validation)
  async function transition(targetStatus: string) {
    // Validate transition rules
    if (!canTransitionTo(targetStatus)) {
      throw new Error(`Cannot transition from ${project.value._status.name} to ${targetStatus}`)
    }

    // Get target status value from sysreg
    const sysreg = await getSysregByName('status', targetStatus)
    
    // Update via API
    await updateProject(projectId, { status_val: sysreg.value })
    
    // Refresh
    await fetch()
  }

  // Config bit manipulation
  function toggleConfigBit(bitName: string) {
    const bit = getConfigBitByName(bitName)
    const current = project.value.config_val
    const updated = toggleBit(current, bit)
    return updateProject(projectId, { config_val: updated })
  }

  // Tag manipulation (multi-bit)
  function updateTags(tagfamily: string, selectedBits: number[]) {
    const bytea = bitsToByteArray(selectedBits)
    return updateProject(projectId, { [`${tagfamily}_val`]: bytea })
  }

  return {
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),
    fetch,
    transition,
    canTransitionTo,
    toggleConfigBit,
    updateTags
  }
}
```

---

## Use-Case 2: Event Template System with Status Lifecycle

### Context
**Current Implementation:** ProjectStepEvents.vue successfully implements event selection from base templates. EventPanel.vue handles creation from templates.

**Success Pattern:** Template selection → customization → creation pattern works well. Dropdown selection, preview card, form customization.

**Missing:** Event status tracking (draft → scheduled → active → completed), template status (published templates only), event-specific tags.

### Sysreg Integration Requirements

#### Backend: Events Table
```typescript
// New sysreg columns
status_val: BYTEA    // 0x00=new, 0x01=draft, 0x02=scheduled, 0x04=active, 0x08=completed, 0x10=cancelled
config_val: BYTEA    // bits: 0=public, 1=featured, 2=recurring, 3=online
rtags_val: BYTEA     // 0x01=template, 0x02=requires_registration, 0x04=full
ctags_val: BYTEA     // event-specific (age_group, subject_type, access_level)
ttags_val: BYTEA     // topics
dtags_val: BYTEA     // domains (workshops, games, etc.)
```

#### API Endpoint Design

**GET /api/events - Enhanced Filtering**
```typescript
// Query parameters for sysreg filtering
?status_eq=0x02           // BYTEA exact match (scheduled events)
?status_in=0x02,0x04      // Multiple values OR (scheduled OR active)
?status_has_bit=2         // Bit position check (bit 2 set)
?config_has_bits=0,3      // Multiple bits AND (public AND online)
?rtags_eq=0x01            // Templates only
?ctags_age_group=1        // CTags bit extraction (bits 0-1 = 1 = Child)
?ttags_any=0x03           // Any of these bits set (democracy OR environment)
?isbase=1                 // Traditional filter (for base templates)
?project=xyz              // Traditional filter (project-specific)

// Response structure
{
  events: [
    {
      id: 42,
      name: "Democracy Workshop",
      status_val: "\\x02",
      status_label: "Geplant",
      config_val: "\\x09",  // bits 0 and 3: public + online
      rtags_val: "\\x01",   // bit 0: is_template
      
      // Expanded (if ?expand=all)
      _status: { value: "\\x02", label: "Geplant", name: "scheduled" },
      _config: [
        { bit: 0, active: true, name: "public", label: "Öffentlich" },
        { bit: 3, active: true, name: "online", label: "Online" }
      ],
      _rtags: [
        { bit: 0, active: true, name: "template", label: "Vorlage" }
      ],
      _ctags_age_group: { bits: [0,1], value: 1, label: "Kind" }
    }
  ],
  // Sysreg metadata for filters (cached)
  _sysreg: {
    status: [...],
    config: [...],
    rtags: [...]
  }
}
```

#### Component Specification: `<EventTemplateSelector>`

```vue
<template>
  <div class="event-template-selector">
    <!-- Filter Bar -->
    <div class="filter-bar">
      <SysregFilter
        tagfamily="status"
        :value="filterStatus"
        @update:value="filterStatus = $event"
        label="Status"
        :options="statusOptions"
        mode="single"
      />
      
      <SysregFilter
        tagfamily="dtags"
        :value="filterDomains"
        @update:value="filterDomains = $event"
        label="Bereiche"
        mode="multi"
      />
      
      <SysregFilter
        tagfamily="ctags"
        bit-group="age_group"
        :value="filterAgeGroup"
        @update:value="filterAgeGroup = $event"
        label="Altersgruppe"
        mode="single"
      />
    </div>

    <!-- Template Grid -->
    <div class="template-grid">
      <EventCard
        v-for="event in filteredTemplates"
        :key="event.id"
        :event="event"
        :show-status="true"
        :show-tags="true"
        @click="selectTemplate(event)"
      />
    </div>

    <!-- Selected Template Preview + Customization -->
    <EventCustomizer
      v-if="selectedTemplate"
      :template="selectedTemplate"
      @create="handleCreate"
      @cancel="selectedTemplate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventTemplates } from '@/composables/useEventTemplates'

const {
  templates,
  filteredTemplates,
  filterStatus,
  filterDomains,
  filterAgeGroup,
  selectTemplate,
  createFromTemplate
} = useEventTemplates()
</script>
```

#### Composable Specification: `useEventTemplates()`

```typescript
/**
 * Composable: useEventTemplates
 * 
 * Manages event template selection and filtering with sysreg.
 */
export function useEventTemplates(options?: {
  projectId?: Ref<number>
  showDrafts?: boolean
}) {
  const templates = ref<Event[]>([])
  const filterStatus = ref<string | null>(null)
  const filterDomains = ref<string[]>([])
  const filterAgeGroup = ref<number | null>(null)

  // Build query params from filters
  const queryParams = computed(() => {
    const params = new URLSearchParams()
    params.set('rtags_has_bit', '0') // bit 0 = is_template
    
    if (filterStatus.value) {
      params.set('status_eq', filterStatus.value)
    }
    
    if (filterDomains.value.length > 0) {
      params.set('dtags_any', filterDomains.value.join(','))
    }
    
    if (filterAgeGroup.value !== null) {
      params.set('ctags_age_group', filterAgeGroup.value.toString())
    }
    
    return params.toString()
  })

  // Fetch templates with dynamic filtering
  async function fetch() {
    const response = await fetch(`/api/events?${queryParams.value}&expand=status,tags`)
    const data = await response.json()
    templates.value = data.events
  }

  // Create event from template
  async function createFromTemplate(template: Event, customization: Partial<Event>) {
    // Copy template values but set new status
    const newEvent = {
      ...template,
      ...customization,
      id: undefined, // New record
      status_val: '\\x01', // draft
      rtags_val: template.rtags_val & ~0x01, // Remove template bit
      isbase: false
    }
    
    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(newEvent)
    })
    
    return response.json()
  }

  // Watch filters and auto-refetch
  watch([filterStatus, filterDomains, filterAgeGroup], () => {
    fetch()
  })

  return {
    templates: readonly(templates),
    filteredTemplates: templates, // Already filtered by API
    filterStatus,
    filterDomains,
    filterAgeGroup,
    fetch,
    createFromTemplate
  }
}
```

---

## Use-Case 3: Image Status Management in Edit Mode

### Context
**Current Implementation:** ImagesCoreAdmin.vue has excellent edit mode handling with dirty detection, autosave/autocancel behavior, shape editing.

**Success Pattern:** 
- View mode transitions (browse → core → shape)
- Dirty state detection with prompt/autosave/autocancel
- Multi-shape management (wide, square, vertical, thumb)

**Missing:** Image status workflow (raw → processed → approved → published), quality flags, deprecation marking.

### Sysreg Integration Requirements

#### Backend: Images Table
```typescript
// Current columns
status_id_depr: INTEGER (mostly 0 = never had status)

// New sysreg columns
status_val: BYTEA    // 0x00=raw, 0x01=processing, 0x02=approved, 0x04=published, 0x08=deprecated
config_val: BYTEA    // bits: 0=public, 1=featured, 2=needs_review, 3=ai_generated
rtags_val: BYTEA     // 0x01=hero, 0x02=thumbnail, 0x04=background, 0x08=icon
ctags_val: BYTEA     // age_group(0-1), subject_type(2-3), access_level(4-5), quality(6-7)
ttags_val: BYTEA     // topics (from cimgImport)
dtags_val: BYTEA     // domains
```

#### API Endpoint Design

**GET /api/images - Enhanced for Admin**
```typescript
// Query parameters
?status_ne=0x08              // Exclude deprecated (not equal)
?config_has_bit=2            // Needs review
?ctags_quality=3             // Quality = "check quality" (bits 6-7 = 3)
?rtags_eq=0x01               // Hero images only
?owner=42                    // By owner/uploader
?project=xyz                 // By project
?sort=status_val,created_at  // Multi-column sort

// Response with admin metadata
{
  images: [
    {
      id: 88,
      url: "https://...",
      status_val: "\\x00",
      status_label: "Neu",
      config_val: "\\x04",  // bit 2 = needs_review
      ctags_val: "\\xC0",   // bits 6-7 = 3 = check_quality
      
      // Expanded
      _status: { value: "\\x00", label: "Neu", name: "raw", color: "#999" },
      _config: [
        { bit: 2, active: true, name: "needs_review", label: "Überprüfung nötig" }
      ],
      _ctags: {
        age_group: { bits: [0,1], value: 0, label: "Andere" },
        subject_type: { bits: [2,3], value: 0, label: "Andere" },
        access_level: { bits: [4,5], value: 0, label: "Projekt" },
        quality: { bits: [6,7], value: 3, label: "Qualität prüfen" }
      }
    }
  ],
  _filters: {
    // Available filter options based on current data
    statuses: [
      { value: "\\x00", label: "Neu", count: 63 },
      { value: "\\x02", label: "Freigegeben", count: 12 }
    ],
    qualities: [
      { value: 0, label: "OK", count: 45 },
      { value: 3, label: "Qualität prüfen", count: 18 }
    ]
  }
}
```

#### Component Enhancement: ImagesCoreAdmin Status UI

```vue
<!-- Add to ImagesCoreAdmin.vue -->
<template>
  <div class="image-status-section">
    <!-- Status Badge with Actions -->
    <div class="status-header">
      <StatusBadge
        :value="selectedImage.status_val"
        :label="selectedImage.status_label"
        size="large"
      />
      
      <div class="status-actions" v-if="hasEditRights">
        <button @click="approveImage" v-if="canApprove">
          Freigeben
        </button>
        <button @click="deprecateImage" v-if="canDeprecate">
          Als veraltet markieren
        </button>
      </div>
    </div>

    <!-- Config Flags (Checkboxes) -->
    <div class="config-flags">
      <label>
        <input
          type="checkbox"
          :checked="hasConfigBit(0)"
          @change="toggleConfigBit(0)"
        />
        Öffentlich
      </label>
      <label>
        <input
          type="checkbox"
          :checked="hasConfigBit(1)"
          @change="toggleConfigBit(1)"
        />
        Featured
      </label>
      <label>
        <input
          type="checkbox"
          :checked="hasConfigBit(2)"
          @change="toggleConfigBit(2)"
        />
        Überprüfung nötig
      </label>
    </div>

    <!-- CTags Quality Selector -->
    <div class="quality-selector">
      <label>Qualität:</label>
      <select v-model="ctagsQuality" @change="updateCtags(6, ctagsQuality)">
        <option :value="0">OK</option>
        <option :value="1">Veraltet</option>
        <option :value="2">Technischer Fehler</option>
        <option :value="3">Qualität prüfen</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
// Add to existing ImagesCoreAdmin.vue
import { useImageStatus } from '@/composables/useImageStatus'

const {
  canApprove,
  canDeprecate,
  approveImage,
  deprecateImage,
  hasConfigBit,
  toggleConfigBit
} = useImageStatus(selectedImage)
</script>
```

#### Composable Specification: `useImageStatus()`

```typescript
/**
 * Composable: useImageStatus
 * 
 * Manages image status lifecycle and quality flags.
 */
export function useImageStatus(image: Ref<Image>) {
  // Status transition checks
  const canApprove = computed(() => {
    const status = parseByteaHex(image.value.status_val)
    return status === 0x00 || status === 0x01 // raw or processing
  })

  const canDeprecate = computed(() => {
    const status = parseByteaHex(image.value.status_val)
    return status !== 0x08 // not already deprecated
  })

  // Status transitions
  async function approveImage() {
    await updateImage(image.value.id, {
      status_val: '\\x02', // approved
      config_val: clearBit(image.value.config_val, 2) // clear needs_review
    })
  }

  async function deprecateImage() {
    if (!confirm('Bild als veraltet markieren? Es wird nicht gelöscht.')) return
    
    await updateImage(image.value.id, {
      status_val: '\\x08', // deprecated
      config_val: clearBit(image.value.config_val, 0) // clear public
    })
  }

  // Config bit helpers
  function hasConfigBit(bit: number): boolean {
    return checkBit(image.value.config_val, bit)
  }

  async function toggleConfigBit(bit: number) {
    const current = parseByteaHex(image.value.config_val)
    const updated = current ^ (1 << bit) // XOR toggle
    await updateImage(image.value.id, {
      config_val: byteaFromNumber(updated)
    })
  }

  return {
    canApprove,
    canDeprecate,
    approveImage,
    deprecateImage,
    hasConfigBit,
    toggleConfigBit
  }
}
```

---

## Use-Case 4: Multi-Tag Import Interface

### Context
**Current Implementation:** cimgImport.vue successfully implements:
- Batch URL import
- CTags bit groups (age_group, subject_type, access_level, quality)
- Auto-tagging based on xml_subject
- Form validation and preview

**Success Pattern:** Multi-select dropdowns, bit-group management, batch operations, smart defaults.

**Missing:** Full sysreg integration (currently hardcoded options), TTags/DTags support, tag suggestions.

### Sysreg Integration Requirements

#### Component Enhancement: `<cimgImport>` with Full Sysreg

```vue
<template>
  <div class="cimg-import-modal">
    <!-- Status Selection -->
    <SysregSelect
      v-model="importStatus"
      tagfamily="status"
      entity="images"
      label="Import-Status"
      :default="'\\x00'"
    />

    <!-- Config Flags (Multi-Toggle) -->
    <SysregMultiToggle
      v-model="configFlags"
      tagfamily="config"
      label="Konfiguration"
      :options="['public', 'featured', 'needs_review']"
    />

    <!-- CTags with Bit Groups -->
    <div class="ctags-section">
      <h4>Content Tags</h4>
      
      <SysregBitGroupSelect
        v-model="ctagsAgeGroup"
        tagfamily="ctags"
        bit-group="age_group"
        :bits="[0, 1]"
        label="Altersgruppe"
      />
      
      <SysregBitGroupSelect
        v-model="ctagsSubjectType"
        tagfamily="ctags"
        bit-group="subject_type"
        :bits="[2, 3]"
        label="Motivtyp"
      />
      
      <SysregBitGroupSelect
        v-model="ctagsAccessLevel"
        tagfamily="ctags"
        bit-group="access_level"
        :bits="[4, 5]"
        label="Zugriff"
      />
      
      <SysregBitGroupSelect
        v-model="ctagsQuality"
        tagfamily="ctags"
        bit-group="quality"
        :bits="[6, 7]"
        label="Qualität"
      />
    </div>

    <!-- TTags (Topic Tags) -->
    <SysregMultiToggle
      v-model="topicTags"
      tagfamily="ttags"
      label="Themen"
      :max-selection="5"
      :suggested="suggestedTopics"
    />

    <!-- DTags (Domain Tags) -->
    <SysregMultiToggle
      v-model="domainTags"
      tagfamily="dtags"
      label="Bereiche"
      :max-selection="3"
    />

    <!-- Auto-Tagging Helper -->
    <div class="auto-tag-section" v-if="selectedProject">
      <button @click="applySuggestedTags">
        🤖 Tags aus Projekt übernehmen
      </button>
      <small>Übernimmt TTags/DTags von "{{ selectedProject.name }}"</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSysregTags } from '@/composables/useSysregTags'

const {
  // CTags helpers
  buildCtagsByte,
  extractCtagsBitGroup,
  
  // Multi-tag helpers
  toggleTag,
  hasTag,
  tagsToByteArray,
  byteArrayToTags,
  
  // Suggestions
  suggestTagsFromProject,
  suggestTagsFromContent
} = useSysregTags()

// Tag state
const configFlags = ref<number[]>([0]) // default: public
const ctagsAgeGroup = ref(0)
const ctagsSubjectType = ref(0)
const ctagsAccessLevel = ref(0)
const ctagsQuality = ref(0)
const topicTags = ref<number[]>([])
const domainTags = ref<number[]>([])

// Smart suggestions based on project
const suggestedTopics = computed(() => {
  if (!selectedProject.value) return []
  return suggestTagsFromProject(selectedProject.value, 'ttags')
})

// Build final ctags byte
const ctagsByte = computed(() => {
  return buildCtagsByte({
    age_group: ctagsAgeGroup.value,
    subject_type: ctagsSubjectType.value,
    access_level: ctagsAccessLevel.value,
    quality: ctagsQuality.value
  })
})

// Apply suggested tags from project
function applySuggestedTags() {
  const suggestions = suggestTagsFromProject(selectedProject.value, 'all')
  topicTags.value = suggestions.ttags
  domainTags.value = suggestions.dtags
}

// Handle save with all sysreg data
async function handleSave() {
  const images = importedImages.value.map(img => ({
    url: img.url,
    status_val: importStatus.value,
    config_val: tagsToByteArray(configFlags.value),
    ctags_val: ctagsByte.value,
    ttags_val: tagsToByteArray(topicTags.value),
    dtags_val: tagsToByteArray(domainTags.value),
    owner: selectedOwner.value,
    project: selectedProject.value?.id
  }))

  await fetch('/api/images/batch-import', {
    method: 'POST',
    body: JSON.stringify({ images })
  })
}
</script>
```

#### Composable Specification: `useSysregTags()`

```typescript
/**
 * Composable: useSysregTags
 * 
 * Unified tag management for sysreg system.
 * Handles bit operations, multi-select, and suggestions.
 */
export function useSysregTags() {
  const sysregCache = ref<SysregCache | null>(null)

  // Initialize cache
  async function initCache() {
    const response = await fetch('/api/sysreg/all')
    sysregCache.value = await response.json()
  }

  // CTags bit group helpers
  function buildCtagsByte(groups: {
    age_group: number,
    subject_type: number,
    access_level: number,
    quality: number
  }): Uint8Array {
    let byte = 0
    byte |= (groups.age_group & 0x03) << 0      // bits 0-1
    byte |= (groups.subject_type & 0x03) << 2    // bits 2-3
    byte |= (groups.access_level & 0x03) << 4    // bits 4-5
    byte |= (groups.quality & 0x03) << 6         // bits 6-7
    return new Uint8Array([byte])
  }

  function extractCtagsBitGroup(bytea: Uint8Array, group: string): number {
    const byte = bytea[0]
    switch (group) {
      case 'age_group': return (byte >> 0) & 0x03
      case 'subject_type': return (byte >> 2) & 0x03
      case 'access_level': return (byte >> 4) & 0x03
      case 'quality': return (byte >> 6) & 0x03
      default: return 0
    }
  }

  // Multi-tag helpers (for rtags, ttags, dtags)
  function toggleTag(current: number[], tagBit: number): number[] {
    const index = current.indexOf(tagBit)
    if (index > -1) {
      return current.filter(b => b !== tagBit)
    } else {
      return [...current, tagBit]
    }
  }

  function hasTag(bytea: Uint8Array, bit: number): boolean {
    const byte = bytea[0]
    return (byte & (1 << bit)) !== 0
  }

  function tagsToByteArray(bits: number[]): Uint8Array {
    let byte = 0
    bits.forEach(bit => {
      byte |= (1 << bit)
    })
    return new Uint8Array([byte])
  }

  function byteArrayToTags(bytea: Uint8Array): number[] {
    const byte = bytea[0]
    const tags: number[] = []
    for (let i = 0; i < 8; i++) {
      if (byte & (1 << i)) {
        tags.push(i)
      }
    }
    return tags
  }

  // Smart suggestions
  function suggestTagsFromProject(project: Project, tagfamily: 'ttags' | 'dtags' | 'all') {
    // Extract tags from project
    if (tagfamily === 'all') {
      return {
        ttags: byteArrayToTags(project.ttags_val),
        dtags: byteArrayToTags(project.dtags_val)
      }
    }
    return byteArrayToTags(project[`${tagfamily}_val`])
  }

  return {
    sysregCache: readonly(sysregCache),
    initCache,
    buildCtagsByte,
    extractCtagsBitGroup,
    toggleTag,
    hasTag,
    tagsToByteArray,
    byteArrayToTags,
    suggestTagsFromProject
  }
}
```

---

## Use-Case 5: Filter-Driven List Component (pListEdit)

### Context
**Current Implementation:** pListEdit.vue uses ItemList with basic filtering (filterXmlPrefix, filterXmlPattern).

**Success Pattern:** Declarative filtering props, entity-agnostic design, clean API.

**Missing:** Sysreg-based filtering (status, tags), advanced filter UI, filter persistence, filter combinations.

### Sysreg Integration Requirements

#### Component Enhancement: `<pListEdit>` with Sysreg Filters

```vue
<template>
  <div class="p-list">
    <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />

    <!-- Filter Bar (NEW) -->
    <div class="filter-bar" v-if="showFilters">
      <SysregFilterSet
        v-model="activeFilters"
        :entity="type"
        :available="['status', 'config', 'ttags', 'dtags']"
        :preset="filterPreset"
        @update:modelValue="handleFilterChange"
      />
      
      <button @click="clearFilters" v-if="hasActiveFilters">
        Filter zurücksetzen
      </button>
    </div>

    <!-- List with Applied Filters -->
    <ItemList
      :entity="entityType"
      :project="projectDomaincode"
      :filter-query="computedFilterQuery"
      :item-type="itemType"
      :size="size"
      :interaction="interaction"
      :dataMode="dataMode"
      :multiSelect="multiSelect"
      :selectedIds="selectedIds"
      @update:selectedIds="$emit('update:selectedIds', $event)"
    />

    <!-- Filter Stats (Optional) -->
    <div class="filter-stats" v-if="showStats">
      {{ filteredCount }} von {{ totalCount }} {{ type }} angezeigt
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ItemList } from '@/components/clist'
import { SysregFilterSet } from '@/components/sysreg'
import { useListFilters } from '@/composables/useListFilters'

interface Props {
  type: 'posts' | 'events' | 'instructors' | 'projects'
  showFilters?: boolean
  filterPreset?: 'published' | 'drafts' | 'mine' | 'featured'
  // ... existing props
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: false,
  filterPreset: undefined
})

const {
  activeFilters,
  computedFilterQuery,
  hasActiveFilters,
  clearFilters,
  applyPreset,
  filteredCount,
  totalCount
} = useListFilters(props.type, props.filterPreset)
</script>
```

#### Composable Specification: `useListFilters()`

```typescript
/**
 * Composable: useListFilters
 * 
 * Manages sysreg-based filtering for list components.
 * Builds query strings for API calls.
 */
export function useListFilters(
  entity: Ref<string> | string,
  initialPreset?: string
) {
  const activeFilters = ref<FilterState>({
    status: null,
    config: [],
    rtags: [],
    ctags: {},
    ttags: [],
    dtags: []
  })

  // Presets for common filter combinations
  const presets = {
    published: {
      status: '\\x04', // published
      config: [0]      // public
    },
    drafts: {
      status: '\\x01'  // draft
    },
    mine: {
      owner: 'current_user'
    },
    featured: {
      config: [1]      // featured bit
    }
  }

  // Build query string from active filters
  const computedFilterQuery = computed(() => {
    const params = new URLSearchParams()

    // Status filter
    if (activeFilters.value.status) {
      params.set('status_eq', activeFilters.value.status)
    }

    // Config bits (AND logic)
    if (activeFilters.value.config.length > 0) {
      params.set('config_has_bits', activeFilters.value.config.join(','))
    }

    // RTags bits (OR logic)
    if (activeFilters.value.rtags.length > 0) {
      const bytea = bitsToByteArray(activeFilters.value.rtags)
      params.set('rtags_any', bytea)
    }

    // CTags bit groups
    if (activeFilters.value.ctags.age_group !== undefined) {
      params.set('ctags_age_group', activeFilters.value.ctags.age_group.toString())
    }

    // TTags (OR logic)
    if (activeFilters.value.ttags.length > 0) {
      const bytea = bitsToByteArray(activeFilters.value.ttags)
      params.set('ttags_any', bytea)
    }

    // DTags (OR logic)
    if (activeFilters.value.dtags.length > 0) {
      const bytea = bitsToByteArray(activeFilters.value.dtags)
      params.set('dtags_any', bytea)
    }

    return params.toString()
  })

  // Check if any filters active
  const hasActiveFilters = computed(() => {
    return activeFilters.value.status !== null
      || activeFilters.value.config.length > 0
      || activeFilters.value.ttags.length > 0
      || activeFilters.value.dtags.length > 0
  })

  // Apply preset
  function applyPreset(presetName: string) {
    const preset = presets[presetName]
    if (preset) {
      activeFilters.value = { ...activeFilters.value, ...preset }
    }
  }

  // Clear all filters
  function clearFilters() {
    activeFilters.value = {
      status: null,
      config: [],
      rtags: [],
      ctags: {},
      ttags: [],
      dtags: []
    }
  }

  // Apply initial preset
  if (initialPreset) {
    applyPreset(initialPreset)
  }

  return {
    activeFilters,
    computedFilterQuery,
    hasActiveFilters,
    clearFilters,
    applyPreset,
    filteredCount: ref(0), // Updated by API response
    totalCount: ref(0)     // Updated by API response
  }
}
```

#### New Component: `<SysregFilterSet>`

```vue
<template>
  <div class="sysreg-filter-set">
    <!-- Status Dropdown -->
    <div class="filter-item" v-if="available.includes('status')">
      <label>Status:</label>
      <select v-model="localFilters.status" @change="emitUpdate">
        <option :value="null">Alle</option>
        <option
          v-for="status in statusOptions"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </option>
      </select>
    </div>

    <!-- Config Multi-Toggle -->
    <div class="filter-item" v-if="available.includes('config')">
      <label>Konfiguration:</label>
      <div class="config-toggles">
        <label v-for="cfg in configOptions" :key="cfg.bit">
          <input
            type="checkbox"
            :checked="localFilters.config.includes(cfg.bit)"
            @change="toggleConfigBit(cfg.bit)"
          />
          {{ cfg.label }}
        </label>
      </div>
    </div>

    <!-- TTags Multi-Select -->
    <div class="filter-item" v-if="available.includes('ttags')">
      <label>Themen:</label>
      <SysregMultiSelect
        v-model="localFilters.ttags"
        tagfamily="ttags"
        :max-selection="5"
        @update:modelValue="emitUpdate"
      />
    </div>

    <!-- DTags Multi-Select -->
    <div class="filter-item" v-if="available.includes('dtags')">
      <label>Bereiche:</label>
      <SysregMultiSelect
        v-model="localFilters.dtags"
        tagfamily="dtags"
        :max-selection="3"
        @update:modelValue="emitUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'

const props = defineProps<{
  modelValue: FilterState
  entity: string
  available: string[]
  preset?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
}>()

const { statusOptions, configOptions } = useSysregOptions(props.entity)

const localFilters = ref({ ...props.modelValue })

function toggleConfigBit(bit: number) {
  const index = localFilters.value.config.indexOf(bit)
  if (index > -1) {
    localFilters.value.config.splice(index, 1)
  } else {
    localFilters.value.config.push(bit)
  }
  emitUpdate()
}

function emitUpdate() {
  emit('update:modelValue', { ...localFilters.value })
}

watch(() => props.modelValue, (newValue) => {
  localFilters.value = { ...newValue }
}, { deep: true })
</script>
```

---

## Use-Case 6: Gallery Component with Dynamic Tag Filtering

### Context
**Current Implementation:** pGalleryEdit.vue uses ItemGallery with basic filtering.

**Success Pattern:** Grid layout, responsive design, image-focused display.

**Missing:** Visual tag filtering (chips/badges), filter animations, saved filter sets.

### Sysreg Integration Requirements

#### Component Enhancement: `<pGalleryEdit>` with Visual Filters

```vue
<template>
  <div class="p-gallery">
    <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />

    <!-- Visual Filter Chips (NEW) -->
    <div class="filter-chips" v-if="showFilters">
      <!-- Active Filter Display -->
      <div class="active-filters" v-if="hasActiveFilters">
        <span class="filter-label">Aktive Filter:</span>
        
        <FilterChip
          v-if="activeFilters.status"
          :label="getStatusLabel(activeFilters.status)"
          color="blue"
          @remove="clearStatusFilter"
        />
        
        <FilterChip
          v-for="tag in activeTopicTags"
          :key="tag.value"
          :label="tag.label"
          color="green"
          icon="📚"
          @remove="removeTopicTag(tag.value)"
        />
        
        <FilterChip
          v-for="tag in activeDomainTags"
          :key="tag.value"
          :label="tag.label"
          color="purple"
          icon="🎯"
          @remove="removeDomainTag(tag.value)"
        />
      </div>

      <!-- Filter Selector Dropdowns -->
      <div class="filter-selectors">
        <SysregTagSelector
          v-model="selectedTopicTags"
          tagfamily="ttags"
          placeholder="+ Thema hinzufügen"
          :exclude="selectedTopicTags"
        />
        
        <SysregTagSelector
          v-model="selectedDomainTags"
          tagfamily="dtags"
          placeholder="+ Bereich hinzufügen"
          :exclude="selectedDomainTags"
        />
      </div>

      <!-- Saved Filter Sets -->
      <div class="saved-filters" v-if="showSavedFilters">
        <button @click="applySavedFilter('favorites')">
          ⭐ Favoriten
        </button>
        <button @click="applySavedFilter('recent')">
          🕐 Zuletzt verwendet
        </button>
        <button @click="saveCurrentFilter">
          💾 Aktuellen Filter speichern
        </button>
      </div>
    </div>

    <!-- Gallery with Filtered Items -->
    <ItemGallery
      :entity="entityType"
      :project="projectDomaincode"
      :filter-query="computedFilterQuery"
      :item-type="itemType"
      :size="size"
      :variant="variant"
      :interaction="interaction"
      :dataMode="dataMode"
      :multiSelect="multiSelect"
      :selectedIds="selectedIds"
      @update:selectedIds="$emit('update:selectedIds', $event)"
    />

    <!-- Filter Result Count -->
    <div class="result-count" v-if="showStats">
      <AnimatedNumber :value="filteredCount" />
      {{ type }} gefunden
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ItemGallery } from '@/components/clist'
import { FilterChip, SysregTagSelector } from '@/components/sysreg'
import { useGalleryFilters } from '@/composables/useGalleryFilters'

interface Props {
  type: 'posts' | 'events' | 'instructors' | 'projects'
  showFilters?: boolean
  showSavedFilters?: boolean
  showStats?: boolean
  // ... existing props
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: false,
  showSavedFilters: false,
  showStats: true
})

const {
  activeFilters,
  selectedTopicTags,
  selectedDomainTags,
  activeTopicTags,
  activeDomainTags,
  computedFilterQuery,
  hasActiveFilters,
  clearStatusFilter,
  removeTopicTag,
  removeDomainTag,
  applySavedFilter,
  saveCurrentFilter,
  filteredCount
} = useGalleryFilters(props.type)
</script>

<style scoped>
.filter-chips {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-dimmed);
}

.filter-selectors {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.saved-filters {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.saved-filters button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.saved-filters button:hover {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
}

.result-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--color-dimmed);
  text-align: center;
}
</style>
```

#### Composable Specification: `useGalleryFilters()`

```typescript
/**
 * Composable: useGalleryFilters
 * 
 * Enhanced filtering for gallery components with visual feedback.
 */
export function useGalleryFilters(entity: Ref<string> | string) {
  const activeFilters = ref<FilterState>({
    status: null,
    config: [],
    ttags: [],
    dtags: []
  })

  const selectedTopicTags = ref<string[]>([])
  const selectedDomainTags = ref<string[]>([])
  const savedFilters = ref<Record<string, FilterState>>({})

  // Fetch sysreg options for display
  const { getTagLabel } = useSysregOptions(entity)

  // Computed active tag labels
  const activeTopicTags = computed(() => {
    return selectedTopicTags.value.map(value => ({
      value,
      label: getTagLabel('ttags', value)
    }))
  })

  const activeDomainTags = computed(() => {
    return selectedDomainTags.value.map(value => ({
      value,
      label: getTagLabel('dtags', value)
    }))
  })

  // Build query string
  const computedFilterQuery = computed(() => {
    const params = new URLSearchParams()

    if (activeFilters.value.status) {
      params.set('status_eq', activeFilters.value.status)
    }

    if (selectedTopicTags.value.length > 0) {
      const bytea = bitsToByteArray(selectedTopicTags.value)
      params.set('ttags_any', bytea)
    }

    if (selectedDomainTags.value.length > 0) {
      const bytea = bitsToByteArray(selectedDomainTags.value)
      params.set('dtags_any', bytea)
    }

    return params.toString()
  })

  // Filter management
  function clearStatusFilter() {
    activeFilters.value.status = null
  }

  function removeTopicTag(value: string) {
    const index = selectedTopicTags.value.indexOf(value)
    if (index > -1) {
      selectedTopicTags.value.splice(index, 1)
    }
  }

  function removeDomainTag(value: string) {
    const index = selectedDomainTags.value.indexOf(value)
    if (index > -1) {
      selectedDomainTags.value.splice(index, 1)
    }
  }

  // Saved filter sets
  function applySavedFilter(name: string) {
    const saved = savedFilters.value[name]
    if (saved) {
      activeFilters.value = { ...saved }
      selectedTopicTags.value = [...saved.ttags]
      selectedDomainTags.value = [...saved.dtags]
    }
  }

  function saveCurrentFilter(name?: string) {
    const filterName = name || prompt('Filter-Name eingeben:')
    if (filterName) {
      savedFilters.value[filterName] = {
        ...activeFilters.value,
        ttags: [...selectedTopicTags.value],
        dtags: [...selectedDomainTags.value]
      }
      
      // Persist to localStorage
      localStorage.setItem(
        `gallery-filters-${unref(entity)}`,
        JSON.stringify(savedFilters.value)
      )
    }
  }

  // Load saved filters on init
  onMounted(() => {
    const saved = localStorage.getItem(`gallery-filters-${unref(entity)}`)
    if (saved) {
      savedFilters.value = JSON.parse(saved)
    }
  })

  return {
    activeFilters,
    selectedTopicTags,
    selectedDomainTags,
    activeTopicTags,
    activeDomainTags,
    computedFilterQuery,
    hasActiveFilters: computed(() => 
      activeFilters.value.status !== null ||
      selectedTopicTags.value.length > 0 ||
      selectedDomainTags.value.length > 0
    ),
    clearStatusFilter,
    removeTopicTag,
    removeDomainTag,
    applySavedFilter,
    saveCurrentFilter,
    filteredCount: ref(0)
  }
}
```

---

## Summary: Key Design Decisions

### 1. API Endpoint Strategy

**Hybrid Approach: Minimal + Selective Expansion**

- **Default:** Minimal data (raw BYTEA values + generated labels)
- **Expansion:** Query param `?expand=status,config,tags` for full metadata
- **Filtering:** Rich query params (`status_eq`, `ctags_age_group`, `ttags_any`, etc.)
- **Performance:** Backend does bit operations, frontend gets ready-to-use data

**Example Endpoint Pattern:**
```
GET /api/{entity}?status_eq=0x02&ttags_any=0x03&expand=status,tags
```

### 2. Component Architecture

**Reusable Sysreg Components:**
- `<StatusBadge>` - Display status with color/icon
- `<SysregSelect>` - Single-value dropdown
- `<SysregMultiToggle>` - Multi-bit checkbox group
- `<SysregBitGroupSelect>` - CTags bit-group selector (age_group, etc.)
- `<SysregFilterSet>` - Complete filter UI
- `<SysregTagSelector>` - Tag addition dropdown
- `<FilterChip>` - Visual active filter display

### 3. Composable Pattern

**Core Composables:**
- `useSysregTags()` - Bit operations, BYTEA conversion
- `useSysregOptions()` - Fetch and cache sysreg metadata
- `useEntityStatus()` - Entity-specific status management (useProjectStatus, useImageStatus, etc.)
- `useListFilters()` - Filter state + query building
- `useGalleryFilters()` - Enhanced filters with visual chips

### 4. BYTEA Handling Strategy

**Client-Side Representation:**
- **Storage:** Hex strings (`"\\x01"`, `"\\x02"`, etc.)
- **Display:** Use `_status`, `_config` expanded objects
- **Updates:** Convert hex → Uint8Array → bit operations → hex
- **Filtering:** Backend handles BYTEA comparisons

**Helper Functions:**
```typescript
parseByteaHex(hex: string): number
byteaFromNumber(num: number): string
toggleBit(hex: string, bit: number): string
hasBit(hex: string, bit: number): boolean
bitsToByteArray(bits: number[]): Uint8Array
```

### 5. Performance Optimizations

1. **Caching:** Client-side sysreg metadata cache (status options, tag labels)
2. **Lazy Loading:** Expand only when needed
3. **Batch Operations:** Bulk updates for multi-edit scenarios
4. **Hash Indexes:** Already implemented on `*_val` columns
5. **Computed Columns:** `status_label` pre-computed in DB

### 6. Migration Path

**Phase 1:** Core composables + basic components  
**Phase 2:** Enhance existing components (ImagesCoreAdmin, cimgImport)  
**Phase 3:** New filter components (pListEdit, pGalleryEdit)  
**Phase 4:** Project dashboard integration  
**Phase 5:** Event template system  
**Phase 6:** Advanced features (saved filters, suggestions, analytics)

---

## Next Steps

1. **Create base composables:** `useSysregTags()`, `useSysregOptions()`
2. **Build core components:** `<StatusBadge>`, `<SysregMultiToggle>`
3. **Update API endpoints:** Add `?expand` support, sysreg filtering
4. **Enhance ImagesCoreAdmin:** Integrate status management UI
5. **Upgrade cimgImport:** Full sysreg integration
6. **Implement filters:** pListEdit + pGalleryEdit enhancements

**Ready to proceed with implementation?** I recommend starting with the composables (Phase 1) as they form the foundation for all other components.
