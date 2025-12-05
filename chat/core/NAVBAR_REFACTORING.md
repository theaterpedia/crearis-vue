# Navbar & Menu Refactoring

## Overview
Refactored the Navbar and menu implementations to fix the cascading click behavior where users had to click twice to open the ToggleMenu.

## Problem
- Clicking "Ansicht" button opened a modal overlay
- Inside modal, had to click the dropdown icon again
- This created an extra unnecessary click step

## Solution
Implemented a slot-based architecture where menus are directly embedded in the Navbar:

### 1. **Navbar.vue** - Provides a slot
```vue
<template #menus>
  <!-- Menus go here -->
</template>
```
- Removed individual menu buttons
- Added `#menus` slot for flexible menu placement
- Removed `isAuthenticated` prop (logic moved to parent)
- Simplified to just `user` prop and `logout` emit

### 2. **ToggleMenu.vue** - Added `buttonText` prop
```typescript
buttonText?: string  // Optional text next to icon
```
- When provided, displays text next to the menu icon
- Button automatically adjusts width with `.layout-toggle-button-with-text` class
- Matches standard Navbar button styling

### 3. **AdminMenu.vue** - Unified with ToggleMenu pattern
```typescript
// New props matching ToggleMenu
buttonText?: string
placement?: 'left' | 'right'

// Added button and dropdown logic
<button class="admin-menu-button">...</button>
<div v-if="isOpen" class="admin-menu">...</div>
```
- Added toggle button with same icon and styling pattern
- Implemented `isOpen` state and click-outside detection
- Added `placement` prop for dropdown positioning
- Removed overlay requirement (now inline dropdown)

### 4. **TaskDashboard.vue** - Uses slot architecture
```vue
<Navbar :user="user" @logout="handleLogout">
  <template #menus>
    <div v-if="isAuthenticated" class="navbar-item">
      <ToggleMenu 
        button-text="Ansicht"
        :placement="'left'"
        ...
      />
    </div>
    
    <div v-if="isAuthenticated && user?.role === 'admin'" class="navbar-item">
      <AdminMenu 
        button-text="Admin"
        :placement="'right'"
        ...
      />
    </div>
  </template>
</Navbar>
```
- Removed `showViewMenu` and `showAdminMenu` state
- Removed overlay containers and their CSS
- Authentication logic now in template conditionals
- Menus directly integrated into Navbar

## Benefits

### User Experience
✅ **One click to open menu** (was two clicks)
✅ **Consistent behavior** between view and admin menus
✅ **No overlay modals** - cleaner UI
✅ **Better positioning** - dropdowns appear directly below buttons

### Code Quality
✅ **Unified component API** - ToggleMenu and AdminMenu share same pattern
✅ **Flexible slot architecture** - easy to add more menus
✅ **Reduced state management** - removed overlay state
✅ **Better separation of concerns** - auth logic in parent

## Component API Comparison

### Before
```vue
<!-- Navbar -->
<Navbar 
  :is-authenticated="true"
  @toggle-view-menu="handler"
  @toggle-admin-menu="handler"
/>

<!-- Separate overlays -->
<div v-if="showViewMenu" class="overlay">
  <ToggleMenu />
</div>
```

### After
```vue
<!-- Navbar with slots -->
<Navbar :user="user">
  <template #menus>
    <ToggleMenu button-text="Ansicht" />
    <AdminMenu button-text="Admin" />
  </template>
</Navbar>
```

## Styling Updates

### ToggleMenu
- Added `.layout-toggle-button-with-text` class
- Button now has border and proper hover states
- Auto-width when `buttonText` is provided

### AdminMenu
- Added `.admin-menu-wrapper` container
- Added `.admin-menu-button` with gear icon
- Added `.admin-menu-left` and `.admin-menu-right` for placement
- Removed overlay dependencies

### TaskDashboard
- Removed `.view-menu-overlay` styles
- Removed `.admin-menu-overlay` styles
- Cleaner, less CSS overall

## Testing Checklist

- [x] ToggleMenu opens on first click
- [x] AdminMenu opens on first click
- [x] Click outside closes menus
- [x] Button text displays correctly
- [x] Menu positioning works (left/right)
- [x] Authentication logic works
- [x] Admin-only menu visibility works
- [x] No console errors
- [x] Responsive layout maintained

## Migration Notes

If other views use Navbar:
1. Update Navbar component usage (remove event handlers)
2. Move menu components into `#menus` slot
3. Add `button-text` prop to menus as needed
4. Remove overlay state and CSS
5. Move `isAuthenticated` checks to template conditionals

## Files Changed
- ✅ `/src/components/Navbar.vue` - Added slot, simplified props
- ✅ `/src/components/ToggleMenu.vue` - Added `buttonText` prop and styling
- ✅ `/src/components/AdminMenu.vue` - Added button, state management, placement
- ✅ `/src/views/TaskDashboard.vue` - Integrated menus via slot
