# 🏷️ Report 3: Role Badges + Permission Tooltips

**Date:** December 5, 2025  
**Status:** Design Proposal  
**Priority:** HIGH

---

## Overview

Clear visual differentiation of user roles is essential for understanding:
- Who has authority (p_owner vs p_creator)
- What actions are available to whom
- Why certain buttons are disabled

**Key Principles:**
- Badges are **always visible** where users are shown
- Tooltips explain **why** something is disabled
- Pull explanations from `sysreg_config.description`
- Consistent iconography across all contexts

---

## Visual Mockups

### 3.1 Role Badge System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROLE BADGE REFERENCE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   👑  p_owner      ┌───────────────────────────────────────────────────────┐    │
│                    │  👑 Hans Opus                                         │    │
│                    │  Project Owner · Full Control                         │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
│   🤝  p_creator    ┌───────────────────────────────────────────────────────┐    │
│                    │  🤝 Nina Opus                                         │    │
│                    │  Co-Creator · Collaborative Management                │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
│   👤  member       ┌───────────────────────────────────────────────────────┐    │
│                    │  👤 Rosa Opus                                         │    │
│                    │  Team Member · Create & Edit                          │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
│   👁  participant  ┌───────────────────────────────────────────────────────┐    │
│                    │  👁 Marc Opus                                         │    │
│                    │  Participant · View & Comment                         │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
│   🤝  partner      ┌───────────────────────────────────────────────────────┐    │
│                    │  🤝 External User                                     │    │
│                    │  Partner · Limited Access                             │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
│   👻  anonym       ┌───────────────────────────────────────────────────────┐    │
│                    │  👻 Guest                                             │    │
│                    │  Anonymous · Public Content Only                      │    │
│                    └───────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Badge in Context: Team List

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  👥 TEAM MEMBERS                                                    [+ Add]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  👤          👑                                                         │    │
│  │  ┌───┐       Hans Opus                                                  │    │
│  │  │ H │       hans.opus@theaterpedia.org                                 │    │
│  │  └───┘       Project Owner · Member since Jan 2025                      │    │
│  │              ┌──────────────────────────────────────────────────────┐   │    │
│  │              │ 👑 Full Control │ Config │ Transitions │ Trash      │   │    │
│  │              └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  👤          🤝                                                         │    │
│  │  ┌───┐       Nina Opus                                                  │    │
│  │  │ N │       nina.opus@theaterpedia.org                                 │    │
│  │  └───┘       Co-Creator · Member since Feb 2025                         │    │
│  │              ┌──────────────────────────────────────────────────────┐   │    │
│  │              │ 🤝 Config Access │ Member Mgmt │ Transitions         │   │    │
│  │              └──────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │              [✏️ Edit]  [🗑️ Remove]  ← only p_owner can remove          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  👤          👤                                                         │    │
│  │  ┌───┐       Rosa Opus                                                  │    │
│  │  │ R │       rosa.opus@theaterpedia.org                                 │    │
│  │  └───┘       Team Member · Member since Mar 2025                        │    │
│  │              ┌──────────────────────────────────────────────────────┐   │    │
│  │              │ 👤 Create │ Edit Own │ Comment │ Share               │   │    │
│  │              └──────────────────────────────────────────────────────┘   │    │
│  │                                                                         │    │
│  │              [✏️ Edit]  [⬆️ Promote to Creator]  [🗑️ Remove]            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Permission Tooltips on Disabled Buttons

When a button is disabled due to permissions, hovering shows an explanation:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  Project Actions:                                                                │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ ✏️ Edit      │  │ 📤 Publish   │  │ 📁 Archive   │  │ 🗑️ Trash     │         │
│  │              │  │              │  │   (disabled) │  │   (disabled) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                              │                  │                │
│                                              ▼                  ▼                │
│                                    ┌─────────────────┐ ┌─────────────────┐       │
│                                    │ 🔒 Owner only   │ │ 🔒 Owner only   │       │
│                                    │                 │ │                 │       │
│                                    │ Only the        │ │ Only p_owner    │       │
│                                    │ project owner   │ │ can move        │       │
│                                    │ can archive     │ │ project to      │       │
│                                    │ this project.   │ │ trash.          │       │
│                                    │                 │ │                 │       │
│                                    │ Owner: Hans O.  │ │ Contact Hans    │       │
│                                    └─────────────────┘ │ Opus for this   │       │
│                                                        │ action.         │       │
│                                                        └─────────────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Inline Permission Indicator

For quick scanning, show permission status inline:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  POST ACTIONS                                                                    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │  [✏️ Edit]  [💬 Comment]  [📤 Share]  [🗑️ Delete]  [⚙️ Settings]       │    │
│  │                                                                         │    │
│  │   ✓ You       ✓ You        ✓ You      ✗ Creator   ✗ p_owner            │    │
│  │   can edit    can comment  can share  only        only                  │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Your role: 👤 member                                                            │
│  Post creator: 🤝 Nina Opus                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Current User Badge (Header/Nav)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  THEATERPEDIA                              [🔔]  ┌──────────────────────────┐   │
│                                                  │  👤 Rosa Opus            │   │
│                                                  │  ──────────────────────  │   │
│                                                  │  👤 member in opus1      │   │
│                                                  │  👁 participant in opus2 │   │
│                                                  │  🤝 creator in opus3     │   │
│                                                  │  ──────────────────────  │   │
│                                                  │  [⚙️ Settings] [🚪 Logout]│   │
│                                                  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 3.6 Badge Component Variants

