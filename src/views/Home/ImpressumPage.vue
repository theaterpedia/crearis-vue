<template>
    <div class="impressum-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Impressum'}`"
            subtitle="Update impressum page information" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- PageLayout wrapper -->
        <!-- No `v-if="project"` — a legal page must render even when the project row
             does not exist. `useImpressum` carries the root site's published imprint as
             code-defaults precisely so both pages work against an unseeded DB; gating the
             whole layout on the fetch defeated that and rendered `/impressum` BLANK on a
             database without a `tp` row (measured, 2026-08-07). The project is only needed
             for the edit-chrome, which keeps its own `v-if`. -->
        <!-- No aside/footer options on purpose. `parseAsideOptions`/`parseFooterOptions`
             apply page-type DEFAULTS (a TOC „Inhalt", „Weitere Beiträge", an events
             gallery), so a legal page inherited content-page furniture it should never
             have — and one of those entity-fetches rendered a red
             "Unexpected token '<' … is not valid JSON" banner across the imprint
             (measured). An Impressum has no table of contents and no related posts. -->
        <PageLayout setSiteLayout="centered" :projectDomaincode="project?.domaincode" :navItems="navItems"
            navbarMode="page" :showLogo="isSiteMount ? 'no' : 'default'">

            <!-- Empty header on purpose. A legal page has no hero — and PageLayout's
                 #header slot carries a DEV placeholder as its fallback ("Header slot -
                 provide header content…"), which was invisible only while the layout was
                 gated on `project`. Ungating it surfaced that text on a public page. -->
            <template #header><span /></template>

            <!-- TopNav Actions Slot -->
            <template #topnav-actions>
                <EditPanelButton :is-authenticated="!!user" :is-admin="user?.activeRole === 'admin'"
                    :is-owner="isProjectOwner" @open="openEditPanel" />
            </template>

            <!-- Page Content · fields per project (useImpressum — the thread's
                 template with its fallback chain; prose is shared, identity varies) -->
            <Section background="default">
                <Container>
                    <Prose>
                        <div class="legal-content">
                            <h1>Impressum und Disclaimer</h1>
                            <p>Angaben gemäß § 5 DDG</p>

                            <!-- Honest state for a project without keys: never render a
                                 WRONG Diensteanbieter — the split exists for liability. -->
                            <template v-if="missing">
                                <p class="legal-missing">
                                    Die Impressum-Angaben für dieses Projekt sind noch nicht hinterlegt.
                                    Bitte wende dich an die Projekt-Verantwortlichen.
                                </p>
                            </template>

                            <template v-else>
                                <h2>Für: {{ fields.company }}</h2>

                                <p>Gemäß § 28 BDSG widerspreche ich jeder kommerziellen Verwendung und Weitergabe meiner
                                    Daten.</p>

                                <p><strong>Verantwortungsbereich:</strong> Das Impressum gilt nur für die Internetpräsenz
                                    unter der Adresse: <a :href="fields.homeUrl">{{ fields.homeUrl }}</a></p>

                                <p><strong>Diensteanbieter:</strong> {{ fields.company }}</p>

                                <p><strong>Verantwortliche Ansprechperson:</strong> {{ fields.name }}</p>

                                <p><strong>Anschrift:</strong> <span class="legal-address">{{ fields.address }}</span></p>

                                <p><strong>Elektronische Postadresse:</strong> {{ fields.email }}</p>

                                <!-- absent phone = the whole line hides (template rule) -->
                                <p v-if="fields.phone"><strong>Schnelle elektronische und unmittelbare
                                    Kommunikation:</strong> Tel: {{ fields.phone }}</p>

                                <p><strong>Journalistisch-redaktionelle Verantwortung:</strong>
                                    {{ fields.responsibleContent }}</p>

                                <h2>Urheberschutz und Nutzung</h2>

                                <p>Der Urheber räumt Ihnen ganz konkret das Nutzungsrecht ein, sich eine private Kopie für
                                    persönliche Zwecke anzufertigen. Nicht berechtigt sind Sie dagegen, die Materialien zu
                                    verändern und/oder weiter zu geben oder gar selbst zu veröffentlichen.</p>

                                <p>Wenn nicht ausdrücklich anders vermerkt, liegen die Urheberrechte für Texte bei:
                                    {{ fields.copyright }}</p>

                                <p>Die meisten Illustrationen unterliegen den Urheberrechten der jeweiligen
                                    Künstler*innen.</p>

                                <h2>Datenschutz</h2>

                                <p>Personenbezogene Daten werden nur mit Ihrem Wissen und Ihrer Einwilligung erhoben. Eine
                                    detaillierte Datenschutzerklärung finden Sie unter
                                    <RouterLink to="datenschutz">{{ fields.homeUrl }}/datenschutz</RouterLink>.
                                    Auf Antrag erhalten Sie unentgeltlich Auskunft zu den über Sie gespeicherten
                                    personenbezogenen Daten. Wenden Sie sich dazu bitte an: {{ fields.datenschutzEmail }}</p>

                                <h2>Keine Haftung</h2>

                                <p>Die Inhalte dieses Webprojektes wurden sorgfältig geprüft und nach bestem Wissen
                                    erstellt. Aber für die hier dargebotenen Informationen wird kein Anspruch auf
                                    Vollständigkeit, Aktualität, Qualität und Richtigkeit erhoben. Es kann keine
                                    Verantwortung für Schäden übernommen werden, die durch das Vertrauen auf die Inhalte
                                    dieser Website oder deren Gebrauch entstehen.</p>

                                <h2>Schutzrechtsverletzung</h2>

                                <p>Falls Sie vermuten, dass von dieser Website aus eines Ihrer Schutzrechte verletzt wird,
                                    teilen Sie das bitte umgehend per elektronischer Post mit, damit zügig Abhilfe
                                    geschafft werden kann. Bitte nehmen Sie zur Kenntnis: Die zeitaufwändigere Einschaltung
                                    eines Anwaltes zur für den Diensteanbieter kostenpflichtigen Abmahnung entspricht nicht
                                    dessen wirklichen oder mutmaßlichen Willen.</p>

                                <p>&copy; {{ fields.year }} {{ fields.company }}</p>
                            </template>
                        </div>
                    </Prose>
                </Container>
            </Section>

            <!-- Footer -->
            <!-- The platform footer carries Theaterpedia's identity and „© Theaterpedia.org
                 Network. All rights reserved." — directly beneath an imprint that names a
                 DIFFERENT Diensteanbieter. Same misrepresentation as the nav, and worse
                 here because it is a copyright claim. Root mount keeps it; a site-mount
                 wears none until the site-frame seam supplies its own (thread §3). -->
            <template #footer>
                <HomeSiteFooter v-if="!isSiteMount" />
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
import type { EditPanelData } from '@/components/EditPanel.vue'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { pageSettings } from '@/settings'
import { useTheme } from '@/composables/useTheme'
import { useImpressum, IMPRESSUM_ROOT_DOMAINCODE } from '@/composables/useImpressum'
import { resolveDomaincode } from '@/composables/useHostMode'

