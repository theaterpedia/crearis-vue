<template>
    <div class="sysreg-filter-set">
        <!-- Filter Controls -->
        <div class="filter-controls">
            <div class="control-row">
                <!-- Status Filter -->
                <div class="filter-group">
                    <SysregSelect v-model="localFilters.status" tagfamily="status" :entity="entity" label="Status"
                        placeholder="All status" :disabled="disabled" @change="handleFilterChange" />
                </div>

                <!-- CTags Age Group -->
                <div class="filter-group">
                    <SysregBitGroupSelect v-model="localFilters.ctags_age_group" bit-group="age_group" label="Age Group"
                        :disabled="disabled" @change="handleFilterChange" />
                </div>

                <!-- CTags Subject Type -->
                <div class="filter-group">
                    <SysregBitGroupSelect v-model="localFilters.ctags_subject_type" bit-group="subject_type"
                        label="Subject Type" :disabled="disabled" @change="handleFilterChange" />
                </div>

                <!-- CTags Access Level -->
                <div class="filter-group" v-if="showAccessLevel">
                    <SysregBitGroupSelect v-model="localFilters.ctags_access_level" bit-group="access_level"
                        label="Access" :disabled="disabled" @change="handleFilterChange" />
                </div>

                <!-- CTags Quality -->
                <div class="filter-group" v-if="showQuality">
                    <SysregBitGroupSelect v-model="localFilters.ctags_quality" bit-group="quality" label="Quality"
                        :disabled="disabled" @change="handleFilterChange" />
                </div>
            </div>

            <!-- Topic Tags (Multi-Toggle) -->
            <div class="filter-group full-width" v-if="showTopicTags">
                <label class="filter-label">Topics</label>
                <SysregMultiToggle
                    :model-value="localFilters.ttags.length > 0 ? bitsToByteArray(localFilters.ttags) : '\\x00'"
                    tagfamily="ttags" :columns="3" :disabled="disabled" @change="handleTopicChange" />
            </div>

            <!-- Domain Tags (Multi-Toggle) -->
            <div class="filter-group full-width" v-if="showDomainTags">
                <label class="filter-label">Domains</label>
                <SysregMultiToggle
                    :model-value="localFilters.dtags.length > 0 ? bitsToByteArray(localFilters.dtags) : '\\x00'"
                    tagfamily="dtags" :columns="3" :disabled="disabled" @change="handleDomainChange" />
            </div>
        </div>

        <!-- Active Filters Display -->
        <div v-if="activeChips.length > 0" class="active-filters">
            <div class="active-filters-header">
                <span class="active-filters-label">Active Filters:</span>
                <button class="clear-all-btn" @click="handleClearAll" :disabled="disabled">
                    Clear All
                </button>
            </div>

            <div class="filter-chips">
                <FilterChip v-for="(chip, index) in activeChips" :key="`${chip.type}-${chip.value}`" :label="chip.label"
                    :variant="getChipVariant(chip.type)" :removable="!disabled" @remove="handleRemoveChip(chip)" />
            </div>

            <div class="filter-stats" v-if="showStats">
                <span class="stats-text">{{ resultCount }} result{{ resultCount !== 1 ? 's' : '' }}</span>
            </div>
        </div>

        <!-- Saved Filter Sets -->
        <div v-if="showSavedFilters && savedFilterNames.length > 0" class="saved-filters">
            <label class="saved-filters-label">Saved Filters:</label>
            <div class="saved-filter-buttons">
                <button v-for="name in savedFilterNames" :key="name" class="saved-filter-btn"
                    @click="handleLoadFilterSet(name)" :disabled="disabled">
                    {{ name }}
                </button>
            </div>
        </div>

        <!-- Save Current Filter Set -->
        <div v-if="showSavedFilters && hasActiveFiltersValue" class="save-filter-section">
            <input v-model="newFilterSetName" type="text" placeholder="Filter set name..." class="filter-set-input"
                @keyup.enter="handleSaveFilterSet" :disabled="disabled" />
            <button class="save-filter-btn" @click="handleSaveFilterSet"
                :disabled="disabled || !newFilterSetName.trim()">
                Save Filter Set
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FilterChip from './FilterChip.vue'
import SysregSelect from './SysregSelect.vue'
import SysregBitGroupSelect from './SysregBitGroupSelect.vue'
import SysregMultiToggle from './SysregMultiToggle.vue'
import {
    useGalleryFilters,
    type GalleryFilters,
    type ActiveFilterChip
} from '@/composables/useGalleryFilters'
import { bitsToByteArray, byteArrayToBits } from '@/composables/useSysregTags'

