<template>
    <div class="p-list" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
        <!-- CL2: Use entity fetching built into ItemList -->
        <ItemList :entity="entityType" :project="projectDomaincode" :filterXmlPrefix="filterXmlPrefix"
            :filterXmlPrefixes="filterXmlPrefixes" :filterXmlPattern="filterXmlPattern" :item-type="itemType"
            :size="size" :interaction="interaction" :dataMode="dataMode" :multiSelect="multiSelect"
            :selectedIds="selectedIds" @update:selectedIds="$emit('update:selectedIds', $event)"
            @selectedXml="$emit('selectedXml', $event)" @selected="$emit('selected', $event)"
            @item-click="$emit('item-click', $event)" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ItemList } from '@/components/clist'
import Heading from '@/components/Heading.vue'

interface Props {
    type: 'posts' | 'events' | 'instructors' | 'projects'
    isAside?: boolean
    isFooter?: boolean
    header?: string
    itemType?: 'tile' | 'card' | 'row'
    size?: 'small' | 'medium' | 'large'
    interaction?: 'static' | 'zoom' | 'previewmodal'
    limit?: number // Note: limit not yet supported by ItemList, will show all
    projectDomaincode?: string
    // XML ID filtering props
    filterXmlPrefix?: string // Filter by single XML ID prefix (e.g., "tp.event")
    filterXmlPrefixes?: string[] // Filter by multiple XML ID prefixes with OR logic
    filterXmlPattern?: RegExp // Filter by XML ID regex pattern
    // Selection props (defaults to false for pList - primarily for display)
    dataMode?: boolean
    multiSelect?: boolean
    selectedIds?: number | number[]
}

const props = withDefaults(defineProps<Props>(), {
    isAside: false,
    isFooter: false,
    itemType: 'row',
    size: 'medium',
    interaction: 'static',
    limit: 6,
    dataMode: false, // pList defaults to false (display-focused)
    multiSelect: false
})

const emit = defineEmits<{
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: any | any[]]
    'item-click': [item: any, event: MouseEvent]
}>()

const showHeader = computed(() => props.isAside || props.isFooter)

const headingLevel = computed(() => {
    if (props.isAside) return 'h4'
    if (props.isFooter) return 'h3'
    return 'h3'
})

// Map component type to ItemList entity type
const entityType = computed<'posts' | 'events' | 'instructors' | undefined>(() => {
    // ItemList currently supports: 'posts', 'events', 'instructors'
    // 'projects' not yet supported - would need API endpoint
    if (props.type === 'projects') {
        console.warn('[pList] CL2: projects entity not yet supported by ItemList, showing posts instead')
        return 'posts'
    }
    return props.type as 'posts' | 'events' | 'instructors'
})
</script>

<style scoped>
.p-list {
    margin: 2rem 0;
}

.p-list.is-aside {
    margin: 1rem 0;
}

.p-list.is-footer {
    margin: 3rem 0;
}

.p-list-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    background: var(--color-neutral-bg);
    border-radius: 0.5rem;
}
</style>
