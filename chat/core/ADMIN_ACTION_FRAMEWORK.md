# AdminAction Framework Documentation

**Version**: 1.0  
**Date**: October 21, 2025

## Overview

The AdminAction framework provides a flexible, reusable system for admin actions with three distinct interaction patterns. It consists of a configurable stepper-based modal, specialized panel components for different entity types, and a composable that manages action execution.

## Architecture

### Components

1. **AdminAction.vue** - Core modal component with stepper
2. **AdminActionUsersPanel.vue** - Panel for user operations
3. **AdminActionProjectsPanel.vue** - Panel for project operations
4. **AdminActionInstructorsPanel.vue** - Panel for instructor operations (to be implemented)

### Composable

- **useAdminActions.ts** - Action registry with consistent API

### API Endpoints

- `GET /api/domains/check` - Check domain availability
- `POST /api/validate/email` - Validate email (dummy with 30s delay)

## Three Interaction Patterns

### Pattern 1: SimpleButton

**Use Case**: Direct action execution with immediate feedback via toast/alert

**Characteristics**:
- No state management
- Fire-and-forget execution
- Success/error shown via toast
- Ideal for simple CRUD operations

**Example**: Adding user to project

```typescript
// In component
async function addUserToProject() {
  const result = await actions.addUserToProject({
    userId: 'user@theaterpedia.org',
    projectId: 'tp',
  })
  
  if (result.success) {
    alert('✓ User added successfully!')
  } else {
    alert(`✗ Failed: ${result.error}`)
  }
}
```

### Pattern 2: StateButton

**Use Case**: Show action progress/result state on the button itself

**Characteristics**:
- Reactive state tracking
- Button displays: ⏳ processing / ✓ success / ✗ error / Task #123
- Visual feedback without additional UI
- Perfect for task-based operations

**Example**: Creating project for user

```typescript
// In component
const taskState = ref<null | boolean | number | string>(null)

async function createProject(data: any) {
  await actions.createProjectForUser(
    { userId, projectData: data },
    { actionState: taskState }
  )
}
```

```vue
<template>
  <button class="btn">
    <span v-if="taskState === null">⏳ Processing...</span>
    <span v-else-if="taskState === false">✗ Failed</span>
    <span v-else-if="taskState === true">✓ Success</span>
    <span v-else-if="typeof taskState === 'number'">Task #{{ taskState }}</span>
  </button>
</template>
```

### Pattern 3: CallbackLogic

**Use Case**: Custom handling of action results with callback function

**Characteristics**:
- Full control over result handling
- Supports complex workflows
- Can update multiple UI elements
- Enables chaining operations

**Example**: Create user with callback

```typescript
// In component
const result = ref<string>('')

function createUser(data: any) {
  actions.createUser(data, {
    actionCallback: (state, result) => {
      if (state === true) {
        result.value = `✓ User created: ${result.data?.username}`
        // Can trigger additional actions here
      } else if (state === false) {
        result.value = `✗ Failed: ${result.error}`
      } else if (typeof state === 'number') {
        result.value = `Task ID: ${state}`
      }
    },
  })
}
```

## AdminAction Component

### Props

```typescript
interface AdminActionProps {
  modelValue: boolean              // v-model for open/close
  initStep?: 'none' | 'options' | 'select' | 'collect'
  finalStep?: 'inline' | 'summary' | 'full'
  actionType?: 'create' | 'alter' | 'add' | 'remove' | 'custom'
  coreType?: 'user' | 'project' | 'domain' | 'instructor'
  supportType?: 'user' | 'project' | 'domain' | 'instructor'
  coreId?: string | number | null
  supportId?: string | number | null
  fields?: 'default' | 'all' | string[]
}
```

### Behavior

- **Stepper Visibility**: Hidden if `initStep='none'` AND `finalStep='inline'`
- **Responsive**: Fullscreen on mobile, ~800px popup on desktop
- **Auto-scroll**: Inner content scrolls if height exceeds viewport

### Slots

