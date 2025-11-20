/**
 * PUT /api/sysreg/[id]
 * Update an existing sysreg tag
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event) as any

    const {
        name,
        description,
        taglogic,
        is_default,
        name_i18n,
        desc_i18n
    } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Tag ID is required'
        })
    }

    // Note: We don't allow changing tagfamily or value as they're structural
    // Only metadata can be updated

    try {
        // First, get the tag to determine which table it's in
        const getQuery = 'SELECT * FROM sysreg WHERE id = $1'
        const existingTag = await db.get(getQuery, [id])

        if (!existingTag) {
            throw createError({
                statusCode: 404,
                message: 'Tag not found'
            })
        }

        const tableName = `sysreg_${existingTag.tagfamily}`

        // Build UPDATE query with only provided fields
        const updates: string[] = []
        const values: any[] = []
        let paramCount = 1

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`)
            values.push(name)
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`)
            values.push(description)
        }

        if (taglogic !== undefined) {
            updates.push(`taglogic = $${paramCount++}`)
            values.push(taglogic)
        }

        if (is_default !== undefined) {
            updates.push(`is_default = $${paramCount++}`)
            values.push(is_default)
        }

        if (name_i18n !== undefined) {
            updates.push(`name_i18n = $${paramCount++}`)
            values.push(JSON.stringify(name_i18n))
        }

        if (desc_i18n !== undefined) {
            updates.push(`desc_i18n = $${paramCount++}`)
            values.push(JSON.stringify(desc_i18n))
        }

        if (updates.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No fields to update'
            })
        }

        // Add ID as final parameter
        values.push(id)

        const updateQuery = `
      UPDATE ${tableName}
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
    `

        await db.run(updateQuery, values)

        // Get the updated tag
        const updatedTag = await db.get(`SELECT * FROM ${tableName} WHERE id = $1`, [id])

        return {
            success: true,
            tag: updatedTag
        }
    } catch (error: any) {
        console.error('Error updating sysreg tag:', error)

        throw createError({
            statusCode: 500,
            message: 'Failed to update tag: ' + error.message
        })
    }
})
