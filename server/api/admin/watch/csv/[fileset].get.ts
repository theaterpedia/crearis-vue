/**
 * API Endpoint: Check CSV files for updates
 * GET /api/admin/watch/csv/:fileset
 * 
 * Checks if CSV files have been modified since last check
 * Returns list of updated files and updates config timestamp
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../database/init'
import fs from 'fs'
import path from 'path'

const CSV_DIR = path.resolve(process.cwd(), 'src/assets/csv')

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
            ['watchcsv']
        )

        if (!configRow) {
            throw createError({
                statusCode: 500,
                message: 'watchcsv configuration not found'
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
        const files = filesetConfig.files || []

        // Check each file's modification time
        const updatedFiles: string[] = []

        for (const filename of files) {
            const filePath = path.join(CSV_DIR, filename)

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filename}`)
                continue
            }

            const stats = fs.statSync(filePath)
            const mtime = stats.mtime

            // If no lastCheck or file is newer, mark as updated
            if (!lastCheck || mtime > lastCheck) {
                updatedFiles.push(filename)
            }
        }

        // Update lastCheck timestamp
        const now = new Date().toISOString()
        filesetConfig.lastCheck = now
        config[fileset] = filesetConfig

        await db.run(
            'UPDATE system_config SET value = ?, updated_at = ? WHERE key = ?',
            [JSON.stringify(config), now, 'watchcsv']
        )

        console.log(`✅ Watch CSV check completed for '${fileset}':`, {
            totalFiles: files.length,
            updatedFiles: updatedFiles.length,
            lastCheck: lastCheck?.toISOString(),
            newCheck: now
        })

        return {
            success: true,
            fileset,
            updatedFiles,
            totalFiles: files.length,
            lastCheck: lastCheck?.toISOString(),
            currentCheck: now,
            hasUpdates: updatedFiles.length > 0
        }
    } catch (error: any) {
        console.error('❌ Error in watchcsv check:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to check CSV files'
        })
    }
})
