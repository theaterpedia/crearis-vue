<!--
  ProjectSettingsPanel.vue - Consolidated settings for dashboard
  
  Desktop (≥1024px): Two-column layout
  - Left: Accordion (380px, 340px dense) - matches ListHead width
  - Right: Active Panel with head (overline + H1 + separator) + content
  
  Mobile (<1024px): Single-column accordion with inline content
  
  Accordion behavior:
  - Tall viewports (>1000px): Multiple sections can be open
  - Short viewports: Radio-group behavior (one at a time)
  
  DASEI Theme (prop):
  - Warm colors, no rounded corners, Roboto font
  
  Divider Props (desktop only):
  - divider: 'vertical' | 'horizontal' | 'both' | 'none' (default: 'none', or 'vertical' if dasei)
  - dividerFullWidth: boolean - horizontal divider extends full viewport width
-->
<template>
    <div class="project-settings-panel" :class="panelClasses">
        <!-- Left Column: Accordion -->
        <div class="settings-accordion">
            <!-- Section: Theme & Design -->
            <section class="settings-section" :class="{ 'settings-section--expanded': expandedSections.theme }">
                <div class="section-header" @click="toggleSection('theme')">
                    <h3>
                        <span class="section-icon">🎨</span>
                        Theme, Layout & Navigation
                    </h3>
                    <span class="toggle-icon" :class="{ expanded: expandedSections.theme }">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </span>
                </div>
                <!-- Mobile: Inline content / Desktop: Sub-item triggers -->
                <div v-if="expandedSections.theme" class="section-content">
                    <!-- Desktop: Vertical sub-items as triggers -->
                    <template v-if="isDesktop">
                        <button v-for="tab in themeTabs" :key="tab.id" class="section-item"
                            :class="{ 'section-item--active': activeSection === 'theme' && activeSubItem === tab.id }"
                            @click="selectItem('theme', tab.id)">
                            {{ tab.label }}
                        </button>
                    </template>
                    <!-- Mobile: Tabs + inline content -->
                    <template v-else>
                        <div class="subtabs">
                            <button v-for="tab in themeTabs" :key="tab.id" class="subtab-button"
                                :class="{ active: activeSubItem === tab.id }" @click="activeSubItem = tab.id">
                                {{ tab.label }}
                            </button>
                        </div>
                        <div class="subtab-content">
                            <ThemeConfigPanel v-if="activeSubItem === 'theme'" :project-id="projectId"
                                :is-locked="isLocked" />
                            <LayoutConfigPanel v-else-if="activeSubItem === 'layout'" :project-id="projectId"
                                :is-locked="isLocked" />
                            <NavigationConfigPanel v-else-if="activeSubItem === 'navigation'" :project-id="projectId"
                                :is-locked="isLocked" />
                        </div>
                    </template>
                </div>
            </section>

            <!-- Section: Pages -->
            <section class="settings-section" :class="{ 'settings-section--expanded': expandedSections.pages }">
                <div class="section-header" @click="toggleSection('pages')">
                    <h3>
                        <span class="section-icon">📄</span>
                        Landing-Page & Pages
                    </h3>
                    <span class="toggle-icon" :class="{ expanded: expandedSections.pages }">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </span>
                </div>
                <div v-if="expandedSections.pages" class="section-content">
                    <!-- Desktop: Sub-items / Mobile: Inline -->
                    <template v-if="isDesktop">
                        <button v-for="item in pageItems" :key="item.id" class="section-item"
                            :class="{ 'section-item--active': activeSection === 'pages' && activeSubItem === item.id }"
                            @click="selectItem('pages', item.id)">
                            {{ item.label }}
                        </button>
                    </template>
                    <template v-else>
                        <div class="placeholder-box">
                            <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32">
                                <path
                                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,200V112H216v88Z" />
                            </svg>
                            <p class="placeholder-title">Pages Configuration</p>
                            <p class="placeholder-text">Page management coming soon...</p>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Section: Images -->
            <section class="settings-section" :class="{ 'settings-section--expanded': expandedSections.images }">
                <div class="section-header" @click="toggleSection('images')">
                    <h3>
                        <span class="section-icon">🖼️</span>
                        Images & Media
                    </h3>
                    <span class="toggle-icon" :class="{ expanded: expandedSections.images }">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </span>
                </div>
                <div v-if="expandedSections.images" class="section-content">
                    <!-- Desktop: Category filters / Mobile: Inline -->
                    <template v-if="isDesktop">
                        <button v-for="cat in imageCategories" :key="cat.id" class="section-item"
                            :class="{ 'section-item--active': activeSection === 'images' && activeSubItem === cat.id }"
                            @click="selectItem('images', cat.id)">
                            {{ cat.label }}
                        </button>
                    </template>
                    <template v-else>
                        <div class="placeholder-box">
                            <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32">
                                <path
                                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v94.34l-36.69-36.69a8,8,0,0,0-11.32,0L62.34,219.31A8,8,0,0,1,40,200V56ZM216,200H91.31l98.35-98.34,26.34,26.34Z" />
                            </svg>
                            <p class="placeholder-title">Image Library</p>
                            <p class="placeholder-text">Image management coming soon...</p>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Section: Project Activation (only for owners, only in stepper mode) -->
            <section v-if="isOwner && showActivation" class="settings-section settings-section--highlight"
                :class="{ 'settings-section--expanded': expandedSections.activate }">
                <div class="section-header" @click="toggleSection('activate')">
                    <h3>
                        <span class="section-icon">🚀</span>
                        Project Activation
                    </h3>
                    <span class="toggle-icon" :class="{ expanded: expandedSections.activate }">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </span>
                </div>
                <div v-if="expandedSections.activate" class="section-content">
                    <template v-if="isDesktop">
                        <button class="section-item"
                            :class="{ 'section-item--active': activeSection === 'activate' && activeSubItem === 'checklist' }"
                            @click="selectItem('activate', 'checklist')">
                            Checklist
                        </button>
                        <button class="section-item"
                            :class="{ 'section-item--active': activeSection === 'activate' && activeSubItem === 'activate' }"
                            @click="selectItem('activate', 'activate')">
                            Activate
                        </button>
                    </template>
                    <template v-else>
                        <ActivationContent @activate="handleActivate" />
                    </template>
                </div>
            </section>
        </div>

        <!-- Right Column: Active Panel (Desktop only) -->
        <div v-if="isDesktop" class="active-panel">
            <!-- Active Panel Head -->
            <header class="active-panel-head">
                <span class="active-panel-overline">{{ activeSectionLabel }}</span>
                <h1 class="active-panel-headline">{{ activeSubItemLabel }}</h1>
                <div class="active-panel-separator"></div>
            </header>

            <!-- Active Panel Content -->
            <div class="active-panel-content">
                <!-- Theme section content -->
                <template v-if="activeSection === 'theme'">
                    <ThemeConfigPanel v-if="activeSubItem === 'theme'" :project-id="projectId" :is-locked="isLocked" />
                    <LayoutConfigPanel v-else-if="activeSubItem === 'layout'" :project-id="projectId"
                        :is-locked="isLocked" />
                    <NavigationConfigPanel v-else-if="activeSubItem === 'navigation'" :project-id="projectId"
                        :is-locked="isLocked" />
                </template>

                <!-- Pages section content -->
                <template v-else-if="activeSection === 'pages'">
                    <div class="placeholder-box">
                        <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32">
                            <path
                                d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,200V112H216v88Z" />
                        </svg>
                        <p class="placeholder-title">{{ activeSubItemLabel }}</p>
                        <p class="placeholder-text">Page management coming soon...</p>
                    </div>
                </template>

                <!-- Images section content (browser) -->
                <template v-else-if="activeSection === 'images'">
                    <div class="image-browser">
                        <div class="image-browser-header">
                            <h3>{{ activeSubItemLabel }}</h3>
                        </div>
                        <div class="image-browser-grid">
                            <!-- Placeholder image cards -->
                            <div v-for="n in 8" :key="n" class="image-browser-item">
                                <div class="image-browser-thumb"></div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Activation section content -->
                <template v-else-if="activeSection === 'activate'">
                    <ActivationContent v-if="activeSubItem === 'checklist' || activeSubItem === 'activate'"
                        :show-button="activeSubItem === 'activate'" @activate="handleActivate" />
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import ThemeConfigPanel from '@/components/ThemeConfigPanel.vue'
import LayoutConfigPanel from '@/components/LayoutConfigPanel.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
import ActivationContent from './ActivationContent.vue'

