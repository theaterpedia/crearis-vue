<template>
    <div class="config-panel">
        <h4>Theme & Page Headers</h4>
        <p class="panel-description">Wähle ein Theme und konfiguriere die Standard-Header für Dein Projekt</p>

        <div class="config-content">
            <!-- Theme Selection -->
            <div class="form-group">
                <label class="form-label">Theme auswählen</label>
                <div class="theme-selector">
                    <ProjectThemeSelector :project-id="projectId" v-model="projectThemeId" />
                </div>
            </div>

            <!-- Site Header Settings -->
            <div class="form-section">
                <h5 class="section-title">Projekt-Homepage Header</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Header Type</label>
                        <select v-model="siteHeaderType" class="form-select" @change="markDirty">
                            <option value="banner">Banner (oben-ausgerichtet)</option>
                            <option value="cover">Cover (zentriert)</option>
                            <option value="columns">Spalten (nebeneinander)</option>
                            <option value="simple">Einfach (kein Bild)</option>
                            <option value="bauchbinde">Bauchbinde</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Header Size</label>
                        <select v-model="siteHeaderSize" class="form-select" @change="markDirty">
                            <option value="mini">Mini (25%)</option>
                            <option value="medium">Medium (50%)</option>
                            <option value="prominent">Prominent (75%)</option>
                            <option value="full">Voll (100%)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Default Post Header Settings -->
            <div class="form-section">
                <h5 class="section-title">Standard für neue Beiträge</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Header Type</label>
                        <select v-model="defaultPostHeaderType" class="form-select" @change="markDirty">
                            <option value="banner">Banner</option>
                            <option value="cover">Cover</option>
                            <option value="columns">Spalten</option>
                            <option value="simple">Einfach</option>
                            <option value="bauchbinde">Bauchbinde</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Header Size</label>
                        <select v-model="defaultPostHeaderSize" class="form-select" @change="markDirty">
                            <option value="mini">Mini</option>
                            <option value="medium">Medium</option>
                            <option value="prominent">Prominent</option>
                            <option value="full">Voll</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Default Event Header Settings -->
            <div class="form-section">
                <h5 class="section-title">Standard für neue Events</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Header Type</label>
                        <select v-model="defaultEventHeaderType" class="form-select" @change="markDirty">
                            <option value="cover">Cover</option>
                            <option value="banner">Banner</option>
                            <option value="columns">Spalten</option>
                            <option value="simple">Einfach</option>
                            <option value="bauchbinde">Bauchbinde</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Header Size</label>
                        <select v-model="defaultEventHeaderSize" class="form-select" @change="markDirty">
                            <option value="mini">Mini</option>
                            <option value="medium">Medium</option>
                            <option value="prominent">Prominent</option>
                            <option value="full">Voll</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Save Button -->
            <div v-if="isDirty" class="save-section">
                <button class="save-btn" @click="saveHeaderSettings" :disabled="isSaving">
                    {{ isSaving ? 'Speichern...' : 'Header-Einstellungen speichern' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProjectThemeSelector from '@/components/dashboard/ProjectThemeSelector.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})

const projectThemeId = ref<number | null>(null)

// Site header settings
const siteHeaderType = ref('banner')
const siteHeaderSize = ref('prominent')

// Default post header settings
const defaultPostHeaderType = ref('banner')
const defaultPostHeaderSize = ref('medium')

// Default event header settings
const defaultEventHeaderType = ref('cover')
const defaultEventHeaderSize = ref('prominent')

// Dirty tracking
const isDirty = ref(false)
const isSaving = ref(false)

function markDirty() {
    isDirty.value = true
}

// Load current project settings on mount
onMounted(async () => {
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            projectThemeId.value = project.theme ?? null

            // Load header settings
            siteHeaderType.value = project.site_header_type || 'banner'
            siteHeaderSize.value = project.site_header_size || 'prominent'
            defaultPostHeaderType.value = project.default_post_header_type || 'banner'
            defaultPostHeaderSize.value = project.default_post_header_size || 'medium'
            defaultEventHeaderType.value = project.default_event_header_type || 'cover'
            defaultEventHeaderSize.value = project.default_event_header_size || 'prominent'
        }
    } catch (e) {
        console.error('Failed to load project settings:', e)
    }
})

async function saveHeaderSettings() {
    isSaving.value = true
    try {
        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                site_header_type: siteHeaderType.value,
                site_header_size: siteHeaderSize.value,
                default_post_header_type: defaultPostHeaderType.value,
                default_post_header_size: defaultPostHeaderSize.value,
                default_event_header_type: defaultEventHeaderType.value,
                default_event_header_size: defaultEventHeaderSize.value
            })
        })

        if (response.ok) {
            isDirty.value = false
        } else {
            console.error('Failed to save header settings')
        }
    } catch (e) {
        console.error('Error saving header settings:', e)
    } finally {
        isSaving.value = false
    }
}
</script>

<style scoped>
.config-panel {
    padding: 1.5rem;
}

.config-panel h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.panel-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 1.5rem 0;
}

.config-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.section-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.75rem 0;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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

.form-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--color-card-bg);
    color: var(--color-text);
}

.form-select:focus {
    outline: none;
    border-color: var(--color-accent);
}

.theme-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.save-section {
    padding-top: 1rem;
}

.save-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
}

.save-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 640px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>
