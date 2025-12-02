# Sysreg System - Complete Reference & Entry Point

**Date:** November 28, 2025  
**Status:** ✅ Production Ready (Migration 036 Complete)  
**Storage:** INTEGER (32-bit bitmask)  
**Admin UI:** `/admin/sysreg` (requires admin role)  
**Master Spec:** See [SYSREG_SPEC.md](./SYSREG_SPEC.md) for authoritative reference

---

## 🎯 Quick Start

### What is Sysreg?

The **Sysreg** (System Registry) is a PostgreSQL-based tag and status management system using **INTEGER bitmask fields** (32-bit). It provides:

- 🏷️ **Unified tagging system** - Topic tags, domain tags, record tags, content tags
- ⚡ **High-performance filtering** - Bitwise operations on indexed INTEGER columns
- 🌍 **Multilingual labels** - i18n support with fallback chains
- 📊 **Status workflows** - Validated state transitions for entities
- 🔧 **Configuration flags** - Per-entity feature toggles via bit flags

### Key Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **tagfamily** | Category of tags | `status`, `config`, `rtags`, `ctags`, `ttags`, `dtags` |
| **INTEGER value** | 32-bit bitmask | `1`, `4`, `256` (bit positions as powers of 2) |
| **taglogic** | Tag behavior type | `category`, `toggle`, `option`, `subcategory` |
| **Bit operations** | Combine tags with OR | `\x05` = bits 0+2 set (democracy + equality) |

---

## 📚 Documentation Structure

### Core Documentation (Start Here)

1. **[SYSREG_SYSTEM.md](./SYSREG_SYSTEM.md)** (This file) - Entry point and overview
2. **[SYSREG_USECASE_DESIGN.md](./SYSREG_USECASE_DESIGN.md)** - Use-case driven design (1692 lines)
3. **[SYSREG_PHASE3_PHASE4_COMPLETE.md](./SYSREG_PHASE3_PHASE4_COMPLETE.md)** - Implementation details (667 lines)
4. **[SYSREG_TESTING_STRATEGY.md](./SYSREG_TESTING_STRATEGY.md)** - Test coverage and strategy

### Technical Reference

5. **[SYSREG_INTERFACE_SPECIFICATION_ISSUE.md](./SYSREG_INTERFACE_SPECIFICATION_ISSUE.md)** - Type definitions and API contracts
6. **[tasks/2025-11-19-F-sysreg-implementation-plan.md](./tasks/2025-11-19-F-sysreg-implementation-plan.md)** - 6-phase implementation plan
7. **[tasks/2025-11-19-G-taglogic-analysis.md](./tasks/2025-11-19-G-taglogic-analysis.md)** - taglogic field analysis

---

## 🗄️ Database Architecture

### PostgreSQL Table (Migration 036: BYTEA → INTEGER)

**Base Table:**
```sql
CREATE TABLE sysreg (
  id SERIAL PRIMARY KEY,
  value INTEGER NOT NULL,            -- 32-bit bitmask (e.g., 1, 4, 256)
  name TEXT NOT NULL,                -- Internal name (e.g., 'democracy', 'draft')
  description TEXT,
  tagfamily TEXT NOT NULL,           -- 'status', 'config', 'rtags', 'ctags', 'ttags', 'dtags'
  taglogic TEXT NOT NULL,            -- 'category', 'toggle', 'option', 'subcategory', 'group'
  is_default BOOLEAN DEFAULT false,
  multiselect BOOLEAN DEFAULT false, -- Allow multi-select in UI
  parent_bit INTEGER,                -- For subcategories: parent category bit
  name_i18n JSONB,                   -- Multilingual labels
  desc_i18n JSONB,                   -- Multilingual descriptions
  UNIQUE (value, tagfamily)
);
```

