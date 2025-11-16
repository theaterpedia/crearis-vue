<template>
    <div class="translation-list">
        <div class="header">
            <h2>Translation Management</h2>
            <Button @click="showCreateModal = true">
                ➕ Add Translation
            </Button>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group">
                <label>Type:</label>
                <select v-model="filters.type" @change="loadTranslations">
                    <option value="">All Types</option>
                    <option value="button">Button</option>
                    <option value="nav">Navigation</option>
                    <option value="field">Field</option>
                    <option value="desc">Description</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Status:</label>
                <select v-model="filters.status" @change="loadTranslations">
                    <option value="">All Statuses</option>
                    <option value="ok">✅ Complete (ok)</option>
                    <option value="de">🇩🇪 Needs Translation (de)</option>
                    <option value="en">🇬🇧 English Pending (en)</option>
                    <option value="cz">🇨🇿 Czech Pending (cz)</option>
                    <option value="draft">📝 Draft</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Search:</label>
                <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search by name..." />
            </div>

            <div class="filter-group">
                <label>Sort By:</label>
                <select v-model="filters.orderBy" @change="loadTranslations">
                    <option value="name">Name</option>
                    <option value="type">Type</option>
                    <option value="status">Status</option>
                    <option value="updated_at">Last Updated</option>
                </select>
                <select v-model="filters.order" @change="loadTranslations">
                    <option value="asc">↑ Ascending</option>
                    <option value="desc">↓ Descending</option>
                </select>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading">
            <p>⏳ Loading translations...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error">
            <p>❌ {{ error }}</p>
            <Button @click="loadTranslations">Retry</Button>
        </div>

        <!-- Translations Table -->
        <div v-if="!loading && !error" class="table-container">
            <table class="translations-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Variation</th>
                        <th>Type</th>
                        <th>German</th>
                        <th>English</th>
                        <th>Czech</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="translation in translations" :key="translation.id">
                        <td class="name-cell">{{ translation.name }}</td>
                        <td class="variation-cell">
                            <span v-if="translation.variation !== 'false'" class="badge variation">
                                {{ translation.variation }}
                            </span>
                            <span v-else class="badge root">root</span>
                        </td>
                        <td>
                            <span :class="['badge', `type-${translation.type}`]">
                                {{ translation.type }}
                            </span>
                        </td>
                        <td class="text-cell">{{ getText(translation, 'de') }}</td>
                        <td class="text-cell">{{ getText(translation, 'en') }}</td>
                        <td class="text-cell">{{ getText(translation, 'cz') }}</td>
                        <td>
                            <span :class="['badge', `status-${translation.status}`]">
                                {{ getStatusLabel(translation.status) }}
                            </span>
                        </td>
                        <td class="actions-cell">
                            <button @click="editTranslation(translation)" class="action-btn edit">
                                ✏️
                            </button>
                            <button @click="deleteTranslation(translation)" class="action-btn delete">
                                🗑️
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-if="translations.length === 0" class="empty-state">
                <p>No translations found.</p>
                <Button @click="showCreateModal = true">Create First Translation</Button>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <TranslationEditor v-if="showCreateModal || editingTranslation" :translation="editingTranslation"
            @close="closeModal" @saved="onSaved" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from '@/components/Button.vue'
import TranslationEditor from './TranslationEditor.vue'

interface Translation {
    id: number
    name: string
    variation: string
    type: string
    text: Record<string, string>
    status: string
    created_at: string
    updated_at: string
}

const translations = ref<Translation[]>([])
const loading = ref(false)
const error = ref('')
const showCreateModal = ref(false)
const editingTranslation = ref<Translation | null>(null)
const searchQuery = ref('')

const filters = ref({
    type: '',
    status: '',
    orderBy: 'name',
    order: 'asc'
})

let searchTimeout: number | null = null

async function loadTranslations() {
    loading.value = true
    error.value = ''

    try {
        const params = new URLSearchParams()

        if (filters.value.type) params.append('type', filters.value.type)
        if (filters.value.status) params.append('status', filters.value.status)
        if (searchQuery.value) params.append('name', searchQuery.value)
        if (filters.value.orderBy) params.append('orderBy', filters.value.orderBy)
        if (filters.value.order) params.append('order', filters.value.order)

        const response = await fetch(`/api/i18n?${params}`)

        if (!response.ok) {
            throw new Error(`Failed to load translations: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error('Invalid response from server')
        }

        translations.value = data.i18n_codes || []
    } catch (err: any) {
        error.value = err.message
        console.error('Error loading translations:', err)
    } finally {
        loading.value = false
    }
}

function debouncedSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
        loadTranslations()
    }, 300)
}

function getText(translation: Translation, lang: string): string {
    if (typeof translation.text === 'string') {
        try {
            const parsed = JSON.parse(translation.text)
            return parsed[lang] || '—'
        } catch {
            return '—'
        }
    }
    return translation.text[lang] || '—'
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'ok': '✅ Complete',
        'de': '🇩🇪 de',
        'en': '🇬🇧 en',
        'cz': '🇨🇿 cz',
        'draft': '📝 Draft'
    }
    return labels[status] || status
}

function editTranslation(translation: Translation) {
    editingTranslation.value = translation
}

async function deleteTranslation(translation: Translation) {
    if (!confirm(`Delete translation "${translation.name}"?`)) {
        return
    }

    try {
        const response = await fetch(`/api/i18n/${translation.id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error('Failed to delete translation')
        }

        await loadTranslations()
    } catch (err: any) {
        alert(`Error: ${err.message}`)
    }
}

function closeModal() {
    showCreateModal.value = false
    editingTranslation.value = null
}

function onSaved() {
    closeModal()
    loadTranslations()
}

onMounted(() => {
    loadTranslations()
})
</script>

<style scoped>
.translation-list {
    max-width: 100%;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #111827;
}

.filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.filter-group select,
.filter-group input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
}

.loading,
.error {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
}

.error {
    color: #ef4444;
}

.table-container {
    overflow-x: auto;
}

.translations-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.translations-table th {
    background: #f9fafb;
    padding: 0.75rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
}

.translations-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #111827;
}

.name-cell {
    font-weight: 500;
    color: #2563eb;
}

.text-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.badge.root {
    background: #e5e7eb;
    color: #6b7280;
}

.badge.variation {
    background: #dbeafe;
    color: #1e40af;
}

.badge.type-button {
    background: #dbeafe;
    color: #1e40af;
}

.badge.type-nav {
    background: #d1fae5;
    color: #065f46;
}

.badge.type-field {
    background: #fef3c7;
    color: #92400e;
}

.badge.type-desc {
    background: #e0e7ff;
    color: #3730a3;
}

.badge.status-ok {
    background: #d1fae5;
    color: #065f46;
}

.badge.status-de {
    background: #fee2e2;
    color: #991b1b;
}

.badge.status-en {
    background: #fef3c7;
    color: #92400e;
}

.badge.status-cz {
    background: #fef3c7;
    color: #92400e;
}

.badge.status-draft {
    background: #e5e7eb;
    color: #374151;
}

.actions-cell {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: #f9fafb;
}

.action-btn.delete:hover {
    border-color: #ef4444;
    background: #fef2f2;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
}

.empty-state p {
    margin-bottom: 1rem;
}
</style>