interface Props {
    projectId: string
    isOwner?: boolean
    isLocked?: boolean
    showActivation?: boolean
    dasei?: boolean // DASEI internal theme variant
    /** Divider style: 'vertical' | 'horizontal' | 'both' | 'none' (desktop only) */
    divider?: 'vertical' | 'horizontal' | 'both' | 'none'
    /** If true, horizontal divider extends full viewport width */
    dividerFullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isOwner: false,
    isLocked: false,
    showActivation: false,
    dasei: false,
    divider: 'none',
    dividerFullWidth: false
})

const emit = defineEmits<{
    'activate-project': []
}>()

// Computed panel classes
const panelClasses = computed(() => {
    const effectiveDivider = props.divider === 'none' && props.dasei ? 'vertical' : props.divider
    return {
        'project-settings-panel--desktop': isDesktop.value,
        'project-settings-panel--dasei': props.dasei,
        'project-settings-panel--divider-vertical': effectiveDivider === 'vertical' || effectiveDivider === 'both',
        'project-settings-panel--divider-horizontal': effectiveDivider === 'horizontal' || effectiveDivider === 'both',
        'project-settings-panel--divider-full-width': props.dividerFullWidth
    }
})

// Responsive state
const isDesktop = ref(false)
const isTallViewport = ref(false)

