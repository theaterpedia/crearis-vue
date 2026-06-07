/**
 * POST /api/header-configs
 * 
 * Create a new header configuration (subcategory).
 * Body: { name, parent_type, config, label_de?, label_en?, description? }
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

const VALID_PARENT_TYPES = ['simple', 'columns', 'banner', 'cover', 'bauchbinde']

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Validate required fields
    if (!body.name || !body.parent_type) {
        throw createError({
            statusCode: 400,
            message: 'name and parent_type are required'
        })
    }

    // Validate parent_type
    if (!VALID_PARENT_TYPES.includes(body.parent_type)) {
        throw createError({
            statusCode: 400,
            message: `parent_type must be one of: ${VALID_PARENT_TYPES.join(', ')}`
        })
    }

    // Validate name format (should be parent_type.subcategory)
    if (!body.name.startsWith(body.parent_type + '.')) {
        throw createError({
            statusCode: 400,
            message: `name must start with parent_type: ${body.parent_type}.xxx`
        })
    }

    try {
        const configJson = JSON.stringify(body.config || {})
        const isPostgres = db.type === 'postgresql'

        const result = await db.run(`
      INSERT INTO header_configs (name, parent_type, is_default, config, label_de, label_en, description, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ${isPostgres ? 'RETURNING id' : ''}
    `, [
            body.name,
            body.parent_type,
            body.is_default || false,
            configJson,
            body.label_de || body.name,
            body.label_en || body.name,
            body.description || '',
            body.sort_order || 100
        ])

        const id = isPostgres ? (result as any).rows?.[0]?.id : (result as any).lastID

        return {
            success: true,
            data: {
                id,
                name: body.name,
                parent_type: body.parent_type,
                config: body.config || {}
            }
        }
    } catch (error: any) {
        if (error.code === '23505' || error.message?.includes('UNIQUE constraint')) {
            throw createError({
                statusCode: 409,
                message: `Header config '${body.name}' already exists`
            })
        }
        console.error('[POST /api/header-configs] Error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to create header config'
        })
    }
})
