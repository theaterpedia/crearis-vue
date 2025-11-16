import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async () => {
    try {
        // Fetch all images from database
        const images = await db.all('SELECT * FROM images ORDER BY id')

        // Generate timestamp for filename
        const now = new Date()
        const timestamp = now.toISOString()
            .replace(/T/, '-')
            .replace(/:/g, '_')
            .replace(/\..+/, '')
            .slice(0, 16) // YYYY-MM-DD-HH_mm

        // Ensure data/images directory exists
        const dataDir = join(process.cwd(), 'data', 'images')
        await mkdir(dataDir, { recursive: true })

        // Create file path
        const filename = `images-export-${timestamp}.json`
        const filepath = join(dataDir, filename)

        // Write JSON file with proper formatting
        await writeFile(filepath, JSON.stringify(images, null, 2), 'utf-8')

        return {
            success: true,
            path: `/data/images/${filename}`,
            count: images.length,
            timestamp
        }
    } catch (error: any) {
        console.error('Export error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to export images',
            data: { error: error.message }
        })
    }
})
