<!--
  DropdownList.vue - Dropdown wrapper around ItemList
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
-->
<template>
    <VDropdown v-model:shown="isOpen" theme="dropdown-list" :triggers="[]" :auto-hide="true" :distance="8"
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
            <div class="dropdown-content" :style="systemTheme">
                <div class="dropdown-header">
                    <h4>{{ title || `Select ${entity}` }}</h4>
                    <button class="close-btn" @click="hide" aria-label="Close">×</button>
                </div>

                <!-- CL2: Use ItemList with entity fetching -->
                <div class="dropdown-list-wrapper">
                    <ItemList :entity="entity" :project="project" :filterIds="filterIds" item-type="row" :size="size"
                        :dataMode="dataMode" :multiSelect="multiSelect" :selectedIds="selectedIds" interaction="static"
                        @item-click="(item) => handleSelect(item, hide)" @update:selectedIds="handleSelectedIdsUpdate"
                        @selectedXml="handleSelectedXml" @selected="handleSelected" />
                </div>
            </div>
        </template>
    </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import ItemList from './ItemList.vue'

interface Props {
    entity: 'posts' | 'events' | 'instructors' | 'projects' | 'images'
    project?: string
    title?: string
    size?: 'small' | 'medium'
    filterIds?: number[] // Optional array of IDs to filter by
    // Selection props
    dataMode?: boolean // True = uses entity data and emits selections
    multiSelect?: boolean // Allow multiple selections
    selectedIds?: number | number[] // v-model for selected item IDs
    displayXml?: boolean // Show xmlID in trigger
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    dataMode: true,
    multiSelect: false,
    displayXml: false
})

const emit = defineEmits<{
    select: [item: any]
    'update:selectedIds': [value: number | number[] | null]
    'selectedXml': [value: string | string[]]
    'selected': [value: any | any[]]
}>()

const isOpen = ref(false)

// System theme for dropdown (per FLOATING_VUE_AND_PANELS_GUIDE.md)
const systemTheme = computed(() => ({
    '--color-bg': 'var(--system-bg, #ffffff)',
    '--color-card-bg': 'var(--system-card-bg, #ffffff)',
    '--color-border': 'var(--system-border, #e5e7eb)',
    '--color-contrast': 'var(--system-contrast, #1f2937)',
    '--color-dimmed': 'var(--system-dimmed, #6b7280)',
    '--color-inverted': '0'
}))

function openDropdown() {
    isOpen.value = true
}

function handleSelect(item: any, hide: () => void) {
    emit('select', item)
    hide()
}

// Forward selection events from ItemList
function handleSelectedIdsUpdate(value: number | number[] | null) {
    emit('update:selectedIds', value)
}

function handleSelectedXml(value: string | string[]) {
    emit('selectedXml', value)
}

function handleSelected(value: any | any[]) {
    emit('selected', value)
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
    max-width: 24rem;
    max-height: 60vh;
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

.dropdown-list-wrapper {
    overflow-y: auto;
    padding: 0.5rem;
}

/* Make items clickable */
.dropdown-list-wrapper :deep(.item-row) {
    cursor: pointer;
    border-radius: var(--radius-small, 0.375rem);
    transition: background 0.2s;
}

.dropdown-list-wrapper :deep(.item-row:hover) {
    background: var(--color-muted-bg);
}
</style>
