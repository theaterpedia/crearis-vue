/**
 * GET /api/images/local/[...path]
 * 
 * Serve locally stored images from filesystem.
 * Handles three subdirectories:
 * - /source/ - Original uploaded images
 * - /shapes/ - Auto-generated shape variants (square, thumb, wide, vertical)
 * - /transforms/ - XYZ transformation previews
 * 
 * Examples:
 * - GET /api/images/local/source/tp.image.child-marie_2024.jpg
 * - GET /api/images/local/shapes/tp.image.child-marie_2024_square.webp
 * - GET /api/images/local/transforms/tp.image.child-marie_2024_square_xyz_50_50_75.webp
 * 
 * Security:
 * - Path traversal prevention
 * - Content-Type validation
 * - Cache headers for performance
 */

import { defineEventHandler, getRouterParam, createError, setHeaders } from 'h3'
import { LocalAdapter } from '../../../adapters/local-adapter'
import { promises as fs } from 'fs'
import path from 'path'

// Valid subdirectories
const VALID_SUBDIRS = ['source', 'shapes', 'transforms']

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
}

/**
 * Validate and sanitize path to prevent directory traversal
 */
function validatePath(pathSegment: string): void {
    // Prevent directory traversal
    if (pathSegment.includes('..') || pathSegment.includes('\0')) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid path'
        })
    }

    // Prevent absolute paths
    if (path.isAbsolute(pathSegment)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Absolute paths not allowed'
        })
    }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    return MIME_TYPES[ext] || 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
    try {
        // Get full path after /api/images/local/
        // Format: subdir/filename (e.g., "shapes/tp.image.child-marie_2024_square.webp")
        const pathParam = getRouterParam(event, 'path')

        if (!pathParam) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Path parameter required'
            })
        }

        // Split into subdir and filename
        const parts = pathParam.split('/')
        if (parts.length !== 2) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid path format. Expected: subdir/filename'
            })
        }

        const [subdir, filename] = parts

        // Validate subdir
        if (!VALID_SUBDIRS.includes(subdir)) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid subdirectory. Allowed: ${VALID_SUBDIRS.join(', ')}`
            })
        }

        // Validate path components
        validatePath(subdir)
        validatePath(filename)

        // Construct URL path for adapter
        const urlPath = `/api/images/local/${subdir}/${filename}`

        // Get absolute filepath from adapter
        const adapter = new LocalAdapter()
        const filepath = adapter.getFilepath(urlPath)

        // Check if file exists
        try {
            await fs.access(filepath)
        } catch {
            throw createError({
                statusCode: 404,
                statusMessage: 'Image not found'
            })
        }

        // Read file
        const fileBuffer = await fs.readFile(filepath)

        // Set response headers
        const mimeType = getMimeType(filename)
        setHeaders(event, {
            'Content-Type': mimeType,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
            'ETag': `"${filename}"` // Simple ETag based on filename
        })

        return fileBuffer
    } catch (error: any) {
        console.error('[Image Serve] Error:', error)

        // Re-throw H3 errors
        if (error.statusCode) {
            throw error
        }

        // Wrap other errors
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to serve image'
        })
    }
})
