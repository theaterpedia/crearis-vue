<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getFormDefinition, validateField, type FieldDefinition } from '@/utils/fieldListUtility'

interface Props {
    formName: string
    show?: boolean
    projectDomaincode?: string
    userId?: number
    userEmail?: string
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    projectDomaincode: undefined,
    userId: undefined,
    userEmail: undefined
})

const emit = defineEmits<{
    saved: [interactionId: number]
    error: [error: string]
}>()

// Form state
const formData = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})
const isSaving = ref(false)
const saveSuccess = ref(false)

// Get form definition
const formDefinition = computed(() => getFormDefinition(props.formName))

// Initialize form with default values
watch(() => props.formName, (newFormName) => {
    const def = getFormDefinition(newFormName)
    if (def) {
        const initialData: Record<string, any> = {}
        def.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
                initialData[field.name] = field.defaultValue
            }
        })
        formData.value = initialData
        errors.value = {}
        saveSuccess.value = false
    }
}, { immediate: true })

// Pre-fill email if provided
watch(() => props.userEmail, (email) => {
    if (email && formData.value) {
        formData.value.email = email
    }
}, { immediate: true })

/**
 * Validate a single field
 */
function validateSingleField(field: FieldDefinition) {
    const error = validateField(field, formData.value[field.name], formData.value)
    if (error) {
        errors.value[field.name] = error
    } else {
        delete errors.value[field.name]
    }
}

/**
 * Validate all fields
 */
function validateForm(): boolean {
    if (!formDefinition.value) return false

    errors.value = {}
    let isValid = true

    formDefinition.value.fields.forEach(field => {
        const error = validateField(field, formData.value[field.name], formData.value)
        if (error) {
            errors.value[field.name] = error
            isValid = false
        }
    })

    return isValid
}

/**
 * Save interaction to database
 */
async function saveInteraction() {
    if (!validateForm()) {
        return
    }

    isSaving.value = true
    saveSuccess.value = false

    try {
        // Get status_id for 'new' status (value = 0) for interactions table
        let statusId = null
        try {
            const statusResponse = await fetch('/api/status?table=interactions&value=0')
            if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                if (statusData.items && statusData.items.length > 0) {
                    statusId = statusData.items[0].id
                }
            }
        } catch (error) {
            console.error('Error fetching status:', error)
        }

        // Fallback if status lookup fails
        if (!statusId) {
            throw new Error('Konnte Status nicht ermitteln')
        }

        // Prepare interaction data
        const interactionData = {
            name: props.formName,
            user_id: props.userId || null,
            project: props.projectDomaincode || null, // Send domaincode, backend will convert to project_id
            status_id: statusId,
            from_mail: formData.value.email || null,
            to_mail: 'info@theaterpedia.org', // Default recipient
            subject: `${formDefinition.value?.title} - ${formData.value.name || 'Neue Anmeldung'}`,
            fields: formData.value,
            actions: {
                send_confirmation: true,
                notify_admin: true
            }
        }

        // Save to API
        const response = await fetch('/api/interactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interactionData)
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Fehler beim Speichern')
        }

        const result = await response.json()

        saveSuccess.value = true
        emit('saved', result.id)

        // Reset form after successful save
        setTimeout(() => {
            const def = getFormDefinition(props.formName)
            if (def) {
                const initialData: Record<string, any> = {}
                def.fields.forEach(field => {
                    if (field.defaultValue !== undefined) {
                        initialData[field.name] = field.defaultValue
                    }
                })
                formData.value = initialData
            }
            saveSuccess.value = false
        }, 3000)

    } catch (error: any) {
        console.error('Error saving interaction:', error)
        emit('error', error.message)
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div v-if="show && formDefinition" class="create-interaction">
        <div class="form-header">
            <h3 class="form-title">{{ formDefinition.title }}</h3>
            <p v-if="formDefinition.description" class="form-description">
                {{ formDefinition.description }}
            </p>
        </div>

        <form @submit.prevent="saveInteraction" class="interaction-form">
            <div v-for="field in formDefinition.fields" :key="field.name" class="form-field"
                :class="{ 'has-error': errors[field.name] }">
                <label :for="field.name" class="field-label">
                    {{ field.label }}
                    <span v-if="field.required" class="required">*</span>
                </label>

                <p v-if="field.description" class="field-description">
                    {{ field.description }}
                </p>

                <!-- Text input -->
                <input v-if="field.type === 'text' || field.type === 'email'" :id="field.name"
                    v-model="formData[field.name]" :type="field.type" :placeholder="field.placeholder"
                    :required="field.required" class="field-input" @blur="validateSingleField(field)" />

                <!-- Date input -->
                <input v-else-if="field.type === 'date'" :id="field.name" v-model="formData[field.name]" type="date"
                    :required="field.required" class="field-input" @blur="validateSingleField(field)" />

                <!-- Number input -->
                <input v-else-if="field.type === 'number'" :id="field.name" v-model.number="formData[field.name]"
                    type="number" :placeholder="field.placeholder" :required="field.required" class="field-input"
                    @blur="validateSingleField(field)" />

                <!-- Select input -->
                <select v-else-if="field.type === 'select'" :id="field.name" v-model="formData[field.name]"
                    :required="field.required" class="field-select" @blur="validateSingleField(field)">
                    <option value="">Bitte wählen...</option>
                    <option v-for="choice in field.choices" :key="choice.value" :value="choice.value">
                        {{ choice.name }}
                    </option>
                </select>

                <!-- Textarea -->
                <textarea v-else-if="field.type === 'textarea'" :id="field.name" v-model="formData[field.name]"
                    :placeholder="field.placeholder" :required="field.required" class="field-textarea" rows="4"
                    @blur="validateSingleField(field)" />

                <!-- Checkbox -->
                <label v-else-if="field.type === 'checkbox'" class="field-checkbox-label">
                    <input :id="field.name" v-model="formData[field.name]" type="checkbox" class="field-checkbox" />
                    <span>{{ field.description || field.label }}</span>
                </label>

                <!-- Error message -->
                <p v-if="errors[field.name]" class="field-error">
                    {{ errors[field.name] }}
                </p>
            </div>

            <!-- Success message -->
            <div v-if="saveSuccess" class="success-message">
                ✓ Ihre Anmeldung wurde erfolgreich gespeichert!
            </div>

            <!-- Submit button -->
            <div class="form-actions">
                <button type="submit" class="btn-submit" :disabled="isSaving">
                    {{ isSaving ? 'Wird gespeichert...' : 'Anmeldung absenden' }}
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.create-interaction {
    width: 100%;
}

.form-header {
    margin-bottom: 2rem;
}

.form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text);
}

.form-description {
    color: var(--color-text-muted);
    font-size: 0.95rem;
}

.interaction-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-field.has-error .field-input,
.form-field.has-error .field-select,
.form-field.has-error .field-textarea {
    border-color: var(--color-error, #dc2626);
}

.field-label {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text);
}

.required {
    color: var(--color-error, #dc2626);
    margin-left: 0.25rem;
}

.field-description {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: -0.25rem 0 0 0;
}

.field-input,
.field-select,
.field-textarea {
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.field-textarea {
    resize: vertical;
    min-height: 100px;
}

.field-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.field-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
}

.field-error {
    color: var(--color-error, #dc2626);
    font-size: 0.875rem;
    margin: 0;
}

.success-message {
    padding: 1rem;
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
    border-radius: 0.5rem;
    font-weight: 500;
}

.form-actions {
    margin-top: 1rem;
}

.btn-submit {
    padding: 0.875rem 2rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
    background: var(--color-primary-dark, #2563eb);
}

.btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
