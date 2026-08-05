<!--
  AgendaPage · uia · route `/agenda` — DB-DRIVEN since HD's 2026-08-06 round.

  „It should run fully dynamically as soon as the page is online, so content
  needs to come from db + only db-bound components can be used, therefore we
  maximally reduced it." (HD, uia thread §10.7. The July full-depth page was the
  shape-finding sketch — it lives on origin/alpha/uia; this is the target.)

  ── The page, maximally reduced ───────────────────────────────────────────────
    hero        → the project's own heading (db), authored chrome as fallback
    featured    → the FIRST item of „Alle Termine" (HD ruling ⑤), as a band:
                  date-line · name · teaser · wide image · link to its own page
    the list    → „Alle Termine" central; empty-detection renders
                  „Nächste Termine" + one row „... auf Anfrage" (HD, verbatim)
    posts       → „Was schon war" — db posts; clicking opens the fullview
    (forum / flinta / kernprogramm / beitrag: not db-bound → not on this page)

  ── Fallback discipline (transport failure ONLY) ──────────────────────────────
  The authored content keeps the page truthful when the backend does not answer:
  the list falls back to `agendaItems`, the posts band to `closedArcs`. A
  SUCCESSFUL empty answer is a real state and renders the empty-detection —
  see useUiaEvents/useUiaPosts.

  ── Detail pages ──────────────────────────────────────────────────────────────
  Rows navigate to `/sites/utopiaxaction/{events,posts}/:id` — EventPage /
  PostPage (mainline components, reused not rebuilt) carry view + edit; a
  logged-in owner (Rosa) edits, anonymous reads. Navigation only fires for db
  rows — authored fallback rows have no page behind them.
-->

<template>
    <UiaPageFrame :title="pageTitle">
        <template #header>
            <UiaHero :overline="hero.overline" :headline="pageHeadline" />
        </template>

        <!-- ==featured== · the first item of „Alle Termine" (HD ruling ⑤) -->
        <Section v-if="featured" background="accent">
            <Container>
                <UiaTaxonomyBand :overline="featuredOverline" :heading="featured.name" />
                <p v-if="featuredSubline" class="uia-featured-subline">{{ featuredSubline }}</p>
                <UiaImage v-if="featuredImage" :src="featuredImage" :alt="featured.name" ratio="wide" />
                <p class="uia-featured-link">
                    <a :href="eventPath(featured)" @click.prevent="openEventRow(featured)">→ mehr erfahren &amp; anmelden</a>
                </p>
            </Container>
        </Section>

        <!-- ==agenda-rows== · „Alle Termine", central · empty-detection per HD -->
        <Section background="default">
            <Container>
                <UiaTaxonomyBand :heading="listHeading" taxonomy="veranstaltungen" />
                <ItemList :items="listRows" size="small" width="inherit" columns="off"
                    interaction="static" :dataMode="false" headingLevel="h3" @item-click="openEventItem" />
                <!-- Dev-only marker. The fallback keeps the page correct, but it must
                     not be able to hide that the events endpoint stopped answering. -->
                <p v-if="showSourceMarker" class="uia-source-marker">
                    {{ sourceMarkerText }}
                </p>
            </Container>
        </Section>

        <!-- ==posts== · „Was schon war" · db posts, closedArcs only as outage-fallback -->
        <Section v-if="showPostsBand" background="muted">
            <Container>
                <UiaTaxonomyBand heading="Was schon war" taxonomy="veranstaltungen" />
                <ItemList v-if="!postsFallback" :items="postItems" size="small" width="inherit" columns="off"
                    interaction="static" :dataMode="false" headingLevel="h3" @item-click="openPostItem" />
                <div v-else class="uia-closed-grid">
                    <UiaArcCard v-for="arc in closedArcs" :key="arc.headline" :overline="arc.overline"
                        :headline="arc.headline" :subline="arc.subline" :body="arc.body"
                        :performance="arc.performance" :image="arc.image" :image-alt="arc.imageAlt" />
                </div>
            </Container>
        </Section>
    </UiaPageFrame>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import ItemList from '@/components/clist/ItemList.vue'
