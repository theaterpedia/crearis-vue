<template>
    <div class="cimg-import-stepper">
        <!-- Owner & Template Selection (Always Visible) -->
        <div class="owner-selection-bar">
            <div class="selection-group">
                <label class="owner-label">Image Admin</label>
                <sysDropDown v-model="selectedOwnerId" :items="eligibleUsers" placeholder="Select admin"
                    :disabled="isImporting" />
                <p class="owner-hint">Admin muss nicht der Autor des Bildes sein</p>
            </div>
            <div class="selection-group">
                <label class="owner-label">Default Template</label>
                <sysDropDown v-model="selectedTemplate" :items="imageTemplateOptions" placeholder="Select category"
                    :disabled="isImporting" />
                <p class="owner-hint">Kategorie für neue Bilder</p>
            </div>
        </div>

        <!-- Empty State: Drop Zone -->
        <div v-if="images.length === 0" class="drop-zone-container">
            <div class="adapter-tabs">
                <button v-for="adapter in adapters" :key="adapter.id" class="adapter-tab"
                    :class="{ active: selectedAdapter === adapter.id }" @click="selectedAdapter = adapter.id">
                    <span class="adapter-icon">{{ adapter.icon }}</span>
                    <span>{{ adapter.label }}</span>
                    <span v-if="!adapter.enabled" class="coming-soon">Coming Soon</span>
                </button>
            </div>

            <!-- Local Adapter: File Drop -->
            <div v-if="selectedAdapter === 'local'" class="drop-zone" @drop.prevent="handleDrop"
                @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                :class="{ dragging: isDragging }">
                <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple
                    style="display: none" @change="handleFileSelect" />
                <div class="drop-zone-content">
                    <svg fill="currentColor" height="64" viewBox="0 0 256 256" width="64"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z">
                        </path>
                    </svg>
                    <h3>Drop images here</h3>
                    <p>or click to browse files</p>
                    <button class="btn-browse" @click="triggerFileInput">
                        Browse Files
                    </button>
                    <p class="drop-hint">Supported: JPEG, PNG, WebP • Max 20MB per file</p>
                </div>
            </div>

            <!-- Cloudinary Adapter (Stub) -->
            <div v-else-if="selectedAdapter === 'cloudinary'" class="adapter-stub">
                <svg fill="currentColor" height="64" viewBox="0 0 256 256" width="64"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M160,40a32.06,32.06,0,0,0-31,24H88A32,32,0,0,0,56,96v8a32,32,0,0,0,0,56v8a32,32,0,0,0,32,32h40a32.06,32.06,0,0,0,31,24h1a32,32,0,0,0,0-64h-1a32.15,32.15,0,0,0-14,3.15V136.49a32,32,0,0,0,0-56.94V72.85A32.15,32.15,0,0,0,159,69h1a32,32,0,0,0,0-64ZM88,80h32v95.15a32.14,32.14,0,0,0-14,3.15A32,32,0,0,0,88,168v-8h8a16,16,0,0,0,16-16V112a16,16,0,0,0-16-16H88v-8A16,16,0,0,1,88,80Zm8,64v16H80a16,16,0,0,1,0-32h16Zm64,64h-1a16,16,0,0,1,0-32h1a16,16,0,0,1,0,32Zm0-96h-1a16,16,0,0,1,0-32h1a16,16,0,0,1,0,32Z">
                    </path>
                </svg>
                <h3>Cloudinary Import</h3>
                <p>Import images from Cloudinary library</p>
                <p class="coming-soon-text">Coming soon...</p>
            </div>

            <!-- Unsplash Adapter (Stub) -->
            <div v-else-if="selectedAdapter === 'unsplash'" class="adapter-stub">
                <svg fill="currentColor" height="64" viewBox="0 0 256 256" width="64"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56h64v48H40ZM40,200V120h64v32a8,8,0,0,0,16,0V120H216v80Z">
                    </path>
                </svg>
                <h3>Unsplash Import</h3>
                <p>Search and import from Unsplash</p>
                <p class="coming-soon-text">Coming soon...</p>
            </div>
        </div>

        <!-- Preview Grid: Images with Click to Refine -->
        <div v-else class="preview-container">
            <div class="preview-header">
                <div class="preview-stats">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z">
                        </path>
                    </svg>
                    <span>{{ images.length }} image{{ images.length !== 1 ? 's' : '' }} ready</span>
                </div>
                <div class="preview-actions">
                    <!-- TODO v0.5: Enable Add More functionality -->
                    <button class="btn-add-more" disabled title="Coming in v0.5">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                            </path>
                        </svg>
                        Add More
                    </button>
                    <button class="btn-clear-all" @click="clearAll">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                            </path>
                        </svg>
                        Clear All
                    </button>
                </div>
            </div>

            <div class="preview-grid">
                <div v-for="(img, index) in images" :key="index" class="preview-card" @click="openRefineModal(index)">
                    <div class="preview-image-wrapper">
                        <img :src="img.previewUrl" :alt="img.xmlid" />
                        <div class="preview-overlay">
                            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
                                </path>
                            </svg>
                            <span>Click to refine</span>
                        </div>
                    </div>
                    <div class="preview-info">
                        <div class="preview-xmlid">{{ img.xmlid }}</div>
                        <!-- TODO v0.5: Show preset tags from TagFamilies here -->
                        <!--
                        <div class="preview-meta">
                            <span class="preview-tag">ttags: {{ img.ttags }}</span>
                            <span class="preview-tag">ctags: {{ img.ctags }}</span>
                        </div>
                        -->
                    </div>
                    <button class="btn-remove" @click.stop="removeImage(index)" title="Remove image">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                            </path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Refine Modal -->
        <div v-if="refineModalOpen" class="modal-overlay" @click.self="closeRefineModal">
            <div class="refine-modal">
                <div class="modal-header">
                    <h3>Refine Image Details</h3>
                    <button class="btn-close" @click="closeRefineModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="modal-preview">
                        <img :src="currentImage?.previewUrl" :alt="currentImage?.xmlid" />
                    </div>
                    <div class="modal-form">
                        <div class="form-group">
                            <label>XMLID</label>
                            <input v-model="currentImage!.xmlid" type="text" class="form-input"
                                :placeholder="`${projectId}.image_scene.filename`" />
                            <span class="form-hint">Format: {project}.image_{subject}.{name...}</span>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Owner</label>
                                <sysDropDown v-model="currentImage!.ownerId" :items="eligibleUsers"
                                    placeholder="Select owner" />
                            </div>
                            <div class="form-group author-stack">
                                <label>Author</label>
                                <input v-model="currentImage!.author.name" type="text" class="form-input"
                                    placeholder="Author name" />
                                <input v-model="currentImage!.author.uri" type="text" class="form-input"
                                    placeholder="https://..." />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Alt Text</label>
                            <input v-model="currentImage!.altText" type="text" class="form-input"
                                placeholder="Descriptive alt text" />
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <TagFamilies v-model:ttags="currentImage!.ttags" v-model:ctags="currentImage!.ctags"
                                v-model:dtags="currentImage!.dtags" :enable-edit="['ttags', 'ctags', 'dtags']"
                                layout="wrap" />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" @click="closeRefineModal">Cancel</button>
                    <button class="btn-save" @click="saveRefine">Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Batch Tag Editor -->
        <div v-if="images.length > 0" class="batch-tags-section">
            <label class="batch-tags-label">Default Tags (applied to all images)</label>
            <TagFamilies v-model:ttags="defaultTtags" v-model:ctags="defaultCtags" v-model:dtags="defaultDtags"
                :enable-edit="['ttags', 'ctags', 'dtags']" layout="wrap" />
        </div>

        <!-- Action Bar (when images exist) -->
        <div v-if="images.length > 0" class="action-bar">
            <button class="btn-cancel" @click="clearAll">
                Cancel
            </button>
            <button class="btn-import" @click="handleImport" :disabled="isImporting">
                <span v-if="isImporting" class="spinner"></span>
                <span>{{ isImporting ? 'Importing...' : `Import ${images.length} Image${images.length !== 1 ? 's' : ''}`
                    }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import sysDropDown from '@/components/sysDropDown.vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import { generateSlug, buildXmlid, ENTITY_TEMPLATES } from '@/utils/xmlid'

interface ImageItem {
    file: File
    previewUrl: string
    xmlid: string
    template: string  // Image template (e.g., 'scene', 'adult', 'instructor')
    ownerId: number | null
    author: {
        name: string
        uri: string
        adapter: string
    }
    altText: string
    ttags: number
    ctags: number
    dtags: number
}

interface Props {
    projectId: string
    eligibleOwners?: number[]  // Deprecated: now loads from project_members
}

const props = withDefaults(defineProps<Props>(), {
    eligibleOwners: () => []
})

const emit = defineEmits<{
    'images-imported': [imageIds: string[]]
}>()

const { user } = useAuth()

// Image template options from ENTITY_TEMPLATES
const imageTemplateOptions = computed(() => [
    { id: '', name: 'None (generic)', description: 'No specific category' },
    ...ENTITY_TEMPLATES.image.map(t => ({
        id: t,
        name: t.charAt(0).toUpperCase() + t.slice(1),
        description: `Category: ${t}`
    }))
])

// Default template for new imports
const selectedTemplate = ref<string>('scene')

// Owner selection - initialize from current user
const selectedOwnerId = ref<number | null>(user.value?.id || null)
const eligibleUsers = ref<Array<{ id: number; name: string; description?: string }>>([])

// Load eligible users from project members (like AddPostPanel does)
async function loadEligibleUsers() {
    if (!props.projectId) {
        // Fallback to current user only
        eligibleUsers.value = user.value ? [{ id: user.value.id, name: user.value.username || `User ${user.value.id}` }] : []
        return
    }

    try {
        // Load project members via /api/users?project_id=...
        const response = await fetch(`/api/users?project_id=${props.projectId}`)
        if (!response.ok) {
            throw new Error(`Failed to load project users: ${response.statusText}`)
        }
        const users = await response.json()
        eligibleUsers.value = users
            .filter(u => u !== null)
            .map(u => ({
                id: u.id,
                name: u.username || u.email || `User ${u.id}`,
                description: u.email || undefined
            }))
    } catch (error) {
        console.error('Failed to load eligible users:', error)
        // Fallback to current user
        eligibleUsers.value = user.value ? [{ id: user.value.id, name: user.value.username || `User ${user.value.id}` }] : []
    }
}

// Adapter selection
const adapters = [
    { id: 'local', label: 'Local Upload', icon: '📁', enabled: true },
    { id: 'cloudinary', label: 'Cloudinary', icon: '☁️', enabled: false },
    { id: 'unsplash', label: 'Unsplash', icon: '🖼️', enabled: false }
]

const selectedAdapter = ref('local')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const images = ref<ImageItem[]>([])
const isImporting = ref(false)

// Default tag values for batch application
const defaultTtags = ref(0)
const defaultCtags = ref(0)
const defaultDtags = ref(0)

// Refine modal
const refineModalOpen = ref(false)
const currentImageIndex = ref<number | null>(null)
const currentImage = computed(() => {
    if (currentImageIndex.value === null) return null
    return images.value[currentImageIndex.value]
})

// File handling
const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0) return
    processFiles(Array.from(files))
    target.value = '' // Reset input
}

