# Developer Documentation

Welcome to the Theaterpedia developer documentation. This section is for:
- **Code automation** (AI assistants working on the codebase)
- **Expert-level Vue developers** contributing to the project

::: danger ALPHA MODE ACTIVE
The system currently uses a **temporary alpha publishing workaround**. Before making changes to project visibility or status logic, read:

👉 **[Alpha Publishing System](/dev/alpha-publishing)** — How `status_old` controls visibility during v0.4

This will be removed in v0.5 when full sysreg status is implemented.
:::

## Quick Links

| Resource | Description |
|----------|-------------|
| [Alpha Publishing](/dev/alpha-publishing) | 🚨 **Current** visibility control system |
| [Hack the Sysreg](/dev/hack-sysreg) | Quick reference tables for system registry |
| [Theme & Opus CSS](/dev/features/theme-opus-css) | oklch color system and CSS conventions |
| [cList Components](/dev/features/clist) | Core list/grid component family |
| [Image System](/dev/features/images) | ImgShape, processing, adapters |

## Architecture Overview

```
crearis-vue/
├── src/                      # Vue 3 Frontend
│   ├── components/           # Reusable components
│   │   ├── clist/            # Core list components
│   │   ├── images/           # Image handling
│   │   ├── page/             # Page layout
│   │   └── ...
│   ├── views/                # Page views
│   │   ├── project/          # Project stepper/dashboard
│   │   ├── admin/            # Admin views
│   │   └── ...
│   ├── composables/          # Vue composables
│   └── assets/               # CSS, fonts, static
├── server/                   # Nitro Backend
│   ├── api/                  # REST endpoints
│   ├── database/             # SQLite + migrations
│   └── utils/                # Server utilities
└── docs/                     # This documentation
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, TypeScript, Vite |
| Backend | Nitro, H3 |
| Database | SQLite (better-sqlite3) |
| Styling | CSS Custom Properties, oklch |
| Fonts | Monaspace family |

## Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Project Stepper | ✅ Stable | v0.3 |
| TagFamilies | ✅ Stable | Unit tested |
| cList/pList | ✅ Stable | Core component family |
| ImgShape | ✅ Stable | Multiple shapes supported |
| Page Editor | 🔄 In Progress | v0.4 |
| Post Editor | 🔄 In Progress | v0.4 |
| Auth System | ✅ Stable | Role-based triggers |

## Version Tags

Throughout this documentation:
- <span class="beta-badge">v0.5</span> = Beta feature (post-v0.4)
- <span class="post-release-badge">v1.1</span> = Post-release feature

---

*Start with [Hack the Sysreg](/dev/hack-sysreg) for quick reference tables.*
