import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { PostsTableFields } from '../../types/database'

// POST /api/posts - Create new post
// After Migration 019 Chapter 3B:
// - posts.id is now INTEGER (auto-increment), not provided by client
// - posts.xmlid can optionally store old TEXT id
// - posts.project_id stores INTEGER FK to projects.id
// - body.project accepts domaincode (TEXT) for lookup
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // Validate required fields
        if (!body.name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required field: name'
            })
        }

        // Lookup project_id if project domaincode provided
        let projectId = null
        if (body.project) {
            const project = await db.get('SELECT id FROM projects WHERE domaincode = ?', [body.project])
            if (project) {
                projectId = project.id
            }
        }

        // Prepare data with only valid table fields
        const postData: Partial<PostsTableFields> = {
            xmlid: body.xmlid || body.id || null, // Store old id as xmlid
            name: body.name,
            subtitle: body.subtitle || null,
            teaser: body.teaser || null,
            cimg: body.cimg || null,
            cimg_id: body.cimg_id || null,
            post_date: body.post_date || null,
            isbase: body.isbase || 0,
            project_id: projectId,
            template: body.template || null,
            public_user: body.public_user || null
        }

        // Insert post (id is auto-generated)
        const sql = `
            INSERT INTO posts (
                xmlid, name, subtitle, teaser, cimg, cimg_id, post_date,
                isbase, project_id, template, public_user
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            postData.xmlid,
            postData.name,
            postData.subtitle,
            postData.teaser,
            postData.cimg,
            postData.cimg_id,
            postData.post_date,
            postData.isbase,
            postData.project_id,
            postData.template,
            postData.public_user
        ])

        // Extract the new post ID from the result
        // PostgreSQL: result.rows[0].id, SQLite: result.lastID
        const newId = result.rows?.[0]?.id || result.lastID

        if (!newId) {
            throw new Error('Failed to get new post ID')
        }

        // Get the created post with domaincode
        const created = await db.get(`
            SELECT 
                p.*,
                pr.domaincode AS domaincode
            FROM posts p
            LEFT JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ?
        `, [newId])

        return created
    } catch (error) {
        console.error('Error creating post:', error)

        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: 'Post with this xmlid already exists'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create post'
        })
    }
})
