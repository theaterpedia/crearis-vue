import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

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

        // Insert post
        const sql = `
      INSERT INTO posts (
        id, name, teaser, content, cimg, date_published,
        isbase, project, template, public_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

        await db.run(sql, [
            body.id,
            body.name,
            body.teaser || null,
            body.content || null,
            body.cimg || null,
            body.date_published || null,
            body.isbase || 0,
            body.project || null,
            body.template || null,
            body.public_user || null
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
