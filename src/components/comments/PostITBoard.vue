<template>
    <div class="postit-board" :class="{ loading: isLoading, empty: comments.length === 0 }">
        <!-- Header -->
        <div class="board-header">
            <h3 class="board-title">
                <span class="title-icon">📋</span>
                Kommentare
                <span v-if="total > 0" class="comment-count">({{ total }})</span>
            </h3>

            <button class="compose-btn" @click="showComposer = !showComposer">
                ✏️ Neuer Kommentar
            </button>
        </div>

        <!-- Composer -->
        <Transition name="slide">
            <PostITComposer v-if="showComposer" :color="myColor" :is-loading="isSubmitting" @submit="handleSubmit"
                @cancel="showComposer = false" />
        </Transition>

        <!-- Pinned comments -->
        <div v-if="pinnedComments.length > 0" class="pinned-section">
            <div class="section-label">📌 Angepinnt</div>
            <div class="notes-grid pinned">
                <PostITNote v-for="comment in pinnedComments" :key="comment.id" :id="comment.id"
                    :content="comment.content" :author-name="comment.author.name"
                    :author-relation="comment.author.relation" :created-at="comment.createdAt" :color="comment.color"
                    :is-pinned="true" :reactions="comment.reactions" :reply-count="comment.replyCount"
                    :can-edit="canEditComment(comment)" :can-pin="canPinComment" :can-delete="canDeleteComment(comment)"
                    @reply="handleReply(comment)" @react="emoji => handleReact(comment.id, emoji)"
                    @pin="handlePin(comment.id)" @edit="content => handleEdit(comment.id, content)"
                    @delete="handleDelete(comment.id)" @showReplies="handleShowReplies(comment)" />
            </div>
        </div>

        <!-- Regular comments (threads) -->
        <div class="threads-section">
            <TransitionGroup name="list" tag="div" class="notes-grid">
                <PostITNote v-for="thread in displayThreads" :key="thread.parent.id" :id="thread.parent.id"
                    :content="thread.parent.content" :author-name="thread.parent.author.name"
                    :author-relation="thread.parent.author.relation" :created-at="thread.parent.createdAt"
                    :color="thread.parent.color" :is-pinned="false" :reactions="thread.parent.reactions"
                    :reply-count="thread.totalCount - 1" :can-edit="canEditComment(thread.parent)"
                    :can-pin="canPinComment" :can-delete="canDeleteComment(thread.parent)"
                    @reply="handleReply(thread.parent)" @react="emoji => handleReact(thread.parent.id, emoji)"
                    @pin="handlePin(thread.parent.id)" @edit="content => handleEdit(thread.parent.id, content)"
                    @delete="handleDelete(thread.parent.id)" @showReplies="handleShowReplies(thread.parent)" />
            </TransitionGroup>
        </div>

        <!-- Empty state -->
        <div v-if="!isLoading && comments.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <p class="empty-text">Noch keine Kommentare</p>
            <button class="empty-cta" @click="showComposer = true">
                Ersten Kommentar schreiben
            </button>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="load-more">
            <button class="load-more-btn" :disabled="isLoading" @click="loadMore">
                {{ isLoading ? 'Laden...' : 'Mehr laden' }}
            </button>
        </div>

        <!-- Thread view modal -->
        <BottomSheet v-model:is-open="showThreadView"
            :title="activeThread ? `Antworten (${activeThread.replyCount})` : 'Antworten'">
            <template v-if="activeThread">
                <!-- Parent comment -->
                <PostITNote :id="activeThread.id" :content="activeThread.content"
                    :author-name="activeThread.author.name" :author-relation="activeThread.author.relation"
                    :created-at="activeThread.createdAt" :color="activeThread.color" :is-pinned="activeThread.isPinned"
                    :reactions="activeThread.reactions" :reply-count="0" compact />

                <!-- Replies -->
                <div class="thread-replies">
                    <PostITNote v-for="reply in threadReplies" :key="reply.id" :id="reply.id" :content="reply.content"
                        :author-name="reply.author.name" :author-relation="reply.author.relation"
                        :created-at="reply.createdAt" :color="reply.color" :reactions="reply.reactions"
                        :can-edit="canEditComment(reply)" :can-delete="canDeleteComment(reply)" compact
                        @react="emoji => handleReact(reply.id, emoji)" @edit="content => handleEdit(reply.id, content)"
                        @delete="handleDelete(reply.id)" />
                </div>

                <!-- Reply composer -->
                <PostITComposer :color="myColor" :is-loading="isSubmitting" placeholder="Antwort schreiben..." compact
                    @submit="handleReplySubmit" />
            </template>
        </BottomSheet>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import PostITNote from './PostITNote.vue'
import PostITComposer from './PostITComposer.vue'
import BottomSheet from '@/components/mobile/BottomSheet.vue'
import {
    usePostITComments,
    type Comment,
    type PostITColor
} from '@/composables/usePostITComments'
import type { ProjectRelation } from '@/composables/useProjectActivation'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
    entityType: 'post' | 'project' | 'event' | 'image'
    entityId: string
    projectId: string
    userRelation: ProjectRelation
    isProjectOwner?: boolean
}>()

const { user } = useAuth()

// Use comments composable
const entityTypeRef = toRef(props, 'entityType')
const entityIdRef = toRef(props, 'entityId')
const projectIdRef = toRef(props, 'projectId')
const userRelationRef = toRef(props, 'userRelation')

