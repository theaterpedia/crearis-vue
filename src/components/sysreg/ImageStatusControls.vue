<template>
    <div class="image-status-controls">
        <!-- Status Display -->
        <div class="status-section">
            <div class="section-header">
                <h4>Status</h4>
                <StatusBadge :value="image?.status || null" :label="statusLabel" variant="solid" size="medium" />
            </div>

            <!-- Status Transition Buttons -->
            <div class="status-actions">
                <button v-if="canStartProcessing" @click="handleStartProcessing" class="status-btn btn-processing"
                    :disabled="disabled">
                    ▶ Start Processing
                </button>

                <button v-if="canApprove" @click="handleApprove" class="status-btn btn-approve" :disabled="disabled">
                    ✓ Approve
                </button>

                <button v-if="canPublish" @click="handlePublish" class="status-btn btn-publish" :disabled="disabled">
                    🚀 Publish
                </button>

                <button v-if="canDeprecate" @click="handleDeprecate" class="status-btn btn-deprecate"
                    :disabled="disabled">
                    ⚠ Deprecate
                </button>

                <button v-if="canArchive" @click="handleArchive" class="status-btn btn-archive" :disabled="disabled">
                    📦 Archive
                </button>

                <button v-if="canUnarchive" @click="handleUnarchive" class="status-btn btn-unarchive"
                    :disabled="disabled">
                    ↩ Unarchive
                </button>
            </div>
        </div>

        <!-- Config Flags -->
        <div class="config-section">
            <div class="section-header">
                <h4>Configuration</h4>
            </div>

            <div class="config-flags">
                <label class="flag-item">
                    <input type="checkbox" :checked="isPublic" @change="handleTogglePublic" :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">🌍</span>
                        Public
                    </span>
                </label>

                <label class="flag-item">
                    <input type="checkbox" :checked="isFeatured" @change="handleToggleFeatured" :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">⭐</span>
                        Featured
                    </span>
                </label>

                <label class="flag-item">
                    <input type="checkbox" :checked="needsReview" @change="handleToggleNeedsReview"
                        :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">👀</span>
                        Needs Review
                    </span>
                </label>

                <label class="flag-item">
                    <input type="checkbox" :checked="hasPeople" @change="handleToggleHasPeople" :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">👤</span>
                        Has People
                    </span>
                </label>

                <label class="flag-item">
                    <input type="checkbox" :checked="isAiGenerated" @change="handleToggleAiGenerated"
                        :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">🤖</span>
                        AI Generated
                    </span>
                </label>

                <label class="flag-item">
                    <input type="checkbox" :checked="hasHighRes" @change="handleToggleHighRes" :disabled="disabled" />
                    <span class="flag-label">
                        <span class="flag-icon">🎯</span>
                        High Res
                    </span>
                </label>
            </div>
        </div>

        <!-- Status Info -->
        <div class="status-info" v-if="showInfo">
            <div class="info-item">
                <span class="info-label">Current Status:</span>
                <span class="info-value">{{ statusLabel }} ({{ currentStatusHex }})</span>
            </div>
            <div class="info-item">
                <span class="info-label">Config Flags:</span>
                <span class="info-value">{{ currentConfigHex }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import StatusBadge from './StatusBadge.vue'
import { useImageStatus, type Image } from '@/composables/useImageStatus'

interface Props {
    image: Image | null
    disabled?: boolean
    showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    showInfo: false
})

const emit = defineEmits<{
    'update:image': [image: Image]
}>()

// Initialize composable
const imageRef = toRef(() => props.image)

const {
    currentStatus,
    currentConfig,
    statusLabel,
    statusColor,
    isPublic,
    isFeatured,
    needsReview,
    hasPeople,
    isAiGenerated,
    hasHighRes,
    canStartProcessing,
    canApprove,
    canPublish,
    canDeprecate,
    canArchive,
    canUnarchive,
    startProcessing,
    approveImage,
    publishImage,
    deprecateImage,
    archiveImage,
    unarchiveImage,
    togglePublic,
    toggleFeatured,
    toggleNeedsReview,
    toggleHasPeople,
    toggleAiGenerated,
    toggleHighRes
} = useImageStatus(imageRef)

// Hex display values
const currentStatusHex = computed(() => {
    if (!props.image?.status) return '\\x00'
    return props.image.status
})

const currentConfigHex = computed(() => {
    if (!props.image?.config) return '\\x00'
    return props.image.config
})

// Action handlers
async function handleStartProcessing() {
    try {
        const updated = await startProcessing()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to start processing:', error)
        alert('Failed to start processing')
    }
}

async function handleApprove() {
    try {
        const updated = await approveImage()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to approve:', error)
        alert('Failed to approve image')
    }
}

async function handlePublish() {
    try {
        const updated = await publishImage()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to publish:', error)
        alert('Failed to publish image')
    }
}

async function handleDeprecate() {
    try {
        const updated = await deprecateImage()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to deprecate:', error)
    }
}

async function handleArchive() {
    try {
        const updated = await archiveImage()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to archive:', error)
    }
}

async function handleUnarchive() {
    try {
        const updated = await unarchiveImage()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to unarchive:', error)
        alert('Failed to unarchive image')
    }
}

async function handleTogglePublic() {
    try {
        const updated = await togglePublic()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle public:', error)
    }
}

async function handleToggleFeatured() {
    try {
        const updated = await toggleFeatured()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle featured:', error)
    }
}

async function handleToggleNeedsReview() {
    try {
        const updated = await toggleNeedsReview()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle needs review:', error)
    }
}

async function handleToggleHasPeople() {
    try {
        const updated = await toggleHasPeople()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle has people:', error)
    }
}

async function handleToggleAiGenerated() {
    try {
        const updated = await toggleAiGenerated()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle AI generated:', error)
    }
}

async function handleToggleHighRes() {
    try {
        const updated = await toggleHighRes()
        if (updated) {
            emit('update:image', updated)
        }
    } catch (error) {
        console.error('Failed to toggle high res:', error)
    }
}
</script>

<style scoped>
.image-status-controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 8px;
}

.status-section,
.config-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.status-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.status-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-processing {
    background: #dbeafe;
    color: #1e40af;
    border-color: #93c5fd;
}

.btn-processing:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
}

.btn-approve {
    background: #d1fae5;
    color: #065f46;
    border-color: #6ee7b7;
}

.btn-approve:hover:not(:disabled) {
    background: #10b981;
    color: white;
}

.btn-publish {
    background: #d1fae5;
    color: #047857;
    border-color: #34d399;
}

.btn-publish:hover:not(:disabled) {
    background: #059669;
    color: white;
}

.btn-deprecate {
    background: #fed7aa;
    color: #9a3412;
    border-color: #fdba74;
}

.btn-deprecate:hover:not(:disabled) {
    background: #ea580c;
    color: white;
}

.btn-archive {
    background: #fecaca;
    color: #991b1b;
    border-color: #fca5a5;
}

.btn-archive:hover:not(:disabled) {
    background: #dc2626;
    color: white;
}

.btn-unarchive {
    background: #e0e7ff;
    color: #3730a3;
    border-color: #c7d2fe;
}

.btn-unarchive:hover:not(:disabled) {
    background: #6366f1;
    color: white;
}

.config-flags {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
}

.flag-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.flag-item:hover {
    background: var(--color-background);
}

.flag-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.flag-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text);
}

.flag-icon {
    font-size: 1rem;
}

.status-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: monospace;
}

.info-item {
    display: flex;
    gap: 0.5rem;
}

.info-label {
    font-weight: 600;
    color: var(--color-text-secondary);
}

.info-value {
    color: var(--color-text);
}
</style>
