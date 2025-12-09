<template>
    <component :is="panelWrapper" v-bind="wrapperProps">
        <div class="interactions-panel" :class="[`mode-${mode}`]">
            <!-- Header (dashboard mode only - BasePanel has its own header) -->
            <div v-if="mode === 'dashboard-panel'" class="panel-header">
                <h3 class="panel-title">
                    <span class="title-icon">📋</span>
                    Anmeldungen
                </h3>
                <span v-if="totalCount > 0" class="count-badge">{{ totalCount }}</span>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Lade Anmeldungen...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="!hasInteractions" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Noch keine Anmeldungen</p>
                <p v-if="useStubData" class="stub-hint">(Stub-Modus aktiv)</p>
            </div>

            <!-- Interactions grouped by event -->
            <div v-else class="interactions-content">
                <div v-for="group in groupedInteractions" :key="group.eventId" class="event-group">
                    <!-- Event Header -->
                    <div class="event-header" @click="toggleGroup(group.eventId)">
                        <span class="event-icon">🎭</span>
                        <span class="event-name">{{ group.eventName }}</span>
                        <span class="event-count">{{ group.interactions.length }}</span>
                        <span class="chevron" :class="{ expanded: expandedGroups.has(group.eventId) }">▼</span>
                    </div>

                    <!-- Interactions List (collapsible) -->
                    <Transition name="collapse">
                        <div v-if="expandedGroups.has(group.eventId)" class="interactions-list">
                            <div v-for="interaction in group.interactions" :key="interaction.id"
                                class="interaction-item" @click="selectInteraction(interaction)">
                                <div class="interaction-main">
                                    <span class="interaction-name">{{ interaction.displayName }}</span>
                                    <span class="interaction-email">{{ interaction.email }}</span>
                                </div>
                                <div class="interaction-meta">
                                    <span class="interaction-date">{{ formatDate(interaction.timestamp) }}</span>
                                    <span class="interaction-status" :class="`status-${interaction.statusName}`">
                                        {{ interaction.statusLabel }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>

            <!-- Footer with actions (dashboard mode) -->
            <div v-if="mode === 'dashboard-panel' && hasInteractions" class="panel-footer">
                <button class="view-all-btn" @click="openFullPanel">
                    Alle anzeigen →
                </button>
            </div>
        </div>

        <!-- Footer slot for BasePanel mode -->
        <template v-if="mode === 'base-panel'" #footer>
            <div class="base-panel-actions">
                <button class="btn-secondary" @click="handleClose">Schließen</button>
                <button v-if="selectedInteraction" class="btn-primary" @click="viewDetails">
                    Details anzeigen
                </button>
            </div>
        </template>
    </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BasePanel from '@/components/BasePanel.vue'

// ============================================================
// TYPES
// ============================================================

interface Interaction {
    id: number
    name: string
    displayName: string
    email: string
    timestamp: string
    statusName: string
    statusLabel: string
    eventId?: number
    eventName?: string
    fields?: Record<string, any>
}

interface EventGroup {
    eventId: number | string
    eventName: string
    interactions: Interaction[]
}

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    mode: 'dashboard-panel' | 'base-panel'
    projectId: string | number
    eventId?: number | null  // Filter to single event
    isOpen?: boolean         // For base-panel mode
    useStubData?: boolean    // Toggle stub vs live data
}>(), {
    mode: 'dashboard-panel',
    eventId: null,
    isOpen: false,
    useStubData: false
})

const emit = defineEmits<{
    'close': []
    'open-full-panel': []
    'select-interaction': [interaction: Interaction]
}>()

// ============================================================
// STATE
// ============================================================

const isLoading = ref(true)
const interactions = ref<Interaction[]>([])
const expandedGroups = ref<Set<number | string>>(new Set())
const selectedInteraction = ref<Interaction | null>(null)

// ============================================================
// STUB DATA
// ============================================================

const stubInteractions: Interaction[] = [
    {
        id: 1,
        name: 'event_registration',
        displayName: 'Maria Schmidt',
        email: 'maria.schmidt@example.com',
        timestamp: '2025-12-08T14:30:00Z',
        statusName: 'new',
        statusLabel: 'Neu',
        eventId: 101,
        eventName: 'Workshop: Improvisation für Anfänger'
    },
    {
        id: 2,
        name: 'event_registration',
        displayName: 'Thomas Müller',
        email: 'thomas.m@example.com',
        timestamp: '2025-12-08T10:15:00Z',
        statusName: 'confirmed',
        statusLabel: 'Bestätigt',
        eventId: 101,
        eventName: 'Workshop: Improvisation für Anfänger'
    },
    {
        id: 3,
        name: 'event_registration',
        displayName: 'Lisa Wagner',
        email: 'lisa.w@example.com',
        timestamp: '2025-12-07T16:45:00Z',
        statusName: 'new',
        statusLabel: 'Neu',
        eventId: 102,
        eventName: 'Theateraufführung: Sommernachtstraum'
    },
    {
        id: 4,
        name: 'event_registration',
        displayName: 'Hans Becker',
        email: 'h.becker@example.com',
        timestamp: '2025-12-07T09:00:00Z',
        statusName: 'confirmed',
        statusLabel: 'Bestätigt',
        eventId: 103,
        eventName: 'Kurs: Bühnenpräsenz'
    },
    {
        id: 5,
        name: 'event_registration',
        displayName: 'Anna Klein',
        email: 'anna.k@example.com',
        timestamp: '2025-12-06T11:20:00Z',
        statusName: 'cancelled',
        statusLabel: 'Storniert',
        eventId: 102,
        eventName: 'Theateraufführung: Sommernachtstraum'
    }
]

