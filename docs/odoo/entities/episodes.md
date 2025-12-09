# Blog Posts / Episodes (blog.post)

The Crearis episode model extends Odoo's standard `blog.post` with content management fields, domain assignment, and markdown support.

## Model Definition

```python
class BlogPost(models.Model):
    _inherit = ['blog.post', 'web.options.abstract', 'demo.data.mixin']
    _name = 'blog.post'
```

### Inheritance

- `blog.post` - Standard Odoo Blog module
- `web.options.abstract` - JSON options mixin
- `demo.data.mixin` - Demo data detection

## Crearis Custom Fields

### Content Fields

```python
description = fields.Char('Teasertext', translate=True, default='')
md = fields.Text('Markdown Content', translate=True, default='')
blocks = fields.Json()
cimg = fields.Text('Hero-Image-Link', translate=False, default='')
```

| Field | Type | Description |
|-------|------|-------------|
| `description` | Char | Short teaser text for listings |
| `md` | Text | Markdown content body |
| `blocks` | Json | Content blocks array |
| `cimg` | Text | Hero image URL (typically Cloudinary) |

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
```

### Domain Assignment

```python
homesite_id = fields.Many2one(
    "website",
    string="Homesite (Editing Website)",
    ondelete="restrict",
    help="Editing only allowed from this website.",
    index=True
)
```

::: info
`homesite_id` restricts which website can edit the post. This is separate from `website_id` (where it's published).
:::

### Version Tracking

```python
version = fields.Integer(default=1)

def write(self, vals):
    vals['version'] = self.version + 1
    res = super().write(vals)
    self.invalidate_recordset()
    return res
```

## Crearis ID

```python
@api.depends("website_id")
def _compute_cid(self):
    template_code = 'post'

    for post in self:
        domain_code = 'private'
        if post.website_id.domain_code:
            domain_code = post.website_id.domain_code

        record_id = post.id or -1
        post.cid = f'{domain_code}.blog-{template_code}__{record_id}'

cid = fields.Char("Crearis ID", compute='_compute_cid', store=True)
```

**Format:** `{domain}.blog-{type}__{id}`

**Examples:**
- `dasei.blog-post__1`
- `tpedia.blog-post__42`
- `private.blog-post__15`

## Blocks System

The `blocks` JSON field stores structured content:

```python
def json_data_store(self):
    """Initialize blocks if empty."""
    if not self.blocks:
        self.blocks = []
```

### Block Structure

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
    "caption": "Photo from the event",
    "order": 2
  },
  {
    "type": "quote",
    "content": "Theater is life...",
    "author": "William Shakespeare",
    "order": 3
  },
  {
    "type": "video",
    "provider": "youtube",
    "videoId": "dQw4w9WgXcQ",
    "order": 4
  }
]
```

### Block Types

| Type | Description | Required Props |
|------|-------------|----------------|
| `text` | Rich text content | content |
| `image` | Image with caption | url, caption? |
| `quote` | Block quote | content, author? |
| `video` | Embedded video | provider, videoId |
| `gallery` | Image gallery | images[] |
| `embed` | External embed | html |

## Standard Odoo Fields

From base `blog.post`:

| Field | Type | Description |
|-------|------|-------------|
| `name` | Char | Post title |
| `subtitle` | Char | Subtitle |
| `author_id` | Many2one | Author (res.partner) |
| `blog_id` | Many2one | Parent blog |
| `content` | Html | Main HTML content |
| `website_id` | Many2one | Publishing website |
| `is_published` | Boolean | Published status |
| `post_date` | Datetime | Publication date |
| `visits` | Integer | View count |
| `tag_ids` | Many2many | Post tags |

## Complete Field List

