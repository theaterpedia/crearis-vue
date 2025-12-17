/**
 * POST /api/admin/domains
 * Create a new domain
 * Admin only
 */

import { defineEventHandler, createError, getCookie, readBody } from 'h3'
import { db } from '../../../database/init'
import { sessions } from '../../../utils/session-store'

interface CreateDomainBody {
    textdomain?: string | null
    tld: string
    sysdomain_id?: number | null
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
    const user = await db.get('SELECT id, role FROM users WHERE id = $1', [session.userId])
    if (!user || user.role !== 'admin') {
        throw createError({ statusCode: 403, message: 'Admin access required' })
    }

    try {
        const body = await readBody<CreateDomainBody>(event)

        // Validate required fields
        if (!body.tld) {
            throw createError({ statusCode: 400, message: 'TLD is required' })
        }

        // If sysdomain_id is provided, validate it exists and get its tld
        let effectiveTld = body.tld
        if (body.sysdomain_id) {
            const sysdomain = await db.get(
                'SELECT id, tld, domainstring FROM sysdomains WHERE id = $1',
                [body.sysdomain_id]
            )
            if (!sysdomain) {
                throw createError({ statusCode: 400, message: 'Invalid sysdomain_id' })
            }
            // Use sysdomain's TLD
            effectiveTld = sysdomain.tld
        }

        // Validate textdomain format (if provided)
        if (body.textdomain && !/^[a-z0-9_]+$/.test(body.textdomain)) {
            throw createError({
                statusCode: 400,
                message: 'Textdomain can only contain lowercase letters, numbers, and underscores'
            })
        }

        // Insert the domain (domainname is computed by database)
        const result = await db.get(`
            INSERT INTO domains (textdomain, tld, sysdomain_id, project_id, admin_user_id, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            body.textdomain || null,
            effectiveTld,
            body.sysdomain_id || null,
            body.project_id || null,
            user.id,
            body.description || null
        ])

        return {
            success: true,
            domain: result,
            message: `Domain created: ${result.domainname}`
        }
    } catch (error: any) {
        // Handle unique constraint violation
        if (error.code === '23505') {
            throw createError({
                statusCode: 409,
                message: 'Domain already exists'
            })
        }
        console.error('[admin/domains] Create error:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || `Failed to create domain: ${(error as Error).message}`
        })
    }
})
