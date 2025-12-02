/**
 * POST /api/sysreg
 * Create a new sysreg tag
 * 
 * Note: After Migration 036, value is INTEGER (not BYTEA).
 * For config entries (capabilities matrix), value should be an integer.
 * For other families, value can be hex string (converted) or integer.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
    const body = await readBody(event) as any

    const {
        tagfamily,
        value,
        name,
        taglogic,
        description,
        is_default,
        name_i18n,
        desc_i18n
    } = body

    // Validation
    if (!tagfamily || value === undefined || !name || !taglogic) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: tagfamily, value, name, taglogic'
        })
    }

    // Validate tagfamily
    const validFamilies = ['status', 'config', 'rtags', 'ctags', 'ttags', 'dtags']
    if (!validFamilies.includes(tagfamily)) {
        throw createError({
            statusCode: 400,
            message: `Invalid tagfamily. Must be one of: ${validFamilies.join(', ')}`
        })
    }

    // Validate taglogic
    const validLogics = ['category', 'toggle', 'option', 'subcategory']
    if (!validLogics.includes(taglogic)) {
        throw createError({
            statusCode: 400,
            message: `Invalid taglogic. Must be one of: ${validLogics.join(', ')}`
        })
    }

    // Convert value to integer if needed
    let intValue: number
    if (typeof value === 'number') {
        intValue = value
    } else if (typeof value === 'string' && value.match(/^\\x[0-9a-fA-F]+$/)) {
        // Legacy hex format - convert to integer
        const hex = value.replace(/^\\x/, '')
        intValue = parseInt(hex, 16)
    } else if (typeof value === 'string' && !isNaN(parseInt(value))) {
        intValue = parseInt(value)
    } else {
        throw createError({
            statusCode: 400,
            message: 'Invalid value format. Must be an integer or hex like \\x01'
        })
    }

    try {
        // Determine which table to insert into
        const tableName = `sysreg_${tagfamily}`

        // Build the INSERT query
        const query = `
      INSERT INTO ${tableName} (
        value,
        name,
        description,
        tagfamily,
        taglogic,
        is_default,
        name_i18n,
        desc_i18n
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING *
    `

        const result = await db.run(query, [
            intValue,
            name,
            description || null,
            tagfamily,
            taglogic,
            is_default || false,
            name_i18n ? JSON.stringify(name_i18n) : null,
            desc_i18n ? JSON.stringify(desc_i18n) : null
        ])

        // Get the created tag
        const getQuery = `SELECT * FROM ${tableName} WHERE value = $1 AND tagfamily = $2`
        const createdTag = await db.get(getQuery, [intValue, tagfamily])

        return {
            success: true,
            tag: createdTag
        }
    } catch (error: any) {
        console.error('Error creating sysreg tag:', error)

        // Check for unique constraint violation
        if (error.code === '23505') {
            throw createError({
                statusCode: 409,
                message: 'A tag with this value already exists in this family'
            })
        }

        throw createError({
            statusCode: 500,
            message: 'Failed to create tag: ' + error.message
        })
    }
})
