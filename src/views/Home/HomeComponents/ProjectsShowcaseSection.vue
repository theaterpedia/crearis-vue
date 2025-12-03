<!--
  ProjectsShowcaseSection.vue - Showcase section for project pipeline
  
  Displays projects using pSlider with modal interactions.
  - All projects open in ItemModalCard
  - Status 68 (published): Shows "Open Website" button linking to /sites/:id
  - Status 19 (demo): Shows CornerBanner in modal
-->
<template>
    <Section background="accent">
        <Container>
            <Columns>
                <Column width="auto">
                    <Prose>
                        <Heading overline="Projekte starten und vernetzen" is="h2" headline="Websites in der Pipeline">
                        </Heading>
                        <p>Die Digitalisierung stellt die Demokratie auf die Probe. Viele Theaterpädagog:innen möchten
                            sich einsetzen für die Sache eine nachhaltige Gesellschaftsform im 21. Jahrhundert. Es
                            braucht dafür ein offenes Internet. Wenn Theaterpädagogik sich einbringen möchte dann
                            braucht dies einen souveränen Webauftritt. Dies ist das Kernanliegen von Theaterpedia. Eine
                            transparente und wirksame Vernetzung soll entstehen - einzig und allein entlang der
                            inhaltlichen Linien. </p>

                    </Prose>
                    <button style="background-color: var(--color-secondary-bg)" data-fpostlink data-hlogic="default">
                        Start des Showcase: ab 27. NOV 2025
                    </button>
                </Column>
                <Column width="1/2">
                    <pSlider entity="projects" :filter-ids="filteredProjectIds" size="large" shape="wide"
                        anatomy="heroimage" on-activate="modal" :modal-options="modalOptions"
                        @item-click="handleProjectClick" />
                </Column>
            </Columns>
        </Container>
    </Section>

    <!-- Custom modal for projects with status-specific features -->
    <ItemModalCard v-if="showModal && selectedProject" :is-open="showModal" :heading="selectedProject?.heading || ''"
        :teaser="selectedProject?.teaser" :data="parseProjectImageData(selectedProject)" shape="wide"
        anatomy="heroimage"
        :entity="{ xmlid: selectedProject?.xmlid, status_id: selectedProject?.status_id, table: 'projects' }"
        @close="closeModal">
        <!-- Corner banner for demo projects (status 8 from Migration 040) -->
        <template #corner-banner>
            <CornerBanner v-if="selectedProject?.status_id === 8" size="medium" />
        </template>

        <!-- Project info -->
        <div class="project-info-row">
            <div class="info-item">
                <span class="info-label">Type:</span>
                <span class="info-value">{{ selectedProject?.type || 'Website' }}</span>
            </div>
            <div v-if="projectOwner" class="info-item">
                <span class="info-label">Owner:</span>
                <span class="info-value">{{ projectOwner }}</span>
            </div>
            <div v-if="selectedProject?.status_id" class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">{{ getStatusLabel(selectedProject.status_id) }}</span>
            </div>
        </div>

        <!-- Footer with action button for released projects (status 4096 from Migration 040) -->
        <template #footer>
            <button v-if="selectedProject?.status_id === 4096" @click="navigateToSite" class="website-button">
                Open Website →
            </button>
        </template>
    </ItemModalCard>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus } from '@/composables/useStatus'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import CornerBanner from '@/components/CornerBanner.vue'
import pSlider from '@/components/page/pSlider.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('ProjectsShowcaseSection')

const router = useRouter()
const { getStatusIdByName } = useStatus()

const projects = ref<any[]>([])
const showModal = ref(false)
const selectedProject = ref<any>(null)
const projectOwner = ref<string>('')

// Modal options for pSlider
const modalOptions = {
    anatomy: 'heroimage'
}

// Computed filtered project IDs for pSlider
const filteredProjectIds = computed(() => {
    return projects.value.map(p => p.id)
})

