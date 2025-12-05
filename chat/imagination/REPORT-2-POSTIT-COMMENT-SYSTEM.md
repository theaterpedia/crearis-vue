# 🗒️ Report 2: Post-IT Comment System

**Date:** December 5, 2025  
**Status:** Design Proposal  
**Priority:** HIGH

---

## Overview

The Post-IT comment system provides a **unified commenting experience** across two distinct contexts:

| Context | Route | Layout | Post-IT Behavior |
|---------|-------|--------|------------------|
| Internal Dashboard | `/projects` | Stepper/Dashboard | Breakout overlay from workflow UI |
| Public Frontend | `/sites/[domaincode]` | Classic website | Floating sidebar or inline expansion |

**Design Philosophy:**
- Post-ITs are the **signature interaction** of CREARIS
- Monospace typography, sticky-note colors, handwritten feel
- Same component, different mounting strategies
- Comments feel like collaborative annotations, not formal discussions

---

## Visual Mockups

### 2.1 Post-IT Note Design (Base Component)

```
┌────────────────────────────────────┐
│ ┌──────────────────────────────┐   │
│ │  ░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │  ← Tape/pin effect at top
│ ├──────────────────────────────┤   │
│ │                              │   │
│ │  This is a comment on the   │   │  ← Monospace font
│ │  project direction. I think │   │
│ │  we should focus on...      │   │
│ │                              │   │
│ │  ────────────────────────── │   │
│ │  👤 Nina Opus  •  2h ago    │   │  ← Author + timestamp
│ │  🏷️ member                  │   │  ← Role badge
│ │                              │   │
│ └──────────────────────────────┘   │
│                                    │
│   [💬 Reply]  [❤️ 3]  [📌 Pin]    │  ← Actions
│                                    │
└────────────────────────────────────┘
```

**Color Palette (Post-IT Colors):**
```css
:root {
  --postit-yellow: #fff59d;      /* Classic yellow */
  --postit-pink: #f48fb1;        /* Pink */
  --postit-blue: #81d4fa;        /* Light blue */
  --postit-green: #a5d6a7;       /* Light green */
  --postit-orange: #ffcc80;      /* Orange */
  --postit-purple: #ce93d8;      /* Purple */
}
```

**Color Assignment by Role:**
| Role | Color | Reason |
|------|-------|--------|
| p_owner | 👑 Orange | Authority, warmth |
| p_creator | 🤝 Purple | Creative, collaborative |
| member | 👤 Yellow | Classic, neutral |
| participant | 👁 Blue | Observer, calm |
| partner | 🤝 Green | External, fresh |

---

### 2.2 Internal Dashboard: Stepper Breakout

When a user clicks "Comments" in the Stepper UI, a Post-IT board slides in:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STEPPER UI                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │  Step 1: Basic Info  ✓                                                      │ │
│ │  Step 2: Content     ●  ←── current                                         │ │
│ │  Step 3: Team        ○                                                      │ │
│ │  Step 4: Comments    ○  ←── click to open Post-IT board                     │ │
│ │  Step 5: Review      ○                                                      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ ════════════════════════════════════════════════════════════════════════════════│
│                                                                                  │
│                        CONTENT AREA                                              │
│                                                                                  │
│                        (form fields, etc.)                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ↓ Click "Comments"

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        📝 POST-IT BOARD                             [×]   │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │      │  │
│  │  │             │  │             │  │             │  │             │      │  │
│  │  │ Great idea! │  │ We should   │  │ +1 on the   │  │ Question:   │      │  │
│  │  │ Let's do it │  │ consider... │  │ timeline    │  │ When is...  │      │  │
│  │  │             │  │             │  │             │  │             │      │  │
│  │  │ 👤 Nina     │  │ 👑 Hans     │  │ 👁 Rosa     │  │ 🤝 Marc     │      │  │
│  │  │ 2h ago      │  │ 1h ago      │  │ 30m ago     │  │ 5m ago      │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                                           │  │
│  │  ─────────────────────────────────────────────────────────────────────── │  │
│  │                                                                           │  │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  │  ✏️ Add your note...                                              │   │  │
│  │  │                                                                   │   │  │
│  │  │                                              [📎] [😊] [Post]    │   │  │
│  │  └───────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Public Frontend: Floating Comment Sidebar

