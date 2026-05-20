<template>
  <div>
    <!-- Hero/Banner Header (cover, banner, bauchbinde) -->
    <Hero v-if="showHero" :contentAlignY="headerprops.contentAlignY"
      :contentType="headerprops.contentType ? headerprops.contentType : headerprops.phoneBanner ? 'banner' : 'text'"
      :contentWidth="headerprops.contentWidth ? headerprops.contentWidth : headerprops.isFullWidth ? 'full' : 'short'"
      :gradient_depth="headerprops.gradientDepth" :gradient_type="headerprops.gradientType"
      :heightTmp="headerprops.headerSize" :imgTmp="imgTmp" :imgTmpAlignX="headerprops.imgTmpAlignX"
      :imgTmpAlignY="headerprops.imgTmpAlignY" :backgroundCorrection="headerprops.backgroundCorrection"
      :image_id="image_id" :image_xmlid="image_xmlid" :image_blur="image_blur">
      <!-- Banner wrapper component (optional) -->
      <Component :card="headerprops.phoneBanner && false" :is="headerprops.contentInBanner ? Banner : 'div'"
        themeColor="secondary" :option="headerprops.name === 'bauchbinde' ? 'bauchbinde' : ''" transparent>
        <!-- Logo Banner Mode -->
        <template v-if="showLogoBanner">
          <Logo extended />
        </template>

        <!-- Content Mode -->
        <template v-else>
          <!-- Heading with HeadingParser for markdown support -->
          <HeadingParser :content="heading" is="h1" />
          <br v-if="heading && teaserText" />
          <HeadingParser v-if="teaserText" :content="teaserText" is="h3" />

          <!-- CTA Buttons -->
          <div v-if="showCta" class="cta-group">
            <Button :is="ctaComponent" v-bind="{ [ctaLinkProp]: cta.link }" size="medium" variant="plain">
              {{ cta.title }}
            </Button>
            <component :is="linkComponent" v-if="showLink" v-bind="{ [linkLinkProp]: link.link }" class="cta-link"
              :style="headerprops.isFullWidth ? 'font-weight:bold' : ''">
              {{ link.title }}
            </component>
          </div>
        </template>
      </Component>
    </Hero>

    <!-- Columns Header (side-by-side text + image) -->
    <TextImageHeader v-else-if="showTextImage" :headerSize="headerprops.headerSize" :imgTmp="imgTmp"
      :imageData="columnImageData" :contentAlignY="headerprops.contentAlignY || 'center'">
      <!-- Heading with HeadingParser for markdown support -->
      <HeadingParser :content="heading" is="h1" />
      <br v-if="heading && teaserText" />
      <HeadingParser v-if="teaserText" :content="teaserText" is="h3" />

      <!-- CTA Buttons -->
      <div v-if="showCta" class="cta-group">
        <Button :is="ctaComponent" v-bind="{ [ctaLinkProp]: cta.link }" size="medium" variant="plain">
          {{ cta.title }}
        </Button>
        <component :is="linkComponent" v-if="showLink" v-bind="{ [linkLinkProp]: link.link }" class="cta-link">
          {{ link.title }}
        </component>
      </div>
    </TextImageHeader>

    <!-- Simple Header (no image/hero) -->
    <Section v-else>
      <Container>
        <HeadingParser v-if="heading" :content="heading" is="h1" class="mt-14" />
        <HeadingParser v-if="teaserText" :content="teaserText" is="h3" />
      </Container>
    </Section>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, type PropType } from 'vue'
import Hero from './Hero.vue'
import Banner from './Banner.vue'
import Section from './Section.vue'
import Container from './Container.vue'
import HeadingParser from './HeadingParser.vue'
import TextImageHeader from './TextImageHeader.vue'
import Logo from './Logo.vue'
import Button from './Button.vue'
import { useHeaderConfig } from '@/composables/useHeaderConfig'
import type { ImageApiResponse } from '@/composables/useImageFetch'

const props = defineProps({
  /**
   * Defines the type of the header.
   */
  headerType: {
    type: String as PropType<'simple' | 'columns' | 'cover' | 'banner' | 'bauchbinde'>,
    default: 'simple',
  },
  /**
   * Defines the size of the header.
   */
  headerSize: {
    type: String as PropType<'mini' | 'medium' | 'prominent' | 'full'>,
    default: 'mini',
  },
  /**
   * Main Text-Content with basic crearis-md formatting.
   * Supports markdown: "overline **headline** subline"
   */
  heading: {
    type: String,
    default: '',
    required: true,
  },
  /**
   * Optional Text-Section for short description.
   * Supports markdown: "overline **headline** subline"
   */
  teaserText: {
    type: String,
    default: '',
  },
  /**
   * Should we display the extended logo banner.
   */
  showLogoBanner: {
    type: Boolean,
    default: false,
  },
  /**
   * Should we display the search input.
   */
  searchDisabled: {
    type: Boolean,
    default: true,
  },
  /**
   * Image to be displayed in the hero.
   */
  imgTmp: {
    type: String,
    default: '',
  },
  /**
   * Image ID for API-based loading in Hero.
   * When provided, Hero will fetch image data from /api/images/:id
   */
  image_id: {
    type: [Number, String] as PropType<number | string>,
    default: undefined,
  },
  /**
   * Image XMLID for API-based loading in Hero.
   * When provided, Hero will fetch image data from /api/images/xmlid/:xmlid
   */
  image_xmlid: {
    type: String,
    default: undefined,
  },
  /**
   * Pre-provided blur hash string for immediate placeholder display.
   * Useful when entity already has img_square.blur available.
   */
  image_blur: {
    type: String,
    default: undefined,
  },
  /**
   * Call-to-action button configuration.
   */
  cta: {
    type: Object,
    default: () => ({
      title: '',
      link: '',
    }),
  },
  /**
   * Secondary Call-to-action button configuration.
   */
  link: {
    type: Object,
    default: () => ({
      title: '',
      link: '',
    }),
  },
  /**
   * Format options to manually adjust the site-settings.
   * Can be either a JSON string or an object. Empty strings are treated as empty objects.
   */
  formatOptions: {
    type: [Object, String],
    default: () => ({}),
  },
  /**
   * Custom header configurations from database/settings
   * Merged with default header types
   */
  headerConfigs: {
    type: Array as PropType<any[]>,
    default: () => ([]),
  },
})

