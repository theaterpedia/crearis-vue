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
    xmlid?: string  // For avatar shape detection
}

interface Props {
    data: ImgShapeData
    shape: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    adapter?: 'detect' | 'unsplash' | 'cloudinary' | 'vimeo' | 'none'
    forceBlur?: boolean
    editable?: boolean
    active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    adapter: 'detect',
    forceBlur: false,
    editable: false,
    active: false
})

const emit = defineEmits<{
    shapeUrl: [url: string]
    activate: [data: { shape: string, variant: string, adapter: string }]
}>()

// Error state
const hasError = ref(false)
const errorMessage = ref('')

// Preview state (internal to ImgShape - single source of truth)
const previewState = ref({
    url: '',
    params: {
        x: null as number | null,
        y: null as number | null,
        z: null as number | null
    },
    mode: 'original' as 'original' | 'preview' | 'saved'
})

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
 * Detect avatar shape (round vs square) based on xmlid
 * Square avatars used for: projects, events, locations, posts
 * Round avatars used for: users, instructors, people (default)
 */
const avatarShape = computed(() => {
    if (props.shape !== 'avatar') return null
    
    const xmlid = props.data.xmlid || ''
    const squarePatterns = ['project', 'event', 'location', 'post']
    const isSquare = squarePatterns.some(pattern => xmlid.toLowerCase().includes(pattern))
    
    return isSquare ? 'square' : 'round'
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
 * Validate dimensions
 * Dimensions must be known and valid for proper display
 */
const validateDimensions = () => {
    // Reset error state
    hasError.value = false
    errorMessage.value = ''
    
    // Check if dimensions can be calculated
    if (!dimensions.value) {
        hasError.value = true
        errorMessage.value = 'Unknown dimensions'
        return false
    }
    
    const [width, height] = dimensions.value
    
    // Validate width and height are positive
    if (width <= 0 || height <= 0) {
        hasError.value = true
        errorMessage.value = 'Invalid dimensions'
        return false
    }
    
    return true
}

// Validate on mount and when dimensions change
watch(dimensions, () => {
    validateDimensions()
}, { immediate: true })

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
    const classes = [
        'img-shape',
        `img-shape--${props.shape}`,
        `img-shape--${props.variant}`
    ]
    
    // Add avatar shape class
    if (props.shape === 'avatar' && avatarShape.value) {
        classes.push(`img-shape--avatar-${avatarShape.value}`)
    }
    
    return classes
})

// BlurHash placeholder
const imageLoaded = ref(false)

// Create a simple gray placeholder as data URL for error state
const defaultPlaceholderUrl = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
        <rect width="32" height="32" fill="#e0e0e0"/>
    </svg>
`)

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

// =====================================================================
// PREVIEW STATE MANAGEMENT - API for parent components
// =====================================================================

/**
 * Get current preview state data.
 * Returns url, params (x/y/z), and mode from internal state.
 * Parent components should use this instead of maintaining duplicate state.
 */
function getPreviewData() {
    return {
        url: previewState.value.url || displayUrl.value,
        originalUrl: props.data?.url || null,
        adapter: props.data?.adapter || null,
        shape: props.shape || null,
        variant: props.variant || null,
        params: { ...previewState.value.params },
        mode: previewState.value.mode
    }
}

/**
 * Reset preview state to original/empty.
 */
const resetPreview = () => {
    previewState.value.url = ''
    previewState.value.params.x = null
    previewState.value.params.y = null
    previewState.value.params.z = null
    previewState.value.mode = 'original'
}

/**
 * Update preview state (called by parent ShapeEditor).
 */
const updatePreview = (url: string, params: { x?: number | null, y?: number | null, z?: number | null }, mode: 'preview' | 'saved') => {
    previewState.value.url = url
    previewState.value.params.x = params.x ?? null
    previewState.value.params.y = params.y ?? null
    previewState.value.params.z = params.z ?? null
    previewState.value.mode = mode
}

// Make the API available to parent via template ref
// @ts-ignore - defineExpose available in script setup
defineExpose({ getPreviewData, resetPreview, updatePreview })

// =====================================================================
// EDITABLE MODE CLICK HANDLER
// =====================================================================

// Click handler for editable mode
const handleClick = () => {
    if (props.editable && !hasError.value) {
        emit('activate', {
            shape: props.shape,
            variant: props.variant || 'default',
            adapter: detectedAdapter.value
        })
    }
}
</script>

<template>
    <div 
        class="img-shape-wrapper" 
        :class="{ 
            'editable': editable, 
            'active': active,
            'has-error': hasError 
        }"
        @click="handleClick"
    >
        <!-- Error State: BlurHash + Overlay -->
        <div v-if="hasError" class="error-state">
            <canvas v-if="data.blur" ref="canvasRef" class="img-shape-placeholder" />
            <img v-else :src="defaultPlaceholderUrl" alt="Error" class="img-shape-placeholder" />
            <div class="error-overlay">
                <span class="error-text">Image-Shape-Error</span>
                <span class="error-detail">{{ errorMessage }}</span>
            </div>
        </div>
        
        <!-- Normal State -->
        <template v-else>
            <canvas v-if="showPlaceholder" ref="canvasRef" class="img-shape-placeholder" />
            <img v-if="displayUrl && !forceBlur" :src="displayUrl" :alt="altText" :class="cssClasses"
                :style="{ opacity: imageLoaded ? 1 : 0 }" @load="onImageLoad" />
        </template>
    </div>
</template>

<style scoped>
.img-shape-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.img-shape-wrapper.editable {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.img-shape-wrapper.editable:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.2);
}

.img-shape-wrapper.active {
    outline: 2px solid var(--color-primary-base);
    outline-offset: 2px;
}

.error-state {
    position: relative;
    width: 100%;
    height: 100%;
}

.error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(1 0 0 / 0.5); /* 50% opacity white */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
    z-index: 10;
}

.error-text {
    font-family: var(--headings);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-error-base);
    text-align: center;
}

.error-detail {
    font-size: 0.625rem;
    color: var(--color-text-dimmed);
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
}

.img-shape--avatar-round {
    border-radius: 50%;
}

.img-shape--avatar-square {
    border-radius: var(--radius-small);
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
