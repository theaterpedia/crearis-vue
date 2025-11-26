import { defineEventHandler, setCookie, createError, sendRedirect } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../../../database/init'
import type { UsersTableFields, ProjectsTableFields } from '../../../types/database'
import { sessions } from '../login.post'
import { getStatusByName } from '../../../utils/status-helpers'

/**
 * DEV-ONLY Auto-login endpoint
 * GET /api/auth/login/admin - Automatically logs in as admin@theaterpedia.org
 * 
 * SECURITY: Only works in development mode (NODE_ENV !== 'production')
 */
export default defineEventHandler(async (event) => {
    // SECURITY CHECK: Only allow in development
    if (process.env.NODE_ENV === 'production') {
        throw createError({
            statusCode: 404,
            message: 'Not found'
        })
    }

    const adminEmail = 'admin@theaterpedia.org'

    // Find admin user
    const user = await db.get(`
        SELECT id, sysmail, extmail, username, password, role, instructor_id, status
        FROM users
        WHERE sysmail = ? OR extmail = ?
    `, [adminEmail, adminEmail]) as Pick<UsersTableFields, 'id' | 'sysmail' | 'extmail' | 'username' | 'password' | 'role' | 'instructor_id' | 'status'> | undefined

    if (!user) {
        throw createError({
            statusCode: 500,
            message: 'Admin user not found. Run migrations first.'
        })
    }

    // Check and update status if needed
    if (!user.status_val) {
        const statusVal = await getStatusByName('users > new')
        if (statusVal) {
            await db.run(`
                UPDATE users
                SET status_val = ?
                WHERE id = ?
            `, [statusVal, user.id])
            user.status_val = statusVal
        }
    }

    // Get user projects
    const userProjects = await db.all(`
        SELECT 
            p.id,
            p.domaincode,
            p.name,
            pm.role as member_role,
            CASE WHEN p.owner_id = ? THEN 1 ELSE 0 END as is_owner,
            CASE WHEN pm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE p.owner_id = ? OR pm.user_id IS NOT NULL
        ORDER BY p.name
    `, [user.id, user.id, user.id]) as any[]

    const projects = userProjects.map((p: any) => ({
        id: p.domaincode,
        domaincode: p.domaincode,
        name: p.name,
        username: user.username,
        isOwner: p.is_owner === 1,
        isMember: p.is_member === 1,
        isInstructor: false,
        isAuthor: false
    }))

    // Determine available roles
    const availableRoles: string[] = ['user']
    if (user.role === 'admin') availableRoles.push('admin')
    if (user.instructor_id) availableRoles.push('instructor')

    // Default active role - prefer admin, then instructor, then user
    const activeRole = availableRoles.includes('admin')
        ? 'admin'
        : availableRoles.includes('instructor')
            ? 'instructor'
            : 'user'

    // Default to first project if available
    const defaultProject = projects.length > 0 ? projects[0] : null

    // Create session
    const sessionId = nanoid()
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    sessions.set(sessionId, {
        userId: user.id,
        username: user.username,
        availableRoles,
        activeRole,
        projectId: defaultProject?.domaincode || null,
        projectName: defaultProject?.name || undefined,
        projects,
        expiresAt
    })

    // Set session cookie on both ports for development
    // Set on backend port (3000)
    setCookie(event, 'sessionId', sessionId, {
        httpOnly: true,
        secure: false, // Must be false in dev for localhost
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
        domain: 'localhost' // Share cookie across all localhost ports
    })

    console.log(`[DEV AUTO-LOGIN] Logged in as ${adminEmail}, session: ${sessionId}`)
    console.log(`[DEV AUTO-LOGIN] Cookie set: sessionId=${sessionId}, domain=localhost, maxAge=24h`)
    console.log(`[DEV AUTO-LOGIN] Available roles: ${availableRoles.join(', ')}, Active: ${activeRole}`)

    // Instead of returning JSON, redirect to frontend
    // This ensures the cookie is properly set in the browser
    return sendRedirect(event, 'http://localhost:3001/', 302)
})
