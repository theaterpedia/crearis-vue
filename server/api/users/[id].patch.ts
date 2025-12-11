import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../database/init'

/**
 * PATCH /api/users/:id
 * Updates an existing user
 * Used by AdminActionUsersPanel to alter user data
 * 
 * Database: PostgreSQL (default) - Uses unified adapter interface
 * Note: The db adapter automatically converts ? placeholders to $1, $2 for PostgreSQL
 */
export default defineEventHandler(async (event) => {
    const rawId = getRouterParam(event, 'id')

    // Decode the URL-encoded parameter (getRouterParam does NOT auto-decode)
    const id = rawId ? decodeURIComponent(rawId) : null

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required'
        })
    }

    const body = await readBody(event) as Record<string, any>

    try {
        // Check if user exists
        const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id])
        if (!existingUser) {
            throw createError({
                statusCode: 404,
                message: 'User not found'
            })
        }

        // Build update query dynamically based on provided fields
        const updateFields: string[] = []
        const params: any[] = []

        // Fields that can be updated
        const allowedFields = ['username', 'password', 'role', 'partner_id', 'status_val', 'img_id']

        for (const field of allowedFields) {
            if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
                // Special handling for password - hash it
                if (field === 'password') {
                    updateFields.push('password_hash = crypt(?, gen_salt(\'bf\'))')
                    params.push(body[field])
                } else {
                    updateFields.push(`${field} = ?`)
                    params.push(body[field])
                }
            }
        }

        if (updateFields.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        // Add the id as the last parameter for WHERE clause
        params.push(id)

        const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `

        await db.run(updateQuery, params)

        // Fetch and return the updated user
        const updatedUser = await db.get(`
            SELECT 
                id,
                username,
                role,
                partner_id,
                img_id,
                img_show,
                img_thumb,
                img_square,
                img_wide,
                img_vert,
                created_at
            FROM users
            WHERE id = ?
        `, [id])

        return updatedUser
    } catch (error) {
        console.error('Error updating user:', error)

        // Re-throw if already a H3 error
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update user'
        })
    }
})
