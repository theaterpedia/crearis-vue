/**
 * Theme API - Get specific theme variables
 * Returns CSS variables with --color- prefix for a specific theme
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (id === undefined) {
            throw new Error('Theme ID is required')
        }

        const themesDir = join(process.cwd(), 'server/themes')
        const themeFilePath = join(themesDir, `theme-${id}.json`)

        const themeContent = await readFile(themeFilePath, 'utf-8')
        const themeData = JSON.parse(themeContent)

        // Transform keys to CSS variables with --color- prefix
        const cssVars: Record<string, string> = {}
        for (const [key, value] of Object.entries(themeData)) {
            cssVars[`--color-${key}`] = value as string
        }

        return {
            success: true,
            id: parseInt(id),
            vars: cssVars
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
})