On `/sites/[domaincode]/posts/[id]`, comments appear as a collapsible sidebar:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  THEATERPEDIA                                           [Login] [🔔] [👤]       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────┐  ┌──────────────────────┐ │
│  │                                                  │  │ 💬 Comments (4)      │ │
│  │              POST CONTENT                        │  ├──────────────────────┤ │
│  │                                                  │  │                      │ │
│  │  # Upcoming Event: Workshop                      │  │ ┌──────────────────┐ │ │
│  │                                                  │  │ │ ░░░░░░░░░░░░░░░░ │ │ │
│  │  Lorem ipsum dolor sit amet...                   │  │ │                  │ │ │
│  │                                                  │  │ │ Love this idea!  │ │ │
│  │  [Image]                                         │  │ │                  │ │ │
│  │                                                  │  │ │ 👤 Nina • 2h    │ │ │
│  │  More content here...                            │  │ └──────────────────┘ │ │
│  │                                                  │  │                      │ │
│  │                                                  │  │ ┌──────────────────┐ │ │
│  │                                                  │  │ │ ░░░░░░░░░░░░░░░░ │ │ │
│  │                                                  │  │ │                  │ │ │
│  │                                                  │  │ │ When is the...   │ │ │
│  │                                                  │  │ │                  │ │ │
│  │                                                  │  │ │ 👁 Rosa • 1h    │ │ │
│  │                                                  │  │ └──────────────────┘ │ │
│  │                                                  │  │                      │ │
│  │                                                  │  │ ┌──────────────────┐ │ │
│  │                                                  │  │ │ ✏️ Add note...   │ │ │
│  │                                                  │  │ │              [↵] │ │ │
│  │                                                  │  │ └──────────────────┘ │ │
│  └──────────────────────────────────────────────────┘  └──────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Collapsed State (FAB):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                              POST CONTENT                                        │
│                                                                                  │
│                                                          ┌────────────────────┐ │
│                                                          │  💬                │ │
│                                                          │  4                 │ │
│                                                          └────────────────────┘ │
│                                                                 ↑               │
│                                                          Floating Action        │
│                                                          Button (FAB)           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Mobile: Bottom Sheet Comments

```
┌──────────────────────────┐
│  POST CONTENT            │
│                          │
│  # Workshop              │
│                          │
│  Lorem ipsum...          │
│                          │
│  [Image]                 │
│                          │
│  More text...            │
│                          │
│ ┌────────────────────────┤  ← Drag handle
│ │ ═══════════════════    │
│ ├────────────────────────┤
│ │ 💬 Comments (4)        │
│ ├────────────────────────┤
│ │                        │
│ │ ┌────────────────────┐ │
│ │ │ ░░░░░░░░░░░░░░░░░░ │ │
│ │ │ Love this idea!    │ │
│ │ │ 👤 Nina • 2h       │ │
│ │ └────────────────────┘ │
│ │                        │
│ │ ┌────────────────────┐ │
│ │ │ ░░░░░░░░░░░░░░░░░░ │ │
│ │ │ When is the...     │ │
│ │ │ 👁 Rosa • 1h       │ │
│ │ └────────────────────┘ │
│ │                        │
│ │ ┌────────────────────┐ │
│ │ │ ✏️ Add note...     │ │
│ │ └────────────────────┘ │
│ │                        │
└─┴────────────────────────┘
```

---

### 2.5 Thread/Reply View

