<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import ImgShape from '@/components/images/ImgShape.vue'
import ShapeEditor from '@/components/images/ShapeEditor.vue'
import tagsMultiToggle from '@/components/images/tagsMultiToggle.vue'
import cimgImport from '@/components/images/cimgImport.vue'
import { useTheme } from '@/composables/useTheme'

// Initialize theme dimensions
const { extractImageDimensions } = useTheme()

// Router
const router = useRouter()

// State
const images = ref<any[]>([])
const selectedImage = ref<any | null>(null)
const originalImage = ref<any | null>(null)
const loading = ref(false)
const isDirty = ref(false)
const statusOptions = ref<Array<{ id: number; value: number; name: string }>>([])
const authorAdapter = ref<'unsplash' | 'cloudinary'>('unsplash')
const activeShapeTab = ref<'square' | 'wide' | 'vertical' | 'thumb'>('square')
const showImportModal = ref(false)
const blurImagesPreview = ref(false) // Toggle for blur preview mode

// Shape editor state
const activeShape = ref<{ shape: string; variant: string; adapter: string } | null>(null)

// Hero preview toggle state (Plan E Task 1.1)
const heroPreviewShape = ref<'wide' | 'square' | 'vertical'>('wide')

// Vertical column dimensions (Plan E Task 1.2)
const VERTICAL_SHAPE_WIDTH = 126 // px
const VERTICAL_SHAPE_MARGIN_LEFT = 16 // px (1rem)
const verticalColumnWidth = computed(() => {
    const widthRem = (VERTICAL_SHAPE_WIDTH + VERTICAL_SHAPE_MARGIN_LEFT) / 16
    return `${widthRem}rem` // 8.875rem
})

// Dropdown menu states
const showFiltersMenu = ref(false)
const showDataMenu = ref(false)
const showSettingsMenu = ref(false)

// Shape URL refs for ImgShape emits
const cardWideShapeUrl = ref<string>('')
const tileWideShapeUrl = ref<string>('')
const avatarThumbShapeUrl = ref<string>('')
const verticalShapeUrl = ref<string>('')

// Template refs to ImgShape component instances so we can query them
// for current preview/settings without duplicating state in this parent.
const cardShapeRef = ref<any | null>(null)
const tileShapeRef = ref<any | null>(null)
const avatarShapeRef = ref<any | null>(null)
const verticalShapeRef = ref<any | null>(null)

// Temporary XYZ inputs for shape URL construction
const cardWideX = ref<number | null>(null)
const cardWideY = ref<number | null>(null)
const cardWideZ = ref<number | null>(null)
const tileSquareX = ref<number | null>(null)
const tileSquareY = ref<number | null>(null)
const tileSquareZ = ref<number | null>(null)

// Preview and correction for card/wide focal-crop
const PreviewWide = ref<string>('')
const CorrectionWide = ref<string>('')

// Filters state
const filterStatusId = ref<number | null>(null)
const filterAgeGroup = ref<number | null>(null) // bits 0+1
const filterSubjectType = ref<number | null>(null) // bits 2+3
const filterAccessLevel = ref<number | null>(null) // bits 4+5
const filterQuality = ref<number | null>(null) // bits 6+7

// Filter options extracted from ctags bits
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

// RTags options (for choose-one role tags)
const rtagsOptions = ref([
    { label: 'Hero', value: 10 },
    { label: 'Thumbnail', value: 20 },
    { label: 'Background', value: 30 },
    { label: 'Icon', value: 40 }
])

// Extract bits from ctags byte array
const extractBits = (bytea: Uint8Array | null, startBit: number, numBits: number): number => {
    if (!bytea || bytea.length === 0) return 0
    const byte = bytea[0]
    const mask = (1 << numBits) - 1
    return (byte >> startBit) & mask
}

// Computed filtered images
const filteredImages = computed(() => {
    return images.value.filter(img => {
        // Filter by status
        if (filterStatusId.value !== null && img.status_id !== filterStatusId.value) {
            return false
        }

        // Extract ctags bits
        const ctags = img.ctags ? new Uint8Array(img.ctags) : null

        // Filter by age group (bits 0-1)
        if (filterAgeGroup.value !== null) {
            const ageGroup = extractBits(ctags, 0, 2)
            if (ageGroup !== filterAgeGroup.value) return false
        }

        // Filter by subject type (bits 2-3)
        if (filterSubjectType.value !== null) {
            const subjectType = extractBits(ctags, 2, 2)
            if (subjectType !== filterSubjectType.value) return false
        }

        // Filter by access level (bits 4-5)
        if (filterAccessLevel.value !== null) {
            const accessLevel = extractBits(ctags, 4, 2)
            if (accessLevel !== filterAccessLevel.value) return false
        }

        // Filter by quality (bits 6-7)
        if (filterQuality.value !== null) {
            const quality = extractBits(ctags, 6, 2)
            if (quality !== filterQuality.value) return false
        }

        return true
    })
})

// Get current XYZ values for active shape (Plan G Enhancement)
const activeShapeXYZ = computed(() => {
    if (!activeShape.value) return { x: null, y: null, z: null }

    const shape = activeShape.value.shape
    if (shape === 'wide' || shape === 'card') {
        return { x: cardWideX.value, y: cardWideY.value, z: cardWideZ.value }
    } else if (shape === 'square' || shape === 'tile' || shape === 'thumb' || shape === 'avatar') {
        return { x: tileSquareX.value, y: tileSquareY.value, z: tileSquareZ.value }
    }

    return { x: null, y: null, z: null }
})

// Computed for current shape based on active tab
const currentShape = computed(() => {
    if (!selectedImage.value) return null
    const shapeKey = `shape_${activeShapeTab.value}`
    return selectedImage.value[shapeKey]
})

// Helper to get shape field name
const getShapeFieldName = (tab: string) => `shape_${tab}`

// Update shape when tab changes
const changeShapeTab = (tab: 'square' | 'wide' | 'vertical' | 'thumb') => {
    activeShapeTab.value = tab
}

// Update shape fields
const updateShapeField = (field: 'x' | 'y' | 'z' | 'url', value: string | null) => {
    if (!selectedImage.value) return

    const shapeKey = getShapeFieldName(activeShapeTab.value)

    if (!selectedImage.value[shapeKey]) {
        selectedImage.value[shapeKey] = { x: null, y: null, z: null, url: '', json: null, blur: null, turl: null, tpar: null }
    }

    if (typeof selectedImage.value[shapeKey] === 'string') {
        // Parse composite type if needed
        selectedImage.value[shapeKey] = { x: null, y: null, z: null, url: selectedImage.value[shapeKey], json: null, blur: null, turl: null, tpar: null }
    }

    selectedImage.value[shapeKey][field] = value

    // Update PreviewWide if we're editing the 'wide' shape URL
    if (activeShapeTab.value === 'wide' && field === 'url') {
        const adapter = selectedImage.value.author?.adapter || 'unsplash'
        if (adapter === 'unsplash') {
            PreviewWide.value = (value || '') + (CorrectionWide.value || '')
        } else if (adapter === 'cloudinary') {
            PreviewWide.value = value || ''
        }
    }

    checkDirty()
}

// Fetch status options from API
const fetchStatusOptions = async () => {
    try {
        const response = await fetch('/api/status?table=images')
        if (!response.ok) throw new Error('Failed to fetch status options')
        const data = await response.json()
        statusOptions.value = data.items || []
    } catch (error) {
        console.error('Error fetching status options:', error)
    }
}

// Helper function to parse composite shape from DB string
function parseShape(shapeStr: string | object): any {
    if (!shapeStr) return null
    if (typeof shapeStr === 'object') return shapeStr  // Already parsed

    // Remove outer parentheses and split by commas (handling quoted strings)
    const trimmed = shapeStr.trim().replace(/^\(/, '').replace(/\)$/, '')
    const parts: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i]
        if (char === '"') {
            inQuotes = !inQuotes
            // Don't include the quote in the value
        } else if (char === ',' && !inQuotes) {
            parts.push(current)
            current = ''
            continue
        } else {
            current += char
        }
    }
    parts.push(current)  // Push the last part

    return {
        x: parts[0] ? parseInt(parts[0]) : null,
        y: parts[1] ? parseInt(parts[1]) : null,
        z: parts[2] ? parseInt(parts[2]) : null,
        url: parts[3] || '',
        json: parts[4] || null,  // json field (not used yet)
        blur: parts[5] || null,  // BlurHash (quotes stripped)
        turl: parts[6] || null,  // thumbnail URL
        tpar: parts[7] || null   // thumbnail parameters
    }
}

