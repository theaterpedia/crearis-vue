<template>
    <div class="entity-overview">
        <!-- Stats Row -->
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">📊</span>
                <div class="stat-content">
                    <span class="stat-value">{{ statusLabel }}</span>
                    <span class="stat-label">Status</span>
                </div>
            </div>
            <div v-if="entityType === 'events'" class="stat-card">
                <span class="stat-icon">👥</span>
                <div class="stat-content">
                    <span class="stat-value">{{ registrationCount }}</span>
                    <span class="stat-label">Registrations</span>
                </div>
            </div>
            <div v-if="entityType === 'posts'" class="stat-card">
                <span class="stat-icon">👁</span>
                <div class="stat-content">
                    <span class="stat-value">{{ viewCount }}</span>
                    <span class="stat-label">Views</span>
                </div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📅</span>
                <div class="stat-content">
                    <span class="stat-value">{{ formattedDate }}</span>
                    <span class="stat-label">{{ entityType === 'events' ? 'Event Date' : 'Last Updated' }}</span>
                </div>
            </div>
        </div>

        <!-- Teaser Text -->
        <div v-if="entity?.teaser" class="teaser-section">
            <h4 class="section-title">Description</h4>
            <p class="teaser-text">{{ entity.teaser }}</p>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
            <h4 class="section-title">Actions</h4>
            <div class="action-buttons">
                <button class="action-btn primary" @click="handleOpenExternal">
                    🌐 Open Public Page
                </button>
                <button v-if="entityType === 'events'" class="action-btn secondary" @click="handleExportRegistrations">
                    📥 Export Registrations
                </button>
                <button v-if="entityType === 'posts'" class="action-btn secondary" @click="handlePreview">
                    👁 Preview
                </button>
            </div>
        </div>

        <!-- Interactions Summary (Events only) -->
        <div v-if="entityType === 'events'" class="interactions-summary">
            <h4 class="section-title">Recent Registrations</h4>
            <InteractionsPanel mode="dashboard-panel" :project-id="projectId" :event-id="entity?.id"
                :use-stub-data="true" @open-full-panel="$emit('open-interactions')" />
        </div>

        <!-- Workflow Status (stub for v0.6-v0.8 features) -->
        <div v-if="showWorkflowStub" class="workflow-stub">
            <h4 class="section-title">🚧 Workflow (Coming v0.6+)</h4>
            <div class="stub-content">
                <div class="stub-item">
                    <span class="stub-icon">📋</span>
                    <span class="stub-text">Review Request Flow</span>
                    <span class="stub-badge">v0.6</span>
                </div>
                <div class="stub-item">
                    <span class="stub-icon">🔔</span>
                    <span class="stub-text">Notification Triggers</span>
                    <span class="stub-badge">v0.7</span>
                </div>
                <div class="stub-item">
                    <span class="stub-icon">📊</span>
                    <span class="stub-text">Analytics Dashboard</span>
                    <span class="stub-badge">v0.8</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InteractionsPanel from '@/components/interactions/InteractionsPanel.vue'

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    entity: any
    entityType: 'posts' | 'events' | 'pages' | 'images'
    projectId: string | number
    alpha?: boolean
}>(), {
    alpha: true
})

const emit = defineEmits<{
    'open-external': [url: string]
    'open-interactions': []
}>()

// ============================================================
// COMPUTED
// ============================================================

const showWorkflowStub = computed(() => props.alpha)

const statusLabel = computed(() => {
    const status = props.entity?.status || 0
    if (status === 1) return 'New'
    if (status === 8) return 'Demo'
    if (status === 64) return 'Draft'
    if (status === 256) return 'Review'
    if (status === 512) return 'Confirmed'
    if (status === 4096) return 'Released'
    if (status >= 65536) return 'Archived'
    return 'Unknown'
})

const registrationCount = computed(() => {
    // Stub data
    return props.entity?.registration_count || 12
})

const viewCount = computed(() => {
    // Stub data
    return props.entity?.view_count || 248
})

const formattedDate = computed(() => {
    const dateField = props.entityType === 'events'
        ? props.entity?.event_date || props.entity?.start_date
        : props.entity?.updated_at || props.entity?.created_at

    if (!dateField) return '-'

    try {
        return new Date(dateField).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return '-'
    }
})

const externalUrl = computed(() => {
    const domaincode = props.entity?.domaincode || props.projectId
    const entityId = props.entity?.id || props.entity?.xmlid

    if (props.entityType === 'posts') {
        return `/sites/${domaincode}/posts/${entityId}`
    }
    if (props.entityType === 'events') {
        return `/sites/${domaincode}/events/${entityId}`
    }
    return `/sites/${domaincode}`
})

// ============================================================
// METHODS
// ============================================================

function handleOpenExternal() {
    emit('open-external', externalUrl.value)
}

function handleExportRegistrations() {
    console.log('[EntityOverview] Export registrations - stub')
    alert('Export feature coming in v0.7')
}

function handlePreview() {
    window.open(externalUrl.value, '_blank')
}
</script>

<style scoped>
.entity-overview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Stats Row */
.stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
    border: var(--border-small) solid var(--color-border);
}

.stat-icon {
    font-size: 1.5rem;
}

.stat-content {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.stat-label {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

/* Section Title */
.section-title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Teaser Section */
.teaser-section {
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-medium);
}

.teaser-text {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-contrast);
    line-height: 1.6;
}

/* Actions Section */
.actions-section {
    padding: 1rem;
    background: var(--color-card-bg);
    border: var(--border-small) solid var(--color-border);
    border-radius: var(--radius-medium);
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: var(--transition);
}

.action-btn.primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast, #fff);
    border: var(--border-small) solid var(--color-primary-bg);
}

.action-btn.primary:hover {
    filter: brightness(0.9);
}

.action-btn.secondary {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
    border: var(--border-small) solid var(--color-border);
}

.action-btn.secondary:hover {
    background: var(--color-border);
}

/* Interactions Summary - inherits from InteractionsPanel */
/* .interactions-summary {} */

/* Workflow Stub */
.workflow-stub {
    padding: 1rem;
    background: oklch(95% 0.02 280);
    border: var(--border-small) dashed oklch(70% 0.08 280);
    border-radius: var(--radius-medium);
}

.stub-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stub-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
}

.stub-icon {
    font-size: 1rem;
}

.stub-text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.stub-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    background: oklch(85% 0.08 280);
    color: oklch(35% 0.12 280);
    border-radius: 9999px;
}
</style>
