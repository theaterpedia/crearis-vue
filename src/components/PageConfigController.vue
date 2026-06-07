<!-- PageConfigController.vue - Unified controller for page configuration -->
<template>
    <div class="page-config-controller">
        <!-- Header with Save/Cancel buttons -->
        <div class="controller-header">
            <h2 v-if="mode === 'project'">Homepage Configuration</h2>
            <h2 v-else>{{ formatPageType(type) }} Page Configuration</h2>

            <div class="header-actions">
                <!-- Preview Toggles (session-only) -->
                <div class="preview-toggles">
                    <label class="toggle-label" title="Show draft/confirmed entities (not just released)">
                        <input type="checkbox" v-model="previewEntities" />
                        <span>Preview Entities</span>
                    </label>
                    <label class="toggle-label" title="Show entities from draft/confirmed projects">
                        <input type="checkbox" v-model="previewProjects" />
                        <span>Preview Projects</span>
                    </label>
                </div>

                <div class="action-buttons">
                    <button v-if="config.isDirty.value" class="btn btn-secondary" @click="config.cancel">
                        Cancel
                    </button>
                    <button class="btn btn-primary" @click="config.save"
                        :disabled="config.isSaving.value || !config.isDirty.value">
                        {{ config.isSaving.value ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Horizontal Tabs -->
        <div class="horizontal-tabs">
            <button v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                {{ tab.label }}
            </button>
        </div>

        <!-- Tab Content with Split View (Config + Preview) -->
        <div class="tab-content-split">
            <!-- Config Panel (left) -->
            <div class="config-panel">
                <PageOptionsPanel v-if="activeTab === 'page'" v-model="config.pageOptions.value" />
                <HeaderOptionsPanel v-if="activeTab === 'header'" v-model="config.headerOptions.value" />
                <AsideOptionsPanel v-if="activeTab === 'aside'" v-model="config.asideOptions.value" />
                <FooterOptionsPanel v-if="activeTab === 'footer'" v-model="config.footerOptions.value" />
            </div>

            <!-- Preview Panel (right) -->
            <div class="preview-panel">
                <div class="preview-header">
                    <h4>Live Preview</h4>
                    <span class="preview-mode-badge" :class="{ active: previewEntities || previewProjects }">
                        {{ previewModeLabel }}
                    </span>
                </div>

                <!-- Aside Preview: pList with posts -->
                <div v-if="activeTab === 'aside'" class="preview-content">
                    <div class="preview-section">
                        <h5>List Preview (Posts)</h5>
                        <pList entity="posts" :project="projectDomaincode" :status-gt="statusFilter.statusGt"
                            :status-lt="statusFilter.statusLt" :alpha-preview="previewEntities" size="small"
                            variant="default" anatomy="bottomimage" on-activate="modal" />
                    </div>
                </div>

                <!-- Footer Preview: pGallery with events -->
                <div v-if="activeTab === 'footer'" class="preview-content">
                    <div class="preview-section">
                        <h5>Gallery Preview (Events)</h5>
                        <pGallery entity="events" :project="projectDomaincode" :status-gt="statusFilter.statusGt"
                            :status-lt="statusFilter.statusLt" :alpha-preview="previewEntities" item-type="card"
                            size="small" variant="default" anatomy="topimage" on-activate="modal" />
                    </div>
                </div>

                <!-- Page Preview: Post-it + Alert -->
                <div v-if="activeTab === 'page'" class="preview-content">
                    <div class="preview-section">
                        <h5>Page Background</h5>
                        <div class="page-bg-preview"
                            :style="{ background: config.pageOptions.value.page_background || '#f5f5f5' }">
                            <span>{{ config.pageOptions.value.page_background || 'No background set' }}</span>
                        </div>
                    </div>
                    <div class="preview-section">
                        <h5>CSS Variables</h5>
                        <pre class="css-vars-preview">{{ config.pageOptions.value.page_cssvars || '(none)' }}</pre>
                    </div>
                </div>

                <!-- Header Preview: Alert + Post-it -->
                <div v-if="activeTab === 'header'" class="preview-content">
                    <div v-if="config.headerOptions.value.header_alert" class="preview-section">
                        <h5>Alert Banner</h5>
                        <div class="alert-preview">
                            {{ config.headerOptions.value.header_alert }}
                        </div>
                    </div>
                    <div v-if="config.headerOptions.value.header_postit?.enabled" class="preview-section">
                        <h5>Header Post-it</h5>
                        <div class="postit-preview"
                            :class="config.headerOptions.value.header_postit?.color || 'yellow'">
                            <strong>{{ config.headerOptions.value.header_postit?.title || 'Post-it' }}</strong>
                            <p>{{ config.headerOptions.value.header_postit?.content || '' }}</p>
                        </div>
                    </div>
                    <div v-if="!config.headerOptions.value.header_alert && !config.headerOptions.value.header_postit?.enabled"
                        class="preview-empty">
                        No header content configured
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading/Error States -->
        <div v-if="config.isLoading.value" class="loading-state">
            Loading configuration...
        </div>
        <div v-if="config.error.value" class="error-state">
            {{ config.error.value }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePageConfig, getStatusFilter } from '@/composables/usePageConfig'
import PageOptionsPanel from './PageOptionsPanel.vue'
import HeaderOptionsPanel from './HeaderOptionsPanel.vue'
import AsideOptionsPanel from './AsideOptionsPanel.vue'
import FooterOptionsPanel from './FooterOptionsPanel.vue'
import pList from './page/pList.vue'
import pGallery from './page/pGallery.vue'

interface Props {
    project: number | string
    type?: string
    mode?: 'project' | 'pages'
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'project'
})

// Use the composable
const config = usePageConfig(props.project, props.mode, props.type)

// Local UI state
const activeTab = ref('page')

// Preview toggles (session-only, not persisted)
const previewEntities = ref(false)
const previewProjects = ref(false)

// Computed: status filter based on preview toggles
const statusFilter = computed(() => getStatusFilter(previewEntities.value))

// Computed: preview mode label
const previewModeLabel = computed(() => {
    if (previewEntities.value && previewProjects.value) {
        return 'All (Draft+Confirmed+Released)'
    }
    if (previewEntities.value) {
        return 'Preview Entities'
    }
    if (previewProjects.value) {
        return 'Preview Projects'
    }
    return 'Public Only'
})

// Get project domaincode for pList/pGallery
const projectDomaincode = computed(() => {
    return typeof props.project === 'string' ? props.project : String(props.project)
})

const tabs = [
    { id: 'page', label: 'Page' },
    { id: 'header', label: 'Header' },
    { id: 'aside', label: 'Aside' },
    { id: 'footer', label: 'Footer' }
]

function formatPageType(type?: string): string {
    if (!type) return 'Page'
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
}

onMounted(() => {
    config.load()
})
</script>

<style scoped>
/* ===== PAGE CONFIG CONTROLLER ===== */

/* --- Layout --- */
.page-config-controller {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-card-bg);
}

