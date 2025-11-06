<template>
    <div class="item-row" :class="sizeClass" @click="$emit('click', $event)">
        <div class="row-col-image">
            <!-- Image with data mode -->
            <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'tile'" :variant="variant || 'default'"
                class="image-box" />
            <!-- Legacy image -->
            <img v-else-if="cimg" :src="cimg" :alt="heading" class="image-box" loading="lazy" />
            <!-- Placeholder -->
            <div v-else class="image-box image-placeholder"></div>
        </div>
        <div class="row-col-content">
            <HeadingParser :content="heading" :as="headingLevel" :compact="true" v-bind="$attrs" />
        </div>
        <div v-if="$slots.default" class="row-col-slot">
            <slot></slot>
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
    cols?: 1 | 2 | 3
    data?: ImgShapeData
    shape?: 'card' | 'tile' | 'avatar'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    cols: 2
})

const emit = defineEmits<{
    click: [event: MouseEvent]
}>()

const dataMode = computed(() => props.data !== undefined)

const sizeClass = computed(() => `size-${props.size}`)

const headingLevel = computed(() => {
    if (props.size === 'small') return 'h5'
    if (props.size === 'large') return 'h4'
    return 'h4'
})
</script>

<style scoped>
.item-row {
    display: grid;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
    background-color: var(--color-card-bg);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.item-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Grid template with 2 columns by default */
.item-row {
    grid-template-columns: auto 1fr;
}

/* 3 columns when slot is provided */
.item-row:has(.row-col-slot) {
    grid-template-columns: auto 1fr auto;
}

/* Column widths */
.row-col-image {
    width: 80px;
}

.row-col-slot {
    min-width: 120px;
}

/* Image box */
.image-box {
    width: 80px;
    height: 80px;
    border-radius: 0.375rem;
    overflow: hidden;
    object-fit: cover;
}

.image-placeholder {
    background-color: var(--color-neutral-bg);
}

/* Size variants */
.size-small .row-col-image,
.size-small .image-box {
    width: 60px;
    height: 60px;
}

.size-small {
    max-height: 60px;
}

.size-medium {
    max-height: 80px;
}

.size-large .row-col-image,
.size-large .image-box {
    width: 100px;
    height: 100px;
}

.size-large {
    max-height: 100px;
}

.row-col-content {
    overflow: hidden;
}
</style>
