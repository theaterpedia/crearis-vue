import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../database/init'
import type { ImagesTableFields } from '../../types/database'
import { generateShapeBlurHashes } from '../../utils/blurhash'

/**
 * POST /api/images - Create new image record
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event) as any

        if (!body.name || !body.url) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: name and url'
            })
        }

        // Generate BlurHash for all shapes
        console.log('[POST /api/images] Generating BlurHash for URL:', body.url)
        const blurHashes = await generateShapeBlurHashes(body.url)

        const imageData: Partial<ImagesTableFields> = {
            xmlid: body.xmlid || null,
            name: body.name,
            url: body.url,
            project_id: body.project_id || null,
            status_id: body.status_id || 0,
            owner_id: body.owner_id || null,
            alt_text: body.alt_text || null,
            title: body.title || null,
            x: body.x || null,
            y: body.y || null,
            fileformat: body.fileformat || 'none',
            embedformat: body.embedformat || null,
            license: body.license || 'BY',
            length: body.length || null
        }

        // Helper to format composite type with blur
        const formatShape = (shapeData: any, blur: string | null, shapeType: string) => {
            const x = shapeData?.x || null
            const y = shapeData?.y || null
            const z = shapeData?.z || null
            const url = shapeData?.url || body.url
            const json = null // Not used yet
            const blurVal = blur || null
            const turl = shapeData?.turl || null
            const tpar = shapeData?.tpar || null

            // Format: (x, y, z, url, json, blur, turl, tpar)
            const parts = [
                x === null ? '' : String(x),
                y === null ? '' : String(y),
                z === null ? '' : String(z),
                url ? `"${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : '',
                '', // json placeholder
                blurVal ? `"${blurVal}"` : '',
                turl ? `"${turl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : '',
                tpar ? `"${tpar.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : ''
            ]

            return `(${parts.join(',')})`
        }

        const sql = `
            INSERT INTO images (
                xmlid, name, url, project_id, status_id, owner_id,
                alt_text, title, x, y, fileformat, embedformat, license, length,
                shape_square, shape_wide, shape_vertical, shape_thumb
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        `

        const result = await db.run(sql, [
            imageData.xmlid,
            imageData.name,
            imageData.url,
            imageData.project_id,
            imageData.status_id,
            imageData.owner_id,
            imageData.alt_text,
            imageData.title,
            imageData.x,
            imageData.y,
            imageData.fileformat,
            imageData.embedformat,
            imageData.license,
            imageData.length,
            formatShape(body.shape_square, blurHashes.square || null, 'square'),
            formatShape(body.shape_wide, blurHashes.wide || null, 'wide'),
            formatShape(body.shape_vertical, blurHashes.vertical || null, 'vertical'),
            formatShape(body.shape_thumb, blurHashes.thumb || null, 'thumb')
        ])

        const newId = result.rows?.[0]?.id || result.lastID

        if (!newId) {
            throw new Error('Failed to get new image ID')
        }

        const created = await db.get('SELECT * FROM images WHERE id = ?', [newId])
        return created
    } catch (error) {
        console.error('Error creating image:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to create image'
        })
    }
})
