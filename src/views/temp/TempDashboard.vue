<!--
  TempDashboard · `/sites/:domaincode/tempdashboard`
  ══════════════════════════════════════════════════

  An **intermediary** surface (HD 2026-07-28): list events, list posts, add-new,
  delete. Deliberately temporary — it exists so uia's content can be driven from
  a browser while the real dashboard's beta-implementation catches up.

  ── What it is NOT ───────────────────────────────────────────────────────────
  ⛔ It is **not** a second `/projects` dashboard. HD, explicitly: *"no other
  implementation may go there. Eventual parallel implementation should go to a new
  temp-route."* `/projects` renders the project listing and is set up properly;
  nothing under `views/project/**` is touched by this file, and this route is
  purely additive.

  ⛔ It is **not** a second editor. Rows link into `/sites/:code/events/:id` and
  `/sites/:code/posts/:id`, which `EventPage.vue` / `PostPage.vue` already handle
  for view+edit. Creating and deleting is all that happens here.

  ── Reuse, not rebuild ───────────────────────────────────────────────────────
  `ItemList` with `:items` and no `entity` does not fetch (`dataModeActive` is
  gated on `props.entity`/`props.images`), so it renders theaterpedia's own row
  shape from rows we supply. Two of its affordances do the work here:

    · `interaction="static"` binds `@trash` → `ItemList` emits `item-trash`
    · a row opts into the trash icon via `props.options = { trash: true }`
      (`ItemRow.vue:125` · `showTrash = props.options?.trash === true`)

  So delete is a first-class affordance `ItemRow` already ships — no parallel row
  component, no second list.

  Event headings reuse `composeHeading()` from `views/Uia/useUiaEvents.ts`. That
  function is generic (it takes a `CvEventRow` and knows nothing about uia), and
  importing it from a uia folder into a generic view is a layering wart — but
  duplicating it would be worse, and lifting it is a refactor of the live agenda's
  read path for the sake of a temp component. **Flagged, not fixed:** it wants
  lifting to a shared module alongside the same treatment `WORKFLOW_MASK` needs.

  ── Two traps this file is written around ────────────────────────────────────
  1. **Headings are TWO parts, never three.** `Heading.vue` gates
     `hasSubline = !hasOverline && …`, so `"overline **HEAD** subline"` silently
     drops the third part — by design (HD), and a validator now rejects the
     three-part form on write. Both composers here emit `overline **HEADLINE**`.
  2. **`useProjectAccess` reads `useAuth()`'s singleton, not a local ref.** That
     singleton is populated only by an explicit `checkSession()`. Skipping it is
     exactly the bug that made `ProjectSite.vue` show its own owner
     "Projekt nicht veröffentlicht", so `checkSession()` is awaited here BEFORE
     `projectAccess.load()`.

  `/api/events` and `/api/posts` both return a **bare array** of raw rows — no
  `{ success, … }` envelope.
-->

