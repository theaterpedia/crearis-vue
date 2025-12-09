<template>
    <div class="collapsible-tabs" :class="{ 'is-collapsed': isCollapsed }">
        <!-- Toggle Button -->
        <button class="collapse-toggle" @click="toggleCollapse" :title="isCollapsed ? 'Expand' : 'Collapse'">
            <span class="toggle-icon">{{ isCollapsed ? '›' : '‹' }}</span>
        </button>

        <!-- Tabs Container -->
        <div class="tabs-container">
            <button 
                v-for="tab in tabs" 
                :key="tab.id" 
                class="tab-item"
                :class="{ 'is-active': activeTab === tab.id }"
                @click="selectTab(tab.id)"
                :title="tab.label"
            >
                <span class="tab-icon" v-html="tab.icon"></span>
                <span v-if="!isCollapsed" class="tab-label">{{ tab.label }}</span>
                <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// ============================================================
// TYPES
// ============================================================

export interface TabItem {
    id: string
    label: string
    icon: string  // SVG string or emoji
    badge?: number | string
}

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    tabs: TabItem[]
    modelValue?: string
    defaultCollapsed?: boolean
}>(), {
    defaultCollapsed: false
})

const emit = defineEmits<{
    'update:modelValue': [tabId: string]
    'tab-change': [tabId: string]
    'collapse-change': [collapsed: boolean]
}>()

// ============================================================
// STATE
// ============================================================

const isCollapsed = ref(props.defaultCollapsed)
const activeTab = ref(props.modelValue || (props.tabs[0]?.id ?? ''))

// ============================================================
// METHODS
// ============================================================

function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
    emit('collapse-change', isCollapsed.value)
}

function selectTab(tabId: string) {
    activeTab.value = tabId
    emit('update:modelValue', tabId)
    emit('tab-change', tabId)
}

// ============================================================
// WATCHERS
// ============================================================

watch(() => props.modelValue, (newVal: string | undefined) => {
    if (newVal && newVal !== activeTab.value) {
        activeTab.value = newVal
    }
})
</script>

<style scoped>
.collapsible-tabs {
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg, #fff);
    border-right: var(--border-small) solid var(--color-border);
    height: 100%;
    transition: var(--transition);
    width: 200px;
}

.collapsible-tabs.is-collapsed {
    width: 64px;
}

/* Toggle Button */
.collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    background: var(--color-muted-bg);
    border: none;
    border-bottom: var(--border-small) solid var(--color-border);
    cursor: pointer;
    transition: var(--transition);
}

.collapse-toggle:hover {
    background: var(--color-border);
}

.toggle-icon {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--color-dimmed);
}

/* Tabs Container */
.tabs-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    gap: 0.25rem;
}

/* Tab Item */
.tab-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: var(--transition);
    text-align: left;
    width: 100%;
    min-height: 48px;
}

.is-collapsed .tab-item {
    justify-content: center;
    padding: 0.75rem 0.5rem;
}

.tab-item:hover {
    background: var(--color-muted-bg);
}

.tab-item.is-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast, #fff);
}

.tab-item.is-active .tab-icon {
    color: inherit;
}

/* Tab Icon */
.tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: var(--color-dimmed);
}

.tab-icon :deep(svg) {
    width: 20px;
    height: 20px;
}

/* Tab Label */
.tab-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-contrast);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tab-item.is-active .tab-label {
    color: inherit;
}

/* Tab Badge */
.tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    background: oklch(70% 0.18 25);
    color: white;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 9999px;
    margin-left: auto;
}

.is-collapsed .tab-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 1rem;
    height: 1rem;
    font-size: 0.625rem;
}

.is-collapsed .tab-item {
    position: relative;
}
</style>
