<!--
  AgendaView — cand-2-baseline Phase-A integration.

  §12 agenda-view-mode pattern (locked):
    - Two-mode-adaptive: `#inside` (event running OR schedule clicked) vs
      outer `#main` (no event running, default)
    - Right-rail absorbs variation (birds-view ↔ props-edit ↔ post-it-interactions)
    - Main-view stays stable across mode switches

  Phase-A wiring (per cand-2-implementation-brief 2026-05-19):
    - Row-family architecture mounted: AgendaLineList → AgendaDayGroup → AgendaLine
    - Cross-preset proof: same components render schule-project + initiative
      preset-instances via the useAgendaPreset composable (mock data for now;
      real graphql-fetch in Phase-B / T3a-Basic upstream connectivity)
    - Density-morph driven by [data-density] attribute (NOT v-if branching)
    - Trio-inline-right-end + single-fpostit-on-click discipline (negative-spec)

  Preset selector is a TUE-prototyping affordance (lets HM walk both
  preset-instances in the dev-browser). Final preset-resolution lands when
  project.config.preset is wired through.
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AgendaLineList from '@/components/agenda/AgendaLineList.vue'
import {
    useAgendaPreset,
    type AgendaPresetKind,
    type AgendaLineData,
    type AgendaLineTrioCounts,
} from '@/composables/useAgendaPreset'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))

// §12 mode-state. Currently mocked; real driver = "is there a running event for this project?"
type AgendaMode = 'main' | 'inside'
const mode = ref<AgendaMode>('main')
const isInsideAgenda = computed(() => mode.value === 'inside')

function enterInside() { mode.value = 'inside' }
function leaveInside() { mode.value = 'main' }

// Cross-preset proof — toggle drives which mock-dataset feeds the row-family.
// Final preset-resolution lands when project.config.preset is wired through.
const preset = ref<AgendaPresetKind>('schule-project')
const { dayGroups, lineCount } = useAgendaPreset(preset)

// Density-morph foundation. Mode-switch drives density (compact tiny in #main,
// fancy in #inside) — cheapest first cut; refines once HM CSS-polish lands.
const density = computed<'tiny' | 'fancy'>(() => (isInsideAgenda.value ? 'fancy' : 'tiny'))

// Shortcode-pill render gated by project.config.useTemplateCode upstream;
// for Phase-A mock-toggle on the same axis.
const showShortcode = ref(true)

function onTrioClick(lane: keyof AgendaLineTrioCounts, line: AgendaLineData) {
    // Phase-A stub: single-fpostit-on-click discipline lands in Phase-B when
    // fpostit-controller wiring lands. For now, log for FLAME-iteration smoke.
    // eslint-disable-next-line no-console
    console.info('[AgendaView] trio-click', lane, 'on', line.id)
}

function onLineClick(line: AgendaLineData) {
    // Phase-A: clicking a line transitions to #inside (per §12).
    enterInside()
    // eslint-disable-next-line no-console
    console.info('[AgendaView] line-click', line.id, '→ #inside')
}
</script>

<template>
    <div class="agenda-view" :class="{ 'is-inside': isInsideAgenda }">
        <section class="agenda-view__main" aria-label="Agenda main view">
            <div class="agenda-view__header">
                <h2 class="agenda-view__title">Agenda</h2>
                <div class="agenda-view__mode-toggle" role="group" aria-label="Agenda mode">
                    <button :class="{ 'is-active': !isInsideAgenda }" @click="leaveInside" type="button">
                        Outer (#main)
                    </button>
                    <button :class="{ 'is-active': isInsideAgenda }" @click="enterInside" type="button">
                        Inside (#inside)
                    </button>
                </div>
            </div>

            <div class="agenda-view__preset-toggle" role="group" aria-label="Preset (mock-toggle)">
                <span class="agenda-view__preset-label">Preset:</span>
                <button :class="{ 'is-active': preset === 'schule-project' }"
                    @click="preset = 'schule-project'" type="button">schule-project</button>
                <button :class="{ 'is-active': preset === 'initiative' }"
                    @click="preset = 'initiative'" type="button">initiative</button>
                <label class="agenda-view__shortcode-toggle">
                    <input v-model="showShortcode" type="checkbox" /> shortcode-pill
                </label>
                <span class="agenda-view__count">{{ lineCount }} lines</span>
            </div>

            <div class="agenda-view__line-area" :data-density="density" :data-preset="preset">
                <AgendaLineList :day-groups="dayGroups"
                    :show-shortcode="showShortcode"
                    :density="density"
                    @line-click="onLineClick"
                    @trio-click="onTrioClick" />
            </div>
        </section>

        <aside class="agenda-view__rail" aria-label="Agenda right-rail">
            <header class="agenda-view__rail-header">
                <span v-if="!isInsideAgenda">Birds-view (outer)</span>
                <span v-else>Props · Post-its (inside)</span>
            </header>
            <div class="agenda-view__rail-content">
                <p class="agenda-view__rail-stub">
                    <em>Right-rail content swaps with mode per §12.</em>
                </p>
                <ul class="agenda-view__rail-list">
                    <li v-if="!isInsideAgenda">VSCode-style schedule outline</li>
                    <li v-if="!isInsideAgenda">Click a line → enters #inside</li>
                    <li v-if="isInsideAgenda">Selected-line props panel</li>
                    <li v-if="isInsideAgenda">Post-it interactions</li>
                </ul>
            </div>
        </aside>
    </div>
</template>

<style scoped>
.agenda-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.25rem;
    padding: 1.25rem;
    flex: 1;
    min-height: 0;
}

.agenda-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.agenda-view__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.agenda-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.agenda-view__mode-toggle {
    display: inline-flex;
    gap: 0.25rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    padding: 0.125rem;
}

.agenda-view__mode-toggle button {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: 0.25rem;
    color: var(--color-text-muted, #6b7280);
}

.agenda-view__mode-toggle button.is-active {
    background: var(--color-primary-bg, #1f2937);
    color: var(--color-primary-contrast, #ffffff);
}

.agenda-view__line-area {
    flex: 1;
    background: var(--color-surface, #fff);
    border-radius: 0.5rem;
    overflow: hidden;
}

.agenda-view__preset-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    background: var(--color-surface-muted, #f9fafb);
    flex-wrap: wrap;
}

.agenda-view__preset-label {
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
}

.agenda-view__preset-toggle button {
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #ffffff);
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.8125rem;
}

.agenda-view__preset-toggle button.is-active {
    background: var(--color-primary-bg, #1f2937);
    color: var(--color-primary-contrast, #ffffff);
    border-color: var(--color-primary-bg, #1f2937);
}

.agenda-view__shortcode-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: 0.5rem;
    color: var(--color-text-muted, #6b7280);
}

.agenda-view__count {
    margin-left: auto;
    color: var(--color-text-muted, #9ca3af);
    font-variant-numeric: tabular-nums;
}

.agenda-view__rail {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border, #e5e7eb);
    padding-left: 1rem;
    min-height: 0;
}

.agenda-view__rail-header {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.agenda-view__rail-stub {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.agenda-view__rail-list {
    list-style: disc;
    padding-left: 1.25rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.8125rem;
}

@media (max-width: 768px) {
    .agenda-view {
        grid-template-columns: 1fr;
    }

    .agenda-view__rail {
        border-left: none;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-left: 0;
        padding-top: 1rem;
    }
}
</style>
