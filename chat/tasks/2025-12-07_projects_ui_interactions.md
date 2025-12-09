# Projects UI Interactions Report
**Date:** 2025-12-07 (created Dec 5 evening)  
**Scope:** Stepper, Dashboard, ProjectMain, ProjectSite interactions

---

## Executive Summary

After analyzing `ProjectMain.vue`, `ProjectStepper.vue`, and `ProjectSite.vue`, I identified **5 unclear interaction areas** and **3 missing connections** that need clarification before the Tuesday practitioner presentation.

---

## 1. Current UI Architecture

### 1.1 Two Main Entry Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROJECT UI ENTRY POINTS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /sites/:domaincode         →  ProjectSite.vue (PUBLIC homepage)        │
│    └─ Read-only display of project content                              │
│    └─ Events, Posts, Team sections                                      │
│    └─ Edit button for authenticated owners                              │
│                                                                         │
│  /project/:projectId        →  ProjectMain.vue (EDITOR interface)       │
│    └─ Stepper OR Navigation based on status                             │
│    └─ Full editing capabilities                                         │
│    └─ Config dropdown (currently hidden/disabled)                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Status-Based Layout Switching

```typescript
// ProjectMain.vue line 296-300
const isStepper = computed(() => {
    if (projectStatus.value === null) return true
    return projectStatus.value === STATUS_NEW || projectStatus.value === STATUS_DEMO
})
```

| Status | Value | Layout | Access |
|--------|-------|--------|--------|
| NEW | 1 | Stepper | p_owner only |
| DEMO | 8 | Stepper | p_owner + preview |
| DRAFT | 64 | Dashboard/Navigation | Team edit |
| CONFIRMED | 512 | Dashboard | Limited edit |
| RELEASED | 4096 | Dashboard | Read-heavy |
| ARCHIVED | 32768 | Dashboard | Read-only |

---

## 2. Unclear Interaction Areas ⚠️

### 2.1 Stepper → Dashboard Transition Trigger

**Current behavior:** `handleActivateProject()` in ProjectMain.vue
```typescript
// ProjectMain.vue line 378-399
async function handleActivateProject() {
    const response = await fetch(`/api/projects/${projectId.value}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: STATUS_DRAFT })
    })
    // ...switches to navigation mode
}
```

**Unclear:**
- ❓ Should this use the new `/api/projects/[id]/activate.patch` endpoint instead?
- ❓ What activation criteria must be met before allowing transition?
- ❓ Should there be a confirmation dialog showing TransitionSummary?

**Recommendation:**
```typescript
// Use the proper activate endpoint with criteria validation
async function handleActivateProject(targetStatus: number) {
    // Show TransitionSummary in modal first
    // Then call: PATCH /api/projects/:id/activate { status: targetStatus }
}
```

### 2.2 Step Navigation vs Tab Navigation Disconnect

**Stepper mode:** Uses numeric `currentStep` (0-6)
```typescript
// ProjectMain.vue
const currentStep = ref(0)
const currentStepKey = computed(() => stepKeys.value[currentStep.value])
```

**Navigation mode:** Uses string `currentNavTab`
```typescript
// ProjectMain.vue
const currentNavTab = ref('events')
```

**Unclear:**
- ❓ When switching from Stepper to Dashboard, which tab should be active?
- ❓ Current code sets `currentNavTab = 'homepage'` - is this always correct?
- ❓ Should the last stepper step inform the initial dashboard tab?

**Current behavior (line 392-393):**
```typescript
// Reset to first navigation tab
currentNavTab.value = 'homepage'
```

### 2.3 Owner Detection Inconsistency

**ProjectMain.vue uses `_userRole` from API:**
```typescript
// ProjectMain.vue line 304-306
const isProjectOwner = computed(() => {
    return projectData.value?._userRole === 'owner'
})
```

**ProjectSite.vue uses different check:**
```typescript
// ProjectSite.vue (assumed - need to verify)
// May use owner_id comparison or different API field
```

**Unclear:**
- ❓ Is `_userRole` populated consistently by all endpoints?
- ❓ Should we use `useProjectActivation.isPOwner` instead?
- ❓ What about `p_creator` permissions in the UI?

**Recommendation:** Use the centralized `useProjectActivation` composable everywhere:
```typescript
const { isPOwner, isPCreator, userRelation } = useProjectActivation(projectId)
```

### 2.4 Config Dropdown Status (Hidden but Present)

**Current state:** Config dropdown is `display: none` and `disabled`
```vue
<!-- ProjectMain.vue line ~45 -->
<div class="navbar-item config-dropdown-wrapper" ref="configDropdownRef" style="display: none;">
    <button class="config-toggle-btn" ... disabled>
