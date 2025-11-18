/**
 * Theme API - Get specific theme variables
 * Returns CSS variables with --color- prefix for a specific theme
 * Also includes font, headings, and inverted settings from index.json
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (id === undefined) {
            throw new Error('Theme ID is required')
        }

        // Try production path first (server/data/themes), then dev path (server/themes)
        const productionPath = join(process.cwd(), 'server/data/themes')
        const devPath = join(process.cwd(), 'server/themes')

        let themesDir = productionPath
        try {
            await access(productionPath, constants.R_OK)
        } catch {
            themesDir = devPath
        }

        const themeFilePath = join(themesDir, `theme-${id}.json`)
        const indexPath = join(themesDir, 'index.json')

        // Load theme color data
        const themeContent = await readFile(themeFilePath, 'utf-8')
        const themeData = JSON.parse(themeContent)

        // Load index to get font, headings, and inverted settings
        const indexContent = await readFile(indexPath, 'utf-8')
        const themesIndex = JSON.parse(indexContent)
        const themeMetadata = themesIndex.find((t: any) => t.id === parseInt(id))

        // Transform keys to CSS variables with --color- prefix
        const cssVars: Record<string, string> = {}
        for (const [key, value] of Object.entries(themeData)) {
            cssVars[`--color-${key}`] = value as string
        }

        // Add font and headings if available from metadata
        if (themeMetadata) {
            if (themeMetadata.font) {
                cssVars['--font'] = themeMetadata.font
            }
            // If headings is missing, use font value
            if (themeMetadata.headings) {
                cssVars['--headings'] = themeMetadata.headings
            } else if (themeMetadata.font) {
                cssVars['--headings'] = themeMetadata.font
            }
        }

        return {
            success: true,
            id: parseInt(id),
            vars: cssVars,
            inverted: themeMetadata?.inverted || false
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        }
    }
})
