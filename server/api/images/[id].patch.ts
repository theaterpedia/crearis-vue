import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'

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
            'xmlid', 'author', 'shape_square', 'shape_wide', 'shape_vertical', 'shape_thumb',
            'ctags'
        ]

        // Helper to format composite types
        const formatComposite = (values: (string | number | null)[], isShapeType: boolean = false) => {
            return `(${values.map((v: string | number | null, idx: number) => {
                if (v === null || v === '' || v === undefined) return ''

                // For shape types: (x numeric, y numeric, z numeric, url text, json jsonb)
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
                    // Handle shape fields as PostgreSQL composite type
                    const shape = body[field]
                    if (shape) {
                        const compositeValues = [
                            shape.x || null,
                            shape.y || null,
                            shape.z || null,
                            shape.url || '',
                            null // json - not used yet
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
                u.username as owner_username,
                s.name as status_name
            FROM images i
            LEFT JOIN users u ON i.owner_id = u.id
            LEFT JOIN status s ON i.status_id = s.id AND s.table = 'images'
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
