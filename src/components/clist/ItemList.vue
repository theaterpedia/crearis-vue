<!--
  ItemList.vue - Primary container for list-based layouts
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
-->
<template>
    <div v-if="interaction === 'static'" class="item-list-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-list-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-list-loading">Loading...</div>
        <div v-else-if="error" class="item-list-error">{{ error }}</div>
        <div v-else class="item-list" :class="itemContainerClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="item.id || index"
                :heading="item.heading" :size="size" :style-compact="styleCompact" :heading-level="headingLevel"
                :anatomy="props.anatomy" :options="getItemOptions(item)" :models="getItemModels(item)"
                v-bind="item.props || {}" @click="(e: MouseEvent) => handleItemClick(item, e)"
                @trash="() => handleTrash(item)">
                <template v-if="item.slot" #default>
                    <component :is="item.slot" />
                </template>
            </component>
        </div>
    </div>

    <div v-else-if="interaction === 'previewmodal'" class="item-list-container">
        <!-- Validation Error Banner -->
        <div v-if="validationError" class="item-list-validation-error">
            ⚠️ {{ validationError }}
        </div>

        <div v-if="loading" class="item-list-loading">Loading...</div>
        <div v-else-if="error" class="item-list-error">{{ error }}</div>
        <div v-else class="item-list" :class="itemContainerClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="item.id || index"
                :heading="item.heading" :size="size" :style-compact="styleCompact" :heading-level="headingLevel"
                :anatomy="props.anatomy" :options="getItemOptions(item)" :models="getItemModels(item)"
                v-bind="item.props || {}" @click="() => openPreviewModal(item)"
                @trash="() => handleTrash(item)">
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
                    <h3>{{ title || 'Items' }}</h3>
                    <button class="popup-close-btn" @click="closePopup" aria-label="Close">×</button>
                </div>
                <div class="popup-content">
                    <div v-if="loading" class="item-list-loading">Loading...</div>
                    <div v-else-if="error" class="item-list-error">{{ error }}</div>
                    <div v-else class="item-list" :class="itemContainerClass">
                        <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                            :heading="item.heading" :size="size" v-bind="item.props || {}"
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

    <div v-else-if="interaction === 'zoom'" class="item-list-zoom">
        <div class="zoom-trigger" @click="toggleZoom">
            <slot name="trigger">
                <button class="zoom-btn">{{ isZoomed ? 'Minimize' : 'Expand' }}</button>
            </slot>
        </div>
        <div v-if="isZoomed" class="zoom-overlay" @click.self="toggleZoom">
            <div class="zoom-container">
                <div v-if="loading" class="item-list-loading">Loading...</div>
                <div v-else-if="error" class="item-list-error">{{ error }}</div>
                <div v-else class="item-list" :class="itemContainerClass">
                    <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                        :heading="item.heading" :size="size" v-bind="item.props || {}"
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
import { useTheme } from '@/composables/useTheme'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('ItemList')
import ItemTile from './ItemTile.vue'
import ItemRow from './ItemRow.vue'
import ItemModalCard from './ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'
import type { ItemOptions, ItemModels } from './types'
import { getXmlIdPrefix, getXmlIdFragment, matchesXmlIdPrefix } from './xmlHelpers'

interface ListItem {
    heading: string
    cimg?: string
    props?: Record<string, any>
    slot?: any
}

interface EntityItem {
    id: number
    title?: string
    entityname?: string
    xmlID?: string // Unique identifier for the entity
    img_thumb?: string // JSON string from API
    img_square?: string // JSON string from API
}

interface Props {
    items?: ListItem[] // Now optional
    entity?: 'posts' | 'events' | 'instructors' | 'projects' | 'images' | 'all'
    project?: string // domaincode filter
    images?: number[] // Specific image IDs to fetch
    filterIds?: number[] // Filter fetched entities by these IDs
    // XML ID filtering props
    filterXmlPrefix?: string // Filter by single XML ID prefix (e.g., "tp.event")
    filterXmlPrefixes?: string[] // Filter by multiple XML ID prefixes with OR logic
    filterXmlPattern?: RegExp // Filter by XML ID regex pattern
    // Status value filtering (0-6)
    statusLt?: number  // Less than
    statusEq?: number  // Equal
    statusGt?: number  // Greater than
    size?: 'small' | 'medium'
    width?: 'inherit' | 'small' | 'medium' | 'large' // Item width control
    columns?: 'off' | 'on' // Enable multi-column wrapping
    avatarShape?: 'round' | 'square' // Only for size="small" - forces avatar shape
    headingLevel?: 'h3' | 'h4' // Heading level for medium items
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
    interaction?: 'static' | 'popup' | 'zoom' | 'previewmodal'
    title?: string
    modelValue?: boolean
    // Selection props
    dataMode?: boolean // True = uses entity data and emits selections, False = static display only
    multiSelect?: boolean // Allow multiple selections
    selectedIds?: number | number[] // v-model for selected item IDs
    // Trash action
    showTrash?: boolean // Show trash icon on items for delete action
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    width: 'inherit',
    columns: 'off',
    headingLevel: 'h3',
    variant: 'default',
    anatomy: 'bottomimage',
    interaction: 'static',
    dataMode: true, // Default to true per requirements
    multiSelect: false
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: EntityItem | EntityItem[]]
    close: []
    'item-click': [item: any, event: MouseEvent]
    'item-trash': [item: any]
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
 * Determine if we're in data mode (fetching from API)
 */
