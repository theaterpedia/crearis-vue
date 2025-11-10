<!--
  ItemList.vue - Primary container for list-based layouts
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
-->
<template>
    <div v-if="interaction === 'static'" class="item-list-container">
        <div v-if="loading" class="item-list-loading">Loading...</div>
        <div v-else-if="error" class="item-list-error">{{ error }}</div>
        <div v-else class="item-list" :class="itemContainerClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="index" :heading="item.heading"
                :size="size" :style-compact="styleCompact" :heading-level="headingLevel" v-bind="item.props || {}"
                @click="(e: MouseEvent) => emit('item-click', item, e)">
                <template v-if="item.slot" #default>
                    <component :is="item.slot" />
                </template>
            </component>
        </div>
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
import { computed, ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import ItemTile from './ItemTile.vue'
import ItemRow from './ItemRow.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

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
    img_thumb?: string // JSON string from API
    img_square?: string // JSON string from API
}

interface Props {
    items?: ListItem[] // Now optional
    entity?: 'posts' | 'events' | 'instructors' | 'projects' | 'images' | 'all'
    project?: string // domaincode filter
    images?: number[] // Specific image IDs to fetch
    filterIds?: number[] // Filter fetched entities by these IDs
    size?: 'small' | 'medium'
    width?: 'inherit' | 'small' | 'medium' | 'large' // Item width control
    columns?: 'off' | 'on' // Enable multi-column wrapping
    avatarShape?: 'round' | 'square' // Only for size="small" - forces avatar shape
    headingLevel?: 'h3' | 'h4' // Heading level for medium items
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    interaction?: 'static' | 'popup' | 'zoom'
    title?: string
    modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    width: 'inherit',
    columns: 'off',
    headingLevel: 'h3',
    variant: 'default',
    interaction: 'static'
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
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

/**
 * Determine if we're in data mode (fetching from API)
 */
const dataMode = computed(() => {
    return props.entity !== undefined || props.images !== undefined
})

/**
 * Compute shape for image display based on size
 * NOTE: This is the IMAGE shape (actual display size), not the container shape
 * 
 * SAFETY: Following production-safe patterns:
 * - size="small" (60-80px) → 'avatar' shape (64px, safe for all variants)
 * - size="medium"+ → 'tile' shape with variant="square" ONLY
 * 
 * Tile variants default/wide/vertical are UNSAFE (not production-ready)
 * Always paired with variant="square" for safe production use
 */
const shape = computed<'card' | 'tile' | 'avatar'>(() => {
    // Small size uses avatar shape (64px) - production safe
    if (props.size === 'small') {
        return 'avatar'
    }
    // Medium+ sizes use tile shape (128px) - must use variant="square"
    return 'tile'
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
    if (!dataMode.value) return

    loading.value = true
    error.value = null

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
            url = '/api/instructors'
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
    if (dataMode.value) {
        // Apply filterIds if provided
        let filteredData = entityData.value
        console.log('[ItemList] Total entities:', entityData.value.length, 'filterIds:', props.filterIds?.length ?? 'undefined')
        if (props.filterIds !== undefined) {
            // filterIds is explicitly provided - apply filtering even if empty array
            filteredData = entityData.value.filter((entity: any) =>
                props.filterIds!.includes(entity.id)
            )
            console.log('[ItemList] After filtering:', filteredData.length)
        }

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
                console.log(`[ItemList] Image ${entity.id}: size="${props.size}" → field="${fieldName}"`, imageField)
                if (!imageField) {
                    throw new Error(`Missing ${fieldName} for image entity ${entity.id}`)
                }
                imageData = parseImageData(imageField)
                console.log(`[ItemList] Image ${entity.id}: parsed imageData`, imageData)
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
                    deprecated: hasDeprecatedCimg // Flag for warning overlay
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

onMounted(() => {
    if (dataMode.value) {
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
.item-list-container {
    width: 100%;
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
