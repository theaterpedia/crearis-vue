<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Hero bearbeiten</h2>
          <button class="modal-close" @click="close" aria-label="Schließen">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label for="cimg">Bild URL</label>
            <input id="cimg" v-model="formData.cimg" type="url" class="form-input" placeholder="https://..." required />
          </div>

          <div class="form-group">
            <label for="heading">Überschrift</label>
            <input id="heading" v-model="formData.heading" type="text" class="form-input"
              placeholder="Titel eingeben..." required />
          </div>

          <div class="form-group">
            <label for="description">Beschreibung</label>
            <textarea id="description" v-model="formData.description" class="form-textarea"
              placeholder="Beschreibung eingeben..." rows="4" required></textarea>
          </div>

          <!-- Task Management Section -->
          <div class="form-group">
            <div class="tasks-header">
              <label>Zugehörige Aufgaben</label>
              <button type="button" class="btn-add-task" @click="openTaskModal" title="Neue Aufgabe erstellen">
                + Aufgabe
              </button>
            </div>

            <div v-if="loadingTasks" class="tasks-loading">
              Lade Aufgaben...
            </div>

            <div v-else-if="associatedTasks.length === 0" class="tasks-empty">
              Keine Aufgaben vorhanden. Erstelle eine neue Aufgabe, um loszulegen.
            </div>

            <div v-else class="tasks-list">
              <div v-for="task in associatedTasks" :key="task.id" class="task-item"
                :class="{ 'task-done': task.status === 'done' }">
                <input type="checkbox" :checked="task.status === 'done'" @change="toggleTaskStatus(task)"
                  class="task-checkbox" />
                <div class="task-content">
                  <span class="task-title">{{ task.title }}</span>
                  <span v-if="task.description" class="task-description">
                    {{ task.description }}
                  </span>
                </div>
                <span class="task-priority" :class="`priority-${task.priority}`" :title="`Priorität: ${task.priority}`">
                  {{ getPriorityEmoji(task.priority) }}
                </span>
                <button type="button" class="task-edit-btn" @click="editTask(task)" title="Aufgabe bearbeiten">
                  ✏️
                </button>
              </div>
            </div>
          </div>

          <div v-if="!isEvent" class="form-group">
            <label>Verknüpfte Events</label>
            <div class="event-select">
              <div v-for="event in availableEvents" :key="event.id" class="event-option"
                :class="{ selected: selectedEvents.includes(event.id) }" @click="toggleEvent(event.id)">
                <input type="checkbox" :checked="selectedEvents.includes(event.id)" @change="toggleEvent(event.id)" />
                <img v-if="event.cimg" :src="event.cimg" :alt="event.name" class="event-thumb" />
                <span>{{ event.name }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="close">
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Speichern...' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface HeroData {
  id: string
  cimg: string
  heading: string
  description: string
  eventIds?: string[]
}

interface Event {
  id: string
  name: string
  cimg: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  record_type?: string
  record_id?: string
  due_date?: string
  created_at?: string
  updated_at?: string
}

const props = defineProps<{
  isOpen: boolean
  heroData: HeroData | null
  availableEvents: Event[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: HeroData]
}>()

const formData = ref({
  cimg: '',
  heading: '',
  description: ''
})

const selectedEvents = ref<string[]>([])
const saving = ref(false)
const associatedTasks = ref<Task[]>([])
const loadingTasks = ref(false)
const editingTask = ref<Task | null>(null)

const isEvent = computed(() => {
  return props.heroData?.id?.startsWith('_demo.event_') || false
})

watch(() => props.heroData, async (data) => {
  if (data) {
    formData.value = {
      cimg: data.cimg || '',
      heading: data.heading || '',
      description: data.description || ''
    }
    selectedEvents.value = data.eventIds || []

    // Load associated tasks
    await loadTasks(data.id)
  }
}, { immediate: true })

// Task Management Functions
async function loadTasks(recordId: string) {
  loadingTasks.value = true
  try {
    const response = await fetch(`/api/tasks?record_type=event&record_id=${recordId}`)
    const data = await response.json()
    associatedTasks.value = data.tasks || []
  } catch (error) {
    console.error('Failed to load tasks:', error)
    associatedTasks.value = []
  } finally {
    loadingTasks.value = false
  }
}

async function toggleTaskStatus(task: Task) {
  const newStatus = task.status === 'done' ? 'todo' : 'done'

  try {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (response.ok) {
      // Update local task
      const index = associatedTasks.value.findIndex(t => t.id === task.id)
      if (index > -1) {
        associatedTasks.value[index].status = newStatus
      }
    }
  } catch (error) {
    console.error('Failed to update task status:', error)
  }
}

function getPriorityEmoji(priority: string): string {
  const emojis: Record<string, string> = {
    urgent: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }
  return emojis[priority] || '⚪'
}

