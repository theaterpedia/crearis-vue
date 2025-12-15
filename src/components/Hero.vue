<template>
  <div class="hero" :class="[
    target === 'page' ? `hero-${heightTmp}` : 'hero-mini card-hero',
    `hero-align-content-${contentAlignY}`,
    bottomline ? 'hero-bottomline' : '',
  ]" :style="contentType === 'left' ? 'padding-left: 0rem' : ''">
    <!-- Hidden canvas for BlurHash decoding -->
    <canvas ref="canvasRef" style="display: none;" />

    <div class="hero-cover">
      <div :class="target === 'page' ? 'hero-cover-image' : 'static-cover-image'" :style="{
        backgroundImage: `url(${computedBackgroundImage})`,
        backgroundPositionX:
          target === 'page'
            ? imgTmpAlignX === 'stretch'
              ? 'left'
              : imgTmpAlignX === 'cover'
                ? 'center'
                : imgTmpAlignX
            : 'center',
        backgroundPositionY:
          target === 'page'
            ? imgTmpAlignY === 'stretch'
              ? 'top'
              : imgTmpAlignY === 'cover'
                ? 'center'
                : imgTmpAlignY
            : 'center',
        backgroundSize:
          target === 'page'
            ? usesCoverSizing
              ? 'cover'
              : `${imgTmpAlignX === 'stretch' ? '100%' : 'auto'} ${imgTmpAlignY === 'stretch' ? '100%' : 'auto'}`
            : '500px',
      }">
        <div v-if="overlay" class="hero-cover-overlay" :style="{ background: overlay }"></div>
      </div>
    </div>

    <div class="hero-content" :class="[`hero-content-${contentWidth}`, `hero-content-${contentType}`]">
      <Container>
        <slot />
      </Container>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { PropType } from 'vue'
import Container from './Container.vue'
import { useBlurHash } from '@/composables/useBlurHash'
import { useImageFetch, type ImageApiResponse } from '@/composables/useImageFetch'
import { MOBILE_WIDTH_PX } from '@/composables/useTheme'
import {
  selectHeroInstance,
  getHeroInstanceDimensions,
  getHeroInstanceTemplate,
  type HeroInstance,
  type HeightTmp
} from '@/utils/selectHeroInstance'

// =====================================================================
// Hero Component with Instance-Based Image Selection
// 
// Uses selectHeroInstance() to choose optimal image size based on:
// - Current viewport dimensions
// - heightTmp prop value
// 
// Instance Selection:
// - Mobile (≤440px): hero_square or hero_vertical (prominent/full)
// - Tablet (441-768px): hero_square
// - Small Desktop (769-1100px): hero_wide
// - Large Desktop (1101-1440px): hero_wide_xl
// - XL Desktop (>1440px): hero_wide_xl or hero_square_xl (full + tall)
// =====================================================================

// =====================================================================
// Props Definition
// =====================================================================

