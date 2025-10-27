<template>
    <div class="item-card" :class="[sizeClass, { 'has-background': cimg }]">
        <!-- Background Image with Lazy Loading -->
        <img v-if="cimg" :src="cimg" :alt="heading" class="card-background-image" loading="lazy" />

        <!-- Background Fade Overlay -->
        <div v-if="cimg" class="card-background-fade"></div>

        <!-- Card Content -->
        <div class="card-content">
            <!-- Card Header -->
            <div class="card-header">
                <HeadingParser :content="heading" :as="headingLevel" :compact="true" v-bind="$attrs" />
            </div>

            <!-- Card Meta (slot for additional content) -->
            <div v-if="$slots.default" class="card-meta">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HeadingParser from '../HeadingParser.vue'

interface Props {
    heading: string
    cimg?: string
    size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium'
})

const sizeClass = computed(() => `size-${props.size}`)

const headingLevel = computed(() => {
    if (props.size === 'small') return 'h5'
    if (props.size === 'large') return 'h3'
    return 'h4'
})
</script>

<style scoped>
.item-card {
    position: relative;
    background-color: var(--color-card-bg);
    border-radius: 0.5rem;
    border-left: 4px solid var(--color-accent-bg);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

/* Background image as actual img element */
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

.item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
    padding: 1.25rem;
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

.card-header :deep(h3),
.card-header :deep(h4),
.card-header :deep(h5) {
    margin: 0;
    color: var(--color-card-contrast);
}

/* Meta */
.card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Size variants - 30% taller than TaskCard */
.size-small {
    min-height: 195px;
    /* ~150px * 1.3 */
}

.size-small .card-content {
    padding: 1rem;
}

.size-medium {
    min-height: 260px;
    /* ~200px * 1.3 */
}

.size-large {
    min-height: 325px;
    /* ~250px * 1.3 */
}

.size-large .card-content {
    padding: 1.5rem;
}
</style>
