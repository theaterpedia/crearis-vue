# Page Heading System

## Overview

The Page Heading System is a comprehensive header/hero infrastructure that renders the top section of pages (posts, events, pages) with support for multiple layout types, responsive image handling, and a three-layer configuration system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Page/View Layer                            │
│  (PostView, EventView, PageView, etc.)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PageHeading.vue                              │
│  - Orchestrates header type selection                          │
│  - Merges configuration sources (3-layer)                      │
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
| `server/db/migrations/067_*.sql` | Database schema |

## Related Documentation

- [01-specification.md](01-specification.md) - Odoo values, heights, database schema
- [02-core-components.md](02-core-components.md) - Component props and usage
- [03-api-reference.md](03-api-reference.md) - Header config API
- [04-responsive-logic.md](04-responsive-logic.md) - Instance selection and sizing
- [05-format-options.md](05-format-options.md) - formatOptions system (alpha)
