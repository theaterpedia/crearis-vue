<template>
  <Component class="page-wrapper" :class="`page-bg-${backgroundColor}`" :is="isSideNav ? 'Box' : 'div'">
    <!-- Alert Banner (conditionally displayed) -->
    <div v-if="alertBanner" class="alert-wrapper" :class="{ 'fullwidth-padded': fullwidthMode && fullwidthPadding }">
      <AlertBanner :alertType="alertBanner.alertType">
        <p>{{ alertBanner.message }}</p>
      </AlertBanner>
    </div>

    <!-- old Top Navigation
    <UiNavbarTop
      v-show="!isSideNav"
      :filled="y > scrollBreak"
      :key="themeKey" 
      :hideLogo="route.path === '/' && y <= scrollBreak"
      :hideSearch="searchDisabled ? true : y <= scrollBreak"
      :class="route.path !== '/' ? 'bg-muted-bg' : ''"
    >
      <NuxtLink to="/konferenz" class="mr-2 flex-1" :style="textShadow">Konferenz</NuxtLink>
      <NuxtLink to="/sondierung" class="flex-1" :style="textShadow">Sondierung</NuxtLink>
    </UiNavbarTop>    
    -->

    <!-- Top Navigation -->
    <div class="topnav-wrapper" :class="{ 'fullwidth-padded': fullwidthMode && fullwidthPadding && wideTopnav }"
      v-show="!isSideNav">
      <TopNav :items="mainMenuItems" :scrollStyle="scrollStyle" :wide="wideTopnav">
        <!-- TODO: Add menu items from Sidebar/MainMenu here -->
        <!-- HARDCODED: Replace with dynamic navigation actions -->
        <template #actions>
          <ToggleMenu v-model="siteLayout" :toggleOptions="layoutToggleOptions" :arrayOptions="layoutArrayOptions"
            header="Layout Options" @update:arrayOption="handleArrayOptionUpdate" />
        </template>
      </TopNav>
    </div>

    <Sidebar v-show="isSideNav" footerText="30 Jahre Theaterpädagogik Bayern"
      logo="https://pruvious.com/uploads/logo-dasei.svg" logoAlt="DAS Ei"
      logoSmall="https://pruvious.com/uploads/logo-dasei-small.svg">
      <!-- MainMenu v-model:items="mainMenu.items" / -->
    </Sidebar>

    <!-- Header/Hero Section -->
    <div class="header-wrapper" :class="{ 'fullwidth-padded': fullwidthMode && fullwidthPadding && wideHeader }">
      <header class="page-header" :class="{ 'page-header-boxed': !wideHeader }">
        <!-- PRUVIOUS: Original slot header relocated here -->
        <slot name="header">
          <!-- TODO: Header component doesn't exist in current system -->
          <!-- Option 1: Create Header component with these props -->
          <!-- Option 2: Handle header content in page-specific components (ProjectSite, EventPage) -->
          <!-- Option 3: Create PageHeading component to handle standard heading patterns -->
          <!-- 
          <Header :headerType="page?.fields?.headerType" :headerSize="page?.fields?.headerSize || 'mini'"
            :formatOptions="page?.fields?.formatOptions" :showLogoBanner="route.path === '/' && y <= scrollBreak.value"
            :searchDisabled="searchDisabled" :heading="page?.title" :teaserText="page?.fields?.teaserText"
            :imgTmp="page?.fields?.imgTmp" :cta="page?.fields?.cta" :link="page?.fields?.link" />
          -->
          <div class="temp-header-placeholder">
            <p>Header slot - provide header content from parent component</p>
          </div>
        </slot>
      </header>
    </div>

    <!-- 2-Column Layout Container (Main + Aside) -->
    <Box :layout="wideContent ? 'full-width' : 'centered'" :fullwidthPadding="fullwidthMode && fullwidthPadding">
      <!-- Left Side Content (only for fullThree layout) -->
      <SideContent v-if="showLeftSidebar" placement="left"
        :layoutMode="siteLayout === 'fullThree' ? 'fullThree' : null">
        <Section>
          <!-- HARDCODED: Replace with dynamic left sidebar content -->
          <Prose>
            <h3><strong>Navigation</strong></h3>
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
              <li><a href="#">Link 3</a></li>
            </ul>
          </Prose>
        </Section>
      </SideContent>

      <!-- Main Content -->
      <main class="main-content">
        <!-- PRUVIOUS: Main slot content -->
        <slot />
      </main>

      <!-- Right Side Content (conditionally displayed) -->
      <SideContent v-if="showRightSidebar" placement="right"
        :layoutMode="siteLayout === 'fullTwo' ? 'fullTwo' : siteLayout === 'fullThree' ? 'fullThree' : null">
        <!-- Dynamic aside content based on asideOptions -->
        <Section v-if="asideOptions">
          <!-- pPostit -->
          <pPostit v-if="asideOptions.postit?.enabled" :title="asideOptions.postit.title"
            :content="asideOptions.postit.content" :color="asideOptions.postit.color" :isAside="true" />

          <!-- pToc -->
          <pToc v-if="asideOptions.toc?.enabled" :title="asideOptions.toc.title" :isAside="true" />

          <!-- pList -->
          <pList v-if="asideOptions.list?.type" :type="asideOptions.list.type" :header="asideOptions.list.header"
            :isAside="true" :projectId="projectId" />

          <!-- pContext -->
          <pContext v-if="asideOptions.context?.content" :content="asideOptions.context.content" :isAside="true" />
        </Section>
      </SideContent>
    </Box>

    <!-- Bottom Content (conditionally displayed) -->
    <div v-show="showBottom" class="bottom-wrapper"
      :class="{ 'fullwidth-padded': fullwidthMode && fullwidthPadding && bottomWide }">
      <div class="bottom-content" :class="{ 'bottom-content-boxed': !bottomWide }">
        <!-- Dynamic footer content based on footerOptions -->
        <Container v-if="footerOptions">
          <!-- pGallery -->
          <pGallery v-if="footerOptions.gallery?.type" :type="footerOptions.gallery.type"
            :header="footerOptions.gallery.header" :isFooter="true" :projectId="projectId" />

          <!-- pPostit -->
          <pPostit v-if="footerOptions.postit?.enabled" :title="footerOptions.postit.title"
            :content="footerOptions.postit.content" :color="footerOptions.postit.color" :isFooter="true" />

          <!-- pSlider -->
          <pSlider v-if="footerOptions.slider?.type" :type="footerOptions.slider.type"
            :header="footerOptions.slider.header" :isFooter="true" :projectId="projectId" />

          <!-- pRepeat -->
          <pRepeat v-if="footerOptions.repeat?.enabled" :title="footerOptions.repeat.title"
            :sections="footerOptions.repeat.sections" :columns="footerOptions.repeat.columns" :isFooter="true" />
        </Container>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-wrapper" :class="{ 'fullwidth-padded': fullwidthMode && fullwidthPadding && footerWide }">
      <footer class="page-footer" :class="{ 'page-footer-boxed': !footerWide }">
        <!-- HARDCODED: Replace with dynamic footer content -->
        <Footer>
          <p>© 2023 DAS Ei - Theaterpädagogik Bayern</p>
          <ul>
            <li><a href="#">Datenschutzerklärung</a></li>
            <li><a href="#">Impressum</a></li>
            <li><a href="#">Kontakt</a></li>
          </ul>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Ausbildung</a></li>
            <li><a href="#">Institut</a></li>
            <li><a href="#">AGB</a></li>
          </ul>
          <Prose>
            <p class="h3 primary"><strong>30 Jahre Theaterpädagogik in Bayern.</strong></p>
          </Prose>
        </Footer>
      </footer>
    </div>
  </Component>
