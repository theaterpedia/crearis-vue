<template>
    <div class="p-gallery" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
        <ItemGallery v-if="items.length > 0" :items="items" :item-type="itemType" :size="size"
            :interaction="interaction" />
        <div v-else-if="!loading" class="p-gallery-empty">
            <p>No {{ type }} available</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
    limit?: number
    projectId?: number
}

const props = withDefaults(defineProps<Props>(), {
    isAside: false,
    isFooter: false,
    itemType: 'card',
    size: 'medium',
    interaction: 'static',
    limit: 6
})

const items = ref<any[]>([])
const loading = ref(false)

const showHeader = computed(() => props.isAside || props.isFooter)

const headingLevel = computed(() => {
    if (props.isAside) return 'h4'
    if (props.isFooter) return 'h3'
    return 'h3'
})

const apiEndpoint = computed(() => {
    switch (props.type) {
        case 'posts':
            return '/api/posts'
        case 'events':
            return '/api/events'
        case 'instructors':
            return '/api/public-users'
        case 'projects':
            return '/api/projects'
        default:
            return '/api/posts'
    }
})

async function fetchItems() {
    loading.value = true
    try {
        const url = props.projectId
            ? `${apiEndpoint.value}?project_id=${props.projectId}`
            : apiEndpoint.value

        const response = await fetch(url)
        if (response.ok) {
            const data = await response.json()
            items.value = data.slice(0, props.limit).map((item: any) => ({
                heading: item.heading || item.name || item.title || `${props.type} #${item.id}`,
                cimg: item.cimg || `https://picsum.photos/400/300?random=${item.id}`,
                teaser: item.teaser
            }))
        }
    } catch (error) {
        console.error(`Error fetching ${props.type}:`, error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchItems()
})

watch(() => [props.type, props.projectId], () => {
    fetchItems()
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
