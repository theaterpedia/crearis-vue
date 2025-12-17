# Partners & Locations

Crearis extends the standard Odoo `res.partner` model with content fields and location management capabilities.

## Partner Model Extension

### Model Definition

```python
class ResPartner(models.Model):
    _inherit = ["res.partner", "web.options.abstract", "demo.data.mixin"]
    _name = "res.partner"
```

### Content Fields

```python
# Header/Presentation
header_type = fields.Selection(
    selection=[
        ("simple", "simple"),
        ("columns", 'Text-Bild (2 Spalten)'),
        ("banner", "Banner medium"),
        ("cover", "Cover Fullsize"),
        ("bauchbinde", "Bauchbinde")
    ],
    default="simple"
)

header_size = fields.Selection(
    selection=[
        ("mini", "minimal"),
        ("medium", 'Medium'),
        ("prominent", "prominent"),
        ("full", "full")
    ],
    default="mini"
)

cimg = fields.Text('Hero-Image-Link', default='')
md = fields.Text('Markdown Content', translate=True, default='')
```

### Location Provider Flag

```python
is_location_provider = fields.Boolean(
    string='Has physical locations for creative work',
    default=False,
    help="Check if the contact serves locations for cultural work"
)
```

This flag identifies partners who can serve as event venues.

### Version Tracking

```python
version = fields.Integer(default=1)

def write(self, vals):
    vals['version'] = self.version + 1
    # ... change tracking logic
    return super().write(vals)
```

### Crearis ID

```python
def _compute_cid(self):
    for partner in self:
        prtn_id = partner.id or -1
        if not partner.website_id:
            subnetCode = self.env['ir.config_parameter'].sudo().get_param('crearis.subnetcode')
            partner.cid = f'{subnetCode}.partner-{partner.company_type}.{prtn_id}'
        else:
            domain_code = partner.website_id.domain_code
            partner.cid = f'{domain_code}.partner-{partner.company_type}.{prtn_id}'

cid = fields.Char("Crearis ID", compute='_compute_cid')
```

**Format:** `{domain}.partner-{type}.{id}`

**Examples:**
- `dasei.partner-company.1`
- `private.partner-person.42`
- `tpedia.partner-company.15`

## Location Model (event.track.location)

Crearis extends the track location model for physical and virtual spaces:

```python
class Location(models.Model):
    _inherit = "event.track.location"
    _description = "Location"

    provider_id = fields.Many2one(
        "res.partner",
        string="Address/Provider",
        domain=[('is_location_provider', '=', True)],
        help="Venue, spot, office where the space is located",
        ondelete="restrict",
        index=True
    )

    description = fields.Char('Description', translate=True, default='')
    
    type = fields.Selection([
        ("location.venue", "venue"),
        ("location.office", "office"),
        ("location.nature", "nature"),
        ("location.street", "street"),
        ("space.msteams", "online (teams)"),
        ("space.jitsi", "online (jitsi)")
    ], default="location.venue")
    
    is_default = fields.Boolean("Default Space?", default=False)
    
    # Microsoft Teams integration
    site_id = fields.Char('MS Site ID')
    list_id = fields.Char('MS List ID')
    drive_id = fields.Char('MS Drive ID')

    company_ids = fields.Many2many(
        "res.company",
        relation="crearis_company_location_rel",
        string="Companies",
        help="Companies that can book this location"
    )
```

### Location Types

| Type | Category | Description |
|------|----------|-------------|
| `location.venue` | Physical | Theater, hall, venue |
| `location.office` | Physical | Office, meeting room |
| `location.nature` | Physical | Outdoor spot, park |
| `location.street` | Physical | Street performance spot |
| `space.msteams` | Virtual | Microsoft Teams room |
| `space.jitsi` | Virtual | Jitsi video conference |

### Display Name

```python
def name_get(self):
    res = []
    for location in self:
        if location.provider_id:
            name = f"{location.name} ({location.provider_id.name})"
        else:
            name = location.name
        res.append((location.id, name))
    return res
```

## Standard Partner Fields

From base `res.partner`:

