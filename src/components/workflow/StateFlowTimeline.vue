<template>
    <div class="state-flow-timeline" :class="{ compact, interactive }">
        <!-- Timeline track -->
        <div class="timeline-track">
            <!-- State nodes -->
            <div v-for="(state, index) in displayStates" :key="state.value" class="state-node-wrapper">
                <!-- Connector line (before node) -->
                <div v-if="index > 0" class="connector" :class="{
                    'passed': isStatePassed(state.value),
                    'active': isStateActive(state.value),
                    'future': isStateFuture(state.value),
                }" />

                <!-- State node -->
                <button class="state-node" :class="{
                    'current': state.value === currentStatus,
                    'passed': isStatePassed(state.value),
                    'future': isStateFuture(state.value),
                    'allowed': isStateAllowed(state.value),
                    'selected': state.value === selectedTarget,
                    'layout-stepper': state.layout === 'stepper',
                    'layout-dashboard': state.layout === 'dashboard',
                }" :disabled="!interactive || !isStateAllowed(state.value)" :title="getStateTooltip(state)"
                    @click="handleStateClick(state.value)">
                    <!-- Status indicator -->
                    <span class="node-indicator">
                        <span v-if="isStatePassed(state.value)" class="icon-check">✓</span>
                        <span v-else-if="state.value === currentStatus" class="icon-current">●</span>
                        <span v-else-if="state.value === selectedTarget" class="icon-selected">◉</span>
                        <span v-else class="icon-future">○</span>
                    </span>

                    <!-- Label (compact or full) -->
                    <span class="node-label" v-if="!compact">
                        {{ state.label }}
                    </span>
                    <span class="node-label-short" v-else>
                        {{ state.label.slice(0, 3) }}
                    </span>

                    <!-- Layout indicator badge -->
                    <span v-if="showLayoutBadge && state.value === currentStatus" class="layout-badge"
                        :class="state.layout">
                        {{ state.layout === 'stepper' ? '📋' : '📊' }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Skip indicator (when skipping states) -->
        <Transition name="fade">
            <div v-if="isSkipTransition && selectedTarget" class="skip-indicator">
                <span class="skip-icon">⚡</span>
                <span class="skip-text">Überspringen</span>
            </div>
        </Transition>

        <!-- Layout change warning -->
        <Transition name="fade">
            <div v-if="willChangeLayout && selectedTarget" class="layout-change-warning">
                <span class="warning-icon">🔄</span>
                <span class="warning-text">
                    Layout wechselt: {{ currentLayoutLabel }} → {{ targetLayoutLabel }}
                </span>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PROJECT_STATUS } from '@/composables/useProjectActivation'
import { useTransitionSummary, type StateInfo } from '@/composables/useTransitionSummary'

const props = withDefaults(defineProps<{
    currentStatus: number
    allowedTargets: number[]
    selectedTarget?: number | null
    compact?: boolean
    interactive?: boolean
    showLayoutBadge?: boolean
}>(), {
    compact: false,
    interactive: true,
    showLayoutBadge: true,
})

const emit = defineEmits<{
    select: [status: number]
}>()

// Use transition summary for state data
const currentStatusRef = computed(() => props.currentStatus)
const selectedTargetRef = computed(() => props.selectedTarget ?? null)

const {
    allStates,
    summary,
} = useTransitionSummary(currentStatusRef, selectedTargetRef)

// Displayable states (exclude trash from timeline)
const displayStates = computed(() =>
    allStates.value.filter(s => s.value !== PROJECT_STATUS.TRASH)
)

// State position helpers
function getStateIndex(statusValue: number): number {
    return displayStates.value.findIndex(s => s.value === statusValue)
}

const currentIndex = computed(() => getStateIndex(props.currentStatus))

function isStatePassed(statusValue: number): boolean {
    const idx = getStateIndex(statusValue)
    return idx >= 0 && idx < currentIndex.value
}

function isStateActive(statusValue: number): boolean {
    return statusValue === props.currentStatus
}

function isStateFuture(statusValue: number): boolean {
    const idx = getStateIndex(statusValue)
    return idx > currentIndex.value
}

function isStateAllowed(statusValue: number): boolean {
    return props.allowedTargets.includes(statusValue)
}

// Transition info
const isSkipTransition = computed(() => summary.value?.isSkip ?? false)
const willChangeLayout = computed(() => summary.value?.layoutChange ?? false)

const currentLayoutLabel = computed(() => {
    const state = displayStates.value.find(s => s.value === props.currentStatus)
    return state?.layout === 'stepper' ? 'Stepper' : 'Dashboard'
})

const targetLayoutLabel = computed(() => {
    if (!props.selectedTarget) return ''
    const state = displayStates.value.find(s => s.value === props.selectedTarget)
    return state?.layout === 'stepper' ? 'Stepper' : 'Dashboard'
})

