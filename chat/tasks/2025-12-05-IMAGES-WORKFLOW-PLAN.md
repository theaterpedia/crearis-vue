# Images Workflow Implementation Plan

**Target Date:** Friday, December 5, 2025  
**Sprint:** Projectlogin Workflow (Dec 1-9)  
**Status:** Planning document

---

## Overview

Implement a task-driven workflow for images that ensures legal compliance (especially for images with children) before publication.

### Core Concept

The image **owner** is the "responsible person" who:
- Stands for legal compliance (consent forms, permissions)
- Confirms that involved people agree to processing/publishing
- Is NOT necessarily the photographer or uploader

---

## Workflow States

Using existing status values from Migration 040:

| Status | Value | Image State | Owner Required |
|--------|-------|-------------|----------------|
| new | 1 | Raw upload, unprocessed | No |
| new_image | 2 | Raw (subcategory) | No |
| demo | 8 | Template/example image | No |
| **draft** | 64 | Needs confirmation | **YES** |
| draft_public_candidate | TBD | Explicit: ready for review | YES |
| **confirmed** | 512 | Owner verified: consent OK | YES |
| **released** | 4096 | Public, approved | YES |

### Proposed Subcategory

Add `draft_public_candidate` as subcategory of draft (bits 6-8):
- Value: `64 + (2 << 6)` = `64 + 128` = **192** OR simply use value **128**
- Meaning: "This image is a candidate for public release, pending owner confirmation"

---

## Implementation Tasks

### 1. Database: Tasks Table

Create `tasks` table for workflow tracking:

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    -- Entity reference
    entity_type VARCHAR(50) NOT NULL,  -- 'images', 'posts', 'events'
    entity_id INTEGER NOT NULL,
    
    -- Task details
    task_type VARCHAR(50) NOT NULL,    -- 'confirm_consent', 'review', 'approve'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
    
    -- Assignment
    assigned_to INTEGER REFERENCES users(id),  -- Who should complete this task
    created_by INTEGER REFERENCES users(id),   -- Who created the task
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    project_id INTEGER REFERENCES projects(id)
);
```

### 2. Status Transition Rules

Implement in composable/API:

```typescript
// useImageStatus.ts additions

const canAdvanceToStatus = (image: Image, targetStatus: number): boolean => {
    // Cannot advance to draft (64) or beyond without owner
    if (targetStatus >= 64 && !image.owner_id) {
        return false
    }
    return true
}

const advanceStatus = async (image: Image, targetStatus: number): Promise<void> => {
    if (!canAdvanceToStatus(image, targetStatus)) {
        throw new Error('Owner required for this status')
    }
    
    // If advancing to draft, create confirmation task
    if (targetStatus === 64) {
        await createTask({
            entity_type: 'images',
            entity_id: image.id,
            task_type: 'confirm_consent',
            assigned_to: image.owner_id,
            project_id: image.project_id
        })
    }
    
    // Update status
    await updateImageStatus(image.id, targetStatus)
}
```

### 3. UI Components

#### 3a. cimgImportStepper: Make Owner Optional

Change current behavior from required to optional:

```vue
<!-- Owner Selection (Optional at upload) -->
<div class="owner-selection-bar">
    <label class="owner-label">Image Admin (optional)</label>
    <sysDropDown 
        v-model="selectedOwnerId" 
        :items="eligibleUsers" 
        placeholder="Assign later..."
        :disabled="isImporting" 
        clearable
    />
    <p class="owner-hint">
        Kann später zugewiesen werden, bevor das Bild freigegeben wird
    </p>
</div>
```

#### 3b. Task Badge on Images

Show pending tasks on image thumbnails:

```vue
<template>
    <div class="image-card">
        <img :src="image.thumbnail_url" />
        <TaskBadge v-if="hasPendingTasks" :count="pendingTaskCount" />
        <!-- Show "needs owner" indicator for ownerless images -->
        <OwnerRequiredBadge v-if="!image.owner_id && image.status_id >= 1" />
    </div>
</template>
```

#### 3c. Image Status Editor Enhancement

Add task-aware status transitions:

```vue
<template>
    <div class="status-editor">
        <StatusDisplay :status="image.status_id" />
        
        <!-- Advance button with owner check -->
        <button 
            v-if="canAdvance" 
            @click="advanceToNextStatus"
            :disabled="!hasOwner && nextStatus >= 64"
        >
            {{ advanceLabel }}
        </button>
        
        <!-- Owner required warning -->
        <p v-if="!hasOwner && nextStatus >= 64" class="warning">
            ⚠️ Assign an owner before advancing to draft
        </p>
    </div>
