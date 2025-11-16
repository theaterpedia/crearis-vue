/**
 * Theme API - Get all available themes
 * Returns list of themes with metadata
 */

import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async () => {
    try {
        const themesDir = join(process.cwd(), 'server/themes')
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
