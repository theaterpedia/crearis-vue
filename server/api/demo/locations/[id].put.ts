import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../database/init'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        const body = await readBody(event) as any

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Location ID is required'
            })
        }

        // Update location in database
        const result = await db.run(
            `UPDATE locations SET 
        name = ?,
        street = ?,
        zip = ?,
        city = ?,
        phone = ?,
        email = ?,
        cimg = ?,
        md = ?,
        project_id = ?,
        img_id = ?,
        status_id = ?
      WHERE id = ?`,
            [
                body.name,
                body.street,
                body.zip,
                body.city,
                body.phone,
                body.email,
                body.cimg,
                body.content || body.md,
                body.project_id,
                body.img_id,
                body.status_id,
                id
            ]
        )

        // Fetch and return the updated location
        const updatedLocation = await db.get('SELECT * FROM locations WHERE id = ?', [id])

        if (!updatedLocation) {
            throw createError({
                statusCode: 404,
                message: 'Location not found'
            })
        }

        return {
            success: true,
            location: updatedLocation
        }
    } catch (error: any) {
        console.error('Error updating location:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to update location'
        })
    }
})
