<template>
    <div class="header-configs-editor">
        <!-- Mode Switcher: Central vs Project -->
        <div class="editor-header">
            <h2>🖼️ Header Configs</h2>
            <div class="mode-switcher">
                <button :class="['mode-btn', { active: mode === 'central' }]" @click="mode = 'central'">
                    📋 Central Configs
                </button>
                <button :class="['mode-btn', { active: mode === 'project' }]" @click="mode = 'project'">
                    🏢 Project Overrides
                </button>
            </div>
        </div>

        <!-- Project Selector (only in project mode) -->
        <div v-if="mode === 'project'" class="project-selector">
            <label>Select Project:</label>
            <select v-model="selectedProjectId" class="form-select">
                <option value="">-- Select a project --</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }} ({{ project.domaincode }})
                </option>
            </select>
        </div>

        <!-- Filter by Parent Type -->
        <div class="filter-bar">
            <label>Filter by Type:</label>
            <div class="type-buttons">
                <button v-for="type in parentTypes" :key="type" :class="['type-btn', { active: filterType === type }]"
                    @click="filterType = filterType === type ? '' : type">
                    {{ typeLabels[type] }}
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading">Loading header configs...</div>

        <!-- Central Configs Mode -->
        <div v-else-if="mode === 'central'" class="configs-grid">
            <div v-for="config in filteredConfigs" :key="config.id" class="config-card"
                :class="{ 'is-default': config.is_default && !isThemeConfig(config), 'has-theme': isThemeConfig(config) }">
                <div class="config-header">
                    <span class="config-name">{{ config.name }}</span>
                    <!-- Show Default badge only for non-theme configs -->
                    <span v-if="config.is_default && !isThemeConfig(config)" class="badge badge-default">Default</span>
                    <!-- Show Theme badge for theme-specific configs -->
                    <span v-if="isThemeConfig(config)" class="badge badge-theme">
                        🎨 {{ getThemeName(config.theme_id!) }}
                    </span>
                    <span class="parent-type-badge" :class="'type-' + config.parent_type">
                        {{ config.parent_type }}
                    </span>
                </div>
                <div class="config-labels">
                    <span class="label-de">🇩🇪 {{ config.label_de }}</span>
                    <span class="label-en">🇬🇧 {{ config.label_en }}</span>
                </div>
                <div class="config-description">{{ config.description }}</div>
                <div class="config-preview">
                    <ConfigPreview :config="config.config" :parent-type="config.parent_type" />
                </div>
                <div class="config-actions">
                    <button class="btn btn-sm btn-secondary" @click="editConfig(config)">✏️ Edit</button>
                    <!-- Allow delete for: non-defaults OR theme-specific configs (even if is_default for that theme) -->
                    <button v-if="!config.is_default || isThemeConfig(config)" class="btn btn-sm btn-danger"
                        @click="deleteConfig(config)">
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <!-- Add New Config -->
            <div class="config-card add-card" @click="openAddSubcategory">
                <div class="add-icon">➕</div>
                <div class="add-text">Add Subcategory</div>
            </div>

            <!-- Add Theme-Header -->
            <div class="config-card add-card add-theme-card" @click="openAddThemeHeader">
                <div class="add-icon">🎨</div>
                <div class="add-text">Add Theme-Header</div>
            </div>
        </div>

        <!-- Project Overrides Mode -->
        <div v-else-if="mode === 'project' && selectedProjectId" class="overrides-view">
            <div class="overrides-info">
                <p>
                    Project overrides customize header configs for <strong>{{ selectedProjectName }}</strong>.
                    These only apply on <code>/sites/{{ selectedProjectDomaincode }}/*</code> routes.
                </p>
            </div>

            <div class="configs-grid">
                <div v-for="config in filteredConfigs" :key="config.id" class="config-card"
                    :class="{ 'has-override': hasOverride(config.name) }">
                    <div class="config-header">
                        <span class="config-name">{{ config.name }}</span>
                        <span v-if="hasOverride(config.name)" class="badge badge-override">Has Override</span>
                    </div>
                    <div class="config-labels">
                        <span class="label-de">🇩🇪 {{ config.label_de }}</span>
                    </div>
                    <div class="config-preview">
                        <ConfigPreview :config="getMergedConfig(config)" :parent-type="config.parent_type"
                            :show-diff="hasOverride(config.name)" :base-config="config.config" />
                    </div>
                    <div class="config-actions">
                        <button class="btn btn-sm btn-primary" @click="editOverride(config)">
                            {{ hasOverride(config.name) ? '✏️ Edit Override' : '➕ Add Override' }}
                        </button>
                        <button v-if="hasOverride(config.name)" class="btn btn-sm btn-danger"
                            @click="removeOverride(config.name)">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- No Project Selected -->
        <div v-else-if="mode === 'project'" class="empty-state">
            <p>Select a project to manage its header config overrides.</p>
        </div>

        <!-- Add/Edit Config Dialog -->
        <div v-if="showAddDialog || editingConfig" class="modal-overlay" @click.self="closeDialog">
            <div class="modal-dialog modal-lg">
                <div class="modal-header">
                    <h3>{{ dialogTitle }}</h3>
                    <button class="btn-close" @click="closeDialog">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <!-- Left column: Basic info -->
                        <div class="form-column">
                            <div class="form-group">
                                <label>Parent Type <span class="required">*</span></label>
                                <select v-model="formData.parent_type" class="form-select" :disabled="!!editingConfig">
                                    <option v-for="type in parentTypes" :key="type" :value="type">
                                        {{ typeLabels[type] }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Name <span v-if="!editingConfig && formMode !== 'theme'"
                                        class="required">*</span></label>
                                <!-- When editing: show full name (read-only) -->
                                <input v-if="editingConfig" :value="formData.original_name" type="text"
                                    class="form-input" disabled />
                                <!-- When creating theme header: name is auto-generated -->
                                <div v-else-if="formMode === 'theme'" class="name-preview">
                                    <code>{{ formData.parent_type }}_theme{{ formData.theme_id ?? '?' }}</code>
                                    <small class="form-hint">Auto-generated from parent type + theme</small>
                                </div>
                                <!-- When creating subcategory: prefix with dot -->
                                <div v-else class="name-input-group">
                                    <span class="name-prefix">{{ formData.parent_type }}.</span>
                                    <input v-model="formData.name_suffix" type="text" class="form-input"
                                        placeholder="subcategory" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Label (DE)</label>
                                <input v-model="formData.label_de" type="text" class="form-input" />
                            </div>
                            <div class="form-group">
                                <label>Label (EN)</label>
                                <input v-model="formData.label_en" type="text" class="form-input" />
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea v-model="formData.description" class="form-textarea" rows="2"></textarea>
                            </div>
                            <!-- Theme field: 
                                 - For new theme-headers: required dropdown to select theme
                                 - For editing theme configs: shown but disabled
                                 - For subcategories: optional
                            -->
                            <div v-if="showThemeField || formMode === 'theme'" class="form-group">
                                <label>Theme <span v-if="formMode === 'theme'" class="required">*</span><span
                                        v-else>(optional)</span></label>
                                <select v-model="formData.theme_id" class="form-select"
                                    :disabled="editingConfig && isThemeConfig(editingConfig)">
                                    <option v-if="formMode !== 'theme'" :value="null">—
                                        Global (no theme) —</option>
                                    <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                                        {{ theme.name }}
                                    </option>
                                </select>
                                <small v-if="editingConfig && isThemeConfig(editingConfig)" class="form-hint">Theme
                                    cannot be changed for theme configs.</small>
                                <small v-else-if="formMode === 'theme'" class="form-hint">Select which theme this header
                                    config applies to.</small>
                                <small v-else class="form-hint">If set, this config applies only when the project uses
                                    this theme.</small>
                            </div>
                        </div>

                        <!-- Right column: Config properties -->
                        <div class="form-column">
                            <h4>Config Properties</h4>
                            <div class="form-group">
                                <label>Header Size</label>
                                <select v-model="formData.config.headerSize" class="form-select">
                                    <option value="mini">Mini</option>
                                    <option value="medium">Medium</option>
                                    <option value="prominent">Prominent</option>
                                    <option value="full">Full</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Content Align Y</label>
                                <select v-model="formData.config.contentAlignY" class="form-select">
                                    <option value="top">Top</option>
                                    <option value="center">Center</option>
                                    <option value="bottom">Bottom</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gradient Type</label>
                                <select v-model="formData.config.gradientType" class="form-select">
                                    <option value="none">None</option>
                                    <option value="left-bottom">Left Bottom</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gradient Depth ({{ formData.config.gradientDepth }})</label>
                                <input v-model.number="formData.config.gradientDepth" type="range" min="0" max="1"
                                    step="0.1" class="form-range" />
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input v-model="formData.config.isFullWidth" type="checkbox" />
                                    Full Width
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input v-model="formData.config.contentInBanner" type="checkbox" />
                                    Content in Banner
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
                    <button class="btn btn-primary" @click="saveConfig" :disabled="!isFormValid">
                        {{ editingConfig ? 'Update' : 'Create' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Override Edit Dialog -->
        <div v-if="editingOverride" class="modal-overlay" @click.self="closeOverrideDialog">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>✏️ Edit Override: {{ editingOverride.name }}</h3>
                    <button class="btn-close" @click="closeOverrideDialog">✕</button>
                </div>
                <div class="modal-body">
                    <p class="override-help">
                        Only specify values you want to override. Empty fields will use the central config value.
                    </p>
                    <div class="form-group">
                        <label>Header Size Override</label>
                        <select v-model="overrideForm.headerSize" class="form-select">
                            <option value="">-- Use central --</option>
                            <option value="mini">Mini</option>
                            <option value="medium">Medium</option>
                            <option value="prominent">Prominent</option>
                            <option value="full">Full</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Content Align Y Override</label>
                        <select v-model="overrideForm.contentAlignY" class="form-select">
                            <option value="">-- Use central --</option>
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Gradient Depth Override ({{ overrideForm.gradientDepth || 'central' }})</label>
                        <input v-model.number="overrideForm.gradientDepth" type="range" min="0" max="1" step="0.1"
                            class="form-range" />
                        <button class="btn btn-sm btn-secondary" @click="overrideForm.gradientDepth = null">
                            Clear
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeOverrideDialog">Cancel</button>
                    <button class="btn btn-primary" @click="saveOverride">Save Override</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ConfigPreview from './ConfigPreview.vue'

// Types
interface HeaderConfig {
    id: number
    name: string
    parent_type: string
    is_default: boolean
    config: Record<string, any>
    label_de: string
    label_en: string
    description: string
    theme_id?: number | null
    has_project_override?: boolean
}

interface Project {
    id: number
    name: string
    domaincode: string
}

interface ProjectOverride {
    id: number
    header_config_name: string
    config_overrides: Record<string, any>
}

// State
const mode = ref<'central' | 'project'>('central')
const loading = ref(true)
const configs = ref<HeaderConfig[]>([])
const projects = ref<Project[]>([])
const projectOverrides = ref<ProjectOverride[]>([])
const selectedProjectId = ref<string>('')
const filterType = ref<string>('')

const showAddDialog = ref(false)
const formMode = ref<'subcategory' | 'theme'>('subcategory')  // Different form modes
const editingConfig = ref<HeaderConfig | null>(null)
const editingOverride = ref<HeaderConfig | null>(null)

const parentTypes = ['simple', 'columns', 'banner', 'cover', 'bauchbinde']
const typeLabels: Record<string, string> = {
    simple: 'Einfach',
    columns: 'Zwei Spalten',
    banner: 'Banner',
    cover: 'Cover',
    bauchbinde: 'Bauchbinde'
}

// Themes data
const themes = ref<Array<{ id: number; name: string }>>([])

// Form data
const formData = ref({
    parent_type: 'cover',
    name_suffix: '',
    original_name: '',  // Store original name when editing (preserves cover_theme1 format)
    label_de: '',
    label_en: '',
    description: '',
    theme_id: null as number | null,
    config: {
        headerSize: 'prominent',
        contentAlignY: 'bottom',
        gradientType: 'none',
        gradientDepth: 0.6,
        isFullWidth: false,
        contentInBanner: false
    }
})

const overrideForm = ref<Record<string, any>>({
    headerSize: '',
    contentAlignY: '',
    gradientDepth: null
})

// Computed
const selectedProject = computed(() =>
    projects.value.find(p => p.id === Number(selectedProjectId.value))
)

const selectedProjectName = computed(() => selectedProject.value?.name || '')
const selectedProjectDomaincode = computed(() => selectedProject.value?.domaincode || '')

const filteredConfigs = computed(() => {
    if (!filterType.value) return configs.value
    return configs.value.filter(c => c.parent_type === filterType.value)
})

const isFormValid = computed(() => {
    // When editing, original_name is set - just need parent_type
    if (editingConfig.value) {
        return !!formData.value.parent_type
    }
    // When creating theme header, need parent_type and theme_id (name is auto-generated)
    if (formMode.value === 'theme') {
        return !!formData.value.parent_type && formData.value.theme_id !== null
    }
    // When creating subcategory, need parent_type and name_suffix
    return !!formData.value.parent_type && !!formData.value.name_suffix
})

// Dialog title based on mode
const dialogTitle = computed(() => {
    if (editingConfig.value) return '✏️ Edit Config'
    if (formMode.value === 'theme') return '🎨 New Theme-Header'
    return '➕ New Subcategory'
})

// Show theme field: hide for default configs (e.g., cover.default), show for others
const showThemeField = computed(() => {
    // When editing a default config, hide theme field
    if (editingConfig.value?.is_default && !isThemeConfig(editingConfig.value)) {
        return false
    }
    return true
})

// Check if a config is theme-specific (has theme_id set)
function isThemeConfig(config: HeaderConfig): boolean {
    return config.theme_id !== null && config.theme_id !== undefined
}

// Methods
async function fetchConfigs() {
    loading.value = true
    try {
        const response = await fetch('/api/header-configs')
        const data = await response.json()
        if (data.success) {
            configs.value = data.data
        }
    } catch (error) {
        console.error('Failed to fetch configs:', error)
    } finally {
        loading.value = false
    }
}

async function fetchProjects() {
    try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        if (Array.isArray(data)) {
            projects.value = data
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
    }
}

async function fetchProjectOverrides() {
    if (!selectedProjectId.value) {
        projectOverrides.value = []
        return
    }
    try {
        const response = await fetch(`/api/projects/${selectedProjectId.value}/header-overrides`)
        const data = await response.json()
        if (data.success) {
            projectOverrides.value = data.data
        }
    } catch (error) {
        console.error('Failed to fetch overrides:', error)
    }
}

function hasOverride(configName: string): boolean {
    return projectOverrides.value.some(o => o.header_config_name === configName)
}

function getOverride(configName: string): ProjectOverride | undefined {
    return projectOverrides.value.find(o => o.header_config_name === configName)
}

function getMergedConfig(config: HeaderConfig): Record<string, any> {
    const override = getOverride(config.name)
    if (!override) return config.config
    return { ...config.config, ...override.config_overrides }
}

function getThemeName(themeId: number): string {
    const theme = themes.value.find((t: { id: number; name: string }) => t.id === themeId)
    return theme?.name ?? `Theme ${themeId}`
}

function openAddSubcategory() {
    formMode.value = 'subcategory'
    showAddDialog.value = true
}

function openAddThemeHeader() {
    formMode.value = 'theme'
    // Pre-select first theme if available
    formData.value.theme_id = themes.value.length > 0 ? themes.value[0].id : null
    showAddDialog.value = true
}

function editConfig(config: HeaderConfig) {
    editingConfig.value = config

    // Set form mode based on config type
    formMode.value = isThemeConfig(config) ? 'theme' : 'subcategory'

    // Store original name - don't try to reconstruct it on save
    // This preserves names like 'cover_theme1' which use underscore, not dot
    formData.value = {
        parent_type: config.parent_type,
        name_suffix: config.name,  // Display full name in edit mode
        original_name: config.name,  // Preserve for save
        label_de: config.label_de,
        label_en: config.label_en,
        description: config.description,
        theme_id: config.theme_id ?? null,
        config: { ...config.config }
    }
}

async function saveConfig() {
    // When editing, use original name
    // When creating theme mode: auto-generate from parent_type + theme_id
    // When creating subcategory: construct from parent_type.suffix
    let name: string
    if (editingConfig.value) {
        name = formData.value.original_name
    } else if (formMode.value === 'theme') {
        name = `${formData.value.parent_type}_theme${formData.value.theme_id}`
    } else {
        name = `${formData.value.parent_type}.${formData.value.name_suffix}`
    }

    const payload = {
        name,
        parent_type: formData.value.parent_type,
        label_de: formData.value.label_de || name,
        label_en: formData.value.label_en || name,
        description: formData.value.description,
        theme_id: formData.value.theme_id,
        config: formData.value.config
    }

    try {
        const url = editingConfig.value
            ? `/api/header-configs/${editingConfig.value.id}`
            : '/api/header-configs'
        const method = editingConfig.value ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (data.success) {
            await fetchConfigs()
            closeDialog()
        } else {
            alert(data.error || 'Failed to save config')
        }
    } catch (error) {
        console.error('Failed to save config:', error)
        alert('Failed to save config')
    }
}

async function deleteConfig(config: HeaderConfig) {
    if (!confirm(`Delete "${config.name}"? This cannot be undone.`)) return

    try {
        const response = await fetch(`/api/header-configs/${config.id}`, {
            method: 'DELETE'
        })
        const data = await response.json()
        if (data.success) {
            await fetchConfigs()
        } else {
            alert(data.message || 'Failed to delete config')
        }
    } catch (error) {
        console.error('Failed to delete config:', error)
    }
}

function editOverride(config: HeaderConfig) {
    editingOverride.value = config
    const existing = getOverride(config.name)
    overrideForm.value = existing?.config_overrides
        ? { ...existing.config_overrides }
        : { headerSize: '', contentAlignY: '', gradientDepth: null }
}

async function saveOverride() {
    if (!editingOverride.value || !selectedProjectId.value) return

    // Remove empty values
    const cleanOverrides: Record<string, any> = {}
    for (const [key, value] of Object.entries(overrideForm.value)) {
        if (value !== '' && value !== null && value !== undefined) {
            cleanOverrides[key] = value
        }
    }

    try {
        const response = await fetch(`/api/projects/${selectedProjectId.value}/header-overrides`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                header_config_name: editingOverride.value.name,
                config_overrides: cleanOverrides
            })
        })

        const data = await response.json()
        if (data.success) {
            await fetchProjectOverrides()
            closeOverrideDialog()
        } else {
            alert(data.error || 'Failed to save override')
        }
    } catch (error) {
        console.error('Failed to save override:', error)
    }
}

async function removeOverride(configName: string) {
    if (!confirm(`Remove override for "${configName}"?`)) return

    try {
        const response = await fetch(
            `/api/projects/${selectedProjectId.value}/header-overrides/${encodeURIComponent(configName)}`,
            { method: 'DELETE' }
        )
        const data = await response.json()
        if (data.success) {
            await fetchProjectOverrides()
        }
    } catch (error) {
        console.error('Failed to remove override:', error)
    }
}

function closeDialog() {
    showAddDialog.value = false
    editingConfig.value = null
    formMode.value = 'subcategory'
    formData.value = {
        parent_type: 'cover',
        name_suffix: '',
        original_name: '',
        label_de: '',
        label_en: '',
        description: '',
        theme_id: null,
        config: {
            headerSize: 'prominent',
            contentAlignY: 'bottom',
            gradientType: 'none',
            gradientDepth: 0.6,
            isFullWidth: false,
            contentInBanner: false
        }
    }
}

function closeOverrideDialog() {
    editingOverride.value = null
    overrideForm.value = { headerSize: '', contentAlignY: '', gradientDepth: null }
}

// Watchers
watch(selectedProjectId, () => {
    fetchProjectOverrides()
})

// Fetch themes
async function fetchThemes() {
    try {
        const response = await fetch('/api/themes')
        const data = await response.json()
        if (data.success && Array.isArray(data.themes)) {
            themes.value = data.themes.map((t: any) => ({ id: t.id, name: t.name }))
        }
    } catch (error) {
        console.error('Failed to fetch themes:', error)
    }
}

// Lifecycle
onMounted(async () => {
    await Promise.all([fetchConfigs(), fetchProjects(), fetchThemes()])
})
</script>

<style scoped>
.header-configs-editor {
    padding: 1.5rem;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.editor-header h2 {
    margin: 0;
    color: var(--color-contrast);
}

.mode-switcher {
    display: flex;
    gap: 0.5rem;
}

.mode-btn {
    padding: 0.5rem 1rem;
    border: 2px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.mode-btn:hover {
    border-color: var(--color-primary-bg);
}

.mode-btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary-bg);
}

.project-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius);
}

.project-selector label {
    font-weight: 600;
    color: var(--color-contrast);
}

.filter-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.filter-bar label {
    font-weight: 600;
    color: var(--color-dimmed);
}

.type-buttons {
    display: flex;
    gap: 0.5rem;
}

.type-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.type-btn:hover {
    background: var(--color-muted-bg);
}

.type-btn.active {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-color: var(--color-accent-bg);
}

.configs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
}

.config-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 1.25rem;
    transition: all 0.2s;
}

.config-card:hover {
    border-color: var(--color-primary-bg);
}

.config-card.is-default {
    border-left: 4px solid var(--color-primary-bg);
}

.config-card.has-theme {
    border-left: 4px solid #9c27b0;
}

.config-card.has-override {
    border-left: 4px solid var(--color-warning-bg);
}

.config-card.add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    cursor: pointer;
    border-style: dashed;
    color: var(--color-dimmed);
}

.config-card.add-card:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.config-card.add-theme-card {
    border-color: #9c27b0;
}

.config-card.add-theme-card:hover {
    background: oklch(90% 0.05 300);
}

.add-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.config-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.config-name {
    font-weight: 600;
    font-family: monospace;
    color: var(--color-contrast);
}

.badge {
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.75rem;
    font-weight: 600;
}

.badge-default {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.badge-theme {
    background: linear-gradient(135deg, #9c27b0, #673ab7);
    color: white;
}

.badge-override {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.parent-type-badge {
    margin-left: auto;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.75rem;
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
}

.config-labels {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.config-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin-bottom: 1rem;
}

.config-preview {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius);
}

.config-actions {
    display: flex;
    gap: 0.5rem;
}

.overrides-info {
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius);
    margin-bottom: 1.5rem;
}

.overrides-info code {
    background: var(--color-accent-bg);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
}

.override-help {
    color: var(--color-dimmed);
    margin-bottom: 1rem;
}

/* Form styles */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.form-column h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--color-contrast);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.375rem;
    font-weight: 500;
    color: var(--color-contrast);
}

