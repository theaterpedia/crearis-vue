<template>
  <div>
    <!-- Hero/Banner Header -->
    <Hero v-if="showHero" :contentAlignY="headerprops.contentAlignY"
      :contentType="headerprops.contentType ? headerprops.contentType : headerprops.phoneBanner ? 'banner' : 'text'"
      :contentWidth="headerprops.contentWidth ? headerprops.contentWidth : headerprops.isFullWidth ? 'full' : 'short'"
      :gradient_depth="headerprops.gradientDepth" :gradient_type="headerprops.gradientType"
      :heightTmp="headerprops.headerSize" :imgTmp="imgTmp" :imgTmpAlignX="headerprops.imgTmpAlignX"
      :imgTmpAlignY="headerprops.imgTmpAlignY" :backgroundCorrection="headerprops.backgroundCorrection">
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

    <!-- Simple Header (no hero) - using Section + Container instead of SectionContainer -->
    <Section v-else>
      <Container>
        <HeadingParser v-if="heading" :content="heading" is="h1" class="mt-14" />
        <HeadingParser v-if="teaserText" :content="teaserText" is="h3" />
      </Container>
    </Section>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import Hero from './Hero.vue'
import Banner from './Banner.vue'
import Section from './Section.vue'
import Container from './Container.vue'
import HeadingParser from './HeadingParser.vue'
import Logo from './Logo.vue'
import Button from './Button.vue'

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

// Default header type configurations
const headerTypes = [
  {
    id: 0,
    name: 'simple',
    description: `no header`,
    headerSize: 'mini',
    allowedSizes: [],
    isFullWidth: false,
    contentAlignY: 'center',
    imgTmpAlignX: 'center',
    imgTmpAlignY: 'center',
    backgroundCorrection: 'none',
    phoneBanner: false,
    contentInBanner: false,
    gradientType: 'none',
    gradientDepth: 1.0,
  },
  {
    id: 1,
    name: 'columns',
    description: `2-cols header`,
    headerSize: 'prominent',
    allowedSizes: [],
    isFullWidth: false,
    contentAlignY: 'center',
    imgTmpAlignX: 'center',
    imgTmpAlignY: 'center',
    backgroundCorrection: 'none',
    phoneBanner: false,
    contentInBanner: false,
    gradientType: 'none',
    gradientDepth: 1.0,
  },
  {
    id: 2,
    name: 'banner',
    description: `Banner`,
    headerSize: 'medium',
    allowedSizes: ['prominent', 'medium', 'mini'],
    isFullWidth: false,
    contentAlignY: 'top',
    imgTmpAlignX: 'center',
    imgTmpAlignY: 'top',
    backgroundCorrection: 1,
    phoneBanner: false,
    contentInBanner: false,
    gradientType: 'left-bottom',
    gradientDepth: 0.6,
  },
  {
    id: 3,
    name: 'cover',
    description: `Cover`,
    headerSize: 'prominent',
    allowedSizes: ['prominent', 'full'],
    isFullWidth: false,
    contentAlignY: 'bottom',
    imgTmpAlignX: 'cover',
    imgTmpAlignY: 'center',
    backgroundCorrection: 1,
    phoneBanner: true,
    contentInBanner: false,
    gradientType: 'left-bottom',
    gradientDepth: 0.6,
  },
  {
    id: 4,
    name: 'bauchbinde',
    description: `Bauchbinde`,
    headerSize: 'prominent',
    allowedSizes: ['prominent', 'full'],
    isFullWidth: true,
    contentAlignY: 'bottom',
    imgTmpAlignX: 'cover',
    imgTmpAlignY: 'center',
    backgroundCorrection: 'none',
    phoneBanner: false,
    contentType: 'left',
    contentWidth: 'fixed',
    contentInBanner: true,
    gradientType: 'none',
    gradientDepth: 1.0,
  },
]

// Check whether the headerConfigs contain an entry matching the headerType-prop
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

// Get default Header, if not found, take 'simple'
const defaultHeader = computed(() =>
  headerTypes.find((type) => type.name === props.headerType) || headerTypes[0]
)

// Parse formatOptions if it's a string (JSON string or empty string)
const parsedFormatOptions = computed(() => {
  if (typeof props.formatOptions === 'string') {
    // Empty string means empty object
    if (props.formatOptions.trim() === '') {
      return {}
    }
    // Try to parse JSON string
    try {
      return JSON.parse(props.formatOptions)
    } catch (e) {
      console.warn('Failed to parse formatOptions JSON string:', props.formatOptions, e)
      return {}
    }
  }
  // Already an object
  return props.formatOptions
})

// Merge all header configuration sources
const headerprops = computed(() => {
  const merged = Object.assign(
    {},
    defaultHeader.value,
    siteHeader.value,
    parsedFormatOptions.value
  )

  // Validate headerSize is in allowedSizes
  if (merged.allowedSizes?.length > 0 && !merged.allowedSizes.includes(merged.headerSize)) {
    merged.headerSize = defaultHeader.value.headerSize
  }

  return merged
})

// Display logic
const showHero = computed(() =>
  headerprops.value.name !== 'simple' &&
  headerprops.value.name !== 'columns' &&
  props.imgTmp
)

const showTextImage = computed(() =>
  headerprops.value.name === 'columns' && props.imgTmp
)

const showCta = computed(() =>
  headerprops.value.name !== 'simple' && props.cta?.link
)

const showLink = computed(() =>
  headerprops.value.name !== 'simple' && props.link?.link
)

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
