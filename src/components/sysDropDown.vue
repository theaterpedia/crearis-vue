<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import 'floating-vue/dist/style.css'

interface DropdownItem {
    id: number | string
    name: string
    description?: string
}

const props = defineProps<{
    items: DropdownItem[]
    modelValue: number | string | null
    placeholder?: string
    disabled?: boolean
    label?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number | string | null]
}>()

const isOpen = ref(false)

// Debug logging
console.log('=== SYSDROPDOWN PROPS DEBUG ===')
console.log('Items received:', props.items)
console.log('Items count:', props.items?.length)
console.log('First item:', props.items?.[0])
console.log('ModelValue:', props.modelValue)
console.log('Placeholder:', props.placeholder)
console.log('Label:', props.label)

const selectedItem = computed(() => {
    if (!props.modelValue) return null
    return props.items.find(item => item.id === props.modelValue) || null
})

const displayText = computed(() => {
    if (selectedItem.value) {
        return selectedItem.value.name
    }
    return props.placeholder || 'Select...'
})

function selectItem(item: DropdownItem) {
    emit('update:modelValue', item.id)
    isOpen.value = false
}

function clearSelection() {
    emit('update:modelValue', null)
    isOpen.value = false
}
</script>

<template>
    <div class="sys-dropdown">
        <label v-if="label" class="dropdown-label">{{ label }}</label>
        <VDropdown v-model:shown="isOpen" :distance="6" :disabled="disabled" placement="bottom-start">
            <button type="button" class="dropdown-trigger" :class="{ active: isOpen, disabled }" :disabled="disabled">
                <span class="trigger-text" :class="{ placeholder: !selectedItem }">
                    {{ displayText }}
                </span>
                <svg class="trigger-icon" :class="{ open: isOpen }" width="16" height="16" viewBox="0 0 16 16"
                    fill="currentColor">
                    <path d="M4 6l4 4 4-4H4z" />
                </svg>
            </button>

            <template #popper>
                <div class="dropdown-menu">
                    <div v-if="items.length === 0" class="dropdown-empty">
                        No items available
                    </div>
                    <div v-else class="dropdown-items">
                        <button v-for="item in items" :key="item.id" type="button" class="dropdown-item"
                            :class="{ selected: item.id === modelValue }" @click="selectItem(item)">
                            <div class="item-name">{{ item.name }}</div>
                            <div v-if="item.description" class="item-description">{{ item.description }}</div>
                        </button>
                    </div>
                    <div v-if="modelValue !== null" class="dropdown-footer">
                        <button type="button" class="btn-clear" @click="clearSelection">
                            Clear selection
                        </button>
                    </div>
                </div>
            </template>
        </VDropdown>
    </div>
</template>

<style scoped>
.sys-dropdown {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.dropdown-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    font-size: 0.875rem;
    font-family: var(--font);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
}

.dropdown-trigger:hover:not(.disabled) {
    border-color: var(--color-primary-bg);
    background: var(--color-bg);
}

.dropdown-trigger.active {
    border-color: var(--color-primary-bg);
    background: var(--color-bg);
    color: var(--color-contrast);
}

.dropdown-trigger.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.trigger-text {
    flex: 1;
}

.trigger-text.placeholder {
    color: var(--color-muted-contrast);
    opacity: 0.7;
}

.trigger-icon {
    flex-shrink: 0;
    transition: transform 0.2s;
}

.trigger-icon.open {
    transform: rotate(180deg);
}

.dropdown-menu {
    min-width: 350px;
    max-width: 500px;
    background: var(--color-bg);
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.15);
    overflow: hidden;
}

.dropdown-empty {
    padding: 1rem;
    text-align: center;
    color: var(--color-muted-contrast);
    font-size: 0.875rem;
}

.dropdown-items {
    max-height: 600px;
    overflow-y: auto;
}

.dropdown-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid var(--color-border);
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background: var(--color-muted-bg);
}

.dropdown-item.selected {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.item-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: inherit;
}

.dropdown-item.selected .item-name {
    font-weight: 600;
}

.item-description {
    font-size: 0.75rem;
    opacity: 0.8;
    color: inherit;
}

.dropdown-footer {
    padding: 0.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-muted-bg);
}

.btn-clear {
    width: 100%;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--color-muted-contrast);
    font-size: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
}

.btn-clear:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger-contrast);
}
</style>
