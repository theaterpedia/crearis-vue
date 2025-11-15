<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click.self="close">
                <div class="modal-container">
                    <button class="modal-close-btn" @click="close" aria-label="Close">×</button>

                    <div class="item-card size-large" :class="{
                        'has-background': hasImage && isFullImage,
                        'layout-bottomimage': isBottomImage,
                        'layout-heroimage': isHeroImage
                    }">
                        <!-- CornerBanner for demo entities -->
                        <CornerBanner size="card" :entity="entity" />

                        <!-- Full Background Image (fullimage/default anatomy) -->
                        <template v-if="isFullImage">
                            <!-- Background Image with data mode -->
                            <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'wide'" :avatar="false"
                                class="card-background-image" />

                            <!-- Legacy Background Image -->
                            <img v-else-if="cimg" :src="cimg" :alt="heading" class="card-background-image"
                                loading="lazy" />

                            <!-- Background Fade Overlay -->
                            <div v-if="hasImage" class="card-background-fade"></div>
                        </template>

                        <!-- Card Content -->
                        <div v-if="!isHeroImage" class="card-content">
                            <!-- Card Header -->
                            <div class="card-header">
                                <HeadingParser :content="heading" as="h3" :compact="true" scope="element"
                                    v-bind="$attrs" />
                            </div>

                            <!-- Card Meta (teaser content) -->
                            <div v-if="teaser" class="card-meta">
                                <p class="teaser-text">{{ teaser }}</p>
                            </div>
                        </div>

                        <!-- Bottom Image (bottomimage anatomy) -->
                        <div v-if="isBottomImage && hasImage" class="card-image-bottom">
                            <!-- Image with data mode -->
                            <ImgShape v-if="dataMode && data" :data="data" :shape="'wide'" :avatar="false"
                                class="bottom-image" />
                            <!-- Legacy Image -->
                            <img v-else-if="cimg" :src="cimg" :alt="heading" class="bottom-image" loading="lazy" />
                        </div>

                        <!-- Hero Image (heroimage anatomy) -->
                        <template v-if="isHeroImage && hasImage">
                            <div class="hero-image-container">
                                <!-- Hero Image -->
                                <ImgShape v-if="dataMode && data" :data="data" shape="wide" :avatar="false"
                                    class="hero-image" />
                                <img v-else-if="cimg" :src="cimg" :alt="heading" class="hero-image" loading="lazy" />

                                <!-- Hero Heading Overlay Banner -->
                                <div class="hero-heading-banner">
                                    <HeadingParser :content="heading" as="h3" :compact="true" scope="element"
                                        v-bind="$attrs" />
                                </div>
                            </div>

                            <!-- Card Meta (below hero) -->
                            <div v-if="teaser" class="hero-card-meta">
                                <p class="teaser-text">{{ teaser }}</p>
                            </div>
                        </template>

                        <!-- Slot for additional content -->
                        <slot></slot>
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
import CornerBanner from '@/components/CornerBanner.vue'

interface Props {
    isOpen: boolean
    heading: string
    teaser?: string
    cimg?: string
    data?: ImgShapeData
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    anatomy?: 'topimage' | 'bottomimage' | 'fullimage' | 'heroimage' | false
    entity?: {
        xmlid?: string
        status_id?: number
        status_value?: number
        table?: string
    }
}

const props = withDefaults(defineProps<Props>(), {
    isOpen: false,
    anatomy: 'heroimage'
})

const emit = defineEmits<{
    close: []
}>()

const dataMode = computed(() => props.data !== undefined)
const hasImage = computed(() => dataMode.value || props.cimg !== undefined)
const isFullImage = computed(() => props.anatomy === 'fullimage' || props.anatomy === false)
const isBottomImage = computed(() => props.anatomy === 'bottomimage')
const isHeroImage = computed(() => props.anatomy === 'heroimage')

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
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Bottom Image Layout */
.item-card.layout-bottomimage {
    display: flex;
    flex-direction: column;
}

.item-card.layout-bottomimage .card-content {
    flex-shrink: 0;
}

.card-image-bottom {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
}

.bottom-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
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

/* Hero Image Layout - +100px to min-height */
.item-card.layout-heroimage {
    display: flex;
    flex-direction: column;
}

.item-card.layout-heroimage.size-large {
    min-height: 500px;
    /* 400px + 100px */
}

.hero-image-container {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
}

.hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
}

.hero-heading-banner {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: oklch(from var(--color-card-bg) l c h / 0.9);
    padding: 1.5rem;
    z-index: 2;
}

.hero-heading-banner :deep(h3) {
    margin: 0;
    color: var(--color-card-contrast);
}

.hero-card-meta {
    position: relative;
    z-index: 1;
    padding: 1.5rem;
    background: var(--color-card-bg);
}

.hero-card-meta .teaser-text {
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
