import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { PostsTableFields } from '../../types/database'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // Validate required fields
        if (!body.id || !body.name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: id, name'
            })
        }

        // Prepare data with only valid table fields
        const postData: Partial<PostsTableFields> = {
            id: body.id,
            name: body.name,
            subtitle: body.subtitle || null,
            teaser: body.teaser || null,
            cimg: body.cimg || null,
            post_date: body.post_date || null,
            isbase: body.isbase || 0,
            project: body.project || null,
            template: body.template || null,
            public_user: body.public_user || null
        }

        // Insert post
        const sql = `
      INSERT INTO posts (
        id, name, subtitle, teaser, cimg, post_date,
        isbase, project, template, public_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

        await db.run(sql, [
            postData.id,
            postData.name,
            postData.subtitle,
            postData.teaser,
            postData.cimg,
            postData.post_date,
            postData.isbase,
            postData.project,
            postData.template,
            postData.public_user
        ])

        // Return the created post
        const created = await db.get('SELECT * FROM posts WHERE id = ?', [body.id])

        return created
    } catch (error) {
        console.error('Error creating post:', error)

        // Check for unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            throw createError({
                statusCode: 409,
                message: 'Post with this ID already exists'
            })
        }

        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create post'
        })
    }
})
