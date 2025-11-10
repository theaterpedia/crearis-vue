<template>
    <div class="item-tile" :class="sizeClass">
        <!-- Warning icon overlay for deprecated cimg usage -->
        <div v-if="deprecated" class="deprecated-warning" title="Using deprecated cimg field">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1l6.928 12H1.072L8 1z" stroke="currentColor" stroke-width="1" fill="none" />
                <path d="M8 6v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
        </div>
        <!-- Background Image with data mode -->
        <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'tile'" :variant="variant || 'default'"
            class="tile-background" />

        <!-- Legacy Background Image -->
        <img v-else-if="cimg" :src="cimg" :alt="heading" class="tile-background" loading="lazy" />

        <!-- Content -->
        <div class="tile-content">
            <!-- Header (no padding, no margin, no color marker) -->
            <div class="tile-header">
                <HeadingParser :content="heading" :as="headingLevel" :compact="true" v-bind="$attrs" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeadingParser from '../HeadingParser.vue'
import ImgShape, { type ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    heading: string
    cimg?: string
    size?: 'small' | 'medium' | 'large'
    data?: ImgShapeData
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    deprecated?: boolean // Flag for deprecated cimg usage
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium'
})

const dataMode = computed(() => props.data !== undefined)

const sizeClass = computed(() => `size-${props.size}`)

const headingLevel = computed(() => {
    if (props.size === 'small') return 'h5'
    if (props.size === 'large') return 'h3'
    return 'h4'
})

// Log props for debugging
console.log('[ItemTile] Props:', {
    heading: props.heading,
    size: props.size,
    shape: props.shape,
    variant: props.variant,
    dataMode: dataMode.value,
    hasData: !!props.data
})
if (props.data) {
    console.log('[ItemTile] Image data:', props.data)
}
</script>

<style scoped>
.item-tile {
    position: relative;
    background-color: var(--color-card-bg);
    border-radius: 0.5rem;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.item-tile:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Deprecated warning icon overlay */
.deprecated-warning {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background-color: rgba(245, 158, 11, 0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    cursor: help;
}

.deprecated-warning svg {
    width: 14px;
    height: 14px;
}

/* Background */
.tile-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: 0;
}

/* Content */
.tile-content {
    position: relative;
    z-index: 1;
    padding: 1rem;
    background: linear-gradient(to bottom,
            transparent 0%,
            oklch(from var(--color-card-bg) l c h / 0.8) 40%,
            var(--color-card-bg) 100%);
}

/* Header - no padding, no margin, no color marker */
.tile-header {
    padding: 0;
    margin: 0;
}

.tile-header :deep(h3),
.tile-header :deep(h4),
.tile-header :deep(h5) {
    padding: 0;
    margin: 0;
    color: var(--color-card-contrast);
}

/* Size variants */
.size-small {
    min-height: 120px;
}

.size-small .tile-content {
    padding: 0.75rem;
}

.size-medium {
    min-height: 160px;
}

.size-large {
    min-height: 200px;
}

.size-large .tile-content {
    padding: 1.5rem;
}
</style>
