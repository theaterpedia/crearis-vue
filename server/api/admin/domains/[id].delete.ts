/**
 * DELETE /api/admin/domains/:id
 * Delete a domain
 * Admin only
 */

import { defineEventHandler, createError, getCookie, getRouterParam } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

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
        // Check domain exists
        const existingDomain = await db.get('SELECT * FROM domains WHERE id = $1', [id])
        if (!existingDomain) {
            throw createError({ statusCode: 404, message: 'Domain not found' })
        }

        // Check if domain is linked to a project
        if (existingDomain.project_id) {
            // Also clear the domain_id from the project
            await db.run('UPDATE projects SET domain_id = NULL WHERE domain_id = $1', [id])
        }

        // Delete the domain
        await db.run('DELETE FROM domains WHERE id = $1', [id])

        return {
            success: true,
            message: `Domain deleted: ${existingDomain.domainname}`,
            deletedDomain: existingDomain
        }
    } catch (error) {
        console.error('[admin/domains] Delete error:', error)
        throw createError({
            statusCode: 500,
            message: `Failed to delete domain: ${(error as Error).message}`
        })
    }
})
