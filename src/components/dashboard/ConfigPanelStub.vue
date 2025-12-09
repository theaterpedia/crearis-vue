<template>
    <div class="config-panel-stub">
        <!-- Entity Status Section -->
        <div class="config-section">
            <h4 class="section-title">📊 Status & Visibility</h4>
            <div class="config-content">
                <div class="status-display">
                    <span class="status-label">Current Status:</span>
                    <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
                </div>
                <p class="config-hint">Status changes available via workflow actions</p>
            </div>
        </div>

        <!-- Workflow Actions Section -->
        <div class="config-section">
            <h4 class="section-title">🔄 Workflow Actions</h4>
            <div class="config-content">
                <!-- Request Review (for owners/creators) -->
                <div v-if="canRequestReview" class="action-card">
                    <div class="action-header">
                        <span class="action-icon">📤</span>
                        <span class="action-title">Request Admin Review</span>
                    </div>
                    <p class="action-description">Submit this {{ entityTypeLabel }} for admin approval</p>
                    <button class="action-btn primary" @click="requestReview">
                        Request Review
                    </button>
                </div>

                <!-- Pending Review (stub) -->
                <div v-else-if="isPendingReview" class="action-card pending">
                    <div class="action-header">
                        <span class="action-icon">⏳</span>
                        <span class="action-title">Pending Review</span>
                    </div>
                    <p class="action-description">Waiting for admin approval</p>
                </div>

                <!-- Approved Actions (stub) -->
                <div v-else class="action-card">
                    <div class="action-header">
                        <span class="action-icon">✅</span>
                        <span class="action-title">Published</span>
                    </div>
                    <p class="action-description">This {{ entityTypeLabel }} is live</p>
                </div>
            </div>
        </div>

        <!-- Post-its / Comments Section -->
        <div class="config-section">
            <h4 class="section-title">💬 Team Discussion</h4>
            <div class="config-content">
                <div class="postits-preview">
                    <div v-if="alpha" class="stub-comments">
                        <div class="comment-item">
                            <span class="comment-avatar">👤</span>
                            <div class="comment-content">
                                <span class="comment-author">Admin</span>
                                <p class="comment-text">Please review the header image before publishing.</p>
                            </div>
                        </div>
                        <div class="comment-item">
                            <span class="comment-avatar">👤</span>
                            <div class="comment-content">
                                <span class="comment-author">Owner</span>
                                <p class="comment-text">Updated! Ready for review.</p>
                            </div>
                        </div>
                    </div>
                    <button class="postits-open-btn" @click="openPostItsDialog">
                        💬 Open Discussion ({{ commentCount }} comments)
                    </button>
                </div>
            </div>
        </div>

        <!-- Future Features Stub (v0.6-v0.8) -->
        <div v-if="alpha" class="config-section stub-section">
            <h4 class="section-title">🚧 Coming Soon</h4>
            <div class="config-content">
                <div class="future-features">
                    <div class="feature-item">
                        <span class="feature-icon">📅</span>
                        <div class="feature-content">
                            <span class="feature-title">Scheduled Publishing</span>
                            <span class="feature-version">v0.6</span>
                        </div>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔔</span>
                        <div class="feature-content">
                            <span class="feature-title">Email Notifications</span>
                            <span class="feature-version">v0.7</span>
                        </div>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <div class="feature-content">
                            <span class="feature-title">Version History</span>
                            <span class="feature-version">v0.8</span>
                        </div>
                    </div>
                    <div v-if="entityType === 'events'" class="feature-item">
                        <span class="feature-icon">🎟️</span>
                        <div class="feature-content">
                            <span class="feature-title">Ticket Management</span>
                            <span class="feature-version">v0.8</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Entity-Specific Config (slot for extensibility) -->
        <slot name="entity-config"></slot>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
    'request-review': []
    'open-postits': []
}>()

// ============================================================
// COMPUTED
// ============================================================

