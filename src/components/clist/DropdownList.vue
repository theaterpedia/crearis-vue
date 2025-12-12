<!--
  DropdownList.vue - Dropdown wrapper around ItemList
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
-->
<template>
    <VDropdown v-model:shown="isOpen" theme="dropdown-list" :triggers="[]" :auto-hide="true" :distance="8"
        placement="bottom-start">
        <!-- Trigger slot -->
        <slot name="trigger" :open="openDropdown" :is-open="isOpen">
            <button type="button" class="dropdown-trigger"
                :class="{ 'has-selection': dataMode && selectedIdsArray.length > 0, 'with-xml': displayXml }"
                @click="openDropdown">
                <!-- Default trigger content when no dataMode or no selection -->
                <div v-if="!dataMode || selectedIdsArray.length === 0" class="trigger-placeholder">
                    <slot name="trigger-content">Select {{ entity }}</slot>
                </div>

                <!-- Single selection: Show ItemRow -->
                <div v-else-if="!multiSelect && selectedIdsArray.length === 1 && selectedItems.length > 0"
                    class="trigger-single-selection">
                    <ItemRow v-bind="formatSelectedItem(selectedItems[0])" :size="size" />
                </div>

                <!-- Multi-selection: Show stacked avatars -->
                <div v-else-if="multiSelect && selectedIdsArray.length > 0 && selectedItems.length > 0"
                    class="trigger-multi-selection">
                    <div class="stacked-avatars">
                        <div v-for="(item, index) in displayedItems" :key="item.id" class="stacked-avatar"
                            :style="{ zIndex: displayedItems.length - index, marginLeft: index > 0 ? '-20px' : '0' }">
                            <img v-if="item.img_thumb" :src="parseImageData(item.img_thumb)?.url || ''"
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
                    <button type="button" class="close-btn" @click="hide" aria-label="Close">×</button>
                </div>

                <!-- CL2: Use ItemList with entity fetching -->
                <!-- Option A: Wrapper controls layout, ItemList inherits -->
                <div class="dropdown-list-wrapper" :class="wrapperClasses" :style="systemTheme">
                    <ItemList ref="popperItemListRef" :entity="entity" :project="project" :filterIds="filterIds"
                        :filterXmlPrefix="filterXmlPrefix" :filterXmlPrefixes="filterXmlPrefixes"
                        :filterXmlPattern="filterXmlPattern" item-type="row" :size="size" width="inherit" columns="off"
                        :dataMode="dataMode" :multiSelect="multiSelect" :selectedIds="selectedIds" interaction="static"
                        @item-click="(item) => handleSelect(item, hide)" @update:selectedIds="handleSelectedIdsUpdate"
                        @selectedXml="handleSelectedXml" @selected="handleSelected" />
                </div>
            </div>
        </template>
    </VDropdown>

    <!-- Hidden ItemList for pre-loading data (enables trigger display of selected items) -->
    <!-- Always mounted when dataMode is true to maintain entityData reference -->
    <ItemList v-if="dataMode" v-show="false" ref="hiddenItemListRef" :entity="entity" :project="project"
        :filterIds="filterIds" :filterXmlPrefix="filterXmlPrefix" :filterXmlPrefixes="filterXmlPrefixes"
        :filterXmlPattern="filterXmlPattern" item-type="row" :size="size" width="inherit" columns="off"
        :dataMode="dataMode" :multiSelect="multiSelect" :selectedIds="selectedIds" interaction="static"
        @update:selectedIds="handleSelectedIdsUpdate" @selectedXml="handleSelectedXml" @selected="handleSelected" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import ItemList from './ItemList.vue'