```

**Contains:**
- Release selection
- Open tasks filter
- Coworker management
- Domain/logo/title settings

**Unclear:**
- ❓ When should this be enabled?
- ❓ Should it only appear for p_owner?
- ❓ Does it duplicate functionality in ThemeConfigPanel/LayoutConfigPanel?

**Recommendation:** Either:
1. Remove completely if redundant, OR
2. Enable for p_owner in DRAFT+ states with clear scope

### 2.5 ProjectSite Edit Flow

**Current:** Edit button in ProjectSite opens EditPanel
```vue
<!-- ProjectSite.vue line ~6-7 -->
<EditPanel v-if="project" :is-open="isEditPanelOpen" ... />
<EditPanelButton :is-owner="isProjectOwner" @open="openEditPanel" />
```

**Unclear:**
- ❓ What can be edited in EditPanel vs ProjectMain?
- ❓ Should EditPanel link to ProjectMain for full editing?
- ❓ How does inline editing in ProjectSite interact with step-based editing?

---

## 3. Missing Connections 🔴

### 3.1 No Link from ProjectSite to ProjectMain

**Current:** ProjectMain has "Homepage" link to ProjectSite
```vue
<!-- ProjectMain.vue line ~30 -->
<RouterLink :to="`/sites/${projectId}`" class="navbar-button homepage-link">
```

**Missing:** ProjectSite has no obvious link to ProjectMain editor
- The EditPanelButton opens a panel, not the full editor
- p_owner should have quick access to ProjectMain

**Fix needed:**
```vue
<!-- Add to ProjectSite navbar or EditPanel -->
<RouterLink v-if="isProjectOwner" :to="`/project/${project.domaincode}`">
    Full Editor
</RouterLink>
```

### 3.2 No Activation Criteria Display in Stepper

**Current:** ProjectStepper has activate button but no criteria checks
```vue
<!-- ProjectStepper.vue line ~56-65 -->
<div v-if="isActivateStep" class="activate-section">
    <button class="btn-activate" @click="handleActivateProject">
        Projekt aktivieren
    </button>
</div>
```

**Missing:** 
- No display of activation rules (cover image, events, etc.)
- No indication of which criteria are met/unmet
- Should use `useProjectActivation.activationStatus`

**Fix needed:**
```vue
<!-- In ProjectStepper or ProjectStepActivate -->
<ActivationCriteria 
    :rules="activationRules"
    :status="activationStatus"
    :can-activate="canActivate"
/>
```

### 3.3 No Workflow State Visualization

**Current:** Neither Stepper nor Dashboard shows workflow timeline

**Missing:** Integration of `StateFlowTimeline.vue` component

**Recommended placement:**
1. **ProjectStepper:** Show mini timeline at top showing NEW → DEMO → DRAFT progression
2. **ProjectMain Navigation mode:** Show full timeline in sidebar or header
3. **ProjectActivationPanel:** Show as part of transition confirmation

---

## 4. Interaction Flow Diagrams

### 4.1 New Project Creation Flow

```
User creates project
        │
        ▼
