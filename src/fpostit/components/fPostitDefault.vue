<template>
    <div :data-fpostcontainer="true" :data-fpostkey="postitKey">
        <!-- Trigger slot -->
        <slot name="trigger" :open="handleOpen">
            <button :data-fpostlink="true" :data-fpostkey="postitKey" :data-hlogic="hlogic" @click="handleOpen"
                class="fpostit-default-trigger">
                <span v-if="svg" v-html="svg" class="trigger-svg"></span>
                {{ title }}
            </button>
        </slot>

        <!-- Hidden content (for HTML discovery pattern) -->
        <div :data-fpostcontent="true" :data-color="color" :data-image="image" style="display: none"
            class="fpostit-hidden-content">
            <slot name="content"></slot>

            <!-- Action buttons -->
            <template v-if="actions && actions.length > 0">
                <a v-for="(action, index) in actions" :key="index" :data-fpostact1="index === 0 ? true : undefined"
                    :data-fpostact2="index === 1 ? true : undefined" :href="action.href || 'javascript:void(0)'"
                    :target="action.target || '_self'" class="fpostit-hidden-action">
                    {{ action.label }}
                </a>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFpostitController } from '../composables/useFpostitController'
import type { HorizontalLogic, PostitColor, FpostitAction } from '../types'

const props = withDefaults(defineProps<{
    /** Unique post-it key (p1-p9) */
    postitKey: string

    /** Display title */
    title: string

    /** Theme color */
    color?: PostitColor

    /** Horizontal positioning logic */
    hlogic?: HorizontalLogic

    /** Optional image URL */
    image?: string

    /** Optional SVG icon */
    svg?: string

    /** Action buttons (max 2) */
    actions?: FpostitAction[]

    /** Auto-discover from DOM on mount */
    autoDiscover?: boolean
}>(), {
    color: 'primary',
    hlogic: 'default',
    autoDiscover: true
})

const controller = useFpostitController()
const triggerElement = ref<HTMLElement>()

function handleOpen(event: Event) {
    const target = event.currentTarget as HTMLElement
    controller.openPostit(props.postitKey, target)
}

onMounted(() => {
    if (props.autoDiscover) {
        // Let the controller discover this post-it from DOM
        controller.discoverFromDOM()
    }
})
</script>

<style scoped>
.fpostit-default-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
}

.fpostit-default-trigger:hover {
    opacity: 0.9;
}

.trigger-svg :deep(svg) {
    width: 1.25rem;
    height: 1.25rem;
}

.fpostit-hidden-content {
    display: none !important;
}

.fpostit-hidden-action {
    display: none !important;
}
</style>
