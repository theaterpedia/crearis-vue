<template>
    <div class="project-site-page">
        <AlertBanner v-if="project" alert-type="primary">
            <p><strong>{{ project.heading || project.id }}</strong> - {{ project.status }}</p>
        </AlertBanner>
        <AlertBanner v-else alert-type="warning">
            <p><strong>Project not found</strong></p>
        </AlertBanner>

        <Navbar :user="user" :use-default-routes="false" @logout="handleLogout">
            <template #menus v-if="user && user.activeRole === 'admin'">
                <AdminMenu />
            </template>
        </Navbar>

        <Box layout="full-width" v-if="project">
            <Main>
                <!-- Hero Section for Project -->
                <Hero height-tmp="prominent"
                    :img-tmp="project.cimg || 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg'"
                    img-tmp-align-x="cover" img-tmp-align-y="cover"
                    :overlay="`linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))`" content-width="short"
                    content-align-y="center">
                    <Banner transparent>
                        <Prose>
                            <h1><strong>{{ project.heading || project.id }}</strong></h1>
                            <p v-if="project.md">{{ project.md }}</p>
                            <p v-else>Explore events, posts, and team members for this project.</p>
                            <div class="cta-group">
                                <Button size="medium" variant="primary" @click="$router.push('/getstarted')">
                                    Get Involved
                                </Button>
                                <a href="/" class="cta-secondary">Back to Home</a>
                            </div>
                        </Prose>
                    </Banner>
                </Hero>

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

                <!-- Projects Showcase Section (same as homepage) -->
                <Section background="default">
                    <Container>
                        <Prose>
                            <Heading overline="Pipeline" level="h2">New **Projects** in the Pipeline</Heading>
                        </Prose>

                        <Columns gap="small" align="top" wrap v-if="projects.length > 0">
                            <Column v-for="proj in projects.slice(0, 4)" :key="proj.id" width="1/4">
                                <a :href="`/sites/${proj.id}`"
                                    style="text-decoration: none; color: inherit; display: block;">
                                    <img v-if="proj.cimg" :src="proj.cimg" :alt="proj.heading || proj.id"
                                        style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                                    <Prose>
                                        <h4>{{ proj.heading || proj.id }}</h4>
                                        <p v-if="proj.status"><strong>Status:</strong> {{ proj.status }}</p>
                                    </Prose>
                                </a>
                            </Column>
                        </Columns>
                        <Prose v-else>
                            <p><em>No projects in the pipeline.</em></p>
                        </Prose>
                    </Container>
                </Section>

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
                                    <img v-if="teamUser.cimg" :src="teamUser.cimg"
                                        :alt="teamUser.username || teamUser.id"
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
            </Main>
        </Box>

        <!-- Footer -->
        <Footer>
            <div>
                <Prose>
                    <h3>Theaterpedia</h3>
                    <p>Connecting theater communities worldwide.</p>
                </Prose>
            </div>
            <div>
                <Prose>
                    <h4>Quick Links</h4>
                </Prose>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="/">Home</a></li>
                    <li><a href="/getstarted">Get Started</a></li>
                    <li v-if="user"><a href="/tasks">Dashboard</a></li>
                    <li v-else><a href="/login">Sign In</a></li>
                </ul>
            </div>
            <div>
                <Prose>
                    <p>&copy; 2025 Theaterpedia. All rights reserved.</p>
                </Prose>
            </div>
        </Footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AlertBanner from '@/components/AlertBanner.vue'
import Navbar from '@/components/Navbar.vue'
import AdminMenu from '@/components/AdminMenu.vue'
import Box from '@/components/Box.vue'
import Main from '@/components/Main.vue'
import Hero from '@/components/Hero.vue'
import Banner from '@/components/Banner.vue'
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
import Footer from '@/components/Footer.vue'

const router = useRouter()
const route = useRoute()

// State
const user = ref<any>(null)
const project = ref<any>(null)
const posts = ref<any[]>([])
const events = ref<any[]>([])
const projects = ref<any[]>([]) // All projects (same as homepage)
const users = ref<any[]>([])
const domaincode = ref<string>('')

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

// Fetch all projects (same as homepage - draft/demo status)
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            // Filter projects with status 'draft' or 'demo'
            const filteredProjects = data.filter((p: any) => p.status === 'draft' || p.status === 'demo')
            projects.value = filteredProjects.slice(0, 8)
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
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

    await fetchProjects() // Same as homepage
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
