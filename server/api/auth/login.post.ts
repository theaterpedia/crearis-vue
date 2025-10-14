import { defineEventHandler, readBody, createError, setCookie, getCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import db from '../../database/db'

// In-memory session store (for development - use Redis in production)
const sessions = new Map<string, { userId: string; username: string; role: string; expiresAt: number }>()

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

    // Find user
    const user = db.prepare(`
    SELECT id, username, password_hash, role
    FROM projects
    WHERE username = ?
  `).get(username) as { id: string; username: string; password_hash: string; role: string } | undefined

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Invalid credentials'
        })
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash)

    if (!validPassword) {
        throw createError({
            statusCode: 401,
            message: 'Invalid credentials'
        })
    }

    // Create session
    const sessionId = nanoid(32)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    sessions.set(sessionId, {
        userId: user.id,
        username: user.username,
        role: user.role,
        expiresAt
    })

    // Set session cookie
    setCookie(event, 'sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
    })

    return {
        success: true,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    }
})

// Export for use in other endpoints
export { sessions }
