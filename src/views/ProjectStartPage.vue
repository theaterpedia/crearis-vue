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

        <PageLayout v-else-if="accessLoaded" :navItems="frameNavItems" :showLogo="frameShowLogo" :brand="frameBrand">
            <template #header>
                <Section background="accent">
                    <Container>
                        <p class="start-overline">{{ startOverline }}</p>
                        <HeadingParser v-if="project?.heading" class="start-title" :content="project.heading"
                            as="h1" />
                        <h1 v-else class="start-title">{{ project?.name || domaincode }}</h1>
                    </Container>
                </Section>
            </template>

            <!-- ── initiative + default · the agenda ─────────────────────────── -->
            <template v-if="preset !== 'schule-project'">
                <Section background="default">
                    <Container>
                        <h2 class="start-section-title">{{ agendaHeading }}</h2>

                        <AgendaLineList v-if="lineCount > 0" :dayGroups="dayGroups" density="fancy"
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
        </PageLayout>
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
import { useAuth } from '@/composables/useAuth'
import { useProjectAccess } from '@/composables/useProjectAccess'
import { useAgendaLive, type AgendaLineData } from '@/composables/useAgendaPreset'
import { resolvePresetForDomain } from '@/utils/projectPreset'
import { resolveSiteFrame } from '@/utils/domainSiteFrames'

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

const startOverline = computed(() =>
    preset === 'schule-project' ? 'Start · Anmeldung' : 'Start · Agenda')

const agendaHeading = computed(() => (lineCount.value > 0 ? 'Alle Termine' : 'Nächste Termine'))

function openLine(line: AgendaLineData) {
    router.push(`/sites/${domaincode}/events/${line.id}`)
}

onMounted(async () => {
    // Site theme tokens ride the same resolved domaincode as the frame —
    // one seam, three consumers (domainSiteFrames / domainThemeOverrides).
    setDomainThemeOverride(domaincode)

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
    }
})
</script>

<style scoped>
.project-start-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
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
