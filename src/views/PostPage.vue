<!--
  PostPage.vue - Single post view with page configuration
  
  TODO v0.5 (Odoo Integration):
  - Implement slug-from-xmlid for SEO-friendly URLs
  - Current implementation uses numeric IDs: /sites/:domaincode/posts/:id
  - Target URL pattern: /sites/:domaincode/posts/:slug
  - Slug derivation: xmlid.split('.').pop() → e.g., "dasei.post-workshop-recap" → "post-workshop-recap"
-->
<template>
    <div class="post-page">
        <!-- Edit Panel -->
        <EditPanel v-if="post" :is-open="isEditPanelOpen" :title="`Edit ${post.name || 'Post'}`"
            subtitle="Update post information" :data="editPanelData" entity-type="posts"
            :projectDomaincode="post.domaincode" :entity-id="post.id" :project-id="post.project_id || projectId"
            :owner-id="post.owner_id" :creator-id="post.creator_id"
            :project-owner-sysmail="project?.owner_sysmail || ''" :project-status="project?.status || 0"
            @close="closeEditPanel" @save="handleSavePost" />

        <!-- Page Config Panel (for admins/owners) -->
        <div v-if="showConfigPanel" class="config-panel-overlay" @click.self="closeConfigPanel">
            <div class="config-panel-container">
                <button class="close-panel-btn" @click="closeConfigPanel">&times;</button>
                <PageConfigController :project="projectId" type="posts" mode="pages" />
            </div>
        </div>

        <!-- PageLayout wrapper with PageHeading in header slot -->
        <PageLayout v-if="post" :asideOptions="asideOptions" :footerOptions="footerOptions" :projectId="projectId"
            :navItems="navigationItems">
            <template #header>
                <PageHeading :heading="post.name || String(post.id)"
                    :imgTmp="post.img_wide?.url || post.cimg || 'https://picsum.photos/1440/900?random=post'"
                    :headerType="post.header_type || 'banner'" :headerSize="'prominent'" />
            </template>

            <!-- Tag Families Row -->
            <Section v-if="post.ttags || post.ctags || post.dtags" background="muted" spacing="compact">
                <Container>
                    <TagFamilies v-model:ttags="post.ttags" v-model:ctags="post.ctags" v-model:dtags="post.dtags"
                        :status="post.status" :config="post.config" :enable-edit="canEdit" group-selection="core"
                        layout="wrap" @update:ttags="handleUpdateTags('ttags', $event)"
                        @update:ctags="handleUpdateTags('ctags', $event)"
                        @update:dtags="handleUpdateTags('dtags', $event)" />
                </Container>
            </Section>

            <!-- Post Content Section -->
            <Section background="default">
                <Container>
                    <Prose>
                        <!-- Post metadata row: Status + Updated date + Controls (right-aligned) -->
                        <div class="post-meta-row">
                            <div class="post-meta-left">
                                <PostStatusBadge v-if="post && project" :post="postDataForPermissions"
                                    :project="projectDataForPermissions" :membership="null"
                                    @status-changed="handleStatusChange" @scope-changed="handleStatusChange"
                                    @trash="handleTrash" @restore="handleRestore" @error="handleStatusError" />
                                <span v-if="post.updated_at" class="post-updated">
                                    Updated: {{ formatDate(post.updated_at) }}
                                </span>
                            </div>
                            <div v-if="canEdit" class="post-meta-right">
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
                        </div>

                        <p v-if="post.teaser">{{ post.teaser }}</p>

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
import StatusBadge from '@/components/sysreg/StatusBadge.vue'
import PostStatusBadge from '@/components/PostStatusBadge.vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import Prose from '@/components/Prose.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { sanitizeStatusVal, bufferToHex, getStatusLabel } from '@/composables/useSysreg'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'

const router = useRouter()
const route = useRoute()
const { user, checkSession, isLoading: authLoading } = useAuth()

// State
const post = ref<any>(null)
const project = ref<any>(null)
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

