<template>
    <div class="status-editor">
        <!-- Header with current status -->
        <div class="status-header">
            <span :class="['status-badge', `status-${currentStatusColor}`]">
                <span class="status-icon">{{ currentStatusIcon }}</span>
                <span class="status-label">{{ currentStatusLabel }}</span>
            </span>
            <button v-if="canTrash && !isTrashed" class="trash-button" @click="handleTrash"
                title="In Papierkorb verschieben">
                <Trash2 :size="18" />
            </button>
        </div>

        <!-- Transition Controls -->
        <div v-if="transitionActions.length > 0" class="transition-controls">
            <p class="transition-label">Verfügbare Aktionen:</p>

            <!-- Horizontal buttons for ≤4 transitions -->
            <div v-if="transitionActions.length <= 4" class="transition-buttons">
                <button v-for="action in transitionActions" :key="action.value" :class="[
                    'transition-button',
                    `status-${action.color}`,
                    { 'is-primary': action.isPrimary }
                ]" :disabled="isTransitioning" @click="handleTransition(action.value)">
                    <span class="action-icon">{{ action.icon }}</span>
                    <span class="action-label">{{ action.label }}</span>
                </button>
            </div>

            <!-- Dropdown for >4 transitions -->
            <div v-else class="transition-dropdown">
                <select v-model="selectedTransition" class="transition-select" :disabled="isTransitioning">
                    <option :value="null">Aktion wählen...</option>
                    <option v-for="action in transitionActions" :key="action.value" :value="action.value">
                        {{ action.icon }} {{ action.label }}
                    </option>
                </select>
                <button class="apply-button" :disabled="!selectedTransition || isTransitioning" @click="handleApply">
                    <Check :size="16" />
                    Anwenden
                </button>
            </div>
        </div>

        <!-- No transitions available -->
        <div v-else-if="!isTrashed" class="no-transitions">
            <AlertCircle :size="18" class="no-transitions-icon" />
            <span>Keine Statusänderungen verfügbar</span>
        </div>

        <!-- Scope Toggles Section -->
        <div v-if="!isTrashed" class="scope-section">
            <p class="scope-label">Sichtbarkeit:</p>
            <div class="scope-toggles">
                <button v-for="scope in scopeOptions" :key="scope.bit"
                    :class="['scope-toggle', { 'is-active': scope.isActive }]" :title="scope.description"
                    :disabled="isTransitioning" @click="handleScopeToggle(scope.bit)">
                    <component :is="scope.isActive ? Eye : EyeOff" :size="14" class="scope-icon" />
                    <span class="scope-emoji">{{ scope.icon }}</span>
                    <span class="scope-name">{{ scope.label }}</span>
                </button>
            </div>
        </div>

        <!-- Trashed state -->
        <div v-if="isTrashed" class="trashed-state">
            <Trash2 :size="18" class="trashed-icon" />
            <span>Dieser Beitrag ist im Papierkorb</span>
            <button v-if="canRestore" class="restore-button" :disabled="isTransitioning" @click="handleRestore">
                <RotateCcw :size="16" />
                Wiederherstellen
            </button>
        </div>

        <!-- Loading state -->
        <div v-if="isTransitioning" class="loading-overlay">
            <Loader2 :size="24" class="loading-spinner" />
            <span>Statuswechsel...</span>
        </div>

        <!-- Error message -->
        <div v-if="transitionError" class="error-message">
            <XCircle :size="16" />
            <span>{{ transitionError }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    Check,
    Trash2,
    RotateCcw,
    AlertCircle,
    XCircle,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-vue-next'
import { usePostStatusV2 as usePostStatus, STATUS } from '@/composables/usePostStatusV2'
import type { PostData, ProjectData, MembershipData } from '@/composables/usePostStatusV2'

// ============================================================
// PROPS & EMITS
// ============================================================

const props = defineProps<{
    post: PostData
    project: ProjectData
    membership?: MembershipData | null
}>()

const emit = defineEmits<{
    'status-changed': [newStatus: number]
    'scope-changed': [newStatus: number]
    'trash': []
    'restore': []
    'error': [error: string]
}>()

// ============================================================
// COMPOSABLE
// ============================================================

const postRef = computed(() => props.post)
const projectRef = computed(() => props.project)
const membershipRef = computed(() => props.membership ?? null)

const {
    currentStatus,
    currentStatusLabel,
    currentStatusColor,
    currentStatusIcon,
    transitionActions,
    canTrash,
    isTransitioning,
    transitionError,
    transitionTo,
    isTrashed,
    scopeOptions,
    toggleScope
} = usePostStatus(postRef, projectRef, membershipRef)

// ============================================================
// LOCAL STATE
// ============================================================

const selectedTransition = ref<number | null>(null)

// ============================================================
// COMPUTED
// ============================================================

const canRestore = computed(() => {
    // When trashed, check if we can transition back to DRAFT
    return isTrashed.value && transitionActions.value.some((a: { value: number }) => a.value === STATUS.DRAFT)
})

// ============================================================
// HANDLERS
// ============================================================

async function handleTransition(targetStatus: number) {
    const newStatus = await transitionTo(targetStatus)

    if (newStatus !== null) {
        // Emit the actual new status (with scope bits preserved)
        emit('status-changed', newStatus)
        selectedTransition.value = null
    } else if (transitionError.value) {
        emit('error', transitionError.value)
    }
}

async function handleApply() {
    if (selectedTransition.value) {
        await handleTransition(selectedTransition.value)
    }
}

async function handleTrash() {
    const newStatus = await transitionTo(STATUS.TRASH)

    if (newStatus !== null) {
        emit('trash')
    } else if (transitionError.value) {
        emit('error', transitionError.value)
    }
}

async function handleRestore() {
    const newStatus = await transitionTo(STATUS.DRAFT)

    if (newStatus !== null) {
        emit('restore')
    } else if (transitionError.value) {
        emit('error', transitionError.value)
    }
}

async function handleScopeToggle(scopeBit: number) {
    const newStatus = await toggleScope(scopeBit)
    if (newStatus !== null) {
        // Emit scope-changed with actual new status (keeps modal open)
        emit('scope-changed', newStatus)
    }
}
</script>

<style scoped>
/* ===== STATUS EDITOR COMPONENT ===== */
/* Follows Opus-CSS-Conventions.md */

.status-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-background-soft);
    position: relative;
}