// Fetch images from API
const fetchImages = async () => {
    loading.value = true
    try {
        const response = await fetch('/api/images')
        if (!response.ok) throw new Error('Failed to fetch images')
        const data = await response.json()
        // API returns array directly, not wrapped in { images: [...] }
        const rawImages = Array.isArray(data) ? data : []

        // Parse all shape fields for each image
        images.value = rawImages.map(img => {
            const parsed = { ...img }
            if (parsed.shape_square) parsed.shape_square = parseShape(parsed.shape_square)
            if (parsed.shape_wide) parsed.shape_wide = parseShape(parsed.shape_wide)
            if (parsed.shape_vertical) parsed.shape_vertical = parseShape(parsed.shape_vertical)
            if (parsed.shape_thumb) parsed.shape_thumb = parseShape(parsed.shape_thumb)
            return parsed
        })

        if (images.value.length > 0 && !selectedImage.value) {
            selectImage(images.value[0])
        }
    } catch (error) {
        console.error('Error fetching images:', error)
        alert('Failed to load images')
    } finally {
        loading.value = false
    }
}

// Select an image for editing
function selectImage(image: any) {
    selectedImage.value = { ...image }

    // Ensure ctags and rtags are Uint8Array
    if (selectedImage.value.ctags) {
        if (selectedImage.value.ctags.type === 'Buffer' && Array.isArray(selectedImage.value.ctags.data)) {
            // Convert Buffer object to Uint8Array
            selectedImage.value.ctags = new Uint8Array(selectedImage.value.ctags.data)
        } else if (!(selectedImage.value.ctags instanceof Uint8Array)) {
            // Convert any other array-like to Uint8Array
            selectedImage.value.ctags = new Uint8Array(selectedImage.value.ctags)
        }
    } else {
        // Initialize with default byte if missing
        selectedImage.value.ctags = new Uint8Array([0])
    }

    if (selectedImage.value.rtags) {
        if (selectedImage.value.rtags.type === 'Buffer' && Array.isArray(selectedImage.value.rtags.data)) {
            selectedImage.value.rtags = new Uint8Array(selectedImage.value.rtags.data)
        } else if (!(selectedImage.value.rtags instanceof Uint8Array)) {
            selectedImage.value.rtags = new Uint8Array(selectedImage.value.rtags)
        }
    } else {
        selectedImage.value.rtags = new Uint8Array([])
    }

    // Parse author if it's a string (database composite type)
    // Format: (adapter,file_id,account_id,folder_id,username,attribution)
    if (typeof selectedImage.value.author === 'string') {
        const match = selectedImage.value.author.match(/^\((.*)\)$/)
        if (match) {
            // Split by comma, but handle quoted strings properly
            const parts: string[] = []
            let current = ''
            let inQuotes = false
            let escapeNext = false

            for (let i = 0; i < match[1].length; i++) {
                const char = match[1][i]

                if (escapeNext) {
                    current += char
                    escapeNext = false
                } else if (char === '\\') {
                    escapeNext = true
                } else if (char === '"') {
                    inQuotes = !inQuotes
                } else if (char === ',' && !inQuotes) {
                    parts.push(current)
                    current = ''
                } else {
                    current += char
                }
            }
            parts.push(current) // Push the last part

            selectedImage.value.author = {
                adapter: parts[0] || 'unsplash',
                file_id: parts[1] || '',
                account_id: parts[2] || '',
                folder_id: parts[3] || '',
                username: parts[4] || '',
                attribution: parts[5] || ''
            }
        } else {
            try {
                selectedImage.value.author = JSON.parse(selectedImage.value.author)
            } catch {
                selectedImage.value.author = {
                    adapter: 'unsplash',
                    file_id: '',
                    account_id: '',
                    folder_id: '',
                    username: '',
                    attribution: ''
                }
            }
        }
    }

    // Ensure author has all fields
    if (!selectedImage.value.author) {
        selectedImage.value.author = {
            adapter: 'unsplash',
            file_id: '',
            account_id: '',
            folder_id: '',
            username: '',
            attribution: ''
        }
    }

    // Shape fields should already be parsed from fetchImages, but handle strings just in case
    if (typeof selectedImage.value.shape_square === 'string') {
        selectedImage.value.shape_square = parseShape(selectedImage.value.shape_square)
        console.log('[ImagesCoreAdmin] shape_square parsed:', selectedImage.value.shape_square)
    }
    if (typeof selectedImage.value.shape_wide === 'string') {
        selectedImage.value.shape_wide = parseShape(selectedImage.value.shape_wide)
        console.log('[ImagesCoreAdmin] shape_wide parsed:', selectedImage.value.shape_wide)
    }
    if (typeof selectedImage.value.shape_vertical === 'string') {
        selectedImage.value.shape_vertical = parseShape(selectedImage.value.shape_vertical)
        console.log('[ImagesCoreAdmin] shape_vertical parsed:', selectedImage.value.shape_vertical)
    }
    if (typeof selectedImage.value.shape_thumb === 'string') {
        selectedImage.value.shape_thumb = parseShape(selectedImage.value.shape_thumb)
        console.log('[ImagesCoreAdmin] shape_thumb parsed:', selectedImage.value.shape_thumb)
    }

    // Deep clone for dirty detection
    originalImage.value = JSON.parse(JSON.stringify(selectedImage.value))

    // Set authorAdapter from image data
    authorAdapter.value = selectedImage.value.author?.adapter || 'unsplash'

    // Load X, Y, Z values from shape objects (FIX: was resetting to null)
    // Card/Wide and Vertical shapes share same XYZ
    if (selectedImage.value.shape_wide) {
        cardWideX.value = selectedImage.value.shape_wide.x ?? null
        cardWideY.value = selectedImage.value.shape_wide.y ?? null
        cardWideZ.value = selectedImage.value.shape_wide.z ?? null
        console.log('[ImagesCoreAdmin] Loaded cardWide XYZ:', { x: cardWideX.value, y: cardWideY.value, z: cardWideZ.value })
    } else {
        cardWideX.value = null
        cardWideY.value = null
        cardWideZ.value = null
    }

    // Tile/Square/Thumb/Avatar shapes share same XYZ
    if (selectedImage.value.shape_thumb) {
        tileSquareX.value = selectedImage.value.shape_thumb.x ?? null
        tileSquareY.value = selectedImage.value.shape_thumb.y ?? null
        tileSquareZ.value = selectedImage.value.shape_thumb.z ?? null
        console.log('[ImagesCoreAdmin] Loaded tileSquare XYZ:', { x: tileSquareX.value, y: tileSquareY.value, z: tileSquareZ.value })
    } else {
        tileSquareX.value = null
        tileSquareY.value = null
        tileSquareZ.value = null
    }

    // Clear shape editor state (Plan D Task 2.5)
    clearShapeEditor()

    // Reset hero preview to wide (Plan E Task 1.1)
    heroPreviewShape.value = 'wide'

    // Initialize PreviewWide for card/wide focal-crop
    const adapter = selectedImage.value.author?.adapter || 'unsplash'
    if (adapter === 'unsplash') {
        PreviewWide.value = (selectedImage.value.shape_wide?.url || '') + (CorrectionWide.value || '')
    } else if (adapter === 'cloudinary') {
        PreviewWide.value = selectedImage.value.shape_wide?.url || ''
        // TODO: Add Positioning to c_crop,g_face,h_150,w_150
    }

    // Reset CorrectionWide
    CorrectionWide.value = ''

    isDirty.value = false
}

/**
 * Rebuild shape URL with XYZ focal point parameters
 * @param baseUrl - Original shape URL
 * @param x - Focal point X (0-1, null for auto)
 * @param y - Focal point Y (0-1, null for auto)
 * @param z - Focal point Z (zoom level, null for auto)
 * @returns Updated URL with focal point parameters
 */
