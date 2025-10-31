import { defineEventHandler, createError, getQuery } from 'h3'
import { db } from '../../database/init'

/**
 * GET /api/images
 * Returns all images from the images table
 * Supports filtering by:
 * - domaincode: filter by project
 * - owner_id: filter by owner
 * - status_id: filter by status
 * - provider: filter by provider
 * - is_public: filter by public flag
 * - tags: filter by bitmatrix tags (bitwise AND)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        let sql = `
            SELECT 
                i.*,
                u.username as owner_username,
                s.name as status_name
            FROM images i
            LEFT JOIN users u ON i.owner_id = u.id
            LEFT JOIN status s ON i.status_id = s.id AND s.table = 'images'
        `
        const params: any[] = []
        const conditions: string[] = []

        // Filter by domaincode (project)
        if (query.domaincode) {
            conditions.push('i.domaincode = ?')
            params.push(query.domaincode)
        }

        // Filter by owner_id
        if (query.owner_id) {
            conditions.push('i.owner_id = ?')
            params.push(Number(query.owner_id))
        }

        // Filter by status_id
        if (query.status_id) {
            conditions.push('i.status_id = ?')
            params.push(Number(query.status_id))
        }

        // Filter by provider
        if (query.provider) {
            conditions.push('i.provider = ?')
            params.push(Number(query.provider))
        }

        // Filter by is_public
        if (query.is_public !== undefined) {
            conditions.push('i.is_public = ?')
            params.push(query.is_public === 'true' || query.is_public === true)
        }

        // Filter by tags (bitwise AND)
        if (query.tags) {
            const tagsBits = Number(query.tags)
            conditions.push('(i.tags & ?) = ?')
            params.push(tagsBits, tagsBits)
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ')
        }

        sql += ' ORDER BY i.created_at DESC'

        const images = await db.all(sql, params)

        return images
    } catch (error) {
        console.error('Error fetching images:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch images'
        })
    }
})