</template>

<script lang="ts" setup>
import { ref, computed, watch, shallowRef, type Ref, type ShallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { useWindowScroll } from '@vueuse/core'
import AlertBanner from './AlertBanner.vue'
import Box from './Box.vue'
import Container from './Container.vue'
import TopNav from './TopNav.vue'
import ToggleMenu from './ToggleMenu.vue'
import Sidebar from './Sidebar.vue'
import SideContent from './SideContent.vue'
import Section from './Section.vue'
import Prose from './Prose.vue'
import Button from './Button.vue'
import CardHero from './CardHero.vue'
import Timeline from './Timeline.vue'
import Footer from './Footer.vue'
import type { ToggleOption, ArrayOption } from './ToggleMenu.vue'
import type { TopnavParentItem } from './TopNav.vue'
import {
  pageSettings,
  layoutSettings,
  navbarSettings,
  mainMenuItems as mainMenuItemsConfig,
  layoutToggleOptions as layoutToggleOptionsConfig,
  type SiteLayout
} from '../layoutsettings'
import pList from './page/pList.vue'
import pGallery from './page/pGallery.vue'
import pSlider from './page/pSlider.vue'
import pPostit from './page/pPostit.vue'
import pToc from './page/pToc.vue'
import pContext from './page/pContext.vue'
import pRepeat from './page/pRepeat.vue'
import type { AsideOptions, FooterOptions } from '@/composables/usePageOptions'

const route = useRoute()
const { y } = useWindowScroll()

// ============================================================================
// TODO: MISSING PROPS - Decide handling strategy
// ============================================================================
// These props need to be either:
// 1. Passed as component props from parent (ProjectSite, EventPage, etc.)
// 2. Provided via slot content
// 3. Handled by separate PageHeading component
// Current approach: Mock with defaults for compilation

// TODO: Decide if these should be component props or handled elsewhere
const cimg = ref<string | null>(null) // Cover image URL
const headerType = ref<'simple' | 'hero' | 'banner' | 'minimal'>('simple') // Header display type
const headerSize = ref<'mini' | 'small' | 'medium' | 'large' | 'full' | 'prominent'>('medium') // Header size

// TODO: Page object structure - may need to match Nuxt/Pruvious page structure
const page = ref<any>(null) // Page data object with fields

// TODO: Search functionality - needs implementation
const searchDisabled = ref(false) // Whether search is disabled

// TODO: Theme key for forcing re-renders - may not be needed in this system
const themeKey = ref(0) // Key for theme changes

// TODO: Text shadow for overlays - styling decision
const textShadow = ref('text-shadow: 0 2px 4px rgba(0,0,0,0.3)') // Text shadow for overlays

const showHeader = computed(() => cimg.value && headerType.value !== 'simple')
const scrollBreak = computed(() => {
  if (!showHeader.value) return 80
  return headerSize.value === 'full' || headerSize.value === 'prominent' ? 400 : 250
})

// ============================================================================
// END TODO SECTION
// ============================================================================

// NEW LAYOUT SYSTEM: Page Props - imported from settings
const showAside = ref(pageSettings.showAside)
const showBottom = ref(pageSettings.showBottom)
const alertBanner = ref(pageSettings.alertBanner)

// NEW: Page Options - for dynamic aside and footer content
interface Props {
  asideOptions?: AsideOptions
  footerOptions?: FooterOptions
  projectId?: number
}

const props = withDefaults(defineProps<Props>(), {
  asideOptions: () => ({}),
  footerOptions: () => ({})
})

// NEW LAYOUT SYSTEM: Site Layout - imported from settings
const siteLayout = ref<SiteLayout>(layoutSettings.siteLayout)

// NEW LAYOUT SYSTEM: Base Layout Props - imported from settings
const baseWideHeader = ref(layoutSettings.baseWideHeader)
const baseWideTopnav = ref(layoutSettings.baseWideTopnav)
const baseWideContent = ref(layoutSettings.baseWideContent)
const baseBottomWide = ref(layoutSettings.baseBottomWide)
const baseFooterWide = ref(layoutSettings.baseFooterWide)
const fullwidthPadding = ref(layoutSettings.fullwidthPadding)
const backgroundColor = ref(layoutSettings.backgroundColor)

// NEW LAYOUT SYSTEM: Navbar behavior options - imported from settings
const scrollStyle = ref(navbarSettings.scrollStyle)
const navbarSticky = ref(navbarSettings.navbarSticky)
const navbarReappear = ref(navbarSettings.navbarReappear)

// NEW LAYOUT SYSTEM: Computed - Is fullwidth mode active?
const fullwidthMode = computed(() => {
  return siteLayout.value === 'fullTwo' ||
    siteLayout.value === 'fullThree' ||
    siteLayout.value === 'sidebar' ||
    siteLayout.value === 'fullSidebar'
})

// NEW LAYOUT SYSTEM: Computed Layout Props based on siteLayout
const wideHeader = computed(() => {
  if (siteLayout.value === 'fullTwo' || siteLayout.value === 'fullThree') return true
  return baseWideHeader.value
})

const wideTopnav = computed(() => {
  if (siteLayout.value === 'fullTwo' || siteLayout.value === 'fullThree') return true
  return baseWideTopnav.value
})

const wideContent = computed(() => {
  if (siteLayout.value === 'fullTwo' || siteLayout.value === 'fullThree') return true
  return baseWideContent.value
})

const bottomWide = computed(() => {
  if (siteLayout.value === 'fullTwo' || siteLayout.value === 'fullThree') return true
  return baseBottomWide.value
})

const footerWide = computed(() => {
  if (siteLayout.value === 'fullTwo' || siteLayout.value === 'fullThree') return true
  return baseFooterWide.value
})

const isSideNav = computed(() => {
  if (siteLayout.value === 'sidebar' || siteLayout.value === 'fullSidebar') return true
  return false
})

// NEW LAYOUT SYSTEM: Show left sidebar only for fullThree layout
const showLeftSidebar = computed(() => siteLayout.value === 'fullThree')

// NEW LAYOUT SYSTEM: Show right sidebar for default, fullTwo, and fullThree layouts (when showAside is true)
const showRightSidebar = computed(() => {
  if (siteLayout.value === 'sidebar' || siteLayout.value === 'fullSidebar') return false
  return showAside.value
})

// NEW LAYOUT SYSTEM: Watch navbar options and sync with scrollStyle
watch([navbarSticky, navbarReappear], ([sticky, reappear]: [boolean, boolean]) => {
  if (sticky) {
    scrollStyle.value = 'overlay'
  } else if (reappear) {
    scrollStyle.value = 'overlay_reappear'
  } else {
    scrollStyle.value = 'simple'
  }
}, { immediate: true })

// NEW LAYOUT SYSTEM: Navigation menu items - imported from settings
const mainMenuItems: Ref<TopnavParentItem[]> = ref(mainMenuItemsConfig)

// NEW LAYOUT SYSTEM: Layout Toggle Options - imported from settings
// Use shallowRef to avoid making icon objects reactive (prevents Vue warning)
const layoutToggleOptions: ShallowRef<ToggleOption[]> = shallowRef(layoutToggleOptionsConfig)

// NEW LAYOUT SYSTEM: Array options - computed() that derives state from individual refs
const layoutArrayOptions = computed<ArrayOption[]>(() => [
  {
    text: 'Fullwidth Padding',
    state: fullwidthPadding.value,
  },
  {
    text: 'Navbar Sticky',
    state: navbarSticky.value,
  },
  {
    text: 'Navbar Reappear',
    state: navbarReappear.value,
  },
])

// NEW LAYOUT SYSTEM: Handle toggle updates from array options
function handleArrayOptionUpdate(option: ArrayOption, newState: boolean) {
  if (option.text === 'Fullwidth Padding') {
    fullwidthPadding.value = newState
  }
  else if (option.text === 'Navbar Sticky') {
    navbarSticky.value = newState
    if (newState) {
      navbarReappear.value = false
    }
  }
  else if (option.text === 'Navbar Reappear') {
    navbarReappear.value = newState
    if (newState) {
      navbarSticky.value = false
    }
  }
}
</script>

<style scoped>
/* NEW LAYOUT SYSTEM: Page wrapper and background colors */
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-size: 0.875rem;
  /* 14px - default small */
}

