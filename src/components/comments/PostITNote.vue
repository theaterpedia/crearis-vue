<template>
    <div class="postit-note" :class="[color, { pinned: isPinned, compact, editing: isEditing }]">
        <!-- Tape effect -->
        <div class="tape" :class="tapePosition" />

        <!-- Pin indicator -->
        <div v-if="isPinned" class="pin-indicator" title="Angepinnt">📌</div>

        <!-- Header -->
        <div class="note-header">
            <div class="author-info">
                <RoleBadge :relation="authorRelation" variant="compact" :show-label="false" />
                <span class="author-name">{{ authorName }}</span>
            </div>
            <span class="timestamp" :title="fullTimestamp">{{ relativeTime }}</span>
        </div>

        <!-- Content -->
        <div v-if="!isEditing" class="note-content" v-html="renderedContent" />

        <!-- Edit mode -->
        <div v-else class="note-edit">
            <textarea ref="editTextareaRef" v-model="editContent" class="edit-textarea"
                placeholder="Kommentar bearbeiten..." @keydown.ctrl.enter="saveEdit" @keydown.escape="cancelEdit" />
            <div class="edit-actions">
                <button class="btn-cancel" @click="cancelEdit">Abbrechen</button>
                <button class="btn-save" @click="saveEdit">Speichern</button>
            </div>
        </div>

        <!-- Footer -->
        <div class="note-footer">
            <!-- Reactions -->
            <div class="reactions">
                <button v-for="reaction in reactions" :key="reaction.emoji" class="reaction-btn"
                    :class="{ reacted: reaction.hasReacted }" @click="$emit('react', reaction.emoji)">
                    <span class="reaction-emoji">{{ reaction.emoji }}</span>
                    <span class="reaction-count">{{ reaction.count }}</span>
                </button>

                <!-- Add reaction -->
                <button class="add-reaction-btn" @click="showReactionPicker = !showReactionPicker">
                    ➕
                </button>

                <!-- Reaction picker -->
                <Transition name="fade">
                    <div v-if="showReactionPicker" class="reaction-picker">
                        <button v-for="emoji in availableEmojis" :key="emoji" class="picker-emoji"
                            @click="addReaction(emoji)">
                            {{ emoji }}
                        </button>
                    </div>
                </Transition>
            </div>

            <!-- Reply count -->
            <button v-if="replyCount > 0" class="reply-indicator" @click="$emit('showReplies')">
                💬 {{ replyCount }} {{ replyCount === 1 ? 'Antwort' : 'Antworten' }}
            </button>
        </div>

        <!-- Actions (on hover/focus) -->
        <div class="note-actions">
            <button class="action-btn" title="Antworten" @click="$emit('reply')">
                💬
            </button>
            <button v-if="canEdit" class="action-btn" title="Bearbeiten" @click="startEdit">
                ✏️
            </button>
            <button v-if="canPin" class="action-btn" :title="isPinned ? 'Loslösen' : 'Anpinnen'" @click="$emit('pin')">
                📌
            </button>
            <button v-if="canDelete" class="action-btn danger" title="Löschen" @click="$emit('delete')">
                🗑️
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import RoleBadge from '@/components/badges/RoleBadge.vue'
import type { ProjectRelation } from '@/composables/useProjectActivation'
import type { PostITColor, CommentReaction } from '@/composables/usePostITComments'

const props = withDefaults(defineProps<{
    id: string
    content: string
    authorName: string
    authorRelation: ProjectRelation
    createdAt: string
    color?: PostITColor
    isPinned?: boolean
    reactions?: CommentReaction[]
    replyCount?: number
    compact?: boolean
    canEdit?: boolean
    canPin?: boolean
    canDelete?: boolean
}>(), {
    color: 'yellow',
    isPinned: false,
    reactions: () => [],
    replyCount: 0,
    compact: false,
    canEdit: false,
    canPin: false,
    canDelete: false,
})

const emit = defineEmits<{
    reply: []
    react: [emoji: string]
    pin: []
    edit: [content: string]
    delete: []
    showReplies: []
}>()

