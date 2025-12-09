# 📱 Report 4: Mobile Responsiveness

**Date:** December 5, 2025  
**Status:** Design Proposal  
**Priority:** HIGH (Phase 1)

---

## Overview

The internal CREARIS UI must work seamlessly on mobile devices. This report covers:

1. Full-screen panels (Activation Panel)
2. Bottom sheet patterns (Comments, Actions)
3. Touch-optimized interactions
4. Responsive layout switching

**Design Philosophy:**
- Mobile-first is not the goal (desktop is primary)
- But mobile must be **fully functional**, not degraded
- Use native mobile patterns where they help
- Maintain the Post-IT aesthetic on all screens

---

## Visual Mockups

### 4.1 Activation Panel - Mobile Full Screen

```
┌──────────────────────────┐
│ ████████████████████████ │  ← Status bar
├──────────────────────────┤
│  🚀 Project Activation × │  ← Sticky header
├──────────────────────────┤
│                          │
│  ○──●──○──○──○──○        │  ← Timeline (compact)
│  N  D  DR CO RE AR       │
│                          │
│  Progress: ████████░░    │
│                          │
│  ────────────────────────│
│                          │
│  📋 Target State         │
│                          │
│  ┌────────────────────┐  │
│  │  ◉ Draft (weiter)  │  │  ← Vertical list
│  └────────────────────┘  │     on mobile
│  ┌────────────────────┐  │
│  │  ○ Demo (zurück)   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  ○ Confirmed       │  │
│  │  ⚠️ Skip - needs   │  │
│  │  small team        │  │
│  └────────────────────┘  │
│                          │
│  ────────────────────────│
│                          │
│  📋 Checklist (3/4)      │  ← Collapsible
│  ▼                       │
│  ✅ Cover image          │
│  ✅ 1+ post              │
│  ✅ Team ≤3              │
│  ❌ Description  [Fix →] │
│                          │
│  ────────────────────────│
│                          │
│  📜 What happens:        │  ← Collapsible
│  ▶                       │     (collapsed default)
│                          │
├──────────────────────────┤
│                          │  ← Sticky footer
│  ┌────────────────────┐  │
│  │ 🚀 Activate DRAFT  │  │  ← Full-width button
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

### 4.2 Bottom Sheet Pattern

For comments, actions, and other secondary UI:

```
┌──────────────────────────┐
│                          │
│       MAIN CONTENT       │
│                          │
│       (scrollable)       │
│                          │
│                          │
├──────────────────────────┤  ← Bottom sheet peek
│  ═══════════════════     │  ← Drag handle
│  💬 Comments (4)    ▲    │
└──────────────────────────┘

        ↓ Swipe up ↓

┌──────────────────────────┐
│       MAIN CONTENT       │  ← Dimmed background
│       (dimmed)           │
│                          │
├──────────────────────────┤
│  ═══════════════════     │  ← Drag handle
├──────────────────────────┤
│  💬 Comments (4)         │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░ │  │
│  │ Great idea!        │  │
│  │ 👤 Nina • 2h       │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░ │  │
│  │ When is the...     │  │
│  │ 👁 Rosa • 1h       │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ✏️ Add note...     │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

### 4.3 Team Member Card - Mobile

```
┌──────────────────────────┐
│  👥 Team (4)        [+]  │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │ ┌───┐              │  │
│  │ │👤 │  Hans Opus   │  │
│  │ │ H │  👑 Owner    │  │
│  │ └───┘              │  │
│  │                    │  │
│  │ [📧] [···]         │  │  ← Actions in menu
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ┌───┐              │  │
│  │ │👤 │  Nina Opus   │  │
│  │ │ N │  🤝 Creator  │  │
│  │ └───┘              │  │
│  │                    │  │
│  │ [📧] [···]         │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ┌───┐              │  │
│  │ │👤 │  Rosa Opus   │  │
│  │ │ R │  👤 Member   │  │
│  │ └───┘              │  │
│  │                    │  │
│  │ [📧] [···]         │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

### 4.4 Action Menu (Bottom Sheet)

When tapping "···" on mobile:

```
┌──────────────────────────┐
│                          │
│       TEAM LIST          │
│       (dimmed)           │
│                          │
├──────────────────────────┤
│  ═══════════════════     │
├──────────────────────────┤
│                          │
│  👤 Rosa Opus            │
│  Member                  │
│                          │
│  ────────────────────────│
│                          │
│  ┌────────────────────┐  │
│  │ ✏️  Edit Profile   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ ⬆️  Promote        │  │
│  │     to Creator     │  │
│  │     🔒 Owner only  │  │  ← Disabled state
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📧  Send Message   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🗑️  Remove         │  │
│  │     🔒 Owner only  │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │      Cancel        │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

