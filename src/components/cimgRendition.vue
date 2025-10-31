<template>
    <div class="cimg-rendition" :class="renditionClass">
        <img v-if="imageSrc" :src="imageSrc" :alt="alt || image?.alt_text || image?.name || ''"
            :title="image?.title || image?.name" :class="imageClass" @error="handleImageError"
            @load="handleImageLoad" />
        <div v-else-if="!loading" class="fallback">
            <slot name="fallback">
                <div class="fallback-icon">📷</div>
                <div class="fallback-text">{{ fallbackText }}</div>
            </slot>
        </div>
        <div v-if="loading" class="loading">
            <slot name="loading">
                <div class="loading-spinner"></div>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * CimgRendition Component
 * 
 * Displays images with proper renditions (avatar/card/hero) and fallback handling
 * Supports crop coordinates (x, y, z) for each rendition type
 */

interface ImageData {
    id: number
    url: string
    name: string
    alt_text?: string | null
    title?: string | null
    // Avatar crop coordinates
    av_x?: number | null
    av_y?: number | null
    av_z?: number | null
    // Card crop coordinates
    ca_x?: number | null
    ca_y?: number | null
    ca_z?: number | null
    // Hero crop coordinates
    he_x?: number | null
    he_y?: number | null
    he_z?: number | null
}

interface Props {
    image?: ImageData | null
    imageId?: number | null
    rendition?: 'avatar' | 'card' | 'hero'
    alt?: string
    fallbackText?: string
    autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    rendition: 'card',
    fallbackText: 'No image',
    autoLoad: true
})

const loading = ref(false)
const error = ref(false)

// Rendition dimensions (matching server/utils/image-helpers.ts)
const dimensions = {
    avatar: { width: 64, height: 64 },
    card: { width: 320, height: 180 },
    hero: { width: 1280, height: 720 }
}

// Get crop coordinates for current rendition
const cropCoords = computed(() => {
    if (!props.image) return null

    const prefix = props.rendition === 'avatar' ? 'av' : props.rendition === 'card' ? 'ca' : 'he'

    return {
        x: props.image[`${prefix}_x` as keyof ImageData] as number | null | undefined,
        y: props.image[`${prefix}_y` as keyof ImageData] as number | null | undefined,
        z: props.image[`${prefix}_z` as keyof ImageData] as number | null | undefined
    }
})

// Build image src with query parameters
const imageSrc = computed(() => {
    if (!props.image?.url) return null
    if (error.value) return null

    const url = new URL(props.image.url, window.location.origin)
    const dims = dimensions[props.rendition]

    url.searchParams.set('w', dims.width.toString())
    url.searchParams.set('h', dims.height.toString())

    const coords = cropCoords.value
    if (coords?.x !== null && coords?.x !== undefined) {
        url.searchParams.set('x', coords.x.toString())
    }
    if (coords?.y !== null && coords?.y !== undefined) {
        url.searchParams.set('y', coords.y.toString())
    }
    if (coords?.z !== null && coords?.z !== undefined) {
        url.searchParams.set('z', coords.z.toString())
    }

    return url.toString()
})

// CSS classes
const renditionClass = computed(() => `rendition-${props.rendition}`)
const imageClass = computed(() => ({
    loading: loading.value,
    error: error.value
}))

// Event handlers
const handleImageError = () => {
    error.value = true
    loading.value = false
}

const handleImageLoad = () => {
    loading.value = false
    error.value = false
}

// Load image from API if imageId provided
const loadImage = async () => {
    if (!props.imageId) return

    loading.value = true
    try {
        const response = await fetch(`/api/images/${props.imageId}`)
        if (!response.ok) throw new Error('Failed to load image')

        // Image data would be loaded into props.image via parent component
        // This is just a placeholder for the loading logic
    } catch (err) {
        console.error('Error loading image:', err)
        error.value = true
    } finally {
        loading.value = false
    }
}

// Watch for imageId changes
watch(() => props.imageId, () => {
    if (props.autoLoad && props.imageId && !props.image) {
        loadImage()
    }
}, { immediate: true })
</script>

<style scoped>
.cimg-rendition {
    position: relative;
    display: inline-block;
    overflow: hidden;
    background-color: var(--color-bg-secondary, #f3f4f6);
    border-radius: 0.375rem;
}

.rendition-avatar {
    width: var(--cimg-avatar-width, 64px);
    height: var(--cimg-avatar-height, 64px);
    border-radius: 50%;
}

.rendition-card {
    width: var(--cimg-card-width, 320px);
    height: var(--cimg-card-height, 180px);
}

.rendition-hero {
    width: var(--cimg-hero-width, 1280px);
    height: var(--cimg-hero-height, 720px);
    max-width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
}

img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.fallback,
.loading {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.fallback-icon {
    font-size: 2rem;
    opacity: 0.5;
}

.fallback-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
}

.loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border, #ddd);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
