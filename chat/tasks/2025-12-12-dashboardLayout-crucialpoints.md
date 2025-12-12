# DashboardLayout.vue - Crucial Points Analysis

**Date:** December 12, 2025  
**Sprint:** v0.4 → v0.5 Transition  
**Purpose:** Identify decomposition points, composables, and refactoring priorities

---

## Executive Summary

The `DashboardLayout.vue` (513 lines) is a monolithic orchestration component that needs strategic decomposition to support:
1. **sysreg_config-driven capabilities** (replacing hardcoded role/status checks)
2. **Events workflow integration** (demo → draft → confirmed → released)
3. **Cross-project entity browsing** (clist autonomy)
4. **Odoo data integration** (xmlid-based references)

---

## Current Architecture Overview

```
DashboardLayout.vue
├── ListHead (5 NavStops: HOME | AGENDA | TOPICS | PARTNERS | COG)
├── FilterChip[] (active filters)
├── dashboard-content
│   ├── home-view (pList × 2: events, posts)
│   ├── entity-view (2-column: list + browser)
│   │   ├── entity-list-column (pList)
│   │   └── entity-browser-column (EntityBrowser)
│   └── settings-view (ProjectSettingsPanel)
└── CollapsibleTabs (legacy, hidden)
```

---

## Crucial Point #1: NavStop ↔ Entity Mapping

**Current State:**
```typescript
const navStopEntityMap: Record<string, 'events' | 'posts' | 'partners'> = {
    'agenda': 'events',
    'topics': 'posts',
    'partners': 'partners'
}
```

**Problem:** Hardcoded 1:1 mapping. Agenda should contain more than events (tasks, milestones, sessions).

**Decomposition Target:**
```typescript
// useNavStopConfig.ts
interface NavStopConfig {
    id: string
    label: string
    entities: EntityConfig[]
    queryParams?: Record<string, any>
    sysregFilter?: number  // capability bitmask filter
}

interface EntityConfig {
    type: 'events' | 'posts' | 'partners' | 'images' | 'sessions' | 'tasks'
    listProps?: Partial<pListProps>
    browserComponent?: Component
}
```

**Priority:** HIGH - Blocks events workflow expansion

---

## Crucial Point #2: Entity Selection State

**Current State:**
```typescript
const selectedEntity = ref<any>(null)
```

**Problem:** Untyped, no entity-type awareness, no sysreg integration.

**Decomposition Target:**
```typescript
// useEntitySelection.ts
interface SelectedEntity {
    id: number
    type: 'post' | 'event' | 'image' | 'partner'
    xmlid: string
    status: number
    capabilities: number  // computed from sysreg_config
    transitions: TransitionAction[]  // available status transitions
    projectId: number
    isOwnProject: boolean
}

const useEntitySelection = (projectId: Ref<number>) => {
    const selected = ref<SelectedEntity | null>(null)
    const capabilityMask = computed(() => /* merge entity.capabilities with user role */)
    const canUpdate = computed(() => capabilityMask.value & CAP_UPDATE)
    const canManage = computed(() => capabilityMask.value & CAP_MANAGE)
    // ...
}
```

**Priority:** HIGH - Core to sysreg integration

---

## Crucial Point #3: Props Cascade to Children

**Current Props:**
```typescript
props: {
    projectId, projectName, initialSection, defaultTabsCollapsed, alpha,
    listHeadMode, showOverline, showLegacyTabs, isOwner, isLocked, showActivation
}
```

**Problem:** `isOwner`, `isLocked` are capability-related and should come from sysreg.

**Decomposition Target:**
```typescript
// useDashboardCapabilities.ts
const useDashboardCapabilities = (projectId: Ref<number>) => {
    const projectCaps = useProjectCapabilities(projectId)
    
    return {
        canManageProject: computed(() => projectCaps.has('project_all_manage_P_owner')),
        canViewSettings: computed(() => projectCaps.has('manage')),
        isLocked: computed(() => !projectCaps.has('update')),
        showActivation: computed(() => projectCaps.hasTransition('demo', 'draft')),
        visibleNavStops: computed(() => filterByCapabilities(NAV_STOPS, projectCaps))
    }
}
```

**Priority:** MEDIUM - Refactoring existing props

---

## Crucial Point #4: EntityBrowser Integration

**Current:** EntityBrowser receives raw entity object.

**Missing:**
- sysreg capability context
- Transition actions (status changes)
- PostIT integration
- Edit mode control

**Decomposition Target:**
```vue
<!-- EntityBrowser.vue enhanced -->
<template>
    <div class="entity-browser">
        <EntityHeader :entity="entity" :capabilities="caps" />
        <StatusEditor v-if="caps.canManage" :entity="entity" @transition="handleTransition" />
        <EntityContent :entity="entity" :editMode="caps.canUpdate" />
        <PostITSidebar v-if="showComments" :entityType="entityType" :entityId="entity.id" />
        <TagFamilies :rtags="entity.rtags" :ttags="entity.ttags" :enable-edit="caps.canUpdate" />
    </div>
</template>
```

**Priority:** HIGH - Central to the main-panel concept

---

## Crucial Point #5: Home View Composition

