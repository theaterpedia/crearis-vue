# Demo Data Detection

Crearis provides automatic detection of demo/test records through the `demo.data.mixin` abstract model. This enables filtering demo content from production views and API responses.

## The Demo Data Mixin

```python
class DemoDataMixin(models.AbstractModel):
    """Mixin to detect and mark demo data"""
    
    _name = 'demo.data.mixin'
    _description = 'Demo Data Detection Mixin'

    is_demo = fields.Boolean(
        string='Is Demo Data',
        compute='_compute_is_demo',
        store=False,
        help='True if this record is demo data (XML ID starts with _demo)'
    )
```

## Detection Logic

Demo data is identified by its XML ID (External Identifier):

```python
def _compute_is_demo(self):
    """Check if record has XML ID starting with _demo"""
    for record in self:
        record.is_demo = False
        
        if not record.id:
            continue
            
        # Get XML ID for this record
        xml_ids = record.get_external_id()
        if xml_ids and xml_ids.get(record.id):
            xml_id = xml_ids[record.id]
            # Check if XML ID starts with _demo (after module prefix)
            # Format: module_name._demo_record_name
            xml_id_parts = xml_id.split('.')
            if len(xml_id_parts) > 1:
                record.is_demo = xml_id_parts[-1].startswith('_demo')
```

### XML ID Format

Odoo XML IDs follow this pattern:
```
{module_name}.{record_identifier}
```

Demo records use the convention:
```
crearis_events._demo_conference_2025
crearis_events._demo_workshop_beginner
```

## Usage

### Inheriting the Mixin

```python
class Event(models.Model):
    _inherit = ['event.event', 'web.options.abstract', 'demo.data.mixin']
    _name = 'event.event'
```

Models using this mixin:
- `event.event` - Events
- `blog.post` - Blog posts/episodes
- `res.partner` - Partners
- `crearis.domainuser` - Domain user relations

### Filtering in Views

```xml
<!-- Show only non-demo records -->
<record id="view_event_tree" model="ir.ui.view">
    <field name="arch" type="xml">
        <tree>
            <field name="is_demo" invisible="1"/>
            <!-- Filter available -->
        </tree>
    </field>
</record>

<record id="action_events" model="ir.actions.act_window">
    <field name="domain">[('is_demo', '=', False)]</field>
</record>
```

### Filtering in API

```python
# Odoo Python
events = self.env['event.event'].search([
    ('is_demo', '=', False),
    ('active', '=', True)
])
```

```typescript
// Crearis-Vue XML-RPC
const events = await odoo.searchRead(
    'event.event',
    [
        ['is_demo', '=', false],
        ['active', '=', true]
    ],
    ['name', 'date_begin', 'cid']
)
```

## Global Configuration

Demo data visibility can be controlled via system parameters:

```python
# ir.config_parameter
crearis.graphql.include_demo = 'True'   # Include demo in API
crearis.graphql.include_demo = 'False'  # Exclude demo from API
```

### Reading the Configuration

```python
ICP = self.env['ir.config_parameter'].sudo()
include_demo = ICP.get_param('crearis.graphql.include_demo', 'True')

if include_demo == 'True':
    # Include demo data
    domain = [('active', '=', True)]
else:
    # Exclude demo data
    domain = [('active', '=', True), ('is_demo', '=', False)]
```

## Creating Demo Data

When creating demo records in XML data files:

```xml
<!-- data/demo/events.xml -->
<odoo>
    <data noupdate="1">
        <!-- Name starts with _demo -->
        <record id="_demo_conference_spring" model="event.event">
            <field name="name">Demo Spring Conference</field>
            <field name="date_begin">2025-04-15 09:00:00</field>
            <!-- ... -->
        </record>
        
        <record id="_demo_workshop_intro" model="event.event">
            <field name="name">Demo Intro Workshop</field>
            <!-- ... -->
        </record>
    </data>
</odoo>
```

### Manifest Configuration

```python
# __manifest__.py
{
    'name': 'Crearis Events',
    'demo': [
        'data/demo/events.xml',
        'data/demo/partners.xml',
    ],
}
```

Demo files only load when Odoo is initialized with `--load-demo` flag.

## Best Practices

1. **Always inherit the mixin** for content entities
2. **Prefix demo XML IDs** with `_demo_`
3. **Filter in production** - exclude demo data from public APIs
4. **Use for testing** - demo data provides safe test records
5. **Don't delete demo data** - filter it out instead

## API Field Reference

| Field | Type | Stored | Description |
|-------|------|--------|-------------|
| `is_demo` | Boolean | No (computed) | True if record is demo data |

::: warning
The `is_demo` field is computed and not stored. For performance with large datasets, consider caching the result or using stored computed fields.
:::
