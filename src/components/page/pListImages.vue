<!--
  pListImages.vue - Image list with project and tag filtering
  
  Displays images filtered by project_id, visibility, and sysreg tags (ctags/rtags).
  Filtering is done server-side via API query parameters.
-->
<template>
    <div class="p-list-images">
        <div v-if="loading" class="loading">Loading images...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <ItemList v-else :items="listItems" :size="size" :width="width" :columns="columns" :heading-level="headingLevel"
            :variant="variant" :anatomy="anatomy" :interaction="interactionMode" :data-mode="false"
            :multi-select="false" @item-click="handleItemClick" />

        <!-- Preview Modal -->
        <ItemModalCard v-if="showPreviewModal" :is-open="showPreviewModal"
            :heading="selectedItem?.title || selectedItem?.name || ''" :teaser="selectedItem?.alt_text"
            :data="parseImageData(selectedItem)" :shape="variant" :anatomy="modalOptions?.anatomy ?? 'heroimage'"
            :entity="{ xmlid: selectedItem?.xmlid, status_display: selectedItem?.status_display, table: 'images' }"
            @close="closePreviewModal" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ItemList from '@/components/clist/ItemList.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    // Required filters
    projectId: number

    // Visibility filter
    visibility?: 'public' | 'internal' | 'private'

    // Sysreg tag filters (hex values, AND logic)
    ctags?: string // Config tags (e.g., '0x01' for age_group=child)
    rtags?: string // Rights/Resource tags

    // Display options
    size?: 'small' | 'medium'
    width?: 'inherit' | 'small' | 'medium' | 'large'
    columns?: 'off' | 'on'
    headingLevel?: 'h3' | 'h4'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false

    // Interaction mode
    onActivate?: 'modal' | 'route'

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
    variant: 'square',
    anatomy: 'fullimage',
    onActivate: 'modal',
    modalOptions: () => ({ anatomy: 'heroimage' })
})

const images = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedItem = ref<any>(null)
const showPreviewModal = ref(false)

// Build API URL with query parameters
const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.append('project_id', String(props.projectId))

    if (props.visibility) {
        params.append('visibility', props.visibility)
    }

    if (props.ctags) {
        params.append('ctags', props.ctags)
    }

    if (props.rtags) {
        params.append('rtags', props.rtags)
    }

    return `/api/images?${params.toString()}`
}

// Fetch images from API
const fetchImages = async () => {
    loading.value = true
    error.value = null

    try {
        const url = buildApiUrl()
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.statusText}`)
        }

        images.value = await response.json()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('[pListImages] Error fetching images:', err)
    } finally {
        loading.value = false
    }
}

// Convert images to ItemList format
const listItems = computed(() => {
    return images.value.map(img => ({
        id: img.id,
        heading: img.title || img.name,
        props: {
            data: parseImageData(img),
            shape: props.variant
        }
    }))
})

// Determine interaction mode for ItemList
const interactionMode = computed(() => {
    return props.onActivate === 'modal' ? 'previewmodal' : 'static'
})

// Handle item click
const handleItemClick = (item: any) => {
    const fullItem = images.value.find(img => img.id === item.id)
    if (fullItem && props.onActivate === 'modal') {
        selectedItem.value = fullItem
        showPreviewModal.value = true
    }
}

// Parse image data for display
const parseImageData = (item: any): ImgShapeData | undefined => {
    if (!item) return undefined

    // Use shape_square for square variant, shape_wide for wide, etc.
    let shapeField = 'shape_square'
    if (props.variant === 'wide') shapeField = 'shape_wide'
    else if (props.variant === 'vertical') shapeField = 'shape_vertical'
    else if (props.size === 'small') shapeField = 'shape_thumb'

    const shapeData = item[shapeField]

    if (!shapeData) return undefined

    try {
        const parsed = typeof shapeData === 'string' ? JSON.parse(shapeData) : shapeData
        return {
            type: 'url',
            url: parsed.url || item.url || '',
            x: parsed.x ?? null,
            y: parsed.y ?? null,
            z: parsed.z ?? null,
            options: parsed.options ?? null,
            blur: parsed.blur,
            turl: parsed.turl,
            tpar: parsed.tpar,
            xmlid: item.xmlid,
            alt_text: item.alt_text || parsed.alt_text
        }
    } catch (e) {
        console.error('Failed to parse image shape data:', e)
        // Fallback to basic URL
        return {
            type: 'url',
            url: item.url,
            xmlid: item.xmlid,
            alt_text: item.alt_text
        }
    }
}

const closePreviewModal = () => {
    showPreviewModal.value = false
    selectedItem.value = null
}

// Fetch images on mount and when filters change
onMounted(() => {
    fetchImages()
})

watch(() => [props.projectId, props.visibility, props.ctags, props.rtags], () => {
    fetchImages()
})
</script>

<style scoped>
.p-list-images {
    width: 100%;
}

.loading,
.error {
    padding: 1rem;
    text-align: center;
    color: var(--color-dimmed);
}

.error {
    color: var(--color-negative);
}
</style>
