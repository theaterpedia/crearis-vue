# Strategy D: "Die Projekt-Choreografie"
## Event Workflow - Project Phase Synchronization Principle

**Date:** December 12, 2025  
**First Principle:** Events follow the project's lifecycle. The project status gates what event actions are possible. A project in "Draft" means events are in preparation; "Released" enables public events.

---

## Grundprinzip

> **"Das Projekt gibt den Takt vor."**  
> Events sind Instrumente im Orchester des Projekts. Der Projektleiter dirigiert die Gesamtinszenierung. Events werden erst sichtbar, wenn das Projekt bereit ist.

---

## 2-3 Basis-Workflow-Schritte

### Schritt 1: "Projekt-Agenda vorbereiten"
**Project: Demo → Draft | Events: Demo → Draft**

Das Projekt wechselt von Demo zu Draft. Damit werden alle Events automatisch zu internen Entwürfen.

**Deutsche Interaktion:**
- Button: **"Projekt aktivieren"** (auf Projekt-Ebene)
- Automatisch: Alle Demo-Events → Draft
- Bestätigung: *"Projektarbeit beginnt. Team kann Events vorbereiten."*
- Status-Badge Projekt: `📋 In Vorbereitung`

### Schritt 2: "Event-Paket freigeben"
**Project: Draft → Review | Events: Batch-Review**

Das Projektteam hat mehrere Events vorbereitet. Alle werden gemeinsam zur Prüfung eingereicht.

**Deutsche Interaktion:**
- Button: **"Agenda zur Prüfung einreichen"**
- Dialog: Event-Auswahl (alle oder einzelne)
- Bestätigung: *"3 Events zur Prüfung eingereicht."*
- Status-Badge: `🔍 Agenda-Prüfung`

### Schritt 3: "Projekt veröffentlichen"
**Project: Review → Released | Events: Auto-Release**

Das Projekt wird veröffentlicht. Alle freigegebenen Events werden automatisch öffentlich.

**Deutsche Interaktion:**
- Button: **"Projekt & Events veröffentlichen"**
- Preview: Liste der Events, die veröffentlicht werden
- Bestätigung: *"Projekt und 5 Events sind jetzt öffentlich!"*
- Status-Badge: `✅ Veröffentlicht`

---

## 10-15 sysreg_config Einträge

```sql
-- ============================================
-- STRATEGY D: Project Phase Synchronization
-- ============================================

-- PROJECT-GATED CAPABILITIES

-- 1. Events can only be created when project is Draft+
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_create_project_draft',
 285213224, 'Events erstellen nur bei Projekt-Draft+', 'config', 'option');

-- 2. Event visibility follows project status
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_read_project_gated',
 276843304, 'Event-Sichtbarkeit folgt Projekt-Status', 'config', 'option');

-- PROJECT TRANSITIONS (cascade to events)

-- 3. Project Demo → Draft (enables event creation)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('project_transition_demo_draft_cascade',
 539361544, 'Projekt aktivieren + Events ermöglichen', 'config', 'category');

-- 4. Project Draft → Review (submits event batch)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('project_transition_draft_review_with_events',
 539493128, 'Agenda zur Prüfung (inkl. Events)', 'config', 'category');

-- 5. Project Review → Released (releases approved events)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('project_transition_review_released_cascade',
 271189000, 'Projekt + Events veröffentlichen', 'config', 'category');

-- EVENT PERMISSIONS (within project context)

-- 6. Member can create draft events in draft project
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_create_member_in_draft_project',
 285228584, 'Event-Entwurf im Projekt erstellen', 'config', 'option');

-- 7. Member can update events before project review
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_update_member_pre_review',
 293636648, 'Events bearbeiten vor Projekt-Review', 'config', 'option');

-- 8. P_owner can mark events for release
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_draft_confirmed_P_owner',
 271124008, 'Event für Release markieren', 'config', 'category');

-- 9. Confirmed events release with project
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_auto_release_with_project',
 276875816, 'Bestätigte Events mit Projekt veröffentlichen', 'config', 'option');

-- BATCH OPERATIONS

-- 10. Batch select events for review
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_batch_review_P_owner',
 271386664, 'Events gebündelt zur Prüfung', 'config', 'option');

-- 11. Batch release events
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_batch_release_P_owner',
 271517736, 'Events gebündelt freigeben', 'config', 'option');

-- 12. Events inherit project scope settings
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_scope_inherit_project',
 276909608, 'Event-Sichtbarkeit erbt Projekt-Scope', 'config', 'option');

-- CROSS-PROJECT (related events)

-- 13. View events from related projects
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_read_related_project_member',
 276843560, 'Events von Partner-Projekten sehen', 'config', 'option');

-- 14. Can comment on related project events
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_comment_related_project_member',
 276860456, 'Auf Partner-Events kommentieren', 'config', 'option');
```

