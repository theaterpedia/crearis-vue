<!--
  ItemSlider.vue - Horizontal carousel for items with Swiper
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component slides items horizontally using Swiper library.
  Features full parity with ItemList and ItemGallery (entity fetching,
  filtering, interaction modes, visual indicators, etc.)
  
  Size Mapping:
  - small: ItemTile (size="medium") - 128×128px compact tiles
  - medium: ItemTile (size="large") - 128×128px with stats/teaser
  - large: ItemCard (size="medium") - Full cards with anatomy
-->
<template>
    <div v-if="interaction === 'static'" class="item-slider-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-slider-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-slider-loading">Loading...</div>
        <div v-else-if="error" class="item-slider-error">{{ error }}</div>
        <Slider v-else-if="entities.length > 0">
            <Slide v-for="(item, index) in entities" :key="item.id || index">
                <div class="slider-item-wrapper" :style="itemWidthStyle">
                    <component :is="itemComponent" :heading="item.heading" :size="itemComponentSize" :shape="itemShape"
                        :anatomy="anatomy" :heading-level="headingLevel" :style-compact="styleCompact"
                        :options="getItemOptions(item)" :models="getItemModels(item)" v-bind="item.props || {}"
                        @click="(e: MouseEvent) => handleItemClick(item, e)">
                        <template v-if="item.slot" #default>
                            <component :is="item.slot" />
                        </template>
                    </component>
                </div>
            </Slide>
        </Slider>
        <div v-else class="item-slider-empty">
            No items to display
        </div>
    </div>

    <div v-else-if="interaction === 'previewmodal'" class="item-slider-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-slider-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-slider-loading">Loading...</div>
        <div v-else-if="error" class="item-slider-error">{{ error }}</div>
        <Slider v-else-if="entities.length > 0">
            <Slide v-for="(item, index) in entities" :key="item.id || index">
                <div class="slider-item-wrapper" :style="itemWidthStyle">
                    <component :is="itemComponent" :heading="item.heading" :size="itemComponentSize" :shape="itemShape"
                        :anatomy="anatomy" :heading-level="headingLevel" :style-compact="styleCompact"
                        :options="getItemOptions(item)" :models="getItemModels(item)" v-bind="item.props || {}"
                        @click="() => openPreviewModal(item)">
                        <template v-if="item.slot" #default>
                            <component :is="item.slot" />
                        </template>
                    </component>
                </div>
            </Slide>
        </Slider>

        <!-- Preview Modal -->
        <ItemModalCard :is-open="previewModalOpen" :heading="previewItem?.heading || ''" :teaser="previewItem?.teaser"
            :data="previewItem?.props?.data" :cimg="previewItem?.cimg" :shape="previewItem?.props?.shape"
            :anatomy="modalAnatomy" @close="closePreviewModal" />
    </div>

    <Teleport v-else-if="interaction === 'popup'" to="body">
        <div v-if="isOpen" class="popup-overlay" @click.self="closePopup">
            <div class="popup-container">
                <div class="popup-header">
                    <h3>{{ title || 'Items' }}</h3>
                    <button class="popup-close-btn" @click="closePopup" aria-label="Close">×</button>
                </div>
                <div class="popup-content">
                    <div v-if="loading" class="item-slider-loading">Loading...</div>
                    <div v-else-if="error" class="item-slider-error">{{ error }}</div>
                    <Slider v-else-if="entities.length > 0">
                        <Slide v-for="(item, index) in entities" :key="index">
                            <div class="slider-item-wrapper" :style="itemWidthStyle">
                                <component :is="itemComponent" :heading="item.heading" :size="itemComponentSize"
                                    :shape="itemShape" v-bind="item.props || {}"
                                    @click="(e: MouseEvent) => emit('item-click', item, e)">
                                    <template v-if="item.slot" #default>
                                        <component :is="item.slot" />
                                    </template>
                                </component>
                            </div>
                        </Slide>
                    </Slider>
                </div>
            </div>
        </div>
    </Teleport>

    <div v-else-if="interaction === 'zoom'" class="item-slider-zoom">
        <div class="zoom-trigger" @click="toggleZoom">
            <slot name="trigger">
                <button class="zoom-btn">{{ isZoomed ? 'Minimize' : 'Expand' }}</button>
            </slot>
        </div>
        <div v-if="isZoomed" class="zoom-overlay" @click.self="toggleZoom">
            <div class="zoom-container">
                <div v-if="loading" class="item-slider-loading">Loading...</div>
                <div v-else-if="error" class="item-slider-error">{{ error }}</div>
                <Slider v-else-if="entities.length > 0">
                    <Slide v-for="(item, index) in entities" :key="index">
                        <div class="slider-item-wrapper" :style="itemWidthStyle">
                            <component :is="itemComponent" :heading="item.heading" :size="itemComponentSize"
                                :shape="itemShape" v-bind="item.props || {}"
                                @click="(e: MouseEvent) => emit('item-click', item, e)">
                                <template v-if="item.slot" #default>
                                    <component :is="item.slot" />
                                </template>
                            </component>
                        </div>
                    </Slide>
                </Slider>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('ItemSlider')
