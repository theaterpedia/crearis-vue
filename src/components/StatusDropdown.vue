<template>
    <div class="status-dropdown" ref="dropdownRef">
        <button type="button" class="status-dropdown-trigger" :class="`status-${getColorVariant(props.modelValue)}`"
            @click="isOpen = !isOpen">
            <span class="status-label">{{ getDisplayName(props.modelValue) }}</span>
            <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16" viewBox="0 0 16 16"
                fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        <div v-if="isOpen" class="status-dropdown-menu">
            <button v-for="status in availableStatuses" :key="status.name" type="button" class="status-option"
                :class="[`status-${getColorVariant(status.name)}`, { active: props.modelValue === status.name }]"
                @click="selectStatus(status.name)">
                <span class="status-name">{{ status.displayName }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref as vueRef, computed, onMounted, onUnmounted } from 'vue'

type ColorVariant = 'muted' | 'primary' | 'warning' | 'positive' | 'secondary' | 'negative'

interface StatusEntry {
    name: string
    displayName: string
}

const props = withDefaults(defineProps<{
    modelValue: string  // status name (e.g., 'draft', 'published')
    table: string
    lang?: string
}>(), {
    lang: 'de'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const dropdownRef = vueRef<HTMLElement>()
const isOpen = vueRef(false)
const statuses = vueRef<StatusEntry[]>([])

// Fetch available statuses for this table
onMounted(async () => {
    try {
        // Fetch statuses from sysreg_status table filtered by family
        const response = await fetch(`/api/sysreg/status?family=${props.table}`)
        if (response.ok) {
            const data = await response.json()
            // Parse status entries - name format is "family > statusname"
            statuses.value = (data.items || []).map((item: any) => {
                const nameParts = item.name.split(' > ')
                const shortName = nameParts[nameParts.length - 1] || item.name
                return {
                    name: shortName,
                    displayName: getDisplayTranslation(shortName)
                }
            })
        }
    } catch (error) {
        console.error('Error fetching statuses:', error)
        // Fallback to common statuses
        statuses.value = getDefaultStatuses()
    }

    // Add listener after mount
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// Available statuses computed from fetched data
const availableStatuses = computed(() => statuses.value)

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

// Get display name for status
function getDisplayName(statusName: string): string {
    const status = availableStatuses.value.find(s => s.name === statusName)
    return status?.displayName || getDisplayTranslation(statusName)
}

// Simple translation map (German)
function getDisplayTranslation(name: string): string {
    const translations: Record<string, string> = {
        new: 'Neu',
        draft: 'Entwurf',
        publish: 'Veröffentlicht',
        published: 'Veröffentlicht',
        active: 'Aktiv',
        done: 'Erledigt',
        progress: 'In Arbeit',
        trash: 'Papierkorb',
        archived: 'Archiviert',
        released: 'Freigegeben',
        verified: 'Verifiziert',
        deleted: 'Gelöscht'
    }
    return translations[name] || name.charAt(0).toUpperCase() + name.slice(1)
}

function getDefaultStatuses(): StatusEntry[] {
    // Fallback statuses based on table
    const commonStatuses = ['new', 'draft', 'published', 'archived']
    return commonStatuses.map(name => ({
        name,
        displayName: getDisplayTranslation(name)
    }))
}

function getColorVariant(statusName: string): ColorVariant {
    return colorMap[statusName] || 'muted'
}

function selectStatus(statusName: string) {
    emit('update:modelValue', statusName)
    isOpen.value = false
}

// Click outside to close
function handleClickOutside(event: Event) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false
    }
}
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
