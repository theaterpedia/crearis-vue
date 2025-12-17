<template>
    <div class="project-site-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Project'}`"
            subtitle="Update project information and content" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- Navigation Config Panel -->
        <NavigationConfigPanel v-if="project" :is-open="isConfigPanelOpen" :project-id="project.domaincode"
            @close="closeConfigPanel" />

        <!-- PageLayout wrapper with PageHeading in header slot -->
        <PageLayout v-if="project" :asideOptions="asideOptions" :footerOptions="footerOptions"
            :projectDomaincode="project.domaincode" :projectId="project.id" :navItems="navigationItems">
            <!-- TopNav Actions Slot - Edit and Config buttons -->
            <template #topnav-actions>
                <!-- Project Editor Link (for owners/admins) -->
                <RouterLink v-if="canEdit" :to="`/projects/${project.domaincode}/main`" class="editor-link"
                    title="Projekt-Editor öffnen">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z">
                        </path>
                    </svg>
                    <span class="editor-link-text">Editor</span>
                </RouterLink>

                <!-- Edit Panel Button -->
                <EditPanelButton :is-authenticated="!!user" :is-admin="user?.activeRole === 'admin'"
                    :is-owner="isProjectOwner" @open="openEditPanel" />

                <!-- Page Config Button -->
                <button v-if="canEdit" class="config-btn" @click="openPageConfig" aria-label="Page Configuration"
                    title="Page Configuration">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                        </path>
                    </svg>
                </button>
            </template>

            <template #header>
                <PageHeading :heading="project.heading || project.id"
                    :teaserText="project.teaser || project.md || 'Explore events, posts, and team members for this project.'"
                    :imgTmp="project.cimg || 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg'"
                    :headerType="project.site_header_type || project.header_type || 'banner'"
                    :headerSize="project.site_header_size || project.header_size || 'prominent'"
                    :cta="{ title: 'Get Involved', link: '/getstarted' }"
                    :link="{ title: 'Back to Home', link: '/' }" />
            </template>

            <!-- Project Events Section -->
            <Section background="muted">
                <Container>
                    <Prose>
                        <Heading overline="Project Events" level="h2" headline="Upcoming Events" />
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
                        <Heading overline="Project Updates" level="h2" headline="Latest Posts" />
                    </Prose>

                    <Columns gap="medium" align="top" wrap v-if="posts.length > 0">
                        <Column v-for="post in posts.slice(0, 6)" :key="post.id" width="1/3">
                            <RouterLink :to="`/sites/${domaincode}/posts/${post.id}`"
                                style="text-decoration: none; color: inherit; display: block;">
                                <CardHero height-tmp="medium" :img-tmp="post.cimg || ''" content-align-y="bottom"
                                    content-type="text">
                                    <Prose>
                                        <h3>{{ post.name || post.id }}</h3>
                                        <p v-if="post.teaser">{{ post.teaser.substring(0, 100) }}{{ post.teaser.length >
                                            100 ? '...'
                                            : '' }}</p>
                                        <p v-else-if="post.md">{{ post.md.substring(0, 100) }}...</p>
                                        <p v-else><em>No content available</em></p>
                                    </Prose>
                                </CardHero>
                            </RouterLink>
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
                        <Heading overline="Meet the Team" level="h2" headline="Our People" />
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import PageHeading from '@/components/PageHeading.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
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
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const { setTheme, init: initTheme } = useTheme()

// State
const user = ref<any>(null)
const project = ref<any>(null)
const posts = ref<any[]>([])
const events = ref<any[]>([])
const users = ref<any[]>([])
const domaincode = ref<string>('')
const isEditPanelOpen = ref(false)
const isConfigPanelOpen = ref(false)

// Parse options for PageLayout
const asideOptions = computed<AsideOptions>(() => {
    if (!project.value) return {}
    return parseAsideOptions(project.value)
})

const footerOptions = computed<FooterOptions>(() => {
    if (!project.value) return {}
    return parseFooterOptions(project.value)
})

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

// Check if current user is the project owner
const isProjectOwner = computed(() => {
    if (!user.value || !project.value) return false
    // Check if user is project role and projectId (domaincode) matches
    return user.value.activeRole === 'project' && user.value.projectId === project.value.domaincode
})

