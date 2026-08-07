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

  ── BREADCRUMBS for sister B (E-pass 2026-08-06) ─────────────────────────────
  5A/5B/5C land HERE (uia thread §10.7·4): project settings · simplified image
  upload (inspect the project-creation-stepper; per-image consent-to-publish is
  an `initiative` PRESET PROPERTY — images thread I-6) · a `tempStartConfig`
  component guarding the config system while using its infra.
  Mode logic: the drafting-border sits at 64 (HD-blessed; sysreg thread §2) and
  is NOT the Rubicon (512) — compare the MASKED category, not raw equality.
  Discipline: „Dashboard = thin UI + state-visualizer + integer-writer" — the
  semantics live server-side. Preset entry-point: src/utils/projectPreset.ts.
  Never v-if on density (negative-spec class 5, mechanically greppable).
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

                    <!--
                      Legibility, not behaviour. Post-sync is a deliberate no-op until
                      `posts` gets migration-060's stubs (`odoo_xmlid` / `confirmed_at` /
                      `odoo_stats`) — events have them, posts do not. The runner logs why,
                      but from here someone sets a post to `confirmed` (512), crosses what
                      looks like the same rubicon events cross, and sees nothing happen.
                      Correct behaviour, silent surface. So it says so.
                    -->
                    <p class="td-note td-dim td-sync-note">
                        Hinweis: Beiträge werden noch <strong>nicht</strong> mit Odoo synchronisiert —
                        <code>posts</code> fehlen die 060-Felder. Der Status lässt sich setzen,
                        ein Sync passiert aber nicht.
                    </p>

                    <p v-if="!posts.length" class="td-note td-dim">Noch keine Beiträge.</p>
                    <ItemList v-else :items="postItems" size="small" width="inherit" columns="off"
                        interaction="static" :dataMode="false" headingLevel="h4" @item-click="openPost"
                        @item-trash="deletePost" />
                </Container>
            </Section>

            <!-- ══ 5A · Projekt-Einstellungen ══════════════════════════════════
                 The sysreg publish-editor the project-status thread §4·1 owed.
                 Radio-control discipline (sysreg §3b·7): thin UI + state-visualizer
                 + integer-writer — one click writes one integer, the semantics live
                 server-side. Open spots render as STATES, not errors (design §2b). -->
            <Section v-if="isOwner" background="default">
                <Container>
                    <h2 class="td-section-title">Projekt-Einstellungen</h2>

                    <!-- state-visualizer · without shame -->
                    <p class="td-note">
                        Status: <strong>{{ projectStatusLabel }}</strong>
                        <span class="td-state" :class="published ? 'td-state-public' : 'td-state-private'">
                            {{ published ? 'öffentlich sichtbar' : 'nicht öffentlich' }}
                        </span>
                    </p>
                    <p v-if="beforeBorder" class="td-note td-dim">
                        Vor der Entwurfs-Grenze (64): <code>/projects</code> zeigt dieses Projekt im Stepper-Modus.
                    </p>

                    <!-- radio-control · one click, one integer -->
                    <fieldset class="td-radio-row">
                        <legend>Projekt-Status setzen</legend>
                        <label v-for="s in projectStatusChoices" :key="s.value" class="td-radio">
                            <input type="radio" name="project-status" :value="s.value"
                                v-model.number="projectStatusChoice" :disabled="busy"
                                @change="saveProjectStatus" />
                            <span>{{ s.label }} ({{ s.value }})</span>
                        </label>
                    </fieldset>

                    <!-- heading editor · the validator answers 400 with a message
                         worth showing verbatim (two slots, never three) -->
                    <form class="td-form" @submit.prevent="saveHeading">
                        <label class="td-field td-field-wide">
                            <span>Überschrift (crearis-md · zwei Teile, nie drei)</span>
                            <input v-model="headingDraft" placeholder="überzeile **ÜBERSCHRIFT**" />
                        </label>
                        <button class="td-btn td-btn-primary" type="submit" :disabled="busy">speichern</button>
                    </form>

                    <!-- the ground, read-only · honest about where it comes from -->
                    <p class="td-note td-dim">
                        Preset: <code>{{ presetKind }}</code> (Domaincode-Registry, Träger-Ruling offen) ·
                        Theme 3 „Institut" + Domain-Override (Schrift · dunkel)
                    </p>
                </Container>
            </Section>

            <!-- ══ 5B · Bilder ═════════════════════════════════════════════════
                 Simplified upload + management, inspected from the creation-
                 stepper (ProjectStepImages → cimgImportStepper is the FULL
                 machine; this is the thin everyday surface). Consent-to-publish
                 (images I-6, an `initiative` preset property) rides the image's
                 own sysreg status — one ladder, one integer-writer, and
                 „Einverständnis steht aus" is a STATE, not an error. -->
            <Section v-if="isOwner" background="muted">
                <Container>
                    <div class="td-head">
                        <h2 class="td-section-title">Bilder <span class="td-count">{{ images.length }}</span></h2>
                        <button class="td-btn" type="button" @click="showImageForm = !showImageForm">
                            {{ showImageForm ? 'abbrechen' : '+ neues Bild' }}
                        </button>
                    </div>

                    <p class="td-note td-dim">
                        Die Galerie ist privat (Preset „initiative"): jedes Bild wird <strong>einzeln</strong>
                        freigegeben. Hinweis: öffentliche Seiten filtern noch nicht nach Freigabe —
                        der Zustand wird hier geführt, die Durchsetzung ist offen (Bilder-Thread I-6).
                    </p>

                    <form v-if="showImageForm" class="td-form" @submit.prevent="uploadImage">
                        <label class="td-field">
                            <span>Name *</span>
                            <input v-model.trim="imageForm.name" required placeholder="Plakat Herbst" />
                        </label>
                        <label class="td-field">
                            <span>Alt-Text *</span>
                            <input v-model.trim="imageForm.alt" required placeholder="was auf dem Bild zu sehen ist" />
                        </label>
                        <label class="td-field">
                            <span>Datei * (jpg · png · webp)</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" @change="onImageFile" />
                        </label>
                        <button class="td-btn td-btn-primary" type="submit" :disabled="busy || !imageForm.file">hochladen</button>
                    </form>

                    <p v-if="!images.length" class="td-note td-dim">Noch keine Bilder in der Galerie.</p>
                    <ul v-else class="td-img-grid">
                        <li v-for="img in images" :key="img.id" class="td-img-card">
                            <img v-if="imgThumb(img)" class="td-img-thumb" :src="imgThumb(img)"
                                :alt="img.alt_text || img.name || img.xmlid || 'Bild'" />
                            <div class="td-img-meta">
                                <strong class="td-img-name">{{ img.name || img.xmlid }}</strong>
                                <span class="td-state" :class="isPublished(img.status) ? 'td-state-public' : 'td-state-private'">
                                    {{ isPublished(img.status) ? 'einverstanden · öffentlich' : 'privat · Einverständnis steht aus' }}
                                </span>
                                <label class="td-field">
                                    <span>Freigabe</span>
                                    <select :value="lifecycleStatus(img.status ?? 0)" :disabled="busy"
                                        @change="saveImageConsent(img, $event)">
                                        <option v-for="c in consentChoices" :key="c.value" :value="c.value">
                                            {{ c.label }}
                                        </option>
                                    </select>
                                </label>
                            </div>
                        </li>
                    </ul>
                </Container>
            </Section>

            <!-- ══ 5C · Start-Seite ════════════════════════════════════════════
                 tempStartConfig — guards the sophisticated config system while
                 using the infra as designed: the pages-row's page_options
                 key-registry (presets thread §9). -->
            <TempStartConfig v-if="isOwner && projectId !== null" :project-id="projectId"
                :domaincode="domaincode" />
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
import {
    STATUS,
    STATUS_LABELS_DE,
    WORKFLOW_MASK,
    lifecycleStatus,
    isPublished,
    isBeforeDraftingBorder,
    type StatusValue,
} from '@/utils/status-constants'
import { resolvePresetForDomain } from '@/utils/projectPreset'
import { composeHeading, type CvEventRow } from '@/views/Uia/useUiaEvents'
import TempStartConfig from './TempStartConfig.vue'

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
const { checkSession, user } = useAuth()
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

// ── 5A · Projekt-Einstellungen ───────────────────────────────────────────────
const isOwner = computed(() => projectAccess.isOwner.value)
const projectStatus = ref<number | null>(null)
const projectStatusChoice = ref<number | null>(null)
const headingDraft = ref('')

const published = computed(() => isPublished(projectStatus.value))
const beforeBorder = computed(() => projectStatus.value !== null && isBeforeDraftingBorder(projectStatus.value))

/** Category label from the MASKED value; a subcategory shows its number, honestly. */
const projectStatusLabel = computed(() => {
    if (projectStatus.value === null) return '—'
    const lifecycle = lifecycleStatus(projectStatus.value)
    return STATUS_LABELS_DE[lifecycle as StatusValue] ?? String(lifecycle)
})

/**
 * The five forward categories — the ladder the radio-control walks. Archived/
 * trash are deliberately absent: retiring a project is a different act than
 * setting its working state, and it does not belong on a settings row.
 */
const projectStatusChoices = [STATUS.NEW, STATUS.DEMO, STATUS.DRAFT, STATUS.CONFIRMED, STATUS.RELEASED]
    .map((value) => ({ value, label: STATUS_LABELS_DE[value] ?? String(value) }))

const presetKind = computed(() => resolvePresetForDomain(domaincode.value) ?? '—')

// ── 5B · Bilder ──────────────────────────────────────────────────────────────
/** The subset of an `images` row this surface consumes (bare-array/enveloped GET). */
interface CvImageRow {
    id: number
    xmlid?: string | null
    name?: string | null
    alt_text?: string | null
    status?: number | null
    url?: string | null
    img_square?: { url?: string } | null
    img_thumb?: { url?: string } | null
}

const projectId = ref<number | null>(null)
const images = ref<CvImageRow[]>([])
const showImageForm = ref(false)
const imageForm = ref<{ name: string; alt: string; file: File | null }>({ name: '', alt: '', file: null })

/**
 * The consent ladder — the sysreg categories wearing their 5B meaning. One
 * integer per click; `0` is the honest pre-ladder state fresh uploads carry.
 */
const consentChoices = [
    { value: 0, label: 'roh — unbearbeitet' },
    { value: STATUS.DRAFT, label: 'privat (Galerie)' },
    { value: STATUS.CONFIRMED, label: 'intern freigegeben' },
    { value: STATUS.RELEASED, label: 'einverstanden · öffentlich' },
]

function imgThumb(img: CvImageRow): string | undefined {
    return img.img_square?.url || img.img_thumb?.url || img.url || undefined
}

/** `Plakat Herbst` → `plakat_herbst` — the dot-form xmlid's identifier part. */
function slugForXmlid(name: string): string {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        || 'bild'
}

function onImageFile(event: Event) {
    const input = event.target as HTMLInputElement
    imageForm.value.file = input.files?.[0] ?? null
}

async function loadImages() {
    if (projectId.value === null) return
    const response = await fetch(`/api/images?project_id=${projectId.value}`)
    if (!response.ok) return
    const data = await response.json()
    images.value = Array.isArray(data) ? data : (data?.images ?? [])
}

async function uploadImage() {
    const { name, alt, file } = imageForm.value
    if (!name || !alt || !file || projectId.value === null) return
    busy.value = true
    loadError.value = null
    try {
        const form = new FormData()
        form.append('file', file)
        // The upload validator's dot-form (images thread I-4): exactly 2 dots, no hyphens.
        form.append('xmlid', `${domaincode.value}.image.${slugForXmlid(name)}`)
        form.append('owner_id', String(user.value?.id ?? ''))
        form.append('project_id', String(projectId.value))
        form.append('alt_text', alt)
        const response = await fetch('/api/images/upload', { method: 'POST', body: form })
        if (!response.ok) {
            let detail = `${response.status}`
            try {
                const payload = await response.json()
                if (payload?.statusMessage || payload?.message) detail = payload.statusMessage || payload.message
            } catch { /* keep the status */ }
            loadError.value = `Upload → ${detail}`
            return
        }
        imageForm.value = { name: '', alt: '', file: null }
        showImageForm.value = false
        await loadImages()
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Upload fehlgeschlagen'
    } finally {
        busy.value = false
    }
}

/** Integer-writer, same discipline as 5A: move the ordinal slot, keep the toggles. */
async function saveImageConsent(img: CvImageRow, event: Event) {
    const value = Number((event.target as HTMLSelectElement).value)
    const next = ((img.status ?? 0) & ~WORKFLOW_MASK) | value
    const ok = await send(`/api/images/${img.id}`, 'PATCH', { status: next })
    if (ok) await loadImages()
}

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
    // skip_alpha_filter: this IS the internal editing page the bypass exists
    // for — since the sysreg project-visibility filter went always-on (HD
    // 2026-08-06), a draft project's dashboard would otherwise list nothing.
    const [eventRows, postRows] = await Promise.all([
        fetchList<CvEventRow>(`/api/events?project=${code}&skip_alpha_filter=true`),
        fetchList<CvPostRow>(`/api/posts?project=${code}&skip_alpha_filter=true`),
    ])
    events.value = eventRows
    posts.value = postRows
}