function checkViewport() {
    isDesktop.value = window.innerWidth >= 1024
    isTallViewport.value = window.innerHeight > 1000
}

onMounted(() => {
    checkViewport()
    window.addEventListener('resize', checkViewport)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkViewport)
})

// Section expansion state
const expandedSections = reactive({
    theme: true,
    pages: false,
    images: false,
    activate: false
})

// Active selection (for desktop two-column view)
const activeSection = ref<'theme' | 'pages' | 'images' | 'activate'>('theme')
const activeSubItem = ref('theme')

// Sub-items definitions
const themeTabs = [
    { id: 'theme', label: 'Theme' },
    { id: 'layout', label: 'Layout' },
    { id: 'navigation', label: 'Navigation' }
]

const pageItems = [
    { id: 'landing', label: 'Landing Page' },
    { id: 'about', label: 'About' },
    { id: 'custom', label: 'Custom Pages' }
]

const imageCategories = [
    { id: 'all', label: 'All Images' },
    { id: 'category-1', label: 'Image-Category 1' },
    { id: 'category-2', label: 'Image-Category 2' }
]

// Section labels
const sectionLabels: Record<string, string> = {
    theme: 'Theme, Layout & Navigation',
    pages: 'Landing-Page & Pages',
    images: 'Images & Media',
    activate: 'Project Activation'
}

// Get all sub-items for a section
function getSubItems(section: string) {
    switch (section) {
        case 'theme': return themeTabs
        case 'pages': return pageItems
        case 'images': return imageCategories
        case 'activate': return [{ id: 'checklist', label: 'Checklist' }, { id: 'activate', label: 'Activate' }]
        default: return []
    }
}

// Computed labels for active panel head
const activeSectionLabel = computed(() => sectionLabels[activeSection.value] || '')
const activeSubItemLabel = computed(() => {
    const items = getSubItems(activeSection.value)
    const item = items.find(i => i.id === activeSubItem.value)
    return item?.label || ''
})

// Toggle accordion section
function toggleSection(section: keyof typeof expandedSections) {
    if (isTallViewport.value) {
        // Tall viewport: allow multiple open
        expandedSections[section] = !expandedSections[section]
    } else {
        // Short viewport: radio-group behavior
        const isCurrentlyOpen = expandedSections[section]
        const keys = Object.keys(expandedSections) as Array<keyof typeof expandedSections>
        keys.forEach(key => {
            expandedSections[key] = false
        })
        if (!isCurrentlyOpen) {
            expandedSections[section] = true
        }
    }

    // On desktop, also select first item when opening
    if (isDesktop.value && expandedSections[section]) {
        const sectionKey = section as string
        const items = getSubItems(sectionKey)
        if (items.length > 0 && items[0]) {
            activeSection.value = section as typeof activeSection.value
            activeSubItem.value = items[0].id
        }
    }
}

