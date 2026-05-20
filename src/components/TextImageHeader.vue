<template>
    <div class="text-image-header" :class="[
        `text-image-header-${headerSize}`,
        `text-image-header-align-${contentAlignY}`
    ]">
        <div class="text-image-grid">
            <!-- Text Column (Left on desktop, bottom on mobile) -->
            <div class="text-image-content">
                <slot />
            </div>

            <!-- Image Column (Right on desktop, top on mobile) -->
            <div class="text-image-media">
                <div v-if="backgroundImage" class="text-image-media-inner" :style="{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }"></div>
                <slot v-else name="media" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, type PropType } from 'vue'
import type { ImageApiResponse, ShapeData } from '@/composables/useImageFetch'

const props = defineProps({
    /**
     * Header size - aligns with Odoo header_size values
     * @default 'prominent'
     */
    headerSize: {
        type: String as PropType<'full' | 'prominent' | 'medium' | 'mini'>,
        default: 'prominent',
    },

    /**
     * Legacy image URL fallback
     */
    imgTmp: {
        type: String,
    },

    /**
     * Image data object with shape instances
     */
    imageData: {
        type: Object as PropType<ImageApiResponse | null>,
        default: null,
    },

    /**
     * Vertical alignment of content
     */
    contentAlignY: {
        type: String as PropType<'top' | 'bottom' | 'center'>,
        default: 'center',
    },
})

// Background image URL
const backgroundImage = ref('')

// Get the best shape instance for columns layout
const bestShapeInstance = computed((): ShapeData | null => {
    if (!props.imageData) return null

    // Columns layout prefers vertical or square shapes
    // Priority: hero_vertical > hero_square > hero_square_xl > hero_wide
    const shapes: (ShapeData | undefined)[] = [
        props.imageData.hero_vertical,
        props.imageData.hero_square,
        props.imageData.hero_square_xl,
        props.imageData.hero_wide,
        props.imageData.hero_wide_xl,
        // Fallback to shape templates
        props.imageData.shape_vertical,
        props.imageData.shape_square,
        props.imageData.shape_wide
    ]

    // Return first shape with a URL
    for (const shape of shapes) {
        if (shape?.url) return shape
    }

    return null
})

// Build optimized image URL
function buildImageUrl(shape: { url: string; width?: number; height?: number }, targetWidth: number, targetHeight: number): string {
    const baseUrl = shape.url

    // If URL contains transformation parameters, respect them
    if (baseUrl.includes('/cloudinary/') || baseUrl.includes('cloudinary.com')) {
        // Cloudinary: inject size transformation
        return baseUrl.replace(/\/upload\//, `/upload/w_${targetWidth},h_${targetHeight},c_fill/`)
    }

    // Local adapter: append size params if not present
    if (baseUrl.includes('?')) {
        return `${baseUrl}&w=${targetWidth}&h=${targetHeight}`
    }
    return `${baseUrl}?w=${targetWidth}&h=${targetHeight}`
}

// Initialize and load image
function initializeImage() {
    // Start with imgTmp fallback if no image data
    if (props.imgTmp) {
        backgroundImage.value = props.imgTmp
    }

    const shape = bestShapeInstance.value
    if (shape?.url) {
        // Target dimensions for columns layout (half viewport width)
        const targetWidth = 800
        const targetHeight = 1000
        const imageUrl = buildImageUrl(shape, targetWidth, targetHeight)

        // Preload and swap
        const img = new Image()
        img.onload = () => {
            backgroundImage.value = imageUrl
        }
        img.onerror = () => {
            // Keep BlurHash or fallback to imgTmp
            if (props.imgTmp) {
                backgroundImage.value = props.imgTmp
            }
        }
        img.src = imageUrl
    }
}

// Watch for image data changes
watch(() => props.imageData, initializeImage, { immediate: true })
watch(() => props.imgTmp, initializeImage)

onMounted(initializeImage)
</script>

<style scoped>
.text-image-header {
    position: relative;
    width: 100%;
    overflow: hidden;
}

/* Height variants matching Odoo header_size */
.text-image-header-full {
    min-height: 100vh;
}

.text-image-header-prominent {
    min-height: 75vh;
}

.text-image-header-medium {
    min-height: 50vh;
}

.text-image-header-mini {
    min-height: 25vh;
}

.text-image-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    height: 100%;
    min-height: inherit;
}

/* Mobile: Stack columns, image on top */
@media (max-width: 767px) {
    .text-image-grid {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }

    .text-image-content {
        order: 2;
    }

    .text-image-media {
        order: 1;
        min-height: 40vh;
    }

    /* Reduce heights on mobile */
    .text-image-header-full,
    .text-image-header-prominent {
        min-height: auto;
    }
}

.text-image-content {
    display: flex;
    flex-direction: column;
    padding: 2rem;
    position: relative;
    z-index: 1;
    background: var(--color-background, #fff);
}

/* Content vertical alignment */
.text-image-header-align-top .text-image-content {
    justify-content: flex-start;
}

.text-image-header-align-center .text-image-content {
    justify-content: center;
}

.text-image-header-align-bottom .text-image-content {
    justify-content: flex-end;
}

.text-image-media {
    position: relative;
    overflow: hidden;
}

.text-image-media-inner {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    transition: background-image 0.3s ease-in-out;
}

/* Mobile adjustments */
@media (max-width: 767px) {
    .text-image-content {
        padding: 1.5rem;
    }
}

/* Large screens: slightly larger content padding */
@media (min-width: 1200px) {
    .text-image-content {
        padding: 3rem 4rem;
    }
}
</style>