</template>
```

#### 3d. Owner Assignment (moved from upload to detail view)

**Remove** owner requirement from cimgImportStepper upload flow.

**Add** owner assignment in image detail/edit view:

```vue
<template>
    <div class="image-detail-owner">
        <h4>Verantwortliche Person</h4>
        
        <!-- No owner assigned yet -->
        <div v-if="!image.owner_id" class="owner-missing">
            <WarningIcon />
            <p>Noch keine verantwortliche Person zugewiesen</p>
            <p class="hint">Erforderlich, um das Bild in den Status "Entwurf" zu bringen</p>
            
            <sysDropDown 
                v-model="selectedOwnerId"
                :items="eligibleUsers"
                placeholder="Person auswählen..."
            />
            <button @click="assignOwner" :disabled="!selectedOwnerId">
                Zuweisen
            </button>
        </div>
        
        <!-- Owner assigned -->
        <div v-else class="owner-assigned">
            <UserAvatar :user-id="image.owner_id" />
            <span>{{ ownerName }}</span>
            <button v-if="canReassign" @click="showReassignDialog">
                Ändern
            </button>
        </div>
    </div>
</template>
```

### 4. Task List Views

#### 4a. Per-Image Task List

In image detail/edit view:
- Show task history
- Allow owner to complete "confirm_consent" task
- Show confirmation timestamp

#### 4b. Project Task Dashboard

In project dashboard:
- List all pending tasks by type
- Filter by entity type (images, posts, events)
- Quick actions to complete tasks

---

## Migration Plan

### Migration 049: Add tasks table

```typescript
export const migration = {
    id: '049_tasks_table',
    description: 'Add tasks table for workflow tracking',
    
    async up(db: DatabaseAdapter): Promise<void> {
        await db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER NOT NULL,
                task_type VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                assigned_to INTEGER REFERENCES users(id),
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP,
                notes TEXT,
                project_id INTEGER REFERENCES projects(id)
            )
        `)
        
        // Index for efficient queries
        await db.run(`
            CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id)
        `)
        await db.run(`
            CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status)
        `)
        await db.run(`
            CREATE INDEX idx_tasks_project ON tasks(project_id, status)
        `)
    }
}
```

### Migration 050: Add draft_public_candidate status (optional)

If explicit subcategory is desired:

```typescript
await insertStatus(db, 'subcategory', 'draft_public_candidate', 128, 
    'Öffentlichkeits-Kandidat', 'Public Candidate', 6)
```

---

## Open Questions (for Friday)

1. **Owner assignment point:** ✅ DECIDED: **Option 2 - At status transition**
   
   **Workflow rationale:**
   - User A (assistant) bulk-imports images quickly, no time to assign owners
   - Images start as 'new' (status=1) without owner requirement
   - Images become "internally browsable" within project team
   - Later, when considering what to publish/trash, ownership questions arise
   - Only then, when advancing to 'draft' (status=64), owner must be assigned
   
   **Implementation:**
   - Remove owner requirement from `cimgImportStepper` upload step
   - Make owner dropdown optional (default: none)
   - Add owner assignment UI in image detail/edit view
   - Block status transition to draft if no owner assigned
   - Show "Assign owner to continue" prompt

2. **Task completion UI:**
   - Checkbox + confirm button?
   - Modal with consent acknowledgment text?
   - Signature/timestamp?

3. **Bulk operations:**
   - Can owner confirm multiple images at once?
   - Should there be a "batch review" mode?

4. **Notification system:**
   - Email when task assigned?
   - In-app notifications?
   - Both (configurable)?

---

## Success Criteria

- [ ] Images cannot reach draft status without owner
- [ ] Task is auto-created when image advances to draft
- [ ] Owner can complete "confirm_consent" task
- [ ] Task completion advances image to "confirmed" status
- [ ] UI shows pending tasks on images and in project dashboard

---

## Related Documents

- [Sprint Roadmap](./2025-12-01-SPRINT-Projectlogin_Workflow.md)
- [Auth System Spec](./2025-12-01-AUTH-SYSTEM-SPEC.md)
- [Migration 040: Status Bit Allocation](../server/database/migrations/040_status_fix_bit_allocation.ts)

---

*This plan will be implemented during the Friday session (Dec 5) as part of v0.3 work.*
