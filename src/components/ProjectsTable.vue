<template>
    <div class="projects-table-wrapper">
        <div class="table-header">
            <h3 class="table-title">Projekte</h3>
            <button class="btn btn-primary btn-sm" @click="$emit('create')">
                + Neues Projekt
            </button>
        </div>

        <div v-if="loading" class="table-loading">Lädt...</div>
        <div v-else-if="projects.length === 0" class="table-empty">
            Keine Projekte vorhanden
        </div>
        <table v-else class="projects-table">
            <thead>
                <tr>
                    <th>Domaincode</th>
                    <th>Heading</th>
                    <th>Beschreibung</th>
                    <th>Status</th>
                    <th>Homepage</th>
                    <th>Erstellt</th>
                    <th>Aktionen</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="project in projects" :key="project.id">
                    <td class="td-domaincode">{{ project.name }}</td>
                    <td class="td-heading">
                        <HeadingParser v-if="project.heading" :content="project.heading" as="span" :compact="true" />
                        <span v-else>-</span>
                    </td>
                    <td class="td-description">{{ project.description || '-' }}</td>
                    <td>
                        <span v-if="project.status_display" class="status-badge">
                            {{ project.status_display }}
                        </span>
                        <span v-else class="status-badge status-unknown">-</span>
                    </td>
                    <td class="td-link">
                        <RouterLink :to="`/sites/${project.name}`" class="project-link" title="Homepage besuchen">
                            🔗 Besuchen
                        </RouterLink>
                    </td>
                    <td class="td-date">{{ formatDate(project.created_at) }}</td>
                    <td class="td-actions">
                        <button class="btn-icon" @click="$emit('edit', project)" title="Bearbeiten">
                            ✎
                        </button>
                        <button class="btn-icon btn-icon-danger" @click="$emit('delete', project)" title="Löschen">
                            🗑
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import { useStatus } from '@/composables/useStatus'
import HeadingParser from './HeadingParser.vue'

interface Project {
    id: string
    name: string  // domaincode
    heading?: string
    description?: string
    status_display?: string  // Computed column from database
    created_at: string
}

const props = defineProps<{
    projects: Project[]
    loading?: boolean
}>()

defineEmits<{
    create: []
    edit: [project: Project]
    delete: [project: Project]
}>()

// No longer need status helpers - using status_display from database
// const { getStatusDisplayName, getStatusIdByName, cacheInitialized } = useStatus()

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return dateString
    }
}
</script>

<style scoped>
.projects-table-wrapper {
    margin-top: 3rem;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.table-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0;
}

.table-loading,
.table-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
}

.projects-table {
    width: 100%;
    border-collapse: collapse;
}

.projects-table thead {
    background: var(--color-muted-bg);
    border-bottom: 2px solid var(--color-border);
}

.projects-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.projects-table tbody tr {
    border-bottom: 1px solid var(--color-border);
    transition: background 0.2s ease;
}

.projects-table tbody tr:hover {
    background: var(--color-muted-bg);
}

.projects-table td {
    padding: 1rem;
    font-size: 0.9375rem;
    color: var(--color-contrast);
}

.td-domaincode {
    font-family: monospace;
    font-weight: 600;
    color: var(--color-primary-bg);
}

.td-heading {
    min-width: 200px;
}

.td-description {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.td-date {
    color: var(--color-dimmed);
    font-size: 0.875rem;
}

.td-link {
    white-space: nowrap;
}

.project-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    text-decoration: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.project-link:hover {
    background: oklch(from var(--color-primary-bg) calc(l * 0.9) c h);
    transform: translateY(-1px);
}

.td-actions {
    display: flex;
    gap: 0.5rem;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-button);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-active {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.status-draft {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.status-archived {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--radius-button);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.btn-primary:hover {
    background: oklch(from var(--color-primary-bg) calc(l * 0.9) c h);
}

.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
}

.btn-icon {
    width: 2rem;
    height: 2rem;
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

.btn-icon:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.btn-icon-danger:hover {
    background: var(--color-negative-bg);
    border-color: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}
</style>
