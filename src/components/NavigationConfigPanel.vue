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

            <!-- Tabs: CTA and Secondary Link -->
            <div class="link-tabs-section">
                <div class="tabs-header">
                    <button class="tab-btn" :class="{ active: activeTab === 'cta' }" @click="activeTab = 'cta'">
                        Call-to-Action
                    </button>
                    <button class="tab-btn" :class="{ active: activeTab === 'link', disabled: !linkEnabled }"
                        :disabled="!linkEnabled" @click="activeTab = 'link'">
                        Secondary Link
                    </button>
                    <!-- Add/Remove buttons -->
                    <button v-if="!linkEnabled" class="tab-action-btn add-btn" @click="enableSecondaryLink"
                        :disabled="isLocked" title="Secondary Link aktivieren">
                        <svg fill="currentColor" height="16" width="16" viewBox="0 0 256 256">
                            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
                        </svg>
                    </button>
                    <button v-if="linkEnabled && activeTab === 'link'" class="tab-action-btn remove-btn"
                        @click="disableSecondaryLink" :disabled="isLocked" title="Secondary Link entfernen">
                        <svg fill="currentColor" height="16" width="16" viewBox="0 0 256 256">
                            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z" />
                        </svg>
                    </button>
                </div>

                <!-- CTA Tab Content -->
                <div v-if="activeTab === 'cta'" class="tab-content">
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
                        <label class="form-label">Entity-Typ</label>
                        <select v-model="ctaEntityType" class="form-select" :disabled="isLocked"
                            @change="onCtaEntityTypeChange">
                            <option value="">Auswählen...</option>
                            <option value="event">Event</option>
                            <option value="post">Post</option>
                        </select>
                    </div>

                    <!-- Entity ID Selector -->
                    <div v-if="ctaType === 'entity' && ctaEntityType" class="form-group">
                        <label class="form-label">{{ ctaEntityType === 'event' ? 'Event' : 'Post' }} auswählen</label>
                        <select v-model="ctaEntityId" class="form-select" :disabled="isLocked || loadingCtaEntities"
                            @change="updateConfig">
                            <option value="">Auswählen...</option>
                            <option v-for="entity in availableCtaEntities" :key="entity.id" :value="String(entity.id)">
                                {{ entity.name || entity.heading || `#${entity.id}` }}
                            </option>
                        </select>
                        <span v-if="loadingCtaEntities" class="loading-hint">Lädt...</span>
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

                <!-- Secondary Link Tab Content -->
                <div v-if="activeTab === 'link' && linkEnabled" class="tab-content">
                    <div class="form-group">
                        <label class="form-label">Link-Titel</label>
                        <input type="text" v-model="linkTitle" class="form-input" placeholder="z.B. Mehr erfahren"
                            :disabled="isLocked" @blur="updateLinkConfig" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Link-Typ</label>
                        <div class="cta-type-toggle">
                            <button v-for="type in ctaTypes" :key="type.value" class="cta-type-btn"
                                :class="{ active: linkType === type.value }" :disabled="isLocked"
                                @click="selectLinkType(type.value)">
                                {{ type.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Entity Selector (event/post) -->
                    <div v-if="linkType === 'entity'" class="form-group">
                        <label class="form-label">Entity-Typ</label>
                        <select v-model="linkEntityType" class="form-select" :disabled="isLocked"
                            @change="onLinkEntityTypeChange">
                            <option value="">Auswählen...</option>
                            <option value="event">Event</option>
                            <option value="post">Post</option>
                        </select>
                    </div>

                    <!-- Entity ID Selector -->
                    <div v-if="linkType === 'entity' && linkEntityType" class="form-group">
                        <label class="form-label">{{ linkEntityType === 'event' ? 'Event' : 'Post' }} auswählen</label>
                        <select v-model="linkEntityId" class="form-select" :disabled="isLocked || loadingLinkEntities"
                            @change="updateLinkConfig">
                            <option value="">Auswählen...</option>
                            <option v-for="entity in availableLinkEntities" :key="entity.id" :value="String(entity.id)">
                                {{ entity.name || entity.heading || `#${entity.id}` }}
                            </option>
                        </select>
                        <span v-if="loadingLinkEntities" class="loading-hint">Lädt...</span>
                    </div>

                    <!-- Link Input -->
                    <div v-if="linkType === 'link'" class="form-group">
                        <label class="form-label">Link-URL</label>
                        <input type="url" v-model="linkUrl" class="form-input" placeholder="https://example.com"
                            :disabled="isLocked" @blur="updateLinkConfig" />
                    </div>

                    <!-- Form Selector -->
                    <div v-if="linkType === 'form'" class="form-group">
                        <label class="form-label">Formular auswählen</label>
                        <select v-model="linkForm" class="form-select" :disabled="isLocked" @change="updateLinkConfig">
                            <option value="">Auswählen...</option>
                            <option value="contact">Kontaktformular</option>
                            <option value="registration">Anmeldeformular</option>
                        </select>
                    </div>
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
import { ref, onMounted, watch } from 'vue'
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

// Tab state
const activeTab = ref<'cta' | 'link'>('cta')

// Team page toggle
const showTeamPage = ref(false)

// CTA state
const ctaTitle = ref('')
const ctaType = ref<'entity' | 'link' | 'form'>('entity')
const ctaEntityType = ref<'event' | 'post' | ''>('') // 'event' or 'post'
const ctaEntityId = ref('') // ID of selected entity
const ctaLink = ref('')
const ctaForm = ref('')
const loadingCtaEntities = ref(false)
const availableCtaEntities = ref<any[]>([])

// Secondary Link state
const linkEnabled = ref(false)
const linkTitle = ref('')
const linkType = ref<'entity' | 'link' | 'form'>('entity')
const linkEntityType = ref<'event' | 'post' | ''>('')
const linkEntityId = ref('')
const linkUrl = ref('')
const linkForm = ref('')
const loadingLinkEntities = ref(false)
const availableLinkEntities = ref<any[]>([])

const ctaTypes = [
    { value: 'entity', label: 'Event/Post' },
    { value: 'link', label: 'Link' },
    { value: 'form', label: 'Form' }
]

// Load entities for CTA
async function loadCtaEntities() {
    if (!ctaEntityType.value || !props.projectId) {
        availableCtaEntities.value = []
        return
    }

    loadingCtaEntities.value = true
    try {
        const endpoint = ctaEntityType.value === 'event' ? 'events' : 'posts'
        const response = await fetch(`/api/${endpoint}?project=${props.projectId}`)
        if (response.ok) {
            const data = await response.json()
            availableCtaEntities.value = Array.isArray(data) ? data : []
        }
    } catch (error) {
        console.error('Failed to load CTA entities:', error)
        availableCtaEntities.value = []
    } finally {
        loadingCtaEntities.value = false
    }
}

// Load entities for Secondary Link
async function loadLinkEntities() {
    if (!linkEntityType.value || !props.projectId) {
        availableLinkEntities.value = []
        return
    }

    loadingLinkEntities.value = true
    try {
        const endpoint = linkEntityType.value === 'event' ? 'events' : 'posts'
        const response = await fetch(`/api/${endpoint}?project=${props.projectId}`)
        if (response.ok) {
            const data = await response.json()
            availableLinkEntities.value = Array.isArray(data) ? data : []
        }
    } catch (error) {
        console.error('Failed to load link entities:', error)
        availableLinkEntities.value = []
    } finally {
        loadingLinkEntities.value = false
    }
}

function onCtaEntityTypeChange() {
    ctaEntityId.value = ''
    loadCtaEntities()
    updateConfig()
}

function onLinkEntityTypeChange() {
    linkEntityId.value = ''
    loadLinkEntities()
    updateLinkConfig()
}

function enableSecondaryLink() {
    if (props.isLocked) return
    linkEnabled.value = true
    activeTab.value = 'link'
    // Initialize with empty values
    linkTitle.value = ''
    linkType.value = 'entity'
    linkEntityType.value = ''
    linkEntityId.value = ''
    linkUrl.value = ''
    linkForm.value = ''
    updateLinkConfig()
}

function disableSecondaryLink() {
    if (props.isLocked) return
    linkEnabled.value = false
    activeTab.value = 'cta'
    // Reset link values
    linkTitle.value = ''
    linkType.value = 'entity'
    linkEntityType.value = ''
    linkEntityId.value = ''
    linkUrl.value = ''
    linkForm.value = ''
    availableLinkEntities.value = []
    // Save 'none' to config.link
    saveLinkToConfig('none')
}

onMounted(async () => {
    // Load current config from project columns
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            
            // Load from dedicated columns
            showTeamPage.value = project.config?.team_page === true
            ctaTitle.value = project.cta_title || ''

            // Determine CTA type based on which field is set
            if (project.cta_entity && project.cta_link) {
                ctaType.value = 'entity'
                ctaEntityType.value = project.cta_entity // 'event' or 'post'
                ctaEntityId.value = project.cta_link // entity ID
                // Load entities for the dropdown
                await loadCtaEntities()
            } else if (project.cta_form) {
                ctaType.value = 'form'
                ctaForm.value = project.cta_form
            } else {
                // Default or link type
                ctaType.value = 'link'
                ctaLink.value = ''
            }

            // Load Secondary Link from header_options_ext.link (web.options.abstract pattern)
            const headerOptsLink = project.header_options_ext?.link
            if (headerOptsLink && headerOptsLink !== 'none') {
                linkEnabled.value = true
                linkTitle.value = headerOptsLink.link_title || ''
                
                // Determine link type
                if (headerOptsLink.link_entity && headerOptsLink.link_link) {
                    linkType.value = 'entity'
                    linkEntityType.value = headerOptsLink.link_entity
                    linkEntityId.value = headerOptsLink.link_link
                    await loadLinkEntities()
                } else if (headerOptsLink.link_form) {
                    linkType.value = 'form'
                    linkForm.value = headerOptsLink.link_form
                } else if (headerOptsLink.link_link) {
                    linkType.value = 'link'
                    linkUrl.value = headerOptsLink.link_link
                }
            } else {
                linkEnabled.value = false
            }
        }
    } catch (error) {
        console.error('Failed to load navigation config:', error)
    }
})

