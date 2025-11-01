<template>
    <div class="cimg-import">
        <div class="import-header">
            <h3>Batch Import Images</h3>
            <p class="import-description">
                Import multiple images at once. Enter one URL per line or paste a CSV/JSON format.
            </p>
        </div>

        <div class="import-body">
            <!-- Input Mode Toggle -->
            <div class="mode-selector">
                <button v-for="mode in modes" :key="mode.value"
                    :class="['mode-btn', { active: inputMode === mode.value }]" @click="inputMode = mode.value">
                    {{ mode.label }}
                </button>
            </div>

            <!-- Text Input Mode -->
            <div v-if="inputMode === 'text'" class="input-section">
                <label for="urls-input" class="input-label">
                    Image URLs (one per line)
                </label>
                <textarea id="urls-input" v-model="urlsText" class="urls-textarea"
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png&#10;https://example.com/image3.webp"
                    rows="10"></textarea>
                <p class="input-hint">
                    {{ parsedUrls.length }} URL(s) detected
                </p>
            </div>

            <!-- CSV Input Mode -->
            <div v-if="inputMode === 'csv'" class="input-section">
                <label for="csv-input" class="input-label">
                    CSV Format (name, url, domaincode, tags)
                </label>
                <textarea id="csv-input" v-model="csvText" class="urls-textarea"
                    placeholder="Image Name,https://example.com/image.jpg,project1,portrait&#10;Another Image,https://example.com/photo.png,project2,group"
                    rows="10"></textarea>
                <p class="input-hint">
                    {{ parsedCsvRows.length }} row(s) detected
                </p>
            </div>

            <!-- JSON Input Mode -->
            <div v-if="inputMode === 'json'" class="input-section">
                <label for="json-input" class="input-label">
                    JSON Array
                </label>
                <textarea id="json-input" v-model="jsonText" class="urls-textarea"
                    placeholder='[&#10;  {"name": "Image 1", "url": "https://example.com/img1.jpg"},&#10;  {"name": "Image 2", "url": "https://example.com/img2.png"}&#10;]'
                    rows="10"></textarea>
                <p v-if="jsonError" class="input-error">{{ jsonError }}</p>
                <p v-else class="input-hint">
                    {{ parsedJsonItems.length }} item(s) detected
                </p>
            </div>

            <!-- Default Options -->
            <div class="options-section">
                <h4>Default Options</h4>
                <div class="options-grid">
                    <div class="option-field">
                        <label for="default-project">Project (domaincode)</label>
                        <div class="autocomplete-wrapper">
                            <input id="default-project" v-model="defaultOptions.domaincode" type="text"
                                placeholder="project_name" @input="handleProjectInput"
                                @focus="showProjectDropdown = true" @blur="hideProjectDropdown" />
                            <div v-if="showProjectDropdown && filteredProjects.length > 0"
                                class="autocomplete-dropdown">
                                <div v-for="project in filteredProjects" :key="project" class="autocomplete-item"
                                    @mousedown.prevent="selectProject(project)">
                                    {{ project }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="option-field">
                        <label for="default-owner">Owner (email/username)</label>
                        <div class="autocomplete-wrapper">
                            <input id="default-owner" v-model="defaultOptions.owner" type="text"
                                placeholder="user@example.com" @input="handleOwnerInput" @focus="handleOwnerFocus"
                                @blur="hideOwnerDropdown" />
                            <div v-if="showOwnerDropdown && filteredUsers.length > 0"
                                class="autocomplete-dropdown owner-dropdown">
                                <div v-for="user in filteredUsers" :key="user.id" class="autocomplete-item"
                                    @mousedown.prevent="selectUser(user)">
                                    <div class="user-option">
                                        <span class="user-email">{{ user.sysmail }}</span>
                                        <span v-if="user.extmail" class="user-extmail">({{ user.extmail }})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="option-field">
                        <label for="default-status">Status</label>
                        <select id="default-status" v-model="defaultOptions.status_id">
                            <option :value="0">New</option>
                            <option :value="1">Demo</option>
                            <option :value="2">Draft</option>
                            <option :value="4">Done</option>
                        </select>
                    </div>

                    <div class="option-field full-width">
                        <label>Tags</label>
                        <cimg-tags v-model="defaultOptions.tags" />
                    </div>

                    <div class="option-field">
                        <label>
                            <input v-model="defaultOptions.is_public" type="checkbox" />
                            Public
                        </label>
                    </div>
                </div>
            </div>

            <!-- Preview -->
            <div v-if="itemsToImport.length > 0" class="preview-section">
                <h4>Preview ({{ itemsToImport.length }} images)</h4>
                <div class="preview-list">
                    <div v-for="(item, index) in itemsToImport.slice(0, 10)" :key="index" class="preview-item">
                        <div class="preview-index">{{ index + 1 }}</div>
                        <div class="preview-details">
                            <div class="preview-name">{{ item.name }}</div>
                            <div class="preview-url">{{ item.url }}</div>
                        </div>
                    </div>
                    <div v-if="itemsToImport.length > 10" class="preview-more">
                        ... and {{ itemsToImport.length - 10 }} more
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="import-actions">
            <button @click="handleImport" :disabled="importing || itemsToImport.length === 0"
                class="action-btn primary">
                {{ importing ? 'Importing...' : `Import ${itemsToImport.length} Images` }}
            </button>
            <button @click="handleReset" class="action-btn">
                Reset
            </button>
            <button v-if="closeable" @click="$emit('close')" class="action-btn">
                Cancel
            </button>
        </div>

        <!-- Results -->
        <div v-if="importResults" class="results-section">
            <div class="results-header">
                <h4>Import Results</h4>
            </div>
            <div class="results-summary">
                <div class="result-stat success">
                    ✓ {{ importResults.imported }} Imported
                </div>
                <div v-if="importResults.failed > 0" class="result-stat error">
                    ✗ {{ importResults.failed }} Failed
                </div>
            </div>
            <div v-if="importResults.results.failed.length > 0" class="errors-list">
                <h5>Errors:</h5>
                <div v-for="failure in importResults.results.failed" :key="failure.index" class="error-item">
                    <strong>Row {{ failure.index + 1 }}:</strong> {{ failure.error }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CimgTags from './cimgTags.vue'

/**
 * CimgImport Component
 * 
 * Batch import images from URLs with metadata
 * Supports text, CSV, and JSON input formats
 */

interface Props {
    closeable?: boolean
}

interface Emits {
    (e: 'close'): void
    (e: 'imported', results: any): void
}

withDefaults(defineProps<Props>(), {
    closeable: false
})

const emit = defineEmits<Emits>()

// Input modes
const modes = [
    { value: 'text', label: 'URLs' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' }
]

const inputMode = ref<'text' | 'csv' | 'json'>('text')
const urlsText = ref('')
const csvText = ref('')
const jsonText = ref('')
const jsonError = ref('')
const importing = ref(false)
const importResults = ref<any>(null)

// Autocomplete state
const showProjectDropdown = ref(false)
const showOwnerDropdown = ref(false)
const projects = ref<string[]>([])
const users = ref<Array<{ id: number; sysmail: string; extmail: string | null }>>([])

// Default options
const defaultOptions = ref({
    domaincode: '',
    owner: '',
    status_id: 0,
    tags: 0,
    is_public: false
})

// Parse URLs from text
const parsedUrls = computed(() => {
    if (!urlsText.value.trim()) return []
    return urlsText.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.startsWith('http'))
})

// Parse CSV rows
const parsedCsvRows = computed(() => {
    if (!csvText.value.trim()) return []

    return csvText.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
            const parts = line.split(',').map(p => p.trim())
            return {
                name: parts[0] || '',
                url: parts[1] || '',
                domaincode: parts[2] || '',
                tags: parts[3] || ''
            }
        })
        .filter(row => row.url && row.url.startsWith('http'))
})

