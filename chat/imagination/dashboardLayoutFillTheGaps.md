# DashboardLayout: Fill The Gaps
## 6 Ideas for Component Integration

**Date:** December 12, 2025  
**Context:** v0.5 Sprint Planning - Events Workflow Implementation  
**Focus:** Bringing together 5 existing component groups into DashboardLayout

---

## The 5 Component Groups

1. **StatusEditor.vue** - Workflow transitions, scope toggles, sysreg-driven
2. **PostIT System** - Comments, threads, reactions (PostITBoard, PostITNote, PostITComposer)
3. **TagFamilies** - Bitmasked tag display/editing (TagFamilyTile, TagGroupEditor)
4. **clist Group** - Autonomous query components (pGallery, pList, ItemGallery, ItemRow, ItemTile)
5. **EditPanel.vue** - Dual-use editor (main-panel + Drawer mode via BasePanel)

---

## Idea #1: The "Entity Control Strip"

### Concept
A horizontal strip component that combines StatusEditor + TagFamilies into a unified entity header, appearing at the top of EntityBrowser.

### German Interaction Wording
- **"Status & Sichtbarkeit"** - Section label
- **"Aktueller Status"** - Current status badge
- **"Nächster Schritt"** - Primary transition button
- **"Kategorien"** - Tag families section

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│ ╭──────────╮  ╭─────────────────────────╮  ╭───────────────────╮ │
│ │ 📝 Draft │  │ 🔍 Zur Prüfung senden   │  │ ttags │ ctags     │ │
│ ╰──────────╯  ╰─────────────────────────╯  ╰───────────────────╯ │
│                                                                  │
│ Sichtbarkeit: [👥 Team ✓] [🏢 Projekt] [🌐 Öffentlich]          │
└──────────────────────────────────────────────────────────────────┘
```

### Component Spec
```typescript
// EntityControlStrip.vue
interface Props {
    entity: EntityWithStatus
    entityType: 'post' | 'event' | 'image'
    capabilities: number  // from sysreg
}

// Combines:
// - StatusEditor (primary + alternative transitions)
// - TagFamilies (ttags, ctags, dtags in compact mode)
// - Scope toggles (from StatusEditor)
```

### sysreg_config Integration
Uses existing entries:
- `post_transition_*` → transition buttons
- Entity status bits → current status display
- Scope bits → visibility toggles

---

## Idea #2: The "Contextual PostIT Sidebar"

### Concept
PostITSidebar that appears contextually when user has comment capability, sliding in from the right edge of EntityBrowser. Comments are entity-scoped and role-colored.

### German Interaction Wording
- **"Kommentare & Notizen"** - Sidebar title
- **"Notiz hinzufügen"** - Add comment button
- **"Interner Kommentar"** - For team-only visibility
- **"Frage an Ersteller"** - Quick template for feedback

### Visual Design
```
┌─────────────────────────┬──────────────────────┐
│                         │ 📋 Kommentare (3)    │
│    Entity Browser       │ ──────────────────── │
│    (Main Content)       │ ┌──────────────────┐ │
│                         │ │ 🟡 Nina (Member) │ │
│                         │ │ "Bitte Bild..."  │ │
│                         │ └──────────────────┘ │
│                         │ ┌──────────────────┐ │
│                         │ │ 🟢 Hans (Creator)│ │
│                         │ │ "Erledigt!"      │ │
│                         │ └──────────────────┘ │
│                         │ ┌──────────────────┐ │
│                         │ │ ✏️ Notiz...      │ │
│                         │ └──────────────────┘ │
└─────────────────────────┴──────────────────────┘
```

### Component Spec
```typescript
// ContextualPostITSidebar.vue
interface Props {
    entityType: 'post' | 'event' | 'image' | 'project'
    entityId: string
    projectId: string
    userRelation: ProjectRelation
    isCollapsed?: boolean
}

