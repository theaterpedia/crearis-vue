<template>
    <div class="project-dashboard">
        <!-- No Access: Partner, Participant in NEW/DEMO; Anonym in NEW/DEMO/DRAFT -->
        <div v-if="showDemoMessage && projectData" class="project-dashboard__demo-message">
            <div class="demo-message-box">
                <h2>🎭 {{ projectName }}</h2>
                <p class="demo-status">Status: <strong>{{ statusLabel }}</strong></p>
                <p class="demo-explanation">
                    <template v-if="projectStatus <= PROJECT_STATUS.NEW">
                        Das Projekt wird gerade eingerichtet.
                        Du hast noch keinen Zugriff.
                    </template>
                    <template v-else>
                        Das Projekt befindet sich noch in der Demo-Phase.
                        Du hast noch keinen Zugriff auf die Inhalte.
                    </template>
                </p>
                <ul class="demo-no-access">
                    <li>📝 Posts – noch nicht verfügbar</li>
                    <li>🖼️ Bilder – noch nicht verfügbar</li>
                    <li>📅 Events – noch nicht verfügbar</li>
                </ul>
                <p class="demo-hint">
                    Sobald das Projekt aktiviert wird, erhältst du Zugriff entsprechend deiner Rolle.
                </p>
                <button @click="goToHome" class="btn btn--secondary">← Zurück zur Übersicht</button>
            </div>
        </div>

        <!-- Read-Only Demo View: For Members in DEMO status -->
        <div v-else-if="showReadOnlyDemo && projectData" class="project-dashboard__demo-readonly">
            <div class="demo-readonly-header">
                <h2>🎭 {{ projectName }}</h2>
                <p class="demo-status">Status: <strong>Demo</strong> – Vorschau-Modus</p>
                <p class="demo-hint">Du kannst die Inhalte ansehen. Bearbeiten ist erst nach Aktivierung möglich.</p>
            </div>
            <div class="demo-readonly-content">
                <!-- Link cards to /sites pages for viewing content -->
                <div class="demo-card" @click="goToSites('events')">
                    <span class="demo-card-icon">📅</span>
                    <span class="demo-card-label">Events ansehen</span>
                    <span class="demo-card-arrow">→</span>
                </div>
                <div class="demo-card" @click="goToSites('posts')">
                    <span class="demo-card-icon">📝</span>
                    <span class="demo-card-label">Posts ansehen</span>
                    <span class="demo-card-arrow">→</span>
                </div>
                <div class="demo-card" @click="goToSites('images')">
                    <span class="demo-card-icon">🖼️</span>
                    <span class="demo-card-label">Bilder ansehen</span>
                    <span class="demo-card-arrow">→</span>
                </div>
            </div>
            <button @click="goToHome" class="btn btn--secondary">← Zurück zur Übersicht</button>
        </div>

        <!-- Stepper Mode for Owner/Creator: status < 64 (NEW or DEMO) - 2 Column Layout -->
        <div v-else-if="canSeeStepper && projectData" class="project-dashboard__stepper">
            <!-- Left Column: Stepper Navigation -->
            <div class="stepper-nav">
                <!-- Overline Navigation (back + domaincode) -->
                <div class="stepper-overline">
                    <button class="overline-back" @click="goToHome" title="Zurück zur Startseite">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                        </svg>
                    </button>
                    <span class="overline-domaincode">{{ projectId }}</span>
                </div>

                <div class="stepper-header">
                    <h2>Schritt {{ currentStepIndex + 1 }}: {{ currentStepLabel }}</h2>
                </div>

                <div class="stepper-steps">
                    <div v-for="(step, index) in stepperSteps" :key="step.key" class="stepper-item"
                        :class="{ 'active': currentStepIndex === index, 'completed': currentStepIndex > index }"
                        @click="navigateToStep(step)">
                        <div class="step-circle">
                            <svg v-if="currentStepIndex > index" fill="currentColor" height="16" viewBox="0 0 256 256"
                                width="16">
                                <path
                                    d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                                </path>
                            </svg>
                            <span v-else>{{ index + 1 }}</span>
                        </div>
                        <div class="step-label">{{ step.label }}</div>
                        <div v-if="index < stepperSteps.length - 1" class="step-connector"></div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Step Content -->
            <div class="stepper-content">
                <!-- Events Step -->
                <ProjectStepEvents v-if="currentStepKey === 'agenda'" :project-id="projectId" :is-locked="false"
                    hide-actions @next="navigateToNextStep" @prev="navigateToPrevStep" />

                <!-- Posts Step -->
                <ProjectStepPosts v-else-if="currentStepKey === 'topics'" :project-id="projectId" :is-locked="false"
                    hide-actions @next="navigateToNextStep" @prev="navigateToPrevStep" />

                <!-- Images Step -->
                <ProjectStepImages v-else-if="currentStepKey === 'images'" :project-id="projectId" :is-locked="false"
                    hide-actions @next="navigateToNextStep" />

                <!-- Partners/Users Step -->
                <ProjectStepUsers v-else-if="currentStepKey === 'partners'" :project-id="projectId"
                    :project-status="projectStatus" :is-locked="false" @next="navigateToNextStep"
                    @prev="navigateToPrevStep" />

                <!-- Settings Step (Owner only) -->
                <ProjectSettingsPanel v-else-if="currentStepKey === 'settings'" :project-id="projectId"
                    :is-owner="isProjectOwner" :show-activation="true" />

                <!-- Default: Home/Overview -->
                <div v-else class="stepper-home">
                    <h3>{{ projectName }}</h3>
                    <p>Willkommen im Projekt-Setup. Klicke auf einen Schritt links, um zu beginnen.</p>
                </div>

                <!-- Step Navigation Buttons -->
                <div class="step-actions">
                    <button v-if="currentStepIndex > 0" class="btn btn--secondary" @click="navigateToPrevStep">
                        ← Zurück
                    </button>
                    <button v-if="currentStepIndex < stepperSteps.length - 1" class="btn btn--primary"
                        @click="navigateToNextStep">
                        Weiter →
                    </button>
                    <button v-else-if="isProjectOwner" class="btn btn--primary" @click="handleActivateProject">
                        ✓ Projekt aktivieren
                    </button>
                </div>
            </div><!-- /stepper-content -->
        </div><!-- /project-dashboard__stepper -->

        <!-- DashboardLayout: status >= 64 (DRAFT, CONFIRMED, RELEASED) -->
        <DashboardLayout v-else-if="projectData" :project-id="projectId" :project-name="projectName"
            :initial-section="currentSection" :alpha="true" :list-head-mode="listHeadMode" :show-overline="true"
            @section-change="handleSectionChange" @entity-select="handleEntitySelect"
            @open-external="handleOpenExternal" />

        <!-- Loading State -->
        <div v-else-if="isLoading" class="project-dashboard__loading">
            <div class="loading-spinner" />
            <p>Projekt wird geladen...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="project-dashboard__error">
            <h2>Projekt nicht gefunden</h2>
            <p>{{ error }}</p>
            <button @click="goToHome" class="btn btn--primary">Zur Übersicht</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DashboardLayout, ProjectSettingsPanel } from '@/components/dashboard'