const props = defineProps({
  /**
   * Defines the height of the hero.
   *
   * @default 'prominent'
   */
  heightTmp: {
    type: String as PropType<HeightTmp>,
    default: 'prominent',
  },

  /**
   * The URL of the image used as a background.
   * @deprecated Use `image` prop with shape system instead
   */
  imgTmp: {
    type: String,
  },

  /**
   * Image shapes data for responsive serving.
   * Now supports hero instances: hero_vertical, hero_square, hero_wide, etc.
   */
  image: {
    type: Object as PropType<{
      // Template shapes (for fallback)
      shape_vertical?: ShapeData
      shape_wide?: ShapeData
      shape_square?: ShapeData
      // Hero instances (preferred)
      hero_vertical?: ShapeData
      hero_square?: ShapeData
      hero_wide?: ShapeData
      hero_wide_xl?: ShapeData
      hero_square_xl?: ShapeData
    }>,
    default: undefined,
  },

  /**
   * Defines the horizontal placement of the background image.
   */
  imgTmpAlignX: {
    type: String as PropType<'left' | 'right' | 'center' | 'stretch' | 'cover'>,
    default: 'center',
  },

  /**
   * Defines the vertical placement of the background image.
   */
  imgTmpAlignY: {
    type: String as PropType<'top' | 'bottom' | 'center' | 'stretch' | 'cover'>,
    default: 'stretch',
  },

  /**
   * The CSS background of the overlay on top of the cover image.
   */
  overlay: {
    type: String,
  },

  /**
   * deactivates the bottom-line.
   */
  bottomline: {
    type: Boolean,
    default: false,
  },

  /**
   * Defines the width of the content.
   */
  contentWidth: {
    type: String as PropType<'short' | 'fixed' | 'full'>,
    default: 'short',
  },

  /**
   * Defines the vertical alignment of the content.
   */
  contentAlignY: {
    type: String as PropType<'top' | 'bottom' | 'center'>,
    default: 'bottom',
  },

  /**
   * makes hero cards-compatible if set to 'card'.
   */
  target: {
    type: String as PropType<'page' | 'card'>,
    default: 'page',
  },

  /**
   * Defines the padding of the content.
   *
   * - `text` - Applies standard padding like in sections.
   * - `banner` - Sticks the content to the edges on phone screens.
   * - `left` - Content aligned to the left with more padding on the right side.
   */
  contentType: {
    type: String as PropType<'text' | 'banner' | 'left'>,
    default: 'text',
  },

  /**
   * Gradient overlay type for the hero image.
   *
   * - `none` - No gradient overlay.
   * - `left-bottom` - Gradient from left bottom corner.
   */
  gradient_type: {
    type: String as PropType<'none' | 'left-bottom'>,
    default: 'none',
  },

  /**
   * Gradient overlay depth/opacity (0.0 to 1.0).
   */
  gradient_depth: {
    type: Number,
    default: 1.0,
  },

  /**
   * Background correction for image adjustments.
   */
  backgroundCorrection: {
    type: [Number, String] as PropType<number | string>,
    default: 'none',
  },

  /**
   * Image ID for API-based loading.
   * When provided, Hero will fetch image data from /api/images/:id
   */
  image_id: {
    type: [Number, String] as PropType<number | string>,
    default: undefined,
  },

  /**
   * Image XMLID for API-based loading.
   * When provided, Hero will fetch image data from /api/images/xmlid/:xmlid
   */
  image_xmlid: {
    type: String,
    default: undefined,
  },

  /**
   * Pre-provided blur hash string for immediate placeholder display.
   * Useful when entity already has img_square.blur available to avoid
   * waiting for API response before showing blur placeholder.
   */
  image_blur: {
    type: String,
    default: undefined,
  },
})

// =====================================================================
// Types
// =====================================================================

interface ShapeData {
  url?: string
  blur?: string
  turl?: string
  tpar?: string
  x?: number
  y?: number
  z?: number
}

// =====================================================================
// API-Based Image Fetching
// =====================================================================

// Use composable for API-based image loading
const { imageData: fetchedImageData, isLoading: isFetchingImage, fetchImage } = useImageFetch()

// Determine if we should fetch image via API
const shouldFetchImage = computed(() => {
  // Only fetch if image_id or image_xmlid is provided AND image prop is not provided
  return (props.image_id || props.image_xmlid) && !props.image
})

// Merged image data: API-fetched data takes precedence if fetching, otherwise use prop
const effectiveImageData = computed(() => {
  if (shouldFetchImage.value && fetchedImageData.value) {
    return fetchedImageData.value
  }
  return props.image
})

// =====================================================================
// Viewport Tracking
// =====================================================================

const viewport = ref({
  width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  height: typeof window !== 'undefined' ? window.innerHeight : 768
})

// Selected hero instance based on viewport and heightTmp
const selectedInstance = computed<HeroInstance>(() => {
  return selectHeroInstance(viewport.value, props.heightTmp)
})

