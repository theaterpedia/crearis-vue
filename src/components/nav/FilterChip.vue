<template>
    <button class="filter-chip" :class="{
        'filter-chip--active': active,
        'filter-chip--clearable': clearable && active
    }" @click="handleClick">
        <component v-if="iconComponent" :is="iconComponent" :size="14" class="filter-chip__icon" />
        <span class="filter-chip__label">{{ label }}</span>
        <X v-if="clearable && active" :size="12" class="filter-chip__clear" @click.stop="$emit('clear')" />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Tag, Calendar, Users, FileText } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Props {
    label: string
    active?: boolean
    /** Icon name: 'tag' | 'calendar' | 'users' | 'file' */
    icon?: string
    clearable?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'click': []
    'clear': []
}>()

// Map icon names to components
const iconMap: Record<string, Component> = {
    'tag': Tag,
    'calendar': Calendar,
    'users': Users,
    'file': FileText
}

const iconComponent = computed(() => {
    return props.icon ? iconMap[props.icon] : null
})

function handleClick() {
    emit('click')
}
</script>

<style scoped>
.filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: hsl(var(--color-muted-bg));
    border: 1px solid transparent;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 500;
    color: hsl(var(--color-muted-contrast));
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
}

.filter-chip:hover {
    background: hsl(var(--color-accent-bg));
    color: hsl(var(--color-accent-contrast));
}

.filter-chip--active {
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
    border-color: hsl(var(--color-primary-base));
}

.filter-chip--active:hover {
    background: hsl(var(--color-primary-base) / 0.9);
}

.filter-chip__icon {
    width: 0.875rem;
    height: 0.875rem;
}

.filter-chip__label {
    line-height: 1;
}

.filter-chip__clear {
    width: 0.75rem;
    height: 0.75rem;
    margin-left: 0.125rem;
    opacity: 0.7;
}

.filter-chip__clear:hover {
    opacity: 1;
}
</style>
