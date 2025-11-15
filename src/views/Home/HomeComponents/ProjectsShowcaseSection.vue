<template>
    <Section background="default">
        <CornerBanner size="large" />
        <Container>
            <Prose>
                <Heading overline="Showcase für entstehende Projekte" level="h2"
                    headline="Ca. 10 Websites in der Pipeline">New **Projects** in
                    the Pipeline</Heading>
            </Prose>

            <Columns gap="small" align="top" wrap>
                <Column v-for="project in projects.slice(0, 4)" :key="project.id" width="1/4">
                    <!-- Status 68: Link to site -->
                    <a v-if="project.status_id === 68" :href="`/sites/${project.id}`"
                        style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p><strong>Status:</strong> veröffentlicht</p>
                        </Prose>
                    </a>

                    <!-- Status 19: Show roadworks alert -->
                    <div v-else-if="project.status_id === 19" @click="showRoadworksAlert"
                        style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p><strong>Status:</strong> Demo</p>
                        </Prose>
                    </div>

                    <!-- Status 67: Open modal -->
                    <div v-else-if="project.status_id === 67" @click="openProjectModal(project)"
                        style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p><strong>Status:</strong> Entwurf</p>
                        </Prose>
                    </div>

                    <!-- Fallback: Default link -->
                    <a v-else :href="`/sites/${project.id}`"
                        style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p v-if="project.status_id"><strong>Status:</strong> {{ project.status_id }}</p>
                        </Prose>
                    </a>
                </Column>
            </Columns>
        </Container>

        <!-- Modal for draft projects (status 67) -->
        <ItemModalCard v-if="showModal && selectedProject" :is-open="showModal"
            :heading="selectedProject?.heading || ''" :teaser="selectedProject?.teaser"
            :data="parseProjectImageData(selectedProject)" shape="wide" anatomy="heroimage"
            :entity="{ xmlid: selectedProject?.xmlid, status_id: selectedProject?.status_id, table: 'projects' }"
            @close="closeModal">
            <div class="project-info-row">
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{{ selectedProject?.type || 'Website' }}</span>
                </div>
                <div v-if="projectOwner" class="info-item">
                    <span class="info-label">Owner:</span>
                    <span class="info-value">{{ projectOwner }}</span>
                </div>
            </div>
        </ItemModalCard>

        <!-- Roadworks alert modal for demo projects (status 19) -->
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="showRoadworks" class="modal-overlay" @click.self="closeRoadworks">
                    <div class="roadworks-modal">
                        <button class="modal-close-btn" @click="closeRoadworks" aria-label="Close">×</button>
                        <div class="roadworks-content">
                            <img src="https://cdn-icons-png.flaticon.com/512/1047/1047711.png" alt="Roadworks"
                                class="roadworks-image" />
                            <h3>🚧 Demo-Phase</h3>
                            <p>Dieses Projekt ist noch in der Demo-Phase und kann noch nicht öffentlich eingesehen
                                werden.
                            </p>
                            <p>Wenn du Vorschläge oder Anfragen hast, dann melde dich bei <strong><a
                                        href="mailto:info@theaterpedia.org"
                                        style="color: var(--color-accent-bg);">info@theaterpedia.org</a></strong></p>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </Section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStatus } from '@/composables/useStatus'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import CornerBanner from '@/components/CornerBanner.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import type { ImgShapeData } from '@/components/images/ImgShape.vue'

const { getStatusIdByName } = useStatus()
const projects = ref<any[]>([])
const showModal = ref(false)
const selectedProject = ref<any>(null)
const showRoadworks = ref(false)
const projectOwner = ref<string>('')

// Fetch projects (filtered)
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            const projectsArray = data.projects || data

            // Get status IDs for projects (draft, publish, released)
            const draftStatusId = getStatusIdByName('draft', 'projects')
            const publishStatusId = getStatusIdByName('publish', 'projects')

            // Filter projects: show draft and published projects (not released yet)
            const filteredProjects = projectsArray.filter((p: any) => {
                // Show if draft or publish status
                if (p.status_id === draftStatusId || p.status_id === publishStatusId) {
                    return true
                }
                // Also show if status_id is explicitly 2 or 3 (fallback if status names not found)
                if (p.status_id === 2 || p.status_id === 3) {
                    return true
                }
                return false
            })
            projects.value = filteredProjects.slice(0, 8)
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
    }
}

// Show roadworks alert for demo projects (status 19)
function showRoadworksAlert() {
    showRoadworks.value = true
}

// Close roadworks modal
function closeRoadworks() {
    showRoadworks.value = false
}

// Open modal for draft projects (status 67)
async function openProjectModal(project: any) {
    console.log('Opening modal for project:', project)
    selectedProject.value = project
    showModal.value = true

    // Fetch owner info
    if (project.owner_id) {
        await fetchOwnerInfo(project.owner_id)
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

// Parse image data from img_id field (similar to pListSimple)
function parseProjectImageData(project: any): ImgShapeData | undefined {
    if (!project) {
        console.log('parseProjectImageData: No project')
        return undefined
    }

    console.log('parseProjectImageData called with:', {
        project,
        img_square: project.img_square,
        img_wide: project.img_wide,
        cimg: project.cimg
    })

    // Try to get image data from img_square or img_wide fields
    const imgField = project.img_square || project.img_wide
    if (!imgField) {
        console.log('parseProjectImageData: No img field found')
        return undefined
    }

    try {
        const parsed = typeof imgField === 'string' ? JSON.parse(imgField) : imgField
        console.log('Parsed image data:', parsed)

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

        console.log('Returning image data:', result)
        return result
    } catch (e) {
        console.error('Failed to parse image data:', e)
        return undefined
    }
}

onMounted(async () => {
    await fetchProjects()
})
</script>

<style scoped>
/* Roadworks modal styling */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 2rem;
}

.roadworks-modal {
    position: relative;
    max-width: 32rem;
    width: 100%;
    background: var(--color-card-bg);
    border-radius: 0.75rem;
    padding: 2rem;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.modal-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(0, 0, 0, 0.1);
    color: var(--color-text);
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.modal-close-btn:hover {
    background: rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
}

.roadworks-content {
    text-align: center;
}

.roadworks-image {
    width: 120px;
    height: 120px;
    margin: 0 auto 1.5rem;
    opacity: 0.8;
}

.roadworks-content h3 {
    font-size: 1.5rem;
    margin: 0 0 1rem;
    color: var(--color-text);
}

.roadworks-content p {
    margin: 0.75rem 0;
    line-height: 1.6;
    color: var(--color-text);
}

.roadworks-content a {
    text-decoration: none;
}

.roadworks-content a:hover {
    text-decoration: underline;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .roadworks-modal,
.modal-leave-active .roadworks-modal {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .roadworks-modal,
.modal-leave-to .roadworks-modal {
    transform: scale(0.9);
    opacity: 0;
}

/* Project info row styling */
.project-info-row {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    background: var(--color-card-bg);
    border-top: 1px solid var(--color-border);
    font-size: 0.875rem;
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
</style>