import ProjectStepEvents from './ProjectStepEvents.vue'
import ProjectStepPosts from './ProjectStepPosts.vue'
import ProjectStepImages from './ProjectStepImages.vue'
import ProjectStepUsers from './ProjectStepUsers.vue'
import { useAuth } from '@/composables/useAuth'
import { PROJECT_STATUS, getLayoutType, CONFIGROLE, type ProjectRelation } from '@/composables/useProjectActivation'

// ============================================================
// TYPES
// ============================================================

interface StepConfig {
    key: string      // Route segment: 'agenda', 'topics', 'images', 'partners', 'settings'
    label: string    // Display label
    route: string    // Full route segment
    ownerOnly?: boolean
}

// ============================================================
// ROUTE & AUTH
// ============================================================

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

// ============================================================
// STATE
// ============================================================

const projectData = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const currentStep = ref(0)  // For stepper mode

// ============================================================
// COMPUTED - Route-based state
// ============================================================

/** Project ID from route params */
const projectId = computed(() => {
    return route.params.projectId as string
})

/** Current section from route path */
const currentSection = computed(() => {
    // Extract section from path: /projects/:id/agenda → 'agenda'
    const path = route.path
    const parts = path.split('/')
    const lastPart = parts[parts.length - 1] || ''

    // If lastPart is the projectId, we're at home
    if (lastPart === projectId.value) {
        return 'home'
    }

    // Map route segments to NavStop IDs
    const sectionMap: Record<string, string> = {
        'agenda': 'agenda',
        'topics': 'topics',
        'images': 'images',
        'partners': 'partners',
        'settings': 'settings'
    }

    return sectionMap[lastPart] ?? 'home'
})