┌───────────────────┐
│ status = NEW (1)  │
│ Layout: Stepper   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ Step 1: Events (or Posts for topic)   │
│ Step 2: Posts                         │
│ Step 3: Images                        │
│ Step 4: Users (owner only)            │
│ Step 5: Theme (owner only)            │
│ Step 6: Pages                         │
│ Step 7: Activate (owner only)         │
└─────────┬─────────────────────────────┘
          │
          ▼ [Click "Projekt aktivieren"]
          │
    ┌─────┴─────┐
    │ Criteria  │
    │   met?    │
    └─────┬─────┘
     yes  │  no
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐  ┌──────────────┐
│ DEMO(8) │  │ Show missing │
│   or    │  │   criteria   │
│DRAFT(64)│  └──────────────┘
└────┬────┘
     │
     ▼
┌────────────────────┐
│ Layout: Dashboard  │
│ (if status >= 64)  │
└────────────────────┘
```

### 4.2 Edit Flow from Public Site

```
Visitor arrives at /sites/theaterpedia
        │
        ▼
┌───────────────────────────┐
│ ProjectSite.vue           │
│ - Public view of project  │
│ - Events, Posts, Team     │
└─────────┬─────────────────┘
          │
          │ [User is authenticated + is owner?]
          │
    ┌─────┴─────┐
    │           │
    no          yes
    │           │
    ▼           ▼
┌─────────┐  ┌──────────────────────┐
│ View    │  │ Show EditPanelButton │
│ only    │  └─────────┬────────────┘
└─────────┘            │
                       ▼ [Click Edit]
               ┌───────────────────┐
               │ EditPanel opens   │
               │ - Quick edits     │
               │ - Title, teaser   │
               └─────────┬─────────┘
                         │
                         │ [Need full editor?]
                         │
                         ▼ ← MISSING LINK
               ┌───────────────────┐
               │ Navigate to       │
               │ /project/:id      │
               │ (ProjectMain)     │
               └───────────────────┘
```

---

## 5. Component Responsibility Matrix

| Component | View | Edit | Transition | Config |
|-----------|------|------|------------|--------|
| ProjectSite | ✅ Public | ⚠️ Panel only | ❌ | ❌ |
| ProjectMain | ❌ | ✅ Full | ⚠️ Basic | ⚠️ Hidden |
| ProjectStepper | ❌ | ❌ | ✅ NEW→DEMO→DRAFT | ❌ |
| ProjectNavigation | ❌ | ❌ | ❌ | ❌ |
| ProjectActivationPanel | ❌ | ❌ | ✅ All states | ❌ |
| ProjectWorkflowWrapper | ❌ | ⚠️ Slot | ✅ Context | ❌ |

---

## 6. Priority Fixes for Tuesday Presentation

| Priority | Issue | Component | Effort |
|----------|-------|-----------|--------|
| 1 | Add link from ProjectSite to ProjectMain | ProjectSite | 15 min |
| 2 | Show activation criteria in Stepper | ProjectStepActivate | 30 min |
| 3 | Integrate StateFlowTimeline | ProjectMain | 20 min |
| 4 | Use useProjectActivation consistently | All | 45 min |
| 5 | Decide on Config dropdown fate | ProjectMain | 15 min |

---

## 7. Questions for Monday Discussion

1. **Activation flow:** Should DEMO be skippable by default for small teams (≤3)?
2. **Edit scopes:** What can EditPanel edit vs full ProjectMain?
3. **Config dropdown:** Keep, remove, or merge into existing panels?
4. **Navigation after activation:** Always go to 'homepage' tab?
5. **p_creator permissions:** What can they do in Stepper mode?

---

## 8. Conclusion

The UI has a solid foundation with clear status-based layout switching. The main gaps are:

1. **Missing bidirectional navigation** between ProjectSite ↔ ProjectMain
2. **No activation criteria visualization** before transition
3. **Inconsistent owner detection** across components
4. **Orphaned config dropdown** that needs decision

For Tuesday's presentation, focus on showing the Stepper → Dashboard transition working smoothly, with visible feedback about project state changes.