**Child Tables (6 total):**
```sql
CREATE TABLE sysreg_status () INHERITS (sysreg);  -- 13 records
CREATE TABLE sysreg_config () INHERITS (sysreg);  -- 6 records
CREATE TABLE sysreg_rtags () INHERITS (sysreg);   -- 4 records
CREATE TABLE sysreg_ctags () INHERITS (sysreg);   -- 4 records
CREATE TABLE sysreg_ttags () INHERITS (sysreg);   -- 6 records
CREATE TABLE sysreg_dtags () INHERITS (sysreg);   -- 5 records
```

**Total Records:** 38+ (stored in child tables, queried via parent)

**Migration History:**
- **Migration 022**: Creates base sysreg table and seeds status/ctags
- **Migration 024**: Creates inherited child tables with CHECK constraints
- **Migration 026**: Seeds config, rtags, ttags, dtags into child tables
- **Migration 027**: Migrates entity status_id_depr → status_val
- **Migration 028**: Integrates sysreg translations into i18n_codes table
- **Migration 029**: Moves existing records from base to child tables
- **Migration 036**: BYTEA → INTEGER conversion ✅
- **Migration 037**: dtags restructure with parent_bit 🔄 In Progress

### Entity Integration

**Entity Tables with Sysreg Support:**
```sql
-- All entity tables have these INTEGER columns (Migration 036):
status_val INTEGER,    -- Single status value
config_val INTEGER,    -- Configuration flags (bit field)
rtags_val INTEGER,     -- Record tags (currently empty for alpha)
ctags_val INTEGER,     -- Common tags (participant ages, working spaces)
ttags_val INTEGER,     -- Topic tags (democracy, sustainability, etc.)
dtags_val INTEGER      -- Domain tags (theater pedagogy taxonomy)
```

**Entities with Full Sysreg Support:**
- `projects` (status workflow + all tags)
- `events` (status workflow + all tags)
- `posts` (status workflow + all tags)
- `images` (status workflow + config flags + tags)
- `users` (role-based status)
- `tasks` (workflow status)
- `interactions` (engagement tracking)

---

## 🧩 Composable Architecture

### Core Composables (All Production Ready)

#### 1. **useSysregTags** - Low-level bit operations
**File:** `src/composables/useSysregTags.ts`

```typescript
import { useSysregTags } from '@/composables/useSysregTags'

const {
  // INTEGER/hex conversion (legacy support)
  parseByteaHex,           // '\x0105' → [1, 5]
  byteaFromNumber,         // 5 → '\x05'
  
  // Bit operations
  hasBit,                  // Check if bit N is set
  setBit,                  // Set bit N
  clearBit,                // Clear bit N
  toggleBit,               // Toggle bit N
  hasAllBits,              // Check multiple bits (AND)
  hasAnyBit,               // Check multiple bits (OR)
  
  // Multi-tag operations
  toggleTag,               // Toggle tag in array
  bitsToByteArray,         // [0, 2, 5] → [0x25]
  byteArrayToBits,         // [0x25] → [0, 2, 5]
  
  // CTags bit groups
  extractCtagsBitGroup,    // Get age_group value (0-3)
  updateCtagsBitGroup,     // Set age_group to 2
  buildCtagsByte,          // Build from object
  
  // Cache
  sysregCache,             // Ref<SysregCache | null>
  cacheInitialized,        // Ref<boolean>
  initCache                // async () => Promise<void>
} = useSysregTags()
```

**Use Cases:**
- Direct INTEGER bit manipulation
- Building filter queries
- Bit group extraction (CTags)
- Low-level tag operations

---

#### 2. **useSysregOptions** - Tag metadata & labels
**File:** `src/composables/useSysregOptions.ts`

```typescript
import { useSysregOptions } from '@/composables/useSysregOptions'

const {
  // State
  loading,                 // Ref<boolean>
  error,                   // Ref<string | null>
  cacheInitialized,        // Ref<boolean>
  
  // Tag family options (computed refs)
  statusOptions,           // ComputedRef<SysregOption[]>
  configOptions,
  rtagsOptions,
  ctagsOptions,
  ttagsOptions,
  dtagsOptions,
  
  // CTags bit group options
  ctagsBitGroupOptions: {
    age_group,             // [{ value: 0, label: 'Andere' }, ...]
    subject_type,
    access_level,
    quality
  },
  
  // Lookup functions
  getTagLabel,             // (tagfamily, value) => label
  getOptionByValue,        // (tagfamily, value) => SysregOption | null
  getOptionByName,         // (tagfamily, name) => SysregOption | null
  getOptionsByFamily,      // (tagfamily) => SysregOption[]
  getCtagsBitGroup,        // (group) => BitGroupOption[]
  
  // Actions
  fetchOptions,            // (force?) => Promise<void>
  initCache                // () => Promise<void>
} = useSysregOptions()
```

