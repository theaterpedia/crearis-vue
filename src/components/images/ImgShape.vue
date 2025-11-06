<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

export interface ImgShapeData {
    type?: 'url' | 'params' | 'json'
    url?: string
    x?: number | null
    y?: number | null
    z?: number | null
    options?: Record<string, any> | null
}

interface Props {
    data: ImgShapeData
    shape: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    adapter?: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    adapter: 'detect'
})

const emit = defineEmits<{
    shapeUrl: [url: string]
}>()

const { cardWidth, cardHeight, tileWidth, tileHeight, avatarWidth } = useTheme()

/**
 * Detect the image service adapter from URL
 */
const detectedAdapter = computed(() => {
    if (props.adapter !== 'detect') return props.adapter

    const url = props.data.url || ''
    if (!url) return 'none'

    if (url.includes('images.unsplash.com')) return 'unsplash'
    if (url.includes('res.cloudinary.com')) return 'cloudinary'
    if (url.includes('vimeo.com')) return 'vimeo'

    return 'none'
})

/**
 * Get dimensions based on shape and variant
 * Returns [width, height] in pixels
 */
const dimensions = computed<[number, number] | null>(() => {
    const shape = props.shape
    const variant = props.variant

    // Avatar is always square
    if (shape === 'avatar') {
        const w = avatarWidth.value
        return w ? [w, w] : null
    }

    // Tile dimensions
    if (shape === 'tile') {
        const w = tileWidth.value
        const h = tileHeight.value
        if (!w || !h) return null

        if (variant === 'square') return [w, w]
        if (variant === 'wide') return [w * 2, h]
        return [w, h] // default
    }

    // Card dimensions
    if (shape === 'card') {
        const w = cardWidth.value
        const h = cardHeight.value
        if (!w || !h) return null

        if (variant === 'square') return [w, w]
        if (variant === 'wide') return [w * 2, h]
        if (variant === 'vertical') return [w, h * 2]
        return [w, h] // default
    }

    return null
})

/**
 * Manipulate Unsplash URL to add/update crop parameters
 */
const unsplashUrl = computed(() => {
    const url = props.data.url || ''
    if (!url || !dimensions.value) return url

    const [width, height] = dimensions.value

    try {
        const urlObj = new URL(url)

        // If URL already has focal-point crop parameters (fp-x, fp-y, or fp-z),
        // don't override w, h, fit as they're already set correctly
        const hasFocalCrop = urlObj.searchParams.has('fp-x') ||
            urlObj.searchParams.has('fp-y') ||
            urlObj.searchParams.has('fp-z')

        if (hasFocalCrop) {
            // Focal-crop is already configured, return as-is
            return urlObj.toString()
        }

        // Set/update parameters for standard crop
        urlObj.searchParams.set('w', Math.round(width).toString())
        urlObj.searchParams.set('h', Math.round(height).toString())
        urlObj.searchParams.set('fit', 'crop')

        return urlObj.toString()
    } catch {
        // If URL parsing fails, return original
        return url
    }
})

/**
 * Manipulate Cloudinary URL to insert crop parameters
 * Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/v{version}/{path}
 * Example: https://res.cloudinary.com/little-papillon/image/upload/c_crop,h_224,w_336/v1234567890/folder/image.jpg
 */
const cloudinaryUrl = computed(() => {
    const url = props.data.url || ''
    if (!url || !dimensions.value) return url

    const [width, height] = dimensions.value
    const cloudId = import.meta.env.VITE_CLOUDINARY_ID || 'little-papillon'

    try {
        // Extract parts from URL
        // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations?}/v{version}/{path}
        const pattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(.*?)(\/v\d+\/.+)$/
        const match = url.match(pattern)

        if (!match) {
            // Try pattern without existing transformations
            const simplePattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload)(\/v\d+\/.+)$/
            const simpleMatch = url.match(simplePattern)

            if (simpleMatch) {
                // Insert transformations before /vXXXXXXXXXX/
                const [, base, rest] = simpleMatch
                const transformations = `c_crop,h_${Math.round(height)},w_${Math.round(width)}`
                return `${base}/${transformations}${rest}`
            }

            return url // Cannot parse, return original
        }

        // URL has existing transformations, replace them
        const [, base, , rest] = match
        const transformations = `c_crop,h_${Math.round(height)},w_${Math.round(width)}`
        return `${base}${transformations}${rest}`
    } catch {
        return url
    }
})

/**
 * Main display URL based on detected adapter
 */
const displayUrl = computed(() => {
    const adapter = detectedAdapter.value

    if (adapter === 'unsplash') return unsplashUrl.value
    if (adapter === 'cloudinary') return cloudinaryUrl.value
    if (adapter === 'vimeo') return props.data.url || '' // TODO: Vimeo thumbnail logic

    // For 'none' or when no URL, return original or empty
    return props.data.url || ''
})

/**
 * Alt text from options or fallback
 */
const altText = computed(() => {
    return props.data.options?.alt || `${props.shape} image`
})

/**
 * CSS classes based on shape
 */
const cssClasses = computed(() => {
    return [
        'img-shape',
        `img-shape--${props.shape}`,
        `img-shape--${props.variant}`
    ]
})

/**
 * Emit the constructed URL whenever it changes
 */
watch(displayUrl, (url: string) => {
    if (url) {
        emit('shapeUrl', url)
    }
}, { immediate: true })
</script>

<template>
    <img v-if="displayUrl" :src="displayUrl" :alt="altText" :class="cssClasses" />
</template>

<style scoped>
.img-shape {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.img-shape--card {
    width: var(--card-width);
    height: var(--card-height);
}

.img-shape--tile {
    width: var(--tile-width);
    height: var(--tile-height);
}

.img-shape--avatar {
    width: var(--avatar);
    height: var(--avatar);
    border-radius: 50%;
}

/* Variant overrides */
.img-shape--square.img-shape--card {
    width: var(--card-width);
    height: var(--card-width);
}

.img-shape--square.img-shape--tile {
    width: var(--tile-width);
    height: var(--tile-width);
}

.img-shape--wide.img-shape--card {
    width: var(--card-width);
    height: calc(var(--card-width) * 0.5);
}

.img-shape--wide.img-shape--tile {
    width: var(--tile-width);
    height: calc(var(--tile-width) * 0.5);
}

.img-shape--vertical.img-shape--card {
    width: var(--card-width);
    height: calc(var(--card-height) * 2);
}
</style>
