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
                <HeroSection :user="user" @trigger-demo="handleHeroDemoClick" />
            </template>

            <!-- Trigger 2: Demo Events Card -->
            <Section background="default">
                <Container>
                    <div class="demo-card" ref="demoCardElement" @click="handleDemoCardClick">
                        <div class="demo-card-image">
                            <img v-if="events.length > 0 && events[0].image" :src="events[0].image"
                                alt="Demo Veranstaltung" />
                            <div v-else class="demo-card-placeholder">
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

            <!-- Upcoming Events Section -->
            <Section background="muted">
                <Container>
                    <pList type="events" :project-domaincode="project.domaincode" item-type="card" size="medium"
                        header="Upcoming Events" is-footer />
                </Container>
            </Section>

            <!-- Page Content -->
            <PageContent page-type="landing" :project-domain-code="project.domaincode"
                :project-id="String(project.id)" />

            <!-- Projects Showcase Section -->
            <ProjectsShowcaseSection :projects="projects" />

            <!-- Blog Posts Section -->
            <Section background="accent">
                <Container>
                    <pGallery type="posts" :project-domaincode="project.domaincode" item-type="card" size="medium"
                        variant="wide" header="Latest from Our Blog" is-footer />
                </Container>
            </Section>

            <!-- Community Members Section -->
            <CommunityMembersSection :users="users" />

            <!-- Footer -->
            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>

        <!-- Floating Post-It Renderer -->
        <FpostitRenderer />
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
import HomeSiteFooter from '@/components/homeSiteFooter.vue'
import PageContent from '@/components/PageContent.vue'
import HeroSection from './HomeComponents/HeroSection.vue'
import pList from '@/components/page/pList.vue'
import pGallery from '@/components/page/pGallery.vue'
import ProjectsShowcaseSection from './HomeComponents/ProjectsShowcaseSection.vue'
import CommunityMembersSection from './HomeComponents/CommunityMembersSection.vue'
import SocialMediaSection from './HomeComponents/SocialMediaSection.vue'
import InvertedToggle from '@/components/InvertedToggle.vue'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { pageSettings } from '@/settings'

const router = useRouter()
const route = useRoute()
const { getStatusIdByName } = useStatus()

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
const projects = ref<any[]>([])
const users = ref<any[]>([])
const isEditPanelOpen = ref(false)
const isConfigPanelOpen = ref(false)

// Floating Post-Its
const controller = useFpostitController()
const demoCardElement = ref<HTMLElement>()
const currentHeaderType = ref<'bauchbinde' | 'cover'>('cover')
const p1Interval = ref<number | null>(null)
const p2Interval = ref<number | null>(null)

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

// Cleanup intervals on component unmount
onUnmounted(() => {
    if (p1Interval.value) clearInterval(p1Interval.value)
    if (p2Interval.value) clearInterval(p2Interval.value)
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

// Fetch projects (filtered)
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects')
        if (response.ok) {
            const data = await response.json()
            const projectsArray = data.projects || data

            // Get status IDs for 'draft' and 'demo'
            const draftStatusId = getStatusIdByName('draft', 'projects')
            const demoStatusId = getStatusIdByName('demo', 'projects')

            // Filter projects
            const filteredProjects = projectsArray.filter((p: any) =>
                p.status_id === draftStatusId || p.status_id === demoStatusId
            )
            projects.value = filteredProjects.slice(0, 8)
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
            users.value = data.filter((u: any) => !['admin', 'base'].includes(u.username)).slice(0, 10)
        }
    } catch (error) {
        console.error('Failed to fetch users:', error)
    }
}