**Use Cases:**
- Dropdowns and select components
- Tag label display
- Filter option lists
- Multilingual tag labels

---

#### 3. **useImageStatus** - Image lifecycle management
**File:** `src/composables/useImageStatus.ts`

```typescript
import { useImageStatus } from '@/composables/useImageStatus'

const image = ref<Image | null>(/* ... */)

const {
  // Current state (computed)
  currentStatus,           // '\x02' (approved)
  currentConfig,           // '\x05' (public + featured)
  statusLabel,             // 'Approved' (i18n)
  
  // Status checks
  isRaw, isProcessing, isApproved, 
  isPublished, isDeprecated, isArchived,
  
  // Config checks
  isPublic, isFeatured, needsReview,
  hasPeople, isAiGenerated, hasHighRes,
  
  // Transition validation
  canStartProcessing, canApprove, canPublish,
  canDeprecate, canArchive, canUnarchive,
  validTransitions,        // Array of allowed next states
  
  // Workflow tracking
  workflowOrder,           // ['raw', 'processing', 'approved', ...]
  currentWorkflowStep,     // 2 (approved is step 2)
  
  // Status transitions
  startProcessing,         // async () => Promise<void>
  approveImage,
  publishImage,
  deprecateImage,
  archiveImage,
  unarchiveImage,
  resetToRaw,
  
  // Config bit management
  hasConfigBit,            // (bit) => boolean
  setConfigBit,            // (bit, value) => Promise<void>
  toggleConfigBit,         // (bit) => Promise<void>
  
  // Direct field operations
  hasBitInField,           // (field, bit) => boolean
  setBitInField,           // (field, bit) => void
  clearBitInField,         // (field, bit) => void
  toggleBitInField,        // (field, bit) => void
  
  // Utility
  updateImageStatus        // (updates) => Promise<void>
} = useImageStatus(image)
```

**Use Cases:**
- Image admin interfaces
- Status workflow UIs
- Config flag toggles
- Validation before actions

---

#### 4. **useProjectStatus** - Project lifecycle management
**File:** `src/composables/useProjectStatus.ts`

```typescript
import { useProjectStatus } from '@/composables/useProjectStatus'

const project = ref<Project | null>(/* ... */)

const {
  // Status checks
  isIdea, isDraft, isPlanned, isActive,
  isCompleted, isArchived,
  
  // Config checks
  isPublic, isFeatured, registrationOpen,
  hasFunding, isRecurring, isArchivedConfig,
  
  // Transitions
  canStartPlanning, canApprove, canActivate,
  canComplete, canArchive, canUnarchive, canReopen,
  
  // Status transitions
  startPlanning,           // async () => Promise<void>
  approveProject,
  activateProject,
  completeProject,         // (summary?) => Promise<void>
  archiveProject,
  unarchiveProject,
  reopenProject,
  
  // Config toggles
  togglePublic,            // async () => Promise<void>
  toggleFeatured,
  toggleRegistration,
  toggleFunding,
  toggleRecurring,
  
  // Helpers
  statusLabel,             // 'Active' (i18n)
  statusColor,             // 'green' (UI hint)
  configFlags,             // Object with all config states
  nextAction,              // Suggested next step
  
  // Generic operations
  hasConfigBit, setConfigBit, toggleConfigBit,
  updateProjectStatus
} = useProjectStatus(project)
```

**Use Cases:**
- Project dashboards
- Status transitions
- Config management
- Workflow guidance

---

#### 5. **useGalleryFilters** - Filter state management
**File:** `src/composables/useGalleryFilters.ts`