```
RoleBadge/
├── RoleBadge.vue           # Base badge (icon + optional label)
├── RoleBadgeCompact.vue    # Icon only
├── RoleBadgeExpanded.vue   # Full info with capabilities
├── RoleBadgeTooltip.vue    # Badge with hover tooltip
└── PermissionTooltip.vue   # Tooltip explaining disabled state
```

---

## Coding Guidance

### 1. `RoleBadge.vue`

```vue
<template>
  <span 
    class="role-badge" 
    :class="[`role-${relation}`, { compact, expanded }]"
    :title="description"
  >
    <span class="badge-icon">{{ icon }}</span>
    <span v-if="!compact" class="badge-label">{{ label }}</span>
    <span v-if="expanded" class="badge-capabilities">
      {{ capabilities.join(' · ') }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectRelation } from '@/composables/useProjectActivation'

const props = defineProps<{
  relation: ProjectRelation
  compact?: boolean
  expanded?: boolean
}>()

const ROLE_CONFIG: Record<ProjectRelation, { icon: string; label: string; description: string; capabilities: string[] }> = {
  p_owner: {
    icon: '👑',
    label: 'Owner',
    description: 'Project Owner - Full administrative control',
    capabilities: ['Full Control', 'Config', 'Transitions', 'Trash']
  },
  p_creator: {
    icon: '🤝',
    label: 'Creator',
    description: 'Co-Creator - Collaborative project management',
    capabilities: ['Config Access', 'Member Mgmt', 'Transitions']
  },
  member: {
    icon: '👤',
    label: 'Member',
    description: 'Team Member - Create and edit content',
    capabilities: ['Create', 'Edit Own', 'Comment', 'Share']
  },
  participant: {
    icon: '👁',
    label: 'Participant',
    description: 'Participant - View and comment on content',
    capabilities: ['View', 'Comment']
  },
  partner: {
    icon: '🤝',
    label: 'Partner',
    description: 'Partner - Limited external access',
    capabilities: ['View Released']
  },
  anonym: {
    icon: '👻',
    label: 'Guest',
    description: 'Anonymous - Public content only',
    capabilities: ['View Public']
  }
}

const config = computed(() => ROLE_CONFIG[props.relation])
const icon = computed(() => config.value.icon)
const label = computed(() => config.value.label)
const description = computed(() => config.value.description)
const capabilities = computed(() => config.value.capabilities)
</script>

<style scoped>
/* RoleBadge - Opus CSS Conventions */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font);  /* Opus monospace */
  font-size: 0.8rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-small, 0.25rem);
  background: var(--color-muted-bg);
  transition: var(--transition);
}

/* Role colors using oklch for perceptual uniformity */
.role-p_owner { 
  background: oklch(85% 0.14 65);  /* warm orange */
  color: oklch(35% 0.08 65);       /* dark orange */
}

.role-p_creator { 
  background: oklch(78% 0.12 300); /* lavender */
  color: oklch(35% 0.12 300);      /* dark purple */
}

.role-member { 
  background: oklch(92% 0.12 95);  /* yellow */
  color: oklch(40% 0.08 95);       /* dark yellow/brown */
}

.role-participant { 
  background: oklch(82% 0.10 230); /* sky blue */
  color: oklch(35% 0.08 230);      /* dark blue */
}

.role-partner { 
  background: oklch(80% 0.12 145); /* soft green */
  color: oklch(30% 0.10 145);      /* dark green */
}

.role-anonym { 
  background: var(--color-muted-bg); 
  color: var(--color-muted-contrast); 
}

.badge-icon {
  font-size: 1.1em;
}

.badge-label {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-capabilities {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-left: 0.5rem;
}

/* Compact variant */
.compact {
  padding: 0.125rem;
}

.compact .badge-icon {
  font-size: 1rem;
}

/* Expanded variant */
.expanded {
  flex-direction: column;
  align-items: flex-start;
  padding: 0.5rem 0.75rem;
}
</style>
```

### 2. `PermissionTooltip.vue`