/** Safe project name for display */
const projectName = computed(() => {
    if (!projectData.value) return undefined
    const heading = projectData.value.heading?.trim()
    const name = projectData.value.name?.trim()
    return heading || name || projectId.value
})

/** Project status (default to 0 if not set) */
const projectStatus = computed(() => {
    return projectData.value?.status ?? 0
})

/** Project type for stepper */
const projectType = computed(() => {
    return projectData.value?.type || 'project'
})

/** Determine layout: stepper for status < 64, dashboard for status >= 64 */
const showStepper = computed(() => {
    return getLayoutType(projectStatus.value) === 'stepper'
})

/** Check if current user is project owner */
const isProjectOwner = computed(() => {
    if (!projectData.value || !user.value) return false
    // Check by owner_sysmail or owner_id
    return projectData.value.owner_sysmail === user.value.sysmail ||
        projectData.value.owner_id === user.value.id
})

/** User's role from API response */
const userRole = computed((): ProjectRelation => {
    if (!projectData.value) return 'anonym'

    // Project owner check
    if (isProjectOwner.value) return 'p_owner'

    // Check _userRole from API
    const role = projectData.value._userRole
    if (role === 'owner') return 'p_owner'  // Should not happen, but handle it

    // Check for p_creator (configrole bit 16)
    const configrole = projectData.value._userConfigrole
    if (configrole && (configrole & CONFIGROLE.CREATOR)) return 'p_creator'

    // Map standard roles
    if (role === 'member') return 'member'
    if (role === 'participant') return 'participant'
    if (role === 'partner') return 'partner'

    return 'anonym'
})

/** Check if user is p_creator (configrole has CREATOR bit) */
const isPCreator = computed(() => userRole.value === 'p_creator')

/** Check if user is member */
const isMember = computed(() => userRole.value === 'member')

/** Check if user is participant */
const isParticipant = computed(() => userRole.value === 'participant')

/** Check if user is partner */
const isPartner = computed(() => userRole.value === 'partner')

/**
 * ACCESS CONTROL MATRIX:
 * 
 *            │ new    │ demo   │ draft  │ confirmed │ released │
 * ───────────┼────────┼────────┼────────┼───────────┼──────────┤
 * p_owner    │ CONFIG │ CONFIG │ CONFIG │ CONFIG    │ CONFIG   │
 * p_creator  │ CONFIG │ CONFIG │ CONFIG │ draft     │ read     │
 * member     │ -      │ read   │ WRITE  │ WRITE     │ WRITE    │
 * participant│ -      │ -      │ summary│ read      │ read     │
 * partner    │ -      │ -      │ -      │ read      │ read     │
 */

/** Determine access level for current user */
type AccessLevel = 'none' | 'read' | 'write' | 'config'

const accessLevel = computed((): AccessLevel => {
    const status = projectStatus.value
    const role = userRole.value

    // p_owner: CONFIG everywhere
    if (role === 'p_owner') return 'config'

    // p_creator: CONFIG in new/demo/draft, read in confirmed+/released
    if (role === 'p_creator') {
        if (status <= PROJECT_STATUS.DEMO || status === PROJECT_STATUS.DRAFT) return 'config'
        return 'read'
    }

    // member: none in new, read in demo, write in draft+
    if (role === 'member') {
        if (status <= PROJECT_STATUS.NEW) return 'none'
        if (status === PROJECT_STATUS.DEMO) return 'read'
        return 'write'
    }

    // participant: none in new/demo, read in draft+
    if (role === 'participant') {
        if (status < PROJECT_STATUS.DRAFT) return 'none'
        return 'read'
    }

    // partner: none until confirmed
    if (role === 'partner') {
        if (status < PROJECT_STATUS.CONFIRMED) return 'none'
        return 'read'
    }

    // anonym: none until released
    return status >= PROJECT_STATUS.RELEASED ? 'read' : 'none'
})