```vue
<AdminAction v-model="isOpen">
  <template #panel="{ currentStep, formData, nextStep, prevStep, complete, cancel }">
    <!-- Your panel content -->
  </template>
  
  <template #footer="{ currentStep, nextStep, prevStep, complete, cancel }">
    <!-- Custom footer buttons -->
  </template>
</AdminAction>
```

### Example Usage

```vue
<script setup>
import { ref } from 'vue'
import AdminAction from '@/components/AdminAction.vue'
import AdminActionUsersPanel from '@/components/AdminActionUsersPanel.vue'

const isOpen = ref(false)
const userId = ref('user@theaterpedia.org')

function handleSubmit(data) {
  console.log('User data:', data)
  isOpen.value = false
}
</script>

<template>
  <button @click="isOpen = true">Edit User</button>

  <AdminAction
    v-model="isOpen"
    init-step="none"
    final-step="inline"
    action-type="alter"
    core-type="user"
    :core-id="userId"
  >
    <template #panel="{ complete, cancel }">
      <AdminActionUsersPanel
        action="alter"
        fields="default"
        :user-id="userId"
        @submit="handleSubmit"
        @cancel="cancel"
      />
    </template>
  </AdminAction>
</template>
```

## Panel Components

### AdminActionUsersPanel

**Actions**: `create`, `alter`, `show`

**Fields**:
- **default**: `id`, `username`, `role`
- **all**: `id`, `username`, `password`, `role`, `instructor_id`
- **custom**: Array of field names

```vue
<AdminActionUsersPanel
  action="create"
  fields="default"
  :user-id="null"
  @submit="handleSubmit"
  @cancel="handleCancel"
/>
```

### AdminActionProjectsPanel

**Actions**: `create`, `alter`, `show`

**Fields**:
- **default**: `name`, `description`, `owner_id`
- **all**: All project fields
- **custom**: Array of field names

```vue
<AdminActionProjectsPanel
  action="create"
  fields="default"
  :owner-id="userId"
  @submit="handleSubmit"
  @cancel="handleCancel"
/>
```

## useAdminActions Composable

### Action Registry

All actions share the same signature:

```typescript
async function action(
  input: string | number | object,
  options?: {
    actionState?: Ref<ActionState>
    actionCallback?: (state: ActionState, result: any) => void
  }
): Promise<ActionResult>
```

### Available Actions

#### User Actions

```typescript
// Create user
await createUser({
  id: 'user@theaterpedia.org',
  username: 'newuser',
  password: 'password123',
  role: 'user'
})

// Alter user
await alterUser({
  id: 'user@theaterpedia.org',
  username: 'updatedname'
})
```

#### Project Actions

```typescript
// Create project
await createProject({
  id: 'newproject',
  username: 'newproject',
  name: 'New Project',
  owner_id: 'user@theaterpedia.org'
})

// Create project for user
await createProjectForUser({
  userId: 'user@theaterpedia.org',
  projectData: {
    id: 'project',
    username: 'project',
    name: 'My Project',
    description: 'Description'
  }
})

// Alter project
await alterProject({
  id: 'project',
  name: 'Updated Name'
})
```

#### Domain Actions

```typescript
// Create domain
await createDomain({
  domainname: 'test.theaterpedia.org',
  admin_user_id: 'admin@theaterpedia.org',
  project_id: 'tp'
})

// Check availability
const { available } = await checkDomainAvailability('test.theaterpedia.org')
```

#### User-Project Relationships

```typescript
// Add user to project
await addUserToProject({
  userId: 'user@theaterpedia.org',
  projectId: 'tp'
})

// Remove user from project
await removeUserFromProject({
  userId: 'user@theaterpedia.org',
  projectId: 'tp'
})

// Create user for project
await createUserForProject({
  projectId: 'tp',
  userData: {
    id: 'newuser@theaterpedia.org',
    username: 'newuser',
    password: 'pass123',
    role: 'user'
  }
})
```

#### Validation

```typescript
// Validate email (dummy - 30s delay)
const { valid, reason } = await validateEmail('user@example.com')
// First attempt: { valid: false, reason: 'testing' }
// Second attempt: { valid: true }
```

## Showcase Component

See `AdminActionsShowcase.vue` for a complete demonstration of all three patterns.

### Features

