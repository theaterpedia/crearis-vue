import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import { getStatusByName } from '../../utils/status-helpers'
import type { ProjectsTableFields } from '../../types/database'

// POST /api/projects - Create new project
// After Migration 019 Chapter 5:
// - 'domaincode' is the unique TEXT identifier (user-facing, used in URLs)
// - 'name' is the project title/display name
// - 'heading' is kept for backward compatibility
// - 'id' is auto-increment INTEGER (internal DB use only)
// After Migration 020 Chapter 3:
// - Added status_id INTEGER field (FK to status table)
export default defineEventHandler(async (event) => {
    const body = await readBody(event) as {
        domaincode?: string
        name?: string
        heading?: string
        description?: string
        status?: string
        owner_id?: string | number
        header_size?: string
        img_id?: number
    }

    try {
        // Domaincode is required - can be provided as 'domaincode' or fallback to old 'id' field
        const domaincode = body.domaincode
        if (!domaincode) {
            throw createError({
                statusCode: 400,
                message: 'Project domaincode is required'
            })
        }

        // Validate domaincode format
        if (!/^[a-z][a-z0-9_]*$/.test(domaincode)) {
            throw createError({
                statusCode: 400,
                message: 'Domaincode must start with lowercase letter and contain only lowercase letters, numbers, and underscores'
            })
        }

        // Check if domaincode already exists
        const existing = await db.get('SELECT id FROM projects WHERE domaincode = ?', [domaincode])
        if (existing) {
            throw createError({
                statusCode: 409,
                message: 'Project with this domaincode already exists'
            })
        }

        // Prepare fields
        const name = body.name || null
        const heading = body.heading || (name ? `Project Overline **${name}**` : `Project Overline **${domaincode}**`)
        const description = body.description || null
        const header_size = body.header_size || null

        // Get status_val from status name (default: 'new')
        let status_val: Buffer
        if (body.status) {
            const statusInfo = await getStatusByName(db, body.status, 'projects')
            if (!statusInfo) {
                throw createError({
                    statusCode: 400,
                    message: `Invalid status '${body.status}'. Must be a valid status name for projects.`
                })
            }
            status_val = statusInfo.value
        } else {
            // Default to 'new' status
            const statusInfo = await getStatusByName(db, 'new', 'projects')
            if (!statusInfo) {
                throw createError({
                    statusCode: 500,
                    message: 'Default status (new) not found. Run migration 020.'
                })
            }
            status_val = statusInfo.value
        }

        // Convert owner_id to INTEGER if provided
        let owner_id = null
        if (body.owner_id) {
            if (typeof body.owner_id === 'number') {
                owner_id = body.owner_id
            } else {
                // If TEXT, assume it's user sysmail - lookup numeric id
                const user = await db.get('SELECT id FROM users WHERE sysmail = ?', [body.owner_id])
                if (user) {
                    owner_id = user.id
                }
            }
        }

        // Use ProjectsTableFields for type-safe INSERT
        const projectData: Partial<ProjectsTableFields> = {
            domaincode,
            name,
            heading,
            description,
            status_val,
            owner_id,
            header_size,
            img_id: body.img_id || null
        }

        // Insert project
        const stmt = db.prepare(`
            INSERT INTO projects (domaincode, name, heading, description, status_val, owner_id, header_size, img_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        stmt.run(
            projectData.domaincode,
            projectData.name,
            projectData.heading,
            projectData.description,
            projectData.status_val,
            projectData.owner_id,
            projectData.header_size,
            projectData.img_id
        )

        // Return created project (with auto-generated id)
        const rawProject = await db.get('SELECT * FROM projects WHERE domaincode = ?', [domaincode])

        return {
            success: true,
            project: rawProject
        }
    } catch (error) {
        console.error('Error creating project:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create project'
        })
    }
})