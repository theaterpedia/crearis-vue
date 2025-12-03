# Component Reference

This section documents the key Vue components in the Crearis platform.

## Component Categories

### Project Components
- [ProjectStepper](/reference/components/project-stepper) - Guided setup flow
- [ProjectNavigation](/reference/components/project-navigation) - Tab navigation for active projects

### Content Components
- [TagFamilies](/reference/components/tag-families) - Multi-tag selector (ttags, ctags, dtags)
- [ImageImporter](/reference/components/image-importer) - Batch image upload with metadata

### Layout Components
- Navbar - Application header with auth
- BaseView - Standard page layout wrapper

## Component Conventions

All components follow these conventions:

1. **TypeScript** - Full type safety with `<script setup lang="ts">`
2. **Props Interface** - Explicit `interface Props` definitions
3. **Emits Interface** - Typed event emissions
4. **Opus CSS** - oklch colors, CSS custom properties
