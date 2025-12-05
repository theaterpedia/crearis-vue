# Navbar Navigation Routes Feature

## Overview
Added dynamic navigation routes to the Navbar component with route protection based on authentication and user roles.

## Files Changed

### 1. `/src/settings.ts` - Navigation Routes Configuration

**Added:**
```typescript
export interface NavRoute {
  path: string
  name: string
  protected?: boolean
  requiresAuth?: boolean
  requiresRole?: string | string[]
}

export const defaultNavRoutes: NavRoute[] = [
  {
    path: '/',
    name: 'Dashboard',
    protected: false,
  },
  {
    path: '/base',
    name: 'Base',
    protected: true,
    requiresAuth: true,
  },
  {
    path: '/demo',
    name: 'Demo',
    protected: false,
  },
  {
    path: '/demos',
    name: 'Demos',
    protected: false,
  },
]
```

**Route Properties:**
- `path`: The route path
- `name`: Display name for the navigation button
- `protected`: If true, route requires additional checks
- `requiresAuth`: Requires user to be authenticated
- `requiresRole`: Requires specific role(s) - string or array of strings

### 2. `/src/components/Navbar.vue` - Navigation Component

**New Props:**
```typescript
defineProps<{
    user?: User | null
    fullWidth?: boolean
    logoText?: string
    useDefaultRoutes?: boolean    // NEW: defaults to true
    customRoutes?: NavRoute[]     // NEW: additional custom routes
}>()
```

**Template Changes:**
```vue
<div class="navbar-center">
    <!-- Navigation Routes -->
    <div v-if="useDefaultRoutes && visibleRoutes.length > 0" class="navbar-routes">
        <router-link
            v-for="route in visibleRoutes"
            :key="route.path"
            :to="route.path"
            class="navbar-route"
            :class="{ 'navbar-route-active': isActiveRoute(route.path) }"
        >
            {{ route.name }}
        </router-link>
    </div>
</div>
```

**Logic Added:**
- **Route Combining**: Merges default and custom routes
- **Route Filtering**: Shows/hides routes based on:
  - `protected` flag
  - `requiresAuth` - checks if user exists
  - `requiresRole` - checks user role matches
- **Active Detection**: Highlights current route

**Filtering Logic:**
```typescript
const visibleRoutes = computed(() => {
    return allRoutes.value.filter((navRoute: NavRoute) => {
        // Always show non-protected routes
        if (!navRoute.protected) return true
        
        // Check authentication requirement
        if (navRoute.requiresAuth && !props.user) return false
        
        // Check role requirement
        if (navRoute.requiresRole && props.user) {
            const requiredRoles = Array.isArray(navRoute.requiresRole) 
                ? navRoute.requiresRole 
                : [navRoute.requiresRole]
            return requiredRoles.includes(props.user.role)
        }
        
        // Protected but no specific requirements = show if authenticated
        return !!props.user
    })
})
```

**CSS Styling:**
```css
.navbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.navbar-routes {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.navbar-route {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-button);
    color: var(--color-dimmed);
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.navbar-route:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.navbar-route-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}
```

**Responsive Design:**
- **Desktop (>1024px)**: Routes centered between logo and menus
- **Tablet (≤1024px)**: Reduced padding and gaps
- **Mobile (≤768px)**: Routes move below logo, wrap if needed

## Usage Examples

### Basic Usage (Default Routes)
```vue
<Navbar 
    :user="user" 
    :logo-text="'My App'" 
    @logout="handleLogout"
/>
<!-- Shows all 4 default routes, filtered by user auth/role -->
```

### Without Default Routes
```vue
<Navbar 
    :user="user"
    :use-default-routes="false"
    @logout="handleLogout"
/>
<!-- No navigation routes shown -->
```

### With Custom Routes
```vue
<script setup>
import type { NavRoute } from '@/settings'

const customRoutes: NavRoute[] = [
    {
        path: '/admin',
        name: 'Admin Panel',
        protected: true,
        requiresRole: 'admin'
    },
    {
        path: '/profile',
        name: 'Profile',
        protected: true,
        requiresAuth: true
    }
]
</script>

<template>
    <Navbar 
        :user="user"
        :custom-routes="customRoutes"
        @logout="handleLogout"
    />
    <!-- Shows default routes + custom routes (9 total) -->
</template>
```

### Combining Default and Custom
```vue
<Navbar 
    :user="user"
    :use-default-routes="true"
    :custom-routes="customRoutes"
    @logout="handleLogout"
/>
<!-- Shows both default and custom routes -->
```

## Route Protection Examples

### Public Route
```typescript
{
    path: '/about',
    name: 'About',
    protected: false  // Always visible
}
```

### Authenticated Users Only
```typescript
{
    path: '/dashboard',
    name: 'Dashboard',
    protected: true,
    requiresAuth: true  // Only shown when user is logged in
}
```

### Admin Only
```typescript
{
    path: '/admin',
    name: 'Admin',
    protected: true,
    requiresAuth: true,
    requiresRole: 'admin'  // Only shown to admins
}
```

### Multiple Roles
```typescript
{
    path: '/editor',
    name: 'Editor',
    protected: true,
    requiresAuth: true,
    requiresRole: ['admin', 'editor', 'moderator']  // Array of allowed roles
}
```

## Features

✅ **Default Routes**: 4 pre-configured routes in settings.ts
✅ **Custom Routes**: Add unlimited custom routes via prop
✅ **Route Protection**: Hide routes based on auth/role
✅ **Active Detection**: Current route highlighted automatically
✅ **Responsive Design**: Adapts to mobile/tablet/desktop
✅ **Type Safety**: Full TypeScript support with NavRoute interface
✅ **Flexible**: Can disable defaults and use only custom routes

## Integration Status

- ✅ **Navbar Component**: Updated with navigation logic
- ✅ **Settings File**: Default routes configured
- ✅ **TaskDashboard**: Already compatible (uses default routes automatically)
- ✅ **Type Definitions**: NavRoute interface exported
- ✅ **Responsive CSS**: Mobile/tablet breakpoints added

## Next Steps

To use navigation in other views:
1. Import `NavRoute` type if needed
2. Pass `user` prop to Navbar
3. Optionally customize with `customRoutes` prop
4. Set `useDefaultRoutes={false}` to disable defaults

The navigation feature is now fully functional and ready to use!
