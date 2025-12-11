<!--
  ProjectSettingsPanel.vue - Consolidated settings for dashboard
  
  Combines content from stepper's "special steps":
  - Theme/Layout/Navigation config
  - Pages config
  - Images config  
  - Project activation
  
  Used in DashboardLayout's Settings NavStop (COG)
-->
<template>
    <div class="project-settings-panel">
        <!-- Section: Theme & Design -->
        <section class="settings-section">
            <div class="section-header" @click="toggleSection('theme')">
                <h3>
                    <span class="section-icon">🎨</span>
                    Theme, Layout & Navigation
                </h3>
                <span class="toggle-icon" :class="{ expanded: expandedSections.theme }">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                </span>
            </div>
            <div v-if="expandedSections.theme" class="section-content">
                <!-- Theme subtabs -->
                <div class="subtabs">
                    <button v-for="tab in themeTabs" :key="tab.id" class="subtab-button"
                        :class="{ active: activeThemeTab === tab.id }" @click="activeThemeTab = tab.id">
                        {{ tab.label }}
                    </button>
                </div>
                <div class="subtab-content">
                    <ThemeConfigPanel v-if="activeThemeTab === 'theme'" :project-id="projectId" :is-locked="isLocked" />
                    <LayoutConfigPanel v-else-if="activeThemeTab === 'layout'" :project-id="projectId"
                        :is-locked="isLocked" />
                    <NavigationConfigPanel v-else-if="activeThemeTab === 'navigation'" :project-id="projectId"
                        :is-locked="isLocked" />
                </div>
            </div>
        </section>

        <!-- Section: Pages -->
        <section class="settings-section">
            <div class="section-header" @click="toggleSection('pages')">
                <h3>
                    <span class="section-icon">📄</span>
                    Landing-Page & Pages
                </h3>
                <span class="toggle-icon" :class="{ expanded: expandedSections.pages }">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                </span>
            </div>
            <div v-if="expandedSections.pages" class="section-content">
                <div class="placeholder-box">
                    <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32">
                        <path
                            d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,200V112H216v88Z" />
                    </svg>
                    <p class="placeholder-title">Pages Configuration</p>
                    <p class="placeholder-text">Page management coming soon...</p>
                </div>
            </div>
        </section>

        <!-- Section: Images -->
        <section class="settings-section">
            <div class="section-header" @click="toggleSection('images')">
                <h3>
                    <span class="section-icon">🖼️</span>
                    Images & Media
                </h3>
                <span class="toggle-icon" :class="{ expanded: expandedSections.images }">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                </span>
            </div>
            <div v-if="expandedSections.images" class="section-content">
                <div class="placeholder-box">
                    <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32">
                        <path
                            d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v94.34l-36.69-36.69a8,8,0,0,0-11.32,0L62.34,219.31A8,8,0,0,1,40,200V56ZM216,200H91.31l98.35-98.34,26.34,26.34Z" />
                    </svg>
                    <p class="placeholder-title">Image Library</p>
                    <p class="placeholder-text">Image management coming soon...</p>
                </div>
            </div>
        </section>

        <!-- Section: Project Activation (only for owners, only in stepper mode) -->
        <section v-if="isOwner && showActivation" class="settings-section settings-section--highlight">
            <div class="section-header" @click="toggleSection('activate')">
                <h3>
                    <span class="section-icon">🚀</span>
                    Project Activation
                </h3>
                <span class="toggle-icon" :class="{ expanded: expandedSections.activate }">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                </span>
            </div>
            <div v-if="expandedSections.activate" class="section-content">
                <div class="activate-summary">
                    <div class="info-card">
                        <p class="info-text">
                            After activation, the project enters <strong>Draft Mode</strong>.
                            You can make further adjustments and publish later.
                        </p>
                    </div>

                    <div class="checklist">
                        <h4>Before activation:</h4>
                        <ul class="check-items">
                            <li class="check-item">
                                <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                                    <path
                                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                                </svg>
                                <span>Project information complete</span>
                            </li>
                            <li class="check-item">
                                <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                                    <path
                                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                                </svg>
                                <span>Users and roles configured</span>
                            </li>
                            <li class="check-item">
                                <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                                    <path
                                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                                </svg>
                                <span>Theme and layout customized</span>
                            </li>
                        </ul>
                    </div>

                    <button class="btn-activate" @click="handleActivate">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20">
                            <path
                                d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
                        </svg>
                        Activate Project
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ThemeConfigPanel from '@/components/ThemeConfigPanel.vue'
import LayoutConfigPanel from '@/components/LayoutConfigPanel.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'

interface Props {
    projectId: string
    isOwner?: boolean
    isLocked?: boolean
    showActivation?: boolean // Show activation section (stepper mode only)
}

const props = withDefaults(defineProps<Props>(), {
    isOwner: false,
    isLocked: false,
    showActivation: false
})

const emit = defineEmits<{
    'activate-project': []
}>()

// Section expansion state
const expandedSections = reactive({
    theme: true,
    pages: false,
    images: false,
    activate: false
})

const toggleSection = (section: keyof typeof expandedSections) => {
    expandedSections[section] = !expandedSections[section]
}

// Theme subtabs
const themeTabs = [
    { id: 'theme', label: 'Theme' },
    { id: 'layout', label: 'Layout' },
    { id: 'navigation', label: 'Navigation' }
]
const activeThemeTab = ref('theme')

const handleActivate = () => {
    emit('activate-project')
}
</script>

<style scoped>
.project-settings-panel {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.settings-section {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.settings-section--highlight {
    border-color: var(--color-primary-bg);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    cursor: pointer;
    user-select: none;
    background: var(--color-surface);
    transition: background 0.2s;
}

.section-header:hover {
    background: var(--color-surface-hover);
}

.section-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.section-icon {
    font-size: 1.25rem;
}

.toggle-icon {
    transition: transform 0.2s;
}

.toggle-icon.expanded {
    transform: rotate(180deg);
}

.section-content {
    padding: var(--spacing-md);
    border-top: 1px solid var(--color-border);
}

/* Subtabs */
.subtabs {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-xs);
}

.subtab-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-muted);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.subtab-button:hover {
    color: var(--color-text);
}

.subtab-button.active {
    color: var(--color-primary-bg);
    border-bottom-color: var(--color-primary-bg);
}

/* Placeholder */
.placeholder-box {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-muted);
}

.placeholder-box svg {
    opacity: 0.5;
    margin-bottom: var(--spacing-sm);
}

.placeholder-title {
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
}

.placeholder-text {
    font-size: 0.875rem;
}

/* Activation section */
.activate-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.info-card {
    background: var(--color-info-lighter, #eff6ff);
    border: 1px solid var(--color-info-border, #93c5fd);
    border-radius: var(--radius-sm);
    padding: var(--spacing-md);
}

.info-text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
}

.checklist h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 0.9rem;
}

.check-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.check-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--color-positive-bg, #22c55e);
}

.btn-activate {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--color-primary-bg);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-start;
}

.btn-activate:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
}
</style>
