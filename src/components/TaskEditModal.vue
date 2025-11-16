<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-container" @click.stop>
                    <div class="modal-header">
                        <h2 class="modal-title">
                            {{ task ? 'Edit Task' : 'Create New Task' }}
                        </h2>
                        <button class="close-btn" @click="$emit('close')" title="Close">
                            ×
                        </button>
                    </div>

                    <form class="modal-body" @submit.prevent="handleSubmit">
                        <!-- Name (renamed from Title) -->
                        <div class="form-group">
                            <label for="task-title" class="form-label required">
                                Title
                            </label>
                            <input id="task-title" v-model="formData.name" type="text" class="form-input"
                                placeholder="Enter task title..." required />
                        </div>

                        <!-- Description -->
                        <div class="form-group">
                            <label for="task-description" class="form-label">
                                Description
                            </label>
                            <textarea id="task-description" v-model="formData.description" class="form-textarea"
                                rows="4" placeholder="Enter task description..." />
                        </div>

                        <!-- Status Toggler -->
                        <div v-if="task" class="form-group">
                            <label class="form-label">Status</label>
                            <StatusToggler v-model="formData.status"
                                :allowed-statuses="['idea', 'new', 'draft', 'active', 'final', 'reopen', 'trash']" />
                        </div>

                        <!-- Category & Priority Row -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="task-category" class="form-label">
                                    Category
                                </label>
                                <select id="task-category" v-model="formData.category" class="form-select">
                                    <option value="admin">Admin</option>
                                    <option value="base">Base</option>
                                    <option value="project">Project</option>
                                    <option value="release">Release</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="task-priority" class="form-label">
                                    Priority
                                </label>
                                <select id="task-priority" v-model="formData.priority" class="form-select">
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🟠 High</option>
                                    <option value="urgent">🔴 Urgent</option>
                                </select>
                            </div>
                        </div>

                        <!-- Release & Record Type Row -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="task-release" class="form-label">
                                    Release
                                </label>
                                <select id="task-release" v-model="formData.release_id" class="form-select">
                                    <option value="">None</option>
                                    <option v-for="release in releases" :key="release.id" :value="release.id">
                                        {{ release.version }} {{ release.name ? `- ${release.name}` : '' }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="task-record-type" class="form-label">
                                    Record Type
                                </label>
                                <select id="task-record-type" v-model="formData.record_type" class="form-select">
                                    <option value="">None</option>
                                    <option value="event">Event</option>
                                    <option value="post">Post</option>
                                    <option value="location">Location</option>
                                    <option value="instructor">Instructor</option>
                                    <option value="participant">Participant</option>
                                </select>
                            </div>
                        </div>

                        <!-- Record ID & Image Row -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="task-record-id" class="form-label">
                                    Record ID
                                </label>
                                <input id="task-record-id" v-model="formData.record_id" type="text" class="form-input"
                                    placeholder="Enter record ID..." :disabled="!formData.record_type" />
                            </div>

                            <div class="form-group">
                                <label for="task-image" class="form-label">
                                    Image URL
                                </label>
                                <input id="task-image" v-model="formData.cimg" type="text" class="form-input"
                                    placeholder="Enter image URL..." />
                            </div>
                        </div>

                        <!-- Prompt -->
                        <div class="form-group">
                            <label for="task-prompt" class="form-label">
                                AI Prompt
                            </label>
                            <textarea id="task-prompt" v-model="formData.prompt" class="form-textarea" rows="3"
                                placeholder="Enter AI generation prompt..." />
                        </div>

                        <!-- Assigned To & Due Date Row -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="task-assigned" class="form-label">
                                    Assigned To
                                </label>
                                <input id="task-assigned" v-model="formData.assigned_to" type="text" class="form-input"
                                    placeholder="Enter assignee..." />
                            </div>

                            <div class="form-group">
                                <label for="task-due-date" class="form-label">
                                    Due Date
                                </label>
                                <input id="task-due-date" v-model="formData.due_date" type="date" class="form-input" />
                            </div>
                        </div>

                        <!-- Form Actions -->
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="$emit('close')">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="!formData.name">
                                {{ task ? 'Update Task' : 'Create Task' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import StatusToggler from './StatusToggler.vue'
import CategoryBadge from './CategoryBadge.vue'

interface Task {
    id?: string
    name: string  // Renamed from title
    description?: string
    status?: string  // Status name (new, idea, draft, active, final, reopen, trash)
    status_name?: string  // Status name from API response
    category?: 'admin' | 'base' | 'project' | 'release'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    record_type?: string
    record_id?: string
    assigned_to?: string
    due_date?: string
    release_id?: string
    cimg?: string  // Renamed from image
    prompt?: string
}

interface Release {
    id: string
    version: string
    name?: string
}

const props = defineProps<{
    isOpen: boolean
    task?: Task | null
    releases?: Release[]
}>()

const emit = defineEmits<{
    close: []
    save: [task: Partial<Task>]
}>()

const formData = ref<Task>({
    name: '',  // Renamed from title
    description: '',
    priority: 'medium',
    status: 'idea',  // Default to idea (not new)
    category: 'base',
    record_type: '',
    record_id: '',
    assigned_to: '',
    due_date: '',
    release_id: '',
    cimg: '',  // Renamed from image
    prompt: ''
})

// Watch for task changes to populate form
watch(() => props.task, (newTask: Task | null | undefined) => {
    if (newTask) {
        formData.value = {
            name: newTask.name || '',  // Renamed from title
            description: newTask.description || '',
            priority: newTask.priority || 'medium',
            status: newTask.status_name || newTask.status || 'idea',  // Use status_name from API
            category: newTask.category || 'base',
            record_type: newTask.record_type || '',
            record_id: newTask.record_id || '',
            assigned_to: newTask.assigned_to || '',
            due_date: newTask.due_date ? formatDateForInput(newTask.due_date) : '',
            release_id: newTask.release_id || '',
            cimg: newTask.cimg || '',  // Renamed from image
            prompt: newTask.prompt || ''
        }
    } else {
        // Reset form for new task
        formData.value = {
            name: '',  // Renamed from title
            description: '',
            priority: 'medium',
            status: 'idea',  // Default to idea (not new)
            category: 'base',
            record_type: '',
            record_id: '',
            assigned_to: '',
            due_date: '',
            release_id: '',
            cimg: '',  // Renamed from image
            prompt: ''
        }
    }
}, { immediate: true })

function formatDateForInput(dateString: string): string {
    try {
        const date = new Date(dateString)
        const result = date.toISOString().split('T')[0]
        return result || ''
    } catch {
        return ''
    }
}

function handleOverlayClick() {
    emit('close')
}

function handleSubmit() {
    // Clean up empty strings to null
    const taskData: Partial<Task> = {
        name: formData.value.name,  // Renamed from title
        description: formData.value.description || undefined,
        priority: formData.value.priority,
        status: formData.value.status,
        category: formData.value.category,
        record_type: formData.value.record_type || undefined,
        record_id: formData.value.record_id || undefined,
        assigned_to: formData.value.assigned_to || undefined,
        due_date: formData.value.due_date || undefined,
        release_id: formData.value.release_id || undefined,
        cimg: formData.value.cimg || undefined,  // Renamed from image
        prompt: formData.value.prompt || undefined
    }

    emit('save', taskData)
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0% 0 0 / 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    overflow-y: auto;
}

/* Modal Container */
.modal-container {
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    box-shadow: 0 20px 60px oklch(0% 0 0 / 0.3);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
}

/* Modal Header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0;
}

.close-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--color-contrast);
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-negative-base);
    color: var(--color-negative-base);
}

/* Modal Body */
.modal-body {
    padding: 1.5rem;
}

/* Form Elements */
.form-group {
    margin-bottom: 1.5rem;
    flex: 1;
    min-width: 200px;
}

.form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin-bottom: 0.5rem;
}

.form-label.required::after {
    content: ' *';
    color: var(--color-negative-base);
}

.form-input,
.form-textarea,
.form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-bg);
    color: var(--color-contrast);
    font-family: var(--font);
    font-size: 1rem;
    transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 3px var(--color-ring);
}

.form-input:disabled {
    background: var(--color-muted-bg);
    cursor: not-allowed;
    opacity: 0.6;
}

.form-textarea {
    resize: vertical;
    min-height: 100px;
}

.form-select {
    cursor: pointer;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.btn-primary:hover:not(:disabled) {
    background: oklch(from var(--color-primary-bg) calc(l * 0.9) c h);
}

.btn-secondary {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    background: var(--color-bg);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
    transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(0.9) translateY(-20px);
}
</style>
