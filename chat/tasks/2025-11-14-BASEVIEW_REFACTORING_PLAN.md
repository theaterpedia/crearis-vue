# BaseView Refactoring Plan

**Date:** 2025-11-10  
**Status:** PLANNING - DO NOT START YET  
**Current File Size:** 2,576 lines  
**Target:** Modular, maintainable component architecture

---

## 🎯 Goals

1. **Eliminate Code Duplication**: Extract repeated patterns into reusable components
2. **Leverage Shared Entity Structure**: Use common fields (name, project_id, img_id, status_id, content, cimg) across all entities
3. **Maintainability**: Make it easy to add new entity types
4. **Performance**: Better code splitting and lazy loading
5. **Testability**: Smaller, focused components that are easier to test

---

## 📊 Current Analysis

### Entity Structure

**Shared Fields (All Entities):**
- `id` - Primary key
- `xmlid` - Legacy XML ID
- `name` / `title` - Display name
- `project_id` - Project reference (FK)
- `img_id` - Modern image reference (FK)
- `status_id` - Status reference (FK)
- `content` - Markdown content
- `teaser` / `description` - Short description
- `cimg` - Deprecated image URL
- `created_at`, `updated_at` - Timestamps

**Entity-Specific Fields:**
- **Events:**
  - `date_begin`, `date_end` - Date range
  - `address_id` - Location reference
  - `img_wide` - Wide hero image
  
- **Posts:**
  - (Mostly standard fields)
  
- **Locations:**
  - `street`, `zip`, `city` - Address fields
  - `phone`, `email` - Contact info
  - `lat`, `lng` - Coordinates
  
- **Instructors:**
  - `phone`, `email` - Contact info
  - `city` - Location
  - `bio` / `description` - Biography

### Code Duplication Patterns

1. **Entity Display Cards** (~80 lines × 3 entities = 240 lines)
   - Demo banner logic
   - Edit button
   - Image with warning icon
   - Card content
   - Click handlers

2. **Entity Edit Forms** (~120 lines × 4 entities = 480 lines)
   - Status dropdown header
   - Name field
   - Project/Image dropdowns
   - Teaser textarea
   - Markdown field
   - cimg with erase button

3. **Data Fetching** (~15 lines × 6 endpoints = 90 lines)
   - fetch() calls
   - Error handling
   - State updates

4. **Save Logic** (~50 lines × 2 = 100 lines)
   - Entity save
   - Task save
   - Validation
   - Error handling

---

## 🏗️ Proposed Architecture

```
src/
├── views/
│   └── BaseView.vue                    [MAIN CONTAINER - 500 lines]
│       ├── Settings & Navigation
│       ├── Layout Management
│       └── Orchestration
│
├── components/
│   ├── base/                          [NEW - Base Entity Components]
│   │   ├── EntityManager.vue          [Core entity CRUD logic]
│   │   ├── EntityDisplay.vue          [Read-only entity display]
│   │   ├── EntityForm.vue             [Generic form with slots]
│   │   ├── EntityCard.vue             [Card display component]
│   │   └── EntityHero.vue             [Hero section component]
│   │
│   ├── entities/                      [NEW - Entity-Specific Components]
│   │   ├── events/
│   │   │   ├── EventForm.vue          [Event-specific fields]
│   │   │   ├── EventCard.vue          [Event card display]
│   │   │   └── EventHero.vue          [Event hero section]
│   │   │
│   │   ├── posts/
│   │   │   ├── PostForm.vue
│   │   │   └── PostCard.vue
│   │   │
│   │   ├── locations/
│   │   │   ├── LocationForm.vue
│   │   │   └── LocationCard.vue
│   │   │
│   │   └── instructors/
│   │       ├── InstructorForm.vue
│   │       └── InstructorCard.vue
│   │
│   ├── forms/                         [NEW - Reusable Form Components]
│   │   ├── FormHeader.vue             [Status + Title]
│   │   ├── FormFieldText.vue          [Text input wrapper]
│   │   ├── FormFieldTextarea.vue      [Textarea wrapper]
│   │   ├── FormFieldDate.vue          [Date input wrapper]
│   │   ├── FormFieldMarkdown.vue      [Markdown editor]
│   │   ├── FormFieldImage.vue         [Image selector with cimg]
│   │   ├── FormFieldProject.vue       [Project selector]
│   │   └── FormActions.vue            [Save/Cancel buttons]
│   │
│   └── shared/
│       ├── DeprecatedImageWarning.vue [cimg warning icon]
│       └── EntityEditButton.vue       [Edit button overlay]
│
├── composables/
│   ├── useEntity.ts                   [NEW - Generic entity CRUD]
│   ├── useEntityForm.ts               [NEW - Form state management]
│   ├── useEntityDisplay.ts            [NEW - Display logic]
│   ├── useProjectAutomation.ts        [NEW - Project automation logic]
│   └── useImageHandling.ts            [NEW - Image precedence logic]
│
└── types/
    ├── entities.ts                    [NEW - Entity type definitions]
    └── forms.ts                       [NEW - Form type definitions]
```