function rebuildShapeUrlWithXYZ(baseUrl: string, x: number | null, y: number | null, z: number | null): string {
    if (!baseUrl) return baseUrl

    try {
        const url = new URL(baseUrl)

        // Detect adapter
        const isUnsplash = url.hostname.includes('unsplash.com')
        const isCloudinary = url.hostname.includes('cloudinary.com')

        if (isUnsplash) {
            // For Unsplash: switch crop mode based on XYZ values
            if (x !== null && y !== null && z !== null) {
                // XYZ mode: use focalpoint crop
                url.searchParams.set('crop', 'focalpoint')
                url.searchParams.set('fp-x', x.toString())
                url.searchParams.set('fp-y', y.toString())
                url.searchParams.set('fp-z', z.toString())
            } else {
                // Auto mode: use entropy crop
                url.searchParams.set('crop', 'entropy')
                // Remove focal point parameters
                url.searchParams.delete('fp-x')
                url.searchParams.delete('fp-y')
                url.searchParams.delete('fp-z')
            }
            url.searchParams.set('fit', 'crop')
        } else if (isCloudinary) {
            // For Cloudinary: update transformation parameters
            const match = baseUrl.match(/^(https?:\/\/[^\/]+\/[^\/]+\/image\/upload\/)([^\/]*)\/(.+)$/)
            if (match) {
                const [, prefix, transformations, suffix] = match

                // Parse existing transformations
                const params = new Map<string, string>()
                if (transformations) {
                    transformations.split(',').forEach(param => {
                        const [key, value] = param.split('_')
                        if (key && value) params.set(key, value)
                    })
                }

                if (x !== null && y !== null) {
                    // XYZ mode: set gravity to custom coordinates
                    params.set('c', 'fill')
                    params.set('g', `xy_center`)
                    params.set('x', Math.round((x - 0.5) * (params.get('w') ? parseInt(params.get('w')!) : 400)).toString())
                    params.set('y', Math.round((y - 0.5) * (params.get('h') ? parseInt(params.get('h')!) : 400)).toString())
                } else {
                    // Auto mode: use auto gravity
                    params.set('c', 'fill')
                    params.set('g', 'auto')
                    params.delete('x')
                    params.delete('y')
                }

                // Rebuild transformation string
                const newTransformations = Array.from(params.entries()).map(([k, v]) => `${k}_${v}`).join(',')
                return `${prefix}${newTransformations}/${suffix}`
            }
        }

        return url.toString()
    } catch (e) {
        console.error('Failed to rebuild URL with XYZ:', e)
        return baseUrl
    }
}

// Check if form is dirty
function checkDirty() {
    if (!selectedImage.value || !originalImage.value) {
        isDirty.value = false
        return
    }

    // Ensure author is an object and update only the adapter field
    if (typeof selectedImage.value.author !== 'object' || selectedImage.value.author === null) {
        selectedImage.value.author = {
            adapter: authorAdapter.value,
            file_id: '',
            account_id: '',
            folder_id: '',
            username: '',
            attribution: ''
        }
    } else {
        // Preserve all existing author fields, only update adapter
        selectedImage.value.author = {
            ...selectedImage.value.author,
            adapter: authorAdapter.value
        }
    }

    // Convert Uint8Array to arrays for comparison
    const current = {
        status_id: selectedImage.value.status_id,
        name: selectedImage.value.name,
        alt_text: selectedImage.value.alt_text,
        xmlid: selectedImage.value.xmlid,
        url: selectedImage.value.url,
        ctags: selectedImage.value.ctags ? Array.from(new Uint8Array(selectedImage.value.ctags)) : null,
        rtags: selectedImage.value.rtags ? Array.from(new Uint8Array(selectedImage.value.rtags)) : null,
        author: selectedImage.value.author,
        shape_square: selectedImage.value.shape_square,
        shape_wide: selectedImage.value.shape_wide,
        shape_vertical: selectedImage.value.shape_vertical,
        shape_thumb: selectedImage.value.shape_thumb
    }

    const original = {
        status_id: originalImage.value.status_id,
        name: originalImage.value.name,
        alt_text: originalImage.value.alt_text,
        xmlid: originalImage.value.xmlid,
        url: originalImage.value.url,
        ctags: originalImage.value.ctags ? Array.from(new Uint8Array(originalImage.value.ctags)) : null,
        rtags: originalImage.value.rtags ? Array.from(new Uint8Array(originalImage.value.rtags)) : null,
        author: typeof originalImage.value.author === 'object' ? originalImage.value.author : {},
        shape_square: originalImage.value.shape_square,
        shape_wide: originalImage.value.shape_wide,
        shape_vertical: originalImage.value.shape_vertical,
        shape_thumb: originalImage.value.shape_thumb
    }

    const currentStr = JSON.stringify(current)
    const originalStr = JSON.stringify(original)

    isDirty.value = currentStr !== originalStr
}

