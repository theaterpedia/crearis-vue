<!-- PageConfigController.vue - Unified controller for page configuration -->
<template>
    <div class="page-config-controller">
        <!-- Header with Save/Cancel buttons -->
        <div class="controller-header">
            <h2 v-if="mode === 'project'">Homepage Configuration</h2>
            <h2 v-else>{{ formatPageType(type) }} Page Configuration</h2>

            <div class="header-actions">
                <button v-if="isDirty" class="btn btn-secondary" @click="handleCancel">Cancel</button>
                <button class="btn btn-primary" @click="handleSave" :disabled="isSaving || !isDirty">
                    {{ isSaving ? 'Saving...' : 'Save' }}
                </button>
            </div>
        </div>

        <!-- Horizontal Tabs -->
        <div class="horizontal-tabs">
            <button v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id" :disabled="!shouldShowTab(tab.id)">
                {{ tab.label }}
                <span v-if="!shouldShowTab(tab.id)" class="tab-disabled-badge">Empty</span>
            </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            <PageOptionsPanel v-if="activeTab === 'page'" v-model="pageOptions" @update:modelValue="markDirty" />
            <HeaderOptionsPanel v-if="activeTab === 'header'" v-model="headerOptions" @update:modelValue="markDirty" />
            <AsideOptionsPanel v-if="activeTab === 'aside'" v-model="asideOptions" @update:modelValue="markDirty" />
            <FooterOptionsPanel v-if="activeTab === 'footer'" v-model="footerOptions" @update:modelValue="markDirty" />
        </div>

        <!-- Loading/Error States -->
        <div v-if="isLoading" class="loading-state">Loading configuration...</div>
        <div v-if="error" class="error-state">{{ error }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import PageOptionsPanel from './PageOptionsPanel.vue'
import HeaderOptionsPanel from './HeaderOptionsPanel.vue'
import AsideOptionsPanel from './AsideOptionsPanel.vue'
import FooterOptionsPanel from './FooterOptionsPanel.vue'

interface Props {
    project: number | string  // project ID or domaincode
    type?: string  // For pages table - e.g. 'posts', 'events', 'landing', 'post-demo', 'event-conference'
    mode?: 'project' | 'pages'  // Mode: project uses projects table, pages uses pages table
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'project'
})

// State
const activeTab = ref('page')
const isDirty = ref(false)
const isSaving = ref(false)
const isLoading = ref(false)
const error = ref('')

// Options data - for project mode, these map to project table fields
const pageOptions = ref<any>({})
const headerOptions = ref<any>({})
const asideOptions = ref<any>({})
const footerOptions = ref<any>({})

// Has content flags (from database)
const pageHasContent = ref(false)
const asideHasContent = ref(false)
const headerHasContent = ref(false)
const footerHasContent = ref(false)

// Original data for comparison
const originalData = ref<any>(null)

const tabs = [
    { id: 'page', label: 'Page' },
    { id: 'header', label: 'Header' },
    { id: 'aside', label: 'Aside' },
    { id: 'footer', label: 'Footer' }
]

// Check if tab should be shown based on has_content flags
function shouldShowTab(tabId: string): boolean {
    // Always show all tabs for now - has_content flags are for optimization hints
    return true
}

function formatPageType(type?: string): string {
    if (!type) return 'Page'
    return type.charAt(0).toUpperCase() + type.slice(1)
}

function markDirty() {
    isDirty.value = true
}