// Select item (desktop: updates active panel)
function selectItem(section: string, itemId: string) {
    activeSection.value = section as typeof activeSection.value
    activeSubItem.value = itemId
}

const handleActivate = () => {
    emit('activate-project')
}
</script>

<style scoped>
/* ==========================================================================
   Base Layout
   ========================================================================== */
.project-settings-panel {
    display: flex;
    flex-direction: column;
    min-height: 100%;
}

/* Mobile: Full-height accordion with no outer margin */
@media (max-width: 1023px) {
    .project-settings-panel {
        padding: 0;
        gap: 0;
    }
}

/* Desktop: Two-column layout */
@media (min-width: 1024px) {
    .project-settings-panel--desktop {
        flex-direction: row;
        padding: 0;
        gap: 0;
    }
}

/* ==========================================================================
   Left Column: Accordion
   ========================================================================== */
.settings-accordion {
    display: flex;
    flex-direction: column;
}

/* Mobile: Full width */
@media (max-width: 1023px) {
    .settings-accordion {
        width: 100%;
    }
}

/* Desktop: Fixed width matching ListHead */
@media (min-width: 1024px) {
    .settings-accordion {
        width: 380px;
        min-width: 380px;
        flex-shrink: 0;
        border-right: 1px solid var(--color-border);
    }

    /* Dense mode: narrower */
    @media (max-width: 1100px) {
        .settings-accordion {
            width: 340px;
            min-width: 340px;
        }
    }
}

/* ==========================================================================
   Settings Section (Accordion items)
   ========================================================================== */
.settings-section {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    overflow: visible;
    position: relative;
}

/* Mobile: No border-radius, stack without gaps */
@media (max-width: 1023px) {
    .settings-section {
        border-radius: 0;
        border-left: none;
        border-right: none;
        margin-top: -1px;
    }

    .settings-section:first-child {
        margin-top: 0;
        border-top: none;
    }
}

/* Desktop: Clean stacking */
@media (min-width: 1024px) {
    .settings-section {
        border-radius: 0;
        border-left: none;
        border-right: none;
        border-bottom: none;
    }

    .settings-section:last-child {
        border-bottom: 1px solid var(--color-border);
    }
}

.settings-section--highlight {
    border-color: var(--color-primary-bg);
}

/* Section Header */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    cursor: pointer;
    user-select: none;
    background: var(--color-surface, var(--color-card-bg));
    transition: background 0.2s;
}

.section-header:hover {
    background: var(--color-accent-bg);
}

.section-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.section-icon {
    font-size: 1.125rem;
}

.toggle-icon {
    transition: transform 0.2s;
    color: var(--color-muted-contrast);
}

.toggle-icon.expanded {
    transform: rotate(180deg);
}

/* Section Content */
.section-content {
    border-top: 1px solid var(--color-border);
    position: relative;
    z-index: 10;
}

/* Mobile: Padding for inline content */
@media (max-width: 1023px) {
    .section-content {
        padding: var(--spacing-md);
    }
}

/* Desktop: No padding, items are buttons */
@media (min-width: 1024px) {
    .section-content {
        padding: 0;
    }
}

/* ==========================================================================
   Section Items (Desktop triggers for Active Panel)
   ========================================================================== */
.section-item {
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    padding-left: calc(var(--spacing-md) + 1.5rem);
    /* Indent under icon */
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.8125rem;
    color: var(--color-muted-contrast);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
}

.section-item:last-child {
    border-bottom: none;
}

.section-item:hover {
    background: var(--color-accent-bg);
    color: var(--color-contrast);
}

.section-item--active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-weight: 600;
}

/* ==========================================================================
   Mobile Subtabs (inside accordion)
   ========================================================================== */
.subtabs {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-xs);
}

.subtab-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-muted-contrast);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.subtab-button:hover {
    color: var(--color-contrast);
}

.subtab-button.active {
    color: var(--color-primary-bg);
    border-bottom-color: var(--color-primary-bg);
}

/* ==========================================================================
   Right Column: Active Panel (Desktop only)
   ========================================================================== */
.active-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--color-bg);
}

