<template>
    <div class="admin-review-widget">
        <div class="widget-header">
            <h3 class="widget-title">
                <span class="title-icon">📋</span>
                Prüfungsanfragen
            </h3>
            <span v-if="pendingCount > 0" class="pending-badge">{{ pendingCount }}</span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <span>Lade Anfragen...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="pendingProjects.length === 0" class="empty-state">
            <span class="empty-icon">✨</span>
            <p>Keine offenen Prüfungsanfragen</p>
        </div>

        <!-- Pending Projects List -->
        <div v-else class="pending-list">
            <div v-for="project in pendingProjects" :key="project.id" class="pending-item">
                <div class="project-info">
                    <span class="project-name">{{ project.name || project.heading }}</span>
                    <span class="project-type">{{ project.type }}</span>
                </div>
                <div class="project-meta">
                    <span class="submitted-by">von {{ project.ownerName }}</span>
                    <span class="submitted-at">{{ formatDate(project.updatedAt) }}</span>
                </div>
                <div class="project-actions">
                    <button class="action-btn approve-btn" @click="approveProject(project)" :disabled="isProcessing">
                        <span>✓</span> Freigeben
                    </button>
                    <button class="action-btn reject-btn" @click="rejectProject(project)" :disabled="isProcessing">
                        <span>✗</span> Zurück
                    </button>
                    <RouterLink :to="`/projects/${project.domaincode}/main`" class="action-btn view-btn">
                        <span>👁</span> Ansehen
                    </RouterLink>
                </div>
            </div>
        </div>

        <!-- Refresh button -->
        <div class="widget-footer">
            <button class="refresh-btn" @click="fetchPendingProjects" :disabled="isLoading">
                🔄 Aktualisieren
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// ============================================================
// TYPES
// ============================================================

interface PendingProject {
    id: number
    domaincode: string
    name: string
    heading?: string
    type: string
    ownerName: string
    ownerId: number
    updatedAt: string
    status: number
}

// ============================================================
// PROPS & EMITS
// ============================================================

const emit = defineEmits<{
    'project-approved': [projectId: number]
    'project-rejected': [projectId: number]
}>()

// ============================================================
// CONSTANTS
// ============================================================

const STATUS = {
    DRAFT: 64,
    REVIEW: 256,
    CONFIRMED: 512
}

// ============================================================
// STATE
// ============================================================

const isLoading = ref(true)
const isProcessing = ref(false)
const pendingProjects = ref<PendingProject[]>([])

// ============================================================
// COMPUTED
// ============================================================

const pendingCount = computed(() => pendingProjects.value.length)

// ============================================================
// METHODS
// ============================================================

async function fetchPendingProjects() {
    isLoading.value = true
    
    try {
        // Fetch projects in REVIEW status (256)
        const response = await fetch(`/api/projects?status=${STATUS.REVIEW}&limit=20`)
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects')
        }
        
        const data = await response.json()
        
        // Transform to our format
        pendingProjects.value = (data.items || data || []).map((p: any) => ({
            id: p.id,
            domaincode: p.domaincode,
            name: p.name,
            heading: p.heading,
            type: p.type || 'project',
            ownerName: p.owner_name || p._ownerName || 'Unbekannt',
            ownerId: p.owner_id,
            updatedAt: p.updated_at || p.updatedAt,
            status: p.status
        }))
        
    } catch (error) {
        console.error('[AdminReviewWidget] Error fetching projects:', error)
        pendingProjects.value = []
    } finally {
        isLoading.value = false
    }
}

async function approveProject(project: PendingProject) {
    if (isProcessing.value) return
    
    isProcessing.value = true
    
    try {
        const response = await fetch(`/api/projects/${project.id}/activate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetStatus: STATUS.CONFIRMED
            })
        })
        
        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Fehler beim Freigeben')
        }
        
        // Remove from list
        pendingProjects.value = pendingProjects.value.filter((p: PendingProject) => p.id !== project.id)
        emit('project-approved', project.id)
        
    } catch (error) {
        console.error('[AdminReviewWidget] Error approving project:', error)
        alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
        isProcessing.value = false
    }
}

async function rejectProject(project: PendingProject) {
    if (isProcessing.value) return
    
    const reason = prompt('Grund für Ablehnung (optional):')
    if (reason === null) return // User cancelled
    
    isProcessing.value = true
    
    try {
        const response = await fetch(`/api/projects/${project.id}/activate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetStatus: STATUS.DRAFT,
                reason: reason || undefined
            })
        })
        
        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Fehler beim Zurückweisen')
        }
        
        // Remove from list
        pendingProjects.value = pendingProjects.value.filter((p: PendingProject) => p.id !== project.id)
        emit('project-rejected', project.id)
        
    } catch (error) {
        console.error('[AdminReviewWidget] Error rejecting project:', error)
        alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
        isProcessing.value = false
    }
}

function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
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
    fetchPendingProjects()
})

// Expose refresh method
defineExpose({
    refresh: fetchPendingProjects
})
</script>

<style scoped>
.admin-review-widget {
    background: var(--color-card-bg, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.75rem;
    overflow: hidden;
}

/* Header */
.widget-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-muted-bg, #f9fafb);
}

.widget-title {
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

.pending-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    background: oklch(70% 0.18 25);
    color: white;
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
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.empty-state p {
    margin: 0;
}

/* Pending list */
.pending-list {
    max-height: 400px;
    overflow-y: auto;
}

.pending-item {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    transition: background 0.15s;
}

.pending-item:last-child {
    border-bottom: none;
}

.pending-item:hover {
    background: var(--color-muted-bg, #f9fafb);
}

.project-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.project-name {
    font-weight: 600;
    color: var(--color-contrast, #1f2937);
    font-size: 0.9375rem;
}

.project-type {
    font-size: 0.6875rem;
    font-weight: 500;
    padding: 0.125rem 0.5rem;
    background: var(--color-muted-bg, #f3f4f6);
    color: var(--color-dimmed, #6b7280);
    border-radius: 9999px;
    text-transform: uppercase;
}

.project-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-dimmed, #6b7280);
}

.project-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
}

.approve-btn {
    background: oklch(85% 0.12 145);
    color: oklch(30% 0.10 145);
    border: 1px solid oklch(75% 0.12 145);
}

.approve-btn:hover:not(:disabled) {
    background: oklch(80% 0.14 145);
}

.reject-btn {
    background: oklch(92% 0.08 25);
    color: oklch(40% 0.15 25);
    border: 1px solid oklch(85% 0.08 25);
}

.reject-btn:hover:not(:disabled) {
    background: oklch(88% 0.10 25);
}

.view-btn {
    background: var(--color-muted-bg, #f3f4f6);
    color: var(--color-contrast, #1f2937);
    border: 1px solid var(--color-border, #e5e7eb);
}

.view-btn:hover {
    background: var(--color-border, #e5e7eb);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Footer */
.widget-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-muted-bg, #f9fafb);
}

.refresh-btn {
    width: 100%;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    color: var(--color-dimmed, #6b7280);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.refresh-btn:hover:not(:disabled) {
    background: var(--color-bg, #fff);
    color: var(--color-contrast, #1f2937);
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
