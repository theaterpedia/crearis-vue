<template>
    <div class="project-stepper">
        <!-- Header with HeadingParser -->
        <div class="stepper-header">
            <HeadingParser :content="headerMessage" as="h2" />
        </div>

        <!-- Stepper Steps -->
        <div class="stepper-steps">
            <div v-for="(stepItem, index) in steps" :key="index" class="stepper-item"
                :class="{ 'active': step === index, 'completed': step > index }" @click="goToStep(index)">
                <!-- Step Number Circle -->
                <div class="step-circle">
                    <svg v-if="step > index" fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                        </path>
                    </svg>
                    <span v-else>{{ index + 1 }}</span>
                </div>

                <!-- Step Label -->
                <div class="step-label">
                    {{ stepItem.label }}
                </div>

                <!-- Connector Line (not for last step) -->
                <div v-if="index < steps.length - 1" class="step-connector"></div>
            </div>
        </div>

        <!-- Step Description -->
        <div class="stepper-description">
            <p>{{ steps[step].description }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import { useI18n } from '@/composables/useI18n'

interface StepItem {
    label: string
    description: string
    key: string // Unique key for each step type
}

interface Props {
    step: number
    projectId: string
    type?: string // Project type: 'topic', 'regio', 'project', 'special'
}

interface Emits {
    (e: 'update:step', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { button, setLanguage } = useI18n()

// Language detection (admin → en, project users → de)
const userLang = ref('de')

// All possible steps with keys
const allSteps = ref<StepItem[]>([
    { key: 'events', label: 'Events', description: 'Loading...' },
    { key: 'posts', label: 'Posts', description: 'Loading...' },
    { key: 'images', label: 'Images', description: 'Loading...' },
    { key: 'users', label: 'Users', description: 'Loading...' },
    { key: 'theme', label: 'Theme', description: 'Loading...' },
    { key: 'pages', label: 'Pages', description: 'Loading...' }
])

// Computed steps based on project type
const steps = computed(() => {
    const projectType = props.type || 'project'

    if (projectType === 'topic') {
        // Topic: hide Events, start with Posts
        return allSteps.value.filter(step => step.key !== 'events')
    } else if (projectType === 'regio') {
        // Regio: Users → Pages → Posts → Images → Events (no Theme)
        return [
            allSteps.value.find(s => s.key === 'users')!,
            allSteps.value.find(s => s.key === 'pages')!,
            allSteps.value.find(s => s.key === 'posts')!,
            allSteps.value.find(s => s.key === 'images')!,
            allSteps.value.find(s => s.key === 'events')!
        ].filter(Boolean)
    } else {
        // Default: Events → Posts → Images → Users → Theme → Pages
        return allSteps.value
    }
})

// Header message computed
const headerMessage = computed(() => {
    const stepPrefixes = ['Schritt 1: ', 'Schritt 2: ', 'Schritt 3: ', 'Schritt 4: ', 'Schritt 5: ', 'Schritt 6: ']
    const currentIndex = props.step
    if (currentIndex >= 0 && currentIndex < steps.value.length) {
        return stepPrefixes[currentIndex] + steps.value[currentIndex].label
    }
    return ''
})

onMounted(async () => {
    // Detect language (simplified - could check user role or preferences)
    setLanguage(userLang.value as any)

    // Load i18n strings for step labels
    try {
        const stepNames = [
            await button('events-select'),
            await button('posts-create'),
            await button('users-regio-config'),
            await button('theme-layout-navigation'),
            await button('landing-heading-pages')
        ]

        const stepDescs = [
            'Wählen Sie die Veranstaltungen für Ihr Projekt',
            'Erstellen Sie Posts für Ihr Projekt',
            'Konfigurieren Sie Benutzer und Regionalprojekte',
            'Passen Sie Theme, Layout und Navigation an',
            'Gestalten Sie Landing-Page, Heading und Pages'
        ]

        allSteps.value = stepNames.map((name, i) => ({
            key: allSteps.value[i].key,
            label: name || allSteps.value[i].label,
            description: stepDescs[i]
        }))
    } catch (error) {
        console.error('Failed to load step i18n:', error)
    }
})

function goToStep(index: number) {
    // Allow navigation to any step
    emit('update:step', index)
}
</script>

<style scoped>
/* ===== STEPPER CONTAINER ===== */
.project-stepper {
    padding: 2rem;
}

/* ===== HEADER ===== */
.stepper-header {
    margin-bottom: 2rem;
}

.stepper-header :deep(h2) {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0;
}

/* ===== STEPS ===== */
.stepper-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 1.5rem;
}

.stepper-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.stepper-item:hover .step-circle {
    transform: scale(1.1);
}

/* Step Circle */
.step-circle {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    color: var(--color-dimmed);
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    z-index: 2;
}

.stepper-item.active .step-circle {
    background: var(--color-project);
    border-color: var(--color-project);
    color: white;
    box-shadow: 0 0 0 4px rgba(var(--color-project-rgb, 147, 51, 234), 0.2);
}

.stepper-item.completed .step-circle {
    background: var(--color-project);
    border-color: var(--color-project);
    color: white;
}

/* Step Label */
.step-label {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-dimmed);
    transition: color 0.2s ease;
}

.stepper-item.active .step-label {
    color: var(--color-project);
    font-weight: 600;
}

.stepper-item.completed .step-label {
    color: var(--color-text);
}

/* Connector Line */
.step-connector {
    position: absolute;
    left: 19px;
    /* Center of circle (40px / 2) - 1px for line width */
    top: 50px;
    /* Below the circle */
    width: 2px;
    height: calc(100% + 1rem);
    /* Extends to next step */
    background: var(--color-border);
    z-index: 1;
    transition: background 0.3s ease;
}

.stepper-item.completed .step-connector {
    background: var(--color-project);
}

/* ===== DESCRIPTION ===== */
.stepper-description {
    padding: 1rem;
    background: var(--color-bg-soft);
    border-radius: var(--radius-button);
    border-left: 3px solid var(--color-project);
}

.stepper-description p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text);
    line-height: 1.5;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .stepper-steps {
        flex-direction: column;
    }

    .step-connector {
        height: calc(100% + 0.5rem);
    }
}
</style>
