import { defineEventHandler, readBody, createError, setCookie, getCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../../database/init'
import type { UsersTableFields, ProjectsTableFields } from '../../types/database'
import { getStatusByName } from '../../utils/status-helpers'

interface ProjectRecord {
    id: string  // Legacy: stores domaincode for backward compatibility
    domaincode: string  // NEW: explicit domaincode field (same as id for now)
    name: string  // domaincode
    heading?: string  // heading from database
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}

interface SessionData {
    userId: number
    sysmail: string  // Added for permission checks
    username: string
    status: number | null  // User status for onboarding flow
    partner_id: number | null  // Linked partner for onboarding
    img_id: number | null  // Avatar image for onboarding
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
    // Detect if user has project role access based on ownership, membership, instructor, or author status

    const projectRecords: ProjectRecord[] = []
    let defaultProjectId: string | null = null

    // 1. Find owned projects
    // After Migration 019: projects.id is INTEGER, projects.domaincode is TEXT (old id)
    console.log('[LOGIN] Finding owned projects for user', user.id)
    const ownedProjects = await db.all(`
        SELECT domaincode, heading
        FROM projects
        WHERE owner_id = ?
        ORDER BY heading ASC
    `, [user.id]) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading'>>
    console.log('[LOGIN] Found owned projects:', ownedProjects.length)

    for (const proj of ownedProjects) {
        projectRecords.push({
            id: proj.domaincode,  // Legacy: session stores domaincode as 'id'
            domaincode: proj.domaincode,  // NEW: explicit domaincode field
            name: proj.domaincode,  // Frontend 'name' = database 'domaincode'
            heading: proj.heading || undefined,  // Include heading separately (handle null)
            username: proj.domaincode,  // Use domaincode as username fallback
            isOwner: true,
            isMember: false,
            isInstructor: false,
            isAuthor: false
        })
    }

    // Set default to first owned project
    if (ownedProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = ownedProjects[0].domaincode
    }

    // 2. Find member projects
    console.log('[LOGIN] Finding member projects')
    const memberProjects = await db.all(`
        SELECT p.domaincode, p.heading
        FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ? AND p.owner_id != ?
        ORDER BY p.heading ASC
    `, [user.id, user.id]) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading'>>
    console.log('[LOGIN] Found member projects:', memberProjects.length)

    for (const proj of memberProjects) {
        projectRecords.push({
            id: proj.domaincode,  // Legacy: session stores domaincode as 'id'
            domaincode: proj.domaincode,  // NEW: explicit domaincode field
            name: proj.domaincode,  // Frontend 'name' = database 'domaincode'
            heading: proj.heading || undefined,  // Include heading separately (handle null)
            username: proj.domaincode,  // Use domaincode as username fallback
            isOwner: false,
            isMember: true,
            isInstructor: false,
            isAuthor: false
        })
    }

    // Set default to first member project if no owned projects
    if (memberProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = memberProjects[0].domaincode
    }

    // 3. Find projects where user is instructor (via events)
    // Note: Check if user has partner_id set, then find events taught by that partner (as instructor)
    // Skip this query if user has no partner_id or if there are no instructors yet
    console.log('[LOGIN] Finding instructor projects')
    let instructorProjects: Array<Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>> = []

    if (user.partner_id && typeof user.partner_id === 'number') {
        try {
            // Join through partners table - partner must have instructor flag (partner_types & 1 = 1)
            instructorProjects = await db.all(`
                SELECT DISTINCT p.domaincode, p.heading, p.owner_id
                FROM projects p
                INNER JOIN events e ON p.id = e.project_id
                INNER JOIN event_instructors ei ON e.id = ei.event_id
                INNER JOIN partners pa ON ei.instructor_id = pa.id
                WHERE pa.id = $1 AND (pa.partner_types & 1) = 1
                ORDER BY p.heading ASC
            `, [user.partner_id]) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>>
        } catch (error) {
            console.error('[LOGIN] Error finding instructor projects:', error)
            // Continue without instructor projects if query fails
        }
    }
    console.log('[LOGIN] Found instructor projects:', instructorProjects.length)

    for (const proj of instructorProjects) {
        // Check if already in records (as owner or member)
        const existing = projectRecords.find(p => p.id === proj.domaincode)
        if (existing) {
            existing.isInstructor = true
        } else {
            projectRecords.push({
                id: proj.domaincode,  // Legacy: session stores domaincode as 'id'
                domaincode: proj.domaincode,  // NEW: explicit domaincode field
                name: proj.domaincode,  // Frontend 'name' = database 'domaincode'
                heading: proj.heading || undefined,  // Include heading separately (handle null)
                username: proj.domaincode,  // Use domaincode as username fallback
                isOwner: false,
                isMember: false,
                isInstructor: true,
                isAuthor: false
            })
        }
    }

    // Set default to first instructor project if no owned/member projects
    if (instructorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = instructorProjects[0].domaincode
    }

    // 4. Find projects where user is author (via posts)
    console.log('[LOGIN] Finding author projects')
    const authorProjects = await db.all(`
        SELECT DISTINCT p.domaincode, p.heading, p.owner_id
        FROM projects p
        INNER JOIN posts po ON p.id = po.project_id
        WHERE po.author_id = ?
        ORDER BY p.heading ASC
    `, [user.id]) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>>
    console.log('[LOGIN] Found author projects:', authorProjects.length)

    for (const proj of authorProjects) {
        // Check if already in records
        const existing = projectRecords.find(p => p.id === proj.domaincode)
        if (existing) {
            existing.isAuthor = true
        } else {
            projectRecords.push({
                id: proj.domaincode,  // Legacy: session stores domaincode as 'id'
                domaincode: proj.domaincode,  // NEW: explicit domaincode field
                name: proj.domaincode,  // Frontend 'name' = database 'domaincode'
                heading: proj.heading || undefined,  // Include heading separately (handle null)
                username: proj.domaincode,  // Use domaincode as username fallback
                isOwner: false,
                isMember: false,
                isInstructor: false,
                isAuthor: true
            })
        }
    }

    // Set default to first author project if no other projects found
    if (authorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = authorProjects[0].domaincode
    }

    // Build available roles array
    const availableRoles: string[] = [user.role]

    // Add 'project' role if user has any project access
    if (projectRecords.length > 0 && user.role === 'user') {
        availableRoles.push('project')
    }

    // Determine active role
    // - If user is 'admin', always use 'admin' (admins don't switch to project role)
    // - If user is 'base', always use 'base'
    // - If user has project access, try to activate 'project' role by default
    // - Otherwise use user.role
    let activeRole = user.role
    let initialProjectId: string | null = null
    let initialProjectName: string | undefined = undefined

    if (user.role !== 'base' && user.role !== 'admin' && projectRecords.length > 0) {
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