// Edit state
const isEditing = ref(false)
const editContent = ref('')
const editTextareaRef = ref<HTMLTextAreaElement | null>(null)

// Reaction picker
const showReactionPicker = ref(false)
const availableEmojis = ['👍', '❤️', '😊', '🎉', '🤔', '👀']

// Random tape position for visual variety
const tapePositions = ['left', 'center', 'right'] as const
const tapePosition = computed(() => {
    // Use id hash for consistent position
    const hash = props.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return tapePositions[hash % 3]
})

// Render markdown content (simplified - in production use marked.js)
const renderedContent = computed(() => {
    let html = props.content
    // Basic markdown: **bold**, *italic*, `code`
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/`(.+?)`/g, '<code>$1</code>')
    // Line breaks
    html = html.replace(/\n/g, '<br>')
    return html
})

// Relative time
const relativeTime = computed(() => {
    const date = new Date(props.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min.`
    if (diffHours < 24) return `vor ${diffHours} Std.`
    if (diffDays < 7) return `vor ${diffDays} Tagen`
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
})

const fullTimestamp = computed(() => {
    const date = new Date(props.createdAt)
    return date.toLocaleString('de-DE')
})

// Edit functions
function startEdit() {
    editContent.value = props.content
    isEditing.value = true
    nextTick(() => {
        editTextareaRef.value?.focus()
    })
}

function saveEdit() {
    if (editContent.value.trim()) {
        emit('edit', editContent.value.trim())
        isEditing.value = false
    }
}

function cancelEdit() {
    isEditing.value = false
    editContent.value = ''
}

// Reaction functions
function addReaction(emoji: string) {
    emit('react', emoji)
    showReactionPicker.value = false
}
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, theme vars, Post-IT style */

.postit-note {
    --note-bg: var(--postit-yellow, oklch(92% 0.12 95));
    --note-text: oklch(30% 0.05 95);
    --tape-color: oklch(90% 0.03 95 / 0.7);

    position: relative;
    background: var(--note-bg);
    color: var(--note-text);
    padding: 1.5rem 1rem 1rem;
    min-width: 200px;
    max-width: 300px;
    font-family: var(--font);
    font-size: 0.875rem;
    box-shadow: var(--postit-shadow, 2px 3px 8px oklch(0% 0 0 / 0.15));
    transition: var(--transition, all 150ms ease);

    /* Slight rotation for handwritten feel */
    transform: rotate(-1deg);
}

.postit-note:hover {
    transform: rotate(0deg) translateY(-2px);
    box-shadow: var(--postit-hover-shadow, 4px 6px 12px oklch(0% 0 0 / 0.2));
}

.postit-note.compact {
    min-width: 150px;
    max-width: 200px;
    padding: 1rem 0.75rem 0.75rem;
    font-size: 0.75rem;
}

/* Color variants (oklch) */
.postit-note.yellow {
    --note-bg: var(--postit-yellow, oklch(92% 0.12 95));
    --note-text: oklch(30% 0.05 95);
}

.postit-note.orange {
    --note-bg: var(--postit-orange, oklch(85% 0.14 65));
    --note-text: oklch(28% 0.08 65);
}

.postit-note.purple {
    --note-bg: var(--postit-purple, oklch(82% 0.12 300));
    --note-text: oklch(28% 0.08 300);
}

.postit-note.blue {
    --note-bg: var(--postit-blue, oklch(85% 0.10 230));
    --note-text: oklch(28% 0.06 230);
}

.postit-note.green {
    --note-bg: var(--postit-green, oklch(82% 0.12 145));
    --note-text: oklch(25% 0.08 145);
}

.postit-note.pink {
    --note-bg: var(--postit-pink, oklch(82% 0.14 350));
    --note-text: oklch(28% 0.10 350);
}

/* Pinned state */
.postit-note.pinned {
    border: 2px solid oklch(60% 0.15 45);
}

/* Tape effect */
.tape {
    position: absolute;
    top: -0.5rem;
    width: 3rem;
    height: 1.25rem;
    background: var(--tape-color);
    box-shadow: var(--postit-tape-shadow, 0 1px 2px oklch(0% 0 0 / 0.1));
}

.tape.left {
    left: 0.75rem;
    transform: rotate(-8deg);
}

.tape.center {
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
}

.tape.right {
    right: 0.75rem;
    transform: rotate(5deg);
}

/* Pin indicator */
.pin-indicator {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    font-size: 0.875rem;
}

/* Header */
.note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.author-name {
    font-weight: 600;
    font-size: 0.75rem;
}

.timestamp {
    font-size: 0.625rem;
    opacity: 0.7;
}

/* Content */
.note-content {
    line-height: 1.5;
    word-break: break-word;
}

.note-content :deep(code) {
    background: oklch(0% 0 0 / 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 0.125rem;
    font-family: var(--font);
    font-size: 0.8125em;
}

/* Edit mode */
.note-edit {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.edit-textarea {
    width: 100%;
    min-height: 60px;
    padding: 0.5rem;
    border: 1px solid oklch(0% 0 0 / 0.2);
    border-radius: var(--radius-small, 0.25rem);
    background: oklch(100% 0 0 / 0.5);
    font-family: var(--font);
    font-size: 0.875rem;
    resize: vertical;
}

.edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.btn-cancel,
.btn-save {
    padding: 0.25rem 0.5rem;
    font-family: var(--font);
    font-size: 0.75rem;
    border-radius: var(--radius-small, 0.25rem);
    cursor: pointer;
    transition: var(--transition);
}

.btn-cancel {
    background: none;
    border: 1px solid currentColor;
}

.btn-save {
    background: oklch(50% 0.12 145);
    color: white;
    border: none;
}

/* Footer */
.note-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid oklch(0% 0 0 / 0.1);
}

/* Reactions */
.reactions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    position: relative;
}

.reaction-btn {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.125rem 0.375rem;
    background: oklch(100% 0 0 / 0.4);
    border: none;
    border-radius: 9999px;
    font-size: 0.6875rem;
    cursor: pointer;
    transition: var(--transition);
}

.reaction-btn.reacted {
    background: oklch(100% 0 0 / 0.7);
}

.reaction-btn:hover {
    background: oklch(100% 0 0 / 0.8);
}

.add-reaction-btn {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 0.75rem;
    cursor: pointer;
    opacity: 0.6;
    transition: var(--transition);
}

.add-reaction-btn:hover {
    opacity: 1;
}

/* Reaction picker */
.reaction-picker {
    position: absolute;
    bottom: 100%;
    left: 0;
    display: flex;
    gap: 0.25rem;
    padding: 0.375rem;
    background: var(--color-bg, oklch(100% 0 0));
    border-radius: var(--radius-small, 0.25rem);
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.2);
    z-index: 10;
}

.picker-emoji {
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    transition: var(--transition);
}

.picker-emoji:hover {
    transform: scale(1.2);
}

/* Reply indicator */
.reply-indicator {
    background: none;
    border: none;
    font-size: 0.6875rem;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    transition: var(--transition);
}

.reply-indicator:hover {
    opacity: 1;
}

/* Actions (hover) */
.note-actions {
    position: absolute;
    top: 0.5rem;
    right: -2.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    opacity: 0;
    transform: translateX(-0.5rem);
    transition: var(--transition);
}

.postit-note:hover .note-actions {
    opacity: 1;
    transform: translateX(0);
}

.action-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg, oklch(100% 0 0));
    border: 1px solid var(--color-border, oklch(85% 0 0));
    border-radius: 50%;
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--transition);
}

.action-btn:hover {
    background: var(--color-muted-bg, oklch(95% 0 0));
}

.action-btn.danger:hover {
    background: oklch(90% 0.12 25);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--duration, 150ms) var(--ease, ease);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
    .postit-note {
        min-width: 100%;
        max-width: 100%;
        transform: none;
    }

    .postit-note:hover {
        transform: none;
    }

    .note-actions {
        position: static;
        flex-direction: row;
        opacity: 1;
        transform: none;
        margin-top: 0.5rem;
    }
}
</style>
