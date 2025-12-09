<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="activation-overlay" @click="handleOverlayClick">
                <div class="activation-panel" @click.stop>
                    <!-- Header -->
                    <div class="panel-header">
                        <h2 class="panel-title">
                            <span class="title-icon">🚀</span>
                            Project Activation
                        </h2>
                        <button class="close-btn" @click="$emit('close')" title="Schließen">
                            ×
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="panel-content">
                        <!-- Current State -->
                        <div class="current-state">
                            <span class="state-label">Current State:</span>
                            <span class="state-badge" :class="`state-${currentStatusName}`">
                                ● {{ currentStatusName.toUpperCase() }}
                            </span>
                        </div>

                        <div class="divider" />

                        <!-- Target State Selection -->
                        <div class="target-section">
                            <h3 class="section-title">Choose target state:</h3>
                            <div class="state-options">
                                <button v-for="target in availableTargets" :key="target.status" class="state-option"
                                    :class="{
                                        'selected': selectedTarget === target.status,
                                        'disabled': !target.isAllowed,
                                        'backward': target.isBackward,
                                        'forward': target.isForward && !target.isSkip,
                                        'skip': target.isSkip
                                    }" :disabled="!target.isAllowed" :title="target.reason || target.label"
                                    @click="selectTarget(target.status)">
                                    <span class="option-indicator">{{ selectedTarget === target.status ? '●' : '○'
                                        }}</span>
                                    <span class="option-label">{{ target.label }}</span>
                                    <span class="option-hint" v-if="target.isBackward">(zurück)</span>
                                    <span class="option-hint" v-else-if="target.isSkip">(überspr.)</span>
                                    <span class="option-hint" v-else-if="target.isForward">(weiter)</span>
                                </button>
                            </div>
                        </div>

                        <div class="divider" />

                        <!-- Readiness Checklist -->
                        <div class="checklist-section">
                            <h3 class="section-title">Readiness Checklist:</h3>
                            <ul class="checklist">
                                <li v-for="result in ruleResults" :key="result.rule.id" class="checklist-item"
                                    :class="{ 'passed': result.passed, 'failed': !result.passed && result.applicable, 'na': !result.applicable }">
                                    <span class="check-icon">
                                        {{ result.passed ? '✅' : (result.applicable ? '❌' : '➖') }}
                                    </span>
                                    <span class="check-label">{{ result.rule.labelDe }}</span>
                                </li>
                                <!-- Skip rule -->
                                <li class="checklist-item skip-rule"
                                    :class="{ 'passed': skipRuleResult.passed, 'failed': !skipRuleResult.passed }">
                                    <span class="check-icon">
                                        {{ skipRuleResult.passed ? '✅' : '⚠️' }}
                                    </span>
                                    <span class="check-label">{{ skipRuleResult.rule.labelDe }}</span>
                                </li>
                            </ul>
                        </div>

                        <div class="divider" />

                        <!-- Additional Options (for p_owner) -->
                        <div class="options-section" v-if="isPOwner">
                            <h3 class="section-title">Weitere Optionen:</h3>
                            <div class="option-buttons">
                                <button v-if="canGoBack" class="option-btn backward" @click="selectBackwardTarget">
                                    ← {{ backwardTargetLabel }}
                                </button>
                                <button v-if="canTrash" class="option-btn trash" @click="selectTrash">
                                    🗑 Trash
                                </button>
                            </div>
                            <p class="option-note" v-if="canTrash">← only for p_owner</p>
                        </div>

                        <div class="divider" v-if="isPOwner" />

                        <!-- Transition Summary (shown when target selected) -->
                        <div v-if="transitionSummaryData" class="transition-section">
                            <TransitionSummary :summary="transitionSummaryData" :compact="false"
                                :initially-expanded="true" />
                        </div>

                        <div class="divider" v-if="transitionSummaryData" />
                    </div>

                    <!-- Footer -->
                    <div class="panel-footer">
                        <div class="error-message" v-if="error">
                            {{ error }}
                        </div>
                        <button class="activate-btn" :disabled="!canActivate || isLoading" @click="handleActivate">
                            <span v-if="isLoading">Processing...</span>
                            <span v-else>Activate to {{ selectedTargetLabel }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TransitionSummary from '@/components/workflow/TransitionSummary.vue'
import {
    useProjectActivation,
    PROJECT_STATUS,
    STATUS_TO_NAME,
    type ProjectData,
    type EntityCounts,
    type MembershipData
} from '@/composables/useProjectActivation'
import { calculateTransitionSummary } from '@/composables/useTransitionSummary'

// Target info type
interface TargetInfo {
    status: number
    name: string
    label: string
    isAllowed: boolean
    reason?: string
    isForward: boolean
    isBackward: boolean
    isSkip: boolean
}

const props = defineProps<{
    isOpen: boolean
    project: ProjectData | null
    entityCounts: EntityCounts
    membership?: MembershipData | null
}>()

const emit = defineEmits<{
    close: []
    activated: [newStatus: number]
}>()

// Reactive refs for composable
const projectRef = computed(() => props.project)
const entityCountsRef = computed(() => props.entityCounts)
const membershipRef = computed(() => props.membership ?? null)

// Use activation composable
const {
    isLoading,
    error,
    isPOwner,
    isPCreator,
    currentStatus,
    currentStatusName,
    ruleResults,
    skipRuleResult,
    canSkipToConfirmed,
    allCriteriaMet,
    allowedTargets,
    canTrash,
    validateTransition,
    transitionTo,
    getTargetInfo
} = useProjectActivation(projectRef, entityCountsRef, membershipRef)

// Selected target state
const selectedTarget = ref<number | null>(null)

// Transition summary computed from current → target
const transitionSummaryData = computed(() => {
    if (selectedTarget.value === null) return null
    return calculateTransitionSummary(currentStatus.value, selectedTarget.value)
})

// Available targets with info
const availableTargets = computed<TargetInfo[]>(() => {
    return allowedTargets.value
        .filter((status: number) => status !== PROJECT_STATUS.TRASH) // Trash handled separately
        .map((status: number) => getTargetInfo(status))
})

// Selected target label
const selectedTargetLabel = computed(() => {
    if (!selectedTarget.value) return 'Select Target'
    return STATUS_TO_NAME[selectedTarget.value] ?? 'Unknown'
})

// Can go back?
const canGoBack = computed(() => {
    return availableTargets.value.some((t: TargetInfo) => t.isBackward)
})

// Backward target label
const backwardTargetLabel = computed(() => {
    const backward = availableTargets.value.find((t: TargetInfo) => t.isBackward)
    return backward?.label ?? 'Back'
})

// Can activate?
const canActivate = computed(() => {
    if (!selectedTarget.value) return false
    const validation = validateTransition(selectedTarget.value)
    return validation.valid
})

// Select target
function selectTarget(status: number) {
    selectedTarget.value = status
}

// Select backward target
function selectBackwardTarget() {
    const backward = availableTargets.value.find((t: TargetInfo) => t.isBackward)
    if (backward) {
        selectedTarget.value = backward.status
    }
}

// Select trash
function selectTrash() {
    selectedTarget.value = PROJECT_STATUS.TRASH
}

// Handle overlay click
function handleOverlayClick() {
    emit('close')
}

// Handle activate
async function handleActivate() {
    if (!selectedTarget.value) return

    const success = await transitionTo(selectedTarget.value)
    if (success) {
        emit('activated', selectedTarget.value)
        emit('close')
    }
}

// Reset selection when panel opens
watch(() => props.isOpen, (isOpen: boolean) => {
    if (isOpen) {
        selectedTarget.value = null
        // Auto-select the most logical forward target
        const forward = availableTargets.value.find((t: TargetInfo) => t.isForward && !t.isSkip)
        if (forward) {
            selectedTarget.value = forward.status
        }
    }
})
</script>

<style scoped>
/* Overlay - 60% width × 70% height */
.activation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: oklch(0% 0 0 / 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

/* Panel */
.activation-panel {
    background: var(--color-card-bg);
    border-radius: var(--radius-button, 8px);
    box-shadow: 0 20px 60px oklch(0% 0 0 / 0.3);
    width: 60%;
    max-width: 800px;
    height: 70%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Header */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.panel-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.title-icon {
    font-size: 1.3em;
}

.close-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--color-contrast);
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-negative-base);
    color: var(--color-negative-base);
}

