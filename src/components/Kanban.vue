<template>
    <div class="kanban-board">
        <div v-for="column in columns" :key="column.id" class="kanban-column" :class="`column-${column.id}`"
            @dragover.prevent @drop="handleDrop($event, column.id)">
            <h3 class="column-title">
                <span v-if="column.icon" class="column-icon">{{ column.icon }}</span>
                <span>{{ column.title }}</span>
                <span class="column-count">{{ getColumnItems(column.id).length }}</span>
            </h3>

            <div class="column-items">
                <component v-for="(item, index) in getColumnItems(column.id)" :key="item.id"
                    :is="getComponentType(item.type)" v-bind="getComponentProps(item)" :class="getItemClasses(item)"
                    :style="getItemStyle(item, index)" draggable="true" @dragstart="handleDragStart($event, item)"
                    @dragend="handleDragEnd" />

                <div v-if="getColumnItems(column.id).length === 0" class="empty-column">
                    {{ emptyText }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'
import PostCard from './PostCard.vue'
import EventCard from './EventCard.vue'
import PostIt from './PostIt.vue'

interface KanbanColumn {
    id: string
    title: string
    icon?: string
}

interface KanbanItem {
    id: string | number
    type: 'task' | 'post' | 'event' | 'postit'
    status: string
    heading?: string
    name?: string
    teaser?: string
    description?: string
    cimg?: string
    color?: 'primary' | 'secondary' | 'warning' | 'positive' | 'negative' | 'accent' | 'muted' | 'dimmed'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    [key: string]: any
}

const props = defineProps<{
    items: KanbanItem[]
    columns: KanbanColumn[]
    emptyText?: string
}>()

const emit = defineEmits<{
    'item-moved': [item: KanbanItem, newStatus: string]
}>()

const draggedItem = ref<KanbanItem | null>(null)

// Rotation angles for PostIts (randomly assigned but consistent per item)
const rotationMap = new Map<string | number, string>()

function getRotation(itemId: string | number): string {
    if (!rotationMap.has(itemId)) {
        const rotations = ['-rotate-3', '-rotate-2', '-rotate-1', 'rotate-0', 'rotate-1', 'rotate-2', 'rotate-3']
        const randomIndex = Math.floor(Math.random() * rotations.length)
        const randomRotation = rotations[randomIndex]!
        rotationMap.set(itemId, randomRotation)
    }
    return rotationMap.get(itemId)!
}

function getColumnItems(columnId: string): KanbanItem[] {
    return props.items.filter((item: KanbanItem) => item.status === columnId)
}

function getComponentType(type: string) {
    const componentMap: Record<string, any> = {
        task: TaskCard,
        post: PostCard,
        event: EventCard,
        postit: PostIt
    }
    return componentMap[type] || TaskCard
}

function getComponentProps(item: KanbanItem) {
    if (item.type === 'task') {
        return {
            task: {
                ...item,
                name: item.heading || item.name || '',
                description: item.description || item.teaser || '',
                status_name: item.status,
                category: item.category || 'main',
                priority: item.priority || 'medium',
                cimg: item.cimg
            }
        }
    }

    if (item.type === 'post') {
        return {
            post: {
                ...item,
                name: item.heading || item.name || '',
                teaser: item.teaser || item.description || '',
                cimg: item.cimg
            }
        }
    }

    if (item.type === 'event') {
        return {
            event: {
                ...item,
                name: item.heading || item.name || '',
                teaser: item.teaser || item.description || '',
                cimg: item.cimg
            }
        }
    }

    if (item.type === 'postit') {
        return {
            heading: item.heading || item.name || '',
            color: item.color || 'primary',
            rotation: getRotation(item.id),
            width: '1/3'
        }
    }

    return {}
}

function getItemClasses(item: KanbanItem) {
    const classes: string[] = ['kanban-item']

    if (item.color && item.type !== 'postit') {
        classes.push(`item-${item.color}`)
    }

    return classes
}

function getItemStyle(item: KanbanItem, index: number) {
    const style: Record<string, string> = {}

    // Add slight vertical offset for visual variety (not rotation)
    if (item.type === 'postit' && index % 3 !== 0) {
        const offset = (index % 3) * 4
        style.marginTop = `${offset}px`
    }

    return style
}

function handleDragStart(event: DragEvent, item: KanbanItem) {
    draggedItem.value = item
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
    }
}

function handleDragEnd() {
    draggedItem.value = null
}

function handleDrop(event: DragEvent, newStatus: string) {
    event.preventDefault()

    if (draggedItem.value && draggedItem.value.status !== newStatus) {
        emit('item-moved', draggedItem.value, newStatus)
    }

    draggedItem.value = null
}
</script>

<style scoped>
.kanban-board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem 0;
}

@media (min-width: 768px) {
    .kanban-board {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1200px) {
    .kanban-board {
        grid-template-columns: repeat(4, 1fr);
    }
}

.kanban-column {
    background: var(--color-accent-variant);
    border-radius: var(--radius-button, 8px);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    min-height: 400px;
    max-height: calc(100vh - 200px);
    border: 2px solid var(--color-accent-contrast);
    transition: all 0.2s ease;
}

.kanban-column:hover {
    background: var(--color-accent-bg);
    border-color: var(--color-contrast);
}

.column-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-accent-contrast);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-accent-contrast);
}

.column-icon {
    font-size: 1.5rem;
}

.column-count {
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    background: var(--color-card-bg);
    border-radius: 999px;
    color: var(--color-card-contrast);
    border: 1px solid var(--color-border);
}

.column-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.column-items::-webkit-scrollbar {
    width: 20px;
}

.column-items::-webkit-scrollbar-track {
    background: transparent;
}

.column-items::-webkit-scrollbar-thumb {
    background: var(--color-accent-contrast);
    border-radius: 4px;
    border-left: 12px solid transparent;
    background-clip: padding-box;
}

.column-items::-webkit-scrollbar-thumb:hover {
    background: var(--color-contrast);
}

.kanban-item {
    cursor: move;
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.kanban-item:hover {
    transform: scale(1.02);
}

.kanban-item:active {
    opacity: 0.7;
    cursor: grabbing;
}

/* Color variants for cards (affects left border marker) */
.kanban-item.item-primary :deep(.task-card) {
    border-left-color: var(--color-primary-bg);
}

.kanban-item.item-secondary :deep(.task-card) {
    border-left-color: var(--color-secondary-bg);
}

.kanban-item.item-positive :deep(.task-card) {
    border-left-color: var(--color-positive-bg);
}

.kanban-item.item-negative :deep(.task-card) {
    border-left-color: var(--color-negative-bg);
}

.kanban-item.item-warning :deep(.task-card) {
    border-left-color: var(--color-warning-bg);
}

.empty-column {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-style: italic;
}
</style>
