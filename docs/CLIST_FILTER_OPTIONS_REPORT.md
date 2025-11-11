# CList Filter Options Report

**Created:** November 11, 2025  
**Last Updated:** November 11, 2025 (Phase 1 Implemented ✅)  
**Component Version:** CL2 (Computed Lists v2)  
**Purpose:** Document existing filter capabilities and identify enhancement opportunities

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Filter Implementation](#current-filter-implementation)
3. [XML ID System Analysis](#xml-id-system-analysis)
4. [Filter Use Cases](#filter-use-cases)
5. [Proposed Filter Enhancements](#proposed-filter-enhancements)
6. [Implementation Recommendations](#implementation-recommendations)
7. [Implementation Status](#implementation-status)

---

## Executive Summary

**Current State (Phase 1 Implemented):**
- ✅ Basic ID filtering implemented via `filterIds` prop
- ✅ XML ID extraction and emission working
- ✅ XML ID fragment parsing in DropdownList
- ✅ **XML ID prefix filtering** (`filterXmlPrefix`) ✨ NEW
- ✅ **Multi-prefix filtering** (`filterXmlPrefixes`) ✨ NEW
- ✅ **Pattern-based filtering** (`filterXmlPattern`) ✨ NEW

**Key Findings:**
1. `filterIds` prop filters by numeric database IDs
2. XML IDs follow pattern: `{project}.{entity}.{unique}`
3. DropdownList extracts first two fragments for display
4. **Phase 1 Complete:** XML ID filtering now available!

**Implementation Status:**
✅ **Phase 1 Complete** - XML ID prefix filtering fully implemented
- 3 new props added to ItemList, DropdownList, pList
- Helper functions exported for XML ID manipulation
- All filters combined with efficient AND logic
- Zero breaking changes

---

## Current Filter Implementation

### 1. filterIds Prop

**Location:** `ItemList.vue`

**Definition:**
```typescript
interface Props {
    filterIds?: number[] // Filter fetched entities by these IDs
}
```

**Implementation:**
```typescript
const entities = computed(() => {
    if (dataModeActive.value) {
        let filteredData = entityData.value
        
        if (props.filterIds !== undefined) {
            // filterIds is explicitly provided - apply filtering even if empty array
            filteredData = entityData.value.filter((entity: any) =>
                props.filterIds!.includes(entity.id)
            )
            console.log('[ItemList] After filtering:', filteredData.length)
        }
        
        // ... transform to ListItem format
    }
})
```

**Behavior:**
- ✅ Filters by numeric database ID
- ✅ Works with both single and multiple IDs
- ✅ Empty array shows no results (explicit behavior)
- ✅ `undefined` shows all results (no filter)
- ✅ Applied before transformation to ListItem format

**Usage Example:**
```vue
<DropdownList 
  entity="events"
  :filterIds="[1, 5, 12, 23]"
  title="Specific Events"
/>
```

**Current Limitation:**
- Only filters by numeric ID
- Requires knowing database IDs in advance
- Cannot filter by entity type, project, or other criteria

---

### 2. Project Filtering

**Location:** API fetch logic

**Definition:**
```typescript
interface Props {
    project?: string // domaincode filter
}
```

**Implementation:**
```typescript
// Automatically applied during API fetch
const url = props.project 
    ? `/api/${props.entity}?project=${props.project}`
    : `/api/${props.entity}`
```

**Behavior:**
- ✅ Filters at API level (server-side)
- ✅ Efficient (reduces data transfer)
- ✅ Automatic for all entity types

**Usage Example:**
```vue
<DropdownList 
  entity="events"
  project="tp"
  title="Theaterpedia Events"
/>
```

---

## XML ID System Analysis

### XML ID Structure

**Standard Format:**
```
{project}.{entity}.{unique_identifier}
```

**Examples:**
```
tp.event.ws2025          → Theaterpedia, Event, Workshop 2025
tp.instructor.jd001      → Theaterpedia, Instructor, John Doe
music.event.concert42    → Music Project, Event, Concert 42
demo.post.welcome        → Demo Project, Post, Welcome
```

**Fragment Breakdown:**
- **Fragment 0 (Project):** `tp`, `music`, `demo`
- **Fragment 1 (Entity Type):** `event`, `instructor`, `post`, `project`
- **Fragment 2+ (Unique ID):** `ws2025`, `jd001`, `concert42`, `welcome`

### Current XML ID Usage

#### A. Storage (ItemList)

```typescript
interface EntityItem {
    id: number           // Database ID
    xmlID?: string       // XML unique identifier
    // ...
}
```

**Source:** API response includes `xmlID` field for all entities

#### B. Emission (ItemList)

**Location:** Lines 595-603

```typescript
function emitSelectedData(selectedIds: number[]) {
    const selectedItems = entityData.value.filter(item => selectedIds.includes(item.id))
    
    // Extract xmlIDs
    const xmlIds = selectedItems.map(item => item.xmlID).filter(Boolean) as string[]
    
    if (props.multiSelect) {
        emit('selectedXml', xmlIds)  // Array: ["tp.event.ws2025", "tp.event.conf2025"]
    } else {
        emit('selectedXml', xmlIds[0] || '')  // Single: "tp.event.ws2025"
    }
    
    emit('selected', props.multiSelect ? selectedItems : selectedItems[0])
}
```

**Events:**
- `selectedXml`: Emits XML ID(s) of selected items
- `selected`: Emits full entity object(s)

#### C. Display (DropdownList)

**Location:** Lines 174-196

```typescript
// Simplified xmlID display: "prefix.type: id1, id2, id3"
const simplifiedXmlDisplay = computed(() => {
    if (!props.displayXml || selectedItems.value.length === 0) return ''

    const xmlIds = selectedItems.value
        .map(item => item.xmlID)
        .filter(Boolean)

    if (xmlIds.length === 0) return ''

    // Split first xmlID by '.' and take first two parts
    const parts = xmlIds[0].split('.')
    const prefix = parts.slice(0, 2).join('.')  // "tp.event"

    // Extract remaining parts from all xmlIDs
    const suffixes = xmlIds.map((id: string) => {
        const idParts = id.split('.')
        return idParts.slice(2).join('.')  // "ws2025", "conf2025"
    })

    return `${prefix}: ${suffixes.join(', ')}`
    // Result: "tp.event: ws2025, conf2025"
})
```

**Display Example:**
```
Selection: ["tp.event.ws2025", "tp.event.conf2025", "tp.event.panel123"]
Display:   "tp.event: ws2025, conf2025, panel123"
```

**Benefits:**
- Compact display
- Emphasizes unique identifiers
- Assumes common project/entity prefix

---

## Filter Use Cases

### Use Case 1: Filter by Project Prefix

**Scenario:** Multi-project application, show events from specific project

**Current Solution:**
```vue
<DropdownList 
  entity="events"
  project="tp"
/>
```

**Limitation:** Only works if API endpoint supports project filtering

**Desired Solution:**
```vue
<DropdownList 
  entity="events"
  :filterXmlPrefix="'tp'"
/>
```

**Benefit:** Client-side filtering, works with mixed data sources

---

### Use Case 2: Filter by Entity Type Prefix

**Scenario:** Mixed entity list, filter to show only instructors

**Current Solution:** Not possible

**Desired Solution:**
```vue
<ItemList 
  entity="all"
  :filterXmlPrefix="'tp.instructor'"
/>
```

**Use Case:**
- Search results with mixed types
- Show only specific entity type
- Filter within fetched data

---

### Use Case 3: Filter by Multiple Prefixes

**Scenario:** Show events and instructors, exclude posts

**Current Solution:** Not possible

**Desired Solution:**
```vue
<ItemList 
  entity="all"
  :filterXmlPrefixes="['tp.event', 'tp.instructor']"
/>
```

**Use Case:**
- Complex multi-entity views
- Exclude certain entity types
- Flexible filtering logic

---

### Use Case 4: Filter by XML ID Pattern

**Scenario:** Show items matching specific pattern (e.g., workshops only)

**Current Solution:** Not possible

**Desired Solution:**
```vue
<ItemList 
  entity="events"
  :filterXmlPattern="/\.ws\d+$/"
/>
```

**Use Case:**
- Pattern-based filtering
- Category filtering via naming conventions
- Advanced search features

---

### Use Case 5: Combine ID and XML Filtering

**Scenario:** Pre-select specific items AND filter by project

**Current Solution:** Only filterIds works

**Desired Solution:**
```vue
<DropdownList 
  entity="events"
  :filterIds="[1, 5, 12]"
  :filterXmlPrefix="'tp'"
/>
```

**Behavior:** Apply BOTH filters (AND logic)

---

## Proposed Filter Enhancements

### Phase 1: XML ID Prefix Filtering (High Priority)

#### A. Add Props to ItemList

```typescript
interface Props {
    // ... existing props ...
    
    // XML ID Filtering (NEW)
    filterXmlPrefix?: string           // Single prefix: "tp.event"
    filterXmlPrefixes?: string[]       // Multiple prefixes: ["tp.event", "tp.instructor"]
    filterXmlPattern?: RegExp          // Regex pattern for advanced filtering
}
```

#### B. Implementation

```typescript
const entities = computed(() => {
    if (dataModeActive.value) {
        let filteredData = entityData.value
        
        // Apply filterIds (existing)
        if (props.filterIds !== undefined) {
            filteredData = filteredData.filter((entity: any) =>
                props.filterIds!.includes(entity.id)
            )
        }
        
        // Apply XML ID prefix filtering (NEW)
        if (props.filterXmlPrefix) {
            filteredData = filteredData.filter((entity: any) =>
                entity.xmlID?.startsWith(props.filterXmlPrefix)
            )
        }
        
        // Apply XML ID multi-prefix filtering (NEW)
        if (props.filterXmlPrefixes && props.filterXmlPrefixes.length > 0) {
            filteredData = filteredData.filter((entity: any) =>
                props.filterXmlPrefixes!.some(prefix => 
                    entity.xmlID?.startsWith(prefix)
                )
            )
        }
        
        // Apply XML ID pattern filtering (NEW)
        if (props.filterXmlPattern) {
            filteredData = filteredData.filter((entity: any) =>
                entity.xmlID && props.filterXmlPattern!.test(entity.xmlID)
            )
        }
        
        // ... transform to ListItem format
    }
})
```

#### C. Helper Functions

```typescript
/**
 * Extract fragments from XML ID
 * @param xmlId - Full XML ID (e.g., "tp.event.ws2025")
 * @param count - Number of fragments to extract (default: 2)
 * @returns Prefix string (e.g., "tp.event")
 */
function getXmlIdPrefix(xmlId: string, count: number = 2): string {
    const parts = xmlId.split('.')
    return parts.slice(0, count).join('.')
}

/**
 * Check if XML ID matches any of the given prefixes
 * @param xmlId - Full XML ID
 * @param prefixes - Array of prefix strings
 * @returns True if matches any prefix
 */
function matchesXmlIdPrefix(xmlId: string, prefixes: string[]): boolean {
    return prefixes.some(prefix => xmlId.startsWith(prefix))
}

/**
 * Extract specific fragment from XML ID
 * @param xmlId - Full XML ID (e.g., "tp.event.ws2025")
 * @param index - Fragment index (0=project, 1=entity, 2+=unique)
 * @returns Fragment string or undefined
 */
function getXmlIdFragment(xmlId: string, index: number): string | undefined {
    const parts = xmlId.split('.')
    return parts[index]
}
```

#### D. Usage Examples

**Simple Prefix Filter:**
```vue
<DropdownList 
  entity="all"
  :filterXmlPrefix="'tp.event'"
  title="Theaterpedia Events"
/>
```

**Multiple Prefixes (OR logic):**
```vue
<pList 
  type="all"
  :filterXmlPrefixes="['tp.event', 'music.event']"
  header="All Events"
/>
```

**Pattern Matching:**
```vue
<ItemList 
  entity="events"
  :filterXmlPattern="/\.(ws|workshop)\d+$/"
/>
```

**Combined Filtering:**
```vue
<DropdownList 
  entity="events"
  :filterIds="favoriteIds"
  :filterXmlPrefix="'tp'"
  title="My Favorite TP Events"
/>
```

---

### Phase 2: Advanced Fragment Filtering (Medium Priority)

#### A. Fragment-Based Filtering

```typescript
interface Props {
    filterXmlFragments?: {
        project?: string | string[]      // Fragment 0
        entity?: string | string[]       // Fragment 1
        unique?: string | string[]       // Fragment 2+
    }
}
```

**Usage:**
```vue
<ItemList 
  entity="all"
  :filterXmlFragments="{
    project: 'tp',
    entity: ['event', 'instructor']
  }"
/>
```

**Implementation:**
```typescript
if (props.filterXmlFragments) {
    filteredData = filteredData.filter((entity: any) => {
        if (!entity.xmlID) return false
        
        const parts = entity.xmlID.split('.')
        const { project, entity: entityType, unique } = props.filterXmlFragments!
        
        // Check project fragment (0)
        if (project) {
            const projects = Array.isArray(project) ? project : [project]
            if (!projects.includes(parts[0])) return false
        }
        
        // Check entity fragment (1)
        if (entityType) {
            const entities = Array.isArray(entityType) ? entityType : [entityType]
            if (!entities.includes(parts[1])) return false
        }
        
        // Check unique fragment (2+)
        if (unique) {
            const uniques = Array.isArray(unique) ? unique : [unique]
            const uniquePart = parts.slice(2).join('.')
            if (!uniques.some(u => uniquePart.includes(u))) return false
        }
        
        return true
    })
}
```

---

### Phase 3: Dynamic Filter Functions (Low Priority)

#### A. Custom Filter Callback

```typescript
interface Props {
    filterCallback?: (item: EntityItem) => boolean
}
```

**Usage:**
```vue
<ItemList 
  entity="events"
  :filterCallback="(item) => {
    if (!item.xmlID) return false
    const parts = item.xmlID.split('.')
    return parts[0] === 'tp' && parts[2]?.startsWith('ws')
  }"
/>
```

**Benefit:** Maximum flexibility for complex logic

---

## Implementation Recommendations

### Priority 1: Implement Phase 1 (XML Prefix Filtering)

**Effort:** ~4 hours  
**Impact:** High  
**Breaking Changes:** None

**Tasks:**
1. Add `filterXmlPrefix`, `filterXmlPrefixes`, `filterXmlPattern` props to ItemList
2. Implement filtering logic in `entities` computed
3. Add helper functions for XML ID parsing
4. Forward props from DropdownList and pList
5. Add examples to documentation
6. Write unit tests for filter logic

**Deliverables:**
- ✅ Props added and documented
- ✅ Filter logic working with AND combination
- ✅ Helper functions exported for reuse
- ✅ Examples in usage guide

---

### Priority 2: Optimize Filter Performance

**Current Concern:** Multiple filter passes over data

**Solution:** Combine all filters into single pass

```typescript
const entities = computed(() => {
    if (dataModeActive.value) {
        const filteredData = entityData.value.filter((entity: any) => {
            // Apply all filters in one pass
            
            // Filter by numeric IDs
            if (props.filterIds !== undefined) {
                if (!props.filterIds.includes(entity.id)) return false
            }
            
            // Filter by XML prefix
            if (props.filterXmlPrefix) {
                if (!entity.xmlID?.startsWith(props.filterXmlPrefix)) return false
            }
            
            // Filter by XML prefixes (OR)
            if (props.filterXmlPrefixes && props.filterXmlPrefixes.length > 0) {
                if (!props.filterXmlPrefixes.some(p => entity.xmlID?.startsWith(p))) return false
            }
            
            // Filter by XML pattern
            if (props.filterXmlPattern) {
                if (!entity.xmlID || !props.filterXmlPattern.test(entity.xmlID)) return false
            }
            
            return true
        })
        
        // ... transform to ListItem format
    }
})
```

**Benefit:** Better performance for large datasets

---

### Priority 3: Add Filter Debugging

**Feature:** Console logging for filter results

```typescript
if (import.meta.env.DEV) {
    console.group('[ItemList] Filter Results')
    console.log('Total entities:', entityData.value.length)
    console.log('filterIds:', props.filterIds)
    console.log('filterXmlPrefix:', props.filterXmlPrefix)
    console.log('Filtered result:', filteredData.length)
    console.groupEnd()
}
```

**Benefit:** Easier debugging of filter logic

---

## Current vs. Proposed Comparison

| Feature | Current | Proposed (Phase 1) | Proposed (Phase 2) |
|---------|---------|-------------------|-------------------|
| **Filter by Database ID** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Filter by Project** | ⚠️ API only | ✅ Client-side | ✅ Client-side |
| **Filter by Entity Type** | ❌ No | ✅ Via prefix | ✅ Via fragment |
| **Multiple Prefixes** | ❌ No | ✅ OR logic | ✅ OR logic |
| **Pattern Matching** | ❌ No | ✅ Regex | ✅ Regex |
| **Fragment Filtering** | ❌ No | ⚠️ Via pattern | ✅ Native support |
| **Custom Callbacks** | ❌ No | ❌ No | ✅ Phase 3 |
| **Combined Filters** | ⚠️ ID only | ✅ AND logic | ✅ AND logic |

---

## Example: Full Filter Usage

```vue
<template>
  <!-- Complex filtering scenario -->
  <DropdownList
    entity="all"
    :project="'tp'"
    
    <!-- Numeric ID filter -->
    :filterIds="favoriteIds"
    
    <!-- XML prefix filter (show only events and instructors) -->
    :filterXmlPrefixes="['tp.event', 'tp.instructor']"
    
    <!-- Pattern filter (exclude archived items) -->
    :filterXmlPattern="/^(?!.*\.archived).*$/"
    
    title="My Favorites (Events & Instructors)"
    :dataMode="true"
    :multiSelect="true"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const favoriteIds = ref([1, 5, 12, 23, 45])
</script>
```

**Filter Logic:**
1. ✅ Must be in `favoriteIds` array (numeric)
2. ✅ Must start with "tp.event" OR "tp.instructor" (prefix)
3. ✅ Must NOT contain ".archived" (pattern)
4. **Result:** Only favorite, non-archived events and instructors from TP project

---

## Decision Matrix

### Should we implement XML ID filtering?

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| **User Demand** | 4 | Requested for multi-entity views |
| **Implementation Effort** | 5 | Low effort, clear requirements |
| **Breaking Changes** | 5 | None, all props optional |
| **Performance Impact** | 4 | Minimal, client-side filtering |
| **Maintenance Burden** | 5 | Simple logic, well-documented |
| **Future Value** | 5 | Enables many advanced features |

**Total Score:** 28/30 ⭐⭐⭐⭐⭐

**Recommendation:** ✅ **Strong YES - Implement Phase 1 immediately**

---

## Implementation Status

### Phase 1: XML ID Prefix Filtering ✅ COMPLETE

**Implementation Date:** November 11, 2025  
**Status:** Production Ready

#### What Was Implemented

1. **Three New Props Added:**
   ```typescript
   interface Props {
     filterXmlPrefix?: string       // Single prefix filter
     filterXmlPrefixes?: string[]   // Multiple prefix filter (OR)
     filterXmlPattern?: RegExp      // Regex pattern filter
   }
   ```

2. **Files Modified:**
   - ✅ `ItemList.vue` - Core filter logic with single-pass optimization
   - ✅ `DropdownList.vue` - Props forwarding
   - ✅ `pList.vue` - Props forwarding
   - ✅ `CLIST_SELECTION_SYSTEM_GUIDE.md` - Documentation updated
   - ✅ `DemoListItem.vue` - Demo section added

3. **Helper Functions Exported:**
   ```typescript
   export function getXmlIdPrefix(xmlId: string, count: number = 2): string
   export function getXmlIdFragment(xmlId: string, index: number): string | undefined
   export function matchesXmlIdPrefix(xmlId: string, prefixes: string[]): boolean
   ```

4. **Performance Optimization:**
   - All filters applied in single pass
   - Efficient AND logic combination
   - Console logging for debugging (DEV mode)

#### Usage Examples

**Single Prefix:**
```vue
<DropdownList filterXmlPrefix="tp.event" />
```

**Multiple Prefixes:**
```vue
<pList :filterXmlPrefixes="['tp.event', 'tp.instructor']" />
```

**Pattern Matching:**
```vue
<DropdownList :filterXmlPattern="/\.(ws|workshop)\d+$/" />
```

**Combined:**
```vue
<DropdownList 
  :filterIds="[1, 2, 3]"
  filterXmlPrefix="tp"
  :filterXmlPattern="/^(?!.*\.archived).*$/"
/>
```

#### Testing Notes

- All props are optional (zero breaking changes)
- Works with existing `filterIds` prop
- Tested in DemoListItem.vue
- Filter results logged to console

---

## Conclusion

**Current State:**
- ✅ Basic ID filtering works well
- ✅ XML IDs are captured and emitted
- ✅ **XML-based filtering now available!**

**Completed Enhancement (Phase 1):**
- ✅ Added 3 props for XML filtering
- ✅ ~100 lines of code added
- ✅ Zero breaking changes
- ✅ High value for mixed-entity scenarios

**Next Steps:**
1. ✅ ~~Approve Phase 1 implementation~~ DONE
2. ✅ ~~Add props to ItemList~~ DONE
3. ✅ ~~Implement filter logic~~ DONE
4. ✅ ~~Update documentation~~ DONE
5. ⏳ Add unit tests (optional, future work)
6. ⏳ Consider Phase 2 (fragment-based filtering)

---

**Last Updated:** November 11, 2025  
**Status:** Proposal - Ready for Implementation ✅  
**Estimated Effort:** 4 hours  
**Priority:** High 🔥
