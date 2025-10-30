<template>
    <div class="home-page">
        <AlertBanner alert-type="primary">
            <p><strong>Welcome to Theaterpedia!</strong> Explore theater projects, events, and community resources.</p>
        </AlertBanner>

        <Navbar :user="user" :use-default-routes="false" @logout="handleLogout">
            <template #menus v-if="user && user.activeRole === 'admin'">
                <AdminMenu />
            </template>
        </Navbar>

        <Box layout="full-width">
            <Main>
                <!-- Hero Section -->
                <Hero height-tmp="prominent"
                    img-tmp="https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg"
                    img-tmp-align-x="cover" img-tmp-align-y="cover"
                    :overlay="`linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))`" content-width="short"
                    content-align-y="center">
                    <Banner transparent>
                        <Prose>
                            <h1><strong>Theater Community Platform</strong></h1>
                            <p>Connecting artists, projects, and audiences in the world of theater.</p>
                            <div class="cta-group">
                                <Button size="medium" variant="primary" @click="$router.push('/getstarted')">
                                    Register for Conference
                                </Button>
                                <a v-if="!user" href="/login" class="cta-secondary">Sign In</a>
                                <a v-else href="/tasks" class="cta-secondary">Go to Dashboard</a>
                            </div>
                        </Prose>
                    </Banner>
                </Hero>

                <!-- Upcoming Events Section -->
                <Section background="muted">
                    <Container>
                        <Prose>
                            <Heading overline="What's Happening" level="h2">Upcoming **Events**</Heading>
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
                            <p><em>No upcoming events.</em></p>
                        </Prose>
                    </Container>
                </Section>

                <!-- Projects Showcase Section -->
                <Section background="default">
                    <Container>
                        <Prose>
                            <Heading overline="Pipeline" level="h2">New **Projects** in the Pipeline</Heading>
                        </Prose>

                        <Columns gap="small" align="top" wrap v-if="projects.length > 0">
                            <Column v-for="project in projects.slice(0, 4)" :key="project.id" width="1/4">
                                <a :href="`/sites/${project.id}`"
                                    style="text-decoration: none; color: inherit; display: block;">
                                    <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                                        style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                                    <Prose>
                                        <h4>{{ project.heading || project.id }}</h4>
                                        <p v-if="project.status_id"><strong>Status:</strong> {{
                                            getStatusDisplayName(project.status_id, 'projects', 'de') }}</p>
                                    </Prose>
                                </a>
                            </Column>
                        </Columns>
                        <Prose v-else>
                            <p><em>No projects in the pipeline.</em></p>
                        </Prose>
                    </Container>
                </Section>

                <!-- Blog Posts Gallery with CardHero -->
                <Section background="accent">
                    <Container>
                        <Prose>
                            <Heading overline="Recent Articles" level="h2">Latest from Our **Blog**</Heading>
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
                            <p><em>No blog posts available yet.</em></p>
                        </Prose>
                    </Container>
                </Section>

                <!-- Community Members Section -->
                <Section background="default">
                    <Container>
                        <Prose>
                            <Heading overline="Join Us" level="h2">Community **Members**</Heading>
                        </Prose>

                        <Slider v-if="users.length > 0">
                            <Slide v-for="userItem in users" :key="userItem.id">
                                <img v-if="userItem.cimg" :src="userItem.cimg" :alt="userItem.username"
                                    style="width: 100%; height: 200px; object-fit: cover; margin-bottom: 1rem; border-radius: 50%;" />
                                <Prose>
                                    <h4>{{ userItem.username }}</h4>
                                    <p><strong>Role:</strong> {{ userItem.role }}</p>
                                    <p v-if="userItem.created_at"><em>Member since {{ formatDate(userItem.created_at)
                                            }}</em>
                                    </p>
                                </Prose>
                            </Slide>
                        </Slider>
                        <Prose v-else>
                            <p><em>No members to display.</em></p>
                        </Prose>
                    </Container>
                </Section>
            </Main>
        </Box>

        <!-- New Home Site Footer -->
        <HomeSiteFooter />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus } from '@/composables/useStatus'
import { homeRoutes } from '@/config/homeroutes'
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
import HomeSiteFooter from '@/components/homeSiteFooter.vue'

const router = useRouter()
const { getStatusIdByName, getStatusDisplayName, initializeCache } = useStatus()

