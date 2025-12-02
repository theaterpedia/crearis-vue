/**
 * Base Media Adapter
 * 
 * Abstract base class that all media adapters extend.
 * Provides common functionality for importing images from external services.
 */

import type {
    IMediaAdapter,
    AdapterType,
    MediaMetadata,
    ImageImportBatch,
    ImageImportResult
} from '../types/adapters'
import { db } from '../database/init'

export abstract class BaseMediaAdapter implements IMediaAdapter {
    abstract readonly type: AdapterType

    /**
     * Check if this adapter can handle the given URL
     */
    abstract canHandle(url: string): boolean

    /**
     * Fetch metadata from the external service
     * @param url Image URL
     * @param batchData Optional batch import data (for Cloudinary owner_name, etc.)
     */
    abstract fetchMetadata(url: string, batchData?: ImageImportBatch): Promise<MediaMetadata>

    /**
     * Import image into database with metadata and batch data
     */
    async importImage(url: string, batchData?: ImageImportBatch): Promise<ImageImportResult> {
        try {
            // Fetch metadata from external service (pass batchData for Cloudinary)
            const metadata = await this.fetchMetadata(url, batchData)

            // Resolve project_id from domaincode if provided, or use direct project_id
            let project_id: number | null = (batchData as any)?.project_id || null
            if (!project_id && batchData?.domaincode) {
                const project = await db.get(
                    'SELECT id FROM projects WHERE domaincode = ?',
                    [batchData.domaincode]
                )
                if (project) {
                    project_id = (project as any).id
                } else {
                    console.warn(`Project with domaincode '${batchData.domaincode}' not found`)
                }
            }

            // Use provided xmlid or construct from parts
            let xmlid: string | null = (batchData as any)?.xmlid || null
            if (!xmlid && batchData?.domaincode && (batchData as any).imageIdentifier) {
                const xmlSubject = batchData.xml_subject || 'mixed'
                xmlid = `${batchData.domaincode}.image.${xmlSubject}-${(batchData as any).imageIdentifier}`
            }

            // Merge metadata with batch data
            // Note: ctags, rtags are INTEGER (32-bit) columns after Migration 036
            const imageData = {
                name: metadata.name || this.extractFilename(url),
                url: metadata.url,
                project_id,
                owner_id: batchData?.owner_id || null,
                alt_text: batchData?.alt_text || metadata.alt_text || null,
                title: metadata.title || null,
                x: metadata.x || null,
                y: metadata.y || null,
                fileformat: metadata.fileformat || 'none',
                license: batchData?.license || metadata.license || 'BY',
                xmlid,
                geo: metadata.geo ? JSON.stringify(metadata.geo) : null,
                date: metadata.date || null,
                about: metadata.about || null,
                ctags: batchData?.ctags ?? 0,  // INTEGER, not BYTEA
                rtags: batchData?.rtags ?? 0,  // INTEGER, not BYTEA
                // Author info as composite type (adapter, file_id, account_id, folder_id, info, config)
                author: metadata.author ? `(${metadata.author.adapter},"${metadata.author.file_id || ''}","${metadata.author.account_id || ''}","${metadata.author.folder_id || ''}","${metadata.author.info || ''}",${metadata.author.config ? `"${JSON.stringify(metadata.author.config).replace(/"/g, '\\"')}"` : 'null'})` : null
            }

            console.log(`[${this.type}] Image data prepared:`, {
                name: imageData.name,
                alt_text: imageData.alt_text,
                alt_text_source: batchData?.alt_text ? 'batch' : 'metadata',
                about: imageData.about,
                url: imageData.url.substring(0, 80) + '...'
            })

            // Insert image
            const result = await db.run(`
                INSERT INTO images (
                    name, url, project_id, owner_id, alt_text, title,
                    x, y, fileformat, license, xmlid, geo, date, about, ctags, rtags, author
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            `, [
                imageData.name,
                imageData.url,
                imageData.project_id,
                imageData.owner_id,
                imageData.alt_text,
                imageData.title,
                imageData.x,
                imageData.y,
                imageData.fileformat,
                imageData.license,
                imageData.xmlid,
                imageData.geo,
                imageData.date,
                imageData.about,
                imageData.ctags,
                imageData.rtags,
                imageData.author
            ])

            const imageId = result.rows?.[0]?.id

            // Generate BlurHash for all shape URLs before saving shape fields
            // Skip for local adapter (already generated from file buffers)
            const hasShapes = metadata.shape_square || metadata.shape_thumb || metadata.shape_wide || metadata.shape_vertical
            const isLocalAdapter = this.type === 'local'
            const needsBlurGeneration = hasShapes && !isLocalAdapter