function selectCtaType(type: 'entity' | 'link' | 'form') {
    if (props.isLocked) return
    ctaType.value = type
    // Clear CTA values
    ctaEntityType.value = ''
    ctaEntityId.value = ''
    ctaLink.value = ''
    ctaForm.value = ''
    availableCtaEntities.value = []
    updateConfig()
}

function selectLinkType(type: 'entity' | 'link' | 'form') {
    if (props.isLocked) return
    linkType.value = type
    // Clear Link values
    linkEntityType.value = ''
    linkEntityId.value = ''
    linkUrl.value = ''
    linkForm.value = ''
    availableLinkEntities.value = []
    updateLinkConfig()
}

async function updateConfig() {
    if (props.isLocked) return

    try {
        // Build update payload for dedicated columns
        const payload: Record<string, any> = {
            cta_title: ctaTitle.value || null,
            cta_entity: null,
            cta_link: null,
            cta_form: null
        }

        if (ctaType.value === 'entity' && ctaEntityType.value && ctaEntityId.value) {
            payload.cta_entity = ctaEntityType.value // 'event' or 'post'
            payload.cta_link = ctaEntityId.value // entity ID
        } else if (ctaType.value === 'form' && ctaForm.value) {
            payload.cta_form = ctaForm.value
        }
        // For 'link' type, we currently don't have a dedicated column, so leave as null

        // PUT the project with updated CTA columns
        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            console.error('Failed to update navigation config')
        }
    } catch (error) {
        console.error('Error updating navigation config:', error)
    }
}