// Parse JSON
const parsedJsonItems = computed(() => {
    if (!jsonText.value.trim()) return []

    try {
        jsonError.value = ''
        const parsed = JSON.parse(jsonText.value)
        if (!Array.isArray(parsed)) {
            jsonError.value = 'JSON must be an array'
            return []
        }
        return parsed.filter((item: any) => item.url)
    } catch (err) {
        jsonError.value = err instanceof Error ? err.message : 'Invalid JSON'
        return []
    }
})

// Filtered projects based on input
const filteredProjects = computed(() => {
    const search = defaultOptions.value.domaincode.toLowerCase()
    if (search.length === 0) return []
    return projects.value.filter(project =>
        project.toLowerCase().includes(search)
    ).slice(0, 10) // Limit to 10 results
})

// Filtered users based on input
const filteredUsers = computed(() => {
    const search = defaultOptions.value.owner.toLowerCase()
    // Only show dropdown after '.' or '@' is entered
    if (!search.includes('.') && !search.includes('@')) return []

    return users.value.filter(user => {
        const sysmailMatch = user.sysmail.toLowerCase().includes(search)
        const extmailMatch = user.extmail?.toLowerCase().includes(search)
        return sysmailMatch || extmailMatch
    }).slice(0, 10) // Limit to 10 results
})