import Slider from '@/components/Slider.vue'
import Slide from '@/components/Slide.vue'
import ItemTile from './ItemTile.vue'
import ItemCard from './ItemCard.vue'
import ItemModalCard from './ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'
import type { ItemOptions, ItemModels } from './types'
import { getXmlIdPrefix, getXmlIdFragment, matchesXmlIdPrefix } from './xmlHelpers'

interface SliderItem {
    heading: string
    cimg?: string
    props?: Record<string, any>
    slot?: any
}

interface EntityItem {
    id: number
    title?: string
    entityname?: string
    xmlID?: string
    img_thumb?: string
    img_square?: string
    date_begin?: string
    date_end?: string
    teaser?: string
}

interface Props {
    items?: SliderItem[]
    entity?: 'posts' | 'events' | 'instructors' | 'projects' | 'images' | 'all'
    project?: string
    images?: number[]
    filterIds?: number[]
    // XML ID filtering
    filterXmlPrefix?: string
    filterXmlPrefixes?: string[]
    filterXmlPattern?: RegExp
    // Status filtering (0-6)
    statusLt?: number
    statusEq?: number
    statusGt?: number
    // Size determines item component
    size?: 'small' | 'medium' | 'large'
    // Width control (only 'inherit' for now)
    itemWidth?: 'inherit'
    // Shape for items
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    // Anatomy for large size (ItemCard)
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
    // Heading level
    headingLevel?: 'h3' | 'h4' | 'h5'
    // Interaction mode
    interaction?: 'static' | 'popup' | 'zoom' | 'previewmodal'
    title?: string
    modelValue?: boolean
    // Selection
    dataMode?: boolean
    multiSelect?: boolean
    selectedIds?: number | number[]
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    itemWidth: 'inherit',
    shape: 'square',
    anatomy: 'bottomimage',
    headingLevel: 'h3',
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
    set: (value) => emit('update:modelValue', value)
})

const isZoomed = ref(false)
const entityData = ref<EntityItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedIdsInternal = ref<Set<number>>(new Set())

// Preview modal state
const previewModalOpen = ref(false)
const previewItem = ref<any>(null)

// Modal anatomy (use heroimage for preview)
const modalAnatomy = computed(() => 'heroimage' as const)

// Validation errors
const validationError = computed(() => {
    if (!props.dataMode && props.selectedIds !== undefined) {
        return 'Setting Items requires DataMode'
    }
    if (!props.multiSelect && Array.isArray(props.selectedIds) && props.selectedIds.length > 1) {
        return 'Only one Item can be selected'
    }
    return null
})

