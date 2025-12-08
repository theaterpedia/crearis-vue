# Events Table Refactoring Proposal
**Date:** December 8, 2025  
**Target:** v0.5/v0.6 Preparation  
**Status:** Proposal for Discussion

---

## 1. Current State Analysis

### 1.1 Current Events Table (Migration 000)

```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date_begin TEXT,
    date_end TEXT,
    address_id TEXT,
    user_id TEXT,
    seats_max INTEGER,
    cimg TEXT,
    header_type TEXT,
    rectitle TEXT,
    teaser TEXT,
    version_id TEXT,
    created_at TIMESTAMP,
    updated_at TEXT,
    status TEXT DEFAULT 'active'
)
```

**Issues:**
- No `event_type` field for type discrimination
- No Odoo sync fields (`odoo_xmlid`)
- No `md` field (Crearis-Odoo has it)
- No parent-child relationship for sessions
- Missing `domain_code` / `project_id` (added later)

### 1.2 Current TypeScript Interface

```typescript
export interface Event {
    id: number
    xmlid?: string
    name: string
    teaser?: string
    description?: string
    cimg?: string
    date_begin?: string
    date_end?: string
    start_time?: string
    end_time?: string
    event_type?: string  // Exists in type but not in table!
    isbase: number
    project_id: number
    template?: string
    public_user?: number  // instructor
    location?: number
    status_id: number
    // ...
}
```

### 1.3 Current Components

| Component | Purpose | Data Needs |
|-----------|---------|-----------|
| `ProjectStepEvents.vue` | Event selection in stepper | baseEvents, projectEvents, instructors, locations |
| `EventCard.vue` | Display single event | event, instructors |
| `EventPanel.vue` | Add new event | baseEvents, instructors, locations |

### 1.4 Current API Endpoints

- `GET /api/events` - List with filters (isbase, project, status)
- `POST /api/events` - Create event
- `DELETE /api/events/[id]` - Delete event

---

## 2. Target Architecture

### 2.1 Three Event Types

Based on Odoo analysis, we need to support:

| Type | Description | Example | Duration | Sub-items |
|------|-------------|---------|----------|-----------|
| **A: Simple** | One-day event | "Tages-Workshop" | Same-day start/end | None |
| **B: Conference** | Multi-day with tracks | "Theaterpedia-Konferenz" | Multiple days | `event_tracks` |
| **C: Course** | Recurring sessions | "Montags-Kurs" | Weekly pattern | `event_sessions` |

### 2.2 Proposed Table Schema

```sql
-- Main events table (simplified cache of Odoo)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Odoo sync
    odoo_xmlid TEXT UNIQUE,           -- e.g., "tp.event_event__3"
    sync_status TEXT DEFAULT 'local', -- 'local', 'synced', 'pending'
    
    -- Core fields
    name TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'simple',  -- 'simple', 'conference', 'course'
    
    -- Dates
    date_begin TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    
    -- Course-specific (Type C)
    recurrence_day TEXT,        -- 'monday', 'tuesday', etc.
    recurrence_time TIME,       -- '19:00'
    recurrence_duration INTEGER DEFAULT 120,  -- minutes
    recurrence_weeks INTEGER,   -- number of sessions
    
    -- Relations
    project_id UUID REFERENCES projects(id),
    location_id UUID REFERENCES locations(id),
    organizer_id UUID REFERENCES users(id),
    
    -- Content (Crearis fields)
    md TEXT,                    -- Markdown body
    teaser TEXT,
    cimg TEXT,
    header_type TEXT DEFAULT 'banner',
    
    -- Status (sysreg)
    status INTEGER DEFAULT 1,
    
    -- Parent (for sessions)
    parent_id UUID REFERENCES events(id),
    
    -- Metadata
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event tracks (for Type B: Conference)
-- Simplified from Odoo's event.track
CREATE TABLE event_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    instructor_id UUID REFERENCES users(id),  -- partner_id in Odoo
    
    date TIMESTAMPTZ,
    duration INTEGER DEFAULT 90,  -- minutes
    
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_parent ON events(parent_id);
CREATE INDEX idx_events_odoo ON events(odoo_xmlid) WHERE odoo_xmlid IS NOT NULL;
CREATE INDEX idx_tracks_event ON event_tracks(event_id);
```

### 2.3 Type-Specific Behavior

**Type A: Simple Event**
```typescript
{
  event_type: 'simple',
  date_begin: '2026-01-23T17:00:00',
  date_end: '2026-01-23T21:00:00',  // Same day
  // No recurrence fields
  // No child sessions
}
```

**Type B: Conference**
```typescript
{
  event_type: 'conference',
  date_begin: '2026-01-16T14:00:00',
  date_end: '2026-01-18T14:00:00',  // Multiple days
  // Has tracks:
  tracks: [
    { name: 'Open-Workshop', instructor_id: 123, duration: 90 },
    { name: 'Welthaus-Explorer', instructor_id: 456, duration: 90 }
  ]
}
```

