# 📊 Report 1: State Flow Timeline + Enhanced Activation Panel

**Date:** December 5, 2025  
**Status:** Design Proposal  
**Priority:** HIGH

---

## Visual Mockups

### 1.1 State Flow Timeline Component

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT STATE TIMELINE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ○─────────●─────────○─────────○─────────○─────────○                           │
│   │         │         │         │         │         │                           │
│  NEW      DEMO     DRAFT   CONFIRMED  RELEASED  ARCHIVED                        │
│           ▲                                                                      │
│     current state                                                                │
│                                                                                  │
│  ┌─────┐  ┌─────┐  ┌─────┐                                                      │
│  │ 📋  │  │ 📋  │  │ 📊  │  ← Stepper / Dashboard indicator                     │
│  └─────┘  └─────┘  └─────┘                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Monospace font for state labels (aligns with CREARIS aesthetic)
- Current state: filled circle ●, future: empty ○, past: checkmark ✓
- Layout badge below each state (📋 Stepper / 📊 Dashboard)
- Horizontal on desktop, vertical stack on mobile

---

### 1.2 Enhanced Activation Panel with Transition Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🚀 Project Activation                                                    [×]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ ○────●────○────○────○────○                                              │    │
│  │ NEW DEMO DRAFT CONF REL  ARCH                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Current: ● DEMO          Progress: ████████░░ 80%                              │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│  Choose target state:                                                            │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  ○ Demo         │  │  ● Draft        │  │  ○ Confirmed    │                  │
│  │  (zurück)       │  │  (weiter) ✓     │  │  (überspr.)     │                  │
│  │                 │  │  RECOMMENDED    │  │  ⚠️ Skip demo   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│  📋 Readiness Checklist:                                 3/4 met                 │
│                                                                                  │
│  ✅ Titelbild vorhanden                                                         │
│  ✅ Mindestens 1 Beitrag erstellt                                               │
│  ✅ Team-Größe ≤3 (Skip erlaubt)                                                │
│  ❌ Beschreibung fehlt                    [ 🔧 Fix Now ]                        │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ 📜 TRANSITION SUMMARY: DEMO → DRAFT                                     │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                         │    │
│  │ What changes for each role:                                             │    │
│  │                                                                         │    │
│  │ 👑 p_owner:                                                             │    │
│  │    config access, full management, all transitions                      │    │
│  │                                                                         │    │
│  │ 🤝 p_creator:                                                           │    │
│  │    config access, member management, workflow transitions               │    │
│  │                                                                         │    │
│  │ 👤 member:                                                              │    │
│  │    + can CREATE posts, events, images                                   │    │
│  │    + can UPDATE own content                                             │    │
│  │    + can COMMENT on all content                                         │    │
│  │                                                                         │    │
│  │ 👁 participant:                                                         │    │
│  │    + can READ draft content (headlines only in demo)                    │    │
│  │    + can COMMENT on posts                                               │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│  ┌─────────┐  ┌─────────┐                         ← p_owner only                │
│  │ ← Demo  │  │ 🗑 Trash │                                                       │
│  └─────────┘  └─────────┘                                                       │
│                                                                                  │
│                      ┌────────────────────────────────┐                         │
│                      │    🚀 Activate to DRAFT        │                         │
│                      └────────────────────────────────┘                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Transition Summary Data Structure

The transition summary pulls from `sysreg_config.description` entries filtered by:
- Target state (`TO_STATE` bits)
- Grouped by relation (`REL_*` bits)

```typescript
interface TransitionSummary {
  fromState: string
  toState: string
  changes: {
    relation: 'p_owner' | 'p_creator' | 'member' | 'participant' | 'partner' | 'anonym'
    icon: string
    capabilities: string[]  // From sysreg_config descriptions
    isNew: boolean          // Capability gained in this transition
  }[]
}
```

---

### 1.4 Mobile Design (Full-Screen)

```
┌──────────────────────────┐
│ 🚀 Project Activation  × │
├──────────────────────────┤
│                          │
│ ○──●──○──○──○──○         │
│ N  D  DR CO RE AR        │
│    ▲                     │
│                          │
│ Progress: ████████░░ 80% │
│                          │
│ ─────────────────────────│
│                          │
│ Target: DRAFT            │
│ ┌────────────────────┐   │
│ │  ◉ Draft (weiter)  │   │
│ │  ○ Demo (zurück)   │   │
│ │  ○ Confirmed (skip)│   │
│ └────────────────────┘   │
│                          │
│ ─────────────────────────│
│                          │
│ 📋 Checklist (3/4)       │
│ ✅ Cover image           │
│ ✅ 1+ post               │
│ ✅ Team ≤3               │
│ ❌ Description [Fix]     │
│                          │
│ ─────────────────────────│
│                          │
│ 📜 What happens:         │
│                          │
│ ▼ Members gain:          │
│   create, update, comment│
│                          │
│ ▼ Participants gain:     │
│   read drafts, comment   │
│                          │
│ ─────────────────────────│
│                          │
│ ┌────────────────────┐   │
│ │ 🚀 Activate DRAFT  │   │
│ └────────────────────┘   │
│                          │
└──────────────────────────┘
```

