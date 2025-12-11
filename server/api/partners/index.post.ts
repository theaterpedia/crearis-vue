import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../auth/login.post'

/**
 * POST /api/partners
 * Create a new partner for onboarding flow
 * 
 * Body:
 * - name: Partner name (required)
 * - partner_types: Bitmask (default 1 = instructor)
 * - sysmail: User's sysmail for xmlid generation (optional, uses session if not provided)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { name: string; partner_types?: number; sysmail?: string }

    if (!body.name || body.name.trim().length < 2) {
        throw createError({
            statusCode: 400,
            message: 'Name is required (min 2 characters)'
        })
    }

    // Get sysmail from body or session
    let sysmail = body.sysmail
    if (!sysmail) {
        const sessionId = getCookie(event, 'sessionId')
        if (sessionId) {
            const session = sessions.get(sessionId)
            if (session) {
                sysmail = session.sysmail
            }
        }
    }

    // Generate xmlid: tp.partner-user.{sanitized_sysmail}
    // Sanitize: replace @ and . with _ 
    const sanitizedMail = sysmail ? sysmail.replace(/[@.]/g, '_') : `user_${Date.now()}`
    const xmlid = `tp.partner-user.${sanitizedMail}`

    try {
        const partnerTypes = body.partner_types || 1 // Default to instructor

        const result = await db.get(`
            INSERT INTO partners (xmlid, name, partner_types, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, xmlid, name, partner_types
        `, [xmlid, body.name.trim(), partnerTypes])

        return result
    } catch (error) {
        console.error('Error creating partner:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to create partner'
        })
    }
})
