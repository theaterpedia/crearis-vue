<template>
    <Teleport to="body">
        <Transition name="fpostit-fade">
            <div v-if="isOpen" :class="['floating-postit', `bg-${data.color}`, data.rotation]" :style="positionStyle"
                role="dialog" aria-modal="false" :aria-labelledby="`fpostit-title-${data.key}`">
                <!-- Close button -->
                <button class="fpostit-close" @click="handleClose" aria-label="Close" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>

                <!-- SVG Icon (if provided) -->
                <div v-if="data.svg" class="fpostit-svg" v-html="data.svg"></div>

                <!-- Image (if provided) -->
                <img v-if="data.image" :src="data.image" :alt="data.title" class="fpostit-image" />

                <!-- Title -->
                <h3 :id="`fpostit-title-${data.key}`" class="fpostit-title">{{ data.title }}</h3>

                <!-- Content -->
                <div class="fpostit-content" v-html="data.content"></div>

                <!-- Actions -->
                <div v-if="data.actions && data.actions.length > 0" class="fpostit-actions">
                    <a v-for="(action, index) in data.actions" :key="index" :href="action.href || 'javascript:void(0)'"
                        :target="action.target || '_self'" class="fpostit-action"
                        @click="handleActionClick(action, $event)">
                        {{ action.label }}
                    </a>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import type { FpostitData, FpostitAction } from '../types'
import { calculatePosition, positionToStyle } from '../utils/positioning'

const props = defineProps<{
    data: FpostitData
    isOpen: boolean
}>()

const emit = defineEmits<{
    close: []
}>()

// Calculate position based on trigger element and hlogic
const positionStyle = computed(() => {
    if (!props.data.triggerElement) {
        // Fallback position if no trigger element
        return {
            position: 'fixed',
            top: '100px',
            right: '16px',
            maxWidth: '400px',
            zIndex: '1000'
        }
    }

    const position = calculatePosition(
        props.data.triggerElement,
        props.data.hlogic,
        props.data.hOffset
    )

    return positionToStyle(position)
})

// Handle close button click
function handleClose() {
    emit('close')
}

// Handle action click
function handleActionClick(action: FpostitAction, event: MouseEvent) {
    if (action.handler) {
        event.preventDefault()
        action.handler(() => emit('close'))
    }
    // If href is provided and no handler, let browser handle navigation
}

// Handle Escape key
function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && props.isOpen) {
        handleClose()
    }
}

// Re-calculate position on window resize
function handleResize() {
    // Position is reactive via computed property
}

onMounted(() => {
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* Base floating post-it styles */
.floating-postit {
    position: absolute;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    word-wrap: break-word;
    transition: transform 0.2s ease-out;
}

/* Rotation classes (matching PostIt component) */
.-rotate-3 {
    rotate: -3deg;
}

.-rotate-2 {
    rotate: -2deg;
}

.-rotate-1 {
    rotate: -1deg;
}

.rotate-0 {
    rotate: 0deg;
}

.rotate-1 {
    rotate: 1deg;
}

.rotate-2 {
    rotate: 2deg;
}

.rotate-3 {
    rotate: 3deg;
}

/* Color backgrounds (matching PostIt component) */
.bg-primary {
    background-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    --color-contrast: var(--color-primary-contrast);
}

.bg-secondary {
    background-color: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
    --color-contrast: var(--color-secondary-contrast);
}

.bg-warning {
    background-color: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    --color-contrast: var(--color-warning-contrast);
}

.bg-positive {
    background-color: var(--color-positive-bg);
    color: var(--color-positive-contrast);
    --color-contrast: var(--color-positive-contrast);
}

.bg-negative {
    background-color: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    --color-contrast: var(--color-negative-contrast);
}

.bg-accent {
    background-color: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    --color-contrast: var(--color-accent-contrast);
}

.bg-muted {
    background-color: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    --color-contrast: var(--color-muted-contrast);
}

.bg-dimmed {
    background-color: var(--color-dimmed);
    color: var(--color-muted-contrast);
    --color-contrast: var(--color-muted-contrast);
}

/* Close button */
.fpostit-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 0.25rem;
    color: var(--color-contrast);
    cursor: pointer;
    transition: background 0.2s;
}

.fpostit-close:hover {
    background: rgba(0, 0, 0, 0.2);
}

/* SVG icon */
.fpostit-svg {
    margin-bottom: 1rem;
}

.fpostit-svg :deep(svg) {
    width: 2rem;
    height: 2rem;
    color: var(--color-contrast);
}

/* Image */
.fpostit-image {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
}

/* Title */
.fpostit-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    padding-right: 2rem;
    /* Space for close button */
}

/* Content */
.fpostit-content {
    margin-bottom: 1rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-contrast);
}

.fpostit-content :deep(p) {
    margin: 0 0 0.75rem 0;
}

.fpostit-content :deep(p:last-child) {
    margin-bottom: 0;
}

.fpostit-content :deep(ul),
.fpostit-content :deep(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.fpostit-content :deep(li) {
    margin-bottom: 0.25rem;
}

.fpostit-content :deep(strong) {
    font-weight: 600;
}

.fpostit-content :deep(em) {
    font-style: italic;
}

/* Actions */
.fpostit-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
}

.fpostit-action {
    flex: 1;
    padding: 0.625rem 1rem;
    text-align: center;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    background: rgba(0, 0, 0, 0.15);
    color: var(--color-contrast);
    transition: background 0.2s;
    cursor: pointer;
    border: none;
    font-family: inherit;
}

.fpostit-action:hover {
    background: rgba(0, 0, 0, 0.25);
}

/* Transitions */
.fpostit-fade-enter-active,
.fpostit-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fpostit-fade-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.fpostit-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Mobile responsiveness */
@media (max-width: 767px) {
    .floating-postit {
        padding: 1.25rem;
        font-size: 0.875rem;
    }

    .fpostit-title {
        font-size: 1.125rem;
    }

    .fpostit-content {
        font-size: 0.875rem;
    }

    .fpostit-actions {
        flex-direction: column;
    }

    .fpostit-action {
        width: 100%;
    }
}
</style>
