<template>
    <div class="dashboard-layout">
        <!-- Left Column: Collapsible Tabs -->
        <CollapsibleTabs :tabs="navigationTabs" v-model="activeSection" :default-collapsed="defaultTabsCollapsed"
            @tab-change="handleSectionChange" @collapse-change="handleCollapseChange" />

        <!-- Middle Column: Entity List (pList) -->
        <div class="entity-list-column">
            <div class="list-header">
                <h3 class="list-title">{{ currentSectionLabel }}</h3>
                <span v-if="entityCount > 0" class="list-count">{{ entityCount }}</span>
            </div>
            <div class="list-content">
                <pList v-if="showEntityList" :entity="currentEntityType" :project="projectId" :status-gt="0"
                    size="small" variant="default" :anatomy="false" on-activate="route"
                    @item-click="handleEntitySelect" />
                <!-- Fallback for non-entity sections -->
                <div v-else class="section-placeholder">
                    <p>{{ placeholderText }}</p>
                </div>
            </div>
        </div>

        <!-- Right Column: Entity Browser -->
        <div class="entity-browser-column">
            <EntityBrowser v-if="selectedEntity" :entity="selectedEntity" :entity-type="currentEntityType"
                :project-id="projectId" :alpha="alpha" @open-external="handleOpenExternal"
                @open-postits="handleOpenPostIts" @tab-change="handleBrowserTabChange" />
            <!-- Empty State -->
            <div v-else class="empty-browser">
                <div class="empty-content">
                    <span class="empty-icon">📋</span>
                    <p class="empty-title">Select an item</p>
                    <p class="empty-text">Choose an item from the list to view details</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CollapsibleTabs from './CollapsibleTabs.vue'
import EntityBrowser from './EntityBrowser.vue'
import pList from '@/components/page/pList.vue'

// ============================================================
// TYPES
// ============================================================

interface NavigationTab {
    id: string
    label: string
    icon: string
    entityType?: 'posts' | 'events' | 'pages' | 'images'
    badge?: number
}

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    projectId: string | number
    projectName?: string
    initialSection?: string
    defaultTabsCollapsed?: boolean
    alpha?: boolean
}>(), {
    initialSection: 'events',
    defaultTabsCollapsed: false,
    alpha: true
})

const emit = defineEmits<{
    'section-change': [sectionId: string]
    'entity-select': [entity: any]
    'open-external': [url: string]
    'open-postits': []
}>()

// ============================================================
// STATE
// ============================================================

const activeSection = ref(props.initialSection)
const selectedEntity = ref<any>(null)
const isTabsCollapsed = ref(props.defaultTabsCollapsed)

// ============================================================
// NAVIGATION TABS CONFIG
// ============================================================

const navigationTabs = computed((): NavigationTab[] => [
    {
        id: 'events',
        label: 'Events',
        icon: '📅',
        entityType: 'events',
        badge: props.alpha ? 3 : undefined
    },
    {
        id: 'posts',
        label: 'Posts',
        icon: '📝',
        entityType: 'posts'
    },
    {
        id: 'pages',
        label: 'Pages',
        icon: '📄',
        entityType: 'pages'
    },
    {
        id: 'images',
        label: 'Images',
        icon: '🖼️',
        entityType: 'images'
    },
    {
        id: 'users',
        label: 'Team',
        icon: '👥'
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️'
    }
])

// ============================================================
// COMPUTED
// ============================================================

const currentTab = computed(() => {
    return navigationTabs.value.find((t: NavigationTab) => t.id === activeSection.value)
})

const currentSectionLabel = computed(() => {
    return currentTab.value?.label || 'Items'
})

const currentEntityType = computed((): 'posts' | 'events' | 'pages' | 'images' => {
    return currentTab.value?.entityType || 'posts'
})

const showEntityList = computed(() => {
    return !!currentTab.value?.entityType
})

const placeholderText = computed(() => {
    if (activeSection.value === 'users') return 'Team management coming soon'
    if (activeSection.value === 'settings') return 'Project settings panel'
    return 'Select a section'
})

const entityCount = computed(() => {
    // Stub - would be populated from API
    return props.alpha ? 12 : 0
})

// ============================================================
// METHODS
// ============================================================

function handleSectionChange(sectionId: string) {
    activeSection.value = sectionId
    selectedEntity.value = null // Clear selection when changing sections
    emit('section-change', sectionId)
}

function handleCollapseChange(collapsed: boolean) {
    isTabsCollapsed.value = collapsed
}

function handleEntitySelect(entity: any) {
    selectedEntity.value = entity
    emit('entity-select', entity)
}

function handleOpenExternal(url: string) {
    emit('open-external', url)
    window.open(url, '_blank')
}

function handleOpenPostIts() {
    emit('open-postits')
}

function handleBrowserTabChange(tabId: string) {
    console.log('[DashboardLayout] Browser tab changed:', tabId)
}

// ============================================================
// WATCHERS
// ============================================================

watch(() => props.initialSection, (newVal: string | undefined) => {
    if (newVal) {
        activeSection.value = newVal
    }
})
</script>

<style scoped>
.dashboard-layout {
    display: grid;
    grid-template-columns: auto 300px 1fr;
    height: 100%;
    background: var(--color-muted-bg);
    gap: 0;
}

/* Entity List Column */
.entity-list-column {
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg);
    border-right: var(--border-small) solid var(--color-border);
    height: 100%;
    overflow: hidden;
}

.list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: var(--border-small) solid var(--color-border);
    background: var(--color-muted-bg);
}

.list-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.list-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast, #fff);
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
}

.list-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

.section-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
}

/* Entity Browser Column */
.entity-browser-column {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: 1rem;
}

/* Empty Browser State */
.empty-browser {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--color-card-bg);
    border-radius: var(--radius-large);
    border: 2px dashed var(--color-border);
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    opacity: 0.5;
}

.empty-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.empty-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

/* Responsive */
@media (max-width: 1024px) {
    .dashboard-layout {
        grid-template-columns: auto 250px 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }

    .entity-list-column,
    .entity-browser-column {
        display: none;
    }

    /* Show only tabs on mobile - user would tap to see content */
}
</style>
