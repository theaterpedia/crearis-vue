<template>
    <Teleport to="body">
        <Transition name="slide-panel">
            <!-- data-context="internal" forces internal theming regardless of page theme -->
            <div v-if="isOpen" class="base-panel" :class="[`base-panel-${panelSize}`, placementClass]"
                data-context="internal" @keydown.esc="handleClose">
                <!-- Header -->
                <div class="base-panel-header">
                    <div class="header-content">
                        <h3 class="panel-title">{{ title }}</h3>
                        <p v-if="subtitle" class="panel-subtitle">{{ subtitle }}</p>
                    </div>
                    <button class="close-btn" @click="handleClose" aria-label="Close panel" type="button">
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round"
                            stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"
                            xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" x2="6" y1="6" y2="18"></line>
                            <line x1="6" x2="18" y1="6" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <!-- Body (scrollable content area) -->
                <div class="base-panel-body">
                    <slot></slot>
                </div>

                <!-- Footer (optional actions) -->
                <div v-if="$slots.footer" class="base-panel-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    isOpen: boolean
    title: string
    subtitle?: string
    sidebarMode?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
    sidebarMode: 'right'
})

const emit = defineEmits<{
    close: []
}>()

// Auto-adjust placement based on sidebar mode
const placementClass = computed(() => {
    return props.sidebarMode === 'left' ? 'placement-left' : 'placement-right'
})

// Responsive panel size
const panelSize = computed(() => {
    if (typeof window === 'undefined') return 'medium'
    const width = window.innerWidth
    if (width < 768) return 'fullscreen'
    if (width < 1440) return 'medium'
    return 'large'
})

// Handle close
function handleClose() {
    emit('close')
}
</script>

<style scoped>
/* Transition */
.slide-panel-enter-active,
.slide-panel-leave-active {
    transition: transform 0.3s ease-out;
}

.slide-panel-enter-from.placement-right,
.slide-panel-leave-to.placement-right {
    transform: translateX(100%);
}

.slide-panel-enter-from.placement-left,
.slide-panel-leave-to.placement-left {
    transform: translateX(-100%);
}

/* Panel Container */
.base-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    max-height: 100vh;
    background: var(--color-bg);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    font-family: var(--font);
}

.base-panel-fullscreen {
    left: 0;
    right: 0;
    width: 100%;
}

.base-panel-medium {
    width: 25rem;
    /* 400px */
}

.base-panel-large {
    width: 37.5rem;
    /* 600px */
}

/* Placement */
.placement-right {
    right: 0;
}

.placement-left {
    left: 0;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

/* Header */
.base-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-bg);
    flex-shrink: 0;
}

.header-content {
    flex: 1;
    min-width: 0;
}

.panel-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    font-family: var(--font);
}

.panel-subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-dimmed);
    line-height: 1.4;
}

.close-btn {
    flex-shrink: 0;
    padding: 0.375rem;
    margin: -0.375rem -0.375rem 0 0;
    background: none;
    border: none;
    color: var(--color-dimmed);
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: var(--color-border);
    color: var(--color-contrast);
}

.close-btn:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}

/* Body */
.base-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Footer */
.base-panel-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-card-bg);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-shrink: 0;
}

/* Scrollbar styling */
.base-panel-body::-webkit-scrollbar {
    width: 8px;
}

.base-panel-body::-webkit-scrollbar-track {
    background: transparent;
}

.base-panel-body::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
}

.base-panel-body::-webkit-scrollbar-thumb:hover {
    background: var(--color-dimmed);
}
</style>
