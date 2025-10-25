<template>
    <div class="p-toc" :class="{ 'is-aside': isAside, 'is-footer': isFooter }">
        <h4 class="toc-title">{{ title || 'Table of Contents' }}</h4>
        <nav class="toc-nav">
            <ul class="toc-list">
                <li v-for="(item, index) in tocItems" :key="index" :class="`toc-level-${item.level}`">
                    <a :href="`#${item.id}`" class="toc-link" @click.prevent="scrollTo(item.id)">
                        {{ item.text }}
                    </a>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface TocItem {
    id: string
    text: string
    level: number
}

interface Props {
    isAside?: boolean
    isFooter?: boolean
    title?: string
}

withDefaults(defineProps<Props>(), {
    isAside: true,
    isFooter: false
})

const tocItems = ref<TocItem[]>([])

function scrollTo(id: string) {
    const element = document.getElementById(id)
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

onMounted(() => {
    // Find all headings in main content area
    const mainContent = document.querySelector('.page-content-main')
    if (mainContent) {
        const headings = mainContent.querySelectorAll('h2, h3, h4')
        tocItems.value = Array.from(headings).map((heading, index) => {
            const level = parseInt(heading.tagName.substring(1))
            let id = heading.id
            if (!id) {
                id = `heading-${index}`
                heading.id = id
            }
            return {
                id,
                text: heading.textContent || '',
                level
            }
        })
    }
})
</script>

<style scoped>
.p-toc {
    margin: 1rem 0;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border-radius: 0.5rem;
    border-left: 3px solid var(--color-accent-bg);
}

.p-toc.is-footer {
    margin: 2rem 0;
}

.toc-title {
    margin: 0 0 1rem 0;
    font-family: var(--headings);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-accent-bg);
}

.toc-nav {
    font-family: var(--body);
}

.toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.toc-list li {
    margin: 0.5rem 0;
}

.toc-level-2 {
    padding-left: 0;
}

.toc-level-3 {
    padding-left: 1rem;
}

.toc-level-4 {
    padding-left: 2rem;
}

.toc-link {
    color: var(--color-text);
    text-decoration: none;
    transition: color 0.2s;
    display: block;
    padding: 0.25rem 0;
}

.toc-link:hover {
    color: var(--color-accent-bg);
}
</style>