function openTaskModal() {
  editingTask.value = null
  // This will be handled by the TaskEditModal integration
  // For now, we'll use a simple approach
  const title = prompt('Aufgabentitel:')
  if (!title) return

  const description = prompt('Beschreibung (optional):')
  const priority = prompt('Priorität (low/medium/high/urgent):', 'medium') as Task['priority']

  createTask({
    title,
    description: description || undefined,
    priority: priority || 'medium',
    record_type: 'event',
    record_id: props.heroData?.id
  })
}

function editTask(task: Task) {
  editingTask.value = task
  const title = prompt('Aufgabentitel:', task.title)
  if (!title) return

  const description = prompt('Beschreibung:', task.description || '')
  const priority = prompt('Priorität (low/medium/high/urgent):', task.priority) as Task['priority']

  updateTask(task.id, {
    title,
    description: description || undefined,
    priority: priority || task.priority
  })
}

async function createTask(taskData: Partial<Task>) {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })

    if (response.ok && props.heroData) {
      await loadTasks(props.heroData.id)
    }
  } catch (error) {
    console.error('Failed to create task:', error)
  }
}

async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (response.ok && props.heroData) {
      await loadTasks(props.heroData.id)
    }
  } catch (error) {
    console.error('Failed to update task:', error)
  }
}

const toggleEvent = (eventId: string) => {
  const index = selectedEvents.value.indexOf(eventId)
  if (index > -1) {
    selectedEvents.value.splice(index, 1)
  } else {
    selectedEvents.value.push(eventId)
  }
}

const handleSubmit = async () => {
  if (!props.heroData) return

  saving.value = true
  try {
    await emit('save', {
      id: props.heroData.id,
      cimg: formData.value.cimg,
      heading: formData.value.heading,
      description: formData.value.description,
      eventIds: isEvent.value ? undefined : selectedEvents.value
    })
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: oklch(0% 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-card-bg);
  border-radius: var(--radius-button);
  box-shadow: 0 25px 50px -12px oklch(0% 0 0 / 0.25);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: var(--border) solid var(--color-border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-contrast);
  margin: 0;
}

.modal-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--color-dimmed);
  cursor: pointer;
  border-radius: var(--radius-button);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-muted-bg);
  color: var(--color-contrast);
}

.modal-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-contrast);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-bg);
  color: var(--color-contrast);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary-base);
  box-shadow: 0 0 0 3px oklch(72.21% 0.2812 144.53 / 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.event-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-bg);
}

.event-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-option:hover {
  background: var(--color-muted-bg);
}

.event-option.selected {
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
}

.event-option input[type="checkbox"] {
  cursor: pointer;
}

.event-thumb {
  width: 3rem;
  height: 2rem;
  object-fit: cover;
  border-radius: 0.25rem;
}

/* Task Management Styles */
.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.tasks-header label {
  margin-bottom: 0;
}

.btn-add-task {
  padding: 0.5rem 1rem;
  border: var(--border) solid var(--color-border);
  background: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  border-radius: var(--radius-button);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-task:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.tasks-loading,
.tasks-empty {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-dimmed);
  font-size: 0.875rem;
  border: var(--border) dashed var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-bg);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  padding: 0.5rem;
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-bg);
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-card-bg);
  transition: all 0.2s ease;
}

.task-item:hover {
  border-color: var(--color-primary-base);
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
}

.task-item.task-done {
  opacity: 0.6;
}

.task-item.task-done .task-title {
  text-decoration: line-through;
  color: var(--color-dimmed);
}

.task-checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: var(--color-primary-base);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.task-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-contrast);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-description {
  font-size: 0.75rem;
  color: var(--color-dimmed);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-priority {
  flex-shrink: 0;
  font-size: 1.25rem;
  line-height: 1;
}

.priority-urgent {
  filter: drop-shadow(0 0 4px oklch(60% 0.25 25 / 0.3));
}

.priority-high {
  filter: drop-shadow(0 0 4px oklch(70% 0.2 60 / 0.3));
}

.priority-medium {
  filter: drop-shadow(0 0 4px oklch(80% 0.15 90 / 0.3));
}

.priority-low {
  filter: drop-shadow(0 0 4px oklch(70% 0.2 140 / 0.3));
}

.task-edit-btn {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--border) solid var(--color-border);
  background: var(--color-bg);
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.task-edit-btn:hover {
  opacity: 1;
  background: var(--color-muted-bg);
  border-color: var(--color-primary-base);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: var(--border) solid var(--color-border);
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-button);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: var(--border-button) solid var(--color-border);
}

.btn-secondary {
  background: var(--color-bg);
  color: var(--color-contrast);
}

.btn-secondary:hover {
  background: var(--color-muted-bg);
}

.btn-primary {
  background: var(--color-primary-base);
  color: var(--color-primary-contrast);
  border-color: var(--color-primary-base);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
