import { defineEventHandler, readBody, createError, setCookie, getCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'
import type { UsersTableFields } from '../../types/database'
import { getStatusByName } from '../../utils/status-helpers'
import { sessions, type SessionData } from '../../utils/session-store'
import { hydrateUserProjectsAndRole } from '../../utils/user-projects'

// Re-export sessions for backward compatibility (deprecated - use session-store directly)
export { sessions }

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as { username?: string; userId?: string; password?: string }

    // Support both userId (new) and username (legacy) for backwards compatibility
    const userIdentifier = body.userId || body.username
    const { password } = body

    if (!userIdentifier || !password) {
        throw createError({
            statusCode: 400,
            message: 'User ID and password are required'
        })
    }

    // Find user from users table by sysmail or extmail
    const user = await db.get(`
    SELECT id, sysmail, extmail, username, password, role, partner_id, img_id, status
    FROM users
    WHERE sysmail = ? OR extmail = ?
  `, [userIdentifier, userIdentifier]) as Pick<UsersTableFields, 'id' | 'sysmail' | 'extmail' | 'username' | 'password' | 'role' | 'partner_id' | 'status'> & { img_id?: number } | undefined

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Invalid credentials'
        })
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password)

    if (!validPassword) {
        throw createError({
            statusCode: 401,
            message: 'Invalid credentials'
        })
    }

    // Check and update status if empty/null/undefined - set to 'new' status for users table
    if (!user.status) {
        const statusInfo = await getStatusByName(db, 'new', 'users')
        if (statusInfo) {
            await db.run(`
                UPDATE users
                SET status = ?
                WHERE id = ?
            `, [statusInfo.value, user.id])
            console.log(`[LOGIN] Updated user ${user.id} status to 'new'`)
            user.status = statusInfo.value
        } else {
            console.warn(`[LOGIN] Warning: Could not find 'new' status for users`)
        }
    }

    // === PROJECT ROLE DETECTION ===
    // Hydrate user's projects + resolve role-state via the shared helper
    // (server/utils/user-projects.ts). Same path used by the Odoo-SSO bridge
    // in 02-auth.ts post-barrier-2 fix (CTO dispatch af21dae · 2026-05-22 PM)
    // so both auth flows produce symmetric SessionData.
    const {
        projectRecords,
        availableRoles,
        activeRole,
        initialProjectId,
        initialProjectName,
    } = await hydrateUserProjectsAndRole({
        id: user.id,
        role: user.role,
        partner_id: typeof user.partner_id === 'number' ? user.partner_id : null,
    })

    // Create session
    const sessionId = nanoid(32)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Build session data
    const sessionData: SessionData = {
        userId: user.id,
        sysmail: user.sysmail,  // Added for permission checks
        username: user.username,
        status: user.status || null,  // For onboarding flow
        partner_id: user.partner_id || null,  // For onboarding flow
        img_id: (user as any).img_id || null,  // For onboarding flow
        availableRoles,
        activeRole,
        projectId: initialProjectId,
        projectName: initialProjectName,
        projects: projectRecords,
        capabilities: {},
        expiresAt
    }

    sessions.set(sessionId, sessionData)

    // Set session cookie
    setCookie(event, 'sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
    })

    // Build response user object
    const responseUser = {
        id: user.id,
        sysmail: user.sysmail,  // Added for permission checks
        username: user.username,
        status: user.status || null,  // For onboarding flow
        partner_id: user.partner_id || null,  // For onboarding flow
        img_id: (user as any).img_id || null,  // For onboarding flow
        availableRoles,
        activeRole,
        projectId: initialProjectId,
        projectName: initialProjectName,
        projects: projectRecords,
        capabilities: {}
    }

    return {
        success: true,
        user: responseUser
    }
})
