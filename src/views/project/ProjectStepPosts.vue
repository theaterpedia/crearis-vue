<template>
    <div class="step-component">
        <div class="step-header">
            <h3 v-html="i18nTitle"></h3>
            <p class="step-subtitle" v-html="i18nSubtitle"></p>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p v-html="i18nLoading"></p>
        </div>

        <!-- Error Banner -->
        <AlertBanner v-else-if="error" type="error" :message="error" />

        <!-- Main Content Grid (Left: Gallery, Right: Add Panel) -->
        <div v-else class="posts-layout">
            <!-- Left Column: Posts Gallery (using clist pGallery) -->
            <div class="posts-gallery">
                <pGallery ref="postsGalleryRef" entity="posts" :project="projectId" :status-gt="0" size="medium"
                    item-type="card" :anatomy="'topimage'" on-activate="route" show-trash
                    @item-trash="handlePostDelete" />
            </div>

            <!-- Right Column: Add Post Panel -->
            <div class="add-panel-column">
                <AddPostPanel :project-id="projectId" :base-posts="basePosts" :all-instructors="allInstructors"
                    @post-added="handlePostAdded" />
            </div>
        </div>

        <div v-if="!hideActions" class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                <span v-html="i18nPrev"></span>
            </button>
            <button class="action-btn primary-btn" @click="handleNext">
                <span v-html="i18nNext"></span>
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import pGallery from '@/components/page/pGallery.vue'
import AddPostPanel from '@/components/AddPostPanel.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import { useI18n } from '@/composables/useI18n'
import type { Post, Instructor } from '@/types'

interface Props {
    projectId: string
    isLocked?: boolean
    hideActions?: boolean
}

interface Emits {
    (e: 'next'): void
    (e: 'prev'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false,
    hideActions: false
})
const emit = defineEmits<Emits>()

// i18n setup - default to German for project users
const { setLanguage } = useI18n()
setLanguage('de')

// i18n reactive strings
const i18nTitle = ref('')
const i18nSubtitle = ref('')
const i18nLoading = ref('')
const i18nNext = ref('')
const i18nPrev = ref('')
const i18nEmptyTitle = ref('')
const i18nEmptyText = ref('')
const i18nErrorPosts = ref('')
const i18nErrorInstructors = ref('')
const i18nErrorDelete = ref('')