```typescript
import { useGalleryFilters } from '@/composables/useGalleryFilters'

const {
  // State
  filters,                 // Ref<GalleryFilters>
  hasActiveFilters,        // Ref<boolean>
  
  // Filter setters
  setStatusFilter,         // (values: string[]) => void
  setTtagsFilter,          // (values: string[]) => void
  setDtagsFilter,          // (values: string[]) => void
  setRtagsFilter,          // (values: string[]) => void
  setSearchText,           // (text: string) => void
  clearFilters,            // () => void
  
  // Client-side filtering
  images,                  // Ref<any[]>
  setImages,               // (images: any[]) => void
  filteredImages,          // ComputedRef<any[]>
  sortedImages,            // ComputedRef<any[]>
  
  // API query building
  buildQuery,              // () => string (URL params)
  fetchFilteredImages,     // async () => Promise<void>
  loadMore,                // async () => Promise<void>
  
  // Pagination
  pagination,              // Ref<Pagination>
  
  // View mode
  viewMode,                // Ref<'grid' | 'list' | 'masonry'>
  setViewMode,             // (mode) => void
  sortBy,                  // (field, order) => void
  
  // Storage
  loading,                 // Ref<boolean>
  error                    // Ref<string | null>
} = useGalleryFilters()
```

**Use Cases:**
- Image galleries
- Filter controls
- Search interfaces
- Pagination

---

### Advanced Composables (Phase 5 - Complete)

#### 6. **useSysregAnalytics** - Usage statistics
**File:** `src/composables/useSysregAnalytics.ts` (371 lines)

```typescript
const {
  // Analytics data
  statusDistribution,      // Ref<StatusDistribution[]>
  ttagsUsage,              // Ref<TagUsageStats[]>
  dtagsUsage,
  rtagsUsage,
  trendingTags,            // Ref<TrendingTag[]>
  
  // Computed insights
  totalCount,              // Total entities
  mostUsedStatus,          // Most common status
  mostUsedTtag,
  mostUsedDtag,
  
  // Actions
  fetchAnalytics,          // (force?) => Promise<void>
  calculateTrending,       // () => Promise<void>
  exportToCsv,             // (type) => string
  downloadCsv              // (type) => void
} = useSysregAnalytics('images')
```

---

#### 7. **useSysregBatchOperations** - Bulk updates
**File:** `src/composables/useSysregBatchOperations.ts` (454 lines)

```typescript
const {
  // Progress tracking
  progress,                // Ref<BatchProgress>
  isRunning,               // Ref<boolean>
  progressPercent,         // ComputedRef<number>
  
  // Batch operations
  batchUpdateStatus,       // (entity, ids, status) => Promise<BatchResult>
  batchAddTags,            // (entity, ids, tagfamily, bits) => Promise<BatchResult>
  batchRemoveTags,         // (entity, ids, tagfamily, bits) => Promise<BatchResult>
  batchToggleConfigBit,    // (entity, ids, bit) => Promise<BatchResult>
  batchSetConfigBit,       // (entity, ids, bit, value) => Promise<BatchResult>
  batchApply,              // Generic batch operation
  
  // Helpers
  resetProgress            // () => void
} = useSysregBatchOperations()
```

---

#### 8. **useSysregSuggestions** - Intelligent tag suggestions (Phase 7 - Planned)
**File:** `src/composables/useSysregSuggestions.ts`

```typescript
const {
  // History
  suggestionHistory,       // Ref<Record<string, number>>
  recordTagUsage,          // (tagfamily, bit) => void
  getFrequentTags,         // (tagfamily, limit?) => TagSuggestion[]
  
  // Suggestion sources
  suggestFromProject,      // (project, tagfamilies?) => TagSuggestion[]
  suggestFromContent,      // (text, entity?) => TagSuggestion[]
  suggestCtagsFromContent, // (text, entity?) => CtagsSuggestion[]
  suggestFromSimilar,      // (entity, currentTags, limit?) => Promise<TagSuggestion[]>
  
  // Combined suggestions
  getCombinedSuggestions   // (sources, maxSuggestions?) => TagSuggestion[]
} = useSysregSuggestions()
```

