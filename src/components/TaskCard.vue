<template>
    <div class="task-card" :class="[`priority-${task.priority}`, { 'is-dragging': isDragging }]" draggable="true"
        @dragstart="handleDragStart" @dragend="handleDragEnd">
        <!-- Preview Image -->
        <div v-if="task.image" class="task-image">
            <img :src="task.image" :alt="displayTitle" />
        </div>

        <!-- Status & Category Badges -->
        <div class="task-badges">
            <StatusBadge v-if="task.status" :status="task.status" />
            <CategoryBadge v-if="task.category" :category="task.category" />
        </div>

        <!-- Task Header -->
        <div class="task-header">
            <h4 class="task-title">{{ displayTitle }}</h4>
            <div class="task-actions">
                <button class="action-btn edit-btn" @click="$emit('edit', task)" title="Edit task">
                    ✎
                </button>
                <button class="action-btn delete-btn" @click="$emit('delete', task)" title="Delete task">
                    ×
                </button>
            </div>
        </div>

        <!-- Task Description -->
        <p v-if="task.description" class="task-description">
            {{ truncatedDescription }}
        </p>

        <!-- Priority Indicator -->
        <div v-if="task.priority" class="priority-badge" :class="`priority-${task.priority}`">
            {{ priorityLabel }}
        </div>

        <!-- Task Meta Information -->
        <div class="task-meta">
            <!-- Record Type Badge -->
            <span v-if="task.record_type" class="meta-badge record-badge">
                {{ recordTypeLabel }}
            </span>

            <!-- Entity Name -->
            <span v-if="task.entity_name" class="meta-badge entity-badge">
                � {{ task.entity_name }}
            </span>

            <!-- Due Date -->
            <span v-if="task.due_date" class="meta-badge due-date-badge" :class="dueDateClass">
                � {{ formattedDueDate }}
            </span>

            <!-- Assigned To -->
            <span v-if="task.assigned_to" class="meta-badge assigned-badge">
                👤 {{ task.assigned_to }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import CategoryBadge from './CategoryBadge.vue'

interface Task {
    id?: string
    title: string
    description?: string
    status?: 'idea' | 'new' | 'draft' | 'final' | 'reopen' | 'trash'
    category?: 'admin' | 'base' | 'project' | 'release'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    record_type?: string
    record_id?: string
    assigned_to?: string
    due_date?: string
    release_id?: string
    image?: string
    prompt?: string
    entity_name?: string
    display_title?: string
}

const props = defineProps<{
    task: Task
}>()

const emit = defineEmits<{
    edit: [task: Task]
    delete: [task: Task]
    'drag-start': [task: Task]
}>()

const isDragging = ref(false)

// Display title with entity name inheritance
const displayTitle = computed(() => {
    // Use display_title if available (already processed by API)
    if (props.task.display_title) {
        return props.task.display_title
    }

    // Fallback: Replace {{main-title}} in title with entity_name
    if (props.task.title && props.task.title.includes('{{main-title}}') && props.task.entity_name) {
        return props.task.title.replace(/\{\{main-title\}\}/g, props.task.entity_name)
    }

    // Default: Use title as is
    return props.task.title || 'Untitled Task'
})

// Priority label
const priorityLabel = computed(() => {
    const labels: Record<string, string> = {
        urgent: '🔴 Urgent',
        high: '🟠 High',
        medium: '🟡 Medium',
        low: '🟢 Low'
    }
    return labels[props.task.priority || 'medium']
})

// Record type label
const recordTypeLabel = computed(() => {
    if (!props.task.record_type) return ''
    return props.task.record_type.charAt(0).toUpperCase() + props.task.record_type.slice(1)
})

// Truncated description
const truncatedDescription = computed(() => {
    if (!props.task.description) return ''
    return props.task.description.length > 100
        ? props.task.description.substring(0, 100) + '...'
        : props.task.description
})

// Formatted due date
const formattedDueDate = computed(() => {
    if (!props.task.due_date) return ''

    try {
        const date = new Date(props.task.due_date)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        })
    } catch {
        return props.task.due_date
    }
})

