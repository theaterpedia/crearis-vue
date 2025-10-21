<template>
    <div class="user-menu-wrapper" ref="userMenuRef">
        <button class="user-menu-button" @click="toggleMenu">
            <span class="user-icon">👤</span>
            <span class="user-name">{{ username }}</span>
        </button>

        <div v-if="isOpen" class="user-menu" :class="`user-menu-${placement}`">
            <div class="user-menu-header">
                <div class="header-content">
                    <h3>👤 {{ username }}</h3>
                    <p class="role-status">
                        <span v-if="activeRole === 'project' && projectName">{{ projectName }}</span>
                        <span v-else-if="activeRole === 'user'">Benutzer</span>
                        <span v-else>{{ activeRole }}</span>
                    </p>
                </div>
                <button class="close-btn" @click="closeMenu">&times;</button>
            </div>

            <div class="user-menu-body">
                <!-- Role Toggle (if multiple roles available) -->
                <div v-if="availableRoles && availableRoles.length > 1" class="user-section role-section">
                    <h4 class="section-title">Rolle</h4>
                    <div class="role-toggle-container">
                        <slot name="role-toggle"></slot>
                    </div>
                </div>

                <!-- Display Settings -->
                <div class="user-section">
                    <h4 class="section-title">Anzeige</h4>

                    <!-- Inverted Mode Toggle -->
                    <div class="setting-item">
                        <slot name="inverted-toggle"></slot>
                    </div>

                    <!-- Theme Dropdown -->
                    <div class="setting-item">
                        <slot name="theme-dropdown"></slot>
                    </div>
                </div>

                <!-- Account Actions -->
                <div class="user-section">
                    <h4 class="section-title">Konto</h4>
                    <div class="action-buttons">
                        <button class="action-button" @click="$emit('logout')">
                            <span class="logout-icon">🚪</span>
                            <span class="logout-text">Abmelden</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
    username: string
    activeRole: string
    projectName?: string
    availableRoles?: string[]
    /**
     * Placement of the dropdown menu
     * @default 'right'
     */
    placement?: 'left' | 'right'
}>(), {
    placement: 'right'
})

const emit = defineEmits<{
    close: []
    logout: []
}>()

const isOpen = ref(false)
const userMenuRef = ref<HTMLElement>()

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function closeMenu() {
    isOpen.value = false
    emit('close')
}

function handleClickOutside(event: MouseEvent) {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
        closeMenu()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu-wrapper {
    position: relative;
}

.user-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.5rem;
    padding: 0 0.75rem;
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: transparent;
    font-family: var(--font);
    font-size: 0.9375rem;
    font-weight: 500;
    transition: var(--transition);
    transition-property: background-color, color, border-color;
    cursor: pointer;
}

.user-menu-button:hover {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.user-icon {
    font-size: 1.125rem;
    flex-shrink: 0;
}

.user-name {
    white-space: nowrap;
}

.user-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 200;
}

/* Right placement (default) */
.user-menu-right {
    right: 0;
    left: auto;
}

/* Left placement */
.user-menu-left {
    left: 0;
    right: auto;
}

.user-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border-radius: 8px 8px 0 0;
}

.header-content {
    flex: 1;
}

.user-menu-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.role-status {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--color-primary-contrast);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
    flex-shrink: 0;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.user-menu-body {
    padding: 1.5rem;
}

.user-section {
    margin-bottom: 2rem;
}

.user-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin: 0 0 0.75rem 0;
    letter-spacing: 0.5px;
}

.role-section {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid #2196f3;
}

.role-section .section-title {
    color: #1565c0;
}

.role-toggle-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.setting-item {
    margin-bottom: 0.75rem;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.action-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
}

.action-button:hover {
    background: var(--color-surface);
    border-color: var(--color-accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logout-icon {
    font-size: 1.125rem;
}

.logout-text {
    flex: 1;
}

/* Mobile styles */
@media (max-width: 768px) {
    .user-name {
        display: none;
    }

    .user-menu-button {
        padding: 0.5rem;
        width: 2.5rem;
        justify-content: center;
    }

    .user-menu {
        width: auto;
        max-width: 20rem;
        right: 0;
        left: auto;
    }

    .user-menu-left {
        left: auto;
        right: 0;
    }
}
</style>
