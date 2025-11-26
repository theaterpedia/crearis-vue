/**
 * Unit Tests: useImageStatus
 * 
 * Tests image lifecycle management composable.
 * Total: 35 tests covering status transitions, config bits, and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useImageStatus } from '@/composables/useImageStatus'
import {
    createTestImage,
    createImageWithStatus
} from '../helpers/sysreg-test-data'
import {
    expectBitSet,
    expectBitClear,
    expectEmpty
} from '../helpers/sysreg-bytea-helpers'
import {
    mockFetchMutation,
    mockFetchError
} from '../helpers/sysreg-mock-api'

describe('useImageStatus - Image Lifecycle Management', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // Status Initialization - 4 tests
    // ============================================================================

    describe('Status initialization', () => {
        it('loads current status from image data', () => {
            const image = createTestImage({ status: '\\x02' })
            const { currentStatus } = useImageStatus(ref(image))

            expect(currentStatus.value).toBe('\\x02')
        })

        it('defaults to raw (\\x00) for new images', () => {
            const { currentStatus } = useImageStatus(ref(null))

            expect(currentStatus.value).toBe('\\x00')
        })

        it('loads status label correctly', () => {
            const image = createTestImage({ status: '\\x02' })
            const { statusLabel } = useImageStatus(ref(image))

            expect(statusLabel.value).toBe('Approved')
        })

        it('tracks if image is published', () => {
            const publishedImage = createImageWithStatus('published')
            const { isPublished } = useImageStatus(ref(publishedImage))

            expect(isPublished.value).toBe(true)
        })
    })

    // ============================================================================
    // Status Transitions - 12 tests
    // ============================================================================

    describe('Status transitions', () => {
        it('transitions raw → processing', async () => {
            const image = createImageWithStatus('raw')
            global.fetch = mockFetchMutation({ ...image, status: '\\x01' })

            const { startProcessing, currentStatus } = useImageStatus(ref(image))
            await startProcessing()

            expect(currentStatus.value).toBe('\\x01')
        })

        it('transitions processing → approved', async () => {
            const image = createImageWithStatus('processing')
            global.fetch = mockFetchMutation({ ...image, status: '\\x02' })

            const { approveImage, currentStatus } = useImageStatus(ref(image))
            await approveImage()

            expect(currentStatus.value).toBe('\\x02')
        })

        it('transitions approved → published', async () => {
            const image = createImageWithStatus('approved')
            global.fetch = mockFetchMutation({ ...image, status: '\\x04' })

            const { publishImage, currentStatus } = useImageStatus(ref(image))
            await publishImage()

            expect(currentStatus.value).toBe('\\x04')
        })

        it('transitions published → deprecated', async () => {
            const image = createImageWithStatus('published')
            global.fetch = mockFetchMutation({ ...image, status: '\\x08' })

            const { deprecateImage, currentStatus } = useImageStatus(ref(image))
            await deprecateImage()

            expect(currentStatus.value).toBe('\\x08')
        })

        it('transitions any → archived', async () => {
            const image = createImageWithStatus('approved')
            global.fetch = mockFetchMutation({ ...image, status: '\\x10' })

            const { archiveImage, currentStatus } = useImageStatus(ref(image))
            await archiveImage()

            expect(currentStatus.value).toBe('\\x10')
        })

        it('prevents invalid transition: raw → published', async () => {
            const image = createImageWithStatus('raw')

            const { publishImage, error } = useImageStatus(ref(image))
            await publishImage()

            expect(error.value).toBeTruthy()
            expect(error.value).toContain('Cannot publish')
        })

        it('prevents invalid transition: raw → deprecated', async () => {
            const image = createImageWithStatus('raw')

            const { deprecateImage, error } = useImageStatus(ref(image))
            await deprecateImage()

            expect(error.value).toBeTruthy()
        })

        it('allows processing → raw (reset)', async () => {
            const image = createImageWithStatus('processing')
            global.fetch = mockFetchMutation({ ...image, status: '\\x00' })

            const { resetToRaw, currentStatus } = useImageStatus(ref(image))
            await resetToRaw()

            expect(currentStatus.value).toBe('\\x00')
        })

        it('provides valid next transitions', () => {
            const image = createImageWithStatus('approved')
            const { validTransitions } = useImageStatus(ref(image))

            expect(validTransitions.value).toContain('published')
            expect(validTransitions.value).toContain('archived')
            expect(validTransitions.value).not.toContain('raw')
        })

        it('sets loading state during transition', async () => {
            const image = createImageWithStatus('raw')
            global.fetch = mockFetchMutation({ ...image, status: '\\x01' })

            const { startProcessing, loading } = useImageStatus(ref(image))

            const promise = startProcessing()
            expect(loading.value).toBe(true)

            await promise
            expect(loading.value).toBe(false)
        })

        it('handles transition errors gracefully', async () => {
            const image = createImageWithStatus('raw')
            global.fetch = mockFetchError('Network error')

            const { startProcessing, error } = useImageStatus(ref(image))
            await startProcessing()

            expect(error.value).toBeTruthy()
            expect(error.value).toContain('Network error')
        })

        it('emits update event on successful transition', async () => {
            const image = createImageWithStatus('raw')
            const updatedImage = { ...image, status: '\\x01' }
            global.fetch = mockFetchMutation(updatedImage)

            const emitSpy = vi.fn()
            const { startProcessing } = useImageStatus(ref(image), emitSpy)

            await startProcessing()

            expect(emitSpy).toHaveBeenCalledWith('update:image', expect.objectContaining({
                status: '\\x01'
            }))
        })
    })

    // ============================================================================
    // Config Bit Management - 10 tests
    // ============================================================================

    describe('Config bit management', () => {
        it('reads public bit correctly', () => {
            const image = createTestImage({ ctags: '\\x01' })
            const { configBits } = useImageStatus(ref(image))

            expectBitSet(configBits.value.public ? '\\x01' : '\\x00', 0)
        })

        it('sets public bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x01' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('public')

            expect(configBits.value.public).toBe(true)
        })

        it('clears public bit', async () => {
            const image = createTestImage({ ctags: '\\x01' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x00' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('public')

            expect(configBits.value.public).toBe(false)
        })

        it('sets featured bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x02' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('featured')

            expect(configBits.value.featured).toBe(true)
        })

        it('auto-sets public bit when publishing', async () => {
            const image = createImageWithStatus('approved')
            image.ctags = '\\x00'
            global.fetch = mockFetchMutation({ ...image, status: '\\x04', ctags: '\\x01' })

            const { publishImage, configBits } = useImageStatus(ref(image))
            await publishImage()

            expect(configBits.value.public).toBe(true)
        })

        it('clears featured bit when deprecated', async () => {
            const image = createImageWithStatus('published')
            image.ctags = '\\x03' // public + featured
            global.fetch = mockFetchMutation({ ...image, status: '\\x08', ctags: '\\x01' })

            const { deprecateImage, configBits } = useImageStatus(ref(image))
            await deprecateImage()

            expect(configBits.value.featured).toBe(false)
            expect(configBits.value.public).toBe(true) // Keeps public
        })

        it('manages needs_review bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x04' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('needs_review')

            expect(configBits.value.needs_review).toBe(true)
        })

        it('manages has_people bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x08' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('has_people')

            expect(configBits.value.has_people).toBe(true)
        })

        it('manages ai_generated bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x10' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('ai_generated')

            expect(configBits.value.ai_generated).toBe(true)
        })

        it('manages high_res bit', async () => {
            const image = createTestImage({ ctags: '\\x00' })
            global.fetch = mockFetchMutation({ ...image, ctags: '\\x20' })

            const { toggleConfigBit, configBits } = useImageStatus(ref(image))
            await toggleConfigBit('high_res')

            expect(configBits.value.high_res).toBe(true)
        })
    })

    // ============================================================================
    // Validation Rules - 6 tests
    // ============================================================================

    describe('Validation rules', () => {
        it('validates that only approved images can be published', () => {
            const rawImage = createImageWithStatus('raw')
            const { canPublish } = useImageStatus(ref(rawImage))

            expect(canPublish.value).toBe(false)
        })

        it('allows approved images to be published', () => {
            const approvedImage = createImageWithStatus('approved')
            const { canPublish } = useImageStatus(ref(approvedImage))

            expect(canPublish.value).toBe(true)
        })

        it('validates that only published images can be deprecated', () => {
            const approvedImage = createImageWithStatus('approved')
            const { canDeprecate } = useImageStatus(ref(approvedImage))

            expect(canDeprecate.value).toBe(false)
        })

        it('allows published images to be deprecated', () => {
            const publishedImage = createImageWithStatus('published')
            const { canDeprecate } = useImageStatus(ref(publishedImage))

            expect(canDeprecate.value).toBe(true)
        })

        it('validates workflow order', () => {
            const image = createImageWithStatus('raw')
            const { workflowOrder } = useImageStatus(ref(image))

            expect(workflowOrder.value).toEqual([
                'raw',
                'processing',
                'approved',
                'published'
            ])
        })

        it('shows current position in workflow', () => {
            const image = createImageWithStatus('approved')
            const { currentWorkflowStep } = useImageStatus(ref(image))

            expect(currentWorkflowStep.value).toBe(2) // 0-indexed: raw=0, processing=1, approved=2
        })
    })

    // ============================================================================
    // API Integration - 3 tests
    // ============================================================================

    describe('API integration', () => {
        it('calls PATCH endpoint with correct data', async () => {
            const image = createImageWithStatus('raw')
            let capturedUrl = ''
            let capturedBody = ''

            global.fetch = vi.fn().mockImplementation((url, options) => {
                capturedUrl = url
                capturedBody = options?.body || ''
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ ...image, status: '\\x01' })
                })
            })

            const { startProcessing } = useImageStatus(ref(image))
            await startProcessing()

            expect(capturedUrl).toContain(`/api/images/${image.id}`)
            expect(capturedBody).toContain('status')
        })

        it('updates local state after successful API call', async () => {
            const image = createImageWithStatus('raw')
            const updatedImage = { ...image, status: '\\x01', updated_at: new Date().toISOString() }
            global.fetch = mockFetchMutation(updatedImage)

            const imageRef = ref(image)
            const { startProcessing } = useImageStatus(imageRef)

            await startProcessing()

            expect(imageRef.value.status).toBe('\\x01')
            expect(imageRef.value.updated_at).toBe(updatedImage.updated_at)
        })

        it('does not update state on API error', async () => {
            const image = createImageWithStatus('raw')
            const originalStatus = image.status
            global.fetch = mockFetchError('Server error')

            const imageRef = ref(image)
            const { startProcessing } = useImageStatus(imageRef)

            await startProcessing()

            expect(imageRef.value.status).toBe(originalStatus)
        })
    })
})
