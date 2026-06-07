/**
 * GET /api/admin/domains
 * List all domains with project and sysdomain info
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
        // Get all domains with related project and sysdomain info
        const domains = await db.all(`
            SELECT 
                d.id,
                d.domainname,
                d.textdomain,
                d.tld,
                d.sysdomain_id,
                d.project_id,
                d.admin_user_id,
                d.description,
                p.domaincode as project_domaincode,
                p.name as project_name,
                p.heading as project_heading,
                s.domain as sysdomain_domain,
                s.domainstring as sysdomain_string,
                CASE 
                    WHEN d.sysdomain_id IS NOT NULL THEN 'subdomain'
                    ELSE 'custom'
                END as domain_type
            FROM domains d
            LEFT JOIN projects p ON d.project_id = p.id
            LEFT JOIN sysdomains s ON d.sysdomain_id = s.id
            ORDER BY d.domainname ASC
        `)

        return {
            success: true,
            domains,
            count: domains.length
        }
    } catch (error) {
        console.error('[admin/domains] Error:', error)
        throw createError({
            statusCode: 500,
            message: `Failed to fetch domains: ${(error as Error).message}`
        })
    }
})
