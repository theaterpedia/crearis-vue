/**
 * Shared user-projects + project-role-promotion hydration.
 *
 * Per CV@prod barrier-2 dispatch 2026-05-22 14:29 (feed `af21dae`):
 * Phase-A SSO bridge `buildBridgedSessionData` (server/middleware/02-auth.ts)
 * was missing the project-role-promotion that CV-local `login.post.ts` does
 * inline. Rosa (and other Odoo-SSO users) authenticated cleanly, the bridge
 * created a CV session, but session.activeRole stayed 'user' instead of being
 * promoted to 'project' when the user had project memberships — which made
 * subsequent `/api/auth/set-project` calls 403 ("Project role required").
 *
 * This helper consolidates the project-fetch (4 queries: owned · member ·
 * instructor · author) + role-resolution (availableRoles · activeRole ·
 * initialProjectId · initialProjectName) so both the CV-local login path
 * AND the Odoo-SSO bridge produce symmetric SessionData shapes.
 */

import { db as defaultDb } from '../database/init'
import type { ProjectsTableFields } from '../types/database'
import type { ProjectRecord } from './session-store'

export interface UserShape {
    id: number
    role: string
    partner_id: number | null
}

export interface UserProjectsAndRole {
    projectRecords: ProjectRecord[]
    availableRoles: string[]
    activeRole: string
    initialProjectId: string | null
    initialProjectName: string | undefined
}

interface DbLike {
    all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
}

/**
 * Fetches the user's projects (owned · member · instructor · author) and
 * resolves the session role-state per the canonical rules:
 *   · availableRoles always includes user.role; plus 'project' when the user
 *     has any project access AND user.role === 'user'.
 *   · activeRole stays user.role for 'base' and 'admin'; auto-promotes to
 *     'project' otherwise when the user has project access.
 *   · initialProjectId is the domaincode of the first project found in the
 *     priority order: owned → member → instructor → author.
 *
 * The shape returned slots straight into SessionData's project-related
 * fields (see session-store.ts).
 */
export async function hydrateUserProjectsAndRole(
    user: UserShape,
    deps: { db?: DbLike } = {},
): Promise<UserProjectsAndRole> {
    const db = (deps.db ?? defaultDb) as DbLike
    const projectRecords: ProjectRecord[] = []
    let defaultProjectId: string | null = null

    // 1. Owned projects
    const ownedProjects = (await db.all(
        `SELECT domaincode, heading
         FROM projects
         WHERE owner_id = ?
         ORDER BY heading ASC`,
        [user.id],
    )) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading'>>

    for (const proj of ownedProjects) {
        projectRecords.push({
            id: proj.domaincode,
            domaincode: proj.domaincode,
            name: proj.domaincode,
            heading: proj.heading || undefined,
            username: proj.domaincode,
            isOwner: true,
            isMember: false,
            isInstructor: false,
            isAuthor: false,
        })
    }
    if (ownedProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = ownedProjects[0].domaincode
    }

    // 2. Member projects (exclude owned · already added above)
    const memberProjects = (await db.all(
        `SELECT p.domaincode, p.heading
         FROM projects p
         INNER JOIN project_members pm ON p.id = pm.project_id
         WHERE pm.user_id = ? AND p.owner_id != ?
         ORDER BY p.heading ASC`,
        [user.id, user.id],
    )) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading'>>

    for (const proj of memberProjects) {
        projectRecords.push({
            id: proj.domaincode,
            domaincode: proj.domaincode,
            name: proj.domaincode,
            heading: proj.heading || undefined,
            username: proj.domaincode,
            isOwner: false,
            isMember: true,
            isInstructor: false,
            isAuthor: false,
        })
    }
    if (memberProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = memberProjects[0].domaincode
    }

    // 3. Instructor projects (via partner_id + partners.partner_types bit-0 = instructor)
    let instructorProjects: Array<
        Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>
    > = []
    if (user.partner_id && typeof user.partner_id === 'number') {
        try {
            instructorProjects = (await db.all(
                `SELECT DISTINCT p.domaincode, p.heading, p.owner_id
                 FROM projects p
                 INNER JOIN events e ON p.id = e.project_id
                 INNER JOIN event_instructors ei ON e.id = ei.event_id
                 INNER JOIN partners pa ON ei.instructor_id = pa.id
                 WHERE pa.id = $1 AND (pa.partner_types & 1) = 1
                 ORDER BY p.heading ASC`,
                [user.partner_id],
            )) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>>
        } catch (err) {
            console.error('[user-projects] instructor-query failed:', err)
        }
    }

    for (const proj of instructorProjects) {
        const existing = projectRecords.find((p) => p.id === proj.domaincode)
        if (existing) {
            existing.isInstructor = true
        } else {
            projectRecords.push({
                id: proj.domaincode,
                domaincode: proj.domaincode,
                name: proj.domaincode,
                heading: proj.heading || undefined,
                username: proj.domaincode,
                isOwner: false,
                isMember: false,
                isInstructor: true,
                isAuthor: false,
            })
        }
    }
    if (instructorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = instructorProjects[0].domaincode
    }

    // 4. Author projects (via posts)
    const authorProjects = (await db.all(
        `SELECT DISTINCT p.domaincode, p.heading, p.owner_id
         FROM projects p
         INNER JOIN posts po ON p.id = po.project_id
         WHERE po.author_id = ?
         ORDER BY p.heading ASC`,
        [user.id],
    )) as Array<Pick<ProjectsTableFields, 'domaincode' | 'heading' | 'owner_id'>>

    for (const proj of authorProjects) {
        const existing = projectRecords.find((p) => p.id === proj.domaincode)
        if (existing) {
            existing.isAuthor = true
        } else {
            projectRecords.push({
                id: proj.domaincode,
                domaincode: proj.domaincode,
                name: proj.domaincode,
                heading: proj.heading || undefined,
                username: proj.domaincode,
                isOwner: false,
                isMember: false,
                isInstructor: false,
                isAuthor: true,
            })
        }
    }
    if (authorProjects.length > 0 && !defaultProjectId) {
        defaultProjectId = authorProjects[0].domaincode
    }

    // Role resolution
    const availableRoles: string[] = [user.role]
    if (projectRecords.length > 0 && user.role === 'user') {
        availableRoles.push('project')
    }

    let activeRole = user.role
    let initialProjectId: string | null = null
    let initialProjectName: string | undefined = undefined
    if (
        user.role !== 'base' &&
        user.role !== 'admin' &&
        projectRecords.length > 0
    ) {
        activeRole = 'project'
        initialProjectId = defaultProjectId
        const defaultProject = projectRecords.find((p) => p.id === defaultProjectId)
        initialProjectName = defaultProject?.name
    }

    return {
        projectRecords,
        availableRoles,
        activeRole,
        initialProjectId,
        initialProjectName,
    }
}
