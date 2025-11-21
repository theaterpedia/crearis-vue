<!-- SysregAdminView.vue - Complete Sysreg Administration Interface -->
<template>
    <div class="sysreg-admin">
        <div class="admin-header">
            <h1>🏷️ Sysreg Administration</h1>
            <p class="subtitle">System Registry: Tag & Status Management</p>
        </div>

        <!-- Tab Navigation -->
        <div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" :class="['tab', { active: activeTab === tab.id }]"
                @click="activeTab = tab.id">
                {{ tab.icon }} {{ tab.label }}
            </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
            <!-- Tab 1: Tag Viewer -->
            <div v-if="activeTab === 'viewer'" class="panel">
                <div class="viewer-topbar">
                    <div class="filter-group language-switcher-group">
                        <label>Language:</label>
                        <div class="language-switcher-inline">
                            <button type="button" @click.prevent="viewerLanguage = 'de'"
                                :class="['lang-btn', { active: viewerLanguage === 'de' }]">
                                🇩🇪
                            </button>
                            <button type="button" @click.prevent="viewerLanguage = 'en'"
                                :class="['lang-btn', { active: viewerLanguage === 'en' }]">
                                🇬🇧
                            </button>
                            <button type="button" @click.prevent="viewerLanguage = 'cz'"
                                :class="['lang-btn', { active: viewerLanguage === 'cz' }]">
                                🇨🇿
                            </button>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Tag Family:</label>
                        <select v-model="viewerFamily" class="form-select" @change="onFamilyChange">
                            <option value="status">Status (Workflow States)</option>
                            <option value="config">Config (Feature Flags)</option>
                            <option value="rtags">Record Tags (Favorite, Pinned, etc.)</option>
                            <option value="ctags">Content Tags (Age, Type, etc.)</option>
                            <option value="ttags">Topic Tags (Democracy, Environment, etc.)</option>
                            <option value="dtags">Domain Tags (Games, Workshops, etc.)</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Tag Logic:</label>
                        <select v-model="filterLogic" class="form-select">
                            <option value="">All Logic Types</option>
                            <option v-for="logic in availableLogicTypes" :key="logic" :value="logic">{{ logic }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Bit Group:</label>
                        <select v-model="filterBitGroup" class="form-select">
                            <option value="">All Bit Groups</option>
                            <option v-for="group in availableBitGroups" :key="group" :value="group">{{ group }}</option>
                        </select>
                    </div>
                </div>

                <!-- Tag Table -->
                <div class="tag-table-container">
                    <table class="tag-table">
                        <thead>
                            <tr>
                                <th>Value</th>
                                <th>Internal Name</th>
                                <th>Label</th>
                                <th>Logic</th>
                                <th>Default</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="tag in viewerFilteredTags" :key="tag.id" @click="editTag(tag)"
                                class="clickable-row">
                                <td><code class="tag-value-code">{{ tag.value }}</code></td>
                                <td>{{ tag.name }}</td>
                                <td>{{ getTagLabel(tag) }}</td>
                                <td><span class="logic-badge">{{ tag.taglogic }}</span></td>
                                <td>
                                    <span v-if="tag.is_default" class="badge badge-default">✓</span>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" @click.stop="editTag(tag)">
                                        ✏️ Edit
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="viewerFilteredTags.length === 0" class="empty-state">
                        <p>No tags match the current filters.</p>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Create Tags -->
            <div v-if="activeTab === 'create'" class="panel">
                <div class="panel-header">
                    <h2>Tag Management</h2>
                    <button class="btn btn-primary" @click="showCreateDialog = true">
                        ➕ Create New Tag
                    </button>
                </div>

                <!-- Tag Family Selector -->
                <div class="family-selector">
                    <label>Tag Family:</label>
                    <select v-model="selectedFamily" class="form-select">
                        <option value="status">Status (Workflow States)</option>
                        <option value="config">Config (Feature Flags)</option>
                        <option value="rtags">Record Tags (Favorite, Pinned, etc.)</option>
                        <option value="ctags">Content Tags (Age, Type, etc.)</option>
                        <option value="ttags">Topic Tags (Democracy, Environment, etc.)</option>
                        <option value="dtags">Domain Tags (Games, Workshops, etc.)</option>
                    </select>
                </div>

                <!-- Tag List -->
                <div class="tag-list">
                    <div v-for="tag in filteredTags" :key="tag.id" class="tag-item">
                        <div class="tag-info">
                            <div class="tag-header">
                                <span class="tag-value">{{ tag.value }}</span>
                                <span class="tag-name">{{ tag.name }}</span>
                                <span v-if="tag.is_default" class="badge badge-default">Default</span>
                            </div>
                            <div class="tag-details">
                                <span class="tag-label">{{ getLabel(tag) }}</span>
                                <span class="tag-logic">{{ tag.taglogic }}</span>
                            </div>
                            <p v-if="tag.description" class="tag-description">{{ tag.description }}</p>
                        </div>
                        <div class="tag-actions">
                            <button class="btn btn-sm btn-secondary" @click="editTag(tag)">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-sm btn-danger" @click="deleteTag(tag)" :disabled="tag.is_default">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Analytics -->
            <div v-if="activeTab === 'analytics'" class="panel">
                <div class="panel-header">
                    <h2>Usage Analytics</h2>
                    <button class="btn btn-secondary" @click="refreshAnalytics">
                        🔄 Refresh
                    </button>
                </div>

                <div v-if="analyticsLoading" class="loading">
                    Loading analytics...
                </div>

                <div v-else class="analytics-grid">
                    <!-- Status Distribution -->
                    <div class="analytics-card">
                        <h3>📊 Status Distribution (Images)</h3>
                        <div class="distribution-chart">
                            <div v-for="stat in statusDistribution" :key="stat.value" class="chart-bar">
                                <div class="bar-label">{{ stat.label }}</div>
                                <div class="bar-container">
                                    <div class="bar-fill" :style="{ width: stat.percentage + '%' }"></div>
                                    <span class="bar-value">{{ stat.count }} ({{ stat.percentage.toFixed(1) }}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Topic Tags -->
                    <div class="analytics-card">
                        <h3>🔥 Most Used Topic Tags</h3>
                        <div class="tag-usage-list">
                            <div v-for="tag in topTtags" :key="tag.value" class="usage-item">
                                <span class="usage-label">{{ tag.label }}</span>
                                <span class="usage-count">{{ tag.count }} uses</span>
                                <div class="usage-bar">
                                    <div class="usage-fill" :style="{ width: tag.percentage + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Domain Tags -->
                    <div class="analytics-card">
                        <h3>🎯 Most Used Domain Tags</h3>
                        <div class="tag-usage-list">
                            <div v-for="tag in topDtags" :key="tag.value" class="usage-item">
                                <span class="usage-label">{{ tag.label }}</span>
                                <span class="usage-count">{{ tag.count }} uses</span>
                                <div class="usage-bar">
                                    <div class="usage-fill" :style="{ width: tag.percentage + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Record Tags Usage -->
                    <div class="analytics-card">
                        <h3>⭐ Record Tags Usage</h3>
                        <div class="tag-usage-list">
                            <div v-for="tag in rtagsUsage" :key="tag.value" class="usage-item">
                                <span class="usage-label">{{ tag.label }}</span>
                                <span class="usage-count">{{ tag.count }} uses</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 3: Batch Operations -->
            <div v-if="activeTab === 'batch'" class="panel">
                <div class="panel-header">
                    <h2>Batch Operations</h2>
                </div>

                <div class="batch-form">
                    <div class="form-group">
                        <label>Entity Type:</label>
                        <select v-model="batchEntity" class="form-select">
                            <option value="images">Images</option>
                            <option value="projects">Projects</option>
                            <option value="events">Events</option>
                            <option value="posts">Posts</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Entity IDs (comma-separated):</label>
                        <input v-model="batchIds" type="text" class="form-input" placeholder="1, 2, 3, 4" />
                    </div>

                    <div class="form-group">
                        <label>Operation:</label>
                        <select v-model="batchOperation" class="form-select">
                            <option value="status">Update Status</option>
                            <option value="ttags-add">Add Topic Tags</option>
                            <option value="ttags-remove">Remove Topic Tags</option>
                            <option value="dtags-add">Add Domain Tags</option>
                            <option value="dtags-remove">Remove Domain Tags</option>
                            <option value="config-toggle">Toggle Config Bit</option>
                        </select>
                    </div>

                    <div v-if="batchOperation === 'status'" class="form-group">
                        <label>New Status:</label>
                        <select v-model="batchStatusValue" class="form-select">
                            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>

                    <div v-if="batchOperation.includes('ttags')" class="form-group">
                        <label>Topic Tags:</label>
                        <div class="tag-checkboxes">
                            <label v-for="opt in ttagsOptions" :key="opt.value" class="checkbox-label">
                                <input type="checkbox" :value="opt.value" v-model="batchTtagsValues" />
                                {{ opt.label }}
                            </label>
                        </div>
                    </div>

                    <div v-if="batchOperation.includes('dtags')" class="form-group">
                        <label>Domain Tags:</label>
                        <div class="tag-checkboxes">
                            <label v-for="opt in dtagsOptions" :key="opt.value" class="checkbox-label">
                                <input type="checkbox" :value="opt.value" v-model="batchDtagsValues" />
                                {{ opt.label }}
                            </label>
                        </div>
                    </div>

                    <div v-if="batchOperation === 'config-toggle'" class="form-group">
                        <label>Config Bit:</label>
                        <select v-model="batchConfigBit" class="form-select">
                            <option value="0">Bit 0 - Public/Visible</option>
                            <option value="1">Bit 1 - Featured</option>
                            <option value="2">Bit 2 - Needs Review</option>
                            <option value="3">Bit 3 - Has People</option>
                            <option value="4">Bit 4 - AI Generated</option>
                            <option value="5">Bit 5 - High Resolution</option>
                        </select>
                    </div>

                    <button class="btn btn-primary btn-lg" @click="executeBatch" :disabled="batchRunning">
                        {{ batchRunning ? '⏳ Processing...' : '▶️ Execute Batch Operation' }}
                    </button>

                    <!-- Progress -->
                    <div v-if="batchProgress.total > 0" class="batch-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                        </div>
                        <div class="progress-text">
                            {{ batchProgress.completed }} / {{ batchProgress.total }} completed
                            <span v-if="batchProgress.failed > 0" class="text-error">
                                ({{ batchProgress.failed }} failed)
                            </span>
                        </div>
                    </div>

                    <!-- Results -->
                    <div v-if="batchResult" class="batch-result">
                        <div :class="['result-box', batchResult.success ? 'success' : 'error']">
                            <h4>{{ batchResult.success ? '✅ Success' : '❌ Failed' }}</h4>
                            <p>
                                {{ batchResult.succeeded }} succeeded, {{ batchResult.failed }} failed
                            </p>
                            <div v-if="batchResult.errors.length > 0" class="errors">
                                <h5>Errors:</h5>
                                <ul>
                                    <li v-for="err in batchResult.errors" :key="err.id">
                                        ID {{ err.id }}: {{ err.error }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Edit Tag Dialog -->
        <div v-if="showCreateDialog || editingTag" class="modal-overlay" @click.self="closeDialog">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h2>{{ editingTag ? '✏️ Edit Tag' : '➕ Create New Tag' }}</h2>
                    <button class="btn-close" @click="closeDialog">✕</button>
                </div>
                <div class="modal-body">
                    <div class="modal-body-columns">
                        <!-- Left Column: Structural Fields -->
                        <div class="modal-column-left">
                            <div class="form-group">
                                <label>Tag Family: <span class="required">*</span></label>
                                <select v-model="tagForm.tagfamily" class="form-select" :disabled="!!editingTag">
                                    <option value="status">Status</option>
                                    <option value="config">Config</option>
                                    <option value="rtags">Record Tags</option>
                                    <option value="ctags">Content Tags</option>
                                    <option value="ttags">Topic Tags</option>
                                    <option value="dtags">Domain Tags</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Value (Hex): <span class="required">*</span></label>
                                <input v-model="tagForm.value" type="text" class="form-input" placeholder="\x01"
                                    :disabled="!!editingTag" />
                                <small>Format: \x01, \x02, \x04, \x08, etc.</small>
                            </div>

                            <div class="form-group">
                                <label>Internal Name: <span class="required">*</span></label>
                                <input v-model="tagForm.name" type="text" class="form-input" placeholder="democracy" />
                            </div>

                            <div class="form-group">
                                <label>Tag Logic: <span class="required">*</span></label>
                                <select v-model="tagForm.taglogic" class="form-select">
                                    <option value="category">Category (single selection)</option>
                                    <option value="toggle">Toggle (on/off)</option>
                                    <option value="option">Option (multiple choice)</option>
                                    <option value="subcategory">Subcategory</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="tagForm.is_default" />
                                    Default tag (cannot be deleted)
                                </label>
                            </div>
                        </div>

                        <!-- Right Column: Labels and Description -->
                        <div class="modal-column-right">
                            <div class="form-group">
                                <label>Label (English):</label>
                                <input v-model="tagForm.label_en" type="text" class="form-input"
                                    placeholder="Democracy" />
                            </div>

                            <div class="form-group">
                                <label>Label (German):</label>
                                <input v-model="tagForm.label_de" type="text" class="form-input"
                                    placeholder="Demokratie" />
                            </div>

                            <div class="form-group">
                                <label>Label (Czech):</label>
                                <input v-model="tagForm.label_cz" type="text" class="form-input"
                                    placeholder="Demokracie" />
                            </div>

                            <div class="form-group">
                                <label>Description:</label>
                                <textarea v-model="tagForm.description" class="form-textarea" rows="8"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
                    <button class="btn btn-primary" @click="saveTag" :disabled="!isTagFormValid">
                        {{ editingTag ? '💾 Save Changes' : '➕ Create Tag' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSysregOptions } from '@/composables/useSysregOptions'
import { useSysregAnalytics } from '@/composables/useSysregAnalytics'
import { useSysregBatchOperations } from '@/composables/useSysregBatchOperations'

// Tab state
const activeTab = ref<'viewer' | 'create' | 'analytics' | 'batch'>('viewer')
const tabs = [
    { id: 'viewer', label: 'Tag Viewer', icon: '👁️' },
    { id: 'create', label: 'Create Tags', icon: '➕' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'batch', label: 'Batch Operations', icon: '⚡' }
]

// Tag management
const {
    statusOptions,
    configOptions,
    rtagsOptions,
    ctagsOptions,
    ttagsOptions,
    dtagsOptions,
    loading: optionsLoading,
    fetchOptions
} = useSysregOptions()

const selectedFamily = ref<string>('status')
const allTags = ref<any[]>([])
const showCreateDialog = ref(false)
const editingTag = ref<any>(null)

// Viewer tab state
const viewerFamily = ref<string>('status')
const filterLogic = ref<string>('')
const filterBitGroup = ref<string>('')
const viewerLanguage = ref<'de' | 'en' | 'cz'>('de')

const tagForm = ref({
    tagfamily: 'status',
    value: '',
    name: '',
    taglogic: 'category',
    label_en: '',
    label_de: '',
    label_cz: '',
    description: '',
    is_default: false
})

const filteredTags = computed(() => {
    const familyOptions: Record<string, any> = {
        status: statusOptions.value,
        config: configOptions.value,
        rtags: rtagsOptions.value,
        ctags: ctagsOptions.value,
        ttags: ttagsOptions.value,
        dtags: dtagsOptions.value
    }
    return familyOptions[selectedFamily.value] || []
})

const isTagFormValid = computed(() => {
    return tagForm.value.tagfamily &&
        tagForm.value.value &&
        tagForm.value.name &&
        tagForm.value.taglogic
})

// Viewer computed properties
const viewerTags = computed(() => {
    const familyOptions: Record<string, any> = {
        status: statusOptions.value,
        config: configOptions.value,
        rtags: rtagsOptions.value,
        ctags: ctagsOptions.value,
        ttags: ttagsOptions.value,
        dtags: dtagsOptions.value
    }
    return familyOptions[viewerFamily.value] || []
})

const availableLogicTypes = computed(() => {
    const logicTypes = new Set<string>()
    viewerTags.value.forEach(tag => {
        if (tag.taglogic) logicTypes.add(tag.taglogic)
    })
    return Array.from(logicTypes).sort()
})

const availableBitGroups = computed(() => {
    // Extract bit positions and group them
    const bitGroups = new Set<string>()
    viewerTags.value.forEach(tag => {
        if (tag.value) {
            const hex = tag.value.replace('\\x', '')
            const byteValue = parseInt(hex, 16)
            if (!isNaN(byteValue) && byteValue > 0) {
                // Find which bit is set
                let bitPos = 0
                let temp = byteValue
                while (temp > 1) {
                    temp = temp >> 1
                    bitPos++
                }
                // Group by ranges: 0-3, 4-7, 8-15, etc.
                const groupStart = Math.floor(bitPos / 4) * 4
                const groupEnd = groupStart + 3
                bitGroups.add(`Bits ${groupStart}-${groupEnd}`)
            }
        }
    })
    return Array.from(bitGroups).sort()
})

const viewerFilteredTags = computed(() => {
    let tags = viewerTags.value

    // Filter by logic type
    if (filterLogic.value) {
        tags = tags.filter(tag => tag.taglogic === filterLogic.value)
    }

    // Filter by bit group
    if (filterBitGroup.value) {
        const match = filterBitGroup.value.match(/Bits (\d+)-(\d+)/)
        if (match) {
            const rangeStart = parseInt(match[1])
            const rangeEnd = parseInt(match[2])
            tags = tags.filter(tag => {
                if (!tag.value) return false
                const hex = tag.value.replace('\\x', '')
                const byteValue = parseInt(hex, 16)
                if (isNaN(byteValue) || byteValue === 0) return false

                let bitPos = 0
                let temp = byteValue
                while (temp > 1) {
                    temp = temp >> 1
                    bitPos++
                }
                return bitPos >= rangeStart && bitPos <= rangeEnd
            })
        }
    }

    return tags
})

// Analytics
const {
    statusDistribution,
    ttagsUsage,
    dtagsUsage,
    rtagsUsage,
    fetchAnalytics,
    loading: analyticsLoading
} = useSysregAnalytics('images')

const topTtags = computed(() => ttagsUsage.value.slice(0, 10))
const topDtags = computed(() => dtagsUsage.value.slice(0, 10))

// Batch operations
const {
    progress: batchProgress,
    isRunning: batchRunning,
    progressPercent,
    batchUpdateStatus,
    batchAddTags,
    batchRemoveTags,
    batchToggleConfigBit,
    resetProgress
} = useSysregBatchOperations()

const batchEntity = ref('images')
const batchIds = ref('')
const batchOperation = ref('status')
const batchStatusValue = ref('')
const batchTtagsValues = ref<string[]>([])
const batchDtagsValues = ref<string[]>([])
const batchConfigBit = ref('0')
const batchResult = ref<any>(null)

// Lifecycle
onMounted(async () => {
    await fetchOptions()
    await fetchAnalytics()
})

// Methods
function getLabel(tag: any): string {
    const locale = 'en' // TODO: Get from i18n
    if (tag.name_i18n && tag.name_i18n[locale]) {
        return tag.name_i18n[locale]
    }
    return tag.name
}

function getTagLabel(tag: any): string {
    const locale = viewerLanguage.value
    if (tag.name_i18n && tag.name_i18n[locale]) {
        return tag.name_i18n[locale]
    }
    if (tag.label) {
        return tag.label
    }
    return tag.name
}

function onFamilyChange() {
    // Reset filters when family changes
    filterLogic.value = ''
    filterBitGroup.value = ''
}

function editTag(tag: any) {
    editingTag.value = tag
    tagForm.value = {
        tagfamily: tag.tagfamily,
        value: tag.value,
        name: tag.name,
        taglogic: tag.taglogic,
        label_en: tag.name_i18n?.en || '',
        label_de: tag.name_i18n?.de || '',
        label_cz: tag.name_i18n?.cz || '',
        description: tag.desc_i18n?.en || tag.desc_i18n?.de || tag.description || '',
        is_default: tag.is_default || false
    }
}

function closeDialog() {
    showCreateDialog.value = false
    editingTag.value = null
    tagForm.value = {
        tagfamily: 'status',
        value: '',
        name: '',
        taglogic: 'category',
        label_en: '',
        label_de: '',
        label_cz: '',
        description: '',
        is_default: false
    }
}

async function saveTag() {
    try {
        const payload = {
            tagfamily: tagForm.value.tagfamily,
            value: tagForm.value.value,
            name: tagForm.value.name,
            taglogic: tagForm.value.taglogic,
            is_default: tagForm.value.is_default,
            name_i18n: {
                en: tagForm.value.label_en || tagForm.value.name,
                de: tagForm.value.label_de || tagForm.value.name,
                cz: tagForm.value.label_cz || tagForm.value.name
            },
            desc_i18n: {
                en: tagForm.value.description || '',
                de: tagForm.value.description || '',
                cz: tagForm.value.description || ''
            }
        }

        const endpoint = editingTag.value
            ? `/api/sysreg/${editingTag.value.id}`
            : '/api/sysreg'

        const method = editingTag.value ? 'PUT' : 'POST'

        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error('Failed to save tag')
        }

        await fetchOptions(true) // Force refresh
        closeDialog()
    } catch (error) {
        console.error('Error saving tag:', error)
        alert('Error saving tag: ' + error)
    }
}

async function deleteTag(tag: any) {
    if (tag.is_default) {
        alert('Cannot delete default tags')
        return
    }

    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) {
        return
    }

    try {
        const response = await fetch(`/api/sysreg/${tag.id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error('Failed to delete tag')
        }

        await fetchOptions(true)
        alert('Tag deleted successfully')
    } catch (error) {
        console.error('Error deleting tag:', error)
        alert('Error deleting tag: ' + error)
    }
}

async function refreshAnalytics() {
    await fetchAnalytics(true)
}

async function executeBatch() {
    const ids = batchIds.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (ids.length === 0) {
        alert('Please enter valid entity IDs')
        return
    }

    batchResult.value = null
    resetProgress()

    try {
        let result: any

        switch (batchOperation.value) {
            case 'status':
                if (!batchStatusValue.value) {
                    alert('Please select a status')
                    return
                }
                result = await batchUpdateStatus(batchEntity.value, ids, batchStatusValue.value)
                break

            case 'ttags-add':
                result = await batchAddTags(batchEntity.value, ids, 'ttags', batchTtagsValues.value)
                break

            case 'ttags-remove':
                result = await batchRemoveTags(batchEntity.value, ids, 'ttags', batchTtagsValues.value)
                break

            case 'dtags-add':
                result = await batchAddTags(batchEntity.value, ids, 'dtags', batchDtagsValues.value)
                break

            case 'dtags-remove':
                result = await batchRemoveTags(batchEntity.value, ids, 'dtags', batchDtagsValues.value)
                break

            case 'config-toggle':
                result = await batchToggleConfigBit(batchEntity.value, ids, parseInt(batchConfigBit.value))
                break

            default:
                alert('Unknown operation')
                return
        }

        batchResult.value = result
    } catch (error) {
        console.error('Batch operation error:', error)
        batchResult.value = {
            success: false,
            total: ids.length,
            succeeded: 0,
            failed: ids.length,
            errors: [{ id: 0, error: String(error) }]
        }
    }
}
</script>

<style scoped>
.sysreg-admin {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.admin-header {
    margin-bottom: 2rem;
}

.admin-header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #666;
    font-size: 1.1rem;
}

.tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 2rem;
}

.tab {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
}

.tab:hover {
    background: #f5f5f5;
}

.tab.active {
    border-bottom-color: #2196F3;
    color: #2196F3;
    font-weight: 600;
}

.panel {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 2rem;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.panel-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.family-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.family-selector label {
    font-weight: 600;
}

/* Viewer Tab */
.viewer-topbar {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 6px;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.filter-group label {
    font-weight: 600;
    font-size: 0.9rem;
}

.language-switcher-group {
    flex: 0 0 auto;
}

.language-switcher-inline {
    display: flex;
    gap: 0.25rem;
}

.lang-btn {
    padding: 0.5rem 0.75rem;
    border: 2px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    font-size: 1.25rem;
    transition: all 0.2s;
}

.lang-btn:hover {
    border-color: #2196F3;
}

.lang-btn.active {
    border-color: #2196F3;
    background: #e3f2fd;
}

.tag-table-container {
    overflow-x: auto;
}

.tag-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.tag-table thead {
    background: #f5f5f5;
    border-bottom: 2px solid #e0e0e0;
}

.tag-table th {
    text-align: left;
    padding: 1rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: #333;
}

.tag-table td {
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.tag-table tbody tr {
    transition: background 0.2s;
}

.clickable-row {
    cursor: pointer;
}

.clickable-row:hover {
    background: #f9f9f9;
}

.tag-value-code {
    font-family: monospace;
    background: #333;
    color: #0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
}

.logic-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
}

.text-muted {
    color: #999;
}

.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #666;
}

.empty-state p {
    margin: 0;
    font-size: 1.1rem;
}

.tag-list {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.family-selector label {
    font-weight: 600;
}

.tag-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tag-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fafafa;
}

.tag-info {
    flex: 1;
}

.tag-header {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.5rem;
}

.tag-value {
    font-family: monospace;
    background: #333;
    color: #0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
}

.tag-name {
    font-weight: 600;
    color: #333;
}

.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge-default {
    background: #FFC107;
    color: #333;
}

.tag-details {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.tag-label {
    color: #2196F3;
    font-weight: 500;
}

.tag-logic {
    color: #666;
    font-size: 0.9rem;
}

.tag-description {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
}

.tag-actions {
    display: flex;
    gap: 0.5rem;
}

/* Analytics */
.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.analytics-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    background: #fafafa;
}

.analytics-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.distribution-chart,
.tag-usage-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.chart-bar {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.bar-label {
    font-weight: 500;
    font-size: 0.9rem;
}

.bar-container {
    position: relative;
    height: 30px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.bar-fill {
    position: absolute;
    height: 100%;
    background: linear-gradient(90deg, #2196F3, #21CBF3);
    transition: width 0.3s;
}

.bar-value {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
}

.usage-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.usage-label {
    flex: 1;
    font-weight: 500;
}

.usage-count {
    color: #666;
    font-size: 0.9rem;
}

.usage-bar {
    width: 100px;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.usage-fill {
    height: 100%;
    background: #4CAF50;
}

/* Batch Operations */
.batch-form {
    max-width: 800px;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.required {
    color: #f44336;
}

.form-select,
.form-input,
.form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: #2196F3;
}

.tag-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
}

.checkbox-label input {
    width: auto;
}

.batch-progress {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
}

.progress-bar {
    height: 20px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    transition: width 0.3s;
}

.progress-text {
    font-size: 0.9rem;
    color: #666;
}

.text-error {
    color: #f44336;
    font-weight: 600;
}

.batch-result {
    margin-top: 1.5rem;
}

.result-box {
    padding: 1.5rem;
    border-radius: 4px;
    border: 2px solid;
}

.result-box.success {
    background: #E8F5E9;
    border-color: #4CAF50;
}

.result-box.error {
    background: #FFEBEE;
    border-color: #f44336;
}

.result-box h4 {
    margin-top: 0;
}

.errors {
    margin-top: 1rem;
}

.errors ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-dialog {
    background: white;
    border-radius: 8px;
    max-width: 900px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
    margin: 0;
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
}

.modal-body {
    padding: 1.5rem;
}

.modal-body-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.modal-column-left,
.modal-column-right {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1.5rem;
    border-top: 1px solid #e0e0e0;
}

/* Buttons */
.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: #2196F3;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #1976D2;
}

.btn-secondary {
    background: #757575;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #616161;
}

.btn-danger {
    background: #f44336;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #d32f2f;
}

.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}

.btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}
</style>
