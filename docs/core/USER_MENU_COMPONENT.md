# UserMenu Component

**Created**: October 21, 2025  
**Type**: Dropdown Menu Component

## Overview

The `UserMenu` component provides a consistent dropdown interface for user-specific settings and actions. It mirrors the design and behavior of `AdminMenu` but is tailored for regular users and project role users.

## Usage

### Basic Implementation

```vue
<template>
  <UserMenu 
    :username="user.username"
    :active-role="user.role"
    :project-name="user.projectName"
    :available-roles="user.availableRoles"
    @logout="handleLogout"
  >
    <template #role-toggle>
      <RoleToggle />
    </template>
    <template #inverted-toggle>
      <InvertedToggle />
    </template>
    <template #theme-dropdown>
      <ThemeDropdown />
    </template>
  </UserMenu>
</template>
```

### In Navbar

```vue
<div v-if="user && (user.role === 'user' || user.role === 'project')" class="navbar-item">
    <UserMenu 
        :username="user.username"
        :active-role="user.role"
        :project-name="user.projectName"
        :available-roles="user.availableRoles"
        @logout="$emit('logout')"
    >
        <template #role-toggle>
            <RoleToggle />
        </template>
        <template #inverted-toggle>
            <InvertedToggle />
        </template>
        <template #theme-dropdown>
            <ThemeDropdown />
        </template>
    </UserMenu>
</div>
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `username` | `string` | The displayed username |
| `activeRole` | `string` | Current active role of the user |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `projectName` | `string` | - | Name of active project (if in project role) |
| `availableRoles` | `string[]` | - | List of roles available to the user |
| `placement` | `'left' \| 'right'` | `'right'` | Dropdown alignment |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | - | Emitted when menu is closed |
| `logout` | - | Emitted when logout button is clicked |

## Slots

The component provides three named slots for injecting controls:

### `role-toggle`
Insert the RoleToggle component for users with multiple roles.

```vue
<template #role-toggle>
  <RoleToggle />
</template>
```

### `inverted-toggle`
Insert the InvertedToggle component for display mode switching.

```vue
<template #inverted-toggle>
  <InvertedToggle />
</template>
```

### `theme-dropdown`
Insert the ThemeDropdown component for theme selection.

```vue
<template #theme-dropdown>
  <ThemeDropdown />
</template>
```

## Menu Structure

The UserMenu displays sections in this order:

### 1. Header
- Username with icon (👤)
- Role status (shows project name if in project role)
- Close button

### 2. Role Section
**Visibility**: Only shown if `availableRoles.length > 1`
- Highlighted with blue gradient background
- Contains the role toggle control (injected via slot)

### 3. Display Settings Section
- Inverted mode toggle (injected via slot)
- Theme dropdown (injected via slot)

### 4. Account Actions Section
- Logout button with icon (🚪)

## Styling

The component uses CSS custom properties for theming:

### Colors
- `--color-bg`: Menu background
- `--color-border`: Border color
- `--color-primary-bg`: Header background
- `--color-primary-contrast`: Header text color
- `--color-text`: Body text color
- `--color-text-secondary`: Section titles
- `--color-muted-bg`: Hover states
- `--color-surface`: Active states
- `--color-accent`: Accent color

### Dimensions
- Menu width: `400px` (desktop), `320px` (mobile)
- Menu max height: `80vh`
- Header padding: `1.5rem`
- Body padding: `1.5rem`
- Section gap: `2rem`

## Behavior

### Click Outside
The menu automatically closes when clicking outside its bounds.

### Responsive
- **Desktop**: Shows username text, full menu width
- **Mobile**: Hides username text, icon-only button, narrower menu

### Z-Index
Menu dropdown has `z-index: 200` to appear above other content.

## Example with All Features

```vue
<script setup>
import { ref } from 'vue'
import UserMenu from '@/components/UserMenu.vue'
import RoleToggle from '@/components/RoleToggle.vue'
import InvertedToggle from '@/components/InvertedToggle.vue'
import ThemeDropdown from '@/components/ThemeDropdown.vue'

const user = ref({
  username: 'project1',
  role: 'project',
  projectName: 'Theaterpedia',
  availableRoles: ['user', 'project']
})

function handleLogout() {
  console.log('User logged out')
  // Perform logout logic
}
</script>

<template>
  <UserMenu 
    :username="user.username"
    :active-role="user.role"
    :project-name="user.projectName"
    :available-roles="user.availableRoles"
    placement="right"
    @logout="handleLogout"
  >
    <template #role-toggle>
      <RoleToggle />
    </template>
    <template #inverted-toggle>
      <InvertedToggle />
    </template>
    <template #theme-dropdown>
      <ThemeDropdown />
    </template>
  </UserMenu>
</template>
```

## Comparison with AdminMenu

| Feature | UserMenu | AdminMenu |
|---------|----------|-----------|
| **Target Users** | Regular users, project users | Admin users |
| **Header Color** | Primary blue | Accent purple |
| **Role Toggle** | ✅ Yes (in role section) | ❌ No |
| **Mode Toggle** | ❌ No | ✅ Yes (base/version) |
| **Settings Toggle** | ❌ No | ✅ Yes |
| **Display Controls** | ✅ Yes (inverted, theme) | ✅ Yes (inverted, theme) |
| **Admin Actions** | ❌ No | ✅ Yes (export, backup, sync) |
| **Logout** | ✅ Yes | ✅ Yes |

## Integration Notes

### With Navbar
The UserMenu replaces the old inline navbar controls:
- ❌ Removed: Separate RoleToggle button
- ❌ Removed: Separate InvertedToggle button  
- ❌ Removed: Separate ThemeDropdown button
- ❌ Removed: Username display + logout button
- ✅ Added: Single UserMenu button containing all controls

### Position
- Placed to the **right of ProjectToggle**
- Only shown for users with role `'user'` or `'project'`
- AdminMenu shown for admin/base roles

### Shared Controls
Both UserMenu and AdminMenu now contain:
- Inverted mode toggle (via slot)
- Theme dropdown (via slot)
- Username display
- Logout button

## Mobile Behavior

On screens ≤ 768px:
- Username text is hidden from button
- Button shows only icon (👤)
- Menu width reduces to max 320px
- Menu always aligns to right edge

## Accessibility

- Keyboard navigable (tab through controls)
- Click-outside-to-close pattern
- Clear visual hierarchy
- High contrast header
- Focus states on interactive elements

## Future Enhancements

Possible additions:
- [ ] User profile link
- [ ] Settings page link
- [ ] Notification preferences
- [ ] Language selector
- [ ] Dark mode preference
- [ ] Keyboard shortcuts
- [ ] Account settings

---

**Related Components**: AdminMenu, RoleToggle, InvertedToggle, ThemeDropdown, ProjectToggle