### 4.5 Stepper Navigation - Mobile

Horizontal scrolling stepper for mobile:

```
┌──────────────────────────┐
│  opus1 · DEMO            │
├──────────────────────────┤
│                          │
│  ◀ ───────────────────── ▶  ← Horizontal scroll
│                          │
│  ┌────┐ ┌────┐ ┌────┐    │
│  │ ✓  │ │ ●  │ │ ○  │ ···│
│  │Info│ │Cont│ │Team│    │
│  └────┘ └────┘ └────┘    │
│                          │
├──────────────────────────┤
│                          │
│  STEP 2: CONTENT         │
│                          │
│  ┌────────────────────┐  │
│  │ Title              │  │
│  │ ┌──────────────┐   │  │
│  │ │              │   │  │
│  │ └──────────────┘   │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Description        │  │
│  │ ┌──────────────┐   │  │
│  │ │              │   │  │
│  │ │              │   │  │
│  │ └──────────────┘   │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  [← Prev]    [Next →]    │
└──────────────────────────┘
```

### 4.6 Dashboard - Mobile Cards

```
┌──────────────────────────┐
│  opus1 · DRAFT           │
├──────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐    │
│  │📝  │ │📅  │ │👥  │    │  ← Quick nav pills
│  │Post│ │Evnt│ │Team│    │
│  └────┘ └────┘ └────┘    │
├──────────────────────────┤
│                          │
│  📝 POSTS (3)            │
│                          │
│  ┌────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░ │  │  ← Card stack
│  │ Workshop Recap     │  │
│  │ 👤 Nina · Draft    │  │
│  │ [Edit] [···]       │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░ │  │
│  │ Upcoming Events    │  │
│  │ 👑 Hans · Released │  │
│  │ [Edit] [···]       │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │     + New Post     │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

---

## CSS Framework

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Mobile-first media queries */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Touch Targets

```css
/* Minimum 44x44px touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Comfortable spacing on mobile */
@media (max-width: 768px) {
  .action-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }
  
  .list-item {
    padding: 1rem;
    gap: 1rem;
  }
}
```

### Safe Areas (Notch/Home Indicator)

```css
.full-screen-panel {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.sticky-footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
```

---

## Component Implementation

### 1. `BottomSheet.vue`

```vue
<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="isOpen" class="bottom-sheet-overlay" @click="close">
        <div 
          class="bottom-sheet"
          :style="{ height: sheetHeight }"
          @click.stop
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="sheet-handle">
            <div class="handle-bar"></div>
          </div>
          <div class="sheet-header" v-if="$slots.header">
            <slot name="header" />
          </div>
          <div class="sheet-content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  initialHeight?: string
  maxHeight?: string
}>()

const emit = defineEmits<{
  close: []
  'update:isOpen': [value: boolean]
}>()

const dragY = ref(0)
const isDragging = ref(false)
const startY = ref(0)

const sheetHeight = computed(() => {
  if (isDragging.value) {
    return `calc(${props.maxHeight || '80vh'} - ${dragY.value}px)`
  }
  return props.initialHeight || '50vh'
})

function close() {
  emit('close')
  emit('update:isOpen', false)
}

function onTouchStart(e: TouchEvent) {
  startY.value = e.touches[0].clientY
  isDragging.value = true
}

function onTouchMove(e: TouchEvent) {
  const currentY = e.touches[0].clientY
  dragY.value = Math.max(0, currentY - startY.value)
}

function onTouchEnd() {
  isDragging.value = false
  if (dragY.value > 100) {
    close()
  }
  dragY.value = 0
}
</script>

<style scoped>
/* BottomSheet - Opus CSS Conventions */
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: oklch(0% 0 0 / 0.5);  /* oklch alpha */
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  background: var(--color-card-bg);  /* Opus theme */
  border-radius: var(--radius-large, 1rem) var(--radius-large, 1rem) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  transition: height var(--duration, 150ms) var(--ease);
  box-shadow: 0 -4px 20px oklch(0% 0 0 / 0.15);
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-small, 0.25rem);
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  font-family: var(--font);  /* Opus monospace */
}

