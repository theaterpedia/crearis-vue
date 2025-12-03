/**
 * POST /api/images/upload
 * 
 * Upload local images to server storage using Sharp for processing.
 * Handles multipart file upload with metadata.
 * 
 * Request body (multipart/form-data):
 * - file: Image file (required)
 * - xmlid: Image identifier (required, format: domaincode.image.subject-identifier)
 * - project_id: Project ID (optional)
 * - owner_id: Owner ID (required)
 * - alt_text: Alt text (optional)
 * - xml_subject: Subject type (optional, default: 'mixed')
 * - license: License type (optional, default: 'BY')
 * - ctags: Content tags as comma-separated byte values (optional)
 * - rtags: Rights tags as comma-separated byte values (optional)
 * 
 * Security:
 * - Max file size: 20MB
 * - Allowed types: image/jpeg, image/png, image/webp
 * - File validation using Sharp (verifies actual image format)
 */

import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { LocalAdapter } from '../../adapters/local-adapter'

// File validation constants
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Validate file type and size
 */
function validateFile(file: { filename?: string; type?: string; data: Buffer }): void {
    // Check file size
    if (file.data.length > MAX_FILE_SIZE) {
        throw createError({
            statusCode: 400,
            statusMessage: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        })
    }

    // Check MIME type
    if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        })
    }

    // Check file extension
    const filename = file.filename || ''
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        })
    }
}

/**
 * Validate XMLID format
 * Expected format: domaincode.entity_type.identifier
 * Rules:
 * - No hyphens allowed anywhere
 * - Only underscores and alphanumeric characters
 * - Domaincode: alphanumeric, can start with underscore (e.g., _aug, comictheater)
 * - Entity type: 'image' or 'image_X' where X is alphanumeric (e.g., image, image_event, image_post)
 * - Identifier: alphanumeric with underscores (e.g., comic_theater_5, 167_dasei2022_team_I8A7744_yry0zh)
 * 
 * Valid examples:
 * - comictheater.image_event.comic_theater_5
 * - comictheater.image.comic_theater_5
 * - dev.image_post.167_dasei2022_team_I8A7744_yry0zh
 * - _aug.image_instructor.nina_roob_1
 * 
 * Invalid examples:
 * - comictheater.image-event.comic_theater_5 (hyphen in entity type)
 * - comictheater.image.comic-theater_5 (hyphen in identifier)
 * - dev_pro.image_post.167_dasei2022_team_I8A7744_yry0zh (underscore in middle of domaincode)
 * - dev.image_post_variant.167_dasei2022_team_I8A7744_yry0zh (too many underscores in entity type)
 */