// Sync internal selection state
watch(() => props.selectedIds, (newVal) => {
    if (newVal === undefined || newVal === null) {
        selectedIdsInternal.value.clear()
    } else if (typeof newVal === 'number') {
        selectedIdsInternal.value = new Set([newVal])
    } else {
        selectedIdsInternal.value = new Set(newVal)
    }
}, { immediate: true })

/**
 * Determine if we're in data mode
 */
const dataModeActive = computed(() => {
    return props.dataMode && (props.entity !== undefined || props.images !== undefined)
})

/**
 * Component selection based on size
 * - small: ItemTile
 * - medium: ItemTile
 * - large: ItemCard
 */
const itemComponent = computed(() => {
    if (props.size === 'large') return ItemCard
    return ItemTile
})

/**
 * Map slider size to item component size
 * - small → ItemTile medium (128×128px)
 * - medium → ItemTile large (128×128px with stats/teaser)
 * - large → ItemCard medium (full card)
 */
const itemComponentSize = computed(() => {
    if (props.size === 'small') return 'medium'
    if (props.size === 'medium') return 'large'
    return 'medium' // ItemCard medium
})

/**
 * Style compact for ItemTile
 * Always true for small/medium (overlay style in slider)
 */
const styleCompact = computed(() => {
    return props.size !== 'large'
})

/**
 * Shape for items
 * Small/medium use square by default, large uses wide
 */
const itemShape = computed(() => {
    if (props.size === 'large' && props.shape === 'square') {
        return 'wide' // ItemCard works better with wide
    }
    return props.shape
})

/**
 * Item width style
 */
const itemWidthStyle = computed(() => {
    if (props.itemWidth === 'inherit') {
        return { width: 'inherit' }
    }
    return {}
})

/**
 * Fetch entity data from API
 */