// Get dimensions for selected instance
const instanceDimensions = computed(() => {
  return getHeroInstanceDimensions(selectedInstance.value)
})

// =====================================================================
// Image Selection
// =====================================================================

/**
 * Get shape data for the selected instance.
 * Falls back to template shape if instance not available.
 * Now uses effectiveImageData which can be from props or API.
 */
const currentShapeData = computed<ShapeData | null>(() => {
  const imageSource = effectiveImageData.value
  if (!imageSource) return null

  const instance = selectedInstance.value

  // Try to get the specific instance (e.g., hero_wide_xl)
  const instanceData = (imageSource as any)[instance] as ShapeData | undefined
  if (instanceData?.url) {
    return instanceData
  }

  // Priority: Try img_* JSONB columns first (they have proper object structure)
  // These are computed from shape_* by database triggers
  if (instance.startsWith('hero_wide')) {
    const imgWide = (imageSource as any).img_wide as ShapeData | undefined
    if (imgWide?.url) return imgWide
  }
  if (instance.startsWith('hero_square')) {
    const imgSquare = (imageSource as any).img_square as ShapeData | undefined
    if (imgSquare?.url) return imgSquare
  }
  if (instance.startsWith('hero_vert')) {
    const imgVert = (imageSource as any).img_vert as ShapeData | undefined
    if (imgVert?.url) return imgVert
  }

  // Last resort: try shape_* composite types (less reliable - may be ROW strings)
  const templateName = getHeroInstanceTemplate(instance)
  const templateKey = `shape_${templateName}`
  const templateData = (imageSource as any)[templateKey] as ShapeData | undefined
  if (templateData && typeof templateData === 'object' && templateData.url) {
    return templateData
  }

  return null
})

// =====================================================================
// Adapter Detection & URL Building
// =====================================================================

const detectAdapter = (url: string): 'unsplash' | 'cloudinary' | 'local' | 'external' => {
  if (url.includes('images.unsplash.com')) return 'unsplash'
  if (url.includes('cloudinary.com')) return 'cloudinary'
  if (url.startsWith('/api/images/local/')) return 'local'
  return 'external'
}

const buildUnsplashUrl = (baseUrl: string, width: number, height: number): string => {
  try {
    const url = new URL(baseUrl)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('h', height.toString())
    url.searchParams.set('fit', 'crop')
    return url.toString()
  } catch (e) {
    return baseUrl
  }
}

const buildCloudinaryUrl = (baseUrl: string, width: number, height: number): string => {
  try {
    const match = baseUrl.match(/^(https?:\/\/[^\/]+\/[^\/]+\/image\/upload\/)([^\/]*)\/(.+)$/)
    if (match) {
      const [, prefix, , suffix] = match
      return `${prefix}c_fill,w_${width},h_${height}/${suffix}`
    }
    return baseUrl
  } catch (e) {
    return baseUrl
  }
}

/**
 * Build responsive image URL for current shape
 */
const buildImageUrl = (shapeData: ShapeData, width: number, height: number): string => {
  if (!shapeData?.url) return ''

  // Use tpar + turl if available (optimized path)
  if (shapeData.tpar && shapeData.turl) {
    return shapeData.tpar.replace('{turl}', shapeData.turl)
  }

  const adapter = detectAdapter(shapeData.url)

  // Local adapter: URL is already sized correctly (instance files)
  if (adapter === 'local') {
    return shapeData.url
  }

  if (adapter === 'unsplash') {
    return buildUnsplashUrl(shapeData.url, width, height)
  } else if (adapter === 'cloudinary') {
    return buildCloudinaryUrl(shapeData.url, width, height)
  }

  return shapeData.url
}

// =====================================================================
// BlurHash Support
// =====================================================================