async function loadProject() {
    const response = await fetch(`/api/projects/${encodeURIComponent(domaincode.value)}`)
    if (!response.ok) return
    const data = await response.json()
    projectHeading.value = data.heading || data.name || null
    // 5A · the settings surface reads the same row it writes.
    projectStatus.value = typeof data.status === 'number' ? data.status : null
    projectStatusChoice.value = projectStatus.value === null ? null : lifecycleStatus(projectStatus.value)
    headingDraft.value = data.heading || ''
    // 5B/5C need the numeric id (images by project_id · the start pages-row).
    projectId.value = typeof data.id === 'number' ? data.id : null
}

async function refresh() {
    loadError.value = null
    try {
        await loadRows()
        // 5B · the gallery is an owner surface; nothing to fetch for members.
        if (isOwner.value) await loadImages()
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

// ── 5A · the two settings-writers ────────────────────────────────────────────

/**
 * Integer-writer (sysreg §3b·7): one click moves ONLY the ordinal slot. The
 * scope/admin toggles (bits 17+) are the hybrid's other regime and stay exactly
 * as they were — this control has no opinion about them.
 */
async function saveProjectStatus() {
    if (projectStatusChoice.value === null) return
    const next = ((projectStatus.value ?? 0) & ~WORKFLOW_MASK) | projectStatusChoice.value
    const ok = await send(`/api/projects/${encodeURIComponent(domaincode.value)}`, 'PATCH', { status: next })
    if (ok) {
        await loadProject()
    } else {
        // The write failed — snap the radio back to the row's truth.
        projectStatusChoice.value = projectStatus.value === null ? null : lifecycleStatus(projectStatus.value)
    }
}

/** The heading validator answers 400 with a message worth showing verbatim. */
async function saveHeading() {
    const heading = headingDraft.value.trim()
    if (!heading) return
    const ok = await send(`/api/projects/${encodeURIComponent(domaincode.value)}`, 'PATCH', { heading })
    if (ok) await loadProject()
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

/* Marked as a standing caveat rather than an error — nothing is broken. */
.td-sync-note {
    margin-bottom: 0.9rem;
    padding: 0.5rem 0.7rem;
    border-left: 4px solid var(--color-secondary-bg);
    background-color: color-mix(in oklch, var(--color-secondary-bg) 12%, transparent);
    font-size: 0.8125rem;
    line-height: 1.5;
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

/* ══ 5A · Projekt-Einstellungen ══ */
.td-field-wide input {
    min-width: min(28rem, 80vw);
}

/* A state, not an error — same weight either way (design §2b). */
.td-state {
    margin-left: 0.6rem;
    padding: 0.15rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
}

.td-state-public {
    background-color: color-mix(in oklch, var(--color-positive-bg) 25%, transparent);
}

.td-state-private {
    background-color: color-mix(in oklch, var(--color-muted-bg) 60%, transparent);
}

.td-radio-row {
    margin: 0.9rem 0;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--color-border);
}

.td-radio-row legend {
    padding: 0 0.35rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-muted-contrast);
}

.td-radio {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    margin-right: 1.1rem;
    font-size: 0.875rem;
    cursor: pointer;
}

/* ══ 5B · Bilder ══ */
.td-img-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0.9rem;
    margin: 0.9rem 0 0;
    padding: 0;
    list-style: none;
}

.td-img-card {
    display: flex;
    gap: 0.7rem;
    padding: 0.6rem;
    border: 1px solid var(--color-border);
    background-color: var(--color-card-bg);
}

.td-img-thumb {
    width: 4rem;
    height: 4rem;
    object-fit: cover;
    flex: 0 0 auto;
}

.td-img-meta {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
}

.td-img-name {
    font-size: 0.875rem;
    overflow-wrap: anywhere;
}
</style>
