# Routes Overview

::: warning Brief Summary
Detailed route documentation will be completed at end of v0.3 (for `/projects`) and v0.4 (for `/sites`).
:::

## Route Structure

### `/projects` Routes

Project management and editing:

| Route | Component | Description |
|-------|-----------|-------------|
| `/projects` | ProjectList | List all projects |
| `/projects/:id` | ProjectMain | Project stepper/dashboard |
| `/projects/:id/edit` | ProjectEdit | Direct edit mode |

### `/sites` Routes

Public-facing project sites:

| Route | Component | Description |
|-------|-----------|-------------|
| `/sites/:id` | SiteView | Public project homepage |
| `/sites/:id/:page` | PageView | Project subpages |

### `/admin` Routes

Admin views:

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/sysreg` | SysregAdmin | Sysreg table management |
| `/admin/users` | UsersAdmin | User management |
| `/admin/images` | ImagesAdmin | Image management |

## Auth Guards

Routes are protected based on user role:

```typescript
// Example route guard
{
  path: '/projects/:id',
  component: ProjectMain,
  meta: { requiresAuth: true }
}
```

## Navigation Modes

### Stepper Mode
- Active when `status_id` is 18 (new) or 19 (demo)
- Left panel shows step navigation
- Linear flow through project setup

### Dashboard Mode
- Active when `status_id` >= 2 (draft, published, etc.)
- Left panel shows tab navigation
- Free navigation between sections

---

*Full documentation: v0.3 (projects) / v0.4 (sites)*
