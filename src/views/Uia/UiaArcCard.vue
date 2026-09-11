<!--
  UiaArcCard · one turn of the arc, closed.

  `shape: cards` · taxonomy Veranstaltungen (red frame = chrome). Used by the
  landing's `pastArcs` and the agenda page's `closedArcs`.

  ── Status: green, and that is the whole point ────────────────────────────────
  A finished project is `grün abgeschlossen`, never red (§status-colour). The red
  here is *taxonomy* — these are Veranstaltungen — and it sits on the frame only.
  The green sits on the status field only. Same three hues, two jobs, kept apart
  by form.

  The structural finding these cards render (`content/agenda.ts` header): uia's
  agenda is not a calendar, it is a repeating arc — Aufruf + Schwelle → N
  Mittwochs → öffentliche Aufführung → (sometimes) out onto the Demos. The
  `performance` line is that last public beat, so it gets its own emphasis rather
  than being folded into the body prose.
-->

<template>
    <article class="uia-arc" :style="vars">
        <UiaImage :src="image" :alt="imageAlt" :focal="focal" ratio="wide" framed />

        <div class="uia-arc-body">
            <p class="uia-arc-overline">{{ overline }}</p>
            <h3 class="uia-arc-headline">{{ headline }}</h3>
            <p v-if="subline" class="uia-arc-subline">{{ subline }}</p>

            <p class="uia-arc-status">
                <span class="uia-arc-status-dot" aria-hidden="true" />
                <span class="uia-arc-status-label">{{ statusLabel }}</span>
            </p>

            <p class="uia-arc-prose">{{ body }}</p>

            <p v-if="performance" class="uia-arc-performance">{{ performance }}</p>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiaImage from './UiaImage.vue'
import { taxonomyVars } from './uiaTaxonomy'
import { UIA_STATUS } from './uiaDates'

withDefaults(
    defineProps<{
        overline: string
        headline: string
        subline?: string
        body: string
        /** The public beat that closed this arc. */
        performance?: string
        image?: string
        imageAlt: string
        focal?: string
    }>(),
    { focal: 'center' },
)

const vars = computed(() => ({
    ...taxonomyVars('veranstaltungen'),
    '--uia-status-bg': `var(--color-${UIA_STATUS.abgeschlossen.token}-bg)`,
}))

const statusLabel = UIA_STATUS.abgeschlossen.label
</script>

<style scoped>
.uia-arc {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-card-bg);
    color: var(--color-card-contrast);
}

.uia-arc-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    padding: 0.9rem 1rem 1.1rem;
}

.uia-arc-overline {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 300;
    line-height: 1.35;
    color: var(--color-muted-contrast);
}

.uia-arc-headline {
    margin: 0.2rem 0 0;
    font-size: clamp(1.125rem, 2vw, 1.375rem);
    font-weight: 700;
    line-height: 1.2;
}

.uia-arc-subline {
    margin: 0.2rem 0 0;
    font-size: 0.875rem;
    font-weight: 300;
    line-height: 1.35;
    color: var(--color-muted-contrast);
}

/* ==Status== · one field. Green, because „abgeschlossen" is not an error. */
.uia-arc-status {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    margin: 0.6rem 0 0;
    font-size: 0.75rem;
    color: var(--uia-status-bg);
}

.uia-arc-status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--uia-status-bg);
}

.uia-arc-status-label {
    font-weight: 700;
}

.uia-arc-prose {
    margin: 0.7rem 0 0;
    font-size: 0.9375rem;
    line-height: 1.55;
}

.uia-arc-performance {
    margin: 0.8rem 0 0;
    padding-top: 0.7rem;
    border-top: 2px dotted var(--uia-taxonomy-bg);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.5;
}
</style>
