# Dataflow Consultation Report
**Date:** 2025-12-07 (created Dec 5 evening)  
**Scope:** Database → Endpoints → Composables → Components

---

## Executive Summary

After analyzing the Phase 1+2 implementation, I identified **3 complete dataflows** and **4 areas with gaps** that need attention before Monday's debugging session.

---

## 1. Complete Dataflows ✅

### 1.1 Project Activation Flow
```
Database              → Endpoint                  → Composable              → Component
─────────────────────────────────────────────────────────────────────────────────────────
projects.status_id    → /api/projects/[id]        → useProjectActivation    → ProjectActivationPanel
projects.owner_id     → /api/projects/[id]/activate → (computed: isPOwner)  → ProjectWorkflowWrapper
project_members       →                           → (computed: userRelation)→
  .configrole         →                           →                          →
```
**Status:** ✅ Complete - tested and committed

### 1.2 Capabilities Configuration Flow
```
Database              → Endpoint                  → Composable              → Component
─────────────────────────────────────────────────────────────────────────────────────────
sysreg_config.value   → /api/sysreg/capabilities  → useCapabilities         → CapabilitiesEditor
  (bit 0-31 packed)   → /api/sysreg/config        →                         → (now includes bit 30-31)
```
**Status:** ✅ Complete - bit 30 (owner) and bit 31 (admin) just added

### 1.3 User Authentication Flow
```
Database              → Endpoint                  → Composable              → Component
─────────────────────────────────────────────────────────────────────────────────────────
users.sysmail         → /api/auth/login           → useAuth (stores)        → LoginView
users.password_hash   → /api/auth/logout          →                         → Header/Navigation
sessions (in-memory)  →                           →                         →
```
**Status:** ✅ Complete

---

## 2. Gaps Requiring Attention ⚠️

### 2.1 Comments System (NEW - needs wiring)

**Database:** ✅ Migration 057 created
```sql
comments (id, entity_type, entity_id, project_id, parent_id, author_id, content, is_pinned)
comment_reactions (id, comment_id, user_id, emoji)
```

**Endpoints:** ✅ Created but untested
- `GET /api/comments` - list by entity
- `POST /api/comments` - create
- `PATCH /api/comments/[id]` - update
- `DELETE /api/comments/[id]` - delete

**Composable:** ✅ `usePostITComments` created

**Components:** ✅ All 6 created
- PostITNote, PostITBoard, PostITComposer, PostITThread, PostITSidebar, MobileCommentsSheet

**GAP:** 🔴 **No integration point yet**
- Components exist but aren't wired into any view
- Need to add PostITSidebar to ProjectDashboard or DetailViews
- Comments endpoints need to be called from usePostITComments

**Fix needed:**
1. Wire `usePostITComments` to call actual endpoints
2. Add PostITSidebar to a view (e.g., ProjectDashboard)

### 2.2 Transition Summary (NEW - partial)

**Database:** Uses existing `sysreg_config` + computed logic

**Endpoint:** ✅ `GET /api/sysreg/transition-summary` created

**Composable:** ✅ `useTransitionSummary` created

**Component:** ✅ `TransitionSummary.vue` created

**GAP:** 🟡 **Not yet integrated**
- TransitionSummary component needs to be added to ProjectActivationPanel
- Currently shows placeholder data, not live API data

**Fix needed:**
1. Import TransitionSummary into ProjectActivationPanel
2. Show when expanding a transition option

### 2.3 Workflow Timeline (NEW - mock data)

**Endpoint:** ❌ Missing dedicated endpoint

**Composable:** Relies on `useProjectActivation` status data

**Component:** ✅ `StateFlowTimeline.vue` created

**GAP:** 🟡 **Uses mock state list**
- Component hardcodes states instead of fetching from sysreg

**Fix needed:**
1. Create `/api/sysreg/workflow-states` endpoint OR
2. Use existing sysreg_config data to derive states

### 2.4 Role-Based Permission Tooltips (NEW - not wired)

