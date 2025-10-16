/**
 * API Endpoint: Check database entities for updates
 * GET /api/admin/watch/db/:fileset
 * 
 * Checks if database entities with isbase flag have been modified
 * Returns list of entities with changes
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../database/init'

export default defineEventHandler(async (event) => {
    const fileset = getRouterParam(event, 'fileset')

    if (!fileset) {
        throw createError({
            statusCode: 400,
            message: 'Fileset parameter is required'
        })
    }

    try {
        // Get current config
        const configRow = await db.get(
            'SELECT value FROM system_config WHERE key = ?',
            ['watchdb']
        )

        if (!configRow) {
            throw createError({
                statusCode: 500,
                message: 'watchdb configuration not found'
            })
        }

        const config = JSON.parse(configRow.value)

        // Check if fileset exists in config
        if (!config[fileset]) {
            throw createError({
                statusCode: 404,
                message: `Fileset '${fileset}' not found in configuration`
            })
        }

        const filesetConfig = config[fileset]
        const lastCheck = filesetConfig.lastCheck ? new Date(filesetConfig.lastCheck) : null
        const entities = filesetConfig.entities || []

        // Check each entity for changes
        const updatedEntities: string[] = []

        for (const entityTable of entities) {
            // Check if table has isbase column
            let hasIsbaseColumn = false
            
            if (db.type === 'postgresql') {
                const tableInfo = await db.all(`
                    SELECT column_name as name
                    FROM information_schema.columns
                    WHERE table_name = $1
                `, [entityTable])
                hasIsbaseColumn = tableInfo.some((col: any) => col.name === 'isbase')
            } else {
                const tableInfo = await db.all(`PRAGMA table_info(${entityTable})`)
                hasIsbaseColumn = tableInfo.some((col: any) => col.name === 'isbase')
            }

            if (!hasIsbaseColumn) {
                console.warn(`⚠️ Table '${entityTable}' doesn't have isbase column`)
                continue
            }

            // Count records with isbase flag
            const result = await db.get(
                `SELECT COUNT(*) as count FROM ${entityTable} WHERE isbase = 1`
            )

            if (result && result.count > 0) {
                // Check if any records were updated since lastCheck
                const updatedResult = await db.get(
                    `SELECT COUNT(*) as count FROM ${entityTable} 
                     WHERE isbase = 1 
                     AND updated_at > ?`,
                    [lastCheck ? lastCheck.toISOString() : '1970-01-01']
                )

                if (updatedResult && updatedResult.count > 0) {
                    updatedEntities.push(entityTable)
                }
            }
        }

        // Update lastCheck timestamp
        const now = new Date().toISOString()
        filesetConfig.lastCheck = now
        config[fileset] = filesetConfig

        await db.run(
            'UPDATE system_config SET value = ?, updated_at = ? WHERE key = ?',
            [JSON.stringify(config), now, 'watchdb']
        )

        console.log(`✅ Watch DB check completed for '${fileset}':`, {
            totalEntities: entities.length,
            updatedEntities: updatedEntities.length,
            lastCheck: lastCheck?.toISOString(),
            newCheck: now
        })

        return {
            success: true,
            fileset,
            updatedEntities,
            totalEntities: entities.length,
            lastCheck: lastCheck?.toISOString(),
            currentCheck: now,
            hasUpdates: updatedEntities.length > 0
        }
    } catch (error: any) {
        console.error('❌ Error in watchdb check:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to check database entities'
        })
    }
})
