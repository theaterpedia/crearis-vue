<template>
    <div v-if="interaction === 'static'" class="item-gallery-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-gallery-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-gallery-loading">Loading...</div>
        <div v-else-if="error" class="item-gallery-error">{{ error }}</div>
        <div v-else class="item-gallery" :class="itemTypeClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="item.id || index"
                :heading="item.heading" :size="size" :heading-level="headingLevel" :options="getItemOptions(item)"
                :models="getItemModels(item)" v-bind="item.props || {}"
                @click="(e: MouseEvent) => handleItemClick(item, e)">
                <template v-if="item.slot" #default>
                    <component :is="item.slot" />
                </template>
            </component>
        </div>
    </div>

    <div v-else-if="interaction === 'previewmodal'" class="item-gallery-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-gallery-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-gallery-loading">Loading...</div>
        <div v-else-if="error" class="item-gallery-error">{{ error }}</div>
        <div v-else class="item-gallery" :class="itemTypeClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="item.id || index"
                :heading="item.heading" :size="size" :heading-level="headingLevel" :options="getItemOptions(item)"
                :models="getItemModels(item)" v-bind="item.props || {}" @click="() => openPreviewModal(item)">
                <template v-if="item.slot" #default>
                    <component :is="item.slot" />
                </template>
            </component>
        </div>

        <!-- Preview Modal -->
        <ItemModalCard :is-open="previewModalOpen" :heading="previewItem?.heading || ''" :teaser="previewItem?.teaser"
            :data="previewItem?.props?.data" :cimg="previewItem?.cimg" :shape="previewItem?.props?.shape"
            :variant="previewItem?.props?.variant" @close="closePreviewModal" />
    </div>

    <Teleport v-else-if="interaction === 'popup'" to="body">
        <div v-if="isOpen" class="popup-overlay" @click.self="closePopup">
            <div class="popup-container">
                <div class="popup-header">
                    <h3>{{ title || 'Gallery' }}</h3>
                    <button class="popup-close-btn" @click="closePopup" aria-label="Close">×</button>
                </div>
                <div class="popup-content">
                    <div v-if="loading" class="item-gallery-loading">Loading...</div>
                    <div v-else-if="error" class="item-gallery-error">{{ error }}</div>
                    <div v-else class="item-gallery" :class="itemTypeClass">
                        <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                            :heading="item.heading" :cimg="item.cimg" :size="size" v-bind="item.props || {}"
                            @click="(e: MouseEvent) => emit('item-click', item, e)">
                            <template v-if="item.slot" #default>
                                <component :is="item.slot" />
                            </template>
                        </component>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div v-else-if="interaction === 'zoom'" class="item-gallery-zoom">
        <div class="zoom-trigger" @click="toggleZoom">
            <slot name="trigger">
                <button class="zoom-btn">{{ isZoomed ? 'Minimize' : 'Expand' }}</button>
            </slot>
        </div>
        <div v-if="isZoomed" class="zoom-overlay" @click.self="toggleZoom">
            <div class="zoom-container">
                <div v-if="loading" class="item-gallery-loading">Loading...</div>
                <div v-else-if="error" class="item-gallery-error">{{ error }}</div>
                <div v-else class="item-gallery" :class="itemTypeClass">
                    <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                        :heading="item.heading" :cimg="item.cimg" :size="size" v-bind="item.props || {}"
                        @click="(e: MouseEvent) => emit('item-click', item, e)">
                        <template v-if="item.slot" #default>
                            <component :is="item.slot" />
                        </template>
                    </component>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import ItemTile from './ItemTile.vue'
import ItemCard from './ItemCard.vue'
import ItemRow from './ItemRow.vue'
import ItemModalCard from './ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'
import type { ItemOptions, ItemModels } from './types'
import { getXmlIdPrefix, getXmlIdFragment, matchesXmlIdPrefix } from './xmlHelpers'

