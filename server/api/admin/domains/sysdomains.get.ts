/**
 * GET /api/admin/domains/sysdomains
 * List all system domains (for dropdown selection)
 * Admin only
 */

import { defineEventHandler, createError, getCookie } from 'h3'
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

    try {
        // Get all system domains
        const sysdomains = await db.all(`
            SELECT 
                id,
                domain,
                tld,
                subdomain,
                domainstring,
                description,
                options
            FROM sysdomains
            ORDER BY domain ASC
        `)

        // Check which have wildcard SSL (based on options or assumed)
        const withWildcard = sysdomains.map(sd => ({
            ...sd,
            hasWildcardSsl: !sd.options?.private, // Assume non-private have wildcard
            fullDomain: `${sd.domainstring}.${sd.tld}`
        }))

        return {
            success: true,
            sysdomains: withWildcard,
            count: sysdomains.length
        }
    } catch (error) {
        console.error('[admin/domains/sysdomains] Error:', error)
        throw createError({
            statusCode: 500,
            message: `Failed to fetch system domains: ${(error as Error).message}`
        })
    }
})