// Due date class (for overdue warning)
const dueDateClass = computed(() => {
    if (!props.task.due_date || props.task.status === 'done') return ''

    const dueDate = new Date(props.task.due_date)
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays <= 3) return 'due-soon'
    return ''
})

// Formatted timestamp
const formattedTimestamp = computed(() => {
    try {
        const date = new Date(props.task.updated_at)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
        return 'Unknown'
    }
})

// Drag handlers
function handleDragStart(event: DragEvent) {
    isDragging.value = true
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/html', event.currentTarget as any)
    }
    emit('drag-start', props.task)
}

function handleDragEnd() {
    isDragging.value = false
}
</script>

<style scoped>
.task-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    padding: 1rem;
    cursor: grab;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
    border-color: var(--color-primary-bg);
}

.task-card:active {
    cursor: grabbing;
}

.task-card.is-dragging {
    opacity: 0.5;
    cursor: grabbing;
}

/* Task Image */
.task-image {
    width: 100%;
    height: 180px;
    margin: -1rem -1rem 1rem -1rem;
    overflow: hidden;
    border-radius: var(--radius-button) var(--radius-button) 0 0;
}

.task-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Status & Category Badges */
.task-badges {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
}

/* Priority border accent */
.task-card.priority-urgent {
    border-left: 4px solid oklch(63.68% 0.2078 25.33);
}

.task-card.priority-high {
    border-left: 4px solid oklch(72.21% 0.2812 60);
}

.task-card.priority-medium {
    border-left: 4px solid oklch(72.21% 0.2812 144.53);
}

.task-card.priority-low {
    border-left: 4px solid var(--color-dimmed);
}

/* Priority Badge */
.priority-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    background: var(--color-muted-bg);
}

.priority-badge.priority-urgent {
    color: oklch(63.68% 0.2078 25.33);
}

.priority-badge.priority-high {
    color: oklch(72.21% 0.2812 60);
}

.priority-badge.priority-medium {
    color: oklch(72.21% 0.2812 144.53);
}

.priority-badge.priority-low {
    color: var(--color-dimmed);
}

/* Task Header */
.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding-right: 5rem;
    /* Space for priority badge */
}

.task-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0;
    line-height: 1.4;
    word-break: break-word;
}

.task-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.task-card:hover .task-actions {
    opacity: 1;
}

.action-btn {
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: var(--color-contrast);
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.delete-btn:hover {
    background: oklch(63.68% 0.2078 25.33 / 0.1);
    border-color: oklch(63.68% 0.2078 25.33);
    color: oklch(63.68% 0.2078 25.33);
}

/* Task Description */
.task-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 0.75rem;
    line-height: 1.5;
}

/* Task Meta */
.task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.meta-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
    background: var(--color-muted-bg);
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
}

.record-badge {
    background: oklch(72.21% 0.2812 240 / 0.1);
    border-color: oklch(72.21% 0.2812 240 / 0.3);
    color: oklch(72.21% 0.2812 240);
}

.due-date-badge {
    background: var(--color-muted-bg);
}

.due-date-badge.overdue {
    background: oklch(63.68% 0.2078 25.33 / 0.1);
    border-color: oklch(63.68% 0.2078 25.33);
    color: oklch(63.68% 0.2078 25.33);
    font-weight: 600;
}

.due-date-badge.due-soon {
    background: oklch(72.21% 0.2812 60 / 0.1);
    border-color: oklch(72.21% 0.2812 60);
    color: oklch(72.21% 0.2812 60);
    font-weight: 600;
}

.assigned-badge {
    background: oklch(65.74% 0.2393 304.41 / 0.1);
    border-color: oklch(65.74% 0.2393 304.41 / 0.3);
    color: oklch(65.74% 0.2393 304.41);
}

.entity-badge {
    background: oklch(72.21% 0.2812 144.53 / 0.1);
    border-color: oklch(72.21% 0.2812 144.53 / 0.3);
    color: oklch(72.21% 0.2812 144.53);
}

/* Task Footer */
.task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
}

.task-timestamp {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.completed-badge {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary-bg);
    background: oklch(from var(--color-primary-bg) l c h / 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}
</style>
