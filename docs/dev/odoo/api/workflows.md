# Event Workflows (event.workflow)

Event Workflows define agenda templates that can be applied to events, pre-populating them with tracks and sessions.

::: info Community Module
This model is part of the `event_workflow` addon, extending the event_session functionality.
:::

## Overview

```python
class EventWorkflow(models.Model):
    _name = "event.workflow"
    _description = "Event Workflow"
    _order = "name"
    
    name = fields.Char('Name', required=True, translate=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one('res.company', 'Company', required=True)
    event_type_id = fields.Many2one('event.type', string="Default Event Type")
```

## Purpose

Workflows serve as **agenda templates**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event Workflow                                │
│                    "Conference Template"                         │
├─────────────────────────────────────────────────────────────────┤
│  Track Templates:                                               │
│  ├── "Keynotes"                                                 │
│  │   └── Session Templates: "Opening", "Closing"               │
│  ├── "Workshops"                                                │
│  │   └── Session Templates: "Morning WS", "Afternoon WS"       │
│  └── "Networking"                                               │
│      └── Session Templates: "Reception", "Lunch Break"         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Apply to Event
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event Instance                                │
│                    "Annual Conference 2025"                      │
├─────────────────────────────────────────────────────────────────┤
│  Tracks (from template):                                        │
│  ├── "Keynotes" (event.track)                                   │
│  │   └── Sessions: "Opening" Oct 6 09:00                       │
│  ├── "Workshops" (event.track)                                  │
│  │   └── Sessions: "Morning WS" Oct 6 10:00                    │
│  └── "Networking" (event.track)                                 │
│      └── Sessions: "Reception" Oct 6 18:00                     │
└─────────────────────────────────────────────────────────────────┘
```

## Core Fields

### Track Templates

```python
track_template_ids = fields.One2many(
    comodel_name="event.workflow.track",
    inverse_name="workflow_id",
    string="Track Templates"
)
```

### Session Templates

```python
session_template_ids = fields.One2many(
    comodel_name="event.workflow.session",
    inverse_name="workflow_id",
    string="Session Templates"
)
```

## Track Template Model

```python
class EventWorkflowTrack(models.Model):
    _name = "event.workflow.track"
    _description = "Track Template"
    _order = "sequence, name"
    
    workflow_id = fields.Many2one('event.workflow', required=True, ondelete='cascade')
    name = fields.Char('Name', required=True, translate=True)
    sequence = fields.Integer('Sequence', default=10)
    color = fields.Integer('Color Index')
    
    session_template_ids = fields.One2many(
        'event.workflow.session',
        'track_template_id',
        string="Session Templates"
    )
```

## Session Template Model

```python
class EventWorkflowSession(models.Model):
    _name = "event.workflow.session"
    _description = "Session Template"
    _order = "sequence, name"
    
    workflow_id = fields.Many2one('event.workflow', required=True, ondelete='cascade')
    track_template_id = fields.Many2one('event.workflow.track', string="Track Template")
    
    name = fields.Char('Name', required=True, translate=True)
    sequence = fields.Integer('Sequence', default=10)
    day_offset = fields.Integer(
        'Day Offset',
        default=0,
        help="Days from event start (0 = first day, 1 = second day, etc.)"
    )
    time_start = fields.Float('Start Time')  # 9.5 = 9:30
    time_end = fields.Float('End Time')
    duration = fields.Float('Duration', compute='_compute_duration')
```

## Workflow Application Process

When a workflow is applied to an event:

### 1. Create Tracks

```python
def _apply_track_templates(self, event):
    for track_tmpl in self.track_template_ids:
        self.env['event.track'].create({
            'event_id': event.id,
            'name': track_tmpl.name,
            'color': track_tmpl.color,
        })
```

### 2. Create Sessions

```python
def _apply_session_templates(self, event):
    for session_tmpl in self.session_template_ids:
        # Calculate actual datetime from offset
        session_date = event.date_begin + timedelta(days=session_tmpl.day_offset)
        start_time = session_date.replace(
            hour=int(session_tmpl.time_start),
            minute=int((session_tmpl.time_start % 1) * 60)
        )
        
        self.env['event.session'].create({
            'event_id': event.id,
            'name': session_tmpl.name,
            'date_begin': start_time,
            'date_end': start_time + timedelta(hours=session_tmpl.duration),
        })
