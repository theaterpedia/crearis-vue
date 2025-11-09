<template>
    <div v-if="interaction === 'static'" class="item-gallery-container">
        <div v-if="loading" class="item-gallery-loading">Loading...</div>
        <div v-else-if="error" class="item-gallery-error">{{ error }}</div>
        <div v-else class="item-gallery" :class="itemTypeClass">
            <component :is="itemComponent" v-for="(item, index) in entities" :key="index" :heading="item.heading"
                :cimg="item.cimg" :size="size" v-bind="item.props || {}"
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
import { computed, ref, onMounted } from 'vue'
import ItemTile from './ItemTile.vue'
import ItemCard from './ItemCard.vue'
import ItemRow from './ItemRow.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface GalleryItem {
    heading: string
    cimg?: string
    props?: Record<string, any>
    slot?: any
}

interface EntityItem {
    id: number
    title?: string
    entityname?: string
    img_thumb?: string
    img_square?: string
}

interface Props {
    items?: GalleryItem[]
    entity?: 'posts' | 'events' | 'instructors' | 'all'
    project?: string
    images?: number[]
    itemType?: 'tile' | 'card' | 'row'
    size?: 'small' | 'medium'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    interaction?: 'static' | 'popup' | 'zoom'
    title?: string
    modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    itemType: 'card',
    size: 'medium',
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
    set: (value: boolean) => emit('update:modelValue', value)
})

const isZoomed = ref(false)
const entityData = ref<EntityItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const dataMode = computed(() => {
    return props.entity !== undefined || props.images !== undefined
})

const shape = computed<'card' | 'tile' | 'avatar'>(() => {
    if (props.size === 'small') return 'tile'
    return 'card'
})

const fetchEntityData = async () => {
    if (!dataMode.value) return

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
            url = '/api/instructors'
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
            options: parsed.options ?? null
        }
    } catch {
        return null
    }
}

const entities = computed(() => {
    if (dataMode.value) {
        return entityData.value.map((entity: EntityItem) => {
            const imageField = props.variant === 'square' ? entity.img_square : entity.img_thumb
            const imageData = parseImageData(imageField)

            return {
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
.item-gallery-container {
    width: 100%;
}

.item-gallery {
    display: grid;
    gap: 1.5rem;
}

.item-gallery-loading,
.item-gallery-error {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    font-family: var(--headings);
}

.item-gallery-error {
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
