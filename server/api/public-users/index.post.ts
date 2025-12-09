import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

// POST /api/public-users - Create a new instructor
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // Validate required fields
        if (!body.xmlid) {
            throw createError({
                statusCode: 400,
                message: 'xmlid is required'
            })
        }

        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: 'name is required'
            })
        }

        // Check for duplicate xmlid
        const existing = await db.get('SELECT id FROM instructors WHERE xmlid = ?', [body.xmlid])
        if (existing) {
            throw createError({
                statusCode: 409,
                message: `Instructor with xmlid '${body.xmlid}' already exists`
            })
        }

        // Insert new instructor
        // status=8 is DEMO status (visible in system)
        // Use RETURNING id to get the inserted ID for PostgreSQL
        const result = await db.run(`
            INSERT INTO instructors (xmlid, name, cimg, img_id, isbase, status)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id
        `, [
            body.xmlid,
            body.name,
            body.cimg || null,
            body.img_id || null,
            body.isbase ?? 0,
            body.status ?? 8  // Default to DEMO status (8)
        ])

        // Get the created instructor - use the returned id from RETURNING clause
        const insertedId = result.rows?.[0]?.id || result.lastID
        const instructor = await db.get('SELECT * FROM instructors WHERE id = ?', [insertedId])

        console.log('✅ Created instructor:', instructor?.xmlid)

        return instructor
    } catch (error: any) {
        console.error('Error creating instructor:', error)
        
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create instructor'
        })
    }
})
