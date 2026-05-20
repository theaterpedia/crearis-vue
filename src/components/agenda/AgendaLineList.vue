<!--
  AgendaLineList.vue — top-level list orchestrator (cand-2-baseline Phase-A).

  Iterates day-groups, applies the density-morph at the root so the whole
  list-tree picks up the [data-density] cascade. The architectural-claim
  cand-2 ratifies: the SAME components render schule-project + initiative
  preset-instances — only the data fed in differs.

  Mock-data lives in useAgendaPreset for Phase-A. When graphql-client
  matures, this component still consumes day-groups via prop — caller
  swaps the data source without touching the row-family.
-->

<script setup lang="ts">
import AgendaDayGroup from './AgendaDayGroup.vue'
import type {
    AgendaDayGroupData,
    AgendaLineData,
    AgendaLineTrioCounts,
} from '@/composables/useAgendaPreset'

const props = withDefaults(
    defineProps<{
        dayGroups: AgendaDayGroupData[]
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
    <div class="agenda-line-list" :data-density="density">
        <p v-if="props.dayGroups.length === 0" class="agenda-line-list__empty">
            Keine Termine
        </p>
        <AgendaDayGroup v-for="group in props.dayGroups" :key="group.date"
            :group="group"
            :show-shortcode="props.showShortcode"
            :density="props.density"
            @line-click="emit('line-click', $event)"
            @trio-click="(lane, l) => emit('trio-click', lane, l)" />
    </div>
</template>

<style scoped>
.agenda-line-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.agenda-line-list__empty {
    padding: 1rem;
    color: var(--color-text-muted, #6b7280);
    font-style: italic;
    text-align: center;
}
</style>
