<template>
    <div class="project-navigation">
        <!-- Header -->
        <div class="navigation-header">
            <HeadingParser v-if="projectName && projectName.trim()" :content="projectName" as="h2" />
            <h2 v-else>Navigation</h2>
        </div>

        <!-- Vertical Tabs -->
        <div class="navigation-tabs">
            <button v-for="tab in visibleTabs" :key="tab.id" class="nav-tab" :class="{ active: activeTab === tab.id }"
                @click="selectTab(tab.id)">
                <component :is="tab.icon" />
                <span>{{ tab.label }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'

interface Props {
    projectId: string
    projectName?: string
    visibleTabs: string[]
}

interface Emits {
    (e: 'tab-change', tabId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('')

// All possible tabs with their configuration
const allTabs = computed(() => [
    {
        id: 'homepage',
        label: 'Homepage',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z' }))
    },
    {
        id: 'events',
        label: 'Events',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z' }))
    },
    {
        id: 'posts',
        label: 'Posts',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z' }))
    },
    {
        id: 'users',
        label: 'Users',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z' }))
    },
    {
        id: 'theme',
        label: 'Theme',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M200.12,60.68a71.9,71.9,0,0,0-101.82,0L128,90.34l29.7-29.66a71.9,71.9,0,1,1,0,101.82L128,192.16,98.3,162.5a71.9,71.9,0,1,0,0-101.82L128,90.34,98.3,60.68a71.9,71.9,0,0,1,101.82,0ZM128,152a24,24,0,1,1,24-24A24,24,0,0,1,128,152Z' }))
    },
    {
        id: 'layout',
        label: 'Layout',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,112H96v88H40Zm72,88V112h64v88Zm104,0H192V112h24Z' }))
    },
    {
        id: 'navigation',
        label: 'Navigation',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M237.9,110.62,141.85,42.33a16,16,0,0,0-17.23-.06l-96.1,61.45A16,16,0,0,0,20,117.78V208a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V117.78A16,16,0,0,0,237.9,110.62ZM220,208H180V160a16,16,0,0,0-16-16H132a16,16,0,0,0-16,16v48H36V117.78l96.09-61.44,96.1,61.45Z' }))
    },
    {
        id: 'pages',
        label: 'Pages',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z' }))
    },
    {
        id: 'events-config',
        label: 'Events Config',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z' }))
    },
    {
        id: 'regio-config',
        label: 'Regio Config',
        icon: () => h('svg', { fill: 'currentColor', height: '20', viewBox: '0 0 256 256', width: '20', xmlns: 'http://www.w3.org/2000/svg' },
            h('path', { d: 'M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z' }))
    }
])

// Filter tabs based on visibility prop
const visibleTabs = computed(() => {
    return allTabs.value.filter(tab => props.visibleTabs.includes(tab.id))
})

onMounted(() => {
    // Set first visible tab as active
    if (visibleTabs.value.length > 0) {
        activeTab.value = visibleTabs.value[0].id
        emit('tab-change', activeTab.value)
    }
})

function selectTab(tabId: string) {
    activeTab.value = tabId
    emit('tab-change', tabId)
}
</script>

<style scoped>
.project-navigation {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}

.navigation-header {
    padding: 1rem;
    border-bottom: var(--border) solid var(--color-border);
}

.navigation-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0;
}

.navigation-tabs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-tab {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-tab:hover {
    background: var(--color-bg-soft);
    color: var(--color-text);
}

.nav-tab.active {
    background: var(--color-bg-soft);
    border-left-color: var(--color-project);
    color: var(--color-project);
}

.nav-tab svg {
    flex-shrink: 0;
}
</style>
