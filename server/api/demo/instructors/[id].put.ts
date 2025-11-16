import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        const body = await readBody(event) as any

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Instructor ID is required'
            })
        }

        // Update instructor in database
        const result = await db.run(
            `UPDATE instructors SET 
        name = ?,
        description = ?,
        phone = ?,
        email = ?,
        city = ?,
        cimg = ?,
        md = ?,
        project_id = ?,
        img_id = ?,
        status_id = ?
      WHERE id = ?`,
            [
                body.name,
                body.description,
                body.phone,
                body.email,
                body.city,
                body.cimg,
                body.content || body.md,
                body.project_id,
                body.img_id,
                body.status_id,
                id
            ]
        )

        // Fetch and return the updated instructor
        const updatedInstructor = await db.get('SELECT * FROM instructors WHERE id = ?', [id])

        if (!updatedInstructor) {
            throw createError({
                statusCode: 404,
                message: 'Instructor not found'
            })
        }

        return {
            success: true,
            instructor: updatedInstructor
        }
    } catch (error: any) {
        console.error('Error updating instructor:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to update instructor'
        })
    }
})