const entityTypeLabel = computed(() => {
    const labels: Record<string, string> = {
        posts: 'post',
        events: 'event',
        pages: 'page',
        images: 'image'
    }
    return labels[props.entityType] || 'item'
})

const status = computed(() => props.entity?.status || 0)

const statusLabel = computed(() => {
    const s = status.value
    if (s === 1) return 'New'
    if (s === 8) return 'Demo'
    if (s === 64) return 'Draft'
    if (s === 256) return 'In Review'
    if (s === 512) return 'Confirmed'
    if (s === 4096) return 'Released'
    if (s >= 65536) return 'Archived'
    return 'Unknown'
})

const statusClass = computed(() => {
    const s = status.value
    if (s === 64) return 'status-draft'
    if (s === 256) return 'status-review'
    if (s === 512 || s === 4096) return 'status-published'
    if (s >= 65536) return 'status-archived'
    return 'status-new'
})

const canRequestReview = computed(() => {
    // Can request review when in draft status (64)
    return status.value === 64
})

const isPendingReview = computed(() => {
    return status.value === 256
})

// Stub data for comments
const commentCount = computed(() => props.alpha ? 2 : 0)

// ============================================================
// METHODS
// ============================================================

function requestReview() {
    emit('request-review')
    console.log('[ConfigPanelStub] Request review - stub')
    alert('Review request sent! (stub)')
}

function openPostItsDialog() {
    emit('open-postits')
    console.log('[ConfigPanelStub] Open post-its dialog - stub')
    alert('Post-its dialog coming soon!')
}
</script>

<style scoped>
.config-panel-stub {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Section */
.config-section {
    background: var(--color-card-bg);
    border: var(--border-small) solid var(--color-border);
    border-radius: var(--radius-medium);
    overflow: hidden;
}

.section-title {
    margin: 0;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
    background: var(--color-muted-bg);
    border-bottom: var(--border-small) solid var(--color-border);
}

.config-content {
    padding: 1rem;
}

.config-hint {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-dimmed);
    font-style: italic;
}

/* Status Display */
.status-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-label {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.status-badge {
    display: inline-flex;
    padding: 0.25rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: 9999px;
}

.status-badge.status-new {
    background: oklch(90% 0.08 250);
    color: oklch(40% 0.12 250);
}

.status-badge.status-draft {
    background: oklch(92% 0.06 60);
    color: oklch(40% 0.10 60);
}

.status-badge.status-review {
    background: oklch(90% 0.10 280);
    color: oklch(35% 0.15 280);
}

.status-badge.status-published {
    background: oklch(88% 0.12 145);
    color: oklch(30% 0.12 145);
}

.status-badge.status-archived {
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
}

/* Action Card */
.action-card {
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
}

.action-card.pending {
    background: oklch(95% 0.04 280);
    border: var(--border-small) dashed oklch(75% 0.08 280);
}

.action-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.action-icon {
    font-size: 1.25rem;
}

.action-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.action-description {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-dimmed);
}

.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
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

/* Post-its Preview */
.postits-preview {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.stub-comments {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.comment-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
}

.comment-avatar {
    font-size: 1.5rem;
}

.comment-content {
    flex: 1;
}

.comment-author {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-contrast);
}

.comment-text {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-dimmed);
}

.postits-open-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: oklch(92% 0.04 280);
    color: oklch(35% 0.10 280);
    border: var(--border-small) solid oklch(85% 0.06 280);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.postits-open-btn:hover {
    background: oklch(88% 0.06 280);
}

/* Future Features Stub */
.stub-section {
    background: oklch(97% 0.01 280);
    border-style: dashed;
}

.future-features {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
}

.feature-icon {
    font-size: 1.25rem;
}

.feature-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.feature-title {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.feature-version {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    background: oklch(90% 0.04 280);
    color: oklch(40% 0.10 280);
    border-radius: 9999px;
}
</style>
