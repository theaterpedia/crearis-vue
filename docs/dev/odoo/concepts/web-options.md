# Web Options Abstract Mixin

The `web.options.abstract` is an Odoo abstract model that provides a standardized system for managing web presentation options across content entities. It uses **four separate JSON fields** for page, aside, header, and footer sections.

## Overview

```python
class WebOptionsAbstract(models.AbstractModel):
    _name = 'web.options.abstract'
    _description = 'Web Options Abstract Model'
```

### Purpose

- Provide flexible, schema-less configuration for web page layout
- Enable per-entity customization of page sections
- Store presentation options without database migrations
- Offer typed computed accessors for common settings

### Models Using This Mixin

| Model | Technical Name | Inherits |
|-------|----------------|----------|
| Events | `event.event` | `['event.event', 'web.options.abstract', 'demo.data.mixin']` |
| Episodes | `blog.post` | `['blog.post', 'web.options.abstract', 'demo.data.mixin']` |
| Partners | `res.partner` | `['res.partner', 'web.options.abstract', 'demo.data.mixin']` |
| Domain Users | `crearis.domainuser` | `['web.options.abstract', 'demo.data.mixin']` |

## JSON Option Fields

The mixin provides four stored JSON fields, one for each page section:

### Page Options

```python
page_options = fields.Json(
    string='Page Options',
    help='JSON structure containing page options: background, cssvars, navigation, etc.',
    default=False
)
```

**Structure:**
```json
{
  "background": "primary",
  "cssvars": "--custom-color: #ff0000;",
  "navigation": "sidebar",
  "options": "additional config"
}
```

### Aside Options

```python
aside_options = fields.Json(
    string='Aside Options',
    help='JSON structure containing aside/sidebar options: postit, toc, list, context, etc.',
    default=False
)
```

**Structure:**
```json
{
  "postit": "Quick note text",
  "toc": "auto",
  "list": "events",
  "context": "related content config",
  "options": "additional config"
}
```

### Header Options

```python
header_options = fields.Json(
    string='Header Options',
    help='JSON structure containing header options: alert, postit, etc.',
    default=False
)
```

**Structure:**
```json
{
  "alert": "Important announcement text",
  "postit": "Header note",
  "options": "additional config"
}
```

### Footer Options

```python
footer_options = fields.Json(
    string='Footer Options',
    help='JSON structure containing footer options: gallery, slider, sitemap, etc.',
    default=False
)
```

**Structure:**
```json
{
  "gallery": "events",
  "postit": "Footer note",
  "slider": "partners",
  "repeat": "schedule config",
  "sitemap": "medium",
  "options": "additional config"
}
```

## Content Indicator Fields

Stored boolean fields that indicate whether each section has content:

| Field | Depends On | Description |
|-------|------------|-------------|
| `page_has_content` | `page_options` | True if page_options has any content |
| `aside_has_content` | `aside_options` | True if aside_options has any content |
| `header_has_content` | `header_options` | True if header_options has any content |
| `footer_has_content` | `footer_options` | True if footer_options has any content |

```python
@api.depends('page_options')
def _compute_page_has_content(self):
    for record in self:
        record.page_has_content = bool(
            record.page_options and 
            isinstance(record.page_options, dict) and 
            record.page_options
        )
```

## Change Detection Fields

Non-stored computed fields for detecting unsaved changes:

| Field | Description |
|-------|-------------|
| `page_has_changes` | True if page_options differs from database |
| `aside_has_changes` | True if aside_options differs from database |
| `header_has_changes` | True if header_options differs from database |
| `footer_has_changes` | True if footer_options differs from database |

## Computed Accessor Fields

The mixin provides typed computed fields for individual options, using compute/inverse pattern:

### Page Accessors

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `page_background` | Selection | primary, secondary, accent, neutral, muted, positive, negative, warning | Background color scheme |
| `page_cssvars` | Text | - | Custom CSS variables |
| `page_navigation` | Text | - | Navigation configuration |
| `page_options_text` | Text | - | Additional page options |

### Aside Accessors

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `aside_postit` | Text | - | Post-it note content |
| `aside_toc` | Text | - | Table of contents config |
| `aside_list` | Selection | alike, product, events, posts, partners, companies, media | List widget type |
| `aside_context` | Text | - | Context configuration |
| `aside_options_text` | Text | - | Additional aside options |

### Header Accessors

| Field | Type | Description |
|-------|------|-------------|
| `header_alert` | Text | Alert banner content |
| `header_postit` | Text | Post-it note content |
| `header_options_text` | Text | Additional header options |

### Footer Accessors

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `footer_gallery` | Selection | alike, product, events, posts, partners, companies, media | Gallery widget type |
| `footer_postit` | Text | - | Post-it note content |
| `footer_slider` | Selection | alike, product, events, posts, partners, companies, media | Slider widget type |
| `footer_repeat` | Text | - | Repeat/schedule config |
| `footer_sitemap` | Selection | none, small, medium, large | Sitemap size |
| `footer_options_text` | Text | - | Additional footer options |