// Load configuration data
async function loadConfiguration() {
    isLoading.value = true
    error.value = ''

    try {
        if (props.mode === 'project') {
            // Load from projects table
            const response = await fetch(`/api/projects/${props.project}`)
            if (!response.ok) throw new Error('Failed to load project')
            const project = await response.json()

            // Map project fields to panels
            pageOptions.value = {
                page_background: project.page_background || '',
                page_cssvars: project.page_cssvars || '',
                page_navigation: project.page_navigation || '',
                page_options_ext: typeof project.page_options_ext === 'string'
                    ? JSON.parse(project.page_options_ext || '{}')
                    : (project.page_options_ext || {})
            }

            headerOptions.value = {
                header_alert: project.header_alert || '',
                header_postit: typeof project.header_postit === 'string'
                    ? JSON.parse(project.header_postit || '{}')
                    : (project.header_postit || {}),
                header_options_ext: typeof project.header_options_ext === 'string'
                    ? JSON.parse(project.header_options_ext || '{}')
                    : (project.header_options_ext || {})
            }

            asideOptions.value = {
                aside_toc: project.aside_toc || '',
                aside_list: project.aside_list || '',
                aside_context: project.aside_context || '',
                aside_postit: typeof project.aside_postit === 'string'
                    ? JSON.parse(project.aside_postit || '{}')
                    : (project.aside_postit || {}),
                aside_options_ext: typeof project.aside_options_ext === 'string'
                    ? JSON.parse(project.aside_options_ext || '{}')
                    : (project.aside_options_ext || {})
            }

            footerOptions.value = {
                footer_gallery: project.footer_gallery || '',
                footer_slider: project.footer_slider || '',
                footer_sitemap: project.footer_sitemap || '',
                footer_postit: typeof project.footer_postit === 'string'
                    ? JSON.parse(project.footer_postit || '{}')
                    : (project.footer_postit || {}),
                footer_repeat: typeof project.footer_repeat === 'string'
                    ? JSON.parse(project.footer_repeat || '{}')
                    : (project.footer_repeat || {}),
                footer_options_ext: typeof project.footer_options_ext === 'string'
                    ? JSON.parse(project.footer_options_ext || '{}')
                    : (project.footer_options_ext || {})
            }

            // Store has_content flags
            pageHasContent.value = project.page_has_content
            asideHasContent.value = project.aside_has_content
            headerHasContent.value = project.header_has_content
            footerHasContent.value = project.footer_has_content

        } else {
            // Load from pages table
            const response = await fetch(`/api/pages/by-type?project_id=${props.project}&page_type=${props.type}`)
            if (!response.ok) {
                // Page doesn't exist yet, create it
                const createResponse = await fetch('/api/pages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: props.project,
                        page_type: props.type
                    })
                })
                if (!createResponse.ok) throw new Error('Failed to create page')
                const createData = await createResponse.json()
                const page = createData.page
                unpackPageData(page)
            } else {
                const data = await response.json()
                unpackPageData(data.page)
            }
        }

        // Store original data for dirty checking
        originalData.value = JSON.stringify({
            page: pageOptions.value,
            header: headerOptions.value,
            aside: asideOptions.value,
            footer: footerOptions.value
        })

        isDirty.value = false
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error loading configuration:', err)
    } finally {
        isLoading.value = false
    }
}

// Unpack pages table data into panels
function unpackPageData(page: any) {
    // Unpack page_options JSON
    const pageOpts = typeof page.page_options === 'string'
        ? JSON.parse(page.page_options || '{}')
        : (page.page_options || {})
    pageOptions.value = { ...pageOpts }

    // Unpack header_options JSON
    const headerOpts = typeof page.header_options === 'string'
        ? JSON.parse(page.header_options || '{}')
        : (page.header_options || {})
    headerOptions.value = { ...headerOpts }

    // Unpack aside_options JSON
    const asideOpts = typeof page.aside_options === 'string'
        ? JSON.parse(page.aside_options || '{}')
        : (page.aside_options || {})
    asideOptions.value = { ...asideOpts }

    // Unpack footer_options JSON
    const footerOpts = typeof page.footer_options === 'string'
        ? JSON.parse(page.footer_options || '{}')
        : (page.footer_options || {})
    footerOptions.value = { ...footerOpts }

    // Store has_content flags
    pageHasContent.value = page.page_has_content
    asideHasContent.value = page.aside_has_content
    headerHasContent.value = page.header_has_content
    footerHasContent.value = page.footer_has_content
}

