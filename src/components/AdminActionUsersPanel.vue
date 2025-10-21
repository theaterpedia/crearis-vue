<script setup lang="ts">
/**
 * AdminActionUsers - Panel for user actions (create/alter/show)
 * 
 * Handles form rendering for user table fields
 */
import { ref, computed, watch, onMounted } from 'vue'

export interface UserField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
}

export interface AdminActionUsersPanelProps {
  action?: 'create' | 'alter' | 'show'
  fields?: 'default' | 'all' | string[]
  userId?: string | null
}

const props = withDefaults(defineProps<AdminActionUsersPanelProps>(), {
  action: 'show',
  fields: 'default',
  userId: null
})

const emit = defineEmits<{
  'submit': [data: Record<string, any>]
  'cancel': []
}>()

// Form data
const formData = ref<Record<string, any>>({
  id: '',
  username: '',
  password: '',
  role: 'user',
  instructor_id: null
})

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

// Field definitions for users table
const allUserFields: UserField[] = [
  { name: 'id', label: 'Email (ID)', type: 'email', required: true },
  { name: 'username', label: 'Username', type: 'text', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true },
  { 
    name: 'role', 
    label: 'Role', 
    type: 'select', 
    required: true,
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'base', label: 'Base' }
    ]
  },
  { name: 'instructor_id', label: 'Instructor ID', type: 'text' }
]

const defaultUserFields = ['id', 'username', 'role']

// Computed fields based on props
const activeFields = computed<UserField[]>(() => {
  if (Array.isArray(props.fields)) {
    return allUserFields.filter(f => props.fields.includes(f.name))
  } else if (props.fields === 'all') {
    return allUserFields
  } else {
    // default
    return allUserFields.filter(f => defaultUserFields.includes(f.name))
  }
})

const isReadonly = computed(() => props.action === 'show')
const showPasswordField = computed(() => props.action === 'create')

// Load user data if userId provided and action is alter/show
onMounted(async () => {
  if (props.userId && (props.action === 'alter' || props.action === 'show')) {
    await loadUser()
  }
})

watch(() => props.userId, async (newId) => {
  if (newId && (props.action === 'alter' || props.action === 'show')) {
    await loadUser()
  }
})

async function loadUser() {
  if (!props.userId) return
  
  isLoading.value = true
  try {
    const response = await fetch(`/api/users/${props.userId}`)
    if (response.ok) {
      const user = await response.json()
      formData.value = {
        id: user.id,
        username: user.username,
        password: '', // Never populate password
        role: user.role,
        instructor_id: user.instructor_id
      }
    }
  } catch (error) {
    console.error('Failed to load user:', error)
  } finally {
    isLoading.value = false
  }
}

function validate(): boolean {
  errors.value = {}
  
  for (const field of activeFields.value) {
    if (field.required && !formData.value[field.name]) {
      errors.value[field.name] = `${field.label} is required`
    }
    
    // Email validation for id field
    if (field.name === 'id' && formData.value[field.name]) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.value[field.name])) {
        errors.value[field.name] = 'Must be a valid email address'
      }
    }
  }
  
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (isReadonly.value) return
  
  if (validate()) {
    emit('submit', { ...formData.value })
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="admin-action-users-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <span v-if="action === 'create'">Create User</span>
        <span v-else-if="action === 'alter'">Edit User</span>
        <span v-else>View User</span>
      </h2>
      <p v-if="action === 'create'" class="panel-description">
        Enter user details below. User ID must be a valid email address.
      </p>
    </div>

    <div v-if="isLoading" class="panel-loading">
      Loading user data...
    </div>

    <form v-else class="panel-form" @submit.prevent="handleSubmit">
      <!-- Dynamic field rendering -->
      <div
        v-for="field in activeFields"
        :key="field.name"
        class="form-field"
      >
        <!-- Skip password field if not creating -->
        <template v-if="field.name !== 'password' || showPasswordField">
          <label :for="field.name" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="field-required">*</span>
          </label>

          <div class="field-input-wrapper">
            <!-- Text/Email/Password Input -->
            <input
              v-if="['text', 'email', 'password'].includes(field.type)"
              :id="field.name"
              v-model="formData[field.name]"
              :type="field.type"
              :readonly="isReadonly"
              :required="field.required"
              class="field-input"
              :class="{ 'field-error': errors[field.name] }"
            />

            <!-- Select Input -->
            <select
              v-else-if="field.type === 'select'"
              :id="field.name"
              v-model="formData[field.name]"
              :disabled="isReadonly"
              :required="field.required"
              class="field-input"
              :class="{ 'field-error': errors[field.name] }"
            >
              <option
                v-for="option in field.options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <!-- Textarea -->
            <textarea
              v-else-if="field.type === 'textarea'"
              :id="field.name"
              v-model="formData[field.name]"
              :readonly="isReadonly"
              :required="field.required"
              rows="3"
              class="field-input field-textarea"
              :class="{ 'field-error': errors[field.name] }"
            />

            <!-- Error Message -->
            <span v-if="errors[field.name]" class="field-error-message">
              {{ errors[field.name] }}
            </span>
          </div>
        </template>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleCancel"
        >
          {{ isReadonly ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="!isReadonly"
          type="submit"
          class="btn btn-primary"
        >
          {{ action === 'create' ? 'Create User' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.admin-action-users-panel {
  width: 100%;
}

.panel-header {
  margin-bottom: 2rem;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.panel-description {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.875rem;
}

.panel-loading {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.panel-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  gap: 1rem;
}

.field-label {
  flex: 0 0 180px;
  padding-top: 0.5rem;
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.875rem;
}

.field-required {
  color: var(--color-danger, #ef4444);
}

.field-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 59, 130, 246), 0.1);
}

.field-input:read-only,
.field-input:disabled {
  background: var(--color-background-soft);
  cursor: not-allowed;
}

.field-input.field-error {
  border-color: var(--color-danger, #ef4444);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
}

.field-error-message {
  font-size: 0.75rem;
  color: var(--color-danger, #ef4444);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-mute);
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .form-field {
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    flex: initial;
    padding-top: 0;
  }
}
</style>