---

## Coding Guidance

### New Components Needed

#### 1. `StateFlowTimeline.vue`

```typescript
// Props
interface Props {
  currentStatus: number
  allowedTargets: number[]
  selectedTarget?: number
  compact?: boolean  // For mobile
}

// Emits
defineEmits<{
  select: [status: number]
}>()
```

**Key CSS (Opus Convention):**
```css
/* StateFlowTimeline - follows Opus CSS conventions */
.timeline {
  display: flex;
  align-items: center;
  gap: 0;
  font-family: var(--font);  /* Opus monospace from 00-theme.css */
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.timeline-connector {
  width: 40px;
  height: 2px;
  background: var(--color-border);
  transition: var(--transition);
}

.timeline-connector.passed {
  background: var(--color-positive-base);
}

/* Circle states using oklch */
.node-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-bg);
  transition: var(--transition);
}

.node-circle.current {
  background: var(--color-primary-base);
  border-color: var(--color-primary-base);
  box-shadow: 0 0 0 4px oklch(from var(--color-primary-base) l c h / 0.2);
}

.node-circle.passed {
  background: var(--color-positive-base);
  border-color: var(--color-positive-base);
}

.node-circle.selectable {
  cursor: pointer;
  border-color: var(--color-primary-base);
}

.node-circle.selectable:hover {
  background: oklch(from var(--color-primary-base) l c h / 0.2);
  transform: scale(1.2);
}

.node-label {
  font-family: var(--font);
  font-size: 0.7rem;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-contrast);
}

.node-label.current {
  color: var(--color-primary-base);
  font-weight: 600;
}

/* Layout badge */
.node-layout-badge {
  font-size: 0.6rem;
  padding: 0.125rem 0.25rem;
  border-radius: var(--radius-small);
  background: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  margin-top: 0.25rem;
}

.node-layout-badge.dashboard {
  background: var(--color-accent-bg);
  color: var(--color-accent-contrast);
}
```

#### 2. `TransitionSummary.vue`

```typescript
// Props
interface Props {
  fromStatus: number
  toStatus: number
  projectType: ProjectType
}

// Composable to fetch summaries
function useTransitionSummary(fromStatus: Ref<number>, toStatus: Ref<number>) {
  const summary = ref<TransitionSummary | null>(null)
  
  async function fetchSummary() {
    // API call: GET /api/sysreg/transition-summary?from=8&to=64
    const response = await fetch(
      `/api/sysreg/transition-summary?from=${fromStatus.value}&to=${toStatus.value}`
    )
    summary.value = await response.json()
  }
  
  watch([fromStatus, toStatus], fetchSummary, { immediate: true })
  
  return { summary }
}
```

#### 3. API Endpoint: `/api/sysreg/transition-summary`

```typescript
// server/api/sysreg/transition-summary.get.ts

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fromStatus = parseInt(query.from as string)
  const toStatus = parseInt(query.to as string)
  
  // Query sysreg_config for entries matching target state
  const entries = await db.all(`
    SELECT name, description, value
    FROM sysreg_config
    WHERE (value & ${toStatus << 8}) > 0  -- TO_STATE bits
    ORDER BY value
  `)
  
  // Group by relation and extract capability descriptions
  const summary = groupByRelation(entries)
  
  return summary
})
```

---

### Integration Points

1. **ProjectActivationPanel.vue** - Add StateFlowTimeline at top, TransitionSummary before footer
2. **useProjectActivation.ts** - Add `fetchTransitionSummary()` method
3. **New API endpoint** - `/api/sysreg/transition-summary`

---

## File Locations

| Component | Path |
|-----------|------|
| StateFlowTimeline | `src/components/workflow/StateFlowTimeline.vue` |
| TransitionSummary | `src/components/workflow/TransitionSummary.vue` |
| API endpoint | `server/api/sysreg/transition-summary.get.ts` |

---

## Next: Report 2 - Post-IT Comment System