// Export all images to JSON
const exportImages = async () => {
    try {
        const response = await fetch('/api/images/export', {
            method: 'POST'
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Export failed: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        alert(`✅ Exported ${result.count} images to ${result.path}`)
    } catch (error) {
        console.error('Export error:', error)
        alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// System Backup (MR3)
const exportSystemBackup = async () => {
    if (!confirm('Create a full system backup? This will export all database tables to a tarball.')) {
        return
    }

    try {
        const response = await fetch('/api/admin/backup/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                database: 'demo-data.db',
                migrationPackage: 'A',
                description: `Manual backup from Images Admin - ${new Date().toLocaleString()}`
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Backup failed: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        if (result.success) {
            alert(`✅ System backup created successfully!\n\nFilename: ${result.data.filename}\nPackage: ${result.data.migrationPackage}\nTimestamp: ${new Date(result.data.timestamp).toLocaleString()}`)
        } else {
            throw new Error('Backup failed: ' + (result.message || 'Unknown error'))
        }
    } catch (error) {
        console.error('System backup error:', error)
        alert(`❌ System backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Delete image
const deleteImage = async () => {
    if (!selectedImage.value) return

    if (!confirm(`Are you sure you want to delete "${selectedImage.value.name || 'this image'}"?`)) {
        return
    }

    try {
        const response = await fetch(`/api/images/${selectedImage.value.id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Server error:', errorText)
            throw new Error(`Failed to delete image: ${response.status} ${errorText}`)
        }

        // Remove from local list
        const index = images.value.findIndex(img => img.id === selectedImage.value.id)
        if (index !== -1) {
            images.value.splice(index, 1)
        }

        // Select next or previous image
        if (images.value.length > 0) {
            const nextIndex = Math.min(index, images.value.length - 1)
            selectImage(images.value[nextIndex])
        } else {
            selectedImage.value = null
            originalImage.value = null
        }
    } catch (error) {
        console.error('Error deleting image:', error)
        alert(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Save all changes
const saveChanges = async () => {
    if (!selectedImage.value || !isDirty.value) return

    try {
        // Update shape objects with current XYZ values before saving
        // Card/Wide shape
        if (selectedImage.value.shape_wide) {
            const cardPreview = cardShapeRef.value?.getPreviewData?.()
            if (cardPreview) {
                selectedImage.value.shape_wide = {
                    ...selectedImage.value.shape_wide,
                    url: cardPreview.url || selectedImage.value.shape_wide.url,
                    x: cardPreview.params?.x ?? cardWideX.value,
                    y: cardPreview.params?.y ?? cardWideY.value,
                    z: cardPreview.params?.z ?? cardWideZ.value
                }
            } else {
                // Rebuild URL with XYZ parameters
                const newUrl = rebuildShapeUrlWithXYZ(
                    selectedImage.value.shape_wide.url,
                    cardWideX.value,
                    cardWideY.value,
                    cardWideZ.value
                )
                selectedImage.value.shape_wide = {
                    ...selectedImage.value.shape_wide,
                    url: newUrl,
                    x: cardWideX.value,
                    y: cardWideY.value,
                    z: cardWideZ.value
                }
            }
        }

        // Vertical shape
        if (selectedImage.value.shape_vertical) {
            const verticalPreview = verticalShapeRef.value?.getPreviewData?.()
            if (verticalPreview) {
                selectedImage.value.shape_vertical = {
                    ...selectedImage.value.shape_vertical,
                    url: verticalPreview.url || selectedImage.value.shape_vertical.url,
                    x: verticalPreview.params?.x ?? cardWideX.value,
                    y: verticalPreview.params?.y ?? cardWideY.value,
                    z: verticalPreview.params?.z ?? cardWideZ.value
                }
            } else {
                // Rebuild URL with XYZ parameters
                const newUrl = rebuildShapeUrlWithXYZ(
                    selectedImage.value.shape_vertical.url,
                    cardWideX.value,
                    cardWideY.value,
                    cardWideZ.value
                )
                selectedImage.value.shape_vertical = {
                    ...selectedImage.value.shape_vertical,
                    url: newUrl,
                    x: cardWideX.value,
                    y: cardWideY.value,
                    z: cardWideZ.value
                }
            }
        }

        // Tile/Square shape (uses shape_thumb)
        if (selectedImage.value.shape_thumb) {
            const tilePreview = tileShapeRef.value?.getPreviewData?.()
            if (tilePreview) {
                selectedImage.value.shape_thumb = {
                    ...selectedImage.value.shape_thumb,
                    url: tilePreview.url || selectedImage.value.shape_thumb.url,
                    x: tilePreview.params?.x ?? tileSquareX.value,
                    y: tilePreview.params?.y ?? tileSquareY.value,
                    z: tilePreview.params?.z ?? tileSquareZ.value
                }
            } else {
                // Rebuild URL with XYZ parameters
                const newUrl = rebuildShapeUrlWithXYZ(
                    selectedImage.value.shape_thumb.url,
                    tileSquareX.value,
                    tileSquareY.value,
                    tileSquareZ.value
                )
                selectedImage.value.shape_thumb = {
                    ...selectedImage.value.shape_thumb,
                    url: newUrl,
                    x: tileSquareX.value,
                    y: tileSquareY.value,
                    z: tileSquareZ.value
                }
            }
        }

        // Avatar uses same XYZ as tile/square
        if (selectedImage.value.shape_square) {
            const avatarPreview = avatarShapeRef.value?.getPreviewData?.()
            if (avatarPreview) {
                selectedImage.value.shape_square = {
                    ...selectedImage.value.shape_square,
                    url: avatarPreview.url || selectedImage.value.shape_square.url,
                    x: avatarPreview.params?.x ?? tileSquareX.value,
                    y: avatarPreview.params?.y ?? tileSquareY.value,
                    z: avatarPreview.params?.z ?? tileSquareZ.value
                }
            } else {
                // Rebuild URL with XYZ parameters
                const newUrl = rebuildShapeUrlWithXYZ(
                    selectedImage.value.shape_square.url,
                    tileSquareX.value,
                    tileSquareY.value,
                    tileSquareZ.value
                )
                selectedImage.value.shape_square = {
                    ...selectedImage.value.shape_square,
                    url: newUrl,
                    x: tileSquareX.value,
                    y: tileSquareY.value,
                    z: tileSquareZ.value
                }
            }
        }

        // Convert Uint8Array to array, but keep null if empty
        const ctagsArray = selectedImage.value.ctags && selectedImage.value.ctags.length > 0
            ? Array.from(new Uint8Array(selectedImage.value.ctags))
            : null
        const rtagsArray = selectedImage.value.rtags && selectedImage.value.rtags.length > 0
            ? Array.from(new Uint8Array(selectedImage.value.rtags))
            : null

        const payload = {
            status_id: selectedImage.value.status_id,
            name: selectedImage.value.name,
            alt_text: selectedImage.value.alt_text,
            xmlid: selectedImage.value.xmlid,
            url: selectedImage.value.url,
            ctags: ctagsArray,
            rtags: rtagsArray,
            author: selectedImage.value.author,
            shape_square: selectedImage.value.shape_square,
            shape_wide: selectedImage.value.shape_wide,
            shape_vertical: selectedImage.value.shape_vertical,
            shape_thumb: selectedImage.value.shape_thumb
        }

        const response = await fetch(`/api/images/${selectedImage.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Server error:', errorText)
            throw new Error(`Failed to update image: ${response.status} ${errorText}`)
        }

        const updatedImage = await response.json()

        // Convert Buffer to Uint8Array for ctags/rtags (same as selectImage)
        if (updatedImage.ctags) {
            if (updatedImage.ctags.type === 'Buffer' && Array.isArray(updatedImage.ctags.data)) {
                updatedImage.ctags = new Uint8Array(updatedImage.ctags.data)
            } else if (!(updatedImage.ctags instanceof Uint8Array)) {
                updatedImage.ctags = new Uint8Array(updatedImage.ctags)
            }
        } else {
            updatedImage.ctags = new Uint8Array([0])
        }

        if (updatedImage.rtags) {
            if (updatedImage.rtags.type === 'Buffer' && Array.isArray(updatedImage.rtags.data)) {
                updatedImage.rtags = new Uint8Array(updatedImage.rtags.data)
            } else if (!(updatedImage.rtags instanceof Uint8Array)) {
                updatedImage.rtags = new Uint8Array(updatedImage.rtags)
            }
        } else {
            updatedImage.rtags = new Uint8Array([])
        }

        // Update local state with server response
        const index = images.value.findIndex(img => img.id === selectedImage.value.id)
        if (index !== -1) {
            images.value[index] = { ...updatedImage }
            selectedImage.value = { ...updatedImage }
        }

        // Reset dirty state
        originalImage.value = JSON.parse(JSON.stringify(selectedImage.value))
        isDirty.value = false

        // Clear shape editor state after save (Plan D Task 2.5)
        clearShapeEditor()
    } catch (error) {
        console.error('Error saving changes:', error)
        alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Set bits in ctags byte array
const setBits = (bytea: Uint8Array | null, startBit: number, numBits: number, value: number): Uint8Array => {
    const buffer = bytea && bytea.length > 0 ? new Uint8Array(bytea) : new Uint8Array(1)
    const mask = (1 << numBits) - 1
    const clearedByte = buffer[0] & ~(mask << startBit)
    buffer[0] = clearedByte | ((value & mask) << startBit)
    return buffer
}

// Update ctags - now just marks as dirty
const updateCtags = (bitGroup: number, value: number) => {
    if (!selectedImage.value) return

    // bitGroup: 0=age(0-1), 1=subject(2-3), 2=access(4-5), 3=quality(6-7)
    const startBit = bitGroup * 2
    const currentCtags = selectedImage.value.ctags ? new Uint8Array(selectedImage.value.ctags) : null
    selectedImage.value.ctags = setBits(currentCtags, startBit, 2, value)
    checkDirty()
}

// Update rtags - now just marks as dirty
const updateRtags = (newRtags: number[]) => {
    if (!selectedImage.value) return
    selectedImage.value.rtags = new Uint8Array(newRtags)
    checkDirty()
}

// Update author subfields - now just marks as dirty
const updateAuthor = (field: string, value: string) => {
    if (!selectedImage.value) return
    if (!selectedImage.value.author) {
        selectedImage.value.author = {}
    }
    selectedImage.value.author[field] = value
    checkDirty()
}

// Extract ctags bit groups for editing
const ctagsAgeGroup = computed(() => {
    if (!selectedImage.value?.ctags) return 0
    const ctags = new Uint8Array(selectedImage.value.ctags)
    return extractBits(ctags, 0, 2)
})

const ctagsSubjectType = computed(() => {
    if (!selectedImage.value?.ctags) return 0
    const ctags = new Uint8Array(selectedImage.value.ctags)
    return extractBits(ctags, 2, 2)
})

const ctagsAccessLevel = computed(() => {
    if (!selectedImage.value?.ctags) return 0
    const ctags = new Uint8Array(selectedImage.value.ctags)
    return extractBits(ctags, 4, 2)
})

const ctagsQuality = computed(() => {
    if (!selectedImage.value?.ctags) return 0
    const ctags = new Uint8Array(selectedImage.value.ctags)
    return extractBits(ctags, 6, 2)
})

const rtagsAsArray = computed(() => {
    if (!selectedImage.value?.rtags) return []
    const rtags = new Uint8Array(selectedImage.value.rtags)
    return Array.from(rtags)
})

// Get status name by value
const getStatusName = (statusValue: number) => {
    const status = statusOptions.value.find(s => s.value === statusValue)
    return status ? status.name : `Status ${statusValue}`
}

// Reset filters
const resetFilters = () => {
    filterStatusId.value = null
    filterAgeGroup.value = null
    filterSubjectType.value = null
    filterAccessLevel.value = null
    filterQuality.value = null
}

// Handle import save
const handleImportSave = async (importedImages: any[]) => {
    // Close the modal and refresh the image list
    showImportModal.value = false
    await fetchImages()
}

// =====================================================================
// Hero Preview Toggle (Plan E Task 1.1)
// =====================================================================

// Computed hero preview URL based on selected shape
const heroPreviewUrl = computed(() => {
    if (!selectedImage.value) return ''

    const shapeMap = {
        wide: 'shape_wide',
        square: 'shape_square',
        vertical: 'shape_vertical'
    }

    const shapeKey = shapeMap[heroPreviewShape.value]
    const shapeData = selectedImage.value[shapeKey]

    if (!shapeData) return selectedImage.value.url || ''

    // Always use 416px width for preview, calculate height based on shape aspect ratio
    const baseUrl = shapeData.url || selectedImage.value.url || ''
    if (!baseUrl) return ''

    // Calculate height based on shape aspect ratio
    // Shape aspect ratios:
    // - wide: 2:1 (336:168) → 416:208
    // - square: 1:1 (128:128) → 416:416
    // - vertical: 9:16 (126:224) → 416:~741
    let height: number
    switch (heroPreviewShape.value) {
        case 'wide':
            height = 208  // 416 / 2
            break
        case 'square':
            height = 416  // 416 / 1
            break
        case 'vertical':
            height = Math.round(416 * (224 / 126))  // 416 * 1.778 = ~741
            break
        default:
            height = 416
    }

    // Detect adapter
    const adapter = baseUrl.includes('images.unsplash.com') ? 'unsplash'
        : baseUrl.includes('cloudinary.com') ? 'cloudinary'
            : 'external'

    // Build 416px URL with correct aspect ratio
    if (adapter === 'unsplash') {
        try {
            const url = new URL(baseUrl)
            url.searchParams.set('w', '416')
            url.searchParams.set('h', height.toString())
            url.searchParams.set('fit', 'crop')
            return url.toString()
        } catch (e) {
            return baseUrl
        }
    } else if (adapter === 'cloudinary') {
        try {
            const match = baseUrl.match(/^(https?:\/\/[^\/]+\/[^\/]+\/image\/upload\/)([^\/]*)\/(.+)$/)
            if (match) {
                const [, prefix, , suffix] = match
                return `${prefix}c_fill,w_416,h_${height}/${suffix}`
            }
        } catch (e) {
            return baseUrl
        }
    }

    return baseUrl
})

// Toggle between shapes (wide → square → vertical → repeat)
const toggleHeroPreviewShape = () => {
    const shapes: Array<'wide' | 'square' | 'vertical'> = ['wide', 'square', 'vertical']
    const currentIndex = shapes.indexOf(heroPreviewShape.value)
    const nextIndex = (currentIndex + 1) % shapes.length
    heroPreviewShape.value = shapes[nextIndex]
}

// Computed: Check if Y and Z should be disabled for card/wide
const cardWideYZDisabled = computed(() => cardWideX.value === null)

// Computed: Get card/wide data with PreviewWide URL when available
const cardWidePreviewData = computed(() => {
    if (!selectedImage.value?.shape_wide) return null

    // If PreviewWide has content and is different from the base URL, use it
    if (PreviewWide.value && PreviewWide.value !== selectedImage.value.shape_wide.url) {
        return {
            ...selectedImage.value.shape_wide,
            url: PreviewWide.value
        }
    }

    return selectedImage.value.shape_wide
})

// Watch cardWideX: When X is set from null to a value, initialize Y and Z to 0
watch(cardWideX, (newVal, oldVal) => {
    if (oldVal === null && newVal !== null) {
        if (cardWideY.value === null) cardWideY.value = 0
        if (cardWideZ.value === null) cardWideZ.value = 0
    }
})

// Handle Enter key on X input: Set to 50 (middle) if NULL or empty
const handleCardWideXEnter = () => {
    if (cardWideX.value === null || cardWideX.value === undefined || isNaN(cardWideX.value)) {
        cardWideX.value = 50
    }
}

// Preview card/wide with focal-crop
const previewCardWide = () => {
    if (!selectedImage.value?.shape_wide?.url) return

    const adapter = selectedImage.value.author?.adapter || 'unsplash'

    if (adapter === 'unsplash') {
        // Compute imgix focal-crop parameters
        // https://docs.imgix.com/en-US/apis/rendering/focal-point-crop
        const x = cardWideX.value
        const y = cardWideY.value
        const z = cardWideZ.value

        if (x !== null) {
            try {
                const baseUrl = selectedImage.value.shape_wide.url
                const urlObj = new URL(baseUrl)

                // Set crop=focalpoint for Unsplash focal-point cropping
                urlObj.searchParams.set('crop', 'focalpoint')

                // Set dimensions for card/wide (672x224 based on 2x card width)
                urlObj.searchParams.set('w', '672')
                urlObj.searchParams.set('h', '224')
                urlObj.searchParams.set('fit', 'crop')

                // fp-x: horizontal position (0-1, where 0.5 is center)
                // Convert from our scale (0-100) to imgix scale (0-1)
                urlObj.searchParams.set('fp-x', (x / 100).toFixed(2))

                // fp-y: vertical position (0-1, where 0.5 is center)
                if (y !== null) {
                    urlObj.searchParams.set('fp-y', (y / 100).toFixed(2))
                }

                // fp-z: zoom level (1+, where 1 is no zoom)
                // Convert from our scale (0-100) to imgix scale (1-2)
                if (z !== null && z !== 0) {
                    urlObj.searchParams.set('fp-z', (z / 100 + 1).toFixed(2))
                }

                // Force reactivity by temporarily clearing and then setting
                const newPreviewUrl = urlObj.toString()
                PreviewWide.value = ''
                CorrectionWide.value = ''

                // Use nextTick to ensure Vue processes the change
                setTimeout(() => {
                    PreviewWide.value = newPreviewUrl
                    CorrectionWide.value = newPreviewUrl.substring(baseUrl.length)
                }, 0)
            } catch (error) {
                console.error('Error creating preview URL:', error)
                PreviewWide.value = selectedImage.value.shape_wide.url
                CorrectionWide.value = ''
            }
        }
    } else if (adapter === 'cloudinary') {
        // TODO: Add Positioning to c_crop,g_face,h_150,w_150
        PreviewWide.value = selectedImage.value.shape_wide.url
        CorrectionWide.value = ''
    }
}

// Save card/wide shape URL. Prefer reading the current preview/state from the
// child ImgShape component via its exposed getPreviewData(). Falls back to
// the local refs if the child doesn't provide data.
const saveCardWideUrl = () => {
    if (!selectedImage.value) return

    if (!selectedImage.value.shape_wide) {
        selectedImage.value.shape_wide = { url: '', x: null, y: null, z: null, json: null, blur: null, turl: null, tpar: null }
    }

    // Try to read from child component first
    const preview = cardShapeRef.value?.getPreviewData?.()

    if (preview && preview.url) {
        selectedImage.value.shape_wide = {
            ...selectedImage.value.shape_wide,
            url: preview.url,
            x: preview.params?.x ?? cardWideX.value,
            y: preview.params?.y ?? cardWideY.value,
            z: preview.params?.z ?? cardWideZ.value
        }
    } else {
        // Fallback to previous approach
        selectedImage.value.shape_wide = {
            ...selectedImage.value.shape_wide,
            url: cardWideShapeUrl.value,
            x: cardWideX.value,
            y: cardWideY.value,
            z: cardWideZ.value
        }
    }

    checkDirty()
    alert('Card/Wide URL saved to shape_wide')
}

// Save tile/square shape URL. Prefer reading from ImgShape child component.
const saveTileSquareUrl = () => {
    if (!selectedImage.value) return

    if (!selectedImage.value.shape_thumb) {
        selectedImage.value.shape_thumb = { url: '', x: null, y: null, z: null, json: null, blur: null, turl: null, tpar: null }
    }

    const preview = tileShapeRef.value?.getPreviewData?.()

    if (preview && preview.url) {
        selectedImage.value.shape_thumb = {
            ...selectedImage.value.shape_thumb,
            url: preview.url,
            x: preview.params?.x ?? tileSquareX.value,
            y: preview.params?.y ?? tileSquareY.value,
            z: preview.params?.z ?? tileSquareZ.value
        }
    } else {
        selectedImage.value.shape_thumb = {
            ...selectedImage.value.shape_thumb,
            url: tileWideShapeUrl.value,
            x: tileSquareX.value,
            y: tileSquareY.value,
            z: tileSquareZ.value
        }
    }

    checkDirty()
    alert('Tile/Square URL saved to shape_thumb')
}

// =====================================================================
// Shape Editor Integration (Plan D Task 2.4 + Plan G Enhancement)
// =====================================================================

// Get ref for active shape
const getActiveShapeRef = () => {
    if (!activeShape.value) return null

    const shape = activeShape.value.shape
    if (shape === 'wide' || shape === 'card') return cardShapeRef.value
    if (shape === 'square' || shape === 'tile' || shape === 'thumb') return tileShapeRef.value
    if (shape === 'vertical') return verticalShapeRef.value
    if (shape === 'avatar') return avatarShapeRef.value

    return null
}

// Handle ImgShape activation (click-to-edit)
const handleShapeActivate = (data: { shape: string; variant: string; adapter: string }) => {
    activeShape.value = data
    console.log('[ShapeEditor] Activated:', data)
}

// Handle shape editor updates (XYZ changes)
const handleShapeUpdate = (data: Partial<{ x: number | null; y: number | null; z: number | null; url: string; tpar: string | null }>) => {
    if (!selectedImage.value || !activeShape.value) return

    const shape = activeShape.value.shape

    // Update local XYZ state
    if (shape === 'wide' || shape === 'card') {
        if (data.x !== undefined) cardWideX.value = data.x
        if (data.y !== undefined) cardWideY.value = data.y
        if (data.z !== undefined) cardWideZ.value = data.z
    } else if (shape === 'square' || shape === 'tile' || shape === 'thumb') {
        if (data.x !== undefined) tileSquareX.value = data.x
        if (data.y !== undefined) tileSquareY.value = data.y
        if (data.z !== undefined) tileSquareZ.value = data.z
    }

    // Update ImgShape preview in real-time
    const shapeRef = getActiveShapeRef()
    if (shapeRef && shapeRef.updatePreview) {
        shapeRef.updatePreview(
            data.url || selectedImage.value.url,
            { x: data.x, y: data.y, z: data.z },
            'preview'
        )
    }

    console.log('[ShapeEditor] Updated:', data, 'ShapeRef:', !!shapeRef)
    checkDirty()
}

// Handle shape editor preview button
const handleShapePreview = () => {
    if (!activeShape.value) return

    const shape = activeShape.value.shape

    // Call appropriate preview/save function based on shape
    if (shape === 'wide' || shape === 'card') {
        previewCardWide()
    } else if (shape === 'square' || shape === 'tile' || shape === 'thumb') {
        // For tile/square, just ensure preview is showing in ImgShape
        const shapeRef = getActiveShapeRef()
        if (shapeRef && shapeRef.getPreviewData) {
            const preview = shapeRef.getPreviewData()
            console.log('[ShapeEditor] Current tile preview:', preview)
        }
    }

    console.log('[ShapeEditor] Preview triggered for:', shape)
}

// Handle shape editor reset
const handleShapeReset = () => {
    if (!activeShape.value) return

    const shape = activeShape.value.shape

    // Reset local XYZ state to NULL
    if (shape === 'wide' || shape === 'card') {
        cardWideX.value = null
        cardWideY.value = null
        cardWideZ.value = null
    } else if (shape === 'square' || shape === 'tile' || shape === 'thumb') {
        tileSquareX.value = null
        tileSquareY.value = null
        tileSquareZ.value = null
    }

    // Reset ImgShape preview
    const shapeRef = getActiveShapeRef()
    if (shapeRef && shapeRef.resetPreview) {
        shapeRef.resetPreview()
    }

    // Mark as dirty since XYZ values changed (ERR2 fix)
    checkDirty()

    console.log('[ShapeEditor] Reset:', shape, '- marked as dirty')
}

// Clear active shape when loading new record or after save
const clearShapeEditor = () => {
    activeShape.value = null
}

onMounted(() => {
    // Extract image dimensions from CSS variables for ImgShape components
    extractImageDimensions()
    fetchStatusOptions()
    fetchImages()
})
</script>

<template>
    <div class="images-core-admin">
        <PageLayout setSiteLayout="fullTwo" navbarMode="dashboard">
            <template #logo>
                <span class="admin-logo">Images Core</span>
            </template>

            <!-- Navbar with dropdown menus -->
            <template #topnav-actions>
                <div class="topnav-menus">
                    <!-- Filters Menu -->
                    <div class="menu-dropdown">
                        <button class="menu-button" @click="showFiltersMenu = !showFiltersMenu">
                            Filters ▼
                        </button>
                        <div v-if="showFiltersMenu" class="menu-content">
                            <!-- Status filter -->
                            <div class="menu-item">
                                <label>Status:</label>
                                <select v-model="filterStatusId" class="filter-select">
                                    <option :value="null">All Status</option>
                                    <option v-for="status in statusOptions" :key="status.id" :value="status.value">
                                        {{ status.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Age Group filter (bits 0-1) -->
                            <div class="menu-item">
                                <label>Age Group:</label>
                                <select v-model="filterAgeGroup" class="filter-select">
                                    <option :value="null">All Ages</option>
                                    <option v-for="opt in ageGroupOptions" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Subject Type filter (bits 2-3) -->
                            <div class="menu-item">
                                <label>Subject Type:</label>
                                <select v-model="filterSubjectType" class="filter-select">
                                    <option :value="null">All Subjects</option>
                                    <option v-for="opt in subjectTypeOptions" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Access Level filter (bits 4-5) -->
                            <div class="menu-item">
                                <label>Access Level:</label>
                                <select v-model="filterAccessLevel" class="filter-select">
                                    <option :value="null">All Access</option>
                                    <option v-for="opt in accessLevelOptions" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Quality filter (bits 6-7) -->
                            <div class="menu-item">
                                <label>Quality:</label>
                                <select v-model="filterQuality" class="filter-select">
                                    <option :value="null">All Quality</option>
                                    <option v-for="opt in qualityOptions" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

                            <div class="menu-divider"></div>

                            <button class="menu-action-button" @click="resetFilters(); showFiltersMenu = false">
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    <!-- Data Menu -->
                    <div class="menu-dropdown">
                        <button class="menu-button" @click="showDataMenu = !showDataMenu">
                            Data ▼
                        </button>
                        <div v-if="showDataMenu" class="menu-content">
                            <button class="menu-action-button" @click="showImportModal = true; showDataMenu = false">
                                Import Images
                            </button>
                            <button class="menu-action-button" @click="exportImages(); showDataMenu = false">
                                Export JSON
                            </button>
                            <div class="menu-divider"></div>
                            <div class="menu-section-title">System Administration</div>
                            <button class="menu-action-button" @click="exportSystemBackup(); showDataMenu = false">
                                Create System Backup
                            </button>
                        </div>

                        <!-- Import Modal (positioned relative to Data menu) -->
                        <cimgImport :isOpen="showImportModal" @update:isOpen="showImportModal = $event"
                            @save="handleImportSave" />
                    </div>

                    <!-- Settings Menu -->
                    <div class="menu-dropdown">
                        <button class="menu-button" @click="showSettingsMenu = !showSettingsMenu">
                            Settings ▼
                        </button>
                        <div v-if="showSettingsMenu" class="menu-content">
                            <div class="menu-section-title">Image Preview</div>

                            <div class="menu-item menu-toggle">
                                <label>Blur Images:</label>
                                <button class="toggle-button" :class="{ active: blurImagesPreview }"
                                    @click="blurImagesPreview = !blurImagesPreview">
                                    {{ blurImagesPreview ? 'ON' : 'OFF' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Main content: Image list -->
            <div class="main-content">
                <div v-if="loading" class="loading-state">Loading images...</div>

                <div v-else-if="filteredImages.length === 0" class="empty-state">
                    No images found
                </div>

                <div v-else class="image-list">
                    <div v-for="image in filteredImages" :key="image.id" class="image-row"
                        :class="{ 'selected': selectedImage?.id === image.id }" @click="selectImage(image)">
                        <!-- Avatar using ImgShape tile/square variant -->
                        <div class="image-avatar">
                            <ImgShape v-if="image.shape_thumb" :data="image.shape_thumb" shape="tile" variant="square"
                                class="image-list-thumb" :forceBlur="false" />
                            <img v-else :src="(image.url || '/dummy.svg') + (image.url ? '?w=72&h=72&fit=crop' : '')"
                                :alt="image.name" />
                        </div>

                        <!-- Fields -->
                        <div class="image-fields">
                            <div class="field-row">
                                <span class="field-label">Status:</span>
                                <span class="field-value">{{ getStatusName(image.status_id) }}</span>
                            </div>
                            <div class="field-row">
                                <span class="field-label">Name:</span>
                                <span class="field-value">{{ image.name || 'Untitled' }}</span>
                            </div>
                            <div class="field-row">
                                <span class="field-label">Alt:</span>
                                <span class="field-value">{{ image.alt_text || '—' }}</span>
                            </div>
                            <div class="field-row">
                                <span class="field-label">XML ID:</span>
                                <span class="field-value">{{ image.xmlid || '—' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Header: Image preview -->
            <template #header>
                <div v-if="selectedImage" class="header-preview">
                    <Columns gap="medium">
                        <!-- Column 1: Hero preview image (fills remaining width - Plan E Task 1.1) -->
                        <Column width="fill">
                            <div class="preview-image-wrapper" @click="toggleHeroPreviewShape">
                                <img :src="heroPreviewUrl" :alt="selectedImage.name"
                                    class="preview-image hero-preview" />
                                <!-- Shape indicator badge -->
                                <div class="hero-shape-indicator">
                                    <span class="indicator-badge">{{ heroPreviewShape }}</span>
                                </div>
                            </div>
                        </Column>

                        <!-- Column 2: Vertical shape preview (exact width: 142px = 8.875rem) -->
                        <Column :width="verticalColumnWidth" class="vertical-column">
                            <div class="shape-row shape-row-vertical">
                                <ImgShape ref="verticalShapeRef" v-if="selectedImage.shape_vertical"
                                    :data="selectedImage.shape_vertical" shape="card" variant="vertical"
                                    class="VerticalShape" :forceBlur="blurImagesPreview" :editable="true"
                                    :active="activeShape?.shape === 'card' && activeShape?.variant === 'vertical'"
                                    @shapeUrl="(url: string) => verticalShapeUrl = url"
                                    @activate="handleShapeActivate" />
                            </div>
                        </Column>

                        <!-- Column 3: Shape previews (2/5 width) -->
                        <Column width="1/5">
                            <!-- Row 1: Card/Wide shape -->
                            <div class="shape-row">
                                <ImgShape ref="cardShapeRef" v-if="cardWidePreviewData" :data="cardWidePreviewData"
                                    shape="card" variant="wide" class="CardShape" :forceBlur="blurImagesPreview"
                                    :editable="true"
                                    :active="activeShape?.shape === 'card' && activeShape?.variant === 'wide'"
                                    @shapeUrl="(url: string) => cardWideShapeUrl = url"
                                    @activate="handleShapeActivate" />
                            </div>

                            <!-- Row 2: Two smaller shapes side by side -->
                            <div class="shape-row shape-row-split">
                                <div class="shape-col">
                                    <ImgShape ref="tileShapeRef" v-if="selectedImage.shape_thumb"
                                        :data="selectedImage.shape_thumb" shape="tile" variant="square"
                                        class="TileShape" :forceBlur="blurImagesPreview" :editable="true"
                                        :active="activeShape?.shape === 'tile' && activeShape?.variant === 'square'"
                                        @shapeUrl="(url: string) => tileWideShapeUrl = url"
                                        @activate="handleShapeActivate" />
                                </div>
                                <div class="shape-col">
                                    <ImgShape ref="avatarShapeRef" v-if="selectedImage.shape_thumb"
                                        :data="selectedImage.shape_thumb" shape="avatar" class="AvatarShape"
                                        :forceBlur="blurImagesPreview" :editable="true"
                                        :active="activeShape?.shape === 'avatar'"
                                        @shapeUrl="(url: string) => avatarThumbShapeUrl = url"
                                        @activate="handleShapeActivate" />
                                </div>
                            </div>
                        </Column>

                        <!-- Column 4: Controls (1/5 width) - Simplified (Plan E Task 1.3) -->
                        <Column width="auto">
                            <div class="controls-placeholder">
                                <p class="placeholder-text">Click a shape to edit</p>
                                <div v-if="activeShape" class="active-shape-info">
                                    <span class="shape-badge">{{ activeShape.shape }}</span>
                                    <span class="adapter-badge">{{ activeShape.adapter }}</span>
                                </div>
                            </div>
                            <!-- Shape Editor (Plan D Task 2.4 + Plan G Enhancement) -->
                            <div v-if="activeShape" class="shape-editor-section">
                                <ShapeEditor :shape="activeShape.shape as any" :variant="activeShape.variant"
                                    :adapter="activeShape.adapter as any" :data="{
                                        x: activeShapeXYZ.x,
                                        y: activeShapeXYZ.y,
                                        z: activeShapeXYZ.z,
                                        url: selectedImage.url,
                                        tpar: selectedImage.tpar || null
                                    }" @update="handleShapeUpdate" @preview="handleShapePreview"
                                    @reset="handleShapeReset" />
                            </div>
                        </Column>
                    </Columns>
                </div>
            </template>

            <!-- Aside: Selected image details -->
            <template #aside>
                <div class="aside-content">
                    <div v-if="!selectedImage" class="no-selection">
                        Select an image to view details
                    </div>

                    <div v-else class="image-details">
                        <!-- Save and Delete buttons -->
                        <div class="save-section">
                            <button class="btn-delete" @click="deleteImage">
                                Delete
                            </button>
                            <button class="btn-save" :class="{ 'dirty': isDirty }" :disabled="!isDirty"
                                @click="saveChanges">
                                {{ isDirty ? 'Save Changes' : 'No Changes' }}
                            </button>
                        </div>

                        <!-- Editable fields -->
                        <div class="editable-fields">
                            <!-- Status -->
                            <div class="edit-row">
                                <label>Status:</label>
                                <select v-model="selectedImage.status_id" class="filter-select" @change="checkDirty()">
                                    <option v-for="status in statusOptions" :key="status.id" :value="status.value">
                                        {{ status.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Name -->
                            <div class="edit-row">
                                <label>Name:</label>
                                <input v-model="selectedImage.name" type="text" class="edit-input"
                                    placeholder="Untitled" @input="checkDirty()" />
                            </div>

                            <!-- Alt Text -->
                            <div class="edit-row">
                                <label>Alt Text:</label>
                                <input v-model="selectedImage.alt_text" type="text" class="edit-input" placeholder="—"
                                    @input="checkDirty()" />
                            </div>

                            <!-- XML ID -->
                            <div class="edit-row">
                                <label>XML ID:</label>
                                <input v-model="selectedImage.xmlid" type="text" class="edit-input" placeholder="—"
                                    @input="checkDirty()" />
                            </div>

                            <!-- CTags: 2-bit toggle groups -->
                            <div class="edit-section">
                                <h4>Content Tags (CTags)</h4>

                                <div class="edit-row-with-hint">
                                    <label>
                                        Age Group
                                        <span class="label-hint">bits 0-1</span>
                                    </label>
                                    <select :value="ctagsAgeGroup"
                                        @change="updateCtags(0, parseInt(($event.target as HTMLSelectElement).value))"
                                        class="filter-select">
                                        <option v-for="opt in ageGroupOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="edit-row-with-hint">
                                    <label>
                                        Subject Type
                                        <span class="label-hint">bits 2-3</span>
                                    </label>
                                    <select :value="ctagsSubjectType"
                                        @change="updateCtags(1, parseInt(($event.target as HTMLSelectElement).value))"
                                        class="filter-select">
                                        <option v-for="opt in subjectTypeOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="edit-row-with-hint">
                                    <label>
                                        Access Level
                                        <span class="label-hint">bits 4-5</span>
                                    </label>
                                    <select :value="ctagsAccessLevel"
                                        @change="updateCtags(2, parseInt(($event.target as HTMLSelectElement).value))"
                                        class="filter-select">
                                        <option v-for="opt in accessLevelOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="edit-row-with-hint">
                                    <label>
                                        Quality
                                        <span class="label-hint">bits 6-7</span>
                                    </label>
                                    <select :value="ctagsQuality"
                                        @change="updateCtags(3, parseInt(($event.target as HTMLSelectElement).value))"
                                        class="filter-select">
                                        <option v-for="opt in qualityOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <!-- Divider -->
                            <hr class="form-divider">

                            <!-- RTags section would go here if needed -->

                        </div>
                    </div>
                </div>
            </template>
        </PageLayout>
    </div>
</template>

<style scoped>
.images-core-admin {
    min-height: 100vh;
}

.admin-logo {
    font-weight: 600;
    font-size: 1.25rem;
    color: var(--color-primary-base);
}

/* Header preview */
.header-preview {
    width: 100%;
    max-width: 100%;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
    box-shadow: 0 4px 12px oklcha(0, 0%, 0%, 0.1);
}

.preview-image-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    overflow: hidden;
    min-height: 300px;
    cursor: pointer;
    transition: transform 0.2s;
}

.preview-image-wrapper:hover {
    transform: scale(1.01);
}

.preview-image {
    max-width: 100%;
    max-height: 400px;
    height: auto;
    display: block;
    object-fit: contain;
}

.hero-preview {
    cursor: pointer;
}

.hero-shape-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
}

.indicator-badge {
    padding: 0.5rem 1rem;
    background: oklch(0 0 0 / 0.7);
    color: white;
    border-radius: var(--radius-medium);
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    backdrop-filter: blur(10px);
}

/* Shape preview rows */
.shape-row {
    margin-bottom: 1rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 150px;
}

.vertical-column {
    margin-left: 1rem;
    margin-right: 0;
}

.shape-row-vertical {
    width: 7.875rem;
    /* 126px exact */
    min-height: 100%;
    margin-bottom: 0;
}

.shape-row-split {
    display: flex;
    gap: 1rem;
    min-height: auto;
}

.shape-col {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    overflow: hidden;
    min-height: 120px;
    padding: 0.5rem;
}

.CardShape,
.TileShape,
.AvatarShape {
    max-width: 100%;
    height: auto;
}

/* Controls placeholder (Plan E Task 1.3) */
.controls-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 300px;
    text-align: center;
    padding: 2rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.placeholder-text {
    font-size: 0.875rem;
    color: var(--color-text-dimmed);
    margin-bottom: 1rem;
}

.active-shape-info {
    display: flex;
    gap: 0.5rem;
}

.shape-badge,
.adapter-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    border-radius: var(--radius-small);
    font-weight: 600;
}

.shape-badge {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.adapter-badge {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

/* Control sections */
.control-section {
    margin-bottom: 1rem;
}

.dimmed-bg {
    background: var(--color-muted-bg);
    padding: 0.75rem;
    border-radius: var(--radius-small);
    text-align: center;
}

.control-label {
    font-family: var(--headings);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-dimmed);
    text-transform: uppercase;
}

.correction-preview {
    font-size: 0.75rem;
    font-weight: 400;
    font-family: monospace;
    color: var(--color-text-base);
    margin-top: 0.25rem;
    text-transform: none;
    word-break: break-all;
}

.control-header {
    margin-bottom: 0.5rem;
}

.control-inputs {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.control-input {
    flex: 1;
    padding: 0.2rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-size: 0.8rem;
    min-width: 0;
}

.control-input:focus {
    outline: none;
    border-color: var(--color-primary-base);
}

.control-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-muted-bg);
}

.btn-preview-url {
    padding: 0.5rem 0.75rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    transition: opacity 0.2s;
}

.btn-preview-url:hover {
    opacity: 0.9;
}

.btn-save-url {
    padding: 0.5rem 0.75rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    transition: opacity 0.2s;
}

.btn-save-url:hover {
    opacity: 0.9;
}

/* Topnav dropdown menus */
.topnav-menus {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.menu-dropdown {
    position: relative;
}

.menu-button {
    padding: 0.5rem 1rem;
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.menu-button:hover {
    opacity: 0.9;
}

.menu-content {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    box-shadow: 0 4px 12px oklcha(0, 0%, 0%, 0.15);
    min-width: 250px;
    max-width: 350px;
    padding: 1rem;
    z-index: 1000;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.menu-item label {
    min-width: 100px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-base);
}

.menu-item .filter-select {
    flex: 1;
}

.menu-toggle {
    justify-content: space-between;
}

.menu-section-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-dimmed);
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
}

.menu-divider {
    height: 1px;
    background: var(--color-border);
    margin: 0.75rem 0;
}

.menu-action-button {
    width: 100%;
    padding: 0.5rem 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.menu-action-button:hover {
    opacity: 0.9;
}

.toggle-button {
    padding: 0.25rem 0.75rem;
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 50px;
}

.toggle-button.active {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary-base);
}

.filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-size: 0.875rem;
    cursor: pointer;
}

/* Main content area */
.main-content {
    padding: 2rem;
    min-height: calc(100vh - 200px);
}

.loading-state,
.empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-muted-contrast);
}

/* Two-column tile layout */
.image-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30rem, 1fr));
    gap: 0.5rem;
}

.image-row {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    height: 72px;
    border-radius: var(--radius-medium);
    cursor: pointer;
    transition: background var(--duration) var(--ease);
}

.image-row:hover {
    background: var(--color-muted-bg);
}

.image-row.selected {
    background: oklcha(var(--color-primary-base), 0.1);
    border: 2px solid var(--color-primary-base);
}

.image-avatar {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    border-radius: var(--radius-small);
    overflow: hidden;
    background: var(--color-muted-bg);
}

.image-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    font-size: 0.75rem;
}

.field-row {
    display: flex;
    gap: 0.5rem;
}

.field-label {
    font-weight: 600;
    color: var(--color-muted-contrast);
    min-width: 60px;
}

.field-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Aside content (image details) */
.aside-content {
    overflow-y: auto;
    max-height: calc(100vh - 200px);
}

.no-selection {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-muted-contrast);
    font-size: 1.125rem;
}

.image-details {
    display: flex;
    flex-direction: column;
}

.save-section {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 2px solid var(--color-border);
}

.shape-editor-section {
    margin: 1rem 0;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
}

.btn-delete {
    padding: 0.75rem 2rem;
    background: var(--color-error-bg, #fee);
    color: var(--color-error-contrast, #c00);
    border: 2px solid var(--color-error-base, #c00);
    border-radius: var(--radius-medium);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-delete:hover {
    background: var(--color-error-base, #c00);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px oklcha(0, 0%, 0%, 0.15);
}

.btn-save {
    padding: 0.75rem 2rem;
    background: var(--color-muted-bg);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-medium);
    font-size: 1rem;
    font-weight: 600;
    cursor: not-allowed;
    transition: all var(--duration) var(--ease);
    opacity: 0.5;
}

.btn-save.dirty {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary-base);
    cursor: pointer;
    opacity: 1;
}

.btn-save.dirty:hover {
    background: var(--color-primary-hover, var(--color-primary-base));
    transform: translateY(-1px);
    box-shadow: 0 4px 8px oklcha(0, 0%, 0%, 0.15);
}

.btn-save:disabled {
    cursor: not-allowed;
}

.editable-fields {
    display: flex;
    flex-direction: column;
}

.edit-row {
    display: flex;
    align-items: center;
    margin: 0rem;
    gap: 0.2rem;
}

.edit-row>label {
    min-width: 120px;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-muted-contrast);
    flex-shrink: 0;
}

.edit-row .filter-select {
    flex: 1;
    min-width: 0;
}

.edit-row-with-hint {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.edit-row-with-hint>label {
    min-width: 120px;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-muted-contrast);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-shrink: 0;
}

.label-hint {
    font-size: 0.7rem;
    font-weight: normal;
    color: var(--color-muted-contrast);
    font-style: italic;
}

.edit-row-with-hint .filter-select {
    flex: 1;
    min-width: 0;
}

.edit-input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-size: 0.875rem;
    transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.edit-input:focus {
    outline: none;
    border-color: var(--color-primary-base);
    background: var(--color-card-bg-hover, var(--color-card-bg));
}

.edit-textarea {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-size: 0.875rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color var(--duration) var(--ease), background var(--duration) var(--ease);
}

.edit-textarea:focus {
    outline: none;
    border-color: var(--color-primary-base);
}

.url-textarea {
    background: white;
    font-size: 0.7rem;
}

.url-textarea:focus {
    background: white;
}

.edit-section {
    padding-top: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.edit-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
}

.tabs-container {
    display: flex;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    overflow: hidden;
}

.tab-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background: var(--color-muted-bg);
    border: none;
    border-right: 1px solid var(--color-border);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-muted-contrast);
    opacity: 0.6;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.tab-button:last-child {
    border-right: none;
}

.tab-button:hover {
    opacity: 0.8;
}

.tab-button.active {
    background: var(--color-primary-base);
    color: var(--color-text-bright);
    opacity: 1;
    font-weight: 600;
}

.form-divider {
    border: none;
    border-top: 4px solid var(--color-white);
    margin: 2rem 0;
}

.author-section {
    background: var(--color-grey-base);
}

.author-tabs .author-tab.active {
    background: var(--color-neutral-base);
    color: var(--color-contrast);
}

.tab-content {
    margin-top: 1.5rem;
}

/* Shape tabs - inactive tabs with neutral background */
.edit-section:has(.tabs-container:not(.author-tabs)) .tab-button:not(.active) {
    background: var(--color-neutral-base);
}

.params-group {
    display: flex;
    gap: 1rem;
    flex: 1;
}

.param-field {
    display: flex;
    align-items: center;
    flex: 1;
}

.param-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-muted-contrast);
    min-width: 20px;
}

.param-field .edit-input {
    flex: 1;
}
</style>
