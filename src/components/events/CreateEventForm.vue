<template>
    <form class="event-form" @submit.prevent="handleSubmit">
        <h3 class="form-title">Neues Event erstellen</h3>

        <!-- Event Name -->
        <div class="form-group">
            <label for="event-name" class="form-label required">Name</label>
            <input id="event-name" v-model="formData.name" type="text" class="form-input"
                placeholder="Event-Name eingeben..." required />
        </div>

        <!-- Teasertext -->
        <div class="form-group">
            <label for="event-teaser" class="form-label">Teasertext</label>
            <textarea id="event-teaser" v-model="formData.teasertext" class="form-textarea" rows="2"
                placeholder="Kurze Beschreibung für Übersichten..." />
        </div>

        <!-- Date Fields -->
        <div class="form-row">
            <div class="form-group">
                <label for="event-date-begin" class="form-label required">Start</label>
                <input id="event-date-begin" v-model="formData.date_begin" type="datetime-local" class="form-input"
                    required />
            </div>
            <div class="form-group">
                <label for="event-date-end" class="form-label required">Ende</label>
                <input id="event-date-end" v-model="formData.date_end" type="datetime-local" class="form-input"
                    :min="formData.date_begin" required />
            </div>
        </div>

        <!-- Seats -->
        <div class="form-group">
            <label for="event-seats" class="form-label">Max. Teilnehmer</label>
            <input id="event-seats" v-model.number="formData.seats_max" type="number" class="form-input" min="0"
                placeholder="0 = unbegrenzt" />
        </div>

        <!-- Description -->
        <div class="form-group">
            <label for="event-description" class="form-label">Beschreibung</label>
            <textarea id="event-description" v-model="formData.description" class="form-textarea" rows="4"
                placeholder="Ausführliche Beschreibung..." />
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
                Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isValid || isSubmitting">
                <span v-if="isSubmitting">Wird erstellt...</span>
                <span v-else>Event erstellen</span>
            </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="form-error">
            {{ error }}
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface EventFormData {
    name: string
    teasertext: string
    description: string
    date_begin: string
    date_end: string
    seats_max: number
}

const emit = defineEmits<{
    cancel: []
    created: [event: any]
}>()

const formData = ref<EventFormData>({
    name: '',
    teasertext: '',
    description: '',
    date_begin: '',
    date_end: '',
    seats_max: 0,
})

const isSubmitting = ref(false)
const error = ref('')

const isValid = computed(() => {
    const { name, date_begin, date_end } = formData.value

    if (!name.trim()) return false
    if (!date_begin) return false
    if (!date_end) return false
    if (new Date(date_end) < new Date(date_begin)) return false

    return true
})

async function handleSubmit() {
    if (!isValid.value || isSubmitting.value) return

    isSubmitting.value = true
    error.value = ''

    try {
        const payload: Record<string, any> = {
            name: formData.value.name.trim(),
            date_begin: formData.value.date_begin,
            date_end: formData.value.date_end,
        }

        if (formData.value.teasertext.trim()) {
            payload.teasertext = formData.value.teasertext.trim()
        }

        if (formData.value.description.trim()) {
            payload.description = formData.value.description.trim()
        }

        if (formData.value.seats_max > 0) {
            payload.seats_max = formData.value.seats_max
        }

        const response = await fetch('/api/odoo/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.message || `HTTP ${response.status}`)
        }

        const created = await response.json()
        emit('created', created)

        // Reset form
        formData.value = {
            name: '',
            teasertext: '',
            description: '',
            date_begin: '',
            date_end: '',
            seats_max: 0,
        }
    } catch (err: any) {
        error.value = err.message || 'Fehler beim Erstellen des Events'
        console.error('Create event error:', err)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.event-form {
    background: var(--color-card-bg, #fff);
    border-radius: var(--radius-button, 8px);
    padding: 1.5rem;
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
}

.form-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #1a1a1a);
}

.form-group {
    margin-bottom: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-label {
    display: block;
    margin-bottom: 0.375rem;
    font-weight: 500;
    color: var(--color-text-secondary, #4a5568);
}

.form-label.required::after {
    content: ' *';
    color: var(--color-negative-base, #dc3545);
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-button, 6px);
    font-size: 0.9375rem;
    background: var(--color-input-bg, #fff);
    color: var(--color-text-primary, #1a1a1a);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px oklch(60% 0.2 250 / 0.15);
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
}

.btn {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-button, 6px);
    font-weight: 500;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-primary {
    background: var(--color-primary, #3b82f6);
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    background: oklch(55% 0.2 250);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: var(--color-card-bg, #fff);
    color: var(--color-text-secondary, #4a5568);
    border: 1px solid var(--color-border, #e2e8f0);
}

.btn-secondary:hover {
    background: oklch(97% 0 0);
}

/* Error */
.form-error {
    margin-top: 1rem;
    padding: 0.75rem;
    background: oklch(95% 0.05 25);
    border: 1px solid oklch(60% 0.2 25);
    border-radius: var(--radius-button, 6px);
    color: var(--color-negative-base, #dc3545);
    font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 640px) {
    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
    }

    .btn {
        width: 100%;
        text-align: center;
    }
}
</style>
