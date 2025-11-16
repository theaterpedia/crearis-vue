<template>
    <BasePanel :is-open="isOpen" title="Navigation Configuration"
        subtitle="Configure navigation options and call-to-action" @close="handleClose">
        <div class="config-content">
            <!-- Team Page Toggle -->
            <div class="toggle-item">
                <div class="toggle-info">
                    <span class="toggle-label">Team-Seite</span>
                    <span class="toggle-description">Zeigt Team-Seite in der Navigation</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" v-model="showTeamPage" :disabled="isLocked" @change="updateConfig">
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <!-- CTA Configuration -->
            <div class="cta-section">
                <h5 class="section-title">Call-to-Action</h5>

                <div class="form-group">
                    <label class="form-label">CTA-Titel</label>
                    <input type="text" v-model="ctaTitle" class="form-input" placeholder="z.B. Jetzt anmelden"
                        :disabled="isLocked" @blur="updateConfig" />
                </div>

                <div class="form-group">
                    <label class="form-label">CTA-Typ</label>
                    <div class="cta-type-toggle">
                        <button v-for="type in ctaTypes" :key="type.value" class="cta-type-btn"
                            :class="{ active: ctaType === type.value }" :disabled="isLocked"
                            @click="selectCtaType(type.value)">
                            {{ type.label }}
                        </button>
                    </div>
                </div>

                <!-- Entity Selector (event/post) -->
                <div v-if="ctaType === 'entity'" class="form-group">
                    <label class="form-label">Event/Post auswählen</label>
                    <select v-model="ctaEntity" class="form-select" :disabled="isLocked" @change="updateConfig">
                        <option value="">Auswählen...</option>
                        <option value="event1">Event 1</option>
                        <option value="post1">Post 1</option>
                    </select>
                </div>

                <!-- Link Input -->
                <div v-if="ctaType === 'link'" class="form-group">
                    <label class="form-label">Link-URL</label>
                    <input type="url" v-model="ctaLink" class="form-input" placeholder="https://example.com"
                        :disabled="isLocked" @blur="updateConfig" />
                </div>

                <!-- Form Selector -->
                <div v-if="ctaType === 'form'" class="form-group">
                    <label class="form-label">Formular auswählen</label>
                    <select v-model="ctaForm" class="form-select" :disabled="isLocked" @change="updateConfig">
                        <option value="">Auswählen...</option>
                        <option value="contact">Kontaktformular</option>
                        <option value="registration">Anmeldeformular</option>
                    </select>
                </div>
            </div>
        </div>
    </BasePanel>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BasePanel from './BasePanel.vue'

interface Props {
    projectId: string
    isOpen: boolean
    isLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false,
    isOpen: false
})

const emit = defineEmits<{
    close: []
}>()

const showTeamPage = ref(false)
const ctaTitle = ref('')
const ctaType = ref<'entity' | 'link' | 'form'>('entity')
const ctaEntity = ref('')
const ctaLink = ref('')
const ctaForm = ref('')

const ctaTypes = [
    { value: 'entity', label: 'Event/Post' },
    { value: 'link', label: 'Link' },
    { value: 'form', label: 'Form' }
]

onMounted(async () => {
    // Load current config from project
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            if (project.config) {
                showTeamPage.value = project.config.team_page === true
                ctaTitle.value = project.config.cta_title || ''

                // Determine CTA type based on which field is set
                if (project.config.cta_entity) {
                    ctaType.value = 'entity'
                    ctaEntity.value = project.config.cta_entity
                } else if (project.config.cta_link) {
                    ctaType.value = 'link'
                    ctaLink.value = project.config.cta_link
                } else if (project.config.cta_form) {
                    ctaType.value = 'form'
                    ctaForm.value = project.config.cta_form
                }
            }
        }
    } catch (error) {
        console.error('Failed to load navigation config:', error)
    }
})

function selectCtaType(type: 'entity' | 'link' | 'form') {
    if (props.isLocked) return
    ctaType.value = type
    // Clear other CTA values
    ctaEntity.value = ''
    ctaLink.value = ''
    ctaForm.value = ''
    updateConfig()
}

async function updateConfig() {
    if (props.isLocked) return

    try {
        // Fetch current project to get existing config
        const getResponse = await fetch(`/api/projects/${props.projectId}`)
        if (!getResponse.ok) return

        const project = await getResponse.json()
        const currentConfig = project.config || {}

        // Update config
        const updatedConfig = { ...currentConfig }

        // Team page
        if (showTeamPage.value) {
            updatedConfig.team_page = true
        } else {
            delete updatedConfig.team_page
        }

        // CTA title
        if (ctaTitle.value) {
            updatedConfig.cta_title = ctaTitle.value
        } else {
            delete updatedConfig.cta_title
        }

        // CTA type and value
        delete updatedConfig.cta_entity
        delete updatedConfig.cta_link
        delete updatedConfig.cta_form

        if (ctaType.value === 'entity' && ctaEntity.value) {
            updatedConfig.cta_entity = ctaEntity.value
        } else if (ctaType.value === 'link' && ctaLink.value) {
            updatedConfig.cta_link = ctaLink.value
        } else if (ctaType.value === 'form' && ctaForm.value) {
            updatedConfig.cta_form = ctaForm.value
        }

        // PATCH the project config
        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: updatedConfig })
        })

        if (!response.ok) {
            console.error('Failed to update navigation config')
        }
    } catch (error) {
        console.error('Error updating navigation config:', error)
    }
}

function handleClose() {
    emit('close')
}
</script>

<style scoped>
/* Config Content */
.config-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.toggle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
}

.toggle-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.toggle-description {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

/* Toggle Switch Styles */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-border);
    transition: 0.3s;
    border-radius: 24px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

.toggle-switch input:checked+.toggle-slider {
    background-color: var(--color-project);
}

.toggle-switch input:checked+.toggle-slider:before {
    transform: translateX(24px);
}

.toggle-switch input:disabled+.toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
}

/* CTA Section */
.cta-section {
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.form-input,
.form-select {
    padding: 0.5rem 0.75rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-project);
}

.form-input:disabled,
.form-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.cta-type-toggle {
    display: flex;
    gap: 0.5rem;
}

.cta-type-btn {
    flex: 1;
    padding: 0.5rem 1rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cta-type-btn:hover:not(:disabled) {
    background: var(--color-muted-bg);
}

.cta-type-btn.active {
    background: var(--color-project);
    color: white;
    border-color: var(--color-project);
}

.cta-type-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