// Save Secondary Link to header_options_ext.link JSONB
// Uses the web.options.abstract pattern from Odoo
async function saveLinkToConfig(linkData: 'none' | Record<string, any>) {
    try {
        console.log('[NavigationConfigPanel] Saving link to header_options_ext:', linkData)
        
        // First get current header_options_ext
        const getResponse = await fetch(`/api/projects/${props.projectId}`)
        if (!getResponse.ok) {
            console.error('[NavigationConfigPanel] Failed to get project for config update')
            return
        }
        
        const project = await getResponse.json()
        const currentHeaderOpts = project.header_options_ext || {}
        console.log('[NavigationConfigPanel] Current header_options_ext:', currentHeaderOpts)
        
        // Update the link key in header_options_ext
        const newHeaderOpts = {
            ...currentHeaderOpts,
            link: linkData
        }
        console.log('[NavigationConfigPanel] New header_options_ext to save:', newHeaderOpts)
        
        // PUT the updated header_options_ext
        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ header_options_ext: newHeaderOpts })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[NavigationConfigPanel] Failed to update link config:', errorText)
        } else {
            console.log('[NavigationConfigPanel] Link config saved successfully to header_options_ext')
        }
    } catch (error) {
        console.error('[NavigationConfigPanel] Error saving link config:', error)
    }
}

async function updateLinkConfig() {
    if (props.isLocked || !linkEnabled.value) return

    // Build the link object
    const linkData: Record<string, any> = {
        link_title: linkTitle.value || null,
        link_entity: null,
        link_link: null,
        link_form: null
    }

    if (linkType.value === 'entity' && linkEntityType.value && linkEntityId.value) {
        linkData.link_entity = linkEntityType.value
        linkData.link_link = linkEntityId.value
    } else if (linkType.value === 'link' && linkUrl.value) {
        linkData.link_link = linkUrl.value
    } else if (linkType.value === 'form' && linkForm.value) {
        linkData.link_form = linkForm.value
    }

    await saveLinkToConfig(linkData)
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

/* Link Tabs Section */
.link-tabs-section {
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tabs-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: var(--border) solid var(--color-border);
    padding-bottom: 0.75rem;
}

.tab-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-btn:hover:not(:disabled) {
    color: var(--color-text);
}

.tab-btn.active {
    color: var(--color-project);
    border-bottom-color: var(--color-project);
}

.tab-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    margin-left: auto;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-action-btn:hover:not(:disabled) {
    background: var(--color-muted-bg);
}

.tab-action-btn.add-btn:hover:not(:disabled) {
    background: var(--color-project);
    color: white;
    border-color: var(--color-project);
}

.tab-action-btn.remove-btn:hover:not(:disabled) {
    background: var(--color-danger, oklch(63.68% 0.2078 25.33));
    color: white;
    border-color: var(--color-danger, oklch(63.68% 0.2078 25.33));
}

.tab-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

.loading-hint {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-dimmed);
    font-style: italic;
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
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-color: var(--color-accent);
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
    grid-template-columns: repeat(auto-fit, minmax(17.5rem, 1fr));
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
    border: var(--border) solid var(--color-border);
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
