# Odoo Events Model - Exploration Snapshot
**Date:** December 8, 2025  
**Status:** v0.5/v0.6 Preparation Research  
**Source:** Crearis-Odoo local dev (localhost:8069)

---

## 1. Model Overview

### 1.1 Core Models Discovered

| Model | Records | Purpose | Crearis Extensions |
|-------|---------|---------|-------------------|
| `event.event` | 12 | Parent event entity | Yes (md, header, cid, domain_code) |
| `event.session` | 0 | Sub-events / recurring | Yes (same as event.event - 178 fields) |
| `event.track` | 2 | Talk slots / workshops | No (standard Odoo - 90 fields) |
| `event.registration` | 6 | Participant bookings | Standard + activity |
| `event.event.ticket` | 3 | Ticket types & pricing | Standard |
| `event.stage` | 5 | Event lifecycle stages | Standard |
| `event.type` | ? | Event templates | Standard |
| `calendar.recurrence` | 0 | Recurrence rules | Standard |

### 1.2 Key Configuration Flags

```
use_tracks: boolean    - Enable track/workshop slots (instructor-led)
use_sessions: boolean  - Enable session sub-events (recurring/multi-day)
```

**Important:** These flags are configured per domaincode/website. The `tp` domain may not have `use_sessions=true`, which is why sessions appear empty.

---

## 2. Field Analysis

### 2.1 event.event (175 fields)

**Crearis-specific fields:**
```
md                    - Markdown content body
cid                   - Crearis ID (e.g., "dasei.event-evnt__2")
cimg                  - Cover image reference
domain_code           - Website/project reference
header_type           - "banner", "hero", etc.
header_size           - "prominent", "compact", etc.
aside_options         - Sidebar configuration
footer_options        - Footer configuration
is_demo               - Demo data flag
```

**Standard event fields:**
```
name                  - Event title (supports **bold** for subline)
date_begin/date_end   - Event timespan
website_id            - Linked website [id, domaincode]
organizer_id          - Organizer partner
address_id            - Location partner
stage_id              - Current stage [id, name]
seats_max/used/available - Capacity
registration_ids      - Linked registrations
event_ticket_ids      - Linked ticket types
track_ids             - Linked tracks (if use_tracks)
session_ids           - Linked sessions (if use_sessions)
```

**Activity/messaging fields:**
```
activity_ids          - Scheduled activities
message_ids           - Chatter history
message_follower_ids  - Followers
```

### 2.2 event.session (178 fields)

Inherits almost all fields from `event.event` plus:
```
event_id              - Parent event reference
session_update        - Update trigger field
session_update_message - Update notification
```

**Note:** Sessions are full Crearis entities with `md`, `header_type`, `cid`, etc.

### 2.3 event.track (90 fields)

Standard Odoo track model:
```
name                  - Track/talk title
event_id              - Parent event
partner_id            - Instructor/speaker [id, name]
date/date_end         - Slot time
duration              - Length in hours
stage_id              - Track stage (Proposal, Confirmed, etc.)
location_id           - Room/location
description           - Track description
```

### 2.4 event.registration (States)

```
State Flow:
┌───────┐    confirm    ┌──────┐    attend    ┌──────┐
│ draft │ ───────────▶ │ open │ ───────────▶ │ done │
└───────┘              └──────┘              └──────┘
                           │
                           │ cancel
                           ▼
                       ┌────────┐
                       │ cancel │
                       └────────┘

Fields:
- name: Attendee name
- partner_id: Linked res.partner
- email: Contact email
- event_id: Event reference
- event_ticket_id: Ticket type used
- state: draft|open|done|cancel
- message_ids: Full history (emails, state changes)
```

### 2.5 event.event.ticket

```
name                  - Ticket name
event_id              - Parent event
price                 - Ticket price
seats_max             - Capacity (0 = unlimited)
seats_available       - Remaining
start_sale_datetime   - Sale window start
end_sale_datetime     - Sale window end
```

---

## 3. Sample Data Analysis

### 3.1 Conference with Tracks (id=3)

