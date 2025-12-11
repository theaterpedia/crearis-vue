import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

// Body type for creating a partner (instructor role)
interface CreatePartnerBody {
    xmlid: string
    name: string
    email?: string | null
    phone?: string | null
    city?: string | null
    cimg?: string | null
    img_id?: number | null
    isbase?: number
    status?: number
    partner_types?: number  // Default 1 for instructor
}

// POST /api/public-users - Create a new partner with instructor role
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreatePartnerBody>(event)

        // Validate body exists
        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

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

        // Check for duplicate xmlid in partners table
        const existing = await db.get('SELECT id FROM partners WHERE xmlid = $1', [body.xmlid])
        if (existing) {
            throw createError({
                statusCode: 409,
                message: `Partner with xmlid '${body.xmlid}' already exists`
            })
        }

        // Insert new partner with instructor type (partner_types = 1)
        // status=8 is DEMO status (visible in system)
        const result = await db.run(`
            INSERT INTO partners (xmlid, name, email, phone, city, cimg, img_id, isbase, status, partner_types)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            body.xmlid,
            body.name,
            body.email || null,
            body.phone || null,
            body.city || null,
            body.cimg || null,
            body.img_id || null,
            body.isbase ?? 0,
            body.status ?? 8,  // Default to DEMO status (8)
            body.partner_types ?? 1  // Default to instructor type
        ])

        // Get the created partner
        const insertedId = result.rows?.[0]?.id || result.lastID
        const partner = await db.get('SELECT * FROM partners WHERE id = $1', [insertedId])

        console.log('✅ Created partner (instructor):', partner?.xmlid)

        return partner
    } catch (error: any) {
        console.error('Error creating partner:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create partner'
        })
    }
})