// Tooltip
function getStateTooltip(state: StateInfo): string {
    const parts: string[] = [state.label]

    if (state.value === props.currentStatus) {
        parts.push('(aktuell)')
    } else if (isStatePassed(state.value)) {
        parts.push('(abgeschlossen)')
    } else if (isStateAllowed(state.value)) {
        parts.push('(verfügbar)')
    } else {
        parts.push('(nicht verfügbar)')
    }

    parts.push(`\nLayout: ${state.layout === 'stepper' ? 'Stepper' : 'Dashboard'}`)

    return parts.join(' ')
}

// Click handler
function handleStateClick(statusValue: number) {
    if (props.interactive && isStateAllowed(statusValue)) {
        emit('select', statusValue)
    }
}
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, theme vars, monospace font */

.state-flow-timeline {
    --node-size: 2.5rem;
    --node-size-compact: 1.75rem;
    --connector-width: 3rem;
    --connector-width-compact: 1.5rem;

    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-family: var(--font);
}

.state-flow-timeline.compact {
    --node-size: var(--node-size-compact);
    --connector-width: var(--connector-width-compact);
}

/* Timeline Track */
.timeline-track {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0;
}

.state-node-wrapper {
    display: flex;
    align-items: center;
}

/* Connector Lines */
.connector {
    width: var(--connector-width);
    height: 2px;
    background: var(--color-border, oklch(75% 0 0));
    transition: var(--transition, all 150ms ease);
}

.connector.passed {
    background: oklch(65% 0.15 145);
    /* green */
}

.connector.active {
    background: oklch(70% 0.15 250);
    /* blue */
}

/* State Nodes */
.state-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: var(--node-size);
    height: var(--node-size);
    border-radius: 50%;
    border: var(--border-button, 2px) solid var(--color-border, oklch(75% 0 0));
    background: var(--color-muted-bg, oklch(95% 0 0));
    cursor: default;
    transition: var(--transition, all 150ms ease);
    position: relative;
    font-family: var(--font);
    font-size: 0.75rem;
}

.state-node:not(:disabled) {
    cursor: pointer;
}

.state-node:not(:disabled):hover {
    transform: scale(1.1);
    box-shadow: 0 0 0 3px oklch(70% 0.15 250 / 0.3);
}

/* Node States */
.state-node.passed {
    background: oklch(85% 0.12 145);
    /* light green */
    border-color: oklch(55% 0.15 145);
    /* dark green */
    color: oklch(30% 0.10 145);
}

.state-node.current {
    background: oklch(85% 0.12 250);
    /* light blue */
    border-color: oklch(55% 0.15 250);
    /* dark blue */
    color: oklch(30% 0.10 250);
    box-shadow: 0 0 0 3px oklch(70% 0.15 250 / 0.3);
}

.state-node.future {
    background: var(--color-muted-bg, oklch(95% 0 0));
    border-color: var(--color-border, oklch(75% 0 0));
    color: var(--color-muted-contrast, oklch(50% 0 0));
}

.state-node.allowed {
    border-color: oklch(65% 0.15 85);
    /* orange */
}

.state-node.allowed:hover {
    background: oklch(90% 0.10 85);
}

.state-node.selected {
    background: oklch(85% 0.14 65);
    /* warm orange */
    border-color: oklch(55% 0.15 65);
    color: oklch(30% 0.10 65);
    box-shadow: 0 0 0 4px oklch(70% 0.14 65 / 0.4);
}

/* Node Indicators */
.node-indicator {
    font-size: 0.875rem;
    line-height: 1;
}

.icon-check {
    color: oklch(45% 0.15 145);
}

.icon-current {
    color: oklch(50% 0.15 250);
}

.icon-selected {
    color: oklch(50% 0.14 65);
}

.icon-future {
    color: var(--color-muted-contrast, oklch(60% 0 0));
}

/* Labels */
.node-label,
.node-label-short {
    position: absolute;
    bottom: -1.25rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--color-muted-contrast, oklch(50% 0 0));
}

.compact .node-label,
.compact .node-label-short {
    display: none;
}

/* Layout Badge */
.layout-badge {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    font-size: 0.625rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small, 0.25rem);
    padding: 0.125rem;
    line-height: 1;
}

/* Skip Indicator */
.skip-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: oklch(90% 0.10 85);
    border-radius: var(--radius-medium, 0.375rem);
    font-size: 0.75rem;
    color: oklch(40% 0.10 85);
}

.skip-icon {
    font-size: 0.875rem;
}

/* Layout Change Warning */
.layout-change-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: oklch(90% 0.08 250);
    border-radius: var(--radius-medium, 0.375rem);
    font-size: 0.75rem;
    color: oklch(40% 0.08 250);
}

.warning-icon {
    font-size: 0.875rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--duration, 150ms) var(--ease, ease);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
    .state-flow-timeline {
        --node-size: 2rem;
        --connector-width: 1.5rem;
    }

    .node-label {
        font-size: 0.5rem;
    }
}
</style>
