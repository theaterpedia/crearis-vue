import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { PostsTableFields } from '../../types/database'

// POST /api/posts - Create new post
// After Migration 019 Chapter 3B:
// - posts.id is now INTEGER (auto-increment), not provided by client
// - posts.xmlid can optionally store old TEXT id
// - posts.project_id stores INTEGER FK to projects.id
// - body.project accepts domaincode (TEXT) for lookup
// After Migration 050:
// - posts.creator_id stores INTEGER FK to users.id (record creator)
// - creator_id is set from body.creator_id (user who creates the post)
// After v0.2final:
// - Added support for tag fields: status, dtags, ctags, ttags, rtags
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
            post_date: body.post_date || null,
            isbase: body.isbase || 0,
            project_id: projectId,
            template: body.template || null,
            public_user: body.public_user || null,
            img_id: body.img_id || null,
            creator_id: body.creator_id || null,  // Record creator (user who creates the post)
            // Tag fields (integer bitmasks)
            status: body.status ?? null,
            dtags: body.dtags ?? null,
            ctags: body.ctags ?? null,
            ttags: body.ttags ?? null,
            rtags: body.rtags ?? null
        }

        // Insert post (id is auto-generated)
        const sql = `
            INSERT INTO posts (
                xmlid, name, subtitle, teaser, cimg, post_date,
                isbase, project_id, template, public_user, img_id, creator_id,
                status, dtags, ctags, ttags, rtags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            postData.xmlid,
            postData.name,
            postData.subtitle,
            postData.teaser,
            postData.cimg,
            postData.post_date,
            postData.isbase,
            postData.project_id,
            postData.template,
            postData.public_user,
            postData.img_id,
            postData.creator_id,
            postData.status,
            postData.dtags,
            postData.ctags,
            postData.ttags,
            postData.rtags
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
    } catch (error: any) {
        console.error('Error creating post:', error)

        // Check for unique constraint violation (SQLite and PostgreSQL)
        const isDuplicateKey =
            (error instanceof Error && error.message.includes('UNIQUE constraint failed')) ||
            (error?.code === '23505') || // PostgreSQL unique violation
            (error?.constraint === 'posts_xmlid_key')

        if (isDuplicateKey) {
            throw createError({
                statusCode: 409,
                message: 'duplicate key value violates unique constraint'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create post'
        })
    }
})