const dataModeActive = computed(() => {
    return props.dataMode && (props.entity !== undefined || props.images !== undefined)
})

/**
 * Compute shape for ImgShape component
 * 
 * Returns ImgShape-compatible dimension types:
 * - 'thumb': 64px (for size="small", uses img_thumb field)
 * - 'square': 128px (for size="medium", uses img_square field)
 * 
 * These match the dimensionMap keys in ImgShape component.
 */
const shape = computed<'thumb' | 'square'>(() => {
    // Small size uses thumb shape (64px) - for img_thumb database field
    if (props.size === 'small') {
        return 'thumb'
    }
    // Medium+ sizes use square shape (128px) - for img_square database field
    return 'square'
})

/**
 * Compute variant based on size and entity
 * 
 * SAFETY RULE: Tile shape MUST use variant="square" (other tile variants unsafe)
 * For images entity: size=medium uses img_square field, so variant must be square
 * For avatarShape prop: overrides variant for small size
 */
const computedVariant = computed(() => {
    // For size="small" with avatarShape prop, use that shape
    if (props.size === 'small' && props.avatarShape) {
        return props.avatarShape
    }

    // SAFETY: Always use square variant with tile shape (other variants unsafe)
    // For images entity with medium size, force square variant to match img_square field
    if (props.entity === 'images' && props.size === 'medium') {
        return 'square'
    }
    // Default to square for tile safety (even if variant prop provided)
    return props.variant || 'square'
})

/**
 * Compute item width in pixels
 * - small: card-width / 2
 * - medium: card-width (current implementation, styleCompact)
 * - large: card-width
 * - inherit: controlled by parent
 */
const itemWidth = computed(() => {
    const { cardWidth } = useTheme()
    const cardWidthPx = cardWidth.value || 336

    if (props.width === 'small') return Math.round(cardWidthPx / 2)
    if (props.width === 'medium') return cardWidthPx
    if (props.width === 'large') return cardWidthPx
    return null // inherit from parent
})

/**
 * Determine if styleCompact should be used
 * - Always true when width is below card-width
 * - For width="medium" (current implementation): true
 */
const styleCompact = computed(() => {
    const { cardWidth } = useTheme()
    const cardWidthPx = cardWidth.value || 336

    if (itemWidth.value && itemWidth.value < cardWidthPx) return true
    if (props.width === 'medium') return true // Current implementation
    return false
})

/**
 * Compute number of columns for flex wrapping
 * - If width="small": always 1 column
 * - If columns="off": 1 column
 * - If columns="on": calculate based on available space
 */
const columnCount = computed(() => {
    if (props.width === 'small') return 1
    if (props.columns === 'off') return 1
    return 2 // Default to 2 columns when enabled
})

/**
 * Auto-select component based on size
 * - size="small" → ItemRow (with avatar shape)
 * - size="medium" → ItemTile (with tile shape)
 */
const itemComponent = computed(() => {
    if (props.size === 'small') return ItemRow
    return ItemTile
})

/**
 * Fetch entity data from API
 */
