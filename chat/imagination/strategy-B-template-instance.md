# Strategy B: "Die Kursserie"
## Event Workflow - Template-Instance Principle

**Date:** December 12, 2025  
**First Principle:** Events are instances of templates. A "Kurs" (template) produces multiple "Termine" (instances). The workflow operates on both levels.

---

## Grundprinzip

> **"Einmal planen, mehrfach durchführen."**  
> Eine Kursvorlage wird einmal erstellt und gepflegt. Daraus entstehen konkrete Termine mit eigenem Status.

---

## 2-3 Basis-Workflow-Schritte

### Schritt 1: "Kursvorlage aktivieren"
**Template: Draft → Confirmed**

Die Kursvorlage (event_type in Odoo) wird vom Team bestätigt. Sie dient als Blaupause.

**Deutsche Interaktion:**
- Button: **"Vorlage aktivieren"**
- Bestätigung: *"Die Kursvorlage ist aktiv. Sie können jetzt Termine erstellen."*
- Status-Badge: `📋 Aktive Vorlage`

### Schritt 2: "Termin anlegen"
**Instance: New → Draft**

Aus der aktiven Vorlage wird ein konkreter Termin mit Datum erstellt.

**Deutsche Interaktion:**
- Button: **"Neuen Termin anlegen"**
- Dialog: Datum, Uhrzeit, Ort auswählen
- Bestätigung: *"Termin angelegt. Ergänzen Sie die Details."*
- Status-Badge: `📅 Terminentwurf`

### Schritt 3: "Termin veröffentlichen"
**Instance: Draft → Released**

Der konkrete Termin wird veröffentlicht und ist buchbar.

**Deutsche Interaktion:**
- Button: **"Termin veröffentlichen"**
- Prüfung: *"Pflichtfelder vollständig?"*
- Bestätigung: *"Der Termin ist jetzt buchbar!"*
- Status-Badge: `✅ Buchbar`

---

## 10-15 sysreg_config Einträge

```sql
-- ============================================
-- STRATEGY B: Template-Instance Event Workflow
-- ============================================

-- TEMPLATE-LEVEL (event_type / Kursvorlage)

-- 1. Creator can create template
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('template_draft_update_creator',
 560988200, 'Ersteller kann Vorlage bearbeiten', 'config', 'option');

-- 2. Members can see draft templates
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('template_draft_read_member',
 276826920, 'Team sieht Vorlagen-Entwürfe', 'config', 'option');

-- 3. Creator submits template for confirmation
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('template_transition_draft_confirmed_creator',
 539821608, 'Vorlage zur Bestätigung einreichen', 'config', 'category');

-- 4. Project owner confirms template ("Vorlage aktivieren")
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('template_transition_confirmed_active_P_owner',
 271517736, 'Projektleiter: Vorlage aktivieren', 'config', 'category');

-- 5. Active templates visible to all members
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('template_active_read_member',
 276830504, 'Aktive Vorlagen für Team sichtbar', 'config', 'option');

-- INSTANCE-LEVEL (event.event / Termin)

-- 6. Member can create instance from template
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_create_from_template_member',
 285213224, 'Teammitglied: Termin aus Vorlage erstellen', 'config', 'option');

-- 7. Instance creator can update draft
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_update_instance_creator',
 560988200, 'Termin-Ersteller kann Entwurf bearbeiten', 'config', 'option');

-- 8. Instance: Draft → Released (direct publish for simple events)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_draft_released_member',
 276860456, 'Teammitglied: Termin veröffentlichen', 'config', 'category');

-- 9. Alternative: Draft → Review (for complex approval)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_alt_transition_draft_review_member',
 276598312, 'Zur Prüfung einreichen (optional)', 'config', 'subcategory');

-- 10. Review → Released (approval path)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_review_released_P_owner',
 271255592, 'Projektleiter: Termin freigeben', 'config', 'category');

-- 11. Released events visible to public
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_read_anonym',
 41953832, 'Veröffentlichte Termine öffentlich', 'config', 'option');

-- 12. Participants can see events they're registered for
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_confirmed_read_e_participant',
 142675496, 'Angemeldete sehen bestätigte Termine', 'config', 'option');

-- 13. Archive completed event (Released → Archived)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_released_archived_member',
 277122600, 'Termin archivieren nach Durchführung', 'config', 'subcategory');

-- 14. Clone instance for next occurrence
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_clone_instance_member',
 285213224, 'Termin duplizieren', 'config', 'option');
```

---

## Dataflow zur UI

### Zwei-Ebenen-Ansicht im Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│ AGENDA                                                    🔍     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📋 Kursvorlagen                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Workshop Improvisation  │ ✅ Aktiv │ [+ Termin] [Bearbeiten] │ │
│ │ Körperarbeit Grundkurs  │ 📝 Entwurf │ [Aktivieren]         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ 📅 Anstehende Termine                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 15. Jan │ Impro-Workshop #1      │ ✅ Buchbar │ 12/20 Plätze │ │
│ │ 22. Jan │ Impro-Workshop #2      │ 📝 Entwurf │ [Publish]    │ │
│ │ 29. Jan │ Körperarbeit           │ ⏳ Geplant │ [Bearbeiten] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Template-Instance Relationship Component

