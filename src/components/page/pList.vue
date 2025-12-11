<!--
  pList.vue - Simple page-level list wrapper for external websites
  
  A lightweight wrapper around ItemList for display-only scenarios.
  No interactive controls (search, filter inputs, selection UI).
  Supports filter/search as props and modal preview or route navigation.
  
  Interaction Modes:
  - 'modal': Show preview modal on click (default)
  - 'route': Navigate directly to entity page on click
  - 'route-modal': Show modal with navigation button
-->
<template>
    <div class="p-list-simple">
        <ItemList :entity="entity" :project="project" :filter-ids="filterIds" :filter-xml-prefix="filterXmlPrefix"
            :filter-xml-prefixes="filterXmlPrefixes" :filter-xml-pattern="filterXmlPattern" :status-lt="statusLt"
            :status-eq="statusEq" :status-gt="statusGt" :size="size" :width="width" :columns="columns"
            :heading-level="headingLevel" :variant="variant" :anatomy="anatomy" :interaction="interactionMode"
            :data-mode="true" :multi-select="false" :show-trash="showTrash" @item-click="handleItemClick"
            @item-trash="handleItemTrash" />

        <!-- Route Navigation Modal (if using route-modal mode) -->
        <ItemModalCard v-if="showRouteModal" :is-open="showRouteModal"
            :heading="selectedItem?.title || selectedItem?.name || selectedItem?.entityname || ''"
            :teaser="selectedItem?.teaser" :data="parseImageData(selectedItem)" :shape="variant"
            :anatomy="modalOptions?.anatomy ?? 'heroimage'"
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
import ItemList from '@/components/clist/ItemList.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    // Entity fetching
    entity: 'posts' | 'events' | 'partners' | 'projects' | 'images'
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
    // 'modal' - Show preview modal (default)
    // 'route' - Navigate directly to entity page
    // 'route-modal' - Show modal with navigation button
    onActivate?: 'modal' | 'route' | 'route-modal'
    routePath?: string // e.g., '/sites/:project/posts/:id' where :id will be replaced
    routeButtonText?: string

    // Trash functionality
    showTrash?: boolean

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
    showTrash: false,
    modalOptions: () => ({ anatomy: 'heroimage' })
})

const emit = defineEmits<{
    'item-click': [item: any]
    'item-trash': [item: any]
}>()

const router = useRouter()
const selectedItem = ref<any>(null)
const showRouteModal = ref(false)

// Determine interaction mode for ItemList
const interactionMode = computed(() => {
    if (props.onActivate === 'modal') {
        return 'previewmodal'
    }
    // For 'route' and 'route-modal', we handle clicks ourselves
    return 'static'
})

// Build route path for item
function buildRoutePath(item: any): string {
    if (props.routePath) {
        // Replace placeholders: :id, :project, :domaincode
        return props.routePath
            .replace(':id', String(item.id))
            .replace(':project', props.project || item.domaincode || '')
            .replace(':domaincode', props.project || item.domaincode || '')
    }

    // Auto-generate route based on entity type
    const domaincode = props.project || item.domaincode || ''
    switch (props.entity) {
        case 'posts':
            return `/sites/${domaincode}/posts/${item.id}`
        case 'events':
            return `/sites/${domaincode}/events/${item.id}`
        default:
            return ''
    }
}

// Handle item click
const handleItemClick = (item: any) => {
    emit('item-click', item)

    if (props.onActivate === 'route') {
        // Navigate directly
        const path = buildRoutePath(item)
        if (path) {
            router.push(path)
        }
    } else if (props.onActivate === 'route-modal') {
        // Show modal with navigation option
        selectedItem.value = item
        showRouteModal.value = true
    }
    // If onActivate === 'modal', ItemList handles it with previewmodal mode
}

// Handle trash click
const handleItemTrash = (item: any) => {
    emit('item-trash', item)
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
    if (!selectedItem.value) return
    const path = buildRoutePath(selectedItem.value)
    if (path) {
        router.push(path)
    }
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
