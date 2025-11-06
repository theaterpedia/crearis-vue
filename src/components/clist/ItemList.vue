<template>
    <div v-if="interaction === 'static'" class="item-list-container">
        <div v-if="loading" class="item-list-loading">Loading...</div>
        <div v-else-if="error" class="item-list-error">{{ error }}</div>
        <div v-else class="item-list" :class="itemTypeClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="index" :heading="item.heading"
                :cimg="item.cimg" :size="size" v-bind="item.props || {}">
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
                    <div v-else class="item-list" :class="itemTypeClass">
                        <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                            :heading="item.heading" :cimg="item.cimg" :size="size" v-bind="item.props || {}">
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
                <div v-else class="item-list" :class="itemTypeClass">
                    <component :is="itemComponent" v-for="(item, index) in entities" :key="index"
                        :heading="item.heading" :cimg="item.cimg" :size="size" v-bind="item.props || {}">
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
import ItemTile from './ItemTile.vue'
import ItemCard from './ItemCard.vue'
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
    entity?: 'posts' | 'events' | 'instructors' | 'all'
    project?: string // domaincode filter
    images?: number[] // Specific image IDs to fetch
    itemType?: 'tile' | 'card' | 'row'
    size?: 'small' | 'medium'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    interaction?: 'static' | 'popup' | 'zoom'
    title?: string
    modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    itemType: 'tile',
    size: 'medium',
    variant: 'default',
    interaction: 'static'
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    close: []
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
 * Compute shape based on size
 */
const shape = computed<'card' | 'tile' | 'avatar'>(() => {
    if (props.size === 'small') return 'tile'
    return 'card' // medium defaults to card
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
 * Parse img_thumb or img_square JSON from entity
 */
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
            options: parsed.options ?? null
        }
    } catch {
        return null
    }
}

/**
 * Get final entities list (either from items prop or fetched data)
 */
const entities = computed(() => {
    if (dataMode.value) {
        // Transform entity data to ListItem format
        return entityData.value.map(entity => {
            const imageField = props.variant === 'square' ? entity.img_square : entity.img_thumb
            const imageData = parseImageData(imageField)

            return {
                heading: entity.title || entity.entityname || `Item ${entity.id}`,
                cimg: undefined, // Don't use legacy cimg
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
        case 'card':
            return ItemCard
        case 'row':
            return ItemRow
        case 'tile':
        default:
            return ItemTile
    }
})

const itemTypeClass = computed(() => `item-type-${props.itemType}`)

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
    display: grid;
    gap: 1rem;
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

/* Grid layouts based on item type */
.item-type-tile {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.item-type-card {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