<template>
    <div class="temp-dashboard">
        <Section background="default">
            <Container>
                <p class="td-flag">
                    intermediary surface · <code>/sites/{{ domaincode }}/tempdashboard</code>
                </p>
                <!-- `projects.heading` holds a crearis-md string, so it goes through
                     HeadingParser. Printing it raw showed literal `**` in the browser —
                     caught by screenshot, not by any test. -->
                <HeadingParser class="td-title" :content="projectLabel" as="h1" />
                <p v-if="loadError" class="td-error">{{ loadError }}</p>
            </Container>
        </Section>

        <!-- Access · owner/member only, same gate the site uses -->
        <Section v-if="accessLoaded && !canAccess" background="muted">
            <Container>
                <h2 class="td-section-title">Kein Zugriff</h2>
                <p class="td-note">
                    Dieses Projekt ist nicht öffentlich, und du bist weder Owner noch Mitglied.
                    Melde dich als berechtigte Person an.
                </p>
                <p v-if="denyReason" class="td-note td-dim">{{ denyReason }}</p>
            </Container>
        </Section>

        <template v-else-if="accessLoaded">
            <!-- ══ Events ══ -->
            <Section background="default">
                <Container>
                    <div class="td-head">
                        <h2 class="td-section-title">Veranstaltungen <span class="td-count">{{ events.length }}</span></h2>
                        <button class="td-btn" type="button" @click="showEventForm = !showEventForm">
                            {{ showEventForm ? 'abbrechen' : '+ neue Veranstaltung' }}
                        </button>
                    </div>

                    <form v-if="showEventForm" class="td-form" @submit.prevent="createEvent">
                        <label class="td-field">
                            <span>Name *</span>
                            <input v-model.trim="eventForm.name" required placeholder="Theatrales Mischpult" />
                        </label>
                        <label class="td-field">
                            <span>Beginn</span>
                            <input v-model="eventForm.date_begin" type="datetime-local" />
                        </label>
                        <label class="td-field">
                            <span>Ende</span>
                            <input v-model="eventForm.date_end" type="datetime-local" />
                        </label>
                        <label class="td-field">
                            <span>Status</span>
                            <select v-model.number="eventForm.status">
                                <option v-for="s in statusChoices" :key="s.value" :value="s.value">
                                    {{ s.label }} ({{ s.value }})
                                </option>
                            </select>
                        </label>
                        <button class="td-btn td-btn-primary" type="submit" :disabled="busy">anlegen</button>
                    </form>

                    <p v-if="!events.length" class="td-note td-dim">Noch keine Veranstaltungen.</p>
                    <ItemList v-else :items="eventItems" size="small" width="inherit" columns="off"
                        interaction="static" :dataMode="false" headingLevel="h4" @item-click="openEvent"
                        @item-trash="deleteEvent" />
                </Container>
            </Section>

            <!-- ══ Posts ══ -->
            <Section background="muted">
                <Container>
                    <div class="td-head">
                        <h2 class="td-section-title">Beiträge <span class="td-count">{{ posts.length }}</span></h2>
                        <button class="td-btn" type="button" @click="showPostForm = !showPostForm">
                            {{ showPostForm ? 'abbrechen' : '+ neuer Beitrag' }}
                        </button>
                    </div>

                    <form v-if="showPostForm" class="td-form" @submit.prevent="createPost">
                        <label class="td-field">
                            <span>Name *</span>
                            <input v-model.trim="postForm.name" required placeholder="Rückblick Ma(g)dalena-LAB" />
                        </label>
                        <label class="td-field">
                            <span>Teaser</span>
                            <input v-model.trim="postForm.teaser" placeholder="kurze Zusammenfassung" />
                        </label>
                        <label class="td-field">
                            <span>Status</span>
                            <select v-model.number="postForm.status">
                                <option v-for="s in statusChoices" :key="s.value" :value="s.value">
                                    {{ s.label }} ({{ s.value }})
                                </option>
                            </select>
                        </label>
                        <button class="td-btn td-btn-primary" type="submit" :disabled="busy">anlegen</button>
                    </form>

                    <p v-if="!posts.length" class="td-note td-dim">Noch keine Beiträge.</p>
                    <ItemList v-else :items="postItems" size="small" width="inherit" columns="off"
                        interaction="static" :dataMode="false" headingLevel="h4" @item-click="openPost"
                        @item-trash="deletePost" />
                </Container>
            </Section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import ItemList from '@/components/clist/ItemList.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import { useAuth } from '@/composables/useAuth'
import { useProjectAccess } from '@/composables/useProjectAccess'
import { STATUS, STATUS_LABELS_DE } from '@/utils/status-constants'
import { composeHeading, type CvEventRow } from '@/views/Uia/useUiaEvents'

interface CvPostRow {
    id: number
    name: string
    teaser?: string | null
    subtitle?: string | null
    post_date?: string | null
    status?: number | null
}

/** A `ListItem` as ItemList defines it (`clist/ItemList.vue:118`). */
interface DashItem {
    heading: string
    props?: Record<string, unknown>
}

const route = useRoute()
const router = useRouter()
const { checkSession } = useAuth()
const projectAccess = useProjectAccess()

