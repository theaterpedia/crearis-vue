# Configuration System

Crearis provides a flexible configuration system through config templates and settings integration.

## Config Templates

The `crearis.config.template` model stores reusable configuration entries:

```python
class ConfigTemplates(models.Model):
    _name = "crearis.config.template"
    _description = "Config-Templates"
    _order = "type, sequence"

    sequence = fields.Integer(default=10)
    name = fields.Char('Config-Code', required=True)
    description = fields.Char('Description', translate=True)
    json_config = fields.Text('Config-Entry(Json)', default='{}')
    html_config = fields.Html('Config-Entry(Html)', sanitize=False, default='{}')
    type = fields.Selection([
        ("json.schedule", "schedule"),
        ("test.props", "test comp props")
    ], default="json.schedule")
    is_default = fields.Boolean('is default-value', default=False)
    
    company_id = fields.Many2one(
        "res.company",
        required=True,
        help="Company that owns this config",
        index=True
    )
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | Char | Unique config code/identifier |
| `description` | Char | Human-readable description |
| `json_config` | Text | JSON configuration data |
| `html_config` | Html | HTML-based configuration (unsanitized) |
| `type` | Selection | Config type category |
| `is_default` | Boolean | Marks default value for type |
| `company_id` | Many2one | Owning company |
| `sequence` | Integer | Display/processing order |

### Config Types

| Type Code | Description |
|-----------|-------------|
| `json.schedule` | Schedule templates (time slots, tracks) |
| `test.props` | Test component properties |

## Usage Patterns

### Schedule Templates

```json
{
  "type": "json.schedule",
  "name": "conference_day",
  "json_config": {
    "slots": [
      {"start": "09:00", "end": "09:30", "label": "Registration"},
      {"start": "09:30", "end": "10:30", "label": "Keynote"},
      {"start": "10:30", "end": "11:00", "label": "Break"},
      {"start": "11:00", "end": "12:30", "label": "Sessions"}
    ],
    "tracks": ["Main Hall", "Workshop Room", "Online"],
    "defaults": {
      "duration": 45,
      "break_after": true
    }
  }
}
```

### Component Props

```json
{
  "type": "test.props",
  "name": "event_card_v2",
  "json_config": {
    "showImage": true,
    "showTeaser": true,
    "dateFormat": "short",
    "theme": "light",
    "actions": ["register", "share", "calendar"]
  }
}
```

## Settings Integration

### ResConfigSettings Extension

```python
class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    _order = 'domain_code'

    # Website/Domain settings
    domain_code = fields.Char(
        related='website_id.domain_code',
        readonly=False
    )
    
    # Feature flags
    crearis_is_hubsite = fields.Boolean(
        related='website_id.is_hubsite',
        readonly=False
    )
    crearis_use_msteams = fields.Boolean(
        related='website_id.use_msteams',
        readonly=False
    )
    crearis_use_jitsi = fields.Boolean(
        related='website_id.use_jitsi',
        readonly=False
    )
    crearis_use_template_codes = fields.Boolean(
        related='website_id.use_template_codes',
        readonly=False
    )
    crearis_use_tracks = fields.Boolean(
        related='website_id.use_tracks',
        readonly=False
    )
    crearis_use_products = fields.Boolean(
        related='website_id.use_products',
        readonly=False
    )
    crearis_use_overline = fields.Boolean(
        related='website_id.use_overline',
        readonly=False
    )
    crearis_use_teasertext = fields.Boolean(
        related='website_id.use_teasertext',
        readonly=False
    )
    
    # Computed readonly flag
    is_company_domain = fields.Boolean(
        related='website_id.is_company_domain',
        readonly=True
    )
    
    # Content aggregation
    crearis_post_domain_ids = fields.Many2many(
        comodel_name="website",
        relation="trans_website_post_domains",
        string="Post-Feed",
        related='website_id.post_domain_ids',
        readonly=False
    )
    
    crearis_event_domain_ids = fields.Many2many(
        comodel_name="website",
        relation="trans_website_event_domains",
        string="Event-Feed",
        related='website_id.event_domain_ids',
        readonly=False
    )
```

## System Parameters

Global settings via `ir.config_parameter`:

```python
# Read
ICP = self.env['ir.config_parameter'].sudo()
subnet_code = ICP.get_param('crearis.subnetcode', 'private')
include_demo = ICP.get_param('crearis.graphql.include_demo', 'True')

# Write
ICP.set_param('crearis.subnetcode', 'theaterpedia')
```

### Common Parameters

| Key | Default | Description |
|-----|---------|-------------|
| `crearis.subnetcode` | `'private'` | Default domain code for unassigned content |
| `crearis.graphql.include_demo` | `'True'` | Include demo data in API responses |

## XML-RPC API

### Get Config Templates

```typescript
// Get all schedule templates for a company
const configs = await odoo.searchRead(
    'crearis.config.template',
    [
        ['type', '=', 'json.schedule'],
        ['company_id', '=', companyId]
    ],
    ['name', 'description', 'json_config', 'is_default'],
    { order: 'sequence' }
)
```

### Get Default Config

```typescript
// Get default schedule config
const defaultConfig = await odoo.searchRead(
    'crearis.config.template',
    [
        ['type', '=', 'json.schedule'],
        ['is_default', '=', true],
        ['company_id', '=', companyId]
    ],
    ['name', 'json_config'],
    { limit: 1 }
)
```

### Create Config Template

```typescript
const configId = await odoo.create('crearis.config.template', {
    name: 'workshop_schedule',
    description: 'Standard workshop day schedule',
    type: 'json.schedule',
    company_id: companyId,
    sequence: 20,
    json_config: JSON.stringify({
        slots: [
            { start: '10:00', end: '12:00', label: 'Morning Session' },
            { start: '12:00', end: '13:00', label: 'Lunch' },
            { start: '13:00', end: '17:00', label: 'Afternoon Session' }
        ]
    })
})
```

## Company-Level Config

Companies inherit from website settings:

```python
class Company(models.Model):
    _inherit = "res.company"

    domain_code = fields.Many2one(
        'website',
        string='Domain Code',
        domain="[('domain_code','!=','')]"
    )
    
    # Feature flags (company-level)
    use_msteams = fields.Boolean('MS Teams', default=False)
    use_jitsi = fields.Boolean('Jitsi Rooms', default=False)
    use_template_codes = fields.Boolean('Template Codes', default=False)
    use_tracks = fields.Boolean('Use Tracks', default=False)
    use_products = fields.Boolean('Use Products', default=False)
    use_overline = fields.Boolean('Use Overline', default=False)
    use_teasertext = fields.Boolean('Use Teasertext', default=False)
```

## Configuration Hierarchy

```
┌─────────────────────────────────────────────┐
│           ir.config_parameter               │
│  (Global system parameters)                 │
│  crearis.subnetcode = 'theaterpedia'        │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              res.company                    │
│  (Company-level feature flags)              │
│  use_msteams, use_tracks, etc.              │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│                website                      │
│  (Domain-level configuration)               │
│  domain_code, is_hubsite, feature flags     │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│        crearis.config.template              │
│  (Reusable config entries)                  │
│  Schedules, component props, etc.           │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│      Entity settings (JSON fields)          │
│  Per-event, per-user, per-post settings     │
└─────────────────────────────────────────────┘
```

## Best Practices

1. **Use config templates** for reusable configurations
2. **Mark defaults** with `is_default=True` for fallback
3. **Company scope** - always set `company_id` on templates
4. **JSON validation** - validate `json_config` structure
5. **Sequence ordering** - use sequence for predictable ordering
6. **Descriptive names** - use meaningful `name` codes
