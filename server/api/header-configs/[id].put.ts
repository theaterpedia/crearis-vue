/**
 * PUT /api/header-configs/:id
 * 
 * Update an existing header configuration.
 * Body: { config?, label_de?, label_en?, description?, sort_order? }
 * 
 * Note: name and parent_type cannot be changed after creation.
 */

import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Config ID is required'
        })
    }

    try {
        // Build update fields dynamically
        const updates: string[] = []
        const params: any[] = []
        let paramIndex = 1

        if (body.config !== undefined) {
            updates.push(`config = $${paramIndex++}`)
            params.push(JSON.stringify(body.config))
        }

        if (body.label_de !== undefined) {
            updates.push(`label_de = $${paramIndex++}`)
            params.push(body.label_de)
        }

        if (body.label_en !== undefined) {
            updates.push(`label_en = $${paramIndex++}`)
            params.push(body.label_en)
        }

        if (body.description !== undefined) {
            updates.push(`description = $${paramIndex++}`)
            params.push(body.description)
        }

        if (body.sort_order !== undefined) {
            updates.push(`sort_order = $${paramIndex++}`)
            params.push(body.sort_order)
        }

        if (body.is_default !== undefined) {
            updates.push(`is_default = $${paramIndex++}`)
            params.push(body.is_default)
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`)
        params.push(id)

        const sql = `
      UPDATE header_configs 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `

        await db.run(sql, params)

        // Fetch updated record
        const updated = await db.get(`
      SELECT * FROM header_configs WHERE id = $1
    `, [id])

        if (!updated) {
            throw createError({
                statusCode: 404,
                message: `Header config ${id} not found`
            })
        }

        return {
            success: true,
            data: {
                ...updated,
                config: typeof (updated as any).config === 'string'
                    ? JSON.parse((updated as any).config)
                    : (updated as any).config
            }
        }
    } catch (error: any) {
        if (error.statusCode) throw error
        console.error('[PUT /api/header-configs/:id] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to update header config'
        })
    }
})