/* Active Panel Head - matches ListHead height */
.active-panel-head {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* ListHead height: overline + nav + spacing ≈ 80px */
    /* We calculate this to align separator with ListHead divider */
    min-height: 80px;
    padding: var(--spacing-sm) var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    background: var(--color-card-bg);
}

.active-panel-overline {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-muted-contrast);
    margin-bottom: var(--spacing-xs);
}

.active-panel-headline {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0;
    line-height: 1.2;
}

.active-panel-separator {
    height: 1px;
    background: var(--color-border);
    margin-top: var(--spacing-md);
}

/* Active Panel Content */
.active-panel-content {
    flex: 1;
    padding: var(--spacing-lg);
    overflow-y: auto;
}

/* ==========================================================================
   DASEI Theme Variant
   ========================================================================== */
.project-settings-panel--dasei {
    /* Override to warm variant colors */
    --color-primary-base: oklch(55% 0.12 45);
    --color-secondary-base: oklch(60% 0.08 35);
    --color-neutral-base: oklch(50% 0.015 45);

    /* No rounded corners */
    --radius-small: 0;
    --radius-md: 0;
    --radius-lg: 0;

    /* Roboto font (Institut theme typography) */
    font-family: 'Roboto', sans-serif;
}

/* ==========================================================================
   Divider Variants (Desktop only, ≥1024px)
   ========================================================================== */

/* Vertical Divider: 8px between accordion and active panel */
@media (min-width: 1024px) {
    .project-settings-panel--divider-vertical .settings-accordion {
        border-right: 8px solid var(--color-primary-bg);
    }
}

/* Horizontal Divider: 8px below headers (accordion header row + active panel head) */
@media (min-width: 1024px) {
    .project-settings-panel--divider-horizontal {
        position: relative;
    }

    /* The horizontal divider sits below ListHead height alignment */
    .project-settings-panel--divider-horizontal::before {
        content: '';
        position: absolute;
        top: 80px;
        /* Matches ListHead/Active Panel Head height */
        left: 0;
        right: 0;
        height: 8px;
        background: var(--color-primary-bg);
        z-index: 5;
    }

    /* Push content down to account for divider */
    .project-settings-panel--divider-horizontal .settings-accordion,
    .project-settings-panel--divider-horizontal .active-panel {
        padding-top: 8px;
    }
}

/* Full-width horizontal divider: breaks out of parent padding */
@media (min-width: 1024px) {
    .project-settings-panel--divider-full-width.project-settings-panel--divider-horizontal::before {
        /* Extend beyond parent's padding (typically 1.5rem = 24px) */
        left: -1.5rem;
        right: -1.5rem;
        /* For truly full viewport width, use calc with 100vw */
        left: calc(-50vw + 50%);
        right: calc(-50vw + 50%);
    }
}

/* Both dividers: create a cross pattern */
@media (min-width: 1024px) {
    .project-settings-panel--divider-vertical.project-settings-panel--divider-horizontal .settings-accordion {
        border-right: 8px solid var(--color-primary-bg);
    }
}

/* DASEI: No border-radius on any elements */
.project-settings-panel--dasei .settings-section,
.project-settings-panel--dasei .section-header,
.project-settings-panel--dasei .section-item,
.project-settings-panel--dasei .subtab-button,
.project-settings-panel--dasei .btn-activate,
.project-settings-panel--dasei .placeholder-box {
    border-radius: 0;
}

/* ==========================================================================
   Placeholder Content
   ========================================================================== */
.placeholder-box {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-muted-contrast);
    border-radius: var(--radius-md);
    background: var(--color-muted-bg);
}

.placeholder-box svg {
    opacity: 0.5;
    margin-bottom: var(--spacing-sm);
}

.placeholder-title {
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
}

.placeholder-text {
    font-size: 0.875rem;
}

/* ==========================================================================
   Image Browser (Desktop Active Panel)
   ========================================================================== */
.image-browser {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.image-browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.image-browser-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.image-browser-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-sm);
}

.image-browser-item {
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
}

.image-browser-thumb {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--color-accent-bg) 0%, var(--color-muted-bg) 100%);
}

/* DASEI override for image browser */
.project-settings-panel--dasei .image-browser-item {
    border-radius: 0;
}
</style>
