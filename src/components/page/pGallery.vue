<template>
    <div class="p-gallery" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
        <!-- Use entity fetching built into ItemGallery -->
        <ItemGallery :entity="entityType" :project="projectDomaincode" :filterIds="filterIds"
            :filterXmlPrefix="filterXmlPrefix" :filterXmlPrefixes="filterXmlPrefixes"
            :filterXmlPattern="filterXmlPattern" item-type="card" :size="size" :variant="variant"
            :interaction="interaction" :dataMode="dataMode" :multiSelect="multiSelect" :selectedIds="selectedIds"
            @update:selectedIds="$emit('update:selectedIds', $event)" @selectedXml="$emit('selectedXml', $event)"
            @selected="$emit('selected', $event)" @item-click="$emit('item-click', $event)" />
    </div>
</template>

<script setup lang="ts">
import ItemGallery from '@/components/clist/ItemGallery.vue'
import Heading from '@/components/Heading.vue'

interface Props {
    type: 'posts' | 'events' | 'instructors' | 'projects'
    isAside?: boolean
    isFooter?: boolean
    header?: string
    size?: 'small' | 'medium' | 'large'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    interaction?: 'static' | 'zoom' | 'previewmodal'
    limit?: number // Note: limit not yet supported by ItemGallery, will show all
    projectDomaincode?: string

    // Filtering props
    filterIds?: number[] // Filter by specific entity IDs
    filterXmlPrefix?: string // Filter by single XML ID prefix (e.g., "tp.event")
    filterXmlPrefixes?: string[] // Filter by multiple XML ID prefixes with OR logic
    filterXmlPattern?: RegExp // Filter by XML ID regex pattern

    // Selection props (defaults to false for pGallery - primarily for display)
    dataMode?: boolean
    multiSelect?: boolean
    selectedIds?: number | number[]
}

const props = withDefaults(defineProps<Props>(), {
    isAside: false,
    isFooter: false,
    size: 'medium',
    variant: 'default',
    interaction: 'static',
    limit: 6,
    filterIds: undefined,
    filterXmlPrefix: undefined,
    filterXmlPrefixes: undefined,
    filterXmlPattern: undefined,
    dataMode: false,
    multiSelect: false,
    selectedIds: undefined
})

const emit = defineEmits<{
    'item-click': [item: any, event: MouseEvent]
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: any | any[]]
}>()

const showHeader = props.isAside || props.isFooter

const headingLevel = (() => {
    if (props.isAside) return 'h4'
    if (props.isFooter) return 'h3'
    return 'h3'
})()

// Map component type to ItemGallery entity type
const entityType = (() => {
    if (props.type === 'projects') {
        console.warn('[pGallery] projects entity not yet supported by ItemGallery, showing posts instead')
        return 'posts'
    }
    return props.type as 'posts' | 'events' | 'instructors'
})()
</script>

<style scoped>
.p-gallery {
    margin: 2rem 0;
}

.p-gallery.is-aside {
    margin: 1rem 0;
}

.p-gallery.is-footer {
    margin: 3rem 0;
}
</style>
