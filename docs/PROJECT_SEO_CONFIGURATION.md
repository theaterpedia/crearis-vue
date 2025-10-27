# Project SEO Configuration

## Overview

Project sites can include SEO metadata in the `projects.config` JSONB field to optimize search engine visibility and social media sharing.

## Available SEO Fields in `projects.config`

```json
{
  "seo_title": "Custom page title (appears in browser tab and search results)",
  "seo_description": "Meta description for search engines (150-160 characters recommended)",
  "seo_keywords": "comma-separated, keywords, for, search, engines",
  "seo_image": "https://example.com/og-image.jpg",
  "og_title": "Custom Open Graph title (falls back to seo_title)",
  "og_description": "Custom OG description (falls back to seo_description)",
  "twitter_card": "summary_large_image"
}
```

## Field Details

### Basic SEO Fields

- **`seo_title`** (string, optional)
  - Custom page title for search engines
  - Appears in browser tab and search results
  - **Fallback chain**: `seo_title` → `project.name` → `project.heading` → `project.domaincode`
  - Automatically appends " - Theaterpedia" to the title

- **`seo_description`** (string, optional)
  - Meta description for search engines
  - Recommended length: 150-160 characters
  - **Fallback chain**: `seo_description` → `project.teaser` → `project.description`

- **`seo_keywords`** (string, optional)
  - Comma-separated keywords for search engines
  - Example: "theater, performance, munich, drama, acting"
  - **Fallback**: Not set if empty

- **`seo_image`** (string, optional)
  - URL to image for social media sharing
  - Recommended size: 1200x630px for best results
  - **Fallback chain**: `seo_image` → `project.cimg`

### Open Graph (Social Media) Fields

- **`og_title`** (string, optional)
  - Title for social media shares (Facebook, LinkedIn, etc.)
  - **Fallback**: Uses `seo_title` or project name

- **`og_description`** (string, optional)
  - Description for social media shares
  - **Fallback**: Uses `seo_description` or project teaser

### Twitter Card Fields

- **`twitter_card`** (string, optional)
  - Twitter card type: `summary` or `summary_large_image`
  - **Default**: `summary_large_image`

## Implementation

The SEO metadata is automatically applied when a project site loads in `ProjectSite.vue`:

```typescript
// Extract SEO data from project.config with fallbacks
const config = project.value.config || {};
const seoTitle = config.seo_title || project.value.name || project.value.heading;
const seoDescription = config.seo_description || project.value.teaser;
// ... etc
```

## Example: Setting SEO Metadata via API

### Update Project Config

```bash
curl -X PATCH http://localhost:3000/api/projects/123 \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "seo_title": "Munich Theatre Festival 2025",
      "seo_description": "Experience cutting-edge theater performances at the Munich Theatre Festival. Four days of innovative productions from international artists.",
      "seo_keywords": "theater festival, munich, performance, drama, 2025",
      "seo_image": "https://res.cloudinary.com/example/festival-og.jpg",
      "twitter_card": "summary_large_image"
    }
  }'
```

### Or via SQL

```sql
UPDATE projects 
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{seo_title}',
  '"Munich Theatre Festival 2025"'
)
WHERE domaincode = 'munich-festival';
```

## Home Routes vs Project Sites

### Home Routes
- Use static configuration in `src/config/homeroutes.ts`
- Applied in `Home.vue`, `GetStarted.vue`, etc.
- Hardcoded values for network homepage routes

### Project Sites
- Use dynamic data from `projects.config` JSONB field
- Applied in `ProjectSite.vue`
- Fallback to project properties if SEO fields not set

## Migration Timeline

This SEO implementation is **temporary** (3-6 months) during the system migration. It provides essential SEO capabilities without requiring a full SSR architecture rewrite.

## Testing

### View Applied Meta Tags

Open browser developer tools and inspect `<head>` section:

```html
<title>Munich Theatre Festival 2025 - Theaterpedia</title>
<meta name="description" content="Experience cutting-edge theater performances...">
<meta name="keywords" content="theater festival, munich, performance, drama, 2025">
<meta property="og:title" content="Munich Theatre Festival 2025">
<meta property="og:description" content="Experience cutting-edge theater performances...">
<meta property="og:image" content="https://res.cloudinary.com/example/festival-og.jpg">
<meta name="twitter:card" content="summary_large_image">
```

### Test Social Sharing

- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

## Future Enhancements

When the full SSR architecture is implemented, consider:

1. Server-side meta tag rendering
2. Dynamic sitemap generation
3. Structured data (JSON-LD) for rich snippets
4. Canonical URLs for duplicate content prevention
5. hreflang tags for multi-language support
