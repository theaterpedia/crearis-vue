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
    <div class="item-tile" :class="{
        'style-compact': styleCompact,
        'is-selected': isSelected,
        [`marker-${markerColor}`]: showMarker
    }">
        <!-- Warning icon overlay for deprecated cimg usage -->
        <div v-if="deprecated" class="deprecated-warning" title="Using deprecated cimg field">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1l6.928 12H1.072L8 1z" stroke="currentColor" stroke-width="1" fill="none" />
                <path d="M8 6v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
        </div>

        <!-- Entity Icon (top-left) -->
        <div v-if="showEntityIcon && entityIcon" class="entity-icon" :title="entityType">
            {{ entityIcon }}
        </div>

        <!-- Badge with optional counter (top-right) -->
        <div v-if="showBadge" class="badge" :class="`badge-${badgeColor}`">
            <span v-if="showCounter">{{ counterValue }}</span>
        </div>

        <!-- Selection checkbox (bottom-left) -->
        <div v-if="showSelectable" class="checkbox" :class="{ checked: isSelected }">
            <svg v-if="isSelected" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3.5L6 11l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" fill="none" />
            </svg>
        </div>

        <!-- Compact Mode: Image full-width with heading overlay -->
        <template v-if="styleCompact">
            <!-- Background Image with data mode -->
            <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'square'" class="tile-background" />

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
                <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'square'" />
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
import type { ItemOptions, ItemModels } from './types'

interface Props {
    heading: string
    cimg?: string
    size?: 'medium' // Only medium size supported
    data?: ImgShapeData
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    deprecated?: boolean // Flag for deprecated cimg usage
    styleCompact?: boolean // Controls layout: true = overlay, false = beside
    headingLevel?: 'h3' | 'h4' | 'h5' // Configurable heading level
    options?: ItemOptions // Visual indicators config
    models?: ItemModels // Item state models
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    styleCompact: true,
    headingLevel: 'h4',
    options: () => ({}),
    models: () => ({})
})

const dataMode = computed(() => props.data !== undefined)

// Computed helpers for options
const showEntityIcon = computed(() => props.options?.entityIcon === true)
const showBadge = computed(() => props.options?.badge === true)
const showCounter = computed(() => props.options?.counter === true)
const showSelectable = computed(() => props.options?.selectable === true)
const showMarker = computed(() => props.options?.marker === true)

// Get model values with defaults
const isSelected = computed(() => props.models?.selected === true)
const counterValue = computed(() => props.models?.count || 0)
const markerColor = computed(() => props.models?.marked || 'accent')
const entityType = computed(() => props.models?.entityType)
const badgeColor = computed(() => props.models?.badgeColor || 'primary')

// Icon mapping for entity types
const entityIcons = {
    'instructor': '👤',
    'user': '👤',
    'event': '👥',
    'location': '🎭',
    'blog-post': '📝',
    'project': '📁'
}

const entityIcon = computed(() => {
    if (!entityType.value) return ''
    return entityIcons[entityType.value] || ''
})

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

/* Selected state */
.item-tile.is-selected {
    box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* Marker bars (left side accent) */
.item-tile.marker-primary {
    border-left: 4px solid var(--color-primary-bg);
}

.item-tile.marker-secondary {
    border-left: 4px solid var(--color-secondary-bg);
}

.item-tile.marker-accent {
    border-left: 4px solid var(--color-accent-bg);
}

.item-tile.marker-muted {
    border-left: 4px solid var(--color-muted-bg);
}

.item-tile.marker-warning {
    border-left: 4px solid var(--color-warning-bg);
}

.item-tile.marker-positive {
    border-left: 4px solid var(--color-positive-bg);
}

.item-tile.marker-negative {
    border-left: 4px solid var(--color-negative-bg);
}

/* Entity Icon (top-left) */
.entity-icon {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    background: oklch(from var(--color-card-bg) l c h / 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Badge (top-right) */
.badge {
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.badge-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.badge-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.badge-accent {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.badge-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.badge-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.badge-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

/* Checkbox (bottom-left) */
.checkbox {
    position: absolute;
    bottom: 8px;
    left: 8px;
    width: 24px;
    height: 24px;
    background: var(--color-card-bg);
    border: 2px solid var(--color-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
}

.checkbox:hover {
    border-color: var(--color-primary-bg);
    background: var(--color-primary-lighter, #eff6ff);
}

.checkbox.checked {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: white;
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