const fetchEntityData = async () => {
    if (!dataModeActive.value) {
        if (debug.isEnabled()) debug.log(' fetchEntityData skipped - dataModeActive=false', {
            dataMode: props.dataMode,
            entity: props.entity,
            images: props.images
        })
        return
    }

    loading.value = true
    error.value = null

    if (debug.isEnabled()) debug.log(' fetchEntityData START', {
        entity: props.entity,
        project: props.project,
        statusLt: props.statusLt,
        statusEq: props.statusEq,
        statusGt: props.statusGt
    })

    try {
        let url = ''

        if (props.images) {
            // Fetch specific images (not implemented in this iteration)
            // Would need /api/images?ids=1,2,3
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
            // Fetch all entities (would need combined endpoint)
            console.warn('Combined entity fetching not yet implemented')
            return
        }

        // Add project filter if specified
        if (props.project) {
            url += `?project=${encodeURIComponent(props.project)}`
        }

        // Add status filters if specified (0-6 values)
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

        if (debug.isEnabled()) debug.log(' Fetching URL:', url)

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
                if (debug.isEnabled()) debug.log(' Fetch SUCCESS - received', entityData.value.length, 'items')

                // Sort events by date_begin (ascending - earliest first)
                if (props.entity === 'events' && Array.isArray(entityData.value)) {
                    entityData.value.sort((a, b) => {
                        if (!a.date_begin) return 1  // null dates to end
                        if (!b.date_begin) return -1
                        return new Date(a.date_begin).getTime() - new Date(b.date_begin).getTime()
                    })
                    if (debug.isEnabled()) debug.log(' Events sorted by date_begin')
                }
            } catch (parseError) {
                console.error('Failed to parse JSON:', text.substring(0, 100))
                throw new Error(`Invalid JSON response from ${props.entity} API`)
            }
        } else {
            // Fallback for test mocks that return data directly
            entityData.value = await response.json()
            if (debug.isEnabled()) debug.log(' Fetch SUCCESS (mock) - received', entityData.value.length, 'items')

            // Sort events by date_begin (ascending - earliest first)
            if (props.entity === 'events' && Array.isArray(entityData.value)) {
                entityData.value.sort((a, b) => {
                    if (!a.date_begin) return 1  // null dates to end
                    if (!b.date_begin) return -1
                    return new Date(a.date_begin).getTime() - new Date(b.date_begin).getTime()
                })
                if (debug.isEnabled()) debug.log(' Events sorted by date_begin')
            }
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ItemList] Error fetching entity data:', err)
    } finally {
        loading.value = false
    }
}

/**
 * Parse img_thumb or img_square JSONB from PostgreSQL entity
 * PostgreSQL JSONB fields are returned as objects by the database driver
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
 * Get final entities list (either from items prop or fetched data)
 */
const entities = computed(() => {
    if (dataModeActive.value) {
        // Apply all filters in a single pass for performance
        const filteredData = entityData.value.filter((entity: any) => {
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
                if (!props.filterXmlPrefixes.some(prefix => entity.xmlID?.startsWith(prefix))) {
                    return false
                }
            }

            // Filter 4: XML ID pattern filtering
            if (props.filterXmlPattern) {
                if (!entity.xmlID || !props.filterXmlPattern.test(entity.xmlID)) return false
            }

            return true
        })

        if (debug.isEnabled()) debug.log(' Filter results:', {
            total: entityData.value.length,
            filterIds: props.filterIds?.length,
            filterXmlPrefix: props.filterXmlPrefix,
            filterXmlPrefixes: props.filterXmlPrefixes?.length,
            filterXmlPattern: props.filterXmlPattern?.source,
            filtered: filteredData.length
        })

        // Transform entity data to ListItem format
        return filteredData.map((entity: any) => {
            let imageData = null
            let hasDeprecatedCimg = false

            // Handle images entity - use computed fields based on size
            if (props.entity === 'images') {
                // Strict mapping: small=img_thumb, medium=img_square
                // No fallbacks - will error if field is missing
                const fieldName = props.size === 'small' ? 'img_thumb' : 'img_square'
                const imageField = props.size === 'small' ? entity.img_thumb : entity.img_square
                if (debug) console.log(`[ItemList] Image ${entity.id}: size="${props.size}" → field="${fieldName}"`, imageField)
                if (!imageField) {
                    throw new Error(`Missing ${fieldName} for image entity ${entity.id}`)
                }
                imageData = parseImageData(imageField)
                if (debug) console.log(`[ItemList] Image ${entity.id}: parsed imageData`, imageData)
            } else {
                // Other entities: small=img_thumb, medium=img_square
                const imageField = props.size === 'small' ? entity.img_thumb : entity.img_square
                imageData = parseImageData(imageField)
                hasDeprecatedCimg = entity.cimg && !imageData
            }

            // Determine heading based on entity type
            let heading = ''
            if (props.entity === 'projects') {
                // Projects use 'heading' field
                heading = entity.heading || entity.name || `Project ${entity.id}`
            } else if (props.entity === 'images') {
                // Images: Use special format '** **{about}' - no headline, show about as subline
                heading = `** **${entity.about || 'Image ' + entity.id}`
            } else {
                // Standard entities: title, name, or entityname
                heading = entity.title || entity.name || entity.entityname || `Item ${entity.id}`
            }

            return {
                // Preserve original entity data for @item-click emission
                ...entity,
                // Override specific fields for display
                heading: heading,
                cimg: undefined, // Don't use legacy cimg - force undefined after spread
                props: {
                    data: imageData,
                    shape: shape.value,
                    variant: computedVariant.value,
                    deprecated: hasDeprecatedCimg, // Flag for warning overlay
                    dateBegin: entity.date_begin // Pass date_begin for ItemRow headingPrefix
                }
            }
        })
    }

    return props.items || []
})

