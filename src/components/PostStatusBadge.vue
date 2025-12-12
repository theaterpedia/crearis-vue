<template>
    <VDropdown v-model:shown="isOpen" :auto-hide="true" theme="status-editor" placement="bottom-start" :distance="4">
        <!-- Trigger: Status Badge -->
        <button type="button" class="post-status-trigger"
            :class="[`status-${currentStatusColor}`, { 'is-open': isOpen }]" :disabled="!canEdit"
            @click="isOpen = !isOpen">
            <span class="status-icon">{{ currentStatusIcon }}</span>
            <span class="status-label">{{ currentStatusLabel }}</span>
            <ChevronDown v-if="canEdit" :size="14" class="chevron" />
        </button>

        <!-- Popper: Status Editor -->
        <template #popper>
            <StatusEditor :post="post" :project="project" :membership="membership" @status-changed="handleStatusChanged"
                @scope-changed="handleScopeChanged" @trash="handleTrash" @restore="handleRestore"
                @error="handleError" />
        </template>
    </VDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dropdown as VDropdown } from 'floating-vue'
import { ChevronDown } from 'lucide-vue-next'
import StatusEditor from './StatusEditor.vue'
import { usePostStatusV2 as usePostStatus } from '@/composables/usePostStatusV2'
import type { PostData, ProjectData, MembershipData } from '@/composables/usePostStatusV2'

// ============================================================
// PROPS & EMITS
// ============================================================

const props = defineProps<{
    post: PostData
    project: ProjectData
    membership?: MembershipData | null
}>()

const emit = defineEmits<{
    'status-changed': [newStatus: number]
    'scope-changed': [newStatus: number]
    'trash': []
    'restore': []
    'error': [error: string]
}>()

// ============================================================
// STATE
// ============================================================

const isOpen = ref(false)

// ============================================================
// COMPOSABLES
// ============================================================

const postRef = computed(() => props.post)
const projectRef = computed(() => props.project)
const membershipRef = computed(() => props.membership ?? null)

const {
    currentStatusLabel,
    currentStatusColor,
    currentStatusIcon,
    permissions
} = usePostStatus(postRef, projectRef, membershipRef)

const canEdit = computed(() => permissions.canEdit.value)

// ============================================================
// HANDLERS
// ============================================================

function handleStatusChanged(newStatus: number) {
    // Update props.post.status directly for immediate UI feedback
    // (Parent will also update, but this ensures badge shows new status immediately)
    ; (props.post as any).status = newStatus
    isOpen.value = false
    emit('status-changed', newStatus)
}

function handleScopeChanged(newStatus: number) {
    // Update props.post.status directly for immediate UI feedback
    ; (props.post as any).status = newStatus
    // Keep modal open for scope toggles
    emit('scope-changed', newStatus)
}

function handleTrash() {
    isOpen.value = false
    emit('trash')
}

function handleRestore() {
    isOpen.value = false
    emit('restore')
}

function handleError(error: string) {
    emit('error', error)
}
</script>

<style scoped>
/* ===== POST STATUS BADGE WITH EDITOR ===== */
/* Follows Opus-CSS-Conventions.md */

.post-status-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: var(--transition);
}

.post-status-trigger:not(:disabled):hover {
    filter: brightness(0.95);
}

.post-status-trigger.is-open {
    border-color: currentColor;
}

.post-status-trigger:disabled {
    cursor: default;
    opacity: 0.8;
}

.post-status-trigger:disabled .chevron {
    display: none;
}

.status-icon {
    font-size: 0.875rem;
}

.status-label {
    line-height: 1.2;
}

.chevron {
    margin-left: 0.125rem;
    transition: transform 0.2s ease;
}

.is-open .chevron {
    transform: rotate(180deg);
}

/* --- Status Color Variants --- */

.status-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.status-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.status-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.status-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.status-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

.status-accent {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.status-dimmed {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    opacity: 0.7;
}
</style>

<style>
/* --- Floating Vue Theme (global) --- */
.v-popper--theme-status-editor .v-popper__inner {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 0;
    min-width: 18rem;
    max-width: 24rem;
}

.v-popper--theme-status-editor .v-popper__arrow-container {
    display: none;
}
</style>
