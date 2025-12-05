import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'
import { generateShapeBlurHashes } from '../../utils/blurhash'

/**
 * PATCH /api/images/:id - Partially update image
 * 
 * More RESTful alternative to PUT - only updates provided fields.
 * Triggers propagation of img_* computed fields to related entity tables.
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event) as Record<string, any>

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    try {
        const existing = await db.get('SELECT id, url FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Generate BlurHash if URL changed
        let blurHashes: any = null
        if (body.url && body.url !== existing.url) {
            console.log('[PATCH /api/images/:id] URL changed, regenerating BlurHash')
            blurHashes = await generateShapeBlurHashes(body.url)
        }

        const updates: string[] = []
        const values: any[] = []

        const allowedFields: (keyof ImagesTableFields)[] = [
            'name', 'url', 'alt_text', 'title', 'project_id', 'status_id',
            'creator_id', 'x', 'y', 'fileformat', 'embedformat', 'license', 'length',
            'xmlid', 'author', 'shape_square', 'shape_wide', 'shape_vertical', 'shape_thumb',
            'ctags'
        ]

        // Helper to format composite types
        const formatComposite = (values: (string | number | null)[], isShapeType: boolean = false) => {
            return `(${values.map((v: string | number | null, idx: number) => {
                // Handle null/undefined/empty - must be literal NULL for PostgreSQL composite types
                if (v === null || v === undefined || v === '') {
                    return ''  // Empty string between commas represents NULL in PostgreSQL composite literals
                }

                // For shape types: (x numeric, y numeric, z numeric, url text, json jsonb, blur varchar(50), turl text, tpar text)
                // x, y, z (indices 0,1,2) are numeric - don't quote
                // url (index 3) is text - always quote if not empty
                // json (index 4) is jsonb - would need special handling but we don't use it yet
                // blur (index 5) is varchar - quote if has special chars
                // turl (index 6) is text - quote if has special chars  
                // tpar (index 7) is text - quote if has special chars
                if (isShapeType) {
                    if (idx === 3 || idx === 6 || idx === 7) {
                        // URL, turl, tpar - always quote
                        const str = String(v)
                        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
                    } else if (idx === 4) {
                        // JSON - would need special handling, but not used yet
                        return ''
                    } else if (idx === 5) {
                        // blur - quote if contains special characters
                        const str = String(v)
                        if (/[,()"\\\s]/.test(str)) {
                            return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
                        }
                        return str
                    } else {
                        // x, y, z numeric values - don't quote
                        return String(v)
                    }
                }

                // For other composite types, quote if contains special characters
                const str = String(v)
                if (/[,()"\\\s]/.test(str)) {
                    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
                }
                return str
            }).join(',')})`
        }

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'author') {
                    // Handle author as PostgreSQL composite type
                    const author = body[field]
                    const compositeValues = [
                        author.adapter || '',
                        author.file_id || '',
                        author.account_id || '',
                        author.folder_id || '',
                        author.username || '',
                        author.attribution || ''
                    ]
                    updates.push(`${field} = ?`)
                    values.push(formatComposite(compositeValues))
                } else if (field === 'shape_square' || field === 'shape_wide' || field === 'shape_vertical' || field === 'shape_thumb') {
                    // Handle shape fields as PostgreSQL composite type (x, y, z, url, json, blur, turl, tpar)
                    const shape = body[field]
                    if (shape) {
                        // Use provided blur or newly generated one
                        const shapeKey = field.replace('shape_', '') as 'square' | 'wide' | 'vertical' | 'thumb'
                        const blur = shape.blur || (blurHashes ? blurHashes[shapeKey] : null)

                        const compositeValues = [
                            shape.x || null,
                            shape.y || null,
                            shape.z || null,
                            shape.url || '',
                            null,   // json - not used yet
                            blur,   // blur - BlurHash string
                            shape.turl || null,  // turl
                            shape.tpar || null   // tpar
                        ]
                        updates.push(`${field} = ?`)
                        values.push(formatComposite(compositeValues, true))
                    }
                } else if (field === 'ctags') {
                    // Handle ctags as bytea - convert array to Buffer
                    if (Array.isArray(body[field])) {
                        updates.push(`${field} = ?`)
                        values.push(Buffer.from(body[field]))
                    } else if (Buffer.isBuffer(body[field])) {
                        updates.push(`${field} = ?`)
                        values.push(body[field])
                    }
                } else {
                    updates.push(`${field} = ?`)
                    values.push(body[field])
                }
            }
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(id)

        const stmt = db.prepare(`
            UPDATE images 
            SET ${updates.join(', ')}
            WHERE id = ?
        `)

        stmt.run(...values)

        // Return updated image with all computed fields
        // Note: Triggers have computed img_* fields and propagated to entity tables
        const updated = await db.get(`
            SELECT 
                i.*,
                u.username as creator_username
            FROM images i
            LEFT JOIN users u ON i.creator_id = u.id
            WHERE i.id = ?
        `, [id])

        return updated
    } catch (error) {
        console.error('Error updating image:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update image'
        })
    }
})