### Accessor Pattern

Each accessor follows this compute/inverse pattern:

```python
@api.depends('page_options')
def _compute_page_background(self):
    for record in self:
        record.page_background = record.get_option('page', 'background', False)

def _inverse_page_background(self):
    for record in self:
        if record.page_background:
            record.set_option('page', 'background', record.page_background)
        else:
            record.remove_option('page', 'background')
```

## Helper Methods

### get_option()

```python
def get_option(self, section, option_name, default=None):
    """
    Get a specific option value from a section.
    
    Args:
        section (str): 'page', 'aside', 'header', or 'footer'
        option_name (str): Name of the option
        default: Default value if not found
        
    Returns:
        The option value or default
    """
```

**Example:**
```python
background = record.get_option('page', 'background', 'neutral')
gallery_type = record.get_option('footer', 'gallery', False)
```

### set_option()

```python
def set_option(self, section, option_name, value):
    """
    Set a specific option value in a section.
    Only sets if value is truthy.
    
    Args:
        section (str): 'page', 'aside', 'header', or 'footer'
        option_name (str): Name of the option
        value: Value to set
    """
```

**Example:**
```python
record.set_option('page', 'background', 'accent')
record.set_option('footer', 'sitemap', 'large')
```

### remove_option()

```python
def remove_option(self, section, option_name):
    """
    Remove a specific option from a section.
    Sets section to False if empty after removal.
    
    Args:
        section (str): 'page', 'aside', 'header', or 'footer'
        option_name (str): Name of the option to remove
    """
```

**Example:**
```python
record.remove_option('header', 'alert')
```

## Button Action Methods

The mixin provides action methods for Odoo form view buttons:

| Method | Action |
|--------|--------|
| `action_create_page_options()` | Initialize page_options with defaults |
| `action_delete_page_options()` | Clear page_options (set to False) |
| `action_create_aside_options()` | Initialize aside_options with defaults |
| `action_delete_aside_options()` | Clear aside_options |
| `action_create_header_options()` | Initialize header_options with defaults |
| `action_delete_header_options()` | Clear header_options |
| `action_create_footer_options()` | Initialize footer_options with defaults |
| `action_delete_footer_options()` | Clear footer_options |

### Default Values

When creating options, these defaults are applied:

```python
# Page defaults
{
    'background': 'primary',
    'cssvars': '',
    'navigation': '',
    'options': ''
}

# Aside defaults
{
    'postit': '',
    'toc': '',
    'list': False,
    'context': '',
    'options': ''
}

# Header defaults
{
    'alert': '',
    'postit': '',
    'options': ''
}

# Footer defaults
{
    'gallery': False,
    'postit': '',
    'slider': False,
    'repeat': '',
    'sitemap': 'medium',
    'options': ''
}
```

## XML-RPC API Usage

### Reading Web Options

```typescript
const events = await odoo.searchRead(
    'event.event',
    [['id', '=', 1]],
    ['name', 'page_options', 'aside_options', 'header_options', 'footer_options']
)

// JSON fields come pre-parsed
const pageOpts = events[0].page_options  // Object or false
const footerOpts = events[0].footer_options
```

### Writing Web Options

```typescript
// Set entire section
await odoo.write('event.event', [eventId], {
    page_options: {
        background: 'accent',
        cssvars: '--hero-height: 400px;'
    },
    footer_options: {
        gallery: 'events',
        sitemap: 'large'
    }
})

// Clear a section
await odoo.write('event.event', [eventId], {
    aside_options: false
})
```

### Reading Accessor Fields

```typescript
// Read typed accessor fields
const events = await odoo.searchRead(
    'event.event',
    [['id', '=', 1]],
    ['page_background', 'footer_sitemap', 'aside_list']
)

const bg = events[0].page_background  // 'accent' or false
const sitemap = events[0].footer_sitemap  // 'large' or false
```

## Complete Field Reference

### Stored Fields (8)

| Field | Type | Description |
|-------|------|-------------|
| `page_options` | Json | Page section configuration |
| `aside_options` | Json | Aside/sidebar configuration |
| `header_options` | Json | Header section configuration |
| `footer_options` | Json | Footer section configuration |
| `page_has_content` | Boolean | Whether page has options |
| `aside_has_content` | Boolean | Whether aside has options |
| `header_has_content` | Boolean | Whether header has options |
| `footer_has_content` | Boolean | Whether footer has options |

### Computed Fields (20)

| Field | Type | Section |
|-------|------|---------|
| `page_has_changes` | Boolean | Page |
| `page_background` | Selection | Page |
| `page_cssvars` | Text | Page |
| `page_navigation` | Text | Page |
| `page_options_text` | Text | Page |
| `aside_has_changes` | Boolean | Aside |
| `aside_postit` | Text | Aside |
| `aside_toc` | Text | Aside |
| `aside_list` | Selection | Aside |
| `aside_context` | Text | Aside |
| `aside_options_text` | Text | Aside |
| `header_has_changes` | Boolean | Header |
| `header_alert` | Text | Header |
| `header_postit` | Text | Header |
| `header_options_text` | Text | Header |
| `footer_has_changes` | Boolean | Footer |
| `footer_gallery` | Selection | Footer |
| `footer_postit` | Text | Footer |
| `footer_slider` | Selection | Footer |
| `footer_repeat` | Text | Footer |
| `footer_sitemap` | Selection | Footer |
| `footer_options_text` | Text | Footer |

