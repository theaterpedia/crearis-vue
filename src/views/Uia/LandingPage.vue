<!--
  LandingPage · uia (Utopia in Action · Augsburg · agenda-typus) · route `/`.

  The bands, in the order `content/landing.ts` declares them. Band-based, no
  scroll choreography — this is NOT the magnifica Cutter-Spec, so no pin, no
  pause, no cover (§0.2).

  ── The cutter-commands, and how each one lands ──────────────────────────────
    ==hero==    default · full · band              → UiaHero, in PageLayout #header
    ==band-1==  default · left  · list · veranst.  → UiaDateList variant="teaser"
    ==band-1==  default · right · prose            → the invitation prose
    ==band-2==  dark    · full  · prose+highlight  → the live project
    ==band-3==  muted   · left  · cards · veranst. → the two closed arcs
    ==band-3==  muted   · right · prose · arbeitsf.→ the Kernprogramm
    ==band-4==  default · full  · cards · akteure  → who we are
    ==footer==  default · full  · band             → UiaSiteFooter (in UiaPageFrame)

  ── `section: dark` → `Section background="accent"` ──────────────────────────
  `Section` takes `default | muted | accent` — there is no `dark`. `accent` IS
  the charcoal band theaterpedia uses for its Pipeline block
  (`Home/HomeComponents/ProjectsShowcaseSection.vue:10`), and in theme 3 with
  `inverted: false` `accent-bg` computes to L≈0.28 — dark. So `dark` is a naming
  difference, not a missing knob. Recorded in the §6 pulse-back.

  ── The two columns live INSIDE each Section (§5) ────────────────────────────
  `Columns`/`Column` per band. NOT PageLayout's aside — see UiaPageFrame for why
  `setSiteLayout="centered"` makes that the only option.
-->

<template>
    <UiaPageFrame :title="pageTitle" navbarMode="home">
        <template #header>
            <UiaHero :overline="hero.overline" :headline="hero.headline" :action="hero.action" :image="hero.image"
                :image-alt="hero.imageAlt" :focal="hero.focal" />
        </template>

        <!-- ==band-1== · the agenda above the vision-prose (HP 2026-07-27) -->
        <Section id="agenda" background="default">
            <Container>
                <Columns>
                    <Column width="1/2">
                        <UiaTaxonomyBand :heading="agendaTeaser.heading" taxonomy="veranstaltungen" />
                        <!-- theaterpedia's own row rendering, reused: `items` + no
                             `entity` + dataMode false = no fetch. See ./uiaItems.ts. -->
                        <ItemList :items="teaserItems" size="small" width="inherit" columns="off"
                            interaction="static" :dataMode="false" headingLevel="h4" />
                        <p class="uia-more">
                            <router-link :to="agendaTeaser.link.href">{{ agendaTeaser.link.label }}</router-link>
                        </p>
                    </Column>

                    <Column width="auto">
                        <UiaTaxonomyBand :overline="invitation.overline" :heading="invitation.headline" />
                        <Prose>
                            <p v-for="(paragraph, i) in invitation.prose" :key="i">{{ paragraph }}</p>
                            <!-- The Ungerechtigkeit-triad · a short list, not prose (content-file note) -->
                            <ul>
                                <li v-for="theme in invitation.themes" :key="theme">{{ theme }}</li>
                            </ul>
                            <p>{{ invitation.close }}</p>
                        </Prose>
                    </Column>
                </Columns>
            </Container>
        </Section>

        <!-- ==band-2== · the live turn of the arc · the page's strongest surface -->
        <Section background="accent">
            <Container>
                <UiaTaxonomyBand :overline="liveProject.overline" :heading="liveProject.headline" />
                <p class="uia-live-subline">{{ liveProject.subline }}</p>

                <Columns>
                    <Column width="1/2">
                        <!-- Their question-block from the flyer's reverse. THIS is the
                             gap-material: set apart, larger, last line carrying the weight. -->
                        <ul class="uia-questions">
                            <li v-for="(question, i) in liveProject.questions" :key="i"
                                :class="{ 'uia-question-last': i === liveProject.questions.length - 1 }">
                                {{ question }}
                            </li>
                        </ul>
                    </Column>
                    <Column width="auto">
                        <Prose>
                            <p v-for="(paragraph, i) in liveProject.prose" :key="i">{{ paragraph }}</p>
                        </Prose>
                    </Column>
                </Columns>

                <!-- ==band-2-highlight== · deadline AND threshold -->
                <UiaHighlight :text="liveProject.highlight" />

                <p class="uia-more">
                    <router-link :to="liveProject.link.href">{{ liveProject.link.label }}</router-link>
                </p>
            </Container>
        </Section>

        <!-- ==band-3== · the closed turns + the Kernprogramm -->
        <Section background="muted">
            <Container>
                <Columns>
                    <Column width="1/2">
                        <UiaTaxonomyBand heading="Was schon war" taxonomy="veranstaltungen" />
                        <div class="uia-arc-stack">
                            <UiaArcCard v-for="arc in pastArcs" :key="arc.headline" :overline="arc.overline"
                                :headline="arc.headline" :body="arc.body" :image="arc.image"
                                :image-alt="arc.imageAlt" />
                        </div>
                    </Column>

                    <Column width="auto">
                        <UiaTaxonomyBand :overline="workingForms.overline" :heading="workingForms.headline"
                            taxonomy="arbeitsformen" />
                        <Prose>
                            <p>{{ workingForms.prose }}</p>
                            <ul>
                                <li v-for="form in workingForms.forms" :key="form">{{ form }}</li>
                            </ul>
                        </Prose>
                    </Column>
                </Columns>
            </Container>
        </Section>

        <!-- ==band-4== · Akteure · yellow -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand :overline="actors.overline" :heading="actors.headline" taxonomy="akteure" />
                <Prose>
                    <p>{{ actors.prose }}</p>
                </Prose>
                <UiaActors :people="actors.people" :orgs="actors.orgs" />
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
import UiaHighlight from './UiaHighlight.vue'
import UiaArcCard from './UiaArcCard.vue'
import UiaActors from './UiaActors.vue'
import { toListItems } from './uiaItems'
import {
    pageTitle,
    hero,
    agendaTeaser,
    invitation,
    liveProject,
    pastArcs,
    workingForms,
    actors,
} from './content/landing'
// The dated rows live with the agenda, not duplicated into the landing —
// `content/agenda.ts` is the single source.
import { agendaItems } from './content/agenda'

/** The first `agendaTeaser.limit` rows, with the `TODO HP` cimg-markers stripped. */
const teaserItems = computed(() => toListItems(agendaItems, agendaTeaser.limit))
</script>

<style scoped>
.uia-more {
    margin: 1rem 0 0;
    font-size: 0.9375rem;
    font-weight: 700;
}

.uia-live-subline {
    margin: 0 0 1.25rem;
    font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
    font-weight: 300;
}

/* Their question-block · set apart, larger, the last line carrying the weight. */
.uia-questions {
    margin: 0;
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

.uia-arc-stack {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
}
</style>
