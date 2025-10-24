<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content">
            <div class="modal-header">
                <h3>{{ translation ? 'Edit Translation' : 'Create Translation' }}</h3>
                <button @click="$emit('close')" class="close-btn">✕</button>
            </div>

            <form @submit.prevent="save" class="modal-body">
                <!-- Name -->
                <div class="form-group">
                    <label>Name (Key) <span class="required">*</span></label>
                    <input v-model="form.name" type="text" required placeholder="e.g., save, cancel, name"
                        :disabled="!!translation" />
                    <small>Unique identifier for this translation</small>
                </div>

                <!-- Variation -->
                <div class="form-group">
                    <label>Variation (Context)</label>
                    <input v-model="form.variation" type="text" placeholder="false (for root) or context name"
                        :disabled="!!translation" />
                    <small>Use 'false' for root entries, or specify context (e.g., 'instructors')</small>
                </div>

                <!-- Type -->
                <div class="form-group">
                    <label>Type <span class="required">*</span></label>
                    <select v-model="form.type" required :disabled="!!translation">
                        <option value="">Select Type</option>
                        <option value="button">Button</option>
                        <option value="nav">Navigation</option>
                        <option value="field">Field Label</option>
                        <option value="desc">Description</option>
                    </select>
                    <small>Category of translation</small>
                </div>

                <!-- Translations -->
                <div class="translations-section">
                    <h4>Translations</h4>

                    <!-- German -->
                    <div class="form-group">
                        <label>🇩🇪 German (de) <span class="required">*</span></label>
                        <input v-model="form.text.de" type="text" required placeholder="German translation" />
                    </div>

                    <!-- English -->
                    <div class="form-group">
                        <label>🇬🇧 English (en)</label>
                        <input v-model="form.text.en" type="text" placeholder="English translation" />
                    </div>

                    <!-- Czech -->
                    <div class="form-group">
                        <label>🇨🇿 Czech (cz)</label>
                        <input v-model="form.text.cz" type="text" placeholder="Czech translation" />
                    </div>
                </div>

                <!-- Status -->
                <div class="form-group">
                    <label>Status <span class="required">*</span></label>
                    <select v-model="form.status" required>
                        <option value="de">🇩🇪 German Only (needs translation)</option>
                        <option value="en">🇬🇧 English Added (Czech pending)</option>
                        <option value="cz">🇨🇿 Czech Added (needs review)</option>
                        <option value="ok">✅ Complete (all languages)</option>
                        <option value="draft">📝 Draft (work in progress)</option>
                    </select>
                    <small>Current translation status</small>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="error-message">
                    ❌ {{ error }}
                </div>

                <!-- Actions -->
                <div class="modal-footer">
                    <Button type="button" @click="$emit('close')" class="secondary">
                        Cancel
                    </Button>
                    <Button type="submit" :disabled="saving">
                        {{ saving ? 'Saving...' : (translation ? 'Update' : 'Create') }}
                    </Button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from '@/components/Button.vue'

interface Translation {
    id: number
    name: string
    variation: string
    type: string
    text: Record<string, string>
    status: string
}

interface Props {
    translation?: Translation | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
    close: []
    saved: []
}>()

const form = ref({
    name: '',
    variation: 'false',
    type: '',
    text: {
        de: '',
        en: '',
        cz: ''
    },
    status: 'de'
})

const saving = ref(false)
const error = ref('')

function loadTranslation() {
    if (props.translation) {
        form.value.name = props.translation.name
        form.value.variation = props.translation.variation
        form.value.type = props.translation.type
        form.value.status = props.translation.status

        // Parse text if it's a string
        if (typeof props.translation.text === 'string') {
            try {
                form.value.text = JSON.parse(props.translation.text)
            } catch {
                form.value.text = { de: '', en: '', cz: '' }
            }
        } else {
            form.value.text = { ...props.translation.text }
        }
    }
}

async function save() {
    saving.value = true
    error.value = ''

    try {
        const url = props.translation
            ? `/api/i18n/${props.translation.id}`
            : '/api/i18n'

        const method = props.translation ? 'PUT' : 'POST'

        const body = props.translation
            ? {
                // For updates, only send changed fields
                text: form.value.text,
                status: form.value.status
            }
            : {
                // For creates, send all fields
                name: form.value.name.trim(),
                variation: form.value.variation || 'false',
                type: form.value.type,
                text: form.value.text,
                status: form.value.status
            }

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Failed to save translation')
        }

        emit('saved')
    } catch (err: any) {
        error.value = err.message
        console.error('Error saving translation:', err)
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadTranslation()
})
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
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
}

.close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
}

.close-btn:hover {
    color: #111827;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.required {
    color: #ef4444;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
}

.form-group input:disabled,
.form-group select:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
}

.form-group small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
}

.translations-section {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
}

.translations-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #111827;
}

.error-message {
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #991b1b;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.modal-footer button {
    min-width: 100px;
}

.secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
}

.secondary:hover {
    background: #f9fafb;
}
</style>
