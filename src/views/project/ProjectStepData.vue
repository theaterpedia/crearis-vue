<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Beiträge verwalten</h3>
            <p class="step-subtitle">Wählen Sie Basis-Beiträge aus und passen Sie diese für Ihr Projekt an</p>
        </div>

        <!-- Loading Spinner -->
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Lade Beiträge...</p>
        </div>

        <!-- Error Banner -->
        <AlertBanner v-else-if="error" type="error" :message="error" />

        <!-- Main Content Grid (Left: Gallery, Right: Add Panel) -->
        <div v-else class="posts-layout">
            <!-- Left Column: Posts Gallery -->
            <div class="posts-gallery">
                <div v-if="projectPosts.length === 0" class="empty-state">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z">
                        </path>
                    </svg>
                    <p class="empty-title">Keine Beiträge vorhanden</p>
                    <p class="empty-text">Fügen Sie Ihren ersten Beitrag mit dem Panel rechts hinzu.</p>
                </div>

                <div v-else class="posts-grid">
                    <PostCard v-for="post in projectPosts" :key="post.id" :post="post" :instructors="allInstructors"
                        @delete="handlePostDelete" />
                </div>
            </div>

            <!-- Right Column: Add Post Panel -->
            <div class="add-panel-column">
                <AddPostPanel :project-id="projectId" :base-posts="basePosts" :all-instructors="allInstructors"
                    @post-added="handlePostAdded" />
            </div>
        </div>

        <div class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                Zurück
            </button>
            <button class="action-btn primary-btn" @click="handleNext">
                Weiter
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
import PostCard from '@/components/PostCard.vue'
import AddPostPanel from '@/components/AddPostPanel.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import type { Post, Instructor } from '@/types'

interface Props {
    projectId: string
}

interface Emits {
    (e: 'next'): void
    (e: 'prev'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const basePosts = ref<Post[]>([])
const projectPosts = ref<Post[]>([])
const allInstructors = ref<Instructor[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

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
        throw err
    }
}

// Load project posts (project=X, isbase=0)
async function loadProjectPosts() {
    try {
        error.value = null
        const response = await fetch(`/api/posts?project=${props.projectId}&isbase=0`)
        if (!response.ok) {
            throw new Error(`Failed to load project posts: ${response.statusText}`)
        }
        projectPosts.value = await response.json()
    } catch (err) {
        console.error('Error loading project posts:', err)
        error.value = 'Fehler beim Laden der Projekt-Beiträge'
        throw err
    }
}

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
        throw err
    }
}

// Handle post added
async function handlePostAdded(postId: string) {
    console.log('Post added:', postId)
    await loadProjectPosts()
}

// Handle post delete
async function handlePostDelete(postId: string) {
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete post: ${response.statusText}`)
        }

        console.log('Post deleted:', postId)
        await loadProjectPosts()
    } catch (err) {
        console.error('Error deleting post:', err)
        error.value = 'Fehler beim Löschen des Beitrags'
        alert('Fehler beim Löschen des Beitrags')
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
    isLoading.value = true
    try {
        await Promise.all([loadBasePosts(), loadProjectPosts(), loadInstructors()])
    } catch (err) {
        console.error('Error loading data:', err)
        error.value = 'Fehler beim Laden der Daten'
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
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    min-height: 400px;
}

/* Left Column: Posts Gallery */
.posts-gallery {
    display: flex;
    flex-direction: column;
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
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
