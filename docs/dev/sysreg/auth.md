# Sysreg I: Auth Focus

The auth-focused sysreg tables manage entity lifecycle and role-based visibility.

## Overview

Three tables for auth/state management:

| Table | Purpose |
|-------|---------|
| `sysreg_statuses` | Entity lifecycle states |
| `sysreg_configs` | System configuration |
| `sysreg_rtags` | Role visibility tags |

## sysreg_statuses

### Schema

```sql
CREATE TABLE sysreg_statuses (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  scope TEXT,
  bit INTEGER
);
```

### Standard Statuses

| ID | Name | Description | Scope |
|----|------|-------------|-------|
| 1 | idea | Initial concept | All |
| 2 | draft | Work in progress | All |
| 3 | review | Under review | All |
| 4 | published | Public/live | All |
| 5 | archived | No longer active | All |

### Project-Specific Statuses

| ID | Name | Description |
|----|------|-------------|
| 18 | new | New project (stepper mode) |
| 19 | demo | Demo project (stepper mode) |

### Usage in Code

```typescript
// Check if in stepper mode
const isStepper = computed(() => {
  return status_id === 18 || status_id === 19
})

// Check if published
const isPublished = computed(() => {
  return status_id === 4
})
```

## sysreg_configs

### Schema

```sql
CREATE TABLE sysreg_configs (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT,
  description TEXT
);
```

### Common Configs

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `site_name` | string | "Theaterpedia" | Site title |
| `default_theme` | number | 0 | Default theme ID |
| `default_language` | string | "de" | Default language |

### Accessing Configs

```typescript
// API
const response = await fetch('/api/sysreg/configs')
const configs = await response.json()

// Get specific value
const siteName = configs.find(c => c.key === 'site_name')?.value
```

## sysreg_rtags (Role Tags)

### Schema

```sql
CREATE TABLE sysreg_rtags (
  id INTEGER PRIMARY KEY,
  bit INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);
```

### Role Definitions

| Bit | Name | Description |
|-----|------|-------------|
| 2 | r_partner | Partner role |
| 4 | r_participant | Participant role |
| 8 | r_member | Member role |

### Role Visibility System

Entities have visibility columns:
- `r_partner` (boolean)
- `r_participant` (boolean)
- `r_member` (boolean)

These are automatically set by triggers based on `project_members.configrole`.

### project_members.configrole

The `configrole` column stores the user's role as a bitmask:

| Value | Role |
|-------|------|
| 2 | Partner |
| 4 | Participant |
| 8 | Member |
| 6 | Partner + Participant (2\|4) |
| 14 | All roles (2\|4\|8) |

### Visibility Triggers

```sql
-- Migrations 046-047 create triggers that automatically set r_* columns
-- When an entity is created/updated, the trigger checks the creator's role
-- and sets visibility accordingly
```

### Checking Visibility in Code

```typescript
// Check if user can see an entity
function canSeeEntity(entity: Entity, userRole: number): boolean {
  if (entity.r_partner && (userRole & 2)) return true
  if (entity.r_participant && (userRole & 4)) return true
  if (entity.r_member && (userRole & 8)) return true
  return false
}
```

## Database Schema Reference

### Entity Tables with Status

All main entities have a `status_id` column:

```sql
-- posts
ALTER TABLE posts ADD COLUMN status_id INTEGER REFERENCES sysreg_statuses(id);

-- events
ALTER TABLE events ADD COLUMN status_id INTEGER REFERENCES sysreg_statuses(id);

-- images
ALTER TABLE images ADD COLUMN status_id INTEGER REFERENCES sysreg_statuses(id);
```

### Entity Tables with Role Visibility

```sql
-- Added by migrations 045-048
ALTER TABLE posts ADD COLUMN r_partner INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN r_participant INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN r_member INTEGER DEFAULT 0;

-- Same for events, images, etc.
```

## API Endpoints

### List Statuses

```http
GET /api/sysreg/statuses
```

### List Configs

```http
GET /api/sysreg/configs
```

### List Rtags

```http
GET /api/sysreg/rtags
```

### Update Config

```http
PATCH /api/sysreg/configs/{key}
Content-Type: application/json

{ "value": "new_value" }
```

---

*See also: [Sysreg II: Content Focus](/dev/sysreg/content)*
