import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../database/init'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * POST /api/images/find-broken-refs
 * 
 * Finds image records in the database that reference local files that don't exist on disk.
 * Can optionally delete these broken records.
 * 
 * Request body (optional):
 * - deleteRecords: boolean - If true, delete the broken records (default: false)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event).catch(() => ({}))
    const deleteRecords = body?.deleteRecords === true

    // Storage paths
    const baseStoragePath = process.env.LOCAL_IMAGE_STORAGE || '/opt/crearis/images'

    try {
        // Get all local adapter images from database
        const dbImages = await db.all<any[]>(`
            SELECT id, xmlid, name, url, (author).adapter as adapter
            FROM images 
            WHERE (author).adapter IN ('local', 'crearis')
            AND url LIKE '/api/images/local/%'
        `)

        if (!dbImages || dbImages.length === 0) {
            return {
                success: true,
                message: 'No local adapter images found in database',
                totalChecked: 0,
                brokenRecords: []
            }
        }

        console.log(`[find-broken-refs] Checking ${dbImages.length} local image records...`)

        const brokenRecords: { id: number; xmlid: string; name: string; url: string; reason: string }[] = []

        // Helper to check if file exists
        const fileExists = async (filepath: string): Promise<boolean> => {
            try {
                await fs.access(filepath)
                return true
            } catch {
                return false
            }
        }

        // Helper to get filepath from URL
        const getFilepath = (url: string): string | null => {
            const match = url.match(/\/api\/images\/local\/([^/]+)\/(.+)/)
            if (!match) return null

            const [, subdir, filename] = match
            switch (subdir) {
                case 'source':
                    return path.join(baseStoragePath, 'source', filename)
                case 'shapes':
                    return path.join(baseStoragePath, 'shapes', filename)
                case 'transforms':
                    return path.join(baseStoragePath, 'transforms', filename)
                default:
                    return null
            }
        }

        for (const image of dbImages) {
            // Check if source file exists
            const filepath = getFilepath(image.url)

            if (!filepath) {
                brokenRecords.push({
                    id: image.id,
                    xmlid: image.xmlid,
                    name: image.name,
                    url: image.url,
                    reason: 'Invalid URL format'
                })
                continue
            }

            const exists = await fileExists(filepath)
            if (!exists) {
                brokenRecords.push({
                    id: image.id,
                    xmlid: image.xmlid,
                    name: image.name,
                    url: image.url,
                    reason: `Source file missing: ${filepath}`
                })
            }
        }

        console.log(`[find-broken-refs] Found ${brokenRecords.length} broken records out of ${dbImages.length}`)

        // Delete broken records if requested
        const deleted: number[] = []
        const deleteFailed: { id: number; error: string }[] = []

        if (deleteRecords && brokenRecords.length > 0) {
            for (const record of brokenRecords) {
                try {
                    await db.run('DELETE FROM images WHERE id = ?', [record.id])
                    deleted.push(record.id)
                    console.log(`[find-broken-refs] Deleted broken record: ${record.id} (${record.xmlid})`)
                } catch (err) {
                    deleteFailed.push({ id: record.id, error: String(err) })
                    console.error(`[find-broken-refs] Failed to delete ${record.id}:`, err)
                }
            }
        }

        return {
            success: true,
            message: deleteRecords
                ? `Found ${brokenRecords.length} broken records. Deleted ${deleted.length}, failed ${deleteFailed.length}.`
                : `Found ${brokenRecords.length} broken records out of ${dbImages.length} local images.`,
            totalChecked: dbImages.length,
            brokenCount: brokenRecords.length,
            brokenRecords: brokenRecords.map(r => ({
                id: r.id,
                xmlid: r.xmlid,
                name: r.name,
                reason: r.reason
            })),
            deleted: deleteRecords ? deleted : undefined,
            deleteFailed: deleteRecords ? deleteFailed : undefined
        }
    } catch (error) {
        console.error('[find-broken-refs] Error:', error)

        throw createError({
            statusCode: 500,
            message: `Failed to find broken references: ${error}`
        })
    }
})
