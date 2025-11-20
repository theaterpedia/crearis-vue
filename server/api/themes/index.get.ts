/**
 * Theme API - Get all available themes
 * Returns list of themes with metadata
 */

import { defineEventHandler } from 'h3'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

export default defineEventHandler(async () => {
    try {
        // Try production path first (server/data/themes), then dev path (server/themes)
        const productionPath = join(process.cwd(), 'server/data/themes')
        const devPath = join(process.cwd(), 'server/themes')

        let themesDir = productionPath
        try {
            await access(productionPath, constants.R_OK)
        } catch {
            themesDir = devPath
        }

        const indexPath = join(themesDir, 'index.json')

        const indexContent = await readFile(indexPath, 'utf-8')
        const themes = JSON.parse(indexContent)

        return {
            success: true,
            themes
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
})
