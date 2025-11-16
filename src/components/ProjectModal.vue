<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-container" @click.stop>
                    <div class="modal-header">
                        <h2 class="modal-title">
                            {{ project ? 'Projekt bearbeiten' : 'Neues Projekt' }}
                        </h2>
                        <button class="close-btn" @click="$emit('close')" title="Schließen">
                            ×
                        </button>
                    </div>

                    <form class="modal-body" @submit.prevent="handleSubmit">
                        <!-- Name -->
                        <div class="form-group">
                            <label for="project-name" class="form-label required">
                                Name
                            </label>
                            <input id="project-name" v-model="formData.name" type="text" class="form-input"
                                placeholder="Projekt-Name eingeben..." required />
                        </div>

                        <!-- Description -->
                        <div class="form-group">
                            <label for="project-description" class="form-label">
                                Beschreibung
                            </label>
                            <textarea id="project-description" v-model="formData.description" class="form-textarea"
                                rows="4" placeholder="Projekt-Beschreibung eingeben..." />
                        </div>

                        <!-- Status -->
                        <div class="form-group">
                            <label for="project-status" class="form-label">
                                Status
                            </label>
                            <select id="project-status" v-model="formData.status" class="form-select">
                                <option value="draft">Entwurf</option>
                                <option value="active">Aktiv</option>
                                <option value="archived">Archiviert</option>
                            </select>
                        </div>

                        <!-- Form Actions -->
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" @click="$emit('close')">
                                Abbrechen
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="!formData.name">
                                {{ project ? 'Speichern' : 'Erstellen' }}
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

interface Project {
    id?: string
    name: string
    description?: string
    status: 'draft' | 'active' | 'archived'
}

const props = defineProps<{
    isOpen: boolean
    project?: Project | null
}>()

const emit = defineEmits<{
    close: []
    save: [project: Partial<Project>]
}>()

const formData = ref<Project>({
    name: '',
    description: '',
    status: 'draft'
})

// Watch for project changes to populate form
watch(() => props.project, (newProject) => {
    if (newProject) {
        formData.value = {
            name: newProject.name || '',
            description: newProject.description || '',
            status: newProject.status || 'draft'
        }
    } else {
        // Reset form for new project
        formData.value = {
            name: '',
            description: '',
            status: 'draft'
        }
    }
}, { immediate: true })

function handleOverlayClick() {
    emit('close')
}

function handleSubmit() {
    const projectData: Partial<Project> = {
        name: formData.value.name,
        description: formData.value.description || undefined,
        status: formData.value.status
    }

    emit('save', projectData)
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
