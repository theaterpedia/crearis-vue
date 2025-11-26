/**
 * Composable: useImageStatus
 * 
 * Manages image status lifecycle and quality flags using sysreg system.
 * Provides status transition logic, config bit management, and validation.
 * 
 * Status values (status_val BYTEA):
 * - 0x00 (0): raw - Just imported, needs processing
 * - 0x01 (1): processing - Being processed/cropped
 * - 0x02 (2): approved - Ready for use
 * - 0x04 (4): published - Actively used in projects
 * - 0x08 (8): deprecated - Old/outdated, not recommended
 * - 0x10 (16): archived - Removed from active use
 * 
 * Config bits (config_val BYTEA):
 * - bit 0: public - Visible to public
 * - bit 1: featured - Highlighted in galleries
 * - bit 2: needs_review - Requires manual review
 * - bit 3: has_people - Contains identifiable people
 * - bit 4: ai_generated - Created by AI
 * - bit 5: high_res - High resolution available
 */

import { ref, computed, type Ref } from 'vue'
import {
    parseByteaHex,
    byteaFromNumber,
    hasBit,
    setBit,
    clearBit,
    toggleBit
} from './useSysregTags'
import { useSysregOptions } from './useSysregOptions'

export interface Image {
    id: number
    status: string | null  // BYTEA hex string
    ctags: string | null  // BYTEA hex string (config bits)
    [key: string]: any
}

type EmitFunction = (event: string, ...args: any[]) => void

type ConfigBitName = 'public' | 'featured' | 'needs_review' | 'has_people' | 'ai_generated' | 'high_res'

const CONFIG_BIT_MAP: Record<ConfigBitName, number> = {
    public: 0,
    featured: 1,
    needs_review: 2,
    has_people: 3,
    ai_generated: 4,
    high_res: 5
}

