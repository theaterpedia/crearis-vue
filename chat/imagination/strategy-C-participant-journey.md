# Strategy C: "Der Teilnehmer-Zyklus"
## Event Workflow - Participant Journey Principle

**Date:** December 12, 2025  
**First Principle:** The participant's journey defines the workflow. From discovery to registration to participation to content creation.

---

## Grundprinzip

> **"Der Teilnehmer wird zum Mitwirkenden."**  
> Jeder Teilnehmer durchläuft einen Reifeprozess: Entdecken → Anmelden → Teilnehmen → Beitragen. Die Event-Status spiegeln diese Phasen wider.

---

## 2-3 Basis-Workflow-Schritte

### Schritt 1: "Zur Anmeldung öffnen"
**Draft → Released**

Das Event wird für Anmeldungen geöffnet. Teilnehmer können sich registrieren.

**Deutsche Interaktion:**
- Button: **"Anmeldung öffnen"**
- Bestätigung: *"Das Event ist jetzt buchbar. Teilnehmer können sich anmelden."*
- Status-Badge: `📖 Anmeldung offen`

### Schritt 2: "Event starten"
**Released → Confirmed (running)**

Das Event findet statt. Angemeldete Teilnehmer werden zu aktiven Teilnehmern.

**Deutsche Interaktion:**
- Button: **"Event starten"**
- Automatisch: Teilnehmer-Rolle aktiviert
- Bestätigung: *"Das Event läuft. Teilnehmer haben jetzt erweiterte Rechte."*
- Status-Badge: `🎭 Läuft`

### Schritt 3: "Zur Dokumentation freigeben"
**Confirmed → Archived (with content)**

Das Event ist vorbei. Teilnehmer können jetzt Inhalte (Posts) erstellen.

**Deutsche Interaktion:**
- Button: **"Dokumentation aktivieren"**
- Info: *"Teilnehmer können jetzt ihre Erfahrungen teilen."*
- Status-Badge: `📝 Dokumentation`

---

## 10-15 sysreg_config Einträge

```sql
-- ============================================
-- STRATEGY C: Participant Journey Workflow
-- ============================================

-- DISCOVERY PHASE (Event visible but not bookable)

-- 1. Draft events visible to team only
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_draft_read_member',
 276843304, 'Team sieht Event-Entwürfe', 'config', 'option');

-- 2. Open registration (Draft → Released)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_draft_released_P_owner',
 271255592, 'Anmeldung öffnen', 'config', 'category');

-- REGISTRATION PHASE (Public can see and book)

-- 3. Released events visible to all (discovery)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_read_anonym',
 41953832, 'Veröffentlichte Events öffentlich', 'config', 'option');

-- 4. Logged-in users can register (creates e_participant)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_register_partner',
 84030504, 'Partner können sich anmelden', 'config', 'option');

-- 5. Registered participants can see more details
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_released_read_e_participant',
 142675496, 'Angemeldete sehen Details', 'config', 'option');

-- RUNNING PHASE (Event is happening)

-- 6. Start event (Released → Confirmed)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_released_confirmed_P_owner',
 271386664, 'Event starten', 'config', 'category');

-- 7. Running event: participants gain more access
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_confirmed_update_e_participant',
 159485480, 'Teilnehmer können während Event interagieren', 'config', 'option');

-- 8. Participants can comment during event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_confirmed_comment_e_participant',
 151096872, 'Teilnehmer können kommentieren', 'config', 'option');

-- DOCUMENTATION PHASE (Post-event content creation)

-- 9. End event, open documentation (Confirmed → Archived)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_transition_confirmed_archived_P_owner',
 271648808, 'Dokumentation aktivieren', 'config', 'category');

-- 10. Participants can create posts after event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('post_create_e_participant',
 159452960, 'Teilnehmer können Beiträge erstellen', 'config', 'option');

-- 11. Posts from participants visible to all participants
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('post_released_read_e_participant',
 142609440, 'Teilnehmer-Beiträge für Gruppe sichtbar', 'config', 'option');

-- 12. Archived events still visible (documentation)
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('event_archived_read_e_participant',
 142741032, 'Vergangene Events für Teilnehmer sichtbar', 'config', 'option');

-- 13. Participants can upload images after event
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('image_create_e_participant',
 159452976, 'Teilnehmer können Bilder hochladen', 'config', 'option');

-- 14. e_participant posts need review before public
INSERT INTO sysreg_config (name, value, description, tagfamily, taglogic) VALUES
('post_transition_draft_review_e_participant',
 143002400, 'Teilnehmer-Beitrag zur Prüfung', 'config', 'category');
```

---

## Dataflow zur UI

### Participant Dashboard View

```
┌──────────────────────────────────────────────────────────────────┐
│ 👤 Meine Teilnahmen                                       🔍     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📅 Anstehend                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 15. Jan │ Impro-Workshop  │ 📖 Angemeldet │ [Details]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ 🎭 Läuft gerade                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ HEUTE  │ Körperarbeit     │ 🎭 Live │ [Beitreten] [💬 Chat] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ 📝 Dokumentation möglich                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 08. Jan │ Theorie-Seminar │ 📝 Doku │ [✏️ Beitrag] [📷 Bilder]│ │
│ │ 01. Jan │ Neujahrs-Special│ 📝 Doku │ [2 eigene Beiträge]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Participant Role Transitions

```typescript
// useParticipantJourney.ts
interface ParticipantJourney {
    eventId: number
    userId: number
    phase: 'discovered' | 'registered' | 'active' | 'documenting' | 'alumni'
    capabilities: {
        canRegister: boolean
        canParticipate: boolean
        canComment: boolean
        canCreatePost: boolean
        canUploadImages: boolean
    }
}

