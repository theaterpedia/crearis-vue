<template>
    <div class="odoo-events-list">
        <!-- Header with filters -->
        <div class="list-header">
            <h3 class="list-title">{{ title }}</h3>
            <div class="list-actions">
                <button class="create-btn" @click="$emit('create')" title="Create Event">
                    ➕ Neues Event
                </button>
                <div class="list-filters">
                    <select v-model="filterState" class="filter-select">
                        <option value="">Alle Status</option>
                        <option value="draft">Entwurf</option>
                        <option value="confirm">Bestätigt</option>
                        <option value="done">Abgeschlossen</option>
                        <option value="cancel">Abgesagt</option>
                    </select>
                    <button class="refresh-btn" @click="refresh" :disabled="loading" title="Aktualisieren">
                        🔄
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="list-loading">
            <div class="spinner"></div>
            <span>Lade Events von Odoo...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="list-error">
            <span class="error-icon">⚠️</span>
            <span class="error-message">{{ error }}</span>
            <button class="retry-btn" @click="refresh">Erneut versuchen</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredEvents.length === 0" class="list-empty">
            <span class="empty-icon">📅</span>
            <span class="empty-message">Keine Events gefunden</span>
        </div>

        <!-- Events grid -->
        <div v-else class="events-grid">
            <OdooEventCard v-for="event in filteredEvents" :key="event.id" :event="event"
                @edit="$emit('edit', $event)" />
        </div>

        <!-- Pagination -->
        <div v-if="hasMore && !loading" class="list-pagination">
            <button class="load-more-btn" @click="loadMore">
                Load more ({{ events.length }} of {{ total }})
            </button>
        </div>

        <!-- Summary -->
        <div class="list-summary">
            Showing {{ filteredEvents.length }} event{{ filteredEvents.length !== 1 ? 's' : '' }}
            <span v-if="total > 0"> of {{ total }} total</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OdooEventCard from './OdooEventCard.vue'
import type { OdooEvent } from '@/types/odooEvent'

const props = withDefaults(defineProps<{
    title?: string
    projectId?: number
    upcomingOnly?: boolean
}>(), {
    title: 'Odoo Events',
    upcomingOnly: false
})

defineEmits<{
    edit: [event: OdooEvent]
    create: []
}>()

// State
const events = ref<OdooEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const total = ref(0)
const hasMore = ref(false)
const offset = ref(0)
const limit = 20

// Filters
const filterStage = ref<string>('')

// Computed
const filteredEvents = computed(() => {
    return events.value.filter((e: OdooEvent) => {
        // Filter by stage name if set
        if (filterStage.value && e.stage_id?.name !== filterStage.value) return false
        return true
    })
})

// Fetch events
async function fetchEvents(append = false) {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
        const params = new URLSearchParams()
        params.set('limit', String(limit))
        params.set('offset', String(append ? offset.value : 0))

        if (props.projectId) {
            params.set('project_id', String(props.projectId))
        }
        if (props.upcomingOnly) {
            params.set('upcoming', 'true')
        }

        const response = await fetch(`/api/odoo/events?${params}`)

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        if (append) {
            events.value = [...events.value, ...data.events]
        } else {
            events.value = data.events
        }

        total.value = data.total
        hasMore.value = data.hasMore
        offset.value = (append ? offset.value : 0) + data.events.length
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load events'
        console.error('[OdooEventsList] Error:', err)
    } finally {
        loading.value = false
    }
}

function refresh() {
    offset.value = 0
    fetchEvents(false)
}

function loadMore() {
    fetchEvents(true)
}

// Watch for prop changes
watch(() => props.projectId, () => refresh())
watch(() => props.upcomingOnly, () => refresh())

// Initial load
onMounted(() => {
    fetchEvents()
})

// Expose refresh for parent
defineExpose({ refresh })
</script>

<style scoped>
.odoo-events-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Header */
.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.list-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast, #1a1a1a);
    margin: 0;
}

.list-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.create-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.create-btn:hover {
    background: oklch(55% 0.2 250);
}

.list-filters {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-bg, #fff);
    font-size: 0.875rem;
    cursor: pointer;
}

.filter-select:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-bg, #fff);
    cursor: pointer;
    transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
    background: var(--color-primary-bg, #e0f2fe);
    border-color: var(--color-primary, #3b82f6);
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Loading */
.list-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem;
    color: var(--color-dimmed, #666);
}

.spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--color-border, #e0e0e0);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Error */
.list-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    background: var(--color-danger-bg, #fef2f2);
    border: 1px solid var(--color-danger, #ef4444);
    border-radius: 8px;
}

.error-icon {
    font-size: 1.25rem;
}

.error-message {
    color: var(--color-danger, #ef4444);
}

.retry-btn {
    padding: 0.5rem 1rem;
    background: var(--color-danger, #ef4444);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.retry-btn:hover {
    opacity: 0.9;
}

/* Empty */
.list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem;
    color: var(--color-dimmed, #666);
}

.empty-icon {
    font-size: 2rem;
    opacity: 0.5;
}

/* Grid */
.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
}

/* Pagination */
.list-pagination {
    display: flex;
    justify-content: center;
    padding: 1rem;
}

.load-more-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.load-more-btn:hover {
    background: var(--color-primary-hover, #2563eb);
}

/* Summary */
.list-summary {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-dimmed, #666);
    padding: 0.5rem;
}
</style>
