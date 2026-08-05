<!--
  AgendaPage · uia · route `/agenda` · the ONE content-page this round (§1).

  Candidates were `/agenda` and a `/meine-grenzen` project-page; they collapse,
  because an agenda-site's agenda IS its live project plus the closed ones
  (`content/agenda.ts` header). So: one arc live, the finished ones closed behind
  it — never a flat date-list.

  ── SIMPLIFIED per HD's ruling, 2026-08-06 (uia thread §10.5) ─────────────────
  Dropped from this page (the DATA stays in content/agenda.ts, unrendered):
    „Was ansteht" heading  → the fetched list is now central, headed „Alle Termine"
    „Beitrag" tiers        → dropped
    „Unser Kernprogramm"   → dropped
    „Zwei Modi" (FLINTA)   → dropped
  The 15-Mittwochs date-run (which carried „Alle Termine" until now) is
  Meine-Grenzen material and folds into the featured band — FABLE's cut, pulsed
  back in the thread. Empty-detection: a successful-but-empty answer renders
  „Nächste Termine" + one row „... auf Anfrage" (HD's wording, verbatim).
  The featured event is ruled to always be the FIRST item of „Alle Termine" —
  binding flagged in §10.5 (today's DB fixture cannot satisfy it yet).

  ── The cutter-commands (as they stand after the ruling) ──────────────────────
    ==page-hero==    default · full · band               → UiaHero
    ==live==         dark    · full · prose+highlight+run → the featured turn, at
                     depth, now incl. the 15-Mittwochs run + performance + venue
    ==agenda-rows==  default · full · list · veranst.     → „Alle Termine", central
    ==closed==       muted   · full · cards · veranst.    → the finished turns
    ==forum==        default · full · prose               → what Forum-Theater is

  `section: dark` → `Section background="accent"` — see LandingPage.vue for why.
-->

<template>
    <UiaPageFrame :title="pageTitle">
        <template #header>
            <UiaHero :overline="hero.overline" :headline="hero.headline" :teaser="hero.teaser" />
        </template>

        <!-- ==live== · the live turn -->
        <Section background="accent">
            <Container>
                <UiaTaxonomyBand :overline="live.overline" :heading="live.headline" />
                <p class="uia-live-subline">{{ live.subline }}</p>

                <Columns>
                    <Column width="1/2">
                        <ul class="uia-questions">
                            <li v-for="(question, i) in live.questions" :key="i"
                                :class="{ 'uia-question-last': i === live.questions.length - 1 }">
                                {{ question }}
                            </li>
                        </ul>
                        <UiaImage :src="live.image" :alt="live.imageAlt" :focal="live.focal" ratio="wide" />
                    </Column>
                    <Column width="auto">
                        <Prose>
                            <p v-for="(paragraph, i) in live.prose" :key="i">{{ paragraph }}</p>
                        </Prose>
                    </Column>
                </Columns>

                <!-- ==live-dates== · the 15 Mittwochs, folded in here 2026-08-06:
                     they are THIS project's dates, and „Alle Termine" now names
                     the fetched list below, not this run. -->
                <UiaDateList :dates="live.dates" :time="live.time" />
                <!-- The public beat that closes the arc · not a Mittwoch, so
                     not run through the date-parser (`vsl.` is part of the date). -->
                <p class="uia-performance">
                    <span class="uia-performance-label">{{ live.performance.label }}</span>
                    <span class="uia-performance-date">{{ live.performance.date }}</span>
                </p>
                <p class="uia-venue">{{ live.venue }}</p>

                <!-- ==live-highlight== · the deadline and the threshold -->
                <UiaHighlight :text="live.highlight" />
                <p class="uia-registration">
                    Anmeldung:
                    <a :href="`mailto:${live.registration.email}`">{{ live.registration.email }}</a>
                </p>
            </Container>
        </Section>

        <!-- ==agenda-rows== · „Alle Termine", central (HD 2026-08-06) · DB-backed.
             Empty answer → „Nächste Termine" + „... auf Anfrage", never a blank. -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand :heading="listHeading" taxonomy="veranstaltungen" />
                <ItemList :items="listRows" size="small" width="inherit" columns="off"
                    interaction="static" :dataMode="false" headingLevel="h3" />
                <!-- Dev-only marker. The fallback keeps the page correct, but it must
                     not be able to hide that the events endpoint stopped answering. -->
                <p v-if="showSourceMarker" class="uia-source-marker">
                    {{ sourceMarkerText }}
                </p>
            </Container>
        </Section>

        <!-- ==closed== · the finished turns · „grün abgeschlossen", never red -->
        <Section background="muted">
            <Container>
                <UiaTaxonomyBand heading="Was schon war" taxonomy="veranstaltungen" />
                <div class="uia-closed-grid">
                    <UiaArcCard v-for="arc in closedArcs" :key="arc.headline" :overline="arc.overline"
                        :headline="arc.headline" :subline="arc.subline" :body="arc.body"
                        :performance="arc.performance" :image="arc.image" :image-alt="arc.imageAlt" />
                </div>
            </Container>
        </Section>

        <!-- ==forum== · what a Forum-Theater Aufführung actually is -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand :overline="forumTheater.overline" :heading="forumTheater.headline" />
                <Prose>
                    <p v-for="(paragraph, i) in forumTheater.prose" :key="i">{{ paragraph }}</p>
                    <p>{{ forumTheater.tickets }}</p>
                </Prose>
            </Container>
        </Section>

        <!-- ==flinta== dropped from this page per HD 2026-08-06 („Zwei Modi, klar
             unterschieden"). The content stays in content/agenda.ts — the words
             are the collective's; only the rendering was ruled. -->
    </UiaPageFrame>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import ItemList from '@/components/clist/ItemList.vue'
import UiaPageFrame from './UiaPageFrame.vue'
import UiaHero from './UiaHero.vue'
import UiaTaxonomyBand from './UiaTaxonomyBand.vue'
import UiaDateList from './UiaDateList.vue'
import UiaHighlight from './UiaHighlight.vue'
import UiaImage from './UiaImage.vue'
import UiaArcCard from './UiaArcCard.vue'
import { useUiaEvents } from './useUiaEvents'
import type { UiaListItem } from './content/agenda'
import {
    pageTitle,
    hero,
    live,
    closedArcs,
    forumTheater,
} from './content/agenda'

/**
 * Task A · the agenda rows come from CV's own `events` table, via
 * `/api/events?project=utopiaxaction` — the SAME endpoint `EventPanel` writes to,
 * so an edit made while logged in shows up here. (The first cut read
 * `/api/odoo/events`; that is an admin-only, unscoped, read-only surface — wrong
 * road for uia. Odoo stays in the picture as a 2-way sync *behind* this endpoint.)
 *
 * `useUiaEvents` seeds itself with the authored `agendaItems` synchronously, so
 * this band is never empty, then swaps in the DB rows once they arrive. If the
 * endpoint does not answer it keeps the authored rows — see the composable for
 * why that is a deliberate fallback rather than a swallowed error.
 *
 * 🚩 The Wednesday-slot editorial flag under `agendaItems` still stands: the
 * Kernprogramm and „Meine Grenzen" claim the same mittwochs 19–21 slot. Whether
 * that shows up here now depends on what is in the DB — it is the owners'
 * question either way, and is not resolved by guessing.
 */
// Destructured so the refs are top-level template bindings and Vue auto-unwraps
// them — `agenda.items.value` in a template would be a nested-ref trap.
const {
    items: agendaRows,
    isFallback,
    isEmpty,
    error: agendaError,
    load: loadAgenda,
} = useUiaEvents()

onMounted(() => {
    loadAgenda()
})

/**
 * Empty-detection (HD 2026-08-06, wording verbatim): when a successful answer
 * holds nothing upcoming, the heading reads „Nächste Termine" instead of
 * „Alle Termine", and one row says „... auf Anfrage". Chrome, not owner-content.
 */
const listHeading = computed(() => (isEmpty.value ? 'Nächste Termine' : 'Alle Termine'))

const emptyRow: UiaListItem[] = [{ heading: '**... auf Anfrage**' }]

const listRows = computed(() => (isEmpty.value ? emptyRow : agendaRows.value))

/** Dev-only: never let the fallback silently mask a dead endpoint. */
const showSourceMarker = computed(() => import.meta.env.DEV && isFallback.value)

const sourceMarkerText = computed(() =>
    '⚠ dev · agenda from content/agenda.ts (fallback) — /api/events did not answer usefully'
    + `${agendaError.value ? `: ${agendaError.value}` : ''}`,
)
</script>

<style scoped>
.uia-live-subline {
    margin: 0 0 1.25rem;
    font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
    font-weight: 300;
}

/* Their question-block · set apart, larger, the last line carrying the weight. */
.uia-questions {
    margin: 0 0 1.5rem;
    padding: 0;
    list-style: none;
}

.uia-questions li {
    margin: 0 0 0.6rem;
    font-size: clamp(1.125rem, 2.6vw, 1.625rem);
    font-weight: 300;
    line-height: 1.3;
}

.uia-question-last {
    font-weight: 700;
}

.uia-registration {
    margin: 0.9rem 0 0;
    font-size: 0.9375rem;
}

/* ==Performance== · the arc's public close, given its own weight */
.uia-performance {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
    margin: 0.9rem 0 0;
    padding: 0.6rem 0.8rem;
    background-color: var(--color-muted-bg);
    font-size: 0.9375rem;
}

.uia-performance-label {
    font-weight: 700;
}

.uia-venue {
    margin: 0.7rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-muted-contrast);
}

.uia-closed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
    gap: 1.1rem;
}

/* Dev-only source marker. Loud on purpose — it should be impossible to demo a
   fallback-rendered agenda without noticing. */
.uia-source-marker {
    margin: 0.9rem 0 0;
    padding: 0.4rem 0.7rem;
    border-left: 4px solid var(--color-warning-bg);
    background-color: color-mix(in oklch, var(--color-warning-bg) 12%, transparent);
    font-size: 0.75rem;
    line-height: 1.4;
}
</style>
