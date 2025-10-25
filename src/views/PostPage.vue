<!-- PostPage.vue - Single post view with page configuration -->
<template>
    <div class="post-page">
        <!-- Edit Panel -->
        <EditPanel v-if="post" :is-open="isEditPanelOpen" :title="`Edit ${post.heading || post.name || 'Post'}`"
            subtitle="Update post information" :data="editPanelData" @close="closeEditPanel" @save="handleSavePost" />

        <!-- Page Config Panel (for admins/owners) -->
        <div v-if="showConfigPanel" class="config-panel-overlay" @click.self="closeConfigPanel">
            <div class="config-panel-container">
                <button class="close-panel-btn" @click="closeConfigPanel">&times;</button>
                <PageConfigController :project="projectId" type="posts" mode="pages" />
            </div>
        </div>

        <!-- PageLayout wrapper with PageHeading in header slot -->
        <PageLayout v-if="post">
            <template #header>
                <PageHeading :heading="post.heading || post.name || post.id"
                    :teaserText="post.teaser || post.md || 'Read this post.'"
                    :imgTmp="post.cimg || 'https://picsum.photos/1440/900?random=post'" :headerType="post.header_type || 'banner'"
                    :headerSize="'prominent'" />
            </template>

            <!-- Post Content Section -->
            <Section background="default">
                <Container>
                    <Prose>
                        <!-- Post metadata -->
                        <div class="post-meta">
                            <p v-if="post.post_date"><strong>Published:</strong> {{ formatDate(post.post_date) }}</p>
                            <p v-if="post.author_id"><strong>Author:</strong> {{ post.author_id }}</p>
                        </div>

                        <!-- Admin/Owner Controls -->
                        <div v-if="canEdit" class="post-controls">
                            <button class="icon-btn" @click="openEditPanel" title="Edit Post">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
                                    </path>
                                </svg>
                            </button>
                            <button class="icon-btn" @click="openConfigPanel" title="Configure Page Layout">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                                    </path>
                                </svg>
                            </button>
                        </div>

                        <!-- Post HTML or Markdown content -->
                        <div v-if="post.html" v-html="post.html" class="post-html-content"></div>
                        <div v-else-if="post.md" class="post-markdown-content">{{ post.md }}</div>
                        <p v-else><em>No content available for this post.</em></p>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>

        <!-- Fallback for when post is not loaded -->
        <PageLayout v-else>
            <template #header>
                <Section>
                    <Container>
                        <Prose>
                            <h1>Post Not Found</h1>
                            <p>The requested post could not be loaded.</p>
                        </Prose>
                    </Container>
                </Section>
            </template>
            <Section>
                <Container>
                    <Prose>
                        <p><a :href="`/sites/${domaincode}`">Return to Project</a></p>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import PageLayout from '@/components/PageLayout.vue'
import PageHeading from '@/components/PageHeading.vue'
import EditPanel from '@/components/EditPanel.vue'
import PageConfigController from '@/components/PageConfigController.vue'
import Prose from '@/components/Prose.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'

const router = useRouter()
const route = useRoute()
const { user } = useAuth()

// State
const post = ref<any>(null)
const projectId = ref<number | null>(null)
const domaincode = ref<string>('')
const isEditPanelOpen = ref(false)
const showConfigPanel = ref(false)

// Computed
const canEdit = computed(() => {
    if (!user.value) return false
    // Admin can always edit
    if (user.value.role === 'admin') return true
    // Project owner can edit
    if (user.value.activeRole === 'project' && projectId.value) {
        // Check if user is owner of this project
        return true // Simplified - should check ownership
    }
    return false
})

const editPanelData = computed((): EditPanelData[] => {
    if (!post.value) return []
    return [
        {
            label: 'Heading',
            key: 'heading',
            type: 'text',
            value: post.value.heading || post.value.name || '',
            required: true
        },
        {
            label: 'Teaser',
            key: 'teaser',
            type: 'textarea',
            value: post.value.teaser || ''
        },
        {
            label: 'Content (Markdown)',
            key: 'md',
            type: 'textarea',
            value: post.value.md || ''
        },
        {
            label: 'Cover Image URL',
            key: 'cimg',
            type: 'text',
            value: post.value.cimg || ''
        },
        {
            label: 'Header Type',
            key: 'header_type',
            type: 'select',
            value: post.value.header_type || 'banner',
            options: ['simple', 'banner', 'hero']
        }
    ]
})

// Methods
async function loadPost() {
    const postId = route.params.id
    domaincode.value = route.params.domaincode as string

    try {
        // First, get project by domaincode to get project_id
        const projectRes = await fetch(`/api/projects/${domaincode.value}`)
        if (!projectRes.ok) throw new Error('Project not found')
        const projectData = await projectRes.json()
        projectId.value = projectData.project.id

        // Load post
        const response = await fetch(`/api/posts/${postId}`)
        if (!response.ok) throw new Error('Failed to load post')
        const data = await response.json()
        post.value = data.post

        // Update heading if name exists
        if (post.value.name && !post.value.heading) {
            post.value.heading = post.value.name
        }
    } catch (error) {
        console.error('Error loading post:', error)
    }
}

function formatDate(date: string): string {
    if (!date) return ''
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch {
        return date
    }
}

function openEditPanel() {
    isEditPanelOpen.value = true
}

function closeEditPanel() {
    isEditPanelOpen.value = false
}

function openConfigPanel() {
    showConfigPanel.value = true
}

function closeConfigPanel() {
    showConfigPanel.value = false
}

async function handleSavePost(data: Record<string, any>) {
    try {
        const response = await fetch(`/api/posts/${post.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) throw new Error('Failed to save post')

        // Reload post
        await loadPost()
        closeEditPanel()
    } catch (error) {
        console.error('Error saving post:', error)
        alert('Failed to save post')
    }
}

onMounted(() => {
    loadPost()
})
</script>

<style scoped>
.post-page {
    min-height: 100vh;
    background: var(--color-neutral-bg);
}

.post-meta {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--headings);
}

.post-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: opacity 0.2s;
}

.icon-btn:hover {
    opacity: 0.9;
}

.post-html-content {
    line-height: 1.7;
}

.post-markdown-content {
    white-space: pre-wrap;
    line-height: 1.7;
}

.config-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.config-panel-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    height: 90vh;
    background: var(--color-card-bg);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.close-panel-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10;
    transition: opacity 0.2s;
}

.close-panel-btn:hover {
    opacity: 0.8;
}
</style>