// Effective blur hash: prefer prop image_blur, then shape data blur, then fallback shapes
const effectiveBlurHash = computed(() => {
  // Priority 1: Pre-provided image_blur prop (instant, no API wait)
  if (props.image_blur) return props.image_blur

  // Priority 2: Blur from current shape data (after API load)
  if (currentShapeData.value?.blur) return currentShapeData.value.blur

  // Priority 3: Fallback - try to find blur from any available shape
  const imageSource = effectiveImageData.value
  if (imageSource) {
    // Check common shapes for blur hash
    const shapes = ['img_square', 'img_wide', 'img_thumb', 'img_vert', 'hero_square', 'hero_wide']
    for (const shapeKey of shapes) {
      const shape = (imageSource as any)[shapeKey]
      if (shape?.blur) {
        console.log(`[Hero DEBUG] Found blur in fallback shape: ${shapeKey}`)
        return shape.blur
      }
    }
  }

  return ''
})

const { canvasRef, isDecoded } = useBlurHash({
  hash: effectiveBlurHash,
  width: 32,
  height: 32
})

const blurHashUrl = computed(() => {
  if (isDecoded.value && canvasRef.value) {
    try {
      return canvasRef.value.toDataURL('image/png')
    } catch (e) {
      console.error('[Hero] Failed to convert BlurHash canvas to data URL:', e)
    }
  }
  return null
})

// Check if currently showing a blur hash placeholder (for sizing)
const isBlurHashActive = computed(() => {
  return backgroundImage.value?.startsWith('data:image/png;base64,') ?? false
})

// Determine if we should use cover sizing
// True for: explicit cover alignment, blur hash placeholder, or new image system with cover config
// Respects headerType's imgTmpAlignX/Y (e.g., banner uses center/top, cover uses cover/cover)
const usesCoverSizing = computed(() => {
  // Explicit cover alignment requested - always use cover
  if (props.imgTmpAlignX === 'cover' || props.imgTmpAlignY === 'cover') return true

  // BlurHash placeholder uses cover (temporary loading state)
  if (isBlurHashActive.value) return true

  // New image system: respect configured alignment from headerType
  // If imgTmpAlignX and imgTmpAlignY are both NOT 'cover', use their specific alignment
  // This allows banner type (center/top) to work correctly instead of forcing cover
  if (effectiveImageData.value) {
    // Both alignments are specified and neither is 'cover' -> respect them
    return false
  }

  return false
})

// =====================================================================
// Background Image Loading
// =====================================================================

const backgroundImage = ref('')

const initializeBackgroundImage = () => {
  const imageSource = effectiveImageData.value

  // DEBUG: Shape instance selection
  console.log('[Hero DEBUG] initializeBackgroundImage called')
  console.log('[Hero DEBUG] selectedInstance:', selectedInstance.value)
  console.log('[Hero DEBUG] imageSource:', imageSource ? 'present' : 'null')

  if (!imageSource) {
    // Fallback to legacy imgTmp
    if (props.imgTmp) {
      backgroundImage.value = props.imgTmp
      console.log('[Hero DEBUG] Using legacy imgTmp:', props.imgTmp)
    }
    return
  }

  // Start with BlurHash if available
  if (blurHashUrl.value) {
    backgroundImage.value = blurHashUrl.value
    console.log('[Hero DEBUG] BlurHash set as placeholder')
  }

  // Load image for selected instance
  const shape = currentShapeData.value
  console.log('[Hero DEBUG] currentShapeData:', shape)

  if (shape?.url) {
    const { width, height } = instanceDimensions.value
    const imageUrl = buildImageUrl(shape, width * 2, height * 2) // 2x for retina
    console.log('[Hero DEBUG] Built imageUrl:', imageUrl)
    console.log('[Hero DEBUG] instanceDimensions:', { width, height })

    // Preload and swap
    const img = new Image()
    img.onload = () => {
      console.log('[Hero DEBUG] Image loaded successfully, swapping background')
      backgroundImage.value = imageUrl
    }
    img.onerror = (e) => {
      console.warn('[Hero DEBUG] Failed to load image:', imageUrl, e)
      // Keep BlurHash as fallback
    }
    img.src = imageUrl
  } else {
    console.log('[Hero DEBUG] No shape URL available')
  }
}

