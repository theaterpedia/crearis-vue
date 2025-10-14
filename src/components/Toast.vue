<template>
    <Teleport to="body">
        <Transition name="toast">
            <div v-if="isVisible" :class="['toast', `toast-${type}`]" @click="close">
                <div class="toast-icon">{{ icon }}</div>
                <div class="toast-content">
                    <div class="toast-message">{{ message }}</div>
                </div>
                <button class="toast-close" @click.stop="close">×</button>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const props = defineProps<{
    message: string
    type?: ToastType
    duration?: number
}>()

const emit = defineEmits<{
    close: []
}>()

const isVisible = ref(false)
const type = props.type || 'info'
const duration = props.duration || 3000

const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
}

const icon = icons[type]

let timeoutId: ReturnType<typeof setTimeout> | null = null

function close() {
    isVisible.value = false
    setTimeout(() => emit('close'), 300)
}

onMounted(() => {
    isVisible.value = true
    timeoutId = setTimeout(close, duration)
})

watch(() => props.message, () => {
    if (timeoutId) clearTimeout(timeoutId)
    isVisible.value = true
    timeoutId = setTimeout(close, duration)
})
</script>

<style scoped>
.toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 300px;
    max-width: 500px;
    padding: 1rem 1.25rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 40px oklch(0% 0 0 / 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
}

.toast:hover {
    box-shadow: 0 15px 50px oklch(0% 0 0 / 0.3);
}

.toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.25rem;
    font-weight: bold;
    flex-shrink: 0;
}

.toast-success {
    border-left: 4px solid var(--color-positive-bg);
}

.toast-success .toast-icon {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.toast-error {
    border-left: 4px solid var(--color-negative-bg);
}

.toast-error .toast-icon {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

.toast-warning {
    border-left: 4px solid var(--color-warning-bg);
}

.toast-warning .toast-icon {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.toast-info {
    border-left: 4px solid var(--color-primary-bg);
}

.toast-info .toast-icon {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.toast-content {
    flex: 1;
}

.toast-message {
    font-size: 0.9375rem;
    color: var(--color-contrast);
    line-height: 1.5;
}

.toast-close {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: var(--color-muted-bg);
    border-radius: 4px;
    color: var(--color-contrast);
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s ease;
}

.toast-close:hover {
    background: var(--color-border);
}

/* Transition */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100%) translateY(-20px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
}
</style>
