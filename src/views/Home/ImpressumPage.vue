<template>
    <div class="impressum-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Impressum'}`"
            subtitle="Update impressum page information" :data="editPanelData" @close="closeEditPanel"
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
                        <div class="legal-content">
                            <h1>Impressum und Disclaimer</h1>

                            <h2>Für: Theaterpedia - Netzwerk für Theaterpädagogik</h2>

                            <p>Gemäß § 28 BDSG widerspreche ich jeder kommerziellen Verwendung und Weitergabe meiner
                                Daten.</p>

                            <p><strong>Verantwortungsbereich:</strong> Das Impressum gilt nur für die Internetpräsenz
                                unter der
                                Adresse: <a href="https://theaterpedia.org">https://theaterpedia.org</a></p>

                            <p><strong>Diensteanbieter:</strong> Theaterpedia - Netzwerk für Theaterpädagogik</p>

                            <p><strong>Verantwortliche Ansprechperson:</strong> Hans Dönitz</p>

                            <p><strong>Anschrift:</strong> Fürtherstr. 174, 90429 Nürnberg</p>

                            <p><strong>Elektronische Postadresse:</strong> info @ theaterpedia .org</p>

                            <p><strong>Schnelle elektronische und unmittelbare Kommunikation:</strong> Tel: 0911/7808476
                            </p>

                            <p><strong>Journalistisch-redaktionelle Verantwortung:</strong> Hans Dönitz, Fürtherstr.
                                174, 90429
                                Nürnberg</p>

                            <h2>Urheberschutz und Nutzung</h2>

                            <p>Der Urheber räumt Ihnen ganz konkret das Nutzungsrecht ein, sich eine private Kopie für
                                persönliche
                                Zwecke anzufertigen. Nicht berechtigt sind Sie dagegen, die Materialien zu verändern
                                und/oder weiter
                                zu geben oder gar selbst zu veröffentlichen.</p>

                            <p>Wenn nicht ausdrücklich anders vermerkt, liegen die Urheberrechte für Texte bei: Hans
                                Dönitz</p>

                            <p>Die meisten Illustrationen unterliegen den Urheberrechten der jeweiligen Künstler*innen.
                            </p>

                            <h2>Datenschutz</h2>

                            <p>Personenbezogene Daten werden nur mit Ihrem Wissen und Ihrer Einwilligung erhoben. Eine
                                detaillierte
                                Datenschutzerklärung finden Sie unter <a
                                    href="/datenschutz">https://theaterpedia.org/datenschutz</a>. Auf Antrag erhalten
                                Sie
                                unentgeltlich Auskunft zu den über Sie gespeicherten personenbezogenen Daten. Wenden Sie
                                sich dazu
                                bitte an: datenschutz @ theaterpedia .org</p>

                            <h2>Keine Haftung</h2>

                            <p>Die Inhalte dieses Webprojektes wurden sorgfältig geprüft und nach bestem Wissen
                                erstellt. Aber für
                                die hier dargebotenen Informationen wird kein Anspruch auf Vollständigkeit, Aktualität,
                                Qualität und
                                Richtigkeit erhoben. Es kann keine Verantwortung für Schäden übernommen werden, die
                                durch das
                                Vertrauen auf die Inhalte dieser Website oder deren Gebrauch entstehen.</p>

                            <h2>Schutzrechtsverletzung</h2>

                            <p>Falls Sie vermuten, dass von dieser Website aus eines Ihrer Schutzrechte verletzt wird,
                                teilen Sie
                                das bitte umgehend per elektronischer Post mit, damit zügig Abhilfe geschafft werden
                                kann. Bitte
                                nehmen Sie zur Kenntnis: Die zeitaufwändigere Einschaltung eines Anwaltes zur für den
                                Diensteanbieter kostenpflichtigen Abmahnung entspricht nicht dessen wirklichen oder
                                mutmaßlichen
                                Willen.</p>

                            <p>&copy; 2025 Theaterpedia.org Network</p>
                        </div>
                    </Prose>
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
import HomeSiteFooter from '@/components/homeSiteFooter.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { pageSettings } from '@/settings'

const router = useRouter()
const route = useRoute()

// SEO: Set meta tags
function setImpressumSeoMeta() {
    document.title = `Impressum - ${pageSettings.seo_title}`;

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

    const description = 'Impressum und rechtliche Hinweise - Theaterpedia.org';
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: `Impressum - ${pageSettings.og_title}` });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[name="robots"]', { name: 'robots', content: 'noindex, follow' });
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
    setImpressumSeoMeta()
    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
})
</script>

<style scoped>
.impressum-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.legal-content {
    max-width: 800px;
    margin: 0 auto;
}

.legal-content h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
}

.legal-content h2 {
    font-size: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.legal-content p {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.legal-content a {
    color: var(--color-primary-bg);
    text-decoration: underline;
}

.legal-content a:hover {
    color: var(--color-primary-darker);
}
</style>