/** Can user see the stepper (config mode in NEW/DEMO)? */
const canSeeStepper = computed(() => {
    // Stepper is for status < 64 (NEW or DEMO)
    if (!showStepper.value) return false

    // Only p_owner and p_creator can see stepper
    return accessLevel.value === 'config'
})

/** Can user see content in DEMO (read-only mode)? */
const canSeeContentInDemo = computed(() => {
    if (projectStatus.value !== PROJECT_STATUS.DEMO) return false

    // member and p_creator can see content in DEMO (read-only)
    return userRole.value === 'member' || userRole.value === 'p_creator'
})

/** Show demo message: user has no access to stepper/content */
const showDemoMessage = computed(() => {
    // For status < 64, show message if user cannot see stepper AND cannot see content
    if (!showStepper.value) return false

    return accessLevel.value === 'none'
})

/** Show read-only content view for members in DEMO */
const showReadOnlyDemo = computed(() => {
    return projectStatus.value === PROJECT_STATUS.DEMO &&
        accessLevel.value === 'read' &&
        !isProjectOwner.value &&
        !isPCreator.value
})

/** ListHead mode based on viewport (could be made reactive) */
const listHeadMode = computed((): 'tabs' | 'hamburger' => {
    // For now, default to tabs. DashboardLayout can make this responsive
    return 'tabs'
})

// ============================================================
// STEPPER CONFIGURATION - Step order by project type
// ============================================================

/** 
 * Step configurations by project type:
 * - project (default): Events → Posts → Images → Partners → Settings
 * - regio: Partners → Events → Posts → Images → Settings  
 * - topic: Posts → Images → Partners → Settings (no Events)
 */
const stepperSteps = computed((): StepConfig[] => {
    const type = projectType.value
    const isOwner = isProjectOwner.value

    // Base steps for each type
    let steps: StepConfig[]

    if (type === 'topic') {
        // Topic: Posts first, no Events
        steps = [
            { key: 'topics', label: 'Posts', route: 'topics' },
            { key: 'images', label: 'Bilder', route: 'images' },
            { key: 'partners', label: 'Akteure', route: 'partners' },
        ]
    } else if (type === 'regio') {
        // Regio: Partners (Akteure) first
        steps = [
            { key: 'partners', label: 'Akteure', route: 'partners' },
            { key: 'agenda', label: 'Events', route: 'agenda' },
            { key: 'topics', label: 'Posts', route: 'topics' },
            { key: 'images', label: 'Bilder', route: 'images' },
        ]
    } else {
        // Default project: Events first
        steps = [
            { key: 'agenda', label: 'Events', route: 'agenda' },
            { key: 'topics', label: 'Posts', route: 'topics' },
            { key: 'images', label: 'Bilder', route: 'images' },
            { key: 'partners', label: 'Akteure', route: 'partners' },
        ]
    }

    // Add settings step for owners only
    if (isOwner) {
        steps.push({ key: 'settings', label: 'Einstellungen', route: 'settings', ownerOnly: true })
    }

    return steps
})

/** Current step key from route */
const currentStepKey = computed(() => {
    const path = route.path
    const parts = path.split('/')
    const lastPart = parts[parts.length - 1] || ''

    // If lastPart is projectId, default to first step
    if (lastPart === projectId.value) {
        return stepperSteps.value[0]?.key || 'agenda'
    }

    return lastPart
})

/** Current step index */
const currentStepIndex = computed(() => {
    const index = stepperSteps.value.findIndex((s: StepConfig) => s.key === currentStepKey.value)
    return index >= 0 ? index : 0
})

/** Current step label */
const currentStepLabel = computed(() => {
    return stepperSteps.value[currentStepIndex.value]?.label || ''
})

// ============================================================
// METHODS
// ============================================================

async function loadProject() {
    if (!projectId.value) {
        error.value = 'Keine Projekt-ID angegeben'
        isLoading.value = false
        return
    }

    try {
        isLoading.value = true
        error.value = null

        const response = await fetch(`/api/projects/${projectId.value}`)

        if (!response.ok) {
            if (response.status === 404) {
                error.value = `Projekt "${projectId.value}" wurde nicht gefunden.`
            } else if (response.status === 403) {
                error.value = 'Sie haben keinen Zugriff auf dieses Projekt.'
            } else {
                error.value = 'Fehler beim Laden des Projekts.'
            }
            return
        }

        projectData.value = await response.json()
    } catch (err) {
        console.error('Failed to load project:', err)
        error.value = 'Netzwerkfehler beim Laden des Projekts.'
    } finally {
        isLoading.value = false
    }
}