// ============================================================
// COMPUTED
// ============================================================

const hasInteractions = computed(() => interactions.value.length > 0)
const totalCount = computed(() => interactions.value.length)

// Group interactions by event
const groupedInteractions = computed<EventGroup[]>(() => {
    const groups = new Map<number | string, EventGroup>()
    
    for (const interaction of interactions.value) {
        const eventId = interaction.eventId || 'unknown'
        const eventName = interaction.eventName || 'Unbekanntes Event'
        
        if (!groups.has(eventId)) {
            groups.set(eventId, {
                eventId,
                eventName,
                interactions: []
            })
        }
        
        groups.get(eventId)!.interactions.push(interaction)
    }
    
    // Sort by event name
    return Array.from(groups.values()).sort((a, b) => 
        a.eventName.localeCompare(b.eventName)
    )
})

// Panel wrapper component based on mode
const panelWrapper = computed(() => {
    if (props.mode === 'base-panel') {
        return BasePanel
    }
    // Dashboard mode: just a div
    return 'div'
})

// Props for the wrapper
const wrapperProps = computed(() => {
    if (props.mode === 'base-panel') {
        return {
            isOpen: props.isOpen,
            title: 'Anmeldungen',
            subtitle: props.eventId ? 'Event-Registrierungen' : 'Alle Projekt-Registrierungen',
            onClose: handleClose
        }
    }
    return {
        class: 'dashboard-wrapper'
    }
})

// ============================================================
// METHODS
// ============================================================

async function fetchInteractions() {
    isLoading.value = true
    
    try {
        if (props.useStubData) {
            // Use stub data
            await new Promise(resolve => setTimeout(resolve, 300)) // Simulate loading
            interactions.value = props.eventId 
                ? stubInteractions.filter(i => i.eventId === props.eventId)
                : stubInteractions
        } else {
            // Fetch from API
            const params = new URLSearchParams()
            
            if (typeof props.projectId === 'string') {
                params.set('project', props.projectId)
            } else {
                // Need to handle numeric project_id differently
                // For now, we'll need to look up the domaincode or pass project_id directly
            }
            
            if (props.eventId) {
                // Would need event filtering support in API
                // params.set('event_id', String(props.eventId))
            }
            
            params.set('limit', '50')
            params.set('sort_by', 'timestamp')
            params.set('sort_order', 'desc')
            
            const response = await fetch(`/api/interactions?${params}`)
            
            if (!response.ok) {
                throw new Error('Failed to fetch interactions')
            }
            
            const data = await response.json()
            
            // Transform API response to our format
            interactions.value = (data.items || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                displayName: item.fields?.name || item.fields?.full_name || item.from_mail || 'Unbekannt',
                email: item.from_mail || item.fields?.email || '',
                timestamp: item.timestamp,
                statusName: getStatusName(item.status_id),
                statusLabel: getStatusLabel(item.status_id),
                eventId: item.fields?.event_id,
                eventName: item.fields?.event_name || item.subject || 'Event-Anmeldung',
                fields: item.fields
            }))
        }
        
        // Auto-expand first group
        if (groupedInteractions.value.length > 0) {
            expandedGroups.value.add(groupedInteractions.value[0].eventId)
        }
    } catch (error) {
        console.error('[InteractionsPanel] Error fetching interactions:', error)
        interactions.value = []
    } finally {
        isLoading.value = false
    }
}

function getStatusName(statusId: number): string {
    // Simple mapping - could be enhanced with sysreg lookup
    if (statusId === 1) return 'new'
    if (statusId === 512) return 'confirmed'
    if (statusId >= 65536) return 'cancelled'
    return 'draft'
}

function getStatusLabel(statusId: number): string {
    if (statusId === 1) return 'Neu'
    if (statusId === 512) return 'Bestätigt'
    if (statusId >= 65536) return 'Storniert'
    return 'Entwurf'
}

function toggleGroup(eventId: number | string) {
    if (expandedGroups.value.has(eventId)) {
        expandedGroups.value.delete(eventId)
    } else {
        expandedGroups.value.add(eventId)
    }
}

function selectInteraction(interaction: Interaction) {
    selectedInteraction.value = interaction
    emit('select-interaction', interaction)
}

function openFullPanel() {
    emit('open-full-panel')
}

function handleClose() {
    emit('close')
}

function viewDetails() {
    if (selectedInteraction.value) {
        // Could open a detail view or navigate
        console.log('View details for:', selectedInteraction.value)
    }
}

