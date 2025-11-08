<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dropdown } from 'floating-vue'

interface ImportedImage {
    url: string
    previewUrl: string
    status: 'pending' | 'loading' | 'success' | 'error'
}

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
    save: [images: ImportedImage[]]
}>()

// Form state
const urlInput = ref('')
const importedImages = ref<ImportedImage[]>([])
const selectedProject = ref<number | null>(null)
const selectedOwner = ref<number | null>(null)
const keepOpen = ref(false)
const xmlSubject = ref('mixed')
const altText = ref('')
const license = ref('BY')

// CTags state (using bit groups like ImagesCoreAdmin)
const ctagsAgeGroup = ref(0)
const ctagsSubjectType = ref(0)
const ctagsAccessLevel = ref(0)
const ctagsQuality = ref(0)

// Data for dropdowns
const projects = ref<Array<{ id: number; name: string; domaincode?: string }>>([])
const owners = ref<Array<{ id: number; name: string; email?: string }>>([])
const loadingProjects = ref(false)
const loadingOwners = ref(false)

// Fetch projects from API
const fetchProjects = async () => {
    if (loadingProjects.value || projects.value.length > 0) return
    loadingProjects.value = true
    try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        projects.value = Array.isArray(data) ? data : (data.projects || [])
        console.log('Loaded projects:', projects.value.length)
    } catch (error) {
        console.error('Error fetching projects:', error)
        projects.value = []
    } finally {
        loadingProjects.value = false
    }
}

// Fetch users/owners from API
const fetchOwners = async () => {
    if (loadingOwners.value || owners.value.length > 0) return
    loadingOwners.value = true
    try {
        const response = await fetch('/api/users')
        if (!response.ok) throw new Error('Failed to fetch users')
        const data = await response.json()
        owners.value = Array.isArray(data) ? data : (data.users || [])
        console.log('Loaded owners:', owners.value.length)
    } catch (error) {
        console.error('Error fetching owners:', error)
        owners.value = []
    } finally {
        loadingOwners.value = false
    }
}

// CTags options (matching ImagesCoreAdmin)
const ageGroupOptions = [
    { label: 'Other', value: 0 },
    { label: 'Child', value: 1 },
    { label: 'Teen', value: 2 },
    { label: 'Adult', value: 3 }
]

const subjectTypeOptions = [
    { label: 'Other', value: 0 },
    { label: 'Group', value: 1 },
    { label: 'Person', value: 2 },
    { label: 'Portrait', value: 3 }
]

const accessLevelOptions = [
    { label: 'Project', value: 0 },
    { label: 'Public', value: 1 },
    { label: 'Private', value: 2 },
    { label: 'Internal', value: 3 }
]

const qualityOptions = [
    { label: 'OK', value: 0 },
    { label: 'Deprecated', value: 1 },
    { label: 'Technical Error', value: 2 },
    { label: 'Check Quality', value: 3 }
]

const licenseOptions = [
    { label: 'BY (Attribution)', value: 'BY' },
    { label: 'BY-SA (ShareAlike)', value: 'BY-SA' },
    { label: 'BY-ND (NoDerivatives)', value: 'BY-ND' },
    { label: 'BY-NC (NonCommercial)', value: 'BY-NC' },
    { label: 'CC0 (Public Domain)', value: 'CC0' }
]