/** Handle project activation from stepper (status transition to DRAFT) */
async function handleActivateProject() {
    try {
        const response = await fetch(`/api/projects/${projectId.value}/activate`, {
            method: 'POST',
            credentials: 'include'
        })

        if (response.ok) {
            // Reload project to get new status
            await loadProject()
        } else {
            const err = await response.json()
            console.error('Failed to activate project:', err)
        }
    } catch (err) {
        console.error('Failed to activate project:', err)
    }
}

/** Navigate to a specific step */
function navigateToStep(step: StepConfig) {
    router.push(`/projects/${projectId.value}/${step.route}`)
}

/** Navigate to next step */
function navigateToNextStep() {
    const nextIndex = currentStepIndex.value + 1
    if (nextIndex < stepperSteps.value.length) {
        navigateToStep(stepperSteps.value[nextIndex])
    }
}

/** Navigate to previous step */
function navigateToPrevStep() {
    const prevIndex = currentStepIndex.value - 1
    if (prevIndex >= 0) {
        navigateToStep(stepperSteps.value[prevIndex])
    }
}

/** Handle section change from DashboardLayout - navigate via route */
function handleSectionChange(sectionId: string) {
    const baseRoute = `/projects/${projectId.value}`

    if (sectionId === 'home') {
        router.push(baseRoute)
    } else {
        router.push(`${baseRoute}/${sectionId}`)
    }
}

/** Handle entity selection */
function handleEntitySelect(entity: any) {
    console.log('[ProjectDashboard] Entity selected:', entity)
    // Could navigate to entity detail page or open panel
}

/** Handle external link */
function handleOpenExternal(url: string) {
    window.open(url, '_blank')
}

/** Navigate to home/overview */
function goToHome() {
    router.push('/home')
}

/** Navigate to sites page for viewing content */
function goToSites(section: 'events' | 'posts' | 'images') {
    const domaincode = projectData.value?.domaincode || projectId.value
    router.push(`/sites/${domaincode}/${section}`)
}

/** Status label for display */
const statusLabel = computed(() => {
    const status = projectStatus.value
    if (status <= PROJECT_STATUS.NEW) return 'Neu'
    if (status === PROJECT_STATUS.DEMO) return 'Demo'
    if (status === PROJECT_STATUS.DRAFT) return 'Entwurf'
    if (status === PROJECT_STATUS.CONFIRMED) return 'Bestätigt'
    if (status >= PROJECT_STATUS.RELEASED) return 'Veröffentlicht'
    return 'Unbekannt'
})

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(() => {
    loadProject()
})

// Reload project when route params change
watch(() => route.params.projectId, (newId: string | string[], oldId: string | string[]) => {
    if (newId !== oldId) {
        loadProject()
    }
})

// Route synchronization: ensure route matches current step in stepper mode
// When landing on base route /projects/:id, redirect to first step
watch([() => projectData.value, () => canSeeStepper.value], ([data, showStepper]: [any, boolean]) => {
    if (!data || !showStepper) return
    
    // Get current route segment
    const path = route.path
    const parts = path.split('/')
    const lastPart = parts[parts.length - 1] || ''
    
    // If at base route (lastPart === projectId), redirect to first step
    if (lastPart === projectId.value) {
        const firstStep = stepperSteps.value[0]
        if (firstStep) {
            // Use replace to avoid adding to history
            router.replace(`/projects/${projectId.value}/${firstStep.route}`)
        }
    }
}, { immediate: true })
</script>

<style scoped>
.project-dashboard {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-bg);
}

/* Loading State */
.project-dashboard__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
}

.loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary-base);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Error State */
.project-dashboard__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    text-align: center;
    padding: 2rem;
}

.project-dashboard__error h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-negative-base);
}

.project-dashboard__error p {
    margin: 0;
    color: var(--color-dimmed);
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--radius-medium);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.btn--primary {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
}