const domaincode = ref<string>('')
const projectHeading = ref<string | null>(null)
const events = ref<CvEventRow[]>([])
const posts = ref<CvPostRow[]>([])
const accessLoaded = ref(false)
const busy = ref(false)
const loadError = ref<string | null>(null)

const showEventForm = ref(false)
const showPostForm = ref(false)

const eventForm = ref({ name: '', date_begin: '', date_end: '', status: STATUS.DRAFT as number })
const postForm = ref({ name: '', teaser: '', status: STATUS.DRAFT as number })

const canAccess = computed(() => projectAccess.canAccess.value)
const denyReason = computed(() => projectAccess.denyReason.value)
const projectLabel = computed(() => projectHeading.value || domaincode.value || 'Projekt')

/**
 * The states worth reaching from here. Draft is local-only; `confirmed` is the
 * sync rubicon (crossing it fires `syncAfterWrite`, watchable at `/api/dev/sync`),
 * so having both in one select is what makes the sync drivable from the browser.
 * Archived/trash are deliberately absent — this is a create form.
 */
const statusChoices = [STATUS.DRAFT, STATUS.CONFIRMED, STATUS.RELEASED].map((value) => ({
    value,
    label: STATUS_LABELS_DE[value] ?? String(value),
}))

/** Post heading · `overline **HEADLINE**`. Two parts — never three. */
function composePostHeading(row: CvPostRow): string {
    const date = row.post_date ? String(row.post_date).slice(0, 10) : null
    const overline = date || row.teaser?.trim() || row.subtitle?.trim() || ''
    return `${overline ? `${overline} ` : ''}**${row.name}**`
}

/** `options: { trash: true }` is what turns on ItemRow's trash icon. */
function withTrash(heading: string): DashItem {
    return { heading, props: { options: { trash: true } } }
}

const eventItems = computed<DashItem[]>(() => events.value.map((row) => withTrash(composeHeading(row))))
const postItems = computed<DashItem[]>(() => posts.value.map((row) => withTrash(composePostHeading(row))))

/** Both endpoints answer with a BARE ARRAY — no `{ success, … }` envelope. */
async function fetchList<T>(url: string): Promise<T[]> {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url} → ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? (data as T[]) : []
}

async function loadRows() {
    const code = encodeURIComponent(domaincode.value)
    const [eventRows, postRows] = await Promise.all([
        fetchList<CvEventRow>(`/api/events?project=${code}`),
        fetchList<CvPostRow>(`/api/posts?project=${code}`),
    ])
    events.value = eventRows
    posts.value = postRows
}

async function loadProject() {
    const response = await fetch(`/api/projects/${encodeURIComponent(domaincode.value)}`)
    if (!response.ok) return
    const data = await response.json()
    projectHeading.value = data.heading || data.name || null
}

async function refresh() {
    loadError.value = null
    try {
        await loadRows()
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Laden fehlgeschlagen'
    }
}

onMounted(async () => {
    domaincode.value = String(route.params.domaincode || '')
    if (!domaincode.value) {
        loadError.value = 'Kein domaincode in der Route.'
        accessLoaded.value = true
        return
    }

    // MUST come before projectAccess.load() — see the header note (trap 2).
    try {
        await checkSession()
    } catch (error) {
        console.error('[TempDashboard] checkSession failed:', error)
    }

    await loadProject()
    await projectAccess.load(domaincode.value)
    accessLoaded.value = true

    if (!canAccess.value) return
    await refresh()
})

// ── mutations ───────────────────────────────────────────────────────────────

async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    busy.value = true
    loadError.value = null
    try {
        const response = await fetch(url, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        })
        if (!response.ok) {
            // The heading validator and the identity guard both answer 400 with a
            // message worth showing verbatim rather than a generic failure.
            let detail = `${response.status}`
            try {
                const payload = await response.json()
                if (payload?.message) detail = payload.message
            } catch { /* non-JSON body — keep the status */ }
            loadError.value = `${method} ${url} → ${detail}`
            return false
        }
        return true
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : `${method} ${url} fehlgeschlagen`
        return false
    } finally {
        busy.value = false
    }
}

