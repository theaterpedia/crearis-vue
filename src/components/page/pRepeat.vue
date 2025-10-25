<template>
    <div class="p-repeat" :class="{ 'is-footer': isFooter }" v-if="enabled">
        <Heading v-if="title" :headline="title" as="h3" />
        <div class="repeat-grid" :class="`repeat-cols-${columns}`">
            <div v-for="(section, index) in sections" :key="index" class="repeat-section">
                <div v-if="section.content" class="repeat-content" v-html="section.content"></div>
                <slot :name="`section-${index}`" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Heading from '@/components/Heading.vue'

interface RepeatSection {
    content?: string
}

interface Props {
    enabled?: boolean
    title?: string
    sections?: RepeatSection[]
    sectionType?: string
    columns?: number
    customContent?: string
    isFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    enabled: false,
    columns: 3,
    sections: () => [],
    isFooter: true
})
</script>

<style scoped>
.p-repeat {
    margin: 3rem 0;
}

.p-repeat.is-footer {
    padding: 2rem 0;
    border-top: 1px solid var(--color-border, #e5e7eb);
}

.repeat-grid {
    display: grid;
    gap: 2rem;
    margin-top: 2rem;
}

.repeat-cols-1 {
    grid-template-columns: 1fr;
}

.repeat-cols-2 {
    grid-template-columns: repeat(2, 1fr);
}

.repeat-cols-3 {
    grid-template-columns: repeat(3, 1fr);
}

.repeat-cols-4 {
    grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1023px) {

    .repeat-cols-3,
    .repeat-cols-4 {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 767px) {

    .repeat-cols-2,
    .repeat-cols-3,
    .repeat-cols-4 {
        grid-template-columns: 1fr;
    }
}

.repeat-section {
    padding: 1.5rem;
    background: var(--color-card-bg);
    border-radius: 0.5rem;
}

.repeat-content {
    color: var(--color-text);
    line-height: 1.6;
}

.repeat-content :deep(h4) {
    margin: 0 0 0.75rem 0;
    font-family: var(--headings);
    font-size: 1.125rem;
    color: var(--color-card-contrast);
}

.repeat-content :deep(p) {
    margin: 0.5rem 0;
}

.repeat-content :deep(ul),
.repeat-content :deep(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.repeat-content :deep(a) {
    color: var(--color-accent-bg);
    text-decoration: none;
}

.repeat-content :deep(a:hover) {
    text-decoration: underline;
}
</style>