// Save configuration
async function handleSave() {
    isSaving.value = true
    error.value = ''

    try {
        if (props.mode === 'project') {
            // Save to projects table
            const response = await fetch(`/api/projects/${props.project}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_background: pageOptions.value.page_background,
                    page_cssvars: pageOptions.value.page_cssvars,
                    page_navigation: pageOptions.value.page_navigation,
                    page_options_ext: pageOptions.value.page_options_ext,
                    header_alert: headerOptions.value.header_alert,
                    header_postit: headerOptions.value.header_postit,
                    header_options_ext: headerOptions.value.header_options_ext,
                    aside_toc: asideOptions.value.aside_toc,
                    aside_list: asideOptions.value.aside_list,
                    aside_context: asideOptions.value.aside_context,
                    aside_postit: asideOptions.value.aside_postit,
                    aside_options_ext: asideOptions.value.aside_options_ext,
                    footer_gallery: footerOptions.value.footer_gallery,
                    footer_slider: footerOptions.value.footer_slider,
                    footer_sitemap: footerOptions.value.footer_sitemap,
                    footer_postit: footerOptions.value.footer_postit,
                    footer_repeat: footerOptions.value.footer_repeat,
                    footer_options_ext: footerOptions.value.footer_options_ext
                })
            })

            if (!response.ok) throw new Error('Failed to save project configuration')
        } else {
            // Save to pages table - need to get page ID first
            const getResponse = await fetch(`/api/pages/by-type?project_id=${props.project}&page_type=${props.type}`)
            if (!getResponse.ok) throw new Error('Page not found')
            const getData = await getResponse.json()
            const pageId = getData.page.id

            const response = await fetch(`/api/pages/${pageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_options: pageOptions.value,
                    header_options: headerOptions.value,
                    aside_options: asideOptions.value,
                    footer_options: footerOptions.value
                })
            })

            if (!response.ok) throw new Error('Failed to save page configuration')
        }

        // Update original data
        originalData.value = JSON.stringify({
            page: pageOptions.value,
            header: headerOptions.value,
            aside: asideOptions.value,
            footer: footerOptions.value
        })

        isDirty.value = false
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error saving configuration:', err)
    } finally {
        isSaving.value = false
    }
}

// Cancel changes
function handleCancel() {
    if (originalData.value) {
        const data = JSON.parse(originalData.value)
        pageOptions.value = { ...data.page }
        headerOptions.value = { ...data.header }
        asideOptions.value = { ...data.aside }
        footerOptions.value = { ...data.footer }
        isDirty.value = false
    }
}

onMounted(() => {
    loadConfiguration()
})
</script>

<style scoped>
.page-config-controller {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-card-bg);
}

.controller-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.controller-header h2 {
    font-family: var(--headings);
    font-size: 1.5rem;
    color: var(--color-card-contrast);
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-family: var(--headings);
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.btn-primary:hover:not(:disabled) {
    opacity: 0.9;
}

.btn-secondary {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.btn-secondary:hover {
    opacity: 0.9;
}

.horizontal-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem 0;
    border-bottom: 2px solid var(--color-border);
}

.tab-button {
    position: relative;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-family: var(--headings);
    font-weight: 500;
    color: var(--color-dimmed);
    cursor: pointer;
    transition: all 0.2s;
}

.tab-button:hover:not(:disabled) {
    color: var(--color-card-contrast);
    background: var(--color-bg-soft);
}

.tab-button.active {
    color: var(--color-accent-bg);
    border-bottom-color: var(--color-accent-bg);
}

.tab-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-disabled-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
    font-size: 0.75rem;
    border-radius: 0.25rem;
}

.tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.loading-state,
.error-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
}

.error-state {
    color: var(--color-error, #ef4444);
}
</style>
