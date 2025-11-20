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
 * Validate xmlid format
 * Expected format: domaincode.image.subject-identifier OR domaincode.image.subject_identifier
 * Examples: tp.image.child-marie_2024, crearis.image.instructor-john_smith, start.image.scene_1763668214959
 */
function validateXmlid(xmlid: string): void {
    const pattern = /^[a-z0-9_-]+\.image\.[a-z0-9_.-]+$/i
    console.log('[Upload] Validating xmlid:', JSON.stringify(xmlid), 'Length:', xmlid.length)
    if (!pattern.test(xmlid)) {
        console.error('[Upload] XMLID validation failed for:', JSON.stringify(xmlid))
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid xmlid format. Expected: domaincode.image.subject-identifier'
        })
    }
}

/**
 * Parse ctags from comma-separated string to Buffer
 */
function parseTagBuffer(tagString?: string): Buffer {
    if (!tagString) {
        return Buffer.from([0])
    }

    try {
        const bytes = tagString.split(',').map(s => parseInt(s.trim(), 10))
        if (bytes.some(b => isNaN(b) || b < 0 || b > 255)) {
            throw new Error('Invalid byte value')
        }
        return Buffer.from(bytes)
    } catch (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid tag format. Expected comma-separated bytes (0-255)'
        })
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

        // Parse tags
        const ctags = parseTagBuffer(ctagsStr)
        const rtags = parseTagBuffer(rtagsStr)

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
            rtags
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
