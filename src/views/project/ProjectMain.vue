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
            </template>
        </Navbar>

        <!-- Main Content: 2-Column Layout -->
        <div class="main-content">
            <!-- Left Column: Stepper Navigation & Content (40%) -->
            <div class="left-column">
                <ProjectStepper v-model:step="currentStep" :header-message="stepHeaderMessage" />

                <!-- Step-specific left column content -->
                <div class="step-content">
                    <div v-if="currentStep === 0" class="step-description">
                        <h3>Veranstaltungen</h3>
                        <p>Wählen Sie die Veranstaltungen aus, die in Ihrem Projekt angezeigt werden sollen.</p>
                    </div>
                    <div v-else-if="currentStep === 1" class="step-description">
                        <h3>Daten</h3>
                        <p>Konfigurieren Sie die Datenquellen und Inhalte für Ihr Projekt.</p>
                    </div>
                    <div v-else-if="currentStep === 2" class="step-description">
                        <h3>Theme</h3>
                        <p>Passen Sie das Erscheinungsbild Ihres Projekts an.</p>
                    </div>
                    <div v-else-if="currentStep === 3" class="step-description">
                        <h3>Ansichten</h3>
                        <p>Definieren Sie die verschiedenen Ansichten Ihres Projekts.</p>
                    </div>
                    <div v-else-if="currentStep === 4" class="step-description">
                        <h3>Landing</h3>
                        <p>Gestalten Sie die Startseite Ihres Projekts.</p>
                    </div>
                </div>
            </div>

            <!-- Right Column: Step Components (60%) -->
            <div class="right-column">
                <div class="right-column-content">
                    <ProjectStepEvents v-if="currentStep === 0" @next="nextStep" />
                    <ProjectStepData v-else-if="currentStep === 1" @next="nextStep" @prev="prevStep" />
                    <ProjectStepTheme v-else-if="currentStep === 2" @next="nextStep" @prev="prevStep" />
                    <ProjectStepViews v-else-if="currentStep === 3" @next="nextStep" @prev="prevStep" />
                    <ProjectStepLanding v-else-if="currentStep === 4" @prev="prevStep" @complete="completeProject" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/Navbar.vue'
import ProjectStepper from './ProjectStepper.vue'
import ProjectStepEvents from './ProjectStepEvents.vue'
import ProjectStepData from './ProjectStepData.vue'
import ProjectStepTheme from './ProjectStepTheme.vue'
import ProjectStepViews from './ProjectStepViews.vue'
import ProjectStepLanding from './ProjectStepLanding.vue'

const router = useRouter()
const { user, requireAuth, logout } = useAuth()

// Current step (0-4)
const currentStep = ref(0)

// Step header messages
const stepHeaderMessage = computed(() => {
    const messages = [
        'Schritt 1: Veranstaltungen auswählen',
        'Schritt 2: Daten konfigurieren',
        'Schritt 3: Theme anpassen',
        'Schritt 4: Ansichten definieren',
        'Schritt 5: Landing-Page gestalten'
    ]
    return messages[currentStep.value] || ''
})

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

function goBack() {
    router.push('/')
}

function completeProject() {
    console.log('Project completed!')
    // TODO: Save project and navigate
    router.push('/')
}

// Auth check on mount
onMounted(async () => {
    await requireAuth()
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

/* ===== MAIN CONTENT ===== */
.main-content {
    display: flex;
    flex: 1;
    gap: 1rem;
    padding: 2rem;
    max-width: 100%;
    overflow: hidden;
}

/* Left Column - Stepper & Description */
.left-column {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
}

.step-content {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 2rem;
}

.step-description h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 1rem 0;
}

.step-description p {
    font-size: 1rem;
    color: var(--color-text);
    line-height: 1.6;
    margin: 0;
}

/* Right Column - Step Components */
.right-column {
    flex: 0 0 60%;
    overflow-y: auto;
    padding-left: 1rem;
    border-left: var(--border) solid var(--color-border);
}

.right-column-content {
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

    .left-column,
    .right-column {
        flex: 1;
        border: none;
        padding: 0;
    }
}
</style>
