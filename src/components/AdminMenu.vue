<template>
    <div class="admin-menu-wrapper" ref="adminMenuRef">
        <button class="admin-menu-button" @click="toggleMenu" :class="{
            'admin-menu-button-with-text': buttonText,
            'has-active-options': hasActiveOptions
        }">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11Z">
                </path>
            </svg>
            <span v-if="buttonText" class="admin-menu-button-text">{{ buttonText }}</span>
        </button>

        <div v-if="isOpen" class="admin-menu" :class="`admin-menu-${placement}`">
            <div class="admin-menu-header">
                <div class="header-content">
                    <h3>👑 Admin-Menü</h3>
                    <p class="mode-status">
                        <span v-if="baseMode">Basismodus aktiviert (Keine Admin-Funktionen)</span>
                        <span v-else-if="settingsMode">Settingsmodus aktiviert (keine Bearbeitungen möglich)</span>
                        <span v-else-if="adminMode === 'version-release'">Projektmodus aktiviert</span>
                        <span v-else>Basisdaten-Admin aktiviert</span>
                    </p>
                </div>
                <button class="close-btn" @click="closeMenu">&times;</button>
            </div>

            <div class="admin-menu-body">
                <!-- Display Settings -->
                <div class="admin-section">
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

                <!-- Base Mode Toggle (Always available on dashboard) -->
                <div v-if="isOnDashboard" class="admin-section base-mode-section">
                    <h4 class="section-title">Ansichtsmodus</h4>
                    <label class="toggle-label">
                        <input type="checkbox" :checked="baseMode" @change="$emit('toggle-base-mode')" />
                        <span class="toggle-switch toggle-switch-base"></span>
                        <span class="toggle-text">Basis-Modus</span>
                    </label>
                </div>

                <!-- Mode Toggle (Only on / route and NOT in base mode) -->
                <div v-if="isOnDashboard && !baseMode" class="admin-section">
                    <h4 class="section-title">Modus wechseln</h4>
                    <div class="button-group">
                        <button class="mode-button" :class="{ active: adminMode === 'base-release' }"
                            @click="$emit('set-mode', 'base-release')">
                            📦 Basis-Release
                        </button>
                        <button class="mode-button" :class="{ active: adminMode === 'version-release' }"
                            @click="$emit('set-mode', 'version-release')">
                            🎯 Version-Release
                        </button>
                    </div>
                </div>

                <!-- Settings Toggle (Only on / route and NOT in base mode) -->
                <div v-if="isOnDashboard && !baseMode" class="admin-section">
                    <h4 class="section-title">Einstellungen</h4>
                    <label class="toggle-label">
                        <input type="checkbox" :checked="settingsMode" @change="$emit('toggle-settings')" />
                        <span class="toggle-switch"></span>
                        <span class="toggle-text">Einstellungsmodus</span>
                    </label>
                </div>

                <!-- Action Stubs -->
                <div class="admin-section">
                    <h4 class="section-title">Aktionen</h4>
                    <div class="action-buttons">
                        <button class="action-button" @click="$emit('action', 'export')">
                            📤 Daten exportieren
                        </button>
                        <button class="action-button" @click="$emit('action', 'backup')">
                            💾 Backup erstellen
                        </button>
                        <button class="action-button" @click="$emit('action', 'sync')">
                            🔄 Synchronisieren
                        </button>
                        <button class="action-button" @click="$emit('action', 'report')">
                            📊 Bericht generieren
                        </button>
                    </div>
                </div>

                <!-- Admin Links -->
                <div class="admin-section">
                    <h4 class="section-title">Administration</h4>
                    <div class="action-buttons">
                        <RouterLink to="/admin/i18n" class="action-button action-link" @click="closeMenu">
                            🌍 i18n Verwaltung
                        </RouterLink>
                    </div>
                </div>

                <!-- Account Actions -->
                <div v-if="username" class="admin-section">
                    <h4 class="section-title">Konto</h4>
                    <div class="user-info">
                        <span class="username-display">👤 {{ username }}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="action-button logout-button" @click="$emit('logout')">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
    adminMode: 'base-release' | 'version-release'
    settingsMode: boolean
    baseMode: boolean
    currentRoute: string
    isOnDashboard: boolean
    username?: string
    /**
     * Placement of the dropdown menu
     * @default 'right'
     */
    placement?: 'left' | 'right'
    /**
     * Optional text to display next to the button icon
     */
    buttonText?: string
}>()

