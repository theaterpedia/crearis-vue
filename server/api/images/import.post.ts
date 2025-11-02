import { defineEventHandler, readBody, createError } from 'h3'
import { adapterRegistry } from '../../adapters/registry'
import type { ImageImportBatch, ImageImportResult } from '../../types/adapters'

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
 *     xml_root?: string,    // Base for xmlid, will append .00, .01, .02...
 *     ctags?: Buffer,
 *     rtags?: Buffer
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

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

                // Prepare batch data with sequence number for xmlid
                const batchWithSequence = { ...batchData }
                if (batchData.xml_root) {
                    const sequence = String(i).padStart(2, '0')
                    batchWithSequence.xml_root = `${batchData.xml_root}.${sequence}`
                }

                // Import using detected adapter
                console.log(`Importing image ${i + 1}/${urls.length} via ${adapter.type} adapter...`)
                const result = await adapter.importImage(url, batchWithSequence)

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
