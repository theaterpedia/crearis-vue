<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Theme, Layout, Navigation</h3>
            <p class="step-subtitle">Passen Sie Design und Einstellungen an</p>
        </div>

        <!-- Horizontal Tabs -->
        <div class="tabs-container">
            <button v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                {{ tab.label }}
            </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            <ThemeConfigPanel v-if="activeTab === 'theme'" :project-id="projectId" :is-locked="isLocked" />
            <LayoutConfigPanel v-else-if="activeTab === 'layout'" :project-id="projectId" :is-locked="isLocked" />
            <NavigationConfigPanel v-else-if="activeTab === 'navigation'" :project-id="projectId"
                :is-locked="isLocked" />
        </div>

        <div class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                Zurück
            </button>
            <button class="action-btn primary-btn" @click="handleNext">
                Weiter
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ThemeConfigPanel from '@/components/ThemeConfigPanel.vue'
import LayoutConfigPanel from '@/components/LayoutConfigPanel.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

interface Emits {
    (e: 'next'): void
    (e: 'prev'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})
const emit = defineEmits<Emits>()

const activeTab = ref('theme')

const tabs = [
    { id: 'theme', label: 'Theme' },
    { id: 'layout', label: 'Layout' },
    { id: 'navigation', label: 'Navigation' }
]

function handleNext() {
    emit('next')
}

function handlePrev() {
    emit('prev')
}
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 1rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* ===== HORIZONTAL TABS ===== */
.tabs-container {
    display: flex;
    gap: 0.5rem;
    border-bottom: var(--border) solid var(--color-border);
}

.tab-button {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-button:hover {
    color: var(--color-text);
    background: var(--color-bg-soft);
}

.tab-button.active {
    color: var(--color-project);
    border-bottom-color: var(--color-project);
}

/* ===== TAB CONTENT ===== */
.tab-content {
    min-height: 400px;
}

.step-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-project);
    color: white;
}

.primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.secondary-btn {
    background: var(--color-bg);
    color: var(--color-text);
    border: var(--border) solid var(--color-border);
}

.secondary-btn:hover {
    background: var(--color-bg-soft);
}

.action-btn:active {
    transform: translateY(0);
}
</style>