**Type C: Course**
```typescript
{
  event_type: 'course',
  date_begin: '2026-01-19T17:00:00',  // First session
  date_end: '2026-02-16T19:00:00',    // Last session
  recurrence_day: 'monday',
  recurrence_time: '19:00',
  recurrence_duration: 120,
  recurrence_weeks: 5,
  // Sessions auto-generated or synced from Odoo
}
```

---

## 3. Implementation Strategy

### 3.1 Phase 1: Schema Update (v0.4 - Now)

**Migration 059: Events Table Restructure**
- Add `event_type` column
- Add `odoo_xmlid` for future sync
- Add `parent_id` for sessions
- Add `recurrence_*` fields for courses
- Add `md` field
- Create `event_tracks` table

**No data migration needed** - events table is currently empty.

### 3.2 Phase 2: Component Updates (v0.4)

**Update `ProjectStepEvents.vue`:**
- Add event type selector
- Show type-specific fields
- Handle tracks for conferences
- Handle recurrence for courses

**Update `EventCard.vue`:**
- Display event type badge
- Show track count for conferences
- Show session info for courses

**Update `EventPanel.vue`:**
- Multi-step creation based on type
- Track editor for conferences
- Recurrence configurator for courses

### 3.3 Phase 3: API Updates (v0.4)

**Rebuild `GET /api/events`:**
- Include event type in response
- Include track count
- Calculate session count for courses

**Add `GET /api/events/[id]/tracks`:**
- Return tracks for conference events

**Update `POST /api/events`:**
- Handle type-specific fields
- Create tracks atomically

### 3.4 Phase 4: Odoo Sync (v0.5)

**Add XML-RPC sync layer:**
- Fetch events from Odoo by domaincode
- Map `event.event` → `events`
- Map `event.track` → `event_tracks`
- Map `event.session` → child events (parent_id)

---

## 4. UI Mockup

### 4.1 Event Type Selection

```
┌──────────────────────────────────────────────────────┐
│  Neues Event erstellen                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Event-Typ:                                          │
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │ 📅 Einfach │ │ 🏛️ Konferenz │ │ 📚 Kurs    │    │
│  │             │ │             │ │             │    │
│  │ Ein Tag     │ │ Mehrere     │ │ Wöchentlich │    │
│  │             │ │ Tage +      │ │ wiederhol-  │    │
│  │             │ │ Workshops   │ │ end         │    │
│  └─────────────┘ └─────────────┘ └─────────────┘    │
│       ▲                                              │
│       │ (selected)                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4.2 Simple Event Form

```
┌──────────────────────────────────────────────────────┐
│  📅 Einfaches Event                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Name:        [________________________]             │
│                                                      │
│  Datum:       [23.01.2026    ] 📅                   │
│  Zeit:        [17:00] - [21:00]                      │
│                                                      │
│  Ort:         [Eine-Welt-Haus ▾]                    │
│  Leitung:     [Hans Dönitz ▾]                       │
│                                                      │
│  [Erstellen]                                         │
└──────────────────────────────────────────────────────┘
```

### 4.3 Course Form

```
┌──────────────────────────────────────────────────────┐
│  📚 Kursreihe                                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Name:        [Performance im Winter___]             │
│                                                      │
│  Wochentag:   [Montag ▾]                            │
│  Uhrzeit:     [19:00]                                │
│  Dauer:       [2 Stunden ▾]                         │
│                                                      │
│  Startwoche:  [KW 4 / 2026    ] 📅                  │
│  Anzahl:      [5] Wochen                             │
│                                                      │
│  Termine:     Mo 20.01, 27.01, 03.02, 10.02, 17.02  │
│                                                      │
│  Ort:         [Eine-Welt-Haus ▾]                    │
│  Leitung:     [Hans Dönitz ▾]                       │
│                                                      │
│  [Erstellen]                                         │
└──────────────────────────────────────────────────────┘
```

---

## 5. Open Questions

1. **Session generation:** Generate locally or fetch from Odoo?
2. **Track editing:** Inline in event form or separate panel?
3. **Recurrence exceptions:** Support paused weeks in courses?
4. **Odoo push:** Write back to Odoo or read-only cache?

---

## 6. Recommendation

**Immediate (v0.4):**
1. Create migration 059 with new schema
2. Update TypeScript types
3. Update `ProjectStepEvents` with type selector
4. Keep it simple - just the three types

**Defer to v0.5:**
- Odoo sync
- Track management UI
- Session auto-generation from recurrence

**Defer to v0.6:**
- Full event editing
- Registration handling
- Participant management

---

*Proposal created December 8, 2025*
