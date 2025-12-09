<template>
    <Teleport to="body">
        <Transition name="sheet">
            <div v-if="isOpen" class="bottom-sheet-overlay" @click="handleOverlayClick"
                @touchstart.passive="handleTouchStart" @touchmove.passive="handleTouchMove" @touchend="handleTouchEnd">
                <div ref="sheetRef" class="bottom-sheet" :class="{ dragging: isDragging }" :style="sheetStyle"
                    @click.stop>
                    <!-- Drag handle -->
                    <div class="sheet-handle">
                        <div class="handle-bar" />
                    </div>

                    <!-- Header (optional) -->
                    <div v-if="$slots.header || title" class="sheet-header">
                        <slot name="header">
                            <h3 class="sheet-title">{{ title }}</h3>
                        </slot>
                        <button v-if="showCloseButton" class="close-btn" @click="close" aria-label="Schließen">
                            ×
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="sheet-content" :style="contentStyle">
                        <slot />
                    </div>

                    <!-- Footer (optional) -->
                    <div v-if="$slots.footer" class="sheet-footer">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useReducedMotion } from '@/composables/useResponsive'

const props = withDefaults(defineProps<{
    isOpen: boolean
    title?: string
    initialHeight?: string
    maxHeight?: string
    persistent?: boolean // Can't dismiss by clicking overlay or dragging down
    showCloseButton?: boolean
}>(), {
    initialHeight: '50vh',
    maxHeight: '90vh',
    persistent: false,
    showCloseButton: true,
})

const emit = defineEmits<{
    close: []
    'update:isOpen': [value: boolean]
}>()

const { prefersReducedMotion } = useReducedMotion()

const sheetRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)
const sheetHeight = ref(0)

// Snap points as percentages of viewport height
const SNAP_POINTS = {
    collapsed: 0.3,  // 30vh
    half: 0.5,       // 50vh
    full: 0.9,       // 90vh
}

const DISMISS_THRESHOLD = 150 // pixels dragged down to dismiss

// Sheet style
const sheetStyle = computed(() => {
    const transform = isDragging.value
        ? `translateY(${currentTranslateY.value}px)`
        : 'translateY(0)'

    return {
        transform,
        maxHeight: props.maxHeight,
    }
})

// Content scroll area style
const contentStyle = computed(() => ({
    maxHeight: `calc(${props.maxHeight} - 4rem)`, // Account for header/handle
}))

// Touch handling
function handleTouchStart(event: TouchEvent) {
    if (props.persistent) return

    const touch = event.touches[0]
    dragStartY.value = touch.clientY
    isDragging.value = true
    sheetHeight.value = sheetRef.value?.offsetHeight ?? 0
}

function handleTouchMove(event: TouchEvent) {
    if (!isDragging.value || props.persistent) return

    const touch = event.touches[0]
    const deltaY = touch.clientY - dragStartY.value

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
        currentTranslateY.value = deltaY
    }
}

function handleTouchEnd() {
    if (!isDragging.value) return

    isDragging.value = false

    // Check if should dismiss
    if (currentTranslateY.value > DISMISS_THRESHOLD && !props.persistent) {
        close()
    } else {
        // Snap back
        currentTranslateY.value = 0
    }
}

// Overlay click
function handleOverlayClick() {
    if (!props.persistent) {
        close()
    }
}

// Close
function close() {
    emit('close')
    emit('update:isOpen', false)
}

// Lock body scroll when open
watch(() => props.isOpen, (open) => {
    if (open) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
        currentTranslateY.value = 0
    }
})

// Cleanup
onUnmounted(() => {
    document.body.style.overflow = ''
})

// Keyboard handling
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.isOpen && !props.persistent) {
        close()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, theme vars */

.bottom-sheet-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0% 0 0 / 0.5);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.bottom-sheet {
    width: 100%;
    max-width: 600px;
    background: var(--color-bg, oklch(100% 0 0));
    border-radius: var(--radius-large, 1rem) var(--radius-large, 1rem) 0 0;
    box-shadow: 0 -4px 24px oklch(0% 0 0 / 0.2);
    display: flex;
    flex-direction: column;
    font-family: var(--font);
    transition: transform var(--duration, 300ms) var(--ease, ease);

    /* Safe area for home indicator */
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-sheet.dragging {
    transition: none;
}

/* Drag handle */
.sheet-handle {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    cursor: grab;
}

.sheet-handle:active {
    cursor: grabbing;
}

.handle-bar {
    width: 2.5rem;
    height: 0.25rem;
    background: oklch(70% 0 0);
    border-radius: 9999px;
}

/* Header */
.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem 0.75rem;
    border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
}

.sheet-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-contrast, oklch(20% 0 0));
}

.close-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--color-muted-contrast, oklch(50% 0 0));
    cursor: pointer;
    border-radius: 50%;
    transition: var(--transition);
}

.close-btn:hover {
    background: var(--color-muted-bg, oklch(95% 0 0));
    color: var(--color-contrast, oklch(20% 0 0));
}

/* Content */
.sheet-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    -webkit-overflow-scrolling: touch;
}

/* Footer */
.sheet-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border, oklch(90% 0 0));
}

/* Animation */
.sheet-enter-active,
.sheet-leave-active {
    transition: opacity var(--duration, 300ms) var(--ease, ease);
}

.sheet-enter-active .bottom-sheet,
.sheet-leave-active .bottom-sheet {
    transition: transform var(--duration, 300ms) var(--ease, ease);
}

.sheet-enter-from,
.sheet-leave-to {
    opacity: 0;
}

.sheet-enter-from .bottom-sheet,
.sheet-leave-to .bottom-sheet {
    transform: translateY(100%);
}

/* Desktop: center and add max-width */
@media (min-width: 640px) {
    .bottom-sheet {
        margin: 0 auto 2rem;
        border-radius: var(--radius-large, 1rem);
        max-height: 80vh;
    }

    .sheet-handle {
        display: none;
    }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {

    .bottom-sheet,
    .sheet-enter-active,
    .sheet-leave-active,
    .sheet-enter-active .bottom-sheet,
    .sheet-leave-active .bottom-sheet {
        transition-duration: 0ms;
    }
}
</style>
