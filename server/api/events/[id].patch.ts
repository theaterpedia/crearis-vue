import { defineEventHandler, getRouterParam, createError, readBody, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'

// PATCH /api/events/:id - Update event fields
// Supports updating: name, teaser, status, dtags, ctags, ttags, date_begin, date_end, etc.
// Authorization: Must be event owner, project owner, or project member
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    try {
        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Event ID is required'
            })
        }

        // Verify authentication
        const sessionId = getCookie(event, 'sessionId')
        if (!sessionId) {
            throw createError({
                statusCode: 401,
                message: 'Authentication required'
            })
        }

        const session = sessions.get(sessionId)
        if (!session || session.expiresAt < Date.now()) {
            throw createError({
                statusCode: 401,
                message: 'Session expired'
            })
        }

        // Get event with project info
        const eventData = await db.get(`
            SELECT e.*, pr.owner_id as project_owner_id
            FROM events e
            LEFT JOIN projects pr ON e.project_id = pr.id
            WHERE e.id = ?
        `, [id]) as any

        if (!eventData) {
            throw createError({
                statusCode: 404,
                message: 'Event not found'
            })
        }

        // Check authorization
        // Allow: event creator, project owner, or project member (configrole=8)
        const isEventCreator = eventData.user_id === session.userId
        const isProjectOwner = eventData.project_owner_id === session.userId

        // Check if user is a project member with edit rights (configrole=8)
        let isProjectMemberWithEditRights = false
        if (eventData.project_id) {
            const membership = await db.get(
                'SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?',
                [eventData.project_id, session.userId]
            ) as { configrole: number } | undefined
            // Only full members (configrole=8) can edit any event
            isProjectMemberWithEditRights = membership?.configrole === 8
        }

        if (!isEventCreator && !isProjectOwner && !isProjectMemberWithEditRights) {
            throw createError({
                statusCode: 403,
                message: 'Not authorized to update this event'
            })
        }

        // Read update body
        const body = await readBody(event) as Record<string, any>

        // Map creator_id to user_id (database column)
        if (body.creator_id !== undefined) {
            body.user_id = body.creator_id
            delete body.creator_id
        }

        // Build update query dynamically
        // Content fields
        const allowedFields = [
            'name', 'teaser', 'md', 'html',
            'date_begin', 'date_end', 'event_type',
            'template', 'header_type', 'header_size', 'lang',
            'location', 'user_id',
            'cimg', 'img_id', 'img_show',
            'seats_max', 'seats_available',
            // Tag fields (integer bitmasks)
            'status', 'dtags', 'ctags', 'ttags', 'rtags',
            // Visibility (usually set by triggers, but allow manual override)
            'r_anonym', 'r_partner', 'r_participant', 'r_member', 'r_owner'
        ]
        const updates: string[] = []
        const values: any[] = []

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates.push(`${field} = ?`)
                values.push(body[field])
            }
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        // Add updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP')

        // Add event id for WHERE clause
        values.push(eventData.id)

        // Execute update
        await db.run(
            `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
            values
        )

        // Return updated event with domaincode and related names
        const updatedEvent = await db.get(`
            SELECT e.*, e.user_id AS creator_id, pr.domaincode,
                   loc.name AS location_name,
                   creator.username AS creator_name
            FROM events e
            LEFT JOIN projects pr ON e.project_id = pr.id
            LEFT JOIN partners loc ON e.location = loc.id
            LEFT JOIN users creator ON e.user_id = creator.id
            WHERE e.id = ?
        `, [eventData.id])

        console.log(`[PATCH /api/events/${id}] Updated by user ${session.userId}:`, Object.keys(body))

        return updatedEvent
    } catch (error) {
        console.error('Error updating event:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update event'
        })
    }
})