// Uses:
// - PostITBoard for thread management
// - usePostITComments composable
// - Color coding from userRelation
```

### New sysreg_config Entries
```sql
INSERT INTO sysreg_config (name, value, description, taglogic) VALUES
('post_comment_member', /* bits */, 'Members can comment on any post', 'option'),
('event_comment_participant', /* bits */, 'Participants can comment on events', 'option');
```

---

## Idea #3: The "Smart List Header"

### Concept
Enhanced ListHead that merges with TagFamilies filter mode - allowing users to filter the entity list by clicking tag badges, creating an intuitive faceted search.

### German Interaction Wording
- **"Filter nach Kategorie"** - Filter by category
- **"Aktive Filter"** - Active filters chip row
- **"Alle anzeigen"** - Clear all filters
- **"Workshop" / "Kurs" / "Konferenz"** - Event type tags as filters

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│  AGENDA                                                    🔍    │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │Workshop │ │  Kurs   │ │ Konf.   │ │ Meeting │  ← ttags      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
├──────────────────────────────────────────────────────────────────┤
│  Aktive Filter: [Workshop ×] [Status: Draft ×]                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Spec
```typescript
// SmartListHeader.vue
interface Props {
    entityType: 'events' | 'posts' | 'partners'
    projectId: string
    initialFilters?: FilterState
}

interface FilterState {
    ttags?: number[]
    ctags?: number[]
    statusRange?: { min: number, max: number }
    dateRange?: { start: Date, end: Date }
}

// Combines:
// - ListHead navigation
// - TagFamilies in filter mode (clickable badges)
// - FilterChip[] for active filters
// - Emits filter changes to pList
```

### sysreg_config Integration
Tags from sysreg_options feed the filter badges. Filter visibility controlled by:
- `dashboard_filter_ttags` → show topic tag filters
- `dashboard_filter_ctags` → show category tag filters

---

## Idea #4: The "Inline Edit Overlay"

### Concept
EditPanel that appears as an overlay within the EntityBrowser column rather than a full drawer, enabling quick edits without losing list context. Uses BasePanel in a new "inline" mode.

### German Interaction Wording
- **"Schnellbearbeitung"** - Quick edit mode
- **"Erweiterte Bearbeitung"** - Full edit (opens drawer)
- **"Änderungen speichern"** - Save changes
- **"Verwerfen"** - Discard changes

### Visual Design
```
┌─────────────────────────┬──────────────────────────────────────┐
│                         │ ┌──────────────────────────────────┐ │
│  Entity List            │ │ 📝 Schnellbearbeitung            │ │
│  ────────────────       │ ├──────────────────────────────────┤ │
│  • Event 1 (selected)   │ │ Titel: [________________]        │ │
│  • Event 2              │ │ Teaser: [________________]       │ │
│  • Event 3              │ │                                  │ │
│  • Event 4              │ │ Status: [Draft v] → [🔍 Review]  │ │
│                         │ │                                  │ │
│                         │ │ [Verwerfen] [Speichern]          │ │
│                         │ └──────────────────────────────────┘ │
└─────────────────────────┴──────────────────────────────────────┘
```

### Component Spec
```typescript
// InlineEditOverlay.vue
interface Props {
    entity: EntityWithStatus
    entityType: 'post' | 'event'
    mode: 'quick' | 'full'  // quick = inline, full = drawer
    capabilities: number
}