---

## Dataflow zur UI

### Project-Synchronized Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 Theaterpedia Konferenz 2026                                   │
│ Status: 📋 In Vorbereitung (Draft)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ AGENDA                                      [+ Event] [📦 Alle]  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☐ │ Mo 06.10. │ Eröffnung      │ ✅ Bereit │               │ │
│ │ ☐ │ Mo 06.10. │ Keynote        │ 📝 Entwurf │               │ │
│ │ ☐ │ Di 07.10. │ Workshops      │ 📝 Entwurf │               │ │
│ │ ☐ │ Di 07.10. │ Abschluss      │ 📝 Entwurf │               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [☐ Alle auswählen]  [🔍 Ausgewählte zur Prüfung]                │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Projekt-Aktion:                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [🔍 Projekt & Agenda zur Prüfung einreichen]                 │ │
│ │ 4 Events werden mit eingereicht (2 bereit, 2 Entwürfe)       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Project-Event Status Matrix

```typescript
// useProjectEventSync.ts
interface ProjectEventSync {
    projectStatus: number
    events: EventWithSyncState[]
    batchCapabilities: {
        canBatchReview: boolean
        canBatchRelease: boolean
        canBatchArchive: boolean
    }
}

interface EventWithSyncState {
    id: number
    status: number
    syncState: 'ahead' | 'synced' | 'behind'  // relative to project
    canTransition: boolean
    blockedReason?: string
}

const useProjectEventSync = (projectId: Ref<number>) => {
    const project = ref<Project | null>(null)
    const events = ref<EventWithSyncState[]>([])
    
    // Events can only be "ahead" of project by 1 status
    const syncState = (event: Event) => {
        const projectPhase = statusToPhase(project.value?.status)
        const eventPhase = statusToPhase(event.status)
        
        if (eventPhase > projectPhase + 1) return 'blocked'
        if (eventPhase > projectPhase) return 'ahead'
        if (eventPhase === projectPhase) return 'synced'
        return 'behind'
    }
    
    // Batch transition
    const batchTransition = async (eventIds: number[], targetStatus: number) => {
        // Validate all events can transition
        // Execute batch API call
        // Update local state
    }
    
    return { project, events, syncState, batchTransition }
}
```

---

## Neue Komponenten

### 1. ProjectAgendaPanel

Projekt-zentrierte Event-Verwaltung:

```
┌────────────────────────────────────────────────────────────────┐
│ 🎯 Agenda-Übersicht                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Projekt-Status: 📋 Draft                                        │
│ Event-Status erlaubt: Demo, Draft, Confirmed                   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Events nach Status:                                      │  │
│ │ ● Demo: 0  ● Draft: 3  ● Confirmed: 1  ● Released: 0    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ Nächster Projekt-Schritt: "Zur Prüfung einreichen"            │
│ → 4 Events werden mit übergeben                               │
│ → 1 Event ist bereit (Confirmed)                              │
│ → 3 Events noch in Bearbeitung (Draft)                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2. BatchEventSelector

Multi-Select für Event-Operationen:

```
┌────────────────────────────────────────────────────────────────┐
│ Events auswählen für: Freigabe markieren                       │
├────────────────────────────────────────────────────────────────┤
│ [☑ Alle] [☐ Nur Draft] [☐ Nur diese Woche]                    │
├────────────────────────────────────────────────────────────────┤
│ ☑ │ 06.10. │ Eröffnung       │ Draft  │ ✓ Vollständig        │
│ ☑ │ 06.10. │ Keynote         │ Draft  │ ⚠ Sprecher fehlt     │
│ ☐ │ 07.10. │ Workshops       │ Draft  │ ✓ Vollständig        │
│ ☑ │ 07.10. │ Abschluss       │ Draft  │ ✓ Vollständig        │
├────────────────────────────────────────────────────────────────┤
│ 3 ausgewählt │ 1 mit Warnung                                   │
│ [Abbrechen]           [✅ 3 Events als "Bereit" markieren]     │
└────────────────────────────────────────────────────────────────┘
```

### 3. ProjectReleasePreview

Vorschau vor Projekt-Veröffentlichung:

```
┌────────────────────────────────────────────────────────────────┐
│ 🚀 Veröffentlichungs-Vorschau                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Projekt: "Theaterpedia Konferenz 2026"                         │
│                                                                │
│ Was wird veröffentlicht:                                       │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ ✅ Projekt-Seite                                           ││
│ │ ✅ 5 Events (alle mit Status "Confirmed")                  ││
│ │ ✅ 12 Posts (freigegebene Ankündigungen)                   ││
│ │ ⏸ 2 Events bleiben Draft (nicht bereit)                    ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ Sichtbarkeit nach Veröffentlichung:                           │
│ [✅ Öffentlich] [☐ Nur Partner] [☐ Nur Angemeldet]             │
│                                                                │
│ [Abbrechen]                    [🚀 Jetzt veröffentlichen]      │
└────────────────────────────────────────────────────────────────┘
```

---

## Visuelle Design-Beispiele

### Project-Event Status Correlation

| Project Status | Allowed Event States | Visual |
|----------------|---------------------|--------|
| Demo | Demo only | 🔒 Events locked |
| Draft | Demo, Draft, Confirmed | 🔓 Events editable |
| Review | Demo, Draft, Confirmed | ⏸ Events frozen |
| Released | All states | ✅ Events live |

### Sync State Indicators

```
Event ahead of project:    ⚡ (yellow warning)
Event synced with project: ✓  (green check)
Event behind project:      ⏳ (gray pending)
Event blocked:             🚫 (red blocked)
```

### Batch Action Buttons

```
┌──────────────────────────────────────────────────────────────┐
│ Ausgewählt: 3 Events                                         │
│ [📝 → Draft] [✅ → Bereit] [🚀 → Release] [🗑️ → Papierkorb]   │
└──────────────────────────────────────────────────────────────┘
```

---

## Cascade Logic

### Project Transition Triggers Event Transitions

```typescript
// server/services/projectEventCascade.ts
async function cascadeProjectTransition(
    projectId: number, 
    fromStatus: number, 
    toStatus: number
) {
    const events = await getProjectEvents(projectId)
    
    if (toStatus === STATUS.RELEASED) {
        // Auto-release all CONFIRMED events
        const confirmedEvents = events.filter(e => e.status === STATUS.CONFIRMED)
        await db.run(`
            UPDATE events 
            SET status = $1 
            WHERE project_id = $2 AND status = $3
        `, [STATUS.RELEASED, projectId, STATUS.CONFIRMED])
        
        // Log cascade
        await logCascade(projectId, confirmedEvents.length, 'released')
    }
    
    if (toStatus === STATUS.ARCHIVED) {
        // Archive all events with project
        await db.run(`
            UPDATE events 
            SET status = $1 
            WHERE project_id = $2 AND status < $3
        `, [STATUS.ARCHIVED, projectId, STATUS.ARCHIVED])
    }
}
```

---

## Zusammenfassung

**Stärke dieser Strategie:**
- Holistische Projekt-Sicht
- Batch-Operationen effizient
- Klare Governance (Projekt-gated)
- Gut für große Veranstaltungen

**Schwäche:**
- Weniger Flexibilität für einzelne Events
- Projekt-Dependency kann blockieren
- Komplexere Cascade-Logik

---

*Strategy D - Generated: December 12, 2025*
