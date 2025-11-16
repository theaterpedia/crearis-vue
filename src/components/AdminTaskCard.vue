<template>
    <div class="admin-task-card" :class="[`priority-${task.priority}`, `status-${task.status}`]">
        <!-- Task Header with HeadingParser -->
        <div class="task-header">
            <div class="task-title">
                <HeadingParser :content="task.name" as="h4" />
            </div>
            <div class="task-actions">
                <button v-if="task.status_name === 'trash'" class="action-btn restore-btn"
                    @click="$emit('restore', task)" title="Restore task">
                    ↺
                </button>
                <button v-else class="action-btn trash-btn" @click="$emit('trash', task)" title="Move to trash">
                    🗑
                </button>
            </div>
        </div>

        <!-- Task Description -->
        <p v-if="task.description" class="task-description">
            {{ truncatedDescription }}
        </p>

        <!-- Watch Task Status -->
        <div class="watch-status" :class="`watch-status-${watchStatus}`">
            <span class="status-indicator">●</span>
            <span>{{ watchStatusLabel }}</span>
        </div>

        <!-- Filter Options (when updates detected) -->
        <div v-if="hasUpdates && filterOptions.length > 0" class="filter-section">
            <label class="filter-label">Select items to process:</label>
            <div class="filter-options">
                <button v-for="option in filterOptions" :key="option.value" class="filter-option-btn"
                    :class="{ active: selectedFilter === option.value }" @click="selectFilter(option.value)">
                    {{ option.label }}
                </button>
            </div>
        </div>

        <!-- Execute Button (when updates detected and not in trash) -->
        <div v-if="hasUpdates && task.status_name !== 'trash'" class="action-section">
            <button class="execute-btn" @click="executeTask" :disabled="!selectedFilter">
                <span>▶</span> Execute {{ task.logic?.includes('watchcsv') ? 'Reset' : 'Save' }}
            </button>
        </div>

        <!-- Task Meta Information -->
        <div class="task-meta">
            <span class="meta-badge logic-badge">
                {{ logicLabel }}
            </span>
            <span v-if="task.entity_name" class="meta-badge entity-badge">
                📦 {{ task.entity_name }}
            </span>
            <span v-if="lastChecked" class="meta-badge time-badge">
                🕐 {{ lastChecked }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HeadingParser from './HeadingParser.vue'

interface WatchTask {
    id?: string
    name: string  // Renamed from title
    description?: string
    status?: number  // INTEGER FK to status table
    status_name?: string  // Status name from API (for display)
    category?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    logic?: string
    filter?: string
    entity_name?: string
    assigned_to?: string
    updatedFiles?: string[]
    updatedEntities?: string[]
    lastChecked?: string
}

interface FilterOption {
    value: string
    label: string
}

const props = defineProps<{
    task: WatchTask
}>()

const emit = defineEmits<{
    execute: [task: WatchTask, filter: string]
    trash: [task: WatchTask]
    restore: [task: WatchTask]
}>()

const selectedFilter = ref<string>('')

const truncatedDescription = computed(() => {
    if (!props.task.description) return ''
    return props.task.description.length > 150
        ? props.task.description.substring(0, 150) + '...'
        : props.task.description
})

const watchStatus = computed(() => {
    if (props.task.status_name === 'trash') return 'inactive'
    if (props.task.status_name === 'draft') return 'changes'
    return 'watching'
})

const watchStatusLabel = computed(() => {
    switch (watchStatus.value) {
        case 'inactive': return 'Inactive (Trashed)'
        case 'changes': return 'Changes Detected'
        case 'watching': return 'Watching...'
        default: return 'Unknown'
    }
})

const hasUpdates = computed(() => {
    return props.task.status_name === 'draft' &&
        (props.task.updatedFiles?.length || props.task.updatedEntities?.length)
})

const filterOptions = computed((): FilterOption[] => {
    const options: FilterOption[] = []

    if (props.task.logic?.includes('watchcsv') && props.task.updatedFiles) {
        // CSV files options
        props.task.updatedFiles.forEach(file => {
            options.push({
                value: file,
                label: file.replace('.csv', '')
            })
        })
        if (options.length > 1) {
            options.push({ value: 'all', label: 'All Files' })
        }
    } else if (props.task.logic?.includes('watchdb') && props.task.updatedEntities) {
        // Database entities options
        props.task.updatedEntities.forEach(entity => {
            options.push({
                value: entity,
                label: entity.charAt(0).toUpperCase() + entity.slice(1)
            })
        })
        if (options.length > 1) {
            options.push({ value: 'all', label: 'All Entities' })
        }
    }

    return options
})

const logicLabel = computed(() => {
    if (!props.task.logic) return 'Watch Task'
    if (props.task.logic.includes('watchcsv')) return '📁 Watch CSV'
    if (props.task.logic.includes('watchdb')) return '💾 Watch DB'
    return props.task.logic
})

const lastChecked = computed(() => {
    if (!props.task.lastChecked) return null
    const date = new Date(props.task.lastChecked)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago'`

    return date.toLocaleDateString()
})

function selectFilter(value: string) {
    selectedFilter.value = value
}

function executeTask() {
    if (!selectedFilter.value) return
    emit('execute', props.task, selectedFilter.value)
}
</script>

<style scoped>
.admin-task-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 1rem;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.admin-task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.admin-task-card.status-trash {
    opacity: 0.6;
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.task-title {
    flex: 1;
    min-width: 0;
}

.task-title :deep(h4) {
    margin: 0;
    font-size: 1.1rem;
    color: white;
}

.task-title :deep(.overline),
.task-title :deep(.subline) {
    color: rgba(255, 255, 255, 0.85);
}

.task-actions {
    display: flex;
    gap: 0.25rem;
}

.action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 1rem;
    transition: background 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.task-description {
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0 0 0.75rem 0;
    color: rgba(255, 255, 255, 0.9);
}

.watch-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.15);
}

.status-indicator {
    font-size: 0.75rem;
}

.watch-status-watching .status-indicator {
    color: #4ade80;
    animation: pulse 2s infinite;
}

.watch-status-changes .status-indicator {
    color: #fbbf24;
}

.watch-status-inactive .status-indicator {
    color: #9ca3af;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.filter-section {
    margin-bottom: 0.75rem;
}

.filter-label {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
}

.filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.filter-option-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    padding: 0.4rem 0.75rem;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-option-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.filter-option-btn.active {
    background: white;
    color: #667eea;
    border-color: white;
}

.action-section {
    margin-bottom: 0.75rem;
}

.execute-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    border: none;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.execute-btn:hover:not(:disabled) {
    background: white;
    transform: scale(1.02);
}

.execute-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.meta-badge {
    background: rgba(255, 255, 255, 0.25);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    white-space: nowrap;
}

.priority-high,
.priority-urgent {
    border-left: 4px solid #fbbf24;
}
</style>