// =====================================================================
// Lifecycle & Event Handlers
// =====================================================================

let resizeTimeout: number | undefined

const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    const prevInstance = selectedInstance.value

    viewport.value = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // If instance changed, reload image
    if (selectedInstance.value !== prevInstance) {
      initializeBackgroundImage()
    }
  }, 100) as unknown as number
}

onMounted(async () => {
  viewport.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  // If we need to fetch image via API, do it first
  if (shouldFetchImage.value) {
    await fetchImage({
      id: props.image_id ? Number(props.image_id) : undefined,
      xmlid: props.image_xmlid
    })
  }

  initializeBackgroundImage()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimeout)
})

// Watch for image prop changes
watch(() => props.image, initializeBackgroundImage, { deep: true })

// Watch for fetched image data changes
watch(fetchedImageData, () => {
  if (fetchedImageData.value) {
    initializeBackgroundImage()
  }
})

// Watch for BlurHash decode completion - set background immediately when ready
watch(blurHashUrl, (newUrl) => {
  if (newUrl && !backgroundImage.value) {
    backgroundImage.value = newUrl
  }
})

// Watch for image_id/image_xmlid prop changes
watch([() => props.image_id, () => props.image_xmlid], async ([newId, newXmlid]: [number | string | undefined, string | undefined]) => {
  if (newId || newXmlid) {
    await fetchImage({
      id: newId ? Number(newId) : undefined,
      xmlid: newXmlid
    })
  }
})

// Computed background image (use new system if available, fallback to imgTmp)
const computedBackgroundImage = computed(() => {
  return backgroundImage.value || props.imgTmp || ''
})
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  justify-content: flex-start;
  padding: 6.25rem 0 6.25rem 1rem;
  overflow: clip;
}

.hero-full {
  min-height: 100vh;
}

.hero-prominent {
  min-height: 75vh;
}

.hero-medium {
  min-height: 50vh;
}

.hero-mini {
  min-height: 25vh;
}

.card-hero {
  max-width: 500px;
}

.hero-align-content-top {
  align-items: flex-start;
}

.hero-align-content-center {
  align-items: center;
}

.hero-align-content-bottom {
  align-items: flex-end;
}

.hero-bottomline::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: var(--bottomline-hero);
  background-color: var(--color-primary-bg);
}

.hero-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  transform: translate3d(0, 0, 0);
}

.hero-cover-image {
  position: sticky;
  top: 0;
  width: 100%;
  height: 50%;
  background-repeat: no-repeat;
}

.static-cover-image {
  top: 0;
  width: 100%;
  max-width: 500px;
  height: 50%;
  background-repeat: no-repeat;
}

.hero-cover-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.hero-content {
  position: relative;
}

.hero-align-content-top .hero-content {
  position: sticky;
  top: 6.25rem;
}

.hero-align-content-bottom .hero-content {
  position: sticky;
  bottom: 6.25rem;
}

.hero-content-short {
  min-width: 23rem;
  /* 368px */
  max-width: 50rem;
  /* 800px */
}

.hero-content-fixed {
  width: 80%;
}

.hero-content-full {
  width: 100%;
}

/* Left content type: remove Container's auto margins and left padding */
.hero-content-left .container {
  margin-left: 0;
  padding-left: 0;
  padding-right: 8rem;
  padding-bottom: 1.75rem;
}

@media (max-width: 767px) {
  .hero {
    padding: 0 0 1rem;
  }

  .hero-content>* {
    padding: 0;
  }

  .hero-content-text>* {
    padding: 1.75rem 1rem;
  }

  .hero-content-fixed {
    width: 100%;
  }

  .hero-content-left .container {
    padding-left: 0;
    padding-right: 1rem;
  }
}
</style>