import UiaPageFrame from './UiaPageFrame.vue'
import UiaHero from './UiaHero.vue'
import UiaTaxonomyBand from './UiaTaxonomyBand.vue'
import UiaImage from './UiaImage.vue'
import UiaArcCard from './UiaArcCard.vue'
import type { UiaListItem } from './uiaItems'
import {
    useUiaEvents,
    eventDateLine,
    eventRowImage,
    UIA_DOMAIN_CODE,
    type CvEventRow,
} from './useUiaEvents'
import { useUiaPosts, type CvPostRow } from './useUiaPosts'
import { pageTitle, hero, closedArcs } from './content/agenda'

const router = useRouter()

const {
    items: agendaRows,
    rows: eventRows,
    isFallback,
    isEmpty,
    error: agendaError,
    load: loadAgenda,
} = useUiaEvents()

const {
    rows: postRows,
    items: postItems,
    isEmpty: postsEmpty,
    isFallback: postsFallback,
    load: loadPosts,
} = useUiaPosts()

/** The project's own heading (db) — authored chrome until it answers. */
const projectHeadline = ref<string | null>(null)

onMounted(async () => {
    loadAgenda()
    loadPosts()
    try {
        const response = await fetch(`/api/projects/${UIA_DOMAIN_CODE}`)
        if (response.ok) {
            const data = await response.json()
            const heading = (data.heading || data.name || '') as string
            // projects.heading is crearis-md — the hero prints plain text.
            projectHeadline.value = heading.replace(/\*\*/g, '').trim() || null
        }
    } catch { /* authored fallback stays */ }
})

const pageHeadline = computed(() => projectHeadline.value || hero.headline)

// ── featured · always the first item of „Alle Termine" (HD ruling ⑤) ────────
const featured = computed<CvEventRow | null>(() => eventRows.value[0] ?? null)
const featuredOverline = computed(() => {
    if (!featured.value) return ''
    return eventDateLine(featured.value) || featured.value.teaser?.trim() || ''
})
/** When the date-line leads, the teaser still gets said — as the subline. */
const featuredSubline = computed(() => {
    if (!featured.value) return null
    return eventDateLine(featured.value) ? featured.value.teaser?.trim() || null : null
})
const featuredImage = computed(() => {
    if (!featured.value) return undefined
    return featured.value.img_wide?.url || eventRowImage(featured.value)
})

// ── empty-detection (HD 2026-08-06, wording verbatim) ───────────────────────
const listHeading = computed(() => (isEmpty.value ? 'Nächste Termine' : 'Alle Termine'))
const emptyRow: UiaListItem[] = [{ heading: '**... auf Anfrage**' }]
const listRows = computed(() => (isEmpty.value ? emptyRow : agendaRows.value))

// ── posts band · hidden when the store answers empty ────────────────────────
const showPostsBand = computed(() => !postsEmpty.value && (postItems.value.length > 0 || postsFallback.value))

// ── navigation · into the EXISTING detail pages, never a second editor ──────
function eventPath(row: CvEventRow): string {
    return `/sites/${UIA_DOMAIN_CODE}/events/${row.id}`
}

function openEventRow(row: CvEventRow) {
    router.push(eventPath(row))
}

/** Fallback rows are authored — they have no page behind them, so no push. */
function openEventItem(item: UiaListItem) {
    const index = listRows.value.indexOf(item)
    const row = index >= 0 ? eventRows.value[index] : undefined
    if (row) openEventRow(row)
}

function openPostItem(item: UiaListItem) {
    const index = postItems.value.indexOf(item)
    const row: CvPostRow | undefined = index >= 0 ? postRows.value[index] : undefined
    if (row) router.push(`/sites/${UIA_DOMAIN_CODE}/posts/${row.id}`)
}

/** Dev-only: never let the fallback silently mask a dead endpoint. */
const showSourceMarker = computed(() => import.meta.env.DEV && isFallback.value)

const sourceMarkerText = computed(() =>
    '⚠ dev · agenda from content/agenda.ts (fallback) — /api/events did not answer usefully'
    + `${agendaError.value ? `: ${agendaError.value}` : ''}`,
)
</script>

<style scoped>
.uia-featured-subline {
    margin: 0 0 1.1rem;
    font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
    font-weight: 300;
}

.uia-featured-link {
    margin: 1rem 0 0;
    font-size: 1rem;
    font-weight: 700;
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
