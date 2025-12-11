<template>
    <div class="project-dashboard">
        <!-- DashboardLayout with ListHead for navigation -->
        <DashboardLayout v-if="projectData" :project-id="projectId" :project-name="projectName"
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
import { DashboardLayout } from '@/components/dashboard'
import { useAuth } from '@/composables/useAuth'

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

/** ListHead mode based on viewport (could be made reactive) */
const listHeadMode = computed((): 'tabs' | 'hamburger' => {
    // For now, default to tabs. DashboardLayout can make this responsive
    return 'tabs'
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
</style>
