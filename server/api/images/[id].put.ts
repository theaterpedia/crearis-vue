import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'
import { generateShapeBlurHashes } from '../../utils/blurhash'

/**
 * PUT /api/images/:id - Update image
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event) as any

    console.log(`[PUT /api/images/${id}] Received body:`, body)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    try {
        const existing = await db.get('SELECT id, url, shape_wide, shape_square, shape_vertical, shape_thumb FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
        }

        // Generate BlurHash if:
        // 1. URL changed, OR
        // 2. Any shape field is being updated but doesn't have blur yet
        let blurHashes: any = null
        const urlChanged = body.url && body.url !== existing.url
        const needsBlurHash = urlChanged ||
            (body.shape_wide && !body.shape_wide.blur) ||
            (body.shape_square && !body.shape_square.blur) ||
            (body.shape_vertical && !body.shape_vertical.blur) ||
            (body.shape_thumb && !body.shape_thumb.blur)

        if (needsBlurHash) {
            const urlToUse = body.url || existing.url
            console.log('[PUT /api/images/:id] Generating BlurHash for URL:', urlToUse)
            blurHashes = await generateShapeBlurHashes(urlToUse)
        }

        const updates: string[] = []
        const values: any[] = []

        const allowedFields: (keyof ImagesTableFields)[] = [
            'name', 'url', 'alt_text', 'title', 'project_id', 'status_id',
            'owner_id', 'x', 'y', 'fileformat', 'embedformat', 'license', 'length',
            'xmlid', 'author', 'shape_square', 'shape_wide', 'shape_vertical', 'shape_thumb'
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
                    // Handle author as PostgreSQL composite type (adapter, file_id, account_id, folder_id, username, attribution)
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
                    // Matching image_shape type: (x numeric, y numeric, z numeric, url text, json jsonb, blur varchar(50), turl text, tpar text)
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
                } else {
                    updates.push(`${field} = ?`)
                    values.push(body[field])
                }
            }
        }

        // Handle ctags and rtags separately (INTEGER fields after Migration 036)
        if (body.ctags !== undefined) {
            updates.push('ctags = ?')
            values.push(typeof body.ctags === 'number' ? body.ctags : (body.ctags ?? 0))
        }

        if (body.rtags !== undefined) {
            updates.push('rtags = ?')
            values.push(typeof body.rtags === 'number' ? body.rtags : (body.rtags ?? 0))
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        updates.push('updated_at = CURRENT_TIMESTAMP')
        values.push(id)

        const sql = `UPDATE images SET ${updates.join(', ')} WHERE id = ?`
        console.log(`[PUT /api/images/${id}] Executing SQL:`, sql)
        console.log(`[PUT /api/images/${id}] With values:`, values)

        const result = await db.run(sql, values)
        console.log(`[PUT /api/images/${id}] Update result:`, result)

        const updated = await db.get('SELECT * FROM images WHERE id = ?', [id])
        console.log(`[PUT /api/images/${id}] Returning updated record`)
        return updated
    } catch (error) {
        console.error(`[PUT /api/images/${id}] Error:`, error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to update image'
        })
    }
})