function validateXmlid(xmlid: string): void {
    // Pattern breakdown:
    // ^(_?[a-z0-9]+) - domaincode: optional leading underscore, then alphanumeric
    // \.(image|image_[a-z0-9]+) - entity type: 'image' or 'image_' followed by alphanumeric
    // \.([a-z0-9_]+)$ - identifier: alphanumeric with underscores
    const pattern = /^(_?[a-z0-9]+)\.(image|image_[a-z0-9]+)\.([a-z0-9_]+)$/i

    console.log('[Upload] Validating xmlid:', JSON.stringify(xmlid), 'Length:', xmlid.length)

    // Check for exactly 2 dots
    const dotCount = (xmlid.match(/\./g) || []).length
    if (dotCount !== 2) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid xmlid: must contain exactly 2 dots (found ${dotCount}). Expected format: domaincode.entity_type.identifier`
        })
    }

    if (!pattern.test(xmlid)) {
        console.error('[Upload] XMLID validation failed for:', JSON.stringify(xmlid))
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid xmlid format. Expected: domaincode.entity_type.identifier (no hyphens, only underscores allowed)'
        })
    }

    // Additional check: ensure no hyphens anywhere
    if (xmlid.includes('-')) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid xmlid: hyphens are not allowed. Use underscores instead.'
        })
    }
}

/**
 * Parse tags from string to INTEGER
 * After Migration 036, ctags/rtags are INTEGER columns (32-bit)
 * Accepts: empty string, single integer value, or defaults to 0
 * Examples: "", "0", "128", "255"
 */
function parseTagInteger(tagString?: string): number {
    // Handle empty, null, undefined, or whitespace-only strings
    if (!tagString || tagString.trim() === '') {
        return 0
    }

    try {
        const trimmed = tagString.trim()
        const parsed = parseInt(trimmed, 10)
        // Treat NaN as 0 for robustness
        return isNaN(parsed) ? 0 : parsed
    } catch (error) {
        console.error('[Upload] Tag parse error:', error, 'Input:', tagString)
        // Return default instead of throwing
        return 0
    }
}

export default defineEventHandler(async (event) => {
    try {
        // Parse multipart form data
        const formData = await readMultipartFormData(event)

        if (!formData) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No form data provided'
            })
        }

        // Extract fields
        let fileData: { filename?: string; type?: string; data: Buffer } | undefined
        let xmlid: string | undefined
        let owner_id: number | undefined
        let project_id: number | undefined
        let alt_text: string | undefined
        let xml_subject: string = 'mixed'
        let license: string = 'BY'
        let ctagsStr: string | undefined
        let rtagsStr: string | undefined
        let ttagsStr: string | undefined
        let dtagsStr: string | undefined

        for (const part of formData) {
            const name = part.name
            const value = part.data

            if (name === 'file') {
                fileData = {
                    filename: part.filename,
                    type: part.type,
                    data: Buffer.from(value)
                }
            } else if (name === 'xmlid') {
                xmlid = Buffer.from(value).toString('utf-8')
            } else if (name === 'owner_id') {
                owner_id = parseInt(Buffer.from(value).toString('utf-8'), 10)
            } else if (name === 'project_id') {
                const projectIdStr = Buffer.from(value).toString('utf-8')
                if (projectIdStr && projectIdStr !== 'null') {
                    project_id = parseInt(projectIdStr, 10)
                }
            } else if (name === 'alt_text') {
                alt_text = Buffer.from(value).toString('utf-8')
            } else if (name === 'xml_subject') {
                xml_subject = Buffer.from(value).toString('utf-8')
            } else if (name === 'license') {
                license = Buffer.from(value).toString('utf-8')
            } else if (name === 'ctags') {
                ctagsStr = Buffer.from(value).toString('utf-8')
            } else if (name === 'rtags') {
                rtagsStr = Buffer.from(value).toString('utf-8')
            } else if (name === 'ttags') {
                ttagsStr = Buffer.from(value).toString('utf-8')
            } else if (name === 'dtags') {
                dtagsStr = Buffer.from(value).toString('utf-8')
            }
        }

        // Validate required fields
        if (!fileData) {
            throw createError({
                statusCode: 400,
                statusMessage: 'File is required'
            })
        }

        if (!xmlid) {
            throw createError({
                statusCode: 400,
                statusMessage: 'xmlid is required'
            })
        }

        if (!owner_id || isNaN(owner_id)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Valid owner_id is required'
            })
        }

        // Validate file
        validateFile(fileData)

        // Validate xmlid format
        validateXmlid(xmlid)

        // Parse tags as integers (Migration 036 changed these from BYTEA to INTEGER)
        const ctags = parseTagInteger(ctagsStr)
        const rtags = parseTagInteger(rtagsStr)
        const ttags = parseTagInteger(ttagsStr)
        const dtags = parseTagInteger(dtagsStr)

        // Extract domaincode from xmlid for batch data
        const domaincode = xmlid.split('.')[0]

        // Prepare batch data
        const batchData = {
            xmlid,
            domaincode,
            owner_id,
            project_id,
            alt_text,
            xml_subject,
            license,
            ctags,
            rtags,
            ttags,
            dtags
        }

        console.log('[Upload] Processing file:', {
            filename: fileData.filename,
            size: `${(fileData.data.length / 1024).toFixed(2)} KB`,
            xmlid,
            owner_id,
            xml_subject
        })

        // Create adapter and import file
        const adapter = new LocalAdapter()
        const result = await adapter.importUploadedFile(
            fileData.data,
            fileData.filename || 'upload.jpg',
            batchData as any
        )

        console.log('[Upload] Success:', {
            imageId: result.imageId,
            urls: Object.keys(result.urls)
        })

        return {
            success: true,
            image_id: result.imageId,
            urls: result.urls,
            message: 'Image uploaded and processed successfully'
        }
    } catch (error: any) {
        console.error('[Upload] Error:', error)

        // Re-throw H3 errors
        if (error.statusCode) {
            throw error
        }

        // Wrap other errors
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to upload image'
        })
    }
})
