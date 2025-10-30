<template>
    <div class="datenschutz-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Datenschutz'}`"
            subtitle="Update datenschutz page information" :data="editPanelData" @close="closeEditPanel"
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
                            <h1>Datenschutzerklärung</h1>

                            <h2>1. Datenschutz auf einen Blick</h2>

                            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                                personenbezogenen Daten
                                passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit
                                denen Sie
                                persönlich identifiziert werden können.</p>

                            <h3>Datenerfassung auf unserer Website</h3>

                            <h4>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>

                            <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
                                Kontaktdaten
                                können Sie dem Impressum dieser Website entnehmen.</p>

                            <h4>Wie erfassen wir Ihre Daten?</h4>

                            <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen, z.B. indem Sie
                                das
                                Kontaktformular ausfüllen.</p>

                            <p>Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst.
                                Das sind vor
                                allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des
                                Seitenaufrufs). Die
                                Erfassung dieser Daten erfolgt automatisch, sobald Sie unsere Website betreten.</p>

                            <h4>Wofür nutzen wir Ihre Daten?</h4>

                            <p>Ein Teil der Daten wird zur Bearbeitung Ihrer Anfragen erhoben, ein Teil, um eine
                                fehlerfreie
                                Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres
                                Nutzerverhaltens
                                verwendet werden.</p>

                            <h4>Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>

                            <p>Sie haben das Recht, jederzeit Auskunft über Herkunft, Empfänger und Zweck Ihrer
                                gespeicherten
                                personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung,
                                Sperrung oder
                                Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema
                                Datenschutz können Sie
                                sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Des Weiteren
                                steht Ihnen
                                ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>

                            <h2>2. Allgemeine Hinweise und Pflichtinformationen</h2>

                            <h3>Datenschutz</h3>

                            <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
                                behandeln Ihre
                                personenbezogenen Daten vertraulich und entsprechend der gesetzlichen
                                Datenschutzvorschriften sowie
                                dieser Datenschutzerklärung.</p>

                            <p>Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
                                Personenbezogene
                                Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende
                                Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie
                                erläutert
                                auch, wie und zu welchem Zweck das geschieht.</p>

                            <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation
                                per E-Mail)
                                Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch
                                Dritte ist
                                nicht möglich.</p>

                            <h3>Hinweis zur verantwortlichen Stelle</h3>

                            <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>

                            <p>
                                Theaterpedia - Netzwerk für Theaterpädagogik<br>
                                Fürtherstr. 174<br>
                                90429 Nürnberg<br>
                                Tel.: +49 (911) 7808476<br>
                                E-Mail: datenschutz@theaterpedia.org
                            </p>

                            <p>Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
                                gemeinsam mit
                                anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B.
                                Namen, E-Mail
                                Adressen o.Ä.) entscheidet.</p>

                            <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>

                            <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich.
                                Sie können
                                eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose
                                Mitteilung per
                                E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung
                                bleibt vom
                                Widerruf unberührt.</p>

                            <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>

                            <p>Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei
                                der
                                zuständigen Aufsichtsbehörde zu. Die für uns zuständige Aufsichtsbehörde ist die
                                Landesbeauftragte
                                für Datenschutz und Informationsfreiheit Bayern:</p>

                            <p>
                                Wagmüllerstraße 18<br>
                                80538 München<br>
                                Tel.: +49 (89) 212672-0<br>
                                Fax.: +49 (89) 212672-50<br>
                                E-Mail: poststelle@datenschutz-bayern.de<br>
                                Homepage: <a href="https://www.datenschutz-bayern.de" target="_blank"
                                    rel="noopener">https://www.datenschutz-bayern.de</a>
                            </p>

                            <h3>Recht auf Datenübertragbarkeit</h3>

                            <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung
                                eines Vertrags
                                automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen,
                                maschinenlesbaren Format
                                aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen
                                Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.</p>

                            <h3>SSL- bzw. TLS-Verschlüsselung</h3>

                            <p>Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
                                Inhalte, wie
                                zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine
                                SSL-bzw.
                                TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die
                                Adresszeile des
                                Browsers von "http://" auf "https://" wechselt und an dem Schloss-Symbol in Ihrer
                                Browserzeile.</p>

                            <p>Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns
                                übermitteln,
                                nicht von Dritten mitgelesen werden.</p>

                            <h3>Auskunft, Sperrung, Löschung</h3>

                            <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
                                unentgeltliche
                                Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger
                                und den Zweck
                                der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser
                                Daten.
                                Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich
                                jederzeit unter der
                                im Impressum angegebenen Adresse an uns wenden.</p>

                            <h2>3. Datenerfassung auf unserer Website</h2>

                            <h3>Cookies</h3>

                            <p>Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem
                                Rechner keinen
                                Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot
                                nutzerfreundlicher,
                                effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem
                                Rechner abgelegt
                                werden und die Ihr Browser speichert.</p>

                            <p>Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie
                                werden nach Ende
                                Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät
                                gespeichert bis Sie
                                diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch
                                wiederzuerkennen.</p>

                            <p>Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert
                                werden und
                                Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder
                                generell
                                ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browser
                                aktivieren. Bei
                                der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
                            </p>

                            <h3>Server-Log-Dateien</h3>

                            <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:</p>

                            <ul>
                                <li>Browsertyp und Browserversion</li>
                                <li>verwendetes Betriebssystem</li>
                                <li>Referrer URL</li>
                                <li>Hostname des zugreifenden Rechners</li>
                                <li>Uhrzeit der Serveranfrage</li>
                                <li>IP-Adresse</li>
                            </ul>

                            <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p>

                            <p>Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung
                                von Daten
                                zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.</p>

                            <h3>Kontaktformular</h3>

                            <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
                                Formular
                                inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und
                                für den
                                Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre
                                Einwilligung
                                weiter.</p>

                            <p>Die Verarbeitung der in die Formulare eingegebenen Daten erfolgt somit ausschließlich auf
                                Grundlage
                                Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können diese Einwilligung jederzeit
                                widerrufen.
                                Dazu reicht eine formlose Mitteilung per E-Mail an datenschutz@theaterpedia.org. Die
                                Rechtmäßigkeit
                                der bis zum Widerruf erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt.
                            </p>

                            <p>Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur
                                Löschung
                                auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die
                                Datenspeicherung
                                entfällt (z.B. nach abgeschlossener Bearbeitung Ihrer Anfrage). Zwingende gesetzliche
                                Bestimmungen –
                                insbesondere Aufbewahrungsfristen – bleiben unberührt.</p>

                            <h3>Newsletter</h3>

                            <p>Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von
                                Ihnen eine
                                E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der
                                Inhaber der
                                angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind.
                                Weitere
                                Daten werden nicht bzw. nur auf freiwilliger Basis erhoben. Diese Daten verwenden wir
                                ausschließlich
                                für den Versand der angeforderten Informationen und geben diese nicht an Dritte weiter.
                            </p>

                            <p>Die Verarbeitung dieser Daten erfolgt ausschließlich auf Grundlage Ihrer Einwilligung
                                (Art. 6 Abs. 1
                                lit. a DSGVO). Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse
                                sowie deren
                                Nutzung zum Versand des Newsletters können Sie jederzeit über eine formlose E-Mail
                                widerrufen. Die
                                Rechtmäßigkeit der bereits erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf
                                unberührt.</p>

                            <p>Die von Ihnen zum Zwecke des Newsletter-Bezugs bei uns hinterlegten Daten werden von uns
                                bis zu Ihrer
                                Austragung aus dem Newsletter gespeichert und nach der Abbestellung des Newsletters
                                gelöscht. Daten,
                                die zu anderen Zwecken bei uns gespeichert wurden bleiben hiervon unberührt.</p>

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
function setDatenschutzSeoMeta() {
    document.title = `Datenschutz - ${pageSettings.seo_title}`;

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

    const description = 'Datenschutzerklärung - Theaterpedia.org';
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: `Datenschutz - ${pageSettings.og_title}` });
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
    setDatenschutzSeoMeta()
    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
})
</script>

<style scoped>
.datenschutz-page {
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

.legal-content h3 {
    font-size: 1.25rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
}

.legal-content h4 {
    font-size: 1.1rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

.legal-content p {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.legal-content ul {
    margin-bottom: 1rem;
    padding-left: 2rem;
}

.legal-content li {
    margin-bottom: 0.5rem;
}

.legal-content a {
    color: var(--color-primary-bg);
    text-decoration: underline;
}

.legal-content a:hover {
    color: var(--color-primary-darker);
}
</style>
