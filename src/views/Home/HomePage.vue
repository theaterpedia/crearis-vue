<template>
    <div class="home-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Home'}`"
            subtitle="Update home page information and content" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- Navigation Config Panel -->
        <NavigationConfigPanel v-if="project" :is-open="isConfigPanelOpen" :project-id="project.domaincode"
            @close="closeConfigPanel" />

        <!-- PageLayout wrapper -->
        <PageLayout v-if="project" setSiteLayout="centered" :asideOptions="asideOptions" :footerOptions="footerOptions"
            :projectDomaincode="project.domaincode" :navItems="navItems" navbarMode="home"
            :alertBanner="pageSettings.alertBanner">
            <!-- TopNav Actions Slot - Edit and Config buttons -->
            <template #topnav-actions>
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

            <!-- Hero Section -->
            <template #header>
                <HomePageHero :user="user" />
            </template>

            <!-- Trigger 2: Demo Events Card 
            <Section background="default">
                <Container>
                    <div class="demo-card" ref="demoCardElement" @click="handleDemoCardClick">
                        <div class="demo-card-image">
                            <div class="demo-card-placeholder">
                                📅
                            </div>
                        </div>
                        <div class="demo-card-content">
                            <h3>Demo ausprobieren <strong>Veranstaltungskalender</strong></h3>
                            <p>Klicke hier, um die Demo-Funktionen zu erkunden</p>
                        </div>
                    </div>
                </Container>
            </Section>

            !-- Upcoming Events Section --
            <Section background="muted">
                <Container>
                    <pList type="events" :project-domaincode="project.domaincode" item-type="card" size="medium"
                        header="Upcoming Events" is-footer />
                </Container>
            </Section>
            -->

            <!-- Events Section  -->
            <Section>
                <Container>
                    <Columns>
                        <Column width="1/2">
                            <h2 style="margin-bottom: 1rem;">nächste Veranstaltungen</h2>
                            <pList entity="events" project="start" size="small" width="inherit" columns="off"
                                headingLevel="h4" variant="square" onActivate="modal" />
                        </Column>
                        <Column width="auto">
                            <Prose>
                                <Heading overline="Showcase für entstehende Projekte" is="h2"
                                    headline="Ca. 10 Websites in der Pipeline">New **Projects** in
                                    the Pipeline</Heading>
                            </Prose>
                        </Column>
                    </Columns>
                </Container>
            </Section>

            <!-- Page Content -->
            <PageContent page-type="landing" :project-domain-code="project.domaincode"
                :project-id="String(project.id)" />

            <!-- Projects Showcase Section -->
            <ProjectsShowcaseSection />


            <!-- Blog Posts Section  -->
            <Section background="muted">
                <Container>
                    <h2 style="margin-bottom: 1rem;">Blog Beiträge</h2>
                    <pGallery entity="posts" project="dev" item-type="tile" variant="wide" onActivate="modal"
                        header="Latest from Our Blog" is-footer />
                </Container>
            </Section>

            <!-- Community Members Section
            <CommunityMembersSection :users="users" />
             -->

            <!-- Footer -->
            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, createApp } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStatus } from '@/composables/useStatus'
import PageLayout from '@/components/PageLayout.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
import HomeSiteFooter from '@/views/Home/HomeComponents/homeSiteFooter.vue'
import PageContent from '@/components/PageContent.vue'
import HomePageHero from './HomeComponents/HomePageHero.vue'
import pList from '@/components/page/pList.vue'
import pGallery from '@/components/page/pGallery.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import ProjectsShowcaseSection from './HomeComponents/ProjectsShowcaseSection.vue'
import CommunityMembersSection from './HomeComponents/CommunityMembersSection.vue'
import SocialMediaSection from './HomeComponents/SocialMediaSection.vue'
import InvertedToggle from '@/components/InvertedToggle.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { pageSettings } from '@/settings'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const { getStatusIdByName, getStatusesForTable } = useStatus()

// SEO: Set meta tags from settings
function setHomePageSeoMeta() {
    // Set title
    document.title = pageSettings.seo_title;

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
            if (value) {
                element!.setAttribute(key, value);
            }
        });
    };

    // Basic meta tags
    setMeta('meta[name="description"]', { name: 'description', content: pageSettings.seo_description });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: pageSettings.seo_keywords });

    // Open Graph tags
    setMeta('meta[property="og:title"]', { property: 'og:title', content: pageSettings.og_title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: pageSettings.og_description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: pageSettings.seo_image });

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: pageSettings.twitter_card });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageSettings.og_title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: pageSettings.og_description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: pageSettings.seo_image });
}

// Get public navigation items
const navItems = computed<TopnavParentItem[]>(() => {
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})

// State - Fixed to project 'tp'
const FIXED_PROJECT_ID = 'tp'
const user = ref<any>(null)
const project = ref<any>(null)
const users = ref<any[]>([])
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
    return user.value.activeRole === 'project' && user.value.projectId === FIXED_PROJECT_ID
})

// Check if user can edit (admin or project owner)
const canEdit = computed(() => {
    if (!user.value) return false
    return user.value.activeRole === 'admin' || isProjectOwner.value
})

// Open/close edit panel
function openEditPanel() {
    isEditPanelOpen.value = true
}

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
        const response = await fetch(`/api/projects/${project.value.domaincode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to save project')
        }

        // Refresh project data
        await fetchProject(project.value.domaincode)

        // Close the panel
        closeEditPanel()
    } catch (error: any) {
        console.error('Failed to save project:', error)
        alert(error.message || 'Failed to save changes. Please try again.')
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

// Fetch project (fixed to 'tp')
async function fetchProject(domaincode: string) {
    try {
        const response = await fetch(`/api/projects/${domaincode}`)
        if (response.ok) {
            const data = await response.json()
            project.value = data
        } else if (response.status === 404) {
            console.error('Project not found')
            router.push('/')
        }
    } catch (error) {
        console.error('Failed to fetch project:', error)
    }
}

// Fetch users
async function fetchUsers() {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const data = await response.json()
            users.value = data.filter((u: any) => !['admin', 'base'].includes(u.username)).slice(0, 10)
        }
    } catch (error) {
        console.error('Failed to fetch users:', error)
    }
}


// Initialize
onMounted(async () => {
    // Initialize theme dimensions
    const theme = useTheme()
    theme.init()

    // Set SEO meta tags
    setHomePageSeoMeta()

    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
    await fetchUsers()
})
</script>

<style scoped>
.home-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.config-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color;
}

.config-btn:hover {
    background-color: var(--color-muted-bg);
}

.config-btn:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}

/* Demo Card Styles */
.demo-card {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 2px solid var(--color-border);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 2rem 0;
}

.demo-card:hover {
    border-color: var(--color-primary-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.demo-card-image {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 0.5rem;
    overflow: hidden;
}

.demo-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.demo-card-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-muted-bg);
    font-size: 3rem;
}

.demo-card-content {
    flex: 1;
}

.demo-card-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--color-text);
}

.demo-card-content h3 strong {
    color: var(--color-primary-bg);
}

.demo-card-content p {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-dimmed);
}

@media (max-width: 767px) {
    .demo-card {
        flex-direction: column;
    }

    .demo-card-image {
        width: 100%;
        height: 200px;
    }
}
</style>
