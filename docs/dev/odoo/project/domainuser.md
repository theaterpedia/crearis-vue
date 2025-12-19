# Domain Users

The `crearis.domainuser` model manages user-project relationships, providing role-based access control and per-domain user profiles.

## Overview

Domain Users connect Odoo users (`res.users`) to websites/projects, defining:
- **Role** - Permission level on the domain
- **Profile** - User's presentation on this domain
- **Settings** - Domain-specific configuration

## Model Definition

```python
class DomainUser(models.Model):
    _name = "crearis.domainuser"
    _inherit = ['web.options.abstract', 'demo.data.mixin']
    _description = "Domain-Users"
    _order = "domain_id, role, user_id"
    _rec_name = "cid"
```

### Inheritance

- `web.options.abstract` - [Web options mixin](../concepts/web-options.md) for page section configuration
- `demo.data.mixin` - [Demo data detection](../concepts/demo-data.md)

## Core Fields

### Relationships

```python
domain_id = fields.Many2one(
    "website",
    required=True,
    string="Domain",
    domain=[('domain_code', 'not like', "X_EMPTY")],
    ondelete="cascade",
    help="Domain/Website the user can access",
    index=True
)

domain_code = fields.Char(
    string='Domain Code',
    related='domain_id.domain_code',
    readonly=True,
    store=False
)

user_id = fields.Many2one(
    "res.users",
    required=True,
    string="User",
    ondelete="cascade",
    help="User that accesses the domain",
    index=True
)
```

### Role System

```python
role = fields.Selection(
    selection=[
        ("user", "Teilnehmer:in"),   # Participant
        ("team", "Team"),             # Team member
        ("exec", "Manager:in"),       # Manager/Executive
        ("spec", "Special")           # Special permissions
    ],
    default='user'
)
```

| Role | Description | Typical Capabilities |
|------|-------------|---------------------|
| `user` | Participant | View content, register for events |
| `team` | Team member | Create/edit content, manage events |
| `exec` | Manager | Full domain access, user management |
| `spec` | Special | Custom permissions via capabilities |

## Profile Fields

### Basic Info

```python
name = fields.Char('Title', translate=True, required=True)
description = fields.Text('Description', translate=True)
active = fields.Boolean("Active?", default=True)
```

### Header/Presentation

```python
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

## Settings JSON

The `settings` field stores flexible configuration:

```python
settings = fields.Json(
    string='Settings',
    help='JSON structure containing security and content settings',
    default={}
)
```

### Structure

```json
{
  "security": {
    "capabilities": ["read", "write", "moderate"]
  },
  "content": {
    "custom_md": true,
    "options": {
      "show_avatar": true,
      "featured": false
    }
  }
}
```

## Computed Settings Accessors

### Capabilities

```python
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
        settings['security']['capabilities'] = [c.strip() for c in caps if c.strip()]
        record.settings = settings
```

### Custom Markdown

```python
custom_md = fields.Boolean(
    string='Custom Markdown',
    compute='_compute_custom_md',
    inverse='_inverse_custom_md',
    store=False
)

@api.depends('settings')
def _compute_custom_md(self):
    for record in self:
        content = record.settings.get('content', {}) if record.settings else {}
        record.custom_md = content.get('custom_md', False)
```

### Content Options

```python
content_options = fields.Text(
    string='Content Options',
    compute='_compute_content_options',
    inverse='_inverse_content_options',
    store=False
)
```

## Crearis ID

```python
@api.depends("domain_id", "role")
def _compute_cid(self):
    for record in self:
        domain_code = record.domain_id.domain_code or 'private'
        record_id = record.id or -1
        record.cid = f'{domain_code}.domainuser-{record.role}__{record_id}'

cid = fields.Char("Crearis ID", compute=_compute_cid)
```

### CID Format

```
{domain_code}.domainuser-{role}__{id}
```

Examples:
- `dasei.domainuser-team__5`
- `tpedia.domainuser-exec__12`
- `kjt.domainuser-user__42`

## Helper Methods

```python
def get_setting(self, section, option_name, default=None):
    """Get a setting from the settings JSON."""
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
        if not settings[section]:
            del settings[section]
        self.settings = settings
```

## Version Tracking

```python
version = fields.Integer(default=1)

def write(self, vals):
    vals['version'] = self.version + 1
    return super().write(vals)
