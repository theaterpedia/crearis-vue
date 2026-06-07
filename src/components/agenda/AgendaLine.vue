<!--
  AgendaLine.vue — cand-2-baseline row-atom (Phase-A).

  Single agenda-row carrying the cross-NavStop-canonical anatomy:
    - left-edge-tint (3px solid · status-color · extends TopicsView-border-left-idiom)
    - optional shortcode-pill (gated on project.config.useTemplateCode — read by
      parent and passed via prop; default = no pill)
    - meta-strip (date already in day-group · time-range · location · Wer)
    - Heading (headline-overline-subline canon)
    - trio-inline-right-end (3 slots with counts · click-stub for now ·
      single-fpostit-on-click discipline per negative-spec §3.1)
    - StatusBadge slot is reserved (Phase-B integration)

  Negative-spec compliance:
    - No orbit-cloud · single-fpostit-on-click only (negative-spec §3.1)
    - Row-atom decomposition · NOT block-atom (negative-spec §3.2)
    - Push-down siblings within day-group during expand (negative-spec §3.3)
    - Left-edge-tint · NOT block-weight (negative-spec §3.4)

  Mock-level chrome only — HM CSS-polish session is separate.

  Density-morph: `[data-density]` attribute-driven CSS — NOT v-if-branching.
-->

<script setup lang="ts">
import { computed } from 'vue'
import type { AgendaLineData, AgendaLineTrioCounts } from '@/composables/useAgendaPreset'

const props = withDefaults(
    defineProps<{
        line: AgendaLineData
        /** Render shortcode-pill (gated by project.config.useTemplateCode upstream). */
        showShortcode?: boolean
        /** Density-morph hint — drives via [data-density] attribute, NOT v-if. */
        density?: 'tiny' | 'fancy'
    }>(),
    { showShortcode: false, density: 'tiny' },
)

const emit = defineEmits<{
    'trio-click': [lane: keyof AgendaLineTrioCounts, line: AgendaLineData]
    'click': [line: AgendaLineData]
}>()

/** Maps logical status → CSS-modifier class (cross-NavStop-canonical). */
const statusClass = computed(() => `status-${props.line.status}`)

const trio = computed<AgendaLineTrioCounts>(
    () => props.line.trio ?? { positive: 0, warning: 0, negative: 0 },
)

const trioLanes = computed(() => [
    { key: 'positive' as const, count: trio.value.positive, label: 'positive' },
    { key: 'warning' as const, count: trio.value.warning, label: 'warning' },
    { key: 'negative' as const, count: trio.value.negative, label: 'negative' },
])

function onTrio(lane: keyof AgendaLineTrioCounts) {
    emit('trio-click', lane, props.line)
}
</script>

<template>
    <div class="agenda-line" :class="statusClass" :data-density="density"
        :data-line-id="line.id" @click="emit('click', line)">
        <div class="agenda-line__edge" aria-hidden="true"></div>

        <div v-if="showShortcode && line.shortcode" class="agenda-line__shortcode">
            <span class="agenda-line__shortcode-pill">{{ line.shortcode }}</span>
        </div>

        <div class="agenda-line__body">
            <div v-if="line.overline" class="agenda-line__overline">{{ line.overline }}</div>
            <div class="agenda-line__headline">{{ line.headline }}</div>
            <div class="agenda-line__meta">
                <span class="agenda-line__time">{{ line.timeRange }}</span>
                <span v-if="line.location" class="agenda-line__location">{{ line.location }}</span>
                <span v-if="line.who" class="agenda-line__who">{{ line.who }}</span>
            </div>
        </div>

        <div class="agenda-line__trio" role="group" aria-label="Post-its-trio">
            <button v-for="lane in trioLanes" :key="lane.key" type="button"
                class="agenda-line__trio-slot" :class="`agenda-line__trio-slot--${lane.key}`"
                :title="`${lane.label} post-its: ${lane.count}`"
                :aria-label="`${lane.label} ${lane.count}`" @click.stop="onTrio(lane.key)">
                <span class="agenda-line__trio-dot"></span>
                <span v-if="lane.count > 0" class="agenda-line__trio-count">{{ lane.count }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.agenda-line {
    --status-color: var(--color-text-muted, #9ca3af);
    display: grid;
    grid-template-columns: 4px auto 1fr auto;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem 0.5rem 0;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    cursor: pointer;
    transition: background 120ms ease;
}

.agenda-line:hover {
    background: var(--color-surface-muted, #f9fafb);
}

.agenda-line__edge {
    background: var(--status-color);
    width: 3px;
}

.agenda-line.status-active {
    --status-color: var(--color-positive-bg, #16a34a);
}

.agenda-line.status-confirmed {
    --status-color: var(--color-positive-bg, #16a34a);
}

.agenda-line.status-planned {
    --status-color: var(--color-text-muted, #9ca3af);
}

.agenda-line.status-cancelled {
    --status-color: var(--color-negative-bg, #dc2626);
}

.agenda-line.status-documented {
    --status-color: var(--color-text-muted, #6b7280);
    opacity: 0.75;
}

.agenda-line__shortcode {
    display: flex;
    align-items: center;
}

.agenda-line__shortcode-pill {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    background: var(--color-surface-muted, #f3f4f6);
    color: var(--color-text, #111827);
    border-radius: 0.25rem;
    font-variant-numeric: tabular-nums;
}

.agenda-line__body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
}

.agenda-line__overline {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.agenda-line__headline {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-text, #111827);
    line-height: 1.3;
}

.agenda-line__meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted, #6b7280);
    flex-wrap: wrap;
}

.agenda-line__time {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    color: var(--color-text, #111827);
}

.agenda-line__trio {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    align-self: center;
}

.agenda-line__trio-slot {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.125rem 0.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background 120ms ease;
}

.agenda-line__trio-slot:hover {
    background: var(--color-surface-hover, #e5e7eb);
}

.agenda-line__trio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.agenda-line__trio-slot--positive .agenda-line__trio-dot {
    background: #16a34a;
}

.agenda-line__trio-slot--warning .agenda-line__trio-dot {
    background: #eab308;
}

.agenda-line__trio-slot--negative .agenda-line__trio-dot {
    background: #dc2626;
}

.agenda-line__trio-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    font-variant-numeric: tabular-nums;
}

/* Density-morph — fancy mode adds vertical breathing room + larger headline.
   Driven by attribute-selector, NOT v-if branching (negative-spec discipline). */
.agenda-line[data-density="fancy"] {
    padding: 0.875rem 1rem 0.875rem 0;
}

.agenda-line[data-density="fancy"] .agenda-line__headline {
    font-size: 1.0625rem;
}

.agenda-line[data-density="fancy"] .agenda-line__body {
    gap: 0.25rem;
}
</style>
