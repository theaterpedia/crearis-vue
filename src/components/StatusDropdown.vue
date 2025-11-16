<template>
    <div class="status-dropdown" ref="dropdownRef">
        <button type="button" class="status-dropdown-trigger" :class="`status-${getColorVariant(currentStatus.name)}`"
            @click="isOpen = !isOpen">
            <span class="status-label">{{ currentStatus.displayName }}</span>
            <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16" viewBox="0 0 16 16"
                fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        <div v-if="isOpen" class="status-dropdown-menu">
            <button v-for="status in availableStatuses" :key="status.value" type="button" class="status-option"
                :class="[`status-${getColorVariant(status.name)}`, { active: props.modelValue === status.value }]"
                @click="selectStatus(status.value)">
                <span class="status-name">{{ status.displayName }}</span>
                <span v-if="status.displayDesc" class="status-desc">{{ status.displayDesc }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref as vueRef, computed, onMounted, onUnmounted } from 'vue'
import { useStatus } from '../composables/useStatus'

type ColorVariant = 'muted' | 'primary' | 'warning' | 'positive' | 'secondary' | 'negative'

const props = withDefaults(defineProps<{
    modelValue: number  // status_id from database
    table: string
    lang?: string
}>(), {
    lang: 'de'
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

const { getStatusesForTable, getStatusIdByName, status4Lang } = useStatus()
const dropdownRef = vueRef<HTMLElement>()
const isOpen = vueRef(false)

// Get available statuses for this table
const availableStatuses = computed(() => {
    const statuses = getStatusesForTable(props.table)
    return statuses.map(s => {
        const info = status4Lang(s.value, props.table, props.lang)
        return {
            id: s.id,
            name: s.name,
            value: s.value,
            displayName: info?.displayName || s.name,
            displayDesc: info?.displayDesc
        }
    })
})

// Status color mapping for visual styling
const colorMap: Record<string, ColorVariant> = {
    idea: 'muted',
    new: 'primary',
    draft: 'warning',
    active: 'positive',
    publish: 'positive',
    final: 'positive',
    reopen: 'secondary',
    trash: 'negative',
    published: 'positive',
    archived: 'muted',
    progress: 'warning',
    done: 'positive',
    synced: 'positive',
    released: 'positive',
    public: 'positive',
    verified: 'positive',
    deleted: 'negative',
    linked: 'secondary'
}

// Get current status info
const currentStatus = computed(() => {
    const info = status4Lang(props.modelValue, props.table, props.lang)
    // Find the status entry to get the name for color mapping
    const status = availableStatuses.value.find(s => s.value === props.modelValue)
    return {
        displayName: info?.displayName || `Status ${props.modelValue}`,
        name: status?.name || 'new'
    }
})

function getStatusLabel(statusValue: number): string {
    const statusInfo = status4Lang(statusValue, props.table, props.lang)
    return statusInfo?.displayName || `Status ${statusValue}`
}

function getColorVariant(statusName: string): ColorVariant {
    return colorMap[statusName] || 'muted'
}

function selectStatus(statusValue: number) {
    emit('update:modelValue', statusValue)
    isOpen.value = false
}

// Click outside to close
function handleClickOutside(event: Event) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.status-dropdown {
    position: relative;
    display: inline-block;
}

.status-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 2px solid transparent;
    border-radius: var(--radius-button);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
}

.status-dropdown-trigger:hover {
    opacity: 0.9;
}

.chevron {
    transition: transform 0.2s ease;
}

.chevron.rotate-180 {
    transform: rotate(180deg);
}

.status-dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 200px;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0.5rem;
    z-index: 1000;
}

.status-option {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    border: none;
    border-radius: var(--radius-button);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.status-option:hover {
    background: var(--color-muted-bg);
}

.status-option.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.status-name {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-desc {
    display: block;
    font-size: 0.75rem;
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    margin-top: 0.25rem;
    opacity: 0.8;
}

/* Status color variants */
.status-muted {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.status-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.status-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.status-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.status-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}
</style>
