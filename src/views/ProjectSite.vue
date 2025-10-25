<template>
    <div class="project-site-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Project'}`"
            subtitle="Update project information and content" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- PageLayout wrapper with PageHeading in header slot -->
        <PageLayout v-if="project">
            <template #header>
                <PageHeading :heading="project.heading || project.id"
                    :teaserText="project.teaser || project.md || 'Explore events, posts, and team members for this project.'"
                    :imgTmp="project.cimg || 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg'"
                    :headerType="project.header_type || 'banner'" :headerSize="project.header_size || 'prominent'"
                    :cta="{ title: 'Get Involved', link: '/getstarted' }"
                    :link="{ title: 'Back to Home', link: '/' }" />
            </template>

            <!-- Project Events Section -->
            <Section background="muted">
                <Container>
                    <Prose>
                        <Heading overline="Project Events" level="h2">Upcoming **Events**</Heading>
                    </Prose>

                    <Slider v-if="events.length > 0">
                        <Slide v-for="event in events" :key="event.id">
                            <img v-if="event.cimg" :src="event.cimg" :alt="event.heading || event.id"
                                style="width: 100%; height: 200px; object-fit: cover; margin-bottom: 1rem;" />
                            <Prose>
                                <h3>{{ event.heading || event.id }}</h3>
                                <p v-if="event.date"><strong>Date:</strong> {{ formatDate(event.date) }}</p>
                                <p v-if="event.location">{{ event.location }}</p>
                                <p v-if="event.md">{{ event.md.substring(0, 100) }}...</p>
                            </Prose>
                        </Slide>
                    </Slider>
                    <Prose v-else>
                        <p><em>No events for this project yet.</em></p>
                    </Prose>
                </Container>
            </Section>

            <!-- Regio Content Demo Section (only shown if project has regio) -->
            <RegioContentDemo v-if="project && project.regio" :regio="project.regio" />

            <!-- Blog Posts Gallery for Project -->
            <Section background="accent">
                <Container>
                    <Prose>
                        <Heading overline="Project Updates" level="h2">Latest **Posts**</Heading>
                    </Prose>

                    <Columns gap="medium" align="top" wrap v-if="posts.length > 0">
                        <Column v-for="post in posts.slice(0, 6)" :key="post.id" width="1/3">
                            <CardHero height-tmp="medium" :img-tmp="post.cimg || ''" content-align-y="bottom"
                                content-type="text">
                                <Prose>
                                    <h3>{{ post.heading || post.id }}</h3>
                                    <p v-if="post.md">{{ post.md.substring(0, 100) }}...</p>
                                    <p v-else><em>No content available</em></p>
                                </Prose>
                            </CardHero>
                        </Column>
                    </Columns>
                    <Prose v-else>
                        <p><em>No posts for this project yet.</em></p>
                    </Prose>
                </Container>
            </Section>

            <!-- Team Members Section -->
            <Section background="muted">
                <Container>
                    <Prose>
                        <Heading overline="Meet the Team" level="h2">Our **People**</Heading>
                    </Prose>

                    <Slider v-if="users.length > 0">
                        <Slide v-for="teamUser in users" :key="teamUser.id">
                            <div style="text-align: center;">
                                <img v-if="teamUser.cimg" :src="teamUser.cimg" :alt="teamUser.username || teamUser.id"
                                    style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem;" />
                                <div v-else
                                    style="width: 120px; height: 120px; border-radius: 50%; background: #ddd; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #666;">
                                    {{ (teamUser.username || teamUser.id).charAt(0).toUpperCase() }}
                                </div>
                                <Prose>
                                    <h4>{{ teamUser.username || teamUser.id }}</h4>
                                    <p v-if="teamUser.role"><em>{{ teamUser.role }}</em></p>
                                    <p v-if="teamUser.email">{{ teamUser.email }}</p>
                                </Prose>
                            </div>
                        </Slide>
                    </Slider>
                    <Prose v-else>
                        <p><em>No team members listed yet.</em></p>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>

        <!-- Fallback for when project is not loaded -->
        <PageLayout v-else>
            <template #header>
                <Section>
                    <Container>
                        <Prose>
                            <h1>Project Not Found</h1>
                            <p>The requested project could not be loaded.</p>
                        </Prose>
                    </Container>
                </Section>
            </template>
            <Section>
                <Container>
                    <Prose>
                        <p><a href="/">Return to Home</a></p>
                    </Prose>
                </Container>
            </Section>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import PageHeading from '@/components/PageHeading.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Button from '@/components/Button.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Slider from '@/components/Slider.vue'
