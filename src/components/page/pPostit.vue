<template>
    <div class="p-postit"
        :class="[`color-${color}`, `position-${position}`, { 'is-aside': isAside, 'is-footer': isFooter }]"
        v-if="enabled">
        <div class="postit-inner">
            <h4 v-if="title" class="postit-title">{{ title }}</h4>
            <div v-if="content" class="postit-content" v-html="content"></div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    enabled?: boolean
    title?: string
    content?: string
    color?: 'yellow' | 'blue' | 'green' | 'pink' | 'orange'
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    isAside?: boolean
    isFooter?: boolean
}

withDefaults(defineProps<Props>(), {
    enabled: true,
    color: 'yellow',
    position: 'top-right',
    isAside: false,
    isFooter: false
})
</script>

<style scoped>
.p-postit {
    margin: 1rem 0;
    padding: 1.5rem;
    background: var(--postit-bg, #fef3c7);
    border-left: 4px solid var(--postit-accent, #f59e0b);
    border-radius: 0.5rem;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    transform: rotate(-0.5deg);
    transition: transform 0.2s;
}

.p-postit:hover {
    transform: rotate(0deg) translateY(-2px);
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.15);
}

.p-postit.is-aside {
    margin: 1rem 0;
}

.p-postit.is-footer {
    margin: 2rem 0;
}

/* Color variations */
.p-postit.color-yellow {
    --postit-bg: #fef3c7;
    --postit-accent: #f59e0b;
}

.p-postit.color-blue {
    --postit-bg: #dbeafe;
    --postit-accent: #3b82f6;
}

.p-postit.color-green {
    --postit-bg: #d1fae5;
    --postit-accent: #10b981;
}

.p-postit.color-pink {
    --postit-bg: #fce7f3;
    --postit-accent: #ec4899;
}

.p-postit.color-orange {
    --postit-bg: #fed7aa;
    --postit-accent: #f97316;
}

/* Position variations (mostly visual hints, actual positioning handled by parent) */
.p-postit.position-top-left {
    transform: rotate(-1deg);
}

.p-postit.position-top-right {
    transform: rotate(1deg);
}

.p-postit.position-bottom-left {
    transform: rotate(0.5deg);
}

.p-postit.position-bottom-right {
    transform: rotate(-0.5deg);
}

.p-postit.position-center {
    transform: rotate(0deg);
}

.postit-inner {
    font-family: var(--body);
}

.postit-title {
    margin: 0 0 0.75rem 0;
    font-family: var(--headings);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--postit-accent);
}

.postit-content {
    color: var(--color-text);
    line-height: 1.6;
}

.postit-content :deep(p) {
    margin: 0.5rem 0;
}

.postit-content :deep(p:first-child) {
    margin-top: 0;
}

.postit-content :deep(p:last-child) {
    margin-bottom: 0;
}
</style>
