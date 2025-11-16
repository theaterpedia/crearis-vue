<template>
    <div class="releases-table-wrapper">
        <div class="releases-table-header">
            <h3>Releases</h3>
            <button class="btn-primary" @click="$emit('create')">
                + Neues Release
            </button>
        </div>

        <div v-if="loading" class="loading-state">
            Lädt Releases...
        </div>

        <div v-else-if="releases.length === 0" class="empty-state">
            <p>Keine Releases vorhanden.</p>
            <button class="btn-secondary" @click="$emit('create')">
                + Erstes Release erstellen
            </button>
        </div>

        <table v-else class="releases-table">
            <thead>
                <tr>
                    <th>Version</th>
                    <th>Beschreibung</th>
                    <th>Status</th>
                    <th>Release-Datum</th>
                    <th>Tasks</th>
                    <th>Erstellt</th>
                    <th>Aktionen</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="release in releases" :key="release.id">
                    <td class="version-cell">
                        <strong>v{{ release.version }}</strong>
                    </td>
                    <td class="description-cell">
                        {{ release.description || '-' }}
                    </td>
                    <td>
                        <span :class="['status-badge', `status-${release.state}`]">
                            {{ getStatusLabel(release.state) }}
                        </span>
                    </td>
                    <td class="date-cell">
                        {{ formatDate(release.release_date) }}
                    </td>
                    <td class="count-cell">
                        <span class="task-count">{{ release.task_count || 0 }}</span>
                    </td>
                    <td class="date-cell">
                        {{ formatDate(release.created_at) }}
                    </td>
                    <td class="actions-cell">
                        <button class="btn-icon" @click="$emit('edit', release)" title="Bearbeiten">
                            ✎
                        </button>
                        <button class="btn-icon btn-danger" @click="$emit('delete', release)" title="Löschen">
                            🗑
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
interface Release {
    id: string
    version: string
    version_major: number
    version_minor: number
    description?: string
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
    created_at: string
    updated_at: string
    task_count?: number
}

defineProps<{
    releases: Release[]
    loading: boolean
}>()

defineEmits<{
    create: []
    edit: [release: Release]
    delete: [release: Release]
}>()

function getStatusLabel(state: string): string {
    const labels: Record<string, string> = {
        idea: 'Idee',
        draft: 'Entwurf',
        final: 'Final',
        trash: 'Papierkorb'
    }
    return labels[state] || state
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch {
        return '-'
    }
}
</script>

<style scoped>
.releases-table-wrapper {
    margin-top: 3rem;
    background: var(--color-surface);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.releases-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.releases-table-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
}

.loading-state,
.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);
}

.empty-state p {
    margin-bottom: 1rem;
}

.releases-table {
    width: 100%;
    border-collapse: collapse;
}

.releases-table th {
    background: var(--color-background);
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text);
    border-bottom: 2px solid var(--color-border);
}

.releases-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
}

.releases-table tbody tr:hover {
    background: var(--color-background);
}

.version-cell strong {
    color: var(--color-accent);
    font-family: 'Courier New', monospace;
}

.description-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.date-cell {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
}

.count-cell {
    text-align: center;
}

.task-count {
    display: inline-block;
    background: var(--color-accent-bg);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-idea {
    background: #e3f2fd;
    color: #1976d2;
}

.status-draft {
    background: #fff3e0;
    color: #f57c00;
}

.status-final {
    background: #e8f5e9;
    color: #388e3c;
}

.status-trash {
    background: #ffebee;
    color: #d32f2f;
}

.actions-cell {
    white-space: nowrap;
}

.btn-primary,
.btn-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-accent-bg);
    color: white;
}

.btn-primary:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
    background: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    background: var(--color-surface);
    border-color: var(--color-accent-contrast);
}

.btn-icon {
    background: none;
    border: none;
    padding: 0.25rem 0.5rem;
    margin: 0 0.25rem;
    cursor: pointer;
    font-size: 1.1rem;
    transition: transform 0.2s;
}

.btn-icon:hover {
    transform: scale(1.2);
}

.btn-danger:hover {
    filter: hue-rotate(-10deg) brightness(1.2);
}
</style>
