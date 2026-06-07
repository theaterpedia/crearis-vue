# Events (event.event)

The Crearis event model extends Odoo's standard `event.event` with rich content fields, domain assignment, and flexible configuration.

## Model Definition

```python
class EventEvent(models.Model):
    _name = 'event.event'
    _inherit = ["event.event", "web.options.abstract", "demo.data.mixin"]
    _rec_name = "rectitle"
```

### Inheritance

- `event.event` - Standard Odoo Events module
- `web.options.abstract` - [Web options mixin](../concepts/web-options.md) for page section configuration
- `demo.data.mixin` - Demo data detection

## Crearis Custom Fields

### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `teasertext` | Text | Short teaser/description |
| `schedule` | Text | Schedule overview text |
| `md` | Text | Markdown content body |
| `blocks` | Json | Content blocks array |
| `cimg` | Text | Hero image URL (Cloudinary) |

### Header/Presentation

| Field | Type | Options | Default |
|-------|------|---------|---------|
| `header_type` | Selection | simple, columns, banner, cover, bauchbinde | simple |
| `header_size` | Selection | mini, medium, prominent, full | mini |

### Edit Control

```python
edit_mode = fields.Selection(
    selection=[
        ('locked', 'Locked'),       # No editing allowed
        ('blocks', 'edit blocks'),  # Only block editing
        ('content', 'edit content'),# Content fields editable
        ('full', 'edit all')        # Full access
    ],
    default='content'
)
```

### Domain Assignment

```python
domain_code = fields.Many2one(
    'website',
    string='Domain',
    default=lambda self: self.env.company.domain_code,
    required=True,
    tracking=True
)
```

### Computed Title

The `rectitle` provides a formatted display title:

```python
@api.depends("event_type_id", "name")
def _compute_rectitle(self):
    for event in self:
        foreignDomain = event.domain_code.domain_code + ':' if event.domain_code.company_id != self.env.company else ''
        if event.use_template_codes:
            typeCode = event.event_type_id.name if event.event_type_id else 'ERROR '
            event.rectitle = f'{foreignDomain.lower()}{typeCode.upper()} {event.name}'
        else:
            event.rectitle = f'{foreignDomain.lower()} {event.name}'.lstrip()

rectitle = fields.Char(compute='_compute_rectitle')
```

**Examples:**
- Same domain: `KONF Jahreskonferenz 2025`
- Cross-domain: `dasei: WORKS Theaterworkshop`
- Without codes: `Sommerakademie 2025`

## Location & Space

```python
address_id = fields.Many2one(
    'res.partner',
    string='Venue',
    domain="[('is_location_provider','=',True)]"
)

space_id = fields.Many2one(
    'event.track.location',
    string='Home-Space',
    domain="[('type','in',['space.msteams','space.jitsi'])]"
)
```

## Feature Flags (Computed)

Events inherit feature flags from their domain:

```python
use_msteams = fields.Boolean(compute='_compute_use_msteams')
use_jitsi = fields.Boolean(compute='_compute_use_jitsi')
use_template_codes = fields.Boolean(compute='_compute_use_template_codes')
use_tracks = fields.Boolean(compute='_compute_use_tracks')
use_products = fields.Boolean(compute='_compute_use_products')
use_overline = fields.Boolean(compute='_compute_use_overline')
use_teasertext = fields.Boolean(compute='_compute_use_teasertext')
owner_company = fields.Integer(compute='_compute_owner_company')
```

## Crearis ID

```python
@api.depends("domain_code", "event_type_id")
def _compute_cid(self):
    for event in self:
        template_code = 'evnt'
        if event.use_template_codes and event.event_type_id:
            template_code = event.event_type_id.name
        
        domain_code = event.domain_code.domain_code
        record_id = event.id or -1
        event.cid = f'{domain_code}.event-{template_code}__{record_id}'

cid = fields.Char("Crearis ID", compute='_compute_cid', store=True)
```

**Format:** `{domain}.event-{type}__{id}`

**Examples:**
- `dasei.event-evnt__1`
- `tpedia.event-KONF__15`
- `kjt.event-WORKS__42`

## Version Tracking

```python
version = fields.Integer(default=1)

def write(self, vals):
    vals['version'] = self.version + 1
    res = super().write(vals)
    self.invalidate_recordset()
    return res
```

## Standard Odoo Fields

These come from the base `event.event` model:

| Field | Type | Description |
|-------|------|-------------|
| `name` | Char | Event name |
| `date_begin` | Datetime | Start date/time |
| `date_end` | Datetime | End date/time |
| `date_tz` | Selection | Timezone |
| `stage_id` | Many2one | Event stage |
| `kanban_state` | Selection | Kanban state (normal/done/blocked) |
| `seats_max` | Integer | Maximum seats |
| `seats_available` | Integer | Available seats |
| `seats_reserved` | Integer | Reserved seats |
| `seats_used` | Integer | Used/confirmed seats |
| `seats_limited` | Boolean | Is seating limited? |
| `organizer_id` | Many2one | Organizer (res.partner) |
| `user_id` | Many2one | Responsible user |
| `description` | Html | Full description |
| `note` | Html | Internal notes |
| `active` | Boolean | Active record |
| `is_published` | Boolean | Published on website |
| `website_url` | Char | Website URL |
| `event_type_id` | Many2one | Event type |

## Complete Field List

### Crearis Fields