// Check if user can edit (admin or project owner)
const canEdit = computed(() => {
    if (!user.value) return false
    return user.value.activeRole === 'admin' || isProjectOwner.value
})

// Navigation items
const navigationItems = computed(() => {
    const items = [
        {
            label: 'Blog',
            link: '/blog'
        }
    ]

    // Add Back button for project role users
    if (user.value?.activeRole === 'project') {
        items.unshift({
            label: 'Back to Dashboard',
            link: `/projects/${domaincode.value}/topics`
        })
    }

    return items
})

// Open edit panel
function openEditPanel() {
    isEditPanelOpen.value = true
}

// Close edit panel
function closeEditPanel() {
    isEditPanelOpen.value = false
}

// Open/close config panel
function openPageConfig() {
    isConfigPanelOpen.value = true
}

function closeConfigPanel() {
    isConfigPanelOpen.value = false
}

// Handle save project
async function handleSaveProject(data: EditPanelData) {
    if (!project.value) return

    try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.value.domaincode)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (response.ok) {
            // Reload the project data to get fresh data from server
            await fetchProject(project.value.domaincode)
            closeEditPanel()
            console.log('Project updated successfully')
        } else {
            const errorText = await response.text()
            console.error('Failed to update project:', errorText)
            alert('Failed to update project. Please try again.')
        }
    } catch (error) {
        console.error('Error saving project:', error)
        alert('Error saving project. Please check your connection.')
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

// SEO: Set meta tags from project config
function setProjectSeoMeta() {
    if (!project.value) return;

    // Extract SEO data from project.config or use fallbacks
    const config = project.value.config || {};
    const seoTitle = config.seo_title || project.value.name || project.value.heading || project.value.domaincode;
    const seoDescription = config.seo_description || project.value.teaser || project.value.description || '';
    const seoKeywords = config.seo_keywords || '';
    const seoImage = config.seo_image || project.value.cimg || '';
    const ogTitle = config.og_title || seoTitle;
    const ogDescription = config.og_description || seoDescription;
    const twitterCard = config.twitter_card || 'summary_large_image';

    // Set title
    document.title = `${seoTitle} - Theaterpedia`;

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
            if (value) { // Only set if value exists
                element!.setAttribute(key, value);
            }
        });
    };

    // Basic meta tags
    if (seoDescription) {
        setMeta('meta[name="description"]', { name: 'description', content: seoDescription });
    }
    if (seoKeywords) {
        setMeta('meta[name="keywords"]', { name: 'keywords', content: seoKeywords });
    }

    // Open Graph tags
    setMeta('meta[property="og:title"]', { property: 'og:title', content: ogTitle });
    if (ogDescription) {
        setMeta('meta[property="og:description"]', { property: 'og:description', content: ogDescription });
    }
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    if (seoImage) {
        setMeta('meta[property="og:image"]', { property: 'og:image', content: seoImage });
    }

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ogTitle });
    if (ogDescription) {
        setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ogDescription });
    }
    if (seoImage) {
        setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: seoImage });
    }
}

onMounted(async () => {
    domaincode.value = route.params.domaincode as string

    await checkAuth()

    if (domaincode.value) {
        await fetchProject(domaincode.value)

        // Apply project theme if set
        await initTheme()
        if (project.value?.theme !== null && project.value?.theme !== undefined) {
            await setTheme(project.value.theme, 'initial')
        }

        // Set SEO meta tags after project is loaded
        setProjectSeoMeta()
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

/* Editor Link - project main editor access */
.editor-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    color: var(--color-contrast);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: var(--transition);
    transition-property: background-color, color, border-color;
}

.editor-link:hover {
    background-color: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.editor-link svg {
    width: 1rem;
    height: 1rem;
}

.editor-link-text {
    display: none;
}

@media (min-width: 640px) {
    .editor-link-text {
        display: inline;
    }
}

/* Config Button - matches navbar button style */
.config-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color, border-color;
}

.config-btn:hover {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
    color: var(--color-primary-bg);
}

.config-btn svg {
    width: 1.25rem;
    height: 1.25rem;
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