---

## 📝 Detailed Component Specifications

### 1. **EntityManager.vue** (Composable Pattern)

**Purpose:** Central entity management logic

```typescript
// composables/useEntity.ts
export function useEntity<T>(entityType: string) {
  const data = ref<T[]>([])
  const current = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetch = async (filters?: Record<string, any>) => { /* ... */ }
  const fetchOne = async (id: string) => { /* ... */ }
  const save = async (entity: Partial<T>) => { /* ... */ }
  const remove = async (id: string) => { /* ... */ }

  return {
    data,
    current,
    loading,
    error,
    fetch,
    fetchOne,
    save,
    remove
  }
}
```

**Benefits:**
- Single source of truth for CRUD operations
- Reusable across all entity types
- Centralized error handling
- Automatic state management

---

### 2. **EntityForm.vue** (Generic Form Shell)

**Purpose:** Shared form structure with slots for entity-specific fields

**Template Structure:**
```vue
<template>
  <div class="entity-form">
    <!-- Header with Status -->
    <FormHeader
      :title="title"
      :status-id="modelValue.status_id"
      :table="tableName"
      @update:status="emit('update:status_id', $event)"
    />

    <!-- Common Fields -->
    <FormFieldText
      v-model="modelValue.name"
      label="Name"
      @update:modelValue="emit('change')"
    />

    <FormFieldProject
      v-model="modelValue.project_id"
      :filter-ids="availableProjectIds"
      @update:modelValue="handleProjectChange"
    />

    <FormFieldImage
      v-model="modelValue.img_id"
      @update:modelValue="emit('change')"
    />

    <FormFieldTextarea
      v-model="modelValue.teaser"
      label="Teaser"
      :rows="3"
      @update:modelValue="emit('change')"
    />

    <!-- Entity-Specific Fields Slot -->
    <slot name="specific-fields" :model="modelValue" />

    <!-- Markdown Field -->
    <FormFieldMarkdown
      v-model="modelValue.content"
      @update:modelValue="emit('change')"
    />

    <!-- Deprecated cimg Field -->
    <FormFieldImage
      v-if="modelValue.cimg"
      v-model="modelValue.cimg"
      deprecated
      @erase="modelValue.cimg = ''; emit('change')"
      @update:modelValue="emit('change')"
    />

    <!-- Actions -->
    <FormActions
      @save="emit('save')"
      @cancel="emit('cancel')"
    />
  </div>
</template>
```

**Props:**
- `modelValue: EntityBase` - Current entity data
- `tableName: string` - For status dropdown
- `availableProjectIds?: number[]` - Filtered projects

**Emits:**
- `update:modelValue` - Two-way binding
- `change` - Dirty flag trigger
- `save` - Save action
- `cancel` - Cancel action

---

### 3. **EventForm.vue** (Entity-Specific Form)

**Purpose:** Event-specific fields only

