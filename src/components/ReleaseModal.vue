<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>{{ release ? 'Release bearbeiten' : 'Neues Release' }}</h2>
                        <button class="close-btn" @click="$emit('close')">&times;</button>
                    </div>

                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <!-- Version -->
                            <div class="form-group">
                                <label for="version">
                                    Version *
                                    <span class="help-text">(Format: major.minor, z.B. 1.0, 2.5)</span>
                                </label>
                                <input id="version" v-model="formData.version" type="text" required
                                    placeholder="z.B. 1.0" pattern="^\d+\.\d+$"
                                    title="Bitte Format major.minor verwenden (z.B. 1.0)" />
                            </div>

                            <!-- Description -->
                            <div class="form-group">
                                <label for="description">Beschreibung</label>
                                <textarea id="description" v-model="formData.description" rows="4"
                                    placeholder="Beschreibung des Releases..."></textarea>
                            </div>

                            <!-- State -->
                            <div class="form-group">
                                <label for="state">Status</label>
                                <select id="state" v-model="formData.state">
                                    <option value="idea">Idee</option>
                                    <option value="draft">Entwurf</option>
                                    <option value="final">Final</option>
                                    <option value="trash">Papierkorb</option>
                                </select>
                            </div>

                            <!-- Release Date -->
                            <div class="form-group">
                                <label for="release_date">Release-Datum</label>
                                <input id="release_date" v-model="formData.release_date" type="date" />
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-secondary" @click="$emit('close')">
                                    Abbrechen
                                </button>
                                <button type="submit" class="btn-primary">
                                    Speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Release {
    id: string
    version: string
    description?: string
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
}

const props = defineProps<{
    isOpen: boolean
    release?: Release | null
}>()

const emit = defineEmits<{
    close: []
    save: [data: Partial<Release>]
}>()

const formData = ref({
    version: '',
    description: '',
    state: 'idea' as 'idea' | 'draft' | 'final' | 'trash',
    release_date: ''
})

// Watch for release changes to populate form
watch(() => props.release, (newRelease) => {
    if (newRelease) {
        formData.value = {
            version: newRelease.version,
            description: newRelease.description || '',
            state: newRelease.state,
            release_date: newRelease.release_date ? formatDateForInput(newRelease.release_date) : ''
        }
    } else {
        // Reset form for create mode
        formData.value = {
            version: '',
            description: '',
            state: 'idea',
            release_date: ''
        }
    }
}, { immediate: true })

function formatDateForInput(dateStr: string): string {
    try {
        const date = new Date(dateStr)
        return date.toISOString().split('T')[0]
    } catch {
        return ''
    }
}

function handleSubmit() {
    const data: Partial<Release> = {
        version: formData.value.version.trim(),
        description: formData.value.description.trim() || undefined,
        state: formData.value.state,
        release_date: formData.value.release_date || undefined
    }
    emit('save', data)
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
}

.modal-container {
    background: var(--color-surface);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: var(--color-background);
    color: var(--color-text);
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--color-text);
}

.help-text {
    font-weight: 400;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-left: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-background);
    color: var(--color-text);
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--color-accent-contrast);
}

.form-group textarea {
    resize: vertical;
    min-height: 100px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-accent-bg);
    color: white;
}

.btn-primary:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
    background: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    background: var(--color-surface);
    border-color: var(--color-accent-contrast);
}

/* Modal transition */
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
    transform: scale(0.9);
}
</style>
