<template>
    <div class="demo-toggle">
        <!-- Navigation Buttons (appear when expanded) -->
        <transition-group name="fab-buttons">
            <button v-for="(page, index) in demoPages" v-show="isExpanded" :key="page.path" class="fab-nav-button"
                :style="{ transitionDelay: `${index * 50}ms` }" :class="{ active: isCurrentPage(page.path) }"
                @click="navigateTo(page.path)" :title="page.label">
                <span class="fab-icon">{{ page.icon }}</span>
                <span class="fab-label">{{ page.label }}</span>
            </button>
        </transition-group>

        <!-- Main Toggle Button -->
        <button class="fab-main" :class="{ expanded: isExpanded }" @click="toggleMenu"
            :title="isExpanded ? 'Close menu' : 'Open demo menu'">
            <span class="fab-icon-main">{{ isExpanded ? '✕' : '🎨' }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isExpanded = ref(false)

interface DemoPage {
    path: string
    label: string
    icon: string
}

const demoPages: DemoPage[] = [
    { path: '/demo/float-hard', label: 'Fl. Post-Its (hard)', icon: '🎨' },
    { path: '/demo/float-dyn', label: 'Fl. Post-Its (dyn)', icon: '🎨' },
    { path: '/demo/float-markdown', label: 'Fl. Post-Its (md)', icon: '🎨' },
    { path: '/theme-demo', label: 'Themes', icon: '🎨' },
    { path: '/kanban-demo', label: 'Kanban', icon: '📋' },
    { path: '/clist-demo', label: 'Lists', icon: '📝' },
    { path: '/admin/i18n', label: 'i18n', icon: '🌍' }
]

function toggleMenu() {
    isExpanded.value = !isExpanded.value
}

function isCurrentPage(path: string): boolean {
    return route.path === path
}

function navigateTo(path: string) {
    router.push(path)
    isExpanded.value = false
}
</script>

<style scoped>
.demo-toggle {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 1rem;
}

/* Main FAB Button */
.fab-main {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px oklch(0% 0 0 / 0.3), 0 2px 4px oklch(0% 0 0 / 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font);
    position: relative;
}

.fab-main:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px oklch(0% 0 0 / 0.4), 0 3px 6px oklch(0% 0 0 / 0.3);
    background: var(--color-secondary-bg);
}

.fab-main:active {
    transform: scale(0.95);
}

.fab-main.expanded {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    transform: rotate(90deg);
}

.fab-icon-main {
    font-size: 1.5rem;
    transition: transform 0.3s ease;
}

/* Navigation Buttons */
.fab-nav-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1rem;
    height: 48px;
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
    border: none;
    border-radius: 24px;
    cursor: pointer;
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 2px 4px oklch(0% 0 0 / 0.2), 0 1px 2px oklch(0% 0 0 / 0.15);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    min-width: 140px;
    justify-content: flex-start;
}

.fab-nav-button:hover {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    transform: translateX(-4px) scale(1.05);
    box-shadow: 0 4px 8px oklch(0% 0 0 / 0.3), 0 2px 4px oklch(0% 0 0 / 0.25);
}

.fab-nav-button:active {
    transform: translateX(-4px) scale(0.98);
}

.fab-nav-button.active {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
    box-shadow: 0 3px 6px oklch(0% 0 0 / 0.25), 0 1px 3px oklch(0% 0 0 / 0.2);
}

.fab-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.fab-label {
    flex: 1;
    text-align: left;
}

/* Animations */
.fab-buttons-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-buttons-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-buttons-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
}

.fab-buttons-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .demo-toggle {
        bottom: 1rem;
        right: 1rem;
    }

    .fab-main {
        width: 48px;
        height: 48px;
    }

    .fab-icon-main {
        font-size: 1.25rem;
    }

    .fab-nav-button {
        height: 44px;
        padding: 0 0.875rem;
        font-size: 0.8125rem;
        min-width: 120px;
    }

    .fab-icon {
        font-size: 1.125rem;
    }
}

/* Accessibility */
.fab-main:focus-visible,
.fab-nav-button:focus-visible {
    outline: 2px solid var(--color-accent-contrast);
    outline-offset: 2px;
}

/* Prevent text selection */
.fab-main,
.fab-nav-button {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}
</style>
