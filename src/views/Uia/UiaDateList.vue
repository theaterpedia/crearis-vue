<!--
  UiaDateList · the agenda, rendered from `content/agenda.ts`.

  FILE-BACKED, not DB-backed (§agenda-shape, corrected 2026-07-27 after HP): uia
  deploys as its own pm2 process like magnifica — no database, no domaincodes. So
  no `pList entity="events"` anywhere near this; it would query a DB that isn't
  there and render an empty column forever. `content/agenda.ts` IS the database.

  ── Two variants, because the prompt cites two row-shapes ────────────────────
  §5 names the theaterpedia teaser row (thumbnail + corner-triangle + overline
  date-line + bold headline, `UI_theaterpedia_homepage.png`). §4 names the
  Veranstaltungen row-list (title left · date right · grey subline · rules,
  `UI_community_3colors_3taxonomies_3shapes.png`). Both are real and they are
  different jobs, so both ship from one component:

    variant="teaser"  → the landing's „nächste Termine" (3 rows, thumbnails)
    variant="compact" → the agenda page's full run (15 Mittwochs, rules)

  ── §4 · taxonomy vs status, kept apart by form ──────────────────────────────
  taxonomy (Veranstaltungen · red) → the corner-triangle and the row rules. Chrome.
  status → a dot plus its word, on the date field ONLY. Never the whole row.
  Statuses come from `deriveStatus`, which reads the file's dates and nothing
  else — see `./uiaDates.ts` for why only two of the four states can appear.
-->

<template>
    <div class="uia-datelist" :class="`uia-datelist-${variant}`" :style="vars">
        <ol class="uia-datelist-rows">
            <li v-for="row in rows" :key="row.date" class="uia-datelist-row"
                :class="{ 'uia-datelist-row-past': row.status === 'abgeschlossen' }">
                <!-- teaser · thumbnail with the taxonomy corner-triangle -->
                <div v-if="variant === 'teaser'" class="uia-datelist-thumb">
                    <UiaImage :src="image" :alt="imageAlt ?? title" :focal="focal" ratio="square" />
                    <span class="uia-datelist-corner" aria-hidden="true" />
                </div>

                <div class="uia-datelist-body">
                    <p class="uia-datelist-dateline">
                        <span class="uia-datelist-date">{{ row.day }}</span>
                        <span v-if="time" class="uia-datelist-time">{{ time }}</span>
                    </p>
                    <p class="uia-datelist-title">{{ title }}</p>
                    <p v-if="subline" class="uia-datelist-subline">{{ subline }}</p>
                </div>

                <!-- status · the ONE coloured field (bahn-grammar) -->
                <p class="uia-datelist-status" :style="{ '--uia-status-bg': `var(--color-${row.token}-bg)` }">
                    <span class="uia-datelist-status-dot" aria-hidden="true" />
                    <span class="uia-datelist-status-label">{{ row.label }}</span>
                </p>
            </li>
        </ol>

        <slot name="tail" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiaImage from './UiaImage.vue'
import { taxonomyVars } from './uiaTaxonomy'
import { UIA_STATUS, deriveStatus, formatUiaDay, nextUp } from './uiaDates'

const props = withDefaults(
    defineProps<{
        /** `DD.MM.YY` strings, straight out of `content/agenda.ts` → `live.dates`. */
        dates: ReadonlyArray<string>
        /** The project every one of these dates belongs to. */
        title: string
        /** Grey subline under the title — time-and-place, the owners' wording. */
        subline?: string
        /** Rendered alongside the date, as on the flyer. */
        time?: string
        variant?: 'teaser' | 'compact'
        /**
         * Show only the next N upcoming dates (the landing's `agendaTeaser.limit`).
         * Omit to render every date in the file.
         */
        limit?: number
        image?: string
        imageAlt?: string
        focal?: string
    }>(),
    { variant: 'compact', focal: 'center' },
)

/** Chrome: Veranstaltungen is red, always — this list is the red taxonomy. */
const vars = computed(() => taxonomyVars('veranstaltungen'))

const rows = computed(() => {
    const dates: string[] = props.limit ? nextUp(props.dates, props.limit) : [...props.dates]
    return dates.map((date: string) => {
        const status = deriveStatus(date)
        return {
            date,
            day: formatUiaDay(date),
            status,
            label: UIA_STATUS[status].label,
            token: UIA_STATUS[status].token,
        }
    })
})
</script>

<style scoped>
.uia-datelist-rows {
    margin: 0;
    padding: 0;
    list-style: none;
}

.uia-datelist-row {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
    padding: 0.6rem 0;
    /* Solid rule = row separator. Dotted rules are reserved for taxonomy bands. */
    border-bottom: 2px solid var(--uia-taxonomy-bg);
}

/* A finished beat recedes; it does not turn red. §4: „grün abgeschlossen". */
.uia-datelist-row-past {
    opacity: 0.62;
}

.uia-datelist-body {
    flex: 1 1 auto;
    min-width: 0;
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

.uia-datelist-title {
    margin: 0.1rem 0 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
}

.uia-datelist-subline {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    line-height: 1.4;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--color-muted-contrast);
}

/* ==Status== · one field, coloured. Dot AND word, so the signal is never
   carried by colour alone. */
.uia-datelist-status {
    display: flex;
    flex: 0 0 auto;
    gap: 0.35rem;
    align-items: baseline;
    margin: 0;
    padding-top: 0.15rem;
    font-size: 0.75rem;
    line-height: 1.3;
    color: var(--uia-status-bg);
}

.uia-datelist-status-dot {
    flex: 0 0 auto;
    align-self: center;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--uia-status-bg);
}

.uia-datelist-status-label {
    font-weight: 700;
    white-space: nowrap;
}

/* ==Teaser variant== · thumbnail with the taxonomy corner-triangle */
.uia-datelist-thumb {
    position: relative;
    flex: 0 0 auto;
    width: 4.5rem;
}

.uia-datelist-corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-top: 1.1rem solid var(--uia-taxonomy-bg);
    border-left: 1.1rem solid transparent;
}

/* Compact variant carries no thumbnails · the rules do the work. */
.uia-datelist-compact .uia-datelist-title {
    font-size: 1.0625rem;
}

@media (max-width: 640px) {
    .uia-datelist-row {
        flex-wrap: wrap;
    }

    .uia-datelist-status {
        flex-basis: 100%;
        padding-top: 0.3rem;
    }
}
</style>
