<template>
    <div v-if="isDemo" class="corner-banner" :class="sizeClass" :style="{ backgroundColor: color }">
        <span v-if="size !== 'thumb'" class="banner-text">{{ text }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// No longer need useStatus - using status_display from database
text ?: string
color ?: string
size ?: 'thumb' | 'tile' | 'card' | 'small' | 'normal'
// Entity data for auto-detection
entity ?: {
    xmlid?: string
        status_display?: string  // Computed status display from database
        table?: string // Entity table name (posts, events, instructors, etc.)
}
}

const props = withDefaults(defineProps<Props>(), {
    text: 'demo',
    color: 'var(--color-warning-bg)',
    size: 'normal'
})

// Auto-detect if this is a demo entity
const isDemo = computed(() => {
    if (!props.entity) return true // Show if no entity provided (manual mode)

    // Check xmlid starts with '_demo'
    if (props.entity.xmlid?.startsWith('_demo')) return true

    // Check if status_display contains 'demo' (case-insensitive)
    if (props.entity.status_display?.toLowerCase().includes('demo')) return true

    return false
})

const sizeClass = computed(() => `size-${props.size}`)
</script>

<style scoped>
.corner-banner {
    position: absolute;
    top: 0;
    right: 0;
    transform: rotate(45deg);
    transform-origin: top right;
    background-color: var(--color-warning-bg);
    color: var(--color-warning-contrast, #000);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 5;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Thumb size - 15x15px square rotated 45° creating triangle (no text) */
.corner-banner.size-thumb {
    width: 15px;
    height: 15px;
    top: -7.5px;
    right: -7.5px;
    transform: rotate(45deg);
    transform-origin: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Tile size - 60% of small for ItemTile */
.corner-banner.size-tile {
    width: 9.6rem;
    height: 1.05rem;
    top: 0.6rem;
    right: -1.2rem;
    font-size: 0.5rem;
}

.corner-banner.size-tile .banner-text {
    display: block;
    padding-top: 0.225rem;
    text-align: center;
}

/* Card size - synonym for small, for ItemCard */
.corner-banner.size-card {
    width: 16rem;
    height: 1.75rem;
    top: 1rem;
    right: -2rem;
    font-size: 0.625rem;
}

.corner-banner.size-card .banner-text {
    display: block;
    padding-top: 0.375rem;
    text-align: center;
}

/* Normal size - for fullwidth components like hero, columns */
.corner-banner.size-normal {
    width: 24rem;
    height: 2.5rem;
    top: 1.5rem;
    right: -3rem;
    font-size: 0.875rem;
}

.corner-banner.size-normal .banner-text {
    display: block;
    padding-top: 0.625rem;
    text-align: center;
}

/* Small size - for components inside aside-left */
.corner-banner.size-small {
    width: 16rem;
    height: 1.75rem;
    top: 1rem;
    right: -2rem;
    font-size: 0.625rem;
}

.corner-banner.size-small .banner-text {
    display: block;
    padding-top: 0.375rem;
    text-align: center;
}

.banner-text {
    display: block;
    user-select: none;
}
</style>
