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

        <!-- ==band-1== · the agenda above the vision-prose (HP 2026-07-27) ·
             DB-BOUND since 2026-08-06 (hybrid ruling, §10.8): same events store
             as /agenda, limit from content; authored rows only on outage. -->
        <Section id="agenda" background="default">
            <Container>
                <Columns>
                    <Column width="1/2">
                        <UiaTaxonomyBand :heading="agendaTeaser.heading" taxonomy="veranstaltungen" />
                        <ItemList :items="teaserItems" size="small" width="inherit" columns="off"
                            interaction="static" :dataMode="false" headingLevel="h4" @item-click="openEventItem" />
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

        <!-- ==band-3== · the closed turns + the Kernprogramm ·
             POSTS-BOUND since 2026-08-06 (HD: „posts on landing … clicking opens
             their fullview"): db posts render as cards; the authored pastArcs
             stay as the outage-fallback so the poster never blanks. -->
        <Section background="muted">
            <Container>
                <Columns>
                    <Column width="1/2">
                        <UiaTaxonomyBand heading="Was schon war" taxonomy="veranstaltungen" />
                        <div class="uia-arc-stack">
                            <template v-if="dbPostCards.length">
                                <div v-for="card in dbPostCards" :key="card.id" class="uia-arc-click" role="link"
                                    tabindex="0" @click="openPost(card.id)" @keydown.enter="openPost(card.id)">
                                    <UiaArcCard :overline="card.overline" :headline="card.headline"
                                        :body="card.body" :image="card.image" :image-alt="card.imageAlt" />
                                </div>
                            </template>
                            <template v-else>
                                <UiaArcCard v-for="arc in pastArcs" :key="arc.headline" :overline="arc.overline"
                                    :headline="arc.headline" :body="arc.body" :image="arc.image"
                                    :image-alt="arc.imageAlt" />
                            </template>
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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
// `content/agenda.ts` is the single source (now the authored OUTAGE-fallback;
// the live rows come from the same events store /agenda reads · §10.8 hybrid).
import { agendaItems } from './content/agenda'
import type { UiaListItem } from './uiaItems'
import { useUiaEvents, UIA_DOMAIN_CODE } from './useUiaEvents'
import { useUiaPosts, postRowImage } from './useUiaPosts'
import { formatUiaDay } from './uiaDates'

const router = useRouter()

// ── band-1 · the agenda teaser, db-bound (limit from content) ────────────────
const {
    items: teaserDbItems,
    rows: teaserRows,
    source: teaserSource,
    load: loadTeaser,
} = useUiaEvents()

const {
    rows: postRows,
    load: loadPosts,
} = useUiaPosts()

onMounted(() => {
    loadTeaser({ limit: agendaTeaser.limit })
    loadPosts()
})

/**
 * DB rows when the store answered; the authored agenda on outage AND on a
 * successful-but-empty answer — the landing is the Aushang, and an empty teaser
 * band on the poster would advertise nothing; the authored rows stay the
 * truthful minimum there (unlike /agenda, whose empty-state is ruled).
 */
const teaserItems = computed<UiaListItem[]>(() =>
    teaserSource.value === 'db' ? teaserDbItems.value : toListItems(agendaItems, agendaTeaser.limit))

/** Fallback rows are authored — no page behind them, so no navigation. */
function openEventItem(item: UiaListItem) {
    if (teaserSource.value !== 'db') return
    const index = teaserItems.value.indexOf(item)
    const row = index >= 0 ? teaserRows.value[index] : undefined
    if (row) router.push(`/sites/${UIA_DOMAIN_CODE}/events/${row.id}`)
}

// ── band-3 · „Was schon war" as db posts, pastArcs as outage-fallback ────────
function toPostDay(postDate: string | null | undefined): string {
    const match = postDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(postDate) : null
    if (!match) return ''
    const [, year, month, day] = match as unknown as [string, string, string, string]
    return formatUiaDay(`${day}.${month}.${year.slice(2)}`)
}

const dbPostCards = computed(() => postRows.value.map((row) => ({
    id: row.id,
    overline: [toPostDay(row.post_date), row.teaser?.trim()].filter(Boolean).join(' · '),
    headline: row.name,
    // The post's own text is the card body — the words are the collective's,
    // straight from the store (plain text; markdown markers do not occur in it).
    body: row.md?.trim() || row.subtitle?.trim() || '',
    image: postRowImage(row) ?? 'TODO HP',
    imageAlt: row.name,
})))

function openPost(id: number) {
    router.push(`/sites/${UIA_DOMAIN_CODE}/posts/${id}`)
}
</script>

<style scoped>
.uia-more {
    margin: 1rem 0 0;
    font-size: 0.9375rem;
    font-weight: 700;
}

/* A db post-card is a link to its fullview. */
.uia-arc-click {
    cursor: pointer;
}

.uia-arc-click:focus-visible {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
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
