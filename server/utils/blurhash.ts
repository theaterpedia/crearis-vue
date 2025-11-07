import { encode } from 'blurhash'
import sharp from 'sharp'

export interface BlurHashOptions {
    componentX?: number  // Default: 4 (horizontal detail)
    componentY?: number  // Default: 3 (vertical detail)
    width?: number       // Resize width before encoding (default: 32)
    height?: number      // Resize height before encoding (default: 32)
}

/**
 * Generate BlurHash from image URL or Buffer
 * 
 * @param input - Image URL (string) or Buffer
 * @param options - BlurHash generation options
 * @returns BlurHash string or null if generation fails
 */
export async function generateBlurHash(
    input: string | Buffer,
    options: BlurHashOptions = {}
): Promise<string | null> {
    try {
        const {
            componentX = 4,
            componentY = 3,
            width = 32,
            height = 32
        } = options

        // Download image if URL provided
        let imageBuffer: Buffer
        if (typeof input === 'string') {
            console.log(`[BlurHash] Fetching image: ${input}`)
            const response = await fetch(input)
            if (!response.ok) {
                console.error(`[BlurHash] Failed to fetch image: ${response.status}`)
                return null
            }
            imageBuffer = Buffer.from(await response.arrayBuffer())
        } else {
            imageBuffer = input
        }

        // Process image with Sharp
        const { data, info } = await sharp(imageBuffer)
            .resize(width, height, { fit: 'cover' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })

        // Generate BlurHash
        const hash = encode(
            new Uint8ClampedArray(data),
            info.width,
            info.height,
            componentX,
            componentY
        )

        console.log(`[BlurHash] Generated hash: ${hash}`)
        return hash
    } catch (error) {
        console.error('[BlurHash] Error generating hash:', error)
        return null
    }
}

/**
 * Generate BlurHash for all shape variants
 * Returns object with blur strings for each shape
 * 
 * @param imageUrl - URL of the image to encode
 * @returns Object with blur hashes for each shape variant
 */
export async function generateShapeBlurHashes(
    imageUrl: string
): Promise<{
    square?: string | null
    wide?: string | null
    vertical?: string | null
    thumb?: string | null
}> {
    // For now, use same BlurHash for all shapes
    // Future: Generate different hashes based on crop/aspect ratio
    const hash = await generateBlurHash(imageUrl, {
        componentX: 4,
        componentY: 3,
        width: 32,
        height: 32
    })

    return {
        square: hash,
        wide: hash,
        vertical: hash,
        thumb: hash
    }
}
