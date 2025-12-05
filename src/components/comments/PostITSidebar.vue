<template>
    <aside class="postit-sidebar" :class="{ collapsed: isCollapsed }">
        <!-- Toggle button -->
        <button class="sidebar-toggle" @click="toggleCollapsed"
            :aria-label="isCollapsed ? 'Kommentare anzeigen' : 'Kommentare ausblenden'">
            <span class="toggle-icon">{{ isCollapsed ? '💬' : '×' }}</span>
            <span v-if="isCollapsed && commentCount > 0" class="badge">
                {{ commentCount }}
            </span>
        </button>

        <!-- Sidebar content -->
        <Transition name="sidebar">
            <div v-if="!isCollapsed" class="sidebar-content">
                <!-- Header -->
                <div class="sidebar-header">
                    <h3 class="sidebar-title">
                        <span class="title-icon">📝</span>
                        Kommentare
                    </h3>
                    <span class="comment-count">{{ commentCount }}</span>
                </div>

                <!-- Filter/Sort options -->
                <div class="sidebar-toolbar">
                    <select v-model="sortBy" class="sort-select">
                        <option value="newest">Neueste zuerst</option>
                        <option value="oldest">Älteste zuerst</option>
                        <option value="pinned">Angepinnt zuerst</option>
                    </select>

                    <button v-if="canAddComment" class="add-btn" @click="showComposer = true">
                        + Neu
                    </button>
                </div>

                <!-- Composer (when adding new) -->
                <Transition name="fade">
                    <div v-if="showComposer" class="composer-section">
                        <PostITComposer :author-name="currentUser?.name ?? 'Du'" :author-role="currentUserRole"
                            @submit="handleSubmit" @cancel="showComposer = false" />
                    </div>
                </Transition>

                <!-- Comments list -->
                <div class="comments-list" ref="listRef">
                    <!-- Loading state -->
                    <div v-if="loading" class="loading-state">
                        <div class="loading-spinner" />
                        <span>Lade Kommentare...</span>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="threads.length === 0" class="empty-state">
                        <span class="empty-icon">💭</span>
                        <p>Noch keine Kommentare.</p>
                        <button v-if="canAddComment" class="empty-cta" @click="showComposer = true">
                            Ersten Kommentar schreiben
                        </button>
                    </div>

                    <!-- Pinned comments -->
                    <div v-if="pinnedThreads.length > 0" class="pinned-section">
                        <div class="section-label">
                            <span class="pin-icon">📌</span>
                            Angepinnt
                        </div>
                        <PostITThread v-for="thread in pinnedThreads" :key="thread.root.id" :root-comment="thread.root"
                            :replies="thread.replies" :current-user-id="currentUser?.id"
                            :current-user-role="currentUserRole" :can-pin="canPin" @edit="handleEdit"
                            @delete="handleDelete" @pin="handlePin" @reply="handleReply" />
                    </div>

                    <!-- Regular comments -->
                    <div v-if="unpinnedThreads.length > 0" class="comments-section">
                        <div v-if="pinnedThreads.length > 0" class="section-label">
                            Alle Kommentare
                        </div>
                        <PostITThread v-for="thread in unpinnedThreads" :key="thread.root.id"
                            :root-comment="thread.root" :replies="thread.replies" :current-user-id="currentUser?.id"
                            :current-user-role="currentUserRole" :can-pin="canPin" @edit="handleEdit"
                            @delete="handleDelete" @pin="handlePin" @reply="handleReply" />
                    </div>
                </div>
            </div>
        </Transition>
    </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PostITThread from './PostITThread.vue'
import PostITComposer from './PostITComposer.vue'
import type { PostITComment } from '@/composables/usePostITComments'

interface CommentThread {
    root: PostITComment
    replies: PostITComment[]
}

const props = withDefaults(defineProps<{
    comments: PostITComment[]
    loading?: boolean
    currentUser?: { id: string; name: string }
    currentUserRole?: string
    canAddComment?: boolean
    canPin?: boolean
    defaultCollapsed?: boolean
}>(), {
    comments: () => [],
    loading: false,
    canAddComment: true,
    canPin: false,
    defaultCollapsed: false,
})

const emit = defineEmits<{
    add: [content: string]
    edit: [comment: PostITComment]
    delete: [commentId: string]
    pin: [commentId: string]
    reply: [parentId: string, content: string]
}>()

// Sidebar state
const isCollapsed = ref(props.defaultCollapsed)
const showComposer = ref(false)
const sortBy = ref<'newest' | 'oldest' | 'pinned'>('newest')
const listRef = ref<HTMLElement | null>(null)

// Computed: organize comments into threads
const threads = computed<CommentThread[]>(() => {
    const rootComments = props.comments.filter(c => !c.parentId)
    const repliesMap = new Map<string, PostITComment[]>()

    // Group replies by parent
    for (const comment of props.comments) {
        if (comment.parentId) {
            const replies = repliesMap.get(comment.parentId) ?? []
            replies.push(comment)
            repliesMap.set(comment.parentId, replies)
        }
    }

    // Build threads
    return rootComments.map(root => ({
        root,
        replies: (repliesMap.get(root.id) ?? []).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    }))
})