// Load projects from API
const loadProjects = async () => {
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            // API returns { projects: [...], count: ... }
            const projectList = data.projects || data
            projects.value = projectList.map((p: any) => p.domaincode).filter(Boolean)
        }
    } catch (err) {
        console.error('Failed to load projects:', err)
    }
}

// Load users from API
const loadUsers = async () => {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const data = await response.json()
            users.value = data.map((u: any) => ({
                id: u.id,
                sysmail: u.sysmail,
                extmail: u.extmail || null
            }))
        }
    } catch (err) {
        console.error('Failed to load users:', err)
    }
}

// Handle project input
const handleProjectInput = () => {
    if (defaultOptions.value.domaincode.length > 0) {
        showProjectDropdown.value = true
    }
}

// Handle owner input
const handleOwnerInput = () => {
    const value = defaultOptions.value.owner
    if (value.includes('.') || value.includes('@')) {
        showOwnerDropdown.value = true
    } else {
        showOwnerDropdown.value = false
    }
}

// Handle owner focus
const handleOwnerFocus = () => {
    const value = defaultOptions.value.owner
    if (value.includes('.') || value.includes('@')) {
        showOwnerDropdown.value = true
    }
}

// Select project from dropdown
const selectProject = (project: string) => {
    defaultOptions.value.domaincode = project
    showProjectDropdown.value = false
}

// Select user from dropdown
const selectUser = (user: { id: number; sysmail: string; extmail: string | null }) => {
    defaultOptions.value.owner = user.sysmail
    showOwnerDropdown.value = false
}

// Hide dropdowns with delay for click handling
const hideProjectDropdown = () => {
    setTimeout(() => {
        showProjectDropdown.value = false
    }, 200)
}

const hideOwnerDropdown = () => {
    setTimeout(() => {
        showOwnerDropdown.value = false
    }, 200)
}

// Convert tag names to bitmatrix
const tagNamesToBits = (tagNames: string): number => {
    const tagMap: Record<string, number> = {
        adult: 1,
        teen: 2,
        child: 4,
        group: 8,
        portrait: 16,
        detail: 32,
        location: 64,
        system: 128
    }

    let bits = 0
    const names = tagNames.toLowerCase().split(/[,;|]/).map(n => n.trim())

    for (const name of names) {
        if (tagMap[name]) {
            bits |= tagMap[name]
        }
    }

    return bits
}

// Extract filename from URL
const extractNameFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const filename = pathname.split('/').pop() || 'image'
        return filename.replace(/\.[^.]+$/, '') // Remove extension
    } catch {
        return 'image'
    }
}

// Items to import
const itemsToImport = computed(() => {
    const items: any[] = []

    if (inputMode.value === 'text') {
        for (const url of parsedUrls.value) {
            items.push({
                name: extractNameFromUrl(url),
                url,
                ...defaultOptions.value
            })
        }
    } else if (inputMode.value === 'csv') {
        for (const row of parsedCsvRows.value) {
            items.push({
                name: row.name || extractNameFromUrl(row.url),
                url: row.url,
                domaincode: row.domaincode || defaultOptions.value.domaincode,
                tags: row.tags ? tagNamesToBits(row.tags) : defaultOptions.value.tags,
                owner: defaultOptions.value.owner,
                status_id: defaultOptions.value.status_id,
                is_public: defaultOptions.value.is_public
            })
        }
    } else if (inputMode.value === 'json') {
        for (const item of parsedJsonItems.value) {
            items.push({
                ...defaultOptions.value,
                ...item,
                name: item.name || extractNameFromUrl(item.url)
            })
        }
    }

    return items
})