| Field | Type | Description |
|-------|------|-------------|
| `name` | Char | Partner name |
| `company_type` | Selection | company/person |
| `type` | Selection | contact/invoice/delivery/other |
| `street` | Char | Street address |
| `street2` | Char | Street line 2 |
| `city` | Char | City |
| `zip` | Char | Postal code |
| `country_id` | Many2one | Country |
| `email` | Char | Email address |
| `phone` | Char | Phone number |
| `mobile` | Char | Mobile number |
| `website` | Char | Website URL |
| `image_1920` | Binary | Partner image |
| `category_id` | Many2many | Partner tags |
| `website_id` | Many2one | Related website |

## Complete Field Lists

### Partner (res.partner)

```python
# Standard Odoo
name = fields.Char()
company_type = fields.Selection()
street, street2, city, zip = fields.Char()
country_id = fields.Many2one()
email, phone, mobile = fields.Char()
website_id = fields.Many2one()
category_id = fields.Many2many()

# Crearis custom
is_location_provider = fields.Boolean()
header_type = fields.Selection()
header_size = fields.Selection()
cimg = fields.Text()
md = fields.Text()
cid = fields.Char(compute=...)
version = fields.Integer()
```

### Location (event.track.location)

```python
# Standard Odoo
name = fields.Char()

# Crearis custom
provider_id = fields.Many2one()
description = fields.Char()
type = fields.Selection()
is_default = fields.Boolean()
site_id = fields.Char()      # MS Teams
list_id = fields.Char()      # MS Teams
drive_id = fields.Char()     # MS Teams
company_ids = fields.Many2many()
```

## XML-RPC API

### Fetch Location Providers

```typescript
const venues = await odoo.searchRead(
    'res.partner',
    [
        ['is_location_provider', '=', true],
        ['active', '=', true]
    ],
    [
        'id', 'name', 'company_type',
        'street', 'city', 'zip', 'country_id',
        'email', 'phone',
        'cid', 'cimg', 'md', 'header_type', 'version'
    ],
    { order: 'name' }
)
```

### Fetch Locations for Event

```typescript
const locations = await odoo.searchRead(
    'event.track.location',
    [
        ['type', 'in', ['location.venue', 'location.office']],
        ['company_ids', 'in', [companyId]]
    ],
    [
        'id', 'name', 'description', 'type',
        'provider_id', 'is_default'
    ],
    { order: 'is_default desc, name' }
)
```

### Fetch Online Spaces

```typescript
const onlineSpaces = await odoo.searchRead(
    'event.track.location',
    [
        ['type', 'in', ['space.msteams', 'space.jitsi']],
        ['company_ids', 'in', [companyId]]
    ],
    [
        'id', 'name', 'type',
        'site_id', 'list_id', 'drive_id'
    ]
)
```

### Example Partner Response

```json
{
  "id": 1353,
  "name": "Eine-Welt-Haus",
  "company_type": "company",
  "street": "Schwanthalerstr. 80",
  "city": "München",
  "zip": "80336",
  "country_id": [13, "Germany"],
  "is_location_provider": true,
  "cid": "dasei.partner-company.1353",
  "cimg": "https://cloudinary.com/eine-welt-haus.jpg",
  "header_type": "banner",
  "version": 2
}
```

### Example Location Response

```json
{
  "id": 5,
  "name": "Großer Saal",
  "description": "Main hall with 200 seats",
  "type": "location.venue",
  "provider_id": [1353, "Eine-Welt-Haus"],
  "is_default": true
}
```

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     res.partner                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id: 1353                                              │  │
│  │ name: "Eine-Welt-Haus"                                │  │
│  │ is_location_provider: true                            │  │
│  │ cid: "dasei.partner-company.1353"                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ provider_id
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  event.track.location                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id: 5                                                 │  │
│  │ name: "Großer Saal"                                   │  │
│  │ type: "location.venue"                                │  │
│  │ provider_id: 1353                                     │  │
│  │ company_ids: [1, 2]                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ address_id / space_id
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      event.event                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ address_id: 1353 (venue partner)                      │  │
│  │ space_id: 5 (specific room/space)                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Flag location providers** - Set `is_location_provider=True` for venues
2. **Use location types** - Distinguish physical vs virtual spaces
3. **Set company access** - Configure `company_ids` for location booking
4. **Mark defaults** - Set `is_default=True` for primary spaces
5. **Include MS Teams IDs** - For virtual spaces, configure site/list/drive IDs
6. **Track versions** - Partners auto-increment version on write