interface Props {
    entity?: string
    disabled?: boolean
    showTopicTags?: boolean
    showDomainTags?: boolean
    showAccessLevel?: boolean
    showQuality?: boolean
    showStats?: boolean
    resultCount?: number
    showSavedFilters?: boolean
    autoApply?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    entity: 'images',
    disabled: false,
    showTopicTags: true,
    showDomainTags: true,
    showAccessLevel: true,
    showQuality: true,
    showStats: false,
    resultCount: 0,
    showSavedFilters: true,
    autoApply: true
})

const emit = defineEmits<{
    'update:filters': [filters: GalleryFilters]
    'apply': [query: string]
    'change': [filters: GalleryFilters]
}>()

// Initialize filter composable
const {
    activeFilters,
    hasActiveFilters,
    activeFilterChips,
    queryString,
    removeFilter,
    clearAllFilters,
    savedFilters,
    saveFilterSet,
    loadFilterSet,
    getSavedFilterNames
} = useGalleryFilters({
    entity: props.entity,
    autoFetch: false
})

// Local filter state (synced with composable)
const localFilters = computed({
    get: () => activeFilters.value,
    set: (value: GalleryFilters) => {
        activeFilters.value = value
    }
})

// Active filter chips
const activeChips = computed(() => activeFilterChips.value)

// Has active filters
const hasActiveFiltersValue = computed(() => hasActiveFilters.value)

// Saved filter names
const savedFilterNames = computed(() => getSavedFilterNames())

// New filter set name input
const newFilterSetName = ref('')

// Get chip variant based on type
function getChipVariant(type: string): 'default' | 'status' | 'topic' | 'domain' | 'ctags' {
    if (type === 'status') return 'status'
    if (type === 'ttags') return 'topic'
    if (type === 'dtags') return 'domain'
    if (type.startsWith('ctags_')) return 'ctags'
    return 'default'
}

// Handle filter change
function handleFilterChange() {
    emit('update:filters', localFilters.value)
    emit('change', localFilters.value)

    if (props.autoApply) {
        emit('apply', queryString.value)
    }
}

// Handle topic tag change
function handleTopicChange(bits: number[]) {
    localFilters.value.ttags = bits
    handleFilterChange()
}

// Handle domain tag change
function handleDomainChange(bits: number[]) {
    localFilters.value.dtags = bits
    handleFilterChange()
}

// Handle remove chip
function handleRemoveChip(chip: ActiveFilterChip) {
    removeFilter(chip)
    handleFilterChange()
}

// Handle clear all
function handleClearAll() {
    clearAllFilters()
    handleFilterChange()
}

// Handle save filter set
function handleSaveFilterSet() {
    const name = newFilterSetName.value.trim()
    if (name) {
        saveFilterSet(name)
        newFilterSetName.value = ''
    }
}

// Handle load filter set
function handleLoadFilterSet(name: string) {
    loadFilterSet(name)
    handleFilterChange()
}

// Watch for external changes
watch(
    () => queryString.value,
    (newQuery) => {
        if (props.autoApply) {
            emit('apply', newQuery)
        }
    }
)
</script>

<style scoped>
.sysreg-filter-set {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 8px;
}

.filter-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.control-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group.full-width {
    grid-column: 1 / -1;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.active-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.active-filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.active-filters-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.clear-all-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-all-btn:hover:not(:disabled) {
    background: var(--color-background);
    color: var(--color-text);
}

.clear-all-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.filter-stats {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

.stats-text {
    font-weight: 500;
}

.saved-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.saved-filters-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.saved-filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.saved-filter-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.saved-filter-btn:hover:not(:disabled) {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
}

.saved-filter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.save-filter-section {
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.filter-set-input {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-background);
    color: var(--color-text);
}

.filter-set-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.save-filter-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    background: var(--color-primary, #3b82f6);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.save-filter-btn:hover:not(:disabled) {
    background: var(--color-primary-dark, #2563eb);
}

.save-filter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