/* --- Header with Status Badge --- */

.status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.trash-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: var(--transition);
    flex-shrink: 0;
}

.trash-button:hover {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

/* --- Status Badge --- */

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    width: fit-content;
}

.status-icon {
    font-size: 1rem;
}

.status-label {
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* --- Status Color Variants --- */

.status-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.status-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.status-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.status-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.status-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

.status-accent {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-dimmed {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    opacity: 0.7;
}

/* --- Transition Controls --- */

.transition-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.transition-label {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.transition-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.transition-button {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-background);
    cursor: pointer;
    font-size: 0.875rem;
    transition: var(--transition);
}

.transition-button:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: var(--color-background-soft);
}

.transition-button.is-primary {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.transition-button.is-primary:hover:not(:disabled) {
    filter: brightness(1.1);
}

.transition-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-icon {
    font-size: 1rem;
}

.action-label {
    font-weight: 500;
}

/* --- Dropdown Mode --- */

.transition-dropdown {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.transition-select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-background);
    font-size: 0.875rem;
}

.apply-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-primary);
    border-radius: 0.25rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.apply-button:hover:not(:disabled) {
    filter: brightness(1.1);
}

.apply-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* --- No Transitions State --- */

.no-transitions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-muted-bg);
    border-radius: 0.25rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.no-transitions-icon {
    flex-shrink: 0;
}

/* --- Trashed State --- */

.trashed-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.trashed-icon {
    flex-shrink: 0;
}

.restore-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
    padding: 0.375rem 0.625rem;
    border: 1px solid currentColor;
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.restore-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
}

.restore-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* --- Loading Overlay --- */

.loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: rgba(var(--color-background-rgb, 255, 255, 255), 0.9);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.loading-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* --- Error Message --- */

.error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

/* --- Scope Toggles Section --- */

.scope-section {
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
}

.scope-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
}

.scope-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.scope-toggle {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    background: var(--color-background);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    transition: var(--transition);
}

.scope-toggle:hover:not(:disabled) {
    border-color: var(--color-text-muted);
    background: var(--color-background-soft);
}

.scope-toggle.is-active {
    border-color: var(--color-positive);
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.scope-toggle.is-active:hover:not(:disabled) {
    border-color: var(--color-positive);
    background: var(--color-positive-bg);
    color: white;
}

.scope-toggle.is-active .scope-icon {
    color: var(--color-positive);
}

.scope-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.scope-icon {
    flex-shrink: 0;
}

.scope-emoji {
    font-size: 0.875rem;
}

.scope-name {
    font-weight: 500;
}
</style>
