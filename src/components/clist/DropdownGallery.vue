<template>
    <VDropdown v-model:shown="isOpen" theme="dropdown-gallery" :triggers="[]" :auto-hide="true" :distance="8"
        placement="bottom-start">
        <!-- Trigger slot -->
        <slot name="trigger" :open="openDropdown" :is-open="isOpen">
            <button class="dropdown-trigger"
                :class="{ 'has-selection': dataMode && selectedItems.length > 0, 'with-xml': displayXml }"
                @click="openDropdown">
                <!-- Default trigger content when no dataMode or no selection -->
                <div v-if="!dataMode || selectedItems.length === 0" class="trigger-placeholder">
                    <slot name="trigger-content">Select {{ entity }}</slot>
                </div>

                <!-- Single selection: Show ItemCard preview -->
                <div v-else-if="!multiSelect && selectedItems.length === 1" class="trigger-single-selection">
                    <ItemCard v-bind="formatSelectedItem(selectedItems[0])" :size="size" :variant="variant" />
                </div>

                <!-- Multi-selection: Show stacked avatars -->
                <div v-else-if="multiSelect && selectedItems.length > 0" class="trigger-multi-selection">
                    <div class="stacked-avatars">
                        <div v-for="(item, index) in displayedItems" :key="item.id" class="stacked-avatar"
                            :style="{ zIndex: displayedItems.length - index, marginLeft: index > 0 ? '-20px' : '0' }">
                            <img v-if="item.img_square || item.img_thumb"
                                :src="parseImageData(item.img_square || item.img_thumb)?.url || ''"
                                :alt="item.title || item.name" class="avatar-image" />
                            <div v-else class="avatar-placeholder"></div>
                        </div>
                        <span v-if="selectedItems.length > 8" class="avatar-count">+{{ selectedItems.length - 8
                        }}</span>
                    </div>
                </div>

                <!-- Optional xmlID display row -->
                <div v-if="displayXml && simplifiedXmlDisplay" class="trigger-xml-row">
                    {{ simplifiedXmlDisplay }}
                </div>

                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16" viewBox="0 0 16 16"
                    fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
        </slot>

        <!-- Dropdown content -->
        <template #popper="{ hide }">
            <div class="dropdown-content" :style="{ ...systemTheme, maxWidth: contentMaxWidth }">
                <div class="dropdown-header">
                    <h4>{{ title || `Select ${entity}` }}</h4>
                    <button class="close-btn" @click="hide" aria-label="Close">×</button>
                </div>

                <!-- CL2: Use ItemGallery with entity fetching -->
                <div class="dropdown-gallery-wrapper">
                    <ItemGallery ref="itemGalleryRef" :entity="entity" :project="project" item-type="card" :size="size"
                        :variant="variant" :dataMode="dataMode" :multiSelect="multiSelect" :selectedIds="selectedIds"
                        interaction="static" @item-click="(item) => handleSelect(item, hide)"
                        @update:selectedIds="handleSelectedIdsUpdate" @selectedXml="handleSelectedXml"
                        @selected="handleSelected" />
                </div>
            </div>
        </template>
    </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import ItemGallery from './ItemGallery.vue'
import ItemCard from './ItemCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    entity: 'posts' | 'events' | 'instructors'
    project?: string
    title?: string
    size?: 'small' | 'medium'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    // Selection props
    dataMode?: boolean
    multiSelect?: boolean
    selectedIds?: number | number[] | null
    displayXml?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    variant: 'square',
    dataMode: false,
    multiSelect: false
})

const emit = defineEmits<{
    select: [item: any]
    'update:selectedIds': [value: number | number[] | null]
    selectedXml: [value: string | string[]]
    selected: [value: any | any[]]
}>()

const isOpen = ref(false)
const itemGalleryRef = ref<InstanceType<typeof ItemGallery> | null>(null)

// System theme for dropdown (per FLOATING_VUE_AND_PANELS_GUIDE.md)
const systemTheme = computed(() => ({
    '--color-bg': 'var(--system-bg, #ffffff)',
    '--color-card-bg': 'var(--system-card-bg, #ffffff)',
    '--color-border': 'var(--system-border, #e5e7eb)',
    '--color-contrast': 'var(--system-contrast, #1f2937)',
    '--color-dimmed': 'var(--system-dimmed, #6b7280)',
    '--color-inverted': '0',
    '--card-width': '21rem' // Required for width calculations in floating context
}))