            if (imageId && needsBlurGeneration) {
                try {
                    // Import BlurHash utility
                    const { generateBlurHash } = await import('../utils/blurhash')

                    console.log(`Generating BlurHash for image ${imageId}...`)

                    // Generate BlurHash for each shape (if URL exists and no blur already present)
                    // Using type assertion to add blur property
                    if (metadata.shape_square?.url && !(metadata.shape_square as any).blur) {
                        const blur = await generateBlurHash(metadata.shape_square.url, {
                            componentX: 4, componentY: 3, width: 32, height: 32
                        });
                        (metadata.shape_square as any).blur = blur
                    }

                    if (metadata.shape_thumb?.url && !(metadata.shape_thumb as any).blur) {
                        const blur = await generateBlurHash(metadata.shape_thumb.url, {
                            componentX: 4, componentY: 3, width: 32, height: 32
                        });
                        (metadata.shape_thumb as any).blur = blur
                    }

                    if (metadata.shape_wide?.url && !(metadata.shape_wide as any).blur) {
                        const blur = await generateBlurHash(metadata.shape_wide.url, {
                            componentX: 4, componentY: 3, width: 32, height: 32
                        });
                        (metadata.shape_wide as any).blur = blur
                    }

                    if (metadata.shape_vertical?.url && !(metadata.shape_vertical as any).blur) {
                        const blur = await generateBlurHash(metadata.shape_vertical.url, {
                            componentX: 4, componentY: 3, width: 32, height: 32
                        });
                        (metadata.shape_vertical as any).blur = blur
                    }

                    console.log(`✓ BlurHash generated for image ${imageId}`)
                } catch (blurError) {
                    // Log warning but don't fail import if BlurHash generation fails
                    console.warn(`⚠ Failed to generate BlurHash for image ${imageId}:`, blurError)
                }
            }

            // Update shape fields (always needed if shapes exist)
            if (imageId && hasShapes) {
                await this.updateShapeFields(imageId, metadata)
            }

            return {
                success: true,
                image_id: imageId,
                url: metadata.url,
                adapter: this.type
            }
        } catch (error) {
            console.error(`Error importing image from ${this.type}:`, error)
            return {
                success: false,
                url,
                adapter: this.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Update shape fields for an image
     * Uses 8-field composite type: (x, y, z, url, json, blur, turl, tpar)
     */
    protected async updateShapeFields(imageId: number, metadata: MediaMetadata): Promise<void> {
        const updates: string[] = []
        const values: any[] = []

        if (metadata.shape_square) {
            updates.push('shape_square = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
            values.push(
                metadata.shape_square.x || null,
                metadata.shape_square.y || null,
                null, // z
                metadata.shape_square.url,
                null, // json
                (metadata.shape_square as any).blur || null, // blur
                null, // turl
                null  // tpar
            )
        }

        if (metadata.shape_thumb) {
            updates.push('shape_thumb = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
            values.push(
                metadata.shape_thumb.x || null,
                metadata.shape_thumb.y || null,
                null, // z
                metadata.shape_thumb.url,
                null, // json
                (metadata.shape_thumb as any).blur || null, // blur
                null, // turl
                null  // tpar
            )
        }

        if (metadata.shape_wide) {
            updates.push('shape_wide = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
            values.push(
                metadata.shape_wide.x || null,
                metadata.shape_wide.y || null,
                null, // z
                metadata.shape_wide.url,
                null, // json
                (metadata.shape_wide as any).blur || null, // blur
                null, // turl
                null  // tpar
            )
        }

        if (metadata.shape_vertical) {
            updates.push('shape_vertical = ROW(?, ?, ?, ?, ?, ?, ?, ?)::image_shape')
            values.push(
                metadata.shape_vertical.x || null,
                metadata.shape_vertical.y || null,
                null, // z
                metadata.shape_vertical.url,
                null, // json
                (metadata.shape_vertical as any).blur || null, // blur
                null, // turl
                null  // tpar
            )
        }

        if (updates.length > 0) {
            values.push(imageId)
            await db.run(
                `UPDATE images SET ${updates.join(', ')} WHERE id = ?`,
                values
            )
        }
    }

    /**
     * Extract filename from URL
     */
    protected extractFilename(url: string): string {
        try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname
            const filename = pathname.split('/').pop() || 'image'
            return filename.split('?')[0] // Remove query params
        } catch {
            return 'image'
        }
    }

    /**
     * Helper to format composite type for PostgreSQL
     */
    protected formatComposite(values: (string | number | null)[]): string {
        return `(${values.map(v => v === null ? '' : v).join(',')})`
    }
}
