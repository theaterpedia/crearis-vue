# Theme Integration

## Overview

As of migration 068, the Page Heading system supports theme-aware configurations. Header configs can be associated with specific themes via the `theme_id` foreign key, enabling automatic styling changes when a project's theme changes.

## Database Schema Changes (Migration 068)

### header_configs table

```sql
ALTER TABLE header_configs ADD COLUMN theme_id INTEGER;
```

Theme-specific configs are created with naming convention `{parent_type}_theme{id}`:
- `banner_theme0`, `banner_theme1`, ..., `banner_theme7`
- `cover_theme0`, `cover_theme1`, ..., `cover_theme7`

### projects table

```sql
ALTER TABLE projects ADD COLUMN site_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN site_header_size VARCHAR(20);
ALTER TABLE projects ADD COLUMN default_post_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN default_post_header_size VARCHAR(20);
ALTER TABLE projects ADD COLUMN default_event_header_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN default_event_header_size VARCHAR(20);
```

## Resolution Logic

The `/api/header-configs/resolve` endpoint handles theme-aware resolution:

```typescript
// Query parameters - project_id can be numeric ID OR domaincode
GET /api/header-configs/resolve?header_type=banner&project_id=opus1
GET /api/header-configs/resolve?header_type=banner&project_id=9&theme_id=3

// Resolution order:
// 1. If project_id provided, resolve project and get theme_id from projects.theme
// 2. Look for theme-specific config: banner_theme3
// 3. Fall back to base/subcategory config: banner.default
// 4. Merge with project overrides if any
```

### Auto-detection from Project

If `theme_id` is not provided but `projectId` is, the API auto-detects:

```typescript
// Fetch project's theme
const project = await getProject(projectId)
const themeId = project?.theme  // e.g., 2

// Look up theme-specific config
const themeConfig = await findConfig(`${headerType}_theme${themeId}`)
```

## Client-Side Usage

### useHeaderConfig composable

```typescript
import { useHeaderConfig } from '@/composables/useHeaderConfig'

// On /sites/:domaincode/* routes - auto-detects project from route
const { resolvedConfig, isLoading, meta } = useHeaderConfig({
  headerType: computed(() => post.header_type || 'banner')
  // projectId auto-detected from route.params.domaincode
  // themeId auto-detected from project on server
})

// With explicit project ID
const { resolvedConfig } = useHeaderConfig({
  headerType: 'banner',
  projectId: 9  // or 'opus1' domaincode
})
```

### Response includes layer info

```typescript
interface HeaderConfigMeta {
  isProjectOverride: boolean
  themeId?: number
  themeSpecific?: boolean  // true if using theme-specific config
}

const { config, meta } = useHeaderConfig({ ... })
// meta.themeSpecific === true when using banner_theme2 instead of banner
```

## Admin UI: HeaderConfigsEditor

The admin panel at `src/components/sysreg/HeaderConfigsEditor.vue` allows:

1. **Creating theme-specific configs**: Dropdown to assign `theme_id`
2. **Visual indication**: Purple badge shows theme association
3. **Filtering**: View configs by theme or parent type

```vue
<!-- Theme badge on config cards -->
<span v-if="config.theme_id != null" class="badge badge-theme">
  🎨 {{ getThemeName(config.theme_id) }}
</span>
```

## User-Facing Configuration

### ThemeConfigPanel

Located at `src/components/ThemeConfigPanel.vue`, provides:

| Setting | Description | Stored In |
|---------|-------------|-----------|
| Site Header Type | Homepage header layout | `projects.site_header_type` |
| Site Header Size | Homepage header height | `projects.site_header_size` |
| Default Post Header | Pre-fill for new posts | `projects.default_post_header_type/size` |
| Default Event Header | Pre-fill for new events | `projects.default_event_header_type/size` |

### AddPostPanel / EventPanel

These panels load project defaults and allow per-entry override:

```typescript
// Load defaults
const project = await fetch(`/api/projects/${projectId}`)
headerType.value = project.default_post_header_type || 'banner'
headerSize.value = project.default_post_header_size || 'medium'

// Save with entity
POST /api/posts {
  header_type: headerType.value,
  header_size: headerSize.value,
  // ... other fields
}
```

## Theme JSON Files

Themes are defined as JSON files in `server/themes/`:

```
server/themes/
├── index.json          # Theme metadata list
├── theme-0.json        # Theme 0 details
├── theme-1.json        # Theme 1 details
└── ...
```

The `theme` column in `projects` references the theme ID (0-7).

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  User changes project theme in ThemeConfigPanel                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  projects.theme = 2                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PageHeading requests config:                                   │
│  useHeaderConfig({ headerType: 'banner', projectId: 'tp' })     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  API resolves: banner_theme2 → exists → return theme config     │
│  (or falls back to 'banner' if no theme-specific exists)        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hero/TextImageHeader renders with theme-specific styles        │
│  (different gradient, sizes, alignment, etc.)                   │
└─────────────────────────────────────────────────────────────────┘
```

## Creating Theme-Specific Configs

To create a custom config for theme 3:

1. Open HeaderConfigsEditor (sysreg admin panel)
2. Click **"Add Theme-Header"** button (purple border)
3. Select parent type (e.g., `banner`)
4. Select theme from dropdown (e.g., "Institut" = theme 3)
5. Name auto-generates: `banner_theme3`
6. Configure properties (gradient, alignment, size, etc.)
7. Save

The config will be automatically used when projects with theme 3 request a banner header.

### Naming Convention

- Subcategories use dot: `banner.compact`, `cover.dramatic`
- Theme configs use underscore: `banner_theme3`, `cover_theme0`

### Deleting Theme Configs

Theme-specific configs CAN be deleted (they show Delete button).
Global defaults like `banner.default` CANNOT be deleted.
