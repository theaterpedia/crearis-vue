# Event Sessions (event.session)

Sessions are sub-events within a parent event, providing detailed scheduling with individual registrations. This module is the [OCA event_session](https://github.com/OCA/event/tree/16.0/event_session) addon, maintained by the Odoo Community Association.

::: info Module Origin
**OCA/event** repository, branch 16.0  
License: AGPL-3.0  
Contributors: Tecnativa, Moka Tourisme, Therp
:::

## Overview

The session system allows events to be broken down into multiple time slots, each with:
- Independent date/time scheduling
- Separate seat tracking and availability
- Individual registrations per session
- Automated mail scheduling per session
- Stage/kanban state tracking

## Architecture

### Delegation Inheritance

Sessions use Odoo's **delegation inheritance** (`_inherits`) from `event.event`:

```python
class EventSession(models.Model):
    _name = "event.session"
    _inherits = {"event.event": "event_id"}  # Delegation
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Event session"
    _order = "date_begin"
```

This means:
- Each session has its own record in `event_session` table
- Links to a parent `event.event` record via `event_id`
- **Inherits all fields** from `event.event` transparently
- Can override specific fields with session-specific values

### Parent-Child Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                    event.event                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id: 1                                                 │  │
│  │ name: "Annual Conference 2025"                        │  │
│  │ use_sessions: true                                    │  │
│  │ session_count: 3 (computed)                           │  │
│  │ date_begin: 2025-10-06 09:00 (computed from sessions) │  │
│  │ date_end: 2025-10-07 17:00 (computed from sessions)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │ event_id      │ event_id      │ event_id
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  event.session   │ │  event.session   │ │  event.session   │
│  id: 1           │ │  id: 2           │ │  id: 3           │
│  "Day 1 Morning" │ │  "Day 1 Afternoon"│ │  "Day 2"        │
│  09:00-12:30     │ │  14:00-17:30     │ │  09:00-17:00     │
│  seats_max: 50   │ │  seats_max: 50   │ │  seats_max: 100  │
│  seats_used: 35  │ │  seats_used: 30  │ │  seats_used: 45  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Model Files Reference

| File | Model | Purpose |
|------|-------|---------|
| `event_event.py` | `event.event` | Extends parent with `use_sessions`, computed dates |
| `event_session.py` | `event.session` | Core session model |
| `event_registration.py` | `event.registration` | Extends with `session_id` |
| `event_type.py` | `event.type` | Adds `use_sessions` template field |
| `event_session_timeslot.py` | `event.session.timeslot` | Time slot templates |
| `event_mail.py` | `event.mail` | Session mail scheduler template |
| `event_mail_session.py` | `event.mail.session` | Per-session mail scheduler |
| `event_mail_registration.py` | `event.mail.registration` | Session mail registration |

## Parent Event Extensions

When sessions are enabled, the parent event behaves differently:

### event.event Additions

```python
class EventEvent(models.Model):
    _inherit = "event.event"

    use_sessions = fields.Boolean(
        string="Event Sessions",
        help="Manage multiple sessions per event",
        compute="_compute_use_sessions",
        store=True,
        readonly=False,
    )
    session_ids = fields.One2many(
        comodel_name="event.session",
        inverse_name="event_id",
        string="Sessions",
    )
    session_count = fields.Integer(
        string="Sessions Count",
        compute="_compute_session_count",
    )
```

### Automatic Date Computation

When `use_sessions=True`, the parent event's dates are **computed from sessions**:

```python
@api.depends("use_sessions", "session_ids.date_begin")
def _compute_date_begin(self):
    """Event date_begin = MIN(session.date_begin)"""
    groups = self.env["event.session"].read_group(
        domain=[("event_id", "in", session_records.ids)],
        fields=["event_id", "date_begin:min"],
        groupby=["event_id"],
    )
    # ...

@api.depends("use_sessions", "session_ids.date_end")
def _compute_date_end(self):
    """Event date_end = MAX(session.date_end)"""
    groups = self.env["event.session"].read_group(
        domain=[("event_id", "in", session_records.ids)],
        fields=["event_id", "date_end:max"],
        groupby=["event_id"],
    )
    # ...
```

### Seat Availability Bypass

For session-based events, seat checks happen at session level:

```python
def _check_seats_availability(self, minimal_availability=0):
    # OVERRIDE: Ignore constraint for events with sessions
    # Seat availability is checked on each session, not here.
    session_records = self.filtered("use_sessions")
    regular_records = self - session_records
    return super(EventEvent, regular_records)._check_seats_availability(...)
```

## Session Model Fields

### Core Fields

```python
class EventSession(models.Model):
    _name = "event.session"
    
    active = fields.Boolean(default=True)
    
    event_id = fields.Many2one(
        comodel_name="event.event",
        string="Parent Event",
        domain=[("use_sessions", "=", True)],
        ondelete="cascade",
        auto_join=True,
        index=True,
        required=True,
    )
```

### Date/Time Fields

```python
date_begin = fields.Datetime(string="Start Date", required=True)
date_end = fields.Datetime(string="End Date", required=True)

# Localized display strings
date_begin_located = fields.Char(
    string="Start Date Located",
    compute="_compute_date_begin_located",
)
date_end_located = fields.Char(
    string="End Date Located",
    compute="_compute_date_end_located",
)
```

### Status Flags

```python
is_ongoing = fields.Boolean(
    compute="_compute_is_ongoing",
    search="_search_is_ongoing",
)
is_finished = fields.Boolean(
    compute="_compute_is_finished",
    search="_search_is_finished",
)
is_one_day = fields.Boolean(compute="_compute_is_one_day")
```

### Seat Management

```python
registration_ids = fields.One2many(
    comodel_name="event.registration",
    inverse_name="session_id",
    string="Attendees",
)
seats_reserved = fields.Integer(
    string="Reserved Seats",
    compute="_compute_seats",
    store=True,
)
seats_available = fields.Integer(
    string="Available Seats",
    compute="_compute_seats_available",
    store=True,
)
seats_unconfirmed = fields.Integer(
    string="Unconfirmed Seat Reservations",
    compute="_compute_seats",
    store=True,
)
seats_used = fields.Integer(
    string="Number of Participants",
    compute="_compute_seats",
    store=True,
)
seats_expected = fields.Integer(
    string="Number of Expected Attendees",
    compute="_compute_seats_expected",
    compute_sudo=True,
)
```

### Registration Status

```python
event_registrations_open = fields.Boolean(
    string="Registration open",
    compute="_compute_event_registrations_open",
    compute_sudo=True,
)
event_registrations_sold_out = fields.Boolean(
    string="Sold Out",
    compute="_compute_event_registrations_sold_out",
    compute_sudo=True,
)
```

### Stage & Kanban

```python
stage_id = fields.Many2one(
    comodel_name="event.stage",
    default=lambda self: self.env["event.event"]._get_default_stage_id(),
    group_expand="_read_group_stage_ids",
    tracking=True,
    copy=False,
    ondelete="restrict",
)
kanban_state = fields.Selection(
    selection=lambda self: self.env["event.event"]
        ._fields["kanban_state"].selection,
    default="normal",
    copy=False,
)
kanban_state_label = fields.Char(
    compute="_compute_kanban_state_label",
    store=True,
    tracking=True,
)
```

### Multi-Session Update Feature

Unique to sessions - update multiple sessions at once:

```python
session_update = fields.Selection(
    [
        ("this", "This session"),
        ("subsequent", "This and following event sessions"),
        ("all", "All event sessions"),
    ],
    help="Choose what to do with other event sessions",
    default="this",
    store=False,
)
session_update_message = fields.Text(compute="_compute_session_update_message")
```

::: warning UX Note
This feature is inspired by recurring Calendar Events. When modifying a session, users can choose to apply changes to this session only, subsequent sessions, or all sessions. Note that the "SAVE" button behavior may be confusing - see OCA issue tracker.
:::

## Registrations with Sessions

### Extended Registration Model

```python
class EventRegistration(models.Model):
    _inherit = "event.registration"

    use_sessions = fields.Boolean(related="event_id.use_sessions")
    
    session_id = fields.Many2one(
        comodel_name="event.session",
        string="Session",
        ondelete="restrict",
    )
    
    # Override to get dates from session when applicable
    event_begin_date = fields.Datetime(
        related=None,
        compute="_compute_event_begin_date"
    )
    event_end_date = fields.Datetime(
        related=None,
        compute="_compute_event_end_date"
    )
```

### Date Computation Logic

```python
@api.depends("event_id.date_begin", "session_id.date_begin", "use_sessions")
def _compute_event_begin_date(self):
    for rec in self:
        if rec.use_sessions:
            rec.event_begin_date = rec.session_id.date_begin
        else:
            rec.event_begin_date = rec.event_id.date_begin
```

### Seat Validation

```python
@api.constrains("session_id")
def _check_seats_limit(self):
    session_records = self.filtered("session_id")
    for rec in session_records:
        session = rec.session_id
        if (
            session.seats_limited
            and session.seats_max
            and session.seats_available < (1 if rec.state == "draft" else 0)
        ):
            raise ValidationError(_("No more seats available for this session."))
```

## Session Timeslots

Pre-defined time templates for quick session creation:

```python
class EventSessionTimeslot(models.Model):
    _name = "event.session.timeslot"
    _description = "Event Session Timeslot"
    _order = "time"
    _rec_name = "time"

    _sql_constraints = [
        ("unique_time", "UNIQUE(time)", "The timeslot has to be unique"),
        ("valid_time", "CHECK(time >= 0 AND time <= 24)", 
         "Time has to be between 0:00 and 23:59"),
    ]

    time = fields.Float(required=True)
```

### Time Float Format

Odoo uses float representation for times:

| Float | Time | Calculation |
|-------|------|-------------|
| 8.0 | 08:00 | 8 + 0/60 |
| 8.5 | 08:30 | 8 + 30/60 |
| 9.25 | 09:15 | 9 + 15/60 |
| 12.75 | 12:45 | 12 + 45/60 |
| 17.5 | 17:30 | 17 + 30/60 |

### Parsing Timeslots

```python
def name_create(self, name):
    """Create timeslot from HH:MM string"""
    try:
        tm = time.strptime(name.strip(), "%H:%M")
    except ValueError as e:
        raise ValidationError(
            _("The timeslot has to be defined in HH:MM format")
        ) from e
    vals = {"time": time_as_float_time(tm)}
    return self.create(vals).name_get()[0]
```

## Event Type Configuration

Event types can default to session mode:

```python
class EventType(models.Model):
    _inherit = "event.type"

    use_sessions = fields.Boolean(
        string="Event Sessions",
        help="Manage multiple sessions per event",
    )
```

When creating an event from a type with `use_sessions=True`, the event automatically enables sessions.

## Mail Scheduling for Sessions

Sessions have their own mail scheduling system parallel to the event mail system.

### event.mail Extensions

```python
class EventMail(models.Model):
    _inherit = "event.mail"

    use_sessions = fields.Boolean(related="event_id.use_sessions")
    
    session_scheduler_ids = fields.One2many(
        comodel_name="event.mail.session",
        inverse_name="scheduler_id",
        string="Session Mails",
    )
```

For session-based events, mail schedulers act as **templates** - the actual scheduling happens via `event.mail.session` records.

### event.mail.session Model

```python
class EventMailSession(models.Model):
    _name = "event.mail.session"
    _inherits = {"event.mail": "scheduler_id"}
    _description = "Event Session Automated Mailing"

    scheduler_id = fields.Many2one(
        comodel_name="event.mail",
        string="Event Mail Scheduler",
        ondelete="cascade",
        auto_join=True,
        required=True,
    )
    session_id = fields.Many2one(
        comodel_name="event.session",
        string="Session",
        ondelete="cascade",
        required=True,
    )
    scheduled_date = fields.Datetime(
        compute="_compute_scheduled_date",
        store=True,
    )
    mail_done = fields.Boolean("Sent", copy=False, readonly=True)
    mail_count_done = fields.Integer("# Sent", copy=False, readonly=True)
```

### Schedule Date Computation

```python
@api.depends("session_id", "session_id.date_begin", "session_id.date_end", ...)
def _compute_scheduled_date(self):
    for scheduler in self:
        if scheduler.interval_type == "after_sub":
            date, sign = scheduler.session_id.create_date, 1
        elif scheduler.interval_type == "before_event":
            date, sign = scheduler.session_id.date_begin, -1
        else:
            date, sign = scheduler.session_id.date_end, 1
        delta = _INTERVALS[scheduler.interval_unit](sign * scheduler.interval_nbr)
        scheduler.scheduled_date = date + delta if date else False
```

## XML-RPC API Usage

### Check if Event Uses Sessions

```typescript
const events = await odoo.searchRead(
    'event.event',
    [['id', '=', eventId]],
    ['name', 'use_sessions', 'session_count']
)

if (events[0].use_sessions) {
    // Fetch sessions
}
```

### Fetch Sessions for Event

```typescript
const sessions = await odoo.searchRead(
    'event.session',
    [['event_id', '=', eventId]],
    [
        'id', 'name', 'active',
        'date_begin', 'date_end',
        'date_begin_located', 'date_end_located',
        'is_ongoing', 'is_finished', 'is_one_day',
        'seats_max', 'seats_available', 'seats_used',
        'seats_reserved', 'seats_unconfirmed', 'seats_expected',
        'event_registrations_open', 'event_registrations_sold_out',
        'stage_id', 'kanban_state', 'kanban_state_label'
    ],
    { order: 'date_begin' }
)
```

### Expected Response

```json
[
  {
    "id": 1,
    "name": "Day 1 - Morning Session",
    "active": true,
    "date_begin": "2025-10-06 09:00:00",
    "date_end": "2025-10-06 12:30:00",
    "date_begin_located": "Oct 6, 2025 9:00 AM (Europe/Berlin)",
    "date_end_located": "Oct 6, 2025 12:30 PM (Europe/Berlin)",
    "is_ongoing": false,
    "is_finished": false,
    "is_one_day": true,
    "seats_max": 50,
    "seats_available": 15,
    "seats_used": 35,
    "seats_reserved": 35,
    "seats_unconfirmed": 0,
    "seats_expected": 35,
    "event_registrations_open": true,
    "event_registrations_sold_out": false,
    "stage_id": [2, "Confirmed"],
    "kanban_state": "normal",
    "kanban_state_label": "Confirmed"
  }
]
```

### Create a Session

```typescript
const sessionId = await odoo.create('event.session', {
    event_id: eventId,
    name: 'New Workshop Session',
    date_begin: '2025-10-07 14:00:00',
    date_end: '2025-10-07 17:00:00',
    seats_max: 30
})
```

### Fetch Registrations for Session

```typescript
const registrations = await odoo.searchRead(
    'event.registration',
    [
        ['event_id', '=', eventId],
        ['session_id', '=', sessionId]
    ],
    ['id', 'name', 'email', 'state', 'event_begin_date', 'event_end_date']
)
```

## Usage Patterns

### Creating Sessions via Wizard

From Odoo UI:
1. Go to Events > Sessions
2. Create sessions associated with an event

Or:
1. Go to an event with `use_sessions=True`
2. Use the sessions wizard to create sessions according to a schedule

### API-Based Session Management

```typescript
// 1. Ensure event has use_sessions enabled
await odoo.write('event.event', [eventId], { use_sessions: true })

// 2. Create multiple sessions
const sessionData = [
    { event_id: eventId, name: 'Morning', date_begin: '...', date_end: '...' },
    { event_id: eventId, name: 'Afternoon', date_begin: '...', date_end: '...' }
]

for (const session of sessionData) {
    await odoo.create('event.session', session)
}

// 3. Event dates are now auto-computed from sessions
```

## Important Constraints

### Cannot Toggle Sessions with Registrations

```python
def write(self, vals):
    if "use_sessions" in vals:
        if any(
            rec.use_sessions != vals["use_sessions"] and rec.registration_ids
            for rec in self
        ):
            raise ValidationError(
                _("You can't enable/disable sessions on events with registrations.")
            )
```

### Disabling Sessions Deletes All Sessions

```python
if not vals["use_sessions"]:
    self.with_context(active_test=False).session_ids.unlink()
```

### Session Seat Constraint

```python
@api.constrains("seats_max", "seats_available", "seats_limited")
def _check_seats_limit(self):
    for session in self.filtered(lambda s: s.seats_limited and s.seats_max):
        if session.seats_available < 0:
            raise ValidationError(
                _("No more available seats for session '%s'.") % session.name
            )
```

## Best Practices

1. **Enable `use_sessions` early** - Before any registrations are created
2. **Use event types** - Set `use_sessions=True` on event types for consistency
3. **Timeslot templates** - Create common timeslots for quick session creation
4. **Check availability** - Always verify `seats_available` before registration
5. **Use session mail schedulers** - Don't rely on parent event mail for session notifications

## Related Documentation

- [Events Entity](../entities/events.md) - Parent event model
- [Events API](./events.md) - Event API reference
- [Workflows](./workflows.md) - Agenda templates