When a Post-IT has replies, it expands into a thread:

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │                                                            │  │
│  │  I think we should reconsider the timeline.               │  │
│  │  The current deadline seems too aggressive.               │  │
│  │                                                            │  │
│  │  👤 Nina Opus  •  member  •  2 hours ago                  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│      │                                                           │
│      ├── ┌──────────────────────────────────────────────────┐   │
│      │   │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│      │   │                                                  │   │
│      │   │  Agreed. Let's discuss in tomorrow's standup.   │   │
│      │   │                                                  │   │
│      │   │  👑 Hans Opus  •  p_owner  •  1 hour ago        │   │
│      │   │                                                  │   │
│      │   └──────────────────────────────────────────────────┘   │
│      │                                                           │
│      └── ┌──────────────────────────────────────────────────┐   │
│          │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│          │                                                  │   │
│          │  I can prepare some options.                    │   │
│          │                                                  │   │
│          │  🤝 Marc Opus  •  p_creator  •  30 min ago      │   │
│          │                                                  │   │
│          └──────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ✏️ Reply to this thread...                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Component Hierarchy

```
PostITSystem/
├── PostITBoard.vue           # Container: grid/masonry of notes
├── PostITNote.vue            # Single Post-IT note
├── PostITThread.vue          # Threaded replies view
├── PostITComposer.vue        # New comment input
├── PostITSidebar.vue         # Frontend sidebar wrapper
├── PostITBottomSheet.vue     # Mobile bottom sheet wrapper
└── usePostITComments.ts      # Composable for data/logic
```

### Data Model

```typescript
interface PostITComment {
  id: string
  entity_type: 'post' | 'project' | 'event' | 'image'
  entity_id: string
  parent_id: string | null      // For threading
  author_id: string
  author_name: string
  author_relation: ProjectRelation
  content: string
  color: PostITColor            // Auto-assigned by role
  is_pinned: boolean
  reactions: {
    emoji: string
    count: number
    users: string[]
  }[]
  created_at: string
  updated_at: string
}

type PostITColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple'
```

---

## CSS Design Tokens (Opus Convention)

```css
/* Post-IT theming using oklch color space + Opus conventions */
/* Place in src/styles/postit-colors.css */
:root {
  /* Post-IT Colors (oklch for perceptual uniformity) */
  --postit-yellow: oklch(92% 0.12 95);     /* warm sticky yellow */
  --postit-pink: oklch(78% 0.14 350);      /* soft pink */
  --postit-blue: oklch(82% 0.10 230);      /* sky blue */
  --postit-green: oklch(80% 0.12 145);     /* soft green */
  --postit-orange: oklch(85% 0.14 65);     /* warm orange (p_owner) */
  --postit-purple: oklch(78% 0.12 300);    /* lavender (p_creator) */
  
  /* Derived from Opus theme (00-theme.css) */
  --postit-text: var(--color-contrast);
  --postit-muted: var(--color-muted-contrast);
  --postit-border: var(--color-border);
  
  /* Shadow effects (oklch alpha channel) */
  --postit-shadow: 2px 3px 8px oklch(0% 0 0 / 0.15);
  --postit-tape-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
  --postit-hover-shadow: 4px 6px 12px oklch(0% 0 0 / 0.2);
  
  /* Animation (from 01-variables.css) */
  --postit-ease: var(--ease, cubic-bezier(0.4, 0, 0.2, 1));
  --postit-duration: var(--duration, 150ms);
  --postit-transition: all var(--postit-duration) var(--postit-ease);
}
```

---

## Coding Guidance

### 1. `PostITNote.vue`

