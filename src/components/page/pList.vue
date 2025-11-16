<!--
  pListSimple.vue - Simple page-level list wrapper for external websites
  
  A lightweight wrapper around ItemList for display-only scenarios.
  No interactive controls (search, filter inputs, selection UI).
  Supports filter/search as props and modal preview or route navigation.
-->
<template>
    <div class="p-list-simple">
        <ItemList :entity="entity" :project="project" :filter-ids="filterIds" :filter-xml-prefix="filterXmlPrefix"
            :filter-xml-prefixes="filterXmlPrefixes" :filter-xml-pattern="filterXmlPattern" :status-lt="statusLt"
            :status-eq="statusEq" :status-gt="statusGt" :size="size" :width="width" :columns="columns"
            :heading-level="headingLevel" :variant="variant" :anatomy="anatomy" :interaction="interactionMode"
            :data-mode="true" :multi-select="false" @item-click="handleItemClick" />

        <!-- Route Navigation Modal (if using route mode) -->
        <ItemModalCard v-if="showRouteModal" :is-open="showRouteModal"
            :heading="selectedItem?.title || selectedItem?.name || selectedItem?.entityname || ''"
            :teaser="selectedItem?.teaser" :data="parseImageData(selectedItem)" :shape="variant"
            :anatomy="modalOptions?.anatomy ?? 'heroimage'"
            :entity="{ xmlid: selectedItem?.xmlID || selectedItem?.xmlid, status_id: selectedItem?.status_id, table: entity }"
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
import ItemList from './ItemList.vue'
import ItemModalCard from './ItemModalCard.vue'
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

    // Status value filtering (0-6)
    statusLt?: number  // Less than
    statusEq?: number  // Equal
    statusGt?: number  // Greater than

    // Display options
    size?: 'small' | 'medium'
    width?: 'inherit' | 'small' | 'medium' | 'large'
    columns?: 'off' | 'on'
    headingLevel?: 'h3' | 'h4'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false

    // Interaction mode
    onActivate?: 'modal' | 'route'
    routePath?: string // e.g., '/events/:id' where :id will be replaced
    routeButtonText?: string

    // Modal display options
    modalOptions?: {
        anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
    }
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    width: 'inherit',
    columns: 'off',
    headingLevel: 'h3',
    variant: 'default',
    anatomy: 'bottomimage',
    onActivate: 'modal',
    routeButtonText: 'View Details',
    modalOptions: () => ({ anatomy: 'heroimage' })
})

const router = useRouter()
const selectedItem = ref<any>(null)
const showRouteModal = ref(false)

// Determine interaction mode for ItemList
const interactionMode = computed(() => {
    if (props.onActivate === 'modal') {
        return 'previewmodal'
    }
    return 'static'
})

// Handle item click
const handleItemClick = (item: any) => {
    if (props.onActivate === 'route') {
        selectedItem.value = item
        showRouteModal.value = true
    }
    // If onActivate === 'modal', ItemList handles it with previewmodal mode
}

// Parse image data for modal
const parseImageData = (item: any): ImgShapeData | undefined => {
    if (!item) return undefined

    const imgField = props.size === 'small' ? 'img_thumb' : 'img_square'
    const imgData = item[imgField]

    if (!imgData) return undefined

    try {
        const parsed = typeof imgData === 'string' ? JSON.parse(imgData) : imgData
        return {
            type: 'url',
            url: parsed.url || '',
            x: parsed.x ?? null,
            y: parsed.y ?? null,
            z: parsed.z ?? null,
            options: parsed.options ?? null,
            blur: parsed.blur,
            turl: parsed.turl,
            tpar: parsed.tpar,
            xmlid: item.xmlID || item.xmlid,
            alt_text: parsed.alt_text
        }
    } catch (e) {
        console.error('Failed to parse image data:', e)
        return undefined
    }
}

// Navigate to route
const navigateToRoute = () => {
    if (!props.routePath || !selectedItem.value) return

    // Replace :id with actual item id
    const path = props.routePath.replace(':id', String(selectedItem.value.id))
    router.push(path)
    closeRouteModal()
}

const closeRouteModal = () => {
    showRouteModal.value = false
    selectedItem.value = null
}
</script>

<style scoped>
.p-list-simple {
    width: 100%;
}

.route-nav-button {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.route-nav-button:hover {
    background: var(--color-primary-bg-hover, var(--color-primary-bg));
}
</style>
