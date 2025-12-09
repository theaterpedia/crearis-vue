<template>
    <div class="entity-browser">
        <!-- CardHero Header (fixed, doesn't scroll) -->
        <div class="entity-hero">
            <CardHero :height-tmp="'mini'" :img-tmp="entityImage" content-align-y="bottom" content-width="full">
                <div class="hero-content">
                    <h2 class="entity-title">{{ entityTitle }}</h2>
                    <p v-if="entityTeaser" class="entity-teaser">{{ entityTeaser }}</p>
                </div>
            </CardHero>
        </div>

        <!-- Tab Navigation -->
        <div class="browser-tabs">
            <button v-for="tab in availableTabs" :key="tab.id" class="browser-tab"
                :class="{ 'is-active': activeTab === tab.id }" @click="selectTab(tab.id)">
                <span class="tab-icon">{{ tab.icon }}</span>
                <span class="tab-label">{{ tab.label }}</span>
            </button>
        </div>

        <!-- Tab Content -->
        <div class="browser-content">
            <!-- Overview Tab -->
            <EntityOverview v-if="activeTab === 'overview'" :entity="entity" :entity-type="entityType"
                :project-id="projectId" @open-external="handleOpenExternal" />

            <!-- Content/Edit Tab -->
            <div v-else-if="activeTab === 'content'" class="tab-panel">
                <slot name="content">
                    <EntityContentPanel :entity="entity" :entity-type="entityType" mode="dashboard"
                        @open-full-editor="openPostIts" />
                </slot>
            </div>

            <!-- Config Tab -->
            <div v-else-if="activeTab === 'config'" class="tab-panel">
                <slot name="config">
                    <ConfigPanelStub :entity="entity" :entity-type="entityType" :project-id="projectId"
                        :alpha="alpha" />
                </slot>
            </div>

            <!-- Interactions Tab (Events only) -->
            <div v-else-if="activeTab === 'interactions'" class="tab-panel">
                <slot name="interactions">
                    <InteractionsPanel mode="base-panel" :project-id="projectId" :event-id="entity?.id"
                        :use-stub-data="alpha" />
                </slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CardHero from '@/components/CardHero.vue'
import EntityOverview from './EntityOverview.vue'
import EntityContentPanel from './EntityContentPanel.vue'
import ConfigPanelStub from './ConfigPanelStub.vue'
import InteractionsPanel from '@/components/interactions/InteractionsPanel.vue'

// ============================================================
// TYPES
// ============================================================

interface BrowserTab {
    id: string
    label: string
    icon: string
}

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    entity: any
    entityType: 'posts' | 'events' | 'pages' | 'images'
    projectId: string | number
    alpha?: boolean  // Enable stub/demo content
}>(), {
    alpha: true
})

const emit = defineEmits<{
    'open-external': [url: string]
    'open-postits': []
    'tab-change': [tabId: string]
}>()

// ============================================================
// STATE
// ============================================================

const activeTab = ref('overview')

// ============================================================
// COMPUTED
// ============================================================

const entityTitle = computed(() => {
    return props.entity?.name || props.entity?.heading || props.entity?.title || 'Untitled'
})

const entityTeaser = computed(() => {
    return props.entity?.teaser || props.entity?.description || ''
})

const entityImage = computed(() => {
    return props.entity?.img_wide?.url
        || props.entity?.cimg
        || props.entity?.image_url
        || 'https://picsum.photos/800/400?random=' + (props.entity?.id || 1)
})

// Available tabs based on entity type
const availableTabs = computed((): BrowserTab[] => {
    const baseTabs: BrowserTab[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'content', label: 'Content', icon: '📝' },
        { id: 'config', label: 'Config', icon: '⚙️' }
    ]

    // Add interactions tab for events
    if (props.entityType === 'events') {
        baseTabs.push({ id: 'interactions', label: 'Interactions', icon: '👥' })
    }

    return baseTabs
})

// ============================================================
// METHODS
// ============================================================

function selectTab(tabId: string) {
    activeTab.value = tabId
    emit('tab-change', tabId)
}

function handleOpenExternal(url: string) {
    emit('open-external', url)
}

function openPostIts() {
    emit('open-postits')
}

// ============================================================
// WATCHERS
// ============================================================

// Reset to overview when entity changes
watch(() => props.entity?.id, () => {
    activeTab.value = 'overview'
})
</script>

<style scoped>
.entity-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-card-bg, #fff);
    border-radius: var(--radius-large);
    overflow: hidden;
}

/* Hero Header */
.entity-hero {
    flex-shrink: 0;
}

.hero-content {
    padding: 1rem;
    background: linear-gradient(to top, oklch(0% 0 0 / 0.7), transparent);
}

.entity-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px oklch(0% 0 0 / 0.5);
}

.entity-teaser {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: oklch(90% 0 0);
    text-shadow: 0 1px 2px oklch(0% 0 0 / 0.5);
}

/* Tab Navigation */
.browser-tabs {
    display: flex;
    gap: 0;
    border-bottom: var(--border-small) solid var(--color-border);
    background: var(--color-muted-bg);
    flex-shrink: 0;
}

.browser-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-dimmed);
}

.browser-tab:hover {
    color: var(--color-contrast);
    background: var(--color-card-bg);
}

.browser-tab.is-active {
    color: var(--color-primary-bg);
    border-bottom-color: var(--color-primary-bg);
    background: var(--color-card-bg);
}

.tab-icon {
    font-size: 1rem;
}

/* Tab Content */
.browser-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.tab-panel {
    height: 100%;
}

/* Placeholder Panel */
.placeholder-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    gap: 1rem;
    min-height: 200px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-medium);
    background: var(--color-muted-bg);
}

.placeholder-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0;
}

.placeholder-text {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* Post-its Button */
.postits-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: oklch(85% 0.08 280);
    color: oklch(30% 0.12 280);
    border: var(--border-small) solid oklch(75% 0.10 280);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.postits-btn:hover {
    background: oklch(80% 0.10 280);
}
</style>