interface GalleryItem {
    heading: string
    cimg?: string
    props?: Record<string, any>
    slot?: any
    id?: number
}

interface EntityItem {
    id: number
    title?: string
    entityname?: string
    xmlID?: string
    img_thumb?: string
    img_square?: string
}

interface Props {
    items?: GalleryItem[]
    entity?: 'posts' | 'events' | 'instructors' | 'projects' | 'images' | 'all'
    project?: string
    images?: number[]
    filterIds?: number[] // Filter fetched entities by these IDs
    // XML ID filtering props
    filterXmlPrefix?: string
    filterXmlPrefixes?: string[]
    filterXmlPattern?: RegExp
    itemType?: 'tile' | 'card' | 'row'
    size?: 'small' | 'medium'
    headingLevel?: 'h3' | 'h4'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    interaction?: 'static' | 'popup' | 'zoom' | 'previewmodal'
    title?: string
    modelValue?: boolean
    // Selection props
    dataMode?: boolean
    multiSelect?: boolean
    selectedIds?: number | number[]
}

const props = withDefaults(defineProps<Props>(), {
    itemType: 'card',
    size: 'medium',
    headingLevel: 'h3',
    variant: 'default',
    interaction: 'static',
    dataMode: true,
    multiSelect: false
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: EntityItem | EntityItem[]]
    close: []
    'item-click': [item: any, event: MouseEvent]
}>()

const isOpen = computed({
    get: () => props.modelValue ?? false,
    set: (value: boolean) => emit('update:modelValue', value)
})

const isZoomed = ref(false)
const entityData = ref<EntityItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedIdsInternal = ref<Set<number>>(new Set())
const previewModalOpen = ref(false)
const previewItem = ref<any>(null)

// Error detection for invalid prop combinations
const validationError = computed(() => {
    // Error 1: Setting selectedIds requires dataMode=true
    if (!props.dataMode && props.selectedIds !== undefined) {
        return 'Setting Items requires DataMode'
    }

    // Error 2: Multiple IDs provided but multiSelect=false
    if (!props.multiSelect && Array.isArray(props.selectedIds) && props.selectedIds.length > 1) {
        return 'Only one Item can be selected'
    }

    return null
})

// Sync internal selection state with prop
watch(() => props.selectedIds, (newVal: any) => {
    if (newVal === undefined || newVal === null) {
        selectedIdsInternal.value.clear()
    } else if (typeof newVal === 'number') {
        selectedIdsInternal.value = new Set([newVal])
    } else {
        selectedIdsInternal.value = new Set(newVal)
    }
}, { immediate: true })

const dataModeActive = computed(() => {
    return props.dataMode && (props.entity !== undefined || props.images !== undefined)
})

const shape = computed<'card' | 'tile' | 'avatar'>(() => {
    if (props.size === 'small') return 'tile'
    return 'card'
})

