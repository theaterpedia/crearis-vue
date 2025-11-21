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

            <!-- Image List/Gallery Examples -->
            <div class="examples-section">
                <h5 class="section-title">Bilder-Listen Beispiele</h5>
                <p class="section-description">Schnellkonfiguration für häufige Anwendungsfälle</p>

                <div class="example-cards">
                    <!-- Example 1: Public Kids Images -->
                    <div class="example-card">
                        <div class="example-header">
                            <span class="example-title">🎨 Kinder-Bilder (Aside)</span>
                            <span class="example-badge">Aside List</span>
                        </div>
                        <p class="example-description">
                            Zeigt alle öffentlichen Bilder für Kinder in der Seitenleiste
                        </p>
                        <div class="example-config">
                            <code class="config-code">aside_list: 'images'</code>
                            <code class="config-code">ctags: 0x01 (Kind)</code>
                            <code class="config-code">visibility: public</code>
                        </div>
                        <button class="apply-example-btn" @click="applyExample1" :disabled="isLocked">
                            Anwenden
                        </button>
                    </div>

                    <!-- Example 2: Location Photos Gallery -->
                    <div class="example-card">
                        <div class="example-header">
                            <span class="example-title">📍 Orts-Galerie (Footer)</span>
                            <span class="example-badge">Footer Gallery</span>
                        </div>
                        <p class="example-description">
                            Zeigt Location-Fotos als Galerie im Footer-Bereich
                        </p>
                        <div class="example-config">
                            <code class="config-code">footer_gallery: 'images'</code>
                            <code class="config-code">ctags: 0x04 (Location)</code>
                            <code class="config-code">visibility: public</code>
                        </div>
                        <button class="apply-example-btn" @click="applyExample2" :disabled="isLocked">
                            Anwenden
                        </button>
                    </div>
                </div>

                <!-- Additional Info -->
                <div class="info-box">
                    <svg class="info-icon" fill="currentColor" height="16" viewBox="0 0 256 256" width="16">
                        <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z">
                        </path>
                    </svg>
                    <div class="info-text">
                        <strong>Hinweis:</strong> Diese Beispiele konfigurieren die Projekt-Datenbank.
                        Stellen Sie sicher, dass Bilder entsprechend getaggt sind (ctags).
                        Weitere Infos: <code>/docs/IMAGE_LIST_GALLERY_GUIDE.md</code>
                    </div>
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

async function applyExample1() {
    if (props.isLocked) return

    try {
        // Example 1: Public Kids Images in Aside
        // Sets aside_list to 'images' which triggers pListImages component
        // Images should be tagged with ctags=0x01 (Kind/Child age_group)

        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aside_list: 'images'
            })
        })

        if (response.ok) {
            alert('✓ Konfiguration angewendet!\n\nAside zeigt nun Bilder für Kinder.\nStellen Sie sicher, dass Bilder mit ctags=0x01 getaggt sind.')
        } else {
            alert('Fehler beim Anwenden der Konfiguration')
        }
    } catch (error) {
        console.error('Error applying example 1:', error)
        alert('Fehler beim Anwenden der Konfiguration')
    }
}

async function applyExample2() {
    if (props.isLocked) return

    try {
        // Example 2: Location Photos in Footer Gallery
        // Sets footer_gallery to 'images' which triggers pGalleryImages component
        // Images should be tagged with ctags=0x04 (Location subject_type)

        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                footer_gallery: 'images'
            })
        })

        if (response.ok) {
            alert('✓ Konfiguration angewendet!\n\nFooter zeigt nun Location-Galerie.\nStellen Sie sicher, dass Bilder mit ctags=0x04 getaggt sind.')
        } else {
            alert('Fehler beim Anwenden der Konfiguration')
        }
    } catch (error) {
        console.error('Error applying example 2:', error)
        alert('Fehler beim Anwenden der Konfiguration')
    }
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

/* Examples Section */
.examples-section {
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-description {
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    margin: -0.5rem 0 0 0;
}

.example-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
}

.example-card {
    padding: 1rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.example-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.example-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.example-badge {
    font-size: 0.6875rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-project-light, var(--color-muted-bg));
    color: var(--color-project, var(--color-text));
    border-radius: 0.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.example-description {
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    line-height: 1.4;
    margin: 0;
}

.example-config {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.75rem;
    background: var(--color-bg-soft);
    border-radius: 0.25rem;
}

.config-code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    color: var(--color-project, var(--color-text));
    background: var(--color-bg);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--color-border);
}

.apply-example-btn {
    padding: 0.5rem 1rem;
    background: var(--color-project);
    color: white;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.apply-example-btn:hover:not(:disabled) {
    background: var(--color-project-dark, var(--color-project));
    transform: translateY(-1px);
}

.apply-example-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.info-box {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-accent-bg, var(--color-muted-bg));
    border: var(--border) solid var(--color-accent, var(--color-border));
    border-radius: var(--radius-button);
}

.info-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: var(--color-accent, var(--color-text));
}

.info-text {
    font-size: 0.8125rem;
    color: var(--color-text);
    line-height: 1.5;
}

.info-text strong {
    font-weight: 600;
    color: var(--color-accent, var(--color-text));
}

.info-text code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
    background: var(--color-bg);
    border-radius: 0.25rem;
}
</style>
