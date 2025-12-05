# Projectlogin Workflow - Features Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (v0.4 only)  
**Note:** This is a NEW entity to be created during the sprint

---

## Target State (v0.4)

### v0.4: Features Entity Creation
- New database table migration
- Status composable (`useFeatureStatus`)
- Feature CRUD operations
- Roadmap display integration
- Interactions integration for feedback

---

## Purpose

The Features entity extends the 'dev' special project type to manage development roadmap items. It allows:
- Tracking planned features
- Organizing roadmap
- Collecting user feedback via interactions

---

## Status Configuration

### Applicable Statuses
Feature-specific workflow:
- idea - Initial concept
- planned - Accepted for roadmap
- in_progress - Currently being worked on
- released - Shipped/completed
- deferred - Postponed

### Scope Toggles
- login - Visible to logged-in users
- public - Publicly visible

---

## Composable: useFeatureStatus

```typescript
// Target API
interface UseFeatureStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  isPlanned: ComputedRef<boolean>
  isInProgress: ComputedRef<boolean>
  isReleased: ComputedRef<boolean>
  
  // Transitions
  toPlan(): Promise<void>
  toInProgress(): Promise<void>
  toReleased(): Promise<void>
  toDeferred(): Promise<void>
  
  // Roadmap position
  roadmapOrder: ComputedRef<number>
  setRoadmapOrder(order: number): Promise<void>
}
```

---

## Database Schema (NEW)

### Table: features
```sql
CREATE TABLE features (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status INTEGER DEFAULT 0,
  roadmap_order INTEGER,
  project_id TEXT REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  main_task_id TEXT REFERENCES tasks(id)
);

-- Generated columns
ALTER TABLE features ADD COLUMN is_released BOOLEAN 
  GENERATED ALWAYS AS (status >= 12 AND status <= 14) STORED;
```

### Migration Number
- Target: Migration 043 or later

---

## Related Components

- `FeatureCard.vue` - Feature display in roadmap
- `FeatureEdit.vue` - Feature editing
- `RoadmapView.vue` - Roadmap display
- `FeatureInteractions.vue` - Feedback collection

---

## Interactions Integration

Features connect to the `interactions` table for:
- Upvotes/downvotes
- Comments
- Priority suggestions

---

## Test Files

- `status.features.spec.ts` - Status composable tests
- `common.features.spec.ts` - General feature tests
- `roadmap.features.spec.ts` - Roadmap integration tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