**Template:**
```vue
<template>
  <EntityForm
    v-model="modelValue"
    table-name="events"
    title="Event-Daten"
    :available-project-ids="availableProjectIds"
    @change="emit('change')"
    @save="emit('save')"
    @cancel="emit('cancel')"
  >
    <template #specific-fields="{ model }">
      <div class="form-row">
        <FormFieldDate
          v-model="model.date_begin"
          label="Beginn"
          @update:modelValue="emit('change')"
        />
        <FormFieldDate
          v-model="model.date_end"
          label="Ende"
          @update:modelValue="emit('change')"
        />
      </div>
    </template>
  </EntityForm>
</template>
```

**Benefits:**
- Only 20-30 lines of code
- Focuses on event-specific logic
- Inherits all common functionality

---

### 4. **EntityCard.vue** (Generic Card Component)

**Purpose:** Reusable entity card with slots

**Template:**
```vue
<template>
  <div 
    class="entity-card" 
    :class="{ 'is-active': isActive }"
    @click="emit('click')"
  >
    <!-- Corner Banner -->
    <CornerBanner
      v-if="entity.xmlid?.startsWith('_demo')"
      text="demo"
      size="small"
    />

    <!-- Edit Button -->
    <EntityEditButton
      v-if="editMode"
      :is-active="isActive"
      @click.stop="emit('edit')"
    />

    <!-- Image -->
    <div v-if="imageUrl" class="entity-image-container">
      <img :src="imageUrl" :alt="entity.name" />
      <DeprecatedImageWarning v-if="usesDeprecatedImage" />
    </div>

    <!-- Content Slot -->
    <div class="entity-content">
      <slot :entity="entity">
        <h4>{{ entity.name }}</h4>
        <p v-if="entity.teaser">{{ entity.teaser }}</p>
      </slot>
    </div>
  </div>
</template>
```

**Props:**
- `entity: EntityBase` - Entity data
- `editMode: boolean` - Show edit button
- `isActive: boolean` - Active state styling
- `imageField?: string` - Which image field to use

**Computed:**
- `imageUrl` - Handles precedence (cimg > img_id)
- `usesDeprecatedImage` - Shows warning icon

---

### 5. **useEntityForm.ts** (Form State Composable)

**Purpose:** Manages form state, validation, and dirty tracking

```typescript
export function useEntityForm<T extends EntityBase>(
  initialData: Ref<T | null>,
  entityType: string
) {
  const formData = ref<T>({ ...initialData.value })
  const isDirty = ref(false)
  const isSaving = ref(false)
  const errors = ref<Record<string, string>>({})

  const markDirty = () => {
    isDirty.value = true
  }

  const validate = () => {
    errors.value = {}
    // Common validation rules
    if (!formData.value.name) {
      errors.value.name = 'Name is required'
    }
    return Object.keys(errors.value).length === 0
  }

  const reset = () => {
    formData.value = { ...initialData.value }
    isDirty.value = false
    errors.value = {}
  }

  const save = async () => {
    if (!validate()) return false
    
    isSaving.value = true
    try {
      const result = await saveEntity(entityType, formData.value)
      reset()
      return result
    } finally {
      isSaving.value = false
    }
  }

  return {
    formData,
    isDirty,
    isSaving,
    errors,
    markDirty,
    validate,
    reset,
    save
  }
}
```

---

### 6. **useProjectAutomation.ts** (Project Automation Logic)

**Purpose:** Centralized project automation logic

```typescript
export function useProjectAutomation(
  enabled: Ref<boolean>,
  events: Ref<any[]>,
  projects: Ref<any[]>
) {
  // RULE 1: Filter projects with events
  const availableProjects = computed(() => {
    if (!enabled.value) return projects.value
    
    const projectIdsWithEvents = new Set(
      events.value
        .filter(e => e.project_id)
        .map(e => e.project_id)
    )
    
    return projects.value.filter(p => projectIdsWithEvents.has(p.id))
  })

  const availableProjectIds = computed(() => {
    return enabled.value 
      ? availableProjects.value.map(p => p.id)
      : undefined
  })

  // RULE 2: Handle xmlid replacement
  const handleProjectSelection = (
    entity: any, 
    project: any,
    onUpdate: (entity: any) => void
  ) => {
    entity.project_id = project.id
    
    if (enabled.value && entity.xmlid) {
      if (entity.xmlid.startsWith('_demo')) {
        entity.xmlid = entity.xmlid.replace('_demo', project.domaincode)
        console.log(`✅ XML ID updated: ${entity.xmlid}`)
      } else {
        alert('change xml_id manually!!!')
        console.warn('⚠️ XML ID does not start with _demo')
      }
    }
    
    onUpdate(entity)
  }

  return {
    availableProjects,
    availableProjectIds,
    handleProjectSelection
  }
}
```

