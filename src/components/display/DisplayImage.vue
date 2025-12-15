<template>
    <figure class="display-image" :class="[
        `display-image--padding-${padding}`,
        `display-image--bg-${background}`,
        `display-image--placement-${placement}`,
        isColumn && 'display-image--column',
        isLoading && 'display-image--loading',
        hasError && 'display-image--error'
    ]">
        <!-- BlurHash canvas (hidden, used for placeholder) -->
        <canvas ref="canvasRef" :width="32" :height="32" style="display: none;" />

        <!-- Image container with aspect ratio -->
        <div class="display-image__container" :style="{ aspectRatio: '531 / 300' }">
            <!-- BlurHash placeholder -->
            <div v-if="isLoading && blurHashUrl" class="display-image__placeholder"
                :style="{ backgroundImage: `url(${blurHashUrl})` }" />

            <!-- Loading spinner (fallback when no BlurHash) -->
            <div v-else-if="isLoading" class="display-image__spinner">
                <span class="display-image__spinner-icon">⏳</span>
            </div>

            <!-- Error state -->
            <div v-else-if="hasError" class="display-image__error-message">
                <span class="display-image__error-icon">⚠️</span>
                <span>{{ errorMessage }}</span>
            </div>

            <!-- Actual image -->
            <img v-show="!isLoading && !hasError" :src="imageUrl" :alt="altText" class="display-image__img"
                @load="onImageLoad" @error="onImageError" />
        </div>

        <!-- Caption: Author overlay (bottom-right) -->
        <div v-if="caption === 'author' || caption === 'full'" class="display-image__author-overlay">
            <a v-if="authorUri" :href="authorUri" target="_blank" rel="noopener noreferrer"
                class="display-image__author-link">
                {{ authorName }}
            </a>
            <span v-else class="display-image__author-text">
                {{ authorName }}
            </span>
        </div>

        <!-- Caption: Description (below image) -->
        <figcaption v-if="(caption === 'description' || caption === 'full') && altText" class="display-image__caption">
            {{ altText }}
        </figcaption>
    </figure>
</template>

<script setup lang="ts">
/**
 * DisplayImage Component
 * 
 * Displays images fetched by xmlid using the display_wide shape instance (531×300).
 * Used for in-content image display with float behavior.
 * 
 * @example
 * ```vue
 * <DisplayImage 
 *   xmlid="tp.image.landscape-001"
 *   placement="left"
 *   caption="author"
 * />
 * ```
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useBlurHash } from '@/composables/useBlurHash'
import { useImageFetch, type ImageApiResponse, type ShapeData } from '@/composables/useImageFetch'

interface Props {
    /** Image identifier for API fetch */
    xmlid: string
    /** Padding around the image */
    padding?: 'none' | 'small' | 'medium' | 'large'
    /** Background style */
    background?: 'inherit' | 'standard' | 'muted' | 'accent'
    /** Caption display mode */
    caption?: 'none' | 'author' | 'description' | 'full'
    /** Float placement (desktop only) */
    placement?: 'left' | 'lefttop' | 'leftbottom' | 'right' | 'righttop' | 'rightbottom'
    /** Whether component is inside Columns.vue (100% width) */
    isColumn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    padding: 'none',
    background: 'inherit',
    caption: 'none',
    placement: 'left',
    isColumn: false
})

// Use shared composable for image fetching
const { imageData, isLoading, hasError, errorMessage, fetchImage } = useImageFetch()

// Computed values
const shapeData = computed(() => (imageData.value as any)?.display_wide as ShapeData | null || null)

const imageUrl = computed(() => shapeData.value?.url || '')

const altText = computed(() => imageData.value?.alt_text || props.xmlid)

const authorName = computed(() => imageData.value?.author?.name || 'Unknown')

const authorUri = computed(() => imageData.value?.author?.uri || null)

// BlurHash support
const { canvasRef, isDecoded } = useBlurHash({
    hash: computed(() => shapeData.value?.blur || ''),
    width: 32,
    height: 18  // Match 531:300 aspect ratio approximately
})

const blurHashUrl = computed(() => {
    if (isDecoded.value && canvasRef.value) {
        try {
            return canvasRef.value.toDataURL('image/png')
        } catch (e) {
            console.error('[DisplayImage] BlurHash canvas error:', e)
        }
    }
    return null
})

// Fetch image data by xmlid
async function fetchImageByXmlid() {
    if (!props.xmlid) {
        return
    }

    const result = await fetchImage({ xmlid: props.xmlid })

    // If no display_wide shape, mark as error
    if (result && !(result as any).display_wide) {
        // Note: error state is managed by composable, but we need additional check
        console.warn('[DisplayImage] display_wide shape not available for:', props.xmlid)
    }
}

// Image event handlers
function onImageLoad() {
    isLoading.value = false
}

function onImageError() {
    isLoading.value = false
}

// Fetch on mount and when xmlid changes
onMounted(fetchImageByXmlid)
watch(() => props.xmlid, fetchImageByXmlid)
</script>

<style scoped>
.display-image {
    margin: 0;
    max-width: 100%;
}

/* Responsive width behavior */
@media (min-width: 768px) {
    .display-image {
        width: 50%;
    }

    .display-image--column {
        width: 100%;
    }
}

/* Placement (float) */
.display-image--placement-left,
.display-image--placement-lefttop,
.display-image--placement-leftbottom {
    float: left;
    margin-right: 1rem;
    margin-bottom: 1rem;
}

.display-image--placement-right,
.display-image--placement-righttop,
.display-image--placement-rightbottom {
    float: right;
    margin-left: 1rem;
    margin-bottom: 1rem;
}

/* Padding */
.display-image--padding-none {
    padding: 0;
}

.display-image--padding-small {
    padding: 0.5rem;
}

.display-image--padding-medium {
    padding: 1rem;
}

.display-image--padding-large {
    padding: 1.5rem;
}

/* Background */
.display-image--bg-inherit {
    background: inherit;
}

.display-image--bg-standard {
    background: var(--color-background, #fff);
}

.display-image--bg-muted {
    background: var(--color-background-muted, #f5f5f5);
}

.display-image--bg-accent {
    background: var(--color-accent-light, #e3f2fd);
}

/* Container */
.display-image__container {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 0.25rem;
}

/* Placeholder */
.display-image__placeholder {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(10px);
    transform: scale(1.1);
}

/* Spinner */
.display-image__spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-muted, #f5f5f5);
}

.display-image__spinner-icon {
    font-size: 1.5rem;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Error */
.display-image__error-message {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--color-background-muted, #f5f5f5);
    color: var(--color-text-muted, #666);
    font-size: 0.875rem;
}

.display-image__error-icon {
    font-size: 1.5rem;
}

/* Image */
.display-image__img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
}

/* Author overlay */
.display-image__author-overlay {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    color: white;
}

.display-image__author-link {
    color: white;
    text-decoration: none;
}

.display-image__author-link:hover {
    text-decoration: underline;
}

/* Caption */
.display-image__caption {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted, #666);
    font-style: italic;
}
</style>
