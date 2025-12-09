<template>
    <div class="entity-content-panel">
        <!-- Dashboard Mode: Compact view with expand button -->
        <template v-if="mode === 'dashboard'">
            <!-- Basic Fields (always visible) -->
            <div class="content-section">
                <h4 class="section-title">📝 Basic Info</h4>

                <div class="field-group">
                    <label class="field-label">Heading</label>
                    <div class="field-value">{{ entity?.heading || entity?.name || '-' }}</div>
                </div>

                <div class="field-group">
                    <label class="field-label">Teaser</label>
                    <div class="field-value teaser-text">{{ entity?.teaser || '-' }}</div>
                </div>

                <div class="field-group">
                    <label class="field-label">Status</label>
                    <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
                </div>
            </div>

            <!-- Markdown Content: Only show button in dashboard mode -->
            <div class="content-section">
                <h4 class="section-title">📄 Content</h4>
                <div v-if="hasMdContent" class="md-preview">
                    <p class="preview-hint">Content available ({{ mdWordCount }} words)</p>
                    <button class="expand-content-btn" @click="openSidebarEditor">
                        <span class="btn-icon">📝</span>
                        <span>Edit Content</span>
                    </button>
                </div>
                <div v-else class="empty-content">
                    <p>No content yet</p>
                    <button class="expand-content-btn" @click="openSidebarEditor">
                        <span class="btn-icon">➕</span>
                        <span>Add Content</span>
                    </button>
                </div>
            </div>

            <!-- Post-its Dialog Placeholder -->
            <div class="content-section">
                <h4 class="section-title">💬 Team Discussion</h4>
                <button class="postits-btn" @click="openPostIts">
                    💬 Open Post-its Dialog ({{ commentCount }} comments)
                </button>
            </div>
        </template>

        <!-- Sidebar Mode: Full edit form with md-field -->
        <template v-else-if="mode === 'sidebar'">
            <form @submit.prevent="handleSave" class="content-form">
                <!-- Heading -->
                <div class="form-group">
                    <label class="form-label" for="content-heading">
                        Heading <span class="required">*</span>
                    </label>
                    <input id="content-heading" v-model="formData.heading" type="text" class="form-input"
                        placeholder="Enter heading..." :disabled="!canEditHeading" />
                </div>

                <!-- Teaser -->
                <div class="form-group">
                    <label class="form-label" for="content-teaser">Teaser</label>
                    <textarea id="content-teaser" v-model="formData.teaser" class="form-textarea" rows="3"
                        placeholder="Brief description..." :disabled="!canEditTeaser"></textarea>
                </div>

                <!-- Markdown Content (visible in sidebar mode, respects permissions) -->
                <div v-if="canViewMd" class="form-group">
                    <label class="form-label" for="content-md">
                        Content (Markdown)
                        <span class="field-hint">Supports **bold**, *italic*, and basic markdown</span>
                    </label>
                    <textarea id="content-md" v-model="formData.md" class="form-textarea form-textarea-large" rows="16"
                        placeholder="# Your content here..." :disabled="!canEditMd"></textarea>
                </div>
                <div v-else class="permission-notice">
                    <span class="notice-icon">🔒</span>
                    <span>Content editing restricted based on your role</span>
                </div>

                <!-- NOTE: html field is NEVER shown - it's auto-generated from md -->

                <!-- Action Buttons -->
                <div class="form-actions">
                    <button type="button" class="btn-secondary" @click="handleCancel">
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" :disabled="isSaving || !hasChanges">
                        <span v-if="isSaving" class="btn-spinner"></span>
                        <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
                    </button>
                </div>
            </form>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    entity: any
    entityType: 'posts' | 'events' | 'pages'
    mode: 'dashboard' | 'sidebar'
    projectId: string | number
    // Permission props (from capability system)
    canEditHeading?: boolean
    canEditTeaser?: boolean
    canViewMd?: boolean
    canEditMd?: boolean
    alpha?: boolean
}>(), {
    mode: 'dashboard',
    canEditHeading: true,
    canEditTeaser: true,
    canViewMd: true,  // Default: can view md in sidebar mode
    canEditMd: true,
    alpha: true
})

const emit = defineEmits<{
    'open-sidebar': []
    'open-postits': []
    'save': [data: any]
    'cancel': []
}>()

// ============================================================
// STATE
// ============================================================

const isSaving = ref(false)
const formData = ref({
    heading: '',
    teaser: '',
    md: ''
    // NOTE: html is NEVER in formData - it's computed server-side from md
})

// ============================================================
// COMPUTED
// ============================================================

const status = computed(() => props.entity?.status || 0)

