# Website as Project

In Crearis, the standard Odoo `website` model is extended to serve as the central **Project** container. Each website represents a distinct domain/project with its own configuration, users, and content.

## The Domain Code Concept

Every Crearis project is identified by a unique `domain_code`:

```python
class Website(models.Model):
    _inherit = 'website'
    _order = "domain_code"

    domain_code = fields.Char(
        'Domain-Code',
        help="Subdomain on theaterpedia.org / unique key-prefix for data-keys"
    )
    _rec_name = "domain_code"  # Display name is domain_code
```

### Examples

| domain_code | Description |
|-------------|-------------|
| `dasei` | Das Ei Theater project |
| `tpedia` | Theaterpedia main site |
| `kjt` | Kinder- und Jugendtheater |
| `private` | Default for unassigned content |

## Extended Website Model

```python
class Website(models.Model):
    _inherit = 'website'
    _order = "domain_code"

    # Core identification
    domain_code = fields.Char('Domain-Code')
    
    # Site type flags
    is_hubsite = fields.Boolean('Hubsite')
    is_company_domain = fields.Boolean(compute='_compute_is_homedomain')
    
    # Feature toggles
    use_msteams = fields.Boolean('MS Teams')
    use_jitsi = fields.Boolean('Jitsi Rooms')
    use_template_codes = fields.Boolean('Use Template Codes')
    use_tracks = fields.Boolean('Use Tracks')
    use_products = fields.Boolean('Use Products')
    use_overline = fields.Boolean('Use Overline')
    use_teasertext = fields.Boolean('Use Teasertext')
    
    # Content aggregation
    post_domain_ids = fields.Many2many(
        "website",
        relation="website_post_domains",
        string="Post-Domains"
    )
    event_domain_ids = fields.Many2many(
        "website",
        relation="website_event_domains", 
        string="Event-Domains"
    )
```

## Site Types

### Hubsite

A hubsite aggregates content from multiple project domains:

```python
is_hubsite = fields.Boolean('Hubsite')
```

Hubsites can:
- Pull blog posts from `post_domain_ids`
- Show events from `event_domain_ids`
- Provide cross-project navigation

### Company Domain

Each company can have a primary website:

```python
@api.depends("company_id.domain_code")
def _compute_is_homedomain(self):
    for website in self:
        website.is_company_domain = (
            website.company_id.domain_code.id == website.id
        )

is_company_domain = fields.Boolean(compute='_compute_is_homedomain')
```

## Feature Flags

Projects can enable/disable features per domain:

| Flag | Description |
|------|-------------|
| `use_msteams` | Microsoft Teams integration |
| `use_jitsi` | Jitsi video rooms |
| `use_template_codes` | Content template system |
| `use_tracks` | Event track management |
| `use_products` | E-commerce/tickets |
| `use_overline` | Overline text on content |
| `use_teasertext` | Teaser text support |

### Configuration Settings

These flags are exposed in Odoo Settings:

```python
class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    
    domain_code = fields.Char(related='website_id.domain_code', readonly=False)
    crearis_is_hubsite = fields.Boolean(related='website_id.is_hubsite', readonly=False)
    crearis_use_msteams = fields.Boolean(related='website_id.use_msteams', readonly=False)
    crearis_use_jitsi = fields.Boolean(related='website_id.use_jitsi', readonly=False)
    # ... etc
```

## Content Aggregation

### Post Domains

Which domains' blog posts appear on this site:

```python
post_domain_ids = fields.Many2many(
    comodel_name="website",
    relation="website_post_domains",
    column1="a_id",
    column2="b_id",
    string="Post-Domains"
)
```

### Event Domains

Which domains' events appear on this site:

```python
event_domain_ids = fields.Many2many(
    comodel_name="website",
    relation="website_event_domains",
    column1="a_id",
    column2="b_id",
    string="Event-Domains"
)
```

## Company Integration

The `res.company` model links to its primary website:

```python
class Company(models.Model):
    _inherit = "res.company"

    domain_code = fields.Many2one(
        'website',
        string='Domain Code',
        domain="[('domain_code','!=','')]"
    )
    
    # Company-level feature flags
    use_msteams = fields.Boolean('MS Teams', default=False)
    use_jitsi = fields.Boolean('Jitsi Rooms', default=False)
    use_template_codes = fields.Boolean('Template Codes', default=False)
    use_tracks = fields.Boolean('Use Tracks', default=False)
    use_products = fields.Boolean('Use Products', default=False)
    use_overline = fields.Boolean('Use Overline', default=False)
    use_teasertext = fields.Boolean('Use Teasertext', default=False)
```

## XML-RPC API

### Fetching Websites/Projects

```typescript
// Get all projects with domain codes
const projects = await odoo.searchRead(
    'website',
    [['domain_code', '!=', false]],
    [
        'id',
        'name',
        'domain_code',
        'is_hubsite',
        'use_msteams',
        'use_tracks',
        'post_domain_ids',
        'event_domain_ids'
    ],
    { order: 'domain_code' }
)
```

### Example Response

```json
[
  {
    "id": 1,
    "name": "Theaterpedia",
    "domain_code": "tpedia",
    "is_hubsite": true,
    "use_msteams": false,
    "use_tracks": true,
    "post_domain_ids": [2, 3, 4],
    "event_domain_ids": [2, 3]
  },
  {
    "id": 2,
    "name": "Das Ei",
    "domain_code": "dasei",
    "is_hubsite": false,
    "use_msteams": true,
    "use_tracks": true,
    "post_domain_ids": [],
    "event_domain_ids": []
  }
]
```

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        res.company                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ domain_code (Many2one → website)                     │   │
│  │ Feature flags (use_msteams, use_tracks, etc.)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         website                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ domain_code: "dasei"                                 │   │
│  │ is_hubsite: false                                    │   │
│  │ is_company_domain: true (computed)                   │   │
│  │ Feature flags                                        │   │
│  │ post_domain_ids: [...]                               │   │
│  │ event_domain_ids: [...]                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │  Events  │   │  Posts   │   │ Domain Users │
        │ domain_  │   │ website_ │   │  domain_id   │
        │ code →   │   │ id →     │   │  →           │
        └──────────┘   └──────────┘   └──────────────┘
```

## Best Practices

1. **Always set domain_code** for new websites/projects
2. **Use feature flags** to enable capabilities per project
3. **Configure aggregation** via post/event_domain_ids for hubsites
4. **Link company** to its primary website via domain_code
