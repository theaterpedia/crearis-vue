<template>
    <figure class="display-banner" :class="[
        `display-banner--padding-${padding}`,
        `display-banner--bg-${background}`,
        isLoading && 'display-banner--loading',
        hasError && 'display-banner--error'
    ]">
        <!-- BlurHash canvas (hidden, used for placeholder) -->
        <canvas ref="canvasRef" :width="32" :height="8" style="display: none;" />

        <!-- Image container with 4:1 aspect ratio -->
        <div class="display-banner__container" :style="{ aspectRatio: '4 / 1' }">
            <!-- BlurHash placeholder -->
            <div v-if="isLoading && blurHashUrl" class="display-banner__placeholder"
                :style="{ backgroundImage: `url(${blurHashUrl})` }" />

            <!-- Loading spinner (fallback when no BlurHash) -->
            <div v-else-if="isLoading" class="display-banner__spinner">
                <span class="display-banner__spinner-icon">⏳</span>
            </div>

            <!-- Error state -->
            <div v-else-if="hasError" class="display-banner__error-message">
                <span class="display-banner__error-icon">⚠️</span>
                <span>{{ errorMessage }}</span>
            </div>

            <!-- Actual image -->
            <img v-show="!isLoading && !hasError" :src="imageUrl" :alt="altText" class="display-banner__img"
                @load="onImageLoad" @error="onImageError" />
        </div>

        <!-- Caption: Author (inline with description) -->
        <figcaption v-if="caption !== 'none'" class="display-banner__caption">
            <span v-if="caption === 'author' || caption === 'full'" class="display-banner__author">
                <a v-if="authorUri" :href="authorUri" target="_blank" rel="noopener noreferrer">
                    {{ authorName }}
                </a>
                <span v-else>{{ authorName }}</span>
            </span>

            <span v-if="(caption === 'description' || caption === 'full') && altText"
                class="display-banner__description">
                <template v-if="caption === 'full' && authorName"> · </template>
                {{ altText }}
            </span>
        </figcaption>
    </figure>
</template>

<script setup lang="ts">
/**
 * DisplayBanner Component
 * 
 * Displays images fetched by xmlid using the display_thumb_banner shape instance (1062×265.5).
 * Always full-width with 4:1 aspect ratio, used as thin banner separators.
 * 
 * @example
 * ```vue
 * <DisplayBanner 
 *   xmlid="tp.image.panorama-001"
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
    /** Padding around the banner */
    padding?: 'none' | 'small' | 'medium' | 'large'
    /** Background style */
    background?: 'inherit' | 'standard' | 'muted' | 'accent'
    /** Caption display mode */
    caption?: 'none' | 'author' | 'description' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
    padding: 'none',
    background: 'inherit',
    caption: 'none'
})

// Use shared composable for image fetching
const { imageData, isLoading, hasError, errorMessage, fetchImage } = useImageFetch()

// Computed values
const shapeData = computed(() => (imageData.value as any)?.display_thumb_banner as ShapeData | null || null)

const imageUrl = computed(() => shapeData.value?.url || '')

const altText = computed(() => imageData.value?.alt_text || props.xmlid)

const authorName = computed(() => imageData.value?.author?.name || 'Unknown')

const authorUri = computed(() => imageData.value?.author?.uri || null)

// BlurHash support
const { canvasRef, isDecoded } = useBlurHash({
    hash: computed(() => shapeData.value?.blur || ''),
    width: 32,
    height: 8  // Match 4:1 aspect ratio
})

const blurHashUrl = computed(() => {
    if (isDecoded.value && canvasRef.value) {
        try {
            return canvasRef.value.toDataURL('image/png')
        } catch (e) {
            console.error('[DisplayBanner] BlurHash canvas error:', e)
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

    // If no display_thumb_banner shape, mark as error
    if (result && !(result as any).display_thumb_banner) {
        console.warn('[DisplayBanner] display_thumb_banner shape not available for:', props.xmlid)
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
.display-banner {
    margin: 0;
    width: 100%;
}

/* Padding */
.display-banner--padding-none {
    padding: 0;
}

.display-banner--padding-small {
    padding: 0.5rem 0;
}

.display-banner--padding-medium {
    padding: 1rem 0;
}

.display-banner--padding-large {
    padding: 1.5rem 0;
}

/* Background */
.display-banner--bg-inherit {
    background: inherit;
}

.display-banner--bg-standard {
    background: var(--color-background, #fff);
}

.display-banner--bg-muted {
    background: var(--color-background-muted, #f5f5f5);
}

.display-banner--bg-accent {
    background: var(--color-accent-light, #e3f2fd);
}

/* Container - 4:1 aspect ratio */
.display-banner__container {
    position: relative;
    width: 100%;
    overflow: hidden;
}

/* Placeholder */
.display-banner__placeholder {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(10px);
    transform: scale(1.1);
}

/* Spinner */
.display-banner__spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-muted, #f5f5f5);
}

.display-banner__spinner-icon {
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
.display-banner__error-message {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--color-background-muted, #f5f5f5);
    color: var(--color-text-muted, #666);
    font-size: 0.875rem;
}

.display-banner__error-icon {
    font-size: 1.25rem;
}

/* Image */
.display-banner__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Caption */
.display-banner__caption {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #666);
    text-align: center;
}

.display-banner__author a {
    color: var(--color-text-muted, #666);
    text-decoration: none;
}

.display-banner__author a:hover {
    text-decoration: underline;
}

.display-banner__description {
    font-style: italic;
}
</style>