const statusLabel = computed(() => {
    const s = status.value
    if (s === 1) return 'New'
    if (s === 8) return 'Demo'
    if (s === 64) return 'Draft'
    if (s === 256) return 'Review'
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

const hasMdContent = computed(() => {
    const md = props.entity?.md || ''
    return md.trim().length > 0
})

const mdWordCount = computed(() => {
    const md = props.entity?.md || ''
    if (!md.trim()) return 0
    return md.trim().split(/\s+/).length
})

// Stub comment count for alpha mode
const commentCount = computed(() => props.alpha ? 2 : 0)

const hasChanges = computed(() => {
    if (!props.entity) return false
    return (
        formData.value.heading !== (props.entity.heading || props.entity.name || '') ||
        formData.value.teaser !== (props.entity.teaser || '') ||
        formData.value.md !== (props.entity.md || '')
    )
})

// ============================================================
// METHODS
// ============================================================

function openSidebarEditor() {
    emit('open-sidebar')
}

function openPostIts() {
    emit('open-postits')
}

function handleCancel() {
    // Reset form to entity values
    syncFormFromEntity()
    emit('cancel')
}

async function handleSave() {
    if (!hasChanges.value) return

    isSaving.value = true
    try {
        // Emit save with form data (html is NOT included - server generates it)
        emit('save', {
            heading: formData.value.heading,
            teaser: formData.value.teaser,
            md: formData.value.md
            // NOTE: No html field - it's auto-generated from md on the server
        })
    } finally {
        isSaving.value = false
    }
}

function syncFormFromEntity() {
    if (props.entity) {
        formData.value.heading = props.entity.heading || props.entity.name || ''
        formData.value.teaser = props.entity.teaser || ''
        formData.value.md = props.entity.md || ''
    }
}

// ============================================================
// WATCHERS
// ============================================================

watch(() => props.entity, () => {
    syncFormFromEntity()
}, { immediate: true })
</script>

<style scoped>
.entity-content-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Section */
.content-section {
    background: var(--color-card-bg);
    border: var(--border-small) solid var(--color-border);
    border-radius: var(--radius-medium);
    padding: 1rem;
}

.section-title {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-contrast);
}

/* Field Groups */
.field-group {
    margin-bottom: 0.75rem;
}

.field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-dimmed);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.field-value {
    font-size: 0.9375rem;
    color: var(--color-contrast);
}

.teaser-text {
    line-height: 1.5;
    color: var(--color-dimmed);
}

/* Status Badge */
.status-badge {
    display: inline-flex;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
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

/* MD Preview */
.md-preview,
.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
    text-align: center;
}

.preview-hint {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.expand-content-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast, #fff);
    border: none;
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.expand-content-btn:hover {
    filter: brightness(0.9);
}

.btn-icon {
    font-size: 1rem;
}

/* Post-its Button */
.postits-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    width: 100%;
    justify-content: center;
    background: oklch(92% 0.04 280);
    color: oklch(35% 0.10 280);
    border: var(--border-small) solid oklch(85% 0.06 280);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.postits-btn:hover {
    background: oklch(88% 0.06 280);
}

/* Form Styles (Sidebar Mode) */
.content-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-contrast);
}

.required {
    color: oklch(60% 0.20 25);
}

.field-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-dimmed);
    margin-left: 0.5rem;
}

.form-input,
.form-textarea {
    padding: 0.625rem 0.75rem;
    background: var(--color-card-bg);
    border: var(--border-small) solid var(--color-border);
    border-radius: var(--radius-small);
    font-size: 0.9375rem;
    color: var(--color-contrast);
    transition: var(--transition);
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 2px oklch(72% 0.28 145 / 0.2);
}

.form-input:disabled,
.form-textarea:disabled {
    background: var(--color-muted-bg);
    color: var(--color-dimmed);
    cursor: not-allowed;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

.form-textarea-large {
    min-height: 300px;
}

/* Permission Notice */
.permission-notice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: oklch(95% 0.02 60);
    border: var(--border-small) solid oklch(85% 0.04 60);
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    color: oklch(40% 0.08 60);
}

.notice-icon {
    font-size: 1.25rem;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: var(--border-small) solid var(--color-border);
}

.btn-secondary,
.btn-primary {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: var(--transition);
}

.btn-secondary {
    background: var(--color-muted-bg);
    border: var(--border-small) solid var(--color-border);
    color: var(--color-contrast);
}

.btn-secondary:hover {
    background: var(--color-border);
}

.btn-primary {
    background: var(--color-primary-bg);
    border: var(--border-small) solid var(--color-primary-bg);
    color: var(--color-primary-contrast, #fff);
}

.btn-primary:hover:not(:disabled) {
    filter: brightness(0.9);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
