import { defineEventHandler, readBody, createError, setCookie, getCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'

// In-memory session store (for development - use Redis in production)
const sessions = new Map<string, {
    userId: string
    username: string
    availableRoles: string[]  // All roles user can access
    activeRole: string        // Currently active role
    projectId?: string
    projectName?: string
    expiresAt: number
}>()

// Clean up expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [sessionId, session] of sessions.entries()) {
        if (session.expiresAt < now) {
            sessions.delete(sessionId)
        }
    }
}, 5 * 60 * 1000)

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const { username, password } = body

    if (!username || !password) {
        throw createError({
            statusCode: 400,
            message: 'Username and password are required'
        })
    }

    // Find user from users table
    const user = await db.get(`
    SELECT id, username, password, role
    FROM users
    WHERE username = ?
  `, [username]) as { id: string; username: string; password: string; role: string } | undefined

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

    // Check if there's a matching project for this user
    const project = await db.get(`
        SELECT id, name, type, role
        FROM projects
        WHERE username = ?
    `, [username]) as { id: string; name: string; type: string; role: string } | undefined

    // Build available roles array
    const availableRoles: string[] = [user.role]

    // If user has 'user' role and a project exists, add 'project' role
    if (user.role === 'user' && project) {
        availableRoles.push('project')
    }

    // Determine active role
    // - If user is 'base', always use 'base'
    // - If user has multiple roles, default to first one (user.role)
    const activeRole = user.role === 'base' ? 'base' : user.role

    // Create session
    const sessionId = nanoid(32)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Build session data
    const sessionData: {
        userId: string
        username: string
        availableRoles: string[]
        activeRole: string
        projectId?: string
        projectName?: string
        expiresAt: number
    } = {
        userId: user.id,
        username: user.username,
        availableRoles,
        activeRole,
        expiresAt
    }

    // If project found, add project info
    if (project) {
        sessionData.projectId = project.id
        sessionData.projectName = project.name
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
    const responseUser: {
        id: string
        username: string
        availableRoles: string[]
        activeRole: string
        projectId?: string
        projectName?: string
    } = {
        id: user.id,
        username: user.username,
        availableRoles,
        activeRole
    }

    // Add project info if available
    if (project) {
        responseUser.projectId = project.id
        responseUser.projectName = project.name
    }

    return {
        success: true,
        user: responseUser
    }
})

// Export for use in other endpoints
export { sessions }
