<template>
  <div class="hero" :class="[
    target === 'page' ? `hero-${heightTmp}` : 'hero-mini card-hero',
    `hero-align-content-${contentAlignY}`,
    bottomline ? 'hero-bottomline' : '',
  ]" :style="contentType === 'left' ? 'padding-left: 0rem' : ''">
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
            ? imgTmpAlignX === 'cover' || imgTmpAlignY === 'cover'
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
import { ref, computed, onMounted } from 'vue'
import type { PropType } from 'vue'
import Container from './Container.vue'
import { useBlurHash } from '@/composables/useBlurHash'
import { MOBILE_WIDTH_PX } from '@/composables/useTheme'

// =====================================================================
// TODO: Future refactor
// This image loading logic is duplicated from ImgShape.vue
// See: src/components/images/ImgShape.vue lines 100-250
// When refactoring, extract shared logic to:
// - src/composables/useImageAdapter.ts (adapter detection, URL building)
// - src/composables/useResponsiveImage.ts (dimension calculation, srcset generation)
// =====================================================================

// =====================================================================
// Props Definition
// =====================================================================

const props = defineProps({
  /**
   * Defines the height of the hero.
   *
   * @default 'full'
   */
  heightTmp: {
    type: String as PropType<'full' | 'prominent' | 'medium' | 'mini'>,
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
   * Image shapes data for responsive serving (Plan F)
   */
  image: {
    type: Object as PropType<{
      shape_vertical?: {
        url?: string
        blur?: string
        turl?: string
        tpar?: string
      }
      shape_wide?: {
        url?: string
        blur?: string
        turl?: string
        tpar?: string
      }
      shape_square?: {
        url?: string
        blur?: string
        turl?: string
        tpar?: string
      }
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
})

// =====================================================================
// Adapter Detection (copied from ImgShape.vue)
// =====================================================================

const detectAdapter = (url: string): 'unsplash' | 'cloudinary' | 'vimeo' | 'external' => {
  if (url.includes('images.unsplash.com')) return 'unsplash'
  if (url.includes('cloudinary.com')) return 'cloudinary'
  if (url.includes('vimeo')) return 'vimeo'
  return 'external'
}

// =====================================================================
// URL Building (copied from ImgShape.vue)
// =====================================================================

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
    // Extract parts: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{version}/{public_id}.{ext}
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

// =====================================================================
// Responsive Image Selection
// =====================================================================

// Mobile detection (416px breakpoint from MOBILE_WIDTH_PX)
const isMobile = ref(false)

// Current shape selection
const currentShape = computed(() => {
  if (!props.image) return null
  return isMobile.value ? props.image.shape_vertical : props.image.shape_wide
})

// BlurHash support
const { canvasRef, isDecoded } = useBlurHash({
  hash: computed(() => currentShape.value?.blur || ''),
  width: 32,
  height: 32
})

// Convert canvas to data URL
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

// Build responsive image URL
const buildImageUrl = (shapeData: any, width: number, height: number): string => {
  if (!shapeData?.url) return ''
  
  // Use tpar + turl if available (mobile optimization)
  if (shapeData.tpar && shapeData.turl) {
    return shapeData.tpar.replace('{turl}', shapeData.turl)
  }
  
  const adapter = detectAdapter(shapeData.url)
  
  if (adapter === 'unsplash') {
    return buildUnsplashUrl(shapeData.url, width, height)
  } else if (adapter === 'cloudinary') {
    return buildCloudinaryUrl(shapeData.url, width, height)
  }
  
  return shapeData.url
}

// Background image with loading states
const backgroundImage = ref('')

// Initialize background image
const initializeBackgroundImage = () => {
  if (!props.image) {
    // Fallback to legacy imgTmp
    if (props.imgTmp) {
      backgroundImage.value = props.imgTmp
      if (import.meta.env.DEV) {
        console.warn('[Hero] Using legacy imgTmp prop. Migrate to image prop with shape system.')
      }
    }
    return
  }
  
  // Start with BlurHash
  if (blurHashUrl.value) {
    backgroundImage.value = blurHashUrl.value
  }
  
  // Check if mobile
  isMobile.value = window.innerWidth <= MOBILE_WIDTH_PX
  
  // Load appropriate shape
  const shape = currentShape.value
  if (shape) {
    const width = isMobile.value ? 416 : 672 // 2x for better quality
    const height = isMobile.value ? 739 : 336
    const imageUrl = buildImageUrl(shape, width, height)
    
    // Preload and swap
    const img = new Image()
    img.onload = () => {
      backgroundImage.value = imageUrl
    }
    img.src = imageUrl
  }
}

onMounted(() => {
  initializeBackgroundImage()
  
  // Optional: Handle resize for desktop upgrade
  let resizeTimeout: number
  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      const wasMobile = isMobile.value
      isMobile.value = window.innerWidth <= MOBILE_WIDTH_PX
      
      // Upgrade to desktop image if needed
      if (wasMobile && !isMobile.value && props.image?.shape_wide) {
        const imageUrl = buildImageUrl(props.image.shape_wide, 672, 336)
        const img = new Image()
        img.onload = () => {
          backgroundImage.value = imageUrl
        }
        img.src = imageUrl
      }
    }, 100)
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimeout)
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