// Floating Post-Its Setup
function setupFloatingPostits() {
    // Post-It 1: Themes ausprobieren
    controller.create({
        key: 'p1',
        title: 'Themes ausprobieren',
        content: `
            <p>Theaterpedia bietet verschiedene Themes für individuelle Gestaltung. Probiere es direkt aus!</p>
            <p>Wechsle zwischen hellem und dunklem Modus mit diesem Toggle:</p>
            <div id="fpostit-theme-toggle" style="margin: 1rem 0;"></div>
        `,
        color: 'accent',
        hlogic: 'right',
        hOffset: 0,
        actions: [
            {
                label: 'Verstanden!',
                handler: (close) => close()
            }
        ]
    })

    // Post-It 2: Der erste Eindruck zählt
    controller.create({
        key: 'p2',
        title: 'Der erste Eindruck zählt',
        content: `
            <p>Die Hero-Komponente unterstützt zwei Modi:</p>
            <ul>
                <li><strong>Bauchbinde:</strong> Kompakte Darstellung mit Text im unteren Bereich</li>
                <li><strong>Cover:</strong> Vollflächige Darstellung mit zentriertem Inhalt (aktuell aktiv)</li>
            </ul>
            <div style="margin: 1rem 0;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Header-Typ wählen:</label>
                <select id="fpostit-header-type" style="width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-bg); color: var(--color-contrast);">
                    <option value="cover" selected>Cover (Vollbild)</option>
                    <option value="bauchbinde">Bauchbinde (Kompakt)</option>
                </select>
            </div>
            <p style="font-size: 0.875rem; color: var(--color-dimmed);">Hinweis: Diese Demo ändert nur die Ansicht, nicht die tatsächlichen Einstellungen.</p>
        `,
        color: 'primary',
        hlogic: 'right',
        hOffset: 25, // 400px = 25rem
        actions: [
            {
                label: 'Alles klar!',
                handler: (close) => close()
            }
        ]
    })

    // Post-It 3: Mit Demodaten einsteigen
    controller.create({
        key: 'p3',
        title: 'Mit Demodaten einsteigen',
        content: `
            <p>Entdecke die Funktionen von Theaterpedia mit unseren Demo-Daten:</p>
            <p><strong>Events:</strong> Sieh dir Beispiel-Veranstaltungen an und wie sie im Kalender dargestellt werden. Von Premieren über Workshops bis hin zu Festivals.</p>
            <p><strong>Akteure:</strong> Erkunde Profile von Theaterschaffenden, Gruppen und Ensembles. Verstehe, wie Vernetzung in der Theaterwelt funktioniert.</p>
            <p>Die Demo-Umgebung ist dein Spielplatz – probiere aus, teste Funktionen und lerne das System kennen, ohne echte Daten zu beeinflussen!</p>
        `,
        color: 'positive',
        hlogic: 'element',
        actions: [
            {
                label: 'Events ansehen',
                handler: (close) => {
                    router.push('/sites/tp/events')
                    close()
                }
            },
            {
                label: 'Akteure entdecken',
                handler: (close) => {
                    router.push('/sites/tp/actors')
                    close()
                }
            }
        ]
    })
}

// Handler for Hero Demo Click (Trigger 1)
function handleHeroDemoClick(event: MouseEvent) {
    const trigger = event.currentTarget as HTMLElement

    // Open both post-its at once
    controller.openPostit('p1', trigger)

    // Small delay for stacking effect
    setTimeout(() => {
        controller.openPostit('p2', trigger)
    }, 100)
}

// Handler for Demo Card Click (Trigger 2)
function handleDemoCardClick(event: MouseEvent) {
    if (demoCardElement.value) {
        controller.openPostit('p3', demoCardElement.value)
    }
}

// Watch for post-it opens and inject interactive components
function watchPostItOpens() {
    // Watch for p1 (Theme Toggle)
    p1Interval.value = setInterval(() => {
        const themeContainer = document.getElementById('fpostit-theme-toggle')
        if (themeContainer && controller.isOpen('p1')) {
            if (p1Interval.value) clearInterval(p1Interval.value)
            // Create and mount InvertedToggle component
            import('@/components/InvertedToggle.vue').then(module => {
                const InvertedToggleComp = module.default
                const app = createApp(InvertedToggleComp)
                app.mount(themeContainer)
            }).catch(err => console.error('Failed to load InvertedToggle:', err))
        }
    }, 100) as unknown as number

    // Watch for p2 (Header Type Selector)
    p2Interval.value = setInterval(() => {
        const headerTypeSelect = document.getElementById('fpostit-header-type') as HTMLSelectElement
        if (headerTypeSelect && controller.isOpen('p2')) {
            if (p2Interval.value) clearInterval(p2Interval.value)
            headerTypeSelect.value = currentHeaderType.value
            headerTypeSelect.addEventListener('change', (e) => {
                const newType = (e.target as HTMLSelectElement).value as 'bauchbinde' | 'cover'
                currentHeaderType.value = newType
                // Note: This is demo only - would need to actually update Hero component in real implementation
                console.log('Header type changed to:', newType)
                alert(`Header-Typ zu "${newType}" geändert! (Demo-Modus - keine echte Änderung)`)
            })
        }
    }, 100) as unknown as number
}

// Initialize
onMounted(async () => {
    // Set SEO meta tags
    setHomePageSeoMeta()

    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
    await Promise.all([
        fetchProjects(),
        fetchUsers()
    ])

    // Setup floating post-its after data is loaded
    setupFloatingPostits()

    // Start watching for post-it opens
    watchPostItOpens()
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