- User selection dropdown
- Action list (alterUser, createProjectForUser, addUserToProject)
- Pattern 1 demo: Simple button with toast feedback
- Pattern 2 demo: State button showing progress/result
- Pattern 3 demo: Callback logic with custom result display

## API Endpoints

### GET /api/domains/check

Check if a domain name is available.

**Query Parameters**:
- `name` (string, required): Domain name to check

**Response**:
```json
{
  "available": true,
  "message": "Domain test.theaterpedia.org is available"
}
```

or

```json
{
  "available": false,
  "domain": { "id": 1, "domainname": "theaterpedia.org" },
  "message": "Domain theaterpedia.org is already registered"
}
```

### POST /api/validate/email

Dummy email validation with 30-second delay.

**Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (first attempt):
```json
{
  "valid": false,
  "reason": "testing",
  "message": "Email validation failed (first attempt - testing mode)"
}
```

**Response** (second attempt):
```json
{
  "valid": true,
  "message": "Email validation successful"
}
```

## Extension Guide

### Adding a New Panel

1. Create panel component (e.g., `AdminActionInstructorsPanel.vue`)
2. Define field schema with types
3. Implement actions: `create`, `alter`, `show`
4. Add field validation
5. Emit `submit` and `cancel` events

### Adding a New Action

1. Define action in `useAdminActions.ts`:
```typescript
export async function myNewAction(
  input: MyInputType,
  options?: ActionOptions
): Promise<ActionResult> {
  return executeAction('/api/my-endpoint', 'POST', payload, options)
}
```

2. Add to composable export:
```typescript
export function useAdminActions() {
  return {
    // ... existing actions
    myNewAction,
  }
}
```

3. Create API endpoint if needed

### Customizing Stepper

Modify `steps` computed in `AdminAction.vue`:

```typescript
const steps = computed(() => {
  // Custom step logic
  return [
    { id: 1, label: 'Custom Step', status: 'current' },
    // ...
  ]
})
```

## Best Practices

1. **Choose the Right Pattern**:
   - Simple CRUD → SimpleButton
   - Task tracking → StateButton
   - Complex workflows → CallbackLogic

2. **Field Configuration**:
   - Use `'default'` for common operations
   - Use `'all'` for admin tools
   - Use array for custom forms

3. **Error Handling**:
   - Always check `result.success`
   - Display meaningful error messages
   - Log errors for debugging

4. **State Management**:
   - Use refs for reactive state
   - Clean up state after completion
   - Consider using Pinia for complex state

5. **Responsive Design**:
   - Test on mobile devices
   - Ensure buttons are touch-friendly
   - Use appropriate font sizes

## Testing

### Manual Testing Checklist

- [ ] Modal opens and closes correctly
- [ ] Stepper navigation works
- [ ] Form validation functions
- [ ] All three patterns execute correctly
- [ ] Mobile responsive design
- [ ] Error states display properly
- [ ] Success feedback appears
- [ ] API endpoints respond correctly

### Example Test Cases

1. **Pattern 1**: Add user to project where they're not a member
2. **Pattern 2**: Create project, verify state button updates
3. **Pattern 3**: Create user, verify callback fires with correct data

## Troubleshooting

### Common Issues

**Modal doesn't open**:
- Check `v-model` binding
- Verify `modelValue` prop is reactive

**Actions fail silently**:
- Check network tab for API errors
- Verify endpoint URLs are correct
- Check authentication/permissions

**Stepper doesn't show**:
- Verify `initStep` and `finalStep` props
- Check if both are set to inline/none

**State button doesn't update**:
- Ensure `actionState` is a ref
- Check if action completes successfully
- Verify state is being set correctly

## Future Enhancements

- [ ] Add animation transitions between steps
- [ ] Implement undo/redo functionality
- [ ] Add keyboard navigation support
- [ ] Create reusable form field components
- [ ] Add file upload support
- [ ] Implement real-time validation
- [ ] Add accessibility improvements (ARIA labels)
- [ ] Create unit tests for all patterns
- [ ] Add i18n support for labels
- [ ] Create theme customization options

---

**Maintainer**: Demo Data Team  
**Last Updated**: October 21, 2025
