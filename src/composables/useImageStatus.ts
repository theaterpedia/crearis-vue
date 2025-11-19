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

import { computed, type Ref, unref } from 'vue'
import {
    parseByteaHex,
    byteaFromNumber,
    hasBit,
    setBit,
    clearBit,
    toggleBit
} from './useSysregTags'

export interface Image {
    id: number
    status_val: string | null  // BYTEA hex string
    config_val: string | null  // BYTEA hex string
    [key: string]: any
}

export interface StatusTransition {
    from: number[]
    to: number
    label: string
    confirmMessage?: string
    configChanges?: { bit: number; set: boolean }[]
}

export function useImageStatus(image: Ref<Image | null>) {
    // Parse current values
    const currentStatus = computed(() => {
        if (!image.value?.status_val) return 0
        return parseByteaHex(image.value.status_val)
    })

    const currentConfig = computed(() => {
        if (!image.value?.config_val) return 0
        return parseByteaHex(image.value.config_val)
    })

    // Status checks
    const isRaw = computed(() => currentStatus.value === 0x00)
    const isProcessing = computed(() => currentStatus.value === 0x01)
    const isApproved = computed(() => currentStatus.value === 0x02)
    const isPublished = computed(() => currentStatus.value === 0x04)
    const isDeprecated = computed(() => currentStatus.value === 0x08)
    const isArchived = computed(() => currentStatus.value === 0x10)

    // Config bit checks
    const isPublic = computed(() => hasBit(image.value?.config_val || '\\x00', 0))
    const isFeatured = computed(() => hasBit(image.value?.config_val || '\\x00', 1))
    const needsReview = computed(() => hasBit(image.value?.config_val || '\\x00', 2))
    const hasPeople = computed(() => hasBit(image.value?.config_val || '\\x00', 3))
    const isAiGenerated = computed(() => hasBit(image.value?.config_val || '\\x00', 4))
    const hasHighRes = computed(() => hasBit(image.value?.config_val || '\\x00', 5))

    // Status transition validations
    const canStartProcessing = computed(() => {
        return currentStatus.value === 0x00 // Only from raw
    })

    const canApprove = computed(() => {
        return currentStatus.value === 0x00 || currentStatus.value === 0x01 // From raw or processing
    })

    const canPublish = computed(() => {
        return currentStatus.value === 0x02 // Only approved images
    })

    const canDeprecate = computed(() => {
        return currentStatus.value !== 0x08 && currentStatus.value !== 0x10 // Not already deprecated/archived
    })

    const canArchive = computed(() => {
        return currentStatus.value === 0x08 // Only deprecated images
    })

    const canUnarchive = computed(() => {
        return currentStatus.value === 0x10 // Only archived images
    })

    // Status transition functions
    async function startProcessing() {
        if (!canStartProcessing.value) {
            throw new Error('Cannot start processing: invalid current status')
        }

        return updateImageStatus({
            status_val: byteaFromNumber(0x01),
            config_val: setBit(image.value!.config_val || '\\x00', 2) // Set needs_review
        })
    }

    async function approveImage() {
        if (!canApprove.value) {
            throw new Error('Cannot approve: invalid current status')
        }

        return updateImageStatus({
            status_val: byteaFromNumber(0x02),
            config_val: clearBit(image.value!.config_val || '\\x00', 2) // Clear needs_review
        })
    }

    async function publishImage() {
        if (!canPublish.value) {
            throw new Error('Cannot publish: image must be approved first')
        }

        return updateImageStatus({
            status_val: byteaFromNumber(0x04)
        })
    }

    async function deprecateImage(reason?: string) {
        if (!canDeprecate.value) {
            throw new Error('Cannot deprecate: invalid current status')
        }

        const confirmed = confirm(
            reason
                ? `Bild als veraltet markieren?\n\nGrund: ${reason}\n\nDas Bild wird nicht gelöscht, aber aus dem öffentlichen Bereich entfernt.`
                : 'Bild als veraltet markieren? Es wird nicht gelöscht, aber aus dem öffentlichen Bereich entfernt.'
        )

        if (!confirmed) return null

        return updateImageStatus({
            status_val: byteaFromNumber(0x08),
            config_val: clearBit(image.value!.config_val || '\\x00', 0) // Clear public
        })
    }

    async function archiveImage() {
        if (!canArchive.value) {
            throw new Error('Cannot archive: image must be deprecated first')
        }

        const confirmed = confirm(
            'Bild archivieren? Es wird aus allen aktiven Listen entfernt.'
        )

        if (!confirmed) return null

        return updateImageStatus({
            status_val: byteaFromNumber(0x10),
            config_val: clearBit(clearBit(image.value!.config_val || '\\x00', 0), 1) // Clear public and featured
        })
    }

    async function unarchiveImage() {
        if (!canUnarchive.value) {
            throw new Error('Cannot unarchive: invalid current status')
        }

        return updateImageStatus({
            status_val: byteaFromNumber(0x02) // Back to approved
        })
    }

    // Config bit management
    function hasConfigBit(bit: number): boolean {
        if (!image.value?.config_val) return false
        return hasBit(image.value.config_val, bit)
    }

    async function setConfigBit(bit: number, value: boolean) {
        if (!image.value) return null

        const newConfig = value
            ? setBit(image.value.config_val || '\\x00', bit)
            : clearBit(image.value.config_val || '\\x00', bit)

        return updateImageStatus({
            config_val: newConfig
        })
    }

    async function toggleConfigBit(bit: number) {
        if (!image.value) return null

        return updateImageStatus({
            config_val: toggleBit(image.value.config_val || '\\x00', bit)
        })
    }

    async function togglePublic() {
        return toggleConfigBit(0)
    }

    async function toggleFeatured() {
        return toggleConfigBit(1)
    }

    async function toggleNeedsReview() {
        return toggleConfigBit(2)
    }

    async function toggleHasPeople() {
        return toggleConfigBit(3)
    }

    async function toggleAiGenerated() {
        return toggleConfigBit(4)
    }

    async function toggleHighRes() {
        return toggleConfigBit(5)
    }

    // Update helper
    async function updateImageStatus(updates: Partial<Image>) {
        if (!image.value) return null

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

            return updated
        } catch (error) {
            console.error('Error updating image status:', error)
            throw error
        }
    }

    // Status label helpers
    const statusLabel = computed(() => {
        switch (currentStatus.value) {
            case 0x00: return 'Raw'
            case 0x01: return 'Processing'
            case 0x02: return 'Approved'
            case 0x04: return 'Published'
            case 0x08: return 'Deprecated'
            case 0x10: return 'Archived'
            default: return 'Unknown'
        }
    })

    const statusColor = computed(() => {
        switch (currentStatus.value) {
            case 0x00: return 'gray'
            case 0x01: return 'blue'
            case 0x02: return 'green'
            case 0x04: return 'emerald'
            case 0x08: return 'orange'
            case 0x10: return 'red'
            default: return 'gray'
        }
    })

    // Config summary
    const configFlags = computed(() => ({
        public: isPublic.value,
        featured: isFeatured.value,
        needsReview: needsReview.value,
        hasPeople: hasPeople.value,
        aiGenerated: isAiGenerated.value,
        highRes: hasHighRes.value
    }))

    return {
        // Current state
        currentStatus,
        currentConfig,
        statusLabel,
        statusColor,
        configFlags,

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

        // Status transitions
        startProcessing,
        approveImage,
        publishImage,
        deprecateImage,
        archiveImage,
        unarchiveImage,

        // Config management
        hasConfigBit,
        setConfigBit,
        toggleConfigBit,
        togglePublic,
        toggleFeatured,
        toggleNeedsReview,
        toggleHasPeople,
        toggleAiGenerated,
        toggleHighRes,

        // Update helper
        updateImageStatus
    }
}
