<script setup lang="ts">
/**
 * AdminActionProjects - Panel for project actions (create/alter/show)
 */
import { ref, computed, watch, onMounted } from 'vue'

export interface ProjectField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select'
  required?: boolean
  options?: { value: string; label: string }[]
}

export interface AdminActionProjectsPanelProps {
  action?: 'create' | 'alter' | 'show'
  fields?: 'default' | 'all' | string[]
  projectId?: string | null
  ownerId?: string | null
}

const props = withDefaults(defineProps<AdminActionProjectsPanelProps>(), {
  action: 'show',
  fields: 'default',
  projectId: null,
  ownerId: null
})

const emit = defineEmits<{
  'submit': [data: Record<string, any>]
  'cancel': []
}>()

const formData = ref<Record<string, any>>({
  id: '',
  username: '',
  name: '',
  description: '',
  status: 'active',
  owner_id: props.ownerId || null,
  is_company: false
})

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

const allProjectFields: ProjectField[] = [
  { name: 'id', label: 'Project ID', type: 'text', required: true },
  { name: 'username', label: 'Username', type: 'text', required: true },
  { name: 'name', label: 'Project Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { 
    name: 'status', 
    label: 'Status', 
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'archived', label: 'Archived' }
    ]
  },
  { name: 'owner_id', label: 'Owner (Email)', type: 'text' }
]

const defaultProjectFields = ['name', 'description', 'owner_id']

const activeFields = computed<ProjectField[]>(() => {
  if (Array.isArray(props.fields)) {
    return allProjectFields.filter(f => props.fields.includes(f.name))
  } else if (props.fields === 'all') {
    return allProjectFields
  } else {
    return allProjectFields.filter(f => defaultProjectFields.includes(f.name))
  }
})

const isReadonly = computed(() => props.action === 'show')

onMounted(async () => {
  if (props.projectId && (props.action === 'alter' || props.action === 'show')) {
    await loadProject()
  }
  if (props.ownerId) {
    formData.value.owner_id = props.ownerId
  }
})

watch(() => props.projectId, async (newId) => {
  if (newId && (props.action === 'alter' || props.action === 'show')) {
    await loadProject()
  }
})

watch(() => props.ownerId, (newOwnerId) => {
  if (newOwnerId) {
    formData.value.owner_id = newOwnerId
  }
})

async function loadProject() {
  if (!props.projectId) return
  
  isLoading.value = true
  try {
    const response = await fetch(`/api/projects/${props.projectId}`)
    if (response.ok) {
      const project = await response.json()
      formData.value = { ...project }
    }
  } catch (error) {
    console.error('Failed to load project:', error)
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
  <div class="admin-action-projects-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <span v-if="action === 'create'">Create Project</span>
        <span v-else-if="action === 'alter'">Edit Project</span>
        <span v-else>View Project</span>
      </h2>
    </div>

    <div v-if="isLoading" class="panel-loading">
      Loading project data...
    </div>

    <form v-else class="panel-form" @submit.prevent="handleSubmit">
      <div
        v-for="field in activeFields"
        :key="field.name"
        class="form-field"
      >
        <label :for="field.name" class="field-label">
          {{ field.label }}
          <span v-if="field.required" class="field-required">*</span>
        </label>

        <div class="field-input-wrapper">
          <input
            v-if="field.type === 'text'"
            :id="field.name"
            v-model="formData[field.name]"
            type="text"
            :readonly="isReadonly"
            :required="field.required"
            class="field-input"
            :class="{ 'field-error': errors[field.name] }"
          />

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

          <span v-if="errors[field.name]" class="field-error-message">
            {{ errors[field.name] }}
          </span>
        </div>
      </div>

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
          {{ action === 'create' ? 'Create Project' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Reuse same styles as UserPanel */
.admin-action-projects-panel {
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
