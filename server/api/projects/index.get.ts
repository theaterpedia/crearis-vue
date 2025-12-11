import { defineEventHandler, getQuery, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../auth/login.post'

// GET /api/projects - List all projects
// After Migration 019 Chapter 5: Returns projects with proper field structure
// - id: auto-increment INTEGER
// - domaincode: unique TEXT identifier
// - name: project title/display name
// - heading: legacy field for backward compatibility
export default defineEventHandler(async (event) => {

    try {
        const query = getQuery(event)

        // Check for ?my=true - returns only projects user is owner/member of
        if (query.my === 'true') {
            const sessionId = getCookie(event, 'sessionId')
            console.log('[PROJECTS] my=true, sessionId:', sessionId ? 'found' : 'missing')
            if (!sessionId) {
                return [] // Not authenticated, return empty
            }

            const session = sessions.get(sessionId)
            console.log('[PROJECTS] session:', session ? `userId=${session.userId}` : 'not found')
            if (!session || session.expiresAt < Date.now()) {
                return [] // Session expired, return empty
            }

            // Query projects where user is owner OR member
            console.log('[PROJECTS] Querying for userId:', session.userId)
            const userProjects = await db.all(`
                SELECT DISTINCT p.*, 
                    CASE 
                        WHEN p.owner_id = $1 THEN 'owner'
                        ELSE COALESCE(pm.role, 'member')
                    END as "_userRole"
                FROM projects p
                LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $2
                WHERE p.owner_id = $3 OR pm.user_id = $4
                ORDER BY p.heading ASC, p.name ASC
            `, [session.userId, session.userId, session.userId, session.userId])

            console.log('[PROJECTS] Found projects:', userProjects.length)
            return userProjects
        }

        let sql = 'SELECT * FROM projects WHERE 1=1'
        const params: any[] = []

        // Filter by status value (bitmask: 1=NEW, 8=DEMO, 64=DRAFT, 256=REVIEW, 512=CONFIRMED, etc.)
        // status_lt: less than (e.g., status_lt=64 returns status < 64)
        // status_eq: equal (e.g., status_eq=64 returns status = 64)
        // status_gt: greater than (e.g., status_gt=64 returns status > 64)
        if (query.status_lt !== undefined) {
            const statusValue = Number(query.status_lt)
            sql += ` AND status < ?`
            params.push(statusValue)
        }
        if (query.status_eq !== undefined) {
            const statusValue = Number(query.status_eq)
            sql += ` AND status = ?`
            params.push(statusValue)
        }
        if (query.status_gt !== undefined) {
            const statusValue = Number(query.status_gt)
            sql += ` AND status > ?`
            params.push(statusValue)
        }

        // Filter by is_regio (for onboarding avatar context selection)
        if (query.is_regio === 'true') {
            sql += ` AND is_regio = true`
        }

        sql += ' ORDER BY created_at DESC'

        // Get all projects ordered by created date
        const rawProjects = await db.all(sql, params)

        // Return projects array directly (consistent with events/posts/instructors)
        return rawProjects
    } catch (error) {
        console.error('Error fetching projects:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch projects'
        })
    }
})