```

## Example Workflow

### Conference Template

```json
{
  "name": "Standard Conference",
  "track_templates": [
    { "name": "Main Stage", "sequence": 10, "color": 1 },
    { "name": "Workshop Room A", "sequence": 20, "color": 2 },
    { "name": "Workshop Room B", "sequence": 30, "color": 3 },
    { "name": "Networking Area", "sequence": 40, "color": 4 }
  ],
  "session_templates": [
    { "name": "Welcome & Registration", "day_offset": 0, "time_start": 8.5, "time_end": 9.0, "track": "Main Stage" },
    { "name": "Opening Keynote", "day_offset": 0, "time_start": 9.0, "time_end": 10.0, "track": "Main Stage" },
    { "name": "Coffee Break", "day_offset": 0, "time_start": 10.0, "time_end": 10.5, "track": "Networking Area" },
    { "name": "Morning Workshop", "day_offset": 0, "time_start": 10.5, "time_end": 12.0, "track": "Workshop Room A" },
    { "name": "Lunch", "day_offset": 0, "time_start": 12.0, "time_end": 13.0, "track": "Networking Area" },
    { "name": "Afternoon Workshop", "day_offset": 0, "time_start": 13.0, "time_end": 15.0, "track": "Workshop Room B" },
    { "name": "Closing Keynote", "day_offset": 0, "time_start": 15.0, "time_end": 16.0, "track": "Main Stage" },
    { "name": "Networking Reception", "day_offset": 0, "time_start": 16.0, "time_end": 18.0, "track": "Networking Area" }
  ]
}
```

### Multi-Day Event

```json
{
  "name": "Two-Day Workshop",
  "session_templates": [
    { "name": "Day 1: Fundamentals", "day_offset": 0, "time_start": 9.0, "time_end": 17.0 },
    { "name": "Day 1: Practice Lab", "day_offset": 0, "time_start": 17.0, "time_end": 19.0 },
    { "name": "Day 2: Advanced Topics", "day_offset": 1, "time_start": 9.0, "time_end": 17.0 },
    { "name": "Day 2: Final Project", "day_offset": 1, "time_start": 17.0, "time_end": 19.0 }
  ]
}
```

## Time Float Representation

Odoo uses float values for times:

| Float | Time |
|-------|------|
| 8.0 | 08:00 |
| 8.5 | 08:30 |
| 9.0 | 09:00 |
| 9.25 | 09:15 |
| 12.75 | 12:45 |
| 17.5 | 17:30 |

### Conversion

```typescript
// Float to time
function floatToTime(float: number): string {
    const hours = Math.floor(float)
    const minutes = Math.round((float % 1) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Time to float
function timeToFloat(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours + (minutes / 60)
}
```

## API Usage

### List Workflows

```typescript
const workflows = await odoo.searchRead(
    'event.workflow',
    [['active', '=', true]],
    ['id', 'name', 'event_type_id']
)
```

### Get Workflow with Templates

```typescript
const workflow = await odoo.searchRead(
    'event.workflow',
    [['id', '=', workflowId]],
    ['name', 'track_template_ids', 'session_template_ids']
)

const tracks = await odoo.searchRead(
    'event.workflow.track',
    [['workflow_id', '=', workflowId]],
    ['name', 'sequence', 'color']
)

const sessions = await odoo.searchRead(
    'event.workflow.session',
    [['workflow_id', '=', workflowId]],
    ['name', 'day_offset', 'time_start', 'time_end', 'track_template_id']
)
```

## Integration with Crearis

### Future Implementation

1. **Workflow Selector** - Choose workflow when creating event
2. **Preview Mode** - Show schedule before applying
3. **Customization** - Modify generated sessions after application
4. **Domain-Specific Templates** - Different workflows per domain

### Domain Mapping

```typescript
const domainWorkflows = {
    1: ['standard-daem'],      // DAEM: Basic event
    4: ['conference-dasei', 'workshop-dasei'],  // DASEI: Multiple options
    5: ['basic-kisum'],        // KISUM: Simple
    6: ['masterclass-dakou']   // DAKOU: Course format
}
```
