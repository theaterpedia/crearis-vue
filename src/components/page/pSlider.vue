<!--
  pSlider.vue - Page-level slider wrapper for external websites
  
  A lightweight wrapper around ItemSlider for display-only scenarios.
  Supports entity fetching, filtering, and modal interactions.
  Similar to pGallery but with horizontal sliding presentation.
-->
<template>
    <div class="p-slider" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :is="headingLevel" />

        <ItemSlider :entity="entity" :project="project" :filter-ids="filterIds" :filter-xml-prefix="filterXmlPrefix"
            :filter-xml-prefixes="filterXmlPrefixes" :filter-xml-pattern="filterXmlPattern" :size="size" :shape="shape"
            :anatomy="anatomy" :interaction="interactionMode" :data-mode="true" :multi-select="false"
            @item-click="handleItemClick" />

        <!-- Route Navigation Modal (if using route mode) -->
        <ItemModalCard v-if="showRouteModal" :is-open="showRouteModal"
            :heading="selectedItem?.title || selectedItem?.name || selectedItem?.entityname || ''"
            :teaser="selectedItem?.teaser" :data="parseImageData(selectedItem)" :shape="shape"
            :anatomy="modalOptionsWithDefaults.anatomy"
            :entity="{ xmlid: selectedItem?.xmlID || selectedItem?.xmlid, status_display: selectedItem?.status_display, table: entity }"
            @close="closeRouteModal">
            <template #footer>
                <button @click="navigateToRoute" class="route-nav-button">
                    {{ routeButtonText }}
                </button>
            </template>
        </ItemModalCard>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ItemSlider from '@/components/clist/ItemSlider.vue'
import Heading from '@/components/Heading.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    // Entity fetching
    entity: 'posts' | 'events' | 'instructors' | 'projects' | 'images'
    project?: string

    // Filter options (passed as props, no UI controls)
    filterIds?: number[]
    filterXmlPrefix?: string
    filterXmlPrefixes?: string[]
    filterXmlPattern?: RegExp

    // Display options
    size?: 'small' | 'medium' | 'large'
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false

    // Interaction mode
    onActivate?: 'modal' | 'route'
    routePath?: string
    routeButtonText?: string

    // Modal display options
    modalOptions?: {
        anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
    }

    // Header
    header?: string
    isAside?: boolean
    isFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    shape: 'square',
    anatomy: 'bottomimage',
    routeButtonText: 'View Details',
    isAside: false,
    isFooter: false
})

const router = useRouter()
const selectedItem = ref<any>(null)
const showRouteModal = ref(false)

// Show header for aside/footer variants
const showHeader = computed(() => props.isAside || props.isFooter)

// Heading level based on context
const headingLevel = computed(() => {
    if (props.isAside) return 'h4'
    if (props.isFooter) return 'h3'
    return 'h3'
})

// Modal options with defaults
const modalOptionsWithDefaults = computed(() => ({
    anatomy: props.modalOptions?.anatomy ?? 'heroimage'
}))

// Interaction mode based on onActivate prop
const interactionMode = computed(() => {
    if (props.onActivate === 'modal') return 'previewmodal'
    if (props.onActivate === 'route') return 'static' // Handle route in click handler
    return 'static'
})

/**
 * Parse JSONB image data
 */
const parseImageData = (entity: any): ImgShapeData | null => {
    if (!entity) return null

    // Try img_square first, then img_thumb
    const imageField = entity.img_square || entity.img_thumb
    if (!imageField || typeof imageField !== 'object') return null

    return {
        type: 'url',
        url: imageField.url || '',
        x: imageField.x ?? null,
        y: imageField.y ?? null,
        z: imageField.z ?? null,
        options: imageField.options ?? null,
        blur: imageField.blur ?? undefined,
        turl: imageField.turl ?? undefined,
        tpar: imageField.tpar ?? undefined,
        alt_text: imageField.alt_text ?? undefined
    }
}

/**
 * Handle item click
 */
const handleItemClick = (item: any) => {
    if (props.onActivate === 'route') {
        selectedItem.value = item
        showRouteModal.value = true
    }
    // For modal mode, ItemSlider handles it via previewmodal interaction
}

/**
 * Close route navigation modal
 */
const closeRouteModal = () => {
    showRouteModal.value = false
    setTimeout(() => {
        selectedItem.value = null
    }, 300)
}

/**
 * Navigate to route
 */
const navigateToRoute = () => {
    if (!props.routePath || !selectedItem.value) return

    const path = props.routePath.replace(':id', String(selectedItem.value.id))
    router.push(path)
    closeRouteModal()
}
</script>

<style scoped>
.p-slider {
    margin: 2rem 0;
}

.p-slider.is-aside {
    margin: 1rem 0;
}

.p-slider.is-footer {
    margin: 3rem 0;
}

/* CSS deep() for width control */
.p-slider :deep(.slider-item-wrapper) {
    /* Default: inherit from Slide.vue */
    width: inherit;
}

/* Responsive width control */
@media (min-width: 768px) {
    .p-slider :deep(.slider-item-wrapper) {
        width: clamp(250px, 30vw, 400px);
    }
}

/* Aside variant: smaller slides */
.p-slider.is-aside :deep(.slider-item-wrapper) {
    width: 200px;
}

/* Footer variant: larger slides */
.p-slider.is-footer :deep(.slider-item-wrapper) {
    width: 300px;
}

/* Route navigation button */
.route-nav-button {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 1rem;
    transition: opacity 0.2s;
}

.route-nav-button:hover {
    opacity: 0.9;
}
</style>