```vue
<template>
  <div 
    class="postit-note" 
    :class="[`color-${color}`, { pinned: isPinned, threaded: hasReplies }]"
  >
    <div class="tape-effect"></div>
    <div class="note-content">
      <p class="note-text">{{ content }}</p>
      <div class="note-meta">
        <span class="author">
          <span class="role-icon">{{ roleIcon }}</span>
          {{ authorName }}
        </span>
        <span class="timestamp">{{ relativeTime }}</span>
      </div>
      <div class="note-role">
        <span class="role-badge">{{ authorRelation }}</span>
      </div>
    </div>
    <div class="note-actions">
      <button class="postit-btn" @click="$emit('reply')">💬 Reply</button>
      <button class="postit-btn" @click="$emit('react')">❤️ {{ reactCount }}</button>
      <button class="postit-btn" v-if="canPin" @click="$emit('pin')">📌 Pin</button>
    </div>
  </div>
</template>

<style scoped>
/* Post-IT Note - follows Opus conventions */
.postit-note {
  position: relative;
  padding: 1rem;
  border-radius: var(--radius-small, 0.25rem);
  box-shadow: 
    var(--postit-shadow),
    0 0 0 1px oklch(0% 0 0 / 0.05);
  transform: rotate(-1deg);
  transition: var(--postit-transition);
  font-family: var(--font);  /* Opus monospace */
}

.postit-note:hover {
  transform: rotate(0deg) scale(1.02);
  box-shadow: var(--postit-hover-shadow);
  z-index: 10;
}

/* Tape effect at top (oklch alpha) */
.tape-effect {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 16px;
  background: oklch(100% 0 0 / 0.6);
  border-radius: var(--radius-small);
  box-shadow: var(--postit-tape-shadow);
}

/* Post-IT Colors (oklch) */
.color-yellow { background: var(--postit-yellow); }
.color-pink { background: var(--postit-pink); }
.color-blue { background: var(--postit-blue); }
.color-green { background: var(--postit-green); }
.color-orange { background: var(--postit-orange); }
.color-purple { background: var(--postit-purple); }

.note-text {
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
  color: var(--postit-text);
}

.note-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: oklch(from var(--postit-text) l c h / 0.7);
}

.role-icon {
  margin-right: 0.25rem;
}

/* Button Treatment - Opus Convention */
.note-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px dashed oklch(0% 0 0 / 0.1);
}

.postit-btn {
  background: oklch(100% 0 0 / 0.5);
  border: var(--border-button, 0.0625rem) dashed currentColor;
  border-radius: var(--radius-button, 0.25rem);
  cursor: pointer;
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  transition: var(--postit-transition);
}

.postit-btn:hover {
  background: oklch(100% 0 0 / 0.8);
  transform: translateY(-1px);
}

.postit-btn:active {
  transform: translateY(0);
}
</style>
```

### 2. `PostITBoard.vue` (Masonry Grid)

```vue
<template>
  <div class="postit-board">
    <header class="board-header">
      <h3>📝 Comments ({{ comments.length }})</h3>
      <div class="board-filters">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          class="filter-btn"
          :class="{ active: activeFilter === filter.value }"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>
    
    <div class="board-grid">
      <PostITNote
        v-for="comment in filteredComments"
        :key="comment.id"
        v-bind="comment"
        @reply="openThread(comment.id)"
        @react="addReaction(comment.id)"
        @pin="togglePin(comment.id)"
      />
    </div>
    
    <PostITComposer @submit="addComment" />
  </div>
</template>

<style scoped>
/* Cork Board - Opus themed */
.postit-board {
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 20px,
      oklch(0% 0 0 / 0.03) 20px,
      oklch(0% 0 0 / 0.03) 21px
    ),
    oklch(85% 0.04 85);  /* Cork board color in oklch */
  padding: 2rem;
  border-radius: var(--radius-medium, 0.5rem);
  min-height: 400px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.board-header h3 {
  font-family: var(--font);
  font-weight: 600;
  color: var(--color-contrast);
}

/* Filter Buttons - Opus Convention */
.board-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  font-family: var(--font);
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  border: var(--border-button, 0.0625rem) solid var(--color-border);
  border-radius: var(--radius-button, 0.25rem);
  cursor: pointer;
  transition: var(--transition);
}

.filter-btn:hover {
  background: oklch(from var(--color-muted-bg) calc(l - 0.05) c h);
}

.filter-btn.active {
  background: var(--color-primary-base);
  color: var(--color-primary-contrast);
  border-color: var(--color-primary-base);
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

/* Random rotation for organic feel */
.board-grid > :nth-child(3n) { transform: rotate(1deg); }
.board-grid > :nth-child(3n+1) { transform: rotate(-1deg); }
.board-grid > :nth-child(3n+2) { transform: rotate(0.5deg); }
</style>
```

