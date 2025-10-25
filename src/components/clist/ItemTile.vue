<template>
    <div class="item-tile" :class="sizeClass">
        <!-- Background Image -->
        <div v-if="cimg" class="tile-background" :style="backgroundStyle"></div>

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

const backgroundStyle = computed(() => {
    if (props.cimg) {
        return {
            backgroundImage: `url('${props.cimg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }
    }
    return {}
})
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

/* Background */
.tile-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