const emit = defineEmits<{
    close: []
    'set-mode': [mode: 'base-release' | 'version-release']
    'toggle-settings': []
    'toggle-base-mode': []
    action: [action: string]
    logout: []
}>()

const isOpen = ref(false)
const adminMenuRef = ref<HTMLElement>()

// Check if any admin options are active
const hasActiveOptions = computed(() => {
    return props.baseMode || props.settingsMode || props.adminMode === 'version-release'
})

function toggleMenu() {
    isOpen.value = !isOpen.value
}

function closeMenu() {
    isOpen.value = false
    emit('close')
}

function handleClickOutside(event: MouseEvent) {
    if (adminMenuRef.value && !adminMenuRef.value.contains(event.target as Node)) {
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
.admin-menu-wrapper {
    position: relative;
}

.admin-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0 0.5rem;
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

.admin-menu-button:hover {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.admin-menu-button.has-active-options {
    color: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
}

.admin-menu-button.has-active-options:hover {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.admin-menu-button-with-text {
    width: auto;
    padding: 0.5rem 1rem;
}

.admin-menu-button svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
}

.admin-menu-button-text {
    white-space: nowrap;
}

.admin-menu {
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
.admin-menu-right {
    right: 0;
    left: auto;
}

/* Left placement */
.admin-menu-left {
    left: 0;
    right: auto;
}

.admin-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-accent-bg);
    color: var(--color-primary-contrast);
    border-radius: 8px 8px 0 0;
}

.header-content {
    flex: 1;
}

.admin-menu-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary-contrast);
}

.mode-status {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
    color: var(--color-primary-contrast);
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

.admin-menu-body {
    padding: 1.5rem;
}

.admin-section {
    margin-bottom: 2rem;
}

.admin-section:last-child {
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

.base-mode-section {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid #9c27b0;
}

.base-mode-section .section-title {
    color: #6a1b9a;
}

.button-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.mode-button {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.mode-button:hover {
    border-color: var(--color-primary-bg);
    background: var(--color-surface);
}

.mode-button.active {
    border-color: var(--color-primary-bg);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    margin-bottom: 0.75rem;
}

.toggle-label input[type="checkbox"] {
    display: none;
}

.toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--color-border);
    border-radius: 12px;
    transition: background 0.3s;
}

.toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}

input[type="checkbox"]:checked+.toggle-switch {
    background: var(--color-primary-bg);
}

input[type="checkbox"]:checked+.toggle-switch::after {
    transform: translateX(24px);
}

.toggle-switch-base {
    background: var(--color-border);
}

input[type="checkbox"]:checked+.toggle-switch-base {
    background: var(--color-primary-bg);
}

.toggle-text {
    font-weight: 500;
    color: var(--color-text);
}

.setting-item {
    margin-bottom: 0.75rem;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.user-info {
    margin-bottom: 0.75rem;
}

.username-display {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-muted-bg);
    border-radius: 6px;
    font-weight: 500;
    color: var(--color-text);
}

.logout-button {
    width: 100%;
    justify-content: flex-start;
}

.logout-icon {
    font-size: 1.125rem;
}

.logout-text {
    flex: 1;
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.action-button {
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
}

.action-button:hover {
    background: var(--color-surface);
    border-color: var(--color-accent-contrast);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-link {
    display: block;
    text-decoration: none;
    color: var(--color-text);
}

.action-link:visited {
    color: var(--color-text);
}

/* Mobile styles */
@media (max-width: 768px) {
    .admin-menu-button-text {
        display: none;
    }

    .admin-menu-button {
        padding: 0.5rem;
        min-width: 2.5rem;
        justify-content: center;
    }

    .admin-menu-button svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .admin-menu {
        width: auto;
        max-width: 20rem;
        /* 320px */
        right: 0;
        left: auto;
    }

    .admin-menu-left {
        left: auto;
        right: 0;
    }
}
</style>