```json
{
  "name": "Overline for the conference **Theaterpedia-Konferenz**",
  "date_begin": "2026-01-16 14:00:00",
  "date_end": "2026-01-18 14:00:00",
  "use_tracks": false,  // But has tracks!
  "track_ids": [1, 2],
  "website_id": ["tp"],
  "md": "// Comments for Claude about heading syntax..."
}
```

**Tracks:**
| ID | Name | Instructor | Time | Duration |
|----|------|------------|------|----------|
| 1 | Open-Workshop | Benjamin Porps | 2026-01-16 18:30 | 1.5h |
| 2 | Welthaus-Explorer | Rosalin Hertrich | 2026-01-16 18:30 | 1.5h |

### 3.2 Simple Event (id=4)

```json
{
  "name": "Wochenend-Fortbildung (simple)",
  "date_begin": "2026-01-23 17:00:00",
  "date_end": "2026-01-25 14:00:00",
  "registration_ids": [5],
  "event_ticket_ids": [3]
}
```

### 3.3 Registration States Examples

| ID | Name | Event | State | Ticket |
|----|------|-------|-------|--------|
| 1 | Afra Kriss | Konferenz | draft | Konferenz-Anmeldung |
| 2 | Alexander Schmid | Konferenz | open | Tages-Pass |
| 4 | Alexandra Lipold | Konferenz | cancel | Konferenz-Anmeldung |
| 5 | Afra Kriss | Wochenend | open | Workshop-Anmeldung |
| 6 | Kind 1 | Tages-Workshop | done | - |

---

## 4. Chatter / Activity System

### 4.1 How History Works

Every `event.registration` has `message_ids` linking to `mail.message`:

```
Registration State Changes → mail.message (notification)
Confirmation Emails → mail.message (email, full HTML)
Manual Notes → mail.message (comment)
Scheduled Tasks → mail.activity
```

### 4.2 Message Types

```
notification  - System-generated state changes
email         - Sent emails (stored with full HTML)
comment       - Manual notes from users
```

---

## 5. Event Types Mapping for Crearis-Vue

Based on Odoo structure, three event types emerge:

### Type A: Simple One-Day Event
```
Odoo: event.event with date_begin = date_end (same day)
Example: "Tages-Workshop an Schule"
Fields needed: name, date_begin, date_end (same day), address_id
No tracks, no sessions, no recurring
```

### Type B: Multi-Day Event (Conference)
```
Odoo: event.event with use_tracks=true
Sub-items: event.track with partner_id (instructors)
Example: "Theaterpedia-Konferenz" (3 days)
Fields needed: name, date_begin, date_end, tracks[]
```

### Type C: Course (Recurring Sessions)
```
Odoo: event.event with use_sessions=true
Sub-items: event.session (each occurrence)
Example: "Kursreihe Performance im Winter" 
Pattern: Every Monday evening, 2 hours, X weeks
Needs: calendar.recurrence or manual session creation
```

---

## 6. Crearis-Odoo Extensions Summary

The Crearis-Odoo module extends events with:

1. **Markdown support** (`md` field on event.event, event.session)
2. **Header/Hero system** (`header_type`, `header_size`, `header_options`)
3. **Aside/Footer system** (sidebar, footer configuration)
4. **Domain indexing** (`domain_code`, `cid`)
5. **Demo flag** (`is_demo`)
6. **Session toggle** (`use_sessions` - per domaincode config)

These extensions make `event.session` a full Crearis entity, not just a time slot.

---

## 7. Open Questions for v0.5

1. **Session date inheritance:** Why don't sessions update start/end from parent?
2. **Recurrence handling:** Does `calendar.recurrence` link to `event.session`?
3. **Per-domaincode config:** Where is `use_sessions` configured per website?
4. **Track vs Session:** When to use which? (Tracks = parallel slots, Sessions = sequential occurrences?)

---

## 8. References

- Query utility: `scripts/odoo-query.py`
- Planning doc: `chat/spec/v0.5-v0.8-integration-planning.md`
- Odoo source: localhost:8069

---

*Snapshot taken December 8, 2025, 12:00*
