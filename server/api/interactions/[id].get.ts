import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/interactions/[id] - Get single interaction by ID
 */
export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Missing interaction ID'
            })
        }

        const sql = `
            SELECT 
                i.*,
                p.domaincode AS project_domaincode,
                u.name AS user_name,
                s.name AS status_name,
                s.name_i18n AS status_name_i18n
            FROM interactions i
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN status s ON i.status_id = s.id
            WHERE i.id = ?
        `

        const interaction = await db.get(sql, [Number(id)])

        if (!interaction) {
            throw createError({
                statusCode: 404,
                message: `Interaction not found: ${id}`
            })
        }

        // Parse JSON fields
        return {
            ...interaction,
            fields: interaction.fields ? JSON.parse(interaction.fields) : null,
            actions: interaction.actions ? JSON.parse(interaction.actions) : null
        }

    } catch (error: any) {
        console.error('Error fetching interaction:', error)

        // Re-throw our own errors
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to fetch interaction'
        })
    }
})