const router = useRouter()
const route = useRoute()

// One component, FOUR mounts (impressum thread · route-space contract §3):
// `/impressum` on the portal → the root site (tp) · `/sites/:domaincode/…` +
// `/projects/:xyz/…` → that project by PATH · `/impressum` on a project's own
// domain → that project by HOST. Liability is the reason for the split, so the
// host-shape must resolve like every other page: `eeb099b` gave EventPage,
// PostPage and ProjectSite the host-fallback and the legal pages were not in
// that set — which left uia's own domain naming Theaterpedia as Diensteanbieter
// while every other page on the same host said uia (uia thread §21·4).
const domaincode = resolveDomaincode(route.params.domaincode) || IMPRESSUM_ROOT_DOMAINCODE
const { fields, missing, load: loadImpressum } = useImpressum(domaincode)

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

/**
 * True whenever this page wears another project's legal identity rather than the
 * platform's — by path OR by host. It drives the wordmark, the public nav and the
 * Theaterpedia footer, so reading only `route.params` put all three back on a
 * project's own domain (the `c95b514` no-wordmark rule, broken on the host-shape).
 * Derived from the RESOLVED scope so identity and chrome can never disagree.
 */
const isSiteMount = computed(() => domaincode !== IMPRESSUM_ROOT_DOMAINCODE)

/**
 * The platform's public nav (Home · Start · Team · Blog) belongs to Theaterpedia.
 * On a site-mount this page names a DIFFERENT Diensteanbieter — putting the
 * platform's nav and wordmark on it misrepresents whose site the reader is on,
 * which is the exact confusion the per-project split exists to prevent.
 *
 * So a site-mount wears no platform chrome. What it SHOULD wear instead — the
 * project's own nav, a back-link, its brand — is deliberately not decided here:
 * the thread's §3 puts chrome on the site-frame seam, so this only stops the
 * wrong chrome rather than inventing the right one.
 */
const navItems = computed<TopnavParentItem[]>(() => {
    if (isSiteMount.value) return []
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})

const user = ref<any>(null)
const project = ref<any>(null)
const isEditPanelOpen = ref(false)

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
    return user.value.activeRole === 'project' && user.value.projectId === domaincode
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
    // Initialize theme dimensions
    const theme = useTheme()
    theme.init()

    setImpressumSeoMeta()
    await checkAuth()
    await fetchProject(domaincode)
    await loadImpressum()
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

/* impressum_address is a MULTILINE key (the thread's template) — one span, real breaks. */
.legal-address {
    white-space: pre-line;
}

/* A project without keys shows the honest note — never a wrong Diensteanbieter. */
.legal-missing {
    padding: 0.6rem 0.8rem;
    border-left: 4px solid var(--color-warning-bg);
    background-color: var(--color-card-bg);
}
</style>