const fetchEntityData = async () => {
    if (!dataModeActive.value) return

    loading.value = true
    error.value = null

    try {
        let url = ''

        if (props.images) {
            console.warn('Image-specific fetching not yet implemented')
            return
        }

        if (props.entity === 'posts') {
            url = '/api/posts'
        } else if (props.entity === 'events') {
            url = '/api/events'
        } else if (props.entity === 'instructors') {
            url = '/api/public-users'
        } else if (props.entity === 'all') {
            console.warn('Combined entity fetching not yet implemented')
            return
        }

        if (props.project) {
            url += `?project=${encodeURIComponent(props.project)}`
        }

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${props.entity}: ${response.statusText}`)
        }

        entityData.value = await response.json()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error fetching entity data:', err)
    } finally {
        loading.value = false
    }
}

const parseImageData = (jsonString: string | undefined): ImgShapeData | null => {
    if (!jsonString) return null

    try {
        const parsed = JSON.parse(jsonString)
        return {
            type: 'url',
            url: parsed.url || '',
            x: parsed.x ?? null,
            y: parsed.y ?? null,
            z: parsed.z ?? null,
            options: parsed.options ?? null,
            blur: parsed.blur ?? undefined,
            turl: parsed.turl ?? undefined,
            tpar: parsed.tpar ?? undefined,
            alt_text: parsed.alt_text ?? undefined
        }
    } catch {
        return null
    }
}

const entities = computed(() => {
    if (dataModeActive.value) {
        // Apply all filters in a single pass
        const filteredData = entityData.value.filter((entity: EntityItem) => {
            // Filter 1: Numeric ID filtering
            if (props.filterIds !== undefined) {
                if (!props.filterIds.includes(entity.id)) return false
            }

            // Filter 2: XML ID prefix filtering (single)
            if (props.filterXmlPrefix) {
                if (!entity.xmlID?.startsWith(props.filterXmlPrefix)) return false
            }

            // Filter 3: XML ID prefixes filtering (multiple with OR logic)
            if (props.filterXmlPrefixes && props.filterXmlPrefixes.length > 0) {
                if (!props.filterXmlPrefixes.some((prefix: string) => entity.xmlID?.startsWith(prefix))) {
                    return false
                }
            }

            // Filter 4: XML ID pattern filtering
            if (props.filterXmlPattern) {
                if (!entity.xmlID || !props.filterXmlPattern.test(entity.xmlID)) return false
            }

            return true
        })

        console.log('[ItemGallery] Filter results:', {
            total: entityData.value.length,
            filterIds: props.filterIds?.length,
            filterXmlPrefix: props.filterXmlPrefix,
            filterXmlPrefixes: props.filterXmlPrefixes?.length,
            filterXmlPattern: props.filterXmlPattern?.source,
            filtered: filteredData.length
        })

        // Transform to gallery items with proper image sizing
        return filteredData.map((entity: EntityItem) => {
            // For galleries, prefer larger images: use img_square for most cases
            const imageField = props.size === 'small' ? entity.img_thumb : entity.img_square
            const imageData = parseImageData(imageField)

            return {
                id: entity.id,
                xmlID: entity.xmlID,
                heading: entity.title || entity.entityname || `Item ${entity.id}`,
                cimg: undefined,
                props: {
                    data: imageData,
                    shape: shape.value,
                    variant: props.variant
                }
            }
        })
    }

    return props.items || []
})

const itemComponent = computed(() => {
    switch (props.itemType) {
        case 'tile':
            return ItemTile
        case 'row':
            return ItemRow
        case 'card':
        default:
            return ItemCard
    }
})

const itemTypeClass = computed(() => `item-type-${props.itemType}`)

/**
 * Get ItemOptions for an item based on dataMode and multiSelect
 * Checkbox only visible when BOTH dataMode=true AND multiSelect=true
 */
function getItemOptions(item: any): ItemOptions {
    return {
        entityIcon: false, // Can be enabled in future
        badge: false, // Can be enabled in future
        counter: false, // Can be enabled in future
        selectable: dataModeActive.value && props.multiSelect === true, // Show checkbox ONLY in multi-select mode
        marker: false // Can be enabled in future
    }
}

/**
 * Get ItemModels for an item (selection state, etc.)
 */
function getItemModels(item: any): ItemModels {
    return {
        selected: item.id ? selectedIdsInternal.value.has(item.id) : false,
        count: undefined,
        marked: undefined,
        entityType: undefined,
        badgeColor: undefined
    }
}

/**
 * Handle item click - toggles selection in data mode
 */
function handleItemClick(item: any, event: MouseEvent) {
    emit('item-click', item, event)

    // Only handle selection in data mode
    if (!dataModeActive.value || !item.id) return

    const itemId = item.id

    if (props.multiSelect) {
        // Multi-select: toggle selection
        const newSelection = new Set(selectedIdsInternal.value)
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId)
        } else {
            newSelection.add(itemId)
        }
        selectedIdsInternal.value = newSelection
        const selectedArray = Array.from(newSelection)
        emit('update:selectedIds', selectedArray.length > 0 ? selectedArray : null)
        emitSelectedData(selectedArray)
    } else {
        // Single-select: replace selection
        const isCurrentlySelected = selectedIdsInternal.value.has(itemId)
        selectedIdsInternal.value = isCurrentlySelected ? new Set() : new Set([itemId])
        emit('update:selectedIds', isCurrentlySelected ? null : itemId)
        emitSelectedData(isCurrentlySelected ? [] : [itemId])
    }
}

/**
 * Emit selection data with full entity objects and XML IDs
 */
function emitSelectedData(selectedIds: number[]) {
    const selectedItems = entityData.value.filter((item: EntityItem) => selectedIds.includes(item.id))

    // Extract xmlIDs
    const xmlIds = selectedItems.map((item: EntityItem) => item.xmlID).filter(Boolean) as string[]

    if (props.multiSelect) {
        emit('selectedXml', xmlIds)
    } else {
        emit('selectedXml', xmlIds[0] || '')
    }

    emit('selected', props.multiSelect ? selectedItems : selectedItems[0])
}

const closePopup = () => {
    emit('update:modelValue', false)
    emit('close')
}

const toggleZoom = () => {
    isZoomed.value = !isZoomed.value
}

const openPreviewModal = (item: any) => {
    previewItem.value = item
    previewModalOpen.value = true
    console.log('[ItemGallery] Opening preview modal for:', item.heading)
}

const closePreviewModal = () => {
    previewModalOpen.value = false
    // Delay clearing previewItem to allow modal close animation
    setTimeout(() => {
        previewItem.value = null
    }, 300)
}

onMounted(() => {
    if (dataModeActive.value) {
        fetchEntityData()
    }
})

defineExpose({
    open: () => { isOpen.value = true },
    close: closePopup,
    toggleZoom,
    refresh: fetchEntityData
})
</script>

<style scoped>
/* Static container */
.item-gallery-container {
    width: 100%;
}

.item-gallery {
    display: grid;
    gap: 1.5rem;
}

.item-gallery-loading,
.item-gallery-error,
.item-gallery-validation-error {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    font-family: var(--headings);
}

.item-gallery-error,
.item-gallery-validation-error {
    color: var(--color-negative-contrast);
    background: var(--color-negative-bg);
    border-radius: 0.5rem;
}

/* Grid layouts based on item type - gallery has larger items */
.item-type-card {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.item-type-tile {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.item-type-row {
    grid-template-columns: 1fr;
}

/* Popup styles */
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: oklch(from var(--color-gray-base) calc(l + 1 * (0 - l)) calc(c / 4.5) h / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.popup-container {
    background: var(--color-card-bg);
    border-radius: 0.75rem;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.popup-header h3 {
    margin: 0;
    font-family: var(--headings);
    color: var(--color-card-contrast);
}

.popup-close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    color: var(--color-dimmed);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: background-color 0.2s, color 0.2s;
}

.popup-close-btn:hover {
    background-color: var(--color-muted-bg);
    color: var(--color-card-contrast);
}

.popup-content {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
}

/* Zoom styles */
.item-gallery-zoom {
    position: relative;
}

.zoom-trigger {
    cursor: pointer;
}

.zoom-btn {
    padding: 0.5rem 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-family: var(--headings);
    font-weight: 500;
    transition: opacity 0.2s;
}

.zoom-btn:hover {
    opacity: 0.9;
}

.zoom-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: oklch(from var(--color-gray-base) calc(l + 1 * (0 - l)) calc(c / 4.5) h / 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 2rem;
}

.zoom-container {
    background: var(--color-card-bg);
    border-radius: 0.75rem;
    max-width: 95vw;
    max-height: 95vh;
    overflow-y: auto;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>