### 3. `usePostITComments.ts` Composable

```typescript
import { ref, computed, watch } from 'vue'

interface UsePostITCommentsOptions {
  entityType: 'post' | 'project' | 'event' | 'image'
  entityId: string
  projectId: string
}

export function usePostITComments(options: UsePostITCommentsOptions) {
  const comments = ref<PostITComment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Fetch comments
  async function fetchComments() {
    isLoading.value = true
    try {
      const response = await fetch(
        `/api/comments?entity_type=${options.entityType}&entity_id=${options.entityId}`
      )
      comments.value = await response.json()
    } catch (e) {
      error.value = 'Failed to load comments'
    } finally {
      isLoading.value = false
    }
  }
  
  // Add comment
  async function addComment(content: string, parentId?: string) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: options.entityType,
        entity_id: options.entityId,
        project_id: options.projectId,
        parent_id: parentId,
        content
      })
    })
    
    const newComment = await response.json()
    comments.value.push(newComment)
    return newComment
  }
  
  // Color assignment by role
  function getColorForRole(relation: ProjectRelation): PostITColor {
    const colorMap: Record<ProjectRelation, PostITColor> = {
      p_owner: 'orange',
      p_creator: 'purple',
      member: 'yellow',
      participant: 'blue',
      partner: 'green',
      anonym: 'yellow'
    }
    return colorMap[relation]
  }
  
  // Threaded comments
  const rootComments = computed(() => 
    comments.value.filter(c => !c.parent_id)
  )
  
  function getReplies(parentId: string) {
    return comments.value.filter(c => c.parent_id === parentId)
  }
  
  return {
    comments,
    rootComments,
    isLoading,
    error,
    fetchComments,
    addComment,
    getReplies,
    getColorForRole
  }
}
```

---

## Integration Points

### In Stepper UI (`/projects`)

```vue
<!-- ProjectStepper.vue -->
<template>
  <div class="stepper">
    <StepperNav :steps="steps" :current="currentStep" />
    
    <div class="stepper-content">
      <!-- Regular step content -->
      <component :is="currentStepComponent" v-if="currentStep !== 'comments'" />
      
      <!-- Post-IT Board for comments step -->
      <PostITBoard 
        v-else
        :entity-type="'project'"
        :entity-id="projectId"
        :project-id="projectId"
      />
    </div>
  </div>
</template>
```

### In Frontend (`/sites/[domaincode]`)

```vue
<!-- PostView.vue -->
<template>
  <article class="post-content">
    <slot /> <!-- Post content -->
  </article>
  
  <!-- Desktop: Sidebar -->
  <PostITSidebar 
    v-if="!isMobile"
    :entity-type="'post'"
    :entity-id="postId"
    :project-id="projectId"
  />
  
  <!-- Mobile: Bottom Sheet -->
  <PostITBottomSheet
    v-else
    :entity-type="'post'"
    :entity-id="postId"
    :project-id="projectId"
  />
</template>
```

---

## Database Schema Addition

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,  -- 'post', 'project', 'event', 'image'
  entity_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES comments(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment_reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

---

## File Locations

| Component | Path |
|-----------|------|
| PostITNote | `src/components/comments/PostITNote.vue` |
| PostITBoard | `src/components/comments/PostITBoard.vue` |
| PostITThread | `src/components/comments/PostITThread.vue` |
| PostITComposer | `src/components/comments/PostITComposer.vue` |
| PostITSidebar | `src/components/comments/PostITSidebar.vue` |
| PostITBottomSheet | `src/components/comments/PostITBottomSheet.vue` |
| Composable | `src/composables/usePostITComments.ts` |
| API | `server/api/comments/` |
| Migration | `server/database/migrations/055_create_comments.ts` |

---

## Next: Report 3 - Role Badges + Permission Tooltips
