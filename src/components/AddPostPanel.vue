<template>
    <div class="add-post-panel">
        <!-- Component Header -->
        <div class="panel-header">
            <div class="dropdown-wrapper" ref="dropdownRef">
                <button class="add-post-btn" @click="toggleDropdown" :disabled="!basePosts.length">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                        </path>
                    </svg>
                    <span>Add Post</span>
                </button>

                <div v-if="isDropdownOpen" class="posts-dropdown">
                    <div class="posts-dropdown-header">
                        <span>Basis-Beitrag wählen</span>
                    </div>

                    <button v-for="post in basePosts" :key="post.id" class="post-option" @click="selectBasePost(post)">
                        <img v-if="post.cimg" :src="post.cimg" :alt="post.name" class="post-option-image" />

                        <div class="post-option-label">
                            <HeadingParser :content="post.name" as="p" />
                        </div>

                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg" class="post-option-check">
                            <path
                                d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                            </path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Preview Card (disabled by default) -->
        <div v-if="selectedPost" class="preview-section">
            <div class="section-header">
                <div class="section-label">Vorschau</div>
                <button class="delete-btn" @click="handleClearSelection" title="Auswahl aufheben">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                        </path>
                    </svg>
                </button>
            </div>
            <pGallery entity="posts" :project="projectId" size="medium"
                :filter-ids="selectedPost ? [selectedPost.id] : []" item-type="card" :anatomy="'topimage'" />
        </div>

        <!-- Action Area (disabled by default) -->
        <div v-if="selectedPost" class="action-section">
            <div class="section-label">Anpassen</div>

            <div class="form-group">
                <label class="form-label">Creator</label>
                <select v-model="selectedOwner" class="form-select">
                    <option value="">Creator wählen</option>
                    <option v-for="user in projectUsers" :key="user.id" :value="user.id">
                        {{ user.username }}
                    </option>
                </select>
                <small v-if="projectUsersLoading" class="form-hint">Lade Projekt-Mitglieder...</small>
            </div>

            <div class="form-group">
                <label class="form-label">Titel</label>
                <input v-model="customName" type="text" class="form-input" placeholder="Post-Titel" />
            </div>

            <div class="form-group">
                <label class="form-label">Teaser</label>
                <textarea v-model="customTeaser" class="form-textarea" rows="3"
                    placeholder="Post-Beschreibung"></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <DropdownList entity="images" title="Select Cover Image" :project="projectId" size="small"
                    width="medium" :dataMode="true" :multiSelect="false" v-model:selectedIds="selectedImageId"
                    :displayXml="true" />
            </div>

            <TagFamilies v-model:ttags="ttags" v-model:ctags="ctags" :enable-edit="['ttags', 'ctags']" layout="row" />

            <div class="action-buttons">
                <button class="cancel-btn" @click="handleCancel" :disabled="isSubmitting">
                    Abbrechen
                </button>
                <button class="apply-btn" @click="handleApply" :disabled="!canApply || isSubmitting">
                    <span v-if="isSubmitting" class="btn-spinner"></span>
                    <span>{{ isSubmitting ? 'Wird erstellt...' : 'Hinzufügen' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import pGallery from '@/components/page/pGallery.vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import { DropdownList } from '@/components/clist'
import type { Post, Instructor, Partner } from '@/types'

interface ProjectUser {
    id: number
    username: string
    role?: string
}

const props = defineProps<{
    projectId: string
    basePosts: Post[]
    allInstructors?: Instructor[]  // Legacy support
    allPartners?: Partner[]  // New unified type
}>()

const emit = defineEmits<{
    postAdded: [postId: string]
}>()

const dropdownRef = ref<HTMLElement | null>(null)
const isDropdownOpen = ref(false)
const selectedPost = ref<Post | null>(null)
const selectedOwner = ref<number | ''>('')
const selectedImageId = ref<string[] | string | null>(null)
const ttags = ref(0)
const ctags = ref(0)
const customName = ref('')
const customTeaser = ref('')
const isSubmitting = ref(false)

/**
 * Generate a URL-safe slug from a title string
 * Used for xmlid format: {domaincode}.{entity}.{slug}
 * 
 * Convention reminder for events: {domaincode}.event_demo.{slug}
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // Replace German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Replace spaces and special characters with underscores
        .replace(/[\s\-]+/g, '_')
        // Remove any remaining non-alphanumeric characters except underscores
        .replace(/[^a-z0-9_]/g, '')
        // Remove consecutive underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_|_$/g, '')
        // Limit length to keep xmlid manageable
        .substring(0, 50)
}

// Project users state
const projectUsers = ref<ProjectUser[]>([])
const projectUsersLoading = ref(false)

// Fetch project users when component mounts or projectId changes
async function loadProjectUsers() {
    if (!props.projectId) return

    projectUsersLoading.value = true
    try {
        const response = await fetch(`/api/users?project_id=${props.projectId}`)
        if (!response.ok) {
            throw new Error(`Failed to load project users: ${response.statusText}`)
        }
        projectUsers.value = await response.json()
    } catch (err) {
        console.error('Error loading project users:', err)
        projectUsers.value = []
    } finally {
        projectUsersLoading.value = false
    }
}

// Watch for projectId changes
watch(() => props.projectId, () => {
    loadProjectUsers()
}, { immediate: true })

const previewPost = computed(() => {
    if (!selectedPost.value) return null

    return {
        ...selectedPost.value,
        name: customName.value || selectedPost.value.name,
        teaser: customTeaser.value || selectedPost.value.teaser,
        public_user: selectedOwner.value || selectedPost.value.public_user
    }
})

const canApply = computed(() => {
    return selectedPost.value && selectedOwner.value && customName.value
})

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value
}

const selectBasePost = (post: Post) => {
    selectedPost.value = post
    customName.value = post.name
    customTeaser.value = post.teaser || ''
    // Don't pre-select owner - let user choose
    selectedOwner.value = ''
    isDropdownOpen.value = false
}

const handleCancel = () => {
    selectedPost.value = null
    selectedOwner.value = ''
    customName.value = ''
    customTeaser.value = ''
    selectedImageId.value = null
    // Reset tags to initial state
    ttags.value = 0
    ctags.value = 0
}

// Clear selection (same as cancel but clearer intent for delete button)
const handleClearSelection = () => handleCancel()

const handleApply = async () => {
    if (!canApply.value || !selectedPost.value || isSubmitting.value) return

    isSubmitting.value = true
    try {
        // Build XML-ID with format: {domaincode}.{entity}.{slug}
        // domaincode: projectId (e.g., "theaterpedia")
        // entity: "post_demo" for demo posts
        // slug: Generated from the post title
        const templateXmlId = selectedPost.value.xmlid || `base_post.${selectedPost.value.id}`

        // Generate slug from title - convert to lowercase, replace spaces/special chars with underscores
        const titleSlug = generateSlug(customName.value || selectedPost.value.name || 'untitled')
        const newXmlId = `${props.projectId}.post_demo.${titleSlug}`

        // Construct the new post object with only valid table fields
        // Note: public_user references instructors table, so we don't set it here
        // owner_id is the user who owns/created the post (Migration 046)
        const newPost = {
            id: newXmlId,
            name: customName.value,
            subtitle: selectedPost.value.subtitle || null,
            teaser: customTeaser.value,
            img_id: Array.isArray(selectedImageId.value) ? selectedImageId.value[0] : selectedImageId.value,
            post_date: selectedPost.value.post_date || null,
            isbase: 0,
            project: props.projectId,
            template: templateXmlId,  // Use xmlid as template reference
            owner_id: selectedOwner.value,  // Record owner (Migration 046)
            ttags: ttags.value,
            ctags: ctags.value
            // public_user: references instructors, set separately if needed
        }

        // Call API to create the post
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPost)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`

            // Check for duplicate key constraint violation
            if (errorMsg.includes('duplicate key') || errorMsg.includes('posts_xmlid_key') || errorMsg.includes('23505')) {
                throw new Error('DUPLICATE_TEMPLATE')
            }
            throw new Error(errorMsg)
        }

        const createdPost = await response.json()

        // Show success message
        console.log('✅ Post created:', createdPost.id)

        // Emit the new post ID
        emit('postAdded', createdPost.id)

        // Reset the form
        handleCancel()
    } catch (error) {
        console.error('Error creating post:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'

        // Show specific message for duplicate template error
        if (errorMessage === 'DUPLICATE_TEMPLATE') {
            alert('Du hast versucht, dieselbe Vorlage ein zweites Mal anzuwenden, dies geht nicht (ggf. später einmal). Bitte clicke "Abbrechen" und versuche es erneut mit einer anderen Vorlage.')
        } else {
            alert(`Fehler beim Erstellen des Beitrags:\n${errorMessage}`)
        }
    } finally {
        isSubmitting.value = false
    }
}

// Click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isDropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.add-post-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
}

/* Panel Header */
.panel-header {
    display: flex;
    align-items: center;
}

.dropdown-wrapper {
    position: relative;
    width: 100%;
}

.add-post-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    justify-content: center;
}

.add-post-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.add-post-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.add-post-btn svg {
    width: 20px;
    height: 20px;
}

/* Posts Dropdown */
.posts-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
}

