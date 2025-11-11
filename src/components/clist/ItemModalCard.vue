<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click.self="close">
                <div class="modal-container">
                    <button class="modal-close-btn" @click="close" aria-label="Close">×</button>

                    <div class="item-card size-large">
                        <!-- Background Image with data mode -->
                        <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'card'"
                            :variant="variant || 'default'" class="card-background-image" />

                        <!-- Legacy Background Image -->
                        <img v-else-if="cimg" :src="cimg" :alt="heading" class="card-background-image" loading="lazy" />

                        <!-- Background Fade Overlay -->
                        <div v-if="hasImage" class="card-background-fade"></div>

                        <!-- Card Content -->
                        <div class="card-content">
                            <!-- Card Header -->
                            <div class="card-header">
                                <HeadingParser :content="heading" as="h3" :compact="true" v-bind="$attrs" />
                            </div>

                            <!-- Card Meta (teaser content) -->
                            <div v-if="teaser" class="card-meta">
                                <p class="teaser-text">{{ teaser }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeadingParser from '../HeadingParser.vue'
import ImgShape, { type ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    isOpen: boolean
    heading: string
    teaser?: string
    cimg?: string
    data?: ImgShapeData
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
    isOpen: false
})

const emit = defineEmits<{
    close: []
}>()

const dataMode = computed(() => props.data !== undefined)
const hasImage = computed(() => dataMode.value || props.cimg !== undefined)

function close() {
    emit('close')
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 2rem;
}

.modal-container {
    position: relative;
    max-width: 60rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 2rem;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.modal-close-btn:hover {
    background: rgba(0, 0, 0, 0.95);
    transform: scale(1.1);
}

.item-card {
    position: relative;
    background-color: var(--color-card-bg);
    border-radius: 0.5rem;
    border-left: 4px solid var(--color-accent-bg);
    overflow: hidden;
}

/* Background image */
.card-background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: 0;
}

/* Background fade overlay */
.card-background-fade {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom,
            oklch(from var(--color-card-bg) l c h / 0.3) 0%,
            oklch(from var(--color-card-bg) l c h / 0.85) 50%,
            var(--color-card-bg) 100%);
    z-index: 0;
}

/* Content */
.card-content {
    position: relative;
    z-index: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Header */
.card-header {
    background: oklch(from var(--color-card-bg) l c h / 0.6);
    padding: 0.75rem;
    border-radius: 0.375rem;
}

.card-header :deep(h3) {
    margin: 0;
    color: var(--color-card-contrast);
}

/* Meta */
.card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.teaser-text {
    margin: 0;
    padding: 1rem;
    background: oklch(from var(--color-card-bg) l c h / 0.8);
    border-radius: 0.375rem;
    line-height: 1.6;
    color: var(--color-card-contrast);
}

/* Size variant - large (modal optimized) */
.size-large {
    min-height: 400px;
}

.size-large .card-content {
    padding: 2rem;
}

.size-large .card-header {
    padding: 1.5rem;
}

.size-large .teaser-text {
    padding: 1.5rem;
    font-size: 1.125rem;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(0.9);
    opacity: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .modal-overlay {
        padding: 1rem;
    }

    .modal-container {
        max-height: 95vh;
    }

    .size-large .card-content {
        padding: 1.5rem;
    }

    .size-large .card-header {
        padding: 1rem;
    }

    .size-large .teaser-text {
        padding: 1rem;
        font-size: 1rem;
    }
}
</style>