// Navigation items
const navigationItems = computed(() => {
    const items = [
        {
            label: 'Project',
            link: `/sites/${domaincode.value}`
        }
    ]

    // Add Back button for project role users
    if (user?.value?.activeRole === 'project') {
        items.unshift({
            label: 'Back to Dashboard',
            link: `/projects/${domaincode.value}/topics`
        })
    }

    return items
})

// Parse options for PageLayout from post data
const asideOptions = computed<AsideOptions>(() => {
    if (!post.value) return {}
    // Posts table uses JSONB fields for options
    return parseAsideOptions({
        aside_postit: post.value.aside_options,
        aside_toc: post.value.aside_toc,
        aside_list: post.value.aside_list,
        aside_context: post.value.aside_context
    })
})

const footerOptions = computed<FooterOptions>(() => {
    if (!post.value) return {}
    // Posts table uses JSONB fields for options
    return parseFooterOptions({
        footer_gallery: post.value.footer_gallery,
        footer_postit: post.value.footer_options,
        footer_slider: post.value.footer_slider,
        footer_repeat: post.value.footer_repeat
    })
})

// Convert status_val to hex string and get label (synchronous with unified composable)
const statusValueString = computed(() => {
    if (!post.value?.status) return null
    return bufferToHex(post.value.status)
})

const statusLabel = computed(() => {
    const hex = statusValueString.value
    if (!hex) return ''
    // getStatusLabel auto-uses current i18n language
    return getStatusLabel(hex, 'posts')
})

const editPanelData = computed((): EditPanelData => {
    if (!post.value) return { heading: '', teaser: '', md: '' }
    return {
        heading: post.value.name || '',
        teaser: post.value.teaser || '',
        md: post.value.md || '',
        img_id: post.value.img_id || null,
        header_type: post.value.header_type || 'banner',
        header_size: post.value.header_size || null,
        status: post.value.status || null,  // Pass raw value to match dropdown
        ttags: post.value.ttags || '',
        ctags: post.value.ctags || '',
        dtags: post.value.dtags || ''
    }
})

// Computed data for PostStatusBadge
const postDataForPermissions = computed(() => {
    if (!post.value) return { id: 0, owner_id: 0, status: 1, project_id: 0 }
    // Treat NULL/0 status as NEW (1)
    const status = post.value.status || 1
    return {
        id: post.value.id,
        owner_id: post.value.owner_id || 0,
        creator_id: post.value.creator_id || 0,
        creator_sysmail: post.value.creator_sysmail || '',
        status: status,
        project_id: post.value.project_id || projectId.value || 0
    }
})

const projectDataForPermissions = computed(() => {
    if (!project.value) return { id: 0, owner_sysmail: '', status: 0 }
    return {
        id: project.value.id,
        owner_sysmail: project.value.owner_sysmail || '',
        owner_id: project.value.owner_id || 0,  // Deprecated fallback
        status: project.value.status || 0,
        team_size: project.value.team_size
    }
})