.posts-dropdown-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    color: var(--color-heading);
    background: var(--color-background-soft);
    position: sticky;
    top: 0;
    z-index: 1;
}

.post-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    width: 100%;
    border: none;
    background: none;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;
}

.post-option:hover {
    background: var(--color-background-soft);
}

.post-option-image {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
}

.post-option-label {
    flex: 1;
    font-size: 0.875rem;
}

.post-option-check {
    flex-shrink: 0;
    color: var(--color-primary, #3b82f6);
}

/* Preview Section */
.preview-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-label {
    font-weight: 600;
    color: var(--color-heading);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-muted-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-dimmed);
    transition: all 0.2s ease;
}

.delete-btn:hover {
    background: var(--color-negative-bg);
    border-color: var(--color-negative-contrast);
    color: var(--color-negative-contrast);
}

/* Action Section */
.action-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
}

.form-select,
.form-input,
.form-textarea {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-background);
    color: var(--color-text);
    transition: border-color 0.2s ease;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.form-textarea {
    resize: vertical;
    font-family: inherit;
}

.form-hint {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    margin-top: 0.25rem;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

.cancel-btn,
.apply-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-btn {
    background: var(--color-background-soft);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.cancel-btn:hover {
    background: var(--color-background-mute);
}

.apply-btn {
    background: var(--color-primary, #3b82f6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.apply-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
