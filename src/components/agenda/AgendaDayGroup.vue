<!--
  AgendaDayGroup.vue — wraps a single day's lines (cand-2-baseline Phase-A).

  Day-header + list of AgendaLines. The day-group is the cluster-mechanism
  Cand-2 uses INSTEAD of block-panels (negative-spec §3.2: row-atom NOT
  block-atom). Expansion of a row pushes siblings down WITHIN this group
  (negative-spec §3.3 expansion-acceptable-trade-off).

  Density-morph propagates through `data-density` on the wrapping element
  so child AgendaLines pick up the same density via attribute-selector
  cascading.
-->

<script setup lang="ts">
import AgendaLine from './AgendaLine.vue'
import type {
    AgendaDayGroupData,
    AgendaLineData,
    AgendaLineTrioCounts,
} from '@/composables/useAgendaPreset'

const props = withDefaults(
    defineProps<{
        group: AgendaDayGroupData
        showShortcode?: boolean
        density?: 'tiny' | 'fancy'
    }>(),
    { showShortcode: false, density: 'tiny' },
)

const emit = defineEmits<{
    'trio-click': [lane: keyof AgendaLineTrioCounts, line: AgendaLineData]
    'line-click': [line: AgendaLineData]
}>()
</script>

<template>
    <section class="agenda-day-group" :data-density="density"
        :data-day="group.date" :aria-labelledby="`day-${group.date}`">
        <header class="agenda-day-group__header">
            <h3 :id="`day-${group.date}`" class="agenda-day-group__label">{{ group.label }}</h3>
            <span class="agenda-day-group__count" :aria-label="`${group.lines.length} entries`">
                {{ group.lines.length }}
            </span>
        </header>

        <div class="agenda-day-group__lines">
            <AgendaLine v-for="line in group.lines" :key="line.id"
                :line="line"
                :show-shortcode="props.showShortcode"
                :density="props.density"
                @click="emit('line-click', $event)"
                @trio-click="(lane, l) => emit('trio-click', lane, l)" />
        </div>
    </section>
</template>

<style scoped>
.agenda-day-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.agenda-day-group__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-border, #e5e7eb);
    background: var(--color-surface-muted, #f9fafb);
}

.agenda-day-group__label {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.agenda-day-group__count {
    font-size: 0.75rem;
    color: var(--color-text-muted, #9ca3af);
    font-variant-numeric: tabular-nums;
}

.agenda-day-group__lines {
    display: flex;
    flex-direction: column;
}

/* Density-morph at group-level — children inherit via attribute cascade. */
.agenda-day-group[data-density="fancy"] .agenda-day-group__header {
    padding: 0.75rem 1rem;
}
</style>
