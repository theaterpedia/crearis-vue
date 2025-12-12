# Strategy A: "Der Veranstaltungsleiter"
## Event Workflow - Instructor-Centric Principle

**Date:** December 12, 2025  
**First Principle:** The instructor (Kursleiter) is the primary actor. Everything flows from their preparation to their delivery.

---

## Grundprinzip

> **"Wer unterrichtet, führt."**  
> Der Kursleiter/Dozent ist der natürliche Eigentümer eines Events. Die Workflow-Phasen spiegeln ihre Vorbereitungsreise wider.

---

## 2-3 Basis-Workflow-Schritte

### Schritt 1: "Konzept anlegen"
**Demo → Draft**

Der Kursleiter erstellt ein Veranstaltungskonzept. Dies ist noch keine verbindliche Ankündigung, sondern eine Arbeitsversion.

**Deutsche Interaktion:**
- Button: **"Konzept erstellen"**
- Bestätigung: *"Ihr Veranstaltungskonzept wurde angelegt. Vervollständigen Sie die Details."*
- Status-Badge: `📝 Konzept`

### Schritt 2: "Zur Freigabe einreichen"
**Draft → Review**

Der Kursleiter hat das Event vollständig beschrieben und möchte es zur internen Prüfung einreichen.

**Deutsche Interaktion:**
- Button: **"Zur Freigabe einreichen"**
- Prüfung: *"Pflichtfelder: Titel, Datum, Beschreibung"*
- Bestätigung: *"Eingereicht! Das Team wird Ihr Konzept prüfen."*
- Status-Badge: `🔍 In Prüfung`

### Schritt 3: "Veranstaltung freigeben" 
**Review → Released**

Das Projektteam (p_owner) gibt das Event frei. Es erscheint öffentlich.

**Deutsche Interaktion:**
- Button: **"Freigeben & Veröffentlichen"**
- Alternative: **"Zurück zur Überarbeitung"** (Review → Draft)
- Bestätigung: *"Die Veranstaltung ist jetzt öffentlich sichtbar!"*
- Status-Badge: `✅ Veröffentlicht`

---

## 10-15 sysreg_config Einträge

```sql
-- ============================================
-- STRATEGY A: Instructor-Centric Event Workflow
-- ============================================

-- 1. Instructor creates event (Demo → exists, instructor sees it)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_demo_read_creator', /* ENTITY_EVENT | STATE_DEMO | CAP_READ | CAP_LIST | ROLE_CREATOR */
 544210984, 'Kursleiter kann eigene Demo-Events sehen', 'config', 'option');

-- 2. Instructor can update their demo event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_demo_update_creator', 
 560987688, 'Kursleiter kann Demo-Event bearbeiten', 'config', 'option');

-- 3. Instructor transitions Demo → Draft ("Konzept erstellen")
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_demo_draft_creator',
 539427880, 'Kursleiter: Konzept erstellen (Demo→Draft)', 'config', 'category');

-- 4. Instructor can read/update their draft event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_update_creator',
 560988200, 'Kursleiter kann Draft-Event bearbeiten', 'config', 'option');

-- 5. Members can see draft events (team visibility)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_read_member',
 276843304, 'Teammitglieder sehen Draft-Events', 'config', 'option');

-- 6. Instructor submits for review ("Zur Freigabe einreichen")
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_draft_review_creator',
 539559464, 'Kursleiter: Zur Freigabe einreichen', 'config', 'category');

-- 7. Review state visible to team
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_review_read_member',
 276844328, 'Teammitglieder sehen Events in Prüfung', 'config', 'option');

-- 8. Project owner approves ("Freigeben")
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_review_released_P_owner',
 271255592, 'Projektleiter: Event freigeben', 'config', 'category');

-- 9. Project owner can reject ("Zurück zur Überarbeitung")
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_alt_transition_review_draft_P_owner',
 270993448, 'Projektleiter: Zurück an Kursleiter', 'config', 'subcategory');

-- 10. Released events visible to all
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_read_anonym',
 41953832, 'Veröffentlichte Events für alle sichtbar', 'config', 'option');

-- 11. Instructor can still update released (minor edits)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_update_creator',
 560990760, 'Kursleiter: Kleinere Änderungen möglich', 'config', 'option');

-- 12. Anyone can trash their own event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_any_trash_creator',
 810484776, 'Kursleiter kann Event löschen', 'config', 'subcategory');

-- 13. Project owner can trash any event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_any_trash_P_owner',
 274874920, 'Projektleiter kann Events löschen', 'config', 'subcategory');

-- 14. Restore from trash
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_trash_draft_creator',
 807865128, 'Aus Papierkorb wiederherstellen', 'config', 'option');
```

