<template>
    <div class="corner-banner" :class="sizeClass" :style="{ backgroundColor: color }">
        <span class="banner-text">{{ text }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    text?: string
    color?: string
    size?: 'small' | 'normal'
}

const props = withDefaults(defineProps<Props>(), {
    text: 'demo',
    color: 'var(--color-warning-bg)',
    size: 'normal'
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

/* Normal size - for fullwidth components like hero, columns */
.corner-banner.size-normal {
    width: 12rem;
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
    width: 8rem;
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