// Methods
async function loadPost() {
    const postId = route.params.id
    domaincode.value = route.params.domaincode as string

    console.log('[PostPage] Loading post:', { postId, domaincode: domaincode.value })

    try {
        // First, get project by domaincode to get project_id
        console.log('[PostPage] Fetching project:', `/api/projects/${domaincode.value}`)
        const projectRes = await fetch(`/api/projects/${domaincode.value}`)
        console.log('[PostPage] Project response:', { ok: projectRes.ok, status: projectRes.status })

        if (!projectRes.ok) throw new Error('Project not found')
        const projectData = await projectRes.json()
        console.log('[PostPage] Project data:', projectData)
        project.value = projectData
        projectId.value = projectData.id

        // Load post
        console.log('[PostPage] Fetching post:', `/api/posts/${postId}`)
        const response = await fetch(`/api/posts/${postId}`)
        console.log('[PostPage] Post response:', { ok: response.ok, status: response.status })

        if (!response.ok) throw new Error('Failed to load post')
        const data = await response.json()
        console.log('[PostPage] Post data:', data)
        post.value = data.post
        console.log('[PostPage] Post loaded successfully!')
    } catch (error) {
        console.error('[PostPage] Error loading post:', error)
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

// Status Editor Handlers
// Note: StatusEditor already saves to API via usePostStatus
// This handler just updates local state to keep UI in sync
function handleStatusChange(newStatus: number) {
    console.log('[PostPage] Status changed to:', newStatus, typeof newStatus)
    // Guard against invalid values
    if (typeof newStatus !== 'number') {
        console.error('[PostPage] Invalid status type:', typeof newStatus, newStatus)
        return
    }
    // Update local state (API was already called by StatusEditor)
    if (post.value) {
        post.value.status = newStatus
    }
}

async function handleTrash() {
    console.log('[PostPage] Trash requested')
    // Move to trash (status = 65536)
    await handleStatusChange(65536)
}

async function handleRestore() {
    console.log('[PostPage] Restore requested')
    // Restore from trash to draft (status = 64)
    await handleStatusChange(64)
}

function handleStatusError(error: string) {
    console.error('[PostPage] Status Editor error:', error)
    // TODO: Show error toast/notification
}

async function handleUpdateTags(family: string, value: number) {
    try {
        console.log(`[PostPage] Updating ${family} to ${value}`)

        const response = await fetch(`/api/posts/${post.value.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [family]: value })
        })

        if (!response.ok) {
            throw new Error(`Failed to update ${family}`)
        }

        // Update local state
        if (post.value) {
            post.value[family] = value
        }

        console.log(`[PostPage] Successfully updated ${family}`)
    } catch (error) {
        console.error(`[PostPage] Error updating ${family}:`, error)
        // Optionally show error toast/notification
    }
}

async function handleSavePost(data: Record<string, any>) {
    console.log('[PostPage] ========================================')
    console.log('[PostPage] handleSavePost CALLED')
    console.log('[PostPage] Call stack:', new Error().stack)
    console.log('[PostPage] Data received:', data)
    console.log('[PostPage] ========================================')

    try {
        console.log('[PostPage] Saving post with data:', data)

        // Render markdown to HTML using marked
        let html = ''
        if (data.md) {
            const { marked } = await import('marked')
            html = await marked(data.md) as string
        }

        // Prepare payload with proper field names and sanitize data
        const payload = {
            name: data.heading || '',
            teaser: data.teaser || '',
            md: data.md || '',
            html: html || '',
            img_id: (data.img_id === undefined || data.img_id === 0) ? null : data.img_id,
            header_type: data.header_type || 'banner',
            header_size: data.header_size || null,
            status: sanitizeStatusVal(data.status),
            // Include sysreg tags (sanitize to prevent NULL bytes)
            ttags: data.ttags || '\\x00',
            ctags: data.ctags || '\\x00',
            dtags: data.dtags || '\\x00'
        }

        console.log('[PostPage] Sending payload:', payload)
        console.log('[PostPage] POST URL:', `/api/demo/posts/${post.value.id}`)

        const response = await fetch(`/api/demo/posts/${post.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        console.log('[PostPage] Response status:', response.status)
        console.log('[PostPage] Response ok:', response.ok)

        if (!response.ok) {
            const errorText = await response.text()
            let errorData
            try {
                errorData = JSON.parse(errorText)
            } catch {
                errorData = errorText
            }
            console.error('[PostPage] Error response:', errorData)
            const errorMessage = errorData?.message || 'Failed to save post'
            throw new Error(errorMessage)
        }

        const result = await response.json()
        console.log('[PostPage] Save successful, result:', result)

        // Reload post
        await loadPost()
        closeEditPanel()
    } catch (error: any) {
        console.error('[PostPage] Error saving post:', error)
        const errorMessage = error?.message || 'Failed to save post'
        alert(`Failed to save post: ${errorMessage}`)
    }
}

onMounted(async () => {
    // Ensure auth session is loaded before loading post (fixes direct URL navigation)
    await checkSession()
    loadPost()
})
</script>

<style scoped>
.post-page {
    min-height: 100vh;
    background: var(--color-neutral-bg);
}

/* Post Meta Row: Status + Updated + Controls */
.post-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--headings);
}

.post-meta-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.post-updated {
    font-size: 0.875rem;
    color: var(--color-muted-contrast);
}

.post-meta-right {
    display: flex;
    gap: 0.5rem;
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