---

### 7. **Type Definitions** (types/entities.ts)

```typescript
// Base entity interface with shared fields
export interface EntityBase {
  id: string | number
  xmlid?: string
  name: string
  project_id?: number
  img_id?: number
  status_id?: number
  content?: string
  teaser?: string
  cimg?: string
  created_at?: string
  updated_at?: string
}

// Entity-specific interfaces
export interface Event extends EntityBase {
  date_begin: string
  date_end: string
  address_id?: number
  img_wide?: string
}

export interface Post extends EntityBase {
  event_id?: number
  event_xmlid?: string
}

export interface Location extends EntityBase {
  street?: string
  zip?: string
  city?: string
  phone?: string
  email?: string
  lat?: number
  lng?: number
}

export interface Instructor extends EntityBase {
  phone?: string
  email?: string
  city?: string
  bio?: string
  event_xmlid?: string
}

// Union type for all entities
export type Entity = Event | Post | Location | Instructor

// Entity type enum
export enum EntityType {
  Event = 'event',
  Post = 'post',
  Location = 'location',
  Instructor = 'instructor'
}

// Table name mapping
export const TABLE_NAMES: Record<EntityType, string> = {
  [EntityType.Event]: 'events',
  [EntityType.Post]: 'posts',
  [EntityType.Location]: 'locations',
  [EntityType.Instructor]: 'instructors'
}
```

---

## 🚀 Migration Strategy

### Phase 1: Foundation (Day 1-2)
**Goal:** Set up infrastructure without breaking existing code

1. **Create type definitions** (`types/entities.ts`, `types/forms.ts`)
2. **Create composables** (start with `useEntity.ts`)
3. **Create base form components** (`FormFieldText`, `FormFieldTextarea`, etc.)
4. **Write unit tests** for composables

**Deliverable:** Reusable building blocks ready to use

---

### Phase 2: Entity Display (Day 3-4)
**Goal:** Refactor entity display (left column)

1. **Create `EntityCard.vue`** (generic card component)
2. **Create `EntityHero.vue`** (hero section)
3. **Create `DeprecatedImageWarning.vue`**
4. **Create `EntityEditButton.vue`**
5. **Update BaseView** to use new display components
6. **Test** that display works identically

**Deliverable:** Clean entity display with no duplication

---

### Phase 3: Entity Forms (Day 5-7)
**Goal:** Refactor entity forms (right column)

1. **Create `FormHeader.vue`** (status + title)
2. **Create `EntityForm.vue`** (generic form shell)
3. **Create entity-specific forms:**
   - `EventForm.vue`
   - `PostForm.vue`
   - `LocationForm.vue`
   - `InstructorForm.vue`
4. **Create `FormActions.vue`** (save/cancel)
5. **Update BaseView** to use new form components
6. **Test** form validation and saving

**Deliverable:** Modular form system

---

### Phase 4: CRUD Logic (Day 8-9)
**Goal:** Extract and centralize CRUD operations

1. **Create `useEntityForm.ts`** composable
2. **Create `useEntityDisplay.ts`** composable
3. **Update entity forms** to use composables
4. **Refactor save handlers** in BaseView
5. **Test** data flow and state management

**Deliverable:** Centralized business logic

---

### Phase 5: Project Automation (Day 10)
**Goal:** Clean up automation logic

1. **Create `useProjectAutomation.ts`** composable
2. **Extract xmlid replacement logic**
3. **Extract project filtering logic**
4. **Update BaseView** to use composable
5. **Test** automation rules

**Deliverable:** Clean automation module

---

### Phase 6: Cleanup & Optimization (Day 11-12)
**Goal:** Polish and optimize

1. **Remove old code** from BaseView
2. **Add lazy loading** for entity-specific components
3. **Optimize re-renders** with proper memoization
4. **Add loading states** and error boundaries
5. **Update documentation**
6. **Performance testing**