const fetchEntityData = async () => {
    if (!dataModeActive.value) {
        if (debug.isEnabled()) debug.log('fetchEntityData skipped - dataModeActive=false')
        return
    }

    loading.value = true
    error.value = null

    if (debug.isEnabled()) debug.log('fetchEntityData START', {
        entity: props.entity,
        project: props.project,
        statusLt: props.statusLt,
        statusEq: props.statusEq,
        statusGt: props.statusGt
    })

    try {
        let url = ''

        if (props.images) {
            console.warn('Image-specific fetching not yet implemented')
            return
        }

        // Fetch by entity type
        if (props.entity === 'posts') {
            url = '/api/posts'
        } else if (props.entity === 'events') {
            url = '/api/events'
        } else if (props.entity === 'instructors') {
            url = '/api/public-users'
        } else if (props.entity === 'projects') {
            url = '/api/projects'
        } else if (props.entity === 'images') {
            url = '/api/images'
        } else if (props.entity === 'all') {
            console.warn('Combined entity fetching not yet implemented')
            return
        }

        // Add project filter
        if (props.project) {
            url += `?project=${encodeURIComponent(props.project)}`
        }

        // Add status filters
        const urlObj = new URL(url, window.location.origin)
        if (props.statusLt !== undefined && props.statusLt >= 0 && props.statusLt <= 6) {
            urlObj.searchParams.append('status_lt', String(props.statusLt))
        }
        if (props.statusEq !== undefined && props.statusEq >= 0 && props.statusEq <= 6) {
            urlObj.searchParams.append('status_eq', String(props.statusEq))
        }
        if (props.statusGt !== undefined && props.statusGt >= 0 && props.statusGt <= 6) {
            urlObj.searchParams.append('status_gt', String(props.statusGt))
        }
        url = urlObj.pathname + urlObj.search

        if (debug.isEnabled()) debug.log('Fetching URL:', url)

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${props.entity}: ${response.statusText}`)
        }

        // Handle both real responses and test mocks
        if (typeof response.text === 'function') {
            const text = await response.text()
            if (!text || text.trim() === '') {
                throw new Error(`Empty response from ${props.entity} API`)
            }
            try {
                entityData.value = JSON.parse(text)
                if (debug.isEnabled()) debug.log('Fetch SUCCESS - received', entityData.value.length, 'items')

                // Sort events by date_begin
                if (props.entity === 'events' && Array.isArray(entityData.value)) {
                    entityData.value.sort((a, b) => {
                        if (!a.date_begin) return 1
                        if (!b.date_begin) return -1
                        return new Date(a.date_begin).getTime() - new Date(b.date_begin).getTime()
                    })
                    if (debug.isEnabled()) debug.log('Events sorted by date_begin')
                }
            } catch (parseError) {
                console.error('Failed to parse JSON:', text.substring(0, 100))
                throw new Error(`Invalid JSON response from ${props.entity} API`)
            }
        } else {
            entityData.value = await response.json()
            if (debug.isEnabled()) debug.log('Fetch SUCCESS (mock) - received', entityData.value.length, 'items')

            // Sort events by date_begin
            if (props.entity === 'events' && Array.isArray(entityData.value)) {
                entityData.value.sort((a, b) => {
                    if (!a.date_begin) return 1
                    if (!b.date_begin) return -1
                    return new Date(a.date_begin).getTime() - new Date(b.date_begin).getTime()
                })
                if (debug.isEnabled()) debug.log('Events sorted by date_begin')
            }
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ItemSlider] Error fetching entity data:', err)
    } finally {
        loading.value = false
    }
}

/**
 * Parse JSONB image data from PostgreSQL
 */
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

/**
 * Get final entities list
 */
const entities = computed(() => {
    if (dataModeActive.value) {
        // Apply all filters
        const filteredData = entityData.value.filter((entity: any) => {
            // Filter by numeric IDs
            if (props.filterIds !== undefined) {
                if (!props.filterIds.includes(entity.id)) return false
            }

            // Filter by XML ID prefix (single)
            if (props.filterXmlPrefix) {
                if (!entity.xmlID?.startsWith(props.filterXmlPrefix)) return false
            }

            // Filter by XML ID prefixes (multiple with OR)
            if (props.filterXmlPrefixes && props.filterXmlPrefixes.length > 0) {
                if (!props.filterXmlPrefixes.some(prefix => entity.xmlID?.startsWith(prefix))) {
                    return false
                }
            }

            // Filter by XML ID pattern
            if (props.filterXmlPattern) {
                if (!entity.xmlID || !props.filterXmlPattern.test(entity.xmlID)) return false
            }

            return true
        })

        if (debug.isEnabled()) debug.log('Filter results:', {
            total: entityData.value.length,
            filtered: filteredData.length
        })

        // Transform entity data to SliderItem format
        return filteredData.map((entity: any) => {
            let imageData = null
            let hasDeprecatedCimg = false

            // Use img_square for all slider sizes (consistent display)
            const imageField = entity.img_square
            imageData = parseImageData(imageField)
            hasDeprecatedCimg = entity.cimg && !imageData

            // Determine heading
            let heading = ''
            if (props.entity === 'projects') {
                heading = entity.heading || entity.name || `Project ${entity.id}`
            } else if (props.entity === 'images') {
                heading = `** **${entity.about || 'Image ' + entity.id}`
            } else {
                heading = entity.title || entity.name || entity.entityname || `Item ${entity.id}`
            }

            return {
                ...entity,
                heading: heading,
                cimg: undefined,
                props: {
                    data: imageData,
                    shape: itemShape.value,
                    deprecated: hasDeprecatedCimg,
                    dateBegin: entity.date_begin,
                    dateEnd: entity.date_end,
                    teaser: entity.teaser
                }
            }
        })
    }

    return props.items || []
})

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
}

const closePreviewModal = () => {
    previewModalOpen.value = false
    setTimeout(() => {
        previewItem.value = null
    }, 300)
}

/**
 * Get ItemOptions for visual indicators
 */
const getItemOptions = (item: any): ItemOptions => {
    if (!props.dataMode) return {}

    return {
        selectable: props.multiSelect === true,
        entityIcon: false,
        badge: false,
        counter: false,
        marker: false
    }
}

/**
 * Get ItemModels for item state
 */
const getItemModels = (item: any): ItemModels => {
    if (!props.dataMode) return {}

    return {
        selected: selectedIdsInternal.value.has(item.id),
        count: 0,
        marked: undefined,
        entityType: undefined,
        badgeColor: undefined
    }
}

/**
 * Handle item click
 */
const handleItemClick = (item: any, event: MouseEvent) => {
    emit('item-click', item, event)

    if (props.dataMode && item.id !== undefined) {
        const itemId = item.id

        if (props.multiSelect) {
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
            const isCurrentlySelected = selectedIdsInternal.value.has(itemId)

            if (isCurrentlySelected) {
                selectedIdsInternal.value.clear()
                emit('update:selectedIds', null)
                emit('selectedXml', '')
                emit('selected', null as any)
            } else {
                selectedIdsInternal.value = new Set([itemId])
                emit('update:selectedIds', itemId)
                emitSelectedData([itemId])
            }
        }
    }
}

/**
 * Emit selected XML IDs and items
 */
const emitSelectedData = (selectedIds: number[]) => {
    const selectedItems = entityData.value.filter(item => selectedIds.includes(item.id))

    if (selectedItems.length === 0) {
        emit('selectedXml', props.multiSelect ? [] : '')
        emit('selected', props.multiSelect ? [] : (null as any))
        return
    }

    if (props.multiSelect) {
        const xmlIds = selectedItems.map(item => item.xmlID).filter(Boolean) as string[]
        emit('selectedXml', xmlIds)
        emit('selected', selectedItems)
    } else {
        const item = selectedItems[0]
        emit('selectedXml', item.xmlID || '')
        emit('selected', item)
    }
}

// Lifecycle
onMounted(() => {
    fetchEntityData()
})

watch(() => [props.entity, props.project, props.statusLt, props.statusEq, props.statusGt], () => {
    fetchEntityData()
})
</script>

<style scoped>
/* Container */
.item-slider-container {
    position: relative;
}

/* Loading/Error/Empty states */
.item-slider-loading,
.item-slider-error,
.item-slider-empty {
    padding: 2rem;
    text-align: center;
    border-radius: var(--radius);
}

.item-slider-loading {
    color: var(--color-text-subtle);
}

.item-slider-error {
    color: var(--color-negative-contrast);
    background: var(--color-negative-bg);
}

.item-slider-validation-error {
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    border-radius: var(--radius);
    text-align: center;
}

.item-slider-empty {
    color: var(--color-text-muted);
    background: var(--color-neutral-bg);
}

/* Slider item wrapper - controls item width */
.slider-item-wrapper {
    width: inherit;
    height: 100%;
}

/* Ensure items respect wrapper width */
.slider-item-wrapper :deep(.item-tile),
.slider-item-wrapper :deep(.item-card) {
    width: inherit;
}

/* Popup mode */
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.popup-container {
    background: var(--color-bg);
    border-radius: var(--radius);
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    color: var(--color-text);
}

.popup-close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-subtle);
    padding: 0;
    width: 2rem;
    height: 2rem;
}

.popup-close-btn:hover {
    color: var(--color-text);
}

.popup-content {
    flex: 1;
    overflow: auto;
    padding: 1.5rem;
}

/* Zoom mode */
.item-slider-zoom {
    position: relative;
}

.zoom-trigger {
    margin-bottom: 1rem;
}

.zoom-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
}

.zoom-btn:hover {
    opacity: 0.9;
}

.zoom-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.zoom-container {
    width: 100%;
    max-width: 1200px;
}
</style>