// State
const user = ref<any>(null)
const posts = ref<any[]>([])
const events = ref<any[]>([])
const projects = ref<any[]>([])
const users = ref<any[]>([])

// SEO: Set meta tags for home page
function setMetaTags() {
    const meta = homeRoutes.home;
    if (!meta) return;

    // Set title
    document.title = meta.title;

    // Helper to set or update meta tag
    const setMeta = (selector: string, attributes: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            const tagMatch = selector.match(/^(\w+)\[/);
            const tag = tagMatch && tagMatch[1] ? tagMatch[1] : 'meta';
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            element!.setAttribute(key, value);
        });
    };

    // Basic meta tags
    setMeta('meta[name="description"]', { name: 'description', content: meta.description });
    if (meta.keywords) {
        setMeta('meta[name="keywords"]', { name: 'keywords', content: meta.keywords });
    }

    // Open Graph tags
    setMeta('meta[property="og:title"]', { property: 'og:title', content: meta.ogTitle || meta.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: meta.ogDescription || meta.description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    if (meta.ogImage) {
        setMeta('meta[property="og:image"]', { property: 'og:image', content: meta.ogImage });
    }

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: meta.twitterCard || 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.ogTitle || meta.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.ogDescription || meta.description });
    if (meta.ogImage) {
        setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: meta.ogImage });
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

// Fetch posts
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts')
        if (response.ok) {
            const data = await response.json()
            posts.value = data.slice(0, 5) // Limit to 5 posts
        }
    } catch (error) {
        console.error('Failed to fetch posts:', error)
    }
}

// Fetch events
async function fetchEvents() {
    try {
        const response = await fetch('/api/events')
        if (response.ok) {
            const data = await response.json()
            events.value = data.slice(0, 6) // Limit to 6 events
        }
    } catch (error) {
        console.error('Failed to fetch events:', error)
    }
}

// Fetch projects
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            // API returns { projects: [...], count: ... }
            const projectsArray = data.projects || data

            // Get status IDs for 'draft' and 'demo' for projects table
            const draftStatusId = getStatusIdByName('draft', 'projects')
            const demoStatusId = getStatusIdByName('demo', 'projects')

            // Filter projects with status_id matching 'draft' or 'demo'
            const filteredProjects = projectsArray.filter((p: any) => p.status_id === draftStatusId || p.status_id === demoStatusId)
            projects.value = filteredProjects.slice(0, 8) // Limit to 8 projects
        }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
    }
}

// Fetch users
async function fetchUsers() {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const data = await response.json()
            // Filter out admin and base users for public display
            users.value = data.filter((u: any) => !['admin', 'base'].includes(u.username)).slice(0, 10)
        }
    } catch (error) {
        console.error('Failed to fetch users:', error)
    }
}

// Format date
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch {
        return dateString
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' })
        user.value = null
        router.push('/login')
    } catch (error) {
        console.error('Logout failed:', error)
    }
}

// Initialize
onMounted(async () => {
    setMetaTags()
    await checkAuth()
    await Promise.all([
        fetchPosts(),
        fetchEvents(),
        fetchProjects(),
        fetchUsers()
    ])
})
</script>

<style scoped>
.home-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

/* Override some default spacing for landing page */
.home-page :deep(.section) {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
}

.home-page :deep(.hero) {
    margin-bottom: 0;
}

/* Hero text styling */
.home-page :deep(.hero .prose h1) {
    font-size: 3rem;
    line-height: 1.2;
    margin-bottom: 1rem;
}

.home-page :deep(.hero .prose p) {
    font-size: 1.25rem;
    margin-bottom: 2rem;
}

/* CTA Group */
.home-page :deep(.cta-group) {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
}

.home-page :deep(.cta-secondary) {
    color: var(--color-primary-contrast);
    text-decoration: underline;
    font-size: 1.125rem;
    transition: opacity 0.3s;
}

.home-page :deep(.cta-secondary:hover) {
    opacity: 0.8;
}

@media (max-width: 767px) {
    .home-page :deep(.hero .prose h1) {
        font-size: 2rem;
    }

    .home-page :deep(.hero .prose p) {
        font-size: 1rem;
    }

    .home-page :deep(.cta-group) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .home-page :deep(.section) {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
}
</style>