**Deliverable:** Production-ready refactored code

---

### Phase 7: Testing & Validation (Day 13-14)
**Goal:** Ensure quality and stability

1. **Unit tests** for all composables
2. **Component tests** for forms and displays
3. **Integration tests** for CRUD operations
4. **E2E tests** for critical user flows
5. **Accessibility audit**
6. **Cross-browser testing**

**Deliverable:** Well-tested, stable system

---

## 📈 Expected Benefits

### Before (Current State)
- **File Size:** 2,576 lines (BaseView.vue)
- **Duplication:** ~1,000+ lines of repeated code
- **Maintainability:** ⚠️ Difficult to modify
- **Testability:** ⚠️ Hard to test in isolation
- **Performance:** ⚠️ Large bundle size

### After (Target State)
- **BaseView.vue:** ~500 lines (orchestration only)
- **Entity Components:** ~50-100 lines each
- **Form Components:** ~30-50 lines each
- **Composables:** ~100-200 lines each
- **Total LOC:** Similar, but organized
- **Duplication:** ~95% reduction
- **Maintainability:** ✅ Easy to modify and extend
- **Testability:** ✅ Small, focused units
- **Performance:** ✅ Better code splitting

---

## 🎯 Success Metrics

### Code Quality
- [ ] Duplication reduced by >90%
- [ ] Average component size <150 lines
- [ ] Test coverage >80%
- [ ] No linting errors/warnings

### Performance
- [ ] Initial bundle size reduced by >20%
- [ ] Lazy loading implemented
- [ ] No performance regressions
- [ ] Lighthouse score >90

### Developer Experience
- [ ] New entity type can be added in <2 hours
- [ ] Common field changes require <5 min
- [ ] Clear separation of concerns
- [ ] Well-documented APIs

### User Experience
- [ ] No visual regressions
- [ ] All features work identically
- [ ] No accessibility regressions
- [ ] Smooth animations/transitions

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Refactor incrementally
- Maintain parallel implementations temporarily
- Extensive testing at each phase
- Feature flags for gradual rollout

### Risk 2: Scope Creep
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Stick to the plan
- Document any necessary deviations
- Keep phases focused and time-boxed
- Regular review meetings

### Risk 3: Over-Abstraction
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Follow "Rule of Three" (don't abstract until 3rd use)
- Keep components simple and focused
- Document abstraction decisions
- Regular code reviews

### Risk 4: Performance Regressions
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Benchmark before refactoring
- Monitor bundle size
- Profile after each phase
- Use lazy loading strategically

---

## 📚 Additional Considerations

### Backward Compatibility
- Keep API endpoints unchanged
- Maintain data structure compatibility
- No database schema changes required

### Documentation Updates
- Component API documentation
- Composable usage examples
- Migration guide for future entity types
- Architecture decision records (ADRs)

### Team Coordination
- Daily standups during refactor
- Pair programming for complex components
- Code review for all changes
- Knowledge sharing sessions

### Rollback Strategy
- Git branches for each phase
- Ability to revert at phase boundaries
- Feature flags for new components
- Smoke tests before merging

---

## 🎬 Getting Started

**When ready to begin:**

1. Create feature branch: `feature/baseview-refactor`
2. Start with Phase 1 (Foundation)
3. Commit frequently with descriptive messages
4. Open draft PR for early feedback
5. Complete one phase before moving to next
6. Document decisions and learnings

**Estimated Timeline:** 14 working days (3 weeks)

**Required Resources:**
- 1 Senior Developer (full-time)
- 1 Code Reviewer (part-time)
- QA support for testing phases

---

## 📝 Notes

- This is a **living document** - update as you learn
- Adjust timeline based on actual progress
- Don't hesitate to ask for help or clarification
- Celebrate small wins along the way!

**Status:** Ready for review and approval before starting

---

**Next Steps:**
1. ✅ Review this plan with team
2. ⏳ Get approval to proceed
3. ⏳ Schedule kickoff meeting
4. ⏳ Create project board/tracking
5. ⏳ Begin Phase 1