const itemContainerClass = computed(() => {
    const classes: string[] = []

    // Width class
    if (props.width !== 'inherit') {
        classes.push(`width-${props.width}`)
    }

    // Columns class
    if (props.columns === 'on' && props.width !== 'small') {
        classes.push('columns-on')
    }

    return classes.join(' ')
})

const closePopup = () => {
    emit('update:modelValue', false)
    emit('close')
}

const toggleZoom = () => {
    isZoomed.value = !isZoomed.value
}

/**
 * Open preview modal with item data
 */
const openPreviewModal = (item: any) => {
    previewItem.value = item
    previewModalOpen.value = true
}

/**
 * Close preview modal
 */
const closePreviewModal = () => {
    previewModalOpen.value = false
    setTimeout(() => {
        previewItem.value = null
    }, 300) // Wait for animation
}

/**
 * Get ItemOptions for an item based on dataMode and multiSelect
 * Checkbox only visible when BOTH dataMode=true AND multiSelect=true
 */
const getItemOptions = (item: any): ItemOptions => {
    if (!props.dataMode) return {}

    return {
        selectable: props.multiSelect === true, // Show checkbox ONLY in multi-select mode
        entityIcon: false,
        badge: false,
        counter: false,
        marker: false,
        trash: props.showTrash === true // Show trash icon when enabled
    }
}

/**
 * Get ItemModels for an item
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
 * Handle trash icon click - emit item-trash event
 */
const handleTrash = (item: any) => {
    emit('item-trash', item)
}

/**
 * Handle item click - manage selection state
 */
const handleItemClick = (item: any, event: MouseEvent) => {
    // Always emit the original click event
    emit('item-click', item, event)

    // In dataMode, handle selection
    if (props.dataMode && item.id !== undefined) {
        const itemId = item.id

        if (props.multiSelect) {
            // Toggle selection in multi-select mode
            const newSelection = new Set(selectedIdsInternal.value)
            if (newSelection.has(itemId)) {
                newSelection.delete(itemId)
            } else {
                newSelection.add(itemId)
            }
            selectedIdsInternal.value = newSelection

            // Emit as array
            const selectedArray = Array.from(newSelection)
            emit('update:selectedIds', selectedArray.length > 0 ? selectedArray : null)

            // Emit selectedXml and selected items
            emitSelectedData(selectedArray)
        } else {
            // Single select mode - replace selection
            const isCurrentlySelected = selectedIdsInternal.value.has(itemId)

            if (isCurrentlySelected) {
                // Deselect
                selectedIdsInternal.value.clear()
                emit('update:selectedIds', null)
                emit('selectedXml', '')
                emit('selected', null as any)
            } else {
                // Select this item only
                selectedIdsInternal.value = new Set([itemId])
                emit('update:selectedIds', itemId)

                // Emit selectedXml and selected item
                emitSelectedData([itemId])
            }
        }
    }
}

/**
 * Emit selected XML IDs and items based on current selection
 */
const emitSelectedData = (selectedIds: number[]) => {
    const selectedItems = entityData.value.filter(item => selectedIds.includes(item.id))

    if (selectedItems.length === 0) {
        emit('selectedXml', props.multiSelect ? [] : '')
        emit('selected', props.multiSelect ? [] : (null as any))
        return
    }

    // Extract xmlIDs
    const xmlIds = selectedItems.map(item => item.xmlID).filter(Boolean) as string[]

    if (props.multiSelect) {
        emit('selectedXml', xmlIds)
        emit('selected', selectedItems)
    } else {
        emit('selectedXml', xmlIds[0] || '')
        emit('selected', selectedItems[0])
    }
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
    refresh: fetchEntityData,
    // Expose data for parent components (like DropdownList)
    entityData: computed(() => entityData.value),
    entities: entities,
    selectedIdsInternal: computed(() => Array.from(selectedIdsInternal.value))
})
</script>

<style scoped>
/* Static container */
.item-list-container {
    width: 100%;
}

/* Validation Error Banner */
.item-list-validation-error {
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    border-radius: var(--radius);
    border-left: 4px solid var(--color-warning);
    font-weight: 500;
    /* Ensure banner takes full available width */
    width: 100%;
    box-sizing: border-box;
}

.item-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Width variations */
.item-list.width-small {
    width: calc(var(--card-width) * 0.5);
    /* 168px (0.5 × card-width) */
}

.item-list.width-medium {
    width: var(--card-width);
    /* 336px (card-width) */
}

.item-list.width-large {
    width: var(--card-width);
    /* 336px (card-width) */
}

/* Columns enabled: flex wrap */
.item-list.columns-on {
    flex-direction: row;
    flex-wrap: wrap;
}

.item-list-loading,
.item-list-error {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    font-family: var(--headings);
}

.item-list-error {
    color: var(--color-negative-contrast);
    background: var(--color-negative-bg);
    border-radius: 0.5rem;
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
.item-list-zoom {
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
