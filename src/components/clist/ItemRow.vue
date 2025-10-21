<template>
    <div class="item-row" :class="sizeClass" @click="$emit('click', $event)">
        <div class="row-col-image">
            <div class="image-box" :style="imageStyle"></div>
        </div>
        <div class="row-col-content">
            <HeadingParser :content="content" :as="headingLevel" :compact="true" v-bind="$attrs" />
        </div>
        <div v-if="$slots.default" class="row-col-slot">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HeadingParser from '../HeadingParser.vue'

interface Props {
    content: string
    cimg?: string
    size?: 'small' | 'medium' | 'large'
    cols?: 1 | 2 | 3
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    cols: 2
})

const emit = defineEmits<{
    click: [event: MouseEvent]
}>()

const sizeClass = computed(() => `size-${props.size}`)

const headingLevel = computed(() => {
    if (props.size === 'small') return 'h5'
    if (props.size === 'large') return 'h4'
    return 'h4'
})

const imageStyle = computed(() => {
    if (props.cimg) {
        return {
            backgroundImage: `url('${props.cimg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }
    }
    return {
        backgroundColor: 'var(--color-neutral-bg)'
    }
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