// Sorted threads
const sortedThreads = computed<CommentThread[]>(() => {
    const sorted = [...threads.value]

    switch (sortBy.value) {
        case 'newest':
            sorted.sort((a, b) =>
                new Date(b.root.createdAt).getTime() - new Date(a.root.createdAt).getTime()
            )
            break
        case 'oldest':
            sorted.sort((a, b) =>
                new Date(a.root.createdAt).getTime() - new Date(b.root.createdAt).getTime()
            )
            break
        case 'pinned':
            sorted.sort((a, b) => {
                if (a.root.isPinned && !b.root.isPinned) return -1
                if (!a.root.isPinned && b.root.isPinned) return 1
                return new Date(b.root.createdAt).getTime() - new Date(a.root.createdAt).getTime()
            })
            break
    }

    return sorted
})

// Separate pinned and unpinned
const pinnedThreads = computed(() =>
    sortedThreads.value.filter(t => t.root.isPinned)
)

const unpinnedThreads = computed(() =>
    sortedThreads.value.filter(t => !t.root.isPinned)
)

// Total count (including replies)
const commentCount = computed(() => props.comments.length)

// Toggle sidebar
function toggleCollapsed() {
    isCollapsed.value = !isCollapsed.value
}

// Event handlers
function handleSubmit(content: string) {
    emit('add', content)
    showComposer.value = false
}

function handleEdit(comment: PostITComment) {
    emit('edit', comment)
}

function handleDelete(commentId: string) {
    emit('delete', commentId)
}

function handlePin(commentId: string) {
    emit('pin', commentId)
}

function handleReply(parentId: string, content: string) {
    emit('reply', parentId, content)
}

// Scroll to top when sort changes
watch(sortBy, () => {
    listRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, semantic vars */

.postit-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 24rem;
    max-width: 100vw;
    background: var(--color-surface, oklch(98% 0 0));
    border-left: 1px solid var(--color-border, oklch(90% 0 0));
    box-shadow: -4px 0 24px oklch(0% 0 0 / 0.08);
    z-index: 100;
    display: flex;
    flex-direction: column;
    font-family: var(--font);
    transition: width var(--duration, 300ms) var(--ease, ease);
}

.postit-sidebar.collapsed {
    width: 3.5rem;
}

/* Toggle button */
.sidebar-toggle {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg, white);
    border: 1px solid var(--color-border, oklch(90% 0 0));
    border-radius: 50%;
    font-size: 1rem;
    cursor: pointer;
    z-index: 10;
    transition: var(--transition, all 150ms ease);
}

.sidebar-toggle:hover {
    background: var(--color-highlight, oklch(92% 0.12 95));
    border-color: var(--color-accent, oklch(55% 0.15 260));
}

.collapsed .sidebar-toggle {
    right: 0.5rem;
}

.badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent, oklch(55% 0.15 260));
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    border-radius: 9999px;
}

/* Sidebar content */
.sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* Header */
.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    padding-right: 4rem;
    /* Space for toggle */
    border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
}

.sidebar-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-contrast, oklch(20% 0 0));
}

.title-icon {
    font-size: 1.25rem;
}

.comment-count {
    font-size: 0.875rem;
    color: var(--color-muted-contrast, oklch(50% 0 0));
    background: var(--color-muted-bg, oklch(95% 0 0));
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius, 0.25rem);
}

/* Toolbar */
.sidebar-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
}

.sort-select {
    flex: 1;
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    border: 1px solid var(--color-border, oklch(85% 0 0));
    border-radius: var(--radius, 0.25rem);
    background: var(--color-bg, white);
    color: var(--color-contrast, oklch(20% 0 0));
    cursor: pointer;
}

.add-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: var(--color-accent, oklch(55% 0.15 260));
    color: white;
    border: none;
    border-radius: var(--radius, 0.25rem);
    cursor: pointer;
    transition: var(--transition);
}

.add-btn:hover {
    filter: brightness(1.1);
}

/* Composer section */
.composer-section {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
    background: var(--color-muted-bg, oklch(97% 0 0));
}

/* Comments list */
.comments-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Loading state */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 1rem;
    color: var(--color-muted-contrast, oklch(50% 0 0));
}

.loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--color-border, oklch(90% 0 0));
    border-top-color: var(--color-accent, oklch(55% 0.15 260));
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 1rem;
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    opacity: 0.5;
}

.empty-state p {
    margin: 0;
    color: var(--color-muted-contrast, oklch(50% 0 0));
}

.empty-cta {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    background: var(--color-highlight, oklch(92% 0.12 95));
    color: var(--color-contrast, oklch(20% 0 0));
    border: none;
    border-radius: var(--radius, 0.25rem);
    cursor: pointer;
    transition: var(--transition);
}

.empty-cta:hover {
    background: var(--color-accent, oklch(55% 0.15 260));
    color: white;
}

/* Section labels */
.section-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted-contrast, oklch(50% 0 0));
    margin-bottom: 0.5rem;
}

.pin-icon {
    font-size: 0.875rem;
}

.pinned-section {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--color-border, oklch(85% 0 0));
}

/* Animation */
.sidebar-enter-active,
.sidebar-leave-active {
    transition: opacity var(--duration, 200ms) var(--ease, ease);
}

.sidebar-enter-from,
.sidebar-leave-to {
    opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: all var(--duration, 200ms) var(--ease, ease);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem);
}

/* Mobile: full-width overlay */
@media (max-width: 640px) {
    .postit-sidebar {
        width: 100vw;
        border-left: none;
    }

    .postit-sidebar.collapsed {
        width: 3.5rem;
        border-left: 1px solid var(--color-border, oklch(90% 0 0));
    }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {

    .postit-sidebar,
    .sidebar-toggle,
    .sidebar-enter-active,
    .sidebar-leave-active,
    .fade-enter-active,
    .fade-leave-active,
    .loading-spinner {
        transition-duration: 0ms;
        animation-duration: 0ms;
    }
}
</style>
