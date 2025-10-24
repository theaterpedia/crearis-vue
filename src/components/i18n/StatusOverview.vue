<template>
    <div class="status-overview">
        <h2>Translation Status Overview</h2>

        <!-- Loading State -->
        <div v-if="loading" class="loading">
            <p>⏳ Loading status data...</p>
        </div>

        <!-- Stats Cards -->
        <div v-if="!loading" class="stats-grid">
            <div class="stat-card total">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">Total Translations</div>
            </div>

            <div class="stat-card complete">
                <div class="stat-value">{{ stats.complete }}</div>
                <div class="stat-label">✅ Complete</div>
                <div class="stat-percent">{{ getPercent(stats.complete, stats.total) }}%</div>
            </div>

            <div class="stat-card pending">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">⏳ Pending</div>
                <div class="stat-percent">{{ getPercent(stats.pending, stats.total) }}%</div>
            </div>

            <div class="stat-card draft">
                <div class="stat-value">{{ stats.draft }}</div>
                <div class="stat-label">📝 Draft</div>
                <div class="stat-percent">{{ getPercent(stats.draft, stats.total) }}%</div>
            </div>
        </div>

        <!-- By Type -->
        <div v-if="!loading" class="section">
            <h3>By Type</h3>
            <div class="type-grid">
                <div v-for="(count, type) in stats.byType" :key="type" class="type-card">
                    <div class="type-icon">{{ getTypeIcon(type) }}</div>
                    <div class="type-name">{{ type }}</div>
                    <div class="type-count">{{ count }}</div>
                </div>
            </div>
        </div>

        <!-- By Status -->
        <div v-if="!loading" class="section">
            <h3>By Status</h3>
            <div class="status-breakdown">
                <div v-for="(count, status) in stats.byStatus" :key="status" class="status-row">
                    <div class="status-label">
                        <span :class="['status-badge', `status-${status}`]">
                            {{ getStatusLabel(status) }}
                        </span>
                    </div>
                    <div class="status-bar-container">
                        <div class="status-bar" :class="`status-${status}`"
                            :style="{ width: getPercent(count, stats.total) + '%' }"></div>
                    </div>
                    <div class="status-count">{{ count }}</div>
                </div>
            </div>
        </div>

        <!-- Missing Translations -->
        <div v-if="!loading && missingTranslations.length > 0" class="section">
            <h3>Missing Translations</h3>
            <div class="missing-list">
                <div v-for="item in missingTranslations" :key="`${item.name}-${item.variation}`" class="missing-item">
                    <div class="missing-name">
                        <strong>{{ item.name }}</strong>
                        <span v-if="item.variation !== 'false'" class="variation-badge">
                            {{ item.variation }}
                        </span>
                    </div>
                    <div class="missing-type">
                        <span :class="['badge', `type-${item.type}`]">{{ item.type }}</span>
                    </div>
                    <div class="missing-languages">
                        <span v-if="!item.text.de" class="lang-missing">🇩🇪 de</span>
                        <span v-if="!item.text.en" class="lang-missing">🇬🇧 en</span>
                        <span v-if="!item.text.cz" class="lang-missing">🇨🇿 cz</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div v-if="!loading" class="actions">
            <Button @click="loadStats">🔄 Refresh</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Button from '@/components/Button.vue'

interface Translation {
    id: number
    name: string
    variation: string
    type: string
    text: Record<string, string>
    status: string
}

const loading = ref(false)
const translations = ref<Translation[]>([])

const stats = computed(() => {
    const total = translations.value.length
    const complete = translations.value.filter(t => t.status === 'ok').length
    const draft = translations.value.filter(t => t.status === 'draft').length
    const pending = total - complete - draft

    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    for (const t of translations.value) {
        byType[t.type] = (byType[t.type] || 0) + 1
        byStatus[t.status] = (byStatus[t.status] || 0) + 1
    }

    return {
        total,
        complete,
        pending,
        draft,
        byType,
        byStatus
    }
})

const missingTranslations = computed(() => {
    return translations.value
        .filter(t => {
            const text = typeof t.text === 'string' ? JSON.parse(t.text) : t.text
            return !text.de || !text.en || !text.cz
        })
        .map(t => ({
            ...t,
            text: typeof t.text === 'string' ? JSON.parse(t.text) : t.text
        }))
})

async function loadStats() {
    loading.value = true

    try {
        const response = await fetch('/api/i18n')

        if (!response.ok) {
            throw new Error('Failed to load translations')
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error('Invalid response')
        }

        translations.value = data.i18n_codes || []
    } catch (err) {
        console.error('Error loading stats:', err)
    } finally {
        loading.value = false
    }
}

function getPercent(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
}

function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        button: '🔘',
        nav: '🧭',
        field: '📝',
        desc: '📄'
    }
    return icons[type] || '❓'
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        ok: '✅ Complete',
        de: '🇩🇪 German Only',
        en: '🇬🇧 English Added',
        cz: '🇨🇿 Czech Added',
        draft: '📝 Draft'
    }
    return labels[status] || status
}

onMounted(() => {
    loadStats()
})
</script>

<style scoped>
.status-overview {
    max-width: 100%;
}

h2 {
    margin: 0 0 2rem 0;
    font-size: 1.5rem;
    color: #111827;
}

h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    color: #374151;
}

.loading {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    padding: 1.5rem;
    border-radius: 8px;
    background: white;
    border: 2px solid #e5e7eb;
}

.stat-card.total {
    border-color: #3b82f6;
    background: #eff6ff;
}

.stat-card.complete {
    border-color: #10b981;
    background: #d1fae5;
}

.stat-card.pending {
    border-color: #f59e0b;
    background: #fef3c7;
}

.stat-card.draft {
    border-color: #6b7280;
    background: #f3f4f6;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
}

.stat-percent {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
}

.section {
    margin-bottom: 2rem;
}

.type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}

.type-card {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    text-align: center;
}

.type-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.type-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    text-transform: capitalize;
    margin-bottom: 0.25rem;
}

.type-count {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
}

.status-breakdown {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.status-row {
    display: grid;
    grid-template-columns: 150px 1fr 60px;
    gap: 1rem;
    align-items: center;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-badge.status-ok {
    background: #d1fae5;
    color: #065f46;
}

.status-badge.status-de {
    background: #fee2e2;
    color: #991b1b;
}

.status-badge.status-en {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.status-cz {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.status-draft {
    background: #e5e7eb;
    color: #374151;
}

.status-bar-container {
    background: #e5e7eb;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
}

.status-bar {
    height: 100%;
    transition: width 0.3s ease;
}

.status-bar.status-ok {
    background: #10b981;
}

.status-bar.status-de {
    background: #ef4444;
}

.status-bar.status-en {
    background: #f59e0b;
}

.status-bar.status-cz {
    background: #f59e0b;
}

.status-bar.status-draft {
    background: #6b7280;
}

.status-count {
    text-align: right;
    font-weight: 600;
    color: #374151;
}

.missing-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.missing-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    background: #fef3c7;
    border-radius: 4px;
    border-left: 4px solid #f59e0b;
}

.missing-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.variation-badge {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 4px;
    font-size: 0.75rem;
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
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

.missing-languages {
    display: flex;
    gap: 0.5rem;
}

.lang-missing {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 4px;
    font-weight: 500;
}

.actions {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
}
</style>
