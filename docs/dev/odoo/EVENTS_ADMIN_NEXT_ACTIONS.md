# Odoo Events Admin - Next Actions Plan

> Status: **Phase 1 READ working** ✅ (Dec 8, 2025)
> Route: `/admin/events`

## Current State

### ✅ Completed
- [x] XML-RPC parser fixed for nested arrays/structs
- [x] Events API endpoint (`/api/odoo/events`) returning all fields
- [x] TypeScript types for Odoo events (`OdooEvent`, `OdooStageInfo`, etc.)
- [x] `OdooEventsList.vue` component with card grid layout
- [x] `OdooEventCard.vue` displaying:
  - Name, CID, dates, duration badge
  - Domain, location (address_id)
  - Version, edit mode (content/design)
  - Stage badge, status (ENDED/NEW/CANCELLED)
  - Cover image
- [x] Documentation at `/docs/odoo/`

### 🎯 Phase 2: WRITE Operations

#### 2.1 Create Event
- [ ] "Neues Event" button → modal or drawer form
- [ ] Required fields: `name`, `date_begin`, `date_end`, `domain_code`
- [ ] Auto-generate CID based on domain + sequence
- [ ] POST to `/api/odoo/events` → `odoo.create('event.event', {...})`

#### 2.2 Edit Event (Quick Edit)
- [ ] Click edit icon → inline edit or modal
- [ ] Editable fields: `name`, `rectitle`, `teasertext`, `stage_id`
- [ ] PUT to `/api/odoo/events/[id]` → `odoo.write('event.event', [id], {...})`

#### 2.3 Edit Event (Full Edit)
- [ ] Navigate to detail view `/admin/events/[id]`
- [ ] Full form with all Crearis fields
- [ ] Blocks editor integration (from CREARIS-NUXT components)
- [ ] Image management (cover image, gallery)

### 🎯 Phase 3: Event Detail View

#### 3.1 Route Setup
- [ ] Create `/admin/events/[id].vue` or `/admin/events/[id]/index.vue`
- [ ] Fetch single event by ID
- [ ] Display all event fields in organized sections

#### 3.2 Sections
- [ ] **Header**: Name, stage, status badges
- [ ] **Dates & Location**: date_begin, date_end, timezone, address
- [ ] **Content**: rectitle, teasertext, blocks (JSON editor or visual)
- [ ] **Media**: cimg (cover image), gallery
- [ ] **Settings**: domain_code, edit_mode, version, seats config
- [ ] **Sessions** (if `use_sessions=true`): List/manage sessions

### 🎯 Phase 4: Sessions Integration

#### 4.1 Session List
- [ ] API endpoint `/api/odoo/sessions?event_id=X`
- [ ] Display sessions for event with `use_sessions=true`
- [ ] Session cards showing date/time, seats, status

#### 4.2 Session CRUD
- [ ] Create session within event
- [ ] Edit session dates, seats, name
- [ ] Delete session (with confirmation)

### 🎯 Phase 5: Advanced Features

#### 5.1 Filtering & Search
- [ ] Filter by domain (dasei, tp, etc.)
- [ ] Filter by stage (New, Booked, Confirmed, etc.)
- [ ] Filter by status (upcoming, ongoing, ended)
- [ ] Search by name

#### 5.2 Bulk Operations
- [ ] Select multiple events
- [ ] Bulk stage change
- [ ] Bulk domain assignment

#### 5.3 Registration Management
- [ ] View registrations per event
- [ ] Export attendee list
- [ ] Registration stats dashboard

---

## API Endpoints Needed

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/odoo/events` | List events | ✅ |
| GET | `/api/odoo/events/[id]` | Single event | 🔜 |
| POST | `/api/odoo/events` | Create event | 🔜 |
| PUT | `/api/odoo/events/[id]` | Update event | 🔜 |
| DELETE | `/api/odoo/events/[id]` | Delete event | 🔜 |
| GET | `/api/odoo/sessions` | List sessions | 🔜 |
| POST | `/api/odoo/sessions` | Create session | 🔜 |
| PUT | `/api/odoo/sessions/[id]` | Update session | 🔜 |

---

## Quick Wins (Pick-up Points)

### Option A: Single Event View
Create `/admin/events/[id].vue` to display full event details.
**Why**: Foundation for edit functionality.

### Option B: Create Event Modal
Add "Neues Event" modal with basic fields.
**Why**: Immediate write capability, high user value.

### Option C: Inline Stage Edit
Click stage badge → dropdown to change stage.
**Why**: Quick workflow improvement, simple write operation.

---

## Files to Reference

- `src/components/events/OdooEventsList.vue` - List component
- `src/components/events/OdooEventCard.vue` - Card component
- `src/types/odooEvent.ts` - TypeScript types
- `server/api/odoo/events.get.ts` - GET endpoint
- `server/utils/odooRpc.ts` - XML-RPC client

## Similar Patterns to Follow

- `src/views/admin/SysregAdminView.vue` - Admin view structure
- `src/views/admin/ImagesAdminView.vue` - CRUD operations pattern
- `src/components/admin/` - Reusable admin components