const useParticipantJourney = (eventId: Ref<number>) => {
    const event = ref<Event | null>(null)
    const registration = ref<Registration | null>(null)
    
    const phase = computed(() => {
        if (!registration.value) return 'discovered'
        if (event.value?.status < STATUS.CONFIRMED) return 'registered'
        if (event.value?.status === STATUS.CONFIRMED) return 'active'
        if (event.value?.status === STATUS.ARCHIVED) return 'documenting'
        return 'alumni'
    })
    
    const capabilities = computed(() => ({
        canRegister: !registration.value && event.value?.seatsAvailable > 0,
        canParticipate: phase.value === 'active',
        canComment: ['active', 'documenting'].includes(phase.value),
        canCreatePost: phase.value === 'documenting',
        canUploadImages: phase.value === 'documenting'
    }))
    
    return { event, registration, phase, capabilities }
}
```

---

## Neue Komponenten

### 1. ParticipantJourneyCard

Zeigt Event aus Teilnehmer-Perspektive:

```
┌────────────────────────────────────────────┐
│ 🎭 Workshop: Improvisation                 │
│ ───────────────────────────────────────────│
│ 📅 15. Januar 2026, 10:00-17:00            │
│ 📍 Theaterzentrum München                  │
│                                            │
│ Dein Status: ✅ Angemeldet                  │
│                                            │
│ ○ ─── ◉ ─── ○ ─── ○                        │
│ Entdeckt Angemeldet Teilnahme Doku         │
│                                            │
│ Nächster Schritt: Teilnahme am 15.01.      │
│                                            │
│ [📋 Details] [❌ Absagen]                   │
└────────────────────────────────────────────┘
```

### 2. DocumentationPrompt

Call-to-Action nach Event-Teilnahme:

```
┌────────────────────────────────────────────┐
│ 📝 Teile deine Erfahrung!                  │
├────────────────────────────────────────────┤
│                                            │
│ Du hast am "Impro-Workshop" teilgenommen.  │
│ Möchtest du deine Eindrücke mit der        │
│ Gruppe teilen?                             │
│                                            │
│ [✏️ Beitrag schreiben]                     │
│ [📷 Bilder hochladen]                      │
│ [⏭️ Später]                                │
│                                            │
└────────────────────────────────────────────┘
```

### 3. ParticipantContentFeed

Beiträge der Teilnehmer eines Events:

```
┌────────────────────────────────────────────────────────────────┐
│ 📖 Dokumentation: Impro-Workshop (15. Jan)                     │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 👤 Marie K. │ 📅 16. Jan │ ✅ Freigegeben                   │ │
│ │ "Ein inspirierender Tag! Besonders die Übung..."           │ │
│ │ 📷 3 Bilder │ 💬 5 Kommentare                               │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 👤 Tom S. │ 📅 16. Jan │ 🔍 In Prüfung                     │ │
│ │ "Mein Feedback zum Workshop..."                            │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Visuelle Design-Beispiele

### Journey Phase Indicators

| Phase | Icon | Color | Badge |
|-------|------|-------|-------|
| Discovered | 👁️ | Gray | Gesehen |
| Registered | ✅ | Blue | Angemeldet |
| Active | 🎭 | Green | Teilnehmend |
| Documenting | 📝 | Orange | Dokumentation |
| Alumni | 🎓 | Purple | Abgeschlossen |

### Capability Badges

```
┌──────────────────────────────────────────────────────────┐
│ Deine Rechte als Teilnehmer:                             │
│ [✅ Kommentieren] [✅ Beitrag erstellen] [✅ Bilder]       │
└──────────────────────────────────────────────────────────┘
```

---

## Odoo-Integration

### Registration Flow

```typescript
// Event registration creates e_participant role
POST /api/odoo/events/:id/register
{
    partner_id: currentUser.odoo_partner_id,
    event_id: eventId
}

// Returns registration with participant role
{
    id: 123,
    event_id: 1,
    partner_id: 456,
    state: 'open',  // → e_participant role active
    date_register: '2026-01-10'
}
```

### Content Linking

```typescript
// Posts created by participants link to event
POST /api/posts
{
    heading: "Mein Workshop-Erlebnis",
    project_id: projectId,
    event_id: eventId,  // Links post to event
    creator_id: userId,
    status: STATUS.DRAFT
}
```

---

## Zusammenfassung

**Stärke dieser Strategie:**
- Teilnehmer-zentriert (user engagement)
- Natürlicher Content-Flow
- Community-Building durch Dokumentation
- Klare Phasen-Übergänge

**Schwäche:**
- Komplexere Rollen-Verwaltung (e_participant)
- Event muss "aktiv" gestartet werden
- Content-Moderation erforderlich

---

*Strategy C - Generated: December 12, 2025*