```python
# Content
teasertext = fields.Text('Teasertext', translate=True)
schedule = fields.Text('Schedule', translate=True)
md = fields.Text('Markdown Content', translate=True)
blocks = fields.Json()
cimg = fields.Text('Hero-Image-Link')

# Presentation
header_type = fields.Selection([...])
header_size = fields.Selection([...])
edit_mode = fields.Selection([...])

# Web Options (from web.options.abstract)
page_options = fields.Json()
aside_options = fields.Json()
header_options = fields.Json()
footer_options = fields.Json()

# Domain & Organization
domain_code = fields.Many2one('website')
space_id = fields.Many2one('event.track.location')

# Computed
rectitle = fields.Char(compute='_compute_rectitle')
cid = fields.Char(compute='_compute_cid', store=True)
version = fields.Integer()

# Feature flags (computed from domain)
use_msteams = fields.Boolean(compute=...)
use_jitsi = fields.Boolean(compute=...)
use_template_codes = fields.Boolean(compute=...)
use_tracks = fields.Boolean(compute=...)
use_products = fields.Boolean(compute=...)
use_overline = fields.Boolean(compute=...)
use_teasertext = fields.Boolean(compute=...)
owner_company = fields.Integer(compute=...)
```

## XML-RPC API

### Fetch Events

```typescript
const events = await odoo.searchRead(
    'event.event',
    [['active', '=', true]],
    [
        // Standard fields
        'id', 'name', 'date_begin', 'date_end', 'date_tz',
        'stage_id', 'kanban_state',
        'seats_max', 'seats_available', 'seats_reserved', 'seats_used', 'seats_limited',
        'address_id', 'organizer_id', 'user_id', 'event_type_id',
        'description', 'note', 'active', 'is_published', 'website_url',
        // Crearis fields
        'cid', 'rectitle', 'teasertext', 'cimg', 'md', 'schedule',
        'header_type', 'header_size', 'edit_mode', 'domain_code', 'version'
    ],
    { limit: 20, order: 'date_begin asc' }
)
```

### Example Response

```json
{
  "id": 1,
  "name": "Theaterpedia-Konferenz",
  "date_begin": "2025-10-06 04:30:00",
  "date_end": "2025-10-07 04:30:00",
  "stage_id": [4, "Ended"],
  "kanban_state": "normal",
  "seats_max": 100,
  "seats_available": 45,
  "address_id": [1353, "Eine-Welt-Haus"],
  "organizer_id": [1, "Theaterpedia"],
  "event_type_id": [2, "Conference"],
  "is_published": true,
  "website_url": "/event/theaterpedia-konferenz-1",
  "cid": "dasei.event-evnt__1",
  "rectitle": "KONF Theaterpedia-Konferenz",
  "teasertext": "Annual community gathering",
  "cimg": "https://res.cloudinary.com/.../theaterpedia.jpg",
  "header_type": "columns",
  "header_size": "prominent",
  "edit_mode": "content",
  "domain_code": [4, "dasei"],
  "version": 3
}
```

### Create Event

```typescript
const eventId = await odoo.create('event.event', {
    name: 'New Workshop',
    date_begin: '2025-06-15 09:00:00',
    date_end: '2025-06-15 17:00:00',
    domain_code: websiteId,
    event_type_id: eventTypeId,
    seats_max: 25,
    teasertext: 'Learn the basics of theater',
    header_type: 'banner',
    header_size: 'medium'
})
```

### Update Event

```typescript
await odoo.write('event.event', [eventId], {
    teasertext: 'Updated teaser text',
    cimg: 'https://cloudinary.com/new-image.jpg',
    edit_mode: 'blocks'
})
// Note: version auto-increments
```

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       event.event                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ cid: "dasei.event-evnt__1"                            │  │
│  │ rectitle: "KONF Theaterpedia-Konferenz"               │  │
│  │ name: "Theaterpedia-Konferenz"                        │  │
│  │ domain_code → website (dasei)                         │  │
│  │ event_type_id → event.type (Conference)               │  │
│  │ address_id → res.partner (Eine-Welt-Haus)            │  │
│  │ organizer_id → res.partner (Theaterpedia)            │  │
│  │ space_id → event.track.location                       │  │
│  │ stage_id → event.stage (Ended)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
   ┌──────────┐  ┌───────────┐  ┌──────────────┐
   │  website │  │ res.partner│  │ event.track  │
   │  (domain)│  │ (venue)    │  │ .location    │
   └──────────┘  └───────────┘  └──────────────┘
```

## Best Practices

1. **Always set domain_code** - Required for CID generation
2. **Use rectitle for display** - Includes type codes and domain prefix
3. **Track versions** - Auto-incremented on write
4. **Configure edit_mode** - Control dashboard editing permissions
5. **Use appropriate header_type** - Match content style

## Web Options (Inherited)

Events inherit the [web.options.abstract](../concepts/web-options.md) mixin, providing four JSON fields for page section configuration:

| Field | Purpose | Example Content |
|-------|---------|-----------------|
| `page_options` | Main page settings | `{"background": "accent", "navigation": "sidebar"}` |
| `aside_options` | Sidebar widgets | `{"list": "events", "toc": "auto"}` |
| `header_options` | Header banners | `{"alert": "Registration closing soon!"}` |
| `footer_options` | Footer widgets | `{"gallery": "partners", "sitemap": "medium"}` |

See [Web Options](../concepts/web-options.md) for full field reference and accessor fields.

## Related Entity Documentation

The event form view pattern is shared across all content entities:

- **[Partners](./partners.md)** - Extended partner form with Odoo UI examples
- **[Episodes (Blog Posts)](./episodes.md)** - Extended blog post form with Format Options tab
- **[Domain Users](../project/domainuser.md)** - Custom form with settings JSON and web options
