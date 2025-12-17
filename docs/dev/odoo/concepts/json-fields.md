# JSON Fields in Crearis

Crearis makes heavy use of JSON fields for flexible, schema-less configuration storage. This allows dynamic feature flags, nested settings, and extensible data structures without database migrations.

## Odoo 16 Native JSON Support

Odoo 16 includes native JSON field support:

```python
from odoo import fields

settings = fields.Json(
    string='Settings',
    help='JSON structure containing security and content settings',
    default={}
)
```

### Historical Context

Earlier Odoo versions required custom field implementations. The `json_field.py` shows the legacy approach:

```python
# Legacy implementation (pre-Odoo 16)
class JsonField(Field):
    type = 'json'
    column_type = ('json', 'json')  # PostgreSQL JSON type
    
    def convert_to_column(self, value, record, values=None, validate=True):
        if value is None:
            return None
        return psycopg2.extras.Json(value)
```

::: tip
Odoo 16 Community Edition has built-in `fields.Json` - no custom field needed.
:::

## Common JSON Field Patterns

### 1. Settings Storage (`settings` field)

Used in `domainuser.py` and other models:

```python
settings = fields.Json(
    string='Settings',
    help='JSON structure containing security and content settings',
    default={}
)
```

**Structure:**
```json
{
  "security": {
    "capabilities": ["read", "write", "admin"]
  },
  "content": {
    "custom_md": true,
    "options": {
      "show_sidebar": false,
      "theme": "dark"
    }
  }
}
```

### 2. Blocks Storage (`blocks` field)

Used in `event.py` and `episode.py` for content blocks:

```python
blocks = fields.Json()  # Content block array
```

**Structure:**
```json
[
  {
    "type": "text",
    "content": "Introduction paragraph...",
    "order": 1
  },
  {
    "type": "image",
    "url": "https://cloudinary.com/...",
    "caption": "Event venue",
    "order": 2
  },
  {
    "type": "schedule",
    "items": [
      {"time": "09:00", "title": "Opening"},
      {"time": "10:00", "title": "Keynote"}
    ],
    "order": 3
  }
]
```

::: tip CREARIS-NUXT Integration
The `blocks` field enables powerful integration with **CREARIS-NUXT**, a CMS built on the same Vue component library. Both projects share exactly the same Vue components for block rendering:

- **CREARIS-NUXT**: Server-side rendered CMS with full block editing
- **CREARIS-VUE**: Admin/management interface consuming blocks via API

This means blocks created in Odoo can be rendered identically in both applications, enabling:
- Consistent visual output across platforms
- Shared component development
- Content portability between systems
- Unified design system
:::

### 3. Config Templates

The `config_template.py` model stores typed configurations:

```python
class ConfigTemplates(models.Model):
    _name = "crearis.config.template"
    
    type = fields.Selection([
        ("json.schedule", "schedule"),
        ("test.props", "test comp props")
    ])
    json_config = fields.Text('Config-Entry(Json)', default='{}')
    html_config = fields.Html('Config-Entry(Html)', sanitize=False)
```

## Computed Fields from JSON

Crearis uses computed fields with inverses to provide typed access to JSON properties:

```python
class DomainUser(models.Model):
    # JSON storage
    settings = fields.Json(default={})
    
    # Computed field exposing JSON property
    capabilities = fields.Char(
        string='Capabilities',
        compute='_compute_capabilities',
        inverse='_inverse_capabilities',
        store=False
    )
    
    @api.depends('settings')
    def _compute_capabilities(self):
        for record in self:
            security = record.settings.get('security', {}) if record.settings else {}
            caps = security.get('capabilities', [])
            record.capabilities = ','.join(caps) if caps else ''
    
    def _inverse_capabilities(self):
        for record in self:
            settings = dict(record.settings or {})
            if 'security' not in settings:
                settings['security'] = {}
            caps = record.capabilities.split(',') if record.capabilities else []
            settings['security']['capabilities'] = caps
            record.settings = settings
```

### Benefits

1. **Type-safe access** via computed fields
2. **Form view compatibility** - computed fields work in Odoo views
3. **Flexible storage** - add properties without migrations
4. **Nested structures** - supports complex hierarchies

## Helper Methods Pattern

```python
def get_setting(self, section, option_name, default=None):
    """Get a setting from the settings JSON.
    
    Args:
        section: Top-level section ('security', 'content', etc.)
        option_name: Setting name within section
        default: Default value if not found
    """
    if not self.settings:
        return default
    section_data = self.settings.get(section, {})
    return section_data.get(option_name, default)

def set_setting(self, section, option_name, value):
    """Set a setting in the settings JSON."""
    settings = dict(self.settings or {})
    if section not in settings:
        settings[section] = {}
    settings[section][option_name] = value
    self.settings = settings

def remove_setting(self, section, option_name):
    """Remove a setting from the settings JSON."""
    if not self.settings:
        return
    settings = dict(self.settings)
    if section in settings and option_name in settings[section]:
        del settings[section][option_name]
        # Clean up empty sections
        if not settings[section]:
            del settings[section]
        self.settings = settings
```

## XML-RPC API Access

### Reading JSON Fields

```typescript
const events = await odoo.searchRead(
    'event.event',
    [['id', '=', 1]],
    ['name', 'blocks', 'settings']
)

// JSON fields come parsed
const blocks = events[0].blocks  // Already an array
const settings = events[0].settings  // Already an object
```

### Writing JSON Fields

```typescript
// Create with JSON data
const eventId = await odoo.create('event.event', {
    name: 'New Event',
    blocks: [
        { type: 'text', content: 'Welcome!', order: 1 }
    ],
    settings: {
        visibility: 'public',
        features: ['registration', 'chat']
    }
})

// Update JSON field
await odoo.write('event.event', [eventId], {
    blocks: [
        { type: 'text', content: 'Updated content', order: 1 },
        { type: 'image', url: 'https://...', order: 2 }
    ]
})
```

## Web Options Abstract

The `web.options.abstract` mixin provides standardized options handling:

```python
class WebOptionsAbstract(models.AbstractModel):
    _name = 'web.options.abstract'
    
    options = fields.Json(
        string='Web Options',
        help='JSON options for web display',
        default={}
    )
    
    custom_header = fields.Boolean(
        compute='_compute_custom_header',
        inverse='_inverse_custom_header'
    )
    
    # ... computed accessors for common options
```

Models inheriting this mixin get:
- Standardized `options` JSON field
- Computed accessors for common settings
- Consistent API across entity types

## Best Practices

1. **Define clear schemas** - Document expected JSON structure
2. **Use defaults** - Always provide sensible defaults: `default={}`
3. **Computed accessors** - Provide typed fields for commonly accessed properties
4. **Validate on write** - Check JSON structure in `write()` override if needed
5. **Avoid deep nesting** - Keep structures reasonably flat for performance