// State
const basePosts = ref<Post[]>([])
const allInstructors = ref<Instructor[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const postsGalleryRef = ref<InstanceType<typeof pGallery> | null>(null)

// Load base posts (isbase=1)
async function loadBasePosts() {
    try {
        const response = await fetch('/api/posts?isbase=1')
        if (!response.ok) {
            throw new Error(`Failed to load base posts: ${response.statusText}`)
        }
        basePosts.value = await response.json()
    } catch (err) {
        console.error('Error loading base posts:', err)
        error.value = i18nErrorPosts.value
        throw err
    }
}

// Note: Project posts are now loaded by pGallery component automatically

// Load instructors
async function loadInstructors() {
    try {
        const response = await fetch('/api/public-users')
        if (!response.ok) {
            throw new Error(`Failed to load instructors: ${response.statusText}`)
        }
        allInstructors.value = await response.json()
    } catch (err) {
        console.error('Error loading instructors:', err)
        error.value = i18nErrorInstructors.value
        throw err
    }
}

// Handle post added - refresh the gallery
async function handlePostAdded(postId: string) {
    console.log('Post added:', postId)
    // Refresh pGallery to show newly added post
    postsGalleryRef.value?.refresh()
}

// Handle post delete (from pGallery item-trash event)
async function handlePostDelete(item: any) {
    const postId = item?.id || item
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete post: ${response.statusText}`)
        }

        console.log('Post deleted:', postId)
        // Refresh the gallery after delete
        postsGalleryRef.value?.refresh()
    } catch (err) {
        console.error('Error deleting post:', err)
        error.value = i18nErrorDelete.value
        alert(i18nErrorDelete.value)
    }
}

function handleNext() {
    emit('next')
}

function handlePrev() {
    emit('prev')
}

// Load data on mount
onMounted(async () => {
    // Load i18n strings with inline HTML strategy (get-or-create with default text)
    const { getOrCreate } = useI18n()

    const titleEntry = await getOrCreate('posts', 'field', 'false', 'Beiträge verwalten')
    i18nTitle.value = titleEntry?.text?.de || 'Beiträge verwalten'

    const subtitleEntry = await getOrCreate('posts-step-subtitle', 'desc', 'false', 'Wählen Sie Basis-Beiträge aus und passen Sie diese für Ihr Projekt an')
    i18nSubtitle.value = subtitleEntry?.text?.de || 'Wählen Sie Basis-Beiträge aus und passen Sie diese für Ihr Projekt an'

    const loadingEntry = await getOrCreate('loading-posts', 'desc', 'false', 'Lade Beiträge...')
    i18nLoading.value = loadingEntry?.text?.de || 'Lade Beiträge...'

    const nextEntry = await getOrCreate('next', 'button', 'false', 'Weiter')
    i18nNext.value = nextEntry?.text?.de || 'Weiter'

    const prevEntry = await getOrCreate('prev', 'button', 'false', 'Zurück')
    i18nPrev.value = prevEntry?.text?.de || 'Zurück'

    const emptyTitleEntry = await getOrCreate('no-posts-yet', 'desc', 'false', 'Keine Beiträge vorhanden')
    i18nEmptyTitle.value = emptyTitleEntry?.text?.de || 'Keine Beiträge vorhanden'

    const emptyTextEntry = await getOrCreate('add-posts-right', 'desc', 'false', 'Fügen Sie Ihren ersten Beitrag mit dem Panel rechts hinzu.')
    i18nEmptyText.value = emptyTextEntry?.text?.de || 'Fügen Sie Ihren ersten Beitrag mit dem Panel rechts hinzu.'

    const errorPostsEntry = await getOrCreate('error-loading-posts', 'desc', 'false', 'Fehler beim Laden der Beiträge')
    i18nErrorPosts.value = errorPostsEntry?.text?.de || 'Fehler beim Laden der Beiträge'

    const errorInstructorsEntry = await getOrCreate('error-loading-instructors', 'desc', 'false', 'Fehler beim Laden der Kursleiter')
    i18nErrorInstructors.value = errorInstructorsEntry?.text?.de || 'Fehler beim Laden der Kursleiter'

    const errorDeleteEntry = await getOrCreate('error-deleting-post', 'desc', 'false', 'Fehler beim Löschen des Beitrags')
    i18nErrorDelete.value = errorDeleteEntry?.text?.de || 'Fehler beim Löschen des Beitrags'

    isLoading.value = true
    try {
        // Load base posts and instructors (pGallery handles project posts)
        await Promise.all([loadBasePosts(), loadInstructors()])
    } catch (err) {
        console.error('Error loading data:', err)
        error.value = i18nErrorPosts.value
    } finally {
        isLoading.value = false
    }
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

/* Loading State */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    min-height: 300px;
    gap: 1rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-container p {
    color: var(--color-dimmed);
    font-size: 0.875rem;
}

/* Main Layout: Two Columns */
.posts-layout {
    display: grid;
    grid-template-columns: 1fr minmax(250px, 400px);
    gap: 1.5rem;
    min-height: 400px;
}

/* Responsive: Stack on smaller screens */
@media (max-width: 900px) {
    .posts-layout {
        grid-template-columns: 1fr;
    }
}

/* Left Column: Posts Gallery */
.posts-gallery {
    display: flex;
    flex-direction: column;
    min-width: 0;
    /* Prevent overflow */
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

@media (min-width: 1200px) {
    .posts-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: var(--color-background-soft);
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
    min-height: 300px;
}

.empty-state svg {
    color: var(--color-dimmed);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0 0 0.5rem 0;
}

.empty-text {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
    max-width: 400px;
}

/* Right Column: Add Panel */
.add-panel-column {
    position: sticky;
    top: 1rem;
    height: fit-content;
}

/* Step Actions */
.step-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-project);
    color: white;
}

.primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.secondary-btn {
    background: var(--color-bg);
    color: var(--color-text);
    border: var(--border) solid var(--color-border);
}

.secondary-btn:hover {
    background: var(--color-bg-soft);
}

.action-btn:active {
    transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
    .posts-layout {
        grid-template-columns: 1fr;
    }

    .add-panel-column {
        position: static;
    }

    .posts-grid {
        grid-template-columns: 1fr;
    }
}
</style>