---

## Dataflow zur UI

### EntityControlStrip für Events

```vue
<template>
    <div class="entity-control-strip event-control">
        <!-- Current Status -->
        <StatusBadge :status="event.status" entity="event" />
        
        <!-- Primary Transition (category) -->
        <button v-if="transitions.primary" 
                :class="['primary-action', transitions.primary.color]"
                @click="executeTransition(transitions.primary)">
            {{ transitions.primary.label }}
        </button>
        
        <!-- Alternative Transitions (subcategory) -->
        <div v-if="transitions.alternatives.length" class="alt-actions">
            <button v-for="alt in transitions.alternatives" 
                    :key="alt.value"
                    class="alt-action"
                    @click="executeTransition(alt)">
                {{ alt.label }}
            </button>
        </div>
    </div>
</template>
```

### Computed Transitions (from sysreg_config)

```typescript
const transitions = computed(() => {
    const caps = sysregConfig.filter(c => 
        c.name.startsWith('event_transition') &&
        matchesCurrentState(c, event.value.status) &&
        userHasRole(c, currentUserRole.value)
    )
    
    return {
        primary: caps.find(c => c.taglogic === 'category'),
        alternatives: caps.filter(c => c.taglogic === 'subcategory')
    }
})
```

---

## Neue Komponenten

### 1. InstructorEventCard

Zeigt Event aus Kursleiter-Perspektive mit Status-Fortschritt:

```
┌────────────────────────────────────────────┐
│ 📚 Workshop: Grundlagen Improvisation      │
│ ───────────────────────────────────────────│
│ 📅 15. Jan 2026, 10:00-17:00               │
│ 📍 Theaterpädagogik-Zentrum                │
│                                            │
│ ● ─── ◉ ─── ○ ─── ○                        │
│ Demo  Draft Review Released                │
│                                            │
│ [🔍 Zur Freigabe einreichen]               │
└────────────────────────────────────────────┘
```

### 2. InstructorDashboardWidget

Übersicht aller eigenen Events für den Kursleiter:

```
┌────────────────────────────────────────────┐
│ 👤 Meine Veranstaltungen                   │
├────────────────────────────────────────────┤
│ 📝 Konzept (2)     │ 🔍 In Prüfung (1)     │
│ ✅ Veröffentlicht (5) │ 📦 Archiv (3)      │
├────────────────────────────────────────────┤
│ ⚡ Nächste Aktion: "Improvisation" freige.. │
└────────────────────────────────────────────┘
```

---

## Visuelle Design-Beispiele

### Status-Badge Farben (Kursleiter-Fokus)

| Status | Farbe | Icon | Label |
|--------|-------|------|-------|
| Demo | Gray | 🎭 | Vorlage |
| Draft | Blue | 📝 | Konzept |
| Review | Yellow | 🔍 | In Prüfung |
| Released | Green | ✅ | Veröffentlicht |
| Archived | Gray | 📦 | Archiviert |

### Transition-Button Texte

| Transition | Button Text | Tooltip |
|------------|-------------|---------|
| Demo→Draft | "Konzept erstellen" | "Event als Arbeitsversion anlegen" |
| Draft→Review | "Zur Freigabe einreichen" | "Dem Team zur Prüfung vorlegen" |
| Review→Released | "Freigeben" | "Öffentlich sichtbar machen" |
| Review→Draft | "Überarbeiten" | "Zurück an Kursleiter" |
| Any→Trash | "Löschen" | "In Papierkorb verschieben" |

---

## Zusammenfassung

**Stärke dieser Strategie:**
- Klarer Verantwortlicher (Instructor = Creator = Owner)
- Einfacher linearer Workflow
- Gut für Einzelveranstaltungen

**Schwäche:**
- Weniger geeignet für komplexe Kursserien
- Team-Kollaboration nur durch Review-Schritt
- Keine Session-Unterstützung out-of-box

---

*Strategy A - Generated: December 12, 2025*