```typescript
// useTemplateInstance.ts
interface TemplateInstanceConfig {
    template: {
        id: number
        name: string
        status: number
        eventTypeId: number  // Odoo event.type
    }
    instances: {
        id: number
        date: Date
        status: number
        seatsAvailable: number
        inheritedFields: string[]  // from template
    }[]
}

const useTemplateInstance = (templateId: Ref<number>) => {
    const template = ref<Template | null>(null)
    const instances = ref<Instance[]>([])
    
    const createInstance = async (date: Date) => {
        // Create event.event with event_type_id = templateId
        // Inherit: name, description, teasertext, cimg
        // Override: date_begin, date_end
    }
    
    const canCreateInstance = computed(() => 
        template.value?.status === STATUS.ACTIVE &&
        userCaps.value & CAP_CREATE_FROM_TEMPLATE
    )
    
    return { template, instances, createInstance, canCreateInstance }
}
```

---

## Neue Komponenten

### 1. TemplateCard

Kursvorlage mit Instance-Counter:

```
┌────────────────────────────────────────────┐
│ 📋 Workshop: Improvisation                 │
│ ───────────────────────────────────────────│
│ Typ: Workshop │ Dauer: 7h │ Max: 20 TN     │
│                                            │
│ 📅 3 aktive Termine │ 📦 12 vergangene     │
│                                            │
│ Status: ✅ Aktive Vorlage                   │
│                                            │
│ [+ Neuer Termin] [Bearbeiten] [Archivieren]│
└────────────────────────────────────────────┘
```

### 2. InstanceTimeline

Zeigt alle Instanzen einer Vorlage auf Zeitstrahl:

```
┌────────────────────────────────────────────────────────────────┐
│ Impro-Workshop 2026                                            │
├────────────────────────────────────────────────────────────────┤
│ Jan    │    Feb    │    Mär    │    Apr    │    Mai           │
│   ●        ●         ●                                         │
│  15.      22.       15.                                        │
│ Buchbar  Entwurf   Geplant                                     │
│ 12/20    --/20     --/20                                       │
└────────────────────────────────────────────────────────────────┘
```

### 3. InstanceCreationDialog

Dialog zum Anlegen eines neuen Termins:

```
┌────────────────────────────────────────────┐
│ Neuer Termin: Impro-Workshop               │
├────────────────────────────────────────────┤
│ Vorlage: Workshop Improvisation            │
│                                            │
│ 📅 Datum: [___15.01.2026___]               │
│ 🕐 Zeit:  [___10:00___] - [___17:00___]    │
│ 📍 Ort:   [___Theaterzentrum___]     [🔍]  │
│                                            │
│ ☐ Wöchentlich wiederholen (4x)             │
│                                            │
│ [Abbrechen]              [Termin anlegen]  │
└────────────────────────────────────────────┘
```

---

## Visuelle Design-Beispiele

### Template vs Instance Unterscheidung

| Element | Template (Vorlage) | Instance (Termin) |
|---------|-------------------|-------------------|
| Icon | 📋 | 📅 |
| Card Background | Light gray | White |
| Primary Color | Purple | Blue |
| Actions | "Aktivieren", "Bearbeiten" | "Veröffentlichen", "Buchen" |

### Status-Badges

| Level | Status | Badge |
|-------|--------|-------|
| Template | Draft | `📝 Entwurf` |
| Template | Confirmed | `📋 Bestätigt` |
| Template | Active | `✅ Aktiv` |
| Instance | Draft | `📅 Geplant` |
| Instance | Released | `✅ Buchbar` |
| Instance | Confirmed | `🎫 Ausgebucht` |
| Instance | Archived | `📦 Abgeschlossen` |

---

## Odoo-Integration

### Mapping zu Odoo-Modellen

| Crearis Concept | Odoo Model | Notes |
|-----------------|------------|-------|
| Kursvorlage | `event.type` | Extended with status |
| Termin | `event.event` | Has `event_type_id` FK |
| Buchung | `event.registration` | Per instance |

### API Endpoints

```typescript
// Template endpoints
GET  /api/odoo/event-types?project={domaincode}
POST /api/odoo/event-types
PUT  /api/odoo/event-types/:id/status

// Instance endpoints
GET  /api/odoo/events?event_type_id={templateId}
POST /api/odoo/events/from-template/:templateId
PUT  /api/odoo/events/:id
```

---

## Zusammenfassung

**Stärke dieser Strategie:**
- Ideal für wiederkehrende Veranstaltungen
- Konsistenz durch Vorlagen
- Effiziente Terminerstellung
- Odoo sessions-kompatibel

**Schwäche:**
- Höhere initiale Komplexität
- Zwei-Ebenen-Verwaltung erforderlich
- Template-Status zusätzlich zu Instance-Status

---

*Strategy B - Generated: December 12, 2025*