```

## XML-RPC API

### Get User's Domains

```typescript
// Get all domains for a specific user
const domainUsers = await odoo.searchRead(
    'crearis.domainuser',
    [
        ['user_id', '=', userId],
        ['active', '=', true]
    ],
    [
        'id',
        'cid',
        'domain_id',
        'domain_code',
        'role',
        'name',
        'capabilities',
        'header_type',
        'cimg',
        'version'
    ]
)
```

### Get Domain's Users

```typescript
// Get all users for a specific domain
const domainUsers = await odoo.searchRead(
    'crearis.domainuser',
    [
        ['domain_id', '=', websiteId],
        ['active', '=', true]
    ],
    ['user_id', 'role', 'name', 'cid'],
    { order: 'role, name' }
)
```

### Example Response

```json
{
  "id": 5,
  "cid": "dasei.domainuser-team__5",
  "domain_id": [2, "Das Ei"],
  "domain_code": "dasei",
  "role": "team",
  "name": "Team Member",
  "capabilities": "read,write,moderate",
  "header_type": "simple",
  "cimg": "https://cloudinary.com/avatar.jpg",
  "version": 3
}
```

### Create Domain User

```typescript
const domainUserId = await odoo.create('crearis.domainuser', {
    domain_id: websiteId,
    user_id: userId,
    role: 'team',
    name: 'New Team Member',
    settings: {
        security: {
            capabilities: ['read', 'write']
        }
    }
})
```

## Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│    res.users    │         │     website     │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ id: 59    │  │         │  │ id: 2     │  │
│  │ name:     │  │         │  │ domain_   │  │
│  │ "Hans"    │  │         │  │ code:     │  │
│  └───────────┘  │         │  │ "dasei"   │  │
└────────┬────────┘         │  └───────────┘  │
         │                  └────────┬────────┘
         │                           │
         │    ┌──────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────┐
│         crearis.domainuser              │
│  ┌───────────────────────────────────┐  │
│  │ cid: "dasei.domainuser-team__5"   │  │
│  │ user_id: 59 (Hans)                │  │
│  │ domain_id: 2 (dasei)              │  │
│  │ role: "team"                      │  │
│  │ capabilities: "read,write"        │  │
│  │ settings: {...}                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Best Practices

1. **One record per user-domain pair** - Don't create duplicates
2. **Use roles consistently** - Match capabilities to role
3. **Store complex config in settings** - Use JSON for flexibility
4. **Check active flag** - Filter inactive records
5. **Use cid for references** - Unique across domains

## Web Options (Inherited)

Domain users inherit the [web.options.abstract](../concepts/web-options.md) mixin, providing four JSON fields for user profile page configuration:

| Field | Purpose | Example Content |
|-------|---------|------------------|
| `page_options` | User profile page settings | `{"background": "muted", "navigation": "minimal"}` |
| `aside_options` | Profile sidebar widgets | `{"list": "events", "context": "user-events"}` |
| `header_options` | Profile header options | `{"postit": "Team Lead"}` |
| `footer_options` | Profile footer widgets | `{"gallery": "media", "sitemap": "none"}` |

See [Web Options](../concepts/web-options.md) for full field reference and accessor fields.

## Odoo Backend UI

The domain user form is a fully custom view (not inheriting from another model).

### Form Layout

```xml
<form string="Domain User">
    <!-- Demo banner -->
    <div class="ribbon ribbon-top-left" 
         attrs="{'invisible': [('is_demo', '=', False)]}">
        <span class="bg-success">DEMO DATA</span>
    </div>
    
    <sheet>
        <!-- Header section -->
        <div class="oe_title">
            <!-- Overline: CID, Domain Code, User, Role, Active -->
            <div class="o_row">
                <field name="cid" readonly="1"/>
                <field name="domain_code" readonly="1"/>
                <field name="user_id"/>
                <field name="role"/>
                <field name="active"/>
            </div>
            
            <!-- Headline: Name -->
            <h1><field name="name" placeholder="Title/Role Name"/></h1>
            
            <!-- Subline: Description -->
            <field name="description" placeholder="Kurzbeschreibung"/>
            
            <!-- Domain selector -->
            <field name="domain_id"/>
        </div>
        
        <!-- Settings section -->
        <separator string="Settings"/>
        <group>
            <group string="Content">
                <field name="content_options" widget="text"/>
                <field name="custom_md"/>
            </group>
            <group string="Security">
                <field name="capabilities" placeholder="admin, editor, viewer"/>
            </group>
        </group>
        
        <!-- Conditional markdown body -->
        <div attrs="{'invisible': [('custom_md', '=', False)]}">
            <separator string="Body"/>
            <field name="md" widget="text"/>
        </div>
        
        <!-- Web Options sections... -->
    </sheet>
</form>
```

### Tree View with Filters

```xml
<tree>
    <field name="cid"/>
    <field name="domain_code"/>
    <field name="role"/>
    <field name="name"/>
    <field name="user_id"/>
    <field name="description"/>
    <field name="is_demo"/>
    <field name="page_has_content"/>
    <field name="aside_has_content"/>
    <field name="header_has_content"/>
    <field name="footer_has_content"/>
    <field name="custom_md"/>
    <field name="active"/>
    <field name="version"/>
</tree>
```

### Search Filters

| Filter | Domain |
|--------|--------|
| Inactive | `[('active','=',False)]` |
| Active | `[('active','=',True)]` |
| Has Page Options | `[('page_has_content','=',True)]` |
| Has Header Options | `[('header_has_content','=',True)]` |

### Group By Options

- Domain (`domain_id`)
- Role (`role`)
- User (`user_id`)

## Related Entity Documentation

Domain user views share patterns with other content entities:

- **[Partners](../entities/partners.md)** - Extended partner form with Odoo UI examples
- **[Events](../entities/events.md)** - Extended event form with demo banner and feature flags
- **[Episodes (Blog Posts)](../entities/episodes.md)** - Extended blog post form with Format Options tab