---

## 📡 API Endpoints

### GET /api/sysreg/all

**Purpose:** Fetch all sysreg entries grouped by tagfamily

**Response:**
```json
{
  "status": [
    { "value": "\\x00", "name": "events > new", "label": "Neu", ... },
    { "value": "\\x01", "name": "events > demo", "label": "Demo", ... }
  ],
  "config": [...],
  "rtags": [...],
  "ctags": [...],
  "ttags": [...],
  "dtags": [...]
}
```

**Caching:** Client-side cache in `useSysregTags` composable

**Performance:** Single query returns all 38 records (~5KB)

---

### POST /api/sysreg

**Purpose:** Create a new sysreg tag

**Auth:** Requires admin role

**Request Body:**
```json
{
  "tagfamily": "ttags",
  "value": "\\x40",
  "name": "sustainability",
  "taglogic": "toggle",
  "description": "Content related to sustainability",
  "is_default": false,
  "name_i18n": {
    "en": "Sustainability",
    "de": "Nachhaltigkeit"
  },
  "desc_i18n": {
    "en": "Content about environmental sustainability",
    "de": "Inhalte über Umweltnachhaltigkeit"
  }
}
```

**Response:**
```json
{
  "success": true,
  "tag": { ...created tag object... }
}
```

**Validation:**
- `tagfamily` must be one of: status, config, rtags, ctags, ttags, dtags
- `value` must be hex format: `\x01`, `\x02`, etc.
- `taglogic` must be: category, toggle, option, subcategory
- `value` + `tagfamily` must be unique

---

### PUT /api/sysreg/[id]

**Purpose:** Update an existing sysreg tag

**Auth:** Requires admin role

**Request Body:** (all fields optional)
```json
{
  "name": "updated_name",
  "description": "Updated description",
  "taglogic": "toggle",
  "is_default": false,
  "name_i18n": { "en": "New Label", "de": "Neue Bezeichnung" },
  "desc_i18n": { "en": "New description", "de": "Neue Beschreibung" }
}
```

**Note:** Cannot change `tagfamily` or `value` (structural fields)

**Response:**
```json
{
  "success": true,
  "tag": { ...updated tag object... }
}
```

---

### DELETE /api/sysreg/[id]

**Purpose:** Delete a sysreg tag

**Auth:** Requires admin role

**Restrictions:**
- Cannot delete default tags (`is_default = true`)
- Cannot delete tags currently in use by entities

**Response:**
```json
{
  "success": true,
  "deleted": { ...deleted tag object... }
}
```

**Error Codes:**
- `403` - Cannot delete default tag
- `404` - Tag not found
- `409` - Tag is in use by entities

---

## 🧪 Testing

### Test Coverage

**Overall:** 227/227 tests passing (100%)

**By Composable:**
- `useSysregTags`: 55/55 ✅
- `useSysregOptions`: 37/37 ✅
- `useImageStatus`: 45/45 ✅
- `useProjectStatus`: 40/40 ✅
- `useGalleryFilters`: 50/50 ✅

**Test Files:**
- `tests/unit/useSysregTags.spec.ts` - Bit operations
- `tests/unit/useSysregOptions.spec.ts` - Tag metadata
- `tests/unit/useImageStatus.spec.ts` - Image workflows
- `tests/unit/useProjectStatus.spec.ts` - Project workflows
- `tests/unit/useGalleryFilters.spec.ts` - Filter logic

**Run Tests:**
```bash
# All sysreg tests
pnpm test tests/unit/useSysreg

# Specific composable
pnpm test tests/unit/useSysregOptions.spec.ts
```

---

## 🚀 Implementation Phases

### ✅ Phase 1: Foundation (Complete)
- PostgreSQL table inheritance structure
- Database migrations (022-029)
- Base sysreg table + 6 child tables
- 38 tag entries seeded
- i18n integration (migration 028)

