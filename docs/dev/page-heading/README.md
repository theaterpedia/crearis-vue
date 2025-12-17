# Page Heading System

## Overview

The Page Heading System is a comprehensive header/hero infrastructure that renders the top section of pages (posts, events, pages) with support for multiple layout types, responsive image handling, theme integration, and a three-layer configuration system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Page/View Layer                            │
│  (PostView, EventView, PageView, ProjectSite, etc.)            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PageHeading.vue                              │
│  - Orchestrates header type selection                          │
│  - Merges configuration sources (3-layer + theme)              │
│  - Passes props to appropriate component                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
            ┌─────────────┴──────────────┐
            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────────┐
│      Hero.vue         │    │   TextImageHeader.vue     │
│  (banner, cover,      │    │   (columns layout)        │
│   bauchbinde)         │    │                           │
└───────────────────────┘    └───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                    Image Instance System                       │
│  hero_vertical (440×880)  │  hero_square (440×440)            │
│  hero_wide (1100×620)     │  hero_wide_xl (1440×820)          │
│  hero_square_xl (1440×1280)                                   │
└───────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PageHeading.vue` | `src/components/PageHeading.vue` | Orchestrator - selects layout type |
| `Hero.vue` | `src/components/Hero.vue` | Full-width hero with background image |
| `TextImageHeader.vue` | `src/components/TextImageHeader.vue` | Side-by-side columns layout |
| `useHeaderConfig` | `src/composables/useHeaderConfig.ts` | Configuration resolution |

## Configuration Files

| File | Purpose |
|------|---------|
| `server/api/header-configs/*.ts` | API endpoints |
| `src/composables/useHeaderConfig.ts` | Client-side config resolution |
| `server/database/migrations/067_*.ts` | Base header configs schema |
| `server/database/migrations/068_*.ts` | Theme integration (theme_id, project defaults) |

## Theme Integration (v0.4+)

Header configs can be associated with themes via `theme_id`:

```
┌─────────────────────────────────────────────────────────────────┐
│  Resolution Priority                                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Entity-level (post.header_type, post.header_size)          │
│  2. Theme-specific config (banner_theme0, cover_theme1, etc.)  │
│  3. Base config (banner, cover, columns, simple, bauchbinde)   │
└─────────────────────────────────────────────────────────────────┘
```

Project default settings stored in `projects` table:
- `site_header_type` / `site_header_size` - Project homepage
- `default_post_header_type` / `default_post_header_size` - New posts
- `default_event_header_type` / `default_event_header_size` - New events

## Related Documentation

- [01-specification.md](01-specification.md) - Odoo values, heights, database schema
- [02-core-components.md](02-core-components.md) - Component props and usage
- [03-api-reference.md](03-api-reference.md) - Header config API
- [04-responsive-logic.md](04-responsive-logic.md) - Instance selection and sizing
- [05-format-options.md](05-format-options.md) - formatOptions system (alpha)
- [06-theme-integration.md](06-theme-integration.md) - Theme-aware header configs