/* Transitions */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--duration, 150ms) var(--ease), 
              transform var(--duration, 150ms) var(--ease);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .bottom-sheet,
.sheet-leave-to .bottom-sheet {
  transform: translateY(100%);
}
</style>
```

### 2. `MobileMenu.vue` (Action Sheet)

```vue
<template>
  <BottomSheet :is-open="isOpen" @close="$emit('close')">
    <template #header>
      <div class="menu-header" v-if="title">
        <h3>{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </template>
    
    <div class="menu-items">
      <button
        v-for="item in items"
        :key="item.id"
        class="menu-item"
        :class="{ disabled: item.disabled, destructive: item.destructive }"
        :disabled="item.disabled"
        @click="handleSelect(item)"
      >
        <span class="item-icon">{{ item.icon }}</span>
        <span class="item-label">{{ item.label }}</span>
        <span v-if="item.disabled && item.disabledReason" class="item-lock">
          🔒 {{ item.disabledReason }}
        </span>
      </button>
    </div>
    
    <button class="cancel-btn" @click="$emit('close')">
      Cancel
    </button>
  </BottomSheet>
</template>

<script setup lang="ts">
import BottomSheet from './BottomSheet.vue'

interface MenuItem {
  id: string
  icon: string
  label: string
  disabled?: boolean
  disabledReason?: string
  destructive?: boolean
}

defineProps<{
  isOpen: boolean
  title?: string
  subtitle?: string
  items: MenuItem[]
}>()

const emit = defineEmits<{
  close: []
  select: [item: MenuItem]
}>()

function handleSelect(item: MenuItem) {
  if (!item.disabled) {
    emit('select', item)
    emit('close')
  }
}
</script>

<style scoped>
/* MobileMenu - Opus CSS Conventions */
.menu-header {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: var(--border-button, 0.0625rem) solid var(--color-border);
  margin-bottom: 0.5rem;
}

.menu-header h3 {
  font-family: var(--font);  /* Opus monospace */
  font-weight: 600;
  margin: 0;
  color: var(--color-contrast);
}

.menu-header p {
  font-size: 0.85rem;
  color: var(--color-muted-contrast);
  margin: 0.25rem 0 0;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: none;
  border: none;
  border-radius: var(--radius-medium, 0.5rem);
  font-family: var(--font);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
  color: var(--color-contrast);
}

.menu-item:hover:not(.disabled) {
  background: var(--color-muted-bg);
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.destructive {
  color: var(--color-negative-base);
}

.item-icon {
  font-size: 1.25rem;
}

.item-lock {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-warning-base);
}

.cancel-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 0.5rem;
  background: var(--color-muted-bg);
  border: none;
  border-radius: var(--radius-medium, 0.5rem);
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  color: var(--color-contrast);
}

.cancel-btn:hover {
  background: oklch(from var(--color-muted-bg) calc(l - 0.05) c h);
}
</style>
```

### 3. Responsive Hook

```typescript
// src/composables/useResponsive.ts

import { ref, onMounted, onUnmounted } from 'vue'

export function useResponsive() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)
  const screenWidth = ref(0)
  
  function updateBreakpoint() {
    screenWidth.value = window.innerWidth
    isMobile.value = window.innerWidth < 768
    isTablet.value = window.innerWidth >= 768 && window.innerWidth < 1024
    isDesktop.value = window.innerWidth >= 1024
  }
  
  onMounted(() => {
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoint)
  })
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth
  }
}
```

---

## File Locations

| Component | Path |
|-----------|------|
| BottomSheet | `src/components/mobile/BottomSheet.vue` |
| MobileMenu | `src/components/mobile/MobileMenu.vue` |
| MobileHeader | `src/components/mobile/MobileHeader.vue` |
| useResponsive | `src/composables/useResponsive.ts` |

---

## Testing Checklist

- [ ] Activation Panel fills screen on mobile
- [ ] Bottom sheet drags to dismiss
- [ ] Touch targets are 44x44px minimum
- [ ] Safe areas handled (notch, home indicator)
- [ ] Horizontal scroll on stepper nav
- [ ] Action menu shows as bottom sheet
- [ ] Post-IT board scrolls properly
- [ ] Input fields don't get covered by keyboard

---

## Next: Report 5 - Implementation Plan & Coding Guidance