/* --- Header --- */
.controller-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: var(--border-small) solid var(--color-border);
    flex-wrap: wrap;
    gap: 1rem;
}

.controller-header h2 {
    font-family: var(--headings);
    font-size: 1.5rem;
    color: var(--color-card-contrast);
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

/* --- Preview Toggles --- */
.preview-toggles {
    display: flex;
    gap: 1rem;
    padding-right: 1rem;
    border-right: var(--border-small) solid var(--color-border);
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-dimmed);
    cursor: pointer;
    transition: var(--transition);
}

.toggle-label input[type="checkbox"] {
    accent-color: var(--color-primary-bg);
}

.toggle-label:hover {
    color: var(--color-card-contrast);
}

/* --- Action Buttons --- */
.action-buttons {
    display: flex;
    gap: 0.75rem;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--radius-small);
    font-family: var(--headings);
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
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
    opacity: 0.85;
}

.btn-secondary {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.btn-secondary:hover:not(:disabled) {
    opacity: 0.85;
}

/* --- Horizontal Tabs --- */
.horizontal-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem 0;
    border-bottom: var(--border-medium) solid var(--color-border);
}

.tab-button {
    position: relative;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: var(--border-large) solid transparent;
    font-family: var(--headings);
    font-weight: 500;
    color: var(--color-dimmed);
    cursor: pointer;
    transition: var(--transition);
}

.tab-button:hover {
    color: var(--color-card-contrast);
    background: var(--color-muted-bg);
}

.tab-button.active {
    color: var(--color-primary-bg);
    border-bottom-color: var(--color-primary-bg);
}

/* ===== SPLIT VIEW LAYOUT ===== */

.tab-content-split {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.0625rem;
    background: var(--color-border);
    overflow: hidden;
}

.config-panel {
    background: var(--color-card-bg);
    overflow-y: auto;
    padding: 1.5rem;
}

.preview-panel {
    background: var(--color-muted-bg);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* --- Preview Header --- */
.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: var(--border-small) solid var(--color-border);
    background: var(--color-card-bg);
}

.preview-header h4 {
    margin: 0;
    font-family: var(--headings);
    font-size: 1rem;
    color: var(--color-card-contrast);
}

.preview-mode-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-large);
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
    transition: var(--transition);
}

.preview-mode-badge.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* --- Preview Content --- */
.preview-content {
    flex: 1;
    padding: 1rem;
}

.preview-section {
    margin-bottom: 1.5rem;
}

.preview-section h5 {
    margin: 0 0 0.75rem;
    font-family: var(--headings);
    font-size: 0.875rem;
    color: var(--color-dimmed);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.preview-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    font-style: italic;
}

/* ===== PAGE PREVIEW STYLES ===== */

.page-bg-preview {
    padding: 2rem;
    border-radius: var(--radius-medium);
    text-align: center;
    color: var(--color-card-contrast);
    border: var(--border-small) solid var(--color-border);
}

.css-vars-preview {
    padding: 1rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    font-family: monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
    overflow-x: auto;
}

/* ===== ALERT PREVIEW ===== */

.alert-preview {
    padding: 1rem;
    background: var(--color-warning-bg);
    border-left: var(--border-large) solid oklch(75% 0.18 85);
    border-radius: var(--radius-small);
    color: var(--color-warning-contrast);
}

/* ===== POST-IT PREVIEW ===== */

.postit-preview {
    padding: 1rem;
    border-radius: var(--radius-small);
    box-shadow: var(--theme-shadow);
}

.postit-preview.yellow {
    background: oklch(96% 0.08 95);
}

.postit-preview.blue {
    background: oklch(94% 0.06 250);
}

.postit-preview.green {
    background: oklch(95% 0.08 145);
}

.postit-preview.pink {
    background: oklch(95% 0.08 350);
}

.postit-preview strong {
    display: block;
    margin-bottom: 0.5rem;
}

.postit-preview p {
    margin: 0;
    font-size: 0.875rem;
}

/* ===== STATES ===== */

.loading-state,
.error-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
}

.error-state {
    color: var(--color-negative-bg);
}

/* ===== RESPONSIVE ===== */

@media (max-width: 64rem) {
    .tab-content-split {
        grid-template-columns: 1fr;
    }

    .preview-panel {
        max-height: 25rem;
    }
}
</style>