async function createEvent() {
    if (!eventForm.value.name) return
    const ok = await send('/api/events', 'POST', {
        name: eventForm.value.name,
        project: domaincode.value,
        date_begin: eventForm.value.date_begin || null,
        date_end: eventForm.value.date_end || null,
        status: eventForm.value.status,
    })
    if (!ok) return
    eventForm.value = { name: '', date_begin: '', date_end: '', status: STATUS.DRAFT }
    showEventForm.value = false
    await refresh()
}

async function createPost() {
    if (!postForm.value.name) return
    const ok = await send('/api/posts', 'POST', {
        name: postForm.value.name,
        project: domaincode.value,
        teaser: postForm.value.teaser || null,
        status: postForm.value.status,
    })
    if (!ok) return
    postForm.value = { name: '', teaser: '', status: STATUS.DRAFT }
    showPostForm.value = false
    await refresh()
}

/**
 * ItemList emits `item-trash` with the ListItem, not the source row — so the
 * index is how we get back to the id. Deliberate: it keeps the items free of
 * duplicated row data.
 */
function rowAt<T>(list: T[], item: DashItem, items: DashItem[]): T | undefined {
    const index = items.indexOf(item)
    return index >= 0 ? list[index] : undefined
}

async function deleteEvent(item: DashItem) {
    const row = rowAt(events.value, item, eventItems.value)
    if (!row) return
    if (!window.confirm(`Veranstaltung „${row.name}" löschen?`)) return
    if (await send(`/api/events/${row.id}`, 'DELETE')) await refresh()
}

async function deletePost(item: DashItem) {
    const row = rowAt(posts.value, item, postItems.value)
    if (!row) return
    if (!window.confirm(`Beitrag „${row.name}" löschen?`)) return
    if (await send(`/api/posts/${row.id}`, 'DELETE')) await refresh()
}

// ── navigation · into the EXISTING detail pages, never a second editor ──────

function openEvent(item: DashItem) {
    const row = rowAt(events.value, item, eventItems.value)
    if (row) router.push(`/sites/${domaincode.value}/events/${row.id}`)
}

function openPost(item: DashItem) {
    const row = rowAt(posts.value, item, postItems.value)
    if (row) router.push(`/sites/${domaincode.value}/posts/${row.id}`)
}
</script>

<style scoped>
.temp-dashboard {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

/* Reads as provisional on purpose — this surface is meant to be replaced. */
.td-flag {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted-contrast);
}

.td-flag code {
    text-transform: none;
    letter-spacing: 0;
}

.td-title {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 700;
    line-height: 1.15;
}

.td-head {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.9rem;
}

.td-section-title {
    margin: 0;
    font-size: clamp(1.125rem, 2vw, 1.5rem);
    font-weight: 700;
}

.td-count {
    margin-left: 0.35rem;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-muted-contrast);
}

.td-note {
    margin: 0.5rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.5;
}

.td-dim {
    color: var(--color-muted-contrast);
}

.td-error {
    margin: 0.75rem 0 0;
    padding: 0.6rem 0.8rem;
    border-left: 4px solid var(--color-negative-bg);
    background-color: var(--color-card-bg);
    font-size: 0.875rem;
}

.td-btn {
    padding: 0.45rem 0.9rem;
    border: 2px solid var(--color-border);
    background-color: var(--color-card-bg);
    color: var(--color-card-contrast);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
}

.td-btn:hover {
    border-color: var(--color-primary-bg);
}

.td-btn-primary {
    border-color: var(--color-primary-bg);
    background-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.td-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.td-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
    margin-bottom: 1.1rem;
    padding: 0.9rem;
    background-color: var(--color-card-bg);
    border: 2px dashed var(--color-border);
}

.td-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.75rem;
}

.td-field > span {
    font-weight: 700;
    color: var(--color-muted-contrast);
}

.td-field input,
.td-field select {
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--color-border);
    background-color: var(--color-bg);
    color: var(--color-contrast);
    font-size: 0.875rem;
    min-width: 12rem;
}
</style>
