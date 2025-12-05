<template>
  <BottomSheet
    :is-open="isOpen"
    title="Kommentare"
    max-height="85vh"
    @close="handleClose"
    @update:is-open="handleUpdate"
  >
    <template #header>
      <div class="mobile-comments-header">
        <h3 class="header-title">
          <span class="title-icon">📝</span>
          Kommentare
          <span class="count-badge">{{ commentCount }}</span>
        </h3>
      </div>
    </template>

    <!-- Toolbar -->
    <div class="mobile-toolbar">
      <select v-model="sortBy" class="sort-select">
        <option value="newest">Neueste</option>
        <option value="oldest">Älteste</option>
        <option value="pinned">Angepinnt</option>
      </select>
      
      <button
        v-if="canAddComment"
        class="fab-btn"
        @click="showComposer = true"
      >
        ＋
      </button>
    </div>

    <!-- Composer overlay -->
    <Transition name="slide-up">
      <div v-if="showComposer" class="composer-overlay">
        <PostITComposer
          :author-name="currentUser?.name ?? 'Du'"
          :author-role="currentUserRole"
          @submit="handleSubmit"
          @cancel="showComposer = false"
        />
      </div>
    </Transition>

    <!-- Comments list -->
    <div class="comments-scroll">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>Lade...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="threads.length === 0" class="empty-state">
        <span class="empty-icon">💭</span>
        <p>Noch keine Kommentare</p>
        <button
          v-if="canAddComment"
          class="start-btn"
          @click="showComposer = true"
        >
          Ersten schreiben
        </button>
      </div>

      <!-- Pinned -->
      <div v-if="pinnedThreads.length > 0" class="section">
        <div class="section-label">📌 Angepinnt</div>
        <PostITThread
          v-for="thread in pinnedThreads"
          :key="thread.root.id"
          :root-comment="thread.root"
          :replies="thread.replies"
          :current-user-id="currentUser?.id"
          :current-user-role="currentUserRole"
          :can-pin="canPin"
          @edit="handleEdit"
          @delete="handleDelete"
          @pin="handlePin"
          @reply="handleReply"
        />
      </div>

      <!-- All comments -->
      <div v-if="unpinnedThreads.length > 0" class="section">
        <div v-if="pinnedThreads.length > 0" class="section-label">
          Alle
        </div>
        <PostITThread
          v-for="thread in unpinnedThreads"
          :key="thread.root.id"
          :root-comment="thread.root"
          :replies="thread.replies"
          :current-user-id="currentUser?.id"
          :current-user-role="currentUserRole"
          :can-pin="canPin"
          @edit="handleEdit"
          @delete="handleDelete"
          @pin="handlePin"
          @reply="handleReply"
        />
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BottomSheet from '@/components/mobile/BottomSheet.vue'
import PostITThread from './PostITThread.vue'
import PostITComposer from './PostITComposer.vue'
import type { PostITComment } from '@/composables/usePostITComments'

interface CommentThread {
  root: PostITComment
  replies: PostITComment[]
}

const props = withDefaults(defineProps<{
  isOpen: boolean
  comments: PostITComment[]
  loading?: boolean
  currentUser?: { id: string; name: string }
  currentUserRole?: string
  canAddComment?: boolean
  canPin?: boolean
}>(), {
  comments: () => [],
  loading: false,
  canAddComment: true,
  canPin: false,
})

const emit = defineEmits<{
  close: []
  'update:isOpen': [value: boolean]
  add: [content: string]
  edit: [comment: PostITComment]
  delete: [commentId: string]
  pin: [commentId: string]
  reply: [parentId: string, content: string]
}>()

// Local state
const showComposer = ref(false)
const sortBy = ref<'newest' | 'oldest' | 'pinned'>('newest')

// Organize into threads
const threads = computed<CommentThread[]>(() => {
  const roots = props.comments.filter(c => !c.parentId)
  const repliesMap = new Map<string, PostITComment[]>()
  
  for (const c of props.comments) {
    if (c.parentId) {
      const arr = repliesMap.get(c.parentId) ?? []
      arr.push(c)
      repliesMap.set(c.parentId, arr)
    }
  }
  
  return roots.map(root => ({
    root,
    replies: (repliesMap.get(root.id) ?? []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }))
})

// Sort
const sortedThreads = computed(() => {
  const arr = [...threads.value]
  
  switch (sortBy.value) {
    case 'oldest':
      arr.sort((a, b) => 
        new Date(a.root.createdAt).getTime() - new Date(b.root.createdAt).getTime()
      )
      break
    case 'pinned':
      arr.sort((a, b) => {
        if (a.root.isPinned !== b.root.isPinned) return a.root.isPinned ? -1 : 1
        return new Date(b.root.createdAt).getTime() - new Date(a.root.createdAt).getTime()
      })
      break
    default: // newest
      arr.sort((a, b) => 
        new Date(b.root.createdAt).getTime() - new Date(a.root.createdAt).getTime()
      )
  }
  
  return arr
})

const pinnedThreads = computed(() => sortedThreads.value.filter(t => t.root.isPinned))
const unpinnedThreads = computed(() => sortedThreads.value.filter(t => !t.root.isPinned))
const commentCount = computed(() => props.comments.length)

// Handlers
function handleClose() {
  emit('close')
}

function handleUpdate(value: boolean) {
  emit('update:isOpen', value)
}

function handleSubmit(content: string) {
  emit('add', content)
  showComposer.value = false
}

function handleEdit(comment: PostITComment) {
  emit('edit', comment)
}

function handleDelete(id: string) {
  emit('delete', id)
}

function handlePin(id: string) {
  emit('pin', id)
}

function handleReply(parentId: string, content: string) {
  emit('reply', parentId, content)
}

// Close composer when sheet closes
watch(() => props.isOpen, (open) => {
  if (!open) showComposer.value = false
})
</script>

<style scoped>
/* Mobile-optimized Post-IT comments */

.mobile-comments-header {
  display: flex;
  align-items: center;
}

.header-title {
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

.count-badge {
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-muted-bg, oklch(95% 0 0));
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

/* Toolbar */
.mobile-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
  margin-bottom: 0.75rem;
}

.sort-select {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border, oklch(85% 0 0));
  border-radius: var(--radius, 0.25rem);
  background: var(--color-bg, white);
}

.fab-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent, oklch(55% 0.15 260));
  color: white;
  font-size: 1.25rem;
  font-weight: 300;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.2);
  cursor: pointer;
}

/* Composer overlay */
.composer-overlay {
  padding: 0.75rem 0;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border, oklch(90% 0 0));
}

/* Scroll container */
.comments-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-muted-contrast, oklch(50% 0 0));
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--color-border, oklch(90% 0 0));
  border-top-color: var(--color-accent, oklch(55% 0.15 260));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  color: var(--color-muted-contrast, oklch(50% 0 0));
}

.start-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-highlight, oklch(92% 0.12 95));
  border: none;
  border-radius: var(--radius, 0.25rem);
  cursor: pointer;
}

/* Sections */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-contrast, oklch(50% 0 0));
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 200ms ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (prefers-reduced-motion: reduce) {
  .spinner,
  .slide-up-enter-active,
  .slide-up-leave-active {
    animation-duration: 0ms;
    transition-duration: 0ms;
  }
}
</style>
