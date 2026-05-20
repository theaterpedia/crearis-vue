import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../database/init'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * POST /api/images/cleanup-orphans
 * 
 * Cleans up orphaned image files from the local storage that don't exist in the database.
 * 
 * Request body (optional):
 * - dryRun: boolean - If true, only report what would be deleted (default: true)
 * - includeShapes: boolean - Check shapes directory (default: true)
 * - includeTransforms: boolean - Check transforms directory (default: true)
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event).catch(() => ({}))
    const dryRun = body?.dryRun !== false  // Default to dry run for safety
    const includeShapes = body?.includeShapes !== false
    const includeTransforms = body?.includeTransforms !== false

    // Storage paths
    const baseStoragePath = process.env.LOCAL_IMAGE_STORAGE || '/opt/crearis/images'
    const sourceDir = path.join(baseStoragePath, 'source')
    const shapesDir = path.join(baseStoragePath, 'shapes')
    const transformsDir = path.join(baseStoragePath, 'transforms')

    try {
        // Get all xmlids from database for local adapter images
        const dbImages = await db.all<any[]>(`
            SELECT xmlid, url
            FROM images 
            WHERE (author).adapter IN ('local', 'crearis')
        `)

        const dbXmlids = new Set(dbImages?.map(img => img.xmlid) || [])
        console.log(`[cleanup-orphans] Found ${dbXmlids.size} local images in database`)

        const orphanedFiles: { path: string; type: string; size: number }[] = []
        let totalSize = 0

        // Helper to check files in a directory
        const checkDirectory = async (dir: string, type: string) => {
            try {
                const files = await fs.readdir(dir)

                for (const file of files) {
                    // Extract xmlid from filename
                    // Formats: xmlid.ext (source) or xmlid_shape.webp (shapes/transforms)
                    let xmlid: string

                    if (type === 'source') {
                        // Source files: xmlid.jpg, xmlid.png, etc.
                        xmlid = file.replace(/\.[^.]+$/, '')
                    } else {
                        // Shape/transform files: xmlid_shape.webp
                        const match = file.match(/^(.+?)_[^_]+\.webp$/)
                        xmlid = match ? match[1] : file.replace(/\.[^.]+$/, '')
                    }

                    if (!dbXmlids.has(xmlid)) {
                        const filepath = path.join(dir, file)
                        try {
                            const stats = await fs.stat(filepath)
                            orphanedFiles.push({
                                path: filepath,
                                type,
                                size: stats.size
                            })
                            totalSize += stats.size
                        } catch (e) {
                            // File might have been deleted in the meantime
                        }
                    }
                }
            } catch (e) {
                console.warn(`[cleanup-orphans] Could not read directory ${dir}:`, e)
            }
        }

        // Check source directory
        await checkDirectory(sourceDir, 'source')

        // Check shapes directory if requested
        if (includeShapes) {
            await checkDirectory(shapesDir, 'shapes')
        }

        // Check transforms directory if requested
        if (includeTransforms) {
            await checkDirectory(transformsDir, 'transforms')
        }

        console.log(`[cleanup-orphans] Found ${orphanedFiles.length} orphaned files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`)

        // Delete files if not a dry run
        const deleted: string[] = []
        const failed: { path: string; error: string }[] = []

        if (!dryRun && orphanedFiles.length > 0) {
            for (const file of orphanedFiles) {
                try {
                    await fs.unlink(file.path)
                    deleted.push(file.path)
                    console.log(`[cleanup-orphans] Deleted: ${file.path}`)
                } catch (err) {
                    failed.push({ path: file.path, error: String(err) })
                    console.error(`[cleanup-orphans] Failed to delete ${file.path}:`, err)
                }
            }
        }

        // Format size for display
        const formatSize = (bytes: number) => {
            if (bytes < 1024) return `${bytes} B`
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`
        }

        return {
            success: true,
            dryRun,
            message: dryRun
                ? `Found ${orphanedFiles.length} orphaned files (${formatSize(totalSize)}). Run with dryRun=false to delete.`
                : `Deleted ${deleted.length} files, ${failed.length} failed`,
            totalOrphans: orphanedFiles.length,
            totalSize: formatSize(totalSize),
            totalSizeBytes: totalSize,
            deleted: dryRun ? [] : deleted,
            failed: dryRun ? [] : failed,
            orphanedFiles: orphanedFiles.map(f => ({
                path: f.path,
                type: f.type,
                size: formatSize(f.size)
            }))
        }
    } catch (error) {
        console.error('[cleanup-orphans] Error:', error)

        throw createError({
            statusCode: 500,
            message: `Failed to cleanup orphaned files: ${error}`
        })
    }
})
