import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { I18nCodesTableFields } from '../../types/database'

/**
 * POST /api/i18n
 * 
 * Create a new i18n code entry
 * 
 * Body:
 * - name: Translation key (required)
 * - variation: Context variation (default: 'false')
 * - type: Translation type (button, nav, field, desc) (required)
 * - text: JSONB with de, en, cz translations (required)
 * - status: Status flag (de, en, cz, draft, ok) (default: 'de')
 */
interface CreateI18nBody {
    name: string
    variation?: string
    type: 'button' | 'nav' | 'field' | 'desc'
    text: Record<string, string>
    status?: 'de' | 'en' | 'cz' | 'draft' | 'ok'
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateI18nBody>(event)

        // Check if body exists
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
                message: 'Name is required'
            })
        }

        if (!body.type) {
            throw createError({
                statusCode: 400,
                message: 'Type is required'
            })
        }

        const validTypes = ['button', 'nav', 'field', 'desc']
        if (!validTypes.includes(body.type)) {
            throw createError({
                statusCode: 400,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            })
        }

        if (!body.text || typeof body.text !== 'object') {
            throw createError({
                statusCode: 400,
                message: 'Text object is required (must contain de, en, cz keys)'
            })
        }

        // Validate text has at least 'de' translation
        if (!body.text.de) {
            throw createError({
                statusCode: 400,
                message: 'German (de) translation is required in text object'
            })
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

        const variation = body.variation || 'false'
        const status = body.status || 'de'

        // Check for duplicate (name + variation + type combination)
        const existing = await db.get(
            `SELECT id FROM i18n_codes WHERE name = $1 AND variation = $2 AND type = $3`,
            [body.name, variation, body.type]
        )

        if (existing) {
            throw createError({
                statusCode: 409,
                message: `i18n code already exists with name="${body.name}", variation="${variation}", type="${body.type}"`
            })
        }

        // Prepare data for insert
        const i18nData: Partial<I18nCodesTableFields> = {
            name: body.name.trim(),
            variation,
            type: body.type,
            text: body.text,
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Insert into database
        const result = await db.get(
            `INSERT INTO i18n_codes (name, variation, type, text, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                i18nData.name,
                i18nData.variation,
                i18nData.type,
                JSON.stringify(i18nData.text), // PostgreSQL will convert to JSONB
                i18nData.status,
                i18nData.created_at,
                i18nData.updated_at
            ]
        )

        // Fetch the created entry
        const created = await db.get(
            `SELECT id, name, variation, type, text, status, created_at, updated_at
             FROM i18n_codes WHERE id = $1`,
            [result.id]
        ) as I18nCodesTableFields

        return {
            success: true,
            i18n_code: created,
            message: 'i18n code created successfully'
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        console.error('Error creating i18n code:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to create i18n code',
            data: error
        })
    }
})
