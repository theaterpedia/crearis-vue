import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/db-new'

interface CreateReleaseBody {
    version: string
    description?: string
    state?: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateReleaseBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        // Validate required fields
        if (!body.version || body.version.trim() === '') {
            throw createError({
                statusCode: 400,
                message: 'Version is required'
            })
        }

        // Validate version format (e.g., "0.1", "1.0", "2.15")
        const versionMatch = body.version.trim().match(/^(\d+)\.(\d+)$/)
        if (!versionMatch) {
            throw createError({
                statusCode: 400,
                message: 'Invalid version format. Must be: major.minor (e.g., 0.1, 1.0, 2.15)'
            })
        }

        const version_major = parseInt(versionMatch[1], 10)
        const version_minor = parseInt(versionMatch[2], 10)

        // Check if version already exists
        const existingRelease = await db.get('SELECT id FROM releases WHERE version = ?', [body.version.trim()])
        if (existingRelease) {
            throw createError({
                statusCode: 409,
                message: 'Release version already exists'
            })
        }

        // Validate state if provided
        if (body.state && !['idea', 'draft', 'final', 'trash'].includes(body.state)) {
            throw createError({
                statusCode: 400,
                message: 'Invalid state. Must be: idea, draft, final, or trash'
            })
        }

        const id = nanoid()
        const now = new Date().toISOString()

        await db.run(
            `INSERT INTO releases (
                id,
                version,
                version_major,
                version_minor,
                description,
                state,
                release_date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                body.version.trim(),
                version_major,
                version_minor,
                body.description || null,
                body.state || 'idea',
                body.release_date || null,
                now,
                now
            ]
        )

        const release = await db.get('SELECT * FROM releases WHERE id = ?', [id])

        return {
            success: true,
            release,
            message: 'Release created successfully'
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to create release',
            data: error
        })
    }
})
