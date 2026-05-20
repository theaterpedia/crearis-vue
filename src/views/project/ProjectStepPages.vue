<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Page-Varianten verwalten</h3>
            <p class="step-subtitle">Definiere Aside, Footer und Seitenoptionen für verschiedene Inhaltstypen</p>
        </div>

        <div class="step-content">
            <!-- Info Box -->
            <div class="info-box">
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z">
                    </path>
                </svg>
                <span>Page-Varianten erlauben spezielle Konfigurationen für Posts und Events.
                    Die xmlid bestimmt die Variante (z.B. <code>opus1.post-demo.my_slug</code> → Variante "post-demo").
                </span>
            </div>

            <!-- Pages List -->
            <div class="pages-list">
                <div v-if="isLoading" class="loading-state">
                    <span>Lade Page-Einträge...</span>
                </div>

                <div v-else-if="pages.length === 0" class="empty-state">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z">
                        </path>
                    </svg>
                    <p>Noch keine Page-Varianten definiert.</p>
                    <p class="hint">Projekt-Defaults werden für alle Posts und Events verwendet.</p>
                </div>

                <!-- Page Entries -->
                <div v-else class="page-entries">
                    <div v-for="page in pages" :key="page.id" class="page-entry"
                        :class="{ selected: selectedPageId === page.id }" @click="selectPage(page)">
                        <div class="page-entry-info">
                            <span class="page-type">{{ formatPageType(page.page_type) }}</span>
                            <span v-if="isBaseType(page.page_type)" class="badge base-badge">Basis</span>
                            <span v-else class="badge variant-badge">Variante</span>
                        </div>
                        <div class="page-entry-actions">
                            <button class="icon-btn edit-btn" @click.stop="editPage(page)" title="Bearbeiten">
                                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.68,152a15.86,15.86,0,0,0-4.68,11.31V208a16,16,0,0,0,16,16H92.69a15.86,15.86,0,0,0,11.31-4.68L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120Z">
                                    </path>
                                </svg>
                            </button>
                            <button class="icon-btn delete-btn" @click.stop="deletePage(page)" title="Löschen">
                                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                                    </path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add New Page Entry -->
            <div class="add-page-section">
                <h4>Neue Page-Variante erstellen</h4>
                <div class="add-page-form">
                    <div class="form-group">
                        <label>Basis-Typ</label>
                        <select v-model="newPage.baseType">
                            <option value="post">Post</option>
                            <option value="event">Event</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Variante (optional)</label>
                        <input type="text" v-model="newPage.variant" placeholder="z.B. demo, conference"
                            @input="sanitizeVariant">
                        <span class="hint">Nur Kleinbuchstaben und Bindestriche erlaubt</span>
                    </div>
                    <div class="form-group result-preview">
                        <label>Ergebnis page_type:</label>
                        <code>{{ computedPageType }}</code>
                    </div>
                    <button class="add-btn" @click="createPageEntry" :disabled="isCreating || !canCreate">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                            </path>
                        </svg>
                        {{ isCreating ? 'Erstelle...' : 'Erstellen' }}
                    </button>
                </div>
            </div>

            <!-- Selected Page Config -->
            <div v-if="selectedPage && projectId" class="selected-page-config">
                <h4>Konfiguration: {{ formatPageType(selectedPage.page_type) }}</h4>
                <PageConfigController :key="`page-${selectedPage.id}`" :project="projectId"
                    :type="selectedPage.page_type" mode="pages" />
            </div>
        </div>

        <div class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                Zurück
            </button>
            <button class="action-btn success-btn" @click="handleNext">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69l-58.35-58.34a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
                Weiter
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageConfigController from '@/components/PageConfigController.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

interface Emits {
    (e: 'prev'): void
    (e: 'next'): void
}

interface PageEntry {
    id: number
    project: number
    page_type: string
    page_options?: any
    aside_options?: any
    footer_options?: any
    header_options?: any
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})
const emit = defineEmits<Emits>()

// State
const pages = ref<PageEntry[]>([])
const isLoading = ref(true)
const isCreating = ref(false)
const selectedPageId = ref<number | null>(null)
const newPage = ref({
    baseType: 'post' as 'post' | 'event',
    variant: ''
})

// Computed
const selectedPage = computed(() => {
    return pages.value.find(p => p.id === selectedPageId.value) || null
})

const computedPageType = computed(() => {
    const base = newPage.value.baseType
    const variant = newPage.value.variant.trim()
    return variant ? `${base}-${variant}` : base
})

const canCreate = computed(() => {
    const pageType = computedPageType.value
    // Check if page_type already exists
    return !pages.value.some(p => p.page_type === pageType)
})

// Base types (no variant)
const BASE_TYPES = ['post', 'event', 'project', 'landing']

function isBaseType(pageType: string): boolean {
    return BASE_TYPES.includes(pageType)
}

function formatPageType(pageType: string): string {
    // post-demo → Post (Demo)
    // event-conference → Event (Conference)
    const parts = pageType.split('-')
    if (parts.length === 1) {
        return pageType.charAt(0).toUpperCase() + pageType.slice(1)
    }
    const base = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const variant = parts.slice(1).join('-')
    return `${base} (${variant})`
}

