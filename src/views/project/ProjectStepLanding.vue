<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Landing-Page gestalten</h3>
            <p class="step-subtitle">Konfiguriere Aside, Footer und Seitenoptionen</p>
        </div>

        <div class="step-content">
            <!-- Mode Toggle -->
            <div class="mode-toggle" v-if="hasLandingPage">
                <button class="toggle-btn" :class="{ active: configMode === 'landing' }"
                    @click="configMode = 'landing'">
                    Landing-Page
                </button>
                <button class="toggle-btn" :class="{ active: configMode === 'project' }"
                    @click="configMode = 'project'">
                    Projekt-Defaults
                </button>
            </div>

            <!-- Warning for project mode -->
            <div v-if="configMode === 'project'" class="warning-banner">
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z">
                    </path>
                </svg>
                <span>Achtung: Änderungen wirken sich auf alle Posts und Events aus!</span>
            </div>

            <!-- Create Landing Page Button (if not exists) -->
            <div v-if="!hasLandingPage && !isLoading" class="create-landing">
                <p>Für dieses Projekt existiert noch keine Landing-Page-Konfiguration.</p>
                <button class="create-btn" @click="createLandingPage" :disabled="isCreating">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                        </path>
                    </svg>
                    {{ isCreating ? 'Erstelle...' : 'Landing-Page erstellen' }}
                </button>
            </div>

            <!-- Page Config Controller -->
            <div v-if="(hasLandingPage || configMode === 'project') && projectId" class="config-wrapper">
                <PageConfigController :key="`${configMode}-${projectId}`" :project="projectId"
                    :type="configMode === 'landing' ? 'landing' : undefined"
                    :mode="configMode === 'landing' ? 'pages' : 'project'" />
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
                <span>Lade Konfiguration...</span>
            </div>
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
            <button class="action-btn success-btn" @click="handleComplete">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                    </path>
                </svg>
                Abschließen
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageConfigController from '@/components/PageConfigController.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

interface Emits {
    (e: 'prev'): void
    (e: 'complete'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})
const emit = defineEmits<Emits>()

// State
const configMode = ref<'landing' | 'project'>('landing')
const hasLandingPage = ref(false)
const isLoading = ref(true)
const isCreating = ref(false)

// Check if landing page exists
async function checkLandingPage() {
    isLoading.value = true
    try {
        const response = await fetch(`/api/pages/by-type?project_id=${props.projectId}&page_type=landing`)
        hasLandingPage.value = response.ok
        if (!hasLandingPage.value) {
            // Default to project mode if no landing page
            configMode.value = 'project'
        }
    } catch (e) {
        console.error('Error checking landing page:', e)
        hasLandingPage.value = false
        configMode.value = 'project'
    } finally {
        isLoading.value = false
    }
}

// Create landing page entry
async function createLandingPage() {
    isCreating.value = true
    try {
        const response = await fetch('/api/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: props.projectId,
                page_type: 'landing'
            })
        })

        if (response.ok) {
            hasLandingPage.value = true
            configMode.value = 'landing'
        } else {
            const data = await response.json()
            console.error('Failed to create landing page:', data.message)
        }
    } catch (e) {
        console.error('Error creating landing page:', e)
    } finally {
        isCreating.value = false
    }
}

function handlePrev() {
    emit('prev')
}

function handleComplete() {
    emit('complete')
}

onMounted(() => {
    checkLandingPage()
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

.step-content {
    flex: 1;
    min-height: 300px;
}

.mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.toggle-btn {
    padding: 0.5rem 1rem;
    border: 2px solid var(--color-border);
    background: var(--color-card-bg);
    border-radius: var(--radius-button);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.toggle-btn:hover {
    border-color: var(--color-project);
}

.toggle-btn.active {
    background: var(--color-project);
    color: white;
    border-color: var(--color-project);
}

.warning-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    border-radius: var(--radius-card);
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

.warning-banner svg {
    flex-shrink: 0;
}

.create-landing {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 2rem;
    background: var(--color-bg-soft);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-card);
    text-align: center;
}

.create-landing p {
    color: var(--color-dimmed);
    margin: 0;
}

.create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-project);
    color: white;
    border: none;
    border-radius: var(--radius-button);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.create-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.create-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.config-wrapper {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    overflow: hidden;
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--color-dimmed);
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

.success-btn {
    background: var(--color-project);
    color: white;
}

.success-btn:hover {
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
