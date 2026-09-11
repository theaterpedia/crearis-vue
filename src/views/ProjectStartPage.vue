<!--
  ProjectStartPage · `/sites/:domaincode/start` — F-3, built from scratch
  (HD 2026-08-06: „We implement '/start' from scratch").

  /start is the ENROLLMENT surface — the portal's /start is the campaign page,
  a project's /start is what „start doing" means for THAT project, and the
  meaning arrives through the PRESET (uia thread §10.7·3):

    initiative      → the public agenda (the insider agenda — richer for
                      logged-in members — rides the r_* visibility columns and
                      is Foundation-blocked: defect ③, compute_role_visibility
                      reads bits 0–2 where the matrix encodes 8–10. Built
                      PUBLIC-FIRST per E's F-3 so nothing waits.)
    schule-project  → login into ONE school's project (sfr's lane, 13.11
                      sibling — honest placeholder until that build).
    default         → the plain agenda.

  The rows are the row-family (Cand-2, cross-preset-canonical): AgendaLineList
  over useAgendaLive's day-groups — the same components both presets render,
  only data + labels + flags differ (presets thread §3, the falsifiable claim).

  Empty-detection wording per HD (verbatim, uia thread §10.5): heading
  „Nächste Termine" + „... auf Anfrage" when nothing is found.

  Chrome: the per-domaincode site-frame seam (domainSiteFrames.ts, F-4).
-->

<template>
    <div class="project-start-page">
        <!-- Access: same gate the site uses — published projects open to everyone -->
        <ProjectNotPublished v-if="accessLoaded && !projectAccess.canAccess.value" :project-domaincode="domaincode"
            :project-name="project?.heading || project?.name || undefined" :is-logged-in="!!user" />

        <PageLayout v-else-if="accessLoaded" :navItems="frameNavItems" :showLogo="frameShowLogo" :brand="frameBrand"
            :setScrollStyle="frame?.scrollStyle" :setSiteLayout="pageStructure.siteLayout">
            <template #header>
                <Section background="accent">
                    <Container>
                        <p class="start-overline">{{ startOverline }}</p>
                        <!-- Beat 2 of the hero-pair composition (design-thread §3·2,
                             HD-ruled: their words). A page_options.start_heading
                             replaces the project heading — the site's NAME lives in
                             the O-2 brand banner now, so the hero is free to be the
                             page's own beat. Absent key = the previous behavior. -->
                        <h1 v-if="startHeading" class="start-title">{{ startHeading }}</h1>
                        <HeadingParser v-else-if="project?.heading" class="start-title" :content="project.heading"
                            as="h1" />
                        <h1 v-else class="start-title">{{ project?.name || domaincode }}</h1>
                    </Container>
                </Section>
            </template>

            <!-- ── initiative + default · the agenda ─────────────────────────── -->
            <template v-if="preset !== 'schule-project'">
                <!-- start_intro (5C) · written only on deviation; absence = no band -->
                <Section v-if="introParagraphs.length" background="default">
                    <Container>
                        <div class="start-intro">
                            <p v-for="(paragraph, i) in introParagraphs" :key="i">{{ paragraph }}</p>
                        </div>
                    </Container>
                </Section>

                <Section background="default">
                    <Container>
                        <h2 class="start-section-title">{{ agendaHeading }}</h2>

                        <!-- S3 · the promoted-first panel (option b, HD-agreed §29):
                             HEADER ONLY — the bahn-grammar promoted-next row, finally
                             cashable. The item stays in the list below (ruling ⑤:
                             featured IS the first item; „Alle Termine" untouched). -->
                        <button v-if="featured" class="start-featured" type="button" @click="openLine(featured.line)">
                            <span class="start-featured-text">
                                <span class="start-featured-overline">{{ featured.group.label }}<template
                                        v-if="featured.line.timeRange"> · {{ featured.line.timeRange }}</template></span>
                                <span class="start-featured-headline">{{ featured.line.headline }}</span>
                                <span v-if="featured.line.overline" class="start-featured-sub">{{
                                    featured.line.overline }}</span>
                            </span>
                            <img v-if="featured.line.image" class="start-featured-img" :src="featured.line.image"
                                :alt="featured.line.headline" />
                        </button>

                        <AgendaLineList v-if="lineCount > 0" :dayGroups="visibleDayGroups" density="fancy"
                            @line-click="openLine" />

                        <!-- Empty-detection · HD's wording, verbatim -->
                        <p v-else-if="!loading && !error" class="start-empty">... auf Anfrage</p>

                        <p v-if="error" class="start-error">
                            Die Agenda konnte nicht geladen werden ({{ error }}).
                        </p>
                    </Container>
                </Section>

                <!-- The insider hint · the richer agenda arrives with the r_* build -->
                <Section v-if="!user" background="muted">
                    <Container>
                        <p class="start-note">
                            Mitwirkende sehen hier nach dem
                            <RouterLink to="/login">Anmelden</RouterLink> auch die internen Termine.
                        </p>
                    </Container>
                </Section>
            </template>

            <!-- ── schule-project · honest placeholder (sfr's build, 13.11) ──── -->
            <template v-else>
                <Section background="default">
                    <Container>
                        <h2 class="start-section-title">Anmeldung</h2>
                        <p class="start-note">
                            Hier meldet sich eine Schule in ihr eigenes Projekt an.
                            Diese Funktion entsteht mit der Grundschul-Website (13.11) —
                            bis dahin: <RouterLink to="/login">Anmelden</RouterLink>.
                        </p>
                    </Container>
                </Section>
            </template>

            <!-- S4 · the aside: topic-posts as the pedia big-items idiom. For now
                 UNFILTERED (HD: repeating aside/bottom content is fine until the
                 p_event/p_topic separation bites). -->
            <template v-if="preset !== 'schule-project'" #aside>
                <Section>
                    <h2 class="start-aside-title">Blog &amp; Presse</h2>
                    <pList entity="posts" :project="domaincode" size="medium" width="inherit" columns="off"
                        onActivate="route" />
                </Section>
            </template>

            <!-- S5 · the bottom REGION (deliberately not PageBottom.vue — that is
                 the T1-γ consulting widget). Renders under BOTH columns. -->
            <template v-if="preset !== 'schule-project'" #footer>
                <!-- ① Was schon war · p_event posts as cards-gallery — the
                     events-2-posts conversion's OUTPUT (posts, never the events
                     table; posts 10/11 are the manual proof, S6→B formalizes). -->
                <Section background="muted">
                    <Container>
                        <Prose>
                            <Heading overline="Veranstaltungen" level="h2" headline="Was schon war" />
                        </Prose>
                        <pList entity="posts" :project="domaincode" size="medium" width="inherit" columns="on"
                            onActivate="route" />
                    </Container>
                </Section>
                <!-- ② unsere Aufführungen · the p_topic carrier, fullWidth region -->
                <Section v-if="topicPost" background="default">
                    <Container>
                        <Prose>
                            <Heading :overline="topicPost.teaser || 'unsere Aufführungen'" level="h2"
                                :headline="topicPost.name" />
                            <div v-if="topicHtml" v-html="topicHtml"></div>
                        </Prose>
                    </Container>
                </Section>
            </template>
        </PageLayout>

        <!-- Site notices (alpha) — HD-approved texts, utils/siteNotices.
             Outside the v-if/v-else-if chain; the renderer teleports to body. -->
        <SiteNoticePostits v-if="accessLoaded && projectAccess.canAccess.value" :domaincode="domaincode"
            surface="start" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import ProjectNotPublished from '@/views/ProjectNotPublished.vue'
import AgendaLineList from '@/components/agenda/AgendaLineList.vue'
import SiteNoticePostits from '@/components/SiteNoticePostits.vue'
import pList from '@/components/page/pList.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import { useAuth } from '@/composables/useAuth'
import { useProjectAccess } from '@/composables/useProjectAccess'
import { useAgendaLive, type AgendaLineData } from '@/composables/useAgendaPreset'
import { resolvePresetForDomain } from '@/utils/projectPreset'
import { resolveSiteFrame } from '@/utils/domainSiteFrames'
import { resolvePageStructure, type PageStructure } from '@/utils/pageStructure'

const route = useRoute()
const router = useRouter()
const { user, checkSession } = useAuth()
const projectAccess = useProjectAccess()

const domaincode = String(route.params.domaincode || '')
const { setDomainThemeOverride } = useTheme()
const accessLoaded = ref(false)
const project = ref<{ heading?: string | null; name?: string | null } | null>(null)

const preset = resolvePresetForDomain(domaincode)
const frame = resolveSiteFrame(domaincode)
const frameNavItems = computed(() => (frame?.navItems ? [...frame.navItems] : []))
const frameShowLogo = computed(() => frame?.showLogo ?? 'default')
const frameBrand = frame?.brand ?? null

const { dayGroups, lineCount, loading, error, load } = useAgendaLive(domaincode)

// ── 5C · the start pages-row's options (page_options key-registry) ──────────
const pageStructure = ref<PageStructure>({})
const startIntro = ref<string | null>(null)

/** crearis-md light: paragraphs split on blank lines — the 5C text-editor's contract. */
const introParagraphs = computed(() =>
    startIntro.value
        ? startIntro.value.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
        : [])

async function loadStartOptions() {
    try {
        const response = await fetch(`/api/pages/by-project?project_id=${encodeURIComponent(domaincode)}`)
        if (!response.ok) return
        const data = await response.json()
        const rows: Array<{ page_type?: string; page_options?: Record<string, unknown> }> = data?.pages ?? []
        const startRow = rows.find((row) => row.page_type === 'start')
        if (!startRow) return
        const options = startRow.page_options ?? {}
        pageStructure.value = resolvePageStructure(options)
        startIntro.value = typeof options.start_intro === 'string' ? options.start_intro : null
        // Beat 2 (hero-pair, §3·2) — per-PROJECT words live in the db, never as
        // preset defaults: another 'initiative' project must not inherit uia's
        // Wednesday.
        startHeading.value = typeof options.start_heading === 'string' ? options.start_heading : null
        startOverlineOption.value = typeof options.start_overline === 'string' ? options.start_overline : null
    } catch { /* absence declares the default — the registry's own rule */ }
}

const startHeading = ref<string | null>(null)
const startOverlineOption = ref<string | null>(null)

const startOverline = computed(() =>
    startOverlineOption.value
    ?? (preset === 'schule-project' ? 'Start · Anmeldung' : 'Start · Agenda'))

const agendaHeading = computed(() => (lineCount.value > 0 ? 'Alle Termine' : 'Nächste Termine'))

/**
 * The Schwelle as SILHOUETTE (HD-ruled 2026-08-07, design-thread §3·3): a
 * guest sees that internal lines EXIST — day, time, one status dot — but not
 * their content. Form without content, zero new CSS: the line component
 * renders the silhouette words like any line. Members see the full line.
 *
 * ⚠ Devbox semantics: this is a CLIENT-side transform — honest for the try,
 * not for 1.0. Before go-live the SERVER must send redacted stubs for
 * non-readable rows (the full row in the JSON payload would leak the content
 * it hides) — named in §3·3, rides the r_* Foundation fix.
 */
const visibleDayGroups = computed(() => {
    if (user.value) return dayGroups.value
    return dayGroups.value.map((group) => ({
        ...group,
        lines: group.lines.map((line) =>
            line.internal
                ? {
                    ...line,
                    headline: 'Interner Termin',
                    overline: 'für Mitwirkende · nach dem Anmelden sichtbar',
                    location: undefined,
                    who: undefined,
                    trio: undefined,
                }
                : line),
    }))
})

function openLine(line: AgendaLineData) {
    // A silhouette has no page behind it for guests.
    if (line.internal && !user.value) return
    router.push(`/sites/${domaincode}/events/${line.id}`)
}

/**
 * S3 · the promoted-first: the first upcoming, guest-visible line — ruling ⑤
 * („featured = the first item of Alle Termine") as a header-only panel. The
 * trailing undated group (date '') and past groups never lead; a silhouette
 * cannot be featured for guests.
 */
const featured = computed(() => {
    const todayIso = new Date().toISOString().slice(0, 10)
    for (const group of dayGroups.value) {
        if (!group.date || group.date < todayIso) continue
        for (const line of group.lines) {
            if (line.internal && !user.value) continue
            return { group, line }
        }
    }
    return null
})

/** S5 ② · the p_topic carrier („unsere Aufführungen") — md rendered like ProjectSite does. */
const topicPost = ref<{ id: number; name: string; teaser?: string | null; md?: string | null } | null>(null)
const topicHtml = ref('')

async function loadTopicPost() {
    try {
        const response = await fetch(`/api/posts?project=${encodeURIComponent(domaincode)}`)
        if (!response.ok) return
        const rows = (await response.json()) as Array<{ id: number; name: string; teaser?: string | null; md?: string | null; template?: string | null }>
        if (!Array.isArray(rows)) return
        const topic = rows.find((row) => row.template === 'p_topic')
        if (!topic) return
        topicPost.value = topic
        if (topic.md) {
            const { marked } = await import('marked')
            topicHtml.value = (await marked(topic.md)) as string
        }
    } catch { /* the section simply stays absent */ }
}

onMounted(async () => {
    // Site theme tokens ride the same resolved domaincode as the frame —
    // one seam, three consumers (domainSiteFrames / domainThemeOverrides).
    setDomainThemeOverride(domaincode)

    loadTopicPost()

    // The singleton trap (TempDashboard header, trap 2): checkSession BEFORE access.load.
    try { await checkSession() } catch { /* anonymous is fine */ }

    try {
        const response = await fetch(`/api/projects/${encodeURIComponent(domaincode)}`)
        if (response.ok) project.value = await response.json()
    } catch { /* the heading is chrome, not content */ }

    await projectAccess.load(domaincode)
    accessLoaded.value = true

    if (projectAccess.canAccess.value && preset !== 'schule-project') {
        load()
        loadStartOptions()
    }
})
</script>

<style scoped>
.project-start-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.start-intro p {
    margin: 0 0 0.8rem;
    font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
    line-height: 1.55;
}

.start-overline {
    margin: 0 0 0.3rem;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted-contrast);
}

.start-title {
    margin: 0;
    font-size: clamp(1.6rem, 3.2vw, 2.5rem);
    font-weight: 700;
    line-height: 1.15;
}

/* S3 · the promoted-first panel — the bahn-grammar's own move: one panel above
   the compact list. Header-only, whole panel clickable. */
.start-featured {
    display: flex;
    gap: 1.25rem;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 0 0 1.25rem;
    padding: 1rem 1.25rem;
    border: 2px solid var(--color-primary-bg);
    background-color: var(--color-card-bg);
    color: var(--color-card-contrast);
    text-align: left;
    cursor: pointer;
}

.start-featured:hover {
    background-color: color-mix(in oklch, var(--color-primary-bg) 8%, var(--color-card-bg));
}

.start-featured-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
}

.start-featured-overline {
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-contrast);
}

.start-featured-headline {
    font-size: clamp(1.25rem, 2.4vw, 1.75rem);
    font-weight: 700;
    line-height: 1.15;
}

.start-featured-sub {
    font-size: 0.9375rem;
    color: var(--color-muted-contrast);
}

.start-featured-img {
    flex-shrink: 0;
    width: clamp(8rem, 18vw, 13rem);
    height: auto;
    display: block;
}

/* S4 · the aside's chrome label */
.start-aside-title {
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
    font-weight: 700;
}

.start-section-title {
    margin: 0 0 1rem;
    font-size: clamp(1.125rem, 2vw, 1.5rem);
    font-weight: 700;
}

.start-empty {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
}

.start-note {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
}

.start-error {
    margin: 0.75rem 0 0;
    padding: 0.6rem 0.8rem;
    border-left: 4px solid var(--color-negative-bg);
    background-color: var(--color-card-bg);
    font-size: 0.875rem;
}
</style>
