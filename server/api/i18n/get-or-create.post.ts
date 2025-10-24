import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { I18nCodesTableFields } from '../../types/database'

interface GetOrCreateI18nBody {
    name: string
    variation?: string
    type: 'button' | 'nav' | 'field' | 'desc'
    defaultText?: string
    status?: 'de' | 'en' | 'cz' | 'draft' | 'ok'
}

/**
 * POST /api/i18n/get-or-create
 * 
 * Get existing i18n code or create new one with defaults
 * Used for inline creation from Vue components
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<GetOrCreateI18nBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Validate required fields
        if (!body.name || body.name.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'name is required'
            })
        }

        if (!body.type) {
            throw createError({
                statusCode: 400,
                message: 'type is required'
            })
        }

        const validTypes = ['button', 'nav', 'field', 'desc']
        if (!validTypes.includes(body.type)) {
            throw createError({
                statusCode: 400,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            })
        }

        const variation = body.variation || 'false'

        // Try to find existing entry
        const existing = db.prepare(`
            SELECT * FROM i18n_codes 
            WHERE name = ? AND variation = ? AND type = ?
        `).get(body.name, variation, body.type) as I18nCodesTableFields | undefined

        if (existing) {
            return {
                success: true,
                created: false,
                i18n_code: existing
            }
        }

        // Create new entry with defaults
        const defaultText = body.defaultText || body.name
        const status = body.status || 'de'

        const text = {
            de: defaultText,
            en: defaultText,
            cz: defaultText
        }

        const i18nData = {
            name: body.name.trim(),
            variation,
            type: body.type,
            text: JSON.stringify(text),
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const result = db.prepare(`
            INSERT INTO i18n_codes (name, variation, type, text, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            i18nData.name,
            i18nData.variation,
            i18nData.type,
            i18nData.text,
            i18nData.status,
            i18nData.created_at,
            i18nData.updated_at
        )

        const created = db.prepare('SELECT * FROM i18n_codes WHERE id = (SELECT last_insert_rowid())').get() as I18nCodesTableFields

        // Parse text field from JSON string to object
        const parsedCreated = {
            ...created,
            text: typeof created.text === 'string' ? JSON.parse(created.text) : created.text
        }

        return {
            success: true,
            created: true,
            i18n_code: parsedCreated
        }
    } catch (error: any) {
        console.error('Error in get-or-create i18n code:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: `Failed to get-or-create i18n code: ${error.message}`
        })
    }
})