import Slide from '@/components/Slide.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import CardHero from '@/components/CardHero.vue'
import RegioContentDemo from '@/components/RegioContentDemo.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'

const router = useRouter()
const route = useRoute()

// State
const user = ref<any>(null)
const project = ref<any>(null)
const posts = ref<any[]>([])
const events = ref<any[]>([])
const users = ref<any[]>([])
const domaincode = ref<string>('')
const isEditPanelOpen = ref(false)

// Edit panel data computed from project
const editPanelData = computed<EditPanelData>(() => {
    if (!project.value) {
        return {
            heading: '',
            teaser: '',
            cimg: '',
            header_type: '',
            header_size: '',
            md: ''
        }
    }
    return {
        heading: project.value.heading || '',
        teaser: project.value.teaser || '',
        cimg: project.value.cimg || '',
        header_type: project.value.header_type || '',
        header_size: project.value.header_size || '',
        md: project.value.md || ''
    }
})

// Open edit panel
function openEditPanel() {
    isEditPanelOpen.value = true
}

// Close edit panel
function closeEditPanel() {
    isEditPanelOpen.value = false
}

// Handle save project
async function handleSaveProject(data: EditPanelData) {
    if (!project.value) return

    try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.value.id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const updatedProject = await response.json()
            project.value = updatedProject
            closeEditPanel()
            // Optional: Show success message
            console.log('Project updated successfully')
        } else {
            console.error('Failed to update project')
            // Optional: Show error message
        }
    } catch (error) {
        console.error('Error saving project:', error)
        // Optional: Show error message
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated) {
            user.value = data.user
        }
    } catch (error) {
        console.error('Auth check failed:', error)
    }
}

// Fetch the specific project
async function fetchProject(id: string) {
    try {
        const response = await fetch(`/api/projects/${encodeURIComponent(id)}`)
        if (response.ok) {
            project.value = await response.json()
        } else {
            console.error('Project not found')
        }
    } catch (error) {
        console.error('Failed to fetch project:', error)
    }
}

// Fetch posts filtered by project
async function fetchPosts(projectId: string) {
    try {
        const response = await fetch(`/api/posts?project=${encodeURIComponent(projectId)}`)
        if (response.ok) {
            const data = await response.json()
            posts.value = data.slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch posts:', error)
    }
}

// Fetch events filtered by project
async function fetchEvents(projectId: string) {
    try {
        const response = await fetch(`/api/events?project=${encodeURIComponent(projectId)}`)
        if (response.ok) {
            const data = await response.json()
            events.value = data.slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch events:', error)
    }
}

// Fetch users filtered by project (members)
async function fetchUsers(projectId: string) {
    try {
        const response = await fetch(`/api/users?project_id=${encodeURIComponent(projectId)}`)
        if (response.ok) {
            const data = await response.json()
            users.value = data.filter((u: any) => u.role !== 'admin' && u.id !== 'base@theaterpedia.org')
        }
    } catch (error) {
        console.error('Failed to fetch users:', error)
    }
}

// Handle logout
function handleLogout() {
    user.value = null
    router.push('/login')
}

// Date formatting
function formatDate(date: string | null) {
    if (!date) return 'TBD'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(async () => {
    domaincode.value = route.params.domaincode as string

    await checkAuth()

    if (domaincode.value) {
        await fetchProject(domaincode.value)
        await fetchEvents(domaincode.value)
        await fetchPosts(domaincode.value)
        await fetchUsers(domaincode.value)
    }
})
</script>

<style scoped>
.project-site-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.cta-group {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    margin-top: 1.5rem;
}

.cta-secondary {
    color: white;
    text-decoration: underline;
    font-weight: 500;
    transition: opacity 0.2s;
}

.cta-secondary:hover {
    opacity: 0.8;
}

@media (max-width: 768px) {
    .cta-group {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