### ✅ Phase 2: Core Composables (Complete)
- `useSysregTags` - Bit operations (55 tests)
- `useSysregOptions` - Tag metadata (37 tests)
- BYTEA conversion utilities
- Client-side cache management

### ✅ Phase 3: Entity Composables (Complete)
- `useImageStatus` - Image lifecycle (45 tests)
- `useProjectStatus` - Project lifecycle (40 tests)
- Status validation
- Config bit management

### ✅ Phase 4: Filter & UI (Complete)
- `useGalleryFilters` - Filter state (50 tests)
- Filter components (FilterChip, FilterPanel)
- localStorage persistence
- Query string generation

### ✅ Phase 5: Advanced Features (Complete)
- `useSysregAnalytics` - Usage statistics (371 lines)
- `useSysregBatchOperations` - Bulk updates (454 lines)
- Status distribution analytics
- Tag usage tracking
- Batch status updates
- Batch tag operations

### ✅ Phase 6: Admin UI (Complete)
- `SysregAdminView.vue` - Complete admin interface
- Tag CRUD operations (Create, Read, Update, Delete)
- Real-time analytics dashboard
- Batch operations UI
- API endpoints: POST /api/sysreg, PUT /api/sysreg/[id], DELETE /api/sysreg/[id]
- Access: `/admin/sysreg` (admin role required)

---

## 📖 Code Examples

### Example 1: Filter Images by Multiple Tags

```typescript
<script setup lang="ts">
import { useGalleryFilters } from '@/composables/useGalleryFilters'
import { useSysregOptions } from '@/composables/useSysregOptions'

const { 
  filters, 
  filteredImages, 
  setTtagsFilter, 
  setDtagsFilter 
} = useGalleryFilters()

const { ttagsOptions, dtagsOptions } = useSysregOptions()

// Set filters: democracy OR environment
setTtagsFilter(['\x01', '\x02'])  // bits 0, 1

// Add domain filter: games
setDtagsFilter(['\x01'])  // bit 0

// filteredImages automatically updates
console.log(filteredImages.value.length)
</script>
```

---

### Example 2: Image Status Workflow

```typescript
<script setup lang="ts">
import { ref } from 'vue'
import { useImageStatus } from '@/composables/useImageStatus'

const image = ref({
  id: 42,
  status_val: '\x00',  // raw
  config_val: '\x00',
  title: 'Workshop Photo'
})

const {
  isRaw,
  canStartProcessing,
  startProcessing,
  approveImage,
  isPublic,
  togglePublic
} = useImageStatus(image)

// Workflow
if (isRaw.value && canStartProcessing.value) {
  await startProcessing()  // status_val becomes \x01 (processing)
}

// Later...
await approveImage()  // status_val becomes \x02 (approved)

// Toggle visibility
await togglePublic()  // config_val bit 0 toggled
</script>
```

---

### Example 3: Display Tag Labels

```typescript
<script setup lang="ts">
import { useSysregOptions } from '@/composables/useSysregOptions'

const { getTagLabel } = useSysregOptions()

const image = {
  ttags_val: '\x05',  // bits 0 and 2 (democracy + equality)
  dtags_val: '\x01'   // bit 0 (games)
}

// Extract labels
const ttagLabels = [0, 2].map(bit => 
  getTagLabel('ttags', `\\x${(1 << bit).toString(16).padStart(2, '0')}`)
)
// ['Democracy', 'Equality']

const dtagLabel = getTagLabel('dtags', '\x01')
// 'Games'
</script>

<template>
  <div>
    <span v-for="label in ttagLabels" :key="label">
      {{ label }}
    </span>
    <span>{{ dtagLabel }}</span>
  </div>
</template>
```

---

## 🎨 UI Components

### Available Components

1. **FilterChip.vue** - Display active filter with remove button
2. **FilterPanel.vue** - Complete filter UI with all tag families
3. **StatusBadge.vue** - Display status with color coding
4. **TagSelector.vue** - Multi-select tag picker
5. **CtagsBitGroupSelector.vue** - CTags bit group picker (4 groups)
6. **SysregAdminView.vue** - Complete admin interface (Tag CRUD + Analytics + Batch Ops)

