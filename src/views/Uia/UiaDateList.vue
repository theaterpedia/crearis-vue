<!--
  UiaDateList · the run of dated beats. `shape: list` · taxonomy Veranstaltungen.

  ── Scope, after §agenda-shape was revised ────────────────────────────────────
  The *agenda rows* — the things a visitor can act on — are `ItemList :items` fed
  from `content/agenda.ts` → `agendaItems`. That is theaterpedia's own row
  rendering, reused, not rebuilt; see ./uiaItems.ts.

  This component keeps only the job ItemList does not do: rendering `live.dates`
  — the 15 Mittwochs of one project — as a compact run, with each date carrying
  its own §4 status. Feeding 15 near-identical rows through ItemList would say
  "15 separate things you can book" when the truth is one project across 15
  Wednesdays, and ItemList has no status field to hang „findet statt" on.

  ── §4 · taxonomy vs status, kept apart by form ──────────────────────────────
  taxonomy (Veranstaltungen · red) → the rules between rows. Chrome.
  status → a dot plus its word, on the date field ONLY. Never the whole row.
  Statuses come from `deriveStatus`, which reads the file's dates and nothing
  else — see ./uiaDates.ts for why only two of §4's four states can appear.

  FILE-BACKED throughout: uia deploys as its own pm2 process, no DB (§2).
-->

<template>
    <ol class="uia-datelist" :style="vars">
        <li v-for="row in rows" :key="row.date" class="uia-datelist-row"
            :class="{ 'uia-datelist-row-past': row.status === 'abgeschlossen' }">
            <p class="uia-datelist-dateline">
                <span class="uia-datelist-date">{{ row.day }}</span>
                <span v-if="time" class="uia-datelist-time">{{ time }}</span>
            </p>

            <!-- status · the ONE coloured field (bahn-grammar) -->
            <p class="uia-datelist-status" :style="{ '--uia-status-bg': `var(--color-${row.token}-bg)` }">
                <span class="uia-datelist-status-dot" aria-hidden="true" />
                <span class="uia-datelist-status-label">{{ row.label }}</span>
            </p>
        </li>
    </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { taxonomyVars } from './uiaTaxonomy'
import { UIA_STATUS, deriveStatus, formatUiaDay } from './uiaDates'

const props = defineProps<{
    /** `DD.MM.YY` strings, straight out of `content/agenda.ts` → `live.dates`. */
    dates: ReadonlyArray<string>
    /** The shared time-of-day, as the flyer prints it. */
    time?: string
}>()

/** Chrome: Veranstaltungen is red, always — this list is the red taxonomy. */
const vars = computed(() => taxonomyVars('veranstaltungen'))

const rows = computed(() =>
    props.dates.map((date: string) => {
        const status = deriveStatus(date)
        return {
            date,
            day: formatUiaDay(date),
            status,
            label: UIA_STATUS[status].label,
            token: UIA_STATUS[status].token,
        }
    }),
)
</script>

<style scoped>
.uia-datelist {
    margin: 0;
    padding: 0;
    list-style: none;
}

.uia-datelist-row {
    display: flex;
    gap: 0.9rem;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.45rem 0;
    /* Solid rule = row separator. Dotted rules are reserved for taxonomy bands. */
    border-bottom: 2px solid var(--uia-taxonomy-bg);
}

/* A finished beat recedes; it does not turn red. §4: „grün abgeschlossen". */
.uia-datelist-row-past {
    opacity: 0.62;
}

.uia-datelist-dateline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 300;
    line-height: 1.3;
    color: var(--color-muted-contrast);
}

.uia-datelist-date {
    font-weight: 700;
    color: var(--color-contrast);
}

/* ==Status== · one field, coloured. Dot AND word, so the signal is never
   carried by colour alone. */
.uia-datelist-status {
    display: flex;
    flex: 0 0 auto;
    gap: 0.35rem;
    align-items: center;
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--uia-status-bg);
}

.uia-datelist-status-dot {
    flex: 0 0 auto;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--uia-status-bg);
}

.uia-datelist-status-label {
    font-weight: 700;
    white-space: nowrap;
}
</style>
