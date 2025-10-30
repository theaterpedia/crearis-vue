<template>
    <div class="project-view">
        <!-- Navbar -->
        <Navbar :user="user" :full-width="false" logo-text="🎯 Projekt-Editor" @logout="logout">
            <template #menus>
                <!-- Back button -->
                <div class="navbar-item">
                    <button class="navbar-button back-btn" @click="goBack" title="Zurück">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                            </path>
                        </svg>
                        Zurück
                    </button>
                </div>

                <!-- Homepage Link -->
                <div class="navbar-item">
                    <RouterLink :to="`/sites/${projectId}`" class="navbar-button homepage-link" title="Zur Homepage">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z">
                            </path>
                        </svg>
                        Homepage
                    </RouterLink>
                </div>

                <!-- Config Dropdown -->
                <div class="navbar-item config-dropdown-wrapper" ref="configDropdownRef">
                    <button class="navbar-button config-toggle-btn" @click="toggleConfigDropdown"
                        :aria-expanded="isConfigOpen">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                            </path>
                        </svg>
                        <span>Config</span>
                    </button>

                    <div v-if="isConfigOpen" class="config-dropdown">
                        <div class="config-dropdown-header">
                            <h3>⚙️ Projekt-Konfiguration</h3>
                            <button class="close-btn" @click="closeConfigDropdown">&times;</button>
                        </div>

                        <div class="config-dropdown-body">
                            <!-- Release Selection -->
                            <div class="config-section">
                                <label class="config-label">Release</label>
                                <select v-model="config.selectedRelease" class="config-select">
                                    <option v-for="release in dummyReleases" :key="release.id" :value="release.id">
                                        {{ release.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Open Tasks Filter -->
                            <div class="config-section">
                                <label class="config-label">Offene Aufgaben</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="config.openTasks.idea" />
                                        <span>Idee</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="config.openTasks.new" />
                                        <span>Neu</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="config.openTasks.draft" />
                                        <span>Entwurf</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Owner (current user from auth) -->
                            <div class="config-section">
                                <label class="config-label">Eigentümer</label>
                                <div class="config-readonly">
                                    {{ user?.username || 'N/A' }}
                                </div>
                            </div>

                            <!-- Coworkers Multi-Select -->
                            <div class="config-section">
                                <label class="config-label">Mitarbeiter</label>
                                <div class="checkbox-group">
                                    <label v-for="coworker in dummyUsers" :key="coworker.id" class="checkbox-label">
                                        <input type="checkbox" :value="coworker.id"
                                            v-model="config.selectedCoworkers" />
                                        <span>{{ coworker.username }}</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Domain -->
                            <div class="config-section">
                                <label class="config-label">Domain</label>
                                <input type="text" v-model="config.domain" class="config-input"
                                    placeholder="example.com" />
                            </div>

                            <!-- Logo (File Upload or Text Logo) -->
                            <div class="config-section">
                                <label class="config-label">Logo</label>
                                <div class="logo-options">
                                    <div class="radio-group">
                                        <label class="radio-label">
                                            <input type="radio" v-model="config.logoType" value="file" />
                                            <span>Datei-Upload</span>
                                        </label>
                                        <label class="radio-label">
                                            <input type="radio" v-model="config.logoType" value="text" />
                                            <span>Text-Logo</span>
                                        </label>
                                    </div>

                                    <div v-if="config.logoType === 'file'" class="file-upload-section">
                                        <input type="file" accept="image/*" @change="handleLogoFileChange"
                                            class="file-input" />
                                        <p class="file-hint">PNG, JPG, SVG (max. 2MB)</p>
                                    </div>

                                    <div v-if="config.logoType === 'text'" class="text-logo-section">
                                        <input type="text" v-model="config.logoText" class="config-input"
                                            placeholder="Logo-Text eingeben" />
                                    </div>
                                </div>
                            </div>

                            <!-- Title -->
                            <div class="config-section">
                                <label class="config-label">Website-Titel</label>
                                <input type="text" v-model="config.title" class="config-input"
                                    placeholder="Mein Projekt" />
                            </div>

                            <!-- Description -->
                            <div class="config-section">
                                <label class="config-label">Website-Beschreibung</label>
                                <textarea v-model="config.description" class="config-textarea"
                                    placeholder="Beschreiben Sie Ihr Projekt..." rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Navbar>

        <!-- Main Content: 2-Column Layout -->
        <div class="main-content">
            <!-- Left Column: Navigation (40%) - Stepper or Tabs based on project status -->
            <div class="navigation">
                <!-- Stepper Mode: status < 2 -->
                <ProjectStepper v-if="isStepper" v-model:step="currentStep" :project-id="projectId" />

                <!-- Navigation Mode: status >= 2 -->
                <ProjectNavigation v-else :project-id="projectId" :project-name="projectName"
                    :visible-tabs="visibleNavigationTabs" @tab-change="handleTabChange" />
            </div>

            <!-- Right Column: Editor (60%) -->
            <div class="editor">
                <div class="editor-content">
                    <!-- Stepper Mode Components -->
                    <template v-if="isStepper">
                        <ProjectStepEvents v-if="currentStep === 0" :project-id="projectId" :is-locked="isLocked"
                            @next="nextStep" />
                        <ProjectStepPosts v-else-if="currentStep === 1" :project-id="projectId" :is-locked="isLocked"
                            @next="nextStep" @prev="prevStep" />
                        <ProjectStepUsers v-else-if="currentStep === 2" :project-id="projectId" :is-locked="isLocked"
                            @next="nextStep" @prev="prevStep" />
                        <ProjectStepTheme v-else-if="currentStep === 3" :project-id="projectId" :is-locked="isLocked"
                            @next="nextStep" @prev="prevStep" />
                        <ProjectStepPages v-else-if="currentStep === 4" :project-id="projectId" :is-locked="isLocked"
                            @prev="prevStep" @complete="completeProject" />
                    </template>

                    <!-- Navigation Mode Panels -->
                    <template v-else>
                        <PageConfigController v-if="currentNavTab === 'homepage'" :project="projectId" mode="project" />
                        <ProjectStepEvents v-else-if="currentNavTab === 'events'" :project-id="projectId"
                            :is-locked="isLocked" hide-actions />
                        <ProjectStepPosts v-else-if="currentNavTab === 'posts'" :project-id="projectId"
                            :is-locked="isLocked" hide-actions />
                        <ProjectStepUsers v-else-if="currentNavTab === 'users'" :project-id="projectId"
                            :is-locked="isLocked" hide-actions />
                        <ThemeConfigPanel v-else-if="currentNavTab === 'theme'" :project-id="projectId"
                            :is-locked="isLocked" />
                        <LayoutConfigPanel v-else-if="currentNavTab === 'layout'" :project-id="projectId"
                            :is-locked="isLocked" />
                        <NavigationConfigPanel v-else-if="currentNavTab === 'navigation'" :project-id="projectId"
                            :is-locked="isLocked" />
                        <ProjectStepPages v-else-if="currentNavTab === 'pages'" :project-id="projectId"
                            :is-locked="isLocked" hide-actions />
                        <EventsConfigPanel v-else-if="currentNavTab === 'events-config'" :project-id="projectId"
                            :is-locked="isLocked" />
                        <RegioConfigPanel v-else-if="currentNavTab === 'regio-config'" :project-id="projectId"
                            :is-locked="isLocked" />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import Navbar from '@/components/Navbar.vue'
import ProjectStepper from './ProjectStepper.vue'
import ProjectNavigation from './ProjectNavigation.vue'
import ProjectStepEvents from './ProjectStepEvents.vue'
import ProjectStepPosts from './ProjectStepPosts.vue'
import ProjectStepUsers from './ProjectStepUsers.vue'
import ProjectStepTheme from './ProjectStepTheme.vue'
import ProjectStepPages from './ProjectStepPages.vue'
import EventsConfigPanel from '@/components/EventsConfigPanel.vue'
import RegioConfigPanel from '@/components/RegioConfigPanel.vue'
import ThemeConfigPanel from '@/components/ThemeConfigPanel.vue'
import LayoutConfigPanel from '@/components/LayoutConfigPanel.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
import PageConfigController from '@/components/PageConfigController.vue'

const router = useRouter()
const { user, requireAuth, logout } = useAuth()

// Project ID - use the projectId from auth session (contains domaincode)
const projectId = computed(() => {
    // For project users, use the projectId from session (contains domaincode like "theaterpedia")
    if (user.value?.activeRole === 'project' && user.value.projectId) {
        return user.value.projectId
    }
    // Fallback for admin/testing
    return 'project1'
})

// Project state
const projectData = ref<any>(null)
const projectStatusId = ref<number | null>(null) // status_id from DB

// Current step (0-4) for stepper mode
const currentStep = ref(0)

// Current tab for navigation mode
const currentNavTab = ref('events')

// Computed props based on project status
// Stepper mode: status 'new' (18) or 'demo' (19)
// Navigation mode: all other statuses
const isStepper = computed(() => {
    if (projectStatusId.value === null) return true // Default to stepper while loading
    return projectStatusId.value === 18 || projectStatusId.value === 19
})
const isLocked = computed(() => {
    // TODO: Define when project should be locked (e.g., status 'released' or higher)
    return false
})

// Visible tabs for navigation mode (computed based on project settings)
const visibleNavigationTabs = computed(() => {
    const tabs: string[] = ['homepage', 'events', 'posts', 'users', 'theme', 'layout', 'navigation', 'pages']

    // Add conditional tabs based on project settings
    if (projectData.value) {
        // EventsConfigPanel: NOT (is_service OR is_topic)
        const showEventsConfig = !(projectData.value.is_service || projectData.value.is_topic)
        if (showEventsConfig) {
            tabs.push('events-config')
        }

        // RegioConfigPanel: is_regio
        if (projectData.value.is_regio) {
            tabs.push('regio-config')
        }
    }

    return tabs
})

// Safe project name for display
const projectName = computed(() => {
    if (!projectData.value) return undefined
    const heading = projectData.value.heading?.trim()
    const name = projectData.value.name?.trim()
    return heading || name || undefined
})

// Config dropdown state
const isConfigOpen = ref(false)
const configDropdownRef = ref<HTMLElement | null>(null)

// Dummy data for config (hardcoded, not connected to DB yet)
const dummyReleases = ref([
    { id: 1, name: 'v1.0.0 - Initial Release' },
    { id: 2, name: 'v1.1.0 - Feature Update' },
    { id: 3, name: 'v2.0.0 - Major Release' }
])

const dummyUsers = ref([
    { id: 2, username: 'alice' },
    { id: 3, username: 'bob' },
    { id: 4, username: 'charlie' }
])

// Config state (not connected to read-save functionality yet)
const config = ref({
    selectedRelease: 1,
    openTasks: {
        idea: true,
        new: true,
        draft: false
    },
    selectedCoworkers: [2], // Array of user IDs
    domain: 'example.com',
    logoType: 'text' as 'file' | 'text',
    logoFile: null as File | null,
    logoText: 'My Project',
    title: 'Mein Projekt',
    description: 'Ein tolles Projekt mit spannenden Inhalten.'
})

// Load project data
async function loadProjectData() {
    try {
        const response = await fetch(`/api/projects/${projectId.value}`)
        if (response.ok) {
            projectData.value = await response.json()
            // Use status_id (new field after migration 020)
            projectStatusId.value = projectData.value.status_id ?? null
        }
    } catch (error) {
        console.error('Failed to load project data:', error)
    }
}

// Navigation functions
function nextStep() {
    if (currentStep.value < 4) {
        currentStep.value++
    }
}

function prevStep() {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

function handleTabChange(tabId: string) {
    currentNavTab.value = tabId
}

function goBack() {
    router.push('/')
}

function completeProject() {
    console.log('Project completed!')
    // TODO: Save project and navigate
    router.push('/')
}

// Config dropdown functions
function toggleConfigDropdown() {
    isConfigOpen.value = !isConfigOpen.value
}

function closeConfigDropdown() {
    isConfigOpen.value = false
}

function handleLogoFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        const file = target.files[0]
        if (!file) return

        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            alert('Datei zu groß! Maximal 2MB erlaubt.')
            return
        }
        config.value.logoFile = file
        console.log('Logo file selected:', file.name)
    }
}

