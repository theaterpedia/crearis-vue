<template>
    <div class="contact-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Kontakt'}`"
            subtitle="Update contact page information" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- PageLayout wrapper -->
        <PageLayout v-if="project" :asideOptions="asideOptions" :footerOptions="footerOptions"
            :projectDomaincode="project.domaincode" :navItems="navItems" navbarMode="page">

            <!-- TopNav Actions Slot -->
            <template #topnav-actions>
                <EditPanelButton :is-authenticated="!!user" :is-admin="user?.activeRole === 'admin'"
                    :is-owner="isProjectOwner" @open="openEditPanel" />
            </template>

            <!-- Page Content -->
            <Section background="default">
                <Container>
                    <Prose>
                        <h1>Kontakt</h1>

                        <div class="contact-info">
                            <h2>Theaterpedia - Netzwerk für Theaterpädagogik</h2>

                            <p>
                                <strong>Hans Dönitz</strong><br>
                                Fürtherstr. 174<br>
                                90429 Nürnberg
                            </p>

                            <p>
                                <strong>Telefon:</strong> 0911/7808476<br>
                                <strong>E-Mail:</strong> info@theaterpedia.org
                            </p>
                        </div>

                        <div class="newsletter-section">
                            <h2>Newsletter abonnieren</h2>
                            <p>Bleibe auf dem Laufenden mit unserem Newsletter. Erhalte Informationen über neue
                                Projekte,
                                Veranstaltungen und mehr.</p>
                        </div>
                    </Prose>

                    <!-- Newsletter Form -->
                    <div class="newsletter-form-container">
                        <CreateInteraction v-if="!newsletterSubmitted" form-name="newsletter" :show="true"
                            :project-domaincode="project?.domaincode" :user-id="user?.id" @saved="handleNewsletterSaved"
                            @error="handleNewsletterError" />

                        <div v-else class="success-message">
                            <div class="success-icon">✓</div>
                            <h3>Vielen Dank!</h3>
                            <p>Du hast dich erfolgreich für unseren Newsletter angemeldet.</p>
                        </div>
                    </div>
                </Container>
            </Section>

            <!-- Footer -->
            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import HomeSiteFooter from '@/views/Home/HomeComponents/homeSiteFooter.vue'
import CreateInteraction from '@/components/forms/CreateInteraction.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { pageSettings } from '@/settings'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()

// SEO: Set meta tags
function setContactSeoMeta() {
    document.title = `Kontakt - ${pageSettings.seo_title}`;

    const setMeta = (selector: string, attributes: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            const tagMatch = selector.match(/^(\w+)\[/);
            const tag = tagMatch && tagMatch[1] ? tagMatch[1] : 'meta';
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            if (value) element!.setAttribute(key, value);
        });
    };

    const description = 'Kontaktiere Theaterpedia - Netzwerk für Theaterpädagogik';
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: `Kontakt - ${pageSettings.og_title}` });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
}

const navItems = computed<TopnavParentItem[]>(() => {
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})

const FIXED_PROJECT_ID = 'tp'
const user = ref<any>(null)
const project = ref<any>(null)
const isEditPanelOpen = ref(false)
const newsletterSubmitted = ref(false)

const asideOptions = computed<AsideOptions>(() => {
    if (!project.value) return {}
    return parseAsideOptions(project.value)
})

const footerOptions = computed<FooterOptions>(() => {
    if (!project.value) return {}
    return parseFooterOptions(project.value)
})

const editPanelData = computed<EditPanelData>(() => {
    if (!project.value) {
        return { heading: '', teaser: '', cimg: '', header_type: '', header_size: '', md: '' }
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

const isProjectOwner = computed(() => {
    if (!user.value || !project.value) return false
    return user.value.activeRole === 'project' && user.value.projectId === FIXED_PROJECT_ID
})

function openEditPanel() {
    isEditPanelOpen.value = true
}

function closeEditPanel() {
    isEditPanelOpen.value = false
}

async function handleSaveProject(data: EditPanelData) {
    if (!project.value) return
    try {
        const response = await fetch(`/api/projects/${project.value.domaincode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to save project')
        await fetchProject(project.value.domaincode)
        closeEditPanel()
    } catch (error: any) {
        console.error('Failed to save project:', error)
        alert(error.message || 'Failed to save changes.')
    }
}

function handleNewsletterSaved(interactionId: number) {
    console.log('Newsletter subscription saved with ID:', interactionId)
    newsletterSubmitted.value = true
}

function handleNewsletterError(error: string) {
    console.error('Newsletter subscription error:', error)
    alert('Fehler bei der Anmeldung: ' + error)
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated) user.value = data.user
    } catch (error) {
        console.error('Auth check failed:', error)
    }
}

async function fetchProject(domaincode: string) {
    try {
        const response = await fetch(`/api/projects/${domaincode}`)
        if (response.ok) {
            const data = await response.json()
            project.value = data
        }
    } catch (error) {
        console.error('Failed to fetch project:', error)
    }
}

onMounted(async () => {
    // Initialize theme dimensions
    const theme = useTheme()
    theme.init()

    setContactSeoMeta()
    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
})
</script>

<style scoped>
.contact-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.contact-info {
    margin: 2rem 0;
    padding: 2rem;
    background-color: var(--color-muted-bg);
    border-radius: 0.5rem;
}

.contact-info h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.contact-info p {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.newsletter-section {
    margin: 3rem 0 1.5rem;
}

.newsletter-section h2 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
}

.newsletter-form-container {
    max-width: 600px;
    margin: 0 auto;
}

.success-message {
    text-align: center;
    padding: 3rem 2rem;
    background-color: var(--color-success-bg, #d1fae5);
    border-radius: 0.75rem;
    color: var(--color-success-contrast, #065f46);
}

.success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: var(--color-success, #10b981);
}

.success-message h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.success-message p {
    font-size: 1.1rem;
}
</style>