**Composable:** ✅ `usePermissionTooltip` created with CAPABILITY_EXPLANATIONS

**Component:** ✅ `RoleBadge.vue` created

**GAP:** 🟡 **Not integrated into UI**
- RoleBadge isn't used anywhere yet
- Permission tooltips need hover trigger integration

**Fix needed:**
1. Add RoleBadge to team member displays
2. Wire tooltip triggers in TransitionSummary

---

## 3. Data Schema Summary

### Current Tables (relevant to workflow)
```
projects
├── id, domaincode, title, description
├── status_id (integer: 1,8,64,512,4096,32768,65536)
├── owner_id, owner_sysmail
├── type ('project','regio','special','topic')
└── created_at, updated_at

project_members
├── project_id, user_id
├── role (text: legacy)
├── configrole (integer: 2=partner, 4=participant, 8=member, 16=creator)
└── joined_at

users
├── id, sysmail, display_name
├── password_hash, is_active
└── created_at

sysreg_config
├── id, name, description
├── value (integer: packed bits)
├── tagfamily, taglogic
└── is_default, parent_bit

comments (NEW - migration 057)
├── id, entity_type, entity_id
├── project_id, parent_id
├── author_id, content
├── is_pinned
└── created_at, updated_at

comment_reactions (NEW - migration 057)
├── id, comment_id, user_id
├── emoji
└── created_at
```

---

## 4. Bit Layout Reference

```
Bits 0-2:   Project Type (project, regio, topic, etc.)
Bits 3-7:   Entity Type (project, user, post, event, image, location)
Bits 8-10:  State (NEW, DEMO, DRAFT, CONFIRMED, RELEASED, ARCHIVED, TRASH)
Bits 11-14: Read capability levels
Bits 15-18: Update capability levels
Bits 19-22: Transition (to_state) levels
Bit 23:     List capability
Bit 24:     Share capability
Bit 25:     Role: anonym
Bit 26:     Role: partner
Bit 27:     Role: participant
Bit 28:     Role: member
Bit 29:     Role: creator (p_creator)
Bit 30:     Role: owner (p_owner) ← NEW
Bit 31:     Role: admin (system-wide) ← NEW (sign bit)
```

---

## 5. Priority Fixes for Monday

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | Wire usePostITComments to API | 30 min | Comments become functional |
| 2 | Add TransitionSummary to Panel | 15 min | Users see transition effects |
| 3 | Integrate PostITSidebar in view | 20 min | Comments visible in UI |
| 4 | Add RoleBadge to member lists | 15 min | Visual role indicators |

---

## 6. Dataflow Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  projects    project_members    sysreg_config    comments    users      │
└──────┬──────────────┬──────────────────┬─────────────┬──────────┬───────┘
       │              │                  │             │          │
       ▼              ▼                  ▼             ▼          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ENDPOINTS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  /projects/[id]        /sysreg/capabilities       /comments              │
│  /projects/[id]/activate   /sysreg/transition-summary                    │
└──────┬──────────────────────────────┬─────────────────────┬─────────────┘
       │                              │                     │
       ▼                              ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           COMPOSABLES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  useProjectActivation    useCapabilities    usePostITComments           │
│  useTransitionSummary    usePermissionTooltip   useResponsive           │
└──────┬──────────────────────────────┬─────────────────────┬─────────────┘
       │                              │                     │
       ▼                              ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           COMPONENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ProjectActivationPanel    CapabilitiesEditor    PostITSidebar          │
│  ProjectWorkflowWrapper    StateFlowTimeline     MobileCommentsSheet    │
│  TransitionSummary         RoleBadge             PostITBoard            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Conclusion

The **core activation workflow is complete** and tested. The **comments system** has all components built but needs **wiring** (composable → API calls). The **UI components** (Timeline, TransitionSummary, RoleBadge) are built but need **integration** into views.

**Monday debugging priority:** Focus on the 4 wiring tasks listed above. All pieces exist; they just need connection.