## Relationship to Other Concepts

- **[JSON Fields](./json-fields.md)** - General patterns for JSON field usage in Crearis
- **[Demo Data Mixin](./demo-data.md)** - Often inherited alongside web.options.abstract

## Best Practices

1. **Use accessors** - Prefer typed accessor fields over direct JSON access
2. **Check has_content** - Use `*_has_content` fields for conditional UI
3. **Default to False** - Set section to `False` (not `{}`) when empty
4. **Atomic updates** - Update entire sections at once via API
5. **Validate in frontend** - JSON structure validation should happen client-side

## Odoo Backend UI Pattern

The web options mixin is displayed in Odoo forms using a consistent UI pattern across all inheriting models.

### UI Structure

```xml
<!-- 1. Hidden state fields (always present) -->
<field name="page_options" invisible="1"/>
<field name="page_has_content" invisible="1"/>
<field name="page_has_changes" invisible="1"/>
<!-- ... repeat for aside, header, footer ... -->

<!-- 2. Toggle buttons with conditional visibility -->
<group>
    <button name="action_create_page_options" 
            type="object" 
            string="Create Page Options"
            class="btn-primary"
            icon="fa-plus"
            attrs="{'invisible': [('page_has_content', '=', True)]}"/>
    
    <button name="action_delete_page_options" 
            type="object" 
            string="Delete Page Options"
            class="btn-danger"
            icon="fa-times"
            attrs="{'invisible': [('page_has_content', '=', False)]}"
            confirm="Are you sure you want to delete all page options?"/>
</group>

<!-- 3. Conditional section display -->
<div attrs="{'invisible': [('page_has_content', '=', False)]}">
    <separator string="Page Options"/>
    <group string="Page Configuration">
        <group>
            <field name="page_background"/>
            <field name="page_cssvars" widget="text"/>
        </group>
        <group>
            <field name="page_navigation" widget="text"/>
            <field name="page_options_text" widget="text"/>
        </group>
    </group>
</div>
```

### Debug View (Developer Mode)

Models can expose raw JSON in developer mode:

```xml
<group string="Debug Information" groups="base.group_no_one">
    <separator string="Options (JSON)"/>
    <field name="page_options" widget="json"/>
    <field name="aside_options" widget="json"/>
    <field name="header_options" widget="json"/>
    <field name="footer_options" widget="json"/>
</group>
```

### Entity-Specific Variations

| Entity | View File | Special Features |
|--------|-----------|------------------|
| Events | `event_event_views.xml` | Uses computed accessors in 2-column groups |
| Episodes | `website_pages_views.xml` | "Format Options" tab in notebook |
| Partners | `res_partner.xml` | "Website" tab, raw JSON display |
| Domain Users | `crearis_domainuser_views.xml` | Includes `header_type`, `header_size`, `cimg` in header section |

### Vue.js Component Translation

This Odoo UI pattern can be translated to Vue.js:

```vue
<template>
  <!-- Toggle buttons -->
  <div class="flex gap-2">
    <button v-if="!pageHasContent" 
            @click="createPageOptions"
            class="btn btn-primary">
      <PlusIcon /> Create Page Options
    </button>
    <button v-else 
            @click="confirmDeletePageOptions"
            class="btn btn-danger">
      <XIcon /> Delete Page Options
    </button>
  </div>
  
  <!-- Conditional section -->
  <div v-if="pageHasContent" class="mt-4">
    <h3>Page Options</h3>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label>Background</label>
        <select v-model="pageBackground">
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <!-- ... -->
        </select>
      </div>
      <div>
        <label>CSS Variables</label>
        <textarea v-model="pageCssvars" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const pageHasContent = computed(() => 
  record.page_options && 
  typeof record.page_options === 'object' && 
  Object.keys(record.page_options).length > 0
)

const pageBackground = computed({
  get: () => record.page_options?.background || null,
  set: (val) => updateOption('page', 'background', val)
})
</script>
```

### Key Translation Patterns

| Odoo Pattern | Vue.js Equivalent |
|--------------|-------------------|
| `attrs="{'invisible': [...]}"` | `v-if="condition"` / `v-show="condition"` |
| `<button type="object">` | `@click="methodName()"` |
| `confirm="..."` attribute | Confirmation modal/dialog component |
| `<group col="2">` | CSS Grid / Flexbox containers |
| `widget="text"` | `<textarea>` component |
| `widget="json"` | JSON editor component / `<pre>` display |
| `groups="base.group_no_one"` | Role-based visibility (`v-if="isDeveloper"`) |
