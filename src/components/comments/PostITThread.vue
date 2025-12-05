<template>
    <div class="postit-thread" :class="{ expanded: isExpanded }">
        <!-- Root comment -->
        <PostITNote v-bind="rootComment" :can-edit="canEdit(rootComment)" :can-delete="canDelete(rootComment)"
            :can-pin="canPin" class="root-note" @edit="handleEdit" @delete="handleDelete" @pin="handlePin"
            @reply="handleReply" />

        <!-- Reply indicator / expander -->
        <button v-if="hasReplies" class="thread-toggle" :class="{ expanded: isExpanded }" @click="toggleExpanded">
            <span class="toggle-icon">{{ isExpanded ? '−' : '+' }}</span>
            <span class="reply-count">
                {{ replyCount }} {{ replyCount === 1 ? 'Antwort' : 'Antworten' }}
            </span>
            <span v-if="!isExpanded" class="preview-avatars">
                <span v-for="author in previewAuthors" :key="author.id" class="preview-avatar"
                    :style="{ background: getRoleColor(author.role) }" :title="author.name">
                    {{ author.initials }}
                </span>
            </span>
        </button>

        <!-- Replies (collapsible) -->
        <Transition name="replies">
            <div v-if="isExpanded && hasReplies" class="replies-container">
                <div class="thread-line" />

                <div class="replies-list">
                    <PostITNote v-for="reply in replies" :key="reply.id" v-bind="reply" :can-edit="canEdit(reply)"
                        :can-delete="canDelete(reply)" :can-pin="false" class="reply-note" @edit="handleEdit"
                        @delete="handleDelete" @reply="handleReply" />
                </div>
            </div>
        </Transition>

        <!-- Reply composer (inline) -->
        <Transition name="composer">
            <div v-if="showReplyComposer" class="reply-composer-wrapper">
                <PostITComposer :author-name="currentUser?.display_name ?? 'Du'" :author-role="currentUserRole"
                    placeholder="Antwort schreiben..." @submit="submitReply" @cancel="cancelReply" />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PostITNote from './PostITNote.vue'
import PostITComposer from './PostITComposer.vue'
import type { PostITComment } from '@/composables/usePostITComments'
import { ROLE_COLORS } from '@/composables/usePostITComments'

const props = withDefaults(defineProps<{
    rootComment: PostITComment
    replies: PostITComment[]
    currentUserId?: string
    currentUserRole?: string
    canPin?: boolean
    defaultExpanded?: boolean
}>(), {
    replies: () => [],
    canPin: false,
    defaultExpanded: false,
})

const emit = defineEmits<{
    edit: [comment: PostITComment]
    delete: [commentId: string]
    pin: [commentId: string]
    reply: [parentId: string, content: string]
}>()

// Current user info (would come from auth store in real app)
const currentUser = computed(() => ({
    id: props.currentUserId,
    display_name: 'Du',
}))

const currentUserRole = computed(() => props.currentUserRole ?? 'participant')

// Expansion state
const isExpanded = ref(props.defaultExpanded)
const showReplyComposer = ref(false)

const hasReplies = computed(() => props.replies.length > 0)
const replyCount = computed(() => props.replies.length)

// Preview avatars for collapsed state (show first 3)
const previewAuthors = computed(() => {
    const seen = new Set<string>()
    const authors: Array<{ id: string; name: string; initials: string; role: string }> = []

    for (const reply of props.replies) {
        if (!seen.has(reply.author.id) && authors.length < 3) {
            seen.add(reply.author.id)
            const names = reply.author.name.split(' ')
            authors.push({
                id: reply.author.id,
                name: reply.author.name,
                initials: names.length > 1
                    ? `${names[0][0]}${names[names.length - 1][0]}`
                    : names[0].substring(0, 2),
                role: reply.author.role ?? 'participant',
            })
        }
    }

    return authors
})

// Toggle expansion
function toggleExpanded() {
    isExpanded.value = !isExpanded.value
}

// Permission checks
function canEdit(comment: PostITComment): boolean {
    return comment.author.id === props.currentUserId
}

function canDelete(comment: PostITComment): boolean {
    return comment.author.id === props.currentUserId
}

// Role color helper
function getRoleColor(role?: string): string {
    return ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.participant
}

// Event handlers
function handleEdit(comment: PostITComment) {
    emit('edit', comment)
}

function handleDelete(commentId: string) {
    emit('delete', commentId)
}

function handlePin(commentId: string) {
    emit('pin', commentId)
}

function handleReply(_parentId?: string) {
    showReplyComposer.value = true
    // Expand to show where reply will appear
    if (hasReplies.value) {
        isExpanded.value = true
    }
}

function submitReply(content: string) {
    emit('reply', props.rootComment.id, content)
    showReplyComposer.value = false
}

function cancelReply() {
    showReplyComposer.value = false
}
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, semantic vars */

.postit-thread {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Root note styling */
.root-note {
    position: relative;
    z-index: 1;
}

/* Thread toggle button */
.thread-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-left: 1rem;
    background: none;
    border: none;
    font-size: 0.75rem;
    color: var(--color-muted-contrast, oklch(50% 0 0));
    cursor: pointer;
    transition: var(--transition, all 150ms ease);
}

.thread-toggle:hover {
    color: var(--color-contrast, oklch(20% 0 0));
}

.toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: var(--color-muted-bg, oklch(95% 0 0));
    border-radius: 50%;
    font-weight: 600;
    transition: var(--transition);
}

.thread-toggle:hover .toggle-icon {
    background: var(--color-highlight, oklch(92% 0.12 95));
}

.thread-toggle.expanded .toggle-icon {
    background: var(--color-accent, oklch(55% 0.15 260));
    color: white;
}

.reply-count {
    font-weight: 500;
}

/* Preview avatars */
.preview-avatars {
    display: flex;
    margin-left: 0.25rem;
}

.preview-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-left: -0.25rem;
    border-radius: 50%;
    font-size: 0.5rem;
    font-weight: 600;
    color: oklch(30% 0.05 0);
    border: 2px solid var(--color-bg, white);
}

.preview-avatar:first-child {
    margin-left: 0;
}

/* Replies container */
.replies-container {
    display: flex;
    margin-left: 1rem;
    position: relative;
}

.thread-line {
    position: absolute;
    left: 0.625rem;
    top: 0;
    bottom: 1rem;
    width: 2px;
    background: var(--color-border, oklch(85% 0 0));
    border-radius: 9999px;
}

.replies-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-left: 1.5rem;
    padding-top: 0.5rem;
}

/* Reply notes are smaller */
.reply-note {
    transform: scale(0.95);
    transform-origin: top left;
}

/* Reply composer */
.reply-composer-wrapper {
    margin-left: 2.5rem;
    margin-top: 0.5rem;
}

/* Animations */
.replies-enter-active,
.replies-leave-active {
    transition: all var(--duration, 200ms) var(--ease, ease);
    overflow: hidden;
}

.replies-enter-from,
.replies-leave-to {
    opacity: 0;
    max-height: 0;
}

.replies-enter-to,
.replies-leave-from {
    opacity: 1;
    max-height: 1000px;
}

.composer-enter-active,
.composer-leave-active {
    transition: all var(--duration, 200ms) var(--ease, ease);
}

.composer-enter-from,
.composer-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem);
}

/* Expanded thread styling */
.postit-thread.expanded {
    margin-bottom: 1rem;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {

    .thread-toggle,
    .toggle-icon,
    .replies-enter-active,
    .replies-leave-active,
    .composer-enter-active,
    .composer-leave-active {
        transition-duration: 0ms;
    }
}
</style>