```python
# Standard Odoo
name = fields.Char()           # Title
subtitle = fields.Char()       # Subtitle
content = fields.Html()        # HTML content
author_id = fields.Many2one()  # Author
blog_id = fields.Many2one()    # Parent blog
website_id = fields.Many2one() # Publishing site
is_published = fields.Boolean()
post_date = fields.Datetime()
tag_ids = fields.Many2many()

# Crearis custom
description = fields.Char()    # Teasertext
md = fields.Text()             # Markdown content
blocks = fields.Json()         # Content blocks
cimg = fields.Text()           # Hero image URL
header_type = fields.Selection()
header_size = fields.Selection()
homesite_id = fields.Many2one()# Editing restriction
cid = fields.Char(compute=...) # Crearis ID
version = fields.Integer()
```

## XML-RPC API

### Fetch Posts

```typescript
const posts = await odoo.searchRead(
    'blog.post',
    [
        ['is_published', '=', true],
        ['website_id', '=', websiteId]
    ],
    [
        // Standard fields
        'id', 'name', 'subtitle', 'author_id', 'blog_id',
        'content', 'website_id', 'is_published', 'post_date',
        // Crearis fields
        'cid', 'description', 'cimg', 'md', 'blocks',
        'header_type', 'header_size', 'homesite_id', 'version'
    ],
    { limit: 20, order: 'post_date desc' }
)
```

### Example Response

```json
{
  "id": 42,
  "name": "Rückblick Sommerakademie 2025",
  "subtitle": "Eine Woche voller Inspiration",
  "author_id": [59, "Hans Dönitz"],
  "blog_id": [1, "Theaterpedia Blog"],
  "website_id": [2, "Das Ei"],
  "is_published": true,
  "post_date": "2025-08-15 10:00:00",
  "cid": "dasei.blog-post__42",
  "description": "Die Sommerakademie 2025 war ein voller Erfolg...",
  "cimg": "https://res.cloudinary.com/.../sommerakademie.jpg",
  "md": "# Rückblick\n\nDie Sommerakademie...",
  "blocks": [
    {"type": "text", "content": "...", "order": 1}
  ],
  "header_type": "cover",
  "header_size": "full",
  "homesite_id": [2, "Das Ei"],
  "version": 5
}
```

### Create Post

```typescript
const postId = await odoo.create('blog.post', {
    name: 'New Blog Post',
    blog_id: blogId,
    website_id: websiteId,
    homesite_id: websiteId,
    description: 'Teaser text for the post',
    header_type: 'banner',
    header_size: 'medium',
    cimg: 'https://cloudinary.com/image.jpg',
    md: '# Post Content\n\nMarkdown body...',
    blocks: []
})
```

### Update Post with Blocks

```typescript
await odoo.write('blog.post', [postId], {
    blocks: [
        { type: 'text', content: 'Updated intro', order: 1 },
        { type: 'image', url: 'https://...', caption: 'Photo', order: 2 }
    ],
    description: 'Updated teaser',
    version: currentVersion + 1  // Or let write() handle it
})
```

## Content Rendering Priority

When rendering posts in Crearis-Vue:

1. **blocks** (if populated) - Structured block content
2. **md** - Markdown content
3. **content** - Standard HTML content (fallback)

```typescript
function getPostContent(post: BlogPost): string {
    if (post.blocks && post.blocks.length > 0) {
        return renderBlocks(post.blocks)
    }
    if (post.md) {
        return renderMarkdown(post.md)
    }
    return post.content
}
```

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        blog.post                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ cid: "dasei.blog-post__42"                            │  │
│  │ name: "Rückblick Sommerakademie"                      │  │
│  │ website_id → website (publishing site)                │  │
│  │ homesite_id → website (editing site)                  │  │
│  │ blog_id → blog.blog                                   │  │
│  │ author_id → res.partner                               │  │
│  │ blocks: [{...}, {...}]                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
   ┌──────────┐  ┌───────────┐  ┌──────────────┐
   │  website │  │ blog.blog │  │ res.partner  │
   │  (domain)│  │ (category)│  │ (author)     │
   └──────────┘  └───────────┘  └──────────────┘
```

## Best Practices

1. **Use description** for listing teasers (not truncated content)
2. **Prefer md over content** for new posts
3. **Use blocks** for complex layouts
4. **Set homesite_id** to restrict editing
5. **Include cimg** for visual listings
6. **Track versions** via auto-increment
