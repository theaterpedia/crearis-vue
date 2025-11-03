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
     */
    abstract fetchMetadata(url: string): Promise<MediaMetadata>

    /**
     * Import image into database with metadata and batch data
     */
    async importImage(url: string, batchData?: ImageImportBatch): Promise<ImageImportResult> {
        try {
            // Fetch metadata from external service
            const metadata = await this.fetchMetadata(url)

            // Resolve project_id from domaincode if provided
            let project_id: number | null = null
            if (batchData?.domaincode) {
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

            // Merge metadata with batch data
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
                xmlid: batchData?.xml_root || null, // Will be updated with sequence
                geo: metadata.geo ? JSON.stringify(metadata.geo) : null,
                date: metadata.date || null,
                about: metadata.about || null,
                ctags: batchData?.ctags ? Buffer.from(batchData.ctags) : Buffer.from([0]),
                rtags: batchData?.rtags ? Buffer.from(batchData.rtags) : Buffer.from([0]),
                // Author info as composite type (adapter, file_id, account_id, folder_id, info, config)
                author: metadata.author ? `(${metadata.author.adapter},"${metadata.author.file_id || ''}","${metadata.author.account_id || ''}","${metadata.author.folder_id || ''}","${metadata.author.info || ''}",${metadata.author.config ? `"${JSON.stringify(metadata.author.config).replace(/"/g, '\\"')}"` : 'null'})` : null
            }

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

            // Update shape fields if available
            if (imageId && (metadata.shape_square || metadata.shape_thumb || metadata.shape_wide || metadata.shape_vertical)) {
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
     */
    protected async updateShapeFields(imageId: number, metadata: MediaMetadata): Promise<void> {
        const updates: string[] = []
        const values: any[] = []

        if (metadata.shape_square) {
            updates.push('shape_square = ROW(?, ?, ?, ?, ?)::image_shape')
            values.push(metadata.shape_square.x || null, metadata.shape_square.y || null, null, metadata.shape_square.url, null)
        }

        if (metadata.shape_thumb) {
            updates.push('shape_thumb = ROW(?, ?, ?, ?, ?)::image_shape')
            values.push(metadata.shape_thumb.x || null, metadata.shape_thumb.y || null, null, metadata.shape_thumb.url, null)
        }

        if (metadata.shape_wide) {
            updates.push('shape_wide = ROW(?, ?, ?, ?, ?)::image_shape')
            values.push(metadata.shape_wide.x || null, metadata.shape_wide.y || null, null, metadata.shape_wide.url, null)
        }

        if (metadata.shape_vertical) {
            updates.push('shape_vertical = ROW(?, ?, ?, ?, ?)::image_shape')
            values.push(metadata.shape_vertical.x || null, metadata.shape_vertical.y || null, null, metadata.shape_vertical.url, null)
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