export function useImageStatus(image: Ref<Image | null>, emit?: EmitFunction) {
    const { getOptionByValue } = useSysregOptions()

    // Reactive state
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Parse current values - return BYTEA hex strings, not numbers
    const currentStatus = computed(() => {
        return image.value?.status || '\\x00'
    })

    const currentConfig = computed(() => {
        return image.value?.ctags || '\\x00'
    })

    // Helper to get status byte value for comparisons
    const statusByteValue = computed(() => {
        const bytes = parseByteaHex(currentStatus.value)
        return bytes[0] || 0
    })

    // Get bit arrays for computed properties
    const statusBits = computed(() => parseByteaHex(currentStatus.value))
    const configBits = computed(() => parseByteaHex(currentConfig.value))

    // Status checks
    const isRaw = computed(() => statusByteValue.value === 0x00)
    const isProcessing = computed(() => statusByteValue.value === 0x01)
    const isApproved = computed(() => statusByteValue.value === 0x02)
    const isPublished = computed(() => statusByteValue.value === 0x04)
    const isDeprecated = computed(() => statusByteValue.value === 0x08)
    const isArchived = computed(() => statusByteValue.value === 0x10)

    // Config bit checks
    const isPublic = computed(() => hasBit(currentConfig.value, 0))
    const isFeatured = computed(() => hasBit(currentConfig.value, 1))
    const needsReview = computed(() => hasBit(currentConfig.value, 2))
    const hasPeople = computed(() => hasBit(currentConfig.value, 3))
    const isAiGenerated = computed(() => hasBit(currentConfig.value, 4))
    const hasHighRes = computed(() => hasBit(currentConfig.value, 5))

    // Status label from sysreg options with fallback
    const statusLabel = computed(() => {
        const opt = getOptionByValue('status', currentStatus.value)
        if (opt?.label) return opt.label

        // Fallback if sysreg options not loaded
        const byte = statusByteValue.value
        if (byte === 0x00) return 'Raw'
        if (byte === 0x01) return 'Processing'
        if (byte === 0x02) return 'Approved'
        if (byte === 0x04) return 'Published'
        if (byte === 0x08) return 'Deprecated'
        if (byte === 0x10) return 'Archived'
        return 'Unknown'
    })

    // Status transition validations
    const canStartProcessing = computed(() => {
        return statusByteValue.value === 0x00 // Only from raw
    })

    const canApprove = computed(() => {
        return statusByteValue.value === 0x00 || statusByteValue.value === 0x01 // From raw or processing
    })

    const canPublish = computed(() => {
        return statusByteValue.value === 0x02 // Only approved images
    })

    const canDeprecate = computed(() => {
        return statusByteValue.value === 0x04 // Only published images
    })

    const canArchive = computed(() => {
        return true // Any status can be archived
    })

    const canUnarchive = computed(() => {
        return statusByteValue.value === 0x10 // Only archived images
    })

    // Valid transitions based on current status
    const validTransitions = computed(() => {
        const transitions: string[] = []
        const byte = statusByteValue.value

        if (byte === 0x00) { // raw
            transitions.push('processing', 'approved', 'archived')
        } else if (byte === 0x01) { // processing
            transitions.push('raw', 'approved', 'archived')
        } else if (byte === 0x02) { // approved
            transitions.push('published', 'archived')
        } else if (byte === 0x04) { // published
            transitions.push('deprecated', 'archived')
        } else if (byte === 0x08) { // deprecated
            transitions.push('archived')
        } else if (byte === 0x10) { // archived
            transitions.push('approved')
        }

        return transitions
    })

    // Workflow tracking
    const workflowOrder = computed(() => {
        return ['raw', 'processing', 'approved', 'published']
    })

    const currentWorkflowStep = computed(() => {
        const byte = statusByteValue.value
        if (byte === 0x00) return 0 // raw
        if (byte === 0x01) return 1 // processing
        if (byte === 0x02) return 2 // approved
        if (byte === 0x04) return 3 // published
        return -1 // deprecated/archived are outside workflow
    })

    // Config bits as object
    const configBitsObj = computed(() => ({
        public: isPublic.value,
        featured: isFeatured.value,
        needs_review: needsReview.value,
        has_people: hasPeople.value,
        ai_generated: isAiGenerated.value,
        high_res: hasHighRes.value
    }))

    // Status transition functions
    async function startProcessing() {
        if (!canStartProcessing.value) {
            error.value = 'Cannot start processing: invalid current status'
            return null
        }

        return updateImageStatus({
            status: byteaFromNumber(0x01),
            ctags: setBit(currentConfig.value, 2) // Set needs_review
        })
    }

    async function approveImage() {
        if (!canApprove.value) {
            error.value = 'Cannot approve: invalid current status'
            return null
        }

        return updateImageStatus({
            status: byteaFromNumber(0x02),
            ctags: clearBit(currentConfig.value, 2) // Clear needs_review
        })
    }

    async function publishImage() {
        if (!canPublish.value) {
            error.value = 'Cannot publish: image must be approved first'
            return null
        }

        return updateImageStatus({
            status: byteaFromNumber(0x04),
            ctags: setBit(currentConfig.value, 0) // Auto-set public
        })
    }

    async function deprecateImage() {
        if (!canDeprecate.value) {
            error.value = 'Cannot deprecate: invalid current status'
            return null
        }

        return updateImageStatus({
            status: byteaFromNumber(0x08),
            ctags: clearBit(currentConfig.value, 1) // Clear featured
        })
    }

    async function archiveImage() {
        return updateImageStatus({
            status: byteaFromNumber(0x10),
            ctags: clearBit(clearBit(currentConfig.value, 0), 1) // Clear public and featured
        })
    }

    async function unarchiveImage() {
        if (!canUnarchive.value) {
            error.value = 'Cannot unarchive: invalid current status'
            return null
        }

        return updateImageStatus({
            status: byteaFromNumber(0x02) // Back to approved
        })
    }

    async function resetToRaw() {
        return updateImageStatus({
            status: byteaFromNumber(0x00)
        })
    }

    // Config bit management
    function hasConfigBit(bit: number): boolean {
        if (!image.value?.ctags) return false
        return hasBit(image.value.ctags, bit)
    }

    async function setConfigBit(bit: number, value: boolean) {
        if (!image.value) return null

        const newConfig = value
            ? setBit(currentConfig.value, bit)
            : clearBit(currentConfig.value, bit)

        return updateImageStatus({
            ctags: newConfig
        })
    }

    async function toggleConfigBit(bitOrName: number | ConfigBitName) {
        if (!image.value) return null

        const bit = typeof bitOrName === 'number' ? bitOrName : CONFIG_BIT_MAP[bitOrName]

        return updateImageStatus({
            ctags: toggleBit(currentConfig.value, bit)
        })
    }

    // Field-specific bit helpers (for direct image field manipulation)
    function hasBitInField(field: 'status' | 'ctags', bit: number): boolean {
        if (!image.value?.[field]) return false
        return hasBit(image.value[field], bit)
    }

    function setBitInField(field: 'status' | 'ctags', bit: number) {
        if (!image.value) return
        image.value[field] = setBit(image.value[field], bit)
    }

    function clearBitInField(field: 'status' | 'ctags', bit: number) {
        if (!image.value) return
        image.value[field] = clearBit(image.value[field], bit)
    }

    function toggleBitInField(field: 'status' | 'ctags', bit: number) {
        if (!image.value) return
        image.value[field] = toggleBit(image.value[field], bit)
    }

    // Update helper
    async function updateImageStatus(updates: Partial<Image>) {
        if (!image.value) return null

        loading.value = true
        error.value = null

        try {
            const response = await fetch(`/api/images/${image.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                throw new Error(`Failed to update image: ${response.statusText}`)
            }

            const updated = await response.json()

            // Update local ref
            if (image.value) {
                Object.assign(image.value, updated)
            }

            // Emit update event if provided
            if (emit) {
                emit('update:image', updated)
            }

            return updated
        } catch (err: any) {
            error.value = err.message
            console.error('Error updating image status:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        // Reactive state
        loading,
        error,

        // Current state
        currentStatus,
        currentConfig,
        statusLabel,
        statusBits,
        configBits: configBitsObj,

        // Status checks
        isRaw,
        isProcessing,
        isApproved,
        isPublished,
        isDeprecated,
        isArchived,

        // Config checks
        isPublic,
        isFeatured,
        needsReview,
        hasPeople,
        isAiGenerated,
        hasHighRes,

        // Transition capabilities
        canStartProcessing,
        canApprove,
        canPublish,
        canDeprecate,
        canArchive,
        canUnarchive,

        // Workflow tracking
        validTransitions,
        workflowOrder,
        currentWorkflowStep,

        // Status transitions
        startProcessing,
        approveImage,
        publishImage,
        deprecateImage,
        archiveImage,
        unarchiveImage,
        resetToRaw,

        // Config management
        hasConfigBit,
        setConfigBit,
        toggleConfigBit,

        // Field-specific bit operations
        hasBitInField,
        setBitInField,
        clearBitInField,
        toggleBitInField
    }
}