// Fetch projects (filtered to show pipeline projects)
async function fetchProjects() {
    try {
        // Add timestamp to prevent caching
        const response = await fetch(`/api/projects?_t=${Date.now()}`)
        if (response.ok) {
            const data = await response.json()
            const projectsArray = data.projects || data

            // Get status IDs for projects
            const draftStatusId = getStatusIdByName('draft', 'projects')
            const publishStatusId = getStatusIdByName('publish', 'projects')

            // Status values from Migration 040:
            // demo = 8, draft = 64, released = 4096
            const STATUS_DEMO = 8
            const STATUS_DRAFT = 64
            const STATUS_RELEASED = 4096

            // Filter projects: show draft, demo, and released projects
            const filteredProjects = projectsArray.filter((p: any) => {
                // Show if draft or publish status (from useStatus)
                if (p.status_id === draftStatusId || p.status_id === publishStatusId) {
                    return true
                }
                // Also show specific status_id values (fallback to Migration 040 values)
                if (p.status_id === STATUS_DRAFT || p.status_id === STATUS_DEMO || p.status_id === STATUS_RELEASED) {
                    return true
                }
                return false
            })

            projects.value = filteredProjects.slice(0, 8)
            debug.log('Filtered projects:', projects.value.length)
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
    }
}

// Handle project click from pSlider
function handleProjectClick(project: any) {
    debug.log('Project clicked:', project)
    selectedProject.value = project
    showModal.value = true

    // Fetch owner info
    if (project.owner_id) {
        fetchOwnerInfo(project.owner_id)
    } else {
        projectOwner.value = ''
    }
}

// Close modal
function closeModal() {
    showModal.value = false
    selectedProject.value = null
    projectOwner.value = ''
}

// Navigate to site for published projects (status 68)
function navigateToSite() {
    if (selectedProject.value?.id) {
        router.push(`/sites/${selectedProject.value.id}`)
        closeModal()
    }
}

// Fetch owner info from users endpoint
async function fetchOwnerInfo(ownerId: number) {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const users = await response.json()
            const owner = users.find((u: any) => u.id === ownerId)
            if (owner) {
                projectOwner.value = owner.username || owner.instructor_id || `User ${ownerId}`
            } else {
                projectOwner.value = `User ${ownerId}`
            }
        }
    } catch (error) {
        console.error('Failed to fetch owner info:', error)
        projectOwner.value = ''
    }
}

// Get status label for display
function getStatusLabel(statusId: number): string {
    const statusMap: Record<number, string> = {
        67: 'Draft',
        19: 'Demo',
        68: 'Published'
    }
    return statusMap[statusId] || `Status ${statusId}`
}

// Parse image data from img_square/img_wide fields
function parseProjectImageData(project: any): ImgShapeData | undefined {
    if (!project) {
        debug.log('parseProjectImageData: No project')
        return undefined
    }

    debug.log('parseProjectImageData called with:', {
        project,
        img_square: project.img_square,
        img_wide: project.img_wide
    })

    // Try to get image data from img_square or img_wide fields
    const imgField = project.img_square || project.img_wide
    if (!imgField) {
        debug.log('parseProjectImageData: No img field found')
        return undefined
    }

    try {
        const parsed = typeof imgField === 'string' ? JSON.parse(imgField) : imgField
        debug.log('Parsed image data:', parsed)

        const result = {
            type: 'url' as const,
            url: parsed.url || '',
            x: parsed.x ?? null,
            y: parsed.y ?? null,
            z: parsed.z ?? null,
            options: parsed.options ?? null,
            blur: parsed.blur,
            turl: parsed.turl,
            tpar: parsed.tpar,
            xmlid: project.xmlid,
            alt_text: parsed.alt_text
        }

        debug.log('Returning image data:', result)
        return result
    } catch (e) {
        debug.error('Failed to parse image data:', e)
        return undefined
    }
}

// Refresh projects when component becomes visible (page refocus)
let cleanupVisibility: (() => void) | null = null

function setupVisibilityRefresh() {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            fetchProjects()
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Return cleanup function
    cleanupVisibility = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
}

onMounted(async () => {
    await fetchProjects()

    // Set up auto-refresh on page visibility change
    setupVisibilityRefresh()
})

// Note: Vue 3 composition API uses onBeforeUnmount, but since we're storing
// the cleanup function, we can call it when needed or let it clean up naturally
</script>

<style scoped>
/* Project info row styling */
.project-info-row {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    background: var(--color-card-bg);
    border-top: 1px solid var(--color-border);
    font-size: 0.875rem;
    flex-wrap: wrap;
}

.info-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.info-label {
    font-weight: 600;
    color: var(--color-text-muted);
}

.info-value {
    color: var(--color-text);
}

/* Website button styling */
.website-button {
    width: 100%;
    padding: 1rem 1.5rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-text);
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.website-button:hover {
    background: var(--color-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.website-button:active {
    transform: translateY(0);
}
</style>