**Location:** `src/components/sysreg/` and `src/views/admin/`

**Admin Interface:**
- **URL:** `/admin/sysreg`
- **Access:** Admin role required
- **Features:**
  - Tag Management: Create, edit, delete tags with validation
  - Analytics Dashboard: Status distribution, tag usage statistics
  - Batch Operations: Bulk status updates, tag additions/removals
  - Multi-family support: All 6 tag families (status, config, rtags, ctags, ttags, dtags)
  - Real-time validation: Check for in-use tags before deletion
  - i18n support: Multilingual labels (EN/DE)

---

## 🔧 Migration Guide

### Migrating from Legacy status_id to Sysreg

**Step 1: Run migrations**
```bash
pnpm db:migrate
```

**Step 2: Update components**
```typescript
// Before (legacy)
const status = computed(() => statusOptions.value.find(s => s.id === entity.value.status_id))

// After (sysreg)
const { statusLabel } = useImageStatus(entity)
```

**Step 3: Update filters**
```typescript
// Before
?status_id=3

// After
?status_eq=\x02  // approved
```

---

## 🐛 Troubleshooting

### Cache Not Initialized

**Problem:** `useSysregOptions` returns empty arrays

**Solution:**
```typescript
const { initCache, cacheInitialized } = useSysregOptions()

onMounted(async () => {
  if (!cacheInitialized.value) {
    await initCache()
  }
})
```

---

### Hex String Confusion (Legacy BYTEA patterns)

**Problem:** Value showing as `"\x01"` but not matching

**Solution:** Always use double backslash in JavaScript:
```typescript
// Correct
const value = '\\x01'

// Wrong
const value = '\x01'  // This is a newline + x + 01
```

---

### Bit Operations Not Working

**Problem:** `hasBit()` returns wrong results

**Solution:** Check your byte order:
```typescript
// Correct: bit 0 is LSB (rightmost)
hasBit('\x01', 0)  // true (binary: 00000001)
hasBit('\x02', 1)  // true (binary: 00000010)
hasBit('\x04', 2)  // true (binary: 00000100)

// Multi-byte: read right-to-left
hasBit('\x0201', 0)  // true (first byte: 0x01)
hasBit('\x0201', 8)  // false (second byte bit 0: 0x02 >> 0)
hasBit('\x0201', 9)  // true (second byte bit 1: 0x02 >> 1)
```

---

## 📝 Best Practices

### 1. Always Use Composables

✅ **Do:**
```typescript
const { statusLabel } = useImageStatus(image)
```

❌ **Don't:**
```typescript
// Manual parsing - fragile
const statusLabel = image.value.status_val === '\x01' ? 'Draft' : 'Unknown'
```

---

### 2. Initialize Cache Once

✅ **Do:**
```typescript
// In App.vue or router beforeEach
const { initCache } = useSysregTags()
await initCache()
```

❌ **Don't:**
```typescript
// In every component
await fetchOptions()  // Redundant API calls
```

---

### 3. Use Typed Interfaces

✅ **Do:**
```typescript
interface Image {
  id: number
  status_val: string | null
  config_val: string | null
  ttags_val: string | null
}
```

❌ **Don't:**
```typescript
const image: any = { ... }  // Type safety lost
```

---

## 🔗 Related Documentation

- **[Database Migrations](./DATABASE_MIGRATIONS.md)** - Migration system overview
- **[I18N System](./I18N_IMPLEMENTATION.md)** - Multilingual support
- **[Testing Strategy](./SYSREG_TESTING_STRATEGY.md)** - Test coverage details
- **[Use-Case Design](./SYSREG_USECASE_DESIGN.md)** - Detailed use-case analysis

---

## 👥 Team Notes

### For Frontend Developers

**Start here:**
1. Read this document (SYSREG_SYSTEM.md)
2. Review [SYSREG_USECASE_DESIGN.md](./SYSREG_USECASE_DESIGN.md) - Use-Case 2 (Image Gallery)
3. Check examples in `src/composables/useSysregOptions.ts`
4. Run tests: `pnpm test tests/unit/useSysregOptions.spec.ts`