/* Content */
.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* Current State */
.current-state {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.state-label {
    font-weight: 500;
    color: var(--color-muted);
}

.state-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
}

.state-badge.state-new {
    background: var(--color-info-bg);
    color: var(--color-info-base);
}

.state-badge.state-demo {
    background: var(--color-warning-bg);
    color: var(--color-warning-base);
}

.state-badge.state-draft {
    background: var(--color-info-bg);
    color: var(--color-info-base);
}

.state-badge.state-confirmed {
    background: var(--color-positive-bg);
    color: var(--color-positive-base);
}

.state-badge.state-released {
    background: var(--color-positive-bg);
    color: var(--color-positive-base);
}

.state-badge.state-archived {
    background: var(--color-muted-bg);
    color: var(--color-muted);
}

.state-badge.state-trash {
    background: var(--color-negative-bg);
    color: var(--color-negative-base);
}

/* Divider */
.divider {
    height: 1px;
    background: var(--color-border);
    margin: 1.5rem 0;
}

/* Section Title */
.section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 1rem 0;
}

/* Target State Options */
.state-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.state-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
}

.state-option:hover:not(.disabled) {
    border-color: var(--color-primary-base);
    background: var(--color-primary-bg);
}

.state-option.selected {
    border-color: var(--color-primary-base);
    background: var(--color-primary-bg);
}

