import { defineEventHandler, readBody, createError } from 'h3'
import { adapterRegistry } from '../../adapters/registry'
import type { ImageImportBatch, ImageImportResult } from '../../types/adapters'

interface ImportRequestBody {
    urls: string[]
    batch?: ImageImportBatch
}

/**
 * POST /api/images/import - Import images by URLs
 * 
 * Accepts one or multiple URLs and imports them using appropriate adapters.
 * Batch metadata is applied to all imported images.
 * 
 * Request body:
 * {
 *   urls: string[],  // One or more image URLs
 *   batch?: {
 *     domaincode?: string,  // Project domain code
 *     owner_id?: number,    // User ID
 *     alt_text?: string,
 *     license?: string,
 *     xml_subject?: string, // Subject type for xmlid construction
 *     ctags?: Buffer,
 *     rtags?: Buffer
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<ImportRequestBody>(event)

        // Validate body exists
        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Validate input
        if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'Missing or invalid urls array'
            })
        }

        const urls: string[] = body.urls
        const batchData: ImageImportBatch = body.batch || {}

        // Process each URL sequentially
        const results: ImageImportResult[] = []

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i]

            try {
                // Detect adapter for this URL
                const adapter = adapterRegistry.detectAdapter(url)

                if (!adapter) {
                    results.push({
                        success: false,
                        url,
                        adapter: 'external',
                        error: 'No adapter found for this URL. Supported: Unsplash'
                    })
                    continue
                }

                // Prepare batch data with xmlid constructed from domaincode, xml_subject, and image ID
                const batchWithContext: ImageImportBatch & { imageIdentifier?: string } = { ...batchData }
                
                // Extract image-specific identifier from URL for xmlid construction
                let imageIdentifier = ''
                if (adapter.type === 'unsplash') {
                    // Extract Unsplash photo ID from URL
                    const unsplashMatch = url.match(/photo-([a-zA-Z0-9_-]+)/) || url.match(/photos\/([^/?]+)/)
                    imageIdentifier = unsplashMatch ? unsplashMatch[1] : `img_${i}`
                } else if (adapter.type === 'cloudinary') {
                    // Extract filename without extension from Cloudinary URL
                    const cloudinaryMatch = url.match(/\/v\d+\/(.+?)(?:\?|$)/)
                    if (cloudinaryMatch) {
                        const fullPath = cloudinaryMatch[1]
                        const filename = fullPath.split('/').pop() || ''
                        imageIdentifier = filename.replace(/\.[^.]+$/, '') // Remove file extension
                    } else {
                        imageIdentifier = `img_${i}`
                    }
                } else {
                    imageIdentifier = `img_${i}`
                }
                
                // Store image identifier and xml_subject for xmlid construction in adapter
                batchWithContext.imageIdentifier = imageIdentifier
                batchWithContext.xml_subject = batchData.xml_subject || 'mixed'

                // Import using detected adapter
                console.log(`Importing image ${i + 1}/${urls.length} via ${adapter.type} adapter...`)
                const result = await adapter.importImage(url, batchWithContext)

                results.push(result)

                if (result.success) {
                    console.log(`✓ Image ${i + 1} imported successfully (ID: ${result.image_id})`)
                } else {
                    console.error(`✗ Image ${i + 1} failed: ${result.error}`)
                }

            } catch (error) {
                console.error(`Error processing URL ${url}:`, error)
                results.push({
                    success: false,
                    url,
                    adapter: 'external',
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        // Compile summary
        const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length

        return {
            success: failed === 0,
            total: urls.length,
            successful,
            failed,
            results
        }

    } catch (error) {
        console.error('Error in images import endpoint:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to import images'
        })
    }
})