**Key Composables:**
- `useSysregOptions` - For dropdowns and labels
- `useGalleryFilters` - For filter UIs
- `useImageStatus` or `useProjectStatus` - For entity management

---

### For Backend Developers

**Start here:**
1. Review migrations 022-029 in `server/database/migrations/`
2. Check table structure: `\d sysreg` in psql
3. Understand inheritance: `SELECT * FROM sysreg` returns all child records
4. API endpoint: `server/api/sysreg/all.get.ts`

**Key Files:**
- `server/database/migrations/022_create_sysreg.ts` - Base table
- `server/database/migrations/024_create_inherited_tables.ts` - Child tables
- `server/database/migrations/026_seed_new_sysreg_entries.ts` - Data seeding

---

### For Code Automation Tools

**Context Required:**
- This document (entry point)
- [SYSREG_USECASE_DESIGN.md](./SYSREG_USECASE_DESIGN.md) for detailed specs
- [SYSREG_PHASE3_PHASE4_COMPLETE.md](./SYSREG_PHASE3_PHASE4_COMPLETE.md) for implementation details
- Composable source files in `src/composables/useSysreg*.ts`

**Common Tasks:**
- Adding new tagfamily: Extend migrations 024 + 026, update types
- Adding entity support: Add 6 INTEGER columns + composable
- Creating UI components: Use `useSysregOptions` for options, `useGalleryFilters` for state

---

## 📊 Current System Status

| Component | Status | Tests | Documentation |
|-----------|--------|-------|---------------|
| Database Schema | ✅ Complete | N/A | Migrations 022-029 |
| Table Inheritance | ✅ Working | Manual verification | Migration 029 |
| i18n Integration | ✅ Complete | Covered by i18n tests | Migration 028 |
| useSysregTags | ✅ Production | 55/55 ✅ | Source + tests |
| useSysregOptions | ✅ Production | 37/37 ✅ | Source + tests |
| useImageStatus | ✅ Production | 45/45 ✅ | Source + tests |
| useProjectStatus | ✅ Production | 40/40 ✅ | Source + tests |
| useGalleryFilters | ✅ Production | 50/50 ✅ | Source + tests |
| useSysregAnalytics | ✅ Production | Integration tests | 371 lines |
| useSysregBatchOperations | ✅ Production | Integration tests | 454 lines |
| API Endpoints (GET) | ✅ Working | Integration tests | all.get.ts |
| API Endpoints (CRUD) | ✅ Working | Manual tests | POST, PUT, DELETE |
| UI Components | ✅ Available | Component tests | sysreg/ directory |
| Admin Interface | ✅ Production | Manual tests | /admin/sysreg |

**Overall System:** ✅ **Production Ready** (Phases 1-6 complete, 227/227 core tests passing)

---

## 🎯 Next Steps

### ✅ Phases 1-6 Complete
- ✅ Database schema with table inheritance
- ✅ Core composables (tags, options, status)
- ✅ Entity composables (images, projects, gallery filters)
- ✅ Advanced composables (analytics, batch operations)
- ✅ Complete admin UI with CRUD operations
- ✅ Full test coverage (227/227 core tests)

### Phase 7 (Future Enhancements - Optional)
- Tag suggestions (`useSysregSuggestions`)
- Tag hierarchy and relationships
- Tag import/export tools
- Advanced analytics dashboards
- Audit logging
- Tag usage history

### Production Deployment Checklist
- ✅ All migrations tested
- ✅ All composables working
- ✅ Admin UI accessible at `/admin/sysreg`
- ✅ API endpoints validated
- ⚠️ Set up admin role access control
- ⚠️ Configure backup strategy for sysreg tables
- ⚠️ Test tag deletion safeguards in production

---

**Last Updated:** November 19, 2025  
**Maintainer:** Crearis Development Team  
**Questions?** Refer to specific documentation files or check test files for usage examples.