// =====================================================================
// Header Configuration Resolution (via useHeaderConfig composable)
// =====================================================================

// Parse formatOptions to extract headerSubtype (if specified)
const parsedFormatOptions = computed(() => {
  if (typeof props.formatOptions === 'string') {
    if (props.formatOptions.trim() === '') return {}
    try {
      return JSON.parse(props.formatOptions)
    } catch (e) {
      console.warn('Failed to parse formatOptions JSON string:', props.formatOptions, e)
      return {}
    }
  }
  return props.formatOptions
})

// Use the header config composable for API-based resolution
// This handles the three-layer merge: Base → Subcategory → Project Override
const { resolvedConfig: apiResolvedConfig, isLoading: configLoading } = useHeaderConfig({
  headerType: computed(() => props.headerType || 'simple'),
  headerSubtype: computed(() => parsedFormatOptions.value?.headerSubtype),
  // Project overrides only apply on /sites routes (auto-detected by composable)
  useApi: true
})

// Legacy: Check whether the headerConfigs prop contains custom config
// This allows sites to pass custom configs (backwards compatibility)
const customSiteHeader = computed(() =>
  props.headerConfigs?.find((config: any) => config.name === props.headerType)
)

// Parse site header formatOptions if they exist
const siteHeader = computed(() => {
  if (!customSiteHeader.value?.formatOptions) return {}
  try {
    return JSON.parse(customSiteHeader.value.formatOptions)
  } catch (e) {
    console.warn('Failed to parse site header formatOptions:', e)
    return {}
  }
})

// Merge all header configuration sources
// Priority: API config → legacy headerConfigs → entity formatOptions → entity headerSize
const headerprops = computed(() => {
  const merged = Object.assign(
    {},
    apiResolvedConfig.value,          // From API/composable (base → subcat → project)
    siteHeader.value,                  // Legacy headerConfigs prop override
    parsedFormatOptions.value,         // Entity-level formatOptions JSON
    // Entity-level headerSize prop takes priority (from database field)
    props.headerSize ? { headerSize: props.headerSize } : {}
  )

  // Validate headerSize is in allowedSizes
  if (merged.allowedSizes?.length > 0 && !merged.allowedSizes.includes(merged.headerSize)) {
    merged.headerSize = apiResolvedConfig.value.headerSize
  }

  return merged
})

// Display logic
const showHero = computed(() => {
  const name = headerprops.value.name
  const hasImage = props.imgTmp || props.image_id || props.image_xmlid
  // Hero is used for: banner, cover, bauchbinde (not simple or columns)
  return name !== 'simple' && name !== 'columns' && hasImage
})

const showTextImage = computed(() =>
  headerprops.value.name === 'columns' &&
  (props.imgTmp || props.image_id || props.image_xmlid)
)

const showCta = computed(() =>
  headerprops.value.name !== 'simple' && props.cta?.link
)

const showLink = computed(() =>
  headerprops.value.name !== 'simple' && props.link?.link
)

// =====================================================================
// Image Data for Columns Layout (TextImageHeader)
// =====================================================================
const columnImageData = ref<ImageApiResponse | null>(null)

// Fetch image data when columns layout needs it
async function fetchColumnImageData() {
  if (!showTextImage.value) return

  // If we have image_id, fetch the image data
  if (props.image_id) {
    try {
      const response = await fetch(`/api/images/${props.image_id}`)
      if (response.ok) {
        columnImageData.value = await response.json()
      }
    } catch (err) {
      console.warn('[PageHeading] Failed to fetch column image data:', err)
    }
  } else if (props.image_xmlid) {
    try {
      const response = await fetch(`/api/images/xmlid/${props.image_xmlid}`)
      if (response.ok) {
        columnImageData.value = await response.json()
      }
    } catch (err) {
      console.warn('[PageHeading] Failed to fetch column image by xmlid:', err)
    }
  }
}

// Watch for showTextImage becoming true
watch(showTextImage, (show) => {
  if (show) fetchColumnImageData()
}, { immediate: true })

// Helper to determine if link is internal (relative) or external (absolute)
const isInternalLink = (url: string) => {
  if (!url) return false
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('?')
}

// CTA link component - use router-link for internal links, 'a' for external
const ctaComponent = computed(() => isInternalLink(props.cta?.link || '') ? 'router-link' : 'a')
const linkComponent = computed(() => isInternalLink(props.link?.link || '') ? 'router-link' : 'a')

// Prop name for link - router-link uses 'to', <a> uses 'href'
const ctaLinkProp = computed(() => isInternalLink(props.cta?.link || '') ? 'to' : 'href')
const linkLinkProp = computed(() => isInternalLink(props.link?.link || '') ? 'to' : 'href')
</script>

<style scoped>
.cta-group {
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-top: 1.5rem;
}

.cta-link {
  text-decoration: underline;
  color: inherit;
  transition: opacity 0.2s;
}

.cta-link:hover {
  opacity: 0.8;
}

.mt-14 {
  margin-top: 3.5rem;
}
</style>
