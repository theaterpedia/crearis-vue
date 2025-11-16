<template>
    <div class="p-context" :class="{ 'is-aside': isAside, 'is-footer': isFooter }" v-if="content || $slots.default">
        <div class="context-inner">
            <div v-if="content" class="context-content" v-html="content"></div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    content?: string
    isAside?: boolean
    isFooter?: boolean
}

withDefaults(defineProps<Props>(), {
    isAside: true,
    isFooter: false
})
</script>

<style scoped>
.p-context {
    margin: 1rem 0;
    padding: 1.25rem;
    background: var(--color-muted-bg);
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.6;
}

.p-context.is-footer {
    margin: 2rem 0;
    padding: 2rem;
}

.context-inner {
    color: var(--color-text);
}

.context-content :deep(p) {
    margin: 0.75rem 0;
}

.context-content :deep(p:first-child) {
    margin-top: 0;
}

.context-content :deep(p:last-child) {
    margin-bottom: 0;
}

.context-content :deep(a) {
    color: var(--color-accent-bg);
    text-decoration: underline;
}

.context-content :deep(a:hover) {
    text-decoration: none;
}

.context-content :deep(ul),
.context-content :deep(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
}

.context-content :deep(li) {
    margin: 0.25rem 0;
}
</style>
