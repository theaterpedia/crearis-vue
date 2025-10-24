import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { I18nCodesTableFields } from '../../types/database'

interface UpdateI18nBody {
    name?: string
    variation?: string
    type?: 'button' | 'nav' | 'field' | 'desc'
    text?: Record<string, string>
    status?: 'de' | 'en' | 'cz' | 'draft' | 'ok'
}

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id || isNaN(Number(id))) {
            throw createError({
                statusCode: 400,
                message: 'Valid ID is required'
            })
        }

        const body = await readBody<UpdateI18nBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Check if entry exists
        const existing = db.prepare('SELECT * FROM i18n_codes WHERE id = ?').get(Number(id)) as I18nCodesTableFields | undefined

        if (!existing) {
            throw createError({
                statusCode: 404,
                message: `i18n code with id=${id} not found`
            })
        }

        // Validate type if provided
        if (body.type) {
            const validTypes = ['button', 'nav', 'field', 'desc']
            if (!validTypes.includes(body.type)) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
                })
            }
        }

        // Validate status if provided
        if (body.status) {
            const validStatuses = ['de', 'en', 'cz', 'draft', 'ok']
            if (!validStatuses.includes(body.status)) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                })
            }
        }

        // Validate text if provided
        if (body.text) {
            if (typeof body.text !== 'object') {
                throw createError({
                    statusCode: 400,
                    message: 'text must be an object with language codes as keys'
                })
            }

            if (!body.text.de) {
                throw createError({
                    statusCode: 400,
                    message: 'text object must contain at least "de" (German) translation'
                })
            }
        }

        // Check for duplicate if name, variation, or type changed
        if (body.name || body.variation || body.type) {
            const checkName = body.name || existing.name
            const checkVariation = body.variation !== undefined ? body.variation : existing.variation
            const checkType = body.type || existing.type

            const duplicate = db.prepare(`
                SELECT id FROM i18n_codes 
                WHERE name = ? AND variation = ? AND type = ? AND id != ?
            `).get(checkName, checkVariation, checkType, Number(id)) as { id: number } | undefined

            if (duplicate) {
                throw createError({
                    statusCode: 409,
                    message: `Another i18n code already exists with name="${checkName}", variation="${checkVariation}", type="${checkType}"`
                })
            }
        }

        // Build update fields
        const updates: string[] = []
        const params: any[] = []

        if (body.name !== undefined) {
            updates.push('name = ?')
            params.push(body.name.trim())
        }

        if (body.variation !== undefined) {
            updates.push('variation = ?')
            params.push(body.variation)
        }

        if (body.type !== undefined) {
            updates.push('type = ?')
            params.push(body.type)
        }

        if (body.text !== undefined) {
            updates.push('text = ?')
            params.push(JSON.stringify(body.text))
        }

        if (body.status !== undefined) {
            updates.push('status = ?')
            params.push(body.status)
        }

        // Always update updated_at
        updates.push('updated_at = ?')
        params.push(new Date().toISOString())

        if (updates.length === 1) {
            // Only updated_at changed
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        // Add ID to params
        params.push(Number(id))

        // Execute update
        const sql = `UPDATE i18n_codes SET ${updates.join(', ')} WHERE id = ?`
        db.prepare(sql).run(...params)

        // Fetch updated entry
        const updated = db.prepare('SELECT * FROM i18n_codes WHERE id = ?').get(Number(id)) as I18nCodesTableFields

        return {
            success: true,
            i18n_code: updated
        }
    } catch (error: any) {
        console.error('Error updating i18n code:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: `Failed to update i18n code: ${error.message}`
        })
    }
})
