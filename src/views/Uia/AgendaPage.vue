<!--
  AgendaPage · uia · route `/agenda` · the ONE content-page this round (§1).

  Candidates were `/agenda` and a `/meine-grenzen` project-page; they collapse,
  because an agenda-site's agenda IS its live project plus the closed ones
  (`content/agenda.ts` header). So: one arc live, the finished ones closed behind
  it — never a flat date-list.

  ── The cutter-commands ───────────────────────────────────────────────────────
    ==page-hero==    default · full · band              → UiaHero
    ==live==         dark    · full · prose+highlight    → the live turn, at depth
    ==kernprogramm== default · full · prose · arbeitsf.  → the weekly rhythm
    ==closed==       muted   · full · cards · veranst.   → the finished turns
    ==forum==        default · full · prose              → what Forum-Theater is
    ==flinta==       muted   · full · prose              → the two modes

  `section: dark` → `Section background="accent"` — see LandingPage.vue for why.

  ── The landing teases, this page books ───────────────────────────────────────
  Same live project as the landing's band-2, at full depth: all 15 Mittwochs, the
  venue, the Abschluss-Aufführung, the Beitrag tiers, the registration address.

  ── Open, deliberately not invented ───────────────────────────────────────────
  `kernprogramm.beitrag` is `null` pending the owners (drop-in vs. Reihe is
  unknown; only per-project tiers exist in the material). The block renders
  without it rather than with a made-up number.
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

                <!-- ==live-highlight== · the deadline and the threshold -->
                <UiaHighlight :text="live.highlight" />
                <p class="uia-registration">
                    Anmeldung:
                    <a :href="`mailto:${live.registration.email}`">{{ live.registration.email }}</a>
                </p>
            </Container>
        </Section>

        <!-- ==agenda-rows== · what a visitor can act on · ItemList, reused -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand heading="Was ansteht" taxonomy="veranstaltungen" />
                <ItemList :items="rows" size="small" width="inherit" columns="off" interaction="static"
                    :dataMode="false" headingLevel="h3" />
            </Container>
        </Section>

        <!-- ==live-dates== · the 15 Mittwochs of the one project, as a run -->
        <Section background="default">
            <Container>
                <Columns>
                    <Column width="1/2">
                        <UiaTaxonomyBand heading="Alle Termine" taxonomy="veranstaltungen" />
                        <UiaDateList :dates="live.dates" :time="live.time" />
                        <!-- The public beat that closes the arc · not a Mittwoch, so
                             not run through the date-parser (`vsl.` is part of the date). -->
                        <p class="uia-performance">
                            <span class="uia-performance-label">{{ live.performance.label }}</span>
                            <span class="uia-performance-date">{{ live.performance.date }}</span>
                        </p>
                        <p class="uia-venue">{{ live.venue }}</p>
                    </Column>

                    <!-- ==live-beitrag== · their 2026 vocabulary -->
                    <Column width="auto">
                        <UiaTaxonomyBand heading="Beitrag" :overline="live.beitrag.note" />
                        <ul class="uia-tiers">
                            <li v-for="tier in live.beitrag.tiers" :key="tier.label" class="uia-tier">
                                <span class="uia-tier-amount">{{ tier.amount }}</span>
                                <span class="uia-tier-label">{{ tier.label }}</span>
                                <span class="uia-tier-per">{{ tier.per }}</span>
                            </li>
                        </ul>
                        <Prose>
                            <p>{{ live.beitrag.soli }}</p>
                        </Prose>
                    </Column>
                </Columns>
            </Container>
        </Section>

        <!-- ==kernprogramm== · the weekly rhythm under the projects · green -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand :overline="kernprogramm.overline" :heading="kernprogramm.headline"
                    taxonomy="arbeitsformen" />
                <Prose>
                    <p>{{ kernprogramm.prose }}</p>
                    <p>{{ kernprogramm.registration }}</p>
                    <p v-if="kernprogramm.beitrag">{{ kernprogramm.beitrag }}</p>
                </Prose>
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

        <!-- ==flinta== · load-bearing and theirs · two modes, stated plainly -->
        <Section background="muted">
            <Container>
                <UiaTaxonomyBand :overline="flinta.overline" :heading="flinta.headline" />
                <dl class="uia-modes">
                    <template v-for="mode in flinta.modes" :key="mode.label">
                        <dt class="uia-mode-label">{{ mode.label }}</dt>
                        <dd class="uia-mode-body">{{ mode.body }}</dd>
                    </template>
                </dl>
                <Prose>
                    <p class="uia-flinta-note">{{ flinta.note }}</p>
                </Prose>
            </Container>
        </Section>
    </UiaPageFrame>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { toListItems } from './uiaItems'
import {
    pageTitle,
    hero,
    live,
    agendaItems,
    kernprogramm,
    closedArcs,
    forumTheater,
    flinta,
} from './content/agenda'

/**
 * Every agenda row, `TODO HP` cimg-markers stripped so ItemRow never gets a
 * broken `<img src>`. No `limit` here — the landing teases, this page shows all.
 *
 * 🚩 Row 3 (the Kernprogramm) carries the editorial flag under `agendaItems`:
 * it and „Meine Grenzen" claim the same Wednesday slot, and from 23.09.26 the
 * project owns that Wednesday for 15 weeks. That is the owners' question. It is
 * rendered as written and not resolved by guessing here.
 */
const rows = computed(() => toListItems(agendaItems))
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

/* ==Beitrag tiers== */
.uia-tiers {
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
}

.uia-tier {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.75rem;
    align-items: baseline;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--color-border);
}

.uia-tier-amount {
    min-width: 4.5rem;
    font-size: 1.0625rem;
    font-weight: 700;
}

.uia-tier-label {
    flex: 1 1 auto;
    font-size: 0.9375rem;
}

.uia-tier-per {
    font-size: 0.8125rem;
    color: var(--color-muted-contrast);
}

.uia-closed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
    gap: 1.1rem;
}

/* ==FLINTA*+ modes== */
.uia-modes {
    margin: 0 0 1rem;
}

.uia-mode-label {
    margin: 0.9rem 0 0.2rem;
    font-size: 1rem;
    font-weight: 700;
}

.uia-mode-body {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.55;
}

.uia-flinta-note {
    font-size: 0.8125rem;
    color: var(--color-muted-contrast);
}
</style>