function sanitizeVariant() {
    // Only allow lowercase letters and hyphens
    newPage.value.variant = newPage.value.variant
        .toLowerCase()
        .replace(/[^a-z-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
}

// Load pages
async function loadPages() {
    isLoading.value = true
    try {
        const response = await fetch(`/api/pages/by-project?project_id=${props.projectId}`)
        if (response.ok) {
            const data = await response.json()
            pages.value = data.pages || []
            // Exclude landing from display (managed in ProjectStepLanding)
            pages.value = pages.value.filter(p => p.page_type !== 'landing')
        } else {
            pages.value = []
        }
    } catch (e) {
        console.error('Error loading pages:', e)
        pages.value = []
    } finally {
        isLoading.value = false
    }
}

// Create new page entry
async function createPageEntry() {
    if (!canCreate.value) return

    isCreating.value = true
    try {
        const response = await fetch('/api/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: props.projectId,
                page_type: computedPageType.value
            })
        })

        if (response.ok) {
            const data = await response.json()
            pages.value.push(data.page)
            // Reset form
            newPage.value.variant = ''
            // Select the new page
            selectedPageId.value = data.page.id
        } else {
            const data = await response.json()
            console.error('Failed to create page:', data.message)
        }
    } catch (e) {
        console.error('Error creating page:', e)
    } finally {
        isCreating.value = false
    }
}

// Delete page entry
async function deletePage(page: PageEntry) {
    if (!confirm(`Page-Variante "${formatPageType(page.page_type)}" wirklich löschen?`)) {
        return
    }

    try {
        const response = await fetch(`/api/pages/${page.id}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            pages.value = pages.value.filter(p => p.id !== page.id)
            if (selectedPageId.value === page.id) {
                selectedPageId.value = null
            }
        } else {
            const data = await response.json()
            console.error('Failed to delete page:', data.message)
        }
    } catch (e) {
        console.error('Error deleting page:', e)
    }
}

function selectPage(page: PageEntry) {
    selectedPageId.value = selectedPageId.value === page.id ? null : page.id
}

function editPage(page: PageEntry) {
    selectedPageId.value = page.id
}

function handlePrev() {
    emit('prev')
}

function handleNext() {
    emit('next')
}

onMounted(() => {
    loadPages()
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

.step-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
    min-height: 300px;
}

.info-box {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-info-bg, #e0f2fe);
    color: var(--color-info-contrast, #0369a1);
    border-radius: var(--radius-card);
    font-size: 0.875rem;
    line-height: 1.5;
}

.info-box svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.info-box code {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: monospace;
}

.pages-list {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    overflow: hidden;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--color-dimmed);
    text-align: center;
}

.empty-state svg {
    opacity: 0.4;
    margin-bottom: 1rem;
}

.empty-state p {
    margin: 0 0 0.25rem 0;
}

.empty-state .hint {
    font-size: 0.75rem;
    opacity: 0.7;
}

.page-entries {
    display: flex;
    flex-direction: column;
}

.page-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: var(--border) solid var(--color-border);
    cursor: pointer;
    transition: background 0.2s;
}

.page-entry:last-child {
    border-bottom: none;
}

.page-entry:hover {
    background: var(--color-bg-soft);
}

.page-entry.selected {
    background: var(--color-project-muted, rgba(var(--color-project-rgb), 0.1));
}

.page-entry-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.page-type {
    font-weight: 500;
}

.badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    text-transform: uppercase;
    font-weight: 600;
}

.base-badge {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.variant-badge {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.page-entry-actions {
    display: flex;
    gap: 0.5rem;
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-button);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: var(--color-bg-soft);
}

.delete-btn:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger-contrast);
}

.add-page-section {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 1.25rem;
}

.add-page-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--color-contrast);
}

.add-page-form {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.form-group label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-dimmed);
}

.form-group select,
.form-group input {
    padding: 0.5rem 0.75rem;
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.875rem;
}

.form-group select {
    min-width: 120px;
}

.form-group input {
    min-width: 180px;
}

.form-group .hint {
    font-size: 0.625rem;
    color: var(--color-dimmed);
}

.result-preview {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-soft);
    border-radius: var(--radius-button);
}

.result-preview label {
    font-size: 0.75rem;
}

.result-preview code {
    font-family: monospace;
    font-weight: 600;
    color: var(--color-project);
}

.add-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-project);
    color: white;
    border: none;
    border-radius: var(--radius-button);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.selected-page-config {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    overflow: hidden;
}

.selected-page-config h4 {
    padding: 1rem;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    background: var(--color-bg-soft);
    border-bottom: var(--border) solid var(--color-border);
}

.step-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.success-btn {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.success-btn:hover {
    opacity: 0.9;
}

.secondary-btn {
    background: var(--color-bg-soft);
    color: var(--color-contrast);
}

.secondary-btn:hover {
    background: var(--color-muted-bg);
}
</style>