// Compute max-width for dropdown-content based on size/variant
// Gallery needs more space than list: 32-48rem range
const contentMaxWidth = computed(() => {
    // Gallery displays cards in grid, needs wider container
    if (props.size === 'small') return '32rem'  // ~512px for small cards
    return '48rem'  // ~768px for medium cards (default)
})

// Compute selected IDs as array
const selectedIdsArray = computed(() => {
    if (!props.selectedIds) return []
    if (typeof props.selectedIds === 'number') return [props.selectedIds]
    return props.selectedIds
})

// Get selected items from ItemGallery's entityData
const selectedItems = computed(() => {
    if (!props.dataMode || selectedIdsArray.value.length === 0) return []
    if (!itemGalleryRef.value?.entityData) return []

    const allItems = itemGalleryRef.value.entityData
    return allItems.filter((item: any) => selectedIdsArray.value.includes(item.id))
})

// Parse image data for display
const parseImageData = (jsonbData: any): ImgShapeData | null => {
    if (!jsonbData || typeof jsonbData !== 'object') return null
    return {
        type: 'url',
        url: jsonbData.url || '',
        x: jsonbData.x ?? null,
        y: jsonbData.y ?? null,
        z: jsonbData.z ?? null,
        options: jsonbData.options ?? null,
        blur: jsonbData.blur ?? undefined,
        turl: jsonbData.turl ?? undefined,
        tpar: jsonbData.tpar ?? undefined,
        alt_text: jsonbData.alt_text ?? undefined
    }
}

// Format selected item for ItemCard display
const formatSelectedItem = (item: any) => {
    const imageData = parseImageData(item.img_square || item.img_thumb)
    return {
        heading: item.title || item.name || item.entityname || item.heading || `Item ${item.id}`,
        data: imageData,
        shape: 'square' as const,
        variant: props.variant
    }
}

// Get first 8 selected items for stacked avatars
const displayedItems = computed(() => {
    return selectedItems.value.slice(0, 8)
})

// Simplified xmlID display: "prefix.type: id1, id2, id3"
const simplifiedXmlDisplay = computed(() => {
    if (!props.displayXml || selectedItems.value.length === 0) return ''

    const xmlIds = selectedItems.value
        .map(item => item.xmlID)
        .filter(Boolean)

    if (xmlIds.length === 0) return ''

    // Split first xmlID by '.' and take first two parts
    const parts = xmlIds[0].split('.')
    const prefix = parts.slice(0, 2).join('.')

    // Extract remaining parts from all xmlIDs
    const suffixes = xmlIds.map((id: string) => {
        const idParts = id.split('.')
        return idParts.slice(2).join('.')
    })

    return `${prefix}: ${suffixes.join(', ')}`
})

function openDropdown() {
    isOpen.value = true
}

function handleSelect(item: any, hide: () => void) {
    emit('select', item)
    hide()
}

// Forward selection events from ItemGallery
function handleSelectedIdsUpdate(value: number | number[] | null) {
    emit('update:selectedIds', value)
}

function handleSelectedXml(value: string | string[]) {
    emit('selectedXml', value)
}

function handleSelected(value: any | any[]) {
    emit('selected', value)
}
</script>

<style scoped>
.dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small, 0.375rem);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    color: var(--color-contrast);
}

.dropdown-trigger:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.dropdown-trigger.has-selection {
    border-color: var(--color-primary);
}

/* Placeholder state */
.trigger-placeholder {
    color: var(--color-dimmed);
}

/* Single selection display */
.trigger-single-selection {
    flex: 1;
    min-width: 0;
}

/* Multi-selection with stacked avatars */
.trigger-multi-selection {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stacked-avatars {
    display: flex;
    align-items: center;
}

.stacked-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--color-bg);
    background: var(--color-muted-bg);
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    background: var(--color-muted-bg);
}

.avatar-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-dimmed);
    margin-left: 0.25rem;
}

/* XML display row */
.trigger-xml-row {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dropdown-trigger:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.chevron {
    transition: transform 0.2s;
}

.chevron.rotate-180 {
    transform: rotate(180deg);
}

.dropdown-content {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card, 0.5rem);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 32rem;
    /* max-width now set dynamically via contentMaxWidth computed */
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}

.dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.dropdown-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-dimmed);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-small, 0.375rem);
    transition: all 0.2s;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.dropdown-gallery-wrapper {
    overflow-y: auto;
    padding: 1rem;
}

/* Make items clickable */
.dropdown-gallery-wrapper :deep(.item-card),
.dropdown-gallery-wrapper :deep(.item-tile) {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.dropdown-gallery-wrapper :deep(.item-card:hover),
.dropdown-gallery-wrapper :deep(.item-tile:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