function formatDate(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// ============================================================
// LIFECYCLE
// ============================================================

onMounted(() => {
    fetchInteractions()
})

// Refetch when props change
watch(() => [props.projectId, props.eventId, props.useStubData], () => {
    fetchInteractions()
})

// Expose refresh method
defineExpose({
    refresh: fetchInteractions
})
</script>

<style scoped>
/* Dashboard wrapper */
.dashboard-wrapper {
    background: var(--color-card-bg, #fff);
    border: var(--border-small) solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-large);
    overflow: hidden;
}

/* Panel container */
.interactions-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* Dashboard mode specific */
.interactions-panel.mode-dashboard-panel {
    min-height: 200px;
    max-height: 400px;
}

/* Base panel mode specific */
.interactions-panel.mode-base-panel {
    padding: 1rem;
}

/* Header (dashboard mode) */
.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: var(--border-small) solid var(--color-border, #e5e7eb);
    background: var(--color-muted-bg, #f9fafb);
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast, #1f2937);
    flex: 1;
}

.title-icon {
    font-size: 1.125rem;
}

.count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    background: var(--color-primary-bg, #3b82f6);
    color: var(--color-primary-contrast, #fff);
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
}

/* Loading state */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 0.75rem;
    color: var(--color-dimmed, #6b7280);
}

.spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--color-border, #e5e7eb);
    border-top-color: var(--color-primary-bg, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed, #6b7280);
}

.empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.empty-state p {
    margin: 0.25rem 0;
}

.stub-hint {
    font-size: 0.75rem;
    font-style: italic;
    opacity: 0.7;
}

/* Content area */
.interactions-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

/* Event group */
.event-group {
    margin-bottom: 0.5rem;
    border: var(--border-small) solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-medium);
    overflow: hidden;
}

.event-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-muted-bg, #f9fafb);
    cursor: pointer;
    transition: var(--transition);
}

.event-header:hover {
    background: var(--color-border, #e5e7eb);
}

.event-icon {
    font-size: 1rem;
}

.event-name {
    flex: 1;
    font-weight: 500;
    color: var(--color-contrast, #1f2937);
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    background: var(--color-contrast, #1f2937);
    color: var(--color-bg, #fff);
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 9999px;
}

.chevron {
    font-size: 0.625rem;
    color: var(--color-dimmed, #6b7280);
    transition: var(--transition);
}

.chevron.expanded {
    transform: rotate(180deg);
}

/* Interactions list */
.interactions-list {
    border-top: var(--border-small) solid var(--color-border, #e5e7eb);
}

.interaction-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-bottom: var(--border-small) solid var(--color-border, #e5e7eb);
    cursor: pointer;
    transition: var(--transition);
}

.interaction-item:last-child {
    border-bottom: none;
}

.interaction-item:hover {
    background: var(--color-muted-bg, #f9fafb);
}

.interaction-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.interaction-name {
    font-weight: 500;
    color: var(--color-contrast, #1f2937);
    font-size: 0.875rem;
}

.interaction-email {
    font-size: 0.75rem;
    color: var(--color-dimmed, #6b7280);
}

.interaction-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.interaction-date {
    font-size: 0.75rem;
    color: var(--color-dimmed, #6b7280);
}

.interaction-status {
    font-size: 0.6875rem;
    font-weight: 500;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
}

.interaction-status.status-new {
    background: oklch(92% 0.12 95);
    color: oklch(40% 0.08 95);
}

.interaction-status.status-confirmed {
    background: oklch(85% 0.12 145);
    color: oklch(30% 0.10 145);
}

.interaction-status.status-cancelled {
    background: oklch(90% 0.08 25);
    color: oklch(40% 0.12 25);
}

.interaction-status.status-draft {
    background: var(--color-muted-bg, #f3f4f6);
    color: var(--color-dimmed, #6b7280);
}

/* Footer (dashboard mode) */
.panel-footer {
    padding: 0.75rem 1rem;
    border-top: var(--border-small) solid var(--color-border, #e5e7eb);
    background: var(--color-muted-bg, #f9fafb);
}

.view-all-btn {
    width: 100%;
    padding: 0.5rem 1rem;
    background: transparent;
    border: var(--border-small) solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-small);
    color: var(--color-primary-bg, #3b82f6);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.view-all-btn:hover {
    background: var(--color-primary-bg, #3b82f6);
    color: var(--color-primary-contrast, #fff);
    border-color: var(--color-primary-bg, #3b82f6);
}

/* Base panel footer actions */
.base-panel-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: var(--transition);
}

.btn-secondary {
    background: var(--color-muted-bg, #f3f4f6);
    border: var(--border-small) solid var(--color-border, #e5e7eb);
    color: var(--color-contrast, #1f2937);
}

.btn-secondary:hover {
    background: var(--color-border, #e5e7eb);
}

.btn-primary {
    background: var(--color-primary-bg, #3b82f6);
    border: var(--border-small) solid var(--color-primary-bg, #3b82f6);
    color: var(--color-primary-contrast, #fff);
}

.btn-primary:hover {
    background: var(--color-primary-hover, #2563eb);
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
    opacity: 0;
    max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
    opacity: 1;
    max-height: 500px;
}
</style>