.state-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.state-option.backward .option-label {
    color: var(--color-warning-base);
}

.state-option.forward .option-label {
    color: var(--color-positive-base);
}

.state-option.skip .option-label {
    color: var(--color-info-base);
}

.option-indicator {
    font-weight: bold;
    color: var(--color-primary-base);
}

.option-label {
    font-weight: 500;
}

.option-hint {
    font-size: 0.75rem;
    color: var(--color-muted);
}

/* Checklist */
.checklist {
    list-style: none;
    margin: 0;
    padding: 0;
}

.checklist-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

.checklist-item.passed .check-label {
    color: var(--color-positive-base);
}

.checklist-item.failed .check-label {
    color: var(--color-negative-base);
    font-weight: 500;
}

.checklist-item.na .check-label {
    color: var(--color-muted);
}

.checklist-item.skip-rule {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--color-border);
}

.check-icon {
    width: 1.5rem;
    text-align: center;
}

.check-label {
    flex: 1;
}

/* Options Section */
.option-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.option-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.option-btn.backward:hover {
    border-color: var(--color-warning-base);
    background: var(--color-warning-bg);
}

.option-btn.trash:hover {
    border-color: var(--color-negative-base);
    background: var(--color-negative-bg);
}

.option-note {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: 0.5rem;
}

/* Transition Section */
.transition-section {
    padding: 0.5rem 0;
}

/* Footer */
.panel-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.error-message {
    color: var(--color-negative-base);
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    background: var(--color-negative-bg);
    border-radius: 4px;
}

.activate-btn {
    padding: 1rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: var(--color-primary-base);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 250px;
}

.activate-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
}

.activate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .activation-panel,
.modal-leave-active .activation-panel {
    transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .activation-panel,
.modal-leave-to .activation-panel {
    transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
    .activation-panel {
        width: 95%;
        height: 90%;
        max-height: 95vh;
    }

    .state-options {
        flex-direction: column;
    }

    .state-option {
        width: 100%;
    }
}
</style>
