<template>
    <VDropdown v-model:shown="isOpen" theme="dropdown-gallery" :triggers="[]" :auto-hide="true" :distance="8"
        placement="bottom-start">
        <!-- Trigger slot -->
        <slot name="trigger" :open="openDropdown" :is-open="isOpen">
            <button class="dropdown-trigger" @click="openDropdown">
                <slot name="trigger-content">Select {{ entity }}</slot>
                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16" viewBox="0 0 16 16"
                    fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
        </slot>

        <!-- Dropdown content -->
        <template #popper="{ hide }">
            <div class="dropdown-content" :style="{ ...systemTheme, maxWidth: contentMaxWidth }">
                <div class="dropdown-header">
                    <h4>{{ title || `Select ${entity}` }}</h4>
                    <button class="close-btn" @click="hide" aria-label="Close">×</button>
                </div>

                <!-- CL2: Use ItemGallery with entity fetching -->
                <div class="dropdown-gallery-wrapper">
                    <ItemGallery :entity="entity" :project="project" item-type="card" :size="size" :variant="variant"
                        interaction="static" @item-click="(item) => handleSelect(item, hide)" />
                </div>
            </div>
        </template>
    </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import ItemGallery from './ItemGallery.vue'

interface Props {
    entity: 'posts' | 'events' | 'instructors'
    project?: string
    title?: string
    size?: 'small' | 'medium'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    variant: 'square'
})

const emit = defineEmits<{
    select: [item: any]
}>()

const isOpen = ref(false)

// System theme for dropdown (per FLOATING_VUE_AND_PANELS_GUIDE.md)
const systemTheme = computed(() => ({
    '--color-bg': 'var(--system-bg, #ffffff)',
    '--color-card-bg': 'var(--system-card-bg, #ffffff)',
    '--color-border': 'var(--system-border, #e5e7eb)',
    '--color-contrast': 'var(--system-contrast, #1f2937)',
    '--color-dimmed': 'var(--system-dimmed, #6b7280)',
    '--color-inverted': '0',
    '--card-width': '21rem' // Required for width calculations in floating context
}))

// Compute max-width for dropdown-content based on size/variant
// Gallery needs more space than list: 32-48rem range
const contentMaxWidth = computed(() => {
    // Gallery displays cards in grid, needs wider container
    if (props.size === 'small') return '32rem'  // ~512px for small cards
    return '48rem'  // ~768px for medium cards (default)
})

function openDropdown() {
    isOpen.value = true
}

function handleSelect(item: any, hide: () => void) {
    emit('select', item)
    hide()
}
</script>

<style scoped>
.dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small, 0.375rem);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    color: var(--color-contrast);
}

.dropdown-trigger:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.chevron {
    transition: transform 0.2s;
}

.chevron.rotate-180 {
    transform: rotate(180deg);
}

.dropdown-content {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card, 0.5rem);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 32rem;
    /* max-width now set dynamically via contentMaxWidth computed */
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}

.dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.dropdown-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-dimmed);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-small, 0.375rem);
    transition: all 0.2s;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.dropdown-gallery-wrapper {
    overflow-y: auto;
    padding: 1rem;
}

/* Make items clickable */
.dropdown-gallery-wrapper :deep(.item-card),
.dropdown-gallery-wrapper :deep(.item-tile) {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.dropdown-gallery-wrapper :deep(.item-card:hover),
.dropdown-gallery-wrapper :deep(.item-tile:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
