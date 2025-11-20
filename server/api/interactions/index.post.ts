import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { InteractionsTableFields } from '../../types/database'
import { getStatusByName } from '../../utils/status-helpers'

/**
 * POST /api/interactions - Create new interaction (form submission)
 * 
 * Purpose: Accept form input from website
 * 
 * Body fields:
 * - name: Form name (required)
 * - project: Project domaincode (optional, will be converted to project_id)
 * - user_id: User ID (optional)
 * - status_name: Status name (optional, defaults to 'interactions > new')
 * - to_mail: Recipient email (optional)
 * - from_mail: Sender email (optional)
 * - subject: Email subject (optional)
 * - md: Markdown content (optional)
 * - fields: Form fields data (optional JSONB)
 * - actions: Actions to perform (optional JSONB)
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<any>(event)

        // Validate required fields
        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required field: name'
            })
        }

        // Lookup project_id if project domaincode provided
        let projectId = null
        if (body.project) {
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [body.project])
            if (project) {
                projectId = project.id
            } else {
                throw createError({
                    statusCode: 404,
                    message: `Project not found: ${body.project}`
                })
            }
        }

        // Get status_val from status name (default to 'interactions > new')
        const statusName = body.status_name || 'interactions > new'
        const statusVal = await getStatusByName(statusName)
        if (!statusVal) {
            throw createError({
                statusCode: 400,
                message: `Invalid status name: ${statusName}`
            })
        }

        // Prepare interaction data
        const interactionData: Partial<InteractionsTableFields> = {
            name: body.name,
            user_id: body.user_id || null,
            project_id: projectId,
            status_val: statusVal,
            to_mail: body.to_mail || null,
            from_mail: body.from_mail || null,
            subject: body.subject || null,
            md: body.md || null,
            fields: body.fields ? JSON.stringify(body.fields) : null,
            actions: body.actions ? JSON.stringify(body.actions) : null
        }

        // Insert interaction
        const sql = `
            INSERT INTO interactions (
                name, user_id, project_id, status_val,
                to_mail, from_mail, subject, md, fields, actions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, timestamp
        `

        const result = await db.run(sql, [
            interactionData.name,
            interactionData.user_id,
            interactionData.project_id,
            interactionData.status_val,
            interactionData.to_mail,
            interactionData.from_mail,
            interactionData.subject,
            interactionData.md,
            interactionData.fields,
            interactionData.actions
        ])

        const newId = result.rows?.[0]?.id || result.lastID
        const timestamp = result.rows?.[0]?.timestamp

        if (!newId) {
            throw new Error('Failed to get new interaction ID')
        }

        // Return created interaction
        return {
            id: newId,
            timestamp,
            ...interactionData,
            // Parse JSON back to objects for response
            fields: body.fields || null,
            actions: body.actions || null
        }

    } catch (error: any) {
        console.error('Error creating interaction:', error)

        // Re-throw our own errors
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to create interaction'
        })
    }
})
