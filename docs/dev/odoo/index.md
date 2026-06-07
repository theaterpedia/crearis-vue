# Crearis Odoo API Documentation

This documentation covers the Crearis extensions to Odoo 16 Community Edition, providing a comprehensive reference for the XML-RPC API integration with Crearis-Vue.

## Overview

Crearis extends standard Odoo models with custom fields and introduces new models for multi-tenant project management. The architecture centers around **domains** (websites) as project containers, with users having role-based access across domains.

## Documentation Structure

### A. Basic Concepts
- [XML IDs & Versioning](./concepts/xmlid-versioning.md) - How Crearis tracks changes and generates unique IDs
- [JSON Fields](./concepts/json-fields.md) - Heavy use of JSON fields for flexible configuration
- [Web Options](./concepts/web-options.md) - Abstract mixin for page section configuration (page, aside, header, footer)
- [Demo Data Detection](./concepts/demo-data.md) - Mixin for identifying demo/test records

### B. Project Architecture  
- [Website as Project](./project/website.md) - The domain_code concept and project structure
- [Domain Users](./project/domainuser.md) - User-project relationships and roles
- [Configuration](./project/config.md) - Config templates and settings

### C. Entities
- [Events](./entities/events.md) - Extended event.event model
- [Blog Posts (Episodes)](./entities/episodes.md) - Extended blog.post model  
- [Partners & Locations](./entities/partners.md) - Extended res.partner model

### D. Events API
- [Events API Reference](./api/events.md) - Complete API documentation
- [Event Sessions](./api/sessions.md) - OCA module for sub-events with scheduling
- [Event Workflows](./api/workflows.md) - Agenda templates and automation

## Key Concepts

### The CID (Crearis ID)

Every entity in Crearis has a computed `cid` field that provides a globally unique identifier:

```
{domain_code}.{entity_type}-{subtype}__{id}
```

Examples:
- `dasei.event-evnt__1` - Event #1 on the "dasei" domain
- `private.partner-company.42` - Company partner #42 without domain
- `tpedia.blog-post__15` - Blog post #15 on "tpedia" domain

### Common Header Fields

Most content entities share these presentation fields:

| Field | Type | Description |
|-------|------|-------------|
| `header_type` | Selection | Layout style: simple, columns, banner, cover, bauchbinde |
| `header_size` | Selection | Size: mini, medium, prominent, full |
| `cimg` | Text | Hero image URL (typically Cloudinary) |
| `md` | Text | Markdown content body |
| `version` | Integer | Auto-incrementing version counter |

### Inheritance Pattern

Crearis models typically inherit from multiple mixins:

```python
class Event(models.Model):
    _inherit = ['event.event', 'web.options.abstract', 'demo.data.mixin']
```

- `web.options.abstract` - Provides 4 JSON fields for page sections (page, aside, header, footer) with typed accessors. See [Web Options](./concepts/web-options.md)
- `demo.data.mixin` - Adds `is_demo` computed field. See [Demo Data](./concepts/demo-data.md)

## API Access

The Crearis-Vue application accesses Odoo via XML-RPC:

- **Endpoint**: `http://localhost:8069/xmlrpc/2/`
- **Authentication**: API key-based
- **Database**: Configurable (default: `crearis`)

See individual entity documentation for available fields and API examples.