```vue
<template>
  <div class="permission-tooltip" v-if="show">
    <div class="tooltip-header">
      <span class="lock-icon">🔒</span>
      <span class="tooltip-title">{{ title }}</span>
    </div>
    <p class="tooltip-description">{{ description }}</p>
    <div class="tooltip-meta" v-if="requiredRole">
      <span>Required: </span>
      <RoleBadge :relation="requiredRole" compact />
    </div>
    <div class="tooltip-owner" v-if="ownerName">
      <span>Owner: {{ ownerName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import RoleBadge from './RoleBadge.vue'
import type { ProjectRelation } from '@/composables/useProjectActivation'

defineProps<{
  show: boolean
  title: string
  description: string
  requiredRole?: ProjectRelation
  ownerName?: string
}>()
</script>

<style scoped>
/* PermissionTooltip - Opus CSS Conventions */
.permission-tooltip {
  position: absolute;
  z-index: 1000;
  background: var(--color-card-bg);
  border: var(--border-button, 0.0625rem) solid var(--color-border);
  border-radius: var(--radius-medium, 0.5rem);
  padding: 0.75rem;
  box-shadow: 0 4px 12px oklch(0% 0 0 / 0.15);
  max-width: 250px;
  font-family: var(--font);
  font-size: 0.85rem;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.lock-icon {
  color: var(--color-warning-base);
}

.tooltip-title {
  font-weight: 600;
  color: var(--color-contrast);
}

.tooltip-description {
  color: var(--color-muted-contrast);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.tooltip-meta,
.tooltip-owner {
  font-size: 0.75rem;
  color: var(--color-muted-contrast);
}
</style>
```

### 3. `usePermissionTooltip.ts` Composable

```typescript
import { ref, computed } from 'vue'
import type { ProjectRelation } from './useProjectActivation'

interface PermissionCheck {
  allowed: boolean
  reason?: string
  requiredRole?: ProjectRelation
}

export function usePermissionTooltip() {
  const tooltipVisible = ref(false)
  const tooltipContent = ref<{
    title: string
    description: string
    requiredRole?: ProjectRelation
    ownerName?: string
  } | null>(null)
  
  // Permission messages from sysreg or constants
  const PERMISSION_MESSAGES: Record<string, { title: string; description: string; requiredRole: ProjectRelation }> = {
    'project_trash': {
      title: 'Owner Only',
      description: 'Only the project owner can move this project to trash.',
      requiredRole: 'p_owner'
    },
    'project_archive': {
      title: 'Owner Only',
      description: 'Only the project owner can archive this project.',
      requiredRole: 'p_owner'
    },
    'post_delete': {
      title: 'Creator Only',
      description: 'Only the post creator can delete this post.',
      requiredRole: 'creator' as any
    },
    'member_promote': {
      title: 'Owner Only',
      description: 'Only the project owner can promote members to co-creators.',
      requiredRole: 'p_owner'
    }
  }
  
  function showTooltip(action: string, ownerName?: string) {
    const message = PERMISSION_MESSAGES[action]
    if (message) {
      tooltipContent.value = {
        ...message,
        ownerName
      }
      tooltipVisible.value = true
    }
  }
  
  function hideTooltip() {
    tooltipVisible.value = false
    tooltipContent.value = null
  }
  
  return {
    tooltipVisible,
    tooltipContent,
    showTooltip,
    hideTooltip
  }
}
```

### 4. Integration: Disabled Button with Tooltip

```vue
<template>
  <div class="action-button-wrapper">
    <button 
      class="action-btn"
      :disabled="!canPerform"
      @mouseenter="!canPerform && showTooltip()"
      @mouseleave="hideTooltip()"
      @click="canPerform && $emit('action')"
    >
      <span class="btn-icon">{{ icon }}</span>
      <span class="btn-label">{{ label }}</span>
    </button>
    
    <PermissionTooltip
      :show="tooltipVisible"
      v-bind="tooltipContent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PermissionTooltip from './PermissionTooltip.vue'
import { usePermissionTooltip } from '@/composables/usePermissionTooltip'

const props = defineProps<{
  action: string
  icon: string
  label: string
  canPerform: boolean
  ownerName?: string
}>()

const { tooltipVisible, tooltipContent, showTooltip: show, hideTooltip } = usePermissionTooltip()

function showTooltip() {
  show(props.action, props.ownerName)
}
</script>
```

---

## Pulling Descriptions from sysreg_config

To dynamically pull permission explanations:

```typescript
// API: GET /api/sysreg/permission-info?action=project_trash&relation=member

interface PermissionInfo {
  action: string
  currentRelation: string
  requiredRelation: string
  description: string  // From sysreg_config.description
  isAllowed: boolean
}

// Server-side
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const action = query.action as string
  
  // Find matching sysreg_config entry
  const config = await db.get(`
    SELECT description, value 
    FROM sysreg_config 
    WHERE name LIKE ?
  `, [`%${action}%`])
  
  // Extract relation bits from config.value
  const requiredRelation = extractRelationFromValue(config.value)
  
  return {
    action,
    description: config?.description || 'Permission required',
    requiredRelation
  }
})
```

---

## File Locations

| Component | Path |
|-----------|------|
| RoleBadge | `src/components/badges/RoleBadge.vue` |
| RoleBadgeCompact | `src/components/badges/RoleBadgeCompact.vue` |
| RoleBadgeExpanded | `src/components/badges/RoleBadgeExpanded.vue` |
| PermissionTooltip | `src/components/badges/PermissionTooltip.vue` |
| Composable | `src/composables/usePermissionTooltip.ts` |
| API | `server/api/sysreg/permission-info.get.ts` |

---

## Next: Report 4 - Mobile Responsiveness
