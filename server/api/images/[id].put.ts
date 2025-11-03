import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

/**
 * PUT /api/images/:id - Update image
 */
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    console.log(`[PUT /api/images/${id}] Received body:`, body)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Image ID is required'
        })
    }

    try {
        const existing = await db.get('SELECT id FROM images WHERE id = ?', [id])
        if (!existing) {
            throw createError({
                statusCode: 404,
                message: 'Image not found'
            })
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
                if (v === null || v === '' || v === undefined) return ''

                // For shape types: (x numeric, y numeric, z numeric, url text, json jsonb)
                // x, y, z (indices 0,1,2) are numeric - don't quote
                // url (index 3) is text - always quote if not empty
                // json (index 4) is jsonb - would need special handling but we don't use it yet
                if (isShapeType) {
                    if (idx === 3) {
                        // URL - always quote
                        const str = String(v)
                        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
                    } else if (idx === 4) {
                        // JSON - would need special handling, but not used yet
                        return ''
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
                    // Handle shape fields as PostgreSQL composite type (x, y, z, url, json)
                    // Matching image_shape type: (x numeric, y numeric, z numeric, url text, json jsonb)
                    const shape = body[field]
                    if (shape) {
                        const compositeValues = [
                            shape.x || null,
                            shape.y || null,
                            shape.z || null,
                            shape.url || '',
                            null   // json - not used yet
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

        // Handle ctags and rtags separately (bytea fields)
        if (body.ctags !== undefined) {
            updates.push('ctags = ?')
            values.push(body.ctags ? Buffer.from(body.ctags) : null)
        }

        if (body.rtags !== undefined) {
            updates.push('rtags = ?')
            values.push(body.rtags ? Buffer.from(body.rtags) : null)
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