@media (min-width: 640px) {
  .page-wrapper {
    font-size: 1rem;
    /* 16px - base at sm breakpoint */
  }
}

.page-bg-default {
  background-color: var(--color-bg);
}

.page-bg-primary {
  background-color: var(--color-primary-bg);
}

.page-bg-secondary {
  background-color: var(--color-secondary-bg);
}

.page-bg-muted {
  background-color: var(--color-muted-bg);
}

.page-bg-accent {
  background-color: var(--color-accent-bg);
}

.page-bg-positive {
  background-color: var(--color-positive-bg);
}

.page-bg-negative {
  background-color: var(--color-negative-bg);
}

.page-bg-warning {
  background-color: var(--color-warning-bg);
}

/* NEW LAYOUT SYSTEM: Header */
.page-header {
  width: 100%;
}

.page-header-boxed {
  max-width: 90rem;
  /* 1440px - matches Box centered */
  margin: 0 auto;
}

/* NEW LAYOUT SYSTEM: Main Content */
.main-content {
  flex: 1;
  width: 100%;
  order: 1;
  /* Main content always in the middle */
}

/* Desktop: Main content takes remaining space */
@media (min-width: 1024px) {
  .main-content {
    flex: 1;
    width: auto;
    /* Let it take remaining space */
  }
}

