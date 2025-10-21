import { defineEventHandler, readBody, createError, setCookie, getCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'

interface ProjectRecord {
    id: string
    name: string
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}

interface SessionData {
    userId: string
    username: string
    availableRoles: string[]
    activeRole: string
    projectId: string | null
    projectName?: string
    projects?: ProjectRecord[]
    capabilities?: Record<string, Set<string>>
    expiresAt: number
}

// In-memory session store (for development - use Redis in production)
export const sessions = new Map<string, SessionData>()

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

    // === PROJECT ROLE DETECTION ===
    // Detect if user has project role access based on ownership, membership, instructor, or author status

    const projectRecords: ProjectRecord[] = []
    let defaultProjectId: string | null = null

    // 1. Find owned projects
    const ownedProjects = await db.all(`
        SELECT id, username, name
        FROM projects
        WHERE owner_id = ?
        ORDER BY name ASC
    `, [user.id]) as Array<{ id: string; username: string; name: string }>

    for (const proj of ownedProjects) {
        projectRecords.push({
            id: proj.id,
            name: proj.name,
            username: proj.username,
            isOwner: true,
            isMember: false,
            isInstructor: false,
            isAuthor: false
        })
    }

    // Set default to first owned project
    if (ownedProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = ownedProjects[0].id
    }

    // 2. Find member projects
    const memberProjects = await db.all(`
        SELECT p.id, p.username, p.name
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ? AND p.owner_id != ?
        ORDER BY p.name ASC
    `, [user.id, user.id]) as Array<{ id: string; username: string; name: string }>

    for (const proj of memberProjects) {
        projectRecords.push({
            id: proj.id,
            name: proj.name,
            username: proj.username,
            isOwner: false,
            isMember: true,
            isInstructor: false,
            isAuthor: false
        })
    }

    // Set default to first member project if no owned projects
    if (memberProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = memberProjects[0].id
    }

    // 3. Find projects where user is instructor (via events)
    // Note: Check if user has instructor_id set, then find events taught by that instructor
    const instructorProjects = await db.all(`
        SELECT DISTINCT p.id, p.username, p.name, p.owner_id
        FROM projects p
        INNER JOIN events e ON p.id = e.project
        INNER JOIN event_instructors ei ON e.id = ei.event_id
        INNER JOIN users u ON u.instructor_id = ei.instructor_id
        WHERE u.id = ?
        ORDER BY p.name ASC
    `, [user.id]) as Array<{ id: string; username: string; name: string; owner_id: string }>

    for (const proj of instructorProjects) {
        // Check if already in records (as owner or member)
        const existing = projectRecords.find(p => p.id === proj.id)
        if (existing) {
            existing.isInstructor = true
        } else {
            projectRecords.push({
                id: proj.id,
                name: proj.name,
                username: proj.username,
                isOwner: false,
                isMember: false,
                isInstructor: true,
                isAuthor: false
            })
        }
    }

    // Set default to first instructor project if no owned/member projects
    if (instructorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = instructorProjects[0].id
    }

    // 4. Find projects where user is author (via posts)
    const authorProjects = await db.all(`
        SELECT DISTINCT p.id, p.username, p.name, p.owner_id
        FROM projects p
        INNER JOIN posts po ON p.id = po.project
        WHERE po.author_id = ?
        ORDER BY p.name ASC
    `, [user.id]) as Array<{ id: string; username: string; name: string; owner_id: string }>

    for (const proj of authorProjects) {
        // Check if already in records
        const existing = projectRecords.find(p => p.id === proj.id)
        if (existing) {
            existing.isAuthor = true
        } else {
            projectRecords.push({
                id: proj.id,
                name: proj.name,
                username: proj.username,
                isOwner: false,
                isMember: false,
                isInstructor: false,
                isAuthor: true
            })
        }
    }

    // Set default to first author project if no other projects found
    if (authorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = authorProjects[0].id
    }

    // Build available roles array
    const availableRoles: string[] = [user.role]

    // Add 'project' role if user has any project access
    if (projectRecords.length > 0 && user.role === 'user') {
        availableRoles.push('project')
    }

    // Determine active role
    // - If user is 'base', always use 'base'
    // - If user has project access, try to activate 'project' role by default
    // - Otherwise use user.role
    let activeRole = user.role
    let initialProjectId: string | null = null
    let initialProjectName: string | undefined = undefined

    if (user.role !== 'base' && projectRecords.length > 0) {
        // Try to activate project role with default project
        activeRole = 'project'
        initialProjectId = defaultProjectId
        const defaultProject = projectRecords.find(p => p.id === defaultProjectId)
        initialProjectName = defaultProject?.name
    }

    // Create session
    const sessionId = nanoid(32)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Build session data
    const sessionData: SessionData = {
        userId: user.id,
        username: user.username,
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
        username: user.username,
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