// Uses:
// - EditPanel form fields
// - StatusEditor for transition
// - BasePanel container
// - Capability-driven field visibility
```

### sysreg_config Integration
Which fields appear in quick edit depends on capabilities:
- `update > comment` → only teaser/md fields
- `update (full)` → all fields including tags
- `manage > status` → status transition available

---

## Idea #5: The "Entity Gallery Browser"

### Concept
Merge pGallery capabilities into EntityBrowser - when viewing images or selecting cover images, show a gallery view with multi-select, drag-to-reorder, and inline preview.

### German Interaction Wording
- **"Bildergalerie"** - Image gallery
- **"Bilder auswählen"** - Select images
- **"Als Titelbild setzen"** - Set as cover
- **"Reihenfolge ändern"** - Change order

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│ 🖼️ Bildergalerie                           [✓ Auswählen] [↕️ Ord] │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │   📷     │ │   📷     │ │   📷     │ │   📷     │             │
│ │  IMG_1   │ │  IMG_2   │ │  IMG_3   │ │  IMG_4   │             │
│ │ ✓ Cover  │ │          │ │          │ │          │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │   📷     │ │   📷     │ │   📷     │ │   ➕     │             │
│ │  IMG_5   │ │  IMG_6   │ │  IMG_7   │ │ Hochladen│             │
│ │          │ │          │ │          │ │          │             │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### Component Spec
```typescript
// EntityGalleryBrowser.vue
interface Props {
    projectId: string
    filterByEntity?: { type: string, id: number }  // filter images by parent
    selectionMode?: 'single' | 'multi' | 'none'
    capabilities: number
}

// Combines:
// - pGallery (ItemGallery) for grid display
// - ItemTile with selection state
// - Drag-drop reordering
// - Upload integration (if manage capability)
```

### sysreg_config Integration
- `image_draft_read_member` → can see draft images
- `image_creator_manage` → can delete/reorder own images
- `project_all_manage_P_owner` → can manage all images

---

## Idea #6: The "Workflow Timeline Strip"

### Concept
A visual timeline showing the entity's workflow history and available transitions, combining StatusEditor's transition logic with a horizontal timeline UI. Shows past states, current state, and possible future states.

### German Interaction Wording
- **"Workflow-Verlauf"** - Workflow history
- **"Erstellt am"** - Created on
- **"Eingereicht zur Prüfung"** - Submitted for review
- **"Freigegeben am"** - Released on
- **"Nächster möglicher Schritt"** - Next possible step

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│ Workflow-Verlauf                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ● ──────── ● ──────── ◉ ─ ─ ─ ─ ○ ─ ─ ─ ─ ○                    │
│  Neu        Demo       Draft     Review     Released             │
│  12.10.     14.10.     heute                                     │
│                          ↓                                       │
│                    ┌─────────────────┐                          │
│                    │🔍 Zur Prüfung   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Spec
```typescript
// WorkflowTimelineStrip.vue
interface Props {
    entity: EntityWithStatus
    entityType: 'post' | 'event' | 'project'
    transitions: TransitionAction[]  // from usePostStatusV2
    history?: WorkflowHistoryEntry[]  // from API
}

interface WorkflowHistoryEntry {
    fromStatus: number
    toStatus: number
    timestamp: Date
    userId: number
    userName: string
}

// Combines:
// - StatusEditor transition logic
// - Timeline visualization
// - History from entity_log (if available)
```

### sysreg_config Integration
Timeline shows all possible states for entity type, highlights:
- Completed states (from history)
- Current state (from entity.status)
- Available transitions (from sysreg_config `post_transition_*`)
- Unavailable states (grayed out)

---

## Integration Summary

| Component | Uses From | sysreg Entries | Priority |
|-----------|-----------|----------------|----------|
| EntityControlStrip | StatusEditor, TagFamilies | `*_transition_*`, scope bits | HIGH |
| ContextualPostITSidebar | PostITBoard | `*_comment_*` (new) | MEDIUM |
| SmartListHeader | ListHead, TagFamilies, FilterChip | tag filters | MEDIUM |
| InlineEditOverlay | EditPanel, StatusEditor, BasePanel | `update` caps | HIGH |
| EntityGalleryBrowser | pGallery, ItemGallery | `image_*` | LOW |
| WorkflowTimelineStrip | StatusEditor | `*_transition_*` | MEDIUM |

---

## Implementation Order Recommendation

1. **EntityControlStrip** - Immediate need for events workflow
2. **InlineEditOverlay** - Quick editing essential for productivity
3. **WorkflowTimelineStrip** - Visual clarity for status workflow
4. **ContextualPostITSidebar** - Collaboration features
5. **SmartListHeader** - Enhanced filtering
6. **EntityGalleryBrowser** - Image management polish

---

*Generated: December 12, 2025*
