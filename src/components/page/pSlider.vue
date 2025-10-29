<template>
    <div class="p-slider" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <Heading v-if="showHeader && header" :headline="header" :as="headingLevel" />
        <Slider v-if="items.length > 0">
            <Slide v-for="(item, index) in items" :key="index">
                <ItemCard :heading="item.heading" :cimg="item.cimg" :size="size" />
            </Slide>
        </Slider>
        <div v-else-if="!loading" class="p-slider-empty">
            <p>No {{ type }} available</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Slider from '@/components/Slider.vue'
import Slide from '@/components/Slide.vue'
import ItemCard from '@/components/clist/ItemCard.vue'
import Heading from '@/components/Heading.vue'

interface Props {
    type: 'posts' | 'events' | 'instructors' | 'projects'
    isAside?: boolean
    isFooter?: boolean
    header?: string
    size?: 'small' | 'medium' | 'large'
    limit?: number
    projectDomaincode?: string
}

const props = withDefaults(defineProps<Props>(), {
    isAside: false,
    isFooter: false,
    size: 'medium',
    limit: 8
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
        const url = props.projectDomaincode
            ? `${apiEndpoint.value}?project=${encodeURIComponent(props.projectDomaincode)}`
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

watch(() => [props.type, props.projectDomaincode], () => {
    fetchItems()
})
</script>

<style scoped>
.p-slider {
    margin: 2rem 0;
}

.p-slider.is-aside {
    margin: 1rem 0;
}

.p-slider.is-footer {
    margin: 3rem 0;
}

.p-slider-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
    background: var(--color-neutral-bg);
    border-radius: 0.5rem;
}
</style>
