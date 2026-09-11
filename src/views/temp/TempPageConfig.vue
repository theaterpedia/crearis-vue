<!--
  TempPageConfig · 5C — a page's inner config, GUARDED. Serves BOTH pages.

  HD (uia thread §10.7·4): „some inner config for the preset → options for the
  start-page + some basic text-editor … rather implement a tempStartConfig
  component to guard from quick edits on the sophisticated config-system, but
  still start making use of the infra as designed."

  So this component is deliberately NOT PageConfigController: it exposes a small
  WHITELIST per page-type and nothing else, and it writes through the designed
  infra — the pages-row's `page_options` JSONB (+ the row's own `header_size`
  column) under the key-registry discipline (presets §9 · uia §18): written ONLY
  on deviation, absence declares the default, flat pairs, never flags.

  ── Why one component and not a sibling (uia §21·3) ──────────────────────────
  It was `TempStartConfig`, hardcoded to `page_type='start'`. HD then forwarded
  the LANDING settings to this seat, and a second copy would have been a second
  place to drift — the same argument R·4·4 makes for `isPublished` and C2b·3·①
  for the visibility SQL. ⇒ `pageType` is a prop, the whitelist is a per-type
  table, and adding a third page is adding a table entry.

  ── The keys, per page-type ──────────────────────────────────────────────────
    start   · site_layout · body_type · start_intro
    landing · site_layout · alert_banner (nested — see below) · header_size*

  *`header_size` is NOT a page_options key: it is the pages-row's own COLUMN,
  and `ProjectSite.vue` reads it with precedence over `projects.header_size`
  („Hero size rides the LANDING pages-row"). It is edited here because this is
  where the landing row is edited — but it travels as a column, not a key.

  ⚠ `alert_banner` is the ONE nested value in the registry (`{ message,
  alertType }`), which the §9 rules otherwise forbid. Kept as C1 shipped it and
  registered in that shape deliberately: its consumer is live and verified, it is
  not read by `resolvePageStructure` (so it breaks no typed resolver), and
  flattening a working live shape for a formatting rule right before a deploy is
  the churn this house declines elsewhere. Flatten in a later sweep if the
  registry wants uniformity — the editor is the only writer.

  The pages-row is created lazily on first save — a project without deviations
  should not carry a row (the registry's own rule).
-->

<template>
    <Section :background="pageType === 'landing' ? 'muted' : 'default'">
        <Container>
            <h2 class="tsc-title">{{ heading }}</h2>
            <p class="tsc-note tsc-dim">
                Optionen der <code>{{ routeLabel }}</code>-Seite — nur Abweichungen werden
                gespeichert; „Standard" heißt: die Seite entscheidet selbst. Das große
                Config-System bleibt unangetastet (5C-Schutzschicht).
            </p>
            <p v-if="!pageId" class="tsc-note tsc-dim">
                Zustand: noch keine <code>{{ pageType }}</code>-Zeile — sie wird beim ersten
                Speichern angelegt.
            </p>
            <p v-if="saveError" class="tsc-error">{{ saveError }}</p>

            <div class="tsc-grid">
                <label class="tsc-field">
                    <span>Layout (<code>site_layout</code>)</span>
                    <select v-model="siteLayoutChoice" :disabled="busy">
                        <option value="">Standard (Seite entscheidet)</option>
                        <option v-for="layout in siteLayouts" :key="layout" :value="layout">{{ layout }}</option>
                    </select>
                </label>

                <!-- start only -->
                <label v-if="pageType === 'start'" class="tsc-field">
                    <span>Körper (<code>body_type</code>)</span>
                    <select v-model="bodyTypeChoice" :disabled="busy">
                        <option value="">Standard — fließend</option>
                        <option value="dia-show">dia-show (Mount folgt · G-5)</option>
                    </select>
                </label>

                <!-- landing only · the pages-row COLUMN, not a key -->
                <label v-if="pageType === 'landing'" class="tsc-field">
                    <span>Hero-Größe (<code>header_size</code> · Spalte)</span>
                    <select v-model="headerSizeChoice" :disabled="busy">
                        <option value="">Standard (Projekt entscheidet)</option>
                        <option v-for="size in HEADER_SIZES" :key="size" :value="size">{{ size }}</option>
                    </select>
                </label>
            </div>

            <!-- start only · the basic text-editor -->
            <label v-if="pageType === 'start'" class="tsc-field tsc-field-full">
                <span>Intro-Text (<code>start_intro</code> · crearis-md, Absätze durch Leerzeile)</span>
                <textarea v-model="introDraft" rows="4" :disabled="busy"
                    placeholder="Ein kurzer Text über der Agenda — leer = kein Intro."></textarea>
            </label>

            <!-- landing only · the alert banner that replaced the alpha post-it -->
            <template v-if="pageType === 'landing'">
                <label class="tsc-field tsc-field-full">
                    <span>Hinweis-Banner (<code>alert_banner.message</code> · leer = kein Banner)</span>
                    <input v-model="alertMessage" :disabled="busy"
                        placeholder="z. B. Sommerpause bis 8. September" />
                </label>
                <label class="tsc-field">
                    <span>Banner-Art (<code>alert_banner.alertType</code>)</span>
                    <select v-model="alertType" :disabled="busy">
                        <option v-for="kind in ALERT_TYPES" :key="kind" :value="kind">{{ kind }}</option>
                    </select>
                </label>
            </template>

            <p class="tsc-actions">
                <button class="tsc-btn tsc-btn-primary" type="button" :disabled="busy || !dirty" @click="save">
                    {{ busy ? 'speichert …' : 'Optionen speichern' }}
                </button>
                <span v-if="!dirty && saved" class="tsc-dim">gespeichert ✓</span>
            </p>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import { SITE_LAYOUTS } from '@/layoutsettings'

const props = defineProps<{
    projectId: number
    domaincode: string
    /** Which pages-row this instance edits. Adding a page = adding a case. */
    pageType: 'start' | 'landing'
}>()

const siteLayouts = SITE_LAYOUTS

/** `PageHeading`'s sizes as ProjectSite consumes them (it defaults to 'prominent'). */
const HEADER_SIZES = ['mini', 'small', 'prominent', 'full'] as const

/** The alert kinds ProjectSite's banner accepts (its own prop union). */
const ALERT_TYPES = ['primary', 'secondary', 'muted', 'accent', 'positive', 'negative', 'warning'] as const

const heading = computed(() => (props.pageType === 'landing' ? 'Landing-Seite' : 'Start-Seite'))
const routeLabel = computed(() => (props.pageType === 'landing' ? '/' : '/start'))

const pageId = ref<string | null>(null)
/** The row's FULL page_options — foreign keys included, so a save preserves them. */
const loadedOptions = ref<Record<string, unknown>>({})
const busy = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

/** What the row currently holds (normalized: '' = key absent). */
const loaded = ref({
    site_layout: '', body_type: '', start_intro: '',
    alert_message: '', alert_type: 'warning', header_size: '',
})

const siteLayoutChoice = ref('')
const bodyTypeChoice = ref('')
const introDraft = ref('')
const alertMessage = ref('')
const alertType = ref('warning')
const headerSizeChoice = ref('')

const dirty = computed(() => {
    if (siteLayoutChoice.value !== loaded.value.site_layout) return true
    if (props.pageType === 'start') {
        return bodyTypeChoice.value !== loaded.value.body_type
            || introDraft.value.trim() !== loaded.value.start_intro
    }
    return alertMessage.value.trim() !== loaded.value.alert_message
        || alertType.value !== loaded.value.alert_type
        || headerSizeChoice.value !== loaded.value.header_size
})

onMounted(load)

async function load() {
    try {
        const response = await fetch(`/api/pages/by-project?project_id=${props.projectId}`)
        if (!response.ok) return
        const data = await response.json()
        const rows: Array<{
            id: string
            page_type?: string
            header_size?: string | null
            page_options?: Record<string, unknown>
        }> = data?.pages ?? []
        const row = rows.find((r) => r.page_type === props.pageType)
        if (!row) return
        pageId.value = row.id
        const options = row.page_options ?? {}
        loadedOptions.value = { ...options }
        const alert = options.alert_banner as { message?: string; alertType?: string } | undefined
        loaded.value = {
            site_layout: typeof options.site_layout === 'string' ? options.site_layout : '',
            body_type: typeof options.body_type === 'string' ? options.body_type : '',
            start_intro: typeof options.start_intro === 'string' ? options.start_intro : '',
            alert_message: alert?.message ?? '',
            alert_type: alert?.alertType ?? 'warning',
            header_size: row.header_size ?? '',
        }
        siteLayoutChoice.value = loaded.value.site_layout
        bodyTypeChoice.value = loaded.value.body_type
        introDraft.value = loaded.value.start_intro
        alertMessage.value = loaded.value.alert_message
        alertType.value = loaded.value.alert_type
        headerSizeChoice.value = loaded.value.header_size
    } catch (error) {
        console.warn('[TempPageConfig] load failed:', error)
    }
}

/**
 * Deviations only — an empty value REMOVES its key (absence = default).
 *
 * 🔴 **MERGE, never replace, and this is a scar not a preference.** `page_options`
 * is a SHARED namespace on the row: the landing row also carries the four
 * `impressum_*` identity keys (impressum thread · they live on the landing row
 * because legal identity is project-level). An earlier version of this function
 * built a fresh object and PUT it, which **wiped every key outside this
 * component's whitelist** — I did exactly that to uia's live row and had to
 * restore the four keys by hand. ⇒ a whitelist editor on a shared namespace must
 * overlay its OWN keys onto what is already there and delete only its own.
 * Anything else is a silent data-loss path with one writer's blind spot in it.
 */
function composeOptions(): Record<string, unknown> {
    // Start from what the row holds, so foreign keys survive untouched.
    const options: Record<string, unknown> = { ...(loadedOptions.value) }

    /** Whitelisted: set when non-empty, DELETE when empty (absence = default). */
    const put = (key: string, value: unknown) => {
        if (value === '' || value === undefined || value === null) delete options[key]
        else options[key] = value
    }

    put('site_layout', siteLayoutChoice.value)
    if (props.pageType === 'start') {
        put('body_type', bodyTypeChoice.value)
        put('start_intro', introDraft.value.trim())
    } else {
        const message = alertMessage.value.trim()
        // No message = no banner: the key is deleted, not an empty object.
        put('alert_banner', message ? { message, alertType: alertType.value } : '')
    }
    return options
}

async function save() {
    busy.value = true
    saveError.value = null
    saved.value = false
    try {
        const page_options = composeOptions()
        // `header_size` is the row's own column, so it rides beside page_options.
        const body: Record<string, unknown> = { page_options }
        if (props.pageType === 'landing') body.header_size = headerSizeChoice.value || null

        let response: Response
        if (pageId.value) {
            response = await fetch(`/api/pages/${pageId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
        } else {
            // Lazy row: created on the first real deviation.
            response = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: props.projectId, page_type: props.pageType, ...body }),
            })
        }
        if (!response.ok) {
            let detail = `${response.status}`
            try {
                const payload = await response.json()
                if (payload?.message || payload?.statusMessage) detail = payload.message || payload.statusMessage
            } catch { /* keep the status */ }
            saveError.value = `Speichern → ${detail}`
            return
        }
        await load()
        saved.value = true
    } catch (error) {
        saveError.value = error instanceof Error ? error.message : 'Speichern fehlgeschlagen'
    } finally {
        busy.value = false
    }
}
</script>

<style scoped>
.tsc-title {
    margin: 0 0 0.4rem;
    font-size: clamp(1.125rem, 2vw, 1.5rem);
    font-weight: 700;
}

.tsc-note {
    margin: 0 0 0.9rem;
    font-size: 0.9375rem;
    line-height: 1.5;
}

.tsc-dim {
    color: var(--color-muted-contrast);
}

.tsc-error {
    margin: 0.5rem 0;
    padding: 0.6rem 0.8rem;
    border-left: 4px solid var(--color-negative-bg);
    background-color: var(--color-card-bg);
    font-size: 0.875rem;
}

.tsc-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin-bottom: 0.9rem;
}

.tsc-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-bottom: 0.6rem;
    font-size: 0.75rem;
}

.tsc-field > span {
    font-weight: 700;
    color: var(--color-muted-contrast);
}

.tsc-field select,
.tsc-field input,
.tsc-field textarea {
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--color-border);
    background-color: var(--color-bg);
    color: var(--color-contrast);
    font-size: 0.875rem;
    min-width: 14rem;
}

.tsc-field-full {
    width: 100%;
}

.tsc-field-full input,
.tsc-field-full textarea {
    width: 100%;
    max-width: 46rem;
    font-family: inherit;
}

.tsc-actions {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    margin: 0.4rem 0 0;
}

.tsc-btn {
    padding: 0.45rem 0.9rem;
    border: 2px solid var(--color-border);
    background-color: var(--color-card-bg);
    color: var(--color-card-contrast);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
}

.tsc-btn-primary {
    border-color: var(--color-primary-bg);
    background-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.tsc-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
</style>