.required {
    color: var(--color-negative-bg);
}

.form-select,
.form-input,
.form-textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
}

.form-hint {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.form-range {
    width: 100%;
}

.name-input-group {
    display: flex;
    align-items: center;
}

.name-prefix {
    padding: 0.5rem 0.75rem;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius) 0 0 var(--radius);
    color: var(--color-dimmed);
    font-family: monospace;
}

.name-input-group .form-input {
    border-radius: 0 var(--radius) var(--radius) 0;
}

.name-preview {
    padding: 0.5rem 0.75rem;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
}

.name-preview code {
    font-family: monospace;
    color: var(--color-primary-bg);
    font-weight: 600;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.checkbox-label input {
    width: auto;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0% 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-dialog {
    background: var(--color-popover-bg);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-dialog.modal-lg {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
    margin: 0;
    color: var(--color-contrast);
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-dimmed);
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
}

/* Button styles */
.btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
}

.btn-primary {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-color: var(--color-accent-bg);
}

.btn-primary:hover:not(:disabled) {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
}

.btn-secondary {
    background: transparent;
    color: var(--color-contrast);
}

.btn-secondary:hover {
    background: var(--color-muted-bg);
}

.btn-danger {
    background: transparent;
    color: var(--color-contrast);
}

.btn-danger:hover {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    border-color: var(--color-negative-bg);
}

.loading,
.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-dimmed);
}
</style>
