<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="modal-overlay" @click.self="close">
                <div class="modal-container" :style="systemTheme">
                    <div class="modal-header">
                        <h3>{{ title || `Select ${entity}` }}</h3>
                        <button class="close-btn" @click="close" aria-label="Close">×</button>
                    </div>

                    <div class="modal-toolbar">
                        <button class="view-toggle" :class="{ active: display === 'list' }" @click="display = 'list'">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                            List
                        </button>
                        <button class="view-toggle" :class="{ active: display === 'gallery' }"
                            @click="display = 'gallery'">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="3" width="6" height="6" stroke="currentColor" stroke-width="2" />
                                <rect x="11" y="3" width="6" height="6" stroke="currentColor" stroke-width="2" />
                                <rect x="3" y="11" width="6" height="6" stroke="currentColor" stroke-width="2" />
                                <rect x="11" y="11" width="6" height="6" stroke="currentColor" stroke-width="2" />
                            </svg>
                            Gallery
                        </button>
                    </div>

                    <div class="modal-content">
                        <ItemList v-if="display === 'list'" :entity="entity" :project="project" item-type="row"
                            :size="size" interaction="static" @item-click="handleSelect" />
                        <ItemGallery v-else :entity="entity" :project="project" item-type="card" :size="size"
                            :variant="variant" interaction="static" @item-click="handleSelect" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ItemList from './ItemList.vue'
import ItemGallery from './ItemGallery.vue'

interface Props {
    isOpen: boolean
    entity: 'posts' | 'events' | 'instructors'
    project?: string
    title?: string
    size?: 'small' | 'medium'
    variant?: 'default' | 'square' | 'wide' | 'vertical'
    defaultDisplay?: 'list' | 'gallery'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium',
    variant: 'square',
    defaultDisplay: 'gallery'
})

const emit = defineEmits<{
    close: []
    select: [item: any]
}>()

const display = ref<'list' | 'gallery'>(props.defaultDisplay)

// System theme for modal (per FLOATING_VUE_AND_PANELS_GUIDE.md)
const systemTheme = computed(() => ({
    '--color-bg': 'var(--system-bg, #ffffff)',
    '--color-card-bg': 'var(--system-card-bg, #ffffff)',
    '--color-border': 'var(--system-border, #e5e7eb)',
    '--color-contrast': 'var(--system-contrast, #1f2937)',
    '--color-dimmed': 'var(--system-dimmed, #6b7280)',
    '--color-inverted': '0'
}))

function close() {
    emit('close')
}

function handleSelect(item: any) {
    emit('select', item)
    emit('close')
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 1rem;
}

.modal-container {
    background: var(--color-bg);
    border-radius: var(--radius-card, 0.5rem);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 60rem;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: var(--color-dimmed);
    padding: 0;
    width: 2.5rem;
    height: 2.5rem;
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

.modal-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.view-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small, 0.375rem);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.view-toggle:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.view-toggle.active {
    background: var(--color-primary-bg);
    color: white;
    border-color: var(--color-primary-bg);
}

.modal-content {
    overflow-y: auto;
    padding: 1.5rem;
    flex: 1;
}

/* Make items clickable */
.modal-content :deep(.item-row),
.modal-content :deep(.item-card),
.modal-content :deep(.item-tile) {
    cursor: pointer;
    transition: all 0.2s;
}

.modal-content :deep(.item-row:hover) {
    background: var(--color-muted-bg);
}

.modal-content :deep(.item-card:hover),
.modal-content :deep(.item-tile:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(0.95);
    opacity: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .modal-container {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }

    .modal-toolbar {
        padding: 0.75rem 1rem;
    }

    .view-toggle {
        flex: 1;
        justify-content: center;
    }
}
</style>
