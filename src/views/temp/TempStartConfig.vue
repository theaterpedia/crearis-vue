<!--
  TempStartConfig · 5C — the start-page's inner config, GUARDED.

  HD (uia thread §10.7·4): „some inner config for the preset → options for the
  start-page + some basic text-editor … rather implement a tempStartConfig
  component to guard from quick edits on the sophisticated config-system, but
  still start making use of the infra as designed."

  So this component is deliberately NOT PageConfigController: it exposes a small
  WHITELIST of keys and nothing else, and it writes them through the designed
  infra — the start pages-row's `page_options` JSONB under the key-registry
  discipline (presets thread §9 · uia thread §18): keys are written ONLY on
  deviation, absence declares the default, flat pairs, never flags.

  Keys exposed (each registered in presets §9):
    site_layout  — the SiteLayout enum as it stands (single-sourced, G-1)
    body_type    — 'dia-show' | absent (= fluent; the mount is G-5's, so the
                   value is writable-but-honest about not being consumed yet)
    start_intro  — the basic text-editor: a crearis-md intro the /start page
                   renders above the agenda when present (registered with this
                   batch; absence = no intro, the preset default)

  The pages-row is created lazily on first save — a project without deviations
  should not carry a row (the registry's own rule).
-->

<template>
    <Section background="default">
        <Container>
            <h2 class="tsc-title">Start-Seite</h2>
            <p class="tsc-note tsc-dim">
                Optionen der <code>/start</code>-Seite — nur Abweichungen werden gespeichert;
                „Standard" heißt: die Seite entscheidet selbst. Das große Config-System bleibt
                unangetastet (5C-Schutzschicht).
            </p>
            <!-- Honest state, not an error: the pages CHECK-constraint predates /start
                 (migration 013: landing/event/post/team) — extending it to 'start' is a
                 one-line migration in CV-Schema's lane, PARKED + FLAGGED (uia thread §21).
                 Until it lands, the first save answers with the constraint refusal. -->
            <p v-if="!pageId" class="tsc-note tsc-dim">
                Zustand: noch keine <code>start</code>-Zeile — der <code>page_type</code>-Check
                (Migration 013) kennt <code>'start'</code> noch nicht; die kleine Migration ist
                bei CV-Schema angefragt. Lesen &amp; Schreiben sind fertig verdrahtet.
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

                <label class="tsc-field">
                    <span>Körper (<code>body_type</code>)</span>
                    <select v-model="bodyTypeChoice" :disabled="busy">
                        <option value="">Standard — fließend</option>
                        <option value="dia-show">dia-show (Mount folgt · G-5)</option>
                    </select>
                </label>
            </div>

            <label class="tsc-field tsc-field-full">
                <span>Intro-Text (<code>start_intro</code> · crearis-md, Absätze durch Leerzeile)</span>
                <textarea v-model="introDraft" rows="4" :disabled="busy"
                    placeholder="Ein kurzer Text über der Agenda — leer = kein Intro."></textarea>
            </label>

            <p class="tsc-actions">
                <button class="tsc-btn tsc-btn-primary" type="button" :disabled="busy || !dirty" @click="save">
                    {{ busy ? 'speichert …' : 'Start-Optionen speichern' }}
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
}>()

const siteLayouts = SITE_LAYOUTS

const pageId = ref<string | null>(null)
const busy = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

/** What the row currently holds (normalized: '' = key absent). */
const loaded = ref<{ site_layout: string; body_type: string; start_intro: string }>({
    site_layout: '', body_type: '', start_intro: '',
})

const siteLayoutChoice = ref('')
const bodyTypeChoice = ref('')
const introDraft = ref('')

const dirty = computed(() =>
    siteLayoutChoice.value !== loaded.value.site_layout
    || bodyTypeChoice.value !== loaded.value.body_type
    || introDraft.value.trim() !== loaded.value.start_intro)

onMounted(load)

async function load() {
    try {
        const response = await fetch(`/api/pages/by-project?project_id=${props.projectId}`)
        if (!response.ok) return
        const data = await response.json()
        const rows: Array<{ id: string; page_type?: string; page_options?: Record<string, unknown> }>
            = data?.pages ?? []
        const startRow = rows.find((row) => row.page_type === 'start')
        if (!startRow) return
        pageId.value = startRow.id
        const options = startRow.page_options ?? {}
        loaded.value = {
            site_layout: typeof options.site_layout === 'string' ? options.site_layout : '',
            body_type: typeof options.body_type === 'string' ? options.body_type : '',
            start_intro: typeof options.start_intro === 'string' ? options.start_intro : '',
        }
        siteLayoutChoice.value = loaded.value.site_layout
        bodyTypeChoice.value = loaded.value.body_type
        introDraft.value = loaded.value.start_intro
    } catch (error) {
        console.warn('[TempStartConfig] load failed:', error)
    }
}

/** Deviations only — an empty choice REMOVES its key (absence = default). */
function composeOptions(): Record<string, string> {
    const options: Record<string, string> = {}
    if (siteLayoutChoice.value) options.site_layout = siteLayoutChoice.value
    if (bodyTypeChoice.value) options.body_type = bodyTypeChoice.value
    const intro = introDraft.value.trim()
    if (intro) options.start_intro = intro
    return options
}

async function save() {
    busy.value = true
    saveError.value = null
    saved.value = false
    try {
        const page_options = composeOptions()
        let response: Response
        if (pageId.value) {
            response = await fetch(`/api/pages/${pageId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_options }),
            })
        } else {
            // Lazy row: created on the first real deviation.
            response = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: props.projectId, page_type: 'start', page_options }),
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
    font-size: 0.75rem;
}

.tsc-field > span {
    font-weight: 700;
    color: var(--color-muted-contrast);
}

.tsc-field select,
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
