<template>
    <div v-if="canRequestReview" class="request-review-container">
        <button class="request-review-btn" :class="{ 'is-loading': isSubmitting }" :disabled="isSubmitting"
            @click="handleRequestReview">
            <span v-if="isSubmitting" class="spinner"></span>
            <span v-else class="btn-icon">📤</span>
            <span class="btn-text">{{ buttonLabel }}</span>
        </button>

        <!-- Success message -->
        <Transition name="fade">
            <div v-if="showSuccess" class="success-message">
                <span class="success-icon">✅</span>
                <span>Prüfungsanfrage gesendet!</span>
            </div>
        </Transition>

        <!-- Error message -->
        <Transition name="fade">
            <div v-if="errorMessage" class="error-message">
                <span class="error-icon">⚠️</span>
                <span>{{ errorMessage }}</span>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    projectId: string | number
    currentStatus: number
    isOwner: boolean
    isCreator?: boolean
    targetStatus?: number  // Default: 256 (REVIEW)
}>(), {
    isCreator: false,
    targetStatus: 256  // STATUS.REVIEW
})

const emit = defineEmits<{
    'review-requested': [newStatus: number]
    'error': [message: string]
}>()

// ============================================================
// CONSTANTS
// ============================================================

const STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    REVIEW: 256,
    CONFIRMED: 512,
    RELEASED: 4096
}

// ============================================================
// STATE
// ============================================================

const isSubmitting = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')

// ============================================================
// COMPUTED
// ============================================================

// Can request review: owner/creator + in draft status
const canRequestReview = computed(() => {
    const isDraft = props.currentStatus === STATUS.DRAFT
    const hasPermission = props.isOwner || props.isCreator
    return isDraft && hasPermission
})

const buttonLabel = computed(() => {
    if (isSubmitting.value) return 'Wird gesendet...'
    return 'Zur Prüfung einreichen'
})

// ============================================================
// METHODS
// ============================================================

async function handleRequestReview() {
    if (isSubmitting.value) return

    isSubmitting.value = true
    errorMessage.value = ''

    try {
        const response = await fetch(`/api/projects/${props.projectId}/activate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetStatus: props.targetStatus
            })
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Fehler beim Einreichen')
        }

        const data = await response.json()

        // Show success
        showSuccess.value = true
        setTimeout(() => {
            showSuccess.value = false
        }, 3000)

        emit('review-requested', data.newStatus || props.targetStatus)

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        errorMessage.value = message
        emit('error', message)

        setTimeout(() => {
            errorMessage.value = ''
        }, 5000)
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.request-review-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.request-review-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, oklch(75% 0.15 280), oklch(65% 0.18 300));
    color: white;
    border: none;
    border-radius: var(--radius-medium);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 2px 8px oklch(65% 0.18 300 / 0.3);
}

.request-review-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px oklch(65% 0.18 300 / 0.4);
}

.request-review-btn:active:not(:disabled) {
    transform: translateY(0);
}

.request-review-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.request-review-btn.is-loading {
    background: oklch(70% 0.08 280);
}

.btn-icon {
    font-size: 1.125rem;
}

.btn-text {
    white-space: nowrap;
}

/* Spinner */
.spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Success message */
.success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: oklch(92% 0.08 145);
    color: oklch(35% 0.12 145);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
}

.success-icon {
    font-size: 1rem;
}

/* Error message */
.error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: oklch(92% 0.08 25);
    color: oklch(40% 0.15 25);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
}

.error-icon {
    font-size: 1rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: var(--transition);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