// Click outside to close config dropdown
function handleClickOutside(event: MouseEvent) {
    if (configDropdownRef.value && !configDropdownRef.value.contains(event.target as Node)) {
        closeConfigDropdown()
    }
}

// Initialize theme system
const { init: initTheme } = useTheme()

// Auth check on mount
onMounted(async () => {
    // Initialize theme system (loads available themes, doesn't set any by default)
    await initTheme()

    await requireAuth()

    // Load project data to determine status and settings
    await loadProjectData()

    // Add click outside listener
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    // Remove click outside listener
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ===== PROJECT VIEW CONTAINER ===== */
.project-view {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-bg-soft);
}

/* ===== NAVBAR ===== */
.navbar-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.navbar-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.navbar-button:hover {
    background: var(--color-bg);
    border-color: var(--color-project);
}

.back-btn svg {
    transition: transform 0.2s ease;
}

.back-btn:hover svg {
    transform: translateX(-2px);
}

/* Homepage Link */
.homepage-link {
    text-decoration: none;
    color: var(--color-text);
}

.homepage-link svg {
    transition: transform 0.2s ease;
}

.homepage-link:hover {
    background: var(--color-project);
    border-color: var(--color-project);
    color: white;
}

.homepage-link:hover svg {
    transform: scale(1.1);
}

/* ===== CONFIG DROPDOWN ===== */
.config-dropdown-wrapper {
    position: relative;
}

.config-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.config-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 28rem;
    max-width: 32rem;
    background: var(--color-popover-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 25px -3px oklch(0% 0 0 / 0.1);
    max-height: 80vh;
    overflow-y: auto;
    z-index: 200;
}

.config-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: var(--border) solid var(--color-border);
    background: var(--color-bg-soft);
}

