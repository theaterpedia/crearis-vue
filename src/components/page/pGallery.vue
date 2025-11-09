<template>
    <div class="p-gallery" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
        <!-- CL2: Use entity fetching built into ItemGallery -->
        <ItemGallery :entity="entityType" :project="projectDomaincode" :item-type="itemType" :size="size"
            :interaction="interaction" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ItemGallery } from '@/components/clist'
import Heading from '@/components/Heading.vue'

interface Props {
    type: 'posts' | 'events' | 'instructors' | 'projects'
    isAside?: boolean
    isFooter?: boolean
    header?: string
    itemType?: 'tile' | 'card' | 'row'
    size?: 'small' | 'medium' | 'large'
    interaction?: 'static' | 'popup' | 'zoom'
    limit?: number // Note: limit not yet supported by ItemGallery, will show all
    projectDomaincode?: string
}

const props = withDefaults(defineProps<Props>(), {
    isAside: false,
    isFooter: false,
    itemType: 'card',
    size: 'medium',
    interaction: 'static',
    limit: 6
})

const showHeader = computed(() => props.isAside || props.isFooter)

const headingLevel = computed(() => {
    if (props.isAside) return 'h4'
    if (props.isFooter) return 'h3'
    return 'h3'
})

// Map component type to ItemGallery entity type
const entityType = computed<'posts' | 'events' | 'instructors' | undefined>(() => {
    // ItemGallery currently supports: 'posts', 'events', 'instructors'
    // 'projects' not yet supported - would need API endpoint
    if (props.type === 'projects') {
        console.warn('[pGallery] CL2: projects entity not yet supported by ItemGallery, showing posts instead')
        return 'posts'
    }
    return props.type as 'posts' | 'events' | 'instructors'
})
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

.p-gallery-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    background: var(--color-neutral-bg);
    border-radius: 0.5rem;
}
</style>