/* Tablet (768px-1023px): Main content should be full width when sidebars wrap */
@media (min-width: 768px) and (max-width: 1023px) {
  .main-content {
    flex: 0 0 100%;
    /* Don't grow, don't shrink, fixed 100% width */
    width: 100%;
    order: 0;
    /* Come first */
  }
}

/* Mobile (<768px): Main content full width */
@media (max-width: 767px) {
  .main-content {
    flex: 0 0 100%;
    /* Don't grow, don't shrink, fixed 100% width */
    width: 100%;
    order: 0;
    /* Come first */
  }
}

/* NEW LAYOUT SYSTEM: Fullwidth Padding - applies to wrappers in fullwidth mode */
.fullwidth-padded {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 1024px) {
  .fullwidth-padded {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

/* NEW LAYOUT SYSTEM: Bottom Content */
.bottom-content {
  width: 100%;
}

.bottom-content-boxed {
  max-width: 90rem;
  /* 1440px - matches Box centered */
  margin: 0 auto;
}

/* NEW LAYOUT SYSTEM: Footer */
.page-footer {
  width: 100%;
}

.page-footer-boxed {
  max-width: 90rem;
  /* 1440px - matches Box centered */
  margin: 0 auto;
}

/* PRUVIOUS: Original footnotes styles preserved */
:deep() .footnotes {
  /* merged from ui/section + section-muted + ui/container */
  position: relative;
  z-index: 1;
  padding-top: 1.75rem;
  /* 28px */
  padding-bottom: 1.75rem;
  /* 28px */
  transform: translate3d(0, 0, 0);
  /* Fixes z-index in Safari */
  --color-bg: var(--color-muted-bg);
  --color-contrast: var(--color-card-contrast);
  background-color: var(--color-muted-bg);
  color: var(--color-card-contrast);
  width: 100%;
  max-width: 90rem;
  /* 1440px */
  margin-right: auto;
  margin-left: auto;
  padding-right: 1.75rem;
  /* 28px */
  padding-left: 1.75rem;
  /* 28px */
}

:deep() .footnotes>ol {
  /* merged from ui/section + section-muted + ui/container */
  list-style: decimal;
  font-size: 0.9em;
  margin-bottom: 0.5rem;
  max-width: 52rem;
  /* from prose */
}

:deep() .footnotes>ol>li {
  /* merged from ui/section + section-muted + ui/container */
  list-style: decimal;
  font-size: 0.92em;
  margin-bottom: 0.5rem;
}

:deep() .footnotes>ol {
  /* merged from ui/section + section-muted + ui/container */
  margin-left: 1.6rem;
}

@media (max-width: 767px) {
  :deep() .footnotes {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  :deep() .columns:has(.column-1\/5) {
    flex-direction: row;
    border: black 4px;
    gap: 1.2rem;
    /* 8px */
  }
}

/* TODO: Temporary placeholder styling - remove when Header component is implemented */
.temp-header-placeholder {
  padding: 2rem;
  background-color: var(--color-muted-bg, #f3f4f6);
  border: 2px dashed var(--color-border, #e5e7eb);
  text-align: center;
  color: var(--color-dimmed, #6b7280);
  font-size: 0.875rem;
}
</style>