.config-dropdown-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.75rem;
    line-height: 1;
    color: var(--color-dimmed);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-button);
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-text);
}

.config-dropdown-body {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.config-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.config-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.config-select,
.config-input,
.config-textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.2s ease;
}

.config-select:focus,
.config-input:focus,
.config-textarea:focus {
    outline: none;
    border-color: var(--color-project);
    box-shadow: 0 0 0 3px rgba(var(--color-project-rgb, 147, 51, 234), 0.1);
}

.config-readonly {
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-dimmed);
    font-size: 0.875rem;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: var(--color-project);
}

.radio-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
}

.radio-label input[type="radio"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: var(--color-project);
}

.logo-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.file-upload-section,
.text-logo-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.file-input {
    font-size: 0.875rem;
    color: var(--color-text);
}

.file-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* ===== MAIN CONTENT ===== */
.main-content {
    display: flex;
    flex: 1;
    gap: 1rem;
    padding: 2rem;
    max-width: 100%;
    overflow: hidden;
}

/* Navigation Column (Left) - Stepper or Tabs */
.navigation {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
}

/* Editor Column (Right) - Main Content Area */
.editor {
    flex: 0 0 60%;
    overflow-y: auto;
    padding-left: 1rem;
    border-left: var(--border) solid var(--color-border);
}

.editor-content {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 2rem;
    min-height: 100%;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
    .main-content {
        flex-direction: column;
    }

    .navigation,
    .editor {
        flex: 1;
        border: none;
        padding: 0;
    }
}
</style>