const xmlSubjectOptions = [
    { label: 'Mixed', value: 'mixed' },
    { label: 'Child', value: 'child' },
    { label: 'Teen', value: 'teen' },
    { label: 'Adult', value: 'adult' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Post', value: 'post' },
    { label: 'Event', value: 'event' },
    { label: 'Location', value: 'location' }
]

// Auto-set ctags based on xml_subject
watch(xmlSubject, (newSubject) => {
    if (!newSubject || newSubject === 'mixed') return

    // Auto-set age group
    if (newSubject === 'child') {
        ctagsAgeGroup.value = 1 // Child
    } else if (newSubject === 'teen') {
        ctagsAgeGroup.value = 2 // Teen
    } else if (newSubject === 'adult') {
        ctagsAgeGroup.value = 3 // Adult
    }

    // Auto-set subject type
    if (newSubject === 'instructor') {
        ctagsSubjectType.value = 3 // Portrait
    } else if (newSubject === 'event') {
        ctagsSubjectType.value = 1 // Group
    }
})

// Validate URL
const isValidUrl = (url: string) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

// Add URL to import list
const addUrl = () => {
    const input = urlInput.value.trim()
    if (!input) {
        alert('Please enter at least one URL')
        return
    }

    // Split by comma, newline, or space and filter valid URLs
    const urls = input
        .split(/[,\n\s]+/)
        .map(url => url.trim())
        .filter(url => url.length > 0)

    let addedCount = 0
    let invalidCount = 0
    let duplicateCount = 0

    for (const url of urls) {
        if (!isValidUrl(url)) {
            invalidCount++
            continue
        }

        // Check if already added
        if (importedImages.value.some((img: ImportedImage) => img.url === url)) {
            duplicateCount++
            continue
        }

        // Add to list
        importedImages.value.push({
            url,
            previewUrl: url,
            status: 'pending'
        })
        addedCount++
    }

    // Clear input
    urlInput.value = ''

    // Show feedback
    const messages = []
    if (addedCount > 0) messages.push(`✅ Added ${addedCount} URL(s)`)
    if (duplicateCount > 0) messages.push(`⚠️ ${duplicateCount} duplicate(s) skipped`)
    if (invalidCount > 0) messages.push(`❌ ${invalidCount} invalid URL(s)`)

    if (messages.length > 0) {
        console.log(messages.join(' • '))
    }
}

// Remove image from list
const removeImage = (index: number) => {
    importedImages.value.splice(index, 1)
}

// Build ctags byte from bit groups
const buildCtags = (): Uint8Array => {
    let byte = 0
    byte |= (ctagsAgeGroup.value & 0x03) << 0      // bits 0-1
    byte |= (ctagsSubjectType.value & 0x03) << 2    // bits 2-3
    byte |= (ctagsAccessLevel.value & 0x03) << 4    // bits 4-5
    byte |= (ctagsQuality.value & 0x03) << 6        // bits 6-7

    return new Uint8Array([byte])
}// Handle save - actually call the import API
const handleSave = async () => {
    if (importedImages.value.length === 0) {
        alert('Please add at least one image URL')
        return
    }

    if (!selectedOwner.value) {
        alert('Please select an owner')
        return
    }

    try {
        // Build ctags buffer
        const ctagsBuffer = Array.from(buildCtags())

        // Get selected project's domaincode
        const selectedProjectData = projects.value.find(p => p.id === selectedProject.value)

        // Prepare batch data
        const batchData: any = {
            owner_id: selectedOwner.value,
            alt_text: altText.value || 'Batch imported from URL',
            license: license.value,
            xml_subject: xmlSubject.value,
            ctags: ctagsBuffer
        }

        // Add domaincode if project selected
        if (selectedProject.value && selectedProjectData?.domaincode) {
            batchData.domaincode = selectedProjectData.domaincode
        }

        const payload = {
            urls: importedImages.value.map((img: ImportedImage) => img.url),
            batch: batchData
        }

        console.log('Importing images with payload:', payload)
        console.log('Selected project:', selectedProjectData)
        console.log('Selected owner ID:', selectedOwner.value)

        // Call import API
        const response = await fetch('/api/images/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to import images: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        console.log('Import result:', result)

        // Show success message
        alert(`Successfully imported ${result.successful} of ${result.total} images!`)

        // Emit save event for parent to refresh
        emit('save', importedImages.value)

        if (!keepOpen.value) {
            handleClose()
        } else {
            // Clear only the images, keep other settings
            importedImages.value = []
            urlInput.value = ''
        }
    } catch (error) {
        console.error('Error importing images:', error)
        alert(`Failed to import images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Handle close
const handleClose = () => {
    emit('update:isOpen', false)
    // Reset form
    setTimeout(() => {
        urlInput.value = ''
        importedImages.value = []
        selectedProject.value = null
        selectedOwner.value = null
        ctagsAgeGroup.value = 0
        ctagsSubjectType.value = 0
        ctagsAccessLevel.value = 0
        ctagsQuality.value = 0
        xmlSubject.value = 'mixed'
        altText.value = ''
        license.value = 'BY'
        keepOpen.value = false
    }, 300)
}

// Computed validation
const canSave = computed(() => {
    return importedImages.value.length > 0 && selectedOwner.value !== null
})

// Watch for modal opening to fetch data
watch(() => props.isOpen, (newValue) => {
    if (newValue) {
        fetchProjects()
        fetchOwners()
    }
})
</script>

<template>
    <Dropdown :shown="isOpen" :triggers="[]" :autoHide="false">
        <template #popper>
            <div class="cimg-import-modal">
                <div class="modal-header">
                    <h3>Import Images from URLs</h3>
                    <button class="btn-close" @click="handleClose">×</button>
                </div>

                <div class="modal-content">
                    <!-- URL input -->
                    <div class="form-section">
                        <label>Image URLs (one per line or comma-separated)</label>
                        <div class="url-input-group">
                            <textarea v-model="urlInput"
                                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;or comma-separated..."
                                @keydown.ctrl.enter="addUrl" @keydown.meta.enter="addUrl" class="url-textarea"
                                rows="3"></textarea>
                            <button class="btn-add" @click="addUrl">Add URLs</button>
                        </div>
                        <small class="form-hint">Supports multiple URLs (separated by comma, newline, or space)</small>
                    </div>

                    <!-- Image previews list -->
                    <div v-if="importedImages.length > 0" class="preview-list">
                        <div class="preview-list-header">
                            <span>{{ importedImages.length }} image(s)</span>
                            <button class="btn-clear-all" @click="importedImages = []">
                                Clear all
                            </button>
                        </div>
                        <div class="preview-grid">
                            <div v-for="(image, index) in importedImages" :key="index" class="preview-item">
                                <img :src="image.previewUrl" alt="Preview" class="preview-image" loading="lazy" />
                                <button class="btn-remove-image" @click="removeImage(index)" aria-label="Remove image">
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Project and owner selection -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Project (Optional)</label>
                            <select v-model="selectedProject" class="form-select" :disabled="loadingProjects">
                                <option :value="null">
                                    {{ loadingProjects ? 'Loading projects...' : 'Select project...' }}
                                </option>
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Owner *</label>
                            <select v-model="selectedOwner" class="form-select" :disabled="loadingOwners">
                                <option :value="null">
                                    {{ loadingOwners ? 'Loading owners...' : 'Select owner...' }}
                                </option>
                                <option v-for="owner in owners" :key="owner.id" :value="owner.id">
                                    {{ owner.name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Batch metadata -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Subject Type</label>
                            <select v-model="xmlSubject" class="form-select">
                                <option v-for="opt in xmlSubjectOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                            <small class="form-hint">Auto-sets age and subject tags</small>
                        </div>

                        <div class="form-group">
                            <label>License</label>
                            <select v-model="license" class="form-select">
                                <option v-for="opt in licenseOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section">
                        <label>Alt Text (applies to all)</label>
                        <input v-model="altText" type="text" class="form-input" placeholder="Batch imported from URL" />
                    </div>

                    <!-- CTags -->
                    <div class="ctags-section">
                        <h4>Content Tags (CTags)</h4>

                        <div class="ctags-row">
                            <label class="ctags-label">
                                Age Group
                                <span class="label-hint">bits 0-1</span>
                            </label>
                            <select v-model.number="ctagsAgeGroup" class="form-select">
                                <option v-for="opt in ageGroupOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <div class="ctags-row">
                            <label class="ctags-label">
                                Subject Type
                                <span class="label-hint">bits 2-3</span>
                            </label>
                            <select v-model.number="ctagsSubjectType" class="form-select">
                                <option v-for="opt in subjectTypeOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <div class="ctags-row">
                            <label class="ctags-label">
                                Access Level
                                <span class="label-hint">bits 4-5</span>
                            </label>
                            <select v-model.number="ctagsAccessLevel" class="form-select">
                                <option v-for="opt in accessLevelOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <div class="ctags-row">
                            <label class="ctags-label">
                                Quality
                                <span class="label-hint">bits 6-7</span>
                            </label>
                            <select v-model.number="ctagsQuality" class="form-select">
                                <option v-for="opt in qualityOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Keep open checkbox -->
                    <div class="form-section">
                        <label class="checkbox-label">
                            <input v-model="keepOpen" type="checkbox" />
                            <span>Keep me open after save (for batch imports)</span>
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel" @click="handleClose">
                        Cancel
                    </button>
                    <button class="btn-save" :disabled="!canSave" @click="handleSave">
                        Save {{ importedImages.length }} image(s)
                    </button>
                </div>
            </div>
        </template>
    </Dropdown>
</template>

<style scoped>
.cimg-import-modal {
    width: 90vw;
    max-width: 700px;
    max-height: 85vh;
    background: var(--color-card-bg);
    border-radius: var(--radius-large);
    box-shadow: 0 8px 32px oklch(0 0 0 / 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.btn-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background var(--duration) var(--ease);
}

.btn-close:hover {
    background: var(--color-muted-bg);
}

.modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-section label,
.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.url-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.url-textarea,
.url-input,
.form-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    background: var(--color-card-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
    resize: vertical;
}

.url-textarea {
    min-height: 80px;
}

.btn-add {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--duration) var(--ease);
    align-self: flex-start;
}

.btn-add:hover {
    opacity: 0.9;
}

.preview-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.preview-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.btn-clear-all {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-clear-all:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger-contrast);
    border-color: var(--color-danger);
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 1rem;
}

.preview-item {
    position: relative;
    aspect-ratio: 17 / 10;
    border-radius: var(--radius-small);
    overflow: hidden;
    background: var(--color-card-bg);
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-remove-image {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: oklch(0 0 0 / 0.7);
    color: white;
    border-radius: 50%;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--duration) var(--ease);
}

.preview-item:hover .btn-remove-image {
    opacity: 1;
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

.form-select {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    background: var(--color-card-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    cursor: pointer;
}

.form-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-select option {
    background: var(--color-background);
    color: var(--color-text);
    padding: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.btn-cancel,
.btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-cancel {
    background: transparent;
    border: 1px solid var(--color-border);
}

.btn-cancel:hover {
    background: var(--color-muted-bg);
}

.btn-save {
    background: var(--color-success);
    color: white;
    border: none;
}

.btn-save:hover:not(:disabled) {
    opacity: 0.9;
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* CTags section styling */
.ctags-section {
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.ctags-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
}

.ctags-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.ctags-row:last-child {
    margin-bottom: 0;
}

.ctags-label {
    min-width: 120px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-muted-contrast);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.label-hint {
    font-size: 0.7rem;
    font-weight: normal;
    color: var(--color-muted-contrast);
    font-style: italic;
}

.form-hint {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-muted-contrast);
    font-style: italic;
}

.ctags-row .form-select {
    flex: 1;
}
</style>