.btn--primary:hover {
    background: var(--color-primary-hover);
}

.btn--secondary {
    background: var(--color-muted-bg);
    color: var(--color-text);
}

.btn--secondary:hover {
    background: var(--color-border);
}

/* Demo Message for Non-Owners */
.project-dashboard__demo-message {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
}

.demo-message-box {
    max-width: 500px;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    padding: 2rem;
    text-align: center;
}

.demo-message-box h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
}

.demo-status {
    margin: 0 0 1rem;
    color: var(--color-warning-base);
    font-size: 0.875rem;
}

.demo-explanation {
    margin: 0 0 1.5rem;
    color: var(--color-dimmed);
}

.demo-no-access {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    text-align: left;
}

.demo-no-access li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-dimmed);
}

.demo-no-access li:last-child {
    border-bottom: none;
}

.demo-hint {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    color: var(--color-muted);
    font-style: italic;
}

/* Read-Only Demo View for Members */
.project-dashboard__demo-readonly {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    gap: 1.5rem;
}

.demo-readonly-header {
    text-align: center;
    max-width: 500px;
}

.demo-readonly-header h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
}

.demo-readonly-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 400px;
}

.demo-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    cursor: pointer;
    transition: all 0.15s ease;
}

.demo-card:hover {
    border-color: var(--color-primary-base);
    background: var(--color-muted-bg);
}

.demo-card-icon {
    font-size: 1.5rem;
}

.demo-card-label {
    flex: 1;
    font-weight: 500;
}

.demo-card-arrow {
    color: var(--color-dimmed);
    font-size: 1.25rem;
}

/* Stepper Layout - 2 Column Grid */
.project-dashboard__stepper {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100vh;
    overflow: hidden;
}

/* Stepper Overline Navigation - Inside stepper-nav */
.stepper-overline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.overline-back {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--color-dimmed);
    cursor: pointer;
    border-radius: var(--radius);
    transition: color 0.2s, background 0.2s;
}

.overline-back:hover {
    color: var(--color-text);
    background: var(--color-muted-bg);
}

.overline-domaincode {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.stepper-nav {
    background: var(--color-card-bg);
    border-right: 1px solid var(--color-border);
    padding: 1.5rem;
    overflow-y: auto;
}

.stepper-header h2 {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.stepper-steps {
    display: flex;
    flex-direction: column;
}

.stepper-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    cursor: pointer;
    position: relative;
}

.stepper-item:hover .step-label {
    color: var(--color-primary-base);
}

.step-circle {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-dimmed);
    background: var(--color-bg);
    flex-shrink: 0;
    z-index: 1;
}

.stepper-item.active .step-circle {
    border-color: var(--color-primary-base);
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
}

.stepper-item.completed .step-circle {
    border-color: var(--color-positive-base);
    background: var(--color-positive-base);
    color: white;
}

.step-label {
    font-size: 0.9375rem;
    font-weight: 500;
    padding-top: 0.25rem;
    color: var(--color-text);
}

.stepper-item.active .step-label {
    color: var(--color-primary-base);
    font-weight: 600;
}

.stepper-item.completed .step-label {
    color: var(--color-positive-base);
}

.step-connector {
    position: absolute;
    left: calc(1rem - 1px);
    top: 2.75rem;
    width: 2px;
    height: calc(100% - 1rem);
    background: var(--color-border);
}

.stepper-item.completed .step-connector {
    background: var(--color-positive-base);
}

/* Stepper Content */
.stepper-content {
    padding: 1.5rem 2rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.stepper-home {
    text-align: center;
    padding: 3rem 1rem;
}

.stepper-home h3 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
}

.stepper-home p {
    color: var(--color-dimmed);
}

.step-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
}

/* Responsive: Stack on mobile */
@media (max-width: 768px) {
    .project-dashboard__stepper {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }

    .stepper-nav {
        border-right: none;
        border-bottom: 1px solid var(--color-border);
        padding: 1rem;
    }

    .stepper-steps {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.5rem;
    }

    .stepper-item {
        flex-direction: column;
        align-items: center;
        padding: 0.5rem;
        min-width: 80px;
    }

    .step-connector {
        display: none;
    }

    .step-label {
        font-size: 0.75rem;
        text-align: center;
    }
}
</style>