**Current:** Hardcoded 2 sections (events, posts).

**Problem:** No capability filtering, no project-type awareness.

**Decomposition Target:**
```typescript
// useHomeViewConfig.ts
const useHomeViewConfig = (projectType: Ref<number>, projectCaps: Ref<number>) => {
    const sections = computed(() => {
        const base = [
            { entity: 'events', title: 'Neueste Events', filter: { statusGt: STATUS.DEMO } },
            { entity: 'posts', title: 'Neueste Posts', filter: { statusGt: STATUS.DEMO } }
        ]
        
        // Add sections based on project type
        if (projectType.value === PROJECT_TYPE.TOPIC) {
            base.push({ entity: 'partners', title: 'Partner', filter: {} })
        }
        
        // Filter by capabilities
        return base.filter(s => projectCaps.value & ENTITY_READ_CAPS[s.entity])
    })
    
    return { sections }
}
```

**Priority:** LOW - Enhancement

---

## Crucial Point #6: Route Integration

**Current:**
```typescript
watch(() => props.initialSection, (newVal) => {
    if (newVal && newVal !== activeNavStop.value) {
        activeNavStop.value = newVal
        // ...
    }
})
```

**Problem:** One-way sync, no deep linking to entity selection.

**Decomposition Target:**
```typescript
// useDashboardRouting.ts
const useDashboardRouting = () => {
    const route = useRoute()
    const router = useRouter()
    
    const navStop = computed({
        get: () => route.params.section as string || 'home',
        set: (val) => router.push({ params: { section: val } })
    })
    
    const entityId = computed({
        get: () => route.query.entity as string | undefined,
        set: (val) => router.push({ query: { ...route.query, entity: val } })
    })
    
    return { navStop, entityId }
}
```

**Priority:** MEDIUM - UX improvement

---

## Proposed Component Decomposition

### New Components to Extract

| Component | Lines | Source | Responsibility |
|-----------|-------|--------|----------------|
| `NavStopProvider.vue` | ~50 | DashboardLayout | NavStop state + context |
| `EntityListPanel.vue` | ~80 | entity-list-column | List wrapper with header |
| `EntityBrowserPanel.vue` | ~100 | entity-browser-column | Browser wrapper + empty state |
| `HomeViewPanel.vue` | ~60 | home-view | Dynamic section rendering |
| `SettingsPanel.vue` | exists | settings-view | Already extracted |

### New Composables to Create

| Composable | Purpose | Priority |
|------------|---------|----------|
| `useNavStopConfig` | NavStop ↔ Entity mapping | HIGH |
| `useEntitySelection` | Selected entity + capabilities | HIGH |
| `useDashboardCapabilities` | Project-level caps | HIGH |
| `useDashboardRouting` | Route ↔ State sync | MEDIUM |
| `useHomeViewConfig` | Dynamic home sections | LOW |

---

## Refactoring Priority Matrix

### Phase 1: sysreg Integration (v0.5 Core)

1. **Create `useDashboardCapabilities`** - Replace hardcoded `isOwner`, `isLocked`
2. **Create `useEntitySelection`** - Add capability context to selected entity
3. **Integrate StatusEditor** - Into EntityBrowser for transitions

### Phase 2: Events Workflow (v0.5 Beta)

4. **Expand NavStop mapping** - AGENDA → [events, sessions, tasks]
5. **Add transition UI** - Primary/alternative buttons per sysreg_config
6. **Implement EntityBrowserPanel** - Full browser with all integrations

### Phase 3: Polish (v0.5 → 1.0)

7. **Route integration** - Deep linking
8. **HomeView dynamic** - Project-type aware sections
9. **Cross-project browsing** - clist autonomy for related projects

---

## sysreg_config Integration Points

### Required New Entries for Dashboard

| Entry Name | Purpose | Bits |
|------------|---------|------|
| `dashboard_view_agenda` | Can see AGENDA navstop | entity=project, cap=list |
| `dashboard_view_topics` | Can see TOPICS navstop | entity=project, cap=list |
| `dashboard_view_partners` | Can see PARTNERS navstop | entity=project, cap=list |
| `dashboard_view_settings` | Can see COG navstop | entity=project, cap=manage |

### Existing Entries to Leverage

From current sysreg_config (22 entries):
- `project_all_manage_P_owner` → `canViewSettings`
- `project_draft_update_member` → `!isLocked`
- `event_*` entries → AGENDA entity filtering
- `post_*` entries → TOPICS entity filtering

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing stepper flow | HIGH | Keep alpha mode separate, test thoroughly |
| Performance with sysreg queries | MEDIUM | Cache capabilities per session |
| Route state conflicts | LOW | Use composable for single source of truth |
| EntityBrowser bloat | MEDIUM | Extract sub-components early |

---

## Next Steps

1. [ ] Create `useDashboardCapabilities.ts` stub
2. [ ] Create `useEntitySelection.ts` with sysreg integration
3. [ ] Add capability props to EntityBrowser
4. [ ] Test StatusEditor integration in browser panel
5. [ ] Expand navStopEntityMap for AGENDA multi-entity

---

*Generated: December 12, 2025*
