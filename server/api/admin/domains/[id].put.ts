/**
 * PUT /api/admin/domains/:id
 * Update a domain
 * Admin only
 */

import { defineEventHandler, createError, getCookie, readBody, getRouterParam } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

interface UpdateDomainBody {
    project_id?: number | null
    description?: string | null
}

export default defineEventHandler(async (event) => {
    // Check admin authentication
    const sessionId = getCookie(event, 'sessionId')
    if (!sessionId) {
        throw createError({ statusCode: 401, message: 'Authentication required' })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) {
        throw createError({ statusCode: 401, message: 'Session expired' })
    }

    // Check admin role
    const user = await db.get('SELECT role FROM users WHERE id = $1', [session.userId])
    if (!user || user.role !== 'admin') {
        throw createError({ statusCode: 403, message: 'Admin access required' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, message: 'Domain ID is required' })
    }

    try {
        const body = await readBody<UpdateDomainBody>(event)

        // Check domain exists
        const existingDomain = await db.get('SELECT * FROM domains WHERE id = $1', [id])
        if (!existingDomain) {
            throw createError({ statusCode: 404, message: 'Domain not found' })
        }

        // Update domain (only allow updating project_id and description)
        const result = await db.get(`
            UPDATE domains 
            SET project_id = COALESCE($1, project_id),
                description = COALESCE($2, description)
            WHERE id = $3
            RETURNING *
        `, [
            body.project_id !== undefined ? body.project_id : existingDomain.project_id,
            body.description !== undefined ? body.description : existingDomain.description,
            id
        ])

        return {
            success: true,
            domain: result,
            message: `Domain updated: ${result.domainname}`
        }
    } catch (error) {
        console.error('[admin/domains] Update error:', error)
        throw createError({
            statusCode: 500,
            message: `Failed to update domain: ${(error as Error).message}`
        })
    }
})
