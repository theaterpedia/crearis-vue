<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useBlurHash } from '@/composables/useBlurHash'

export interface ImgShapeData {
    type?: 'url' | 'params' | 'json'
    url?: string
    x?: number | null
    y?: number | null
    z?: number | null
    options?: Record<string, any> | null
    blur?: string
    turl?: string
    tpar?: string
}

interface Props {
    data: ImgShapeData
    shape: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    adapter?: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
    forceBlur?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    adapter: 'detect',
    forceBlur: false
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

    // Avatar is always square (4rem = 64px)
    // Note: Avatar/Thumb are synonymous but separate from square due to different zoom/focal points
    if (shape === 'avatar') {
        const w = avatarWidth.value
        return w ? [w, w] : null
    }

    // Tile dimensions
    if (shape === 'tile') {
        const w = tileWidth.value
        const h = tileHeight.value
        if (!w || !h) return null

        // tile-height-square: 8rem = 128px (same as tile-width)
        if (variant === 'square') return [w, w]
        if (variant === 'wide') return [w * 2, h]
        return [w, h] // default
    }

    // Card dimensions
    if (shape === 'card') {
        const w = cardWidth.value
        const h = cardHeight.value
        if (!w || !h) return null

        // For card square, use tile-height-square (8rem = 128px), not card-width
        if (variant === 'square') return [128, 128]
        // Card wide: card-width × card-height-min (21rem × 10.5rem = 336px × 168px)
        // Using cardHeight * 0.75 to get 168px from 224px
        if (variant === 'wide') return [w, Math.round(h * 0.75)]
        // Card vertical: 9:16 aspect ratio × card-height (7.875rem × 14rem = 126px × 224px)
        if (variant === 'vertical') return [Math.round(h * 9 / 16), h]
        return [w, Math.round(h * 0.75)] // default = wide
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

// BlurHash placeholder
const imageLoaded = ref(false)
const showPlaceholder = computed(() => {
    // Debug: Log blur hash presence
    if (props.data.blur && import.meta.env.DEV) {
        console.log(`[ImgShape] blur hash present for ${props.shape}-${props.variant}:`, props.data.blur.substring(0, 20) + '...')
        console.log(`[ImgShape] showPlaceholder check: imageLoaded=${imageLoaded.value}, forceBlur=${props.forceBlur}, isDecoded=${isDecoded.value}`)
    }
    // If forceBlur is true, always show placeholder (if blur exists)
    if (props.forceBlur && props.data.blur) return true
    // Otherwise, show placeholder only while image is loading
    const result = !imageLoaded.value && !!props.data.blur
    if (result && import.meta.env.DEV) {
        console.log(`[ImgShape] ✅ Showing placeholder for ${props.shape}-${props.variant}`)
    }
    return result
})

// Reset imageLoaded when URL changes
watch(() => props.data.url, (newUrl) => {
    console.log(`[ImgShape] URL changed for ${props.shape}-${props.variant}, resetting imageLoaded. New URL:`, newUrl?.substring(0, 50))
    imageLoaded.value = false
}, { immediate: true })
const { canvasRef, isDecoded } = useBlurHash({
    hash: computed(() => props.data.blur || ''),
    width: 32,
    height: 32
})

const onImageLoad = () => {
    console.log(`[ImgShape] Image loaded for ${props.shape}-${props.variant}`)
    imageLoaded.value = true
}

/**
 * Emit the constructed URL whenever it changes
 */
watch(displayUrl, (url: string) => {
    if (url) {
        emit('shapeUrl', url)
    }
}, { immediate: true })

// Expose a small API so parent components can query current preview/settings
// without duplicating state in the parent. Returns the effective display URL
// and any focal-point params (x/y/z) parsed from the URL (if present).
function getPreviewData() {
    const result: any = {
        url: displayUrl.value || null,
        originalUrl: props.data?.url || null,
        adapter: props.data?.adapter || null,
        shape: props.shape || null,
        variant: props.variant || null,
        params: {
            x: null,
            y: null,
            z: null,
        },
    }

    try {
        // Use a base origin so URL parsing doesn't fail for relative/odd strings
        const u = new URL(displayUrl.value || props.data?.url || '', window.location.origin)
        const sp = u.searchParams
        const fpX = sp.get('fp-x')
        const fpY = sp.get('fp-y')
        const fpZ = sp.get('fp-z')

        if (fpX != null) {
            const n = parseFloat(fpX)
            if (!isNaN(n)) result.params.x = Math.round(n * 100)
        }
        if (fpY != null) {
            const n = parseFloat(fpY)
            if (!isNaN(n)) result.params.y = Math.round(n * 100)
        }
        if (fpZ != null) {
            const n = parseFloat(fpZ)
            if (!isNaN(n)) {
                result.params.z = Math.round((n - 1) * 100)
            }
        }
    } catch (e) {
        // ignore URL parse failures
    }

    return result
}

// Make the getter available to parent via template ref
// (used by ImagesCoreAdmin to read current preview/state from each ImgShape)
// @ts-ignore - defineExpose available in script setup
defineExpose({ getPreviewData })
</script>

<template>
    <div class="img-shape-wrapper">
        <canvas v-if="showPlaceholder" ref="canvasRef" class="img-shape-placeholder" />
        <img v-if="displayUrl && !forceBlur" :src="displayUrl" :alt="altText" :class="cssClasses"
            :style="{ opacity: imageLoaded ? 1 : 0 }" @load="onImageLoad" />
    </div>
</template>

<style scoped>
.img-shape-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.img-shape-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    filter: blur(10px);
    z-index: 1;
}

.img-shape {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease-in-out;
    position: relative;
    z-index: 2;
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
