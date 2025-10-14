import { defineEventHandler, readBody, createError } from 'h3'
import db from '../../database/db'

interface UpdateReleaseBody {
    version?: string
    description?: string
    state?: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string | null
}

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Release ID is required'
            })
        }

        // Check if release exists
        const existingRelease = db.prepare('SELECT * FROM releases WHERE id = ?').get(id)
        if (!existingRelease) {
            throw createError({
                statusCode: 404,
                message: 'Release not found'
            })
        }

        const body = await readBody<UpdateReleaseBody>(event)

        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

        const updates: string[] = []
        const values: any[] = []

        if (body.version !== undefined) {
            if (body.version.trim() === '') {
                throw createError({
                    statusCode: 400,
                    message: 'Version cannot be empty'
                })
            }

            // Validate version format
            const versionMatch = body.version.trim().match(/^(\d+)\.(\d+)$/)
            if (!versionMatch) {
                throw createError({
                    statusCode: 400,
                    message: 'Invalid version format. Must be: major.minor (e.g., 0.1, 1.0, 2.15)'
                })
            }

            const version_major = parseInt(versionMatch[1], 10)
            const version_minor = parseInt(versionMatch[2], 10)

            // Check if version already exists (excluding current release)
            const existingVersion = db.prepare('SELECT id FROM releases WHERE version = ? AND id != ?').get(body.version.trim(), id) as any
            if (existingVersion) {
                throw createError({
                    statusCode: 409,
                    message: 'Release version already exists'
                })
            }

            updates.push('version = ?')
            values.push(body.version.trim())
            updates.push('version_major = ?')
            values.push(version_major)
            updates.push('version_minor = ?')
            values.push(version_minor)
        }

        if (body.description !== undefined) {
            updates.push('description = ?')
            values.push(body.description || null)
        }

        if (body.state !== undefined) {
            if (!['idea', 'draft', 'final', 'trash'].includes(body.state)) {
                throw createError({
                    statusCode: 400,
                    message: 'Invalid state. Must be: idea, draft, final, or trash'
                })
            }
            updates.push('state = ?')
            values.push(body.state)
        }

        if (body.release_date !== undefined) {
            updates.push('release_date = ?')
            values.push(body.release_date || null)
        }

        // Always update the updated_at timestamp
        updates.push('updated_at = ?')
        values.push(new Date().toISOString())

        // Add id to the end for WHERE clause
        values.push(id)

        if (updates.length === 1) {
            // Only updated_at was set, nothing meaningful to update
            throw createError({
                statusCode: 400,
                message: 'No valid fields to update'
            })
        }

        const sql = `UPDATE releases SET ${updates.join(', ')} WHERE id = ?`

        db.prepare(sql).run(...values)

        const release = db.prepare('SELECT * FROM releases WHERE id = ?').get(id)

        return {
            success: true,
            release,
            message: 'Release updated successfully'
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to update release',
            data: error
        })
    }
})
