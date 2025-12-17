# XML IDs & Versioning

Crearis implements a sophisticated versioning and identification system to track changes across entities and enable cache invalidation in the Vue frontend.

## The CID (Crearis ID)

Every Crearis entity has a computed `cid` field that provides a globally unique, human-readable identifier.

### Format

```
{domain_code}.{entity_type}-{subtype}__{id}
```

### Components

| Part | Description | Example |
|------|-------------|---------|
| `domain_code` | Website/project identifier | `dasei`, `tpedia`, `private` |
| `entity_type` | Model category | `event`, `blog`, `partner` |
| `subtype` | Entity subtype/template | `evnt`, `post`, `company` |
| `id` | Odoo record ID | `1`, `42`, `153` |

### Examples

```python
# Event on 'dasei' domain
cid = 'dasei.event-evnt__1'

# Blog post on 'tpedia' domain  
cid = 'tpedia.blog-post__15'

# Partner without domain (uses subnet code)
cid = 'private.partner-company.42'

# Domain user relationship
cid = 'dasei.domainuser-team__5'
```

### Implementation Pattern

```python
@api.depends("domain_code", "id")
def _compute_cid(self):
    """Compute Crearis ID based on domain and record ID."""
    template_code = 'evnt'  # Entity-specific
    
    for record in self:
        domain_code = 'private'
        if record.domain_code:
            domain_code = record.domain_code.code
        
        record_id = record.id or -1  # -1 for unsaved records
        record.cid = f'{domain_code}.event-{template_code}__{record_id}'

cid = fields.Char("Crearis ID", compute=_compute_cid, store=True)
```

## Version Tracking

### Per-Record Versioning

Every content entity maintains a `version` field that auto-increments on write:

```python
version = fields.Integer(default=1)

def write(self, vals):
    vals['version'] = self.version + 1
    res = super().write(vals)
    self.invalidate_recordset()  # Ensure fresh reads
    return res
```

### Version Model (`crearis.version`)

For cross-domain change tracking, Crearis maintains a central version table:

```python
class Version(models.Model):
    _name = "crearis.version"
    _description = "Versions-Table to track Odoo-changesets via Redis"
    _order = "write_date, cid"

    cid = fields.Char('Crearis ID', required=True)
    version = fields.Integer(default=0)
    vtype = fields.Selection([
        ("7", "7 days"),      # Short-term cache
        ("m", "main"),        # Main version bump
        ("i", "incremental"), # Minor update
        ("d", "delete"),      # Record deleted
        ("r", "reload")       # Force full reload
    ])
    domain_ids = fields.Many2many("website", string="Domains")
    note = fields.Char('Note', help="Info about changes")
    author_id = fields.Many2one("res.users", string="Author")
    Vals = fields.Json(string="Values")  # Changed field values
```

### Version Types

| Type | Code | Description | Cache Impact |
|------|------|-------------|--------------|
| 7 days | `7` | Temporary cache entry | Expires automatically |
| Main | `m` | Significant content change | Invalidates all caches |
| Incremental | `i` | Minor update | Selective invalidation |
| Delete | `d` | Record removed | Remove from all caches |
| Reload | `r` | Force refresh | Full cache clear |

## Demo Data Detection

The `demo.data.mixin` provides automatic detection of demo/test records:

```python
class DemoDataMixin(models.AbstractModel):
    _name = 'demo.data.mixin'
    _description = 'Demo Data Detection Mixin'

    is_demo = fields.Boolean(
        string='Is Demo Data',
        compute='_compute_is_demo',
        store=False,
        help='True if XML ID starts with _demo'
    )

    def _compute_is_demo(self):
        for record in self:
            record.is_demo = False
            if not record.id:
                continue
            
            xml_ids = record.get_external_id()
            if xml_ids and xml_ids.get(record.id):
                xml_id = xml_ids[record.id]
                # Check if XML ID ends with _demo prefix
                # Format: module_name._demo_record_name
                parts = xml_id.split('.')
                if len(parts) > 1:
                    record.is_demo = parts[-1].startswith('_demo')
```

### Configuration

Demo data visibility can be controlled globally:

```python
# In ir.config_parameter
crearis.graphql.include_demo = 'True'  # or 'False'
```

## XML-RPC API Usage

### Reading Version Information

```typescript
// Fetch events with version info
const events = await odoo.searchRead(
    'event.event',
    [['active', '=', true]],
    ['id', 'name', 'cid', 'version'],
    { order: 'write_date desc' }
)

// Check specific version
const versions = await odoo.searchRead(
    'crearis.version',
    [['cid', '=', 'dasei.event-evnt__1']],
    ['version', 'vtype', 'write_date']
)
```

### Cache Invalidation Pattern

```typescript
// In Crearis-Vue
async function checkForUpdates(lastKnownVersion: number) {
    const versions = await odoo.searchRead(
        'crearis.version',
        [
            ['vtype', 'in', ['m', 'd', 'r']],
            ['version', '>', lastKnownVersion]
        ],
        ['cid', 'vtype', 'domain_ids']
    )
    
    for (const v of versions) {
        if (v.vtype === 'd') {
            cache.remove(v.cid)
        } else {
            cache.invalidate(v.cid)
        }
    }
}
```

## Best Practices

1. **Always include `cid` and `version`** when fetching content entities
2. **Use version checks** before heavy operations to avoid stale data
3. **Filter demo data** in production using `is_demo = False`
4. **Track changes** via the version model for multi-client synchronization