import ItemRow from './ItemRow.vue'
import { useTheme } from '@/composables/useTheme'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    entity: 'posts' | 'events' | 'instructors' | 'locations' | 'projects' | 'images'
    project?: string
    title?: string
    size?: 'small' | 'medium'
    filterIds?: number[] // Optional array of IDs to filter by
    // XML ID filtering props
    filterXmlPrefix?: string // Filter by single XML ID prefix (e.g., "tp.event")
    filterXmlPrefixes?: string[] // Filter by multiple XML ID prefixes with OR logic
    filterXmlPattern?: RegExp // Filter by XML ID regex pattern
    // Layout control props (Option A: wrapper controls everything)
    width?: 'small' | 'medium' | 'large' // Item width control
    columns?: 'off' | 'on' // Enable multi-column wrapping
    // Selection props
    dataMode?: boolean // True = uses entity data and emits selections
    multiSelect?: boolean // Allow multiple selections
    selectedIds?: number | number[] // v-model for selected item IDs
    displayXml?: boolean // Show xmlID in trigger
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    width: 'medium',
    columns: 'off',
    dataMode: true,
    multiSelect: false,
    displayXml: false
})

const emit = defineEmits<{
    select: [item: any]
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: any | any[]]
}>()

const isOpen = ref(false)
const hiddenItemListRef = ref<InstanceType<typeof ItemList> | null>(null)
const popperItemListRef = ref<InstanceType<typeof ItemList> | null>(null)
// Use hidden ref for data access (always mounted), popper ref for interactions (only when open)
const itemListRef = computed(() => hiddenItemListRef.value || popperItemListRef.value)
const { avatarWidth } = useTheme()

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

// Compute max-width for dropdown-content based on width prop
const contentMaxWidth = computed(() => {
    const baseWidth = 21 // 21rem = 336px
    const multipliers = {
        small: 0.5,   // 10.5rem = 168px
        medium: 1,     // 21rem = 336px
        large: 1.5     // 31.5rem = 504px
    }
    const multiplier = multipliers[props.width] || 1
    return `${baseWidth * multiplier + 2}rem` // +2rem for padding/border
})

// Wrapper classes for width/columns control (Option A: wrapper owns layout)
const wrapperClasses = computed(() => {
    const classes: string[] = []

    // Width class
    if (props.width) {
        classes.push(`width-${props.width}`)
    }

    // Columns class
    if (props.columns === 'on' && props.width !== 'small') {
        classes.push('columns-on')
    }

    return classes.join(' ')
})

// Compute selected IDs as array
const selectedIdsArray = computed(() => {
    if (!props.selectedIds) return []
    if (typeof props.selectedIds === 'number') return [props.selectedIds]
    return props.selectedIds
})

// Get selected items from ItemList's entityData instead of fetching separately
const selectedItems = computed(() => {
    if (!props.dataMode || selectedIdsArray.value.length === 0) return []
    if (!itemListRef.value?.entityData) return []

    const allItems = itemListRef.value.entityData
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

// Format selected item for ItemRow display
const formatSelectedItem = (item: any) => {
    const imageData = parseImageData(item.img_thumb)
    return {
        heading: item.title || item.name || item.entityname || item.heading || `Item ${item.id}`,
        data: imageData,
        shape: 'thumb' as const
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

// Forward selection events from ItemList
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
    max-width: 24rem;
    max-height: 60vh;
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

.dropdown-list-wrapper {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
}

/* Option A: Wrapper controls width (ItemList inherits) */
.dropdown-list-wrapper.width-small {
    width: calc(var(--card-width, 21rem) * 0.5);
    /* 168px (fallback: 10.5rem) */
}

.dropdown-list-wrapper.width-medium {
    width: var(--card-width, 21rem);
    /* 336px (fallback: 21rem) */
}

.dropdown-list-wrapper.width-large {
    width: calc(var(--card-width, 21rem) * 1.5);
    /* 504px (fallback: 31.5rem) */
}

/* Columns enabled: ItemList will flex wrap */
.dropdown-list-wrapper.columns-on :deep(.item-list) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Make items clickable */
.dropdown-list-wrapper :deep(.item-row) {
    cursor: pointer;
    border-radius: var(--radius-small, 0.375rem);
    transition: background 0.2s;
}

.dropdown-list-wrapper :deep(.item-row:hover) {
    background: var(--color-muted-bg);
}
</style>