const {
    comments,
    threads,
    pinnedComments,
    total,
    hasMore,
    isLoading,
    myColor,
    createComment,
    updateComment,
    deleteComment,
    togglePin,
    addReaction,
    loadMore: loadMoreComments,
} = usePostITComments(entityTypeRef, entityIdRef, projectIdRef, userRelationRef)

// Local state
const showComposer = ref(false)
const isSubmitting = ref(false)
const showThreadView = ref(false)
const activeThread = ref<Comment | null>(null)

// Non-pinned threads for display
const displayThreads = computed(() =>
    threads.value.filter(t => !t.parent.isPinned)
)

// Replies for active thread
const threadReplies = computed(() => {
    if (!activeThread.value) return []
    return comments.value.filter(c => c.parentId === activeThread.value?.id)
})

// Permission checks
const canPinComment = computed(() => props.isProjectOwner ?? false)

function canEditComment(comment: Comment): boolean {
    return comment.author.id === user.value?.id
}

function canDeleteComment(comment: Comment): boolean {
    return comment.author.id === user.value?.id || (props.isProjectOwner ?? false)
}

// Handlers
async function handleSubmit(content: string) {
    isSubmitting.value = true
    try {
        await createComment({ content })
        showComposer.value = false
    } finally {
        isSubmitting.value = false
    }
}

function handleReply(comment: Comment) {
    activeThread.value = comment
    showThreadView.value = true
}

async function handleReplySubmit(content: string) {
    if (!activeThread.value) return

    isSubmitting.value = true
    try {
        await createComment({ content, parentId: activeThread.value.id })
    } finally {
        isSubmitting.value = false
    }
}

async function handleReact(commentId: string, emoji: string) {
    const comment = comments.value.find(c => c.id === commentId)
    const existingReaction = comment?.reactions.find(r => r.emoji === emoji)

    if (existingReaction?.hasReacted) {
        // Would call removeReaction here
    } else {
        await addReaction(commentId, emoji)
    }
}

async function handlePin(commentId: string) {
    await togglePin(commentId)
}

async function handleEdit(commentId: string, content: string) {
    await updateComment(commentId, content)
}

async function handleDelete(commentId: string) {
    if (confirm('Kommentar wirklich löschen?')) {
        await deleteComment(commentId)

        // Close thread view if deleting the parent
        if (activeThread.value?.id === commentId) {
            showThreadView.value = false
            activeThread.value = null
        }
    }
}

function handleShowReplies(comment: Comment) {
    activeThread.value = comment
    showThreadView.value = true
}

function loadMore() {
    loadMoreComments()
}
</script>

<style scoped>
/* Following Opus CSS conventions */

.postit-board {
    padding: 1rem;
    font-family: var(--font);
}

/* Header */
.board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, oklch(85% 0 0));
}

.board-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
}

.title-icon {
    font-size: 1.25rem;
}

.comment-count {
    font-weight: 400;
    color: var(--color-muted-contrast, oklch(50% 0 0));
}

.compose-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary-base, oklch(55% 0.15 250));
    color: white;
    border: none;
    border-radius: var(--radius-button, 0.25rem);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.compose-btn:hover {
    background: var(--color-primary-hover, oklch(50% 0.15 250));
}

/* Notes grid */
.notes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    padding: 1rem 0;
}

/* Pinned section */
.pinned-section {
    margin-bottom: 1.5rem;
}

.section-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-contrast, oklch(50% 0 0));
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.notes-grid.pinned {
    background: oklch(95% 0.02 85 / 0.3);
    border-radius: var(--radius-medium, 0.5rem);
    padding: 1rem;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-text {
    color: var(--color-muted-contrast, oklch(50% 0 0));
    margin: 0 0 1rem;
}

.empty-cta {
    padding: 0.5rem 1rem;
    background: var(--postit-yellow, oklch(92% 0.12 95));
    color: oklch(30% 0.05 95);
    border: none;
    border-radius: var(--radius-button, 0.25rem);
    font-family: var(--font);
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.empty-cta:hover {
    transform: translateY(-2px);
    box-shadow: 2px 3px 8px oklch(0% 0 0 / 0.15);
}

/* Load more */
.load-more {
    display: flex;
    justify-content: center;
    padding: 1rem;
}

.load-more-btn {
    padding: 0.5rem 1.5rem;
    background: var(--color-muted-bg, oklch(95% 0 0));
    border: 1px solid var(--color-border, oklch(85% 0 0));
    border-radius: var(--radius-button, 0.25rem);
    font-family: var(--font);
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--transition);
}

.load-more-btn:hover:not(:disabled) {
    background: var(--color-bg, oklch(100% 0 0));
}

.load-more-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Thread view */
.thread-replies {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 0;
    margin-left: 1rem;
    border-left: 2px solid var(--color-border, oklch(85% 0 0));
    padding-left: 1rem;
}

/* Animations */
.slide-enter-active,
.slide-leave-active {
    transition: all var(--duration, 200ms) var(--ease, ease);
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-1rem);
}

.list-enter-active,
.list-leave-active {
    transition: all var(--duration, 300ms) var(--ease, ease);
}

.list-enter-from {
    opacity: 0;
    transform: scale(0.9) rotate(-5deg);
}

.list-leave-to {
    opacity: 0;
    transform: scale(0.9) rotate(5deg);
}

/* Responsive */
@media (max-width: 640px) {
    .notes-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .board-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
    }

    .compose-btn {
        width: 100%;
    }
}
</style>
