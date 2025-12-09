# Alpha Workaround: Odoo Events Integration

**Created:** December 8, 2025 (Sunday Evening)  
**Purpose:** Bridge solution for 2-3 months until v0.6 "real workflow"  
**Status:** PROPOSAL

---

## Executive Summary

Instead of building event business logic in Vue (then syncing to Odoo later), we:

1. **Create events directly in Odoo** via XML-RPC
2. **Read events from Odoo** to display in Vue  
3. **Use `tasks` table** for admin workflow requests
4. **Leverage existing UI** (AdminTaskCard, AdminTasksList, PostIT comments)

This enables 5-10 project owners to start publishing events **now**, with Hans moderating as admin.

---

## Part 1: What We Have

### Odoo XML-RPC Client (NEW)

```
server/utils/odooRpc.ts     - TypeScript XML-RPC client
server/api/odoo/events.get.ts  - Read events from Odoo
server/api/odoo/events.post.ts - Create events in Odoo
```

### Tasks Table (EXISTING)

```sql
tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'idea',  -- idea, draft, final, reopen, trash, new
    category TEXT DEFAULT 'project',  -- project, base, admin, main
    priority TEXT DEFAULT 'medium',
    record_type TEXT,  -- event, post, location, instructor, participant
    record_id TEXT,
    assigned_to TEXT,
    created_at, updated_at, due_date, completed_at
)
```

**Key insight:** `category = 'admin'` already exists and has UI support!

### Admin UI Components (EXISTING)

| Component | Purpose | Location |
|-----------|---------|----------|
| `AdminTaskCard.vue` | Watch tasks with execute button | `src/components/` |
| `AdminTasksList.vue` | List of admin tasks | `src/components/` |
| `TaskDashboard.vue` | Dashboard showing admin tasks | `src/views/` |

---

## Part 2: Alpha Workflow Design

### Flow: Project Owner Requests Event

```
┌─────────────────────┐
│  Project Owner      │
│  (Vue frontend)     │
└──────────┬──────────┘
           │ 1. Fill "Request Event" form
           ▼
┌─────────────────────┐
│  POST /api/tasks    │
│  category='admin'   │
│  record_type='event'│
│  status='new'       │
└──────────┬──────────┘
           │ 2. Creates admin task
           ▼
┌─────────────────────┐
│  Admin Dashboard    │
│  (Hans sees task)   │
└──────────┬──────────┘
           │ 3. Admin clicks "Execute"
           ▼
┌─────────────────────┐
│  POST /api/odoo/    │
│  events             │
│  (creates in Odoo)  │
└──────────┬──────────┘
           │ 4. Task marked 'final'
           ▼
┌─────────────────────┐
│  Event visible in   │
│  GET /api/odoo/     │
│  events             │
└─────────────────────┘
```

### Three Event Types

| Type | Description | Odoo Mapping |
|------|-------------|--------------|
| `simple_oneday` | Single date, no sessions | `event.event` only |
| `multiple_days` | Date range, no sessions | `event.event` with date_begin ≠ date_end |
| `course` | Multiple sessions over time | `event.event` + `event.session` (Odoo-side) |

---

## Part 3: Implementation Tasks

### Phase 1: Wire Odoo Endpoints (DONE ✅)

- [x] `server/utils/odooRpc.ts` - XML-RPC client
- [x] `server/api/odoo/events.get.ts` - Read events
- [x] `server/api/odoo/events.post.ts` - Create events

### Phase 2: Admin Task Integration

#### 2.1 Add `request_type` field to tasks

For alpha, we reuse tasks with new semantics:

```typescript
// When category='admin' and record_type='event':
// - status='new' → pending admin review
// - status='draft' → admin working on it
// - status='final' → created in Odoo
// - status='trash' → rejected

// Store request details in description (JSON):
{
    "event_name": "Workshop XYZ",
    "date_begin": "2026-03-15 09:00:00",
    "date_end": "2026-03-15 17:00:00",
    "event_type": "simple_oneday",
    "requested_by": "user@example.com",
    "project_id": 123
}
```

#### 2.2 Create "Request Event" Form

New component: `src/components/EventRequestForm.vue`

```vue
<template>
    <form @submit.prevent="submitRequest">
        <input v-model="name" placeholder="Event name" required />
        <select v-model="eventType">
            <option value="simple_oneday">Simple One-Day Event</option>
            <option value="multiple_days">Multiple Days</option>
            <option value="course">Course (with sessions)</option>
        </select>
        <input v-model="dateBegin" type="datetime-local" required />
        <input v-model="dateEnd" type="datetime-local" required />
        <textarea v-model="description" placeholder="Description" />
        <button type="submit">Request Event</button>
    </form>
</template>
```

#### 2.3 Extend AdminTaskCard for Event Requests

When task has `record_type='event'` and `category='admin'`:

- Show event details parsed from description JSON
- "Execute" button → calls `/api/odoo/events` POST
- On success → update task status to 'final'

#### 2.4 Add PostIT Comments to Event Requests

Enable comments on admin tasks:
- Project owner can add notes
- Admin can ask questions
- Creates audit trail

```typescript
// Comment on admin task:
entity_type: 'task'  // NEW - add to comments entity_type CHECK
entity_id: task.id
project_id: task.project_id  // or derived from request JSON
```

### Phase 3: Display Odoo Events

#### 3.1 Events List View

New component: `src/views/OdooEventsView.vue`

- Fetches from `/api/odoo/events`
- Filters by project (if project owner)
- Shows all events (if admin)

#### 3.2 Event Card Component

New component: `src/components/OdooEventCard.vue`

- Displays event from Odoo data
- Shows state (draft, confirm, done, cancel)
- Links to Odoo backend for editing (admin only)

---

## Part 4: Migration Requirements

### 4.1 Update comments table (Already Done ✅)

Migration 057 already supports:
```sql
entity_type TEXT CHECK (entity_type IN ('post', 'project', 'event', 'image'))
```

**Need to add:** `'task'` to the CHECK constraint.

### 4.2 No new tables needed!

We reuse:
- `tasks` table with `category='admin'`
- `comments` table for PostIT on tasks
- Odoo `event.event` via XML-RPC

---

## Part 5: Sysreg Config Integration

### Current Task Statuses

From sysreg, tasks use these statuses:
- `new` (0) - Just created
- `idea` (1) - Under consideration
- `draft` (2) - Work in progress
- `active` (4) - (not used for admin tasks)
- `final` (5) - Completed
- `reopen` (8) - Reopened for changes
- `trash` (16) - Rejected/deleted

### Alpha Workflow Mapping

| Admin Task Status | Meaning |
|-------------------|---------|
| `new` | Project owner submitted request |
| `draft` | Admin is reviewing/processing |
| `final` | Event created in Odoo |
| `trash` | Request rejected |
| `reopen` | Changes needed from project owner |

---

## Part 6: Testing Plan

### Test Scenario 1: Happy Path

1. Project owner opens "Request Event" form
2. Fills in: "Test Workshop", 2026-03-15, simple_oneday
3. Submits → Task created with `category='admin'`, `status='new'`
4. Admin sees task in TaskDashboard
5. Admin clicks "Execute"
6. Event created in Odoo
7. Task updated to `status='final'`
8. Event appears in OdooEventsView

### Test Scenario 2: With Comments

1. Project owner submits request
2. Admin adds PostIT comment: "Which room?"
3. Project owner replies: "Room A"
4. Admin executes
5. Comment thread preserved for audit

### Test Scenario 3: Rejection

1. Project owner submits request
2. Admin reviews, finds issue
3. Admin sets `status='trash'` with comment explaining why
4. Project owner sees rejected status

---

## Part 7: File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `server/utils/odooRpc.ts` | ✅ XML-RPC client |
| `server/api/odoo/events.get.ts` | ✅ Read events |
| `server/api/odoo/events.post.ts` | ✅ Create events |
| `src/components/EventRequestForm.vue` | Request form |
| `src/views/OdooEventsView.vue` | Events list |
| `src/components/OdooEventCard.vue` | Event display |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/AdminTaskCard.vue` | Handle event requests |
| `src/views/TaskDashboard.vue` | Add event request section |
| `server/database/migrations/057_*.ts` | Add 'task' to entity_type |

---

## Part 8: Environment Setup

### Required Environment Variables

```bash
# .env
ODOO_URL=http://localhost:8069
ODOO_DATABASE=crearis
ODOO_USERNAME=admin
ODOO_API_KEY=your-api-key-here
```

### Odoo Custom Fields (to create in Odoo)

```
x_studio_project_id  - Integer, links event to Vue project
x_studio_event_type  - Selection: simple_oneday, multiple_days, course
```

---

## Part 9: Timeline

### Day 1 (Today/Tomorrow)
- [x] Create odooRpc.ts
- [x] Create /api/odoo/events endpoints
- [ ] Test connection to production Odoo
- [ ] Create EventRequestForm.vue

### Day 2
- [ ] Extend AdminTaskCard for event requests
- [ ] Add PostIT to tasks (update migration 057)
- [ ] Create OdooEventsView.vue

### Day 3
- [ ] End-to-end testing
- [ ] Deploy to production
- [ ] Brief project owners on workflow

---

## Part 10: Exit Criteria for v0.6

This alpha workaround will be replaced when:

1. ✅ Events "confirmed" barrier is implemented
2. ✅ Direct event editing in Vue (no admin middleman)
3. ✅ Automatic Odoo sync on confirm
4. ✅ Registration system goes live

Until then, this bridge serves the immediate need of getting events published.

---

*This is an alpha workaround, not the final architecture. It trades elegance for speed-to-value.*