const handleDrop = (event: DragEvent) => {
    isDragging.value = false
    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return
    processFiles(Array.from(files))
}

const processFiles = (files: File[]) => {
    const maxSize = 20 * 1024 * 1024 // 20MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']

    let added = 0
    for (const file of files) {
        // Validation
        if (!validTypes.includes(file.type)) {
            console.warn(`Skipping ${file.name}: Invalid type`)
            continue
        }
        if (file.size > maxSize) {
            console.warn(`Skipping ${file.name}: Too large (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
            continue
        }

        // Generate preview URL
        const previewUrl = URL.createObjectURL(file)

        // Generate xmlid with Odoo-aligned format using selected template
        // Format: {domaincode}.image__{slug} or {domaincode}.image-{template}__{slug}
        const timestamp = Date.now()
        const basename = file.name.replace(/\.[^/.]+$/, '')
        const slug = generateSlug(`${basename}_${timestamp}`)
        const template = selectedTemplate.value || undefined
        const xmlid = buildXmlid({
            domaincode: props.projectId,
            entity: 'image',
            template,
            slug
        })

        // Create image item with defaults
        images.value.push({
            file,
            previewUrl,
            xmlid,
            template: selectedTemplate.value,
            ownerId: selectedOwnerId.value,
            author: {
                name: user.value?.username || 'Unknown',
                uri: '',
                adapter: 'local'
            },
            altText: '',
            ttags: defaultTtags.value,
            ctags: defaultCtags.value,
            dtags: defaultDtags.value
        })
        added++
    }

    if (added > 0) {
        console.log(`✅ Added ${added} image(s)`)
    }
}

const removeImage = (index: number) => {
    URL.revokeObjectURL(images.value[index].previewUrl)
    images.value.splice(index, 1)
}

const clearAll = () => {
    if (images.value.length === 0) return
    if (!confirm(`Clear all ${images.value.length} images?`)) return

    images.value.forEach(img => URL.revokeObjectURL(img.previewUrl))
    images.value = []
}

// Refine modal
const openRefineModal = (index: number) => {
    currentImageIndex.value = index
    refineModalOpen.value = true
}

const closeRefineModal = () => {
    refineModalOpen.value = false
    currentImageIndex.value = null
}

const saveRefine = () => {
    closeRefineModal()
}

// Import handler
const handleImport = async () => {
    if (images.value.length === 0) return
    if (isImporting.value) return

    // Validate owner selection
    if (!selectedOwnerId.value) {
        alert('Please select an image owner')
        return
    }

    isImporting.value = true
    const importedIds: string[] = []

    try {
        for (const img of images.value) {
            // Build FormData for upload
            const formData = new FormData()
            formData.append('file', img.file)
            formData.append('xmlid', img.xmlid)
            formData.append('project_id', props.projectId)
            formData.append('owner_id', String(img.ownerId || selectedOwnerId.value))
            formData.append('author_name', img.author.name)
            formData.append('author_uri', img.author.uri)
            formData.append('author_adapter', 'local')
            formData.append('alt_text', img.altText)
            // Tags must be comma-separated byte values (0-255)
            // Convert number to string, ensure it's a valid byte value
            const formatTag = (tag: number | undefined): string => {
                const val = typeof tag === 'number' ? tag : 0
                return String(Math.max(0, Math.min(255, val)))
            }
            formData.append('ttags', formatTag(img.ttags))
            formData.append('ctags', formatTag(img.ctags))
            formData.append('dtags', formatTag(img.dtags))

            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`Upload failed for ${img.xmlid}: ${response.statusText}`)
            }

            const result = await response.json()
            importedIds.push(result.image_id)
            console.log(`✅ Imported: ${img.xmlid} → ID ${result.image_id}`)
        }

        // Success: clear images and emit
        images.value.forEach(img => URL.revokeObjectURL(img.previewUrl))
        images.value = []

        // Reset tags to initial state for next import
        defaultTtags.value = 0
        defaultCtags.value = 0
        defaultDtags.value = 0

        emit('images-imported', importedIds)
        alert(`Successfully imported ${importedIds.length} image(s)!`)

    } catch (error) {
        console.error('Import failed:', error)
        alert(`Import failed: ${error}`)
    } finally {
        isImporting.value = false
    }
}

// Load eligible users on mount
onMounted(async () => {
    await loadEligibleUsers()
})
</script>

<style scoped>
.cimg-import-stepper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 400px;
}

/* Owner Selection Bar */
.owner-selection-bar {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
}

.selection-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.owner-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.owner-hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted-contrast);
    font-style: italic;
}

/* Adapter Tabs */
.adapter-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0.25rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.adapter-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-contrast);
    position: relative;
}

.adapter-tab:hover {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.adapter-tab.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.adapter-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.adapter-icon {
    font-size: 1.5rem;
}

.coming-soon {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
    background: var(--color-muted-bg);
    border-radius: 3px;
    color: var(--color-muted-contrast);
}

/* Drop Zone */
.drop-zone-container {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 3rem 2rem;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-large);
    background: var(--color-muted-bg);
    cursor: pointer;
    transition: all 0.2s ease;
}

.drop-zone:hover,
.drop-zone.dragging {
    border-color: var(--color-primary-bg);
    background: var(--color-primary-bg);
    opacity: 0.1;
}

.drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
}

.drop-zone-content svg {
    color: var(--color-primary-bg);
    opacity: 0.5;
}

.drop-zone-content h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.drop-zone-content p {
    margin: 0;
    color: var(--color-muted-contrast);
}

.btn-browse {
    padding: 0.75rem 2rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-browse:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    transform: translateY(-1px);
}

.drop-hint {
    font-size: 0.75rem !important;
    color: var(--color-muted-contrast) !important;
    font-style: italic;
}

/* Adapter Stubs */
.adapter-stub {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 3rem 2rem;
    text-align: center;
}

.adapter-stub svg {
    color: var(--color-muted-contrast);
    opacity: 0.3;
    margin-bottom: 1.5rem;
}

.adapter-stub h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.adapter-stub p {
    margin: 0;
    color: var(--color-muted-contrast);
}

.coming-soon-text {
    margin-top: 1rem !important;
    font-style: italic;
    color: var(--color-muted-contrast) !important;
}

/* Preview Container */
.preview-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.preview-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.preview-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-add-more,
.btn-clear-all {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-add-more:hover:not(:disabled) {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.btn-add-more:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-clear-all:hover {
    background: var(--color-negative-bg);
    border-color: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

/* Preview Grid */
.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
}

.preview-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.preview-card:hover {
    border-color: var(--color-primary-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.1);
}

.preview-image-wrapper {
    position: relative;
    aspect-ratio: 17 / 10;
    overflow: hidden;
    background: var(--color-muted-bg);
}

.preview-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: oklch(0 0 0 / 0.7);
    color: white;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.preview-card:hover .preview-overlay {
    opacity: 1;
}

.preview-overlay span {
    font-size: 0.875rem;
    font-weight: 600;
}

.preview-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.preview-xmlid {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-contrast);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preview-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.preview-tag {
    padding: 0.125rem 0.5rem;
    background: var(--color-muted-bg);
    border-radius: 3px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-muted-contrast);
}

.btn-remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-popover-bg);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 10;
    color: var(--color-popover-contrast);
}

.preview-card:hover .btn-remove {
    opacity: 1;
}

.btn-remove:hover {
    background: var(--color-negative-bg);
    border-color: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    transform: scale(1.1);
}

/* Refine Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.refine-modal {
    width: 90vw;
    max-width: 800px;
    max-height: 90vh;
    background: var(--color-popover-bg);
    border-radius: var(--radius-large);
    border: 1px solid var(--color-border);
    box-shadow: 0 8px 32px oklch(0% 0 0 / 0.2);
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
    transition: background 0.2s ease;
}

.btn-close:hover {
    background: var(--color-muted-bg);
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.modal-preview {
    position: sticky;
    top: 0;
    height: fit-content;
}

.modal-preview img {
    width: 100%;
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-border);
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.form-input,
.form-select {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    font-size: 0.875rem;
    font-family: inherit;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
}

.form-hint {
    font-size: 0.75rem;
    color: var(--color-muted-contrast);
    font-style: italic;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.author-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.author-stack .form-input:first-of-type {
    margin-bottom: 0;
}

/* Batch Tags Section */
.batch-tags-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
}

.batch-tags-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

/* Action Bar */
.action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.btn-cancel,
.btn-save,
.btn-import {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-medium);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-contrast);
}

.btn-cancel:hover {
    background: var(--color-muted-bg);
}

.btn-save,
.btn-import {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
}

.btn-save:hover:not(:disabled),
.btn-import:hover:not(:disabled) {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.btn-import:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-accent-contrast);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Tablet: 900px */
@media (max-width: 900px) {
    .modal-body {
        grid-template-columns: 1fr;
    }

    .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .drop-zone {
        min-height: 300px;
        padding: 2rem 1.5rem;
    }

    .adapter-stub {
        min-height: 300px;
        padding: 2rem 1.5rem;
    }
}

/* Mobile: 640px */
@media (max-width: 640px) {
    .cimg-import-stepper {
        gap: 1rem;
    }

    .owner-selection-bar {
        padding: 0.75rem;
    }

    .adapter-tabs {
        flex-direction: column;
        gap: 0.25rem;
    }

    .adapter-tab {
        flex-direction: row;
        justify-content: flex-start;
        padding: 0.5rem 0.75rem;
    }

    .adapter-icon {
        font-size: 1.25rem;
    }

    .drop-zone {
        min-height: 250px;
        padding: 1.5rem 1rem;
    }

    .drop-zone-content h3 {
        font-size: 1.25rem;
    }

    .btn-browse {
        padding: 0.625rem 1.5rem;
    }

    .preview-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
    }

    .preview-actions {
        justify-content: flex-end;
    }

    .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }

    .preview-info {
        padding: 0.5rem;
    }

    .preview-xmlid {
        font-size: 0.65rem;
    }

    .refine-modal {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }

    .modal-header {
        padding: 1rem;
    }

    .modal-body {
        padding: 1rem;
        gap: 1rem;
    }

    .modal-footer {
        padding: 1rem;
    }

    .batch-tags-section {
        padding: 0.75rem;
    }

    .action-bar {
        padding: 0.75rem;
        flex-direction: column;
    }

    .btn-cancel,
    .btn-save,
    .btn-import {
        width: 100%;
        justify-content: center;
    }
}
</style>
