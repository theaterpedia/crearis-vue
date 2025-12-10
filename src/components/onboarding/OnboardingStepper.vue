<!--
  OnboardingStepper.vue - User onboarding progress tracker
  
  Displays the 4-5 onboarding phases and tracks user progress.
  Uses same stepper visual pattern as ProjectStepper.
-->
<template>
    <div class="onboarding-stepper">
        <!-- Header -->
        <div class="stepper-header">
            <h2>{{ headerMessage }}</h2>
            <p class="stepper-subtitle">{{ currentStep?.description || 'Willkommen!' }}</p>
        </div>

        <!-- Steps -->
        <div class="stepper-steps">
            <div v-for="(step, index) in visibleSteps" :key="step.id" class="stepper-item"
                :class="{ 
                    'active': isCurrentStep(step), 
                    'completed': isStepCompleted(step),
                    'upcoming': isStepUpcoming(step)
                }" @click="goToStep(step)">
                <!-- Step Circle -->
                <div class="step-circle">
                    <svg v-if="isStepCompleted(step)" fill="currentColor" height="16" viewBox="0 0 256 256" width="16">
                        <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                    </svg>
                    <span v-else>{{ index + 1 }}</span>
                </div>

                <!-- Step Label -->
                <div class="step-label">
                    {{ step.label }}
                </div>

                <!-- Connector Line -->
                <div v-if="index < visibleSteps.length - 1" class="step-connector"></div>
            </div>
        </div>

        <!-- Current Step Content -->
        <div class="step-content">
            <!-- Requirements Checklist -->
            <div v-if="currentStep" class="requirements-list">
                <h3>Was ist zu tun:</h3>
                <ul>
                    <li v-for="req in currentStep.requirements" :key="req.id"
                        :class="{ completed: req.check(user) }">
                        <span class="req-icon">
                            <svg v-if="req.check(user)" fill="currentColor" height="16" viewBox="0 0 256 256" width="16">
                                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                            </svg>
                            <span v-else class="req-bullet">○</span>
                        </span>
                        <span class="req-label">{{ req.label }}</span>
                        <button v-if="!req.check(user) && req.action" class="req-action" @click="startRequirement(req)">
                            Starten →
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Action Buttons -->
            <div v-if="canAdvance" class="step-actions">
                <button class="btn-primary" @click="advanceStep">
                    Weiter
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16">
                        <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
    ONBOARDING_STEPS, 
    getCurrentOnboardingStep, 
    canAdvanceToNextStep,
    type OnboardingStep,
    type OnboardingRequirement 
} from '@/utils/onboarding-config'
import { STATUS } from '@/utils/status-constants'

interface Props {
    user: any
    /** Only show steps relevant to user's role */
    filterByRole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    filterByRole: false
})

const emit = defineEmits<{
    'advance': [fromStatus: number, toStatus: number]
    'start-requirement': [requirement: OnboardingRequirement]
}>()

// Current onboarding step
const currentStep = computed(() => getCurrentOnboardingStep(props.user))

// Visible steps (filtered if needed)
const visibleSteps = computed(() => {
    if (!props.filterByRole) return ONBOARDING_STEPS.filter(s => !s.optional)
    
    // Filter based on user roles
    const hasProjectRole = props.user?.hasProjectRole
    return ONBOARDING_STEPS.filter(step => {
        if (step.id === 'publish' && !hasProjectRole) return false
        return true
    })
})

// Header message
const headerMessage = computed(() => {
    if (!currentStep.value) return 'Onboarding abgeschlossen!'
    return `Schritt: ${currentStep.value.label}`
})

// Can advance to next step
const canAdvance = computed(() => canAdvanceToNextStep(props.user))

// Check helpers
function isCurrentStep(step: OnboardingStep): boolean {
    return currentStep.value?.id === step.id
}

function isStepCompleted(step: OnboardingStep): boolean {
    if (!props.user) return false
    return props.user.status > step.toStatus
}

function isStepUpcoming(step: OnboardingStep): boolean {
    if (!props.user) return step.fromStatus > STATUS.NEW
    return step.fromStatus > props.user.status
}

function goToStep(step: OnboardingStep) {
    // Only allow navigating to completed steps
    if (!isStepCompleted(step)) return
    // Could emit event or navigate
}

function advanceStep() {
    if (!currentStep.value) return
    emit('advance', currentStep.value.fromStatus, currentStep.value.toStatus)
}

function startRequirement(req: OnboardingRequirement) {
    emit('start-requirement', req)
}
</script>

<style scoped>
.onboarding-stepper {
    padding: var(--spacing-lg);
    max-width: 600px;
    margin: 0 auto;
}

.stepper-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.stepper-header h2 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: 1.5rem;
}

.stepper-subtitle {
    color: var(--color-muted);
    margin: 0;
}

/* Steps Navigation */
.stepper-steps {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-xl);
}

.stepper-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    cursor: pointer;
    padding: 0 var(--spacing-md);
}

.stepper-item.upcoming {
    opacity: 0.5;
    cursor: not-allowed;
}

.step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-muted-bg);
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    transition: all 0.2s;
}

.stepper-item.active .step-circle {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: white;
}

.stepper-item.completed .step-circle {
    background: var(--color-positive-bg);
    border-color: var(--color-positive-bg);
    color: white;
}

.step-label {
    margin-top: var(--spacing-xs);
    font-size: 0.875rem;
    text-align: center;
}

.step-connector {
    position: absolute;
    top: 20px;
    left: calc(50% + 20px);
    width: calc(100% - 40px);
    height: 2px;
    background: var(--color-border);
}

.stepper-item.completed .step-connector {
    background: var(--color-positive-bg);
}

/* Requirements List */
.requirements-list {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.requirements-list h3 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 1rem;
}

.requirements-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.requirements-list li {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border);
}

.requirements-list li:last-child {
    border-bottom: none;
}

.requirements-list li.completed {
    color: var(--color-positive-bg);
}

.req-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.req-bullet {
    font-size: 1.25rem;
    line-height: 1;
}

.req-label {
    flex: 1;
}

.req-action {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-primary-bg);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s;
}

.req-action:hover {
    background: var(--color-primary-hover);
}

/* Action Buttons */
.step-actions {
    display: flex;
    justify-content: center;
}

.btn-primary {
    display: inline-flex;
    align-items: center;
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
}

.btn-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
}
</style>
