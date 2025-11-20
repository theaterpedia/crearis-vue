/**
 * Local Storage Adapter
 * 
 * Handles locally uploaded images using Sharp for image processing.
 * Storage structure: /opt/crearis/images/ (production) or configurable via env
 * 
 * Features:
 * - Entropy-based smart cropping (default)
 * - Attention-based cropping for thumbnails (face detection)
 * - XYZ focal point transformation support
 * - WebP format for optimized delivery
 * - Reference implementation for debugging XYZ transformations
 */

import { BaseMediaAdapter } from './base-adapter'
import type { MediaMetadata, ImageImportBatch } from '../types/adapters'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export class LocalAdapter extends BaseMediaAdapter {
    readonly type = 'local' as const

    // Storage paths (configurable via environment)
    private readonly baseStoragePath: string
    private readonly sourceDir: string
    private readonly shapesDir: string
    private readonly transformsDir: string

    // Shape dimensions (matching existing adapters)
    private readonly DIMENSIONS = {
        square: { width: 128, height: 128 },
        thumb: { width: 64, height: 64 },
        wide: { width: 336, height: 168 },
        vertical: { width: 126, height: 224 }
    } as const

    constructor() {
        super()

        // Use env variable or default to production path
        this.baseStoragePath = process.env.LOCAL_IMAGE_STORAGE || '/opt/crearis/images'
        this.sourceDir = path.join(this.baseStoragePath, 'source')
        this.shapesDir = path.join(this.baseStoragePath, 'shapes')
        this.transformsDir = path.join(this.baseStoragePath, 'transforms')

        console.log(`[LocalAdapter] Storage path: ${this.baseStoragePath}`)

        // Ensure directories exist
        this.ensureDirectories().catch(err => {
            console.error('[LocalAdapter] Failed to create storage directories:', err)
        })
    }

    /**
     * Create storage directories if they don't exist
     */
    private async ensureDirectories(): Promise<void> {
        await fs.mkdir(this.sourceDir, { recursive: true })
        await fs.mkdir(this.shapesDir, { recursive: true })
        await fs.mkdir(this.transformsDir, { recursive: true })
        console.log('[LocalAdapter] Storage directories ready')
    }

    /**
     * Check if URL is a local storage URL
     */
    canHandle(url: string): boolean {
        try {
            const urlObj = new URL(url)
            // Handle local URLs like /api/images/local/{filename}
            return urlObj.pathname.startsWith('/api/images/local/')
        } catch {
            // Handle relative paths like /api/images/local/{filename}
            return url.startsWith('/api/images/local/')
        }
    }

    /**
     * Generate unique filename based on xmlid and original extension
     * Format: {xmlid}.{ext} (e.g., tp.image.child-marie_2024.jpg)
     */
    private generateFilename(xmlid: string, originalFilename: string): string {
        const ext = path.extname(originalFilename).toLowerCase() || '.jpg'
        return `${xmlid}${ext}`
    }

    /**
     * Generate shape filename
     * Format: {xmlid}_{shape}.webp (e.g., tp.image.child-marie_2024_square.webp)
     */
    private generateShapeFilename(xmlid: string, shape: string): string {
        return `${xmlid}_${shape}.webp`
    }

    /**
     * Store uploaded file to source directory
     */
    async storeSourceFile(
        fileBuffer: Buffer,
        xmlid: string,
        originalFilename: string
    ): Promise<string> {
        const filename = this.generateFilename(xmlid, originalFilename)
        const filepath = path.join(this.sourceDir, filename)

        await fs.writeFile(filepath, fileBuffer)
        console.log(`[LocalAdapter] Stored source file: ${filename}`)

        // Return URL path for database
        return `/api/images/local/source/${filename}`
    }

    /**
     * Generate all shape variants using Sharp
     * Uses entropy cropping for most shapes, attention for thumb
     */
    async generateShapes(
        sourceFilepath: string,
        xmlid: string
    ): Promise<{
        square: string
        thumb: string
        wide: string
        vertical: string
    }> {
        const shapes = ['square', 'thumb', 'wide', 'vertical'] as const
        const results: Record<string, string> = {}

        for (const shape of shapes) {
            const shapeUrl = await this.generateShape(sourceFilepath, xmlid, shape)
            results[shape] = shapeUrl
        }

        return results as any
    }

    /**
     * Generate single shape with smart cropping
     */
    private async generateShape(
        sourceFilepath: string,
        xmlid: string,
        shape: 'square' | 'thumb' | 'wide' | 'vertical'
    ): Promise<string> {
        const { width, height } = this.DIMENSIONS[shape]
        const filename = this.generateShapeFilename(xmlid, shape)
        const outputPath = path.join(this.shapesDir, filename)

        // Strategy selection: attention for thumb, entropy for others
        const strategy = shape === 'thumb' ? sharp.strategy.attention : sharp.strategy.entropy

        await sharp(sourceFilepath)
            .resize(width, height, {
                fit: 'cover',
                position: strategy
            })
            .webp({ quality: 85, effort: 4 })
            .toFile(outputPath)

        console.log(`[LocalAdapter] Generated ${shape} shape: ${filename}`)
        return `/api/images/local/shapes/${filename}`
    }

    /**
     * Generate shape with XYZ focal point transformation
     * For testing and debugging XYZ transformations in ShapeEditor
     * 
     * @param sourceFilepath Path to source image
     * @param xmlid Image identifier
     * @param shape Shape type
     * @param x Horizontal focal point (0-100)
     * @param y Vertical focal point (0-100)
     * @param z Zoom level (0-100, higher = more zoomed in)
     */
    async generateShapeWithXYZ(
        sourceFilepath: string,
        xmlid: string,
        shape: 'square' | 'thumb' | 'wide' | 'vertical',
        x: number,
        y: number,
        z: number
    ): Promise<string> {
        const { width: targetW, height: targetH } = this.DIMENSIONS[shape]
        const filename = this.generateShapeFilename(xmlid, `${shape}_xyz_${x}_${y}_${z}`)
        const outputPath = path.join(this.transformsDir, filename)

        // Load source image and get metadata
        const image = sharp(sourceFilepath)
        const metadata = await image.metadata()

        if (!metadata.width || !metadata.height) {
            throw new Error('Could not read image dimensions')
        }

        // Calculate focal point in pixels
        const focalX = Math.round((x / 100) * metadata.width)
        const focalY = Math.round((y / 100) * metadata.height)

        // Calculate zoom (shrink multiplier)
        // z=100 → shrink=1.0 (no zoom, widest view)
        // z=50 → shrink=2.0 (2x zoom)
        // z=25 → shrink=4.0 (4x zoom)
        const shrinkMultiplier = 100 / z

        // Calculate extraction region dimensions
        const extractW = Math.round(targetW * shrinkMultiplier)
        const extractH = Math.round(targetH * shrinkMultiplier)

        // Center extraction region on focal point
        let left = Math.round(focalX - extractW / 2)
        let top = Math.round(focalY - extractH / 2)

        // Clamp to image boundaries
        left = Math.max(0, Math.min(left, metadata.width - extractW))
        top = Math.max(0, Math.min(top, metadata.height - extractH))

        // Extract region and resize to target dimensions
        await sharp(sourceFilepath)
            .extract({
                left,
                top,
                width: Math.min(extractW, metadata.width - left),
                height: Math.min(extractH, metadata.height - top)
            })
            .resize(targetW, targetH, { fit: 'cover' })
            .webp({ quality: 85, effort: 4 })
            .toFile(outputPath)

        console.log(`[LocalAdapter] Generated XYZ shape: ${filename} (focal: ${x},${y}, zoom: ${z})`)
        return `/api/images/local/transforms/${filename}`
    }

    /**
     * Fetch metadata for local images
     * For local adapter, metadata is provided from temp storage during upload
     */
    async fetchMetadata(url: string, batchData?: ImageImportBatch): Promise<MediaMetadata> {
        // Check if we have temp metadata from upload process
        if ((this as any)._tempMetadata) {
            const temp = (this as any)._tempMetadata

            // Create shape objects with blur hashes
            const shapeSquare: any = temp.shapeUrls ? {
                url: temp.shapeUrls.square,
                blur: temp.shapeBlurs?.square || null
            } : undefined

            const shapeThumb: any = temp.shapeUrls ? {
                url: temp.shapeUrls.thumb,
                blur: temp.shapeBlurs?.thumb || null
            } : undefined

            const shapeWide: any = temp.shapeUrls ? {
                url: temp.shapeUrls.wide,
                blur: temp.shapeBlurs?.wide || null
            } : undefined

            const shapeVertical: any = temp.shapeUrls ? {
                url: temp.shapeUrls.vertical,
                blur: temp.shapeBlurs?.vertical || null
            } : undefined

            return {
                url: temp.url,
                name: temp.name,
                alt_text: batchData?.alt_text || undefined,
                title: undefined,
                x: temp.width,
                y: temp.height,
                fileformat: temp.format || 'none',
                license: batchData?.license || 'BY',
                geo: undefined,
                date: undefined,
                about: undefined,
                author: {
                    adapter: 'local',
                    file_id: temp.name,
                    account_id: undefined,
                    folder_id: undefined,
                    info: `Local upload: ${temp.name}`,
                    config: undefined
                },
                shape_square: shapeSquare,
                shape_thumb: shapeThumb,
                shape_wide: shapeWide,
                shape_vertical: shapeVertical
            }
        }

        // Fallback: extract filename and read from filesystem
        const filename = path.basename(url)
        const filepath = path.join(this.sourceDir, filename)

        try {
            const metadata = await sharp(filepath).metadata()

            return {
                url,
                name: filename,
                alt_text: batchData?.alt_text || undefined,
                title: undefined,
                x: metadata.width,
                y: metadata.height,
                fileformat: metadata.format || 'none',
                license: batchData?.license || 'BY',
                geo: undefined,
                date: undefined,
                about: undefined,
                author: {
                    adapter: 'local',
                    file_id: filename,
                    account_id: undefined,
                    folder_id: undefined,
                    info: `Uploaded to local storage`,
                    config: undefined
                }
            }
        } catch (error) {
            throw new Error(`Failed to read local image metadata: ${error}`)
        }
    }

    /**
     * Import uploaded file with shape generation
     * This is the main entry point for local image uploads
     */
    async importUploadedFile(
        fileBuffer: Buffer,
        originalFilename: string,
        batchData: ImageImportBatch & {
            xmlid: string // Required for local uploads
        }
    ): Promise<{ imageId: number; urls: Record<string, string> }> {
        // Store source file
        const sourceUrl = await this.storeSourceFile(
            fileBuffer,
            batchData.xmlid,
            originalFilename
        )

        // Generate shapes
        const sourceFilepath = path.join(
            this.sourceDir,
            this.generateFilename(batchData.xmlid, originalFilename)
        )

        const shapeUrls = await this.generateShapes(sourceFilepath, batchData.xmlid)

        // Get image metadata for temp storage
        const metadata = await sharp(sourceFilepath).metadata()

        // Generate URL for base adapter
        const generatedFilename = this.generateFilename(batchData.xmlid, originalFilename)
        const uploadUrl = '/api/images/local/source/' + generatedFilename

        // Generate BlurHashes from local files (not URLs)
        // Temporarily disabled for debugging
        const shapeBlurs: Record<string, string | null> = {
            square: null,
            thumb: null,
            wide: null,
            vertical: null
        }

        /*
        console.log('[LocalAdapter] Generating BlurHashes for shapes...')
        const { generateBlurHash } = await import('../utils/blurhash')
        for (const [shapeName, shapeUrl] of Object.entries(shapeUrls)) {
            // Read shape file from disk
            const shapeFilename = this.generateShapeFilename(batchData.xmlid, shapeName)
            const shapeFilepath = path.join(this.shapesDir, shapeFilename)
            try {
                const shapeBuffer = await fs.readFile(shapeFilepath)
                console.log(`[LocalAdapter] Generating blur for ${shapeName} (${shapeBuffer.length} bytes)`)
                const blur = await generateBlurHash(shapeBuffer, {
                    componentX: 4, componentY: 3, width: 32, height: 32
                })
                shapeBlurs[shapeName] = blur
                console.log(`[LocalAdapter] ✓ Blur generated for ${shapeName}: ${blur?.substring(0, 20)}...`)
            } catch (err) {
                console.warn(`[LocalAdapter] Failed to generate blur for ${shapeName}:`, err)
                shapeBlurs[shapeName] = null
            }
        }
        console.log('[LocalAdapter] BlurHash generation complete')
        */

        // Store metadata temporarily for fetchMetadata
        const tempMetadata = {
            url: sourceUrl,
            name: originalFilename,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            shapeUrls,
            shapeBlurs
        };
        (this as any)._tempMetadata = tempMetadata

        try {
            // Use base adapter import flow
            const result = await this.importImage(uploadUrl, batchData)

            return {
                imageId: result.image_id!,
                urls: {
                    source: sourceUrl,
                    ...shapeUrls
                }
            }
        } finally {
            // Clean up temp metadata
            delete (this as any)._tempMetadata
        }
    }

    /**
     * Get absolute filepath for serving
     */
    getFilepath(urlPath: string): string {
        // urlPath format: /api/images/local/{subdir}/{filename}
        // Extract subdir and filename
        const match = urlPath.match(/\/api\/images\/local\/([^/]+)\/(.+)/)
        if (!match) {
            throw new Error(`Invalid local image URL: ${urlPath}`)
        }

        const [, subdir, filename] = match

        switch (subdir) {
            case 'source':
                return path.join(this.sourceDir, filename)
            case 'shapes':
                return path.join(this.shapesDir, filename)
            case 'transforms':
                return path.join(this.transformsDir, filename)
            default:
                throw new Error(`Invalid local image subdirectory: ${subdir}`)
        }
    }
}
