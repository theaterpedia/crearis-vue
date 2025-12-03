# Introduction

Welcome to the Crearis documentation. Crearis is a Vue 3 platform for building and managing collaborative creative projects, originally developed for [Theaterpedia](https://theaterpedia.org).

## What is Crearis?

Crearis provides a complete workflow for:

- **Project Setup** - Guided stepper for configuring new projects
- **Content Management** - Events, posts, and images with rich metadata
- **User Collaboration** - Role-based access with owner, partner, participant, and member roles
- **Theming** - Customizable themes with the Opus CSS convention

## Architecture Overview

```
crearis-vue/
├── src/                    # Vue 3 frontend
│   ├── components/         # Reusable components
│   ├── views/              # Page views
│   ├── composables/        # Vue composables
│   └── assets/             # Static assets
├── server/                 # Nitro backend
│   ├── api/                # API endpoints
│   ├── database/           # SQLite + migrations
│   └── utils/              # Server utilities
└── docs/                   # This documentation
```

## Quick Links

- [Quick Start](/guide/quick-start) - Get up and running
- [Project Workflow](/guide/project-workflow) - Understanding the stepper
- [Opus CSS](/guide/opus-css) - Styling conventions
- [API Reference](/reference/api/) - Backend endpoints