// Handle import
const handleImport = async () => {
    if (itemsToImport.value.length === 0) return

    importing.value = true
    importResults.value = null

    try {
        const response = await fetch('/api/images/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: itemsToImport.value
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const results = await response.json()
        importResults.value = results

        emit('imported', results)

        // Auto-reset on success if no failures
        if (results.failed === 0) {
            setTimeout(() => {
                handleReset()
            }, 2000)
        }
    } catch (error) {
        console.error('Import error:', error)
        importResults.value = {
            success: false,
            imported: 0,
            failed: itemsToImport.value.length,
            total: itemsToImport.value.length,
            results: {
                success: [],
                failed: [{
                    index: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }]
            }
        }
    } finally {
        importing.value = false
    }
}

// Handle reset
const handleReset = () => {
    urlsText.value = ''
    csvText.value = ''
    jsonText.value = ''
    jsonError.value = ''
    importResults.value = null
    defaultOptions.value = {
        domaincode: '',
        owner: '',
        status_id: 0,
        tags: 0,
        is_public: false
    }
}

// Load data on mount
onMounted(() => {
    loadProjects()
    loadUsers()
})
</script>

<style scoped>
.cimg-import {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
}

.import-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.import-description {
    margin: 0;
    color: var(--color-text-secondary, #666);
}

.import-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.mode-selector {
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid var(--color-border, #ddd);
}

.mode-btn {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-weight: 500;
    color: var(--color-text-secondary, #666);
    margin-bottom: -2px;
    transition: all 0.2s;
}

.mode-btn:hover {
    color: var(--color-text, #000);
}

.mode-btn.active {
    color: var(--color-primary, #3b82f6);
    border-bottom-color: var(--color-primary, #3b82f6);
}

.input-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-label {
    font-weight: 600;
    font-size: 0.875rem;
}

.urls-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-family: monospace;
    font-size: 0.875rem;
    resize: vertical;
}

.input-hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
}

.input-error {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-danger, #ef4444);
}

.options-section {
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #f9fafb);
    border-radius: 0.5rem;
}

.options-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.option-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
}

.option-field.full-width {
    grid-column: 1 / -1;
}

.autocomplete-wrapper {
    position: relative;
}

.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 250px;
    overflow-y: auto;
    background-color: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 100;
    margin-top: 0.25rem;
}

.autocomplete-dropdown.owner-dropdown {
    width: 200%;
    right: auto;
}

.autocomplete-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
}

.autocomplete-item:hover {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.user-option {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.user-email {
    font-weight: 500;
}

.user-extmail {
    color: var(--color-text-secondary, #666);
    font-size: 0.875rem;
}

.option-field label {
    font-size: 0.875rem;
    font-weight: 500;
}

.option-field input[type="text"],
.option-field select {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.option-field input[type="checkbox"] {
    margin-right: 0.5rem;
}

.preview-section {
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #f9fafb);
    border-radius: 0.5rem;
}

.preview-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
}

.preview-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.preview-item {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background-color: var(--color-bg, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
}

.preview-index {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary-light, #dbeafe);
    color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
}

.preview-details {
    flex: 1;
    min-width: 0;
}

.preview-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.preview-url {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.preview-more {
    padding: 0.75rem;
    text-align: center;
    color: var(--color-text-secondary, #666);
    font-size: 0.875rem;
}

.import-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #ddd);
}

.action-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.375rem;
    background-color: var(--color-bg, #fff);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover, #f3f4f6);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn.primary {
    background-color: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
    color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #2563eb);
}

.results-section {
    padding: 1.5rem;
    background-color: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #ddd);
    border-radius: 0.5rem;
}

.results-header h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
}

.results-summary {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.result-stat {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.875rem;
}

.result-stat.success {
    background-color: #dcfce7;
    color: #16a34a;
}

.result-stat.error {
    background-color: #fee2e2;
    color: #dc2626;
}

.errors-list {
    margin-top: 1rem;
}

.errors-list h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: var(--color-danger, #ef4444);
}

.error-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: #fee2e2;
    border-left: 3px solid var(--color-danger, #ef4444);
    border-radius: 0.25rem;
    font-size: 0.875rem;
}
</style>
