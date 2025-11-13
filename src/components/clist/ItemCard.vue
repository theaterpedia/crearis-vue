<template>
    <div class="item-card" :class="[
        sizeClass,
        {
            'has-background': hasImage,
            'is-selected': isSelected
        },
        showMarker ? `marker-${markerColor}` : ''
    ]">
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

        <!-- Background Image with data mode -->
        <!-- NOTE: ItemCard NEVER uses avatar style - wide/vertical shapes are incompatible with circular borders -->
        <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'wide'" :avatar="false"
            class="card-background-image" />

        <!-- Legacy Background Image -->
        <img v-else-if="cimg" :src="cimg" :alt="heading" class="card-background-image" loading="lazy" />

        <!-- Background Fade Overlay -->
        <div v-if="hasImage" class="card-background-fade"></div>

        <!-- Card Content -->
        <div class="card-content">
            <!-- Card Header -->
            <div class="card-header">
                <HeadingParser :content="heading" :as="headingLevel" :compact="true" scope="element" v-bind="$attrs" />
            </div>

            <!-- Card Meta (slot for additional content) -->
            <div v-if="$slots.default" class="card-meta">
                <slot></slot>
            </div>
        </div>
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
    size?: 'small' | 'medium' | 'large'
    data?: ImgShapeData
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    deprecated?: boolean // Flag for deprecated cimg usage
    options?: ItemOptions // Visual indicators config
    models?: ItemModels // Item state models
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    options: () => ({}),
    models: () => ({})
})

const dataMode = computed(() => props.data !== undefined)
const hasImage = computed(() => dataMode.value || props.cimg !== undefined)

const sizeClass = computed(() => `size-${props.size}`)

const headingLevel = computed(() => {
    if (props.size === 'small') return 'h5'
    if (props.size === 'large') return 'h3'
    return 'h4'
})

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
    return entityIcons[entityType.value as keyof typeof entityIcons] || ''
})

/**
 * Avatar Style: NEVER applied to ItemCard
 * 
 * Design Principle:
 * - ItemCard uses 'wide' or 'vertical' shapes by design (aspect ratios 2:1 or 9:16)
 * - Avatar style requires 'thumb' or 'square' shapes (1:1 aspect ratio)
 * - Circular borders on wide/vertical shapes would be visually incorrect
 * 
 * Therefore: ItemCard explicitly passes :avatar="false" to ImgShape
 * This ensures no circular borders are ever applied, regardless of entity type
 */
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

/* Selected state */
.item-card.is-selected {
    box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* Marker bars (left side accent) - ItemCard already has border-left */
.item-card.marker-primary {
    border-left-color: var(--color-primary-bg);
}

.item-card.marker-secondary {
    border-left-color: var(--color-secondary-bg);
}

.item-card.marker-accent {
    border-left-color: var(--color-accent-bg);
}

.item-card.marker-muted {
    border-left-color: var(--color-muted-bg);
}

.item-card.marker-warning {
    border-left-color: var(--color-warning-bg);
}

.item-card.marker-positive {
    border-left-color: var(--color-positive-bg);
}

.item-card.marker-negative {
    border-left-color: var(--color-negative-bg);
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
