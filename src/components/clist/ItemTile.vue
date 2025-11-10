<!--
  ItemTile.vue - Tile layout with 128×128px images
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
  
  Layout Modes:
  - Compact (styleCompact=true): Full-width image with heading overlay
  - Non-Compact (styleCompact=false): Grid layout with heading beside image
-->
<template>
    <div class="item-tile" :class="{ 'style-compact': styleCompact }">
        <!-- Warning icon overlay for deprecated cimg usage -->
        <div v-if="deprecated" class="deprecated-warning" title="Using deprecated cimg field">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1l6.928 12H1.072L8 1z" stroke="currentColor" stroke-width="1" fill="none" />
                <path d="M8 6v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
        </div>

        <!-- Compact Mode: Image full-width with heading overlay -->
        <template v-if="styleCompact">
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
        </template>

        <!-- Non-Compact Mode: Image beside heading with padding -->
        <template v-else>
            <div class="tile-image">
                <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'tile'"
                    :variant="variant || 'default'" />
                <img v-else-if="cimg" :src="cimg" :alt="heading" loading="lazy" />
            </div>
            <div class="tile-heading">
                <HeadingParser :content="heading" :as="headingLevel" :compact="false" v-bind="$attrs" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeadingParser from '../HeadingParser.vue'
import ImgShape, { type ImgShapeData } from '@/components/images/ImgShape.vue'

interface Props {
    heading: string
    cimg?: string
    size?: 'medium' // Only medium size supported
    data?: ImgShapeData
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    deprecated?: boolean // Flag for deprecated cimg usage
    styleCompact?: boolean // Controls layout: true = overlay, false = beside
    headingLevel?: 'h3' | 'h4' // Configurable heading level
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    styleCompact: true,
    headingLevel: 'h3'
})

const dataMode = computed(() => props.data !== undefined)

// Log props for debugging
console.log('[ItemTile] Props:', {
    heading: props.heading,
    size: props.size,
    shape: props.shape,
    variant: props.variant,
    dataMode: dataMode.value,
    hasData: !!props.data,
    styleCompact: props.styleCompact,
    headingLevel: props.headingLevel
})
if (props.data) {
    console.log('[ItemTile] Image data:', props.data)
}

</script>

<style scoped>
/* ===== Compact Mode (current implementation) ===== */
.item-tile.style-compact {
    position: relative;
    background-color: var(--color-card-bg);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 128px;
    /* Match tile-square height (--tile-width) */
}

.item-tile.style-compact:hover {
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

/* Background (compact mode) */
.style-compact .tile-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: 0;
}

/* Content - no padding for medium, follows imgShape height */
.style-compact .tile-content {
    position: relative;
    z-index: 1;
    padding: 0;
    background: linear-gradient(to bottom,
            transparent 0%,
            oklch(from var(--color-card-bg) l c h / 0.8) 40%,
            var(--color-card-bg) 100%);
}

/* Header - no padding, no margin, no color marker */
.style-compact .tile-header {
    padding: 0;
    margin: 0;
}

.style-compact .tile-header :deep(h3),
.style-compact .tile-header :deep(h4) {
    padding: 0;
    margin: 0;
    color: var(--color-card-contrast);
}

/* ===== Non-Compact Mode (heading beside image) ===== */
.item-tile:not(.style-compact) {
    display: grid;
    grid-template-columns: 128px 1fr;
    /* Image fixed at 128px, heading fills remaining */
    background-color: var(--color-card-bg);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.item-tile:not(.style-compact):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tile-image {
    width: 128px;
    height: 128px;
    overflow: hidden;
}

.tile-image img,
.tile-image :deep(.img-shape) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.tile-heading {
    display: flex;
    align-items: center;
    padding: 24px 12px 24px 12px;
    /* 24px vertical, 12px left of heading */
}

.tile-heading :deep(h3),
.tile-heading :deep(h4) {
    margin: 0;
    padding: 0;
    color: var(--color-card-contrast);
}
</style>
